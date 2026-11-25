import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFImage, type PDFPage } from 'pdf-lib';
import { type ApplicantRecord } from '../services/api';
import { MONTH_NAMES_ES, getTodayLocalParts, pad2, type LocalDateParts } from './dateUtils';
import { extractDateParts } from './scoutBranch';

const TEMPLATE_URL = '/templates/HOJA_DE_INSCRIPCION_SCOUT.pdf';
const GROUP_SCOUT_NAME = 'IV San José de Calasanz';
const DEFAULT_SIGN_PLACE = 'Huelva';
const TEXT_COLOR = rgb(0.08, 0.11, 0.18);

export type TextAlign = 'left' | 'center' | 'right';

export interface PdfTextFieldConfig {
  page: 1 | 2 | 3;
  x: number;
  y: number;
  maxWidth: number;
  fontSize: number;
  minFontSize?: number;
  align?: TextAlign;
  maxLines?: number;
  lineHeight?: number;
}

export interface PdfCheckboxConfig {
  page: 1 | 2 | 3;
  x: number;
  y: number;
  size: number;
}

export interface PdfSignatureBoxConfig {
  page: 1 | 2 | 3;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface PdfIbanGridConfig {
  page: 3;
  startX: number;
  endX: number;
  cells: number;
  y: number;
  fontSize: number;
}

/**
 * Configuración centralizada de coordenadas en puntos PDF (origen inferior-izquierdo).
 * La plantilla oficial tiene 3 páginas A4 verticales de 595.20 x 841.92 pt sin campos AcroForm.
 */
export const PDF_LAYOUT_CONFIG = {
  page1: {
    groupName: { page: 1, x: 92, y: 735, maxWidth: 480, fontSize: 9, minFontSize: 7 },
    childFirstName: { page: 1, x: 66, y: 703, maxWidth: 126, fontSize: 8.5, minFontSize: 6.5 },
    childLastNames: { page: 1, x: 256, y: 703, maxWidth: 318, fontSize: 8.5, minFontSize: 6.2 },
    childBirthDate: { page: 1, x: 125, y: 687, maxWidth: 130, fontSize: 8.5, minFontSize: 7 },
    childAge: { page: 1, x: 300, y: 687, maxWidth: 70, fontSize: 8.5, minFontSize: 7 },
    childDni: { page: 1, x: 412, y: 687, maxWidth: 160, fontSize: 8.5, minFontSize: 7 },
    streetAddress: { page: 1, x: 76, y: 670, maxWidth: 295, fontSize: 8.5, minFontSize: 6.2 },
    streetNumber: { page: 1, x: 405, y: 670, maxWidth: 60, fontSize: 8.5, minFontSize: 6.5 },
    apartmentDoor: { page: 1, x: 502, y: 670, maxWidth: 72, fontSize: 8.5, minFontSize: 6.5 },
    postalCode: { page: 1, x: 42, y: 653, maxWidth: 66, fontSize: 8.5, minFontSize: 7 },
    municipality: { page: 1, x: 174, y: 653, maxWidth: 208, fontSize: 8.5, minFontSize: 6.5 },
    province: { page: 1, x: 455, y: 653, maxWidth: 118, fontSize: 8.5, minFontSize: 6.5 },
    phone1: { page: 1, x: 82, y: 637, maxWidth: 88, fontSize: 8.5, minFontSize: 7 },
    phone2: { page: 1, x: 242, y: 637, maxWidth: 94, fontSize: 8.5, minFontSize: 7 },
    email: { page: 1, x: 384, y: 637, maxWidth: 190, fontSize: 8.5, minFontSize: 6 },
    legalStatusChecks: {
      MAYOR: { page: 1, x: 12.2, y: 608.5, size: 7.5 },
      EMANCIPADO: { page: 1, x: 116.5, y: 608.5, size: 7.5 },
      MENOR: { page: 1, x: 282.2, y: 608.5, size: 7.5 },
    },
    parentsMaritalStatus: { page: 1, x: 90, y: 571, maxWidth: 480, fontSize: 8.5, minFontSize: 6.5 },
    custodyChecks: {
      TUTELA_LEGAL: { page: 1, x: 12.2, y: 538.5, size: 7.5 },
      CUSTODIA_UNICA: { page: 1, x: 93.5, y: 538.5, size: 7.5 },
      CUSTODIA_CONJUNTA: { page: 1, x: 191.0, y: 538.5, size: 7.5 },
    },
    parent1FirstName: { page: 1, x: 66, y: 496, maxWidth: 104, fontSize: 8.5, minFontSize: 6.5 },
    parent1LastName: { page: 1, x: 238, y: 496, maxWidth: 336, fontSize: 8.5, minFontSize: 6.2 },
    parent1Phone: { page: 1, x: 56, y: 480, maxWidth: 114, fontSize: 8.5, minFontSize: 7 },
    parent1Email: { page: 1, x: 218, y: 480, maxWidth: 218, fontSize: 8.5, minFontSize: 6 },
    parent1Dni: { page: 1, x: 472, y: 480, maxWidth: 102, fontSize: 8.5, minFontSize: 7 },
    parent2FirstName: { page: 1, x: 66, y: 463, maxWidth: 104, fontSize: 8.5, minFontSize: 6.5 },
    parent2LastName: { page: 1, x: 238, y: 463, maxWidth: 336, fontSize: 8.5, minFontSize: 6.2 },
    parent2Phone: { page: 1, x: 56, y: 446, maxWidth: 114, fontSize: 8.5, minFontSize: 7 },
    parent2Email: { page: 1, x: 218, y: 446, maxWidth: 218, fontSize: 8.5, minFontSize: 6 },
    parent2Dni: { page: 1, x: 472, y: 446, maxWidth: 102, fontSize: 8.5, minFontSize: 7 },
    circularChecks: {
      EMAIL: { page: 1, x: 292.5, y: 429.5, size: 7.5 },
      CORREO_POSTAL: { page: 1, x: 336.0, y: 429.5, size: 7.5 },
    },
    declarationAdult: {
      acceptsDataStorage: { page: 1, x: 18.2, y: 145.5, size: 7 },
      acceptsDataTransfer: { page: 1, x: 18.2, y: 129.0, size: 7 },
      deniesImages: { page: 1, x: 18.2, y: 119.5, size: 7 },
      signPlaceAndDay: { page: 1, x: 148, y: 102.5, maxWidth: 52, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signMonth: { page: 1, x: 213, y: 102.5, maxWidth: 42, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signYear: { page: 1, x: 267, y: 102.5, maxWidth: 22, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signature1: { page: 1, x: 40, y: 76, width: 110, height: 22 },
      signer1Dni: { page: 1, x: 31, y: 71, maxWidth: 95, fontSize: 7.5, minFontSize: 6 },
    },
    declarationMinor: {
      representative1Name: { page: 1, x: 326, y: 396.5, maxWidth: 96, fontSize: 6.5, minFontSize: 4.5 },
      representative2Name: { page: 1, x: 446, y: 396.5, maxWidth: 130, fontSize: 6.5, minFontSize: 4.5 },
      acceptsDataStorage: { page: 1, x: 297.8, y: 136.5, size: 7 },
      acceptsDataTransfer: { page: 1, x: 297.8, y: 120.2, size: 7 },
      deniesImages: { page: 1, x: 297.8, y: 110.5, size: 7 },
      signPlaceAndDay: { page: 1, x: 444, y: 96.5, maxWidth: 50, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signMonth: { page: 1, x: 507, y: 96.5, maxWidth: 42, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signYear: { page: 1, x: 561, y: 96.5, maxWidth: 22, fontSize: 7, minFontSize: 5.5, align: 'center' as const },
      signature1: { page: 1, x: 322, y: 74, width: 92, height: 20 },
      signer1Dni: { page: 1, x: 316, y: 70, maxWidth: 95, fontSize: 7.5, minFontSize: 6 },
      signature2: { page: 1, x: 448, y: 74, width: 92, height: 20 },
      signer2Dni: { page: 1, x: 442, y: 70, maxWidth: 95, fontSize: 7.5, minFontSize: 6 },
    },
  },
  page2: {
    childFullName: { page: 2, x: 198, y: 678, maxWidth: 308, fontSize: 9, minFontSize: 6.5 },
    groupName: { page: 2, x: 138, y: 650, maxWidth: 156, fontSize: 8.5, minFontSize: 6.5 },
    branch: { page: 2, x: 372, y: 650, maxWidth: 134, fontSize: 8.5, minFontSize: 6.5 },
    bloodType: { page: 2, x: 198, y: 622, maxWidth: 96, fontSize: 9, minFontSize: 7 },
    emergencyContact: {
      page: 2,
      x: 372,
      y: 625,
      maxWidth: 134,
      fontSize: 8,
      minFontSize: 6.2,
      maxLines: 2,
      lineHeight: 9.5,
    },
    chronicDiseases: {
      page: 2,
      x: 198,
      y: 565,
      maxWidth: 308,
      fontSize: 8,
      minFontSize: 6.5,
      maxLines: 5,
      lineHeight: 10.5,
    },
    allergies: {
      page: 2,
      x: 198,
      y: 502,
      maxWidth: 308,
      fontSize: 8,
      minFontSize: 6.5,
      maxLines: 5,
      lineHeight: 10.5,
    },
    medHeadache: { page: 2, x: 198, y: 430, maxWidth: 308, fontSize: 8.5, minFontSize: 6.5 },
    medFever: { page: 2, x: 198, y: 405, maxWidth: 308, fontSize: 8.5, minFontSize: 6.5 },
    medStomach: { page: 2, x: 198, y: 381, maxWidth: 308, fontSize: 8.5, minFontSize: 6.5 },
    medThroat: { page: 2, x: 198, y: 355, maxWidth: 308, fontSize: 8.5, minFontSize: 6.5 },
    medicalObservations: {
      page: 2,
      x: 198,
      y: 326,
      maxWidth: 308,
      fontSize: 8,
      minFontSize: 6.5,
      maxLines: 5,
      lineHeight: 10.5,
    },
    signature: { page: 2, x: 355, y: 140, width: 150, height: 48 },
    signedDate: { page: 2, x: 408, y: 121, maxWidth: 95, fontSize: 9, minFontSize: 7 },
  },
  page3: {
    accountHolderName: { page: 3, x: 198, y: 700, maxWidth: 306, fontSize: 9, minFontSize: 6.5 },
    accountHolderDni: { page: 3, x: 112, y: 670, maxWidth: 392, fontSize: 9, minFontSize: 7 },
    childFullName: { page: 3, x: 206, y: 646, maxWidth: 298, fontSize: 9, minFontSize: 6.5 },
    accountHolderAddress: { page: 3, x: 146, y: 616, maxWidth: 358, fontSize: 8.5, minFontSize: 6.2 },
    accountHolderMunicipality: { page: 3, x: 148, y: 591, maxWidth: 248, fontSize: 9, minFontSize: 6.5 },
    accountHolderPostalCode: { page: 3, x: 424, y: 591, maxWidth: 80, fontSize: 9, minFontSize: 7 },
    ibanGrid: {
      page: 3,
      startX: 114.8,
      endX: 509.8,
      cells: 22,
      y: 556,
      fontSize: 10,
    },
    signedDate: { page: 3, x: 124, y: 529, maxWidth: 200, fontSize: 9, minFontSize: 7 },
    signature: { page: 3, x: 205, y: 452, width: 210, height: 60 },
    groupNameInText: {
      page: 3,
      x: 232,
      y: 425,
      maxWidth: 126,
      fontSize: 8.5,
      minFontSize: 6.5,
      align: 'center' as const,
    },
  },
} as const;

const WIN_ANSI_FALLBACKS: Record<string, string> = {
  '\u2018': "'",
  '\u2019': "'",
  '\u201C': '"',
  '\u201D': '"',
  '\u2013': '-',
  '\u2014': '-',
  '\u2026': '...',
  '\u00A0': ' ',
  '\u2022': '*',
};

function sanitizePdfText(raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  const str = String(raw).normalize('NFC').replace(/\r\n?/g, '\n').trim();
  if (!str) return '';

  let sanitized = '';
  for (const ch of str) {
    if (ch === '\n') {
      sanitized += ch;
      continue;
    }
    const mapped = WIN_ANSI_FALLBACKS[ch] ?? ch;
    const code = mapped.codePointAt(0) ?? 0;
    // WinAnsi printable ASCII + Latin-1 supplement + Euro sign
    if ((code >= 0x20 && code <= 0x7e) || (code >= 0xa0 && code <= 0xff) || code === 0x20ac) {
      sanitized += mapped;
    } else if (/^\s$/.test(mapped)) {
      sanitized += ' ';
    } else {
      const asciiFolded = mapped.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
      const foldedCode = asciiFolded.codePointAt(0) ?? 0;
      if (foldedCode >= 0x20 && foldedCode <= 0x7e) {
        sanitized += asciiFolded;
      }
    }
  }
  return sanitized.trim();
}

function cleanFileName(valueToClean: string): string {
  return valueToClean
    .trim()
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveDateParts(input?: string | Date | null): LocalDateParts {
  if (input) {
    const parts = extractDateParts(input);
    if (parts) return parts;
  }
  return getTodayLocalParts();
}

function formatDisplayDate(input?: string | Date | null): string {
  if (!input) return '';
  const parts = extractDateParts(input);
  if (!parts) return '';
  return `${pad2(parts.day)}/${pad2(parts.month)}/${parts.year}`;
}

function computeAgeFromParts(birth: LocalDateParts, reference: LocalDateParts): number {
  let age = reference.year - birth.year;
  if (
    reference.month < birth.month ||
    (reference.month === birth.month && reference.day < birth.day)
  ) {
    age -= 1;
  }
  return Math.max(0, age);
}

function resolveChildAge(record: ApplicantRecord): string {
  if (typeof record.currentAge === 'number' && Number.isFinite(record.currentAge) && record.currentAge >= 0) {
    return String(record.currentAge);
  }
  const birth = record.childBirthDate ? extractDateParts(record.childBirthDate) : null;
  if (!birth) return '';
  return String(computeAgeFromParts(birth, getTodayLocalParts()));
}

function fitTextToWidth(
  font: PDFFont,
  text: string,
  maxWidth: number,
  fontSize: number,
  minFontSize: number,
): { text: string; size: number } {
  let currentSize = fontSize;
  while (currentSize > minFontSize && font.widthOfTextAtSize(text, currentSize) > maxWidth) {
    currentSize = Math.max(minFontSize, Number((currentSize - 0.25).toFixed(2)));
  }

  let output = text;
  if (font.widthOfTextAtSize(output, currentSize) > maxWidth) {
    const ellipsis = '...';
    while (output.length > 1 && font.widthOfTextAtSize(`${output}${ellipsis}`, currentSize) > maxWidth) {
      output = output.slice(0, -1);
    }
    output = `${output.trimEnd()}${ellipsis}`;
  }

  return { text: output, size: currentSize };
}

function drawConfiguredText(
  page: PDFPage,
  font: PDFFont,
  config: PdfTextFieldConfig,
  rawText: unknown,
): void {
  const clean = sanitizePdfText(rawText).replace(/\n+/g, ' ');
  if (!clean) return;

  const { text, size } = fitTextToWidth(
    font,
    clean,
    config.maxWidth,
    config.fontSize,
    config.minFontSize ?? 6,
  );

  const textWidth = font.widthOfTextAtSize(text, size);
  let drawX = config.x;
  if (config.align === 'center') {
    drawX = config.x + (config.maxWidth - textWidth) / 2;
  } else if (config.align === 'right') {
    drawX = config.x + config.maxWidth - textWidth;
  }

  page.drawText(text, {
    x: drawX,
    y: config.y,
    size,
    font,
    color: TEXT_COLOR,
  });
}

function breakLongWord(word: string, font: PDFFont, size: number, maxWidth: number): string[] {
  const chunks: string[] = [];
  let current = '';
  for (const ch of word) {
    const candidate = `${current}${ch}`;
    if (font.widthOfTextAtSize(candidate, size) > maxWidth && current) {
      chunks.push(current);
      current = ch;
    } else {
      current = candidate;
    }
  }
  if (current) chunks.push(current);
  return chunks;
}

function wrapTextIntoLines(
  font: PDFFont,
  text: string,
  maxWidth: number,
  size: number,
): string[] {
  const paragraphs = text.split('\n');
  const lines: string[] = [];

  for (const paragraph of paragraphs) {
    const trimmed = paragraph.trim();
    if (!trimmed) continue;

    const words = trimmed.split(/\s+/);
    let currentLine = '';

    for (const word of words) {
      const candidate = currentLine ? `${currentLine} ${word}` : word;
      if (font.widthOfTextAtSize(candidate, size) <= maxWidth) {
        currentLine = candidate;
        continue;
      }

      if (currentLine) {
        lines.push(currentLine);
      }

      if (font.widthOfTextAtSize(word, size) <= maxWidth) {
        currentLine = word;
      } else {
        const chunks = breakLongWord(word, font, size, maxWidth);
        for (let i = 0; i < chunks.length - 1; i++) {
          lines.push(chunks[i]);
        }
        currentLine = chunks[chunks.length - 1] ?? '';
      }
    }

    if (currentLine) {
      lines.push(currentLine);
    }
  }

  return lines;
}

function drawWrappedField(
  page: PDFPage,
  font: PDFFont,
  config: PdfTextFieldConfig,
  rawText: unknown,
): void {
  const clean = sanitizePdfText(rawText);
  if (!clean) return;

  const maxLines = config.maxLines ?? 4;
  const minFontSize = config.minFontSize ?? 6.5;
  let size = config.fontSize;
  let lines = wrapTextIntoLines(font, clean, config.maxWidth, size);

  while (lines.length > maxLines && size > minFontSize) {
    size = Math.max(minFontSize, Number((size - 0.5).toFixed(2)));
    lines = wrapTextIntoLines(font, clean, config.maxWidth, size);
  }

  const lineHeight = config.lineHeight ? config.lineHeight * (size / config.fontSize) : size + 2.5;
  const visibleLines = lines.slice(0, maxLines);
  if (lines.length > maxLines && visibleLines.length > 0) {
    const lastIdx = visibleLines.length - 1;
    visibleLines[lastIdx] = fitTextToWidth(font, `${visibleLines[lastIdx]}...`, config.maxWidth, size, size).text;
  }

  visibleLines.forEach((line, idx) => {
    page.drawText(line, {
      x: config.x,
      y: config.y - idx * lineHeight,
      size,
      font,
      color: TEXT_COLOR,
    });
  });
}

function drawCheck(
  page: PDFPage,
  fontBold: PDFFont,
  config: PdfCheckboxConfig,
  checked: boolean | undefined | null,
): void {
  if (!checked) return;
  page.drawText('X', {
    x: config.x,
    y: config.y,
    size: config.size,
    font: fontBold,
    color: TEXT_COLOR,
  });
}

function drawIbanGrid(
  page: PDFPage,
  fontBold: PDFFont,
  config: PdfIbanGridConfig,
  rawIban: unknown,
): void {
  const clean = sanitizePdfText(rawIban).replace(/\s+/g, '').toUpperCase();
  if (!clean) return;

  // Las 2 primeras casillas de la plantilla ya contienen "E" y "S" impresas.
  const body = clean.startsWith('ES') ? clean.slice(2) : clean;
  const digits = body.slice(0, config.cells);
  const cellWidth = (config.endX - config.startX) / config.cells;

  for (let i = 0; i < digits.length; i++) {
    const ch = digits[i];
    const chWidth = fontBold.widthOfTextAtSize(ch, config.fontSize);
    const centerX = config.startX + (i + 0.5) * cellWidth;
    page.drawText(ch, {
      x: centerX - chWidth / 2,
      y: config.y,
      size: config.fontSize,
      font: fontBold,
      color: TEXT_COLOR,
    });
  }
}

function decodeBase64Bytes(base64Payload: string): Uint8Array {
  if (typeof globalThis.atob === 'function') {
    const binary = globalThis.atob(base64Payload);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) {
      bytes[i] = binary.charCodeAt(i);
    }
    return bytes;
  }
  const nodeBuffer = (globalThis as { Buffer?: { from(input: string, enc: string): Uint8Array } }).Buffer;
  if (nodeBuffer) {
    return new Uint8Array(nodeBuffer.from(base64Payload, 'base64'));
  }
  throw new Error('No hay decodificador Base64 disponible para incrustar la firma.');
}

async function addSignature(
  pdfDocument: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  signature: string | null | undefined,
  box: PdfSignatureBoxConfig,
): Promise<void> {
  if (!signature || !signature.trim()) return;

  try {
    const isJpeg = /^data:image\/jpe?g;base64,/i.test(signature);
    const base64 = signature.includes(',') ? signature.split(',')[1] : signature;
    const bytes = decodeBase64Bytes(base64);
    const image: PDFImage = isJpeg
      ? await pdfDocument.embedJpg(bytes)
      : await pdfDocument.embedPng(bytes);

    const scale = Math.min(box.width / image.width, box.height / image.height);
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;
    const drawX = box.x + (box.width - drawWidth) / 2;
    const drawY = box.y + (box.height - drawHeight) / 2;

    page.drawImage(image, {
      x: drawX,
      y: drawY,
      width: drawWidth,
      height: drawHeight,
    });
  } catch {
    drawConfiguredText(
      page,
      font,
      {
        page: box.page,
        x: box.x,
        y: box.y + box.height / 2 - 3,
        maxWidth: box.width,
        fontSize: 7,
        minFontSize: 6,
        align: 'center',
      },
      'Firma digital registrada',
    );
  }
}

async function loadTemplateBytes(providedBytes?: ArrayBuffer | Uint8Array): Promise<ArrayBuffer | Uint8Array> {
  if (providedBytes) return providedBytes;
  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) {
    throw new Error('No se pudo cargar la plantilla oficial de inscripción.');
  }
  return response.arrayBuffer();
}

export async function buildOfficialScoutPdfBytes(
  record: ApplicantRecord,
  templateBytes?: ArrayBuffer | Uint8Array,
): Promise<Uint8Array> {
  const enrollment = record.enrollment;
  if (!enrollment) {
    throw new Error('Este expediente aún no tiene completada la Hoja de Inscripción.');
  }

  const pdfBytes = await loadTemplateBytes(templateBytes);
  const pdfDocument = await PDFDocument.load(pdfBytes);
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const fontBold = await pdfDocument.embedFont(StandardFonts.HelveticaBold);

  const [page1, page2, page3] = pdfDocument.getPages();
  if (!page1 || !page2 || !page3) {
    throw new Error('La plantilla oficial debe contener exactamente 3 páginas.');
  }

  const childLastNames =
    [
      sanitizePdfText(record.childLastName1),
      record.hasNoSecondLastName ? '' : sanitizePdfText(record.childLastName2),
    ]
      .filter(Boolean)
      .join(' ') || sanitizePdfText(record.childLastName);

  const childFullName = [sanitizePdfText(record.childFirstName), childLastNames]
    .filter(Boolean)
    .join(' ');

  const door = sanitizePdfText(record.apartmentDoor ?? record.ApartmentDoor);
  const fullResidentialAddress = [
    sanitizePdfText(record.streetAddress),
    sanitizePdfText(record.streetNumber),
    door,
  ]
    .filter(Boolean)
    .join(', ');

  const parent1FullName = [
    sanitizePdfText(record.parent1FirstName),
    sanitizePdfText(record.parent1LastName),
  ]
    .filter(Boolean)
    .join(' ');

  const parent2FullName = [
    sanitizePdfText(record.parent2FirstName),
    sanitizePdfText(record.parent2LastName),
  ]
    .filter(Boolean)
    .join(' ');

  const primaryPhone = sanitizePdfText(enrollment.childPhone) || sanitizePdfText(record.parent1Phone);
  const rawSecondaryPhone = sanitizePdfText(enrollment.childPhone)
    ? sanitizePdfText(record.parent1Phone) || sanitizePdfText(record.parent2Phone)
    : sanitizePdfText(record.parent2Phone);
  const secondaryPhone =
    rawSecondaryPhone === primaryPhone
      ? sanitizePdfText(record.parent2Phone) !== primaryPhone
        ? sanitizePdfText(record.parent2Phone)
        : ''
      : rawSecondaryPhone;
  const primaryEmail = sanitizePdfText(enrollment.childEmail) || sanitizePdfText(record.parent1Email);

  const birthDateDisplay = formatDisplayDate(record.childBirthDate);
  const childAge = resolveChildAge(record);
  const legalStatus = enrollment.legalStatus || 'MENOR';
  const signedParts = resolveDateParts(enrollment.signedAtParent1);
  const signedDateDisplay = formatDisplayDate(enrollment.signedAtParent1) || `${pad2(signedParts.day)}/${pad2(signedParts.month)}/${signedParts.year}`;
  const sepaDateDisplay = formatDisplayDate(enrollment.sepaSignedAt) || signedDateDisplay;
  const signedMonthName = (MONTH_NAMES_ES[signedParts.month - 1] ?? '').toLowerCase();
  const signedPlaceAndDay = `${DEFAULT_SIGN_PLACE}, ${pad2(signedParts.day)}`;

  // --------------------------------------------------------------------------
  // PÁGINA 1: Hoja de Inscripción Oficial
  // --------------------------------------------------------------------------
  const p1 = PDF_LAYOUT_CONFIG.page1;
  drawConfiguredText(page1, font, p1.groupName, GROUP_SCOUT_NAME);
  drawConfiguredText(page1, font, p1.childFirstName, record.childFirstName);
  drawConfiguredText(page1, font, p1.childLastNames, childLastNames);
  drawConfiguredText(page1, font, p1.childBirthDate, birthDateDisplay);
  drawConfiguredText(page1, font, p1.childAge, childAge);
  drawConfiguredText(page1, font, p1.childDni, enrollment.childDni);

  drawConfiguredText(page1, font, p1.streetAddress, record.streetAddress);
  drawConfiguredText(page1, font, p1.streetNumber, record.streetNumber);
  drawConfiguredText(page1, font, p1.apartmentDoor, door);
  drawConfiguredText(page1, font, p1.postalCode, record.postalCode);
  drawConfiguredText(page1, font, p1.municipality, record.municipality);
  drawConfiguredText(page1, font, p1.province, record.province);
  drawConfiguredText(page1, font, p1.phone1, primaryPhone);
  drawConfiguredText(page1, font, p1.phone2, secondaryPhone);
  drawConfiguredText(page1, font, p1.email, primaryEmail);

  drawCheck(page1, fontBold, p1.legalStatusChecks.MAYOR, legalStatus === 'MAYOR');
  drawCheck(page1, fontBold, p1.legalStatusChecks.EMANCIPADO, legalStatus === 'EMANCIPADO');
  drawCheck(page1, fontBold, p1.legalStatusChecks.MENOR, legalStatus === 'MENOR');

  drawConfiguredText(page1, font, p1.parentsMaritalStatus, enrollment.parentsMaritalStatus);
  drawCheck(page1, fontBold, p1.custodyChecks.TUTELA_LEGAL, enrollment.custodyType === 'TUTELA_LEGAL');
  drawCheck(page1, fontBold, p1.custodyChecks.CUSTODIA_UNICA, enrollment.custodyType === 'CUSTODIA_UNICA');
  drawCheck(page1, fontBold, p1.custodyChecks.CUSTODIA_CONJUNTA, enrollment.custodyType === 'CUSTODIA_CONJUNTA');

  drawConfiguredText(page1, font, p1.parent1FirstName, record.parent1FirstName);
  drawConfiguredText(page1, font, p1.parent1LastName, record.parent1LastName);
  drawConfiguredText(page1, font, p1.parent1Phone, record.parent1Phone);
  drawConfiguredText(page1, font, p1.parent1Email, record.parent1Email);
  drawConfiguredText(page1, font, p1.parent1Dni, enrollment.parent1Dni);

  drawConfiguredText(page1, font, p1.parent2FirstName, record.parent2FirstName);
  drawConfiguredText(page1, font, p1.parent2LastName, record.parent2LastName);
  drawConfiguredText(page1, font, p1.parent2Phone, record.parent2Phone);
  drawConfiguredText(page1, font, p1.parent2Email, record.parent2Email);
  drawConfiguredText(page1, font, p1.parent2Dni, enrollment.parent2Dni);

  drawCheck(page1, fontBold, p1.circularChecks.EMAIL, enrollment.circularPreference === 'EMAIL');
  drawCheck(page1, fontBold, p1.circularChecks.CORREO_POSTAL, enrollment.circularPreference === 'CORREO_POSTAL');

  if (legalStatus === 'MAYOR' || legalStatus === 'EMANCIPADO') {
    const adult = p1.declarationAdult;
    drawCheck(page1, fontBold, adult.acceptsDataStorage, Boolean(enrollment.acceptsDataStorage));
    drawCheck(page1, fontBold, adult.acceptsDataTransfer, Boolean(enrollment.acceptsDataTransfer));
    drawCheck(page1, fontBold, adult.deniesImages, enrollment.authorizesImages === false);
    drawConfiguredText(page1, font, adult.signPlaceAndDay, signedPlaceAndDay);
    drawConfiguredText(page1, font, adult.signMonth, signedMonthName);
    drawConfiguredText(page1, font, adult.signYear, String(signedParts.year));
    await addSignature(pdfDocument, page1, font, enrollment.signatureParent1, adult.signature1);
    drawConfiguredText(
      page1,
      font,
      adult.signer1Dni,
      sanitizePdfText(enrollment.childDni) ||
        sanitizePdfText(enrollment.signer1Dni) ||
        sanitizePdfText(enrollment.parent1Dni),
    );
  } else {
    const minor = p1.declarationMinor;
    const rep1 = sanitizePdfText(enrollment.signer1FullName) || parent1FullName;
    const rep2 =
      sanitizePdfText(enrollment.signer2FullName) ||
      (enrollment.signatureParent2 || enrollment.custodyType === 'CUSTODIA_CONJUNTA'
        ? parent2FullName
        : '');
    drawConfiguredText(page1, font, minor.representative1Name, rep1);
    drawConfiguredText(page1, font, minor.representative2Name, rep2);
    drawCheck(page1, fontBold, minor.acceptsDataStorage, Boolean(enrollment.acceptsDataStorage));
    drawCheck(page1, fontBold, minor.acceptsDataTransfer, Boolean(enrollment.acceptsDataTransfer));
    drawCheck(page1, fontBold, minor.deniesImages, enrollment.authorizesImages === false);
    drawConfiguredText(page1, font, minor.signPlaceAndDay, signedPlaceAndDay);
    drawConfiguredText(page1, font, minor.signMonth, signedMonthName);
    drawConfiguredText(page1, font, minor.signYear, String(signedParts.year));

    await addSignature(pdfDocument, page1, font, enrollment.signatureParent1, minor.signature1);
    drawConfiguredText(
      page1,
      font,
      minor.signer1Dni,
      sanitizePdfText(enrollment.signer1Dni) || sanitizePdfText(enrollment.parent1Dni),
    );

    if (enrollment.signatureParent2 || enrollment.custodyType === 'CUSTODIA_CONJUNTA' || enrollment.signer2Dni) {
      await addSignature(pdfDocument, page1, font, enrollment.signatureParent2, minor.signature2);
      drawConfiguredText(
        page1,
        font,
        minor.signer2Dni,
        sanitizePdfText(enrollment.signer2Dni) || sanitizePdfText(enrollment.parent2Dni),
      );
    }
  }

  // --------------------------------------------------------------------------
  // PÁGINA 2: Ficha Médica
  // --------------------------------------------------------------------------
  const p2 = PDF_LAYOUT_CONFIG.page2;
  const emergencyPhone =
    sanitizePdfText(enrollment.emergencyContactPhone) || sanitizePdfText(record.parent1Phone);
  const emergencyMeta = [
    sanitizePdfText(enrollment.emergencyContactName),
    sanitizePdfText(enrollment.emergencyContactRelationship),
  ]
    .filter(Boolean)
    .join(' - ');
  const emergencyText = emergencyMeta
    ? `${emergencyPhone}\n(${emergencyMeta})`
    : emergencyPhone;

  drawConfiguredText(page2, font, p2.childFullName, childFullName);
  drawConfiguredText(page2, font, p2.groupName, GROUP_SCOUT_NAME);
  drawConfiguredText(page2, font, p2.branch, record.calculatedBranch);
  drawConfiguredText(page2, font, p2.bloodType, enrollment.bloodType);
  drawWrappedField(page2, font, p2.emergencyContact, emergencyText);
  drawWrappedField(page2, font, p2.chronicDiseases, enrollment.chronicDiseases);
  drawWrappedField(page2, font, p2.allergies, enrollment.allergies);
  drawConfiguredText(page2, font, p2.medHeadache, enrollment.medHeadache);
  drawConfiguredText(page2, font, p2.medFever, enrollment.medFever);
  drawConfiguredText(page2, font, p2.medStomach, enrollment.medStomach);
  drawConfiguredText(page2, font, p2.medThroat, enrollment.medThroat);
  drawWrappedField(page2, font, p2.medicalObservations, enrollment.medicalObservations);

  if (enrollment.authorizesEmergency !== false) {
    await addSignature(pdfDocument, page2, font, enrollment.signatureParent1, p2.signature);
  }
  drawConfiguredText(page2, font, p2.signedDate, signedDateDisplay);

  // --------------------------------------------------------------------------
  // PÁGINA 3: Domiciliación Bancaria (SEPA)
  // --------------------------------------------------------------------------
  const p3 = PDF_LAYOUT_CONFIG.page3;
  const holderAddress = sanitizePdfText(enrollment.accountHolderAddress) || fullResidentialAddress;
  const holderMunicipality =
    sanitizePdfText(enrollment.accountHolderMunicipality) || sanitizePdfText(record.municipality);
  const holderPostalCode =
    sanitizePdfText(enrollment.accountHolderPostalCode) || sanitizePdfText(record.postalCode);

  drawConfiguredText(page3, font, p3.accountHolderName, enrollment.accountHolderName);
  drawConfiguredText(page3, font, p3.accountHolderDni, enrollment.accountHolderDni);
  drawConfiguredText(page3, font, p3.childFullName, childFullName);
  drawConfiguredText(page3, font, p3.accountHolderAddress, holderAddress);
  drawConfiguredText(page3, font, p3.accountHolderMunicipality, holderMunicipality);
  drawConfiguredText(page3, font, p3.accountHolderPostalCode, holderPostalCode);
  drawIbanGrid(page3, fontBold, p3.ibanGrid, enrollment.iban);
  drawConfiguredText(page3, font, p3.signedDate, sepaDateDisplay);

  if (enrollment.authorizesSepa !== false) {
    await addSignature(pdfDocument, page3, font, enrollment.signatureParent1, p3.signature);
  }
  drawConfiguredText(page3, font, p3.groupNameInText, GROUP_SCOUT_NAME);

  return pdfDocument.save();
}

export async function generateOfficialScoutPdf(record: ApplicantRecord): Promise<void> {
  const bytes = await buildOfficialScoutPdfBytes(record);
  const blobUrl = URL.createObjectURL(
    new Blob([new Uint8Array(bytes)], { type: 'application/pdf' }),
  );
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = `Inscripcion_MSC_${cleanFileName(`${record.childFirstName}_${record.childLastName}`)}.pdf`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}
