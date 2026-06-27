/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import { jsPDF } from 'jspdf';
import { motion, AnimatePresence } from 'motion/react';
import { useLanguage } from '../translations';
import { Transaction, TransactionType, TrashItem } from '../types';
import {
  CATEGORIES_EARNINGS,
  CATEGORIES_EXPENSES,
  PAYMENT_METHODS,
  formatCurrency,
  formatDate
} from '../utils';
import {
  Search,
  Plus,
  Trash2,
  ListFilter,
  ArrowDownCircle,
  ArrowUpCircle,
  Calendar,
  DollarSign,
  Tag,
  CreditCard,
  FileText,
  X,
  RotateCcw
} from 'lucide-react';

interface TransactionsTabProps {
  transactions: Transaction[];
  onAddTransaction: (trans: Omit<Transaction, 'id' | 'profileId'>) => void;
  onDeleteTransaction: (id: string) => void;
  currency: string;
  trashItems?: TrashItem[];
  onRestoreTransaction?: (item: TrashItem) => void;
  onDeletePermanently?: (id: string) => void;
}

export default function TransactionsTab({
  transactions,
  onAddTransaction,
  onDeleteTransaction,
  currency,
  trashItems = [],
  onRestoreTransaction,
  onDeletePermanently,
}: TransactionsTabProps) {
  const { tText } = useLanguage();
  // States
  const [filterType, setFilterType] = useState<'all' | 'earnings' | 'expenses'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showAddForm, setShowAddForm] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [activeSubTab, setActiveSubTab] = useState<'active' | 'trash'>('active');
  const [deletingTrashId, setDeletingTrashId] = useState<string | null>(null);

  // Form States
  const [formType, setFormType] = useState<TransactionType>('expenses');
  const [formDescription, setFormDescription] = useState('');
  const [formAmount, setFormAmount] = useState('');
  const [formCategory, setFormCategory] = useState('');
  const [formDate, setFormDate] = useState(new Date().toISOString().substring(0, 10));
  const [formPayment, setFormPayment] = useState(PAYMENT_METHODS[0]);
  const [formNotes, setFormNotes] = useState('');

  // Automatically match first category based on type selection to avoid invalid values
  const handleTypeToggle = (type: TransactionType) => {
    setFormType(type);
    setFormCategory(type === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]);
  };

  // Populate first category on click open
  const startAddForm = () => {
    setFormCategory(formType === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]);
    setShowAddForm(true);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amountVal = parseFloat(formAmount);
    if (!formDescription.trim()) return alert(tText('Insira uma descrição válida!'));
    if (isNaN(amountVal) || amountVal <= 0) return alert(tText('Insira um valor maior que R$ 0,00!'));
    
    onAddTransaction({
      type: formType,
      description: formDescription.trim(),
      amount: amountVal,
      category: formCategory || (formType === 'earnings' ? CATEGORIES_EARNINGS[0] : CATEGORIES_EXPENSES[0]),
      date: formDate,
      paymentMethod: formPayment,
      notes: formNotes.trim()
    });

    // Reset Form
    setFormDescription('');
    setFormAmount('');
    setFormNotes('');
    setShowAddForm(false);
  };

  // Generate a visual PDF statement of the current movements
  const handleExportPDF = () => {
    const doc = new jsPDF();
    
    // Primary Slate colors for styling
    const primaryColor = [15, 23, 42]; // #0F172A
    const secondaryColor = [71, 85, 105]; // #475569
    const lightBg = [248, 250, 252]; // #F8FAFC
    const borderGray = [226, 232, 240]; // #E2E8F0
    const textDark = [30, 41, 59]; // #1E293B
    const textMuted = [100, 116, 139]; // #64748B
    
    // Add custom header banner
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(0, 0, 210, 40, 'F');
    
    // App Brand Title
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('FINANTRA', 15, 18);
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(203, 213, 225);
    doc.text('Sistema Personalizado de Controle Manual de Gastos e Ativos', 15, 24);
    doc.text(`Emitido em: ${new Date().toLocaleDateString('pt-BR')} ${new Date().toLocaleTimeString('pt-BR').slice(0, 5)}`, 15, 30);
    
    // Document Subtitle
    doc.setTextColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    doc.text('EXTRATO VISUAL DE MOVIMENTAÇÕES FINANCEIRAS', 15, 52);
    
    // Draw fine dividing line
    doc.setDrawColor(borderGray[0], borderGray[1], borderGray[2]);
    doc.setLineWidth(0.5);
    doc.line(15, 56, 195, 56);
    
    // Calculate summary stats for the PDF header
    const earnings = filteredList.filter(t => t.type === 'earnings').reduce((sum, t) => sum + t.amount, 0);
    const expenses = filteredList.filter(t => t.type === 'expenses').reduce((sum, t) => sum + t.amount, 0);
    const netBalance = earnings - expenses;
    
    // Render Stats Cards in PDF
    // Card 1: Ganhos
    doc.setFillColor(240, 253, 250); // Light emerald
    doc.roundedRect(15, 62, 55, 22, 2, 2, 'F');
    doc.setTextColor(5, 150, 105); // Emerald 600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL DE ENTRADAS', 18, 68);
    doc.setFontSize(11);
    doc.text(formatCurrency(earnings, currency), 18, 77);
    
    // Card 2: Saídas
    doc.setFillColor(254, 242, 242); // Light rose
    doc.roundedRect(77, 62, 55, 22, 2, 2, 'F');
    doc.setTextColor(220, 38, 38); // Rose 600
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('TOTAL DE SAÍDAS', 80, 68);
    doc.setFontSize(11);
    doc.text(formatCurrency(expenses, currency), 80, 77);
    
    // Card 3: Saldo
    doc.setFillColor(lightBg[0], lightBg[1], lightBg[2]);
    doc.roundedRect(140, 62, 55, 22, 2, 2, 'F');
    doc.setTextColor(textDark[0], textDark[1], textDark[2]);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text('SALDO ACUMULADO', 143, 68);
    doc.setFontSize(11);
    if (netBalance >= 0) {
      doc.setTextColor(16, 185, 129); // Emerald 500
    } else {
      doc.setTextColor(239, 68, 68); // Rose 500
    }
    doc.text(formatCurrency(netBalance, currency), 143, 77);
    
    // Table Header
    doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
    doc.rect(15, 92, 180, 8, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8.5);
    doc.text('Data', 18, 97.5);
    doc.text('Descrição / Lançamento', 38, 97.5);
    doc.text('Categoria', 105, 97.5);
    doc.text('Método', 145, 97.5);
    doc.text('Valor', 192, 97.5, { align: 'right' });
    
    let y = 105;
    const pageHeight = 297;
    
    // Reset font for data rows
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    
    filteredList.forEach((t, index) => {
      // Alternating row background
      if (index % 2 === 0) {
        doc.setFillColor(252, 253, 254);
        doc.rect(15, y - 4, 180, 7.5, 'F');
      }
      
      // Draw bottom border for rows
      doc.setDrawColor(241, 245, 249);
      doc.setLineWidth(0.2);
      doc.line(15, y + 3.5, 195, y + 3.5);
      
      doc.setTextColor(textDark[0], textDark[1], textDark[2]);
      doc.text(formatDate(t.date), 18, y);
      
      // Handle potential description overflow
      const desc = t.description.length > 35 ? t.description.substring(0, 32) + '...' : t.description;
      doc.text(desc, 38, y);
      
      doc.text(tText(t.category), 105, y);
      doc.text(tText(t.paymentMethod), 145, y);
      
      if (t.type === 'earnings') {
        doc.setTextColor(5, 150, 105); // Emerald 600
        doc.text(`+ ${formatCurrency(t.amount, currency)}`, 192, y, { align: 'right' });
      } else {
        doc.setTextColor(220, 38, 38); // Rose 600
        doc.text(`- ${formatCurrency(t.amount, currency)}`, 192, y, { align: 'right' });
      }
      
      y += 7.5;
      
      // Check for page overflow
      if (y > pageHeight - 20) {
        // Footer on the current page before adding a new page
        doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
        doc.setFontSize(7);
        doc.text('Finantra - Finanças sob seu controle absoluto e com total privacidade.', 15, pageHeight - 10);
        doc.text(`Página ${doc.getNumberOfPages()}`, 195, pageHeight - 10, { align: 'right' });
        
        doc.addPage();
        y = 25; // Reset y for new page
        
        // Redraw thin header banner on the new page
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(0, 0, 210, 15, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(10);
        doc.text('FINANTRA - EXTRATO COMPLEMENTAR', 15, 10);
        
        // Table Header again on new page
        doc.setFillColor(primaryColor[0], primaryColor[1], primaryColor[2]);
        doc.rect(15, 22, 180, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(8.5);
        doc.text('Data', 18, 27.5);
        doc.text('Descrição / Lançamento', 38, 27.5);
        doc.text('Categoria', 105, 27.5);
        doc.text('Método', 145, 27.5);
        doc.text('Valor', 192, 27.5, { align: 'right' });
        
        y = 35;
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(8);
      }
    });
    
    // Add final footer
    doc.setTextColor(textMuted[0], textMuted[1], textMuted[2]);
    doc.setFontSize(7);
    doc.text('Finantra - Finanças sob seu controle absoluto e com total privacidade.', 15, pageHeight - 10);
    doc.text(`Página ${doc.getNumberOfPages()}`, 195, pageHeight - 10, { align: 'right' });
    
    doc.save(`extrato_finantra_${new Date().toISOString().slice(0, 10)}.pdf`);
  };

  // Categories list based on filter
  const allAvailableCategories = useMemo(() => {
    const list = new Set<string>();
    transactions.forEach(t => list.add(t.category));
    return Array.from(list);
  }, [transactions]);

  // Filter & Search Logic
  const filteredList = useMemo(() => {
    return transactions
      .filter((t) => {
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesQuery = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             tText(t.category).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesType && matchesQuery && matchesCategory;
      })
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [transactions, filterType, searchQuery, selectedCategory, tText]);

  // Filter & Search Logic for Trash
  const filteredTrashList = useMemo(() => {
    return trashItems
      .filter((item) => {
        const t = item.transaction;
        if (!t) return false;
        const matchesType = filterType === 'all' || t.type === filterType;
        const matchesQuery = t.description.toLowerCase().includes(searchQuery.toLowerCase()) || 
                             (t.notes || '').toLowerCase().includes(searchQuery.toLowerCase()) ||
                             t.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
                             tText(t.category).toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === 'all' || t.category === selectedCategory;
        return matchesType && matchesQuery && matchesCategory;
      })
      .sort((a, b) => new Date(b.deletedAt).getTime() - new Date(a.deletedAt).getTime());
  }, [trashItems, filterType, searchQuery, selectedCategory, tText]);

  return (
    <div className="space-y-6">
      {/* Search and Filters Strip */}
      <div className="bg-white rounded-2xl border border-slate-200 p-5 flex flex-col md:flex-row gap-4 items-center justify-between shadow-xs">
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
          {/* Quick Type Filter Selector */}
          <div className="flex bg-slate-100 p-1 rounded-xl">
            <button
              id="filter-type-all"
              onClick={() => setFilterType('all')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tText("Todos")} ({transactions.length})
            </button>
            <button
              id="filter-type-earnings"
              onClick={() => setFilterType('earnings')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'earnings' ? 'bg-white text-emerald-600 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tText("Ganhos")} ({transactions.filter(t => t.type === 'earnings').length})
            </button>
            <button
              id="filter-type-expenses"
              onClick={() => setFilterType('expenses')}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-all duration-150 ${
                filterType === 'expenses' ? 'bg-white text-rose-500 shadow-xs' : 'text-slate-500 hover:text-slate-900'
              }`}
            >
              {tText("Gastos")} ({transactions.filter(t => t.type === 'expenses').length})
            </button>
          </div>

          {/* Category Dropdown Selector */}
          <div className="relative shrink-0">
            <select
              id="category-filter-select"
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="appearance-none bg-slate-50 border border-slate-200 text-xs rounded-xl px-4 py-2.5 pr-8 font-medium text-slate-700 outline-none hover:bg-slate-100/70 focus:border-slate-800 transition-colors cursor-pointer"
            >
              <option value="all">{tText("Ver todas categorias")}</option>
              {allAvailableCategories.map((cat) => (
                <option key={cat} value={cat}>
                  {tText(cat)}
                </option>
              ))}
            </select>
            <ListFilter className="w-3.5 h-3.5 text-slate-400 absolute right-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          {/* Search box input */}
          <div className="relative w-full md:w-64">
            <input
              id="transaction-search-input"
              type="text"
              placeholder={tText("Buscar por descrição ou categoria...")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 text-xs rounded-xl pl-9 pr-4 py-2.5 text-slate-800 outline-none hover:bg-slate-100/70 focus:border-slate-800 focus:bg-white transition-all"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>

          {/* Export PDF Statement */}
          <button
              id="btn-export-pdf"
              onClick={handleExportPDF}
              className="shrink-0 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-all active:scale-95 shadow-2xs"
              title={tText("Gerar Extrato em PDF")}
          >
            <FileText className="w-4 h-4 text-slate-600" />
            {tText("Emitir Extrato PDF")}
          </button>

          {/* Quick trigger Add Transaction */}
          <button
              id="btn-open-add-transaction"
              onClick={startAddForm}
              className="shrink-0 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg px-4 py-2.5 text-xs font-semibold flex items-center gap-2 cursor-pointer transition-colors active:scale-95 shadow-xs"
          >
            <Plus className="w-4 h-4" />
            {tText("Lançar Transação")}
          </button>
        </div>
      </div>

      {/* Add Transaction Form Card */}
      {showAddForm && (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 relative animate-fadeIn shadow-xs">
          <div className="flex items-center justify-between border-b border-slate-150 pb-3 mb-5">
            <h3 className="font-bold text-slate-900 text-base">{tText("Novo Lançamento Financeiro")}</h3>
            <button
              id="btn-close-add-form"
              onClick={() => setShowAddForm(false)}
              className="text-slate-400 hover:text-slate-650 p-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <form onSubmit={handleFormSubmit} className="space-y-5">
            {/* Type selector */}
            <div>
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
                {tText("Tipo da Transação")}
              </label>
              <div className="flex gap-4">
                <button
                  id="form-type-expense"
                  type="button"
                  onClick={() => handleTypeToggle('expenses')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                    formType === 'expenses'
                      ? 'border-rose-450 bg-rose-50 text-rose-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowDownCircle className="w-4 h-4" />
                  {tText("Gasto / Despesa")}
                </button>
                <button
                  id="form-type-earning"
                  type="button"
                  onClick={() => handleTypeToggle('earnings')}
                  className={`flex-1 py-3 px-4 rounded-xl text-xs font-semibold border flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 ${
                    formType === 'earnings'
                      ? 'border-emerald-450 bg-emerald-50 text-emerald-700 font-bold'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <ArrowUpCircle className="w-4 h-4" />
                  {tText("Ganho / Receita")}
                </button>
              </div>
            </div>

            {/* Inputs grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
              {/* Description */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Descrição")}
                </label>
                <div id="wrapper-input-description" className="relative">
                  <input
                    id="input-desc"
                    type="text"
                    required
                    maxLength={100}
                    placeholder={tText("Ex: Almoço self-service, Freelance, Pix etc...")}
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all"
                  />
                  <FileText className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Amount */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Valor")} ({currency})
                </label>
                <div id="wrapper-input-amount" className="relative">
                  <input
                    id="input-amount"
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    placeholder={tText("Ex: 50.00")}
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all font-mono"
                  />
                  <DollarSign className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Category */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Categoria")}
                </label>
                <div id="wrapper-input-category" className="relative">
                  <select
                    id="select-category"
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {formType === 'earnings'
                      ? CATEGORIES_EARNINGS.map((cat) => (
                          <option key={cat} value={cat}>
                            {tText(cat)}
                          </option>
                        ))
                      : CATEGORIES_EXPENSES.map((cat) => (
                          <option key={cat} value={cat}>
                            {tText(cat)}
                          </option>
                        ))}
                  </select>
                  <Tag className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Data")}
                </label>
                <div id="wrapper-input-date" className="relative">
                  <input
                    id="input-date"
                    type="date"
                    required
                    value={formDate}
                    onChange={(e) => setFormDate(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all font-mono"
                  />
                  <Calendar className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                </div>
              </div>

              {/* Payment Method */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Método de Pagamento")}
                </label>
                <div id="wrapper-input-payment" className="relative">
                  <select
                    id="select-payment"
                    value={formPayment}
                    onChange={(e) => setFormPayment(e.target.value)}
                    className="w-full bg-gray-50 border border-gray-200 focus:border-blue-500 focus:bg-white text-xs rounded-xl pl-9 pr-3 py-2.5 text-gray-800 outline-none transition-all cursor-pointer appearance-none"
                  >
                    {PAYMENT_METHODS.map((method) => (
                      <option key={method} value={method}>
                        {tText(method)}                      </option>
                    ))}
                  </select>
                  <CreditCard className="w-4 h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                  {tText("Observações (Opcional)")}
                </label>
                <input
                  id="input-notes"
                  type="text"
                  placeholder={tText("Ex: Lanche da tarde no trabalho...")}
                  value={formNotes}
                  onChange={(e) => setFormNotes(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 focus:border-slate-800 focus:bg-white text-xs rounded-xl px-4 py-2.5 text-slate-800 outline-none transition-all"
                />
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                id="btn-form-cancel"
                type="button"
                onClick={() => setShowAddForm(false)}
                className="px-4 py-2 rounded-lg text-xs font-semibold text-slate-500 border border-slate-200 hover:bg-slate-50 cursor-pointer"
              >
                {tText("Cancelar")}
              </button>
              <button
                id="btn-form-save"
                type="submit"
                className="px-4 py-2 bg-[#0F172A] hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs cursor-pointer active:scale-95 transition-transform"
              >
                {tText("Salvar Transação")}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Transactions Table / List view */}
      <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-xs">
        <div className="px-6 py-4 border-b border-slate-155 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <h3 className="font-bold text-slate-900 text-sm">{tText("Histórico de Lançamentos")}</h3>
            
            {/* Active vs Trash Tab Toggle */}
            <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
              <button
                id="tab-sub-active"
                type="button"
                onClick={() => {
                  setActiveSubTab('active');
                  setDeletingId(null);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all ${
                  activeSubTab === 'active'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tText("Ativas")}
              </button>
              <button
                id="tab-sub-trash"
                type="button"
                onClick={() => {
                  setActiveSubTab('trash');
                  setDeletingTrashId(null);
                }}
                className={`px-3 py-1 rounded-md text-[11px] font-bold cursor-pointer transition-all flex items-center gap-1 ${
                  activeSubTab === 'trash'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {tText("Lixeira")}
                {trashItems.length > 0 && (
                  <span className="bg-rose-100 text-rose-600 text-[9px] px-1.5 py-0.2 rounded-full font-bold font-mono">
                    {trashItems.length}
                  </span>
                )}
              </button>
            </div>
          </div>

          <span className="text-xs font-medium text-slate-400 font-mono">
            {activeSubTab === 'active' ? (
              <>
                {tText("Mostrando")} {filteredList.length} {tText("de")} {transactions.length} {tText("registros")}
              </>
            ) : (
              <>
                {tText("Lixeira")}: {filteredTrashList.length} {tText("de")} {trashItems.length} {tText("registros")}
              </>
            )}
          </span>
        </div>

        {activeSubTab === 'active' && (
          filteredList.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
              <Tag className="w-10 h-10 text-slate-200 mb-3" />
              <p className="text-sm font-medium">{tText("Nenhuma transação encontrada")}</p>
              <p className="text-xs text-slate-400 mt-1">{tText("Refine seus filtros acima ou clique em \"Lançar Transação\" para começar.")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{tText("Lançamento / Categoria")}</th>
                    <th className="py-3.5 px-4">{tText("Método")}</th>
                    <th className="py-3.5 px-4">{tText("Data")}</th>
                    <th className="py-3.5 px-4 text-right">{tText("Valor")}</th>
                    <th className="py-3.5 px-6 text-center w-16">{tText("Ações")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <AnimatePresence initial={false}>
                    {filteredList.map((t) => (
                      <motion.tr
                        key={t.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, x: -15, transition: { duration: 0.15 } }}
                        transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                        className="hover:bg-slate-50/40 transition-colors"
                      >
                        <td className="py-4 px-6">
                          <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-xl shrink-0 ${
                              t.type === 'earnings' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-500'
                            }`}>
                              {t.type === 'earnings' ? (
                                <ArrowUpCircle className="w-4 h-4" />
                              ) : (
                                <ArrowDownCircle className="w-4 h-4" />
                              )}
                            </div>
                            <div className="min-w-0">
                              <p id={`trans-desc-${t.id}`} className="font-semibold text-gray-900 truncate">{t.description}</p>
                              <div className="flex items-center gap-1.5 mt-0.5">
                                <span className="text-[10px] font-medium text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                                  {tText(t.category)}
                                </span>
                                {t.notes && (
                                  <span className="text-[10px] text-gray-400 truncate max-w-[150px] italic">
                                    "{t.notes}"
                                  </span>
                                )}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-gray-600 font-medium whitespace-nowrap">
                          {tText(t.paymentMethod)}
                        </td>
                        <td className="py-4 px-4 text-gray-500 font-mono whitespace-nowrap">
                          {formatDate(t.date)}
                        </td>
                        <td className="py-4 px-4 text-right font-bold whitespace-nowrap">
                          <span className={t.type === 'earnings' ? 'text-emerald-600' : 'text-rose-600'}>
                            {t.type === 'earnings' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          {deletingId === t.id ? (
                            <div className="flex items-center justify-center gap-1.5 animate-fadeIn">
                              <button
                                id={`btn-confirm-delete-${t.id}`}
                                onClick={() => {
                                  onDeleteTransaction(t.id);
                                  setDeletingId(null);
                                }}
                                className="bg-rose-600 text-white text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                              >
                                {tText("Sim")}
                              </button>
                              <button
                                id={`btn-cancel-delete-${t.id}`}
                                onClick={() => setDeletingId(null)}
                                className="bg-slate-100 text-slate-600 text-[10px] font-bold px-2.5 py-1 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                              >
                                {tText("Não")}
                              </button>
                            </div>
                          ) : (
                            <button
                              id={`btn-delete-${t.id}`}
                              onClick={() => setDeletingId(t.id)}
                              className="text-gray-400 hover:text-rose-600 p-1.5 rounded-lg hover:bg-rose-50 hover:scale-110 active:scale-95 transition-all cursor-pointer outline-none focus:outline-none focus-visible:outline-none"
                              title={tText("Remover transação")}
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </td>
                      </motion.tr>
                    ))}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )
        )}

        {activeSubTab === 'trash' && (
          filteredTrashList.length === 0 ? (
            <div className="py-12 px-6 text-center text-slate-400 flex flex-col items-center justify-center">
              <Trash2 className="w-10 h-10 text-slate-200 mb-3 animate-pulse" />
              <p className="text-sm font-medium">{tText("A lixeira está vazia")}</p>
              <p className="text-xs text-slate-450 mt-1 max-w-sm">{tText("Os lançamentos excluídos ficam guardados por até 5 dias antes de serem apagados para sempre.")}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-150 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    <th className="py-3.5 px-6">{tText("Lançamento / Categoria")}</th>
                    <th className="py-3.5 px-4">{tText("Método")}</th>
                    <th className="py-3.5 px-4">{tText("Excluído em")}</th>
                    <th className="py-3.5 px-4 text-right">{tText("Valor")}</th>
                    <th className="py-3.5 px-6 text-center w-28">{tText("Ações")}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-xs">
                  <AnimatePresence initial={false}>
                    {filteredTrashList.map((item) => {
                      const t = item.transaction;
                      return (
                        <motion.tr
                          key={item.id}
                          initial={{ opacity: 0, y: 12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, x: -15, transition: { duration: 0.15 } }}
                          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
                          className="hover:bg-slate-50/40 transition-colors"
                        >
                          <td className="py-4 px-6">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 rounded-xl shrink-0 ${
                                t.type === 'earnings' ? 'bg-emerald-50/70 text-emerald-600/80' : 'bg-rose-50/70 text-rose-500/80'
                              }`}>
                                {t.type === 'earnings' ? (
                                  <ArrowUpCircle className="w-4 h-4" />
                                ) : (
                                  <ArrowDownCircle className="w-4 h-4" />
                                )}
                              </div>
                              <div className="min-w-0">
                                <p className="font-semibold text-gray-550 truncate line-through">{t.description}</p>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                  <span className="text-[10px] font-medium text-gray-400 bg-gray-100 px-2 py-0.5 rounded-md">
                                    {tText(t.category)}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-4 text-gray-400 font-medium whitespace-nowrap">
                            {tText(t.paymentMethod)} <span className="text-[10px] text-gray-450">({formatDate(t.date)})</span>
                          </td>
                          <td className="py-4 px-4 text-gray-500 font-mono whitespace-nowrap">
                            {formatDate(item.deletedAt)}
                          </td>
                          <td className="py-4 px-4 text-right font-bold whitespace-nowrap">
                            <span className={`${t.type === 'earnings' ? 'text-emerald-600/60' : 'text-rose-600/60'} line-through`}>
                              {t.type === 'earnings' ? '+' : '-'} {formatCurrency(t.amount, currency)}
                            </span>
                          </td>
                          <td className="py-4 px-6 text-center">
                            <div className="flex items-center justify-center gap-2">
                              {/* Restore button */}
                              <button
                                id={`btn-restore-${item.id}`}
                                onClick={() => onRestoreTransaction?.(item)}
                                className="text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer outline-none"
                                title={tText("Restaurar transação")}
                              >
                                <RotateCcw className="w-4 h-4" />
                              </button>

                              {/* Delete permanently button */}
                              {deletingTrashId === item.id ? (
                                <div className="flex items-center gap-1.5 animate-fadeIn">
                                  <button
                                    id={`btn-confirm-delete-perm-${item.id}`}
                                    onClick={() => {
                                      onDeletePermanently?.(item.id);
                                      setDeletingTrashId(null);
                                    }}
                                    className="bg-rose-600 text-white text-[9px] font-bold px-2 py-0.5 rounded-lg hover:bg-rose-700 transition-colors cursor-pointer"
                                  >
                                    {tText("Apagar")}
                                  </button>
                                  <button
                                    id={`btn-cancel-delete-perm-${item.id}`}
                                    onClick={() => setDeletingTrashId(null)}
                                    className="bg-slate-100 text-slate-600 text-[9px] font-bold px-2 py-0.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer"
                                  >
                                    {tText("Não")}
                                  </button>
                                </div>
                              ) : (
                                <button
                                  id={`btn-delete-perm-${item.id}`}
                                  onClick={() => setDeletingTrashId(item.id)}
                                  className="text-gray-400 hover:text-rose-600 hover:bg-rose-50 p-1.5 rounded-lg active:scale-95 transition-all cursor-pointer outline-none"
                                  title={tText("Excluir permanentemente")}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              )}
                            </div>
                          </td>
                        </motion.tr>
                      );
                    })}
                  </AnimatePresence>
                </tbody>
              </table>
            </div>
          )
        )}
      </div>
    </div>
  );
}
