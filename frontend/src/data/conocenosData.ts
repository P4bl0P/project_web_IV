import type {
  ChapterNavItem,
  HistoryMilestone,
  MethodologyStep,
  ScoutSectionItem,
  ValueItem,
} from '../types/conocenos';

export const CONOCENOS_CHAPTERS: ChapterNavItem[] = [
  { id: 'quienes-somos', label: 'Quiénes somos' },
  { id: 'nuestra-historia', label: 'Nuestra historia' },
  { id: 'nuestros-valores', label: 'Valores' },
  { id: 'nuestra-metodologia', label: 'Metodología' },
  { id: 'nuestras-secciones', label: 'Secciones' },
  { id: 'nuestro-consejo', label: 'Consejo' },
];

export const CONOCENOS_HERO = {
  eyebrow: 'Grupo IV Scout San José de Calasanz · Montequinto',
  titleStart: 'Mucho más que un grupo scout.',
  titleAccent: 'Un camino para crecer, compartir y dejar huella.',
  lead: 'Desde 1979 acompañamos a niños, niñas, jóvenes y familias de Montequinto educando en el tiempo libre, en la naturaleza y en los valores del escultismo católico.',
  photoAlt:
    'Educandos de distintas ramas y responsables del Grupo IV Scout San José de Calasanz reunidos con guitarra y pañoletas',
  highlights: [
    { label: 'Trayectoria', value: 'Desde 1979 en Montequinto' },
    { label: 'Parroquia', value: 'Ntra. Sra. de los Ángeles' },
    { label: 'Federación', value: 'Scouts de Sevilla MSC' },
  ],
};

export const QUIENES_SOMOS = {
  kicker: 'Quiénes somos',
  titleStart: 'Una familia que educa',
  titleAccent: 'desde la cercanía y la fe.',
  lead: 'El Grupo IV Scout San José de Calasanz es una comunidad educativa sin ánimo de lucro formada por educandos, responsables voluntarios (Kraal) y familias del barrio de Montequinto, en Dos Hermanas (Sevilla).',
  paragraphs: [
    'Nuestra vida de grupo late vinculada a la parroquia Nuestra Señora de los Ángeles y San José de Calasanz, donde nos reunimos habitualmente los sábados. Desde ahí vivimos nuestra identidad scout católica integrada en Scouts de Sevilla MSC (Movimiento Scout Católico), acogiendo con naturalidad la fe como un camino cercano de alegría, reflexión y servicio.',
    'Para quienes se acercan al escultismo por primera vez, proponemos un espacio complementario a la escuela y a la familia: talleres, juegos al aire libre, acampadas de fin de semana y campamentos donde cada niño, niña o joven aprende a valerse por sí mismo junto a sus compañeros.',
    'Crecer en comunidad significa tener referentes adultos comprometidos, hacer amigos que perduran con los años y descubrir que cada persona aporta algo valioso. Nos une el deseo de cuidar a las personas y contribuir a construir un Montequinto más solidario, abierto y atento a su entorno.',
  ],
  pillars: [
    {
      label: 'Identidad',
      title: 'Grupo IV Scout San José de Calasanz',
      detail: 'Escultismo católico abierto a familias del barrio y comprometido con su comunidad.',
    },
    {
      label: 'Raíz local',
      title: 'Parroquia Ntra. Sra. de los Ángeles',
      detail: 'Punto de encuentro en Montequinto donde compartimos locales, actividades y vida parroquial.',
    },
    {
      label: 'Pertenencia',
      title: 'Scouts de Sevilla MSC',
      detail: 'Caminamos en red con otros grupos scouts de Sevilla y Andalucía en formación y encuentros.',
    },
  ],
};

export const HISTORIA_INTRO = {
  kicker: 'Nuestra historia',
  titleStart: 'Generaciones unidas por',
  titleAccent: 'una misma pañoleta.',
  narrative:
    'Más que una sucesión de años, nuestra historia está hecha de nombres propios, mochilas preparadas los viernes por la tarde, canciones compartidas y familias que han visto crecer en el grupo a hijos que hoy vuelven convertidos en responsables.',
  closingTitle: 'El legado continúa cada sábado',
  closingBody:
    'Quienes comenzaron en aquellos primeros años abrieron un camino que hoy recorren nuevas generaciones de Castores, Lobatos, Rangers, Pioneros y Rutas. Cada ronda solar renueva el compromiso de seguir siendo hogar para los jóvenes de Montequinto.',
};

export const HISTORIA_MILESTONES: HistoryMilestone[] = [
  {
    id: 'origen-1979',
    period: 'Desde 1979',
    tag: 'Los comienzos en el barrio',
    title: 'Las primeras raíces en Montequinto',
    summary:
      'El Grupo IV desarrolla su actividad educativa en Montequinto desde 1979, cuando el barrio daba sus primeros pasos.',
    detail:
      'Los scouts estuvieron entre las primeras actividades pastorales surgidas en torno a la parroquia Nuestra Señora de los Ángeles, ofreciendo desde el inicio un espacio de encuentro, tiempo libre sano y vida comunitaria para la infancia y juventud de la zona.',
    photoAlt:
      'Fotografía histórica de archivo con educandos y responsables del grupo cogidos de la mano frente a las puertas de la parroquia',
    photoEra: 'historica',
    photoOrientation: 'landscape',
  },
  {
    id: 'consolidacion-1997',
    period: 'En torno a 1997',
    tag: 'Crecimiento comunitario',
    title: 'Alrededor de 120 chicos y chicas en marcha',
    summary:
      'A finales de los noventa el grupo alcanzó en torno a 120 educandos participando de forma regular.',
    detail:
      'Ese impulso consolidó al Grupo IV como una referencia educativa en Montequinto, multiplicando campamentos, convivencias y un relevo natural de antiguos educandos que asumían la responsabilidad de acompañar a los más pequeños.',
    photoAlt: 'Educandos del grupo en el San Jorge de 1998',
    photoEra: 'actual',
    photoOrientation: 'landscape',
  },
  {
    id: 'asamblea-2013',
    period: '2013',
    tag: 'Compromiso asociativo',
    title: 'Anfitriones de la Asamblea Anual de Scouts de Sevilla MSC',
    summary:
      'En 2013 el grupo acogió en Montequinto la Asamblea Anual de Scouts de Sevilla MSC.',
    detail:
      'Ser grupo anfitrión supuso abrir nuestro barrio al conjunto del escultismo católico sevillano, compartiendo trabajo en equipo, acogida y diálogo sobre el proyecto educativo común.',
    photoAlt: 'Fotografía de la Asamblea Anual de Scouts de Sevilla MSC celebrada en Montequinto en 2013',
    photoEra: 'actual',
    photoOrientation: 'landscape',
  },
  {
    id: 'aniversario-2024',
    period: '2024',
    tag: 'Memoria viva',
    title: 'Celebración del 45 aniversario',
    summary:
      'En 2024 celebramos 45 años de historia educativa continuada en Montequinto.',
    detail:
      'Cuarenta y cinco años después de aquel comienzo en 1979, antiguas y nuevas generaciones volvieron a encontrarse para agradecer todo lo vivido y mirar con ilusión hacia las próximas rondas solares.',
    photoAlt: 'Fotografía grupal de miembros de varias ramas y responsables del Grupo IV Scout',
    photoEra: 'actual',
    photoOrientation: 'landscape',
  },
];

export const VALUES_ITEMS: ValueItem[] = [
  {
    id: 'companerismo',
    number: '01',
    title: 'Compañerismo',
    lead: 'Crecer juntos, cuidarnos y construir comunidad.',
    description:
      'Nadie camina solo: aprendemos a escuchar, celebrar los logros compartidos y apoyar a quien se queda atrás en cada actividad.',
    iconName: 'users',
    emphasis: 'featured',
  },
  {
    id: 'servicio',
    number: '02',
    title: 'Servicio y solidaridad',
    lead: 'Estar disponibles y contribuir a mejorar nuestro entorno.',
    description:
      'Cultivamos una mirada atenta hacia las necesidades del barrio y de las personas cercanas, pasando de la palabra al gesto concreto.',
    iconName: 'heartHandshake',
    emphasis: 'dark',
  },
  {
    id: 'naturaleza',
    number: '03',
    title: 'Respeto por la naturaleza',
    lead: 'Conocer, disfrutar y proteger el entorno natural.',
    description:
      'Vivimos el aire libre con sencillez y gratitud, aprendiendo a cuidar el medio ambiente y a dejar cada lugar mejor de como lo encontramos.',
    iconName: 'trees',
    emphasis: 'standard',
  },
  {
    id: 'responsabilidad',
    number: '04',
    title: 'Responsabilidad y compromiso',
    lead: 'Aprender a tomar decisiones y cumplir nuestra palabra.',
    description:
      'Fomentamos la honestidad, el cuidado del material común y la coherencia entre lo que pensamos, decimos y hacemos.',
    iconName: 'shieldCheck',
    emphasis: 'standard',
  },
  {
    id: 'crecimiento',
    number: '05',
    title: 'Crecimiento personal',
    lead: 'Descubrir nuestras capacidades y avanzar a nuestro ritmo.',
    description:
      'Cada niño y joven es único: acompañamos sus talentos, sus preguntas y su progreso sin comparaciones ni prisas.',
    iconName: 'sprout',
    emphasis: 'soft',
  },
  {
    id: 'fe',
    number: '06',
    title: 'Fe y espiritualidad',
    lead: 'Vivir nuestra dimensión cristiana desde la reflexión, la experiencia y el servicio.',
    description:
      'Integramos la fe de manera natural en nuestra vida parroquial y comunitaria, abierta al diálogo, la interioridad y el amor al prójimo.',
    iconName: 'flame',
    emphasis: 'soft',
  },
];

export const METHODOLOGY_ITEMS: MethodologyStep[] = [
  {
    id: 'aprender-haciendo',
    step: '01',
    title: 'Aprender haciendo',
    summary: 'La experiencia directa es el motor de cada aprendizaje.',
    example:
      'En lugar de recibir charlas teóricas, montan su mochila, preparan una ruta o resuelven retos en equipo.',
    iconName: 'hammer',
  },
  {
    id: 'pequenos-grupos',
    step: '02',
    title: 'Crecer en pequeños grupos',
    summary: 'Equipos reducidos donde cada persona cuenta y aporta.',
    example:
      'Cada miembro tiene un papel concreto dentro de su pequeño grupo y aprende a tomar decisiones conjuntas.',
    iconName: 'users',
  },
  {
    id: 'autonomia',
    step: '03',
    title: 'Desarrollar autonomía y responsabilidad',
    summary: 'Confianza progresiva adaptada a cada edad.',
    example:
      'De organizar su propio equipo en Castores y Lobatos a diseñar proyectos completos en Pioneros y Rutas.',
    iconName: 'compass',
  },
  {
    id: 'convivencia',
    step: '04',
    title: 'Aprender a convivir y trabajar en equipo',
    summary: 'El grupo como escuela de respeto, diálogo y amistad.',
    example:
      'Compartir acampadas, tareas cotidianas y sobremesas enseña a colaborar más allá de las diferencias.',
    iconName: 'handshake',
  },
  {
    id: 'servicio',
    step: '05',
    title: 'Participar en proyectos y actividades de servicio',
    summary: 'Compromiso práctico con el barrio y la parroquia.',
    example:
      'Acciones solidarias, cuidado de espacios y colaboraciones que muestran cómo ayudar transforma la realidad.',
    iconName: 'heart',
  },
  {
    id: 'naturaleza',
    step: '06',
    title: 'Utilizar la naturaleza como espacio educativo',
    summary: 'Salir del entorno cotidiano para mirar más lejos.',
    example:
      'Las salidas y campamentos despiertan asombro, sencillez y responsabilidad ecológica.',
    iconName: 'trees',
  },
  {
    id: 'espiritualidad',
    step: '07',
    title: 'Favorecer el crecimiento personal y espiritual',
    summary: 'Acompañamiento humano integral y abierto al sentido de la vida.',
    example:
      'Espacios tranquilos de reflexión, revisión personal y vivencia cristiana sencilla al ritmo de cada joven.',
    iconName: 'sparkles',
  },
];

export const SECTIONS_DATA: ScoutSectionItem[] = [
  {
    id: 'castores',
    name: 'Castores',
    ages: '6–8 años',
    stageLabel: 'Etapa 1 · Primeros descubrimientos',
    shortDesc:
      'Los más pequeños dan sus primeros pasos en el escultismo a través del juego, la imaginación y el descubrimiento compartido.',
    whatTheyDo: [
      'Juegos cooperativos y talleres creativos adaptados a su edad.',
      'Primeras experiencias compartidas fuera de casa en convivencia.',
      'Hábitos cotidianos de amistad, orden y cuidado mutuo.',
    ],
    motto: 'Descubrir el mundo compartiendo con alegría.',
    photoAlt: 'Castores del grupo IV en el campamento de verano de 2026',
    photoOrientation: 'landscape',
    accentBg: 'bg-orange-50/70',
    accentBorder: 'border-orange-200/80',
    accentText: 'text-orange-900',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    dotClass: 'bg-orange-500',
  },
  {
    id: 'lobatos',
    name: 'Lobatos',
    ages: '9–11 años',
    stageLabel: 'Etapa 2 · Juego, amistad y vida en grupo',
    shortDesc:
      'Con más curiosidad y energía, aprenden a convivir en equipo, desarrollar destrezas prácticas y ayudar a los demás en el día a día.',
    whatTheyDo: [
      'Dinámicas en pequeños equipos para fomentar la colaboración.',
      'Talleres al aire libre, orientación básica y juegos en la naturaleza.',
      'Pequeñas responsabilidades compartidas en reuniones y acampadas.',
    ],
    motto: 'Aprender haciendo lo mejor posible cada día.',
    photoAlt: 'Lobatos del grupo IV en el campamento de semana santa de 2025',
    photoOrientation: 'landscape',
    accentBg: 'bg-amber-50/70',
    accentBorder: 'border-amber-200/85',
    accentText: 'text-amber-950',
    badgeClass: 'bg-amber-100 text-amber-900 border-amber-300',
    dotClass: 'bg-amber-500',
  },
  {
    id: 'rangers',
    name: 'Rangers',
    ages: '12–14 años',
    stageLabel: 'Etapa 3 · Aventura y trabajo en equipo',
    shortDesc:
      'La etapa de las grandes excursiones, el protagonismo en equipo y el aprendizaje autónomo en contacto directo con la naturaleza.',
    whatTheyDo: [
      'Organización de actividades y retos en pequeños grupos.',
      'Rutas, acampadas y habilidades de vida al aire libre.',
      'Espacios de diálogo sobre amistad, respeto y compromiso personal.',
    ],
    motto: 'Explorar juntos y crecer asumiendo nuevos retos.',
    photoAlt: 'Rangers del grupo IV en el campamento de Navidad de 2025',
    photoOrientation: 'landscape',
    accentBg: 'bg-sky-50/75',
    accentBorder: 'border-sky-200/85',
    accentText: 'text-sky-950',
    badgeClass: 'bg-sky-100 text-sky-900 border-sky-200',
    dotClass: 'bg-sky-600',
  },
  {
    id: 'pioneros',
    name: 'Pioneros',
    ages: '15–17 años',
    stageLabel: 'Etapa 4 · Iniciativa, proyectos y comunidad',
    shortDesc:
      'Los jóvenes pasan de participar a diseñar y sacar adelante sus propios proyectos, combinando convivencia, reflexión y servicio.',
    whatTheyDo: [
      'Planificación real de iniciativas educativas, solidarias o de grupo.',
      'Trabajo corresponsable en equipo con acompañamiento del Kraal.',
      'Convivencias y campamentos donde consolidan su criterio propio.',
    ],
    motto: 'Construir juntos proyectos que dejan huella.',
    photoAlt: 'Pioneros del grupo IV en Santiago de Compostela tras finalizar el cammino de Santiago en el verano de 2025',
    photoOrientation: 'landscape',
    accentBg: 'bg-rose-50/65',
    accentBorder: 'border-rose-200/80',
    accentText: 'text-rose-950',
    badgeClass: 'bg-rose-100 text-rose-800 border-rose-200',
    dotClass: 'bg-[#e22328]',
  },
  {
    id: 'rutas',
    name: 'Rutas',
    ages: '18–20 años',
    stageLabel: 'Etapa 5 · Autonomía y compromiso adulto',
    shortDesc:
      'La última etapa como educandos culmina el recorrido scout con una mirada madura, autónoma y comprometida con el servicio a los demás. En esta etapa ya no pertenecen al grupo IV en cuestión sino que pertenecen a la agrupación de rutas de Sevilla llamada la Agrupación la Ruta de Hércules.',
    whatTheyDo: [
      'Marchas, proyectos de servicio y experiencias de voluntariado.',
      'Discernimiento personal, ciudadanía activa y vivencia madura de la fe.',
      'Preparación para dar el paso, si lo desean, al compromiso como responsables.',
    ],
    motto: 'Caminar con sentido y ponerse al servicio de los demás.',
    photoAlt: 'Antiguos rutas del grupo IV en el campamento de verano de 2026',
    photoOrientation: 'landscape',
    accentBg: 'bg-emerald-50/65',
    accentBorder: 'border-emerald-200/80',
    accentText: 'text-emerald-950',
    badgeClass: 'bg-emerald-100 text-emerald-900 border-emerald-200',
    dotClass: 'bg-emerald-600',
  },
];
