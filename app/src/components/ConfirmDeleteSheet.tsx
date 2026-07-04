import { useEffect, useState } from 'react';
import { ActivityIndicator, Pressable, StyleSheet, Text, TextInput, View } from 'react-native';
import { radius, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { BottomSheet } from './BottomSheet';

const CONFIRM_WORD = 'EXCLUIR';

interface Props {
  visible: boolean;
  title: string;
  description: string;
  confirmLabel: string;
  loading?: boolean;
  onConfirm: () => void;
  onClose: () => void;
}

/**
 * Bottom sheet de confirmação reforçada: só libera o botão destrutivo depois
 * do usuário digitar "EXCLUIR". Usado para ações irreversíveis de alto impacto.
 */
export function ConfirmDeleteSheet({
  visible,
  title,
  description,
  confirmLabel,
  loading,
  onConfirm,
  onClose,
}: Props) {
  const c = useTheme();
  const [text, setText] = useState('');

  useEffect(() => {
    if (visible) setText('');
  }, [visible]);

  const canConfirm = text.trim().toLocaleUpperCase('pt-BR') === CONFIRM_WORD;

  return (
    <BottomSheet visible={visible} onClose={onClose} title={title}>
      <Text style={[styles.description, { color: c.textMuted }]}>{description}</Text>

      <Text style={[styles.label, { color: c.textMuted }]}>
        Digite <Text style={{ color: c.danger, fontWeight: '800' }}>{CONFIRM_WORD}</Text> para
        confirmar
      </Text>
      <TextInput
        style={[
          styles.input,
          { borderColor: canConfirm ? c.danger : c.border, color: c.text, backgroundColor: c.surfaceAlt },
        ]}
        value={text}
        onChangeText={setText}
        autoCapitalize="characters"
        autoCorrect={false}
        placeholder={CONFIRM_WORD}
        placeholderTextColor={c.textMuted}
      />

      <Pressable
        style={[
          styles.confirmBtn,
          { backgroundColor: canConfirm ? c.danger : c.surfaceAlt, opacity: loading ? 0.7 : 1 },
        ]}
        onPress={onConfirm}
        disabled={!canConfirm || loading}
      >
        {loading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={[styles.confirmText, { color: canConfirm ? '#FFFFFF' : c.textMuted }]}>
            {confirmLabel}
          </Text>
        )}
      </Pressable>

      <Pressable style={styles.cancelBtn} onPress={onClose}>
        <Text style={[styles.cancelText, { color: c.textMuted }]}>Cancelar</Text>
      </Pressable>
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  description: { ...type.body, lineHeight: 21, marginBottom: spacing.lg },
  label: { ...type.caption, marginBottom: spacing.sm },
  input: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  confirmBtn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  confirmText: { ...type.bodyBold, fontSize: 16 },
  cancelBtn: { alignItems: 'center', paddingVertical: spacing.md },
  cancelText: { ...type.bodyBold },
});
