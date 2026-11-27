import { Transform } from 'class-transformer';
import {
  IsEnum,
  IsInt,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { ClosureReason } from '@prisma/client';
import { trimOptional } from '../../common/dto-transforms.util';

export class OfferSpotDto {
  @IsInt()
  @Min(1)
  @Max(30)
  @IsOptional()
  daysValid?: number;
}

export class DeactivateApplicationDto {
  @IsEnum(ClosureReason, {
    message: 'Debes seleccionar un motivo válido de baja o cierre.',
  })
  closureReason: ClosureReason;

  @Transform(trimOptional)
  @IsString()
  @MaxLength(1000)
  @IsOptional()
  closureNotes?: string;
}

export class ReturnToWaitlistDto {
  @Transform(trimOptional)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  reason?: string;
}

export class ReactivateApplicationDto {
  @Transform(trimOptional)
  @IsString()
  @MaxLength(500)
  @IsOptional()
  notes?: string;
}
