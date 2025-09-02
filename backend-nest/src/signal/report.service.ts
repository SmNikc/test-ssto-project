import { Injectable } from '@nestjs/common';

@Injectable()
export class ReportService {
  generateHtmlReport(request: any): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Подтверждение ССТО</title>
        <style>
          body { font-family: Arial; padding: 40px; max-width: 800px; margin: 0 auto; }
          h1 { color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px; }
          .info { margin: 20px 0; }
          .info p { margin: 10px 0; font-size: 16px; }
          .footer { margin-top: 50px; padding-top: 20px; border-top: 1px solid #ccc; }
        </style>
      </head>
      <body>
        <h1>ПОДТВЕРЖДЕНИЕ ТЕСТИРОВАНИЯ ССТО</h1>
        <div class="info">
          <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
          <p><strong>Время:</strong> ${new Date().toLocaleTimeString('ru-RU')}</p>
          <p><strong>Судно:</strong> ${request.vessel?.name || 'Неизвестно'}</p>
          <p><strong>MMSI:</strong> ${request.vessel?.mmsi || 'Неизвестно'}</p>
          <p><strong>IMO:</strong> ${request.vessel?.imo || 'Неизвестно'}</p>
          <p><strong>Статус:</strong> <span style="color: green;">ПОДТВЕРЖДЕНО</span></p>
        </div>
        <div class="footer">
          <p>Документ сгенерирован автоматически системой ГМСКЦ</p>
        </div>
      </body>
      </html>
    `;
  }
}
