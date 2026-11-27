export interface HomeHeroSlide {
  src: string;
  alt: string;
  caption: string;
}

export interface HomeHeroImages {
  slides: HomeHeroSlide[];
  fallback: HomeHeroSlide;
}

export interface HomeImagesCatalog {
  hero: HomeHeroImages;
}

export const homeImages: HomeImagesCatalog = {
  hero: {
    slides: [
      {
        src: '/images/home/home-01.jpg',
        alt: 'Comunidad del Grupo IV Scout',
        caption: 'Explorando el mundo con valores',
      },
      {
        src: '/images/home/home-02.jpg',
        alt: 'Scouts del Grupo IV en una actividad',
        caption: 'Una comunidad para crecer',
      },
            {
        src: '/images/home/home-03.jpg',
        alt: 'Actividad del Grupo IV Scout',
        caption: 'Aventuras que se comparten',
      },
      {
        src: '/images/home/home-04.jpg',
        alt: 'Campamento del Grupo IV Scout',
        caption: 'Nuevos y viejos amigos',
      },
    ],
    fallback: {
      src: '/images/shared/flor_lis.png',
      alt: 'Ilustración del espíritu scout',
      caption: 'Siempre listos',
    },
  },
};
