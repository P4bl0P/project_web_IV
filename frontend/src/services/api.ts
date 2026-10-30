const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CreateApplicationPayload {
  childFirstName: string;
  childLastName: string;
  childBirthDate: string;
  gender: 'MASCULINO' | 'FEMENINO' | 'OTRO';
  streetAddress: string;
  streetNumber?: string;
  ApartmentDoor?: string;
  postalCode?: string;
  municipality?: string;
  province?: string;
  parent1FirstName: string;
  parent1LastName: string;
  parent1Phone: string;
  parent1Email: string;
  parent2FirstName?: string;
  parent2LastName?: string;
  parent2Phone?: string;
  parent2Email?: string;
  motivation?: string;
  hasFamilyInGroup: boolean;
  familyMemberDetails?: string;
  comesFromOtherGroup: boolean;
  originGroupDetails?: string;
}

export const applicationsApi = {
  // Fase 1: Enviar solicitud pública
  async submitApplication(data: CreateApplicationPayload) {
    const response = await fetch(`${API_URL}/applications`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      const msg = Array.isArray(errorData.message)
        ? errorData.message.join(' · ')
        : errorData.message;
      throw new Error(msg || 'Error al enviar la solicitud. Revisa los datos.');
    }

    return response.json();
  },
};