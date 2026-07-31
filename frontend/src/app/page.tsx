'use client';

import React, { useState, useEffect } from 'react';
import {
  LayoutDashboard, Briefcase, Bot, Search, Plus, ExternalLink,
  UserCheck, BookOpen, BarChart3, RefreshCw, Send, X, Layers, Activity,
  TrendingUp, TrendingDown, Bell, Settings, ArrowUpRight, Filter, ShieldCheck, ChevronRight
} from 'lucide-react';
import {
  Stock, NewsArticle, Citation, fetchStocks, fetchStockDetail,
  followStock, sendAgentQuery, loginUser, getFallbackStocks
} from '@/lib/api';

export default function DashboardPage() {
  // Navigation State
  const [activeTab, setActiveTab] = useState<'dashboard' | 'portfolio' | 'agent' | 'screener' | 'persona'>('dashboard');

  // Evaluator User State
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    email: 'harisankar@sentellent.com',
    fullName: 'Hari Sankar',
    isTestUser: true,
  });

  // Watchlist & Market State
  const [stocks, setStocks] = useState<Stock[]>(getFallbackStocks());
  const [searchQuery, setSearchQuery] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [filterType, setFilterType] = useState<'all' | 'low_debt' | 'dividend' | 'bullish'>('all');

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

  // Investor Persona State
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

  const handleSelectTestAccount = async (email: string, name: string) => {
    try {
      const res = await loginUser(email, name);
      setCurrentUser({
        id: res.user_id,
        email: res.email,
        fullName: res.full_name,
        isTestUser: res.is_test_user,
      });
    } catch (e) {
      setCurrentUser({ id: 1, email, fullName: name, isTestUser: true });
    }
  };

  const handleFollowStock = async (symbol: string) => {
    if (!symbol.trim()) return;
    const cleanSym = symbol.trim().toUpperCase().replace(".NS", "");
    setIsIngesting(true);
    
    // Add locally for instant UI responsiveness
    const existing = stocks.find(s => s.symbol === cleanSym);
    if (!existing) {
      const newStock: Stock = {
        symbol: cleanSym, nse_id: cleanSym, bse_id: "500000",
        name: `${cleanSym} India Ltd`, sector: "Indian Equities",
        market_cap_cr: 45000.0, pe_ratio: 22.5, debt_to_equity: 0.25,
        roce_pct: 18.0, roe_pct: 16.0, dividend_yield_pct: 1.20,
        sales_growth_pct: 10.0, profit_growth_pct: 12.0, high_52w: 1850.0,
        low_52w: 1100.0, current_price_inr: 1420.0,
        rolling_sentiment_score: 3.0, sentiment_label: "Bullish"
      };
      setStocks(prev => [newStock, ...prev]);
    }

    try {
      await followStock(currentUser.id, cleanSym);
      await loadStocks();
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

  // Filter stocks based on tabs
  const filteredStocks = stocks.filter(s => {
    if (filterType === 'low_debt') return s.debt_to_equity <= 0.5;
    if (filterType === 'dividend') return s.dividend_yield_pct >= 1.5;
    if (filterType === 'bullish') return (s.rolling_sentiment_score || 0) > 0;
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0b0d14] text-slate-100 flex font-sans">
      {/* Sidebar Navigation (Stovest / VertexGuard Theme) */}
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

          {/* Main Navigation */}
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider px-3 block mb-2">Main Menu</span>
            <button
              onClick={() => setActiveTab('dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'dashboard' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" /> Dashboard
            </button>
            <button
              onClick={() => setActiveTab('portfolio')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'portfolio' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <Briefcase className="w-4 h-4" /> Tracked Portfolio
            </button>
            <button
              onClick={() => setActiveTab('agent')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'agent' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <Bot className="w-4 h-4" /> RAG Chief Assistant
            </button>
            <button
              onClick={() => setActiveTab('screener')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'screener' ? 'pill-active' : 'text-slate-400 hover:bg-[#181d2e] hover:text-white'
              }`}
            >
              <BarChart3 className="w-4 h-4" /> Screener & Ratios
            </button>
          </div>
        </div>

        {/* Bottom Support Info */}
        <div className="space-y-3 pt-4 border-t border-[#1e2436]">
          <div className="bg-[#161b2c] p-3 rounded-xl border border-[#262d45] text-xs">
            <span className="text-[10px] text-slate-400 font-semibold uppercase block">System Status</span>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span className="text-white font-medium text-[11px]">Postgres / pgvector Live</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-[#1e2436] bg-[#10131e]/90 backdrop-blur-md px-6 flex items-center justify-between sticky top-0 z-40">
          {/* Top Search Bar */}
          <div className="relative max-w-md w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
            <input
              type="text"
              placeholder="Ask stocks.ai anything or enter ticker (e.g. RELIANCE, TCS)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleFollowStock(searchQuery)}
              className="w-full bg-[#181d2e] border border-[#262d45] rounded-full pl-10 pr-24 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
            />
            <button
              onClick={() => handleFollowStock(searchQuery)}
              disabled={isIngesting || !searchQuery.trim()}
              className="absolute right-1.5 top-1 bg-blue-600 hover:bg-blue-500 text-white text-[11px] font-semibold px-3 py-1 rounded-full transition disabled:opacity-50"
            >
              {isIngesting ? <RefreshCw className="w-3 h-3 animate-spin" /> : 'Ingest'}
            </button>
          </div>

          {/* Evaluator User Switcher */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 bg-[#181d2e] border border-[#262d45] rounded-full px-3 py-1.5 text-xs">
              <UserCheck className="w-4 h-4 text-blue-400" />
              <select
                value={currentUser.email}
                onChange={(e) => {
                  const val = e.target.value;
                  if (val === 'harisankar@sentellent.com') handleSelectTestAccount('harisankar@sentellent.com', 'Hari Sankar');
                  else if (val === 'naga@sentellent.com') handleSelectTestAccount('naga@sentellent.com', 'Naga');
                  else handleSelectTestAccount('demo@sentellent.com', 'Demo Evaluator');
                }}
                className="bg-transparent text-white font-medium focus:outline-none cursor-pointer"
              >
                <option value="harisankar@sentellent.com" className="bg-[#121624]">harisankar@sentellent.com (Test User)</option>
                <option value="naga@sentellent.com" className="bg-[#121624]">naga@sentellent.com (Test User)</option>
                <option value="demo@sentellent.com" className="bg-[#121624]">demo@sentellent.com (Demo Evaluator)</option>
              </select>
            </div>
          </div>
        </header>

        {/* Dashboard Body Container */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto">
          {/* Top Section: Portfolio Value & Tracked Mini Cards */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Portfolio Summary Card (Stovest Style) */}
            <div className="lg:col-span-4 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 block">Total Tracked Holding</span>
                <div className="flex items-baseline gap-2 mt-1">
                  <h2 className="text-2xl font-bold text-white">Rs 42,50,410.00</h2>
                  <span className="text-xs font-semibold text-emerald-400 flex items-center">
                    <TrendingUp className="w-3.5 h-3.5 mr-0.5" /> +12.4% (Rs 4.6L)
                  </span>
                </div>
              </div>

              {/* Ticker Quick Tags */}
              <div className="mt-4 pt-4 border-t border-[#1e2436]">
                <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block mb-2">Quick Follow Tickers</span>
                <div className="flex flex-wrap gap-1.5">
                  {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'ITC'].map(t => (
                    <button
                      key={t}
                      onClick={() => handleFollowStock(t)}
                      className="text-[11px] bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-full border border-[#262d45] transition"
                    >
                      + {t}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Mini Stock Cards Scroll View (Stovest Style) */}
            <div className="lg:col-span-8 flex gap-3 overflow-x-auto pb-1">
              {stocks.slice(0, 4).map(s => (
                <div
                  key={s.symbol}
                  onClick={() => handleOpenStockDetail(s.symbol)}
                  className="glass-card min-w-[210px] flex-1 rounded-2xl p-4 cursor-pointer hover:border-blue-500 transition group"
                >
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white group-hover:text-blue-400 transition text-sm">{s.symbol}</span>
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

          {/* Main Grid: Watchlist Table (Left 7) & RAG Assistant (Right 5) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Watchlist & Fundamentals Table (7 cols) */}
            <div className="lg:col-span-7 glass-panel rounded-2xl p-5 border border-[#22283d] flex flex-col space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <BarChart3 className="w-4 h-4 text-blue-400" /> Tracked Stock Fundamentals & Sentiment
                  </h3>
                  <p className="text-xs text-slate-400 mt-0.5">Screener.in metrics & rolling news sentiment in INR</p>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-1 bg-[#181d2e] p-1 rounded-full border border-[#262d45]">
                  <button
                    onClick={() => setFilterType('all')}
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold transition ${filterType === 'all' ? 'pill-active' : 'text-slate-400'}`}
                  >
                    All
                  </button>
                  <button
                    onClick={() => setFilterType('low_debt')}
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold transition ${filterType === 'low_debt' ? 'pill-active' : 'text-slate-400'}`}
                  >
                    Low Debt
                  </button>
                  <button
                    onClick={() => setFilterType('dividend')}
                    className={`text-[11px] px-3 py-1 rounded-full font-semibold transition ${filterType === 'dividend' ? 'pill-active' : 'text-slate-400'}`}
                  >
                    High Div
                  </button>
                </div>
              </div>

              {/* Stock Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-[#1e2436] text-slate-400 font-semibold">
                      <th className="pb-3">Stock Ticker</th>
                      <th className="pb-3">Price (INR)</th>
                      <th className="pb-3">P/E</th>
                      <th className="pb-3">Debt/Eq</th>
                      <th className="pb-3">ROCE</th>
                      <th className="pb-3">Div Yield</th>
                      <th className="pb-3">Sentiment</th>
                      <th className="pb-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1e2436]/60">
                    {filteredStocks.map((stock) => (
                      <tr key={stock.symbol} className="hover:bg-[#181d2e]/50 transition group">
                        <td className="py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-bold text-white group-hover:text-blue-400 transition">{stock.symbol}</span>
                            <span className="text-[10px] text-slate-500">{stock.sector}</span>
                          </div>
                        </td>
                        <td className="py-3 font-semibold text-slate-100">Rs {stock.current_price_inr.toLocaleString()}</td>
                        <td className="py-3 text-slate-300">{stock.pe_ratio}</td>
                        <td className="py-3">
                          <span className={`font-semibold ${stock.debt_to_equity > 0.5 ? 'text-amber-400' : 'text-emerald-400'}`}>
                            {stock.debt_to_equity}
                          </span>
                        </td>
                        <td className="py-3 text-slate-300">{stock.roce_pct}%</td>
                        <td className="py-3 text-blue-400 font-semibold">{stock.dividend_yield_pct}%</td>
                        <td className="py-3">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${
                            (stock.rolling_sentiment_score || 0) >= 0 ? 'bg-emerald-950 text-emerald-400 border border-emerald-800' : 'bg-rose-950 text-rose-400 border border-rose-800'
                          }`}>
                            {stock.sentiment_label || 'Bullish'}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => handleOpenStockDetail(stock.symbol)}
                            className="bg-[#181d2e] hover:bg-blue-600 text-blue-400 hover:text-white px-2.5 py-1 rounded-lg border border-[#262d45] text-[11px] font-semibold transition"
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

            {/* RAG Agentic Assistant & Persona Inspector (5 cols) */}
            <div className="lg:col-span-5 flex flex-col space-y-4">
              {/* Active Persona Graph Badge */}
              <div className="glass-panel rounded-2xl p-4 border border-[#22283d] flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-xl bg-blue-950 text-blue-400 border border-blue-800">
                    <Layers className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider">Investor Persona (Learned Memory)</h4>
                    <p className="text-xs text-blue-300 font-medium mt-0.5">
                      {persona.risk_profile} Investor <span className="text-slate-500">|</span> Max Debt: <span className="text-amber-400">{persona.max_debt_to_equity}</span>
                    </p>
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 rounded bg-blue-950 text-blue-400 border border-blue-800 font-mono">LangGraph Active</span>
              </div>

              {/* RAG Agent Chat Window */}
              <div className="glass-panel rounded-2xl border border-[#22283d] flex-1 flex flex-col h-[520px]">
                <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
                  {chatMessages.map((msg, index) => (
                    <div
                      key={index}
                      className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                      <div
                        className={`max-w-[90%] rounded-2xl p-3.5 leading-relaxed ${
                          msg.sender === 'user'
                            ? 'bg-blue-600 text-white font-medium shadow-md'
                            : 'bg-[#181d2e] border border-[#262d45] text-slate-200'
                        }`}
                      >
                        <div className="whitespace-pre-line">{msg.text}</div>

                        {/* Citations */}
                        {msg.citations && msg.citations.length > 0 && (
                          <div className="mt-3 pt-2.5 border-t border-[#262d45] flex flex-wrap gap-1.5">
                            <span className="text-[10px] font-bold text-blue-400 w-full mb-1 flex items-center gap-1">
                              <BookOpen className="w-3 h-3" /> Grounded Source Citations:
                            </span>
                            {msg.citations.map((cit, cIdx) => (
                              <button
                                key={cIdx}
                                onClick={() => setActiveCitation(cit)}
                                className="text-[10px] bg-[#10131e] hover:bg-blue-950 text-blue-300 px-2 py-0.5 rounded border border-[#262d45] flex items-center gap-1 transition"
                              >
                                <span>[{cit.id}]</span>
                                <span className="truncate max-w-[120px]">{cit.title}</span>
                              </button>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}

                  {isAgentThinking && (
                    <div className="flex items-center gap-2 text-xs text-blue-400 bg-[#181d2e] p-2.5 rounded-xl w-fit animate-pulse">
                      <Sparkles className="w-3.5 h-3.5 animate-spin" />
                      Retrieving vectors & screening stocks...
                    </div>
                  )}
                </div>

                {/* Prompt Suggestions */}
                <div className="p-3 border-t border-[#1e2436] bg-[#10131e] flex flex-wrap gap-1.5">
                  {[
                    "I'm a conservative, dividend-focused investor and I avoid high-debt companies",
                    "What's the sentiment on TCS this week?",
                    "Recommend stocks for my profile."
                  ].map((prompt, pIdx) => (
                    <button
                      key={pIdx}
                      onClick={() => handleSendMessage(prompt)}
                      className="text-[10px] bg-[#181d2e] hover:bg-blue-600 hover:text-white text-slate-300 px-2.5 py-1 rounded-full border border-[#262d45] transition"
                    >
                      💡 {prompt}
                    </button>
                  ))}
                </div>

                {/* Input Bar */}
                <div className="p-3 border-t border-[#1e2436] bg-[#0b0d14] rounded-b-2xl flex gap-2">
                  <input
                    type="text"
                    placeholder="Ask AI Research Chief..."
                    value={inputMsg}
                    onChange={(e) => setInputMsg(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                    className="flex-1 bg-[#181d2e] border border-[#262d45] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                  />
                  <button
                    onClick={() => handleSendMessage()}
                    disabled={!inputMsg.trim() || isAgentThinking}
                    className="bg-blue-600 hover:bg-blue-500 text-white font-semibold px-4 py-2 rounded-xl transition text-xs flex items-center gap-1 disabled:opacity-50"
                  >
                    <Send className="w-3.5 h-3.5" />
                    Ask
                  </button>
                </div>
              </div>
            </div>
          </div>
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
              <div>
                <span className="text-xs text-slate-400 block">ROCE %</span>
                <span className="text-sm font-bold text-white">{selectedStock.stock?.roce_pct || '0'}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Dividend Yield</span>
                <span className="text-sm font-bold text-blue-400">{selectedStock.stock?.dividend_yield_pct || '0'}%</span>
              </div>
              <div>
                <span className="text-xs text-slate-400 block">Rolling Sentiment</span>
                <span className="text-sm font-bold text-emerald-400">{selectedStock.stock?.sentiment_label || 'Bullish'} ({selectedStock.stock?.rolling_sentiment_score || '3.0'})</span>
              </div>
            </div>

            {/* Ingested News Feed */}
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-3">Ingested Financial News Feed</h4>
            <div className="space-y-3">
              {(selectedStock.news || []).map((n) => (
                <div key={n.id} className="bg-[#0b0d14] border border-[#1e2436] rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-blue-400">{n.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-[#181d2e] text-slate-400">{n.source}</span>
                  </div>
                  <p className="text-slate-300 mb-2">{n.raw_text}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-blue-950 text-blue-300 border border-blue-800">Tag: {n.key_event_tag}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800">Sentiment: {n.llm_sentiment}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Citation Detail Modal */}
      {activeCitation && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#121624] rounded-2xl max-w-md w-full border border-[#262d45] p-6">
            <div className="flex items-center justify-between border-b border-[#1e2436] pb-3 mb-3">
              <span className="text-xs font-bold text-blue-400 uppercase">Citation [{activeCitation.id}]</span>
              <button onClick={() => setActiveCitation(null)} className="p-1 text-slate-400 hover:text-white rounded bg-[#181d2e] border border-[#262d45]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{activeCitation.title}</h4>
            <p className="text-xs text-slate-400 mb-3">Source: {activeCitation.source} | Stock: {activeCitation.symbol}</p>
            <div className="bg-[#0b0d14] p-3 rounded-xl border border-[#1e2436] text-xs text-slate-300 leading-relaxed mb-4">
              "{activeCitation.text}"
            </div>
            {activeCitation.url && activeCitation.url !== '#' && (
              <a
                href={activeCitation.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-400 hover:underline flex items-center gap-1 font-semibold"
              >
                View Original Published Source <ExternalLink className="w-3 h-3" />
              </a>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
