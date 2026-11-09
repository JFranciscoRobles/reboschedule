// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('server', {
  entries: { index: 'src/index.ts', handler: 'src/handler.ts' },
  exports: { '.': 'index', './handler': 'handler' },
  keywords: ['scheduling', 'booking', 'ics', 'server'],
  homepage: 'https://github.com/JFranciscoRobles/reboschedule#readme',
});
