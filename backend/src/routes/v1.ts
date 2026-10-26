import { Router, Request, Response } from 'express';
import {
  AuthenticatedUser,
  clearSession,
  createSession,
  getAuthenticatedUser,
  listPublicAccountDirectory,
  requireAuth,
  verifyUserCredentials,
} from '../middleware/authentication';
import {
  ROLE_PERMISSION_MATRIX,
  filterCasesForRole,
  filterInstitutionsForRole,
  requirePermission,
} from '../middleware/authorization';
import { evaluateComplaintOverlap } from '../services/overlap-detection';
import { synchronizeOperationalAlerts } from '../services/deadline-monitor';
import {
  computeUnreadNotificationsCount,
  markAllNotificationsRead,
  markNotificationReadState,
} from '../services/notification-service';
import {
  AlertRecord,
  CaseAction,
  CaseRecord,
  CaseRelation,
  CoordinationRecord,
  EscalationRecord,
  InstitutionRecord,
  OverlapStatus,
  RoutingRule,
  SlaConfig,
  TransferRecord,
  TransferStatus,
} from '../../../src/types/casesync';
import { computeDeadlineState } from '../../../src/data/seedData';

export interface PersistedDatabaseState {
  institutions: InstitutionRecord[];
  cases: CaseRecord[];
  relations: CaseRelation[];
  coordination: CoordinationRecord[];
  transfers: TransferRecord[];
  escalations: EscalationRecord[];
  alerts: AlertRecord[];
  routingRules: RoutingRule[];
  slaConfig: SlaConfig;
}

export function createApiV1Router(
  getState: () => PersistedDatabaseState,
  saveState: (next: PersistedDatabaseState) => void
): Router {
  const router = Router();

  // Simple rate limiter for authentication attempts
  const loginAttempts = new Map<string, { count: number; resetAt: number }>();

  router.get('/auth/accounts', (_req: Request, res: Response) => {
    res.json({ accounts: listPublicAccountDirectory() });
  });

  router.post('/auth/login', (req: Request, res: Response) => {
    const ip = req.ip || 'local';
    const now = Date.now();
    const record = loginAttempts.get(ip);
    if (record && now < record.resetAt && record.count >= 25) {
      res.status(429).json({
        error: 'Too Many Requests',
        message: 'Too many sign-in attempts. Please wait a moment and try again.',
      });
      return;
    }

    const { email, password } = req.body || {};
    if (!email || !password) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Email and password are required.',
      });
      return;
    }

    const user = verifyUserCredentials(String(email), String(password));
    if (!user) {
      loginAttempts.set(ip, {
        count: (record?.count || 0) + 1,
        resetAt: now + 60_000,
      });
      res.status(401).json({
        error: 'Invalid Credentials',
        message: 'Invalid official email address or password.',
      });
      return;
    }

    loginAttempts.delete(ip);
    const session = createSession(res, user);
    res.json({
      user,
      permissions: ROLE_PERMISSION_MATRIX[user.role],
      token: session.token,
      expiresAt: session.expiresAt,
    });
  });

  router.post('/auth/logout', (req: Request, res: Response) => {
    clearSession(req, res);
    res.json({ ok: true });
  });

  router.get('/auth/me', (req: Request, res: Response) => {
    const user = getAuthenticatedUser(req);
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'No active authenticated session.',
      });
      return;
    }
    res.json({
      user,
      permissions: ROLE_PERMISSION_MATRIX[user.role],
    });
  });

  // Dashboard Summary
  router.get('/dashboard/summary', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const db = getState();
    const scopedCases = filterCasesForRole(db.cases, user.role);
    const scopedInstitutions = filterInstitutionsForRole(
      db.institutions,
      scopedCases,
      user.role
    );

    const kpis = {
      total: scopedCases.length,
      pending: scopedCases.filter(
        (c) => c.status === 'Pending' || c.status === 'Received'
      ).length,
      underProcess: scopedCases.filter(
        (c) => c.status === 'Under Process' || c.status === 'Escalated'
      ).length,
      disposed: scopedCases.filter((c) => c.status === 'Disposed').length,
      transferred: scopedCases.filter((c) => c.status === 'Transferred').length,
      overdue: scopedCases.filter(
        (c) =>
          computeDeadlineState(c, db.slaConfig.dueSoonDaysThreshold) ===
          'Overdue'
      ).length,
    };

    res.json({
      kpis,
      visibleCasesCount: scopedCases.length,
      visibleInstitutionsCount: scopedInstitutions.length,
      totalCasesCount: db.cases.length,
      totalInstitutionsCount: db.institutions.length,
    });
  });

  // Institutions
  router.get('/institutions', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const db = getState();
    const scopedCases = filterCasesForRole(db.cases, user.role);
    const institutions = filterInstitutionsForRole(
      db.institutions,
      scopedCases,
      user.role
    );
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    res.json({
      data: institutions.slice(0, limit),
      total: institutions.length,
    });
  });

  router.get('/institutions/:id', requireAuth, (req: Request, res: Response) => {
    const db = getState();
    const inst = db.institutions.find((i) => i.institution_id === req.params.id);
    if (!inst) {
      res.status(404).json({ error: 'Not Found', message: 'Institution not found.' });
      return;
    }
    const cases = db.cases.filter((c) => c.institution_id === inst.institution_id);
    res.json({ institution: inst, cases });
  });

  // Complaints
  router.get('/complaints', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const db = getState();
    const scopedCases = filterCasesForRole(db.cases, user.role);
    const limit = Math.min(Number(req.query.limit) || 100, 200);
    res.json({
      data: scopedCases.slice(0, limit),
      total: scopedCases.length,
    });
  });

  router.post('/complaints', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const {
      title,
      description,
      institutionId,
      institutionName,
      aictePermanentId,
      submittedBy,
      category,
      bureau,
      priority,
    } = req.body || {};

    if (!title || !description) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Complaint title and description are required.',
      });
      return;
    }

    const db = getState();
    const nextNum = 143 + db.cases.length;
    const newCaseId = `CMP-2026-0${nextNum}`;
    const now = new Date().toISOString();
    const dueDate = new Date(
      Date.now() + db.slaConfig.defaultDisposalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const overlapEval = evaluateComplaintOverlap({
      caseId: newCaseId,
      title: String(title),
      description: String(description),
      institutionId,
      institutionName: String(institutionName || ''),
      aictePermanentId: String(aictePermanentId || ''),
      assignedBureau: bureau || 'Public Grievance Redressal Cell (PGRC)',
      dueDate,
      existingCases: db.cases,
      institutions: db.institutions,
      routingRules: db.routingRules,
      existingRelations: db.relations,
    });

    const targetInst = overlapEval.matchedInstitution;
    const assignedBureau = bureau || 'Public Grievance Redressal Cell (PGRC)';

    const timeline: CaseAction[] = [
      {
        action_id: `ACT-${Date.now()}-1`,
        case_id: newCaseId,
        institution_id: targetInst.institution_id,
        actor: submittedBy || user.displayName,
        actor_role: user.role,
        bureau: assignedBureau,
        action_type: 'Complaint Received',
        remarks: `Complaint registered against ${targetInst.name} (${targetInst.aicte_permanent_id}).`,
        timestamp: now,
      },
    ];

    const newCase: CaseRecord = {
      id: newCaseId,
      institution_id: targetInst.institution_id,
      aicte_permanent_id: targetInst.aicte_permanent_id,
      institutionName: targetInst.name,
      region: targetInst.region,
      received_at: now,
      title: String(title).trim(),
      description: String(description).trim(),
      submittedBy: String(submittedBy || user.displayName),
      category: category || 'Fee & Admission Grievance',
      predictedCategory: category || 'Fee & Admission Grievance',
      confirmedCategory: category || 'Fee & Admission Grievance',
      isCategoryOverridden: false,
      current_bureau: assignedBureau,
      recommendedDepartment: assignedBureau,
      assignedDepartment: assignedBureau,
      isDepartmentOverridden: false,
      assigned_officer: `${assignedBureau.split(' ')[0]} Nodal Officer`,
      status: 'Received',
      priority: priority || 'High',
      last_action_taken:
        'Complaint registered and evaluated for cross-Bureau overlap.',
      last_action_at: now,
      next_action_required:
        overlapEval.relatedCaseIds.length > 0
          ? `Review potential overlap with ${overlapEval.relatedCaseIds.join(', ')} before initiating duplicate action.`
          : 'Initial Bureau officer scrutiny and assignment.',
      expected_disposal_at: dueDate,
      createdAt: now,
      updatedAt: now,
      linked_case_ids: overlapEval.relatedCaseIds,
      overlap_status: overlapEval.overlapStatus,
      supporting_documents: [],
      confidence: 88,
      classificationSource: 'deterministic-rules',
      explanation: {
        summary: 'Evaluated against institutional complaint history and AICTE Permanent ID.',
        matchedSignals: [`AICTE PID: ${targetInst.aicte_permanent_id}`],
        routingRuleApplied: `Assigned to ${assignedBureau} based on category ${category}.`,
        confidenceNote: 'Operational match confidence derived from deterministic PID and semantic signals.',
      },
      timeline,
    };

    const nextRelations = overlapEval.candidateRelation
      ? [overlapEval.candidateRelation, ...db.relations]
      : db.relations;
    const nextAlerts = synchronizeOperationalAlerts({
      cases: [newCase, ...db.cases],
      relations: nextRelations,
      transfers: db.transfers,
      escalations: db.escalations,
      institutions: db.institutions,
      slaConfig: db.slaConfig,
      existingAlerts: overlapEval.candidateAlert
        ? [overlapEval.candidateAlert, ...db.alerts]
        : db.alerts,
    });

    saveState({
      ...db,
      cases: [newCase, ...db.cases],
      relations: nextRelations,
      alerts: nextAlerts,
    });

    res.status(201).json({ complaint: newCase, overlapEval });
  });

  router.patch(
    '/complaints/:id',
    requireAuth,
    requirePermission('update_case_status'),
    (req: Request, res: Response) => {
      const db = getState();
      const target = db.cases.find((c) => c.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Not Found', message: 'Case not found.' });
        return;
      }
      const updates = req.body || {};
      const now = new Date().toISOString();
      const nextCases = db.cases.map((c) =>
        c.id === req.params.id
          ? {
              ...c,
              ...updates,
              last_action_at: now,
              updatedAt: now,
            }
          : c
      );
      const nextAlerts = synchronizeOperationalAlerts({
        cases: nextCases,
        relations: db.relations,
        transfers: db.transfers,
        escalations: db.escalations,
        institutions: db.institutions,
        slaConfig: db.slaConfig,
        existingAlerts: db.alerts,
      });
      saveState({ ...db, cases: nextCases, alerts: nextAlerts });
      res.json({ ok: true });
    }
  );

  // Overlaps
  router.get('/overlaps', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({ data: db.relations, total: db.relations.length });
  });

  router.post(
    '/overlaps/:id/review',
    requireAuth,
    requirePermission('review_overlap'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const db = getState();
      const { decision, remarks, coordinationOwner, nextRequiredAction } =
        req.body || {};
      const now = new Date().toISOString();

      const nextRelations = db.relations.map((r) =>
        r.relation_id === req.params.id
          ? {
              ...r,
              review_status: (decision as OverlapStatus) || r.review_status,
              reviewed_by: user.displayName,
              reviewed_at: now,
              remarks: remarks || r.remarks,
              coordination_owner: coordinationOwner || r.coordination_owner,
              next_required_action: nextRequiredAction || r.next_required_action,
            }
          : r
      );

      saveState({ ...db, relations: nextRelations });
      res.json({ ok: true });
    }
  );

  // Coordination
  router.get('/coordination', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({ data: db.coordination, total: db.coordination.length });
  });

  router.patch(
    '/coordination/:id',
    requireAuth,
    requirePermission('review_overlap'),
    (req: Request, res: Response) => {
      const db = getState();
      const now = new Date().toISOString();
      const nextCoord = db.coordination.map((item) =>
        item.coordination_id === req.params.id
          ? ({
              ...item,
              ...req.body,
              updated_at: now,
            } as CoordinationRecord)
          : item
      );
      saveState({ ...db, coordination: nextCoord });
      res.json({ ok: true });
    }
  );

  // Transfers
  router.get('/transfers', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({
      transfers: db.transfers,
      escalations: db.escalations,
    });
  });

  router.post(
    '/transfers/:id/respond',
    requireAuth,
    requirePermission('transfer_cases'),
    (req: Request, res: Response) => {
      const db = getState();
      const { decision, remarks } = req.body || {};
      const now = new Date().toISOString();
      const nextTransfers = db.transfers.map((t) =>
        t.transfer_id === req.params.id
          ? {
              ...t,
              transfer_status: (decision as TransferStatus) || t.transfer_status,
              accepted_at: decision === 'Accepted' ? now : t.accepted_at,
              remarks: remarks || t.remarks,
            }
          : t
      );
      saveState({ ...db, transfers: nextTransfers });
      res.json({ ok: true });
    }
  );

  // Alerts & Notifications
  router.get('/alerts', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({
      data: db.alerts,
      unreadCount: computeUnreadNotificationsCount(db.alerts),
    });
  });

  router.get('/alerts/unread-count', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({ unreadCount: computeUnreadNotificationsCount(db.alerts) });
  });

  router.patch('/alerts/:id/read', requireAuth, (req: Request, res: Response) => {
    const db = getState();
    const isRead = req.body?.isRead !== undefined ? Boolean(req.body.isRead) : true;
    const nextAlerts =
      req.params.id === 'ALL'
        ? markAllNotificationsRead(db.alerts)
        : markNotificationReadState(db.alerts, req.params.id, isRead);
    saveState({ ...db, alerts: nextAlerts });
    res.json({ ok: true, unreadCount: computeUnreadNotificationsCount(nextAlerts) });
  });

  // Reports & Audit
  router.get(
    '/reports/summary',
    requireAuth,
    requirePermission('view_reports'),
    (_req: Request, res: Response) => {
      const db = getState();
      res.json({
        institutionsCount: db.institutions.length,
        casesCount: db.cases.length,
        overlapsCount: db.relations.length,
      });
    }
  );

  router.get(
    '/audit',
    requireAuth,
    requirePermission('view_audit_trail'),
    (_req: Request, res: Response) => {
      const db = getState();
      const events = db.cases
        .flatMap((c) => c.timeline)
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );
      res.json({ data: events.slice(0, 200), total: events.length });
    }
  );

  return router;
}
