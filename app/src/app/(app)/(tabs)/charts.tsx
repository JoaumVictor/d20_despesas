import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { InsightCard } from '@/features/stats/InsightCard';
import { useMonthStats } from '@/features/stats/api';
import { formatCurrency, formatMonthLabel } from '@/utils/format';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40;

export default function ChartsScreen() {
  const [reference, setReference] = useState(() => new Date());
  const stats = useMonthStats(reference);

  function shiftMonth(delta: number) {
    setReference((prev) => new Date(prev.getFullYear(), prev.getMonth() + delta, 1));
  }

  const pieData = useMemo(
    () => stats.byCategory.map((s) => ({ value: s.value, color: s.color })),
    [stats.byCategory],
  );

  const lineData = useMemo(
    () =>
      stats.daily.map((p) => ({
        value: p.value,
        label: p.day % 5 === 0 ? String(p.day) : '',
      })),
    [stats.daily],
  );

  const lineSpacing = Math.max(6, (CHART_W - 20) / Math.max(stats.daily.length, 1));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <Text style={styles.title}>Gráficos</Text>
      </View>

      <View style={styles.monthBar}>
        <Pressable onPress={() => shiftMonth(-1)} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-left" size={28} color="#4f46e5" />
        </Pressable>
        <Text style={styles.monthLabel}>{formatMonthLabel(reference)}</Text>
        <Pressable onPress={() => shiftMonth(1)} hitSlop={8}>
          <MaterialCommunityIcons name="chevron-right" size={28} color="#4f46e5" />
        </Pressable>
      </View>

      {stats.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" />
      ) : stats.isEmpty ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="chart-line" size={48} color="#d1d5db" />
          <Text style={styles.emptyText}>Sem despesas neste mês para analisar.</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Insights */}
          <View style={styles.insights}>
            {stats.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>

          {/* Pizza por categoria */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gasto por categoria</Text>
            <View style={styles.pieRow}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={52}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={styles.pieCenterLabel}>Total</Text>
                    <Text style={styles.pieCenterValue}>{formatCurrency(stats.total)}</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legend}>
              {stats.byCategory.map((s) => (
                <View key={s.id} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={styles.legendName} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={styles.legendPct}>{s.pct.toFixed(0)}%</Text>
                  <Text style={styles.legendValue}>{formatCurrency(s.value)}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Linha: gasto por dia */}
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Gasto por dia</Text>
            {stats.peakDay && (
              <Text style={styles.peakText}>
                Pico no dia {stats.peakDay.day}: {formatCurrency(stats.peakDay.value)}
              </Text>
            )}
            <View style={styles.lineWrap}>
              <LineChart
                data={lineData}
                width={CHART_W - 24}
                height={160}
                spacing={lineSpacing}
                initialSpacing={8}
                thickness={2}
                color="#4f46e5"
                hideDataPoints
                curved
                areaChart
                startFillColor="#818cf8"
                endFillColor="#eef2ff"
                startOpacity={0.4}
                endOpacity={0.05}
                hideYAxisText
                yAxisThickness={0}
                xAxisColor="#e5e7eb"
                rulesColor="#f3f4f6"
                xAxisLabelTextStyle={styles.axisLabel}
                noOfSections={3}
              />
            </View>
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff' },
  header: { paddingHorizontal: 20, paddingTop: 8 },
  title: { fontSize: 24, fontWeight: '800', color: '#111827' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingVertical: 12,
  },
  monthLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    textTransform: 'capitalize',
  },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  insights: { gap: 10 },
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#f3f4f6',
    borderRadius: 16,
    padding: 16,
    gap: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  pieRow: { alignItems: 'center', paddingVertical: 8 },
  pieCenterLabel: { fontSize: 12, color: '#6b7280' },
  pieCenterValue: { fontSize: 15, fontWeight: '800', color: '#111827' },
  legend: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, fontSize: 14, color: '#374151' },
  legendPct: { fontSize: 13, color: '#9ca3af', width: 42, textAlign: 'right' },
  legendValue: { fontSize: 14, fontWeight: '600', color: '#111827', width: 96, textAlign: 'right' },
  peakText: { fontSize: 13, color: '#6b7280' },
  lineWrap: { marginTop: 4, overflow: 'hidden' },
  axisLabel: { fontSize: 10, color: '#9ca3af' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyText: { color: '#6b7280', fontSize: 15, textAlign: 'center' },
});
