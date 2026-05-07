import { api } from './client';

export type PushSettings = {
  token: string;
  platform?: 'ios' | 'android' | 'web';
  min_trust_score?: number;
  notify_deadline?: boolean;
  categories?: string[];
};

export async function registerPushToken(s: PushSettings) {
  await api.post('/api/push/register', s);
}

export async function unregisterPushToken(token: string) {
  await api.post('/api/push/unregister', { token });
}
