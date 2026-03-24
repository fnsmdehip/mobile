/**
 * Dashboard Screen - Professional overview of consent records.
 * Stats cards with hero numbers, clean record list, search/filter,
 * pull-to-refresh, skeleton loading, designed empty state.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  FlatList,
  Pressable,
  TextInput,
  RefreshControl,
  Alert,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ErrorBoundary from '../components/ErrorBoundary';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import { SkeletonList } from '../components/SkeletonLoader';
import db from '../services/database';
import exportService from '../services/export';
import type { ConsentRecord, ConsentStatus, DashboardStats } from '../types';
import { Colors, Typography, Spacing, BorderRadius, Shadows, CardBorder, MIN_TOUCH_SIZE, Assets } from '../constants/theme';

type FilterOption = 'all' | ConsentStatus;

interface DashboardProps {
  navigation: {
    navigate: (screen: string, params?: Record<string, unknown>) => void;
    addListener: (event: string, callback: () => void) => () => void;
  };
}

const FILTERS: { key: FilterOption; label: string }[] = [
  { key: 'all', label: 'All' },
  { key: 'active', label: 'Active' },
  { key: 'expired', label: 'Expired' },
  { key: 'revoked', label: 'Revoked' },
  { key: 'draft', label: 'Draft' },
];

const Dashboard: React.FC<DashboardProps> = ({ navigation }) => {
  const [records, setRecords] = useState<ConsentRecord[]>([]);
  const [filteredRecords, setFilteredRecords] = useState<ConsentRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<FilterOption>('all');
  const [stats, setStats] = useState<DashboardStats>({
    total: 0, active: 0, expired: 0, revoked: 0, draft: 0,
    expiringSoon: 0, recentlyCreated: 0,
  });
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);

  const applyFilters = useCallback(
    (data: ConsentRecord[], query: string, filter: FilterOption) => {
      let result = data;
      if (filter !== 'all') {
        result = result.filter((r) => r.status === filter);
      }
      if (query.trim()) {
        const lower = query.toLowerCase();
        result = result.filter(
          (r) =>
            r.title.toLowerCase().includes(lower) ||
            r.templateName.toLowerCase().includes(lower) ||
            r.parties.some((p) => p.name.toLowerCase().includes(lower))
        );
      }
      setFilteredRecords(result);
    },
    []
  );

  const loadData = useCallback(async () => {
    try {
      const [allRecords, dashStats] = await Promise.all([
        db.getAllRecords(),
        db.getStats(),
      ]);
      setRecords(allRecords);
      setStats(dashStats);
      applyFilters(allRecords, searchQuery, activeFilter);
    } catch (_error) {
      Alert.alert('Error', 'Failed to load consent records.');
    } finally {
      setLoading(false);
    }
  }, [searchQuery, activeFilter, applyFilters]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { applyFilters(records, searchQuery, activeFilter); }, [searchQuery, activeFilter, records, applyFilters]);
  useEffect(() => {
    const unsub = navigation.addListener('focus', () => { loadData(); });
    return unsub;
  }, [navigation, loadData]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleRecordPress = (record: ConsentRecord) => {
    Alert.alert(
      record.title,
      `Status: ${record.status}\nCreated: ${new Date(record.createdAt).toLocaleDateString()}\nParties: ${record.parties.map((p) => p.name).join(', ')}${record.documentHash ? '\n\nSHA-256: ' + record.documentHash.substring(0, 24) + '...' : ''}`,
      [
        {
          text: 'View Details',
          onPress: () => {
            navigation.navigate('PDFPreview', { recordId: record.id });
          },
        },
        {
          text: 'Export PDF',
          onPress: async () => {
            try {
              await exportService.exportAndShare(record);
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              Alert.alert('Export Error', msg);
            }
          },
        },
        ...(record.status === 'active'
          ? [{
              text: 'Revoke',
              style: 'destructive' as const,
              onPress: () => {
                Alert.alert(
                  'Revoke Consent',
                  'Are you sure you want to revoke this consent? This action cannot be undone.\n\nThe record hash will be recomputed to reflect the revocation.',
                  [
                    { text: 'Cancel', style: 'cancel' as const },
                    {
                      text: 'Revoke',
                      style: 'destructive' as const,
                      onPress: async () => {
                        await db.revokeRecord(record.id);
                        loadData();
                        Alert.alert(
                          'Consent Revoked',
                          'The consent has been revoked and the document hash has been updated to reflect this modification.'
                        );
                      },
                    },
                  ]
                );
              },
            }]
          : []),
        { text: 'Close' },
      ]
    );
  };

  const renderStatsCards = () => (
    <View style={styles.statsContainer}>
      <View style={styles.statsRow}>
        <View style={[styles.statCard, styles.statCardWide]}>
          <Text style={styles.statHeroNumber}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total Records</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.statusActive }]}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>
      </View>
      <View style={styles.statsRow}>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.warning }]}>{stats.expiringSoon}</Text>
          <Text style={styles.statLabel}>Expiring Soon</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.info }]}>{stats.recentlyCreated}</Text>
          <Text style={styles.statLabel}>This Week</Text>
        </View>
        <View style={styles.statCard}>
          <Text style={[styles.statNumber, { color: Colors.statusRevoked }]}>{stats.revoked}</Text>
          <Text style={styles.statLabel}>Revoked</Text>
        </View>
      </View>
    </View>
  );

  const renderFilterBar = () => (
    <View style={styles.filterContainer}>
      {FILTERS.map((f) => (
        <Pressable
          key={f.key}
          style={[styles.filterChip, activeFilter === f.key && styles.filterChipActive]}
          onPress={() => setActiveFilter(f.key)}
        >
          <Text style={[styles.filterChipText, activeFilter === f.key && styles.filterChipTextActive]}>
            {f.label}
          </Text>
        </Pressable>
      ))}
    </View>
  );

  const renderRecord = ({ item }: { item: ConsentRecord }) => (
    <Pressable style={styles.recordCard} onPress={() => handleRecordPress(item)}>
      <View style={styles.recordHeader}>
        <View style={styles.recordTitleRow}>
          <Image
            source={
              item.templateName.includes('Medical') ? Assets.iconChecklist :
              item.templateName.includes('Photo') ? Assets.iconVideo :
              item.templateName.includes('NDA') ? Assets.iconCloudLock :
              item.templateName.includes('GDPR') ? Assets.iconShield :
              item.templateName.includes('Research') ? Assets.iconChecklist :
              item.templateName.includes('Property') ? Assets.iconSignature :
              item.templateName.includes('Waiver') ? Assets.iconShield :
              item.templateName.includes('Mutual') ? Assets.iconSignature :
              Assets.iconChecklist
            }
            style={styles.recordImage}
            resizeMode="contain"
          />
          <View style={styles.recordTitleContainer}>
            <Text style={styles.recordTitle} numberOfLines={1}>{item.title}</Text>
            <Text style={styles.recordTemplate}>{item.templateName}</Text>
          </View>
        </View>
        <StatusBadge status={item.status} size="small" />
      </View>
      <View style={styles.recordMeta}>
        <Text style={styles.recordParties} numberOfLines={1}>
          {item.parties.map((p) => p.name).join(' & ')}
        </Text>
        <Text style={styles.recordDate}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      {item.expiresAt && item.status === 'active' && (
        <View style={styles.expiryRow}>
          <Text style={styles.expiryText}>
            Expires {new Date(item.expiresAt).toLocaleDateString()}
          </Text>
        </View>
      )}
      {item.documentHash && (
        <View style={styles.hashRow}>
          <Image source={Assets.iconShield} style={styles.hashImage} resizeMode="contain" />
          <Text style={styles.hashText}>SHA-256 verified</Text>
        </View>
      )}
    </Pressable>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <SkeletonList count={4} />
      </SafeAreaView>
    );
  }

  return (
    <ErrorBoundary>
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <FlatList
          data={filteredRecords}
          renderItem={renderRecord}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={
            <>
              {renderStatsCards()}
              <View style={styles.searchContainer}>
                <Image source={Assets.iconChecklist} style={styles.searchImage} resizeMode="contain" />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search records..."
                  placeholderTextColor={Colors.textTertiary}
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  clearButtonMode="while-editing"
                />
              </View>
              {renderFilterBar()}
            </>
          }
          ListEmptyComponent={
            <EmptyState
              title="No consent records yet"
              subtitle="Create your first consent record from the Templates tab to see it here."
            />
          }
          contentContainerStyle={
            filteredRecords.length === 0 ? styles.emptyList : styles.listContent
          }
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      </SafeAreaView>
    </ErrorBoundary>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  statsContainer: {
    padding: Spacing.lg,
    paddingBottom: Spacing.section,
    gap: Spacing.sm,
  },
  statsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  statCard: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    ...CardBorder,
    ...Shadows.card,
  },
  statCardWide: {
    flex: 1.5,
  },
  statHeroNumber: {
    ...Typography.heroNumber,
    color: Colors.textPrimary,
  },
  statNumber: {
    fontSize: 48,
    fontWeight: '200',
    color: Colors.textPrimary,
    letterSpacing: -2,
    fontVariant: ['tabular-nums'],
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 4,
    fontWeight: '500',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: Spacing.lg,
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.md,
    ...CardBorder,
    ...Shadows.card,
    marginBottom: Spacing.sm,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  searchImage: {
    width: 16,
    height: 16,
    marginRight: Spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: Spacing.md,
    ...Typography.body,
    color: Colors.textPrimary,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    gap: Spacing.sm,
  },
  filterChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.round,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: MIN_TOUCH_SIZE,
    justifyContent: 'center',
  },
  filterChipActive: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  filterChipText: {
    ...Typography.caption,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xxxl,
  },
  emptyList: {
    flex: 1,
  },
  recordCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    marginBottom: Spacing.md,
    ...CardBorder,
    ...Shadows.card,
  },
  recordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: Spacing.sm,
  },
  recordTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: Spacing.sm,
  },
  recordIcon: {
    fontSize: 24,
    marginRight: Spacing.md,
  },
  recordImage: {
    width: 28,
    height: 28,
    marginRight: Spacing.md,
  },
  recordTitleContainer: {
    flex: 1,
  },
  recordTitle: {
    ...Typography.body,
    color: Colors.textPrimary,
    fontWeight: '600',
  },
  recordTemplate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginTop: 2,
  },
  recordMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  recordParties: {
    ...Typography.bodySmall,
    color: Colors.textSecondary,
    flex: 1,
  },
  recordDate: {
    ...Typography.caption,
    color: Colors.textTertiary,
    marginLeft: Spacing.sm,
    fontVariant: ['tabular-nums'],
  },
  expiryRow: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.warningLight,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.sm,
    alignSelf: 'flex-start',
  },
  expiryText: {
    ...Typography.caption,
    color: '#92400E',
    fontWeight: '500',
  },
  hashRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: Spacing.sm,
  },
  hashIcon: {
    fontSize: 12,
    marginRight: 4,
  },
  hashImage: {
    width: 14,
    height: 14,
    marginRight: 4,
  },
  hashText: {
    ...Typography.caption,
    color: Colors.success,
    fontWeight: '500',
  },
});

export default Dashboard;
