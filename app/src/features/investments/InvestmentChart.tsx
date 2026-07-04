import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Dimensions, StyleSheet, Text, View } from 'react-native';
import { LineChart } from 'react-native-gifted-charts';
import { useTheme } from '@/theme/useTheme';
import { formatCurrency } from '@/utils/format';
import { useInvestmentSeries } from './api';

const SCREEN_W = Dimensions.get('window').width;
const CHART_W = SCREEN_W - 40 - 24;

/** Escadinha ascendente do patrimônio investido (soma acumulada por mês, sem rendimentos). */
export function InvestmentChart() {
  const c = useTheme();
  const { series, total, isLoading } = useInvestmentSeries();

  const card = [styles.card, { backgroundColor: c.surface, borderColor: c.border }];

  if (isLoading) return null;

  if (series.length === 0) {
    return (
      <View style={card}>
        <Text style={[styles.cardTitle, { color: c.text }]}>Patrimônio investido</Text>
        <View style={styles.empty}>
          <MaterialCommunityIcons name="stairs-up" size={36} color={c.border} />
          <Text style={[styles.emptyText, { color: c.textMuted }]}>
            Lance despesas na categoria Investimentos para acompanhar sua escadinha de
            patrimônio acumulado aqui.
          </Text>
        </View>
      </View>
    );
  }

  const data = series.map((p) => ({ value: p.cumulative, label: p.label }));
  const spacing = Math.max(28, (CHART_W - 20) / Math.max(series.length - 1, 1));

  return (
    <View style={card}>
      <Text style={[styles.cardTitle, { color: c.text }]}>Patrimônio investido</Text>
      <Text style={[styles.hint, { color: c.textMuted }]}>
        Acumulado sem rendimentos · {series.length} mês{series.length > 1 ? 'es' : ''}
      </Text>
      <Text style={[styles.total, { color: c.primary }]}>{formatCurrency(total)}</Text>

      <View style={styles.chartWrap}>
        <LineChart
          data={data}
          width={CHART_W}
          height={160}
          spacing={spacing}
          initialSpacing={16}
          endSpacing={16}
          thickness={2.5}
          color={c.primary}
          curved={false}
          areaChart
          startFillColor={c.primary}
          endFillColor={c.surface}
          startOpacity={0.3}
          endOpacity={0.03}
          hideYAxisText
          yAxisThickness={0}
          xAxisColor={c.border}
          rulesColor={c.border}
          xAxisLabelTextStyle={[styles.axisLabel, { color: c.textMuted }]}
          noOfSections={3}
          dataPointsColor={c.primary}
          dataPointsRadius={3}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { borderWidth: StyleSheet.hairlineWidth, borderRadius: 18, padding: 16, gap: 4 },
  cardTitle: { fontSize: 16, fontWeight: '700' },
  hint: { fontSize: 12 },
  total: { fontSize: 26, fontWeight: '800', marginTop: 4 },
  chartWrap: { marginTop: 12, overflow: 'hidden' },
  axisLabel: { fontSize: 10 },
  empty: { alignItems: 'center', gap: 8, paddingVertical: 20 },
  emptyText: { fontSize: 13, textAlign: 'center', paddingHorizontal: 10 },
});
