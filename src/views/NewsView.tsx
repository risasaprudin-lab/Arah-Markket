import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  ExternalLink,
  Clock,
  RefreshCw,
  Sparkles,
  Calendar,
  Layers,
  Coins,
  TrendingUp,
  ArrowLeftRight,
  Filter,
  X,
} from 'lucide-react';
import type { NewsItem, NewsImpact, NewsCategoryFilter } from '../types.ts';

interface NewsViewProps {
  news: NewsItem[];
  onRefresh?: () => void;
  isRefreshing?: boolean;
}

// Client-side category resolver
export const resolveCategory = (item: NewsItem): 'Crypto' | 'Indices' | 'Forex' => {
  if (item.category) {
    const uc = item.category.toUpperCase();
    if (uc === 'CRYPTO' || uc.includes('CRYPTO') || uc.includes('BITCOIN')) return 'Crypto';
    if (uc === 'INDICES' || uc.includes('INDEX') || uc.includes('INDICES') || uc.includes('STOCK') || uc.includes('EQUITY')) return 'Indices';
    if (uc === 'FOREX' || uc.includes('FOREX') || uc.includes('FX') || uc.includes('CURRENCY')) return 'Forex';
  }

  const text = `${item.headline} ${item.summary} ${(item.affectedAssets || []).join(' ')}`.toLowerCase();

  if (
    item.affectedAssets?.some((a) => ['BTC', 'ETH', 'SOL', 'XRP', 'CRYPTO'].includes(a.toUpperCase())) ||
    /\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|cryptocurrency|blockchain|binance|coinbase|defi|altcoin|memecoin|xrp|ripple|tether|usdt|stablecoin|satoshi|token|nft|web3|kraken|bybit)\b/i.test(text)
  ) {
    return 'Crypto';
  }

  if (
    item.affectedAssets?.some((a) => ['US30', 'US100', 'US500', 'SPX', 'NASDAQ', 'DOW'].includes(a.toUpperCase())) ||
    /\b(wall street|dow jones|us30|nasdaq|us100|s&p|spx|us500|russell 2000|indices|index|stock market|equities|stocks|equity futures|share market|tech stocks|earnings report|shares|dax|ftse|nikkei|hang seng)\b/i.test(text)
  ) {
    return 'Indices';
  }

  return 'Forex';
};

export const NewsView: React.FC<NewsViewProps> = ({ news, onRefresh, isRefreshing = false }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [timeFilter, setTimeFilter] = useState<'TODAY' | '24H' | 'ALL'>('TODAY');
  const [categoryFilter, setCategoryFilter] = useState<NewsCategoryFilter>('ALL');
  const [sourceFilter, setSourceFilter] = useState<string>('ALL');
  const [impactFilter, setImpactFilter] = useState<string>('ALL');
  const [assetFilter, setAssetFilter] = useState<string>('ALL');

  // Real-time ticking WIB clock
  const [wibTime, setWibTime] = useState<string>('');
  const [wibDate, setWibDate] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setWibTime(
        now.toLocaleTimeString('en-GB', {
          timeZone: 'Asia/Jakarta',
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
          hour12: false,
        }) + ' WIB',
      );
      setWibDate(
        now.toLocaleDateString('id-ID', {
          timeZone: 'Asia/Jakarta',
          weekday: 'long',
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }),
      );
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  const sources = Array.from(new Set(news.map((n) => n.source)));
  const allAssets = Array.from(
    new Set(news.flatMap((n) => n.affectedAssets).filter(Boolean)),
  );

  // Categorize items
  const categorizedNews = useMemo(() => {
    return news.map((item) => ({
      ...item,
      resolvedCategory: resolveCategory(item),
    }));
  }, [news]);

  // Counts by category
  const cryptoTotal = categorizedNews.filter((n) => n.resolvedCategory === 'Crypto').length;
  const indicesTotal = categorizedNews.filter((n) => n.resolvedCategory === 'Indices').length;
  const forexTotal = categorizedNews.filter((n) => n.resolvedCategory === 'Forex').length;

  // Counts by time range
  const todayCount = categorizedNews.filter((n) => n.isToday).length;
  const last24hCount = categorizedNews.filter((n) => {
    const ageHours = (Date.now() - new Date(n.publishedAt).getTime()) / (1000 * 3600);
    return ageHours <= 24;
  }).length;

  // Dynamic quick-pick tickers / keywords tailored to active stream
  const suggestedTickers = useMemo(() => {
    switch (categoryFilter) {
      case 'CRYPTO':
        return ['BTC', 'ETH', 'SOL', 'XRP', 'Binance', 'ETF', 'Halving', 'DeFi'];
      case 'INDICES':
        return ['SPX', 'US30', 'US100', 'NVDA', 'Apple', 'Wall Street', 'Earnings', 'Tech'];
      case 'FOREX':
        return ['XAUUSD', 'EURUSD', 'USD', 'Fed', 'Powell', 'CPI', 'Inflation', 'Rate Cut'];
      default:
        return ['BTC', 'ETH', 'XAUUSD', 'EURUSD', 'NVDA', 'SPX', 'US30', 'Fed', 'CPI', 'Inflation'];
    }
  }, [categoryFilter]);

  // Toggle category helper
  const handleToggleCategory = (category: 'CRYPTO' | 'INDICES' | 'FOREX') => {
    setCategoryFilter((prev) => (prev === category ? 'ALL' : category));
  };

  // Filtered dataset
  const filteredNews = categorizedNews.filter((item) => {
    // 1. Category filter
    if (categoryFilter === 'CRYPTO' && item.resolvedCategory !== 'Crypto') return false;
    if (categoryFilter === 'INDICES' && item.resolvedCategory !== 'Indices') return false;
    if (categoryFilter === 'FOREX' && item.resolvedCategory !== 'Forex') return false;

    // 2. Time filter
    if (timeFilter === 'TODAY' && !item.isToday) return false;
    if (timeFilter === '24H') {
      const ageHours = (Date.now() - new Date(item.publishedAt).getTime()) / (1000 * 3600);
      if (ageHours > 24) return false;
    }

    // 3. Dropdown filters
    if (sourceFilter !== 'ALL' && item.source !== sourceFilter) return false;
    if (impactFilter !== 'ALL' && item.impact !== impactFilter) return false;
    if (assetFilter !== 'ALL' && !item.affectedAssets.includes(assetFilter)) return false;

    // 4. Search query (keyword or ticker)
    if (searchTerm.trim()) {
      const q = searchTerm.trim().toLowerCase();
      const matchHead = item.headline.toLowerCase().includes(q);
      const matchSum = item.summary.toLowerCase().includes(q);
      const matchAsset = item.affectedAssets.some(
        (a) => a.toLowerCase().includes(q) || q.includes(a.toLowerCase()),
      );
      const matchSource = item.source.toLowerCase().includes(q);
      const matchCategory = item.resolvedCategory.toLowerCase().includes(q);
      if (!matchHead && !matchSum && !matchAsset && !matchSource && !matchCategory) return false;
    }
    return true;
  });

  const getImpactBadge = (impact: NewsImpact) => {
    switch (impact) {
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryBadge = (cat: 'Crypto' | 'Indices' | 'Forex') => {
    switch (cat) {
      case 'Crypto':
        return (
          <span
            onClick={() => handleToggleCategory('CRYPTO')}
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-500/40 flex items-center gap-1 cursor-pointer hover:bg-amber-500/25 transition-colors"
            title="Klik untuk filter berita Crypto"
          >
            <Coins className="h-2.5 w-2.5 text-amber-400" />
            CRYPTO
          </span>
        );
      case 'Indices':
        return (
          <span
            onClick={() => handleToggleCategory('INDICES')}
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/40 flex items-center gap-1 cursor-pointer hover:bg-indigo-500/25 transition-colors"
            title="Klik untuk filter berita Indices"
          >
            <TrendingUp className="h-2.5 w-2.5 text-indigo-400" />
            INDICES
          </span>
        );
      case 'Forex':
        return (
          <span
            onClick={() => handleToggleCategory('FOREX')}
            className="text-[9px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/40 flex items-center gap-1 cursor-pointer hover:bg-emerald-500/25 transition-colors"
            title="Klik untuk filter berita Forex"
          >
            <ArrowLeftRight className="h-2.5 w-2.5 text-emerald-400" />
            FOREX
          </span>
        );
    }
  };

  return (
    <div id="view-news" className="space-y-4">
      {/* 1. Real-Time WIB Live Banner */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#0c121e] flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-start md:items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
            <Clock className="h-6 w-6 animate-pulse" />
          </div>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-mono font-semibold text-emerald-400 flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                LIVE WAKTU INDONESIA BARAT
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800/80 text-slate-300 border border-slate-700">
                UTC+07:00 (WIB)
              </span>
            </div>
            <div className="flex flex-wrap items-baseline gap-2 mt-1">
              <span className="text-xl md:text-2xl font-bold font-mono text-white tracking-wider">
                {wibTime || '16:00:00 WIB'}
              </span>
              <span className="text-xs text-slate-400 flex items-center gap-1">
                <Calendar className="h-3 w-3 text-slate-500" />
                {wibDate || 'Hari ini'}
              </span>
            </div>
          </div>
        </div>

        {/* Action buttons & Header Search */}
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
          {onRefresh && (
            <button
              onClick={onRefresh}
              disabled={isRefreshing}
              className="flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 border border-slate-800 hover:border-emerald-500/40 text-slate-200 hover:text-emerald-300 font-mono text-xs transition-all disabled:opacity-50 shrink-0"
              title="Perbarui berita sekarang"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
              <span>{isRefreshing ? 'Memuat...' : 'Refresh Berita'}</span>
            </button>
          )}

          {/* Quick Header Search input */}
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-2.5 h-3.5 w-3.5 text-slate-400" />
            <input
              type="text"
              placeholder="Cari kata kunci / ticker..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-8 pr-8 py-2 rounded-lg bg-slate-900 border border-slate-800 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/60 font-sans"
            />
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="absolute right-2.5 top-2.5 text-slate-400 hover:text-white"
                title="Hapus pencarian"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* 2. CATEGORY TOGGLE FILTER SYSTEM ('Crypto' | 'Indices' | 'Forex') */}
      <div className="p-3 rounded-xl border border-slate-800 bg-[#0e1422] space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-1 border-b border-slate-800/60">
          <div className="flex items-center gap-2">
            <Filter className="h-3.5 w-3.5 text-emerald-400" />
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-slate-200">
              Kategori Berita Pasar:
            </span>
            <span className="text-[11px] font-mono text-slate-400">
              Pilih kategori untuk beralih antara Crypto, Indices, dan Forex
            </span>
          </div>
          {categoryFilter !== 'ALL' && (
            <button
              onClick={() => setCategoryFilter('ALL')}
              className="text-[11px] font-mono text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 self-start sm:self-auto"
            >
              Reset ke Semua Kategori
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 font-mono text-xs">
          {/* ALL CATEGORIES */}
          <button
            id="filter-category-all"
            onClick={() => setCategoryFilter('ALL')}
            className={`px-3 py-2.5 rounded-lg font-semibold flex items-center justify-between gap-2 transition-all border ${
              categoryFilter === 'ALL'
                ? 'bg-slate-800 text-white border-slate-600 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border-slate-800/80 hover:border-slate-700'
            }`}
          >
            <div className="flex items-center gap-2">
              <Layers className="h-3.5 w-3.5" />
              <span>Semua</span>
            </div>
            <span className="px-1.5 py-0.5 rounded-full text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
              {news.length}
            </span>
          </button>

          {/* CRYPTO CATEGORY */}
          <button
            id="filter-category-crypto"
            onClick={() => handleToggleCategory('CRYPTO')}
            className={`px-3 py-2.5 rounded-lg font-semibold flex items-center justify-between gap-2 transition-all border ${
              categoryFilter === 'CRYPTO'
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/60 shadow-sm shadow-amber-500/10 ring-1 ring-amber-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-amber-300 border-slate-800/80 hover:border-amber-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <Coins className={`h-3.5 w-3.5 ${categoryFilter === 'CRYPTO' ? 'text-amber-400' : 'text-amber-500/70'}`} />
              <span>Crypto</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                categoryFilter === 'CRYPTO'
                  ? 'bg-amber-950 text-amber-300 border border-amber-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {cryptoTotal}
            </span>
          </button>

          {/* INDICES CATEGORY */}
          <button
            id="filter-category-indices"
            onClick={() => handleToggleCategory('INDICES')}
            className={`px-3 py-2.5 rounded-lg font-semibold flex items-center justify-between gap-2 transition-all border ${
              categoryFilter === 'INDICES'
                ? 'bg-indigo-500/20 text-indigo-300 border-indigo-500/60 shadow-sm shadow-indigo-500/10 ring-1 ring-indigo-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-indigo-300 border-slate-800/80 hover:border-indigo-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <TrendingUp className={`h-3.5 w-3.5 ${categoryFilter === 'INDICES' ? 'text-indigo-400' : 'text-indigo-500/70'}`} />
              <span>Indices</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                categoryFilter === 'INDICES'
                  ? 'bg-indigo-950 text-indigo-300 border border-indigo-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {indicesTotal}
            </span>
          </button>

          {/* FOREX CATEGORY */}
          <button
            id="filter-category-forex"
            onClick={() => handleToggleCategory('FOREX')}
            className={`px-3 py-2.5 rounded-lg font-semibold flex items-center justify-between gap-2 transition-all border ${
              categoryFilter === 'FOREX'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/60 shadow-sm shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-emerald-300 border-slate-800/80 hover:border-emerald-500/40'
            }`}
          >
            <div className="flex items-center gap-2">
              <ArrowLeftRight className={`h-3.5 w-3.5 ${categoryFilter === 'FOREX' ? 'text-emerald-400' : 'text-emerald-500/70'}`} />
              <span>Forex</span>
            </div>
            <span
              className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${
                categoryFilter === 'FOREX'
                  ? 'bg-emerald-950 text-emerald-300 border border-emerald-800'
                  : 'bg-slate-800 text-slate-400 border border-slate-700'
              }`}
            >
              {forexTotal}
            </span>
          </button>
        </div>

        {/* Active Stream Context Indicator */}
        <div className="text-[11px] font-mono px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800/80 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 truncate">
            <span className="text-slate-400 shrink-0">Aliran Aktif:</span>
            {categoryFilter === 'ALL' && (
              <span className="text-slate-200 font-semibold flex items-center gap-1.5 truncate">
                <Layers className="h-3 w-3 text-slate-400 shrink-0" />
                Semua Pasar (Crypto, Indeks Saham, Forex & Makro)
              </span>
            )}
            {categoryFilter === 'CRYPTO' && (
              <span className="text-amber-300 font-semibold flex items-center gap-1.5 truncate">
                <Coins className="h-3 w-3 text-amber-400 shrink-0" />
                Aliran Crypto (Bitcoin, Ethereum, Altcoins, ETF & Regulasi Blockchain)
              </span>
            )}
            {categoryFilter === 'INDICES' && (
              <span className="text-indigo-300 font-semibold flex items-center gap-1.5 truncate">
                <TrendingUp className="h-3 w-3 text-indigo-400 shrink-0" />
                Aliran Indeks (Wall Street, S&P 500, Nasdaq, Dow Jones & Saham Global)
              </span>
            )}
            {categoryFilter === 'FOREX' && (
              <span className="text-emerald-300 font-semibold flex items-center gap-1.5 truncate">
                <ArrowLeftRight className="h-3 w-3 text-emerald-400 shrink-0" />
                Aliran Forex (Federal Reserve, Bank Sentral, USD & Pasangan Mata Uang)
              </span>
            )}
          </div>
          <span className="text-slate-400 font-semibold hidden md:inline text-[10px] shrink-0">
            {filteredNews.length} berita
          </span>
        </div>
      </div>

      {/* 3. Dedicated Keyword & Ticker Search Box */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1322] space-y-2.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <label htmlFor="input-news-search" className="text-xs font-mono font-bold text-slate-300 flex items-center gap-1.5 uppercase tracking-wider">
            <Search className="h-3.5 w-3.5 text-emerald-400" />
            <span>Pencarian Kata Kunci & Ticker Cepat</span>
          </label>
          {searchTerm && (
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/60 border border-emerald-500/30 px-2 py-0.5 rounded">
                {filteredNews.length} berita ditemukan
              </span>
              <button
                onClick={() => setSearchTerm('')}
                className="text-[11px] font-mono text-slate-400 hover:text-white flex items-center gap-1 transition-colors"
              >
                <X className="h-3 w-3" />
                <span>Bersihkan</span>
              </button>
            </div>
          )}
        </div>

        <div className="relative">
          <Search className="absolute left-3.5 top-3 h-4 w-4 text-slate-400 pointer-events-none" />
          <input
            id="input-news-search"
            type="text"
            placeholder="Ketik ticker (cth: BTC, ETH, XAUUSD, NVDA, SPX) atau kata kunci (cth: Inflation, Fed, ETF, Tarif)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-10 py-2.5 rounded-lg bg-slate-900 border border-slate-700/80 hover:border-slate-600 focus:border-emerald-500 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-1 focus:ring-emerald-500/50 font-sans transition-all"
          />
          {searchTerm && (
            <button
              onClick={() => setSearchTerm('')}
              className="absolute right-3 top-2.5 p-1 rounded-md text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Hapus kata kunci pencarian"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Quick Ticker & Keyword Suggestion Chips */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mr-1">
            Ticker & Kata Kunci Populer:
          </span>
          {suggestedTickers.map((ticker) => {
            const isActive = searchTerm.toLowerCase() === ticker.toLowerCase();
            return (
              <button
                key={ticker}
                onClick={() => setSearchTerm(isActive ? '' : ticker)}
                className={`text-[10px] font-mono px-2.5 py-1 rounded-md transition-all flex items-center gap-1 border ${
                  isActive
                    ? 'bg-emerald-500/25 text-emerald-300 border-emerald-500/60 font-bold shadow-sm'
                    : 'bg-slate-900/90 text-slate-400 hover:text-slate-200 border-slate-800 hover:border-slate-700'
                }`}
              >
                <span>{ticker}</span>
                {isActive && <X className="h-2.5 w-2.5 text-emerald-400" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Time Filter & Secondary Dropdown Filters */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-2.5 rounded-xl border border-slate-800/80 bg-[#0e1422]">
        {/* Time range buttons */}
        <div className="flex flex-wrap items-center gap-1.5 font-mono text-xs">
          <button
            onClick={() => setTimeFilter('TODAY')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              timeFilter === 'TODAY'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Sparkles className="h-3 w-3" />
            <span>Hari Ini (WIB)</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800">
              {todayCount}
            </span>
          </button>

          <button
            onClick={() => setTimeFilter('24H')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              timeFilter === '24H'
                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/50 shadow-sm'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Clock className="h-3 w-3" />
            <span>24 Jam Terakhir</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-blue-950 text-blue-300 border border-blue-800">
              {last24hCount}
            </span>
          </button>

          <button
            onClick={() => setTimeFilter('ALL')}
            className={`px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all ${
              timeFilter === 'ALL'
                ? 'bg-slate-800 text-white border border-slate-600'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 border border-slate-800'
            }`}
          >
            <Layers className="h-3 w-3" />
            <span>Semua Waktu</span>
            <span className="px-1.5 py-0.2 rounded-full text-[10px] bg-slate-800 text-slate-400">
              {news.length}
            </span>
          </button>
        </div>

        {/* Secondary Dropdown Filters */}
        <div className="flex flex-wrap items-center gap-2 font-mono text-xs">
          {/* Source selector */}
          <select
            value={sourceFilter}
            onChange={(e) => setSourceFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none text-xs"
          >
            <option value="ALL">Semua Sumber ({sources.length})</option>
            {sources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>

          {/* Impact selector */}
          <select
            value={impactFilter}
            onChange={(e) => setImpactFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none text-xs"
          >
            <option value="ALL">Semua Impact</option>
            <option value="HIGH">High Impact</option>
            <option value="MEDIUM">Medium Impact</option>
            <option value="LOW">Low Impact</option>
          </select>

          {/* Asset selector */}
          <select
            value={assetFilter}
            onChange={(e) => setAssetFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg bg-slate-900 border border-slate-800 text-slate-300 focus:outline-none text-xs"
          >
            <option value="ALL">Semua Aset</option>
            {allAssets.map((a) => (
              <option key={a} value={a}>
                {a}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* 5. Active Filter Summary Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-xs font-mono text-slate-400">
        <div className="flex flex-wrap items-center gap-2">
          <span>Menampilkan:</span>
          <span className="font-semibold text-white">
            {filteredNews.length} berita
          </span>
          {searchTerm && (
            <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 text-[11px] flex items-center gap-1">
              <Search className="h-3 w-3" />
              Kata Kunci: &quot;{searchTerm}&quot;
            </span>
          )}
          {categoryFilter !== 'ALL' && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-emerald-300 border border-slate-700 text-[11px]">
              Kategori: {categoryFilter}
            </span>
          )}
          {timeFilter !== 'ALL' && (
            <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 text-[11px]">
              Waktu: {timeFilter === 'TODAY' ? 'Hari Ini (WIB)' : '24 Jam'}
            </span>
          )}
        </div>

        {(categoryFilter !== 'ALL' || timeFilter !== 'TODAY' || sourceFilter !== 'ALL' || impactFilter !== 'ALL' || assetFilter !== 'ALL' || searchTerm) && (
          <button
            onClick={() => {
              setCategoryFilter('ALL');
              setTimeFilter('TODAY');
              setSourceFilter('ALL');
              setImpactFilter('ALL');
              setAssetFilter('ALL');
              setSearchTerm('');
            }}
            className="text-[11px] text-slate-400 hover:text-white hover:underline"
          >
            Bersihkan Semua Filter
          </button>
        )}
      </div>

      {/* 6. News Items Feed */}
      <div className="space-y-2.5">
        {filteredNews.length > 0 ? (
          filteredNews.map((item) => (
            <div
              key={item.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col md:flex-row md:items-start justify-between gap-3 group ${
                item.isToday
                  ? 'border-slate-800 bg-[#0d1320] hover:border-slate-700'
                  : 'border-slate-800/70 bg-[#090d16] hover:border-slate-700'
              }`}
            >
              <div className="space-y-1.5 flex-1">
                {/* Meta row: Source, Category, Today badge, Time, Impact */}
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {item.source}
                  </span>

                  {/* Category Badge */}
                  {getCategoryBadge(item.resolvedCategory)}

                  {item.isToday && (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 flex items-center gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
                      HARI INI
                    </span>
                  )}

                  <span className="text-[10px] font-mono text-emerald-400/90 font-semibold flex items-center gap-1">
                    <Clock className="h-3 w-3 text-slate-400" />
                    {item.time}
                  </span>

                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase ${getImpactBadge(
                      item.impact,
                    )}`}
                  >
                    {item.impact} IMPACT
                  </span>
                </div>

                <h3 className="text-xs md:text-sm font-bold text-white group-hover:text-emerald-300 transition-colors leading-snug">
                  {item.headline}
                </h3>

                <p className="text-xs text-slate-300 leading-relaxed max-w-4xl">
                  {item.summary}
                </p>

                {/* Affected Assets tags */}
                <div className="flex flex-wrap items-center gap-1 pt-1">
                  <span className="text-[10px] text-slate-500 font-mono">Aset Terkait:</span>
                  {item.affectedAssets.length > 0 ? (
                    item.affectedAssets.map((asset) => (
                      <button
                        key={asset}
                        onClick={() => setSearchTerm(asset)}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-emerald-400 font-semibold hover:border-emerald-500/50 hover:bg-emerald-500/10 transition-colors"
                        title={`Cari berita untuk ticker ${asset}`}
                      >
                        {asset}
                      </button>
                    ))
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500">Macro / General</span>
                  )}
                </div>
              </div>

              {item.sourceUrl && (
                <a
                  href={item.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 self-start md:self-center flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900 text-slate-300 hover:text-white text-xs font-mono transition-colors"
                >
                  <span>Buka Sumber</span>
                  <ExternalLink className="h-3 w-3" />
                </a>
              )}
            </div>
          ))
        ) : (
          <div className="p-8 text-center rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
            <p className="text-sm font-mono text-slate-300 font-semibold">
              {searchTerm
                ? `Tidak ada berita yang cocok dengan kata kunci atau ticker "${searchTerm}".`
                : 'Tidak ada berita yang cocok dengan filter saat ini.'}
            </p>
            <p className="text-xs font-mono text-slate-400">
              Filter Aktif: {categoryFilter !== 'ALL' ? `Kategori ${categoryFilter}` : 'Semua Kategori'} • {timeFilter === 'TODAY' ? 'Hari Ini (WIB)' : timeFilter}
              {searchTerm ? ` • Pencarian: "${searchTerm}"` : ''}
            </p>
            <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
              {searchTerm && (
                <button
                  onClick={() => setSearchTerm('')}
                  className="px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/50 text-xs text-emerald-300 font-mono transition-colors flex items-center gap-1.5"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Hapus Pencarian (&quot;{searchTerm}&quot;)</span>
                </button>
              )}
              {timeFilter === 'TODAY' && (
                <button
                  onClick={() => setTimeFilter('ALL')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-white font-mono transition-colors"
                >
                  Buka Rentang ke &quot;Semua Waktu&quot;
                </button>
              )}
              {categoryFilter !== 'ALL' && (
                <button
                  onClick={() => setCategoryFilter('ALL')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs text-slate-200 font-mono transition-colors"
                >
                  Tampilkan Semua Kategori ({news.length})
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
