import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { CategoryRow } from '@/types/database';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  categories: CategoryRow[];
  usage: Record<string, number>;
  value: string | null;
  onChange: (id: string) => void;
}

/** Select de categoria (modal), ordenado pelas mais usadas. */
export function CategorySelect({ categories, usage, value, onChange }: Props) {
  const c = useTheme();
  const [open, setOpen] = useState(false);

  const ordered = useMemo(
    () =>
      [...categories].sort(
        (a, b) =>
          (usage[b.id] ?? 0) - (usage[a.id] ?? 0) || (a.id_sort ?? 0) - (b.id_sort ?? 0),
      ),
    [categories, usage],
  );

  const selected = categories.find((cat) => cat.id === value) ?? null;

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.field, { borderColor: c.border, backgroundColor: c.surface }]}
      >
        {selected ? (
          <>
            <CategoryIcon iconKey={selected.icon} color={selected.color} size={30} />
            <Text style={[styles.fieldText, { color: c.text }]}>{selected.name}</Text>
          </>
        ) : (
          <Text style={[styles.fieldText, { color: c.textMuted }]}>Escolha uma categoria</Text>
        )}
        <MaterialCommunityIcons name="chevron-down" size={22} color={c.textMuted} />
      </Pressable>

      <Modal visible={open} transparent animationType="slide" onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)}>
          <Pressable
            style={[styles.sheet, { backgroundColor: c.surface }]}
            onPress={() => {}}
          >
            <View style={styles.sheetHeader}>
              <Text style={[styles.sheetTitle, { color: c.text }]}>Categoria</Text>
              <Pressable onPress={() => setOpen(false)} hitSlop={8}>
                <MaterialCommunityIcons name="close" size={22} color={c.textMuted} />
              </Pressable>
            </View>
            <ScrollView style={{ maxHeight: 420 }}>
              {ordered.map((cat) => {
                const active = cat.id === value;
                return (
                  <Pressable
                    key={cat.id}
                    onPress={() => {
                      onChange(cat.id);
                      setOpen(false);
                    }}
                    style={[styles.row, { borderBottomColor: c.border }]}
                  >
                    <CategoryIcon iconKey={cat.icon} color={cat.color} size={34} />
                    <Text style={[styles.rowText, { color: c.text }]}>{cat.name}</Text>
                    {active && (
                      <MaterialCommunityIcons name="check" size={20} color={c.primary} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 8,
  },
  fieldText: { flex: 1, fontSize: 16, fontWeight: '500' },
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'flex-end' },
  sheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 16, paddingBottom: 28 },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: { fontSize: 18, fontWeight: '800' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  rowText: { flex: 1, fontSize: 16 },
});
