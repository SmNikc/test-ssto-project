// src/dto/create-vessel.dto.ts

export class CreateVesselDto {
  name: string;
  imo_number: string;
  call_sign: string;
  mmsi?: string;
  vessel_type?: string;
  gross_tonnage?: number;
  flag?: string;
  port_of_registry?: string;
  owner_name: string;
  owner_email: string;
  owner_phone?: string;
  latitude?: number;
  longitude?: number;
}