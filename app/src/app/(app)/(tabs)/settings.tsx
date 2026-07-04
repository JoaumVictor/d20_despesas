import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Pressable, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/features/auth/AuthContext';
import { useAppStore, type ThemeMode } from '@/store/appStore';
import { useTheme } from '@/theme/useTheme';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: 'system', label: 'Sistema', icon: 'cellphone' },
  { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
  { key: 'dark', label: 'Escuro', icon: 'moon-waning-crescent' },
];

export default function SettingsScreen() {
  const { signOut } = useAuth();
  const c = useTheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const showPaidStatus = useAppStore((s) => s.showPaidStatus);
  const setShowPaidStatus = useAppStore((s) => s.setShowPaidStatus);
  const showAlertCards = useAppStore((s) => s.showAlertCards);
  const setShowAlertCards = useAppStore((s) => s.setShowAlertCards);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>Configurações</Text>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Aparência</Text>
        <View style={[styles.segment, { backgroundColor: c.surfaceAlt, borderColor: c.border }]}>
          {THEME_OPTIONS.map((opt) => {
            const active = themeMode === opt.key;
            return (
              <Pressable
                key={opt.key}
                onPress={() => setThemeMode(opt.key)}
                style={[styles.segmentItem, active && { backgroundColor: c.primary }]}
              >
                <MaterialCommunityIcons
                  name={opt.icon as never}
                  size={18}
                  color={active ? c.primaryContrast : c.textMuted}
                />
                <Text
                  style={[styles.segmentText, { color: active ? c.primaryContrast : c.textMuted }]}
                >
                  {opt.label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      <View style={styles.section}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Preferências</Text>

        <View style={[styles.prefRow, { borderTopColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: c.text }]}>Controlar pago/não pago</Text>
            <Text style={[styles.prefHint, { color: c.textMuted }]}>
              Desligue se você só quer anotar gastos, sem marcar status.
            </Text>
          </View>
          <Switch
            value={showPaidStatus}
            onValueChange={setShowPaidStatus}
            trackColor={{ true: c.primary }}
          />
        </View>

        <View style={[styles.prefRow, { borderTopColor: c.border }]}>
          <View style={{ flex: 1 }}>
            <Text style={[styles.prefTitle, { color: c.text }]}>Ver cards de alertas</Text>
            <Text style={[styles.prefHint, { color: c.textMuted }]}>
              Mostra avisos de metas na tela de Despesas.
            </Text>
          </View>
          <Switch
            value={showAlertCards}
            onValueChange={setShowAlertCards}
            trackColor={{ true: c.primary }}
          />
        </View>
      </View>

      <View style={styles.section}>
        <Pressable style={[styles.row, { borderTopColor: c.border }]} onPress={signOut}>
          <MaterialCommunityIcons name="logout" size={22} color={c.danger} />
          <Text style={[styles.rowTextDanger, { color: c.danger }]}>Sair da conta</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 8, paddingBottom: 12 },
  title: { fontSize: 24, fontWeight: '800' },
  section: { paddingHorizontal: 20, marginTop: 12 },
  sectionLabel: { fontSize: 13, fontWeight: '600', marginBottom: 8, textTransform: 'uppercase' },
  segment: {
    flexDirection: 'row',
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segmentItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: 9,
  },
  segmentText: { fontSize: 14, fontWeight: '600' },
  prefRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  prefTitle: { fontSize: 15, fontWeight: '600' },
  prefHint: { fontSize: 12, marginTop: 2, lineHeight: 16 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  rowTextDanger: { fontSize: 16, fontWeight: '600' },
});
