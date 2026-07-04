import type { ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  title: string;
  subtitle?: string;
  /** ação à direita (botão, badge...) */
  right?: ReactNode;
}

/** Cabeçalho padrão das telas (título display + ação à direita). */
export function ScreenHeader({ title, subtitle, right }: Props) {
  const c = useTheme();
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        {subtitle ? (
          <Text style={[styles.subtitle, { color: c.textMuted }]}>{subtitle}</Text>
        ) : null}
        <Text style={[styles.title, { color: c.text }]}>{title}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.sm,
    paddingBottom: spacing.lg,
    gap: spacing.md,
  },
  title: { ...type.title },
  subtitle: { ...type.caption, marginBottom: 2 },
});
