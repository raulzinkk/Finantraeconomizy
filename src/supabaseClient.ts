import { createClient } from '@supabase/supabase-js';

// User's provided Supabase URL and Anon Key
const DEFAULT_SUPABASE_URL = 'https://qxoloftnafqvxvlsjzeg.supabase.co';
const DEFAULT_SUPABASE_ANON_KEY = 'sb_publishable_lOxCUSN6EtKBcLW1JYpK7w_LJAL4Ald';

const getEnvValue = (val: any, defaultVal: string): string => {
  if (!val) return defaultVal;
  const s = String(val).trim();
  if (s === '' || s === 'undefined' || s === 'null' || s === '""' || s === "''") {
    return defaultVal;
  }
  return s;
};

export const supabaseUrl = getEnvValue(import.meta.env.VITE_SUPABASE_URL, DEFAULT_SUPABASE_URL);
export const supabaseAnonKey = getEnvValue(import.meta.env.VITE_SUPABASE_ANON_KEY, DEFAULT_SUPABASE_ANON_KEY);

// Clean trailing rest/v1/ suffix to guarantee the client initializes correctly
const cleanUrl = supabaseUrl.replace(/\/rest\/v1\/?$/, '');

export const supabase = createClient(cleanUrl, supabaseAnonKey);


/**
 * SQL script for the user to easily copy and run in their Supabase dashboard (SQL Editor)
 * to set up the database tables correctly.
 */
export const SUPABASE_SETUP_SQL = `
-- 1. Create users table
CREATE TABLE IF NOT EXISTS users (
  email TEXT PRIMARY KEY,
  password_hash TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  username TEXT NOT NULL
);

-- 2. Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('earnings', 'expenses')),
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  category TEXT NOT NULL,
  date TEXT NOT NULL,
  payment_method TEXT DEFAULT 'Manual',
  notes TEXT,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL
);

-- 3. Create monthly_bills table
CREATE TABLE IF NOT EXISTS monthly_bills (
  id TEXT PRIMARY KEY,
  description TEXT NOT NULL,
  amount NUMERIC NOT NULL,
  due_date TEXT NOT NULL,
  category TEXT NOT NULL,
  is_paid BOOLEAN DEFAULT FALSE,
  notes TEXT,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL
);

-- 4. Create investments table
CREATE TABLE IF NOT EXISTS investments (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  amount_invested NUMERIC NOT NULL,
  current_amount NUMERIC NOT NULL,
  yield_rate NUMERIC,
  acquisition_date TEXT NOT NULL,
  broker TEXT NOT NULL,
  profile_id TEXT NOT NULL,
  user_id TEXT NOT NULL
);

-- Enable Row Level Security (RLS) but default to allow public access for development, or customize as needed:
ALTER TABLE users DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE monthly_bills DISABLE ROW LEVEL SECURITY;
ALTER TABLE investments DISABLE ROW LEVEL SECURITY;
`;
