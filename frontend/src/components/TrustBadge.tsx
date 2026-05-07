import React from 'react';
import { Text, View, StyleSheet } from 'react-native';
import { colors } from '../theme/colors';

export default function TrustBadge({ score }: { score: number }) {
  const color = score >= 90 ? colors.scoreHigh : score >= 80 ? colors.scoreMid : colors.scoreLow;
  return (
    <View style={[styles.box, { borderColor: color }]}>
      <Text style={[styles.text, { color }]}>신뢰도 {score}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    alignSelf: 'flex-start',
  },
  text: {
    fontSize: 12,
    fontWeight: '700',
  },
});
