import { expenseService } from '../modules/expenses/services/expenseService';
import { partyService } from '../modules/parties/services/partyService';
import { db } from './db';

export async function seedData() {
  const existing = await db.expenses.count();
  if (existing > 0) return;

  const today = new Date();
  const d1 = new Date(today); d1.setDate(today.getDate() - 1);
  const d2 = new Date(today); d2.setDate(today.getDate() - 3);
  const d3 = new Date(today); d3.setDate(today.getDate() - 10);
  const formatDate = (d: Date) => d.toISOString();

  await partyService.seedFixtures([
    { id: 'p1', name: 'Alice Smith', type: 'customer', createdAt: formatDate(today) },
    { id: 'p2', name: 'Bob Jones', type: 'supplier', createdAt: formatDate(today) },
    { id: 'p3', name: 'Charlie Inc', type: 'both', createdAt: formatDate(today) },
  ]);

  await expenseService.seedFixtures([
    // Active expense (recurring style)
    { id: 'e1', date: formatDate(today), amount: 500.00, categoryId: 'cat1', categoryName: 'Rent', paymentMode: 'bank', status: 'active', partyId: 'p2', createdAt: formatDate(today) },
    // Spike
    { id: 'e2', date: formatDate(d1), amount: 15000.00, categoryId: 'cat2', categoryName: 'Equipment', paymentMode: 'card', status: 'active', partyId: 'p3', createdAt: formatDate(d1) },
    // Normal cash expense
    { id: 'e3', date: formatDate(d2), amount: 120.00, categoryId: 'cat3', categoryName: 'Meals', paymentMode: 'cash', status: 'active', createdAt: formatDate(d2) },
    // Voided expense
    { id: 'e4', date: formatDate(d3), amount: 50.00, categoryId: 'cat3', categoryName: 'Meals', paymentMode: 'upi', status: 'voided', createdAt: formatDate(d3) },
    // UPI expense
    { id: 'e5', date: formatDate(d3), amount: 200.00, categoryId: 'cat4', categoryName: 'Transport', paymentMode: 'upi', status: 'active', createdAt: formatDate(d3) }
  ]);
}
