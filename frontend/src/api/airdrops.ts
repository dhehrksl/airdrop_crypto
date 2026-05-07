import { api } from './client';

export type Airdrop = {
  _id: string;
  title: string;
  description: string;
  official_link: string;
  end_date: string | null;
  trust_score: number;
  reward: string;
  category: string;
  tags: string[];
  sources: string[];
  created_at: string;
};

export type FeedResponse = {
  items: Airdrop[];
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
};

export type SortKey = 'latest' | 'deadline';

export async function fetchAirdrops(params: {
  page: number;
  sort: SortKey;
  limit?: number;
  category?: string;
  q?: string;
}): Promise<FeedResponse> {
  const res = await api.get<FeedResponse>('/api/airdrops', {
    params: {
      page: params.page,
      sort: params.sort,
      limit: params.limit || 20,
      category: params.category && params.category !== 'all' ? params.category : undefined,
      q: params.q || undefined,
    },
  });
  return res.data;
}

export async function fetchAirdropById(id: string): Promise<Airdrop> {
  const res = await api.get<Airdrop>(`/api/airdrops/${id}`);
  return res.data;
}

export async function fetchAirdropsByIds(ids: string[]): Promise<Airdrop[]> {
  if (ids.length === 0) return [];
  const res = await api.post<{ items: Airdrop[] }>('/api/airdrops/by-ids', { ids });
  return res.data.items;
}
