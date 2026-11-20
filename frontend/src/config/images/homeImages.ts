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
        src: '/images/home/scout-01.jpg',
        alt: 'Actividad del Grupo IV Scout',
        caption: 'Aventura que se comparte',
      },
      {
        src: '/images/home/scout-02.jpg',
        alt: 'Scouts del Grupo IV en una actividad',
        caption: 'Aprender haciendo',
      },
      {
        src: '/images/home/scout-03.jpg',
        alt: 'Campamento del Grupo IV Scout',
        caption: 'Siempre un poco más lejos',
      },
      {
        src: '/images/home/scout-04.jpg',
        alt: 'Comunidad del Grupo IV Scout',
        caption: 'Una comunidad para crecer',
      },
    ],
    fallback: {
      src: '/images/home/hero.png',
      alt: 'Ilustración del espíritu scout',
      caption: 'Siempre listos',
    },
  },
};
