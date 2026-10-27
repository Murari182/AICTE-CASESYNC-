# 📸 AICTE CaseSync — UI Screenshots Inventory

This directory contains automated, genuine screenshots of all UI screens, tabs, sub-tabs, dashboards, modals, drawers, form states, and responsive layouts captured directly from the running **AICTE CaseSync** application.

---

## 📊 Summary Statistics

| Metric | Count | Details |
| :--- | :---: | :--- |
| **Total Captured Screenshots** | **57** | 100% genuine rendered UI screens |
| **Successful Captures** | **57** | Zero corrupted or blank captures |
| **Failed Captures** | **0** | All routes & views rendered successfully |
| **Desktop Screenshots (1440×900)** | **34** | Master registers, dashboards, audit ledgers, dark mode |
| **Mobile Screenshots (390×844)** | **11** | Responsive layouts for phones & tablets |
| **Modals, Drawers & Popovers** | **8** | Transfer, escalate, disposal, search & notification drawers |
| **Forms & Input States** | **4** | Validation errors, custom unverified forms, prefilled inputs |

---

## 📁 Directory Structure

```text
screenshots/
├── README.md                  # This complete documentation & inventory
├── manifest.json              # Machine-readable JSON manifest with file sizes & metadata
├── desktop/                   # Full desktop viewport (1440×900) screenshots
│   ├── 01-landing-page-hero.png
│   ├── 02-landing-page-features.png
│   ├── 03-landing-page-architecture.png
│   ├── 04-login-screen.png
│   ├── 05-login-role-selected-rb.png
│   ├── 06-login-role-selected-pgrc.png
│   ├── 07-dashboard-overview.png
│   ├── 08-dashboard-filtered-bureau.png
│   ├── 09-case-management-all-cases.png
│   ├── 10-case-management-pending-tab.png
│   ├── 11-case-management-under-process-tab.png
│   ├── 12-case-management-overdue-tab.png
│   ├── 13-case-management-date-range-filter.png
│   ├── 14-case-management-search-filtered.png
│   ├── 15-case-management-empty-search.png
│   ├── 16-case-details-view.png
│   ├── 17-case-details-linked-overlaps.png
│   ├── 18-case-details-audit-timeline.png
│   ├── 19-institution-registry.png
│   ├── 20-institution-registry-filtered.png
│   ├── 21-institution-detail-profile.png
│   ├── 22-overlap-detection-queue.png
│   ├── 23-overlap-case-comparison.png
│   ├── 24-bureau-coordination-center.png
│   ├── 25-transfers-and-escalations.png
│   ├── 26-alerts-and-notifications.png
│   ├── 27-analytics-and-reports.png
│   ├── 28-audit-trail-ledger.png
│   ├── 29-audit-trail-filtered-transfers.png
│   ├── 30-system-settings-sla-rules.png
│   ├── 31-system-settings-bureau-routing.png
│   ├── 32-workspace-sidebar-collapsed.png
│   ├── 33-workspace-dark-mode-dashboard.png
│   └── 34-workspace-dark-mode-case-management.png
├── mobile/                    # Mobile viewport (390×844) responsive screenshots
│   ├── 01-landing-page-mobile.png
│   ├── 02-login-page-mobile.png
│   ├── 03-dashboard-mobile.png
│   ├── 04-case-management-mobile.png
│   ├── 05-case-details-mobile.png
│   ├── 06-institution-registry-mobile.png
│   ├── 07-overlap-detection-mobile.png
│   ├── 08-bureau-coordination-mobile.png
│   ├── 09-alerts-mobile.png
│   ├── 10-analytics-mobile.png
│   └── 11-settings-mobile.png
├── modals/                    # Modals, drawers, confirmation prompts & popovers
│   ├── 01-log-new-complaint-modal.png
│   ├── 02-transfer-case-modal.png
│   ├── 03-escalate-case-modal.png
│   ├── 04-mark-disposed-confirmation-modal.png
│   ├── 05-notifications-popover-open.png
│   ├── 06-global-search-autocomplete-dropdown.png
│   ├── 07-reset-dataset-confirmation-dialog.png
│   └── 08-mobile-navigation-drawer-open.png
└── forms/                     # Form states, validation messages, and input configurations
    ├── 01-login-form-empty-validation.png
    ├── 03-new-complaint-form-filled.png
    ├── 04-case-details-action-form.png
    └── 05-settings-sla-configuration-form.png
```

---

## 🔄 How to Regenerate All Screenshots

To re-run the automated capture suite at any time (e.g. after UI code updates):

```bash
# 1. Ensure the development server is running on port 3000
npm run dev

# 2. In a separate terminal, execute the capture script:
npm run screenshots
```

The script will automatically visit every page, trigger animations, open modals, test responsive viewports, and update both `manifest.json` and this inventory.

---

## 🛡️ Privacy & Quality Assurance

- **Zero Mock / Generated Images**: All PNGs are captured from the genuine rendered Chromium browser session.
- **Zero Exposed Secrets**: No API keys, passwords, or personal credentials appear in screenshots or logs.
- **Deterministic Selectors**: Tested using robust accessibility roles and stable semantic attributes.
