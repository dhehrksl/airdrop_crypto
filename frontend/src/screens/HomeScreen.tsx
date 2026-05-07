import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import { SafeAreaView } from 'react-native-safe-area-context';

import AirdropCard from '../components/AirdropCard';
import NativeAdCard from '../components/NativeAdCard';
import BannerAd from '../components/BannerAd';
import EmptyState from '../components/EmptyState';
import CategoryChips, { type CategoryKey } from '../components/CategoryChips';
import SearchBar from '../components/SearchBar';
import { useAirdrops } from '../hooks/useAirdrops';
import { useBookmarks } from '../hooks/useBookmarks';
import { colors } from '../theme/colors';
import type { RootStackParamList } from '../../App';
import type { Airdrop, SortKey } from '../api/airdrops';

type Props = NativeStackScreenProps<RootStackParamList, 'Home'>;

type FeedRow = { kind: 'airdrop'; data: Airdrop } | { kind: 'ad'; key: string };

const NATIVE_AD_INTERVAL = 7;

function buildFeed(items: Airdrop[]): FeedRow[] {
  const out: FeedRow[] = [];
  items.forEach((it, i) => {
    out.push({ kind: 'airdrop', data: it });
    if ((i + 1) % NATIVE_AD_INTERVAL === 0) out.push({ kind: 'ad', key: `ad-${i}` });
  });
  return out;
}

export default function HomeScreen({ navigation }: Props) {
  const [sort, setSort] = useState<SortKey>('latest');
  const [category, setCategory] = useState<CategoryKey>('all');
  const [searchInput, setSearchInput] = useState('');
  const [activeQ, setActiveQ] = useState('');

  const { items, loading, refreshing, error, hasMore, fromCache, refresh, retry, loadMore } =
    useAirdrops(sort, category, activeQ);
  const bookmarks = useBookmarks();

  const rows = useMemo(() => buildFeed(items), [items]);

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.tabs}>
        <SortTab label="최신순" active={sort === 'latest'} onPress={() => setSort('latest')} />
        <SortTab label="마감임박순" active={sort === 'deadline'} onPress={() => setSort('deadline')} />
        <View style={{ flex: 1 }} />
        <Pressable
          onPress={() => navigation.navigate('MyPage')}
          style={styles.iconBtn}
          android_ripple={{ color: colors.accentSoft, borderless: true }}
        >
          <Text style={styles.iconBtnText}>마이</Text>
        </Pressable>
        <Pressable
          onPress={() => navigation.navigate('Settings')}
          style={styles.iconBtn}
          android_ripple={{ color: colors.accentSoft, borderless: true }}
        >
          <Text style={styles.iconBtnText}>⚙</Text>
        </Pressable>
      </View>

      <SearchBar value={searchInput} onChange={setSearchInput} onSubmit={() => setActiveQ(searchInput.trim())} />
      <CategoryChips value={category} onChange={setCategory} />

      {fromCache ? (
        <View style={styles.cacheBanner}>
          <Text style={styles.cacheBannerText}>오프라인 — 캐시된 데이터를 표시합니다</Text>
        </View>
      ) : null}

      {loading ? (
        <View style={styles.loaderBox}>
          <ActivityIndicator color={colors.accent} />
        </View>
      ) : error && rows.length === 0 ? (
        <EmptyState message={error} onRetry={retry} />
      ) : (
        <FlatList
          data={rows}
          keyExtractor={(row) => (row.kind === 'airdrop' ? row.data._id : row.key)}
          renderItem={({ item }) =>
            item.kind === 'airdrop' ? (
              <AirdropCard
                item={item.data}
                bookmarked={bookmarks.has(item.data._id)}
                onToggleBookmark={() => bookmarks.toggle(item.data._id)}
                onPress={() => navigation.navigate('Detail', { id: item.data._id })}
              />
            ) : (
              <NativeAdCard />
            )
          }
          contentContainerStyle={rows.length === 0 ? styles.emptyContainer : { paddingVertical: 8 }}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refresh}
              tintColor={colors.accent}
              colors={[colors.accent]}
            />
          }
          onEndReached={loadMore}
          onEndReachedThreshold={0.4}
          ListEmptyComponent={<EmptyState message="조건에 맞는 에어드랍이 없습니다." onRetry={retry} />}
          ListFooterComponent={
            hasMore && !loading ? (
              <View style={styles.footerBox}>
                <ActivityIndicator color={colors.accent} />
              </View>
            ) : null
          }
        />
      )}
      <BannerAd />
    </SafeAreaView>
  );
}

function SortTab({ label, active, onPress }: { label: string; active: boolean; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      style={[styles.tab, active && styles.tabActive]}
      android_ripple={{ color: colors.accentSoft }}
    >
      <Text style={[styles.tabText, active && styles.tabTextActive]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingTop: 10,
    paddingBottom: 8,
    backgroundColor: colors.bg,
    gap: 8,
    alignItems: 'center',
  },
  tab: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
  },
  tabActive: { backgroundColor: colors.accentSoft, borderColor: colors.accent },
  tabText: { color: colors.textMuted, fontWeight: '600' },
  tabTextActive: { color: colors.accent },
  iconBtn: { paddingHorizontal: 10, paddingVertical: 6 },
  iconBtnText: { color: colors.text, fontSize: 14, fontWeight: '600' },
  loaderBox: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyContainer: { flexGrow: 1, justifyContent: 'center' },
  footerBox: { paddingVertical: 16 },
  cacheBanner: { backgroundColor: colors.warning, paddingVertical: 6, alignItems: 'center' },
  cacheBannerText: { color: '#1a1a1a', fontSize: 12, fontWeight: '700' },
});
