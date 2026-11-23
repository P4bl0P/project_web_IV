import { useState, type FormEvent } from 'react';
import { Layers, Plus } from 'lucide-react';
import type { RegisteredModule, SpecialActionDefinition } from '../../services/api';

interface AdminModulesSectionProps {
  modules: RegisteredModule[];
  onCreateModule: (data: {
    key?: string;
    name: string;
    description?: string | null;
    isImplemented?: boolean;
    supportsRead: boolean;
    supportsCreate: boolean;
    supportsUpdate: boolean;
    supportsDelete: boolean;
    specialActions: SpecialActionDefinition[];
  }) => Promise<void>;
  onToggleImplemented: (mod: RegisteredModule) => Promise<void>;
}

const inputClass =
  'w-full rounded-[11px] border border-[#e4e9f1] bg-white px-[13px] py-2.5 text-sm outline-none focus:border-[#01317b] focus:shadow-[0_0_0_4px_rgba(1,49,123,0.09)]';

export default function AdminModulesSection({
  modules,
  onCreateModule,
  onToggleImplemented,
}: AdminModulesSectionProps) {
  const [name, setName] = useState('');
  const [key, setKey] = useState('');
  const [description, setDescription] = useState('');
  const [isImplemented, setIsImplemented] = useState(false);
  const [supportsRead, setSupportsRead] = useState(true);
  const [supportsCreate, setSupportsCreate] = useState(true);
  const [supportsUpdate, setSupportsUpdate] = useState(true);
  const [supportsDelete, setSupportsDelete] = useState(true);
  const [specialRaw, setSpecialRaw] = useState('');

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    if (!name.trim()) return;

    const specialActions: SpecialActionDefinition[] = specialRaw
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [rawKey, rawLabel] = line.split(':').map((part) => part.trim());
        const normalizedKey = (rawKey || '')
          .toLowerCase()
          .replace(/[^a-z0-9_]+/g, '_')
          .replace(/^_+|_+$/g, '');
        return {
          key: normalizedKey,
          label: rawLabel || rawKey,
        };
      })
      .filter((item) => item.key.length > 0);

    await onCreateModule({
      key: key.trim() || undefined,
      name: name.trim(),
      description: description.trim() || null,
      isImplemented,
      supportsRead,
      supportsCreate,
      supportsUpdate,
      supportsDelete,
      specialActions,
    });

    setName('');
    setKey('');
    setDescription('');
    setIsImplemented(false);
    setSupportsRead(true);
    setSupportsCreate(true);
    setSupportsUpdate(true);
    setSupportsDelete(true);
    setSpecialRaw('');
  };

  return (
    <div className="grid grid-cols-1 gap-[18px] min-[900px]:grid-cols-[minmax(250px,0.75fr)_1.25fr]">
      <section className="self-start rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <div className="mb-5 flex items-center gap-[9px] text-[#01317b]">
          <Layers size={20} />
          <h2 className="m-0 text-[20px] text-[#000254]">Registrar módulo</h2>
        </div>

        <form className="grid gap-3.5" onSubmit={(e) => void handleSubmit(e)}>
          <label className="grid gap-1.5 text-[13px] font-bold text-[#0c1933]">
            Nombre del módulo
            <input
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Ej. Intendencia"
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-[13px] font-bold text-[#0c1933]">
            Clave técnica (opcional)
            <input
              value={key}
              onChange={(e) => setKey(e.target.value)}
              placeholder="Ej. intendencia"
              className={inputClass}
            />
          </label>

          <label className="grid gap-1.5 text-[13px] font-bold text-[#0c1933]">
            Descripción
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputClass}
            />
          </label>

          <div className="space-y-2 rounded-xl border border-[#eef1f6] bg-[#f8fafc] p-3">
            <span className="block text-xs font-bold text-[#0c1933]">Operaciones soportadas</span>
            <div className="grid grid-cols-2 gap-2 text-xs font-semibold text-[#0c1933]">
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={supportsRead}
                  onChange={(e) => setSupportsRead(e.target.checked)}
                />
                Leer
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={supportsCreate}
                  onChange={(e) => setSupportsCreate(e.target.checked)}
                />
                Crear
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={supportsUpdate}
                  onChange={(e) => setSupportsUpdate(e.target.checked)}
                />
                Editar
              </label>
              <label className="inline-flex items-center gap-1.5">
                <input
                  type="checkbox"
                  checked={supportsDelete}
                  onChange={(e) => setSupportsDelete(e.target.checked)}
                />
                Eliminar
              </label>
            </div>
            <label className="mt-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0c1933]">
              <input
                type="checkbox"
                checked={isImplemented}
                onChange={(e) => setIsImplemented(e.target.checked)}
              />
              Marcar como implementado
            </label>
          </div>

          <label className="grid gap-1.5 text-[12px] font-bold text-[#0c1933]">
            Acciones especiales (una por línea: clave:Etiqueta)
            <textarea
              rows={2}
              value={specialRaw}
              onChange={(e) => setSpecialRaw(e.target.value)}
              placeholder="approve_budget:Aprobar presupuesto"
              className={inputClass}
            />
          </label>

          <button type="submit" className="button button-primary cursor-pointer">
            <Plus size={16} /> Registrar módulo
          </button>
        </form>
      </section>

      <section className="grid gap-3 rounded-[22px] border border-[#e4e9f1] bg-white p-[27px] shadow-[0_7px_25px_rgba(0,5,84,0.04)]">
        <h2 className="m-0 text-[20px] text-[#000254]">Módulos registrados ({modules.length})</h2>
        {modules.map((mod) => (
          <div
            key={mod.id ?? mod.key}
            className="rounded-2xl border border-[#eef1f6] bg-[#fafbfd] p-4 space-y-2"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <strong className="text-sm text-[#000254]">{mod.name}</strong>
                <code className="rounded bg-white px-2 py-0.5 text-[11px] text-[#01317b] border border-[#e4e9f1]">
                  {mod.key}
                </code>
                {mod.isSystem && (
                  <span className="rounded-full bg-[#edf3fb] px-2 py-0.5 text-[10px] font-bold text-[#01317b]">
                    Núcleo
                  </span>
                )}
                <span
                  className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${
                    mod.isImplemented
                      ? 'bg-emerald-50 text-emerald-700'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {mod.isImplemented ? 'Implementado' : 'En desarrollo'}
                </span>
              </div>

              {mod.id && (
                <button
                  type="button"
                  onClick={() => void onToggleImplemented(mod)}
                  className="cursor-pointer rounded-lg border border-[#e4e9f1] bg-white px-2.5 py-1 text-[11px] font-bold text-[#01317b]"
                >
                  {mod.isImplemented ? 'Marcar en desarrollo' : 'Marcar implementado'}
                </button>
              )}
            </div>

            {mod.description && <p className="m-0 text-xs text-[#627089]">{mod.description}</p>}

            <div className="flex flex-wrap gap-2 text-[11px] text-[#627089]">
              <span>Ruta: {mod.route || `/gestion/modulo/${mod.key}`}</span>
              <span>·</span>
              <span>
                CRUD:{' '}
                {[
                  mod.supportsRead && 'Leer',
                  mod.supportsCreate && 'Crear',
                  mod.supportsUpdate && 'Editar',
                  mod.supportsDelete && 'Eliminar',
                ]
                  .filter(Boolean)
                  .join(' · ') || 'Solo acceso'}
              </span>
              {mod.specialActions?.length > 0 && (
                <>
                  <span>·</span>
                  <span>
                    Especiales: {mod.specialActions.map((item) => item.label).join(', ')}
                  </span>
                </>
              )}
            </div>
          </div>
        ))}
      </section>
    </div>
  );
}
