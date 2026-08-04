import { useState } from 'react';
import { useInsightsFilter, useInsightsOverview, useCategoryBreakdown, usePaymentModeMix, useInsightsTrend, usePartySpend, useAnomalies, useInsightsExport } from './hooks';
import { formatCurrency } from '../../shared/utils/currencyUtils';
import { PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, LineChart, Line } from 'recharts';
import type { InsightsFilterDTO } from './api/dto';

const MODE_COLORS: Record<string, string> = {
  cash: '#0088FE',
  upi: '#00C49F',
  bank: '#FFBB28',
  card: '#FF8042',
  other: '#8884d8'
};

export function InsightsPage() {
  const { filter, updateFilter } = useInsightsFilter({ preset: 'month' });
  const [trendBucket, setTrendBucket] = useState<'day' | 'week' | 'month'>('day');

  const { data: overview, loading: loadingOverview, error: overviewError } = useInsightsOverview(filter);
  const { data: categories, loading: loadingCategories } = useCategoryBreakdown(filter);
  const { data: paymentModes, loading: loadingModes } = usePaymentModeMix(filter);
  const { data: trends, loading: loadingTrends } = useInsightsTrend(filter, trendBucket);
  const { data: partySpends, loading: loadingParties } = usePartySpend(filter);
  const { data: anomalies, loading: loadingAnomalies } = useAnomalies(filter);
  const { exportData, exporting } = useInsightsExport();

  const loading = loadingOverview || loadingCategories || loadingModes || loadingParties || loadingAnomalies || loadingTrends;

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 sm:space-y-8">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Business Insights</h1>
          <p className="text-sm text-gray-500 mt-1">Read-model analytics over Expenses and Parties.</p>
        </div>
        <div className="flex gap-2 flex-wrap items-center">
          <select
            value={filter.preset || 'custom'}
            onChange={e => updateFilter({ preset: e.target.value as InsightsFilterDTO['preset'] })}
            className="border rounded-md p-2 bg-white text-sm"
          >
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
            <option value="custom">Custom</option>
          </select>
          {filter.preset === 'custom' && (
            <div className="flex gap-2 items-center">
              <input type="date" value={filter.rangeStart ? filter.rangeStart.split('T')[0] : ''} onChange={e => updateFilter({ rangeStart: e.target.value ? new Date(e.target.value).toISOString() : undefined })} className="border rounded-md p-2 bg-white text-sm" />
              <span className="text-gray-500">to</span>
              <input type="date" value={filter.rangeEnd ? filter.rangeEnd.split('T')[0] : ''} onChange={e => {
                if (e.target.value) {
                  const end = new Date(e.target.value);
                  end.setHours(23, 59, 59, 999);
                  updateFilter({ rangeEnd: end.toISOString() });
                } else {
                  updateFilter({ rangeEnd: undefined });
                }
              }} className="border rounded-md p-2 bg-white text-sm" />
            </div>
          )}
          <button
            onClick={() => exportData(filter)}
            disabled={exporting}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium disabled:opacity-50"
          >
            {exporting ? 'Exporting...' : 'Export JSON'}
          </button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500" role="status">Loading insights...</div>
      ) : overviewError ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center text-red-700" role="alert">
          Failed to load insights: {overviewError.message}
        </div>
      ) : !overview || overview.transactionCount === 0 ? (
        <EmptyState />
      ) : (
        <>
          <OverviewSection overview={overview} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySection categories={categories} />
            <PaymentModeSection modes={paymentModes} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <PartySection parties={partySpends} />
            <AnomalySection anomalies={anomalies} />
          </div>

          <TrendSection
            trends={trends}
            bucket={trendBucket}
            onBucketChange={setTrendBucket}
          />
        </>
      )}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
      <h2 className="text-lg font-semibold text-gray-900">No expense data for this range</h2>
      <p className="text-gray-500 mt-2 mb-4">Add an expense to start seeing insights, or widen the date range.</p>
      <div className="flex justify-center gap-3">
        <a href="/expenses" className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-md text-sm font-medium">
          Go to Expenses
        </a>
        <button onClick={() => window.location.reload()} className="border border-gray-300 text-gray-700 px-4 py-2 rounded-md text-sm font-medium hover:bg-gray-50">
          Reload
        </button>
      </div>
    </div>
  );
}

function KpiCard({ label, value, sub }: { label: string; value: React.ReactNode; sub?: React.ReactNode }) {
  return (
    <div className="bg-white border border-gray-200 rounded-lg p-4 shadow-sm">
      <h3 className="text-xs font-medium uppercase tracking-wide text-gray-500">{label}</h3>
      <div className="mt-1 text-xl sm:text-2xl font-bold text-gray-900">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500">{sub}</div>}
    </div>
  );
}

function OverviewSection({ overview }: { overview: NonNullable<ReturnType<typeof useInsightsOverview>['data']> }) {
  const delta = overview.deltaVsPreviousPeriod;
  const deltaClass = delta > 0 ? 'text-red-600' : delta < 0 ? 'text-green-600' : 'text-gray-500';
  const deltaArrow = delta > 0 ? '▲' : delta < 0 ? '▼' : '—';

  return (
    <section className="grid grid-cols-2 lg:grid-cols-4 gap-4" aria-label="Overview">
      <KpiCard label="Total Spend" value={formatCurrency(overview.totalSpend)} sub={`${overview.transactionCount} transactions`} />
      <KpiCard label="Avg Daily Spend" value={formatCurrency(overview.avgDailySpend)} />
      <KpiCard
        label="Top Category"
        value={overview.topCategory?.name || '—'}
        sub={overview.topCategory ? formatCurrency(overview.topCategory.total) : undefined}
      />
      <KpiCard
        label="Top Party"
        value={overview.topParty?.name || '—'}
        sub={overview.topParty ? formatCurrency(overview.topParty.total) : undefined}
      />
      <KpiCard
        label="Cash vs Digital"
        value={
          <span className="flex flex-col">
            <span className="text-blue-600">{formatCurrency(overview.cashVsDigital.cash)}</span>
            <span className="text-emerald-600">{formatCurrency(overview.cashVsDigital.digital)}</span>
          </span>
        }
        sub="cash / digital"
      />
      <KpiCard
        label="Delta vs Prev Period"
        value={<span className={deltaClass}>{deltaArrow} {Math.abs(delta).toFixed(1)}%</span>}
        sub={delta > 0 ? 'spend rose vs previous period' : delta < 0 ? 'spend fell vs previous period' : 'unchanged vs previous period'}
      />
      <KpiCard
        label="Pending Alerts"
        value={overview.pendingAlertsCount > 0 ? <span className="text-red-600">{overview.pendingAlertsCount}</span> : '0'}
        sub={overview.pendingAlertsCount > 0 ? 'review anomalies below' : 'no flagged anomalies'}
      />
    </section>
  );
}

function CategorySection({ categories }: { categories: ReturnType<typeof useCategoryBreakdown>['data'] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm" aria-label="Category breakdown">
      <h3 className="font-bold text-gray-900 mb-4">Category Breakdown</h3>
      {categories.length === 0 ? (
        <p className="text-gray-500 text-sm">No categories in this range.</p>
      ) : (
        <ul className="space-y-2">
          {categories.map(c => (
            <li key={c.categoryId}>
              <a href={`/expenses?categoryId=${encodeURIComponent(c.categoryId)}`} className="flex justify-between items-center p-2 rounded hover:bg-indigo-50 group">
                <div className="flex-1">
                  <span className="text-gray-900 font-medium group-hover:text-indigo-700">{c.categoryName}</span>
                  <div className="mt-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
                    <div className="h-full bg-indigo-500 rounded-full" style={{ width: `${Math.min(100, c.percentOfTotal)}%` }} />
                  </div>
                </div>
                <div className="ml-3 text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(c.total)}</div>
                  <div className="text-xs text-gray-500">{c.count} txns · {c.percentOfTotal.toFixed(1)}%</div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function PaymentModeSection({ modes }: { modes: ReturnType<typeof usePaymentModeMix>['data'] }) {
  const active = modes.filter(m => m.total > 0);
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm flex flex-col" aria-label="Payment mode mix">
      <h3 className="font-bold text-gray-900 mb-4">Payment Mode Mix</h3>
      <div className="flex-1 min-h-[220px]">
        {active.length === 0 ? (
          <div className="flex h-full items-center justify-center text-gray-500 text-sm">No payment data in this range.</div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie data={active} dataKey="total" nameKey="mode" cx="50%" cy="50%" innerRadius={50} outerRadius={80} label={({ mode }) => mode}>
                {active.map(entry => (
                  <Cell key={entry.mode} fill={MODE_COLORS[entry.mode] || MODE_COLORS.other} />
                ))}
              </Pie>
              <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
            </PieChart>
          </ResponsiveContainer>
        )}
      </div>
      <ul className="mt-3 grid grid-cols-2 sm:grid-cols-5 gap-2">
        {modes.map(m => (
          <li key={m.mode} className="flex flex-col items-center">
            <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: MODE_COLORS[m.mode] || MODE_COLORS.other }} />
            <span className="text-xs capitalize text-gray-600 mt-1">{m.mode}</span>
            <span className="text-sm font-semibold">{m.percentOfTotal.toFixed(0)}%</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function PartySection({ parties }: { parties: ReturnType<typeof usePartySpend>['data'] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm" aria-label="Party spend">
      <h3 className="font-bold text-gray-900 mb-4">Party Spend</h3>
      {parties.length === 0 ? (
        <p className="text-gray-500 text-sm">No party-linked expenses in this range.</p>
      ) : (
        <ul className="space-y-2">
          {parties.slice(0, 8).map(p => (
            <li key={p.partyId}>
              <a href={`/parties/${encodeURIComponent(p.partyId)}`} className="flex justify-between items-center p-2 rounded hover:bg-indigo-50 group">
                <div>
                  <div className="text-gray-900 font-medium group-hover:text-indigo-700">{p.partyName}</div>
                  <div className="text-xs text-gray-500 capitalize">{p.partyType} · {p.transactionCount} txns</div>
                </div>
                <div className="text-right">
                  <div className="font-semibold text-gray-900">{formatCurrency(p.total)}</div>
                  <div className="text-xs text-gray-500">{new Date(p.lastTransactionDate).toLocaleDateString()}</div>
                </div>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function AnomalySection({ anomalies }: { anomalies: ReturnType<typeof useAnomalies>['data'] }) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm" aria-label="Anomalies">
      <h3 className="font-bold text-gray-900 mb-4 flex items-center gap-2">
        Anomalies
        {anomalies.length > 0 && <span className="text-xs bg-red-100 text-red-700 px-2 py-0.5 rounded-full">{anomalies.length}</span>}
      </h3>
      {anomalies.length === 0 ? (
        <p className="text-gray-500 text-sm">No spikes detected in this range.</p>
      ) : (
        <ul className="space-y-2">
          {anomalies.slice(0, 5).map(a => (
            <li key={a.expenseId}>
              <a href={`/expenses/${encodeURIComponent(a.expenseId)}`} className="flex flex-col p-2 bg-red-50 rounded hover:bg-red-100">
                <div className="flex justify-between items-center">
                  <span className="text-red-700 font-medium">{a.categoryName} spike</span>
                  <span className="font-bold text-red-700">{formatCurrency(a.amount)}</span>
                </div>
                <span className="text-xs text-red-500">
                  {a.percentAboveAverage.toFixed(0)}% above category average ({formatCurrency(a.averageForCategory)}) on {new Date(a.date).toLocaleDateString()}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function TrendSection({ trends, bucket, onBucketChange }: {
  trends: ReturnType<typeof useInsightsTrend>['data'];
  bucket: 'day' | 'week' | 'month';
  onBucketChange: (b: 'day' | 'week' | 'month') => void;
}) {
  return (
    <section className="bg-white border border-gray-200 rounded-lg p-4 sm:p-5 shadow-sm" aria-label="Spend trend">
      <div className="flex flex-wrap justify-between items-center gap-2 mb-4">
        <h3 className="font-bold text-gray-900">Spend Trend</h3>
        <div className="flex rounded-md border border-gray-200 overflow-hidden">
          {(['day', 'week', 'month'] as const).map(b => (
            <button
              key={b}
              onClick={() => onBucketChange(b)}
              className={`px-3 py-1.5 text-sm font-medium ${bucket === b ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
            >
              {b === 'day' ? 'Daily' : b === 'week' ? 'Weekly' : 'Monthly'}
            </button>
          ))}
        </div>
      </div>
      {trends.length === 0 ? (
        <p className="text-gray-500 text-sm text-center py-10">No trend data in this range.</p>
      ) : (
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
              {bucket === 'day' ? (
              <LineChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val: number) => formatCurrency(val)} width={90} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Line type="monotone" dataKey="total" stroke="#4f46e5" strokeWidth={2} dot={false} />
              </LineChart>
            ) : (
              <BarChart data={trends}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tickFormatter={(val: number) => formatCurrency(val)} width={90} />
                <Tooltip formatter={(value: any) => formatCurrency(Number(value))} />
                <Bar dataKey="total" fill="#4f46e5" radius={[4, 4, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      )}
    </section>
  );
}
