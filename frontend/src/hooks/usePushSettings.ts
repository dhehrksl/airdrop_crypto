import { useCallback, useEffect, useState } from 'react';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { registerPushToken, unregisterPushToken } from '../api/push';

const KEY = 'push_settings:v1';

export type PushSettings = {
  enabled: boolean;
  min_trust_score: number;
  notify_deadline: boolean;
  categories: string[];
};

const DEFAULT: PushSettings = {
  enabled: false,
  min_trust_score: 95,
  notify_deadline: true,
  categories: [],
};

export function usePushSettings() {
  const [settings, setSettings] = useState<PushSettings>(DEFAULT);
  const [token, setToken] = useState<string | null>(null);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    AsyncStorage.getItem(KEY).then((raw) => {
      if (raw) {
        try {
          setSettings({ ...DEFAULT, ...JSON.parse(raw) });
        } catch {}
      }
      setReady(true);
    });
  }, []);

  const persist = useCallback(async (next: PushSettings) => {
    setSettings(next);
    await AsyncStorage.setItem(KEY, JSON.stringify(next));
  }, []);

  const ensureToken = useCallback(async (): Promise<string | null> => {
    if (!Device.isDevice) return null;
    const perm = await Notifications.getPermissionsAsync();
    let granted = perm.status === 'granted';
    if (!granted) {
      const req = await Notifications.requestPermissionsAsync();
      granted = req.status === 'granted';
    }
    if (!granted) return null;
    const projectId = (Constants.expoConfig?.extra as any)?.EAS_PROJECT_ID || undefined;
    const result = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    setToken(result.data);
    return result.data;
  }, []);

  const enable = useCallback(
    async (next?: Partial<PushSettings>) => {
      setBusy(true);
      try {
        const t = await ensureToken();
        if (!t) {
          await persist({ ...settings, enabled: false });
          return false;
        }
        const merged: PushSettings = { ...settings, ...next, enabled: true };
        await registerPushToken({
          token: t,
          platform: (Platform.OS as any) || 'android',
          min_trust_score: merged.min_trust_score,
          notify_deadline: merged.notify_deadline,
          categories: merged.categories,
        });
        await persist(merged);
        return true;
      } finally {
        setBusy(false);
      }
    },
    [ensureToken, persist, settings]
  );

  const disable = useCallback(async () => {
    setBusy(true);
    try {
      if (token) await unregisterPushToken(token);
      await persist({ ...settings, enabled: false });
    } finally {
      setBusy(false);
    }
  }, [token, persist, settings]);

  const update = useCallback(
    async (next: Partial<PushSettings>) => {
      const merged = { ...settings, ...next };
      if (merged.enabled) await enable(next);
      else await persist(merged);
    },
    [settings, enable, persist]
  );

  return { settings, ready, busy, enable, disable, update };
}
