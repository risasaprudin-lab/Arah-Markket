import React, { useEffect, useState } from 'react';
import { RefreshCw, Radio, ExternalLink, Clock, Globe } from 'lucide-react';
import type { TabType } from './Sidebar.tsx';

interface HeaderProps {
  currentTab: TabType;
  lastUpdated: string;
  isRefreshing: boolean;
  onRefresh: () => void;
  sourceStatus?: {
    currencyStrength: boolean;
    telegramNews: boolean;
    tradingView: boolean;
  };
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  lastUpdated,
  isRefreshing,
  onRefresh,
  sourceStatus = { currencyStrength: true, telegramNews: true, tradingView: true },
}) => {
  const [timeUtc, setTimeUtc] = useState('');
  const [timeWib, setTimeWib] = useState('');

  // Clock updater
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setTimeUtc(
        now.toLocaleTimeString('en-US', {
          timeZone: 'UTC',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' UTC',
      );
      setTimeWib(
        now.toLocaleTimeString('id-ID', {
          timeZone: 'Asia/Jakarta',
          hour12: false,
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        }) + ' WIB',
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Determine active forex market sessions based on UTC hour
  const getActiveSessions = () => {
    const utcHour = new Date().getUTCHours();
    return {
      tokyo: utcHour >= 0 && utcHour < 9,
      london: utcHour >= 7 && utcHour < 16,
      newYork: utcHour >= 12 && utcHour < 21,
      sydney: (utcHour >= 21 && utcHour <= 23) || (utcHour >= 0 && utcHour < 6),
    };
  };

  const sessions = getActiveSessions();

  return (
    <header
      id="terminal-header"
      className="h-16 border-b border-slate-800/80 bg-[#0b0f19]/90 backdrop-blur px-4 md:px-6 flex items-center justify-between z-20 shrink-0 select-none"
    >
      {/* Current View Title */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400 uppercase tracking-wider hidden sm:inline">TERMINAL /</span>
          <h1 className="text-sm md:text-base font-bold text-white tracking-tight">{currentTab}</h1>
        </div>

        {/* Live sync pill */}
        <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-950/50 border border-emerald-500/30 text-[11px] font-mono text-emerald-400">
          <Radio className="h-3 w-3 animate-pulse" />
          <span>REAL-TIME STREAM</span>
        </div>
      </div>

      {/* Center: Market Sessions & Clock */}
      <div className="hidden xl:flex items-center gap-4 text-xs font-mono">
        {/* Sessions indicator */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800">
          <Globe className="h-3.5 w-3.5 text-slate-400" />
          <span className="text-slate-500 text-[11px]">SESSIONS:</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${sessions.tokyo ? 'text-emerald-400 bg-emerald-950/60 font-semibold' : 'text-slate-500'}`}>TYO</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${sessions.london ? 'text-emerald-400 bg-emerald-950/60 font-semibold' : 'text-slate-500'}`}>LDN</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${sessions.newYork ? 'text-emerald-400 bg-emerald-950/60 font-semibold' : 'text-slate-500'}`}>NYC</span>
          <span className={`text-[11px] px-1.5 py-0.5 rounded ${sessions.sydney ? 'text-emerald-400 bg-emerald-950/60 font-semibold' : 'text-slate-500'}`}>SYD</span>
        </div>

        {/* Clock */}
        <div className="flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-900/80 border border-slate-800 text-slate-300">
          <Clock className="h-3.5 w-3.5 text-sky-400" />
          <span className="text-white font-semibold">{timeWib}</span>
          <span className="text-slate-500 text-[10px]">({timeUtc})</span>
        </div>
      </div>

      {/* Right Actions: Data Sources Status & Refresh Button */}
      <div className="flex items-center gap-2 md:gap-3">
        {/* Official Source link */}
        <a
          href="https://currency-strength-meter-454054581975.asia-southeast1.run.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="hidden sm:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border border-slate-800 hover:border-slate-700 bg-slate-900/60 hover:bg-slate-800/60 text-slate-300 text-xs transition-colors"
          title="Buka sumber resmi Currency Strength Meter"
        >
          <span className="font-mono text-[11px]">Source CSM</span>
          <ExternalLink className="h-3 w-3 text-slate-400" />
        </a>

        {/* Refresh Button */}
        <button
          id="btn-refresh-data"
          onClick={onRefresh}
          disabled={isRefreshing}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/20 hover:bg-emerald-500/30 text-emerald-300 border border-emerald-500/40 text-xs font-semibold shadow-sm transition-all disabled:opacity-50"
        >
          <RefreshCw className={`h-3.5 w-3.5 ${isRefreshing ? 'animate-spin text-emerald-400' : ''}`} />
          <span className="hidden sm:inline">{isRefreshing ? 'Syncing...' : 'Sync Data'}</span>
        </button>
      </div>
    </header>
  );
};
