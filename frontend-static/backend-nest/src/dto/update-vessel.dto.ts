// src/dto/update-vessel.dto.ts

import { PartialType } from '@nestjs/mapped-types';
import { CreateVesselDto } from './create-vessel.dto';

export class UpdateVesselDto extends PartialType(CreateVesselDto) {
  // Все поля из CreateVesselDto становятся опциональными
  // Можно добавить дополнительные поля для обновления
  latitude?: number;
  longitude?: number;
  speed?: number;
  course?: number;
  last_position_time?: Date | string;
}