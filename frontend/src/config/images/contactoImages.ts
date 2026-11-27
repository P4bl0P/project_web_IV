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
    src: '/images/contacto/contacto-01.jpg',
    alt: 'Scouts del Grupo IV formando un círculo',
  },
  ubicacion: {
    src: '/images/contacto/contacto-02.jpg',
    alt: 'Scouts del Grupo IV frente a las puertas de la parroquia',
  },
  consejo: {
    src: '/images/contacto/contacto-03.jpg',
    alt: 'Equipo de responsables y educandos del Grupo IV Scout',
  },
};
