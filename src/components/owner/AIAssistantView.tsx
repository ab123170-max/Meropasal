import React, { useState } from 'react';
import { Shop, FinancialMetrics, Product, Ingredient, Order } from '../../types';
import {
  Bot,
  Sparkles,
  Send,
  TrendingUp,
  AlertCircle,
  HelpCircle,
  CheckCircle,
  Lightbulb,
} from 'lucide-react';

interface AIAssistantViewProps {
  shop: Shop;
  metrics: FinancialMetrics;
  products: Product[];
  ingredients: Ingredient[];
  orders: Order[];
}

export const AIAssistantView: React.FC<AIAssistantViewProps> = ({
  shop,
  metrics,
  products,
  ingredients,
  orders,
}) => {
  const [prompt, setPrompt] = useState('');
  const [response, setResponse] = useState<string | null>(null);
  const [source, setSource] = useState<'gemini' | 'local_engine' | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Extract top selling products from orders
  const itemCounts: Record<string, number> = {};
  orders.forEach((o) => {
    o.items?.forEach((item) => {
      itemCounts[item.item_name] = (itemCounts[item.item_name] || 0) + item.quantity;
    });
  });

  const topProducts = Object.entries(itemCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count]) => ({ name, count }));

  // Extract high-cost ingredients
  const highCostIngredients = [...ingredients]
    .sort((a, b) => b.purchase_cost_per_unit - a.purchase_cost_per_unit)
    .slice(0, 5)
    .map((i) => ({ name: i.name_ne || i.name, cost: i.purchase_cost_per_unit, unit: i.unit }));

  const quickPrompts = [
    'कुन परिकारबाट सबभन्दा बढी नाफा हुन्छ?',
    'कच्चा पदार्थ खेर जाने समस्या कसरी घटाउने?',
    'आजको हिसाब विश्लेषण गरी मुख्य सुझाव दिनुहोस्',
    'हाम्रो पसलको सञ्चालन खर्च कसरी घटाउने?',
  ];

  const handleAskAssistant = async (questionText?: string) => {
    const q = (questionText || prompt).trim();
    if (!q) return;

    try {
      setIsLoading(true);
      setErrorMsg('');

      const res = await fetch('/api/ai-advisor', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          shopName: shop.name_ne || shop.name,
          metrics,
          topProducts,
          highCostIngredients,
          prompt: q,
        }),
      });

      if (!res.ok) {
        throw new Error('सर्भरबाट सल्लाह लिन सकिएन।');
      }

      const data = await res.json();
      setResponse(data.reply);
      setSource(data.source);
    } catch (err: any) {
      setErrorMsg(err.message || 'त्रुटि आयो। कृपया फेरि प्रयास गर्नुहोस्।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-3.5">
      {/* Header */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-2xl bg-gradient-to-tr from-orange-500 to-amber-500 text-white flex items-center justify-center shadow-xs">
          <Bot className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-black text-gray-900 leading-tight">
            मीठो सल्लाहकार (AI Business Advisor)
          </h2>
          <p className="text-xs text-gray-500">पसलको वास्तविक हिसाब अनुसार व्यावहारिक सुझाव</p>
        </div>
      </div>

      {/* Recorded facts card */}
      <div className="bg-white p-3.5 rounded-2xl border border-orange-100 shadow-xs text-xs space-y-1.5">
        <div className="flex items-center justify-between font-bold text-gray-800">
          <span className="flex items-center gap-1 text-orange-950">
            <TrendingUp className="w-3.5 h-3.5 text-orange-600" />
            <span>विश्लेषण भइरहेको वास्तविक डाटा (Recorded Facts):</span>
          </span>
          <span className="text-[10px] bg-orange-50 text-orange-800 px-2 py-0.5 rounded">
            {shop.name_ne || shop.name}
          </span>
        </div>
        <p className="text-gray-600 text-[11px]">
          • बिक्री: <strong>रू {metrics.totalSales.toLocaleString('en-IN')}</strong> | खुद नाफा: <strong>रू {metrics.operatingProfit.toLocaleString('en-IN')}</strong>
        </p>
        <p className="text-gray-600 text-[11px]">
          • कच्चा पदार्थ खर्च: <strong>रू {metrics.cogs.toLocaleString('en-IN')}</strong> | घरखर्च झिकेको: <strong>रू {metrics.householdWithdrawals.toLocaleString('en-IN')}</strong>
        </p>
      </div>

      {/* Quick Prompt Chips */}
      <div>
        <label className="text-[11px] font-bold text-gray-600 block mb-1.5">
          सल्लाहकारलाई तुरुन्त सोध्नुहोस्:
        </label>
        <div className="flex flex-wrap gap-1.5">
          {quickPrompts.map((qp, idx) => (
            <button
              key={idx}
              onClick={() => {
                setPrompt(qp);
                handleAskAssistant(qp);
              }}
              className="text-left text-xs bg-white hover:bg-orange-50 text-orange-950 px-3 py-1.5 rounded-xl border border-orange-200 transition active:scale-95 shadow-xs"
            >
              💡 {qp}
            </button>
          ))}
        </div>
      </div>

      {/* Question Input */}
      <div className="flex gap-2">
        <input
          type="text"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleAskAssistant()}
          placeholder="पसल वा खानाबारे प्रश्न सोध्नुहोस्..."
          className="flex-1 px-3 py-2.5 rounded-xl bg-white border border-orange-200 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none shadow-xs"
        />
        <button
          onClick={() => handleAskAssistant()}
          disabled={isLoading || !prompt.trim()}
          className="px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs flex items-center justify-center shadow-xs active:scale-95 disabled:opacity-50"
        >
          {isLoading ? (
            <Sparkles className="w-4 h-4 animate-spin" />
          ) : (
            <Send className="w-4 h-4" />
          )}
        </button>
      </div>

      {/* Error Message */}
      {errorMsg && (
        <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* AI Advice Response Box */}
      {response && (
        <div className="bg-white rounded-2xl p-4 border-2 border-orange-200 shadow-sm space-y-3 animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-orange-100">
            <span className="text-xs font-black text-gray-900 flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-orange-600" />
              <span>सल्लाहकारको विश्लेषण (Advisor Insights)</span>
            </span>
            <span className="text-[10px] bg-orange-50 text-orange-800 px-2 py-0.5 rounded-full font-bold">
              {source === 'gemini' ? 'Gemini AI Powered' : 'Local Business Engine'}
            </span>
          </div>

          <div className="text-xs text-gray-800 leading-relaxed whitespace-pre-line space-y-2">
            {response}
          </div>

          <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-[11px] text-gray-500">
            <span className="flex items-center gap-1">
              <CheckCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>वास्तविक हिसाबमा आधारित सुझाव</span>
            </span>
            <button
              onClick={() => handleAskAssistant('थप नाफा बढाउने उपाय बताउनुहोस्')}
              className="text-orange-600 font-bold hover:underline"
            >
              थप सुझाव लिनुहोस् →
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
