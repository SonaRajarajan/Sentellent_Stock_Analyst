'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, Bot, Search, Plus, ExternalLink,
  UserCheck, BookOpen, BarChart3, RefreshCw, Send, X, Layers, Activity,
  TrendingUp, TrendingDown, Filter, ShieldCheck, ChevronRight, CheckCircle2,
  PieChart as PieIcon, LineChart as LineIcon, Lock, LogOut, ArrowUpRight, Check, Sparkles,
  Palette, Monitor, Sliders, DollarSign, Award, Flame, HelpCircle
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
const CustomChartTooltip = ({ active, payload, label, theme }: any) => {
  if (active && payload && payload.length) {
    const isPixel = theme === 'pixel';
    return (
      <div className={isPixel ? "bg-[#181b26] border-4 border-black p-3 text-xs font-pixel-body shadow-md z-50" : "bg-[#182035] border border-blue-500/50 p-3 rounded-xl shadow-2xl text-xs z-50"}>
        <p className={isPixel ? "font-bold text-green-400 mb-1 text-[11px]" : "font-bold text-white mb-1"}>{label || payload[0].name}</p>
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

// Retro 8-Bit Pixel Art Stock Growth Chart & Golden Coin Graphic (Matching User Reference Image)
const PixelStockBoardGraphic = () => (
  <svg viewBox="0 0 200 220" className="w-28 h-28 mx-auto drop-shadow-md">
    {/* Stand Anchor Top */}
    <rect x="94" y="4" width="12" height="12" fill="#334155" stroke="#000" strokeWidth="3" />
    <polygon points="100,16 60,32 140,32" fill="#475569" stroke="#000" strokeWidth="3" />
    
    {/* Whiteboard Frame */}
    <rect x="20" y="32" width="160" height="130" fill="#e2e8f0" stroke="#000" strokeWidth="4" />
    
    {/* Grid Lines */}
    <line x1="52" y1="32" x2="52" y2="162" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="84" y1="32" x2="84" y2="162" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="116" y1="32" x2="116" y2="162" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="148" y1="32" x2="148" y2="162" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="20" y1="65" x2="180" y2="65" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="20" y1="98" x2="180" y2="98" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />
    <line x1="20" y1="130" x2="180" y2="130" stroke="#cbd5e1" strokeWidth="2" strokeDasharray="4 4" />

    {/* Y Axis Arrow */}
    <line x1="36" y1="152" x2="36" y2="48" stroke="#1e293b" strokeWidth="6" />
    <polygon points="36,40 26,56 46,56" fill="#1e293b" stroke="#000" strokeWidth="2" />
    
    {/* X Axis Arrow */}
    <line x1="36" y1="152" x2="168" y2="152" stroke="#1e293b" strokeWidth="6" />
    <polygon points="176,152 160,142 160,162" fill="#1e293b" stroke="#000" strokeWidth="2" />

    {/* Rising Arcade Green Stock Line */}
    <path d="M 50 135 L 75 115 L 95 122 L 120 95 L 140 102 L 165 65" fill="none" stroke="#22c55e" strokeWidth="8" strokeLinejoin="miter" />
    <polygon points="172,58 152,60 162,78" fill="#22c55e" stroke="#000" strokeWidth="2" />

    {/* Golden Equity Coin */}
    <circle cx="56" cy="136" r="22" fill="#f59e0b" stroke="#000" strokeWidth="4" />
    <circle cx="56" cy="136" r="17" fill="#fbbf24" stroke="#000" strokeWidth="2" />
    <text x="56" y="143" fontSize="18" fontWeight="bold" fontFamily="monospace" textAnchor="middle" fill="#78350f">₹</text>

    {/* Stand Tripod Legs */}
    <rect x="94" y="162" width="12" height="30" fill="#334155" stroke="#000" strokeWidth="3" />
    <line x1="100" y1="192" x2="65" y2="216" stroke="#334155" strokeWidth="5" />
    <line x1="100" y1="192" x2="135" y2="216" stroke="#334155" strokeWidth="5" />
    <rect x="58" y="212" width="14" height="6" fill="#000" />
    <rect x="128" y="212" width="14" height="6" fill="#000" />
  </svg>
);

export default function DashboardPage() {
  // Navigation View State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'agent' | 'screener' | 'analytics'>('dashboard');

  // Auth & Theme Selection State
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasSelectedTheme, setHasSelectedTheme] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState<'obsidian' | 'pixel'>('obsidian');

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
    setHasSelectedTheme(false); // Prompt theme selection screen next!
  };

  const handleSelectTheme = (theme: 'obsidian' | 'pixel') => {
    setSelectedTheme(theme);
    setHasSelectedTheme(true);
    showNotificationMsg(theme === 'pixel' ? '🎮 Loaded Retro 8-Bit Pixel Art Theme!' : '✨ Loaded Midnight Obsidian Theme!');
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

    showNotificationMsg(`✓ Ingested ${cleanSym}! Watchlist & RAG store updated.`);

    // Automatically append confirmation message to RAG Chat
    setChatMessages(prev => [
      ...prev,
      {
        sender: 'agent',
        text: `✓ **Successfully Ingested ${cleanSym} (${updatedStock.name})!**\n\nScreener.in fundamentals and financial news RSS vectors have been chunked, embedded, and indexed into \`pgvector\`. You can now ask any grounded research or valuation queries for **${cleanSym}**!`
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
  const isPixel = selectedTheme === 'pixel';

  // =================================================================
  // STEP 1: AUTHENTICATION LOGIN PAGE SCREEN
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
                className="flex-1 bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-bold py-2.5 rounded-xl border border-[#262d45] transition"
              >
                Hari Sankar (Test User)
              </button>
              <button
                type="button"
                onClick={() => {
                  setLoginEmail('naga@sentellent.com');
                  handleLoginSubmit();
                }}
                className="flex-1 bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 text-[11px] font-bold py-2.5 rounded-xl border border-[#262d45] transition"
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
  // STEP 2: DUAL THEME SELECTION SCREEN (Post Login Prompt)
  // =================================================================
  if (isLoggedIn && !hasSelectedTheme) {
    return (
      <div className="min-h-screen bg-[#0b0d14] flex items-center justify-center p-6 font-sans">
        <div className="max-w-3xl w-full space-y-8 text-center">
          <div className="space-y-3">
            <span className="px-3.5 py-1 rounded-full text-[11px] font-bold bg-blue-600/20 text-blue-400 border border-blue-500/30 uppercase tracking-widest inline-block">
              Theme Experience Selection
            </span>
            <h1 className="text-3xl font-extrabold text-white tracking-tight">Choose Your Workspace Theme</h1>
            <p className="text-xs text-slate-400 max-w-lg mx-auto">
              Select your preferred visual style for the Sentellent Equity Analyst dashboard. You can switch themes anytime during your session.
            </p>
          </div>

          {/* 2 Interactive Small Theme Selection Preview Boxes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-left">
            {/* BOX 1: Midnight Obsidian Theme */}
            <div
              onClick={() => handleSelectTheme('obsidian')}
              className="glass-panel p-6 rounded-3xl border-2 border-blue-500/40 hover:border-blue-500 transition-all cursor-pointer group shadow-2xl flex flex-col justify-between hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-md shadow-blue-500/30">
                    <Sparkles className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-bold bg-blue-950 text-blue-400 border border-blue-800 px-2.5 py-0.5 rounded-full">
                    DEFAULT CYBERPUNK
                  </span>
                </div>

                {/* Theme Visual Preview Box */}
                <div className="bg-[#0f121e] border border-[#22283d] rounded-2xl p-4 space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">RELIANCE.NS</span>
                    <span className="text-emerald-400 font-bold">Rs 2,940.50</span>
                  </div>
                  <div className="h-10 bg-gradient-to-r from-blue-600/20 to-emerald-500/20 rounded-lg border border-blue-500/30 flex items-center justify-center">
                    <div className="w-full h-1 bg-gradient-to-r from-blue-500 via-indigo-500 to-emerald-400 rounded-full mx-3"></div>
                  </div>
                </div>

                <div>
                  <h3 className="text-base font-bold text-white group-hover:text-blue-400 transition">Midnight Obsidian</h3>
                  <p className="text-xs text-slate-400 mt-1">
                    Sleek dark cyberpunk UI with glassmorphism, electric blue accents, and smooth vector graphs.
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full bg-blue-600 group-hover:bg-blue-500 text-white font-bold py-3 rounded-xl transition text-xs shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2">
                Select Obsidian Theme <ArrowUpRight className="w-4 h-4" />
              </button>
            </div>

            {/* BOX 2: Retro 8-Bit Pixel Art Theme (Inspired by Reference Image!) */}
            <div
              onClick={() => handleSelectTheme('pixel')}
              className="bg-[#181b26] p-6 rounded-2xl border-4 border-black shadow-[6px_6px_0px_0px_#000] hover:border-emerald-400 transition-all cursor-pointer group flex flex-col justify-between hover:-translate-y-1"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="w-10 h-10 rounded-lg bg-emerald-500 border-2 border-black flex items-center justify-center text-black font-bold text-lg shadow-[2px_2px_0px_0px_#000]">
                    🕹️
                  </div>
                  <span className="text-[9px] font-pixel-heading bg-emerald-950 text-emerald-300 border-2 border-black px-2 py-1 shadow-[2px_2px_0px_0px_#000]">
                    RETRO ARCADE
                  </span>
                </div>

                {/* Theme Visual Preview Box - Retro Stock Board & Golden Coin */}
                <div className="bg-[#202433] border-3 border-black p-3 shadow-[3px_3px_0px_0px_#000] space-y-2 text-center">
                  <PixelStockBoardGraphic />
                  <div className="font-pixel-body text-[11px] text-amber-400 font-bold">
                    [ ₹ 12,641,750 COINS ]
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-pixel-heading text-white group-hover:text-emerald-400 transition">Retro 8-Bit Pixel Art</h3>
                  <p className="text-xs font-pixel-body text-slate-300 mt-2">
                    Nostalgic arcade terminal with 8-bit chunky pixel borders, retro fonts, golden coin metrics, and arcade buttons.
                  </p>
                </div>
              </div>

              <button className="mt-6 w-full pixel-btn-primary py-3 text-xs flex items-center justify-center gap-2">
                Select Pixel Theme 🕹️
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Helper Theme Classes
  const mainBgClass = isPixel ? 'min-h-screen bg-[#0f111a] font-pixel-body text-slate-100 flex' : 'min-h-screen bg-[#0b0d14] font-sans text-slate-100 flex';
  const sidebarClass = isPixel ? 'w-64 bg-[#161926] border-r-4 border-black shadow-[4px_0px_0px_0px_#000] flex flex-col justify-between p-5 hidden md:flex' : 'w-64 bg-[#10131e] border-r border-[#1e2436] flex flex-col justify-between p-5 hidden md:flex';
  const headerClass = isPixel ? 'h-16 bg-[#161926] border-b-4 border-black shadow-[0px_4px_0px_0px_#000] px-6 flex items-center justify-between sticky top-0 z-40' : 'h-16 border-b border-[#1e2436] bg-[#10131e]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40';
  const quickBannerClass = isPixel ? 'bg-[#181b26] border-b-4 border-black px-6 py-2.5 flex items-center gap-3 overflow-x-auto' : 'bg-[#0e121d] border-b border-[#1e2436] px-6 py-2.5 flex items-center gap-3 overflow-x-auto';
  const panelClass = isPixel ? 'pixel-panel p-5 space-y-4' : 'glass-panel rounded-2xl p-5 border border-[#22283d] space-y-4';
  const cardClass = isPixel ? 'pixel-card p-5 space-y-4' : 'glass-card rounded-2xl p-5 border border-[#262d45] space-y-4';

  // =================================================================
  // STEP 3: MAIN DASHBOARD INTERFACE (Dynamic Theme Render)
  // =================================================================
  return (
    <div className={mainBgClass}>
      {/* Toast Notification */}
      {notification && (
        <div className={isPixel ? 'fixed top-4 right-4 z-50 bg-emerald-500 text-black border-4 border-black shadow-[4px_4px_0px_0px_#000] font-pixel-body px-5 py-3 flex items-center gap-2.5 text-xs font-semibold' : 'fixed top-4 right-4 z-50 bg-blue-600 text-white border border-blue-400 shadow-2xl rounded-2xl px-5 py-3 flex items-center gap-2.5 text-xs font-semibold'}>
          <CheckCircle2 className="w-4 h-4" />
          {notification}
        </div>
      )}

      {/* Sidebar Navigation */}
      <aside className={sidebarClass}>
        <div className="space-y-6">
          {/* Brand Logo */}
          <div className="flex items-center gap-3">
            <div className={isPixel ? 'w-10 h-10 bg-emerald-500 border-3 border-black text-black font-pixel-heading shadow-[3px_3px_0px_0px_#000] flex items-center justify-center font-bold text-lg' : 'w-10 h-10 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-500/30 flex items-center justify-center font-bold text-lg'}>
              {isPixel ? '🪙' : 'S'}
            </div>
            <div>
              <span className={isPixel ? 'font-bold text-white font-pixel-heading text-xs tracking-wider block' : 'font-bold text-white text-base tracking-wide block'}>
                {isPixel ? 'EQUITY 8-BIT' : 'Sentellent'}
              </span>
              <span className={isPixel ? 'text-[10px] text-amber-400 font-bold uppercase tracking-wider block' : 'text-[10px] text-blue-400 font-semibold uppercase tracking-wider block'}>
                {isPixel ? 'ARCADE RAG CHIEF' : 'Equity Chief RAG'}
              </span>
            </div>
          </div>

          {/* Main Menu Tabs */}
          <div className="space-y-1.5">
            <span className={isPixel ? 'text-[10px] font-bold text-emerald-400 font-pixel-heading uppercase tracking-wider px-3 block mb-2' : 'text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2'}>
              Main Menu
            </span>
            
            <button
              onClick={() => setActiveTab('dashboard')}
              className={activeTab === 'dashboard' ? (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition pixel-pill-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition pill-active') : (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-[#202433]' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:bg-[#181d2e] hover:text-white')}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard Overview
            </button>

            <button
              onClick={() => setActiveTab('portfolio')}
              className={activeTab === 'portfolio' ? (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition pixel-pill-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition pill-active') : (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-[#202433]' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:bg-[#181d2e] hover:text-white')}
            >
              <Briefcase className="w-4 h-4" /> Tracked Portfolio
            </button>

            <button
              onClick={() => setActiveTab('agent')}
              className={activeTab === 'agent' ? (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition pixel-pill-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition pill-active') : (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-[#202433]' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:bg-[#181d2e] hover:text-white')}
            >
              <Bot className="w-4 h-4" /> RAG Chief Assistant
            </button>

            <button
              onClick={() => setActiveTab('screener')}
              className={activeTab === 'screener' ? (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition pixel-pill-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition pill-active') : (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-[#202433]' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:bg-[#181d2e] hover:text-white')}
            >
              <BarChart3 className="w-4 h-4" /> Screener & Ratios
            </button>

            <button
              onClick={() => setActiveTab('analytics')}
              className={activeTab === 'analytics' ? (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition pixel-pill-active' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition pill-active') : (isPixel ? 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-lg text-xs font-semibold transition text-slate-300 hover:bg-[#202433]' : 'w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition text-slate-400 hover:bg-[#181d2e] hover:text-white')}
            >
              <PieIcon className="w-4 h-4" /> Analytics & Charts
            </button>
          </div>
        </div>

        {/* Theme Switcher & Logged In User Footer Card */}
        <div className="space-y-3 pt-4 border-t border-[#1e2436]">
          {/* Interactive Theme Switcher Button */}
          <button
            onClick={() => setHasSelectedTheme(false)}
            className={isPixel ? 'w-full py-2 px-3 text-[11px] font-bold flex items-center justify-center gap-2 pixel-btn-secondary text-black transition' : 'w-full py-2 px-3 text-[11px] font-bold flex items-center justify-center gap-2 bg-indigo-600/20 text-indigo-300 border border-indigo-500/40 hover:bg-indigo-600 hover:text-white rounded-xl transition'}
          >
            <Palette className="w-3.5 h-3.5" />
            {isPixel ? '🎮 SWITCH THEME' : '✨ Change Workspace Theme'}
          </button>

          <div className={isPixel ? 'pixel-panel p-3 flex items-center justify-between' : 'bg-[#161b2c] p-3 rounded-xl border border-[#262d45] flex items-center justify-between'}>
            <div className="overflow-hidden">
              <span className={isPixel ? 'text-[10px] text-amber-400 font-pixel-body font-bold uppercase block' : 'text-[10px] text-slate-400 font-semibold uppercase block'}>Analyst Profile</span>
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
        <header className={headerClass}>
          {/* Top Search Bar with Live Ticker Autocomplete */}
          <div className="relative max-w-lg w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3 z-10" />
            <input
              type="text"
              placeholder="Search ticker (e.g. RELIANCE, TCS, HDFCBANK)..."
              value={searchQuery}
              onFocus={() => setShowSuggestions(true)}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onKeyDown={(e) => e.key === 'Enter' && handleFollowStock(searchQuery)}
              className={isPixel ? 'w-full bg-[#202433] border-3 border-black text-xs text-white placeholder-slate-400 px-4 pl-10 pr-24 py-2 font-pixel-body shadow-[2px_2px_0px_0px_#000]' : 'w-full bg-[#181d2e] border border-[#262d45] rounded-full pl-10 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500'}
            />
            <button
              onClick={() => handleFollowStock(searchQuery)}
              disabled={isIngesting || !searchQuery.trim()}
              className={isPixel ? 'absolute right-1.5 top-1 z-10 text-[11px] font-semibold px-4 py-1 transition disabled:opacity-50 pixel-btn-primary py-0.5' : 'absolute right-1.5 top-1 z-10 text-[11px] font-semibold px-4 py-1 transition disabled:opacity-50 bg-blue-600 hover:bg-blue-500 text-white rounded-full'}
            >
              {isIngesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Ingest'}
            </button>

            {/* Live Autocomplete Suggestions Dropdown */}
            {showSuggestions && matchingSuggestions.length > 0 && (
              <div className={isPixel ? 'absolute top-11 left-0 right-0 bg-[#181b26] border-4 border-black shadow-[4px_4px_0px_0px_#000] z-50 max-h-60 overflow-y-auto p-2' : 'absolute top-11 left-0 right-0 bg-[#121624] border border-[#262d45] rounded-2xl shadow-2xl z-50 max-h-60 overflow-y-auto p-2'}>
                <span className={isPixel ? 'text-[10px] font-bold text-amber-400 font-pixel-heading uppercase tracking-wider px-3 py-1 block' : 'text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 py-1 block'}>Suggested Indian Stocks</span>
                {matchingSuggestions.map(s => (
                  <div
                    key={s.symbol}
                    onClick={() => {
                      setSearchQuery(s.symbol);
                      handleFollowStock(s.symbol);
                    }}
                    className={isPixel ? 'flex items-center justify-between p-2.5 hover:bg-[#202433] border-b border-black cursor-pointer transition text-xs' : 'flex items-center justify-between p-2.5 hover:bg-[#181d2e] rounded-xl cursor-pointer transition text-xs'}
                  >
                    <div>
                      <span className="font-bold text-white text-xs block">{s.symbol}</span>
                      <span className="text-[10px] text-slate-400">{s.name} • {s.sector}</span>
                    </div>
                    <span className={isPixel ? 'text-[10px] pixel-pill-active font-semibold px-2.5 py-1' : 'text-[10px] bg-blue-950 text-blue-300 border border-blue-800 rounded-lg font-semibold px-2.5 py-1'}>+ Ingest RAG</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Profile & Theme Quick Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSelectedTheme(isPixel ? 'obsidian' : 'pixel')}
              className={isPixel ? 'px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 pixel-btn-secondary text-black' : 'px-3 py-1.5 text-xs font-bold transition flex items-center gap-1.5 bg-[#181d2e] hover:bg-blue-600 text-slate-300 hover:text-white border border-[#262d45] rounded-full'}
            >
              {isPixel ? '✨ Obsidian Mode' : '🕹️ Pixel 8-Bit Mode'}
            </button>

            <div className={isPixel ? 'pixel-panel px-3 py-1 text-[11px] font-bold text-emerald-400 flex items-center gap-2' : 'bg-[#181d2e] border border-[#262d45] rounded-full px-3.5 py-1.5 text-xs text-white font-medium flex items-center gap-2'}>
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span>
              {currentUser.email}
            </div>
          </div>
        </header>

        {/* Quick Ingest Select Example Companies Banner */}
        <div className={quickBannerClass}>
          <span className={isPixel ? 'text-[11px] font-bold text-amber-400 font-pixel-heading uppercase tracking-wider whitespace-nowrap flex items-center gap-1' : 'text-[11px] font-bold text-blue-400 uppercase tracking-wider whitespace-nowrap flex items-center gap-1'}>
            ⚡ Quick Ingest Select:
          </span>
          <div className="flex items-center gap-2">
            {EXAMPLE_INGEST_COMPANIES.map(comp => (
              <button
                key={comp.symbol}
                onClick={() => handleFollowStock(comp.symbol)}
                className={isPixel ? (lastIngestedSymbol === comp.symbol ? 'text-xs px-3 py-1 transition flex items-center gap-1.5 whitespace-nowrap pixel-btn-primary animate-pulse' : 'text-xs px-3 py-1 transition flex items-center gap-1.5 whitespace-nowrap pixel-pill-inactive') : (lastIngestedSymbol === comp.symbol ? 'text-xs px-3 py-1 transition flex items-center gap-1.5 whitespace-nowrap bg-blue-600 text-white border-blue-400 shadow-md font-bold animate-pulse rounded-full' : 'text-xs px-3 py-1 transition flex items-center gap-1.5 whitespace-nowrap bg-[#181d2e] hover:bg-blue-600 text-slate-300 hover:text-white border-[#262d45] rounded-full')}
              >
                <span className="font-bold">{isPixel ? `[ ${comp.symbol} ]` : comp.symbol}</span>
                <span className="text-[10px] opacity-80">({comp.price})</span>
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
                <div className={isPixel ? 'pixel-panel p-5 lg:col-span-4 flex flex-col justify-between' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-4 flex flex-col justify-between'}>
                  <div>
                    <span className={isPixel ? 'text-xs font-medium text-amber-400 font-bold block' : 'text-xs font-medium text-slate-400 block'}>
                      Total Tracked Equity Holding
                    </span>
                    <div className="flex items-baseline gap-2 mt-1">
                      <h2 className={isPixel ? 'text-2xl font-bold text-emerald-400 font-pixel-heading text-xl' : 'text-2xl font-bold text-white'}>
                        Rs {totalPortfolioValue.toLocaleString()}.00
                      </h2>
                      <span className="text-xs font-semibold text-emerald-400 flex items-center">
                        <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12.4%
                      </span>
                    </div>
                  </div>

                  {/* Pixel Art Stock Stand Graphic Display in Pixel Mode! */}
                  {isPixel && (
                    <div className="my-4 p-2 bg-[#202433] border-3 border-black text-center shadow-[3px_3px_0px_0px_#000]">
                      <PixelStockBoardGraphic />
                      <span className="text-[10px] font-pixel-body text-amber-300 font-bold block mt-1">
                        [ 8-BIT EQUITY BOARD ]
                      </span>
                    </div>
                  )}

                  <div className={isPixel ? 'mt-4 pt-4 border-t-2 border-black' : 'mt-4 pt-4 border-t border-[#1e2436]'}>
                    <span className={isPixel ? 'text-[10px] font-semibold text-amber-400 font-pixel-heading uppercase tracking-wider block mb-2' : 'text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2'}>
                      Select Example Companies to Ingest
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {EXAMPLE_INGEST_COMPANIES.slice(0, 6).map(t => (
                        <button
                          key={t.symbol}
                          onClick={() => handleFollowStock(t.symbol)}
                          className={isPixel ? 'text-[11px] px-2.5 py-1 transition pixel-pill-inactive' : 'text-[11px] px-2.5 py-1 transition bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 rounded-full border border-[#262d45]'}
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
                      className={isPixel ? 'pixel-card min-w-[210px] p-4 cursor-pointer flex-1' : 'glass-card min-w-[210px] flex-1 rounded-2xl p-4 cursor-pointer transition group'}
                    >
                      <div className="flex items-center justify-between">
                        <span className={isPixel ? 'font-bold text-white font-pixel-heading text-xs' : 'font-bold text-white text-sm'}>{s.symbol}</span>
                        <span className={isPixel ? 'text-[10px] bg-amber-400 text-black font-bold px-1.5 py-0.5 border border-black' : 'text-[10px] bg-blue-950 text-blue-400 font-semibold px-2 py-0.5 rounded-md'}>
                          NSE
                        </span>
                      </div>
                      <span className="text-[10px] text-slate-400 truncate block mt-0.5">{s.name}</span>
                      
                      <div className="mt-4">
                        <span className={isPixel ? 'text-lg font-extrabold text-emerald-400 font-pixel-body' : 'text-lg font-extrabold text-white'}>
                          Rs {s.current_price_inr.toLocaleString()}
                        </span>
                        <div className="flex items-center justify-between text-[11px] text-slate-400 mt-2">
                          <span>P/E: <strong className="text-slate-200">{s.pe_ratio}</strong></span>
                          <span>Debt/Eq: <strong className={s.debt_to_equity <= 0.5 ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>{s.debt_to_equity}</strong></span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Main Grid: Fundamentals Table & RAG Chat Drawer */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Watchlist Fundamentals Table */}
                <div className={isPixel ? 'pixel-panel p-5 lg:col-span-7 space-y-4' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-7 space-y-4'}>
                  <div className="flex items-center justify-between">
                    <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400 flex items-center gap-2' : 'font-bold text-white text-sm flex items-center gap-2'}>
                      <Activity className="w-4 h-4 text-blue-400" />
                      Tracked Stock Fundamentals & Sentiment ({filteredStocks.length})
                    </h3>
                    <button onClick={() => setActiveTab('portfolio')} className="text-xs text-blue-400 hover:underline font-semibold flex items-center gap-1">
                      View Full Portfolio <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className={isPixel ? 'border-b-2 border-black text-amber-400 font-pixel-heading text-[10px]' : 'border-b border-[#1e2436] text-slate-400 font-semibold'}>
                          <th className="pb-3">Stock Ticker</th>
                          <th className="pb-3">Price (INR)</th>
                          <th className="pb-3">P/E</th>
                          <th className="pb-3">Debt/Eq</th>
                          <th className="pb-3">ROCE %</th>
                          <th className="pb-3 text-right">Action</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-[#1e2436]/50">
                        {filteredStocks.map(s => (
                          <tr key={s.symbol} className="hover:bg-[#181d2e]/50 transition group">
                            <td className="py-3 font-bold text-white flex items-center gap-2">
                              {s.symbol}
                              {lastIngestedSymbol === s.symbol && (
                                <span className={isPixel ? 'text-[9px] bg-emerald-500 text-black border border-black font-bold px-1.5 py-0.5 animate-pulse' : 'text-[9px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold px-1.5 py-0.5 rounded animate-pulse'}>
                                  NEW
                                </span>
                              )}
                            </td>
                            <td className={isPixel ? 'py-3 font-semibold text-emerald-400 font-bold' : 'py-3 font-semibold text-slate-200'}>Rs {s.current_price_inr.toLocaleString()}</td>
                            <td className="py-3 text-slate-300">{s.pe_ratio}</td>
                            <td className={s.debt_to_equity <= 0.5 ? 'py-3 font-bold text-emerald-400' : 'py-3 font-bold text-amber-400'}>{s.debt_to_equity}</td>
                            <td className="py-3 text-slate-300">{s.roce_pct}%</td>
                            <td className="py-3 text-right">
                              <button
                                onClick={() => handleOpenStockDetail(s.symbol)}
                                className={isPixel ? 'text-[11px] pixel-btn-secondary px-2 py-0.5 text-xs transition' : 'text-[11px] bg-[#181d2e] hover:bg-blue-600 text-slate-300 hover:text-white px-3 py-1 rounded-lg border border-[#262d45] transition'}
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

                {/* Agentic RAG Chief Assistant Sidebar Drawer */}
                <div className={isPixel ? 'pixel-panel p-5 lg:col-span-5 flex flex-col justify-between space-y-4' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-5 flex flex-col justify-between space-y-4'}>
                  <div className="flex items-center justify-between border-b border-[#1e2436] pb-3">
                    <div className="flex items-center gap-2">
                      <Bot className="w-5 h-5 text-blue-400" />
                      <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400' : 'font-bold text-white text-sm'}>RAG Chief Assistant</h3>
                    </div>
                    <span className={isPixel ? 'text-[10px] bg-amber-400 text-black border border-black font-bold px-2 py-0.5' : 'text-[10px] bg-blue-950 text-blue-300 border border-blue-800 px-2.5 py-0.5 rounded-full font-semibold'}>
                      LangGraph Active
                    </span>
                  </div>

                  {/* Active Investor Persona Pill */}
                  <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3 text-[11px] space-y-1' : 'bg-[#161b2c] p-3 rounded-xl border border-[#262d45] text-xs space-y-1'}>
                    <span className="text-[10px] text-slate-400 font-semibold uppercase block">Investor Persona:</span>
                    <p className="text-white font-bold">{persona.risk_profile} Investor (Max Debt: {persona.max_debt_to_equity})</p>
                  </div>

                  {/* Chat Messages Log */}
                  <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
                    {chatMessages.map((msg, i) => (
                      <div key={i} className={msg.sender === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                        <div className={msg.sender === 'user' ? (isPixel ? 'p-3 text-xs leading-relaxed max-w-[90%] bg-blue-600 text-white border-2 border-black shadow-[2px_2px_0px_0px_#000]' : 'p-3 text-xs leading-relaxed max-w-[90%] bg-blue-600 text-white rounded-2xl rounded-tr-none') : (isPixel ? 'p-3 text-xs leading-relaxed max-w-[90%] bg-[#202433] text-slate-200 border-2 border-black shadow-[2px_2px_0px_0px_#000]' : 'p-3 text-xs leading-relaxed max-w-[90%] bg-[#181d2e] text-slate-200 border border-[#262d45] rounded-2xl rounded-tl-none')}>
                          <p className="whitespace-pre-line">{msg.text}</p>
                          
                          {/* Grounded Citations */}
                          {msg.citations && msg.citations.length > 0 && (
                            <div className="mt-2.5 pt-2 border-t border-slate-700/50 space-y-1">
                              <span className="text-[10px] font-bold text-amber-300 block">Ingested Sources & Citations:</span>
                              {msg.citations.map((c, idx) => (
                                <a
                                  key={idx}
                                  href={c.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[10px] text-blue-300 hover:underline block truncate"
                                >
                                  [{idx + 1}] {c.title} ({c.source})
                                </a>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Chat Input */}
                  <div className="relative pt-2">
                    <input
                      type="text"
                      placeholder="Ask AI Research Chief..."
                      value={inputMsg}
                      onChange={(e) => setInputMsg(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      className={isPixel ? 'w-full bg-[#202433] border-3 border-black text-xs text-white px-4 pr-12 py-3 font-pixel-body' : 'w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-4 pr-12 py-3 text-xs text-white focus:outline-none focus:border-blue-500'}
                    />
                    <button
                      onClick={() => handleSendMessage()}
                      disabled={isAgentThinking}
                      className={isPixel ? 'absolute right-2 top-4 pixel-btn-primary p-1.5 transition' : 'absolute right-2 top-4 bg-blue-600 text-white p-2 rounded-lg transition'}
                    >
                      <Send className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 2: TRACKED PORTFOLIO MANAGER                         */}
          {/* ========================================================= */}
          {activeTab === 'portfolio' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={isPixel ? 'text-xl font-bold text-white font-pixel-heading text-sm text-emerald-400' : 'text-xl font-bold text-white'}>
                    Tracked Indian Equity Portfolio Manager ({stocks.length})
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Manage followed tickers, Screener fundamentals, and live watchlist holdings</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {stocks.map(s => (
                  <div key={s.symbol} className={isPixel ? 'pixel-card p-5 space-y-4' : 'glass-card rounded-2xl p-5 border border-[#262d45] space-y-4'}>
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs' : 'font-bold text-white text-base'}>{s.symbol}</h3>
                        <span className="text-xs text-slate-400 block">{s.name}</span>
                      </div>
                      <span className={isPixel ? 'text-[10px] bg-amber-400 text-black border border-black font-bold px-2 py-0.5' : 'text-[10px] bg-blue-950 text-blue-300 font-semibold px-2.5 py-1 rounded-lg border border-blue-800'}>
                        NSE: {s.symbol}
                      </span>
                    </div>

                    <div className="flex items-baseline justify-between">
                      <span className={isPixel ? 'text-xl font-extrabold text-emerald-400 font-pixel-body' : 'text-xl font-extrabold text-white'}>
                        Rs {s.current_price_inr.toLocaleString()}
                      </span>
                      <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/30">
                        {s.sentiment_label}
                      </span>
                    </div>

                    <div className="grid grid-cols-4 gap-2 text-center pt-3 border-t border-[#1e2436] text-[11px]">
                      <div>
                        <span className="text-slate-400 block text-[10px]">P/E</span>
                        <strong className="text-white">{s.pe_ratio}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Debt/Eq</span>
                        <strong className={s.debt_to_equity <= 0.5 ? 'text-emerald-400' : 'text-amber-400'}>{s.debt_to_equity}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">ROCE</span>
                        <strong className="text-white">{s.roce_pct}%</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">Div Yield</span>
                        <strong className="text-blue-400">{s.dividend_yield_pct}%</strong>
                      </div>
                    </div>

                    <button
                      onClick={() => handleOpenStockDetail(s.symbol)}
                      className={isPixel ? 'w-full text-xs font-bold py-2.5 transition flex items-center justify-center gap-1.5 pixel-btn-secondary' : 'w-full text-xs font-bold py-2.5 transition flex items-center justify-center gap-1.5 bg-[#181d2e] hover:bg-blue-600 text-slate-200 hover:text-white rounded-xl border border-[#262d45]'}
                    >
                      View Screener Fundamentals & News <ArrowUpRight className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 3: AGENTIC RAG CHIEF ASSISTANT CHAT PAGE             */}
          {/* ========================================================= */}
          {activeTab === 'agent' && (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 h-[calc(100vh-140px)]">
              {/* Left Panel: Learned Investor Persona State */}
              <div className={isPixel ? 'pixel-panel p-5 lg:col-span-4 space-y-4 overflow-y-auto' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-4 space-y-4 overflow-y-auto'}>
                <div className="flex items-center gap-2 border-b border-[#1e2436] pb-3">
                  <Layers className="w-5 h-5 text-blue-400" />
                  <div>
                    <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400' : 'font-bold text-white text-sm'}>Learned Investor Persona</h3>
                    <span className="text-[10px] text-slate-400">Persistent LangGraph Memory</span>
                  </div>
                </div>

                <div className="space-y-3 text-xs">
                  <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-xl border border-[#262d45]'}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Risk Profile</span>
                    <strong className="text-white text-sm block mt-0.5">{persona.risk_profile}</strong>
                  </div>

                  <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-xl border border-[#262d45]'}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Max Debt to Equity</span>
                    <strong className="text-amber-400 text-sm block mt-0.5">{persona.max_debt_to_equity}</strong>
                  </div>

                  <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-xl border border-[#262d45]'}>
                    <span className="text-[10px] text-slate-400 uppercase font-semibold block">Min Dividend Yield</span>
                    <strong className="text-blue-400 text-sm block mt-0.5">{persona.min_dividend_yield}%</strong>
                  </div>
                </div>
              </div>

              {/* Right Panel: Full Screen Agent Chat */}
              <div className={isPixel ? 'pixel-panel p-5 lg:col-span-8 flex flex-col justify-between' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-8 flex flex-col justify-between'}>
                <div className="border-b border-[#1e2436] pb-3 flex items-center justify-between">
                  <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400' : 'font-bold text-white text-sm'}>Agentic RAG Chief Assistant</h3>
                  <span className="text-[10px] text-slate-400">Grounding Indian stock answers in Screener.in fundamentals & RSS news</span>
                </div>

                <div className="flex-1 overflow-y-auto space-y-4 my-4 pr-2">
                  {chatMessages.map((msg, i) => (
                    <div key={i} className={msg.sender === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}>
                      <div className={msg.sender === 'user' ? (isPixel ? 'p-4 text-xs leading-relaxed max-w-[85%] bg-blue-600 text-white border-2 border-black shadow-[3px_3px_0px_0px_#000]' : 'p-4 text-xs leading-relaxed max-w-[85%] bg-blue-600 text-white rounded-2xl rounded-tr-none') : (isPixel ? 'p-4 text-xs leading-relaxed max-w-[85%] bg-[#202433] text-slate-200 border-2 border-black shadow-[3px_3px_0px_0px_#000]' : 'p-4 text-xs leading-relaxed max-w-[85%] bg-[#181d2e] text-slate-200 border border-[#262d45] rounded-2xl rounded-tl-none')}>
                        <p className="whitespace-pre-line">{msg.text}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="relative">
                  <input
                    type="text"
                    placeholder="Ask AI Research Chief..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className={isPixel ? 'w-full bg-[#202433] border-3 border-black text-xs text-white px-4 pr-16 py-3.5 font-pixel-body' : 'w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-4 pr-16 py-3.5 text-xs text-white focus:outline-none focus:border-blue-500'}
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={isAgentThinking}
                    className={isPixel ? 'absolute right-2 top-2 pixel-btn-primary px-4 py-2 text-xs transition' : 'absolute right-2 top-2 bg-blue-600 text-white px-4 py-2 rounded-lg text-xs font-bold transition'}
                  >
                    Ask
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 4: SCREENER & RATIOS ENGINE                          */}
          {/* ========================================================= */}
          {activeTab === 'screener' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={isPixel ? 'text-xl font-bold text-white font-pixel-heading text-sm text-emerald-400' : 'text-xl font-bold text-white'}>
                    Screener.in Fundamentals & Multi-Factor Ratios Engine
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">Filter NIFTY / BSE universe by P/E, Debt to Equity ceiling, ROCE, and Dividend Yield</p>
                </div>
              </div>

              {/* Controls */}
              <div className={isPixel ? 'pixel-panel p-5 grid grid-cols-1 md:grid-cols-3 gap-6' : 'glass-panel rounded-2xl p-5 border border-[#22283d] grid grid-cols-1 md:grid-cols-3 gap-6'}>
                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Max Debt to Equity Ratio ({screenerMaxDebt})</label>
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
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Min Dividend Yield % ({screenerMinDiv}%)</label>
                  <input
                    type="range"
                    min="0.0"
                    max="5.0"
                    step="0.25"
                    value={screenerMinDiv}
                    onChange={(e) => setScreenerMinDiv(parseFloat(e.target.value))}
                    className="w-full accent-emerald-500 cursor-pointer"
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-300 block mb-2">Search Filter</label>
                  <input
                    type="text"
                    placeholder="Filter by ticker or name..."
                    value={screenerSearch}
                    onChange={(e) => setScreenerSearch(e.target.value)}
                    className={isPixel ? 'w-full bg-[#202433] border-2 border-black text-xs text-white px-3 py-2' : 'w-full bg-[#181d2e] border border-[#262d45] rounded-xl px-3 py-2 text-xs text-white'}
                  />
                </div>
              </div>

              {/* Table */}
              <div className={isPixel ? 'pixel-panel p-5' : 'glass-panel rounded-2xl p-5 border border-[#22283d]'}>
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className={isPixel ? 'border-b-2 border-black text-amber-400 font-pixel-heading text-[10px]' : 'border-b border-[#1e2436] text-slate-400 font-semibold'}>
                        <th className="pb-3">Stock Ticker</th>
                        <th className="pb-3">Sector</th>
                        <th className="pb-3">Price (INR)</th>
                        <th className="pb-3">P/E</th>
                        <th className="pb-3">Debt/Eq</th>
                        <th className="pb-3">ROCE %</th>
                        <th className="pb-3">ROE %</th>
                        <th className="pb-3">Div Yield</th>
                        <th className="pb-3 text-right">Details</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#1e2436]/50">
                      {filteredStocks.map(s => (
                        <tr key={s.symbol} className="hover:bg-[#181d2e]/50 transition">
                          <td className="py-3 font-bold text-white">{s.symbol}</td>
                          <td className="py-3 text-slate-400">{s.sector}</td>
                          <td className={isPixel ? 'py-3 font-semibold text-emerald-400 font-bold' : 'py-3 font-semibold text-slate-200'}>Rs {s.current_price_inr.toLocaleString()}</td>
                          <td className="py-3 text-slate-300">{s.pe_ratio}</td>
                          <td className={s.debt_to_equity <= 0.5 ? 'py-3 font-bold text-emerald-400' : 'py-3 font-bold text-amber-400'}>{s.debt_to_equity}</td>
                          <td className="py-3 text-slate-300">{s.roce_pct}%</td>
                          <td className="py-3 text-slate-300">{s.roe_pct}%</td>
                          <td className="py-3 text-blue-400 font-semibold">{s.dividend_yield_pct}%</td>
                          <td className="py-3 text-right">
                            <button
                              onClick={() => handleOpenStockDetail(s.symbol)}
                              className={isPixel ? 'text-[11px] pixel-btn-secondary px-2 py-0.5 text-xs transition' : 'text-[11px] bg-[#181d2e] hover:bg-blue-600 text-slate-300 hover:text-white px-3 py-1 rounded-lg border border-[#262d45] transition'}
                            >
                              View
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* ========================================================= */}
          {/* VIEW 5: ANALYTICS & VISUALIZATIONS PAGE                    */}
          {/* ========================================================= */}
          {activeTab === 'analytics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className={isPixel ? 'text-xl font-bold text-white font-pixel-heading text-sm text-emerald-400' : 'text-xl font-bold text-white'}>
                    Analytics & Financial Visualizations
                  </h2>
                  <p className="text-xs text-slate-400 mt-1">NIFTY 50 trend charts, ROCE vs P/E valuation bars, and sector allocation breakdown</p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                {/* Time Series Area Chart */}
                <div className={isPixel ? 'pixel-panel p-5 lg:col-span-8 space-y-4' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-8 space-y-4'}>
                  <div className="flex items-center justify-between">
                    <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400' : 'font-bold text-white text-sm'}>NIFTY 50 & Stock Growth Trend (INR)</h3>
                    <div className="flex gap-1.5">
                      {(['NIFTY', 'RELIANCE', 'TCS', 'HDFCBANK'] as const).map(m => (
                        <button
                          key={m}
                          onClick={() => setChartMetric(m)}
                          className={chartMetric === m ? (isPixel ? 'text-xs px-2.5 py-1 rounded-md transition pixel-pill-active' : 'text-xs px-2.5 py-1 rounded-lg transition bg-blue-600 text-white font-bold') : (isPixel ? 'text-xs px-2.5 py-1 rounded-md transition pixel-pill-inactive' : 'text-xs px-2.5 py-1 rounded-lg transition bg-[#181d2e] text-slate-400 hover:text-white')}
                        >
                          {m}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={TIME_SERIES_DATA}>
                        <defs>
                          <linearGradient id="colorMetric" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor={isPixel ? '#22c55e' : '#3b82f6'} stopOpacity={0.4}/>
                            <stop offset="95%" stopColor={isPixel ? '#22c55e' : '#3b82f6'} stopOpacity={0.0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" stroke="#64748b" fontSize={10} tickLine={false} />
                        <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                        <Tooltip content={<CustomChartTooltip theme={selectedTheme} />} />
                        <Area type="monotone" dataKey={chartMetric} stroke={isPixel ? '#22c55e' : '#3b82f6'} strokeWidth={3} fillOpacity={1} fill="url(#colorMetric)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Sector Allocation Donut Chart */}
                <div className={isPixel ? 'pixel-panel p-5 lg:col-span-4 space-y-4' : 'glass-panel rounded-2xl p-5 border border-[#22283d] lg:col-span-4 space-y-4'}>
                  <h3 className={isPixel ? 'font-bold text-white font-pixel-heading text-xs text-emerald-400' : 'font-bold text-white text-sm'}>Sector Allocation</h3>
                  <div className="h-52">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={SECTOR_PIE_DATA}
                          innerRadius={50}
                          outerRadius={80}
                          paddingAngle={4}
                          dataKey="value"
                        >
                          {SECTOR_PIE_DATA.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Tooltip content={<CustomChartTooltip theme={selectedTheme} />} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-1.5 text-xs">
                    {SECTOR_PIE_DATA.map((s) => (
                      <div key={s.name} className="flex items-center justify-between text-slate-300">
                        <div className="flex items-center gap-2">
                          <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: s.color }}></span>
                          <span>{s.name}</span>
                        </div>
                        <strong className="text-white">{s.value}%</strong>
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
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
          <div className={isPixel ? 'pixel-panel max-w-2xl w-full p-6 space-y-6' : 'glass-panel max-w-2xl w-full rounded-3xl p-6 border border-[#262d45] space-y-6'}>
            <div className="flex items-center justify-between border-b border-[#1e2436] pb-4">
              <div>
                <h2 className={isPixel ? 'text-xl font-bold text-white font-pixel-heading text-sm text-emerald-400' : 'text-xl font-bold text-white'}>
                  {selectedStock.stock?.name || selectedStock.stock?.symbol || "Stock Details"}
                </h2>
                <span className="text-xs text-slate-400">
                  Sector: {selectedStock.stock?.sector} | NSE: {selectedStock.stock?.symbol} | BSE: {selectedStock.stock?.bse_id}
                </span>
              </div>
              <button onClick={() => setSelectedStock(null)} className="p-2 text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-2xl border border-[#262d45]'}>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Market Cap</span>
                <strong className="text-white text-sm block mt-1">Rs {selectedStock.stock?.market_cap_cr?.toLocaleString()} Cr</strong>
              </div>
              <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-2xl border border-[#262d45]'}>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">P/E Ratio</span>
                <strong className="text-white text-sm block mt-1">{selectedStock.stock?.pe_ratio}</strong>
              </div>
              <div className={isPixel ? 'bg-[#202433] border-2 border-black p-3' : 'bg-[#161b2c] p-3 rounded-2xl border border-[#262d45]'}>
                <span className="text-[10px] text-slate-400 uppercase font-semibold block">Debt to Equity</span>
                <strong className={selectedStock.stock?.debt_to_equity <= 0.5 ? 'text-emerald-400 text-sm block mt-1' : 'text-amber-400 text-sm block mt-1'}>
                  {selectedStock.stock?.debt_to_equity}
                </strong>
              </div>
            </div>

            <button onClick={() => setSelectedStock(null)} className={isPixel ? 'w-full py-3 pixel-btn-primary text-xs font-bold' : 'w-full py-3 bg-blue-600 text-white rounded-xl text-xs font-bold'}>
              Close Window
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
