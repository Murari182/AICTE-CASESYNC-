import React, { useState } from 'react';
import {
  Activity,
  AlertTriangle,
  Cpu,
  RotateCcw,
  Save,
  Settings,
  ShieldCheck,
  Sliders,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import { RoutingRule, SlaConfig } from '../../types/casesync';

export const SettingsView: React.FC = () => {
  const {
    routingRules,
    slaConfig,
    modelEvaluations,
    roleProfile,
    activeRole,
    saveSystemSettings,
    resetSystemState,
  } = useCaseSync();

  const [draftSla, setDraftSla] = useState<SlaConfig>(slaConfig);
  const [draftRules, setDraftRules] = useState<RoutingRule[]>(routingRules);
  const [confirmReset, setConfirmReset] = useState(false);

  const handleRuleSlaChange = (id: string, hours: number) => {
    setDraftRules((prev) =>
      prev.map((r) => (r.id === id ? { ...r, slaHours: hours } : r))
    );
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveSystemSettings(draftRules, draftSla);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-[var(--accent-blue)] mb-1">
            <Settings className="w-3.5 h-3.5" />
            Platform Governance • SLA Thresholds & Offline Model Evaluation
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] tracking-tight">
            System Settings & Model Monitoring
          </h1>
          <p className="text-sm text-[var(--text-secondary)] mt-1">
            Configure institutional disposal deadline thresholds, cross-Bureau overlap rules, and inspect documented model evaluation metrics.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          {!confirmReset ? (
            <button
              onClick={() => setConfirmReset(true)}
              className="neu-btn-secondary px-4 py-2.5 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 text-[var(--status-critical)]"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Reset Baseline Dataset
            </button>
          ) : (
            <div className="flex items-center gap-2 neu-inset px-3 py-1.5 rounded-xl">
              <span className="text-xs font-semibold text-[var(--status-critical)]">
                Restore default seed state?
              </span>
              <button
                onClick={async () => {
                  await resetSystemState();
                  setConfirmReset(false);
                }}
                className="neu-btn-primary px-3 py-1 rounded-lg text-xs font-bold"
              >
                Confirm Reset
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="neu-btn-secondary px-2.5 py-1 rounded-lg text-xs"
              >
                Cancel
              </button>
            </div>
          )}
        </div>
      </div>

      {/* SLA & Overlap Configuration Form */}
      <form onSubmit={handleSave} className="space-y-6">
        <div className="neu-card rounded-2xl p-6 space-y-5">
          <div className="flex items-center justify-between border-b border-[var(--border-subtle)] pb-4">
            <div className="flex items-center gap-2">
              <Sliders className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Configurable Deadline & Cross-Bureau Overlap Rules
              </h2>
            </div>
            <span className="text-xs text-[var(--text-muted)]">
              Configurable SLA Rules
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
            <div className="neu-inset rounded-xl p-4 space-y-2">
              <label className="block font-bold text-[var(--text-primary)]">
                Default Expected Disposal Window (Days)
              </label>
              <input
                type="number"
                min={3}
                max={90}
                disabled={!roleProfile.canManageSettings}
                value={draftSla.defaultDisposalDays}
                onChange={(e) =>
                  setDraftSla({
                    ...draftSla,
                    defaultDisposalDays: Number(e.target.value),
                  })
                }
                className="neu-card w-full px-3 py-2 rounded-xl font-mono font-bold"
              />
              <p className="text-[11px] text-[var(--text-secondary)]">
                Applied to newly logged complaints unless overridden by category rule.
              </p>
            </div>

            <div className="neu-inset rounded-xl p-4 space-y-2">
              <label className="block font-bold text-[var(--text-primary)]">
                “Due Soon” Warning Threshold (Days Remaining)
              </label>
              <input
                type="number"
                min={1}
                max={15}
                disabled={!roleProfile.canManageSettings}
                value={draftSla.dueSoonDaysThreshold}
                onChange={(e) =>
                  setDraftSla({
                    ...draftSla,
                    dueSoonDaysThreshold: Number(e.target.value),
                  })
                }
                className="neu-card w-full px-3 py-2 rounded-xl font-mono font-bold"
              />
              <p className="text-[11px] text-[var(--text-secondary)]">
                Triggers “Case Approaching Deadline” alerts across the dashboard.
              </p>
            </div>

            <div className="neu-inset rounded-xl p-4 space-y-2">
              <label className="block font-bold text-[var(--text-primary)]">
                Candidate Overlap Review Threshold (%)
              </label>
              <input
                type="number"
                min={50}
                max={95}
                disabled={!roleProfile.canManageSettings}
                value={draftSla.similarityReviewThreshold}
                onChange={(e) =>
                  setDraftSla({
                    ...draftSla,
                    similarityReviewThreshold: Number(e.target.value),
                  })
                }
                className="neu-card w-full px-3 py-2 rounded-xl font-mono font-bold"
              />
              <p className="text-[11px] text-[var(--text-secondary)]">
                Minimum relationship score to queue a pair for Layer 5 human review.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <label className="neu-inset rounded-xl p-4 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!roleProfile.canManageSettings}
                checked={draftSla.enableExactPidPriority}
                onChange={(e) =>
                  setDraftSla({
                    ...draftSla,
                    enableExactPidPriority: e.target.checked,
                  })
                }
                className="mt-1"
              />
              <div>
                <div className="font-bold text-[var(--text-primary)]">
                  Enforce Layer 1 Exact AICTE Permanent ID Precedence
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Always prioritize exact AICTE Permanent ID matching over fuzzy institution name similarity, and require human verification for missing/conflicting PIDs.
                </p>
              </div>
            </label>

            <label className="neu-inset rounded-xl p-4 flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                disabled={!roleProfile.canManageSettings}
                checked={draftSla.enableCrossBureauAlerts}
                onChange={(e) =>
                  setDraftSla({
                    ...draftSla,
                    enableCrossBureauAlerts: e.target.checked,
                  })
                }
                className="mt-1"
              />
              <div>
                <div className="font-bold text-[var(--text-primary)]">
                  Automatic Cross-Bureau Coordination Alerts (RB + PGRC)
                </div>
                <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                  Raise an immediate alert when two Bureaus have active complaints on compatible issues at the same institution.
                </p>
              </div>
            </label>
          </div>
        </div>

        {/* Bureau Routing Rules Table */}
        <div className="neu-card rounded-2xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-[var(--accent-blue)]" />
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Bureau / Cell Intake Routing Rules
              </h2>
            </div>
            {roleProfile.canManageSettings ? (
              <button
                type="submit"
                className="neu-btn-primary px-4 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5"
              >
                <Save className="w-3.5 h-3.5" />
                Save Configuration
              </button>
            ) : (
              <span className="text-xs text-[var(--status-warning)] flex items-center gap-1">
                <AlertTriangle className="w-3.5 h-3.5" />
                Switch to Administrator role to modify system rules
              </span>
            )}
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase text-[var(--text-muted)]">
                  <th className="py-3 px-3">Rule ID & Category</th>
                  <th className="py-3 px-3">Default Bureau / Cell</th>
                  <th className="py-3 px-3">Default Priority</th>
                  <th className="py-3 px-3">SLA Window (Hours)</th>
                  <th className="py-3 px-3">Signal Keywords</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[var(--border-subtle)]">
                {draftRules.map((rule) => (
                  <tr key={rule.id}>
                    <td className="py-3 px-3">
                      <div className="font-mono font-bold text-[var(--accent-blue)]">
                        {rule.id}
                      </div>
                      <div className="font-semibold text-[var(--text-primary)]">
                        {rule.category}
                      </div>
                    </td>
                    <td className="py-3 px-3 font-semibold text-[var(--text-primary)]">
                      {rule.defaultDepartment}
                    </td>
                    <td className="py-3 px-3">{rule.defaultPriority}</td>
                    <td className="py-3 px-3">
                      <input
                        type="number"
                        disabled={!roleProfile.canManageSettings}
                        value={rule.slaHours}
                        onChange={(e) =>
                          handleRuleSlaChange(rule.id, Number(e.target.value))
                        }
                        className="neu-inset w-24 px-2.5 py-1.5 rounded-lg font-mono"
                      />
                    </td>
                    <td className="py-3 px-3 text-[11px] text-[var(--text-secondary)]">
                      {rule.keywords.slice(0, 5).join(', ')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </form>

      {/* Restricted Model Performance & Offline Evaluation Panel */}
      <div className="neu-card rounded-2xl p-6 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[var(--border-subtle)] pb-4">
          <div className="flex items-center gap-2">
            <Cpu className="w-4 h-4 text-[var(--accent-blue)]" />
            <div>
              <h2 className="text-base font-bold text-[var(--text-primary)]">
                Restricted Model Monitoring & Offline Evaluation Metrics
              </h2>
              <p className="text-xs text-[var(--text-secondary)]">
                Validation benchmark evaluation on documented cross-Bureau case pairs — distinct from live operational match scores.
              </p>
            </div>
          </div>
          <span className="px-3 py-1 rounded-lg text-xs font-mono font-semibold bg-[var(--bg-elevated)] border border-[var(--border-subtle)] text-[var(--accent-blue)]">
            Hybrid Rule + Semantic Matching Engine
          </span>
        </div>

        {activeRole === 'Submitter' ? (
          <div className="neu-inset rounded-xl p-4 text-xs text-[var(--text-secondary)]">
            Model evaluation metrics are restricted to authorized AICTE administrators and designated Bureau officers.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[var(--border-subtle)] text-[11px] font-bold uppercase text-[var(--text-muted)] bg-[var(--bg-elevated)]">
                    <th className="py-3 px-4">Evaluation Task</th>
                    <th className="py-3 px-4">Dataset Reference & Samples</th>
                    <th className="py-3 px-4">Precision</th>
                    <th className="py-3 px-4">Recall</th>
                    <th className="py-3 px-4">F1 Score</th>
                    <th className="py-3 px-4">FP / FN Counts</th>
                    <th className="py-3 px-4">Evaluation Notes</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border-subtle)]">
                  {modelEvaluations.map((ev) => (
                    <tr key={ev.evaluation_id}>
                      <td className="py-3.5 px-4">
                        <div className="font-bold text-[var(--text-primary)]">
                          {ev.task_name}
                        </div>
                        <div className="font-mono text-[11px] text-[var(--text-muted)]">
                          {ev.model_version}
                        </div>
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px] text-[var(--text-secondary)]">
                        <div>{ev.evaluation_dataset_reference}</div>
                        <div>N = {ev.sample_count}</div>
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                        {ev.precision.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--text-primary)]">
                        {ev.recall.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono font-bold text-[var(--accent-blue)]">
                        {ev.f1_score.toFixed(2)}
                      </td>
                      <td className="py-3.5 px-4 font-mono text-[11px]">
                        FP: {ev.false_positives} | FN: {ev.false_negatives}
                      </td>
                      <td className="py-3.5 px-4 text-[11px] text-[var(--text-secondary)] max-w-xs">
                        {ev.notes}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="neu-inset rounded-xl p-3.5 text-[11px] text-[var(--text-secondary)] flex items-center gap-2">
              <Activity className="w-4 h-4 text-[var(--accent-blue)] shrink-0" />
              <span>
                <strong>Methodological Note:</strong> Offline evaluation metrics (e.g., F1: 0.89 on benchmark dataset) measure aggregate algorithm performance on historical test pairs and must never be interpreted as the probability that an individual live pair is a duplicate.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
