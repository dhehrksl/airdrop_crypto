import React from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { colors } from '../theme/colors';

type Props = {
  active: boolean;
  onPress: () => void;
};

export default function BookmarkButton({ active, onPress }: Props) {
  return (
    <Pressable onPress={onPress} hitSlop={10} style={styles.btn}>
      <Text style={[styles.icon, active && styles.iconActive]}>{active ? '★' : '☆'}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  btn: { padding: 4 },
  icon: { fontSize: 22, color: colors.textMuted },
  iconActive: { color: colors.warning },
});
