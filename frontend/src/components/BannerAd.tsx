import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../theme/colors';

// 운영시 react-native-google-mobile-ads의 <BannerAd /> 로 교체.
export default function BannerAd() {
  return (
    <View style={styles.banner}>
      <Text style={styles.text}>AdMob 배너 영역 (50dp)</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  banner: {
    height: 50,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { color: colors.textMuted, fontSize: 11 },
});
