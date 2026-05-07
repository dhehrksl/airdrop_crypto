import React from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

export const CATEGORIES = ['all', 'L2', 'DeFi', 'NFT', 'Bounty', 'Testnet', 'Meme', 'Other'] as const;
export type CategoryKey = (typeof CATEGORIES)[number];

const LABELS: Record<CategoryKey, string> = {
  all: '전체',
  L2: 'L2',
  DeFi: 'DeFi',
  NFT: 'NFT',
  Bounty: 'Bounty',
  Testnet: 'Testnet',
  Meme: 'Meme',
  Other: '기타',
};

type Props = {
  value: CategoryKey;
  onChange: (next: CategoryKey) => void;
};

export default function CategoryChips({ value, onChange }: Props) {
  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.row}
    >
      {CATEGORIES.map((c) => {
        const active = value === c;
        return (
          <Pressable
            key={c}
            onPress={() => onChange(c)}
            style={[styles.chip, active && styles.chipActive]}
            android_ripple={{ color: colors.accentSoft }}
          >
            <Text style={[styles.label, active && styles.labelActive]}>{LABELS[c]}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: 16, paddingBottom: 8 },
  chip: {
    minWidth: 64,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginRight: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '600', textAlign: 'center' },
  labelActive: { color: colors.accent, fontWeight: '700' },
});
