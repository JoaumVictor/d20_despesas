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
  onDelete: () => void;
}

type Urgency = 'normal' | 'warning' | 'overdue';

/** Normal = ainda falta bastante; warning = vence em até 2 dias (ou hoje); overdue = já passou do dia. */
function dueUrgency(dueDay: number, now: Date): Urgency {
  const daysUntil = dueDay - now.getDate();
  if (daysUntil < 0) return 'overdue';
  if (daysUntil <= 2) return 'warning';
  return 'normal';
}

export function ReminderCard({ reminder, onPay, onEdit, onDelete }: Props) {
  const c = useTheme();
  const done = Boolean(reminder.completion);
  const monthLabel = formatMonthLabel(new Date());
  const urgency: Urgency = done ? 'normal' : dueUrgency(reminder.due_day, new Date());

  const cardBg = done
    ? c.successSoft
    : urgency === 'overdue'
      ? c.dangerSoft
      : urgency === 'warning'
        ? c.warningSoft
        : c.surface;
  const cardBorder = done
    ? c.success
    : urgency === 'overdue'
      ? c.danger
      : urgency === 'warning'
        ? c.warning
        : c.border;

  return (
    <View
      style={[
        styles.card,
        shadowCard,
        {
          backgroundColor: cardBg,
          borderColor: cardBorder,
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
          <Text
            style={[
              styles.meta,
              {
                color:
                  urgency === 'overdue' ? c.danger : urgency === 'warning' ? c.warning : c.textMuted,
              },
            ]}
            numberOfLines={1}
          >
            {monthLabel} · dia {reminder.due_day} · {formatCurrency(reminder.amount)}
          </Text>
        </View>
        {done && <MaterialCommunityIcons name="check-circle" size={22} color={c.success} />}
        <Pressable onPress={onEdit} hitSlop={8}>
          <MaterialCommunityIcons name="pencil-outline" size={19} color={c.textMuted} />
        </Pressable>
        <Pressable onPress={onDelete} hitSlop={8}>
          <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.textMuted} />
        </Pressable>
      </View>

      {!done && (
        <Pressable style={[styles.actionBtn, { backgroundColor: c.primary }]} onPress={onPay}>
          <Text style={[styles.actionText, { color: c.primaryContrast }]}>Paguei</Text>
        </Pressable>
      )}
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
  actionBtn: {
    borderRadius: radius.sm,
    paddingVertical: 10,
    alignItems: 'center',
  },
  actionText: { fontSize: 14, fontWeight: '700' },
});
