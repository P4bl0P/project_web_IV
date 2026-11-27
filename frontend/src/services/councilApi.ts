import { apiJson } from './api';
import type {
  CouncilMember,
  CouncilResponse,
  CreateCouncilMemberPayload,
  UpdateCouncilMemberPayload,
} from '../types/conocenos';

const COUNCIL_ERROR = 'No se pudo completar la operación del Consejo.';

function councilFetch<T>(path: string, init?: RequestInit): Promise<T> {
  return apiJson<T>(path, init, COUNCIL_ERROR);
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
