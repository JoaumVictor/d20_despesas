import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  PanResponder,
  Pressable,
  RefreshControl,
  SectionList,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useCategories } from '@/features/categories/api';
import { useAuth } from '@/features/auth/AuthContext';
import { ExpenseItem } from '@/features/expenses/ExpenseItem';
import { ExpenseFiltersModal } from '@/features/expenses/ExpenseFiltersModal';
import {
  useExpensesByRange,
  useToggleStatus,
  type ExpenseWithCategory,
} from '@/features/expenses/api';
import { activeFilterCount, applyFilters, emptyFilters } from '@/features/expenses/filters';
import { CancelInstallmentSheet } from '@/features/installments/CancelInstallmentSheet';
import { GhostExpenseItem } from '@/features/installments/GhostExpenseItem';
import {
  useCancelInstallment,
  useConfirmInstallment,
  useGhostInstallments,
  type GhostInstallment,
} from '@/features/installments/api';
import { InsightsCarousel } from '@/features/insights/InsightsCarousel';
import { PeriodFilter } from '@/features/period/PeriodFilter';
import { periodToRange, shiftMonth } from '@/features/period/period';
import { useAppStore } from '@/store/appStore';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency, parseISODate } from '@/utils/format';

const SLIDE_OFFSET = 60;

function dayLabel(iso: string): string {
  const d = new Date(`${iso}T00:00:00`);
  const s = new Intl.DateTimeFormat('pt-BR', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
  }).format(d);
  return s.charAt(0).toUpperCase() + s.slice(1);
}

export default function ExpensesScreen() {
  const router = useRouter();
  const c = useTheme();
  const { session } = useAuth();
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  const showAlertCards = useAppStore((s) => s.showAlertCards);

  const { data: categories } = useCategories(session?.user.id);
  const range = useMemo(() => periodToRange(period), [period]);
  const { data, isLoading, isRefetching, refetch, error } = useExpensesByRange(range);
  const toggleStatus = useToggleStatus();
  const ghosts = useGhostInstallments(range);
  const confirmInstallment = useConfirmInstallment(session?.user.id ?? '');
  const cancelInstallment = useCancelInstallment();

  const [filters, setFilters] = useState(emptyFilters);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [cancelTarget, setCancelTarget] = useState<GhostInstallment | null>(null);

  const filtered = useMemo(() => applyFilters(data ?? [], filters), [data, filters]);
  const total = useMemo(() => filtered.reduce((sum, e) => sum + e.price, 0), [filtered]);
  const filterCount = activeFilterCount(filters);

  const sections = useMemo(() => {
    const byDay = new Map<string, ExpenseWithCategory[]>();
    for (const e of filtered) {
      const iso = e.date_transaction.slice(0, 10);
      const arr = byDay.get(iso);
      if (arr) arr.push(e);
      else byDay.set(iso, [e]);
    }
    return [...byDay.entries()]
      .sort(([a], [b]) => (a < b ? 1 : -1))
      .map(([iso, items]) => ({
        title: iso,
        total: items.reduce((s, e) => s + e.price, 0),
        data: items,
      }));
  }, [filtered]);

  // --- Animação de troca de mês (slide + fade) ---
  const tx = useRef(new Animated.Value(0)).current;
  const op = useRef(new Animated.Value(1)).current;
  const prevRef = useRef<string | null>(period.kind === 'month' ? period.ref : null);
  useEffect(() => {
    if (period.kind !== 'month') {
      prevRef.current = null;
      tx.setValue(0);
      op.setValue(1);
      return;
    }
    const prev = prevRef.current;
    prevRef.current = period.ref;
    if (!prev || prev === period.ref) return;
    const dir = parseISODate(period.ref) > parseISODate(prev) ? 1 : -1;
    tx.setValue(dir * SLIDE_OFFSET);
    op.setValue(0.3);
    Animated.parallel([
      Animated.timing(tx, { toValue: 0, duration: 220, useNativeDriver: true }),
      Animated.timing(op, { toValue: 1, duration: 220, useNativeDriver: true }),
    ]).start();
  }, [period, tx, op]);

  // --- Swipe horizontal troca o mês (só no modo Mês) ---
  const periodRef = useRef(period);
  periodRef.current = period;
  const pan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_, g) =>
        periodRef.current.kind === 'month' &&
        Math.abs(g.dx) > 20 &&
        Math.abs(g.dx) > Math.abs(g.dy) * 1.5,
      onPanResponderRelease: (_, g) => {
        const p = periodRef.current;
        if (p.kind !== 'month') return;
        if (g.dx <= -40) setPeriod(shiftMonth(p, 1));
        else if (g.dx >= 40) setPeriod(shiftMonth(p, -1));
      },
    }),
  ).current;

  const noResults = !isLoading && (data?.length ?? 0) > 0 && filtered.length === 0;

  async function handleCancel(scope: 'this' | 'remaining') {
    if (!cancelTarget) return;
    await cancelInstallment.mutateAsync({ ghost: cancelTarget, scope });
    setCancelTarget(null);
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text style={[styles.hello, { color: c.textMuted }]}>Suas despesas</Text>
          <Text style={[styles.total, { color: c.text }]}>{formatCurrency(total)}</Text>
        </View>
        <Pressable
          onPress={() => setFiltersOpen(true)}
          style={[styles.filterBtn, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}
        >
          <MaterialCommunityIcons
            name="tune-variant"
            size={22}
            color={filterCount > 0 ? c.primary : c.textMuted}
          />
          {filterCount > 0 && (
            <View style={[styles.badge, { backgroundColor: c.primary }]}>
              <Text style={[styles.badgeText, { color: c.primaryContrast }]}>{filterCount}</Text>
            </View>
          )}
        </Pressable>
      </View>

      <View style={styles.periodFilter}>
        <PeriodFilter />
      </View>

      {showAlertCards && (
        <View style={styles.insights}>
          <InsightsCarousel scope="despesas" max={5} />
        </View>
      )}

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={[styles.emptyText, { color: c.textMuted }]}>Erro ao carregar despesas.</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={[styles.retry, { color: c.primary }]}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <View style={{ flex: 1 }} {...pan.panHandlers}>
          <Animated.View style={{ flex: 1, transform: [{ translateX: tx }], opacity: op }}>
            <SectionList
              sections={sections}
              keyExtractor={(item) => item.id}
              contentContainerStyle={styles.listContent}
              stickySectionHeadersEnabled={false}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={c.primary} />
              }
              ListHeaderComponent={
                ghosts.length > 0 ? (
                  <View style={styles.ghosts}>
                    {ghosts.map((ghost) => (
                      <GhostExpenseItem
                        key={`${ghost.seriesId}:${ghost.installmentNumber}`}
                        ghost={ghost}
                        onConfirm={() => confirmInstallment.mutate(ghost)}
                        onCancel={() => setCancelTarget(ghost)}
                      />
                    ))}
                  </View>
                ) : null
              }
              renderSectionHeader={({ section }) => (
                <View style={[styles.dayHeader, { borderTopColor: c.border }]}>
                  <Text style={[styles.dayLabel, { color: c.textMuted }]}>
                    {dayLabel(section.title)}
                  </Text>
                  <Text style={[styles.dayTotal, { color: c.textMuted }]}>
                    {formatCurrency(section.total)}
                  </Text>
                </View>
              )}
              renderItem={({ item }) => (
                <ExpenseItem
                  expense={item}
                  onPress={() => router.push(`/expense/${item.id}`)}
                  onToggleStatus={() =>
                    toggleStatus.mutate({
                      id: item.id,
                      status: item.status === 'PAY' ? 'NOTPAY' : 'PAY',
                    })
                  }
                />
              )}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <MaterialCommunityIcons
                    name={noResults ? 'filter-remove-outline' : 'tray'}
                    size={48}
                    color={c.border}
                  />
                  <Text style={[styles.emptyText, { color: c.textMuted }]}>
                    {noResults
                      ? 'Nenhuma despesa com esses filtros.'
                      : 'Nenhuma despesa neste período.'}
                  </Text>
                  {noResults && (
                    <Pressable onPress={() => setFilters(emptyFilters)}>
                      <Text style={[styles.retry, { color: c.primary }]}>Limpar filtros</Text>
                    </Pressable>
                  )}
                </View>
              }
            />
          </Animated.View>
        </View>
      )}

      <ExpenseFiltersModal
        visible={filtersOpen}
        categories={categories ?? []}
        value={filters}
        onApply={setFilters}
        onClose={() => setFiltersOpen(false)}
      />

      <CancelInstallmentSheet
        ghost={cancelTarget}
        loading={cancelInstallment.isPending}
        onCancelThis={() => handleCancel('this')}
        onCancelRemaining={() => handleCancel('remaining')}
        onClose={() => setCancelTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  hello: { ...type.label },
  total: { ...type.display, marginTop: 2 },
  periodFilter: { paddingBottom: spacing.sm },
  insights: { paddingBottom: spacing.sm },
  filterBtn: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 96 },
  ghosts: { paddingTop: spacing.sm },
  dayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: spacing.xl,
    paddingBottom: spacing.sm,
  },
  dayLabel: { ...type.label, fontSize: 12 },
  dayTotal: { ...type.caption, fontWeight: '700' },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: 60 },
  emptyText: { ...type.body },
  retry: { ...type.bodyBold, marginTop: spacing.xs },
});
