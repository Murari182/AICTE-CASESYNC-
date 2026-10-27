# 🚀 How to Run AICTE CaseSync

A complete step-by-step guide to installing dependencies, running the application in development, accessing over a local network (IP address), building for production, and running the packaged application.

---

## 📋 System Prerequisites

Ensure you have the following installed on your machine:
- **Node.js**: v18.x, v20.x, or v22+ (tested up to v24)
  - Verify with: `node -v`
- **npm**: v9+ (comes bundled with Node.js)
  - Verify with: `npm -v`
- **Web Browser**: Chrome, Edge, Firefox, or Safari (modern version with JavaScript enabled)

---

## 📦 1. Installation

Clone or open the repository directory in your terminal:

```bash
cd AICTE-CASESYNC-
```

Install all dependencies (frontend, backend, and development tools):

```bash
npm install
```

> **Note:** The dependencies are already configured with conflict-free peer resolution (`esbuild@^0.28.0`, `vite@^8.3.0`, `react@^19.0.1`, `express@^4.21.2`).

---

## 💻 2. Running in Development Mode

The development server runs Express on the backend with Vite running in middleware mode, serving both the API (`/api/v1/*`) and the interactive UI on a single unified port:

```bash
npm run dev
```

### Terminal Output
When the server starts, you will see a banner displaying your local and network IP addresses:

```text
  ======================================================
  🏛️  AICTE CaseSync Portal is Running & Accessible:
  ======================================================
  ➜  Local:    http://localhost:3000
  ➜  Network:  http://192.168.1.105:3000  (LAN / Wi-Fi IP address)
  ======================================================
```

Open **`http://localhost:3000`** in your browser.

---

## 🌐 3. Accessing via Network IP Address (LAN / Wi-Fi / Mobile Devices)

AICTE CaseSync is configured to bind to `0.0.0.0` (all network interfaces) and includes built-in CORS headers. This allows any device on the same local network (laptops, tablets, smartphones) to access the portal.

### Steps to Connect from Another Device:
1. Ensure both devices are connected to the same Wi-Fi or LAN network.
2. Note the **Network IP** displayed in the terminal output (e.g. `http://192.168.1.105:3000`).
3. Open the browser on your mobile phone, tablet, or another computer.
4. Enter the URL: `http://<YOUR-IP-ADDRESS>:3000` (e.g. `http://192.168.1.105:3000`).
5. The full AICTE CaseSync portal will load with complete API synchronization and real-time state persistence.

### Custom Port / Host Configuration
You can specify a custom port or host using environment variables:

**PowerShell (Windows):**
```powershell
$env:PORT=8080; npm run dev
```

**CMD (Windows):**
```cmd
set PORT=8080 && npm run dev
```

**Linux / macOS:**
```bash
PORT=8080 npm run dev
```

---

## 🏗️ 4. Building & Running the Packaged Production App

### Step A: Build the Production Bundle
Compile the TypeScript code and generate optimized static assets into the `dist/` directory:

```bash
npm run build
```

This generates:
- `dist/index.html`
- `dist/assets/*.css` (Tailwind 4 compiled design system)
- `dist/assets/*.js` (bundled and minified React 19 app)

### Step B: Run the Production Server
Start the production Express server serving the static `dist/` assets and live `/api/v1` backend endpoints:

```bash
# Sets NODE_ENV to production and launches server.ts
npm start
```

Or run Vite's standalone production preview:
```bash
npm run preview
```

---

## 📦 5. Packaging & Deployment Options

### Option A: Standard Node.js Production Host
Deploy the repository to any Node.js hosting platform (AWS EC2, Azure App Services, Render, DigitalOcean):
```bash
npm ci --omit=dev
npm run build
NODE_ENV=production npm start
```

### Option B: Process Manager (PM2)
To keep the server running continuously in the background with auto-restart:
```bash
# Install PM2 globally (optional)
npm install -g pm2

# Start the server with PM2
pm2 start server.ts --name "aicte-casesync" --interpreter ./node_modules/.bin/tsx

# Monitor logs
pm2 logs aicte-casesync
```

### Option C: Standalone Clean Script
To wipe the compiled build artifacts and temporary files:
```bash
npm run clean
```

---

## 🔑 6. Demo Accounts & Authentication Credentials

The system provides 6 pre-configured official Bureau accounts. You can sign in using credentials or click **"Instant Demo Access"** directly on the login screen.

| Role | Official Email | Default Password | Permitted Scope & Bureau |
| :--- | :--- | :--- | :--- |
| **Administrator** | `admin.casesync@aicte-india.org` | `AICTE@CaseSync2026` | Full platform access (all 12 institutions, all cases, overlap queues, system settings, model metrics, audit trails). |
| **Regulation Bureau Officer (RB)** | `rb.officer@aicte-india.org` | `AICTE@CaseSync2026` | Scoped to Regulation Bureau inquiries, norm non-compliance, and cross-bureau overlap review. |
| **PGRC Officer** | `pgrc.nodal@aicte-india.org` | `AICTE@CaseSync2026` | Scoped to Public Grievance Redressal Cell student/faculty fee and certificate complaints. |
| **Regional Officer** | `sro.officer@aicte-india.org` | `AICTE@CaseSync2026` | Scoped to Southern Regional Office (SRO) inspection reports and regional colleges. |
| **Senior Management** | `advisor1@aicte-india.org` | `AICTE@CaseSync2026` | Oversight for Competent Authority / Advisor-I: escalated cases, SLA overdue monitors, executive reports. |
| **Submitter** | `submitter@academic.edu.in` | `AICTE@CaseSync2026` | Institutional submitter portal for lodging complaints and tracking status (internal remarks restricted). |

> 💡 **Quick Role Switcher:** When inside the workspace, you can switch between roles at any time using the **Role dropdown in the top navigation header** to inspect role-scoped permissions dynamically.

---

## 💾 7. Data Persistence & Reset

- **Data Store**: Live changes (new complaints, status updates, transfers, escalations, alerts) are automatically persisted to `data-store.json` at the project root.
- **Reset to Initial Seed Dataset**:
  - **From UI**: Navigate to **Settings** -> Click **"Reset Baseline Dataset"** -> Confirm Reset.
  - **From Terminal**: Delete `data-store.json` and restart the server:
    ```powershell
    Remove-Item data-store.json -ErrorAction SilentlyContinue
    npm run dev
    ```

---

## 🛠️ 8. Available NPM Scripts

| Script | Command | Purpose |
| :--- | :--- | :--- |
| `npm run dev` | `tsx server.ts` | Starts development server with full Express API + Vite HMR on port 3000. |
| `npm run build` | `vite build` | Compiles frontend TypeScript and creates production bundle in `dist/`. |
| `npm start` | `tsx server.ts` | Runs the full-stack server (serving `dist/` in production mode). |
| `npm run preview` | `vite preview --host 0.0.0.0` | Starts Vite preview server bound to all network interfaces. |
| `npm run lint` | `tsc --noEmit` | Runs TypeScript compiler type-check across all frontend & backend files. |
| `npm run clean` | `node -e "..."` | Deletes the `dist/` directory and temporary build artifacts. |

---

## ❓ 9. Troubleshooting

### Port 3000 is Already in Use
If port 3000 is occupied by another process, start on another port:
```powershell
$env:PORT=3001; npm run dev
```

### Firewall Blocking Network IP Access
If you cannot access the portal from another device on the network:
1. Check Windows Defender Firewall (allow Node.js for Private Networks).
2. Verify both devices are on the exact same Wi-Fi subnet (e.g. `192.168.1.x`).
3. Test connectivity by pinging the host IP from the client device.
