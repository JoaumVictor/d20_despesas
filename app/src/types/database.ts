/**
 * Tipagem do banco (schema d20_despesas).
 * Estrutura derivada do Despesas.db original + colunas de multi-usuário/RLS.
 */
export type ExpenseStatus = 'PAY' | 'NOTPAY';

export type CategoryRow = {
  id: string;
  user_id: string;
  id_sort: number | null;
  name: string;
  icon: string;
  color: string;
  created_at: string;
  updated_at: string | null;
};

export type GoalKind = 'limit' | 'target';

export type GoalRow = {
  id: string;
  user_id: string;
  category_id: string;
  kind: GoalKind;
  amount: number;
  /** null = recorrente (todo mês); senão YYYY-MM-01 do mês em que vale */
  month: string | null;
  created_at: string;
  updated_at: string | null;
};

export type ExpenseRow = {
  id: string;
  user_id: string;
  recurrent_id: string | null;
  category_id: string;
  count_part: number;
  description: string;
  date_transaction: string;
  price: number;
  status: ExpenseStatus;
  created_at: string;
  updated_at: string | null;
};

export type InstallmentOccurrenceStatus = 'confirmed' | 'cancelled';

export type InstallmentSeriesRow = {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  total_installments: number;
  /** 1º dia do mês da 1ª parcela (YYYY-MM-01) */
  start_month: string;
  /** se preenchido, nenhum fantasma >= esse número é gerado */
  cancelled_from: number | null;
  created_at: string;
  updated_at: string | null;
};

export type InstallmentOccurrenceRow = {
  id: string;
  series_id: string;
  installment_number: number;
  /** 1º dia do mês daquela parcela (YYYY-MM-01) */
  month: string;
  status: InstallmentOccurrenceStatus;
  expense_id: string | null;
  created_at: string;
};

export type ReminderRow = {
  id: string;
  user_id: string;
  category_id: string;
  description: string;
  amount: number;
  due_day: number;
  created_at: string;
  updated_at: string | null;
};

export type ReminderResolution = 'expense' | 'done_only';

export type ReminderCompletionRow = {
  id: string;
  reminder_id: string;
  /** 1º dia do mês (YYYY-MM-01) */
  month: string;
  resolution: ReminderResolution;
  expense_id: string | null;
  created_at: string;
};

type Insert<T, Optional extends keyof T> = Omit<T, Optional> & Partial<Pick<T, Optional>>;

export interface Database {
  d20_despesas: {
    Tables: {
      categories: {
        Row: CategoryRow;
        Insert: Insert<CategoryRow, 'id' | 'created_at' | 'updated_at' | 'id_sort'>;
        Update: Partial<CategoryRow>;
        Relationships: [];
      };
      expenses: {
        Row: ExpenseRow;
        Insert: Insert<
          ExpenseRow,
          'id' | 'created_at' | 'updated_at' | 'recurrent_id' | 'count_part'
        >;
        Update: Partial<ExpenseRow>;
        Relationships: [];
      };
      goals: {
        Row: GoalRow;
        Insert: Insert<GoalRow, 'id' | 'created_at' | 'updated_at' | 'month'>;
        Update: Partial<GoalRow>;
        Relationships: [];
      };
      installment_series: {
        Row: InstallmentSeriesRow;
        Insert: Insert<
          InstallmentSeriesRow,
          'id' | 'created_at' | 'updated_at' | 'cancelled_from'
        >;
        Update: Partial<InstallmentSeriesRow>;
        Relationships: [];
      };
      installment_occurrences: {
        Row: InstallmentOccurrenceRow;
        Insert: Insert<InstallmentOccurrenceRow, 'id' | 'created_at' | 'expense_id'>;
        Update: Partial<InstallmentOccurrenceRow>;
        Relationships: [];
      };
      reminders: {
        Row: ReminderRow;
        Insert: Insert<ReminderRow, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<ReminderRow>;
        Relationships: [];
      };
      reminder_completions: {
        Row: ReminderCompletionRow;
        Insert: Insert<ReminderCompletionRow, 'id' | 'created_at' | 'expense_id'>;
        Update: Partial<ReminderCompletionRow>;
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: {
      check_invite_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
      redeem_invite_code: {
        Args: { p_code: string };
        Returns: boolean;
      };
      has_redeemed_invite: {
        Args: Record<string, never>;
        Returns: boolean;
      };
    };
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
