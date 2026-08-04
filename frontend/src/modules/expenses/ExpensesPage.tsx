import { useEffect, useMemo, useState } from 'react';
import { expenseService } from './services/expenseService';
import { partyService } from '../parties/services/partyService';
import { formatCurrency } from '../../shared/utils/currencyUtils';

function useQueryParams(): URLSearchParams {
  return useMemo(() => new URLSearchParams(window.location.search), []);
}

export function ExpensesPage() {
  const params = useQueryParams();
  const categoryId = params.get('categoryId') || undefined;
  const partyId = params.get('partyId') || undefined;
  const paymentMode = params.get('paymentMode') || undefined;

  const [expenses, setExpenses] = useState<Awaited<ReturnType<typeof expenseService.getExpenses>> | null>(null);
  const [parties, setParties] = useState<Awaited<ReturnType<typeof partyService.getParties>>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    Promise.all([
      expenseService.getExpenses({ status: 'all', categoryId, partyId, paymentMode: paymentMode as never }),
      partyService.getParties()
    ])
      .then(([exps, pts]) => { if (active) { setExpenses(exps); setParties(pts); } })
      .catch(err => { if (active) setError(err as Error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [categoryId, partyId, paymentMode, reloadTick]);

  const partyMap = useMemo(() => new Map(parties.map(p => [p.id, p.name])), [parties]);

  const activeCount = (expenses || []).filter(e => e.status === 'active').length;
  const total = (expenses || []).filter(e => e.status === 'active').reduce((s, e) => s + e.amount, 0);

  const handleVoid = async (id: string) => {
    await expenseService.voidExpense(id);
    setReloadTick(t => t + 1);
  };

  const title = categoryId
    ? `Expenses · category ${categoryId}`
    : partyId
      ? 'Expenses · party'
      : paymentMode
        ? `Expenses · ${paymentMode}`
        : 'Expenses';

  return (
    <div className="p-4 sm:p-8 max-w-5xl mx-auto space-y-6">
      <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{title}</h1>
          <p className="text-sm text-gray-500 mt-1">
            {loading ? 'Loading...' : `${activeCount} active transactions · ${formatCurrency(total)} total`}
          </p>
        </div>
        <div className="flex gap-2">
          {categoryId && <a href="/insights" className="text-indigo-600 hover:underline text-sm font-medium">Back to Insights</a>}
          <button onClick={() => setReloadTick(t => t + 1)} className="border border-gray-300 text-gray-700 px-3 py-1.5 rounded-md text-sm hover:bg-gray-50">Refresh</button>
        </div>
      </header>

      {loading ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500" role="status">Loading expenses...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center text-red-700" role="alert">{error.message}</div>
      ) : (expenses || []).length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-12 text-center">
          <p className="text-gray-500">No expenses match this filter.</p>
          <a href="/insights" className="inline-block mt-4 text-indigo-600 hover:underline text-sm font-medium">Back to Insights</a>
        </div>
      ) : (
        <ul className="bg-white border border-gray-200 rounded-lg divide-y divide-gray-100 shadow-sm">
          {(expenses || []).map(e => (
            <li key={e.id} className="flex flex-col sm:flex-row sm:items-center gap-2 p-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-gray-900 truncate">{e.categoryName}</span>
                  {e.status === 'voided' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">voided</span>}
                </div>
                <div className="text-sm text-gray-500">
                  {e.paymentMode} · {new Date(e.date).toLocaleString()}
                  {e.partyId && ` · ${partyMap.get(e.partyId) || e.partyId}`}
                </div>
                {e.notes && <div className="text-xs text-gray-400 truncate">{e.notes}</div>}
              </div>
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${e.status === 'voided' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                  {formatCurrency(e.amount)}
                </span>
                <a href={`/expenses/${encodeURIComponent(e.id)}`} className="text-indigo-600 hover:underline text-sm">Detail</a>
                {e.status === 'active' && (
                  <button onClick={() => handleVoid(e.id)} className="text-red-600 hover:underline text-sm">Void</button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
