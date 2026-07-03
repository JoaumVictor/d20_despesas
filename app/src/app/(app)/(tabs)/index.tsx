import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ExpenseItem } from '@/features/expenses/ExpenseItem';
import { useExpenses, useToggleStatus } from '@/features/expenses/api';
import { formatCurrency, formatMonthLabel } from '@/utils/format';

export default function ExpensesScreen() {
  const router = useRouter();
  const [reference, setReference] = useState(() => new Date());

  const { data, isLoading, isRefetching, refetch, error } = useExpenses(reference);
  const toggleStatus = useToggleStatus();

  const total = useMemo(
    () => (data ?? []).reduce((sum, e) => sum + e.price, 0),
    [data],
  );

  function shiftMonth(delta: number) {
    setReference((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.hello}>Suas despesas</Text>
        <Text style={styles.total}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.monthBar}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#4f46e5" />
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthLabel(reference)}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#4f46e5" />
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : error ? (
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Erro ao carregar despesas.</Text>
          <Pressable onPress={() => refetch()}>
            <Text style={styles.retry}>Tentar novamente</Text>
          </Pressable>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={refetch} />
          }
          ItemSeparatorComponent={() => <View style={styles.sep} />}
          renderItem={({ item }) => (
            <ExpenseItem
              expense={item}
              onPress={() => router.push(`/expense/${item.id}`)}
              onToggleStatus={() =>
                toggleStatus.mutate({
                  id: item.id,
                  status: item.status === 'PAY' ? 'NOTPAY' : 'PAY',
                })
              }
            />
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="tray" size={48} color="#d1d5db" />
              <Text style={styles.emptyText}>Nenhuma despesa neste mês.</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  hello: { fontSize: 14, color: '#6b7280' },
  total: { fontSize: 30, fontWeight: '800', color: '#111827' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  monthLabel: { fontSize: 16, fontWeight: '600', color: '#111827', textTransform: 'capitalize' },
  listContent: { paddingHorizontal: 20, paddingBottom: 24 },
  sep: { height: 1, backgroundColor: '#f3f4f6' },
  empty: { alignItems: 'center', gap: 8, marginTop: 60 },
  emptyText: { color: '#6b7280', fontSize: 15 },
  retry: { color: '#4f46e5', fontWeight: '600', marginTop: 4 },
});
