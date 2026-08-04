# Insights Module — SALTEDHASH Business OS

Insights is the **read-model / analytics layer** of the Business OS. It
aggregates, analyses, and presents business data owned by other modules —
**Expenses** and **Parties** — without owning primary transactional data
itself. It is local-first, reflects source changes immediately, and never
invents a parallel source of truth.

## Role & Ownership

- Insights **owns no primary transactional data**. It does not create,
  edit, or persist expenses or parties.
- Source of truth remains `expenseService` (Expenses) and `partyService`
  (Parties).
- Insights reads source data **only through those service contracts** and
  pure selectors. UI components never touch Dexie directly.
- No duplicate "insights" tables exist for source data. There is **no
  cache** today — everything is compute-on-read for correctness.

## Default Runtime Path (Local-First)

```
UI (InsightsPage.tsx)
  -> Hooks (useInsightsOverview, useCategoryBreakdown, ...)
    -> IInsightsService (api/dto.ts)
      -> LocalInsightsService (services/insightsService.ts)
        -> expenseService.getExpenses / partyService.getParties
        -> pure selectors (services/insightsSelectors.ts)
```

- `LocalInsightsService` is the **only** wired implementation.
- Any remote/report backend is **optional and quarantined** — it is never
  the default and never required for core usage.
- Hooks never implement business math. All aggregation lives in pure
  selectors; cross-module fetching lives in `LocalInsightsService`.

## Data Contracts

`IInsightsService` (implemented by `LocalInsightsService`):

- `getOverview(filter)` → `InsightsOverviewDTO`
- `getCategoryBreakdown(filter)` → `CategoryBreakdownItemDTO[]`
- `getPaymentModeMix(filter)` → `PaymentModeMixDTO[]`
- `getTrend(filter, bucket)` → `TrendPointDTO[]` (`day | week | month`)
- `getPartySpend(filter)` → `PartySpendItemDTO[]`
- `getAnomalies(filter)` → `AnomalyItemDTO[]`
- `exportInsightsSummary(filter)` → JSON-serializable summary

See `api/dto.ts` for the exact field shapes. `InsightsOverviewDTO` includes
`topParty`, `deltaVsPreviousPeriod` (real percentage vs the mirror-image
previous period), and `pendingAlertsCount` (count of detected anomalies).

## Selectors (pure & testable)

All analytics math lives in `services/insightsSelectors.ts`:

- `getOverview` / `composeOverview` equivalents for every metric
- `getCategoryBreakdown`, `getPaymentModeMix`, `getTrend`, `getPartySpend`
- `getAnomalies` (spike detection: amount > 1.5× category average, with a
  category baseline of at least 2 transactions)
- `exportSummary` (single pure composition of the whole payload)
- `computePreviousRange` (mirror-image previous period for delta)

Rules:
- `status = 'voided'` expenses are **always excluded** from totals.
- Date bucketing uses shared `dateUtils.ts` (`bucketDate`) and local-time
  semantics consistent with Expenses.
- Currency formatting is applied **in the UI only** via the shared
  `formatCurrency` utility — no hardcoded symbols in selectors.
- No category definitions are duplicated; they come from expense rows.

## Refresh Semantics

Insights recomputes on read and re-fetches when:

1. The filter/date range changes.
2. `emitDataChanged()` fires — every `createExpense`, `voidExpense`,
   `seedFixtures` (expenses/parties) emits this via `shared/events.ts`, so
   voiding an expense in Expenses immediately updates Insights totals.
3. The window regains focus.

There is no cache, so there is no stale-total failure mode.

## UI & Cross-Module Wiring

Canonical page: **`/insights`** (`frontend/src/modules/insights/InsightsPage.tsx`).

- **Overview header** — date-range control + KPI cards (total spend,
  transactions, avg daily spend, top category, top party, cash vs digital,
  delta vs previous period, pending alerts).
- **Category Breakdown** — ranked totals, drill down to `/expenses?categoryId=`.
- **Payment Mode Mix** — cash / upi / bank / card / other split.
- **Spend Trend** — day / week / month bucket toggle (line or bar chart).
- **Party Spend** — ranked list, drill down to `/parties/:id` timeline.
- **Anomalies Panel** — flagged spikes, drill down to `/expenses/:id`.
- **Export Summary** — downloads the current filtered insight summary as
  JSON.

Minimal functional pages back these drill-downs:
`frontend/src/modules/expenses/ExpensesPage.tsx`,
`frontend/src/modules/expenses/ExpenseDetailPage.tsx`,
`frontend/src/modules/parties/PartyPage.tsx`.

Legacy `/analytics`, `/reports`, and `/dashboard-insights` paths redirect to
`/insights`. Only `/insights` is canonical.

## Contract for other modules (e.g., Desk)

Consume consistent KPIs via the service, never via Dexie:

- `insightsService.getOverview({ preset: 'month' })`
- `insightsService.getCategoryBreakdown({ preset: 'month' })`
- `insightsService.getTrend({ preset: 'month' }, 'month')`

## Adding a new insight — rules for contributors

1. Put math in `insightsSelectors.ts` as a pure function (raw data in,
   DTO out).
2. Expose it on `IInsightsService` and implement it in `LocalInsightsService`
   by fetching through `expenseService` / `partyService`.
3. Add a hook in `hooks/index.ts` that calls the service only.
4. Do **not** read Dexie from UI, and do **not** duplicate category/currency
   logic. If a computation already exists in Expenses or shared utils,
   reuse it.
5. Cover the selector with an exact-value test in `insightsSelectors.test.ts`.

## Testing

Fixtures include voided, recurring, and spike expenses across multiple
categories/payment modes. Tests assert exact totals, category percentages,
payment-mode mix, anomaly metrics, trend grouping, and party-spend ranking.

```bash
npm install
npm test          # vitest run
npm run build     # vue-tsc && vite build
npm run dev       # local dev server
```
