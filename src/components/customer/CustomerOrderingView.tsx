import React, { useState } from 'react';
import {
  Shop,
  Category,
  Product,
  ProductVariant,
  Order,
  PaymentMethod,
} from '../../types';
import { createOrder } from '../../lib/storage';
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Phone,
  MessageCircle,
  Clock,
  CheckCircle2,
  Bike,
  Store,
  QrCode,
  AlertCircle,
  ChevronRight,
  Search,
} from 'lucide-react';

interface CustomerOrderingViewProps {
  shop: Shop;
  categories: Category[];
  products: Product[];
  onOrderCreated?: (order: Order) => void;
}

interface CartItem {
  product: Product;
  variant: ProductVariant;
  quantity: number;
}

export const CustomerOrderingView: React.FC<CustomerOrderingViewProps> = ({
  shop,
  categories,
  products,
  onOrderCreated,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeModalProduct, setActiveModalProduct] = useState<Product | null>(null);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [modalQuantity, setModalQuantity] = useState(1);

  // Checkout modal
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [orderType, setOrderType] = useState<'takeaway' | 'delivery'>('takeaway');
  const [customerName, setCustomerName] = useState('');
  const [customerPhone, setCustomerPhone] = useState('');
  const [deliveryAddress, setDeliveryAddress] = useState('');
  const [customerNotes, setCustomerNotes] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('cash_on_pickup');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');

  // Active placed order view
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);

  // Filter products
  const activeProducts = products.filter((p) => {
    if (!p.is_active) return false;
    const matchesCategory = selectedCategoryId === 'all' || p.category_id === selectedCategoryId;
    const matchesSearch =
      !searchQuery ||
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.name_ne && p.name_ne.includes(searchQuery));
    return matchesCategory && matchesSearch;
  });

  const cartTotalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.variant.price * item.quantity, 0);
  const deliveryFee = orderType === 'delivery' ? shop.delivery_fee : 0;
  const cartGrandTotal = cartSubtotal + deliveryFee;

  // Handle open variant selection modal
  const handleOpenProduct = (product: Product) => {
    setActiveModalProduct(product);
    const availableVariants = product.variants?.filter((v) => v.is_available) || [];
    setSelectedVariant(availableVariants[0] || null);
    setModalQuantity(1);
  };

  // Add to cart from modal
  const handleAddToCart = () => {
    if (!activeModalProduct || !selectedVariant) return;

    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) => item.product.id === activeModalProduct.id && item.variant.id === selectedVariant.id
      );

      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += modalQuantity;
        return next;
      } else {
        return [...prev, { product: activeModalProduct, variant: selectedVariant, quantity: modalQuantity }];
      }
    });

    setActiveModalProduct(null);
  };

  // Update cart item quantity
  const updateCartQuantity = (variantId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((item) => {
          if (item.variant.id === variantId) {
            const nextQty = item.quantity + delta;
            return nextQty > 0 ? { ...item, quantity: nextQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[];
    });
  };

  // Place order
  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError('');

    if (!customerName.trim()) {
      setSubmitError('कृपया तपाईंको नाम लेख्नुहोस् (Enter your name).');
      return;
    }
    if (!customerPhone.trim() || customerPhone.length < 8) {
      setSubmitError('कृपया सही मोबाइल नम्बर लेख्नुहोस् (Enter valid phone number).');
      return;
    }
    if (orderType === 'delivery' && !deliveryAddress.trim()) {
      setSubmitError('डेलिभरीको लागि ठेगाना लेख्नुहोस् (Delivery address required).');
      return;
    }
    if (orderType === 'delivery' && cartSubtotal < shop.min_order_for_delivery) {
      setSubmitError(`डेलिभरीको लागि न्यूनतम अर्डर रू ${shop.min_order_for_delivery} हुनुपर्छ।`);
      return;
    }

    try {
      setIsSubmitting(true);
      const newOrder = await createOrder({
        shop_id: shop.id,
        order_type: orderType,
        customer_name: customerName,
        customer_phone: customerPhone,
        delivery_address: deliveryAddress,
        customer_notes: customerNotes,
        items: cart.map((item) => ({
          product_id: item.product.id,
          variant_id: item.variant.id,
          item_name: item.product.name_ne || item.product.name,
          variant_name: item.variant.name_ne || item.variant.name,
          unit_price: item.variant.price,
          quantity: item.quantity,
        })),
        payment_method: paymentMethod,
      });

      setActiveOrder(newOrder);
      setCart([]);
      setIsCheckoutOpen(false);
      if (onOrderCreated) {
        onOrderCreated(newOrder);
      }
    } catch (err: any) {
      setSubmitError(err?.message || 'अर्डर पठाउन सकिएन। कृपया फेरि प्रयास गर्नुहोस्।');
    } finally {
      setIsSubmitting(false);
    }
  };

  // WhatsApp link generator
  const getWhatsAppLink = (order: Order) => {
    const phone = shop.whatsapp_number || shop.phone;
    const cleanPhone = phone.replace(/[^0-9]/g, '');
    const itemsList = order.items.map((i) => `• ${i.variant_name} x ${i.quantity} = रू ${i.total_price}`).join('\n');
    const msg = `नमस्ते ${shop.name_ne || shop.name}!\nमेरो नयाँ अर्डर #${order.order_number}:\n\n${itemsList}\n\nजम्मा रकम: रू ${order.total_amount}\nप्रकार: ${order.order_type === 'delivery' ? 'डेलिभरी' : 'टेकअवे'}\nग्राहक: ${order.customer_name} (${order.customer_phone})\nठेगाना: ${order.delivery_address || 'पसलबाट उठाउने'}`;
    return `https://wa.me/${cleanPhone.startsWith('977') ? cleanPhone : '977' + cleanPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3">
      {/* Active Placed Order Tracker Banner */}
      {activeOrder && (
        <div className="mb-4 bg-orange-50 border-2 border-orange-300 rounded-2xl p-4 shadow-sm animate-fadeIn">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-orange-800 bg-orange-200 px-2 py-0.5 rounded-md">
              अर्डर #{activeOrder.order_number}
            </span>
            <span className="text-xs font-semibold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-600" />
              {activeOrder.status === 'pending'
                ? 'पेन्डिङ (पसलले हेर्दैछ)'
                : activeOrder.status === 'accepted'
                ? 'स्वीकार भयो'
                : activeOrder.status === 'preparing'
                ? 'तयार हुँदैछ'
                : activeOrder.status === 'ready'
                ? 'तयार भयो'
                : 'सम्पन्न'}
            </span>
          </div>

          <h3 className="font-bold text-gray-900 mt-2 text-base">
            तपाईंको अर्डर पसलमा पुग्यो!
          </h3>
          <p className="text-xs text-gray-600 mt-0.5">
            कुल रकम: <strong>रू {activeOrder.total_amount}</strong> ({activeOrder.order_type === 'delivery' ? 'डेलिभरी' : 'पसलबाट लैजाने'})
          </p>

          {/* Quick WhatsApp Contact */}
          <div className="mt-3 flex gap-2">
            <a
              href={getWhatsAppLink(activeOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-emerald-600 text-white font-semibold text-xs shadow-xs hover:bg-emerald-700 active:scale-95 transition"
            >
              <MessageCircle className="w-4 h-4" />
              <span>पसललाई WhatsApp म्यासेज</span>
            </a>
            <a
              href={`tel:${shop.phone}`}
              className="flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gray-100 text-gray-800 font-semibold text-xs hover:bg-gray-200 active:scale-95 transition"
            >
              <Phone className="w-4 h-4" />
              <span>फोन</span>
            </a>
          </div>
        </div>
      )}

      {/* Shop Info Card */}
      <div className="bg-white rounded-2xl p-4 shadow-xs border border-orange-100 mb-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-black text-gray-900 leading-tight">
              {shop.name_ne || shop.name}
            </h2>
            <p className="text-xs text-gray-600 mt-0.5 leading-snug">
              {shop.tagline || 'स्वादिलो खाजा, ताजा परिकार'}
            </p>
            <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
              <span>📍 {shop.address}, {shop.city}</span>
            </p>
          </div>
          <div className="flex flex-col items-end shrink-0">
            <span
              className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                shop.is_open ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
              }`}
            >
              {shop.is_open ? 'पसल खुला छ' : 'पसल बन्द छ'}
            </span>
            <span className="text-[10px] text-gray-500 mt-1">
              डेलिभरी: रू {shop.delivery_fee}
            </span>
          </div>
        </div>

        {/* Quick Contact buttons */}
        <div className="mt-3 pt-3 border-t border-orange-50 flex items-center gap-2">
          <a
            href={`tel:${shop.phone}`}
            className="flex-1 py-1.5 px-3 rounded-lg bg-orange-50 text-orange-900 font-semibold text-xs flex items-center justify-center gap-1.5"
          >
            <Phone className="w-3.5 h-3.5 text-orange-600" />
            <span>{shop.phone}</span>
          </a>
          {shop.whatsapp_number && (
            <a
              href={`https://wa.me/${shop.whatsapp_number.replace(/[^0-9]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="py-1.5 px-3 rounded-lg bg-emerald-50 text-emerald-900 font-semibold text-xs flex items-center justify-center gap-1.5"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp</span>
            </a>
          )}
        </div>
      </div>

      {/* Search Input */}
      <div className="relative mb-3">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="खाना वा परिकार खोज्नुहोस् (उदा: चटपटे, मम)..."
          className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white border border-orange-100 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
        {searchQuery && (
          <button
            onClick={() => setSearchQuery('')}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Category Pills Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 scrollbar-none mb-3 -mx-4 px-4">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
            selectedCategoryId === 'all'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
          }`}
        >
          सबै (All)
        </button>
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategoryId(cat.id)}
            className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-bold transition active:scale-95 ${
              selectedCategoryId === cat.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
            }`}
          >
            {cat.name_ne || cat.name}
          </button>
        ))}
      </div>

      {/* Food Products Grid/List */}
      <div className="space-y-3">
        {activeProducts.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-300">
            <p className="text-gray-500 text-sm">कुनै परिकार भेटिएन।</p>
          </div>
        ) : (
          activeProducts.map((product) => {
            const availableVariants = product.variants?.filter((v) => v.is_available) || [];
            const minPrice = availableVariants.length > 0 ? Math.min(...availableVariants.map((v) => v.price)) : 0;
            const maxPrice = availableVariants.length > 0 ? Math.max(...availableVariants.map((v) => v.price)) : 0;

            return (
              <div
                key={product.id}
                onClick={() => handleOpenProduct(product)}
                className="bg-white rounded-2xl p-3 border border-orange-100 shadow-xs flex gap-3 cursor-pointer hover:border-orange-300 transition active:scale-[0.99]"
              >
                {/* Food Image */}
                <div className="w-24 h-24 rounded-xl overflow-hidden bg-orange-50 shrink-0 relative">
                  <img
                    src={product.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                    alt={product.name}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                  {availableVariants.length > 1 && (
                    <span className="absolute bottom-1 right-1 bg-black/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-md">
                      {availableVariants.length} भेरियन्ट
                    </span>
                  )}
                </div>

                {/* Details */}
                <div className="flex-1 flex flex-col justify-between min-w-0">
                  <div>
                    <h3 className="font-bold text-gray-900 text-sm truncate">
                      {product.name_ne || product.name}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mt-0.5">
                      {product.description || 'ताजा र स्वादिष्ट नेपाली स्वाद'}
                    </p>
                  </div>

                  <div className="flex items-center justify-between mt-2 pt-1">
                    <div>
                      <span className="text-sm font-extrabold text-orange-600">
                        {minPrice === maxPrice ? `रू ${minPrice}` : `रू ${minPrice} - ${maxPrice}`}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleOpenProduct(product);
                      }}
                      className="px-3 py-1 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold flex items-center gap-1 shadow-xs active:scale-95"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>थप्नुहोस्</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Product Variant & Quantity Modal */}
      {activeModalProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[85vh] overflow-y-auto">
            <div className="flex items-start justify-between pb-3 border-b border-gray-100">
              <div>
                <h3 className="font-bold text-gray-900 text-base">
                  {activeModalProduct.name_ne || activeModalProduct.name}
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  भेरियन्ट र परिमाण रोज्नुहोस् (Select Variant)
                </p>
              </div>
              <button
                onClick={() => setActiveModalProduct(null)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Variants Radio List */}
            <div className="mt-4 space-y-2">
              <label className="text-xs font-bold text-gray-700 block">
                परिकारको प्रकार (Variant):
              </label>
              {(activeModalProduct.variants || []).map((variant) => {
                const isSelected = selectedVariant?.id === variant.id;
                return (
                  <div
                    key={variant.id}
                    onClick={() => setSelectedVariant(variant)}
                    className={`flex items-center justify-between p-3 rounded-xl border cursor-pointer transition ${
                      isSelected
                        ? 'border-orange-600 bg-orange-50/60 ring-1 ring-orange-500'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <div
                        className={`w-4 h-4 rounded-full border-2 flex items-center justify-center ${
                          isSelected ? 'border-orange-600 bg-orange-600' : 'border-gray-300'
                        }`}
                      >
                        {isSelected && <div className="w-1.5 h-1.5 rounded-full bg-white" />}
                      </div>
                      <span className="text-sm font-semibold text-gray-800">
                        {variant.name_ne || variant.name}
                      </span>
                    </div>
                    <span className="text-sm font-bold text-orange-700">
                      रू {variant.price}
                    </span>
                  </div>
                );
              })}
            </div>

            {/* Quantity Selector */}
            <div className="mt-5 flex items-center justify-between bg-orange-50/50 p-3 rounded-xl border border-orange-100">
              <span className="text-xs font-bold text-gray-700">संख्या (Quantity):</span>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white border border-orange-200 text-orange-800 flex items-center justify-center font-bold active:scale-95"
                >
                  <Minus className="w-4 h-4" />
                </button>
                <span className="w-6 text-center font-bold text-base text-gray-900">
                  {modalQuantity}
                </span>
                <button
                  type="button"
                  onClick={() => setModalQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-orange-600 text-white flex items-center justify-center font-bold active:scale-95"
                >
                  <Plus className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Total and Add to Cart button */}
            <div className="mt-5 pt-3 border-t border-gray-100 flex items-center justify-between gap-3">
              <div>
                <p className="text-[11px] text-gray-500">जम्मा रकम</p>
                <p className="text-lg font-black text-orange-600">
                  रू {(selectedVariant ? selectedVariant.price * modalQuantity : 0)}
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!selectedVariant}
                className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-sm shadow-md active:scale-98 transition disabled:opacity-50"
              >
                झोलामा हाल्नुहोस् (Add to Cart)
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Floating Bottom Cart Bar */}
      {cart.length > 0 && !isCheckoutOpen && (
        <div className="fixed bottom-3 left-4 right-4 z-40 max-w-md mx-auto">
          <button
            onClick={() => setIsCheckoutOpen(true)}
            className="w-full bg-emerald-800 hover:bg-emerald-900 text-white rounded-2xl p-3.5 shadow-xl flex items-center justify-between active:scale-[0.99] transition border border-emerald-700"
          >
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-emerald-700 flex items-center justify-center">
                <ShoppingBag className="w-4 h-4 text-white" />
              </div>
              <div className="text-left">
                <p className="text-xs font-bold leading-tight">
                  {cartTotalItems} वटा परिकार (Items)
                </p>
                <p className="text-[11px] text-emerald-200">
                  अर्डर पुरा गर्न थिच्नुहोस्
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-base font-black">रू {cartSubtotal}</span>
              <ChevronRight className="w-5 h-5 text-emerald-300" />
            </div>
          </button>
        </div>
      )}

      {/* Checkout Modal */}
      {isCheckoutOpen && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-orange-600" />
                <span>अर्डर पुष्टि गर्नुहोस् (Checkout)</span>
              </h3>
              <button
                onClick={() => setIsCheckoutOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Error Message */}
            {submitError && (
              <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{submitError}</span>
              </div>
            )}

            {/* Cart Items Review */}
            <div className="mt-3 divide-y divide-gray-100 max-h-40 overflow-y-auto pr-1">
              {cart.map((item) => (
                <div key={item.variant.id} className="py-2.5 flex items-center justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-bold text-xs text-gray-900 truncate">
                      {item.variant.name_ne || item.variant.name}
                    </p>
                    <p className="text-[11px] text-gray-500">
                      रू {item.variant.price} × {item.quantity} = रू {item.variant.price * item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.variant.id, -1)}
                      className="w-6 h-6 rounded bg-gray-100 text-gray-700 flex items-center justify-center font-bold"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-xs font-bold w-4 text-center">{item.quantity}</span>
                    <button
                      type="button"
                      onClick={() => updateCartQuantity(item.variant.id, 1)}
                      className="w-6 h-6 rounded bg-orange-100 text-orange-800 flex items-center justify-center font-bold"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <form onSubmit={handlePlaceOrder} className="mt-4 space-y-3.5">
              {/* Takeaway vs Delivery Toggle */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  अर्डरको प्रकार (Order Type):
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('takeaway');
                      setPaymentMethod('cash_on_pickup');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderType === 'takeaway'
                        ? 'border-orange-600 bg-orange-50 text-orange-800 ring-1 ring-orange-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Store className="w-4 h-4 text-orange-600" />
                    <span>पसलबाट लैजाने (Takeaway)</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setOrderType('delivery');
                      setPaymentMethod('cash_on_delivery');
                    }}
                    className={`py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-center gap-1.5 transition ${
                      orderType === 'delivery'
                        ? 'border-orange-600 bg-orange-50 text-orange-800 ring-1 ring-orange-500'
                        : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                    }`}
                  >
                    <Bike className="w-4 h-4 text-emerald-600" />
                    <span>डेलिभरी (+ रू {shop.delivery_fee})</span>
                  </button>
                </div>
              </div>

              {/* Customer Name & Phone */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    तपाईंको नाम (Name) *
                  </label>
                  <input
                    type="text"
                    required
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="उदा: राजु श्रेष्ठ"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    फोन नम्बर (Phone) *
                  </label>
                  <input
                    type="tel"
                    required
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="९८XXXXXXXX"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              {/* Delivery Address (only if delivery) */}
              {orderType === 'delivery' && (
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    डेलिभरी ठेगाना (Delivery Address) *
                  </label>
                  <input
                    type="text"
                    required
                    value={deliveryAddress}
                    onChange={(e) => setDeliveryAddress(e.target.value)}
                    placeholder="उदा: न्युरोड, पिपलबोट नजिकै, २ तला"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              )}

              {/* Special Note */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  थप भन्नुपर्ने कुरा (Special Instructions - ऐच्छिक)
                </label>
                <input
                  type="text"
                  value={customerNotes}
                  onChange={(e) => setCustomerNotes(e.target.value)}
                  placeholder="उदा: अलि बढी पिरो, प्याज कम"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Payment Method */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  भुक्तानी तरिका (Payment Method):
                </label>
                <div className="space-y-1.5">
                  <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 text-xs cursor-pointer hover:bg-gray-50">
                    <input
                      type="radio"
                      name="payment"
                      checked={paymentMethod === (orderType === 'delivery' ? 'cash_on_delivery' : 'cash_on_pickup')}
                      onChange={() => setPaymentMethod(orderType === 'delivery' ? 'cash_on_delivery' : 'cash_on_pickup')}
                      className="text-orange-600 focus:ring-orange-500"
                    />
                    <span className="font-semibold text-gray-800">
                      {orderType === 'delivery' ? 'डेलिभरीमा नगद (Cash on Delivery)' : 'पसलमा नगद (Cash on Pickup)'}
                    </span>
                  </label>

                  {shop.is_online_payment_enabled && (
                    <label className="flex items-center gap-2 p-2 rounded-lg border border-gray-200 text-xs cursor-pointer hover:bg-gray-50">
                      <input
                        type="radio"
                        name="payment"
                        checked={paymentMethod === 'online_qr'}
                        onChange={() => setPaymentMethod('online_qr')}
                        className="text-orange-600 focus:ring-orange-500"
                      />
                      <span className="font-semibold text-gray-800 flex items-center gap-1.5">
                        <QrCode className="w-3.5 h-3.5 text-emerald-600" />
                        <span>अनलाइन QR भुक्तानी (eSewa / Khalti)</span>
                      </span>
                    </label>
                  )}
                </div>
              </div>

              {/* Online QR Preview if selected */}
              {paymentMethod === 'online_qr' && shop.online_payment_qr_url && (
                <div className="p-3 rounded-xl bg-orange-50 border border-orange-200 text-center">
                  <p className="text-[11px] font-bold text-orange-900 mb-1.5">
                    {shop.online_payment_instructions || 'QR स्क्यान गरी रकम पठाउनुहोस्:'}
                  </p>
                  <img
                    src={shop.online_payment_qr_url}
                    alt="Payment QR"
                    className="w-32 h-32 mx-auto rounded-lg object-contain bg-white p-1 border shadow-xs"
                  />
                </div>
              )}

              {/* Total Calculation breakdown */}
              <div className="pt-2 border-t border-gray-100 text-xs space-y-1">
                <div className="flex justify-between text-gray-600">
                  <span>खाजाको जम्मा रकम:</span>
                  <span>रू {cartSubtotal}</span>
                </div>
                {orderType === 'delivery' && (
                  <div className="flex justify-between text-gray-600">
                    <span>डेलिभरी शुल्क:</span>
                    <span>रू {deliveryFee}</span>
                  </div>
                )}
                <div className="flex justify-between font-black text-sm text-gray-900 pt-1 border-t">
                  <span>कुल बुझाउनुपर्ने:</span>
                  <span className="text-orange-600">रू {cartGrandTotal}</span>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md active:scale-98 transition disabled:opacity-50"
              >
                {isSubmitting ? 'अर्डर पठाउँदै...' : 'अर्डर पक्का गर्नुहोस् (Confirm Order)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
