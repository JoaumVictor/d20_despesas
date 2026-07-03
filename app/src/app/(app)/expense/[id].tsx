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
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories/api';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpense,
  useUpdateExpense,
  type ExpenseInput,
} from '@/features/expenses/api';
import type { ExpenseStatus } from '@/types/database';
import { toISODate } from '@/utils/format';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const { session } = useAuth();
  const userId = session?.user.id;

  const { data: categories } = useCategories(userId);
  const { data: existing, isLoading: loadingExpense } = useExpense(id);
  const createExpense = useCreateExpense(userId ?? '');
  const updateExpense = useUpdateExpense();
  const deleteExpense = useDeleteExpense();

  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<string | null>(null);
  const [date, setDate] = useState(() => toISODate(new Date()));
  const [status, setStatus] = useState<ExpenseStatus>('NOTPAY');
  const [recurrent, setRecurrent] = useState(false);

  // Preenche o formulário quando estiver editando.
  useEffect(() => {
    if (existing) {
      setDescription(existing.description);
      setPrice(String(existing.price));
      setCategoryId(existing.category_id);
      setDate(existing.date_transaction.slice(0, 10));
      setStatus(existing.status);
      setRecurrent(Boolean(existing.recurrent_id));
    }
  }, [existing]);

  const saving = createExpense.isPending || updateExpense.isPending;

  async function handleSave() {
    const parsedPrice = Number(price.replace(',', '.'));
    if (!description.trim()) return Alert.alert('Atenção', 'Informe uma descrição.');
    if (!categoryId) return Alert.alert('Atenção', 'Escolha uma categoria.');
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
      return Alert.alert('Atenção', 'Informe um valor válido.');

    const input: ExpenseInput = {
      description: description.trim(),
      price: parsedPrice,
      categoryId,
      dateTransaction: date,
      status,
      recurrent,
    };

    try {
      if (isNew) {
        await createExpense.mutateAsync(input);
      } else {
        await updateExpense.mutateAsync({ id: id as string, input });
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
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" />;
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.label}>Descrição</Text>
      <TextInput
        style={styles.input}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Mercado"
      />

      <Text style={styles.label}>Valor (R$)</Text>
      <TextInput
        style={styles.input}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="0,00"
      />

      <Text style={styles.label}>Data</Text>
      <TextInput
        style={styles.input}
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        autoCapitalize="none"
      />

      <Text style={styles.label}>Categoria</Text>
      <View style={styles.categoryGrid}>
        {(categories ?? []).map((cat) => {
          const selected = cat.id === categoryId;
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[
                styles.categoryChip,
                { borderColor: cat.color },
                selected && { backgroundColor: cat.color },
              ]}
            >
              <MaterialCommunityIcons
                name={cat.icon as keyof typeof MaterialCommunityIcons.glyphMap}
                size={16}
                color={selected ? '#fff' : cat.color}
              />
              <Text style={[styles.categoryText, { color: selected ? '#fff' : '#374151' }]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <View style={styles.switchRow}>
        <Text style={styles.label}>Já foi paga?</Text>
        <Switch
          value={status === 'PAY'}
          onValueChange={(v) => setStatus(v ? 'PAY' : 'NOTPAY')}
        />
      </View>

      {isNew && (
        <View style={styles.switchRow}>
          <Text style={styles.label}>Repete no próximo mês?</Text>
          <Switch value={recurrent} onValueChange={setRecurrent} />
        </View>
      )}

      <Pressable style={styles.saveBtn} onPress={handleSave} disabled={saving}>
        {saving ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.saveText}>{isNew ? 'Adicionar despesa' : 'Salvar alterações'}</Text>
        )}
      </Pressable>

      {!isNew && (
        <Pressable style={styles.deleteBtn} onPress={handleDelete}>
          <Text style={styles.deleteText}>Excluir</Text>
        </Pressable>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  content: { padding: 20, gap: 6, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '600', color: '#374151', marginTop: 12 },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 4 },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  categoryText: { fontSize: 13, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  saveBtn: {
    backgroundColor: '#4f46e5',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  saveText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  deleteText: { color: '#dc2626', fontSize: 15, fontWeight: '600' },
});
