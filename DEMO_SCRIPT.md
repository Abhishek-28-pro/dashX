# 5-Minute Judge Demo Script — PromptWars x Astra

This script is structured for live judging demonstrations to showcase all core innovations in under 5 minutes.

---

### Step 1: Platform Overview & Live Stats (0:00 - 1:00)
- **URL**: [`http://localhost:3000`](http://localhost:3000)
- **Action**: Open the home page.
- **Narrative**:
  - *"Welcome to PromptWars x Astra, an AI-powered municipal infrastructure triage and deterministic dispatch engine."*
  - Point to the **4 Aggregation Stat Cards** (Total Incidents, Dispatched Crews, AI Triaged %, Avg Response Time).
  - Show the **Hero Leaflet Map** rendering real-time active incident markers.
  - Click the **"Accessible List View"** toggle to demonstrate WCAG 2.1 AA screen-reader / keyboard-accessible table view.
  - Toggle the language switcher between **English and Hindi** (हिन्दी) in the navbar to showcase localized UI.

---

### Step 2: Citizen Incident Reporting & AI Duplicate Shield (1:00 - 2:00)
- **URL**: [`http://localhost:3000/report`](http://localhost:3000/report) or click **"Report an Issue"** on Home.
- **Action**:
  1. Fill in Title: `"Deep pothole near Connaught Place metro gate 3"`.
  2. Select Category: `"Roads & Footpaths"`.
  3. Enter Location: `28.6315, 77.2167` (or click map / use default).
  4. Enter Description: `"Massive pothole damaging car suspensions. Water leaking from nearby pipe."`
  5. Upload any sample photo (triggers magic byte validation and EXIF metadata stripping).
  6. Submit the report.
- **Narrative**:
  - *"Notice the report is instantly analyzed by our Gemini AI pipeline for severity, urgency factor, and classification."*
  - Show the **Tracking ID Modal** giving an unguessable tracking code (e.g., `REP-XXXXXXXX`).
  - *Optional Duplicate Demonstration*: Re-submit the exact same incident within 200m to show automated duplicate suppression grouping without flooding municipal dispatchers.

---

### Step 3: Geographic Hotspots & Action Briefs (2:00 - 3:00)
- **URL**: [`http://localhost:3000/maps`](http://localhost:3000/maps)
- **Action**:
  1. Navigate to the **City Heatmap & Hotspots** page.
  2. Inspect the **350m circular hotspot density overlays** showing clustered incident zones.
  3. Click a hotspot cluster card to inspect the **AI Action Brief** — showing aggregate severity, primary root causes, and recommended crew allocation (e.g. *"Heavy road patching equipment + traffic cones needed"*).
  4. Toggle the **Accessible Hotspot Table** to inspect cluster metrics in tabular form.

---

### Step 4: Municipal Admin Three-Pane Triage Console (3:00 - 4:00)
- **URL**: [`http://localhost:3000/admin`](http://localhost:3000/admin)
- **Action**:
  1. Toggle Role Switcher in the top navbar to **"Municipal Officer (Admin)"** if not already set.
  2. Navigate to `/admin`.
  3. **Left Pane (Queue)**: Filter by status (`Submitted`, `Under Review`, `Dispatched`, `Resolved`) or sort by Priority Score.
  4. **Center Pane (Detail & Formula)**: Select an incident. Show the **Deterministic Priority Formula Breakdown**:
     $$\text{Priority} = 0.35 \times \text{Severity} + 0.25 \times \text{Upvotes/Duplicates} + 0.20 \times \text{Hotspot Density} + 0.20 \times \text{Age} + \text{Urgency}$$
  5. **Right Pane (Dispatch & History)**:
     - Update status from `Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Dispatched`.
     - Assign an internal maintenance note: `"Dispatched Road Work Crew Alpha with asphalt patch truck."`
     - Click **Save Status & Note**.
     - Observe the **Audit History Timeline** append the timestamped transition with operator attribution.

---

### Step 5: Public Citizen Resolution Tracking (4:00 - 5:00)
- **URL**: [`http://localhost:3000/track`](http://localhost:3000/track) or [`http://localhost:3000/track/REP-7K9X2M4B`](http://localhost:3000/track/REP-7K9X2M4B)
- **Action**:
  1. Enter a valid tracking ID into the search input.
  2. Observe the **Citizen Lifecycle Stepper** (`Submitted` $\rightarrow$ `Under Review` $\rightarrow$ `Dispatched` $\rightarrow$ `Resolved`).
  3. Highlight security controls: **No citizen PII is exposed**, and GPS coordinates are rounded to 2 decimals (~1.1 km precision) to guard reporter privacy.

---

### Summary Checklist for Judges
- [x] Full Next.js 15 App Router architecture with zero external database setup.
- [x] WCAG 2.1 AA accessibility (accessible list views, high contrast, aria labels, skip link).
- [x] Dual-engine AI pipeline (Gemini 2.5 Flash + deterministic fallback).
- [x] Prompt injection defense + Sharp EXIF stripping + IP sliding-window rate limiting.
- [x] Comprehensive 46-test test suite with 100% pass rate (`npm run check`).
