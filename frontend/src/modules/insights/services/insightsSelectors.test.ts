import { describe, it, expect } from 'vitest';
import { InsightsSelectors, computePreviousRange } from './insightsSelectors';
import { ExpenseDTO } from '../../../shared/db';
import { PartyDTO } from '../../parties/services/partyService';

const PARTIES: PartyDTO[] = [
  { id: 'p1', name: 'Acme Supplies', type: 'supplier', createdAt: '2023-10-01T00:00:00Z' },
  { id: 'p2', name: 'Green Foods', type: 'customer', createdAt: '2023-10-01T00:00:00Z' }
];

const EXPENSES: ExpenseDTO[] = [
  { id: 'e1', amount: 500, categoryId: 'c1', categoryName: 'Rent', paymentMode: 'bank', status: 'active', partyId: 'p1', date: '2023-10-01T10:00:00Z', createdAt: '2023-10-01T10:00:00Z' },
  { id: 'e2', amount: 200, categoryId: 'c2', categoryName: 'Food', paymentMode: 'upi', status: 'active', partyId: 'p2', date: '2023-10-02T10:00:00Z', createdAt: '2023-10-02T10:00:00Z' },
  { id: 'e3', amount: 150, categoryId: 'c2', categoryName: 'Food', paymentMode: 'cash', status: 'active', partyId: 'p2', date: '2023-10-03T10:00:00Z', createdAt: '2023-10-03T10:00:00Z' },
  { id: 'e4', amount: 300, categoryId: 'c3', categoryName: 'Travel', paymentMode: 'card', status: 'active', partyId: 'p1', date: '2023-10-04T10:00:00Z', createdAt: '2023-10-04T10:00:00Z' },
  { id: 'e5', amount: 60, categoryId: 'c2', categoryName: 'Food', paymentMode: 'upi', status: 'voided', partyId: 'p2', date: '2023-10-05T10:00:00Z', createdAt: '2023-10-05T10:00:00Z' },
  { id: 'e6', amount: 180, categoryId: 'c2', categoryName: 'Food', paymentMode: 'cash', status: 'active', partyId: 'p2', date: '2023-10-06T10:00:00Z', createdAt: '2023-10-06T10:00:00Z' },
  { id: 'e7', amount: 4000, categoryId: 'c2', categoryName: 'Food', paymentMode: 'cash', status: 'active', partyId: 'p2', date: '2023-10-07T10:00:00Z', createdAt: '2023-10-07T10:00:00Z' }
];

const PREVIOUS_PERIOD_EXPENSES: ExpenseDTO[] = [
  { id: 'pe1', amount: 4264, categoryId: 'c2', categoryName: 'Food', paymentMode: 'cash', status: 'active', partyId: 'p2', date: '2023-09-15T10:00:00Z', createdAt: '2023-09-15T10:00:00Z' }
];

describe('InsightsSelectors', () => {
  it('getOverview computes exact totals, excludes voided, and resolves top party/category', () => {
    const overview = InsightsSelectors.getOverview(EXPENSES, {}, { parties: PARTIES });

    expect(overview.totalSpend).toBe(5330); // excludes voided e5 (60)
    expect(overview.transactionCount).toBe(6);
    expect(overview.topCategory).toEqual({ id: 'c2', name: 'Food', total: 4530 });
    expect(overview.topParty).toEqual({ id: 'p2', name: 'Green Foods', total: 4530 });
    expect(overview.cashVsDigital).toEqual({ cash: 4330, digital: 1000 });
    expect(overview.avgDailySpend).toBeCloseTo(5330 / 6, 5); // data spans Oct 1-7 = 6 days
    expect(overview.pendingAlertsCount).toBe(1);
  });

  it('getOverview computes delta vs previous period as a percentage', () => {
    const overview = InsightsSelectors.getOverview(EXPENSES, {}, { parties: PARTIES, previousPeriodExpenses: PREVIOUS_PERIOD_EXPENSES });
    expect(overview.deltaVsPreviousPeriod).toBeCloseTo(((5330 - 4264) / 4264) * 100, 5);
  });

  it('getOverview applies date range filters', () => {
    const overview = InsightsSelectors.getOverview(EXPENSES, {
      rangeStart: '2023-10-01T00:00:00Z',
      rangeEnd: '2023-10-03T23:59:59Z'
    }, { parties: PARTIES });
    expect(overview.transactionCount).toBe(3);
    expect(overview.totalSpend).toBe(850); // 500 + 200 + 150
  });

  it('getCategoryBreakdown computes exact totals and percentages', () => {
    const breakdown = InsightsSelectors.getCategoryBreakdown(EXPENSES, {});
    expect(breakdown).toHaveLength(3);
    expect(breakdown[0]).toEqual({
      categoryId: 'c2', categoryName: 'Food', total: 4530, count: 4,
      percentOfTotal: expect.closeTo(84.99, 2)
    });
    expect(breakdown[1].categoryId).toBe('c1');
    expect(breakdown[1].percentOfTotal).toBeCloseTo(9.38, 2);
    expect(breakdown[2].categoryId).toBe('c3');
    expect(breakdown[2].percentOfTotal).toBeCloseTo(5.63, 2);
  });

  it('getPaymentModeMix computes exact totals and percentages', () => {
    const mix = InsightsSelectors.getPaymentModeMix(EXPENSES, {});
    const byMode = Object.fromEntries(mix.map(m => [m.mode, m]));

    expect(byMode.cash.total).toBe(4330);
    expect(byMode.cash.percentOfTotal).toBeCloseTo(81.24, 2);
    expect(byMode.bank.total).toBe(500);
    expect(byMode.bank.percentOfTotal).toBeCloseTo(9.38, 2);
    expect(byMode.upi.total).toBe(200);
    expect(byMode.upi.percentOfTotal).toBeCloseTo(3.75, 2);
    expect(byMode.card.total).toBe(300);
    expect(byMode.card.percentOfTotal).toBeCloseTo(5.63, 2);
    expect(byMode.other.total).toBe(0);
    const sum = mix.reduce((s, m) => s + m.percentOfTotal, 0);
    expect(sum).toBeCloseTo(100, 2);
  });

  it('getTrend groups by day and month buckets', () => {
    const daily = InsightsSelectors.getTrend(EXPENSES, {}, 'day');
    expect(daily).toEqual([
      { date: '2023-10-01', total: 500 },
      { date: '2023-10-02', total: 200 },
      { date: '2023-10-03', total: 150 },
      { date: '2023-10-04', total: 300 },
      { date: '2023-10-06', total: 180 },
      { date: '2023-10-07', total: 4000 }
    ]);

    const monthly = InsightsSelectors.getTrend(EXPENSES, {}, 'month');
    expect(monthly).toEqual([{ date: '2023-10', total: 5330 }]);
  });

  it('getPartySpend ranks parties by spend', () => {
    const spend = InsightsSelectors.getPartySpend(EXPENSES, PARTIES, {});
    expect(spend).toHaveLength(2);
    expect(spend[0]).toEqual({
      partyId: 'p2', partyName: 'Green Foods', partyType: 'customer',
      total: 4530, transactionCount: 4, lastTransactionDate: '2023-10-07T10:00:00Z'
    });
    expect(spend[1]).toEqual({
      partyId: 'p1', partyName: 'Acme Supplies', partyType: 'supplier',
      total: 800, transactionCount: 2, lastTransactionDate: '2023-10-04T10:00:00Z'
    });
  });

  it('getAnomalies flags the single category spike with exact metrics', () => {
    const anomalies = InsightsSelectors.getAnomalies(EXPENSES, {});
    expect(anomalies).toHaveLength(1);
    expect(anomalies[0].expenseId).toBe('e7');
    expect(anomalies[0].categoryId).toBe('c2');
    expect(anomalies[0].amount).toBe(4000);
    expect(anomalies[0].averageForCategory).toBeCloseTo(1132.5, 5);
    expect(anomalies[0].percentAboveAverage).toBeCloseTo(((4000 - 1132.5) / 1132.5) * 100, 5);
  });

  it('exportSummary composes the full insight payload', () => {
    const summary = InsightsSelectors.exportSummary(EXPENSES, PARTIES, { preset: 'custom', rangeStart: '2023-10-01T00:00:00Z', rangeEnd: '2023-10-31T00:00:00Z' }, PREVIOUS_PERIOD_EXPENSES) as {
      overview: ReturnType<typeof InsightsSelectors.getOverview>;
      categoryBreakdown: unknown[];
      paymentModeMix: unknown[];
      trend: unknown[];
      partySpend: unknown[];
      anomalies: unknown[];
    };
    expect(summary.overview.totalSpend).toBe(5330);
    expect(summary.categoryBreakdown).toHaveLength(3);
    expect(summary.paymentModeMix).toHaveLength(5);
    expect(summary.trend).toHaveLength(1);
    expect(summary.partySpend).toHaveLength(2);
    expect(summary.anomalies).toHaveLength(1);
  });

  it('computePreviousRange mirrors the given range', () => {
    const previous = computePreviousRange({ rangeStart: '2023-10-10T00:00:00Z', rangeEnd: '2023-10-19T23:59:59Z' });
    expect(previous.rangeStart).toBe('2023-09-30T00:00:00.999Z');
    expect(previous.rangeEnd).toBe('2023-10-09T23:59:59.999Z');
  });
});
