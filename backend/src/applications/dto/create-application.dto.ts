import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from 'class-validator';
import { ScoutBranch } from '@prisma/client';

export class CreateApplicationDto {
  @IsEnum(ScoutBranch, {
    message: 'requestedBranch debe ser CASTOR, LOBATO, RANGER, PIONERO o RUTA',
  })
  requestedBranch!: ScoutBranch;

  @IsString()
  @IsNotEmpty()
  @MinLength(2)
  @MaxLength(150)
  childName!: string;

  @IsDateString({}, { message: 'childBirthDate debe ser una fecha ISO 8601 válida' })
  childBirthDate!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  address!: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  fatherName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  fatherPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  fatherEmail?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  motherName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  motherPhone?: string;

  @IsOptional()
  @IsEmail()
  @MaxLength(150)
  motherEmail?: string;

  @IsString()
  @IsNotEmpty()
  @MinLength(10)
  @MaxLength(2000)
  motivation!: string;

  @IsOptional()
  @IsBoolean()
  hasFamilyInGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  fromAnotherGroup?: boolean;

  @IsOptional()
  @IsBoolean()
  socialInclusion?: boolean;
}