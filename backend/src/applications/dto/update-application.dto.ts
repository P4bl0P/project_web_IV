import { IsBoolean, IsDateString, IsEnum, IsOptional, IsString } from 'class-validator';
import { ApplicationStatus, Gender } from '@prisma/client';

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
}