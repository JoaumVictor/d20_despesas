import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useCallback, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthContext';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { useCategories, useCategoryUsage } from '@/features/categories/api';
import { useExpensesByRange } from '@/features/expenses/api';
import {
  goalsForMonth,
  useCreateGoal,
  useDeleteGoal,
  useGoals,
  useUpdateGoal,
  type GoalWithCategory,
} from '@/features/goals/api';
import { GoalFormModal } from '@/features/goals/GoalFormModal';
import { InsightsCarousel } from '@/features/insights/InsightsCarousel';
import { monthSpendByCategory } from '@/features/insights/engine';
import { PayReminderSheet } from '@/features/reminders/PayReminderSheet';
import { ReminderCard } from '@/features/reminders/ReminderCard';
import { ReminderFormModal } from '@/features/reminders/ReminderFormModal';
import {
  useCreateReminder,
  useDeleteReminder,
  useMonthReminders,
  useResolveReminder,
  useUpdateReminder,
  type ReminderWithCategory,
} from '@/features/reminders/api';
import type { RecurringSuggestion } from '@/features/suggestions/engine';
import { SuggestionCard } from '@/features/suggestions/SuggestionCard';
import { useSuggestions } from '@/features/suggestions/useSuggestions';
import { useAppStore } from '@/store/appStore';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

type FocusTab = 'metas' | 'lembretes';

export default function GoalsScreen() {
  const c = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;

  const [tab, setTab] = useState<FocusTab>('metas');

  const {
    data: goals,
    isLoading,
    refetch: refetchGoals,
    isRefetching: isRefetchingGoals,
  } = useGoals(userId);
  const { data: categories, refetch: refetchCategories } = useCategories(userId);
  const { data: usage, refetch: refetchUsage } = useCategoryUsage(userId);
  const {
    data: allExpenses,
    refetch: refetchExpenses,
    isRefetching: isRefetchingExpenses,
  } = useExpensesByRange(null);
  const { data: monthReminders, isLoading: isLoadingReminders } = useMonthReminders();

  const refreshing = isRefetchingGoals || isRefetchingExpenses;
  const onRefresh = useCallback(() => {
    refetchGoals();
    refetchCategories();
    refetchUsage();
    refetchExpenses();
  }, [refetchGoals, refetchCategories, refetchUsage, refetchExpenses]);

  const createGoal = useCreateGoal(userId ?? '');
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const createReminder = useCreateReminder(userId ?? '');
  const updateReminder = useUpdateReminder();
  const deleteReminder = useDeleteReminder();
  const resolveReminder = useResolveReminder(userId ?? '');

  const dismissSuggestion = useAppStore((s) => s.dismissSuggestion);

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalWithCategory | null>(null);

  const [reminderFormOpen, setReminderFormOpen] = useState(false);
  const [editingReminder, setEditingReminder] = useState<ReminderWithCategory | null>(null);
  const [reminderPrefill, setReminderPrefill] = useState<{
    description: string;
    categoryId: string;
    amountCents: number;
    dueDay: number;
  } | null>(null);
  const [payTarget, setPayTarget] = useState<ReminderWithCategory | null>(null);
  const [pendingSuggestionKey, setPendingSuggestionKey] = useState<string | null>(null);

  const mk = currentMonthKey();
  const monthGoals = useMemo(() => goalsForMonth(goals ?? [], mk), [goals, mk]);
  const spend = useMemo(() => monthSpendByCategory(allExpenses ?? [], mk), [allExpenses, mk]);

  const suggestions = useSuggestions();

  function confirmSuggestion(s: RecurringSuggestion) {
    setEditingReminder(null);
    setReminderPrefill({
      description: s.description,
      categoryId: s.categoryId,
      amountCents: Math.round(s.amount * 100),
      dueDay: s.suggestedDueDay,
    });
    setPendingSuggestionKey(s.key);
    setReminderFormOpen(true);
  }

  function openNew() {
    setEditing(null);
    setFormOpen(true);
  }

  function openEdit(goal: GoalWithCategory) {
    setEditing(goal);
    setFormOpen(true);
  }

  function confirmDelete(goal: GoalWithCategory) {
    Alert.alert('Excluir meta', `Remover a meta de ${goal.category?.name ?? 'categoria'}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteGoal.mutate(goal.id),
      },
    ]);
  }

  function openNewReminder() {
    setEditingReminder(null);
    setReminderPrefill(null);
    setPendingSuggestionKey(null);
    setReminderFormOpen(true);
  }

  function openEditReminder(reminder: ReminderWithCategory) {
    setEditingReminder(reminder);
    setReminderPrefill(null);
    setPendingSuggestionKey(null);
    setReminderFormOpen(true);
  }

  function confirmDeleteReminder(reminder: ReminderWithCategory) {
    Alert.alert('Excluir lembrete', `Remover o lembrete de ${reminder.description}?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteReminder.mutate(reminder.id),
      },
    ]);
  }

  async function handleResolve(resolution: 'expense' | 'done_only') {
    if (!payTarget) return;
    try {
      await resolveReminder.mutateAsync({ reminder: payTarget, resolution });
      setPayTarget(null);
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Foco</Text>
        {tab === 'metas' && (
          <Pressable
            onPress={openNew}
            style={[styles.addBtn, { backgroundColor: c.primary }]}
            hitSlop={6}
          >
            <MaterialCommunityIcons name="plus" size={20} color={c.primaryContrast} />
            <Text style={[styles.addText, { color: c.primaryContrast }]}>Nova</Text>
          </Pressable>
        )}
        {tab === 'lembretes' && (
          <Pressable
            onPress={openNewReminder}
            style={[styles.addBtn, { backgroundColor: c.primary }]}
            hitSlop={6}
          >
            <MaterialCommunityIcons name="plus" size={20} color={c.primaryContrast} />
            <Text style={[styles.addText, { color: c.primaryContrast }]}>Novo</Text>
          </Pressable>
        )}
      </View>

      <View style={[styles.segmented, { backgroundColor: c.surfaceAlt }]}>
        {(
          [
            { key: 'metas', label: 'Metas' },
            { key: 'lembretes', label: 'Lembretes' },
          ] as const
        ).map((opt) => {
          const active = tab === opt.key;
          return (
            <Pressable
              key={opt.key}
              onPress={() => setTab(opt.key)}
              style={[styles.segmentBtn, active && { backgroundColor: c.primary }]}
            >
              <View>
                <Text
                  style={[
                    styles.segmentText,
                    { color: active ? c.primaryContrast : c.textMuted },
                  ]}
                >
                  {opt.label}
                </Text>
                {opt.key === 'lembretes' && suggestions.length > 0 && (
                  <View style={[styles.segmentBadge, { borderColor: c.surfaceAlt }]} />
                )}
              </View>
            </Pressable>
          );
        })}
      </View>

      {tab === 'metas' &&
        (isLoading ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
        ) : (
          <FlatList
            data={monthGoals}
            keyExtractor={(g) => g.id}
            contentContainerStyle={styles.listContent}
            refreshControl={
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={c.primary} />
            }
            ListHeaderComponent={
              <View style={styles.carousel}>
                <InsightsCarousel scope="metas" />
              </View>
            }
            renderItem={({ item }) => {
              const spent = spend.get(item.category_id) ?? 0;
              const pct = Math.min((spent / item.amount) * 100, 100);
              const over = item.kind === 'limit' && spent > item.amount;
              const hit = item.kind === 'target' && spent >= item.amount;
              const barColor = over ? c.danger : hit ? c.success : c.primary;
              return (
                <Pressable
                  style={[styles.goalCard, { backgroundColor: c.surface, borderColor: c.border }]}
                  onPress={() => openEdit(item)}
                  onLongPress={() => confirmDelete(item)}
                >
                  <View style={styles.goalTop}>
                    <CategoryIcon
                      iconKey={item.category?.icon}
                      color={item.category?.color ?? c.textMuted}
                      size={38}
                    />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.goalName, { color: c.text }]} numberOfLines={1}>
                        {item.category?.name ?? 'Categoria'}
                      </Text>
                      <Text style={[styles.goalMeta, { color: c.textMuted }]}>
                        {item.kind === 'limit' ? 'Limite' : 'Alvo'} ·{' '}
                        {item.month === null ? 'todo mês' : 'este mês'}
                      </Text>
                    </View>
                    <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.textMuted} />
                    </Pressable>
                  </View>

                  <View style={[styles.barTrack, { backgroundColor: c.surfaceAlt }]}>
                    <View
                      style={[styles.barFill, { backgroundColor: barColor, width: `${pct}%` }]}
                    />
                  </View>

                  <View style={styles.goalBottom}>
                    <Text style={[styles.goalSpent, { color: over ? c.danger : c.text }]}>
                      {formatCurrency(spent)}
                      <Text style={{ color: c.textMuted, fontWeight: '400' }}>
                        {' '}de {formatCurrency(item.amount)}
                      </Text>
                    </Text>
                    <Text style={[styles.goalPct, { color: barColor }]}>
                      {((spent / item.amount) * 100).toFixed(0)}%
                      {hit ? ' 🎉' : ''}
                    </Text>
                  </View>
                </Pressable>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="target" size={48} color={c.border} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Nenhuma meta ainda. Crie a primeira: {'"'}esse mês quero gastar até R$X com Y{'"'}.
                </Text>
                <Pressable onPress={openNew}>
                  <Text style={[styles.emptyAction, { color: c.primary }]}>Criar meta</Text>
                </Pressable>
              </View>
            }
          />
        ))}

      {tab === 'lembretes' &&
        (isLoadingReminders ? (
          <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
        ) : (
          <FlatList
            data={monthReminders ?? []}
            keyExtractor={(r) => r.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <Pressable onLongPress={() => confirmDeleteReminder(item)}>
                <ReminderCard
                  reminder={item}
                  onPay={() => setPayTarget(item)}
                  onEdit={() => openEditReminder(item)}
                />
              </Pressable>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <MaterialCommunityIcons name="calendar-clock-outline" size={48} color={c.border} />
                <Text style={[styles.emptyText, { color: c.textMuted }]}>
                  Nenhum lembrete ainda. Crie contas fixas, tipo {'"'}Internet, dia 10{'"'}.
                </Text>
                <Pressable onPress={openNewReminder}>
                  <Text style={[styles.emptyAction, { color: c.primary }]}>Criar lembrete</Text>
                </Pressable>
              </View>
            }
            ListFooterComponent={
              suggestions.length > 0 ? (
                <View style={styles.suggestions}>
                  <Text style={[styles.suggestionsTitle, { color: c.textMuted }]}>Sugestões</Text>
                  {suggestions.map((s) => (
                    <SuggestionCard
                      key={s.key}
                      suggestion={s}
                      onConfirm={() => confirmSuggestion(s)}
                      onDismiss={() => dismissSuggestion(s.key)}
                    />
                  ))}
                </View>
              ) : null
            }
          />
        ))}

      <GoalFormModal
        visible={formOpen}
        categories={categories ?? []}
        usage={usage ?? {}}
        editing={editing}
        onSubmit={async (input) => {
          if (editing) await updateGoal.mutateAsync({ id: editing.id, input });
          else await createGoal.mutateAsync(input);
        }}
        onClose={() => setFormOpen(false)}
      />

      <ReminderFormModal
        visible={reminderFormOpen}
        categories={categories ?? []}
        usage={usage ?? {}}
        editing={editingReminder}
        prefill={reminderPrefill}
        onSubmit={async (input) => {
          if (editingReminder) {
            await updateReminder.mutateAsync({ id: editingReminder.id, input });
          } else {
            await createReminder.mutateAsync(input);
            if (pendingSuggestionKey) {
              dismissSuggestion(pendingSuggestionKey);
              setPendingSuggestionKey(null);
            }
          }
        }}
        onClose={() => setReminderFormOpen(false)}
      />

      <PayReminderSheet
        reminder={payTarget}
        loading={resolveReminder.isPending}
        onCreateExpense={() => handleResolve('expense')}
        onDoneOnly={() => handleResolve('done_only')}
        onClose={() => setPayTarget(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
  },
  title: { ...type.title },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: 9,
    paddingHorizontal: 16,
  },
  addText: { fontSize: 14, fontWeight: '700' },
  segmented: {
    flexDirection: 'row',
    marginHorizontal: spacing.xl,
    marginBottom: spacing.lg,
    borderRadius: radius.pill,
    padding: 4,
    gap: 4,
  },
  segmentBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: radius.pill,
  },
  segmentText: { fontSize: 13, fontWeight: '700' },
  segmentBadge: {
    position: 'absolute',
    top: -2,
    right: -8,
    width: 8,
    height: 8,
    borderRadius: 4,
    borderWidth: 1.5,
    backgroundColor: '#E5484D',
  },
  suggestions: { marginTop: spacing.lg },
  suggestionsTitle: { ...type.label, marginBottom: spacing.sm },
  carousel: { marginBottom: spacing.lg, marginHorizontal: -spacing.xl },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 96 },
  goalCard: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
    ...shadowCard,
  },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  goalName: { ...type.heading, fontSize: 16 },
  goalMeta: { ...type.caption, marginTop: 1 },
  barTrack: { height: 8, borderRadius: radius.pill, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: radius.pill },
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalSpent: { fontSize: 14, fontWeight: '700' },
  goalPct: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: 40, paddingHorizontal: 30 },
  emptyText: { ...type.body, textAlign: 'center' },
  emptyAction: { ...type.bodyBold, marginTop: spacing.xs },
});
