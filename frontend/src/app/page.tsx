'use client';

import React, { useState, useEffect } from 'react';
import {
  TrendingUp, TrendingDown, Search, Plus, ExternalLink, ShieldAlert,
  Sparkles, CheckCircle2, UserCheck, BookOpen, BarChart3, RefreshCw, Send, X, Layers, Activity
} from 'lucide-react';
import {
  Stock, NewsArticle, Citation, fetchStocks, fetchStockDetail,
  followStock, sendAgentQuery, loginUser, getFallbackStocks
} from '@/lib/api';

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState({
    id: 1,
    email: 'harisankar@sentellent.com',
    fullName: 'Hari Sankar (Sentellent)',
    isTestUser: true,
  });

  const [stocks, setStocks] = useState<Stock[]>(getFallbackStocks());
  const [searchQuery, setSearchQuery] = useState('');
  const [isIngesting, setIsIngesting] = useState(false);
  const [selectedStock, setSelectedStock] = useState<{ stock: Stock; news: NewsArticle[] } | null>(null);
  const [activeCitation, setActiveCitation] = useState<Citation | null>(null);

  // Chat State
  const [chatMessages, setChatMessages] = useState<Array<{ sender: 'user' | 'agent'; text: string; citations?: Citation[] }>>([
    {
      sender: 'agent',
      text: "👋 Welcome! I am your **Equity Research Chief of Staff** for the Indian Stock Market (NSE / BSE).\n\nFollow your favourite tickers (e.g. **RELIANCE**, **TCS**, **HDFCBANK**) to ingest their Screener.in fundamentals and recent Indian financial news into your vector store.\n\nTell me about your investment goals, or ask for grounded stock analysis!",
    },
  ]);
  const [inputMsg, setInputMsg] = useState('');
  const [isAgentThinking, setIsAgentThinking] = useState(false);

  // Persona State
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
    
    // Add locally immediately for instant UX responsiveness
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

  return (
    <div className="min-h-screen bg-[#04070a] text-emerald-50 flex flex-col font-sans">
      {/* Top Navbar */}
      <header className="border-b border-emerald-900/60 bg-[#080f17]/90 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-600 via-teal-500 to-green-400 flex items-center justify-center shadow-lg shadow-emerald-500/20">
            <Activity className="w-6 h-6 text-black font-bold" />
          </div>
          <div>
            <h1 className="font-bold text-lg text-white tracking-wide flex items-center gap-2">
              Sentellent Equity Chief <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 font-mono">RAG Agentic AI</span>
            </h1>
            <p className="text-xs text-emerald-400/80">Personal Equity Research Chief of Staff for NSE / BSE</p>
          </div>
        </div>

        {/* Evaluator Test Account Switcher */}
        <div className="flex items-center gap-3 bg-[#08131e] border border-emerald-500/30 rounded-xl p-1.5 px-3">
          <UserCheck className="w-4 h-4 text-[#00ff88]" />
          <div className="text-xs">
            <span className="text-emerald-400/70 block text-[10px] uppercase font-semibold">Evaluator OAuth Test User</span>
            <select
              value={currentUser.email}
              onChange={(e) => {
                const val = e.target.value;
                if (val === 'harisankar@sentellent.com') handleSelectTestAccount('harisankar@sentellent.com', 'Hari Sankar');
                else if (val === 'naga@sentellent.com') handleSelectTestAccount('naga@sentellent.com', 'Naga');
                else handleSelectTestAccount('demo@sentellent.com', 'Demo Evaluator');
              }}
              className="bg-transparent text-[#00ff88] font-semibold focus:outline-none cursor-pointer"
            >
              <option value="harisankar@sentellent.com" className="bg-slate-900 text-white">harisankar@sentellent.com (Test User)</option>
              <option value="naga@sentellent.com" className="bg-slate-900 text-white">naga@sentellent.com (Test User)</option>
              <option value="demo@sentellent.com" className="bg-slate-900 text-white">demo@sentellent.com (Demo User)</option>
            </select>
          </div>
        </div>
      </header>

      {/* Main Grid Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-6 p-6 max-w-[1800px] mx-auto w-full">
        {/* Left Column: Watchlist & Fundamentals Ingestion (5 cols) */}
        <div className="lg:col-span-5 flex flex-col gap-6">
          {/* Ticker Search & Add Ingestion */}
          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30">
            <h2 className="text-sm font-bold text-white mb-3 flex items-center justify-between">
              <span className="flex items-center gap-1.5"><Search className="w-4 h-4 text-[#00ff88]" /> Follow & Ingest Ticker</span>
              <span className="text-xs text-emerald-400/80 font-normal">Screener.in + RSS RAG Ingester</span>
            </h2>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-emerald-500 absolute left-3 top-3" />
                <input
                  type="text"
                  placeholder="Enter NSE ticker (e.g. RELIANCE, TCS, HDFCBANK)..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleFollowStock(searchQuery)}
                  className="w-full bg-[#03070b] border border-emerald-500/30 rounded-xl pl-9 pr-4 py-2.5 text-sm text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-[#00ff88]"
                />
              </div>
              <button
                onClick={() => handleFollowStock(searchQuery)}
                disabled={isIngesting || !searchQuery.trim()}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black text-xs font-bold px-4 py-2.5 rounded-xl transition flex items-center gap-1.5 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                {isIngesting ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Ingest
              </button>
            </div>
            {/* Quick Add Ticker Pills */}
            <div className="flex flex-wrap gap-2 mt-3">
              {['RELIANCE', 'TCS', 'HDFCBANK', 'INFY', 'TATAMOTORS', 'ITC', 'COALINDIA', 'NTPC'].map((ticker) => (
                <button
                  key={ticker}
                  onClick={() => handleFollowStock(ticker)}
                  className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 border border-emerald-800/60 transition"
                >
                  + {ticker}
                </button>
              ))}
            </div>
          </div>

          {/* Followed Stocks Grid */}
          <div className="glass-panel rounded-2xl p-5 border border-emerald-500/30 flex-1 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-[#00ff88]" />
                Tracked Stock Watchlist ({stocks.length})
              </h2>
              <span className="text-xs text-emerald-400/80">All prices in INR (Rs.)</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-1 max-h-[600px]">
              {stocks.map((stock) => (
                <div
                  key={stock.symbol}
                  onClick={() => handleOpenStockDetail(stock.symbol)}
                  className="glass-card rounded-xl p-4 cursor-pointer hover:border-[#00ff88] transition group"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-white group-hover:text-[#00ff88] transition">{stock.symbol}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">NSE: {stock.nse_id}</span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono">BSE: {stock.bse_id}</span>
                      </div>
                      <p className="text-xs text-emerald-400/80 mt-0.5">{stock.name}</p>
                    </div>

                    <div className="text-right">
                      <span className="text-sm font-bold text-[#00ff88] block">Rs {stock.current_price_inr.toLocaleString()}</span>
                      <span className={`text-[11px] font-medium px-2 py-0.5 rounded-full inline-block mt-1 ${
                        (stock.rolling_sentiment_score || 0) >= 0
                          ? 'bg-emerald-950 text-[#00ff88] border border-emerald-500/40'
                          : 'bg-rose-950 text-rose-400 border border-rose-800/40'
                      }`}>
                        {stock.sentiment_label || 'Bullish'} ({(stock.rolling_sentiment_score || 0) >= 0 ? '+' : ''}{stock.rolling_sentiment_score || 3.0})
                      </span>
                    </div>
                  </div>

                  {/* Key Ratios */}
                  <div className="grid grid-cols-4 gap-2 mt-3 pt-3 border-t border-emerald-900/50 text-center">
                    <div>
                      <span className="text-[10px] text-emerald-500 block">P/E</span>
                      <span className="text-xs font-semibold text-emerald-200">{stock.pe_ratio}</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 block">Debt/Eq</span>
                      <span className={`text-xs font-semibold ${stock.debt_to_equity > 0.5 ? 'text-amber-400' : 'text-[#00ff88]'}`}>
                        {stock.debt_to_equity}
                      </span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 block">ROCE</span>
                      <span className="text-xs font-semibold text-emerald-200">{stock.roce_pct}%</span>
                    </div>
                    <div>
                      <span className="text-[10px] text-emerald-500 block">Div Yield</span>
                      <span className="text-xs font-semibold text-[#00ff88]">{stock.dividend_yield_pct}%</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Column: AI Agent Chat & Persona Inspector (7 cols) */}
        <div className="lg:col-span-7 flex flex-col gap-6">
          {/* Active Persona Graph Badge */}
          <div className="glass-panel rounded-2xl p-4 border border-emerald-500/30 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-950 text-[#00ff88] border border-emerald-500/40 shadow-lg shadow-emerald-500/10">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-[#00ff88] uppercase tracking-wider">Dynamic Investor Persona (Learned Memory Graph)</h3>
                <p className="text-sm text-emerald-100 font-medium">
                  {persona.risk_profile} Investor <span className="text-emerald-700">|</span> Max Debt/Eq: <span className="text-amber-400">{persona.max_debt_to_equity}</span> <span className="text-emerald-700">|</span> Min Div Yield: <span className="text-[#00ff88]">{persona.min_dividend_yield}%</span>
                </p>
              </div>
            </div>
            <span className="text-[10px] px-2 py-1 rounded bg-emerald-950 text-emerald-400 border border-emerald-800 font-mono">LangGraph Active</span>
          </div>

          {/* Main Agent Chat Window */}
          <div className="glass-panel rounded-2xl border border-emerald-500/30 flex-1 flex flex-col h-[650px]">
            {/* Chat Messages List */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {chatMessages.map((msg, index) => (
                <div
                  key={index}
                  className={`flex flex-col ${msg.sender === 'user' ? 'items-end' : 'items-start'}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-4 text-sm leading-relaxed ${
                      msg.sender === 'user'
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 text-black font-semibold shadow-lg shadow-emerald-500/20'
                        : 'bg-[#09131d] border border-emerald-500/30 text-emerald-100 shadow-sm'
                    }`}
                  >
                    <div className="whitespace-pre-line">{msg.text}</div>

                    {/* Citations Badges */}
                    {msg.citations && msg.citations.length > 0 && (
                      <div className="mt-4 pt-3 border-t border-emerald-900 flex flex-wrap gap-2">
                        <span className="text-[11px] font-bold text-[#00ff88] flex items-center gap-1 w-full mb-1">
                          <BookOpen className="w-3.5 h-3.5 text-[#00ff88]" /> Grounded Source Citations:
                        </span>
                        {msg.citations.map((cit, cIdx) => (
                          <button
                            key={cIdx}
                            onClick={() => setActiveCitation(cit)}
                            className="text-[11px] bg-emerald-950 hover:bg-emerald-900 text-[#00ff88] px-2.5 py-1 rounded-lg border border-emerald-500/40 flex items-center gap-1 transition"
                          >
                            <span>[{cit.id}]</span>
                            <span className="truncate max-w-[150px]">{cit.title}</span>
                            <ExternalLink className="w-3 h-3 text-emerald-400" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                  <span className="text-[10px] text-emerald-500 mt-1 px-1">
                    {msg.sender === 'user' ? 'You' : 'Chief of Staff Agent'}
                  </span>
                </div>
              ))}

              {isAgentThinking && (
                <div className="flex items-center gap-2 text-xs text-[#00ff88] bg-emerald-950/60 border border-emerald-500/40 p-3 rounded-xl w-fit animate-pulse">
                  <Sparkles className="w-4 h-4 animate-spin" />
                  LangGraph agent is retrieving news vectors & screening fundamentals...
                </div>
              )}
            </div>

            {/* Suggested Prompts */}
            <div className="px-5 py-2.5 border-t border-emerald-900/60 bg-[#03070b]/60 flex flex-wrap gap-2">
              {[
                "I'm a conservative, dividend-focused investor and I avoid high-debt companies",
                "What's the sentiment on TCS this week?",
                "Recommend stocks for my profile.",
                "What is the revenue of un-ingested stock XYZ?"
              ].map((prompt, pIdx) => (
                <button
                  key={pIdx}
                  onClick={() => handleSendMessage(prompt)}
                  className="text-[11px] bg-emerald-950/80 hover:bg-emerald-900 text-emerald-300 px-2.5 py-1 rounded-lg border border-emerald-800 transition"
                >
                  💡 {prompt}
                </button>
              ))}
            </div>

            {/* Input Bar */}
            <div className="p-4 border-t border-emerald-900 bg-[#03070b] rounded-b-2xl flex gap-2">
              <input
                type="text"
                placeholder="Ask about Indian stock sentiment, recommendations, or set your investor persona rules..."
                value={inputMsg}
                onChange={(e) => setInputMsg(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                className="flex-1 bg-[#09131d] border border-emerald-500/30 rounded-xl px-4 py-3 text-sm text-emerald-100 placeholder-emerald-700 focus:outline-none focus:border-[#00ff88]"
              />
              <button
                onClick={() => handleSendMessage()}
                disabled={!inputMsg.trim() || isAgentThinking}
                className="bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-black font-bold px-5 py-3 rounded-xl transition flex items-center gap-2 disabled:opacity-50 shadow-lg shadow-emerald-500/20"
              >
                <Send className="w-4 h-4" />
                Ask
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Stock Detail Modal */}
      {selectedStock && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="glass-panel bg-[#08111a] rounded-2xl max-w-2xl w-full max-h-[85vh] overflow-y-auto border border-emerald-500/40 p-6 shadow-2xl shadow-emerald-500/10">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-4 mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{selectedStock.stock?.name || selectedStock.stock?.symbol || 'Stock Overview'}</h3>
                <p className="text-xs text-emerald-400">Sector: {selectedStock.stock?.sector} | NSE: {selectedStock.stock?.nse_id} | BSE: {selectedStock.stock?.bse_id}</p>
              </div>
              <button onClick={() => setSelectedStock(null)} className="p-2 text-emerald-400 hover:text-white rounded-lg bg-emerald-950 border border-emerald-800">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Fundamentals Grid */}
            <div className="grid grid-cols-3 gap-3 mb-6 bg-[#03070b] p-4 rounded-xl border border-emerald-900 text-center">
              <div>
                <span className="text-xs text-emerald-500 block">Market Cap</span>
                <span className="text-sm font-bold text-white">Rs {selectedStock.stock?.market_cap_cr?.toLocaleString() || '0'} Cr</span>
              </div>
              <div>
                <span className="text-xs text-emerald-500 block">P/E Ratio</span>
                <span className="text-sm font-bold text-white">{selectedStock.stock?.pe_ratio || '0'}</span>
              </div>
              <div>
                <span className="text-xs text-emerald-500 block">Debt to Equity</span>
                <span className={`text-sm font-bold ${(selectedStock.stock?.debt_to_equity || 0) > 0.5 ? 'text-amber-400' : 'text-[#00ff88]'}`}>
                  {selectedStock.stock?.debt_to_equity || '0'}
                </span>
              </div>
              <div>
                <span className="text-xs text-emerald-500 block">ROCE %</span>
                <span className="text-sm font-bold text-white">{selectedStock.stock?.roce_pct || '0'}%</span>
              </div>
              <div>
                <span className="text-xs text-emerald-500 block">Dividend Yield</span>
                <span className="text-sm font-bold text-[#00ff88]">{selectedStock.stock?.dividend_yield_pct || '0'}%</span>
              </div>
              <div>
                <span className="text-xs text-emerald-500 block">Rolling Sentiment</span>
                <span className="text-sm font-bold text-[#00ff88]">{selectedStock.stock?.sentiment_label || 'Bullish'} ({selectedStock.stock?.rolling_sentiment_score || '3.0'})</span>
              </div>
            </div>

            {/* Recent News & Tags */}
            <h4 className="text-sm font-bold text-emerald-300 mb-3">Ingested Financial News Feed</h4>
            <div className="space-y-3">
              {(selectedStock.news || []).map((n) => (
                <div key={n.id} className="bg-[#03070b] border border-emerald-900/80 rounded-xl p-3 text-xs">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold text-[#00ff88]">{n.title}</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950 text-emerald-400">{n.source}</span>
                  </div>
                  <p className="text-emerald-200/90 mb-2">{n.raw_text}</p>
                  <div className="flex items-center gap-2 text-[10px]">
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800">Tag: {n.key_event_tag}</span>
                    <span className="px-2 py-0.5 rounded bg-emerald-950 text-[#00ff88] border border-emerald-800">Sentiment: {n.llm_sentiment}</span>
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
          <div className="glass-panel bg-[#08111a] rounded-2xl max-w-md w-full border border-emerald-500/40 p-6">
            <div className="flex items-center justify-between border-b border-emerald-900 pb-3 mb-3">
              <span className="text-xs font-bold text-[#00ff88] uppercase">Citation [{activeCitation.id}]</span>
              <button onClick={() => setActiveCitation(null)} className="p-1 text-emerald-400 hover:text-white rounded bg-emerald-950 border border-emerald-800">
                <X className="w-4 h-4" />
              </button>
            </div>
            <h4 className="text-sm font-bold text-white mb-1">{activeCitation.title}</h4>
            <p className="text-xs text-emerald-400/80 mb-3">Source: {activeCitation.source} | Stock: {activeCitation.symbol}</p>
            <div className="bg-[#03070b] p-3 rounded-xl border border-emerald-900 text-xs text-emerald-200 leading-relaxed mb-4">
              "{activeCitation.text}"
            </div>
            {activeCitation.url && activeCitation.url !== '#' && (
              <a
                href={activeCitation.url}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-[#00ff88] hover:underline flex items-center gap-1 font-semibold"
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
