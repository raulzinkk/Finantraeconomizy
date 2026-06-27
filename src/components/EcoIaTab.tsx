import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Send, 
  Bot, 
  User, 
  Check, 
  X, 
  Coins, 
  ArrowUpRight, 
  ArrowDownRight, 
  Calendar, 
  TrendingUp, 
  Compass, 
  HelpCircle, 
  MessageSquare,
  Building2,
  Trash2,
  ExternalLink
} from 'lucide-react';
import { useLanguage } from '../translations';
import { Transaction, MonthlyBill, Investment } from '../types';
import { formatCurrency } from '../utils';

interface EcoIaTabProps {
  onAddTransaction: (newT: Omit<Transaction, 'id' | 'profileId'>) => Promise<void> | void;
  onAddBill: (newB: Omit<MonthlyBill, 'id' | 'profileId'>) => Promise<void> | void;
  onAddInvestment: (newI: Omit<Investment, 'id' | 'profileId'>) => Promise<void> | void;
  transactions: Transaction[];
  monthlyBills: MonthlyBill[];
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onToggleBillStatus: (id: string, isPaid: boolean) => Promise<void> | void;
  currency: string;
}

interface Message {
  id: string;
  sender: 'user' | 'bot';
  text: string;
  timestamp: Date;
  status?: 'pending' | 'confirmed' | 'cancelled';
  // If the message contains a parsed transaction waiting for confirmation
  parsedData?: {
    type: 'earnings' | 'expenses' | 'bill' | 'investment' | 'delete_transaction' | 'pay_bill';
    payload: any;
  };
  // Educational buttons
  suggestions?: string[];
}

export default function EcoIaTab({
  onAddTransaction,
  onAddBill,
  onAddInvestment,
  transactions,
  monthlyBills,
  onDeleteTransaction,
  onToggleBillStatus,
  currency
}: EcoIaTabProps) {
  const { tText } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome messages
  useEffect(() => {
    const savedMessages = localStorage.getItem('fin_eco_ia_chat');
    if (savedMessages) {
      try {
        const parsed = JSON.parse(savedMessages);
        setMessages(parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        })));
        return;
      } catch (e) {
        // Fallback to defaults
      }
    }

    setMessages([
      {
        id: 'welcome_1',
        sender: 'bot',
        text: 'Olá! Eu sou a **ECO IA FINANTRA**, sua assistente de inteligência financeira pessoal. 🤖💚',
        timestamp: new Date()
      },
      {
        id: 'welcome_2',
        sender: 'bot',
        text: 'Estou aqui para ajudar você a gerenciar suas finanças com rapidez e praticidade através da sua digitação. Você pode registrar qualquer ganho, gasto, conta ou investimento apenas me dizendo o que fez!\n\nTente algo como:\n- 🟢 *"Recebi 3500 de salário hoje"* (Ganho)\n- 🔴 *"Gastei 45 reais com Uber"* (Gasto)\n- 📅 *"Conta de internet de 119 vencendo dia 10"* (Conta Mensal)\n- 📈 *"Investi 1500 no Tesouro Direto pela XP"* (Investimento)',
        timestamp: new Date(),
        suggestions: [
          'Me dê uma dica financeira 💡',
          'Blog do Finantra Economizy 📰',
          'Recebi R$ 1.200 de freelancer',
          'Comprei mercado por R$ 350,00',
          'Aluguel de R$ 1.500 vencendo dia 05',
          'Como funciona a taxa Selic?'
        ]
      }
    ]);
  }, []);

  // Save chat to local storage
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fin_eco_ia_chat', JSON.stringify(messages));
    }
  }, [messages]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const clearChat = () => {
    if (window.confirm(tText("Deseja mesmo limpar todo o histórico de conversas com a ECO IA FINANTRA?"))) {
      setMessages([
        {
          id: 'welcome_restart',
          sender: 'bot',
          text: 'Conversa reiniciada. Como posso ajudar com suas finanças hoje? 📊🚀',
          timestamp: new Date()
        }
      ]);
      localStorage.removeItem('fin_eco_ia_chat');
    }
  };

  // Helper to parse numbers in text (e.g. 150,00 -> 150; R$ 3.500,00 -> 3500)
  const extractAmount = (text: string): number | null => {
    // Regex matches patterns like: 150, 150.00, 150,00, 3.500, 3.500,00, R$ 25,50
    const cleanText = text.replace(/R\$\s*/gi, '').replace(/\$\s*/g, '');
    const numberPattern = /\b\d+(?:[\.,]\d+)?\b/g;
    const matches = cleanText.match(numberPattern);
    
    if (!matches) return null;

    // Look for numbers that represent values (ignoring dates like 05, 10, 2026)
    for (const match of matches) {
      // If it looks like a day of the month inside a date string, skip it
      const index = text.indexOf(match);
      const isPartofDate = /vencendo\s+dia\s+\d+|dia\s+\d+/i.test(text.substring(Math.max(0, index - 15), Math.min(text.length, index + 15)));
      
      let valStr = match.replace(/\./g, ''); // remove thousands dot
      valStr = valStr.replace(',', '.'); // convert decimal comma to dot
      const val = parseFloat(valStr);
      
      if (!isNaN(val) && val > 0) {
        // If it's a small single/double digit number, double-check if it's meant as a day of month or an amount
        if (val < 32 && isPartofDate) {
          continue; // Probably a due date day, keep searching for actual monetary amount
        }
        return val;
      }
    }

    // Fallback: take first valid float
    const firstMatch = matches[0].replace(/\./g, '').replace(',', '.');
    const val = parseFloat(firstMatch);
    return isNaN(val) ? null : val;
  };

  // Helper to extract due day of month (1-31)
  const extractDueDay = (text: string): number => {
    const dayMatch = text.match(/(?:dia|vencendo|vencimento|vence|pago|venc)\s+(\d+)\b/i);
    if (dayMatch) {
      const day = parseInt(dayMatch[1], 10);
      if (day >= 1 && day <= 31) return day;
    }
    // Also try checking any isolated 1-2 digit number between 1 and 31
    const numbers = text.match(/\b\d{1,2}\b/g);
    if (numbers) {
      for (const num of numbers) {
        const d = parseInt(num, 10);
        if (d >= 1 && d <= 31) return d;
      }
    }
    return 10; // default to 10th of month
  };

  // AI/Regex parsing engine
  const parseUserIntent = (text: string) => {
    const lowerText = text.toLowerCase().trim();
    const amount = extractAmount(text);

    // A. DELETE/REMOVE INTENT
    const isDelete = 
      lowerText.includes('apagar') || 
      lowerText.includes('excluir') || 
      lowerText.includes('deletar') || 
      lowerText.includes('remover') || 
      lowerText.includes('tira') || 
      lowerText.includes('tire') || 
      lowerText.includes('delete') || 
      lowerText.includes('exclua');

    if (isDelete) {
      let searchTerms = lowerText
        .replace(/apagar|excluir|deletar|remover|tira|tire|delete|exclua/g, '')
        .replace(/gasto|gastos|ganho|ganhos|receita|receitas|despesa|despesas/g, '')
        .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
        .replace(/\b\d+([\.,]\d+)?\b/g, '')
        .replace(/[,.-]/g, '')
        .trim();

      let candidates = transactions.map(t => {
        let score = 0;
        if (amount !== null && Math.abs(t.amount - amount) < 0.01) {
          score += 60;
        }
        if (searchTerms) {
          const descLower = t.description.toLowerCase();
          if (descLower.includes(searchTerms)) {
            score += 30;
          }
          if (searchTerms.includes(descLower)) {
            score += 20;
          }
        }
        return { transaction: t, score };
      }).filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

      if (candidates.length > 0) {
        return {
          type: 'delete_transaction',
          data: candidates[0].transaction,
          allMatches: candidates.map(c => c.transaction)
        };
      } else {
        return {
          type: 'delete_no_match',
          text: searchTerms || (amount ? `no valor de ${amount}` : '')
        };
      }
    }

    // B. CONFIRM BILL PAID INTENT
    const isPayBill = 
      lowerText.includes('paguei') || 
      lowerText.includes('pagar') || 
      lowerText.includes('quitar') || 
      lowerText.includes('marcar como paga') || 
      lowerText.includes('marca como paga') || 
      lowerText.includes('paga') || 
      lowerText.includes('pago') || 
      lowerText.includes('quitei') || 
      lowerText.includes('quita') || 
      lowerText.includes('liquidar') || 
      lowerText.includes('liquidei');

    if (isPayBill) {
      let billSearchTerms = lowerText
        .replace(/paguei|pagar|quitar|marcar como paga|marca como paga|paga|pago|quitei|quita|liquidar|liquidei/g, '')
        .replace(/conta|conta de|fatura|fatura de|boleto|boleto de|mensalidade/g, '')
        .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
        .replace(/\b\d+([\.,]\d+)?\b/g, '')
        .replace(/[,.-]/g, '')
        .trim();

      let billCandidates = monthlyBills.map(b => {
        let score = 0;
        // Prefer unpaid bills
        if (!b.isPaid) {
          score += 10;
        }
        if (amount !== null && Math.abs(b.amount - amount) < 0.01) {
          score += 60;
        }
        if (billSearchTerms) {
          const descLower = b.description.toLowerCase();
          if (descLower.includes(billSearchTerms)) {
            score += 30;
          }
          if (billSearchTerms.includes(descLower)) {
            score += 20;
          }
        }
        return { bill: b, score };
      }).filter(c => c.score > 10) // needs some textual or value match
        .sort((a, b) => b.score - a.score);

      if (billCandidates.length > 0) {
        return {
          type: 'pay_bill',
          data: billCandidates[0].bill,
          allMatches: billCandidates.map(c => c.bill)
        };
      }
    }

    // 1. HELP / EDUCATION INTENT
    if (
      lowerText.includes('como funciona') || 
      lowerText.includes('o que é') || 
      lowerText.includes('ajuda') || 
      lowerText.includes('dica') || 
      lowerText.includes('dicas') || 
      lowerText.includes('recomenda') || 
      lowerText.includes('explic') ||
      lowerText.includes('selic') ||
      lowerText.includes('cdi') ||
      lowerText.includes('tesouro') ||
      lowerText.includes('ações') ||
      lowerText.includes('fii') ||
      lowerText.includes('fundo') ||
      lowerText.includes('blog') ||
      lowerText.includes('substack') ||
      lowerText.includes('economizy') ||
      lowerText.includes('finantra') ||
      lowerText.includes('poupar') ||
      lowerText.includes('economizar') ||
      lowerText.includes('conselho') ||
      lowerText.includes('conselhos')
    ) {
      return { type: 'help', text };
    }

    if (!amount) {
      return { type: 'unknown', text };
    }

    // 2. INVESTMENTS INTENT
    if (
      lowerText.includes('investi') || 
      lowerText.includes('investimento') || 
      lowerText.includes('aporte') || 
      lowerText.includes('ações') || 
      lowerText.includes('fii') || 
      lowerText.includes('cdb') || 
      lowerText.includes('renda fixa') || 
      lowerText.includes('tesouro') || 
      lowerText.includes('cripto') ||
      lowerText.includes('poupança')
    ) {
      // Determine type
      let type: 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Cripto' | 'Outros' = 'Outros';
      if (lowerText.includes('cdb') || lowerText.includes('renda fixa') || lowerText.includes('tesouro') || lowerText.includes('poupança')) {
        type = 'Renda Fixa';
      } else if (lowerText.includes('ação') || lowerText.includes('ações') || lowerText.includes('b3') || lowerText.includes('bolsa')) {
        type = 'Ações';
      } else if (lowerText.includes('fii') || lowerText.includes('fundos imobiliários') || lowerText.includes('fundo imobiliário')) {
        type = 'Fundos Imobiliários';
      } else if (lowerText.includes('cripto') || lowerText.includes('bitcoin') || lowerText.includes('ethereum') || lowerText.includes('solana')) {
        type = 'Cripto';
      }

      // Determine broker
      let broker = 'Geral';
      if (lowerText.includes('xp')) broker = 'XP Investimentos';
      else if (lowerText.includes('nubank') || lowerText.includes('nuinvest') || lowerText.includes('nu ')) broker = 'NuInvest';
      else if (lowerText.includes('inter')) broker = 'Banco Inter';
      else if (lowerText.includes('rico')) broker = 'Rico';
      else if (lowerText.includes('avenue')) broker = 'Avenue';
      else if (lowerText.includes('btg')) broker = 'BTG Pactual';

      // Clean description
      let name = text
        .replace(/investi|investimento|aporte/gi, '')
        .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
        .replace(/\b\d+([\.,]\d+)?\b/g, '')
        .replace(/na\s+xp|no\s+nubank|no\s+inter|pela\s+xp/gi, '')
        .replace(/[,.-]/g, '')
        .trim();

      if (!name) name = `${type} - Alocação`;
      name = name.charAt(0).toUpperCase() + name.slice(1);

      return {
        type: 'investment',
        data: {
          name,
          type,
          amountInvested: amount,
          currentAmount: amount,
          broker,
          acquisitionDate: new Date().toISOString().split('T')[0],
          yieldRate: 11.5 // Default average yield estimate
        }
      };
    }

    // 3. MONTHLY BILLS INTENT
    if (
      lowerText.includes('conta de') || 
      lowerText.includes('fatura') || 
      lowerText.includes('boleto') || 
      lowerText.includes('aluguel') || 
      lowerText.includes('vencendo') || 
      lowerText.includes('vencimento') || 
      lowerText.includes('mensal') ||
      lowerText.includes('assino') ||
      lowerText.includes('assinatura')
    ) {
      const dueDay = extractDueDay(lowerText);
      const today = new Date();
      // Format as YYYY-MM-DD using the parsed day
      const dueMonth = today.getDate() > dueDay ? today.getMonth() + 2 : today.getMonth() + 1; // next month if already passed
      const dueYear = today.getFullYear();
      const formattedMonth = dueMonth > 12 ? '01' : String(dueMonth).padStart(2, '0');
      const formattedYear = dueMonth > 12 ? dueYear + 1 : dueYear;
      const dueDate = `${formattedYear}-${formattedMonth}-${String(dueDay).padStart(2, '0')}`;

      // Determine category
      let category = 'Moradia';
      if (lowerText.includes('internet') || lowerText.includes('wifi') || lowerText.includes('netflix') || lowerText.includes('spotify') || lowerText.includes('streaming')) {
        category = 'Serviços';
      } else if (lowerText.includes('luz') || lowerText.includes('energia') || lowerText.includes('enel') || lowerText.includes('água') || lowerText.includes('sabesp') || lowerText.includes('gas') || lowerText.includes('gás')) {
        category = 'Contas Básicas';
      } else if (lowerText.includes('saude') || lowerText.includes('saúde') || lowerText.includes('convenio') || lowerText.includes('plano')) {
        category = 'Saúde';
      }

      // Clean description
      let description = text
        .replace(/conta de|fatura de|boleto de|mensalidade de/gi, '')
        .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
        .replace(/\b\d+([\.,]\d+)?\b/g, '')
        .replace(/vencendo\s+dia\s+\d+|dia\s+\d+|vencimento\s+dia\s+\d+/gi, '')
        .replace(/[,.-]/g, '')
        .trim();

      if (!description) description = 'Fatura Mensal';
      description = description.charAt(0).toUpperCase() + description.slice(1);

      return {
        type: 'bill',
        data: {
          description,
          amount,
          dueDate,
          category,
          isPaid: false
        }
      };
    }

    // 4. TRANSACTIONS INTENT (Earnings or Expenses)
    const isEarning = 
      lowerText.includes('ganho') || 
      lowerText.includes('ganhei') || 
      lowerText.includes('recebi') || 
      lowerText.includes('salario') || 
      lowerText.includes('salário') || 
      lowerText.includes('freelancer') || 
      lowerText.includes('pix de') ||
      lowerText.includes('vendi') ||
      lowerText.includes('faturamento') ||
      lowerText.includes('rendimento');

    // Category determination
    let category = isEarning ? 'Salário' : 'Outros';
    if (!isEarning) {
      if (lowerText.includes('mercado') || lowerText.includes('comida') || lowerText.includes('restaurante') || lowerText.includes('jantar') || lowerText.includes('almoço') || lowerText.includes('lanche')) {
        category = 'Alimentação';
      } else if (lowerText.includes('uber') || lowerText.includes('combustivel') || lowerText.includes('gasolina') || lowerText.includes('transporte') || lowerText.includes('onibus') || lowerText.includes('ônibus') || lowerText.includes('estacionamento')) {
        category = 'Transporte';
      } else if (lowerText.includes('cinema') || lowerText.includes('jogo') || lowerText.includes('lazer') || lowerText.includes('cerveja') || lowerText.includes('festa')) {
        category = 'Lazer';
      } else if (lowerText.includes('roupa') || lowerText.includes('shopping') || lowerText.includes('compra') || lowerText.includes('tenis') || lowerText.includes('tênis')) {
        category = 'Compras';
      }
    } else {
      if (lowerText.includes('freelancer') || lowerText.includes('extra') || lowerText.includes('bico') || lowerText.includes('venda')) {
        category = 'Renda Extra';
      } else if (lowerText.includes('investimento') || lowerText.includes('dividendo') || lowerText.includes('juros')) {
        category = 'Rendimentos';
      }
    }

    // Clean description
    let description = text
      .replace(/ganhei|recebi|gastei|comprei|paguei|pagamento de|adicionar ganho|gasto de|ganho de/gi, '')
      .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
      .replace(/\b\d+([\.,]\d+)?\b/g, '')
      .replace(/[,.-]/g, '')
      .trim();

    if (!description) description = isEarning ? 'Ganho Informado' : 'Gasto Informado';
    description = description.charAt(0).toUpperCase() + description.slice(1);

    return {
      type: isEarning ? 'earnings' : 'expenses',
      data: {
        type: isEarning ? 'earnings' : 'expenses',
        description,
        amount,
        category,
        date: new Date().toISOString().split('T')[0],
        paymentMethod: isEarning ? 'Pix' : 'Cartão de Crédito'
      }
    };
  };

  const handleSend = async (textToSend?: string) => {
    const query = textToSend || input;
    if (!query.trim()) return;

    if (!textToSend) {
      setInput('');
    }

    // Append user message
    const userMsgId = `u_${Date.now()}`;
    const userMsg: Message = {
      id: userMsgId,
      sender: 'user',
      text: query,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setIsTyping(true);

    // Simulate AI thinking
    setTimeout(() => {
      const intent = parseUserIntent(query);
      const botMsgId = `b_${Date.now()}`;
      let botMsg: Message;

      if (intent.type === 'help') {
        const responseText = getEducationalResponse(query);
        botMsg = {
          id: botMsgId,
          sender: 'bot',
          text: responseText,
          timestamp: new Date(),
          suggestions: [
            'Me dê uma dica financeira 💡',
            'Blog do Finantra Economizy 📰',
            'Como funciona a taxa Selic?',
            'O que é o CDI?'
          ]
        };
      } else if (intent.type === 'delete_no_match') {
        botMsg = {
          id: botMsgId,
          sender: 'bot',
          text: `Não encontrei nenhuma transação (ganho ou gasto) correspondente a **"${intent.text}"** para apagar. Por favor, certifique-se de informar o valor ou o nome correto do lançamento que deseja excluir!`,
          timestamp: new Date()
        };
      } else if (intent.type === 'unknown') {
        botMsg = {
          id: botMsgId,
          sender: 'bot',
          text: 'Entendi que você enviou uma mensagem, mas não consegui identificar um valor monetário para realizar um registro automático, ou a pergunta está fora do meu escopo financeiro.\n\nExperimente falar algo como: *"Gastei R$ 120 com supermercado"* ou pergunte *"Me dê uma dica financeira"* para receber insights educacionais e recomendações do nosso blog!',
          timestamp: new Date(),
          suggestions: [
            'Me dê uma dica financeira 💡',
            'Blog do Finantra Economizy 📰',
            'O que é a taxa Selic?',
            'Como funciona o Tesouro Selic?'
          ]
        };
      } else {
        // We have a parsed financial data structure!
        let summaryText = '';
        const payload = intent.data as any;
        if (intent.type === 'earnings') {
          summaryText = `Identifiquei um **GANHO** de **${formatCurrency(payload.amount, currency)}** para registro em **${payload.description}**.\n\nPor favor, confirme os detalhes abaixo para adicionar à sua planilha:`;
        } else if (intent.type === 'expenses') {
          summaryText = `Identifiquei um **GASTO** de **${formatCurrency(payload.amount, currency)}** para registro em **${payload.description}**.\n\nPor favor, confirme os detalhes abaixo para adicionar à sua planilha:`;
        } else if (intent.type === 'bill') {
          summaryText = `Identifiquei uma **CONTA MENSAL** de **${formatCurrency(payload.amount, currency)}** vencendo dia **${payload.dueDate?.split('-')[2]}**.\n\nPor favor, confirme os detalhes abaixo para agendar em suas Contas Mensais:`;
        } else if (intent.type === 'investment') {
          summaryText = `Identifiquei um **INVESTIMENTO** de **${formatCurrency(payload.amountInvested, currency)}** em **${payload.name}** pela instituição **${payload.broker}**.\n\nDeseja salvar essa alocação na sua carteira?`;
        } else if (intent.type === 'delete_transaction') {
          const isEarning = payload.type === 'earnings';
          summaryText = `Identifiquei que você deseja **APAGAR** o seguinte lançamento de **${isEarning ? 'GANHO' : 'GASTO'}**:\n\n**${payload.description}** no valor de **${formatCurrency(payload.amount, currency)}** de **${payload.date?.split('-').reverse().join('/')}**.\n\nDeseja confirmar a exclusão definitiva?`;
        } else if (intent.type === 'pay_bill') {
          summaryText = `Identifiquei que você deseja marcar a seguinte **CONTA MENSAL** como **PAGA**:\n\n**${payload.description}** no valor de **${formatCurrency(payload.amount, currency)}**.\n\nDeseja confirmar que este boleto foi pago?`;
        }

        botMsg = {
          id: botMsgId,
          sender: 'bot',
          text: summaryText,
          timestamp: new Date(),
          status: 'pending',
          parsedData: {
            type: intent.type as any,
            payload: intent.data
          }
        };
      }

      setMessages(prev => [...prev, botMsg]);
      setIsTyping(false);
    }, 1000);
  };

  const confirmParsedData = async (msgId: string, type: string, payload: any) => {
    try {
      if (type === 'earnings' || type === 'expenses') {
        await onAddTransaction(payload);
      } else if (type === 'bill') {
        await onAddBill(payload);
      } else if (type === 'investment') {
        await onAddInvestment(payload);
      } else if (type === 'delete_transaction') {
        await onDeleteTransaction(payload.id);
      } else if (type === 'pay_bill') {
        await onToggleBillStatus(payload.id, true);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          let customText = `✅ **Confirmado e Registrado!**\n\nLancei com sucesso o registro no seu painel principal de finanças. Seus saldos e projeções já foram sincronizados localmente e na nuvem.`;
          if (type === 'delete_transaction') {
            customText = `✅ **Registro Apagado!**\n\nO lançamento foi excluído definitivamente do seu painel de transações e do banco de dados. Seus saldos foram atualizados.`;
          } else if (type === 'pay_bill') {
            customText = `✅ **Conta Mensal Paga!**\n\nA conta foi liquidada com sucesso no seu gerenciador de contas e faturas.`;
          }
          return {
            ...m,
            status: 'confirmed',
            text: customText
          };
        }
        return m;
      }));
    } catch (err: any) {
      alert(`Erro ao registrar: ${err?.message || 'Erro inesperado'}`);
    }
  };

    const cancelParsedData = (msgId: string) => {
    setMessages(prev => prev.map(m => {
      if (m.id === msgId) {
        let customText = `❌ **Registro Cancelado**\n\nNenhuma alteração foi efetuada nas suas planilhas de transações ou investimentos.`;
        if (m.parsedData?.type === 'delete_transaction') {
          customText = `❌ **Exclusão Cancelada**\n\nO lançamento permanece intacto nas suas planilhas de transações.`;
        } else if (m.parsedData?.type === 'pay_bill') {
          customText = `❌ **Pagamento Cancelado**\n\nA conta mensal continua com status pendente.`;
        }
        return {
          ...m,
          status: 'cancelled',
          text: customText
        };
      }
      return m;
    }));
  };

  // Educational financial guide content library
  const getEducationalResponse = (query: string): string => {
    const q = query.toLowerCase();

    const financialTips = [
      {
        title: "Pague-se Primeiro (Princípio do Sucesso)",
        text: "Quando seu salário cair na conta, separe imediatamente de 10% a 20% para os seus investimentos ou reserva de emergência **antes** de começar a pagar as contas ou fazer despesas discricionárias. Se você só investir o que sobra no final do mês, a resposta quase sempre será zero! Mude a ordem do fluxo financeiro: Receita - Investimento = Gastos."
      },
      {
        title: "Construa sua Reserva de Emergência",
        text: "A reserva de emergência serve para cobrir imprevistos como perda de renda, problemas de saúde ou consertos emergenciais. O ideal é acumular o equivalente a **3 a 6 meses** de seus custos mensais essenciais se você for CLT, ou de **6 a 12 meses** se for autônomo/empreendedor. Guarde esse dinheiro em locais de liquidez diária e alta segurança, como o **Tesouro Selic** ou um **CDB de 100% do CDI**."
      },
      {
        title: "A Regra das 24 Horas para Evitar Compras por Impulso",
        text: "Antes de comprar qualquer item que não seja uma necessidade imediata (roupas, eletrônicos, cosméticos), force-se a esperar **24 horas**. Esse tempo de resfriamento ajuda a afastar a urgência gerada pela dopamina do marketing e faz você pensar racionalmente se realmente precisa e pode pagar pelo produto. Em mais de 60% dos casos, você desistirá da compra ou esquecerá dela!"
      },
      {
        title: "Mapeie e Elimine os 'Gastos Invisíveis'",
        text: "Pequenos gastos recorrentes de baixo valor são os maiores ladrões de orçamento, pois passam despercebidos. Revise periodicamente sua fatura do cartão de crédito e cancele assinaturas de streaming que você não assiste há meses, aplicativos com renovação automática não utilizados, planos de celular desatualizados ou taxas de manutenção de contas correntes (solicite o pacote essencial gratuito exigido pelo Banco Central)."
      },
      {
        title: "Evite o Perigo do Parcelamento no Cartão",
        text: "Parcelar compras sem juros parece vantajoso, mas acumular dezenas de parcelas pequenas cria um comprometimento gigante da sua renda futura, limitando sua flexibilidade financeira. Use a regra de ouro: se você não tem o dinheiro para pagar à vista, provavelmente não deveria estar comprando. Guarde o dinheiro primeiro e compre à vista (muitas vezes garantindo descontos excelentes!)."
      },
      {
        title: "Defina Metas Financeiras Claras (SMART)",
        text: "Poupar dinheiro por poupar é difícil. Você precisa dar um nome e um prazo para o seu dinheiro. Crie objetivos específicos:\n- **Curto Prazo (até 1 ano):** Férias de R$ 4.000 em dezembro.\n- **Médio Prazo (1 a 5 anos):** Entrada do apartamento de R$ 30.000 em 3 anos.\n- **Longo Prazo (mais de 5 anos):** Independência financeira e aposentadoria precoce.\nIsso gera motivação e foco na hora de resistir às compras impulsivas."
      },
      {
        title: "Cuidado com o 'Estilo de Vida Inflacionado'",
        text: "Muitas pessoas aumentam seus gastos na mesma velocidade ou mais rápido do que seus ganhos (comprando carros melhores, mudando para aluguéis mais caros assim que ganham um aumento). Isso é a 'corrida dos ratos'. Quando receber uma promoção ou bônus, mantenha seu padrão de vida por alguns meses e direcione o ganho extra diretamente para aumentar seus investimentos e acelerar sua independência financeira."
      },
      {
        title: "Diversificação é o Único Almoço Grátis no Mercado",
        text: "Nunca coloque todo o seu dinheiro em um único ativo, corretora ou modalidade de investimento. Monte uma carteira balanceada contendo Renda Fixa (para liquidez e segurança), Fundos Imobiliários (para gerar renda passiva mensal isenta de IR) e Ações de empresas sólidas e perenes (para valorização de longo prazo). Isso protege seu patrimônio contra crises setoriais."
      }
    ];

    if (q.includes('blog') || q.includes('substack') || q.includes('economizy') || q.includes('finantra')) {
      return `### 📰 Blog Finantra Economizy 🚀💚\n\nO **Blog do Finantra Economizy** é o canal oficial de educação e insights financeiros para quem quer aprender a dominar o dinheiro, poupar de verdade e começar a investir de maneira inteligente e descomplicada!\n\nLá você encontra conteúdos exclusivos sobre:\n- 💡 Estratégias práticas de economia diária e corte de gastos inteligentes\n- 📊 Análises simples sobre investimentos (Renda Fixa, Selic, FIIs e Ações)\n- 🧠 Mentalidade financeira e como construir patrimônio sustentável no longo prazo\n- 🚀 Tutoriais e guias de organização pessoal para acelerar sua independência financeira\n\n**Acesse agora mesmo pelo link oficial e inscreva-se para receber novos artigos no seu e-mail:**\n👉 https://substack.com/@finantraeconomizy`;
    }

    if (q.includes('dica') || q.includes('poupar') || q.includes('economizar') || q.includes('conselho') || q.includes('conselhos')) {
      // Pick a random tip or use time-based selection to be consistent but diverse
      const seed = new Date().getMinutes() + new Date().getSeconds();
      const randomIndex = seed % financialTips.length;
      const tip = financialTips[randomIndex];
      
      return `### 💡 Dica Financeira Finantra: ${tip.title} 🌟\n\n${tip.text}\n\n---\n\n📰 **Quer expandir seus conhecimentos?**\nPara dezenas de outros insights fantásticos sobre economia e investimentos, visite e inscreva-se no **Blog do Finantra Economizy**:\n👉 https://substack.com/@finantraeconomizy 🚀💚`;
    }
    
    if (q.includes('selic')) {
      return `### 💡 Guia de Investimento: Taxa Selic 📈\n\nA **Taxa Selic** é a taxa básica de juros da economia brasileira, definida a cada 45 dias pelo Banco Central (COPOM).\n\n**Como ela afeta seus investimentos?**\n- **Renda Fixa:** Quando a Selic sobe, os rendimentos de títulos de Renda Fixa (como Tesouro Selic, CDBs, LCI e LCA) sobem, tornando-os muito atraentes.\n- **Ações e FIIs:** Geralmente, quando a Selic está alta, o investimento em Bolsa de Valores recua, pois os investidores preferem a segurança da renda fixa pagando juros altos.\n- **Poupança:** Se a Selic estiver acima de 8,5% ao ano, a poupança rende 0,5% ao mês + Taxa Referencial (TR). Se estiver igual ou abaixo de 8,5%, rende exatamente 70% da Selic.\n\n**Recomendação de Ouro:** O **Tesouro Selic** é considerado o investimento mais seguro do país, perfeito para sua **Reserva de Emergência**, pois possui liquidez diária (D+0) e rentabilidade diária garantida.\n\n---\n\n📰 **Quer saber mais sobre investimentos?** Acesse nosso portal com guias exclusivos no **Blog do Finantra Economizy**: https://substack.com/@finantraeconomizy 🚀💚`;
    }
    
    if (q.includes('cdi')) {
      return `### 📊 O que é o CDI? Entenda Fácil! 💸\n\nO **CDI (Certificado de Depósito Interbancário)** é uma taxa que reflete o custo dos empréstimos de curto prazo que os bancos fazem entre si para fechar o dia com saldo positivo.\n\n**O CDI acompanha a Selic:**\nNormalmente, a taxa do CDI anda colada na Selic (cerca de 0,10 ponto percentual abaixo da taxa básica).\n\n**Onde o CDI é usado?**\nEle serve como o principal termômetro ("benchmark") para a rentabilidade dos títulos de renda fixa privada:\n- **CDB (Certificado de Depósito Bancário):** Um CDB que paga **100% do CDI** é ótimo, pois rende exatamente o rendimento do mercado sem risco. Evite CDBs de grandes bancos tradicionais que pagam menos de 90% do CDI.\n- **LCI/LCA:** São isentos de Imposto de Renda. Portanto, uma LCI que pague **90% do CDI** pode render o equivalente a um CDB de **108% do CDI** com imposto de renda descontado!\n\n**Dica:** Sempre prefira investimentos de liquidez diária que rendam pelo menos **100% do CDI** para guardar sua reserva de curto prazo.\n\n---\n\n📰 **Leia análises de renda fixa atualizadas no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`;
    }

    if (q.includes('fii') || q.includes('fundo') || q.includes('imobiliário')) {
      return `### 🏢 Fundos Imobiliários (FIIs): Aluguéis sem Burocracia 🏘️\n\nOs **Fundos Imobiliários (FIIs)** reúnem recursos de milhares de investidores para aplicar em grandes empreendimentos imobiliários, como prédios corporativos de alto padrão, shopping centers, galpões logísticos ou títulos de crédito imobiliário (LCI, CRI).\n\n**Vantagens dos FIIs:**\n1. **Renda Passiva Mensal:** Praticamente todos os FIIs distribuem lucros mensais na sua conta de corretora, simulando um aluguel de imóvel.\n2. **Isenção de IR:** Os dividendos distribuídos a pessoas físicas são atualmente isentos de Imposto de Renda!\n3. **Baixo Custo de Entrada:** Com apenas R$ 10 ou R$ 100 você já adquire uma cota de grandes fundos e começa a receber rendimentos.\n4. **Alta Liquidez:** Diferente de um imóvel físico que demora meses para vender, as cotas de FIIs são vendidas em segundos na Bolsa de Valores (Home Broker).\n\n**Categorias de FIIs:**\n- **FIIs de Tijolo:** Investem em imóveis físicos reais (galpões, escritórios, shoppings). Ótimos para ganho de capital de longo prazo.\n- **FIIs de Papel:** Investem em títulos de dívida imobiliária (CRIs). Geralmente oferecem dividendos mais altos de forma imediata.\n- **FIIs de Fundos (FOFs):** Fundos que compram cotas de outros fundos. Excelentes para iniciantes diversificarem facilmente.\n\n---\n\n📰 **Quer construir uma carteira de FIIs vencedora?** Confira as dicas exclusivas no **Blog do Finantra Economizy**: https://substack.com/@finantraeconomizy 🚀💚`;
    }

    if (q.includes('ações') || q.includes('bolsa') || q.includes('renda variável')) {
      return `### 📈 Investindo em Ações na Bolsa de Valores 🚀\n\nUma **Ação** representa a menor fração do capital social de uma empresa. Ao comprar uma ação, você se torna **sócio(a)** daquela empresa e passa a participar de seus lucros e crescimento.\n\n**Como você ganha dinheiro com ações?**\n1. **Valorização da Cota:** Se a empresa cresce e melhora seus resultados, as ações tendem a subir de preço na B3 (Bolsa de Valores).\n2. **Proventos (Dividendos e JCP):** Parte do lucro líquido das empresas de capital aberto é obrigatoriamente distribuído aos acionistas.\n\n**Conselhos Cruciais para Iniciantes:**\n- **Foco no Longo Prazo:** Não compre ações para vender amanhã (Day Trade é altamente arriscado). Invista em empresas sólidas visando de 5 a 10 anos.\n- **Diversificação:** Nunca coloque todo o seu capital em uma única empresa. Divida entre setores perenes (Bancos, Energia Elétrica, Saneamento, Telecomunicações).\n- **Reserva de Emergência Primeiro:** Nunca invista na bolsa de valores dinheiro que você possa precisar no curto prazo (menos de 2 anos), pois as oscilações do mercado são diárias.\n\n---\n\n📰 **Aprenda a analisar ações de modo fácil no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`;
    }

    return `### 💡 Guia de Saúde Financeira Finantra 🌟\n\nPara ter uma vida financeira saudável, siga estes três pilares essenciais de organização:\n\n1. **Primeiro Passo (Reserva de Emergência):** Guarde o equivalente a **6 meses** das suas despesas fixas em um investimento seguro e de resgate rápido, como o **Tesouro Selic** ou um **CDB de 100% do CDI** com liquidez diária.\n\n2. **Segundo Passo (Planejamento 50/30/20):**\n   - **50%** de sua renda líquida para gastos essenciais (aluguel, contas básicas, comida, transporte).\n   - **30%** para desejos pessoais e estilo de vida (lazer, compras, passeios, hobbies).\n   - **20%** diretamente para investir pensando no futuro.\n\n3. **Terceiro Passo (Consistência):** Monitore seus saldos ativamente. Sempre registre seus gastos no painel de transações e use nossa aba de **Contas Mensais** para nunca mais esquecer um boleto ou pagar juros por atraso!\n\n**O que mais você gostaria de entender sobre investimentos hoje?** Tente me perguntar sobre: **Taxa Selic**, **CDI**, **CDB**, **Fundos Imobiliários (FIIs)**, **Ações** ou peça uma **Dica Financeira**!\n\n---\n\n📰 **Acompanhe dicas e análises detalhadas no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`;
  };

  return (
    <div className="bg-slate-50 border border-slate-200 rounded-3xl overflow-hidden flex flex-col h-[650px] shadow-sm relative">
      
      {/* Tab Header with Robot branding */}
      <div className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-3xs shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-600 flex items-center justify-center text-white shadow-xs">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-slate-900 tracking-tight text-sm">ECO IA FINANTRA</span>
              <span className="bg-indigo-50 text-indigo-700 text-[10px] font-extrabold px-1.5 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5">
                <Sparkles className="w-2.5 h-2.5 fill-current" /> AI Assistant
              </span>
            </div>
            <p className="text-[10px] text-emerald-600 font-semibold flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
              {tText("Ativa para registros rápidos e dúvidas")}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Link to external noupe embed description */}
          <a 
            href="https://www.noupe.com" 
            target="_blank" 
            referrerPolicy="no-referrer"
            className="p-2 rounded-xl text-slate-400 hover:text-indigo-600 hover:bg-slate-50 transition-all cursor-pointer"
            title={tText("Acessar Noupe oficial")}
          >
            <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>

      {/* Messages Viewport */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => {
            const isBot = msg.sender === 'bot';
            return (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25 }}
                className={`flex gap-3 max-w-[85%] ${isBot ? 'mr-auto' : 'ml-auto flex-row-reverse'}`}
              >
                {/* Avatar */}
                <div className={`w-8 h-8 rounded-full shrink-0 flex items-center justify-center text-xs shadow-3xs ${
                  isBot ? 'bg-indigo-600 text-white' : 'bg-slate-200 text-slate-700'
                }`}>
                  {isBot ? <Bot className="w-4 h-4" /> : <User className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-3">
                  <div className={`p-4 rounded-3xl text-xs sm:text-sm leading-relaxed shadow-3xs border ${
                    isBot 
                      ? 'bg-white border-slate-100 text-slate-800 rounded-tl-sm' 
                      : 'bg-indigo-600 border-indigo-600 text-white rounded-tr-sm font-medium'
                  }`}>
                    {/* Simplified markdown formatter for bolding, list items and titles */}
                    <div className="space-y-1.5 whitespace-pre-wrap">
                      {msg.text.split('\n').map((line, idx) => {
                        let content: React.ReactNode = line;
                        
                        // Parse Headings: ### Title
                        if (line.startsWith('### ')) {
                          content = <h4 className="font-extrabold text-slate-900 mt-2 mb-1 text-sm border-b pb-0.5" key={idx}>{line.replace('### ', '')}</h4>;
                        } 
                        // Parse list items
                        else if (line.trim().startsWith('- ')) {
                          const cleanLine = line.trim().substring(2);
                          // Handle bold tags inside list items
                          content = (
                            <div className="flex items-start gap-1.5 ml-1" key={idx}>
                              <span className="text-indigo-500 mt-1">•</span>
                              <span>{parseBoldText(cleanLine)}</span>
                            </div>
                          );
                        } else {
                          content = <span key={idx}>{parseBoldText(line)}</span>;
                        }

                        return content;
                      })}
                    </div>
                  </div>

                  {/* Interactive Confirmation Card (Rendered if bot has pending action) */}
                  {isBot && msg.parsedData && msg.status === 'pending' && (
                    <motion.div
                      initial={{ scale: 0.95, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className="bg-white border-2 border-indigo-100 rounded-2xl p-4 shadow-sm max-w-sm space-y-3.5 mt-2 overflow-hidden"
                    >
                      <div className="flex items-center gap-2 pb-2 border-b border-slate-100">
                        {msg.parsedData.type === 'earnings' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><ArrowUpRight className="w-3 h-3" /> Earning</span>}
                        {msg.parsedData.type === 'expenses' && <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><ArrowDownRight className="w-3 h-3" /> Expense</span>}
                        {msg.parsedData.type === 'bill' && <span className="bg-amber-100 text-amber-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Calendar className="w-3 h-3" /> Bill</span>}
                        {msg.parsedData.type === 'investment' && <span className="bg-indigo-100 text-indigo-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><TrendingUp className="w-3 h-3" /> Investment</span>}
                        {msg.parsedData.type === 'delete_transaction' && <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Excluir Registro</span>}
                        {msg.parsedData.type === 'pay_bill' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Check className="w-3 h-3" /> Pagar Conta</span>}
                        <span className="text-[10px] text-slate-400 ml-auto font-medium">{tText("Revisão de Dados")}</span>
                      </div>
 
                      {/* Display Data Elements */}
                      <div className="space-y-1.5 text-xs text-slate-600">
                        {msg.parsedData.type === 'delete_transaction' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Descrição:")}</span>
                              <span className="font-bold text-slate-800">{msg.parsedData.payload.description}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Valor:")}</span>
                              <span className="font-extrabold text-rose-600">-{formatCurrency(msg.parsedData.payload.amount, currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Tipo:")}</span>
                              <span className="font-bold bg-slate-100 px-1.5 py-0.5 rounded text-[10px] text-slate-800">
                                {msg.parsedData.payload.type === 'earnings' ? 'Ganho' : 'Gasto'}
                              </span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Data:")}</span>
                              <span className="font-semibold text-slate-700">{msg.parsedData.payload.date.split('-').reverse().join('/')}</span>
                            </div>
                          </>
                        ) : msg.parsedData.type === 'pay_bill' ? (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Descrição:")}</span>
                              <span className="font-bold text-slate-800">{msg.parsedData.payload.description}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Valor:")}</span>
                              <span className="font-extrabold text-slate-900">{formatCurrency(msg.parsedData.payload.amount, currency)}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Vencimento:")}</span>
                              <span className="font-semibold text-amber-700">{msg.parsedData.payload.dueDate.split('-').reverse().join('/')}</span>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Descrição:")}</span>
                              <span className="font-bold text-slate-800">{msg.parsedData.payload.description || msg.parsedData.payload.name}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Valor:")}</span>
                              <span className="font-extrabold text-slate-900">{formatCurrency(msg.parsedData.payload.amount || msg.parsedData.payload.amountInvested, currency)}</span>
                            </div>
                            {msg.parsedData.type === 'bill' && (
                              <div className="flex justify-between">
                                <span className="text-slate-400">{tText("Vencimento:")}</span>
                                <span className="font-semibold text-amber-700">{msg.parsedData.payload.dueDate.split('-').reverse().join('/')}</span>
                              </div>
                            )}
                            {msg.parsedData.type === 'investment' && (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{tText("Tipo de Ativo:")}</span>
                                  <span className="font-bold text-slate-800">{msg.parsedData.payload.type}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{tText("Instituição:")}</span>
                                  <span className="font-bold text-slate-800 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> {msg.parsedData.payload.broker}</span>
                                </div>
                              </>
                            )}
                            <div className="flex justify-between">
                              <span className="text-slate-400">{tText("Categoria:")}</span>
                              <span className="font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded text-[10px]">{msg.parsedData.payload.category || msg.parsedData.payload.type}</span>
                            </div>
                          </>
                        )}
                      </div>
 
                      {/* Confirmation Controls */}
                      <div className="flex gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => cancelParsedData(msg.id)}
                          className="flex-1 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-600 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                        >
                          <X className="w-3.5 h-3.5" />
                          {tText("Cancelar")}
                        </button>
                        <button
                          onClick={() => confirmParsedData(msg.id, msg.parsedData!.type, msg.parsedData!.payload)}
                          className="flex-1 py-1.5 rounded-xl bg-indigo-600 text-xs font-semibold text-white hover:bg-indigo-700 transition-all cursor-pointer flex items-center justify-center gap-1 shadow-2xs"
                        >
                          <Check className="w-3.5 h-3.5" />
                          {tText("Confirmar")}
                        </button>
                      </div>
                    </motion.div>
                  )}

                  {/* Suggestion Chips */}
                  {isBot && msg.suggestions && msg.suggestions.length > 0 && (
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {msg.suggestions.map((s, idx) => (
                        <button
                          key={idx}
                          onClick={() => handleSend(s)}
                          className="bg-white hover:bg-indigo-50 text-indigo-700 text-[11px] font-medium py-1 px-2.5 rounded-full border border-indigo-100 shadow-3xs transition-all cursor-pointer"
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}

          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 mr-auto max-w-[80%]"
            >
              <div className="w-8 h-8 rounded-full bg-indigo-600 text-white shrink-0 flex items-center justify-center shadow-3xs">
                <Bot className="w-4 h-4" />
              </div>
              <div className="bg-white border border-slate-100 p-4 rounded-3xl rounded-tl-sm flex items-center gap-1 shadow-3xs">
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '0ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '150ms' }}></span>
                <span className="w-2 h-2 rounded-full bg-slate-400 animate-bounce" style={{ animationDelay: '300ms' }}></span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      {/* Input Form area */}
      <div className="bg-white border-t border-slate-200 p-4 sm:p-5 shrink-0 shadow-3xs">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2 bg-slate-50 border border-slate-200 rounded-2xl p-1.5 focus-within:border-indigo-500 focus-within:ring-2 focus-within:ring-indigo-100 transition-all"
        >
          <input
            id="chat-input"
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={tText("Diga o que registrar ou pergunte sobre investimentos...")}
            className="flex-1 bg-transparent border-0 outline-hidden py-2 px-3 text-slate-800 text-xs sm:text-sm placeholder:text-slate-400"
          />
          <button
            id="btn-chat-send"
            type="submit"
            disabled={!input.trim()}
            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-700 disabled:opacity-45 disabled:hover:bg-indigo-600 text-white flex items-center justify-center transition-all cursor-pointer shadow-xs shrink-0"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
        <div className="text-[10px] text-slate-400 mt-2 text-center flex items-center justify-center gap-1.5 font-medium">
          <Compass className="w-3.5 h-3.5 text-indigo-500" />
          <span>
            ECO IA FINANTRA, uma IA alimentada pela{' '}
            <a
              href="https://www.noupe.com/pt/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-indigo-600 hover:underline font-bold"
            >
              Noupe
            </a>
          </span>
        </div>
      </div>
    </div>
  );
}

// Simple bold and link parser to replace **text** and Substack URL with real JSX tags in React
function parseLinks(text: string): React.ReactNode {
  const linkRegex = /(https:\/\/substack\.com\/@finantraeconomizy)/g;
  const parts = text.split(linkRegex);
  return parts.map((part, i) => {
    if (part === 'https://substack.com/@finantraeconomizy') {
      return (
        <a
          key={`link-${i}`}
          href="https://substack.com/@finantraeconomizy"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 text-indigo-700 hover:text-indigo-900 font-extrabold bg-indigo-50 hover:bg-indigo-100 px-2.5 py-1 rounded-xl transition-all border border-indigo-100 mx-1 align-middle shadow-3xs cursor-pointer"
        >
          Blog do Finantra Economizy
          <ExternalLink className="w-3.5 h-3.5 inline-block" />
        </a>
      );
    }
    return part;
  });
}

function parseBoldText(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong className="font-extrabold text-indigo-950" key={`b-${i}`}>
          {parseLinks(part.slice(2, -2))}
        </strong>
      );
    }
    return <React.Fragment key={`s-${i}`}>{parseLinks(part)}</React.Fragment>;
  });
}
