// The words of booking and of its editors, in English and Spanish.

import type { Locale, Place, Question } from '@reboschedule/core';

export interface Words {
  minutes: (n: number) => string;
  places: Record<Place['kind'], string>;
  questionKinds: Record<Question['kind'], string>;
  weekdays: string[];
  // Booking.
  pickDay: string;
  pickTime: string;
  noTimes: string;
  noTimesMonth: string;
  noneFree: string;
  timeZone: string;
  back: string;
  details: string;
  name: string;
  email: string;
  book: string;
  booking: string;
  booked: string;
  held: string;
  attendance: string;
  arrived: string;
  noShow: string;
  coupon: string;
  noCoupon: string;
  heldUntil: (time: string) => string;
  pay: string;
  letGo: string;
  runOut: string;
  bookedFor: (when: string) => string;
  addGoogle: string;
  addIcs: string;
  manage: string;
  previous: string;
  next: string;
  loading: string;
  failed: string;
  cancelled: string;
  length: string;
  which: string;
  any: string;
  left: (n: number) => string;
  resourcesCount: (n: number) => string;
  dayParts: Record<'morning' | 'afternoon' | 'evening', string>;
  bookAnother: string;
  total: (money: string) => string;
  from: (money: string) => string;
  perHour: string;
  // The editors.
  hours: string;
  dayOff: string;
  addHours: string;
  copyToAll: string;
  specialDays: string;
  specialHint: string;
  addDay: string;
  closed: string;
  remove: string;
  title: string;
  slug: string;
  description: string;
  duration: string;
  increment: string;
  before: string;
  after: string;
  notice: string;
  horizon: string;
  perDay: string;
  noLimit: string;
  place: string;
  placeValue: Record<Place['kind'], string>;
  questions: string;
  addQuestion: string;
  required: string;
  color: string;
  lengths: string;
  resources: string;
  resourcesHint: string;
  resourceName: string;
  fieldsTitle: string;
  fieldsHint: string;
  fieldLabel: string;
  fieldKind: string;
  fieldKinds: Record<'text' | 'number' | 'yes-no', string>;
  unit: string;
  addField: string;
  uploadImage: string;
  removeImage: string;
  imageTooBig: string;
  price: string;
  priceHint: string;
  amount: string;
  currency: string;
  per: Record<'hour' | 'booking', string>;
  ownPrice: string;
  addResource: string;
  capacity: string;
  capacityHint: string;
  ownHours: string;
  ownHoursHint: string;
  // The calendar.
  turn: (n: number) => string;
  // The day.
  placeN: (n: number) => string;
  previousDay: string;
  previousWeek: string;
  nextWeek: string;
  nextDay: string;
  gapsToday: (n: number) => string;
  noGapsToday: string;
  closedDay: string;
  everything: string;
  month: string;
  day: string;
  // The panel.
  assign: string;
  save: string;
  saving: string;
  move: string;
  moving: string;
  keep: string;
  deleteBooking: string;
  confirmDelete: (name: string) => string;
  yesDelete: string;
  close: string;
  once: string;
  everyWeek: (n: number) => string;
  someTaken: (n: number) => string;
  inSeries: string;
  onlyThis: string;
  wholeSeries: string;
  repeatTitle: string;
  bookedSeries: (n: number) => string;
  skipped: (n: number) => string;
  away: string;
  today: string;
  freePlaces: (n: number) => string;
  free: string;
  gaps: (n: number) => string;
  gapsAhead: (n: number) => string;
  noGapsAhead: string;
  nextGap: string;
  more: (n: number) => string;
  // The bookings.
  upcoming: string;
  past: string;
  noBookings: string;
}

const en: Words = {
  minutes: (n) => (n < 60 ? `${n} min` : n % 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n / 60} h`),
  places: { 'in-person': 'In person', phone: 'Phone call', video: 'Video call', custom: 'Other' },
  questionKinds: { text: 'A line', long: 'A paragraph', phone: 'A phone' },
  weekdays: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'],
  pickDay: 'Choose a day',
  pickTime: 'Choose a time',
  noTimes: 'No times free that day.',
  noTimesMonth: 'No times free this month: try the next.',
  noneFree: 'There are no times free for now.',
  timeZone: 'Time zone',
  back: 'Back',
  details: 'Your details',
  name: 'Name',
  email: 'Email',
  book: 'Book',
  booking: 'Booking…',
  booked: 'Booked',
  held: 'Held for you',
  attendance: 'Whether they came',
  arrived: 'Came',
  noShow: 'Did not come',
  coupon: 'Discount code',
  noCoupon: 'No such code.',
  heldUntil: (time) => `Pay before ${time} and it is yours; after, it is free again.`,
  pay: 'Pay',
  letGo: 'Let it go',
  runOut: 'Its minutes ran out: it is free again.',
  bookedFor: (when) => `You are booked for ${when}. An invitation is on its way to your email.`,
  addGoogle: 'Add to Google Calendar',
  addIcs: 'Download for your calendar (.ics)',
  manage: 'See or cancel it',
  previous: 'Previous month',
  next: 'Next month',
  loading: 'Loading the times…',
  failed: 'The times could not be loaded.',
  cancelled: 'Cancelled',
  length: 'For how long',
  which: 'Choose one',
  any: 'Any free',
  left: (n) => (n === 1 ? '1 left' : `${n} left`),
  resourcesCount: (n) => (n === 1 ? '1 to choose from' : `${n} to choose from`),
  dayParts: { morning: 'Morning', afternoon: 'Afternoon', evening: 'Evening' },
  bookAnother: 'Book another',
  total: (m) => `Total: ${m}`,
  from: (m) => `From ${m}`,
  perHour: '/ h',
  hours: 'Weekly hours',
  dayOff: 'Day off',
  addHours: 'Add hours',
  copyToAll: 'Copy to every day',
  specialDays: 'Days that are not as the week',
  specialHint: 'A holiday, a Saturday open: its own hours, or none.',
  addDay: 'Add a day',
  closed: 'Closed',
  remove: 'Remove',
  title: 'Title',
  slug: 'Its address',
  description: 'What it is',
  duration: 'How long',
  increment: 'A start every',
  before: 'Free before',
  after: 'Free after',
  notice: 'At least this soon',
  horizon: 'Days ahead',
  perDay: 'At most a day',
  noLimit: 'As many as fit',
  place: 'Where',
  placeValue: { 'in-person': 'The address', phone: 'The number', video: 'The link of the call', custom: 'Say where' },
  questions: 'What is asked',
  addQuestion: 'Add a question',
  required: 'Required',
  color: 'Colour',
  lengths: 'It may also be booked for',
  resources: 'What is booked',
  resourcesHint: 'Courts, rooms, desks: things alike, each booked on its own. None, your own time.',
  resourceName: 'Its name',
  fieldsTitle: 'What each one says of itself',
  fieldsHint: 'Fields they all have: the surface, whether it is covered, how many it holds.',
  fieldLabel: 'The field’s name',
  fieldKind: 'Its kind',
  fieldKinds: { text: 'Text', number: 'Number', 'yes-no': 'Yes or no' },
  unit: 'Unit',
  addField: 'Add a field',
  uploadImage: 'Upload a picture',
  removeImage: 'Remove the picture',
  imageTooBig: 'That picture weighs more than 220 KB: try a smaller one.',
  price: 'It has a price',
  priceHint: 'Whoever books sees the total before booking, and it is kept with the booking. Taking the money is up to you.',
  amount: 'Amount',
  currency: 'Currency',
  per: { hour: 'Per hour', booking: 'Per booking' },
  ownPrice: 'Its own price',
  addResource: 'Add one',
  capacity: 'Places at once',
  capacityHint: 'How many may book the same time of each: the guards of a shift, the people of a class.',
  ownHours: 'Hours of its own',
  ownHoursHint: 'When it is open, instead of your weekly hours: a court from 7 to 22 every day. Your days that are not as the week still close it.',
  turn: (n) => `Shift ${n}`,
  placeN: (n) => `Place ${n}`,
  previousDay: 'Previous day',
  previousWeek: 'Previous week',
  nextWeek: 'Next week',
  nextDay: 'Next day',
  gapsToday: (n) => (n === 1 ? '1 gap free this day' : `${n} gaps free this day`),
  noGapsToday: 'Nothing free this day.',
  closedDay: 'Closed this day.',
  everything: 'All',
  month: 'Month',
  day: 'Day',
  assign: 'Assign',
  save: 'Save',
  saving: 'Saving…',
  move: 'Move',
  moving: 'Choose the new gap in the calendar.',
  keep: 'No, keep it',
  deleteBooking: 'Delete',
  confirmDelete: (name) => `Delete ${name}’s booking? Their place is left free.`,
  yesDelete: 'Yes, delete',
  close: 'Close',
  once: 'Once',
  everyWeek: (n) => `Every week × ${n}`,
  someTaken: (n) => (n === 1 ? 'One of them is not free: the others are given.' : `${n} of them are not free: the others are given.`),
  inSeries: 'One of a series, every week.',
  onlyThis: 'Only this one',
  wholeSeries: 'This and the rest',
  repeatTitle: 'How often',
  bookedSeries: (n) => `${n} booked, every week.`,
  skipped: (n) => (n === 1 ? 'One week was full, and was left out:' : `${n} weeks were full, and were left out:`),
  away: 'Busy',
  today: 'Today',
  freePlaces: (n) => (n === 1 ? '1 free' : `${n} free`),
  free: 'Free',
  gaps: (n) => (n === 1 ? '1 time free' : `${n} times free`),
  gapsAhead: (n) => (n === 1 ? '1 gap still free ahead' : `${n} gaps still free ahead`),
  noGapsAhead: 'Everything ahead is covered.',
  nextGap: 'Go to the next',
  more: (n) => `+${n} more`,
  upcoming: 'Coming',
  past: 'Past and cancelled',
  noBookings: 'Nothing booked yet.',
};

const es: Words = {
  minutes: (n) => (n < 60 ? `${n} min` : n % 60 ? `${Math.floor(n / 60)} h ${n % 60} min` : `${n / 60} h`),
  places: { 'in-person': 'En persona', phone: 'Llamada', video: 'Videollamada', custom: 'Otro' },
  questionKinds: { text: 'Una línea', long: 'Un párrafo', phone: 'Un teléfono' },
  weekdays: ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'],
  pickDay: 'Elige un día',
  pickTime: 'Elige un horario',
  noTimes: 'No hay horarios libres ese día.',
  noTimesMonth: 'No hay horarios libres este mes: prueba el siguiente.',
  noneFree: 'Por ahora no hay horarios libres.',
  timeZone: 'Zona horaria',
  back: 'Atrás',
  details: 'Tus datos',
  name: 'Nombre',
  email: 'Correo',
  book: 'Reservar',
  booking: 'Reservando…',
  booked: 'Reservado',
  held: 'Apartado para ti',
  attendance: 'Si vino',
  arrived: 'Llegó',
  noShow: 'No vino',
  coupon: 'Código de descuento',
  noCoupon: 'Ese código no existe.',
  heldUntil: (time) => `Paga antes de las ${time} y es tuyo; después se libera.`,
  pay: 'Pagar',
  letGo: 'Soltarlo',
  runOut: 'Se acabó el tiempo: se liberó.',
  bookedFor: (when) => `Tu cita es el ${when}. Te llega una invitación a tu correo.`,
  addGoogle: 'Agregar a Google Calendar',
  addIcs: 'Descargar para tu calendario (.ics)',
  manage: 'Verla o cancelarla',
  previous: 'Mes anterior',
  next: 'Mes siguiente',
  loading: 'Cargando los horarios…',
  failed: 'No se pudieron cargar los horarios.',
  cancelled: 'Cancelada',
  length: 'Por cuánto tiempo',
  which: 'Elige una',
  any: 'Cualquiera libre',
  left: (n) => (n === 1 ? 'queda 1' : `quedan ${n}`),
  resourcesCount: (n) => (n === 1 ? '1 para elegir' : `${n} para elegir`),
  dayParts: { morning: 'Mañana', afternoon: 'Tarde', evening: 'Noche' },
  bookAnother: 'Reservar otra',
  total: (m) => `Total: ${m}`,
  from: (m) => `Desde ${m}`,
  perHour: '/ h',
  hours: 'Horario semanal',
  dayOff: 'Descanso',
  addHours: 'Agregar horario',
  copyToAll: 'Copiar a todos los días',
  specialDays: 'Días distintos a la semana',
  specialHint: 'Un festivo, un sábado abierto: su propio horario, o ninguno.',
  addDay: 'Agregar un día',
  closed: 'Cerrado',
  remove: 'Quitar',
  title: 'Título',
  slug: 'Su dirección',
  description: 'Qué es',
  duration: 'Cuánto dura',
  increment: 'Un inicio cada',
  before: 'Libre antes',
  after: 'Libre después',
  notice: 'Con al menos',
  horizon: 'Días hacia adelante',
  perDay: 'Máximo al día',
  noLimit: 'Las que quepan',
  place: 'Dónde',
  placeValue: { 'in-person': 'La dirección', phone: 'El número', video: 'La liga de la llamada', custom: 'Di dónde' },
  questions: 'Qué se pregunta',
  addQuestion: 'Agregar una pregunta',
  required: 'Obligatoria',
  color: 'Color',
  lengths: 'También se puede reservar por',
  resources: 'Qué se reserva',
  resourcesHint: 'Canchas, salas, escritorios: cosas iguales, cada una se reserva por separado. Ninguna, tu propio tiempo.',
  resourceName: 'Su nombre',
  fieldsTitle: 'Lo que dice cada una',
  fieldsHint: 'Campos que tienen todas: la superficie, si es techada, cuántas personas caben.',
  fieldLabel: 'Nombre del campo',
  fieldKind: 'Su tipo',
  fieldKinds: { text: 'Texto', number: 'Número', 'yes-no': 'Sí o no' },
  unit: 'Unidad',
  addField: 'Agregar campo',
  uploadImage: 'Subir imagen',
  removeImage: 'Quitar imagen',
  imageTooBig: 'Esa imagen pesa más de 220 KB: prueba con una más ligera.',
  price: 'Tiene precio',
  priceHint: 'Quien reserva ve el total antes de reservar, y se guarda con la reserva. Cobrarlo queda de tu lado.',
  amount: 'Monto',
  currency: 'Moneda',
  per: { hour: 'Por hora', booking: 'Por reserva' },
  ownPrice: 'Precio propio',
  addResource: 'Agregar una',
  capacity: 'Lugares a la vez',
  capacityHint: 'Cuántos pueden reservar el mismo horario de cada una: los asesores de una guardia, las personas de una clase.',
  ownHours: 'Horario propio',
  ownHoursHint: 'Cuándo está abierto, en lugar de tu horario semanal: una cancha de 7 a 22 todos los días. Tus días distintos a la semana la cierran igual.',
  turn: (n) => `Turno ${n}`,
  placeN: (n) => `Lugar ${n}`,
  previousDay: 'Día anterior',
  previousWeek: 'Semana anterior',
  nextWeek: 'Semana siguiente',
  nextDay: 'Día siguiente',
  gapsToday: (n) => (n === 1 ? '1 hueco libre este día' : `${n} huecos libres este día`),
  noGapsToday: 'Nada libre este día.',
  closedDay: 'Cerrado este día.',
  everything: 'Todo',
  month: 'Mes',
  day: 'Día',
  assign: 'Asignar',
  save: 'Guardar',
  saving: 'Guardando…',
  move: 'Mover',
  moving: 'Elige en el calendario el hueco nuevo.',
  keep: 'No, déjala',
  deleteBooking: 'Eliminar',
  confirmDelete: (name) => `¿Eliminar la reserva de ${name}? Su lugar queda libre.`,
  yesDelete: 'Sí, eliminar',
  close: 'Cerrar',
  once: 'Una vez',
  everyWeek: (n) => `Cada semana × ${n}`,
  someTaken: (n) => (n === 1 ? 'Una no está libre: se apartan las demás.' : `${n} no están libres: se apartan las demás.`),
  inSeries: 'Una de una serie, cada semana.',
  onlyThis: 'Solo esta',
  wholeSeries: 'Esta y las siguientes',
  repeatTitle: 'Cada cuándo',
  bookedSeries: (n) => `${n} reservadas, cada semana.`,
  skipped: (n) => (n === 1 ? 'Una semana estaba llena y se dejó fuera:' : `${n} semanas estaban llenas y se dejaron fuera:`),
  away: 'Ocupado',
  today: 'Hoy',
  freePlaces: (n) => (n === 1 ? '1 libre' : `${n} libres`),
  free: 'Libre',
  gaps: (n) => (n === 1 ? '1 hueco' : `${n} huecos`),
  gapsAhead: (n) => (n === 1 ? 'Queda 1 hueco libre por delante' : `Quedan ${n} huecos libres por delante`),
  noGapsAhead: 'Todo lo que viene está cubierto.',
  nextGap: 'Ir al siguiente',
  more: (n) => `+${n} más`,
  upcoming: 'Próximas',
  past: 'Pasadas y canceladas',
  noBookings: 'Todavía no hay citas.',
};

export const WORDS: Record<Locale, Words> = { en, es };
