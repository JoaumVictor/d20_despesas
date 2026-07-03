import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency, formatDate } from '@/utils/format';
import type { ExpenseWithCategory } from './api';

interface Props {
  expense: ExpenseWithCategory;
  onPress: () => void;
  onToggleStatus: () => void;
}

export function ExpenseItem({ expense, onPress, onToggleStatus }: Props) {
  const c = useTheme();
  const color = expense.category?.color ?? c.textMuted;
  const paid = expense.status === 'PAY';
  const label = expense.description?.trim() || expense.category?.name || 'Despesa';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <CategoryIcon iconKey={expense.category?.icon} color={color} size={42} />

      <View style={styles.middle}>
        <Text style={[styles.description, { color: c.text }]} numberOfLines={1}>
          {label}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {expense.category?.name ?? 'Sem categoria'} · {formatDate(expense.date_transaction)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, { color: c.text }]}>{formatCurrency(expense.price)}</Text>
        <Pressable onPress={onToggleStatus} hitSlop={8} style={styles.statusBtn}>
          <MaterialCommunityIcons
            name={paid ? 'check-circle' : 'circle-outline'}
            size={22}
            color={paid ? c.success : c.tabInactive}
          />
          <Text style={[styles.statusText, { color: paid ? c.success : c.tabInactive }]}>
            {paid ? 'Paga' : 'Em aberto'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  middle: { flex: 1 },
  description: { fontSize: 16, fontWeight: '600' },
  meta: { fontSize: 13, marginTop: 2 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700' },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
});
