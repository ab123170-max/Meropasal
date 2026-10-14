import React, { useState } from 'react';
import { Shop } from '../../types';
import { updateShop, initLocalStorageDemo } from '../../lib/storage';
import { isSupabaseConfigured, getSupabaseConfigStatus } from '../../lib/supabase';
import {
  Settings,
  Store,
  Bike,
  QrCode,
  Database,
  Check,
  AlertCircle,
  Copy,
  ExternalLink,
  RotateCcw,
} from 'lucide-react';

interface ShopSettingsProps {
  shop: Shop;
  onShopUpdated: () => void;
}

export const ShopSettings: React.FC<ShopSettingsProps> = ({ shop, onShopUpdated }) => {
  const [formData, setFormData] = useState<Partial<Shop>>({ ...shop });
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [copiedSQL, setCopiedSQL] = useState(false);

  const status = getSupabaseConfigStatus();

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsSaving(true);
      await updateShop(formData);
      setSuccessMsg('पसल सेटिङ सुरक्षित गरियो!');
      setTimeout(() => setSuccessMsg(''), 3000);
      onShopUpdated();
    } catch (err: any) {
      alert('सेटिङ सेभ गर्न असफल भयो।');
    } finally {
      setIsSaving(false);
    }
  };

  const handleResetDemoData = () => {
    if (window.confirm('के तपाईं डेमो डाटा रिसेट गर्न चाहनुहुन्छ? सबै नयाँ अर्डर र हिसाब सुरुवाती अवस्थामा फर्किनेछ।')) {
      localStorage.clear();
      initLocalStorageDemo();
      window.location.reload();
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Settings className="w-5 h-5 text-orange-600" />
        <div>
          <h2 className="text-base font-black text-gray-900 leading-tight">
            पसल सेटिङ (Shop Settings)
          </h2>
          <p className="text-xs text-gray-500">पसलको विवरण, डेलिभरी र अनलाइन QR भुक्तानी</p>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* Supabase Status Card */}
      <div
        className={`p-4 rounded-2xl border text-xs space-y-2 ${
          status.isConfigured
            ? 'bg-emerald-50/70 border-emerald-200 text-emerald-950'
            : 'bg-amber-50/70 border-amber-200 text-amber-950'
        }`}
      >
        <div className="flex items-center justify-between font-bold">
          <span className="flex items-center gap-1.5">
            <Database className="w-4 h-4" />
            <span>डाटाबेस स्थिति (Database Status)</span>
          </span>
          <span
            className={`px-2 py-0.5 rounded-full text-[10px] ${
              status.isConfigured ? 'bg-emerald-200 text-emerald-900' : 'bg-amber-200 text-amber-900'
            }`}
          >
            {status.isConfigured ? 'Supabase Cloud' : 'डेमो मोड (LocalStorage)'}
          </span>
        </div>
        <p className="text-[11px] leading-relaxed">{status.message}</p>
        {!status.isConfigured && (
          <p className="text-[11px] text-amber-900/80">
            * स्थायी डाटा क्लाउडमा सुरक्षित गर्न Supabase खाता खोली <code className="bg-white/80 px-1 py-0.5 rounded">.env</code> मा URL र Anon Key राख्नुहोस्।
          </p>
        )}
      </div>

      {/* Form */}
      <form onSubmit={handleSave} className="space-y-4 bg-white p-4 rounded-2xl border border-orange-100 shadow-xs">
        {/* Basic Shop Info */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-900 border-b pb-1.5">१. पसलको मुख्य विवरण</h3>
          
          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">पसलको नाम (नेपालीमा) *</label>
            <input
              type="text"
              required
              value={formData.name_ne || ''}
              onChange={(e) => setFormData({ ...formData, name_ne: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">पसलको नाम (English)</label>
            <input
              type="text"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-gray-600 block mb-1">ट्यागलाइन (Tagline)</label>
            <input
              type="text"
              value={formData.tagline || ''}
              onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
              placeholder="उदा: ताजा र स्वादिष्ट खाजा"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">फोन नम्बर *</label>
              <input
                type="tel"
                required
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
            <div>
              <label className="text-xs font-bold text-gray-700 block mb-1">WhatsApp नम्बर</label>
              <input
                type="tel"
                value={formData.whatsapp_number || ''}
                onChange={(e) => setFormData({ ...formData, whatsapp_number: e.target.value })}
                placeholder="97798XXXXXXXX"
                className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-bold text-gray-700 block mb-1">पसलको ठेगाना *</label>
            <input
              type="text"
              required
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer pt-1">
            <input
              type="checkbox"
              checked={formData.is_open ?? true}
              onChange={(e) => setFormData({ ...formData, is_open: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>पसल अहिले खुला छ (Open for Orders)</span>
          </label>
        </div>

        {/* Delivery & Takeaway Settings */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h3 className="text-xs font-black text-gray-900 border-b pb-1.5 flex items-center gap-1.5">
            <Bike className="w-4 h-4 text-emerald-600" />
            <span>२. डेलिभरी र टेकअवे सेटिङ</span>
          </h3>

          <div className="space-y-2">
            <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.is_delivery_enabled ?? true}
                onChange={(e) => setFormData({ ...formData, is_delivery_enabled: e.target.checked })}
                className="rounded text-orange-600 focus:ring-orange-500"
              />
              <span>होम डेलिभरी सेवा उपलब्ध गराउने</span>
            </label>

            {formData.is_delivery_enabled && (
              <div className="grid grid-cols-2 gap-2 pl-5 pt-1">
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    डेलिभरी शुल्क (रू)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.delivery_fee ?? ''}
                    onChange={(e) => setFormData({ ...formData, delivery_fee: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-bold text-gray-700 block mb-1">
                    न्यूनतम अर्डर (रू)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={formData.min_order_for_delivery ?? ''}
                    onChange={(e) => setFormData({ ...formData, min_order_for_delivery: Number(e.target.value) })}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Online QR Payment Settings */}
        <div className="space-y-3 pt-3 border-t border-gray-100">
          <h3 className="text-xs font-black text-gray-900 border-b pb-1.5 flex items-center gap-1.5">
            <QrCode className="w-4 h-4 text-purple-600" />
            <span>३. अनलाइन भुक्तानी (eSewa / Khalti QR)</span>
          </h3>

          <label className="flex items-center gap-2 text-xs font-bold text-gray-800 cursor-pointer">
            <input
              type="checkbox"
              checked={formData.is_online_payment_enabled ?? false}
              onChange={(e) => setFormData({ ...formData, is_online_payment_enabled: e.target.checked })}
              className="rounded text-orange-600 focus:ring-orange-500"
            />
            <span>ग्राहकलाई अनलाइन QR कोड देखाउने</span>
          </label>

          {formData.is_online_payment_enabled && (
            <div className="space-y-2 pl-5 pt-1">
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  QR तस्बिरको लिङ्क (QR Image URL)
                </label>
                <input
                  type="url"
                  value={formData.online_payment_qr_url || ''}
                  onChange={(e) => setFormData({ ...formData, online_payment_qr_url: e.target.value })}
                  placeholder="https://..."
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[11px] font-bold text-gray-700 block mb-1">
                  भुक्तानी निर्देशन (Payment Instructions)
                </label>
                <input
                  type="text"
                  value={formData.online_payment_instructions || ''}
                  onChange={(e) => setFormData({ ...formData, online_payment_instructions: e.target.value })}
                  placeholder="उदा: QR स्क्यान गरी अर्डर नम्बर रिमार्कमा लेख्नुहोस्।"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
                />
              </div>
            </div>
          )}
        </div>

        {/* Save button */}
        <button
          type="submit"
          disabled={isSaving}
          className="w-full py-3 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md active:scale-98 transition disabled:opacity-50"
        >
          {isSaving ? 'सेभ गर्दै...' : 'सेटिङ सुरक्षित गर्नुहोस् (Save Settings)'}
        </button>
      </form>

      {/* Reset Demo Data Button */}
      <div className="pt-2">
        <button
          type="button"
          onClick={handleResetDemoData}
          className="w-full py-2.5 px-3 rounded-xl border border-gray-300 bg-white hover:bg-rose-50 text-gray-600 hover:text-rose-700 text-xs font-bold flex items-center justify-center gap-1.5 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span>सुरुवाती डेमो डाटा रिसेट गर्नुहोस् (Reset Demo Data)</span>
        </button>
      </div>
    </div>
  );
};
