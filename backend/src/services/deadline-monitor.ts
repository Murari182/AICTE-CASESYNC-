import {
  AlertRecord,
  CaseRecord,
  CaseRelation,
  EscalationRecord,
  InstitutionRecord,
  SlaConfig,
  TransferRecord,
} from '../../../src/types/casesync';
import { computeDeadlineState } from '../../../src/data/seedData';

/**
 * Idempotent SLA Deadline & Cross-Bureau Alert Synchronization Service.
 * Recalculates overdue/approaching-deadline alerts, overlap alerts, transfer handoff alerts,
 * and escalation alerts without creating duplicate records.
 */
export function synchronizeOperationalAlerts(params: {
  cases: CaseRecord[];
  relations: CaseRelation[];
  transfers: TransferRecord[];
  escalations: EscalationRecord[];
  institutions: InstitutionRecord[];
  slaConfig: SlaConfig;
  existingAlerts: AlertRecord[];
}): AlertRecord[] {
  const nextAlerts: AlertRecord[] = params.existingAlerts.map((a) => {
    const normalizedLifecycle =
      a.lifecycle_status ||
      (a.resolution_status === 'Resolved'
        ? 'Resolved'
        : a.resolution_status === 'Dismissed'
          ? 'Dismissed'
          : a.acknowledgement_status === 'Acknowledged'
            ? 'Acknowledged'
            : 'Active');
    return {
      ...a,
      lifecycle_status: normalizedLifecycle,
      is_read: a.is_read ?? false,
    };
  });

  const byKey = new Map<string, number>();
  nextAlerts.forEach((a, idx) => {
    if (a.deduplication_key) {
      byKey.set(a.deduplication_key, idx);
    }
  });

  const upsertAlert = (candidate: AlertRecord) => {
    const key = candidate.deduplication_key;
    if (!key) return;
    const existingIdx = byKey.get(key);
    if (existingIdx === undefined) {
      const legacyIdx = nextAlerts.findIndex(
        (existing) =>
          existing.alert_type === candidate.alert_type &&
          existing.case_ids.some((id) => candidate.case_ids.includes(id))
      );
      if (legacyIdx !== -1) {
        byKey.set(key, legacyIdx);
        if (!nextAlerts[legacyIdx].deduplication_key) {
          nextAlerts[legacyIdx] = {
            ...nextAlerts[legacyIdx],
            deduplication_key: key,
            title: nextAlerts[legacyIdx].title || candidate.title,
            region: nextAlerts[legacyIdx].region || candidate.region,
          };
        }
        return;
      }
      nextAlerts.push(candidate);
      byKey.set(key, nextAlerts.length - 1);
    }
  };

  // 1. SLA Deadline Checks
  params.cases.forEach((c) => {
    const dState = computeDeadlineState(c, undefined, params.slaConfig);
    if (c.status === 'Disposed') {
      nextAlerts.forEach((a, idx) => {
        if (
          a.resolution_status === 'Open' &&
          a.case_ids.length === 1 &&
          a.case_ids[0] === c.id &&
          (a.alert_type === 'Overdue Case' ||
            a.alert_type === 'Case Approaching Deadline')
        ) {
          nextAlerts[idx] = {
            ...a,
            acknowledgement_status: 'Acknowledged',
            resolution_status: 'Resolved',
            lifecycle_status: 'Resolved',
            resolved_at: new Date().toISOString(),
            resolution_reason: `Automatically resolved upon disposal of ${c.id}.`,
          };
        }
      });
      return;
    }

    if (dState === 'Overdue') {
      upsertAlert({
        alert_id: `ALT-OVD-${c.id.slice(-4)}`,
        title: `Overdue Disposal Deadline — ${c.title}`,
        alert_type: 'Overdue Case',
        case_ids: [c.id],
        institution_id: c.institution_id,
        institution_name: c.institutionName,
        aicte_permanent_id: c.aicte_permanent_id,
        region: c.region,
        bureaus: [c.current_bureau],
        severity: 'Critical',
        reason: `Case ${c.id} has exceeded its expected disposal deadline.`,
        recommended_action: `Expedite Bureau disposal or escalate ${c.id} for senior review.`,
        created_at: c.updatedAt || c.createdAt,
        due_at: c.expected_disposal_at,
        assigned_to: c.assigned_officer,
        is_read: false,
        lifecycle_status: 'Active',
        deduplication_key: `overdue:${c.id}`,
        acknowledgement_status: 'Unacknowledged',
        resolution_status: 'Open',
      });
    } else if (dState === 'Due Soon') {
      upsertAlert({
        alert_id: `ALT-DUE-${c.id.slice(-4)}`,
        title: `Disposal Deadline Approaching — ${c.title}`,
        alert_type: 'Case Approaching Deadline',
        case_ids: [c.id],
        institution_id: c.institution_id,
        institution_name: c.institutionName,
        aicte_permanent_id: c.aicte_permanent_id,
        region: c.region,
        bureaus: [c.current_bureau],
        severity: 'High',
        reason: `Case ${c.id} is within the configured ${params.slaConfig.dueSoonDaysThreshold}-day SLA threshold prior to expected disposal.`,
        recommended_action: `Complete pending Bureau action on ${c.id} before deadline.`,
        created_at: c.updatedAt || c.createdAt,
        due_at: c.expected_disposal_at,
        assigned_to: c.assigned_officer,
        is_read: false,
        lifecycle_status: 'Active',
        deduplication_key: `duesoon:${c.id}`,
        acknowledgement_status: 'Unacknowledged',
        resolution_status: 'Open',
      });
    }
  });

  // 2. Overlap & Identity Verification Alerts
  if (params.slaConfig.enableCrossBureauAlerts) {
    params.relations.forEach((rel) => {
      const inst = params.institutions.find(
        (i) => i.institution_id === rel.institution_id
      );
      if (
        rel.review_status === 'Potential Overlap — Review Required' ||
        rel.review_status === 'Institution Identity Uncertain'
      ) {
        const isIdentity =
          rel.review_status === 'Institution Identity Uncertain';
        upsertAlert({
          alert_id: `ALT-${rel.relation_id}`,
          title: isIdentity
            ? `Institution Identity Verification Required — ${rel.institution_name}`
            : `Potential Cross-Bureau Overlap — ${rel.case_id_a} & ${rel.case_id_b}`,
          alert_type: isIdentity
            ? 'Institution Identity Verification'
            : 'Potential Overlapping Cases',
          case_ids: [rel.case_id_a, rel.case_id_b],
          institution_id: rel.institution_id,
          institution_name: rel.institution_name,
          aicte_permanent_id: rel.aicte_permanent_id,
          region: inst?.region,
          bureaus: Array.from(new Set([rel.bureau_a, rel.bureau_b])),
          severity: isIdentity ? 'High' : 'Critical',
          reason: rel.why_raised || rel.remarks,
          recommended_action: rel.next_required_action,
          created_at: '2026-10-25T10:00:00Z',
          due_at: '2026-10-28T18:00:00Z',
          assigned_to: rel.coordination_owner,
          is_read: false,
          lifecycle_status: 'Active',
          deduplication_key: `rel:${rel.relation_id}`,
          acknowledgement_status: 'Unacknowledged',
          resolution_status: 'Open',
        });
      }
    });
  }

  // 3. Pending Transfer Handoff Alerts
  params.transfers.forEach((trf) => {
    const isPending =
      trf.transfer_status === 'Awaiting Acceptance' ||
      trf.transfer_status === 'Transfer Requested';
    const inst = params.institutions.find(
      (i) => i.institution_id === trf.institution_id
    );
    if (isPending) {
      upsertAlert({
        alert_id: `ALT-${trf.transfer_id}`,
        title: `Transfer ${trf.transfer_id} Awaiting Acceptance by ${trf.receiving_bureau}`,
        alert_type: 'Cases Pending Transfer Acceptance',
        case_ids: [trf.case_id],
        institution_id: trf.institution_id,
        institution_name: trf.institution_name,
        aicte_permanent_id: inst?.aicte_permanent_id || '1-000000000',
        region: inst?.region,
        bureaus: [trf.originating_bureau, trf.receiving_bureau],
        severity: 'High',
        reason: `Transfer ${trf.transfer_id} (${trf.originating_bureau} → ${trf.receiving_bureau}) awaits acceptance.`,
        recommended_action:
          'Accept or return transfer in Transfers & Escalations.',
        created_at: trf.requested_at,
        due_at: '2026-10-29T18:00:00Z',
        assigned_to: trf.receiving_officer,
        is_read: false,
        lifecycle_status: 'Active',
        deduplication_key: `trf:${trf.transfer_id}`,
        acknowledgement_status: 'Unacknowledged',
        resolution_status: 'Open',
      });
    }
  });

  // 4. Escalation Alerts
  params.escalations.forEach((esc) => {
    const inst = params.institutions.find(
      (i) => i.institution_id === esc.institution_id
    );
    if (esc.status !== 'Resolved') {
      upsertAlert({
        alert_id: `ALT-${esc.escalation_id}`,
        title: `${esc.escalation_level} Escalation (${esc.escalation_id}) — ${esc.case_id}`,
        alert_type: 'Escalation Awaiting Action',
        case_ids: [esc.case_id],
        institution_id: esc.institution_id,
        institution_name: esc.institution_name,
        aicte_permanent_id: inst?.aicte_permanent_id || '1-000000000',
        region: inst?.region,
        bureaus: [esc.bureau],
        severity: 'Critical',
        reason: esc.reason,
        recommended_action: esc.required_next_action,
        created_at: esc.timestamp,
        due_at: '2026-10-28T18:00:00Z',
        assigned_to: esc.responsible_authority,
        is_read: false,
        lifecycle_status:
          esc.status === 'Acknowledged' ? 'Acknowledged' : 'Active',
        deduplication_key: `esc:${esc.escalation_id}`,
        acknowledgement_status:
          esc.status === 'Acknowledged' ? 'Acknowledged' : 'Unacknowledged',
        resolution_status: 'Open',
      });
    }
  });

  return nextAlerts;
}
