import React, { useState } from 'react';
import { createShop } from '../../lib/storage';
import { Shop } from '../../types';
import { Store, Check, AlertCircle } from 'lucide-react';

interface CreateShopModalProps {
  isOpen: boolean;
  userId: string;
  onShopCreated: (shop: Shop) => void;
}

export const CreateShopModal: React.FC<CreateShopModalProps> = ({
  isOpen,
  userId,
  onShopCreated,
}) => {
  const [name, setName] = useState('');
  const [nameNe, setNameNe] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim() || !address.trim()) {
      setErrorMsg('कृपया पसलको नाम, फोन र ठेगाना भर्नुहोस्।');
      return;
    }

    try {
      setIsLoading(true);
      setErrorMsg('');
      const newShop = await createShop({
        name: name.trim(),
        name_ne: nameNe.trim() || name.trim(),
        phone: phone.trim(),
        address: address.trim(),
        owner_id: userId,
      });
      onShopCreated(newShop);
    } catch (err: any) {
      setErrorMsg(err.message || 'पसल खोल्न सकिएन।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Mukta',sans-serif]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-orange-100 space-y-3.5">
        <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-orange-500 to-amber-600 text-white flex items-center justify-center">
            <Store className="w-4 h-4" />
          </div>
          <div>
            <h3 className="font-bold text-gray-900 text-sm">आफ्नो पसल दर्ता गर्नुहोस्</h3>
            <p className="text-[11px] text-gray-500">तपाईंको पहिलो पसल सेटअप (Setup Shop)</p>
          </div>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              पसलको नाम (Shop Name) *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (!nameNe) setNameNe(e.target.value);
              }}
              placeholder="उदा: Mama's Momo & Chatpate"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              नेपालीमा नाम (Nepali Name)
            </label>
            <input
              type="text"
              value={nameNe}
              onChange={(e) => setNameNe(e.target.value)}
              placeholder="उदा: मामाको मम तथा चटपटे"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              फोन नम्बर *
            </label>
            <input
              type="tel"
              required
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              placeholder="९८XXXXXXXX"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              पसलको ठेगाना *
            </label>
            <input
              type="text"
              required
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="उदा: वसन्तपुर चोक, काठमाडौँ"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition disabled:opacity-50"
          >
            {isLoading ? 'पसल बनाउँदै...' : 'पसल सुरु गर्नुहोस्'}
          </button>
        </form>
      </div>
    </div>
  );
};
