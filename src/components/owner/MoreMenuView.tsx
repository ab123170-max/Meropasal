import React from 'react';
import {
  Scale,
  Flame,
  Boxes,
  Bot,
  Settings,
  ChevronRight,
  Store,
  HelpCircle,
  LogOut,
} from 'lucide-react';
import { Shop } from '../../types';

interface MoreMenuViewProps {
  shop: Shop;
  onNavigate: (tab: any) => void;
  onOpenAuth: () => void;
  onSignOut: () => void;
  isLoggedIn: boolean;
}

export const MoreMenuView: React.FC<MoreMenuViewProps> = ({
  shop,
  onNavigate,
  onOpenAuth,
  onSignOut,
  isLoggedIn,
}) => {
  const menuItems = [
    {
      id: 'calculator',
      title: 'रेसिपी लागत क्याल्कुलेटर',
      subtitle: 'परिकार बनाउन लाग्ने कच्चा पदार्थ र नाफा हिसाब गर्नुहोस्',
      icon: Scale,
      color: 'bg-emerald-50 text-[#087F5B]',
    },
    {
      id: 'gas',
      title: 'स्मार्ट LPG ग्यास ट्र्याकर',
      subtitle: 'ग्यास सिलिन्डर खपत, बाँकी प्रतिशत र दैनिक खर्च',
      icon: Flame,
      color: 'bg-orange-50 text-orange-600',
    },
    {
      id: 'stock',
      title: 'मौज्दात व्यवस्थापन (Stock)',
      subtitle: 'कच्चा पदार्थ र सामाग्रीकोस्ट र मात्रा ट्र्याक गर्नुहोस्',
      icon: Boxes,
      color: 'bg-amber-50 text-amber-600',
    },
    {
      id: 'ai',
      title: 'AI व्यापार सल्लाहकार',
      subtitle: 'तपाईंको पसलको लागि स्मार्ट सुझाव र विश्लेषण',
      icon: Bot,
      color: 'bg-purple-50 text-purple-600',
    },
    {
      id: 'settings',
      title: 'पसल सेटिङ्स तथा विवरण',
      subtitle: 'पसलको नाम, ठेगाना, फोन नम्बर र QR कोड सेटअप',
      icon: Settings,
      color: 'bg-blue-50 text-blue-600',
    },
  ];

  return (
    <div className="pb-28 max-w-md mx-auto p-4 space-y-5 font-['Mukta',sans-serif]">
      {/* Header */}
      <div className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-[#087F5B]/10 text-[#087F5B] flex items-center justify-center font-black text-xl shadow-xs">
            {shop.name_ne?.[0] || shop.name[0] || 'म'}
          </div>
          <div>
            <h1 className="text-base font-black text-gray-900">{shop.name_ne || shop.name}</h1>
            <p className="text-xs text-gray-500">{shop.address}, {shop.city}</p>
          </div>
        </div>
      </div>

      {/* Management Modules Grid / List */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-gray-400 uppercase tracking-wider px-1">
          थप सुविधाहरू तथा उपकरणहरू (Management Tools)
        </h2>

        {menuItems.map((item) => {
          const Icon = item.icon;
          return (
            <button
              key={item.id}
              onClick={() => onNavigate(item.id)}
              className="w-full bg-white rounded-2xl p-4 border border-gray-200 shadow-xs hover:border-[#087F5B]/40 hover:shadow-md transition flex items-center justify-between group active:scale-98 text-left"
            >
              <div className="flex items-center gap-3.5">
                <div className={`w-11 h-11 rounded-xl ${item.color} flex items-center justify-center shrink-0`}>
                  <Icon className="w-5 h-5 stroke-[2.2]" />
                </div>
                <div>
                  <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#087F5B] transition">
                    {item.title}
                  </h3>
                  <p className="text-[11px] text-gray-500 leading-tight mt-0.5">
                    {item.subtitle}
                  </p>
                </div>
              </div>
              <ChevronRight className="w-5 h-5 text-gray-400 group-hover:text-[#087F5B] transition shrink-0" />
            </button>
          );
        })}
      </div>

      {/* Account / Session Management */}
      <div className="pt-2">
        {isLoggedIn ? (
          <button
            onClick={onSignOut}
            className="w-full py-3.5 px-4 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-700 font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98 border border-rose-200"
          >
            <LogOut className="w-4 h-4" />
            <span>साहुजी खाताबाट बाहिरिनुहोस् (Log Out)</span>
          </button>
        ) : (
          <button
            onClick={onOpenAuth}
            className="w-full py-3.5 px-4 rounded-2xl bg-[#087F5B] hover:bg-[#076b4b] text-white font-bold text-xs flex items-center justify-center gap-2 transition shadow-md active:scale-98"
          >
            <span>साहुजी लगइन गर्नुहोस् (Owner Login)</span>
          </button>
        )}
      </div>
    </div>
  );
};
