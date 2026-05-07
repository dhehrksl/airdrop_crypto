import React from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { usePushSettings } from '../hooks/usePushSettings';
import { CATEGORIES } from '../components/CategoryChips';
import { colors } from '../theme/colors';

const THRESHOLDS = [80, 90, 95];

export default function SettingsScreen() {
  const { settings, ready, busy, enable, disable, update } = usePushSettings();

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  const toggleCategory = (cat: string) => {
    const set = new Set(settings.categories);
    if (set.has(cat)) set.delete(cat);
    else set.add(cat);
    update({ categories: Array.from(set) });
  };

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Section title="푸시 알림">
          <Row
            label="알림 받기"
            right={
              <Switch
                value={settings.enabled}
                onValueChange={(v) => (v ? enable() : disable())}
                disabled={busy}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            }
          />
          <Row
            label="마감 임박 (D-1)"
            right={
              <Switch
                value={settings.notify_deadline}
                onValueChange={(v) => update({ notify_deadline: v })}
                disabled={!settings.enabled || busy}
                trackColor={{ true: colors.accent, false: colors.border }}
              />
            }
          />
        </Section>

        <Section title="신뢰도 임계치 (이상만 알림)">
          <View style={styles.row}>
            {THRESHOLDS.map((t) => (
              <Pressable
                key={t}
                onPress={() => update({ min_trust_score: t })}
                style={[styles.optionBtn, settings.min_trust_score === t && styles.optionBtnActive]}
                disabled={!settings.enabled || busy}
              >
                <Text style={[styles.optionText, settings.min_trust_score === t && styles.optionTextActive]}>
                  {t}점 이상
                </Text>
              </Pressable>
            ))}
          </View>
        </Section>

        <Section title="관심 카테고리 (비우면 전체)">
          <View style={[styles.row, { flexWrap: 'wrap', gap: 6 }]}>
            {CATEGORIES.filter((c) => c !== 'all').map((c) => {
              const active = settings.categories.includes(c);
              return (
                <Pressable
                  key={c}
                  onPress={() => toggleCategory(c)}
                  style={[styles.optionBtn, active && styles.optionBtnActive]}
                  disabled={!settings.enabled || busy}
                >
                  <Text style={[styles.optionText, active && styles.optionTextActive]}>{c}</Text>
                </Pressable>
              );
            })}
          </View>
        </Section>

        <Text style={styles.footnote}>
          ※ Expo Go에서는 일부 푸시 기능이 제한될 수 있습니다. 실 배포는 EAS Build 권장.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>{title}</Text>
      <View style={styles.card}>{children}</View>
    </View>
  );
}

function Row({ label, right }: { label: string; right: React.ReactNode }) {
  return (
    <View style={styles.rowItem}>
      <Text style={styles.rowLabel}>{label}</Text>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: 16 },
  section: { marginBottom: 20 },
  sectionTitle: { color: colors.textMuted, fontSize: 12, marginBottom: 8, marginLeft: 4, fontWeight: '700' },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: 12,
  },
  rowItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.border,
  },
  rowLabel: { color: colors.text, fontSize: 14 },
  row: { flexDirection: 'row', padding: 12, gap: 6 },
  optionBtn: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: colors.surfaceAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  optionBtnActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  optionText: { color: colors.textMuted, fontSize: 13 },
  optionTextActive: { color: colors.accent, fontWeight: '700' },
  footnote: { color: colors.textMuted, fontSize: 11, marginTop: 8, textAlign: 'center' },
});
