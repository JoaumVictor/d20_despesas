import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useMemo, useRef, useState } from 'react';
import { Dimensions, FlatList, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '@/features/auth/AuthContext';
import { useExpensesByRange } from '@/features/expenses/api';
import { useGoals } from '@/features/goals/api';
import { useTheme } from '@/theme/useTheme';
import type { ThemeColors } from '@/theme/palette';
import { generateInsights, type InsightItem, type InsightScope } from './engine';

const SCREEN_W = Dimensions.get('window').width;
const CARD_W = SCREEN_W - 40;

/** Cards do escopo, derivados do cache (1 query all-time + metas). */
export function useInsights(scope: InsightScope): InsightItem[] {
  const { session } = useAuth();
  // range null = todas as despesas — mesma chave de cache do preset "Tudo".
  const { data: expenses } = useExpensesByRange(null);
  const { data: goals } = useGoals(session?.user.id);

  return useMemo(() => {
    if (!expenses) return [];
    return generateInsights({ expenses, goals: goals ?? [], now: new Date() }, scope);
  }, [expenses, goals, scope]);
}

function toneColors(tone: InsightItem['tone'], c: ThemeColors) {
  switch (tone) {
    case 'up':
    case 'warning':
      return { bg: c.dangerSoft, fg: c.danger };
    case 'down':
    case 'success':
      return { bg: c.successSoft, fg: c.success };
    default:
      return { bg: c.primarySoft, fg: c.primary };
  }
}

interface Props {
  scope: InsightScope;
  /** limita a quantidade de cards (ex.: 5 na tela de Despesas) */
  max?: number;
}

/** Carrossel horizontal de insights — reutilizável em qualquer tela. */
export function InsightsCarousel({ scope, max }: Props) {
  const c = useTheme();
  const all = useInsights(scope);
  const items = max ? all.slice(0, max) : all;
  const [page, setPage] = useState(0);
  const listRef = useRef<FlatList<InsightItem>>(null);

  if (items.length === 0) return null;

  return (
    <View>
      <FlatList
        ref={listRef}
        data={items}
        horizontal
        pagingEnabled
        snapToInterval={CARD_W + 10}
        decelerationRate="fast"
        showsHorizontalScrollIndicator={false}
        keyExtractor={(i) => i.id}
        contentContainerStyle={styles.list}
        onMomentumScrollEnd={(e) =>
          setPage(Math.round(e.nativeEvent.contentOffset.x / (CARD_W + 10)))
        }
        renderItem={({ item }) => {
          const tone = toneColors(item.tone, c);
          return (
            <View style={[styles.card, { backgroundColor: tone.bg, width: CARD_W }]}>
              <View style={[styles.iconWrap, { backgroundColor: tone.fg }]}>
                <MaterialCommunityIcons name={item.icon as never} size={20} color={c.surface} />
              </View>
              <View style={styles.body}>
                <Text style={[styles.title, { color: tone.fg }]} numberOfLines={1}>
                  {item.title}
                </Text>
                <Text style={[styles.text, { color: c.textMuted }]} numberOfLines={3}>
                  {item.text}
                </Text>
              </View>
            </View>
          );
        }}
      />
      {items.length > 1 && (
        <View style={styles.dots}>
          {items.map((item, i) => (
            <View
              key={item.id}
              style={[
                styles.dot,
                { backgroundColor: i === page ? c.primary : c.border },
              ]}
            />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { paddingHorizontal: 20, gap: 10 },
  card: {
    flexDirection: 'row',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    alignItems: 'center',
    minHeight: 78,
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
  text: { fontSize: 13, marginTop: 2, lineHeight: 18 },
  dots: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 6,
    marginTop: 8,
  },
  dot: { width: 6, height: 6, borderRadius: 3 },
});
