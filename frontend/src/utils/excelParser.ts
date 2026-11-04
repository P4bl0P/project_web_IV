import * as XLSX from 'xlsx';
import { type ApplicationStatus } from '../services/api';

const normalize = (s: string) =>
  s.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

function getVal(row: Record<string, unknown>, targetNames: string[]): unknown {
  const rowKeys = Object.keys(row);
  for (const target of targetNames) {
    const normTarget = normalize(target);
    const exactKey = rowKeys.find((k) => normalize(k) === normTarget);
    if (exactKey && row[exactKey] !== '') return row[exactKey];

    const partialKey = rowKeys.find((k) => normalize(k).includes(normTarget));
    if (partialKey && row[partialKey] !== '') return row[partialKey];
  }
  return '';
}

function parseExcelDate(raw: unknown): string {
  if (!raw) return '2014-01-01';
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return raw.toISOString().split('T')[0];
  }
  if (typeof raw === 'number') {
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const parsed = new Date(excelEpoch.getTime() + raw * 86400000);
    if (!isNaN(parsed.getTime())) return parsed.toISOString().split('T')[0];
  }
  const str = String(raw).trim();
  const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
  if (dmyMatch) {
    const day = dmyMatch[1].padStart(2, '0');
    const month = dmyMatch[2].padStart(2, '0');
    const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
    return `${year}-${month}-${day}`;
  }
  const fallback = new Date(str);
  return !isNaN(fallback.getTime()) ? fallback.toISOString().split('T')[0] : '2014-01-01';
}

export async function parseScoutExcelFile(
  file: File,
  targetStatus: ApplicationStatus,
): Promise<Record<string, unknown>[]> {
  const arrayBuffer = await file.arrayBuffer();
  const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
  const worksheet = workbook.Sheets[workbook.SheetNames[0]];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, { defval: '' });

  return rawRows
    .map((row) => {
      const childFirstName = String(getVal(row, ['NOMBRE', 'NOMBRE DEL SOLICITANTE'])).trim();
      const childLastName = String(getVal(row, ['APELLIDOS'])).trim();
      if (!childFirstName && !childLastName) return null;

      const childDni = String(getVal(row, ['DNI', 'NIF'])).trim().toUpperCase();
      const childBirthDate = parseExcelDate(getVal(row, ['FECHA NACIMIENTO', 'FECHA DE NACIMIENTO']));
      const email = String(getVal(row, ['E-MAIL', 'EMAIL', 'CORREO'])).trim() || 'censo@scoutsmontequinto.es';
      const streetAddress = String(getVal(row, ['DIRECCIÓN', 'DIRECCION', 'DOMICILIO'])).trim() || 'Sin especificar';
      const municipality = String(getVal(row, ['LOCALIDAD', 'MUNICIPIO', 'POBLACION'])).trim() || 'Dos Hermanas';

      const rawPhoneStr = String(getVal(row, ['TELÉFONO', 'TELEFONO', 'MOVIL'])).split(/[/-]/)[0];
      const cleanPhone = rawPhoneStr.replace(/\D/g, '').slice(-9);
      const parent1Phone = cleanPhone.length === 9 ? cleanPhone : '600000000';
      const parent1FirstName = String(getVal(row, ['NOMBRE PADRE', 'TUTOR'])).trim() || `Familia de ${childFirstName}`;

      return {
        childFirstName: childFirstName || 'Sin nombre',
        childLastName: childLastName || 'Sin apellidos',
        childBirthDate,
        gender: 'MASCULINO',
        streetAddress,
        postalCode: municipality.toLowerCase().includes('montequinto') ? '41089' : '41700',
        municipality,
        province: 'Sevilla',
        parent1FirstName,
        parent1LastName: childLastName || 'Censo',
        parent1Phone,
        parent1Email: email,
        childDni: childDni || undefined,
        status: targetStatus,
      };
    })
    .filter(Boolean) as Record<string, unknown>[];
}