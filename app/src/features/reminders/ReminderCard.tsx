import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency, formatMonthLabel } from '@/utils/format';
import type { MonthReminder } from './api';

interface Props {
  reminder: MonthReminder;
  onPay: () => void;
  onEdit: () => void;
}

export function ReminderCard({ reminder, onPay, onEdit }: Props) {
  const c = useTheme();
  const done = Boolean(reminder.completion);
  const monthLabel = formatMonthLabel(new Date());

  return (
    <View
      style={[
        styles.card,
        shadowCard,
        {
          backgroundColor: done ? c.successSoft : c.surface,
          borderColor: done ? c.success : c.border,
        },
      ]}
    >
      <View style={styles.top}>
        <CategoryIcon
          iconKey={reminder.category?.icon}
          color={reminder.category?.color ?? c.textMuted}
          size={38}
        />
        <View style={{ flex: 1 }}>
          <Text style={[styles.name, { color: c.text }]} numberOfLines={1}>
            {reminder.description}
          </Text>
          <Text style={[styles.meta, { color: c.textMuted }]} numberOfLines={1}>
            {monthLabel} · dia {reminder.due_day} · {formatCurrency(reminder.amount)}
          </Text>
        </View>
        {done && <MaterialCommunityIcons name="check-circle" size={22} color={c.success} />}
      </View>

      <View style={styles.actions}>
        {done ? (
          <View style={[styles.doneTag, { backgroundColor: c.success }]}>
            <MaterialCommunityIcons name="check" size={14} color="#FFFFFF" />
            <Text style={styles.doneText}>
              {reminder.completion?.resolution === 'expense' ? 'Pago' : 'Concluído'}
            </Text>
          </View>
        ) : (
          <Pressable
            style={[styles.actionBtn, { backgroundColor: c.primary }]}
            onPress={onPay}
          >
            <Text style={[styles.actionText, { color: c.primaryContrast }]}>Paguei</Text>
          </Pressable>
        )}
        <Pressable
          style={[styles.actionBtn, styles.editBtn, { borderColor: c.border }]}
          onPress={onEdit}
        >
          <Text style={[styles.actionText, { color: c.textMuted }]}>Editar</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  name: { ...type.heading, fontSize: 16 },
  meta: { ...type.caption, marginTop: 1 },
  actions: { flexDirection: 'row', gap: spacing.sm },
  actionBtn: {
    flex: 1,
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  editBtn: { borderWidth: StyleSheet.hairlineWidth, flex: 1 },
  actionText: { fontSize: 14, fontWeight: '700' },
  doneTag: {
    flex: 1,
    flexDirection: 'row',
    gap: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: radius.sm,
    paddingVertical: 10,
  },
  doneText: { color: '#FFFFFF', fontSize: 14, fontWeight: '700' },
});
