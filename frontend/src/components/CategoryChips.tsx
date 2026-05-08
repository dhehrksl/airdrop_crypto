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
  row: { paddingBottom: 8 }, // ScrollView 자체의 수평 패딩 제거
  chip: {
    minWidth: 65, // 칩의 최소 너비를 더 줄여 전체적인 크기 감소
    paddingHorizontal: 12, // 텍스트 좌우 여백 조정
    paddingVertical: 6,
    borderRadius: 14,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    marginHorizontal: 4, // 칩 간의 간격 및 화면 가장자리 간격 조절
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  label: { color: colors.textMuted, fontSize: 13, fontWeight: '700', textAlign: 'center' }, // 활성/비활성 동일한 fontWeight로 설정
  labelActive: { color: colors.accent, fontWeight: '700' }, // 활성/비활성 동일한 fontWeight로 설정
});
