# AICTE CaseSync — AI-Powered Case Classification & Intelligent Routing System

AICTE CaseSync is an interactive Smart India Hackathon (SIH) prototype that demonstrates how machine learning and configurable routing rules classify unstructured institutional and student cases, assess priority, recommend responsible departments, and preserve human-in-the-loop governance from submission to resolution.

## User Review & Critical Decisions

> [!IMPORTANT]
> The following architectural and UX decisions have been confirmed through our interactive planning review and govern the prototype build:

- **Confirmed Decision 1 — Hybrid AI & Deterministic Classification Engine**: The platform uses a server-side Gemini inference endpoint (`gemini-3.8-flash` with structured JSON output) to classify incoming cases, paired with a transparent, deterministic rule-based fallback classifier when offline or toggled for baseline comparison. Every prediction clearly labels its source (`Live AI Model Inference` vs. `Deterministic Rule-Based Demo Classifier`) and provides a human-readable explanation of extracted signals and applied routing rules.
- **Confirmed Decision 2 — Full-Stack Express API with Local Sync**: Cases, configurable category-to-department routing rules, and audit timelines are persisted via a full-stack Express API backed by an in-memory store synchronized with browser `localStorage`. This guarantees zero-latency persistence across refreshes and allows one-click resets to the original illustrative SIH dataset.
- **Confirmed Decision 3 — Instant Workspace Role Switcher**: Inside the operational application shell, reviewers and judges can switch instantaneously between three operational personas (**AICTE Administrator**, **Department Nodal Officer**, and **Case Submitter / Institution**) to experience how role-based permissions govern case submission, AI classification overrides, department reassignment, and audit logging.

---

## 1. Overview & Core Concept

- **What It Does**: Combines an 8-section + footer scrolling product story with a full-featured operational web application (Dashboard, Submit Case, Case Management, Case Details & Audit Timeline, Live Analytics, and Routing & Demo Settings).
- **Target Audience / Persona**: Smart India Hackathon jury members, AICTE evaluators, institutional nodal officers, and administrative reviewers evaluating how AI can reduce manual triage bottlenecks while preserving human accountability.
- **Key Value**: Transforms unstructured grievance and compliance descriptions into structured, prioritized, and department-routed cases within seconds—while keeping every classification explainable, auditable, and human-correctable.

---

## 2. User Experience & Visual Design

### Key User Flows

1. **Scrolling Narrative & Live Sandbox (Public Landing View)**:
   - Visitors land on a calm, uncluttered neumorphic hero showcasing a floating illustrative case preview card (`CS-2026-0142`) and clear CTAs.
   - Scrolling reveals the operational problem vs. automated workflow comparison, the 4-step processing pipeline, 6 interactive feature cards, a live **AI & Machine Learning Intelligence** sandbox (with sample presets and a "How this prediction was made" breakdown), an interactive platform preview frame, Responsible AI safeguards, and a final conversion banner.
2. **Case Submission & Real-Time Triage (`Submit a Case`)**:
   - Users enter a case title, detailed description, and optional category/department hints, or load one-click realistic SIH scenarios.
   - Submitting validates inputs, invokes the hybrid classifier, assigns a unique ID (`CS-2026-XXXX`), maps the predicted category to its configured department, records the initial audit event, and opens the newly created **Case Details** view.
3. **Human-in-the-Loop Review & Resolution (`Case Details` & `Case Management`)**:
   - Reviewers filter and search cases by category, priority, assigned department, or status.
   - Selecting any case opens its comprehensive detail panel comparing **AI Predicted Category / Recommended Department** against **Human-Confirmed Category / Assigned Department**, complete with confidence interpretation, classification rationale, internal notes, status transitions, and an immutable chronological activity timeline.
4. **Data-Driven Insights & Governance (`Analytics` & `Settings`)**:
   - All KPI counters and charts (category distribution, status breakdown, priority distribution, department workload, and timeline trends) compute dynamically from the active case dataset.
   - Administrators can edit category-to-department routing rules, toggle between Hybrid AI and Deterministic Demo mode, switch active user roles, or reset the prototype dataset to its seeded state.

### Visual Identity & Theme

- **Aesthetic Direction**: Soft, tactile light neumorphism with disciplined architectural hierarchy—combining cool porcelain-blue surfaces, dual-directional soft shadows, inset form wells, and electric blue-to-indigo focal accents.
- **Color Palette & Mood**:
  - `--bg-canvas`: `#E9EEF3` (60% dominant cool grey-blue canvas)
  - `--bg-surface`: `#F6F8FB` (30% structural raised card surface)
  - `--bg-elevated`: `#FFFFFF` (Pure white focal highlights and active controls)
  - `--text-primary`: `#293447` (High-contrast deep slate for WCAG AA legibility)
  - `--text-secondary`: `#788397` (Balanced slate for supporting prose)
  - `--text-muted`: `#9AA5B5` (Subtle captions and timestamps)
  - `--accent-primary`: `#3478F6` / `--accent-indigo`: `#4338F5` with primary gradient `linear-gradient(135deg, #438BFF 0%, #3438EE 100%)` (10% high-intent accent budget)
  - Semantic Priority & Status Tokens (always paired with explicit text labels and icons):
    - Nominal / Resolved / Low: `#1FA97A`
    - Warning / In-Progress / Medium-High: `#E9A23B`
    - Critical / Escalated: `#E65366`
  - Structural Border: `rgba(128, 145, 165, 0.18)`
- **Neumorphic Depth System**:
  - *Raised Cards*: `7px 7px 18px rgba(163,177,198,0.24), -7px -7px 18px rgba(255,255,255,0.88)`
  - *Inset Wells (Inputs, Search Bars, Pipeline Tracks)*: `inset 3px 3px 8px rgba(163,177,198,0.20), inset -3px -3px 8px rgba(255,255,255,0.85)`
- **Typography & Hierarchy**:
  - *Display & Headings*: `Manrope` (600/700 weights, `tracking-tight`, `text-wrap: balance`, hero scale `clamp(2.25rem, 4vw, 3.5rem)`).
  - *Body & Operational UI*: `Plus Jakarta Sans` (400/500/600 weights for crisp legibility across dense tables and forms).
  - *Telemetry, Case IDs & Tabular Figures*: `JetBrains Mono` with `font-variant-numeric: tabular-nums` on all case IDs, confidence scores, timestamps, and KPI counters.
- **Component Styling & Layout**:
  - Consistent border-radius scale: `12px` for compact controls, `16px` for buttons and inset inputs, `24px` for operational cards, and `32px` for major hero and preview containers.
  - Responsive 1440px desktop baseline with a collapsible sidebar in the application view and zero horizontal overflow on mobile viewports.

### Interactive Feedback & Motion

- Smooth `180ms–220ms` settling transitions (`cubic-bezier(0.16, 1, 0.3, 1)`) on button presses, tab switches, and card hover elevations.
- Immediate inline validation on case submission and routing rule edits, toast notifications confirming state mutations, and accessible `prefers-reduced-motion` support.

---

## 3. Key Product Decisions & Trade-Offs

- **Decision 1 — Transparent Hybrid Classification over Opaque Black-Box Claims**:
  - *Chosen Approach*: Pair live server-side Gemini structured classification with a deterministic keyword/signal engine, exposing the exact classification source, extracted key phrases, confidence interpretation, and routing rule lookup in the UI.
  - *Why*: SIH evaluators scrutinize authenticity. Labeling whether a prediction came from live AI inference or the deterministic fallback—and avoiding fabricated precision/recall claims—builds immediate technical credibility.
  - *Alternatives Considered*: Hardcoding static responses or claiming a pre-trained custom model without training artifacts, which fails technical Q&A scrutiny.
- **Decision 2 — Dual-Layer Persistence (Express API + LocalStorage Mirror)**:
  - *Chosen Approach*: Serve and mutate cases and routing rules through Express REST endpoints (`/api/cases`, `/api/classify`, `/api/routing-rules`, `/api/reset`) while mirroring state in `localStorage`.
  - *Why*: Combines genuine full-stack architecture with resilient client recovery if the container restarts during a live presentation.
  - *Alternatives Considered*: Client-only state (lacks backend API structure) or external database provisioning (adds unnecessary setup latency for an SIH demo).
- **Decision 3 — In-Workspace Role Switcher**:
  - *Chosen Approach*: Place an interactive role selector in the application top bar (`AICTE Admin`, `Department Officer`, `Case Submitter`) that dynamically adapts permitted actions (e.g., overriding AI categories or editing global routing rules requires Admin/Officer privileges) and logs the active role in every audit timeline entry.
  - *Why*: Lets presenters demonstrate multi-role governance in a single click without logging out and back in during a timed pitch.

---

## 4. Technical Architecture & Data Strategy *(Technical Reference)*

### Architecture & Component Diagram

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AICTE CaseSync Client Application                     │
│                                                                              │
│  ┌────────────────────────────────────┐  ┌────────────────────────────────┐  │
│  │     Public Storytelling View       │  │   Operational Workspace App    │  │
│  │  ┌──────────────────────────────┐  │  │  ┌──────────────────────────┐  │  │
│  │  │ Sticky Nav & Minimal Hero    │  │  │  │ App Sidebar & Role Bar   │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ Problem vs Solution Flow     │  │  │  │ A. Live KPI Dashboard    │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ 4-Step Interactive Process   │  │  │  │ B. Submit Case + Triage  │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ 6 Core Feature Cards         │  │  │  │ C. Case Detail & Audit   │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ Live ML Classification Demo  │  │  │  │ D. Filterable Case List  │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ Interactive App Shell Preview│  │  │  │ E. Live Data Analytics   │  │  │
│  │  ├──────────────────────────────┤  │  │  ├──────────────────────────┤  │  │
│  │  │ Responsible AI & Final CTA   │  │  │  │ F. Routing Rules & Reset │  │  │
│  │  └──────────────────────────────┘  │  │  └──────────────────────────┘  │  │
│  └─────────────────┬──────────────────┘  └───────────────┬────────────────┘  │
│                    └──────────────────┬──────────────────┘                   │
│                                       ▼                                      │
│  ┌────────────────────────────────────────────────────────────────────────┐  │
│  │         Shared CaseSync State & Service Layer (API + Local Sync)       │  │
│  └────────────────────────────────────┬───────────────────────────────────┘  │
└───────────────────────────────────────┼──────────────────────────────────────┘
                                        │ HTTP JSON (/api/*)
                                        ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                         Express Backend Server (Port 3000)                   │
│                                                                              │
│  ┌───────────────────────────┐              ┌─────────────────────────────┐  │
│  │  /api/cases & /api/rules  │              │       /api/classify         │  │
│  │  In-Memory Store + Seed   │              │  1. Gemini 3.8 Flash JSON   │  │
│  │  Illustrative SIH Dataset │              │  2. Deterministic Fallback  │  │
│  └───────────────────────────┘              └─────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────────────────┘
```

### Data Model & State

- **`CaseRecord`**:
  - `id`: Unique identifier (`CS-2026-0142` format)
  - `title`, `description`, `submittedBy`, `submitterRole`, `institutionName`
  - `predictedCategory`, `confirmedCategory`, `isCategoryOverridden`
  - `recommendedDepartment`, `assignedDepartment`, `isDepartmentOverridden`
  - `priority`: `'Low' | 'Medium' | 'High' | 'Critical'`
  - `status`: `'Pending' | 'In Progress' | 'Under Review' | 'Resolved'`
  - `confidence`: Number (`0–100`) paired with `classificationSource` (`'ai-model' | 'deterministic-rules'`)
  - `explanation`: Structured rationale (`summary`, `matchedSignals[]`, `routingRuleApplied`)
  - `createdAt`, `updatedAt`: ISO timestamps
  - `notes`: Array of internal reviewer notes (`id`, `author`, `role`, `content`, `timestamp`)
  - `timeline`: Chronological audit entries (`id`, `timestamp`, `actor`, `role`, `action`, `details`)
- **`RoutingRule`**:
  - `id`, `category`, `defaultDepartment`, `defaultPriority`, `keywords[]`, `slaHours`, `description`

### Interactive Component & State Mapping

- **Landing ML Sandbox (`Section 5`)**: Selecting a preset or typing a custom case description triggers `POST /api/classify`. The UI animates the 6-stage pipeline (`Case Description → Text Preprocessing → Feature Representation → Classification → Confidence Assessment → Department Recommendation`) and populates the prediction card and "How this prediction was made" drawer.
- **Case Submission (`Screen B`)**: Validates required fields (`title`, `description`), calls `/api/classify` + `/api/cases`, prepends the newly created case to the shared store, updates all dashboard/analytics counters immediately, and navigates to **Case Details (`Screen C`)**.
- **Case Details & Human Override (`Screen C`)**: Changing the confirmed category, assigned department, priority, or status dispatches `PATCH /api/cases/:id`, marks whether a human reviewer confirmed or corrected the AI recommendation, and appends a timestamped entry with the active role to `case.timeline`.
- **Dashboard & Case Management (`Screens A & D`)**: Real-time search across Case ID, title, description, and institution, combined with multi-facet filters (`category`, `priority`, `department`, `status`), column sorting, and pagination.
- **Settings & Routing Configuration (`Screen F`)**: Allows adding or editing category-to-department mapping rules, switching classifier mode (`Hybrid AI` vs `Deterministic Demo`), and resetting all data to the initial 12 illustrative SIH cases.
