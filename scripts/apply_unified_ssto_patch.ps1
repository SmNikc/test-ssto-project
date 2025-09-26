# Apply unified SSTO patch without git/diff quirks.
# Run from project root: C:\Projects\test-ssto-project

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# ---- helpers ---------------------------------------------------------------
function New-Dir([string]$Path) {
  if (!(Test-Path -LiteralPath $Path)) { New-Item -ItemType Directory -Path $Path | Out-Null }
}
function Backup-IfExists([string]$Path, [string]$BackupRoot) {
  if (Test-Path -LiteralPath $Path) {
    $rel = Resolve-Path $Path | Split-Path -NoQualifier
    $dest = Join-Path $BackupRoot $rel
    New-Dir (Split-Path $dest)
    Copy-Item -LiteralPath $Path -Destination $dest -Recurse -Force
  }
}
function Save-Text([string]$Path, [string]$Content, [string]$BackupRoot) {
  New-Dir (Split-Path $Path)
  Backup-IfExists $Path $BackupRoot
  # UTF-8 без BOM
  $utf8NoBom = New-Object System.Text.UTF8Encoding($false)
  [System.IO.File]::WriteAllText($Path, $Content, $utf8NoBom)
}
function Remove-Item-Safe([string]$Path, [string]$BackupRoot) {
  if (Test-Path -LiteralPath $Path) {
    Backup-IfExists $Path $BackupRoot
    Remove-Item -LiteralPath $Path -Recurse -Force
  }
}

# ---- paths -----------------------------------------------------------------
$Root = Get-Location
$BackupRoot = Join-Path $Root ("backup-" + (Get-Date -Format "yyyyMMdd-HHmmss"))
New-Dir $BackupRoot

# ---- FRONTEND: files -------------------------------------------------------

$AuthContext = @'
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

/**
 * ЕДИНЫЙ ПУТЬ ДЛЯ API:
 * - Всегда ходим на относительный префикс "/api" (без localhost/портов)
 * - В dev проксирует Vite (vite.config.ts), в Docker — Nginx (nginx.conf)
 */
const API_PREFIX = '/api';
const api = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith('/api') ? p : `${API_PREFIX}${p}`;
};

interface User {
  id: number;
  email: string;
  role: 'operator' | 'client' | 'admin';
  organization_name: string;
  full_name: string;
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  checkAuth: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/** Декод JWT с поддержкой UTF‑8 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
};

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser]         = useState<User | null>(null);
  const [loading, setLoading]   = useState<boolean>(true);
  const [error, setError]       = useState<string | null>(null);

  /** ЛОГИН: POST /api/auth/login → сохранить токены → роль → редирект /{role} */
  const login = async (email: string, password: string) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data?.message || 'Ошибка авторизации');
      }

      const token        = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;
      if (!token) throw new Error('Токен не получен от сервера');

      sessionStorage.setItem('token', token);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);

      const payload = decodeJWT(token);
      if (!payload) throw new Error('Ошибка декодирования токена');

      let userRole: 'operator' | 'client' | 'admin' = 'client';
      if (payload.realm_access?.roles) {
        if (payload.realm_access.roles.includes('admin')) userRole = 'admin';
        else if (payload.realm_access.roles.includes('operator')) userRole = 'operator';
        else if (payload.realm_access.roles.includes('client')) userRole = 'client';
      } else if (payload.role && ['operator', 'client', 'admin'].includes(payload.role)) {
        userRole = payload.role;
      }

      const userData: User = {
        id: payload.sub ? parseInt(String(payload.sub), 10) || 1 : 1,
        email: payload.email || payload.preferred_username || email,
        role: userRole,
        organization_name: payload.organization_name || '',
        full_name: payload.name || payload.full_name || email,
      };

      setUser(userData);

      setTimeout(() => {
        window.location.href = `/${userRole}`;
      }, 100);
    } catch (err: any) {
      setError(err?.message || 'Ошибка авторизации');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  /** ЛОГАУТ: POST /api/auth/logout → чистка → /login */
  const logout = async () => {
    const refreshToken = sessionStorage.getItem('refreshToken');

    if (refreshToken) {
      try {
        await fetch(api('/auth/logout'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ refreshToken }),
        });
      } catch (err) {
        console.error('Logout error:', err);
      }
    }

    sessionStorage.removeItem('token');
    sessionStorage.removeItem('refreshToken');
    setUser(null);
    window.location.href = '/login';
  };

  /** ПРОВЕРКА СЕССИИ: валидность JWT (exp), при необходимости — refresh */
  const checkAuth = async () => {
    const token = sessionStorage.getItem('token');
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      const payload = decodeJWT(token);
      if (!payload) throw new Error('Невалидный токен');

      if (payload.exp && payload.exp * 1000 < Date.now()) {
        await refreshToken();
        return;
      }

      let userRole: 'operator' | 'client' | 'admin' = 'client';
      if (payload.realm_access?.roles) {
        if (payload.realm_access.roles.includes('admin')) userRole = 'admin';
        else if (payload.realm_access.roles.includes('operator')) userRole = 'operator';
        else if (payload.realm_access.roles.includes('client')) userRole = 'client';
      } else if (payload.role && ['operator', 'client', 'admin'].includes(payload.role)) {
        userRole = payload.role;
      }

      const userData: User = {
        id: payload.sub ? parseInt(String(payload.sub), 10) || 1 : 1,
        email: payload.email || payload.preferred_username || '',
        role: userRole,
        organization_name: payload.organization_name || '',
        full_name: payload.name || '',
      };

      setUser(userData);
    } catch (err) {
      console.error('Auth check error:', err);
      sessionStorage.removeItem('token');
      sessionStorage.removeItem('refreshToken');
    } finally {
      setLoading(false);
    }
  };

  /** REFRESH: POST /api/auth/refresh → новая пара токенов → checkAuth() */
  const refreshToken = async () => {
    const refreshTokenValue = sessionStorage.getItem('refreshToken');
    if (!refreshTokenValue) {
      await logout();
      return;
    }

    try {
      const response = await fetch(api('/auth/refresh'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refreshToken: refreshTokenValue }),
      });

      if (!response.ok) {
        throw new Error('Failed to refresh token');
      }

      const data = await response.json();
      const newToken        = data.accessToken || data.access_token;
      const newRefreshToken = data.refreshToken || data.refresh_token;

      if (!newToken) throw new Error('No access token on refresh');

      sessionStorage.setItem('token', newToken);
      if (newRefreshToken) sessionStorage.setItem('refreshToken', newRefreshToken);

      await checkAuth();
    } catch (err) {
      console.error('Token refresh error:', err);
      await logout();
    }
  };

  useEffect(() => {
    checkAuth();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value: AuthContextType = {
    user,
    loading,
    error,
    login,
    logout,
    checkAuth,
    refreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within AuthProvider');
  return context;
};
'@

$AuthComponent = @'
import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  InputAdornment,
  IconButton,
} from '@mui/material';
import { Visibility, VisibilityOff } from '@mui/icons-material';

/**
 * ЕДИНЫЙ ПУТЬ ДЛЯ API:
 * - Всегда используем относительный префикс "/api" (без localhost/портов)
 * - В dev проксирует Vite (vite.config.ts), в Docker — Nginx (nginx.conf)
 */
const API_PREFIX = '/api';
const api = (path: string) => {
  const p = path.startsWith('/') ? path : `/${path}`;
  return p.startsWith('/api') ? p : `${API_PREFIX}${p}`;
};

/** Безопасное декодирование JWT с поддержкой UTF‑8 */
const decodeJWT = (token: string) => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join(''),
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    console.error('Error decoding JWT:', e);
    return null;
  }
};

type Role = 'operator' | 'client' | 'admin';

const getRoleFromPayload = (payload: any): Role => {
  if (payload?.realm_access?.roles) {
    if (payload.realm_access.roles.includes('admin')) return 'admin';
    if (payload.realm_access.roles.includes('operator')) return 'operator';
    if (payload.realm_access.roles.includes('client')) return 'client';
  }
  if (payload?.role && ['operator', 'client', 'admin'].includes(payload.role)) {
    return payload.role as Role;
  }
  return 'client';
};

const Auth: React.FC = () => {
  const [email, setEmail]                 = useState('');
  const [password, setPassword]           = useState('');
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const res = await fetch(api('/auth/login'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.message || 'Ошибка авторизации');
      }

      const token        = data.accessToken || data.access_token || data.token;
      const refreshToken = data.refreshToken || data.refresh_token;

      if (!token) {
        throw new Error('Токен не получен от сервера');
      }

      sessionStorage.setItem('token', token);
      if (refreshToken) sessionStorage.setItem('refreshToken', refreshToken);

      const payload = decodeJWT(token);
      if (!payload) throw new Error('Ошибка декодирования токена');
      const role = getRoleFromPayload(payload);

      setTimeout(() => {
        window.location.href = `/${role}`;
      }, 100);
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Ошибка авторизации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box sx={{ maxWidth: 420, mx: 'auto', mt: 8, p: 3, borderRadius: 2, boxShadow: 2, bgcolor: 'background.paper' }}>
      <Typography variant="h5" align="center" gutterBottom>
        Вход в систему
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <form onSubmit={handleSubmit} noValidate>
        <TextField
          label="Email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="username"
          required
        />

        <TextField
          label="Пароль"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          fullWidth
          margin="normal"
          autoComplete="current-password"
          required
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={showPassword ? 'Скрыть пароль' : 'Показать пароль'}
                  onClick={() => setShowPassword((v) => !v)}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            ),
          }}
        />

        <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 2 }}>
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={loading}
          >
            Войти
          </Button>
          {loading && <CircularProgress size={24} />}
        </Box>
      </form>
    </Box>
  );
};

export default Auth;
'@

$ViteConfig = @'
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
        secure: false,
      },
    },
  },
});
'@

$NginxConf = @'
server {
    listen 80;
    server_name localhost;

    root /usr/share/nginx/html;
    index index.html;

    # SPA маршруты
    location / {
        try_files $uri /index.html;
    }

    # API → NestJS backend (сервис "backend" в docker-compose)
    location /api {
        proxy_pass http://backend:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
'@

$FrontendDockerfile = @'
# ---------- build ----------
FROM node:18-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

# ---------- runtime ----------
FROM nginx:1.25-alpine
WORKDIR /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist ./
EXPOSE 80
'@

# ---- BACKEND: files --------------------------------------------------------

$SignalModel = @'
import {
  Table,
  Column,
  Model,
  DataType,
  CreatedAt,
  UpdatedAt,
} from 'sequelize-typescript';

@Table({
  tableName: 'signals',
  timestamps: true,
  underscored: true,
})
export default class Signal extends Model {
  @Column({
    type: DataType.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  })
  id!: number;

  @Column({
    type: DataType.STRING(50),
    allowNull: true,
  })
  terminal_number!: string | null;

  @Column({
    type: DataType.STRING(9),
    allowNull: false,
  })
  mmsi!: string;

  @Column({
    type: DataType.STRING(20),
    allowNull: true,
  })
  call_sign!: string | null;

  // <— ДОБАВЛЕНО: используется сервисами/отчётами
  @Column({
    type: DataType.STRING,
    allowNull: true,
  })
  vessel_name!: string | null;

  @Column({
    type: DataType.STRING,
    defaultValue: 'TEST',
  })
  signal_type!: string;

  @Column({
    type: DataType.DATE,
    allowNull: false,
    defaultValue: DataType.NOW,
  })
  received_at!: Date;

  @Column({
    type: DataType.DATE,
    allowNull: true,
  })
  detection_time!: Date | null;

  @Column({
    type: DataType.STRING,
    defaultValue: 'UNMATCHED',
  })
  status!: string;

  @Column({
    type: DataType.INTEGER,
    allowNull: true,
  })
  request_id!: number | null;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  coordinates!: any;

  @Column({
    type: DataType.JSONB,
    allowNull: true,
  })
  metadata!: any;

  @CreatedAt
  @Column({ type: DataType.DATE })
  created_at!: Date;

  @UpdatedAt
  @Column({ type: DataType.DATE })
  updated_at!: Date;
}
'@

$ReportService = @'
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import Signal from '../models/signal.model';

@Injectable()
export class ReportService {
  private ensureReportsDirectory(): string {
    const reportsDir = path.join(__dirname, '../../uploads/reports');
    if (!fs.existsSync(reportsDir)) {
      fs.mkdirSync(reportsDir, { recursive: true });
    }
    return reportsDir;
  }

  /** Подтверждение тестового оповещения по заявке (полная «шапка»/подпись) */
  async generateTestConfirmation(request: any, signal: any): Promise<string> {
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const fileName = `confirmation_${request.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);
    doc.pipe(fs.createWriteStream(filePath));

    // Шапка и реквизиты (как в ваших патчах; не урезано)
    doc.fontSize(10).font('Times-Roman');
    doc.text('МИНТРАНС РОССИИ', 50, 50);
    doc.text('РОСМОРРЕЧФЛОТ', 50, 65);
    doc.fontSize(9);
    doc.text('ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ', 50, 85);
    doc.text('БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ', 50, 100);
    doc.text('«МОРСКАЯ СПАСАТЕЛЬНАЯ СЛУЖБА»', 50, 115);
    doc.text('(ФГБУ «МОРСПАССЛУЖБА»)', 50, 130);
    doc.fontSize(12).text('Главный морской', 350, 50);
    doc.text('спасательно-', 350, 65);
    doc.text('координационный центр', 350, 80);
    doc.text('(ГМСКЦ)', 350, 95);
    doc.fontSize(8);
    doc.text('ул. Петровка д. 3/6 стр. 2, г Москва, 125993', 50, 150);
    doc.text('тел.: (495) 626-18-08', 50, 165);
    doc.text('info@morspas.ru, www.morspas.ru', 50, 180);
    doc.text('ОКПО 18685292, ОГРН 1027739737321', 50, 195);
    doc.text('ИНН/КПП 7707274249/770701001', 50, 210);

    // Тело документа
    doc.moveDown().fontSize(12).text('Подтверждение тестового оповещения', { align: 'center' });
    doc.moveDown().fontSize(10);
    doc.text(`Заявка №: ${request?.id ?? '—'}`);
    doc.text(`Судно: ${signal?.vessel_name ?? '—'}`);
    doc.text(`MMSI: ${signal?.mmsi ?? '—'}`);
    doc.text(`Тип сигнала: ${signal?.signal_type ?? '—'}`);
    doc.text(`Время получения: ${signal?.received_at ? new Date(signal.received_at).toLocaleString('ru-RU') : '—'}`);

    // Подпись/контакты
    doc.fontSize(9);
    doc.text('Федеральное государственное бюджетное', 50, 520);
    doc.text('учреждение «Морская спасательная служба»', 50, 535);
    doc.text('(ФГБУ «Морспасслужба»)', 50, 550);
    doc.text('Подписано ПЭП', 50, 580);
    doc.text('Оперативный дежурный ГМСКЦ', 50, 700);
    doc.text('+7 (495) 626-10-52', 50, 715);

    doc.end();
    return filePath;
  }

  /** Универсальный отчёт по сигналу (если нет связанной заявки) */
  async generateForSignal(signal: Signal & { request?: any | null }): Promise<string> {
    const request = signal.request ?? null;
    if (request) {
      return this.generateTestConfirmation(request, signal);
    }

    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const fileName = `signal_${signal.id ?? 'x'}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);
    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text('Signal Report', { align: 'center' });
    doc.moveDown().fontSize(11);
    doc.text(`Signal ID: ${signal.id ?? '—'}`);
    doc.text(`Terminal Number: ${signal.terminal_number ?? '—'}`);
    doc.text(`Vessel Name: ${signal.vessel_name ?? '—'}`);
    doc.text(`MMSI: ${signal.mmsi ?? '—'}`);
    doc.text(`Signal Type: ${signal.signal_type ?? '—'}`);
    doc.text(`Status: ${signal.status ?? '—'}`);
    doc.text(`Received At: ${signal.received_at ? new Date(signal.received_at).toISOString() : '—'}`);

    if ((signal as any).coordinates) {
      doc.moveDown().text('Coordinates:');
      const lat = (signal as any).coordinates?.lat ?? '—';
      const lon = (signal as any).coordinates?.lng ?? (signal as any).coordinates?.lon ?? '—';
      doc.text(`Latitude: ${lat}`);
      doc.text(`Longitude: ${lon}`);
    }

    if ((signal as any).metadata) {
      doc.moveDown().text('Metadata:');
      try {
        doc.text(JSON.stringify((signal as any).metadata, null, 2));
      } catch {
        doc.text(String((signal as any).metadata));
      }
    }

    doc.end();
    return filePath;
  }
}
'@

$SequelizeCfg = @'
require('dotenv').config();

module.exports = {
  development: {
    username: process.env.DB_USER     || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME     || 'test_ssto',
    host:     process.env.DB_HOST     || 'localhost',
    port:     Number(process.env.DB_PORT || 5432),
    dialect:  'postgres',
    logging:  console.log,
  },
  production: {
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    host:     process.env.DB_HOST,
    port:     Number(process.env.DB_PORT || 5432),
    dialect:  'postgres',
  },
};
'@

$Migration = @'
'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    const table = 'signals';
    const column = 'vessel_name';

    const [rows] = await queryInterface.sequelize.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name='${table}' AND column_name='${column}'
    `);

    if (!rows || rows.length === 0) {
      await queryInterface.addColumn(table, column, {
        type: Sequelize.STRING,
        allowNull: true,
      });
      console.log(`[migrate] Column ${table}.${column} added`);
    } else {
      console.log(`[migrate] Column ${table}.${column} already exists — skip`);
    }
  },

  async down(queryInterface/*, Sequelize*/) {
    const table = 'signals';
    const column = 'vessel_name';
    try {
      await queryInterface.removeColumn(table, column);
      console.log(`[migrate:down] Column ${table}.${column} removed`);
    } catch (e) {
      console.warn(`[migrate:down] removeColumn skipped: ${e.message}`);
    }
  }
};
'@

$Compose = @'
services:
  postgres:
    image: postgres:14-alpine
    container_name: ssto-postgres
    environment:
      POSTGRES_DB: sstodb
      POSTGRES_USER: ssto
      POSTGRES_PASSWORD: sstopass
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U ssto -d sstodb"]
      interval: 10s
      timeout: 5s
      retries: 5
    networks: [ssto]

  backend:
    build:
      context: ./backend-nest
      dockerfile: Dockerfile
    container_name: ssto-backend
    depends_on:
      postgres:
        condition: service_healthy
    environment:
      NODE_ENV: production
      PORT: 3001
      DB_HOST: postgres
      DB_PORT: 5432
      DB_USER: ssto
      DB_PASSWORD: sstopass
      DB_NAME: sstodb
      CORS_ORIGIN: http://localhost
      KEYCLOAK_ENABLED: "false"
      # DB_BOOTSTRAP: "true"   # включайте только на один прогон для точечной правки схемы
    ports:
      - "3001:3001"
    networks: [ssto]

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: ssto-frontend
    depends_on:
      backend:
        condition: service_started
    ports:
      - "80:80"
    networks: [ssto]

networks:
  ssto: {}

volumes:
  postgres_data: {}
'@

# ---- APPLY FILES -----------------------------------------------------------

Save-Text (Join-Path $Root 'frontend\src\contexts\AuthContext.tsx')     $AuthContext      $BackupRoot
Save-Text (Join-Path $Root 'frontend\src\components\auth.component.tsx') $AuthComponent    $BackupRoot
Save-Text (Join-Path $Root 'frontend\vite.config.ts')                    $ViteConfig       $BackupRoot
Save-Text (Join-Path $Root 'frontend\nginx.conf')                        $NginxConf        $BackupRoot
Save-Text (Join-Path $Root 'frontend\Dockerfile')                        $FrontendDockerfile $BackupRoot

Save-Text (Join-Path $Root 'backend-nest\src\models\signal.model.ts')    $SignalModel      $BackupRoot
Save-Text (Join-Path $Root 'backend-nest\src\services\report.service.ts')$ReportService    $BackupRoot

Save-Text (Join-Path $Root 'backend-nest\sequelize.config.js')           $SequelizeCfg     $BackupRoot
New-Dir   (Join-Path $Root 'backend-nest\migrations')
Save-Text (Join-Path $Root 'backend-nest\migrations\20250926_add-vessel-name-to-signals.js') $Migration $BackupRoot

Save-Text (Join-Path $Root 'docker-compose.yml')                         $Compose          $BackupRoot

# ---- DELETE conflicting files ---------------------------------------------
# 1) Удалить устаревший конфиг фронта
Remove-Item-Safe (Join-Path $Root 'frontend\src\config.js') $BackupRoot

# 2) Удалить дубли nginx*.conf в frontend/, кроме frontend/nginx.conf
Get-ChildItem -Path (Join-Path $Root 'frontend') -Filter 'nginx*.conf' -Recurse |
  Where-Object { $_.FullName -ne (Join-Path $Root 'frontend\nginx.conf') } |
  ForEach-Object {
    Remove-Item-Safe $_.FullName $BackupRoot
  }

# ---- REMINDER about SignalModule providers (если вдруг не добавлено) ------
$SignalModulePath = Join-Path $Root 'backend-nest\src\signal\signal.module.ts'
if (Test-Path $SignalModulePath) {
  $text = Get-Content -Raw $SignalModulePath
  if ($text -notmatch 'ReportService') {
    Write-Warning "Файл signal.module.ts не содержит ReportService в providers[]. Добавьте:
      providers: [SignalService, PdfService, ReportService]"
  }
}

Write-Host "=== Done ===" -ForegroundColor Green
Write-Host "Резервные копии сохранены в: $BackupRoot"
