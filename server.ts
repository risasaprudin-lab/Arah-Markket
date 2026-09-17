import express from 'express';
import {
  getAiMarketIntelligence,
  getAggregatedNews,
  getCurrencyStrengthData,
  getForexFactoryCalendar,
  getTradingViewQuotes,
} from './src/server/marketService.ts';

export const app = express();
app.use(express.json());

// 1. Currency Strength & Quotes endpoint
app.get('/api/market-data', async (req, res) => {
  try {
    const tf = (req.query.tf as string) || 'D1';
    const [csm, quotes] = await Promise.all([
      getCurrencyStrengthData(tf),
      getTradingViewQuotes(),
    ]);
    res.json({ success: true, csm, quotes });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 1b. Direct Currency Strength Ranking endpoint (matching source schema)
app.get('/api/strength/ranking', async (req, res) => {
  try {
    const tf = (req.query.tf as string) || 'D1';
    const csm = await getCurrencyStrengthData(tf);
    res.json(csm.rankings);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 1c. Direct Currency Strength Current endpoint (matching source schema)
app.get('/api/strength/current', async (req, res) => {
  try {
    const tf = (req.query.tf as string) || 'D1';
    const csm = await getCurrencyStrengthData(tf);
    res.json(csm);
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Real-time News Feed endpoint
app.get('/api/news', async (req, res) => {
  try {
    const todayOnly = req.query.today === 'true' || req.query.todayOnly === 'true';
    const categoryQuery = (req.query.category as string || '').toUpperCase();
    let allNews = await getAggregatedNews();
    
    // Category statistics across the dataset
    const cryptoCount = allNews.filter((n) => (n.category || '').toUpperCase() === 'CRYPTO').length;
    const indicesCount = allNews.filter((n) => (n.category || '').toUpperCase() === 'INDICES').length;
    const forexCount = allNews.filter((n) => (n.category || '').toUpperCase() === 'FOREX').length;

    let news = allNews;
    if (todayOnly) {
      news = news.filter((item) => item.isToday);
    }
    if (categoryQuery && categoryQuery !== 'ALL') {
      news = news.filter((item) => (item.category || '').toUpperCase() === categoryQuery);
    }

    const now = new Date();
    const currentWib =
      now.toLocaleTimeString('en-GB', {
        timeZone: 'Asia/Jakarta',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      }) + ' WIB';
    const currentDateWib = now.toLocaleDateString('id-ID', {
      timeZone: 'Asia/Jakarta',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
    res.json({
      success: true,
      news,
      count: news.length,
      todayCount: news.filter((n) => n.isToday).length,
      cryptoCount,
      indicesCount,
      forexCount,
      currentWib,
      currentDateWib,
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 3. Forex Factory Calendar endpoint
app.get('/api/calendar', async (_req, res) => {
  try {
    const calendar = await getForexFactoryCalendar();
    res.json({ success: true, calendar });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// 4. AI Market Intelligence endpoint (main engine)
app.get('/api/ai-intelligence', async (req, res) => {
  try {
    const forceRefresh = req.query.refresh === 'true' || req.query.refresh === '1';
    const intelligence = await getAiMarketIntelligence(forceRefresh);
    res.json({ success: true, data: intelligence });
  } catch (err: any) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// If run directly (e.g. node server.ts in production)
if (process.env.NODE_ENV === 'production' && !process.env.VITE_DEV_MODE) {
  const path = await import('path');
  const staticPath = path.resolve(process.cwd(), 'dist');
  app.use(express.static(staticPath));
  app.get('*', (_req, res) => {
    res.sendFile(path.resolve(staticPath, 'index.html'));
  });

  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`[AI Market Intelligence] Server listening on port ${PORT}`);
  });
}
