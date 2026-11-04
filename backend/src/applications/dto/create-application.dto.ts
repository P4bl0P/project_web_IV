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

export class CreateApplicationDto {
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'El nombre del menor debe tener al menos 2 caracteres.' })
  @MaxLength(60, { message: 'El nombre del menor es demasiado largo.' })
  childFirstName: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'Los apellidos del menor deben tener al menos 2 caracteres.' })
  @MaxLength(100, { message: 'Los apellidos del menor son demasiado largos.' })
  childLastName: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no tiene un formato válido.' })
  childBirthDate: string;

  @IsEnum(Gender, { message: 'El género seleccionado no es válido.' })
  @IsOptional()
  gender?: Gender;

  @Transform(trimString)
  @IsString()
  @MinLength(3, { message: 'La dirección debe tener al menos 3 caracteres.' })
  @MaxLength(150)
  streetAddress: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(20)
  @IsOptional()
  streetNumber?: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(30)
  @IsOptional()
  ApartmentDoor?: string;

  @Transform(trimString)
  @Matches(/^(?:0[1-9]|[1-4]\d|5[0-2])\d{3}$/, {
    message: 'El código postal debe ser un código español válido de 5 dígitos (ej. 41089).',
  })
  postalCode: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'El municipio es obligatorio.' })
  @MaxLength(80)
  municipality: string;

  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'La provincia es obligatoria.' })
  @MaxLength(50)
  province: string;

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

  @Transform(trimString)
  @IsString()
  @MaxLength(60)
  @IsOptional()
  parent2FirstName?: string;

  @Transform(trimString)
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

  @Transform(trimString)
  @ValidateIf((o) => Boolean(o.parent2Email))
  @IsEmail({}, { message: 'El correo electrónico del segundo tutor no es válido.' })
  @IsOptional()
  parent2Email?: string;

  @Transform(trimString)
  @IsString()
  @MaxLength(1000, { message: 'La motivación no puede superar los 1000 caracteres.' })
  @IsOptional()
  motivation?: string;

  @IsBoolean()
  @IsOptional()
  hasFamilyInGroup?: boolean;

  @Transform(trimString)
  @ValidateIf((o) => o.hasFamilyInGroup === true)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar el nombre y vínculo del familiar en el grupo.' })
  @MaxLength(200)
  familyMemberDetails?: string;

  @IsBoolean()
  @IsOptional()
  comesFromOtherGroup?: boolean;

  @Transform(trimString)
  @ValidateIf((o) => o.comesFromOtherGroup === true)
  @IsString()
  @IsNotEmpty({ message: 'Debes indicar de qué grupo scout proviene.' })
  @MaxLength(200)
  originGroupDetails?: string;
}