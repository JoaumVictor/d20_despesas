import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/theme/useTheme';
import type { Insight } from './api';

export function InsightCard({ insight }: { insight: Insight }) {
  const c = useTheme();
  const tone =
    insight.tone === 'up'
      ? { bg: c.dangerSoft, fg: c.danger }
      : insight.tone === 'down'
        ? { bg: c.successSoft, fg: c.success }
        : { bg: c.primarySoft, fg: c.primary };

  return (
    <View style={[styles.card, { backgroundColor: tone.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.fg }]}>
        <MaterialCommunityIcons name={insight.icon as never} size={20} color={c.surface} />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tone.fg }]}>{insight.title}</Text>
        <Text style={[styles.text, { color: c.textMuted }]}>{insight.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { flexDirection: 'row', gap: 12, padding: 14, borderRadius: 14, alignItems: 'center' },
  iconWrap: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 13, marginTop: 2, lineHeight: 18 },
});
