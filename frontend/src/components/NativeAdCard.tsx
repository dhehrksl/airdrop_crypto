import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// 실제 운영시 react-native-google-mobile-ads의 NativeAd 컴포넌트로 교체.
// 여기서는 UI와 자연스럽게 어울리는 placeholder를 제공한다.
export default function NativeAdCard() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <Text style={styles.tag}>AD</Text>
        <Text style={styles.label}>광고</Text>
      </View>
      <Text style={styles.title}>스폰서드 콘텐츠</Text>
      <Text style={styles.body}>광고 슬롯 (네이티브) — 운영시 AdMob NativeAd로 교체됩니다.</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 14,
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: colors.border,
    borderStyle: 'dashed',
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  tag: {
    backgroundColor: colors.warning,
    color: '#1a1a1a',
    fontSize: 10,
    fontWeight: '800',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    marginRight: 8,
  },
  label: { color: colors.textMuted, fontSize: 11 },
  title: { color: colors.text, fontSize: 15, fontWeight: '700', marginBottom: 4 },
  body: { color: colors.textMuted, fontSize: 13 },
});
