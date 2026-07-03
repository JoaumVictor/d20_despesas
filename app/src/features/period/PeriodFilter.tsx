import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAppStore } from '@/store/appStore';
import { useTheme } from '@/theme/useTheme';
import { PERIOD_PRESETS, firstOfMonthISO, periodLabel, shiftMonth } from './period';

/** Filtro de período global (reusado em Despesas e Gráficos). */
export function PeriodFilter() {
  const c = useTheme();
  const period = useAppStore((s) => s.period);
  const setPeriod = useAppStore((s) => s.setPeriod);
  const isMonth = period.kind === 'month';

  const chips = [
    {
      key: 'month',
      label: 'Mês',
      active: isMonth,
      onPress: () => setPeriod({ kind: 'month', ref: firstOfMonthISO(new Date()) }),
    },
    ...PERIOD_PRESETS.map((p) => ({
      key: p.kind,
      label: p.label,
      active: period.kind === p.kind,
      onPress: () => setPeriod({ kind: p.kind }),
    })),
  ];

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.chips}
      >
        {chips.map((chip) => (
          <Pressable
            key={chip.key}
            onPress={chip.onPress}
            style={[
              styles.chip,
              {
                borderColor: chip.active ? c.primary : c.border,
                backgroundColor: chip.active ? c.primary : c.surface,
              },
            ]}
          >
            <Text
              style={[styles.chipText, { color: chip.active ? c.primaryContrast : c.textMuted }]}
            >
              {chip.label}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {isMonth && (
        <View style={styles.monthBar}>
          <Pressable onPress={() => setPeriod(shiftMonth(period, -1))} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-left" size={26} color={c.primary} />
          </Pressable>
          <Text style={[styles.monthLabel, { color: c.text }]}>{periodLabel(period)}</Text>
          <Pressable onPress={() => setPeriod(shiftMonth(period, 1))} hitSlop={8}>
            <MaterialCommunityIcons name="chevron-right" size={26} color={c.primary} />
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 10 },
  chips: { gap: 8, paddingHorizontal: 20 },
  chip: {
    borderWidth: 1,
    borderRadius: 20,
    paddingVertical: 7,
    paddingHorizontal: 14,
  },
  chipText: { fontSize: 13, fontWeight: '600' },
  monthBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  monthLabel: { fontSize: 16, fontWeight: '600', textTransform: 'capitalize' },
});
