# Limitations & Environmental Considerations — PromptWars x Astra

This document provides a transparent overview of the architectural limitations, environment constraints, and production roadmap considerations for the PromptWars x Astra platform.

---

## 1. Environment & Evaluation Context
- **Air-Gapped / Offline Playwright Drivers**: In restricted corporate or sandbox environments without access to `azureedge.net`, Playwright browser binaries cannot be dynamically fetched. To ensure deterministic verification without external browser dependencies, the entire platform is covered by an automated Vitest test suite (`npm run check`) with 46 unit, AI, and HTTP API integration tests, alongside native node-fetch verification.
- **SQLite Single-File Database**: PromptWars x Astra uses Prisma with SQLite (`dev.db`) by design. This enables **instant zero-setup evaluation** on any developer machine without provisioning Docker containers or external cloud databases. However, SQLite has limited concurrency for heavy multi-writer environments. A seamless migration to PostgreSQL / Supabase is supported via the `.env` connection string.

---

## 2. Authentication & Authorization
- **Mock Role Switcher**: For hackathon demonstration convenience, authentication uses a lightweight cookie-based session (`user_role=citizen` vs `user_role=admin`) toggleable directly in the navigation bar. 
- **Production Roadmap**: In a production municipal deployment, this would be replaced with enterprise OAuth 2.0 / SAML (e.g. NextAuth or Supabase Auth) with Active Directory / Civic Identity SSO.

---

## 3. Rate Limiting
- **In-Memory Store**: The rate limiter (`src/lib/security/rate-limit.ts`) uses an in-memory sliding window cache. If the application server process restarts or scales horizontally across multiple container replicas, the rate limit state is not shared between instances.
- **Production Roadmap**: Production deployments should swap the in-memory map with an Upstash Redis or GCP Memorystore cluster.

---

## 4. AI & LLM Inference
- **Fallback Deterministic Pipeline**: When Gemini API quotas are exhausted, network connectivity drops, or response latency exceeds 8 seconds, the system automatically falls back to deterministic regex-based NLP classification and severity scoring. This ensures 100% municipal operational uptime.
- **Embedding Search**: In the SQLite configuration, spatial distance (Haversine $\le 200\text{m}$) and Jaccard token overlap ($\ge 0.75$) perform rapid, lightweight duplicate suppression. When connected to PostgreSQL / Supabase, pgvector is utilized for cosine similarity lookups.

---

## 5. Accessibility (WCAG 2.1 AA)
- **Map Accessibility**: Interactive map widgets inherently challenge keyboard navigation and screen readers. We resolved this by including a dedicated **Accessible List View / Table View** toggle directly on both the Hero Map and the Hotspot Map page, allowing complete keyboard tab traversal, aria-described status badges, and non-color-dependent urgency indicators.
- **High Contrast**: The UI utilizes Tailwind colors tuned for minimum 4.5:1 text contrast ratios across all alert states.
