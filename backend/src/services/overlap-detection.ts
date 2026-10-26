import {
  AlertRecord,
  CaseRecord,
  CaseRelation,
  InstitutionRecord,
  OverlapStatus,
  RoutingRule,
} from '../../../src/types/casesync';
import { classifyAndMatchComplaint } from '../../../src/data/seedData';

export interface OverlapEvaluationResult {
  matchedInstitution: InstitutionRecord;
  isIdentityUncertain: boolean;
  overlapStatus: OverlapStatus;
  relatedCaseIds: string[];
  candidateRelation?: CaseRelation;
  candidateAlert?: AlertRecord;
}

/**
 * 5-Layer Cross-Bureau Overlap Detection Service
 * Layer 1: Exact AICTE Permanent ID matching first; normalized institution name / region fallback.
 * Layer 2: Complaint category, normalized subject, description, and active workflow state comparison.
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
  const matchInfo = classifyAndMatchComplaint(
    params.description,
    params.title,
    params.institutionName,
    params.aictePermanentId,
    params.existingCases,
    params.institutions,
    params.routingRules
  );

  const targetInst =
    (params.institutionId &&
      params.institutions.find(
        (i) => i.institution_id === params.institutionId
      )) ||
    matchInfo.matchedInstitution ||
    params.institutions[0];

  const hasCrossBureauOverlap = matchInfo.relatedCaseIds.length > 0;
  const overlapStatus: OverlapStatus = matchInfo.isIdentityUncertain
    ? 'Institution Identity Uncertain'
    : hasCrossBureauOverlap
      ? 'Potential Overlap — Review Required'
      : 'No Overlap';

  if (!hasCrossBureauOverlap) {
    return {
      matchedInstitution: targetInst,
      isIdentityUncertain: matchInfo.isIdentityUncertain,
      overlapStatus,
      relatedCaseIds: [],
    };
  }

  const companionCase = params.existingCases.find(
    (c) => c.id === matchInfo.relatedCaseIds[0]
  );

  if (!companionCase) {
    return {
      matchedInstitution: targetInst,
      isIdentityUncertain: matchInfo.isIdentityUncertain,
      overlapStatus,
      relatedCaseIds: matchInfo.relatedCaseIds,
    };
  }

  // Deduplicate: check if an unresolved relation already exists for this pair
  const pairExists = params.existingRelations.some(
    (r) =>
      (r.case_id_a === params.caseId && r.case_id_b === companionCase.id) ||
      (r.case_id_a === companionCase.id && r.case_id_b === params.caseId)
  );

  if (pairExists) {
    return {
      matchedInstitution: targetInst,
      isIdentityUncertain: matchInfo.isIdentityUncertain,
      overlapStatus,
      relatedCaseIds: matchInfo.relatedCaseIds,
    };
  }

  const relId = `REL-${Date.now().toString().slice(-5)}`;
  const now = new Date().toISOString();

  const candidateRelation: CaseRelation = {
    relation_id: relId,
    institution_id: targetInst.institution_id,
    institution_name: targetInst.name,
    aicte_permanent_id: targetInst.aicte_permanent_id,
    case_id_a: params.caseId,
    case_id_b: companionCase.id,
    bureau_a: params.assignedBureau,
    bureau_b: companionCase.current_bureau,
    relation_type: matchInfo.isIdentityUncertain
      ? 'Uncertain Institution Identity Match'
      : 'Overlapping Regulatory & Grievance Issue',
    match_method: matchInfo.isIdentityUncertain
      ? 'Layer 1 Fuzzy Name/Address Normalization (Missing/Conflicting PID)'
      : 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
    match_score: matchInfo.confidence,
    review_status: overlapStatus,
    remarks: `Automatically flagged on complaint intake: ${params.caseId} (${params.assignedBureau}) and ${companionCase.id} (${companionCase.current_bureau}) both concern ${targetInst.name}. Separate Case IDs preserved.`,
    matching_signals: [
      `AICTE Permanent ID: ${targetInst.aicte_permanent_id}`,
      ...matchInfo.explanation.matchedSignals,
    ],
    why_raised:
      'Multiple AICTE Bureaus/Cells have active complaints for the same institution that may result in duplicate inspections or conflicting directives.',
    missing_or_uncertain: matchInfo.isIdentityUncertain
      ? 'AICTE Permanent ID requires officer verification before linking.'
      : 'Awaiting authorized officer overlap review.',
    coordination_owner: companionCase.assigned_officer,
    next_required_action:
      'Review candidate pair in Overlap Detection workspace and assign coordination owner.',
  };

  const candidateAlert: AlertRecord = {
    alert_id: `ALT-${relId}`,
    title: `Potential Cross-Bureau Overlap — ${params.caseId} & ${companionCase.id}`,
    alert_type: matchInfo.isIdentityUncertain
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
    reason: `Incoming complaint ${params.caseId} matches institution ${targetInst.name} with active case ${companionCase.id} in ${companionCase.current_bureau}.`,
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

  return {
    matchedInstitution: targetInst,
    isIdentityUncertain: matchInfo.isIdentityUncertain,
    overlapStatus,
    relatedCaseIds: matchInfo.relatedCaseIds,
    candidateRelation,
    candidateAlert,
  };
}
