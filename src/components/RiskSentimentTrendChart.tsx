import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  ReferenceLine,
  Cell,
} from 'recharts';
import {
  ShieldAlert,
  TrendingUp,
  TrendingDown,
  Minus,
  Activity,
  Calendar,
  Layers,
  Sparkles,
  Info,
  CheckCircle2,
} from 'lucide-react';
import type { RiskSentiment, RiskSentimentHistoryPoint } from '../types.ts';

interface RiskSentimentTrendChartProps {
  history?: RiskSentimentHistoryPoint[];
  currentSentiment?: RiskSentiment | string;
  currentReason?: string;
  className?: string;
}

const normalizeSentiment = (sentiment?: string): RiskSentiment => {
  if (sentiment === 'Risk Off') return 'Risk Off';
  if (sentiment === 'Mixed') return 'Mixed';
  return 'Risk On';
};

// Client-side fallback generator if history not yet synced
const createFallback7DayHistory = (rawSentiment?: string): RiskSentimentHistoryPoint[] => {
  const sentiment = normalizeSentiment(rawSentiment);
  const result: RiskSentimentHistoryPoint[] = [];
  const now = new Date();
  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const todayScore = sentiment === 'Risk On' ? 68 : sentiment === 'Risk Off' ? -58 : 8;

  const baselineDrivers = [
    {
      score: -42,
      equities: -0.65,
      fx: -4.2,
      vix: 19.4,
      sentiment: 'Risk Off' as const,
      driver: 'Kekhawatiran inflasi sticky dan kenaikan imbal hasil US Treasury 10-tahun menekan selera risiko investor global.',
    },
    {
      score: 15,
      equities: 0.35,
      fx: 1.8,
      vix: 17.2,
      sentiment: 'Mixed' as const,
      driver: 'Konsolidasi pasar menjelang rilis data ketenagakerjaan dan testimoni kebijakan The Fed.',
    },
    {
      score: 58,
      equities: 1.15,
      fx: 6.4,
      vix: 15.6,
      sentiment: 'Risk On' as const,
      driver: 'Reli saham semikonduktor & AI di Wall Street memicu euforia risk-on lintas pasar global.',
    },
    {
      score: -36,
      equities: -0.82,
      fx: -5.1,
      vix: 18.8,
      sentiment: 'Risk Off' as const,
      driver: 'Kekhawatiran tensi geopolitik mendorong arus safe-haven ke USD, JPY, dan obligasi pemerintah.',
    },
    {
      score: 25,
      equities: 0.48,
      fx: 3.1,
      vix: 16.5,
      sentiment: 'Mixed' as const,
      driver: 'Pernyataan dovish bank sentral memicu pemulihan bertahap pada aset berisiko dan pelemahan USD.',
    },
    {
      score: sentiment === 'Risk On' ? 48 : sentiment === 'Risk Off' ? -22 : 12,
      equities: sentiment === 'Risk On' ? 0.72 : -0.35,
      fx: sentiment === 'Risk On' ? 5.2 : -2.1,
      vix: sentiment === 'Risk On' ? 15.1 : 18.2,
      sentiment: sentiment === 'Risk On' ? ('Risk On' as const) : sentiment === 'Risk Off' ? ('Risk Off' as const) : ('Mixed' as const),
      driver: 'Arus modal beralih ke komoditas dan saham siklikal seiring pelemahan indeks Dolar AS.',
    },
    {
      score: todayScore,
      equities: sentiment === 'Risk On' ? 0.85 : sentiment === 'Risk Off' ? -0.75 : 0.2,
      fx: sentiment === 'Risk On' ? 6.5 : sentiment === 'Risk Off' ? -5.5 : 1.5,
      vix: sentiment === 'Risk On' ? 14.3 : sentiment === 'Risk Off' ? 19.8 : 16.5,
      sentiment,
      driver: sentiment === 'Risk On'
        ? 'Risk-On dominan: Reli indeks saham berjangka Wall Street, lonjakan mata uang komoditas (AUD/NZD), dan pelemahan Dolar AS.'
        : sentiment === 'Risk Off'
        ? 'Risk-Off mendominasi: Permintaan aset safe-haven menguat seiring kehati-hatian investor dan koreksi ekuitas global.'
        : 'Sentimen Mixed: Pasar bergerak selektif dengan konsolidasi sektoral dan penantian rilis data ekonomi utama.',
    },
  ];

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const dayName = dayNames[d.getDay()];
    const dateStr = `${d.getDate()} ${monthNames[d.getMonth()]}`;
    const fullDate = `${d.getDate()} ${monthNames[d.getMonth()]} ${d.getFullYear()}`;
    const b = baselineDrivers[6 - i];

    result.push({
      date: dateStr,
      fullDate,
      dayName,
      sentiment: b.sentiment,
      sentimentScore: b.score,
      equitiesScore: b.equities,
      fxRiskScore: b.fx,
      vixLevel: b.vix,
      dominantDriver: b.driver,
    });
  }

  return result;
};

export const RiskSentimentTrendChart: React.FC<RiskSentimentTrendChartProps> = ({
  history,
  currentSentiment = 'Risk On',
  currentReason,
  className = '',
}) => {
  const [activeTab, setActiveTab] = useState<'SCORE' | 'FACTORS' | 'BARS'>('SCORE');
  const [selectedDayIndex, setSelectedDayIndex] = useState<number>(6); // Default to today (index 6)

  // Use provided history or fallback
  const chartData = useMemo(() => {
    if (history && history.length >= 7) {
      return history;
    }
    return createFallback7DayHistory(currentSentiment);
  }, [history, currentSentiment]);

  // Selected day point
  const selectedPoint = chartData[selectedDayIndex] || chartData[chartData.length - 1];

  // 7-day stats calculations
  const stats = useMemo(() => {
    let riskOnDays = 0;
    let riskOffDays = 0;
    let mixedDays = 0;
    let sumScore = 0;

    chartData.forEach((pt) => {
      sumScore += pt.sentimentScore;
      if (pt.sentiment === 'Risk On') riskOnDays++;
      else if (pt.sentiment === 'Risk Off') riskOffDays++;
      else mixedDays++;
    });

    const avgScore = Math.round(sumScore / chartData.length);
    const firstDay = chartData[0]?.sentimentScore ?? 0;
    const lastDay = chartData[chartData.length - 1]?.sentimentScore ?? 0;
    const delta = lastDay - firstDay;

    return {
      riskOnDays,
      riskOffDays,
      mixedDays,
      avgScore,
      delta,
    };
  }, [chartData]);

  // Helper for status badge
  const getBadgeStyle = (sentiment: RiskSentiment) => {
    switch (sentiment) {
      case 'Risk On':
        return {
          bg: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/40',
          dot: 'bg-emerald-400',
          barColor: '#10b981',
          icon: TrendingUp,
        };
      case 'Risk Off':
        return {
          bg: 'bg-rose-500/15 text-rose-300 border-rose-500/40',
          dot: 'bg-rose-400',
          barColor: '#f43f5e',
          icon: TrendingDown,
        };
      default:
        return {
          bg: 'bg-amber-500/15 text-amber-300 border-amber-500/40',
          dot: 'bg-amber-400',
          barColor: '#f59e0b',
          icon: Minus,
        };
    }
  };

  const currentBadge = getBadgeStyle(selectedPoint?.sentiment || currentSentiment);

  return (
    <div
      id="component-risk-sentiment-trend"
      className={`p-4 sm:p-5 rounded-2xl border border-slate-800 bg-[#0c121e] space-y-4 shadow-xl ${className}`}
    >
      {/* 1. Header with Title, Mode Switcher, and Live Indicator */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800/80">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-400">
              <ShieldAlert className="h-4 w-4" />
            </div>
            <h3 className="text-sm font-bold font-mono text-white tracking-wide uppercase flex items-center gap-2">
              Tren Sentimen Risiko 7 Hari
              <span className="text-[10px] font-normal px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                Risk On / Risk Off
              </span>
            </h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed max-w-2xl">
            Fluktuasi selera risiko pasar global selama 7 hari terakhir berdasarkan sintesis momentum ekuitas Wall Street, pergerakan yield obligasi, dan dinamika mata uang komoditas vs safe-haven.
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-1 p-1 rounded-lg bg-slate-900 border border-slate-800 self-start sm:self-auto font-mono text-xs">
          <button
            onClick={() => setActiveTab('SCORE')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'SCORE'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Skor Sentimen
          </button>
          <button
            onClick={() => setActiveTab('FACTORS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'FACTORS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Multi-Faktor
          </button>
          <button
            onClick={() => setActiveTab('BARS')}
            className={`px-3 py-1.5 rounded-md font-semibold transition-all ${
              activeTab === 'BARS'
                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Distribusi Harian
          </button>
        </div>
      </div>

      {/* 2. 4 Key Stat Metrics Chips */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 font-mono">
        {/* Metric 1: Today's Status */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Sentimen Hari Ini
          </span>
          <div className="flex items-center gap-2 mt-1">
            <span className={`h-2 w-2 rounded-full ${currentBadge.dot} animate-ping`} />
            <span className="text-xs sm:text-sm font-bold text-white">
              {chartData[chartData.length - 1]?.sentiment}
            </span>
            <span
              className={`text-[10px] px-1.5 py-0.2 rounded font-bold border ${currentBadge.bg}`}
            >
              {chartData[chartData.length - 1]?.sentimentScore > 0 ? '+' : ''}
              {chartData[chartData.length - 1]?.sentimentScore}
            </span>
          </div>
        </div>

        {/* Metric 2: 7-Day Distribution */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Komposisi 7 Hari
          </span>
          <div className="text-xs sm:text-sm font-bold text-slate-200 mt-1 flex items-center gap-1.5">
            <span className="text-emerald-400">{stats.riskOnDays} On</span>
            <span className="text-slate-600">•</span>
            <span className="text-amber-400">{stats.mixedDays} Mix</span>
            <span className="text-slate-600">•</span>
            <span className="text-rose-400">{stats.riskOffDays} Off</span>
          </div>
        </div>

        {/* Metric 3: 7-Day Average Score */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Rata-Rata Skor 7D
          </span>
          <div className="text-xs sm:text-sm font-bold mt-1 flex items-center gap-1.5">
            <span
              className={
                stats.avgScore > 15
                  ? 'text-emerald-400'
                  : stats.avgScore < -15
                  ? 'text-rose-400'
                  : 'text-amber-400'
              }
            >
              {stats.avgScore > 0 ? '+' : ''}
              {stats.avgScore} pts
            </span>
            <span className="text-[10px] text-slate-500">
              ({stats.avgScore > 15 ? 'Bullish Risk' : stats.avgScore < -15 ? 'Defensive' : 'Netral'})
            </span>
          </div>
        </div>

        {/* Metric 4: Trend Velocity */}
        <div className="p-3 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between">
          <span className="text-[10px] text-slate-500 uppercase tracking-wider block">
            Perubahan vs Awal Minggu
          </span>
          <div className="text-xs sm:text-sm font-bold mt-1 flex items-center gap-1.5">
            {stats.delta >= 0 ? (
              <TrendingUp className="h-3.5 w-3.5 text-emerald-400" />
            ) : (
              <TrendingDown className="h-3.5 w-3.5 text-rose-400" />
            )}
            <span className={stats.delta >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
              {stats.delta >= 0 ? '+' : ''}
              {stats.delta} pts
            </span>
            <span className="text-[10px] text-slate-500">
              {stats.delta >= 0 ? 'Menguat' : 'Melemah'}
            </span>
          </div>
        </div>
      </div>

      {/* 3. Recharts Container */}
      <div className="p-3.5 rounded-xl border border-slate-800/80 bg-[#090e18]">
        {/* Legend / Range Guide */}
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-slate-800/70 text-[11px] font-mono">
          <div className="flex flex-wrap items-center gap-3">
            <span className="text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Zona Risk-On (&gt; +20)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-amber-400" />
              Zona Mixed (-20 s/d +20)
            </span>
            <span className="text-slate-400 flex items-center gap-1">
              <span className="h-2 w-2 rounded-full bg-rose-400" />
              Zona Risk-Off (&lt; -20)
            </span>
          </div>

          <span className="text-slate-500 text-[10px] hidden sm:inline">
            Klik titik tanggal untuk melihat narasi katalis hari tersebut
          </span>
        </div>

        <div className="h-64 sm:h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            {activeTab === 'SCORE' ? (
              <AreaChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setSelectedDayIndex(e.activeTooltipIndex);
                  }
                }}
              >
                <defs>
                  <linearGradient id="riskSentimentGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                    <stop offset="50%" stopColor="#f59e0b" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.35} />
                  </linearGradient>
                </defs>

                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />

                <XAxis
                  dataKey="date"
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  dy={5}
                />
                <YAxis
                  domain={[-100, 100]}
                  ticks={[-80, -40, -20, 0, 20, 40, 80]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => (val > 0 ? `+${val}` : `${val}`)}
                />

                <ReferenceLine
                  y={20}
                  stroke="#10b981"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  label={{
                    value: '+20 Risk-On',
                    position: 'insideTopRight',
                    fill: '#10b981',
                    fontSize: 9,
                  }}
                />
                <ReferenceLine
                  y={0}
                  stroke="#475569"
                  strokeWidth={1}
                />
                <ReferenceLine
                  y={-20}
                  stroke="#f43f5e"
                  strokeDasharray="3 3"
                  strokeOpacity={0.4}
                  label={{
                    value: '-20 Risk-Off',
                    position: 'insideBottomRight',
                    fill: '#f43f5e',
                    fontSize: 9,
                  }}
                />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as RiskSentimentHistoryPoint;
                      const badge = getBadgeStyle(data.sentiment);
                      return (
                        <div className="p-3 rounded-xl bg-[#0c121e] border border-slate-700 shadow-2xl space-y-1.5 font-mono text-xs max-w-xs">
                          <div className="flex items-center justify-between gap-2 border-b border-slate-800 pb-1.5">
                            <span className="font-bold text-white flex items-center gap-1.5">
                              <Calendar className="h-3.5 w-3.5 text-emerald-400" />
                              {data.dayName}, {data.date}
                            </span>
                            <span
                              className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}
                            >
                              {data.sentiment}
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px] pt-0.5">
                            <span className="text-slate-400">Skor Sentimen:</span>
                            <span className="font-bold text-white">
                              {data.sentimentScore > 0 ? '+' : ''}
                              {data.sentimentScore} / 100
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">Futures Ekuitas:</span>
                            <span
                              className={`font-bold ${
                                data.equitiesScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {data.equitiesScore > 0 ? '+' : ''}
                              {data.equitiesScore}%
                            </span>
                          </div>

                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">FX Risk Divergence:</span>
                            <span
                              className={`font-bold ${
                                data.fxRiskScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                              }`}
                            >
                              {data.fxRiskScore > 0 ? '+' : ''}
                              {data.fxRiskScore}
                            </span>
                          </div>

                          <div className="pt-1 border-t border-slate-800 text-[10px] text-slate-300 leading-snug">
                            <span className="text-emerald-400 font-semibold block mb-0.5">
                              Katalis Pasar:
                            </span>
                            {data.dominantDriver}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Area
                  type="monotone"
                  dataKey="sentimentScore"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  fillOpacity={1}
                  fill="url(#riskSentimentGrad)"
                  activeDot={{
                    r: 6,
                    fill: '#10b981',
                    stroke: '#ffffff',
                    strokeWidth: 2,
                  }}
                />
              </AreaChart>
            ) : activeTab === 'FACTORS' ? (
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setSelectedDayIndex(e.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} dy={5} />
                <YAxis stroke="#64748b" fontSize={10} tickLine={false} />
                <ReferenceLine y={0} stroke="#334155" />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as RiskSentimentHistoryPoint;
                      return (
                        <div className="p-3 rounded-xl bg-[#0c121e] border border-slate-700 shadow-xl space-y-1.5 font-mono text-xs max-w-xs">
                          <div className="flex items-center justify-between border-b border-slate-800 pb-1">
                            <span className="font-bold text-white">
                              {data.dayName}, {data.date}
                            </span>
                            <span className="text-[10px] text-emerald-400 font-bold">
                              {data.sentiment}
                            </span>
                          </div>
                          <div className="space-y-1 text-[11px]">
                            <div className="flex justify-between">
                              <span className="text-emerald-400">Skor Sentimen:</span>
                              <span className="text-white font-bold">{data.sentimentScore}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-indigo-400">Ekuitas %:</span>
                              <span className="text-white font-bold">{data.equitiesScore}%</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-amber-400">FX Risk AUD/NZD:</span>
                              <span className="text-white font-bold">{data.fxRiskScore}</span>
                            </div>
                            <div className="flex justify-between">
                              <span className="text-sky-400">VIX Volatilitas:</span>
                              <span className="text-white font-bold">{data.vixLevel}</span>
                            </div>
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Line
                  type="monotone"
                  name="Skor Sentimen"
                  dataKey="sentimentScore"
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981' }}
                />
                <Line
                  type="monotone"
                  name="FX Risk"
                  dataKey="fxRiskScore"
                  stroke="#f59e0b"
                  strokeWidth={2}
                  dot={{ r: 3, fill: '#f59e0b' }}
                />
              </LineChart>
            ) : (
              <BarChart
                data={chartData}
                margin={{ top: 10, right: 15, left: -20, bottom: 0 }}
                onClick={(e) => {
                  if (e && e.activeTooltipIndex !== undefined) {
                    setSelectedDayIndex(e.activeTooltipIndex);
                  }
                }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={11} tickLine={false} dy={5} />
                <YAxis
                  domain={[-100, 100]}
                  stroke="#64748b"
                  fontSize={10}
                  tickLine={false}
                  tickFormatter={(val) => (val > 0 ? `+${val}` : `${val}`)}
                />
                <ReferenceLine y={0} stroke="#475569" />

                <Tooltip
                  content={({ active, payload }) => {
                    if (active && payload && payload.length) {
                      const data = payload[0].payload as RiskSentimentHistoryPoint;
                      const badge = getBadgeStyle(data.sentiment);
                      return (
                        <div className="p-3 rounded-xl bg-[#0c121e] border border-slate-700 shadow-xl space-y-1 font-mono text-xs">
                          <span className="font-bold text-white block">
                            {data.dayName}, {data.date}
                          </span>
                          <span
                            className={`inline-block px-1.5 py-0.5 rounded text-[10px] font-bold border ${badge.bg}`}
                          >
                            {data.sentiment} ({data.sentimentScore > 0 ? '+' : ''}
                            {data.sentimentScore})
                          </span>
                          <p className="text-[10px] text-slate-300 mt-1 max-w-xs">
                            {data.dominantDriver}
                          </p>
                        </div>
                      );
                    }
                    return null;
                  }}
                />

                <Bar dataKey="sentimentScore" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => {
                    const color =
                      entry.sentiment === 'Risk On'
                        ? '#10b981'
                        : entry.sentiment === 'Risk Off'
                        ? '#f43f5e'
                        : '#f59e0b';
                    return <Cell key={`cell-${index}`} fill={color} />;
                  })}
                </Bar>
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4. 7-Day Interactive Timeline Selector */}
      <div className="space-y-2">
        <div className="flex items-center justify-between text-xs font-mono">
          <span className="text-slate-400 font-semibold flex items-center gap-1.5">
            <Activity className="h-3.5 w-3.5 text-emerald-400" />
            Pilih Hari untuk Membedah Narasi Makro:
          </span>
          <span className="text-[11px] text-slate-500">
            {selectedPoint.dayName}, {selectedPoint.fullDate}
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-7 gap-2">
          {chartData.map((pt, idx) => {
            const isSelected = selectedDayIndex === idx;
            const badge = getBadgeStyle(pt.sentiment);
            const isToday = idx === chartData.length - 1;

            return (
              <button
                key={pt.date}
                onClick={() => setSelectedDayIndex(idx)}
                className={`p-2.5 rounded-xl border text-left font-mono transition-all flex flex-col justify-between ${
                  isSelected
                    ? 'bg-slate-800/90 border-emerald-500/60 ring-1 ring-emerald-500/30 shadow-md'
                    : 'bg-slate-900/60 border-slate-800 hover:border-slate-700 hover:bg-slate-900'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-400 font-semibold">{pt.dayName.slice(0, 3)}</span>
                  {isToday && (
                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  )}
                </div>

                <div className="mt-1">
                  <span className="text-xs font-bold text-white block">{pt.date}</span>
                  <span
                    className={`inline-block text-[9px] font-bold px-1 py-0.2 rounded border mt-1 ${badge.bg}`}
                  >
                    {pt.sentimentScore > 0 ? `+${pt.sentimentScore}` : `${pt.sentimentScore}`}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 5. Selected Day Deep-Dive Inspector Box */}
      <div className="p-3.5 rounded-xl border border-slate-800 bg-[#0d1424] space-y-2">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-2">
          <div className="flex items-center gap-2">
            <span
              className={`px-2 py-0.5 rounded text-xs font-mono font-bold border ${currentBadge.bg}`}
            >
              {selectedPoint.sentiment}
            </span>
            <span className="text-xs font-bold text-white font-mono">
              {selectedPoint.dayName}, {selectedPoint.fullDate}
            </span>
            {selectedDayIndex === chartData.length - 1 && (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                HARI INI (WIB)
              </span>
            )}
          </div>

          <div className="flex items-center gap-3 text-xs font-mono text-slate-400">
            <span>
              Ekuitas:{' '}
              <strong
                className={
                  selectedPoint.equitiesScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {selectedPoint.equitiesScore > 0 ? '+' : ''}
                {selectedPoint.equitiesScore}%
              </strong>
            </span>
            <span>
              FX Risk Divergence:{' '}
              <strong
                className={
                  selectedPoint.fxRiskScore >= 0 ? 'text-emerald-400' : 'text-rose-400'
                }
              >
                {selectedPoint.fxRiskScore > 0 ? '+' : ''}
                {selectedPoint.fxRiskScore}
              </strong>
            </span>
            <span>
              VIX:{' '}
              <strong className="text-sky-300">{selectedPoint.vixLevel}</strong>
            </span>
          </div>
        </div>

        <div className="flex items-start gap-2.5 pt-1">
          <Sparkles className="h-4 w-4 text-emerald-400 shrink-0 mt-0.5" />
          <p className="text-xs text-slate-200 leading-relaxed font-sans">
            {selectedPoint.dominantDriver}
          </p>
        </div>

        {selectedDayIndex === chartData.length - 1 && currentReason && (
          <div className="p-2.5 rounded-lg bg-slate-900/80 border border-slate-800 text-xs text-slate-300 font-mono flex items-start gap-2">
            <Info className="h-4 w-4 text-sky-400 shrink-0 mt-0.5" />
            <div>
              <span className="text-sky-400 font-bold block mb-0.5">
                Konfirmasi Real-Time CSM & Arus Likuiditas:
              </span>
              <span>{currentReason}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
