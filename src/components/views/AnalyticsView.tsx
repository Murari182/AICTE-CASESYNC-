import React, { useMemo, useState } from 'react';
import {
  BarChart3,
  Building2,
  Download,
  FileSpreadsheet,
  GitCompare,
  Layers,
  PieChart,
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

  const uniqueBureaus = useMemo(
    () => Array.from(new Set(cases.map((c) => c.current_bureau))),
    [cases]
  );

  const uniqueRegions = useMemo(
    () => Array.from(new Set(cases.map((c) => c.region))),
    [cases]
  );

  const scopedCases = useMemo(() => {
    return cases.filter((c) => {
      if (bureauFilter !== 'ALL' && c.current_bureau !== bureauFilter)
        return false;
      if (regionFilter !== 'ALL' && c.region !== regionFilter) return false;
      return true;
    });
  }, [cases, bureauFilter, regionFilter]);

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
      };
      cur.total += 1;
      if (c.status === 'Pending' || c.status === 'Received') cur.pending += 1;
      if (c.status === 'Under Process') cur.underProcess += 1;
      if (c.status === 'Disposed') cur.disposed += 1;
      if (c.status === 'Transferred') cur.transferred += 1;
      if (
        computeDeadlineState(c.expected_disposal_at, c.status, slaConfig) ===
        'Overdue'
      ) {
        cur.overdue += 1;
      }
      map.set(c.current_bureau, cur);
    });

    return Array.from(map.values()).sort((a, b) => b.total - a.total);
  }, [scopedCases, slaConfig]);

  // 2. Region-wise Cases
  const regionStats = useMemo(() => {
    const map = new Map<string, number>();
    scopedCases.forEach((c) => {
      map.set(c.region, (map.get(c.region) || 0) + 1);
    });
    return Array.from(map.entries())
      .map(([region, count]) => ({ region, count }))
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
          bureaus,
          hasOverlap,
        };
      })
      .filter((item) => item.totalCases > 0)
      .sort((a, b) => b.totalCases - a.totalCases);
  }, [institutions, scopedCases]);

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
      '# PROTOTYPE OUTPUT — ILLUSTRATIVE SAMPLE DATA FOR AICTE CASESYNC SIH DEMO\n' +
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
      `Exported ${scopedCases.length} records (labelled as Prototype Output).`
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <BarChart3 className="w-3.5 h-3.5" />
            Consolidated Institutional & Bureau Reporting
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Reports & Analytics
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Derived directly from live complaint, institution, overlap, and transfer records. Labelled as illustrative SIH prototype outputs.
          </p>
        </div>

        <button
          onClick={exportCsvReport}
          className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start"
        >
          <Download className="w-4 h-4" />
          Export Consolidated CSV Report
        </button>
      </div>

      {/* Filters & Methodology Note */}
      <div className="neu-card rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
        <div className="flex flex-wrap items-center gap-3">
          <div>
            <label className="block text-[10px] font-bold uppercase text-[var(--text-muted)] mb-1">
              Filter by Bureau / Cell
            </label>
            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value)}
              className="neu-inset px-3 py-2 rounded-xl font-medium"
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
              Filter by Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="neu-inset px-3 py-2 rounded-xl font-medium"
            >
              <option value="ALL">All Regions</option>
              {uniqueRegions.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="neu-inset rounded-xl p-3 max-w-xl text-[11px] text-[var(--text-secondary)]">
          <strong>Reporting Distinction:</strong> Total Complaints ({scopedCases.length}) ≠ Unique Monitored Institutions ({institutionReport.length}) ≠ Confirmed Related-Case Groups ({relations.filter((r) => r.review_status === 'Confirmed Related Cases').length}). High complaint volume indicates monitoring activity, not verified institutional wrongdoing.
        </div>
      </div>

      {/* Top Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: 'Scoped Complaints', val: scopedCases.length },
          { label: 'Unique Institutions', val: institutionReport.length },
          {
            label: 'Confirmed Overlaps',
            val: relations.filter(
              (r) => r.review_status === 'Confirmed Related Cases'
            ).length,
          },
          {
            label: 'Pending Overlap Review',
            val: relations.filter(
              (r) => r.review_status === 'Potential Overlap — Review Required'
            ).length,
          },
          { label: 'Recorded Transfers', val: transfers.length },
          { label: 'Senior Escalations', val: escalations.length },
        ].map((m) => (
          <div key={m.label} className="neu-card rounded-2xl p-4">
            <div className="text-[11px] text-[var(--text-secondary)] font-semibold">
              {m.label}
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {m.val}
            </div>
          </div>
        ))}
      </div>

      {/* Grid of Visualized Reports */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Report 1: Bureau/Cell-wise Workload */}
        <div className="neu-card rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-2">
            <Layers className="w-4 h-4 text-[var(--accent-blue)]" />
            <h2 className="text-base font-bold text-[var(--text-primary)]">
              1. Bureau / Cell-Wise Workload & Status Breakdown
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
                      {b.total} cases ({pct}%)
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
                    <span>Disposed: {b.disposed}</span>
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
                2. Status Distribution & Pending Case Ageing
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
                3. Region-Wise Complaint Distribution
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
                        {reg.count} ({pct}%)
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

      {/* Report 5: Overlapping & Related Cases Report */}
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
                      className="text-[var(--accent-blue)] underline mr-2"
                    >
                      {rel.case_id_a}
                    </button>
                    ↔
                    <button
                      onClick={() => openCaseDetail(rel.case_id_b)}
                      className="text-[var(--accent-blue)] underline ml-2"
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
