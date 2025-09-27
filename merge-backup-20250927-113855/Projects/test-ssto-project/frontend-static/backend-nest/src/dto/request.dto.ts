import { IsString, IsEmail, IsDateString, Matches, IsOptional, IsEnum, Length } from 'class-validator';

export class CreateRequestDto {
  @IsString()
  @Matches(/^\d{9}$/, { message: 'MMSI должен содержать 9 цифр' })
  mmsi: string;

  @IsString()
  @Length(1, 100)
  vessel_name: string;

  @IsString()
  @Length(1, 200)
  owner_organization: string;

  @IsString()
  @Length(1, 100)
  contact_person: string;

  @IsEmail({}, { message: 'Некорректный email' })
  email: string;

  @IsOptional()
  @IsString()
  @Matches(/^[+]?[0-9\s-()]+$/, { message: 'Некорректный номер телефона' })
  phone?: string;

  @IsDateString()
  test_date: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Время в формате HH:MM' })
  start_time: string;

  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, { message: 'Время в формате HH:MM' })
  end_time: string;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  vessel_name?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsDateString()
  test_date?: string;

  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  start_time?: string;

  @IsOptional()
  @Matches(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/)
  end_time?: string;
}
