// The package as it goes to npm: `tools/package.mjs` says how.
import { buildPackage } from '../../../tools/package.mjs';

await buildPackage('messages', {
  entries: { index: 'src/index.ts' },
  exports: { '.': 'index' },
  keywords: ['scheduling', 'booking', 'sms', 'whatsapp', 'twilio', 'reminders'],
  homepage: 'https://github.com/JFranciscoRobles/reboschedule#readme',
});
