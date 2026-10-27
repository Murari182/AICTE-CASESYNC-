import React, { useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Download,
  Eye,
  FileText,
  GitCompare,
  History,
  MapPin,
  Search,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { computeDeadlineState } from '../../data/seedData';
import { OverlapStatus } from '../../types/casesync';
import {
  DeadlineBadge,
  OverlapBadge,
  PriorityIndicator,
  StatusBadge,
  SubSectionTransition,
  formatDateTime,
  formatShortDate,
} from '../ui/SharedComponents';

export const InstitutionRegistryView: React.FC = () => {
  const {
    institutions,
    cases,
    openInstitutionProfile,
    setActiveScreen,
  } = useCaseSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [overlapFilter, setOverlapFilter] = useState('ALL');

  const rows = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return institutions
      .map((inst) => {
        const instCases = cases.filter(
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
          instCases.some((c) => c.overlap_status === 'Confirmed Related Cases')
        ) {
          overlapStatus = 'Confirmed Related Cases';
        } else if (
          instCases.some((c) => c.overlap_status === 'Not Related — Reviewed')
        ) {
          overlapStatus = 'Not Related — Reviewed';
        }

        const latestActivity =
          instCases
            .map((c) => c.last_action_at)
            .sort()
            .reverse()[0] || '2026-10-20T10:00:00Z';

        return {
          inst,
          totalComplaints: instCases.length,
          openCasesCount: openCases.length,
          bureaus,
          overlapStatus,
          latestActivity,
        };
      })
      .filter((row) => {
        if (regionFilter !== 'ALL' && row.inst.region !== regionFilter)
          return false;
        if (overlapFilter !== 'ALL' && row.overlapStatus !== overlapFilter)
          return false;
        if (!q) return true;
        return (
          row.inst.name.toLowerCase().includes(q) ||
          row.inst.aicte_permanent_id.toLowerCase().includes(q) ||
          row.inst.state.toLowerCase().includes(q) ||
          row.inst.address.toLowerCase().includes(q)
        );
      });
  }, [institutions, cases, searchQuery, regionFilter, overlapFilter]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <p className="text-xs font-bold text-theme-blue">
            CENTRALIZED INSTITUTION REGISTRY
          </p>
          <h1 className="font-display text-2xl font-extrabold text-theme-primary mt-0.5">
            Institution Profiles &amp; Cross-Bureau Footprint
          </h1>
          <p className="text-xs sm:text-sm text-theme-secondary mt-1">
            Inspect every technical institution’s consolidated complaint
            history, involved Bureaus/Cells, and potential overlap alerts.
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('overlaps')}
          className="neu-btn-secondary px-4 py-2.5 rounded-[14px] text-xs font-semibold text-theme-blue inline-flex items-center gap-2 whitespace-nowrap cursor-pointer self-start sm:self-auto"
        >
          <GitCompare className="w-4 h-4" />
          <span>Inspect Overlap Detection</span>
        </button>
      </div>

      {/* Search & Filter Bar */}
      <div className="neu-card rounded-[20px] p-4 flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 text-theme-secondary absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by AICTE Permanent ID, institution name, city, or state..."
            className="w-full neu-inset rounded-[12px] pl-9 pr-3.5 py-2 text-xs text-theme-primary placeholder:text-theme-muted focus:outline-none"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <select
            aria-label="Filter by region"
            value={regionFilter}
            onChange={(e) => setRegionFilter(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">All Regions</option>
            <option value="Southern (SRO)">Southern (SRO)</option>
            <option value="Western (WRO)">Western (WRO)</option>
            <option value="North-Western (NWRO)">North-Western (NWRO)</option>
            <option value="Eastern (ERO)">Eastern (ERO)</option>
            <option value="Central (CRO)">Central (CRO)</option>
            <option value="South-Western (SWRO)">South-Western (SWRO)</option>
          </select>

          <select
            aria-label="Filter by overlap status"
            value={overlapFilter}
            onChange={(e) => setOverlapFilter(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-2 text-xs font-medium"
          >
            <option value="ALL">All Overlap States</option>
            <option value="Potential Overlap — Review Required">
              Potential Overlap — Review Required
            </option>
            <option value="Confirmed Related Cases">
              Confirmed Related Cases
            </option>
            <option value="Institution Identity Uncertain">
              Institution Identity Uncertain
            </option>
            <option value="Not Related — Reviewed">
              Not Related — Reviewed
            </option>
            <option value="No Overlap">No Overlap</option>
          </select>
        </div>
      </div>

      {/* Institution Registry Table */}
      <div className="neu-card rounded-[24px] p-5 sm:p-6 overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-theme text-xs font-semibold text-theme-secondary">
              <th className="py-3 pr-3">AICTE Permanent ID</th>
              <th className="py-3 px-3">Institution Name &amp; Type</th>
              <th className="py-3 px-3">State &amp; Region</th>
              <th className="py-3 px-3 text-right">Total Cases</th>
              <th className="py-3 px-3 text-right">Open Cases</th>
              <th className="py-3 px-3">Bureaus / Cells Involved</th>
              <th className="py-3 px-3">Overlap Status</th>
              <th className="py-3 px-3">Last Activity</th>
              <th className="py-3 pl-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y border-theme text-xs">
            {rows.map((row) => (
              <tr
                key={row.inst.institution_id}
                onClick={() =>
                  openInstitutionProfile(row.inst.institution_id, 'overview')
                }
                className="hover:bg-[var(--bg-elevated)]/70 transition-colors cursor-pointer"
              >
                <td className="py-3.5 pr-3 font-mono-tabular font-bold text-theme-blue whitespace-nowrap">
                  {row.inst.aicte_permanent_id}
                </td>
                <td className="py-3.5 px-3 max-w-[250px]">
                  <p className="font-bold text-theme-primary truncate">
                    {row.inst.name}
                  </p>
                  <p className="text-[11px] text-theme-secondary truncate">
                    {row.inst.institution_type}
                  </p>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <p className="font-medium text-theme-primary">
                    {row.inst.state}
                  </p>
                  <p className="text-[11px] text-theme-secondary">
                    {row.inst.region}
                  </p>
                </td>
                <td className="py-3.5 px-3 text-right font-mono-tabular font-bold text-theme-primary">
                  {row.totalComplaints}
                </td>
                <td className="py-3.5 px-3 text-right font-mono-tabular font-bold text-theme-blue">
                  {row.openCasesCount}
                </td>
                <td className="py-3.5 px-3 max-w-[200px]">
                  <span className="text-theme-primary font-medium">
                    {row.bureaus.length > 0
                      ? row.bureaus
                          .map((b) =>
                            b.includes('(')
                              ? b.slice(b.indexOf('(') + 1, b.indexOf(')'))
                              : b
                          )
                          .join(' · ')
                      : 'None'}
                  </span>
                </td>
                <td className="py-3.5 px-3 whitespace-nowrap">
                  <OverlapBadge status={row.overlapStatus} compact />
                </td>
                <td className="py-3.5 px-3 font-mono-tabular text-theme-secondary whitespace-nowrap">
                  {formatShortDate(row.latestActivity)}
                </td>
                <td
                  className="py-3.5 pl-3 text-right whitespace-nowrap"
                  onClick={(e) => e.stopPropagation()}
                >
                  <div className="inline-flex items-center gap-1.5">
                    <button
                      onClick={() =>
                        openInstitutionProfile(
                          row.inst.institution_id,
                          'overview'
                        )
                      }
                      className="neu-btn-secondary px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-theme-blue cursor-pointer"
                    >
                      Profile
                    </button>
                    <button
                      onClick={() =>
                        openInstitutionProfile(
                          row.inst.institution_id,
                          'coordination'
                        )
                      }
                      className="neu-btn-secondary px-2.5 py-1.5 rounded-[10px] text-xs font-semibold text-theme-secondary hover:text-theme-primary cursor-pointer"
                      title="Cross-Bureau Coordination Tab"
                    >
                      Overlaps
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export const InstitutionDetailView: React.FC = () => {
  const {
    selectedInstitution,
    institutions,
    setSelectedInstitutionId,
    institutionTab,
    setInstitutionTab,
    cases,
    relations,
    slaConfig,
    openCaseDetail,
    setActiveScreen,
    reviewOverlapRelation,
  } = useCaseSync();

  const instCases = useMemo(
    () =>
      cases.filter(
        (c) => c.institution_id === selectedInstitution.institution_id
      ),
    [cases, selectedInstitution.institution_id]
  );

  const openCases = instCases.filter((c) => c.status !== 'Disposed');
  const involvedBureaus = Array.from(
    new Set(instCases.map((c) => c.current_bureau))
  );

  const instRelations = useMemo(
    () =>
      relations.filter(
        (r) =>
          r.institution_id === selectedInstitution.institution_id ||
          instCases.some((c) => c.id === r.case_id_a || c.id === r.case_id_b)
      ),
    [relations, selectedInstitution.institution_id, instCases]
  );

  const instEvents = useMemo(
    () =>
      instCases
        .flatMap((c) =>
          c.timeline.map((evt) => ({ ...evt, caseSubject: c.title }))
        )
        .sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        ),
    [instCases]
  );

  const exportInstitutionCsv = () => {
    const headers = [
      'Case_ID',
      'AICTE_Permanent_ID',
      'Institution_Name',
      'Bureau_Cell',
      'Status',
      'Priority',
      'Assigned_Officer',
      'Received_Date',
      'Expected_Disposal',
      'Overlap_Status',
    ];
    const rows = instCases.map((c) =>
      [
        c.id,
        c.aicte_permanent_id,
        `"${c.institutionName.replace(/"/g, '""')}"`,
        `"${c.current_bureau}"`,
        c.status,
        c.priority,
        `"${c.assigned_officer}"`,
        c.received_at,
        c.expected_disposal_at,
        `"${c.overlap_status}"`,
      ].join(',')
    );
    const csv = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${selectedInstitution.aicte_permanent_id}_Case_History.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      {/* Top Bar: Back to Registry + Institution Switcher */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <button
          onClick={() => setActiveScreen('institutions')}
          className="neu-btn-secondary px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Institution Registry</span>
        </button>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-theme-secondary">
            Switch Institution:
          </span>
          <select
            aria-label="Select institution profile"
            value={selectedInstitution.institution_id}
            onChange={(e) => setSelectedInstitutionId(e.target.value)}
            className="neu-inset rounded-[12px] px-3 py-1.5 text-xs font-semibold"
          >
            {institutions.map((i) => (
              <option key={i.institution_id} value={i.institution_id}>
                {i.aicte_permanent_id} — {i.name}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Prominent Institution Identity Header */}
      <div className="neu-card rounded-[26px] p-6 sm:p-7 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4 pb-5 border-b border-theme">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs">
              <span className="font-mono-tabular font-bold text-theme-blue px-2.5 py-1 rounded-[8px] neu-inset">
                AICTE Permanent ID: {selectedInstitution.aicte_permanent_id}
              </span>
              <span className="text-theme-secondary">·</span>
              <span className="font-semibold text-theme-secondary">
                {selectedInstitution.region}
              </span>
              <span className="text-theme-secondary">·</span>
              <span className="text-theme-secondary">
                {selectedInstitution.institution_type}
              </span>
            </div>

            <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-theme-primary">
              {selectedInstitution.name}
            </h1>

            <p className="text-xs text-theme-secondary flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-theme-blue shrink-0" />
              <span>
                {selectedInstitution.address}, {selectedInstitution.state}
              </span>
            </p>
          </div>

          {/* Summary Counters */}
          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <div className="neu-elevated rounded-[16px] px-4 py-2.5 text-center">
              <p className="font-mono-tabular text-xl font-extrabold text-theme-primary">
                {instCases.length}
              </p>
              <p className="text-[11px] text-theme-secondary">
                Associated Cases
              </p>
            </div>
            <div className="neu-elevated rounded-[16px] px-4 py-2.5 text-center">
              <p className="font-mono-tabular text-xl font-extrabold text-theme-blue">
                {openCases.length}
              </p>
              <p className="text-[11px] text-theme-secondary">Open Cases</p>
            </div>
            <div className="neu-elevated rounded-[16px] px-4 py-2.5 text-center">
              <p className="font-mono-tabular text-xl font-extrabold text-theme-primary">
                {involvedBureaus.length}
              </p>
              <p className="text-[11px] text-theme-secondary">
                Bureaus Involved
              </p>
            </div>
          </div>
        </div>

        {/* Uncertainty or Overlap Warning Banner if applicable */}
        {(selectedInstitution.verification_status !== 'Verified' ||
          instRelations.some(
            (r) => r.review_status === 'Potential Overlap — Review Required'
          )) && (
          <div className="neu-inset rounded-[18px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 border border-[#C83D50]/30">
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-[#C83D50] dark:text-[#FF7788] shrink-0 mt-0.5" />
              <div className="text-xs space-y-1">
                <p className="font-bold text-theme-primary">
                  {selectedInstitution.verification_status !== 'Verified'
                    ? 'Institution Identity Uncertain — Human Verification Required'
                    : 'Potential Overlapping Cases — Cross-Bureau Coordination Required'}
                </p>
                <p className="text-theme-secondary leading-relaxed">
                  {selectedInstitution.uncertainty_note ||
                    `Active complaints for ${selectedInstitution.name} are being processed simultaneously across ${involvedBureaus.join(' and ')}.`}
                </p>
              </div>
            </div>
            <button
              onClick={() => setInstitutionTab('coordination')}
              className="neu-btn-primary px-4 py-2 rounded-[12px] text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Inspect Cross-Bureau Tab
            </button>
          </div>
        )}

        {/* 5 Required Profile Tabs with Smooth Flicker-Free Sliding Pill Indicator */}
        <div className="neu-inset p-1.5 rounded-[16px] flex flex-wrap items-center gap-1">
          {[
            { id: 'overview', label: '1. Overview' },
            {
              id: 'complaints',
              label: `2. All Complaints (${instCases.length})`,
            },
            {
              id: 'coordination',
              label: `3. Cross-Bureau Coordination (${instRelations.length})`,
            },
            {
              id: 'history',
              label: `4. Action History (${instEvents.length})`,
            },
            { id: 'reports', label: '5. Reports & Export' },
          ].map((t) => {
            const isActive = institutionTab === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() =>
                  setInstitutionTab(
                    t.id as
                      | 'overview'
                      | 'complaints'
                      | 'coordination'
                      | 'history'
                      | 'reports'
                  )
                }
                className={`relative px-4 py-2 rounded-[12px] text-xs font-semibold border border-transparent transition-colors duration-150 cursor-pointer select-none ${
                  isActive
                    ? 'text-white'
                    : 'text-theme-secondary hover:text-theme-primary hover:bg-[var(--bg-elevated)]/60'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="institution-detail-tab-pill"
                    initial={false}
                    transition={{
                      type: 'spring',
                      stiffness: 420,
                      damping: 34,
                      mass: 0.7,
                    }}
                    className="absolute inset-0 rounded-[12px] neu-nav-pill pointer-events-none"
                  />
                )}
                <span className="relative z-10">{t.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      <SubSectionTransition
        transitionKey={`${selectedInstitution.institution_id}-${institutionTab}`}
      >
      {/* TAB 1: Overview */}
      {institutionTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <div className="lg:col-span-5 neu-card rounded-[24px] p-6 space-y-4">
            <h2 className="font-display text-base font-bold text-theme-primary">
              Institutional Metadata &amp; Bureau Footprint
            </h2>
            <div className="space-y-2.5 text-xs">
              <div className="neu-elevated rounded-[14px] p-3 flex justify-between">
                <span className="text-theme-secondary">Established Year</span>
                <span className="font-mono-tabular font-bold text-theme-primary">
                  {selectedInstitution.metadata.establishedYear}
                </span>
              </div>
              <div className="neu-elevated rounded-[14px] p-3 flex justify-between">
                <span className="text-theme-secondary">Approved Intake</span>
                <span className="font-mono-tabular font-bold text-theme-primary">
                  {selectedInstitution.metadata.approvedIntake} seats
                </span>
              </div>
              <div className="neu-elevated rounded-[14px] p-3 flex justify-between gap-4">
                <span className="text-theme-secondary shrink-0">
                  Affiliated University
                </span>
                <span className="font-semibold text-theme-primary text-right">
                  {selectedInstitution.metadata.universityAffiliation}
                </span>
              </div>
              <div className="neu-elevated rounded-[14px] p-3 flex justify-between gap-4">
                <span className="text-theme-secondary shrink-0">
                  Bureaus / Cells Active
                </span>
                <span className="font-semibold text-theme-blue text-right">
                  {involvedBureaus.join(', ')}
                </span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 neu-card rounded-[24px] p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-base font-bold text-theme-primary">
                Consolidated Case Snapshot
              </h2>
              <button
                onClick={() => setInstitutionTab('complaints')}
                className="text-xs font-semibold text-theme-blue hover:underline cursor-pointer"
              >
                View Full Table →
              </button>
            </div>
            <div className="space-y-3">
              {instCases.map((c) => (
                <div
                  key={c.id}
                  onClick={() => openCaseDetail(c.id)}
                  className="neu-elevated rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2 text-xs">
                      <span className="font-mono-tabular font-bold text-theme-blue">
                        {c.id}
                      </span>
                      <span>·</span>
                      <span className="font-semibold text-theme-secondary">
                        {c.current_bureau}
                      </span>
                    </div>
                    <p className="text-xs sm:text-sm font-bold text-theme-primary">
                      {c.title}
                    </p>
                    <p className="text-xs text-theme-secondary">
                      Next Action: {c.next_action_required}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <StatusBadge status={c.status} />
                    <OverlapBadge status={c.overlap_status} compact />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: All Complaints */}
      {institutionTab === 'complaints' && (
        <div className="neu-card rounded-[24px] p-6 overflow-x-auto">
          <h2 className="font-display text-base font-bold text-theme-primary mb-4">
            All Complaints Linked to {selectedInstitution.name}
          </h2>
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-theme text-theme-secondary">
                <th className="py-3 pr-3">Case ID</th>
                <th className="py-3 px-3">Subject</th>
                <th className="py-3 px-3">Bureau / Cell</th>
                <th className="py-3 px-3">Assigned Officer</th>
                <th className="py-3 px-3">Priority</th>
                <th className="py-3 px-3">Status</th>
                <th className="py-3 px-3">Deadline</th>
                <th className="py-3 pl-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y border-theme">
              {instCases.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => openCaseDetail(c.id)}
                  className="hover:bg-[var(--bg-elevated)]/70 cursor-pointer"
                >
                  <td className="py-3.5 pr-3 font-mono-tabular font-bold text-theme-blue">
                    {c.id}
                  </td>
                  <td className="py-3.5 px-3 font-semibold text-theme-primary max-w-[260px]">
                    {c.title}
                  </td>
                  <td className="py-3.5 px-3 text-theme-primary">
                    {c.current_bureau}
                  </td>
                  <td className="py-3.5 px-3 text-theme-secondary">
                    {c.assigned_officer}
                  </td>
                  <td className="py-3.5 px-3">
                    <PriorityIndicator priority={c.priority} />
                  </td>
                  <td className="py-3.5 px-3">
                    <StatusBadge status={c.status} />
                  </td>
                  <td className="py-3.5 px-3">
                    <DeadlineBadge
                      state={computeDeadlineState(
                        c,
                        slaConfig.dueSoonDaysThreshold
                      )}
                    />
                  </td>
                  <td className="py-3.5 pl-3 text-right">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openCaseDetail(c.id);
                      }}
                      className="neu-btn-secondary px-3 py-1.5 rounded-[10px] font-semibold text-theme-blue cursor-pointer"
                    >
                      Inspect
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: Cross-Bureau Coordination (Side-by-Side Comparison) */}
      {institutionTab === 'coordination' && (
        <div className="space-y-6">
          {instRelations.length === 0 ? (
            <div className="neu-card rounded-[24px] p-8 text-center text-xs text-theme-secondary">
              No cross-Bureau overlap relationships flagged for this
              institution. All linked complaints are single-Bureau matters.
            </div>
          ) : (
            instRelations.map((rel) => {
              const caseA = cases.find((c) => c.id === rel.case_id_a);
              const caseB = cases.find((c) => c.id === rel.case_id_b);
              return (
                <div
                  key={rel.relation_id}
                  className="neu-card rounded-[24px] p-6 space-y-5"
                >
                  <div className="flex flex-wrap items-center justify-between gap-3 pb-4 border-b border-theme">
                    <div>
                      <span className="font-mono-tabular text-xs font-bold text-theme-blue">
                        {rel.relation_id} · {rel.relation_type}
                      </span>
                      <h3 className="font-display text-lg font-bold text-theme-primary mt-0.5">
                        Side-by-Side Bureau Comparison ({rel.case_id_a} vs{' '}
                        {rel.case_id_b})
                      </h3>
                    </div>
                    <OverlapBadge status={rel.review_status} />
                  </div>

                  {/* Side-by-Side Cards */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {[caseA, caseB].map(
                      (item, idx) =>
                        item && (
                          <div
                            key={item.id}
                            className="neu-elevated rounded-[18px] p-4 space-y-2.5"
                          >
                            <div className="flex items-center justify-between">
                              <span className="font-mono-tabular text-xs font-bold text-theme-blue">
                                {item.id} (Case {idx === 0 ? 'A' : 'B'})
                              </span>
                              <StatusBadge status={item.status} />
                            </div>
                            <p className="text-sm font-bold text-theme-primary">
                              {item.title}
                            </p>
                            <p className="text-xs text-theme-secondary leading-relaxed">
                              {item.description}
                            </p>
                            <div className="pt-2 border-t border-theme text-xs space-y-1">
                              <p>
                                <strong className="text-theme-secondary">
                                  Bureau:
                                </strong>{' '}
                                <span className="font-semibold text-theme-primary">
                                  {item.current_bureau}
                                </span>
                              </p>
                              <p>
                                <strong className="text-theme-secondary">
                                  Officer:
                                </strong>{' '}
                                {item.assigned_officer}
                              </p>
                              <p>
                                <strong className="text-theme-secondary">
                                  Latest Action:
                                </strong>{' '}
                                {item.last_action_taken}
                              </p>
                            </div>
                          </div>
                        )
                    )}
                  </div>

                  <div className="neu-inset rounded-[16px] p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1">
                      <p className="font-bold text-theme-primary">
                        Matching Evidence ({rel.match_method} · Score:{' '}
                        {rel.match_score}%)
                      </p>
                      <p className="text-theme-secondary">{rel.why_raised}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      <button
                        onClick={() =>
                          reviewOverlapRelation(
                            rel.relation_id,
                            'Confirmed Related Cases',
                            'Confirmed related cases via Institution Profile Cross-Bureau tab.'
                          )
                        }
                        className="neu-btn-primary px-3.5 py-2 rounded-[10px] font-semibold cursor-pointer"
                      >
                        Confirm Related
                      </button>
                      <button
                        onClick={() =>
                          reviewOverlapRelation(
                            rel.relation_id,
                            'Not Related — Reviewed',
                            'Reviewed and marked as separate unrelated matters.'
                          )
                        }
                        className="neu-btn-secondary px-3.5 py-2 rounded-[10px] font-semibold cursor-pointer"
                      >
                        Mark Separate Matters
                      </button>
                    </div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}

      {/* TAB 4: Action History */}
      {institutionTab === 'history' && (
        <div className="neu-card rounded-[24px] p-6 space-y-4">
          <h2 className="font-display text-base font-bold text-theme-primary">
            Consolidated Chronological Action History Across All Bureaus
          </h2>
          <div className="space-y-3">
            {instEvents.map((evt) => (
              <div
                key={evt.action_id}
                onClick={() => openCaseDetail(evt.case_id)}
                className="neu-elevated rounded-[16px] p-4 flex items-start justify-between gap-4 cursor-pointer hover:border-[var(--primary-blue)] transition-colors"
              >
                <div className="space-y-1 text-xs">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono-tabular font-bold text-theme-blue">
                      {evt.case_id}
                    </span>
                    <span>·</span>
                    <span className="font-bold text-theme-primary">
                      {evt.action_type}
                    </span>
                    <span>·</span>
                    <span className="text-theme-secondary">{evt.bureau}</span>
                  </div>
                  <p className="text-theme-primary font-medium">
                    {evt.remarks}
                  </p>
                  <p className="text-[11px] text-theme-secondary">
                    Actor: {evt.actor} ({evt.actor_role})
                  </p>
                </div>
                <span className="font-mono-tabular text-xs text-theme-secondary shrink-0">
                  {formatDateTime(evt.timestamp)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 5: Reports & Export */}
      {institutionTab === 'reports' && (
        <div className="neu-card rounded-[24px] p-6 space-y-5">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="font-display text-base font-bold text-theme-primary">
                Institution Case Summary Report
              </h2>
              <p className="text-xs text-theme-secondary">
                Consolidated summary for {selectedInstitution.name} (
                {selectedInstitution.aicte_permanent_id}).
              </p>
            </div>
            <button
              onClick={exportInstitutionCsv}
              className="neu-btn-primary px-4 py-2.5 rounded-[12px] text-xs font-semibold inline-flex items-center gap-2 cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Export Institution CSV</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            <div className="neu-elevated rounded-[16px] p-4">
              <p className="text-theme-secondary">Status Breakdown</p>
              <p className="font-mono-tabular text-sm font-bold text-theme-primary mt-2">
                Pending/Received:{' '}
                {
                  instCases.filter(
                    (c) => c.status === 'Pending' || c.status === 'Received'
                  ).length
                }{' '}
                · Under Process:{' '}
                {instCases.filter((c) => c.status === 'Under Process').length} ·
                Disposed:{' '}
                {instCases.filter((c) => c.status === 'Disposed').length}
              </p>
            </div>
            <div className="neu-elevated rounded-[16px] p-4">
              <p className="text-theme-secondary">Bureaus Involved</p>
              <p className="font-semibold text-theme-primary mt-2">
                {involvedBureaus.join(' · ') || 'None'}
              </p>
            </div>
            <div className="neu-elevated rounded-[16px] p-4">
              <p className="text-theme-secondary">Cross-Bureau Overlaps</p>
              <p className="font-mono-tabular text-sm font-bold text-theme-blue mt-2">
                {instRelations.length} relationship record(s) evaluated
              </p>
            </div>
          </div>
        </div>
      )}
      </SubSectionTransition>
    </div>
  );
};
