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
import { InvestmentChart } from '@/features/investments/InvestmentChart';
import { InsightsCarousel } from '@/features/insights/InsightsCarousel';
import { PeriodFilter } from '@/features/period/PeriodFilter';
import { useCategoryDailySeries, usePeriodStats } from '@/features/stats/api';
import { useAppStore } from '@/store/appStore';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency, formatDate } from '@/utils/format';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40;

const COMPARE_COLORS_MAX = 5;

export default function ChartsScreen() {
  const c = useTheme();
  const period = useAppStore((s) => s.period);
  const stats = usePeriodStats(period);

  const [compareIds, setCompareIds] = useState<string[]>([]);
  const compareSeries = useCategoryDailySeries(period, compareIds);

  function toggleCompare(id: string) {
    setCompareIds((prev) => {
      if (prev.includes(id)) return prev.filter((x) => x !== id);
      if (prev.length >= COMPARE_COLORS_MAX) return prev;
      return [...prev, id];
    });
  }

  // react-native-gifted-charts só deriva os rótulos do eixo X (e reanima
  // corretamente ao trocar a quantidade de séries) usando as props nomeadas
  // data/data2/.../data5 — a prop `dataSet` (array dinâmico) ignora os
  // rótulos do eixo X e trava a animação ao mudar o nº de itens.
  const compareLineProps = useMemo(() => {
    const suffixes = ['', '2', '3', '4', '5'] as const;
    const props: Record<string, unknown> = {};
    compareSeries.slice(0, suffixes.length).forEach((s, i) => {
      const suffix = suffixes[i];
      props[`data${suffix}`] = s.points.map((p, j) => ({
        value: p.value,
        label: j % 5 === 0 ? String(p.day) : '',
      }));
      props[`color${suffix || '1'}`] = s.color;
      props[`thickness${suffix || '1'}`] = 2.5;
      props[`hideDataPoints${suffix || '1'}`] = true;
    });
    return props;
  }, [compareSeries]);

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

          {/* Um único carrossel: cards do período ativo (ex. "Maior gasto") + cards
              históricos/de meta que independem do filtro global. */}
          <View style={styles.carousel}>
            <InsightsCarousel scope="graficos" extraItems={stats.insights} />
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

          <InvestmentChart />

          <View style={card}>
            <Text style={[styles.cardTitle, { color: c.text }]}>Comparar categorias</Text>
            <Text style={[styles.compareHint, { color: c.textMuted }]}>
              Escolha até {COMPARE_COLORS_MAX} categorias pra ver a evolução lado a lado no
              período.
            </Text>
            <View style={styles.chips}>
              {stats.byCategory.map((s) => {
                const selected = compareIds.includes(s.id);
                return (
                  <Pressable
                    key={s.id}
                    onPress={() => toggleCompare(s.id)}
                    style={[
                      styles.chip,
                      {
                        backgroundColor: selected ? s.color + '22' : c.surfaceAlt,
                        borderColor: selected ? s.color : c.border,
                      },
                    ]}
                  >
                    <View style={[styles.dot, { backgroundColor: s.color }]} />
                    <Text
                      style={[styles.chipText, { color: selected ? c.text : c.textMuted }]}
                      numberOfLines={1}
                    >
                      {s.name}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {compareSeries.length > 0 ? (
              <>
                <View style={styles.lineWrap}>
                  <LineChart
                    key={compareIds.join(',')}
                    {...compareLineProps}
                    width={CHART_W - 24}
                    height={160}
                    spacing={lineSpacing}
                    initialSpacing={8}
                    curved
                    yAxisTextStyle={[styles.axisLabel, { color: c.textMuted }]}
                    yAxisColor={c.border}
                    xAxisColor={c.border}
                    rulesColor={c.border}
                    xAxisLabelTextStyle={[styles.axisLabel, { color: c.textMuted }]}
                    noOfSections={3}
                  />
                </View>
                <View style={styles.legend}>
                  {compareSeries.map((s) => (
                    <View key={s.id} style={styles.legendRow}>
                      <View style={[styles.dot, { backgroundColor: s.color }]} />
                      <Text style={[styles.legendName, { color: c.text }]} numberOfLines={1}>
                        {s.name}
                      </Text>
                      <Text style={[styles.legendValue, { color: c.text }]}>
                        {formatCurrency(s.points.reduce((sum, p) => sum + p.value, 0))}
                      </Text>
                    </View>
                  ))}
                </View>
              </>
            ) : null}
          </View>

          <View style={{ height: 24 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: spacing.xl, paddingTop: spacing.sm, paddingBottom: spacing.sm },
  title: { ...type.title },
  filter: { paddingBottom: spacing.md },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 96, gap: spacing.lg },
  carousel: { marginHorizontal: -spacing.xl },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    gap: spacing.md,
    ...shadowCard,
  },
  cardTitle: { ...type.heading },
  pieRow: { alignItems: 'center', paddingVertical: spacing.sm },
  pieCenterLabel: { ...type.caption },
  pieCenterValue: { fontSize: 15, fontWeight: '800' },
  legend: { gap: spacing.sm },
  legendRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 12, height: 12, borderRadius: radius.pill },
  legendName: { flex: 1, fontSize: 14 },
  legendPct: { fontSize: 13, width: 42, textAlign: 'right' },
  legendValue: { fontSize: 14, fontWeight: '700', width: 96, textAlign: 'right' },
  peakText: { ...type.caption },
  compareHint: { ...type.caption },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderRadius: radius.pill,
    paddingVertical: 7,
    paddingHorizontal: 12,
    maxWidth: 160,
  },
  chipText: { fontSize: 13, fontWeight: '600', flexShrink: 1 },
  lineWrap: { marginTop: spacing.xs, overflow: 'hidden' },
  axisLabel: { fontSize: 10 },
  empty: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingHorizontal: 40,
  },
  emptyText: { ...type.body, textAlign: 'center' },
});
