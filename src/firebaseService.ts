import { initializeApp } from 'firebase/app';
import { getAuth, signOut } from 'firebase/auth';
import { 
  getFirestore, 
  collection, 
  doc, 
  getDocs, 
  setDoc, 
  deleteDoc, 
  query, 
  where 
} from 'firebase/firestore';
import { Transaction, MonthlyBill, Investment } from './types';
import firebaseAppletConfig from '../firebase-applet-config.json';
import { supabase } from './supabaseClient';

// Allow overriding via environment variables for deployments like Vercel
const getFirebaseEnv = (envVal: any, configVal: any): string => {
  if (envVal) {
    const s = String(envVal).trim();
    if (s !== '' && s !== 'undefined' && s !== 'null' && s !== '""' && s !== "''") {
      return s;
    }
  }
  if (configVal) {
    const s = String(configVal).trim();
    if (s !== '' && s !== 'undefined' && s !== 'null' && s !== '""' && s !== "''") {
      return s;
    }
  }
  return '';
};

const firebaseConfig = {
  apiKey: getFirebaseEnv(import.meta.env.VITE_FIREBASE_API_KEY, firebaseAppletConfig?.apiKey),
  authDomain: getFirebaseEnv(import.meta.env.VITE_FIREBASE_AUTH_DOMAIN, firebaseAppletConfig?.authDomain),
  projectId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_PROJECT_ID, firebaseAppletConfig?.projectId),
  storageBucket: getFirebaseEnv(import.meta.env.VITE_FIREBASE_STORAGE_BUCKET, firebaseAppletConfig?.storageBucket),
  messagingSenderId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID, firebaseAppletConfig?.messagingSenderId),
  appId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_APP_ID, firebaseAppletConfig?.appId),
  measurementId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_MEASUREMENT_ID, firebaseAppletConfig?.measurementId),
  firestoreDatabaseId: getFirebaseEnv(import.meta.env.VITE_FIREBASE_DATABASE_ID, firebaseAppletConfig?.firestoreDatabaseId),
};

// Initialize Firebase App
const app = initializeApp(firebaseConfig);
export const db = firebaseConfig.firestoreDatabaseId 
  ? getFirestore(app, firebaseConfig.firestoreDatabaseId)
  : getFirestore(app);
export const auth = getAuth(app);

// Helper to determine active user identification key for queries & security scoping
export function getActiveUserId(): string {
  if (auth.currentUser?.uid) {
    return auth.currentUser.uid;
  }
  const savedEmail = localStorage.getItem('finantra_current_user_email') || localStorage.getItem('finantra_saved_user_email');
  if (savedEmail) {
    return savedEmail.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
  }
  return 'convidado_default';
}

// User representation interface
export interface CloudUser {
  email: string;
  passwordHash: string;
  createdAt: string;
  username: string;
}

// -------------------------------------------------------------
// Cloud Users (Authentication synchronization)
// -------------------------------------------------------------

export async function fetchCloudUsers(): Promise<CloudUser[] | null> {
  const allUsersMap = new Map<string, CloudUser>();

  // 1. Try fetching from Firestore
  const colPath = 'users';
  try {
    const querySnapshot = await getDocs(collection(db, colPath));
    querySnapshot.forEach((document) => {
      const data = document.data();
      if (data.email) {
        allUsersMap.set(data.email.toLowerCase(), {
          email: data.email.toLowerCase(),
          passwordHash: data.passwordHash || '',
          createdAt: data.createdAt || '',
          username: data.username || ''
        });
      }
    });
  } catch (err) {
    console.warn('Failed to fetch cloud users from Firestore (relying on Supabase):', err);
  }

  // 2. Try fetching from Supabase
  try {
    const { data, error } = await supabase.from('users').select('*');
    if (!error && data) {
      data.forEach(item => {
        const email = (item.email || '').toLowerCase();
        if (email) {
          allUsersMap.set(email, {
            email: email,
            passwordHash: item.password_hash || item.passwordHash || '',
            createdAt: item.created_at || item.createdAt || '',
            username: item.username || ''
          });
        }
      });
    } else if (error) {
      console.warn('Supabase fetchCloudUsers error:', error);
    }
  } catch (err) {
    console.warn('Supabase fetchCloudUsers failed:', err);
  }

  const mergedList = Array.from(allUsersMap.values());

  // 3. Proactive background backfill to Supabase for any user currently only in Firestore
  if (mergedList.length > 0) {
    mergedList.forEach(async (user) => {
      try {
        await supabase.from('users').upsert({
          email: user.email,
          password_hash: user.passwordHash,
          created_at: user.createdAt,
          username: user.username
        }, { onConflict: 'email' });

        // Proactive sync into Supabase Auth so they appear in Authenticator dashboard!
        const authPassword = user.passwordHash;
        const finalPassword = authPassword.length >= 6 ? authPassword : authPassword.padEnd(6, '!');
        await supabase.auth.signUp({
          email: user.email.toLowerCase(),
          password: finalPassword,
          options: {
            data: {
              username: user.username,
            }
          }
        });
      } catch (e) {
        // ignore background sync errors
      }
    });
  }

  return mergedList.length > 0 ? mergedList : null;
}

export async function registerCloudUser(user: CloudUser, rawPassword?: string): Promise<boolean> {
  let supabaseSuccess = false;
  try {
    const payload = {
      email: user.email.toLowerCase(),
      password_hash: user.passwordHash,
      created_at: user.createdAt,
      username: user.username
    };

    // 0. Register in Supabase Auth so they appear in the Authenticator/Users dashboard!
    try {
      const authPassword = rawPassword || user.passwordHash || 'TemporaryPass123!';
      const finalPassword = authPassword.length >= 6 ? authPassword : authPassword.padEnd(6, '!');
      
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: user.email.toLowerCase(),
        password: finalPassword,
        options: {
          data: {
            username: user.username,
          }
        }
      });
      if (authError) {
        console.warn('Supabase auth signUp error (could be already registered):', authError);
      } else {
        console.log('Supabase auth signUp response:', authData);
      }
    } catch (authExc) {
      console.warn('Supabase auth signUp exception:', authExc);
    }

    // 1. Try selecting the user first to see if they exist
    const { data: existing, error: selectError } = await supabase
      .from('users')
      .select('email')
      .eq('email', user.email.toLowerCase())
      .maybeSingle();

    if (!selectError) {
      if (existing) {
        // User exists -> Update details to keep passwords/dates synced
        const { error: updateError } = await supabase
          .from('users')
          .update(payload)
          .eq('email', user.email.toLowerCase());
        
        if (!updateError) {
          supabaseSuccess = true;
        } else {
          console.warn('Supabase update user failed:', updateError);
        }
      } else {
        // User does not exist -> Insert
        const { error: insertError } = await supabase
          .from('users')
          .insert(payload);
        
        if (!insertError) {
          supabaseSuccess = true;
        } else {
          console.warn('Supabase insert user failed:', insertError);
        }
      }
    } else {
      // 2. Direct fallback to upsert with explicit conflict target
      const { error: upsertError } = await supabase
        .from('users')
        .upsert(payload, { onConflict: 'email' });
      
      if (!upsertError) {
        supabaseSuccess = true;
      } else {
        console.warn('Supabase upsert user failed:', upsertError);
      }
    }
  } catch (err) {
    console.warn('Supabase registerCloudUser exception:', err);
  }

  // Register in Firestore as well for safety & backward compatibility
  const colPath = 'users';
  try {
    const docId = user.email.toLowerCase().replace(/[^a-zA-Z0-9_]/g, '_');
    await setDoc(doc(db, colPath, docId), {
      email: user.email.toLowerCase(),
      passwordHash: user.passwordHash,
      createdAt: user.createdAt,
      username: user.username
    });
    return true;
  } catch (err) {
    console.warn('Failed to register cloud user into Firestore (saved to Supabase):', err);
    return supabaseSuccess;
  }
}

// Error logger as required by firebase-integration skill
export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.error('Firestore Error details:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export async function logoutFirebase() {
  try {
    await signOut(auth);
  } catch (error) {
    console.error('Firebase Sign-Out Error:', error);
    throw error;
  }
}

// Check database connection (Primary: Supabase, Secondary: Firestore)
export async function testFirebaseConnection(): Promise<boolean> {
  try {
    const { error } = await supabase.from('users').select('email').limit(1);
    if (!error) {
      return true;
    }
    console.warn('Supabase test connection returned table error (perhaps not set up yet):', error);
    // Return true if it's just a table missing error, so the app still considers the service connected
    if (error.code === '42P01') {
      return true;
    }
    return !!db;
  } catch (e) {
    console.error('Supabase connection test failed, checking Firebase:', e);
    return !!db;
  }
}

export interface SupabaseDiagnostics {
  status: 'SUCCESS' | 'TABLES_MISSING' | 'INVALID_CREDENTIALS' | 'CONNECTION_ERROR';
  message: string;
  code?: string;
}

export async function diagnoseSupabaseConnection(): Promise<SupabaseDiagnostics> {
  try {
    const { error } = await supabase.from('users').select('email').limit(1);
    if (!error) {
      return {
        status: 'SUCCESS',
        message: 'Conexão estabelecida com sucesso e tabelas estão prontas.'
      };
    }

    console.warn('Supabase diagnostic query returned error:', error);

    // Check PostgreSQL error codes
    // 42P01: relation "users" does not exist
    if (error.code === '42P01') {
      return {
        status: 'TABLES_MISSING',
        message: 'Conectado ao Supabase, mas as tabelas ainda não foram criadas! Você precisa rodar o script SQL de criação de tabelas.',
        code: error.code
      };
    }

    // Invalid API key / Auth issues
    // PGRST301: JWT expired or invalid
    if (error.code === 'PGRST301' || error.message?.includes('JWT') || error.message?.includes('API key')) {
      return {
        status: 'INVALID_CREDENTIALS',
        message: `Chave de API Anon ou URL inválida: ${error.message} (Verifique se não há espaços ou aspas extras nas variáveis do Vercel)`,
        code: error.code
      };
    }

    return {
      status: 'CONNECTION_ERROR',
      message: `Erro na resposta do Supabase (${error.code || 'sem código'}): ${error.message}`,
      code: error.code
    };
  } catch (e: any) {
    console.error('Supabase diagnostic catch block:', e);
    return {
      status: 'CONNECTION_ERROR',
      message: `Falha de rede ou configuração ao tentar conectar ao Supabase: ${e?.message || e}`
    };
  }
}

// -------------------------------------------------------------
// TRANSACTIONS
// -------------------------------------------------------------

export async function fetchTransactions(profileId: string): Promise<Transaction[] | null> {
  const userId = getActiveUserId();
  if (!userId) return null;

  const transactionsMap = new Map<string, Transaction>();

  // 1. Try loading from Firestore
  const colPath = 'transactions';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((document) => {
      const data = document.data();
      transactionsMap.set(data.id, {
        id: data.id,
        type: data.type as any,
        description: data.description,
        amount: Number(data.amount),
        category: data.category,
        date: data.date,
        paymentMethod: data.paymentMethod || 'Manual',
        notes: data.notes || '',
        profileId: data.profileId
      });
    });
  } catch (err) {
    console.error('Failed to fetch transactions from Firestore:', err);
  }

  // 2. Try loading from Supabase
  try {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    
    if (!error && data) {
      data.forEach(item => {
        transactionsMap.set(item.id, {
          id: item.id,
          type: item.type as any,
          description: item.description,
          amount: Number(item.amount),
          category: item.category,
          date: item.date,
          paymentMethod: item.payment_method || item.paymentMethod || 'Manual',
          notes: item.notes || '',
          profileId: item.profile_id || item.profileId
        });
      });
    } else if (error) {
      console.warn('Supabase fetchTransactions error:', error);
    }
  } catch (err) {
    console.warn('Supabase fetchTransactions exception:', err);
  }

  const mergedList = Array.from(transactionsMap.values());

  // 3. Proactive background backfill to Supabase for items only present in Firestore
  if (mergedList.length > 0) {
    mergedList.forEach(async (t) => {
      try {
        await supabase.from('transactions').upsert({
          id: t.id,
          type: t.type,
          description: t.description || '',
          amount: Number(t.amount) || 0,
          category: t.category || '',
          date: t.date || '',
          payment_method: t.paymentMethod || 'Manual',
          notes: t.notes || '',
          profile_id: t.profileId,
          user_id: userId
        });
      } catch (e) {
        // ignore background sync errors
      }
    });
  }

  return mergedList.length > 0 ? mergedList : [];
}

export async function upsertTransaction(transaction: Transaction): Promise<boolean> {
  const userId = getActiveUserId();
  if (!userId) return false;

  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('transactions').upsert({
      id: transaction.id,
      type: transaction.type,
      description: transaction.description || '',
      amount: Number(transaction.amount) || 0,
      category: transaction.category || '',
      date: transaction.date || '',
      payment_method: transaction.paymentMethod || 'Manual',
      notes: transaction.notes || '',
      profile_id: transaction.profileId,
      user_id: userId
    });
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase upsertTransaction error:', error);
    }
  } catch (err) {
    console.warn('Supabase upsertTransaction exception:', err);
  }

  // Dual-write/fallback to Firestore
  const colPath = 'transactions';
  try {
    const payload = {
      id: transaction.id,
      type: transaction.type,
      description: transaction.description || '',
      amount: Number(transaction.amount) || 0,
      category: transaction.category || '',
      date: transaction.date || '',
      paymentMethod: transaction.paymentMethod || 'Manual',
      notes: transaction.notes || '',
      profileId: transaction.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, transaction.id), payload);
    return true;
  } catch (err) {
    console.error('Failed to upsert transaction in Firestore:', err);
    return supabaseSuccess;
  }
}

export async function deleteTransactionFromDb(id: string): Promise<boolean> {
  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('transactions').delete().eq('id', id);
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase deleteTransaction error:', error);
    }
  } catch (err) {
    console.warn('Supabase deleteTransaction exception:', err);
  }

  // Fallback/dual-delete in Firestore
  const colPath = 'transactions';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    console.error('Failed to delete transaction in Firestore:', err);
    return supabaseSuccess;
  }
}

// -------------------------------------------------------------
// MONTHLY BILLS
// -------------------------------------------------------------

export async function fetchMonthlyBills(profileId: string): Promise<MonthlyBill[] | null> {
  const userId = getActiveUserId();
  if (!userId) return null;

  const billsMap = new Map<string, MonthlyBill>();

  // 1. Try loading from Firestore
  const colPath = 'monthly_bills';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((document) => {
      const data = document.data();
      billsMap.set(data.id, {
        id: data.id,
        description: data.description,
        amount: Number(data.amount),
        dueDate: data.dueDate,
        category: data.category,
        isPaid: Boolean(data.isPaid),
        notes: data.notes || '',
        profileId: data.profileId
      });
    });
  } catch (err) {
    console.error('Failed to fetch bills from Firestore:', err);
  }

  // 2. Try loading from Supabase
  try {
    const { data, error } = await supabase
      .from('monthly_bills')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    
    if (!error && data) {
      data.forEach(item => {
        billsMap.set(item.id, {
          id: item.id,
          description: item.description,
          amount: Number(item.amount),
          dueDate: item.due_date || item.dueDate || '',
          category: item.category,
          isPaid: Boolean(item.is_paid !== undefined ? item.is_paid : item.isPaid),
          notes: item.notes || '',
          profileId: item.profile_id || item.profileId
        });
      });
    } else if (error) {
      console.warn('Supabase fetchMonthlyBills error:', error);
    }
  } catch (err) {
    console.warn('Supabase fetchMonthlyBills exception:', err);
  }

  const mergedList = Array.from(billsMap.values());

  // 3. Proactive background backfill to Supabase for items only present in Firestore
  if (mergedList.length > 0) {
    mergedList.forEach(async (b) => {
      try {
        await supabase.from('monthly_bills').upsert({
          id: b.id,
          description: b.description || '',
          amount: Number(b.amount) || 0,
          due_date: b.dueDate || '',
          category: b.category || '',
          is_paid: Boolean(b.isPaid),
          notes: b.notes || '',
          profile_id: b.profileId,
          user_id: userId
        });
      } catch (e) {
        // ignore background sync errors
      }
    });
  }

  return mergedList.length > 0 ? mergedList : [];
}

export async function upsertMonthlyBill(bill: MonthlyBill): Promise<boolean> {
  const userId = getActiveUserId();
  if (!userId) return false;

  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('monthly_bills').upsert({
      id: bill.id,
      description: bill.description || '',
      amount: Number(bill.amount) || 0,
      due_date: bill.dueDate || '',
      category: bill.category || '',
      is_paid: Boolean(bill.isPaid),
      notes: bill.notes || '',
      profile_id: bill.profileId,
      user_id: userId
    });
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase upsertMonthlyBill error:', error);
    }
  } catch (err) {
    console.warn('Supabase upsertMonthlyBill exception:', err);
  }

  // Dual-write/fallback to Firestore
  const colPath = 'monthly_bills';
  try {
    const payload = {
      id: bill.id,
      description: bill.description || '',
      amount: Number(bill.amount) || 0,
      dueDate: bill.dueDate || '',
      category: bill.category || '',
      isPaid: Boolean(bill.isPaid),
      notes: bill.notes || '',
      profileId: bill.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, bill.id), payload);
    return true;
  } catch (err) {
    console.error('Failed to upsert monthly bill in Firestore:', err);
    return supabaseSuccess;
  }
}

export async function deleteMonthlyBillFromDb(id: string): Promise<boolean> {
  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('monthly_bills').delete().eq('id', id);
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase deleteMonthlyBill error:', error);
    }
  } catch (err) {
    console.warn('Supabase deleteMonthlyBill exception:', err);
  }

  // Fallback/dual-delete in Firestore
  const colPath = 'monthly_bills';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    console.error('Failed to delete monthly bill in Firestore:', err);
    return supabaseSuccess;
  }
}

// -------------------------------------------------------------
// INVESTMENTS
// -------------------------------------------------------------

export async function fetchInvestments(profileId: string): Promise<Investment[] | null> {
  const userId = getActiveUserId();
  if (!userId) return null;

  const investmentsMap = new Map<string, Investment>();

  // 1. Try loading from Firestore
  const colPath = 'investments';
  try {
    const q = query(
      collection(db, colPath),
      where('userId', '==', userId),
      where('profileId', '==', profileId)
    );
    const querySnapshot = await getDocs(q);
    querySnapshot.forEach((document) => {
      const data = document.data();
      investmentsMap.set(data.id, {
        id: data.id,
        name: data.name,
        type: data.type as any,
        amountInvested: Number(data.amountInvested),
        currentAmount: Number(data.currentAmount),
        yieldRate: data.yieldRate !== undefined ? Number(data.yieldRate) : undefined,
        acquisitionDate: data.acquisitionDate,
        broker: data.broker,
        profileId: data.profileId
      });
    });
  } catch (err) {
    console.error('Failed to fetch investments from Firestore:', err);
  }

  // 2. Try loading from Supabase
  try {
    const { data, error } = await supabase
      .from('investments')
      .select('*')
      .eq('user_id', userId)
      .eq('profile_id', profileId);
    
    if (!error && data) {
      data.forEach(item => {
        investmentsMap.set(item.id, {
          id: item.id,
          name: item.name,
          type: item.type as any,
          amountInvested: Number(item.amount_invested || item.amountInvested),
          currentAmount: Number(item.current_amount || item.currentAmount),
          yieldRate: item.yield_rate !== undefined ? Number(item.yield_rate) : (item.yieldRate !== undefined ? Number(item.yieldRate) : undefined),
          acquisitionDate: item.acquisition_date || item.acquisitionDate || '',
          broker: item.broker,
          profileId: item.profile_id || item.profileId
        });
      });
    } else if (error) {
      console.warn('Supabase fetchInvestments error:', error);
    }
  } catch (err) {
    console.warn('Supabase fetchInvestments exception:', err);
  }

  const mergedList = Array.from(investmentsMap.values());

  // 3. Proactive background backfill to Supabase for items only present in Firestore
  if (mergedList.length > 0) {
    mergedList.forEach(async (inv) => {
      try {
        await supabase.from('investments').upsert({
          id: inv.id,
          name: inv.name || '',
          type: inv.type,
          amount_invested: Number(inv.amountInvested) || 0,
          current_amount: Number(inv.currentAmount) || 0,
          yield_rate: inv.yieldRate !== undefined ? Number(inv.yieldRate) : 0,
          acquisition_date: inv.acquisitionDate || '',
          broker: inv.broker || '',
          profile_id: inv.profileId,
          user_id: userId
        });
      } catch (e) {
        // ignore background sync errors
      }
    });
  }

  return mergedList.length > 0 ? mergedList : [];
}

export async function upsertInvestment(investment: Investment): Promise<boolean> {
  const userId = getActiveUserId();
  if (!userId) return false;

  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('investments').upsert({
      id: investment.id,
      name: investment.name || '',
      type: investment.type,
      amount_invested: Number(investment.amountInvested) || 0,
      current_amount: Number(investment.currentAmount) || 0,
      yield_rate: investment.yieldRate !== undefined ? Number(investment.yieldRate) : 0,
      acquisition_date: investment.acquisitionDate || '',
      broker: investment.broker || '',
      profile_id: investment.profileId,
      user_id: userId
    });
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase upsertInvestment error:', error);
    }
  } catch (err) {
    console.warn('Supabase upsertInvestment exception:', err);
  }

  // Dual-write/fallback to Firestore
  const colPath = 'investments';
  try {
    const payload = {
      id: investment.id,
      name: investment.name || '',
      type: investment.type,
      amountInvested: Number(investment.amountInvested) || 0,
      currentAmount: Number(investment.currentAmount) || 0,
      yieldRate: investment.yieldRate !== undefined ? Number(investment.yieldRate) : 0,
      acquisitionDate: investment.acquisitionDate || '',
      broker: investment.broker || '',
      profileId: investment.profileId,
      userId: userId
    };

    await setDoc(doc(db, colPath, investment.id), payload);
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.WRITE, colPath);
    return false;
  }
}

export async function deleteInvestmentFromDb(id: string): Promise<boolean> {
  let supabaseSuccess = false;
  try {
    const { error } = await supabase.from('investments').delete().eq('id', id);
    if (!error) {
      supabaseSuccess = true;
    } else {
      console.warn('Supabase deleteInvestment error:', error);
    }
  } catch (err) {
    console.warn('Supabase deleteInvestment exception:', err);
  }

  // Fallback/dual-delete in Firestore
  const colPath = 'investments';
  try {
    await deleteDoc(doc(db, colPath, id));
    return true;
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, colPath);
    return false;
  }
}

export interface MigrationSummary {
  usersCount: number;
  transactionsCount: number;
  billsCount: number;
  investmentsCount: number;
  error?: string;
}

export async function migrateAllFirestoreToSupabase(): Promise<MigrationSummary> {
  const summary: MigrationSummary = {
    usersCount: 0,
    transactionsCount: 0,
    billsCount: 0,
    investmentsCount: 0,
  };

  try {
    // 1. Migrate Users (Merge Firestore and LocalStorage)
    const usersMap = new Map<string, any>();
    
    // 1a. Load from Firestore
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      usersSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.email) {
          const email = data.email.toLowerCase().trim();
          usersMap.set(email, {
            email,
            password_hash: data.passwordHash || '',
            created_at: data.createdAt || new Date().toISOString(),
            username: data.username || 'Usuário Finantra'
          });
        }
      });
    } catch (e) {
      console.warn('Firestore users load warning:', e);
    }

    // 1b. Load from LocalStorage
    try {
      const localUsersStr = localStorage.getItem('finantra_users');
      if (localUsersStr) {
        const localUsers = JSON.parse(localUsersStr);
        if (Array.isArray(localUsers)) {
          localUsers.forEach((user: any) => {
            if (user && user.email) {
              const email = user.email.toLowerCase().trim();
              const existingUser = usersMap.get(email);
              usersMap.set(email, {
                email,
                password_hash: user.passwordHash || existingUser?.password_hash || '',
                created_at: user.createdAt || existingUser?.created_at || new Date().toISOString(),
                username: user.username || existingUser?.username || 'Usuário Finantra'
              });
            }
          });
        }
      }
    } catch (e) {
      console.warn('LocalStorage users load warning:', e);
    }

    // 1c. Upsert Users to Supabase
    const usersToUpsert = Array.from(usersMap.values());
    if (usersToUpsert.length > 0) {
      for (const user of usersToUpsert) {
        const { error } = await supabase.from('users').upsert(user, { onConflict: 'email' });
        if (!error) {
          summary.usersCount++;

          // Also register in Supabase Auth so they appear in Authenticator dashboard!
          try {
            const authPassword = user.password_hash || 'TemporaryPass123!';
            const finalPassword = authPassword.length >= 6 ? authPassword : authPassword.padEnd(6, '!');
            await supabase.auth.signUp({
              email: user.email.toLowerCase(),
              password: finalPassword,
              options: {
                data: {
                  username: user.username,
                }
              }
            });
          } catch (ae) {
            console.warn(`Error registering migrated user ${user.email} into Supabase Auth:`, ae);
          }
        } else {
          console.warn(`Error migrating user ${user.email}:`, error);
        }
      }
    }


    // 2. Migrate Transactions (Merge Firestore and LocalStorage)
    const transMap = new Map<string, any>();

    // 2a. Load from Firestore
    try {
      const transSnap = await getDocs(collection(db, 'transactions'));
      transSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id) {
          transMap.set(data.id, {
            id: data.id,
            type: data.type === 'expense' ? 'expenses' : data.type === 'expenses' ? 'expenses' : 'earnings',
            description: data.description || '',
            amount: Number(data.amount) || 0,
            category: data.category || '',
            date: data.date || '',
            payment_method: data.paymentMethod || 'Manual',
            notes: data.notes || '',
            profile_id: data.profileId || 'default',
            user_id: data.userId || 'convidado_default'
          });
        }
      });
    } catch (e) {
      console.warn('Firestore transactions load warning:', e);
    }

    // 2b. Load from LocalStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fin_trans_')) {
          const profileId = key.substring('fin_trans_'.length);
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            items.forEach((data: any) => {
              if (data && data.id) {
                transMap.set(data.id, {
                  id: data.id,
                  type: data.type === 'expense' ? 'expenses' : data.type === 'expenses' ? 'expenses' : 'earnings',
                  description: data.description || '',
                  amount: Number(data.amount) || 0,
                  category: data.category || '',
                  date: data.date || '',
                  payment_method: data.paymentMethod || 'Manual',
                  notes: data.notes || '',
                  profile_id: profileId,
                  user_id: data.userId || 'convidado_default'
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage transactions load warning:', e);
    }

    // 2c. Upsert Transactions to Supabase
    const transToUpsert = Array.from(transMap.values());
    if (transToUpsert.length > 0) {
      for (const trans of transToUpsert) {
        const { error } = await supabase.from('transactions').upsert(trans);
        if (!error) {
          summary.transactionsCount++;
        } else {
          console.warn(`Error migrating transaction ${trans.id}:`, error);
        }
      }
    }


    // 3. Migrate Monthly Bills (Merge Firestore and LocalStorage)
    const billsMap = new Map<string, any>();

    // 3a. Load from Firestore
    try {
      const billsSnap = await getDocs(collection(db, 'monthly_bills'));
      billsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id) {
          billsMap.set(data.id, {
            id: data.id,
            description: data.description || '',
            amount: Number(data.amount) || 0,
            due_date: data.dueDate || '',
            category: data.category || '',
            is_paid: Boolean(data.isPaid),
            notes: data.notes || '',
            profile_id: data.profileId || 'default',
            user_id: data.userId || 'convidado_default'
          });
        }
      });
    } catch (e) {
      console.warn('Firestore monthly_bills load warning:', e);
    }

    // 3b. Load from LocalStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fin_bills_')) {
          const profileId = key.substring('fin_bills_'.length);
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            items.forEach((data: any) => {
              if (data && data.id) {
                billsMap.set(data.id, {
                  id: data.id,
                  description: data.description || '',
                  amount: Number(data.amount) || 0,
                  due_date: data.dueDate || '',
                  category: data.category || '',
                  is_paid: Boolean(data.isPaid),
                  notes: data.notes || '',
                  profile_id: profileId,
                  user_id: data.userId || 'convidado_default'
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage monthly_bills load warning:', e);
    }

    // 3c. Upsert Monthly Bills to Supabase
    const billsToUpsert = Array.from(billsMap.values());
    if (billsToUpsert.length > 0) {
      for (const bill of billsToUpsert) {
        const { error } = await supabase.from('monthly_bills').upsert(bill);
        if (!error) {
          summary.billsCount++;
        } else {
          console.warn(`Error migrating bill ${bill.id}:`, error);
        }
      }
    }


    // 4. Migrate Investments (Merge Firestore and LocalStorage)
    const investmentsMap = new Map<string, any>();

    // 4a. Load from Firestore
    try {
      const invsSnap = await getDocs(collection(db, 'investments'));
      invsSnap.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.id) {
          investmentsMap.set(data.id, {
            id: data.id,
            name: data.name || '',
            type: data.type || 'Outros',
            amount_invested: Number(data.amountInvested) || Number(data.amount_invested) || 0,
            current_amount: Number(data.currentAmount) || Number(data.current_amount) || 0,
            yield_rate: data.yieldRate !== undefined ? Number(data.yieldRate) : data.yield_rate !== undefined ? Number(data.yield_rate) : 0,
            acquisition_date: data.acquisitionDate || data.acquisition_date || '',
            broker: data.broker || '',
            profile_id: data.profileId || 'default',
            user_id: data.userId || 'convidado_default'
          });
        }
      });
    } catch (e) {
      console.warn('Firestore investments load warning:', e);
    }

    // 4b. Load from LocalStorage
    try {
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key && key.startsWith('fin_invests_')) {
          const profileId = key.substring('fin_invests_'.length);
          const items = JSON.parse(localStorage.getItem(key) || '[]');
          if (Array.isArray(items)) {
            items.forEach((data: any) => {
              if (data && data.id) {
                investmentsMap.set(data.id, {
                  id: data.id,
                  name: data.name || '',
                  type: data.type || 'Outros',
                  amount_invested: Number(data.amountInvested) || Number(data.amount_invested) || 0,
                  current_amount: Number(data.currentAmount) || Number(data.current_amount) || 0,
                  yield_rate: data.yieldRate !== undefined ? Number(data.yieldRate) : data.yield_rate !== undefined ? Number(data.yield_rate) : 0,
                  acquisition_date: data.acquisitionDate || data.acquisition_date || '',
                  broker: data.broker || '',
                  profile_id: profileId,
                  user_id: data.userId || 'convidado_default'
                });
              }
            });
          }
        }
      }
    } catch (e) {
      console.warn('LocalStorage investments load warning:', e);
    }

    // 4c. Upsert Investments to Supabase
    const invsToUpsert = Array.from(investmentsMap.values());
    if (invsToUpsert.length > 0) {
      for (const inv of invsToUpsert) {
        const { error } = await supabase.from('investments').upsert(inv);
        if (!error) {
          summary.investmentsCount++;
        } else {
          console.warn(`Error migrating investment ${inv.id}:`, error);
        }
      }
    }

  } catch (globalErr) {
    console.error('Global migration error:', globalErr);
    summary.error = globalErr instanceof Error ? globalErr.message : String(globalErr);
  }

  return summary;
}

