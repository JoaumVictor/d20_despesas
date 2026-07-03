import { useLocalSearchParams, useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { categoryImage } from '@/features/categories/categoryImages';
import { useCategories } from '@/features/categories/api';
import { useAuth } from '@/features/auth/AuthContext';
import {
  useCreateExpense,
  useDeleteExpense,
  useExpense,
  useUpdateExpense,
  type ExpenseInput,
} from '@/features/expenses/api';
import type { ExpenseStatus } from '@/types/database';
import { useTheme } from '@/theme/useTheme';
import { toISODate } from '@/utils/format';

export default function ExpenseFormScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const isNew = id === 'new';
  const router = useRouter();
  const c = useTheme();
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
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0)
      return Alert.alert('Atenção', 'Informe um valor válido.');
    if (!categoryId) return Alert.alert('Atenção', 'Escolha uma categoria.');

    const input: ExpenseInput = {
      description: description.trim(), // opcional
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
    return <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />;
  }

  const inputStyle = [styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surface }];

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: c.bg }]}
      contentContainerStyle={styles.content}
    >
      {/* 1. Valor */}
      <Text style={[styles.label, { color: c.text }]}>Valor (R$)</Text>
      <TextInput
        style={inputStyle}
        value={price}
        onChangeText={setPrice}
        keyboardType="decimal-pad"
        placeholder="0,00"
        placeholderTextColor={c.textMuted}
      />

      {/* 2. Categoria */}
      <Text style={[styles.label, { color: c.text }]}>Categoria</Text>
      <View style={styles.categoryGrid}>
        {(categories ?? []).map((cat) => {
          const selected = cat.id === categoryId;
          const img = categoryImage(cat.icon);
          return (
            <Pressable
              key={cat.id}
              onPress={() => setCategoryId(cat.id)}
              style={[
                styles.categoryChip,
                { borderColor: cat.color, backgroundColor: c.surface },
                selected && { backgroundColor: cat.color },
              ]}
            >
              {img ? (
                <Image source={img} style={styles.chipImg} resizeMode="contain" />
              ) : null}
              <Text style={[styles.categoryText, { color: selected ? '#fff' : c.text }]}>
                {cat.name}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {/* 3. Data */}
      <Text style={[styles.label, { color: c.text }]}>Data</Text>
      <TextInput
        style={inputStyle}
        value={date}
        onChangeText={setDate}
        placeholder="AAAA-MM-DD"
        placeholderTextColor={c.textMuted}
        autoCapitalize="none"
      />

      {/* 4. Descrição (opcional) */}
      <Text style={[styles.label, { color: c.text }]}>Descrição (opcional)</Text>
      <TextInput
        style={inputStyle}
        value={description}
        onChangeText={setDescription}
        placeholder="Ex: Mercado da esquina"
        placeholderTextColor={c.textMuted}
      />

      {/* 5. Já foi paga? */}
      <View style={styles.switchRow}>
        <Text style={[styles.label, { color: c.text }]}>Já foi paga?</Text>
        <Switch
          value={status === 'PAY'}
          onValueChange={(v) => setStatus(v ? 'PAY' : 'NOTPAY')}
          trackColor={{ true: c.primary }}
        />
      </View>

      {/* 6. Repete no próximo mês? */}
      {isNew && (
        <View style={styles.switchRow}>
          <Text style={[styles.label, { color: c.text }]}>Repete no próximo mês?</Text>
          <Switch value={recurrent} onValueChange={setRecurrent} trackColor={{ true: c.primary }} />
        </View>
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
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 20, gap: 6, paddingBottom: 60 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12 },
  input: {
    borderWidth: 1,
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
  chipImg: { width: 18, height: 18 },
  categoryText: { fontSize: 13, fontWeight: '600' },
  switchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 8,
  },
  saveBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center', marginTop: 24 },
  saveText: { fontSize: 16, fontWeight: '700' },
  deleteBtn: { alignItems: 'center', paddingVertical: 14, marginTop: 4 },
  deleteText: { fontSize: 15, fontWeight: '600' },
});
