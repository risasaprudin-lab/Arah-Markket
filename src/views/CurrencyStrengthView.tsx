import React from 'react';
import { CurrencyStrengthSection } from '../components/CurrencyStrengthSection.tsx';
import { Gauge, ExternalLink, Info, ShieldAlert, CheckCircle } from 'lucide-react';
import type { CurrencyStrengthData } from '../types.ts';

interface CurrencyStrengthViewProps {
  data: CurrencyStrengthData;
  selectedTf?: string;
  onTimeframeChange?: (tf: string) => void;
}

export const CurrencyStrengthView: React.FC<CurrencyStrengthViewProps> = ({
  data,
  selectedTf = 'D1',
  onTimeframeChange,
}) => {
  return (
    <div id="view-currency-strength" className="space-y-5">
      {/* Header */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <Gauge className="h-5 w-5 text-emerald-400" />
            <h2 className="text-base font-bold text-white tracking-tight">
              Currency Strength Meter Terminal
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            Data kekuatan relatif 8 mata uang utama (USD, EUR, GBP, JPY, CHF, AUD, NZD, CAD) dari 28 pasangan valas.
          </p>
        </div>

        <a
          href={data.sourceUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-xs font-mono transition-colors self-start md:self-auto"
        >
          <span>Buka Sumber Resmi</span>
          <ExternalLink className="h-3.5 w-3.5" />
        </a>
      </div>

      {/* Main Currency Strength Section */}
      <CurrencyStrengthSection
        data={data}
        selectedTf={selectedTf}
        onTimeframeChange={onTimeframeChange}
      />

      {/* Methodology Guide */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-1.5">
          <Info className="h-4 w-4 text-sky-400" />
          PANDUAN INTERPRETASI TRADING DENGAN CURRENCY STRENGTH METER (CSM)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs text-slate-300">
          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-emerald-400 block font-mono">1. Trend Following (Momentum)</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Pasangkan mata uang terkuat (peringkat #1) dengan mata uang terlemah (peringkat #8). Misalnya USD kuat (+10) vs CHF lemah (-10) menghasilkan setup Strong Buy USDCHF.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-amber-400 block font-mono">2. Deteksi Divergensi & Extreme Stretch</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Jika divergensi melebihi 18-20 poin, waspadai potensi profit-taking atau konsolidasi saat menyentuh level support/resistance kunci.
            </p>
          </div>

          <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-1">
            <span className="font-bold text-sky-400 block font-mono">3. Multi-Asset Macro Synergy</span>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Gabungkan sinyal CSM dengan sentimen berita terkini dan rilis ekonomi kalender untuk menyaring false breakouts.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
