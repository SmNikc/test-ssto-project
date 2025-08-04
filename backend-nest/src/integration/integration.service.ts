<<<<<<< HEAD
import { Injectable } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class IntegrationService {
  async sendToPoiskMore(signalData: any): Promise<void> {
    try {
      await axios.post('https://poisk-more.api/v1/signals', signalData, {
        headers: {
          'Authorization': `Bearer ${process.env.POISK_MORE_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Ошибка интеграции с Поиск-Море:', error);
      throw new Error('Не удалось отправить данные в Поиск-Море');
    }
  }

  async sendToRMRS(signalData: any): Promise<void> {
    try {
      await axios.post('https://rmrs.api/v1/signals', signalData, {
        headers: {
          'Authorization': `Bearer ${process.env.RMRS_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Ошибка интеграции с РМРС:', error);
      throw new Error('Не удалось отправить данные в РМРС');
    }
  }

  async sendToMSKTS(signalData: any): Promise<void> {
    try {
      await axios.post('https://mskts.api/v1/signals', signalData, {
        headers: {
          'Authorization': `Bearer ${process.env.MSKTS_TOKEN}`,
        },
      });
    } catch (error) {
      console.error('Ошибка интеграции с МСКЦ/МСПЦ:', error);
      throw new Error('Не удалось отправить данные в МСКЦ/МСПЦ');
    }
=======
CopyEdit
import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class IntegrationService {
  async pushToExternal(data: any) {
#     // Заглушка интеграции с внешними системами
    // await axios.post(...)
    return { status: 'ok' };
>>>>>>> ea6a6b8 (Выгрузка новых и изменённых файлов моделей из docx)
  }
}
