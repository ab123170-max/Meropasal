import React from 'react';
import { Shop } from '../types';
import { PWAInstallButton } from './PWAInstallButton';
import { Store, ShoppingBag, Bell, Settings, LogIn, LogOut, CheckCircle, Flame } from 'lucide-react';
import { User } from '@supabase/supabase-js';

interface HeaderProps {
  shop: Shop | null;
  currentMode: 'owner' | 'customer';
  onChangeMode: (mode: 'owner' | 'customer') => void;
  currentUser: User | null;
  onOpenAuth: () => void;
  onSignOut: () => void;
  onOpenSettings?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  shop,
  currentMode,
  onChangeMode,
  currentUser,
  onOpenAuth,
  onSignOut,
  onOpenSettings,
}) => {
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'शुभ प्रभात (Good Morning)';
    if (hour < 17) return 'शुभ दिन (Good Afternoon)';
    return 'शुभ संध्या (Good Evening)';
  };

  const currentDate = new Date().toLocaleDateString('ne-NP', {
    weekday: 'short',
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur border-b border-gray-200 shadow-xs font-['Mukta',sans-serif]">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between gap-2">
        {/* Brand & Shop Title */}
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-2xl bg-[#087F5B] flex items-center justify-center text-white shadow-sm shrink-0">
            <span className="text-xl font-black">म</span>
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <h1 className="font-extrabold text-[#172B4D] text-sm sm:text-base truncate leading-tight">
                {shop ? shop.name_ne || shop.name : 'मेरो पसल'}
              </h1>
              {shop && (
                <span
                  className={`inline-block w-2 h-2 rounded-full shrink-0 ${
                    shop.is_open ? 'bg-emerald-500' : 'bg-rose-500'
                  }`}
                  title={shop.is_open ? 'पसल खुला छ' : 'पसल बन्द छ'}
                />
              )}
            </div>
            <p className="text-[11px] text-gray-500 truncate">
              {currentMode === 'owner' ? `${getGreeting()} • ${currentDate}` : 'ग्राहक अनलाइन मेनु'}
            </p>
          </div>
        </div>

        {/* Right Controls: Mode Toggle, Notifications & Settings */}
        <div className="flex items-center gap-1.5 shrink-0">
          <PWAInstallButton />

          {currentMode === 'owner' && onOpenSettings && (
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 text-gray-700 transition"
              title="सेटिङ्स"
            >
              <Settings className="w-4 h-4" />
            </button>
          )}

          {/* Switch Mode Button */}
          <button
            onClick={() => onChangeMode(currentMode === 'owner' ? 'customer' : 'owner')}
            className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-[#087F5B] hover:bg-[#076b4b] text-white text-xs font-bold shadow-xs transition active:scale-95"
          >
            {currentMode === 'owner' ? (
              <>
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>ग्राहक मेनु</span>
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
  );
};
