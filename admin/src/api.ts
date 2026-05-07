import axios from 'axios';

const baseURL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:4000';

export type Stats = {
  summary: { total: number; active: number; push_subscribers: number };
  trust_buckets: { _id: number | string; count: number }[];
  by_category: { _id: string; count: number; avgScore: number }[];
  last7: { _id: string; count: number; avgScore: number }[];
  notifications: { _id: string; count: number; totalSent: number }[];
  recent: {
    _id: string;
    title: string;
    trust_score: number;
    category: string;
    created_at: string;
  }[];
};

export function makeClient(token: string) {
  return axios.create({
    baseURL,
    headers: { Authorization: `Bearer ${token}` },
    timeout: 10_000,
  });
}

export async function fetchStats(token: string): Promise<Stats> {
  const c = makeClient(token);
  const res = await c.get<Stats>('/api/admin/stats');
  return res.data;
}
