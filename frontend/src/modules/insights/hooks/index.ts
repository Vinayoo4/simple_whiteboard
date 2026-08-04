import { useState, useCallback, useEffect } from 'react';
import { insightsService } from '../services/insightsService';
import { subscribeDataChanged } from '../../../shared/events';
import {
  InsightsOverviewDTO,
  CategoryBreakdownItemDTO,
  PaymentModeMixDTO,
  TrendPointDTO,
  PartySpendItemDTO,
  AnomalyItemDTO,
  InsightsFilterDTO
} from '../api/dto';

type Bucket = 'day' | 'week' | 'month';

export function useInsightsFilter(initial: InsightsFilterDTO = {}) {
  const [filter, setFilter] = useState<InsightsFilterDTO>(() => {
    return applyPreset(initial);
  });

  const updateFilter = useCallback((update: Partial<InsightsFilterDTO>) => {
    setFilter(prev => {
      const next = { ...prev, ...update };
      if (update.preset && update.preset !== 'custom') {
         return applyPreset(next);
      }
      return next;
    });
  }, []);

  return { filter, updateFilter, setFilter };
}

function applyPreset(filter: InsightsFilterDTO): InsightsFilterDTO {
  const now = new Date();

  if (filter.preset === 'today') {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0);
    const end = new Date(now);
    end.setHours(23, 59, 59, 999);
    return { ...filter, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }

  if (filter.preset === 'week') {
    const start = new Date(now);
    const day = start.getDay();
    const diff = start.getDate() - day + (day === 0 ? -6 : 1);
    start.setDate(diff);
    start.setHours(0, 0, 0, 0);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    return { ...filter, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }

  if (filter.preset === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth(), 1);
    const end = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    return { ...filter, rangeStart: start.toISOString(), rangeEnd: end.toISOString() };
  }

  return filter;
}

interface AsyncState<T> {
  data: T;
  loading: boolean;
  error: Error | null;
  refetch: () => void;
}

function useAsync<T>(fetcher: () => Promise<T>, initial: T, deps: unknown[]): AsyncState<T> {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [refetchIndex, setRefetchIndex] = useState(0);

  const refetch = useCallback(() => setRefetchIndex(i => i + 1), []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError(null);
    fetcher()
      .then(res => { if (active) setData(res); })
      .catch(err => { if (active) setError(err as Error); })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, refetchIndex]);

  useEffect(() => {
    const onDataChanged = () => setRefetchIndex(i => i + 1);
    const onFocus = () => setRefetchIndex(i => i + 1);
    const unsubscribe = subscribeDataChanged(onDataChanged);
    window.addEventListener('focus', onFocus);
    return () => {
      unsubscribe();
      window.removeEventListener('focus', onFocus);
    };
  }, []);

  return { data, loading, error, refetch };
}

export function useInsightsOverview(filter: InsightsFilterDTO) {
  return useAsync(() => insightsService.getOverview(filter), null as InsightsOverviewDTO | null, [filter]);
}

export function useCategoryBreakdown(filter: InsightsFilterDTO) {
  return useAsync(() => insightsService.getCategoryBreakdown(filter), [] as CategoryBreakdownItemDTO[], [filter]);
}

export function usePaymentModeMix(filter: InsightsFilterDTO) {
  return useAsync(() => insightsService.getPaymentModeMix(filter), [] as PaymentModeMixDTO[], [filter]);
}

export function useInsightsTrend(filter: InsightsFilterDTO, bucket: Bucket = 'day') {
  return useAsync(() => insightsService.getTrend(filter, bucket), [] as TrendPointDTO[], [filter, bucket]);
}

export function usePartySpend(filter: InsightsFilterDTO) {
  return useAsync(() => insightsService.getPartySpend(filter), [] as PartySpendItemDTO[], [filter]);
}

export function useAnomalies(filter: InsightsFilterDTO) {
  return useAsync(() => insightsService.getAnomalies(filter), [] as AnomalyItemDTO[], [filter]);
}

export function useInsightsExport() {
  const [exporting, setExporting] = useState(false);

  const exportData = useCallback(async (filter: InsightsFilterDTO) => {
    setExporting(true);
    try {
      const data = await insightsService.exportInsightsSummary(filter);
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `insights-export-${new Date().toISOString()}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportData, exporting };
}
