import React, { useMemo, useState } from 'react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ArrowRightLeft,
  BarChart3,
  Bell,
  Building2,
  ChevronLeft,
  ChevronRight,
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
import { WorkspaceScreen } from '../types/casesync';
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
  } = useCaseSync();

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [globalSearch, setGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);

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

  const openAlertsCount = alerts.filter(
    (a) => a.resolution_status === 'Open'
  ).length;

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
    [roleProfile, institutions.length, cases.length, pendingOverlapsCount, activeCoordCount, pendingTransfersCount, openAlertsCount]
  );

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
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen neu-shell flex flex-col lg:flex-row overflow-x-hidden">
      {/* Desktop Persistent Sidebar */}
      <aside
        className={`hidden lg:flex flex-col justify-between neu-sidebar border-r border-theme shrink-0 transition-all duration-200 sticky top-0 h-screen z-30 ${
          sidebarCollapsed ? 'w-20' : 'w-68'
        }`}
      >
        <div className="p-4 space-y-5 overflow-y-auto">
          {/* Brand Logo */}
          <div className="flex items-center justify-between gap-2 px-1">
            <button
              onClick={() => handleSelectNav('overview')}
              className="flex items-center gap-2.5 text-left cursor-pointer"
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
              className="p-1.5 rounded-lg text-theme-muted hover:text-theme-primary cursor-pointer"
              title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            >
              {sidebarCollapsed ? (
                <ChevronRight className="w-4 h-4" />
              ) : (
                <ChevronLeft className="w-4 h-4" />
              )}
            </button>
          </div>

          {/* Role-Filtered Navigation Items */}
          <nav className="space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive =
                activeScreen === item.id ||
                (item.id === 'institutions' &&
                  activeScreen === 'institution-detail') ||
                (item.id === 'cases' && activeScreen === 'case-detail');

              return (
                <button
                  key={item.id}
                  onClick={() => handleSelectNav(item.id)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`w-full flex items-center justify-between gap-2.5 px-3 py-2.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
                    isActive
                      ? 'neu-btn-primary shadow-sm'
                      : 'text-theme-secondary hover:text-theme-primary hover:bg-[var(--bg-elevated)]'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <Icon className="w-4 h-4 shrink-0" />
                    {!sidebarCollapsed && (
                      <span className="truncate">{item.label}</span>
                    )}
                  </div>
                  {!sidebarCollapsed &&
                    item.badge !== undefined &&
                    item.badge > 0 && (
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-mono-tabular font-bold shrink-0 ${
                          isActive
                            ? 'bg-white/20 text-white'
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

        {/* Bottom Active Role Profile & Switch Role / Sign Out */}
        <div className="p-4 border-t border-theme space-y-2.5">
          {!sidebarCollapsed && (
            <div className="neu-inset rounded-xl p-3 text-xs space-y-1">
              <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-theme-blue">
                <Shield className="w-3 h-3" />
                Active Session Role
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
              title="Switch Demo Role on Login Screen"
            >
              <UserCheck className="w-3.5 h-3.5 text-theme-blue shrink-0" />
              {!sidebarCollapsed && <span>Switch Role</span>}
            </button>

            <button
              onClick={signOutToHome}
              className="neu-btn-secondary w-full px-3 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-2 cursor-pointer"
              title="Exit Demo Workspace to Public Home Page"
            >
              <Globe className="w-3.5 h-3.5 text-theme-secondary shrink-0" />
              {!sidebarCollapsed && <span>Exit Demo / Home</span>}
            </button>
          </div>
        </div>
      </aside>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-50 lg:hidden bg-black/50 backdrop-blur-xs flex">
          <div className="w-72 max-w-[85vw] neu-sidebar h-full p-4 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl neu-btn-primary flex items-center justify-center font-bold text-xs">
                    CS
                  </div>
                  <span className="font-bold text-sm text-theme-primary">
                    AICTE CaseSync
                  </span>
                </div>
                <button
                  onClick={() => setMobileMenuOpen(false)}
                  className="p-1.5 rounded-lg text-theme-muted"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <nav className="space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeScreen === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => handleSelectNav(item.id)}
                      className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold ${
                        isActive
                          ? 'neu-btn-primary'
                          : 'text-theme-secondary'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className="w-4 h-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge !== undefined && item.badge > 0 && (
                        <span className="text-[10px] font-mono-tabular px-2 py-0.5 rounded-full bg-black/10">
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </nav>
            </div>

            <div className="space-y-2 pt-3 border-t border-theme">
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  openLoginScreen(activeRole, activeScreen);
                }}
                className="neu-btn-secondary w-full py-2 rounded-xl text-xs font-semibold"
              >
                Switch Demo Role
              </button>
              <button
                onClick={() => {
                  setMobileMenuOpen(false);
                  signOutToHome();
                }}
                className="neu-btn-secondary w-full py-2 rounded-xl text-xs font-semibold"
              >
                Exit Demo / Home
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Sticky Top Navigation Bar */}
        <header className="sticky top-0 z-20 neu-sidebar border-b border-theme px-4 sm:px-6 py-3">
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

            {/* Right Controls: Alerts Bell + Theme Toggle + Active User & Switch Role */}
            <div className="flex items-center gap-2">
              {roleProfile.allowedScreens.includes('alerts') && (
                <button
                  onClick={() => handleSelectNav('alerts')}
                  className="neu-btn-secondary p-2 rounded-xl relative cursor-pointer"
                  title="Open Alerts & SLA Notifications"
                  aria-label="Open Alerts & SLA Notifications"
                >
                  <Bell className="w-4 h-4 text-theme-primary" />
                  {openAlertsCount > 0 && (
                    <span className="w-4 h-4 rounded-full bg-[var(--status-critical)] text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1">
                      {openAlertsCount}
                    </span>
                  )}
                </button>
              )}

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

              {/* Active Role Badge + Switch Role Button */}
              <div className="neu-inset px-3 py-1.5 rounded-xl flex items-center gap-2 text-xs">
                <Shield className="w-3.5 h-3.5 text-theme-blue shrink-0" />
                <span className="font-bold text-theme-primary hidden sm:inline">
                  {roleProfile.shortLabel}
                </span>
                <button
                  onClick={() => openLoginScreen(activeRole, activeScreen)}
                  className="text-theme-blue font-bold hover:underline cursor-pointer"
                  title="Return to Login Role Selector to switch demo role"
                >
                  Switch Role
                </button>
              </div>

              <button
                onClick={signOutToHome}
                className="neu-btn-secondary p-2 rounded-xl cursor-pointer"
                title="Sign Out to Public Home Page"
                aria-label="Sign Out to Public Home Page"
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

        {/* Active Screen Container with Subtle Fade & Slide-Up Transitions */}
        <main className="flex-1 w-full max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <AnimatePresence mode="wait">
            <motion.div
              key={
                activeScreen === 'institution-detail'
                  ? `institution-detail-${selectedInstitution?.institution_id}-${activeRole}`
                  : activeScreen === 'case-detail'
                    ? `case-detail-${selectedCase?.id}-${activeRole}`
                    : `${activeScreen}-${activeRole}`
              }
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
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
