import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';
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

  async generateTestConfirmation(request: any, signal: any): Promise<string> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const fileName = `confirmation_${request.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);

    doc.pipe(fs.createWriteStream(filePath));
    
    // Шапка документа - имитация бланка
    doc.fontSize(10).font('Times-Roman');
    doc.text('МИНТРАНС РОССИИ', 50, 50);
    doc.text('РОСМОРРЕЧФЛОТ', 50, 65);
    doc.fontSize(9);
    doc.text('ФЕДЕРАЛЬНОЕ ГОСУДАРСТВЕННОЕ', 50, 85);
    doc.text('БЮДЖЕТНОЕ УЧРЕЖДЕНИЕ', 50, 100);
    doc.text('«МОРСКАЯ СПАСАТЕЛЬНАЯ СЛУЖБА»', 50, 115);
    doc.text('(ФГБУ «МОРСПАССЛУЖБА»)', 50, 130);
    
    // Правая часть шапки
    doc.fontSize(12).text('Главный морской', 350, 50);
    doc.text('спасательно-', 350, 65);
    doc.text('координационный центр', 350, 80);
    doc.text('(ГМСКЦ)', 350, 95);
    
    // Адрес и реквизиты
    doc.fontSize(8);
    doc.text('ул. Петровка д. 3/6 стр. 2, г Москва, 125993', 50, 150);
    doc.text('тел.: (495) 626-18-08', 50, 165);
    doc.text('info@morspas.ru, www.morspas.ru', 50, 180);
    doc.text('ОКПО 18685292, ОГРН 1027739737321', 50, 195);
    doc.text('ИНН/КПП 7707274249/770701001', 50, 210);

    // Подпись
    doc.fontSize(9);
    doc.text('Федеральное государственное бюджетное', 50, 520);
    doc.text('учреждение «Морская спасательная служба»', 50, 535);
    doc.text('(ФГБУ «Морспасслужба»)', 50, 550);
    
    doc.text('Подписано ПЭП', 50, 580);
    
    // Генерируем фамилию дежурного
    const operators = ['С. А. Мохначев', 'И. В. Петров', 'А. Н. Сидоров', 'В. П. Козлов'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
    // Добавлено объявление currentDate (исправление TS2304)
    const currentDate = new Date();
    
    doc.fontSize(10);
    doc.text(operator, 50, 600);
    doc.text('Оперативный дежурный ГМСКЦ', 50, 615);
    doc.text(currentDate.toLocaleDateString('ru-RU'), 50, 630);
    
    // Контакты внизу
    doc.fontSize(8);
    doc.text('Оперативный дежурный ГМСКЦ', 50, 700);
    doc.text('+7 (495) 626-10-52', 50, 715);
    
    doc.end();
    return filePath;
  }

  async generateForSignal(signal: Signal & { request?: SSASRequest | null }): Promise<string> {
    const request = signal.request ?? null;

    if (request) {
      return this.generateTestConfirmation(request, signal);
    }

    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });

    const fileName = `signal_${signal.id}_${Date.now()}.pdf`;
    const filePath = path.join(this.ensureReportsDirectory(), fileName);

    doc.pipe(fs.createWriteStream(filePath));

    doc.fontSize(16).text('Signal Report', { align: 'center' });
    doc.moveDown();

    doc.fontSize(11);
    doc.text(`Signal ID: ${signal.id ?? 'N/A'}`);
    doc.text(`Terminal Number: ${signal.terminal_number ?? 'N/A'}`);
    doc.text(`Vessel Name: ${signal.vessel_name ?? 'N/A'}`);
    doc.text(`MMSI: ${signal.mmsi ?? 'N/A'}`);
    doc.text(`Signal Type: ${signal.signal_type ?? 'N/A'}`);
    doc.text(`Status: ${signal.status ?? 'N/A'}`);
    const receivedAt = signal.received_at ? new Date(signal.received_at) : null;
    doc.text(`Received At: ${receivedAt ? receivedAt.toISOString() : 'N/A'}`);

    if (signal.coordinates) {
      doc.moveDown();
      doc.text('Coordinates:');
      doc.text(`Latitude: ${signal.coordinates.lat ?? 'N/A'}`);
      doc.text(`Longitude: ${signal.coordinates.lng ?? signal.coordinates.lon ?? 'N/A'}`);
    }

    if (signal.metadata) {
      doc.moveDown();
      doc.text('Metadata:');
      doc.text(JSON.stringify(signal.metadata, null, 2));
    }

    doc.end();
    return filePath;
  }
}