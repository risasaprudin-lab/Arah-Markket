import React, { useEffect, useState, useCallback } from 'react';
import { Sidebar, TabType } from './components/Sidebar.tsx';
import { Header } from './components/Header.tsx';
import { MarketOutlookToday } from './components/MarketOutlookToday.tsx';
import { CurrencyStrengthSection } from './components/CurrencyStrengthSection.tsx';
import { TopNewsCard } from './components/TopNewsCard.tsx';
import { MarketBiasGrid } from './components/MarketBiasGrid.tsx';
import { AiConclusionCard } from './components/AiConclusionCard.tsx';
import { NewsView } from './views/NewsView.tsx';
import { MarketOutlookView } from './views/MarketOutlookView.tsx';
import { AssetDetailView } from './views/AssetDetailView.tsx';
import { CurrencyStrengthView } from './views/CurrencyStrengthView.tsx';
import { SettingsView } from './views/SettingsView.tsx';
import type {
  AiMarketIntelligenceResult,
  CurrencyStrengthData,
  ForexFactoryEvent,
  NewsItem,
  TradingViewQuote,
} from './types.ts';
import { AlertCircle, RefreshCw, Zap } from 'lucide-react';

export default function App() {
  const [currentTab, setCurrentTab] = useState<TabType>('Dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [autoRefreshInterval, setAutoRefreshInterval] = useState(30);

  // Core data states
  const [selectedTf, setSelectedTf] = useState<string>('D1');
  const [csmData, setCsmData] = useState<CurrencyStrengthData | null>(null);
  const [quotes, setQuotes] = useState<Record<string, TradingViewQuote>>({});
  const [news, setNews] = useState<NewsItem[]>([]);
  const [calendar, setCalendar] = useState<ForexFactoryEvent[]>([]);
  const [aiIntelligence, setAiIntelligence] = useState<AiMarketIntelligenceResult | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all initial data from our backend endpoints
  const fetchAllData = useCallback(async (forceAiRefresh = false, tfOverride?: string) => {
    setIsRefreshing(true);
    const activeTf = tfOverride || selectedTf;
    try {
      // 1. Fetch Market Data (CSM & Quotes)
      const marketRes = await fetch(`/api/market-data?tf=${activeTf}`);
      if (marketRes.ok) {
        const mData = await marketRes.json();
        if (mData.success) {
          setCsmData(mData.csm);
          setQuotes(mData.quotes || {});
        }
      }

      // 2. Fetch News
      const newsRes = await fetch('/api/news');
      if (newsRes.ok) {
        const nData = await newsRes.json();
        if (nData.success && Array.isArray(nData.news)) {
          setNews(nData.news);
        }
      }

      // 3. Fetch Calendar
      const calRes = await fetch('/api/calendar');
      if (calRes.ok) {
        const cData = await calRes.json();
        if (cData.success && Array.isArray(cData.calendar)) {
          setCalendar(cData.calendar);
        }
      }

      // 4. Fetch AI Market Intelligence
      const aiUrl = forceAiRefresh ? '/api/ai-intelligence?refresh=true' : '/api/ai-intelligence';
      const aiRes = await fetch(aiUrl);
      if (aiRes.ok) {
        const aData = await aiRes.json();
        if (aData.success && aData.data) {
          setAiIntelligence(aData.data);
        }
      }

      setLastUpdated(new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
      setErrorMessage(null);
    } catch (err: any) {
      console.error('Data fetching error:', err);
      setErrorMessage('Terjadi kendala koneksi saat mengambil data pasar real-time.');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedTf]);

  // Handler for changing CSM timeframe
  const handleTimeframeChange = async (newTf: string) => {
    setSelectedTf(newTf);
    try {
      const res = await fetch(`/api/market-data?tf=${newTf}`);
      if (res.ok) {
        const mData = await res.json();
        if (mData.success && mData.csm) {
          setCsmData(mData.csm);
        }
      }
    } catch (err) {
      console.error('Error changing timeframe:', err);
    }
  };

  // Initial load
  useEffect(() => {
    fetchAllData(false);
  }, [fetchAllData]);

  // Auto-refresh timer
  useEffect(() => {
    if (autoRefreshInterval <= 0) return;
    const interval = setInterval(() => {
      fetchAllData(false);
    }, autoRefreshInterval * 1000);
    return () => clearInterval(interval);
  }, [autoRefreshInterval, fetchAllData]);

  // Handler to navigate from asset click on dashboard
  const handleSelectAsset = (assetKey: string) => {
    if (assetKey === 'XAUUSD') setCurrentTab('XAUUSD');
    else if (assetKey === 'BTC') setCurrentTab('Bitcoin');
    else if (['US100', 'US500', 'US30'].includes(assetKey)) setCurrentTab('US Indices');
    else setCurrentTab('Forex');
  };

  // Leaders / laggards for sidebar display
  const strongest = csmData?.rankings?.[0]?.currency || 'USD';
  const weakest = csmData?.rankings?.[csmData.rankings.length - 1]?.currency || 'CHF';

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#080c14] text-slate-100 font-sans">
      {/* 1. Left Sidebar */}
      <Sidebar
        currentTab={currentTab}
        onSelectTab={(tab) => setCurrentTab(tab)}
        collapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        strongestCurrency={strongest}
        weakestCurrency={weakest}
      />

      {/* 2. Main Content Area */}
      <div className="flex flex-1 flex-col overflow-hidden min-w-0">
        {/* Terminal Header */}
        <Header
          currentTab={currentTab}
          lastUpdated={lastUpdated}
          isRefreshing={isRefreshing}
          onRefresh={() => fetchAllData(true)}
          sourceStatus={aiIntelligence?.sourceStatus}
        />

        {/* Scrollable Viewport */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-4 md:p-6 space-y-6">
          {/* Error Banner if any */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                <span>{errorMessage}</span>
              </div>
              <button
                onClick={() => fetchAllData(true)}
                className="px-2.5 py-1 rounded bg-rose-900/60 text-white font-mono hover:bg-rose-800 transition-colors"
              >
                Coba Lagi
              </button>
            </div>
          )}

          {/* Initial Loading Skeleton */}
          {isLoading && !csmData ? (
            <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-4 text-center">
              <div className="p-3 rounded-2xl bg-emerald-500/20 border border-emerald-500/30 animate-pulse text-emerald-400">
                <Zap className="h-8 w-8 animate-bounce" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-white">
                  Menghubungkan ke Mesin AI Market Intelligence...
                </h3>
                <p className="text-xs text-slate-400 mt-1 font-mono">
                  Menyinkronkan data CSM, berita Telegram @SM_News_24h, dan quotes TradingView...
                </p>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: MAIN DASHBOARD */}
              {currentTab === 'Dashboard' && (
                <div className="space-y-6">
                  {/* 1. MARKET OUTLOOK TODAY */}
                  {aiIntelligence && (
                    <MarketOutlookToday outlook={aiIntelligence.marketOutlook} />
                  )}

                  {/* 2. TOP NEWS TODAY */}
                  <TopNewsCard
                    news={news}
                    onViewAllNews={() => setCurrentTab('News')}
                  />

                  {/* 3. CURRENCY STRENGTH (Direct Live CSM) */}
                  {csmData && (
                    <CurrencyStrengthSection
                      data={csmData}
                      selectedTf={selectedTf}
                      onTimeframeChange={handleTimeframeChange}
                      onSelectCurrency={() => setCurrentTab('Currency Strength')}
                    />
                  )}

                  {/* 4. MARKET BIAS (12 Instruments) */}
                  {aiIntelligence && (
                    <MarketBiasGrid
                      biases={aiIntelligence.marketBiases}
                      onSelectAsset={handleSelectAsset}
                    />
                  )}

                  {/* 5. TODAY'S MARKET CONCLUSION (At the bottom) */}
                  {aiIntelligence && (
                    <AiConclusionCard conclusion={aiIntelligence.conclusion} />
                  )}
                </div>
              )}

              {/* TAB 2: NEWS */}
              {currentTab === 'News' && (
                <NewsView
                  news={news}
                  onRefresh={() => fetchAllData(true)}
                  isRefreshing={isRefreshing}
                />
              )}

              {/* TAB 3: MARKET OUTLOOK */}
              {currentTab === 'Market Outlook' && aiIntelligence && (
                <MarketOutlookView
                  outlook={aiIntelligence.marketOutlook}
                  calendar={calendar}
                />
              )}

              {/* TAB 4: XAUUSD */}
              {currentTab === 'XAUUSD' && aiIntelligence && csmData && (
                <AssetDetailView
                  assetKey="XAUUSD"
                  biases={aiIntelligence.marketBiases}
                  quotes={quotes}
                  news={news}
                  csmData={csmData}
                />
              )}

              {/* TAB 5: BITCOIN */}
              {currentTab === 'Bitcoin' && aiIntelligence && csmData && (
                <AssetDetailView
                  assetKey="Bitcoin"
                  biases={aiIntelligence.marketBiases}
                  quotes={quotes}
                  news={news}
                  csmData={csmData}
                />
              )}

              {/* TAB 6: US INDICES */}
              {currentTab === 'US Indices' && aiIntelligence && csmData && (
                <AssetDetailView
                  assetKey="US Indices"
                  biases={aiIntelligence.marketBiases}
                  quotes={quotes}
                  news={news}
                  csmData={csmData}
                />
              )}

              {/* TAB 7: FOREX */}
              {currentTab === 'Forex' && aiIntelligence && csmData && (
                <AssetDetailView
                  assetKey="Forex"
                  biases={aiIntelligence.marketBiases}
                  quotes={quotes}
                  news={news}
                  csmData={csmData}
                />
              )}

              {/* TAB 8: CURRENCY STRENGTH */}
              {currentTab === 'Currency Strength' && csmData && (
                <CurrencyStrengthView
                  data={csmData}
                  selectedTf={selectedTf}
                  onTimeframeChange={handleTimeframeChange}
                />
              )}

              {/* TAB 9: SETTINGS */}
              {currentTab === 'Settings' && (
                <SettingsView
                  autoRefreshInterval={autoRefreshInterval}
                  setAutoRefreshInterval={setAutoRefreshInterval}
                  sourceStatus={aiIntelligence?.sourceStatus}
                />
              )}
            </>
          )}
        </main>
      </div>
    </div>
  );
}
