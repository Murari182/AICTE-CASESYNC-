import express from 'express';
import { createServer as createViteServer } from 'vite';
import fs from 'fs';
import path from 'path';
import os from 'os';
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

function getLocalIpAddresses(): string[] {
  const interfaces = os.networkInterfaces();
  const addresses: string[] = [];
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  return addresses;
}

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
  const PORT = Number(process.env.PORT) || 3000;
  const HOST = process.env.HOST || '0.0.0.0';

  app.use(express.json({ limit: '5mb' }));

  // CORS Middleware: Allow access from any network origin/IP
  app.use((_req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    if (_req.method === 'OPTIONS') {
      res.sendStatus(204);
      return;
    }
    next();
  });

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
      server: { middlewareMode: true, host: '0.0.0.0' },
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

  app.listen(PORT, HOST, () => {
    const localIps = getLocalIpAddresses();
    console.log('\n  ======================================================');
    console.log('  🏛️  AICTE CaseSync Portal is Running & Accessible:');
    console.log('  ======================================================');
    console.log(`  ➜  Local:    http://localhost:${PORT}`);
    if (localIps.length > 0) {
      localIps.forEach((ip) => {
        console.log(`  ➜  Network:  http://${ip}:${PORT}  (LAN / Wi-Fi IP address)`);
      });
    } else {
      console.log(`  ➜  Network:  http://${HOST}:${PORT}`);
    }
    console.log('  ======================================================\n');
  });
}

startServer();
