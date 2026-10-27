import {
  AlertRecord,
  CaseRecord,
  CaseRelation,
  InstitutionRecord,
  OverlapStatus,
  RoutingRule,
} from '../../../src/types/casesync';
import {
  classifyAndMatchComplaint,
  normalizeInstitutionName,
} from '../../../src/data/seedData';

export interface OverlapEvaluationResult {
  matchedInstitution: InstitutionRecord;
  isNewUnverifiedInstitution?: boolean;
  isIdentityUncertain: boolean;
  overlapStatus: OverlapStatus;
  relatedCaseIds: string[];
  unrelatedActiveCaseIds: string[];
  historicalDisposedCaseIds: string[];
  candidateRelation?: CaseRelation;
  candidateRelations: CaseRelation[];
  candidateAlert?: AlertRecord;
  candidateAlerts: AlertRecord[];
}

/**
 * 5-Layer Cross-Bureau Overlap Detection Service
 * Layer 1: Exact AICTE Permanent ID matching first; normalized institution name / region fallback.
 *          Never silently merges unverified or missing Permanent IDs into an unrelated institution.
 * Layer 2: Complaint category, normalized subject, description, and active workflow state comparison.
 *          Distinguishes related cross-bureau issues from distinct unrelated issues at the same institution.
 * Layer 3: Cross-Bureau coordination rules (RB + PGRC simultaneous handling, unacknowledged transfers).
 * Layer 4: Transparent risk & signal scoring without treating text similarity alone as duplication.
 * Layer 5: Human officer review preserving separate Case IDs.
 */
export function evaluateComplaintOverlap(params: {
  caseId: string;
  title: string;
  description: string;
  institutionId?: string;
  institutionName: string;
  aictePermanentId: string;
  assignedBureau: CaseRecord['current_bureau'];
  dueDate: string;
  existingCases: CaseRecord[];
  institutions: InstitutionRecord[];
  routingRules: RoutingRule[];
  existingRelations: CaseRelation[];
}): OverlapEvaluationResult {
  const otherCases = params.existingCases.filter((c) => c.id !== params.caseId);

  const explicitInst = params.institutionId
    ? params.institutions.find((i) => i.institution_id === params.institutionId)
    : undefined;

  const effectivePid =
    params.aictePermanentId.trim() ||
    (explicitInst ? explicitInst.aicte_permanent_id : '');
  const effectiveName =
    params.institutionName.trim() || (explicitInst ? explicitInst.name : '');

  const matchInfo = classifyAndMatchComplaint(
    params.description,
    params.title,
    effectiveName,
    effectivePid,
    otherCases,
    params.institutions,
    params.routingRules
  );

  let targetInst: InstitutionRecord;
  let isNewUnverifiedInstitution = false;

  if (explicitInst && !matchInfo.isIdentityUncertain) {
    targetInst = explicitInst;
  } else if (matchInfo.matchedInstitution) {
    targetInst = matchInfo.matchedInstitution;
  } else {
    // Missing or unrecognized PID and no fuzzy name match: create safe unverified institution record
    // Never silently merge into params.institutions[0]!
    isNewUnverifiedInstitution = true;
    const unverifiedPid =
      effectivePid && !effectivePid.toUpperCase().includes('UNVERIFIED')
        ? `${effectivePid} (PID-UNVERIFIED)`
        : `PID-UNVERIFIED-${params.caseId}`;
    targetInst = {
      institution_id: `INST-UNV-${params.caseId.replace(/[^A-Z0-9]/gi, '').slice(-6)}`,
      aicte_permanent_id: unverifiedPid,
      name: effectiveName || 'Unverified Technical Institution (Pending PID Check)',
      normalized_name: normalizeInstitutionName(
        effectiveName || 'unverified technical institution'
      ),
      institution_type: 'Pending Regional PID Verification',
      address: 'Address awaiting Regional Office verification',
      state: 'Unverified',
      region: 'North-Western (NWRO)',
      metadata: {
        establishedYear: 2020,
        approvedIntake: 0,
        universityAffiliation: 'Pending Verification',
        nodalContact: 'verification-pending@aicte-india.org',
      },
      verification_status: 'Uncertain Identity — Review Required',
    };
  }

  const isIdentityUncertain =
    matchInfo.isIdentityUncertain ||
    isNewUnverifiedInstitution ||
    targetInst.verification_status !== 'Verified';

  const hasRelatedCases = matchInfo.relatedCaseIds.length > 0;
  const overlapStatus: OverlapStatus = isIdentityUncertain
    ? 'Institution Identity Uncertain'
    : hasRelatedCases
      ? 'Potential Overlap — Review Required'
      : 'No Overlap';

  const now = new Date().toISOString();
  const candidateRelations: CaseRelation[] = [];
  const candidateAlerts: AlertRecord[] = [];

  // Case 1: Identity is uncertain even without an existing companion case -> create verification alert
  if (isIdentityUncertain && matchInfo.relatedCaseIds.length === 0) {
    const alertKey = `id-verify:${params.caseId}`;
    const alertId = `ALT-IDV-${params.caseId.replace(/[^0-9]/g, '').slice(-4) || '01'}`;
    const idAlert: AlertRecord = {
      alert_id: alertId,
      title: `Institution Identity Uncertain — Missing/Unverified AICTE Permanent ID (${params.caseId})`,
      alert_type: 'Institution Identity Verification',
      case_ids: [params.caseId],
      institution_id: targetInst.institution_id,
      institution_name: targetInst.name,
      aicte_permanent_id: targetInst.aicte_permanent_id,
      region: targetInst.region,
      bureaus: [params.assignedBureau],
      severity: 'High',
      reason: `Complaint ${params.caseId} was submitted with missing or unverified AICTE Permanent ID (${targetInst.aicte_permanent_id}). Automatic merge blocked.`,
      recommended_action:
        'Verify AICTE Permanent ID with Regional Office before linking to verified institution master record.',
      created_at: now,
      due_at: params.dueDate,
      assigned_to: `${targetInst.region} Verification Desk`,
      is_read: false,
      lifecycle_status: 'Active',
      deduplication_key: alertKey,
      acknowledgement_status: 'Unacknowledged',
      resolution_status: 'Open',
    };
    candidateAlerts.push(idAlert);
  }

  // Case 2: Evaluate all related active cases at the same institution (supports 2, 3, or more cases across Bureaus)
  for (const relCaseId of matchInfo.relatedCaseIds) {
    const companionCase = otherCases.find((c) => c.id === relCaseId);
    if (!companionCase) continue;

    const sortedPair = [params.caseId, companionCase.id].sort();
    const pairExists = params.existingRelations.some(
      (r) =>
        (r.case_id_a === sortedPair[0] && r.case_id_b === sortedPair[1]) ||
        (r.case_id_a === sortedPair[1] && r.case_id_b === sortedPair[0])
    );
    if (pairExists) continue;

    const numA = sortedPair[0].replace(/[^0-9]/g, '').slice(-4);
    const numB = sortedPair[1].replace(/[^0-9]/g, '').slice(-4);
    const relId = `REL-${numA}-${numB}`;
    const pairScore = matchInfo.pairScores[companionCase.id]?.score ?? matchInfo.confidence;
    const sharedSignals = matchInfo.pairScores[companionCase.id]?.sharedSignals ?? [];

    const isCrossBureau = params.assignedBureau !== companionCase.current_bureau;
    const relationType: CaseRelation['relation_type'] = isIdentityUncertain
      ? 'Uncertain Institution Identity Match'
      : isCrossBureau &&
          ((params.assignedBureau.includes('RB') && companionCase.current_bureau.includes('PGRC')) ||
            (params.assignedBureau.includes('PGRC') && companionCase.current_bureau.includes('RB')))
        ? 'Simultaneous RB & PGRC Action'
        : 'Overlapping Regulatory & Grievance Issue';

    const relation: CaseRelation = {
      relation_id: relId,
      institution_id: targetInst.institution_id,
      institution_name: targetInst.name,
      aicte_permanent_id: targetInst.aicte_permanent_id,
      case_id_a: params.caseId,
      case_id_b: companionCase.id,
      bureau_a: params.assignedBureau,
      bureau_b: companionCase.current_bureau,
      relation_type: relationType,
      match_method: isIdentityUncertain
        ? 'Layer 1 Fuzzy Name/Address Normalization (Missing/Conflicting PID)'
        : 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
      match_score: pairScore,
      review_status: overlapStatus,
      remarks: `Automatically flagged on complaint intake: ${params.caseId} (${params.assignedBureau}) and ${companionCase.id} (${companionCase.current_bureau}) both concern ${targetInst.name}. Separate Case IDs preserved.`,
      matching_signals: [
        `AICTE Permanent ID: ${targetInst.aicte_permanent_id}`,
        ...sharedSignals.map((s) => `Shared Domain Signal: ${s}`),
      ],
      why_raised: isCrossBureau
        ? 'Multiple AICTE Bureaus/Cells have active complaints for the same institution on related issues that may result in duplicate inspections or conflicting directives.'
        : 'High semantic similarity detected between active complaints for the same institution.',
      missing_or_uncertain: isIdentityUncertain
        ? 'AICTE Permanent ID requires officer verification before linking.'
        : 'Awaiting authorized officer overlap review.',
      coordination_owner: companionCase.assigned_officer,
      next_required_action:
        'Review candidate pair in Overlap Detection workspace and assign coordination owner.',
    };

    const alert: AlertRecord = {
      alert_id: `ALT-${relId}`,
      title: isIdentityUncertain
        ? `Institution Identity Uncertain — ${params.caseId} & ${companionCase.id}`
        : `Potential Cross-Bureau Overlap — ${params.caseId} & ${companionCase.id}`,
      alert_type: isIdentityUncertain
        ? 'Institution Identity Verification'
        : 'Potential Overlapping Cases',
      case_ids: [params.caseId, companionCase.id],
      institution_id: targetInst.institution_id,
      institution_name: targetInst.name,
      aicte_permanent_id: targetInst.aicte_permanent_id,
      region: targetInst.region,
      bureaus: Array.from(
        new Set([params.assignedBureau, companionCase.current_bureau])
      ),
      severity: 'Critical',
      reason: `Incoming complaint ${params.caseId} (${params.assignedBureau}) matches institution ${targetInst.name} with related active case ${companionCase.id} in ${companionCase.current_bureau}.`,
      recommended_action: 'Open Overlap Detection to review relationship.',
      created_at: now,
      due_at: params.dueDate,
      assigned_to: companionCase.assigned_officer,
      is_read: false,
      lifecycle_status: 'Active',
      deduplication_key: `rel:${relId}`,
      acknowledgement_status: 'Unacknowledged',
      resolution_status: 'Open',
    };

    candidateRelations.push(relation);
    candidateAlerts.push(alert);
  }

  // Case 3: Same institution has active cases, but they are completely UNRELATED issues (Scenario 3)
  // Record a pre-reviewed 'Not Related — Reviewed' relation for transparency without raising any false overlap alert!
  if (
    !isIdentityUncertain &&
    matchInfo.relatedCaseIds.length === 0 &&
    matchInfo.unrelatedActiveCaseIds.length > 0
  ) {
    const unrelatedCase = otherCases.find(
      (c) => c.id === matchInfo.unrelatedActiveCaseIds[0]
    );
    if (unrelatedCase) {
      const sortedPair = [params.caseId, unrelatedCase.id].sort();
      const pairExists = params.existingRelations.some(
        (r) =>
          (r.case_id_a === sortedPair[0] && r.case_id_b === sortedPair[1]) ||
          (r.case_id_a === sortedPair[1] && r.case_id_b === sortedPair[0])
      );
      if (!pairExists) {
        const numA = sortedPair[0].replace(/[^0-9]/g, '').slice(-4);
        const numB = sortedPair[1].replace(/[^0-9]/g, '').slice(-4);
        const relId = `REL-${numA}-${numB}`;
        const lowScore = matchInfo.pairScores[unrelatedCase.id]?.score ?? 14;

        candidateRelations.push({
          relation_id: relId,
          institution_id: targetInst.institution_id,
          institution_name: targetInst.name,
          aicte_permanent_id: targetInst.aicte_permanent_id,
          case_id_a: params.caseId,
          case_id_b: unrelatedCase.id,
          bureau_a: params.assignedBureau,
          bureau_b: unrelatedCase.current_bureau,
          relation_type: 'Same Institution — Distinct Unrelated Issues',
          match_method: 'Layer 1 Exact Permanent ID + Distinct Category Exclusion',
          match_score: lowScore,
          review_status: 'Not Related — Reviewed',
          reviewed_by: 'CaseSync Layer-2 Domain Exclusion Rule',
          reviewed_at: now,
          remarks: `Both records belong to ${targetInst.name} (${targetInst.aicte_permanent_id}), but concern distinct, unrelated domains (${params.title} vs. ${unrelatedCase.title}). Consolidated under institution profile without raising a duplicate/overlap alert.`,
          matching_signals: [
            `Exact AICTE Permanent ID: ${targetInst.aicte_permanent_id}`,
            `Low Semantic Overlap (${lowScore}%): Distinct Unrelated Domains`,
          ],
          why_raised:
            'Evaluated during institution-level intake check and classified as separate matters requiring no cross-bureau hold.',
          missing_or_uncertain: 'None — verified unrelated issues at the same institution.',
          coordination_owner: 'No Joint Coordination Required',
          next_required_action: 'Process independently in respective Bureaus.',
        });
      }
    }
  }

  return {
    matchedInstitution: targetInst,
    isNewUnverifiedInstitution,
    isIdentityUncertain,
    overlapStatus,
    relatedCaseIds: matchInfo.relatedCaseIds,
    unrelatedActiveCaseIds: matchInfo.unrelatedActiveCaseIds,
    historicalDisposedCaseIds: matchInfo.historicalDisposedCaseIds,
    candidateRelation: candidateRelations[0],
    candidateRelations,
    candidateAlert: candidateAlerts[0],
    candidateAlerts,
  };
}
