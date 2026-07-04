import { MaterialCommunityIcons } from '@expo/vector-icons';
import type { ReactNode } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { radius, shadowFloating, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

interface Props {
  visible: boolean;
  onClose: () => void;
  /** título opcional com botão de fechar */
  title?: string;
  children: ReactNode;
}

/**
 * Bottom sheet padrão do app: backdrop, cantos superiores arredondados,
 * handle central e cabeçalho opcional. Todos os modais usam este wrapper
 * para manter o mesmo visual.
 */
export function BottomSheet({ visible, onClose, title, children }: Props) {
  const c = useTheme();
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.sheet, shadowFloating, { backgroundColor: c.surface }]}
          onPress={() => {}}
        >
          <View style={[styles.handle, { backgroundColor: c.border }]} />
          {title ? (
            <View style={styles.header}>
              <Text style={[styles.title, { color: c.text }]}>{title}</Text>
              <Pressable
                onPress={onClose}
                hitSlop={10}
                style={[styles.closeBtn, { backgroundColor: c.surfaceAlt }]}
              >
                <MaterialCommunityIcons name="close" size={18} color={c.textMuted} />
              </Pressable>
            </View>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, justifyContent: 'flex-end' },
  sheet: {
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
    paddingHorizontal: spacing.xl,
    paddingBottom: spacing.xxxl,
    paddingTop: spacing.sm,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: radius.pill,
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: { ...type.title, fontSize: 19 },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: radius.pill,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
