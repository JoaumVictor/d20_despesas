import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { formatCurrency, formatDate } from '@/utils/format';
import type { ExpenseWithCategory } from './api';

interface Props {
  expense: ExpenseWithCategory;
  onPress: () => void;
  onToggleStatus: () => void;
}

export function ExpenseItem({ expense, onPress, onToggleStatus }: Props) {
  const color = expense.category?.color ?? '#9ca3af';
  const icon = (expense.category?.icon ?? 'cash') as keyof typeof MaterialCommunityIcons.glyphMap;
  const paid = expense.status === 'PAY';

  return (
    <Pressable style={styles.row} onPress={onPress}>
      <View style={[styles.iconWrap, { backgroundColor: color }]}>
        <MaterialCommunityIcons name={icon} size={20} color="#fff" />
      </View>

      <View style={styles.middle}>
        <Text style={styles.description} numberOfLines={1}>
          {expense.description}
        </Text>
        <Text style={styles.meta}>
          {expense.category?.name ?? 'Sem categoria'} · {formatDate(expense.date_transaction)}
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={styles.price}>{formatCurrency(expense.price)}</Text>
        <Pressable onPress={onToggleStatus} hitSlop={8} style={styles.statusBtn}>
          <MaterialCommunityIcons
            name={paid ? 'check-circle' : 'circle-outline'}
            size={22}
            color={paid ? '#16a34a' : '#9ca3af'}
          />
          <Text style={[styles.statusText, { color: paid ? '#16a34a' : '#9ca3af' }]}>
            {paid ? 'Paga' : 'Em aberto'}
          </Text>
        </Pressable>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12 },
  iconWrap: { width: 42, height: 42, borderRadius: 21, alignItems: 'center', justifyContent: 'center' },
  middle: { flex: 1 },
  description: { fontSize: 16, fontWeight: '600', color: '#111827' },
  meta: { fontSize: 13, color: '#6b7280', marginTop: 2 },
  right: { alignItems: 'flex-end' },
  price: { fontSize: 16, fontWeight: '700', color: '#111827' },
  statusBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4 },
  statusText: { fontSize: 12, fontWeight: '600' },
});
