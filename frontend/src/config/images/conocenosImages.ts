import type { HistoryMilestoneId, ScoutSectionId } from '../../types/conocenos';

export type ConocenosHistoriaImages = Record<HistoryMilestoneId, string | null>;
export type ConocenosSeccionesImages = Record<ScoutSectionId, string | null>;

export interface ConocenosImagesCatalog {
  hero: string;
  historia: ConocenosHistoriaImages;
  secciones: ConocenosSeccionesImages;
}

export const conocenosImages: ConocenosImagesCatalog = {
  hero: '/images/conocenos/hero/conocenos-01.jpg',
  historia: {
    'origen-1979': '/images/conocenos/historia/conocenos-02.jpg',
    'consolidacion-1997': '/images/conocenos/historia/conocenos-03.jpg',
    'asamblea-2013': '/images/conocenos/historia/conocenos-04.jpg',
    'aniversario-2024': '/images/conocenos/historia/conocenos-05.jpg',
  },
  secciones: {
    castores: '/images/conocenos/secciones/castores/castores-01.jpg',
    lobatos: '/images/conocenos/secciones/lobatos/lobatos-01.jpg',
    rangers: '/images/conocenos/secciones/rangers/rangers-01.jpg',
    pioneros: '/images/conocenos/secciones/pioneros/pioneros-01.jpg',
    rutas: '/images/conocenos/secciones/rutas/rutas-01.jpg',
  },
};
