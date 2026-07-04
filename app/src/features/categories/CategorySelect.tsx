import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { CategoryRow } from '@/types/database';
import { CategoryIcon } from './CategoryIcon';

interface Props {
  categories: CategoryRow[];
  usage: Record<string, number>;
  value: string | null;
  onChange: (id: string) => void;
}

/** Select de categoria (bottom sheet), ordenado pelas mais usadas. */
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

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Categoria">
        <ScrollView style={{ maxHeight: 440 }} showsVerticalScrollIndicator={false}>
          {ordered.map((cat) => {
            const active = cat.id === value;
            return (
              <Pressable
                key={cat.id}
                onPress={() => {
                  onChange(cat.id);
                  setOpen(false);
                }}
                style={[
                  styles.row,
                  { borderBottomColor: c.border },
                  active && { backgroundColor: c.primarySoft, borderRadius: radius.md },
                ]}
              >
                <CategoryIcon iconKey={cat.icon} color={cat.color} size={34} />
                <Text style={[styles.rowText, { color: c.text }]}>{cat.name}</Text>
                {active && <MaterialCommunityIcons name="check" size={20} color={c.primary} />}
              </Pressable>
            );
          })}
        </ScrollView>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 9,
  },
  fieldText: { flex: 1, ...type.body, fontWeight: '600' },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  rowText: { flex: 1, ...type.body, fontWeight: '500' },
});
