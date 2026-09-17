import React from 'react';
import {
  Coins,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  ArrowUpRight,
  ExternalLink,
  Shield,
} from 'lucide-react';
import type {
  MarketBiasItem,
  NewsItem,
  TradingViewQuote,
  CurrencyStrengthData,
} from '../types.ts';

interface AssetDetailViewProps {
  assetKey: 'XAUUSD' | 'Bitcoin' | 'US Indices' | 'Forex';
  biases: Record<string, MarketBiasItem>;
  quotes: Record<string, TradingViewQuote>;
  news: NewsItem[];
  csmData: CurrencyStrengthData;
}

export const AssetDetailView: React.FC<AssetDetailViewProps> = ({
  assetKey,
  biases,
  quotes,
  news,
  csmData,
}) => {
  // Determine symbols for the view
  let relevantSymbols: string[] = [];
  let viewTitle = '';
  let viewSubtitle = '';

  if (assetKey === 'XAUUSD') {
    relevantSymbols = ['XAUUSD'];
    viewTitle = 'Spot Gold (XAUUSD) Intelligence';
    viewSubtitle = 'Korelasi riil terhadap Dolar AS, yield Treasury, dan aliran safe haven global.';
  } else if (assetKey === 'Bitcoin') {
    relevantSymbols = ['BTC'];
    viewTitle = 'Bitcoin (BTC) Intelligence';
    viewSubtitle = 'Katalis adopsi institusional via ETF, siklus likuiditas M2 global, dan selera risiko.';
  } else if (assetKey === 'US Indices') {
    relevantSymbols = ['US100', 'US500', 'US30'];
    viewTitle = 'US Indices (Nasdaq, S&P 500, Dow Jones) Intelligence';
    viewSubtitle = 'Valuasi megacap AI, pertumbuhan laba emiten Wall Street, dan suku bunga.';
  } else {
    // Forex
    relevantSymbols = ['EURUSD', 'GBPUSD', 'USDJPY', 'AUDUSD', 'NZDUSD', 'USDCAD', 'USDCHF'];
    viewTitle = 'Major Forex Pairs Intelligence';
    viewSubtitle = 'Divergensi skor kekuatan 8 mata uang utama (CSM) dan kebijakan bank sentral.';
  }

  // Filter relevant news
  const relevantNews = news.filter((n) => {
    if (assetKey === 'XAUUSD') return n.affectedAssets.includes('XAUUSD') || n.affectedAssets.includes('USD');
    if (assetKey === 'Bitcoin') return n.affectedAssets.includes('BTC');
    if (assetKey === 'US Indices') return n.affectedAssets.some((a) => ['US30', 'US100', 'US500'].includes(a));
    return n.affectedAssets.some((a) => ['EUR', 'GBP', 'JPY', 'CHF', 'AUD', 'NZD', 'CAD', 'USD'].includes(a));
  });

  return (
    <div id={`view-${assetKey.toLowerCase().replace(/\s+/g, '-')}`} className="space-y-4">
      {/* View Header */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422]">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          {viewTitle}
        </h2>
        <p className="text-xs text-slate-400 mt-1">{viewSubtitle}</p>
      </div>

      {/* Asset Cards for this category */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {relevantSymbols.map((sym) => {
          const biasItem = biases[sym] || {
            asset: sym,
            name: sym,
            category: 'FOREX',
            bias: 'Neutral',
            rationale: 'Analisis fundamental terpadu.',
          };

          const quoteKey = sym === 'BTC' ? 'BTCUSD' : sym === 'US100' ? 'NAS100' : sym === 'US500' ? 'SPX500' : sym;
          const quote = quotes[quoteKey] || (quotes[sym] as TradingViewQuote | undefined);

          const isBullish = biasItem.bias === 'Bullish';
          const isBearish = biasItem.bias === 'Bearish';

          return (
            <div
              key={sym}
              className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] flex flex-col justify-between space-y-3"
            >
              <div>
                <div className="flex items-center justify-between border-b border-slate-800/80 pb-2.5">
                  <div>
                    <span className="font-bold text-base font-mono text-white tracking-wider">
                      {sym}
                    </span>
                    <span className="block text-[11px] text-slate-400">{biasItem.name}</span>
                  </div>

                  <span
                    className={`px-2.5 py-1 rounded text-xs font-mono font-bold border ${
                      isBullish
                        ? 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40'
                        : isBearish
                        ? 'bg-rose-950/80 text-rose-300 border-rose-500/40'
                        : 'bg-amber-950/80 text-amber-300 border-amber-500/40'
                    }`}
                  >
                    {biasItem.bias}
                  </span>
                </div>

                {/* Price Metrics if quote is available */}
                {quote && (
                  <div className="my-2.5 p-2.5 rounded-lg bg-slate-950/60 border border-slate-800/70 font-mono text-xs flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-slate-500 block">LIVE PRICE</span>
                      <span className="font-bold text-slate-100 text-sm">
                        {quote.price.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-slate-500 block">24H CHANGE</span>
                      <span
                        className={`font-bold ${quote.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}
                      >
                        {quote.changePct > 0 ? `+${quote.changePct.toFixed(2)}%` : `${quote.changePct.toFixed(2)}%`}
                      </span>
                    </div>
                  </div>
                )}

                <div className="text-xs text-slate-300 leading-relaxed space-y-1">
                  <span className="text-[10px] font-mono text-slate-500 block uppercase">Alasan Bias:</span>
                  <p>{biasItem.rationale}</p>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-800/80 text-[10px] font-mono text-slate-500 flex items-center justify-between">
                <span>Confidence: {biasItem.confidence || 'Moderate'}</span>
                <span>Category: {biasItem.category}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Relevant News Stream for this Asset */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
          BERITA & KATALIS TERKAIT {assetKey.toUpperCase()}
        </h3>

        {relevantNews.length > 0 ? (
          <div className="space-y-2">
            {relevantNews.slice(0, 5).map((n) => (
              <div
                key={n.id}
                className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800 text-xs flex items-start justify-between gap-3"
              >
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-mono text-slate-400 font-semibold">{n.source}</span>
                    <span className="text-[10px] font-mono text-slate-500">{n.time}</span>
                  </div>
                  <h4 className="font-bold text-white text-xs">{n.headline}</h4>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">{n.summary}</p>
                </div>

                {n.sourceUrl && (
                  <a
                    href={n.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="shrink-0 p-1 text-slate-500 hover:text-white"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                  </a>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono py-2">
            Tidak ada berita khusus yang terisolasi untuk aset ini hari ini.
          </div>
        )}
      </div>
    </div>
  );
};
