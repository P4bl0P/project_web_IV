import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from 'pdf-lib';
import { type ApplicantRecord } from '../services/api';
import { formatIsoToDisplay } from './dateUtils';

const TEMPLATE_URL = '/templates/HOJA_DE_INSCRIPCION_SCOUT.pdf';
const TEXT_COLOR = rgb(0.08, 0.11, 0.18);

function value(value: unknown, fallback = ''): string {
  return value === null || value === undefined || value === '' ? fallback : String(value);
}

function formatDate(date: string | Date | undefined): string {
  if (!date) return '';
  if (typeof date === 'string') {
    const formatted = formatIsoToDisplay(date);
    if (formatted) return formatted;
  }
  return new Date(date).toLocaleDateString('es-ES');
}

function cleanFileName(valueToClean: string): string {
  return valueToClean
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function drawText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, size = 8, maxWidth?: number) {
  if (!text) return;
  let output = text;
  if (maxWidth) {
    while (font.widthOfTextAtSize(output, size) > maxWidth && output.length > 1) {
      output = `${output.slice(0, -2)}…`;
    }
  }
  page.drawText(output, { x, y, size, font, color: TEXT_COLOR });
}

function drawWrappedText(page: PDFPage, font: PDFFont, text: string, x: number, y: number, width: number, size = 7) {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const candidate = line ? `${line} ${word}` : word;
    if (font.widthOfTextAtSize(candidate, size) > width && line) {
      lines.push(line);
      line = word;
    } else {
      line = candidate;
    }
  }
  if (line) lines.push(line);
  lines.slice(0, 5).forEach((currentLine, index) => {
    drawText(page, font, currentLine, x, y - index * (size + 2), size);
  });
}

function drawCheck(page: PDFPage, font: PDFFont, checked: boolean, x: number, y: number) {
  drawText(page, font, checked ? 'X' : '', x, y, 9);
}

async function addSignature(
  pdfDocument: PDFDocument,
  page: PDFPage,
  font: PDFFont,
  signature: string | undefined,
  x: number,
  y: number,
  width: number,
  height: number,
) {
  if (!signature) return;
  try {
    const base64 = signature.split(',')[1] || signature;
    const image = await pdfDocument.embedPng(Uint8Array.from(atob(base64), (char) => char.charCodeAt(0)));
    page.drawImage(image, { x, y, width, height });
  } catch {
    drawText(page, font, 'Firma registrada', x, y + height / 2, 7);
  }
}

export async function generateOfficialScoutPdf(record: ApplicantRecord): Promise<void> {
  const enrollment = record.enrollment;
  if (!enrollment) {
    alert('Este solicitante aún no tiene completada la Fase 2 (Hoja de Inscripción).');
    return;
  }

  const response = await fetch(TEMPLATE_URL);
  if (!response.ok) throw new Error('No se pudo cargar la plantilla oficial de inscripción.');

  const pdfDocument = await PDFDocument.load(await response.arrayBuffer());
  const font = await pdfDocument.embedFont(StandardFonts.Helvetica);
  const [page1, page2, page3] = pdfDocument.getPages();
  const birthDate = formatDate(record.childBirthDate);
  const signedDate = formatDate(enrollment.signedAtParent1) || formatDate(new Date());
  const parent1Name = `${record.parent1FirstName} ${record.parent1LastName}`;
  const parent2Name = [record.parent2FirstName, record.parent2LastName].filter(Boolean).join(' ');

  // The source is a fixed A4 administrative form. These positions intentionally
  // stay local to the template so replacing the template only requires updating
  // this mapping, not the data or download flow.
  drawText(page1, font, `${record.childFirstName} ${record.childLastName}`, 95, 696, 8, 205);
  drawText(page1, font, value(enrollment.childDni), 475, 696, 8, 80);
  drawText(page1, font, birthDate, 95, 672, 8);
  drawText(page1, font, value(record.gender), 250, 672, 8);
  drawText(page1, font, value(enrollment.childPhone), 395, 672, 8);
  drawText(page1, font, value(enrollment.childEmail), 95, 648, 8, 190);
  drawText(page1, font, `${record.streetAddress} ${record.streetNumber || ''} ${record.ApartmentDoor || ''}`.trim(), 95, 624, 8, 300);
  drawText(page1, font, `${record.postalCode} ${record.municipality}`, 95, 600, 8, 220);
  drawText(page1, font, value(record.province), 350, 600, 8, 120);
  drawText(page1, font, parent1Name, 95, 565, 8, 200);
  drawText(page1, font, value(enrollment.parent1Dni), 410, 565, 8);
  drawText(page1, font, value(record.parent1Phone), 95, 541, 8);
  drawText(page1, font, value(record.parent1Email), 270, 541, 8, 220);
  drawText(page1, font, parent2Name, 95, 517, 8, 200);
  drawText(page1, font, value(enrollment.parent2Dni), 410, 517, 8);
  drawText(page1, font, value(record.parent2Phone), 95, 493, 8);
  drawText(page1, font, value(record.parent2Email), 270, 493, 8, 220);
  drawCheck(page1, font, enrollment.acceptsDataStorage, 40, 390);
  drawCheck(page1, font, enrollment.acceptsDataTransfer, 40, 365);
  drawCheck(page1, font, enrollment.authorizesImages, 40, 340);
  drawCheck(page1, font, !enrollment.authorizesImages, 40, 315);
  await addSignature(pdfDocument, page1, font, enrollment.signatureParent1, 60, 110, 150, 55);
  await addSignature(pdfDocument, page1, font, enrollment.signatureParent2, 330, 110, 150, 55);
  drawText(page1, font, signedDate, 70, 91, 8);

  drawText(page2, font, `${record.childFirstName} ${record.childLastName}`, 100, 689, 8, 250);
  drawText(page2, font, value(record.calculatedBranch), 420, 689, 8);
  drawText(page2, font, value(record.parent1Phone), 100, 665, 8);
  drawText(page2, font, value(enrollment.bloodType), 100, 620, 8);
  drawWrappedText(page2, font, value(enrollment.chronicDiseases), 100, 594, 400);
  drawWrappedText(page2, font, value(enrollment.allergies), 100, 552, 400);
  drawText(page2, font, value(enrollment.medHeadache), 100, 492, 8, 180);
  drawText(page2, font, value(enrollment.medFever), 330, 492, 8, 180);
  drawText(page2, font, value(enrollment.medStomach), 100, 468, 8, 180);
  drawText(page2, font, value(enrollment.medThroat), 330, 468, 8, 180);
  drawWrappedText(page2, font, value(enrollment.medicalObservations), 100, 430, 400);
  drawCheck(page2, font, enrollment.authorizesEmergency, 40, 343);
  await addSignature(pdfDocument, page2, font, enrollment.signatureParent1, 70, 150, 180, 60);
  drawText(page2, font, signedDate, 70, 135, 8);

  drawText(page3, font, value(enrollment.accountHolderName), 100, 702, 8, 350);
  drawText(page3, font, value(enrollment.accountHolderDni), 465, 702, 8);
  drawText(page3, font, `${record.childFirstName} ${record.childLastName}`, 100, 678, 8, 350);
  drawText(page3, font, `${record.streetAddress} ${record.streetNumber || ''} ${record.ApartmentDoor || ''}`.trim(), 100, 654, 8, 300);
  drawText(page3, font, `${record.municipality} ${record.postalCode}`, 420, 654, 8);
  drawText(page3, font, value(enrollment.iban).replace(/\s+/g, ''), 100, 610, 10, 390);
  drawCheck(page3, font, enrollment.authorizesSepa, 40, 525);
  await addSignature(pdfDocument, page3, font, enrollment.signatureParent1, 70, 190, 180, 60);
  drawText(page3, font, signedDate, 70, 175, 8);

  const bytes = await pdfDocument.save();
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: 'application/pdf' }));
  const link = window.document.createElement('a');
  link.href = blobUrl;
  link.download = `Inscripcion_MSC_${cleanFileName(`${record.childFirstName}_${record.childLastName}`)}.pdf`;
  link.click();
  URL.revokeObjectURL(blobUrl);
}
