import React, { useState } from 'react';
import { Ingredient, IngredientUnit } from '../../types';
import { saveIngredient, restockIngredient } from '../../lib/storage';
import {
  Boxes,
  Plus,
  AlertTriangle,
  RefreshCw,
  Edit2,
  X,
  Package,
  TrendingDown,
  ArrowUpRight,
} from 'lucide-react';

interface StockManagerProps {
  shopId: string;
  ingredients: Ingredient[];
  onStockUpdated: () => void;
}

export const StockManager: React.FC<StockManagerProps> = ({
  shopId,
  ingredients,
  onStockUpdated,
}) => {
  const [filterLowStock, setFilterLowStock] = useState(false);

  // Restock modal state
  const [restockingItem, setRestockingItem] = useState<Ingredient | null>(null);
  const [addQty, setAddQty] = useState<number>(0);
  const [unitCost, setUnitCost] = useState<number>(0);
  const [recordExpense, setRecordExpense] = useState(true);

  // New/Edit ingredient modal state
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<Ingredient> | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const lowStockItems = ingredients.filter((i) => i.quantity_available <= i.min_threshold);
  const displayItems = filterLowStock ? lowStockItems : ingredients;

  // Open restock modal
  const handleOpenRestock = (item: Ingredient) => {
    setRestockingItem(item);
    setAddQty(1);
    setUnitCost(item.purchase_cost_per_unit);
    setRecordExpense(true);
  };

  // Submit restock
  const handleRestockSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!restockingItem || addQty <= 0) return;

    const totalCost = addQty * unitCost;
    await restockIngredient({
      ingredientId: restockingItem.id,
      addedQuantity: addQty,
      unitCost,
      totalCost,
      recordAsExpense: recordExpense,
    });

    setRestockingItem(null);
    onStockUpdated();
  };

  // Open new ingredient modal
  const handleOpenNewIngredient = () => {
    setEditingItem({
      shop_id: shopId,
      name: '',
      name_ne: '',
      unit: 'kg',
      quantity_available: 0,
      purchase_cost_per_unit: 0,
      min_threshold: 1,
    });
    setIsEditModalOpen(true);
  };

  // Submit save ingredient
  const handleSaveIngredientSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem?.name?.trim()) return;

    try {
      setIsSaving(true);
      await saveIngredient(editingItem);
      setIsEditModalOpen(false);
      onStockUpdated();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <Boxes className="w-5 h-5 text-orange-600" />
            <span>कच्चा पदार्थ मौज्दात (Stock & Inventory)</span>
          </h2>
          <p className="text-xs text-gray-500">सामानको मात्रा र लागत व्यवस्थापन</p>
        </div>

        <button
          onClick={handleOpenNewIngredient}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>नयाँ सामान</span>
        </button>
      </div>

      {/* Low Stock Banner Alert */}
      {lowStockItems.length > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-2xl p-3 shadow-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
              <p className="text-xs font-bold">
                {lowStockItems.length} वटा सामान सकिन लागेको छ!
              </p>
            </div>
            <button
              onClick={() => setFilterLowStock(!filterLowStock)}
              className="text-xs font-bold text-amber-800 underline"
            >
              {filterLowStock ? 'सबै देखाउनुहोस्' : 'सकिन लागेको मात्र'}
            </button>
          </div>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 text-xs font-bold">
        <button
          onClick={() => setFilterLowStock(false)}
          className={`px-3 py-1.5 rounded-full transition ${
            !filterLowStock ? 'bg-orange-600 text-white' : 'bg-white text-gray-700 border'
          }`}
        >
          सबै सामान ({ingredients.length})
        </button>
        <button
          onClick={() => setFilterLowStock(true)}
          className={`px-3 py-1.5 rounded-full transition ${
            filterLowStock ? 'bg-amber-600 text-white' : 'bg-white text-amber-800 border'
          }`}
        >
          सकिन लागेको मात्र ({lowStockItems.length})
        </button>
      </div>

      {/* Ingredients Cards List */}
      <div className="space-y-2.5">
        {displayItems.map((item) => {
          const isLow = item.quantity_available <= item.min_threshold;

          return (
            <div
              key={item.id}
              className={`bg-white rounded-2xl p-3.5 border shadow-xs transition ${
                isLow ? 'border-amber-300 bg-amber-50/20' : 'border-orange-100'
              }`}
            >
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-1.5">
                    <h3 className="font-bold text-sm text-gray-900">
                      {item.name_ne || item.name}
                    </h3>
                    {isLow && (
                      <span className="text-[10px] font-bold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded">
                        सकिन लाग्यो
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-gray-500 mt-0.5">
                    न्यूनतम अलर्ट सीमा: {item.min_threshold} {item.unit} | प्रति {item.unit} लागत: रू {item.purchase_cost_per_unit}
                  </p>
                </div>

                <div className="text-right">
                  <span className={`text-base font-black ${isLow ? 'text-rose-600' : 'text-emerald-700'}`}>
                    {item.quantity_available} {item.unit}
                  </span>
                  <p className="text-[10px] text-gray-400">उपलब्ध मौज्दात</p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="mt-2.5 pt-2 border-t border-gray-100 flex items-center justify-between gap-2">
                <button
                  onClick={() => {
                    setEditingItem(item);
                    setIsEditModalOpen(true);
                  }}
                  className="py-1 px-2.5 rounded-lg text-gray-600 hover:text-gray-900 text-xs flex items-center gap-1 hover:bg-gray-100"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>सम्पादन</span>
                </button>

                <button
                  onClick={() => handleOpenRestock(item)}
                  className="py-1.5 px-3 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-800 font-bold text-xs flex items-center gap-1.5 active:scale-95 transition"
                >
                  <ArrowUpRight className="w-3.5 h-3.5 text-orange-600" />
                  <span>नयाँ सामान थप्नुहोस् (Restock)</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Restock Modal */}
      {restockingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-sm mb-1">
              {restockingItem.name_ne || restockingItem.name} खरिद / थप
            </h3>
            <p className="text-xs text-gray-500 mb-3">
              हालको मौज्दात: {restockingItem.quantity_available} {restockingItem.unit}
            </p>

            <form onSubmit={handleRestockSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  थपिने परिमाण ({restockingItem.unit}) *
                </label>
                <input
                  type="number"
                  step="any"
                  min="0.1"
                  required
                  value={addQty || ''}
                  onChange={(e) => setAddQty(Number(e.target.value))}
                  placeholder="5"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  प्रति {restockingItem.unit} खरिद मूल्य (रू) *
                </label>
                <input
                  type="number"
                  min="0"
                  required
                  value={unitCost || ''}
                  onChange={(e) => setUnitCost(Number(e.target.value))}
                  placeholder="250"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="p-2.5 rounded-xl bg-orange-50 text-xs flex justify-between font-bold text-orange-950">
                <span>कुल खर्च:</span>
                <span>रू {(addQty * unitCost).toLocaleString('en-IN')}</span>
              </div>

              <label className="flex items-center gap-2 text-xs font-semibold text-gray-700 cursor-pointer pt-1">
                <input
                  type="checkbox"
                  checked={recordExpense}
                  onChange={(e) => setRecordExpense(e.target.checked)}
                  className="rounded text-orange-600 focus:ring-orange-500"
                />
                <span>यो खरिदलाई सिधै खर्च खातामा पनि चढाउने</span>
              </label>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setRestockingItem(null)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700"
                >
                  स्टक अपडेट गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add / Edit Ingredient Modal */}
      {isEditModalOpen && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
            <h3 className="font-bold text-gray-900 text-sm mb-3">
              {editingItem.id ? 'कच्चा पदार्थ सम्पादन' : 'नयाँ कच्चा पदार्थ थप्नुहोस्'}
            </h3>

            <form onSubmit={handleSaveIngredientSubmit} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  सामानको नाम *
                </label>
                <input
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) =>
                    setEditingItem((prev) => ({
                      ...prev,
                      name: e.target.value,
                      name_ne: prev?.name_ne || e.target.value,
                    }))
                  }
                  placeholder="उदा: आलु (Potatoes)"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    एकाइ (Unit) *
                  </label>
                  <select
                    value={editingItem.unit || 'kg'}
                    onChange={(e) =>
                      setEditingItem((prev) => ({ ...prev, unit: e.target.value as IngredientUnit }))
                    }
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs bg-white focus:outline-none"
                  >
                    <option value="kg">kg (किलोग्राम)</option>
                    <option value="gram">gram (ग्राम)</option>
                    <option value="litre">litre (लिटर)</option>
                    <option value="ml">ml (मिलिलिटर)</option>
                    <option value="piece">piece (थान/पिस)</option>
                    <option value="packet">packet (प्याकेट)</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    हालको मौज्दात
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.quantity_available ?? ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        quantity_available: Number(e.target.value),
                      }))
                    }
                    placeholder="10"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    खरिद मूल्य (रू)
                  </label>
                  <input
                    type="number"
                    value={editingItem.purchase_cost_per_unit ?? ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        purchase_cost_per_unit: Number(e.target.value),
                      }))
                    }
                    placeholder="45"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-gray-700 block mb-1">
                    अलर्ट सीमा
                  </label>
                  <input
                    type="number"
                    step="any"
                    value={editingItem.min_threshold ?? ''}
                    onChange={(e) =>
                      setEditingItem((prev) => ({
                        ...prev,
                        min_threshold: Number(e.target.value),
                      }))
                    }
                    placeholder="2"
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="flex-1 py-2 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  रद्द
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2 rounded-xl bg-orange-600 text-white font-bold text-xs hover:bg-orange-700"
                >
                  सुरक्षित गर्नुहोस्
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
