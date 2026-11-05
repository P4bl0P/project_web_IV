import { useState, type FormEvent } from 'react';
import { X } from 'lucide-react';
import { applicationsApi, type ApplicantRecord, type CreateApplicationPayload, type MemberType, type UpdateApplicationPayload } from '../../services/api';

const branches = ['Castores', 'Lobatos', 'Rangers', 'Pioneros', 'Rutas'];

type Props = {
  record?: ApplicantRecord;
  readOnly?: boolean;
  onClose: () => void;
  onSaved: (record: ApplicantRecord) => void;
};

const initialForm = (record?: ApplicantRecord) => ({
  memberType: record?.memberType ?? 'EDUCANDO' as MemberType,
  censusBranch: record?.censusBranch ?? record?.calculatedBranch ?? '',
  childFirstName: record?.childFirstName ?? '',
  childLastName: record?.childLastName ?? '',
  childBirthDate: record?.childBirthDate?.slice(0, 10) ?? '',
  gender: record?.gender ?? 'OTRO' as const,
  streetAddress: record?.streetAddress ?? '',
  streetNumber: record?.streetNumber ?? '',
  ApartmentDoor: record?.ApartmentDoor ?? '',
  postalCode: record?.postalCode ?? '',
  municipality: record?.municipality ?? '',
  province: record?.province ?? '',
  parent1FirstName: record?.parent1FirstName ?? '',
  parent1LastName: record?.parent1LastName ?? '',
  parent1Phone: record?.parent1Phone ?? '',
  parent1Email: record?.parent1Email ?? '',
  parent2FirstName: record?.parent2FirstName ?? '',
  parent2LastName: record?.parent2LastName ?? '',
  parent2Phone: record?.parent2Phone ?? '',
  parent2Email: record?.parent2Email ?? '',
  motivation: record?.motivation ?? '',
  hasFamilyInGroup: record?.hasFamilyInGroup ?? false,
  comesFromOtherGroup: record?.comesFromOtherGroup ?? false,
  familyMemberDetails: record?.familyMemberDetails ?? '',
  originGroupDetails: record?.originGroupDetails ?? '',
});

export default function CensusMemberModal({ record, readOnly = false, onClose, onSaved }: Props) {
  const [form, setForm] = useState(initialForm(record));
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const set = (key: string, value: string | boolean) => setForm((current) => ({ ...current, [key]: value }));

  const submit = async (event: FormEvent) => {
    event.preventDefault();
    if (readOnly) return;
    setBusy(true);
    setError('');
    try {
      const payload = { ...form, censusBranch: form.censusBranch.trim() } as CreateApplicationPayload & { memberType: MemberType; censusBranch: string };
      const saved = record
        ? await applicationsApi.update(record.id, payload as UpdateApplicationPayload)
        : await applicationsApi.createCensusMember(payload);
      onSaved(saved);
      onClose();
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : 'No se pudo guardar la ficha');
    } finally {
      setBusy(false);
    }
  };

  const textFields = [
    ['childFirstName', 'Nombre', true], ['childLastName', 'Apellidos', true],
    ['streetAddress', 'Dirección', true], ['streetNumber', 'Número', false],
    ['postalCode', 'Código postal', true], ['municipality', 'Municipio', true],
    ['province', 'Provincia', true], ['parent1FirstName', 'Tutor / contacto', true],
    ['parent1LastName', 'Apellidos del contacto', true], ['parent1Phone', 'Teléfono', true],
    ['parent1Email', 'Correo electrónico', true],
  ] as const;

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/50 p-4 overflow-y-auto">
      <form onSubmit={submit} className="mx-auto my-6 max-w-3xl rounded-2xl bg-white p-5 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div><h2 className="text-xl font-bold text-slate-900">{readOnly ? 'Ficha censal' : record ? 'Editar ficha censal' : 'Añadir al censo oficial'}</h2><p className="text-sm text-slate-500">La inscripción y sus consentimientos permanecen separados.</p></div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 text-slate-500 hover:bg-slate-100"><X size={18} /></button>
        </div>
        {error && <div className="rounded-lg bg-rose-50 p-3 text-sm text-rose-700">{error}</div>}
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="text-sm font-semibold text-slate-700">Tipo<select disabled={readOnly} value={form.memberType} onChange={(e) => set('memberType', e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="EDUCANDO">Educando</option><option value="RESPONSABLE">Responsable</option></select></label>
          <label className="text-sm font-semibold text-slate-700">Rama<select disabled={readOnly} required value={form.censusBranch} onChange={(e) => set('censusBranch', e.target.value)} className="mt-1 w-full rounded-lg border p-2"><option value="">Selecciona rama</option>{branches.map((branch) => <option key={branch}>{branch}</option>)}</select></label>
          <label className="text-sm font-semibold text-slate-700">Nacimiento<input disabled={readOnly} required type="date" value={form.childBirthDate} onChange={(e) => set('childBirthDate', e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>
        </div>
        <div className="grid gap-3 sm:grid-cols-2">{textFields.map(([key, label, required]) => <label key={key} className="text-sm font-semibold text-slate-700">{label}<input disabled={readOnly} required={required} type={key === 'parent1Email' ? 'email' : 'text'} value={form[key]} onChange={(e) => set(key, e.target.value)} className="mt-1 w-full rounded-lg border p-2" /></label>)}</div>
        <details><summary className="cursor-pointer text-sm font-semibold text-slate-700">Segundo tutor y notas opcionales</summary><div className="mt-3 grid gap-3 sm:grid-cols-2">{(['parent2FirstName', 'parent2LastName', 'parent2Phone', 'parent2Email', 'ApartmentDoor', 'familyMemberDetails', 'originGroupDetails'] as const).map((key) => <input disabled={readOnly} key={key} placeholder={key} value={form[key]} onChange={(e) => set(key, e.target.value)} className="rounded-lg border p-2 text-sm" />)}</div></details>
        <div className="flex justify-end gap-2"><button type="button" onClick={onClose} className="rounded-lg bg-slate-100 px-4 py-2 text-sm font-semibold">{readOnly ? 'Cerrar' : 'Cancelar'}</button>{!readOnly && <button disabled={busy} className="rounded-lg bg-[#01317b] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50">{busy ? 'Guardando…' : 'Guardar ficha'}</button>}</div>
      </form>
    </div>
  );
}
