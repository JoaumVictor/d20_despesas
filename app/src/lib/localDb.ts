import * as SQLite from 'expo-sqlite';
import { DEFAULT_CATEGORIES } from '@/features/categories/defaultCategories';
import { uuidv4 } from '@/utils/uuid';

/** Único usuário do perfil local — mantém as mesmas colunas `user_id` do schema remoto. */
export const LOCAL_USER_ID = 'local-profile';

const DB_NAME = 'd20_local.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

const SCHEMA = `
CREATE TABLE IF NOT EXISTS categories (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  id_sort INTEGER,
  name TEXT NOT NULL,
  icon TEXT NOT NULL,
  color TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS expenses (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  recurrent_id TEXT,
  category_id TEXT NOT NULL,
  count_part INTEGER NOT NULL,
  description TEXT NOT NULL,
  date_transaction TEXT NOT NULL,
  price REAL NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS goals (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  kind TEXT NOT NULL,
  amount REAL NOT NULL,
  month TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS installment_series (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  total_installments INTEGER NOT NULL,
  start_month TEXT NOT NULL,
  cancelled_from INTEGER,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS installment_occurrences (
  id TEXT PRIMARY KEY,
  series_id TEXT NOT NULL,
  installment_number INTEGER NOT NULL,
  month TEXT NOT NULL,
  status TEXT NOT NULL,
  expense_id TEXT,
  created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS reminders (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL,
  category_id TEXT NOT NULL,
  description TEXT NOT NULL,
  amount REAL NOT NULL,
  due_day INTEGER NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT
);
CREATE TABLE IF NOT EXISTS reminder_completions (
  id TEXT PRIMARY KEY,
  reminder_id TEXT NOT NULL,
  month TEXT NOT NULL,
  resolution TEXT NOT NULL,
  expense_id TEXT,
  created_at TEXT NOT NULL
);
`;

async function seedDefaultCategories(db: SQLite.SQLiteDatabase) {
  const now = new Date().toISOString();
  for (const cat of DEFAULT_CATEGORIES) {
    await db.runAsync(
      'INSERT INTO categories (id, user_id, id_sort, name, icon, color, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?, ?, NULL)',
      [uuidv4(), LOCAL_USER_ID, cat.idSort, cat.name, cat.icon, cat.color, now],
    );
  }
}

async function open(): Promise<SQLite.SQLiteDatabase> {
  const db = await SQLite.openDatabaseAsync(DB_NAME);
  await db.execAsync('PRAGMA foreign_keys = ON;');
  await db.execAsync(SCHEMA);
  const { count } = (await db.getFirstAsync<{ count: number }>(
    'SELECT COUNT(*) as count FROM categories',
  )) ?? { count: 0 };
  if (count === 0) await seedDefaultCategories(db);
  return db;
}

/** Handle único e reutilizado do banco local (SQLite) — só abre/migra uma vez. */
export function getLocalDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = open();
  return dbPromise;
}

/** Apaga todos os dados do perfil local (usado ao sair do modo local). */
export async function resetLocalDb(): Promise<void> {
  const db = await getLocalDb();
  await db.execAsync(`
    DELETE FROM reminder_completions;
    DELETE FROM reminders;
    DELETE FROM installment_occurrences;
    DELETE FROM installment_series;
    DELETE FROM goals;
    DELETE FROM expenses;
    DELETE FROM categories;
  `);
  await seedDefaultCategories(db);
}

export function newId(): string {
  return uuidv4();
}

export function nowISO(): string {
  return new Date().toISOString();
}
