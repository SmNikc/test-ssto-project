--- FILE: backend-nest/src/services/report.service.ts ---
import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';
import * as PDFDocument from 'pdfkit';
import Signal from '../models/signal.model';
import SSASRequest from '../models/request.model';

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

  /** Универсальный отчёт по сигналу с поддержкой связанных заявок */
  async generateForSignal(signal: Signal & { request?: SSASRequest | null }): Promise<string> {
    // Получаем plain объект если это Sequelize модель
    const signalData = typeof signal?.get === 'function' ? signal.get({ plain: true }) : signal;
    const request = signalData?.request || signalData?.SSASRequest || signal.request || null;
    const requestData = request && typeof request.get === 'function' ? request.get({ plain: true }) : request;
    
    // Если есть связанная заявка - генерируем подтверждение
    if (requestData) {
      return this.generateTestConfirmation(requestData, signalData || signal);
    }

    // Иначе генерируем обычный отчет по сигналу
    const doc = new (PDFDocument as any)({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 },
    });

    const fileName = `signal_${signalData?.id || signal?.id || 'unknown'}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);
    doc.pipe(fs.createWriteStream(filePath));

    // Заголовок
    doc.fontSize(16).text('Отчет по сигналу ССТО', { align: 'center' });
    doc.moveDown();

    // Основная информация о сигнале
    doc.fontSize(12);
    doc.text(`ID сигнала: ${signalData?.id ?? signal?.id ?? 'N/A'}`);
    doc.text(`Тип сигнала: ${signalData?.signal_type ?? signal?.signal_type ?? 'N/A'}`);
    doc.text(`Статус: ${signalData?.status ?? signal?.status ?? 'N/A'}`);
    
    // Форматирование времени с учетом локали
    const receivedAt = signalData?.received_at || signal?.received_at;
    doc.text(`Время получения: ${receivedAt ? new Date(receivedAt).toLocaleString('ru-RU') : 'N/A'}`);
    
    doc.text(`Терминал: ${signalData?.terminal_number ?? signal?.terminal_number ?? 'N/A'}`);
    doc.text(`MMSI: ${signalData?.mmsi ?? signal?.mmsi ?? 'N/A'}`);
    doc.text(`Название судна: ${signalData?.vessel_name ?? signal?.vessel_name ?? 'N/A'}`);
    doc.text(`Позывной: ${signalData?.call_sign ?? signal?.call_sign ?? 'N/A'}`);

    // Координаты если есть
    const coordinates = signalData?.coordinates || signal?.coordinates;
    if (coordinates) {
      doc.moveDown();
      doc.text('Координаты:');
      const lat = coordinates.lat ?? 'N/A';
      const lon = coordinates.lng ?? coordinates.lon ?? 'N/A';
      doc.text(`  Широта: ${lat}`);
      doc.text(`  Долгота: ${lon}`);
    }

    // Метаданные если есть
    const metadata = signalData?.metadata || signal?.metadata;
    if (metadata) {
      doc.moveDown();
      doc.text('Метаданные:');
      try {
        const metadataStr = JSON.stringify(metadata, null, 2);
        // Разбиваем длинные строки для корректного отображения в PDF
        const lines = metadataStr.split('\n');
        lines.forEach(line => {
          if (line.length > 80) {
            // Разбиваем длинные строки
            const chunks = line.match(/.{1,80}/g) || [];
            chunks.forEach(chunk => doc.text(chunk));
          } else {
            doc.text(line);
          }
        });
      } catch (e) {
        doc.text(String(metadata));
      }
    }

    doc.end();
    return filePath;
  }
}