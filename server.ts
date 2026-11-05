import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '.env') });

async function startServer() {
  const { closeCampaignStore, initializeCampaignStore } = await import('./server/database.js');
  await initializeCampaignStore();

  const { RPGEngine } = await import('./server/rpgEngine.js');
  await RPGEngine.seedInitialCampaignIfEmpty();

  const { rpgRouter } = await import('./server/rpgRouter.js');

  const app = express();
  const PORT = process.env.PORT || 3000;

  // Standalone API CORS and JSON parsing
  app.use(cors());
  app.use(express.json({ limit: '10mb' }));

  // Standalone RPG Engine API routes
  app.use('/api/rpg', rpgRouter);

  // Health check alias
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'online',
      service: 'Chronicles AI RPG Master Engine',
      endpoints: {
        narrate: '/api/rpg/narrate',
        campaigns: '/api/rpg/campaigns',
        newCampaign: '/api/rpg/campaign/new',
        turn: '/api/rpg/turn',
        scenario: '/api/rpg/scenario/generate',
        dice: '/api/rpg/dice/roll',
        openapi: '/api/rpg/openapi.json',
      },
    });
  });

  const isProduction = process.env.NODE_ENV === 'production';

  if (!isProduction) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  const server = app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[Chronicles RPG Master Engine] Servidor rodando na porta ${PORT}`);
  });

  const shutdown = () => {
    server.close(() => {
      void closeCampaignStore().catch((error: unknown) => {
        console.error('[Chronicles RPG Master Engine] Erro ao fechar conexão com banco:', error);
        process.exitCode = 1;
      });
    });
  };
  process.once('SIGTERM', shutdown);
  process.once('SIGINT', shutdown);
}

startServer().catch((err) => {
  console.error('[Chronicles RPG Master Engine] Erro ao iniciar servidor:', err);
});
