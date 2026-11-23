import { Injectable, Logger } from '@nestjs/common';
import {
  createCipheriv,
  createDecipheriv,
  createHash,
  randomBytes,
} from 'node:crypto';

const ENCRYPTED_PREFIX = 'enc:v1:';
const DEV_FALLBACK_SEED = 'grupo-scout-iv-dev-test-only-encryption-seed';

@Injectable()
export class SensitiveDataService {
  private readonly logger = new Logger(SensitiveDataService.name);
  private warnedFallback = false;

  private getKey(): Buffer {
    const raw = process.env.DATA_ENCRYPTION_KEY || process.env.MFA_ENCRYPTION_KEY;
    if (raw) {
      const decoded = Buffer.from(raw, 'base64');
      if (decoded.length === 32) {
        return decoded;
      }
      if (process.env.NODE_ENV === 'production') {
        throw new Error(
          'DATA_ENCRYPTION_KEY / MFA_ENCRYPTION_KEY debe ser una clave de 32 bytes codificada en base64.',
        );
      }
    } else if (process.env.NODE_ENV === 'production') {
      throw new Error(
        'En producción es obligatorio configurar DATA_ENCRYPTION_KEY o MFA_ENCRYPTION_KEY.',
      );
    }

    if (!this.warnedFallback && process.env.NODE_ENV !== 'test') {
      this.logger.warn(
        'Usando clave de cifrado de desarrollo local. Configura DATA_ENCRYPTION_KEY o MFA_ENCRYPTION_KEY en producción.',
      );
      this.warnedFallback = true;
    }

    return createHash('sha256').update(DEV_FALLBACK_SEED).digest();
  }

  encrypt(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const trimmed = value.trim();
    if (!trimmed) return null;
    if (trimmed.startsWith(ENCRYPTED_PREFIX)) return trimmed;

    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getKey(), iv);
    const encrypted = Buffer.concat([cipher.update(trimmed, 'utf8'), cipher.final()]);
    const tag = cipher.getAuthTag();
    return `${ENCRYPTED_PREFIX}${iv.toString('base64')}.${tag.toString('base64')}.${encrypted.toString('base64')}`;
  }

  decrypt(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    if (!value.startsWith(ENCRYPTED_PREFIX)) {
      // Compatibilidad con registros históricos almacenados antes del cifrado
      return value;
    }
    const payload = value.slice(ENCRYPTED_PREFIX.length);
    const parts = payload.split('.');
    if (parts.length !== 3) {
      throw new Error('Formato de dato cifrado inválido.');
    }
    const [ivB64, tagB64, bodyB64] = parts;
    const iv = Buffer.from(ivB64, 'base64');
    const tag = Buffer.from(tagB64, 'base64');
    const body = Buffer.from(bodyB64, 'base64');
    const decipher = createDecipheriv('aes-256-gcm', this.getKey(), iv);
    decipher.setAuthTag(tag);
    return Buffer.concat([decipher.update(body), decipher.final()]).toString('utf8');
  }

  /**
   * Hash determinista SHA-256 para búsquedas de tokens e índices únicos (ej. DNI del educando).
   */
  hashDeterministic(value: string | null | undefined): string | null {
    if (value === null || value === undefined) return null;
    const normalized = value.trim();
    if (!normalized) return null;
    return createHash('sha256').update(normalized).digest('hex');
  }

  hashDni(dni: string | null | undefined): string | null {
    if (dni === null || dni === undefined) return null;
    const normalized = dni.trim().toUpperCase();
    if (!normalized) return null;
    return this.hashDeterministic(normalized);
  }

  extractIbanLast4(iban: string | null | undefined): string | null {
    if (!iban) return null;
    const clean = iban.replace(/\s+/g, '').toUpperCase();
    return clean.length >= 4 ? clean.slice(-4) : null;
  }

  maskIban(ibanLast4: string | null | undefined): string {
    if (!ibanLast4) return 'ES** **** **** **** **** ****';
    return `ES** **** **** **** **** ${ibanLast4}`;
  }

  maskDni(dni: string | null | undefined): string | null {
    if (!dni) return null;
    const clean = dni.trim().toUpperCase();
    if (clean.length <= 4) return '****';
    return `${'*'.repeat(clean.length - 4)}${clean.slice(-4)}`;
  }
}
