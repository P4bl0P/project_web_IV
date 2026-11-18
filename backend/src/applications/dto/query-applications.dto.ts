import {
  IsBooleanString,
  IsDateString,
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { ApplicationStatus, Gender } from '@prisma/client';

export type SortField =
  | 'priority'
  | 'childFirstName'
  | 'childLastName'
  | 'age'
  | 'childBirthDate'
  | 'admittedAt'
  | 'branch'
  | 'createdAt';

export type SortOrder = 'asc' | 'desc';

export type RecordStage = 'INITIAL' | 'WAITLIST' | 'PENDING_ENROLLMENT' | 'CENSUS' | 'ARCHIVED';

const toOptionalNumber = ({ value }: { value: unknown }) => {
  if (value === undefined || value === null || value === '') return undefined;
  const parsed = Number(value);
  return Number.isNaN(parsed) ? value : parsed;
};

const trimOptional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

export class QueryApplicationsDto {
  @IsEnum(ApplicationStatus)
  @IsOptional()
  status?: ApplicationStatus;

  @Transform(({ value }) => {
    if (!value) return undefined;
    if (Array.isArray(value)) return value;
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);
    }
    return undefined;
  })
  @IsEnum(ApplicationStatus, { each: true })
  @IsOptional()
  statuses?: ApplicationStatus[];

  @IsString()
  @IsOptional()
  stage?: RecordStage;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  search?: string;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  branch?: string;

  @IsEnum(Gender)
  @IsOptional()
  gender?: Gender;

  @Transform(toOptionalNumber)
  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  minAge?: number;

  @Transform(toOptionalNumber)
  @IsInt()
  @Min(0)
  @Max(99)
  @IsOptional()
  maxAge?: number;

  @IsDateString()
  @IsOptional()
  birthDateFrom?: string;

  @IsDateString()
  @IsOptional()
  birthDateTo?: string;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  tutorName?: string;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  email?: string;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  phone?: string;

  @IsDateString()
  @IsOptional()
  admittedFrom?: string;

  @IsDateString()
  @IsOptional()
  admittedTo?: string;

  @IsBooleanString()
  @IsOptional()
  incompleteOnly?: string;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  sortBy?: SortField;

  @Transform(trimOptional)
  @IsString()
  @IsOptional()
  sortOrder?: SortOrder;

  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  @IsOptional()
  page?: number;

  @Transform(toOptionalNumber)
  @IsInt()
  @Min(1)
  @Max(500)
  @IsOptional()
  pageSize?: number;
}
