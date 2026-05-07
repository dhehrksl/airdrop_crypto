import { useCallback, useEffect, useRef, useState } from 'react';
import { fetchAirdrops, type Airdrop, type SortKey } from '../api/airdrops';
import { getCache, setCache } from '../utils/cache';
import { isTimeoutError } from '../api/client';

const HARD_TIMEOUT_MS = 10_000;

type State = {
  items: Airdrop[];
  loading: boolean;
  refreshing: boolean;
  error: string | null;
  hasMore: boolean;
  fromCache: boolean;
};

export function useAirdrops(sort: SortKey, category: string = 'all', q: string = '') {
  const [state, setState] = useState<State>({
    items: [],
    loading: true,
    refreshing: false,
    error: null,
    hasMore: true,
    fromCache: false,
  });
  const pageRef = useRef(1);
  const inflight = useRef(false);

  const cacheKey = `feed:${sort}:${category}:${q}:1`;

  const withHardTimeout = <T,>(p: Promise<T>) =>
    new Promise<T>((resolve, reject) => {
      const t = setTimeout(() => reject(new Error('정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요')), HARD_TIMEOUT_MS);
      p.then(
        (v) => {
          clearTimeout(t);
          resolve(v);
        },
        (e) => {
          clearTimeout(t);
          reject(e);
        }
      );
    });

  const loadFirst = useCallback(
    async (refresh = false) => {
      if (inflight.current) return;
      inflight.current = true;
      setState((s) => ({ ...s, loading: !refresh, refreshing: refresh, error: null }));
      try {
        const data = await withHardTimeout(fetchAirdrops({ page: 1, sort, category, q }));
        pageRef.current = 1;
        setState({
          items: data.items,
          loading: false,
          refreshing: false,
          error: null,
          hasMore: data.hasMore,
          fromCache: false,
        });
        setCache(cacheKey, data.items);
      } catch (err: any) {
        const cached = await getCache<Airdrop[]>(cacheKey);
        const message = isTimeoutError(err)
          ? '정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요'
          : err?.message || '네트워크 오류가 발생했습니다.';
        setState({
          items: cached || [],
          loading: false,
          refreshing: false,
          error: message,
          hasMore: false,
          fromCache: !!cached,
        });
      } finally {
        inflight.current = false;
      }
    },
    [sort, category, q]
  );

  const loadMore = useCallback(async () => {
    if (inflight.current || !state.hasMore || state.loading) return;
    inflight.current = true;
    try {
      const nextPage = pageRef.current + 1;
      const data = await withHardTimeout(fetchAirdrops({ page: nextPage, sort, category, q }));
      pageRef.current = nextPage;
      setState((s) => ({
        ...s,
        items: [...s.items, ...data.items],
        hasMore: data.hasMore,
      }));
    } catch {
      // 추가 페이지 실패는 silent (기존 데이터 유지)
    } finally {
      inflight.current = false;
    }
  }, [sort, category, q, state.hasMore, state.loading]);

  useEffect(() => {
    loadFirst(false);
  }, [loadFirst]);

  return {
    ...state,
    refresh: () => loadFirst(true),
    retry: () => loadFirst(false),
    loadMore,
  };
}
