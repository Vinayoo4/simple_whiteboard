import { useEffect, useState } from 'react';
import { expenseService } from './services/expenseService';
import { partyService } from '../parties/services/partyService';
import { formatCurrency } from '../../shared/utils/currencyUtils';
import { ExpenseDTO } from '../../shared/db';

export function ExpenseDetailPage() {
  const id = window.location.pathname.split('/').filter(Boolean).pop() || '';
  const [expense, setExpense] = useState<ExpenseDTO | null>(null);
  const [partyName, setPartyName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    (async () => {
      const all = await expenseService.getExpenses({ status: 'all' });
      const found = all.find(e => e.id === id);
      if (!active) return;
      if (!found) {
        setError(new Error(`Expense ${id} not found`));
      } else {
        setExpense(found);
        if (found.partyId) {
          const party = await partyService.getPartyById(found.partyId);
          if (active) setPartyName(party?.name || null);
        }
      }
    })().catch(err => { if (active) setError(err as Error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [id]);

  const handleVoid = async () => {
    if (!expense) return;
    await expenseService.voidExpense(expense.id);
    const all = await expenseService.getExpenses({ status: 'all' });
    setExpense(all.find(e => e.id === expense.id) || expense);
  };

  return (
    <div className="p-4 sm:p-8 max-w-3xl mx-auto">
      <a href="/expenses" className="text-indigo-600 hover:underline text-sm font-medium">← Back to Expenses</a>
      {loading ? (
        <div className="bg-white border rounded-lg p-12 mt-4 text-center text-gray-500" role="status">Loading expense...</div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-lg p-12 mt-4 text-center text-red-700" role="alert">{error.message}</div>
      ) : expense ? (
        <div className="bg-white border border-gray-200 rounded-lg shadow-sm mt-4 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-start gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{expense.categoryName}</h1>
                <p className="text-gray-500 mt-1">Expense {expense.id}</p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900">{formatCurrency(expense.amount)}</div>
                {expense.status === 'voided' && <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full">voided</span>}
              </div>
            </div>
            <dl className="mt-6 grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
              <div><dt className="text-gray-500">Date</dt><dd className="font-medium text-gray-900">{new Date(expense.date).toLocaleString()}</dd></div>
              <div><dt className="text-gray-500">Payment Mode</dt><dd className="font-medium text-gray-900 capitalize">{expense.paymentMode}</dd></div>
              <div><dt className="text-gray-500">Category</dt><dd className="font-medium text-gray-900">{expense.categoryName}</dd></div>
              <div>
                <dt className="text-gray-500">Party</dt>
                <dd className="font-medium text-gray-900">
                  {expense.partyId
                    ? <a href={`/parties/${encodeURIComponent(expense.partyId)}`} className="text-indigo-600 hover:underline">{partyName || expense.partyId}</a>
                    : '—'}
                </dd>
              </div>
              {expense.notes && (
                <div className="sm:col-span-2"><dt className="text-gray-500">Notes</dt><dd className="font-medium text-gray-900">{expense.notes}</dd></div>
              )}
              <div><dt className="text-gray-500">Created</dt><dd className="font-medium text-gray-900">{new Date(expense.createdAt).toLocaleString()}</dd></div>
            </dl>
            {expense.status === 'active' && (
              <div className="mt-6 pt-4 border-t border-gray-100">
                <button onClick={handleVoid} className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium">Void Expense</button>
              </div>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
