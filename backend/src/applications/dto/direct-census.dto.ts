import { IntersectionType, OmitType, PartialType, PickType } from '@nestjs/mapped-types';
import { Transform } from 'class-transformer';
import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  MinLength,
} from 'class-validator';
import { CompleteEnrollmentDto } from './complete-enrollment.dto';
import { CreateApplicationDto } from './create-application.dto';

const trimString = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const cleanPhone = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.replace(/\s+/g, '') : value;

class DirectCensusBaseDto extends IntersectionType(
  OmitType(CompleteEnrollmentDto, [
    'childFirstName',
    'childLastName1',
    'childLastName2',
    'hasNoSecondLastName',
    'noSecondLastNameJustification',
    'childBirthDate',
    'parent1FirstName',
    'parent1LastName',
    'parent1Phone',
    'parent1Email',
  ] as const),
  PickType(CreateApplicationDto, [
    'childLastName1',
    'childLastName2',
    'hasNoSecondLastName',
    'noSecondLastNameJustification',
    'childLastName',
    'familyUnitId',
    'motivation',
    'hasFamilyInGroup',
    'familyMemberDetails',
    'comesFromOtherGroup',
    'originGroupDetails',
    'idempotencyKey',
  ] as const),
) {
  @Transform(trimString)
  @IsString()
  @MinLength(2, { message: 'El nombre del educando debe tener al menos 2 caracteres.' })
  @MaxLength(60)
  childFirstName: string;

  @IsDateString({}, { message: 'La fecha de nacimiento no tiene un formato válido.' })
  childBirthDate: string;

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
}

export class CreateDirectCensusDto extends DirectCensusBaseDto {
  @IsBoolean()
  @IsOptional()
  allowAdultResponsables?: boolean;
}

export class UpdateCensusDto extends PartialType(
  OmitType(DirectCensusBaseDto, ['signatureParent1', 'signatureParent2'] as const),
) {
  @IsBoolean()
  @IsOptional()
  socialInclusionPriority?: boolean;

  @IsString()
  @IsOptional()
  kraalInternalNotes?: string;
}
