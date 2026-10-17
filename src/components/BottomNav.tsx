import React from 'react';
import { Home, ClipboardList, UtensilsCrossed, PieChart, LayoutGrid } from 'lucide-react';

export type OwnerTab = 'home' | 'orders' | 'menu' | 'finance' | 'reports' | 'more' | 'calculator' | 'gas' | 'stock' | 'ai' | 'settings';

interface BottomNavProps {
  currentTab: OwnerTab;
  onChangeTab: (tab: OwnerTab) => void;
  pendingOrdersCount: number;
  lowStockCount: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentTab,
  onChangeTab,
  pendingOrdersCount,
  lowStockCount,
}) => {
  // Map sub-tabs like calculator, gas, stock, ai, settings to 'more' if active
  const isTabActive = (tabId: string) => {
    if (currentTab === tabId) return true;
    if (tabId === 'more' && ['calculator', 'gas', 'stock', 'ai', 'settings'].includes(currentTab)) {
      return true;
    }
    return false;
  };

  const tabs = [
    { id: 'home' as OwnerTab, label: 'गृह', icon: Home },
    { id: 'orders' as OwnerTab, label: 'बिक्री/अर्डर', icon: ClipboardList, badge: pendingOrdersCount },
    { id: 'menu' as OwnerTab, label: 'परिकार', icon: UtensilsCrossed },
    { id: 'reports' as OwnerTab, label: 'हिसाब', icon: PieChart },
    { id: 'more' as OwnerTab, label: 'थप', icon: LayoutGrid, badge: lowStockCount > 0 ? lowStockCount : undefined, badgeColor: 'bg-amber-600' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-200 shadow-lg pb-safe">
      <div className="max-w-md mx-auto px-2 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = isTabActive(tab.id);

          return (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'more' && ['calculator', 'gas', 'stock', 'ai', 'settings'].includes(currentTab)) {
                  onChangeTab('more');
                } else {
                  onChangeTab(tab.id);
                }
              }}
              className={`relative flex flex-col items-center justify-center py-2 px-2 min-w-[60px] transition-colors active:scale-95 ${
                isActive ? 'text-[#087F5B] font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2.5 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
                      tab.badgeColor || 'bg-rose-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[11px] mt-1 tracking-tight truncate max-w-[65px]">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-[#087F5B] mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
