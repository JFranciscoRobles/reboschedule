// The landing page, as Rebodocs has its own: the hero (what it is, in a line
// a hand underlines; the packages to install; both sides of a booking,
// moving), what it does in a row of tags, its numbers, the demos to try, its
// features, the code of each package, the packages, and where it stands.

import type { Metadata } from 'next';
import Link from 'next/link';
import type { ReactNode } from 'react';
import { SiteFooter, SiteHeader } from '@/components/Chrome';
import { CodeTabs } from '@/components/home/CodeTabs';
import { HeroPreview } from '@/components/home/HeroPreview';
import { InstallPicker } from '@/components/home/InstallPicker';
import { LandingDemo } from '@/components/home/LandingDemo';
import { primary, secondary } from '@/components/home/buttons';
import { LocaleProvider } from '@/components/i18n';
import { highlight } from '@/lib/highlight';
import { coreDependencies, FEATURES, NPM_ORG, npmOf, PACKAGES, PASTEL_CLASS, type Pastel, pastelAt, TAGS, testCount, timeZoneCount, VERSION } from '@/lib/home';
import { type L, type Locale, localize, translator } from '@/lib/i18n';
import { SCENARIOS } from '@/lib/scenarios';

const TITLE: L = { en: 'ReboSchedule: the bookings you build into your app', es: 'ReboSchedule: las reservas que integras en tu aplicación' };
const DESCRIPTION: L = {
  en: 'Appointments, courts, rooms and shifts: whoever needs one books the times still free, in their time zone and at its price; whoever looks after them sees the month and the day, and gives, moves or frees each one. In packages you take one at a time.',
  es: 'Citas, canchas, salas y guardias: quien necesita una reserva los horarios libres, en su zona horaria y a su precio; quien las atiende ve el mes y el día, y aparta, mueve o libera cada una. En paquetes que tomas de uno en uno.',
};

export const homeMetadata = (locale: Locale): Metadata => ({ title: { absolute: translator(locale)(TITLE) }, description: translator(locale)(DESCRIPTION) });

/** The examples beside "For developers": a name for the tab, the language of the code, and the code. */
const SAMPLES: [L, string, L][] = [
  [
    { en: 'Widget', es: 'Widget' },
    'tsx',
    {
      en: `import '@reboschedule/react/styles.css';
import { BookingWidget } from '@reboschedule/react';

export default function BookACourt() {
  return (
    <BookingWidget
      endpoint="/s/court"
      locale="en"
      onBooked={({ booking }) => track(booking)}
    />
  );
}`,
      es: `import '@reboschedule/react/styles.css';
import { BookingWidget } from '@reboschedule/react';

export default function ReservaCancha() {
  return (
    <BookingWidget
      endpoint="/s/cancha"
      locale="es"
      onBooked={({ booking }) => registrar(booking)}
    />
  );
}`,
    },
  ],
  [
    { en: 'Your UI', es: 'Tu interfaz' },
    'tsx',
    {
      en: `import { useBooking } from '@reboschedule/react';

// The widget's state, drawn your way.
function Times() {
  const b = useBooking({ endpoint: '/s/court' });
  return b.times.map((slot) => (
    <button key={slot.start} onClick={() => b.choose(slot)}>
      {clock(slot.start)} · {money(slot.price)}
    </button>
  ));
}`,
      es: `import { useBooking } from '@reboschedule/react';

// El estado del widget, dibujado a tu manera.
function Horarios() {
  const b = useBooking({ endpoint: '/s/cancha' });
  return b.times.map((slot) => (
    <button key={slot.start} onClick={() => b.choose(slot)}>
      {reloj(slot.start)} · {dinero(slot.price)}
    </button>
  ));
}`,
    },
  ],
  [
    { en: 'Calendar', es: 'Calendario' },
    'tsx',
    {
      en: `import { BookingDay, BookingPanel } from '@reboschedule/react';

// A column for each court; a gap, given away in a click.
<BookingDay
  bookings={bookings}
  types={types}
  schedule={schedule}
  type="court"
  slots={gaps}
  onPick={(slot) => setGap(slot)}
  onSelect={(booking) => setOpen(booking)}
/>`,
      es: `import { BookingDay, BookingPanel } from '@reboschedule/react';

// Una columna por cancha; un hueco, apartado en un clic.
<BookingDay
  bookings={reservas}
  types={tipos}
  schedule={horario}
  type="court"
  slots={huecos}
  onPick={(slot) => setHueco(slot)}
  onSelect={(reserva) => setAbierta(reserva)}
/>`,
    },
  ],
  [
    { en: 'Server', es: 'Servidor' },
    'ts',
    {
      en: `import { createBookingHandler } from '@reboschedule/server';

// A Request to a Response: Next.js, Workers, Bun, node:http.
export const handle = createBookingHandler({
  secret: process.env.BOOKING_SECRET,
  base: 'https://club.example.com',
  load: (slug) => db.calendarOf(slug),
  find: (id) => db.bookingOf(id),
  onBooked: (booking, { ics }) => db.keep(booking, ics),
});`,
      es: `import { createBookingHandler } from '@reboschedule/server';

// Un Request a un Response: Next.js, Workers, Bun, node:http.
export const handle = createBookingHandler({
  secret: process.env.BOOKING_SECRET,
  base: 'https://club.example.com',
  load: (slug) => db.calendarioDe(slug),
  find: (id) => db.reservaDe(id),
  onBooked: (reserva, { ics }) => db.guardar(reserva, ics),
});`,
    },
  ],
  [
    { en: 'Prices', es: 'Precios' },
    'ts',
    {
      en: `import { quoteOf } from '@reboschedule/core';

// The court's price each hour, and a hundred more in the evening.
createBookingHandler({
  quote: ({ type, resource, start, length }) => {
    const price = quoteOf(type, { resource, length });
    return isEvening(start) ? { ...price, amount: price.amount + 100 } : price;
  },
});`,
      es: `import { quoteOf } from '@reboschedule/core';

// El precio de la cancha por hora, y cien más en la noche.
createBookingHandler({
  quote: ({ type, resource, start, length }) => {
    const precio = quoteOf(type, { resource, length });
    return esNoche(start) ? { ...precio, amount: precio.amount + 100 } : precio;
  },
});`,
    },
  ],
  [
    { en: 'Engine', es: 'Motor' },
    'ts',
    {
      en: `import { slotsOf, slotsByDay } from '@reboschedule/core';

// The times free of court 5, for an hour and a half,
// laid out by the days of someone in Madrid.
const free = slotsOf(court, schedule, { busy, length: 90 });
const days = slotsByDay(free, 'Europe/Madrid');`,
      es: `import { slotsOf, slotsByDay } from '@reboschedule/core';

// Los horarios libres de la cancha 5, por hora y media,
// acomodados en los días de alguien en Madrid.
const libres = slotsOf(cancha, horario, { busy, length: 90 });
const dias = slotsByDay(libres, 'Europe/Madrid');`,
    },
  ],
];

const Pill = ({ color, children }: { color: Pastel; children: ReactNode }) => <span className={`rounded-full px-3 py-[5px] text-[13px] font-semibold ${PASTEL_CLASS[color]}`}>{children}</span>;
const Title = ({ children, small }: { children: ReactNode; small?: boolean }) => (
  <h2 className={`mt-4.5 font-display font-extrabold leading-[1.08] tracking-[-0.03em] ${small ? 'text-[clamp(34px,4.2vw,52px)]' : 'text-[clamp(36px,4.6vw,56px)]'}`}>{children}</h2>
);

const doodle = 'absolute hidden md:block';
/** A stroke drawn by hand, that draws itself in after `delay`. */
const drawn = (delay: string) => ({ className: 'draw animate-draw', style: { animationDelay: delay } });

/** The words the hand-drawn stroke underlines, and what comes before and after them. */
const HEADLINE: L<[string, string, string]> = {
  en: ['The bookings you ', 'build into', ' your app.'],
  es: ['Las reservas que ', 'integras', ' en tu aplicación.'],
};

function Hero({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const [before, underlined, after] = t(HEADLINE);
  return (
    <section id="top" className="relative mx-auto max-w-[1180px] px-6 pb-10 pt-18 text-center">
      <svg width="70" height="70" viewBox="0 0 70 70" aria-hidden="true" className={`${doodle} left-[6%] top-[90px] animate-float`}>
        <path {...drawn('1.2s')} d="M35 8l6 18 18 6-18 6-6 18-6-18-18-6 18-6z" fill="none" stroke="#E0A526" strokeWidth="2.5" strokeLinejoin="round" />
      </svg>
      <svg width="90" height="60" viewBox="0 0 90 60" aria-hidden="true" className={`${doodle} right-[7%] top-[120px] animate-float-slow`}>
        <path {...drawn('1.8s')} d="M6 40c12-28 24 18 36-6s22-20 42-6" fill="none" stroke="#E86A8C" strokeWidth="2.5" strokeLinecap="round" />
      </svg>
      {/* A clock's face, dotted, so it comes in instead of being drawn. */}
      <svg width="56" height="56" viewBox="0 0 56 56" aria-hidden="true" className={`${doodle} right-[13%] top-[330px] animate-float`}>
        <circle className="animate-pop-in opacity-0" style={{ animationDelay: '0.6s' }} cx="28" cy="28" r="20" fill="none" stroke="#6BAF7B" strokeWidth="2.5" strokeDasharray="4 7" />
        <path {...drawn('1s')} d="M28 16v12l8 5" fill="none" stroke="#6BAF7B" strokeWidth="2.5" strokeLinecap="round" />
      </svg>

      <p className="inline-flex items-center gap-2 rounded-full border border-border bg-surface py-1.5 pl-2 pr-3.5 text-sm text-muted">
        <span className="rounded-full border border-border bg-white px-2 py-0.5 text-xs font-semibold text-ink">{t({ en: 'New', es: 'Nuevo' })}</span>
        {t({ en: 'Prices each hour, and evenings that cost more', es: 'Precios por hora, y un horario pico que cuesta más' })}
      </p>
      <h1 className="mx-auto mt-7 max-w-[900px] text-balance font-display text-[clamp(44px,6.6vw,84px)] font-extrabold leading-[1.04] tracking-[-0.03em]">
        {before}
        <span className="relative whitespace-nowrap text-brand">
          {underlined}
          <svg viewBox="0 0 300 20" preserveAspectRatio="none" aria-hidden="true" className="absolute -bottom-2.5 left-0 h-[18px] w-full">
            <path {...drawn('0s')} d="M4 14C70 4 160 4 296 10" fill="none" stroke="#F5C443" strokeWidth="7" strokeLinecap="round" />
          </svg>
        </span>
        {after}
      </h1>
      <p className="mx-auto mt-7 max-w-[660px] text-[19px] leading-[1.6] text-muted">{t(DESCRIPTION)}</p>
      <p className="mt-8 flex flex-wrap justify-center gap-2.5 text-base">
        <Link href={localize('/docs/getting-started/', locale)} className={`rounded-xl px-5.5 py-3.5 ${primary}`}>
          {t({ en: 'Get started', es: 'Empezar' })}
        </Link>
        <a href="#demo" className={`px-5.5 py-3.5 ${secondary}`}>
          {t({ en: 'Try it below', es: 'Pruébalo abajo' })}
        </a>
      </p>
      <InstallPicker packages={PACKAGES} />
      <HeroPreview locale={locale} />
    </section>
  );
}

function Metrics({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const deps = coreDependencies();
  const metrics: { label: string; value: string; note: string }[] = [
    {
      label: t({ en: 'Automated tests', es: 'Pruebas automatizadas' }),
      value: String(testCount()),
      note: t({ en: 'In the engine, the server and the widgets, all passing', es: 'En el motor, el servidor y los componentes, todas pasando' }),
    },
    {
      label: t({ en: 'Time zones', es: 'Zonas horarias' }),
      value: String(timeZoneCount()),
      note: t({ en: 'Every one the platform knows, summer time and all', es: 'Todas las que conoce la plataforma, horario de verano incluido' }),
    },
    {
      label: t({ en: 'Dependencies of the engine', es: 'Dependencias del motor' }),
      value: String(deps),
      note: t({ en: 'Nothing but Intl, in the browser and in Node', es: 'Nada más que Intl, en el navegador y en Node' }),
    },
    {
      label: t({ en: 'Cases of use, working', es: 'Casos de uso, funcionando' }),
      value: String(SCENARIOS.length),
      note: t({ en: 'Appointments, courts, rooms and shifts, below', es: 'Citas, canchas, salas y guardias, aquí abajo' }),
    },
  ];
  return (
    <section aria-labelledby="metrics" className="mx-auto max-w-[1180px] px-6 pt-14">
      <h2 id="metrics" className="sr-only">
        {t({ en: 'By the numbers', es: 'En cifras' })}
      </h2>
      <dl className="reveal grid grid-cols-2 gap-3.5 lg:grid-cols-4">
        {metrics.map(({ label, value, note }) => (
          <div key={label} className="flex flex-col rounded-2xl border border-border bg-white p-5">
            <dt className="order-2 mt-1.5 text-[15px] font-semibold text-ink">{label}</dt>
            <dd className="order-1 m-0 text-[clamp(32px,4vw,44px)] font-semibold leading-none tracking-[-0.02em] text-ink">{value}</dd>
            <dd className="order-3 m-0 mt-1 text-sm leading-[1.45] text-muted">{note}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export async function HomePage({ locale }: { locale: Locale }) {
  const t = translator(locale);
  const samples = await Promise.all(SAMPLES.map(async ([name, lang, code]) => ({ name: t(name), html: await highlight(t(code), lang) })));
  const tests = testCount();
  return (
    <LocaleProvider locale={locale}>
      <div className="home overflow-x-clip text-ink">
        <SiteHeader locale={locale} path="/" />
        <main>
          <Hero locale={locale} />

          <ul className="reveal mx-auto flex max-w-[1180px] flex-wrap justify-center gap-2.5 px-6 pb-6 pt-14" aria-label={t({ en: 'What it does', es: 'Qué hace' })}>
            {TAGS.map((tag, i) => (
              <li key={tag.en} className={`rounded-full px-3.5 py-[7px] text-sm font-medium transition duration-250 hover:-translate-y-1 hover:shadow-lift ${PASTEL_CLASS[pastelAt(i)]}`}>
                {t(tag)}
              </li>
            ))}
          </ul>

          <Metrics locale={locale} />

          <section id="demo" className="mx-auto max-w-[1180px] scroll-mt-6 px-6 pb-15 pt-25">
            <div className="reveal mx-auto max-w-[720px] text-center">
              <Pill color="blue">{t({ en: 'Live demo', es: 'Demo en vivo' })}</Pill>
              <Title>{t({ en: 'Book on one side. See it on the other.', es: 'Reserva de un lado. Velo del otro.' })}</Title>
              <p className="mt-4.5 text-lg leading-[1.6] text-muted">
                {t({
                  en: 'Choose a court and how long, and book it as a player; then look at it as the club: the day with a column for each court, the gaps to give away, the panel to move or free a booking, the settings with fields, pictures and prices. Nothing leaves the browser.',
                  es: 'Elige una cancha y por cuánto tiempo, y resérvala como quien juega; luego mírala como el club: el día con una columna por cancha, los huecos por apartar, el panel para mover o liberar una reserva, los ajustes con campos, imágenes y precios. Nada sale del navegador.',
                })}
              </p>
            </div>
            <div className="reveal mt-11 rounded-3xl border border-border bg-surface p-3.5">
              <LandingDemo locale={locale} />
            </div>
          </section>

          <section className="mx-auto max-w-[1180px] px-6 py-20">
            <div className="reveal mx-auto mb-12 max-w-[720px] text-center">
              <Pill color="green">{t({ en: 'Features', es: 'Funciones' })}</Pill>
              <Title>{t({ en: 'Booking you can leave running.', es: 'Reservas que puedes dejar funcionando.' })}</Title>
            </div>
            <ul className="reveal grid grid-cols-[repeat(auto-fill,minmax(min(100%,340px),1fr))] gap-3.5">
              {FEATURES.map(([title, text, icon], i) => (
                <li key={title.en} className="group flex gap-3.5 rounded-2xl border border-border bg-white p-4.5 transition duration-250 hover:-translate-y-1 hover:shadow-lift">
                  <span className={`inline-flex size-11 flex-none items-center justify-center rounded-xl ${PASTEL_CLASS[pastelAt(i)]}`}>
                    <svg width="22" height="22" viewBox="0 0 24 24" aria-hidden="true" className="group-hover:animate-wiggle">
                      <path d={icon} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                  <div className="min-w-0 flex-1">
                    <h3 className="m-0 font-display text-[17px] font-bold tracking-[-0.01em]">{t(title)}</h3>
                    <p className="m-0 mt-1.5 text-[15px] leading-[1.55] text-muted">{t(text)}</p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section id="code" className="mx-auto max-w-[1180px] px-6 py-20">
            <div className="flex flex-wrap items-center gap-12 rounded-[28px] bg-surface p-[clamp(28px,5vw,64px)]">
              <div className="reveal min-w-0 flex-[1_1_360px]">
                <Pill color="purple">{t({ en: 'For developers', es: 'Para desarrolladores' })}</Pill>
                <Title small>{t({ en: 'It feels like part of your app — because it is.', es: 'Se siente parte de tu aplicación, porque lo es.' })}</Title>
                <p className="mt-4.5 text-[17px] leading-[1.65] text-muted">
                  {t({
                    en: 'The widgets mount in your page, in your language and your colours; the server is a function from a Request to a Response. Where bookings live, who may see them and how the money is taken stays your app’s business.',
                    es: 'Los componentes se montan en tu página, en tu idioma y con tus colores; el servidor es una función de un Request a un Response. Dónde viven las reservas, quién las ve y cómo se cobra sigue siendo asunto de tu aplicación.',
                  })}
                </p>
                <Link href={localize('/docs/widget/', locale)} className="mt-5 inline-flex items-center gap-1.5 font-semibold text-brand hover:text-brand-hover">
                  {t({ en: 'Read the guide', es: 'Lee la guía' })} <span aria-hidden="true">→</span>
                </Link>
              </div>
              <div className="reveal min-w-0 flex-[1.2_1_480px]">
                <CodeTabs samples={samples} />
              </div>
            </div>
          </section>

          <section className="mx-auto max-w-[1180px] px-6 py-20">
            <div className="reveal mb-7 flex flex-wrap items-end justify-between gap-4">
              <div>
                <Pill color="orange">{t({ en: 'Packages', es: 'Paquetes' })}</Pill>
                <Title small>{t({ en: 'Take what you need.', es: 'Toma lo que necesites.' })}</Title>
              </div>
              <p className="max-w-[380px] text-base leading-[1.6] text-muted">
                {t({
                  en: 'Three packages. The engine has no DOM and no dependencies, so the same times free are worked out in the browser and on the server.',
                  es: 'Tres paquetes. El motor no usa el DOM ni tiene dependencias, así que los mismos horarios libres se calculan en el navegador y en el servidor.',
                })}{' '}
                <a href={NPM_ORG} className="font-medium text-brand hover:text-brand-hover">
                  {t({ en: 'See them on npm →', es: 'Míralos en npm →' })}
                </a>
              </p>
            </div>
            <div className="reveal overflow-x-auto rounded-2xl border border-border">
              <table className="w-full min-w-[680px] border-collapse text-left text-[15px]">
                <colgroup>
                  <col className="w-[27%]" />
                  <col className="w-[49%]" />
                  <col />
                </colgroup>
                <thead className="bg-surface text-[13px] font-medium text-muted">
                  <tr>
                    <th className="px-4.5 py-[11px] font-medium">{t({ en: 'Package', es: 'Paquete' })}</th>
                    <th className="border-l border-border px-4.5 py-[11px] font-medium">{t({ en: 'What it does', es: 'Qué hace' })}</th>
                    <th className="border-l border-border px-4.5 py-[11px] font-medium">{t({ en: 'Runs in', es: 'Corre en' })}</th>
                  </tr>
                </thead>
                <tbody>
                  {PACKAGES.map((pkg) => (
                    <tr key={pkg.name} className="border-t border-border align-top transition-colors hover:bg-surface">
                      <td className="px-4.5 py-3.5">
                        <a href={npmOf(pkg.name)} className="font-code text-sm font-medium text-ink underline decoration-border-strong underline-offset-4 hover:decoration-current">
                          {pkg.name}
                        </a>
                        <div className="mt-1 text-xs text-muted">v{VERSION}</div>
                      </td>
                      <td className="border-l border-border px-4.5 py-3.5 text-ink-soft">{t(pkg.what)}</td>
                      <td className="border-l border-border px-4.5 py-3">
                        <span className={`rounded-md px-[9px] py-[3px] text-[13px] font-medium ${PASTEL_CLASS[pkg.color]}`}>{t(pkg.tag)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <section id="status" className="mx-auto max-w-[1180px] px-6 pb-25 pt-15">
            <div className="reveal flex flex-wrap items-center gap-10 rounded-[28px] bg-pastel-yellow p-[clamp(28px,5vw,64px)]">
              <div className="min-w-0 flex-[1_1_340px]">
                <span className="rounded-full bg-white px-3 py-[5px] text-[13px] font-semibold text-pastel-yellow-fg">{t({ en: 'Where it stands', es: 'Dónde está' })}</span>
                <p className="mt-4.5 font-display text-[clamp(80px,11vw,140px)] font-extrabold leading-[0.9] tracking-[-0.03em]">{tests}</p>
                <p className="mt-2 text-lg text-[#5c4a1e]">{t({ en: 'automated tests passing', es: 'pruebas automatizadas pasando' })}</p>
                <div className="mt-5 h-3 overflow-hidden rounded-full bg-white" aria-hidden="true">
                  <div className="h-full w-0 animate-grow rounded-full bg-brand" />
                </div>
                <p className="mt-2.5 font-hand text-2xl font-semibold text-pastel-yellow-fg">{t({ en: 'the night the clocks change, too', es: 'también la noche que cambia la hora' })}</p>
              </div>
              <div className="min-w-0 flex-[1_1_380px]">
                <p className="font-display text-[clamp(24px,2.6vw,32px)] font-bold leading-[1.3] tracking-[-0.03em]">
                  {t({ en: 'Young, tested, and working in nine cases.', es: 'Joven, probado y funcionando en nueve casos.' })}
                </p>
                <p className="mt-4 text-[17px] leading-[1.6] text-[#5c4a1e]">
                  {t({
                    en: 'Its own engine of times free, that knows what is taken, the time kept free around it, the most a day and the summer time; a server that checks every booking again; and the widgets of both sides. Version 0.1, on its way to npm. Open source under MIT.',
                    es: 'Un motor de horarios propio, que sabe qué está ocupado, el tiempo libre alrededor, el máximo al día y el horario de verano; un servidor que revisa otra vez cada reserva; y los componentes de los dos lados. Versión 0.1, en camino a npm. Código abierto con licencia MIT.',
                  })}
                </p>
                <p className="mt-6.5 flex flex-wrap gap-2.5">
                  <Link href={localize('/docs/getting-started/', locale)} className={`rounded-xl px-5 py-[13px] ${primary}`}>
                    {t({ en: 'Get started', es: 'Empezar' })}
                  </Link>
                  <Link href={localize('/docs/status/', locale)} className="rounded-xl bg-white px-5 py-[13px] font-semibold text-ink transition-colors hover:bg-hover">
                    {t({ en: 'What works, what is missing →', es: 'Qué funciona y qué falta →' })}
                  </Link>
                </p>
              </div>
            </div>
          </section>
        </main>
        <SiteFooter locale={locale} />
      </div>
    </LocaleProvider>
  );
}
