import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Alert, Image, Pressable, ScrollView, StyleSheet, Switch, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ConfirmDeleteSheet } from '@/components/ConfirmDeleteSheet';
import { ScreenHeader } from '@/components/ScreenHeader';
import { useIsAdmin } from '@/features/admin/api';
import { useAuth } from '@/features/auth/AuthContext';
import { useDeleteAllExpenses } from '@/features/expenses/api';
import { useDeleteAllGoals } from '@/features/goals/api';
import { useAppStore, type ThemeMode } from '@/store/appStore';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { appVersion } from '@/utils/appVersion';

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

type DangerAction = 'expenses' | 'all' | 'local-exit' | null;

export default function SettingsScreen() {
  const { signOut, session, isLocal, leaveLocalMode } = useAuth();
  const router = useRouter();
  const { data: isAdmin } = useIsAdmin();
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

  const userMeta = session?.user.user_metadata as
    | { full_name?: string; name?: string; avatar_url?: string; picture?: string }
    | undefined;
  const displayName = userMeta?.full_name ?? userMeta?.name ?? session?.user.email ?? 'Você';
  const avatarUrl = userMeta?.avatar_url ?? userMeta?.picture;
  const provider = session?.user.app_metadata?.provider;

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

  async function handleConfirmLocalExit() {
    try {
      setDangerAction(null);
      await signOut(); // em modo local, signOut() já apaga tudo e desliga a flag
    } catch (err) {
      Alert.alert('Erro', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['top']}>
      <ScreenHeader title="Configurações" />

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
          <View style={styles.profileRow}>
            <View style={styles.avatarWrap}>
              {isLocal ? (
                <View
                  style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.primarySoft }]}
                >
                  <MaterialCommunityIcons name="cellphone-lock" size={26} color={c.primary} />
                </View>
              ) : avatarUrl ? (
                <Image source={{ uri: avatarUrl }} style={styles.avatar} />
              ) : (
                <View
                  style={[styles.avatar, styles.avatarFallback, { backgroundColor: c.primarySoft }]}
                >
                  <MaterialCommunityIcons name="account" size={26} color={c.primary} />
                </View>
              )}
              {provider === 'google' && (
                <View
                  style={[
                    styles.providerBadge,
                    { backgroundColor: c.surface, borderColor: c.border },
                  ]}
                >
                  <MaterialCommunityIcons name="google" size={11} color="#4285F4" />
                </View>
              )}
            </View>
            <View style={{ flex: 1 }}>
              <Text style={[styles.profileName, { color: c.text }]} numberOfLines={1}>
                {isLocal ? 'Perfil local' : displayName}
              </Text>
              <Text style={[styles.profileEmail, { color: c.textMuted }]} numberOfLines={1}>
                {isLocal ? 'Dados só neste aparelho, sem nuvem' : session?.user.email}
              </Text>
            </View>
          </View>
          <View style={[styles.divider, { backgroundColor: c.border }]} />
          {isLocal ? (
            <Pressable style={styles.row} onPress={leaveLocalMode}>
              <View style={[styles.iconBadge, { backgroundColor: c.primarySoft }]}>
                <MaterialCommunityIcons name="logout" size={18} color={c.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={[styles.rowTitle, { color: c.text }]}>Sair do modo local</Text>
                <Text style={[styles.rowHint, { color: c.textMuted }]}>
                  Volta pro login sem apagar nada — os dados continuam aqui.
                </Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
            </Pressable>
          ) : (
            <Pressable style={styles.row} onPress={signOut}>
              <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
                <MaterialCommunityIcons name="logout" size={18} color={c.danger} />
              </View>
              <Text style={[styles.rowTitle, { color: c.danger, flex: 1 }]}>Sair da conta</Text>
              <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
            </Pressable>
          )}
        </View>

        <Text style={[styles.sectionLabel, { color: c.textMuted }]}>Sobre</Text>
        <View style={card}>
          <Pressable style={styles.row} onPress={() => router.push('/legal')}>
            <View style={[styles.iconBadge, { backgroundColor: c.primarySoft }]}>
              <MaterialCommunityIcons name="shield-check-outline" size={18} color={c.primary} />
            </View>
            <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>
              Termos de uso e Privacidade
            </Text>
            <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
          </Pressable>
          {isAdmin && (
            <>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Pressable style={styles.row} onPress={() => router.push('/admin')}>
                <View style={[styles.iconBadge, { backgroundColor: c.primarySoft }]}>
                  <MaterialCommunityIcons
                    name="shield-crown-outline"
                    size={18}
                    color={c.primary}
                  />
                </View>
                <Text style={[styles.rowTitle, { color: c.text, flex: 1 }]}>
                  Opções de administrador
                </Text>
                <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
              </Pressable>
            </>
          )}
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
          {!isLocal && (
            <>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Pressable style={styles.row} onPress={() => setDangerAction('all')}>
                <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
                  <MaterialCommunityIcons
                    name="account-remove-outline"
                    size={18}
                    color={c.danger}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>
                    Excluir todos os meus dados
                  </Text>
                  <Text style={[styles.rowHint, { color: c.textMuted }]}>
                    Apaga despesas e metas, e sai da conta.
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
              </Pressable>
            </>
          )}
          {isLocal && (
            <>
              <View style={[styles.divider, { backgroundColor: c.border }]} />
              <Pressable style={styles.row} onPress={() => setDangerAction('local-exit')}>
                <View style={[styles.iconBadge, { backgroundColor: c.dangerSoft }]}>
                  <MaterialCommunityIcons
                    name="delete-forever-outline"
                    size={18}
                    color={c.danger}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.rowTitle, { color: c.text }]}>
                    Apagar dados locais e sair
                  </Text>
                  <Text style={[styles.rowHint, { color: c.textMuted }]}>
                    Apaga tudo salvo neste aparelho. Não tem como desfazer.
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={c.textMuted} />
              </Pressable>
            </>
          )}
        </View>

        {appVersion ? (
          <Text style={[styles.versionText, { color: c.textMuted }]}>Versão {appVersion}</Text>
        ) : null}
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

      <ConfirmDeleteSheet
        visible={dangerAction === 'local-exit'}
        title="Apagar dados locais e sair"
        description="Isso apaga permanentemente todas as despesas, categorias, metas, lembretes e parcelamentos salvos neste aparelho. Não tem como desfazer nem recuperar — não existe cópia na nuvem."
        confirmLabel="Apagar tudo e sair"
        onConfirm={handleConfirmLocalExit}
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  avatarWrap: { width: 52, height: 52 },
  avatar: { width: 52, height: 52, borderRadius: 26 },
  avatarFallback: { alignItems: 'center', justifyContent: 'center' },
  providerBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileName: { ...type.bodyBold, fontSize: 16 },
  profileEmail: { ...type.caption, marginTop: 1 },
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
  versionText: { ...type.caption, textAlign: 'center', marginTop: spacing.lg },
});
