import { Injectable } from '@nestjs/common';
import * as PDFDocument from 'pdfkit';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class ReportService {
  async generateTestConfirmation(request: any, signal: any): Promise<string> {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 50, right: 50 }
    });
    
    const fileName = `confirmation_${request.id}_${Date.now()}.pdf`;
    const filePath = path.join(__dirname, '../../uploads/reports', fileName);
    
    if (!fs.existsSync(path.dirname(filePath))) {
      fs.mkdirSync(path.dirname(filePath), { recursive: true });
    }
    
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
    
    // Номер и дата документа
    const currentDate = new Date();
    const docNumber = `МСС-${Math.floor(Math.random() * 1000)}/ССТО`;
    doc.text(`№ ${docNumber}`, 50, 240);
    doc.text(`от ${currentDate.toLocaleDateString('ru-RU')}`, 150, 240);
    
    // Основной текст
    doc.fontSize(11);
    doc.text('Подтверждаем получение тестового сообщения ССТО:', 50, 280);
    
    // Данные из сигнала
    doc.fontSize(10);
    doc.text('---TEST SSAS TEST---', 50, 310);
    doc.text(`Mobile Terminal No:${request.ssas_number || 'N/A'}`, 50, 325);
    
    // Извлекаем координаты из тела письма или используем из сигнала
    const lat = signal.latitude || '41 28.83\'N';
    const lon = signal.longitude || '31 47.83\'E';
    doc.text(`Position:${lat} ${lon}`, 50, 340);
    
    const testTime = new Date(signal.detection_time || signal.received_at);
    doc.text(`Position updated:${testTime.toISOString().replace('T', ' ').split('.')[0]} UTC`, 50, 355);
    doc.text('---TEST SSAS TEST---', 50, 370);
    
    // Строка с MMSI и координатами
    doc.text(`${request.mmsi} ${testTime.toISOString().split('T')[0]} ${testTime.toTimeString().split(' ')[0]} ${lat} ${lon}`, 50, 385);
    
    // Email адреса
    doc.text('Covert message setup:', 50, 415);
    doc.text(`E-mail:od_smrcc@morflot.ru`, 50, 430);
    doc.text(`E-mail:${request.contact_email}`, 50, 445);
    if (request.contact_phone) {
      doc.text(`E-mail:${request.contact_person.toLowerCase().replace(' ', '_')}@volgaflot.com`, 50, 460);
    }
    
    // Подпись
    doc.fontSize(9);
    doc.text('Федеральное государственное бюджетное', 50, 520);
    doc.text('учреждение «Морская спасательная служба»', 50, 535);
    doc.text('(ФГБУ «Морспасслужба»)', 50, 550);
    
    doc.text('Подписано ПЭП', 50, 580);
    
    // Генерируем фамилию дежурного
    const operators = ['С. А. Мохначев', 'И. В. Петров', 'А. Н. Сидоров', 'В. П. Козлов'];
    const operator = operators[Math.floor(Math.random() * operators.length)];
    
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
}