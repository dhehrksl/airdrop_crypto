import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import AirdropCard from '../components/AirdropCard';
import EmptyState from '../components/EmptyState';
import { fetchAirdropsByIds, type Airdrop } from '../api/airdrops';
import { useBookmarks } from '../hooks/useBookmarks';
import { useParticipation } from '../hooks/useParticipation';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../../App';

type Props = NativeStackScreenProps<RootStackParamList, 'MyPage'>;
type Tab = 'bookmarks' | 'done';

export default function MyPageScreen({ navigation }: Props) {
  const [tab, setTab] = useState<Tab>('bookmarks');
  const bookmarks = useBookmarks();
  const participation = useParticipation();
  const [items, setItems] = useState<Airdrop[]>([]);
  const [loading, setLoading] = useState(false);

  const ids = useMemo(
    () => (tab === 'bookmarks' ? bookmarks.ids : participation.ids),
    [tab, bookmarks.ids, participation.ids]
  );

  const load = useCallback(async () => {
    if (!bookmarks.ready || !participation.ready) return;
    setLoading(true);
    try {
      const fetched = await fetchAirdropsByIds(ids);
      const order = new Map(ids.map((id, i) => [id, i]));
      fetched.sort((a, b) => (order.get(a._id) ?? 0) - (order.get(b._id) ?? 0));
      setItems(fetched);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [ids, bookmarks.ready, participation.ready]);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.safe} edges={['bottom']}>
      <View style={styles.tabs}>
        <TabBtn label={`즐겨찾기 (${bookmarks.ids.length})`} active={tab === 'bookmarks'} onPress={() => setTab('bookmarks')} />
        <TabBtn label={`완료 (${participation.ids.length})`} active={tab === 'done'} onPress={() => setTab('done')} />
      </View>
      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : items.length === 0 ? (
        <EmptyState
          message={
            tab === 'bookmarks'
              ? '즐겨찾기한 에어드랍이 없습니다.\n카드의 ☆ 아이콘으로 추가하세요.'
              : '완료한 에어드랍이 없습니다.\n상세 화면에서 "참여 완료" 버튼을 눌러 기록할 수 있습니다.'
          }
        />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(it) => it._id}
          renderItem={({ item }) => (
            <AirdropCard
              item={item}
              bookmarked={bookmarks.has(item._id)}
              onToggleBookmark={() => bookmarks.toggle(item._id)}
              onPress={() => navigation.navigate('Detail', { id: item._id })}
            />
          )}
          contentContainerStyle={{ paddingVertical: 8 }}
        />
      )}
    </SafeAreaView>
  );
}

function TabBtn({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable onPress={onPress} style={[styles.tab, active && styles.tabActive]}>
      <Text style={[styles.label, active && styles.labelActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tabs: { flexDirection: 'row', padding: 16, gap: 8 },
  tab: {
    flex: 1,
    paddingVertical: 10,
    backgroundColor: colors.surface,
    borderRadius: 10,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  label: { color: colors.textMuted, fontWeight: '600' },
  labelActive: { color: colors.accent, fontWeight: '700' },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
