import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(express.json({ limit: '2mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    appName: 'MeethoPasal AI',
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
  });
});

// AI Business Assistant endpoint (Module 7)
app.post('/api/ai-advisor', async (req, res) => {
  try {
    const { shopName, metrics, topProducts, highCostIngredients, prompt, language = 'ne' } = req.body;

    const apiKey = process.env.GEMINI_API_KEY;

    // Build context summary from real shop metrics
    const contextPrompt = `
You are "मीठो सल्लाहकार" (Meetho Advisor), a friendly, expert restaurant & street-food business advisor in Nepal.
Your user is a small restaurant/street-food stall owner in Nepal (selling momo, chatpate, pani puri, chowmein, etc.).
Keep your language simple, practical, highly encouraging, and primarily in Nepali (with simple English terms where helpful, or Devanagari script).

Real Shop Data:
- Shop Name: ${shopName || 'हाम्रो मीठो पसल'}
- Total Sales: NPR ${metrics?.totalSales || 0}
- Cost of Ingredients (COGS): NPR ${metrics?.cogs || 0}
- Gross Profit: NPR ${metrics?.grossProfit || 0} (Margin: ${metrics?.grossMargin || '0'}%)
- Operating Expenses (Rent, Gas, Packing): NPR ${metrics?.operatingExpenses || 0}
- Net Operating Profit: NPR ${metrics?.operatingProfit || 0}
- Separate Household Withdrawals (घरखर्च): NPR ${metrics?.householdWithdrawals || 0}
- Net Cash In Hand: NPR ${metrics?.netCashMovement || 0}
- Top Selling Products: ${JSON.stringify(topProducts || [])}
- High Cost Ingredients: ${JSON.stringify(highCostIngredients || [])}

Rules:
1. Base your financial deductions STRICTLY on the actual recorded facts above.
2. Distinguish recorded facts from estimates and recommendations.
3. Suggest concrete ways to cut ingredient waste, optimize variant pricing, and increase high-margin sales.
4. If household withdrawals are higher than net profit, gently remind the owner that taking too much cash out threatens inventory restocking.

Owner's Question or Focus:
"${prompt || 'हाम्रो पसलको नाफा कसरी बढाउने र कुन सामानबाट बढी फाइदा भइरहेको छ?'}"
`;

    if (apiKey && apiKey !== 'MY_GEMINI_API_KEY') {
      try {
        const ai = new GoogleGenAI({ apiKey });
        const response = await ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: contextPrompt,
        });

        const reply = response.text || 'सल्लाह तयार गर्न सकिएन। कृपया केही समयपछि पुन: प्रयास गर्नुहोस्।';
        return res.json({ reply, source: 'gemini' });
      } catch (geminiError) {
        console.warn('Gemini API call error, falling back to local business engine:', geminiError);
      }
    }

    // Fallback: Smart local rule-based advisor for small Nepali food businesses
    const reply = generateLocalAdvisorResponse({
      shopName,
      metrics,
      topProducts,
      highCostIngredients,
      prompt,
    });

    return res.json({
      reply,
      source: 'local_engine',
      note: 'विश्लेषण स्थानीय व्यापार सूत्र (Local Business Logic) बाट निकालिएको हो।'
    });

  } catch (error) {
    console.error('Advisor error:', error);
    res.status(500).json({ error: 'AI सल्लाहकारमा त्रुटि आयो।' });
  }
});

function generateLocalAdvisorResponse(data: {
  shopName?: string;
  metrics?: any;
  topProducts?: any[];
  highCostIngredients?: any[];
  prompt?: string;
}) {
  const m = data.metrics || {};
  const sales = Number(m.totalSales) || 0;
  const cogs = Number(m.cogs) || 0;
  const opExp = Number(m.operatingExpenses) || 0;
  const opProfit = Number(m.operatingProfit) || 0;
  const grossMargin = sales > 0 ? Math.round(((sales - cogs) / sales) * 100) : 0;
  const withdrawals = Number(m.householdWithdrawals) || 0;

  const topItems = (data.topProducts || []).slice(0, 3).map(p => p.name).join(', ') || 'चटपटे र मम';
  const highCost = (data.highCostIngredients || []).slice(0, 2).map(i => i.name).join(' र ') || 'तेल र कुखुराको मासु';

  let analysis = `नमस्ते साहुजी! **${data.shopName || 'मीठो पसल'}** को आर्थिक हिसाब हेर्दा:\n\n`;

  analysis += `📊 **१. मुख्य यथार्थ (Recorded Facts):**\n`;
  analysis += `• जम्मा बिक्री: **रू ${sales.toLocaleString('en-IN')}**\n`;
  analysis += `• खाजामा लागेको कच्चा पदार्थ खर्च: **रू ${cogs.toLocaleString('en-IN')}**\n`;
  analysis += `• कुल नाफा (Gross Margin): **${grossMargin}%** (रू ${(sales - cogs).toLocaleString('en-IN')})\n`;
  analysis += `• सञ्चालन खर्च (भाडा, ग्यास, बत्ती, प्याकिङ): **रू ${opExp.toLocaleString('en-IN')}**\n`;
  analysis += `• खुद व्यापारिक नाफा: **रू ${opProfit.toLocaleString('en-IN')}**\n`;

  if (withdrawals > 0) {
    analysis += `• पसलबाट घरखर्च (Household Draw): **रू ${withdrawals.toLocaleString('en-IN')}**\n`;
    if (withdrawals > opProfit && opProfit > 0) {
      analysis += `⚠️ *ध्यान दिनुहोस्:* घरखर्च खुद नाफाभन्दा बढी झिकिएको छ। यसले भोलि नयाँ कच्चा पदार्थ किन्न गाह्रो पार्न सक्छ।\n`;
    }
  }

  analysis += `\n🌟 **२. कुन खानाले धेरै नाफा दिन्छ?**\n`;
  analysis += `• सबभन्दा बढी माग: **${topItems}**।\n`;
  analysis += `• पानीपुरी र चटपटेमा कच्चा पदार्थको लागत कम (२०%-२५%) हुने हुँदा यसमा ७५% सम्म कुल नाफा बस्छ। यसलाई ग्राहकलाई थप अफर गरेर बिक्री बढाउनुहोस्।\n`;

  analysis += `\n💡 **३. खर्च घटाउने र नाफा बढाउने सुझावहरू (Recommendations):**\n`;
  analysis += `१. **कच्चा पदार्थ नियन्त्रण:** मुख्य खर्च **${highCost}** मा भइरहेको छ। मसला र तेल नापेर मात्र प्रयोग गर्नुहोस्।\n`;
  analysis += `२. **कम्बो अफर बनाउनुहोस्:** उदाहरण: "मम + चिसो पेय" वा "चटपटे + पानीपुरी कम्बो" ले औसत अर्डर रकम १५-२०% बढाउँछ।\n`;
  analysis += `३. **प्याकेजिङ लागत:** डेलिभरी र टेकअवेका लागि गुणस्तरीय तर किफायती झोला र बक्स थोकमा किन्दा प्रति अर्डर रू ३-५ बचत हुन्छ।\n`;

  return analysis;
}

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: process.env.DISABLE_HMR !== 'true' },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`MeethoPasal AI server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
