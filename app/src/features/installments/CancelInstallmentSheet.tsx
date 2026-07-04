import { MaterialCommunityIcons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from 'react-native';
import { BottomSheet } from '@/components/BottomSheet';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import type { GhostInstallment } from './api';

interface Props {
  ghost: GhostInstallment | null;
  loading?: boolean;
  onCancelThis: () => void;
  onCancelRemaining: () => void;
  onClose: () => void;
}

/** Escolha ao cancelar uma parcela: só esta, ou esta e todas as futuras. */
export function CancelInstallmentSheet({
  ghost,
  loading,
  onCancelThis,
  onCancelRemaining,
  onClose,
}: Props) {
  const c = useTheme();
  if (!ghost) return null;

  return (
    <BottomSheet visible={Boolean(ghost)} onClose={onClose} title="Cancelar parcela">
      <Text style={[styles.description, { color: c.textMuted }]}>
        {ghost.description} — parcela {ghost.installmentNumber}/{ghost.totalInstallments}. O que
        você quer fazer?
      </Text>

      <Pressable
        style={[styles.option, { borderColor: c.border }]}
        onPress={onCancelThis}
        disabled={loading}
      >
        <View style={[styles.iconBadge, { backgroundColor: c.surfaceAlt }]}>
          <MaterialCommunityIcons name="close" size={18} color={c.textMuted} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: c.text }]}>Cancelar só este mês</Text>
          <Text style={[styles.optionHint, { color: c.textMuted }]}>
            As próximas parcelas continuam normalmente.
          </Text>
        </View>
      </Pressable>

      <Pressable
        style={[styles.option, { borderColor: c.dangerSoft, backgroundColor: c.dangerSoft }]}
        onPress={onCancelRemaining}
        disabled={loading}
      >
        <View style={[styles.iconBadge, { backgroundColor: c.surface }]}>
          <MaterialCommunityIcons name="close-octagon-outline" size={18} color={c.danger} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.optionTitle, { color: c.danger }]}>
            Cancelar esta e todas as futuras
          </Text>
          <Text style={[styles.optionHint, { color: c.textMuted }]}>
            Encerra a compra parcelada a partir de agora.
          </Text>
        </View>
      </Pressable>

      {loading && <ActivityIndicator style={{ marginTop: spacing.md }} color={c.primary} />}

      <Pressable style={styles.cancelBtn} onPress={onClose} disabled={loading}>
        <Text style={[styles.cancelText, { color: c.textMuted }]}>Voltar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  description: { ...type.body, lineHeight: 21, marginBottom: spacing.lg },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionTitle: { ...type.bodyBold, fontSize: 15 },
  optionHint: { ...type.caption, marginTop: 1 },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { ...type.bodyBold },
});
