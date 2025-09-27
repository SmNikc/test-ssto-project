import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
const axios = require('axios');

@Injectable()
export class PoiskMoreService {
  private apiUrl: string;

  constructor(private configService: ConfigService) {
    this.apiUrl = this.configService.get('POISK_MORE_API_URL', 'https://api.poisk-more.ru');
  }

  /**
   * Передача сигнала в систему Поиск-Море
   */
  async transferSignal(signal: any): Promise<string> {
    try {
      const response = await axios.post(this.apiUrl + '/signals', {
        terminalId: signal.terminalId,
        mmsi: signal.mmsi,
        latitude: signal.latitude,
        longitude: signal.longitude,
        signalType: signal.signalType,
        receivedAt: signal.receivedAt,
        vesselName: signal.terminal?.vesselName
      }, {
        headers: {
          'Authorization': 'Bearer ' + this.configService.get('POISK_MORE_TOKEN'),
          'Content-Type': 'application/json'
        }
      });

      return response.data.id;
    } catch (error) {
      console.error('Ошибка передачи в Поиск-Море:', error);
      throw error;
    }
  }
}
