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
  onAddGoal: (newG: { name: string; targetAmount: number; currentAmount: number; category?: string; deadline?: string }) => Promise<void> | void;
  transactions: Transaction[];
  monthlyBills: MonthlyBill[];
  investments: Investment[];
  financialGoals: any[];
  onDeleteTransaction: (id: string) => Promise<void> | void;
  onDeleteBill: (id: string) => Promise<void> | void;
  onDeleteInvestment: (id: string) => Promise<void> | void;
  onDeleteGoal: (id: string) => Promise<void> | void;
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
    type: 'earnings' | 'expenses' | 'bill' | 'investment' | 'delete_transaction' | 'delete_bill' | 'delete_investment' | 'pay_bill' | 'goal' | 'delete_goal';
    payload: any;
  };
  // Educational buttons
  suggestions?: string[];
}

export default function EcoIaTab({
  onAddTransaction,
  onAddBill,
  onAddInvestment,
  onAddGoal,
  transactions,
  monthlyBills,
  investments,
  financialGoals,
  onDeleteTransaction,
  onDeleteBill,
  onDeleteInvestment,
  onDeleteGoal,
  onToggleBillStatus,
  currency
}: EcoIaTabProps) {
  const { tText } = useLanguage();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [selectedItemIds, setSelectedItemIds] = useState<{ [msgId: string]: string }>({});
  const [termsAccepted, setTermsAccepted] = useState<boolean>(() => {
    return localStorage.getItem('fin_eco_ia_terms_accepted') === 'true';
  });
  const [secondsRemaining, setSecondsRemaining] = useState<number>(15);
  const [showHelpSidebar, setShowHelpSidebar] = useState(false);

  useEffect(() => {
    if (termsAccepted) return;
    const timer = setInterval(() => {
      setSecondsRemaining(prev => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [termsAccepted]);

  const chatEndRef = useRef<HTMLDivElement>(null);

  // Initialize with welcome messages
  useEffect(() => {
    const savedMessages = localStorage.getItem('fin_eco_ia_chat');
    const lastSavedTimeStr = localStorage.getItem('fin_eco_ia_chat_last_time');
    const now = Date.now();
    let shouldClear = false;
    
    if (lastSavedTimeStr) {
      const lastSavedTime = Number(lastSavedTimeStr);
      if (now - lastSavedTime > 3600000) { // 1 hour
        shouldClear = true;
      }
    }

    if (savedMessages && !shouldClear) {
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

    if (shouldClear) {
      localStorage.removeItem('fin_eco_ia_chat');
      localStorage.removeItem('fin_eco_ia_chat_last_time');
    }

    setMessages([
      {
        id: 'welcome_1',
        sender: 'bot',
        text: 'Olá! Eu sou a **ECO IA FINANTRA**, sua assistente de inteligência financeira pessoal. 🤖💚\n\n*(Nota: Em conformidade com nossas políticas de segurança, este chat é limpo automaticamente após 1 hora).*',
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

  // Save chat to local storage and update time
  useEffect(() => {
    if (messages.length > 0) {
      localStorage.setItem('fin_eco_ia_chat', JSON.stringify(messages));
      localStorage.setItem('fin_eco_ia_chat_last_time', Date.now().toString());
    }
  }, [messages]);

  // Periodic check to auto-delete after 1 hour of session inactivity or retention limit
  useEffect(() => {
    const interval = setInterval(() => {
      const lastSavedTimeStr = localStorage.getItem('fin_eco_ia_chat_last_time');
      if (lastSavedTimeStr) {
        const lastSavedTime = Number(lastSavedTimeStr);
        if (Date.now() - lastSavedTime > 3600000) { // 1 hour
          localStorage.removeItem('fin_eco_ia_chat');
          localStorage.removeItem('fin_eco_ia_chat_last_time');
          setMessages([
            {
              id: 'welcome_timeout',
              sender: 'bot',
              text: 'Sua sessão de conversa anterior de 1 hora expirou e os dados foram excluídos de forma automática e segura para proteger sua privacidade! Como posso ajudar com suas finanças hoje? 📊🚀',
              timestamp: new Date()
            }
          ]);
        }
      }
    }, 10000); // Check every 10 seconds
    return () => clearInterval(interval);
  }, []);

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

  // Helper to parse numbers in text (e.g. 150,00 -> 150; R$ 3.500,00 -> 3500; 5k -> 5000)
  const extractAmount = (text: string): number | null => {
    const lower = text.toLowerCase();
    
    // Clean date patterns like "28/06/2026", "28/06/26", "10/05" to avoid matching their numbers
    let cleanText = text.replace(/\b\d{1,2}[\/\-]\d{1,2}(?:[\/\-]\d{2,4})?\b/g, ' ');
    
    // Remove "dia XX" or "vencendo dia XX" to avoid picking up the day number
    cleanText = cleanText.replace(/(?:vencendo|vence|vencimento|venc|dia|pago)\s+\d{1,2}\b/gi, ' ');

    // Match numbers with possible currency symbols or suffixes
    const numberPattern = /(?:R\$|usd|\$)?\s*(\d+(?:\.\d{3})*(?:,\d{2})?|\d+)\s*(k|mil|reais|real)?\b/gi;
    const matches = [...cleanText.matchAll(numberPattern)];

    for (const match of matches) {
      let numStr = match[1];
      const suffix = match[2]?.toLowerCase();

      // Clean thousands dots and decimal commas
      if (numStr.includes(',') && numStr.includes('.')) {
        // Example: 1.500,00 -> 1500.00
        numStr = numStr.replace(/\./g, '').replace(',', '.');
      } else if (numStr.includes(',')) {
        // Example: 150,00 -> 150.00 or 1,500 -> 1500.00
        const parts = numStr.split(',');
        if (parts[1].length === 2 || parts[1].length === 1) {
          numStr = numStr.replace(',', '.');
        } else {
          numStr = numStr.replace(',', '');
        }
      } else if (numStr.includes('.')) {
        // Example: 150.00 or 1.500
        const parts = numStr.split('.');
        if (parts[1].length === 3) {
          numStr = numStr.replace(/\./g, '');
        }
      }

      let val = parseFloat(numStr);
      if (!isNaN(val) && val > 0) {
        if (suffix === 'k') val *= 1000;
        if (suffix === 'mil') val *= 1000;
        return val;
      }
    }

    // Fallback search for any clean decimal number if no suffix/prefix matched
    const simpleMatches = cleanText.match(/\b\d+(?:[\.,]\d+)?\b/g);
    if (simpleMatches) {
      for (const m of simpleMatches) {
        let valStr = m.replace(/\./g, '').replace(',', '.');
        const val = parseFloat(valStr);
        if (!isNaN(val) && val > 0 && val < 10000000) {
          return val;
        }
      }
    }

    return null;
  };

  // Helper to extract due day of month (1-31)
  const extractDueDay = (text: string): number => {
    const dayMatch = text.match(/(?:dia|vencendo|vencimento|vence|pago|venc|vencer)\s+(\d+)\b/i);
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

  // Helper to classify category for expenses/earnings intelligently
  const classifyCategory = (text: string, isEarning: boolean): string => {
    const lower = text.toLowerCase();
    
    if (isEarning) {
      if (lower.includes('salario') || lower.includes('salário') || lower.includes('folha') || lower.includes('trabalho') || lower.includes('empresa') || lower.includes('firma')) {
        return 'Salário';
      }
      if (lower.includes('freelancer') || lower.includes('freela') || lower.includes('bico') || lower.includes('venda') || lower.includes('vendi') || lower.includes('comissão') || lower.includes('comissao') || lower.includes('extra') || lower.includes('mesada')) {
        return 'Renda Extra';
      }
      if (lower.includes('dividendo') || lower.includes('dividendos') || lower.includes('juros') || lower.includes('fii') || lower.includes('rendeu') || lower.includes('rendimento') || lower.includes('rendimentos') || lower.includes('aplicação')) {
        return 'Rendimentos';
      }
      if (lower.includes('premio') || lower.includes('prêmio') || lower.includes('loteria') || lower.includes('sorteio') || lower.includes('presente') || lower.includes('doação') || lower.includes('reembolso')) {
        return 'Prêmios';
      }
      return 'Outros';
    } else {
      if (
        lower.includes('mercado') || lower.includes('supermercado') || lower.includes('comida') || lower.includes('restaurante') ||
        lower.includes('jantar') || lower.includes('almoço') || lower.includes('lanche') || lower.includes('padaria') ||
        lower.includes('açougue') || lower.includes('ifood') || lower.includes('pizza') || lower.includes('burger') ||
        lower.includes('hambúrguer') || lower.includes('cafe') || lower.includes('café') || lower.includes('churrasco') ||
        lower.includes('refrigerante') || lower.includes('doce') || lower.includes('feira') || lower.includes('pão') ||
        lower.includes('pao') || lower.includes('sushi') || lower.includes('gastronomia') || lower.includes('padoca')
      ) {
        return 'Alimentação';
      }
      if (
        lower.includes('uber') || lower.includes('99') || lower.includes('táxi') || lower.includes('taxi') ||
        lower.includes('combustível') || lower.includes('gasolina') || lower.includes('etanol') || lower.includes('diesel') ||
        lower.includes('transporte') || lower.includes('onibus') || lower.includes('ônibus') || lower.includes('estacionamento') ||
        lower.includes('pedagio') || lower.includes('pedágio') || lower.includes('metro') || lower.includes('metrô') ||
        lower.includes('trem') || lower.includes('passagem') || lower.includes('recarga') || lower.includes('buser') ||
        lower.includes('avião') || lower.includes('viagem') || lower.includes('carro') || lower.includes('moto') ||
        lower.includes('oficina') || lower.includes('mecanico') || lower.includes('mecânico') || lower.includes('pneu')
      ) {
        return 'Transporte';
      }
      if (
        lower.includes('cinema') || lower.includes('jogo') || lower.includes('games') || lower.includes('steam') ||
        lower.includes('psn') || lower.includes('xbox') || lower.includes('lazer') || lower.includes('cerveja') ||
        lower.includes('festa') || lower.includes('show') || lower.includes('teatro') || lower.includes('passeio') ||
        lower.includes('praia') || lower.includes('balada') || lower.includes('bar') || lower.includes('boteco') ||
        lower.includes('barzinho') || lower.includes('futebol') || lower.includes('ingresso') || lower.includes('parque') ||
        lower.includes('churrascaria') || lower.includes('clube') || lower.includes('diversão')
      ) {
        return 'Lazer';
      }
      if (
        lower.includes('roupa') || lower.includes('shopping') || lower.includes('compra') || lower.includes('compras') ||
        lower.includes('tenis') || lower.includes('tênis') || lower.includes('sapato') || lower.includes('vestuário') ||
        lower.includes('camiseta') || lower.includes('calça') || lower.includes('eletrônicos') || lower.includes('celular') ||
        lower.includes('acessório') || lower.includes('presente') || lower.includes('hering') || lower.includes('zara') ||
        lower.includes('magalu') || lower.includes('mercadolivre') || lower.includes('amazon') || lower.includes('shopee') ||
        lower.includes('shein') || lower.includes('perfume') || lower.includes('maquiagem') || lower.includes('brinquedo') ||
        lower.includes('loja') || lower.includes('gift')
      ) {
        return 'Compras';
      }
      if (
        lower.includes('aluguel') || lower.includes('condomínio') || lower.includes('iptu') || lower.includes('reforma') ||
        lower.includes('manutenção') || lower.includes('casa') || lower.includes('móveis') || lower.includes('decoração') ||
        lower.includes('eletrodoméstico') || lower.includes('imobiliaria') || lower.includes('mudança') || lower.includes('telha') ||
        lower.includes('pintura') || lower.includes('enxoval')
      ) {
        return 'Moradia';
      }
      if (
        lower.includes('farmácia') || lower.includes('farmacia') || lower.includes('remedio') || lower.includes('remédio') ||
        lower.includes('saúde') || lower.includes('saude') || lower.includes('consulta') || lower.includes('médico') ||
        lower.includes('dentista') || lower.includes('plano de saúde') || lower.includes('convenio') ||
        lower.includes('hospital') || lower.includes('exames') || lower.includes('drogaria') || lower.includes('terapia') ||
        lower.includes('psicólogo') || lower.includes('psicologo') || lower.includes('clinica') || lower.includes('clínica') ||
        lower.includes('oculista') || lower.includes('óculos') || lower.includes('exame')
      ) {
        return 'Saúde';
      }
      if (
        lower.includes('escola') || lower.includes('faculdade') || lower.includes('curso') || lower.includes('livros') ||
        lower.includes('material escolar') || lower.includes('mensalidade escolar') || lower.includes('udemy') ||
        lower.includes('hotmart') || lower.includes('inglês') || lower.includes('idiomas') || lower.includes('aula') ||
        lower.includes('universidade') || lower.includes('pós') || lower.includes('pos') || lower.includes('estudo') ||
        lower.includes('caderno')
      ) {
        return 'Educação';
      }
      if (
        lower.includes('internet') || lower.includes('wifi') || lower.includes('netflix') || lower.includes('spotify') ||
        lower.includes('streaming') || lower.includes('disney') || lower.includes('hbo') || lower.includes('amazon prime') ||
        lower.includes('youtube') || lower.includes('tv a cabo') || lower.includes('assinatura') || lower.includes('clube') ||
        lower.includes('mensalidade') || lower.includes('telefone') || lower.includes('celular plano') ||
        lower.includes('água') || lower.includes('luz') || lower.includes('enel') || lower.includes('sabesp') ||
        lower.includes('gás') || lower.includes('gas') || lower.includes('energia') || lower.includes('básica') ||
        lower.includes('basic') || lower.includes('provedor') || lower.includes('hospedagem') || lower.includes('servidor')
      ) {
        return 'Serviços';
      }
      return 'Outros';
    }
  };

  // Helper to extract clean descriptions from user prompts
  const cleanDescription = (text: string, isEarning: boolean): string => {
    let cleaned = text;

    // Remove trigger verbs/prefixes
    cleaned = cleaned.replace(/^(?:quero\s+)?(?:adicionar|lançar|registrar|salvar|gravar|colocar|inserir|declarar|coloca|bota|bota aí|insere)\s+(?:um|uma|o|a)?\s*/gi, '');
    cleaned = cleaned.replace(/^(?:gastei|comprei|recebi|ganhei|paguei|investi|aportei|quitei|exclui|apaguei|removi|deletei|exclua|apaguei|remova|delete)\s+(?:com|em|na|no|um|uma|o|a|de|R\$)?\s*/gi, '');

    // Remove monetary values (e.g. 150,00, R$ 150, 5k, etc)
    cleaned = cleaned.replace(/(?:R\$|usd|\$)?\s*\d+(?:\.\d{3})*(?:,\d{2})?\s*(?:reais|real|conto|k|mil)?\b/gi, '');

    // Remove connector prepositions and extra words
    cleaned = cleaned.replace(/\b(?:de|com|em|na|no|o|a|por|no\s+valor\s+de|valor\s+de|vencendo\s+dia|dia\s+\d+|vencimento|vence|vencer)\b/gi, '');

    // Strip special characters and leave clean text
    cleaned = cleaned.replace(/[,.\-_:;?()]/g, ' ');
    cleaned = cleaned.replace(/\s+/g, ' ').trim();

    if (!cleaned) {
      return isEarning ? 'Ganho Adicionado' : 'Gasto Adicionado';
    }

    return cleaned.charAt(0).toUpperCase() + cleaned.slice(1);
  };

  // AI/Regex parsing engine
  const parseUserIntent = (text: string) => {
    let queryText = text.trim();
    let lowerText = queryText.toLowerCase();
    let commandOverride: 'earnings' | 'expenses' | 'bill' | 'investment' | 'goal' | null = null;

    if (lowerText.startsWith('/contas') || lowerText.startsWith('/conta')) {
      commandOverride = 'bill';
      queryText = queryText.replace(/^\/contas?:?\s*/i, '');
    } else if (lowerText.startsWith('/ganho')) {
      commandOverride = 'earnings';
      queryText = queryText.replace(/^\/ganho:?\s*/i, '');
    } else if (lowerText.startsWith('/gasto')) {
      commandOverride = 'expenses';
      queryText = queryText.replace(/^\/gasto:?\s*/i, '');
    } else if (lowerText.startsWith('/metas') || lowerText.startsWith('/meta')) {
      commandOverride = 'goal';
      queryText = queryText.replace(/^\/metas?:?\s*/i, '');
    } else if (lowerText.startsWith('/investimentos') || lowerText.startsWith('/investimento')) {
      commandOverride = 'investment';
      queryText = queryText.replace(/^\/investimentos?:?\s*/i, '');
    }

    // Recalculate lowerText and amount after command stripping
    lowerText = queryText.toLowerCase().trim();
    const amount = extractAmount(queryText);

    if (commandOverride) {
      const cleaned = cleanDescription(queryText, commandOverride === 'earnings' || commandOverride === 'goal');

      if (commandOverride === 'earnings') {
        const category = classifyCategory(queryText, true);
        return {
          type: 'earnings',
          data: {
            type: 'earnings',
            description: cleaned || 'Ganho via comando',
            amount: amount || 0,
            category,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Pix'
          }
        };
      } else if (commandOverride === 'expenses') {
        const category = classifyCategory(queryText, false);
        return {
          type: 'expenses',
          data: {
            type: 'expenses',
            description: cleaned || 'Gasto via comando',
            amount: amount || 0,
            category,
            date: new Date().toISOString().split('T')[0],
            paymentMethod: 'Cartão de Crédito'
          }
        };
      } else if (commandOverride === 'bill') {
        const dueDay = extractDueDay(queryText.toLowerCase());
        const today = new Date();
        const dueMonth = today.getDate() > dueDay ? today.getMonth() + 2 : today.getMonth() + 1;
        const dueYear = today.getFullYear();
        const formattedMonth = dueMonth > 12 ? '01' : String(dueMonth).padStart(2, '0');
        const formattedYear = dueMonth > 12 ? dueYear + 1 : dueYear;
        const dueDate = `${formattedYear}-${formattedMonth}-${String(dueDay).padStart(2, '0')}`;
        const category = classifyCategory(cleaned, false);
        return {
          type: 'bill',
          data: {
            description: cleaned || 'Conta Mensal via comando',
            amount: amount || 0,
            dueDate,
            category,
            isPaid: false
          }
        };
      } else if (commandOverride === 'investment') {
        let invType: 'Renda Fixa' | 'Ações' | 'Fundos Imobiliários' | 'Cripto' | 'Outros' = 'Outros';
        const qLower = queryText.toLowerCase();
        if (qLower.includes('cdb') || qLower.includes('renda fixa') || qLower.includes('tesouro') || qLower.includes('poupança')) {
          invType = 'Renda Fixa';
        } else if (qLower.includes('ação') || qLower.includes('ações') || qLower.includes('b3') || qLower.includes('bolsa')) {
          invType = 'Ações';
        } else if (qLower.includes('fii') || qLower.includes('fundos imobiliários') || qLower.includes('fundo imobiliário')) {
          invType = 'Fundos Imobiliários';
        } else if (qLower.includes('cripto') || qLower.includes('bitcoin') || qLower.includes('ethereum')) {
          invType = 'Cripto';
        }

        let broker = 'Geral';
        if (qLower.includes('xp')) broker = 'XP Investimentos';
        else if (qLower.includes('nubank') || qLower.includes('nuinvest')) broker = 'NuInvest';
        else if (qLower.includes('inter')) broker = 'Banco Inter';
        else if (qLower.includes('rico')) broker = 'Rico';

        return {
          type: 'investment',
          data: {
            name: cleaned || 'Investimento via comando',
            type: invType,
            amountInvested: amount || 0,
            currentAmount: amount || 0,
            broker,
            acquisitionDate: new Date().toISOString().split('T')[0],
            yieldRate: 11.5
          }
        };
      } else if (commandOverride === 'goal') {
        return {
          type: 'goal',
          data: {
            name: cleaned || 'Meta via comando',
            targetAmount: amount || 0,
            currentAmount: 0
          }
        };
      }
    }

    // A. DELETE/REMOVE INTENT
    const isDelete = 
      lowerText.includes('apagar') || 
      lowerText.includes('excluir') || 
      lowerText.includes('deletar') || 
      lowerText.includes('remover') || 
      lowerText.includes('tira') || 
      lowerText.includes('tire') || 
      lowerText.includes('delete') || 
      lowerText.includes('exclua') ||
      lowerText.includes('excluo') ||
      lowerText.includes('limpar') ||
      lowerText.includes('limpa');

    if (isDelete) {
      let searchTerms = lowerText
        .replace(/apagar|excluir|deletar|remover|tira|tire|delete|exclua|excluo|limpar|limpa/g, '')
        .replace(/gasto|gastos|ganho|ganhos|receita|receitas|despesa|despesas|investimento|investimentos|conta|contas|boleto|boletos|fatura|faturas|meta|metas|objetivo|objetivos/g, '')
        .replace(/R\$\s*\d+([\.,]\d+)?/gi, '')
        .replace(/\b\d+([\.,]\d+)?\b/g, '')
        .replace(/[,.-]/g, '')
        .trim();

      // 1. Transactions Candidates (Earnings & Expenses)
      const tCandidates = transactions.map(t => {
        let score = 0;
        const isTxWord = lowerText.includes('gasto') || lowerText.includes('ganho') || lowerText.includes('receita') || lowerText.includes('despesa') || lowerText.includes('salário') || lowerText.includes('salario');
        if (isTxWord) score += 15;

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
        return { item: t, score, type: 'delete_transaction' as const };
      });

      // 2. Monthly Bills Candidates
      const bCandidates = monthlyBills.map(b => {
        let score = 0;
        const isBillWord = lowerText.includes('conta') || lowerText.includes('boleto') || lowerText.includes('fatura') || lowerText.includes('aluguel') || lowerText.includes('mensalidade') || lowerText.includes('vencimento');
        if (isBillWord) score += 20;

        if (amount !== null && Math.abs(b.amount - amount) < 0.01) {
          score += 60;
        }
        if (searchTerms) {
          const descLower = b.description.toLowerCase();
          if (descLower.includes(searchTerms)) {
            score += 30;
          }
          if (searchTerms.includes(descLower)) {
            score += 20;
          }
        }
        return { item: b, score, type: 'delete_bill' as const };
      });

      // 3. Investments Candidates
      const iCandidates = (investments || []).map(inv => {
        let score = 0;
        const isInvWord = lowerText.includes('investimento') || lowerText.includes('investi') || lowerText.includes('ações') || lowerText.includes('fii') || lowerText.includes('cdb') || lowerText.includes('tesouro') || lowerText.includes('carteira');
        if (isInvWord) score += 20;

        if (amount !== null && (Math.abs(inv.amountInvested - amount) < 0.01 || Math.abs(inv.currentAmount - amount) < 0.01)) {
          score += 60;
        }
        if (searchTerms) {
          const nameLower = inv.name.toLowerCase();
          if (nameLower.includes(searchTerms)) {
            score += 30;
          }
          if (searchTerms.includes(nameLower)) {
            score += 20;
          }
          const brokerLower = inv.broker.toLowerCase();
          if (brokerLower.includes(searchTerms)) {
            score += 15;
          }
        }
        return { item: inv, score, type: 'delete_investment' as const };
      });

      // 4. Financial Goal Candidates
      const gCandidates = (financialGoals || []).map(g => {
        let score = 0;
        const isGoalWord = lowerText.includes('meta') || lowerText.includes('metas') || lowerText.includes('objetivo') || lowerText.includes('objetivos');
        if (isGoalWord) score += 20;

        if (amount !== null && Math.abs(g.targetAmount - amount) < 0.01) {
          score += 60;
        }
        if (searchTerms) {
          const nameLower = g.name.toLowerCase();
          if (nameLower.includes(searchTerms)) {
            score += 30;
          }
          if (searchTerms.includes(nameLower)) {
            score += 20;
          }
        }
        return { item: g, score, type: 'delete_goal' as const };
      });

      const allCandidates = [...tCandidates, ...bCandidates, ...iCandidates, ...gCandidates]
        .filter(c => c.score > 0)
        .sort((a, b) => b.score - a.score);

      if (allCandidates.length > 0) {
        const best = allCandidates[0];
        
        let matchingItems = [best.item];
        if (searchTerms && best.type === 'delete_transaction') {
          const sameNameCandidates = tCandidates.filter(c => {
            const desc = c.item.description.toLowerCase();
            return desc.includes(searchTerms) || searchTerms.includes(desc);
          });
          if (sameNameCandidates.length > 0) {
            matchingItems = sameNameCandidates.map(c => c.item);
          }
        } else if (allCandidates.length > 1) {
          matchingItems = allCandidates.filter(c => c.type === best.type && c.score >= best.score - 10).map(c => c.item);
        }

        return {
          type: best.type,
          data: matchingItems[0],
          allMatches: matchingItems
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
      lowerText.includes('liquidei') ||
      lowerText.includes('liquido');

    if (isPayBill) {
      let billSearchTerms = lowerText
        .replace(/paguei|pagar|quitar|marcar como paga|marca como paga|paga|pago|quitei|quita|liquidar|liquidei|liquido/g, '')
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

    // C. HELP / EDUCATION INTENT
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

    // G. FINANCIAL GOAL INTENT (check before unknown or regular transactions)
    if (
      lowerText.includes('meta') || 
      lowerText.includes('metas') || 
      lowerText.includes('objetivo') || 
      lowerText.includes('objetivos') || 
      lowerText.includes('poupar para') || 
      lowerText.includes('juntar para') ||
      lowerText.includes('comprar para')
    ) {
      const name = cleanDescription(text, true);
      return {
        type: 'goal',
        data: {
          name,
          targetAmount: amount || 0,
          currentAmount: 0
        }
      };
    }

    if (!amount) {
      return { type: 'unknown', text };
    }

    // D. INVESTMENTS INTENT
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
      lowerText.includes('poupança') ||
      lowerText.includes('ações') ||
      lowerText.includes('ativo') ||
      lowerText.includes('ativos') ||
      lowerText.includes('aplicar')
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

      const name = cleanDescription(text, true);

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

    // E. MONTHLY BILLS INTENT
    if (
      lowerText.includes('conta de') || 
      lowerText.includes('fatura') || 
      lowerText.includes('boleto') || 
      lowerText.includes('aluguel') || 
      lowerText.includes('vencendo') || 
      lowerText.includes('vencimento') || 
      lowerText.includes('mensal') ||
      lowerText.includes('assino') ||
      lowerText.includes('assinatura') ||
      lowerText.includes('vencer') ||
      lowerText.includes('vence')
    ) {
      const dueDay = extractDueDay(lowerText);
      const today = new Date();
      // Format as YYYY-MM-DD using the parsed day
      const dueMonth = today.getDate() > dueDay ? today.getMonth() + 2 : today.getMonth() + 1; // next month if already passed
      const dueYear = today.getFullYear();
      const formattedMonth = dueMonth > 12 ? '01' : String(dueMonth).padStart(2, '0');
      const formattedYear = dueMonth > 12 ? dueYear + 1 : dueYear;
      const dueDate = `${formattedYear}-${formattedMonth}-${String(dueDay).padStart(2, '0')}`;

      const description = cleanDescription(text, false);
      const category = classifyCategory(description, false);

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

    // F. TRANSACTIONS INTENT (Earnings or Expenses)
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
      lowerText.includes('rendimento') ||
      lowerText.includes('faturei') ||
      lowerText.includes('ganhar') ||
      lowerText.includes('receita');

    const description = cleanDescription(text, isEarning);
    const category = classifyCategory(text, isEarning);

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
          const isMultiple = intent.allMatches && intent.allMatches.length > 1;
          if (isMultiple) {
            summaryText = `Encontrei **${intent.allMatches.length} lançamentos** correspondentes com o nome **"${(intent.data as any).description || (intent.data as any).name}"**.\n\nPor favor, escolha abaixo qual deles você deseja excluir de fato:`;
          } else {
            const isEarning = payload.type === 'earnings';
            summaryText = `Identifiquei que você deseja **APAGAR** o seguinte lançamento de **${isEarning ? 'GANHO' : 'GASTO'}**:\n\n**${payload.description}** no valor de **${formatCurrency(payload.amount, currency)}** de **${payload.date?.split('-').reverse().join('/')}**.\n\nDeseja confirmar a exclusão definitiva?`;
          }
        } else if (intent.type === 'delete_bill') {
          summaryText = `Identifiquei que você deseja **APAGAR** a seguinte **CONTA MENSAL**:\n\n**${payload.description}** no valor de **${formatCurrency(payload.amount, currency)}** vencendo dia **${payload.dueDate?.split('-').reverse().join('/')}**.\n\nDeseja confirmar a exclusão definitiva?`;
        } else if (intent.type === 'delete_investment') {
          summaryText = `Identifiquei que você deseja **APAGAR** o seguinte **INVESTIMENTO** da sua carteira:\n\n**${payload.name}** no valor de **${formatCurrency(payload.amountInvested, currency)}** pela instituição **${payload.broker}**.\n\nDeseja confirmar a exclusão definitiva?`;
        } else if (intent.type === 'pay_bill') {
          summaryText = `Identifiquei que você deseja marcar a seguinte **CONTA MENSAL** como **PAGA**:\n\n**${payload.description}** no valor de **${formatCurrency(payload.amount, currency)}**.\n\nDeseja confirmar que este boleto foi pago?`;
        } else if (intent.type === 'goal') {
          summaryText = `Identifiquei que você deseja **ADICIONAR** a seguinte **META FINANCEIRA**:\n\n**${payload.name}** com valor alvo de **${formatCurrency(payload.targetAmount, currency)}**.\n\nDeseja confirmar a criação desta meta?`;
        } else if (intent.type === 'delete_goal') {
          summaryText = `Identifiquei que você deseja **APAGAR** a seguinte **META FINANCEIRA**:\n\n**${payload.name}** com valor alvo de **${formatCurrency(payload.targetAmount, currency)}**.\n\nDeseja confirmar a exclusão definitiva?`;
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
      } else if (type === 'delete_bill') {
        await onDeleteBill(payload.id);
      } else if (type === 'delete_investment') {
        await onDeleteInvestment(payload.id);
      } else if (type === 'pay_bill') {
        await onToggleBillStatus(payload.id, true);
      } else if (type === 'goal') {
        await onAddGoal(payload);
      } else if (type === 'delete_goal') {
        await onDeleteGoal(payload.id);
      }

      setMessages(prev => prev.map(m => {
        if (m.id === msgId) {
          let customText = `✅ **Confirmado e Registrado!**\n\nLancei com sucesso o registro no seu painel principal de finanças. Seus saldos e projeções já foram sincronizados localmente e na nuvem.`;
          if (type === 'delete_transaction') {
            customText = `✅ **Registro Apagado!**\n\nO lançamento foi excluído definitivamente do seu painel de transações e do banco de dados. Seus saldos foram atualizados.`;
          } else if (type === 'delete_bill') {
            customText = `✅ **Conta Mensal Excluída!**\n\nA conta mensal foi removida do seu gerenciador com sucesso.`;
          } else if (type === 'delete_investment') {
            customText = `✅ **Investimento Excluído!**\n\nO investimento foi removido da sua carteira de ativos com sucesso.`;
          } else if (type === 'pay_bill') {
            customText = `✅ **Conta Mensal Paga!**\n\nA conta foi liquidada com sucesso no seu gerenciador de contas e faturas.`;
          } else if (type === 'goal') {
            customText = `✅ **Meta Financeira Criada!**\n\nA meta **"${payload.name}"** com valor alvo de **${formatCurrency(payload.targetAmount, currency)}** foi registrada com sucesso!`;
          } else if (type === 'delete_goal') {
            customText = `✅ **Meta Financeira Excluída!**\n\nA meta **"${payload.name}"** foi excluída permanentemente com sucesso.`;
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
        } else if (m.parsedData?.type === 'delete_bill') {
          customText = `❌ **Exclusão Cancelada**\n\nA conta mensal permanece salva no seu gerenciador.`;
        } else if (m.parsedData?.type === 'delete_investment') {
          customText = `❌ **Exclusão Cancelada**\n\nO ativo permanece salvo na sua carteira de investimentos.`;
        } else if (m.parsedData?.type === 'pay_bill') {
          customText = `❌ **Pagamento Cancelado**\n\nA conta mensal continua com status pendente.`;
        } else if (m.parsedData?.type === 'goal') {
          customText = `❌ **Criação Cancelada**\n\nA meta financeira não foi criada.`;
        } else if (m.parsedData?.type === 'delete_goal') {
          customText = `❌ **Exclusão Cancelada**\n\nA meta financeira permanece inalterada nos seus objetivos.`;
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

    // Helper to selectively/probabilistically append the Substack Blog recommendation (~35% of the time)
    const withBlogRecommend = (text: string): string => {
      const showRecommend = Math.random() < 0.35;
      if (showRecommend) {
        return text;
      } else {
        const generalFooters = [
          `\n\n---\n\n*Gostou dessa dica? Guarde-a com carinho e aplique no seu dia a dia!* 💪💰`,
          `\n\n---\n\n*Lembre-se: pequenos hábitos diários constroem grandes patrimônios no longo prazo.* 🌱📈`,
          `\n\n---\n\n*A constância é o segredo do sucesso financeiro. Continue firme nos seus objetivos!* 📈🚀`,
          `\n\n---\n\n*Quer realizar mais agendamentos ou tirar outras dúvidas? Fale comigo!* 💡💬`
        ];
        const splitIndex = text.indexOf('\n\n---\n\n');
        if (splitIndex !== -1) {
          const baseText = text.substring(0, splitIndex);
          const randomIndex = Math.floor(Math.random() * generalFooters.length);
          return baseText + generalFooters[randomIndex];
        }
        return text;
      }
    };

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
      const seed = Math.floor(Math.random() * 100);
      const randomIndex = seed % financialTips.length;
      const tip = financialTips[randomIndex];
      
      return withBlogRecommend(`### 💡 Dica Financeira Finantra: ${tip.title} 🌟\n\n${tip.text}\n\n---\n\n📰 **Quer expandir seus conhecimentos?**\nPara dezenas de outros insights fantásticos sobre economia e investimentos, visite e inscreva-se no **Blog do Finantra Economizy**:\n👉 https://substack.com/@finantraeconomizy 🚀💚`);
    }
    
    if (q.includes('selic')) {
      return withBlogRecommend(`### 💡 Guia de Investimento: Taxa Selic 📈\n\nA **Taxa Selic** é a taxa básica de juros da economia brasileira, definida a cada 45 dias pelo Banco Central (COPOM).\n\n**Como ela afeta seus investimentos?**\n- **Renda Fixa:** Quando a Selic sobe, os rendimentos de títulos de Renda Fixa (como Tesouro Selic, CDBs, LCI e LCA) sobem, tornando-os muito atraentes.\n- **Ações e FIIs:** Geralmente, quando a Selic está alta, o investimento em Bolsa de Valores recua, pois os investidores preferem a segurança da renda fixa pagando juros altos.\n- **Poupança:** Se a Selic estiver acima de 8,5% ao ano, a poupança rende 0,5% ao mês + Taxa Referencial (TR). Se estiver igual ou abaixo de 8,5%, rende exatamente 70% da Selic.\n\n**Recomendação de Ouro:** O **Tesouro Selic** é considerado o investimento mais seguro do país, perfeito para sua **Reserva de Emergência**, pois possui liquidez diária (D+0) e rentabilidade diária garantida.\n\n---\n\n📰 **Quer saber mais sobre investimentos?** Acesse nosso portal com guias exclusivos no **Blog do Finantra Economizy**: https://substack.com/@finantraeconomizy 🚀💚`);
    }
    
    if (q.includes('cdi')) {
      return withBlogRecommend(`### 📊 O que é o CDI? Entenda Fácil! 💸\n\nO **CDI (Certificado de Depósito Interbancário)** é uma taxa que reflete o custo dos empréstimos de curto prazo que os bancos fazem entre si para fechar o dia com saldo positivo.\n\n**O CDI acompanha a Selic:**\nNormalmente, a taxa do CDI anda colada na Selic (cerca de 0,10 ponto percentual abaixo da taxa básica).\n\n**Onde o CDI é usado?**\nEle serve como o principal termômetro ("benchmark") para a rentabilidade dos títulos de renda fixa privada:\n- **CDB (Certificado de Depósito Bancário):** Um CDB que paga **100% do CDI** é ótimo, pois rende exatamente o rendimento do mercado sem risco. Evite CDBs de grandes bancos tradicionais que pagam menos de 90% do CDI.\n- **LCI/LCA:** São isentos de Imposto de Renda. Portanto, uma LCI que pague **90% do CDI** pode render o equivalente a um CDB de **108% do CDI** com imposto de renda descontado!\n\n**Dica:** Sempre prefira investimentos de liquidez diária que rendam pelo menos **100% do CDI** para guardar sua reserva de curto prazo.\n\n---\n\n📰 **Leia análises de renda fixa atualizadas no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`);
    }

    if (q.includes('fii') || q.includes('fundo') || q.includes('imobiliário')) {
      return withBlogRecommend(`### 🏢 Fundos Imobiliários (FIIs): Aluguéis sem Burocracia 🏘️\n\nOs **Fundos Imobiliários (FIIs)** reúnem recursos de milhares de investidores para aplicar em grandes empreendimentos imobiliários, como prédios corporativos de alto padrão, shopping centers, galpões logísticos ou títulos de crédito imobiliário (LCI, CRI).\n\n**Vantagens dos FIIs:**\n1. **Renda Passiva Mensal:** Praticamente todos os FIIs distribuem lucros mensais na sua conta de corretora, simulando um aluguel de imóvel.\n2. **Isenção de IR:** Os dividendos distribuídos a pessoas físicas são atualmente isentos de Imposto de Renda!\n3. **Baixo Custo de Entrada:** Com apenas R$ 10 ou R$ 100 você já adquire uma cota de grandes fundos e começa a receber rendimentos.\n4. **Alta Liquidez:** Diferente de um imóvel físico que demora meses para vender, as cotas de FIIs são vendidas em segundos na Bolsa de Valores (Home Broker).\n\n**Categorias de FIIs:**\n- **FIIs de Tijolo:** Investem em imóveis físicos reais (galpões, escritórios, shoppings). Ótimos para ganho de capital de longo prazo.\n- **FIIs de Papel:** Investem em títulos de dívida imobiliária (CRIs). Geralmente oferecem dividendos mais altos de forma imediata.\n- **FIIs de Fundos (FOFs):** Fundos que compram cotas de outros fundos. Excelentes para iniciantes diversificarem facilmente.\n\n---\n\n📰 **Quer construir uma carteira de FIIs vencedora?** Confira as dicas exclusivas no **Blog do Finantra Economizy**: https://substack.com/@finantraeconomizy 🚀💚`);
    }

    if (q.includes('ações') || q.includes('bolsa') || q.includes('renda variável')) {
      return withBlogRecommend(`### 📈 Investindo em Ações na Bolsa de Valores 🚀\n\nUma **Ação** representa a menor fração do capital social de uma empresa. Ao comprar uma ação, você se torna **sócio(a)** daquela empresa e passa a participar de seus lucros e crescimento.\n\n**Como você ganha dinheiro com ações?**\n1. **Valorização da Cota:** Se a empresa cresce e melhora seus resultados, as ações tendem a subir de preço na B3 (Bolsa de Valores).\n2. **Proventos (Dividendos e JCP):** Parte do lucro líquido das empresas de capital aberto é obrigatoriamente distribuído aos acionistas.\n\n**Conselhos Cruciais para Iniciantes:**\n- **Foco no Longo Prazo:** Não compre ações para vender amanhã (Day Trade é altamente arriscado). Invista em empresas sólidas visando de 5 a 10 anos.\n- **Diversificação:** Nunca coloque todo o seu capital em uma única empresa. Divida entre setores perenes (Bancos, Energia Elétrica, Saneamento, Telecomunicações).\n- **Reserva de Emergência Primeiro:** Nunca invista na bolsa de valores dinheiro que você possa precisar no curto prazo (menos de 2 anos), pois as oscilações do mercado são diárias.\n\n---\n\n📰 **Aprenda a analisar ações de modo fácil no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`);
    }

    return withBlogRecommend(`### 💡 Guia de Saúde Financeira Finantra 🌟\n\nPara ter uma vida financeira saudável, siga estes três pilares essenciais de organização:\n\n1. **Primeiro Passo (Reserva de Emergência):** Guarde o equivalente a **6 meses** das suas despesas fixas em um investimento seguro e de resgate rápido, como o **Tesouro Selic** ou um **CDB de 100% do CDI** com liquidez diária.\n\n2. **Segundo Passo (Planejamento 50/30/20):**\n   - **50%** de sua renda líquida para gastos essenciais (aluguel, contas básicas, comida, transporte).\n   - **30%** para desejos pessoais e estilo de vida (lazer, compras, passeios, hobbies).\n   - **20%** diretamente para investir pensando no futuro.\n\n3. **Terceiro Passo (Consistência):** Monitore seus saldos ativamente. Sempre registre seus gastos no painel de transações e use nossa aba de **Contas Mensais** para nunca mais esquecer um boleto ou pagar juros por atraso!\n\n**O que mais você gostaria de entender sobre investimentos hoje?** Tente me perguntar sobre: **Taxa Selic**, **CDI**, **CDB**, **Fundos Imobiliários (FIIs)**, **Ações** ou peça uma **Dica Financeira**!\n\n---\n\n📰 **Acompanhe dicas e análises detalhadas no Blog do Finantra Economizy:** https://substack.com/@finantraeconomizy 🚀💚`);
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
          <button 
            type="button"
            onClick={() => setShowHelpSidebar(!showHelpSidebar)}
            className={`p-2 px-2.5 sm:px-3 rounded-xl border transition-all cursor-pointer flex items-center gap-1.5 text-[10px] sm:text-xs font-bold ${
              showHelpSidebar 
                ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-3xs' 
                : 'border-slate-200 text-slate-500 hover:text-indigo-600 hover:bg-slate-50 hover:border-slate-300'
            }`}
            title={tText("Guia de Tags & Exemplos")}
          >
            <HelpCircle className="w-3.5 h-3.5" />
            <span>{tText("Como Usar")}</span>
          </button>

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

      {!termsAccepted ? (
        <div className="flex-1 overflow-y-auto p-5 sm:p-8 bg-white flex flex-col justify-between">
          <div className="space-y-5 max-w-2xl mx-auto">
            {/* Header and Welcome */}
            <div className="text-center space-y-1.5">
              <div className="w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mx-auto mb-3 border border-indigo-100">
                <Sparkles className="w-5 h-5 animate-pulse" />
              </div>
              <h3 className="text-base sm:text-lg font-extrabold text-slate-900 tracking-tight">
                {tText("Termos de Uso & Guia da ECO IA Finantra")}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 leading-relaxed max-w-md mx-auto">
                {tText("Para garantir o melhor desempenho, privacidade máxima e precisão absoluta no registro de seus dados, por favor revise as regras abaixo. Observação: as conversas são excluídas de forma totalmente automática a cada 1 hora.")}
              </p>
            </div>

            {/* Rules and guidelines cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Check className="w-4 h-4 text-emerald-500" />
                  {tText("Regras de Uso")}
                </h4>
                <ul className="text-[11px] text-slate-650 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>{tText("Interpreta valores (ex: R$ 150) e palavras-chave para criar lançamentos automaticamente.")}</li>
                  <li>{tText("Nenhuma alteração é salva definitivamente sem que você confirme clicando em 'Confirmar' no chat.")}</li>
                  <li>{tText("Seus dados são sincronizados localmente e na nuvem multiplataforma para evitar perdas.")}</li>
                  <li><strong className="text-rose-600">{tText("Autodeleção de Conversas:")}</strong> {tText("Por segurança e privacidade, todo o histórico de conversas com a IA é limpo automaticamente de 1 em 1 hora.")}</li>
                </ul>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 border border-slate-100 space-y-2">
                <h4 className="text-[11px] font-extrabold text-slate-800 flex items-center gap-1.5 uppercase tracking-wider">
                  <Sparkles className="w-4 h-4 text-indigo-500" />
                  {tText("Melhor Desempenho")}
                </h4>
                <ul className="text-[11px] text-slate-650 space-y-1 list-disc pl-4 leading-relaxed">
                  <li>{tText("Sempre informe o nome/descrição clara do item e o valor numérico correspondente.")}</li>
                  <li>{tText("Seja claro e específico em suas perguntas ou comandos enviados para a assistente.")}</li>
                  <li>{tText("Use as sugestões rápidas para aprender comandos frequentes com agilidade.")}</li>
                </ul>
              </div>
            </div>

            {/* Examples block */}
            <div className="p-4 rounded-2xl border border-indigo-100 bg-indigo-50/20 space-y-2.5">
              <h4 className="text-[11px] font-extrabold text-indigo-900 flex items-center gap-1.5 uppercase tracking-wider">
                <MessageSquare className="w-4 h-4" />
                {tText("Exemplos de Comandos")}
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px]">
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-emerald-600">🟢 Ganho:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Recebi R$ 3.500 de salário hoje"</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-rose-600">🔴 Gasto:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Gastei 45 reais com Uber"</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-amber-600">📅 Conta Mensal:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Conta de internet de R$ 120 dia 10"</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-indigo-650">📈 Investimento:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Investi 500 no Tesouro Direto"</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-slate-700">❌ Excluir Lançamentos:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Excluir gasto uber"</p>
                </div>
                <div className="p-2 rounded-xl bg-white border border-indigo-100/40">
                  <span className="font-extrabold text-teal-600">💳 Quitar Conta:</span>
                  <p className="text-[10px] text-slate-500 italic mt-0.5">"Paguei o boleto de internet de R$ 120"</p>
                </div>
              </div>
            </div>

            {/* Note on duplicate deletes */}
            <p className="text-[10px] text-slate-400 text-center leading-relaxed">
              * {tText("Dica de Segurança: Se você solicitar a exclusão de um ganho ou gasto que possui lançamentos com o mesmo nome, o sistema listará todos eles para que você escolha de fato qual deseja remover.")}
            </p>
          </div>

          <div className="pt-4 border-t border-slate-100 flex justify-center shrink-0">
            <button
              onClick={() => {
                if (secondsRemaining > 0) return;
                localStorage.setItem('fin_eco_ia_terms_accepted', 'true');
                setTermsAccepted(true);
              }}
              disabled={secondsRemaining > 0}
              className={`px-6 py-2.5 rounded-xl text-white font-extrabold text-xs transition-all shadow-xs hover:shadow-sm flex items-center gap-1.5 ${
                secondsRemaining > 0
                  ? 'bg-slate-300 cursor-not-allowed opacity-80'
                  : 'bg-indigo-650 hover:bg-indigo-750 cursor-pointer'
              }`}
            >
              {secondsRemaining > 0 ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping"></span>
                  {tText(`Aguarde ${secondsRemaining}s para ler os termos`)}
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  {tText("Ok, Aceito os termos de uso")}
                </>
              )}
            </button>
          </div>
        </div>
      ) : (
        <>
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
                            {msg.parsedData.type === 'delete_bill' && <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Excluir Conta</span>}
                            {msg.parsedData.type === 'delete_investment' && <span className="bg-rose-100 text-rose-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Trash2 className="w-3 h-3" /> Excluir Ativo</span>}
                            {msg.parsedData.type === 'pay_bill' && <span className="bg-emerald-100 text-emerald-800 text-[10px] font-extrabold px-2 py-0.5 rounded-full uppercase tracking-wider flex items-center gap-0.5"><Check className="w-3 h-3" /> Pagar Conta</span>}
                            <span className="text-[10px] text-slate-400 ml-auto font-medium">{tText("Revisão de Dados")}</span>
                          </div>
      
                          {/* Display Data Elements */}
                          <div className="space-y-1.5 text-xs text-slate-600">
                            {msg.parsedData.type === 'delete_transaction' ? (
                              msg.parsedData.allMatches && msg.parsedData.allMatches.length > 1 ? (
                                <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                                  <p className="text-[10px] text-slate-450 font-bold uppercase tracking-wider mb-1">Qual lançamento você deseja excluir?</p>
                                  {msg.parsedData.allMatches.map((item: any) => {
                                    const isSel = (selectedItemIds[msg.id] || msg.parsedData!.payload.id) === item.id;
                                    return (
                                      <div
                                        key={item.id}
                                        onClick={() => setSelectedItemIds(prev => ({ ...prev, [msg.id]: item.id }))}
                                        className={`p-2 rounded-xl border text-left cursor-pointer transition-all flex items-center justify-between gap-2.5 ${
                                          isSel
                                            ? 'border-indigo-600 bg-indigo-50/45 text-indigo-950 font-bold'
                                            : 'border-slate-200 hover:border-slate-300 text-slate-700 bg-slate-50/50'
                                        }`}
                                      >
                                        <div className="space-y-0.5 truncate flex-1">
                                          <p className="text-xs font-bold text-slate-900 truncate">{item.description}</p>
                                          <div className="flex items-center gap-1 text-[9px] text-slate-500 font-medium">
                                            <span className={`px-1 rounded ${item.type === 'earnings' ? 'bg-emerald-100 text-emerald-850' : 'bg-rose-100 text-rose-850'}`}>
                                              {item.type === 'earnings' ? 'Ganho' : 'Gasto'}
                                            </span>
                                            <span>•</span>
                                            <span>{item.date?.split('-').reverse().join('/')}</span>
                                          </div>
                                        </div>
                                        <span className={`text-xs font-extrabold shrink-0 ${item.type === 'earnings' ? 'text-emerald-600' : 'text-rose-600'}`}>
                                          {item.type === 'earnings' ? '+' : '-'}{formatCurrency(item.amount, currency)}
                                        </span>
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
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
                              )
                            ) : msg.parsedData.type === 'delete_bill' ? (
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
                                  <span className="text-slate-400">{tText("Vencimento:")}</span>
                                  <span className="font-semibold text-amber-700">{msg.parsedData.payload.dueDate.split('-').reverse().join('/')}</span>
                                </div>
                              </>
                            ) : msg.parsedData.type === 'delete_investment' ? (
                              <>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{tText("Nome:")}</span>
                                  <span className="font-bold text-slate-800">{msg.parsedData.payload.name}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{tText("Investido:")}</span>
                                  <span className="font-extrabold text-rose-600">-{formatCurrency(msg.parsedData.payload.amountInvested, currency)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-slate-400">{tText("Instituição:")}</span>
                                  <span className="font-bold text-slate-800 flex items-center gap-1"><Building2 className="w-3 h-3 text-slate-400" /> {msg.parsedData.payload.broker}</span>
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
                              className="flex-1 py-1.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-650 hover:bg-slate-50 transition-all cursor-pointer flex items-center justify-center gap-1"
                            >
                              <X className="w-3.5 h-3.5" />
                              {tText("Cancelar")}
                            </button>
                            <button
                              onClick={() => {
                                const selectedId = selectedItemIds[msg.id] || msg.parsedData!.payload.id;
                                const finalPayload = msg.parsedData!.allMatches?.find((item: any) => item.id === selectedId) || msg.parsedData!.payload;
                                confirmParsedData(msg.id, msg.parsedData!.type, finalPayload);
                              }}
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
            {/* Shortcuts/Quick commands */}
            <div className="flex flex-wrap gap-1.5 sm:gap-2 mb-3">
              {[
                { tag: '/ganho', label: 'Ganho', desc: 'ex: /ganho Freelance R$ 1500', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100/70' },
                { tag: '/gasto', label: 'Gasto', desc: 'ex: /gasto Almoço R$ 45', color: 'bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100/70' },
                { tag: '/contas', label: 'Conta', desc: 'ex: /contas Internet R$ 120 dia 10', color: 'bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100/70' },
                { tag: '/metas', label: 'Meta', desc: 'ex: /metas Viagem R$ 5000', color: 'bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100/70' },
                { tag: '/investimentos', label: 'Investimento', desc: 'ex: /investimentos CDB R$ 1000', color: 'bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100/70' },
              ].map((cmd) => (
                <button
                  key={cmd.tag}
                  type="button"
                  onClick={() => {
                    setInput(cmd.tag + ' ');
                    const el = document.getElementById('chat-input');
                    if (el) el.focus();
                  }}
                  title={cmd.desc}
                  className={`px-2 py-0.5 sm:px-2.5 sm:py-1 text-[10px] sm:text-xs rounded-lg border font-medium flex items-center gap-1 transition-colors cursor-pointer ${cmd.color}`}
                >
                  <span className="font-bold">{cmd.tag}</span>
                  <span className="opacity-85 text-[9px] sm:text-[10px]">({cmd.label})</span>
                </button>
              ))}
            </div>

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
                placeholder={tText("Use as tags acima ou diga o que registrar (ex: Gastei R$ 50 com Uber)...")}
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
        </>
      )}

      {/* Side help panel for tags explanation with examples */}
      <AnimatePresence>
        {showHelpSidebar && (
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 220 }}
            className="absolute top-0 right-0 h-full w-full sm:w-[350px] bg-white border-l border-slate-200 z-30 shadow-2xl flex flex-col"
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50 shrink-0">
              <div className="flex items-center gap-2 text-slate-900">
                <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                  <Sparkles className="w-4 h-4 animate-pulse" />
                </div>
                <div>
                  <h4 className="font-extrabold text-xs sm:text-sm tracking-tight uppercase">{tText("Guia de Tags Rápidas")}</h4>
                  <p className="text-[10px] text-slate-500">{tText("Comande a assistente com rapidez")}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowHelpSidebar(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-all cursor-pointer border border-transparent hover:border-slate-200"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Sidebar Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <p className="text-[11px] text-slate-600 leading-relaxed">
                {tText("Você pode utilizar as tags abaixo no início da sua mensagem para automatizar registros e faturamentos de forma rápida. Clique sobre qualquer exemplo para usá-lo imediatamente no chat:")}
              </p>

              <div className="space-y-3.5">
                {[
                  {
                    tag: '/ganho',
                    title: tText('Ganho / Entrada'),
                    desc: tText('Registra um ganho financeiro direto (ex: salário, freelance ou pix recebido).'),
                    color: 'bg-emerald-500 text-white',
                    bgColor: 'bg-emerald-50/30 border-emerald-100/70',
                    examples: [
                      '/ganho Freelance R$ 1500',
                      '/ganho Salário R$ 4200'
                    ]
                  },
                  {
                    tag: '/gasto',
                    title: tText('Gasto / Saída'),
                    desc: tText('Registra uma nova despesa ou débito na sua carteira.'),
                    color: 'bg-rose-500 text-white',
                    bgColor: 'bg-rose-50/30 border-rose-100/70',
                    examples: [
                      '/gasto Almoço R$ 45',
                      '/gasto Uber R$ 25'
                    ]
                  },
                  {
                    tag: '/contas',
                    title: tText('Conta Mensal / Boleto'),
                    desc: tText('Agenda contas mensais, boletos ou faturas definindo um dia de vencimento.'),
                    color: 'bg-amber-500 text-white',
                    bgColor: 'bg-amber-50/30 border-amber-100/70',
                    examples: [
                      '/contas Internet R$ 120 dia 10',
                      '/contas Energia R$ 180 dia 5'
                    ]
                  },
                  {
                    tag: '/metas',
                    title: tText('Meta Financeira'),
                    desc: tText('Cria um novo objetivo ou meta de reserva/compras futura.'),
                    color: 'bg-blue-500 text-white',
                    bgColor: 'bg-blue-50/30 border-blue-100/70',
                    examples: [
                      '/metas Viagem R$ 5000',
                      '/metas Notebook R$ 3500'
                    ]
                  },
                  {
                    tag: '/investimentos',
                    title: tText('Investimento'),
                    desc: tText('Registra um aporte ou alocação de fundos, CDBs, ações ou cripto.'),
                    color: 'bg-indigo-500 text-white',
                    bgColor: 'bg-indigo-50/30 border-indigo-100/70',
                    examples: [
                      '/investimentos CDB R$ 1000',
                      '/investimentos Ações Petrobras R$ 500'
                    ]
                  }
                ].map((item) => (
                  <div key={item.tag} className={`p-3 rounded-2xl border ${item.bgColor} space-y-2`}>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-extrabold tracking-wide uppercase ${item.color}`}>
                        {item.tag}
                      </span>
                      <h5 className="font-extrabold text-[11px] text-slate-800">{item.title}</h5>
                    </div>
                    <p className="text-[10px] text-slate-500 leading-normal">{item.desc}</p>
                    
                    <div className="space-y-1.5 pt-1 border-t border-slate-100/30">
                      <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wider block">
                        {tText("Clique para copiar ao chat:")}
                      </span>
                      <div className="flex flex-col gap-1">
                        {item.examples.map((ex, idx) => (
                          <button
                            key={idx}
                            type="button"
                            onClick={() => {
                              setInput(ex);
                              setShowHelpSidebar(false);
                              const el = document.getElementById('chat-input');
                              if (el) {
                                el.focus();
                                // Set cursor at end of input
                                setTimeout(() => {
                                  (el as HTMLInputElement).selectionStart = (el as HTMLInputElement).selectionEnd = ex.length;
                                }, 50);
                              }
                            }}
                            className="text-left w-full px-2.5 py-1.5 rounded-xl bg-white border border-slate-100 hover:border-indigo-200 hover:bg-indigo-50/30 text-[10px] text-slate-600 font-mono transition-all flex items-center justify-between group cursor-pointer"
                          >
                            <span>{ex}</span>
                            <span className="text-[9px] font-semibold text-indigo-500 opacity-0 group-hover:opacity-100 transition-opacity">
                              {tText("Usar →")}
                            </span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="p-3.5 bg-slate-50 border border-slate-100 rounded-2xl space-y-1.5">
                <h5 className="font-extrabold text-[11px] text-slate-800 uppercase tracking-wider flex items-center gap-1">
                  <span>💡</span> {tText("Remoção e Exclusões")}
                </h5>
                <p className="text-[10px] text-slate-500 leading-relaxed">
                  {tText("Você pode remover lançamentos conversando naturalmente com a assistente, por exemplo:")}
                  <br />
                  <span className="font-mono text-slate-700 bg-white border border-slate-100 px-1.5 py-0.5 rounded text-[9px] mt-1 inline-block">
                    "Excluir gasto Uber de R$ 25"
                  </span>
                  <br />
                  {tText("A IA identificará o item correspondente e solicitará sua confirmação antes de apagar permanentemente.")}
                </p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
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
