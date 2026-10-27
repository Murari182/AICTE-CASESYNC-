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
  classifyComplaintML,
  getClassifierModelMetrics,
} from '../services/ml-classifier';
import {
  AlertRecord,
  BureauCell,
  CaseAction,
  CaseRecord,
  CaseRelation,
  CaseStatus,
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

const VALID_CASE_STATUSES: CaseStatus[] = [
  'Received',
  'Pending',
  'Under Process',
  'Transferred',
  'Escalated',
  'Disposed',
];

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
    if (record && now < record.resetAt && record.count >= 50) {
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

  // ML Classification & Evaluation Endpoints
  router.post('/classify', requireAuth, (req: Request, res: Response) => {
    const { title, description, region } = req.body || {};
    if (!title && !description) {
      res.status(400).json({
        error: 'Validation Error',
        message: 'Complaint title or description is required for classification.',
      });
      return;
    }
    const prediction = classifyComplaintML(
      String(title || ''),
      String(description || ''),
      region ? String(region) : undefined
    );
    res.json({ prediction });
  });

  router.get('/model/metrics', requireAuth, (_req: Request, res: Response) => {
    const metrics = getClassifierModelMetrics();
    res.json(metrics);
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
      escalated: scopedCases.filter((c) => c.status === 'Escalated').length,
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
    let institutions = filterInstitutionsForRole(
      db.institutions,
      scopedCases,
      user.role
    );

    const search = String(req.query.search || '').trim().toLowerCase();
    const pid = String(req.query.pid || '').trim().toLowerCase();
    const region = String(req.query.region || '').trim();
    const state = String(req.query.state || '').trim().toLowerCase();

    if (search) {
      institutions = institutions.filter(
        (i) =>
          i.name.toLowerCase().includes(search) ||
          i.aicte_permanent_id.toLowerCase().includes(search) ||
          i.state.toLowerCase().includes(search) ||
          i.region.toLowerCase().includes(search)
      );
    }
    if (pid) {
      institutions = institutions.filter((i) =>
        i.aicte_permanent_id.toLowerCase().includes(pid)
      );
    }
    if (region && region !== 'All') {
      institutions = institutions.filter((i) => i.region === region);
    }
    if (state) {
      institutions = institutions.filter((i) =>
        i.state.toLowerCase().includes(state)
      );
    }

    const enriched = institutions.map((inst) => {
      const instCases = db.cases.filter(
        (c) => c.institution_id === inst.institution_id
      );
      const involvedBureaus = Array.from(
        new Set(instCases.map((c) => c.current_bureau))
      );
      const hasActiveOverlap = instCases.some(
        (c) =>
          c.overlap_status === 'Potential Overlap — Review Required' ||
          c.overlap_status === 'Confirmed Related Cases' ||
          c.overlap_status === 'Institution Identity Uncertain'
      );
      return {
        ...inst,
        totalCases: instCases.length,
        activeCases: instCases.filter((c) => c.status !== 'Disposed').length,
        disposedCases: instCases.filter((c) => c.status === 'Disposed').length,
        involvedBureaus,
        hasActiveOverlap,
      };
    });

    const limit = Math.min(Number(req.query.limit) || 100, 200);
    res.json({
      data: enriched.slice(0, limit),
      total: enriched.length,
    });
  });

  router.get('/institutions/:id', requireAuth, (req: Request, res: Response) => {
    const db = getState();
    const paramId = req.params.id;
    const inst = db.institutions.find(
      (i) =>
        i.institution_id === paramId ||
        i.aicte_permanent_id.toLowerCase() === paramId.toLowerCase()
    );
    if (!inst) {
      res.status(404).json({ error: 'Not Found', message: 'Institution not found.' });
      return;
    }
    const cases = db.cases.filter((c) => c.institution_id === inst.institution_id);
    const relations = db.relations.filter(
      (r) => r.institution_id === inst.institution_id
    );
    const coordination = db.coordination.filter(
      (c) => c.institution_id === inst.institution_id
    );
    const transfers = db.transfers.filter(
      (t) => t.institution_id === inst.institution_id
    );
    const statusBreakdown = {
      total: cases.length,
      pending: cases.filter((c) => c.status === 'Pending' || c.status === 'Received').length,
      underProcess: cases.filter((c) => c.status === 'Under Process').length,
      transferred: cases.filter((c) => c.status === 'Transferred').length,
      escalated: cases.filter((c) => c.status === 'Escalated').length,
      disposed: cases.filter((c) => c.status === 'Disposed').length,
    };
    const involvedBureaus = Array.from(new Set(cases.map((c) => c.current_bureau)));

    res.json({
      institution: inst,
      cases,
      relations,
      coordination,
      transfers,
      statusBreakdown,
      involvedBureaus,
    });
  });

  // Complaints
  router.get('/complaints', requireAuth, (req: Request, res: Response) => {
    const user = (req as Request & { user: AuthenticatedUser }).user;
    const db = getState();
    let scopedCases = filterCasesForRole(db.cases, user.role);

    const search = String(req.query.search || '').trim().toLowerCase();
    const pid = String(req.query.pid || '').trim().toLowerCase();
    const institutionId = String(req.query.institutionId || '').trim();
    const caseId = String(req.query.caseId || '').trim().toLowerCase();
    const bureau = String(req.query.bureau || '').trim();
    const region = String(req.query.region || '').trim();
    const category = String(req.query.category || '').trim();
    const status = String(req.query.status || '').trim();
    const priority = String(req.query.priority || '').trim();
    const overlapStatus = String(req.query.overlapStatus || '').trim();
    const dateField =
      req.query.dateField === 'last_action_at' ? 'last_action_at' : 'received_at';
    const startDate = String(req.query.startDate || '').trim();
    const endDate = String(req.query.endDate || '').trim();

    if (search) {
      scopedCases = scopedCases.filter(
        (c) =>
          c.id.toLowerCase().includes(search) ||
          c.title.toLowerCase().includes(search) ||
          c.description.toLowerCase().includes(search) ||
          c.institutionName.toLowerCase().includes(search) ||
          c.aicte_permanent_id.toLowerCase().includes(search) ||
          c.assigned_officer.toLowerCase().includes(search)
      );
    }
    if (pid) {
      scopedCases = scopedCases.filter((c) =>
        c.aicte_permanent_id.toLowerCase().includes(pid)
      );
    }
    if (institutionId) {
      scopedCases = scopedCases.filter((c) => c.institution_id === institutionId);
    }
    if (caseId) {
      scopedCases = scopedCases.filter((c) => c.id.toLowerCase().includes(caseId));
    }
    if (bureau && bureau !== 'All') {
      scopedCases = scopedCases.filter((c) => c.current_bureau === bureau);
    }
    if (region && region !== 'All') {
      scopedCases = scopedCases.filter((c) => c.region === region);
    }
    if (category && category !== 'All') {
      scopedCases = scopedCases.filter((c) => c.category === category);
    }
    if (status && status !== 'All') {
      scopedCases = scopedCases.filter((c) => c.status === status);
    }
    if (priority && priority !== 'All') {
      scopedCases = scopedCases.filter((c) => c.priority === priority);
    }
    if (overlapStatus && overlapStatus !== 'All') {
      scopedCases = scopedCases.filter((c) => c.overlap_status === overlapStatus);
    }
    if (startDate) {
      const startMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
      if (!Number.isNaN(startMs)) {
        scopedCases = scopedCases.filter(
          (c) => new Date(c[dateField]).getTime() >= startMs
        );
      }
    }
    if (endDate) {
      const endMs = new Date(`${endDate}T23:59:59.999Z`).getTime();
      if (!Number.isNaN(endMs)) {
        scopedCases = scopedCases.filter(
          (c) => new Date(c[dateField]).getTime() <= endMs
        );
      }
    }

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
    const existingNums = db.cases.map((c) => {
      const m = c.id.match(/(\d+)$/);
      return m ? parseInt(m[1], 10) : 100;
    });
    const nextNum = Math.max(142, ...existingNums) + 1;
    const newCaseId = `CMP-2026-0${nextNum}`;
    const now = new Date().toISOString();
    const dueDate = new Date(
      Date.now() + db.slaConfig.defaultDisposalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    // Step 1: Run ML Classifier on incoming complaint text
    const mlPrediction = classifyComplaintML(String(title), String(description));
    const finalCategory = category || mlPrediction.predicted_category;
    const assignedBureau: BureauCell =
      (bureau as BureauCell) || mlPrediction.recommended_bureau;
    const isCategoryOverridden = Boolean(
      category && category !== mlPrediction.predicted_category
    );
    const isDepartmentOverridden = Boolean(
      bureau && bureau !== mlPrediction.recommended_bureau
    );

    // Step 2: Evaluate 5-Layer Cross-Bureau Overlap
    const overlapEval = evaluateComplaintOverlap({
      caseId: newCaseId,
      title: String(title),
      description: String(description),
      institutionId,
      institutionName: String(institutionName || ''),
      aictePermanentId: String(aictePermanentId || ''),
      assignedBureau,
      dueDate,
      existingCases: db.cases,
      institutions: db.institutions,
      routingRules: db.routingRules,
      existingRelations: db.relations,
    });

    const targetInst = overlapEval.matchedInstitution;
    const nextInstitutions = overlapEval.isNewUnverifiedInstitution
      ? [targetInst, ...db.institutions]
      : db.institutions;

    const timeline: CaseAction[] = [
      {
        action_id: `ACT-${Date.now()}-1`,
        case_id: newCaseId,
        institution_id: targetInst.institution_id,
        actor: submittedBy || user.displayName,
        actor_role: user.role,
        bureau: assignedBureau,
        action_type: 'Complaint Received',
        remarks: `Complaint registered against ${targetInst.name} (${targetInst.aicte_permanent_id}). ML Classification: ${mlPrediction.predicted_category} (${mlPrediction.confidence_score}% confidence).`,
        timestamp: now,
      },
    ];

    if (overlapEval.relatedCaseIds.length > 0) {
      timeline.push({
        action_id: `ACT-${Date.now()}-2`,
        case_id: newCaseId,
        institution_id: targetInst.institution_id,
        actor: 'CaseSync Matching Engine',
        actor_role: 'System Matching Engine',
        bureau: assignedBureau,
        action_type: 'Related Case Detected',
        remarks: `Detected potential cross-bureau overlap with ${overlapEval.relatedCaseIds.join(', ')}. Separate Case IDs preserved.`,
        timestamp: now,
        reference_id: overlapEval.candidateRelation?.relation_id,
      });
    }

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
      category: finalCategory,
      predictedCategory: mlPrediction.predicted_category,
      confirmedCategory: finalCategory,
      isCategoryOverridden,
      current_bureau: assignedBureau,
      recommendedDepartment: mlPrediction.recommended_bureau,
      assignedDepartment: assignedBureau,
      isDepartmentOverridden,
      assigned_officer: `${assignedBureau.split(' ')[0]} Nodal Officer`,
      status: 'Received',
      priority: priority || mlPrediction.default_priority || 'High',
      last_action_taken:
        'Complaint registered, classified via ML pipeline, and evaluated for cross-Bureau overlap.',
      last_action_at: now,
      next_action_required:
        overlapEval.relatedCaseIds.length > 0
          ? `Review potential overlap with ${overlapEval.relatedCaseIds.join(', ')} before initiating duplicate action.`
          : overlapEval.isIdentityUncertain
            ? 'Verify AICTE Permanent ID with Regional Office before linking to verified master record.'
            : 'Initial Bureau officer scrutiny and assignment.',
      expected_disposal_at: dueDate,
      createdAt: now,
      updatedAt: now,
      linked_case_ids: overlapEval.relatedCaseIds,
      overlap_status: overlapEval.overlapStatus,
      supporting_documents: [],
      confidence: mlPrediction.confidence_score,
      classificationSource: 'ai-model',
      explanation: {
        summary:
          overlapEval.relatedCaseIds.length > 0
            ? `Matched institution ${targetInst.name} (${targetInst.aicte_permanent_id}) with active related case(s) ${overlapEval.relatedCaseIds.join(', ')}.`
            : `ML TF-IDF Classifier assigned "${mlPrediction.predicted_category}" (${mlPrediction.confidence_score}% confidence).`,
        matchedSignals: [
          `AICTE PID: ${targetInst.aicte_permanent_id}`,
          ...mlPrediction.top_terms,
        ],
        routingRuleApplied: `${finalCategory} → ${assignedBureau}`,
        confidenceNote: mlPrediction.uncertainty_flag
          ? mlPrediction.uncertainty_reason || 'Low confidence — officer verification required.'
          : 'High-confidence ML classification and deterministic PID check.',
      },
      timeline,
    };

    // Update companion related cases so they also reference newCaseId
    const updatedExistingCases = db.cases.map((c) => {
      if (overlapEval.relatedCaseIds.includes(c.id)) {
        const nextLinked = Array.from(new Set([...c.linked_case_ids, newCaseId]));
        const nextOverlapStatus: OverlapStatus =
          c.overlap_status === 'Confirmed Related Cases'
            ? 'Confirmed Related Cases'
            : overlapEval.overlapStatus;
        return {
          ...c,
          linked_case_ids: nextLinked,
          overlap_status: nextOverlapStatus,
        };
      }
      return c;
    });

    const nextRelations = [
      ...overlapEval.candidateRelations,
      ...db.relations,
    ];
    const nextAlerts = synchronizeOperationalAlerts({
      cases: [newCase, ...updatedExistingCases],
      relations: nextRelations,
      transfers: db.transfers,
      escalations: db.escalations,
      institutions: nextInstitutions,
      slaConfig: db.slaConfig,
      existingAlerts: [...overlapEval.candidateAlerts, ...db.alerts],
    });

    saveState({
      ...db,
      institutions: nextInstitutions,
      cases: [newCase, ...updatedExistingCases],
      relations: nextRelations,
      alerts: nextAlerts,
    });

    res.status(201).json({
      complaint: newCase,
      mlPrediction,
      overlapEval,
    });
  });

  router.patch(
    '/complaints/:id',
    requireAuth,
    requirePermission('update_case_status'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const db = getState();
      const target = db.cases.find((c) => c.id === req.params.id);
      if (!target) {
        res.status(404).json({ error: 'Not Found', message: 'Case not found.' });
        return;
      }

      const updates = req.body || {};
      const now = new Date().toISOString();

      // Validate status if provided
      if (updates.status && !VALID_CASE_STATUSES.includes(updates.status)) {
        res.status(400).json({
          error: 'Validation Error',
          message: `Invalid status "${updates.status}". Allowed values: ${VALID_CASE_STATUSES.join(', ')}.`,
        });
        return;
      }

      // Require disposal remarks when marking a case as Disposed
      const disposalRemarks =
        updates.remarks || updates.last_action_taken || '';
      if (
        updates.status === 'Disposed' &&
        target.status !== 'Disposed' &&
        !String(disposalRemarks).trim()
      ) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'Disposal remarks are required when marking a complaint case as Disposed.',
        });
        return;
      }

      const newTimelineEntries: CaseAction[] = [];

      if (updates.status && updates.status !== target.status) {
        newTimelineEntries.push({
          action_id: `ACT-${Date.now()}-st`,
          case_id: target.id,
          institution_id: target.institution_id,
          actor: user.displayName,
          actor_role: user.role,
          bureau: updates.current_bureau || target.current_bureau,
          action_type:
            updates.status === 'Disposed' ? 'Case Disposed' : 'Status Updated',
          previous_value: target.status,
          new_value: updates.status,
          remarks:
            String(disposalRemarks).trim() ||
            `Case status updated from ${target.status} to ${updates.status}.`,
          timestamp: now,
        });
      }

      if (
        updates.confirmedCategory &&
        updates.confirmedCategory !== target.confirmedCategory
      ) {
        newTimelineEntries.push({
          action_id: `ACT-${Date.now()}-cat`,
          case_id: target.id,
          institution_id: target.institution_id,
          actor: user.displayName,
          actor_role: user.role,
          bureau: target.current_bureau,
          action_type: 'Action Remark Added',
          previous_value: target.confirmedCategory,
          new_value: updates.confirmedCategory,
          remarks:
            updates.remarks ||
            `Officer verified/overrode complaint category to "${updates.confirmedCategory}".`,
          timestamp: now,
        });
      }

      if (
        newTimelineEntries.length === 0 &&
        (updates.remarks || updates.last_action_taken)
      ) {
        newTimelineEntries.push({
          action_id: `ACT-${Date.now()}-rmk`,
          case_id: target.id,
          institution_id: target.institution_id,
          actor: user.displayName,
          actor_role: user.role,
          bureau: target.current_bureau,
          action_type: 'Action Remark Added',
          remarks: String(updates.remarks || updates.last_action_taken),
          timestamp: now,
        });
      }

      let updatedCaseRecord: CaseRecord = target;
      const nextCases = db.cases.map((c) => {
        if (c.id !== req.params.id) return c;
        const nextCat = updates.confirmedCategory || updates.category || c.category;
        const nextBureau =
          updates.assignedDepartment || updates.current_bureau || c.current_bureau;
        updatedCaseRecord = {
          ...c,
          ...updates,
          category: nextCat,
          confirmedCategory: nextCat,
          isCategoryOverridden: nextCat !== c.predictedCategory,
          current_bureau: nextBureau,
          assignedDepartment: nextBureau,
          isDepartmentOverridden: nextBureau !== c.recommendedDepartment,
          last_action_taken:
            updates.last_action_taken ||
            updates.remarks ||
            c.last_action_taken,
          last_action_at: now,
          updatedAt: now,
          timeline: [...newTimelineEntries, ...c.timeline],
        };
        return updatedCaseRecord;
      });

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
      res.json({ ok: true, complaint: updatedCaseRecord });
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
      const targetRel = db.relations.find((r) => r.relation_id === req.params.id);
      if (!targetRel) {
        res.status(404).json({ error: 'Not Found', message: 'Overlap relation not found.' });
        return;
      }

      const { decision, remarks, coordinationOwner, nextRequiredAction } =
        req.body || {};
      const now = new Date().toISOString();
      const finalDecision = (decision as OverlapStatus) || targetRel.review_status;

      const nextRelations = db.relations.map((r) =>
        r.relation_id === req.params.id
          ? {
              ...r,
              review_status: finalDecision,
              reviewed_by: user.displayName,
              reviewed_at: now,
              remarks: remarks || r.remarks,
              coordination_owner: coordinationOwner || r.coordination_owner,
              next_required_action: nextRequiredAction || r.next_required_action,
            }
          : r
      );

      // Update overlap_status and timeline on both linked cases
      const nextCases = db.cases.map((c) => {
        if (c.id !== targetRel.case_id_a && c.id !== targetRel.case_id_b) {
          return c;
        }
        const action: CaseAction = {
          action_id: `ACT-${Date.now()}-${c.id.slice(-3)}`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: user.displayName,
          actor_role: user.role,
          bureau: c.current_bureau,
          action_type: 'Overlap Reviewed',
          previous_value: c.overlap_status,
          new_value: finalDecision,
          remarks:
            remarks ||
            `Overlap relation ${targetRel.relation_id} marked as "${finalDecision}".`,
          timestamp: now,
          reference_id: targetRel.relation_id,
        };
        return {
          ...c,
          overlap_status: finalDecision,
          last_action_taken: `Overlap review recorded: ${finalDecision}`,
          last_action_at: now,
          updatedAt: now,
          timeline: [action, ...c.timeline],
        };
      });

      // Update corresponding alert so reviewed/dismissed overlap alerts stay resolved across refreshes
      const isResolvedDecision =
        finalDecision === 'Confirmed Related Cases' ||
        finalDecision === 'Not Related — Reviewed';

      const updatedExistingAlerts = db.alerts.map((a) => {
        if (a.deduplication_key === `rel:${targetRel.relation_id}`) {
          return {
            ...a,
            is_read: true,
            lifecycle_status: isResolvedDecision
              ? ('Resolved' as const)
              : ('Acknowledged' as const),
            acknowledgement_status: 'Acknowledged' as const,
            resolution_status: isResolvedDecision
              ? ('Resolved' as const)
              : ('Open' as const),
            acknowledged_by: user.displayName,
            resolved_at: isResolvedDecision ? now : a.resolved_at,
          };
        }
        return a;
      });

      const nextAlerts = synchronizeOperationalAlerts({
        cases: nextCases,
        relations: nextRelations,
        transfers: db.transfers,
        escalations: db.escalations,
        institutions: db.institutions,
        slaConfig: db.slaConfig,
        existingAlerts: updatedExistingAlerts,
      });

      saveState({
        ...db,
        cases: nextCases,
        relations: nextRelations,
        alerts: nextAlerts,
      });
      res.json({ ok: true, relationId: targetRel.relation_id, decision: finalDecision });
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

  // Transfers & Escalations
  router.get('/transfers', requireAuth, (_req: Request, res: Response) => {
    const db = getState();
    res.json({
      transfers: db.transfers,
      escalations: db.escalations,
    });
  });

  router.post(
    '/transfers',
    requireAuth,
    requirePermission('transfer_cases'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const { caseId, receivingBureau, receivingOfficer, reason, remarks } =
        req.body || {};

      if (!caseId || !receivingBureau || !reason) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'caseId, receivingBureau, and reason are required to initiate a transfer.',
        });
        return;
      }

      const db = getState();
      const targetCase = db.cases.find((c) => c.id === caseId);
      if (!targetCase) {
        res.status(404).json({ error: 'Not Found', message: 'Case not found.' });
        return;
      }

      const now = new Date().toISOString();
      const trfId = `TRF-2026-0${db.transfers.length + 1}`;
      const originatingBureau = targetCase.current_bureau;

      const newTransfer: TransferRecord = {
        transfer_id: trfId,
        case_id: targetCase.id,
        case_subject: targetCase.title,
        institution_id: targetCase.institution_id,
        institution_name: targetCase.institutionName,
        originating_bureau: originatingBureau,
        receiving_bureau: receivingBureau as BureauCell,
        reason: String(reason),
        transferring_officer: user.displayName,
        receiving_officer:
          receivingOfficer || `${String(receivingBureau).split(' ')[0]} Nodal Officer`,
        requested_at: now,
        transfer_status: 'Awaiting Acceptance',
        remarks: String(remarks || reason),
      };

      const transferAction: CaseAction = {
        action_id: `ACT-${Date.now()}-trf`,
        case_id: targetCase.id,
        institution_id: targetCase.institution_id,
        actor: user.displayName,
        actor_role: user.role,
        bureau: originatingBureau,
        action_type: 'Case Transferred',
        previous_value: originatingBureau,
        new_value: receivingBureau,
        remarks: `Transferred from ${originatingBureau} to ${receivingBureau}: ${reason}`,
        timestamp: now,
        reference_id: trfId,
      };

      // Preserve the single Case ID while updating status & current_bureau
      const nextCases = db.cases.map((c) =>
        c.id === targetCase.id
          ? {
              ...c,
              status: 'Transferred' as CaseStatus,
              current_bureau: receivingBureau as BureauCell,
              assignedDepartment: receivingBureau as BureauCell,
              last_action_taken: `Transferred from ${originatingBureau} to ${receivingBureau} (${trfId}).`,
              last_action_at: now,
              next_action_required: `Awaiting transfer acceptance by ${receivingBureau}.`,
              updatedAt: now,
              timeline: [transferAction, ...c.timeline],
            }
          : c
      );

      const nextTransfers = [newTransfer, ...db.transfers];
      const nextAlerts = synchronizeOperationalAlerts({
        cases: nextCases,
        relations: db.relations,
        transfers: nextTransfers,
        escalations: db.escalations,
        institutions: db.institutions,
        slaConfig: db.slaConfig,
        existingAlerts: db.alerts,
      });

      saveState({
        ...db,
        cases: nextCases,
        transfers: nextTransfers,
        alerts: nextAlerts,
      });

      res.status(201).json({ ok: true, transfer: newTransfer });
    }
  );

  router.post(
    '/transfers/:id/respond',
    requireAuth,
    requirePermission('transfer_cases'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const db = getState();
      const targetTrf = db.transfers.find((t) => t.transfer_id === req.params.id);
      if (!targetTrf) {
        res.status(404).json({ error: 'Not Found', message: 'Transfer record not found.' });
        return;
      }

      const { decision, remarks } = req.body || {};
      const now = new Date().toISOString();
      const finalDecision = (decision as TransferStatus) || targetTrf.transfer_status;

      const nextTransfers = db.transfers.map((t) =>
        t.transfer_id === req.params.id
          ? {
              ...t,
              transfer_status: finalDecision,
              accepted_at: finalDecision === 'Accepted' ? now : t.accepted_at,
              remarks: remarks || t.remarks,
            }
          : t
      );

      const nextCases = db.cases.map((c) => {
        if (c.id !== targetTrf.case_id) return c;
        const action: CaseAction = {
          action_id: `ACT-${Date.now()}-trf-resp`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: user.displayName,
          actor_role: user.role,
          bureau: targetTrf.receiving_bureau,
          action_type:
            finalDecision === 'Accepted' ? 'Case Transferred' : 'Status Updated',
          previous_value: targetTrf.originating_bureau,
          new_value:
            finalDecision === 'Accepted'
              ? targetTrf.receiving_bureau
              : targetTrf.originating_bureau,
          remarks:
            remarks ||
            `Transfer ${targetTrf.transfer_id} marked as ${finalDecision}.`,
          timestamp: now,
          reference_id: targetTrf.transfer_id,
        };
        return {
          ...c,
          status:
            finalDecision === 'Accepted'
              ? ('Under Process' as CaseStatus)
              : ('Pending' as CaseStatus),
          current_bureau:
            finalDecision === 'Accepted'
              ? targetTrf.receiving_bureau
              : targetTrf.originating_bureau,
          last_action_taken: `Transfer ${targetTrf.transfer_id} ${finalDecision} by ${user.displayName}.`,
          last_action_at: now,
          updatedAt: now,
          timeline: [action, ...c.timeline],
        };
      });

      const nextAlerts = synchronizeOperationalAlerts({
        cases: nextCases,
        relations: db.relations,
        transfers: nextTransfers,
        escalations: db.escalations,
        institutions: db.institutions,
        slaConfig: db.slaConfig,
        existingAlerts: db.alerts,
      });

      saveState({
        ...db,
        cases: nextCases,
        transfers: nextTransfers,
        alerts: nextAlerts,
      });
      res.json({ ok: true, transferStatus: finalDecision });
    }
  );

  router.post(
    '/escalations',
    requireAuth,
    requirePermission('escalate_cases'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const {
        caseId,
        escalationLevel,
        responsibleAuthority,
        reason,
        requiredNextAction,
      } = req.body || {};

      if (!caseId || !reason) {
        res.status(400).json({
          error: 'Validation Error',
          message: 'caseId and reason are required to escalate a case.',
        });
        return;
      }

      const db = getState();
      const targetCase = db.cases.find((c) => c.id === caseId);
      if (!targetCase) {
        res.status(404).json({ error: 'Not Found', message: 'Case not found.' });
        return;
      }

      const now = new Date().toISOString();
      const escId = `ESC-2026-0${db.escalations.length + 1}`;
      const newEsc: EscalationRecord = {
        escalation_id: escId,
        case_id: targetCase.id,
        case_subject: targetCase.title,
        institution_id: targetCase.institution_id,
        institution_name: targetCase.institutionName,
        reason: String(reason),
        escalation_level:
          escalationLevel || 'Level 2 — Competent Authority / Senior Management',
        responsible_authority:
          responsibleAuthority || 'Advisor-I (Regulation & Grievance)',
        bureau: targetCase.current_bureau,
        timestamp: now,
        required_next_action:
          requiredNextAction || 'Issue statutory directive and expedite disposal.',
        status: 'Awaiting Action',
      };

      const escAction: CaseAction = {
        action_id: `ACT-${Date.now()}-esc`,
        case_id: targetCase.id,
        institution_id: targetCase.institution_id,
        actor: user.displayName,
        actor_role: user.role,
        bureau: targetCase.current_bureau,
        action_type: 'Case Escalated',
        previous_value: targetCase.status,
        new_value: 'Escalated',
        remarks: `Escalated (${escId}): ${reason}`,
        timestamp: now,
        reference_id: escId,
      };

      const nextCases = db.cases.map((c) =>
        c.id === targetCase.id
          ? {
              ...c,
              status: 'Escalated' as CaseStatus,
              priority: 'Critical' as const,
              last_action_taken: `Escalated to ${newEsc.responsible_authority} (${escId}).`,
              last_action_at: now,
              next_action_required: newEsc.required_next_action,
              updatedAt: now,
              timeline: [escAction, ...c.timeline],
            }
          : c
      );

      const nextEscalations = [newEsc, ...db.escalations];
      const nextAlerts = synchronizeOperationalAlerts({
        cases: nextCases,
        relations: db.relations,
        transfers: db.transfers,
        escalations: nextEscalations,
        institutions: db.institutions,
        slaConfig: db.slaConfig,
        existingAlerts: db.alerts,
      });

      saveState({
        ...db,
        cases: nextCases,
        escalations: nextEscalations,
        alerts: nextAlerts,
      });

      res.status(201).json({ ok: true, escalation: newEsc });
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

  router.post(
    '/alerts/:id/action',
    requireAuth,
    requirePermission('update_case_status'),
    (req: Request, res: Response) => {
      const user = (req as Request & { user: AuthenticatedUser }).user;
      const db = getState();
      const { action, assignedTo } = req.body || {};
      const now = new Date().toISOString();

      const nextAlerts = db.alerts.map((a) => {
        if (a.alert_id !== req.params.id) return a;
        if (action === 'acknowledge') {
          return {
            ...a,
            is_read: true,
            lifecycle_status: 'Acknowledged' as const,
            acknowledgement_status: 'Acknowledged' as const,
            acknowledged_by: user.displayName,
            assigned_to: assignedTo || a.assigned_to,
          };
        }
        if (action === 'resolve') {
          return {
            ...a,
            is_read: true,
            lifecycle_status: 'Resolved' as const,
            acknowledgement_status: 'Acknowledged' as const,
            resolution_status: 'Resolved' as const,
            resolved_at: now,
          };
        }
        if (action === 'dismiss') {
          return {
            ...a,
            is_read: true,
            lifecycle_status: 'Dismissed' as const,
            resolution_status: 'Dismissed' as const,
            dismissed_at: now,
          };
        }
        return {
          ...a,
          assigned_to: assignedTo || a.assigned_to,
        };
      });

      saveState({ ...db, alerts: nextAlerts });
      res.json({
        ok: true,
        unreadCount: computeUnreadNotificationsCount(nextAlerts),
      });
    }
  );

  // Reports & Analytics (All 8 Required Reports with Filter Support)
  router.get(
    '/reports/summary',
    requireAuth,
    requirePermission('view_reports'),
    (req: Request, res: Response) => {
      const db = getState();
      let filteredCases = [...db.cases];

      const bureau = String(req.query.bureau || '').trim();
      const region = String(req.query.region || '').trim();
      const category = String(req.query.category || '').trim();
      const status = String(req.query.status || '').trim();
      const startDate = String(req.query.startDate || '').trim();
      const endDate = String(req.query.endDate || '').trim();

      if (bureau && bureau !== 'All') {
        filteredCases = filteredCases.filter((c) => c.current_bureau === bureau);
      }
      if (region && region !== 'All') {
        filteredCases = filteredCases.filter((c) => c.region === region);
      }
      if (category && category !== 'All') {
        filteredCases = filteredCases.filter((c) => c.category === category);
      }
      if (status && status !== 'All') {
        filteredCases = filteredCases.filter((c) => c.status === status);
      }
      if (startDate) {
        const startMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
        if (!Number.isNaN(startMs)) {
          filteredCases = filteredCases.filter(
            (c) => new Date(c.received_at).getTime() >= startMs
          );
        }
      }
      if (endDate) {
        const endMs = new Date(`${endDate}T23:59:59.999Z`).getTime();
        if (!Number.isNaN(endMs)) {
          filteredCases = filteredCases.filter(
            (c) => new Date(c.received_at).getTime() <= endMs
          );
        }
      }

      const totalCount = filteredCases.length;
      const disposedCount = filteredCases.filter((c) => c.status === 'Disposed').length;
      const disposalRatePercent =
        totalCount > 0 ? Number(((disposedCount / totalCount) * 100).toFixed(1)) : 0;

      // 1. Bureau/Cell-wise Case Report
      const bureaus = Array.from(new Set(db.cases.map((c) => c.current_bureau)));
      const bureauReport = bureaus.map((b) => {
        const bCases = filteredCases.filter((c) => c.current_bureau === b);
        const bDisposed = bCases.filter((c) => c.status === 'Disposed').length;
        return {
          bureau: b,
          total: bCases.length,
          pending: bCases.filter((c) => c.status === 'Pending' || c.status === 'Received').length,
          underProcess: bCases.filter((c) => c.status === 'Under Process').length,
          transferred: bCases.filter((c) => c.status === 'Transferred').length,
          escalated: bCases.filter((c) => c.status === 'Escalated').length,
          disposed: bDisposed,
          disposalRatePercent:
            bCases.length > 0 ? Number(((bDisposed / bCases.length) * 100).toFixed(1)) : 0,
        };
      });

      // 2. Region-wise Case Report
      const regions = Array.from(new Set(db.institutions.map((i) => i.region)));
      const regionReport = regions.map((r) => {
        const rCases = filteredCases.filter((c) => c.region === r);
        const rDisposed = rCases.filter((c) => c.status === 'Disposed').length;
        return {
          region: r,
          total: rCases.length,
          active: rCases.length - rDisposed,
          disposed: rDisposed,
          disposalRatePercent:
            rCases.length > 0 ? Number(((rDisposed / rCases.length) * 100).toFixed(1)) : 0,
        };
      });

      // 3. Institution-wise Complaint History Report
      const institutionReport = db.institutions.map((inst) => {
        const iCases = filteredCases.filter(
          (c) => c.institution_id === inst.institution_id
        );
        return {
          institution_id: inst.institution_id,
          aicte_permanent_id: inst.aicte_permanent_id,
          name: inst.name,
          region: inst.region,
          totalCases: iCases.length,
          activeCases: iCases.filter((c) => c.status !== 'Disposed').length,
          disposedCases: iCases.filter((c) => c.status === 'Disposed').length,
          bureausInvolved: Array.from(new Set(iCases.map((c) => c.current_bureau))),
        };
      });

      // 4. Pending-Case Ageing Analysis
      const refNow = new Date('2026-10-26T12:00:00Z').getTime();
      const activeCases = filteredCases.filter((c) => c.status !== 'Disposed');
      const ageingBuckets = {
        days_0_3: 0,
        days_4_7: 0,
        days_8_14: 0,
        days_15_plus: 0,
      };
      for (const c of activeCases) {
        const ageDays = Math.max(
          0,
          (refNow - new Date(c.received_at).getTime()) / (1000 * 60 * 60 * 24)
        );
        if (ageDays <= 3) ageingBuckets.days_0_3 += 1;
        else if (ageDays <= 7) ageingBuckets.days_4_7 += 1;
        else if (ageDays <= 14) ageingBuckets.days_8_14 += 1;
        else ageingBuckets.days_15_plus += 1;
      }

      // 5. Disposal Rate Report (explicit numerator & denominator)
      const disposalRateReport = {
        disposedCount,
        totalCount,
        activeCount: totalCount - disposedCount,
        disposalRatePercent,
        formula:
          'Disposal Rate (%) = (Disposed Cases in Selected Scope / Total Cases in Selected Scope) × 100',
      };

      // 6. Potential Overlap / Duplicate Case Report
      const overlapReport = {
        totalRelations: db.relations.length,
        potentialOverlapReviewRequired: db.relations.filter(
          (r) => r.review_status === 'Potential Overlap — Review Required'
        ).length,
        confirmedRelated: db.relations.filter(
          (r) => r.review_status === 'Confirmed Related Cases'
        ).length,
        identityUncertain: db.relations.filter(
          (r) => r.review_status === 'Institution Identity Uncertain'
        ).length,
        notRelatedReviewed: db.relations.filter(
          (r) => r.review_status === 'Not Related — Reviewed'
        ).length,
      };

      // 7. Monthly Performance Summary
      const monthlyMap = new Map<
        string,
        { month: string; received: number; disposed: number; active: number; escalated: number }
      >();
      for (const c of filteredCases) {
        const d = new Date(c.received_at);
        const key = Number.isNaN(d.getTime())
          ? '2026-10'
          : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`;
        const cur = monthlyMap.get(key) || {
          month: key,
          received: 0,
          disposed: 0,
          active: 0,
          escalated: 0,
        };
        cur.received += 1;
        if (c.status === 'Disposed') cur.disposed += 1;
        else cur.active += 1;
        if (c.status === 'Escalated') cur.escalated += 1;
        monthlyMap.set(key, cur);
      }
      const monthlyPerformance = Array.from(monthlyMap.values()).map((m) => ({
        ...m,
        disposalRatePercent:
          m.received > 0 ? Number(((m.disposed / m.received) * 100).toFixed(1)) : 0,
      }));

      // 8. Quarterly Performance Summary
      const quarterlyMap = new Map<
        string,
        { quarter: string; received: number; disposed: number; active: number; escalated: number }
      >();
      for (const c of filteredCases) {
        const d = new Date(c.received_at);
        const q = Number.isNaN(d.getTime())
          ? '2026-Q4'
          : `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
        const cur = quarterlyMap.get(q) || {
          quarter: q,
          received: 0,
          disposed: 0,
          active: 0,
          escalated: 0,
        };
        cur.received += 1;
        if (c.status === 'Disposed') cur.disposed += 1;
        else cur.active += 1;
        if (c.status === 'Escalated') cur.escalated += 1;
        quarterlyMap.set(q, cur);
      }
      const quarterlyPerformance = Array.from(quarterlyMap.values()).map((q) => ({
        ...q,
        disposalRatePercent:
          q.received > 0 ? Number(((q.disposed / q.received) * 100).toFixed(1)) : 0,
      }));

      res.json({
        institutionsCount: db.institutions.length,
        casesCount: filteredCases.length,
        overlapsCount: db.relations.length,
        disposalRateReport,
        bureauReport,
        regionReport,
        institutionReport,
        ageingBuckets,
        overlapReport,
        monthlyPerformance,
        quarterlyPerformance,
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
