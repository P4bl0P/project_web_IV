import { jsPDF } from 'jspdf';
import { type ApplicantRecord } from '../services/api';

export function generateOfficialScoutPdf(record: ApplicantRecord): void {
  const e = record.enrollment;
  if (!e) {
    alert('Este solicitante aún no tiene completada la Fase 2 (Hoja de Inscripción).');
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const birthDateFormatted = new Date(record.childBirthDate).toLocaleDateString('es-ES');
  const signedDate = e.signedAtParent1
    ? new Date(e.signedAtParent1).toLocaleDateString('es-ES')
    : new Date().toLocaleDateString('es-ES');

  const drawHeader = (subtitle: string) => {
    doc.setFillColor(30, 58, 138); // Azul marino scout
    doc.rect(10, 10, 190, 18, 'F');
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(12);
    doc.text('GRUPO SCOUT IV SAN JOSÉ DE CALASANZ · MONTEQUINTO', 15, 17);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text('Movimiento Scout Católico (MSC) · CIF G-41080912 · Reg. Entidades Religiosas nº 1706 SE/C', 15, 23);

    doc.setFillColor(241, 245, 249);
    doc.rect(10, 30, 190, 8, 'F');
    doc.setTextColor(15, 23, 42);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(10);
    doc.text(subtitle, 15, 35.5);
  };

  const drawField = (label: string, value: string, x: number, y: number, width: number) => {
    doc.setDrawColor(203, 213, 225);
    doc.rect(x, y, width, 11);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(6.5);
    doc.setTextColor(100, 116, 139);
    doc.text(label.toUpperCase(), x + 2, y + 3.5);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.setTextColor(15, 23, 42);
    doc.text(value || '-', x + 2, y + 8.8);
  };

  // =========================================================================
  // PÁGINA 1: HOJA DE INSCRIPCIÓN OFICIAL Y AUTORIZACIONES
  // =========================================================================
  drawHeader('HOJA OFICIAL DE INSCRIPCIÓN EN EL GRUPO SCOUT (PÁGINA 1 DE 3)');

  // Bloque Datos del Asociado
  drawField('Nombre del Asociado/a', record.childFirstName, 10, 41, 60);
  drawField('Apellidos', record.childLastName, 70, 41, 80);
  drawField('DNI / NIE', e.childDni || 'Sin DNI', 150, 41, 50);

  drawField('Fecha Nacimiento', birthDateFormatted, 10, 52, 40);
  drawField('Edad Ronda', `${record.currentAge} años`, 50, 52, 30);
  drawField('Rama Asignada', record.calculatedBranch, 80, 52, 50);
  drawField('Situación Legal', e.legalStatus, 130, 52, 70);

  drawField('Dirección Postal', record.streetAddress, 10, 63, 110);
  drawField('Nº', record.streetNumber || 's/n', 120, 63, 25);
  drawField('Piso / Pta.', record.ApartmentDoor || '-', 145, 63, 25);
  drawField('C.P.', record.postalCode, 170, 63, 30);

  drawField('Municipio', record.municipality, 10, 74, 65);
  drawField('Provincia', record.province, 75, 74, 55);
  drawField('Circulares vía', e.circularPreference, 130, 74, 70);

  // Bloque Datos de los Padres / Tutores Legales
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 88, 190, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DATOS DE LOS PADRES / TUTORES LEGALES Y CUSTODIA', 15, 93);

  drawField('Estado Civil Padres', e.parentsMaritalStatus || '-', 10, 96, 95);
  drawField('Tipo de Custodia', e.custodyType.replace('_', ' '), 105, 96, 95);

  drawField(
    'Tutor 1 (Nombre y Apellidos)',
    `${record.parent1FirstName} ${record.parent1LastName}`,
    10,
    107,
    85,
  );
  drawField('DNI Tutor 1', e.parent1Dni, 95, 107, 35);
  drawField('Móvil Tutor 1', record.parent1Phone, 130, 107, 30);
  drawField('Email Tutor 1', record.parent1Email, 160, 107, 40);

  const parent2FullName = [record.parent2FirstName, record.parent2LastName]
    .filter(Boolean)
    .join(' ');
  drawField('Tutor 2 (Nombre y Apellidos)', parent2FullName || '-', 10, 118, 85);
  drawField('DNI Tutor 2', e.parent2Dni || '-', 95, 118, 35);
  drawField('Móvil Tutor 2', record.parent2Phone || '-', 130, 118, 30);
  drawField('Email Tutor 2', record.parent2Email || '-', 160, 118, 40);

  // Declaración y Autorizaciones Legales
  doc.setFillColor(241, 245, 249);
  doc.rect(10, 132, 190, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('DECLARACIÓN, PROTECCIÓN DE DATOS (LOPDGDD) Y DERECHOS DE IMAGEN', 15, 137);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(7.5);
  doc.setTextColor(51, 65, 85);
  const legalText =
    '1º.- Declaro que todos los datos expresados en esta ficha son ciertos.\n' +
    '2º.- En cumplimiento de la LOPDGDD (art. 6 y 7), autorizo al Grupo Scout San José de Calasanz y al Movimiento Scout Católico ' +
    'al tratamiento y cesión federativa de los datos personales para el desarrollo de las actividades propias del escultismo.\n' +
    '3º.- Comunico mi total acuerdo para que mi hijo/a participe en todas las actividades realizadas con el grupo (talleres, juegos, ' +
    'salidas, acampadas y campamentos) durante su permanencia en dicho Grupo Scout.';
  doc.text(doc.splitTextToSize(legalText, 185), 12, 144);

  // Casillas de verificación marcadas
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8);
  doc.setTextColor(15, 23, 42);
  doc.text(
    `[${e.acceptsDataStorage ? 'X' : ' '}] Autorizo el almacenamiento y tratamiento de datos personales (LOPDGDD).`,
    12,
    166,
  );
  doc.text(
    `[${e.acceptsDataTransfer ? 'X' : ' '}] Autorizo la cesión de datos a las entidades del Movimiento Scout Católico.`,
    12,
    172,
  );
  doc.text(
    `[${e.authorizesImages ? 'X' : ' '}] SÍ AUTORIZO la captación y uso no comercial de fotografías y vídeos en actividades scouts.`,
    12,
    178,
  );
  doc.text(
    `[${!e.authorizesImages ? 'X' : ' '}] NO AUTORIZO la utilización de imágenes y vídeos del menor.`,
    12,
    184,
  );

  // Cajas de Firma Página 1
  doc.setDrawColor(148, 163, 184);
  doc.rect(10, 195, 92, 48);
  doc.setFontSize(7.5);
  doc.text(`FIRMA TUTOR 1 (DNI: ${e.parent1Dni})`, 14, 201);
  if (e.signatureParent1) {
    try {
      doc.addImage(e.signatureParent1, 'PNG', 15, 204, 75, 32);
    } catch {
      doc.text('[Firma registrada digitalmente]', 15, 220);
    }
  }

  doc.rect(108, 195, 92, 48);
  doc.text(
    `FIRMA TUTOR 2 ${e.custodyType === 'CUSTODIA_CONJUNTA' ? '(CUSTODIA CONJUNTA)' : '(OPCIONAL)'}`,
    112,
    201,
  );
  if (e.signatureParent2) {
    try {
      doc.addImage(e.signatureParent2, 'PNG', 113, 204, 75, 32);
    } catch {
      doc.text('[Firma 2 registrada digitalmente]', 113, 220);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`En Montequinto (Dos Hermanas), a fecha ${signedDate}`, 10, 252);

  // =========================================================================
  // PÁGINA 2: FICHA MÉDICA Y AUTORIZACIÓN DE URGENCIA
  // =========================================================================
  doc.addPage();
  drawHeader('FICHA MÉDICA Y AUTORIZACIÓN DE URGENCIA (PÁGINA 2 DE 3)');

  drawField(
    'Nombre y Apellidos del Educando',
    `${record.childFirstName} ${record.childLastName}`,
    10,
    41,
    100,
  );
  drawField('Rama', record.calculatedBranch, 110, 41, 45);
  drawField('Teléfono Urgencia', record.parent1Phone, 155, 41, 45);

  drawField('Grupo Sanguíneo', e.bloodType || 'No especificado', 10, 52, 50);
  drawField('Enfermedades Crónicas', e.chronicDiseases || 'Ninguna', 60, 52, 140);

  drawField('Alergias Conocidas (Alimentarias, Medicamentosas, etc.)', e.allergies || 'Ninguna', 10, 66, 190);

  doc.setFillColor(241, 245, 249);
  doc.rect(10, 82, 190, 7, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('PAUTA DE MEDICACIÓN HABITUAL AUTORIZADA POR LOS PADRES EN CASO LEVE DE:', 15, 87);

  drawField('Dolor de Cabeza', e.medHeadache || 'No administrar / Consultar', 10, 91, 95);
  drawField('Fiebre', e.medFever || 'No administrar / Consultar', 105, 91, 95);
  drawField('Molestias de Estómago', e.medStomach || 'No administrar / Consultar', 10, 102, 95);
  drawField('Dolor de Garganta', e.medThroat || 'No administrar / Consultar', 105, 102, 95);

  drawField(
    'Observaciones Médicas Adicionales / Tratamientos',
    e.medicalObservations || 'Sin observaciones adicionales.',
    10,
    116,
    190,
  );

  // Bloque Autorización Quirúrgica/Médica de Urgencia
  doc.setDrawColor(217, 119, 6);
  doc.setFillColor(254, 243, 199);
  doc.rect(10, 135, 190, 25, 'FD');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.setTextColor(146, 64, 14);
  doc.text('AUTORIZACIÓN DE INTERVENCIÓN MÉDICA DE URGENCIA:', 15, 142);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  const medAuthText =
    `[${e.authorizesEmergency ? 'X' : ' '}] De igual forma, autorizo bajo mi responsabilidad a los responsables del Grupo Scout ` +
    'para que, en caso de accidente o enfermedad que requiera algún tipo de tratamiento médico o intervención quirúrgica urgente ' +
    'y no siendo posible mi localización, puedan tomar la decisión oportuna.';
  doc.text(doc.splitTextToSize(medAuthText, 180), 15, 148);

  // Firma Ficha Médica
  doc.setTextColor(15, 23, 42);
  doc.setDrawColor(148, 163, 184);
  doc.rect(10, 170, 95, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`FIRMA DEL PADRE, MADRE O TUTOR (${record.parent1FirstName} ${record.parent1LastName})`, 14, 176);
  if (e.signatureParent1) {
    try {
      doc.addImage(e.signatureParent1, 'PNG', 15, 179, 75, 32);
    } catch {
      doc.text('[Firma registrada digitalmente]', 15, 195);
    }
  }
  doc.setFont('helvetica', 'normal');
  doc.text(`Fecha: ${signedDate}`, 10, 226);

  // =========================================================================
  // PÁGINA 3: ORDEN DE DOMICILIACIÓN BANCARIA SEPA
  // =========================================================================
  doc.addPage();
  drawHeader('ORDEN DE DOMICILIACIÓN BANCARIA DE CUOTAS - SEPA (PÁGINA 3 DE 3)');

  drawField('Titular de la Cuenta Bancaria', e.accountHolderName, 10, 43, 130);
  drawField('DNI / NIE del Titular', e.accountHolderDni, 140, 43, 60);

  drawField(
    'Nombre del Educando Inscrito/a',
    `${record.childFirstName} ${record.childLastName} (${record.calculatedBranch})`,
    10,
    56,
    190,
  );

  drawField(
    'Dirección del Titular',
    `${record.streetAddress} ${record.streetNumber || ''} ${record.ApartmentDoor || ''}`.trim(),
    10,
    69,
    110,
  );
  drawField('Población', record.municipality, 120, 69, 50);
  drawField('C.P.', record.postalCode, 170, 69, 30);

  // Dibujar las 24 casillas del IBAN exactamente como en la hoja oficial
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8.5);
  doc.text('NÚMERO DE CUENTA - IBAN (24 CARACTERES):', 10, 89);

  const cleanIban = (e.iban || '').replace(/\s+/g, '').toUpperCase().padEnd(24, ' ');
  const boxWidth = 190 / 24;
  for (let i = 0; i < 24; i++) {
    const bx = 10 + i * boxWidth;
    doc.setDrawColor(71, 85, 105);
    doc.rect(bx, 92, boxWidth, 10);
    doc.setFont('courier', 'bold');
    doc.setFontSize(10);
    doc.text(cleanIban[i], bx + boxWidth / 2 - 1.5, 98.5);
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8.5);
  doc.setTextColor(30, 41, 59);
  const sepaText =
    `[${e.authorizesSepa ? 'X' : ' '}] AUTORIZO a mi Entidad Bancaria para que en mi nombre y con cargo a mi cuenta, tenga a bien ` +
    'abonar mis cuotas al Grupo Scout IV San José de Calasanz. Estos pagos van destinados al desarrollo de las actividades de los niños/as: ' +
    'talleres, pago de autobuses, acampadas, seguros y actividades que se realicen.\n\n' +
    'ACEPTO que, en caso de producirse la devolución de alguno de mis recibos, este importe y los gastos ocasionados se cargarán ' +
    'en el siguiente cobro que se realice a mi persona.';
  doc.text(doc.splitTextToSize(sepaText, 188), 10, 114);

  // Firma del Titular de la cuenta
  doc.setDrawColor(148, 163, 184);
  doc.rect(10, 148, 95, 48);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(7.5);
  doc.text(`FIRMA DEL TITULAR DE LA CUENTA (DNI: ${e.accountHolderDni})`, 14, 154);
  if (e.signatureParent1) {
    try {
      doc.addImage(e.signatureParent1, 'PNG', 15, 157, 75, 32);
    } catch {
      doc.text('[Firma registrada digitalmente]', 15, 175);
    }
  }

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text(`Fecha de mandato SEPA: ${signedDate}`, 10, 204);

  // Descargar archivo con el nombre limpio del educando
  const safeFileName = `Inscripcion_MSC_${record.childFirstName}_${record.childLastName}`
    .replace(/\s+/g, '_')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');

  doc.save(`${safeFileName}.pdf`);
}