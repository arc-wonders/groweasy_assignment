import express from 'express';
import cors from 'cors';
import importRoutes from './routes/importRoutes.js';
import { env } from './utils/env.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(importRoutes);

app.use((err: unknown, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  if (err instanceof Error && err.name === 'PayloadTooLargeError') {
    return res.status(413).json({ message: 'Request payload too large.' });
  }

  return res.status(500).json({ message: 'Internal server error.' });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(env.port, () => {
  console.log(`Backend listening on port ${env.port}`);
});
