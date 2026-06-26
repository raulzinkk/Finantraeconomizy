import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'pt-BR' | 'en' | 'es';

export interface TranslationDictionary {
  // Navigation / Tabs
  navDashboard: string;
  navTransactions: string;
  navBills: string;
  navInvestments: string;
  navAuth: string;
  navConfig: string;
  navTitle: string;
  navSub: string;

  // Common UI / Buttons
  add: string;
  delete: string;
  edit: string;
  save: string;
  cancel: string;
  confirm: string;
  close: string;
  success: string;
  warning: string;
  error: string;
  loading: string;
  all: string;
  private: string;
  downloadApkTitle: string;
  downloadApkDesc: string;
  downloadApkBtn: string;
  reopenInitialChoice: string;
  available: string;

  // Presentation Landing
  landingBadge: string;
  landingTitlePrefix: string;
  landingTitleHighlight: string;
  landingDesc: string;
  landingStartFree: string;
  landingLoginSecure: string;
  benefit1Title: string;
  benefit1Desc: string;
  benefit2Title: string;
  benefit2Desc: string;
  benefit3Title: string;
  benefit3Desc: string;
  benefit4Title: string;
  benefit4Desc: string;
  manifestoTitle: string;
  manifestoDesc: string;

  // Language selection labels
  langPt: string;
  langEn: string;
  langEs: string;
  selectLanguage: string;
}

const translations: Record<Language, TranslationDictionary> = {
  'pt-BR': {
    navDashboard: 'Painel Geral',
    navTransactions: 'Ganhos & Gastos',
    navBills: 'Contas do Mês',
    navInvestments: 'Investimentos',
    navAuth: 'Minha Conta',
    navConfig: 'Ajustes & Banco',
    navTitle: 'FINANTRA',
    navSub: 'Controle Financeiro Autônomo',
    add: 'Adicionar',
    delete: 'Excluir',
    edit: 'Editar',
    save: 'Salvar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Fechar',
    success: 'Sucesso',
    warning: 'Aviso',
    error: 'Erro',
    loading: 'Carregando...',
    all: 'Todos',
    private: 'Privado',
    downloadApkTitle: 'Aplicativo Oficial Finantra Android (APK)',
    downloadApkDesc: 'Prefere gerenciar suas finanças diretamente pelo celular? Baixe a versão nativa Android para ter maior agilidade, estabilidade e total controle offline na palma da mão.',
    downloadApkBtn: 'Baixar APK do Aplicativo (Android)',
    reopenInitialChoice: 'Reabrir Seleção de Modo Inicial',
    available: 'Disponível',
    landingBadge: 'Soberania e Transparência Financeira',
    landingTitlePrefix: 'Gerencie seu Dinheiro Seguro com ',
    landingTitleHighlight: 'Finantra',
    landingDesc: 'Sem conexões com contas de bancos reais ou vazamento de segredos pessoais. Controle seus ganhos, teto de despesas e investimentos em total sigilo.',
    landingStartFree: 'Começar Agora Grátis',
    landingLoginSecure: 'Fazer Login Seguro',
    benefit1Title: 'Regência de Gastos e Receitas',
    benefit1Desc: 'Ordene suas faturas mensais, ganhos avulsos ou salários recorrentes por categorias intuitivas. Entenda de onde veio e para onde caminha cada centavo de suas reservas.',
    benefit2Title: 'Teto de Gastos com Alertas Sutis',
    benefit2Desc: 'Evite sustos no fim do mês! Defina o limite de gastos desejado para alimentação, lazer ou transporte e receba avisos discretos e elegantes quando estiver perto do teto planejado.',
    benefit3Title: 'Metas de Poupança & Aportes',
    benefit3Desc: 'Estabeleça ambições de ganhos ou aportes financeiros e receba alertas inteligentes assim que bater 50% ou 100% da sua meta pessoal de poupança no mês.',
    benefit4Title: 'Nuvem Online Finantra',
    benefit4Desc: 'Esqueça o termo expositivo. Conecte sua carteira na Nuvem Online Finantra para desfrutar de total mobilidade multidispositivos, sem abdicar da robustez local do seu navegador.',
    manifestoTitle: 'Sua segurança é o nosso alicerce',
    manifestoDesc: 'O Finantra foi construído sob um manifesto rígido: zero conexões ativas bancárias, prevenindo golpes e retiradas automáticas. Todo o controle é preenchido manualmente, com privacidade de ponta criptografada diretamente.',
    langPt: 'Português',
    langEn: 'English',
    langEs: 'Español',
    selectLanguage: 'Selecionar Idioma',
  },
  'en': {
    navDashboard: 'Dashboard',
    navTransactions: 'Earnings & Expenses',
    navBills: 'Monthly Bills',
    navInvestments: 'Investments',
    navAuth: 'My Account',
    navConfig: 'Settings & Cloud',
    navTitle: 'FINANTRA',
    navSub: 'Autonomous Financial Control',
    add: 'Add',
    delete: 'Delete',
    edit: 'Edit',
    save: 'Save',
    cancel: 'Cancel',
    confirm: 'Confirm',
    close: 'Close',
    success: 'Success',
    warning: 'Warning',
    error: 'Error',
    loading: 'Loading...',
    all: 'All',
    private: 'Private',
    downloadApkTitle: 'Official Finantra Android App (APK)',
    downloadApkDesc: 'Do you prefer to manage your finances directly on your phone? Download the native Android version for greater agility, stability, and total offline control in the palm of your hand.',
    downloadApkBtn: 'Download App APK (Android)',
    reopenInitialChoice: 'Reopen Initial Mode Selection',
    available: 'Available',
    landingBadge: 'Sovereignty and Financial Transparency',
    landingTitlePrefix: 'Manage Your Secure Money with ',
    landingTitleHighlight: 'Finantra',
    landingDesc: 'No connections to real bank accounts or leaking of personal secrets. Control your earnings, spending limits, and investments in complete confidentiality.',
    landingStartFree: 'Get Started Free',
    landingLoginSecure: 'Secure Login',
    benefit1Title: 'Control of Expenses and Earnings',
    benefit1Desc: 'Organize your monthly bills, separate earnings, or recurring salaries into intuitive categories. Understand where every penny of your reserves comes from and goes to.',
    benefit2Title: 'Spending Limits with Subtle Alerts',
    benefit2Desc: 'Avoid end-of-the-month surprises! Set the desired spending limit for food, leisure, or transport and receive elegant notices when you are close to the planned ceiling.',
    benefit3Title: 'Savings Goals & Contributions',
    benefit3Desc: 'Establish earnings or financial contribution ambitions and receive smart alerts as soon as you hit 50% or 100% of your personal savings goal for the month.',
    benefit4Title: 'Finantra Online Cloud',
    benefit4Desc: 'Forget the expository term. Connect your wallet to the Finantra Online Cloud to enjoy complete multi-device mobility without relinquishing your browser\'s local robustness.',
    manifestoTitle: 'Your safety is our foundation',
    manifestoDesc: 'Finantra was built on a rigid manifesto: zero active bank connections, preventing scams and automatic withdrawals. All control is entered manually, with state-of-the-art privacy encrypted directly.',
    langPt: 'Portuguese',
    langEn: 'English',
    langEs: 'Spanish',
    selectLanguage: 'Select Language',
  },
  'es': {
    navDashboard: 'Panel General',
    navTransactions: 'Ganancias y Gastos',
    navBills: 'Cuentas del Mes',
    navInvestments: 'Inversiones',
    navAuth: 'Mi Cuenta',
    navConfig: 'Ajustes y Nube',
    navTitle: 'FINANTRA',
    navSub: 'Control Financiero Autónomo',
    add: 'Añadir',
    delete: 'Eliminar',
    edit: 'Editar',
    save: 'Guardar',
    cancel: 'Cancelar',
    confirm: 'Confirmar',
    close: 'Cerrar',
    success: 'Éxito',
    warning: 'Aviso',
    error: 'Error',
    loading: 'Cargando...',
    all: 'Todos',
    private: 'Privado',
    downloadApkTitle: 'Aplicación Oficial Finantra Android (APK)',
    downloadApkDesc: '¿Prefiere gestionar sus finanzas directamente en su celular? Descargue la versión nativa de Android para disfrutar de mayor agilidad, estabilidad y control total fuera de línea en la palma de su mano.',
    downloadApkBtn: 'Descargar APK de la Aplicación (Android)',
    reopenInitialChoice: 'Reabrir Selección de Modo Inicial',
    available: 'Disponible',
    landingBadge: 'Soberanía y Transparencia Financiera',
    landingTitlePrefix: 'Gestione su Dinero Seguro con ',
    landingTitleHighlight: 'Finantra',
    landingDesc: 'Sin conexiones a cuentas bancarias reales ni filtración de secretos personales. Controle sus ingresos, topes de gastos e inversiones en total confidencialidad.',
    landingStartFree: 'Comenzar Ahora Gratis',
    landingLoginSecure: 'Iniciar Sesión Seguro',
    benefit1Title: 'Gestión de Gastos e Ingresos',
    benefit1Desc: 'Ordene sus facturas mensuales, ingresos ocasionales o salarios recurrentes por categorías intuitivas. Comprenda de dónde proviene y a dónde se destina cada centavo de sus reservas.',
    benefit2Title: 'Tope de Gastos con Alertas Sutiles',
    benefit2Desc: '¡Evite sorpresas a fin de mes! Defina el límite de gastos deseado para alimentación, ocio o transporte y reciba avisos discretos y elegantes cuando esté cerca del tope planificado.',
    benefit3Title: 'Metas de Ahorro y Aportes',
    benefit3Desc: 'Establezca aspiraciones de ingresos o aportes financieros y reciba alertas inteligentes tan pronto como alcance el 50% o el 100% de su meta de ahorro personal del mes.',
    benefit4Title: 'Nube Online Finantra',
    benefit4Desc: 'Olvídese del término expositivo. Conecte su cartera en la Nube Online Finantra para disfrutar de total movilidad multidispositivo, sin renunciar a la robustez local de su navegador.',
    manifestoTitle: 'Su seguridad es nuestro pilar',
    manifestoDesc: 'Finantra fue construido bajo un manifiesto rígido: cero conexiones bancarias activas, previniendo estafas y retiros automáticos. Todo el control se ingresa manualmente, con privacidad de vanguardia encriptada directamente.',
    langPt: 'Portugués',
    langEn: 'Inglés',
    langEs: 'Español',
    selectLanguage: 'Seleccionar Idioma',
  }
};

interface LanguageContextProps {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: TranslationDictionary;
  tText: (ptText: string) => string;
}

const LanguageContext = createContext<LanguageContextProps | undefined>(undefined);

const DICTIONARY: Record<string, { en: string; es: string }> = {
  // General Tabs / Sidebars
  "Painel Geral": { en: "Dashboard", es: "Panel General" },
  "Ganhos & Gastos": { en: "Earnings & Expenses", es: "Ganancias y Gastos" },
  "Contas do Mês": { en: "Monthly Bills", es: "Cuentas del Mes" },
  "Investimentos": { en: "Investments", es: "Inversiones" },
  "Minha Conta": { en: "My Account", es: "Mi Cuenta" },
  "Ajustes & Banco": { en: "Settings & Cloud", es: "Ajustes y Nube" },
  "Acesso & Login": { en: "Access & Login", es: "Acceso e Inicio" },

  // Dashboard / FinanceSummary
  "Saldo em Conta": { en: "Account Balance", es: "Saldo en Cuenta" },
  "Disponível para uso imediato": { en: "Available for immediate use", es: "Disponible para uso inmediato" },
  "Total de Entradas": { en: "Total Income", es: "Ingresos Totales" },
  "Todo o capital recebido no período": { en: "All capital received in period", es: "Capital total recibido en el periodo" },
  "Total de Saídas": { en: "Total Expenses", es: "Gastos Totales" },
  "Despesas gerais no período": { en: "General expenses in period", es: "Gastos generales en el periodo" },
  "Patrimônio Líquido": { en: "Net Worth", es: "Patrimonio Neto" },
  "Liquidez + Investimentos atuais": { en: "Liquidity + current investments", es: "Liquidez + inversiones actuales" },
  "Taxa de Aporte": { en: "Contribution Rate", es: "Tasa de Aporte" },
  "Gerado": { en: "Generated", es: "Generado" },
  "da sua renda mensal total": { en: "of your total monthly income", es: "de sus ingresos mensuales totales" },
  "Patrimônio Consolidado": { en: "Consolidated Equity", es: "Patrimonio Consolidado" },
  "Saldo": { en: "Balance", es: "Saldo" },
  "Aplicações": { en: "Investments", es: "Inversiones" },
  "Resta para quitar": { en: "Remaining to pay", es: "Resta pagar" },
  "de": { en: "of", es: "de" },
  "Contas": { en: "Bills", es: "Cuentas" },
  "Tudo sob controle!": { en: "Everything under control!", es: "¡Todo bajo control!" },
  "Sua saúde financeira está em equilíbrio. Cadastre metas e limites de gastos para ver notificações aqui.": { en: "Your financial health is in balance. Register goals and spending limits to see notifications here.", es: "Su salud financiera está en equilibrio. Registre metas y límites de gastos para ver notificaciones aquí." },
  "Central de Alertas & Notificações": { en: "Alerts & Notifications Hub", es: "Centro de Alertas y Notificaciones" },
  "Informativos automáticos e discretos sobre suas metas domésticas e tetos de gastos ativos.": { en: "Automatic and discreet reports on your active household goals and spending ceilings.", es: "Informes automáticos y discretos sobre sus metas domésticas y topes de gastos activos." },
  "Ganhos do Mês": { en: "Monthly Earnings", es: "Ganancias del Mes" },
  "Gastos Registrados": { en: "Registered Expenses", es: "Gastos Registrados" },
  "Investimentos Ativos": { en: "Active Investments", es: "Inversiones Activas" },
  "Ganhos (-) Gastos (-) Contas Pagas": { en: "Earnings (-) Expenses (-) Paid Bills", es: "Ganancias (-) Gastos (-) Cuentas Pagadas" },
  "lançamentos ativos": { en: "active transactions", es: "transacciones activas" },
  "compras manuais": { en: "manual purchases", es: "compras manuales" },
  "rendimento total estimado": { en: "estimated total yield", es: "rendimiento total estimado" },
  "Porcentagem de receitas investida em investimentos ou poupança neste mês.": { en: "Percentage of income invested in investments or savings this month.", es: "Porcentaje de ingresos invertidos en inversiones o ahorros este mes." },
  "Seu saldo em conta somado ao valor de mercado de todas as suas aplicações ativas hoje.": { en: "Your account balance plus the market value of all your active investments today.", es: "El saldo de su cuenta más el valor de mercado de todas sus inversiones activas hoy." },
  "Metas & Alertas Ativos": { en: "Active Goals & Alerts", es: "Metas y Alertas Activas" },
  "Nenhuma notificação relevante no momento.": { en: "No relevant notifications at the moment.", es: "Ninguna notificación relevante en este momento." },
  "Seu comportamento financeiro está exemplar este mês!": { en: "Your financial behavior is exemplary this month!", es: "¡Su comportamiento financiero es ejemplar este mes!" },
  "Comportamento de Despesas por Categoria": { en: "Expense Behavior by Category", es: "Comportamiento de Gastos por Categoría" },
  "Distribuição de Saídas por Categoria": { en: "Expense Distribution by Category", es: "Distribución de Gastos por Categoría" },
  "Despesas manuais unidas às faturas do mês dadas como quitadas. do mês dadas como quitadas.": { en: "Manual expenses combined with monthly bills marked as paid.", es: "Gastos manuales combinados con facturas del mes marcadas como pagadas." },
  "Nenhuma despesa para exibir": { en: "No expenses to display", es: "Ningún gasto para mostrar" },
  "Insira gastos na aba correspondente para gerar gráficos": { en: "Insert expenses in the corresponding tab to generate charts", es: "Ingrese gastos en la pestaña correspondiente para generar gráficos" },
  "Alocação de Investimentos": { en: "Investment Allocation", es: "Asignación de Inversiones" },
  "Valor de mercado estimado dos ativos segmentados por classe.": { en: "Estimated market value of assets segmented by class.", es: "Valor de mercado estimado de los activos segmentados por clase." },
  "Nenhum investimento cadastrado": { en: "No investments registered", es: "Ninguna inversión registrada" },
  "Aplique na aba de investimentos para mapear o portfólio": { en: "Apply in the investments tab to map the portfolio", es: "Invierta en la pestaña de inversiones para mapear la cartera" },
  "Métricas de Fluxo Geral": { en: "General Flow Metrics", es: "Métricas de Flujo General" },
  "Comparativo entre suas Entradas Totais obtidas, as Saídas consolidadas (gastos + contas quitadas) e o Aporte Total em investimentos.": { en: "Comparison between your Total Earnings obtained, consolidated Expenses (spending + settled bills) and Total Contribution in investments.", es: "Comparación entre sus Ingresos Totales obtenidos, Gastos consolidados (egresos + cuentas pagadas) y el Aporte Total en inversiones." },
  "Renda Fixa": { en: "Fixed Income", es: "Renta Fija" },
  "Ações": { en: "Stocks", es: "Acciones" },
  "Fundos Imobiliários": { en: "Real Estate Funds", es: "Fondos Inmobiliarios" },
  "Cripto": { en: "Crypto", es: "Cripto" },
  "Gráfico de Pizza das Saídas": { en: "Expenses Pie Chart", es: "Gráfico de Torta de Gastos" },
  "Não há despesas ou faturas pagas registradas para gerar o gráfico.": { en: "There are no registered expenses or paid bills to generate the chart.", es: "No hay gastos ni facturas pagas registradas para generar el gráfico." },
  "Alocação do Portfólio de Investimentos": { en: "Investment Portfolio Allocation", es: "Asignación de Cartera de Inversiones" },
  "Distribuição por tipo de ativo": { en: "Distribution by asset type", es: "Distribución por tipo de activo" },
  "Não há investimentos registrados para exibir a composição.": { en: "There are no registered investments to display the allocation.", es: "No hay inversiones registradas para mostrar la composición." },
  "Fluxo Mensal Comparativo": { en: "Monthly Comparative Flow", es: "Flujo Mensual Comparativo" },
  "Entradas x Saídas x Aportes": { en: "Income vs Expenses vs Investments", es: "Ingresos vs Gastos vs Inversiones" },
  "Resumo Mensal": { en: "Monthly Summary", es: "Resumen Mensual" },
  "Entradas": { en: "Income", es: "Ingresos" },
  "Saídas": { en: "Expenses", es: "Gastos" },
  "Investido": { en: "Invested", es: "Invertido" },
  "Teto de Despesas e Alertas": { en: "Spending Ceiling and Alerts", es: "Tope de Gastos y Alertas" },
  "Acompanhamento em tempo real baseado nas configurações": { en: "Real-time tracking based on settings", es: "Seguimiento en tiempo real basado en la configuración" },
  "Teto de Gastos Ativos por Categoria": { en: "Active Spending Limits by Category", es: "Tope de Gastos Activos por Categoría" },
  "Progresso do seu limite planejado por categoria neste mês (gastos + contas quitadas).": { en: "Progress of your planned limit by category this month (expenses + paid bills).", es: "Progreso de su límite planificado por categoría este mes (gastos + cuentas pagadas)." },
  "Nenhum limite cadastrado": { en: "No limits registered", es: "Ningún límite registrado" },
  "Você pode planejar um teto para Alimentação, Lazer e outras categorias diretamente na aba de": { en: "You can plan a limit for Food, Leisure and other categories directly on the tab", es: "Puede planificar un tope para Alimentación, Ocio y otras categorías directamente en la pestaña" },
  "Aviso": { en: "Notice", es: "Aviso" },
  "Avisos": { en: "Notices", es: "Avisos" },
  "Limite": { en: "Limit", es: "Límite" },
  "Gasto": { en: "Spent", es: "Gastado" },
  "Você atingiu": { en: "You have reached", es: "Ha alcanzado" },
  "do teto planejado!": { en: "of the planned limit!", es: "del tope planificado!" },
  "Meta de Ganhos: 50% Alcançada": { en: "Income Goal: 50% Reached", es: "Meta de Ingresos: 50% Alcanzada" },
  "Meta de Ganhos: 100% Alcançada": { en: "Income Goal: 100% Reached", es: "Meta de Ingresos: 100% Alcanzada" },
  "Meta de Investimento: 50% Alcançada": { en: "Investment Goal: 50% Reached", es: "Meta de Inversiones: 50% Alcanzada" },
  "Meta de Investimento: 100% Alcançada": { en: "Investment Goal: 100% Reached", es: "Meta de Inversiones: 100% Alcanzada" },
  "Alerta de Teto Excedido": { en: "Overlimit Spending Alert", es: "Alerta de Tope Excedido" },
  "Alerta de Teto Próximo": { en: "Approaching Spending Limit Alert", es: "Alerta de Tope Cercano" },
  "Conta Vencida!": { en: "Bill Overdue!", es: "¡Factura Vencida!" },
  "Vence em Breve": { en: "Due Soon", es: "Vence Pronto" },
  "está vencida desde": { en: "is overdue since", es: "está vencida desde" },
  "atraso de": { en: "delayed by", es: "retraso de" },
  "dia": { en: "day", es: "día" },
  "dias": { en: "days", es: "días" },
  "vence": { en: "is due", es: "vence" },
  "HOJE": { en: "TODAY", es: "HOY" },
  "amanhã": { en: "tomorrow", es: "mañana" },
  "em": { en: "in", es: "en" },

  // Ganhos & Gastos / TransactionsTab
  "Ganhos e Gastos": { en: "Earnings and Expenses", es: "Ganancias y Gastos" },
  "Registro e categorização de todas as movimentações financeiras": { en: "Registration and categorization of all financial movements", es: "Registro y categorización de todos los movimientos financieros" },
  "Nova Transação": { en: "New Transaction", es: "Nueva Transacción" },
  "Entrada (Ganho)": { en: "Income (Earnings)", es: "Ingreso (Ganancia)" },
  "Saída (Despesa)": { en: "Expense", es: "Egreso (Gasto)" },
  "Tipo de Movimentação": { en: "Movement Type", es: "Tipo de Movimiento" },
  "Valor do Lançamento": { en: "Transaction Amount", es: "Monto del Lanzamiento" },
  "Data da Movimentação": { en: "Transaction Date", es: "Fecha del Movimiento" },
  "Categoria": { en: "Category", es: "Categoría" },
  "Alimentação": { en: "Food", es: "Alimentación" },
  "Lazer": { en: "Leisure", es: "Ocio" },
  "Transporte": { en: "Transport", es: "Transporte" },
  "Saúde": { en: "Health", es: "Salud" },
  "Moradia": { en: "Housing", es: "Vivienda" },
  "Salário": { en: "Salary", es: "Salario" },
  "Rendimento de Investimento": { en: "Investment Yield", es: "Rendimiento de Inversión" },
  "Ganhos Avulsos": { en: "Freelance/Other Income", es: "Ingresos Diversos" },
  "Outros": { en: "Others", es: "Otros" },
  "Descrição / Nome": { en: "Description / Name", es: "Descripción / Nombre" },
  "Ex: Supermercado, Aluguel, Uber...": { en: "e.g., Supermarket, Rent, Uber...", es: "Ej: Supermercado, Alquiler, Uber..." },
  "Ex: Salário Mensal, Freelance...": { en: "e.g., Monthly Salary, Freelance...", es: "Ej: Salario Mensal, Freelance..." },
  "Adicionar Movimentação": { en: "Add Movement", es: "Añadir Movimiento" },
  "Histórico de Transações": { en: "Transaction History", es: "Historial de Transacciones" },
  "Filtrar por Tipo": { en: "Filter by Type", es: "Filtrar por Tipo" },
  "Todas": { en: "All", es: "Todas" },
  "Todos": { en: "All", es: "Todos" },
  "Ganhos": { en: "Income", es: "Ganancias" },
  "Gastos": { en: "Expenses", es: "Gastos" },
  "Entradas Apenas": { en: "Income Only", es: "Solo Ingresos" },
  "Saídas Apenas": { en: "Expenses Only", es: "Solo Gastos" },
  "A regra dos 50/30/20 indica: 50% de ganhos para necessidades, 30% desejos pessoais e 20% guardados ou investidos.": {
    en: "The 50/30/20 rule indicates: 50% of earnings for needs, 30% for personal wants, and 20% saved or invested.",
    es: "La regla 50/30/20 indica: 50% de ingresos para necesidades, 30% para deseos personales y 20% ahorrados o invertidos."
  },
  "Tenha uma Reserva de Emergência equivalendo a pelo menos 6 meses das suas despesas básicas mensais estruturadas.": {
    en: "Have an Emergency Fund equivalent to at least 6 months of your basic monthly expenses.",
    es: "Tenga un Fondo de Emergencia equivalente a al menos 6 meses de sus gastos mensuales básicos."
  },
  "Evite comprar parcelado itens de consumo imediato. Se não cabe no seu orçamento hoje, melhor adiar e pagar à vista.": {
    en: "Avoid installment plans for immediate consumption items. If you cannot afford it today, better wait and buy in full.",
    es: "Evite comprar a plazos artículos de consumo inmediato. Si no cabe en su presupuesto hoy, mejor espere y pague al contado."
  },
  "Revise as assinaturas ativas mensalmente. Serviços que você não utiliza drenam discretamente seu saldo poupador.": {
    en: "Review active subscriptions monthly. Services you don't use quietly drain your savings balance.",
    es: "Revise las suscripciones activas mensualmente. Los servicios que no utiliza agotan discretamente sus ahorros."
  },
  "A inflação corrói o poder de compra do dinheiro físico. Aplique suas reservas para obter rendimentos reais.": {
    en: "Inflation erodes the purchasing power of physical cash. Invest your reserves to achieve real returns.",
    es: "La inflación erosiona el poder adquisitivo del efectivo físico. Invierta sus reservas para obtener rendimientos reales."
  },
  "Antes de fazer uma compra maior, aguarde 24 horas. Muitas vezes a necessidade passa e era apenas desejo momentâneo.": {
    en: "Before making a major purchase, wait 24 hours. Often the perceived need passes and it was just a temporary desire.",
    es: "Antes de realizar una compra importante, espere 24 horas. Muchas veces la necesidad percibida pasa y solo era un deseo temporal."
  },
  "Insira uma descrição válida!": { en: "Please enter a valid description!", es: "¡Por favor ingrese una descripción válida!" },
  "Insira um valor maior que R$ 0,00!": { en: "Please enter a value greater than $ 0.00!", es: "¡Por favor ingrese un valor mayor que $ 0.00!" },
  "Ver todas categorias": { en: "View all categories", es: "Ver todas las categorías" },
  "Buscar por descrição...": { en: "Search by description...", es: "Buscar por descripción..." },
  "Lançar Transação": { en: "Add Transaction", es: "Añadir Transacción" },
  "Novo Lançamento Financeiro": { en: "New Financial Transaction", es: "Nueva Transacción Financiera" },
  "Tipo da Transação": { en: "Transaction Type", es: "Tipo de Transacción" },
  "Gasto / Despesa": { en: "Expense", es: "Gasto / Egreso" },
  "Ganho / Receita": { en: "Income / Revenue", es: "Ganancia / Ingreso" },
  "Ex: Almoço self-service, Freelance, Pix etc...": { en: "e.g., Lunch, Freelance, Wire transfer etc...", es: "Ej: Almuerzo, Freelance, Transferencia etc..." },
  "Ex: 50.00": { en: "e.g., 50.00", es: "Ej: 50.00" },
  "Método de Pagamento": { en: "Payment Method", es: "Método de Pago" },
  "Dinheiro": { en: "Cash", es: "Efectivo" },
  "Cartão de Crédito": { en: "Credit Card", es: "Tarjeta de Crédito" },
  "Cartão de Débito": { en: "Debit Card", es: "Tarjeta de Débito" },
  "Pix": { en: "Pix / Instant Transfer", es: "Pix / Transferencia" },
  "Boleto": { en: "Boleto / Bank Draft", es: "Boleto / Factura" },
  "Observações (Opcional)": { en: "Notes (Optional)", es: "Notas (Opcional)" },
  "Ex: Lanche da tarde no trabalho...": { en: "e.g., Afternoon snack at work...", es: "Ej: Merienda en el trabajo..." },
  "Cancelar": { en: "Cancel", es: "Cancelar" },
  "Salvar Transação": { en: "Save Transaction", es: "Guardar Transacción" },
  "Histórico de Lançamentos": { en: "Transaction History", es: "Historial de Transacciones" },
  "Mostrando": { en: "Showing", es: "Mostrando" },
  "registros": { en: "records", es: "registros" },
  "Nenhuma transação encontrada": { en: "No transactions found", es: "No se encontraron transacciones" },
  "Refine seus filtros acima ou clique em \"Lançar Transação\" para começar.": { en: "Refine your filters above or click \"Add Transaction\" to start.", es: "Refine sus filtros arriba o haga clic en \"Añadir Transacción\" para comenzar." },
  "Lançamento / Categoria": { en: "Transaction / Category", es: "Transacción / Categoría" },
  "Método": { en: "Method", es: "Método" },
  "Sim": { en: "Yes", es: "Sí" },
  "Não": { en: "No", es: "No" },
  "Remover transação": { en: "Remove transaction", es: "Eliminar transacción" },
  "Escolha sua Experiência Finantra": { en: "Choose Your Finantra Experience", es: "Elija su Experiencia Finantra" },
  "Para sua conveniência, o Finantra 6.0 está disponível como aplicativo nativo para Android ou diretamente pelo navegador web.": {
    en: "For your convenience, Finantra 6.0 is available as a native Android app or directly through the web browser.",
    es: "Para su comodidad, Finantra 6.0 está disponible como aplicación nativa para Android o directamente a través del navegador web."
  },
  "Aplicativo Android": { en: "Android App", es: "Aplicación Android" },
  "Celular & Tablet 📱": { en: "Mobile & Tablet 📱", es: "Móvil y Tableta 📱" },
  "Baixe o APK para ter o aplicativo nativo em seu dispositivo. Controle manual rápido e seguro direto no bolso.": {
    en: "Download the APK to have the native app on your device. Fast and secure manual control right in your pocket.",
    es: "Descargue el APK para tener la aplicación nativa en su dispositivo. Control manual rápido y seguro directamente en su bolsillo."
  },
  "Baixar APK": { en: "Download APK", es: "Descargar APK" },
  "Versão Web": { en: "Web Version", es: "Versión Web" },
  "Navegador Atual 💻": { en: "Current Browser 💻", es: "Navegador Actual 💻" },
  "Acesse de forma instantânea sem precisar baixar ou instalar nada. Ideal para computador ou acesso rápido.": {
    en: "Access instantly without downloading or installing anything. Ideal for computers or quick access.",
    es: "Acceda al instante sin necesidad de descargar o instalar nada. Ideal para computadoras o acceso rápido."
  },
  "Continuar na Web": { en: "Continue on Web", es: "Continuar en la Web" },
  "🔒 Controle 100% autônomo.": { en: "🔒 100% autonomous control.", es: "🔒 Control 100% autónomo." },
  "Pular e entrar na Web": { en: "Skip and enter Web", es: "Omitir y entrar a la Web" },
  "Controle Financeiro Autônomo": { en: "Autonomous Financial Control", es: "Control Financiero Autónomo" },
  "Baixar Aplicativo Android (APK)": { en: "Download Android App (APK)", es: "Descargar Aplicación Android (APK)" },
  "Baixar APK Android": { en: "Download Android APK", es: "Descargar APK de Android" },
  "← Apresentação": { en: "← Presentation", es: "← Presentación" },
  "Entrar": { en: "Sign In", es: "Iniciar Sesión" },
  "Abra sua Conta Segura": { en: "Open Your Secure Account", es: "Abra su Cuenta Segura" },
  "Faça Logon Seguramente": { en: "Log In Securely", es: "Inicie Sesión de Forma Segura" },
  "Sem taxas temporárias, cadastros complexos ou perda de privacidade. Sua soberania financeira.": {
    en: "No hidden fees, complex signups, or loss of privacy. Your financial sovereignty.",
    es: "Sin tarifas temporales, registros complejos o pérdida de privacidad. Su soberanía financiera."
  },
  "© 2026 Finantra • Software Próprio de Controle Manual Independente.": {
    en: "© 2026 Finantra • Proprietary Independent Manual Control Software.",
    es: "© 2026 Finantra • Software Propio de Control Manual Independiente."
  },
  "Privacidade Assegurada": { en: "Assured Privacy", es: "Privacidad Asegurada" },
  "Nuvem Online Finantra": { en: "Finantra Online Cloud", es: "Nube Online Finantra" },
  "Privado": { en: "Private", es: "Privado" },
  "Dica Financeira:": { en: "Financial Tip:", es: "Consejo Financiero:" },
  "Conectado como": { en: "Connected as", es: "Conectado como" },
  "Perfil:": { en: "Profile:", es: "Perfil:" },
  "Minha Carteira": { en: "My Wallet", es: "Mi Cartera" },
  "Nuvem Sincronizada": { en: "Cloud Synced", es: "Nube Sincronizada" },
  "Nuvem Desconectada": { en: "Cloud Disconnected", es: "Nube Desconectada" },
  "Modo Local (100% Offline)": { en: "Local Mode (100% Offline)", es: "Modo Local (100% Offline)" },
  "Sincronizar agora": { en: "Sync now", es: "Sincronizar ahora" },
  "Navegação Principal": { en: "Main Navigation", es: "Navegación Principal" },
  "Painel de Resumo Consolidado": { en: "Consolidated Summary Dashboard", es: "Panel de Resumen Consolidado" },
  "Acompanhe de forma prática todos os capitais alocados, custos recorrentes e balanços de caixa.": {
    en: "Track all allocated capitals, recurring costs, and cash balances in a practical way.",
    es: "Siga de manera práctica todos los capitales asignados, costos recurrentes y balances de caja."
  },
  "Meta Saldo Mês": { en: "Monthly Balance Goal", es: "Meta de Saldo Mensal" },
  "conta(s) atrasada(s)": { en: "overdue bill(s)", es: "cuenta(s) vencida(s)" },
  "conta(s) vencendo nos próximos 3 dias": { en: "bill(s) due in the next 3 days", es: "cuenta(s) que vencen en los próximos 3 días" },
  "Gerenciar Ganhos & Gastos": { en: "Manage Earnings & Expenses", es: "Gestionar Ingresos y Gastos" },
  "Mapeie individualmente as despesas eventuais do cotidiano e recebimentos pontuais de freelance ou salário comercial.": {
    en: "Map individual dynamic daily expenses and occasional freelancer or commercial salary earnings.",
    es: "Mapee individualmente los gastos ocasionales cotidianos y los ingresos puntuales de freelance o salario comercial."
  },
  "Agenda de Contas do Mês": { en: "Monthly Bills Schedule", es: "Agenda de Cuentas del Mes" },
  "Gerencie seguros, convênios de saúde, faturas de concessionárias residenciais e serviços recorrentes sem sobressaltos.": {
    en: "Manage insurance, health plans, utility bills, and recurring services smoothly.",
    es: "Gestione seguros, planes de salud, facturas de servicios públicos y servicios recurrentes sin sobresaltos."
  },
  "Monitor de Investimentos Manuais": { en: "Manual Investments Monitor", es: "Monitor de Inversiones Manuales" },
  "Acompanhe cotas de ações, fundos imobiliários aportados, tesouro ou renda fixa, valorizando seu dinheiro sem integradores terceirizados.": {
    en: "Track stock shares, invested real estate funds, treasury, or fixed income, growing your money without third-party integrations.",
    es: "Siga cuotas de acciones, fondos inmobiliarios invertidos, tesoro o renta fija, valorando su dinero sin integradores de terceros."
  },
  "Acesso de Usuário Finantra": { en: "Finantra User Access", es: "Acceso de Usuario Finantra" },
  "Autentique sua conta Finantra com regras de segurança completas contra fraudes ou perdas locais.": {
    en: "Authenticate your Finantra account with complete security measures against fraud or local data loss.",
    es: "Autentique su cuenta Finantra con medidas de seguridad completas contra fraudes o pérdida de datos locales."
  },
  "Propriedades do Perfil & Nuvem": { en: "Profile Properties & Cloud", es: "Propiedades del Perfil y la Nube" },
  "Altere limites planejados, simule carteiras, e configure a sincronização com seu banco de dados na Nuvem Online Finantra.": {
    en: "Change planned limits, simulate portfolios, and configure sync with your cloud database on Finantra Online Cloud.",
    es: "Cambie límites planificados, simule carteras y configure la sincronización con su base de datos en la Nube Online Finantra."
  },
  "Falha ao conectar na API do Supabase.": { en: "Failed to connect to the Supabase API.", es: "Error al conectar con la API de Supabase." },
  "© 2026 Finantra • Software Próprio de Controle Manual de despesas e investimentos.": {
    en: "© 2026 Finantra • Proprietary Manual Control Software for expenses and investments.",
    es: "© 2026 Finantra • Software Propio de Control Manual de gastos e inversiones."
  },
  "Sem Conexões Extras de Terceiros": { en: "No Extra Third-Party Connections", es: "Sin Conexiones Extras de Terceros" },
  "Controle total manual de receitas, despesas, teto de gastos e investimentos.": {
    en: "Total manual control of revenues, expenses, spending limits, and investments.",
    es: "Control manual total de ingresos, egresos, tope de gastos e inversiones."
  },
  "Nenhuma movimentação registrada": { en: "No movements registered", es: "Ningún movimiento registrado" },
  "Cadastre transações no painel acima para gerir seu fluxo de caixa de forma autônoma.": { en: "Register transactions in the panel above to manage your cash flow autonomously.", es: "Registre transacciones en el panel de arriba para gestionar su flujo de caja de manera autónoma." },

  // Contas do Mês / MonthlyBillsTab
  "Alerta de Fluxo de Caixa: Contas Próximas ao Vencimento": { en: "Cash Flow Alert: Bills Due Soon", es: "Alerta de Flujo de Caja: Cuentas Próximas al Vencimiento" },
  "Você possui": { en: "You have", es: "Tiene" },
  "faturas": { en: "bills", es: "facturas" },
  "pendentes com vencimento nos próximos 3 dias ou já atrasadas. Verifique a lista abaixo e realize os pagamentos para evitar encargos!": { en: "pending with due dates in the next 3 days or already overdue. Check the list below and pay them to avoid fees!", es: "pendientes con vencimiento en los próximos 3 dias o ya atrasadas. ¡Verifique la lista de abajo y realice los pagos para evitar cargos!" },
  "Ver Contas Abertas": { en: "View Pending Bills", es: "Ver Cuentas Abiertas" },
  "Total Contas no Mês": { en: "Total Monthly Bills", es: "Total Cuentas del Mes" },
  "Soma de todas as faturas": { en: "Sum of all invoices", es: "Suma de todas las facturas" },
  "Total Pago": { en: "Total Paid", es: "Total Pagado" },
  "Faturas quitadas": { en: "Settled invoices", es: "Facturas pagadas" },
  "A Pagar (Pendente)": { en: "To Pay (Pending)", es: "A Pagar (Pendiente)" },
  "Faturas em aberto": { en: "Open invoices", es: "Facturas abiertas" },
  "Nova Fatura / Conta": { en: "New Invoice / Bill", es: "Nueva Factura / Cuenta" },
  "Descrição da Conta": { en: "Bill Description", es: "Descripción de la Cuenta" },
  "Ex: Conta de Luz, Internet, Aluguel...": { en: "e.g., Electricity Bill, Internet, Rent...", es: "Ej: Cuenta de Luz, Internet, Alquiler..." },
  "Valor da Fatura": { en: "Invoice Amount", es: "Monto de la Factura" },
  "Data de Vencimento": { en: "Due Date", es: "Fecha de Vencimiento" },
  "Código de Barras / Linha Digitável (Opcional)": { en: "Barcode (Optional)", es: "Código de Barras (Opcional)" },
  "Ex: 00190.00009 01234.567890...": { en: "e.g., 00190.00009 01234.567890...", es: "Ej: 00190.00009 01234.567890..." },
  "Agendar / Adicionar Conta": { en: "Schedule / Add Bill", es: "Agendar / Añadir Cuenta" },
  "Lista de Faturas Cadastradas": { en: "List of Registered Bills", es: "Lista de Facturas Registradas" },
  "Abertas": { en: "Open", es: "Abiertas" },
  "Pagas": { en: "Paid", es: "Pagadas" },
  "Vencendo nos Próximos 3 Dias": { en: "Due in Next 3 Days", es: "Vencen en los Próximos 3 Días" },
  "Nenhuma fatura cadastrada": { en: "No invoices registered", es: "Ninguna factura registrada" },
  "Registre faturas mensais como energia, telefone ou aluguel para acompanhar as datas de liquidação.": { en: "Register monthly bills such as energy, phone, or rent to track payment dates.", es: "Registre facturas mensuales como energía, teléfono o alquiler para realizar el seguimiento de las fechas de vencimiento." },
  "Código de Barras": { en: "Barcode", es: "Código de Barras" },
  "Copiar Código": { en: "Copy Code", es: "Copiar Código" },
  "Copiado": { en: "Copied", es: "Copiado" },
  "Marcar como Pago": { en: "Mark as Paid", es: "Marcar como Pagada" },
  "Marcar como Pendente": { en: "Mark as Pending", es: "Marcar como Pendiente" },
  "Status": { en: "Status", es: "Estado" },
  "Atrasada": { en: "Overdue", es: "Atrasada" },
  "Próxima": { en: "Soon", es: "Próxima" },
  "No Prazo": { en: "On Time", es: "A Tiempo" },
  "Quitada": { en: "Settled", es: "Pagada" },
  "Compromissos Totais": { en: "Total Commitments", es: "Compromisos Totales" },
  "Apenas contas do mês ativo": { en: "Only active month bills", es: "Solo cuentas del mes activo" },
  "contas liquidadas": { en: "bills settled", es: "cuentas liquidadas" },
  "parcelas abertas pendentes": { en: "open bills pending", es: "cuentas abiertas pendientes" },
  "Adicionar Nova Conta": { en: "Add New Bill", es: "Añadir Nueva Cuenta" },
  "Nova Conta ou Assinatura Recorrente": { en: "New Bill or Recurring Subscription", es: "Nueva Cuenta o Suscripción Recurrente" },
  "Ex: Aluguel, Luz, Netflix, Internet...": { en: "e.g., Rent, Utilities, Netflix, Internet...", es: "Ej: Alquiler, Luz, Netflix, Internet..." },
  "Vencimento": { en: "Due Date", es: "Vencimiento" },
  "Categoria da Conta": { en: "Bill Category", es: "Categoría de la Cuenta" },
  "Observações de Cobrança (Opcional)": { en: "Billing Notes (Optional)", es: "Notas de Facturación (Opcional)" },
  "Ex: Pagar em boleto ou PIX DDA com desconto...": { en: "e.g., Pay via slip or instant transfer...", es: "Ej: Pagar con boleto o transferencia..." },
  "Salvar Conta": { en: "Save Bill", es: "Guardar Cuenta" },
  "Contas em Aberto": { en: "Open Bills", es: "Cuentas Abiertas" },
  "Pendente:": { en: "Pending:", es: "Pendiente:" },
  "Tudo em dia!": { en: "All caught up!", es: "¡Todo al día!" },
  "Parabéns, você não possui contas pendentes no momento.": { en: "Congratulations, you have no pending bills at the moment.", es: "Felicitaciones, no tiene cuentas pendientes en este momento." },
  "ATRASADO": { en: "OVERDUE", es: "ATRASADO" },
  "VENCE LOGO": { en: "DUE SOON", es: "VENCE PRONTO" },
  "Contas Liquidadas": { en: "Settled Bills", es: "Cuentas Liquidadas" },
  "Pagas:": { en: "Paid:", es: "Pagadas:" },
  "Nenhum pagamento registrado": { en: "No payments registered", es: "Ningún pago registrado" },
  "Clique em \"Marcar como Pago\" na coluna de pendentes para registrar.": { en: "Click 'Mark as Paid' in the pending column to register.", es: "Haga clic en 'Marcar como Pagada' en la columna de pendientes para registrar." },
  "Pago": { en: "Paid", es: "Pagada" },
  "Desfazer Pagamento": { en: "Undo Payment", es: "Deshacer Pago" },
  "Insira uma descrição!": { en: "Please enter a description!", es: "¡Ingrese una descripción!" },
  "Por favor, informe um valor correto.": { en: "Please enter a valid amount.", es: "Por favor, ingrese un monto válido." },
  "Selecione uma data de vencimento!": { en: "Please select a due date!", es: "¡Seleccione una fecha de vencimiento!" },

  // Investimentos / InvestmentsTab
  "Investimentos & Aportes": { en: "Investments & Contributions", es: "Inversiones y Aportes" },
  "Gestão de carteira de ativos com cálculo automático de rendimentos": { en: "Asset portfolio management with automatic yield calculation", es: "Gestión de cartera de activos con cálculo automático de rendimientos" },
  "Seu Patrimônio Multiplicado": { en: "Your Multiplied Wealth", es: "Su Patrimonio Multiplicado" },
  "Custo total de aquisição dos ativos:": { en: "Total asset acquisition cost:", es: "Costo total de adquisición de activos:" },
  "Valorização Bruta": { en: "Gross Appreciation", es: "Valorización Bruta" },
  "Desempenho Geral": { en: "Overall Performance", es: "Rendimiento General" },
  "Simulador de Crescimento": { en: "Growth Simulator", es: "Simulador de Crecimiento" },
  "Gostaria de ver quanto sua carteira atual renderá aportando todos os meses em juros compostos?": {
    en: "Would you like to see how much your current portfolio will yield by investing every month with compound interest?",
    es: "¿Le gustaría ver cuánto rendirá su cartera actual aportando todos los meses en interés compuesto?"
  },
  "Aporte Mês": { en: "Monthly Invest", es: "Aporte Mensual" },
  "Rend. Anual": { en: "Annual Yield", es: "Rend. Anual" },
  "Prazo Anos": { en: "Years Term", es: "Plazo Años" },
  "Total Projetado:": { en: "Projected Total:", es: "Total Proyectado:" },
  "Lista de Ativos Contemplados": { en: "Covered Assets List", es: "Lista de Activos Contemplados" },
  "Mantenha os custos e preços médios dos seus investimentos em carteiras manuais.": {
    en: "Keep the costs and average prices of your investments in manual portfolios.",
    es: "Mantenga los costos y precios promedio de sus inversiones en carteras manuales."
  },
  "Cadastrar Novo Ativo": { en: "Register New Asset", es: "Registrar Nuevo Activo" },
  "Cadastrar Ativo de Investimento": { en: "Register Investment Asset", es: "Registrar Activo de Inversión" },
  "Nome do Ativo / Código (Ticker)": { en: "Asset Name / Code (Ticker)", es: "Nombre del Activo / Código (Ticker)" },
  "Ex: Tesouro Selic, VALE3, FII MXRF11...": { en: "e.g., Treasury, VALE3, FII MXRF11...", es: "Ej: Tesouro Selic, VALE3, FII MXRF11..." },
  "Classe de Ativo": { en: "Asset Class", es: "Clase de Activo" },
  "Preço Médio Pago / Total Investido": { en: "Average Price Paid / Total Invested", es: "Precio Promedio Pagado / Total Invertido" },
  "Valor Atual de Mercado (Opcional)": { en: "Current Market Value (Optional)", es: "Valor Actual de Mercado (Opcional)" },
  "Ex: 5240.20 (Vazio = igual ao investido)": { en: "e.g., 5240.20 (Empty = same as invested)", es: "Ej: 5240.20 (Vacío = igual al invertido)" },
  "Rentabilidade Estimada (% a.a. ou mensal)": { en: "Estimated Return (% y.y. or monthly)", es: "Rentabilidad Estimada (% a.a. o mensual)" },
  "Corretora ou Banco Custodiante": { en: "Broker or Custodian Bank", es: "Corredora o Banco Custodio" },
  "Ex: Rico, XP, NuInvest, Binance...": { en: "e.g., Rico, XP, NuInvest, Binance...", es: "Ej: Rico, XP, NuInvest, Binance..." },
  "Data de Aquisição": { en: "Acquisition Date", es: "Fecha de Adquisición" },
  "Cadastrar Ativo": { en: "Register Asset", es: "Registrar Activo" },
  "Inventário de Ativos Cadastrados": { en: "Registered Assets Inventory", es: "Inventario de Activos Registrados" },
  "Sua carteira de investimentos está vazia. Adicione ativos acima para vê-los render.": {
    en: "Your investment portfolio is empty. Add assets above to see them yield.",
    es: "Su cartera de inversiones está vacía. Añada activos arriba para verlos rendir."
  },
  "Ativo / Corretora": { en: "Asset / Broker", es: "Activo / Corredora" },
  "Classe": { en: "Class", es: "Clase" },
  "Aporte Inicial": { en: "Initial Investment", es: "Aporte Inicial" },
  "Ajuste Atual de Cotação": { en: "Current Price Adjustment", es: "Ajuste Actual de Cotización" },
  "Lucro / Perda": { en: "Profit / Loss", es: "Ganancia / Pérdida" },
  "Deletar": { en: "Delete", es: "Eliminar" },
  "Editar": { en: "Edit", es: "Editar" },
  "Indicador:": { en: "Indicator:", es: "Indicador:" },
  "Remover ativo": { en: "Remove asset", es: "Eliminar activo" },
  "Insira o nome do ativo!": { en: "Please enter the asset name!", es: "¡Ingrese el nombre del activo!" },
  "Insira o montante investido inicial!": { en: "Please enter the initial invested amount!", es: "¡Ingrese el monto inicial invertido!" },
  "Informe a corretora/banco custodial!": { en: "Please enter the broker/custodian bank!", es: "¡Ingrese la corredora/banco de custodia!" },
  "Valor incorreto!": { en: "Incorrect value!", es: "¡Valor incorrecto!" },
  "Patrimônio Atualizado": { en: "Updated Equity", es: "Patrimonio Actualizado" },
  "Valor de mercado atualizado": { en: "Updated market value", es: "Valor de mercado actualizado" },
  "Custo de Aquisição": { en: "Acquisition Cost", es: "Costo de Adquisición" },
  "Total de aportes efetuados": { en: "Total contributions made", es: "Total de aportes realizados" },
  "Lucro / Prejuízo Histórico": { en: "Historical Profit / Loss", es: "Ganancia / Pérdida Histórica" },
  "Rendimento consolidado": { en: "Consolidated yield", es: "Rendimiento consolidado" },
  "Novo Aporte / Ativo": { en: "New Contribution / Asset", es: "Nuevo Aporte / Activo" },
  "Nome do Ativo (Ticker)": { en: "Asset Name (Ticker)", es: "Nombre del Activo (Ticker)" },
  "Ex: PETR4, IVVB11, BTC...": { en: "e.g., PETR4, IVVB11, BTC...", es: "Ej: PETR4, IVVB11, BTC..." },
  "Tipo de Ativo": { en: "Asset Type", es: "Tipo de Activo" },
  "Quantidade de Cotas": { en: "Quantity of Shares", es: "Cantidad de Cuotas" },
  "Valor Total do Aporte (Custo)": { en: "Total Contribution Value (Cost)", es: "Valor Total del Aporte (Costo)" },
  "Valor de Mercado Atual (Total)": { en: "Current Market Value (Total)", es: "Valor de Mercado Actual (Total)" },
  "Registrar Ativo": { en: "Register Asset", es: "Registrar Activo" },
  "Sua Carteira de Ativos": { en: "Your Asset Portfolio", es: "Su Cartera de Activos" },
  "Nenhum ativo registrado na carteira": { en: "No assets registered in portfolio", es: "Ningún activo registrado en la cartera" },
  "Adicione ativos de renda fixa, ações ou criptomoedas para consolidar sua evolução patrimonial.": { en: "Add fixed income assets, stocks, or cryptocurrencies to consolidate your equity growth.", es: "Añada activos de renta fija, acciones o criptomonedas para consolidar su evolución patrimonial." },
  "Atualizar Preço": { en: "Update Price", es: "Actualizar Precio" },
  "Quantidade": { en: "Quantity", es: "Cantidad" },
  "Preço Médio": { en: "Avg Price", es: "Precio Medio" },
  "Novo Valor de Mercado Total": { en: "New Total Market Value", es: "Nuevo Valor de Mercado Total" },

  // Minha Conta / AuthTab
  "Minha Conta Finantra": { en: "My Finantra Account", es: "Mi Cuenta Finantra" },
  "Banco de Dados Local e Sincronização em Nuvem": { en: "Local Database & Cloud Synchronization", es: "Base de Datos Local y Sincronización en la Nube" },
  "Conectar com a Nuvem": { en: "Connect with Cloud", es: "Conectar con la Nube" },
  "Criar Conta Grátis": { en: "Create Free Account", es: "Crear Cuenta Gratis" },
  "Sincronização em Nuvem Habilitada": { en: "Cloud Synchronization Enabled", es: "Sincronización en la Nube Habilitada" },
  "Seus dados estão protegidos e sincronizados.": { en: "Your data is protected and synchronized.", es: "Sus dados están protegidos y sincronizados." },
  "Sair da Conta": { en: "Sign Out", es: "Cerrar Sesión" },
  "E-mail": { en: "Email", es: "Correo electrónico" },
  "Senha": { en: "Password", es: "Contraseña" },
  "Confirmar Senha": { en: "Confirm Password", es: "Confirmar Contraseña" },
  "Fazer Login": { en: "Login", es: "Iniciar Sesión" },
  "Registrar Conta": { en: "Register Account", es: "Registrar Cuenta" },
  "Não tem uma conta?": { en: "Don't have an account?", es: "¿No tiene una cuenta?" },
  "Crie uma": { en: "Create one", es: "Cree una" },
  "Já tem uma conta?": { en: "Already have an account?", es: "¿Ya tiene una cuenta?" },
  "Faça login": { en: "Login", es: "Inicie sesión" },
  "Você está operando em Modo Local Sandbox": { en: "You are operating in Local Sandbox Mode", es: "Está operando en Modo Sandbox Local" },
  "Suas finanças são salvas estritamente no seu navegador.": { en: "Your finances are saved strictly in your browser.", es: "Sus finanzas se guardan estrictamente en su navegador." },

  // Ajustes & Banco / Config / DatabaseStatus
  "Conectar Seu Banco de Dados Supabase Próprio (Opcional)": { en: "Connect Your Own Supabase Database (Optional)", es: "Conectar Su Base de Datos Supabase Propia (Opcional)" },
  "Se você fez o deploy do site ou deseja ter total controle das informações no seu próprio banco de dados na nuvem (Supabase), insira as credenciais abaixo. Elas serão salvas de forma segura no seu navegador.": { en: "If you deployed the site or wish to have total control of the information in your own cloud database (Supabase), enter the credentials below. They will be saved securely in your browser.", es: "Si realizó el despliegue del sitio o desea tener el control total de la información en su propia base de datos en la nube (Supabase), ingrese las credenciales a continuación. Se guardarán de forma segura en su navegador." },
  "URL do seu Supabase (API URL)": { en: "Your Supabase URL (API URL)", es: "URL de su Supabase (API URL)" },
  "Chave Pública Anon (Anon Key / API Key)": { en: "Public Anon Key (Anon Key / API Key)", es: "Clave Pública Anon (Anon Key / API Key)" },
  "Salvar & Conectar Meu Supabase": { en: "Save & Connect My Supabase", es: "Guardar y Conectar Mi Supabase" },
  "Credenciais Salvas! Recarregando...": { en: "Credentials Saved! Reloading...", es: "¡Credenciales Guardadas! Recargando..." },
  "Resetar para Banco Sandbox Padrão": { en: "Reset to Default Sandbox Database", es: "Restablecer a la Base de Datos Sandbox por Defecto" },
  "Como criar as tabelas no Supabase? (Clique para ver o script SQL)": { en: "How to create tables in Supabase? (Click to view SQL script)", es: "¿Cómo crear las tablas en Supabase? (Haga clic para ver el script SQL)" },
  "Copie o script SQL abaixo, acesse o painel do seu projeto no Supabase, vá em": { en: "Copy the SQL script below, access your project panel in Supabase, go to", es: "Copie el script SQL de abajo, acceda al panel de su proyecto en Supabase, vaya a" },
  "Copiar SQL": { en: "Copy SQL", es: "Copy SQL" },
  "Copiado!": { en: "Copied!", es: "¡Copiado!" },
  "Perfis de Usuário / Carteiras": { en: "User Profiles / Wallets", es: "Perfiles de Usuario / Carteras" },
  "Alterne ou crie diferentes perfis para gerenciar múltiplas carteiras de forma independente.": { en: "Switch or create different profiles to manage multiple wallets independently.", es: "Cambie o cree diferentes perfiles para gestionar múltiples carteras de forma independiente." },
  "Nome do Perfil": { en: "Profile Name", es: "Nombre del Perfil" },
  "Ex: Pessoal, Empresa, Casal...": { en: "e.g., Personal, Business, Couple...", es: "Ej: Personal, Empresa, Pareja..." },
  "Criar Novo Perfil": { en: "Create New Profile", es: "Crear Nuevo Perfil" },
  "Perfil Ativo": { en: "Active Profile", es: "Perfil Activo" },
  "Limites de Gastos por Categoria (Teto Mensal)": { en: "Spending Limits by Category (Monthly Ceiling)", es: "Límites de Gastos por Categoría (Tope Mensual)" },
  "Defina limites máximos de saída para cada categoria. O painel geral gerará alertas visuais automáticos ao se aproximar.": { en: "Define maximum spending limits for each category. The main dashboard will generate automatic visual alerts as they approach.", es: "Defina límites máximos de gastos para cada categoría. El panel general generará alertas visuales automáticas al acercarse." },
  "Definir Limites": { en: "Set Limits", es: "Definir Límites" },
  "Metas Financeiras Globais (Mês Corrente)": { en: "Global Financial Goals (Current Month)", es: "Metas Financieras Globales (Mes Corriente)" },
  "Insira suas ambições de receita e metas de novos aportes para o mês para habilitar o acompanhamento.": { en: "Enter your income ambitions and new investment goals for the month to enable tracking.", es: "Ingrese sus aspiraciones de ingresos y metas de nuevos aportes para el mes para habilitar el seguimiento." },
  "Meta de Receitas Recorrentes / Ganhos": { en: "Recurring Income / Earnings Goal", es: "Meta de Ingresos Recurrentes / Ganancias" },
  "Meta de Novos Aportes em Investimentos": { en: "New Investment Contributions Goal", es: "Meta de Nuevos Aportes en Inversiones" },
  "Salvar Ajustes de Metas": { en: "Save Goal Settings", es: "Guardar Ajustes de Metas" },
  "Excluído": { en: "Deleted", es: "Eliminado" },
  "Adicionado com sucesso": { en: "Added successfully", es: "Añadido con éxito" },
  "Salvo com sucesso": { en: "Saved successfully", es: "Guardado con éxito" },
  "Sincronizando com a Nuvem...": { en: "Syncing with Cloud...", es: "Sincronizando con la Nube..." },
  "Sincronizado": { en: "Synced", es: "Sincronizado" },
};

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    const saved = localStorage.getItem('finantra_lang');
    if (saved === 'en' || saved === 'es' || saved === 'pt-BR') {
      return saved as Language;
    }
    // Try browser locale detect
    const locale = navigator.language || '';
    if (locale.startsWith('en')) return 'en';
    if (locale.startsWith('es')) return 'es';
    return 'pt-BR';
  });

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
    localStorage.setItem('finantra_lang', lang);
  };

  const t = translations[language];

  const tText = (ptText: string): string => {
    if (language === 'pt-BR') return ptText;
    const trimmed = ptText.trim();
    const translation = DICTIONARY[trimmed];
    if (translation) {
      return language === 'en' ? translation.en : translation.es;
    }
    return ptText;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t, tText }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
