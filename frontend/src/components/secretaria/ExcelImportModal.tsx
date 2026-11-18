import { useState, type ChangeEvent } from 'react';
import { type ApplicationStatus, applicationsApi } from '../../services/api';
import { parseScoutExcelFile } from '../../utils/excelParser';
import FormAlert from '../ui/forms/FormAlert';
import FormField from '../ui/forms/FormField';
import FormSection from '../ui/forms/FormSection';
import { formInputClass } from '../ui/forms/formStyles';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({ onClose, onSuccess }: Props) {
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('CENSADO');
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ tone: 'error' | 'success'; text: string } | null>(null);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    setMessage(null);
    try {
      const items = await parseScoutExcelFile(file, targetStatus);
      if (items.length === 0) {
        setMessage({ tone: 'error', text: 'No se encontraron filas con nombre y apellidos.' });
        return;
      }
      const res = await applicationsApi.bulkImport(items);
      setMessage({ tone: 'success', text: `Se han importado ${res.importedCount} registros correctamente.` });
      onSuccess();
      window.setTimeout(onClose, 700);
    } catch (err: unknown) {
      setMessage({ tone: 'error', text: err instanceof Error ? err.message : 'Error al importar Excel.' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <FormSection title="Importar Excel" description="Carga registros de censo o lista de espera desde un archivo .xlsx, .xls o .csv" className="max-w-md w-full">
        {message && <FormAlert tone={message.tone}>{message.text}</FormAlert>}

        <div className="grid grid-cols-2 gap-2">
          {(['CENSADO', 'LISTA_ESPERA'] as const).map((st) => (
            <button
              key={st}
              type="button"
              onClick={() => setTargetStatus(st)}
              className={`p-3 rounded-xl border text-xs font-bold transition ${
                targetStatus === st
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : 'bg-slate-50 text-slate-700 border-slate-200'
              }`}
            >
              {st === 'CENSADO' ? 'Excel del Censo' : 'Excel Lista Espera'}
            </button>
          ))}
        </div>

        <FormField label="Archivo" required hint="Formatos admitidos: XLSX, XLS y CSV">
          <input
            type="file"
            accept=".xlsx,.xls,.csv"
            disabled={importing}
            onChange={handleFile}
            className={formInputClass(false, 'p-1.5 file:mr-3 file:rounded-lg file:border-0 file:bg-indigo-600 file:px-3 file:py-2 file:text-xs file:font-bold file:text-white')}
          />
        </FormField>

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="button button-light border border-slate-200"
          >
            Cerrar
          </button>
        </div>
        </FormSection>
      </div>
  );
}