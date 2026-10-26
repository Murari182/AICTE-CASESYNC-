import type { Request, Response, NextFunction } from 'express';
import {
  CaseRecord,
  InstitutionRecord,
  PermissionKey,
  UserRole,
} from '../../../src/types/casesync';
import { AuthenticatedUser } from './authentication';

export const ROLE_PERMISSION_MATRIX: Record<
  UserRole,
  Record<PermissionKey, boolean>
> = {
  Administrator: {
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
  'Regulation Bureau Officer (RB)': {
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
  'PGRC Officer': {
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
  'Regional Officer': {
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
  'Senior Management / Competent Authority': {
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
  Submitter: {
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
};

export function requirePermission(permission: PermissionKey) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const user = (req as Request & { user?: AuthenticatedUser }).user;
    if (!user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required.',
      });
      return;
    }

    const perms = ROLE_PERMISSION_MATRIX[user.role];
    if (!perms || !perms[permission]) {
      res.status(403).json({
        error: 'Forbidden',
        message: `Role "${user.role}" is not permitted to perform "${permission}".`,
      });
      return;
    }
    next();
  };
}

/**
 * Data-Scope Enforcement for Cases & Institutions based on Authenticated Server Role
 */
export function filterCasesForRole(
  allCases: CaseRecord[],
  role: UserRole
): CaseRecord[] {
  if (ROLE_PERMISSION_MATRIX[role]?.view_all_cases) {
    return allCases;
  }

  if (role === 'Regulation Bureau Officer (RB)') {
    const rbInstIds = new Set(
      allCases
        .filter((c) => c.current_bureau === 'Regulation Bureau (RB)')
        .map((c) => c.institution_id)
    );
    return allCases.filter(
      (c) =>
        c.current_bureau === 'Regulation Bureau (RB)' ||
        rbInstIds.has(c.institution_id)
    );
  }

  if (role === 'PGRC Officer') {
    const pgrcInstIds = new Set(
      allCases
        .filter(
          (c) => c.current_bureau === 'Public Grievance Redressal Cell (PGRC)'
        )
        .map((c) => c.institution_id)
    );
    return allCases.filter(
      (c) =>
        c.current_bureau === 'Public Grievance Redressal Cell (PGRC)' ||
        pgrcInstIds.has(c.institution_id)
    );
  }

  if (role === 'Regional Officer') {
    return allCases.filter(
      (c) =>
        c.current_bureau.startsWith('Regional Office') ||
        c.region === 'Southern (SRO)' ||
        c.region === 'South-Western (SWRO)'
    );
  }

  if (role === 'Submitter') {
    return allCases.filter(
      (c) =>
        c.current_bureau === 'Public Grievance Redressal Cell (PGRC)' ||
        c.submittedBy.toLowerCase().includes('submitter') ||
        c.submittedBy.toLowerCase().includes('student')
    );
  }

  return allCases;
}

export function filterInstitutionsForRole(
  allInstitutions: InstitutionRecord[],
  scopedCases: CaseRecord[],
  role: UserRole
): InstitutionRecord[] {
  if (ROLE_PERMISSION_MATRIX[role]?.view_all_cases) {
    return allInstitutions;
  }
  const instIds = new Set(scopedCases.map((c) => c.institution_id));
  const filtered = allInstitutions.filter((i) => instIds.has(i.institution_id));
  return filtered.length > 0 ? filtered : allInstitutions;
}
