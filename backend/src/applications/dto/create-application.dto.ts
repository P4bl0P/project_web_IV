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
import { Gender } from '@prisma/client';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const cleanPhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\s+/g, '') : value;

const trimOptionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

export class CreateApplicationDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'El nombre del educando debe tener al menos 2 caracteres.' })
  @MaxLength(60, { message: 'El nombre del educando es demasiado largo.' })
  childFirstName: string;

  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2, { message: 'El primer apellido debe tener al menos 2 caracteres.' })
  @MaxLength(60)
  @IsOptional()
  childLastName1?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  childLastName2?: string;

  @IsBoolean()
  @IsOptional()
  hasNoSecondLastName?: boolean;

  @Transform(trimOptionalString)
  @ValidateIf((o) => o.hasNoSecondLastName === true)
  @IsString()
  @MinLength(5, {
    message: 'Debes justificar explícitamente por qué no dispone de segundo apellido.',
  })
  @MaxLength(250)
  noSecondLastNameJustification?: string;

  // Compatibilidad con clientes legados (si no envían childLastName1 desglosado)
  @Transform(trimOptionalString)
  @ValidateIf((o) => !o.childLastName1)
  @IsString()
  @MinLength(2, { message: 'Los apellidos del educando son obligatorios.' })
  @MaxLength(120)
  childLastName?: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no tiene un formato válido.' })
  childBirthDate: string;

  // Opcional en Fase 1 (se solicita oficialmente en Inscripción Fase 2)
  @IsEnum([Gender.MASCULINO, Gender.FEMENINO], {
    message: 'El género debe ser Masculino o Femenino.',
  })
  @IsOptional()
  gender?: Gender;

  // Dirección opcional en Fase 1 (se recoge exclusivamente en Inscripción Fase 2)
  @Transform(trimOptionalString)
  @IsString()
  @MinLength(3)
  @MaxLength(150)
  @IsOptional()
  streetAddress?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  streetNumber?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  apartmentDoor?: string;

  // Compatibilidad temporal con clientes que envíen ApartmentDoor
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  ApartmentDoor?: string;

  @Transform(trimOptionalString)
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, {
    message: 'El código postal debe ser un código español válido de 5 dígitos (ej. 41089).',
  })
  @IsOptional()
  postalCode?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(80)
  @IsOptional()
  municipality?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(50)
  @IsOptional()
  province?: string;

  // Identificador de unidad familiar (para agrupar hermanos reutilizando tutores)
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(80)
  @IsOptional()
  familyUnitId?: string;

  // Tutor principal obligatorio
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'El nombre del tutor principal es obligatorio.' })
  @MaxLength(60)
  parent1FirstName: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'Los apellidos del tutor principal son obligatorios.' })
  @MaxLength(100)
  parent1LastName: string;

  @Transform(cleanPhone)
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del tutor 1 debe ser un número español válido de 9 dígitos.',
  })
  parent1Phone: string;

  @Transform(trimString)
  @IsEmail({}, { message: 'El correo electrónico del tutor 1 no es válido.' })
  @MaxLength(120)
  parent1Email: string;

  // Segundo tutor opcional
  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent2FirstName?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  parent2LastName?: string;

  @Transform(cleanPhone)
  @ValidateIf((o) => Boolean(o.parent2Phone))
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del segundo tutor debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  parent2Phone?: string;

  @Transform(trimOptionalString)
  @ValidateIf((o) => Boolean(o.parent2Email))
  @IsEmail({}, { message: 'El correo electrónico del segundo tutor no es válido.' })
  @IsOptional()
  parent2Email?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(1000, { message: 'La motivación no puede superar los 1000 caracteres.' })
  @IsOptional()
  motivation?: string;

  @IsBoolean()
  @IsOptional()
  hasFamilyInGroup?: boolean;

  @Transform(trimOptionalString)
  @ValidateIf((o) => o.hasFamilyInGroup === true)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar el nombre y vínculo del familiar en el grupo.' })
  @MaxLength(200)
  familyMemberDetails?: string;

  @IsBoolean()
  @IsOptional()
  comesFromOtherGroup?: boolean;

  @Transform(trimOptionalString)
  @ValidateIf((o) => o.comesFromOtherGroup === true)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar de qué grupo scout proviene.' })
  @MaxLength(200)
  originGroupDetails?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(100)
  @IsOptional()
  idempotencyKey?: string;
}
