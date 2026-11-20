import { useState } from 'react';
import { ArrowLeft, ExternalLink, Globe, Plus, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';
import CouncilDeleteConfirmModal from '../components/contenido-web/CouncilDeleteConfirmModal';
import CouncilMemberFormModal from '../components/contenido-web/CouncilMemberFormModal';
import CouncilMemberList from '../components/contenido-web/CouncilMemberList';
import CouncilRoleOverview from '../components/contenido-web/CouncilRoleOverview';
import { SecButton } from '../components/secretaria/secretariaTheme';
import { secButtonClass, secTokens } from '../components/secretaria/secretariaTokens';
import FormAlert from '../components/shared/forms/FormAlert';
import { useCouncilManagement } from '../hooks/useCouncilManagement';
import type {
  CouncilMember,
  CreateCouncilMemberPayload,
  UpdateCouncilMemberPayload,
} from '../types/conocenos';

export default function ContenidoWebPage() {
  const {
    members,
    roleDescriptions,
    availableRoles,
    loading,
    saving,
    error,
    clearError,
    reload,
    createMember,
    updateMember,
    moveMember,
    deleteMember,
  } = useCouncilManagement();

  const [editingMember, setEditingMember] = useState<CouncilMember | null | undefined>(
    undefined,
  );
  const [deletingMember, setDeletingMember] = useState<CouncilMember | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const handleSaveMember = async (
    payload: CreateCouncilMemberPayload | UpdateCouncilMemberPayload,
    editingId?: string,
  ) => {
    setStatusMessage(null);
    if (editingId) {
      await updateMember(editingId, payload as UpdateCouncilMemberPayload);
      setStatusMessage('Integrante del Consejo actualizado correctamente.');
    } else {
      await createMember(payload as CreateCouncilMemberPayload);
      setStatusMessage('Integrante añadido al Consejo correctamente.');
    }
  };

  const handleConfirmDelete = async () => {
    if (!deletingMember) return;
    setStatusMessage(null);
    try {
      await deleteMember(deletingMember.id);
      setStatusMessage(`${deletingMember.fullName} se ha eliminado del Consejo.`);
      setDeletingMember(null);
    } catch {
      setDeletingMember(null);
    }
  };

  return (
    <div className="w-full min-h-[calc(100vh-4.75rem)] bg-gradient-to-b from-[#f8fafd] to-[#f2f5fa] px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <div className="max-w-[1100px] mx-auto space-y-5">
        <header
          className={`${secTokens.surface} px-5 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4`}
        >
          <div className="flex items-center gap-3.5 min-w-0">
            <Link
              to="/gestion"
              aria-label="Volver al área de gestión"
              className={secButtonClass({ variant: 'secondary', size: 'icon' })}
            >
              <ArrowLeft size={16} />
            </Link>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-[0.16em] text-[#e22328]">
                  <Globe size={11} aria-hidden="true" />
                  Contenido público de la web
                </span>
              </div>
              <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#000254]">
                Contenido de la web · Consejo de Grupo
              </h1>
              <p className="mt-0.5 text-xs text-slate-500">
                Gestiona los integrantes del Consejo visibles en «Conócenos», sus cargos y su
                orden de aparición.
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Link
              to="/about#nuestro-consejo"
              className={secButtonClass({ variant: 'secondary', size: 'md' })}
            >
              <ExternalLink size={14} />
              <span>Ver en Conócenos</span>
            </Link>

            <SecButton
              variant="primary"
              size="md"
              onClick={() => setEditingMember(null)}
              disabled={saving}
            >
              <Plus size={14} />
              <span>Añadir integrante</span>
            </SecButton>

            <SecButton
              variant="secondary"
              size="icon"
              onClick={() => void reload()}
              aria-label="Actualizar listado del Consejo"
              title="Actualizar listado"
              disabled={loading || saving}
            >
              <RefreshCw
                size={14}
                className={loading ? 'animate-spin text-[#01317b]' : ''}
              />
            </SecButton>
          </div>
        </header>

        {error && (
          <FormAlert>
            <div className="flex items-center justify-between gap-3">
              <span>{error}</span>
              <button
                type="button"
                onClick={clearError}
                className="text-xs font-bold underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </FormAlert>
        )}

        {statusMessage && (
          <FormAlert tone="success">
            <div className="flex items-center justify-between gap-3">
              <span>{statusMessage}</span>
              <button
                type="button"
                onClick={() => setStatusMessage(null)}
                className="text-xs font-bold underline cursor-pointer"
              >
                Ocultar
              </button>
            </div>
          </FormAlert>
        )}

        <CouncilRoleOverview roleDescriptions={roleDescriptions} />

        <section aria-label="Listado de integrantes del Consejo" className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <h2 className="text-sm font-bold text-[#000254]">
              Integrantes publicados ({members.length})
            </h2>
            <span className="text-xs text-slate-500">
              Se permiten varias personas con un mismo cargo.
            </span>
          </div>

          <CouncilMemberList
            members={members}
            loading={loading}
            saving={saving}
            onAdd={() => setEditingMember(null)}
            onEdit={(member) => setEditingMember(member)}
            onDelete={(member) => setDeletingMember(member)}
            onMove={(index, dir) => void moveMember(index, dir)}
          />
        </section>

        {editingMember !== undefined && (
          <CouncilMemberFormModal
            member={editingMember}
            availableRoles={availableRoles}
            roleDescriptions={roleDescriptions}
            nextDefaultOrder={members.length}
            saving={saving}
            onClose={() => setEditingMember(undefined)}
            onSubmit={handleSaveMember}
          />
        )}

        {deletingMember && (
          <CouncilDeleteConfirmModal
            member={deletingMember}
            deleting={saving}
            onCancel={() => setDeletingMember(null)}
            onConfirm={handleConfirmDelete}
          />
        )}
      </div>
    </div>
  );
}
