import React, { useState } from 'react';
import { Target, Plus, Trash2, PiggyBank, Calendar, DollarSign, Award, ArrowUpRight } from 'lucide-react';
import { FinancialGoal } from '../types';
import { formatCurrency } from '../utils';

interface GoalsTabProps {
  goals: FinancialGoal[];
  onAddGoal: (goal: Omit<FinancialGoal, 'id' | 'profileId'>) => void;
  onUpdateGoalAmount: (id: string, newAmount: number) => void;
  onDeleteGoal: (id: string) => void;
  currency: string;
}

export default function GoalsTab({ goals, onAddGoal, onUpdateGoalAmount, onDeleteGoal, currency }: GoalsTabProps) {
  // Add Goal Form States
  const [showAddForm, setShowAddForm] = useState(false);
  const [name, setName] = useState('');
  const [targetAmount, setTargetAmount] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [deadline, setDeadline] = useState('');
  const [category, setCategory] = useState('');

  // Save Amount Modal States
  const [activeGoalIdForSaving, setActiveGoalIdForSaving] = useState<string | null>(null);
  const [savingsIncrement, setSavingsIncrement] = useState('');

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !targetAmount) return;

    onAddGoal({
      name: name.trim(),
      targetAmount: Number(targetAmount),
      currentAmount: Number(currentAmount) || 0,
      deadline: deadline || undefined,
      category: category.trim() || undefined
    });

    // Reset fields
    setName('');
    setTargetAmount('');
    setCurrentAmount('');
    setDeadline('');
    setCategory('');
    setShowAddForm(false);
  };

  const handleSaveToGoalSubmit = (e: React.FormEvent, goalId: string) => {
    e.preventDefault();
    const increment = Number(savingsIncrement);
    if (isNaN(increment) || increment <= 0) return;

    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const updatedAmount = goal.currentAmount + increment;
      onUpdateGoalAmount(goalId, updatedAmount);
    }

    setSavingsIncrement('');
    setActiveGoalIdForSaving(null);
  };

  return (
    <div className="space-y-6">
      {/* Upper action header */}
      <div className="flex justify-between items-center bg-white p-5 rounded-2xl border border-slate-200 shadow-3xs">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-slate-900 text-white flex items-center justify-center">
            <Target className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 uppercase tracking-wider">Definição de Metas de Economia</h3>
            <p className="text-xs text-slate-500">Mantenha seu foco monitorando e poupando ativamente para seus objetivos pessoais.</p>
          </div>
        </div>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="px-4 py-2.5 bg-slate-950 hover:bg-slate-800 text-white text-xs font-bold rounded-xl flex items-center gap-2 transition-all cursor-pointer shadow-sm active:scale-95"
        >
          <Plus className="w-4 h-4" />
          Nova Meta
        </button>
      </div>

      {/* Goal creation Form */}
      {showAddForm && (
        <form onSubmit={handleFormSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-xs space-y-4 animate-fadeIn">
          <div className="border-b border-slate-100 pb-3">
            <h4 className="text-sm font-bold text-slate-900">Mapear Novo Objetivo Financeiro</h4>
            <p className="text-[11px] text-slate-500">Estipule os valores ideais para o seu plano financeiro.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Título / Nome da Meta</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ex: Viagem de Férias, Reserva de Emergência"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none text-slate-850 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Categoria (Opcional)</label>
              <input
                type="text"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                placeholder="Ex: Lazer, Habitação, Segurança"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none text-slate-850 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor Alvo ({currency})</label>
              <input
                type="number"
                required
                min="0.01"
                step="0.01"
                value={targetAmount}
                onChange={(e) => setTargetAmount(e.target.value)}
                placeholder="Ex: 5000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none text-slate-850 transition-all"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Valor Já Economizado Atualmente ({currency})</label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={currentAmount}
                onChange={(e) => setCurrentAmount(e.target.value)}
                placeholder="Ex: 1000"
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none text-slate-850 transition-all"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Prazo Estimado (Opcional)</label>
              <input
                type="date"
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-3 py-2.5 outline-none text-slate-850 transition-all"
              />
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2 border-t border-slate-150">
            <button
              type="button"
              onClick={() => setShowAddForm(false)}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
            >
              Criar Meta
            </button>
          </div>
        </form>
      )}

      {/* Grid of goals */}
      {goals.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center space-y-4 shadow-3xs">
          <div className="mx-auto w-12 h-12 bg-slate-50 border border-slate-150 text-slate-400 rounded-full flex items-center justify-center">
            <Target className="w-6 h-6" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-slate-900">Nenhuma meta definida neste perfil</h4>
            <p className="text-xs text-slate-400 max-w-md mx-auto mt-1">Crie metas para organizar suas economias e acompanhar o progresso dos seus sonhos.</p>
          </div>
          <button
            onClick={() => setShowAddForm(true)}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
          >
            Começar Agora
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {goals.map((g) => {
            const percent = Math.min(100, Math.round((g.currentAmount / g.targetAmount) * 100)) || 0;
            const remaining = Math.max(0, g.targetAmount - g.currentAmount);
            const isCompleted = g.currentAmount >= g.targetAmount;

            return (
              <div
                key={g.id}
                className="bg-white border border-slate-200 rounded-2xl p-5 shadow-3xs flex flex-col justify-between hover:border-slate-350 transition-all space-y-4"
              >
                {/* Card Title & Category */}
                <div className="space-y-1">
                  <div className="flex justify-between items-start gap-2">
                    <span className="text-[9px] font-extrabold uppercase bg-slate-100 text-slate-600 px-2.5 py-0.5 rounded-full border border-slate-200/50">
                      {g.category || 'Geral'}
                    </span>
                    <button
                      onClick={() => onDeleteGoal(g.id)}
                      className="p-1 text-slate-400 hover:text-rose-600 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer"
                      title="Excluir Meta"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                  <h4 className="text-sm font-bold text-slate-900 tracking-tight leading-snug line-clamp-2">{g.name}</h4>
                </div>

                {/* Values & Progress bar */}
                <div className="space-y-2">
                  <div className="flex justify-between items-baseline">
                    <div className="text-[10px] text-slate-400 font-bold">Progresso</div>
                    <div className="text-xs font-extrabold text-slate-950">{percent}%</div>
                  </div>

                  {/* Progress bar container */}
                  <div className="w-full bg-slate-150 rounded-full h-2 overflow-hidden border border-slate-200/30">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${isCompleted ? 'bg-emerald-500' : 'bg-slate-900'}`}
                      style={{ width: `${percent}%` }}
                    />
                  </div>

                  <div className="flex justify-between items-center text-[10px] text-slate-400 font-semibold pt-1">
                    <span>{formatCurrency(g.currentAmount, currency)}</span>
                    <span>Alvo: {formatCurrency(g.targetAmount, currency)}</span>
                  </div>
                </div>

                {/* Bottom specs & adding savings form */}
                <div className="border-t border-slate-100 pt-3 space-y-3">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-semibold">Falta poupar:</span>
                    <span className={`font-bold ${isCompleted ? 'text-emerald-600' : 'text-slate-900'}`}>
                      {isCompleted ? 'Meta Concluída! 🏆' : formatCurrency(remaining, currency)}
                    </span>
                  </div>

                  {g.deadline && (
                    <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-semibold">
                      <Calendar className="w-3.5 h-3.5 shrink-0" />
                      <span>Prazo: {new Date(g.deadline + 'T00:00:00').toLocaleDateString('pt-BR')}</span>
                    </div>
                  )}

                  {/* Add saving trigger or simple form inside card */}
                  {activeGoalIdForSaving === g.id ? (
                    <form onSubmit={(e) => handleSaveToGoalSubmit(e, g.id)} className="pt-2 animate-fadeIn">
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input
                            type="number"
                            required
                            min="0.01"
                            step="0.01"
                            value={savingsIncrement}
                            onChange={(e) => setSavingsIncrement(e.target.value)}
                            placeholder="Valor a somar..."
                            className="w-full bg-slate-50 border border-slate-250 focus:border-slate-800 focus:bg-white text-[11px] rounded-lg pl-6 pr-2 py-2 outline-none text-slate-850 transition-all font-semibold"
                            autoFocus
                          />
                          <DollarSign className="w-3.5 h-3.5 text-slate-450 absolute left-2 top-1/2 -translate-y-1/2" />
                        </div>
                        <button
                          type="submit"
                          className="px-3 bg-[#0F172A] hover:bg-slate-800 text-white text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          Adicionar
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveGoalIdForSaving(null);
                            setSavingsIncrement('');
                          }}
                          className="px-2 bg-slate-100 hover:bg-slate-200 text-slate-500 text-[11px] font-bold rounded-lg transition-all cursor-pointer"
                        >
                          X
                        </button>
                      </div>
                    </form>
                  ) : (
                    <button
                      onClick={() => setActiveGoalIdForSaving(g.id)}
                      className="w-full py-2 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-800 text-[10px] font-bold rounded-lg flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                    >
                      <PiggyBank className="w-3.5 h-3.5" />
                      Guardar Economia nesta Meta
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
