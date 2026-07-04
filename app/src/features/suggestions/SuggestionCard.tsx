import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { CategoryIcon } from '@/features/categories/CategoryIcon';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';
import type { RecurringSuggestion } from './engine';

interface Props {
  suggestion: RecurringSuggestion;
  onConfirm: () => void;
  onDismiss: () => void;
}

export function SuggestionCard({ suggestion, onConfirm, onDismiss }: Props) {
  const c = useTheme();
  return (
    <View style={[styles.card, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
      <CategoryIcon
        iconKey={suggestion.categoryIcon}
        color={suggestion.categoryColor}
        size={38}
      />
      <View style={styles.body}>
        <Text style={[styles.title, { color: c.text }]} numberOfLines={1}>
          Já pagou {suggestion.description} esse mês?
        </Text>
        <Text style={[styles.subtitle, { color: c.textMuted }]}>
          {suggestion.categoryName} · {formatCurrency(suggestion.amount)}
        </Text>
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={onConfirm}
          hitSlop={6}
          style={[styles.actionBtn, { backgroundColor: c.successSoft }]}
        >
          <MaterialCommunityIcons name="check" size={20} color={c.success} />
        </Pressable>
        <Pressable
          onPress={onDismiss}
          hitSlop={6}
          style={[styles.actionBtn, { backgroundColor: c.dangerSoft }]}
        >
          <MaterialCommunityIcons name="close" size={20} color={c.danger} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    borderWidth: 1,
    borderRadius: 18,
    padding: 14,
    marginBottom: 10,
  },
  body: { flex: 1 },
  title: { fontSize: 14, fontWeight: '700' },
  subtitle: { fontSize: 12, marginTop: 2 },
  actions: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
