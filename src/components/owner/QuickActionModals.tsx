import React, { useState } from 'react';
import { Product, ExpenseCategory } from '../../types';
import { createCustomerOrder, addExpense, addHouseholdWithdrawal } from '../../lib/storage';
import { X, PlusCircle, MinusCircle, Home, CheckCircle2 } from 'lucide-react';

interface QuickSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  products: Product[];
  onSaleSaved: () => void;
}

export const QuickSaleModal: React.FC<QuickSaleModalProps> = ({
  isOpen,
  onClose,
  shopId,
  products,
  onSaleSaved,
}) => {
  const [selectedProductId, setSelectedProductId] = useState('');
  const [selectedVariantId, setSelectedVariantId] = useState('');
  const [quantity, setQuantity] = useState(1);
  const [customerName, setCustomerName] = useState('काउन्टर ग्राहक');
  const [paymentMethod, setPaymentMethod] = useState<'cash_on_pickup' | 'online_qr'>('cash_on_pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const activeProduct = products.find((p) => p.id === selectedProductId) || products[0];
  const activeVariants = activeProduct?.variants || [];
  const activeVariant = activeVariants.find((v) => v.id === selectedVariantId) || activeVariants[0];

  const effectivePrice = activeVariant ? activeVariant.price : 0;
  const totalPrice = effectivePrice * quantity;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeProduct || !activeVariant) {
      setErrorMsg('कृपया पहिले परिकार र भेरियन्ट छान्नुहोस्।');
      return;
    }

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await createCustomerOrder({
        shop_id: shopId,
        order_type: 'takeaway',
        customer_name: customerName || 'काउन्टर ग्राहक',
        customer_phone: '9800000000',
        payment_method: paymentMethod,
        items: [
          {
            variant_id: activeVariant.id,
            quantity,
          },
        ],
      });
      onSaleSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'बिक्री सेभ गर्न सकिएन।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Mukta',sans-serif]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <PlusCircle className="w-4 h-4 text-emerald-600" />
            <span>नयाँ काउन्टर बिक्री (Quick Sale)</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          {/* Select Product */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">खाना (Product):</label>
            <select
              value={activeProduct?.id || ''}
              onChange={(e) => {
                setSelectedProductId(e.target.value);
                const p = products.find((pr) => pr.id === e.target.value);
                if (p && p.variants && p.variants[0]) {
                  setSelectedVariantId(p.variants[0].id);
                }
              }}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
            >
              {products.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name_ne || p.name}
                </option>
              ))}
            </select>
          </div>

          {/* Select Variant */}
          {activeVariants.length > 0 && (
            <div>
              <label className="text-[11px] font-bold text-gray-700 block mb-1">प्रकार (Variant):</label>
              <select
                value={activeVariant?.id || ''}
                onChange={(e) => setSelectedVariantId(e.target.value)}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
              >
                {activeVariants.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.name_ne || v.name} - रू {v.price}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Quantity */}
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">संख्या (Qty):</label>
            <input
              type="number"
              min="1"
              required
              value={quantity}
              onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>

          {/* Payment Method */}
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setPaymentMethod('cash_on_pickup')}
              className={`py-2 rounded-xl border text-xs font-bold ${
                paymentMethod === 'cash_on_pickup'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              नगद (Cash)
            </button>
            <button
              type="button"
              onClick={() => setPaymentMethod('online_qr')}
              className={`py-2 rounded-xl border text-xs font-bold ${
                paymentMethod === 'online_qr'
                  ? 'bg-emerald-50 text-emerald-800 border-emerald-500'
                  : 'bg-white text-gray-600 border-gray-200'
              }`}
            >
              QR भुक्तानी
            </button>
          </div>

          <div className="p-3 bg-emerald-50 rounded-xl flex justify-between font-black text-sm text-emerald-950">
            <span>जम्मा बिक्री रकम:</span>
            <span>रू {totalPrice}</span>
          </div>

          <button
            type="submit"
            disabled={isSubmitting || !activeVariant}
            className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isSubmitting ? 'सेभ गर्दै...' : 'बिक्री सेभ गर्नुहोस् (Confirm Sale)'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface QuickExpenseModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onExpenseSaved: () => void;
}

export const QuickExpenseModal: React.FC<QuickExpenseModalProps> = ({
  isOpen,
  onClose,
  shopId,
  onExpenseSaved,
}) => {
  const [category, setCategory] = useState<ExpenseCategory>('gas_electricity');
  const [amount, setAmount] = useState<number | ''>('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0 || !description.trim()) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await addExpense({
        shop_id: shopId,
        category,
        amount: Number(amount),
        description: description.trim(),
        payment_method: 'cash',
        expense_date: new Date().toISOString().split('T')[0],
      });
      onExpenseSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'खर्च सेभ हुन सकेन।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Mukta',sans-serif]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <MinusCircle className="w-4 h-4 text-rose-600" />
            <span>नयाँ खर्च थप्नुहोस् (Add Expense)</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">खर्चको शीर्षक *</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as ExpenseCategory)}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
            >
              <option value="gas_electricity">ग्यास र बिजुली (Gas & Electricity)</option>
              <option value="rent">पसल सटर भाडा (Shop Rent)</option>
              <option value="packaging">प्याकेजिङ बक्स र झोला (Packaging)</option>
              <option value="ingredient_purchase">कच्चा पदार्थ खरिद (Ingredient Purchase)</option>
              <option value="staff_salary">कामदारको तलब (Staff Salary)</option>
              <option value="repair_maintenance">मर्मत तथा सरसफाइ (Repair)</option>
              <option value="other">अन्य विविध खर्च (Other)</option>
            </select>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">रकम (Amount रू) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="उदा: 1900"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">विवरण (Description) *</label>
            <input
              type="text"
              required
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="उदा: १ सिलिन्डर ग्यास खरिद"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold text-xs shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isSubmitting ? 'सेभ गर्दै...' : 'खर्च सेभ गर्नुहोस् (Save Expense)'}
          </button>
        </form>
      </div>
    </div>
  );
};

interface QuickWithdrawalModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onWithdrawalSaved: () => void;
}

export const QuickWithdrawalModal: React.FC<QuickWithdrawalModalProps> = ({
  isOpen,
  onClose,
  shopId,
  onWithdrawalSaved,
}) => {
  const [amount, setAmount] = useState<number | ''>('');
  const [reason, setReason] = useState('घरको दैनिक तरकारी र खाजा');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!amount || Number(amount) <= 0) return;

    try {
      setIsSubmitting(true);
      setErrorMsg('');
      await addHouseholdWithdrawal(shopId, Number(amount), reason);
      onWithdrawalSaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'घरखर्च सेभ हुन सकेन।');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Mukta',sans-serif]">
      <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
            <Home className="w-4 h-4 text-purple-600" />
            <span>घरखर्च झिकेको रेकर्ड (Household Draw)</span>
          </h3>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-[11px] text-purple-800 bg-purple-50 p-2 rounded-xl mt-2">
          💡 यो रकम व्यापारिक सञ्चालन खर्च होइन। यो गल्लाबाट व्यक्तिगत वा घरको लागि झिकिएको हो।
        </p>

        {errorMsg && (
          <div className="mt-2.5 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-3 space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">झिकिएको रकम (रू) *</label>
            <input
              type="number"
              min="1"
              required
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              placeholder="उदा: 500"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">कारण / विवरण</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="उदा: घरको तरकारी, नानीको फी"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isSubmitting ? 'सेभ गर्दै...' : 'घरखर्च सेभ गर्नुहोस् (Record Draw)'}
          </button>
        </form>
      </div>
    </div>
  );
};
