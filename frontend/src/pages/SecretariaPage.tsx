import { useState, useEffect, useMemo, type ChangeEvent } from 'react';
import { Link } from 'react-router-dom';
import * as XLSX from 'xlsx';
import {
  Users,
  Clock,
  CheckCircle2,
  Send,
  MessageCircle,
  HeartHandshake,
  ShieldAlert,
  Sparkles,
  Copy,
  Check,
  Trash2,
  RefreshCw,
  FileCheck2,
  UserCheck,
  Archive,
  FileDown,
  ArrowLeft,
  Upload,
  Lock,
  Unlock,
} from 'lucide-react';
import {
  applicationsApi,
  type ApplicantRecord,
  type ApplicationStatus,
} from '../services/api';
import { generateOfficialScoutPdf } from '../utils/pdfGenerator';

type TabType = 'WAITLIST' | 'OFFERED' | 'CENSUS' | 'ARCHIVED';

const BRANCHES = ['Todas', 'Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

export default function SecretariaPage() {
  const [records, setRecords] = useState<ApplicantRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('WAITLIST');
  const [selectedBranch, setSelectedBranch] = useState<string>('Todas');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Escudo Anti-WhatsApp activado por defecto para evitar envíos por error
  const [safeModeWhatsApp, setSafeModeWhatsApp] = useState<boolean>(true);

  // Modal de importación Excel
  const [showImportModal, setShowImportModal] = useState<boolean>(false);
  const [importTargetStatus, setImportTargetStatus] =
    useState<ApplicationStatus>('CENSADO');
  const [importing, setImporting] = useState<boolean>(false);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await applicationsApi.getAll();
      setRecords(data);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error cargando datos');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const counts = useMemo(
    () => ({
      waitlist: records.filter(
        (r) => r.status === 'PENDIENTE_REVISION' || r.status === 'LISTA_ESPERA',
      ).length,
      offered: records.filter(
        (r) =>
          r.status === 'PLAZA_OFERTADA' || r.status === 'INSCRIPCION_COMPLETADA',
      ).length,
      census: records.filter((r) => r.status === 'CENSADO').length,
      archived: records.filter((r) => r.status === 'BAJA').length,
    }),
    [records],
  );

  const branchRatio = useMemo(() => {
    const censusInBranch = records.filter(
      (r) =>
        r.status === 'CENSADO' &&
        (selectedBranch === 'Todas' || r.calculatedBranch === selectedBranch),
    );
    const boys = censusInBranch.filter((r) => r.gender === 'MASCULINO').length;
    const girls = censusInBranch.filter((r) => r.gender === 'FEMENINO').length;
    return { total: censusInBranch.length, boys, girls };
  }, [records, selectedBranch]);

  const filteredRecords = useMemo(() => {
    return records
      .filter((r) => {
        if (
          selectedBranch !== 'Todas' &&
          r.calculatedBranch !== selectedBranch
        ) {
          return false;
        }
        if (activeTab === 'WAITLIST') {
          return (
            r.status === 'PENDIENTE_REVISION' || r.status === 'LISTA_ESPERA'
          );
        }
        if (activeTab === 'OFFERED') {
          return (
            r.status === 'PLAZA_OFERTADA' ||
            r.status === 'INSCRIPCION_COMPLETADA'
          );
        }
        if (activeTab === 'CENSUS') {
          return r.status === 'CENSADO';
        }
        return r.status === 'BAJA';
      })
      .sort((a, b) => {
        if (b.priorityScore !== a.priorityScore) {
          return b.priorityScore - a.priorityScore;
        }
        return (
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
        );
      });
  }, [records, activeTab, selectedBranch]);

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      const updated = await applicationsApi.update(id, { status });
      setRecords((prev) => prev.map((r) => (r.id === id ? updated : r)));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al cambiar estado');
    }
  };

  const handleToggleInclusion = async (record: ApplicantRecord) => {
    try {
      const updated = await applicationsApi.update(record.id, {
        socialInclusionPriority: !record.socialInclusionPriority,
      });
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? updated : r)),
      );
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al actualizar prioridad');
    }
  };

  const handleOfferSpot = async (record: ApplicantRecord) => {
    try {
      const updated = await applicationsApi.offerSpot(record.id);
      setRecords((prev) =>
        prev.map((r) => (r.id === record.id ? updated : r)),
      );
      setActiveTab('OFFERED');
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al ofertar plaza');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (
      !window.confirm(
        `¿Seguro que deseas eliminar permanentemente el registro de ${name}?`,
      )
    ) {
      return;
    }
    try {
      await applicationsApi.remove(id);
      setRecords((prev) => prev.filter((r) => r.id !== id));
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al eliminar');
    }
  };

  const getMagicLink = (token?: string | null) => {
    if (!token) return '';
    return `${window.location.origin}/inscripcion/${token}`;
  };

  const handleCopyLink = (record: ApplicantRecord) => {
    const link = getMagicLink(record.enrollmentToken);
    if (!link) return;
    navigator.clipboard.writeText(link);
    setCopiedId(record.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const openWhatsApp = (record: ApplicantRecord) => {
    const magicLink = getMagicLink(record.enrollmentToken);
    const message =
      `¡Hola ${record.parent1FirstName}! Soy de Secretaría del Grupo IV Scout (San José de Calasanz).\n\n` +
      `Te escribimos porque tenemos plaza disponible para *${record.childFirstName}* en la rama *${record.calculatedBranch}*.\n\n` +
      `Para confirmar la plaza y rellenar la ficha médica y bancaria sin tener que repetir vuestros datos, entra en este enlace personal antes de 7 días:\n${magicLink}\n\n` +
      `¡Un saludo y Siempre Listos!`;

    if (safeModeWhatsApp) {
      alert(
        `🛡️ ESCUDO ANTI-WHATSAPP ACTIVADO (No se ha abierto ningún chat real).\n\n` +
          `Destinatario: ${record.parent1FirstName} (${record.parent1Phone})\n\n` +
          `Mensaje preparado:\n----------------------------------------\n${message}\n----------------------------------------\n\n` +
          `Para abrir WhatsApp de verdad, desactiva el botón verde "Escudo Anti-WhatsApp" arriba a la derecha.`,
      );
      return;
    }

    const cleanPhone = record.parent1Phone.replace(/\D/g, '');
    const phoneWithPrefix = cleanPhone.startsWith('34')
      ? cleanPhone
      : `34${cleanPhone}`;
    const url = `https://wa.me/${phoneWithPrefix}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleExcelUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const workbook = XLSX.read(arrayBuffer, { type: 'array', cellDates: true });
      const firstSheetName = workbook.SheetNames[0];
      const worksheet = workbook.Sheets[firstSheetName];
      const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(worksheet, {
        defval: '',
      });

      if (rawRows.length === 0) {
        alert('El archivo Excel está vacío.');
        setImporting(false);
        return;
      }

      // Busca una columna coincidiendo exactamente o por inclusión (ignorando tildes y mayúsculas)
      const getVal = (row: Record<string, unknown>, targetNames: string[]): unknown => {
        const normalize = (s: string) =>
          s.trim().toUpperCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

        const rowKeys = Object.keys(row);
        for (const target of targetNames) {
          const normTarget = normalize(target);
          // 1. Coincidencia exacta primero (para evitar columnas basura parecidas)
          const exactKey = rowKeys.find((k) => normalize(k) === normTarget);
          if (exactKey && row[exactKey] !== '') return row[exactKey];

          // 2. Coincidencia parcial
          const partialKey = rowKeys.find((k) => normalize(k).includes(normTarget));
          if (partialKey && row[partialKey] !== '') return row[partialKey];
        }
        return '';
      };

      // Convierte cualquier formato de fecha de Excel a YYYY-MM-DD
      const parseExcelDate = (raw: unknown): string => {
        if (!raw) return '2014-01-01';

        if (raw instanceof Date && !isNaN(raw.getTime())) {
          return raw.toISOString().split('T')[0];
        }

        // Si Excel devuelve un número serie (ej. 42139)
        if (typeof raw === 'number') {
          const excelEpoch = new Date(Date.UTC(1899, 11, 30));
          const parsed = new Date(excelEpoch.getTime() + raw * 86400000);
          if (!isNaN(parsed.getTime())) {
            return parsed.toISOString().split('T')[0];
          }
        }

        const str = String(raw).trim();
        // Formato español DD/MM/YYYY o DD-MM-YYYY
        const dmyMatch = str.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})$/);
        if (dmyMatch) {
          const day = dmyMatch[1].padStart(2, '0');
          const month = dmyMatch[2].padStart(2, '0');
          const year = dmyMatch[3].length === 2 ? `20${dmyMatch[3]}` : dmyMatch[3];
          return `${year}-${month}-${day}`;
        }

        const fallback = new Date(str);
        if (!isNaN(fallback.getTime())) {
          return fallback.toISOString().split('T')[0];
        }

        return '2014-01-01';
      };

      const mappedItems = rawRows
        .map((row) => {
          const childFirstName = String(
            getVal(row, ['NOMBRE', 'NOMBRE DEL SOLICITANTE']),
          ).trim();
          const childLastName = String(getVal(row, ['APELLIDOS'])).trim();

          // Si la fila está vacía (sin nombre ni apellidos), la saltamos
          if (!childFirstName && !childLastName) return null;

          const childDni = String(getVal(row, ['DNI', 'NIF']))
            .trim()
            .toUpperCase();
          const childBirthDate = parseExcelDate(
            getVal(row, ['FECHA NACIMIENTO', 'FECHA DE NACIMIENTO']),
          );
          const email =
            String(getVal(row, ['E-MAIL', 'EMAIL', 'CORREO'])).trim() ||
            'censo@scoutsmontequinto.es';
          const streetAddress =
            String(getVal(row, ['DIRECCIÓN', 'DIRECCION', 'DOMICILIO'])).trim() ||
            'Sin especificar';
          const municipality =
            String(getVal(row, ['LOCALIDAD', 'MUNICIPIO', 'POBLACION'])).trim() ||
            'Dos Hermanas';

          // Limpiamos espacios o guiones del teléfono; si vienen dos teléfonos separados por "/", cogemos el primero
          const rawPhoneStr = String(
            getVal(row, ['TELÉFONO', 'TELEFONO', 'MOVIL']),
          ).split(/[/-]/)[0];
          const cleanPhone = rawPhoneStr.replace(/\D/g, '').slice(-9);
          const parent1Phone = cleanPhone.length === 9 ? cleanPhone : '600000000';

          // En el Excel del Censo solo viene el nombre del niño y teléfono/email de contacto,
          // así que asignamos un valor limpio para el contacto familiar
          const parent1FirstName =
            String(getVal(row, ['NOMBRE PADRE', 'TUTOR'])).trim() ||
            `Familia de ${childFirstName}`;

          return {
            childFirstName: childFirstName || 'Sin nombre',
            childLastName: childLastName || 'Sin apellidos',
            childBirthDate,
            gender: 'MASCULINO',
            streetAddress,
            postalCode: municipality.toLowerCase().includes('montequinto')
              ? '41089'
              : '41700',
            municipality,
            province: 'Sevilla',
            parent1FirstName,
            parent1LastName: childLastName || 'Censo',
            parent1Phone,
            parent1Email: email,
            childDni: childDni || undefined,
            status: importTargetStatus,
          };
        })
        .filter(Boolean) as Record<string, unknown>[];

      if (mappedItems.length === 0) {
        alert('No se encontraron filas con NOMBRE y APELLIDOS válidos.');
        setImporting(false);
        return;
      }

      const result = await applicationsApi.bulkImport(mappedItems);
      alert(
        `¡Importación exitosa! Se han cargado ${result.importedCount} educandos en ${
          importTargetStatus === 'CENSADO'
            ? 'el Censo Oficial'
            : 'la Lista de Espera'
        }.`,
      );
      setShowImportModal(false);
      await loadData();
    } catch (err: unknown) {
      alert(
        err instanceof Error
          ? err.message
          : 'Error al procesar el archivo Excel.',
      );
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-3.5rem)] bg-slate-50 px-4 sm:px-8 lg:px-12 py-6">
      {/* Cabecera Superior de Secretaría */}
      <div className="bg-white rounded-2xl border border-slate-200 p-4 mb-6 shadow-2xs flex flex-col xl:flex-row xl:items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          <Link
            to="/gestion"
            className="inline-flex items-center gap-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 text-xs font-bold px-3.5 py-2.5 rounded-xl transition"
          >
            <ArrowLeft size={15} />
            Volver a Gestión
          </Link>
          <div>
            <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900">
              Secretaría · Lista de Espera, Inscripciones y Censo
            </h1>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setSafeModeWhatsApp((prev) => !prev)}
            className={`inline-flex items-center gap-1.5 text-xs font-bold px-3.5 py-2 rounded-xl border transition ${
              safeModeWhatsApp
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-rose-50 text-rose-800 border-rose-300'
            }`}
          >
            {safeModeWhatsApp ? <Lock size={14} /> : <Unlock size={14} />}
            {safeModeWhatsApp
              ? 'Escudo Anti-WhatsApp: ACTIVO'
              : 'WhatsApp Real: DESBLOQUEADO'}
          </button>

          <button
            onClick={() => setShowImportModal(true)}
            className="inline-flex items-center gap-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-bold px-3.5 py-2 rounded-xl transition"
          >
            <Upload size={14} />
            Importar Excel (Censo / Espera)
          </button>

          <button
            onClick={loadData}
            className="inline-flex items-center gap-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 text-xs font-semibold px-3.5 py-2 rounded-xl transition"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Actualizar
          </button>
        </div>
      </div>

      {/* Modal Importador Excel */}
      {showImportModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-8 shadow-2xl border border-slate-200">
            <h3 className="text-xl font-extrabold text-slate-900">
              Importar Excel a la Base de Datos
            </h3>
            <p className="text-xs text-slate-600 mt-1">
              Sube tu Excel del Censo o de la Lista de Espera. No se enviará ningún mensaje ni correo a los padres al importar.
            </p>

            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setImportTargetStatus('CENSADO')}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  importTargetStatus === 'CENSADO'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <p className="text-sm font-bold">Excel del Censo</p>
                <p
                  className={`text-xs mt-0.5 ${
                    importTargetStatus === 'CENSADO'
                      ? 'text-indigo-100'
                      : 'text-slate-500'
                  }`}
                >
                  Guardar como CENSADOS
                </p>
              </button>

              <button
                type="button"
                onClick={() => setImportTargetStatus('LISTA_ESPERA')}
                className={`p-3.5 rounded-2xl border text-left transition ${
                  importTargetStatus === 'LISTA_ESPERA'
                    ? 'bg-indigo-600 text-white border-indigo-600'
                    : 'bg-slate-50 text-slate-800 border-slate-200'
                }`}
              >
                <p className="text-sm font-bold">Excel Lista Espera</p>
                <p
                  className={`text-xs mt-0.5 ${
                    importTargetStatus === 'LISTA_ESPERA'
                      ? 'text-indigo-100'
                      : 'text-slate-500'
                  }`}
                >
                  Guardar en LISTA DE ESPERA
                </p>
              </button>
            </div>

            <div className="mt-5">
              <input
                type="file"
                accept=".xlsx,.xls,.csv"
                disabled={importing}
                onChange={handleExcelUpload}
                className="block w-full text-xs text-slate-600 file:mr-4 file:py-2.5 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white hover:file:bg-indigo-700 cursor-pointer border border-slate-200 rounded-xl p-2"
              />
            </div>

            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => setShowImportModal(false)}
                className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2.5 rounded-xl transition"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Pestañas de Secretaría */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <button
          onClick={() => setActiveTab('WAITLIST')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'WAITLIST'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Clock size={20} />
            <span className="text-2xl font-extrabold">{counts.waitlist}</span>
          </div>
          <p className="text-sm font-semibold mt-2">1. Lista de Espera</p>
          <p
            className={`text-xs ${
              activeTab === 'WAITLIST' ? 'text-indigo-100' : 'text-gray-500'
            }`}
          >
            Ordenada por criterios y fecha
          </p>
        </button>

        <button
          onClick={() => setActiveTab('OFFERED')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'OFFERED'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Send size={20} />
            <span className="text-2xl font-extrabold">{counts.offered}</span>
          </div>
          <p className="text-sm font-semibold mt-2">2. Plazas Ofertadas</p>
          <p
            className={`text-xs ${
              activeTab === 'OFFERED' ? 'text-indigo-100' : 'text-gray-500'
            }`}
          >
            Seguimiento de Enlaces Mágicos
          </p>
        </button>

        <button
          onClick={() => setActiveTab('CENSUS')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'CENSUS'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Users size={20} />
            <span className="text-2xl font-extrabold">{counts.census}</span>
          </div>
          <p className="text-sm font-semibold mt-2">3. Censo Oficial</p>
          <p
            className={`text-xs ${
              activeTab === 'CENSUS' ? 'text-indigo-100' : 'text-gray-500'
            }`}
          >
            Educandos activos del Grupo IV
          </p>
        </button>

        <button
          onClick={() => setActiveTab('ARCHIVED')}
          className={`p-4 rounded-2xl border text-left transition ${
            activeTab === 'ARCHIVED'
              ? 'bg-indigo-600 text-white border-indigo-600 shadow-md'
              : 'bg-white text-gray-800 border-gray-200 hover:bg-gray-50'
          }`}
        >
          <div className="flex items-center justify-between">
            <Archive size={20} />
            <span className="text-2xl font-extrabold">{counts.archived}</span>
          </div>
          <p className="text-sm font-semibold mt-2">4. Bajas / Archivo</p>
          <p
            className={`text-xs ${
              activeTab === 'ARCHIVED' ? 'text-indigo-100' : 'text-gray-500'
            }`}
          >
            Renuncias y antiguos miembros
          </p>
        </button>
      </div>

      {/* Filtro de Rama + Ratio */}
      <div className="bg-white rounded-2xl border border-gray-200 p-4 mb-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4 shadow-2xs">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs font-bold uppercase tracking-wider text-gray-500 mr-1">
            Filtrar por Rama actual:
          </span>
          {BRANCHES.map((branch) => (
            <button
              key={branch}
              onClick={() => setSelectedBranch(branch)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition ${
                selectedBranch === branch
                  ? 'bg-indigo-100 text-indigo-800 border border-indigo-300'
                  : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
              }`}
            >
              {branch}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4 bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl text-xs">
          <span className="font-semibold text-slate-700">
            Ratio en Censo ({selectedBranch}):
          </span>
          <span className="font-bold text-blue-700">👦 {branchRatio.boys} Niños</span>
          <span className="font-bold text-pink-700">👧 {branchRatio.girls} Niñas</span>
          <span className="text-slate-500">(Total: {branchRatio.total})</span>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 p-4 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Listado */}
      {loading ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          Cargando solicitudes y censo...
        </div>
      ) : filteredRecords.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-200 p-12 text-center text-gray-500">
          No hay registros en esta pestaña para la rama <strong>{selectedBranch}</strong>.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredRecords.map((record, index) => (
            <div
              key={record.id}
              className="bg-white rounded-2xl border border-gray-200 p-5 shadow-2xs hover:border-indigo-200 transition"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {activeTab === 'WAITLIST' && (
                      <span className="bg-gray-900 text-white text-xs font-bold px-2.5 py-0.5 rounded-lg">
                        #{index + 1}
                      </span>
                    )}
                    <h3 className="text-lg font-bold text-gray-900">
                      {record.childFirstName} {record.childLastName}
                    </h3>
                    <span className="bg-indigo-50 text-indigo-700 border border-indigo-200 text-xs font-bold px-2.5 py-0.5 rounded-full">
                      {record.calculatedBranch} ({record.currentAge} años)
                    </span>
                    <span className="text-xs bg-gray-100 text-gray-700 px-2 py-0.5 rounded-md font-medium">
                      {record.gender === 'MASCULINO'
                        ? '👦 Niño'
                        : record.gender === 'FEMENINO'
                        ? '👧 Niña'
                        : 'Otro'}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    {record.hasFamilyInGroup && (
                      <span className="inline-flex items-center gap-1 bg-purple-100 text-purple-800 border border-purple-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <Sparkles size={13} /> Familiar:{' '}
                        {record.familyMemberDetails || 'Sí'}
                      </span>
                    )}
                    {record.comesFromOtherGroup && (
                      <span className="inline-flex items-center gap-1 bg-teal-100 text-teal-800 border border-teal-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <ShieldAlert size={13} /> Traslado:{' '}
                        {record.originGroupDetails}
                      </span>
                    )}
                    {record.socialInclusionPriority && (
                      <span className="inline-flex items-center gap-1 bg-rose-100 text-rose-800 border border-rose-200 text-xs font-semibold px-2.5 py-1 rounded-lg">
                        <HeartHandshake size={13} /> Inclusión Social
                      </span>
                    )}
                    {record.status === 'INSCRIPCION_COMPLETADA' && (
                      <span className="inline-flex items-center gap-1 bg-emerald-100 text-emerald-800 text-xs font-semibold px-2.5 py-1 rounded-full">
                        <FileCheck2 size={13} /> Rellenada por los padres
                      </span>
                    )}
                  </div>

                  <div className="text-xs text-gray-600 flex flex-wrap gap-x-4 gap-y-1 pt-1">
                    <span>
                      <strong>Solicitud:</strong>{' '}
                      {new Date(record.createdAt).toLocaleDateString('es-ES')}
                    </span>
                    <span>
                      <strong>Tutor 1:</strong> {record.parent1FirstName}{' '}
                      {record.parent1LastName} ({record.parent1Phone} ·{' '}
                      {record.parent1Email})
                    </span>
                    <span>
                      <strong>Domicilio:</strong> {record.streetAddress},{' '}
                      {record.postalCode} {record.municipality}
                    </span>
                  </div>
                </div>

                <div className="flex flex-wrap items-center gap-2 shrink-0">
                  {activeTab === 'WAITLIST' && (
                    <>
                      <button
                        onClick={() => handleToggleInclusion(record)}
                        className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
                          record.socialInclusionPriority
                            ? 'bg-rose-50 text-rose-700 border-rose-300'
                            : 'bg-white text-gray-600 border-gray-300 hover:bg-gray-50'
                        }`}
                      >
                        <HeartHandshake size={15} />
                        Inclusión
                      </button>

                      {record.status === 'PENDIENTE_REVISION' && (
                        <button
                          onClick={() =>
                            handleStatusChange(record.id, 'LISTA_ESPERA')
                          }
                          className="bg-amber-500 hover:bg-amber-600 text-white text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                        >
                          <CheckCircle2 size={15} />
                          Validar a Lista
                        </button>
                      )}

                      <button
                        onClick={() => handleOfferSpot(record)}
                        className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5"
                      >
                        <Send size={15} />
                        Ofertar Plaza (Crear Link)
                      </button>
                    </>
                  )}

                  {activeTab === 'OFFERED' && (
                    <>
                      <button
                        onClick={() => openWhatsApp(record)}
                        className="bg-green-600 hover:bg-green-700 text-white text-xs font-semibold px-3.5 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5"
                      >
                        <MessageCircle size={15} />
                        {safeModeWhatsApp
                          ? 'Simular WhatsApp (Seguro)'
                          : 'Enviar WhatsApp Real'}
                      </button>

                      <button
                        onClick={() => handleCopyLink(record)}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-800 text-xs font-semibold px-3 py-2 rounded-xl transition flex items-center gap-1.5"
                      >
                        {copiedId === record.id ? (
                          <Check size={15} className="text-green-600" />
                        ) : (
                          <Copy size={15} />
                        )}
                        {copiedId === record.id ? 'Copiado' : 'Copiar Link'}
                      </button>

                      {record.status === 'INSCRIPCION_COMPLETADA' && (
                        <button
                          onClick={() =>
                            handleStatusChange(record.id, 'CENSADO')
                          }
                          className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold px-4 py-2 rounded-xl shadow-2xs transition flex items-center gap-1.5"
                        >
                          <UserCheck size={15} />
                          Aprobar y Censar
                        </button>
                      )}
                    </>
                  )}

                  {record.enrollment && (
                    <button
                      onClick={() => generateOfficialScoutPdf(record)}
                      className="bg-indigo-50 hover:bg-indigo-100 text-indigo-800 border border-indigo-200 text-xs font-semibold px-3.5 py-2 rounded-xl transition flex items-center gap-1.5"
                    >
                      <FileDown size={15} />
                      PDF Oficial (3 Hojas)
                    </button>
                  )}

                  <button
                    onClick={() =>
                      handleDelete(
                        record.id,
                        `${record.childFirstName} ${record.childLastName}`,
                      )
                    }
                    className="text-gray-400 hover:text-red-600 hover:bg-red-50 p-2 rounded-xl transition"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}