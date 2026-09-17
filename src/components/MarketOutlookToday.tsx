import React, { useState } from 'react';
import {
  ShieldAlert,
  DollarSign,
  Coins,
  Bitcoin,
  TrendingUp,
  TrendingDown,
  Minus,
  Sparkles,
  Info,
  Activity,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import type { MarketOutlook } from '../types.ts';
import { RiskSentimentTrendChart } from './RiskSentimentTrendChart.tsx';

interface MarketOutlookTodayProps {
  outlook: MarketOutlook;
}

export const MarketOutlookToday: React.FC<MarketOutlookTodayProps> = ({ outlook }) => {
  const [showRiskTrend, setShowRiskTrend] = useState(false);
  // Helpers for badge styling
  const getRiskSentimentBadge = (sentiment: string) => {
    switch (sentiment) {
      case 'Risk On':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          dot: 'bg-emerald-400',
          icon: TrendingUp,
          label: 'Risk On',
        };
      case 'Risk Off':
        return {
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          dot: 'bg-rose-400',
          icon: TrendingDown,
          label: 'Risk Off',
        };
      default:
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          dot: 'bg-amber-400',
          icon: Minus,
          label: 'Mixed',
        };
    }
  };

  const getUsdBadge = (status: string) => {
    switch (status) {
      case 'Strong':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          icon: TrendingUp,
          label: 'Strong',
        };
      case 'Weak':
        return {
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          icon: TrendingDown,
          label: 'Weak',
        };
      default:
        return {
          bg: 'bg-slate-900 border-slate-700 text-slate-300',
          icon: Minus,
          label: 'Neutral',
        };
    }
  };

  const getDirectionBadge = (bias: string) => {
    switch (bias) {
      case 'Bullish':
        return {
          bg: 'bg-emerald-950/60 border-emerald-500/40 text-emerald-300',
          icon: TrendingUp,
          label: 'Bullish',
        };
      case 'Bearish':
        return {
          bg: 'bg-rose-950/60 border-rose-500/40 text-rose-300',
          icon: TrendingDown,
          label: 'Bearish',
        };
      default:
        return {
          bg: 'bg-amber-950/60 border-amber-500/40 text-amber-300',
          icon: Minus,
          label: 'Neutral',
        };
    }
  };

  const riskBadge = getRiskSentimentBadge(outlook.riskSentiment);
  const usdBadge = getUsdBadge(outlook.usdStatus);
  const goldBadge = getDirectionBadge(outlook.goldBias);
  const btcBadge = getDirectionBadge(outlook.bitcoinBias);
  const indicesBadge = getDirectionBadge(outlook.usIndicesBias);

  return (
    <div id="section-market-outlook-today" className="space-y-3">
      {/* Section Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
            MARKET OUTLOOK TODAY
          </h2>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowRiskTrend(!showRiskTrend)}
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border transition-all text-xs font-mono ${
              showRiskTrend
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/50 shadow-sm'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            <span>Tren Sentimen 7H</span>
            {showRiskTrend ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
          <span className="text-[11px] font-mono text-slate-500 hidden sm:flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-emerald-400" />
            AI Macro Synthesis
          </span>
        </div>
      </div>

      {/* 5 Core Outlook Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* 1. Risk Sentiment */}
        <div
          id="card-outlook-risk"
          className="p-3.5 rounded-xl border border-slate-800/90 bg-[#0e1422] flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700"
        >
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
                <ShieldAlert className="h-3.5 w-3.5 text-sky-400" />
                Risk Sentiment
              </span>
              <span
                className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${riskBadge.bg}`}
              >
                {riskBadge.label}
              </span>
            </div>
            <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
              {outlook.riskSentimentReason}
            </p>
          </div>

          <button
            type="button"
            onClick={() => setShowRiskTrend(!showRiskTrend)}
            className="mt-2.5 pt-1.5 border-t border-slate-800/80 flex items-center justify-between text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors w-full"
          >
            <span className="flex items-center gap-1">
              <Activity className="h-3 w-3" />
              {showRiskTrend ? 'Tutup Tren 7H' : 'Grafik Tren 7H'}
            </span>
            {showRiskTrend ? (
              <ChevronUp className="h-3 w-3" />
            ) : (
              <ChevronDown className="h-3 w-3" />
            )}
          </button>
        </div>

        {/* 2. USD */}
        <div
          id="card-outlook-usd"
          className="p-3.5 rounded-xl border border-slate-800/90 bg-[#0e1422] flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <DollarSign className="h-3.5 w-3.5 text-amber-400" />
              USD
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${usdBadge.bg}`}
            >
              {usdBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
            {outlook.usdReason}
          </p>
        </div>

        {/* 3. Gold */}
        <div
          id="card-outlook-gold"
          className="p-3.5 rounded-xl border border-slate-800/90 bg-[#0e1422] flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Coins className="h-3.5 w-3.5 text-yellow-400" />
              Gold (XAUUSD)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${goldBadge.bg}`}
            >
              {goldBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
            {outlook.goldReason}
          </p>
        </div>

        {/* 4. Bitcoin */}
        <div
          id="card-outlook-bitcoin"
          className="p-3.5 rounded-xl border border-slate-800/90 bg-[#0e1422] flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <Bitcoin className="h-3.5 w-3.5 text-orange-400" />
              Bitcoin (BTC)
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${btcBadge.bg}`}
            >
              {btcBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
            {outlook.bitcoinReason}
          </p>
        </div>

        {/* 5. US Indices */}
        <div
          id="card-outlook-indices"
          className="p-3.5 rounded-xl border border-slate-800/90 bg-[#0e1422] flex flex-col justify-between relative overflow-hidden transition-all hover:border-slate-700"
        >
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1.5">
              <TrendingUp className="h-3.5 w-3.5 text-blue-400" />
              US Indices
            </span>
            <span
              className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold border ${indicesBadge.bg}`}
            >
              {indicesBadge.label}
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-relaxed line-clamp-3">
            {outlook.usIndicesReason}
          </p>
        </div>
      </div>

      {/* Expandable 7-Day Risk Sentiment Trend Chart */}
      {showRiskTrend && (
        <div className="pt-2 animate-in fade-in duration-200">
          <RiskSentimentTrendChart
            history={outlook.riskHistory}
            currentSentiment={outlook.riskSentiment}
            currentReason={outlook.riskSentimentReason}
          />
        </div>
      )}
    </div>
  );
};
