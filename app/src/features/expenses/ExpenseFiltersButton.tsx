import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthContext';
import { useCategories } from '@/features/categories/api';
import { useAppStore } from '@/store/appStore';
import { radius } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { ExpenseFiltersModal } from './ExpenseFiltersModal';
import { activeFilterCount } from './filters';

/**
 * Botão de filtros (com badge do nº de filtros ativos) + o modal.
 * O estado mora no appStore, então Despesas e Gráficos compartilham os mesmos
 * filtros ao trocar de aba — igual ao período.
 */
export function ExpenseFiltersButton() {
  const c = useTheme();
  const { session } = useAuth();
  const { data: categories } = useCategories(session?.user.id);
  const filters = useAppStore((s) => s.filters);
  const setFilters = useAppStore((s) => s.setFilters);
  const [open, setOpen] = useState(false);

  const count = activeFilterCount(filters);

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        style={[styles.button, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}
      >
        <MaterialCommunityIcons
          name="tune-variant"
          size={22}
          color={count > 0 ? c.primary : c.textMuted}
        />
        {count > 0 && (
          <View style={[styles.badge, { backgroundColor: c.primary }]}>
            <Text style={[styles.badgeText, { color: c.primaryContrast }]}>{count}</Text>
          </View>
        )}
      </Pressable>

      <ExpenseFiltersModal
        visible={open}
        categories={categories ?? []}
        value={filters}
        onApply={setFilters}
        onClose={() => setOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  button: {
    width: 46,
    height: 46,
    borderRadius: radius.md,
    borderWidth: StyleSheet.hairlineWidth,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badge: {
    position: 'absolute',
    top: -5,
    right: -5,
    minWidth: 19,
    height: 19,
    borderRadius: radius.pill,
    paddingHorizontal: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeText: { fontSize: 11, fontWeight: '800' },
});
