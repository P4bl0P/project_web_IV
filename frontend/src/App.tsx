import React, { useEffect, useState } from 'react';
import { applicationsApi } from './services/api';
import type {
  ApplicationRecord,
  ApplicationStatus,
  CreateApplicationPayload,
  ScoutBranch,
} from './types/application';

const INITIAL_FORM: CreateApplicationPayload = {
  requestedBranch: 'CASTOR',
  childName: '',
  childBirthDate: '',
  address: '',
  fatherName: '',
  fatherPhone: '',
  fatherEmail: '',
  motherName: '',
  motherPhone: '',
  motherEmail: '',
  motivation: '',
  hasFamilyInGroup: false,
  fromAnotherGroup: false,
  socialInclusion: false,
};

export function App() {
  const [activeTab, setActiveTab] = useState<'public' | 'council'>('public');
  const [form, setForm] = useState<CreateApplicationPayload>(INITIAL_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  const [applications, setApplications] = useState<ApplicationRecord[]>([]);
  const [loadingList, setLoadingList] = useState(false);
  const [listError, setListError] = useState<string | null>(null);

  const loadApplications = async () => {
    setLoadingList(true);
    setListError(null);
    try {
      const data = await applicationsApi.list();
      setApplications(data);
    } catch (err) {
      setListError(err instanceof Error ? err.message : 'Error al cargar solicitudes');
    } finally {
      setLoadingList(false);
    }
  };

  useEffect(() => {
    if (activeTab === 'council') {
      void loadApplications();
    }
  }, [activeTab]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setSubmitError(null);
    setSubmitSuccess(false);

    try {
      const cleanPayload: CreateApplicationPayload = {
        ...form,
        fatherName: form.fatherName || undefined,
        fatherPhone: form.fatherPhone || undefined,
        fatherEmail: form.fatherEmail || undefined,
        motherName: form.motherName || undefined,
        motherPhone: form.motherPhone || undefined,
        motherEmail: form.motherEmail || undefined,
      };
      await applicationsApi.create(cleanPayload);
      setSubmitSuccess(true);
      setForm(INITIAL_FORM);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'No se pudo enviar la solicitud');
    } finally {
      setSubmitting(false);
    }
  };

  const handleStatusChange = async (id: string, status: ApplicationStatus) => {
    try {
      await applicationsApi.updateStatus(id, status);
      await loadApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al actualizar estado');
    }
  };

  const handleAdmitToCensus = async (id: string) => {
    try {
      await applicationsApi.admitToCensus(id);
      await loadApplications();
    } catch (err) {
      alert(err instanceof Error ? err.message : 'Error al admitir en el censo');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col">
      {/* Cabecera */}
      <header className="bg-emerald-900 text-white shadow-md">
        <div className="max-w-5xl mx-auto px-4 py-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <span className="text-xs uppercase tracking-widest text-amber-300 font-semibold">
              MSC · Montequinto (Dos Hermanas)
            </span>
            <h1 className="text-xl sm:text-2xl font-bold">
              Grupo IV Scout San José de Calasanz
            </h1>
          </div>
          <nav aria-label="Navegación principal" className="flex gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('public')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'public'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700'
              }`}
            >
              Información y Solicitud
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('council')}
              className={`px-3 py-2 rounded-lg text-sm font-medium transition ${
                activeTab === 'council'
                  ? 'bg-amber-400 text-slate-950'
                  : 'bg-emerald-800 text-white hover:bg-emerald-700'
              }`}
            >
              Portal Consejo (Lista de Espera)
            </button>
          </nav>
        </div>
      </header>

      <main className="max-w-5xl w-full mx-auto px-4 py-8 flex-1 space-y-10">
        {activeTab === 'public' ? (
          <>
            {/* Identidad y Proceso de Admisión */}
            <section aria-labelledby="about-heading" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
              <h2 id="about-heading" className="text-xl font-bold text-emerald-900">
                Quiénes somos y cómo inscribirse
              </h2>
              <p className="text-slate-700 leading-relaxed">
                Somos el <strong>Grupo IV Scout San José de Calasanz</strong>, educando en el
                tiempo libre a niños, niñas y jóvenes a través del método scout, el contacto con
                la naturaleza y el compromiso comunitario.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Paso 1</span>
                  <h3 className="font-semibold mt-1">Contacto inicial</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Escríbenos a{' '}
                    <a
                      href="mailto:papelescoutiv@gmail.com"
                      className="underline font-medium text-emerald-900"
                    >
                      papelescoutiv@gmail.com
                    </a>{' '}
                    para recibir toda la información del grupo.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Paso 2</span>
                  <h3 className="font-semibold mt-1">Envío de Solicitud</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Completa el formulario inferior con los datos del educando y de contacto familiar.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Paso 3</span>
                  <h3 className="font-semibold mt-1">Lista de Espera</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    El Consejo valida la solicitud y la incorpora a la lista de espera según los criterios de admisión.
                  </p>
                </div>
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <span className="text-xs font-bold text-emerald-800 uppercase">Paso 4</span>
                  <h3 className="font-semibold mt-1">Inscripción y Censo</h3>
                  <p className="text-xs text-slate-600 mt-1">
                    Al abrirse vacante en su rama, enviamos la inscripción oficial y pasa al censo activo del grupo.
                  </p>
                </div>
              </div>
            </section>

            {/* Formulario de Solicitud de Plaza */}
            <section aria-labelledby="form-heading" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <h2 id="form-heading" className="text-xl font-bold text-emerald-900 mb-1">
                Formulario de Solicitud de Ingreso
              </h2>
              <p className="text-sm text-slate-600 mb-6">
                Rellena los datos para registrar al niño o niña en el proceso de solicitud y lista de espera.
              </p>

              {submitSuccess && (
                <div
                  role="status"
                  className="mb-6 p-4 rounded-xl bg-emerald-100 border border-emerald-300 text-emerald-950 text-sm"
                >
                  ¡Solicitud registrada correctamente! El Consejo del grupo la revisará para incluirla en la lista de espera.
                </div>
              )}

              {submitError && (
                <div
                  role="alert"
                  className="mb-6 p-4 rounded-xl bg-red-100 border border-red-300 text-red-900 text-sm"
                >
                  {submitError}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="childName" className="block text-sm font-medium mb-1">
                      Nombre y apellidos del niño/a *
                    </label>
                    <input
                      id="childName"
                      type="text"
                      required
                      value={form.childName}
                      onChange={(e) => setForm({ ...form, childName: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="childBirthDate" className="block text-sm font-medium mb-1">
                      Fecha de nacimiento *
                    </label>
                    <input
                      id="childBirthDate"
                      type="date"
                      required
                      value={form.childBirthDate}
                      onChange={(e) => setForm({ ...form, childBirthDate: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>

                  <div>
                    <label htmlFor="requestedBranch" className="block text-sm font-medium mb-1">
                      Rama solicitada *
                    </label>
                    <select
                      id="requestedBranch"
                      value={form.requestedBranch}
                      onChange={(e) =>
                        setForm({ ...form, requestedBranch: e.target.value as ScoutBranch })
                      }
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm bg-white"
                    >
                      <option value="CASTOR">Castores (6 - 8 años)</option>
                      <option value="LOBATO">Lobatos (8 - 11 años)</option>
                      <option value="RANGER">Rangers / Tropa (11 - 14 años)</option>
                      <option value="PIONERO">Pioneros (14 - 17 años)</option>
                      <option value="RUTA">Rutas (17 - 20 años)</option>
                    </select>
                  </div>

                  <div>
                    <label htmlFor="address" className="block text-sm font-medium mb-1">
                      Dirección postal *
                    </label>
                    <input
                      id="address"
                      type="text"
                      required
                      value={form.address}
                      onChange={(e) => setForm({ ...form, address: e.target.value })}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                    />
                  </div>
                </div>

                {/* Datos de contacto de Tutores */}
                <fieldset className="border border-slate-200 rounded-xl p-4">
                  <legend className="text-sm font-semibold px-2 text-slate-700">
                    Datos de Madre / Padre / Tutores (al menos un contacto)
                  </legend>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-2">
                    <div>
                      <label htmlFor="motherName" className="block text-xs font-medium mb-1">
                        Nombre Madre / Tutor 1
                      </label>
                      <input
                        id="motherName"
                        type="text"
                        value={form.motherName}
                        onChange={(e) => setForm({ ...form, motherName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="motherPhone" className="block text-xs font-medium mb-1">
                        Teléfono Tutor 1
                      </label>
                      <input
                        id="motherPhone"
                        type="tel"
                        value={form.motherPhone}
                        onChange={(e) => setForm({ ...form, motherPhone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="motherEmail" className="block text-xs font-medium mb-1">
                        Email Tutor 1
                      </label>
                      <input
                        id="motherEmail"
                        type="email"
                        value={form.motherEmail}
                        onChange={(e) => setForm({ ...form, motherEmail: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>

                    <div>
                      <label htmlFor="fatherName" className="block text-xs font-medium mb-1">
                        Nombre Padre / Tutor 2
                      </label>
                      <input
                        id="fatherName"
                        type="text"
                        value={form.fatherName}
                        onChange={(e) => setForm({ ...form, fatherName: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="fatherPhone" className="block text-xs font-medium mb-1">
                        Teléfono Tutor 2
                      </label>
                      <input
                        id="fatherPhone"
                        type="tel"
                        value={form.fatherPhone}
                        onChange={(e) => setForm({ ...form, fatherPhone: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                    <div>
                      <label htmlFor="fatherEmail" className="block text-xs font-medium mb-1">
                        Email Tutor 2
                      </label>
                      <input
                        id="fatherEmail"
                        type="email"
                        value={form.fatherEmail}
                        onChange={(e) => setForm({ ...form, fatherEmail: e.target.value })}
                        className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                      />
                    </div>
                  </div>
                </fieldset>

                {/* Criterios de Admisión */}
                <fieldset className="border border-slate-200 rounded-xl p-4 space-y-2">
                  <legend className="text-sm font-semibold px-2 text-slate-700">
                    Criterios de baremación para lista de espera
                  </legend>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.hasFamilyInGroup}
                      onChange={(e) =>
                        setForm({ ...form, hasFamilyInGroup: e.target.checked })
                      }
                    />
                    Tiene hermanos/as o familiares directos actualmente en el grupo
                  </label>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={form.fromAnotherGroup}
                      onChange={(e) =>
                        setForm({ ...form, fromAnotherGroup: e.target.checked })
                      }
                    />
                    Proviene por traslado desde otro grupo scout
                  </label>
                </fieldset>

                <div>
                  <label htmlFor="motivation" className="block text-sm font-medium mb-1">
                    ¿Por qué queréis formar parte del Grupo IV? *
                  </label>
                  <textarea
                    id="motivation"
                    rows={3}
                    required
                    minLength={10}
                    value={form.motivation}
                    onChange={(e) => setForm({ ...form, motivation: e.target.value })}
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm"
                  />
                </div>

                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full sm:w-auto px-6 py-2.5 rounded-lg bg-emerald-800 hover:bg-emerald-700 disabled:opacity-50 text-white font-medium text-sm transition"
                >
                  {submitting ? 'Enviando solicitud...' : 'Enviar Solicitud'}
                </button>
              </form>
            </section>
          </>
        ) : (
          /* Vista de Gestión del Consejo (Lista de espera y Paso al Censo) */
          <section aria-labelledby="council-heading" className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
              <div>
                <h2 id="council-heading" className="text-xl font-bold text-emerald-900">
                  Gestión de Solicitudes y Lista de Espera
                </h2>
                <p className="text-xs text-slate-500">
                  Ordenadas automáticamente por criterios de admisión y fecha de solicitud.
                </p>
              </div>
              <button
                type="button"
                onClick={() => void loadApplications()}
                className="self-start px-3 py-1.5 rounded-lg border border-slate-300 text-xs font-medium hover:bg-slate-100"
              >
                Actualizar listado
              </button>
            </div>

            {loadingList && <p className="text-sm text-slate-600">Cargando solicitudes...</p>}
            {listError && (
              <p role="alert" className="text-sm text-red-700 bg-red-50 p-3 rounded-lg">
                {listError}
              </p>
            )}

            {!loadingList && applications.length === 0 && (
              <p className="text-sm text-slate-500 py-4">No hay solicitudes registradas todavía.</p>
            )}

            <div className="space-y-3">
              {applications.map((app) => (
                <article
                  key={app.id}
                  className="p-4 rounded-xl border border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="font-semibold text-slate-900">{app.childName}</h3>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-900 font-medium">
                        {app.requestedBranch}
                      </span>
                      <span className="text-xs px-2 py-0.5 rounded-full bg-slate-200 text-slate-800 font-medium">
                        {app.status}
                      </span>
                      {app.hasFamilyInGroup && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-100 text-amber-900">
                          Prioridad Familiar
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-600">
                      Contacto: {app.motherPhone || app.fatherPhone || 'Sin teléfono'} ·{' '}
                      {app.motherEmail || app.fatherEmail || 'Sin email'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {app.status === 'PENDING' && (
                      <button
                        type="button"
                        onClick={() => void handleStatusChange(app.id, 'WAITLIST')}
                        className="px-3 py-1.5 rounded-lg bg-amber-500 text-slate-950 text-xs font-semibold hover:bg-amber-400"
                      >
                        Pasar a Lista de Espera
                      </button>
                    )}
                    {app.status === 'WAITLIST' && (
                      <button
                        type="button"
                        onClick={() => void handleAdmitToCensus(app.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-600"
                      >
                        Admitir y Pasar al Censo
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>
          </section>
        )}
      </main>
    </div>
  );
}

export default App;