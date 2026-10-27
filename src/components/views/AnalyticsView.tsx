import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Calendar,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  GitCompare,
  Layers,
  PieChart,
  RotateCcw,
  TrendingUp,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { computeDeadlineState } from '../../data/seedData';
import { OverlapBadge } from '../ui/SharedComponents';

export const AnalyticsView: React.FC = () => {
  const {
    cases,
    institutions,
    relations,
    transfers,
    escalations,
    slaConfig,
    openInstitutionProfile,
    openCaseDetail,
    addToast,
  } = useCaseSync();

  const [bureauFilter, setBureauFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const uniqueBureaus = useMemo(
    () => Array.from(new Set(cases.map((c) => c.current_bureau))),
    [cases]
  );

  const uniqueRegions = useMemo(
    () => Array.from(new Set(cases.map((c) => c.region))),
    [cases]
  );

  const uniqueCategories = useMemo(
    () => Array.from(new Set(cases.map((c) => c.category))),
    [cases]
  );

  const scopedCases = useMemo(() => {
    return cases.filter((c) => {
      if (bureauFilter !== 'ALL' && c.current_bureau !== bureauFilter)
        return false;
      if (regionFilter !== 'ALL' && c.region !== regionFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (statusFilter !== 'ALL' && c.status !== statusFilter) return false;
      if (startDate) {
        const startMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
        if (!Number.isNaN(startMs) && new Date(c.received_at).getTime() < startMs) {
          return false;
        }
      }
      if (endDate) {
        const endMs = new Date(`${endDate}T23:59:59.999Z`).getTime();
        if (!Number.isNaN(endMs) && new Date(c.received_at).getTime() > endMs) {
          return false;
        }
      }
      return true;
    });
  }, [cases, bureauFilter, regionFilter, categoryFilter, statusFilter, startDate, endDate]);

  // Explicit Disposal Rate Calculation (Numerator & Denominator)
  const disposalMetrics = useMemo(() => {
    const total = scopedCases.length;
    const disposed = scopedCases.filter((c) => c.status === 'Disposed').length;
    const active = total - disposed;
    const rate = total > 0 ? Number(((disposed / total) * 100).toFixed(1)) : 0;
    return { total, disposed, active, rate };
  }, [scopedCases]);

  // 1. Bureau/Cell-wise Workload
  const bureauStats = useMemo(() => {
    const map = new Map<
      string,
      {
        bureau: string;
        total: number;
        pending: number;
        underProcess: number;
        disposed: number;
        transferred: number;
        overdue: number;
        disposalRate: number;
      }
    >();

    scopedCases.forEach((c) => {
      const cur = map.get(c.current_bureau) || {
        bureau: c.current_bureau,
        total: 0,
        pending: 0,
        underProcess: 0,
        disposed: 0,
        transferred: 0,
        overdue: 0,
        disposalRate: 0,
      };
      cur.total += 1;
      if (c.status === 'Pending' || c.status === 'Received') cur.pending += 1;
      if (c.status === 'Under Process' || c.status === 'Escalated') cur.underProcess += 1;
      if (c.status === 'Disposed') cur.disposed += 1;
      if (c.status === 'Transferred') cur.transferred += 1;
      if (
        computeDeadlineState(c.expected_disposal_at, c.status, slaConfig) ===
        'Overdue'
      ) {
        cur.overdue += 1;
      }
      cur.disposalRate =
        cur.total > 0 ? Number(((cur.disposed / cur.total) * 100).toFixed(1)) : 0;
      map.set(c.current_bureau, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scopedCases, slaConfig]);

  // 2. Region-wise Cases
  const regionStats = useMemo(() => {
    const map = new Map<string, { count: number; disposed: number }>();
    scopedCases.forEach((c) => {
      const cur = map.get(c.region) || { count: 0, disposed: 0 };
      cur.count += 1;
      if (c.status === 'Disposed') cur.disposed += 1;
      map.set(c.region, cur);
    });
    return Array.from(map.entries())
      .map(([region, data]) => ({
        region,
        count: data.count,
        disposed: data.disposed,
        disposalRate:
          data.count > 0 ? Number(((data.disposed / data.count) * 100).toFixed(1)) : 0,
      }))
      .sort((a, b) => b.count - a.count);
  }, [scopedCases]);

  // 3. Status-wise Distribution
  const statusStats = useMemo(() => {
    const statuses = [
      'Received',
      'Pending',
      'Under Process',
      'Transferred',
      'Escalated',
      'Disposed',
    ];
    return statuses.map((status) => ({
      status,
      count: scopedCases.filter((c) => c.status === status).length,
    }));
  }, [scopedCases]);

  // 4. Pending Case Ageing Buckets
  const ageingBuckets = useMemo(() => {
    const now = new Date('2026-10-27T12:00:00Z').getTime();
    const openCases = scopedCases.filter((c) => c.status !== 'Disposed');
    const buckets = [
      { label: '0 – 3 Days', count: 0 },
      { label: '4 – 7 Days', count: 0 },
      { label: '8 – 14 Days', count: 0 },
      { label: '15+ Days (Aged)', count: 0 },
    ];
    openCases.forEach((c) => {
      const days = Math.max(
        0,
        Math.floor(
          (now - new Date(c.received_at).getTime()) / (1000 * 60 * 60 * 24)
        )
      );
      if (days <= 3) buckets[0].count += 1;
      else if (days <= 7) buckets[1].count += 1;
      else if (days <= 14) buckets[2].count += 1;
      else buckets[3].count += 1;
    });
    return buckets;
  }, [scopedCases]);

  // 5. Institution-wise Complaint History Summary
  const institutionReport = useMemo(() => {
    return institutions
      .map((inst) => {
        const instCases = scopedCases.filter(
          (c) => c.institution_id === inst.institution_id
        );
        const openCount = instCases.filter((c) => c.status !== 'Disposed').length;
        const disposedCount = instCases.filter((c) => c.status === 'Disposed').length;
        const bureaus = Array.from(
          new Set(instCases.map((c) => c.current_bureau.split(' ')[0]))
        );
        const hasOverlap = instCases.some(
          (c) => c.overlap_status !== 'No Overlap'
        );
        return {
          ...inst,
          totalCases: instCases.length,
          openCount,
          disposedCount,
          bureaus,
          hasOverlap,
        };
      })
      .filter((item) => item.totalCases > 0)
      .sort((a, b) => b.totalCases - a.totalCases);
  }, [institutions, scopedCases]);

  // 7 & 8. Monthly and Quarterly Performance Summaries
  const monthlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        period: string;
        received: number;
        active: number;
        disposed: number;
        escalated: number;
      }
    >();
    scopedCases.forEach((c) => {
      const d = new Date(c.received_at);
      const period = Number.isNaN(d.getTime())
        ? '2026-10 (October 2026)'
        : `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')} (${d.toLocaleString('en-US', { month: 'short', year: 'numeric', timeZone: 'UTC' })})`;
      const cur = map.get(period) || {
        period,
        received: 0,
        active: 0,
        disposed: 0,
        escalated: 0,
      };
      cur.received += 1;
      if (c.status === 'Disposed') cur.disposed += 1;
      else cur.active += 1;
      if (c.status === 'Escalated') cur.escalated += 1;
      map.set(period, cur);
    });
    return Array.from(map.values()).map((row) => ({
      ...row,
      disposalRate:
        row.received > 0
          ? Number(((row.disposed / row.received) * 100).toFixed(1))
          : 0,
    }));
  }, [scopedCases]);

  const quarterlySummary = useMemo(() => {
    const map = new Map<
      string,
      {
        quarter: string;
        received: number;
        active: number;
        disposed: number;
        escalated: number;
      }
    >();
    scopedCases.forEach((c) => {
      const d = new Date(c.received_at);
      const q = Number.isNaN(d.getTime())
        ? 'FY 2026-27 Q3 (Oct–Dec 2026)'
        : `${d.getUTCFullYear()}-Q${Math.floor(d.getUTCMonth() / 3) + 1}`;
      const cur = map.get(q) || {
        quarter: q,
        received: 0,
        active: 0,
        disposed: 0,
        escalated: 0,
      };
      cur.received += 1;
      if (c.status === 'Disposed') cur.disposed += 1;
      else cur.active += 1;
      if (c.status === 'Escalated') cur.escalated += 1;
      map.set(q, cur);
    });
    return Array.from(map.values()).map((row) => ({
      ...row,
      disposalRate:
        row.received > 0
          ? Number(((row.disposed / row.received) * 100).toFixed(1))
          : 0,
    }));
  }, [scopedCases]);

  const resetFilters = () => {
    setBureauFilter('ALL');
    setRegionFilter('ALL');
    setCategoryFilter('ALL');
    setStatusFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const exportCsvReport = () => {
    const headers = [
      'Case_ID',
      'Receipt_Date',
      'AICTE_Permanent_ID',
      'Institution_Name',
      'Region',
      'Category',
      'Current_Bureau',
      'Assigned_Officer',
      'Status',
      'Priority',
      'Overlap_Status',
      'Expected_Disposal_Date',
    ];
    const rows = scopedCases.map((c) => [
      c.id,
      c.received_at,
      c.aicte_permanent_id,
      `"${c.institutionName.replace(/"/g, '""')}"`,
      c.region,
      `"${c.category}"`,
      `"${c.current_bureau}"`,
      `"${c.assigned_officer}"`,
      c.status,
      c.priority,
      `"${c.overlap_status}"`,
      c.expected_disposal_at,
    ]);
    const csvContent =
      '# AICTE CASESYNC — CONSOLIDATED INSTITUTIONAL & BUREAU MONITORING REPORT\n' +
      `# Disposal Rate: ${disposalMetrics.disposed} / ${disposalMetrics.total} (${disposalMetrics.rate}%)\n` +
      [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'AICTE_CaseSync_Consolidated_Report.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    addToast(
      'CSV Report Exported',
      `Exported ${scopedCases.length} institutional case records.`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Consolidated Institutional & Bureau Reporting (8 Statutory Views)
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Derived directly from live complaint, institution, cross-Bureau overlap, and transfer records.
          </p>
        </div>

        <button
          onClick={exportCsvReport}
          className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Export Consolidated CSV Report
        </button>
      </div>

      {/* Filters & Methodology Note */}
      <div className="neu-card rounded-2xl p-4 space-y-4 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3 items-end">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
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
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
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
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
              Complaint Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
              Case Status
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="neu-inset w-full px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Statuses</option>
              {['Received', 'Pending', 'Under Process', 'Transferred', 'Escalated', 'Disposed'].map(
                (st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                )
              )}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
              From Date
            </label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="neu-inset w-full px-3 py-1.5 rounded-xl font-medium"
            />
          </div>

          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
                To Date
              </label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="neu-inset w-full px-3 py-1.5 rounded-xl font-medium"
              />
            </div>
            {(bureauFilter !== 'ALL' ||
              regionFilter !== 'ALL' ||
              categoryFilter !== 'ALL' ||
              statusFilter !== 'ALL' ||
              startDate ||
              endDate) && (
              <button
                onClick={resetFilters}
                title="Reset all filters"
                className="neu-btn-secondary px-2.5 py-2 rounded-xl inline-flex items-center gap-1 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        <div className="neu-inset rounded-xl p-3 text-[11px] text-[var(--text-secondary)] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <strong>Reporting Distinction:</strong> Total Complaints ({scopedCases.length}) ≠ Unique Monitored Institutions ({institutionReport.length}) ≠ Confirmed Related-Case Groups ({relations.filter((r) => r.review_status === 'Confirmed Related Cases').length}). High complaint volume indicates monitoring activity, not verified institutional wrongdoing.
          </div>
          <div className="font-mono text-[var(--accent-blue)] font-semibold shrink-0">
            Disposal Rate: {disposalMetrics.disposed}/{disposalMetrics.total} ({disposalMetrics.rate}%)
          </div>
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Scoped Complaints', val: scopedCases.length },
          { label: 'Unique Institutions', val: institutionReport.length },
          {
            label: 'Disposal Rate',
            val: `${disposalMetrics.rate}% (${disposalMetrics.disposed}/${disposalMetrics.total})`,
          },
          {
            label: 'Confirmed Overlaps',
            val: relations.filter(
              (r) => r.review_status === 'Confirmed Related Cases'
            ).length,
          },
          { label: 'Recorded Transfers', val: transfers.length },
          { label: 'Senior Escalations', val: escalations.length },
        ].map((m) => (
          <div key={m.label} className="neu-card rounded-2xl p-4">
            <div className="text-[11px] text-[var(--text-secondary)] font-semibold">
              {m.label}
            </div>
            <div className="text-xl font-bold text-[var(--text-primary)] mt-1">
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Report 5: Explicit Disposal Rate Report Card */}
      <div className="neu-card rounded-2xl p-5 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-[var(--status-success)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Statutory Disposal Rate Report (Formula & Denominator Verification)
            </h2>
          </div>
          <span className="text-xs font-mono text-[var(--text-secondary)]">
            Formula: Disposed Cases ({disposalMetrics.disposed}) ÷ Total Scoped Cases ({disposalMetrics.total}) × 100 = {disposalMetrics.rate}%
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          <div className="neu-inset rounded-xl p-4">
            <div className="text-[var(--text-secondary)]">Numerator (Disposed Cases)</div>
            <div className="text-2xl font-bold text-[var(--status-success)] mt-1">
              {disposalMetrics.disposed}
            </div>
          </div>
          <div className="neu-inset rounded-xl p-4">
            <div className="text-[var(--text-secondary)]">Denominator (Total Cases in Scope)</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {disposalMetrics.total}
            </div>
          </div>
          <div className="neu-inset rounded-xl p-4">
            <div className="text-[var(--text-secondary)]">Active / Pending Cases</div>
            <div className="text-2xl font-bold text-[var(--accent-blue)] mt-1">
              {disposalMetrics.active}
            </div>
          </div>
          <div className="neu-inset rounded-xl p-4">
            <div className="text-[var(--text-secondary)]">Computed Disposal Rate</div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {disposalMetrics.rate}%
            </div>
          </div>
        </div>
      </div>

      {/* Grid of Visualized Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report 1: Bureau/Cell-wise Workload */}
        <div className="neu-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              1. Bureau / Cell-Wise Workload & Disposal Breakdown
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            {bureauStats.map((b) => {
              const pct =
                scopedCases.length > 0
                  ? Math.round((b.total / scopedCases.length) * 100)
                  : 0;
              return (
                <div key={b.bureau} className="neu-inset rounded-xl p-3.5 space-y-2">
                  <div className="flex items-center justify-between font-semibold">
                    <span className="text-[var(--text-primary)]">{b.bureau}</span>
                    <span className="font-mono text-[var(--accent-blue)]">
                      {b.total} cases ({pct}%) • Disposed: {b.disposalRate}%
                    </span>
                  </div>
                  <div className="w-full h-2 rounded-full bg-[var(--bg-card)] overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-[#438BFF] to-[#3438EE]"
                      style={{ width: `${Math.max(8, pct)}%` }}
                    />
                  </div>
                  <div className="flex flex-wrap gap-3 text-[11px] text-[var(--text-secondary)]">
                    <span>Pending: {b.pending}</span>
                    <span>Under Process: {b.underProcess}</span>
                    <span>Transferred: {b.transferred}</span>
                    <span>Disposed: {b.disposed}/{b.total}</span>
                    {b.overdue > 0 && (
                      <span className="font-bold text-[var(--status-critical)]">
                        Overdue: {b.overdue}
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Report 2, 3, 4: Region-wise, Status-wise & Pending Ageing */}
        <div className="space-y-6">
          <div className="neu-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <PieChart className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                2. Status Distribution & Pending Case Ageing Analysis
              </h2>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 text-xs">
              {statusStats.map((st) => (
                <div key={st.status} className="neu-inset rounded-xl p-3">
                  <div className="text-[var(--text-secondary)]">{st.status}</div>
                  <div className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                    {st.count}
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-[var(--border-subtle)]">
              <div className="text-xs font-bold text-[var(--text-primary)] mb-2">
                Pending & Open Case Ageing Buckets
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
                {ageingBuckets.map((bucket) => (
                  <div key={bucket.label} className="neu-inset rounded-xl p-3">
                    <div className="text-[11px] text-[var(--text-secondary)]">
                      {bucket.label}
                    </div>
                    <div className="text-lg font-bold text-[var(--accent-blue)] mt-0.5">
                      {bucket.count}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="neu-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                3. Region-Wise Complaint & Disposal Distribution
              </h2>
            </div>
            <div className="space-y-2.5 text-xs">
              {regionStats.map((reg) => {
                const pct =
                  scopedCases.length > 0
                    ? Math.round((reg.count / scopedCases.length) * 100)
                    : 0;
                return (
                  <div key={reg.region} className="space-y-1">
                    <div className="flex justify-between font-medium">
                      <span className="text-[var(--text-primary)]">{reg.region}</span>
                      <span className="font-mono text-[var(--text-secondary)]">
                        {reg.count} cases ({pct}%) • Disposed: {reg.disposed}/{reg.count} ({reg.disposalRate}%)
                      </span>
                    </div>
                    <div className="w-full h-2 rounded-full bg-[var(--bg-inset)] overflow-hidden">
                      <div
                        className="h-full bg-[var(--accent-blue)]"
                        style={{ width: `${Math.max(6, pct)}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {/* Reports 7 & 8: Monthly & Quarterly Performance Summaries */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="neu-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Monthly Performance Summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                  <th className="py-3 px-4">Month</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4">Disposed</th>
                  <th className="py-3 px-4">Escalated</th>
                  <th className="py-3 px-4">Disposal Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {monthlySummary.map((m) => (
                  <tr key={m.period} className="hover:bg-[var(--bg-elevated)]">
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {m.period}
                    </td>
                    <td className="py-3 px-4 font-mono">{m.received}</td>
                    <td className="py-3 px-4 font-mono">{m.active}</td>
                    <td className="py-3 px-4 font-mono">{m.disposed}</td>
                    <td className="py-3 px-4 font-mono">{m.escalated}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent-blue)]">
                      {m.disposalRate}% ({m.disposed}/{m.received})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="neu-card rounded-2xl overflow-hidden">
          <div className="p-5 border-b border-[var(--border-subtle)] flex items-center gap-2">
            <Calendar className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              Quarterly Performance Summary
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                  <th className="py-3 px-4">Quarter</th>
                  <th className="py-3 px-4">Received</th>
                  <th className="py-3 px-4">Active</th>
                  <th className="py-3 px-4">Disposed</th>
                  <th className="py-3 px-4">Escalated</th>
                  <th className="py-3 px-4">Disposal Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {quarterlySummary.map((q) => (
                  <tr key={q.quarter} className="hover:bg-[var(--bg-elevated)]">
                    <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                      {q.quarter}
                    </td>
                    <td className="py-3 px-4 font-mono">{q.received}</td>
                    <td className="py-3 px-4 font-mono">{q.active}</td>
                    <td className="py-3 px-4 font-mono">{q.disposed}</td>
                    <td className="py-3 px-4 font-mono">{q.escalated}</td>
                    <td className="py-3 px-4 font-mono font-bold text-[var(--accent-blue)]">
                      {q.disposalRate}% ({q.disposed}/{q.received})
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Report 4: Institution-wise Complaint History Table */}
      <div className="neu-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              4. Institution-Wise Consolidated Complaint History
            </h2>
          </div>
          <span className="text-xs text-[var(--text-muted)]">
            Click any institution to open its 5-tab profile
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                <th className="py-3 px-4">Institution Name</th>
                <th className="py-3 px-4">AICTE Permanent ID</th>
                <th className="py-3 px-4">Region</th>
                <th className="py-3 px-4">Total Cases</th>
                <th className="py-3 px-4">Open Cases</th>
                <th className="py-3 px-4">Disposed</th>
                <th className="py-3 px-4">Bureaus Involved</th>
                <th className="py-3 px-4">Verification / Overlap</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {institutionReport.map((inst) => (
                <tr
                  key={inst.institution_id}
                  onClick={() => openInstitutionProfile(inst.institution_id)}
                  className="hover:bg-[var(--bg-elevated)] cursor-pointer transition-colors"
                >
                  <td className="py-3 px-4 font-bold text-[var(--accent-blue)]">
                    {inst.name}
                  </td>
                  <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                    {inst.aicte_permanent_id}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    {inst.region}
                  </td>
                  <td className="py-3 px-4 font-bold text-[var(--text-primary)]">
                    {inst.totalCases}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                    {inst.openCount}
                  </td>
                  <td className="py-3 px-4 font-mono text-[var(--text-secondary)]">
                    {inst.disposedCount}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    {inst.bureaus.join(', ')}
                  </td>
                  <td className="py-3 px-4">
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-[var(--border-subtle)] font-medium">
                      {inst.verification_status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Report 6: Overlapping & Related Cases Report */}
      <div className="neu-card rounded-2xl overflow-hidden">
        <div className="p-5 border-b border-[var(--border-subtle)] flex items-center justify-between">
          <div className="flex items-center gap-2">
            <GitCompare className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              5. Cross-Bureau Overlapping & Related Cases Summary
            </h2>
          </div>
          <FileSpreadsheet className="w-4 h-4 text-[var(--text-muted)]" />
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                <th className="py-3 px-4">Relation ID</th>
                <th className="py-3 px-4">Institution</th>
                <th className="py-3 px-4">Linked Case Pair</th>
                <th className="py-3 px-4">Involved Bureaus</th>
                <th className="py-3 px-4">Relationship Type</th>
                <th className="py-3 px-4">Review Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {relations.map((rel) => (
                <tr key={rel.relation_id} className="hover:bg-[var(--bg-elevated)]">
                  <td className="py-3 px-4 font-mono font-bold text-[var(--accent-blue)]">
                    {rel.relation_id}
                  </td>
                  <td className="py-3 px-4 font-semibold text-[var(--text-primary)]">
                    {rel.institution_name}
                  </td>
                  <td className="py-3 px-4 font-mono">
                    <button
                      onClick={() => openCaseDetail(rel.case_id_a)}
                      className="text-[var(--accent-blue)] underline mr-2 cursor-pointer"
                    >
                      {rel.case_id_a}
                    </button>
                    ↔
                    <button
                      onClick={() => openCaseDetail(rel.case_id_b)}
                      className="text-[var(--accent-blue)] underline ml-2 cursor-pointer"
                    >
                      {rel.case_id_b}
                    </button>
                  </td>
                  <td className="py-3 px-4 text-[var(--text-secondary)]">
                    {rel.bureau_a.split(' ')[0]} + {rel.bureau_b.split(' ')[0]}
                  </td>
                  <td className="py-3 px-4 text-[var(--text-primary)]">
                    {rel.relation_type}
                  </td>
                  <td className="py-3 px-4">
                    <OverlapBadge status={rel.review_status} />
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
