/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AppNotification } from '../types';
import { useLanguage } from '../translations';
import {
  Bell,
  Trash2,
  Check,
  CheckCheck,
  AlertTriangle,
  Calendar,
  TrendingUp,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Info,
  RefreshCw
} from 'lucide-react';

interface NotificationsTabProps {
  notifications: AppNotification[];
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
  onDeleteNotification: (id: string) => void;
  onClearAllRead: () => void;
  onRefresh?: () => Promise<{ success: boolean; count: number; error?: string }>;
}

export default function NotificationsTab({
  notifications,
  onMarkAsRead,
  onMarkAllAsRead,
  onDeleteNotification,
  onClearAllRead,
  onRefresh
}: NotificationsTabProps) {
  const { tText } = useLanguage();
  const [filter, setFilter] = useState<'all' | 'unread' | 'maintenance'>('all');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [refreshStatus, setRefreshStatus] = useState<{ success: boolean; message: string } | null>(null);

  const handleManualRefresh = async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    setRefreshStatus(null);
    try {
      const result = await onRefresh();
      if (result.success) {
        setRefreshStatus({
          success: true,
          message: tText("Notificações atualizadas com sucesso! " + result.count + " aviso(s) de manutenção ativo(s).")
        });
      } else {
        setRefreshStatus({
          success: false,
          message: result.error || tText("Não foi possível carregar novas notificações.")
        });
      }
    } catch (err: any) {
      setRefreshStatus({
        success: false,
        message: err?.message || tText("Erro ao atualizar.")
      });
    } finally {
      setIsRefreshing(false);
    }
  };

  // Filtered notifications list
  const filteredNotifications = notifications.filter((notif) => {
    // Check if expired (maintenance expires after 2 hours)
    if (notif.isMaintenance && notif.expiryTime && Date.now() > notif.expiryTime) {
      return false;
    }
    if (filter === 'unread') return !notif.isRead;
    if (filter === 'maintenance') return notif.isMaintenance;
    return true;
  });

  // Helper to get relative time
  const formatRelativeTime = (isoString: string) => {
    try {
      const date = new Date(isoString);
      const diffMs = Date.now() - date.getTime();
      const diffMins = Math.floor(diffMs / (1000 * 60));
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));

      if (diffMins < 1) return tText("Agora mesmo");
      if (diffMins < 60) return `${diffMins} ${tText("min atrás")}`;
      if (diffHours < 24) return `${diffHours} ${tText("h atrás")}`;
      return date.toLocaleDateString();
    } catch {
      return isoString;
    }
  };

  const unreadCount = notifications.filter(n => !n.isRead).length;
  const maintenanceCount = notifications.filter(n => n.isMaintenance && (!n.expiryTime || Date.now() < n.expiryTime)).length;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Notifications main list (2 cols on large screen) */}
      <div className="lg:col-span-2 space-y-4">
        {/* Actions bar */}
        <div className="bg-white rounded-2xl border border-slate-200 p-4 flex flex-col sm:flex-row items-center justify-between gap-4 shadow-2xs">
          {/* Filters */}
          <div className="flex flex-wrap items-center gap-1.5 w-full sm:w-auto">
            <button
              onClick={() => setFilter('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'all'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tText("Todas")} ({notifications.length})
            </button>
            <button
              onClick={() => setFilter('unread')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                filter === 'unread'
                  ? 'bg-slate-900 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              {tText("Não Lidas")} ({unreadCount})
            </button>
            <button
              onClick={() => setFilter('maintenance')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer flex items-center gap-1 ${
                filter === 'maintenance'
                  ? 'bg-rose-600 text-white shadow-sm'
                  : 'bg-slate-50 text-slate-600 hover:bg-slate-100'
              }`}
            >
              <AlertTriangle className="w-3 h-3 text-current" />
              {tText("Manutenções")} ({maintenanceCount})
            </button>
          </div>

          {/* Quick actions */}
          <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
            {onRefresh && (
              <button
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className="px-3 py-1.5 rounded-lg text-xs bg-indigo-50 text-indigo-700 hover:bg-indigo-100 disabled:opacity-50 transition-all cursor-pointer flex items-center gap-1.5 font-bold shadow-3xs"
                title={tText("Verificar se há notificações novas ou removidas")}
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
                {isRefreshing ? tText("Atualizando...") : tText("Atualizar")}
              </button>
            )}
            {unreadCount > 0 && (
              <button
                id="btn-mark-all-read"
                onClick={onMarkAllAsRead}
                className="px-3 py-1.5 text-xs text-indigo-600 hover:text-indigo-800 hover:underline font-bold cursor-pointer flex items-center gap-1"
              >
                <CheckCheck className="w-4 h-4" />
                {tText("Marcar todas como lidas")}
              </button>
            )}
            {notifications.some(n => n.isRead && !n.isMaintenance) && (
              <button
                id="btn-clear-read-notifications"
                onClick={onClearAllRead}
                className="px-3 py-1.5 text-xs text-slate-550 hover:text-rose-600 font-bold hover:underline cursor-pointer flex items-center gap-1"
              >
                <Trash2 className="w-3.5 h-3.5" />
                {tText("Limpar visualizadas")}
              </button>
            )}
          </div>
        </div>

        {/* Refresh status banner */}
        {refreshStatus && (
          <motion.div 
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-2xl border text-xs flex items-center justify-between shadow-2xs gap-3 ${
              refreshStatus.success
                ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                : 'bg-rose-50 border-rose-200 text-rose-800'
            }`}
          >
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 shrink-0 text-current" />
              <span className="font-medium leading-relaxed">{refreshStatus.message}</span>
            </div>
            <button
              onClick={() => setRefreshStatus(null)}
              className="text-xs font-bold hover:underline shrink-0"
            >
              {tText("Fechar")}
            </button>
          </motion.div>
        )}

        {/* Notifications feed list */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-white rounded-3xl border border-slate-200 p-12 text-center shadow-2xs">
              <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4 border border-slate-100 text-slate-300">
                <Bell className="w-7 h-7" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">{tText("Sem notificações encontradas")}</h3>
              <p className="text-xs text-slate-500 mt-1 max-w-xs mx-auto leading-relaxed">
                {filter === 'unread'
                  ? tText("Parabéns! Você leu todas as atualizações e atividades recentes da sua carteira.")
                  : filter === 'maintenance'
                    ? tText("Nenhum alerta de manutenção programado no momento pelo Supabase.")
                    : tText("Adicione novos ganhos, despesas, faturas ou investimentos para ver os alertas automáticos aqui.")}
              </p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {filteredNotifications.map((n) => {
                // Color templates depending on notification type
                let typeBg = 'bg-slate-50 text-slate-600 border-slate-100';
                let Icon = Bell;

                if (n.type === 'earning_added') {
                  typeBg = 'bg-emerald-50 text-emerald-600 border-emerald-100/50';
                  Icon = ArrowUpRight;
                } else if (n.type === 'expense_added') {
                  typeBg = 'bg-rose-50 text-rose-500 border-rose-100/50';
                  Icon = ArrowDownRight;
                } else if (n.type === 'bill_added') {
                  typeBg = 'bg-amber-50 text-amber-600 border-amber-100/50';
                  Icon = Calendar;
                } else if (n.type === 'investment_added') {
                  typeBg = 'bg-indigo-50 text-indigo-600 border-indigo-100/50';
                  Icon = TrendingUp;
                } else if (n.type === 'maintenance') {
                  typeBg = 'bg-rose-100/70 text-rose-700 border-rose-200';
                  Icon = AlertTriangle;
                }

                return (
                  <motion.div
                    key={n.id}
                    id={`notification-card-${n.id}`}
                    layout
                    initial={{ opacity: 0, y: 10, scale: 0.98 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, x: -15, transition: { duration: 0.15 } }}
                    className={`bg-white rounded-2xl p-4.5 border shadow-3xs flex gap-4 items-start transition-all ${
                      n.isRead ? 'border-slate-150 opacity-75' : 'border-slate-200 hover:border-slate-350'
                    } ${n.isMaintenance ? 'bg-rose-50/10' : ''}`}
                  >
                    {/* Visual icon marker */}
                    <div className={`p-2.5 rounded-xl border shrink-0 ${typeBg}`}>
                      <Icon className="w-4 h-4" />
                    </div>

                    {/* Text block */}
                    <div className="flex-1 min-w-0 space-y-1">
                      <div className="flex items-center gap-2 flex-wrap justify-between">
                        <span className="text-xs font-extrabold text-slate-950 flex items-center gap-1.5">
                          {tText(n.title)}
                          {!n.isRead && (
                            <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full inline-block" title={tText("Não lido")} />
                          )}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {formatRelativeTime(n.timestamp)}
                        </span>
                      </div>
                      <p className="text-xs text-slate-650 leading-relaxed font-sans">{tText(n.description)}</p>

                      {n.isMaintenance && n.expiryTime && (
                        <div className="text-[10px] text-rose-600 font-semibold flex items-center gap-1 mt-1.5">
                          <Clock className="w-3 h-3" />
                          <span>
                            {tText("Expira automaticamente em:")} {new Date(n.expiryTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Action buttons */}
                    <div className="flex items-center gap-1 shrink-0 self-center">
                      {/* Mark as read toggle */}
                      {!n.isRead ? (
                        <button
                          id={`btn-mark-read-${n.id}`}
                          onClick={() => onMarkAsRead(n.id)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-colors cursor-pointer"
                          title={tText("Marcar como visualizada")}
                        >
                          <Check className="w-4 h-4" />
                        </button>
                      ) : (
                        <span className="p-1.5 text-slate-300 font-bold text-xs" title={tText("Visualizada")}>
                          <CheckCheck className="w-4 h-4 text-slate-400" />
                        </span>
                      )}

                      {/* Delete notification */}
                      {(() => {
                        if (n.isMaintenance) {
                          const isProblemasCorrigidos = n.title?.toLowerCase().includes("problemas corrigidos") || n.description?.toLowerCase().includes("problemas corrigidos");
                          const isManutencaoPrevia = n.title?.toLowerCase().includes("manutenção prévia") || n.description?.toLowerCase().includes("manutenção prévia") || n.title?.toLowerCase().includes("manutencao previa") || n.description?.toLowerCase().includes("manutencao previa");

                          if (isProblemasCorrigidos || isManutencaoPrevia) {
                            const elapsedMs = Date.now() - new Date(n.timestamp).getTime();
                            const elapsedHours = elapsedMs / (1000 * 60 * 60);
                            const limitHours = isProblemasCorrigidos ? 3 : 1;

                            if (elapsedHours >= limitHours) {
                              return (
                                <button
                                  id={`btn-delete-notification-${n.id}`}
                                  onClick={() => onDeleteNotification(n.id)}
                                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-all cursor-pointer"
                                  title={tText("Remover notificação")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              );
                            } else {
                              const remainingMin = Math.ceil(limitHours * 60 - (elapsedMs / (1000 * 60)));
                              return (
                                <button
                                  disabled
                                  className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                                  title={tText(`Exclusão bloqueada: Esta notificação só pode ser excluída após ${limitHours} hora(s) da criação. Restam ${remainingMin} minutos.`)}
                                >
                                  <Trash2 className="w-4 h-4 opacity-40" />
                                </button>
                              );
                            }
                          } else {
                            return (
                              <button
                                disabled
                                className="p-1.5 rounded-lg text-slate-200 cursor-not-allowed"
                                title={tText("Notificações de Manutenção padrão não podem ser excluídas manualmente")}
                              >
                                <Trash2 className="w-4 h-4 opacity-40" />
                              </button>
                            );
                          }
                        } else {
                          return (
                            <button
                              id={`btn-delete-notification-${n.id}`}
                              onClick={() => {
                                if (n.isRead) {
                                  onDeleteNotification(n.id);
                                }
                              }}
                              disabled={!n.isRead}
                              className={`p-1.5 rounded-lg transition-all ${
                                n.isRead
                                  ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50 cursor-pointer'
                                  : 'text-slate-200 cursor-not-allowed'
                              }`}
                              title={n.isRead ? tText("Remover notificação") : tText("Você só pode excluir após visualizar a notificação")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          );
                        }
                      })()}
                    </div>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          )}
        </div>
      </div>

      {/* Rules Info Panel (1 col on large screen) */}
      <div className="space-y-4">
        {/* Rule box explanations */}
        <div className="bg-white rounded-3xl border border-slate-200 p-5 space-y-4 shadow-3xs text-slate-600 text-xs">
          <div className="flex items-center gap-2 pb-1 border-b border-slate-100">
            <Clock className="w-4 h-4 text-indigo-600" />
            <h4 className="font-bold text-slate-900 text-xs">
              {tText("Regras de Notificações")}
            </h4>
          </div>
          <ul className="space-y-3 text-xs leading-relaxed">
            <li className="flex gap-2">
              <span className="text-indigo-600 font-extrabold">•</span>
              <span><strong>{tText("Visualização Prévia:")}</strong> {tText("Qualquer atividade que você realizar gerará um alerta automático para acompanhamento em tempo real.")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-extrabold">•</span>
              <span><strong>{tText("Exclusão Manual:")}</strong> {tText("Só é permitida a exclusão de alertas de transações e investimentos após você os marcar como lidos.")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-extrabold">•</span>
              <span><strong>{tText("Alertas Especiais:")}</strong> {tText("Avisos de 'Problemas corrigidos' só podem ser excluídos pelo usuário após 3 horas da sua criação. Avisos de 'Manutenção prévia' podem ser excluídos após 1 hora.")}</span>
            </li>
            <li className="flex gap-2">
              <span className="text-indigo-600 font-extrabold">•</span>
              <span><strong>{tText("Manutenção Padrão:")}</strong> {tText("Estes avisos importantes não podem ser excluídos manualmente. Eles expiram automaticamente após o período estipulado de 2 horas.")}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
