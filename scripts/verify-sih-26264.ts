import express from 'express';
import { createApiV1Router, PersistedDatabaseState } from '../backend/src/routes/v1';
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
} from '../src/data/seedData';
import {
  classifyComplaintML,
  getClassifierModelMetrics,
} from '../backend/src/services/ml-classifier';
import { evaluateComplaintOverlap } from '../backend/src/services/overlap-detection';
import { synchronizeOperationalAlerts } from '../backend/src/services/deadline-monitor';

function cloneInitialState(): PersistedDatabaseState {
  return JSON.parse(
    JSON.stringify({
      institutions: INITIAL_INSTITUTIONS,
      cases: INITIAL_CASES,
      relations: INITIAL_RELATIONS,
      coordination: INITIAL_COORDINATION,
      transfers: INITIAL_TRANSFERS,
      escalations: INITIAL_ESCALATIONS,
      alerts: INITIAL_ALERTS,
      routingRules: INITIAL_ROUTING_RULES,
      slaConfig: INITIAL_SLA_CONFIG,
    })
  );
}

async function runVerificationSuite() {
  let dbState = cloneInitialState();
  const app = express();
  app.use(express.json());
  app.use(
    '/api/v1',
    createApiV1Router(
      () => dbState,
      (next) => {
        dbState = next;
      }
    )
  );

  const server = app.listen(0);
  const address = server.address();
  const port = typeof address === 'object' && address ? address.port : 3999;
  const baseUrl = `http://127.0.0.1:${port}/api/v1`;

  const results: { id: string; name: string; passed: boolean; details: string }[] = [];
  const assertTest = (id: string, name: string, condition: boolean, details: string) => {
    results.push({ id, name, passed: condition, details });
    if (!condition) {
      console.error(`❌ [FAIL] ${id} - ${name}: ${details}`);
    } else {
      console.log(`✅ [PASS] ${id} - ${name}: ${details}`);
    }
  };

  try {
    // Authenticate as Admin, RB Officer, PGRC Officer, and Submitter
    const loginAs = async (email: string, password: string) => {
      const res = await fetch(`${baseUrl}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const body = await res.json();
      return { status: res.status, body };
    };

    const adminAuth = await loginAs('admin.casesync@aicte-india.org', 'AICTE@CaseSync2026');
    const rbAuth = await loginAs('rb.officer@aicte-india.org', 'AICTE@CaseSync2026');
    const pgrcAuth = await loginAs('pgrc.nodal@aicte-india.org', 'AICTE@CaseSync2026');
    const submitterAuth = await loginAs('submitter@academic.edu.in', 'AICTE@CaseSync2026');

    const adminHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminAuth.body.token}`,
    };
    const rbHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${rbAuth.body.token}`,
    };
    const submitterHeaders = {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${submitterAuth.body.token}`,
    };

    // =========================================================================
    // PART 1: OVERLAP DETECTION SCENARIOS 1 TO 10
    // =========================================================================

    // Scenario 1: Exact same AICTE Permanent ID, two complaints in different Bureaus (RB & PGRC)
    const sc1Eval = evaluateComplaintOverlap({
      caseId: 'CMP-TEST-SC1',
      title: 'Withheld original certificates and 6-month unpaid CSE faculty salary',
      description: 'Seven resigning CSE faculty members report unpaid salary and acute faculty cadre ratio deficit.',
      institutionName: 'Deccan Institute of Engineering & Technology',
      aictePermanentId: '1-482910311',
      assignedBureau: 'Public Grievance Redressal Cell (PGRC)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: dbState.cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC1',
      'Scenario 1: Exact same AICTE PID across RB & PGRC on related issue',
      sc1Eval.matchedInstitution.institution_id === 'INST-101' &&
        sc1Eval.overlapStatus === 'Potential Overlap — Review Required' &&
        sc1Eval.relatedCaseIds.includes('CMP-2026-0141') &&
        Boolean(sc1Eval.candidateAlert),
      `Matched INST-101 (PID 1-482910311), overlapStatus="${sc1Eval.overlapStatus}", linked=${sc1Eval.relatedCaseIds.join(',')}`
    );

    // Scenario 2: Same AICTE Permanent ID, three complaints across PGRC, Approval Bureau, and Regional Office
    const sc2Cases = [
      ...dbState.cases,
      {
        ...dbState.cases[0],
        id: 'CMP-SC2-PGRC',
        institution_id: 'INST-105',
        aicte_permanent_id: '1-209481723',
        institutionName: 'PSG Institute of Technology & Applied Research',
        current_bureau: 'Public Grievance Redressal Cell (PGRC)' as const,
        status: 'Under Process' as const,
        title: 'B.Tech AI & Data Science students awaiting EoA intake seat confirmation',
        description: 'Students admitted in B.Tech AI & Data Science expansion batch awaiting EoA seat intake approval.',
        category: 'Student & Stakeholder Public Grievance',
      },
    ];
    const sc2Eval = evaluateComplaintOverlap({
      caseId: 'CMP-SC2-NEW',
      title: 'EoA seat intake expansion verification for B.Tech AI & Data Science',
      description: 'Cross-bureau scrutiny for B.Tech AI & Data Science 60 to 120 intake expansion and EoA corrigendum.',
      institutionName: 'PSG Institute of Technology & Applied Research',
      aictePermanentId: '1-209481723',
      assignedBureau: 'Approval Bureau (AB)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: sc2Cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC2',
      'Scenario 2: Same PID across 3 Bureaus (PGRC, AB, Regional Office SRO)',
      sc2Eval.matchedInstitution.institution_id === 'INST-105' &&
        sc2Eval.relatedCaseIds.length >= 3 &&
        sc2Eval.candidateRelations.length >= 2,
      `All 3 active cases (${sc2Eval.relatedCaseIds.join(', ')}) linked under INST-105 with ${sc2Eval.candidateRelations.length} cross-bureau relation pairs`
    );

    // Scenario 3: Same institution, two completely unrelated complaints (no false duplicate alert)
    const sc3Eval = evaluateComplaintOverlap({
      caseId: 'CMP-SC3-UNRELATED',
      title: 'Campus solar rooftop panel maintenance and rainwater harvesting log',
      description: 'Routine green campus solar panel cleaning schedule submitted for annual environmental log.',
      institutionName: 'Government College of Engineering, Pune',
      aictePermanentId: '1-339104821',
      assignedBureau: 'Regional Office (SWRO)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: dbState.cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC3',
      'Scenario 3: Same institution, completely unrelated complaints (no false duplicate alert)',
      sc3Eval.matchedInstitution.institution_id === 'INST-102' &&
        sc3Eval.overlapStatus === 'No Overlap' &&
        sc3Eval.relatedCaseIds.length === 0 &&
        sc3Eval.candidateAlerts.length === 0 &&
        sc3Eval.candidateRelations[0]?.review_status === 'Not Related — Reviewed',
      `Linked to INST-102, overlapStatus="${sc3Eval.overlapStatus}", alertsGenerated=${sc3Eval.candidateAlerts.length}, relationReview="${sc3Eval.candidateRelations[0]?.review_status}"`
    );

    // Scenario 4: Two different institutions, similar complaint text
    const sc4Eval = evaluateComplaintOverlap({
      caseId: 'CMP-SC4-DIFF-INST',
      title: 'Alleged excess admission beyond approved EoA intake in MCA program',
      description: 'Complaint alleging that the institution admitted 38 supernumerary students above the AICTE approved intake of 120 in the MCA program.',
      institutionName: 'L.D. College of Engineering, Ahmedabad',
      aictePermanentId: '1-558291034', // INST-106 (different from INST-111 PID 1-440291834)
      assignedBureau: 'Regulation Bureau (RB)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: dbState.cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC4',
      'Scenario 4: Two different institutions with identical complaint text are NOT linked as same-institution overlap',
      sc4Eval.matchedInstitution.institution_id === 'INST-106' &&
        !sc4Eval.relatedCaseIds.includes('CMP-2026-0130'),
      `Linked strictly to INST-106 (PID 1-558291034); did not link INST-111 case CMP-2026-0130`
    );

    // Scenario 5: Missing or invalid AICTE Permanent ID
    const sc5Eval = evaluateComplaintOverlap({
      caseId: 'CMP-SC5-NO-PID',
      title: 'Refund of tuition fee after counselling withdrawal',
      description: 'Student requests tuition fee refund from newly opened private polytechnic.',
      institutionName: 'Unknown Rural Polytechnic Campus',
      aictePermanentId: '',
      assignedBureau: 'Public Grievance Redressal Cell (PGRC)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: dbState.cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC5',
      'Scenario 5: Missing/invalid AICTE Permanent ID is flagged for verification and never silently merged into INST-101',
      sc5Eval.isIdentityUncertain === true &&
        sc5Eval.overlapStatus === 'Institution Identity Uncertain' &&
        sc5Eval.matchedInstitution.institution_id !== 'INST-101',
      `isIdentityUncertain=${sc5Eval.isIdentityUncertain}, assigned temp ID=${sc5Eval.matchedInstitution.institution_id}, overlapStatus="${sc5Eval.overlapStatus}"`
    );

    // Scenario 6: Case transferred from PGRC to Regulation Bureau preserves single Case ID & history
    const trfRes = await fetch(`${baseUrl}/transfers`, {
      method: 'POST',
      headers: rbHeaders,
      body: JSON.stringify({
        caseId: 'CMP-2026-0133',
        receivingBureau: 'Regulation Bureau (RB)',
        receivingOfficer: 'Dr. S. Subramanian (RB Under Secretary)',
        reason: 'Systemic enrollment discrepancy requires Regulation Bureau statutory audit.',
        remarks: 'Transferred with complete PGRC student manifest.',
      }),
    });
    const trfData = await trfRes.json();
    const transferredCase = dbState.cases.find((c) => c.id === 'CMP-2026-0133');
    assertTest(
      'OVERLAP-SC6',
      'Scenario 6: Case transferred from PGRC to RB preserves single Case ID, originating/receiving bureau, and history',
      trfRes.status === 201 &&
        transferredCase?.id === 'CMP-2026-0133' &&
        transferredCase?.status === 'Transferred' &&
        transferredCase?.current_bureau === 'Regulation Bureau (RB)' &&
        trfData.transfer.originating_bureau === 'Public Grievance Redressal Cell (PGRC)' &&
        trfData.transfer.receiving_bureau === 'Regulation Bureau (RB)',
      `Case CMP-2026-0133 status="${transferredCase?.status}", originating="${trfData.transfer?.originating_bureau}" → receiving="${trfData.transfer?.receiving_bureau}"`
    );

    // Scenario 7: Disposed historical case + new complaint for the same institution
    // INST-108 (Model Engineering College, PID 1-883019472) has disposed case CMP-2026-0132
    const sc7Eval = evaluateComplaintOverlap({
      caseId: 'CMP-SC7-NEW',
      title: 'Verification of barrier-free ramp compliance for new academic block',
      description: 'Regional Office inspection request for newly added ramp in mechanical block.',
      institutionName: 'Model Engineering College, Thrikkakara',
      aictePermanentId: '1-883019472',
      assignedBureau: 'Regional Office (SWRO)',
      dueDate: '2026-11-10T18:00:00Z',
      existingCases: dbState.cases,
      institutions: dbState.institutions,
      routingRules: dbState.routingRules,
      existingRelations: [],
    });
    assertTest(
      'OVERLAP-SC7',
      'Scenario 7: Disposed historical case remains visible in history without triggering active overlap alert',
      sc7Eval.matchedInstitution.institution_id === 'INST-108' &&
        sc7Eval.historicalDisposedCaseIds.includes('CMP-2026-0132') &&
        sc7Eval.relatedCaseIds.length === 0 &&
        sc7Eval.overlapStatus === 'No Overlap' &&
        sc7Eval.candidateAlerts.length === 0,
      `Historical disposed case=${sc7Eval.historicalDisposedCaseIds.join(',')}, activeOverlapAlerts=${sc7Eval.candidateAlerts.length}`
    );

    // Scenario 8: Reviewing / acknowledging / dismissing an overlap alert persists and does not recreate open alert
    const reviewRes = await fetch(`${baseUrl}/overlaps/REL-2026-01/review`, {
      method: 'POST',
      headers: rbHeaders,
      body: JSON.stringify({
        decision: 'Confirmed Related Cases',
        remarks: 'Verified joint RB-PGRC inspection mandate on CSE cadre and withheld certificates.',
        coordinationOwner: 'Dr. S. Subramanian (RB Under Secretary)',
        nextRequiredAction: 'Conduct joint EVC visit on 28 Oct 2026.',
      }),
    });
    const relAfterReview = dbState.relations.find((r) => r.relation_id === 'REL-2026-01');
    const alertAfterReview = dbState.alerts.find((a) => a.deduplication_key === 'rel:REL-2026-01');
    assertTest(
      'OVERLAP-SC8',
      'Scenario 8: Reviewing an overlap updates relation status, case timeline, and resolves alert persistently',
      reviewRes.status === 200 &&
        relAfterReview?.review_status === 'Confirmed Related Cases' &&
        Boolean(relAfterReview?.reviewed_by) &&
        alertAfterReview?.resolution_status === 'Resolved',
      `REL-2026-01 status="${relAfterReview?.review_status}", reviewed_by="${relAfterReview?.reviewed_by}", alert resolution="${alertAfterReview?.resolution_status}"`
    );

    // Scenario 9: Multiple page refreshes / repeated alert synchronizations do not create duplicate alerts
    const alertCountBefore = dbState.alerts.length;
    for (let i = 0; i < 5; i++) {
      dbState.alerts = synchronizeOperationalAlerts({
        cases: dbState.cases,
        relations: dbState.relations,
        transfers: dbState.transfers,
        escalations: dbState.escalations,
        institutions: dbState.institutions,
        slaConfig: dbState.slaConfig,
        existingAlerts: dbState.alerts,
      });
    }
    const alertCountAfter = dbState.alerts.length;
    const resolvedAlertStillResolved =
      dbState.alerts.find((a) => a.deduplication_key === 'rel:REL-2026-01')
        ?.resolution_status === 'Resolved';
    assertTest(
      'OVERLAP-SC9',
      'Scenario 9: 5 consecutive refreshes/syncs produce zero duplicate alerts and preserve resolved alert state',
      alertCountBefore === alertCountAfter && resolvedAlertStillResolved,
      `Alert count before=${alertCountBefore}, after 5 syncs=${alertCountAfter}, resolvedPreserved=${resolvedAlertStillResolved}`
    );

    // Scenario 10: Unauthorized user (Submitter) attempts to review or dismiss an overlap alert -> 403 Forbidden
    const unauthReviewRes = await fetch(`${baseUrl}/overlaps/REL-2026-04/review`, {
      method: 'POST',
      headers: submitterHeaders,
      body: JSON.stringify({
        decision: 'Not Related — Reviewed',
        remarks: 'Unauthorized attempt by Submitter.',
      }),
    });
    assertTest(
      'OVERLAP-SC10',
      'Scenario 10: Unauthorized user (Submitter) blocked from reviewing/dismissing overlap alert with HTTP 403',
      unauthReviewRes.status === 403,
      `HTTP status=${unauthReviewRes.status} Forbidden`
    );

    // =========================================================================
    // PART 2: ACCEPTANCE CRITERIA TESTS A TO L
    // =========================================================================

    // Test A: Institution profile test (query by PID 1-482910311)
    const instRes = await fetch(`${baseUrl}/institutions/1-482910311`, {
      headers: adminHeaders,
    });
    const instBody = await instRes.json();
    assertTest(
      'TEST-A',
      'Test A: Institution profile test (Consolidated cases across RB & PGRC by AICTE Permanent ID)',
      instRes.status === 200 &&
        instBody.institution.aicte_permanent_id === '1-482910311' &&
        instBody.cases.length >= 2 &&
        instBody.involvedBureaus.includes('Regulation Bureau (RB)') &&
        instBody.involvedBureaus.includes('Public Grievance Redressal Cell (PGRC)'),
      `Found ${instBody.cases.length} cases across [${instBody.involvedBureaus.join(', ')}] for PID 1-482910311`
    );

    // Test B: Cross-Bureau overlap test via POST /api/v1/complaints
    const newOverlapCaseRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: rbHeaders,
      body: JSON.stringify({
        title: 'BPUT university affiliation inquiry on 38 excess MCA admissions',
        description: 'Regulation Bureau follow-up on 38 supernumerary MCA admissions without university registration numbers.',
        institutionId: 'INST-111',
        institutionName: 'Kalinga Institute of Industrial & Technical Studies, Bhubaneswar',
        aictePermanentId: '1-440291834',
      }),
    });
    const newOverlapCaseBody = await newOverlapCaseRes.json();
    assertTest(
      'TEST-B',
      'Test B: Cross-Bureau overlap detection on live complaint intake',
      newOverlapCaseRes.status === 201 &&
        newOverlapCaseBody.complaint.overlap_status === 'Potential Overlap — Review Required' &&
        newOverlapCaseBody.complaint.linked_case_ids.includes('CMP-2026-0129'),
      `Created ${newOverlapCaseBody.complaint.id}, linked to [${newOverlapCaseBody.complaint.linked_case_ids.join(', ')}]`
    );

    // Test C: Non-duplicate same-institution test via POST /api/v1/complaints
    const nonDupRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        title: 'ATAL FDP digital certificate download query for civil department',
        description: 'Faculty participant requests re-sync of ATAL FDP attendance certificate on portal.',
        institutionId: 'INST-112',
        institutionName: 'Sri Venkateswara College of Engineering, Tirupati',
        aictePermanentId: '1-729104650',
      }),
    });
    const nonDupBody = await nonDupRes.json();
    assertTest(
      'TEST-C',
      'Test C: Non-duplicate same-institution complaint linked without false overlap alert',
      nonDupRes.status === 201 &&
        nonDupBody.complaint.institution_id === 'INST-112' &&
        nonDupBody.complaint.overlap_status === 'No Overlap' &&
        nonDupBody.overlapEval.candidateAlerts.length === 0,
      `Created ${nonDupBody.complaint.id} under INST-112 with overlap_status="${nonDupBody.complaint.overlap_status}" and 0 false alerts`
    );

    // Test D: ML Classification test (5 categories + low-confidence uncertainty flag)
    const mlSamples = [
      {
        title: 'Acute faculty cadre ratio deficiency and excess admission in B.Tech CSE',
        description: 'Statutory norm violation with 45% faculty shortage and unapproved capitation fee collection.',
        expectedBureau: 'Regulation Bureau (RB)',
      },
      {
        title: 'Non-refund of tuition fee and withheld original 12th mark sheet after admission withdrawal',
        description: 'Student grievance requesting tuition fee refund and release of original certificates under PGRC norms.',
        expectedBureau: 'Public Grievance Redressal Cell (PGRC)',
      },
      {
        title: 'Extension of Approval EoA 2026-27 seat intake corrigendum and NBA accreditation affidavit',
        description: 'Application to Approval Bureau for 60 to 120 seat intake expansion and laboratory compliance affidavit.',
        expectedBureau: 'Approval Bureau (AB)',
      },
      {
        title: 'Unpaid 8-month faculty salary arrears, 7th CPC pay scale, and withheld relieving letter',
        description: 'Resigning assistant professors petition Faculty Grievance Cell for pending salary and experience certificate.',
        expectedBureau: 'Faculty Grievance Cell (FGC)',
      },
      {
        title: 'Regional Office physical site visit for campus address and state DTE NOC verification',
        description: 'Local verification of barrier-free ramp, occupancy certificate, and university affiliation NOC.',
        expectedBureau: 'Regional Office (SWRO)',
      },
    ];
    const mlResults = mlSamples.map((s) => classifyComplaintML(s.title, s.description));
    const all5Correct = mlResults.every(
      (r, idx) => r.recommended_bureau === mlSamples[idx].expectedBureau
    );
    const ambiguousPred = classifyComplaintML('General query', 'Hello team please check status');
    const metricsReport = getClassifierModelMetrics();
    assertTest(
      'TEST-D',
      'Test D: ML TF-IDF + MNB Classifier accuracy on 5 AICTE categories & low-confidence uncertainty flag',
      all5Correct &&
        ambiguousPred.uncertainty_flag === true &&
        metricsReport.artifactSummary.evaluation.accuracy >= 0.9,
      `5/5 categories accurately routed; held-out val accuracy=${(metricsReport.artifactSummary.evaluation.accuracy * 100).toFixed(1)}%, macro F1=${metricsReport.artifactSummary.evaluation.macro_f1}, ambiguous uncertainty_flag=${ambiguousPred.uncertainty_flag}`
    );

    // Test E: Status workflow and audit trail test (including mandatory disposal remarks check)
    const badDisposeRes = await fetch(`${baseUrl}/complaints/CMP-2026-0140`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ status: 'Disposed', remarks: '' }),
    });
    const goodDisposeRes = await fetch(`${baseUrl}/complaints/CMP-2026-0140`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({
        status: 'Disposed',
        remarks: 'Pragati scholarship batch verified on NSP portal and DBT payment released.',
      }),
    });
    const goodDisposeBody = await goodDisposeRes.json();
    assertTest(
      'TEST-E',
      'Test E: Controlled status transition enforces disposal remarks and records audit timeline',
      badDisposeRes.status === 400 &&
        goodDisposeRes.status === 200 &&
        goodDisposeBody.complaint.status === 'Disposed' &&
        goodDisposeBody.complaint.timeline[0].action_type === 'Case Disposed',
      `Empty disposal remark rejected (400); valid disposal updated status="Disposed" & appended timeline event "${goodDisposeBody.complaint.timeline[0].action_type}"`
    );

    // Test F: Search and filter test on /api/v1/complaints
    const searchPidRes = await fetch(`${baseUrl}/complaints?pid=1-482910311`, {
      headers: adminHeaders,
    });
    const searchPidBody = await searchPidRes.json();
    const filterBureauRes = await fetch(
      `${baseUrl}/complaints?bureau=${encodeURIComponent('Regulation Bureau (RB)')}&priority=Critical`,
      { headers: adminHeaders }
    );
    const filterBureauBody = await filterBureauRes.json();
    assertTest(
      'TEST-F',
      'Test F: Multi-criteria search & filter by AICTE PID, Bureau, and Priority',
      searchPidBody.data.length >= 2 &&
        searchPidBody.data.every((c: { aicte_permanent_id: string }) => c.aicte_permanent_id === '1-482910311') &&
        filterBureauBody.data.length >= 1 &&
        filterBureauBody.data.every(
          (c: { current_bureau: string; priority: string }) =>
            c.current_bureau === 'Regulation Bureau (RB)' && c.priority === 'Critical'
        ),
      `PID filter returned ${searchPidBody.data.length} exact matches; Bureau+Priority filter returned ${filterBureauBody.data.length} exact matches`
    );

    // Test G: Deadline and escalation test
    const overdueCases = dbState.cases.filter((c) => c.id === 'CMP-2026-0134');
    const overdueAlertExists = dbState.alerts.some(
      (a) => a.deduplication_key === 'overdue:CMP-2026-0134'
    );
    const escRes = await fetch(`${baseUrl}/escalations`, {
      method: 'POST',
      headers: rbHeaders,
      body: JSON.stringify({
        caseId: 'CMP-2026-0130',
        escalationLevel: 'Level 1 — Bureau Head',
        responsibleAuthority: 'Director, Regulation Bureau',
        reason: 'Approaching SLA deadline with cross-bureau MCA admission dependency.',
        requiredNextAction: 'Expedite BPUT registrar verification.',
      }),
    });
    assertTest(
      'TEST-G',
      'Test G: Deadline monitoring and senior authority escalation workflow',
      overdueCases.length === 1 && overdueAlertExists && escRes.status === 201,
      `Overdue alert verified for CMP-2026-0134; new escalation created (HTTP ${escRes.status})`
    );

    // Test H: Dashboard and reports consistency test
    const dashRes = await fetch(`${baseUrl}/dashboard/summary`, {
      headers: adminHeaders,
    });
    const dashBody = await dashRes.json();
    const repRes = await fetch(`${baseUrl}/reports/summary`, {
      headers: adminHeaders,
    });
    const repBody = await repRes.json();
    const sumOfBureauReportCases = repBody.bureauReport.reduce(
      (acc: number, r: { total: number }) => acc + r.total,
      0
    );
    assertTest(
      'TEST-H',
      'Test H: Dashboard KPIs and 8 Analytical Reports mathematical consistency',
      dashBody.kpis.total === repBody.casesCount &&
        dashBody.kpis.disposed === repBody.disposalRateReport.disposedCount &&
        sumOfBureauReportCases === repBody.casesCount &&
        repBody.monthlyPerformance.length >= 1 &&
        repBody.quarterlyPerformance.length >= 1,
      `Total cases=${dashBody.kpis.total} matches report total=${repBody.casesCount}, sum(Bureaus)=${sumOfBureauReportCases}, disposalRate=${repBody.disposalRateReport.disposalRatePercent}% (${repBody.disposalRateReport.disposedCount}/${repBody.disposalRateReport.totalCount})`
    );

    // Test I: Authentication test
    const badLogin = await loginAs('meera.nair@aicte-india.org', 'WrongPassword123');
    const unauthMe = await fetch(`${baseUrl}/auth/me`);
    const authMe = await fetch(`${baseUrl}/auth/me`, { headers: adminHeaders });
    assertTest(
      'TEST-I',
      'Test I: Authentication test (valid login, invalid password rejection, protected route check)',
      adminAuth.status === 200 &&
        badLogin.status === 401 &&
        unauthMe.status === 401 &&
        authMe.status === 200,
      `Valid login=200, invalid password=${badLogin.status}, unauthenticated /auth/me=${unauthMe.status}, authenticated /auth/me=${authMe.status}`
    );

    // Test J: Authorization (RBAC) test
    const submitterPatchCase = await fetch(`${baseUrl}/complaints/CMP-2026-0142`, {
      method: 'PATCH',
      headers: submitterHeaders,
      body: JSON.stringify({ status: 'Disposed', remarks: 'Illegal attempt' }),
    });
    const submitterReports = await fetch(`${baseUrl}/reports/summary`, {
      headers: submitterHeaders,
    });
    const submitterAudit = await fetch(`${baseUrl}/audit`, {
      headers: submitterHeaders,
    });
    assertTest(
      'TEST-J',
      'Test J: RBAC authorization blocks Submitter from status updates, reports, and audit logs',
      submitterPatchCase.status === 403 &&
        submitterReports.status === 403 &&
        submitterAudit.status === 403,
      `Submitter PATCH case=${submitterPatchCase.status}, GET reports=${submitterReports.status}, GET audit=${submitterAudit.status}`
    );

    // Test K: Input validation and security test (XSS / SQLi payload & missing required fields)
    const emptyComplaintRes = await fetch(`${baseUrl}/complaints`, {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({ title: '', description: '' }),
    });
    const xssPayloadRes = await fetch(`${baseUrl}/complaints?search=${encodeURIComponent('<script>alert(1)</script>\' OR 1=1 --')}`, {
      headers: adminHeaders,
    });
    assertTest(
      'TEST-K',
      'Test K: Input validation & injection resilience',
      emptyComplaintRes.status === 400 && xssPayloadRes.status === 200,
      `Empty complaint rejected with HTTP ${emptyComplaintRes.status}; malicious search query safely handled with HTTP ${xssPayloadRes.status}`
    );

    // Test L: Persistence and refresh stability test
    const stateSnapshotCases = dbState.cases.length;
    const stateSnapshotRelations = dbState.relations.length;
    const stateSnapshotAlerts = dbState.alerts.length;
    const reloadCasesRes = await fetch(`${baseUrl}/complaints`, { headers: adminHeaders });
    const reloadCasesBody = await reloadCasesRes.json();
    assertTest(
      'TEST-L',
      'Test L: State persistence & refresh stability across reloads',
      reloadCasesBody.total === stateSnapshotCases &&
        stateSnapshotRelations >= 5 &&
        stateSnapshotAlerts >= 7,
      `Persisted ${stateSnapshotCases} cases, ${stateSnapshotRelations} relations, and ${stateSnapshotAlerts} deduplicated alerts`
    );

    const passedCount = results.filter((r) => r.passed).length;
    console.log(`\n=============================================================`);
    console.log(`VERIFICATION SUMMARY: ${passedCount}/${results.length} TESTS PASSED`);
    console.log(`=============================================================\n`);

    if (passedCount !== results.length) {
      process.exitCode = 1;
    }
  } finally {
    server.close();
  }
}

runVerificationSuite().catch((err) => {
  console.error('Verification suite failed with exception:', err);
  process.exit(1);
});
