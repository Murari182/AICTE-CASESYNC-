import React, { useMemo, useState } from 'react';
import {
  ArrowUpDown,
  Building2,
  Calendar,
  Download,
  Eye,
  Filter,
  FolderSearch,
  GitCompare,
  Plus,
  Search,
  X,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { computeDeadlineState } from '../../data/seedData';
import { BureauCell, CaseStatus, OverlapStatus, Priority } from '../../types/casesync';
import {
  DeadlineBadge,
  OverlapBadge,
  PriorityIndicator,
  StatusBadge,
  exportCasesToCsv,
} from '../ui/SharedComponents';

const ALL_BUREAUS: BureauCell[] = [
  'Regulation Bureau (RB)',
  'Public Grievance Redressal Cell (PGRC)',
  'Approval Bureau (AB)',
  'Faculty Grievance Cell (FGC)',
  'Regional Office (SWRO)',
  'Regional Office (NWRO)',
  'Regional Office (SRO)',
  'Regional Office (ERO)',
];

const ALL_STATUSES: CaseStatus[] = [
  'Received',
  'Pending',
  'Under Process',
  'Transferred',
  'Escalated',
  'Disposed',
];

const ALL_PRIORITIES: Priority[] = ['Critical', 'High', 'Medium', 'Low'];

const ALL_OVERLAP_STATUSES: OverlapStatus[] = [
  'Potential Overlap — Review Required',
  'Confirmed Related Cases',
  'Institution Identity Uncertain',
  'Not Related — Reviewed',
  'No Overlap',
];

export const CaseManagementView: React.FC = () => {
  const {
    cases,
    institutions,
    slaConfig,
    caseListStatusFilter,
    setCaseListStatusFilter,
    openCaseDetail,
    openInstitutionProfile,
    setActiveScreen,
    createComplaintCase,
    roleProfile,
    addToast,
  } = useCaseSync();

  const [searchQuery, setSearchQuery] = useState('');
  const [bureauFilter, setBureauFilter] = useState('ALL');
  const [regionFilter, setRegionFilter] = useState('ALL');
  const [categoryFilter, setCategoryFilter] = useState('ALL');
  const [priorityFilter, setPriorityFilter] = useState('ALL');
  const [overlapFilter, setOverlapFilter] = useState('ALL');
  const [officerFilter, setOfficerFilter] = useState('ALL');
  const [dateFilterField, setDateFilterField] = useState<'created' | 'activity'>(
    'created'
  );
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [sortBy, setSortBy] = useState<
    'newest' | 'activity' | 'priority' | 'disposal'
  >('newest');

  // New Complaint Modal State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedInstId, setSelectedInstId] = useState(institutions[0]?.institution_id || 'INST-101');
  const [customInstName, setCustomInstName] = useState('');
  const [customPid, setCustomPid] = useState('');
  const [useCustomInst, setUseCustomInst] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [submittedBy, setSubmittedBy] = useState(roleProfile.displayName);

  const uniqueCategories = useMemo(
    () => Array.from(new Set(cases.map((c) => c.category))),
    [cases]
  );

  const uniqueOfficers = useMemo(
    () => Array.from(new Set(cases.map((c) => c.assigned_officer))),
    [cases]
  );

  const uniqueRegions = useMemo(
    () => Array.from(new Set(cases.map((c) => c.region))),
    [cases]
  );

  const filteredCases = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    const list = cases.filter((c) => {
      const deadlineState = computeDeadlineState(
        c.expected_disposal_at,
        c.status,
        slaConfig
      );

      // Status or Overdue filter
      if (caseListStatusFilter && caseListStatusFilter !== 'ALL') {
        if (caseListStatusFilter === 'OVERDUE') {
          if (deadlineState !== 'Overdue') return false;
        } else if (c.status !== caseListStatusFilter) {
          return false;
        }
      }

      if (bureauFilter !== 'ALL' && c.current_bureau !== bureauFilter) return false;
      if (regionFilter !== 'ALL' && c.region !== regionFilter) return false;
      if (categoryFilter !== 'ALL' && c.category !== categoryFilter) return false;
      if (priorityFilter !== 'ALL' && c.priority !== priorityFilter) return false;
      if (overlapFilter !== 'ALL' && c.overlap_status !== overlapFilter) return false;
      if (officerFilter !== 'ALL' && c.assigned_officer !== officerFilter) return false;

      // Date Range Filter on 'Date Created' (received_at / createdAt) or 'Last Activity' (last_action_at / updatedAt)
      if (startDate || endDate) {
        const targetIso =
          dateFilterField === 'created'
            ? c.received_at || c.createdAt
            : c.last_action_at || c.updatedAt;
        const targetMs = new Date(targetIso).getTime();
        if (!Number.isNaN(targetMs)) {
          if (startDate) {
            const startMs = new Date(`${startDate}T00:00:00.000Z`).getTime();
            if (targetMs < startMs) return false;
          }
          if (endDate) {
            const endMs = new Date(`${endDate}T23:59:59.999Z`).getTime();
            if (targetMs > endMs) return false;
          }
        }
      }

      if (!q) return true;
      return (
        c.id.toLowerCase().includes(q) ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.institutionName.toLowerCase().includes(q) ||
        c.aicte_permanent_id.toLowerCase().includes(q) ||
        c.current_bureau.toLowerCase().includes(q) ||
        c.assigned_officer.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q)
      );
    });

    const priorityRank: Record<Priority, number> = {
      Critical: 4,
      High: 3,
      Medium: 2,
      Low: 1,
    };

    return [...list].sort((a, b) => {
      if (sortBy === 'priority') {
        return priorityRank[b.priority] - priorityRank[a.priority];
      }
      if (sortBy === 'disposal') {
        return (
          new Date(a.expected_disposal_at).getTime() -
          new Date(b.expected_disposal_at).getTime()
        );
      }
      if (sortBy === 'activity') {
        return (
          new Date(b.last_action_at || b.updatedAt).getTime() -
          new Date(a.last_action_at || a.updatedAt).getTime()
        );
      }
      return (
        new Date(b.received_at).getTime() - new Date(a.received_at).getTime()
      );
    });
  }, [
    cases,
    searchQuery,
    caseListStatusFilter,
    bureauFilter,
    regionFilter,
    categoryFilter,
    priorityFilter,
    overlapFilter,
    officerFilter,
    dateFilterField,
    startDate,
    endDate,
    sortBy,
    slaConfig,
  ]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setCaseListStatusFilter('ALL');
    setBureauFilter('ALL');
    setRegionFilter('ALL');
    setCategoryFilter('ALL');
    setPriorityFilter('ALL');
    setOverlapFilter('ALL');
    setOfficerFilter('ALL');
    setStartDate('');
    setEndDate('');
  };

  const exportFilteredTableToCsv = () => {
    if (filteredCases.length === 0) return;
    exportCasesToCsv(
      filteredCases,
      'AICTE_CaseSync_Filtered_Complaint_Cases',
      slaConfig
    );
    addToast(
      'Filtered Case Table Exported to CSV',
      `Exported ${filteredCases.length} currently visible case record(s) (of ${cases.length} total) matching active search and filter criteria.`
    );
  };

  const handleCreateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newDesc.trim()) return;

    const chosenInst = institutions.find((i) => i.institution_id === selectedInstId);
    const created = createComplaintCase({
      title: newTitle,
      description: newDesc,
      institutionId: useCustomInst ? undefined : chosenInst?.institution_id,
      institutionName: useCustomInst
        ? customInstName.trim() || 'Unverified Technical Institution'
        : chosenInst?.name || '',
      aictePermanentId: useCustomInst
        ? customPid.trim() || 'PID-UNVERIFIED'
        : chosenInst?.aicte_permanent_id || '',
      submittedBy: submittedBy.trim() || roleProfile.displayName,
    });

    setShowCreateModal(false);
    setNewTitle('');
    setNewDesc('');
    openCaseDetail(created.id);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <FolderSearch className="w-3.5 h-3.5" />
            Consolidated Complaint Register • Cross-Bureau Case Ledger
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Complaint Case Management
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Search, filter, and track complaints across Regulation Bureau, PGRC, Approval Bureau, and Regional Offices.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={exportFilteredTableToCsv}
            disabled={filteredCases.length === 0}
            className="neu-btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--accent-blue)] disabled:opacity-50 cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            Export Filtered CSV ({filteredCases.length})
          </button>
          <button
            onClick={() => setActiveScreen('overlaps')}
            className="neu-btn-secondary px-3.5 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <GitCompare className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            Overlap Detection Queue
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="neu-btn-primary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
          >
            <Plus className="w-4 h-4" />
            Log New Complaint
          </button>
        </div>
      </div>

      {/* Comprehensive Search & Multi-Facet Filter Bar */}
      <div className="neu-card rounded-2xl p-4 sm:p-5 space-y-4">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 text-[var(--text-muted)] absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Case ID (CMP-2026-0142), AICTE Permanent ID (1-482910421), Institution, Subject, or Officer..."
              aria-label="Search complaint register"
              className="neu-inset w-full pl-10 pr-9 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-[#3478F6]/30"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--text-primary)]"
                title="Clear search"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <div className="inline-flex items-center gap-1.5 text-xs text-[var(--text-secondary)]">
              <ArrowUpDown className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
              <span className="font-semibold">Sort:</span>
            </div>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
              aria-label="Sort complaints"
              className="neu-inset px-3 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="newest">Date Created (Newest First)</option>
              <option value="activity">Last Activity (Most Recent)</option>
              <option value="priority">Priority Severity</option>
              <option value="disposal">Expected Disposal Date</option>
            </select>
            <button
              onClick={clearAllFilters}
              className="neu-btn-secondary px-3 py-2 rounded-xl text-xs font-semibold"
            >
              Reset Filters
            </button>
          </div>
        </div>

        {/* Status Quick Filter Bar */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {[
            { id: 'ALL', label: 'All Cases' },
            ...ALL_STATUSES.map((s) => ({ id: s, label: s })),
            { id: 'OVERDUE', label: 'Overdue SLA' },
          ].map((tab) => {
            const active = caseListStatusFilter === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setCaseListStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  active
                    ? 'neu-btn-primary shadow-sm'
                    : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border border-[var(--border-subtle)] hover:text-[var(--text-primary)]'
                }`}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-2.5 pt-2 border-t border-[var(--border-subtle)]">
          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Bureau / Cell
            </label>
            <select
              value={bureauFilter}
              onChange={(e) => setBureauFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Bureaus & Cells</option>
              {ALL_BUREAUS.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Region
            </label>
            <select
              value={regionFilter}
              onChange={(e) => setRegionFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
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
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Category
            </label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Categories</option>
              {uniqueCategories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Priority
            </label>
            <select
              value={priorityFilter}
              onChange={(e) => setPriorityFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Priorities</option>
              {ALL_PRIORITIES.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Overlap Status
            </label>
            <select
              value={overlapFilter}
              onChange={(e) => setOverlapFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Overlap States</option>
              {ALL_OVERLAP_STATUSES.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1">
              Assigned Officer
            </label>
            <select
              value={officerFilter}
              onChange={(e) => setOfficerFilter(e.target.value)}
              className="neu-inset w-full px-2.5 py-2 rounded-xl text-xs font-medium focus:outline-none"
            >
              <option value="ALL">All Officers</option>
              {uniqueOfficers.map((o) => (
                <option key={o} value={o}>
                  {o}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Date-Range Picker Controls (Date Created vs Last Activity) */}
        <div className="pt-3 border-t border-[var(--border-subtle)] flex flex-col lg:flex-row lg:items-end justify-between gap-3">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 flex-1">
            <div>
              <label
                htmlFor="date-filter-field"
                className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
              >
                Timestamp Basis
              </label>
              <div className="relative">
                <Calendar className="w-3.5 h-3.5 text-[var(--accent-blue)] absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <select
                  id="date-filter-field"
                  value={dateFilterField}
                  onChange={(e) =>
                    setDateFilterField(e.target.value as 'created' | 'activity')
                  }
                  className="neu-inset w-full pl-8 pr-2.5 py-2 rounded-xl text-xs font-semibold focus:outline-none"
                >
                  <option value="created">Date Created (Receipt Date)</option>
                  <option value="activity">Last Activity (Updated)</option>
                </select>
              </div>
            </div>

            <div>
              <label
                htmlFor="filter-start-date"
                className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
              >
                From Date
              </label>
              <input
                id="filter-start-date"
                type="date"
                value={startDate}
                max={endDate || undefined}
                onChange={(e) => setStartDate(e.target.value)}
                className="neu-inset w-full px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>

            <div>
              <label
                htmlFor="filter-end-date"
                className="block text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1"
              >
                To Date
              </label>
              <input
                id="filter-end-date"
                type="date"
                value={endDate}
                min={startDate || undefined}
                onChange={(e) => setEndDate(e.target.value)}
                className="neu-inset w-full px-3 py-2 rounded-xl text-xs font-mono focus:outline-none"
              />
            </div>
          </div>

          {/* Quick Date Range Presets */}
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] mr-1">
              Quick Range:
            </span>
            <button
              type="button"
              onClick={() => {
                setStartDate('2026-10-23');
                setEndDate('2026-10-26');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                startDate === '2026-10-23' && endDate === '2026-10-26'
                  ? 'neu-btn-primary'
                  : 'neu-btn-secondary'
              }`}
            >
              Last 3 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('2026-10-19');
                setEndDate('2026-10-26');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                startDate === '2026-10-19' && endDate === '2026-10-26'
                  ? 'neu-btn-primary'
                  : 'neu-btn-secondary'
              }`}
            >
              Last 7 Days
            </button>
            <button
              type="button"
              onClick={() => {
                setStartDate('2026-10-01');
                setEndDate('2026-10-31');
              }}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${
                startDate === '2026-10-01' && endDate === '2026-10-31'
                  ? 'neu-btn-primary'
                  : 'neu-btn-secondary'
              }`}
            >
              Oct 2026
            </button>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-[var(--status-critical)] bg-[var(--bg-elevated)] border border-[var(--border-subtle)] inline-flex items-center gap-1"
              >
                <X className="w-3 h-3" />
                Clear Dates
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Results Table */}
      <div className="neu-card rounded-2xl overflow-hidden">
        <div className="px-5 py-3.5 border-b border-[var(--border-subtle)] flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-secondary)]">
            <Filter className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
            Showing <span className="font-bold text-[var(--text-primary)]">{filteredCases.length}</span> of{' '}
            {cases.length} complaint records
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[11px] text-[var(--text-muted)] hidden sm:inline">
              Illustrative SIH Demonstration Dataset
            </span>
            <button
              type="button"
              onClick={exportFilteredTableToCsv}
              disabled={filteredCases.length === 0}
              className="neu-btn-secondary px-3 py-1.5 rounded-lg text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--accent-blue)] disabled:opacity-50 cursor-pointer"
            >
              <Download className="w-3.5 h-3.5" />
              Export Filtered CSV ({filteredCases.length})
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase tracking-wider text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                <th className="py-3.5 px-4">Case ID & Receipt</th>
                <th className="py-3.5 px-4">Institution & PID</th>
                <th className="py-3.5 px-4">Complaint Subject & Category</th>
                <th className="py-3.5 px-4">Bureau & Officer</th>
                <th className="py-3.5 px-4">Status & Priority</th>
                <th className="py-3.5 px-4">Overlap & Linked IDs</th>
                <th className="py-3.5 px-4">Disposal SLA</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--border-subtle)] text-xs">
              {filteredCases.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-10 text-center text-[var(--text-secondary)]">
                    No complaint records match the active search or filter criteria.
                  </td>
                </tr>
              ) : (
                filteredCases.map((c) => {
                  const deadline = computeDeadlineState(
                    c.expected_disposal_at,
                    c.status,
                    slaConfig
                  );
                  return (
                    <tr
                      key={c.id}
                      onClick={() => openCaseDetail(c.id)}
                      className="hover:bg-[var(--bg-elevated)] transition-colors cursor-pointer"
                    >
                      <td className="py-3.5 px-4 whitespace-nowrap align-top">
                        <div className="font-mono font-bold text-[var(--accent-blue)]">
                          {c.id}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                          Created:{' '}
                          {new Date(c.received_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                        <div className="text-[10px] text-[var(--text-secondary)] mt-0.5">
                          Activity:{' '}
                          {new Date(
                            c.last_action_at || c.updatedAt
                          ).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                            year: 'numeric',
                          })}
                        </div>
                      </td>

                      <td
                        className="py-3.5 px-4 align-top max-w-[210px]"
                        onClick={(e) => {
                          e.stopPropagation();
                          openInstitutionProfile(c.institution_id);
                        }}
                      >
                        <div className="font-semibold text-[var(--text-primary)] hover:text-[var(--accent-blue)] transition-colors line-clamp-1">
                          {c.institutionName}
                        </div>
                        <div className="text-[11px] font-mono text-[var(--text-muted)] flex items-center gap-1 mt-0.5">
                          <Building2 className="w-3 h-3" />
                          {c.aicte_permanent_id}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top max-w-[260px]">
                        <div className="font-semibold text-[var(--text-primary)] line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {c.category}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="font-semibold text-[var(--text-primary)]">
                          {c.current_bureau}
                        </div>
                        <div className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                          {c.assigned_officer}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <div className="flex flex-col items-start gap-1.5">
                          <StatusBadge status={c.status} />
                          <PriorityIndicator priority={c.priority} />
                        </div>
                      </td>

                      <td className="py-3.5 px-4 align-top">
                        <OverlapBadge status={c.overlap_status} />
                        {c.linked_case_ids.length > 0 && (
                          <div className="text-[10px] font-mono text-[var(--text-muted)] mt-1">
                            Linked: {c.linked_case_ids.join(', ')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4 align-top whitespace-nowrap">
                        <DeadlineBadge state={deadline} />
                        <div className="text-[10px] text-[var(--text-muted)] mt-1">
                          Due:{' '}
                          {new Date(c.expected_disposal_at).toLocaleDateString('en-IN', {
                            day: '2-digit',
                            month: 'short',
                          })}
                        </div>
                      </td>

                      <td
                        className="py-3.5 px-4 align-top text-right whitespace-nowrap"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => openCaseDetail(c.id)}
                          className="neu-btn-secondary px-2.5 py-1.5 rounded-lg text-[11px] font-semibold inline-flex items-center gap-1 text-[var(--accent-blue)]"
                        >
                          <Eye className="w-3 h-3" />
                          Open
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

      {/* Log New Complaint Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-card rounded-2xl max-w-2xl w-full p-6 space-y-5 max-h-[90vh] overflow-y-auto">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border-subtle)] pb-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[var(--accent-blue)]">
                  Single-Window Complaint Intake
                </span>
                <h2 className="text-lg font-bold text-[var(--text-primary)] mt-0.5">
                  Log New Institutional Complaint
                </h2>
                <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                  Automatically resolves institution identity by AICTE Permanent ID and checks for cross-Bureau overlaps.
                </p>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setUseCustomInst(false)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    !useCustomInst
                      ? 'neu-btn-primary'
                      : 'neu-btn-secondary'
                  }`}
                >
                  Select Registered Institution
                </button>
                <button
                  type="button"
                  onClick={() => setUseCustomInst(true)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${
                    useCustomInst
                      ? 'neu-btn-primary'
                      : 'neu-btn-secondary'
                  }`}
                >
                  Enter Unverified / Missing PID Institution
                </button>
              </div>

              {!useCustomInst ? (
                <div>
                  <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                    Target Institution (AICTE Registry)
                  </label>
                  <select
                    value={selectedInstId}
                    onChange={(e) => setSelectedInstId(e.target.value)}
                    className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                  >
                    {institutions.map((inst) => (
                      <option key={inst.institution_id} value={inst.institution_id}>
                        {inst.name} ({inst.aicte_permanent_id}) — {inst.region}
                      </option>
                    ))}
                  </select>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      Institution Name (as reported)
                    </label>
                    <input
                      type="text"
                      value={customInstName}
                      onChange={(e) => setCustomInstName(e.target.value)}
                      placeholder="e.g., Apex Tech Campus, Pune"
                      required
                      className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                      AICTE Permanent ID (if known)
                    </label>
                    <input
                      type="text"
                      value={customPid}
                      onChange={(e) => setCustomPid(e.target.value)}
                      placeholder="e.g., 1-482910421 or leave blank"
                      className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Complaint Subject
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., Non-refund of tuition fee and retention of original certificates"
                  required
                  className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Detailed Complaint Description
                </label>
                <textarea
                  rows={4}
                  value={newDesc}
                  onChange={(e) => setNewDesc(e.target.value)}
                  placeholder="Describe the grievance or regulatory violation, affected students/faculty, and dates..."
                  required
                  className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[var(--text-primary)] mb-1.5">
                  Complainant / Submitter Reference
                </label>
                <input
                  type="text"
                  value={submittedBy}
                  onChange={(e) => setSubmittedBy(e.target.value)}
                  className="neu-inset w-full px-3.5 py-2.5 rounded-xl text-xs sm:text-sm focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-[var(--border-subtle)]">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="neu-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-5 py-2 rounded-xl text-xs font-semibold"
                >
                  Register & Check Cross-Bureau Overlap
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
