import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';
import type { GhostInstallment } from './api';

interface Props {
  ghost: GhostInstallment;
  onConfirm: () => void;
  onCancel: () => void;
}

/** Card de parcela pendente (fantasma) — ainda não é uma despesa real. */
export function GhostExpenseItem({ ghost, onConfirm, onCancel }: Props) {
  const c = useTheme();
  return (
    <View style={[styles.row, { borderColor: c.border, backgroundColor: c.surfaceAlt }]}>
      <View style={{ opacity: 0.55 }}>
        <CategoryIcon iconKey={ghost.categoryIcon} color={ghost.categoryColor} size={42} />
      </View>

      <View style={styles.middle}>
        <Text style={[styles.description, { color: c.text }]} numberOfLines={1}>
          {ghost.description}
        </Text>
        <Text style={[styles.meta, { color: c.textMuted }]}>
          {ghost.categoryName} · Parcela {ghost.installmentNumber}/{ghost.totalInstallments} ·
          pendente
        </Text>
      </View>

      <View style={styles.right}>
        <Text style={[styles.price, { color: c.textMuted }]}>{formatCurrency(ghost.amount)}</Text>
        <View style={styles.actions}>
          <Pressable
            onPress={onConfirm}
            hitSlop={6}
            style={[styles.actionBtn, { backgroundColor: c.successSoft }]}
          >
            <MaterialCommunityIcons name="check" size={18} color={c.success} />
          </Pressable>
          <Pressable
            onPress={onCancel}
            hitSlop={6}
            style={[styles.actionBtn, { backgroundColor: c.dangerSoft }]}
          >
            <MaterialCommunityIcons name="close" size={18} color={c.danger} />
          </Pressable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderStyle: 'dashed',
    marginBottom: spacing.xs,
  },
  middle: { flex: 1 },
  description: { ...type.bodyBold, fontSize: 16 },
  meta: { ...type.caption, marginTop: 2 },
  right: { alignItems: 'flex-end', gap: spacing.xs },
  price: { fontSize: 15, fontWeight: '700' },
  actions: { flexDirection: 'row', gap: 6 },
  actionBtn: {
    width: 28,
    height: 28,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
