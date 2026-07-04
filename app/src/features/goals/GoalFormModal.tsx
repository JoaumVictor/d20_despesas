import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Alert,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategorySelect } from '@/features/categories/CategorySelect';
import { useTheme } from '@/theme/useTheme';
import type { CategoryRow, GoalKind } from '@/types/database';
import { centsToBRL, digitsToCents } from '@/utils/format';
import { firstOfMonthISO } from '@/features/period/period';
import type { GoalInput, GoalWithCategory } from './api';

interface Props {
  visible: boolean;
  categories: CategoryRow[];
  usage: Record<string, number>;
  /** meta em edição (null = nova) */
  editing: GoalWithCategory | null;
  onSubmit: (input: GoalInput) => Promise<void>;
  onClose: () => void;
}

const KINDS: { key: GoalKind; label: string; hint: string; icon: string }[] = [
  { key: 'limit', label: 'Limite', hint: 'gastar no máximo', icon: 'speedometer' },
  { key: 'target', label: 'Alvo', hint: 'quero alcançar', icon: 'flag-checkered' },
];

/** Form de meta: categoria + tipo (limite/alvo) + valor + recorrência. */
export function GoalFormModal({ visible, categories, usage, editing, onSubmit, onClose }: Props) {
  const c = useTheme();
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [kind, setKind] = useState<GoalKind>('limit');
  const [amountCents, setAmountCents] = useState(0);
  const [recurrent, setRecurrent] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (visible) {
      setCategoryId(editing?.category_id ?? null);
      setKind(editing?.kind ?? 'limit');
      setAmountCents(editing ? Math.round(editing.amount * 100) : 0);
      setRecurrent(editing ? editing.month === null : true);
      setSaving(false);
    }
  }, [visible, editing]);

  async function handleSave() {
    if (!categoryId) return Alert.alert('Atenção', 'Escolha uma categoria.');
    if (amountCents <= 0) return Alert.alert('Atenção', 'Informe um valor válido.');
    setSaving(true);
    try {
      await onSubmit({
        categoryId,
        kind,
        amount: amountCents / 100,
        month: recurrent ? null : firstOfMonthISO(new Date()),
      });
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Tente novamente.';
      Alert.alert(
        'Erro ao salvar',
        msg.includes('duplicate') || msg.includes('unique')
          ? 'Já existe uma meta desse tipo para essa categoria.'
          : msg,
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>
              {editing ? 'Editar meta' : 'Nova meta'}
            </Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <Text style={[styles.label, { color: c.textMuted }]}>Tipo</Text>
          <View style={[styles.segment, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
            {KINDS.map((k) => {
              const active = kind === k.key;
              return (
                <Pressable
                  key={k.key}
                  onPress={() => setKind(k.key)}
                  style={[styles.segmentItem, active && { backgroundColor: c.primary }]}
                >
                  <MaterialCommunityIcons
                    name={k.icon as never}
                    size={16}
                    color={active ? c.primaryContrast : c.textMuted}
                  />
                  <Text
                    style={[styles.segmentText, { color: active ? c.primaryContrast : c.textMuted }]}
                  >
                    {k.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: c.textMuted }]}>
            {kind === 'limit'
              ? 'Gastar no máximo esse valor com a categoria no mês.'
              : 'Marca que você quer alcançar na categoria no mês (ex.: investir R$500).'}
          </Text>

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

          <Pressable style={styles.recurrentRow} onPress={() => setRecurrent((r) => !r)}>
            <MaterialCommunityIcons
              name={recurrent ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={22}
              color={recurrent ? c.primary : c.textMuted}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.recurrentText, { color: c.text }]}>Repete todo mês</Text>
              <Text style={[styles.hint, { color: c.textMuted, marginTop: 0 }]}>
                {recurrent ? 'A meta vale para todos os meses.' : 'A meta vale só para este mês.'}
              </Text>
            </View>
          </Pressable>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: c.primary, opacity: saving ? 0.7 : 1 }]}
            onPress={handleSave}
            disabled={saving}
          >
            <Text style={[styles.saveText, { color: c.primaryContrast }]}>
              {editing ? 'Salvar alterações' : 'Criar meta'}
            </Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  title: { fontSize: 18, fontWeight: '800' },
  label: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginTop: 14,
    marginBottom: 8,
  },
  segment: { flexDirection: 'row', borderRadius: 12, borderWidth: 1, padding: 4, gap: 4 },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentText: { fontSize: 14, fontWeight: '600' },
  hint: { fontSize: 12, marginTop: 6, lineHeight: 16 },
  amount: { fontSize: 36, fontWeight: '800', textAlign: 'center', paddingVertical: 8 },
  recurrentRow: { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 16 },
  recurrentText: { fontSize: 15, fontWeight: '600' },
  saveBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center', marginTop: 20 },
  saveText: { fontSize: 16, fontWeight: '700' },
});
