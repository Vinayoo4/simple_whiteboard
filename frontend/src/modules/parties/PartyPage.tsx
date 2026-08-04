import { useEffect, useMemo, useState } from 'react';
import { partyService } from './services/partyService';
import { expenseService } from '../expenses/services/expenseService';
import { formatCurrency } from '../../shared/utils/currencyUtils';
import { PartyDTO } from './services/partyService';
import { ExpenseDTO } from '../../shared/db';

export function PartyPage() {
  const id = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [party, setParty] = useState<PartyDTO | null>(null);
  const [expenses, setExpenses] = useState<ExpenseDTO[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    Promise.all([partyService.getPartyById(id), expenseService.getExpenses({ status: 'all', partyId: id })])
      .then(([p, exps]) => {
        if (!active) return;
        if (!p) setError(new Error(`Party ${id} not found`));
        else { setParty(p); setExpenses(exps); }
      })
      .catch(err => { if (active) setError(err as Error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const active = useMemo(() => expenses.filter(e => e.status === 'active'), [expenses]);
  const total = active.reduce((s, e) => s + e.amount, 0);
  const sorted = useMemo(() => [...expenses].sort((a, b) => a.date.localeCompare(b.date)), [expenses]);

  return (
    <div className="p-4 sm:p-8 max-w-4xl mx-auto space-y-6">
      <a href="/insights" className="text-indigo-600 hover:underline text-sm font-medium">← Back to Insights</a>
      {loading ? (
        <div className="bg-white border rounded-lg p-12 text-center text-gray-500" role="status">Loading party...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 text-center text-red-700" role="alert">{error.message}</div>
      ) : party ? (
        <>
          <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
            <h1 className="text-2xl font-bold text-gray-900">{party.name}</h1>
            <p className="text-gray-500 mt-1 capitalize">Type: {party.type} · Created {new Date(party.createdAt).toLocaleDateString()}</p>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Total Spent</div>
                <div className="text-xl font-bold text-gray-900">{formatCurrency(total)}</div>
              </div>
              <div>
                <div className="text-xs uppercase tracking-wide text-gray-500">Transactions</div>
                <div className="text-xl font-bold text-gray-900">{active.length}</div>
              </div>
            </div>
          </div>

          <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
            <h2 className="font-bold text-gray-900 p-4 border-b border-gray-100">Timeline</h2>
            {sorted.length === 0 ? (
              <p className="p-8 text-center text-gray-500">No expenses linked to this party yet.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {sorted.map(e => (
                  <li key={e.id} className="flex items-center justify-between p-4">
                    <div>
                      <div className="font-medium text-gray-900">{e.categoryName}</div>
                      <div className="text-sm text-gray-500">{new Date(e.date).toLocaleString()} · {e.paymentMode}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${e.status === 'voided' ? 'text-gray-400 line-through' : 'text-gray-900'}`}>
                        {formatCurrency(e.amount)}
                      </span>
                      <a href={`/expenses/${encodeURIComponent(e.id)}`} className="text-indigo-600 hover:underline text-sm">Detail</a>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
