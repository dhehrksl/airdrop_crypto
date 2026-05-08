import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Linking,
  Platform,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import TrustBadge from '../components/TrustBadge';
import BannerAd from '../components/BannerAd';
import EmptyState from '../components/EmptyState';
import Toast from '../components/Toast';
import BookmarkButton from '../components/BookmarkButton';
import AskAI from '../components/AskAI';
import { fetchAirdropById, type Airdrop } from '../api/airdrops';
import { isTimeoutError } from '../api/client';
import { useBookmarks } from '../hooks/useBookmarks';
import { useParticipation } from '../hooks/useParticipation';
import { colors } from '../theme/colors';
import { formatDate, formatRelativeDeadline } from '../utils/format';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'Detail'>;

const HARD_TIMEOUT_MS = 10_000;
const REWARDED_THRESHOLD = 95;

export default function DetailScreen({ route, navigation }: Props) {
  const { id } = route.params;
  const [item, setItem] = useState<Airdrop | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [unlocked, setUnlocked] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bookmarks = useBookmarks();
  const participation = useParticipation();

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await new Promise<Airdrop>((resolve, reject) => {
        const t = setTimeout(() => reject(new Error('정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요')), HARD_TIMEOUT_MS);
        fetchAirdropById(id).then(
          (v) => {
            clearTimeout(t);
            resolve(v);
          },
          (e) => {
            clearTimeout(t);
            reject(e);
          }
        );
      });
      setItem(data);
    } catch (err: any) {
      setError(
        isTimeoutError(err)
          ? '정보를 불러오는 중 문제가 발생했습니다. 다시 시도해 주세요'
          : err?.message || '네트워크 오류'
      );
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    load();
  }, [load]);

  const handleShare = useCallback(async () => {
    if (!item) return;
    try {
      await Share.share({
        message: `[${item.category}] ${item.title}\n신뢰도 ${item.trust_score}점\n${item.official_link}`,
      });
    } catch {}
  }, [item]);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerRight: () =>
        item ? (
          <View style={styles.headerRight}>
            <BookmarkButton active={bookmarks.has(item._id)} onPress={() => bookmarks.toggle(item._id)} />
            <Pressable onPress={handleShare} hitSlop={10} style={{ marginLeft: 12 }}>
              <Text style={styles.shareIcon}>↗</Text>
            </Pressable>
          </View>
        ) : null,
    });
  }, [navigation, item, bookmarks, handleShare]);

  const handleParticipate = async () => {
    if (!item) return;
    const url = item.official_link;
    console.log('Attempting to participate. URL:', url); // Debug log: 시도하는 URL 출력
    if (!url) {
      console.log('Official link is empty or null.'); // Debug log: URL이 비어있거나 null인 경우
      setToast('현재 해당 프로젝트 웹사이트에 접근할 수 없습니다');
      return;
    }
    if (Platform.OS === 'web') {
      participation.mark(item._id);
      window.open(url, '_blank', 'noopener,noreferrer');
      console.log('Opened URL in new tab (web platform).'); // Debug log: 웹 플랫폼에서 새 탭으로 열림
      return;
    }
    try {
      const supported = await Linking.canOpenURL(url);
      console.log('Linking.canOpenURL result:', supported); // Debug log: Linking.canOpenURL 결과 출력
      if (!supported) {
        setToast('현재 해당 프로젝트 웹사이트에 접근할 수 없습니다');
        console.log('Linking.canOpenURL returned false.'); // Debug log: Linking.canOpenURL이 false를 반환한 경우
        return;
      }
      participation.mark(item._id); // 참여 완료 마킹
      navigation.navigate('Browser', { url, title: item.title }); // 인앱 브라우저로 이동
    } catch {
      setToast('현재 해당 프로젝트 웹사이트에 접근할 수 없습니다');
      console.log('Error caught during Linking.canOpenURL.'); // Debug log: Linking.canOpenURL 중 에러 발생
    }
  };

  const handleUnlock = () => {
    Alert.alert(
      '보상형 광고',
      '15초 광고 시청 후 초고수익 정보가 잠금 해제됩니다.',
      [
        { text: '취소', style: 'cancel' },
        {
          text: '시청하기',
          onPress: () => {
            setTimeout(() => {
              setUnlocked(true);
              setToast('잠금이 해제되었습니다');
            }, 800);
          },
        },
      ],
      { cancelable: true }
    );
  };

  if (loading) {
    return ( // SafeAreaView의 edges를 top, bottom 모두 적용하여 하단 배너 겹침 문제 해결
      <SafeAreaView style={styles.center}>
        <ActivityIndicator color={colors.accent} />
      </SafeAreaView>
    );
  }

  if (error || !item) {
    return (
      <SafeAreaView style={styles.safe}>
        <EmptyState message={error || '데이터를 찾을 수 없습니다.'} onRetry={load} />
      </SafeAreaView>
    );
  }

  const requiresUnlock = item.trust_score >= REWARDED_THRESHOLD && !unlocked;
  const done = participation.has(item._id);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <View style={styles.headerRow}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <TrustBadge score={item.trust_score} />
            <View style={styles.catChip}>
              <Text style={styles.catText}>{item.category}</Text>
            </View>
          </View>
          <Text style={styles.deadline}>{formatRelativeDeadline(item.end_date)}</Text>
        </View>

        <Text style={styles.title}>{item.title}</Text>

        {done ? (
          <View style={styles.doneBadge}>
            <Text style={styles.doneBadgeText}>✓ 참여 완료</Text>
            <Pressable onPress={() => participation.unmark(item._id)} hitSlop={6}>
              <Text style={styles.doneUndo}>해제</Text>
            </Pressable>
          </View>
        ) : null}

        <View style={styles.metaBox}>
          <MetaRow label="보상" value={item.reward || '미상'} />
          <MetaRow label="마감일" value={formatDate(item.end_date)} />
          <MetaRow label="출처" value={item.sources?.join(', ') || '미상'} />
          {item.tags?.length ? <MetaRow label="태그" value={item.tags.join(', ')} /> : null}
        </View>

        {item.trust_score < 80 && item.scam_reasons?.length > 0 ? ( // 신뢰도 80점 미만일 때 스캠 의심 사유 표시
          <View style={styles.scamWarningBox}>
            <Text style={styles.scamWarningTitle}>⚠️ 스캠 의심 사유</Text>
            {item.scam_reasons.map((reason, i) => <Text key={i} style={styles.scamWarningText}>- {reason}</Text>)}
          </View>
        ) : null}

        <Text style={styles.sectionTitle}>참여 방법</Text>
        {requiresUnlock ? (
          <View style={styles.locked}>
            <Text style={styles.lockedTitle}>초고수익 예상 정보</Text>
            <Text style={styles.lockedDesc}>
              신뢰도 {item.trust_score}점 — 15초 광고 시청 후 잠금 해제
            </Text>
            <Pressable style={styles.unlockBtn} onPress={handleUnlock} android_ripple={{ color: '#fff2' }}>
              <Text style={styles.unlockBtnText}>광고 시청하고 보기</Text>
            </Pressable>
          </View>
        ) : (
          <Text style={styles.body}>{item.description}</Text>
        )}

        <AskAI airdropId={item._id} />
      </ScrollView>

      <View style={styles.ctaWrap}>
        <Pressable style={styles.cta} onPress={handleParticipate} android_ripple={{ color: '#fff3' }}>
          <Text style={styles.ctaText}>{done ? '다시 참여' : '참여하기'}</Text>
        </Pressable>
      </View>

      <BannerAd />
      <Toast message={toast} onHide={() => setToast(null)} />
    </SafeAreaView>
  );
}

function MetaRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.metaRow}>
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={styles.metaValue} numberOfLines={2}>
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: colors.bg },
  scroll: { padding: 20, paddingBottom: 40 },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  headerRight: { flexDirection: 'row', alignItems: 'center', paddingRight: 12 },
  shareIcon: { color: colors.accent, fontSize: 22, fontWeight: '700' },
  deadline: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  catChip: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: colors.accentSoft,
    marginLeft: 6,
  },
  catText: { color: colors.accent, fontSize: 11, fontWeight: '700' },
  title: { color: colors.text, fontSize: 22, fontWeight: '800', marginBottom: 12, lineHeight: 30 },
  doneBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.accentSoft,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginBottom: 12,
  },
  doneBadgeText: { color: colors.success, fontWeight: '700' },
  doneUndo: { color: colors.textMuted, fontSize: 12 },
  metaBox: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    marginBottom: 24,
  },
  metaRow: { flexDirection: 'row', paddingVertical: 6 },
  metaLabel: { width: 64, color: colors.textMuted, fontSize: 13 },
  metaValue: { flex: 1, color: colors.text, fontSize: 14 },
  sectionTitle: { color: colors.text, fontSize: 16, fontWeight: '700', marginBottom: 8 },
  body: { color: colors.text, fontSize: 15, lineHeight: 24 },
  locked: {
    backgroundColor: colors.surfaceAlt,
    borderRadius: 12,
    padding: 20,
    borderWidth: 1,
    borderColor: colors.warning,
    alignItems: 'center',
  },
  lockedTitle: { color: colors.warning, fontWeight: '800', fontSize: 16, marginBottom: 6 },
  lockedDesc: { color: colors.textMuted, fontSize: 13, textAlign: 'center', marginBottom: 12 },
  unlockBtn: {
    backgroundColor: colors.warning,
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 8,
  },
  unlockBtnText: { color: '#1a1a1a', fontWeight: '800' },
  ctaWrap: { padding: 16, borderTopWidth: 1, borderTopColor: colors.border, backgroundColor: colors.bg },
  cta: {
    backgroundColor: colors.accent,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  ctaText: { color: '#fff', fontWeight: '800', fontSize: 16 },
  scamWarningBox: {
    backgroundColor: colors.dangerSoft,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.danger,
    marginBottom: 24,
  },
  scamWarningTitle: { color: colors.danger, fontWeight: '700', fontSize: 15, marginBottom: 8 },
  scamWarningText: { color: colors.danger, fontSize: 13, lineHeight: 20 },
});
