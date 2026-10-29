import {
  IsBoolean,
  IsDateString,
  IsEmail,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
} from 'class-validator';
import { Gender } from '@prisma/client';

export class CreateApplicationDto {
  @IsString()
  @IsNotEmpty()
  childFirstName: string;

  @IsString()
  @IsNotEmpty()
  childLastName: string;

  @IsDateString()
  childBirthDate: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @IsString()
  @IsNotEmpty()
  streetAddress: string;

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
  @IsNotEmpty()
  parent1FirstName: string;

  @IsString()
  @IsNotEmpty()
  parent1LastName: string;

  @IsString()
  @IsNotEmpty()
  parent1Phone: string;

  @IsEmail()
  parent1Email: string;

  @IsString()
  @IsOptional()
  parent2FirstName?: string;

  @IsString()
  @IsOptional()
  parent2LastName?: string;

  @IsString()
  @IsOptional()
  parent2Phone?: string;

  @IsEmail()
  @IsOptional()
  parent2Email?: string;

  @IsString()
  @IsOptional()
  motivation?: string;

  @IsBoolean()
  @IsOptional()
  hasFamilyInGroup?: boolean;

  @IsString()
  @IsOptional()
  familyMemberDetails?: string;

  @IsBoolean()
  @IsOptional()
  comesFromOtherGroup?: boolean;

  @IsString()
  @IsOptional()
  originGroupDetails?: string;
}