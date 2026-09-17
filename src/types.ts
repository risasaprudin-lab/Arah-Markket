export type SentimentDirection = 'Bullish' | 'Neutral' | 'Bearish';
export type RiskSentiment = 'Risk On' | 'Risk Off' | 'Mixed';
export type UsdStrength = 'Strong' | 'Neutral' | 'Weak';
export type NewsImpact = 'HIGH' | 'MEDIUM' | 'LOW';

export interface CurrencyScore {
  rank: number;
  currency: 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CHF' | 'AUD' | 'NZD' | 'CAD';
  name: string;
  flag: string;
  color: string;
  score: number;
  score10: number;
  raw: number;
  status: string;
  pairsWon: number;
  pairsLost: number;
}

export interface CurrencyStrengthHistoryPoint {
  timestamp: number;
  time: string;
  USD: number;
  EUR: number;
  GBP: number;
  JPY: number;
  CHF: number;
  AUD: number;
  NZD: number;
  CAD: number;
}

export interface SuggestedPair {
  strong: string;
  weak: string;
  pair: string;
  standardPair: string;
  action: string;
  divergence: number;
  confidence: string;
  rationale: string;
  currentRate?: number;
  spreadPips?: number;
  suggestedSL?: number;
  suggestedTP?: number;
  calculationMode?: string;
  strategyBadge?: string;
  stretchScore?: number;
  isRetracing?: boolean;
  retracementDirection?: string;
  pullbackPips?: number;
  pullbackPercent?: number;
  dayHigh?: number;
  dayLow?: number;
  retracementWarning?: string;
  confidenceScore?: number;
  alignmentSummary?: string;
  timeframeAlignment?: Array<{
    timeframe: string;
    direction: string;
    agrees: boolean;
    diff: number;
    baseScore: number;
    quoteScore: number;
  }>;
}

export interface TradingViewQuote {
  symbol: string;
  tvTicker: string;
  name: string;
  category: string;
  price: number;
  changePct: number;
  changeAbs: number;
  high24h: number;
  low24h: number;
  open24h: number;
  volume: number;
  lastUpdated: string;
  source: string;
}

export type NewsCategoryFilter = 'ALL' | 'CRYPTO' | 'INDICES' | 'FOREX';

export interface NewsItem {
  id: string;
  headline: string;
  source: string;
  sourceUrl?: string;
  time: string;
  publishedAt: string;
  affectedAssets: string[];
  impact: NewsImpact;
  summary: string;
  category?: 'Crypto' | 'Indices' | 'Forex' | string;
  sentiment?: 'BULLISH' | 'BEARISH' | 'NEUTRAL';
  timeWib?: string;
  isToday?: boolean;
  formattedWib?: string;
}

export interface ForexFactoryEvent {
  title: string;
  country: string;
  date: string;
  impact: string;
  forecast: string;
  previous: string;
}

export interface MarketBiasItem {
  asset: string;
  name: string;
  category: 'COMMODITY' | 'CRYPTO' | 'INDEX' | 'FOREX';
  bias: SentimentDirection;
  currentPrice?: number;
  changePct?: number;
  rationale: string;
  confidence?: 'High' | 'Moderate' | 'Low';
  csmImpact?: string;
}

export interface RiskSentimentHistoryPoint {
  date: string;
  fullDate: string;
  dayName: string;
  sentiment: RiskSentiment;
  sentimentScore: number;
  equitiesScore: number;
  fxRiskScore: number;
  vixLevel: number;
  dominantDriver: string;
}

export interface MarketOutlook {
  riskSentiment: RiskSentiment;
  riskSentimentReason: string;
  riskHistory?: RiskSentimentHistoryPoint[];
  usdStatus: UsdStrength;
  usdReason: string;
  goldBias: SentimentDirection;
  goldReason: string;
  bitcoinBias: SentimentDirection;
  bitcoinReason: string;
  usIndicesBias: SentimentDirection;
  usIndicesReason: string;
}

export interface TodayConclusion {
  importantNewsSummary: string;
  strongestCurrency: {
    currency: string;
    score: number;
    reason: string;
  };
  weakestCurrency: {
    currency: string;
    score: number;
    reason: string;
  };
  supportingFactors: string[];
  opposingFactors: string[];
  marketConclusion: string;
  primaryDirectionAnswer: string;
  disclaimer: string;
}

export interface AiMarketIntelligenceResult {
  analyzedAt: string;
  marketOutlook: MarketOutlook;
  topNews: NewsItem[];
  marketBiases: Record<string, MarketBiasItem>;
  conclusion: TodayConclusion;
  sourceStatus: {
    currencyStrength: boolean;
    telegramNews: boolean;
    tradingView: boolean;
    rssFeeds: boolean;
    forexFactory: boolean;
  };
}

export interface CurrencyStrengthData {
  timeframe: string;
  timestamp: string;
  source?: string;
  sourceName: string;
  sourceUrl: string;
  sourceStatus: string;
  lastSynced: string;
  scores: Record<string, number>;
  scores10: Record<string, number>;
  raw_scores?: Record<string, number>;
  rawScores?: Record<string, number>;
  rankings: CurrencyScore[];
  history: CurrencyStrengthHistoryPoint[];
  suggestedPair: SuggestedPair | null;
  suggested_pair?: SuggestedPair | null;
  secondarySuggestions: SuggestedPair[];
  secondary_suggestions?: SuggestedPair[];
  calculationMode?: string;
}
