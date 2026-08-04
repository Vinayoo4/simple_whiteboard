# SALTEDHASH Business OS — Insights Module

Local-first business insights for SALTEDHASH Business OS. Expenses and parties live in IndexedDB (Dexie) on-device; the Insights module reads that data and computes analytics — it owns no primary data.

## Stack

- Shell: Vue 3 + Vue Router
- Insights UI: React 19 + TypeScript (bridged into the Vue shell via `ReactWrapper.vue`)
- Styling: Tailwind CSS
- Charts: Recharts
- Storage: Dexie (IndexedDB), local-first, seeded on first run
- Tests: Vitest + jsdom

## Setup & Run Locally

```bash
npm install
npm run dev
```

Build and tests:

```bash
npm run build
npm test
```

## Module Structure

Insights follows a strict four-layer architecture (UI never touches storage directly):

```
modules/insights/
  InsightsPage.tsx        # UI
  hooks/                  # data hooks (useAsync + data-changed subscriptions)
  services/
    insightsService.ts    # IInsightsService orchestration
    insightsSelectors.ts  # pure computation (no I/O, unit-tested)
    insightsServiceFactory.ts
    insightsDb.ts         # Dexie read access (only reachable via the service)
  api/
    dto.ts                # public DTOs
```

Source-of-truth modules:

- `modules/expenses/services/expenseService.ts` — expense CRUD, `getExpenseSummary`, `paymentMode` filter
- `modules/parties/services/partyService.ts` — party CRUD, `getPartyById`
- `shared/events.ts` — `emitDataChanged` / `subscribeDataChanged` bus used for cross-module refresh

## Routes

- `/insights` — analytics dashboard (canonical; `/analytics`, `/reports`, `/dashboard-insights` redirect here)
- `/expenses` — expense list (drill-down from insights)
- `/expenses/:id` — expense detail
- `/parties/:id` — party detail

## Design Rules

- Insights is a read-model: reads via `IInsightsService`, never writes primary data.
- All math lives in pure selectors with tests (`insightsSelectors.test.ts`).
- No mocks in the service layer; the module reads the real Dexie stores.
- No caching — compute-on-read so data is always fresh.
