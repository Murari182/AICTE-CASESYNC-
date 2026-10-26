import React from 'react';
import {
  AlertCircle,
  AlertTriangle,
  ArrowDown,
  ArrowRightLeft,
  ArrowUp,
  CheckCircle2,
  Clock,
  FileWarning,
  Flame,
  GitCompare,
  HelpCircle,
  Inbox,
  Minus,
  ShieldCheck,
  Wrench,
  X,
} from 'lucide-react';
import { useCaseSync } from '../../context/CaseSyncContext';
import {
  CaseRecord,
  CaseStatus,
  DeadlineState,
  OverlapStatus,
  Priority,
  SlaConfig,
} from '../../types/casesync';
import { computeDeadlineState } from '../../data/seedData';

export const PriorityIndicator: React.FC<{
  priority: Priority;
  compact?: boolean;
}> = ({ priority, compact = false }) => {
  const config: Record<
    Priority,
    { classes: string; icon: React.ReactNode; label: string }
  > = {
    Critical: {
      classes: 'text-[#C83D50] dark:text-[#FF7788] bg-[#C83D50]/10 dark:bg-[#FF7788]/15',
      icon: <Flame className="w-3.5 h-3.5 shrink-0" />,
      label: 'Critical',
    },
    High: {
      classes: 'text-[#B97813] dark:text-[#F4BD62] bg-[#B97813]/12 dark:bg-[#F4BD62]/15',
      icon: <ArrowUp className="w-3.5 h-3.5 shrink-0" />,
      label: 'High',
    },
    Medium: {
      classes: 'text-[#3478F6] dark:text-[#6EA1FF] bg-[#3478F6]/10 dark:bg-[#6EA1FF]/15',
      icon: <Minus className="w-3.5 h-3.5 shrink-0" />,
      label: 'Medium',
    },
    Low: {
      classes: 'text-[#18885F] dark:text-[#49C99A] bg-[#18885F]/10 dark:bg-[#49C99A]/15',
      icon: <ArrowDown className="w-3.5 h-3.5 shrink-0" />,
      label: 'Low',
    },
  };

  const item = config[priority] || config.Medium;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap shrink-0 ${
        compact
          ? `text-xs ${item.classes.split(' ').slice(0, 2).join(' ')}`
          : `text-xs px-2.5 py-1 rounded-[10px] ${item.classes}`
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const StatusBadge: React.FC<{
  status: CaseStatus | string;
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const map: Record<
    string,
    { classes: string; icon: React.ReactNode; label: string }
  > = {
    Received: {
      classes: 'text-[#66758A] dark:text-[#A7B4C6] bg-[#66758A]/12 dark:bg-[#A7B4C6]/15',
      icon: <Inbox className="w-3.5 h-3.5 shrink-0" />,
      label: 'Received',
    },
    Pending: {
      classes: 'text-[#B97813] dark:text-[#F4BD62] bg-[#B97813]/12 dark:bg-[#F4BD62]/15',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
      label: 'Pending',
    },
    'Under Process': {
      classes: 'text-[#3478F6] dark:text-[#6EA1FF] bg-[#3478F6]/12 dark:bg-[#6EA1FF]/15',
      icon: <Wrench className="w-3.5 h-3.5 shrink-0" />,
      label: 'Under Process',
    },
    Transferred: {
      classes: 'text-[#4338F5] dark:text-[#8B8AFF] bg-[#4338F5]/12 dark:bg-[#8B8AFF]/15',
      icon: <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />,
      label: 'Transferred',
    },
    Escalated: {
      classes: 'text-[#C83D50] dark:text-[#FF7788] bg-[#C83D50]/12 dark:bg-[#FF7788]/15',
      icon: <AlertTriangle className="w-3.5 h-3.5 shrink-0" />,
      label: 'Escalated',
    },
    Disposed: {
      classes: 'text-[#18885F] dark:text-[#49C99A] bg-[#18885F]/12 dark:bg-[#49C99A]/15',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      label: 'Disposed',
    },
  };

  const item = map[status] || map.Pending;

  return (
    <span
      className={`inline-flex items-center gap-1.5 font-semibold whitespace-nowrap shrink-0 ${
        compact
          ? `text-xs ${item.classes.split(' ').slice(0, 2).join(' ')}`
          : `text-xs px-2.5 py-1 rounded-[10px] ${item.classes}`
      }`}
    >
      {item.icon}
      <span>{item.label}</span>
    </span>
  );
};

export const OverlapBadge: React.FC<{
  status: OverlapStatus;
  compact?: boolean;
}> = ({ status, compact = false }) => {
  const map: Record<
    OverlapStatus,
    { classes: string; icon: React.ReactNode; shortLabel: string }
  > = {
    'Potential Overlap — Review Required': {
      classes: 'text-[#C83D50] dark:text-[#FF7788] bg-[#C83D50]/12 dark:bg-[#FF7788]/15',
      icon: <GitCompare className="w-3.5 h-3.5 shrink-0" />,
      shortLabel: 'Potential Overlap',
    },
    'Confirmed Related Cases': {
      classes: 'text-[#3478F6] dark:text-[#6EA1FF] bg-[#3478F6]/12 dark:bg-[#6EA1FF]/15',
      icon: <ArrowRightLeft className="w-3.5 h-3.5 shrink-0" />,
      shortLabel: 'Confirmed Related',
    },
    'Institution Identity Uncertain': {
      classes: 'text-[#B97813] dark:text-[#F4BD62] bg-[#B97813]/12 dark:bg-[#F4BD62]/15',
      icon: <HelpCircle className="w-3.5 h-3.5 shrink-0" />,
      shortLabel: 'Identity Uncertain',
    },
    'Not Related — Reviewed': {
      classes: 'text-[#18885F] dark:text-[#49C99A] bg-[#18885F]/12 dark:bg-[#49C99A]/15',
      icon: <ShieldCheck className="w-3.5 h-3.5 shrink-0" />,
      shortLabel: 'Not Related (Reviewed)',
    },
    'No Overlap': {
      classes: 'text-[#66758A] dark:text-[#A7B4C6] bg-[#66758A]/10 dark:bg-[#A7B4C6]/10',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
      shortLabel: 'No Overlap',
    },
  };

  const item = map[status] || map['No Overlap'];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[10px] whitespace-nowrap shrink-0 ${item.classes}`}
    >
      {item.icon}
      <span>{compact ? item.shortLabel : status}</span>
    </span>
  );
};

export const DeadlineBadge: React.FC<{ state: DeadlineState }> = ({
  state,
}) => {
  const map: Record<
    DeadlineState,
    { classes: string; icon: React.ReactNode }
  > = {
    Overdue: {
      classes: 'text-[#C83D50] dark:text-[#FF7788] bg-[#C83D50]/12 dark:bg-[#FF7788]/15',
      icon: <FileWarning className="w-3.5 h-3.5 shrink-0" />,
    },
    'Due Soon': {
      classes: 'text-[#B97813] dark:text-[#F4BD62] bg-[#B97813]/12 dark:bg-[#F4BD62]/15',
      icon: <AlertCircle className="w-3.5 h-3.5 shrink-0" />,
    },
    'On Track': {
      classes: 'text-[#18885F] dark:text-[#49C99A] bg-[#18885F]/12 dark:bg-[#49C99A]/15',
      icon: <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />,
    },
    'Deadline Not Configured': {
      classes: 'text-[#66758A] dark:text-[#A7B4C6] bg-[#66758A]/10',
      icon: <Clock className="w-3.5 h-3.5 shrink-0" />,
    },
  };

  const item = map[state];

  return (
    <span
      className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-[10px] whitespace-nowrap shrink-0 ${item.classes}`}
    >
      {item.icon}
      <span>{state}</span>
    </span>
  );
};

export const ConfidenceRing: React.FC<{
  value: number;
  size?: number;
  strokeWidth?: number;
}> = ({ value, size = 56, strokeWidth = 5 }) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(100, value));
  const offset = circumference - (clamped / 100) * circumference;

  const strokeColor =
    clamped >= 85 ? '#3478F6' : clamped >= 70 ? '#18885F' : '#B97813';

  return (
    <div
      className="relative inline-flex items-center justify-center shrink-0"
      style={{ width: size, height: size }}
    >
      <svg className="w-full h-full -rotate-90" viewBox={`0 0 ${size} ${size}`}>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke="rgba(128, 145, 165, 0.22)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="transparent"
          stroke={strokeColor}
          strokeWidth={strokeWidth}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute font-mono-tabular text-xs font-bold text-theme-primary">
        {clamped}%
      </span>
    </div>
  );
};

export const ToastContainer: React.FC = () => {
  const { toasts, dismissToast } = useCaseSync();

  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="pointer-events-auto neu-elevated rounded-[16px] p-4 flex items-start gap-3 border border-theme transition-all duration-200"
        >
          <div className="mt-0.5 shrink-0">
            {toast.variant === 'warning' ? (
              <AlertTriangle className="w-4 h-4 text-[#B97813] dark:text-[#F4BD62]" />
            ) : (
              <CheckCircle2 className="w-4 h-4 text-[#18885F] dark:text-[#49C99A]" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-bold text-theme-primary">{toast.title}</p>
            {toast.description && (
              <p className="text-xs text-theme-secondary mt-0.5 leading-relaxed">
                {toast.description}
              </p>
            )}
          </div>
          <button
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss notification"
            className="text-theme-muted hover:text-theme-primary p-1 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
};

export function formatShortDate(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    });
  } catch {
    return isoString;
  }
}

export function formatDateTime(isoString: string): string {
  try {
    const d = new Date(isoString);
    return d.toLocaleString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoString;
  }
}

export function exportCasesToCsv(
  casesToExport: CaseRecord[],
  filenamePrefix: string = 'AICTE_CaseSync_Filtered_Cases',
  slaConfig?: SlaConfig
): void {
  const escapeCsvCell = (val: string | number | undefined | null): string => {
    const str = String(val ?? '');
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const headers = [
    'Case ID',
    'Date Created (Receipt Date)',
    'Last Activity Timestamp',
    'Institution Name',
    'AICTE Permanent ID',
    'Region',
    'Complaint Subject',
    'Category',
    'Current Bureau / Cell',
    'Assigned Officer',
    'Workflow Status',
    'Priority',
    'SLA Deadline State',
    'Expected Disposal Date',
    'Overlap Status',
    'Linked Case IDs',
    'Last Action Taken',
    'Next Action Required',
  ];

  const rows = casesToExport.map((c) => {
    const deadlineState = computeDeadlineState(
      c.expected_disposal_at,
      c.status,
      slaConfig
    );
    return [
      escapeCsvCell(c.id),
      escapeCsvCell(formatShortDate(c.received_at || c.createdAt)),
      escapeCsvCell(formatDateTime(c.last_action_at || c.updatedAt)),
      escapeCsvCell(c.institutionName),
      escapeCsvCell(c.aicte_permanent_id),
      escapeCsvCell(c.region),
      escapeCsvCell(c.title),
      escapeCsvCell(c.category),
      escapeCsvCell(c.current_bureau),
      escapeCsvCell(c.assigned_officer),
      escapeCsvCell(c.status),
      escapeCsvCell(c.priority),
      escapeCsvCell(deadlineState),
      escapeCsvCell(formatShortDate(c.expected_disposal_at)),
      escapeCsvCell(c.overlap_status),
      escapeCsvCell(c.linked_case_ids.join('; ')),
      escapeCsvCell(c.last_action_taken),
      escapeCsvCell(c.next_action_required),
    ].join(',');
  });

  const dateStamp = new Date().toISOString().slice(0, 10);
  const csvContent = [headers.join(','), ...rows].join('\n');
  const blob = new Blob(['\uFEFF' + csvContent], {
    type: 'text/csv;charset=utf-8;',
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.setAttribute('download', `${filenamePrefix}_${dateStamp}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

