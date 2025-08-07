import { Injectable } from '@nestjs/common';
import axios from 'axios';
@Injectable()
export class IntegrationService {
  async pushToExternal(data: any) {
    // Заглушка интеграции с внешними системами
    // await axios.post(...)
    return { status: 'ok' };
  }
}
