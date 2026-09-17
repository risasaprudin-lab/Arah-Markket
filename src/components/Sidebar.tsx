import React from 'react';
import {
  LayoutDashboard,
  Newspaper,
  Compass,
  Coins,
  Bitcoin,
  TrendingUp,
  ArrowLeftRight,
  Gauge,
  Settings,
  Activity,
  ChevronLeft,
  ChevronRight,
  Zap,
} from 'lucide-react';

export type TabType =
  | 'Dashboard'
  | 'News'
  | 'Market Outlook'
  | 'XAUUSD'
  | 'Bitcoin'
  | 'US Indices'
  | 'Forex'
  | 'Currency Strength'
  | 'Settings';

interface SidebarProps {
  currentTab: TabType;
  onSelectTab: (tab: TabType) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  strongestCurrency?: string;
  weakestCurrency?: string;
}

const navItems: { id: TabType; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'Dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'News', label: 'News', icon: Newspaper, badge: 'Live' },
  { id: 'Market Outlook', label: 'Market Outlook', icon: Compass },
  { id: 'XAUUSD', label: 'XAUUSD', icon: Coins, badge: 'Gold' },
  { id: 'Bitcoin', label: 'Bitcoin', icon: Bitcoin, badge: 'Crypto' },
  { id: 'US Indices', label: 'US Indices', icon: TrendingUp, badge: 'Wall St' },
  { id: 'Forex', label: 'Forex', icon: ArrowLeftRight, badge: '8 Majors' },
  { id: 'Currency Strength', label: 'Currency Strength', icon: Gauge, badge: 'CSM' },
  { id: 'Settings', label: 'Settings', icon: Settings },
];

export const Sidebar: React.FC<SidebarProps> = ({
  currentTab,
  onSelectTab,
  collapsed,
  onToggleCollapse,
  strongestCurrency = 'USD',
  weakestCurrency = 'CHF',
}) => {
  return (
    <aside
      id="sidebar-container"
      className={`relative flex flex-col border-r border-slate-800/80 bg-[#0b0f19] transition-all duration-300 z-30 shrink-0 select-none ${
        collapsed ? 'w-18' : 'w-64'
      }`}
    >
      {/* Brand Header */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-slate-800/80">
        <div className="flex items-center gap-3 overflow-hidden">
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500/20 via-sky-500/20 to-blue-600/30 border border-emerald-500/40 text-emerald-400 font-bold shadow-sm shadow-emerald-950">
            <Zap className="h-5 w-5 text-emerald-400" />
          </div>
          {!collapsed && (
            <div className="flex flex-col truncate">
              <span className="font-bold text-sm tracking-tight text-white flex items-center gap-1.5">
                AI Market <span className="text-emerald-400 font-extrabold">Intel</span>
              </span>
              <span className="text-[10px] text-slate-400 font-mono flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse inline-block"></span>
                PRO TERMINAL
              </span>
            </div>
          )}
        </div>

        <button
          id="btn-toggle-sidebar"
          onClick={onToggleCollapse}
          className="hidden md:flex h-7 w-7 items-center justify-center rounded-md border border-slate-800 text-slate-400 hover:text-white hover:bg-slate-800/60 transition-colors"
          title={collapsed ? 'Perluas Sidebar' : 'Ciutkan Sidebar'}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      {/* Navigation items */}
      <div className="flex-1 overflow-y-auto py-3 px-2 space-y-1">
        {!collapsed && (
          <div className="px-3 py-1.5 text-[10px] font-semibold text-slate-500 uppercase tracking-wider">
            Terminal Views
          </div>
        )}

        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentTab === item.id;
          return (
            <button
              key={item.id}
              id={`nav-item-${item.id.toLowerCase().replace(/\s+/g, '-')}`}
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-xs font-medium transition-all ${
                isActive
                  ? 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 shadow-sm shadow-emerald-950/50'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
              }`}
              title={collapsed ? item.label : undefined}
            >
              <Icon className={`h-4 w-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
              {!collapsed && (
                <div className="flex flex-1 items-center justify-between truncate">
                  <span className="truncate">{item.label}</span>
                  {item.badge && (
                    <span
                      className={`text-[9px] px-1.5 py-0.5 rounded border font-mono ${
                        isActive
                          ? 'border-emerald-500/40 bg-emerald-500/20 text-emerald-300'
                          : 'border-slate-800 bg-slate-900/60 text-slate-400'
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </div>
              )}
            </button>
          );
        })}
      </div>

      {/* Quick Market Pulse Footer (when expanded) */}
      {!collapsed && (
        <div className="p-3 m-2 rounded-xl border border-slate-800/80 bg-slate-900/50 text-[11px] space-y-2">
          <div className="flex items-center justify-between text-slate-400 text-[10px]">
            <span className="flex items-center gap-1 font-semibold uppercase tracking-wider">
              <Activity className="h-3 w-3 text-emerald-400" /> CSM Momentum
            </span>
            <span className="font-mono text-emerald-400">Live</span>
          </div>

          <div className="grid grid-cols-2 gap-1.5 font-mono text-[10px]">
            <div className="flex flex-col p-1.5 rounded bg-slate-950/70 border border-emerald-900/40">
              <span className="text-slate-500 text-[9px]">LEADER</span>
              <span className="font-bold text-emerald-400">{strongestCurrency} +10.0</span>
            </div>
            <div className="flex flex-col p-1.5 rounded bg-slate-950/70 border border-rose-900/40">
              <span className="text-slate-500 text-[9px]">LAGGARD</span>
              <span className="font-bold text-rose-400">{weakestCurrency} -10.0</span>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
};
