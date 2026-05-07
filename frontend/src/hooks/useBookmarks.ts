import { useCallback, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'bookmarks:v1';

export function useBookmarks() {
  const [ids, setIds] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setIds(JSON.parse(raw));
        } catch {}
      }
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: string[]) => {
    setIds(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const toggle = useCallback(
    async (id: string) => {
      const next = ids.includes(id) ? ids.filter((x) => x !== id) : [id, ...ids];
      await persist(next);
    },
    [ids, persist]
  );

  const has = useCallback((id: string) => ids.includes(id), [ids]);

  return { ids, has, toggle, ready };
}
