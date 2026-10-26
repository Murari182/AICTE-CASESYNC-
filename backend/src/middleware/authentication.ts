import crypto from 'crypto';
import type { Request, Response, NextFunction } from 'express';
import { UserRole } from '../../../src/types/casesync';

export interface AuthenticatedUser {
  userId: string;
  displayName: string;
  email: string;
  role: UserRole;
  bureauScope: string;
  regionalScope?: string;
}

interface StoredAccount extends AuthenticatedUser {
  passwordSalt: string;
  passwordHash: string;
}

const SESSION_COOKIE_NAME = 'casesync_session_token';
const SESSION_TTL_MS = 12 * 60 * 60 * 1000; // 12 hours

function hashPassword(password: string, salt: string): string {
  return crypto.scryptSync(password, salt, 64).toString('hex');
}

function createAccount(
  userId: string,
  displayName: string,
  email: string,
  role: UserRole,
  bureauScope: string,
  defaultSecret: string,
  regionalScope?: string
): StoredAccount {
  const salt = crypto
    .createHash('sha256')
    .update(`aicte-casesync-salt:${email}`)
    .digest('hex')
    .slice(0, 32);
  return {
    userId,
    displayName,
    email: email.toLowerCase(),
    role,
    bureauScope,
    regionalScope,
    passwordSalt: salt,
    passwordHash: hashPassword(defaultSecret, salt),
  };
}

// Official AICTE CaseSync Accounts (Password hashed with scrypt)
const OFFICIAL_ACCOUNTS: StoredAccount[] = [
  createAccount(
    'USR-ADMIN-01',
    'Meera Nair (System Administrator)',
    'admin.casesync@aicte-india.org',
    'Administrator',
    'All Bureaus & Cells',
    process.env.INITIAL_ADMIN_PASS || 'AICTE@CaseSync2026'
  ),
  createAccount(
    'USR-RB-01',
    'Dr. S. Subramanian (RB Under Secretary)',
    'rb.officer@aicte-india.org',
    'Regulation Bureau Officer (RB)',
    'Regulation Bureau (RB)',
    process.env.INITIAL_OFFICER_PASS || 'AICTE@CaseSync2026'
  ),
  createAccount(
    'USR-PGRC-01',
    'R. K. Sharma (PGRC Nodal Officer)',
    'pgrc.nodal@aicte-india.org',
    'PGRC Officer',
    'Public Grievance Redressal Cell (PGRC)',
    process.env.INITIAL_OFFICER_PASS || 'AICTE@CaseSync2026'
  ),
  createAccount(
    'USR-SRO-01',
    'K. Balasubramanian (SRO Regional Officer)',
    'sro.officer@aicte-india.org',
    'Regional Officer',
    'Regional Office (SRO)',
    process.env.INITIAL_OFFICER_PASS || 'AICTE@CaseSync2026',
    'Southern (SRO)'
  ),
  createAccount(
    'USR-EXEC-01',
    'Prof. R. G. Deshmukh (Advisor-I)',
    'advisor1@aicte-india.org',
    'Senior Management / Competent Authority',
    'All Bureaus & Cells',
    process.env.INITIAL_OFFICER_PASS || 'AICTE@CaseSync2026'
  ),
  createAccount(
    'USR-SUB-01',
    'Authorized Institutional / Student Submitter',
    'submitter@academic.edu.in',
    'Submitter',
    'Public Grievance Redressal Cell (PGRC)',
    process.env.INITIAL_SUBMITTER_PASS || 'AICTE@CaseSync2026'
  ),
];

interface SessionEntry {
  user: AuthenticatedUser;
  expiresAt: number;
}

const activeSessions = new Map<string, SessionEntry>();

export function verifyUserCredentials(
  email: string,
  password: string
): AuthenticatedUser | null {
  const cleanEmail = email.trim().toLowerCase();
  const account = OFFICIAL_ACCOUNTS.find((acc) => acc.email === cleanEmail);
  if (!account) return null;

  const candidateHash = hashPassword(password, account.passwordSalt);
  const a = Buffer.from(candidateHash, 'hex');
  const b = Buffer.from(account.passwordHash, 'hex');
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return null;
  }

  return {
    userId: account.userId,
    displayName: account.displayName,
    email: account.email,
    role: account.role,
    bureauScope: account.bureauScope,
    regionalScope: account.regionalScope,
  };
}

export function createSession(
  res: Response,
  user: AuthenticatedUser
): { token: string; expiresAt: string } {
  const token = crypto.randomBytes(32).toString('hex');
  const expiresAt = Date.now() + SESSION_TTL_MS;
  activeSessions.set(token, { user, expiresAt });

  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: SESSION_TTL_MS,
    path: '/',
  });

  return { token, expiresAt: new Date(expiresAt).toISOString() };
}

export function clearSession(req: Request, res: Response): void {
  const token = extractToken(req);
  if (token) {
    activeSessions.delete(token);
  }
  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' });
}

function parseCookies(cookieHeader?: string): Record<string, string> {
  if (!cookieHeader) return {};
  return cookieHeader.split(';').reduce(
    (acc, part) => {
      const [k, ...v] = part.trim().split('=');
      if (k) acc[k] = decodeURIComponent(v.join('='));
      return acc;
    },
    {} as Record<string, string>
  );
}

function extractToken(req: Request): string | null {
  const authHeader = req.headers.authorization;
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.slice(7).trim();
  }
  const cookies = parseCookies(req.headers.cookie);
  return cookies[SESSION_COOKIE_NAME] || null;
}

export function getAuthenticatedUser(req: Request): AuthenticatedUser | null {
  const token = extractToken(req);
  if (!token) return null;
  const session = activeSessions.get(token);
  if (!session) return null;
  if (Date.now() > session.expiresAt) {
    activeSessions.delete(token);
    return null;
  }
  return session.user;
}

export function requireAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const user = getAuthenticatedUser(req);
  if (!user) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Valid authenticated session required.',
    });
    return;
  }
  (req as Request & { user?: AuthenticatedUser }).user = user;
  next();
}

export function listPublicAccountDirectory(): Array<{
  displayName: string;
  email: string;
  role: UserRole;
  bureauScope: string;
}> {
  return OFFICIAL_ACCOUNTS.map((a) => ({
    displayName: a.displayName,
    email: a.email,
    role: a.role,
    bureauScope: a.bureauScope,
  }));
}
