import { Stack } from 'expo-router';
import { useTheme } from '@/theme/useTheme';

export default function AppLayout() {
  const c = useTheme();
  return (
    <Stack>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen
        name="expense/[id]"
        options={{
          presentation: 'modal',
          title: 'Despesa',
          headerStyle: { backgroundColor: c.surface },
          headerTitleStyle: { color: c.text },
          headerTintColor: c.primary,
          contentStyle: { backgroundColor: c.bg },
        }}
      />
    </Stack>
  );
}
