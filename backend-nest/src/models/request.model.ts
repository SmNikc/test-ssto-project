// Алиас для совместимости
export { SSASRequest as Request } from './request';
export { SSASRequest } from './request';

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