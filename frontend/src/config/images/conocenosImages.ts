import type { HistoryMilestoneId, ScoutSectionId } from '../../types/conocenos';

export type ConocenosHistoriaImages = Record<HistoryMilestoneId, string | null>;
export type ConocenosSeccionesImages = Record<ScoutSectionId, string | null>;

export interface ConocenosImagesCatalog {
  hero: string;
  historia: ConocenosHistoriaImages;
  secciones: ConocenosSeccionesImages;
}

export const conocenosImages: ConocenosImagesCatalog = {
  hero: '/images/conocenos/hero/scout-01.jpg',
  historia: {
    'origen-1979': '/images/conocenos/historia/antiguas/scout-02.jpg',
    'consolidacion-1997': '/images/conocenos/historia/actuales/scout-04.jpg',
    'asamblea-2013': '/images/conocenos/historia/actuales/scout-03.jpg',
    'aniversario-2024': '/images/conocenos/historia/actuales/scout-01.jpg',
  },
  secciones: {
    castores: null,
    lobatos: null,
    rangers: null,
    pioneros: '/images/conocenos/secciones/pioneros/scout-03.jpg',
    rutas: '/images/conocenos/secciones/rutas/scout-04.jpg',
  },
};
