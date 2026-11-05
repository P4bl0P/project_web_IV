import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus, Gender, MemberType } from '@prisma/client';

export class UpdateApplicationDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @IsString()
  @IsOptional()
  childFirstName?: string;

  @IsString()
  @IsOptional()
  childLastName?: string;

  @IsDateString()
  @IsOptional()
  childBirthDate?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

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

  @IsBoolean()
  @IsOptional()
  socialInclusionPriority?: boolean;

  @IsString()
  @IsOptional()
  kraalInternalNotes?: string;

  @IsEnum(MemberType)
  @IsOptional()
  memberType?: MemberType;

  @IsString()
  @IsOptional()
  censusBranch?: string;

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
  parent1FirstName?: string;

  @IsString()
  @IsOptional()
  parent1LastName?: string;

  @IsString()
  @IsOptional()
  parent1Phone?: string;

  @IsString()
  @IsOptional()
  parent1Email?: string;

  @IsString()
  @IsOptional()
  parent2FirstName?: string;

  @IsString()
  @IsOptional()
  parent2LastName?: string;

  @IsString()
  @IsOptional()
  parent2Phone?: string;

  @IsString()
  @IsOptional()
  parent2Email?: string;
}