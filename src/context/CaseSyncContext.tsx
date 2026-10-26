import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import {
  INITIAL_ALERTS,
  INITIAL_CASES,
  INITIAL_COORDINATION,
  INITIAL_ESCALATIONS,
  INITIAL_INSTITUTIONS,
  INITIAL_MODEL_EVALUATIONS,
  INITIAL_RELATIONS,
  INITIAL_ROUTING_RULES,
  INITIAL_SLA_CONFIG,
  INITIAL_TRANSFERS,
  classifyAndMatchComplaint,
  computeDeadlineState,
} from '../data/seedData';
import {
  AlertRecord,
  BureauCell,
  CaseAction,
  CaseRecord,
  CaseRelation,
  CaseStatus,
  CoordinationRecord,
  EscalationRecord,
  InstitutionRecord,
  ModelEvaluationMetric,
  OverlapStatus,
  PermissionKey,
  Priority,
  RoutingRule,
  SlaConfig,
  ThemeMode,
  TransferRecord,
  TransferStatus,
  UserRole,
  ViewMode,
  WorkspaceScreen,
} from '../types/casesync';

const STORAGE_KEYS = {
  STATE: 'aicte_casesync_v2_state',
  THEME: 'aicte_casesync_v2_theme_light_default',
  ROLE: 'aicte_casesync_v2_role',
  USER_EMAIL: 'aicte_casesync_v2_user_email',
};

export interface ToastMessage {
  id: string;
  title: string;
  description?: string;
  variant: 'success' | 'info' | 'warning';
}

export interface RoleProfileConfig {
  displayName: string;
  defaultEmail: string;
  shortLabel: string;
  bureau: BureauCell | 'All Bureaus & Cells';
  scopeSummary: string;
  loginDescription: string;
  allowedScreens: WorkspaceScreen[];
  permissions: Record<PermissionKey, boolean>;
  // Backward-compatible convenience flags derived from permissions
  canEditAllBureaus: boolean;
  canManageSettings: boolean;
  canReviewOverlaps: boolean;
  canProcessTransfers: boolean;
  canViewInternalRemarks: boolean;
}

export const ROLE_PROFILES: Record<UserRole, RoleProfileConfig> = {
  Administrator: {
    displayName: 'Meera Nair (System Administrator)',
    defaultEmail: 'admin.casesync@aicte-india.org',
    shortLabel: 'Administrator',
    bureau: 'All Bureaus & Cells',
    scopeSummary: 'System-wide access across all 12 institutions, Bureaus, overlap queues, audit logs, and settings.',
    loginDescription:
      'Manage configurations, review all institutional cases across Bureaus, and access reports, model metrics, and audit records.',
    allowedScreens: [
      'overview',
      'institutions',
      'institution-detail',
      'cases',
      'case-detail',
      'overlaps',
      'coordination',
      'transfers',
      'alerts',
      'reports',
      'audit',
      'settings',
    ],
    permissions: {
      view_all_cases: true,
      view_assigned_cases: true,
      manage_institutions: true,
      update_case_status: true,
      assign_officers: true,
      transfer_cases: true,
      escalate_cases: true,
      review_overlap: true,
      view_reports: true,
      view_audit_trail: true,
      manage_settings: true,
      view_model_metrics: true,
    },
    canEditAllBureaus: true,
    canManageSettings: true,
    canReviewOverlaps: true,
    canProcessTransfers: true,
    canViewInternalRemarks: true,
  },
  'Regulation Bureau Officer (RB)': {
    displayName: 'Dr. S. Subramanian (RB Under Secretary)',
    defaultEmail: 'rb.officer@aicte-india.org',
    shortLabel: 'RB Officer',
    bureau: 'Regulation Bureau (RB)',
    scopeSummary: 'Scoped to Regulation Bureau (RB) cases and linked cross-Bureau institutional complaints.',
    loginDescription:
      'Review and manage permitted Regulation Bureau cases, verify regulatory norm inquiries, and coordinate cross-Bureau overlaps.',
    allowedScreens: [
      'overview',
      'institutions',
      'institution-detail',
      'cases',
      'case-detail',
      'overlaps',
      'coordination',
      'transfers',
      'alerts',
      'reports',
      'audit',
    ],
    permissions: {
      view_all_cases: false,
      view_assigned_cases: true,
      manage_institutions: true,
      update_case_status: true,
      assign_officers: true,
      transfer_cases: true,
      escalate_cases: true,
      review_overlap: true,
      view_reports: true,
      view_audit_trail: true,
      manage_settings: false,
      view_model_metrics: true,
    },
    canEditAllBureaus: false,
    canManageSettings: false,
    canReviewOverlaps: true,
    canProcessTransfers: true,
    canViewInternalRemarks: true,
  },
  'PGRC Officer': {
    displayName: 'R. K. Sharma (PGRC Nodal Officer)',
    defaultEmail: 'pgrc.nodal@aicte-india.org',
    shortLabel: 'PGRC Officer',
    bureau: 'Public Grievance Redressal Cell (PGRC)',
    scopeSummary: 'Scoped to Public Grievance Redressal Cell (PGRC) cases and related institutional overlaps.',
    loginDescription:
      'Review and manage permitted student/public grievance cases, track fee/document redressal, and participate in inter-Bureau coordination.',
    allowedScreens: [
      'overview',
      'institutions',
      'institution-detail',
      'cases',
      'case-detail',
      'overlaps',
      'coordination',
      'transfers',
      'alerts',
      'reports',
      'audit',
    ],
    permissions: {
      view_all_cases: false,
      view_assigned_cases: true,
      manage_institutions: true,
      update_case_status: true,
      assign_officers: true,
      transfer_cases: true,
      escalate_cases: true,
      review_overlap: true,
      view_reports: true,
      view_audit_trail: true,
      manage_settings: false,
      view_model_metrics: true,
    },
    canEditAllBureaus: false,
    canManageSettings: false,
    canReviewOverlaps: true,
    canProcessTransfers: true,
    canViewInternalRemarks: true,
  },
  'Regional Officer': {
    displayName: 'K. Balasubramanian (SRO Regional Officer)',
    defaultEmail: 'sro.officer@aicte-india.org',
    shortLabel: 'Regional Officer',
    bureau: 'Regional Office (SRO)',
    scopeSummary: 'Scoped to Regional Office inspections and institutions in Southern & South-Western regions.',
    loginDescription:
      'Monitor assigned regional cases and related institutions, record inspection reports, and raise cross-Bureau coordination requests.',
    allowedScreens: [
      'overview',
      'institutions',
      'institution-detail',
      'cases',
      'case-detail',
      'overlaps',
      'coordination',
      'transfers',
      'alerts',
      'reports',
    ],
    permissions: {
      view_all_cases: false,
      view_assigned_cases: true,
      manage_institutions: true,
      update_case_status: true,
      assign_officers: false,
      transfer_cases: true,
      escalate_cases: true,
      review_overlap: true,
      view_reports: true,
      view_audit_trail: false,
      manage_settings: false,
      view_model_metrics: false,
    },
    canEditAllBureaus: false,
    canManageSettings: false,
    canReviewOverlaps: true,
    canProcessTransfers: true,
    canViewInternalRemarks: true,
  },
  'Senior Management / Competent Authority': {
    displayName: 'Prof. R. G. Deshmukh (Advisor-I)',
    defaultEmail: 'advisor1@aicte-india.org',
    shortLabel: 'Senior Management',
    bureau: 'All Bureaus & Cells',
    scopeSummary: 'Executive oversight across all institutions, overdue cases, escalations, and unresolved overlaps.',
    loginDescription:
      'View consolidated institutional reports, senior escalations, overdue SLA cases, and cross-Bureau coordination performance.',
    allowedScreens: [
      'overview',
      'institutions',
      'institution-detail',
      'cases',
      'case-detail',
      'overlaps',
      'coordination',
      'transfers',
      'alerts',
      'reports',
      'audit',
      'settings',
    ],
    permissions: {
      view_all_cases: true,
      view_assigned_cases: true,
      manage_institutions: true,
      update_case_status: true,
      assign_officers: true,
      transfer_cases: true,
      escalate_cases: true,
      review_overlap: true,
      view_reports: true,
      view_audit_trail: true,
      manage_settings: false,
      view_model_metrics: true,
    },
    canEditAllBureaus: true,
    canManageSettings: false,
    canReviewOverlaps: true,
    canProcessTransfers: true,
    canViewInternalRemarks: true,
  },
  Submitter: {
    displayName: 'Authorized Institutional / Student Submitter',
    defaultEmail: 'submitter@academic.edu.in',
    shortLabel: 'Submitter',
    bureau: 'Public Grievance Redressal Cell (PGRC)',
    scopeSummary: 'Simplified submission and status tracking view (internal Bureau remarks and admin tools restricted).',
    loginDescription:
      'Submit a new institutional complaint and track permitted submission status without access to restricted internal administrative tools.',
    allowedScreens: [
      'overview',
      'cases',
      'case-detail',
      'institutions',
      'institution-detail',
    ],
    permissions: {
      view_all_cases: false,
      view_assigned_cases: true,
      manage_institutions: false,
      update_case_status: false,
      assign_officers: false,
      transfer_cases: false,
      escalate_cases: false,
      review_overlap: false,
      view_reports: false,
      view_audit_trail: false,
      manage_settings: false,
      view_model_metrics: false,
    },
    canEditAllBureaus: false,
    canManageSettings: false,
    canReviewOverlaps: false,
    canProcessTransfers: false,
    canViewInternalRemarks: false,
  },
};

interface CaseSyncContextValue {
  viewMode: ViewMode;
  setViewMode: (mode: ViewMode) => void;
  activeScreen: WorkspaceScreen;
  setActiveScreen: (screen: WorkspaceScreen) => void;
  theme: ThemeMode;
  toggleTheme: () => void;
  setTheme: (theme: ThemeMode) => void;
  activeRole: UserRole;
  setActiveRole: (role: UserRole) => void;
  activeUserEmail: string;
  roleProfile: RoleProfileConfig;
  hasPermission: (perm: PermissionKey) => boolean;
  openLoginScreen: (preselectedRole?: UserRole, targetScreen?: WorkspaceScreen) => void;
  loginWithRole: (role: UserRole, email?: string) => void;
  signOutToHome: () => void;
  institutions: InstitutionRecord[];
  cases: CaseRecord[];
  allCasesTotalCount: number;
  allInstitutionsTotalCount: number;
  relations: CaseRelation[];
  coordination: CoordinationRecord[];
  transfers: TransferRecord[];
  escalations: EscalationRecord[];
  alerts: AlertRecord[];
  routingRules: RoutingRule[];
  slaConfig: SlaConfig;
  modelEvaluations: ModelEvaluationMetric[];
  lastUpdatedAt: string;
  selectedInstitutionId: string;
  setSelectedInstitutionId: (id: string) => void;
  selectedInstitution: InstitutionRecord;
  institutionTab: 'overview' | 'complaints' | 'coordination' | 'history' | 'reports';
  setInstitutionTab: (
    tab: 'overview' | 'complaints' | 'coordination' | 'history' | 'reports'
  ) => void;
  selectedCaseId: string;
  setSelectedCaseId: (id: string) => void;
  selectedCase: CaseRecord;
  caseListStatusFilter: string;
  setCaseListStatusFilter: (status: string) => void;
  toasts: ToastMessage[];
  addToast: (
    title: string,
    description?: string,
    variant?: ToastMessage['variant']
  ) => void;
  dismissToast: (id: string) => void;
  refreshDataset: () => void;
  openInstitutionProfile: (
    institutionId: string,
    tab?: 'overview' | 'complaints' | 'coordination' | 'history' | 'reports'
  ) => void;
  openCaseDetail: (caseId: string) => void;
  navigateToCasesWithFilter: (statusFilter: string) => void;
  launchWorkspace: (screen?: WorkspaceScreen) => void;
  createComplaintCase: (payload: {
    title: string;
    description: string;
    institutionId?: string;
    institutionName: string;
    aictePermanentId: string;
    submittedBy: string;
    category?: string;
    bureau?: BureauCell;
    priority?: Priority;
  }) => CaseRecord;
  updateCaseRecord: (
    caseId: string,
    updates: {
      status?: CaseStatus;
      priority?: Priority;
      current_bureau?: BureauCell;
      assigned_officer?: string;
      next_action_required?: string;
      expected_disposal_at?: string;
      remark?: string;
      linked_case_id?: string;
    }
  ) => boolean;
  reviewOverlapRelation: (
    relationId: string,
    decision: OverlapStatus,
    remarks: string,
    coordinationOwner?: string,
    nextRequiredAction?: string
  ) => boolean;
  updateCoordinationRecord: (
    coordinationId: string,
    updates: {
      coordination_owner?: string;
      agreed_next_action?: string;
      status?: CoordinationRecord['status'];
      remark?: string;
    }
  ) => boolean;
  requestCaseTransfer: (payload: {
    caseId: string;
    receivingBureau: BureauCell;
    receivingOfficer: string;
    reason: string;
    remarks: string;
  }) => boolean;
  respondToTransfer: (
    transferId: string,
    decision: TransferStatus,
    remarks: string
  ) => boolean;
  escalateCase: (payload: {
    caseId: string;
    escalationLevel: EscalationRecord['escalation_level'];
    responsibleAuthority: string;
    reason: string;
    requiredNextAction: string;
  }) => boolean;
  resolveEscalation: (escalationId: string, remarks: string) => boolean;
  updateAlertItem: (
    alertId: string,
    action: 'acknowledge' | 'resolve' | 'dismiss',
    reason?: string
  ) => boolean;
  markAlertRead: (alertId: string, isRead?: boolean) => void;
  markAllAlertsRead: () => void;
  assignAlertItem: (alertId: string, assignee: string) => boolean;
  saveSystemSettings: (newRules: RoutingRule[], newSla: SlaConfig) => void;
  resetSystemState: () => Promise<void>;
}

const CaseSyncContext = createContext<CaseSyncContextValue | undefined>(
  undefined
);

export const CaseSyncProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  // 1. Always open on the public home page ('landing') before login
  const [viewMode, setViewMode] = useState<ViewMode>('landing');
  const [activeScreen, setActiveScreenState] =
    useState<WorkspaceScreen>('overview');
  const [pendingTargetScreen, setPendingTargetScreen] =
    useState<WorkspaceScreen>('overview');

  // 2. Default strictly to Light theme ('light') for first-time visitors
  const [theme, setThemeState] = useState<ThemeMode>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.THEME);
      if (saved === 'dark' || saved === 'light') return saved;
    } catch {
      // ignore
    }
    return 'light';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    try {
      localStorage.setItem(STORAGE_KEYS.THEME, theme);
    } catch {
      // ignore
    }
  }, [theme]);

  const setTheme = (next: ThemeMode) => setThemeState(next);
  const toggleTheme = () =>
    setThemeState((prev) => (prev === 'light' ? 'dark' : 'light'));

  const [activeRole, setActiveRoleState] = useState<UserRole>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.ROLE) as UserRole | null;
      if (saved && saved in ROLE_PROFILES) return saved;
    } catch {
      // ignore
    }
    return 'Administrator';
  });

  const [activeUserEmail, setActiveUserEmail] = useState<string>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.USER_EMAIL);
      if (saved) return saved;
    } catch {
      // ignore
    }
    return ROLE_PROFILES.Administrator.defaultEmail;
  });

  const loadSavedSlice = <T,>(key: string, fallback: T): T => {
    try {
      const raw = localStorage.getItem(STORAGE_KEYS.STATE);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed && parsed[key] !== undefined) return parsed[key];
      }
    } catch {
      // ignore
    }
    return fallback;
  };

  const [allInstitutions, setInstitutions] = useState<InstitutionRecord[]>(() =>
    loadSavedSlice('institutions', INITIAL_INSTITUTIONS)
  );
  const [allCases, setCases] = useState<CaseRecord[]>(() =>
    loadSavedSlice('cases', INITIAL_CASES)
  );
  const [allRelations, setRelations] = useState<CaseRelation[]>(() =>
    loadSavedSlice('relations', INITIAL_RELATIONS)
  );
  const [allCoordination, setCoordination] = useState<CoordinationRecord[]>(() =>
    loadSavedSlice('coordination', INITIAL_COORDINATION)
  );
  const [allTransfers, setTransfers] = useState<TransferRecord[]>(() =>
    loadSavedSlice('transfers', INITIAL_TRANSFERS)
  );
  const [allEscalations, setEscalations] = useState<EscalationRecord[]>(() =>
    loadSavedSlice('escalations', INITIAL_ESCALATIONS)
  );
  const [allAlerts, setAlerts] = useState<AlertRecord[]>(() =>
    loadSavedSlice('alerts', INITIAL_ALERTS)
  );
  const [routingRules, setRoutingRules] = useState<RoutingRule[]>(() =>
    loadSavedSlice('routingRules', INITIAL_ROUTING_RULES)
  );
  const [slaConfig, setSlaConfig] = useState<SlaConfig>(() =>
    loadSavedSlice('slaConfig', INITIAL_SLA_CONFIG)
  );
  const [lastUpdatedAt, setLastUpdatedAt] = useState<string>(() =>
    new Date().toISOString()
  );

  const [selectedInstitutionId, setSelectedInstitutionId] =
    useState<string>('INST-101');
  const [institutionTab, setInstitutionTab] = useState<
    'overview' | 'complaints' | 'coordination' | 'history' | 'reports'
  >('overview');
  const [selectedCaseId, setSelectedCaseId] =
    useState<string>('CMP-2026-0142');
  const [caseListStatusFilter, setCaseListStatusFilter] =
    useState<string>('ALL');
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const [serverHydrated, setServerHydrated] = useState<boolean>(false);

  // Hydrate persistent state and active server session on mount
  useEffect(() => {
    let active = true;
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!active || !data) return;
        if (Array.isArray(data.institutions) && data.institutions.length > 0) {
          setInstitutions(data.institutions);
        }
        if (Array.isArray(data.cases) && data.cases.length > 0) {
          setCases(data.cases);
        }
        if (Array.isArray(data.relations)) {
          setRelations(data.relations);
        }
        if (Array.isArray(data.coordination)) {
          setCoordination(data.coordination);
        }
        if (Array.isArray(data.transfers)) {
          setTransfers(data.transfers);
        }
        if (Array.isArray(data.escalations)) {
          setEscalations(data.escalations);
        }
        if (Array.isArray(data.alerts)) {
          setAlerts(data.alerts);
        }
        if (Array.isArray(data.routingRules) && data.routingRules.length > 0) {
          setRoutingRules(data.routingRules);
        }
        if (data.slaConfig) {
          setSlaConfig(data.slaConfig);
        }
      })
      .catch(() => {
        // Fallback to localStorage state if offline
      })
      .finally(() => {
        if (active) setServerHydrated(true);
      });

    fetch('/api/v1/auth/me')
      .then((res) => (res.ok ? res.json() : null))
      .then((sessionData) => {
        if (!active || !sessionData?.user) return;
        const serverRole = sessionData.user.role as UserRole;
        if (serverRole in ROLE_PROFILES) {
          setActiveRoleState(serverRole);
          setActiveUserEmail(
            sessionData.user.email || ROLE_PROFILES[serverRole].defaultEmail
          );
        }
      })
      .catch(() => {
        // Not logged in yet
      });

    return () => {
      active = false;
    };
  }, []);

  const addToast = (
    title: string,
    description?: string,
    variant: ToastMessage['variant'] = 'success'
  ) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setToasts((prev) => [...prev, { id, title, description, variant }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4200);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const roleProfile = ROLE_PROFILES[activeRole];

  const hasPermission = (perm: PermissionKey): boolean => {
    return Boolean(roleProfile.permissions[perm]);
  };

  // Role-Scoped Data Visibility: Single Source of Truth derived from activeRole
  const cases = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allCases;
    }

    if (activeRole === 'Regulation Bureau Officer (RB)') {
      const rbInstitutionIds = new Set(
        allCases
          .filter((c) => c.current_bureau === 'Regulation Bureau (RB)')
          .map((c) => c.institution_id)
      );
      return allCases.filter(
        (c) =>
          c.current_bureau === 'Regulation Bureau (RB)' ||
          rbInstitutionIds.has(c.institution_id)
      );
    }

    if (activeRole === 'PGRC Officer') {
      const pgrcInstitutionIds = new Set(
        allCases
          .filter(
            (c) =>
              c.current_bureau === 'Public Grievance Redressal Cell (PGRC)'
          )
          .map((c) => c.institution_id)
      );
      return allCases.filter(
        (c) =>
          c.current_bureau === 'Public Grievance Redressal Cell (PGRC)' ||
          pgrcInstitutionIds.has(c.institution_id)
      );
    }

    if (activeRole === 'Regional Officer') {
      return allCases.filter(
        (c) =>
          c.current_bureau.startsWith('Regional Office') ||
          c.region === 'Southern (SRO)' ||
          c.region === 'South-Western (SWRO)'
      );
    }

    if (activeRole === 'Submitter') {
      return allCases.filter(
        (c) =>
          c.current_bureau === 'Public Grievance Redressal Cell (PGRC)' ||
          c.submittedBy.toLowerCase().includes('submitter') ||
          c.submittedBy.toLowerCase().includes('student')
      );
    }

    return allCases;
  }, [allCases, activeRole, roleProfile]);

  const visibleCaseIds = useMemo(
    () => new Set(cases.map((c) => c.id)),
    [cases]
  );

  const visibleInstitutionIds = useMemo(
    () => new Set(cases.map((c) => c.institution_id)),
    [cases]
  );

  const institutions = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allInstitutions;
    }
    const filtered = allInstitutions.filter((inst) =>
      visibleInstitutionIds.has(inst.institution_id)
    );
    return filtered.length > 0 ? filtered : allInstitutions;
  }, [allInstitutions, visibleInstitutionIds, roleProfile]);

  const relations = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allRelations;
    }
    return allRelations.filter(
      (r) =>
        visibleCaseIds.has(r.case_id_a) ||
        visibleCaseIds.has(r.case_id_b) ||
        visibleInstitutionIds.has(r.institution_id)
    );
  }, [allRelations, visibleCaseIds, visibleInstitutionIds, roleProfile]);

  const coordination = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allCoordination;
    }
    return allCoordination.filter(
      (crd) =>
        visibleInstitutionIds.has(crd.institution_id) ||
        crd.related_case_ids.some((id) => visibleCaseIds.has(id))
    );
  }, [allCoordination, visibleCaseIds, visibleInstitutionIds, roleProfile]);

  const transfers = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allTransfers;
    }
    return allTransfers.filter(
      (t) =>
        visibleCaseIds.has(t.case_id) ||
        t.originating_bureau === roleProfile.bureau ||
        t.receiving_bureau === roleProfile.bureau
    );
  }, [allTransfers, visibleCaseIds, roleProfile]);

  const escalations = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allEscalations;
    }
    return allEscalations.filter((e) => visibleCaseIds.has(e.case_id));
  }, [allEscalations, visibleCaseIds, roleProfile]);

  const alerts = useMemo(() => {
    if (roleProfile.permissions.view_all_cases) {
      return allAlerts;
    }
    return allAlerts.filter(
      (a) =>
        visibleInstitutionIds.has(a.institution_id) ||
        a.case_ids.some((id) => visibleCaseIds.has(id))
    );
  }, [allAlerts, visibleCaseIds, visibleInstitutionIds, roleProfile]);

  // Ensure selected case & institution stay valid when role changes
  useEffect(() => {
    if (cases.length > 0 && !cases.some((c) => c.id === selectedCaseId)) {
      setSelectedCaseId(cases[0].id);
    }
    if (
      institutions.length > 0 &&
      !institutions.some((i) => i.institution_id === selectedInstitutionId)
    ) {
      setSelectedInstitutionId(institutions[0].institution_id);
    }
  }, [cases, institutions, selectedCaseId, selectedInstitutionId]);

  const setActiveScreen = (screen: WorkspaceScreen) => {
    if (!roleProfile.allowedScreens.includes(screen)) {
      addToast(
        'Access Restricted for Current Role',
        `${activeRole} does not have permission to open that section.`,
        'warning'
      );
      setActiveScreenState('overview');
      return;
    }
    setActiveScreenState(screen);
  };

  const applyRoleChange = (role: UserRole, email?: string) => {
    const nextProfile = ROLE_PROFILES[role];
    const nextEmail = email?.trim() || nextProfile.defaultEmail;
    setActiveRoleState(role);
    setActiveUserEmail(nextEmail);
    try {
      localStorage.setItem(STORAGE_KEYS.ROLE, role);
      localStorage.setItem(STORAGE_KEYS.USER_EMAIL, nextEmail);
    } catch {
      // ignore
    }
    if (!nextProfile.allowedScreens.includes(activeScreen)) {
      setActiveScreenState('overview');
    }
  };

  const setActiveRole = (role: UserRole) => {
    applyRoleChange(role);
    addToast(
      `Active Role: ${role}`,
      ROLE_PROFILES[role].scopeSummary,
      'info'
    );
  };

  const openLoginScreen = (
    preselectedRole?: UserRole,
    targetScreen: WorkspaceScreen = 'overview'
  ) => {
    if (preselectedRole) {
      setActiveRoleState(preselectedRole);
      setActiveUserEmail(ROLE_PROFILES[preselectedRole].defaultEmail);
    }
    setPendingTargetScreen(targetScreen);
    setViewMode('login');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const loginWithRole = (role: UserRole, email?: string) => {
    applyRoleChange(role, email);
    const nextProfile = ROLE_PROFILES[role];
    const dest = nextProfile.allowedScreens.includes(pendingTargetScreen)
      ? pendingTargetScreen
      : 'overview';
    setActiveScreenState(dest);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(
      `Signed in as ${nextProfile.shortLabel}`,
      nextProfile.scopeSummary,
      'success'
    );
  };

  const signOutToHome = () => {
    fetch('/api/v1/auth/logout', { method: 'POST' }).catch(() => {
      // ignore
    });
    try {
      sessionStorage.removeItem('aicte_casesync_auth_token');
    } catch {
      // ignore
    }
    setViewMode('landing');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    addToast(
      'Signed Out',
      'Your session has been terminated and returned to the home page.',
      'info'
    );
  };

  // Deterministic Alert & SLA Synchronization Engine (Deduplicated by stable key)
  useEffect(() => {
    setAlerts((prevAlerts) => {
      let changed = false;
      const nextAlerts = prevAlerts.map((a) => {
        // Ensure backward-compatible defaults on stored alerts
        const normalizedLifecycle =
          a.lifecycle_status ||
          (a.resolution_status === 'Resolved'
            ? 'Resolved'
            : a.resolution_status === 'Dismissed'
              ? 'Dismissed'
              : a.acknowledgement_status === 'Acknowledged'
                ? 'Acknowledged'
                : 'Active');
        const normalizedRead = a.is_read ?? false;
        if (
          a.lifecycle_status !== normalizedLifecycle ||
          a.is_read === undefined
        ) {
          changed = true;
          return {
            ...a,
            lifecycle_status: normalizedLifecycle,
            is_read: normalizedRead,
          };
        }
        return a;
      });

      const byKey = new Map<string, number>();
      nextAlerts.forEach((a, idx) => {
        if (a.deduplication_key) {
          byKey.set(a.deduplication_key, idx);
        }
      });

      const upsertAlert = (candidate: AlertRecord) => {
        const key = candidate.deduplication_key;
        if (!key) return;
        const existingIdx = byKey.get(key);
        if (existingIdx === undefined) {
          // Also check if an older alert without deduplication_key matches the same type and case_ids
          const legacyIdx = nextAlerts.findIndex(
            (existing) =>
              existing.alert_type === candidate.alert_type &&
              existing.case_ids.some((id) => candidate.case_ids.includes(id))
          );
          if (legacyIdx !== -1) {
            byKey.set(key, legacyIdx);
            if (!nextAlerts[legacyIdx].deduplication_key) {
              nextAlerts[legacyIdx] = {
                ...nextAlerts[legacyIdx],
                deduplication_key: key,
                title: nextAlerts[legacyIdx].title || candidate.title,
                region: nextAlerts[legacyIdx].region || candidate.region,
              };
              changed = true;
            }
            return;
          }
          nextAlerts.unshift(candidate);
          byKey.set(key, 0);
          changed = true;
        }
      };

      // 1. Check Overdue & Approaching Deadline cases
      allCases.forEach((c) => {
        const dState = computeDeadlineState(c, undefined, slaConfig);
        const overdueKey = `overdue:${c.id}`;
        const dueSoonKey = `duesoon:${c.id}`;

        if (c.status === 'Disposed') {
          nextAlerts.forEach((a, idx) => {
            if (
              a.resolution_status === 'Open' &&
              a.case_ids.length === 1 &&
              a.case_ids[0] === c.id &&
              (a.alert_type === 'Overdue Case' ||
                a.alert_type === 'Case Approaching Deadline')
            ) {
              nextAlerts[idx] = {
                ...a,
                acknowledgement_status: 'Acknowledged',
                resolution_status: 'Resolved',
                lifecycle_status: 'Resolved',
                resolved_at: new Date().toISOString(),
                resolution_reason: `Automatically resolved upon disposal of ${c.id}.`,
              };
              changed = true;
            }
          });
          return;
        }

        if (dState === 'Overdue') {
          upsertAlert({
            alert_id: `ALT-OVD-${c.id.slice(-4)}`,
            title: `Overdue Disposal Deadline — ${c.title}`,
            alert_type: 'Overdue Case',
            case_ids: [c.id],
            institution_id: c.institution_id,
            institution_name: c.institutionName,
            aicte_permanent_id: c.aicte_permanent_id,
            region: c.region,
            bureaus: [c.current_bureau],
            severity: 'Critical',
            reason: `Case ${c.id} has exceeded its expected disposal deadline (${new Date(c.expected_disposal_at).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}).`,
            recommended_action: `Expedite Bureau disposal or escalate ${c.id} for senior review.`,
            created_at: c.updatedAt || c.createdAt,
            due_at: c.expected_disposal_at,
            assigned_to: c.assigned_officer,
            is_read: false,
            lifecycle_status: 'Active',
            deduplication_key: overdueKey,
            acknowledgement_status: 'Unacknowledged',
            resolution_status: 'Open',
          });
        } else if (dState === 'Due Soon') {
          upsertAlert({
            alert_id: `ALT-DUE-${c.id.slice(-4)}`,
            title: `Disposal Deadline Approaching — ${c.title}`,
            alert_type: 'Case Approaching Deadline',
            case_ids: [c.id],
            institution_id: c.institution_id,
            institution_name: c.institutionName,
            aicte_permanent_id: c.aicte_permanent_id,
            region: c.region,
            bureaus: [c.current_bureau],
            severity: 'High',
            reason: `Case ${c.id} is within the configured ${slaConfig.dueSoonDaysThreshold}-day SLA threshold prior to expected disposal.`,
            recommended_action: `Complete pending Bureau action on ${c.id} before deadline.`,
            created_at: c.updatedAt || c.createdAt,
            due_at: c.expected_disposal_at,
            assigned_to: c.assigned_officer,
            is_read: false,
            lifecycle_status: 'Active',
            deduplication_key: dueSoonKey,
            acknowledgement_status: 'Unacknowledged',
            resolution_status: 'Open',
          });
        }
      });

      // 2. Check Cross-Bureau Overlaps & Uncertain Identities
      if (slaConfig.enableCrossBureauAlerts) {
        allRelations.forEach((rel) => {
          const relKey = `rel:${rel.relation_id}`;
          const inst = allInstitutions.find(
            (i) => i.institution_id === rel.institution_id
          );
          if (
            rel.review_status === 'Potential Overlap — Review Required' ||
            rel.review_status === 'Institution Identity Uncertain'
          ) {
            const isIdentity =
              rel.review_status === 'Institution Identity Uncertain';
            upsertAlert({
              alert_id: `ALT-${rel.relation_id}`,
              title: isIdentity
                ? `Institution Identity Verification Required — ${rel.institution_name}`
                : `Potential Cross-Bureau Overlap — ${rel.case_id_a} & ${rel.case_id_b}`,
              alert_type: isIdentity
                ? 'Institution Identity Verification'
                : 'Potential Overlapping Cases',
              case_ids: [rel.case_id_a, rel.case_id_b],
              institution_id: rel.institution_id,
              institution_name: rel.institution_name,
              aicte_permanent_id: rel.aicte_permanent_id,
              region: inst?.region,
              bureaus: Array.from(new Set([rel.bureau_a, rel.bureau_b])),
              severity: isIdentity ? 'High' : 'Critical',
              reason: rel.why_raised || rel.remarks,
              recommended_action: rel.next_required_action,
              created_at: '2026-10-25T10:00:00Z',
              due_at: '2026-10-28T18:00:00Z',
              assigned_to: rel.coordination_owner,
              is_read: false,
              lifecycle_status: 'Active',
              deduplication_key: relKey,
              acknowledgement_status: 'Unacknowledged',
              resolution_status: 'Open',
            });
          }
        });
      }

      // 3. Check Pending Transfers
      allTransfers.forEach((trf) => {
        const trfKey = `trf:${trf.transfer_id}`;
        const isPending =
          trf.transfer_status === 'Awaiting Acceptance' ||
          trf.transfer_status === 'Transfer Requested';
        const inst = allInstitutions.find(
          (i) => i.institution_id === trf.institution_id
        );
        if (isPending) {
          upsertAlert({
            alert_id: `ALT-${trf.transfer_id}`,
            title: `Transfer ${trf.transfer_id} Awaiting Acceptance by ${trf.receiving_bureau}`,
            alert_type: 'Cases Pending Transfer Acceptance',
            case_ids: [trf.case_id],
            institution_id: trf.institution_id,
            institution_name: trf.institution_name,
            aicte_permanent_id: inst?.aicte_permanent_id || '1-000000000',
            region: inst?.region,
            bureaus: [trf.originating_bureau, trf.receiving_bureau],
            severity: 'High',
            reason: `Transfer ${trf.transfer_id} (${trf.originating_bureau} → ${trf.receiving_bureau}) awaits acceptance.`,
            recommended_action:
              'Accept or return transfer in Transfers & Escalations.',
            created_at: trf.requested_at,
            due_at: '2026-10-29T18:00:00Z',
            assigned_to: trf.receiving_officer,
            is_read: false,
            lifecycle_status: 'Active',
            deduplication_key: trfKey,
            acknowledgement_status: 'Unacknowledged',
            resolution_status: 'Open',
          });
        }
      });

      // 4. Check Escalations Awaiting Action
      allEscalations.forEach((esc) => {
        const escKey = `esc:${esc.escalation_id}`;
        const inst = allInstitutions.find(
          (i) => i.institution_id === esc.institution_id
        );
        if (esc.status !== 'Resolved') {
          upsertAlert({
            alert_id: `ALT-${esc.escalation_id}`,
            title: `${esc.escalation_level} Escalation (${esc.escalation_id}) — ${esc.case_id}`,
            alert_type: 'Escalation Awaiting Action',
            case_ids: [esc.case_id],
            institution_id: esc.institution_id,
            institution_name: esc.institution_name,
            aicte_permanent_id: inst?.aicte_permanent_id || '1-000000000',
            region: inst?.region,
            bureaus: [esc.bureau],
            severity: 'Critical',
            reason: esc.reason,
            recommended_action: esc.required_next_action,
            created_at: esc.timestamp,
            due_at: '2026-10-28T18:00:00Z',
            assigned_to: esc.responsible_authority,
            is_read: false,
            lifecycle_status:
              esc.status === 'Acknowledged' ? 'Acknowledged' : 'Active',
            deduplication_key: escKey,
            acknowledgement_status:
              esc.status === 'Acknowledged' ? 'Acknowledged' : 'Unacknowledged',
            resolution_status: 'Open',
          });
        }
      });

      return changed ? nextAlerts : prevAlerts;
    });
  }, [
    allCases,
    allRelations,
    allCoordination,
    allTransfers,
    allEscalations,
    allInstitutions,
    slaConfig,
  ]);

  // Persist unified state to localStorage and sync to backend
  useEffect(() => {
    const payload = {
      institutions: allInstitutions,
      cases: allCases,
      relations: allRelations,
      coordination: allCoordination,
      transfers: allTransfers,
      escalations: allEscalations,
      alerts: allAlerts,
      routingRules,
      slaConfig,
    };
    try {
      localStorage.setItem(STORAGE_KEYS.STATE, JSON.stringify(payload));
    } catch {
      // ignore
    }
    if (!serverHydrated) return;
    fetch('/api/sync', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).catch(() => {
      // ignore offline
    });
  }, [
    serverHydrated,
    allInstitutions,
    allCases,
    allRelations,
    allCoordination,
    allTransfers,
    allEscalations,
    allAlerts,
    routingRules,
    slaConfig,
  ]);

  const selectedInstitution =
    institutions.find((i) => i.institution_id === selectedInstitutionId) ||
    institutions[0] ||
    allInstitutions[0];

  const selectedCase =
    cases.find((c) => c.id === selectedCaseId) || cases[0] || allCases[0];

  const refreshDataset = () => {
    fetch('/api/state')
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (data) {
          if (Array.isArray(data.institutions)) setInstitutions(data.institutions);
          if (Array.isArray(data.cases)) setCases(data.cases);
          if (Array.isArray(data.relations)) setRelations(data.relations);
          if (Array.isArray(data.coordination)) setCoordination(data.coordination);
          if (Array.isArray(data.transfers)) setTransfers(data.transfers);
          if (Array.isArray(data.escalations)) setEscalations(data.escalations);
          if (Array.isArray(data.alerts)) setAlerts(data.alerts);
        }
      })
      .catch(() => {
        // ignore
      });
    setLastUpdatedAt(new Date().toISOString());
    addToast(
      'Monitoring Dataset Refreshed',
      `Synchronized ${cases.length} visible complaints across ${institutions.length} institutions for ${activeRole}.`,
      'info'
    );
  };

  const openInstitutionProfile = (
    institutionId: string,
    tab:
      | 'overview'
      | 'complaints'
      | 'coordination'
      | 'history'
      | 'reports' = 'overview'
  ) => {
    setSelectedInstitutionId(institutionId);
    setInstitutionTab(tab);
    if (viewMode === 'landing') {
      setPendingTargetScreen('institution-detail');
      setViewMode('login');
    } else {
      setViewMode('workspace');
      setActiveScreenState('institution-detail');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openCaseDetail = (caseId: string) => {
    setSelectedCaseId(caseId);
    if (viewMode === 'landing') {
      setPendingTargetScreen('case-detail');
      setViewMode('login');
    } else {
      setViewMode('workspace');
      setActiveScreenState('case-detail');
    }
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const navigateToCasesWithFilter = (statusFilter: string) => {
    setCaseListStatusFilter(statusFilter);
    setViewMode('workspace');
    setActiveScreenState('cases');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const launchWorkspace = (screen: WorkspaceScreen = 'overview') => {
    if (viewMode === 'landing') {
      openLoginScreen(activeRole, screen);
      return;
    }
    setActiveScreen(screen);
    setViewMode('workspace');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const createComplaintCase = (payload: {
    title: string;
    description: string;
    institutionId?: string;
    institutionName: string;
    aictePermanentId: string;
    submittedBy: string;
    category?: string;
    bureau?: BureauCell;
    priority?: Priority;
  }): CaseRecord => {
    const matchInfo = classifyAndMatchComplaint(
      payload.description,
      payload.title,
      payload.institutionName,
      payload.aictePermanentId,
      allCases,
      allInstitutions,
      routingRules
    );

    const targetInst =
      (payload.institutionId &&
        allInstitutions.find(
          (i) => i.institution_id === payload.institutionId
        )) ||
      matchInfo.matchedInstitution ||
      allInstitutions[0];

    const nextNum = 143 + allCases.length;
    const newCaseId = `CMP-2026-0${nextNum}`;
    const now = new Date().toISOString();
    const dueDate = new Date(
      Date.now() + slaConfig.defaultDisposalDays * 24 * 60 * 60 * 1000
    ).toISOString();

    const assignedBureau = payload.bureau || matchInfo.recommendedDepartment;
    const assignedCat = payload.category || matchInfo.predictedCategory;
    const assignedPriority = payload.priority || matchInfo.priority;

    const hasCrossBureauOverlap = matchInfo.relatedCaseIds.length > 0;
    const overlapStatus: OverlapStatus = matchInfo.isIdentityUncertain
      ? 'Institution Identity Uncertain'
      : hasCrossBureauOverlap
        ? 'Potential Overlap — Review Required'
        : 'No Overlap';

    const timeline: CaseAction[] = [
      {
        action_id: `ACT-${Date.now()}-1`,
        case_id: newCaseId,
        institution_id: targetInst.institution_id,
        actor: payload.submittedBy || roleProfile.displayName,
        actor_role: activeRole,
        bureau: assignedBureau,
        action_type: 'Complaint Received',
        remarks: `Complaint registered against ${targetInst.name} (${targetInst.aicte_permanent_id}).`,
        timestamp: now,
      },
    ];

    if (hasCrossBureauOverlap) {
      timeline.push({
        action_id: `ACT-${Date.now()}-2`,
        case_id: newCaseId,
        institution_id: targetInst.institution_id,
        actor: 'CaseSync Matching Engine',
        actor_role: 'System Matching Engine',
        bureau: 'Central Registry',
        action_type: 'Related Case Detected',
        remarks: `Potential cross-Bureau overlap detected with active case(s) ${matchInfo.relatedCaseIds.join(', ')} at ${targetInst.name}.`,
        timestamp: now,
      });
    }

    const newCase: CaseRecord = {
      id: newCaseId,
      institution_id: targetInst.institution_id,
      aicte_permanent_id: targetInst.aicte_permanent_id,
      institutionName: targetInst.name,
      region: targetInst.region,
      received_at: now,
      title: payload.title.trim(),
      description: payload.description.trim(),
      submittedBy: payload.submittedBy.trim() || roleProfile.displayName,
      category: assignedCat,
      predictedCategory: matchInfo.predictedCategory,
      confirmedCategory: assignedCat,
      isCategoryOverridden: assignedCat !== matchInfo.predictedCategory,
      current_bureau: assignedBureau,
      recommendedDepartment: matchInfo.recommendedDepartment,
      assignedDepartment: assignedBureau,
      isDepartmentOverridden: assignedBureau !== matchInfo.recommendedDepartment,
      assigned_officer: `${assignedBureau.split(' ')[0]} Nodal Officer`,
      status: 'Received',
      priority: assignedPriority,
      last_action_taken:
        'Complaint registered and evaluated for cross-Bureau overlap.',
      last_action_at: now,
      next_action_required: hasCrossBureauOverlap
        ? `Review potential overlap with ${matchInfo.relatedCaseIds.join(', ')} before initiating duplicate action.`
        : 'Initial Bureau officer scrutiny and assignment.',
      expected_disposal_at: dueDate,
      createdAt: now,
      updatedAt: now,
      linked_case_ids: matchInfo.relatedCaseIds,
      overlap_status: overlapStatus,
      supporting_documents: [],
      confidence: matchInfo.confidence,
      classificationSource: matchInfo.classificationSource,
      explanation: matchInfo.explanation,
      timeline,
    };

    setCases((prev) => [newCase, ...prev]);

    if (hasCrossBureauOverlap) {
      const companionCase = allCases.find(
        (c) => c.id === matchInfo.relatedCaseIds[0]
      );
      if (companionCase) {
        const newRelation: CaseRelation = {
          relation_id: `REL-${Date.now()}`,
          institution_id: targetInst.institution_id,
          institution_name: targetInst.name,
          aicte_permanent_id: targetInst.aicte_permanent_id,
          case_id_a: newCaseId,
          case_id_b: companionCase.id,
          bureau_a: assignedBureau,
          bureau_b: companionCase.current_bureau,
          relation_type: 'Overlapping Regulatory & Grievance Issue',
          match_method:
            'Layer 1 Exact Permanent ID + Layer 2 Semantic Issue Match',
          match_score: matchInfo.confidence,
          review_status: 'Potential Overlap — Review Required',
          remarks: `Automatically flagged on complaint intake: ${newCaseId} (${assignedBureau}) and ${companionCase.id} (${companionCase.current_bureau}) both concern ${targetInst.name}.`,
          matching_signals: [
            `Exact AICTE Permanent ID: ${targetInst.aicte_permanent_id}`,
            ...matchInfo.explanation.matchedSignals,
          ],
          why_raised:
            'Multiple Bureaus have active complaints for the same institution.',
          missing_or_uncertain: 'Awaiting human officer overlap review.',
          coordination_owner: companionCase.assigned_officer,
          next_required_action:
            'Review relationship in Overlap Detection workspace.',
        };
        setRelations((prev) => [newRelation, ...prev]);

        const newAlert: AlertRecord = {
          alert_id: `ALT-${Date.now()}`,
          alert_type: 'Potential Overlapping Cases',
          case_ids: [newCaseId, companionCase.id],
          institution_id: targetInst.institution_id,
          institution_name: targetInst.name,
          aicte_permanent_id: targetInst.aicte_permanent_id,
          bureaus: [assignedBureau, companionCase.current_bureau],
          severity: 'High',
          reason: `New complaint ${newCaseId} matches institution ${targetInst.name} with active case ${companionCase.id} in ${companionCase.current_bureau}.`,
          recommended_action: 'Open Overlap Detection to review relationship.',
          created_at: now,
          due_at: dueDate,
          assigned_to: companionCase.assigned_officer,
          acknowledgement_status: 'Unacknowledged',
          resolution_status: 'Open',
        };
        setAlerts((prev) => [newAlert, ...prev]);
      }
    }

    setLastUpdatedAt(now);
    setSelectedCaseId(newCase.id);
    addToast(
      `Complaint ${newCase.id} Logged`,
      hasCrossBureauOverlap
        ? `Cross-Bureau overlap alert raised for ${targetInst.name}.`
        : `Assigned to ${assignedBureau}.`
    );
    return newCase;
  };

  const updateCaseRecord = (
    caseId: string,
    updates: {
      status?: CaseStatus;
      priority?: Priority;
      current_bureau?: BureauCell;
      assigned_officer?: string;
      next_action_required?: string;
      expected_disposal_at?: string;
      remark?: string;
      linked_case_id?: string;
    }
  ): boolean => {
    if (!hasPermission('update_case_status')) {
      addToast(
        'Action Restricted',
        `${activeRole} cannot modify official Bureau status or internal remarks.`,
        'warning'
      );
      return false;
    }

    const now = new Date().toISOString();
    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== caseId) return c;
        const newEvents: CaseAction[] = [];

        if (updates.status && updates.status !== c.status) {
          newEvents.push({
            action_id: `ACT-${Date.now()}-st`,
            case_id: caseId,
            institution_id: c.institution_id,
            actor: roleProfile.displayName,
            actor_role: activeRole,
            bureau: c.current_bureau,
            action_type:
              updates.status === 'Disposed' ? 'Case Disposed' : 'Status Updated',
            previous_value: c.status,
            new_value: updates.status,
            remarks:
              updates.remark?.trim() ||
              `Status updated from ${c.status} to ${updates.status}.`,
            timestamp: now,
          });
        } else if (updates.remark?.trim()) {
          newEvents.push({
            action_id: `ACT-${Date.now()}-rm`,
            case_id: caseId,
            institution_id: c.institution_id,
            actor: roleProfile.displayName,
            actor_role: activeRole,
            bureau: c.current_bureau,
            action_type: 'Action Remark Added',
            remarks: updates.remark.trim(),
            timestamp: now,
          });
        }

        if (
          updates.assigned_officer &&
          updates.assigned_officer !== c.assigned_officer
        ) {
          newEvents.push({
            action_id: `ACT-${Date.now()}-of`,
            case_id: caseId,
            institution_id: c.institution_id,
            actor: roleProfile.displayName,
            actor_role: activeRole,
            bureau: c.current_bureau,
            action_type: 'Case Assigned',
            previous_value: c.assigned_officer,
            new_value: updates.assigned_officer,
            remarks: `Assigned officer updated to ${updates.assigned_officer}.`,
            timestamp: now,
          });
        }

        const nextLinked = updates.linked_case_id
          ? Array.from(new Set([...c.linked_case_ids, updates.linked_case_id]))
          : c.linked_case_ids;

        return {
          ...c,
          status: updates.status || c.status,
          priority: updates.priority || c.priority,
          current_bureau: updates.current_bureau || c.current_bureau,
          assignedDepartment: updates.current_bureau || c.assignedDepartment,
          assigned_officer: updates.assigned_officer || c.assigned_officer,
          next_action_required:
            updates.next_action_required ?? c.next_action_required,
          expected_disposal_at:
            updates.expected_disposal_at ?? c.expected_disposal_at,
          last_action_taken:
            updates.remark?.trim() ||
            (updates.status
              ? `Status changed to ${updates.status}`
              : c.last_action_taken),
          last_action_at: now,
          updatedAt: now,
          linked_case_ids: nextLinked,
          timeline: [...c.timeline, ...newEvents],
        };
      })
    );

    if (updates.status === 'Disposed') {
      setAlerts((prev) =>
        prev.map((a) =>
          a.case_ids.includes(caseId)
            ? {
                ...a,
                acknowledgement_status: 'Acknowledged',
                resolution_status: 'Resolved',
              }
            : a
        )
      );
    }

    setLastUpdatedAt(now);
    addToast(
      `Updated ${caseId}`,
      'Case status, remarks, alerts, and chronological audit history updated.'
    );
    return true;
  };

  const reviewOverlapRelation = (
    relationId: string,
    decision: OverlapStatus,
    remarks: string,
    coordinationOwner?: string,
    nextRequiredAction?: string
  ): boolean => {
    if (!hasPermission('review_overlap')) {
      addToast(
        'Permission Denied',
        `Current role (${activeRole}) is not authorized to review cross-Bureau overlap alerts.`,
        'warning'
      );
      return false;
    }

    const targetRel = allRelations.find((r) => r.relation_id === relationId);
    if (!targetRel) return false;

    const now = new Date().toISOString();

    setRelations((prev) =>
      prev.map((r) =>
        r.relation_id === relationId
          ? {
              ...r,
              review_status: decision,
              reviewed_by: roleProfile.displayName,
              reviewed_at: now,
              remarks: remarks.trim() || r.remarks,
              coordination_owner:
                coordinationOwner?.trim() || r.coordination_owner,
              next_required_action:
                nextRequiredAction?.trim() || r.next_required_action,
            }
          : r
      )
    );

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== targetRel.case_id_a && c.id !== targetRel.case_id_b) {
          return c;
        }
        const auditEvent: CaseAction = {
          action_id: `ACT-${Date.now()}-${c.id}`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: c.current_bureau,
          action_type: 'Overlap Reviewed',
          previous_value: c.overlap_status,
          new_value: decision,
          remarks: `Overlap review (${targetRel.case_id_a} & ${targetRel.case_id_b}): ${decision}. ${remarks.trim()}`,
          timestamp: now,
          reference_id: relationId,
        };
        return {
          ...c,
          overlap_status: decision,
          last_action_taken: `Overlap review recorded: ${decision}`,
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, auditEvent],
        };
      })
    );

    if (decision === 'Confirmed Related Cases') {
      setInstitutions((prev) =>
        prev.map((inst) =>
          inst.institution_id === targetRel.institution_id
            ? { ...inst, verification_status: 'Verified' }
            : inst
        )
      );
    }

    // Update associated overlap alert lifecycle when officer reviews overlap
    setAlerts((prev) =>
      prev.map((a) => {
        const matchesRel =
          a.deduplication_key === `rel:${relationId}` ||
          ((a.alert_type === 'Potential Overlapping Cases' ||
            a.alert_type === 'Institution Identity Verification') &&
            a.case_ids.includes(targetRel.case_id_a) &&
            a.case_ids.includes(targetRel.case_id_b));
        if (!matchesRel) return a;
        if (decision === 'Not Related — Reviewed') {
          return {
            ...a,
            acknowledgement_status: 'Acknowledged',
            resolution_status: 'Resolved',
            lifecycle_status: 'Resolved',
            resolved_by: roleProfile.displayName,
            resolved_at: now,
            resolution_reason: `Reviewed as separate unrelated matters: ${remarks.trim()}`,
          };
        }
        if (decision === 'Confirmed Related Cases') {
          return {
            ...a,
            acknowledgement_status: 'Acknowledged',
            resolution_status: 'Resolved',
            lifecycle_status: 'Resolved',
            acknowledged_by: roleProfile.displayName,
            resolved_by: roleProfile.displayName,
            resolved_at: now,
            assigned_to: coordinationOwner?.trim() || a.assigned_to,
            resolution_reason: `Relationship confirmed by ${roleProfile.displayName}; linked for cross-Bureau coordination.`,
          };
        }
        return {
          ...a,
          acknowledgement_status: 'Acknowledged',
          lifecycle_status: 'Acknowledged',
          acknowledged_by: roleProfile.displayName,
        };
      })
    );

    setLastUpdatedAt(now);
    addToast(
      `Overlap Decision Recorded (${decision})`,
      `Cases ${targetRel.case_id_a} and ${targetRel.case_id_b} remain independently identifiable with linked audit history.`
    );
    return true;
  };

  const updateCoordinationRecord = (
    coordinationId: string,
    updates: {
      coordination_owner?: string;
      agreed_next_action?: string;
      status?: CoordinationRecord['status'];
      remark?: string;
    }
  ): boolean => {
    if (!hasPermission('review_overlap')) {
      addToast(
        'Permission Denied',
        'Switch to an Officer or Administrator role to record inter-Bureau coordination decisions.',
        'warning'
      );
      return false;
    }

    const target = allCoordination.find(
      (c) => c.coordination_id === coordinationId
    );
    if (!target) return false;
    const now = new Date().toISOString();

    setCoordination((prev) =>
      prev.map((item) =>
        item.coordination_id === coordinationId
          ? {
              ...item,
              coordination_owner:
                updates.coordination_owner?.trim() || item.coordination_owner,
              agreed_next_action:
                updates.agreed_next_action?.trim() || item.agreed_next_action,
              status: updates.status || item.status,
              latest_remark: updates.remark?.trim() || item.latest_remark,
              updated_at: now,
            }
          : item
      )
    );

    setCases((prev) =>
      prev.map((c) => {
        if (!target.related_case_ids.includes(c.id)) return c;
        const evt: CaseAction = {
          action_id: `ACT-${Date.now()}-crd-${c.id}`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: c.current_bureau,
          action_type: 'Coordination Requested',
          remarks: `Cross-Bureau Coordination (${coordinationId}): ${updates.agreed_next_action || updates.remark || 'Updated coordination action'}.`,
          timestamp: now,
          reference_id: coordinationId,
        };
        return {
          ...c,
          next_action_required:
            updates.agreed_next_action?.trim() || c.next_action_required,
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, evt],
        };
      })
    );

    if (updates.status === 'Resolved') {
      setAlerts((prev) =>
        prev.map((a) =>
          a.deduplication_key === `crd:${coordinationId}` ||
          (a.alert_type === 'Cases Awaiting Bureau Coordination' &&
            a.institution_id === target.institution_id)
            ? {
                ...a,
                acknowledgement_status: 'Acknowledged',
                resolution_status: 'Resolved',
                lifecycle_status: 'Resolved',
                resolved_by: roleProfile.displayName,
                resolved_at: now,
                resolution_reason:
                  updates.remark?.trim() ||
                  'Inter-Bureau coordination completed.',
              }
            : a
        )
      );
    }

    setLastUpdatedAt(now);
    addToast(
      `Coordination ${coordinationId} Updated`,
      'Agreed next action and audit history synchronized across related cases.'
    );
    return true;
  };

  const requestCaseTransfer = (payload: {
    caseId: string;
    receivingBureau: BureauCell;
    receivingOfficer: string;
    reason: string;
    remarks: string;
  }): boolean => {
    if (!hasPermission('transfer_cases')) {
      addToast(
        'Permission Denied',
        'Current role cannot initiate inter-Bureau case transfers.',
        'warning'
      );
      return false;
    }

    const targetCase = allCases.find((c) => c.id === payload.caseId);
    if (!targetCase) return false;

    const now = new Date().toISOString();
    const transferId = `TRF-2026-0${allTransfers.length + 1}`;

    const newTransfer: TransferRecord = {
      transfer_id: transferId,
      case_id: targetCase.id,
      case_subject: targetCase.title,
      institution_id: targetCase.institution_id,
      institution_name: targetCase.institutionName,
      originating_bureau: targetCase.current_bureau,
      receiving_bureau: payload.receivingBureau,
      reason: payload.reason.trim(),
      transferring_officer: roleProfile.displayName,
      receiving_officer:
        payload.receivingOfficer.trim() ||
        `${payload.receivingBureau.split(' ')[0]} Nodal Officer`,
      requested_at: now,
      transfer_status: 'Awaiting Acceptance',
      remarks: payload.remarks.trim(),
    };

    setTransfers((prev) => [newTransfer, ...prev]);

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== payload.caseId) return c;
        const evt: CaseAction = {
          action_id: `ACT-${Date.now()}-trf`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: c.current_bureau,
          action_type: 'Case Transferred',
          previous_value: c.current_bureau,
          new_value: `${payload.receivingBureau} (Awaiting Acceptance)`,
          remarks: `Transfer ${transferId} requested to ${payload.receivingBureau}: ${payload.reason}`,
          timestamp: now,
          reference_id: transferId,
        };
        return {
          ...c,
          status: 'Transferred',
          last_action_taken: `Transfer requested to ${payload.receivingBureau} (${transferId})`,
          next_action_required: `Receiving Bureau (${payload.receivingBureau}) to accept handoff ${transferId}.`,
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, evt],
        };
      })
    );

    const newAlert: AlertRecord = {
      alert_id: `ALT-${transferId}`,
      title: `Transfer ${transferId} Awaiting Acceptance by ${payload.receivingBureau}`,
      alert_type: 'Cases Pending Transfer Acceptance',
      case_ids: [targetCase.id],
      institution_id: targetCase.institution_id,
      institution_name: targetCase.institutionName,
      aicte_permanent_id: targetCase.aicte_permanent_id,
      region: targetCase.region,
      bureaus: [targetCase.current_bureau, payload.receivingBureau],
      severity: 'High',
      reason: `Transfer ${transferId} from ${targetCase.current_bureau} to ${payload.receivingBureau} is awaiting formal acceptance.`,
      recommended_action: 'Accept or return transfer in Transfers & Escalations.',
      created_at: now,
      due_at: targetCase.expected_disposal_at,
      assigned_to: newTransfer.receiving_officer,
      is_read: false,
      lifecycle_status: 'Active',
      deduplication_key: `trf:${transferId}`,
      acknowledgement_status: 'Unacknowledged',
      resolution_status: 'Open',
    };
    setAlerts((prev) => [newAlert, ...prev]);

    setLastUpdatedAt(now);
    addToast(
      `Transfer ${transferId} Initiated`,
      `Case ${payload.caseId} marked as Transferred awaiting acceptance by ${payload.receivingBureau}.`
    );
    return true;
  };

  const respondToTransfer = (
    transferId: string,
    decision: TransferStatus,
    remarks: string
  ): boolean => {
    if (!hasPermission('transfer_cases')) {
      addToast(
        'Permission Denied',
        'Current role cannot accept or reject transfers.',
        'warning'
      );
      return false;
    }

    const trf = allTransfers.find((t) => t.transfer_id === transferId);
    if (!trf) return false;
    const now = new Date().toISOString();

    setTransfers((prev) =>
      prev.map((t) =>
        t.transfer_id === transferId
          ? {
              ...t,
              transfer_status: decision,
              accepted_at: decision === 'Accepted' ? now : t.accepted_at,
              remarks: remarks.trim() || t.remarks,
            }
          : t
      )
    );

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== trf.case_id) return c;
        const accepted = decision === 'Accepted';
        const evt: CaseAction = {
          action_id: `ACT-${Date.now()}-trf-resp`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: accepted ? trf.receiving_bureau : trf.originating_bureau,
          action_type: 'Case Transferred',
          previous_value: trf.originating_bureau,
          new_value: accepted
            ? trf.receiving_bureau
            : `${trf.originating_bureau} (Returned)`,
          remarks: `Transfer ${transferId} ${decision}: ${remarks.trim() || 'Recorded by officer.'}`,
          timestamp: now,
          reference_id: transferId,
        };
        return {
          ...c,
          current_bureau: accepted
            ? trf.receiving_bureau
            : trf.originating_bureau,
          assignedDepartment: accepted
            ? trf.receiving_bureau
            : trf.originating_bureau,
          assigned_officer: accepted ? trf.receiving_officer : c.assigned_officer,
          status: accepted ? 'Under Process' : 'Pending',
          last_action_taken: `Transfer ${transferId} ${decision}`,
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, evt],
        };
      })
    );

    // Resolve the pending transfer acceptance alert
    setAlerts((prev) =>
      prev.map((a) =>
        a.deduplication_key === `trf:${transferId}` ||
        (a.alert_type === 'Cases Pending Transfer Acceptance' &&
          a.case_ids.includes(trf.case_id))
          ? {
              ...a,
              acknowledgement_status: 'Acknowledged',
              resolution_status: 'Resolved',
              lifecycle_status: 'Resolved',
              resolved_by: roleProfile.displayName,
              resolved_at: now,
              resolution_reason: `Transfer ${transferId} ${decision}: ${remarks.trim() || 'Handoff processed.'}`,
            }
          : a
      )
    );

    setLastUpdatedAt(now);
    addToast(
      `Transfer ${transferId}: ${decision}`,
      `Updated ownership and case timeline for ${trf.case_id}.`
    );
    return true;
  };

  const escalateCase = (payload: {
    caseId: string;
    escalationLevel: EscalationRecord['escalation_level'];
    responsibleAuthority: string;
    reason: string;
    requiredNextAction: string;
  }): boolean => {
    if (!hasPermission('escalate_cases')) {
      addToast(
        'Permission Denied',
        `${activeRole} cannot escalate official Bureau files.`,
        'warning'
      );
      return false;
    }

    const targetCase = allCases.find((c) => c.id === payload.caseId);
    if (!targetCase) return false;
    const now = new Date().toISOString();
    const escId = `ESC-2026-0${allEscalations.length + 1}`;

    const newEsc: EscalationRecord = {
      escalation_id: escId,
      case_id: targetCase.id,
      case_subject: targetCase.title,
      institution_id: targetCase.institution_id,
      institution_name: targetCase.institutionName,
      reason: payload.reason.trim(),
      escalation_level: payload.escalationLevel,
      responsible_authority: payload.responsibleAuthority.trim(),
      bureau: targetCase.current_bureau,
      timestamp: now,
      required_next_action: payload.requiredNextAction.trim(),
      status: 'Awaiting Action',
    };

    setEscalations((prev) => [newEsc, ...prev]);

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== payload.caseId) return c;
        const evt: CaseAction = {
          action_id: `ACT-${Date.now()}-esc`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: c.current_bureau,
          action_type: 'Case Escalated',
          previous_value: c.status,
          new_value: 'Escalated',
          remarks: `Escalated (${escId}) to ${payload.responsibleAuthority}: ${payload.reason}`,
          timestamp: now,
          reference_id: escId,
        };
        return {
          ...c,
          status: 'Escalated',
          priority: 'Critical',
          last_action_taken: `Escalated to ${payload.responsibleAuthority}`,
          next_action_required: payload.requiredNextAction.trim(),
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, evt],
        };
      })
    );

    const newEscAlert: AlertRecord = {
      alert_id: `ALT-${escId}`,
      title: `${payload.escalationLevel} Escalation (${escId}) — ${targetCase.id}`,
      alert_type: 'Escalation Awaiting Action',
      case_ids: [targetCase.id],
      institution_id: targetCase.institution_id,
      institution_name: targetCase.institutionName,
      aicte_permanent_id: targetCase.aicte_permanent_id,
      region: targetCase.region,
      bureaus: [targetCase.current_bureau],
      severity: 'Critical',
      reason: payload.reason.trim(),
      recommended_action: payload.requiredNextAction.trim(),
      created_at: now,
      due_at: targetCase.expected_disposal_at,
      assigned_to: payload.responsibleAuthority.trim(),
      is_read: false,
      lifecycle_status: 'Active',
      deduplication_key: `esc:${escId}`,
      acknowledgement_status: 'Unacknowledged',
      resolution_status: 'Open',
    };
    setAlerts((prev) => [newEscAlert, ...prev]);

    setLastUpdatedAt(now);
    addToast(
      `Case ${payload.caseId} Escalated`,
      `Logged ${escId} and generated senior authority alert for ${payload.responsibleAuthority}.`
    );
    return true;
  };

  const resolveEscalation = (escalationId: string, remarks: string): boolean => {
    if (!hasPermission('escalate_cases')) {
      addToast(
        'Permission Denied',
        'Current role cannot resolve escalations.',
        'warning'
      );
      return false;
    }

    const esc = allEscalations.find((e) => e.escalation_id === escalationId);
    if (!esc) return false;
    const now = new Date().toISOString();

    setEscalations((prev) =>
      prev.map((e) =>
        e.escalation_id === escalationId ? { ...e, status: 'Resolved' } : e
      )
    );

    setCases((prev) =>
      prev.map((c) => {
        if (c.id !== esc.case_id) return c;
        const evt: CaseAction = {
          action_id: `ACT-${Date.now()}-esc-res`,
          case_id: c.id,
          institution_id: c.institution_id,
          actor: roleProfile.displayName,
          actor_role: activeRole,
          bureau: c.current_bureau,
          action_type: 'Action Remark Added',
          remarks: `Escalation ${escalationId} resolved: ${remarks.trim() || 'Directive issued.'}`,
          timestamp: now,
          reference_id: escalationId,
        };
        return {
          ...c,
          status: 'Under Process',
          last_action_taken: `Escalation ${escalationId} resolved`,
          last_action_at: now,
          updatedAt: now,
          timeline: [...c.timeline, evt],
        };
      })
    );

    setAlerts((prev) =>
      prev.map((a) =>
        a.deduplication_key === `esc:${escalationId}` ||
        (a.alert_type === 'Escalation Awaiting Action' &&
          a.case_ids.includes(esc.case_id))
          ? {
              ...a,
              acknowledgement_status: 'Acknowledged',
              resolution_status: 'Resolved',
              lifecycle_status: 'Resolved',
              resolved_by: roleProfile.displayName,
              resolved_at: now,
              resolution_reason: `Escalation ${escalationId} resolved: ${remarks.trim() || 'Directive issued.'}`,
            }
          : a
      )
    );

    setLastUpdatedAt(now);
    addToast(
      `Escalation ${escalationId} Resolved`,
      'Case returned to Under Process and escalation alert resolved.'
    );
    return true;
  };

  // Notification read state is strictly separate from alert resolution/dismissal
  const markAlertRead = (alertId: string, isRead = true) => {
    setAlerts((prev) =>
      prev.map((a) => (a.alert_id === alertId ? { ...a, is_read: isRead } : a))
    );
  };

  const markAllAlertsRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, is_read: true })));
    addToast(
      'Notifications Marked as Read',
      'All visible notifications marked as read. Underlying operational alerts remain active until resolved.',
      'info'
    );
  };

  const assignAlertItem = (alertId: string, assignee: string): boolean => {
    if (!hasPermission('update_case_status')) {
      addToast(
        'Permission Denied',
        `${activeRole} cannot reassign operational alerts.`,
        'warning'
      );
      return false;
    }
    const cleanAssignee = assignee.trim();
    if (!cleanAssignee) return false;

    setAlerts((prev) =>
      prev.map((a) =>
        a.alert_id === alertId
          ? {
              ...a,
              assigned_to: cleanAssignee,
              acknowledgement_status: 'Acknowledged',
              lifecycle_status:
                a.resolution_status === 'Open' ? 'Assigned' : a.lifecycle_status,
              acknowledged_by: roleProfile.displayName,
              is_read: true,
            }
          : a
      )
    );

    addToast(
      `Alert ${alertId} Assigned`,
      `Assigned to ${cleanAssignee} for operational follow-up.`
    );
    return true;
  };

  const updateAlertItem = (
    alertId: string,
    action: 'acknowledge' | 'resolve' | 'dismiss',
    reason?: string
  ): boolean => {
    if (!hasPermission('update_case_status')) {
      addToast(
        'Permission Denied',
        `${activeRole} cannot modify operational alerts.`,
        'warning'
      );
      return false;
    }

    if (action === 'dismiss' && !reason?.trim()) {
      addToast(
        'Dismissal Reason Required',
        'Please provide a brief audit justification before dismissing an operational alert.',
        'warning'
      );
      return false;
    }

    const now = new Date().toISOString();
    const targetAlert = allAlerts.find((a) => a.alert_id === alertId);

    setAlerts((prev) =>
      prev.map((a) => {
        if (a.alert_id !== alertId) return a;
        if (action === 'acknowledge') {
          return {
            ...a,
            is_read: true,
            acknowledgement_status: 'Acknowledged',
            lifecycle_status: 'Acknowledged',
            acknowledged_by: roleProfile.displayName,
          };
        }
        if (action === 'resolve') {
          return {
            ...a,
            is_read: true,
            acknowledgement_status: 'Acknowledged',
            resolution_status: 'Resolved',
            lifecycle_status: 'Resolved',
            resolved_by: roleProfile.displayName,
            resolved_at: now,
            resolution_reason:
              reason?.trim() || `Resolved by ${roleProfile.displayName}.`,
          };
        }
        return {
          ...a,
          is_read: true,
          acknowledgement_status: 'Acknowledged',
          resolution_status: 'Dismissed',
          lifecycle_status: 'Dismissed',
          resolved_by: roleProfile.displayName,
          resolved_at: now,
          dismiss_reason: reason!.trim(),
          resolution_reason: reason!.trim(),
        };
      })
    );

    // Record an audit event in the associated case timeline when an alert is resolved or dismissed
    if (targetAlert && targetAlert.case_ids.length > 0 && action !== 'acknowledge') {
      const primaryCaseId = targetAlert.case_ids[0];
      setCases((prev) =>
        prev.map((c) => {
          if (c.id !== primaryCaseId) return c;
          const evt: CaseAction = {
            action_id: `ACT-${Date.now()}-alt`,
            case_id: c.id,
            institution_id: c.institution_id,
            actor: roleProfile.displayName,
            actor_role: activeRole,
            bureau: c.current_bureau,
            action_type: 'Action Remark Added',
            remarks: `Alert ${alertId} (${targetAlert.alert_type}) marked as ${action === 'resolve' ? 'Resolved' : 'Dismissed'}: ${reason?.trim() || 'Operational review completed.'}`,
            timestamp: now,
            reference_id: alertId,
          };
          return {
            ...c,
            timeline: [...c.timeline, evt],
          };
        })
      );
    }

    addToast(
      `Alert ${alertId} Updated`,
      `Alert marked as ${action === 'acknowledge' ? 'Acknowledged' : action === 'resolve' ? 'Resolved' : 'Dismissed'}.`
    );
    return true;
  };

  const saveSystemSettings = (newRules: RoutingRule[], newSla: SlaConfig) => {
    if (!hasPermission('manage_settings')) {
      addToast(
        'Permission Denied',
        'Only Administrator role can modify system routing rules and SLA thresholds.',
        'warning'
      );
      return;
    }
    setRoutingRules(newRules);
    setSlaConfig(newSla);
    setLastUpdatedAt(new Date().toISOString());
    addToast(
      'Settings Saved',
      'Updated Bureau routing rules, SLA deadline thresholds, and overlap detection configuration.'
    );
  };

  const resetSystemState = async () => {
    try {
      await fetch('/api/reset', { method: 'POST' });
    } catch {
      // ignore
    }
    localStorage.removeItem(STORAGE_KEYS.STATE);
    setInstitutions(structuredClone(INITIAL_INSTITUTIONS));
    setCases(structuredClone(INITIAL_CASES));
    setRelations(structuredClone(INITIAL_RELATIONS));
    setCoordination(structuredClone(INITIAL_COORDINATION));
    setTransfers(structuredClone(INITIAL_TRANSFERS));
    setEscalations(structuredClone(INITIAL_ESCALATIONS));
    setAlerts(structuredClone(INITIAL_ALERTS));
    setRoutingRules(structuredClone(INITIAL_ROUTING_RULES));
    setSlaConfig(structuredClone(INITIAL_SLA_CONFIG));
    setSelectedInstitutionId('INST-101');
    setSelectedCaseId('CMP-2026-0142');
    setCaseListStatusFilter('ALL');
    setLastUpdatedAt(new Date().toISOString());
    addToast(
      'System Dataset Reset',
      'Restored all 12 monitored institutions, 12 multi-Bureau complaints, and baseline overlap records.',
      'info'
    );
  };

  return (
    <CaseSyncContext.Provider
      value={{
        viewMode,
        setViewMode,
        activeScreen,
        setActiveScreen,
        theme,
        toggleTheme,
        setTheme,
        activeRole,
        setActiveRole,
        activeUserEmail,
        roleProfile,
        hasPermission,
        openLoginScreen,
        loginWithRole,
        signOutToHome,
        institutions,
        cases,
        allCasesTotalCount: allCases.length,
        allInstitutionsTotalCount: allInstitutions.length,
        relations,
        coordination,
        transfers,
        escalations,
        alerts,
        routingRules,
        slaConfig,
        modelEvaluations: INITIAL_MODEL_EVALUATIONS,
        lastUpdatedAt,
        selectedInstitutionId,
        setSelectedInstitutionId,
        selectedInstitution,
        institutionTab,
        setInstitutionTab,
        selectedCaseId,
        setSelectedCaseId,
        selectedCase,
        caseListStatusFilter,
        setCaseListStatusFilter,
        toasts,
        addToast,
        dismissToast,
        refreshDataset,
        openInstitutionProfile,
        openCaseDetail,
        navigateToCasesWithFilter,
        launchWorkspace,
        createComplaintCase,
        updateCaseRecord,
        reviewOverlapRelation,
        updateCoordinationRecord,
        requestCaseTransfer,
        respondToTransfer,
        escalateCase,
        resolveEscalation,
        updateAlertItem,
        markAlertRead,
        markAllAlertsRead,
        assignAlertItem,
        saveSystemSettings,
        resetSystemState,
      }}
    >
      {children}
    </CaseSyncContext.Provider>
  );
};

export const useCaseSync = (): CaseSyncContextValue => {
  const ctx = useContext(CaseSyncContext);
  if (!ctx) {
    throw new Error('useCaseSync must be used within a CaseSyncProvider');
  }
  return ctx;
};
