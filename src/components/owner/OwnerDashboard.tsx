import React from 'react';
import {
  Shop,
  Order,
  FinancialMetrics,
  Ingredient,
} from '../../types';
import {
  TrendingUp,
  ShoppingBag,
  AlertTriangle,
  Mic,
  PlusCircle,
  MinusCircle,
  Home as HomeIcon,
  Phone,
  Clock,
  ArrowRight,
  Boxes,
  Scale,
  Calculator,
  Flame,
  UtensilsCrossed,
  PieChart,
  CheckCircle2,
  DollarSign,
  TrendingDown,
} from 'lucide-react';

interface OwnerDashboardProps {
  shop: Shop;
  metrics: FinancialMetrics;
  orders: Order[];
  ingredients: Ingredient[];
  onOpenQuickSale: () => void;
  onOpenQuickExpense: () => void;
  onOpenVoiceEntry: () => void;
  onOpenWithdrawal: () => void;
  onNavigateToTab: (tab: 'orders' | 'finance' | 'stock' | 'menu' | 'calculator' | 'gas' | 'ai' | 'reports') => void;
}

export const OwnerDashboard: React.FC<OwnerDashboardProps> = ({
  shop,
  metrics,
  orders,
  ingredients,
  onOpenQuickSale,
  onOpenQuickExpense,
  onOpenVoiceEntry,
  onOpenWithdrawal,
  onNavigateToTab,
}) => {
  const pendingOrders = orders.filter((o) => o.status === 'pending');
  const lowStockItems = ingredients.filter((i) => i.quantity_available <= i.min_threshold);

  // Daily target example calculation (e.g., target Rs. 5000/day)
  const dailyTarget = 5000;
  const targetProgress = Math.min(100, Math.round((metrics.totalSales / dailyTarget) * 100));

  return (
    <div className="max-w-md mx-auto pb-28 px-4 pt-3 space-y-4 font-['Mukta',sans-serif]">
      {/* Welcome & Main Summary Banner */}
      <div className="bg-gradient-to-r from-[#087F5B] to-emerald-700 rounded-3xl p-5 text-white shadow-md space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-emerald-100 font-medium">नमस्ते साहुजी 🙏</p>
            <h2 className="text-lg font-black tracking-tight">{shop.name_ne || shop.name}</h2>
          </div>
          <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>LIVE ड्यासबोर्ड</span>
          </span>
        </div>

        {/* Financial Summary Cards */}
        <div className="grid grid-cols-2 gap-2.5 pt-2 border-t border-white/20">
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
            <p className="text-[11px] text-emerald-100 font-medium">आजको बिक्री (Sales)</p>
            <p className="text-xl font-black tracking-tight mt-0.5">Rs. {metrics.totalSales.toLocaleString()}</p>
          </div>
          <div className="bg-white/10 backdrop-blur rounded-2xl p-3">
            <p className="text-[11px] text-emerald-100 font-medium">आजको खर्च (Expenses)</p>
            <p className="text-xl font-black tracking-tight mt-0.5">Rs. {metrics.operatingExpenses.toLocaleString()}</p>
          </div>
        </div>

        {/* Estimated Profit & Target Progress */}
        <div className="bg-white/10 backdrop-blur rounded-2xl p-3 flex items-center justify-between">
          <div>
            <p className="text-[11px] text-emerald-100 font-medium">अनुमानित खुद नाफा (Est. Profit)</p>
            <p className={`text-lg font-black tracking-tight ${metrics.operatingProfit >= 0 ? 'text-white' : 'text-rose-200'}`}>
              Rs. {metrics.operatingProfit.toLocaleString()}
            </p>
          </div>
          <div className="text-right">
            <p className="text-[11px] text-emerald-100 font-medium">दैनिक बिक्री लक्ष्य</p>
            <p className="text-lg font-black tracking-tight text-amber-300">{targetProgress}% पूरा</p>
          </div>
        </div>
      </div>

      {/* Pending Orders Alert Banner if any */}
      {pendingOrders.length > 0 && (
        <div
          onClick={() => onNavigateToTab('orders')}
          className="bg-orange-50 border border-orange-200 rounded-2xl p-3.5 flex items-center justify-between cursor-pointer shadow-xs hover:bg-orange-100 transition"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-orange-600 text-white flex items-center justify-center font-black animate-bounce">
              {pendingOrders.length}
            </div>
            <div>
              <p className="text-xs font-black text-gray-900">नयाँ ग्राहक अर्डरहरू आएका छन्!</p>
              <p className="text-[11px] text-orange-800">स्वीकार गर्न यहाँ क्लिक गर्नुहोस्</p>
            </div>
          </div>
          <ArrowRight className="w-5 h-5 text-orange-600" />
        </div>
      )}

      {/* QUICK ACTION GRID (1-tap access to core tools) */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          द्रुत कार्यहरू (Quick Actions)
        </h3>
        <div className="grid grid-cols-3 gap-2.5">
          <button
            onClick={onOpenQuickSale}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-[#087F5B] flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-[#087F5B] flex items-center justify-center group-hover:bg-[#087F5B] group-hover:text-white transition">
              <PlusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">नयाँ बिक्री</span>
          </button>

          <button
            onClick={onOpenQuickExpense}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-rose-500 flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center group-hover:bg-rose-600 group-hover:text-white transition">
              <MinusCircle className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">नयाँ खर्च</span>
          </button>

          <button
            onClick={() => onNavigateToTab('calculator')}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-orange-500 flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-orange-50 text-orange-600 flex items-center justify-center group-hover:bg-orange-600 group-hover:text-white transition">
              <Scale className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">रेसिपी लागत</span>
          </button>

          <button
            onClick={() => onNavigateToTab('gas')}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-amber-500 flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center group-hover:bg-amber-600 group-hover:text-white transition">
              <Flame className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">ग्यास ट्र्याकर</span>
          </button>

          <button
            onClick={() => onNavigateToTab('menu')}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-blue-500 flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition">
              <UtensilsCrossed className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">मेनु तथा परिकार</span>
          </button>

          <button
            onClick={() => onNavigateToTab('finance')}
            className="bg-white rounded-2xl p-3 border border-gray-200 shadow-xs hover:border-purple-500 flex flex-col items-center justify-center text-center gap-2 group active:scale-95 transition"
          >
            <div className="w-11 h-11 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center group-hover:bg-purple-600 group-hover:text-white transition">
              <PieChart className="w-5 h-5 stroke-[2.2]" />
            </div>
            <span className="text-xs font-bold text-gray-800 leading-tight">हिसाब रिपोर्ट्स</span>
          </button>
        </div>
      </div>

      {/* Voice Entry & Household Withdrawal Buttons */}
      <div className="grid grid-cols-2 gap-2.5 pt-1">
        <button
          onClick={onOpenVoiceEntry}
          className="p-3.5 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-sm flex items-center gap-2 border border-amber-300 active:scale-97 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-amber-600 text-white flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="leading-tight font-black">आवाजबाट इन्ट्री</p>
            <p className="text-[10px] font-medium text-amber-900">Voice Record</p>
          </div>
        </button>

        <button
          onClick={onOpenWithdrawal}
          className="p-3.5 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs shadow-sm flex items-center gap-2 border border-purple-200 active:scale-97 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-purple-600 text-white flex items-center justify-center shrink-0">
            <HomeIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="leading-tight font-black">घरखर्च झिकेको</p>
            <p className="text-[10px] font-medium text-purple-700">Household Draw</p>
          </div>
        </button>
      </div>
    </div>
  );
};
