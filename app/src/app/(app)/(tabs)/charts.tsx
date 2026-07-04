import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo } from 'react';
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LineChart, PieChart } from 'react-native-gifted-charts';
import { InsightsCarousel } from '@/features/insights/InsightsCarousel';
import { PeriodFilter } from '@/features/period/PeriodFilter';
import { InsightCard } from '@/features/stats/InsightCard';
import { usePeriodStats } from '@/features/stats/api';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency, formatDate } from '@/utils/format';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40;

export default function ChartsScreen() {
  const c = useTheme();
  const period = useAppStore((s) => s.period);
  const stats = usePeriodStats(period);

  const pieData = useMemo(
    () => stats.byCategory.map((s) => ({ value: s.value, color: s.color })),
    [stats.byCategory],
  );

  const lineData = useMemo(
    () =>
      stats.daily.map((p, i) => ({
        value: p.value,
        label: i % 5 === 0 ? String(p.day) : '',
      })),
    [stats.daily],
  );

  const lineSpacing = Math.max(6, (CHART_W - 44) / Math.max(stats.daily.length, 1));

  const card = [styles.card, { backgroundColor: c.surface, borderColor: c.border }];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Gráficos</Text>
      </View>

      <View style={styles.filter}>
        <PeriodFilter />
      </View>

      {/* Cards históricos/metas — independem do filtro global de período */}
      <View style={styles.carousel}>
        <InsightsCarousel scope="graficos" />
      </View>

      {stats.isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
      ) : stats.isEmpty ? (
        <View style={styles.empty}>
          <MaterialCommunityIcons name="chart-line" size={48} color={c.border} />
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Sem despesas neste período para analisar.
          </Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          <View style={styles.insights}>
            {stats.insights.map((i) => (
              <InsightCard key={i.id} insight={i} />
            ))}
          </View>

          <View style={card}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Gasto por categoria</Text>
            <View style={styles.pieRow}>
              <PieChart
                data={pieData}
                donut
                radius={80}
                innerRadius={52}
                innerCircleColor={c.surface}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={[styles.pieCenterLabel, { color: c.textMuted }]}>Total</Text>
                    <Text style={[styles.pieCenterValue, { color: c.text }]}>
                      {formatCurrency(stats.total)}
                    </Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legend}>
              {stats.byCategory.map((s) => (
                <View key={s.id} style={styles.legendRow}>
                  <View style={[styles.dot, { backgroundColor: s.color }]} />
                  <Text style={[styles.legendName, { color: c.text }]} numberOfLines={1}>
                    {s.name}
                  </Text>
                  <Text style={[styles.legendPct, { color: c.textMuted }]}>
                    {s.pct.toFixed(0)}%
                  </Text>
                  <Text style={[styles.legendValue, { color: c.text }]}>
                    {formatCurrency(s.value)}
                  </Text>
                </View>
              ))}
            </View>
          </View>

          <View style={card}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Gasto por dia</Text>
            {stats.peakDay && (
              <Text style={[styles.peakText, { color: c.textMuted }]}>
                Pico em {formatDate(stats.peakDay.dateISO)}: {formatCurrency(stats.peakDay.value)}
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
                color={c.primary}
                hideDataPoints
                curved
                areaChart
                startFillColor={c.primary}
                endFillColor={c.surface}
                startOpacity={0.35}
                endOpacity={0.02}
                hideYAxisText
                yAxisThickness={0}
                xAxisColor={c.border}
                rulesColor={c.border}
                xAxisLabelTextStyle={[styles.axisLabel, { color: c.textMuted }]}
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
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 8 },
  title: { fontSize: 24, fontWeight: '800' },
  filter: { paddingBottom: 12 },
  carousel: { paddingBottom: 12 },
  scroll: { paddingHorizontal: 20, paddingBottom: 24, gap: 16 },
  insights: { gap: 10 },
  card: { borderWidth: 1, borderRadius: 16, padding: 16, gap: 12 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  pieRow: { alignItems: 'center', paddingVertical: 8 },
  pieCenterLabel: { fontSize: 12 },
  pieCenterValue: { fontSize: 15, fontWeight: '800' },
  legend: { gap: 8 },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  dot: { width: 12, height: 12, borderRadius: 6 },
  legendName: { flex: 1, fontSize: 14 },
  legendPct: { fontSize: 13, width: 42, textAlign: 'right' },
  legendValue: { fontSize: 14, fontWeight: '600', width: 96, textAlign: 'right' },
  peakText: { fontSize: 13 },
  lineWrap: { marginTop: 4, overflow: 'hidden' },
  axisLabel: { fontSize: 10 },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 40 },
  emptyText: { fontSize: 15, textAlign: 'center' },
});
