import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import {
  Modal,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
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

/** Modal de filtros: categorias (multi) + faixa de valor. O texto fica na barra. */
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

  function parseValue(text: string): number | null {
    const digits = text.replace(/\D/g, '');
    return digits ? digitsToCents(text) : null;
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

  const valueInput = [styles.valueInput, { borderColor: c.border, color: c.text, backgroundColor: c.bg }];

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={[styles.sheet, { backgroundColor: c.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: c.text }]}>Filtros</Text>
            <Pressable onPress={onClose} hitSlop={8}>
              <MaterialCommunityIcons name="close" size={22} color={c.textMuted} />
            </Pressable>
          </View>

          <View style={[styles.searchBox, { backgroundColor: c.bg, borderColor: c.border }]}>
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
          <ScrollView style={{ maxHeight: 220 }}>
            <View style={styles.chips}>
              {categories.map((cat) => {
                const active = categoryIds.includes(cat.id);
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => toggleCategory(cat.id)}
                    style={[
                      styles.chip,
                      { borderColor: active ? cat.color : c.border, backgroundColor: c.bg },
                      active && { backgroundColor: `${cat.color}22` },
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
            <Pressable style={[styles.applyBtn, { backgroundColor: c.primary }]} onPress={apply}>
              <Text style={[styles.applyText, { color: c.primaryContrast }]}>Aplicar</Text>
            </Pressable>
          </View>
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
    marginBottom: 8,
  },
  title: { fontSize: 18, fontWeight: '800' },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderWidth: 1,
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 46,
    marginTop: 4,
  },
  searchInput: { flex: 1, fontSize: 15, paddingVertical: 0 },
  label: { fontSize: 13, fontWeight: '600', textTransform: 'uppercase', marginTop: 12, marginBottom: 8 },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1.5,
    borderRadius: 20,
    paddingVertical: 5,
    paddingHorizontal: 10,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  valueRow: { flexDirection: 'row', gap: 12 },
  valueInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
  },
  actions: { flexDirection: 'row', gap: 12, marginTop: 20 },
  clearBtn: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  clearText: { fontSize: 15, fontWeight: '600' },
  applyBtn: { flex: 2, borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  applyText: { fontSize: 15, fontWeight: '700' },
});
