// src/dto/create-test-request.dto.ts

export class CreateTestRequestDto {
  vessel_id: number;
  test_type: 'routine' | 'emergency' | 'installation';
  test_date: Date | string;
  notes?: string;
}