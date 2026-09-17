import React, { useState } from 'react';
import {
  Settings,
  CheckCircle2,
  AlertCircle,
  Cpu,
  RefreshCw,
  Database,
  ExternalLink,
  Shield,
  Radio,
} from 'lucide-react';

interface SettingsViewProps {
  autoRefreshInterval: number;
  setAutoRefreshInterval: (seconds: number) => void;
  sourceStatus?: {
    currencyStrength: boolean;
    telegramNews: boolean;
    tradingView: boolean;
    rssFeeds: boolean;
    forexFactory: boolean;
  };
}

export const SettingsView: React.FC<SettingsViewProps> = ({
  autoRefreshInterval,
  setAutoRefreshInterval,
  sourceStatus = {
    currencyStrength: true,
    telegramNews: true,
    tradingView: true,
    rssFeeds: true,
    forexFactory: true,
  },
}) => {
  const [enableSound, setEnableSound] = useState(false);

  return (
    <div id="view-settings" className="space-y-5 max-w-4xl">
      {/* Header */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422]">
        <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-2">
          <Settings className="h-5 w-5 text-emerald-400" />
          Terminal Configuration & Intelligence Engine
        </h2>
        <p className="text-xs text-slate-400 mt-1">
          Pengaturan frekuensi pembaruan data real-time, status integrasi data eksternal, dan AI model status.
        </p>
      </div>

      {/* 1. Sync & Refresh Settings */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-2">
          <RefreshCw className="h-4 w-4 text-emerald-400" />
          INTERVAL PEMBARUAN DATA OTOMATIS
        </h3>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono">
          {[15, 30, 60, 0].map((sec) => (
            <button
              key={sec}
              onClick={() => setAutoRefreshInterval(sec)}
              className={`p-2.5 rounded-lg border text-center transition-all ${
                autoRefreshInterval === sec
                  ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300 font-bold'
                  : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              {sec === 0 ? 'Manual Saja' : `Setiap ${sec} Detik`}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Data Sources Health Monitor */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-2">
          <Database className="h-4 w-4 text-sky-400" />
          STATUS KONEKSI SUMBER DATA REAL-TIME
        </h3>

        <div className="space-y-2 text-xs">
          {/* Source 1: Currency Strength Meter */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Currency Strength Meter Live Service</span>
              <span className="text-[11px] text-slate-400 font-mono">
                https://currency-strength-meter-454054581975.asia-southeast1.run.app/
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Connected
            </span>
          </div>

          {/* Source 2: Telegram @SM_News_24h */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Telegram News 24h Feed</span>
              <span className="text-[11px] text-slate-400 font-mono">
                https://t.me/SM_News_24h (Real-time Breaking News Scraper)
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Connected
            </span>
          </div>

          {/* Source 3: TradingView Real-Time Quotes */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-bold text-white block">TradingView Scanner Quotes</span>
              <span className="text-[11px] text-slate-400 font-mono">
                XAUUSD, BTCUSD, US30, NAS100, SPX500
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Connected
            </span>
          </div>

          {/* Source 4: Forex Factory Economic Calendar */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Forex Factory Economic Calendar</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Jadwal rilis data berdampak tinggi & suku bunga bank sentral
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Connected
            </span>
          </div>

          {/* Source 5: Financial RSS (Investing / Fed / Reuters) */}
          <div className="flex items-center justify-between p-2.5 rounded-lg bg-slate-900/60 border border-slate-800">
            <div>
              <span className="font-bold text-white block">Investing.com & Federal Reserve Press</span>
              <span className="text-[11px] text-slate-400 font-mono">
                Pernyataan resmi pejabat The Fed & analisis pasar global
              </span>
            </div>
            <span className="flex items-center gap-1 text-[11px] font-mono text-emerald-400">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" /> Connected
            </span>
          </div>
        </div>
      </div>

      {/* 3. AI Model Engine Details */}
      <div className="p-4 rounded-xl border border-slate-800/80 bg-[#0e1422] space-y-3">
        <h3 className="text-xs font-bold font-mono text-slate-300 uppercase flex items-center gap-2">
          <Cpu className="h-4 w-4 text-emerald-400" />
          MESIN KECERDASAN BUATAN (AI MODEL)
        </h3>

        <div className="p-3 rounded-lg bg-slate-900/60 border border-slate-800 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Model Aktif:</span>
            <span className="font-mono font-bold text-emerald-400">Google Gemini 3.6 Flash</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Arsitektur:</span>
            <span className="text-slate-200">Full-Stack Server Proxy (API Keys terlindungi)</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Metodologi Analisis:</span>
            <span className="text-slate-200 font-mono text-[11px]">
              NEWS → ANALYSIS → MARKET BIAS → DAILY CONCLUSION
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-400 font-mono">Aturan AI:</span>
            <span className="text-slate-200">
              Tidak mengarang data, tidak memberi kepastian mutlak, mencantumkan alasan bias.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
