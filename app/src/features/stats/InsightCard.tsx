import { MaterialCommunityIcons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';
import type { Insight } from './api';

const TONES = {
  up: { bg: '#fef2f2', fg: '#dc2626' }, // gasto subiu → alerta
  down: { bg: '#f0fdf4', fg: '#16a34a' }, // economizou → positivo
  neutral: { bg: '#eef2ff', fg: '#4f46e5' },
} as const;

export function InsightCard({ insight }: { insight: Insight }) {
  const tone = TONES[insight.tone];
  return (
    <View style={[styles.card, { backgroundColor: tone.bg }]}>
      <View style={[styles.iconWrap, { backgroundColor: tone.fg }]}>
        <MaterialCommunityIcons name={insight.icon as never} size={20} color="#fff" />
      </View>
      <View style={styles.body}>
        <Text style={[styles.title, { color: tone.fg }]}>{insight.title}</Text>
        <Text style={styles.text}>{insight.text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  iconWrap: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: { flex: 1 },
  title: { fontSize: 15, fontWeight: '700' },
  text: { fontSize: 13, color: '#4b5563', marginTop: 2, lineHeight: 18 },
});
