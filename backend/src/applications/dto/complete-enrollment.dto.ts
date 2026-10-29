import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
} from 'class-validator';
import { CircularPreference, CustodyType, LegalStatus } from '@prisma/client';

export class CompleteEnrollmentDto {
  // --- Posibles correcciones de datos de Fase 1 tras meses en lista de espera ---
  @IsString()
  @IsOptional()
  streetAddress?: string;

  @IsString()
  @IsOptional()
  streetNumber?: string;

  @IsString()
  @IsOptional()
  ApartmentDoor?: string;

  @IsString()
  @IsOptional()
  postalCode?: string;

  @IsString()
  @IsOptional()
  municipality?: string;

  @IsString()
  @IsOptional()
  province?: string;

  @IsString()
  @IsOptional()
  parent1Phone?: string;

  @IsEmail()
  @IsOptional()
  parent1Email?: string;

  @IsString()
  @IsOptional()
  parent2Phone?: string;

  @IsEmail()
  @IsOptional()
  parent2Email?: string;

  // --- Ampliación Hoja 1: Datos Legales y DNI ---
  @IsString()
  @IsOptional()
  childDni?: string;

  @IsString()
  @IsOptional()
  childPhone?: string;

  @IsEmail()
  @IsOptional()
  childEmail?: string;

  @IsEnum(LegalStatus)
  @IsOptional()
  legalStatus?: LegalStatus;

  @IsEnum(CircularPreference)
  @IsOptional()
  circularPreference?: CircularPreference;

  @IsString()
  @IsNotEmpty()
  parent1Dni: string;

  @IsString()
  @IsOptional()
  parent2Dni?: string;

  @IsString()
  @IsOptional()
  parentsMaritalStatus?: string;

  @IsEnum(CustodyType)
  @IsOptional()
  custodyType?: CustodyType;

  // --- Consentimientos ---
  @IsBoolean()
  acceptsDataStorage: boolean;

  @IsBoolean()
  acceptsDataTransfer: boolean;

  @IsBoolean()
  authorizesImages: boolean;

  // --- Hoja 2: Ficha Médica ---
  @IsString()
  @IsOptional()
  bloodType?: string;

  @IsString()
  @IsOptional()
  chronicDiseases?: string;

  @IsString()
  @IsOptional()
  allergies?: string;

  @IsString()
  @IsOptional()
  medHeadache?: string;

  @IsString()
  @IsOptional()
  medFever?: string;

  @IsString()
  @IsOptional()
  medStomach?: string;

  @IsString()
  @IsOptional()
  medThroat?: string;

  @IsString()
  @IsOptional()
  medicalObservations?: string;

  @IsBoolean()
  authorizesEmergency: boolean;

  // --- Hoja 3: SEPA / IBAN ---
  @IsString()
  @IsNotEmpty()
  accountHolderName: string;

  @IsString()
  @IsNotEmpty()
  accountHolderDni: string;

  @IsString()
  @Matches(/^ES\d{22}$/i, {
    message: 'El IBAN debe comenzar por ES seguido de 22 dígitos sin espacios',
  })
  iban: string;

  @IsBoolean()
  authorizesSepa: boolean;

  // --- Firmas en Base64 ---
  @IsString()
  @IsNotEmpty()
  signatureParent1: string;

  @IsString()
  @IsOptional()
  signatureParent2?: string;
}