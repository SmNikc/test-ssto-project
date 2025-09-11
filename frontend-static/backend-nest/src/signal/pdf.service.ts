import { Injectable } from '@nestjs/common';

@Injectable()
export class PdfService {
  generateConfirmation(request: any): string {
    const vesselName = request?.vessel?.name || request?.vessel_name || 'Неизвестное судно';
    const mmsi = request?.vessel?.mmsi || request?.mmsi || 'Неизвестно';
    const imo = request?.vessel?.imo || request?.imo || 'Неизвестно';
    
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <style>
          body { font-family: Arial; padding: 40px; }
          h1 { color: #2c3e50; }
          .info p { margin: 10px 0; font-size: 16px; }
        </style>
      </head>
      <body>
        <h1>ПОДТВЕРЖДЕНИЕ ТЕСТИРОВАНИЯ ССТО</h1>
        <div class="info">
          <p><strong>Дата:</strong> ${new Date().toLocaleDateString('ru-RU')}</p>
          <p><strong>Судно:</strong> ${vesselName}</p>
          <p><strong>MMSI:</strong> ${mmsi}</p>
          <p><strong>IMO:</strong> ${imo}</p>
          <p><strong>Статус:</strong> ПОДТВЕРЖДЕНО</p>
        </div>
      </body>
      </html>
    `;
  }
}
