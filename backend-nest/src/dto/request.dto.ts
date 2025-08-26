import { IsEmail, IsNotEmpty, IsOptional, IsEnum, IsDateString, IsString } from 'class-validator';
import { RequestStatus, RequestType } from '../models/request.model';

export class CreateRequestDto {
  @IsNotEmpty()
  @IsString()
  vesselName: string;

  @IsOptional()
  @IsString()
  vesselIMO?: string;

  @IsOptional()
  @IsString()
  vesselType?: string;

  @IsOptional()
  @IsString()
  vesselFlag?: string;

  @IsNotEmpty()
  @IsString()
  requesterName: string;

  @IsNotEmpty()
  @IsEmail()
  requesterEmail: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  requesterCompany?: string;

  @IsOptional()
  @IsEnum(RequestType)
  testType?: RequestType;

  @IsNotEmpty()
  @IsDateString()
  testDate: string;

  @IsOptional()
  @IsString()
  testTime?: string;

  @IsOptional()
  @IsString()
  testLocation?: string;

  @IsOptional()
  @IsString()
  testCoordinator?: string;

  @IsOptional()
  @IsString()
  beaconId?: string;

  @IsOptional()
  @IsString()
  beaconManufacturer?: string;

  @IsOptional()
  @IsString()
  beaconModel?: string;

  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdateRequestDto {
  @IsOptional()
  @IsString()
  vesselName?: string;

  @IsOptional()
  @IsString()
  vesselIMO?: string;

  @IsOptional()
  @IsString()
  vesselType?: string;

  @IsOptional()
  @IsString()
  vesselFlag?: string;

  @IsOptional()
  @IsString()
  requesterName?: string;

  @IsOptional()
  @IsEmail()
  requesterEmail?: string;

  @IsOptional()
  @IsString()
  requesterPhone?: string;

  @IsOptional()
  @IsString()
  requesterCompany?: string;

  @IsOptional()
  @IsEnum(RequestType)
  testType?: RequestType;

  @IsOptional()
  @IsDateString()
  testDate?: string;

  @IsOptional()
  @IsString()
  testTime?: string;

  @IsOptional()
  @IsString()
  testLocation?: string;

  @IsOptional()
  @IsString()
  testCoordinator?: string;

  @IsOptional()
  @IsEnum(RequestStatus)
  status?: RequestStatus;

  @IsOptional()
  @IsString()
  beaconId?: string;

  @IsOptional()
  @IsString()
  beaconManufacturer?: string;

  @IsOptional()
  @IsString()
  beaconModel?: string;

  @IsOptional()
  @IsString()
  notes?: string;

  @IsOptional()
  @IsString()
  reportUrl?: string;
}

export class UpdateRequestStatusDto {
  @IsNotEmpty()
  @IsEnum(RequestStatus)
  status: RequestStatus;

  @IsOptional()
  @IsString()
  notes?: string;
}