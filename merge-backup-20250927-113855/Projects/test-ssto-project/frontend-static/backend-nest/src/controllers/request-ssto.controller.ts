// C:\Projects\test-ssto-project\backend-nest\src\controllers\request.controller.ts
// Контроллер для API endpoints заявок

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  HttpStatus,
  Res,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestService } from '../request/request.service';  // ✅ Исправлено

@Controller('requests')
export class RequestController {
  constructor(private readonly requestService: RequestService) {}

  // POST /requests - Создание новой заявки
  @Post()
  async create(@Body() createRequestDto: any, @Res() res: Response) {
    try {
      // Добавляем сигнальный ID на основе времени
      const requestData = {
        ...createRequestDto,
        test_datetime: new Date(createRequestDto.test_datetime),
      };

      const request = await this.requestService.create(requestData);
      
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Заявка успешно создана',
        data: request,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка создания заявки',
        error: error.message,
      });
    }
  }

  // GET /requests - Получение всех заявок
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const requests = await this.requestService.findAll();
      return res.status(HttpStatus.OK).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      // If the database is unavailable or another error occurs we do not want
      // to surface a 500 error to the frontend.  Returning an empty list keeps
      // the UI functional even when the backend cannot reach the database.
      console.error('Error fetching requests:', error);
      return res.status(HttpStatus.OK).json({
        success: false,
        count: 0,
        data: [],
      });
    }
  }

  // GET /requests/pending - Получение ожидающих заявок
  @Get('pending')
  async findPending(@Res() res: Response) {
    try {
      const requests = await this.requestService.findPending();
      return res.status(HttpStatus.OK).json({
        success: true,
        count: requests.length,
        data: requests,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Ошибка получения ожидающих заявок',
        error: error.message,
      });
    }
  }

  // GET /requests/:id - Получение заявки по ID
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const request = await this.requestService.findOne(id);
      
      if (!request) {
        return res.status(HttpStatus.NOT_FOUND).json({
          success: false,
          message: 'Заявка не найдена',
        });
      }

      return res.status(HttpStatus.OK).json({
        success: true,
        data: request,
      });
    } catch (error) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Ошибка получения заявки',
        error: error.message,
      });
    }
  }

  // PUT /requests/:id - Обновление заявки
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() updateRequestDto: any,
    @Res() res: Response,
  ) {
    try {
      await this.requestService.update(id, updateRequestDto);
      const updated = await this.requestService.findOne(id);

      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Заявка успешно обновлена',
        data: updated,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка обновления заявки',
        error: error.message,
      });
    }
  }

  // PUT /requests/:id/status - Обновление статуса заявки
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Res() res: Response,
  ) {
    try {
      await this.requestService.updateStatus(id, status);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Статус заявки изменен на ${status}`,
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка обновления статуса',
        error: error.message,
      });
    }
  }

  // DELETE /requests/:id - Удаление заявки
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      await this.requestService.remove(id);
      
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Заявка успешно удалена',
      });
    } catch (error) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка удаления заявки',
        error: error.message,
      });
    }
  }
}