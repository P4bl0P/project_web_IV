import type {
  ApplicationRecord,
  ApplicationStatus,
  CreateApplicationPayload,
} from '../types/application';

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    const message = Array.isArray(errorBody.message)
      ? errorBody.message.join(', ')
      : errorBody.message || `Error HTTP ${response.status}`;
    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export const applicationsApi = {
  create: (payload: CreateApplicationPayload) =>
    request<ApplicationRecord>('/applications', {
      method: 'POST',
      body: JSON.stringify(payload),
    }),

  list: (status?: ApplicationStatus) => {
    const query = status ? `?status=${status}` : '';
    return request<ApplicationRecord[]>(`/applications${query}`);
  },

  updateStatus: (id: string, status: ApplicationStatus) =>
    request<ApplicationRecord>(`/applications/${id}`, {
      method: 'PATCH',
      body: JSON.stringify({ status }),
    }),

  admitToCensus: (id: string) =>
    request<{ id: string; fullName: string }>(`/applications/${id}/admit`, {
      method: 'POST',
    }),
};