import { IsBoolean, IsIn, IsNumber, IsOptional, IsString, Length, Matches } from 'class-validator';

export class NormalizedSignalDto {
  @IsOptional() @IsString() @Matches(/^\d{7,9}$/) mmsi?: string;
  @IsOptional() @IsString() @Matches(/^\d{6,7}$/) imo?: string;
  @IsOptional() @IsString() call_sign?: string;
  @IsOptional() @IsString() vessel_name?: string;
  @IsOptional() @IsString() @Matches(/^[A-F0-9]{15,23}$/) beacon_hex_id?: string;
  @IsOptional() @IsString() beacon_type?: string;
  @IsOptional() @IsIn(['406', '121.5', 'both', null]) frequency?: '406' | '121.5' | 'both' | null;
  @IsOptional() @IsNumber() latitude?: number;
  @IsOptional() @IsNumber() longitude?: number;
  @IsOptional() @IsString() detection_time?: string; // ISO
  @IsOptional() @IsString() email_from?: string;
  @IsOptional() @IsString() email_subject?: string;
  @IsOptional() @IsString() email_message_id?: string;
  @IsOptional() @IsBoolean() is_test?: boolean;
  @IsOptional() @IsString() @IsIn(['TEST','ALERT','UNPLANNED']) classification?: string;
  @IsOptional() @IsString() @Length(0, 2000) raw?: string;
  @IsOptional() @IsString() @Length(0, 500) notes?: string;
}
