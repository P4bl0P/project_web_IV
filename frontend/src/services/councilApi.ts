import type {
  CouncilMember,
  CouncilResponse,
  CreateCouncilMemberPayload,
  UpdateCouncilMemberPayload,
} from '../types/conocenos';

const API_URL = (import.meta.env.VITE_API_URL || 'http://localhost:3000').replace(/\/+$/, '');

async function councilFetch<T>(path: string, init?: RequestInit): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...init,
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...init?.headers },
    });
  } catch {
    throw new Error('No se pudo conectar con el servidor. Inténtalo de nuevo.');
  }

  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    const message = Array.isArray(data.message)
      ? data.message.join(' · ')
      : data.message;
    throw new Error(
      typeof message === 'string' && message.trim()
        ? message
        : 'No se pudo completar la operación del Consejo.',
    );
  }
  return data as T;
}

export const councilApi = {
  getPublic(): Promise<CouncilResponse> {
    return councilFetch<CouncilResponse>('/council');
  },

  getManaged(): Promise<CouncilResponse> {
    return councilFetch<CouncilResponse>('/council/manage');
  },

  create(payload: CreateCouncilMemberPayload): Promise<CouncilMember> {
    return councilFetch<CouncilMember>('/council', {
      method: 'POST',
      body: JSON.stringify(payload),
    });
  },

  update(id: string, payload: UpdateCouncilMemberPayload): Promise<CouncilMember> {
    return councilFetch<CouncilMember>(`/council/${encodeURIComponent(id)}`, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
  },

  reorder(orderedIds: string[]): Promise<CouncilResponse> {
    return councilFetch<CouncilResponse>('/council/reorder', {
      method: 'PATCH',
      body: JSON.stringify({ orderedIds }),
    });
  },

  remove(id: string): Promise<{ ok: boolean }> {
    return councilFetch<{ ok: boolean }>(`/council/${encodeURIComponent(id)}`, {
      method: 'DELETE',
    });
  },
};
