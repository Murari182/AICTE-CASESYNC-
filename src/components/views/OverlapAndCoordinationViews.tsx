import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  AlertTriangle,
  Building2,
  CheckCircle2,
  Eye,
  GitCompare,
  Layers,
  ShieldCheck,
  Users,
  XCircle,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { CoordinationRecord, OverlapStatus } from '../../types/casesync';
import {
  ConfidenceRing,
  OverlapBadge,
  PriorityIndicator,
  StatusBadge,
  SubSectionTransition,
} from '../ui/SharedComponents';

export const OverlapDetectionView: React.FC = () => {
  const {
    relations,
    cases,
    roleProfile,
    activeRole,
    reviewOverlapRelation,
    openCaseDetail,
    openInstitutionProfile,
    setActiveScreen,
  } = useCaseSync();

  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [selectedRelationId, setSelectedRelationId] = useState<string>(
    relations[0]?.relation_id || 'REL-001'
  );
  const [reviewRemark, setReviewRemark] = useState('');
  const [coordOwnerInput, setCoordOwnerInput] = useState('');
  const [nextActionInput, setNextActionInput] = useState('');

  const filteredRelations = relations.filter((rel) => {
    if (statusFilter === 'ALL') return true;
    return rel.review_status === statusFilter;
  });

  const activeRelation =
    relations.find((r) => r.relation_id === selectedRelationId) ||
    filteredRelations[0] ||
    relations[0];

  React.useEffect(() => {
    if (activeRelation) {
      setCoordOwnerInput(activeRelation.coordination_owner);
      setNextActionInput(activeRelation.next_required_action);
      setReviewRemark('');
    }
  }, [activeRelation]);

  const caseA = cases.find((c) => c.id === activeRelation?.case_id_a);
  const caseB = cases.find((c) => c.id === activeRelation?.case_id_b);

  const handleDecision = (decision: OverlapStatus) => {
    if (!activeRelation) return;
    reviewOverlapRelation(
      activeRelation.relation_id,
      decision,
      reviewRemark ||
        `Human officer review completed (${decision}) by ${roleProfile.displayName}.`,
      coordOwnerInput,
      nextActionInput
    );
    setReviewRemark('');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <GitCompare className="w-3.5 h-3.5" />
            Core Innovation • 5-Layer Cross-Bureau Overlap Detection
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Cross-Bureau Overlap Detection & Human Review
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Identify institution-level coordination needs across RB, PGRC, AB, FGC, and Regional Offices without automatically merging separate case IDs.
          </p>
        </div>

        <button
          onClick={() => setActiveScreen('coordination')}
          className="neu-btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 self-start"
        >
          <Users className="w-4 h-4 text-[var(--accent-blue)]" />
          Open Bureau Coordination Workspace
        </button>
      </div>

      {/* 5-Layer Architecture Banner */}
      <div className="neu-card rounded-2xl p-4 sm:p-5">
        <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-[var(--accent-blue)] mb-3">
          <Layers className="w-4 h-4" />
          Layered Institution & Case Relationship Pipeline
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 text-xs">
          {[
            {
              step: 'Layer 1',
              title: 'Institution Identity',
              desc: 'Exact AICTE Permanent ID match first; fuzzy name/address normalization flagged for human verification.',
            },
            {
              step: 'Layer 2',
              title: 'Relationship Assessment',
              desc: 'Evaluates complaint category, normalized subject, Bureau history, and active workflow states.',
            },
            {
              step: 'Layer 3',
              title: 'Cross-Bureau Rules',
              desc: 'Detects simultaneous RB & PGRC action or unacknowledged transfer handoffs on the same institution.',
            },
            {
              step: 'Layer 4',
              title: 'Risk & Confidence',
              desc: 'Assigns transparent match signals without treating similarity score as verified duplication.',
            },
            {
              step: 'Layer 5',
              title: 'Human Officer Review',
              desc: 'Confirm, reject, or mark as separate matters while preserving independent Case IDs.',
            },
          ].map((item) => (
            <div key={item.step} className="neu-inset rounded-xl p-3 space-y-1">
              <div className="font-mono text-[10px] font-bold text-[var(--accent-blue)] uppercase">
                {item.step}
              </div>
              <div className="font-bold text-[var(--text-primary)]">{item.title}</div>
              <p className="text-[11px] text-[var(--text-secondary)] leading-relaxed">
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter Pills with Smooth Sliding Pill Indicator */}
      <div className="flex flex-wrap items-center gap-2">
        {[
          { id: 'ALL', label: `All Candidate Pairs (${relations.length})` },
          {
            id: 'Potential Overlap — Review Required',
            label: 'Potential Overlap — Review Required',
          },
          {
            id: 'Confirmed Related Cases',
            label: 'Confirmed Related Cases',
          },
          {
            id: 'Institution Identity Uncertain',
            label: 'Institution Identity Uncertain',
          },
          {
            id: 'Not Related — Reviewed',
            label: 'Same Institution, Distinct Issues',
          },
        ].map((pill) => {
          const isActive = statusFilter === pill.id;
          return (
            <button
              key={pill.id}
              onClick={() => setStatusFilter(pill.id)}
              className={`relative px-3.5 py-2 rounded-xl text-xs font-semibold transition-colors duration-200 cursor-pointer ${
                isActive ? 'text-white' : 'neu-btn-secondary'
              }`}
            >
              {isActive && (
                <motion.span
                  layoutId="overlap-filter-active-pill"
                  transition={{
                    duration: 0.22,
                    ease: [0.22, 1, 0.36, 1],
                  }}
                  className="absolute inset-0 rounded-xl neu-btn-primary"
                />
              )}
              <span className="relative z-10">{pill.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Split View: Candidate Pairs Queue + Detailed Comparison & Review */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left List (5 cols) */}
        <div className="lg:col-span-5 space-y-3">
          {filteredRelations.map((rel) => {
            const selected = rel.relation_id === activeRelation?.relation_id;
            return (
              <div
                key={rel.relation_id}
                onClick={() => setSelectedRelationId(rel.relation_id)}
                className={`neu-card rounded-2xl p-4 cursor-pointer transition-all space-y-2.5 ${
                  selected
                    ? 'ring-2 ring-[#3478F6] border-[#3478F6]'
                    : 'hover:border-[var(--accent-blue)]'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-mono text-xs font-bold text-[var(--accent-blue)]">
                    {rel.relation_id} • {rel.case_id_a} ↔ {rel.case_id_b}
                  </span>
                  <OverlapBadge status={rel.review_status} />
                </div>

                <div>
                  <div className="text-sm font-bold text-[var(--text-primary)]">
                    {rel.institution_name}
                  </div>
                  <div className="text-[11px] font-mono text-[var(--text-muted)]">
                    AICTE PID: {rel.aicte_permanent_id}
                  </div>
                </div>

                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  {rel.relation_type}
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-[var(--border-subtle)] text-[11px] text-[var(--text-muted)]">
                  <span>
                    {rel.bureau_a.split(' ')[0]} + {rel.bureau_b.split(' ')[0]}
                  </span>
                  <span className="font-mono font-semibold text-[var(--text-primary)]">
                    Match Score: {rel.match_score}%
                  </span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Right Detail & Side-by-Side Comparison (7 cols) with SubSectionTransition */}
        {activeRelation && (
          <div className="lg:col-span-7 space-y-5">
            <SubSectionTransition transitionKey={activeRelation.relation_id}>
            <div className="neu-card rounded-2xl p-6 space-y-5">
              {/* Banner */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="flex flex-wrap items-center gap-2 mb-1">
                    <span className="font-mono text-xs font-bold text-[var(--accent-blue)]">
                      {activeRelation.relation_id}
                    </span>
                    <OverlapBadge status={activeRelation.review_status} />
                  </div>
                  <h2 className="text-lg font-bold text-[var(--text-primary)]">
                    {activeRelation.relation_type}
                  </h2>
                  <button
                    onClick={() => openInstitutionProfile(activeRelation.institution_id)}
                    className="text-xs font-semibold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1 mt-1"
                  >
                    <Building2 className="w-3.5 h-3.5" />
                    {activeRelation.institution_name} ({activeRelation.aicte_permanent_id})
                  </button>
                </div>

                <div className="flex items-center gap-3 neu-inset px-4 py-2.5 rounded-xl">
                  <ConfidenceRing value={activeRelation.match_score} size={46} />
                  <div className="text-xs">
                    <div className="font-bold text-[var(--text-primary)]">
                      Signal Score
                    </div>
                    <div className="text-[10px] text-[var(--text-muted)]">
                      Decision Support Only
                    </div>
                  </div>
                </div>
              </div>

              {/* Side-by-Side Case Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[caseA, caseB].map((c, idx) =>
                  c ? (
                    <div
                      key={c.id}
                      className="neu-inset rounded-xl p-4 space-y-2.5 flex flex-col justify-between"
                    >
                      <div className="space-y-2">
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent-blue)]">
                            Case {idx === 0 ? 'A' : 'B'}: {c.id}
                          </span>
                          <StatusBadge status={c.status} />
                        </div>
                        <div className="text-xs font-bold text-[var(--text-primary)]">
                          {c.current_bureau}
                        </div>
                        <div className="text-xs font-semibold text-[var(--text-primary)] line-clamp-2">
                          {c.title}
                        </div>
                        <p className="text-[11px] text-[var(--text-secondary)] line-clamp-3">
                          {c.description}
                        </p>
                      </div>

                      <div className="pt-2 border-t border-[var(--border-subtle)] flex items-center justify-between text-[11px]">
                        <PriorityIndicator priority={c.priority} />
                        <button
                          onClick={() => openCaseDetail(c.id)}
                          className="font-semibold text-[var(--accent-blue)] hover:underline inline-flex items-center gap-1"
                        >
                          <Eye className="w-3 h-3" />
                          Open Case
                        </button>
                      </div>
                    </div>
                  ) : null
                )}
              </div>

              {/* Officer Decision-Support Evidence */}
              <div className="neu-inset rounded-xl p-4 space-y-3 text-xs">
                <div className="font-bold text-[var(--text-primary)]">
                  Matching Evidence & Alert Explanation
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Matching Method
                    </span>
                    <span className="font-semibold text-[var(--text-primary)]">
                      {activeRelation.match_method}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block">
                      Missing / Uncertain Information
                    </span>
                    <span className="text-[var(--text-secondary)]">
                      {activeRelation.missing_or_uncertain}
                    </span>
                  </div>
                </div>

                <div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)] block mb-1">
                    Why the System Raised This Alert
                  </span>
                  <p className="text-[var(--text-secondary)]">
                    {activeRelation.why_raised}
                  </p>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {activeRelation.matching_signals.map((sig, i) => (
                    <span
                      key={i}
                      className="px-2.5 py-1 rounded-lg bg-[var(--bg-card)] border border-[var(--border-subtle)] font-mono text-[11px] text-[var(--text-secondary)]"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>

              {/* Layer 5: Human Officer Review Controls */}
              <div className="pt-2 border-t border-[var(--border-subtle)] space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-[var(--accent-blue)]" />
                    <h3 className="text-sm font-bold text-[var(--text-primary)]">
                      Layer 5: Authorized Officer Review & Coordination Assignment
                    </h3>
                  </div>
                  <span className="text-[11px] text-[var(--text-muted)]">
                    Non-Destructive Linking (Preserves Separate Case IDs)
                  </span>
                </div>

                {!roleProfile.canReviewOverlaps ? (
                  <div className="neu-inset rounded-xl p-3.5 text-xs text-[var(--status-warning)] flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" />
                    Switch from {activeRole} to an Officer or Administrator role to record official overlap review decisions.
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block font-semibold text-[var(--text-primary)] mb-1">
                          Assigned Coordination Owner
                        </label>
                        <input
                          type="text"
                          value={coordOwnerInput}
                          onChange={(e) => setCoordOwnerInput(e.target.value)}
                          className="neu-inset w-full px-3 py-2 rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-semibold text-[var(--text-primary)] mb-1">
                          Next Required Action
                        </label>
                        <input
                          type="text"
                          value={nextActionInput}
                          onChange={(e) => setNextActionInput(e.target.value)}
                          className="neu-inset w-full px-3 py-2 rounded-xl"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block font-semibold text-[var(--text-primary)] mb-1">
                        Reviewer Remarks & Coordination Notes
                      </label>
                      <textarea
                        rows={2}
                        value={reviewRemark}
                        onChange={(e) => setReviewRemark(e.target.value)}
                        placeholder="Enter rationale for confirming overlap, marking separate matters, or requesting PID verification..."
                        className="neu-inset w-full px-3 py-2 rounded-xl"
                      />
                    </div>

                    <div className="flex flex-wrap items-center gap-2.5 pt-1">
                      <button
                        type="button"
                        onClick={() => handleDecision('Confirmed Related Cases')}
                        className="neu-btn-primary px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Confirm Related Cases (Coordinate)
                      </button>

                      <button
                        type="button"
                        onClick={() => handleDecision('Not Related — Reviewed')}
                        className="neu-btn-secondary px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5"
                      >
                        <XCircle className="w-3.5 h-3.5 text-[var(--status-success)]" />
                        Mark as Separate Matters
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          handleDecision('Institution Identity Uncertain')
                        }
                        className="neu-btn-secondary px-3.5 py-2 rounded-xl font-semibold inline-flex items-center gap-1.5 text-[var(--status-warning)]"
                      >
                        <AlertTriangle className="w-3.5 h-3.5" />
                        Require PID Identity Verification
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            </SubSectionTransition>
          </div>
        )}
      </div>
    </div>
  );
};

export const BureauCoordinationView: React.FC = () => {
  const {
    coordination,
    cases,
    roleProfile,
    updateCoordinationRecord,
    openInstitutionProfile,
    openCaseDetail,
  } = useCaseSync();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [ownerDraft, setOwnerDraft] = useState('');
  const [actionDraft, setActionDraft] = useState('');
  const [statusDraft, setStatusDraft] =
    useState<CoordinationRecord['status']>('Active Joint Review');
  const [remarkDraft, setRemarkDraft] = useState('');

  const startEdit = (item: CoordinationRecord) => {
    setEditingId(item.coordination_id);
    setOwnerDraft(item.coordination_owner);
    setActionDraft(item.agreed_next_action);
    setStatusDraft(item.status);
    setRemarkDraft('');
  };

  const handleSave = (id: string) => {
    const ok = updateCoordinationRecord(id, {
      coordination_owner: ownerDraft,
      agreed_next_action: actionDraft,
      status: statusDraft,
      remark: remarkDraft,
    });
    if (ok) {
      setEditingId(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <Users className="w-3.5 h-3.5" />
            Inter-Bureau Joint Action • Single-Window Accountability
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            Bureau / Cell Coordination Workspace
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Coordinate shared institutional cases across Regulation Bureau (RB), PGRC, Approval Bureau, and Regional Offices while preserving independent case files.
          </p>
        </div>
      </div>

      {/* Summary Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        {[
          {
            label: 'Total Coordination Records',
            count: coordination.length,
          },
          {
            label: 'Pending Coordination',
            count: coordination.filter((c) => c.status === 'Pending Coordination')
              .length,
          },
          {
            label: 'Active Joint Review',
            count: coordination.filter((c) => c.status === 'Active Joint Review')
              .length,
          },
          {
            label: 'Awaiting Transfer Handoff',
            count: coordination.filter(
              (c) => c.status === 'Awaiting Transfer Acceptance'
            ).length,
          },
        ].map((stat) => (
          <div key={stat.label} className="neu-card rounded-2xl p-4">
            <div className="text-xs text-[var(--text-secondary)] font-medium">
              {stat.label}
            </div>
            <div className="text-2xl font-bold text-[var(--text-primary)] mt-1">
              {stat.count}
            </div>
          </div>
        ))}
      </div>

      {/* Coordination Cards */}
      <div className="space-y-4">
        {coordination.map((item) => {
          const linkedCases = cases.filter((c) =>
            item.related_case_ids.includes(c.id)
          );
          const isEditing = editingId === item.coordination_id;

          return (
            <div
              key={item.coordination_id}
              className="neu-card rounded-2xl p-6 space-y-4"
            >
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3 pb-4 border-b border-[var(--border-subtle)]">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                      {item.coordination_id}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg text-xs font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--text-primary)]">
                      {item.status}
                    </span>
                    <span className="text-xs text-[var(--text-muted)] font-mono">
                      Due: {item.due_date}
                    </span>
                  </div>
                  <button
                    onClick={() => openInstitutionProfile(item.institution_id, 'coordination')}
                    className="text-lg font-bold text-[var(--text-primary)] hover:text-[var(--accent-blue)] mt-1.5 inline-flex items-center gap-1.5"
                  >
                    <Building2 className="w-4 h-4 text-[var(--accent-blue)]" />
                    {item.institution_name} ({item.aicte_permanent_id})
                  </button>
                </div>

                {roleProfile.canReviewOverlaps && (
                  <div className="flex items-center gap-2">
                    {!isEditing ? (
                      <button
                        onClick={() => startEdit(item)}
                        className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold"
                      >
                        Update Coordination Decision
                      </button>
                    ) : (
                      <button
                        onClick={() => setEditingId(null)}
                        className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                )}
              </div>

              {/* Involved Bureaus & Coordination Metadata */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                <div className="neu-inset rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Involved Bureaus / Cells
                  </div>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    {item.involved_bureaus.map((b) => (
                      <span
                        key={b}
                        className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] font-semibold text-[var(--text-primary)]"
                      >
                        {b}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="neu-inset rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Assigned Coordination Owner
                  </div>
                  <div className="font-bold text-[var(--text-primary)] mt-1">
                    {item.coordination_owner}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Originating Bureau: {item.originating_bureau}
                  </div>
                </div>

                <div className="neu-inset rounded-xl p-3.5">
                  <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
                    Agreed Next Action
                  </div>
                  <div className="font-semibold text-[var(--text-primary)] mt-1">
                    {item.agreed_next_action}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
                    Remark: {item.latest_remark}
                  </div>
                </div>
              </div>

              {/* Linked Independent Cases */}
              <div className="space-y-2">
                <div className="text-xs font-bold text-[var(--text-secondary)]">
                  Linked Independent Complaint Records ({linkedCases.length}):
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {linkedCases.map((c) => (
                    <div
                      key={c.id}
                      onClick={() => openCaseDetail(c.id)}
                      className="neu-inset rounded-xl p-3.5 flex items-center justify-between gap-3 cursor-pointer hover:border-[var(--accent-blue)]"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-[var(--accent-blue)]">
                            {c.id}
                          </span>
                          <StatusBadge status={c.status} />
                          <span className="text-[11px] font-semibold text-[var(--text-secondary)]">
                            {c.current_bureau}
                          </span>
                        </div>
                        <div className="text-xs font-medium text-[var(--text-primary)] line-clamp-1">
                          {c.title}
                        </div>
                        <div className="text-[11px] text-[var(--text-muted)]">
                          Officer: {c.assigned_officer}
                        </div>
                      </div>
                      <span className="text-xs font-semibold text-[var(--accent-blue)] shrink-0">
                        Open →
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Inline Edit Drawer */}
              {isEditing && (
                <div className="neu-inset rounded-xl p-4 space-y-3 text-xs border border-[var(--accent-blue)]">
                  <div className="font-bold text-[var(--text-primary)]">
                    Record Joint Coordination Decision ({item.coordination_id})
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="block font-semibold mb-1">
                        Coordination Status
                      </label>
                      <select
                        value={statusDraft}
                        onChange={(e) =>
                          setStatusDraft(
                            e.target.value as CoordinationRecord['status']
                          )
                        }
                        className="neu-card w-full px-3 py-2 rounded-xl"
                      >
                        <option value="Pending Coordination">
                          Pending Coordination
                        </option>
                        <option value="Active Joint Review">
                          Active Joint Review
                        </option>
                        <option value="Awaiting Transfer Acceptance">
                          Awaiting Transfer Acceptance
                        </option>
                        <option value="Resolved">Resolved</option>
                      </select>
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Coordination Owner
                      </label>
                      <input
                        type="text"
                        value={ownerDraft}
                        onChange={(e) => setOwnerDraft(e.target.value)}
                        className="neu-card w-full px-3 py-2 rounded-xl"
                      />
                    </div>
                    <div>
                      <label className="block font-semibold mb-1">
                        Agreed Next Action
                      </label>
                      <input
                        type="text"
                        value={actionDraft}
                        onChange={(e) => setActionDraft(e.target.value)}
                        className="neu-card w-full px-3 py-2 rounded-xl"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block font-semibold mb-1">
                      Joint Review Remark (Appended to Linked Case Timelines)
                    </label>
                    <input
                      type="text"
                      value={remarkDraft}
                      onChange={(e) => setRemarkDraft(e.target.value)}
                      placeholder="Enter joint committee note or handoff acknowledgement..."
                      className="neu-card w-full px-3 py-2 rounded-xl"
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      onClick={() => handleSave(item.coordination_id)}
                      className="neu-btn-primary px-4 py-2 rounded-xl font-semibold"
                    >
                      Save & Synchronize Linked Cases
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
