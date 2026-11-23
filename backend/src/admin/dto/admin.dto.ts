import { Transform, Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEmail,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const trimOptional = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() || undefined : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

const emptyToNull = ({ value }: { value: unknown }) => {
  if (value === undefined) return undefined;
  if (value === null) return null;
  if (typeof value === 'string') {
    const trimmed = value.trim();
    return trimmed ? trimmed : null;
  }
  return value;
};

export class CreateUserDto {
  @Transform(trimValue)
  @IsString({ message: 'El nombre es obligatorio' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @MaxLength(120, { message: 'El nombre no puede superar los 120 caracteres' })
  name: string;

  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Introduce un correo electrónico válido' })
  @MaxLength(180)
  email: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString({ message: 'El cargo debe ser un identificador válido' })
  roleId?: string | null;
}

export class UpdateUserDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString({ message: 'El nombre debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre no puede quedar vacío' })
  @MaxLength(120)
  name?: string;

  @Transform(normalizeEmail)
  @IsOptional()
  @IsEmail({}, { message: 'Introduce un correo electrónico válido' })
  @MaxLength(180)
  email?: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString({ message: 'El cargo debe ser un identificador válido' })
  roleId?: string | null;

  @IsOptional()
  @IsIn(['ACTIVE', 'BLOCKED', 'DISABLED'], {
    message: 'El estado debe ser ACTIVE, BLOCKED o DISABLED',
  })
  status?: 'ACTIVE' | 'BLOCKED' | 'DISABLED';
}

export class CreateRoleDto {
  @Transform(trimValue)
  @IsString({ message: 'El nombre del cargo es obligatorio' })
  @IsNotEmpty({ message: 'El nombre del cargo es obligatorio' })
  @MaxLength(80, { message: 'El nombre del cargo no puede superar los 80 caracteres' })
  name: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300, { message: 'La descripción no puede superar los 300 caracteres' })
  description?: string | null;
}

export class UpdateRoleDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString({ message: 'El nombre del cargo debe ser un texto válido' })
  @IsNotEmpty({ message: 'El nombre del cargo no puede quedar vacío' })
  @MaxLength(80)
  name?: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;
}

export class RolePermissionItemDto {
  @IsString()
  @IsNotEmpty()
  moduleId: string;

  @IsBoolean()
  canAccess: boolean;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(32)
  specialPermissions?: string[];
}

export class UpdateRolePermissionsDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => RolePermissionItemDto)
  @ArrayMaxSize(100)
  permissions: RolePermissionItemDto[];
}

export class UpdatePermissionDto {
  @IsOptional()
  @IsBoolean()
  canAccess?: boolean;

  @IsOptional()
  @IsBoolean()
  canRead?: boolean;

  @IsOptional()
  @IsBoolean()
  canCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  canUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  canDelete?: boolean;

  @IsOptional()
  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(32)
  specialPermissions?: string[];
}

export class SpecialActionItemDto {
  @Transform(trimValue)
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-z0-9_]+$/, {
    message: 'La clave de la acción especial debe usar minúsculas, números o guion bajo',
  })
  @MaxLength(60)
  key: string;

  @Transform(trimValue)
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  label: string;

  @Transform(trimValue)
  @IsOptional()
  @IsString()
  @MaxLength(200)
  description?: string;
}

export class CreateModuleDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @Matches(/^[a-z0-9-]+$/, {
    message: 'La clave del módulo solo admite minúsculas, números y guiones',
  })
  @MaxLength(60)
  key?: string;

  @Transform(trimValue)
  @IsString({ message: 'El nombre del módulo es obligatorio' })
  @IsNotEmpty({ message: 'El nombre del módulo es obligatorio' })
  @MaxLength(80)
  name: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @MaxLength(120)
  route?: string;

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @MaxLength(40)
  icon?: string;

  @IsOptional()
  @IsBoolean()
  isImplemented?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  supportsRead?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsDelete?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialActionItemDto)
  @ArrayMaxSize(20)
  specialActions?: SpecialActionItemDto[];
}

export class UpdateModuleDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  name?: string;

  @Transform(emptyToNull)
  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string | null;

  @IsOptional()
  @IsBoolean()
  isImplemented?: boolean;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(999)
  displayOrder?: number;

  @IsOptional()
  @IsBoolean()
  supportsRead?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsCreate?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsUpdate?: boolean;

  @IsOptional()
  @IsBoolean()
  supportsDelete?: boolean;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => SpecialActionItemDto)
  @ArrayMaxSize(20)
  specialActions?: SpecialActionItemDto[];
}

export class QueryAuditDto {
  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  action?: string;

  @IsOptional()
  @IsIn(['ALLOWED', 'DENIED'])
  result?: 'ALLOWED' | 'DENIED';

  @Transform(trimOptional)
  @IsOptional()
  @IsString()
  @MaxLength(80)
  targetType?: string;

  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(500)
  limit?: number;
}
