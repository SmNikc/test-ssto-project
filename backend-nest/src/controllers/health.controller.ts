// backend-nest/src/controllers/health.controller.ts

import { Controller, Get } from '@nestjs/common';
import { InjectConnection } from '@nestjs/sequelize';
import { Sequelize } from 'sequelize-typescript';

@Controller('health')
export class HealthController {
  constructor(
    @InjectConnection() private readonly sequelize: Sequelize
  ) {}

  @Get()
  async ping() {
    try {
      await this.sequelize.authenticate({ retry: { max: 0 } });
      return { 
        status: 'ok', 
        db: 'up',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return { 
        status: 'degraded', 
        db: 'down', 
        message: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('detailed')
  async getDetailedHealth() {
    const healthStatus = {
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      services: {
        api: 'up',
        database: 'checking'
      },
      memory: {
        used: process.memoryUsage().heapUsed / 1024 / 1024,
        total: process.memoryUsage().heapTotal / 1024 / 1024,
        unit: 'MB'
      }
    };

    try {
      const startTime = Date.now();
      await this.sequelize.authenticate({ retry: { max: 0 } });
      const responseTime = Date.now() - startTime;
      
      healthStatus.services.database = 'up';
      
      // Добавляем информацию о БД если подключение успешно
      const dbInfo = {
        status: 'connected',
        responseTime: `${responseTime}ms`,
        dialect: this.sequelize.getDialect(),
        host: this.sequelize.config.host,
        database: this.sequelize.config.database
      };
      
      return {
        ...healthStatus,
        database: dbInfo
      };
    } catch (error) {
      healthStatus.status = 'degraded';
      healthStatus.services.database = 'down';
      
      return {
        ...healthStatus,
        database: {
          status: 'disconnected',
          error: (error as Error).message
        }
      };
    }
  }

  @Get('ready')
  async checkReadiness() {
    // Проверка готовности системы к обработке запросов
    try {
      // Проверяем подключение к БД
      await this.sequelize.authenticate({ retry: { max: 0 } });
      
      // Можно добавить дополнительные проверки:
      // - Проверка миграций БД
      // - Проверка внешних сервисов
      // - Проверка критических зависимостей
      
      return {
        ready: true,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      return {
        ready: false,
        reason: 'Database connection failed',
        error: (error as Error).message,
        timestamp: new Date().toISOString()
      };
    }
  }

  @Get('live')
  async checkLiveness() {
    // Простая проверка, что приложение живо и может отвечать
    return {
      alive: true,
      timestamp: new Date().toISOString(),
      pid: process.pid
    };
  }
}
