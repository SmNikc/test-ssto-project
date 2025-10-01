// backend-nest/src/controllers/requests.controller.ts
// Единый контроллер заявок. Полная функциональность, сериализация с request_number.

import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Res,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';
import { RequestService, RequestStatus } from '../request/request.service';

@Controller('requests')
export class RequestsController {
  constructor(private readonly requestService: RequestService) {}

  // Всегда добавляем request_number в JSON-ответ
  private withRequestNumber(row: any) {
    if (!row) return row;
    const plain = typeof row.toJSON === 'function' ? row.toJSON() : row;
    const rn =
      (typeof row.getDataValue === 'function' &&
        row.getDataValue('request_number')) ||
      plain.request_number ||
      row['request_number'];
    return { ...plain, request_number: rn };
  }

  // Нормализация DTO: принимаем разные формы полей из фронта/почты/скриптов
  private normalizeCreateDto(dto: any) {
    const toDate = (v: any) => (v ? new Date(v) : undefined);
    return {
      vessel_name:
        dto.vessel_name ?? dto.vesselName ?? dto.vessel ?? 'Неизвестное судно',
      mmsi: dto.mmsi ?? dto.MMSI ?? dto.mmsi_number ?? dto.mobileMmsi,
      imo_number: dto.imo_number ?? dto.imo ?? dto.IMO,
      ssas_number:
        dto.ssas_number ??
        dto.terminal_number ??
        dto.terminalId ??
        dto.terminal_id ??
        dto.MobileTerminalNo,
      owner_organization:
        dto.owner_organization ?? dto.ship_owner ?? dto.owner ?? dto.company,
      contact_person:
        dto.contact_person ?? dto.requesterName ?? dto.contactPerson,
      contact_phone:
        dto.contact_phone ?? dto.requesterPhone ?? dto.phone ?? dto.tel,
      contact_email:
        dto.contact_email ?? dto.requesterEmail ?? dto.email ?? dto.mail,

      // Даты/время: если не пришли — спокойно оставляем undefined (сервис/БД подставят дефолт)
      test_date: toDate(dto.test_date ?? dto.testDate),
      planned_test_date: toDate(dto.planned_test_date ?? dto.plannedTestDate),
      start_time: dto.start_time ?? dto.startTime,
      end_time: dto.end_time ?? dto.endTime,

      notes: dto.notes,
      status: dto.status ?? RequestStatus.DRAFT,

      vessel_id: dto.vessel_id,
      signal_id: dto.signal_id,

      // Доп. источники/метаданные (если приходят)
      source: dto.source,
      original_email: dto.original_email,
    };
  }

  private normalizePatchDto(dto: any) {
    const out: any = {};
    const has = (k: string) => Object.prototype.hasOwnProperty.call(dto, k);
    const v = (x: any) => (x === '' ? undefined : x);

    if (has('vessel_name') || has('vesselName'))
      out.vessel_name = v(dto.vessel_name ?? dto.vesselName);
    if (has('mmsi') || has('MMSI')) out.mmsi = v(dto.mmsi ?? dto.MMSI);
    if (has('imo_number') || has('imo') || has('IMO'))
      out.imo_number = v(dto.imo_number ?? dto.imo ?? dto.IMO);

    if (
      has('ssas_number') ||
      has('terminal_number') ||
      has('terminalId') ||
      has('terminal_id')
    ) {
      out.ssas_number =
        dto.ssas_number ??
        dto.terminal_number ??
        dto.terminalId ??
        dto.terminal_id;
    }

    if (has('owner_organization') || has('ship_owner') || has('owner') || has('company'))
      out.owner_organization =
        dto.owner_organization ?? dto.ship_owner ?? dto.owner ?? dto.company;

    if (has('contact_person') || has('requesterName') || has('contactPerson'))
      out.contact_person =
        dto.contact_person ?? dto.requesterName ?? dto.contactPerson;
    if (has('contact_phone') || has('requesterPhone') || has('phone') || has('tel'))
      out.contact_phone =
        dto.contact_phone ?? dto.requesterPhone ?? dto.phone ?? dto.tel;
    if (has('contact_email') || has('requesterEmail') || has('email') || has('mail'))
      out.contact_email =
        dto.contact_email ?? dto.requesterEmail ?? dto.email ?? dto.mail;

    if (has('test_date') || has('testDate'))
      out.test_date = dto.test_date ? new Date(dto.test_date) : new Date(dto.testDate);
    if (has('planned_test_date') || has('plannedTestDate'))
      out.planned_test_date = dto.planned_test_date
        ? new Date(dto.planned_test_date)
        : new Date(dto.plannedTestDate);
    if (has('start_time') || has('startTime'))
      out.start_time = dto.start_time ?? dto.startTime;
    if (has('end_time') || has('endTime'))
      out.end_time = dto.end_time ?? dto.endTime;

    if (has('status')) out.status = dto.status;
    if (has('notes')) out.notes = dto.notes;
    if (has('vessel_id')) out.vessel_id = dto.vessel_id;
    if (has('signal_id')) out.signal_id = dto.signal_id;

    return out;
  }

  // POST /requests — создание
  @Post()
  async create(@Body() dto: any, @Res() res: Response) {
    try {
      const payload = this.normalizeCreateDto(dto);
      const created = await this.requestService.create(payload);
      const data = this.withRequestNumber(created);
      return res.status(HttpStatus.CREATED).json({
        success: true,
        message: 'Заявка успешно создана',
        data,
      });
    } catch (error: any) {
      // Подробное логирование для диагностики
      const details = error?.errors?.map((e: any) => ({
        message: e?.message,
        path: e?.path,
        type: e?.type,
      }));
      console.error('[REQUESTS] Failed to create request', {
        error: error?.message,
        details,
        payload: dto,
      });
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка создания заявки',
        error: error.message,
        details,
      });
    }
  }

  // GET /requests — список
  @Get()
  async findAll(@Res() res: Response) {
    try {
      const rows = await this.requestService.findAll();
      const data = (rows || []).map(r => this.withRequestNumber(r));
      return res.status(HttpStatus.OK).json({
        success: true,
        count: data.length,
        data,
      });
    } catch {
      // Возвращаем пустой набор, чтобы фронт не падал
      return res.status(HttpStatus.OK).json({
        success: false,
        count: 0,
        data: [],
      });
    }
  }

  // GET /requests/pending — «ожидающие»
  @Get('pending')
  async findPending(@Res() res: Response) {
    try {
      const rows = await this.requestService.findPending();
      const data = (rows || []).map(r => this.withRequestNumber(r));
      return res.status(HttpStatus.OK).json({
        success: true,
        count: data.length,
        data,
      });
    } catch {
      return res.status(HttpStatus.OK).json({
        success: false,
        count: 0,
        data: [],
      });
    }
  }

  // GET /requests/:id — по ISN/ID
  @Get(':id')
  async findOne(@Param('id') id: string, @Res() res: Response) {
    try {
      const row = await this.requestService.findOne(id);
      const data = this.withRequestNumber(row);
      return res.status(HttpStatus.OK).json({ success: true, data });
    } catch (error: any) {
      return res.status(HttpStatus.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: 'Ошибка получения заявки',
        error: error.message,
      });
    }
  }

  // PUT /requests/:id — обновление
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: any, @Res() res: Response) {
    try {
      const patch = this.normalizePatchDto(dto);
      await this.requestService.update(id, patch);
      const updated = await this.requestService.findOne(id);
      const data = this.withRequestNumber(updated);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Заявка успешно обновлена',
        data,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка обновления заявки',
        error: error.message,
      });
    }
  }

  // PUT /requests/:id/status — смена статуса
  @Put(':id/status')
  async updateStatus(
    @Param('id') id: string,
    @Body('status') status: string,
    @Res() res: Response,
  ) {
    try {
      await this.requestService.updateStatus(id, status);
      const updated = await this.requestService.findOne(id);
      const data = this.withRequestNumber(updated);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: `Статус заявки изменён на ${status}`,
        data,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка обновления статуса',
        error: error.message,
      });
    }
  }

  // DELETE /requests/:id — удаление
  @Delete(':id')
  async remove(@Param('id') id: string, @Res() res: Response) {
    try {
      const result = await this.requestService.remove(id);
      return res.status(HttpStatus.OK).json({
        success: true,
        message: 'Заявка успешно удалена',
        result,
      });
    } catch (error: any) {
      return res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        message: 'Ошибка удаления заявки',
        error: error.message,
      });
    }
  }
}
