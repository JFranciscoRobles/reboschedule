// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('calendars', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  keywords: ['scheduling', 'booking', 'ics', 'google-calendar', 'outlook', 'free-busy'],
  homepage: 'https://github.com/JFranciscoRobles/reboschedule#readme',
});
