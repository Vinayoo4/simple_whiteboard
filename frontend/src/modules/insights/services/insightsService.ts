import { IInsightsService, InsightsFilterDTO, InsightsOverviewDTO, CategoryBreakdownItemDTO, PaymentModeMixDTO, TrendPointDTO, PartySpendItemDTO, AnomalyItemDTO } from '../api/dto';
import { IExpenseService, expenseService } from '../../expenses/services/expenseService';
import { IPartyService, partyService } from '../../parties/services/partyService';
import { InsightsSelectors, computePreviousRange } from './insightsSelectors';

export class LocalInsightsService implements IInsightsService {
  constructor(private readonly expenses: IExpenseService, private readonly parties: IPartyService) {}

  async getOverview(filter: InsightsFilterDTO): Promise<InsightsOverviewDTO> {
    const [expenses, allParties, anomalies] = await Promise.all([
      this.expenses.getExpenses({ status: 'all' }),
      this.parties.getParties(),
      this.getAnomalies(filter)
    ]);
    const previousRange = computePreviousRange(filter);
    const previousPeriodExpenses = previousRange.rangeStart && previousRange.rangeEnd
      ? await this.expenses.getExpenses({ startDate: previousRange.rangeStart, endDate: previousRange.rangeEnd, status: 'all' })
      : [];
    return InsightsSelectors.getOverview(expenses, filter, { parties: allParties, previousPeriodExpenses, anomalies });
  }

  async getCategoryBreakdown(filter: InsightsFilterDTO): Promise<CategoryBreakdownItemDTO[]> {
    const expenses = await this.expenses.getExpenses({ status: 'all' });
    return InsightsSelectors.getCategoryBreakdown(expenses, filter);
  }

  async getPaymentModeMix(filter: InsightsFilterDTO): Promise<PaymentModeMixDTO[]> {
    const expenses = await this.expenses.getExpenses({ status: 'all' });
    return InsightsSelectors.getPaymentModeMix(expenses, filter);
  }

  async getTrend(filter: InsightsFilterDTO, bucket: 'day' | 'week' | 'month'): Promise<TrendPointDTO[]> {
    const expenses = await this.expenses.getExpenses({ status: 'all' });
    return InsightsSelectors.getTrend(expenses, filter, bucket);
  }

  async getPartySpend(filter: InsightsFilterDTO): Promise<PartySpendItemDTO[]> {
    const [expenses, parties] = await Promise.all([
      this.expenses.getExpenses({ status: 'all' }),
      this.parties.getParties()
    ]);
    return InsightsSelectors.getPartySpend(expenses, parties, filter);
  }

  async getAnomalies(filter: InsightsFilterDTO): Promise<AnomalyItemDTO[]> {
    const expenses = await this.expenses.getExpenses({ status: 'all' });
    return InsightsSelectors.getAnomalies(expenses, filter);
  }

  async exportInsightsSummary(filter: InsightsFilterDTO): Promise<object> {
    const [expenses, parties] = await Promise.all([
      this.expenses.getExpenses({ status: 'all' }),
      this.parties.getParties()
    ]);
    const previousRange = computePreviousRange(filter);
    const previousPeriodExpenses = previousRange.rangeStart && previousRange.rangeEnd
      ? await this.expenses.getExpenses({ startDate: previousRange.rangeStart, endDate: previousRange.rangeEnd, status: 'all' })
      : [];
    return InsightsSelectors.exportSummary(expenses, parties, filter, previousPeriodExpenses);
  }
}

export const insightsService = new LocalInsightsService(expenseService, partyService);
