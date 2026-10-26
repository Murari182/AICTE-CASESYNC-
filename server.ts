import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  INITIAL_ALERTS,
  INITIAL_CASES,
  INITIAL_COORDINATION,
  INITIAL_ESCALATIONS,
  INITIAL_INSTITUTIONS,
  INITIAL_RELATIONS,
  INITIAL_ROUTING_RULES,
  INITIAL_SLA_CONFIG,
  INITIAL_TRANSFERS,
} from './src/data/seedData';
import {
  createApiV1Router,
  PersistedDatabaseState,
} from './backend/src/routes/v1';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_FILE = path.join(__dirname, 'data-store.json');

function getInitialStore(): PersistedDatabaseState {
  try {
    if (fs.existsSync(DB_FILE)) {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(raw);
      if (parsed && Array.isArray(parsed.cases) && Array.isArray(parsed.institutions)) {
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to read local store, using initial dataset:', e);
  }
  return {
    institutions: structuredClone(INITIAL_INSTITUTIONS),
    cases: structuredClone(INITIAL_CASES),
    relations: structuredClone(INITIAL_RELATIONS),
    coordination: structuredClone(INITIAL_COORDINATION),
    transfers: structuredClone(INITIAL_TRANSFERS),
    escalations: structuredClone(INITIAL_ESCALATIONS),
    alerts: structuredClone(INITIAL_ALERTS),
    routingRules: structuredClone(INITIAL_ROUTING_RULES),
    slaConfig: structuredClone(INITIAL_SLA_CONFIG),
  };
}

let memoryStore: PersistedDatabaseState = getInitialStore();

function saveStore(nextStore: PersistedDatabaseState) {
  memoryStore = nextStore;
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(memoryStore, null, 2), 'utf-8');
  } catch (e) {
    console.error('Failed to write store:', e);
  }
}

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '5mb' }));

  // Mount versioned REST API v1 from dedicated /backend module
  app.use(
    '/api/v1',
    createApiV1Router(
      () => memoryStore,
      (next) => saveStore(next)
    )
  );

  // State synchronization routes
  app.get('/api/state', (_req, res) => {
    res.json(memoryStore);
  });

  app.post('/api/sync', (req, res) => {
    if (req.body && typeof req.body === 'object') {
      saveStore({
        ...memoryStore,
        ...req.body,
      });
    }
    res.json({ ok: true, updatedAt: new Date().toISOString() });
  });

  app.post('/api/reset', (_req, res) => {
    try {
      if (fs.existsSync(DB_FILE)) {
        fs.unlinkSync(DB_FILE);
      }
    } catch {
      // ignore
    }
    memoryStore = getInitialStore();
    res.json(memoryStore);
  });

  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AICTE CaseSync server running on http://localhost:${PORT}`);
  });
}

startServer();
