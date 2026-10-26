import React, { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion, useReducedMotion } from 'motion/react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Building2,
  CheckCheck,
  ChevronLeft,
  ChevronRight,
  Clock,
  FolderKanban,
  GitCompare,
  Globe,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Search,
  Settings,
  Shield,
  Sun,
  UserCheck,
  Users,
  X,
} from 'lucide-react';
import { useCaseSync } from '../context/CaseSyncContext';
import { AlertRecord, WorkspaceScreen } from '../types/casesync';
import { AnalyticsView } from './views/AnalyticsView';
import { CaseDetailsView } from './views/CaseDetailsView';
import { CaseManagementView } from './views/CaseManagementView';
import { DashboardView } from './views/DashboardView';
import {
  InstitutionDetailView,
  InstitutionRegistryView,
} from './views/InstitutionViews';
import {
  BureauCoordinationView,
  OverlapDetectionView,
} from './views/OverlapAndCoordinationViews';
import { SettingsView } from './views/SettingsView';
import {
  AlertsAndNotificationsView,
  AuditTrailView,
  TransfersAndEscalationsView,
} from './views/TransfersAlertsAuditViews';
import { useScrollHideHeader } from './ui/SharedComponents';

interface NavItem {
  id: WorkspaceScreen;
  label: string;
  icon: React.FC<{ className?: string }>;
  badge?: number;
}

export const WorkspaceApp: React.FC = () => {
  const {
    activeScreen,
    setActiveScreen,
    theme,
    toggleTheme,
    activeRole,
    roleProfile,
    openLoginScreen,
    signOutToHome,
    institutions,
    cases,
    allCasesTotalCount,
    allInstitutionsTotalCount,
    relations,
    coordination,
    transfers,
    alerts,
    selectedInstitution,
    selectedCase,
    openInstitutionProfile,
    openCaseDetail,
    markAlertRead,
    markAllAlertsRead,
  } = useCaseSync();

  const prefersReducedMotion = useReducedMotion();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const isTopBarHidden = useScrollHideHeader(
    notificationsOpen || searchFocused || mobileMenuOpen
  );

  const notificationRef = useRef<HTMLDivElement | null>(null);

  // Synchronize activeScreen with browser history (back/forward navigation)
  useEffect(() => {
    try {
      const currentState = window.history.state;
      if (!currentState || currentState.workspaceScreen !== activeScreen) {
        window.history.pushState(
          { workspaceScreen: activeScreen },
          '',
          `#${activeScreen}`
        );
      }
    } catch {
      // ignore iframe history restrictions
    }
  }, [activeScreen]);

  useEffect(() => {
    const handlePopState = (event: PopStateEvent) => {
      const targetScreen = event.state?.workspaceScreen as
        | WorkspaceScreen
        | undefined;
      if (targetScreen && roleProfile.allowedScreens.includes(targetScreen)) {
        setActiveScreen(targetScreen);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [roleProfile.allowedScreens, setActiveScreen]);

  // Close Notifications Popover and Mobile Drawer on Escape or outside click
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setNotificationsOpen(false);
        setMobileMenuOpen(false);
        setSearchFocused(false);
      }
    };

    const handleMouseDown = (event: MouseEvent) => {
      if (
        notificationsOpen &&
        notificationRef.current &&
        !notificationRef.current.contains(event.target as Node)
      ) {
        setNotificationsOpen(false);
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    document.addEventListener('mousedown', handleMouseDown);
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      document.removeEventListener('mousedown', handleMouseDown);
    };
  }, [notificationsOpen]);

  const pendingOverlapsCount = relations.filter(
    (r) =>
      r.review_status === 'Potential Overlap — Review Required' ||
      r.review_status === 'Institution Identity Uncertain'
  ).length;

  const activeCoordCount = coordination.filter(
    (c) => c.status !== 'Resolved'
  ).length;

  const pendingTransfersCount = transfers.filter(
    (t) =>
      t.transfer_status === 'Awaiting Acceptance' ||
      t.transfer_status === 'Transfer Requested'
  ).length;

  // Sidebar badge shows unresolved active alerts count
  const openAlertsCount = alerts.filter(
    (a) => a.resolution_status === 'Open'
  ).length;

  // Top-bar Bell badge shows unread notification count
  const unreadNotificationsCount = alerts.filter(
    (a) => !a.is_read && a.resolution_status !== 'Dismissed'
  ).length;

  const hasUrgentUnread = alerts.some(
    (a) =>
      !a.is_read &&
      a.resolution_status === 'Open' &&
      a.severity === 'Critical'
  );

  // Recent notifications sorted with unread + critical first, then by created_at
  const recentNotifications = useMemo(() => {
    return [...alerts]
      .filter((a) => a.resolution_status !== 'Dismissed')
      .sort((a, b) => {
        if (Boolean(a.is_read) !== Boolean(b.is_read)) {
          return a.is_read ? 1 : -1;
        }
        return (
          new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        );
      })
      .slice(0, 8);
  }, [alerts]);

  const allNavItems: NavItem[] = [
    { id: 'overview', label: 'Overview', icon: LayoutDashboard },
    {
      id: 'institutions',
      label: 'Institution Registry',
      icon: Building2,
      badge: institutions.length,
    },
    {
      id: 'cases',
      label: 'Complaint Cases',
      icon: FolderKanban,
      badge: cases.length,
    },
    {
      id: 'overlaps',
      label: 'Overlap Detection',
      icon: GitCompare,
      badge: pendingOverlapsCount,
    },
    {
      id: 'coordination',
      label: 'Bureau/Cell Coordination',
      icon: Users,
      badge: activeCoordCount,
    },
    {
      id: 'transfers',
      label: 'Transfers & Escalations',
      icon: ArrowRightLeft,
      badge: pendingTransfersCount,
    },
    {
      id: 'alerts',
      label: 'Alerts & Notifications',
      icon: Bell,
      badge: openAlertsCount,
    },
    { id: 'reports', label: 'Reports & Analytics', icon: BarChart3 },
    { id: 'audit', label: 'Audit Trail', icon: History },
    { id: 'settings', label: 'Settings', icon: Settings },
  ];

  // Filter navigation items by active role permissions
  const navItems = useMemo(
    () =>
      allNavItems.filter((item) =>
        roleProfile.allowedScreens.includes(item.id)
      ),
    [
      roleProfile,
      institutions.length,
      cases.length,
      pendingOverlapsCount,
      activeCoordCount,
      pendingTransfersCount,
      openAlertsCount,
    ]
  );

  // Determine whether a sidebar item is active (including parent-section highlighting for nested detail pages)
  const isNavItemActive = (itemId: WorkspaceScreen): boolean => {
    if (activeScreen === itemId) return true;
    if (itemId === 'institutions' && activeScreen === 'institution-detail') {
      return true;
    }
    if (itemId === 'cases' && activeScreen === 'case-detail') {
      return true;
    }
    return false;
  };

  // Global search results across visible Institutions and Cases
  const globalSearchResults = useMemo(() => {
    const q = globalSearch.trim().toLowerCase();
    if (!q) return { matchedInstitutions: [], matchedCases: [] };

    const matchedInstitutions = institutions
      .filter(
        (i) =>
          i.name.toLowerCase().includes(q) ||
          i.aicte_permanent_id.toLowerCase().includes(q) ||
          i.institution_id.toLowerCase().includes(q) ||
          i.state.toLowerCase().includes(q)
      )
      .slice(0, 4);

    const matchedCases = cases
      .filter(
        (c) =>
          c.id.toLowerCase().includes(q) ||
          c.title.toLowerCase().includes(q) ||
          c.institutionName.toLowerCase().includes(q) ||
          c.aicte_permanent_id.toLowerCase().includes(q) ||
          c.current_bureau.toLowerCase().includes(q)
      )
      .slice(0, 5);

    return { matchedInstitutions, matchedCases };
  }, [globalSearch, institutions, cases]);

  const breadcrumbLabel = useMemo(() => {
    switch (activeScreen) {
      case 'overview':
        return 'Overview Dashboard';
      case 'institutions':
        return 'Institution Registry';
      case 'institution-detail':
        return `Institution Registry / ${selectedInstitution?.name || ''}`;
      case 'cases':
        return 'Complaint Cases';
      case 'case-detail':
        return `Complaint Cases / ${selectedCase?.id || ''}`;
      case 'overlaps':
        return 'Overlap Detection';
      case 'coordination':
        return 'Bureau/Cell Coordination';
      case 'transfers':
        return 'Transfers & Escalations';
      case 'alerts':
        return 'Alerts & Notifications';
      case 'reports':
        return 'Reports & Analytics';
      case 'audit':
        return 'Audit Trail';
      case 'settings':
        return 'Settings & Model Monitoring';
      default:
        return 'Overview';
    }
  }, [activeScreen, selectedInstitution, selectedCase]);

  const handleSelectNav = (id: WorkspaceScreen) => {
    setActiveScreen(id);
    setMobileMenuOpen(false);
    setNotificationsOpen(false);
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  // Navigate to the relevant record from a notification item and mark it as read (without resolving the alert)
  const handleNotificationNavigate = (alert: AlertRecord) => {
    markAlertRead(alert.alert_id, true);
    setNotificationsOpen(false);

    if (
      alert.alert_type === 'Potential Overlapping Cases' ||
      alert.alert_type === 'Institution Identity Verification'
    ) {
      if (roleProfile.allowedScreens.includes('overlaps')) {
        setActiveScreen('overlaps');
      } else if (alert.case_ids[0]) {
        openCaseDetail(alert.case_ids[0]);
      }
      return;
    }

    if (
      alert.alert_type === 'Cases Pending Transfer Acceptance' ||
      alert.alert_type === 'Escalation Awaiting Action'
    ) {
      if (roleProfile.allowedScreens.includes('transfers')) {
        setActiveScreen('transfers');
      } else if (alert.case_ids[0]) {
        openCaseDetail(alert.case_ids[0]);
      }
      return;
    }

    if (alert.alert_type === 'Cases Awaiting Bureau Coordination') {
      if (roleProfile.allowedScreens.includes('coordination')) {
        setActiveScreen('coordination');
      } else if (alert.case_ids[0]) {
        openCaseDetail(alert.case_ids[0]);
      }
      return;
    }

    if (alert.case_ids.length > 0) {
      openCaseDetail(alert.case_ids[0]);
      return;
    }

    if (alert.institution_id) {
      openInstitutionProfile(alert.institution_id);
    }
  };

  return (
    <div className="min-h-screen neu-shell flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop Persistent Sidebar — Fixed width transition only, never shifts or re-animates on route change */}
      <aside
        aria-label="Primary Workspace Navigation"
        className={`hidden lg:flex flex-col justify-between neu-sidebar border-r border-theme shrink-0 transition-[width] duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] sticky top-0 h-screen z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={() => handleSelectNav('overview')}
              className="flex items-center gap-2.5 text-left cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3478F6] rounded-xl"
            >
              <div className="w-9 h-9 rounded-xl neu-btn-primary flex items-center justify-center font-bold text-sm shrink-0">
                CS
              </div>
              {!sidebarCollapsed && (
                <div>
                  <div className="text-sm font-extrabold tracking-tight text-theme-primary leading-none">
                    AICTE CaseSync
                  </div>
                  <div className="text-[10px] font-semibold text-theme-blue mt-1">
                    Institution Monitoring
                  </div>
                </div>
              )}
            </button>

            <button
              onClick={() => setSidebarCollapsed((prev) => !prev)}
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3478F6]"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
              aria-label={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Role-Filtered Navigation Items with Smooth Sliding Highlight & Left Accent Bar */}
          <nav aria-label="Workspace Sections" className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = isNavItemActive(item.id);

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`group relative overflow-hidden w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3478F6] ${
                    isActive
                      ? 'text-[#3478F6] dark:text-[#6EA1FF] font-bold'
                      : 'font-semibold text-theme-secondary border border-transparent hover:text-theme-primary hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="desktop-sidebar-active-bg"
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute inset-0 rounded-xl bg-[#3478F6]/12 dark:bg-[#6EA1FF]/16 border border-[#3478F6]/30 dark:border-[#6EA1FF]/30 shadow-xs"
                    />
                  )}

                  {/* Slim Left-Edge Vertical Accent Bar with Smooth Sliding Transition */}
                  {isActive ? (
                    <motion.span
                      layoutId="desktop-sidebar-active-bar"
                      aria-hidden="true"
                      transition={{
                        duration: 0.22,
                        ease: [0.22, 1, 0.36, 1],
                      }}
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#3478F6] to-[#4338F5] z-10"
                    />
                  ) : (
                    <span
                      aria-hidden="true"
                      className="absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#3478F6] to-[#4338F5] opacity-0 group-hover:opacity-30 transition-opacity duration-200"
                    />
                  )}

                  <div className="relative z-10 flex items-center gap-2.5 min-w-0">
                    <Icon
                      className={`w-4 h-4 shrink-0 transition-colors duration-200 ${
                        isActive
                          ? 'text-[#3478F6] dark:text-[#6EA1FF]'
                          : 'text-theme-secondary group-hover:text-theme-primary'
                      }`}
                    />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>

                  {!sidebarCollapsed &&
                    item.badge !== undefined &&
                    item.badge > 0 && (
                      <span
                        className={`relative z-10 px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold shrink-0 transition-colors duration-200 ${
                          isActive
                            ? 'bg-[#3478F6] text-white'
                            : item.id === 'alerts'
                              ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                              : 'bg-[var(--bg-inset)] text-theme-primary'
                        }`}
                      >
                        {item.badge}
                      </span>
                    )}
                </button>
              );
            })}
          </nav>
        </div>

        {/* Bottom Active Account Profile & Sign Out */}
        <div className="p-4 border-t border-theme space-y-2.5">
          {!sidebarCollapsed && (
            <div className="neu-inset rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-blue">
                <Shield className="w-3 h-3" />
                Authenticated Role
              </div>
              <div className="font-bold text-theme-primary truncate">
                {roleProfile.shortLabel}
              </div>
              <div className="text-[11px] text-theme-secondary truncate">
                {roleProfile.displayName}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 gap-1.5">
            <button
              onClick={() => openLoginScreen(activeRole, activeScreen)}
              className="neu-btn-secondary w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              title="Authenticate with a different official account"
            >
              <UserCheck className="w-3.5 h-3.5 text-theme-blue shrink-0" />
              {!sidebarCollapsed && <span>Switch Account</span>}
            </button>

            <button
              onClick={signOutToHome}
              className="neu-btn-secondary w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              title="Sign Out to Public Home Page"
            >
              <Globe className="w-3.5 h-3.5 text-theme-secondary shrink-0" />
              {!sidebarCollapsed && <span>Sign Out</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer — Matches Desktop Active Indicator & Parent Highlighting */}
      {mobileMenuOpen && (
        <div
          className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[85vw] neu-sidebar h-full p-4 flex flex-col justify-between overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl neu-btn-primary flex items-center justify-center font-bold text-xs">
                    CS
                  </div>
                  <div>
                    <span className="font-bold text-sm text-theme-primary block leading-none">
                      AICTE CaseSync
                    </span>
                    <span className="text-[10px] font-semibold text-theme-blue">
                      Institution Monitoring
                    </span>
                  </div>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary"
                  aria-label="Close navigation menu"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav aria-label="Mobile Workspace Sections" className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = isNavItemActive(item.id);
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.id)}
                      aria-current={isActive ? 'page' : undefined}
                      className={`group relative overflow-hidden w-full flex items-center justify-between gap-2.5 px-3.5 py-2.5 rounded-xl text-xs transition-colors duration-200 ${
                        isActive
                          ? 'bg-[#3478F6]/12 dark:bg-[#6EA1FF]/16 text-[#3478F6] dark:text-[#6EA1FF] font-bold border border-[#3478F6]/30 dark:border-[#6EA1FF]/30 shadow-xs'
                          : 'font-semibold text-theme-secondary border border-transparent hover:text-theme-primary hover:bg-[var(--bg-elevated)]'
                      }`}
                    >
                      <span
                        aria-hidden="true"
                        className={`absolute left-0 top-1.5 bottom-1.5 w-1 rounded-r-full bg-gradient-to-b from-[#3478F6] to-[#4338F5] transition-opacity duration-200 ${
                          isActive ? 'opacity-100' : 'opacity-0'
                        }`}
                      />
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive
                              ? 'text-[#3478F6] dark:text-[#6EA1FF]'
                              : 'text-theme-secondary'
                          }`}
                        />
                        <span className="truncate">{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span
                          className={`text-[10px] font-mono-tabular font-bold px-2 py-0.5 rounded-full shrink-0 ${
                            isActive
                              ? 'bg-[#3478F6] text-white'
                              : 'bg-[var(--bg-inset)] text-theme-primary'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2 pt-3 border-t border-theme">
              <div className="neu-inset rounded-xl p-2.5 text-xs mb-1">
                <div className="text-[10px] font-bold uppercase text-theme-blue">
                  Authenticated Account
                </div>
                <div className="font-bold text-theme-primary truncate">
                  {roleProfile.shortLabel}
                </div>
              </div>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginScreen(activeRole, activeScreen);
                }}
                className="neu-btn-secondary w-full py-2 rounded-xl text-xs font-semibold"
              >
                Switch Account
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOutToHome();
                }}
                className="neu-btn-secondary w-full py-2 rounded-xl text-xs font-semibold"
              >
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Navigation Bar — Hides smoothly on scroll down, reveals on scroll up */}
        <header
          className={`sticky top-0 z-20 neu-sidebar border-b border-theme px-4 sm:px-6 py-3 transition-all duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
            isTopBarHidden
              ? '-translate-y-full opacity-0 pointer-events-none'
              : 'translate-y-0 opacity-100'
          }`}
        >
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-3">
            {/* Left: Mobile Menu Button + Breadcrumb */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMobileMenuOpen(true)}
                className="lg:hidden neu-btn-secondary p-2 rounded-xl"
                aria-label="Open navigation menu"
              >
                <Menu className="w-4 h-4" />
              </button>

              <div className="text-xs sm:text-sm font-semibold text-theme-secondary flex items-center gap-1.5">
                <span
                  onClick={() => handleSelectNav('overview')}
                  className="hover:text-theme-blue cursor-pointer hidden sm:inline"
                >
                  AICTE CaseSync
                </span>
                <span className="hidden sm:inline text-theme-muted">/</span>
                <span className="font-bold text-theme-primary truncate max-w-[220px] sm:max-w-none">
                  {breadcrumbLabel}
                </span>
              </div>
            </div>

            {/* Center: Global Search across Institutions & Cases */}
            <div className="relative flex-1 max-w-md min-w-[200px]">
              <Search className="w-3.5 h-3.5 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={globalSearch}
                onFocus={() => setSearchFocused(true)}
                onBlur={() => setTimeout(() => setSearchFocused(false), 180)}
                onChange={(e) => setGlobalSearch(e.target.value)}
                placeholder="Global search: Case ID, AICTE PID, or Institution..."
                aria-label="Global search for institutions and complaints"
                className="neu-inset w-full pl-9 pr-8 py-2 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-[#3478F6]/30"
              />
              {globalSearch && (
                <button
                  onClick={() => setGlobalSearch('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-theme-muted hover:text-theme-primary"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}

              {/* Global Search Dropdown Results */}
              {searchFocused && globalSearch.trim().length > 0 && (
                <div className="absolute left-0 right-0 top-full mt-2 neu-card rounded-2xl p-3 shadow-xl z-50 space-y-3 max-h-96 overflow-y-auto text-xs">
                  <div>
                    <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted px-2 mb-1">
                      Institutions ({globalSearchResults.matchedInstitutions.length})
                    </div>
                    {globalSearchResults.matchedInstitutions.length === 0 ? (
                      <div className="px-2 py-1 text-theme-muted">
                        No matching institutions in current role scope
                      </div>
                    ) : (
                      globalSearchResults.matchedInstitutions.map((inst) => (
                        <button
                          key={inst.institution_id}
                          onMouseDown={() => {
                            openInstitutionProfile(inst.institution_id);
                            setGlobalSearch('');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[var(--bg-elevated)] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-bold text-theme-primary">
                              {inst.name}
                            </div>
                            <div className="font-mono-tabular text-[11px] text-theme-muted">
                              PID: {inst.aicte_permanent_id} • {inst.region}
                            </div>
                          </div>
                          <span className="text-theme-blue font-semibold">
                            Profile →
                          </span>
                        </button>
                      ))
                    )}
                  </div>

                  <div className="border-t border-theme pt-2">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted px-2 mb-1">
                      Complaint Cases ({globalSearchResults.matchedCases.length})
                    </div>
                    {globalSearchResults.matchedCases.length === 0 ? (
                      <div className="px-2 py-1 text-theme-muted">
                        No matching complaint records in current role scope
                      </div>
                    ) : (
                      globalSearchResults.matchedCases.map((c) => (
                        <button
                          key={c.id}
                          onMouseDown={() => {
                            openCaseDetail(c.id);
                            setGlobalSearch('');
                          }}
                          className="w-full text-left px-2.5 py-2 rounded-xl hover:bg-[var(--bg-elevated)] flex items-center justify-between gap-2"
                        >
                          <div>
                            <div className="font-mono-tabular font-bold text-theme-blue">
                              {c.id} — {c.current_bureau}
                            </div>
                            <div className="text-theme-primary line-clamp-1">
                              {c.title}
                            </div>
                          </div>
                          <span className="text-theme-blue font-semibold">
                            Case →
                          </span>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Right Controls: Notification Bell + Popover + Theme Toggle + Active User & Switch Role */}
            <div className="flex items-center gap-2">
              <div className="relative" ref={notificationRef}>
                <button
                  onClick={() => setNotificationsOpen((prev) => !prev)}
                  aria-expanded={notificationsOpen}
                  aria-haspopup="dialog"
                  className={`neu-btn-secondary p-2 rounded-xl relative cursor-pointer ${
                    notificationsOpen
                      ? 'border-[#3478F6] text-[#3478F6]'
                      : ''
                  }`}
                  title={`Notifications (${unreadNotificationsCount} unread • ${openAlertsCount} active alerts)`}
                  aria-label={`Notifications (${unreadNotificationsCount} unread)`}
                >
                  <Bell className="w-4 h-4 text-theme-primary" />
                  {unreadNotificationsCount > 0 && (
                    <span className="min-w-4 h-4 px-1 rounded-full bg-[var(--status-critical)] text-white text-[10px] font-mono-tabular font-bold flex items-center justify-center absolute -top-1 -right-1 shadow-xs">
                      {unreadNotificationsCount}
                    </span>
                  )}
                  {hasUrgentUnread && (
                    <span
                      aria-hidden="true"
                      className="w-2 h-2 rounded-full bg-[var(--status-critical)] absolute bottom-1 right-1 ring-2 ring-[var(--bg-sidebar)]"
                    />
                  )}
                </button>

                {/* Top-Bar Notifications Popover */}
                <AnimatePresence>
                  {notificationsOpen && (
                    <motion.div
                      role="dialog"
                      aria-label="Recent Operational Notifications"
                      initial={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 6, scale: 0.98 }
                      }
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={
                        prefersReducedMotion
                          ? { opacity: 0 }
                          : { opacity: 0, y: 4, scale: 0.98 }
                      }
                      transition={{ duration: 0.16, ease: [0.22, 1, 0.36, 1] }}
                      className="fixed sm:absolute right-3 sm:right-0 top-16 sm:top-full sm:mt-2.5 w-[calc(100vw-1.5rem)] sm:w-[410px] neu-card rounded-2xl shadow-2xl z-50 overflow-hidden border border-theme"
                    >
                      {/* Popover Header */}
                      <div className="px-4 py-3 border-b border-theme bg-[var(--bg-elevated)] flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2">
                          <Bell className="w-4 h-4 text-theme-blue" />
                          <span className="font-bold text-xs sm:text-sm text-theme-primary">
                            Notifications
                          </span>
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold bg-[#3478F6]/12 text-theme-blue">
                            {unreadNotificationsCount} unread
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          {unreadNotificationsCount > 0 && (
                            <button
                              onClick={markAllAlertsRead}
                              className="text-[11px] font-semibold text-theme-blue hover:underline inline-flex items-center gap-1 cursor-pointer"
                              title="Mark all notifications as read (does not resolve underlying alerts)"
                            >
                              <CheckCheck className="w-3.5 h-3.5" />
                              Mark all read
                            </button>
                          )}
                          <button
                            onClick={() => setNotificationsOpen(false)}
                            className="p-1 rounded-lg text-theme-muted hover:text-theme-primary cursor-pointer"
                            aria-label="Close notifications popover"
                          >
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      {/* Scrollable Notification List */}
                      <div className="max-h-[380px] overflow-y-auto divide-y divide-[var(--border-subtle)]">
                        {recentNotifications.length === 0 ? (
                          <div className="p-6 text-center text-xs text-theme-muted space-y-1">
                            <div className="font-bold text-theme-primary">
                              No notifications in current role scope
                            </div>
                            <p>
                              Cross-Bureau overlaps, approaching SLA deadlines, and transfer handoffs will appear here.
                            </p>
                          </div>
                        ) : (
                          recentNotifications.map((item) => {
                            const isUnread = !item.is_read;
                            return (
                              <div
                                key={item.alert_id}
                                className={`p-3.5 text-xs transition-colors ${
                                  isUnread
                                    ? 'bg-[#3478F6]/[0.05] dark:bg-[#6EA1FF]/[0.07]'
                                    : 'bg-transparent hover:bg-[var(--bg-elevated)]'
                                }`}
                              >
                                <div className="flex items-start justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1.5">
                                    <button
                                      onClick={() =>
                                        markAlertRead(item.alert_id, !item.is_read)
                                      }
                                      title={
                                        isUnread
                                          ? 'Unread notification — click to mark read'
                                          : 'Read notification — click to mark unread'
                                      }
                                      className={`w-2 h-2 rounded-full shrink-0 cursor-pointer ${
                                        isUnread
                                          ? 'bg-[#3478F6]'
                                          : 'bg-transparent border border-[var(--text-muted)]'
                                      }`}
                                    />
                                    <span
                                      className={`px-1.5 py-0.5 rounded font-bold text-[10px] ${
                                        item.severity === 'Critical'
                                          ? 'bg-[var(--status-critical)]/15 text-[var(--status-critical)]'
                                          : item.severity === 'High'
                                            ? 'bg-[var(--status-warning)]/15 text-[var(--status-warning)]'
                                            : 'bg-[#3478F6]/15 text-theme-blue'
                                      }`}
                                    >
                                      {item.severity}
                                    </span>
                                    <span className="font-semibold text-[11px] text-theme-secondary">
                                      {item.alert_type}
                                    </span>
                                  </div>

                                  <span className="font-mono-tabular text-[10px] text-theme-muted shrink-0 inline-flex items-center gap-1">
                                    <Clock className="w-2.5 h-2.5" />
                                    {new Date(item.created_at).toLocaleDateString(
                                      'en-IN',
                                      {
                                        day: '2-digit',
                                        month: 'short',
                                      }
                                    )}
                                  </span>
                                </div>

                                <div className="mt-1.5 font-bold text-theme-primary leading-snug">
                                  {item.title || item.reason}
                                </div>

                                <div className="mt-1 text-[11px] text-theme-secondary line-clamp-2">
                                  {item.institution_name} ({item.aicte_permanent_id})
                                </div>

                                <div className="mt-2.5 flex items-center justify-between gap-2">
                                  <div className="flex flex-wrap items-center gap-1">
                                    {item.case_ids.map((cid) => (
                                      <button
                                        key={cid}
                                        onClick={() => {
                                          markAlertRead(item.alert_id, true);
                                          setNotificationsOpen(false);
                                          openCaseDetail(cid);
                                        }}
                                        className="px-1.5 py-0.5 rounded bg-[var(--bg-elevated)] border border-theme font-mono-tabular font-bold text-[10px] text-theme-blue hover:underline cursor-pointer"
                                      >
                                        {cid}
                                      </button>
                                    ))}
                                    <span className="text-[10px] text-theme-muted">
                                      • {item.lifecycle_status || item.resolution_status}
                                    </span>
                                  </div>

                                  <button
                                    onClick={() => handleNotificationNavigate(item)}
                                    className="font-bold text-[11px] text-theme-blue hover:underline inline-flex items-center gap-1 cursor-pointer shrink-0"
                                  >
                                    {item.alert_type ===
                                      'Potential Overlapping Cases' ||
                                    item.alert_type ===
                                      'Institution Identity Verification'
                                      ? 'Review Overlap'
                                      : item.alert_type ===
                                          'Cases Pending Transfer Acceptance'
                                        ? 'Review Transfer'
                                        : item.alert_type ===
                                            'Cases Awaiting Bureau Coordination'
                                          ? 'Coordinate'
                                          : 'Open Record'}
                                    <ArrowRight className="w-3 h-3" />
                                  </button>
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Popover Footer */}
                      <div className="px-4 py-2.5 border-t border-theme bg-[var(--bg-elevated)] flex items-center justify-between gap-2 text-xs">
                        <span className="text-[11px] text-theme-muted inline-flex items-center gap-1">
                          <AlertTriangle className="w-3 h-3 text-[var(--status-warning)]" />
                          {openAlertsCount} active operational alerts
                        </span>
                        {roleProfile.allowedScreens.includes('alerts') && (
                          <button
                            onClick={() => handleSelectNav('alerts')}
                            className="font-bold text-theme-blue hover:underline inline-flex items-center gap-1 cursor-pointer"
                          >
                            View All Alerts
                            <ArrowRight className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Light / Dark Theme Toggle */}
              <button
                onClick={toggleTheme}
                className="neu-btn-secondary px-3 py-2 rounded-xl text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
                title={
                  theme === 'light'
                    ? 'Switch to Dark Theme'
                    : 'Switch to Light Theme'
                }
                aria-label={
                  theme === 'light'
                    ? 'Switch to Dark Theme'
                    : 'Switch to Light Theme'
                }
              >
                {theme === 'light' ? (
                  <>
                    <Moon className="w-3.5 h-3.5 text-[#4338F5]" />
                    <span className="hidden xl:inline">Dark</span>
                  </>
                ) : (
                  <>
                    <Sun className="w-3.5 h-3.5 text-[#F4BD62]" />
                    <span className="hidden xl:inline">Light</span>
                  </>
                )}
              </button>

              {/* Authenticated Account Badge + Switch Account Button */}
              <div className="neu-inset px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-theme-blue shrink-0" />
                <span className="font-bold text-theme-primary hidden sm:inline">
                  {roleProfile.shortLabel}
                </span>
                <button
                  onClick={() => openLoginScreen(activeRole, activeScreen)}
                  className="text-theme-blue font-bold hover:underline cursor-pointer"
                  title="Authenticate with a different official account"
                >
                  Account
                </button>
              </div>

              <button
                onClick={signOutToHome}
                className="neu-btn-secondary p-2 rounded-xl cursor-pointer"
                title="Sign Out"
                aria-label="Sign Out"
              >
                <LogOut className="w-4 h-4 text-theme-secondary" />
              </button>
            </div>
          </div>
        </header>

        {/* Active Role Scope Banner */}
        <div className="bg-[var(--bg-elevated)] border-b border-theme px-4 sm:px-6 py-2">
          <div className="max-w-[1440px] mx-auto flex flex-wrap items-center justify-between gap-2 text-xs">
            <div className="flex flex-wrap items-center gap-2 text-theme-secondary">
              <span className="font-bold text-theme-primary">
                Active Role: {activeRole}
              </span>
              <span>•</span>
              <span>{roleProfile.scopeSummary}</span>
            </div>
            <div className="font-mono-tabular text-[11px] text-theme-muted">
              Visible Scope: {cases.length}/{allCasesTotalCount} Cases •{' '}
              {institutions.length}/{allInstitutionsTotalCount} Institutions
            </div>
          </div>
        </div>

        {/* Active Screen Container with Controlled Horizontal Slide + Fade Transition */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6 overflow-x-hidden">
          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={
                activeScreen === 'institution-detail'
                  ? `institution-detail-${selectedInstitution?.institution_id}-${activeRole}`
                  : activeScreen === 'case-detail'
                    ? `case-detail-${selectedCase?.id}-${activeRole}`
                    : `${activeScreen}-${activeRole}`
              }
              initial={
                prefersReducedMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: 10 }
              }
              animate={{ opacity: 1, x: 0 }}
              exit={
                prefersReducedMotion
                  ? { opacity: 1, x: 0 }
                  : { opacity: 0, x: -4 }
              }
              transition={
                prefersReducedMotion
                  ? { duration: 0 }
                  : { duration: 0.2, ease: [0.22, 1, 0.36, 1] }
              }
              className="w-full min-w-0"
            >
              {activeScreen === 'overview' && <DashboardView />}
              {activeScreen === 'institutions' && <InstitutionRegistryView />}
              {activeScreen === 'institution-detail' && (
                <InstitutionDetailView />
              )}
              {activeScreen === 'cases' && <CaseManagementView />}
              {activeScreen === 'case-detail' && <CaseDetailsView />}
              {activeScreen === 'overlaps' && <OverlapDetectionView />}
              {activeScreen === 'coordination' && <BureauCoordinationView />}
              {activeScreen === 'transfers' && <TransfersAndEscalationsView />}
              {activeScreen === 'alerts' && <AlertsAndNotificationsView />}
              {activeScreen === 'reports' && <AnalyticsView />}
              {activeScreen === 'audit' && <AuditTrailView />}
              {activeScreen === 'settings' && <SettingsView />}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
};

