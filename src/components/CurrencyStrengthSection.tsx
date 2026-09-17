import React, { useState } from 'react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
} from 'recharts';
import {
  Gauge,
  ArrowUpRight,
  TrendingUp,
  TrendingDown,
  Info,
  Layers,
  ExternalLink,
} from 'lucide-react';
import type { CurrencyStrengthData, CurrencyScore } from '../types.ts';

interface CurrencyStrengthSectionProps {
  data: CurrencyStrengthData;
  onSelectCurrency?: (currency: string) => void;
  selectedTf?: string;
  onTimeframeChange?: (tf: string) => void;
}

const CURRENCY_COLORS: Record<string, string> = {
  USD: '#FF9900',
  EUR: '#FF0000',
  GBP: '#00B050',
  JPY: '#00C0F0',
  CHF: '#8B4513',
  AUD: '#0044FF',
  NZD: '#FF0099',
  CAD: '#9900FF',
};

export const CurrencyStrengthSection: React.FC<CurrencyStrengthSectionProps> = ({
  data,
  onSelectCurrency,
  selectedTf = 'D1',
  onTimeframeChange,
}) => {
  const [activeCurrencies, setActiveCurrencies] = useState<Record<string, boolean>>({
    USD: true,
    EUR: true,
    GBP: true,
    JPY: true,
    CHF: true,
    AUD: true,
    NZD: true,
    CAD: true,
  });

  const toggleCurrency = (curr: string) => {
    setActiveCurrencies((prev) => ({
      ...prev,
      [curr]: !prev[curr],
    }));
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'strong':
        return 'bg-emerald-950/80 text-emerald-300 border-emerald-500/40';
      case 'bullish':
        return 'bg-teal-950/80 text-teal-300 border-teal-500/40';
      case 'bearish':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/40';
      case 'weak':
        return 'bg-red-950/90 text-red-300 border-red-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  // Safe history data points
  const historyData = (data.history || []).map((point, index) => ({
    time: point.time || `#${index}`,
    USD: Number(point.USD ?? 0),
    EUR: Number(point.EUR ?? 0),
    GBP: Number(point.GBP ?? 0),
    JPY: Number(point.JPY ?? 0),
    CHF: Number(point.CHF ?? 0),
    AUD: Number(point.AUD ?? 0),
    NZD: Number(point.NZD ?? 0),
    CAD: Number(point.CAD ?? 0),
  }));

  const suggested = data.suggestedPair;

  const timeframes = [
    { tf: 'D1', label: 'D1 (Hari Ini)', desc: 'Tren harian utama' },
    { tf: 'H4', label: 'H4 (4 Jam)', desc: 'Tren 4 jam' },
    { tf: 'H1', label: 'H1 (1 Jam)', desc: 'Intraday 1 jam' },
    { tf: 'M15', label: 'M15 (15m)', desc: 'Skalping 15 menit' },
  ];

  return (
    <div id="section-currency-strength" className="space-y-4">
      {/* Header with live sync metadata and Timeframe selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 rounded-xl border border-slate-800/80 bg-[#0e1422]">
        <div className="flex items-center gap-2 flex-wrap">
          <Gauge className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
            CURRENCY STRENGTH METER (CSM)
          </h2>
          
          {/* Timeframe Switcher */}
          {onTimeframeChange && (
            <div className="flex items-center gap-1 bg-slate-900/80 p-0.5 rounded-lg border border-slate-800 ml-1">
              {timeframes.map(({ tf, label }) => {
                const isActive = (selectedTf || data.timeframe) === tf;
                return (
                  <button
                    key={tf}
                    id={`btn-csm-tf-${tf.toLowerCase()}`}
                    onClick={() => onTimeframeChange(tf)}
                    className={`px-2 py-1 rounded text-[11px] font-mono transition-all font-semibold ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                        : 'text-slate-400 hover:text-white hover:bg-slate-800'
                    }`}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
          <span className="flex items-center gap-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
            Sync: Direct Live API ({data.timeframe})
          </span>
          <a
            href={data.sourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-slate-400 hover:text-emerald-300 flex items-center gap-1 transition-colors"
          >
            <span>{data.sourceName}</span>
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Suggested Trade Opportunity Card from live CSM */}
      {suggested && (
        <div
          id="card-csm-suggested-pair"
          className="p-3.5 rounded-xl border border-emerald-500/30 bg-gradient-to-r from-emerald-950/30 via-slate-900/60 to-slate-900/60 flex flex-col md:flex-row items-start md:items-center justify-between gap-3"
        >
          <div className="flex items-start sm:items-center gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold shrink-0">
              <ArrowUpRight className="h-5 w-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-mono text-slate-400">TOP DIVERGENCE SETUP:</span>
                <span className="text-sm font-bold font-mono text-white tracking-wider">
                  {suggested.action} {suggested.pair}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded font-mono font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                  Diff: {suggested.divergence} pts
                </span>
              </div>
              <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
                {suggested.rationale}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 shrink-0 text-xs font-mono self-end md:self-auto">
            {suggested.currentRate && (
              <div className="text-right">
                <span className="text-[10px] text-slate-500 block">CURRENT RATE</span>
                <span className="font-bold text-white">{suggested.currentRate}</span>
              </div>
            )}
            <div className="text-right">
              <span className="text-[10px] text-slate-500 block">CONFIDENCE</span>
              <span className="font-semibold text-emerald-400">{suggested.confidence}</span>
            </div>
          </div>
        </div>
      )}

      {/* Main Grid: 8-Currency Rankings & Interactive Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
        {/* Left: 8 Currency Ranking Bars (lg:col-span-5) */}
        <div className="lg:col-span-5 rounded-xl border border-slate-800/80 bg-[#0e1422] p-3.5 space-y-2.5">
          <div className="flex items-center justify-between border-b border-slate-800/80 pb-2">
            <span className="text-xs font-semibold text-slate-300 font-mono flex items-center gap-1.5">
              <Layers className="h-3.5 w-3.5 text-sky-400" />
              8 MAJOR RANKINGS
            </span>
            <span className="text-[10px] font-mono text-slate-500">Score Range: -10 to +10</span>
          </div>

          <div className="space-y-1.5">
            {([...(data.rankings || [])].sort((a, b) => {
              if (b.score !== a.score) return b.score - a.score;
              if (b.raw !== undefined && a.raw !== undefined && b.raw !== a.raw) return b.raw - a.raw;
              return (b.score10 ?? 0) - (a.score10 ?? 0);
            })).map((c, index) => {
              const color = CURRENCY_COLORS[c.currency] || c.color || '#38bdf8';
              // Calculate width percentage relative to -10 to +10 (range 20)
              const normalizedPct = Math.max(5, Math.min(100, ((c.score + 10) / 20) * 100));
              const displayRank = index + 1;

              return (
                <div
                  key={c.currency}
                  id={`csm-rank-${c.currency.toLowerCase()}`}
                  onClick={() => onSelectCurrency && onSelectCurrency(c.currency)}
                  className="group p-2 rounded-lg border border-slate-800/60 bg-slate-900/40 hover:bg-slate-800/50 hover:border-slate-700 transition-all cursor-pointer"
                >
                  <div className="flex items-center justify-between text-xs mb-1">
                    <div className="flex items-center gap-2">
                      <span className="w-4 text-center font-mono text-[11px] font-bold text-slate-500 group-hover:text-slate-300">
                        #{displayRank}
                      </span>
                      <span className="text-sm">{c.flag}</span>
                      <span className="font-mono font-bold text-white">{c.currency}</span>
                      <span className="text-[11px] text-slate-400 hidden sm:inline">{c.name}</span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`text-[10px] px-1.5 py-0.5 rounded font-mono border ${getStatusBadge(
                          c.status,
                        )}`}
                      >
                        {c.status}
                      </span>
                      <span
                        className="font-mono font-extrabold text-xs"
                        style={{ color: color }}
                      >
                        {c.score > 0 ? `+${c.score.toFixed(1)}` : c.score.toFixed(1)}
                      </span>
                    </div>
                  </div>

                  {/* Visual Strength Progress Bar */}
                  <div className="h-1.5 w-full rounded-full bg-slate-950 overflow-hidden relative">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${normalizedPct}%`,
                        backgroundColor: color,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Historical Strength Chart (lg:col-span-7) */}
        <div className="lg:col-span-7 rounded-xl border border-slate-800/80 bg-[#0e1422] p-3.5 flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
            <div>
              <span className="text-xs font-semibold text-slate-300 font-mono">
                STRENGTH HISTORY (TIME-SERIES)
              </span>
              <span className="block text-[10px] text-slate-500">
                Data real-time dari Currency Strength Meter
              </span>
            </div>

            {/* Currency toggles */}
            <div className="flex flex-wrap items-center gap-1 text-[10px] font-mono">
              {Object.keys(CURRENCY_COLORS).map((curr) => {
                const isSelected = activeCurrencies[curr];
                return (
                  <button
                    key={curr}
                    onClick={() => toggleCurrency(curr)}
                    className={`px-1.5 py-0.5 rounded border transition-all ${
                      isSelected
                        ? 'text-white border-slate-600'
                        : 'text-slate-600 border-slate-800 bg-transparent opacity-40'
                    }`}
                    style={{
                      borderColor: isSelected ? CURRENCY_COLORS[curr] : undefined,
                      backgroundColor: isSelected ? `${CURRENCY_COLORS[curr]}22` : undefined,
                    }}
                  >
                    {curr}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chart Display */}
          <div className="h-64 sm:h-72 w-full mt-3">
            {historyData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={historyData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis
                    dataKey="time"
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    tickFormatter={(v) => v.slice(-5)}
                  />
                  <YAxis
                    stroke="#475569"
                    fontSize={10}
                    tickLine={false}
                    domain={[-30, 30]}
                    ticks={[-20, -10, 0, 10, 20]}
                  />
                  <ReferenceLine y={0} stroke="#334155" strokeDasharray="2 2" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#090d16',
                      borderColor: '#1e293b',
                      borderRadius: '8px',
                      fontSize: '11px',
                      fontFamily: 'monospace',
                    }}
                  />
                  {Object.entries(CURRENCY_COLORS).map(([curr, color]) => {
                    if (!activeCurrencies[curr]) return null;
                    return (
                      <Line
                        key={curr}
                        type="monotone"
                        dataKey={curr}
                        name={curr}
                        stroke={color}
                        strokeWidth={curr === 'USD' || curr === 'CHF' ? 2.5 : 1.5}
                        dot={false}
                        isAnimationActive={false}
                      />
                    );
                  })}
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-500 font-mono">
                Memuat riwayat currency strength...
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-slate-500 font-mono flex items-center justify-between">
            <span>Garis tengah (0.0): Titik keseimbangan netral</span>
            <span>Nilai di atas 0: Menguat | Di bawah 0: Melemah</span>
          </div>
        </div>
      </div>
    </div>
  );
};
