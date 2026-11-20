import { Transform } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';
import { COUNCIL_ROLES, type CouncilRole } from '../council.constants';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

export class CreateCouncilMemberDto {
  @Transform(trimValue)
  @IsString({ message: 'El nombre y apellidos deben ser un texto válido.' })
  @IsNotEmpty({ message: 'El nombre y apellidos son obligatorios.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  fullName: string;

  @Transform(trimValue)
  @IsString({ message: 'El cargo debe ser un texto válido.' })
  @IsIn([...COUNCIL_ROLES], {
    message: 'El cargo debe ser Jefatura, Secretaría o Tesorería.',
  })
  role: CouncilRole;

  @Transform(trimValue)
  @IsOptional()
  @IsString({ message: 'La presentación personal debe ser un texto válido.' })
  @MaxLength(500, {
    message: 'La presentación personal no puede superar los 500 caracteres.',
  })
  personalBio?: string;

  @IsOptional()
  @IsInt({ message: 'El orden de aparición debe ser un número entero.' })
  @Min(0, { message: 'El orden de aparición no puede ser negativo.' })
  displayOrder?: number;
}
