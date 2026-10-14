import React, { useState } from 'react';
import { Shop } from '../types';
import { isSupabaseConfigured } from '../lib/supabase';
import { PWAInstallButton } from './PWAInstallButton';
import { Store, ShoppingBag, Database, AlertCircle, Info, X } from 'lucide-react';

interface HeaderProps {
  shop: Shop;
  currentMode: 'owner' | 'customer';
  onChangeMode: (mode: 'owner' | 'customer') => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shop,
  currentMode,
  onChangeMode,
  onOpenSettings,
}) => {
  const [showDemoModal, setShowDemoModal] = useState(false);
  const isCloud = isSupabaseConfigured();

  return (
    <>
      <header className="sticky top-0 z-40 bg-[#FFFDF9]/95 backdrop-blur border-b border-orange-100 shadow-xs">
        <div className="max-w-md mx-auto px-4 py-2.5 flex items-center justify-between gap-2">
          {/* Brand & Shop Title */}
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center text-white shadow-sm shrink-0">
              <span className="text-xl font-black">म</span>
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5">
                <h1 className="font-bold text-gray-900 text-sm sm:text-base truncate leading-tight">
                  {shop.name_ne || shop.name}
                </h1>
                {shop.is_open ? (
                  <span className="inline-block w-2 h-2 rounded-full bg-emerald-500 shrink-0" title="पसल खुला छ" />
                ) : (
                  <span className="inline-block w-2 h-2 rounded-full bg-rose-500 shrink-0" title="पसल बन्द छ" />
                )}
              </div>
              <p className="text-[11px] text-gray-500 truncate">
                {currentMode === 'owner' ? 'साहुजी ड्यासबोर्ड (Owner Mode)' : 'अनलाइन अर्डर (Customer Order)'}
              </p>
            </div>
          </div>

          {/* Right Controls: Mode Toggle & Demo badge */}
          <div className="flex items-center gap-1.5 shrink-0">
            <PWAInstallButton />

            {/* Demo / Cloud status pill */}
            <button
              onClick={() => setShowDemoModal(true)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition ${
                isCloud
                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                  : 'bg-amber-100 text-amber-900 border border-amber-300'
              }`}
              title="डाटाबेस स्थिति हेर्नुहोस्"
            >
              <Database className="w-3 h-3" />
              <span>{isCloud ? 'Cloud' : 'डेमो मोड'}</span>
            </button>

            {/* Switch Mode Button */}
            <button
              onClick={() => onChangeMode(currentMode === 'owner' ? 'customer' : 'owner')}
              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-orange-600 hover:bg-orange-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
            >
              {currentMode === 'owner' ? (
                <>
                  <ShoppingBag className="w-3.5 h-3.5" />
                  <span className="hidden xs:inline">ग्राहक मेनु</span>
                  <span className="xs:hidden">मेनु</span>
                </>
              ) : (
                <>
                  <Store className="w-3.5 h-3.5" />
                  <span>साहुजी</span>
                </>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Demo Mode / Supabase Info Modal */}
      {showDemoModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <div className="flex items-center justify-between mb-3 border-b pb-2">
              <div className="flex items-center gap-2 text-amber-800">
                <AlertCircle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-gray-900 text-sm">
                  {isCloud ? 'Supabase Cloud सक्रिय छ' : 'डेमो मोड (Demo Mode) जानकारी'}
                </h3>
              </div>
              <button
                onClick={() => setShowDemoModal(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="text-xs text-gray-600 space-y-2.5 leading-relaxed">
              {isCloud ? (
                <p>
                  तपाईंको एप <strong>Supabase PostgreSQL</strong> क्लाउड डाटाबेसमा जोडिएको छ। सम्पूर्ण अर्डर, मेनु र हिसाबहरू स्थायी रूपमा सुरक्षित छन्।
                </p>
              ) : (
                <>
                  <p className="bg-amber-50 p-2.5 rounded-lg border border-amber-200 text-amber-900">
                    <strong>सचेत:</strong> हाल सुपबेश (.env) क्रेडेन्सियल राखिएको छैन। सम्पूर्ण हिसाब-किताब र अर्डरहरू यसै <strong>एन्ड्रोइड फोनको ब्राउजर (LocalStorage)</strong> मा मात्र सुरक्षित छन्।
                  </p>
                  <p>
                    स्थायी अनलाइन डाटाबेसको लागि सित्तैमा <strong>Supabase.com</strong> मा प्रोजेक्ट बनाई <code className="bg-gray-100 px-1 py-0.5 rounded">VITE_SUPABASE_URL</code> र <code className="bg-gray-100 px-1 py-0.5 rounded">VITE_SUPABASE_ANON_KEY</code> थप्न सकिन्छ।
                  </p>
                </>
              )}
            </div>

            <div className="mt-4 flex gap-2">
              {onOpenSettings && (
                <button
                  onClick={() => {
                    setShowDemoModal(false);
                    onOpenSettings();
                  }}
                  className="flex-1 py-2 rounded-xl bg-orange-100 text-orange-800 font-semibold text-xs hover:bg-orange-200"
                >
                  सेटिङ हेर्नुहोस्
                </button>
              )}
              <button
                onClick={() => setShowDemoModal(false)}
                className="flex-1 py-2 rounded-xl bg-gray-900 text-white font-semibold text-xs hover:bg-gray-800"
              >
                ठीक छ (Close)
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
