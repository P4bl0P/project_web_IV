import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { CircularPreference, CustodyType, Gender, LegalStatus } from '@prisma/client';
import {
  cleanIban,
  cleanPhoneOptional,
  trimOptional,
  trimString,
} from '../../common/dto-transforms.util';

export class CompleteEnrollmentDto {
  // --- Revisión y posible corrección de datos iniciales de la solicitud ---
  @Transform(trimOptional)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  childFirstName?: string;

  @Transform(trimOptional)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  childLastName1?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  @IsOptional()
  childLastName2?: string;

  @IsBoolean()
  @IsOptional()
  hasNoSecondLastName?: boolean;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(250)
  @IsOptional()
  noSecondLastNameJustification?: string;

  @IsDateString()
  @IsOptional()
  childBirthDate?: string;

  @IsEnum([Gender.MASCULINO, Gender.FEMENINO], {
    message: 'El género del educando debe ser Masculino o Femenino.',
  })
  gender: Gender;

  // --- Dirección postal completa (recogida exclusivamente en Inscripción / Censo) ---
  @Transform(trimString)
  @IsString()
  @MinLength(3, { message: 'La dirección principal es obligatoria.' })
  @MaxLength(150)
  streetAddress: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  streetNumber?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  apartmentDoor?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  ApartmentDoor?: string;

  @Transform(trimString)
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, {
    message: 'El código postal debe ser un código español válido de 5 dígitos.',
  })
  postalCode: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'La localidad es obligatoria.' })
  @MaxLength(80)
  municipality: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'La provincia es obligatoria.' })
  @MaxLength(50)
  province: string;

  // --- Revisión de datos de tutores y relación legal ---
  @Transform(trimOptional)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  parent1FirstName?: string;

  @Transform(trimOptional)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  parent1LastName?: string;

  @Transform(cleanPhoneOptional)
  @ValidateIf((o) => Boolean(o.parent1Phone))
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del tutor 1 debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  parent1Phone?: string;

  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.parent1Email))
  @IsEmail({}, { message: 'El correo del tutor 1 no es válido.' })
  @IsOptional()
  parent1Email?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent1Relationship?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent2FirstName?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  parent2LastName?: string;

  @Transform(cleanPhoneOptional)
  @ValidateIf((o) => Boolean(o.parent2Phone))
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del tutor 2 debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  parent2Phone?: string;

  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.parent2Email))
  @IsEmail({}, { message: 'El correo electrónico del segundo tutor no es válido.' })
  @IsOptional()
  parent2Email?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent2Relationship?: string;

  // --- Ampliación Hoja 1: Datos Legales y DNI ---
  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.childDni))
  @Matches(/^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/, {
    message: 'El DNI/NIE del educando no tiene un formato válido.',
  })
  @IsOptional()
  childDni?: string;

  @Transform(cleanPhoneOptional)
  @ValidateIf((o) => Boolean(o.childPhone))
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del educando debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  childPhone?: string;

  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.childEmail))
  @IsEmail({}, { message: 'El correo electrónico del educando no es válido.' })
  @IsOptional()
  childEmail?: string;

  @IsEnum(LegalStatus)
  @IsOptional()
  legalStatus?: LegalStatus;

  @IsEnum(CircularPreference)
  @IsOptional()
  circularPreference?: CircularPreference;

  @Transform(trimString)
  @Matches(/^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/, {
    message: 'El DNI/NIE del tutor 1 es obligatorio y debe tener un formato válido.',
  })
  parent1Dni: string;

  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.parent2Dni))
  @Matches(/^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/, {
    message: 'El DNI/NIE del tutor 2 no tiene un formato válido.',
  })
  @IsOptional()
  parent2Dni?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  parentsMaritalStatus?: string;

  @IsEnum(CustodyType)
  @IsOptional()
  custodyType?: CustodyType;

  // --- Consentimientos separados y trazables ---
  @IsBoolean()
  acceptsDataStorage: boolean;

  @IsBoolean()
  acceptsDataTransfer: boolean;

  @IsBoolean()
  authorizesImages: boolean;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  consentTextVersion?: string;

  // --- Hoja 2: Ficha Médica y Contacto de Emergencia ---
  @Transform(trimOptional)
  @IsString()
  @MaxLength(15)
  @IsOptional()
  bloodType?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  chronicDiseases?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  allergies?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  medHeadache?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  medFever?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  medStomach?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(200)
  @IsOptional()
  medThroat?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(1500)
  @IsOptional()
  medicalObservations?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(120)
  @IsOptional()
  emergencyContactName?: string;

  @Transform(cleanPhoneOptional)
  @ValidateIf((o) => Boolean(o.emergencyContactPhone))
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono de emergencia debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  emergencyContactPhone?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  emergencyContactRelationship?: string;

  @IsBoolean()
  authorizesEmergency: boolean;

  // --- Hoja 3: SEPA / IBAN (Titular independiente) ---
  @Transform(trimString)
  @IsString()
  @IsNotEmpty({ message: 'El titular de la cuenta bancaria es obligatorio.' })
  @MaxLength(120)
  accountHolderName: string;

  @Transform(trimString)
  @Matches(/^(?:\d{8}|[XYZxyz]\d{7})[A-Za-z]$/, {
    message: 'El DNI/NIE del titular bancario es obligatorio y debe ser válido.',
  })
  accountHolderDni: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(150)
  @IsOptional()
  accountHolderAddress?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  accountHolderMunicipality?: string;

  @Transform(trimOptional)
  @ValidateIf((o) => Boolean(o.accountHolderPostalCode))
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, {
    message: 'El código postal del titular bancario debe tener 5 dígitos válidos.',
  })
  @IsOptional()
  accountHolderPostalCode?: string;

  @Transform(cleanIban)
  @IsString()
  @Matches(/^ES\d{22}$/i, {
    message: 'El IBAN debe comenzar por ES seguido de 22 dígitos sin espacios.',
  })
  iban: string;

  @IsBoolean()
  authorizesSepa: boolean;

  // --- Firmas digitales e identidad del firmante ---
  @Transform(trimOptional)
  @IsString()
  @MaxLength(120)
  @IsOptional()
  signer1FullName?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  signer1Dni?: string;

  @IsString()
  @IsNotEmpty({ message: 'La firma del primer tutor/representante es obligatoria.' })
  signatureParent1: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(120)
  @IsOptional()
  signer2FullName?: string;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  signer2Dni?: string;

  @IsString()
  @IsOptional()
  signatureParent2?: string;
}
