export interface InsightsOverviewDTO {
  rangeStart: string; // ISO
  rangeEnd: string; // ISO
  totalSpend: number;
  transactionCount: number;
  avgDailySpend: number;
  topCategory: { id: string; name: string; total: number } | null;
  topParty: { id: string; name: string; total: number } | null;
  cashVsDigital: { cash: number; digital: number };
  deltaVsPreviousPeriod: number; // percentage
  pendingAlertsCount: number;
}

export interface CategoryBreakdownItemDTO {
  categoryId: string;
  categoryName: string;
  total: number;
  count: number;
  percentOfTotal: number;
}

export interface PaymentModeMixDTO {
  mode: 'cash' | 'upi' | 'bank' | 'card' | 'other';
  total: number;
  percentOfTotal: number;
}

export interface TrendPointDTO {
  date: string; // ISO day/week/month bucket
  total: number;
}

export interface PartySpendItemDTO {
  partyId: string;
  partyName: string;
  partyType: 'customer' | 'supplier' | 'both';
  total: number;
  transactionCount: number;
  lastTransactionDate: string;
}

export interface AnomalyItemDTO {
  expenseId: string;
  categoryId: string;
  categoryName: string;
  amount: number;
  averageForCategory: number;
  percentAboveAverage: number;
  date: string;
}

export interface InsightsFilterDTO {
  rangeStart?: string;
  rangeEnd?: string;
  preset?: 'today' | 'week' | 'month' | 'custom';
  categoryId?: string;
  partyId?: string;
  paymentMode?: 'cash' | 'upi' | 'bank' | 'card' | 'other';
}

export interface IInsightsService {
  getOverview(filter: InsightsFilterDTO): Promise<InsightsOverviewDTO>;
  getCategoryBreakdown(filter: InsightsFilterDTO): Promise<CategoryBreakdownItemDTO[]>;
  getPaymentModeMix(filter: InsightsFilterDTO): Promise<PaymentModeMixDTO[]>;
  getTrend(filter: InsightsFilterDTO, bucket: 'day' | 'week' | 'month'): Promise<TrendPointDTO[]>;
  getPartySpend(filter: InsightsFilterDTO): Promise<PartySpendItemDTO[]>;
  getAnomalies(filter: InsightsFilterDTO): Promise<AnomalyItemDTO[]>;
  exportInsightsSummary(filter: InsightsFilterDTO): Promise<object>;
}
