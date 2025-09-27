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