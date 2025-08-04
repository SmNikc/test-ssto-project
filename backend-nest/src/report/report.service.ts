<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import { SignalService } from '../signal/signal.service';
import * as pdfkit from 'pdfkit';
import * as fs from 'fs';
import * as ExcelJS from 'exceljs';

@Injectable()
export class ReportService {
  constructor(private signalService: SignalService) {}

  async generateDailyReport(date: string, format: 'pdf' | 'excel'): Promise<string> {
    const startDate = new Date(date);
    const endDate = new Date(date);
    endDate.setDate(endDate.getDate() + 1);

    const signals = await this.signalService.getSignalsByType('all', startDate, endDate);
    const reportPath = `/opt/test-ssto/reports/daily_report_${date}.${format}`;

    if (format === 'pdf') {
      const doc = new pdfkit();
      doc.pipe(fs.createWriteStream(reportPath));
      doc.fontSize(16).text(`Суточная сводка за ${date}`, { align: 'center' });
      doc.moveDown();
      doc.fontSize(12).text(`Всего сигналов: ${signals.length}`);
      doc.moveDown();
      signals.forEach((signal, index) => {
        doc.text(`Сигнал ${index + 1}: MMSI ${signal.mmsi}, Тип: ${signal.signal_type}, Время: ${signal.received_at}`);
      });
      doc.end();
    } else {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Daily Report');
      worksheet.columns = [
        { header: 'MMSI', key: 'mmsi', width: 15 },
        { header: 'Тип сигнала', key: 'signal_type', width: 15 },
        { header: 'Время получения', key: 'received_at', width: 25 },
      ];
      signals.forEach(signal => {
        worksheet.addRow({
          mmsi: signal.mmsi,
          signal_type: signal.signal_type,
          received_at: signal.received_at,
        });
      });
      await workbook.xlsx.writeFile(reportPath);
    }

    return reportPath;
=======
CopyEdit
import { Injectable } from '@nestjs/common';
# // import * as pdfkit from 'pdfkit';
# // import * as ExcelJS from 'exceljs';
@Injectable()
export class ReportService {
  async dailyReport(date: string) {
#     // Реализация отчёта за день (заглушка)
    return { report: 'daily', date };
  }
  async customReport(params: any) {
#     // Реализация произвольного отчёта (заглушка)
    return { report: 'custom', params };
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
