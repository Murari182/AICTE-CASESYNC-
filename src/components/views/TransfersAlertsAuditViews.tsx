import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
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
import { SubSectionTransition } from '../ui/SharedComponents';

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
    roleProfile,
    hasPermission,
    updateAlertItem,
    markAlertRead,
    markAllAlertsRead,
    assignAlertItem,
    openCaseDetail,
    openInstitutionProfile,
    setActiveScreen,
  } = useCaseSync();

  const [categoryTab, setCategoryTab] = useState<string>('ALL');
  const [severityFilter, setSeverityFilter] = useState<string>('ALL');
  const [bureauFilter, setBureauFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [institutionFilter, setInstitutionFilter] = useState<string>('ALL');
  const [readFilter, setReadFilter] = useState<'ALL' | 'UNREAD' | 'READ'>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('Open');
  const [dateFrom, setDateFrom] = useState<string>('');
  const [dateTo, setDateTo] = useState<string>('');
  const [searchQuery, setSearchQuery] = useState<string>('');

  // State for inline Assign Officer & Dismiss Reason drawers per alert card
  const [activeActionAlertId, setActiveActionAlertId] = useState<string | null>(
    null
  );
  const [activeActionMode, setActiveActionMode] = useState<
    'assign' | 'resolve' | 'dismiss' | null
  >(null);
  const [assigneeInput, setAssigneeInput] = useState<string>('');
  const [reasonInput, setReasonInput] = useState<string>('');

  const canModifyAlerts = hasPermission('update_case_status');

  // 5 Summary KPI Metrics calculated from live visible alerts
  const summaryStats = useMemo(() => {
    const openAlerts = alerts.filter((a) => a.resolution_status === 'Open');
    const activeCount = openAlerts.length;
    const criticalCount = openAlerts.filter(
      (a) => a.severity === 'Critical'
    ).length;
    const overdueCount = openAlerts.filter(
      (a) => a.alert_type === 'Overdue Case'
    ).length;
    const overlapCount = openAlerts.filter(
      (a) =>
        a.alert_type === 'Potential Overlapping Cases' ||
        a.alert_type === 'Institution Identity Verification'
    ).length;
    const pendingCoordCount = openAlerts.filter(
      (a) =>
        a.alert_type === 'Cases Awaiting Bureau Coordination' ||
        a.alert_type === 'Cases Pending Transfer Acceptance'
    ).length;
    const unreadCount = alerts.filter(
      (a) => !a.is_read && a.resolution_status !== 'Dismissed'
    ).length;

    return {
      activeCount,
      criticalCount,
      overdueCount,
      overlapCount,
      pendingCoordCount,
      unreadCount,
    };
  }, [alerts]);

  const categoryTabs = useMemo(
    () => [
      { id: 'ALL', label: 'All Alerts', count: alerts.length },
      {
        id: 'Potential Overlaps',
        label: 'Potential Overlaps',
        count: alerts.filter(
          (a) => a.alert_type === 'Potential Overlapping Cases'
        ).length,
      },
      {
        id: 'Deadline Approaching',
        label: 'Deadline Approaching',
        count: alerts.filter(
          (a) => a.alert_type === 'Case Approaching Deadline'
        ).length,
      },
      {
        id: 'Overdue Cases',
        label: 'Overdue Cases',
        count: alerts.filter((a) => a.alert_type === 'Overdue Case').length,
      },
      {
        id: 'Bureau Coordination',
        label: 'Bureau Coordination',
        count: alerts.filter(
          (a) => a.alert_type === 'Cases Awaiting Bureau Coordination'
        ).length,
      },
      {
        id: 'Transfer Acceptance',
        label: 'Transfer Acceptance',
        count: alerts.filter(
          (a) => a.alert_type === 'Cases Pending Transfer Acceptance'
        ).length,
      },
      {
        id: 'Escalations',
        label: 'Escalations',
        count: alerts.filter(
          (a) =>
            a.alert_type === 'Escalation Awaiting Action' ||
            a.alert_type === 'Cases Requiring Senior Review'
        ).length,
      },
      {
        id: 'Institution Verification',
        label: 'Institution Verification',
        count: alerts.filter(
          (a) => a.alert_type === 'Institution Identity Verification'
        ).length,
      },
    ],
    [alerts]
  );

  const uniqueBureaus = useMemo(
    () => Array.from(new Set(alerts.flatMap((a) => a.bureaus))),
    [alerts]
  );

  const uniqueRegions = useMemo(
    () =>
      Array.from(
        new Set(alerts.map((a) => a.region).filter(Boolean) as string[])
      ),
    [alerts]
  );

  const uniqueInstitutions = useMemo(() => {
    const map = new Map<string, string>();
    alerts.forEach((a) => {
      if (!map.has(a.institution_id)) {
        map.set(a.institution_id, a.institution_name);
      }
    });
    return Array.from(map.entries());
  }, [alerts]);

  const filteredAlerts = useMemo(() => {
    return alerts.filter((a) => {
      // Category tab filter
      if (categoryTab === 'Potential Overlaps') {
        if (a.alert_type !== 'Potential Overlapping Cases') return false;
      } else if (categoryTab === 'Deadline Approaching') {
        if (a.alert_type !== 'Case Approaching Deadline') return false;
      } else if (categoryTab === 'Overdue Cases') {
        if (a.alert_type !== 'Overdue Case') return false;
      } else if (categoryTab === 'Bureau Coordination') {
        if (a.alert_type !== 'Cases Awaiting Bureau Coordination') return false;
      } else if (categoryTab === 'Transfer Acceptance') {
        if (a.alert_type !== 'Cases Pending Transfer Acceptance') return false;
      } else if (categoryTab === 'Escalations') {
        if (
          a.alert_type !== 'Escalation Awaiting Action' &&
          a.alert_type !== 'Cases Requiring Senior Review'
        )
          return false;
      } else if (categoryTab === 'Institution Verification') {
        if (a.alert_type !== 'Institution Identity Verification') return false;
      }

      if (severityFilter !== 'ALL' && a.severity !== severityFilter) {
        return false;
      }

      if (bureauFilter !== 'ALL' && !a.bureaus.includes(bureauFilter as any)) {
        return false;
      }

      if (regionFilter !== 'ALL' && a.region !== regionFilter) {
        return false;
      }

      if (
        institutionFilter !== 'ALL' &&
        a.institution_id !== institutionFilter
      ) {
        return false;
      }

      if (readFilter === 'UNREAD' && a.is_read) return false;
      if (readFilter === 'READ' && !a.is_read) return false;

      const lifecycle =
        a.lifecycle_status ||
        (a.resolution_status === 'Resolved'
          ? 'Resolved'
          : a.resolution_status === 'Dismissed'
            ? 'Dismissed'
            : a.acknowledgement_status === 'Acknowledged'
              ? 'Acknowledged'
              : 'Active');

      if (statusFilter === 'Open') {
        if (a.resolution_status !== 'Open') return false;
      } else if (
        statusFilter === 'Active' ||
        statusFilter === 'Acknowledged' ||
        statusFilter === 'Assigned'
      ) {
        if (lifecycle !== statusFilter) return false;
      } else if (
        statusFilter === 'Resolved' ||
        statusFilter === 'Dismissed'
      ) {
        if (a.resolution_status !== statusFilter) return false;
      }

      if (dateFrom) {
        const createdMs = new Date(a.created_at).getTime();
        const fromMs = new Date(`${dateFrom}T00:00:00Z`).getTime();
        if (!Number.isNaN(fromMs) && createdMs < fromMs) return false;
      }

      if (dateTo) {
        const createdMs = new Date(a.created_at).getTime();
        const toMs = new Date(`${dateTo}T23:59:59Z`).getTime();
        if (!Number.isNaN(toMs) && createdMs > toMs) return false;
      }

      const q = searchQuery.trim().toLowerCase();
      if (q) {
        const matchesText =
          a.alert_id.toLowerCase().includes(q) ||
          (a.title && a.title.toLowerCase().includes(q)) ||
          a.reason.toLowerCase().includes(q) ||
          a.institution_name.toLowerCase().includes(q) ||
          a.aicte_permanent_id.toLowerCase().includes(q) ||
          a.case_ids.some((cid) => cid.toLowerCase().includes(q)) ||
          a.assigned_to.toLowerCase().includes(q);
        if (!matchesText) return false;
      }

      return true;
    });
  }, [
    alerts,
    categoryTab,
    severityFilter,
    bureauFilter,
    regionFilter,
    institutionFilter,
    readFilter,
    statusFilter,
    dateFrom,
    dateTo,
    searchQuery,
  ]);

  const resetAllFilters = () => {
    setCategoryTab('ALL');
    setSeverityFilter('ALL');
    setBureauFilter('ALL');
    setRegionFilter('ALL');
    setInstitutionFilter('ALL');
    setReadFilter('ALL');
    setStatusFilter('ALL');
    setDateFrom('');
    setDateTo('');
    setSearchQuery('');
  };

  const openActionPanel = (
    alertId: string,
    mode: 'assign' | 'resolve' | 'dismiss',
    currentAssignee?: string
  ) => {
    setActiveActionAlertId(alertId);
    setActiveActionMode(mode);
    setAssigneeInput(currentAssignee || roleProfile.displayName);
    setReasonInput('');
  };

  const closeActionPanel = () => {
    setActiveActionAlertId(null);
    setActiveActionMode(null);
    setAssigneeInput('');
    setReasonInput('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <Bell className="w-3.5 h-3.5" />
            SLA & Cross-Bureau Alert Center • Real-Time Lifecycle Sync
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Alerts, Deadlines & SLA Monitoring
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Monitor potential overlapping cases, approaching disposal deadlines, unverified PIDs, and pending transfer acceptances across AICTE Bureaus.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {summaryStats.unreadCount > 0 && (
            <button
              onClick={markAllAlertsRead}
              className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              title="Mark all notifications as read without resolving underlying alerts"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              Mark All Notifications Read ({summaryStats.unreadCount})
            </button>
          )}
          <button
            onClick={resetAllFilters}
            className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer"
          >
            Show All Alert History
          </button>
        </div>
      </div>

      {/* 5 Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
        <button
          onClick={() => {
            setStatusFilter('Open');
            setCategoryTab('ALL');
            setSeverityFilter('ALL');
          }}
          className="neu-card rounded-2xl p-4 text-left flex flex-col justify-between gap-2 hover:border-[#3478F6] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Active Alerts
            </span>
            <Bell className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[var(--text-primary)]">
            {summaryStats.activeCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            {summaryStats.unreadCount} unread notifications
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('Open');
            setSeverityFilter('Critical');
            setCategoryTab('ALL');
          }}
          className="neu-card rounded-2xl p-4 text-left flex flex-col justify-between gap-2 hover:border-[var(--status-critical)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Critical Alerts
            </span>
            <ShieldAlert className="w-4 h-4 text-[var(--status-critical)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[var(--status-critical)]">
            {summaryStats.criticalCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Immediate Bureau attention
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('Open');
            setCategoryTab('Overdue Cases');
            setSeverityFilter('ALL');
          }}
          className="neu-card rounded-2xl p-4 text-left flex flex-col justify-between gap-2 hover:border-[var(--status-critical)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Overdue Cases
            </span>
            <Clock className="w-4 h-4 text-[var(--status-critical)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[var(--text-primary)]">
            {summaryStats.overdueCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Exceeded disposal SLA date
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('Open');
            setCategoryTab('Potential Overlaps');
            setSeverityFilter('ALL');
          }}
          className="neu-card rounded-2xl p-4 text-left flex flex-col justify-between gap-2 hover:border-[var(--status-warning)] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Overlap Alerts
            </span>
            <AlertTriangle className="w-4 h-4 text-[var(--status-warning)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[var(--text-primary)]">
            {summaryStats.overlapCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Cross-Bureau & PID checks
          </div>
        </button>

        <button
          onClick={() => {
            setStatusFilter('Open');
            setCategoryTab('Bureau Coordination');
            setSeverityFilter('ALL');
          }}
          className="neu-card rounded-2xl p-4 text-left flex flex-col justify-between gap-2 hover:border-[#3478F6] transition-colors cursor-pointer"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Pending Coordination
            </span>
            <ArrowRightLeft className="w-4 h-4 text-[var(--accent-blue)]" />
          </div>
          <div className="text-2xl font-extrabold font-mono-tabular text-[var(--text-primary)]">
            {summaryStats.pendingCoordCount}
          </div>
          <div className="text-[11px] text-[var(--text-secondary)]">
            Coordination & transfer handoffs
          </div>
        </button>
      </div>

      {/* Category Filter Tabs with Smooth Sliding Pill Indicator */}
      <div className="neu-card rounded-2xl p-2 flex items-center gap-1.5 overflow-x-auto">
        {categoryTabs.map((tab) => {
          const isActive = categoryTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setCategoryTab(tab.id)}
              className={`relative px-3 py-2 rounded-xl text-xs font-semibold whitespace-nowrap inline-flex items-center gap-1.5 transition-colors duration-200 cursor-pointer ${
                isActive
                  ? 'text-white'
                  : 'text-[var(--text-secondary)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-elevated)]'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="alerts-category-tab-pill"
                  transition={{
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-xl neu-btn-primary shadow-xs"
                />
              )}
              <span className="relative z-10 inline-flex items-center gap-1.5">
                <span>{tab.label}</span>
                <span
                  className={`px-1.5 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold ${
                    isActive
                      ? 'bg-white/20 text-white'
                      : 'bg-[var(--bg-inset)] text-[var(--text-primary)]'
                  }`}
                >
                  {tab.count}
                </span>
              </span>
            </button>
          );
        })}
      </div>

      {/* Multi-Facet Filter Controls */}
      <div className="neu-card rounded-2xl p-4 space-y-3 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="lg:col-span-2">
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Search Alert ID, Case ID, Institution, or Officer
            </label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-[var(--text-muted)] absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by CMP-2026-..., AICTE PID, institution, or reason..."
                className="neu-inset w-full pl-9 pr-3 py-2 rounded-xl font-medium focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Alert Lifecycle Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Lifecycle States</option>
              <option value="Open">Unresolved (Active / Ack / Assigned)</option>
              <option value="Active">Active (Unacknowledged)</option>
              <option value="Acknowledged">Acknowledged</option>
              <option value="Assigned">Assigned</option>
              <option value="Resolved">Resolved</option>
              <option value="Dismissed">Dismissed</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Notification Read State
            </label>
            <select
              value={readFilter}
              onChange={(e) =>
                setReadFilter(e.target.value as 'ALL' | 'UNREAD' | 'READ')
              }
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All (Read & Unread)</option>
              <option value="UNREAD">Unread Notifications Only</option>
              <option value="READ">Read Notifications Only</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 pt-2 border-t border-[var(--border-subtle)]">
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
              <option value="Low">Low</option>
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Bureau / Cell
            </label>
            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Bureaus & Cells</option>
              {uniqueBureaus.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
              Institution
            </label>
            <select
              value={institutionFilter}
              onChange={(e) => setInstitutionFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Institutions</option>
              {uniqueInstitutions.map(([id, name]) => (
                <option key={id} value={id}>
                  {name}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
                From Date
              </label>
              <input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="neu-inset w-full px-2 py-2 rounded-xl font-mono-tabular text-[11px]"
              />
            </div>
            <div>
              <label className="block font-bold uppercase text-[10px] text-[var(--text-muted)] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="neu-inset w-full px-2 py-2 rounded-xl font-mono-tabular text-[11px]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Alert Cards with Sub-Category Sliding Transition */}
      <SubSectionTransition transitionKey={categoryTab}>
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="neu-card rounded-2xl p-8 text-center space-y-2">
            <div className="text-sm font-bold text-[var(--text-primary)]">
              No operational alerts match the selected filters
            </div>
            <p className="text-xs text-[var(--text-secondary)]">
              Try clearing the active filter criteria or switching the Lifecycle Status filter to All Lifecycle States.
            </p>
            <button
              onClick={resetAllFilters}
              className="neu-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold mt-2 cursor-pointer"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          filteredAlerts.map((alert) => {
            const isUnread = !alert.is_read;
            const lifecycle =
              alert.lifecycle_status ||
              (alert.resolution_status === 'Resolved'
                ? 'Resolved'
                : alert.resolution_status === 'Dismissed'
                  ? 'Dismissed'
                  : alert.acknowledgement_status === 'Acknowledged'
                    ? 'Acknowledged'
                    : 'Active');
            const isDrawerOpen = activeActionAlertId === alert.alert_id;

            return (
              <div
                key={alert.alert_id}
                className={`neu-card rounded-2xl p-5 space-y-3.5 text-xs transition-colors ${
                  isUnread && alert.resolution_status === 'Open'
                    ? 'border-l-4 border-l-[#3478F6]'
                    : ''
                }`}
              >
                {/* Top Metadata Row */}
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    <button
                      onClick={() => markAlertRead(alert.alert_id, !alert.is_read)}
                      className={`px-2 py-0.5 rounded-md font-bold text-[10px] inline-flex items-center gap-1 cursor-pointer border ${
                        isUnread
                          ? 'bg-[#3478F6]/12 text-[#3478F6] border-[#3478F6]/30'
                          : 'bg-[var(--bg-elevated)] text-[var(--text-muted)] border-[var(--border-subtle)]'
                      }`}
                      title="Toggle notification read/unread status (independent of alert resolution)"
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          isUnread ? 'bg-[#3478F6]' : 'bg-[var(--text-muted)]'
                        }`}
                      />
                      {isUnread ? 'Unread' : 'Read'}
                    </button>

                    <span className="font-mono-tabular font-bold text-[var(--accent-blue)]">
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

                    <span className="px-2.5 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-semibold text-[var(--text-primary)]">
                      {alert.alert_type}
                    </span>

                    <span
                      className={`px-2.5 py-0.5 rounded-md font-bold ${
                        lifecycle === 'Resolved'
                          ? 'bg-[var(--status-success)]/15 text-[var(--status-success)]'
                          : lifecycle === 'Dismissed'
                            ? 'bg-[var(--bg-inset)] text-[var(--text-muted)]'
                            : lifecycle === 'Acknowledged' ||
                                lifecycle === 'Assigned'
                              ? 'bg-[#3478F6]/15 text-[var(--accent-blue)]'
                              : 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                      }`}
                    >
                      Lifecycle: {lifecycle}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-[11px] text-[var(--text-muted)]">
                    <span>
                      Created:{' '}
                      {new Date(alert.created_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span>•</span>
                    <span>
                      Due:{' '}
                      {new Date(alert.due_at).toLocaleDateString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                  </div>
                </div>

                {/* Title & Detailed Reason */}
                <div>
                  <h3 className="font-bold text-sm text-[var(--text-primary)]">
                    {alert.title || `${alert.alert_type} — ${alert.institution_name}`}
                  </h3>
                  <p className="text-[var(--text-secondary)] leading-relaxed mt-1">
                    {alert.reason}
                  </p>
                </div>

                {/* Operational Details Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border-subtle)]">
                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Affected Institution & Region
                    </span>
                    <button
                      onClick={() => openInstitutionProfile(alert.institution_id)}
                      className="font-bold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1 mt-0.5 text-left cursor-pointer"
                    >
                      <Building2 className="w-3.5 h-3.5 shrink-0" />
                      <span>{alert.institution_name}</span>
                    </button>
                    <span className="block font-mono-tabular text-[11px] text-[var(--text-muted)]">
                      PID: {alert.aicte_permanent_id}
                      {alert.region ? ` • ${alert.region}` : ''}
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Bureaus Involved & Assigned Officer
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">
                      {alert.bureaus.join(' + ')}
                    </span>
                    <span className="block text-[11px] text-[var(--text-secondary)]">
                      Assigned: <strong>{alert.assigned_to}</strong>
                    </span>
                  </div>

                  <div>
                    <span className="text-[10px] font-bold uppercase text-[var(--text-muted)] block">
                      Recommended Next Action
                    </span>
                    <span className="font-semibold text-[var(--text-primary)] block mt-0.5">
                      {alert.recommended_action}
                    </span>
                    {(alert.resolution_reason || alert.dismiss_reason) && (
                      <span className="block text-[11px] text-[var(--status-success)] mt-0.5">
                        Audit Note: {alert.resolution_reason || alert.dismiss_reason}
                      </span>
                    )}
                  </div>
                </div>

                {/* Inline Action Drawer for Assign / Resolve / Dismiss */}
                {isDrawerOpen && activeActionMode && (
                  <div className="neu-inset rounded-xl p-3.5 space-y-2.5 border border-[#3478F6]/30">
                    {activeActionMode === 'assign' && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={assigneeInput}
                          onChange={(e) => setAssigneeInput(e.target.value)}
                          placeholder="Enter officer name and Bureau designation..."
                          className="neu-card flex-1 px-3 py-2 rounded-xl text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (assignAlertItem(alert.alert_id, assigneeInput)) {
                                closeActionPanel();
                              }
                            }}
                            className="neu-btn-primary px-3.5 py-2 rounded-xl font-semibold cursor-pointer"
                          >
                            Confirm Assignment
                          </button>
                          <button
                            onClick={closeActionPanel}
                            className="neu-btn-secondary px-3 py-2 rounded-xl font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActionMode === 'resolve' && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          placeholder="Enter resolution remark for case audit history..."
                          className="neu-card flex-1 px-3 py-2 rounded-xl text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (
                                updateAlertItem(
                                  alert.alert_id,
                                  'resolve',
                                  reasonInput ||
                                    `Resolved by ${roleProfile.displayName} after verification.`
                                )
                              ) {
                                closeActionPanel();
                              }
                            }}
                            className="neu-btn-primary px-3.5 py-2 rounded-xl font-semibold cursor-pointer"
                          >
                            Confirm Resolution
                          </button>
                          <button
                            onClick={closeActionPanel}
                            className="neu-btn-secondary px-3 py-2 rounded-xl font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}

                    {activeActionMode === 'dismiss' && (
                      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                        <input
                          type="text"
                          value={reasonInput}
                          onChange={(e) => setReasonInput(e.target.value)}
                          placeholder="Required: Enter audit reason for dismissing this alert..."
                          className="neu-card flex-1 px-3 py-2 rounded-xl text-xs"
                        />
                        <div className="flex items-center gap-2">
                          <button
                            onClick={() => {
                              if (
                                updateAlertItem(
                                  alert.alert_id,
                                  'dismiss',
                                  reasonInput
                                )
                              ) {
                                closeActionPanel();
                              }
                            }}
                            className="neu-btn-secondary px-3.5 py-2 rounded-xl font-semibold text-[var(--status-critical)] cursor-pointer"
                          >
                            Confirm Dismissal
                          </button>
                          <button
                            onClick={closeActionPanel}
                            className="neu-btn-secondary px-3 py-2 rounded-xl font-semibold cursor-pointer"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {/* Bottom Action Bar */}
                <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
                  {/* Left: Direct Case & Context Navigation */}
                  <div className="flex flex-wrap items-center gap-1.5">
                    {alert.case_ids.map((cid) => (
                      <button
                        key={cid}
                        onClick={() => {
                          markAlertRead(alert.alert_id, true);
                          openCaseDetail(cid);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-mono-tabular font-bold text-[var(--accent-blue)] hover:underline cursor-pointer"
                      >
                        Open Case {cid}
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        markAlertRead(alert.alert_id, true);
                        openInstitutionProfile(alert.institution_id);
                      }}
                      className="neu-btn-secondary px-2.5 py-1 rounded-lg font-semibold cursor-pointer"
                    >
                      View Institution
                    </button>

                    {(alert.alert_type === 'Potential Overlapping Cases' ||
                      alert.alert_type ===
                        'Institution Identity Verification') && (
                      <button
                        onClick={() => {
                          markAlertRead(alert.alert_id, true);
                          setActiveScreen('overlaps');
                        }}
                        className="neu-btn-secondary px-2.5 py-1 rounded-lg font-semibold text-[var(--accent-blue)] cursor-pointer"
                      >
                        Review Overlap
                      </button>
                    )}

                    {alert.alert_type ===
                      'Cases Awaiting Bureau Coordination' && (
                      <button
                        onClick={() => {
                          markAlertRead(alert.alert_id, true);
                          setActiveScreen('coordination');
                        }}
                        className="neu-btn-secondary px-2.5 py-1 rounded-lg font-semibold text-[var(--accent-blue)] cursor-pointer"
                      >
                        Request Coordination
                      </button>
                    )}

                    {(alert.alert_type ===
                      'Cases Pending Transfer Acceptance' ||
                      alert.alert_type === 'Escalation Awaiting Action') && (
                      <button
                        onClick={() => {
                          markAlertRead(alert.alert_id, true);
                          setActiveScreen('transfers');
                        }}
                        className="neu-btn-secondary px-2.5 py-1 rounded-lg font-semibold text-[var(--accent-blue)] cursor-pointer"
                      >
                        Open Transfers & Escalations
                      </button>
                    )}
                  </div>

                  {/* Right: Alert Lifecycle Actions */}
                  {canModifyAlerts && (
                    <div className="flex flex-wrap items-center gap-2">
                      {alert.acknowledgement_status === 'Unacknowledged' &&
                        alert.resolution_status === 'Open' && (
                          <button
                            onClick={() =>
                              updateAlertItem(alert.alert_id, 'acknowledge')
                            }
                            className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                          >
                            Acknowledge Alert
                          </button>
                        )}

                      {alert.resolution_status === 'Open' && (
                        <>
                          <button
                            onClick={() =>
                              openActionPanel(
                                alert.alert_id,
                                'assign',
                                alert.assigned_to
                              )
                            }
                            className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                          >
                            Assign Alert
                          </button>

                          <button
                            onClick={() =>
                              openActionPanel(alert.alert_id, 'resolve')
                            }
                            className="neu-btn-primary px-3 py-1.5 rounded-lg font-semibold cursor-pointer"
                          >
                            Resolve Alert
                          </button>

                          <button
                            onClick={() =>
                              openActionPanel(alert.alert_id, 'dismiss')
                            }
                            className="neu-btn-secondary px-3 py-1.5 rounded-lg font-semibold text-[var(--text-muted)] hover:text-[var(--status-critical)] cursor-pointer"
                          >
                            Dismiss with Reason
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>
      </SubSectionTransition>
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
                <th className="py-3.5 px-4">Timestamp</th>
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
