import { Transform } from 'class-transformer';
import {
  ArrayNotEmpty,
  IsArray,
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

export class UpdateCouncilMemberDto {
  @Transform(trimValue)
  @IsOptional()
  @IsString({ message: 'El nombre y apellidos deben ser un texto válido.' })
  @IsNotEmpty({ message: 'El nombre y apellidos no pueden quedar vacíos.' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres.' })
  fullName?: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString({ message: 'El cargo debe ser un texto válido.' })
  @IsIn([...COUNCIL_ROLES], {
    message: 'El cargo debe ser Jefatura, Secretaría o Tesorería.',
  })
  role?: CouncilRole;

  @Transform(trimValue)
  @IsOptional()
  @IsString({ message: 'La presentación personal debe ser un texto válido.' })
  @MaxLength(500, {
    message: 'La presentación personal no puede superar los 500 caracteres.',
  })
  personalBio?: string | null;

  @IsOptional()
  @IsInt({ message: 'El orden de aparición debe ser un número entero.' })
  @Min(0, { message: 'El orden de aparición no puede ser negativo.' })
  displayOrder?: number;
}

export class ReorderCouncilMembersDto {
  @IsArray({ message: 'Debes indicar la lista ordenada de integrantes.' })
  @ArrayNotEmpty({ message: 'La lista de orden no puede estar vacía.' })
  @IsString({ each: true, message: 'Cada identificador debe ser un texto válido.' })
  @IsNotEmpty({ each: true, message: 'Los identificadores no pueden estar vacíos.' })
  orderedIds: string[];
}
