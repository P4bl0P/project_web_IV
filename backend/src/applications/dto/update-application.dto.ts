import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
  ValidateIf,
} from 'class-validator';
import { Gender } from '@prisma/client';

const trimOptionalString = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : undefined;
};

const cleanPhoneOptional = ({ value }: { value: unknown }) => {
  if (typeof value !== 'string') return value;
  const clean = value.replace(/\s+/g, '').trim();
  return clean.length > 0 ? clean : undefined;
};

/**
 * DTO de edición de solicitud en Secretaría.
 * NO permite modificar `status` ni `admittedAt` ni `enrollmentToken` directamente:
 * las transiciones de estado deben pasar por los endpoints específicos de la máquina de estados.
 */
export class UpdateApplicationDto {
  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  childFirstName?: string;

  @Transform(trimOptionalString)
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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(250)
  @IsOptional()
  noSecondLastNameJustification?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MaxLength(120)
  @IsOptional()
  childLastName?: string;

  @IsDateString()
  @IsOptional()
  childBirthDate?: string;

  @IsEnum([Gender.MASCULINO, Gender.FEMENINO], {
    message: 'El género debe ser Masculino o Femenino.',
  })
  @IsOptional()
  gender?: Gender;

  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(60)
  @IsOptional()
  parent1FirstName?: string;

  @Transform(trimOptionalString)
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  @IsOptional()
  parent1LastName?: string;

  @Transform(cleanPhoneOptional)
  @ValidateIf((o) => o.parent1Phone !== undefined)
  @Matches(/^[6789]\d{8}$/, {
    message: 'El teléfono del tutor 1 debe tener 9 dígitos válidos.',
  })
  @IsOptional()
  parent1Phone?: string;

  @Transform(trimOptionalString)
  @ValidateIf((o) => o.parent1Email !== undefined)
  @IsEmail({}, { message: 'El correo electrónico del tutor 1 no es válido.' })
  @IsOptional()
  parent1Email?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent2FirstName?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(100)
  @IsOptional()
  parent2LastName?: string;

  @Transform(({ value }) => (typeof value === 'string' ? value.replace(/\s+/g, '').trim() : value))
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

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  motivation?: string;

  @IsBoolean()
  @IsOptional()
  hasFamilyInGroup?: boolean;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  @IsOptional()
  familyMemberDetails?: string;

  @IsBoolean()
  @IsOptional()
  comesFromOtherGroup?: boolean;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(200)
  @IsOptional()
  originGroupDetails?: string;

  @IsBoolean()
  @IsOptional()
  socialInclusionPriority?: boolean;

  @Transform(({ value }) => (typeof value === 'string' ? value.trim() : value))
  @IsString()
  @MaxLength(2000)
  @IsOptional()
  kraalInternalNotes?: string;
}
