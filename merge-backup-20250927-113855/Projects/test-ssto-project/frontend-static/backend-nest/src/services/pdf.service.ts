import { Injectable } from '@nestjs/common';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PdfService {
  async generatePdf(data: any): Promise<string> {
    const fileName = `report_${Date.now()}.pdf`;
    const filePath = path.join(process.cwd(), 'reports', fileName);
    
    const dir = path.dirname(filePath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));
    return filePath;
  }

  async generateTestConfirmation(request: any, signal: any): Promise<string> {
    const data = {
      request,
      signal,
      generatedAt: new Date().toISOString()
    };
    return this.generatePdf(data);
  }

  generateConfirmation(requestData: any): string {
    return `<html><body><h1>Подтверждение</h1><pre>${JSON.stringify(requestData, null, 2)}</pre></body></html>`;
  }

  // Добавляем методы которые ожидает SignalController
  async generatePDF(data: any): Promise<Buffer> {
    const content = JSON.stringify(data, null, 2);
    return Buffer.from(content, 'utf-8');
  }
  
  async generateConfirmationPDF(request: any, signal: any): Promise<Buffer> {
    const data = {
      request,
      signal,
      generatedAt: new Date().toISOString()
    };
    return this.generatePDF(data);
  }
}
