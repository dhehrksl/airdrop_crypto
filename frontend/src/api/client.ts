import axios from 'axios';
import Constants from 'expo-constants';

const fallback = 'http://10.0.2.2:4000';
const baseURL =
  (Constants.expoConfig?.extra as any)?.API_BASE_URL ||
  (Constants.manifest as any)?.extra?.API_BASE_URL ||
  fallback;

export const api = axios.create({
  baseURL,
  timeout: 10_000,
});

export class TimeoutError extends Error {
  constructor(message = '요청 타임아웃') {
    super(message);
    this.name = 'TimeoutError';
  }
}

export function isTimeoutError(err: unknown): boolean {
  const e = err as any;
  return e?.code === 'ECONNABORTED' || e?.name === 'TimeoutError' || /timeout/i.test(e?.message || '');
}
