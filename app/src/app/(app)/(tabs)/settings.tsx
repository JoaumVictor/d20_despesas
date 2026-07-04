import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useAuth } from '@/features/auth/AuthContext';
import { useDeleteAllExpenses } from '@/features/expenses/api';
import { useDeleteAllGoals } from '@/features/goals/api';
import { useAppStore, type ThemeMode } from '@/store/appStore';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';

const THEME_OPTIONS: { key: ThemeMode; label: string; icon: string }[] = [
  { key: 'system', label: 'Sistema', icon: 'cellphone' },
  { key: 'light', label: 'Claro', icon: 'white-balance-sunny' },
  { key: 'dark', label: 'Escuro', icon: 'moon-waning-crescent' },
];

interface PrefRowProps {
  icon: string;
  title: string;
  hint: string;
  value: boolean;
  onChange: (v: boolean) => void;
}

type DangerAction = 'expenses' | 'all' | null;

export default function SettingsScreen() {
  const { signOut, session } = useAuth();
  const userId = session?.user.id;
  const c = useTheme();
  const themeMode = useAppStore((s) => s.themeMode);
  const setThemeMode = useAppStore((s) => s.setThemeMode);
  const showPaidStatus = useAppStore((s) => s.showPaidStatus);
  const setShowPaidStatus = useAppStore((s) => s.setShowPaidStatus);
  const showAlertCards = useAppStore((s) => s.showAlertCards);
  const setShowAlertCards = useAppStore((s) => s.setShowAlertCards);

  const deleteAllExpenses = useDeleteAllExpenses(userId ?? '');
  const deleteAllGoals = useDeleteAllGoals(userId ?? '');
  const [dangerAction, setDangerAction] = useState<DangerAction>(null);

  const card = [styles.card, shadowCard, { backgroundColor: c.surface, borderColor: c.border }];
  const deleting = deleteAllExpenses.isPending || deleteAllGoals.isPending;

  function PrefRow({ icon, title, hint, value, onChange }: PrefRowProps) {
    return (
      <View style={styles.row}>
        <View style={[styles.iconBadge, { backgroundColor: c.primarySoft }]}>
          <MaterialCommunityIcons name={icon as never} size={18} color={c.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.rowTitle, { color: c.text }]}>{title}</Text>
          <Text style={[styles.rowHint, { color: c.textMuted }]}>{hint}</Text>
        </View>
        <Switch
          value={value}
          onValueChange={onChange}
          trackColor={{ true: c.primary, false: c.surfaceAlt }}
          thumbColor="#FFFFFF"
        />
      </View>
    );
  }

  async function handleConfirmExpenses() {
    try {
      await deleteAllExpenses.mutateAsync();
      setDangerAction(null);
      Alert.alert('Pronto', 'Todas as suas despesas foram excluídas.');
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  async function handleConfirmAll() {
    try {
      await deleteAllExpenses.mutateAsync();
      await deleteAllGoals.mutateAsync();
      setDangerAction(null);
      await signOut();
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenHeader title="Configurações" subtitle={session?.user.email ?? undefined} />

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Aparência</Text>
        <View style={card}>
          <View style={[styles.segment, { backgroundColor: c.surfaceAlt }]}>
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
                    size={17}
                    color={active ? c.primaryContrast : c.textMuted}
                  />
                  <Text
                    style={[
                      styles.segmentText,
                      { color: active ? c.primaryContrast : c.textMuted },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Preferências</Text>
        <View style={card}>
          <PrefRow
            icon="check-circle-outline"
            title="Controlar pago/não pago"
            hint="Desligue se você só quer anotar gastos."
            value={showPaidStatus}
            onChange={setShowPaidStatus}
          />
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <PrefRow
            icon="bell-badge-outline"
            title="Ver cards de alertas"
            hint="Avisos de metas na tela de Despesas."
            value={showAlertCards}
            onChange={setShowAlertCards}
          />
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Conta</Text>
        <View style={card}>
          <Pressable style={styles.row} onPress={signOut}>
            <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
              <MaterialCommunityIcons name="logout" size={18} color={c.danger} />
            </View>
            <Text style={[styles.rowTitle, { color: c.danger, flex: 1 }]}>Sair da conta</Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
          </Pressable>
        </View>

        <Text style={[styles.sectionLabel, { color: c.danger }]}>Zona de perigo</Text>
        <View style={card}>
          <Pressable style={styles.row} onPress={() => setDangerAction('expenses')}>
            <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
              <MaterialCommunityIcons name="delete-sweep-outline" size={18} color={c.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Excluir todas as despesas</Text>
              <Text style={[styles.rowHint, { color: c.textMuted }]}>
                Categorias e metas continuam intactas.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
          </Pressable>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          <Pressable style={styles.row} onPress={() => setDangerAction('all')}>
            <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
              <MaterialCommunityIcons name="account-remove-outline" size={18} color={c.danger} />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.rowTitle, { color: c.text }]}>Excluir todos os meus dados</Text>
              <Text style={[styles.rowHint, { color: c.textMuted }]}>
                Apaga despesas e metas, e sai da conta.
              </Text>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
          </Pressable>
        </View>
      </ScrollView>

      <ConfirmDeleteSheet
        visible={dangerAction === 'expenses'}
        title="Excluir todas as despesas"
        description="Isso apaga permanentemente todos os seus lançamentos de despesa. Suas categorias e metas não são afetadas. Essa ação não pode ser desfeita."
        confirmLabel="Excluir despesas"
        loading={deleting}
        onConfirm={handleConfirmExpenses}
        onClose={() => setDangerAction(null)}
      />

      <ConfirmDeleteSheet
        visible={dangerAction === 'all'}
        title="Excluir todos os meus dados"
        description="Isso apaga permanentemente todas as suas despesas e metas, e sai da sua conta. Suas categorias continuam do jeito que estão. Sua conta Google não é excluída — você pode entrar de novo quando quiser, começando do zero."
        confirmLabel="Excluir tudo e sair"
        loading={deleting}
        onConfirm={handleConfirmAll}
        onClose={() => setDangerAction(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  scroll: { paddingHorizontal: spacing.xl, paddingBottom: 96, gap: spacing.sm },
  sectionLabel: { ...type.label, marginTop: spacing.md, marginBottom: spacing.sm },
  card: {
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
  },
  segment: {
    flexDirection: 'row',
    borderRadius: radius.md,
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
    borderRadius: radius.sm,
  },
  segmentText: { fontSize: 13.5, fontWeight: '700' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { ...type.bodyBold, fontSize: 15 },
  rowHint: { ...type.caption, marginTop: 1 },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: spacing.md },
});
