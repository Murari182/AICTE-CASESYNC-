export type Priority = 'Low' | 'Medium' | 'High' | 'Critical';

export type CaseStatus =
  | 'Received'
  | 'Pending'
  | 'Under Process'
  | 'Transferred'
  | 'Escalated'
  | 'Disposed';

export type DeadlineState =
  | 'On Track'
  | 'Due Soon'
  | 'Overdue'
  | 'Deadline Not Configured';

export type BureauCell =
  | 'Regulation Bureau (RB)'
  | 'Public Grievance Redressal Cell (PGRC)'
  | 'Approval Bureau (AB)'
  | 'Faculty Grievance Cell (FGC)'
  | 'Regional Office (SWRO)'
  | 'Regional Office (NWRO)'
  | 'Regional Office (SRO)'
  | 'Regional Office (ERO)';

export type RegionName =
  | 'South-Western (SWRO)'
  | 'North-Western (NWRO)'
  | 'Southern (SRO)'
  | 'Eastern (ERO)'
  | 'Central (CRO)'
  | 'Western (WRO)';

export type OverlapStatus =
  | 'Confirmed Related Cases'
  | 'Potential Overlap — Review Required'
  | 'Institution Identity Uncertain'
  | 'Not Related — Reviewed'
  | 'No Overlap';

export type TransferStatus =
  | 'Transfer Requested'
  | 'Awaiting Acceptance'
  | 'Accepted'
  | 'Rejected / Returned for Clarification';

export type AlertType =
  | 'Potential Overlapping Cases'
  | 'Institution Identity Verification'
  | 'Case Approaching Deadline'
  | 'Overdue Case'
  | 'Cases Awaiting Bureau Coordination'
  | 'Cases Pending Transfer Acceptance'
  | 'Cases Requiring Senior Review'
  | 'Escalation Awaiting Action';

export type AlertLifecycleStatus =
  | 'Active'
  | 'Acknowledged'
  | 'Assigned'
  | 'Resolved'
  | 'Dismissed';

export type UserRole =
  | 'Administrator'
  | 'Regulation Bureau Officer (RB)'
  | 'PGRC Officer'
  | 'Regional Officer'
  | 'Senior Management / Competent Authority'
  | 'Submitter';

export type WorkspaceScreen =
  | 'overview'
  | 'institutions'
  | 'institution-detail'
  | 'cases'
  | 'case-detail'
  | 'overlaps'
  | 'coordination'
  | 'transfers'
  | 'alerts'
  | 'reports'
  | 'audit'
  | 'settings';

export type ViewMode = 'landing' | 'login' | 'workspace';

export type PermissionKey =
  | 'view_all_cases'
  | 'view_assigned_cases'
  | 'manage_institutions'
  | 'update_case_status'
  | 'assign_officers'
  | 'transfer_cases'
  | 'escalate_cases'
  | 'review_overlap'
  | 'view_reports'
  | 'view_audit_trail'
  | 'manage_settings'
  | 'view_model_metrics';

export type ThemeMode = 'light' | 'dark';

export type ClassificationSource = 'ai-model' | 'deterministic-rules';

export type ClassifierMode = 'hybrid' | 'deterministic';

export interface InstitutionRecord {
  institution_id: string;
  aicte_permanent_id: string;
  name: string;
  normalized_name: string;
  institution_type: string;
  address: string;
  state: string;
  region: RegionName;
  metadata: {
    establishedYear: number;
    approvedIntake: number;
    universityAffiliation: string;
    nodalContact: string;
  };
  verification_status: 'Verified' | 'Uncertain Identity — Review Required';
  uncertainty_note?: string;
}

export interface CaseAction {
  action_id: string;
  case_id: string;
  institution_id: string;
  actor: string;
  actor_role: UserRole | 'System Matching Engine';
  bureau: BureauCell | 'Central Registry';
  action_type:
    | 'Complaint Received'
    | 'Case Assigned'
    | 'Related Case Detected'
    | 'Overlap Reviewed'
    | 'Coordination Requested'
    | 'Case Transferred'
    | 'Case Escalated'
    | 'Status Updated'
    | 'Action Remark Added'
    | 'Case Disposed';
  previous_value?: string;
  new_value?: string;
  remarks: string;
  timestamp: string;
  reference_id?: string;
}

export interface CaseRecord {
  id: string; // e.g. CMP-2026-0142
  institution_id: string;
  aicte_permanent_id: string;
  institutionName: string;
  region: RegionName;
  received_at: string;
  title: string; // Complaint subject
  description: string;
  submittedBy: string;
  category: string;
  predictedCategory: string;
  confirmedCategory: string;
  isCategoryOverridden: boolean;
  current_bureau: BureauCell;
  recommendedDepartment: BureauCell;
  assignedDepartment: BureauCell;
  isDepartmentOverridden: boolean;
  assigned_officer: string;
  status: CaseStatus;
  priority: Priority;
  last_action_taken: string;
  last_action_at: string;
  next_action_required: string;
  expected_disposal_at: string;
  createdAt: string;
  updatedAt: string;
  linked_case_ids: string[];
  overlap_status: OverlapStatus;
  supporting_documents: string[];
  confidence: number;
  classificationSource: ClassificationSource;
  explanation: {
    summary: string;
    matchedSignals: string[];
    routingRuleApplied: string;
    confidenceNote: string;
  };
  timeline: CaseAction[];
}

export interface CaseRelation {
  relation_id: string;
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string;
  case_id_a: string;
  case_id_b: string;
  bureau_a: BureauCell;
  bureau_b: BureauCell;
  relation_type:
    | 'Simultaneous RB & PGRC Action'
    | 'Overlapping Regulatory & Grievance Issue'
    | 'Uncertain Institution Identity Match'
    | 'Unacknowledged Handoff Overlap'
    | 'Same Institution — Distinct Unrelated Issues';
  match_method:
    | 'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match'
    | 'Layer 1 Fuzzy Name/Address Normalization (Missing/Conflicting PID)'
    | 'Layer 1 Exact Permanent ID + Distinct Category Exclusion';
  match_score: number;
  review_status: OverlapStatus;
  reviewed_by?: string;
  reviewed_at?: string;
  remarks: string;
  matching_signals: string[];
  why_raised: string;
  missing_or_uncertain: string;
  coordination_owner: string;
  next_required_action: string;
}

export interface CoordinationRecord {
  coordination_id: string;
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string;
  related_case_ids: string[];
  originating_bureau: BureauCell;
  involved_bureaus: BureauCell[];
  coordination_owner: string;
  agreed_next_action: string;
  due_date: string;
  status:
    | 'Pending Coordination'
    | 'Active Joint Review'
    | 'Awaiting Transfer Acceptance'
    | 'Resolved';
  latest_remark: string;
  updated_at: string;
}

export interface TransferRecord {
  transfer_id: string;
  case_id: string;
  case_subject: string;
  institution_id: string;
  institution_name: string;
  originating_bureau: BureauCell;
  receiving_bureau: BureauCell;
  reason: string;
  transferring_officer: string;
  receiving_officer: string;
  requested_at: string;
  accepted_at?: string;
  transfer_status: TransferStatus;
  remarks: string;
}

export interface EscalationRecord {
  escalation_id: string;
  case_id: string;
  case_subject: string;
  institution_id: string;
  institution_name: string;
  reason: string;
  escalation_level: 'Level 1 — Bureau Head' | 'Level 2 — Competent Authority / Senior Management';
  responsible_authority: string;
  bureau: BureauCell;
  timestamp: string;
  required_next_action: string;
  status: 'Awaiting Action' | 'Acknowledged' | 'Resolved';
}

export interface AlertRecord {
  alert_id: string;
  title?: string;
  alert_type: AlertType;
  case_ids: string[];
  institution_id: string;
  institution_name: string;
  aicte_permanent_id: string;
  region?: RegionName;
  bureaus: BureauCell[];
  severity: 'Critical' | 'High' | 'Medium' | 'Low';
  reason: string;
  recommended_action: string;
  created_at: string;
  due_at: string;
  assigned_to: string;
  is_read?: boolean;
  lifecycle_status?: AlertLifecycleStatus;
  deduplication_key?: string;
  acknowledged_by?: string;
  resolved_by?: string;
  resolved_at?: string;
  resolution_reason?: string;
  acknowledgement_status: 'Unacknowledged' | 'Acknowledged';
  resolution_status: 'Open' | 'Resolved' | 'Dismissed';
  dismiss_reason?: string;
}

export interface RoutingRule {
  id: string;
  category: string;
  defaultDepartment: BureauCell;
  defaultPriority: Priority;
  slaHours: number;
  keywords: string[];
  description: string;
}

export interface SlaConfig {
  dueSoonDaysThreshold: number;
  defaultDisposalDays: number;
  enableExactPidPriority: boolean;
  enableCrossBureauAlerts: boolean;
  similarityReviewThreshold: number;
}

export interface ModelEvaluationMetric {
  evaluation_id: string;
  model_version: string;
  evaluation_dataset_reference: string;
  evaluated_at: string;
  task_name: string;
  precision: number;
  recall: number;
  f1_score: number;
  false_positives: number;
  false_negatives: number;
  sample_count: number;
  notes: string;
}
