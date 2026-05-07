import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import TrustBadge from './TrustBadge';
import BookmarkButton from './BookmarkButton';
import { colors } from '../theme/colors';
import { formatRelativeDeadline } from '../utils/format';
import type { Airdrop } from '../api/airdrops';

type Props = {
  item: Airdrop;
  onPress: () => void;
  bookmarked?: boolean;
  onToggleBookmark?: () => void;
};

export default function AirdropCard({ item, onPress, bookmarked, onToggleBookmark }: Props) {
  const deadline = formatRelativeDeadline(item.end_date);
  const urgent = item.end_date && new Date(item.end_date).getTime() - Date.now() < 2 * 24 * 60 * 60 * 1000;

  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && styles.pressed]}
      onPress={onPress}
      android_ripple={{ color: colors.accentSoft }}
    >
      <View style={styles.row}>
        <View style={styles.leftRow}>
          <TrustBadge score={item.trust_score} />
          {item.category ? (
            <View style={styles.catChip}>
              <Text style={styles.catText}>{item.category}</Text>
            </View>
          ) : null}
        </View>
        <View style={styles.rightRow}>
          <Text style={[styles.deadline, urgent && styles.urgent]}>{deadline}</Text>
          {onToggleBookmark ? (
            <BookmarkButton active={!!bookmarked} onPress={onToggleBookmark} />
          ) : null}
        </View>
      </View>
      <Text style={styles.title} numberOfLines={2}>
        {item.title}
      </Text>
      {item.reward ? <Text style={styles.reward}>보상 · {item.reward}</Text> : null}
      <Text style={styles.source} numberOfLines={1}>
        {item.sources?.[0] || '출처 미상'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
  },
  pressed: { opacity: 0.85 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  leftRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  rightRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.accentSoft,
    marginLeft: 6,
  },
  catText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  deadline: { color: colors.textMuted, fontSize: 12, fontWeight: '600' },
  urgent: { color: colors.danger },
  title: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 6 },
  reward: { color: colors.accent, fontSize: 13, marginBottom: 4 },
  source: { color: colors.textMuted, fontSize: 11 },
});
