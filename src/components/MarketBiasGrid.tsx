import React, { useState } from 'react';
import {
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  ArrowUpRight,
  Filter,
} from 'lucide-react';
import type { MarketBiasItem, SentimentDirection } from '../types.ts';

interface MarketBiasGridProps {
  biases: Record<string, MarketBiasItem>;
  onSelectAsset?: (asset: string) => void;
}

const ORDERED_ASSETS = [
  'XAUUSD',
  'BTC',
  'US100',
  'US500',
  'US30',
  'EURUSD',
  'GBPUSD',
  'USDJPY',
  'AUDUSD',
  'NZDUSD',
  'USDCAD',
  'USDCHF',
];

export const MarketBiasGrid: React.FC<MarketBiasGridProps> = ({ biases, onSelectAsset }) => {
  const [filter, setFilter] = useState<'ALL' | 'COMMODITY_CRYPTO' | 'INDICES' | 'FOREX'>('ALL');

  const getBiasStyle = (bias: SentimentDirection) => {
    switch (bias) {
      case 'Bullish':
        return {
          badge: 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40',
          indicator: 'text-emerald-400',
          icon: TrendingUp,
          border: 'hover:border-emerald-500/50',
        };
      case 'Bearish':
        return {
          badge: 'bg-rose-950/80 text-rose-300 border-rose-500/40',
          indicator: 'text-rose-400',
          icon: TrendingDown,
          border: 'hover:border-rose-500/50',
        };
      default:
        return {
          badge: 'bg-amber-950/80 text-amber-300 border-amber-500/40',
          indicator: 'text-amber-400',
          icon: Minus,
          border: 'hover:border-amber-500/50',
        };
    }
  };

  const filteredAssets = ORDERED_ASSETS.filter((assetKey) => {
    if (filter === 'ALL') return true;
    if (filter === 'COMMODITY_CRYPTO') return assetKey === 'XAUUSD' || assetKey === 'BTC';
    if (filter === 'INDICES') return assetKey === 'US100' || assetKey === 'US500' || assetKey === 'US30';
    if (filter === 'FOREX') return !['XAUUSD', 'BTC', 'US100', 'US500', 'US30'].includes(assetKey);
    return true;
  });

  return (
    <div id="section-market-bias" className="space-y-3">
      {/* Header with category filters */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
            MARKET BIAS (12 INSTRUMENTS)
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            Bullish / Neutral / Bearish
          </span>
        </div>

        {/* Filters */}
        <div className="flex items-center gap-1 text-[11px] font-mono bg-slate-900/80 p-1 rounded-lg border border-slate-800">
          <button
            onClick={() => setFilter('ALL')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'ALL' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            All (12)
          </button>
          <button
            onClick={() => setFilter('COMMODITY_CRYPTO')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'COMMODITY_CRYPTO'
                ? 'bg-slate-800 text-white font-semibold'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Gold & BTC
          </button>
          <button
            onClick={() => setFilter('INDICES')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'INDICES' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Indices
          </button>
          <button
            onClick={() => setFilter('FOREX')}
            className={`px-2 py-1 rounded transition-colors ${
              filter === 'FOREX' ? 'bg-slate-800 text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Forex (7)
          </button>
        </div>
      </div>

      {/* 12-Instruments Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {filteredAssets.map((assetKey) => {
          const item = biases[assetKey] || {
            asset: assetKey,
            name: assetKey,
            category: 'FOREX',
            bias: 'Neutral' as SentimentDirection,
            rationale: 'Data analisis sedang disinkronkan...',
          };

          const style = getBiasStyle(item.bias);
          const Icon = style.icon;

          return (
            <div
              key={assetKey}
              id={`card-bias-${assetKey.toLowerCase()}`}
              onClick={() => onSelectAsset && onSelectAsset(assetKey)}
              className={`p-3 rounded-xl border border-slate-800/80 bg-[#0e1422] flex flex-col justify-between transition-all cursor-pointer group ${style.border}`}
            >
              <div>
                {/* Header row: Asset symbol, name, price if available */}
                <div className="flex items-center justify-between gap-1 mb-2">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-sm font-mono text-white tracking-wide group-hover:text-emerald-300 transition-colors">
                      {item.asset}
                    </span>
                    <span className="text-[10px] text-slate-500 truncate max-w-[85px]">
                      {item.name}
                    </span>
                  </div>

                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border flex items-center gap-1 ${style.badge}`}
                  >
                    <Icon className="h-3 w-3" />
                    {item.bias}
                  </span>
                </div>

                {/* Price and 24h change row if available */}
                {item.currentPrice !== undefined && (
                  <div className="flex items-center justify-between text-xs font-mono mb-2 px-2 py-1 rounded bg-slate-950/60 border border-slate-800/60">
                    <span className="text-slate-400">Price</span>
                    <div className="flex items-center gap-1.5">
                      <span className="font-bold text-slate-200">
                        {item.currentPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                      </span>
                      {item.changePct !== undefined && (
                        <span
                          className={`text-[10px] font-semibold ${
                            item.changePct >= 0 ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {item.changePct > 0 ? `+${item.changePct.toFixed(2)}%` : `${item.changePct.toFixed(2)}%`}
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Rationale */}
                <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
                  {item.rationale}
                </p>
              </div>

              {/* Bottom footer tag */}
              <div className="mt-2.5 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-slate-500">
                <span>Category: {item.category}</span>
                {item.confidence && (
                  <span className="text-slate-400">Conf: {item.confidence}</span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
