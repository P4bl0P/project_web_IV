export const SOCIAL_CHANNELS = [
  {
    id: 'instagram',
    platform: 'Instagram',
    handle: '@scoutsmonte5',
    description:
      'Fotografías, historias, acampadas y el día a día de nuestras ramas y actividades.',
    cta: 'Abrir perfil en Instagram',
    href: 'https://www.instagram.com/scoutsmonte5?gwpx=ZDNlZDc0MzIxNw==',
  },
  {
    id: 'facebook',
    platform: 'Facebook',
    handle: 'Scouts Montequinto',
    description:
      'Noticias del grupo, comunicados importantes y recuerdos compartidos con toda la comunidad scout.',
    cta: 'Visitar página en Facebook',
    href: 'https://www.facebook.com/scoutsmontequinto',
  },
] as const;

export const EMAIL_CHANNELS = [
  {
    id: 'general',
    shortLabel: 'Correo general',
    badge: 'Consultas generales y vida de grupo',
    title: 'Correo general del grupo',
    description:
      'Para dudas sobre el funcionamiento del grupo, actividades, ramas, colaboraciones o cualquier consulta general.',
    address: 'scoutsmonte5@scoutsdesevilla.com',
    actionLabel: 'Escribir correo',
  },
  {
    id: 'secretaria',
    shortLabel: 'Correo de Secretaría',
    badge: 'Trámites, documentación e inscripciones',
    title: 'Correo de Secretaría',
    description:
      'Para gestiones administrativas, entrega de documentación, censo, solicitudes de ingreso y trámites oficiales.',
    address: 'papelescoutiv@gmail.com',
    actionLabel: 'Escribir a Secretaría',
  },
] as const;

export const MEETING_PLACE = {
  name: 'Parroquia Ntra. Sra. de los Ángeles y San José de Calasanz',
  address: 'Av. Madre Paula Montalt, 53 · 41089 Montequinto, Dos Hermanas (Sevilla)',
  mapsShortUrl: 'https://maps.app.goo.gl/jE9tWnEtScSFkFj4A',
  embedUrl:
    'https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3172.3396!2d-5.932874!3d37.3407642!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0xd126fc82ba7bc0b%3A0x19e47185798f9af7!2sParroquia%20Ntra.%20Sra.%20de%20los%20%C3%81ngeles%20y%20San%20Jos%C3%A9%20de%20Calasanz!5e0!3m2!1ses!2ses!4v1700000000000!5m2!1ses!2ses',
} as const;
