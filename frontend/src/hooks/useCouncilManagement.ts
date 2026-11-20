import { useCallback, useEffect, useState } from 'react';
import { councilApi } from '../services/councilApi';
import type {
  CouncilMember,
  CouncilRole,
  CreateCouncilMemberPayload,
  UpdateCouncilMemberPayload,
} from '../types/conocenos';
import {
  COUNCIL_ROLES,
  DEFAULT_ROLE_DESCRIPTIONS,
} from '../utils/councilValidators';

export function useCouncilManagement() {
  const [members, setMembers] = useState<CouncilMember[]>([]);
  const [roleDescriptions, setRoleDescriptions] = useState<Record<CouncilRole, string>>(
    DEFAULT_ROLE_DESCRIPTIONS,
  );
  const [availableRoles, setAvailableRoles] = useState<CouncilRole[]>([...COUNCIL_ROLES]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const applyResponse = useCallback((data: Awaited<ReturnType<typeof councilApi.getManaged>>) => {
    setMembers(data.members);
    if (data.roleDescriptions) setRoleDescriptions(data.roleDescriptions);
    if (data.availableRoles?.length) setAvailableRoles(data.availableRoles);
  }, []);

  const loadMembers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await councilApi.getManaged();
      applyResponse(data);
    } catch (reason) {
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo cargar el Consejo de Grupo.',
      );
    } finally {
      setLoading(false);
    }
  }, [applyResponse]);

  useEffect(() => {
    let cancelled = false;
    councilApi
      .getManaged()
      .then((data) => {
        if (!cancelled) {
          applyResponse(data);
          setError(null);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(
            reason instanceof Error
              ? reason.message
              : 'No se pudo cargar el Consejo de Grupo.',
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [applyResponse]);

  const createMember = async (payload: CreateCouncilMemberPayload) => {
    setSaving(true);
    setError(null);
    try {
      await councilApi.create(payload);
      await loadMembers();
    } catch (reason) {
      const msg =
        reason instanceof Error ? reason.message : 'No se pudo añadir el integrante.';
      setError(msg);
      throw new Error(msg, { cause: reason });
    } finally {
      setSaving(false);
    }
  };

  const updateMember = async (id: string, payload: UpdateCouncilMemberPayload) => {
    setSaving(true);
    setError(null);
    try {
      await councilApi.update(id, payload);
      await loadMembers();
    } catch (reason) {
      const msg =
        reason instanceof Error
          ? reason.message
          : 'No se pudo actualizar el integrante.';
      setError(msg);
      throw new Error(msg, { cause: reason });
    } finally {
      setSaving(false);
    }
  };

  const moveMember = async (index: number, direction: -1 | 1) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= members.length) return;

    const reordered = [...members];
    const [moved] = reordered.splice(index, 1);
    reordered.splice(targetIndex, 0, moved);

    const previous = members;
    setMembers(
      reordered.map((item, idx) => ({ ...item, displayOrder: idx })),
    );
    setSaving(true);
    setError(null);
    try {
      const updated = await councilApi.reorder(reordered.map((item) => item.id));
      setMembers(updated.members);
    } catch (reason) {
      setMembers(previous);
      setError(
        reason instanceof Error
          ? reason.message
          : 'No se pudo actualizar el orden de aparición.',
      );
    } finally {
      setSaving(false);
    }
  };

  const deleteMember = async (id: string) => {
    setSaving(true);
    setError(null);
    try {
      await councilApi.remove(id);
      await loadMembers();
    } catch (reason) {
      const msg =
        reason instanceof Error
          ? reason.message
          : 'No se pudo eliminar el integrante.';
      setError(msg);
      throw new Error(msg, { cause: reason });
    } finally {
      setSaving(false);
    }
  };

  return {
    members,
    roleDescriptions,
    availableRoles,
    loading,
    saving,
    error,
    clearError: () => setError(null),
    reload: loadMembers,
    createMember,
    updateMember,
    moveMember,
    deleteMember,
  };
}
