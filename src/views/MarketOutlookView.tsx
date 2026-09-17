import React from 'react';
import {
  Compass,
  Calendar,
  ShieldCheck,
  TrendingUp,
  TrendingDown,
  Info,
  Clock,
  Landmark,
  Zap,
} from 'lucide-react';
import type { MarketOutlook, ForexFactoryEvent } from '../types.ts';
import { RiskSentimentTrendChart } from '../components/RiskSentimentTrendChart.tsx';

interface MarketOutlookViewProps {
  outlook: MarketOutlook;
  calendar: ForexFactoryEvent[];
}

export const MarketOutlookView: React.FC<MarketOutlookViewProps> = ({ outlook, calendar }) => {
  const getImpactBadge = (impact: string) => {
    switch (impact.toLowerCase()) {
      case 'high':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'medium':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-400 border-slate-700';
    }
  };

  return (
    <div id="view-market-outlook" className="space-y-5">
      {/* Header Banner */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422]">
        <div className="flex items-center gap-2">
          <Compass className="h-5 w-5 text-emerald-400" />
          <h2 className="text-base font-bold text-white tracking-tight">
            Global Macro & Risk Sentiment Outlook
          </h2>
        </div>
        <p className="text-xs text-slate-400 mt-1 leading-relaxed">
          Sintesis menyeluruh sentimen risiko global, kebijakan moneter bank sentral, dinamika imbal hasil obligasi, dan agenda ekonomi berdampak tinggi (Forex Factory).
        </p>
      </div>

      {/* Historical Risk Sentiment 7-Day Trend Chart */}
      <RiskSentimentTrendChart
        history={outlook.riskHistory}
        currentSentiment={outlook.riskSentiment}
        currentReason={outlook.riskSentimentReason}
      />

      {/* 4 Deep Dive Pillars */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Pillar 1: Risk Appetite & Flows */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
              <Zap className="h-4 w-4 text-emerald-400" />
              1. Risk Appetite & Liquidity Flow
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-emerald-500/40 bg-emerald-950/60 text-emerald-300">
              {outlook.riskSentiment}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {outlook.riskSentimentReason}
          </p>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            Karakteristik: Saat sentimen Risk-Off mendominasi, arus likuiditas cenderung mengalir ke instrumen defensif (USD, Emas, JPY, Obligasi pemerintah) dan menekan mata uang komoditas atau ekuitas berisiko tinggi.
          </div>
        </div>

        {/* Pillar 2: The Federal Reserve & USD Dominance */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
              <Landmark className="h-4 w-4 text-amber-400" />
              2. US Dollar & Fed Monetary Cycle
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-amber-500/40 bg-amber-950/60 text-amber-300">
              USD {outlook.usdStatus}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {outlook.usdReason}
          </p>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            Korelasi Makro: Dolar AS memiliki bobot ~88% dari transaksi valas dunia. Kekuatan USD memberikan tarikan gravitasi negatif langsung pada Gold (XAUUSD) dan pasangan mayor seperti EURUSD atau GBPUSD.
          </div>
        </div>

        {/* Pillar 3: Safe-Haven vs Inflation Hedge (Gold & Bitcoin) */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-2">
          <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-yellow-400" />
            3. Alternative Stores of Value (Gold & Crypto)
          </span>
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-mono block text-[10px]">GOLD BIAS</span>
              <span className="font-bold text-white block">{outlook.goldBias}</span>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{outlook.goldReason}</p>
            </div>
            <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
              <span className="text-slate-400 font-mono block text-[10px]">BITCOIN BIAS</span>
              <span className="font-bold text-white block">{outlook.bitcoinBias}</span>
              <p className="text-[11px] text-slate-400 mt-1 line-clamp-2">{outlook.bitcoinReason}</p>
            </div>
          </div>
        </div>

        {/* Pillar 4: Wall Street & Equity Valuations */}
        <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-blue-400" />
              4. Wall Street Indices (US30 / US100 / US500)
            </span>
            <span className="text-xs font-mono font-bold px-2 py-0.5 rounded border border-blue-500/40 bg-blue-950/60 text-blue-300">
              {outlook.usIndicesBias}
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            {outlook.usIndicesReason}
          </p>
          <div className="p-2.5 rounded-lg bg-slate-900/60 border border-slate-800/80 text-[11px] text-slate-400 font-mono">
            Kunci Penggerak: Yield US 10-Year Treasury, ekspektasi laba korporasi megacap AI, dan data ketenagakerjaan / inflasi AS menentukan valuasi P/E Wall Street.
          </div>
        </div>
      </div>

      {/* Economic Calendar (Forex Factory) */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <div className="flex items-center justify-between border-b border-slate-800 pb-2">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-bold font-mono text-slate-200 uppercase">
              FOREX FACTORY ECONOMIC CALENDAR (THIS WEEK)
            </h3>
          </div>
          <span className="text-[10px] font-mono text-slate-500">Live Agenda Feed</span>
        </div>

        {calendar.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs font-mono">
              <thead>
                <tr className="border-b border-slate-800 text-slate-500 text-[10px]">
                  <th className="pb-2">COUNTRY</th>
                  <th className="pb-2">EVENT TITLE</th>
                  <th className="pb-2">IMPACT</th>
                  <th className="pb-2">FORECAST</th>
                  <th className="pb-2">PREVIOUS</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {calendar.slice(0, 10).map((event, i) => (
                  <tr key={i} className="hover:bg-slate-900/40">
                    <td className="py-2 text-white font-bold">{event.country}</td>
                    <td className="py-2 text-slate-200">{event.title}</td>
                    <td className="py-2">
                      <span className={`px-1.5 py-0.5 rounded text-[9px] border font-bold ${getImpactBadge(event.impact)}`}>
                        {event.impact}
                      </span>
                    </td>
                    <td className="py-2 text-slate-400">{event.forecast || '-'}</td>
                    <td className="py-2 text-slate-400">{event.previous || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="text-xs text-slate-500 font-mono py-2">
            Tidak ada agenda high-impact tercatat saat ini.
          </div>
        )}
      </div>
    </div>
  );
};
