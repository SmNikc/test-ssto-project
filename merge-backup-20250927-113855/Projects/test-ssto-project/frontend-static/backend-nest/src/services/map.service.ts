import { Injectable } from '@nestjs/common';

@Injectable()
export class MapService {
  /**
   * Преобразование координат в десятичные градусы
   */
  convertToDecimalDegrees(coordinate: string, isLongitude: boolean = false): number {
    // Обработка различных форматов координат
    const dmsMatch = coordinate.match(/(\d+)[°\s]+(\d+)['\s]+(\d+(?:\.\d+)?)["\s]*([NSEW])?/);
    
    if (dmsMatch) {
      const degrees = parseInt(dmsMatch[1]);
      const minutes = parseInt(dmsMatch[2]);
      const seconds = parseFloat(dmsMatch[3]);
      const direction = dmsMatch[4];
      
      let decimal = degrees + minutes / 60 + seconds / 3600;
      
      if (direction === 'S' || direction === 'W') {
        decimal = -decimal;
      }
      
      return decimal;
    }
    
    // Если уже в десятичном формате
    return parseFloat(coordinate);
  }

  /**
   * Данные для отображения на карте
   */
  getMapData(signals: any[]): any {
    return {
      type: 'FeatureCollection',
      features: signals.map(signal => ({
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: [signal.longitude, signal.latitude]
        },
        properties: {
          id: signal.id,
          terminalId: signal.terminalId,
          mmsi: signal.mmsi,
          signalType: signal.signalType,
          receivedAt: signal.receivedAt,
          color: this.getSignalColor(signal.signalType)
        }
      }))
    };
  }

  private getSignalColor(signalType: string): string {
    switch (signalType) {
      case 'test_406':
      case 'test_121':
        return '#4CAF50'; // Зеленый для тестовых
      case 'real_alert':
        return '#F44336'; // Красный для реальных
      default:
        return '#FFC107'; // Желтый для неопределенных
    }
  }
}
