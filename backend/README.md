# AICTE CaseSync — Backend Server & API Architecture

## 1. Overview
This directory contains the server-side authentication, role-based access control (RBAC), 5-layer cross-Bureau overlap detection engine, SLA deadline monitor, notification lifecycle service, Prisma PostgreSQL schema, and versioned `/api/v1` REST routes for **AICTE CaseSync**.

## 2. Directory Structure
```text
backend/
├── prisma/
│   └── schema.prisma              # Relational schema for Users, Institutions, Complaints, Relations, Transfers, Alerts, Audit
├── src/
│   ├── middleware/
│   │   ├── authentication.ts      # Scrypt password hashing, HTTP-only session cookies, Bearer token verification
│   │   └── authorization.ts       # Role permission matrix & data-scope enforcement for all 6 AICTE roles
│   ├── routes/
│   │   └── v1.ts                  # Versioned /api/v1 REST endpoints
│   └── services/
│       ├── overlap-detection.ts   # 5-Layer Cross-Bureau Overlap Detection service
│       ├── deadline-monitor.ts    # Idempotent SLA deadline & operational alert generator
│       └── notification-service.ts# Notification read/unread & alert lifecycle separation
├── .env.example
└── README.md
```

## 3. Environment Variables
Copy `.env.example` to `.env` and configure:
- `PORT`: Application port (default `3000`)
- `DATABASE_URL`: PostgreSQL connection string (`postgresql://user:password@localhost:5432/aicte_casesync`)
- `SESSION_SECRET`: Secret key for signing sessions
- `FRONTEND_ORIGIN`: Allowed CORS origin
- `VITE_API_BASE_URL`: `/api/v1`

## 4. Running the Application
```bash
# Install dependencies
npm install

# Start full-stack server (Express API + Vite frontend on Port 3000)
npm run dev

# Build for production
npm run build
```

## 5. Authentication & Official Roles
Authentication is enforced on `/api/v1/*` via `POST /api/v1/auth/login`, `POST /api/v1/auth/logout`, and `GET /api/v1/auth/me`. Passwords are verified using `crypto.scryptSync` timing-safe comparisons.

Supported roles:
1. **Administrator** (`admin.casesync@aicte-india.org`) — Full access to all institutions, cases, overlaps, reports, audit logs, and system settings.
2. **Regulation Bureau Officer (RB)** (`rb.officer@aicte-india.org`) — Scoped to RB cases and linked cross-Bureau institutional complaints.
3. **PGRC Officer** (`pgrc.nodal@aicte-india.org`) — Scoped to Public Grievance Redressal Cell cases and related institutional overlaps.
4. **Regional Officer** (`sro.officer@aicte-india.org`) — Scoped to Regional Office inspections and institutions in Southern & South-Western regions.
5. **Senior Management / Competent Authority** (`advisor1@aicte-india.org`) — Consolidated executive monitoring, overdue cases, and escalations.
6. **Submitter** (`submitter@academic.edu.in`) — Complaint submission and status tracking without internal Bureau remarks.
