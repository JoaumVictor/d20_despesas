import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View, type ColorValue } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSuggestions } from '@/features/suggestions/useSuggestions';
import { radius, shadowFloating } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const TAB_BAR_BASE_HEIGHT = 64;
const FAB_SIZE = 60;

type IconName = keyof typeof MaterialCommunityIcons.glyphMap;

function tabIcon(active: IconName, inactive: IconName, showBadge?: boolean) {
  return function TabIcon({ color, focused }: { color: ColorValue; focused: boolean }) {
    return (
      <View>
        <MaterialCommunityIcons name={focused ? active : inactive} size={24} color={color} />
        {showBadge && <View style={styles.badge} />}
      </View>
    );
  };
}

export default function TabsLayout() {
  const c = useTheme();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const tabBarHeight = TAB_BAR_BASE_HEIGHT + insets.bottom;
  const hasSuggestions = useSuggestions().length > 0;

  return (
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: c.primary,
          tabBarInactiveTintColor: c.tabInactive,
          tabBarStyle: {
            height: tabBarHeight,
            paddingTop: 10,
            paddingBottom: Math.max(insets.bottom, 10),
            backgroundColor: c.surface,
            borderTopWidth: StyleSheet.hairlineWidth,
            borderTopColor: c.border,
            elevation: 0,
          },
          tabBarLabelStyle: { fontSize: 11, fontWeight: '600', marginTop: 2 },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{ title: 'Despesas', tabBarIcon: tabIcon('wallet', 'wallet-outline') }}
        />
        <Tabs.Screen
          name="charts"
          options={{ title: 'Gráficos', tabBarIcon: tabIcon('chart-box', 'chart-box-outline') }}
        />
        <Tabs.Screen
          name="add"
          options={{
            title: '',
            // slot vazio: o FAB real é desenhado fora da barra (sem clipping)
            tabBarButton: () => <View style={styles.fabSlot} />,
          }}
          listeners={{ tabPress: (e) => e.preventDefault() }}
        />
        <Tabs.Screen
          name="goals"
          options={{ title: 'Foco', tabBarIcon: tabIcon('target', 'target', hasSuggestions) }}
        />
        <Tabs.Screen
          name="settings"
          options={{ title: 'Config', tabBarIcon: tabIcon('cog', 'cog-outline') }}
        />
      </Tabs>

      {/* FAB central — fora da tab bar para nunca ser cortado */}
      <View
        pointerEvents="box-none"
        style={[styles.fabWrap, { bottom: tabBarHeight - FAB_SIZE / 2 + 6 }]}
      >
        <Pressable
          onPress={() => router.push('/expense/new')}
          style={({ pressed }) => [
            styles.fab,
            shadowFloating,
            {
              backgroundColor: pressed ? c.primaryPressed : c.primary,
              borderColor: c.bg,
            },
          ]}
        >
          <MaterialCommunityIcons name="plus" size={30} color={c.primaryContrast} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    position: 'absolute',
    top: -2,
    right: -4,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E5484D',
  },
  fabSlot: { flex: 1 },
  fabWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    borderRadius: radius.pill,
    borderWidth: 4,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
