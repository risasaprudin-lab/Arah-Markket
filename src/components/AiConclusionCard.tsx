import React from 'react';
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Compass,
} from 'lucide-react';
import type { TodayConclusion } from '../types.ts';

interface AiConclusionCardProps {
  conclusion: TodayConclusion;
}

export const AiConclusionCard: React.FC<AiConclusionCardProps> = ({ conclusion }) => {
  return (
    <div
      id="section-today-market-conclusion"
      className="rounded-2xl border border-emerald-500/30 bg-gradient-to-b from-[#0e1626] to-[#0a0e18] p-4 md:p-6 space-y-5 shadow-xl shadow-black/40"
    >
      {/* Title & Core Tagline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-emerald-500/20 border border-emerald-500/30 text-emerald-400">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm md:text-base font-bold text-white tracking-tight flex items-center gap-2">
              TODAY'S MARKET CONCLUSION
            </h2>
            <span className="text-[11px] font-mono text-emerald-400">
              NEWS → ANALYSIS → MARKET BIAS → DAILY CONCLUSION
            </span>
          </div>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-[11px] font-mono text-slate-400 self-start sm:self-auto">
          AI Intelligence Synthesis
        </div>
      </div>

      {/* PRIMARY DIRECT ANSWER CARD: "Market hari ini cenderung ke arah mana dan apa alasannya?" */}
      <div
        id="card-primary-market-direction-answer"
        className="p-4 rounded-xl bg-emerald-950/25 border border-emerald-500/40 text-slate-200"
      >
        <span className="text-[10px] font-mono font-bold tracking-wider text-emerald-400 uppercase block mb-1">
          PERTANYAAN UTAMA: ARAH MARKET HARI INI & ALASANNYA
        </span>
        <p className="text-sm md:text-base font-semibold text-white leading-relaxed">
          {conclusion.primaryDirectionAnswer}
        </p>
      </div>

      {/* 6 Structured AI Conclusion Points */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Point 1: Berita Paling Penting Hari Ini */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 flex flex-col justify-between">
          <div>
            <span className="text-[10px] font-mono text-slate-400 font-bold uppercase flex items-center gap-1.5 mb-1.5">
              <span className="h-4 w-4 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-[10px]">
                1
              </span>
              Berita Paling Penting Hari Ini
            </span>
            <p className="text-xs text-slate-200 leading-relaxed">
              {conclusion.importantNewsSummary}
            </p>
          </div>
        </div>

        {/* Point 2 & 3: Currency Terkuat & Terlemah */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40 space-y-2">
          {/* Terkuat */}
          <div className="flex items-start gap-2">
            <span className="h-4 w-4 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-500/40 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
              2
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  Currency Terkuat:
                </span>
                <span className="px-1.5 py-0.2 rounded font-mono font-bold text-xs bg-emerald-500/20 text-emerald-300 border border-emerald-500/40">
                  {conclusion.strongestCurrency.currency} (+{conclusion.strongestCurrency.score})
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {conclusion.strongestCurrency.reason}
              </p>
            </div>
          </div>

          {/* Terlemah */}
          <div className="flex items-start gap-2 pt-2 border-t border-slate-800/60">
            <span className="h-4 w-4 rounded-full bg-rose-950 text-rose-400 border border-rose-500/40 flex items-center justify-center text-[10px] shrink-0 mt-0.5 font-bold">
              3
            </span>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono text-slate-400 font-bold uppercase">
                  Currency Terlemah:
                </span>
                <span className="px-1.5 py-0.2 rounded font-mono font-bold text-xs bg-rose-500/20 text-rose-300 border border-rose-500/40">
                  {conclusion.weakestCurrency.currency} ({conclusion.weakestCurrency.score})
                </span>
              </div>
              <p className="text-[11px] text-slate-300 mt-0.5 leading-relaxed">
                {conclusion.weakestCurrency.reason}
              </p>
            </div>
          </div>
        </div>

        {/* Point 4: Faktor yang Mendukung Market */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[10px] font-mono text-emerald-400 font-bold uppercase flex items-center gap-1.5 mb-2">
            <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            4. Faktor yang Mendukung Market
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {conclusion.supportingFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-emerald-400 font-bold">✓</span>
                <span className="leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Point 5: Faktor yang Berlawanan / Risiko */}
        <div className="p-3.5 rounded-xl border border-slate-800/80 bg-slate-900/40">
          <span className="text-[10px] font-mono text-rose-400 font-bold uppercase flex items-center gap-1.5 mb-2">
            <AlertCircle className="h-4 w-4 text-rose-400" />
            5. Faktor yang Berlawanan (Risiko)
          </span>
          <ul className="space-y-1.5 text-xs text-slate-300">
            {conclusion.opposingFactors.map((factor, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-rose-400 font-bold">✕</span>
                <span className="leading-relaxed">{factor}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Point 6: Kesimpulan Arah Market Terpadu */}
      <div className="p-4 rounded-xl border border-slate-800 bg-[#080d17] space-y-2">
        <span className="text-[10px] font-mono text-sky-400 font-bold uppercase flex items-center gap-1.5">
          <Compass className="h-4 w-4 text-sky-400" />
          6. Kesimpulan Arah Market Hari Ini
        </span>
        <blockquote className="text-xs md:text-sm text-slate-200 pl-3 border-l-2 border-emerald-500 leading-relaxed font-sans">
          {conclusion.marketConclusion}
        </blockquote>
      </div>

      {/* Disclaimer reminder (Aturan AI: Jangan memberikan kepastian bahwa market pasti naik atau turun) */}
      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 pt-1">
        <ShieldCheck className="h-3.5 w-3.5 text-slate-500 shrink-0" />
        <span>{conclusion.disclaimer}</span>
      </div>
    </div>
  );
};
