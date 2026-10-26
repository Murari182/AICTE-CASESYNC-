import React, { useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRightLeft,
  Building2,
  Calendar,
  CheckCircle2,
  Clock,
  FileText,
  GitCompare,
  Link2,
  MessageSquarePlus,
  ShieldAlert,
  UserCheck,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { computeDeadlineState } from '../../data/seedData';
import { BureauCell, CaseStatus, Priority } from '../../types/casesync';
import {
  DeadlineBadge,
  OverlapBadge,
  PriorityIndicator,
  StatusBadge,
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

const ALL_PRIORITIES: Priority[] = ['Low', 'Medium', 'High', 'Critical'];

export const CaseDetailsView: React.FC = () => {
  const {
    selectedCase,
    cases,
    relations,
    slaConfig,
    activeRole,
    roleProfile,
    setActiveScreen,
    openInstitutionProfile,
    openCaseDetail,
    updateCaseRecord,
    requestCaseTransfer,
    escalateCase,
  } = useCaseSync();

  const [statusInput, setStatusInput] = useState<CaseStatus>(selectedCase.status);
  const [priorityInput, setPriorityInput] = useState<Priority>(selectedCase.priority);
  const [officerInput, setOfficerInput] = useState(selectedCase.assigned_officer);
  const [nextActionInput, setNextActionInput] = useState(
    selectedCase.next_action_required
  );
  const [remarkInput, setRemarkInput] = useState('');
  const [linkCaseInput, setLinkCaseInput] = useState('');

  // Transfer Modal State
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [transferBureau, setTransferBureau] = useState<BureauCell>(
    'Public Grievance Redressal Cell (PGRC)'
  );
  const [transferOfficer, setTransferOfficer] = useState('');
  const [transferReason, setTransferReason] = useState('');
  const [transferRemarks, setTransferRemarks] = useState('');

  // Escalate Modal State
  const [showEscalateModal, setShowEscalateModal] = useState(false);
  const [escLevel, setEscLevel] = useState<
    'Level 1 — Bureau Head' | 'Level 2 — Competent Authority / Senior Management'
  >('Level 1 — Bureau Head');
  const [escAuthority, setEscAuthority] = useState('Advisor-I (Regulation Bureau)');
  const [escReason, setEscReason] = useState('');
  const [escNextAction, setEscNextAction] = useState('');

  // Dispose Confirmation State
  const [showDisposeConfirm, setShowDisposeConfirm] = useState(false);
  const [disposeRemark, setDisposeRemark] = useState('');

  // Sync local form state when selectedCase changes
  React.useEffect(() => {
    setStatusInput(selectedCase.status);
    setPriorityInput(selectedCase.priority);
    setOfficerInput(selectedCase.assigned_officer);
    setNextActionInput(selectedCase.next_action_required);
    setRemarkInput('');
  }, [selectedCase]);

  const deadlineState = computeDeadlineState(
    selectedCase.expected_disposal_at,
    selectedCase.status,
    slaConfig
  );

  const relatedCases = cases.filter(
    (c) =>
      selectedCase.linked_case_ids.includes(c.id) ||
      (c.institution_id === selectedCase.institution_id && c.id !== selectedCase.id)
  );

  const caseRelations = relations.filter(
    (r) => r.case_id_a === selectedCase.id || r.case_id_b === selectedCase.id
  );

  const handleSaveUpdate = (e: React.FormEvent) => {
    e.preventDefault();
    updateCaseRecord(selectedCase.id, {
      status: statusInput,
      priority: priorityInput,
      assigned_officer: officerInput,
      next_action_required: nextActionInput,
      remark: remarkInput,
      linked_case_id: linkCaseInput || undefined,
    });
    setRemarkInput('');
    setLinkCaseInput('');
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!transferReason.trim()) return;
    const ok = requestCaseTransfer({
      caseId: selectedCase.id,
      receivingBureau: transferBureau,
      receivingOfficer: transferOfficer,
      reason: transferReason,
      remarks: transferRemarks,
    });
    if (ok) {
      setShowTransferModal(false);
      setTransferReason('');
      setTransferRemarks('');
    }
  };

  const handleEscalateSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!escReason.trim()) return;
    const ok = escalateCase({
      caseId: selectedCase.id,
      escalationLevel: escLevel,
      responsibleAuthority: escAuthority,
      reason: escReason,
      requiredNextAction: escNextAction || 'Immediate senior review and directive.',
    });
    if (ok) {
      setShowEscalateModal(false);
      setEscReason('');
      setEscNextAction('');
    }
  };

  const handleConfirmDispose = () => {
    updateCaseRecord(selectedCase.id, {
      status: 'Disposed',
      next_action_required: 'Case Disposed — No further action pending.',
      remark:
        disposeRemark.trim() ||
        'Final compliance verified and complaint officially disposed.',
    });
    setShowDisposeConfirm(false);
    setDisposeRemark('');
  };

  return (
    <div className="space-y-6">
      {/* Top Bar Navigation */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          onClick={() => setActiveScreen('cases')}
          className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          Back to Complaint Register
        </button>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => openInstitutionProfile(selectedCase.institution_id)}
            className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--accent-blue)]"
          >
            <Building2 className="w-3.5 h-3.5" />
            Open Institution Profile ({selectedCase.aicte_permanent_id})
          </button>

          {activeRole !== 'Submitter' && (
            <>
              <button
                onClick={() => setShowTransferModal(true)}
                className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <ArrowRightLeft className="w-3.5 h-3.5 text-[var(--accent-blue)]" />
                Transfer Case
              </button>
              <button
                onClick={() => setShowEscalateModal(true)}
                className="neu-btn-secondary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--status-warning)]"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
                Escalate Case
              </button>
              {selectedCase.status !== 'Disposed' && (
                <button
                  onClick={() => setShowDisposeConfirm(true)}
                  className="neu-btn-primary px-3.5 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Mark as Disposed
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {/* Case Identity Header */}
      <div className="neu-card rounded-2xl p-6 space-y-5">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="space-y-2 max-w-3xl">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-bold px-2.5 py-1 rounded-lg bg-[var(--accent-blue)]/10 text-[var(--accent-blue)]">
                {selectedCase.id}
              </span>
              <StatusBadge status={selectedCase.status} />
              <PriorityIndicator priority={selectedCase.priority} />
              <OverlapBadge status={selectedCase.overlap_status} />
              <DeadlineBadge state={deadlineState} />
            </div>

            <h1 className="text-xl sm:text-2xl font-bold text-[var(--text-primary)]">
              {selectedCase.title}
            </h1>

            <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
              {selectedCase.description}
            </p>
          </div>

          <div className="neu-inset rounded-xl p-4 min-w-[260px] space-y-2 text-xs">
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Current Bureau:</span>
              <span className="font-bold text-[var(--text-primary)]">
                {selectedCase.current_bureau}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Assigned Officer:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {selectedCase.assigned_officer}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Category:</span>
              <span className="font-semibold text-[var(--text-primary)]">
                {selectedCase.category}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Receipt Date:</span>
              <span className="font-mono text-[var(--text-secondary)]">
                {new Date(selectedCase.received_at).toLocaleDateString('en-IN', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                })}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-[var(--text-muted)]">Expected Disposal:</span>
              <span className="font-mono font-semibold text-[var(--text-primary)]">
                {new Date(selectedCase.expected_disposal_at).toLocaleDateString(
                  'en-IN',
                  {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }
                )}
              </span>
            </div>
          </div>
        </div>

        {/* Institution Summary Strip */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-[var(--border-subtle)] text-xs">
          <div className="neu-inset rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Associated Institution
            </div>
            <button
              onClick={() => openInstitutionProfile(selectedCase.institution_id)}
              className="font-bold text-sm text-[var(--accent-blue)] hover:underline mt-1 text-left block"
            >
              {selectedCase.institutionName}
            </button>
            <div className="text-[var(--text-secondary)] mt-0.5 font-mono">
              AICTE PID: {selectedCase.aicte_permanent_id} • {selectedCase.region}
            </div>
          </div>

          <div className="neu-inset rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Last Recorded Action
            </div>
            <div className="font-semibold text-[var(--text-primary)] mt-1">
              {selectedCase.last_action_taken}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Updated{' '}
              {new Date(selectedCase.last_action_at).toLocaleString('en-IN', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })}
            </div>
          </div>

          <div className="neu-inset rounded-xl p-3.5">
            <div className="text-[10px] font-bold uppercase tracking-wider text-[var(--text-muted)]">
              Next Action Required
            </div>
            <div className="font-semibold text-[var(--text-primary)] mt-1">
              {selectedCase.next_action_required}
            </div>
            <div className="text-[11px] text-[var(--text-muted)] mt-0.5">
              Submitted by: {selectedCase.submittedBy}
            </div>
          </div>
        </div>
      </div>

      {/* Main Two-Column Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Columns: Overlap & Related Cases + Chronological Audit Timeline */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overlap & Cross-Bureau Coordination Panel */}
          <div className="neu-card rounded-2xl p-5 space-y-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <GitCompare className="w-4 h-4 text-[var(--accent-blue)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Linked Institutional Cases & Cross-Bureau Overlap
                </h2>
              </div>
              <button
                onClick={() => setActiveScreen('overlaps')}
                className="text-xs font-semibold text-[var(--accent-blue)] hover:underline"
              >
                Open Overlap Detection Workspace →
              </button>
            </div>

            {caseRelations.length > 0 && (
              <div className="space-y-2.5">
                {caseRelations.map((rel) => (
                  <div
                    key={rel.relation_id}
                    className="neu-inset rounded-xl p-4 space-y-2 border-l-4 border-l-[var(--status-warning)]"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-bold text-[var(--text-primary)]">
                        {rel.relation_type} ({rel.case_id_a} ↔ {rel.case_id_b})
                      </span>
                      <OverlapBadge status={rel.review_status} />
                    </div>
                    <p className="text-xs text-[var(--text-secondary)]">
                      {rel.why_raised}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-[var(--text-muted)]">
                      <span>Method: {rel.match_method}</span>
                      <span>•</span>
                      <span>Coordination Owner: {rel.coordination_owner}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {relatedCases.length === 0 ? (
              <div className="text-xs text-[var(--text-secondary)] py-3">
                No other complaints are currently linked to this institution.
              </div>
            ) : (
              <div className="space-y-2">
                <div className="text-xs font-semibold text-[var(--text-secondary)]">
                  Other Complaints at {selectedCase.institutionName} (Preserving Separate Case IDs):
                </div>
                {relatedCases.map((rc) => (
                  <div
                    key={rc.id}
                    onClick={() => openCaseDetail(rc.id)}
                    className="neu-inset rounded-xl p-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:border-[var(--accent-blue)] cursor-pointer transition-colors"
                  >
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-[var(--accent-blue)]">
                          {rc.id}
                        </span>
                        <StatusBadge status={rc.status} />
                        <span className="text-xs font-semibold text-[var(--text-secondary)]">
                          {rc.current_bureau}
                        </span>
                      </div>
                      <div className="text-xs font-medium text-[var(--text-primary)] mt-1">
                        {rc.title}
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-[var(--accent-blue)] whitespace-nowrap">
                      Inspect Case →
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Officer Decision-Support Evidence Box */}
            {roleProfile.canViewInternalRemarks && (
              <div className="neu-inset rounded-xl p-4 space-y-2 text-xs">
                <div className="font-bold text-[var(--text-primary)] flex items-center justify-between">
                  <span>Matching & Routing Decision Support Evidence</span>
                  <span className="font-mono text-[11px] text-[var(--text-muted)]">
                    Source: {selectedCase.classificationSource}
                  </span>
                </div>
                <p className="text-[var(--text-secondary)]">
                  {selectedCase.explanation.summary}
                </p>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {selectedCase.explanation.matchedSignals.map((sig, idx) => (
                    <span
                      key={idx}
                      className="px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[11px] font-mono text-[var(--text-secondary)]"
                    >
                      {sig}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Chronological Workflow Timeline */}
          <div className="neu-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-[var(--accent-blue)]" />
                <h2 className="text-base font-bold text-[var(--text-primary)]">
                  Chronological Action & Audit Timeline ({selectedCase.timeline.length})
                </h2>
              </div>
              <span className="text-[11px] text-[var(--text-muted)]">
                Illustrative Prototype Timestamps
              </span>
            </div>

            <div className="space-y-3">
              {[...selectedCase.timeline].reverse().map((act) => (
                <div
                  key={act.action_id}
                  className="neu-inset rounded-xl p-3.5 space-y-1.5 text-xs"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-[var(--accent-blue)]">
                        {act.action_type}
                      </span>
                      <span className="text-[11px] px-2 py-0.5 rounded-md bg-[var(--bg-card)] border border-[var(--border-subtle)] text-[var(--text-secondary)]">
                        {act.bureau}
                      </span>
                    </div>
                    <span className="font-mono text-[11px] text-[var(--text-muted)]">
                      {new Date(act.timestamp).toLocaleString('en-IN', {
                        day: '2-digit',
                        month: 'short',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </div>
                  <p className="text-[var(--text-primary)]">{act.remarks}</p>
                  <div className="flex flex-wrap items-center gap-3 text-[11px] text-[var(--text-muted)]">
                    <span>Actor: {act.actor} ({act.actor_role})</span>
                    {act.previous_value && act.new_value && (
                      <span>
                        Transition: {act.previous_value} → {act.new_value}
                      </span>
                    )}
                    {act.reference_id && <span>Ref: {act.reference_id}</span>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: Officer Action Controls & Supporting Docs */}
        <div className="space-y-6">
          <div className="neu-card rounded-2xl p-5 space-y-4">
            <div className="flex items-center gap-2">
              <UserCheck className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Officer Case Action & Update
              </h2>
            </div>

            {activeRole === 'Submitter' ? (
              <div className="neu-inset rounded-xl p-4 text-xs text-[var(--text-secondary)] space-y-2">
                <div className="font-bold text-[var(--status-warning)] flex items-center gap-1.5">
                  <AlertTriangle className="w-4 h-4" />
                  Read-Only Submitter View
                </div>
                <p>
                  You are currently viewing as <strong>Submitter</strong>. Switch to an Officer or Administrator role in the top navigation bar to update statuses, assign officers, or record internal remarks.
                </p>
              </div>
            ) : (
              <form onSubmit={handleSaveUpdate} className="space-y-3.5 text-xs">
                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">
                    Workflow Status
                  </label>
                  <select
                    value={statusInput}
                    onChange={(e) => setStatusInput(e.target.value as CaseStatus)}
                    className="neu-inset w-full px-3 py-2 rounded-xl font-medium focus:outline-none"
                  >
                    {ALL_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">
                    Priority Level
                  </label>
                  <select
                    value={priorityInput}
                    onChange={(e) => setPriorityInput(e.target.value as Priority)}
                    className="neu-inset w-full px-3 py-2 rounded-xl font-medium focus:outline-none"
                  >
                    {ALL_PRIORITIES.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">
                    Assigned Bureau Officer
                  </label>
                  <input
                    type="text"
                    value={officerInput}
                    onChange={(e) => setOfficerInput(e.target.value)}
                    className="neu-inset w-full px-3 py-2 rounded-xl focus:outline-none"
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
                    className="neu-inset w-full px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">
                    Link Related Case ID (Optional)
                  </label>
                  <select
                    value={linkCaseInput}
                    onChange={(e) => setLinkCaseInput(e.target.value)}
                    className="neu-inset w-full px-3 py-2 rounded-xl focus:outline-none"
                  >
                    <option value="">— Select Case to Link —</option>
                    {cases
                      .filter(
                        (c) =>
                          c.id !== selectedCase.id &&
                          !selectedCase.linked_case_ids.includes(c.id)
                      )
                      .map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.id} — {c.institutionName} ({c.current_bureau})
                        </option>
                      ))}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-[var(--text-primary)] mb-1">
                    Official Action Remark
                  </label>
                  <textarea
                    rows={3}
                    value={remarkInput}
                    onChange={(e) => setRemarkInput(e.target.value)}
                    placeholder="Record compliance note, verification summary, or coordination remark..."
                    className="neu-inset w-full px-3 py-2 rounded-xl focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  className="neu-btn-primary w-full py-2.5 rounded-xl font-semibold inline-flex items-center justify-center gap-1.5"
                >
                  <MessageSquarePlus className="w-4 h-4" />
                  Save Case Update & Record Audit Event
                </button>
              </form>
            )}
          </div>

          {/* Supporting Documents */}
          <div className="neu-card rounded-2xl p-5 space-y-3">
            <div className="flex items-center gap-2">
              <FileText className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-sm font-bold text-[var(--text-primary)]">
                Supporting Document References
              </h2>
            </div>
            {selectedCase.supporting_documents.length === 0 ? (
              <p className="text-xs text-[var(--text-muted)]">
                No external attachments referenced for this record.
              </p>
            ) : (
              <ul className="space-y-2 text-xs">
                {selectedCase.supporting_documents.map((doc, i) => (
                  <li
                    key={i}
                    className="neu-inset rounded-xl px-3 py-2 flex items-center justify-between gap-2 font-mono text-[var(--text-secondary)]"
                  >
                    <span className="truncate">{doc}</span>
                    <Link2 className="w-3.5 h-3.5 text-[var(--accent-blue)] shrink-0" />
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-card rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Request Inter-Bureau Transfer ({selectedCase.id})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Originating Bureau: <strong>{selectedCase.current_bureau}</strong>. The case will be marked as Transferred (Awaiting Acceptance) until acknowledged by the receiving Bureau.
            </p>
            <form onSubmit={handleTransferSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Receiving Bureau / Cell</label>
                <select
                  value={transferBureau}
                  onChange={(e) => setTransferBureau(e.target.value as BureauCell)}
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                >
                  {ALL_BUREAUS.filter((b) => b !== selectedCase.current_bureau).map(
                    (b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    )
                  )}
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Receiving Officer (Optional)
                </label>
                <input
                  type="text"
                  value={transferOfficer}
                  onChange={(e) => setTransferOfficer(e.target.value)}
                  placeholder="e.g., R. K. Sharma (PGRC Nodal Officer)"
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Reason for Transfer</label>
                <input
                  type="text"
                  required
                  value={transferReason}
                  onChange={(e) => setTransferReason(e.target.value)}
                  placeholder="e.g., Subject falls under student fee grievance redressal mandate"
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Handover Remarks</label>
                <textarea
                  rows={3}
                  value={transferRemarks}
                  onChange={(e) => setTransferRemarks(e.target.value)}
                  placeholder="Include context on linked cases or completed inspections..."
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowTransferModal(false)}
                  className="neu-btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-4 py-2 rounded-xl font-semibold"
                >
                  Submit Transfer Request
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Escalate Modal */}
      {showEscalateModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-card rounded-2xl max-w-lg w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Escalate Complaint Case ({selectedCase.id})
            </h3>
            <form onSubmit={handleEscalateSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-semibold mb-1">Escalation Level</label>
                <select
                  value={escLevel}
                  onChange={(e) =>
                    setEscLevel(e.target.value as typeof escLevel)
                  }
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                >
                  <option value="Level 1 — Bureau Head">Level 1 — Bureau Head</option>
                  <option value="Level 2 — Competent Authority / Senior Management">
                    Level 2 — Competent Authority / Senior Management
                  </option>
                </select>
              </div>
              <div>
                <label className="block font-semibold mb-1">
                  Responsible Authority / Destination
                </label>
                <input
                  type="text"
                  required
                  value={escAuthority}
                  onChange={(e) => setEscAuthority(e.target.value)}
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Escalation Reason</label>
                <input
                  type="text"
                  required
                  value={escReason}
                  onChange={(e) => setEscReason(e.target.value)}
                  placeholder="e.g., SLA breach / Simultaneous multi-Bureau regulatory conflict"
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div>
                <label className="block font-semibold mb-1">Required Next Action</label>
                <input
                  type="text"
                  required
                  value={escNextAction}
                  onChange={(e) => setEscNextAction(e.target.value)}
                  placeholder="e.g., Issue consolidated Show Cause Notice"
                  className="neu-inset w-full px-3 py-2 rounded-xl"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEscalateModal(false)}
                  className="neu-btn-secondary px-4 py-2 rounded-xl font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="neu-btn-primary px-4 py-2 rounded-xl font-semibold"
                >
                  Confirm Escalation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Dispose Confirmation Modal */}
      {showDisposeConfirm && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="neu-card rounded-2xl max-w-md w-full p-6 space-y-4">
            <h3 className="text-lg font-bold text-[var(--text-primary)]">
              Confirm Case Disposal ({selectedCase.id})
            </h3>
            <p className="text-xs text-[var(--text-secondary)]">
              Marking this case as <strong>Disposed</strong> will update all institutional counters, Bureau workload charts, and audit history. Linked cases will remain independently tracked.
            </p>
            <textarea
              rows={3}
              value={disposeRemark}
              onChange={(e) => setDisposeRemark(e.target.value)}
              placeholder="Enter final disposal order summary or compliance verification reference..."
              className="neu-inset w-full px-3 py-2 rounded-xl text-xs"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowDisposeConfirm(false)}
                className="neu-btn-secondary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDispose}
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold"
              >
                Confirm Disposal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
