import React from 'react';
import {
  AlertTriangle,
  ArrowRight,
  ArrowRightLeft,
  BarChart3,
  Bell,
  Building2,
  CheckCircle2,
  Clock,
  FileSpreadsheet,
  FolderKanban,
  GitCompare,
  History,
  Layers,
  Lock,
  Moon,
  ShieldCheck,
  Sun,
  Users,
} from 'lucide-react';
import { useCaseSync } from '../context/CaseSyncContext';
import { OverlapBadge, StatusBadge } from './ui/SharedComponents';

export const LandingPage: React.FC = () => {
  const {
    theme,
    toggleTheme,
    openLoginScreen,
    allInstitutionsTotalCount,
    allCasesTotalCount,
  } = useCaseSync();

  const [activeNav, setActiveNav] = React.useState<
    'home' | 'problem-statement' | 'core-features' | 'how-it-works'
  >('home');

  React.useEffect(() => {
    const handleScroll = () => {
      const y = window.scrollY;
      if (y < 260) {
        setActiveNav('home');
        return;
      }
      const sections: (
        | 'problem-statement'
        | 'core-features'
        | 'how-it-works'
      )[] = ['problem-statement', 'how-it-works', 'core-features'];
      for (const id of sections) {
        const el = document.getElementById(id);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= 180 && rect.bottom >= 140) {
            setActiveNav(id);
            break;
          }
        }
      }
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (
    id: 'home' | 'problem-statement' | 'core-features' | 'how-it-works'
  ) => {
    setActiveNav(id);
    if (id === 'home') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
      return;
    }
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  };

  const navLinks: {
    id: 'home' | 'problem-statement' | 'core-features' | 'how-it-works';
    label: string;
  }[] = [
    { id: 'home', label: 'Home' },
    { id: 'problem-statement', label: 'About the Platform' },
    { id: 'core-features', label: 'Features' },
    { id: 'how-it-works', label: 'How It Works' },
  ];

  return (
    <div className="min-h-screen neu-shell transition-colors duration-200">
      {/* Sticky Public Navigation Bar with Active Section Indicator */}
      <header className="sticky top-0 z-40 bg-[var(--bg-app)]/95 backdrop-blur-md border-b border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <button
            onClick={() => scrollToSection('home')}
            className="flex items-center gap-2.5 text-base sm:text-lg font-bold tracking-tight text-theme-primary whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="w-8 h-8 rounded-[10px] neu-btn-primary flex items-center justify-center text-white">
              <Layers className="w-4 h-4" />
            </span>
            <span>AICTE CaseSync</span>
          </button>

          {/* Public Navigation Links with Active Pill Indicator */}
          <nav
            aria-label="Primary Navigation"
            className="hidden lg:flex items-center gap-1.5 neu-inset p-1.5 rounded-[14px]"
          >
            {navLinks.map((item) => {
              const isActive = activeNav === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => scrollToSection(item.id)}
                  aria-current={isActive ? 'page' : undefined}
                  className={`px-3.5 py-1.5 rounded-[10px] text-xs sm:text-sm font-semibold transition-all cursor-pointer flex items-center gap-1.5 ${
                    isActive
                      ? 'neu-btn-primary text-white shadow-sm'
                      : 'text-theme-secondary hover:text-theme-primary'
                  }`}
                >
                  {isActive && (
                    <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                  )}
                  <span>{item.label}</span>
                </button>
              );
            })}
          </nav>

          {/* Theme Toggle + Sign In + Access Dashboard */}
          <div className="flex items-center gap-2.5 shrink-0">
            <button
              onClick={toggleTheme}
              title={
                theme === 'light'
                  ? 'Switch to Dark Mode'
                  : 'Switch to Light Mode'
              }
              aria-label={
                theme === 'light'
                  ? 'Switch to Dark Mode'
                  : 'Switch to Light Mode'
              }
              className="neu-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold text-theme-primary inline-flex items-center gap-1.5 cursor-pointer"
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#4338F5]" />
                  <span className="hidden sm:inline">Dark</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#F4BD62]" />
                  <span className="hidden sm:inline">Light</span>
                </>
              )}
            </button>

            <button
              onClick={() => openLoginScreen()}
              className="neu-btn-secondary px-3.5 py-2 rounded-[12px] text-xs sm:text-sm font-semibold text-theme-primary cursor-pointer"
            >
              Sign In
            </button>

            <button
              onClick={() => openLoginScreen()}
              className="neu-btn-primary px-4 py-2 rounded-[12px] text-xs sm:text-sm font-semibold inline-flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <span>Access Dashboard</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Mobile/Tablet Navigation Strip with Active Indicator */}
        <div className="lg:hidden border-t border-theme px-4 py-2 flex items-center gap-1.5 overflow-x-auto">
          {navLinks.map((item) => {
            const isActive = activeNav === item.id;
            return (
              <button
                key={item.id}
                type="button"
                onClick={() => scrollToSection(item.id)}
                className={`px-3 py-1 rounded-[10px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer flex items-center gap-1.5 ${
                  isActive
                    ? 'neu-btn-primary text-white'
                    : 'neu-btn-secondary text-theme-secondary'
                }`}
              >
                {isActive && (
                  <span className="w-1.5 h-1.5 rounded-full bg-white shrink-0" />
                )}
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* HERO SECTION */}
      <section className="py-12 lg:py-18">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-12 items-center">
            {/* Left Hero Copy */}
            <div className="lg:col-span-6 space-y-6">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full neu-inset text-[11px] font-bold tracking-wider uppercase text-theme-blue">
                SMART INDIA HACKATHON • INSTITUTION CASE MONITORING
              </div>

              <h1
                className="font-display font-extrabold text-theme-primary tracking-tight leading-[1.08]"
                style={{
                  fontSize: 'clamp(2.25rem, 4vw, 3.4rem)',
                  textWrap: 'balance',
                }}
              >
                One Institution. One Coordinated View.
              </h1>

              <p className="text-base sm:text-lg text-theme-secondary leading-relaxed max-w-xl">
                An integrated platform for monitoring institution-related
                complaints, detecting potential cross-Bureau overlaps, and
                coordinating case resolution across AICTE Bureaus and Cells.
              </p>

              <div className="flex flex-wrap items-center gap-3.5 pt-1">
                <button
                  onClick={() => openLoginScreen()}
                  className="neu-btn-primary px-6 py-3.5 rounded-[16px] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Access Dashboard</span>
                  <ArrowRight className="w-4 h-4" />
                </button>

                <button
                  onClick={() => scrollToSection('how-it-works')}
                  className="neu-btn-secondary px-6 py-3.5 rounded-[16px] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
                >
                  <span>Explore How It Works</span>
                </button>
              </div>

              <div className="pt-5 border-t border-theme grid grid-cols-3 gap-4 text-xs">
                <div>
                  <p className="font-mono-tabular text-xl font-extrabold text-theme-primary">
                    {allInstitutionsTotalCount}
                  </p>
                  <p className="text-theme-secondary mt-0.5">
                    Seeded Demo Institutions
                  </p>
                </div>
                <div>
                  <p className="font-mono-tabular text-xl font-extrabold text-theme-primary">
                    {allCasesTotalCount}
                  </p>
                  <p className="text-theme-secondary mt-0.5">
                    Multi-Bureau Cases
                  </p>
                </div>
                <div>
                  <p className="font-mono-tabular text-xl font-extrabold text-theme-blue">
                    5-Layer
                  </p>
                  <p className="text-theme-secondary mt-0.5">
                    Overlap Detection Engine
                  </p>
                </div>
              </div>
            </div>

            {/* Right Interactive-Style Preview Card (Illustrative Demo Data) */}
            <div className="lg:col-span-6">
              <div className="neu-card rounded-[28px] p-6 sm:p-7 space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-2 pb-3.5 border-b border-theme">
                  <div className="flex items-center gap-2 text-xs">
                    <Building2 className="w-4 h-4 text-theme-blue" />
                    <span className="font-bold text-theme-primary">
                      Consolidated Institution Case View
                    </span>
                  </div>
                  <span className="px-2.5 py-0.5 rounded-md neu-inset text-[11px] font-semibold text-theme-secondary">
                    Illustrative Demo Data
                  </span>
                </div>

                {/* 1. One Institution Profile */}
                <div className="neu-elevated rounded-[18px] p-4 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-xs text-theme-secondary">
                      <span className="font-mono-tabular font-bold text-theme-blue">
                        AICTE PID: 1-482910421
                      </span>
                      <span>•</span>
                      <span>South-Western Region (SWRO)</span>
                    </div>
                    <h2 className="font-display text-base font-bold text-theme-primary mt-1">
                      Deccan Institute of Engineering &amp; Technology, Bengaluru
                    </h2>
                  </div>
                  <OverlapBadge
                    status="Potential Overlap — Review Required"
                    compact
                  />
                </div>

                {/* 2. Two Related Complaint Records (RB and PGRC Involvement) */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div className="neu-elevated rounded-[18px] p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-theme-blue">
                        CMP-2026-0142
                      </span>
                      <StatusBadge status="Under Process" compact />
                    </div>
                    <p className="text-xs font-bold text-theme-primary leading-snug">
                      Retention of original degree certificates &amp; 5-month
                      salary arrears
                    </p>
                    <div className="text-[11px] font-semibold text-theme-secondary pt-1 border-t border-theme">
                      Bureau: Public Grievance Redressal Cell (PGRC)
                    </div>
                  </div>

                  <div className="neu-elevated rounded-[18px] p-4 space-y-2">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono-tabular text-xs font-bold text-theme-blue">
                        CMP-2026-0141
                      </span>
                      <StatusBadge status="Under Process" compact />
                    </div>
                    <p className="text-xs font-bold text-theme-primary leading-snug">
                      CSE faculty cadre deficit (1:28 SSR) &amp; non-payment of
                      7th CPC scale
                    </p>
                    <div className="text-[11px] font-semibold text-theme-secondary pt-1 border-t border-theme">
                      Bureau: Regulation Bureau (RB)
                    </div>
                  </div>
                </div>

                {/* 3. Potential Overlap Alert & Coordination Status */}
                <div className="neu-inset rounded-[18px] p-4 space-y-2.5">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 text-xs font-bold text-[#C83D50] dark:text-[#FF7788]">
                      <AlertTriangle className="w-4 h-4 shrink-0" />
                      <span>
                        Potential Overlapping Cases — Coordination Required
                      </span>
                    </div>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-theme text-theme-primary">
                      Status: Active Joint Review
                    </span>
                  </div>
                  <p className="text-xs text-theme-secondary leading-relaxed">
                    Both cases share exact AICTE PID 1-482910421. PGRC and RB
                    are acting simultaneously on interlocking CSE faculty and
                    certificate compliance issues while preserving separate Case
                    IDs.
                  </p>
                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[11px] text-theme-muted">
                      Sign in with a demo role to inspect live records
                    </span>
                    <button
                      onClick={() => openLoginScreen()}
                      className="text-xs font-bold text-theme-blue hover:underline inline-flex items-center gap-1 cursor-pointer"
                    >
                      <Lock className="w-3 h-3" />
                      Sign In to Review →
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 1: PROBLEM STATEMENT */}
      <section
        id="problem-statement"
        className="py-14 border-t border-theme"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              01 • Problem Statement
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary">
              Why Siloed Bureau Complaint Handling Creates Operational Gaps
            </h2>
            <p className="text-sm sm:text-base text-theme-secondary leading-relaxed">
              AICTE receives complaints and grievances concerning technical
              education institutions from students, faculty, and stakeholders.
              When Regulation Bureau (RB), Public Grievance Redressal Cell
              (PGRC), Approval Bureau, and Regional Offices process complaints
              independently without a shared institution-wise view, four
              operational challenges arise:
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                title: 'Fragmented Visibility',
                desc: 'Different Bureaus/Cells act on complaints regarding the same institution without visibility into parallel inquiries or prior orders.',
              },
              {
                title: 'Overlapping Regulatory Actions',
                desc: 'Simultaneous notices or inspections may be initiated by RB and PGRC for closely related institutional grievances.',
              },
              {
                title: 'Unclear Handoff Accountability',
                desc: 'Cases transferred between Bureaus or Regional Offices can stall without explicit handoff acceptance and ownership tracking.',
              },
              {
                title: 'Delayed Disposal & SLA Breaches',
                desc: 'Without consolidated institution-wise ageing and deadline monitoring, critical multi-Bureau cases risk delayed resolution.',
              },
            ].map((item) => (
              <div key={item.title} className="neu-card rounded-[20px] p-5 space-y-2">
                <h3 className="font-display text-sm font-bold text-theme-primary">
                  {item.title}
                </h3>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 2: OUR SOLUTION */}
      <section id="our-solution" className="py-14 border-t border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              02 • Our Solution
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary">
              A Single-Window Institution-Centric Monitoring &amp; Coordination Platform
            </h2>
            <p className="text-sm sm:text-base text-theme-secondary leading-relaxed">
              AICTE CaseSync anchors every complaint to a verified Institution
              Registry record (via AICTE Permanent ID) while keeping each
              complaint’s Case ID, Bureau workflow, and disposal timeline
              independent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              {
                icon: <Building2 className="w-5 h-5 text-theme-blue" />,
                title: 'Centralized Institution Profile',
                desc: 'Every complaint across RB, PGRC, Approval Bureau, FGC, and Regional Offices rolls up into a single 5-tab institutional dossier.',
              },
              {
                icon: <GitCompare className="w-5 h-5 text-theme-blue" />,
                title: 'Non-Destructive Overlap Linking',
                desc: 'Detects related cross-Bureau cases for officer review without ever auto-merging or erasing separate official Case IDs.',
              },
              {
                icon: <ShieldCheck className="w-5 h-5 text-theme-blue" />,
                title: 'Role-Based Access & Audit Trail',
                desc: 'Enforces scoped permissions for Administrators, RB Officers, PGRC Officers, Regional Officers, Senior Management, and Submitters.',
              },
            ].map((card) => (
              <div key={card.title} className="neu-card rounded-[22px] p-6 space-y-3">
                <div className="w-10 h-10 rounded-[12px] neu-inset flex items-center justify-center">
                  {card.icon}
                </div>
                <h3 className="font-display text-base font-bold text-theme-primary">
                  {card.title}
                </h3>
                <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
                  {card.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 3: HOW CASESYNC WORKS */}
      <section id="how-it-works" className="py-14 border-t border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              03 • How CaseSync Works
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary">
              End-to-End Institutional Complaint Lifecycle
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {[
              {
                step: 'Step 1',
                title: 'Complaint Intake & PID Resolution',
                desc: 'Matches incoming complaints to the AICTE Permanent ID first, or flags missing/conflicting PIDs for human verification.',
              },
              {
                step: 'Step 2',
                title: 'Cross-Bureau Retrieval',
                desc: 'Retrieves all active and historical complaints for the same institution across RB, PGRC, AB, FGC, and Regional Offices.',
              },
              {
                step: 'Step 3',
                title: 'Overlap & Rule Assessment',
                desc: 'Evaluates category compatibility, subject similarity, and simultaneous Bureau actions to raise coordination alerts.',
              },
              {
                step: 'Step 4',
                title: 'Officer Review & Coordination',
                desc: 'Authorized officers confirm relationships, mark separate matters, assign coordination owners, and manage transfers.',
              },
              {
                step: 'Step 5',
                title: 'Tracked Disposal & Reporting',
                desc: 'Updates SLA indicators, chronological audit trails, and live institutional/Bureau analytics through final disposal.',
              },
            ].map((s) => (
              <div key={s.step} className="neu-card rounded-[20px] p-5 space-y-2">
                <span className="font-mono-tabular text-xs font-bold text-theme-blue">
                  {s.step}
                </span>
                <h3 className="font-display text-sm font-bold text-theme-primary">
                  {s.title}
                </h3>
                <p className="text-xs text-theme-secondary leading-relaxed">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 4: CORE FEATURES */}
      <section id="core-features" className="py-14 border-t border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 space-y-8">
          <div className="max-w-3xl space-y-2">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              04 • Core Features
            </span>
            <h2 className="font-display text-2xl sm:text-3xl font-bold text-theme-primary">
              Ten Integrated Operational Modules
            </h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 text-xs">
            {[
              {
                icon: <Layers className="w-4 h-4 text-theme-blue" />,
                title: 'Overview Dashboard',
                desc: '6 clickable KPIs, priority alerts, search & status filters, and Bureau workloads.',
              },
              {
                icon: <Building2 className="w-4 h-4 text-theme-blue" />,
                title: 'Institution Registry',
                desc: 'Centralized directory by AICTE Permanent ID with 5-tab institutional profiles.',
              },
              {
                icon: <FolderKanban className="w-4 h-4 text-theme-blue" />,
                title: 'Complaint Cases',
                desc: 'Multi-facet filtering, sorting, CSV export, and full case timelines.',
              },
              {
                icon: <GitCompare className="w-4 h-4 text-theme-blue" />,
                title: 'Overlap Detection',
                desc: 'Side-by-side comparison of candidate pairs with human review actions.',
              },
              {
                icon: <Users className="w-4 h-4 text-theme-blue" />,
                title: 'Bureau Coordination',
                desc: 'Joint review workspace across RB, PGRC, AB, FGC, and Regional Offices.',
              },
              {
                icon: <ArrowRightLeft className="w-4 h-4 text-theme-blue" />,
                title: 'Transfers & Escalations',
                desc: 'Explicit handoff acceptance workflow and Level 1 / Level 2 escalations.',
              },
              {
                icon: <Bell className="w-4 h-4 text-theme-blue" />,
                title: 'Alerts & SLA Center',
                desc: 'Configurable Due Soon and Overdue alerts with officer acknowledgement.',
              },
              {
                icon: <BarChart3 className="w-4 h-4 text-theme-blue" />,
                title: 'Reports & Analytics',
                desc: 'Institution, Bureau, region, and ageing reports with CSV export.',
              },
              {
                icon: <History className="w-4 h-4 text-theme-blue" />,
                title: 'Immutable Audit Trail',
                desc: 'Chronological ledger of every status update, overlap decision, and transfer.',
              },
              {
                icon: <ShieldCheck className="w-4 h-4 text-theme-blue" />,
                title: 'Settings & Model Metrics',
                desc: 'Configurable SLA thresholds, routing rules, and offline evaluation metrics.',
              },
            ].map((feat) => (
              <div key={feat.title} className="neu-card rounded-[18px] p-4 space-y-2">
                <div className="w-8 h-8 rounded-[10px] neu-inset flex items-center justify-center">
                  {feat.icon}
                </div>
                <div className="font-bold text-sm text-theme-primary">
                  {feat.title}
                </div>
                <p className="text-theme-secondary leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* SECTION 5 & 6: INSTITUTION-WISE MONITORING & CROSS-BUREAU OVERLAP DETECTION */}
      <section
        id="institution-monitoring"
        className="py-14 border-t border-theme"
      >
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 5. Institution-Wise Monitoring */}
          <div className="neu-card rounded-[24px] p-6 sm:p-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              05 • Institution-Wise Monitoring
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-theme-primary">
              Complete Institutional Context Before Any Bureau Acts
            </h2>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              Opening an institution profile immediately displays its AICTE
              Permanent ID, verification state, all open and historical
              complaints across Bureaus, active cross-Bureau coordination
              items, and consolidated action history.
            </p>
            <ul className="space-y-2 text-xs text-theme-primary">
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#18885F] dark:text-[#49C99A] shrink-0" />
                <span>
                  Preferred matching by exact AICTE Permanent ID (`1-XXXXXXXXX`)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#18885F] dark:text-[#49C99A] shrink-0" />
                <span>
                  Consolidates unrelated complaints at the same institution
                  without false duplicate flags (Scenario B)
                </span>
              </li>
              <li className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#18885F] dark:text-[#49C99A] shrink-0" />
                <span>
                  Blocks automatic merging when institution identity is
                  uncertain (Scenario C)
                </span>
              </li>
            </ul>
          </div>

          {/* 6. Cross-Bureau Overlap Detection */}
          <div
            id="overlap-detection"
            className="neu-card rounded-[24px] p-6 sm:p-7 space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              06 • Cross-Bureau Overlap Detection
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-theme-primary">
              Background ML Decision Support with Human-in-the-Loop Governance
            </h2>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              Machine learning operates behind the workflow to resolve noisy
              institution references, retrieve candidate related complaints, and
              explain why two cases across RB and PGRC require coordination.
            </p>
            <div className="neu-inset rounded-[16px] p-4 space-y-2 text-xs">
              <div className="font-bold text-theme-primary">
                Example Operational Alert Explanation:
              </div>
              <p className="text-theme-secondary italic">
                “Potential overlap: Both cases concern the same institution
                (PID 1-482910421). One is being handled by PGRC (CMP-2026-0142)
                and another by RB (CMP-2026-0141). Their descriptions and
                current actions require joint coordination.”
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 7 & 8: CASE TRACKING AND COORDINATION + REPORTS AND ANALYTICS */}
      <section id="coordination" className="py-14 border-t border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 7. Case Tracking and Coordination */}
          <div className="neu-card rounded-[24px] p-6 sm:p-7 space-y-4">
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              07 • Case Tracking &amp; Coordination
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-theme-primary">
              Explicit Handoffs, Escalations &amp; Chronological Audit Trails
            </h2>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              Every transfer records its originating Bureau, receiving Bureau,
              transferring officer, reason, and acceptance state (`Transfer
              Requested`, `Awaiting Acceptance`, `Accepted`, or `Returned for
              Clarification`). Every status change or remark is permanently
              logged in the case timeline.
            </p>
            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="neu-inset rounded-[14px] p-3">
                <div className="font-bold text-theme-primary">
                  Independent Case IDs
                </div>
                <p className="text-theme-secondary mt-0.5">
                  Related cases share a coordination record while keeping
                  separate disposal dates.
                </p>
              </div>
              <div className="neu-inset rounded-[14px] p-3">
                <div className="font-bold text-theme-primary">
                  SLA Deadline Tracking
                </div>
                <p className="text-theme-secondary mt-0.5">
                  Configurable `On Track`, `Due Soon`, and `Overdue` indicators.
                </p>
              </div>
            </div>
          </div>

          {/* 8. Reports and Analytics */}
          <div
            id="reports-preview"
            className="neu-card rounded-[24px] p-6 sm:p-7 space-y-4"
          >
            <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
              08 • Reports &amp; Analytics
            </span>
            <h2 className="font-display text-xl sm:text-2xl font-bold text-theme-primary">
              Live Institutional, Regional &amp; Bureau Analytics with CSV Export
            </h2>
            <p className="text-xs sm:text-sm text-theme-secondary leading-relaxed">
              All charts and summary tables are computed directly from the
              shared case dataset—distinguishing total complaints, unique
              monitored institutions, and confirmed related-case groups.
            </p>
            <div className="flex flex-wrap gap-2 text-xs">
              {[
                'Institution-Wise History',
                'Bureau/Cell Workload',
                'Region-Wise Distribution',
                'Pending Case Ageing',
                'Overlap Summary',
                'One-Click CSV Export',
              ].map((tag) => (
                <span
                  key={tag}
                  className="px-3 py-1.5 rounded-[10px] neu-inset font-semibold text-theme-primary inline-flex items-center gap-1.5"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-theme-blue" />
                  {tag}
                </span>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 9: FINAL CALL TO ACTION */}
      <section id="cta" className="py-16 border-t border-theme">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8">
          <div className="neu-card rounded-[28px] p-8 sm:p-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-bold uppercase tracking-wider text-theme-blue">
                09 • Ready for SIH Evaluation
              </span>
              <h2 className="font-display text-2xl sm:text-3xl font-extrabold text-theme-primary">
                Select a Demo Role and Experience the Complete CaseSync Workflow
              </h2>
              <p className="text-sm text-theme-secondary leading-relaxed">
                Sign in as an Administrator, Regulation Bureau Officer (RB),
                PGRC Officer, Regional Officer, Senior Management, or Submitter
                to test role-scoped dashboards, overlap reviews, and inter-Bureau
                transfers.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3 shrink-0">
              <button
                onClick={() => openLoginScreen()}
                className="neu-btn-primary px-6 py-3.5 rounded-[16px] text-sm font-semibold inline-flex items-center gap-2 cursor-pointer"
              >
                <span>Access Dashboard &amp; Select Role</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* SECTION 10: FOOTER */}
      <footer className="py-8 border-t border-theme text-xs text-theme-secondary">
        <div className="max-w-[1360px] mx-auto px-4 sm:px-8 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-theme-blue" />
            <span className="font-bold text-theme-primary">AICTE CaseSync</span>
            <span>•</span>
            <span>
              Integrated Institution Complaint Monitoring &amp; Cross-Bureau
              Coordination Platform
            </span>
          </div>
          <p>
            10 • Smart India Hackathon Working Prototype • Illustrative Demo
            Dataset • Light &amp; Dark Theme Supported
          </p>
        </div>
      </footer>
    </div>
  );
};
