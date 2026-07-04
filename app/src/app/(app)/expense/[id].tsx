import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CalendarModal } from '@/components/CalendarModal';
import { CategorySelect } from '@/features/categories/CategorySelect';
import { useCategories, useCategoryUsage } from '@/features/categories/api';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpense,
  useExpensesByRange,
  useUpdateExpense,
  type ExpenseInput,
} from '@/features/expenses/api';
import { goalsForMonth, useGoals } from '@/features/goals/api';
import { useCreateInstallmentPurchase } from '@/features/installments/api';
import { monthSpendByCategory } from '@/features/insights/engine';
import { useAppStore } from '@/store/appStore';
import { radius, spacing, type } from '@/theme/tokens';
import type { ExpenseStatus } from '@/types/database';
import { useTheme } from '@/theme/useTheme';
import {
  centsToBRL,
  digitsToCents,
  formatCurrency,
  formatDate,
  formatMonthLabel,
  toISODate,
} from '@/utils/format';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const c = useTheme();
  const { session } = useAuth();
  const userId = session?.user.id;
  const showPaidStatus = useAppStore((s) => s.showPaidStatus);

  const { data: categories } = useCategories(userId);
  const { data: usage } = useCategoryUsage(userId);
  const { data: goals } = useGoals(userId);
  const { data: allExpenses } = useExpensesByRange(null);
  const { data: existing, isLoading: loadingExpense } = useExpense(id);
  const createExpense = useCreateExpense(userId ?? '');
  const createInstallmentPurchase = useCreateInstallmentPurchase(userId ?? '');
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [amountCents, setAmountCents] = useState(0);
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [status, setStatus] = useState<ExpenseStatus>('NOTPAY');
  const [installments, setInstallments] = useState(1);
  const [calendarOpen, setCalendarOpen] = useState(false);

  useEffect(() => {
    if (existing) {
      setAmountCents(Math.round(existing.price * 100));
      setDescription(existing.description);
      setCategoryId(existing.category_id);
      setDate(existing.date_transaction.slice(0, 10));
      setStatus(existing.status);
    }
  }, [existing]);

  const saving =
    createExpense.isPending || updateExpense.isPending || createInstallmentPurchase.isPending;

  const installmentsHint = (() => {
    if (installments <= 1) return null;
    const start = new Date(`${date}T00:00:00`);
    const end = new Date(start.getFullYear(), start.getMonth() + installments - 1, 1);
    return `Você começa a pagar agora em ${formatMonthLabel(start)} e essa compra se repete até ${formatMonthLabel(end)}.`;
  })();

  // Aviso discreto de meta: gasto do mês na categoria selecionada vs. limite.
  const goalHint = (() => {
    if (!categoryId || !goals || !allExpenses) return null;
    const now = new Date();
    const mk = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const goal = goalsForMonth(goals, mk).find(
      (g) => g.category_id === categoryId && g.kind === 'limit',
    );
    if (!goal) return null;
    const spent = monthSpendByCategory(allExpenses, mk).get(categoryId) ?? 0;
    return { spent, remaining: goal.amount - spent, amount: goal.amount };
  })();

  async function handleSave() {
    if (amountCents <= 0) return Alert.alert('Atenção', 'Informe um valor válido.');
    if (!categoryId) return Alert.alert('Atenção', 'Escolha uma categoria.');

    try {
      if (isNew && installments > 1) {
        await createInstallmentPurchase.mutateAsync({
          categoryId,
          description: description.trim(),
          amount: amountCents / 100,
          totalInstallments: installments,
          startDate: date,
        });
      } else {
        const input: ExpenseInput = {
          description: description.trim(),
          price: amountCents / 100,
          categoryId,
          dateTransaction: date,
          status: showPaidStatus ? status : 'PAY',
          recurrent: false,
        };
        if (isNew) await createExpense.mutateAsync(input);
        else await updateExpense.mutateAsync({ id: id as string, input });
      }
      router.back();
    } catch (err) {
      Alert.alert('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  function handleDelete() {
    Alert.alert('Excluir despesa', 'Tem certeza?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteExpense.mutateAsync(id as string);
            router.back();
          } catch (err) {
            Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
          }
        },
      },
    ]);
  }

  if (!isNew && loadingExpense) {
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />;
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      {/* 1. Valor — destaque, centralizado, foco automático */}
      <TextInput
        style={[styles.amount, { color: c.primary }]}
        value={centsToBRL(amountCents)}
        onChangeText={(t) => setAmountCents(digitsToCents(t))}
        keyboardType="number-pad"
        autoFocus={isNew}
        selectionColor={c.primary}
      />

      {/* 2. Categoria — select por mais usadas */}
      <Text style={[styles.label, { color: c.text }]}>Categoria</Text>
      <CategorySelect
        categories={categories ?? []}
        usage={usage ?? {}}
        value={categoryId}
        onChange={setCategoryId}
      />
      {goalHint && (
        <Text
          style={[styles.goalHint, { color: goalHint.remaining >= 0 ? c.textMuted : c.danger }]}
        >
          {goalHint.remaining >= 0
            ? `Você já gastou ${formatCurrency(goalHint.spent)} esse mês com essa categoria · restam ${formatCurrency(goalHint.remaining)} do limite de ${formatCurrency(goalHint.amount)}.`
            : `Limite de ${formatCurrency(goalHint.amount)} estourado em ${formatCurrency(-goalHint.remaining)} este mês.`}
        </Text>
      )}

      {/* 3. Data — calendário */}
      <Text style={[styles.label, { color: c.text }]}>Data</Text>
      <Pressable
        onPress={() => setCalendarOpen(true)}
        style={[styles.dateField, { borderColor: c.border, backgroundColor: c.surface }]}
      >
        <Text style={[styles.dateText, { color: c.text }]}>{formatDate(date)}</Text>
        <MaterialCommunityIcons name="calendar-month-outline" size={22} color={c.primary} />
      </Pressable>

      {/* 4. Descrição — text area (opcional) */}
      <Text style={[styles.label, { color: c.text }]}>Descrição (opcional)</Text>
      <TextInput
        style={[styles.textarea, { borderColor: c.border, color: c.text, backgroundColor: c.surface }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Mercado da esquina, dividido com fulano..."
        placeholderTextColor={c.textMuted}
        multiline
        numberOfLines={4}
        textAlignVertical="top"
      />

      {showPaidStatus && (
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: c.text }]}>Já foi paga?</Text>
          <Switch
            value={status === 'PAY'}
            onValueChange={(v) => setStatus(v ? 'PAY' : 'NOTPAY')}
            trackColor={{ true: c.primary }}
          />
        </View>
      )}

      {isNew && (
        <>
          <Text style={[styles.label, { color: c.text }]}>Parcelar em quantas vezes?</Text>
          <View style={[styles.stepper, { borderColor: c.border, backgroundColor: c.surface }]}>
            <Pressable
              onPress={() => setInstallments((n) => Math.max(1, n - 1))}
              hitSlop={8}
              style={styles.stepperBtn}
            >
              <MaterialCommunityIcons name="minus" size={20} color={c.primary} />
            </Pressable>
            <Text style={[styles.stepperValue, { color: c.text }]}>
              {installments}x
            </Text>
            <Pressable
              onPress={() => setInstallments((n) => Math.min(36, n + 1))}
              hitSlop={8}
              style={styles.stepperBtn}
            >
              <MaterialCommunityIcons name="plus" size={20} color={c.primary} />
            </Pressable>
          </View>
          {installmentsHint && (
            <Text style={[styles.goalHint, { color: c.textMuted }]}>{installmentsHint}</Text>
          )}
        </>
      )}

      <Pressable
        style={[styles.saveBtn, { backgroundColor: c.primary }]}
        onPress={handleSave}
        disabled={saving}
      >
        {saving ? (
          <ActivityIndicator color={c.primaryContrast} />
        ) : (
          <Text style={[styles.saveText, { color: c.primaryContrast }]}>
            {isNew ? 'Adicionar despesa' : 'Salvar alterações'}
          </Text>
        )}
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={[styles.deleteText, { color: c.danger }]}>Excluir</Text>
        </Pressable>
      )}

      <CalendarModal
        visible={calendarOpen}
        value={date}
        onSelect={setDate}
        onClose={() => setCalendarOpen(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: spacing.xl, gap: 6, paddingBottom: 60 },
  amount: {
    fontSize: 46,
    fontWeight: '800',
    letterSpacing: -1,
    textAlign: 'center',
    paddingVertical: spacing.lg,
    marginBottom: spacing.sm,
  },
  label: { ...type.label, marginTop: spacing.lg, marginBottom: spacing.xs },
  dateField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 14,
  },
  dateText: { fontSize: 16, fontWeight: '600' },
  goalHint: { ...type.caption, marginTop: spacing.sm, lineHeight: 17 },
  textarea: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: 16,
    minHeight: 96,
  },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  stepper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
  },
  stepperBtn: { padding: spacing.xs },
  stepperValue: { fontSize: 18, fontWeight: '800' },
  saveBtn: {
    borderRadius: radius.md,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveText: { ...type.bodyBold, fontSize: 16 },
  deleteBtn: { alignItems: 'center', paddingVertical: 14, marginTop: spacing.xs },
  deleteText: { ...type.bodyBold },
});
