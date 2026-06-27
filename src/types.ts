/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export type TransactionType = 'earnings' | 'expenses';

export interface Transaction {
  id: string;
  type: TransactionType;
  description: string;
  amount: number;
  category: string;
  date: string;
  paymentMethod: string;
  notes?: string;
  profileId: string; // Used to separate workspace data in Supabase/localStorage
}

export interface MonthlyBill {
  id: string;
  description: string;
  amount: number;
  dueDate: string;
  category: string;
  isPaid: boolean;
  notes?: string;
  profileId: string;
}

export interface Investment {
  id: string;
  name: string;
  type: 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Cripto' | 'Outros';
  amountInvested: number;
  currentAmount: number;
  yieldRate?: number; // annual or monthly %
  acquisitionDate: string;
  broker: string; // Corretora / Instituição
  profileId: string;
}

export interface UserPreferences {
  currency: string; // 'BRL' | 'USD' | 'EUR'
  monthlyIncomeGoal: number;
  monthlyExpenseLimit: number;
  savingsGoal: number;
  categoryLimits?: Record<string, number>; // Maps custom expense category names to their maximum allowable budget limit
}

export interface AppProfile {
  id: string; // Unique passcode / key used to fetch and store in Supabase or local
  name: string;
  isCloudSync: boolean; // True if using Supabase, false for purely local
}

export interface SupabaseStatus {
  isConnected: boolean;
  isSynced: boolean;
  errorMsg?: string;
}

export interface AppNotification {
  id: string;
  type: 'bill_added' | 'earning_added' | 'expense_added' | 'investment_added' | 'maintenance';
  title: string;
  description: string;
  timestamp: string; // ISO string or formatted
  isRead: boolean;
  isMaintenance: boolean;
  expiryTime?: number; // timestamp in milliseconds (e.g. Date.now() + 2 * 60 * 60 * 1000)
}

export interface TrashItem {
  id: string;
  transaction: Transaction;
  deletedAt: string; // ISO string
}


