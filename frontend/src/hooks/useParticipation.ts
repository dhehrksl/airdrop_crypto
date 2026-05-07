import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'participation:v1';

type Map = Record<string, { at: string }>;

export function useParticipation() {
  const [data, setData] = useState<Map>({});
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setData(JSON.parse(raw));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: Map) => {
    setData(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const mark = useCallback(
    async (id: string) => {
      if (data[id]) return;
      await persist({ ...data, [id]: { at: new Date().toISOString() } });
    },
    [data, persist]
  );

  const unmark = useCallback(
    async (id: string) => {
      const { [id]: _gone, ...rest } = data;
      await persist(rest);
    },
    [data, persist]
  );

  const has = useCallback((id: string) => !!data[id], [data]);

  return { data, has, mark, unmark, ready, ids: Object.keys(data) };
}
