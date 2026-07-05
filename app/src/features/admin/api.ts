import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@/features/auth/AuthContext';
import { supabase } from '@/lib/supabase';

export const PAGE_SIZE = 20;

/** true só pra contas Google marcadas como admin (nunca no modo local). */
export function useIsAdmin() {
  const { session, isLocal } = useAuth();
  return useQuery({
    queryKey: ['is-admin', session?.user.id],
    queryFn: async () => {
      if (isLocal) return false;
      const { data, error } = await supabase.rpc('is_admin');
      return error ? false : data;
    },
    enabled: Boolean(session),
  });
}

export interface InviteCodeRow {
  code: string;
  usedBy: string | null;
  usedByEmail: string | null;
  usedAt: string | null;
  createdAt: string;
}

const invitesKey = (page: number) => ['admin-invite-codes', page] as const;

export function useInviteCodesPage(page: number) {
  return useQuery({
    queryKey: invitesKey(page),
    queryFn: async () => {
      const { data, error } = await supabase.rpc('admin_list_invite_codes', {
        p_limit: PAGE_SIZE,
        p_offset: page * PAGE_SIZE,
      });
      if (error) throw error;
      const rows = data ?? [];
      const total = rows.length > 0 ? Number(rows[0].total_count) : 0;
      const items: InviteCodeRow[] = rows.map((r) => ({
        code: r.code,
        usedBy: r.used_by,
        usedByEmail: r.used_by_email,
        usedAt: r.used_at,
        createdAt: r.created_at,
      }));
      return { items, total };
    },
  });
}

function useInvalidateInviteCodes() {
  const qc = useQueryClient();
  return () => qc.invalidateQueries({ queryKey: ['admin-invite-codes'] });
}

export function useCreateInviteCode() {
  const invalidate = useInvalidateInviteCodes();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('admin_create_invite_code', { p_code: code });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useDeleteInviteCode() {
  const invalidate = useInvalidateInviteCodes();
  return useMutation({
    mutationFn: async (code: string) => {
      const { error } = await supabase.rpc('admin_delete_invite_code', { p_code: code });
      if (error) throw error;
    },
    onSuccess: invalidate,
  });
}

export function useUpdateInviteCode() {
  const invalidate = useInvalidateInviteCodes();
  return useMutation({
    mutationFn: async ({
      oldCode,
      newCode,
      reset,
    }: {
      oldCode: string;
      newCode: string;
      reset: boolean;
    }) => {
      const { data, error } = await supabase.rpc('admin_update_invite_code', {
        p_old_code: oldCode,
        p_new_code: newCode,
        p_reset: reset,
      });
      if (error) throw error;
      return data;
    },
    onSuccess: invalidate,
  });
}
