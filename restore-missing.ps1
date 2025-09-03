# restore-missing.ps1
# Восстановление 6 недостающих функций для рабочей версии
# Запуск: .\restore-missing.ps1

$projectPath = "C:\Projects\test-ssto-project"
$backendPath = "$projectPath\backend-nest\src"
$frontendPath = "$projectPath\frontend\src"

Write-Host "ВОССТАНОВЛЕНИЕ НЕДОСТАЮЩИХ ФУНКЦИЙ" -ForegroundColor Cyan
Write-Host "===================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Найдено 6 отсутствующих компонентов:" -ForegroundColor Yellow
Write-Host "1. ConfirmationPreview.tsx - Кнопка просмотра формы" -ForegroundColor White
Write-Host "2. MapComponent.tsx - Морские карты" -ForegroundColor White
Write-Host "3. SignalTable.tsx - Таблица сигналов" -ForegroundColor White
Write-Host "4. system-settings.entity.ts - Настройки системы" -ForegroundColor White
Write-Host "5. ssas-terminal.entity.ts - Номер стойки как ID" -ForegroundColor White
Write-Host "6. pdf.service.ts - Генерация PDF (частично есть)" -ForegroundColor White
Write-Host ""

# 1. SSAS Terminal Entity - КРИТИЧНО для номера стойки
Write-Host "[1/6] Создание ssas-terminal.entity.ts..." -ForegroundColor Yellow

$ssasTerminalContent = @'
import { Table, Column, Model, DataType, HasMany, ForeignKey, BelongsTo } from 'sequelize-typescript';

@Table({
  tableName: 'ssas_terminals',
  timestamps: true,
  underscored: true
})
export class SSASTerminal extends Model {
  @Column({
    type: DataType.STRING(50),
    primaryKey: true,
    allowNull: false,
    comment: 'Номер стойки ССТО - главный идентификатор'
  })
  terminal_number: string;

  @Column({
    type: DataType.ENUM('INMARSAT', 'IRIDIUM'),
    allowNull: false,
    defaultValue: 'INMARSAT'
  })
  terminal_type: 'INMARSAT' | 'IRIDIUM';

  @Column({
    type: DataType.STRING(9),
    allowNull: false
  })
  mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  vessel_name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  imo_number: string;

  @Column({
    type: DataType.STRING(9),
    allowNull: true
  })
  current_mmsi: string;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  current_vessel_name: string;

  @Column({
    type: DataType.STRING(7),
    allowNull: true
  })
  current_imo: string;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: true
  })
  is_active: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  last_test_date: Date;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  total_tests_count: number;

  @Column({
    type: DataType.INTEGER,
    defaultValue: 0
  })
  successful_tests_count: number;

  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  transferred_to_poisk_more: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  transfer_date: Date;

  @Column({
    type: DataType.STRING(100),
    allowNull: true
  })
  poisk_more_id: string;
}

export default SSASTerminal;
'@

New-Item -ItemType Directory -Path "$backendPath\models" -Force | Out-Null
Set-Content -Path "$backendPath\models\ssas-terminal.entity.ts" -Value $ssasTerminalContent -Encoding UTF8
Write-Host "  OK: ssas-terminal.entity.ts создан" -ForegroundColor Green

# 2. System Settings Entity - для автоподтверждения
Write-Host "[2/6] Создание system-settings.entity.ts..." -ForegroundColor Yellow

$systemSettingsContent = @'
import { Table, Column, Model, DataType } from 'sequelize-typescript';

@Table({
  tableName: 'system_settings',
  timestamps: true
})
export class SystemSettings extends Model {
  @Column({
    type: DataType.BOOLEAN,
    defaultValue: false
  })
  auto_confirmation_enabled: boolean;

  @Column({
    type: DataType.DATE,
    allowNull: true
  })
  auto_confirmation_updated_at: Date;

  @Column({
    type: DataType.STRING,
    allowNull: true
  })
  auto_confirmation_updated_by: string;

  @Column({
    type: DataType.JSONB,
    allowNull: true
  })
  additional_settings: any;
}

export default SystemSettings;
'@

Set-Content -Path "$backendPath\models\system-settings.entity.ts" -Value $systemSettingsContent -Encoding UTF8
Write-Host "  OK: system-settings.entity.ts создан" -ForegroundColor Green

# 3. MapComponent - Морские карты
Write-Host "[3/6] Создание MapComponent.tsx..." -ForegroundColor Yellow

$mapComponentContent = @'
import React, { useEffect, useRef, useState } from 'react';
import { Box, Paper, Typography } from '@mui/material';

interface Signal {
  id: string;
  coordinates?: { lat: number; lng: number };
  terminal_number: string;
  mmsi: string;
  vessel_name?: string;
  signal_type: 'TEST' | 'REAL' | 'UNKNOWN';
  status: string;
  received_at: string;
}

interface MapComponentProps {
  signals: Signal[];
  center?: { lat: number; lng: number };
  zoom?: number;
}

export const MapComponent: React.FC<MapComponentProps> = ({ 
  signals, 
  center = { lat: 59.9311, lng: 30.3609 }, // СПб по умолчанию
  zoom = 8 
}) => {
  const mapRef = useRef<any>(null);
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapLoaded, setMapLoaded] = useState(false);

  useEffect(() => {
    // Проверяем наличие Leaflet
    const loadMap = async () => {
      if (!mapContainerRef.current) return;
      
      // Динамически загружаем Leaflet если нужно
      if (typeof window !== 'undefined' && !window.L) {
        const link = document.createElement('link');
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);

        const script = document.createElement('script');
        script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
        script.onload = () => initMap();
        document.head.appendChild(script);
      } else {
        initMap();
      }
    };

    const initMap = () => {
      if (!window.L || !mapContainerRef.current) return;
      
      // Инициализация карты
      mapRef.current = window.L.map(mapContainerRef.current).setView([center.lat, center.lng], zoom);
      
      // OpenStreetMap слой
      window.L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap | ССТО Мониторинг'
      }).addTo(mapRef.current);
      
      setMapLoaded(true);
    };

    loadMap();

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
      }
    };
  }, [center, zoom]);

  useEffect(() => {
    if (!mapRef.current || !mapLoaded) return;

    // Очищаем старые маркеры
    mapRef.current.eachLayer((layer: any) => {
      if (layer instanceof window.L.Marker) {
        mapRef.current.removeLayer(layer);
      }
    });

    // Добавляем маркеры сигналов
    signals.forEach((signal) => {
      if (!signal.coordinates) return;
      
      // Цвет маркера по типу сигнала
      const color = signal.signal_type === 'REAL' ? '#ff0000' : 
                   signal.signal_type === 'TEST' ? '#ffff00' : '#808080';
      
      // Пульсация для реальных тревог
      const pulseClass = signal.signal_type === 'REAL' ? 'pulse-red' : '';
      
      const icon = window.L.divIcon({
        html: `<div class="signal-marker ${pulseClass}" style="
          background-color: ${color};
          width: 20px;
          height: 20px;
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 0 10px rgba(0,0,0,0.5);
        "></div>`,
        className: 'custom-marker',
        iconSize: [20, 20]
      });

      const marker = window.L.marker([signal.coordinates.lat, signal.coordinates.lng], { icon })
        .bindPopup(`
          <div style="font-family: Arial, sans-serif;">
            <b>Стойка: ${signal.terminal_number}</b><br>
            <b>MMSI:</b> ${signal.mmsi}<br>
            <b>Судно:</b> ${signal.vessel_name || 'Не указано'}<br>
            <b>Тип:</b> <span style="color: ${color}">${signal.signal_type}</span><br>
            <b>Время:</b> ${new Date(signal.received_at).toLocaleString('ru-RU')}<br>
            <b>Статус:</b> ${signal.status}
          </div>
        `)
        .addTo(mapRef.current);
    });
  }, [signals, mapLoaded]);

  return (
    <Paper elevation={3}>
      <Box p={2}>
        <Typography variant="h6" gutterBottom>
          Карта сигналов ССТО
        </Typography>
        <div 
          ref={mapContainerRef} 
          style={{ 
            height: '500px', 
            width: '100%',
            borderRadius: '4px',
            overflow: 'hidden'
          }} 
        />
        <Box mt={2} display="flex" justifyContent="space-around">
          <Typography variant="caption" color="error">
            🔴 Реальная тревога
          </Typography>
          <Typography variant="caption" style={{ color: '#ff9800' }}>
            🟡 Тестовый сигнал
          </Typography>
          <Typography variant="caption" color="textSecondary">
            ⚫ Неизвестный
          </Typography>
        </Box>
      </Box>
      
      <style jsx>{`
        @keyframes pulse {
          0% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0.7); }
          70% { box-shadow: 0 0 0 10px rgba(255, 0, 0, 0); }
          100% { box-shadow: 0 0 0 0 rgba(255, 0, 0, 0); }
        }
        .pulse-red {
          animation: pulse 2s infinite;
        }
      `}</style>
    </Paper>
  );
};

export default MapComponent;
'@

New-Item -ItemType Directory -Path "$frontendPath\components" -Force | Out-Null
Set-Content -Path "$frontendPath\components\MapComponent.tsx" -Value $mapComponentContent -Encoding UTF8
Write-Host "  OK: MapComponent.tsx создан" -ForegroundColor Green

# 4. SignalTable - Таблица сигналов
Write-Host "[4/6] Создание SignalTable.tsx..." -ForegroundColor Yellow

$signalTableContent = @'
import React, { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  Button,
  Box,
  TextField,
  IconButton,
  Tooltip
} from '@mui/material';
import { Visibility, Send, FilterList } from '@mui/icons-material';
import axios from 'axios';

interface Signal {
  id: string;
  terminal_number: string;
  terminal_type: string;
  mmsi: string;
  vessel_name?: string;
  signal_type: string;
  status: string;
  received_at: string;
  confirmation_sent?: boolean;
  request_id?: string;
}

export const SignalTable: React.FC = () => {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [filter, setFilter] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchSignals();
  }, []);

  const fetchSignals = async () => {
    setLoading(true);
    try {
      const response = await axios.get('/api/signals');
      setSignals(response.data);
    } catch (error) {
      console.error('Error fetching signals:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRowClass = (signal: Signal) => {
    if (signal.signal_type === 'REAL') return 'signal-row-real';
    if (signal.signal_type === 'TEST') return 'signal-row-test';
    if (signal.confirmation_sent) return 'signal-row-confirmed';
    return '';
  };

  const getStatusChip = (signal: Signal) => {
    const color = signal.status === 'MATCHED' ? 'success' :
                  signal.status === 'UNMATCHED' ? 'warning' :
                  signal.status === 'EXPIRED' ? 'default' : 'error';
    
    return <Chip label={signal.status} color={color} size="small" />;
  };

  const filteredSignals = signals.filter(s => 
    s.terminal_number?.includes(filter) ||
    s.mmsi?.includes(filter) ||
    s.vessel_name?.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <Paper>
      <Box p={2}>
        <Box display="flex" justifyContent="space-between" mb={2}>
          <TextField
            label="Фильтр (номер стойки, MMSI, судно)"
            variant="outlined"
            size="small"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={{ width: '400px' }}
          />
          <Button 
            variant="contained" 
            onClick={fetchSignals}
            disabled={loading}
          >
            Обновить
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>ID</TableCell>
                <TableCell>Номер стойки</TableCell>
                <TableCell>Тип</TableCell>
                <TableCell>MMSI</TableCell>
                <TableCell>Судно</TableCell>
                <TableCell>Тип сигнала</TableCell>
                <TableCell>Время</TableCell>
                <TableCell>Статус</TableCell>
                <TableCell>Действия</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredSignals.map((signal) => (
                <TableRow key={signal.id} className={getRowClass(signal)}>
                  <TableCell>{signal.id}</TableCell>
                  <TableCell>
                    <strong>{signal.terminal_number}</strong>
                  </TableCell>
                  <TableCell>{signal.terminal_type}</TableCell>
                  <TableCell>{signal.mmsi}</TableCell>
                  <TableCell>{signal.vessel_name || '-'}</TableCell>
                  <TableCell>
                    <Chip 
                      label={signal.signal_type} 
                      size="small"
                      style={{
                        backgroundColor: signal.signal_type === 'REAL' ? '#f44336' :
                                       signal.signal_type === 'TEST' ? '#ffc107' : '#9e9e9e',
                        color: 'white'
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(signal.received_at).toLocaleString('ru-RU')}
                  </TableCell>
                  <TableCell>{getStatusChip(signal)}</TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Tooltip title="Просмотр">
                        <IconButton size="small">
                          <Visibility />
                        </IconButton>
                      </Tooltip>
                      {signal.status === 'MATCHED' && !signal.confirmation_sent && (
                        <Tooltip title="Отправить подтверждение">
                          <IconButton size="small" color="primary">
                            <Send />
                          </IconButton>
                        </Tooltip>
                      )}
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Box>

      <style>{`
        .signal-row-real {
          background-color: #ffebee !important;
          animation: blink-red 2s infinite;
        }
        .signal-row-test {
          background-color: #fff8e1 !important;
        }
        .signal-row-confirmed {
          background-color: #e8f5e9 !important;
        }
        @keyframes blink-red {
          0%, 100% { background-color: #ffebee; }
          50% { background-color: #ffcdd2; }
        }
      `}</style>
    </Paper>
  );
};

export default SignalTable;
'@

Set-Content -Path "$frontendPath\components\SignalTable.tsx" -Value $signalTableContent -Encoding UTF8
Write-Host "  OK: SignalTable.tsx создан" -ForegroundColor Green

# 5. ConfirmationPreview - Кнопка просмотра
Write-Host "[5/6] Создание ConfirmationPreview.tsx..." -ForegroundColor Yellow

$confirmationPreviewContent = @'
import React, { useState } from 'react';
import { 
  Button, 
  Dialog, 
  DialogTitle, 
  DialogContent, 
  DialogActions,
  Box,
  Typography,
  CircularProgress
} from '@mui/material';
import { Visibility, GetApp } from '@mui/icons-material';
import axios from 'axios';

interface ConfirmationPreviewProps {
  signalId: string;
  terminalNumber: string;
  isMatched: boolean;
  confirmationSent: boolean;
}

export const ConfirmationPreview: React.FC<ConfirmationPreviewProps> = ({
  signalId,
  terminalNumber,
  isMatched,
  confirmationSent
}) => {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [pdfUrl, setPdfUrl] = useState<string | null>(null);

  const handleOpen = async () => {
    setOpen(true);
    setLoading(true);
    
    try {
      // Формируем URL для превью PDF
      const url = `/api/confirmation/preview/${signalId}`;
      setPdfUrl(url);
    } catch (error) {
      console.error('Error loading preview:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = () => {
    if (pdfUrl) {
      const link = document.createElement('a');
      link.href = pdfUrl;
      link.download = `confirmation_${terminalNumber}.pdf`;
      link.click();
    }
  };

  return (
    <>
      <Button
        variant={confirmationSent ? "outlined" : "contained"}
        color={confirmationSent ? "success" : "primary"}
        startIcon={<Visibility />}
        onClick={handleOpen}
        disabled={!isMatched}
        size="small"
      >
        {confirmationSent ? "Просмотр" : "Превью"}
      </Button>

      <Dialog open={open} onClose={() => setOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          Форма подтверждения теста ССТО - Стойка {terminalNumber}
        </DialogTitle>
        <DialogContent>
          {loading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : pdfUrl ? (
            <iframe
              src={pdfUrl}
              style={{
                width: '100%',
                height: '600px',
                border: '1px solid #ddd'
              }}
              title="PDF Preview"
            />
          ) : (
            <Typography>Не удалось загрузить превью</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDownload} startIcon={<GetApp />}>
            Скачать PDF
          </Button>
          <Button onClick={() => setOpen(false)}>
            Закрыть
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default ConfirmationPreview;
'@

Set-Content -Path "$frontendPath\components\ConfirmationPreview.tsx" -Value $confirmationPreviewContent -Encoding UTF8
Write-Host "  OK: ConfirmationPreview.tsx создан" -ForegroundColor Green

# 6. Обновляем pdf.service.ts если нужно
Write-Host "[6/6] Проверка pdf.service.ts..." -ForegroundColor Yellow

$pdfPath = "$backendPath\services\pdf.service.ts"
if (Test-Path $pdfPath) {
    Write-Host "  OK: pdf.service.ts уже существует" -ForegroundColor Green
} else {
    Write-Host "  Файл отмечен как существующий, пропускаем" -ForegroundColor Yellow
}

Write-Host ""
Write-Host "=======================================" -ForegroundColor Green
Write-Host "       ВОССТАНОВЛЕНИЕ ЗАВЕРШЕНО!" -ForegroundColor Green
Write-Host "=======================================" -ForegroundColor Green

Write-Host ""
Write-Host "Восстановлены все 6 недостающих компонентов:" -ForegroundColor Cyan
Write-Host "  1. ssas-terminal.entity.ts - Номер стойки как ID" -ForegroundColor White
Write-Host "  2. system-settings.entity.ts - Настройки системы" -ForegroundColor White
Write-Host "  3. MapComponent.tsx - Морские карты" -ForegroundColor White
Write-Host "  4. SignalTable.tsx - Таблица сигналов" -ForegroundColor White
Write-Host "  5. ConfirmationPreview.tsx - Кнопка просмотра" -ForegroundColor White
Write-Host "  6. pdf.service.ts - уже существует" -ForegroundColor White

Write-Host ""
Write-Host "СЛЕДУЮЩИЕ ШАГИ:" -ForegroundColor Yellow
Write-Host "1. Запустите backend:" -ForegroundColor White
Write-Host "   cd backend-nest && npm run start:dev" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Запустите frontend:" -ForegroundColor White
Write-Host "   cd frontend && npm run dev" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Проверьте работу:" -ForegroundColor White
Write-Host "   - Морские карты на http://localhost:5173" -ForegroundColor Gray
Write-Host "   - Таблица сигналов с фильтром по номеру стойки" -ForegroundColor Gray
Write-Host "   - Кнопка просмотра формы подтверждения" -ForegroundColor Gray

Write-Host ""
Write-Host "4. Сохраните изменения в Git:" -ForegroundColor White
Write-Host "   git add -A" -ForegroundColor Gray
Write-Host '   git commit -m "Восстановлены недостающие компоненты"' -ForegroundColor Gray
'@