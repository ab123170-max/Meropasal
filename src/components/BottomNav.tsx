import React from 'react';
import { Home, ClipboardList, UtensilsCrossed, Calculator, Boxes, Bot, Settings } from 'lucide-react';

export type OwnerTab = 'home' | 'orders' | 'menu' | 'finance' | 'stock' | 'ai' | 'settings';

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
  const tabs = [
    { id: 'home' as OwnerTab, label: 'गृह', icon: Home },
    { id: 'orders' as OwnerTab, label: 'अर्डर', icon: ClipboardList, badge: pendingOrdersCount },
    { id: 'menu' as OwnerTab, label: 'मेनु', icon: UtensilsCrossed },
    { id: 'finance' as OwnerTab, label: 'हिसाब', icon: Calculator },
    { id: 'stock' as OwnerTab, label: 'मौज्दात', icon: Boxes, badge: lowStockCount, badgeColor: 'bg-amber-600' },
    { id: 'ai' as OwnerTab, label: 'AI सल्लाहकार', icon: Bot },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-[#FFFDF9] border-t border-orange-100 shadow-lg pb-safe">
      <div className="max-w-md mx-auto px-1 flex items-center justify-around">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = currentTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => onChangeTab(tab.id)}
              className={`relative flex flex-col items-center justify-center py-2 px-1 min-w-[50px] transition-colors active:scale-95 ${
                isActive ? 'text-orange-600 font-bold' : 'text-gray-500 hover:text-gray-800'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 ${isActive ? 'stroke-[2.5]' : 'stroke-[1.8]'}`} />
                {tab.badge !== undefined && tab.badge > 0 && (
                  <span
                    className={`absolute -top-1 -right-2 min-w-4 h-4 px-1 rounded-full text-[10px] font-bold text-white flex items-center justify-center ${
                      tab.badgeColor || 'bg-rose-600'
                    }`}
                  >
                    {tab.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] mt-0.5 tracking-tight truncate max-w-[60px]">
                {tab.label}
              </span>
              {isActive && (
                <div className="w-1.5 h-1.5 rounded-full bg-orange-600 mt-0.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
