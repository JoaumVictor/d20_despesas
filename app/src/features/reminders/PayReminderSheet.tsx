import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';
import type { ReminderWithCategory } from './api';

interface Props {
  reminder: ReminderWithCategory | null;
  loading?: boolean;
  onCreateExpense: () => void;
  onDoneOnly: () => void;
  onClose: () => void;
}

/** Ao marcar "Paguei": criar a despesa agora, ou só marcar como concluído. */
export function PayReminderSheet({ reminder, loading, onCreateExpense, onDoneOnly, onClose }: Props) {
  const c = useTheme();
  if (!reminder) return null;

  return (
    <BottomSheet visible={Boolean(reminder)} onClose={onClose} title="Paguei">
      <Text style={[styles.description, { color: c.textMuted }]}>
        {reminder.description} — {formatCurrency(reminder.amount)}. Como você quer marcar isso?
      </Text>

      <Pressable
        style={[styles.option, { borderColor: c.border }]}
        onPress={onCreateExpense}
        disabled={loading}
      >
        <View style={[styles.iconBadge, { backgroundColor: c.primarySoft }]}>
          <MaterialCommunityIcons name="receipt-text-outline" size={18} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: c.text }]}>Criar a despesa agora</Text>
          <Text style={[styles.optionHint, { color: c.textMuted }]}>
            Lança em Despesas e entra nos seus totais e gráficos.
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.option, { borderColor: c.border }]}
        onPress={onDoneOnly}
        disabled={loading}
      >
        <View style={[styles.iconBadge, { backgroundColor: c.successSoft }]}>
          <MaterialCommunityIcons name="check-circle-outline" size={18} color={c.success} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: c.text }]}>Só marcar como concluído</Text>
          <Text style={[styles.optionHint, { color: c.textMuted }]}>
            Fica verde até o mês virar. Não cria despesa nem afeta os totais.
          </Text>
        </View>
      </Pressable>

      {loading && <ActivityIndicator style={{ marginTop: spacing.md }} color={c.primary} />}

      <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
        <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancelar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  description: { ...type.body, lineHeight: 21, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { ...type.bodyBold, fontSize: 15 },
  optionHint: { ...type.caption, marginTop: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { ...type.bodyBold },
});
