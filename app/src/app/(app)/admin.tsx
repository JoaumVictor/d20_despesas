import { MaterialCommunityIcons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { BottomSheet } from '@/components/BottomSheet';
import {
  PAGE_SIZE,
  useCreateInviteCode,
  useDeleteInviteCode,
  useInviteCodesPage,
  useUpdateInviteCode,
  type InviteCodeRow,
} from '@/features/admin/api';
import { radius, shadowCard, spacing, type } from '@/theme/tokens';
import { useTheme } from '@/theme/useTheme';
import { formatDate } from '@/utils/format';

export default function AdminScreen() {
  const c = useTheme();
  const [page, setPage] = useState(0);
  const { data, isLoading, isFetching } = useInviteCodesPage(page);

  const createCode = useCreateInviteCode();
  const deleteCode = useDeleteInviteCode();
  const updateCode = useUpdateInviteCode();

  const [createOpen, setCreateOpen] = useState(false);
  const [newCode, setNewCode] = useState('');

  const [editing, setEditing] = useState<InviteCodeRow | null>(null);
  const [editCode, setEditCode] = useState('');
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  async function handleCopy(code: string) {
    await Clipboard.setStringAsync(code);
    setCopiedCode(code);
    setTimeout(() => setCopiedCode((cur) => (cur === code ? null : cur)), 1500);
  }

  const total = data?.total ?? 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  async function handleCreate() {
    if (!newCode.trim()) return;
    try {
      await createCode.mutateAsync(newCode.trim());
      setNewCode('');
      setCreateOpen(false);
      setPage(0);
    } catch (err) {
      Alert.alert(
        'Erro ao criar código',
        err instanceof Error ? err.message : 'Esse código já existe.',
      );
    }
  }

  function confirmDelete(row: InviteCodeRow) {
    Alert.alert('Excluir código', `Remover o código "${row.code}"? Não tem como desfazer.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => deleteCode.mutate(row.code),
      },
    ]);
  }

  function openEdit(row: InviteCodeRow) {
    setEditing(row);
    setEditCode(row.code);
  }

  async function handleSaveEdit() {
    if (!editing || !editCode.trim()) return;
    try {
      await updateCode.mutateAsync({ oldCode: editing.code, newCode: editCode.trim(), reset: false });
      setEditing(null);
    } catch (err) {
      Alert.alert('Erro ao salvar', err instanceof Error ? err.message : 'Tente novamente.');
    }
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: c.bg }]} edges={['bottom']}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: c.text }]}>
          Códigos de convite {total > 0 ? `(${total})` : ''}
        </Text>
        <Pressable
          onPress={() => setCreateOpen(true)}
          style={[styles.addBtn, { backgroundColor: c.primary }]}
        >
          <MaterialCommunityIcons name="plus" size={18} color={c.primaryContrast} />
          <Text style={[styles.addText, { color: c.primaryContrast }]}>Novo</Text>
        </Pressable>
      </View>

      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} size="large" color={c.primary} />
      ) : (
        <FlatList
          data={data?.items ?? []}
          keyExtractor={(item) => item.code}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const used = Boolean(item.usedBy);
            return (
              <View style={[styles.row, shadowCard, { backgroundColor: c.surface, borderColor: c.border }]}>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.code, { color: c.text }]}>{item.code}</Text>
                  <Text style={[styles.meta, { color: used ? c.danger : c.success }]}>
                    {used ? `Usado por ${item.usedByEmail ?? 'conta removida'}` : 'Disponível'}
                  </Text>
                  <Text style={[styles.date, { color: c.textMuted }]}>
                    Criado em {formatDate(item.createdAt.slice(0, 10))}
                  </Text>
                </View>
                <View style={styles.actions}>
                  <Pressable onPress={() => handleCopy(item.code)} hitSlop={8}>
                    <MaterialCommunityIcons
                      name={copiedCode === item.code ? 'check' : 'content-copy'}
                      size={19}
                      color={copiedCode === item.code ? c.success : c.textMuted}
                    />
                  </Pressable>
                  <Pressable onPress={() => openEdit(item)} hitSlop={8}>
                    <MaterialCommunityIcons name="pencil-outline" size={19} color={c.textMuted} />
                  </Pressable>
                  <Pressable onPress={() => confirmDelete(item)} hitSlop={8}>
                    <MaterialCommunityIcons name="trash-can-outline" size={20} color={c.danger} />
                  </Pressable>
                </View>
              </View>
            );
          }}
          ListEmptyComponent={
            <View style={styles.empty}>
              <MaterialCommunityIcons name="ticket-confirmation-outline" size={48} color={c.border} />
              <Text style={[styles.emptyText, { color: c.textMuted }]}>
                Nenhum código de convite ainda.
              </Text>
            </View>
          }
          ListFooterComponent={
            totalPages > 1 ? (
              <View style={styles.pagination}>
                <Pressable
                  onPress={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="chevron-left"
                    size={24}
                    color={page === 0 ? c.border : c.primary}
                  />
                </Pressable>
                <Text style={[styles.pageLabel, { color: c.textMuted }]}>
                  {isFetching ? '...' : `Página ${page + 1} de ${totalPages}`}
                </Text>
                <Pressable
                  onPress={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1}
                  hitSlop={8}
                >
                  <MaterialCommunityIcons
                    name="chevron-right"
                    size={24}
                    color={page >= totalPages - 1 ? c.border : c.primary}
                  />
                </Pressable>
              </View>
            ) : null
          }
        />
      )}

      <BottomSheet visible={createOpen} onClose={() => setCreateOpen(false)} title="Novo código">
        <Text style={[styles.label, { color: c.textMuted }]}>Código</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surfaceAlt }]}
          value={newCode}
          onChangeText={setNewCode}
          placeholder="Ex: amigosdaonca"
          placeholderTextColor={c.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: c.primary, opacity: createCode.isPending ? 0.7 : 1 }]}
          onPress={handleCreate}
          disabled={createCode.isPending || !newCode.trim()}
        >
          {createCode.isPending ? (
            <ActivityIndicator color={c.primaryContrast} />
          ) : (
            <Text style={[styles.saveText, { color: c.primaryContrast }]}>Criar código</Text>
          )}
        </Pressable>
      </BottomSheet>

      <BottomSheet visible={Boolean(editing)} onClose={() => setEditing(null)} title="Editar código">
        <Text style={[styles.label, { color: c.textMuted }]}>Código</Text>
        <TextInput
          style={[styles.input, { borderColor: c.border, color: c.text, backgroundColor: c.surfaceAlt }]}
          value={editCode}
          onChangeText={setEditCode}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <Pressable
          style={[styles.saveBtn, { backgroundColor: c.primary, opacity: updateCode.isPending ? 0.7 : 1 }]}
          onPress={handleSaveEdit}
          disabled={updateCode.isPending || !editCode.trim()}
        >
          {updateCode.isPending ? (
            <ActivityIndicator color={c.primaryContrast} />
          ) : (
            <Text style={[styles.saveText, { color: c.primaryContrast }]}>Salvar alterações</Text>
          )}
        </Pressable>
      </BottomSheet>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.xl,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
  },
  title: { ...type.heading, fontSize: 17, flex: 1 },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    borderRadius: radius.pill,
    paddingVertical: 8,
    paddingHorizontal: 14,
  },
  addText: { fontSize: 13, fontWeight: '700' },
  listContent: { paddingHorizontal: spacing.xl, paddingBottom: 64 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    gap: spacing.md,
  },
  code: { ...type.bodyBold, fontSize: 15 },
  meta: { ...type.caption, marginTop: 2, fontWeight: '700' },
  date: { ...type.caption, marginTop: 1 },
  actions: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  empty: { alignItems: 'center', gap: spacing.sm, marginTop: 60 },
  emptyText: { ...type.body, textAlign: 'center' },
  pagination: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    marginTop: spacing.md,
  },
  pageLabel: { ...type.caption, fontWeight: '700' },
  label: { ...type.label, marginTop: spacing.lg, marginBottom: spacing.sm },
  input: {
    borderWidth: 1,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 13,
    fontSize: 16,
  },
  saveBtn: {
    borderRadius: radius.md,
    paddingVertical: 15,
    alignItems: 'center',
    marginTop: spacing.xxl,
  },
  saveText: { ...type.bodyBold, fontSize: 16 },
});
