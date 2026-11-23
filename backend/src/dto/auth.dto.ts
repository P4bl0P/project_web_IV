import { Transform } from 'class-transformer';
import { IsEmail, IsNotEmpty, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

const trimValue = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim() : value;

const normalizeEmail = ({ value }: { value: unknown }) =>
  typeof value === 'string' ? value.trim().toLowerCase() : value;

export class LoginDto {
  @Transform(normalizeEmail)
  @IsEmail({}, { message: 'Introduce un correo electrónico válido' })
  email: string;

  @IsString({ message: 'La contraseña es obligatoria' })
  @IsNotEmpty({ message: 'La contraseña es obligatoria' })
  @MaxLength(128, { message: 'La contraseña supera el límite permitido' })
  password: string;
}

export class MfaVerifyDto {
  @Transform(trimValue)
  @IsString({ message: 'El reto de autenticación es obligatorio' })
  @IsNotEmpty({ message: 'El reto de autenticación es obligatorio' })
  challenge: string;

  @Transform(trimValue)
  @IsString({ message: 'El código de verificación es obligatorio' })
  @IsNotEmpty({ message: 'El código de verificación es obligatorio' })
  @MaxLength(32, { message: 'Código de verificación demasiado largo' })
  code: string;
}

export class AcceptInvitationDto {
  @IsString({ message: 'La contraseña es obligatoria' })
  @MinLength(15, { message: 'La contraseña debe tener al menos 15 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede superar los 128 caracteres' })
  password: string;
}

export class ChangePasswordDto {
  @IsString({ message: 'La contraseña actual es obligatoria' })
  @IsNotEmpty({ message: 'La contraseña actual es obligatoria' })
  @MaxLength(128)
  currentPassword: string;

  @IsString({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(15, { message: 'La contraseña debe tener al menos 15 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede superar los 128 caracteres' })
  newPassword: string;

  @IsString({ message: 'Debes confirmar la nueva contraseña' })
  @IsNotEmpty({ message: 'Debes confirmar la nueva contraseña' })
  @MaxLength(128)
  confirmPassword: string;
}

export class InitialPasswordDto {
  @IsString({ message: 'La nueva contraseña es obligatoria' })
  @MinLength(15, { message: 'La contraseña debe tener al menos 15 caracteres' })
  @MaxLength(128, { message: 'La contraseña no puede superar los 128 caracteres' })
  newPassword: string;

  @IsString({ message: 'Debes confirmar la nueva contraseña' })
  @IsNotEmpty({ message: 'Debes confirmar la nueva contraseña' })
  @MaxLength(128)
  confirmPassword: string;
}

export class SetupMfaDto {
  @IsOptional()
  @IsString()
  @MaxLength(128)
  currentPassword?: string;
}

export class ConfirmMfaDto {
  @Transform(trimValue)
  @IsString({ message: 'El código MFA es obligatorio' })
  @IsNotEmpty({ message: 'El código MFA es obligatorio' })
  @MaxLength(32)
  code: string;
}
