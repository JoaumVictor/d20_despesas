import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
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
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';

function currentMonthKey(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
}

export default function GoalsScreen() {
  const c = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: goals, isLoading } = useGoals(userId);
  const { data: categories } = useCategories(userId);
  const { data: usage } = useCategoryUsage(userId);
  const { data: allExpenses } = useExpensesByRange(null);

  const createGoal = useCreateGoal(userId ?? '');
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();

  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<GoalWithCategory | null>(null);

  const mk = currentMonthKey();
  const monthGoals = useMemo(() => goalsForMonth(goals ?? [], mk), [goals, mk]);
  const spend = useMemo(() => monthSpendByCategory(allExpenses ?? [], mk), [allExpenses, mk]);

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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Metas</Text>
        <Pressable
          onPress={openNew}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
          hitSlop={6}
        >
          <MaterialCommunityIcons name="plus" size={20} color={c.primaryContrast} />
          <Text style={[styles.addText, { color: c.primaryContrast }]}>Nova</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
      ) : (
        <FlatList
          data={monthGoals}
          keyExtractor={(g) => g.id}
          contentContainerStyle={styles.listContent}
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
      )}

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
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 8,
    paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '800' },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addText: { fontSize: 14, fontWeight: '700' },
  carousel: { marginBottom: 14, marginHorizontal: -20 },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  goalCard: { borderWidth: 1, borderRadius: 16, padding: 14, marginBottom: 12, gap: 10 },
  goalTop: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  goalName: { fontSize: 16, fontWeight: '700' },
  goalMeta: { fontSize: 12, marginTop: 1 },
  barTrack: { height: 8, borderRadius: 4, overflow: 'hidden' },
  barFill: { height: 8, borderRadius: 4 },
  goalBottom: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  goalSpent: { fontSize: 14, fontWeight: '700' },
  goalPct: { fontSize: 14, fontWeight: '800' },
  empty: { alignItems: 'center', gap: 8, marginTop: 40, paddingHorizontal: 30 },
  emptyText: { fontSize: 15, textAlign: 'center' },
  emptyAction: { fontSize: 15, fontWeight: '700', marginTop: 4 },
});
