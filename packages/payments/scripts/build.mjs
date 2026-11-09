// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('payments', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  keywords: ['scheduling', 'booking', 'payments', 'stripe', 'mercadopago', 'checkout'],
  homepage: 'https://github.com/JFranciscoRobles/reboschedule#readme',
});
