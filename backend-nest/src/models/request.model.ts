// backend-nest/src/models/request.model.ts
// Правильная версия с enum'ами и исправленным импортом

import SSASRequest from './request';

// Алиас для совместимости
export { SSASRequest as Request, SSASRequest };
export default SSASRequest;

// Enum для совместимости с DTO
export enum RequestStatus {
  DRAFT = 'draft',
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled'
}

export enum RequestType {
  TEST_406 = 'test_406',
  TEST_121 = 'test_121',
  COMBINED = 'combined'
}