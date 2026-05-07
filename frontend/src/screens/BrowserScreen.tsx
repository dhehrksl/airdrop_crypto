import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';

import EmptyState from '../components/EmptyState';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Browser'>;

export default function BrowserScreen({ route, navigation }: Props) {
  const { url } = route.params;
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState
          message="현재 해당 프로젝트 웹사이트에 접근할 수 없습니다"
          onRetry={() => {
            setError(null);
            setLoading(true);
          }}
          retryLabel="뒤로"
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <WebView
        source={{ uri: url }}
        onLoadStart={() => setLoading(true)}
        onLoadEnd={() => setLoading(false)}
        onError={(e) => {
          const status = (e.nativeEvent as any)?.statusCode;
          if (status === 404 || status >= 400) {
            setError('not_found');
          } else {
            setError('error');
          }
        }}
        onHttpError={(e) => {
          const status = e.nativeEvent.statusCode;
          if (status === 404 || status >= 400) setError('not_found');
        }}
        startInLoadingState
        renderLoading={() => (
          <View style={styles.loaderBox}>
            <ActivityIndicator color={colors.accent} />
          </View>
        )}
      />
      {loading ? null : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  loaderBox: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.bg,
  },
});
