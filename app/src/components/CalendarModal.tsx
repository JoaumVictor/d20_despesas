import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useState } from 'react';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { shadowFloating } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatMonthLabel, toISODate } from '@/utils/format';

const WEEKDAYS = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

interface Props {
  visible: boolean;
  value: string; // ISO YYYY-MM-DD selecionado
  onSelect: (iso: string) => void;
  onClose: () => void;
}

/** Calendário custom (pt-BR, temático). Abre no mês da data selecionada. */
export function CalendarModal({ visible, value, onSelect, onClose }: Props) {
  const c = useTheme();
  const base = value ? new Date(`${value}T00:00:00`) : new Date();
  const [view, setView] = useState({ y: base.getFullYear(), m: base.getMonth() });
  const todayISO = toISODate(new Date());

  const cells = useMemo(() => {
    const firstDay = new Date(view.y, view.m, 1).getDay();
    const days = new Date(view.y, view.m + 1, 0).getDate();
    const arr: (string | null)[] = [];
    for (let i = 0; i < firstDay; i++) arr.push(null);
    for (let d = 1; d <= days; d++) arr.push(toISODate(new Date(view.y, view.m, d)));
    return arr;
  }, [view]);

  function shift(delta: number) {
    setView((v) => {
      const d = new Date(v.y, v.m + delta, 1);
      return { y: d.getFullYear(), m: d.getMonth() };
    });
  }

  function pick(iso: string) {
    onSelect(iso);
    onClose();
  }

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable style={[styles.backdrop, { backgroundColor: c.overlay }]} onPress={onClose}>
        <Pressable
          style={[styles.card, shadowFloating, { backgroundColor: c.surface }]}
          onPress={() => {}}
        >
          <View style={styles.header}>
            <Pressable onPress={() => shift(-1)} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-left" size={26} color={c.primary} />
            </Pressable>
            <Text style={[styles.monthLabel, { color: c.text }]}>
              {formatMonthLabel(new Date(view.y, view.m, 1))}
            </Text>
            <Pressable onPress={() => shift(1)} hitSlop={8}>
              <MaterialCommunityIcons name="chevron-right" size={26} color={c.primary} />
            </Pressable>
          </View>

          <View style={styles.weekRow}>
            {WEEKDAYS.map((w, i) => (
              <Text key={i} style={[styles.weekday, { color: c.textMuted }]}>
                {w}
              </Text>
            ))}
          </View>

          <View style={styles.grid}>
            {cells.map((iso, i) => {
              if (!iso) return <View key={`e${i}`} style={styles.cell} />;
              const day = Number(iso.slice(8, 10));
              const selected = iso === value;
              const isToday = iso === todayISO;
              return (
                <Pressable key={iso} style={styles.cell} onPress={() => pick(iso)}>
                  <View
                    style={[
                      styles.dayCircle,
                      selected && { backgroundColor: c.primary },
                      !selected && isToday && { borderWidth: 1.5, borderColor: c.primary },
                    ]}
                  >
                    <Text
                      style={{
                        color: selected ? c.primaryContrast : c.text,
                        fontWeight: selected || isToday ? '700' : '400',
                      }}
                    >
                      {day}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </View>

          <Pressable style={styles.todayBtn} onPress={() => pick(todayISO)}>
            <Text style={[styles.todayText, { color: c.primary }]}>Hoje</Text>
          </Pressable>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    padding: 24,
  },
  card: { borderRadius: 24, padding: 16 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    marginBottom: 12,
  },
  monthLabel: { fontSize: 17, fontWeight: '700', textTransform: 'capitalize' },
  weekRow: { flexDirection: 'row' },
  weekday: { width: `${100 / 7}%`, textAlign: 'center', fontSize: 12, fontWeight: '600' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },
  cell: { width: `${100 / 7}%`, alignItems: 'center', paddingVertical: 3 },
  dayCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    alignItems: 'center',
    justifyContent: 'center',
  },
  todayBtn: { alignSelf: 'center', paddingVertical: 10, marginTop: 6 },
  todayText: { fontSize: 15, fontWeight: '700' },
});
