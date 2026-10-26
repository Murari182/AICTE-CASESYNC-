import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { createServer as createViteServer } from 'vite';
import {
  INITIAL_ALERTS,
  INITIAL_CASES,
  INITIAL_COORDINATION,
  INITIAL_ESCALATIONS,
  INITIAL_INSTITUTIONS,
  INITIAL_MODEL_EVALUATIONS,
  INITIAL_RELATIONS,
  INITIAL_ROUTING_RULES,
  INITIAL_SLA_CONFIG,
  INITIAL_TRANSFERS,
  classifyAndMatchComplaint,
} from './src/data/seedData';
import {
  AlertRecord,
  CaseRecord,
  CaseRelation,
  CoordinationRecord,
  EscalationRecord,
  InstitutionRecord,
  RoutingRule,
  SlaConfig,
  TransferRecord,
} from './src/types/casesync';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let institutionsStore: InstitutionRecord[] = structuredClone(INITIAL_INSTITUTIONS);
let casesStore: CaseRecord[] = structuredClone(INITIAL_CASES);
let relationsStore: CaseRelation[] = structuredClone(INITIAL_RELATIONS);
let coordinationStore: CoordinationRecord[] = structuredClone(INITIAL_COORDINATION);
let transfersStore: TransferRecord[] = structuredClone(INITIAL_TRANSFERS);
let escalationsStore: EscalationRecord[] = structuredClone(INITIAL_ESCALATIONS);
let alertsStore: AlertRecord[] = structuredClone(INITIAL_ALERTS);
let routingRulesStore: RoutingRule[] = structuredClone(INITIAL_ROUTING_RULES);
let slaConfigStore: SlaConfig = structuredClone(INITIAL_SLA_CONFIG);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '4mb' }));

  app.get('/api/state', (_req, res) => {
    res.json({
      institutions: institutionsStore,
      cases: casesStore,
      relations: relationsStore,
      coordination: coordinationStore,
      transfers: transfersStore,
      escalations: escalationsStore,
      alerts: alertsStore,
      routingRules: routingRulesStore,
      slaConfig: slaConfigStore,
      modelEvaluations: INITIAL_MODEL_EVALUATIONS,
      lastUpdatedAt: new Date().toISOString(),
    });
  });

  app.post('/api/classify', (req, res) => {
    const {
      description = '',
      title = '',
      institutionName = '',
      aictePermanentId = '',
    } = req.body || {};

    const result = classifyAndMatchComplaint(
      String(description),
      String(title),
      String(institutionName),
      String(aictePermanentId),
      casesStore,
      institutionsStore,
      routingRulesStore
    );
    res.json(result);
  });

  app.post('/api/sync', (req, res) => {
    const body = req.body || {};
    if (Array.isArray(body.institutions)) institutionsStore = body.institutions;
    if (Array.isArray(body.cases)) casesStore = body.cases;
    if (Array.isArray(body.relations)) relationsStore = body.relations;
    if (Array.isArray(body.coordination)) coordinationStore = body.coordination;
    if (Array.isArray(body.transfers)) transfersStore = body.transfers;
    if (Array.isArray(body.escalations)) escalationsStore = body.escalations;
    if (Array.isArray(body.alerts)) alertsStore = body.alerts;
    if (Array.isArray(body.routingRules)) routingRulesStore = body.routingRules;
    if (body.slaConfig) slaConfigStore = body.slaConfig;

    res.json({ ok: true, updatedAt: new Date().toISOString() });
  });

  app.post('/api/reset', (_req, res) => {
    institutionsStore = structuredClone(INITIAL_INSTITUTIONS);
    casesStore = structuredClone(INITIAL_CASES);
    relationsStore = structuredClone(INITIAL_RELATIONS);
    coordinationStore = structuredClone(INITIAL_COORDINATION);
    transfersStore = structuredClone(INITIAL_TRANSFERS);
    escalationsStore = structuredClone(INITIAL_ESCALATIONS);
    alertsStore = structuredClone(INITIAL_ALERTS);
    routingRulesStore = structuredClone(INITIAL_ROUTING_RULES);
    slaConfigStore = structuredClone(INITIAL_SLA_CONFIG);

    res.json({
      institutions: institutionsStore,
      cases: casesStore,
      relations: relationsStore,
      coordination: coordinationStore,
      transfers: transfersStore,
      escalations: escalationsStore,
      alerts: alertsStore,
      routingRules: routingRulesStore,
      slaConfig: slaConfigStore,
      modelEvaluations: INITIAL_MODEL_EVALUATIONS,
    });
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
    app.get('*all', (_req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`AICTE CaseSync Server listening on http://localhost:${PORT}`);
  });
}

startServer();
