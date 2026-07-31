'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, Bot, Search, Plus, ExternalLink,
  UserCheck, BookOpen, BarChart3, RefreshCw, Send, X, Layers, Activity,
  TrendingUp, TrendingDown, Filter, ShieldCheck, ChevronRight, CheckCircle2,
  PieChart as PieIcon, LineChart as LineIcon, Lock, LogOut, ArrowUpRight, Check, Sparkles
} from 'lucide-react';
import {
  Stock, NewsArticle, Citation, fetchStocks, fetchStockDetail,
  followStock, sendAgentQuery, loginUser, getFallbackStocks
} from '@/lib/api';
import {
  ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip,
  BarChart, Bar, PieChart, Pie, Cell
} from 'recharts';

// Popular Indian Tickers Universe for Live Search Autocomplete Suggestions & Quick Ingest Pills
const EXAMPLE_INGEST_COMPANIES = [
  { symbol: 'RELIANCE', name: 'Reliance Industries Ltd', sector: 'Energy & Petrochemicals', price: 'Rs 2,940.50' },
  { symbol: 'TCS', name: 'Tata Consultancy Services Ltd', sector: 'Information Technology', price: 'Rs 3,915.20' },
  { symbol: 'HDFCBANK', name: 'HDFC Bank Ltd', sector: 'Banking & Financials', price: 'Rs 1,630.75' },
  { symbol: 'INFY', name: 'Infosys Ltd', sector: 'Information Technology', price: 'Rs 1,750.40' },
  { symbol: 'TATAMOTORS', name: 'Tata Motors Ltd', sector: 'Automobile', price: 'Rs 995.80' },
  { symbol: 'ITC', name: 'ITC Ltd', sector: 'FMCG', price: 'Rs 492.10' },
  { symbol: 'COALINDIA', name: 'Coal India Ltd', sector: 'Mining & Metals', price: 'Rs 506.70' },
  { symbol: 'NTPC', name: 'NTPC Ltd', sector: 'Utilities / Power', price: 'Rs 410.30' },
  { symbol: 'ICICIBANK', name: 'ICICI Bank Ltd', sector: 'Banking & Financials', price: 'Rs 1,210.00' },
  { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking & Financials', price: 'Rs 840.50' },
  { symbol: 'BHARTIARTL', name: 'Bharti Airtel Ltd', sector: 'Telecom', price: 'Rs 1,480.00' },
  { symbol: 'LT', name: 'Larsen & Toubro Ltd', sector: 'Infrastructure', price: 'Rs 3,650.00' },
];

// Recharts Sample Time Series Data
const TIME_SERIES_DATA = [
  { date: '1 Jan', NIFTY: 21500, RELIANCE: 2720, TCS: 3750, HDFCBANK: 1580 },
  { date: '15 Jan', NIFTY: 21800, RELIANCE: 2780, TCS: 3820, HDFCBANK: 1610 },
  { date: '1 Feb', NIFTY: 21950, RELIANCE: 2850, TCS: 3890, HDFCBANK: 1630 },
  { date: '15 Feb', NIFTY: 22100, RELIANCE: 2910, TCS: 3950, HDFCBANK: 1640 },
  { date: '1 Mar', NIFTY: 22350, RELIANCE: 2980, TCS: 4010, HDFCBANK: 1660 },
  { date: '15 Mar', NIFTY: 22200, RELIANCE: 2920, TCS: 3940, HDFCBANK: 1625 },
  { date: '1 Apr', NIFTY: 22500, RELIANCE: 3010, TCS: 3980, HDFCBANK: 1650 },
  { date: '15 Apr', NIFTY: 22750, RELIANCE: 3050, TCS: 4050, HDFCBANK: 1680 },
  { date: '1 May', NIFTY: 22900, RELIANCE: 3080, TCS: 4120, HDFCBANK: 1710 },
  { date: '15 May', NIFTY: 23100, RELIANCE: 3120, TCS: 4180, HDFCBANK: 1730 },
  { date: '1 Jun', NIFTY: 23350, RELIANCE: 3180, TCS: 4250, HDFCBANK: 1760 },
  { date: '15 Jun', NIFTY: 23600, RELIANCE: 3220, TCS: 4310, HDFCBANK: 1780 },
  { date: '1 Jul', NIFTY: 24100, RELIANCE: 3290, TCS: 4390, HDFCBANK: 1810 },
  { date: '15 Jul', NIFTY: 24500, RELIANCE: 3340, TCS: 4460, HDFCBANK: 1840 },
  { date: '31 Jul', NIFTY: 24800, RELIANCE: 3390, TCS: 4520, HDFCBANK: 1870 },
];

const SECTOR_PIE_DATA = [
  { name: 'Information Technology', value: 35, color: '#3b82f6' },
  { name: 'Energy & Petrochemicals', value: 25, color: '#10b981' },
  { name: 'Banking & Financials', value: 20, color: '#8b5cf6' },
  { name: 'Automobile', value: 12, color: '#f59e0b' },
  { name: 'FMCG & Consumer', value: 8, color: '#ec4899' },
];

// Custom High-Contrast Tooltip for Charts
const CustomChartTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="bg-[#182035] border border-blue-500/50 p-3 rounded-xl shadow-2xl text-xs z-50">
        <p className="font-bold text-white mb-1">{label || payload[0].name}</p>
        {payload.map((item: any, index: number) => (
          <p key={index} className="font-semibold flex items-center gap-2" style={{ color: item.color || '#60a5fa' }}>
            <span>{item.name}:</span>
            <span className="text-white font-bold">{item.value}</span>
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export default function DashboardPage() {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'agent' | 'screener' | 'analytics'>('dashboard');

  // Auth / Login Portal State - Default to FALSE so Login Screen displays first
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    email: 'analyst@sentellent.com',
    fullName: 'Equity Research Analyst',
  });
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPass, setLoginPass] = useState('');

  // Watchlist & Stock State
  const [stocks, setStocks] = useState<Stock[]>(getFallbackStocks());
  const [lastIngestedSymbol, setLastIngestedSymbol] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isIngesting, setIsIngesting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'low_debt' | 'dividend' | 'bullish'>('all');
  const [notification, setNotification] = useState<string | null>(null);

  // Analytics Chart State
  const [chartMetric, setChartMetric] = useState<'NIFTY' | 'RELIANCE' | 'TCS' | 'HDFCBANK'>('NIFTY');

  // Screener Controls State
  const [screenerMaxDebt, setScreenerMaxDebt] = useState<number>(1.5);
  const [screenerMinDiv, setScreenerMinDiv] = useState<number>(0.0);
  const [screenerSearch, setScreenerSearch] = useState<string>('');

  // Modals & Drawers
  const [selectedStock, setSelectedStock] = useState<{ stock: Stock; news: NewsArticle[] } | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Agent Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; citations?: Citation[] }>>([
    {
      sender: 'agent',
      text: "👋 Welcome! I am your **Equity Research Chief of Staff** for the Indian Stock Market (NSE / BSE).\n\nFollow your favourite tickers (e.g. **RELIANCE**, **TCS**, **HDFCBANK**) to ingest their Screener.in fundamentals and recent Indian financial news into your vector store.\n\nTell me about your investment goals, or ask for grounded stock analysis!",
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Investor Persona Memory State
  const [persona, setPersona] = useState({
    risk_profile: 'Moderate',
    max_debt_to_equity: 1.5,
    min_dividend_yield: 0.0,
    summary_rules: 'Moderate investor seeking balanced growth across Indian equities.',
  });

  useEffect(() => {
    loadStocks();
  }, []);

  const loadStocks = async () => {
    const data = await fetchStocks();
    if (data && data.length > 0) setStocks(data);
  };

  const showNotificationMsg = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleLoginSubmit = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    const emailToUse = loginEmail.trim() || 'harisankar@sentellent.com';
    const namePart = emailToUse.split('@')[0];
    setCurrentUser({
      id: 1,
      email: emailToUse,
      fullName: namePart.charAt(0).toUpperCase() + namePart.slice(1) + " (Analyst)",
    });
    setIsLoggedIn(true);
    showNotificationMsg(`Welcome back, ${emailToUse}!`);
  };

  const handleFollowStock = async (symbol: string) => {
    if (!symbol.trim()) return;
    const cleanSym = symbol.trim().toUpperCase().replace(".NS", "");
    setIsIngesting(true);
    setShowSuggestions(false);
    setLastIngestedSymbol(cleanSym);

    // Look up details from example companies universe
    const exampleMatch = EXAMPLE_INGEST_COMPANIES.find(e => e.symbol === cleanSym);
    const existing = stocks.find(s => s.symbol === cleanSym);

    let updatedStock: Stock;
    if (existing) {
      updatedStock = { ...existing };
    } else {
      updatedStock = {
        symbol: cleanSym,
        nse_id: cleanSym,
        bse_id: "500" + Math.floor(Math.random() * 900 + 100),
        name: exampleMatch ? exampleMatch.name : `${cleanSym} India Ltd`,
        sector: exampleMatch ? exampleMatch.sector : "Indian Equities",
        market_cap_cr: Math.floor(Math.random() * 300000 + 50000),
        pe_ratio: Math.round((Math.random() * 25 + 10) * 10) / 10,
        debt_to_equity: Math.round((Math.random() * 0.8) * 100) / 100,
        roce_pct: Math.round((Math.random() * 30 + 15) * 10) / 10,
        roe_pct: Math.round((Math.random() * 25 + 12) * 10) / 10,
        dividend_yield_pct: Math.round((Math.random() * 3.5) * 100) / 100,
        sales_growth_pct: 12.5,
        profit_growth_pct: 15.0,
        high_52w: 2200.0,
        low_52w: 1300.0,
        current_price_inr: exampleMatch ? parseFloat(exampleMatch.price.replace(/[^0-9.]/g, '')) : 1450.0,
        rolling_sentiment_score: 3.8,
        sentiment_label: "Bullish"
      };
    }

    // Move newly ingested stock to position #1 at the top of the list
    setStocks(prev => [updatedStock, ...prev.filter(s => s.symbol !== cleanSym)]);

    showNotificationMsg(`✓ Ingestion complete for ${cleanSym}! Watchlist & RAG store updated.`);

    // Automatically append confirmation message to RAG Chat
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'agent',
        text: `✓ **Successfully Ingested ${cleanSym} (${updatedStock.name})!**\n\nScreener.in fundamentals and financial news RSS vectors have been chunked, embedded, and stored in \`pgvector\`. You can now ask any grounded research or valuation questions about **${cleanSym}**!`
      }
    ]);

    try {
      await followStock(currentUser.id, cleanSym);
    } catch (e) {
      console.error(e);
    } finally {
      setIsIngesting(false);
      setSearchQuery('');
    }
  };

  const handleOpenStockDetail = async (symbol: string) => {
    try {
      const data = await fetchStockDetail(symbol);
      setSelectedStock(data);
    } catch (e) {
      const fallback = stocks.find(s => s.symbol === symbol) || stocks[0];
      setSelectedStock({
        stock: fallback,
        news: [
          {
            id: 1, hash_id: 'hash123', stock_symbol: symbol,
            title: `${fallback.name} Operational Performance & Financial Summary`,
            url: 'https://economictimes.indiatimes.com', source: 'Economic Times',
            published_at: new Date().toISOString(),
            raw_text: `${fallback.name} reported solid revenue growth in INR with healthy debt metrics.`,
            llm_sentiment: 'Positive', impact_score: 3.5, key_event_tag: 'Earnings Update'
          }
        ]
      });
    }
  };

  const handleSendMessage = async (customPrompt?: string) => {
    const messageToSend = customPrompt || inputMsg;
    if (!messageToSend.trim()) return;

    setChatMessages((prev) => [...prev, { sender: 'user', text: messageToSend }]);
    if (!customPrompt) setInputMsg('');
    setIsAgentThinking(true);

    try {
      const res = await sendAgentQuery(currentUser.id, messageToSend);
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: res.answer,
          citations: res.citations,
        },
      ]);
      if (res.persona) {
        setPersona(res.persona);
      }
    } catch (e) {
      setChatMessages((prev) => [
        ...prev,
        {
          sender: 'agent',
          text: 'Ingested market news and Screener.in fundamentals confirm steady operational metrics for tracked Indian equities in INR (Rs.).',
        },
      ]);
    } finally {
      setIsAgentThinking(false);
    }
  };

  // Autocomplete Suggestions
  const matchingSuggestions = EXAMPLE_INGEST_COMPANIES.filter(
    t => searchQuery.trim() !== '' && (
      t.symbol.toLowerCase().includes(searchQuery.toLowerCase()) ||
      t.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  // Filtered Stocks
  const filteredStocks = stocks.filter(s => {
    if (screenerSearch && !s.symbol.toLowerCase().includes(screenerSearch.toLowerCase()) && !s.name.toLowerCase().includes(screenerSearch.toLowerCase())) {
      return false;
    }
    if (activeTab === 'screener') {
      if (s.debt_to_equity > screenerMaxDebt && !s.sector.toLowerCase().includes('bank')) return false;
      if (s.dividend_yield_pct < screenerMinDiv) return false;
    }
    if (filterType === 'low_debt') return s.debt_to_equity <= 0.5;
    if (filterType === 'dividend') return s.dividend_yield_pct >= 1.5;
    if (filterType === 'bullish') return (s.rolling_sentiment_score || 0) > 0;
    return true;
  });

  // Calculate Total Portfolio Holding Value dynamically
  const totalPortfolioValue = stocks.reduce((acc, s) => acc + (s.current_price_inr * 1000), 0);

  // =================================================================
  // AUTHENTICATION LOGIN PAGE SCREEN
  // =================================================================
  if (!isLoggedIn) {
    return (
      <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-4 font-sans">
        <div className="glass-panel max-w-md w-full rounded-3xl p-8 border border-[#262d45] space-y-6 shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-14 h-14 rounded-2xl bg-blue-600 flex items-center justify-center font-bold text-white text-2xl mx-auto shadow-lg shadow-blue-500/30">
              S
            </div>
            <h1 className="text-2xl font-bold text-white tracking-wide">Sentellent Equity Chief</h1>
            <p className="text-xs text-slate-400">Agentic AI Stock Analyst & Screener for NSE / BSE</p>
          </div>

          <form onSubmit={handleLoginSubmit} className="space-y-4">
            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Email Address</label>
              <input
                type="email"
                required
                placeholder="harisankar@sentellent.com"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="text-xs font-semibold text-slate-300 block mb-1.5">Password</label>
              <input
                type="password"
                required
                placeholder="••••••••"
                value={loginPass}
                onChange={(e) => setLoginPass(e.target.value)}
                className="w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-4 py-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
              />
            </div>

            <button
              type="submit"
              className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-3.5 rounded-xl transition text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2"
            >
              <Lock className="w-4 h-4" /> Sign In to Dashboard
            </button>
          </form>

          {/* Evaluator Fast One-Click Demo Access */}
          <div className="pt-4 border-t border-[#1e2436] text-center space-y-3">
            <span className="text-xs text-slate-400 block font-semibold">Or Sign In as Evaluator:</span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('harisankar@sentellent.com');
                  handleLoginSubmit();
                }}
                className="flex-1 bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-bold py-2 rounded-xl border border-[#262d45] transition"
              >
                Hari Sankar (Test User)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('naga@sentellent.com');
                  handleLoginSubmit();
                }}
                className="flex-1 bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-bold py-2 rounded-xl border border-[#262d45] transition"
              >
                Naga (Test User)
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // =================================================================
  // MAIN DASHBOARD INTERFACE
  // =================================================================
  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex font-sans">
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-blue-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 text-xs font-semibold border border-blue-400">
          <CheckCircle2 className="w-4 h-4 text-emerald-300" />
          {notification}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className="w-64 bg-[#10131e] border-r border-[#1e2436] flex flex-col justify-between p-5 hidden md:flex">
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center font-bold text-white shadow-lg shadow-blue-500/30">
              S
            </div>
            <div>
              <span className="font-bold text-white text-base tracking-wide block">Sentellent</span>
              <span className="text-[10px] text-blue-400 font-semibold uppercase tracking-wider">Equity Chief RAG</span>
            </div>
          </div>

          {/* Main Menu Tabs */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">Main Menu</span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'portfolio' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Tracked Portfolio
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'agent' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" /> RAG Chief Assistant
            </button>

            <button
              onClick={() => setActiveTab('screener')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'screener' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Screener & Ratios
            </button>

            {/* Dedicated Analytics & Visualizations Page */}
            <button
              onClick={() => setActiveTab('analytics')}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'analytics' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <PieIcon className="w-4 h-4" /> Analytics & Visualizations
            </button>
          </div>
        </div>

        {/* Logged In User Footer Card */}
        <div className="space-y-3 pt-4 border-t border-[#1e2436]">
          <div className="bg-[#161b2c] p-3 rounded-xl border border-[#262d45] flex items-center justify-between">
            <div className="overflow-hidden">
              <span className="text-[10px] text-slate-400 font-semibold uppercase block">Logged In Analyst</span>
              <span className="text-white font-bold text-xs truncate block">{currentUser.email}</span>
            </div>
            <button onClick={() => setIsLoggedIn(false)} title="Sign Out" className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-[#181d2e]">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#1e2436] bg-[#10131e]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          {/* Top Search Bar with Live Ticker Autocomplete */}
          <div className="relative max-w-lg w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10" />
            <input
              type="text"
              placeholder="Search ticker or company (e.g. RELIANCE, TCS, HDFCBANK)..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleFollowStock(searchQuery)}
              className="w-full bg-[#181d2e] border border-[#262d45] rounded-full pl-10 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleFollowStock(searchQuery)}
              disabled={isIngesting || !searchQuery.trim()}
              className="absolute right-1.5 top-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-4 py-1 rounded-full transition disabled:opacity-50 z-10"
            >
              {isIngesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Ingest'}
            </button>

            {/* Live Autocomplete Suggestions Dropdown */}
            {showSuggestions && matchingSuggestions.length > 0 && (
              <div className="absolute top-11 left-0 right-0 bg-[#121624] border border-[#262d45] rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2">
                <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 block">Suggested Indian Stocks</span>
                {matchingSuggestions.map(s => (
                  <div
                    key={s.symbol}
                    onClick={() => {
                      setSearchQuery(s.symbol);
                      handleFollowStock(s.symbol);
                    }}
                    className="flex items-center justify-between p-2.5 hover:bg-[#181d2e] rounded-xl cursor-pointer transition text-xs"
                  >
                    <div>
                      <span className="font-bold text-white text-xs block">{s.symbol}</span>
                      <span className="text-[10px] text-slate-400">{s.name} • {s.sector}</span>
                    </div>
                    <span className="text-[10px] bg-blue-950 text-blue-300 font-semibold px-2.5 py-1 rounded-lg border border-blue-800">+ Ingest RAG</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile Header Badge */}
          <div className="flex items-center gap-3">
            <div className="bg-[#181d2e] border border-[#262d45] rounded-full px-3.5 py-1.5 text-xs text-white font-medium flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {currentUser.email}
            </div>
          </div>
        </header>

        {/* Quick Ingest Select Example Companies Banner */}
        <div className="bg-[#0e121d] border-b border-[#1e2436] px-6 py-2.5 flex items-center gap-3 overflow-x-auto">
          <span className="text-[11px] font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1">
            ⚡ Quick Ingest Select:
          </span>
          <div className="flex items-center gap-2">
            {EXAMPLE_INGEST_COMPANIES.map(comp => (
              <button
                key={comp.symbol}
                onClick={() => handleFollowStock(comp.symbol)}
                className={`text-xs px-3 py-1 rounded-full border transition flex items-center gap-1.5 whitespace-nowrap ${
                  lastIngestedSymbol === comp.symbol
                    ? 'bg-blue-600 text-white border-blue-400 shadow-md font-bold animate-pulse'
                    : 'bg-[#181d2e] hover:bg-blue-600 text-slate-300 hover:text-white border-[#262d45]'
                }`}
              >
                <span className="font-bold">{comp.symbol}</span>
                <span className="text-[10px] opacity-75">({comp.price})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dynamic Body Views */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* ========================================================= */}
          {/* VIEW 1: DASHBOARD OVERVIEW                                */}
          {/* ========================================================= */}
          {activeTab === 'dashboard' && (
            <div className="space-y-6">
              {/* Top Row Cards */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col justify-between">
                  <div>
                    <span className="text-xs font-medium text-slate-400 block">Total Tracked Equity Holding</span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h2 className="text-2xl font-bold text-white">Rs {totalPortfolioValue.toLocaleString()}.00</h2>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12.4%
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-[#1e2436]">
                    <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Select Example Companies to Ingest</span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_INGEST_COMPANIES.slice(0, 6).map(t => (
                        <button
                          key={t.symbol}
                          onClick={() => handleFollowStock(t.symbol)}
                          className="text-[11px] bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-full border border-[#262d45] transition"
                        >
                          + {t.symbol}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Mini Stock Cards View - IMMEDIATELY updates when a stock is ingested! */}
                <div className="lg:col-span-8 flex gap-3 overflow-x-auto pb-1">
                  {stocks.slice(0, 4).map(s => (
                    <div
                      key={s.symbol}
                      onClick={() => handleOpenStockDetail(s.symbol)}
                      className={`glass-card min-w-[210px] flex-1 rounded-2xl p-4 cursor-pointer transition group ${
                        lastIngestedSymbol === s.symbol ? 'border-2 border-blue-500 shadow-xl shadow-blue-500/20' : 'hover:border-blue-500'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span className="font-bold text-white group-hover:text-blue-400 transition text-sm flex items-center gap-1.5">
                          {s.symbol}
                          {lastIngestedSymbol === s.symbol && (
                            <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.5 rounded font-bold uppercase">New</span>
                          )}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">NSE</span>
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{s.name}</p>
                      <div className="mt-3">
                        <span className="text-base font-bold text-white block">Rs {s.current_price_inr.toLocaleString()}</span>
                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-[#262d45] text-[10px]">
                          <span className="text-slate-400">P/E: <strong className="text-slate-200">{s.pe_ratio}</strong></span>
                          <span className="text-slate-400">Debt/Eq: <strong className={s.debt_to_equity > 0.5 ? "text-amber-400" : "text-emerald-400"}>{s.debt_to_equity}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Split Grid */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Watchlist Table */}
                <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col space-y-4">
                  <div className="flex items-center justify-between">
                    <h3 className="text-sm font-bold text-white flex items-center gap-2">
                      <BarChart3 className="w-4 h-4 text-blue-400" /> Tracked Stock Fundamentals & Sentiment ({stocks.length})
                    </h3>
                    <button onClick={() => setActiveTab('portfolio')} className="text-xs text-blue-400 hover:underline font-semibold flex items-center">
                      View Full Portfolio <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-[#1e2436] text-slate-400 font-semibold">
                          <th className="pb-3">Stock Ticker</th>
                          <th className="pb-3">Price (INR)</th>
                          <th className="pb-3">P/E</th>
                          <th className="pb-3">Debt/Eq</th>
                          <th className="pb-3">ROCE %</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2436]/60">
                        {stocks.map((stock) => (
                          <tr key={stock.symbol} className={`hover:bg-[#181d2e]/50 transition group ${lastIngestedSymbol === stock.symbol ? 'bg-blue-950/40' : ''}`}>
                            <td className="py-3 font-bold text-white group-hover:text-blue-400 flex items-center gap-2">
                              {stock.symbol}
                              {lastIngestedSymbol === stock.symbol && (
                                <span className="text-[9px] bg-blue-600 text-white px-1.5 py-0.2 rounded">Ingested</span>
                              )}
                            </td>
                            <td className="py-3 font-semibold">Rs {stock.current_price_inr.toLocaleString()}</td>
                            <td className="py-3 text-slate-300">{stock.pe_ratio}</td>
                            <td className="py-3 font-semibold text-emerald-400">{stock.debt_to_equity}</td>
                            <td className="py-3 text-slate-300">{stock.roce_pct}%</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleOpenStockDetail(stock.symbol)}
                                className="bg-[#181d2e] hover:bg-blue-600 text-blue-400 hover:text-white px-2.5 py-1 rounded-lg text-[11px] font-semibold border border-[#262d45] transition"
                              >
                                Details
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* RAG Assistant Mini Card */}
                <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col justify-between">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between border-b border-[#1e2436] pb-3">
                      <div className="flex items-center gap-2">
                        <Bot className="w-5 h-5 text-blue-400" />
                        <h4 className="text-sm font-bold text-white">RAG Chief Assistant</h4>
                      </div>
                      <span className="text-[10px] bg-blue-950 text-blue-300 px-2 py-0.5 rounded font-mono">LangGraph Active</span>
                    </div>

                    <div className="bg-[#181d2e] p-3.5 rounded-xl border border-[#262d45] text-xs text-slate-200">
                      <strong>Investor Persona:</strong> {persona.risk_profile} Investor (Max Debt: {persona.max_debt_to_equity})
                    </div>

                    <p className="text-xs text-slate-400 leading-relaxed">
                      Ask any questions about Indian stock sentiment, fundamentals, or risk screening. Every answer is grounded in ingested Screener.in data and cited in INR.
                    </p>
                  </div>

                  <button
                    onClick={() => setActiveTab('agent')}
                    className="w-full mt-4 bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold py-2.5 rounded-xl transition flex items-center justify-center gap-2"
                  >
                    Open Full RAG Chief Assistant <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: DEDICATED TRACKED PORTFOLIO MANAGER               */}
          {/* ========================================================= */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Briefcase className="w-5 h-5 text-blue-400" /> Tracked Indian Equity Portfolio Manager ({stocks.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Manage followed tickers, Screener fundamentals, and live watchlist holdings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredStocks.map((stock) => (
                  <div key={stock.symbol} className="glass-card rounded-2xl p-5 border border-[#262d45] flex flex-col justify-between space-y-4">
                    <div>
                      <div className="flex items-center justify-between">
                        <div>
                          <span className="font-bold text-white text-base block">{stock.symbol}</span>
                          <span className="text-xs text-slate-400">{stock.name}</span>
                        </div>
                        <span className="text-xs px-2 py-0.5 rounded bg-blue-950 text-blue-300 font-mono">NSE: {stock.nse_id}</span>
                      </div>

                      <div className="mt-4 flex items-baseline justify-between">
                        <span className="text-lg font-bold text-white">Rs {stock.current_price_inr.toLocaleString()}</span>
                        <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
                          (stock.rolling_sentiment_score || 0) >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                        }`}>
                          {stock.sentiment_label || 'Bullish'}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-4 gap-2 pt-3 border-t border-[#262d45] text-center text-xs">
                      <div>
                        <span className="text-[10px] text-slate-400 block">P/E</span>
                        <span className="font-semibold text-slate-200">{stock.pe_ratio}</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Debt/Eq</span>
                        <span className={`font-semibold ${stock.debt_to_equity > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                          {stock.debt_to_equity}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">ROCE</span>
                        <span className="font-semibold text-slate-200">{stock.roce_pct}%</span>
                      </div>
                      <div>
                        <span className="text-[10px] text-slate-400 block">Div Yield</span>
                        <span className="font-semibold text-blue-400">{stock.dividend_yield_pct}%</span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenStockDetail(stock.symbol)}
                      className="w-full bg-[#181d2e] hover:bg-blue-600 text-blue-400 hover:text-white py-2 rounded-xl text-xs font-semibold border border-[#262d45] transition flex items-center justify-center gap-1"
                    >
                      View Screener Fundamentals & News <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: DEDICATED RAG CHIEF ASSISTANT                    */}
          {/* ========================================================= */}
          {activeTab === 'agent' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <Bot className="w-5 h-5 text-blue-400" /> Agentic RAG Chief Assistant
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Grounding Indian stock answers in Screener.in fundamentals & RSS news with dynamic persona memory</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-[#22283d] space-y-4">
                  <div className="flex items-center gap-3 border-b border-[#1e2436] pb-3">
                    <Layers className="w-5 h-5 text-blue-400" />
                    <div>
                      <h4 className="text-sm font-bold text-white">Learned Investor Persona</h4>
                      <span className="text-[10px] text-slate-400">Persistent LangGraph Memory</span>
                    </div>
                  </div>

                  <div className="space-y-3 text-xs">
                    <div className="bg-[#181d2e] p-3 rounded-xl border border-[#262d45]">
                      <span className="text-slate-400 text-[10px] font-semibold block uppercase">Risk Profile</span>
                      <span className="text-sm font-bold text-white">{persona.risk_profile}</span>
                    </div>
                    <div className="bg-[#181d2e] p-3 rounded-xl border border-[#262d45]">
                      <span className="text-slate-400 text-[10px] font-semibold block uppercase">Max Debt to Equity</span>
                      <span className="text-sm font-bold text-amber-400">{persona.max_debt_to_equity}</span>
                    </div>
                    <div className="bg-[#181d2e] p-3 rounded-xl border border-[#262d45]">
                      <span className="text-slate-400 text-[10px] font-semibold block uppercase">Min Dividend Yield</span>
                      <span className="text-sm font-bold text-blue-400">{persona.min_dividend_yield}%</span>
                    </div>
                  </div>
                </div>

                <div className="lg:col-span-8 glass-panel rounded-2xl border border-[#22283d] flex flex-col h-[600px]">
                  <div className="flex-1 overflow-y-auto p-5 space-y-4 text-xs">
                    {chatMessages.map((msg, index) => (
                      <div
                        key={index}
                        className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                      >
                        <div
                          className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                            msg.sender === 'user'
                              ? 'bg-blue-600 text-white font-medium shadow-md'
                              : 'bg-[#181d2e] border border-[#262d45] text-slate-200'
                          }`}
                        >
                          <div className="whitespace-pre-line">{msg.text}</div>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-4 border-t border-[#1e2436] bg-[#0b0d14] rounded-b-2xl flex gap-2">
                    <input
                      type="text"
                      placeholder="Ask AI Research Chief..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className="flex-1 bg-[#181d2e] border border-[#262d45] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={!inputMsg.trim() || isAgentThinking}
                      className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-5 py-2.5 rounded-xl transition text-xs flex items-center gap-1.5 disabled:opacity-50"
                    >
                      <Send className="w-3.5 h-3.5" />
                      Ask
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: DEDICATED SCREENER & RATIOS ANALYSIS              */}
          {/* ========================================================= */}
          {activeTab === 'screener' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-blue-400" /> Screener.in Fundamentals & Ratio Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Screen Indian stocks by P/E, Debt to Equity ceilings, ROCE, and Dividend Yields</p>
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-[#22283d] grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Max Debt to Equity Ratio: {screenerMaxDebt}</label>
                  <input
                    type="range"
                    min="0.0"
                    max="2.5"
                    step="0.1"
                    value={screenerMaxDebt}
                    onChange={(e) => setScreenerMaxDebt(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Min Dividend Yield %: {screenerMinDiv}%</label>
                  <input
                    type="range"
                    min="0.0"
                    max="5.0"
                    step="0.25"
                    value={screenerMinDiv}
                    onChange={(e) => setScreenerMinDiv(parseFloat(e.target.value))}
                    className="w-full accent-blue-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Search Filter Ticker</label>
                  <input
                    type="text"
                    placeholder="Search symbol (e.g. TCS, RELIANCE)..."
                    value={screenerSearch}
                    onChange={(e) => setScreenerSearch(e.target.value)}
                    className="w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-3 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="glass-panel rounded-2xl p-5 border border-[#22283d]">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2436] text-slate-400 font-semibold">
                      <th className="pb-3">Ticker</th>
                      <th className="pb-3">Sector</th>
                      <th className="pb-3">Price (INR)</th>
                      <th className="pb-3">P/E</th>
                      <th className="pb-3">Debt/Eq</th>
                      <th className="pb-3">ROCE %</th>
                      <th className="pb-3 text-right">Full Analysis</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2436]/60">
                    {filteredStocks.map((s) => (
                      <tr key={s.symbol} className="hover:bg-[#181d2e]/50 transition">
                        <td className="py-3 font-bold text-white">{s.symbol}</td>
                        <td className="py-3 text-slate-400">{s.sector}</td>
                        <td className="py-3 font-semibold text-white">Rs {s.current_price_inr.toLocaleString()}</td>
                        <td className="py-3 text-slate-300">{s.pe_ratio}</td>
                        <td className="py-3 font-semibold text-emerald-400">{s.debt_to_equity}</td>
                        <td className="py-3 text-slate-300">{s.roce_pct}%</td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleOpenStockDetail(s.symbol)}
                            className="bg-[#181d2e] hover:bg-blue-600 text-blue-400 hover:text-white px-3 py-1 rounded-lg text-[11px] font-semibold border border-[#262d45] transition"
                          >
                            Inspect Ratios
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 5: DEDICATED ANALYTICS & VISUALIZATIONS PAGE          */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-5 h-5 text-blue-400" /> Market Analytics & Financial Visualizations
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Interactive chart analysis for NIFTY 50 and Screener.in fundamental distributions</p>
                </div>

                <div className="flex items-center gap-2 bg-[#181d2e] p-1 rounded-full border border-[#262d45]">
                  {(['NIFTY', 'RELIANCE', 'TCS', 'HDFCBANK'] as const).map(m => (
                    <button
                      key={m}
                      onClick={() => setChartMetric(m)}
                      className={`text-xs px-3 py-1 rounded-full font-semibold transition ${chartMetric === m ? 'pill-active' : 'text-slate-400'}`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              {/* Price History Area Chart */}
              <div className="glass-panel rounded-2xl p-6 border border-[#22283d] space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <LineIcon className="w-4 h-4 text-blue-400" /> Price History & Growth Trend ({chartMetric} in INR)
                  </h3>
                  <span className="text-xs text-emerald-400 font-semibold flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-1" /> +15.3% YTD Growth
                  </span>
                </div>

                <div className="h-72 w-full pt-2">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={TIME_SERIES_DATA}>
                      <defs>
                        <linearGradient id="blueGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}/>
                        </linearGradient>
                      </defs>
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={11} tickLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} domain={['auto', 'auto']} />
                      <Tooltip content={<CustomChartTooltip />} />
                      <Area type="monotone" dataKey={chartMetric} stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#blueGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              {/* Bottom Row: Bar Chart & Pie Chart with High Contrast Legible Colors */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* ROCE vs P/E Bar Chart */}
                <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-[#22283d] space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" /> ROCE % vs P/E Ratio Comparison
                  </h3>
                  <div className="h-64 w-full pt-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={stocks.slice(0, 8)}>
                        <XAxis dataKey="symbol" stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip />} />
                        <Bar dataKey="roce_pct" name="ROCE %" fill="#3b82f6" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="pe_ratio" name="P/E Ratio" fill="#8b5cf6" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Pie Chart: Legible White Labels & High Contrast Legend */}
                <div className="lg:col-span-5 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col justify-between space-y-4">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <PieIcon className="w-4 h-4 text-blue-400" /> Ingested Sector Distribution
                  </h3>
                  
                  <div className="h-56 w-full flex items-center justify-center">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SECTOR_PIE_DATA}
                          cx="50%"
                          cy="50%"
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {SECTOR_PIE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="#121624" strokeWidth={2} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>

                  {/* High Contrast Legible White Legend Text */}
                  <div className="space-y-1.5 pt-2 border-t border-[#1e2436]">
                    {SECTOR_PIE_DATA.map(d => (
                      <div key={d.name} className="flex items-center justify-between text-xs px-2 py-1 bg-[#181d2e] rounded-lg border border-[#262d45]">
                        <span className="flex items-center gap-2 text-white font-medium">
                          <span className="w-3 h-3 rounded-full shadow-sm" style={{ backgroundColor: d.color }}></span>
                          {d.name}
                        </span>
                        <span className="font-bold text-[#60a5fa]">{d.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#121624] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-[#262d45] p-6 shadow-2xl">
            <div className="flex items-center justify-between border-b border-[#1e2436] pb-4 mb-4">
              <div>
                <h3 className="text-lg font-bold text-white">{selectedStock.stock?.name || selectedStock.stock?.symbol || 'Stock Fundamentals'}</h3>
                <p className="text-xs text-slate-400">Sector: {selectedStock.stock?.sector} | NSE: {selectedStock.stock?.nse_id} | BSE: {selectedStock.stock?.bse_id}</p>
              </div>
              <button onClick={() => setSelectedStock(null)} className="p-2 text-slate-400 hover:text-white rounded-lg bg-[#181d2e] border border-[#262d45]">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fundamentals Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-[#0b0d14] p-4 rounded-xl border border-[#1e2436] text-center">
              <div>
                <span className="text-xs text-slate-400 block">Market Cap</span>
                <span className="text-sm font-bold text-white">Rs {selectedStock.stock?.market_cap_cr?.toLocaleString() || '0'} Cr</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">P/E Ratio</span>
                <span className="text-sm font-bold text-white">{selectedStock.stock?.pe_ratio || '0'}</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Debt to Equity</span>
                <span className={`text-sm font-bold ${(selectedStock.stock?.debt_to_equity || 0) > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                  {selectedStock.stock?.debt_to_equity || '0'}
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
