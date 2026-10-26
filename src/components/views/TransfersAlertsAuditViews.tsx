import React, { useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  History,
  Search,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';

export const TransfersAndEscalationsView: React.FC = () => {
  const {
    transfers,
    escalations,
    roleProfile,
    respondToTransfer,
    resolveEscalation,
    openCaseDetail,
    openInstitutionProfile,
  } = useCaseSync();

  const [transferRemarks, setTransferRemarks] = useState<Record<string, string>>({});
  const [escalationRemarks, setEscalationRemarks] = useState<Record<string, string>>(
    {}
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
          <ArrowRightLeft className="w-3.5 h-3.5" />
          Explicit Handoff Tracking • Escalation Governance
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          Transfers & Escalations
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Track inter-Bureau case handoffs from Transfer Requested to Accepted/Returned, and monitor senior authority escalations.
        </p>
      </div>

      {/* Inter-Bureau Transfers Section */}
      <div className="neu-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ArrowRightLeft className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Inter-Bureau Case Transfers ({transfers.length})
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            No silent ownership changes — receiving Bureau must accept handoff
          </span>
        </div>

        <div className="space-y-3">
          {transfers.map((trf) => {
            const isPending =
              trf.transfer_status === 'Awaiting Acceptance' ||
              trf.transfer_status === 'Transfer Requested';

            return (
              <div
                key={trf.transfer_id}
                className="neu-inset rounded-xl p-4 space-y-3 text-xs"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono font-bold text-[var(--accent-blue)]">
                      {trf.transfer_id}
                    </span>
                    <button
                      onClick={() => openCaseDetail(trf.case_id)}
                      className="font-mono font-bold underline text-[var(--text-primary)] hover:text-[var(--accent-blue)]"
                    >
                      {trf.case_id}
                    </button>
                    <span
                      className={`px-2.5 py-0.5 rounded-md font-semibold ${
                        trf.transfer_status === 'Accepted'
                          ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]'
                          : trf.transfer_status ===
                              'Rejected / Returned for Clarification'
                            ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                            : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                      }`}
                    >
                      {trf.transfer_status}
                    </span>
                  </div>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    Requested:{' '}
                    {new Date(trf.requested_at).toLocaleString('en-IN', {
                      day: '2-digit',
                      month: 'short',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>

                <div>
                  <div className="font-bold text-sm text-[var(--text-primary)]">
                    {trf.case_subject}
                  </div>
                  <button
                    onClick={() => openInstitutionProfile(trf.institution_id)}
                    className="text-[var(--accent-blue)] font-semibold hover:underline inline-flex items-center gap-1 mt-0.5"
                  >
                    <Building2 className="w-3 h-3" />
                    {trf.institution_name}
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Originating Bureau
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {trf.originating_bureau}
                    </span>
                    <span className="block text-[11px] text-[var(--text-secondary)]">
                      By: {trf.transferring_officer}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Receiving Bureau
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {trf.receiving_bureau}
                    </span>
                    <span className="block text-[11px] text-[var(--text-secondary)]">
                      To: {trf.receiving_officer}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Transfer Reason & Remarks
                    </span>
                    <span className="text-[var(--text-primary)]">{trf.reason}</span>
                    <span className="block text-[11px] text-[var(--text-muted)]">
                      {trf.remarks}
                    </span>
                  </div>
                </div>

                {isPending && roleProfile.canProcessTransfers && (
                  <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <input
                      type="text"
                      value={transferRemarks[trf.transfer_id] || ''}
                      onChange={(e) =>
                        setTransferRemarks((prev) => ({
                          ...prev,
                          [trf.transfer_id]: e.target.value,
                        }))
                      }
                      placeholder="Add handoff acceptance or return clarification remark..."
                      className="neu-card flex-1 px-3 py-2 rounded-xl text-xs"
                    />
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() =>
                          respondToTransfer(
                            trf.transfer_id,
                            'Accepted',
                            transferRemarks[trf.transfer_id] ||
                              'Handoff accepted by receiving Bureau.'
                          )
                        }
                        className="neu-btn-primary px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Accept Handoff
                      </button>
                      <button
                        onClick={() =>
                          respondToTransfer(
                            trf.transfer_id,
                            'Rejected / Returned for Clarification',
                            transferRemarks[trf.transfer_id] ||
                              'Returned to originating Bureau for clarification.'
                          )
                        }
                        className="neu-btn-secondary px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1 text-[var(--status-critical)]"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        Return for Clarification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Escalations Section */}
      <div className="neu-card rounded-2xl p-5 sm:p-6 space-y-4">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-[var(--status-critical)]" />
          <h2 className="text-base font-bold text-[var(--text-primary)]">
            Senior Authority Escalations ({escalations.length})
          </h2>
        </div>

        <div className="space-y-3">
          {escalations.map((esc) => (
            <div
              key={esc.escalation_id}
              className="neu-inset rounded-xl p-4 space-y-3 text-xs"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono font-bold text-[var(--status-critical)]">
                    {esc.escalation_id}
                  </span>
                  <button
                    onClick={() => openCaseDetail(esc.case_id)}
                    className="font-mono font-bold underline text-[var(--text-primary)]"
                  >
                    {esc.case_id}
                  </button>
                  <span className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] font-semibold">
                    {esc.escalation_level}
                  </span>
                  <span
                    className={`px-2.5 py-0.5 rounded-md font-semibold ${
                      esc.status === 'Resolved'
                        ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]'
                        : 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                    }`}
                  >
                    {esc.status}
                  </span>
                </div>
                <span className="font-mono text-[11px] text-[var(--text-muted)]">
                  {new Date(esc.timestamp).toLocaleString('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </div>

              <div>
                <div className="font-bold text-sm text-[var(--text-primary)]">
                  {esc.case_subject}
                </div>
                <div className="text-[var(--text-secondary)] mt-0.5">
                  Institution: <strong>{esc.institution_name}</strong> • Authority:{' '}
                  <strong>{esc.responsible_authority}</strong> ({esc.bureau})
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-[var(--border-subtle)]">
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                    Escalation Reason
                  </span>
                  <span className="text-[var(--text-primary)]">{esc.reason}</span>
                </div>
                <div>
                  <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                    Required Next Action
                  </span>
                  <span className="font-semibold text-[var(--text-primary)]">
                    {esc.required_next_action}
                  </span>
                </div>
              </div>

              {esc.status !== 'Resolved' && roleProfile.canProcessTransfers && (
                <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                  <input
                    type="text"
                    value={escalationRemarks[esc.escalation_id] || ''}
                    onChange={(e) =>
                      setEscalationRemarks((prev) => ({
                        ...prev,
                        [esc.escalation_id]: e.target.value,
                      }))
                    }
                    placeholder="Enter authority directive or resolution remark..."
                    className="neu-card flex-1 px-3 py-2 rounded-xl text-xs"
                  />
                  <button
                    onClick={() =>
                      resolveEscalation(
                        esc.escalation_id,
                        escalationRemarks[esc.escalation_id] ||
                          'Senior authority directive issued and recorded.'
                      )
                    }
                    className="neu-btn-primary px-4 py-2 rounded-xl font-semibold"
                  >
                    Record Directive & Resolve Escalation
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export const AlertsAndNotificationsView: React.FC = () => {
  const {
    alerts,
    updateAlertItem,
    openCaseDetail,
    openInstitutionProfile,
    setActiveScreen,
  } = useCaseSync();

  const [severityFilter, setSeverityFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('Open');
  const [typeFilter, setTypeFilter] = useState('ALL');

  const uniqueTypes = useMemo(
    () => Array.from(new Set(alerts.map((a) => a.alert_type))),
    [alerts]
  );

  const filteredAlerts = alerts.filter((a) => {
    if (severityFilter !== 'ALL' && a.severity !== severityFilter) return false;
    if (statusFilter !== 'ALL' && a.resolution_status !== statusFilter)
      return false;
    if (typeFilter !== 'ALL' && a.alert_type !== typeFilter) return false;
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <Bell className="w-3.5 h-3.5" />
            SLA & Cross-Bureau Alert Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Alerts, Deadlines & SLA Monitoring
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor potential overlapping cases, approaching disposal deadlines, unverified PIDs, and pending transfer acceptances.
          </p>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="neu-card rounded-2xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
        <div>
          <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
            Resolution Status
          </label>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
          >
            <option value="ALL">All Alert States</option>
            <option value="Open">Open (Active)</option>
            <option value="Resolved">Resolved</option>
            <option value="Dismissed">Dismissed</option>
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
            Severity
          </label>
          <select
            value={severityFilter}
            onChange={(e) => setSeverityFilter(e.target.value)}
            className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
          >
            <option value="ALL">All Severities</option>
            <option value="Critical">Critical</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
          </select>
        </div>

        <div>
          <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
            Alert Category
          </label>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
          >
            <option value="ALL">All Alert Types</option>
            {uniqueTypes.map((t) => (
              <option key={t} value={t}>
                {t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Alert Cards */}
      <div className="space-y-3">
        {filteredAlerts.map((alert) => (
          <div
            key={alert.alert_id}
            className="neu-card rounded-2xl p-5 space-y-3 text-xs"
          >
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex flex-wrap items-center gap-2">
                <span className="font-mono font-bold text-[var(--accent-blue)]">
                  {alert.alert_id}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-md font-bold ${
                    alert.severity === 'Critical'
                      ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                      : alert.severity === 'High'
                        ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                        : 'bg-[var(--accent-blue)]/15 text-[var(--accent-blue)]'
                  }`}
                >
                  {alert.severity}
                </span>
                <span className="font-bold text-sm text-[var(--text-primary)]">
                  {alert.alert_type}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                  {alert.acknowledgement_status} • {alert.resolution_status}
                </span>
              </div>

              <span className="font-mono text-[11px] text-[var(--text-muted)]">
                Due: {alert.due_at}
              </span>
            </div>

            <p className="text-[var(--text-secondary)] leading-relaxed">
              {alert.reason}
            </p>

            <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[var(--border-subtle)]">
              <div className="flex flex-wrap items-center gap-3">
                <button
                  onClick={() => openInstitutionProfile(alert.institution_id)}
                  className="font-semibold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1"
                >
                  <Building2 className="w-3.5 h-3.5" />
                  {alert.institution_name} ({alert.aicte_permanent_id})
                </button>
                <div className="flex items-center gap-1.5">
                  {alert.case_ids.map((cid) => (
                    <button
                      key={cid}
                      onClick={() => openCaseDetail(cid)}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono font-bold text-[var(--accent-blue)] hover:underline"
                    >
                      {cid}
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {alert.alert_type === 'Potential Overlapping Cases' && (
                  <button
                    onClick={() => setActiveScreen('overlaps')}
                    className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold text-[var(--accent-blue)]"
                  >
                    Review Overlap
                  </button>
                )}
                {alert.acknowledgement_status === 'Unacknowledged' && (
                  <button
                    onClick={() => updateAlertItem(alert.alert_id, 'acknowledge')}
                    className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold"
                  >
                    Acknowledge
                  </button>
                )}
                {alert.resolution_status === 'Open' && (
                  <>
                    <button
                      onClick={() => updateAlertItem(alert.alert_id, 'resolve')}
                      className="neu-btn-primary px-3 py-1.5 rounded-lg font-semibold"
                    >
                      Mark Resolved
                    </button>
                    <button
                      onClick={() =>
                        updateAlertItem(
                          alert.alert_id,
                          'dismiss',
                          'Reviewed and dismissed by officer.'
                        )
                      }
                      className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold text-[var(--text-muted)]"
                    >
                      Dismiss
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export const AuditTrailView: React.FC = () => {
  const { cases, openCaseDetail, openInstitutionProfile } = useCaseSync();
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState('ALL');

  const allEvents = useMemo(() => {
    const flat = cases.flatMap((c) =>
      c.timeline.map((evt) => ({
        ...evt,
        institutionName: c.institutionName,
        aicte_permanent_id: c.aicte_permanent_id,
      }))
    );
    return flat.sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [cases]);

  const uniqueActionTypes = useMemo(
    () => Array.from(new Set(allEvents.map((e) => e.action_type))),
    [allEvents]
  );

  const filteredEvents = allEvents.filter((evt) => {
    if (actionFilter !== 'ALL' && evt.action_type !== actionFilter) return false;
    const q = searchQuery.trim().toLowerCase();
    if (!q) return true;
    return (
      evt.case_id.toLowerCase().includes(q) ||
      evt.institutionName.toLowerCase().includes(q) ||
      evt.actor.toLowerCase().includes(q) ||
      evt.bureau.toLowerCase().includes(q) ||
      evt.remarks.toLowerCase().includes(q)
    );
  });

  return (
    <div className="space-y-6">
      <div>
        <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
          <History className="w-3.5 h-3.5" />
          Chronological Accountability Ledger
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
          System-Wide Audit Trail
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Complete immutable record of complaint receipts, overlap review decisions, inter-Bureau coordination remarks, transfers, and disposals.
        </p>
      </div>

      <div className="neu-card rounded-2xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter audit trail by Case ID, Institution, Officer, Bureau, or Remark..."
            className="neu-inset w-full pl-10 pr-4 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
          />
        </div>
        <select
          value={actionFilter}
          onChange={(e) => setActionFilter(e.target.value)}
          className="neu-inset px-3.5 py-2.5 rounded-xl text-xs font-semibold"
        >
          <option value="ALL">All Action Types ({allEvents.length})</option>
          {uniqueActionTypes.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>

      <div className="neu-card rounded-2xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                <th className="py-3.5 px-4">Timestamp (Illustrative)</th>
                <th className="py-3.5 px-4">Action Type</th>
                <th className="py-3.5 px-4">Case & Institution</th>
                <th className="py-3.5 px-4">Actor & Bureau</th>
                <th className="py-3.5 px-4">Official Remarks & Transition</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {filteredEvents.map((evt) => (
                <tr
                  key={evt.action_id}
                  className="hover:bg-[var(--bg-elevated)] transition-colors"
                >
                  <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-muted)] whitespace-nowrap align-top">
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-[var(--accent-blue)]" />
                      {new Date(evt.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top whitespace-nowrap">
                    <span className="font-bold text-[var(--accent-blue)]">
                      {evt.action_type}
                    </span>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <button
                      onClick={() => openCaseDetail(evt.case_id)}
                      className="font-mono font-bold text-[var(--text-primary)] hover:text-[var(--accent-blue)] underline block"
                    >
                      {evt.case_id}
                    </button>
                    <button
                      onClick={() => openInstitutionProfile(evt.institution_id)}
                      className="text-[11px] text-[var(--text-secondary)] hover:underline text-left"
                    >
                      {evt.institutionName} ({evt.aicte_permanent_id})
                    </button>
                  </td>
                  <td className="py-3.5 px-4 align-top">
                    <div className="font-semibold text-[var(--text-primary)]">
                      {evt.actor}
                    </div>
                    <div className="text-[11px] text-[var(--text-muted)]">
                      {evt.actor_role} • {evt.bureau}
                    </div>
                  </td>
                  <td className="py-3.5 px-4 align-top max-w-md">
                    <p className="text-[var(--text-primary)]">{evt.remarks}</p>
                    {evt.previous_value && evt.new_value && (
                      <div className="text-[11px] font-mono text-[var(--text-muted)] mt-0.5">
                        {evt.previous_value} → {evt.new_value}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
