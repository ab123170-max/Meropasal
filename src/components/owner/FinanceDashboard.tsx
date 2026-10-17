import React, { useState } from 'react';
import {
  FinancialMetrics,
  Expense,
  HouseholdWithdrawal,
  CustomerCredit,
  Order,
} from '../../types';
import {
  calculateRealFinancialMetrics,
  deleteExpense,
  settleCreditPayment,
  addCustomerCredit,
} from '../../lib/storage';
import {
  Calculator,
  TrendingUp,
  TrendingDown,
  Info,
  AlertCircle,
  PlusCircle,
  Home,
  Users,
  CheckCircle2,
  Trash2,
  Calendar,
} from 'lucide-react';

interface FinanceDashboardProps {
  shopId: string;
  orders: Order[];
  expenses: Expense[];
  withdrawals: HouseholdWithdrawal[];
  credits: CustomerCredit[];
  onDataChanged: () => void;
  onOpenAddExpense: () => void;
  onOpenAddWithdrawal: () => void;
}

export const FinanceDashboard: React.FC<FinanceDashboardProps> = ({
  shopId,
  orders,
  expenses,
  withdrawals,
  credits,
  onDataChanged,
  onOpenAddExpense,
  onOpenAddWithdrawal,
}) => {
  const [period, setPeriod] = useState<'day' | 'week' | 'month' | 'all'>('day');
  const [activeTab, setActiveTab] = useState<'profit' | 'expenses' | 'credits'>('profit');

  // Credit settlement modal
  const [settlingCredit, setSettlingCredit] = useState<CustomerCredit | null>(null);
  const [settleAmount, setSettleAmount] = useState<number>(0);

  // New Credit modal
  const [isAddCreditOpen, setIsAddCreditOpen] = useState(false);
  const [credName, setCredName] = useState('');
  const [credPhone, setCredPhone] = useState('');
  const [credAmount, setCredAmount] = useState<number>(0);
  const [credNotes, setCredNotes] = useState('');

  const metrics: FinancialMetrics = calculateRealFinancialMetrics(orders, expenses, withdrawals, credits, period);

  const getPeriodLabel = () => {
    switch (period) {
      case 'day': return 'आजको हिसाब (Today)';
      case 'week': return 'यो हप्ताको हिसाब (This Week)';
      case 'month': return 'यो महिनाको हिसाब (This Month)';
      case 'all': return 'सबै समयको हिसाब (All Time)';
    }
  };

  const handleSettleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingCredit || settleAmount <= 0) return;
    await settleCreditPayment({
      shopId,
      creditId: settlingCredit.id,
      paymentAmount: settleAmount,
    });
    setSettlingCredit(null);
    setSettleAmount(0);
    onDataChanged();
  };

  const handleAddCreditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!credName.trim() || credAmount <= 0) return;
    await addCustomerCredit({
      shop_id: shopId,
      customer_name: credName,
      customer_phone: credPhone,
      credit_amount: credAmount,
      notes: credNotes,
    });
    setIsAddCreditOpen(false);
    setCredName('');
    setCredPhone('');
    setCredAmount(0);
    setCredNotes('');
    onDataChanged();
  };

  const handleDeleteExpenseItem = async (id: string) => {
    if (window.confirm('के तपाईं यो खर्च विवरण मेटाउन चाहनुहुन्छ?')) {
      await deleteExpense(id);
      onDataChanged();
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-3.5">
      {/* Top Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <Calculator className="w-5 h-5 text-orange-600" />
            <span>हिसाब-किताब तथा नाफा (Accounts)</span>
          </h2>
          <p className="text-xs text-gray-500">{getPeriodLabel()}</p>
        </div>

        {/* Period Switcher */}
        <div className="flex bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold text-gray-700">
          <button
            onClick={() => setPeriod('day')}
            className={`px-2 py-1 rounded-md transition ${period === 'day' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
          >
            दिन
          </button>
          <button
            onClick={() => setPeriod('week')}
            className={`px-2 py-1 rounded-md transition ${period === 'week' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
          >
            हप्ता
          </button>
          <button
            onClick={() => setPeriod('month')}
            className={`px-2 py-1 rounded-md transition ${period === 'month' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
          >
            महिना
          </button>
        </div>
      </div>

      {/* Sub-tabs: नाफा विश्लेषण | खर्च सूची | उधारो खाता */}
      <div className="flex border-b border-gray-200 text-xs font-bold">
        <button
          onClick={() => setActiveTab('profit')}
          className={`flex-1 pb-2 border-b-2 text-center transition ${
            activeTab === 'profit' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          नाफा विवरण (Profit)
        </button>
        <button
          onClick={() => setActiveTab('expenses')}
          className={`flex-1 pb-2 border-b-2 text-center transition ${
            activeTab === 'expenses' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          खर्च सूची (Expenses)
        </button>
        <button
          onClick={() => setActiveTab('credits')}
          className={`flex-1 pb-2 border-b-2 text-center transition ${
            activeTab === 'credits' ? 'border-orange-600 text-orange-600' : 'border-transparent text-gray-500'
          }`}
        >
          उधारो खाता (Credit)
        </button>
      </div>

      {/* TAB 1: PROFIT & LOSS BREAKDOWN */}
      {activeTab === 'profit' && (
        <div className="space-y-3">
          {/* Incomplete warning banner if any food lacks recipe cost */}
          {metrics.isCogsIncomplete && (
            <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-300 text-amber-900 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                <strong>सचेत:</strong> केही परिकारको रेसिपी लागत नराखिएकोले यो नाफा <strong>अनुमानित (Estimated)</strong> मात्र हो।
              </span>
            </div>
          )}

          {/* PROFIT & LOSS FORMULA CARDS (Step by Step transparency) */}
          <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs space-y-3">
            {/* 1. Net Sales */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-semibold">१. कुल बिक्री (Net Sales)</p>
                <p className="text-[10px] text-gray-400">{metrics.ordersCount} अर्डरहरू सम्पन्न</p>
              </div>
              <p className="text-base font-extrabold text-gray-900">
                रू {metrics.totalSales.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 2. COGS (Cost of ingredients used for sold food) */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-semibold">२. खाजामा लागेको कच्चा पदार्थ (COGS)</p>
                <p className="text-[10px] text-gray-400">बिक्री भएको खानाको वास्तविक लागत</p>
              </div>
              <p className="text-sm font-bold text-rose-600">
                - रू {metrics.cogs.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 3. Gross Profit */}
            <div className="bg-orange-50/70 p-3 rounded-xl flex items-center justify-between">
              <div>
                <p className="text-xs font-bold text-orange-950">
                  ३. कुल नाफा (Gross Profit)
                </p>
                <p className="text-[10px] text-orange-700">मार्जिन: {metrics.grossMargin}%</p>
              </div>
              <p className="text-base font-black text-orange-800">
                रू {metrics.grossProfit.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 4. Operating Expenses */}
            <div className="flex items-center justify-between pb-2 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-500 font-semibold">४. सञ्चालन खर्च (Operating Expenses)</p>
                <p className="text-[10px] text-gray-400">सटर भाडा, ग्यास, बत्ती, प्याकिङ आदि</p>
              </div>
              <p className="text-sm font-bold text-rose-600">
                - रू {metrics.operatingExpenses.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 5. Operating Profit (Main business bottomline) */}
            <div className="bg-emerald-50 border border-emerald-200 p-3.5 rounded-xl flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4 text-emerald-700" />
                  <p className="text-xs font-black text-emerald-950">
                    ५. खुद व्यापारिक नाफा (Operating Profit)
                  </p>
                </div>
                <p className="text-[10px] text-emerald-700">व्यापारबाट बचेको खुद नाफा</p>
              </div>
              <p className="text-lg font-black text-emerald-800">
                रू {metrics.operatingProfit.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 6. Household Withdrawals (Tracked separately per Module 4 rule!) */}
            <div className="bg-purple-50 p-3 rounded-xl border border-purple-200 flex items-center justify-between">
              <div>
                <div className="flex items-center gap-1.5 text-purple-950">
                  <Home className="w-3.5 h-3.5 text-purple-700" />
                  <p className="text-xs font-bold">घरखर्च झिकेको (Household Draw)</p>
                </div>
                <p className="text-[10px] text-purple-700 leading-tight">
                  (घरखर्च व्यापारिक खर्च होइन, व्यक्तिगत प्रयोग हो)
                </p>
              </div>
              <p className="text-sm font-black text-purple-900">
                रू {metrics.householdWithdrawals.toLocaleString('en-IN')}
              </p>
            </div>

            {/* 7. Net Cash Movement (Actual cash in register) */}
            <div className="pt-2 border-t border-gray-100 flex items-center justify-between text-xs">
              <div>
                <p className="font-bold text-gray-700">गल्लामा खुद नगद प्रवाह (Net Cash Movement)</p>
                <p className="text-[10px] text-gray-500">उठेको नगद - पसलबाट बाहिरिएको नगद</p>
              </div>
              <p className={`font-black text-sm ${metrics.netCashMovement >= 0 ? 'text-emerald-700' : 'text-rose-600'}`}>
                रू {metrics.netCashMovement.toLocaleString('en-IN')}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXPENSES LIST */}
      {activeTab === 'expenses' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-gray-700">
              जम्मा खर्च: रू {expenses.reduce((s, e) => s + e.amount, 0).toLocaleString('en-IN')}
            </span>
            <button
              onClick={onOpenAddExpense}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs shadow-xs active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>नयाँ खर्च थप्नुहोस्</span>
            </button>
          </div>

          <div className="space-y-2">
            {expenses.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-dashed">
                कुनै खर्च रेकर्ड गरिएको छैन।
              </div>
            ) : (
              expenses.map((exp) => (
                <div
                  key={exp.id}
                  className="bg-white p-3 rounded-2xl border border-orange-100 shadow-xs flex items-center justify-between text-xs"
                >
                  <div>
                    <span className="font-bold text-gray-900">{exp.description}</span>
                    <div className="flex items-center gap-2 mt-0.5 text-[11px] text-gray-500">
                      <span className="bg-orange-50 text-orange-800 px-1.5 py-0.5 rounded font-medium">
                        {exp.category_ne || exp.category}
                      </span>
                      <span>{exp.expense_date}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-rose-600 text-sm">रू {exp.amount}</span>
                    <button
                      onClick={() => handleDeleteExpenseItem(exp.id)}
                      className="p-1 rounded text-gray-400 hover:text-rose-600"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* TAB 3: CUSTOMER CREDITS (उधारो खाता) */}
      {activeTab === 'credits' && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold text-gray-700 block">
                उठ्न बाँकी कुल उधारो:
              </span>
              <span className="text-base font-black text-rose-600">
                रू {metrics.unpaidCreditTotal.toLocaleString('en-IN')}
              </span>
            </div>
            <button
              onClick={() => setIsAddCreditOpen(true)}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-orange-600 text-white font-bold text-xs shadow-xs active:scale-95"
            >
              <PlusCircle className="w-3.5 h-3.5" />
              <span>उधारो थप्नुहोस्</span>
            </button>
          </div>

          <div className="space-y-2">
            {credits.length === 0 ? (
              <div className="p-8 text-center text-xs text-gray-400 bg-white rounded-2xl border border-dashed">
                कुनै ग्राहकको उधारो बाँकी छैन।
              </div>
            ) : (
              credits.map((cred) => (
                <div
                  key={cred.id}
                  className="bg-white p-3 rounded-2xl border border-orange-100 shadow-xs text-xs space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="font-bold text-gray-900">{cred.customer_name}</h4>
                      <p className="text-[11px] text-gray-500">{cred.customer_phone}</p>
                    </div>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        cred.status === 'settled'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {cred.status === 'settled' ? 'चुक्ता भयो' : 'बाँकी'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                    <div>
                      <span className="text-gray-500 text-[11px]">बाँकी रकम: </span>
                      <strong className="text-rose-600 font-black">रू {cred.remaining_amount}</strong>
                      <span className="text-gray-400 text-[10px] ml-1.5">(कुल: रू {cred.credit_amount})</span>
                    </div>

                    {cred.status !== 'settled' && (
                      <button
                        onClick={() => {
                          setSettlingCredit(cred);
                          setSettleAmount(cred.remaining_amount);
                        }}
                        className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[11px] active:scale-95"
                      >
                        रकम बुझाउनुहोस्
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Settle Credit Modal */}
      {settlingCredit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              उधारो भुक्तानी ({settlingCredit.customer_name})
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              बाँकी रकम: रू {settlingCredit.remaining_amount}
            </p>
            <form onSubmit={handleSettleSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  बुझाएको रकम (Paid Amount रू) *
                </label>
                <input
                  type="number"
                  min="1"
                  max={settlingCredit.remaining_amount}
                  value={settleAmount || ''}
                  onChange={(e) => setSettleAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-emerald-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setSettlingCredit(null)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-emerald-600 text-white font-bold text-xs hover:bg-emerald-700"
                >
                  भुक्तानी पुष्टि गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Credit Modal */}
      {isAddCreditOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-sm mb-3">नयाँ उधारो रेकर्ड थप्नुहोस्</h3>
            <form onSubmit={handleAddCreditSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  ग्राहकको नाम *
                </label>
                <input
                  type="text"
                  required
                  value={credName}
                  onChange={(e) => setCredName(e.target.value)}
                  placeholder="उदा: रामु दाई (पसल अगाडि)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  फोन नम्बर
                </label>
                <input
                  type="tel"
                  value={credPhone}
                  onChange={(e) => setCredPhone(e.target.value)}
                  placeholder="९८XXXXXXXX"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  उधारो रकम (रू) *
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={credAmount || ''}
                  onChange={(e) => setCredAmount(Number(e.target.value))}
                  placeholder="३५०"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  कैफियत (खाएको सामान)
                </label>
                <input
                  type="text"
                  value={credNotes}
                  onChange={(e) => setCredNotes(e.target.value)}
                  placeholder="उदा: २ प्लेट मम र १ कोक"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCreditOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700"
                >
                  उधारो सेभ गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
