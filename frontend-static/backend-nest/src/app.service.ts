import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHello(): string {
    return 'SSTO Test API - Day 2 Ready!';
  }
}