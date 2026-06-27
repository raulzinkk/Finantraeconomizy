/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AppProfile,
  Transaction,
  MonthlyBill,
  Investment,
  UserPreferences,
  SupabaseStatus,
  AppNotification,
  TrashItem
} from './types';
import {
  SEED_TRANSACTIONS,
  SEED_BILLS,
  SEED_INVESTMENTS,
  formatCurrency
} from './utils';
import {
  testFirebaseConnection as testConnection,
  fetchTransactions,
  upsertTransaction,
  deleteTransactionFromDb,
  fetchMonthlyBills,
  upsertMonthlyBill,
  deleteMonthlyBillFromDb,
  fetchInvestments,
  upsertInvestment,
  deleteInvestmentFromDb,
  fetchMaintenanceNotifications,
  auth,
  saveUserProfileAndPrefsToCloud,
  loadCloudUserProfileAndPrefs,
  fetchTrashItems,
  upsertTrashItem,
  deleteTrashItemFromDb
} from './firebaseService';

// Subcomponents
import DatabaseStatus from './components/DatabaseStatus';
import FinanceSummary from './components/FinanceSummary';
import TransactionsTab from './components/TransactionsTab';
import MonthlyBillsTab from './components/MonthlyBillsTab';
import InvestmentsTab from './components/InvestmentsTab';
import NotificationsTab from './components/NotificationsTab';
import ProfileSelector from './components/ProfileSelector';
import AuthTab from './components/AuthTab';
import PresentationLanding from './components/PresentationLanding';
import LanguageSelector from './components/LanguageSelector';
import EcoIaTab from './components/EcoIaTab';
import { useLanguage } from './translations';


// Icons
import {
  LayoutDashboard,
  ArrowRightLeft,
  CalendarCheck2,
  TrendingUp,
  Settings,
  ShieldCheck,
  CloudLightning,
  CloudCheck,
  HelpCircle,
  Lightbulb,
  X,
  RefreshCw,
  Wallet,
  LogIn,
  Sun,
  Moon,
  Smartphone,
  Globe,
  Download,
  Monitor,
  Bell,
  Hammer,
  Sparkles
} from 'lucide-react';

const TIPS = [
  "A regra dos 50/30/20 indica: 50% de ganhos para necessidades, 30% desejos pessoais e 20% guardados ou investidos.",
  "Tenha uma Reserva de Emergência equivalendo a pelo menos 6 meses das suas despesas básicas mensais estruturadas.",
  "Evite comprar parcelado itens de consumo imediato. Se não cabe no seu orçamento hoje, melhor adiar e pagar à vista.",
  "Revise as assinaturas ativas mensalmente. Serviços que você não utiliza drenam discretamente seu saldo poupador.",
  "A inflação corrói o poder de compra do dinheiro físico. Aplique suas reservas para obter rendimentos reais.",
  "Antes de fazer uma compra maior, aguarde 24 horas. Muitas vezes a necessidade passa e era apenas desejo momentâneo."
];

export default function App() {
  const { t, tText } = useLanguage();

  // Navigation
  const [activeTab, setActiveTab] = useState<'dashboard' | 'transactions' | 'bills' | 'investments' | 'config' | 'auth' | 'notifications' | 'eco_ia'>('dashboard');

  // Core States
  const [profiles, setProfiles] = useState<AppProfile[]>([]);
  const [currentProfileId, setCurrentProfileId] = useState<string>('');
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [landingMode, setLandingMode] = useState<'presentation' | 'auth_login' | 'auth_register'>('presentation');
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [monthlyBills, setMonthlyBills] = useState<MonthlyBill[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

  const [preferences, setPreferences] = useState<UserPreferences>({
    currency: 'BRL',
    monthlyIncomeGoal: 6500,
    monthlyExpenseLimit: 3500,
    savingsGoal: 1500
  });

  // DB Sync Status
  const [dbStatus, setDbStatus] = useState<SupabaseStatus>({
    isConnected: true,
    isSynced: true
  });

  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [showTip, setShowTip] = useState<boolean>(true);
  const [tipIndex, setTipIndex] = useState<number>(0);

  const [showAppChoiceModal, setShowAppChoiceModal] = useState<boolean>(() => {
    return localStorage.getItem('fin_app_choice_dismissed') !== 'true';
  });

  // Force light mode theme
  const theme = 'light';

  useEffect(() => {
    document.body.classList.remove('dark');
    document.documentElement.classList.remove('dark');
    localStorage.setItem('finantra_theme', 'light');
  }, []);

  // Computed Current Profile
  const currentProfile = useMemo(() => {
    const found = profiles.find(p => p.id === currentProfileId);
    if (found) {
      return { ...found, isCloudSync: true };
    }
    return {
      id: 'p-default',
      name: 'Minha Carteira',
      isCloudSync: true
    };
  }, [profiles, currentProfileId]);

  // Counts for bills with upcoming due date (<= 3 days) or overdue
  const billsProximityCounts = useMemo(() => {
    const today = new Date();
    today.setHours(0,0,0,0);
    let near = 0;
    let overdue = 0;

    monthlyBills.forEach(b => {
      if (b.isPaid) return;
      const dueDate = new Date(b.dueDate + 'T00:00:00');
      dueDate.setHours(0,0,0,0);
      const diffTime = dueDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) {
        overdue++;
      } else if (diffDays <= 3) {
        near++;
      }
    });

    return { near, overdue, total: near + overdue };
  }, [monthlyBills]);

  // Load Tip on first run
  useEffect(() => {
    setTipIndex(Math.floor(Math.random() * TIPS.length));
  }, []);

  // 1. Initial Session Restoration & Firebase Auth Watcher
  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (user && user.email) {
        setLoggedInUser(user.email.toLowerCase());
      } else {
        const keepLogged = localStorage.getItem('finantra_keep_logged_in') === 'true';
        const savedEmail = localStorage.getItem('finantra_saved_user_email');
        if (keepLogged && savedEmail) {
          setLoggedInUser(savedEmail.toLowerCase());
        } else {
          // Load public / guest profile configurations
          const storedActiveId = localStorage.getItem('fin_active_id') || 'p-default';
          setCurrentProfileId(storedActiveId);

          const storedProfilesStr = localStorage.getItem('fin_profiles');
          let loadedProfiles: AppProfile[] = [];
          if (storedProfilesStr) {
            try { loadedProfiles = JSON.parse(storedProfilesStr); } catch { loadedProfiles = []; }
          }
          if (loadedProfiles.length === 0) {
            loadedProfiles = [
              { id: 'p-default', name: 'Minha Carteira', isCloudSync: true }
            ];
            localStorage.setItem('fin_profiles', JSON.stringify(loadedProfiles));
          }
          setProfiles(loadedProfiles);

          const storedPrefs = localStorage.getItem('fin_preferences');
          if (storedPrefs) {
            try { setPreferences(JSON.parse(storedPrefs)); } catch {}
          }
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync active user to LocalStorage for Firestore retrieval
  useEffect(() => {
    if (loggedInUser) {
      localStorage.setItem('finantra_current_user_email', loggedInUser.toLowerCase());
    } else {
      localStorage.removeItem('finantra_current_user_email');
    }
  }, [loggedInUser]);

  // 1.5. Dynamic User Data Isolation Switcher
  useEffect(() => {
    if (loggedInUser) {
      const safeKey = loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      
      const storedProfilesStr = localStorage.getItem(`fin_profiles_${safeKey}`);
      let loadedProfiles: AppProfile[] = [];
      if (storedProfilesStr) {
        try { loadedProfiles = JSON.parse(storedProfilesStr); } catch { loadedProfiles = []; }
      }

      if (loadedProfiles.length === 0) {
        loadedProfiles = [
          { id: `p-${safeKey}`, name: `Minha Carteira • ${loggedInUser.split('@')[0]}`, isCloudSync: true }
        ];
        localStorage.setItem(`fin_profiles_${safeKey}`, JSON.stringify(loadedProfiles));
      }
      setProfiles(loadedProfiles);

      const storedActiveId = localStorage.getItem(`fin_active_id_${safeKey}`) || `p-${safeKey}`;
      setCurrentProfileId(storedActiveId);

      const storedPrefs = localStorage.getItem(`fin_preferences_${safeKey}`);
      if (storedPrefs) {
        try { setPreferences(JSON.parse(storedPrefs)); } catch {}
      } else {
        setPreferences({
          currency: 'BRL',
          monthlyIncomeGoal: 5000,
          monthlyExpenseLimit: 3000,
          savingsGoal: 1000,
          categoryLimits: {}
        });
      }
    }
  }, [loggedInUser]);

  // Sync / Load data when current profile OR sync state changes
  const loadProfileData = useCallback(async (profId: string, isCloud: boolean) => {
    if (!profId) return;
    setIsSyncing(true);

    // A. Always load from LocalStorage first to guarantee visual speed and offline survival
    const localT = localStorage.getItem(`fin_trans_${profId}`);
    const localB = localStorage.getItem(`fin_bills_${profId}`);
    const localI = localStorage.getItem(`fin_invests_${profId}`);

    let transList: Transaction[] = localT ? JSON.parse(localT) : [];
    let billsList: MonthlyBill[] = localB ? JSON.parse(localB) : [];
    let investsList: Investment[] = localI ? JSON.parse(localI) : [];

    // Filter out previous seed/mock data elements containing hyphens in ID (e.g. t-1, b-1, i-1)
    transList = transList.filter(t => t && t.id && !t.id.includes('-'));
    billsList = billsList.filter(b => b && b.id && !b.id.includes('-'));
    investsList = investsList.filter(i => i && i.id && !i.id.includes('-'));

    // If completely new local profile with no data, seed with realistic mock values
    const freshProfileVisit = !localT && !localB && !localI;
    if (freshProfileVisit) {
      // If we have a loggedInUser, start completely empty! Mostre apenas o que o usuário colocou
      if (loggedInUser && loggedInUser !== 'convidado@finantra.com') {
        transList = [];
        billsList = [];
        investsList = [];
      } else {
        transList = SEED_TRANSACTIONS(profId);
        billsList = SEED_BILLS(profId);
        investsList = SEED_INVESTMENTS(profId);
      }
      
      // Save newly seeded values locally
      localStorage.setItem(`fin_trans_${profId}`, JSON.stringify(transList));
      localStorage.setItem(`fin_bills_${profId}`, JSON.stringify(billsList));
      localStorage.setItem(`fin_invests_${profId}`, JSON.stringify(investsList));
    }

    setTransactions(transList);
    setMonthlyBills(billsList);
    setInvestments(investsList);

    // Load local trash items
    const localTrash = localStorage.getItem(`fin_trash_${profId}`);
    let trashList: TrashItem[] = localTrash ? JSON.parse(localTrash) : [];

    // Filter out expired trash (> 5 days)
    const fiveDaysAgo = Date.now() - 5 * 24 * 60 * 60 * 1000;
    const expiredTrash = trashList.filter(item => {
      const delTime = new Date(item.deletedAt).getTime();
      return delTime < fiveDaysAgo;
    });

    trashList = trashList.filter(item => {
      const delTime = new Date(item.deletedAt).getTime();
      return delTime >= fiveDaysAgo;
    });

    setTrashItems(trashList);
    localStorage.setItem(`fin_trash_${profId}`, JSON.stringify(trashList));

    // Async prune expired local trash items from cloud
    if (expiredTrash.length > 0 && isCloud) {
      expiredTrash.forEach(item => {
        deleteTrashItemFromDb(item.id).catch(err => console.warn('Failed to prune expired cloud trash item:', err));
      });
    }

    // Load and clean up expired maintenance alerts (older than 2 hours)
    const localN = localStorage.getItem(`fin_notifications_${profId}`);
    let notifList: AppNotification[] = localN ? JSON.parse(localN) : [];
    notifList = notifList.filter(n => !n.isMaintenance || !n.expiryTime || Date.now() < n.expiryTime);

    // Seed default welcome notification if completely empty
    if (notifList.length === 0) {
      notifList = [
        {
          id: `n_welcome_${Date.now()}`,
          type: 'earning_added',
          title: 'Bem-vindo ao Finantra!',
          description: 'Sua carteira autônoma e segura está ativa. Seus dados estão completamente protegidos e são mantidos sob seu controle exclusivo.',
          timestamp: new Date().toISOString(),
          isRead: false,
          isMaintenance: false
        }
      ];
      localStorage.setItem(`fin_notifications_${profId}`, JSON.stringify(notifList));
    }
    setNotifications(notifList);

    // B. If Cloud Sync enabled, try to fetch from Supabase
    if (isCloud) {
      const isConnected = await testConnection();
      if (isConnected) {
        // Fetch tables
        const remoteT = await fetchTransactions(profId);
        const remoteB = await fetchMonthlyBills(profId);
        const remoteI = await fetchInvestments(profId);

        if (remoteT !== null && remoteB !== null && remoteI !== null) {
          // Success! Sync our state
          setTransactions(remoteT);
          setMonthlyBills(remoteB);
          setInvestments(remoteI);

          // Overwrite local copy with up-to-date cloud copy
          localStorage.setItem(`fin_trans_${profId}`, JSON.stringify(remoteT));
          localStorage.setItem(`fin_bills_${profId}`, JSON.stringify(remoteB));
          localStorage.setItem(`fin_invests_${profId}`, JSON.stringify(remoteI));

          // Fetch and sync trash items
          const remoteTrash = await fetchTrashItems(profId);
          if (remoteTrash !== null) {
            const mergedTrashMap = new Map<string, TrashItem>();
            
            // Add local non-expired trash
            trashList.forEach(item => mergedTrashMap.set(item.id, item));
            
            // Add remote trash if non-expired, otherwise prune
            remoteTrash.forEach(item => {
              const delTime = new Date(item.deletedAt).getTime();
              if (delTime >= fiveDaysAgo) {
                mergedTrashMap.set(item.id, item);
              } else {
                deleteTrashItemFromDb(item.id).catch(err => console.warn('Pruned expired cloud trash:', err));
              }
            });

            const updatedTrashList = Array.from(mergedTrashMap.values());
            setTrashItems(updatedTrashList);
            localStorage.setItem(`fin_trash_${profId}`, JSON.stringify(updatedTrashList));
          }

          // Also fetch maintenance notifications from Supabase if available
          const remoteMaint = await fetchMaintenanceNotifications();
          if (remoteMaint !== null) {
            let updatedNotifs = [...notifList];
            // Remove previous maintenance alerts
            updatedNotifs = updatedNotifs.filter(n => !n.isMaintenance);
            // Filter out expired ones
            const activeMaint = remoteMaint.filter(n => !n.expiryTime || Date.now() < n.expiryTime);
            updatedNotifs = [...activeMaint, ...updatedNotifs];
            
            setNotifications(updatedNotifs);
            localStorage.setItem(`fin_notifications_${profId}`, JSON.stringify(updatedNotifs));
          }

          setDbStatus({ isConnected: true, isSynced: true });
        } else {
          // Failure fetching tables, supabase exists but schema is probably missing
          setDbStatus({ isConnected: false, isSynced: false, errorMsg: 'Tabelas do banco não encontradas ou desconfiguradas.' });
        }
      } else {
        // Connection offline or backend unprovisioned 
        setDbStatus({ isConnected: false, isSynced: false, errorMsg: 'Falha ao conectar na API da Nuvem Online Finantra.' });
      }
    } else {
      setDbStatus({ isConnected: false, isSynced: false });
    }

    setIsSyncing(false);
  }, []);

  // Monitor Profile activation switches
  useEffect(() => {
    if (currentProfileId) {
      loadProfileData(currentProfileId, true);
    }
  }, [currentProfileId, loadProfileData]);

  // Synchronize maintenance notifications from Supabase when entering notifications tab
  useEffect(() => {
    if (activeTab === 'notifications' && currentProfileId) {
      const activeProf = profiles.find(p => p.id === currentProfileId);
      if (activeProf?.isCloudSync) {
        fetchMaintenanceNotifications().then(remoteMaint => {
          if (remoteMaint !== null) {
            setNotifications(prev => {
              let updatedNotifs = [...prev];
              // Remove previous maintenance alerts
              updatedNotifs = updatedNotifs.filter(n => !n.isMaintenance);
              const activeMaint = remoteMaint.filter(n => !n.expiryTime || Date.now() < n.expiryTime);
              updatedNotifs = [...activeMaint, ...updatedNotifs];
              
              localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updatedNotifs));
              return updatedNotifs;
            });
          }
        }).catch(err => {
          console.warn('Failed to fetch maintenance notifications on tab enter:', err);
        });
      }
    }
  }, [activeTab, currentProfileId, profiles]);



  // Handle successful login or registration with guest data migration & cloud sync
  const handleLoginSuccess = async (email: string) => {
    setIsSyncing(true);
    const userEmail = email.toLowerCase();
    const safeKey = userEmail.replace(/[^a-zA-Z0-9]/g, '_');
    const userProfileId = `p-${safeKey}`;

    // 1. Check and Migrate Guest data (gains, expenses, bills, investments) to the newly authenticated account
    const guestProfileId = localStorage.getItem('fin_active_id') || 'p-default';
    const guestTransStr = localStorage.getItem(`fin_trans_${guestProfileId}`);
    const guestBillsStr = localStorage.getItem(`fin_bills_${guestProfileId}`);
    const guestInvestsStr = localStorage.getItem(`fin_invests_${guestProfileId}`);

    let migratedTransactions: Transaction[] = [];
    if (guestTransStr) {
      try {
        const guestTrans = JSON.parse(guestTransStr) as Transaction[];
        const guestFiltered = guestTrans.filter(t => t && t.id && !t.id.includes('-'));
        migratedTransactions = guestFiltered.map(t => ({
          ...t,
          profileId: userProfileId
        }));
      } catch (e) {
        console.warn('Error parsing guest transactions:', e);
      }
    }

    let migratedBills: MonthlyBill[] = [];
    if (guestBillsStr) {
      try {
        const guestBills = JSON.parse(guestBillsStr) as MonthlyBill[];
        const guestFiltered = guestBills.filter(b => b && b.id && !b.id.includes('-'));
        migratedBills = guestFiltered.map(b => ({
          ...b,
          profileId: userProfileId
        }));
      } catch (e) {
        console.warn('Error parsing guest bills:', e);
      }
    }

    let migratedInvestments: Investment[] = [];
    if (guestInvestsStr) {
      try {
        const guestInvests = JSON.parse(guestInvestsStr) as Investment[];
        const guestFiltered = guestInvests.filter(i => i && i.id && !i.id.includes('-'));
        migratedInvestments = guestFiltered.map(i => ({
          ...i,
          profileId: userProfileId
        }));
      } catch (e) {
        console.warn('Error parsing guest investments:', e);
      }
    }

    // Merge guest records into user's local arrays to prevent overwriting cloud records or local records
    const existingUserTransStr = localStorage.getItem(`fin_trans_${userProfileId}`);
    let userTransactions: Transaction[] = existingUserTransStr ? JSON.parse(existingUserTransStr) : [];
    const existingUserBillsStr = localStorage.getItem(`fin_bills_${userProfileId}`);
    let userBills: MonthlyBill[] = existingUserBillsStr ? JSON.parse(existingUserBillsStr) : [];
    const existingUserInvestsStr = localStorage.getItem(`fin_invests_${userProfileId}`);
    let userInvestments: Investment[] = existingUserInvestsStr ? JSON.parse(existingUserInvestsStr) : [];

    const transMap = new Map<string, Transaction>();
    userTransactions.forEach(t => transMap.set(t.id, t));
    migratedTransactions.forEach(t => transMap.set(t.id, t));
    userTransactions = Array.from(transMap.values());

    const billsMap = new Map<string, MonthlyBill>();
    userBills.forEach(b => billsMap.set(b.id, b));
    migratedBills.forEach(b => billsMap.set(b.id, b));
    userBills = Array.from(billsMap.values());

    const investsMap = new Map<string, Investment>();
    userInvestments.forEach(i => investsMap.set(i.id, i));
    migratedInvestments.forEach(i => investsMap.set(i.id, i));
    userInvestments = Array.from(investsMap.values());

    localStorage.setItem(`fin_trans_${userProfileId}`, JSON.stringify(userTransactions));
    localStorage.setItem(`fin_bills_${userProfileId}`, JSON.stringify(userBills));
    localStorage.setItem(`fin_invests_${userProfileId}`, JSON.stringify(userInvestments));

    // Async upload of migrated items to cloud
    migratedTransactions.forEach(async (t) => {
      try { await upsertTransaction(t, safeKey); } catch (e) { console.warn('Error uploading migrated transaction:', e); }
    });
    migratedBills.forEach(async (b) => {
      try { await upsertMonthlyBill(b, safeKey); } catch (e) { console.warn('Error uploading migrated bill:', e); }
    });
    migratedInvestments.forEach(async (i) => {
      try { await upsertInvestment(i, safeKey); } catch (e) { console.warn('Error uploading migrated investment:', e); }
    });

    // Clear guest local storage to prevent duplicate migrations
    if (migratedTransactions.length > 0 || migratedBills.length > 0 || migratedInvestments.length > 0) {
      localStorage.setItem(`fin_trans_${guestProfileId}`, '[]');
      localStorage.setItem(`fin_bills_${guestProfileId}`, '[]');
      localStorage.setItem(`fin_invests_${guestProfileId}`, '[]');
    }

    // 2. Fetch or Save user profiles list and preferences to the cloud
    const cloudConfig = await loadCloudUserProfileAndPrefs(userEmail);
    let finalProfiles: AppProfile[] = [];
    let finalPrefs: UserPreferences | null = null;

    if (cloudConfig) {
      if (cloudConfig.cloudProfiles && cloudConfig.cloudProfiles.length > 0) {
        finalProfiles = cloudConfig.cloudProfiles;
      }
      if (cloudConfig.cloudPrefs) {
        finalPrefs = cloudConfig.cloudPrefs;
      }
    }

    if (finalProfiles.length === 0) {
      // Cloud was empty, prepare from local profiles or create default
      const storedProfilesStr = localStorage.getItem(`fin_profiles_${safeKey}`);
      if (storedProfilesStr) {
        try { finalProfiles = JSON.parse(storedProfilesStr); } catch {}
      }
      if (finalProfiles.length === 0) {
        finalProfiles = [
          { id: userProfileId, name: `Minha Carteira • ${userEmail.split('@')[0]}`, isCloudSync: true }
        ];
      }
      // Save newly created profile config to cloud
      await saveUserProfileAndPrefsToCloud(userEmail, finalProfiles, finalPrefs || preferences);
    } else {
      // Cloud had profiles, save them locally
      localStorage.setItem(`fin_profiles_${safeKey}`, JSON.stringify(finalProfiles));
    }

    if (finalPrefs) {
      localStorage.setItem(`fin_preferences_${safeKey}`, JSON.stringify(finalPrefs));
      setPreferences(finalPrefs);
    } else {
      // Save current local preferences to cloud since none exist in cloud
      await saveUserProfileAndPrefsToCloud(userEmail, finalProfiles, preferences);
    }

    // Update active profiles list and profile ID
    setProfiles(finalProfiles);
    const storedActiveId = localStorage.getItem(`fin_active_id_${safeKey}`) || finalProfiles[0]?.id || userProfileId;
    setCurrentProfileId(storedActiveId);
    localStorage.setItem(`fin_active_id_${safeKey}`, storedActiveId);

    // Finally set user logged in, which completes the state update flow
    setLoggedInUser(userEmail);
    setActiveTab('dashboard');
    setIsSyncing(false);
  };

  // Toggle cloud sync parameter on the active profile
  const handleToggleSync = (isSyncEnabled: boolean) => {
    const updated = profiles.map(p => {
      if (p.id === currentProfileId) {
        return { ...p, isCloudSync: isSyncEnabled };
      }
      return p;
    });
    setProfiles(updated);
    localStorage.setItem('fin_profiles', JSON.stringify(updated));

    if (loggedInUser) {
      const safeKey = loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_');
      localStorage.setItem(`fin_profiles_${safeKey}`, JSON.stringify(updated));
      saveUserProfileAndPrefsToCloud(loggedInUser, updated, preferences);
    }
    
    if (isSyncEnabled) {
      loadProfileData(currentProfileId, true);
    } else {
      setDbStatus({ isConnected: false, isSynced: false });
    }
  };

  // WRITE OPERATIONS
  
  // Helper to add system notifications
  const addSystemNotification = useCallback((
    type: 'bill_added' | 'earning_added' | 'expense_added' | 'investment_added' | 'maintenance',
    title: string,
    description: string,
    isMaintenance = false,
    expiryTime?: number
  ) => {
    const newNotif: AppNotification = {
      id: `n_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      type,
      title,
      description,
      timestamp: new Date().toISOString(),
      isRead: false,
      isMaintenance,
      expiryTime
    };
    setNotifications(prev => {
      const filtered = prev.filter(n => !n.isMaintenance || !n.expiryTime || Date.now() < n.expiryTime);
      const updated = [newNotif, ...filtered];
      localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  }, [currentProfileId]);

  const handleMarkNotificationAsRead = (id: string) => {
    setNotifications(prev => {
      const updated = prev.map(n => n.id === id ? { ...n, isRead: true } : n);
      localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleMarkAllNotificationsAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(n => ({ ...n, isRead: true }));
      localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleDeleteNotification = (id: string) => {
    setNotifications(prev => {
      const updated = prev.filter(n => n.id !== id);
      localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleClearAllReadNotifications = () => {
    setNotifications(prev => {
      const updated = prev.filter(n => !n.isRead || n.isMaintenance);
      localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updated));
      return updated;
    });
  };

  const handleRefreshNotifications = async (): Promise<{ success: boolean; count: number; error?: string }> => {
    if (!currentProfileId) return { success: false, count: 0, error: 'Perfil não selecionado.' };
    try {
      const remoteMaint = await fetchMaintenanceNotifications();
      if (remoteMaint !== null) {
        let count = 0;
        setNotifications(prev => {
          let updatedNotifs = [...prev];
          // Remove previous maintenance alerts
          updatedNotifs = updatedNotifs.filter(n => !n.isMaintenance);
          const activeMaint = remoteMaint.filter(n => !n.expiryTime || Date.now() < n.expiryTime);
          updatedNotifs = [...activeMaint, ...updatedNotifs];
          count = activeMaint.length;
          localStorage.setItem(`fin_notifications_${currentProfileId}`, JSON.stringify(updatedNotifs));
          return updatedNotifs;
        });
        return { success: true, count };
      } else {
        return { success: false, count: 0, error: 'Não foi possível conectar ao banco de dados Supabase.' };
      }
    } catch (err: any) {
      console.warn('Failed to refresh maintenance notifications:', err);
      return { success: false, count: 0, error: err?.message || 'Erro inesperado.' };
    }
  };

  // A. Transactions
  const handleAddTransaction = async (newT: Omit<Transaction, 'id' | 'profileId'>) => {
    const transObj: Transaction = {
      ...newT,
      id: `t_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [transObj, ...transactions];
    setTransactions(updated);
    localStorage.setItem(`fin_trans_${currentProfileId}`, JSON.stringify(updated));

    // Trigger Notification
    if (transObj.type === 'earnings') {
      addSystemNotification(
        'earning_added',
        'Ganho Adicionado',
        `O ganho "${transObj.description}" no valor de ${formatCurrency(transObj.amount, preferences.currency)} foi registrado com sucesso.`
      );
    } else {
      addSystemNotification(
        'expense_added',
        'Gasto Adicionado',
        `O gasto "${transObj.description}" no valor de ${formatCurrency(transObj.amount, preferences.currency)} foi registrado com sucesso.`
      );
    }

    if (currentProfile.isCloudSync) {
      await upsertTransaction(transObj);
    }
  };

  const handleDeleteTransaction = async (id: string) => {
    const targetTrans = transactions.find(t => t.id === id);
    if (targetTrans) {
      // Create trash item
      const trashObj: TrashItem = {
        id: `trash_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
        transaction: targetTrans,
        deletedAt: new Date().toISOString()
      };

      // Update local trash state & cache
      const newTrash = [trashObj, ...trashItems];
      setTrashItems(newTrash);
      localStorage.setItem(`fin_trash_${currentProfileId}`, JSON.stringify(newTrash));

      // Sync trash item to cloud if sync enabled
      if (currentProfile.isCloudSync) {
        await upsertTrashItem(trashObj).catch(e => console.warn('Failed to sync deleted transaction to cloud trash:', e));
      }
    }

    const updated = transactions.filter(t => t.id !== id);
    setTransactions(updated);
    localStorage.setItem(`fin_trans_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteTransactionFromDb(id);
    }
  };

  const handleRestoreTransaction = async (item: TrashItem) => {
    // 1. Add back to active transactions
    const restoredTrans = item.transaction;
    const updatedTrans = [...transactions, restoredTrans];
    setTransactions(updatedTrans);
    localStorage.setItem(`fin_trans_${currentProfileId}`, JSON.stringify(updatedTrans));

    if (currentProfile.isCloudSync) {
      await upsertTransaction(restoredTrans);
    }

    // 2. Remove from trash
    const updatedTrash = trashItems.filter(t => t.id !== item.id);
    setTrashItems(updatedTrash);
    localStorage.setItem(`fin_trash_${currentProfileId}`, JSON.stringify(updatedTrash));

    if (currentProfile.isCloudSync) {
      await deleteTrashItemFromDb(item.id);
    }
  };

  const handleDeletePermanently = async (trashId: string) => {
    // Remove from trash
    const updatedTrash = trashItems.filter(t => t.id !== trashId);
    setTrashItems(updatedTrash);
    localStorage.setItem(`fin_trash_${currentProfileId}`, JSON.stringify(updatedTrash));

    if (currentProfile.isCloudSync) {
      await deleteTrashItemFromDb(trashId);
    }
  };

  // B. Monthly Bills
  const handleAddBill = async (newB: Omit<MonthlyBill, 'id' | 'profileId'>) => {
    const billObj: MonthlyBill = {
      ...newB,
      id: `b_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [...monthlyBills, billObj];
    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));

    // Trigger Notification
    addSystemNotification(
      'bill_added',
      'Conta Adicionada',
      `A conta "${billObj.description}" com vencimento em ${billObj.dueDate.split('-').reverse().join('/')} no valor de ${formatCurrency(billObj.amount, preferences.currency)} foi registrada.`
    );

    if (currentProfile.isCloudSync) {
      await upsertMonthlyBill(billObj);
    }
  };

  const handleToggleBillStatus = async (id: string, isPaid: boolean) => {
    const updated = monthlyBills.map(b => {
      if (b.id === id) {
        const mod = { ...b, isPaid };
        // Sync modified bill to Cloud
        if (currentProfile.isCloudSync) {
          upsertMonthlyBill(mod);
        }
        return mod;
      }
      return b;
    });

    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));
  };

  const handleDeleteBill = async (id: string) => {
    const updated = monthlyBills.filter(b => b.id !== id);
    setMonthlyBills(updated);
    localStorage.setItem(`fin_bills_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteMonthlyBillFromDb(id);
    }
  };

  // C. Investments
  const handleAddInvestment = async (newI: Omit<Investment, 'id' | 'profileId'>) => {
    const investObj: Investment = {
      ...newI,
      id: `i_${Date.now()}_${Math.random().toString(36).substr(2, 5)}`,
      profileId: currentProfileId
    };

    const updated = [...investments, investObj];
    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));

    // Trigger Notification
    addSystemNotification(
      'investment_added',
      'Investimento Adicionado',
      `O investimento em "${investObj.name}" no valor de ${formatCurrency(investObj.amountInvested, preferences.currency)} foi alocado via corretora ${investObj.broker}.`
    );

    if (currentProfile.isCloudSync) {
      await upsertInvestment(investObj);
    }
  };

  const handleUpdateInvestmentValue = async (id: string, newAmount: number) => {
    const updated = investments.map(i => {
      if (i.id === id) {
        const mod = { ...i, currentAmount: newAmount };
        if (currentProfile.isCloudSync) {
          upsertInvestment(mod);
        }
        return mod;
      }
      return i;
    });

    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));
  };

  const handleDeleteInvestment = async (id: string) => {
    const updated = investments.filter(i => i.id !== id);
    setInvestments(updated);
    localStorage.setItem(`fin_invests_${currentProfileId}`, JSON.stringify(updated));

    if (currentProfile.isCloudSync) {
      await deleteInvestmentFromDb(id);
    }
  };

  // D. Profile Setup
  const handleCreateProfile = (name: string, isCloudSync: boolean) => {
    const newId = `p_${Date.now()}`;
    const newProf: AppProfile = { id: newId, name, isCloudSync };
    const updatedProfiles = [...profiles, newProf];
    
    setProfiles(updatedProfiles);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_profiles_${safeKey}` : 'fin_profiles', JSON.stringify(updatedProfiles));
    
    if (loggedInUser) {
      saveUserProfileAndPrefsToCloud(loggedInUser, updatedProfiles, preferences);
    }

    setCurrentProfileId(newId);
    localStorage.setItem(loggedInUser ? `fin_active_id_${safeKey}` : 'fin_active_id', newId);
    
    setActiveTab('config');
  };

  const handleClearProfileData = useCallback(async () => {
    // Zero native confirms needed here because ProfileSelector bereits has a perfect, non-blocking 2-stage visual confirm flow!
    setTransactions([]);
    setMonthlyBills([]);
    setInvestments([]);

    // To prevent re-seeding mockup data, write empty array strings instead of deleting keys!
    localStorage.setItem(`fin_trans_${currentProfileId}`, '[]');
    localStorage.setItem(`fin_bills_${currentProfileId}`, '[]');
    localStorage.setItem(`fin_invests_${currentProfileId}`, '[]');

    try {
      // Delete old records sequentially in case cloud is active
      for (const t of transactions) {
        await deleteTransactionFromDb(t.id);
      }
      for (const b of monthlyBills) {
        await deleteMonthlyBillFromDb(b.id);
      }
      for (const i of investments) {
        await deleteInvestmentFromDb(i.id);
      }
    } catch (e) {
      console.warn("Could not delete from DB:", e);
    }
  }, [currentProfileId, transactions, monthlyBills, investments]);

  const handleSwitchProfile = (id: string) => {
    setCurrentProfileId(id);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_active_id_${safeKey}` : 'fin_active_id', id);
  };

  const handleUpdatePreferences = (updatedPref: Partial<UserPreferences>) => {
    const newPref = { ...preferences, ...updatedPref };
    setPreferences(newPref);
    const safeKey = loggedInUser ? loggedInUser.toLowerCase().replace(/[^a-zA-Z0-9]/g, '_') : 'default';
    localStorage.setItem(loggedInUser ? `fin_preferences_${safeKey}` : 'fin_preferences', JSON.stringify(newPref));
    
    if (loggedInUser) {
      saveUserProfileAndPrefsToCloud(loggedInUser, profiles, newPref);
    }
  };

  return (
    <>
      {/* Onboarding Mode & APK Selector Modal */}
      {showAppChoiceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
          <div className="bg-white max-w-xl w-full rounded-2xl shadow-2xl border border-slate-100 overflow-hidden transform scale-100 transition-all duration-300">
            {/* Header Banner */}
            <div className="bg-[#0F172A] p-6 text-white text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/40 to-emerald-950/40 opacity-50"></div>
              <div className="relative z-10 space-y-2">
                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-2 border border-white/20">
                  <Wallet className="w-6 h-6 text-indigo-300" />
                </div>
                <h2 className="text-xl font-extrabold tracking-tight">{tText("Escolha sua Experiência Finantra")}</h2>
                <p className="text-xs text-slate-300 max-w-sm mx-auto leading-relaxed">
                  {tText("Para sua conveniência, o Finantra 6.0 está disponível como aplicativo nativo para Android ou diretamente pelo navegador web.")}
                </p>
              </div>
            </div>

            {/* Selection Grid */}
            <div className="p-5 md:p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Option A: Android APK */}
              <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all group hover:border-indigo-200">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 font-bold">
                    <Smartphone className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs">{tText("Aplicativo Android")}</h3>
                    <p className="text-[10px] text-indigo-750 font-semibold mt-0.5">{tText("Celular & Tablet 📱")}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {tText("Baixe o APK para ter o aplicativo nativo em seu dispositivo. Controle manual rápido e seguro direto no bolso.")}
                  </p>
                </div>
                <div className="pt-4">
                  <a
                    href="https://www.mediafire.com/file/09es0r3otu0prlq/Finantra_2.1.apk/file"
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={() => {
                      localStorage.setItem('fin_app_choice_dismissed', 'true');
                      setShowAppChoiceModal(false);
                    }}
                    className="w-full py-2 px-3 bg-indigo-650 hover:bg-indigo-700 text-white text-center font-bold rounded-lg text-[11px] flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs"
                  >
                    <Download className="w-3.5 h-3.5" />
                    {tText("Baixar APK")}
                  </a>
                </div>
              </div>

              {/* Option B: Web Mode */}
              <div className="bg-slate-50 hover:bg-slate-100/70 border border-slate-200 rounded-xl p-4 flex flex-col justify-between transition-all group hover:border-slate-300">
                <div className="space-y-2">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-600 font-bold">
                    <Globe className="w-4 h-4" />
                  </div>
                  <div>
                    <h3 className="font-extrabold text-slate-900 text-xs">{tText("Versão Web")}</h3>
                    <p className="text-[10px] text-emerald-750 font-semibold mt-0.5">{tText("Navegador Atual 💻")}</p>
                  </div>
                  <p className="text-[10px] text-slate-500 leading-relaxed">
                    {tText("Acesse de forma instantânea sem precisar baixar ou instalar nada. Ideal para computador ou acesso rápido.")}
                  </p>
                </div>
                <div className="pt-4">
                  <button
                    onClick={() => {
                      localStorage.setItem('fin_app_choice_dismissed', 'true');
                      setShowAppChoiceModal(false);
                    }}
                    className="w-full py-2 px-3 bg-white hover:bg-slate-50 text-slate-800 text-center font-bold rounded-lg text-[11px] border border-slate-300 flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-2xs"
                  >
                    <Monitor className="w-3.5 h-3.5 text-slate-500" />
                    {tText("Continuar na Web")}
                  </button>
                </div>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="bg-slate-50 px-5 py-3 border-t border-slate-150 flex justify-between items-center text-[10px] text-slate-450 font-sans">
              <span>{tText("🔒 Controle 100% autônomo.")}</span>
              <button
                onClick={() => {
                  localStorage.setItem('fin_app_choice_dismissed', 'true');
                  setShowAppChoiceModal(false);
                }}
                className="text-indigo-600 hover:text-indigo-850 font-bold transition-colors cursor-pointer"
              >
                {tText("Pular e entrar na Web")}
              </button>
            </div>
          </div>
        </div>
      )}
      {!loggedInUser ? (
        <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] flex flex-col font-sans transition-colors antialiased selection:bg-indigo-100 animate-scaleUp">
          {/* Landing Top Header */}
          <header className="bg-white border-b border-slate-200/80 px-6 py-4 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <div className="bg-[#0F172A] p-2 rounded-xl text-white">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <h1 className="font-extrabold text-[#0F172A] tracking-tighter text-lg leading-tight">FINANTRA</h1>
                <p className="text-[10px] text-slate-450 font-medium">{tText("Controle Financeiro Autônomo")}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <LanguageSelector />
              {landingMode === 'presentation' && (
                <a
                  href="https://www.mediafire.com/file/09es0r3otu0prlq/Finantra_2.1.apk/file"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hidden sm:flex items-center gap-1.5 px-3.5 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-extrabold rounded-xl border border-emerald-200/50 transition-all cursor-pointer mr-1 shadow-2xs"
                  title={tText("Baixar Aplicativo Android (APK)")}
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{tText("Baixar APK Android")}</span>
                </a>
              )}

              {landingMode !== 'presentation' ? (
                <button
                  onClick={() => setLandingMode('presentation')}
                  className="px-4 py-2 text-xs font-bold text-indigo-600 hover:text-indigo-850 transition-colors uppercase tracking-wider cursor-pointer"
                >
                  {tText("← Apresentação")}
                </button>
              ) : (
                <button
                  onClick={() => setLandingMode('auth_login')}
                  className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all cursor-pointer"
                >
                  {tText("Entrar")}
                </button>
              )}
            </div>
          </header>

          {/* Content Body */}
          <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col justify-center">
            {landingMode === 'presentation' ? (
              <PresentationLanding
                onProceedToAuth={(mode) => {
                  setLandingMode(mode === 'register' ? 'auth_register' : 'auth_login');
                }}
              />
            ) : (
              <div className="space-y-6 max-w-lg mx-auto w-full py-6 animate-fadeIn">
                <div className="text-center space-y-2">
                  <h2 className="text-2xl font-extrabold text-slate-950 tracking-tight">
                    {landingMode === 'auth_register' ? tText('Abra sua Conta Segura') : tText('Faça Logon Seguramente')}
                  </h2>
                  <p className="text-xs text-slate-550 max-w-xs mx-auto leading-relaxed">
                    {tText("Sem taxas temporárias, cadastros complexos ou perda de privacidade. Sua soberania financeira.")}
                  </p>
                </div>

                <AuthTab
                  loggedInUser={loggedInUser}
                  initialMode={landingMode === 'auth_register' ? 'register' : 'login'}
                  onLogin={(email) => {
                    handleLoginSuccess(email);
                  }}
                  onLogout={() => {
                    setLoggedInUser(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Footer */}
          <footer className="bg-white border-t border-slate-150 py-6 text-center text-xs text-slate-450 mt-auto">
            <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row justify-between items-center gap-3">
              <p>{tText("© 2026 Finantra • Software Próprio de Controle Manual Independente.")}</p>
              <div className="flex gap-4 font-bold text-[11px] text-slate-400">
                <span>{tText("Privacidade Assegurada")}</span>
                <span>•</span>
                <span>{tText("Nuvem Online Finantra")}</span>
              </div>
            </div>
          </footer>
        </div>
      ) : (
        <div className="min-h-screen bg-[#F1F5F9] text-[#1E293B] flex flex-col font-sans transition-colors antialiased selection:bg-slate-300 animate-fadeIn">
          
          {/* 1. Header Banner & Branding Workspace */}
          <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200 px-4 sm:px-8 py-3.5 flex flex-col sm:flex-row gap-4 items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-[#0F172A] p-2.5 rounded-xl text-white shadow-sm">
                <Wallet className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h1 className="font-extrabold text-[#0F172A] tracking-tighter text-lg sm:text-xl">FINANTRA</h1>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                    <ShieldCheck className="w-3" /> {tText("Privado")}
                  </span>
                </div>
                <p className="text-[11px] text-slate-500 font-medium font-sans">{tText("Controle total manual de receitas, despesas, teto de gastos e investimentos.")}</p>
              </div>
            </div>

            {/* User profile selection fast header bubble */}
            <div className="flex items-center gap-3 flex-wrap">
              <LanguageSelector />
              <a
                href="https://www.mediafire.com/file/09es0r3otu0prlq/Finantra_2.1.apk/file"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-850 text-[10px] font-extrabold rounded-xl border border-emerald-150 transition-all shrink-0"
                title={tText("Baixar Aplicativo Android (APK)")}
              >
                <Smartphone className="w-3.5 h-3.5" />
                <span>{tText("Baixar APK Android")}</span>
              </a>

              {loggedInUser && (
                <div id="header-user-badge" className="bg-slate-900 text-white text-[10px] font-extrabold px-3 py-1.5 rounded-xl border border-slate-800 flex items-center gap-2" title={`${tText("Conectado como")} ${loggedInUser}`}>
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping"></span>
                  <span className="truncate max-w-[130px] font-mono text-[9px] uppercase tracking-wider">{loggedInUser.split('@')[0]}</span>
                </div>
              )}

              <div className="bg-slate-50 text-[11px] text-slate-700 font-bold px-3.5 py-1.5 rounded-xl border border-slate-200/50 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>{tText("Perfil:")} <strong className="text-slate-950 font-extrabold">{tText(currentProfile.name)}</strong></span>
              </div>

              {currentProfile.isCloudSync ? (
                dbStatus.isConnected ? (
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold px-3 py-1.5 rounded-xl border border-emerald-100 flex items-center gap-1">
                    <CloudCheck className="w-3.5 h-3.5" /> {tText("Nuvem Sincronizada")}
                  </span>
                ) : (
                  <span className="text-[10px] bg-amber-50 text-amber-700 font-bold px-3 py-1.5 rounded-xl border border-amber-100 flex items-center gap-1">
                    <CloudLightning className="w-3.5 h-3.5" /> {tText("Nuvem Desconectada")}
                  </span>
                )
              ) : (
                <span className="text-[10px] bg-sky-50 text-sky-700 font-bold px-3 py-1.5 rounded-xl border border-sky-100 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5" /> {tText("Modo Local (100% Offline)")}
                </span>
              )}

              {currentProfile.isCloudSync && (
                <button
                   id="btn-header-sync"
                   onClick={() => loadProfileData(currentProfileId, true)}
                   disabled={isSyncing}
                   className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 border border-slate-200 cursor-pointer active:rotate-45 transition-transform"
                   title={tText("Sincronizar agora")}
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isSyncing ? 'animate-spin text-slate-800' : ''}`} />
                </button>
              )}
            </div>
          </header>

          {/* 2. Educational tips strip helper */}
          {showTip && (
            <div id="financial-tip-bar" className="bg-amber-50/50 border-b border-amber-100/60 py-2.5 px-4 sm:px-8 flex items-center justify-between text-xs text-amber-900 transition-all">
              <div className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4 text-amber-500 shrink-0" />
                <p className="leading-relaxed">
                  <strong>{tText("Dica Financeira:")}</strong> {tText(TIPS[tipIndex])}
                </p>
              </div>
              <button
                id="btn-close-tip"
                onClick={() => setShowTip(false)}
                className="text-amber-500 hover:text-amber-700 p-0.5 rounded hover:bg-amber-100 cursor-pointer shrink-0 ml-3"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          )}

      {/* 3. Main Workspace Navigation & Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 md:p-8 flex flex-col lg:flex-row gap-6">
        
        {/* Navigation Sidebar panel */}
        <aside className="lg:w-64 h-fit shrink-0 bg-white rounded-2xl shadow-xs border border-slate-200 p-4">
          <div className="text-[10px] font-bold text-slate-400 tracking-wider uppercase px-3.5 mb-2">
            {tText("Navegação Principal")}
          </div>

          <nav className="space-y-1">
            {[
              { id: 'dashboard', name: t.navDashboard, icon: LayoutDashboard },
              { id: 'transactions', name: t.navTransactions, icon: ArrowRightLeft },
              { id: 'bills', name: t.navBills, icon: CalendarCheck2 },
              { id: 'investments', name: t.navInvestments, icon: TrendingUp },
              { id: 'eco_ia', name: 'ECO IA Finantra', icon: Sparkles },
              { id: 'notifications', name: tText('Notificações'), icon: Bell },
              { id: 'auth', name: loggedInUser ? t.navAuth : (t.language === 'pt-BR' ? 'Acesso & Login' : (t.language === 'es' ? 'Acceso e Inicio' : 'Access & Login')), icon: LogIn },
              { id: 'config', name: t.navConfig, icon: Settings }
            ].map((tab) => {
              const IconComp = tab.icon;
              const unreadNotifCount = notifications.filter(n => !n.isRead && (!n.isMaintenance || !n.expiryTime || Date.now() < n.expiryTime)).length;
              return (
                <button
                  id={`nav-link-${tab.id}`}
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`w-full flex items-center gap-3 px-3.5 py-3 rounded-xl text-xs font-semibold tracking-tight transition-all cursor-pointer ${
                    activeTab === tab.id
                      ? 'bg-slate-100 text-slate-900 shadow-xs border border-slate-200'
                      : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}
                >
                  <IconComp className="w-4.5 h-4.5 shrink-0" />
                  <span>{tab.name}</span>
                  {tab.id === 'bills' && billsProximityCounts.total > 0 && (
                    <span 
                      className={`ml-auto flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white min-w-[20px] h-5 shadow-xs shrink-0 ${
                        billsProximityCounts.overdue > 0
                          ? 'bg-rose-500 animate-pulse'
                          : 'bg-amber-500'
                      }`} 
                      title={
                        billsProximityCounts.overdue > 0
                          ? `${billsProximityCounts.overdue} ${tText("conta(s) atrasada(s)")}`
                          : `${billsProximityCounts.near} ${tText("conta(s) vencendo nos próximos 3 dias")}`
                      }
                    >
                      {billsProximityCounts.total}
                    </span>
                  )}
                  {tab.id === 'notifications' && unreadNotifCount > 0 && (
                    <span 
                      className="ml-auto flex items-center justify-center text-[10px] font-bold px-2 py-0.5 rounded-full text-white bg-indigo-650 min-w-[20px] h-5 shadow-xs shrink-0 animate-pulse"
                      title={`${unreadNotifCount} ${tText("notificação(ões) não lida(s)")}`}
                    >
                      {unreadNotifCount}
                    </span>
                  )}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Active view window container */}
        <main className="flex-1 min-w-0">
          
          {/* Dashboard Tab */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Painel de Resumo Consolidado")}</h2>
                  <p className="text-xs text-gray-500">{tText("Acompanhe de forma prática todos os capitais alocados, custos recorrentes e balanços de caixa.")}</p>
                </div>

                <div className="hidden sm:block text-right">
                  <span className="text-[10px] text-gray-400 uppercase font-bold tracking-wider block">{tText("Meta Saldo Mês")}</span>
                  <span className="text-xs font-bold text-gray-900">{preferences.currency} {preferences.monthlyIncomeGoal}</span>
                </div>
              </div>

              <FinanceSummary
                transactions={transactions}
                monthlyBills={monthlyBills}
                investments={investments}
                currency={preferences.currency}
                preferences={preferences}
              />
            </div>
          )}

          {/* Transactions Tab */}
          {activeTab === 'transactions' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Gerenciar Ganhos & Gastos")}</h2>
                <p className="text-xs text-gray-500">{tText("Mapeie individualmente as despesas eventuais do cotidiano e recebimentos pontuais de freelance ou salário comercial.")}</p>
              </div>

              <TransactionsTab
                transactions={transactions}
                onAddTransaction={handleAddTransaction}
                onDeleteTransaction={handleDeleteTransaction}
                currency={preferences.currency}
                trashItems={trashItems}
                onRestoreTransaction={handleRestoreTransaction}
                onDeletePermanently={handleDeletePermanently}
              />
            </div>
          )}

          {/* Monthly Bills Tab */}
          {activeTab === 'bills' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Agenda de Contas do Mês")}</h2>
                <p className="text-xs text-gray-500">{tText("Gerencie seguros, convênios de saúde, faturas de concessionárias residenciais e serviços recorrentes sem sobressaltos.")}</p>
              </div>

              <MonthlyBillsTab
                bills={monthlyBills}
                onAddBill={handleAddBill}
                onToggleBillStatus={handleToggleBillStatus}
                onDeleteBill={handleDeleteBill}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* Investments Tab */}
          {activeTab === 'investments' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Monitor de Investimentos Manuais")}</h2>
                <p className="text-xs text-gray-500">{tText("Acompanhe cotas de ações, fundos imobiliários aportados, tesouro ou renda fixa, valorizando seu dinheiro sem integradores terceirizados.")}</p>
              </div>

              <InvestmentsTab
                investments={investments}
                onAddInvestment={handleAddInvestment}
                onUpdateInvestmentValue={handleUpdateInvestmentValue}
                onDeleteInvestment={handleDeleteInvestment}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* ECO IA FINANTRA Tab */}
          {activeTab === 'eco_ia' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("ECO IA FINANTRA")}</h2>
                <p className="text-xs text-gray-500">{tText("Fale com a nossa assistente virtual de inteligência financeira para agendar novos ganhos, gastos, faturas de contas mensais e investimentos, ou tirar dúvidas.")}</p>
              </div>

              <EcoIaTab
                onAddTransaction={handleAddTransaction}
                onAddBill={handleAddBill}
                onAddInvestment={handleAddInvestment}
                transactions={transactions}
                monthlyBills={monthlyBills}
                onDeleteTransaction={handleDeleteTransaction}
                onToggleBillStatus={handleToggleBillStatus}
                currency={preferences.currency}
              />
            </div>
          )}

          {/* Notifications Tab */}
          {activeTab === 'notifications' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Central de Notificações")}</h2>
                <p className="text-xs text-gray-500">{tText("Monitore atividades de ganhos, gastos, faturas vencendo e alertas de manutenção enviados pelo Supabase.")}</p>
              </div>

              <NotificationsTab
                notifications={notifications}
                onMarkAsRead={handleMarkNotificationAsRead}
                onMarkAllAsRead={handleMarkAllNotificationsAsRead}
                onDeleteNotification={handleDeleteNotification}
                onClearAllRead={handleClearAllReadNotifications}
                onRefresh={handleRefreshNotifications}
              />
            </div>
          )}

          {/* Registration and Authentication Tab */}
          {activeTab === 'auth' && (
            <div className="space-y-6 animate-fadeIn">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Acesso de Usuário Finantra")}</h2>
                <p className="text-xs text-gray-500">{tText("Autentique sua conta Finantra com regras de segurança completas contra fraudes ou perdas locais.")}</p>
              </div>

              <AuthTab
                loggedInUser={loggedInUser}
                onLogin={(email) => {
                  setLoggedInUser(email);
                  // Dynamic feedback alert
                  setActiveTab('dashboard');
                }}
                onLogout={() => {
                  setLoggedInUser(null);
                }}
              />
            </div>
          )}

          {/* Settings / Configuration database Tab */}
          {activeTab === 'config' && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-extrabold text-gray-950 tracking-tight">{tText("Propriedades do Perfil & Nuvem")}</h2>
                <p className="text-xs text-gray-500">{tText("Altere limites planejados, simule carteiras, e configure a sincronização com seu banco de dados na Nuvem Online Finantra.")}</p>
              </div>

              <ProfileSelector
                currentProfile={currentProfile}
                profiles={profiles}
                preferences={preferences}
                onUpdatePreferences={handleUpdatePreferences}
                onSwitchProfile={handleSwitchProfile}
                onCreateProfile={handleCreateProfile}
                onClearProfileData={handleClearProfileData}
              />

              <DatabaseStatus
                isCloudSync={currentProfile.isCloudSync}
                onToggleSync={handleToggleSync}
                isConnected={dbStatus.isConnected}
                testConnectionFn={async () => {
                  const isConnected = await testConnection();
                  if (isConnected) {
                    setDbStatus({ isConnected: true, isSynced: true });
                  } else {
                    setDbStatus({ isConnected: false, isSynced: false, errorMsg: tText('Falha ao conectar na API do Supabase.') });
                  }
                }}
                profileId={currentProfile.id}
              />

              {/* Seção Aplicativo Android */}
              <div className="bg-white rounded-2xl border border-slate-200 p-6 space-y-4">
                <div className="flex flex-col sm:flex-row items-start justify-between gap-4">
                  <div className="space-y-1">
                    <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-indigo-600" />
                      {t.downloadApkTitle}
                    </h3>
                    <p className="text-xs text-slate-550 leading-relaxed max-w-xl">
                      {t.downloadApkDesc}
                    </p>
                  </div>
                  <span className="text-[10px] bg-emerald-50 text-emerald-700 font-bold border border-emerald-150 px-2.5 py-0.5 rounded-full shrink-0 uppercase tracking-wider">
                    {t.available}
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row gap-3 pt-2">
                  <a
                    href="https://www.mediafire.com/file/09es0r3otu0prlq/Finantra_2.1.apk/file"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-5 py-2.5 bg-indigo-650 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-xs active:scale-95"
                  >
                    <Download className="w-4 h-4" />
                    {t.downloadApkBtn}
                  </a>
                  <button
                    onClick={() => {
                      localStorage.removeItem('fin_app_choice_dismissed');
                      setShowAppChoiceModal(true);
                    }}
                    className="px-5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 font-bold border border-slate-200 rounded-xl text-xs flex items-center justify-center gap-2 transition-all cursor-pointer active:scale-95 animate-fadeIn"
                  >
                    <Globe className="w-4 h-4 text-slate-450" />
                    {t.reopenInitialChoice}
                  </button>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>

      {/* Footer information copyright */}
      <footer className="bg-white border-t border-gray-200 py-6 text-xs text-gray-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <p>{tText("© 2026 Finantra • Software Próprio de Controle Manual de despesas e investimentos.")}</p>
          <div className="flex flex-wrap items-center gap-4 font-medium text-gray-400">
            <span>{tText("Privacidade Assegurada")}</span>
            <span>•</span>
            <span>{tText("Sem Conexões Extras de Terceiros")}</span>
          </div>
        </div>
      </footer>
    </div>
   )}
  </>
  );
}
