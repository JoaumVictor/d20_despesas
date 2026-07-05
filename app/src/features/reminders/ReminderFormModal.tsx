import { useEffect, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { CategorySelect } from '@/features/categories/CategorySelect';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { CategoryRow } from '@/types/database';
import { centsToBRL, digitsToCents } from '@/utils/format';
import type { ReminderInput, ReminderWithCategory } from './api';

interface Props {
  visible: boolean;
  categories: CategoryRow[];
  usage: Record<string, number>;
  /** lembrete em edição (null = novo) */
  editing: ReminderWithCategory | null;
  /** dados pré-preenchidos (ex.: vindo de uma sugestão aceita), ignorado se `editing` */
  prefill?: { description: string; categoryId: string; amountCents: number; dueDay: number } | null;
  onSubmit: (input: ReminderInput) => Promise<void>;
  onClose: () => void;
}

/** Form de lembrete fixo: nome, categoria, valor, dia de vencimento. */
export function ReminderFormModal({
  visible,
  categories,
  usage,
  editing,
  prefill,
  onSubmit,
  onClose,
}: Props) {
  const c = useTheme();
  const [description, setDescription] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [amountCents, setAmountCents] = useState(0);
  const [dueDay, setDueDay] = useState(5);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setDescription(editing?.description ?? prefill?.description ?? '');
      setCategoryId(editing?.category_id ?? prefill?.categoryId ?? null);
      setAmountCents(editing ? Math.round(editing.amount * 100) : (prefill?.amountCents ?? 0));
      setDueDay(editing?.due_day ?? prefill?.dueDay ?? 5);
      setSaving(false);
    }
  }, [visible, editing, prefill]);

  async function handleSave() {
    if (!description.trim()) return Alert.alert('Atenção', 'Dê um nome ao lembrete.');
    if (!categoryId) return Alert.alert('Atenção', 'Escolha uma categoria.');
    if (amountCents <= 0) return Alert.alert('Atenção', 'Informe um valor válido.');
    setSaving(true);
    try {
      await onSubmit({
        description: description.trim(),
        categoryId,
        amount: amountCents / 100,
        dueDay,
      });
      onClose();
    } catch (err) {
      Alert.alert('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <BottomSheet visible={visible} onClose={onClose} title={editing ? 'Editar lembrete' : 'Novo lembrete'}>
      <Text style={[styles.label, { color: c.textMuted }]}>Nome</Text>
      <TextInput
        style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surfaceAlt }]}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Internet"
        placeholderTextColor={c.textMuted}
      />

      <Text style={[styles.label, { color: c.textMuted }]}>Categoria</Text>
      <CategorySelect
        categories={categories}
        usage={usage}
        value={categoryId}
        onChange={setCategoryId}
      />

      <Text style={[styles.label, { color: c.textMuted }]}>Valor</Text>
      <TextInput
        style={[styles.amount, { color: c.primary }]}
        value={centsToBRL(amountCents)}
        onChangeText={(t) => setAmountCents(digitsToCents(t))}
        keyboardType="number-pad"
        selectionColor={c.primary}
      />

      <Text style={[styles.label, { color: c.textMuted }]}>Dia de vencimento no mês</Text>
      <BottomSheetStepper value={dueDay} onChange={setDueDay} />

      <Pressable
        style={({ pressed }) => [
          styles.saveBtn,
          { backgroundColor: pressed ? c.primaryPressed : c.primary, opacity: saving ? 0.7 : 1 },
        ]}
        onPress={handleSave}
        disabled={saving}
      >
        <Text style={[styles.saveText, { color: c.primaryContrast }]}>
          {editing ? 'Salvar alterações' : 'Criar lembrete'}
        </Text>
      </Pressable>
    </BottomSheet>
  );
}

/** Stepper simples de dia do mês (1..31). */
function BottomSheetStepper({ value, onChange }: { value: number; onChange: (n: number) => void }) {
  const c = useTheme();
  return (
    <View style={[styles.stepper, { borderColor: c.border, backgroundColor: c.surface }]}>
      <Pressable onPress={() => onChange(Math.max(1, value - 1))} hitSlop={8} style={styles.stepperBtn}>
        <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800' }}>−</Text>
      </Pressable>
      <Text style={[styles.stepperValue, { color: c.text }]}>Dia {value}</Text>
      <Pressable onPress={() => onChange(Math.min(31, value + 1))} hitSlop={8} style={styles.stepperBtn}>
        <Text style={{ color: c.primary, fontSize: 20, fontWeight: '800' }}>+</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  label: { ...type.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
  },
  amount: { fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: spacing.sm },
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
  stepperValue: { fontSize: 16, fontWeight: '800' },
  saveBtn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveText: { ...type.bodyBold, fontSize: 16 },
});
