import React from 'react';
import { Newspaper, ExternalLink, Clock, Sparkles, Coins, TrendingUp, ArrowLeftRight } from 'lucide-react';
import type { NewsItem, NewsImpact } from '../types.ts';
import { resolveCategory } from '../views/NewsView.tsx';

interface TopNewsCardProps {
  news: NewsItem[];
  onViewAllNews?: () => void;
}

export const TopNewsCard: React.FC<TopNewsCardProps> = ({ news, onViewAllNews }) => {
  const getImpactBadge = (impact: NewsImpact) => {
    switch (impact) {
      case 'HIGH':
        return 'bg-rose-950/80 text-rose-300 border-rose-500/50';
      case 'MEDIUM':
        return 'bg-amber-950/80 text-amber-300 border-amber-500/50';
      default:
        return 'bg-slate-800 text-slate-300 border-slate-700';
    }
  };

  const getCategoryBadge = (cat: 'Crypto' | 'Indices' | 'Forex') => {
    switch (cat) {
      case 'Crypto':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-amber-500/15 text-amber-300 border border-amber-500/30 flex items-center gap-1 shrink-0">
            <Coins className="h-2 w-2 text-amber-400" />
            CRYPTO
          </span>
        );
      case 'Indices':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-indigo-500/15 text-indigo-300 border border-indigo-500/30 flex items-center gap-1 shrink-0">
            <TrendingUp className="h-2 w-2 text-indigo-400" />
            INDICES
          </span>
        );
      case 'Forex':
        return (
          <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 flex items-center gap-1 shrink-0">
            <ArrowLeftRight className="h-2 w-2 text-emerald-400" />
            FOREX
          </span>
        );
    }
  };

  // Prioritize today's news in WIB
  const todayItems = news.filter((n) => n.isToday);
  const otherItems = news.filter((n) => !n.isToday);
  // Display top 6 freshest news items (today's news first)
  const displayItems = [...todayItems, ...otherItems].slice(0, 6);

  return (
    <div id="section-top-news" className="space-y-3">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Newspaper className="h-4 w-4 text-emerald-400" />
          <h2 className="text-xs font-bold font-mono tracking-wider text-slate-300 uppercase">
            TOP NEWS HARI INI
          </h2>
          <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-950/70 border border-emerald-500/30 text-emerald-300 font-mono flex items-center gap-1.5">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
            Terbaru • WIB (UTC+7)
          </span>
          {todayItems.length > 0 && (
            <span className="text-[10px] px-2 py-0.5 rounded bg-blue-950/70 border border-blue-500/30 text-blue-300 font-mono hidden sm:inline-flex items-center gap-1">
              <Sparkles className="h-2.5 w-2.5" />
              {todayItems.length} Berita Hari Ini
            </span>
          )}
        </div>

        {onViewAllNews && (
          <button
            onClick={onViewAllNews}
            className="text-xs text-emerald-400 hover:text-emerald-300 font-mono transition-colors flex items-center gap-1"
          >
            Lihat Semua Berita ({news.length}) →
          </button>
        )}
      </div>

      {/* News Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {displayItems.map((item) => {
          return (
            <div
              key={item.id}
              id={`news-card-${item.id}`}
              className={`p-3.5 rounded-xl border flex flex-col justify-between hover:border-slate-700 transition-all group ${
                item.isToday
                  ? 'border-slate-800 bg-[#0c121e]'
                  : 'border-slate-800/70 bg-[#0a0f19]'
              }`}
            >
              <div>
                {/* Top Meta: Source, Category, Time WIB, Impact */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded bg-slate-800 text-slate-300 truncate">
                      {item.source}
                    </span>
                    {getCategoryBadge(resolveCategory(item))}
                    {item.isToday && (
                      <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 shrink-0">
                        HARI INI
                      </span>
                    )}
                    <span className="text-[10px] font-mono text-slate-400 flex items-center gap-1 shrink-0">
                      <Clock className="h-2.5 w-2.5 text-slate-500" />
                      {item.timeWib || item.time}
                    </span>
                  </div>

                  <span
                    className={`text-[9px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase shrink-0 ${getImpactBadge(
                      item.impact,
                    )}`}
                  >
                    {item.impact}
                  </span>
                </div>

                {/* Headline */}
                <h3 className="text-xs font-bold text-white group-hover:text-emerald-300 transition-colors line-clamp-2 leading-snug">
                  {item.headline}
                </h3>

                {/* Penjelasan Singkat */}
                <p className="text-[11px] text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {item.summary}
                </p>
              </div>

              {/* Bottom: Affected Assets & Link */}
              <div className="mt-3 pt-2.5 border-t border-slate-800/80 flex items-center justify-between gap-2">
                <div className="flex flex-wrap items-center gap-1">
                  <span className="text-[10px] text-slate-500 font-mono">ASET:</span>
                  {item.affectedAssets.length > 0 ? (
                    item.affectedAssets.slice(0, 3).map((asset) => (
                      <span
                        key={asset}
                        className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-semibold"
                      >
                        {asset}
                      </span>
                    ))
                  ) : (
                    <span className="text-[9px] font-mono text-slate-500">Macro/General</span>
                  )}
                </div>

                {item.sourceUrl && (
                  <a
                    href={item.sourceUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-slate-500 hover:text-slate-300 transition-colors p-1"
                    title="Buka sumber asli"
                  >
                    <ExternalLink className="h-3 w-3" />
                  </a>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
