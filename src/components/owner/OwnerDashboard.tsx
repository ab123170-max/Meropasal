import React, { useState } from 'react';
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
  onNavigateToTab: (tab: 'orders' | 'finance' | 'stock' | 'menu' | 'ai') => void;
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
  const preparingOrders = orders.filter((o) => o.status === 'preparing');
  const lowStockItems = ingredients.filter((i) => i.quantity_available <= i.min_threshold);

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-4 text-white shadow-md">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs text-orange-100 font-medium">नमस्ते साहुजी 🙏</p>
            <h2 className="text-lg font-black tracking-tight">{shop.name_ne || shop.name}</h2>
          </div>
          <span className="bg-white/20 backdrop-blur text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
            आजको स्थिति
          </span>
        </div>

        {/* Quick Sales & Profit Numbers */}
        <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-white/20">
          <div>
            <p className="text-[11px] text-orange-100">आजको जम्मा बिक्री (Sales)</p>
            <p className="text-xl font-black tracking-tight">रू {metrics.totalSales.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <div className="flex items-center gap-1">
              <p className="text-[11px] text-orange-100">खुद व्यापारिक नाफा</p>
              {metrics.isCogsIncomplete && (
                <span className="text-[9px] bg-amber-400 text-amber-950 px-1 rounded font-bold" title="अनुमानित नाफा">
                  अनुमानित
                </span>
              )}
            </div>
            <p className={`text-xl font-black tracking-tight ${metrics.operatingProfit >= 0 ? 'text-white' : 'text-rose-200'}`}>
              रू {metrics.operatingProfit.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* BIG PRIMARY TOUCH BUTTONS (Android friendly thumb zone) */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenQuickSale}
          className="p-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md flex items-center gap-2.5 active:scale-97 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-emerald-700 flex items-center justify-center shrink-0">
            <PlusCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="leading-tight">नयाँ बिक्री</p>
            <p className="text-[10px] font-normal text-emerald-100">Add Sale</p>
          </div>
        </button>

        <button
          onClick={onOpenQuickExpense}
          className="p-3.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-sm shadow-md flex items-center gap-2.5 active:scale-97 transition"
        >
          <div className="w-8 h-8 rounded-xl bg-rose-700 flex items-center justify-center shrink-0">
            <MinusCircle className="w-5 h-5 text-white" />
          </div>
          <div className="text-left">
            <p className="leading-tight">नयाँ खर्च</p>
            <p className="text-[10px] font-normal text-rose-100">Add Expense</p>
          </div>
        </button>
      </div>

      {/* SECONDARY ACTION BUTTONS: Voice Entry & Household Draw */}
      <div className="grid grid-cols-2 gap-2.5">
        <button
          onClick={onOpenVoiceEntry}
          className="p-3 rounded-2xl bg-amber-500 hover:bg-amber-600 text-amber-950 font-bold text-xs shadow-sm flex items-center gap-2 border border-amber-300 active:scale-97 transition"
        >
          <div className="w-7 h-7 rounded-lg bg-amber-600 text-white flex items-center justify-center shrink-0">
            <Mic className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="leading-tight">आवाजबाट इन्ट्री</p>
            <p className="text-[9px] font-medium text-amber-900">Voice Record</p>
          </div>
        </button>

        <button
          onClick={onOpenWithdrawal}
          className="p-3 rounded-2xl bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs shadow-sm flex items-center gap-2 border border-purple-200 active:scale-97 transition"
        >
          <div className="w-7 h-7 rounded-lg bg-purple-600 text-white flex items-center justify-center shrink-0">
            <HomeIcon className="w-4 h-4" />
          </div>
          <div className="text-left">
            <p className="leading-tight">घरखर्च झिकेको</p>
            <p className="text-[9px] font-medium text-purple-700">Household Draw</p>
          </div>
        </button>
      </div>

      {/* PENDING ORDERS ALERT CARD */}
      {pendingOrders.length > 0 && (
        <div className="bg-orange-50 border-2 border-orange-400 rounded-2xl p-4 shadow-sm animate-pulse-subtle">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 animate-ping" />
              <h3 className="font-bold text-orange-950 text-sm">
                {pendingOrders.length} वटा नयाँ अर्डर आएको छ!
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('orders')}
              className="text-xs font-bold text-orange-700 flex items-center gap-0.5 hover:underline"
            >
              <span>हेर्नुहोस्</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="mt-2.5 space-y-1.5">
            {pendingOrders.slice(0, 2).map((order) => (
              <div
                key={order.id}
                onClick={() => onNavigateToTab('orders')}
                className="bg-white p-2.5 rounded-xl border border-orange-200 flex items-center justify-between text-xs cursor-pointer hover:bg-orange-50/50"
              >
                <div>
                  <span className="font-extrabold text-gray-900">#{order.order_number}</span>
                  <span className="text-gray-500 ml-1.5 font-medium">{order.customer_name}</span>
                  <p className="text-[10px] text-gray-500">
                    {order.items.map((i) => `${i.variant_name} x ${i.quantity}`).join(', ')}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-black text-orange-600">रू {order.total_amount}</p>
                  <p className="text-[10px] text-gray-500">{order.order_type === 'delivery' ? 'डेलिभरी' : 'टेकअवे'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* LOW STOCK WARNING CARD */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3.5 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <h3 className="font-bold text-xs">
                {lowStockItems.length} वटा कच्चा पदार्थ सकिन लाग्यो (Low Stock)
              </h3>
            </div>
            <button
              onClick={() => onNavigateToTab('stock')}
              className="text-xs font-bold text-amber-800 hover:underline"
            >
              सामान थप्नुहोस्
            </button>
          </div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {lowStockItems.map((item) => (
              <span
                key={item.id}
                className="bg-white px-2 py-0.5 rounded-lg border border-amber-200 text-[11px] font-semibold text-amber-900"
              >
                {item.name_ne || item.name}: <strong>{item.quantity_available} {item.unit}</strong> बाँकी
              </span>
            ))}
          </div>
        </div>
      )}

      {/* QUICK FINANCIAL OVERVIEW METRICS */}
      <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <TrendingUp className="w-4 h-4 text-emerald-600" />
            <span>आजको आर्थिक विवरण (Financial Summary)</span>
          </h3>
          <button
            onClick={() => onNavigateToTab('finance')}
            className="text-xs text-orange-600 font-semibold hover:underline"
          >
            पूर्ण विवरण
          </button>
        </div>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
            <p className="text-gray-500 text-[10px]">कच्चा पदार्थ लागत (COGS)</p>
            <p className="font-bold text-gray-800 mt-0.5">रू {metrics.cogs.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-orange-50/60 p-2.5 rounded-xl border border-orange-100">
            <p className="text-gray-500 text-[10px]">सञ्चालन खर्च (Operating Exp)</p>
            <p className="font-bold text-gray-800 mt-0.5">रू {metrics.operatingExpenses.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-purple-50/60 p-2.5 rounded-xl border border-purple-100">
            <p className="text-purple-700 text-[10px]">घरखर्च झिकेको (Drawings)</p>
            <p className="font-bold text-purple-900 mt-0.5">रू {metrics.householdWithdrawals.toLocaleString('en-IN')}</p>
          </div>

          <div className="bg-emerald-50/60 p-2.5 rounded-xl border border-emerald-100">
            <p className="text-emerald-700 text-[10px]">गल्लामा खुद नगद (Net Cash)</p>
            <p className={`font-bold mt-0.5 ${metrics.netCashMovement >= 0 ? 'text-emerald-900' : 'text-rose-600'}`}>
              रू {metrics.netCashMovement.toLocaleString('en-IN')}
            </p>
          </div>
        </div>
      </div>

      {/* QUICK AI ADVISOR TIP CHIP */}
      <div
        onClick={() => onNavigateToTab('ai')}
        className="bg-gradient-to-r from-amber-50 to-orange-50 p-3.5 rounded-2xl border border-amber-200 shadow-xs flex items-center justify-between cursor-pointer hover:bg-orange-100/50 transition"
      >
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-xs shrink-0">
            AI
          </div>
          <div>
            <p className="font-bold text-xs text-gray-900">मीठो सल्लाहकार (AI Business Advisor)</p>
            <p className="text-[11px] text-gray-600">
              बढी नाफा हुने खाना र खर्च घटाउने उपाय हेर्नुहोस्।
            </p>
          </div>
        </div>
        <ArrowRight className="w-4 h-4 text-orange-600 shrink-0" />
      </div>
    </div>
  );
};
