import React, { useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  ArrowRight,
  Building2,
  CheckCircle2,
  GitCompare,
  KeyRound,
  Layers,
  Lock,
  Mail,
  Moon,
  ShieldCheck,
  Sun,
} from 'lucide-react';
import { ROLE_PROFILES, useCaseSync } from '../context/CaseSyncContext';
import { PermissionKey, UserRole } from '../types/casesync';

const ALL_ROLES: { role: UserRole; label: string }[] = [
  { role: 'Administrator', label: '1. Administrator' },
  {
    role: 'Regulation Bureau Officer (RB)',
    label: '2. Regulation Bureau Officer (RB)',
  },
  {
    role: 'PGRC Officer',
    label: '3. Public Grievance Redressal Cell Officer (PGRC)',
  },
  { role: 'Regional Officer', label: '4. Regional Officer' },
  {
    role: 'Senior Management / Competent Authority',
    label: '5. Senior Management / Competent Authority',
  },
  { role: 'Submitter', label: '6. Submitter (Public / Institutional)' },
];

const PERMISSION_LABELS: { key: PermissionKey; label: string }[] = [
  { key: 'view_all_cases', label: 'View All Cases' },
  { key: 'view_assigned_cases', label: 'View Assigned Scope' },
  { key: 'manage_institutions', label: 'Institution Registry' },
  { key: 'update_case_status', label: 'Update Case Status' },
  { key: 'assign_officers', label: 'Assign Officers' },
  { key: 'transfer_cases', label: 'Transfer Cases' },
  { key: 'escalate_cases', label: 'Escalate Cases' },
  { key: 'review_overlap', label: 'Review Overlaps' },
  { key: 'view_reports', label: 'Reports & CSV' },
  { key: 'view_audit_trail', label: 'Audit Trail' },
  { key: 'manage_settings', label: 'Manage Settings' },
  { key: 'view_model_metrics', label: 'Model Metrics' },
];

export const LoginPage: React.FC = () => {
  const {
    activeRole,
    theme,
    toggleTheme,
    setViewMode,
    loginWithRole,
  } = useCaseSync();

  const [selectedRole, setSelectedRole] = useState<UserRole>(activeRole);
  const [emailInput, setEmailInput] = useState<string>(
    ROLE_PROFILES[activeRole].defaultEmail
  );
  const [passcodeInput, setPasscodeInput] = useState<string>('SIH-2026-DEMO');
  const [errorMsg, setErrorMsg] = useState<string>('');

  const selectedProfile = ROLE_PROFILES[selectedRole];

  const handleRoleChange = (nextRole: UserRole) => {
    setSelectedRole(nextRole);
    setEmailInput(ROLE_PROFILES[nextRole].defaultEmail);
    setErrorMsg('');
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) {
      setErrorMsg('Please enter an official email or demo user identifier.');
      return;
    }
    if (!passcodeInput.trim() || passcodeInput.trim().length < 4) {
      setErrorMsg('Please enter a valid demo access token (minimum 4 characters).');
      return;
    }
    setErrorMsg('');
    loginWithRole(selectedRole, emailInput.trim());
  };

  return (
    <div className="min-h-screen neu-shell flex flex-col justify-between transition-colors duration-200">
      {/* Top Bar */}
      <header className="border-b border-theme bg-[var(--bg-app)]/90 backdrop-blur-md">
        <div className="max-w-[1320px] mx-auto px-4 sm:px-8 h-16 flex items-center justify-between">
          <button
            onClick={() => setViewMode('landing')}
            className="neu-btn-secondary px-3.5 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Home Page</span>
          </button>

          <div className="flex items-center gap-2.5">
            <button
              onClick={toggleTheme}
              className="neu-btn-secondary px-3 py-2 rounded-[12px] text-xs font-semibold inline-flex items-center gap-1.5 cursor-pointer"
              title={
                theme === 'light'
                  ? 'Switch to Dark Mode'
                  : 'Switch to Light Mode'
              }
            >
              {theme === 'light' ? (
                <>
                  <Moon className="w-3.5 h-3.5 text-[#4338F5]" />
                  <span>Dark Mode</span>
                </>
              ) : (
                <>
                  <Sun className="w-3.5 h-3.5 text-[#F4BD62]" />
                  <span>Light Mode</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Two-Column Login & Role Selection Layout */}
      <main className="flex-1 flex items-center py-10 px-4 sm:px-8">
        <div className="max-w-[1240px] w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
          {/* Left Panel: Branding, Value Props & Connected Case Records Illustration */}
          <div className="lg:col-span-6 neu-card rounded-[28px] p-7 sm:p-9 flex flex-col justify-between space-y-6">
            <div className="space-y-5">
              <div className="flex items-center gap-2.5">
                <div className="w-10 h-10 rounded-[12px] neu-btn-primary flex items-center justify-center text-white">
                  <Layers className="w-5 h-5" />
                </div>
                <div>
                  <div className="font-display text-lg font-extrabold text-theme-primary leading-none">
                    AICTE CaseSync
                  </div>
                  <div className="text-xs font-semibold text-theme-blue mt-1">
                    Integrated Institution Complaint Monitoring
                  </div>
                </div>
              </div>

              <h1 className="font-display text-2xl sm:text-3xl font-extrabold text-theme-primary tracking-tight">
                One Institution. One Coordinated View.
              </h1>

              <p className="text-sm text-theme-secondary leading-relaxed">
                Connect institution-related complaints across Regulation Bureau
                (RB), Public Grievance Redressal Cell (PGRC), Approval Bureau,
                and Regional Offices to prevent duplicate actions and track
                every case from receipt to disposal.
              </p>

              {/* Three Key Capabilities */}
              <div className="space-y-3 pt-1">
                {[
                  {
                    icon: <Building2 className="w-4 h-4 text-theme-blue" />,
                    title: 'Institution Monitoring',
                    desc: 'Consolidated case history anchored by AICTE Permanent ID.',
                  },
                  {
                    icon: <GitCompare className="w-4 h-4 text-theme-blue" />,
                    title: 'Overlap Detection',
                    desc: '5-layer cross-Bureau relationship detection with human officer review.',
                  },
                  {
                    icon: <ShieldCheck className="w-4 h-4 text-theme-blue" />,
                    title: 'Case Tracking',
                    desc: 'Explicit inter-Bureau transfer handoffs, SLA deadlines, and audit logs.',
                  },
                ].map((cap) => (
                  <div
                    key={cap.title}
                    className="neu-elevated rounded-[16px] p-3.5 flex items-start gap-3"
                  >
                    <div className="w-8 h-8 rounded-[10px] neu-inset flex items-center justify-center shrink-0 mt-0.5">
                      {cap.icon}
                    </div>
                    <div className="text-xs">
                      <div className="font-bold text-theme-primary">
                        {cap.title}
                      </div>
                      <div className="text-theme-secondary mt-0.5">
                        {cap.desc}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Connected Case Records Illustration */}
            <div className="neu-inset rounded-[20px] p-4 space-y-3 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wider text-theme-blue">
                  Connected Institutional Case Graph (Illustrative)
                </span>
                <span className="font-mono-tabular text-[11px] text-theme-secondary">
                  PID: 1-482910421
                </span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 items-center">
                <div className="neu-elevated rounded-[12px] p-2.5 text-center">
                  <div className="font-mono-tabular font-bold text-theme-blue">
                    CMP-2026-0142
                  </div>
                  <div className="text-[10px] text-theme-secondary">
                    PGRC Grievance
                  </div>
                </div>
                <div className="neu-elevated rounded-[12px] p-2.5 text-center border border-[var(--primary-blue)]">
                  <div className="font-bold text-theme-primary">
                    INST-101 Registry
                  </div>
                  <div className="text-[10px] text-theme-blue font-semibold">
                    Coordinated View
                  </div>
                </div>
                <div className="neu-elevated rounded-[12px] p-2.5 text-center">
                  <div className="font-mono-tabular font-bold text-theme-blue">
                    CMP-2026-0141
                  </div>
                  <div className="text-[10px] text-theme-secondary">
                    RB Inquiry
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Panel: Login Form & Integrated Demo Role Selection */}
          <div className="lg:col-span-6 neu-card rounded-[28px] p-7 sm:p-9 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-1">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-theme-blue">
                  <Lock className="w-3.5 h-3.5" />
                  Authorized Portal Sign In &amp; Demo Role Selector
                </div>
                <h2 className="font-display text-2xl font-extrabold text-theme-primary">
                  Sign In to CaseSync Workspace
                </h2>
                <p className="text-xs text-theme-secondary">
                  Select a simulated SIH demonstration role below to configure
                  your workspace scope and permissions.
                </p>
              </div>

              {errorMsg && (
                <div className="neu-inset rounded-[14px] p-3 text-xs text-[#C83D50] dark:text-[#FF7788] flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{errorMsg}</span>
                </div>
              )}

              {/* Role Selector */}
              <div className="space-y-2">
                <label
                  htmlFor="demo-role-select"
                  className="block text-xs font-bold text-theme-primary"
                >
                  Select Demo Role
                </label>
                <select
                  id="demo-role-select"
                  value={selectedRole}
                  onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                  className="neu-inset w-full px-3.5 py-3 rounded-[14px] text-xs sm:text-sm font-bold text-theme-primary focus:outline-none focus:ring-2 focus:ring-[var(--primary-blue)]/40 cursor-pointer"
                >
                  {ALL_ROLES.map((item) => (
                    <option
                      key={item.role}
                      value={item.role}
                      className="bg-[var(--bg-card)] text-theme-primary"
                    >
                      {item.label}
                    </option>
                  ))}
                </select>

                {/* Role Explanation & Permissions Preview */}
                <div className="neu-inset rounded-[16px] p-4 space-y-3 text-xs">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <span className="font-bold text-theme-primary">
                      {selectedProfile.displayName}
                    </span>
                    <span className="px-2 py-0.5 rounded-md bg-[var(--bg-elevated)] border border-theme font-semibold text-theme-blue">
                      Scope: {selectedProfile.bureau}
                    </span>
                  </div>
                  <p className="text-theme-secondary leading-relaxed">
                    {selectedProfile.loginDescription}
                  </p>
                  <div className="pt-2 border-t border-theme">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-theme-muted mb-1.5">
                      Configured Role Permissions:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {PERMISSION_LABELS.map((perm) => {
                        const enabled = selectedProfile.permissions[perm.key];
                        return (
                          <span
                            key={perm.key}
                            className={`px-2 py-0.5 rounded-md text-[11px] font-medium inline-flex items-center gap-1 ${
                              enabled
                                ? 'bg-[#18885F]/12 text-[#18885F] dark:text-[#49C99A]'
                                : 'bg-[var(--bg-card)] text-theme-muted line-through opacity-60'
                            }`}
                          >
                            {enabled && <CheckCircle2 className="w-3 h-3" />}
                            {perm.label}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* Official Email / User ID & Demo Access Token */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                <div>
                  <label
                    htmlFor="login-email"
                    className="block text-xs font-bold text-theme-primary mb-1.5"
                  >
                    Official Email / User ID
                  </label>
                  <div className="relative">
                    <Mail className="w-3.5 h-3.5 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-email"
                      type="text"
                      value={emailInput}
                      onChange={(e) => setEmailInput(e.target.value)}
                      placeholder="officer@aicte-india.org"
                      className="neu-inset w-full pl-9 pr-3 py-2.5 rounded-[12px] text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="login-passcode"
                    className="block text-xs font-bold text-theme-primary mb-1.5"
                  >
                    Demo Access Passcode
                  </label>
                  <div className="relative">
                    <KeyRound className="w-3.5 h-3.5 text-theme-muted absolute left-3.5 top-1/2 -translate-y-1/2" />
                    <input
                      id="login-passcode"
                      type="password"
                      value={passcodeInput}
                      onChange={(e) => setPasscodeInput(e.target.value)}
                      placeholder="Enter demo passcode"
                      className="neu-inset w-full pl-9 pr-3 py-2.5 rounded-[12px] text-xs font-medium focus:outline-none"
                    />
                  </div>
                </div>
              </div>

              <button
                type="submit"
                className="neu-btn-primary w-full py-3.5 rounded-[16px] text-sm font-bold inline-flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>Enter Demo Workspace as {selectedProfile.shortLabel}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </form>

            {/* Demo Access Notice */}
            <div className="mt-5 pt-4 border-t border-theme text-[11px] text-theme-secondary flex items-start gap-2">
              <ShieldCheck className="w-4 h-4 text-theme-blue shrink-0 mt-0.5" />
              <p>
                <strong>Simulated SIH Prototype Authorization:</strong> Role
                selection configures active permissions, visible Bureau case
                scope, and navigation items for hackathon evaluation. In a
                production deployment, role claims are enforced by server-side
                SSO/RBAC tokens.
              </p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};
