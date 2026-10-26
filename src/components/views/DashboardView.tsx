import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRightLeft,
  Building2,
  CheckCircle2,
  Clock,
  Download,
  Eye,
  FileWarning,
  FolderKanban,
  GitCompare,
  History,
  RefreshCw,
  Search,
  Wrench,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { computeDeadlineState } from '../../data/seedData';
import { OverlapStatus } from '../../types/casesync';
import {
  DeadlineBadge,
  OverlapBadge,
  PriorityIndicator,
  StatusBadge,
  exportCasesToCsv,
  formatDateTime,
  formatShortDate,
} from '../ui/SharedComponents';

export const DashboardView: React.FC = () => {
  const {
    institutions,
    cases,
    alerts,
    slaConfig,
    lastUpdatedAt,
    refreshDataset,
    openInstitutionProfile,
    openCaseDetail,
    navigateToCasesWithFilter,
    setActiveScreen,
    addToast,
  } = useCaseSync();

  // Top-level Dashboard Filters
  const [bureauFilter, setBureauFilter] = useState<string>('ALL');
  const [regionFilter, setRegionFilter] = useState<string>('ALL');
  const [dateRangeFilter, setDateRangeFilter] = useState<string>('ALL');

  // Search bar and Status filters directly above the Dashboard Case Table
  const [caseTableSearch, setCaseTableSearch] = useState<string>('');
  const [caseTableStatusFilter, setCaseTableStatusFilter] =
    useState<string>('ALL');

  // Filter cases by top-level Bureau, Region, and Date Range
  const scopedCases = useMemo(() => {
    const refNow = new Date('2026-10-26T23:59:59Z').getTime();
    return cases.filter((c) => {
      if (bureauFilter !== 'ALL' && c.current_bureau !== bureauFilter)
        return false;
      if (regionFilter !== 'ALL' && c.region !== regionFilter) return false;
      if (dateRangeFilter !== 'ALL') {
        const days = Number(dateRangeFilter);
        const createdMs = new Date(c.received_at).getTime();
        if (refNow - createdMs > days * 24 * 60 * 60 * 1000) return false;
      }
      return true;
    });
  }, [cases, bureauFilter, regionFilter, dateRangeFilter]);

  // 6 Required KPI Cards calculated from scopedCases
  const kpis = useMemo(() => {
    const total = scopedCases.length;
    const pending = scopedCases.filter(
      (c) => c.status === 'Pending' || c.status === 'Received'
    ).length;
    const underProcess = scopedCases.filter(
      (c) => c.status === 'Under Process' || c.status === 'Escalated'
    ).length;
    const disposed = scopedCases.filter((c) => c.status === 'Disposed').length;
    const transferred = scopedCases.filter(
      (c) => c.status === 'Transferred'
    ).length;
    const overdue = scopedCases.filter(
      (c) =>
        computeDeadlineState(c, slaConfig.dueSoonDaysThreshold) === 'Overdue'
    ).length;

    return { total, pending, underProcess, disposed, transferred, overdue };
  }, [scopedCases, slaConfig.dueSoonDaysThreshold]);

  // Dashboard Case Table filtered by the dedicated search bar and status filter buttons above it
  const dashboardFilteredCases = useMemo(() => {
    const q = caseTableSearch.trim().toLowerCase();
    return scopedCases.filter((c) => {
      if (caseTableStatusFilter === 'Pending') {
        if (c.status !== 'Pending' && c.status !== 'Received') return false;
      } else if (caseTableStatusFilter === 'Under Process') {
        if (c.status !== 'Under Process') return false;
      } else if (caseTableStatusFilter === 'Disposed') {
        if (c.status !== 'Disposed') return false;
      } else if (caseTableStatusFilter === 'Transferred') {
        if (c.status !== 'Transferred') return false;
      } else if (caseTableStatusFilter === 'Escalated') {
        if (c.status !== 'Escalated') return false;
      } else if (caseTableStatusFilter === 'Overdue') {
        if (
          computeDeadlineState(c, slaConfig.dueSoonDaysThreshold) !== 'Overdue'
        )
          return false;
      }

      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.institutionName.toLowerCase().includes(q) ||
        c.aicte_permanent_id.toLowerCase().includes(q) ||
        c.current_bureau.toLowerCase().includes(q) ||
        c.assigned_officer.toLowerCase().includes(q)
      );
    });
  }, [
    scopedCases,
    caseTableSearch,
    caseTableStatusFilter,
    slaConfig.dueSoonDaysThreshold,
  ]);

  // Institutions Requiring Attention Table
  const institutionSummaries = useMemo(() => {
    return institutions
      .map((inst) => {
        const instCases = scopedCases.filter(
          (c) => c.institution_id === inst.institution_id
        );
        const openCases = instCases.filter((c) => c.status !== 'Disposed');
        const bureaus = Array.from(
          new Set(instCases.map((c) => c.current_bureau))
        );

        let overlapStatus: OverlapStatus = 'No Overlap';
        if (
          inst.verification_status === 'Uncertain Identity — Review Required' ||
          instCases.some(
            (c) => c.overlap_status === 'Institution Identity Uncertain'
          )
        ) {
          overlapStatus = 'Institution Identity Uncertain';
        } else if (
          instCases.some(
            (c) => c.overlap_status === 'Potential Overlap — Review Required'
          )
        ) {
          overlapStatus = 'Potential Overlap — Review Required';
        } else if (
          instCases.some(
            (c) => c.overlap_status === 'Confirmed Related Cases'
          )
        ) {
          overlapStatus = 'Confirmed Related Cases';
        } else if (
          instCases.some((c) => c.overlap_status === 'Not Related — Reviewed')
        ) {
          overlapStatus = 'Not Related — Reviewed';
        }

        const oldestOpen = [...openCases].sort(
          (a, b) =>
            new Date(a.received_at).getTime() -
            new Date(b.received_at).getTime()
        )[0];

        return {
          institution: inst,
          totalCases: instCases.length,
          openCasesCount: openCases.length,
          bureaus,
          overlapStatus,
          oldestOpen,
        };
      })
      .filter((item) => item.totalCases > 0)
      .sort((a, b) => b.openCasesCount - a.openCasesCount);
  }, [institutions, scopedCases]);

  // E. Bureau/Cell Workload Breakdown
  const bureauWorkloads = useMemo(() => {
    const groups = [
      {
        label: 'Regulation Bureau (RB)',
        match: (b: string) => b === 'Regulation Bureau (RB)',
      },
      {
        label: 'Public Grievance Redressal Cell (PGRC)',
        match: (b: string) => b === 'Public Grievance Redressal Cell (PGRC)',
      },
      {
        label: 'Approval Bureau (AB) & Faculty Cell (FGC)',
        match: (b: string) =>
          b === 'Approval Bureau (AB)' || b === 'Faculty Grievance Cell (FGC)',
      },
      {
        label: 'Regional Offices (SWRO / NWRO / SRO / ERO)',
        match: (b: string) => b.startsWith('Regional Office'),
      },
    ];

    return groups.map((g) => {
      const subset = scopedCases.filter((c) => g.match(c.current_bureau));
      const pending = subset.filter(
        (c) => c.status === 'Pending' || c.status === 'Received'
      ).length;
      const underProcess = subset.filter(
        (c) => c.status === 'Under Process' || c.status === 'Escalated'
      ).length;
      const disposed = subset.filter((c) => c.status === 'Disposed').length;
      const transferred = subset.filter(
        (c) => c.status === 'Transferred'
      ).length;
      const overdue = subset.filter(
        (c) =>
          computeDeadlineState(c, slaConfig.dueSoonDaysThreshold) === 'Overdue'
      ).length;
      return {
        label: g.label,
        total: subset.length,
        pending,
        underProcess,
        disposed,
        transferred,
        overdue,
      };
    });
  }, [scopedCases, slaConfig.dueSoonDaysThreshold]);

  // F. Recent Case Activity Timeline derived from stored event history
  const recentTimelineEvents = useMemo(() => {
    const allEvents = scopedCases.flatMap((c) =>
      c.timeline.map((evt) => ({
        ...evt,
        institutionName: c.institutionName,
      }))
    );
    return allEvents
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      )
      .slice(0, 6);
  }, [scopedCases]);

  const openAlerts = alerts.filter((a) => a.resolution_status === 'Open');

  return (
    <div className="space-y-6">
      {/* A. Dashboard Heading & Global Scope Toolbar */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs text-theme-secondary mb-1">
            <span className="font-semibold text-theme-blue">
              SINGLE-WINDOW INSTITUTION MONITORING
            </span>
            <span>·</span>
            <span>
              Last updated: {formatDateTime(lastUpdatedAt)}
            </span>
          </div>
          <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">
            Institution Complaint Monitoring
          </h1>
          <p className="text-xs sm:text-sm text-theme-secondary mt-1">
            Consolidated status and coordination overview across Bureaus and
            Cells.
          </p>
        </div>

        {/* Date-Range, Bureau/Cell, Region Filters + Refresh Action */}
        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by date range"
            value={dateRangeFilter}
            onChange={(e) => setDateRangeFilter(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">All Receipt Dates</option>
            <option value="7">Last 7 Days</option>
            <option value="14">Last 14 Days</option>
            <option value="30">Last 30 Days</option>
          </select>

          <select
            aria-label="Filter by Bureau or Cell"
            value={bureauFilter}
            onChange={(e) => setBureauFilter(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">All Bureaus &amp; Cells</option>
            <option value="Regulation Bureau (RB)">
              Regulation Bureau (RB)
            </option>
            <option value="Public Grievance Redressal Cell (PGRC)">
              PGRC
            </option>
            <option value="Approval Bureau (AB)">Approval Bureau (AB)</option>
            <option value="Faculty Grievance Cell (FGC)">
              Faculty Grievance Cell (FGC)
            </option>
            <option value="Regional Office (SRO)">Regional Office (SRO)</option>
            <option value="Regional Office (SWRO)">
              Regional Office (SWRO)
            </option>
          </select>

          <select
            aria-label="Filter by Region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-2 text-xs font-medium focus:outline-none"
          >
            <option value="ALL">All Regions</option>
            <option value="Southern (SRO)">Southern (SRO)</option>
            <option value="Western (WRO)">Western (WRO)</option>
            <option value="North-Western (NWRO)">North-Western (NWRO)</option>
            <option value="Eastern (ERO)">Eastern (ERO)</option>
            <option value="Central (CRO)">Central (CRO)</option>
            <option value="South-Western (SWRO)">South-Western (SWRO)</option>
          </select>

          <button
            onClick={refreshDataset}
            className="neu-btn-secondary px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
            title="Refresh displayed dataset"
          >
            <RefreshCw className="w-3.5 h-3.5 text-theme-blue" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* B. Six Aligned Clickable KPI Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          {
            label: 'Total Cases',
            count: kpis.total,
            filterVal: 'ALL',
            icon: <FolderKanban className="w-4 h-4 text-theme-blue" />,
          },
          {
            label: 'Pending Cases',
            count: kpis.pending,
            filterVal: 'Pending',
            icon: (
              <Clock className="w-4 h-4 text-[#B97813] dark:text-[#F4BD62]" />
            ),
          },
          {
            label: 'Under Process',
            count: kpis.underProcess,
            filterVal: 'Under Process',
            icon: <Wrench className="w-4 h-4 text-theme-blue" />,
          },
          {
            label: 'Disposed Cases',
            count: kpis.disposed,
            filterVal: 'Disposed',
            icon: (
              <CheckCircle2 className="w-4 h-4 text-[#18885F] dark:text-[#49C99A]" />
            ),
          },
          {
            label: 'Transferred Cases',
            count: kpis.transferred,
            filterVal: 'Transferred',
            icon: (
              <ArrowRightLeft className="w-4 h-4 text-[#4338F5] dark:text-[#8B8AFF]" />
            ),
          },
          {
            label: 'Overdue Cases',
            count: kpis.overdue,
            filterVal: 'Overdue',
            icon: (
              <FileWarning className="w-4 h-4 text-[#C83D50] dark:text-[#FF7788]" />
            ),
          },
        ].map((card) => (
          <button
            key={card.label}
            onClick={() => navigateToCasesWithFilter(card.filterVal)}
            className="neu-card rounded-[20px] p-4 sm:p-5 text-left flex flex-col justify-between min-h-[112px] hover:border-[var(--primary-blue)] transition-all cursor-pointer group"
          >
            <div className="flex items-center justify-between gap-2 w-full">
              <span className="text-xs font-semibold text-theme-secondary group-hover:text-theme-primary transition-colors">
                {card.label}
              </span>
              <div className="w-8 h-8 rounded-[10px] neu-inset flex items-center justify-center shrink-0">
                {card.icon}
              </div>
            </div>
            <div className="mt-3 flex items-baseline justify-between w-full">
              <span className="font-mono-tabular text-2xl sm:text-3xl font-extrabold text-theme-primary">
                {card.count}
              </span>
              <span className="text-[11px] font-medium text-theme-blue opacity-80 group-hover:opacity-100">
                Filter →
              </span>
            </div>
          </button>
        ))}
      </div>

      {/* C. Priority Alerts Panel ("Requires Attention") */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-[#B97813] dark:text-[#F4BD62]" />
            <h2 className="font-display text-lg font-bold text-theme-primary">
              Requires Attention — Cross-Bureau &amp; Deadline Alerts
            </h2>
          </div>
          <button
            onClick={() => setActiveScreen('alerts')}
            className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
          >
            Open Alert Center ({openAlerts.length} active) →
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {openAlerts.slice(0, 4).map((alert) => (
            <div
              key={alert.alert_id}
              className="neu-elevated rounded-[18px] p-4 flex flex-col justify-between gap-3"
            >
              <div className="space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span
                    className={`text-xs font-bold px-2.5 py-0.5 rounded-[8px] ${
                      alert.severity === 'Critical'
                        ? 'text-[#C83D50] dark:text-[#FF7788] bg-[#C83D50]/12'
                        : 'text-[#B97813] dark:text-[#F4BD62] bg-[#B97813]/12'
                    }`}
                  >
                    {alert.alert_type}
                  </span>
                  <span className="font-mono-tabular text-xs font-semibold text-theme-blue">
                    {alert.case_ids.join(' · ')}
                  </span>
                </div>

                <p className="text-sm font-bold text-theme-primary">
                  {alert.institution_name}{' '}
                  <span className="font-mono-tabular text-xs font-normal text-theme-secondary">
                    ({alert.aicte_permanent_id})
                  </span>
                </p>

                <p className="text-xs text-theme-secondary leading-relaxed">
                  {alert.reason}
                </p>
              </div>

              <div className="pt-3 border-t border-theme flex flex-wrap items-center justify-between gap-2 text-xs">
                <span className="text-theme-secondary truncate max-w-[240px]">
                  Bureaus: <strong className="text-theme-primary">{alert.bureaus.join(' + ')}</strong>
                </span>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() =>
                      openInstitutionProfile(alert.institution_id, 'overview')
                    }
                    className="neu-btn-secondary px-2.5 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer"
                  >
                    View Institution
                  </button>
                  {alert.alert_type.includes('Overlap') ||
                  alert.alert_type.includes('Identity') ? (
                    <button
                      onClick={() => setActiveScreen('overlaps')}
                      className="neu-btn-primary px-3 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer"
                    >
                      Review Overlap
                    </button>
                  ) : alert.alert_type.includes('Transfer') ||
                    alert.alert_type.includes('Coordination') ? (
                    <button
                      onClick={() => setActiveScreen('coordination')}
                      className="neu-btn-primary px-3 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer"
                    >
                      Coordinate Case
                    </button>
                  ) : (
                    <button
                      onClick={() => openCaseDetail(alert.case_ids[0])}
                      className="neu-btn-primary px-3 py-1.5 rounded-[10px] text-xs font-semibold cursor-pointer"
                    >
                      Open Case
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Dashboard Case Table with Dedicated Search Bar & Status Filters Directly Above It */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-lg font-bold text-theme-primary">
              Monitored Complaint Cases
            </h2>
            <p className="text-xs text-theme-secondary">
              Search by Case ID, Institution, Permanent ID, or Bureau, filter by
              workflow status, or export the current table view to CSV.
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2.5 self-start sm:self-auto">
            <button
              type="button"
              onClick={() => {
                exportCasesToCsv(
                  dashboardFilteredCases,
                  'AICTE_CaseSync_Dashboard_Cases',
                  slaConfig
                );
                addToast(
                  'Case Table Exported to CSV',
                  `Downloaded ${dashboardFilteredCases.length} filtered case record(s) for reporting.`
                );
              }}
              disabled={dashboardFilteredCases.length === 0}
              className="neu-btn-secondary px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 text-theme-blue cursor-pointer disabled:opacity-50"
              title="Export current filtered case table to CSV"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export CSV ({dashboardFilteredCases.length})</span>
            </button>
            <button
              onClick={() => setActiveScreen('cases')}
              className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
            >
              Open Full Complaint Register →
            </button>
          </div>
        </div>

        {/* Dedicated Search Bar + Status Filter Bar Directly Above Dashboard Case Table */}
        <div className="neu-elevated rounded-[18px] p-3.5 flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          {/* Search Input */}
          <div className="relative flex-1 max-w-md">
            <Search className="w-4 h-4 text-theme-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={caseTableSearch}
              onChange={(e) => setCaseTableSearch(e.target.value)}
              placeholder="Search cases by ID, institution, PID, subject, or officer..."
              aria-label="Search dashboard case table"
              className="w-full neu-inset rounded-[12px] pl-9 pr-3.5 py-2 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/40"
            />
          </div>

          {/* Interactive Status Filters (including Pending and Disposed / Resolved) */}
          <div
            role="group"
            aria-label="Filter dashboard cases by status"
            className="flex flex-wrap items-center gap-1.5"
          >
            {[
              { id: 'ALL', label: `All (${scopedCases.length})` },
              { id: 'Pending', label: `Pending (${kpis.pending})` },
              {
                id: 'Under Process',
                label: `Under Process (${scopedCases.filter((c) => c.status === 'Under Process').length})`,
              },
              { id: 'Transferred', label: `Transferred (${kpis.transferred})` },
              {
                id: 'Escalated',
                label: `Escalated (${scopedCases.filter((c) => c.status === 'Escalated').length})`,
              },
              {
                id: 'Disposed',
                label: `Disposed / Resolved (${kpis.disposed})`,
              },
              { id: 'Overdue', label: `Overdue (${kpis.overdue})` },
            ].map((tab) => {
              const active = caseTableStatusFilter === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCaseTableStatusFilter(tab.id)}
                  className={`relative px-3 py-1.5 rounded-[10px] text-xs font-semibold transition-colors duration-200 cursor-pointer whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-white'
                      : 'neu-btn-secondary text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="dashboard-case-status-pill"
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute inset-0 rounded-[10px] neu-btn-primary"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Dashboard Case Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme text-xs font-semibold text-theme-secondary">
                <th className="py-3 pr-3">Case ID</th>
                <th className="py-3 px-3">Institution &amp; Permanent ID</th>
                <th className="py-3 px-3">Complaint Subject</th>
                <th className="py-3 px-3">Current Bureau / Cell</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 px-3">Overlap / Relation</th>
                <th className="py-3 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme text-xs">
              {dashboardFilteredCases.length === 0 ? (
                <tr>
                  <td
                    colSpan={8}
                    className="py-8 text-center text-theme-secondary"
                  >
                    No complaint cases match your search or status filter.
                  </td>
                </tr>
              ) : (
                dashboardFilteredCases.map((item) => {
                  const dlState = computeDeadlineState(
                    item,
                    slaConfig.dueSoonDaysThreshold
                  );
                  return (
                    <tr
                      key={item.id}
                      onClick={() => openCaseDetail(item.id)}
                      className="hover:bg-[var(--bg-elevated)]/70 transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 pr-3 font-mono-tabular font-bold text-theme-blue whitespace-nowrap">
                        {item.id}
                      </td>
                      <td className="py-3.5 px-3 max-w-[210px]">
                        <p className="font-semibold text-theme-primary truncate">
                          {item.institutionName}
                        </p>
                        <p className="font-mono-tabular text-[11px] text-theme-secondary">
                          {item.aicte_permanent_id}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 max-w-[230px]">
                        <p className="font-medium text-theme-primary truncate">
                          {item.title}
                        </p>
                        <p className="text-[11px] text-theme-secondary truncate">
                          Officer: {item.assigned_officer}
                        </p>
                      </td>
                      <td className="py-3.5 px-3 font-medium text-theme-primary whitespace-nowrap">
                        {item.current_bureau}
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <StatusBadge status={item.status} />
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <DeadlineBadge state={dlState} />
                      </td>
                      <td className="py-3.5 px-3 whitespace-nowrap">
                        <OverlapBadge status={item.overlap_status} compact />
                      </td>
                      <td
                        className="py-3.5 pl-3 text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openCaseDetail(item.id)}
                          className="neu-btn-secondary px-3 py-1.5 rounded-[10px] text-xs font-semibold text-theme-blue inline-flex items-center gap-1 cursor-pointer"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>Open</span>
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* D. "Institutions Requiring Attention" Table */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-theme-blue" />
            <div>
              <h2 className="font-display text-lg font-bold text-theme-primary">
                Institutions Requiring Attention
              </h2>
              <p className="text-xs text-theme-secondary">
                Consolidated institution-wise view across Bureaus and Cells.
                Click any row to open the full Institution Profile.
              </p>
            </div>
          </div>

          <button
            onClick={() => setActiveScreen('institutions')}
            className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
          >
            View All {institutions.length} Institutions →
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-theme text-xs font-semibold text-theme-secondary">
                <th className="py-3 pr-3">Institution Name</th>
                <th className="py-3 px-3">AICTE Permanent ID</th>
                <th className="py-3 px-3">Region</th>
                <th className="py-3 px-3 text-right">Total Open Cases</th>
                <th className="py-3 px-3">Bureaus / Cells Involved</th>
                <th className="py-3 px-3">Overlap Status</th>
                <th className="py-3 px-3">Oldest Pending Case</th>
                <th className="py-3 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme text-xs">
              {institutionSummaries.map((row) => (
                <tr
                  key={row.institution.institution_id}
                  onClick={() =>
                    openInstitutionProfile(
                      row.institution.institution_id,
                      'overview'
                    )
                  }
                  className="hover:bg-[var(--bg-elevated)]/70 transition-colors cursor-pointer"
                >
                  <td className="py-3.5 pr-3 font-bold text-theme-primary max-w-[220px] truncate">
                    {row.institution.name}
                  </td>
                  <td className="py-3.5 px-3 font-mono-tabular text-theme-blue font-semibold whitespace-nowrap">
                    {row.institution.aicte_permanent_id}
                  </td>
                  <td className="py-3.5 px-3 text-theme-secondary whitespace-nowrap">
                    {row.institution.region}
                  </td>
                  <td className="py-3.5 px-3 text-right font-mono-tabular font-bold text-theme-primary">
                    {row.openCasesCount}
                  </td>
                  <td className="py-3.5 px-3 max-w-[220px]">
                    <span className="text-theme-primary font-medium">
                      {row.bureaus
                        .map((b) =>
                          b.includes('(')
                            ? b.slice(b.indexOf('(') + 1, b.indexOf(')'))
                            : b
                        )
                        .join(' · ')}
                    </span>
                  </td>
                  <td className="py-3.5 px-3 whitespace-nowrap">
                    <OverlapBadge status={row.overlapStatus} compact />
                  </td>
                  <td className="py-3.5 px-3 font-mono-tabular text-theme-secondary whitespace-nowrap">
                    {row.oldestOpen
                      ? `${row.oldestOpen.id} (${formatShortDate(row.oldestOpen.received_at)})`
                      : 'All Disposed'}
                  </td>
                  <td
                    className="py-3.5 pl-3 text-right whitespace-nowrap"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <button
                      onClick={() =>
                        openInstitutionProfile(
                          row.institution.institution_id,
                          'overview'
                        )
                      }
                      className="neu-btn-secondary px-3 py-1.5 rounded-[10px] text-xs font-semibold text-theme-blue cursor-pointer"
                    >
                      Institution Profile
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Row: E. Bureau/Cell Workload & F. Recent Case Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* E. Bureau/Cell Workload */}
        <div className="lg:col-span-7 neu-card rounded-[24px] p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="font-display text-lg font-bold text-theme-primary">
                Bureau / Cell Workload Breakdown
              </h2>
              <p className="text-xs text-theme-secondary">
                Live case distribution across RB, PGRC, Approval/Faculty Cells,
                and Regional Offices.
              </p>
            </div>
            <button
              onClick={() => setActiveScreen('reports')}
              className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
            >
              Detailed Reports →
            </button>
          </div>

          <div className="space-y-4">
            {bureauWorkloads.map((bw) => (
              <div
                key={bw.label}
                className="neu-elevated rounded-[16px] p-4 space-y-2.5"
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <span className="font-bold text-theme-primary">
                    {bw.label}
                  </span>
                  <div className="flex flex-wrap items-center gap-3 font-mono-tabular text-theme-secondary">
                    <span>
                      Pending: <strong className="text-[#B97813] dark:text-[#F4BD62]">{bw.pending}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Under Process: <strong className="text-theme-blue">{bw.underProcess}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Transferred: <strong>{bw.transferred}</strong>
                    </span>
                    <span>·</span>
                    <span>
                      Disposed: <strong className="text-[#18885F] dark:text-[#49C99A]">{bw.disposed}</strong>
                    </span>
                    {bw.overdue > 0 && (
                      <>
                        <span>·</span>
                        <span className="text-[#C83D50] dark:text-[#FF7788] font-bold">
                          Overdue: {bw.overdue}
                        </span>
                      </>
                    )}
                  </div>
                </div>

                {/* Stacked Bar */}
                <div className="h-2.5 w-full rounded-full neu-inset overflow-hidden flex">
                  {bw.total > 0 && (
                    <>
                      <div
                        style={{ width: `${(bw.pending / bw.total) * 100}%` }}
                        className="bg-[#B97813] dark:bg-[#F4BD62] h-full"
                        title={`Pending: ${bw.pending}`}
                      />
                      <div
                        style={{
                          width: `${(bw.underProcess / bw.total) * 100}%`,
                        }}
                        className="bg-[#3478F6] h-full"
                        title={`Under Process: ${bw.underProcess}`}
                      />
                      <div
                        style={{
                          width: `${(bw.transferred / bw.total) * 100}%`,
                        }}
                        className="bg-[#4338F5] h-full"
                        title={`Transferred: ${bw.transferred}`}
                      />
                      <div
                        style={{ width: `${(bw.disposed / bw.total) * 100}%` }}
                        className="bg-[#18885F] h-full"
                        title={`Disposed: ${bw.disposed}`}
                      />
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* F. Recent Case Activity Timeline */}
        <div className="lg:col-span-5 neu-card rounded-[24px] p-5 sm:p-6 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <History className="w-5 h-5 text-theme-blue" />
              <h2 className="font-display text-lg font-bold text-theme-primary">
                Recent Case Activity
              </h2>
            </div>
            <button
              onClick={() => setActiveScreen('audit')}
              className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
            >
              Full Audit Trail →
            </button>
          </div>

          <div className="space-y-3">
            {recentTimelineEvents.map((evt) => (
              <div
                key={evt.action_id}
                onClick={() => openCaseDetail(evt.case_id)}
                className="neu-elevated rounded-[14px] p-3.5 text-xs space-y-1 cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold text-theme-primary">
                    {evt.action_type}{' '}
                    <span className="font-mono-tabular text-theme-blue">
                      ({evt.case_id})
                    </span>
                  </span>
                  <span className="font-mono-tabular text-[11px] text-theme-secondary">
                    {formatShortDate(evt.timestamp)}
                  </span>
                </div>
                <p className="text-theme-secondary line-clamp-2 leading-relaxed">
                  {evt.remarks}
                </p>
                <p className="text-[11px] text-theme-muted">
                  {evt.institutionName} · {evt.actor} ({evt.bureau})
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
