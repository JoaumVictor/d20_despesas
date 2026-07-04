import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { CategoryRow } from '@/types/database';
import { centsToBRL, digitsToCents } from '@/utils/format';
import type { ExpenseFilters } from './filters';

interface Props {
  visible: boolean;
  categories: CategoryRow[];
  value: ExpenseFilters;
  onApply: (next: ExpenseFilters) => void;
  onClose: () => void;
}

/** Filtros da lista: busca por texto, categorias (multi) e faixa de valor. */
export function ExpenseFiltersModal({ visible, categories, value, onApply, onClose }: Props) {
  const c = useTheme();
  const [text, setText] = useState(value.text);
  const [categoryIds, setCategoryIds] = useState<string[]>(value.categoryIds);
  const [minCents, setMinCents] = useState<number | null>(value.minCents);
  const [maxCents, setMaxCents] = useState<number | null>(value.maxCents);

  useEffect(() => {
    if (visible) {
      setText(value.text);
      setCategoryIds(value.categoryIds);
      setMinCents(value.minCents);
      setMaxCents(value.maxCents);
    }
  }, [visible, value]);

  function toggleCategory(id: string) {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
  }

  function parseValue(t: string): number | null {
    const digits = t.replace(/\D/g, '');
    return digits ? digitsToCents(t) : null;
  }

  function clearAll() {
    setText('');
    setCategoryIds([]);
    setMinCents(null);
    setMaxCents(null);
  }

  function apply() {
    onApply({ ...value, text, categoryIds, minCents, maxCents });
    onClose();
  }

  const valueInput = [
    styles.valueInput,
    { color: c.text, backgroundColor: c.surfaceAlt },
  ];

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Filtros">
      <View style={[styles.searchBox, { backgroundColor: c.surfaceAlt }]}>
        <MaterialCommunityIcons name="magnify" size={20} color={c.textMuted} />
        <TextInput
          style={[styles.searchInput, { color: c.text }]}
          value={text}
          onChangeText={setText}
          placeholder="Buscar descrição ou categoria"
          placeholderTextColor={c.textMuted}
        />
        {text.length > 0 && (
          <Pressable onPress={() => setText('')} hitSlop={8}>
            <MaterialCommunityIcons name="close-circle" size={18} color={c.textMuted} />
          </Pressable>
        )}
      </View>

      <Text style={[styles.label, { color: c.textMuted }]}>Categorias</Text>
      <ScrollView style={{ maxHeight: 210 }} showsVerticalScrollIndicator={false}>
        <View style={styles.chips}>
          {categories.map((cat) => {
            const active = categoryIds.includes(cat.id);
            return (
              <Pressable
                key={cat.id}
                onPress={() => toggleCategory(cat.id)}
                style={[
                  styles.chip,
                  {
                    borderColor: active ? cat.color : c.border,
                    backgroundColor: active ? `${cat.color}1F` : c.surface,
                  },
                ]}
              >
                <CategoryIcon iconKey={cat.icon} color={cat.color} size={22} />
                <Text style={[styles.chipText, { color: c.text }]}>{cat.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </ScrollView>

      <Text style={[styles.label, { color: c.textMuted }]}>Faixa de valor</Text>
      <View style={styles.valueRow}>
        <TextInput
          style={valueInput}
          value={minCents == null ? '' : centsToBRL(minCents)}
          onChangeText={(t) => setMinCents(parseValue(t))}
          keyboardType="number-pad"
          placeholder="Mínimo"
          placeholderTextColor={c.textMuted}
        />
        <TextInput
          style={valueInput}
          value={maxCents == null ? '' : centsToBRL(maxCents)}
          onChangeText={(t) => setMaxCents(parseValue(t))}
          keyboardType="number-pad"
          placeholder="Máximo"
          placeholderTextColor={c.textMuted}
        />
      </View>

      <View style={styles.actions}>
        <Pressable style={[styles.clearBtn, { borderColor: c.border }]} onPress={clearAll}>
          <Text style={[styles.clearText, { color: c.textMuted }]}>Limpar</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [
            styles.applyBtn,
            { backgroundColor: pressed ? c.primaryPressed : c.primary },
          ]}
          onPress={apply}
        >
          <Text style={[styles.applyText, { color: c.primaryContrast }]}>Aplicar</Text>
        </Pressable>
      </View>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    height: 48,
    marginTop: spacing.xs,
  },
  searchInput: { flex: 1, ...type.body, paddingVertical: 0 },
  label: { ...type.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: radius.pill,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  valueRow: { flexDirection: 'row', gap: spacing.md },
  valueInput: {
    flex: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.xxl },
  clearBtn: {
    flex: 1,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
  },
  clearText: { ...type.bodyBold },
  applyBtn: { flex: 2, borderRadius: radius.md, paddingVertical: 15, alignItems: 'center' },
  applyText: { ...type.bodyBold },
});
