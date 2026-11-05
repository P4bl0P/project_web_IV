import { useState, type ChangeEvent } from 'react';
import { type ApplicationStatus, applicationsApi } from '../../services/api';
import { parseScoutExcelFile } from '../../utils/excelParser';

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function ExcelImportModal({ onClose, onSuccess }: Props) {
  const [targetStatus, setTargetStatus] = useState<ApplicationStatus>('CENSADO');
  const [importing, setImporting] = useState(false);
  const [items, setItems] = useState<Record<string, unknown>[]>([]);

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImporting(true);
    try {
      const items = await parseScoutExcelFile(file, targetStatus);
      if (items.length === 0) {
        alert('No se encontraron filas con NOMBRE y APELLIDOS.');
        return;
      }
      setItems(items);
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al importar Excel');
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  };

  const confirmImport = async () => {
    setImporting(true);
    try {
      const res = await applicationsApi.bulkImport(items);
      alert(`Importados ${res.importedCount} registros. Omitidos por duplicado: ${res.skippedCount}.`);
      onSuccess();
      onClose();
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al importar Excel');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
        <h3 className="text-lg font-bold text-slate-900">Importar Excel</h3>

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

        <input
          type="file"
          accept=".xlsx,.xls,.csv"
          disabled={importing}
          onChange={handleFile}
          className="block w-full text-xs text-slate-600 file:mr-3 file:py-2 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-bold file:bg-indigo-600 file:text-white cursor-pointer border border-slate-200 rounded-xl p-1.5"
        />
        {items.length > 0 && (
          <div className="space-y-3 rounded-xl border border-slate-200 bg-slate-50 p-3">
            <p className="text-sm font-semibold text-slate-700">Previsualización: {items.length} filas válidas</p>
            <div className="max-h-40 overflow-auto text-xs text-slate-600">
              {items.slice(0, 8).map((item, index) => <div key={index} className="border-b border-slate-200 py-1">{String(item.childFirstName)} {String(item.childLastName)} · {String(item.memberType)} · {String(item.censusBranch || 'rama automática')}</div>)}
            </div>
            <button type="button" disabled={importing} onClick={() => void confirmImport()} className="w-full rounded-lg bg-[#01317b] px-3 py-2 text-sm font-bold text-white disabled:opacity-50">Confirmar importación</button>
          </div>
        )}

        <div className="flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold px-4 py-2 rounded-lg"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
}