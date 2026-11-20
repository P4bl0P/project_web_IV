export interface ContactoImageAsset {
  src: string;
  alt: string;
}

export interface ContactoImagesCatalog {
  hero: ContactoImageAsset;
  ubicacion: ContactoImageAsset;
  consejo: ContactoImageAsset;
}

export const contactoImages: ContactoImagesCatalog = {
  hero: {
    src: '/images/contacto/scout-04.jpg',
    alt: 'Scouts del Grupo IV en ruta al aire libre',
  },
  ubicacion: {
    src: '/images/contacto/scout-02.jpg',
    alt: 'Scouts del Grupo IV frente a las puertas de la parroquia',
  },
  consejo: {
    src: '/images/contacto/scout-01.jpg',
    alt: 'Equipo de scouters y educandos del Grupo IV Scout',
  },
};
