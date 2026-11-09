// The playground, where every package is tried: booking as a visitor does it,
// the hours and the kinds of appointment, and what is booked. The server's
// routes run in Vite's own server, loaded as the page's modules are
// (`server/dev.ts`): what is booked kept in memory while it runs.

import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig } from 'vite';

export default defineConfig({
  server: { port: 5320 },
  plugins: [
    {
      name: 'reboschedule-server',
      configureServer(server) {
        server.middlewares.use(async (req: IncomingMessage, res: ServerResponse, next: (error?: unknown) => void) => {
          if (!/^\/(api|s)\//.test(req.url ?? '')) return next();
          try {
            const dev = await server.ssrLoadModule('/server/dev.ts');
            await dev.handle(req, res);
          } catch (error) {
            next(error);
          }
        });
      },
    },
  ],
});
