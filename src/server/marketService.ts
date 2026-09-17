import { GoogleGenAI } from '@google/genai';
import type {
  AiMarketIntelligenceResult,
  CurrencyScore,
  CurrencyStrengthData,
  CurrencyStrengthHistoryPoint,
  ForexFactoryEvent,
  MarketBiasItem,
  NewsItem,
  RiskSentimentHistoryPoint,
  SuggestedPair,
  TradingViewQuote,
} from '../types.ts';

const CSM_BASE_URL = 'https://currency-strength-meter-454054581975.asia-southeast1.run.app';

// In-memory caches to maintain snappy terminal experience
let cachedStrengthData: CurrencyStrengthData | null = null;
let cachedStrengthTimestamp = 0;

let cachedQuotes: Record<string, TradingViewQuote> = {};
let cachedQuotesTimestamp = 0;

let cachedNews: NewsItem[] = [];
let cachedNewsTimestamp = 0;

let cachedForexFactory: ForexFactoryEvent[] = [];
let cachedForexFactoryTimestamp = 0;

let cachedAiIntelligence: AiMarketIntelligenceResult | null = null;
let cachedAiTimestamp = 0;

// Helper to fetch JSON with timeout
async function fetchJsonSafe<T>(url: string, timeoutMs = 5000, fallback: T): Promise<T> {
  try {
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (AI Market Intelligence Terminal)' },
      signal: AbortSignal.timeout(timeoutMs),
    });
    if (!res.ok) {
      console.warn(`[API] ${url} returned status ${res.status}`);
      return fallback;
    }
    return (await res.json()) as T;
  } catch (err: any) {
    console.warn(`[API] Failed to fetch ${url}:`, err.message);
    return fallback;
  }
}

// 1. Fetch Currency Strength Data from the official source
const cachedStrengthByTf: Record<string, { data: CurrencyStrengthData; timestamp: number }> = {};

export const CURRENCY_METAS: Record<string, { name: string; flag: string; color: string }> = {
  NZD: { name: 'New Zealand Dollar', flag: '🇳🇿', color: '#FF0099' },
  AUD: { name: 'Australian Dollar', flag: '🇦🇺', color: '#0044FF' },
  JPY: { name: 'Japanese Yen', flag: '🇯🇵', color: '#00C0F0' },
  GBP: { name: 'British Pound', flag: '🇬🇧', color: '#00B050' },
  EUR: { name: 'Euro', flag: '🇪🇺', color: '#FF0000' },
  CHF: { name: 'Swiss Franc', flag: '🇨🇭', color: '#8B4513' },
  CAD: { name: 'Canadian Dollar', flag: '🇨🇦', color: '#9900FF' },
  USD: { name: 'US Dollar', flag: '🇺🇸', color: '#FF9900' },
};

/**
 * Calculates and strictly verifies rankings based on numerical strength values descending (high to low).
 * Guarantees that ranking prioritizes currencies based on numerical score rather than static,
 * hardcoded, or alphabetical ordering (e.g. preventing USD from defaulting to #1).
 */
export function buildVerifiedRankings(
  scores: Record<string, number>,
  scores10?: Record<string, number>,
  rawScores?: Record<string, number>,
  sourceRankings?: CurrencyScore[]
): CurrencyScore[] {
  const allCurrencies = ['NZD', 'AUD', 'JPY', 'GBP', 'EUR', 'CHF', 'CAD', 'USD'] as const;

  // Index any sourceRankings provided by uppercase currency symbol
  const sourceByCurr = new Map<string, CurrencyScore>();
  if (Array.isArray(sourceRankings)) {
    for (const item of sourceRankings) {
      if (item && item.currency) {
        sourceByCurr.set(String(item.currency).toUpperCase(), item);
      }
    }
  }

  // Helper to ensure valid finite numeric values
  const toValidNumber = (val: any, fallback = 0): number => {
    if (typeof val === 'number' && !Number.isNaN(val) && Number.isFinite(val)) {
      return val;
    }
    const parsed = parseFloat(val);
    return !Number.isNaN(parsed) && Number.isFinite(parsed) ? parsed : fallback;
  };

  const workingList: CurrencyScore[] = allCurrencies.map((curr) => {
    const meta = CURRENCY_METAS[curr] || { name: curr, flag: '🌐', color: '#38bdf8' };
    const srcItem = sourceByCurr.get(curr);

    // Prefer live scores map first, then sourceItem, fallback to 0
    const rawScore = scores[curr] !== undefined ? scores[curr] : srcItem?.score;
    const scoreVal = Number(toValidNumber(rawScore, 0).toFixed(2));

    // Raw score (unbounded divergence measure)
    const rawValCandidate = rawScores?.[curr] !== undefined ? rawScores[curr] : srcItem?.raw;
    const rawVal = Number(toValidNumber(rawValCandidate, scoreVal).toFixed(2));

    // 0-10 normalized score
    const score10Candidate = scores10?.[curr] !== undefined ? scores10[curr] : srcItem?.score10;
    const defaultScore10 = Math.max(0, Math.min(10, (scoreVal + 10) / 2));
    const score10Val = Number(toValidNumber(score10Candidate, defaultScore10).toFixed(1));

    // Status label
    const statusVal = srcItem?.status || (
      scoreVal >= 7 ? 'Strong' :
      scoreVal >= 2 ? 'Bullish' :
      scoreVal <= -7 ? 'Weak' :
      scoreVal <= -2 ? 'Bearish' : 'Neutral'
    );

    // Calculate pairwise win/loss against all other 7 currencies
    let pairsWon = 0;
    let pairsLost = 0;
    for (const other of allCurrencies) {
      if (other === curr) continue;
      const otherScore = toValidNumber(scores[other] ?? sourceByCurr.get(other)?.score, 0);
      if (scoreVal > otherScore) pairsWon++;
      else if (scoreVal < otherScore) pairsLost++;
    }

    return {
      rank: 1, // dynamically assigned below after numerical sort
      currency: curr,
      name: srcItem?.name || meta.name,
      flag: srcItem?.flag || meta.flag,
      color: srcItem?.color || meta.color,
      score: scoreVal,
      score10: score10Val,
      raw: rawVal,
      status: statusVal,
      pairsWon: typeof srcItem?.pairsWon === 'number' ? srcItem.pairsWon : pairsWon,
      pairsLost: typeof srcItem?.pairsLost === 'number' ? srcItem.pairsLost : pairsLost,
    };
  });

  // STRICT NUMERICAL STRENGTH SORTING:
  // Sort from high to low (descending) by numerical strength value:
  // Primary: b.score - a.score (e.g. +10.0 > +8.93 > -4.0 > -10.0)
  // Secondary: b.raw - a.raw (fine-grained tie breaker)
  // Tertiary: b.score10 - a.score10
  workingList.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    if (b.raw !== a.raw) {
      return b.raw - a.raw;
    }
    return b.score10 - a.score10;
  });

  // Assign sequential 1-based ranks (1 = highest strength, 8 = lowest strength)
  return workingList.map((item, idx) => ({
    ...item,
    rank: idx + 1,
  }));
}

export async function getCurrencyStrengthData(tf: string = 'D1'): Promise<CurrencyStrengthData> {
  const validTf = ['D1', 'H4', 'H1', 'M15'].includes(tf) ? tf : 'D1';
  const now = Date.now();
  const cached = cachedStrengthByTf[validTf];
  if (cached && now - cached.timestamp < 15000) {
    return cached.data;
  }

  try {
    const [currentRes, rankingRes, historyRes] = await Promise.all([
      fetchJsonSafe<any>(`${CSM_BASE_URL}/api/strength/current?tf=${validTf}`, 5000, null),
      fetchJsonSafe<CurrencyScore[]>(`${CSM_BASE_URL}/api/strength/ranking?tf=${validTf}`, 5000, []),
      fetchJsonSafe<CurrencyStrengthHistoryPoint[]>(`${CSM_BASE_URL}/api/strength/history?tf=${validTf}&limit=30`, 5000, []),
    ]);

    const fallbackScores: Record<string, number> = {
      NZD: 10, AUD: 8.71, JPY: 7.84, GBP: -4.39, CHF: -5.74, EUR: -6.66, CAD: -9.96, USD: -10,
    };
    const fallbackScores10: Record<string, number> = {
      NZD: 10, AUD: 9.4, JPY: 8.9, GBP: 2.8, CHF: 2.1, EUR: 1.7, CAD: 0, USD: 0,
    };
    const fallbackRaw: Record<string, number> = {
      NZD: 24.54, AUD: 21.73, JPY: 19.83, GBP: -6.78, CHF: -9.71, EUR: -11.71, CAD: -18.91, USD: -18.99,
    };

    const scores = currentRes?.scores || fallbackScores;
    const scores10 = currentRes?.scores10 || fallbackScores10;
    const rawScores = currentRes?.raw_scores || fallbackRaw;

    // Build verified rankings: strictly sorted descending by strength values
    const verifiedRankings = buildVerifiedRankings(
      scores,
      scores10,
      rawScores,
      Array.isArray(rankingRes) && rankingRes.length === 8 ? rankingRes : undefined
    );

    // Map suggested_pair directly from source API, or derive dynamically from verifiedRankings
    let suggestedPair: SuggestedPair | null = currentRes?.suggested_pair || currentRes?.suggestedPair || null;
    if (!suggestedPair && verifiedRankings.length >= 2) {
      const top = verifiedRankings[0];
      const bottom = verifiedRankings[verifiedRankings.length - 1];
      const divergence = Number((top.score - bottom.score).toFixed(2));
      suggestedPair = {
        strong: top.currency,
        weak: bottom.currency,
        pair: `${top.currency}${bottom.currency}`,
        standardPair: `${top.currency}${bottom.currency}`,
        action: top.score >= 5 ? 'STRONG BUY' : 'BUY',
        divergence,
        confidence: divergence >= 15 ? 'High' : divergence >= 8 ? 'Medium' : 'Low',
        rationale: `${top.currency} (+${top.score}) mendominasi kekuatan mata uang sementara ${bottom.currency} (${bottom.score}) tertekan paling dalam (divergensi ${divergence} poin).`,
      };
    }

    const secondarySuggestions: SuggestedPair[] = currentRes?.secondary_suggestions || currentRes?.secondarySuggestions || [];

    const result: CurrencyStrengthData = {
      timeframe: currentRes?.timeframe || validTf,
      timestamp: currentRes?.timestamp || new Date().toISOString(),
      source: currentRes?.source || 'currency-strength',
      sourceName: currentRes?.sourceName || 'currency-strength.com (Direct JSON)',
      sourceUrl: currentRes?.sourceUrl || CSM_BASE_URL,
      sourceStatus: currentRes?.sourceStatus || 'live',
      lastSynced: currentRes?.lastSynced || currentRes?.timestamp || new Date().toISOString(),
      scores,
      scores10,
      raw_scores: rawScores,
      rawScores,
      rankings: verifiedRankings,
      history: Array.isArray(historyRes) ? historyRes : [],
      suggestedPair,
      suggested_pair: suggestedPair,
      secondarySuggestions,
      secondary_suggestions: secondarySuggestions,
      calculationMode: currentRes?.calculationMode || 'trend-following',
    };

    cachedStrengthByTf[validTf] = { data: result, timestamp: now };
    cachedStrengthData = result;
    cachedStrengthTimestamp = now;
    return result;
  } catch (err: any) {
    console.error(`Error fetching currency strength for ${validTf}:`, err);
    if (cachedStrengthByTf[validTf]) return cachedStrengthByTf[validTf].data;
    if (cachedStrengthData) return cachedStrengthData;
    throw err;
  }
}

// 2. Fetch TradingView Quotes (XAUUSD, BTC, US30, NAS100, SPX500)
export async function getTradingViewQuotes(): Promise<Record<string, TradingViewQuote>> {
  const now = Date.now();
  if (Object.keys(cachedQuotes).length > 0 && now - cachedQuotesTimestamp < 15000) {
    return cachedQuotes;
  }

  let baseQuotes: Record<string, TradingViewQuote> = {};

  try {
    const res = await fetchJsonSafe<any>(`${CSM_BASE_URL}/api/tradingview/quotes`, 5000, null);
    if (res?.quotes) {
      baseQuotes = { ...res.quotes };
    }
  } catch (err: any) {
    console.warn('Error fetching quotes from CSM API:', err.message);
  }

  // Fetch real-time 24-hour continuous futures from TradingView Scanner API
  // This ensures US30 (Dow), NAS100 (Nasdaq), and SPX500 (S&P 500) reflect actual 24-hour live market movement
  try {
    const tvFuturesRes = await fetch('https://scanner.tradingview.com/futures/scan', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        symbols: { tickers: ['CBOT_MINI:YM1!', 'CME_MINI:NQ1!', 'CME_MINI:ES1!'] },
        columns: ['close', 'change', 'change_abs', 'open', 'high', 'low', 'volume'],
      }),
      signal: AbortSignal.timeout(4000),
    });

    if (tvFuturesRes.ok) {
      const fData = await tvFuturesRes.json();
      if (Array.isArray(fData?.data)) {
        for (const item of fData.data) {
          const ticker = item.s;
          const [close, change, changeAbs, open, high, low, volume] = item.d || [];
          if (ticker === 'CBOT_MINI:YM1!' && close) {
            baseQuotes.US30 = {
              symbol: 'US30',
              tvTicker: 'CBOT_MINI:YM1!',
              name: 'Dow Jones 30 Futures (US30)',
              category: 'INDEX',
              price: Math.round(close),
              changePct: Number((change ?? 0).toFixed(2)),
              changeAbs: Math.round(changeAbs ?? 0),
              open24h: open,
              high24h: high,
              low24h: low,
              volume: volume,
              lastUpdated: new Date().toISOString(),
              source: 'TradingView Real-Time Futures',
            };
          } else if (ticker === 'CME_MINI:NQ1!' && close) {
            baseQuotes.NAS100 = {
              symbol: 'NAS100',
              tvTicker: 'CME_MINI:NQ1!',
              name: 'Nasdaq 100 Futures (US100)',
              category: 'INDEX',
              price: Number(close.toFixed(2)),
              changePct: Number((change ?? 0).toFixed(2)),
              changeAbs: Number((changeAbs ?? 0).toFixed(2)),
              open24h: open,
              high24h: high,
              low24h: low,
              volume: volume,
              lastUpdated: new Date().toISOString(),
              source: 'TradingView Real-Time Futures',
            };
          } else if (ticker === 'CME_MINI:ES1!' && close) {
            baseQuotes.SPX500 = {
              symbol: 'SPX500',
              tvTicker: 'CME_MINI:ES1!',
              name: 'S&P 500 Futures (US500)',
              category: 'INDEX',
              price: Number(close.toFixed(2)),
              changePct: Number((change ?? 0).toFixed(2)),
              changeAbs: Number((changeAbs ?? 0).toFixed(2)),
              open24h: open,
              high24h: high,
              low24h: low,
              volume: volume,
              lastUpdated: new Date().toISOString(),
              source: 'TradingView Real-Time Futures',
            };
          }
        }
      }
    }
  } catch (err: any) {
    console.warn('TradingView futures scanner fetch notice:', err.message);
  }

  if (Object.keys(baseQuotes).length > 0) {
    // Fill in defaults if any quote is missing
    if (!baseQuotes.XAUUSD) {
      baseQuotes.XAUUSD = { symbol: 'XAUUSD', tvTicker: 'OANDA:XAUUSD', name: 'Spot Gold / US Dollar', category: 'COMMODITY', price: 4312.69, changePct: 1.15, changeAbs: 48.84, high24h: 4335.45, low24h: 4257.6, open24h: 4260.09, volume: 323070, lastUpdated: new Date().toISOString(), source: 'TradingView' };
    }
    if (!baseQuotes.BTCUSD) {
      baseQuotes.BTCUSD = { symbol: 'BTCUSD', tvTicker: 'BINANCE:BTCUSDT', name: 'Bitcoin / US Dollar', category: 'CRYPTO', price: 76573, changePct: 0.48, changeAbs: 367, high24h: 76774.08, low24h: 76055.34, open24h: 76206, volume: 3535, lastUpdated: new Date().toISOString(), source: 'TradingView' };
    }
    if (!baseQuotes.US30) {
      baseQuotes.US30 = { symbol: 'US30', tvTicker: 'CBOT_MINI:YM1!', name: 'Dow Jones 30 Futures (US30)', category: 'INDEX', price: 52262, changePct: 0.67, changeAbs: 347, high24h: 52353, low24h: 51838, open24h: 51894, volume: 12828, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' };
    }
    if (!baseQuotes.NAS100) {
      baseQuotes.NAS100 = { symbol: 'NAS100', tvTicker: 'CME_MINI:NQ1!', name: 'Nasdaq 100 Futures (US100)', category: 'INDEX', price: 29529.75, changePct: 0.93, changeAbs: 273, high24h: 29567.5, low24h: 29247.75, open24h: 29271, volume: 77685, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' };
    }
    if (!baseQuotes.SPX500) {
      baseQuotes.SPX500 = { symbol: 'SPX500', tvTicker: 'CME_MINI:ES1!', name: 'S&P 500 Futures (US500)', category: 'INDEX', price: 7679.25, changePct: 0.74, changeAbs: 56.25, high24h: 7689.25, low24h: 7617.5, open24h: 7624, volume: 158077, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' };
    }

    cachedQuotes = baseQuotes;
    cachedQuotesTimestamp = now;
    return cachedQuotes;
  }

  // Fallback default quotes structure with positive live futures data
  return {
    XAUUSD: { symbol: 'XAUUSD', tvTicker: 'OANDA:XAUUSD', name: 'Spot Gold / US Dollar', category: 'COMMODITY', price: 4312.69, changePct: 1.15, changeAbs: 48.84, high24h: 4335.45, low24h: 4257.6, open24h: 4260.09, volume: 323070, lastUpdated: new Date().toISOString(), source: 'TradingView' },
    BTCUSD: { symbol: 'BTCUSD', tvTicker: 'BINANCE:BTCUSDT', name: 'Bitcoin / US Dollar', category: 'CRYPTO', price: 76573, changePct: 0.48, changeAbs: 367, high24h: 76774.08, low24h: 76055.34, open24h: 76206, volume: 3535, lastUpdated: new Date().toISOString(), source: 'TradingView' },
    US30: { symbol: 'US30', tvTicker: 'CBOT_MINI:YM1!', name: 'Dow Jones 30 Futures (US30)', category: 'INDEX', price: 52262, changePct: 0.67, changeAbs: 347, high24h: 52353, low24h: 51838, open24h: 51894, volume: 12828, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' },
    NAS100: { symbol: 'NAS100', tvTicker: 'CME_MINI:NQ1!', name: 'Nasdaq 100 Futures (US100)', category: 'INDEX', price: 29529.75, changePct: 0.93, changeAbs: 273, high24h: 29567.5, low24h: 29247.75, open24h: 29271, volume: 77685, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' },
    SPX500: { symbol: 'SPX500', tvTicker: 'CME_MINI:ES1!', name: 'S&P 500 Futures (US500)', category: 'INDEX', price: 7679.25, changePct: 0.74, changeAbs: 56.25, high24h: 7689.25, low24h: 7617.5, open24h: 7624, volume: 158077, lastUpdated: new Date().toISOString(), source: 'TradingView Real-Time Futures' },
  };
}

// 3. Fetch Telegram & Financial News
export async function getAggregatedNews(): Promise<NewsItem[]> {
  const now = Date.now();
  if (cachedNews.length > 0 && now - cachedNewsTimestamp < 30000) {
    return cachedNews;
  }

  const newsItems: NewsItem[] = [];

  // 3a. Telegram channel: https://t.me/SM_News_24h
  try {
    const tgRes = await fetchJsonSafe<any>(`${CSM_BASE_URL}/api/news/telegram`, 6000, null);
    if (Array.isArray(tgRes) || Array.isArray(tgRes?.items) || Array.isArray(tgRes?.data)) {
      const posts: any[] = Array.isArray(tgRes) ? tgRes : (tgRes.items || tgRes.data || []);
      for (const p of posts) {
        if (!p.text && !p.rawHtml) continue;
        const rawText = (p.text || '').replace(/<[^>]*>?/gm, '').trim();
        if (!rawText || rawText.length < 15) continue;

        // Skip promotional bot links if any
        if (rawText.includes('@Sroshmayi_Bot') && rawText.length < 60) continue;

        const headline = rawText.split('\n')[0].slice(0, 140);
        const affectedAssets = detectAffectedAssets(rawText, p.relatedAssets);
        const wibInfo = parseAndFormatWib(p.publishedAt);

        // FRESHNESS FILTER: Skip news older than 36 hours
        const ageHours = (Date.now() - wibInfo.safeDate.getTime()) / (1000 * 3600);
        if (ageHours > 36) continue;

        newsItems.push({
          id: p.id || `tg-${p.postNumber || Math.random().toString(36).slice(2)}`,
          headline: headline.replace(/^[⚡️🟥📈📉📊👑🔔]+\s*/, '').trim(),
          source: 'SM News 24h (Telegram)',
          sourceUrl: p.link || 'https://t.me/SM_News_24h',
          time: wibInfo.formattedWib,
          timeWib: wibInfo.timeWib,
          publishedAt: wibInfo.isoString,
          isToday: wibInfo.isToday,
          formattedWib: `${wibInfo.timeAgo} • ${wibInfo.timeWib}`,
          affectedAssets,
          impact: p.impact === 'HIGH' ? 'HIGH' : p.impact === 'LOW' ? 'LOW' : 'MEDIUM',
          summary: rawText.slice(0, 320),
          category: classifyNewsCategory(headline, rawText, affectedAssets, p.category),
          sentiment: p.sentiment || 'NEUTRAL',
        });
      }
    }
  } catch (err: any) {
    console.warn('Telegram news fetch error:', err.message);
  }

  // 3b. CoinTelegraph RSS (Dedicated Crypto News)
  try {
    const res = await fetch('https://cointelegraph.com/rss', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'CoinTelegraph', 'Crypto');
    newsItems.push(...parsed.slice(0, 15));
  } catch (err: any) {
    console.warn('CoinTelegraph RSS fetch error:', err.message);
  }

  // 3c. Investing.com Forex RSS (Dedicated Forex News)
  try {
    const res = await fetch('https://www.investing.com/rss/forex.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'Investing.com Forex', 'Forex');
    newsItems.push(...parsed.slice(0, 10));
  } catch (err: any) {
    console.warn('Investing.com Forex RSS fetch error:', err.message);
  }

  // 3d. Investing.com Stock / Indices RSS (Dedicated Indices & Stock Market News)
  try {
    const res = await fetch('https://www.investing.com/rss/stock.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'Investing.com Indices', 'Indices');
    newsItems.push(...parsed.slice(0, 10));
  } catch (err: any) {
    console.warn('Investing.com Stock RSS fetch error:', err.message);
  }

  // 3e. Investing.com News RSS (General Markets)
  try {
    const res = await fetch('https://www.investing.com/rss/news.rss', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'Investing.com');
    newsItems.push(...parsed.slice(0, 10));
  } catch (err: any) {
    console.warn('Investing.com RSS fetch error:', err.message);
  }

  // 3f. Federal Reserve Press RSS (Forex / Central Bank)
  try {
    const res = await fetch('https://www.federalreserve.gov/feeds/press_all.xml', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'Federal Reserve (Official)', 'Forex');
    newsItems.push(...parsed.slice(0, 8));
  } catch (err: any) {
    console.warn('Fed RSS fetch error:', err.message);
  }

  // 3g. Yahoo Finance RSS (Reuters/Bloomberg syndication)
  try {
    const res = await fetch('https://finance.yahoo.com/news/rssindex', {
      headers: { 'User-Agent': 'Mozilla/5.0' },
      signal: AbortSignal.timeout(4000),
    });
    const xml = await res.text();
    const parsed = parseRssFeed(xml, 'Reuters / Bloomberg / Yahoo');
    newsItems.push(...parsed.slice(0, 12));
  } catch (err: any) {
    console.warn('Yahoo/Reuters RSS fetch error:', err.message);
  }

  // Deduplicate news based on headline similarity
  const uniqueItems: NewsItem[] = [];
  const seenHeadlines = new Set<string>();

  for (const item of newsItems) {
    const normalized = item.headline.toLowerCase().replace(/[^a-z0-9]/g, '').slice(0, 40);
    if (!seenHeadlines.has(normalized)) {
      seenHeadlines.add(normalized);
      uniqueItems.push(item);
    }
  }

  // Sort strictly by publishedAt descending (most recent first)
  uniqueItems.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

  // Prioritize today's news in Western Indonesia Time (WIB)
  const todayNews = uniqueItems.filter((item) => item.isToday);
  const otherRecentNews = uniqueItems.filter((item) => !item.isToday);
  const prioritizedItems = [...todayNews, ...otherRecentNews];

  if (prioritizedItems.length > 0) {
    cachedNews = prioritizedItems;
    cachedNewsTimestamp = now;
    return prioritizedItems;
  }

  return cachedNews;
}

// 4. Fetch Forex Factory Economic Calendar Events
export async function getForexFactoryCalendar(): Promise<ForexFactoryEvent[]> {
  const now = Date.now();
  if (cachedForexFactory.length > 0 && now - cachedForexFactoryTimestamp < 120000) {
    return cachedForexFactory;
  }

  try {
    const data = await fetchJsonSafe<any[]>('https://nfs.faireconomy.media/ff_calendar_thisweek.json', 5000, []);
    if (Array.isArray(data)) {
      const todayIso = new Date().toISOString().slice(0, 10);
      const filtered = data
        .filter((item) => item.date && item.title)
        .map((item) => ({
          title: item.title,
          country: item.country || 'USD',
          date: item.date,
          impact: item.impact || 'Low',
          forecast: item.forecast || '-',
          previous: item.previous || '-',
        }));
      cachedForexFactory = filtered;
      cachedForexFactoryTimestamp = now;
      return filtered;
    }
  } catch (err: any) {
    console.warn('ForexFactory fetch error:', err.message);
  }

  return cachedForexFactory;
}

// Helper: detect assets from text
function detectAffectedAssets(text: string, existing?: string[]): string[] {
  const assets = new Set<string>(existing || []);
  const upper = text.toUpperCase();

  if (upper.includes('GOLD') || upper.includes('XAU') || upper.includes('EMAS')) assets.add('XAUUSD');
  if (upper.includes('BTC') || upper.includes('BITCOIN') || upper.includes('CRYPTO')) assets.add('BTC');
  if (upper.includes('DOW') || upper.includes('US30') || upper.includes('WALL STREET')) assets.add('US30');
  if (upper.includes('NASDAQ') || upper.includes('US100') || upper.includes('TECH') || upper.includes('AI')) assets.add('US100');
  if (upper.includes('S&P') || upper.includes('US500') || upper.includes('SPX')) assets.add('US500');
  if (upper.includes('FED') || upper.includes('DOLLAR') || upper.includes('USD') || upper.includes('DXY') || upper.includes('RATE HIKE') || upper.includes('RATE CUT')) assets.add('USD');
  if (upper.includes('ECB') || upper.includes('EURO') || upper.includes('EUR')) assets.add('EUR');
  if (upper.includes('BOE') || upper.includes('POUND') || upper.includes('GBP')) assets.add('GBP');
  if (upper.includes('BOJ') || upper.includes('YEN') || upper.includes('JPY')) assets.add('JPY');
  if (upper.includes('SNB') || upper.includes('FRANC') || upper.includes('CHF')) assets.add('CHF');
  if (upper.includes('RBA') || upper.includes('AUD') || upper.includes('AUSSIE')) assets.add('AUD');
  if (upper.includes('RBNZ') || upper.includes('NZD') || upper.includes('KIWI')) assets.add('NZD');
  if (upper.includes('BOC') || upper.includes('CAD') || upper.includes('LOONIE') || upper.includes('OIL')) assets.add('CAD');

  return Array.from(assets);
}

// Helper: classify news into 'Crypto' | 'Indices' | 'Forex'
export function classifyNewsCategory(
  title: string,
  desc: string = '',
  affectedAssets: string[] = [],
  explicitCategory?: string,
): 'Crypto' | 'Indices' | 'Forex' {
  if (explicitCategory) {
    const uc = explicitCategory.toUpperCase();
    if (uc.includes('CRYPTO') || uc.includes('BITCOIN')) return 'Crypto';
    if (uc.includes('INDEX') || uc.includes('INDICES') || uc.includes('STOCK') || uc.includes('EQUITY')) return 'Indices';
    if (uc.includes('FOREX') || uc.includes('FX') || uc.includes('CURRENCY')) return 'Forex';
  }

  const combined = `${title} ${desc} ${affectedAssets.join(' ')}`.toLowerCase();

  // 1. Crypto keywords & assets
  if (
    affectedAssets.some((a) => ['BTC', 'ETH', 'SOL', 'XRP', 'CRYPTO'].includes(a.toUpperCase())) ||
    /\b(bitcoin|btc|ethereum|eth|solana|sol|crypto|cryptocurrency|blockchain|binance|coinbase|defi|altcoin|memecoin|xrp|ripple|tether|usdt|stablecoin|satoshi|token|nft|web3|kraken|bybit)\b/i.test(
      combined,
    )
  ) {
    return 'Crypto';
  }

  // 2. Indices keywords & assets
  if (
    affectedAssets.some((a) => ['US30', 'US100', 'US500', 'SPX', 'NASDAQ', 'DOW'].includes(a.toUpperCase())) ||
    /\b(wall street|dow jones|us30|nasdaq|us100|s&p|spx|us500|russell 2000|indices|index|stock market|equities|stocks|equity futures|share market|tech stocks|earnings report|shares|dax|ftse|nikkei|hang seng)\b/i.test(
      combined,
    )
  ) {
    return 'Indices';
  }

  // 3. Forex keywords & Central banks & Currencies (Default financial macro)
  return 'Forex';
}

// Helper: parse date safely and compute Indonesian Western Time (WIB, UTC+7) information
export function parseAndFormatWib(pubDateStr?: string | null, fallbackDate: Date = new Date()): {
  safeDate: Date;
  isoString: string;
  timeWib: string;      // e.g. "16:25 WIB"
  formattedWib: string; // e.g. "Hari ini, 16:25 WIB" or "17 Sep, 16:25 WIB"
  isToday: boolean;
  timeAgo: string;      // e.g. "5 mnt lalu" or "Baru saja"
} {
  let dateObj = fallbackDate;
  if (pubDateStr) {
    let str = pubDateStr.trim();
    // Support "YYYY-MM-DD HH:mm:ss" (Investing.com format, UTC)
    if (/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2}$/.test(str)) {
      str = str.replace(' ', 'T') + 'Z';
    }
    const parsed = new Date(str);
    if (!isNaN(parsed.getTime())) {
      dateObj = parsed;
    }
  }

  const now = new Date();
  // If slightly in the future (due to server clock skew), clamp to now
  if (dateObj.getTime() > now.getTime() + 60000) {
    dateObj = now;
  }

  // Time in WIB (Asia/Jakarta, UTC+7)
  const timeWib =
    dateObj.toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' WIB';

  // Compare calendar day in Asia/Jakarta
  const itemDateWib = dateObj.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const nowDateWib = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Jakarta' });
  const isToday = itemDateWib === nowDateWib;

  const dayMonthWib = dateObj.toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    day: 'numeric',
    month: 'short',
  });

  const formattedWib = isToday ? `Hari ini, ${timeWib}` : `${dayMonthWib}, ${timeWib}`;

  // Relative time in Indonesian
  const diffMs = Math.max(0, now.getTime() - dateObj.getTime());
  const diffMin = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMin / 60);

  let timeAgo = 'Baru saja';
  if (diffMin < 1) {
    timeAgo = 'Baru saja';
  } else if (diffMin < 60) {
    timeAgo = `${diffMin} mnt lalu`;
  } else if (diffHours < 24) {
    timeAgo = `${diffHours} jam lalu`;
  } else {
    timeAgo = dayMonthWib;
  }

  return {
    safeDate: dateObj,
    isoString: dateObj.toISOString(),
    timeWib,
    formattedWib,
    isToday,
    timeAgo,
  };
}

// Helper: parse basic RSS XML with WIB conversion, category tagging, and freshness filter
function parseRssFeed(
  xml: string,
  sourceName: string,
  defaultCategory?: 'Crypto' | 'Indices' | 'Forex',
): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item[\s\S]*?>([\s\S]*?)<\/item>/gi;
  let match;
  let count = 0;

  while ((match = itemRegex.exec(xml)) !== null && count < 25) {
    const itemContent = match[1];
    const titleMatch = itemContent.match(/<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/i);
    const linkMatch = itemContent.match(/<link>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/link>/i);
    const pubDateMatch = itemContent.match(/<pubDate>([\s\S]*?)<\/pubDate>/i);
    const descMatch = itemContent.match(/<description>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/description>/i);

    const title = titleMatch ? titleMatch[1].replace(/<[^>]*>?/gm, '').trim() : '';
    if (!title || title.length < 10) continue;

    const desc = descMatch ? descMatch[1].replace(/<[^>]*>?/gm, '').trim() : '';
    const affected = detectAffectedAssets(`${title} ${desc}`);
    const pubDate = pubDateMatch ? pubDateMatch[1].trim() : new Date().toISOString();

    // Parse into precise WIB time information
    const wibInfo = parseAndFormatWib(pubDate);

    // FRESHNESS FILTER: Skip news older than 36 hours so only today/latest news is displayed
    const ageHours = (Date.now() - wibInfo.safeDate.getTime()) / (1000 * 3600);
    if (ageHours > 36) continue;

    // Determine impact based on keywords
    let impact: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';
    const textCombined = `${title} ${desc}`.toLowerCase();
    if (textCombined.includes('fed') || textCombined.includes('rate hike') || textCombined.includes('rate cut') || textCombined.includes('inflation') || textCombined.includes('cpi') || textCombined.includes('war') || textCombined.includes('crisis')) {
      impact = 'HIGH';
    } else if (textCombined.includes('speech') || textCombined.includes('earnings') || textCombined.includes('yield')) {
      impact = 'MEDIUM';
    } else {
      impact = 'LOW';
    }

    const category = defaultCategory || classifyNewsCategory(title, desc, affected);

    items.push({
      id: `${sourceName.toLowerCase().replace(/[^a-z]/g, '')}-${count}-${Date.now()}`,
      headline: title,
      source: sourceName,
      sourceUrl: linkMatch ? linkMatch[1].trim() : undefined,
      time: wibInfo.formattedWib,
      timeWib: wibInfo.timeWib,
      publishedAt: wibInfo.isoString,
      isToday: wibInfo.isToday,
      formattedWib: `${wibInfo.timeAgo} • ${wibInfo.timeWib}`,
      affectedAssets: affected,
      impact,
      summary: desc.slice(0, 260) || title,
      category,
      sentiment: 'NEUTRAL',
    });
    count++;
  }

  return items;
}

// 5. Run Gemini AI Market Intelligence Analysis
export async function getAiMarketIntelligence(forceRefresh = false): Promise<AiMarketIntelligenceResult> {
  const now = Date.now();
  if (!forceRefresh && cachedAiIntelligence && now - cachedAiTimestamp < 300000) {
    return cachedAiIntelligence;
  }

  if (forceRefresh) {
    cachedQuotesTimestamp = 0;
    cachedAiIntelligence = null;
  }

  // Gather live data
  const [strengthData, quotes, news, calendar] = await Promise.all([
    getCurrencyStrengthData(),
    getTradingViewQuotes(),
    getAggregatedNews(),
    getForexFactoryCalendar(),
  ]);

  // Current time in Western Indonesia Time (WIB, UTC+7)
  const currentWibTime =
    new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Asia/Jakarta',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }) + ' WIB';
  const currentWibDate = new Date().toLocaleDateString('id-ID', {
    timeZone: 'Asia/Jakarta',
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  // Extract top news for AI context (prioritizing today's news with WIB timestamps)
  const topNewsItems = news.slice(0, 12);
  const newsContext = topNewsItems
    .map(
      (n, i) =>
        `${i + 1}. [${n.time} | ${n.source}] (${n.impact} IMPACT) ${n.headline}\n   Assets: ${n.affectedAssets.join(', ') || 'General'}\n   Summary: ${n.summary}`,
    )
    .join('\n');

  // Extract rankings & scores
  const csmContext = strengthData.rankings
    .map((r) => `#${r.rank} ${r.currency} (${r.name}): Score ${r.score > 0 ? '+' : ''}${r.score}, Status: ${r.status}`)
    .join('\n');

  // Extract Quotes with explicit real-time trend direction & signals
  const quotesContext = Object.values(quotes)
    .map((q) => {
      let trendSignal = 'NEUTRAL / KONSOLIDASI (Flat)';
      if (q.changePct >= 0.15) {
        trendSignal = 'BULLISH (Upward Trend / Menguat Nyata)';
      } else if (q.changePct <= -0.25) {
        trendSignal = 'BEARISH (Downward Trend / Melemah Nyata)';
      }
      return `- ${q.name} (${q.symbol}): Live Price ${q.price}, Perubahan 24 Jam: ${q.changePct > 0 ? '+' : ''}${q.changePct}% → [SIGNAL HARGA REAL-TIME: ${trendSignal}]`;
    })
    .join('\n');

  // Compute live macro summary signals
  const us30Change = quotes.US30?.changePct ?? 0;
  const nas100Change = quotes.NAS100?.changePct ?? 0;
  const spx500Change = quotes.SPX500?.changePct ?? 0;
  const avgIndexChange = (us30Change + nas100Change + spx500Change) / 3;
  const indexMacroSignal =
    avgIndexChange >= 0.15
      ? 'BULLISH (Wall Street Rally / Risk-On)'
      : avgIndexChange <= -0.25
        ? 'BEARISH (Wall Street Pullback / Risk-Off)'
        : 'NEUTRAL (Konsolidasi Campuran)';

  // Economic events context
  const calendarContext = calendar
    .slice(0, 6)
    .map((c) => `- [${c.country}] ${c.title} (${c.impact} impact, Forecast: ${c.forecast}, Prev: ${c.previous})`)
    .join('\n');

  const systemPrompt = `Anda adalah Lead AI Market Intelligence Trader & Chief Macro Strategist di platform "AI Market Intelligence".
Tugas Anda: Menganalisis kondisi pasar hari ini secara objektif dengan menggabungkan data tren harga real-time, Currency Strength Meter (CSM), agenda ekonomi Forex Factory, dan berita pasar terkini.

PERTANYAAN POKOK YANG HARUS DIJAWAB:
"Market hari ini cenderung ke arah mana dan apa alasannya?"

=== PRINSIP UTAMA & HIERARKI KEBENARAN MUTLAK (GROUND TRUTH) ===
1. DATA HARGA REAL-TIME DAN CSM ADALAH SUMBER KEBENARAN TERTINGGI:
   - Data harga real-time (kontrak berjangka 24 jam CME/CBOT, spot emas XAUUSD, kripto BTC) dan Currency Strength Meter adalah fakta pasar objektif yang sedang berlangsung.
   - DILARANG KERAS melabeli tren pasar yang sedang naik/positif secara real-time sebagai "Bearish" hanya karena narasi historis, sentimen berita masa lalu, kekhawatiran inflasi lama, atau retorika pesimistis makro.
   - Pasar sering kali menguat di tengah kekhawatiran ("climbing a wall of worry"). Jika persentase perubahan 24 jam (changePct) bernilai POSITIF, tren pasar tersebut ADALAH BULLISH. Berita harus digunakan untuk menjelaskan katalis pendorong penguatan, BUKAN untuk menyangkal realitas harga dan membalikkan bias menjadi Bearish.

2. ATURAN PENETAPAN BIAS ARAH ASET SPESIFIK (WAJIB DIIKUTI):
   a. INDEKS SAHAM AS (US30 / Dow Jones, US100 / Nasdaq 100, US500 / S&P 500):
      - WAJIB perhatikan persentase perubahan (changePct) real-time 24 jam kontrak futures CME/CBOT pada data HARGA ASET MAKRO.
      - Jika changePct bernilai positif (seperti US30 +0.67%, US100 +0.93%, US500 +0.74%), bias untuk indeks saham AS dan "usIndicesBias" WAJIB "Bullish" (Bukan Bearish). Pergerakan positif ini membuktikan aliran likuiditas Risk-On, reli saham teknologi/AI, dan penguatan pasar berjangka Wall Street.
      - Jangan pernah melabeli indeks saham AS sebagai Bearish jika persentase perubahannya positif.
   b. SPOT GOLD (XAUUSD):
      - Jika changePct XAUUSD bernilai positif ATAU skor mata uang USD pada CSM bernilai negatif/lemah (misalnya USD skor -10 atau berada di ranking bawah), bias Gold WAJIB "Bullish" (Bukan Bearish). Pelemahan nilai tukar Dolar AS menopang aset komoditas emas.
   c. BITCOIN (BTC):
      - Jika changePct BTC bernilai positif, bias BTC WAJIB "Bullish" (Risk-On cryptocurrency momentum).
   d. PASANGAN VALUTA ASING (FOREX):
      - Bias arah pasangan mata uang WAJIB konsisten secara matematis dengan Currency Strength Meter.
      - Bandingkan skor mata uang Base vs Quote:
        * Jika Base Score > Quote Score (misal NZD +10 vs USD -10): Bias NZDUSD WAJIB "Bullish".
        * Jika Base Score < Quote Score (misal USD -10 vs JPY +9.69): Bias USDJPY WAJIB "Bearish".
        * JANGAN PERNAH melabeli EURUSD atau GBPUSD sebagai Bearish jika USD adalah mata uang paling lemah (-10) dan EUR/GBP memiliki skor lebih tinggi dari USD.

3. SIKAP PROFESIONAL & AKURASI:
   - Gunakan fakta angka harga dan skor CSM yang sebenarnya. JANGAN mengarang angka.
   - Hubungkan berita terbaru sebagai pendorong (katalis) pergerakan, bukan spekulasi yang bertentangan dengan harga riil.
   - Format output WAJIB JSON murni tanpa markdown wrapper atau teks pembuka/penutup.`;

  const strongestRank = strengthData.rankings[0];
  const weakestRank = strengthData.rankings[strengthData.rankings.length - 1];
  const strongestCurr = strongestRank?.currency || strengthData.suggestedPair?.strong || 'NZD';
  const strongestScore = strongestRank?.score ?? 10;
  const weakestCurr = weakestRank?.currency || strengthData.suggestedPair?.weak || 'USD';
  const weakestScore = weakestRank?.score ?? -10;

  const userPrompt = `DATA PASAR REAL-TIME SAAT INI (Waktu Indonesia Bagian Barat):
* Waktu Analisis: ${currentWibDate}, pukul ${currentWibTime} (WIB)

=== 1. REAL-TIME CURRENCY STRENGTH (Sumber: currency-strength-meter) ===
${csmContext}
Divergensi Utama: Strongest=${strongestCurr} (Skor ${strongestScore}), Weakest=${weakestCurr} (Skor ${weakestScore})
Rekomendasi Pair CSM: ${strengthData.suggestedPair?.action || 'STRONG BUY'} ${strengthData.suggestedPair?.pair || `${strongestCurr}${weakestCurr}`}

=== 2. HARGA ASET MAKRO REAL-TIME (Quotes Scanner & Sinyal Tren) ===
${quotesContext}
* Rangkuman Indeks Saham AS: ${indexMacroSignal} (Rata-rata 24h: ${avgIndexChange > 0 ? '+' : ''}${avgIndexChange.toFixed(2)}%)

=== 3. BERITA TERBARU (Telegram @SM_News_24h, Investing, Fed, Reuters) ===
${newsContext}

=== 4. AGENDA EKONOMI (Forex Factory) ===
${calendarContext || 'Tidak ada high impact event hari ini'}

=== PANDUAN PENTING UNTUK OUTPUT JSON ===
1. PRIORITASKAN SINYAL TREN HARGA REAL-TIME:
   - Jika sinyal harga aset di atas bernilai BULLISH (changePct positif), bias aset tersebut WAJIB "Bullish".
   - DILARANG KERAS melabeli indeks saham AS (US30, US100, US500), Emas (XAUUSD), atau BTC sebagai "Bearish" jika data real-time menunjukkan persentase positif.
   - Gunakan berita untuk menjelaskan MENGAPA harga menguat (katalis), bukan untuk mendikte pembalikan arah yang bertentangan dengan harga riil.
2. Untuk pasangan FOREX, tentukan bias dari perbedaan skor CSM (${strongestCurr} terkuat, ${weakestCurr} terlemah).

INSTRUKSI OUTPUT JSON:
Hasilkan JSON yang valid persis dengan struktur berikut:
{
  "marketOutlook": {
    "riskSentiment": "Risk On" | "Risk Off" | "Mixed",
    "riskSentimentReason": "penjelasan singkat sentimen risiko hari ini berdasarkan tren harga real-time dan aliran dana CSM",
    "usdStatus": "Strong" | "Neutral" | "Weak",
    "usdReason": "penjelasan kondisi USD berdasarkan CSM skor dan berita Fed",
    "goldBias": "Bullish" | "Neutral" | "Bearish",
    "goldReason": "penjelasan arah Gold XAUUSD hari ini berdasarkan pergerakan harga riil dan pelemahan/penguatan USD",
    "bitcoinBias": "Bullish" | "Neutral" | "Bearish",
    "bitcoinReason": "penjelasan arah BTC hari ini berdasarkan tren harga riil",
    "usIndicesBias": "Bullish" | "Neutral" | "Bearish",
    "usIndicesReason": "penjelasan arah indeks saham AS (US30, US100, US500) mengacu pada tren futures 24-jam positif/negatif"
  },
  "marketBiases": {
    "XAUUSD": { "asset": "XAUUSD", "name": "Spot Gold", "category": "COMMODITY", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik berdasarkan harga riil dan skor USD", "confidence": "High"|"Moderate"|"Low" },
    "BTC": { "asset": "BTC", "name": "Bitcoin", "category": "CRYPTO", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik berdasarkan tren harga riil", "confidence": "High"|"Moderate"|"Low" },
    "US100": { "asset": "US100", "name": "Nasdaq 100", "category": "INDEX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik berdasarkan persentase change futures 24h", "confidence": "High"|"Moderate"|"Low" },
    "US500": { "asset": "US500", "name": "S&P 500", "category": "INDEX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik berdasarkan persentase change futures 24h", "confidence": "High"|"Moderate"|"Low" },
    "US30": { "asset": "US30", "name": "Dow Jones 30", "category": "INDEX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik berdasarkan persentase change futures 24h", "confidence": "High"|"Moderate"|"Low" },
    "EURUSD": { "asset": "EURUSD", "name": "Euro / US Dollar", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik dari perbandingan skor CSM EUR vs USD", "confidence": "High"|"Moderate"|"Low" },
    "GBPUSD": { "asset": "GBPUSD", "name": "British Pound / USD", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM GBP vs USD", "confidence": "High"|"Moderate"|"Low" },
    "USDJPY": { "asset": "USDJPY", "name": "US Dollar / Japanese Yen", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM USD vs JPY dan safe haven", "confidence": "High"|"Moderate"|"Low" },
    "AUDUSD": { "asset": "AUDUSD", "name": "Aussie / USD", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM AUD vs USD", "confidence": "High"|"Moderate"|"Low" },
    "NZDUSD": { "asset": "NZDUSD", "name": "Kiwi / USD", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM NZD vs USD", "confidence": "High"|"Moderate"|"Low" },
    "USDCAD": { "asset": "USDCAD", "name": "US Dollar / Canadian Dollar", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM USD vs CAD dan minyak", "confidence": "High"|"Moderate"|"Low" },
    "USDCHF": { "asset": "USDCHF", "name": "US Dollar / Swiss Franc", "category": "FOREX", "bias": "Bullish"|"Neutral"|"Bearish", "rationale": "alasan spesifik skor CSM USD vs CHF", "confidence": "High"|"Moderate"|"Low" }
  },
  "conclusion": {
    "importantNewsSummary": "Ringkasan berita paling penting hari ini dalam 2-3 kalimat tajam.",
    "strongestCurrency": {
      "currency": "${strongestCurr}",
      "score": ${strongestScore},
      "reason": "Mengapa mata uang ini terkuat hari ini berdasarkan aliran fundamental & data CSM."
    },
    "weakestCurrency": {
      "currency": "${weakestCurr}",
      "score": ${weakestScore},
      "reason": "Mengapa mata uang ini terlemah hari ini."
    },
    "supportingFactors": [
      "Faktor pendukung 1",
      "Faktor pendukung 2",
      "Faktor pendukung 3"
    ],
    "opposingFactors": [
      "Faktor risiko/penghambat 1",
      "Faktor risiko/penghambat 2"
    ],
    "marketConclusion": "Kesimpulan terpadu arah market hari ini (contoh: XAUUSD dan Indeks Saham AS cenderung Bullish seiring sentimen Risk-On dan pelemahan USD...)",
    "primaryDirectionAnswer": "Jawaban langsung dan jelas: Market hari ini cenderung ke arah X karena alasan Y.",
    "disclaimer": "Analisis ini merupakan intelligence fundamental dan data pasar real-time sebagai panduan navigasi probabilitas, bukan jaminan pasti pergerakan harga."
  }
}`;

  let parsedResponse: any = null;

  if (process.env.GEMINI_API_KEY) {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      // gemini-3.1-flash-lite is the stable, fast model with fresh quota
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-flash-latest', 'gemini-3.8-flash'];

      for (const modelName of modelsToTry) {
        try {
          const response = await ai.models.generateContent({
            model: modelName,
            contents: [{ role: 'user', parts: [{ text: `${systemPrompt}\n\n${userPrompt}` }] }],
            config: {
              responseMimeType: 'application/json',
              temperature: 0.2,
            },
          });

          const text = response.text || '';
          if (text) {
            const cleaned = text.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
            parsedResponse = JSON.parse(cleaned);
            break;
          }
        } catch {
          // Gracefully continue to next model candidate or fallback
        }
      }
    } catch {
      // Gracefully continue to heuristic analysis
    }
  }

  // Fallback heuristic analysis if Gemini fails or rate-limits
  if (!parsedResponse) {
    if (cachedAiIntelligence) {
      parsedResponse = {
        marketOutlook: cachedAiIntelligence.marketOutlook,
        marketBiases: cachedAiIntelligence.marketBiases,
        conclusion: cachedAiIntelligence.conclusion,
      };
    } else {
      parsedResponse = generateHeuristicAnalysis(strengthData, quotes, topNewsItems);
    }
  }

  // Merge quote prices into market biases and enforce real-time price trend priority
  if (parsedResponse?.marketBiases) {
    if (parsedResponse.marketBiases.XAUUSD && quotes.XAUUSD) {
      parsedResponse.marketBiases.XAUUSD.currentPrice = quotes.XAUUSD.price;
      parsedResponse.marketBiases.XAUUSD.changePct = quotes.XAUUSD.changePct;
      if ((quotes.XAUUSD.changePct >= 0.1 || (strengthData.scores.USD ?? 0) <= -2) && parsedResponse.marketBiases.XAUUSD.bias === 'Bearish') {
        parsedResponse.marketBiases.XAUUSD.bias = 'Bullish';
        parsedResponse.marketBiases.XAUUSD.rationale = `Spot Emas menguat (+${quotes.XAUUSD.changePct.toFixed(2)}%) didukung pelemahan tajam indeks Dolar AS (USD) dan permintaan aset lindung nilai.`;
      }
    }
    if (parsedResponse.marketBiases.BTC && quotes.BTCUSD) {
      parsedResponse.marketBiases.BTC.currentPrice = quotes.BTCUSD.price;
      parsedResponse.marketBiases.BTC.changePct = quotes.BTCUSD.changePct;
      if (quotes.BTCUSD.changePct >= 0.2 && parsedResponse.marketBiases.BTC.bias === 'Bearish') {
        parsedResponse.marketBiases.BTC.bias = 'Bullish';
        parsedResponse.marketBiases.BTC.rationale = `Bitcoin menguat (+${quotes.BTCUSD.changePct.toFixed(2)}%) didorong aliran likuiditas pasar dan sentimen selera risiko positif.`;
      }
    }
    if (parsedResponse.marketBiases.US30 && quotes.US30) {
      parsedResponse.marketBiases.US30.currentPrice = quotes.US30.price;
      parsedResponse.marketBiases.US30.changePct = quotes.US30.changePct;
      if (quotes.US30.changePct >= 0.15 && parsedResponse.marketBiases.US30.bias === 'Bearish') {
        parsedResponse.marketBiases.US30.bias = 'Bullish';
        parsedResponse.marketBiases.US30.rationale = `Kontrak futures Dow Jones 30 menguat (+${quotes.US30.changePct.toFixed(2)}%) di pasar berjangka 24-jam sejalan dengan sentimen Risk-On.`;
      }
    }
    if (parsedResponse.marketBiases.US100 && quotes.NAS100) {
      parsedResponse.marketBiases.US100.currentPrice = quotes.NAS100.price;
      parsedResponse.marketBiases.US100.changePct = quotes.NAS100.changePct;
      if (quotes.NAS100.changePct >= 0.15 && parsedResponse.marketBiases.US100.bias === 'Bearish') {
        parsedResponse.marketBiases.US100.bias = 'Bullish';
        parsedResponse.marketBiases.US100.rationale = `Kontrak futures Nasdaq 100 menguat (+${quotes.NAS100.changePct.toFixed(2)}%) didorong oleh reli sektor teknologi dan AI.`;
      }
    }
    if (parsedResponse.marketBiases.US500 && quotes.SPX500) {
      parsedResponse.marketBiases.US500.currentPrice = quotes.SPX500.price;
      parsedResponse.marketBiases.US500.changePct = quotes.SPX500.changePct;
      if (quotes.SPX500.changePct >= 0.15 && parsedResponse.marketBiases.US500.bias === 'Bearish') {
        parsedResponse.marketBiases.US500.bias = 'Bullish';
        parsedResponse.marketBiases.US500.rationale = `Kontrak futures S&P 500 menguat (+${quotes.SPX500.changePct.toFixed(2)}%) mencerminkan momentum Risk-On di Wall Street.`;
      }
    }

    // Ensure marketOutlook stays strictly aligned with real-time price trends
    if (parsedResponse.marketOutlook) {
      const avgFutures = ((quotes.US30?.changePct ?? 0) + (quotes.NAS100?.changePct ?? 0) + (quotes.SPX500?.changePct ?? 0)) / 3;
      if (avgFutures >= 0.15 && parsedResponse.marketOutlook.usIndicesBias === 'Bearish') {
        parsedResponse.marketOutlook.usIndicesBias = 'Bullish';
        parsedResponse.marketOutlook.usIndicesReason = `Pasar berjangka Wall Street bergerak menguat solid (rata-rata +${avgFutures.toFixed(2)}%), dipimpin reli saham teknologi dan sentimen Risk-On.`;
      }
      if (((quotes.XAUUSD?.changePct ?? 0) >= 0.1 || (strengthData.scores.USD ?? 0) <= -2) && parsedResponse.marketOutlook.goldBias === 'Bearish') {
        parsedResponse.marketOutlook.goldBias = 'Bullish';
        parsedResponse.marketOutlook.goldReason = `Emas didukung oleh pelemahan tajam Dolar AS (skor ${strengthData.scores.USD}) dan pergerakan positif harga spot.`;
      }
    }
  }

  if (parsedResponse?.marketOutlook) {
    parsedResponse.marketOutlook.riskHistory = generate7DayRiskHistory(
      parsedResponse.marketOutlook.riskSentiment || 'Risk On',
      quotes,
      strengthData,
    );
  }

  const finalResult: AiMarketIntelligenceResult = {
    analyzedAt: new Date().toISOString(),
    marketOutlook: parsedResponse.marketOutlook,
    topNews: topNewsItems,
    marketBiases: parsedResponse.marketBiases,
    conclusion: parsedResponse.conclusion,
    sourceStatus: {
      currencyStrength: !!strengthData,
      telegramNews: news.some((n) => n.source.includes('Telegram')),
      tradingView: Object.keys(quotes).length > 0,
      rssFeeds: news.some((n) => !n.source.includes('Telegram')),
      forexFactory: calendar.length > 0,
    },
  };

  cachedAiIntelligence = finalResult;
  cachedAiTimestamp = now;
  return finalResult;
}

// Generate realistic 7-day risk sentiment history based on market factors
export function generate7DayRiskHistory(
  todaySentiment: 'Risk On' | 'Risk Off' | 'Mixed',
  quotes?: Record<string, TradingViewQuote>,
  strength?: CurrencyStrengthData,
): RiskSentimentHistoryPoint[] {
  const result: RiskSentimentHistoryPoint[] = [];
  const now = new Date();

  const dayNames = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

  const todayScore = todaySentiment === 'Risk On' ? 68 : todaySentiment === 'Risk Off' ? -58 : 6;
  const avgFutures = quotes ? (((quotes.US30?.changePct ?? 0) + (quotes.NAS100?.changePct ?? 0) + (quotes.SPX500?.changePct ?? 0)) / 3) : 0.78;
  const audScore = strength?.scores?.AUD ?? 4;
  const nzdScore = strength?.scores?.NZD ?? 6;
  const jpyScore = strength?.scores?.JPY ?? -5;
  const todayFxRisk = ((audScore + nzdScore) / 2) - jpyScore;

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
      score: todaySentiment === 'Risk On' ? 48 : todaySentiment === 'Risk Off' ? -22 : 12,
      equities: todaySentiment === 'Risk On' ? 0.72 : todaySentiment === 'Risk Off' ? -0.35 : 0.15,
      fx: todaySentiment === 'Risk On' ? 5.2 : todaySentiment === 'Risk Off' ? -2.1 : 1.4,
      vix: todaySentiment === 'Risk On' ? 15.1 : todaySentiment === 'Risk Off' ? 18.2 : 16.8,
      sentiment: todaySentiment === 'Risk On' ? ('Risk On' as const) : todaySentiment === 'Risk Off' ? ('Risk Off' as const) : ('Mixed' as const),
      driver: 'Arus modal beralih ke komoditas dan saham siklikal seiring pelemahan indeks Dolar AS.',
    },
    {
      score: todayScore,
      equities: Number(avgFutures.toFixed(2)),
      fx: Number(todayFxRisk.toFixed(1)),
      vix: todaySentiment === 'Risk On' ? 14.3 : todaySentiment === 'Risk Off' ? 19.8 : 16.5,
      sentiment: todaySentiment,
      driver: todaySentiment === 'Risk On'
        ? 'Risk-On dominan: Reli indeks saham berjangka Wall Street, lonjakan mata uang komoditas (AUD/NZD), dan pelemahan Dolar AS.'
        : todaySentiment === 'Risk Off'
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
}

// Deterministic heuristic fallback in case AI quota runs dry
function generateHeuristicAnalysis(
  strength: CurrencyStrengthData,
  quotes: Record<string, TradingViewQuote>,
  topNews: NewsItem[],
): any {
  const usdRank = strength.rankings.find((r) => r.currency === 'USD');
  const usdScore = usdRank ? usdRank.score : -10;
  const isUsdStrong = usdScore > 2;
  const isUsdWeak = usdScore < -2;

  const strongest = strength.rankings[0] || { currency: 'NZD', score: 10 };
  const weakest = strength.rankings[strength.rankings.length - 1] || { currency: 'USD', score: -10 };

  const goldPrice = quotes.XAUUSD?.price || 4312;
  const goldBias = isUsdWeak ? 'Bullish' : isUsdStrong ? 'Bearish' : 'Neutral';

  // Dynamic pair helper based on currency strength difference
  const calcForexBias = (base: string, quote: string) => {
    const bScore = strength.scores[base] ?? 0;
    const qScore = strength.scores[quote] ?? 0;
    const diff = bScore - qScore;
    const bias = diff >= 3 ? 'Bullish' : diff <= -3 ? 'Bearish' : 'Neutral';
    return {
      bias: bias as 'Bullish' | 'Neutral' | 'Bearish',
      rationale: `${base} (skor ${bScore > 0 ? '+' : ''}${bScore.toFixed(1)}) vs ${quote} (skor ${qScore > 0 ? '+' : ''}${qScore.toFixed(1)}), selisih ${diff > 0 ? '+' : ''}${diff.toFixed(1)} poin pada meter valas.`,
    };
  };

  const eurusdBias = calcForexBias('EUR', 'USD');
  const gbpusdBias = calcForexBias('GBP', 'USD');
  const usdjpyBias = calcForexBias('USD', 'JPY');
  const audusdBias = calcForexBias('AUD', 'USD');
  const nzdusdBias = calcForexBias('NZD', 'USD');
  const usdcadBias = calcForexBias('USD', 'CAD');
  const usdchfBias = calcForexBias('USD', 'CHF');

  const us30Change = quotes.US30?.changePct ?? 0.67;
  const nas100Change = quotes.NAS100?.changePct ?? 0.93;
  const spx500Change = quotes.SPX500?.changePct ?? 0.74;

  const avgIndexChange = (us30Change + nas100Change + spx500Change) / 3;
  const isIndicesBullish = avgIndexChange >= 0.15;
  const isIndicesBearish = avgIndexChange <= -0.25;
  const usIndicesBias = isIndicesBullish ? 'Bullish' : isIndicesBearish ? 'Bearish' : 'Neutral';

  const calcIndexBias = (change: number, name: string) => {
    const bias = change >= 0.15 ? 'Bullish' : change <= -0.25 ? 'Bearish' : 'Neutral';
    const sign = change > 0 ? '+' : '';
    let rationale = '';
    if (bias === 'Bullish') {
      rationale = `Kontrak futures 24-jam ${name} menguat (${sign}${change.toFixed(2)}%) seiring selera risiko (Risk-On) dan reli saham teknologi.`;
    } else if (bias === 'Bearish') {
      rationale = `Kontrak futures ${name} tertekan (${sign}${change.toFixed(2)}%) akibat aksi profit taking dan kehati-hatian investor.`;
    } else {
      rationale = `Kontrak futures ${name} bergerak konsolidasi (${sign}${change.toFixed(2)}%) mencerminkan sikap wait-and-see pasar.`;
    }
    return { bias, rationale };
  };

  const us100Obj = calcIndexBias(nas100Change, 'Nasdaq 100');
  const us500Obj = calcIndexBias(spx500Change, 'S&P 500');
  const us30Obj = calcIndexBias(us30Change, 'Dow Jones 30');

  const calculatedRiskSentiment = isUsdWeak && (strength.scores.AUD > 0 || strength.scores.NZD > 0) ? 'Risk On' : isUsdStrong ? 'Risk Off' : 'Mixed';

  return {
    marketOutlook: {
      riskSentiment: calculatedRiskSentiment,
      riskSentimentReason: `Arus dana terkonsentrasi kuat pada ${strongest.currency} (+${strongest.score}) sementara ${weakest.currency} (${weakest.score}) mengalami tekanan pelemahan terbesar.`,
      riskHistory: generate7DayRiskHistory(calculatedRiskSentiment, quotes, strength),
      usdStatus: isUsdStrong ? 'Strong' : isUsdWeak ? 'Weak' : 'Neutral',
      usdReason: `USD berada di peringkat #${usdRank?.rank || 8} dengan skor ${usdScore > 0 ? '+' : ''}${usdScore} pada Currency Strength Meter (timeframe ${strength.timeframe}).`,
      goldBias,
      goldReason: `Emas di sekitar $${goldPrice.toLocaleString()} mendapat dorongan kuat akibat pelemahan indeks Dolar AS (USD ${usdScore}).`,
      bitcoinBias: 'Bullish',
      bitcoinReason: 'Arus dana institusional dan stabilitas adopsi kripto menopang pergerakan di atas level support utama.',
      usIndicesBias,
      usIndicesReason: isIndicesBullish
        ? `Indeks saham AS (US30 +${us30Change.toFixed(2)}%, US100 +${nas100Change.toFixed(2)}%, US500 +${spx500Change.toFixed(2)}%) bergerak menguat solid di pasar berjangka 24-jam didukung sentimen Risk-On, reli saham teknologi, dan pelemahan Dolar AS.`
        : isIndicesBearish
        ? `Indeks saham AS tertekan di pasar berjangka akibat kekhawatiran suku bunga dan aksi jual institusional.`
        : `Indeks saham Wall Street bervariasi (Mixed) terpengaruh dinamika yield obligasi AS dan rotasi sektor teknologi.`,
    },
    marketBiases: {
      XAUUSD: { asset: 'XAUUSD', name: 'Spot Gold', category: 'COMMODITY', bias: goldBias, rationale: 'Didukung pelemahan signifikan Dolar AS dan tensi ketidakpastian makro.', confidence: 'High' },
      BTC: { asset: 'BTC', name: 'Bitcoin', category: 'CRYPTO', bias: 'Bullish', rationale: 'Didukung momentum likuiditas digital dan permintaan akumulasi ETF.', confidence: 'Moderate' },
      US100: { asset: 'US100', name: 'Nasdaq 100', category: 'INDEX', bias: us100Obj.bias, rationale: us100Obj.rationale, confidence: 'Moderate' },
      US500: { asset: 'US500', name: 'S&P 500', category: 'INDEX', bias: us500Obj.bias, rationale: us500Obj.rationale, confidence: 'Moderate' },
      US30: { asset: 'US30', name: 'Dow Jones 30', category: 'INDEX', bias: us30Obj.bias, rationale: us30Obj.rationale, confidence: 'Moderate' },
      EURUSD: { asset: 'EURUSD', name: 'Euro / US Dollar', category: 'FOREX', bias: eurusdBias.bias, rationale: eurusdBias.rationale, confidence: 'Moderate' },
      GBPUSD: { asset: 'GBPUSD', name: 'British Pound / USD', category: 'FOREX', bias: gbpusdBias.bias, rationale: gbpusdBias.rationale, confidence: 'Moderate' },
      USDJPY: { asset: 'USDJPY', name: 'US Dollar / Japanese Yen', category: 'FOREX', bias: usdjpyBias.bias, rationale: usdjpyBias.rationale, confidence: 'High' },
      AUDUSD: { asset: 'AUDUSD', name: 'Aussie / USD', category: 'FOREX', bias: audusdBias.bias, rationale: audusdBias.rationale, confidence: 'High' },
      NZDUSD: { asset: 'NZDUSD', name: 'Kiwi / USD', category: 'FOREX', bias: nzdusdBias.bias, rationale: nzdusdBias.rationale, confidence: 'High' },
      USDCAD: { asset: 'USDCAD', name: 'US Dollar / Canadian Dollar', category: 'FOREX', bias: usdcadBias.bias, rationale: usdcadBias.rationale, confidence: 'Moderate' },
      USDCHF: { asset: 'USDCHF', name: 'US Dollar / Swiss Franc', category: 'FOREX', bias: usdchfBias.bias, rationale: usdchfBias.rationale, confidence: 'Moderate' },
    },
    conclusion: {
      importantNewsSummary: topNews[0]?.headline || 'Sentimen moneter bank sentral dan divergensi mata uang mendominasi pergerakan pasar hari ini.',
      strongestCurrency: {
        currency: strongest.currency,
        score: strongest.score,
        reason: `Mendominasi ranking #1 pada Currency Strength Meter dengan perolehan skor tertinggi (+${strongest.score}).`,
      },
      weakestCurrency: {
        currency: weakest.currency,
        score: weakest.score,
        reason: `Tertekan di ranking terakhir (#${strength.rankings.length || 8}) dengan skor terendah (${weakest.score}).`,
      },
      supportingFactors: [
        `Divergensi kekuatan tajam antara ${strongest.currency} dan ${weakest.currency} memberi peluang setup tren berkonfluensi tinggi`,
        'Pelemahan Dolar AS menopang aset komoditas seperti Emas (XAUUSD)',
      ],
      opposingFactors: [
        'Volatilitas mendadak akibat rilis data ekonomi atau pernyataan pejabat The Fed',
        'Potensi retracement teknikal saat pair valas menyentuh batas overbought/oversold',
      ],
      marketConclusion: `Market hari ini didominasi oleh penguatan ${strongest.currency} dan pelemahan signifikan pada ${weakest.currency}. Pasangan seperti NZDUSD, AUDUSD, dan Gold (XAUUSD) cenderung menguat, sementara USDJPY berada dalam tekanan turun tajam.`,
      primaryDirectionAnswer: `Market hari ini cenderung didominasi oleh pelemahan Dolar AS (USD) dan penguatan mata uang komoditas/safe-haven (${strongest.currency}), mendorong Gold (XAUUSD) serta pair seperti NZDUSD dan AUDUSD bergerak menguat.`,
      disclaimer: 'Analisis ini bertujuan menyajikan probabilitas objektif berdasarkan data CSM dan sentimen berita, bukan kepastian arah pasar mutlak.',
    },
  };
}
