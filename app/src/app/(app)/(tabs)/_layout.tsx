import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Tabs, useRouter } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

const ACTIVE = '#4f46e5';
const INACTIVE = '#9ca3af';

/** Botão "+" central, elevado acima da tab bar. Abre o form de nova despesa. */
function AddButton() {
  const router = useRouter();
  return (
    <View style={styles.centerWrap}>
      <Pressable
        style={styles.centerBtn}
        onPress={() => router.push('/expense/new')}
        android_ripple={{ color: 'rgba(255,255,255,0.25)', borderless: true }}
      >
        <MaterialCommunityIcons name="plus" size={30} color="#fff" />
      </Pressable>
    </View>
  );
}

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: ACTIVE,
        tabBarInactiveTintColor: INACTIVE,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Despesas',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="wallet" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="charts"
        options={{
          title: 'Gráficos',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="chart-line" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="add"
        options={{
          title: '',
          tabBarButton: () => <AddButton />,
        }}
        listeners={{
          // O botão custom já navega; impede a troca de aba padrão.
          tabPress: (e) => e.preventDefault(),
        }}
      />
      <Tabs.Screen
        name="goals"
        options={{
          title: 'Metas',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="target" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Config',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cog" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: { height: 62, paddingBottom: 8, paddingTop: 8 },
  tabLabel: { fontSize: 11 },
  centerWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  centerBtn: {
    top: -16,
    width: 58,
    height: 58,
    borderRadius: 29,
    backgroundColor: ACTIVE,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 5,
    shadowColor: '#000',
    shadowOpacity: 0.25,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 3 },
  },
});
