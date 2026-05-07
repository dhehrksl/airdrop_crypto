import { api } from './client';

export async function askAI(airdropId: string, question: string): Promise<string> {
  const res = await api.post<{ answer: string }>('/api/ai/ask', { airdropId, question });
  return res.data.answer;
}
