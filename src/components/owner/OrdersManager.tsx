import React, { useState, useEffect } from 'react';
import { Order, OrderStatus } from '../../types';
import { updateOrderStatus } from '../../lib/storage';
import { supabase } from '../../lib/supabase';
import {
  ClipboardList,
  Phone,
  MessageCircle,
  CheckCircle,
  Clock,
  XCircle,
  ChefHat,
  Bike,
  Store,
  Search,
  Filter,
  AlertCircle,
  Check,
  RefreshCw,
} from 'lucide-react';

interface OrdersManagerProps {
  shopId: string;
  orders: Order[];
  onOrderUpdated: () => void;
}

export const OrdersManager: React.FC<OrdersManagerProps> = ({ shopId, orders, onOrderUpdated }) => {
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dateFilter, setDateFilter] = useState<'today' | 'week' | 'all'>('today');
  const [cancellationOrderId, setCancellationOrderId] = useState<string | null>(null);
  const [cancelReason, setCancelReason] = useState('');
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; isError: boolean } | null>(null);

  // Setup Supabase Realtime listener for orders (Phase 6 requirement)
  useEffect(() => {
    const client = supabase;
    if (!client || !shopId) return;

    const channel = client
      .channel(`public:orders:${shopId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders', filter: `shop_id=eq.${shopId}` },
        () => {
          onOrderUpdated();
        }
      )
      .subscribe();

    return () => {
      client.removeChannel(channel);
    };
  }, [shopId, onOrderUpdated]);

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await onOrderUpdated();
    setTimeout(() => setIsRefreshing(false), 500);
  };

  // Filter logic
  const now = new Date();
  const filteredOrders = orders.filter((order) => {
    if (selectedStatus !== 'all' && order.status !== selectedStatus) {
      return false;
    }

    const orderDate = new Date(order.created_at);
    if (dateFilter === 'today' && orderDate.toDateString() !== now.toDateString()) {
      return false;
    }
    if (dateFilter === 'week') {
      const weekAgo = new Date(now.getTime() - 7 * 86400000);
      if (orderDate < weekAgo) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchNum = order.order_number.toLowerCase().includes(q);
      const matchName = order.customer_name.toLowerCase().includes(q);
      const matchPhone = order.customer_phone.includes(q);
      if (!matchNum && !matchName && !matchPhone) return false;
    }

    return true;
  });

  const handleUpdateStatus = async (orderId: string, status: OrderStatus, reason?: string) => {
    try {
      setUpdatingId(orderId);
      setStatusMessage(null);

      const result = await updateOrderStatus(orderId, status, reason);
      if (!result.success) {
        setStatusMessage({ text: result.error || 'अर्डर स्थिति अपडेट गर्न असफल भयो।', isError: true });
        return;
      }

      setStatusMessage({
        text: `अर्डर स्थिति "${getStatusLabel(status)}" मा सफलतापूर्वक अपडेट भयो।`,
        isError: false,
      });

      if (cancellationOrderId) {
        setCancellationOrderId(null);
        setCancelReason('');
      }

      onOrderUpdated();
    } catch (err: any) {
      setStatusMessage({ text: err?.message || 'डाटाबेसमा सुरक्षित गर्न सकिएन।', isError: true });
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusLabel = (status: OrderStatus) => {
    switch (status) {
      case 'pending': return 'नयाँ / पेन्डिङ';
      case 'accepted': return 'स्वीकार भयो';
      case 'preparing': return 'तयार हुँदैछ';
      case 'ready': return 'तयार भयो';
      case 'completed': return 'सम्पन्न भयो';
      case 'cancelled': return 'रद्द गरिएको';
    }
  };

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    try {
      const d = new Date(iso);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } catch {
      return '';
    }
  };

  const getWhatsAppLink = (order: Order) => {
    const cleanPhone = order.customer_phone.replace(/[^0-9]/g, '');
    const fullPhone = cleanPhone.startsWith('977') ? cleanPhone : '977' + cleanPhone;
    const msg = `नमस्ते ${order.customer_name} जी, तपाईंको अर्डर #${order.order_number} (${order.status === 'ready' ? 'तयार भइसकेको छ' : 'स्वीकार गरिएको छ'})। सम्पर्कको लागि धन्यवाद!`;
    return `https://wa.me/${fullPhone}?text=${encodeURIComponent(msg)}`;
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-3.5 font-['Mukta',sans-serif]">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <ClipboardList className="w-5 h-5 text-orange-600" />
            <span>अर्डर व्यवस्थापन (Orders)</span>
          </h2>
          <p className="text-xs text-gray-500">कुल {filteredOrders.length} अर्डरहरू फेला परे</p>
        </div>

        {/* Refresh & Date Filter Pills */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={handleManualRefresh}
            className="p-1.5 rounded-lg bg-gray-100 hover:bg-orange-50 text-gray-600 hover:text-orange-700 transition"
            title="ताजा गर्नुहोस्"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin' : ''}`} />
          </button>

          <div className="flex bg-gray-100 p-0.5 rounded-lg text-[11px] font-bold text-gray-600">
            <button
              onClick={() => setDateFilter('today')}
              className={`px-2 py-1 rounded-md transition ${dateFilter === 'today' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
            >
              आज
            </button>
            <button
              onClick={() => setDateFilter('week')}
              className={`px-2 py-1 rounded-md transition ${dateFilter === 'week' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
            >
              हप्ता
            </button>
            <button
              onClick={() => setDateFilter('all')}
              className={`px-2 py-1 rounded-md transition ${dateFilter === 'all' ? 'bg-white text-orange-700 shadow-xs' : ''}`}
            >
              सबै
            </button>
          </div>
        </div>
      </div>

      {/* Status Notification Toast */}
      {statusMessage && (
        <div
          className={`p-2.5 rounded-xl text-xs flex items-center justify-between ${
            statusMessage.isError
              ? 'bg-rose-50 border border-rose-200 text-rose-800'
              : 'bg-emerald-50 border border-emerald-200 text-emerald-800'
          }`}
        >
          <div className="flex items-center gap-1.5">
            {statusMessage.isError ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            ) : (
              <Check className="w-4 h-4 shrink-0 text-emerald-600" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          <button onClick={() => setStatusMessage(null)} className="font-bold text-xs p-1">
            ✕
          </button>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="अर्डर #, ग्राहकको नाम वा फोन खोज्नुहोस्..."
          className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-orange-100 text-xs focus:outline-none focus:ring-2 focus:ring-orange-500"
        />
      </div>

      {/* Status Filter Horizontal Tabs */}
      <div className="flex items-center gap-1 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs font-bold">
        {[
          { id: 'all', label: 'सबै' },
          { id: 'pending', label: 'नयाँ (Pending)' },
          { id: 'accepted', label: 'स्वीकार' },
          { id: 'preparing', label: 'तयार हुँदै' },
          { id: 'ready', label: 'तयार' },
          { id: 'completed', label: 'सम्पन्न' },
          { id: 'cancelled', label: 'रद्द' },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedStatus(tab.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full transition active:scale-95 ${
              selectedStatus === tab.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders List */}
      <div className="space-y-3">
        {filteredOrders.length === 0 ? (
          <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
            <ClipboardList className="w-8 h-8 text-gray-300 mx-auto mb-2" />
            <p className="text-gray-500 text-xs font-semibold">कुनै अर्डर भेटिएन।</p>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const isUpdating = updatingId === order.id;

            return (
              <div
                key={order.id}
                className={`bg-white rounded-2xl p-4 border shadow-xs transition ${
                  order.status === 'pending'
                    ? 'border-orange-400 ring-1 ring-orange-200'
                    : 'border-orange-100'
                }`}
              >
                {/* Order Top Meta */}
                <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-sm text-gray-900">
                      #{order.order_number}
                    </span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-full flex items-center gap-1 ${
                        order.order_type === 'delivery'
                          ? 'bg-blue-100 text-blue-800'
                          : 'bg-orange-100 text-orange-800'
                      }`}
                    >
                      {order.order_type === 'delivery' ? (
                        <>
                          <Bike className="w-3 h-3" /> डेलिभरी
                        </>
                      ) : (
                        <>
                          <Store className="w-3 h-3" /> टेकअवे
                        </>
                      )}
                    </span>
                  </div>

                  <span
                    className={`text-[11px] font-extrabold px-2 py-0.5 rounded-full ${
                      order.status === 'pending'
                        ? 'bg-amber-100 text-amber-900 animate-pulse'
                        : order.status === 'preparing'
                        ? 'bg-blue-100 text-blue-900'
                        : order.status === 'ready'
                        ? 'bg-purple-100 text-purple-900'
                        : order.status === 'completed'
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-rose-100 text-rose-900'
                    }`}
                  >
                    {getStatusLabel(order.status)}
                  </span>
                </div>

                {/* Customer Info & Direct Call / WhatsApp */}
                <div className="mt-2.5 flex items-center justify-between">
                  <div>
                    <h4 className="font-bold text-xs text-gray-900">{order.customer_name}</h4>
                    <p className="text-[11px] text-gray-500">{order.customer_phone}</p>
                    {order.delivery_address && (
                      <p className="text-[11px] text-gray-600 mt-0.5 flex items-center gap-1">
                        <span>📍 {order.delivery_address}</span>
                      </p>
                    )}
                    {order.customer_notes && (
                      <p className="text-[11px] text-amber-800 bg-amber-50 px-2 py-0.5 rounded mt-1">
                        नोट: {order.customer_notes}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <a
                      href={`tel:${order.customer_phone}`}
                      className="w-8 h-8 rounded-xl bg-orange-50 text-orange-800 flex items-center justify-center hover:bg-orange-100 active:scale-95 transition"
                      title="फोन गर्नुहोस्"
                    >
                      <Phone className="w-4 h-4" />
                    </a>
                    <a
                      href={getWhatsAppLink(order)}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-800 flex items-center justify-center hover:bg-emerald-100 active:scale-95 transition"
                      title="WhatsApp म्यासेज"
                    >
                      <MessageCircle className="w-4 h-4" />
                    </a>
                  </div>
                </div>

                {/* Ordered Items List */}
                <div className="mt-2.5 bg-orange-50/40 rounded-xl p-2.5 text-xs space-y-1">
                  {order.items?.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center text-gray-800">
                      <span>
                        <strong>{item.quantity}×</strong> {item.variant_name || item.item_name}
                      </span>
                      <span className="font-semibold text-gray-900">रू {item.total_price}</span>
                    </div>
                  ))}
                  {order.delivery_fee > 0 && (
                    <div className="flex justify-between items-center text-gray-600 pt-1 border-t border-orange-100/60 text-[11px]">
                      <span>डेलिभरी शुल्क</span>
                      <span>रू {order.delivery_fee}</span>
                    </div>
                  )}
                  <div className="flex justify-between items-center pt-1 border-t border-orange-200 font-black text-xs text-gray-900">
                    <span>कुल रकम</span>
                    <span className="text-orange-600 text-sm">रू {order.total_amount}</span>
                  </div>
                </div>

                {/* Timestamps audit (Phase 6 requirement) */}
                <div className="mt-2 flex flex-wrap gap-2 text-[10px] text-gray-400">
                  <span>दर्ता: {formatTime(order.created_at)}</span>
                  {order.accepted_at && <span>• स्वीकार: {formatTime(order.accepted_at)}</span>}
                  {order.preparing_at && <span>• तयार हुँदै: {formatTime(order.preparing_at)}</span>}
                  {order.ready_at && <span>• तयार: {formatTime(order.ready_at)}</span>}
                  {order.completed_at && <span>• सम्पन्न: {formatTime(order.completed_at)}</span>}
                  {order.cancelled_at && <span>• रद्द: {formatTime(order.cancelled_at)}</span>}
                </div>

                {/* Status action buttons */}
                <div className="mt-3 pt-2 border-t border-gray-100 flex flex-wrap gap-1.5">
                  {order.status === 'pending' && (
                    <>
                      <button
                        disabled={isUpdating}
                        onClick={() => handleUpdateStatus(order.id, 'accepted')}
                        className="flex-1 py-2 px-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs active:scale-95 disabled:opacity-50"
                      >
                        स्वीकार गर्नुहोस् (Accept)
                      </button>
                      <button
                        disabled={isUpdating}
                        onClick={() => setCancellationOrderId(order.id)}
                        className="py-2 px-3 rounded-xl bg-gray-100 hover:bg-rose-100 text-gray-700 hover:text-rose-700 font-bold text-xs active:scale-95"
                      >
                        रद्द (Reject)
                      </button>
                    </>
                  )}

                  {order.status === 'accepted' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'preparing')}
                      className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <ChefHat className="w-4 h-4" />
                      <span>तयार गर्न सुरु गर्नुहोस् (Start Preparing)</span>
                    </button>
                  )}

                  {order.status === 'preparing' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'ready')}
                      className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs shadow-xs flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <CheckCircle className="w-4 h-4" />
                      <span>खाना तयार भयो (Mark Ready)</span>
                    </button>
                  )}

                  {order.status === 'ready' && (
                    <button
                      disabled={isUpdating}
                      onClick={() => handleUpdateStatus(order.id, 'completed')}
                      className="w-full py-2.5 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs shadow-md flex items-center justify-center gap-1.5 active:scale-95 disabled:opacity-50"
                    >
                      <Check className="w-4 h-4" />
                      <span>सम्पन्न भयो र पैसा उठ्यो (Complete Order)</span>
                    </button>
                  )}

                  {order.status === 'completed' && (
                    <div className="w-full text-center text-[11px] font-bold text-emerald-800 bg-emerald-50 py-1.5 rounded-lg">
                      ✓ अर्डर सम्पन्न भयो (स्टक घटाइएको छ)
                    </div>
                  )}

                  {order.status === 'cancelled' && (
                    <div className="w-full text-center text-[11px] font-bold text-rose-800 bg-rose-50 py-1.5 rounded-lg">
                      रद्द गरिएको: {order.cancellation_reason || 'कारण खुलाइएको छैन'}
                    </div>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Cancellation Reason Modal */}
      {cancellationOrderId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-sm mb-2">अर्डर रद्द गर्ने कारण लेख्नुहोस्</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="उदा: सामान सकिएको, ग्राहकले फोन नउठाएको..."
              className="w-full p-2.5 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-rose-500 focus:outline-none mb-3"
              rows={3}
            />
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setCancellationOrderId(null)}
                className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
              >
                फिर्ता
              </button>
              <button
                type="button"
                onClick={() => handleUpdateStatus(cancellationOrderId, 'cancelled', cancelReason)}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white font-bold text-xs hover:bg-rose-700"
              >
                रद्द पक्का गर्नुहोस्
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
