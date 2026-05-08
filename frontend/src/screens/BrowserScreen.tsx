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
        onLoadEnd={(syntheticEvent) => {
          const { nativeEvent } = syntheticEvent;
          console.log('WebView onLoadEnd:', nativeEvent.url, 'loading:', nativeEvent.loading, 'canGoBack:', nativeEvent.canGoBack, 'title:', nativeEvent.title);
          setLoading(false); // 로딩 완료 시 로딩 인디케이터 숨김
        }}
        onError={(e) => {
          const status = (e.nativeEvent as any)?.statusCode;
          console.error('WebView onError:', e.nativeEvent.url, 'code:', e.nativeEvent.code, 'description:', e.nativeEvent.description, 'status:', status);
          // 어떤 종류의 로딩 실패든 에러 상태로 설정하여 EmptyState를 표시
          setError('error');
          setLoading(false); // 에러 발생 시 로딩 인디케이터 숨김
        }}
        onHttpError={(e) => {
          const { nativeEvent } = e;
          console.error('WebView onHttpError:', nativeEvent.url, 'statusCode:', nativeEvent.statusCode, 'description:', nativeEvent.description);
          // HTTP 에러 발생 시 에러 상태로 설정하여 EmptyState를 표시
          setError('error');
          setLoading(false); // HTTP 에러 발생 시 로딩 인디케이터 숨김
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
