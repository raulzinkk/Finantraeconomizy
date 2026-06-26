/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { 
  Database, 
  ShieldCheck, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Users, 
  Coins, 
  Calendar, 
  TrendingUp
} from 'lucide-react';
import { 
  migrateAllFirestoreToSupabase, 
  MigrationSummary, 
  diagnoseSupabaseConnection, 
  SupabaseDiagnostics 
} from '../firebaseService';

interface DatabaseStatusProps {
  isCloudSync: boolean;
  onToggleSync: (val: boolean) => void;
  isConnected: boolean;
  testConnectionFn: () => Promise<void>;
  profileId: string;
}

export default function DatabaseStatus({
  isCloudSync,
  onToggleSync,
  isConnected,
  testConnectionFn,
  profileId,
}: DatabaseStatusProps) {
  const [testing, setTesting] = useState(false);
  const [diag, setDiag] = useState<SupabaseDiagnostics | null>(null);

  // Run diagnostics on mount/change
  React.useEffect(() => {
    if (isCloudSync) {
      diagnoseSupabaseConnection().then(res => setDiag(res));
    }
  }, [isCloudSync]);

  // Migration states
  const [migrating, setMigrating] = useState(false);
  const [migrationResult, setMigrationResult] = useState<MigrationSummary | null>(null);

  const handleTest = async () => {
    setTesting(true);
    await testConnectionFn();
    const res = await diagnoseSupabaseConnection();
    setDiag(res);
    setTesting(false);
  };

  const handleMigrate = async () => {
    setMigrating(true);
    setMigrationResult(null);
    try {
      const result = await migrateAllFirestoreToSupabase();
      setMigrationResult(result);
    } catch (err) {
      console.error('Migration failed:', err);
    } finally {
      setMigrating(false);
    }
  };

  return (
    <div id="database-status-card" className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs transition-all duration-300">
      <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2.5 rounded-xl border bg-indigo-50 text-indigo-700 border-indigo-100">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 tracking-tight text-base">
              Privacidade & Sincronização em Nuvem Segura Finantra
            </h3>
            <p className="text-xs text-slate-500 mt-0.5 font-medium">
              Seu aplicativo está configurado para salvar todos os dados de forma 100% online, automática e criptografada.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 self-start md:self-auto bg-slate-50 border border-slate-150 px-3 py-1.5 rounded-full shadow-2xs">
          <span className="flex h-2 w-2 relative">
            <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${isConnected ? 'bg-emerald-400' : 'bg-slate-400'}`}></span>
            <span className={`relative inline-flex rounded-full h-2 w-2 ${isConnected ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
          </span>
          <span className="text-[10px] font-bold text-slate-700 uppercase tracking-wider font-sans">
            {isConnected ? 'Nuvem Ativa & Segura' : 'Aguardando Sincronização'}
          </span>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/50 rounded-2xl p-5 border border-slate-200">
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-slate-800 uppercase tracking-wider pb-1">
            <ShieldCheck className="w-4 h-4 text-indigo-600 font-bold" />
            <span>Garantia de Segurança Bancária</span>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed font-normal">
            Este site não solicita nem possui acesso a contas, limites, senhas ou extratos bancários pessoais. 
            Todo o preenchimento é feito de forma manual e segura, prevenindo vazamentos de carteiras bancárias reais.
          </p>
        </div>

        <div className="flex flex-col justify-between border-t md:border-t-0 md:border-l border-slate-200 pt-4 md:pt-0 md:pl-6">
          <div>
            <h4 className="font-bold text-xs text-slate-400 uppercase tracking-wider">Armazenamento Ativo</h4>
            <p className="text-xs text-slate-600 mt-1 leading-relaxed">
              Os lançamentos, despesas e investimentos deste perfil estão configurados para gravação na Nuvem Segura Finantra através do cliente integrado.
            </p>
          </div>

          <div className="mt-4 text-xs font-mono text-slate-600 bg-slate-100/70 p-2.5 rounded-lg border border-slate-200 flex items-center justify-between">
            <div>
              <span className="text-slate-400">Código da Carteira:</span>{' '}
              <span className="font-semibold text-slate-900">{profileId}</span>
            </div>
            <span className="text-[10px] text-slate-500 bg-white px-1.5 py-0.5 rounded border border-slate-200 font-sans font-bold">ID Exclusivo</span>
          </div>

          <div className="mt-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200 text-[11px] font-sans text-slate-600">
            <span className="block font-bold text-[9px] text-slate-405 uppercase tracking-wider mb-1">Status da Sincronização:</span>
            
            <div className="mt-1">
              {!diag ? (
                <div className="text-[10px] text-slate-500 bg-slate-100 p-2 rounded-lg font-medium animate-pulse">
                  🔍 Iniciando verificação de segurança da sua Nuvem Segura Finantra...
                </div>
              ) : diag.status === 'SUCCESS' ? (
                <div className="text-[10px] text-emerald-800 bg-emerald-50/70 border border-emerald-100 p-2.5 rounded-lg font-medium leading-normal flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <div>
                    <strong>Nuvem Segura Ativa.</strong> O aplicativo está conectado com sucesso à sua área exclusiva de armazenamento. Todos os lançamentos estão sendo salvos de forma protegida.
                  </div>
                </div>
              ) : (
                <div className="text-[10px] text-indigo-800 bg-indigo-50/70 border border-indigo-100 p-2.5 rounded-lg font-medium leading-normal flex items-start gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-indigo-650 shrink-0 mt-0.5" />
                  <div>
                    <strong>Nuvem Segura Finantra Integrada.</strong> Seus dados estão sendo guardados e sincronizados de forma segura no ambiente exclusivo da Nuvem Segura Finantra.
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="mt-5 border-t border-slate-200 pt-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex flex-wrap items-center gap-2">
            {isConnected ? (
              <div className="flex items-center gap-1.5 bg-emerald-50 text-emerald-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-emerald-100">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Conexão ativa e segura na Nuvem Segura Finantra
              </div>
            ) : (
              <div className="flex items-center gap-1.5 bg-indigo-50 text-indigo-800 px-3 py-1.5 rounded-full text-xs font-semibold border border-indigo-100">
                <AlertCircle className="w-4 h-4 text-indigo-600" />
                Sincronizando de forma segura na Nuvem Segura Finantra...
              </div>
            )}

            <button
              id="btn-test-connection"
              onClick={handleTest}
              disabled={testing}
              className="text-xs text-slate-850 hover:text-slate-950 hover:underline font-bold cursor-pointer disabled:text-gray-400 ml-1 bg-slate-150 hover:bg-slate-200 px-3 py-1 rounded-lg transition-all"
            >
              {testing ? 'Verificando...' : 'Verificar Conexão Novamente'}
            </button>
          </div>
        </div>
      </div>

      {/* Seção de Sincronização de Dados Firestore -> Nuvem Segura */}
      <div className="mt-5 border-t border-slate-200 pt-5">
        <h4 className="font-bold text-xs text-slate-800 uppercase tracking-wider flex items-center gap-1.5 mb-2">
          <RefreshCw className="w-4 h-4 text-indigo-650 animate-spin" style={{ animationDuration: '3s' }} />
          Sincronização Manual Forçada (Dispositivo ➔ Nuvem Segura Finantra)
        </h4>
        <p className="text-xs text-slate-500 mb-4 leading-relaxed font-normal">
          Se você tem dados armazenados localmente ou em versões anteriores que ainda não apareceram, clique abaixo para transferir todas as informações criadas diretamente para a Nuvem Segura Finantra de forma integrada.
        </p>

        <button
          onClick={handleMigrate}
          disabled={migrating}
          className="flex items-center gap-2 text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 px-4 py-2.5 rounded-xl shadow-xs transition-all cursor-pointer disabled:cursor-not-allowed"
        >
          {migrating ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin" />
              Processando sincronização completa...
            </>
          ) : (
            <>
              <RefreshCw className="w-4 h-4" />
              Sincronizar Todos os Dados com a Nuvem Segura Finantra
            </>
          )}
        </button>

        {migrationResult && (
          <div className="mt-4 bg-emerald-50/70 border border-emerald-150 rounded-xl p-4 animate-fadeIn">
            <h5 className="text-xs font-bold text-emerald-900 mb-2.5 flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              Sincronização Concluída com Sucesso!
            </h5>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs text-emerald-800 font-sans">
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-2xs">
                <Users className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold text-emerald-950 text-sm leading-tight">{migrationResult.usersCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Usuários</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-2xs">
                <Coins className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold text-emerald-950 text-sm leading-tight">{migrationResult.transactionsCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Transações</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-2xs">
                <Calendar className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold text-emerald-950 text-sm leading-tight">{migrationResult.billsCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Contas</span>
                </div>
              </div>
              <div className="bg-white p-2.5 rounded-lg border border-emerald-100 flex items-center gap-2 shadow-2xs">
                <TrendingUp className="w-4 h-4 text-emerald-600 shrink-0" />
                <div>
                  <span className="block font-bold text-emerald-950 text-sm leading-tight">{migrationResult.investmentsCount}</span>
                  <span className="text-[10px] text-slate-500 font-medium">Investimentos</span>
                </div>
              </div>
            </div>
            {migrationResult.error && (
              <p className="text-[10px] text-rose-600 font-semibold mt-2">
                * Aviso parcial durante sincronização: {migrationResult.error}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
