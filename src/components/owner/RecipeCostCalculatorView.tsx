import React, { useState, useEffect } from 'react';
import { Shop } from '../../types';
import {
  Calculator,
  Plus,
  Trash2,
  Copy,
  Save,
  FolderOpen,
  DollarSign,
  AlertCircle,
  CheckCircle,
  Flame,
  ChefHat,
  Scale,
  RefreshCw,
} from 'lucide-react';

export interface RecipeIngredient {
  id: string;
  name: string;
  purchaseQuantity: number;
  purchaseUnit: 'kg' | 'gram' | 'litre' | 'ml' | 'piece' | 'packet';
  purchasePrice: number;
  usageQuantity: number;
  usageUnit: 'kg' | 'gram' | 'litre' | 'ml' | 'piece' | 'packet';
  wastagePercent: number;
}

export interface SavedRecipeCalculator {
  id: string;
  shop_id: string;
  recipeName: string;
  platesProduced: number;
  gasCost: number;
  otherCost: number;
  sellingPricePerPlate: number;
  ingredients: RecipeIngredient[];
  createdAt: string;
  updatedAt: string;
}

interface RecipeCostCalculatorViewProps {
  shop: Shop;
}

const DEFAULT_INGREDIENTS: RecipeIngredient[] = [
  {
    id: '1',
    name: 'Potato (आलु)',
    purchaseQuantity: 5,
    purchaseUnit: 'kg',
    purchasePrice: 200,
    usageQuantity: 250,
    usageUnit: 'gram',
    wastagePercent: 5,
  },
  {
    id: '2',
    name: 'Chopped Onion (प्याज)',
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    purchasePrice: 90,
    usageQuantity: 100,
    usageUnit: 'gram',
    wastagePercent: 2,
  },
  {
    id: '3',
    name: 'Chana / Murmura (चटपटे मिक्स)',
    purchaseQuantity: 1,
    purchaseUnit: 'kg',
    purchasePrice: 160,
    usageQuantity: 400,
    usageUnit: 'gram',
    wastagePercent: 0,
  },
];

export const RecipeCostCalculatorView: React.FC<RecipeCostCalculatorViewProps> = ({ shop }) => {
  const [recipeName, setRecipeName] = useState('Chicken Chatpate (चिकन चटपटे)');
  const [platesProduced, setPlatesProduced] = useState<number>(10);
  const [gasCost, setGasCost] = useState<number>(30);
  const [otherCost, setOtherCost] = useState<number>(20);
  const [sellingPricePerPlate, setSellingPricePerPlate] = useState<number>(80);

  const [ingredients, setIngredients] = useState<RecipeIngredient[]>(DEFAULT_INGREDIENTS);
  const [savedRecipes, setSavedRecipes] = useState<SavedRecipeCalculator[]>([]);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [showSavedModal, setShowSavedModal] = useState(false);
  const [currentSavedId, setCurrentSavedId] = useState<string | null>(null);

  // Load saved recipes from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(`meropasal_recipes_${shop.id}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setSavedRecipes(parsed);
        }
      }
    } catch (e) {
      console.error('Error loading saved recipes:', e);
    }
  }, [shop.id]);

  // Unit conversion helper to convert any quantity to base units (grams for weight, ml for volume, piece for count/packet)
  const convertToBaseUnits = (qty: number, unit: string): { baseQty: number; baseType: 'weight' | 'volume' | 'count' } => {
    if (unit === 'kg') return { baseQty: qty * 1000, baseType: 'weight' };
    if (unit === 'gram' || unit === 'g') return { baseQty: qty, baseType: 'weight' };
    if (unit === 'litre') return { baseQty: qty * 1000, baseType: 'volume' };
    if (unit === 'ml') return { baseQty: qty, baseType: 'volume' };
    return { baseQty: qty, baseType: 'count' }; // piece, packet
  };

  // Calculate individual ingredient cost
  const calculateIngredientCost = (ing: RecipeIngredient): { unitCost: number; netCost: number; isValid: boolean } => {
    if (!ing.purchaseQuantity || ing.purchaseQuantity <= 0 || !ing.purchasePrice) {
      return { unitCost: 0, netCost: 0, isValid: false };
    }

    const purchaseConv = convertToBaseUnits(ing.purchaseQuantity, ing.purchaseUnit);
    const usageConv = convertToBaseUnits(ing.usageQuantity, ing.usageUnit);

    // Verify units are compatible (weight with weight, volume with volume, count with count)
    if (purchaseConv.baseType !== usageConv.baseType) {
      return { unitCost: 0, netCost: 0, isValid: false }; // Incompatible units
    }

    const costPerBaseUnit = ing.purchasePrice / purchaseConv.baseQty;
    const baseUsageCost = costPerBaseUnit * usageConv.baseQty;
    const wastageMultiplier = 1 + (Number(ing.wastagePercent) || 0) / 100;
    const netCost = baseUsageCost * wastageMultiplier;

    return {
      unitCost: costPerBaseUnit,
      netCost: isNaN(netCost) ? 0 : netCost,
      isValid: true,
    };
  };

  // Add new ingredient row
  const handleAddIngredient = () => {
    const newIng: RecipeIngredient = {
      id: Date.now().toString(),
      name: 'नयाँ सामग्री (New Ingredient)',
      purchaseQuantity: 1,
      purchaseUnit: 'kg',
      purchasePrice: 100,
      usageQuantity: 100,
      usageUnit: 'gram',
      wastagePercent: 0,
    };
    setIngredients([...ingredients, newIng]);
  };

  const handleUpdateIngredient = (id: string, updates: Partial<RecipeIngredient>) => {
    setIngredients(ingredients.map((ing) => (ing.id === id ? { ...ing, ...updates } : ing)));
  };

  const handleRemoveIngredient = (id: string) => {
    if (ingredients.length <= 1) {
      setErrorMsg('कम्तिमा एउटा सामग्री आवश्यक छ।');
      return;
    }
    setIngredients(ingredients.filter((ing) => ing.id !== id));
  };

  // Totals calculations
  let totalIngredientCost = 0;
  let hasIncompatibleUnits = false;

  const ingredientDetails = ingredients.map((ing) => {
    const calc = calculateIngredientCost(ing);
    if (!calc.isValid) {
      hasIncompatibleUnits = true;
    }
    totalIngredientCost += calc.netCost;
    return { ...ing, calculatedCost: calc.netCost };
  });

  const validPlates = Math.max(1, Number(platesProduced) || 1);
  const totalBatchCost = totalIngredientCost + (Number(gasCost) || 0) + (Number(otherCost) || 0);
  const costPerPlate = totalBatchCost / validPlates;
  const sellingPrice = Number(sellingPricePerPlate) || 0;
  const profitPerPlate = sellingPrice > 0 ? sellingPrice - costPerPlate : 0;
  const profitMargin = sellingPrice > 0 ? (profitPerPlate / sellingPrice) * 100 : 0;

  // Save recipe calculation
  const handleSaveRecipe = () => {
    if (!recipeName.trim()) {
      setErrorMsg('कृपया रेसिपीको नाम लेख्नुहोस्।');
      return;
    }
    try {
      setErrorMsg('');
      const newRecord: SavedRecipeCalculator = {
        id: currentSavedId || `recipe_${Date.now()}`,
        shop_id: shop.id,
        recipeName: recipeName.trim(),
        platesProduced: validPlates,
        gasCost: Number(gasCost) || 0,
        otherCost: Number(otherCost) || 0,
        sellingPricePerPlate: sellingPrice,
        ingredients,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      const updatedList = currentSavedId
        ? savedRecipes.map((r) => (r.id === currentSavedId ? newRecord : r))
        : [newRecord, ...savedRecipes];

      setSavedRecipes(updatedList);
      localStorage.setItem(`meropasal_recipes_${shop.id}`, JSON.stringify(updatedList));
      setCurrentSavedId(newRecord.id);
      setSuccessMsg('रेसिपी लागत सफलतापूर्वक सुरक्षित गरियो!');
      setTimeout(() => setSuccessMsg(''), 3000);
    } catch (err: any) {
      setErrorMsg('रेसिपी सेभ गर्न असफल भयो।');
    }
  };

  const handleLoadRecipe = (rec: SavedRecipeCalculator) => {
    setCurrentSavedId(rec.id);
    setRecipeName(rec.recipeName);
    setPlatesProduced(rec.platesProduced);
    setGasCost(rec.gasCost);
    setOtherCost(rec.otherCost);
    setSellingPricePerPlate(rec.sellingPricePerPlate);
    setIngredients(rec.ingredients);
    setShowSavedModal(false);
    setSuccessMsg(`"${rec.recipeName}" लोड गरियो!`);
    setTimeout(() => setSuccessMsg(''), 2500);
  };

  const handleDuplicateRecipe = () => {
    setCurrentSavedId(null);
    setRecipeName(`${recipeName} (प्रतिलिपि / Copy)`);
    setSuccessMsg('नयाँ प्रतिलिपि बनाइएको छ। अब यसलाई सम्पादन गरी सेभ गर्नुहोस्।');
    setTimeout(() => setSuccessMsg(''), 3000);
  };

  const handleDeleteSaved = (id: string) => {
    if (window.confirm('के तपाईं यो सेभ गरिएको रेसिपी मेटाउन चाहनुहुन्छ?')) {
      const filtered = savedRecipes.filter((r) => r.id !== id);
      setSavedRecipes(filtered);
      localStorage.setItem(`meropasal_recipes_${shop.id}`, JSON.stringify(filtered));
      if (currentSavedId === id) setCurrentSavedId(null);
    }
  };

  return (
    <div className="max-w-lg mx-auto pb-28 px-4 pt-3 space-y-4 font-['Mukta',sans-serif]">
      {/* Top Header & Quick Actions */}
      <div className="flex items-center justify-between bg-white p-3 rounded-2xl border border-orange-200 shadow-xs">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-orange-600 text-white flex items-center justify-center shadow-sm">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-black text-gray-900">रेसिपी लागत क्यालकुलेटर</h2>
            <p className="text-[11px] text-gray-500">Recipe Cost & Profit Calculator</p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowSavedModal(true)}
            className="px-2.5 py-1.5 rounded-xl bg-orange-50 hover:bg-orange-100 text-orange-900 text-xs font-bold flex items-center gap-1 transition"
          >
            <FolderOpen className="w-3.5 h-3.5" />
            <span>सेभ भएका ({savedRecipes.length})</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-900 text-xs flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      {errorMsg && (
        <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 1. Recipe Header Details */}
      <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs space-y-3">
        <h3 className="text-xs font-black text-gray-900 border-b pb-1.5 flex items-center gap-1.5">
          <ChefHat className="w-4 h-4 text-orange-600" />
          <span>१. परिकारको विवरण र ब्याच उत्पादन</span>
        </h3>

        <div>
          <label className="text-xs font-bold text-gray-700 block mb-1">परिकारको नाम (Recipe Name) *</label>
          <input
            type="text"
            value={recipeName}
            onChange={(e) => setRecipeName(e.target.value)}
            placeholder="उदा: Chicken Chatpate, Momo, Biryani"
            className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              उत्पादित प्लेट संख्या (Plates Produced) *
            </label>
            <input
              type="number"
              min="1"
              value={platesProduced}
              onChange={(e) => setPlatesProduced(Math.max(1, parseInt(e.target.value) || 1))}
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">
              प्रति प्लेट बिक्री मूल्य (Selling Price रू)
            </label>
            <input
              type="number"
              min="0"
              value={sellingPricePerPlate}
              onChange={(e) => setSellingPricePerPlate(Math.max(0, parseFloat(e.target.value) || 0))}
              placeholder="उदा: 80"
              className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:outline-none"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2 pt-1">
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              ग्यास लागत (Gas Cost रू / ब्याच)
            </label>
            <input
              type="number"
              min="0"
              value={gasCost}
              onChange={(e) => setGasCost(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
            />
          </div>
          <div>
            <label className="text-[11px] font-semibold text-gray-600 block mb-1">
              अन्य प्रत्यक्ष लागत (Other Cost रू)
            </label>
            <input
              type="number"
              min="0"
              value={otherCost}
              onChange={(e) => setOtherCost(Math.max(0, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 rounded-xl border border-gray-200 text-xs focus:outline-none"
            />
          </div>
        </div>
      </div>

      {/* 2. Ingredients List */}
      <div className="bg-white p-4 rounded-2xl border border-orange-100 shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b pb-1.5">
          <h3 className="text-xs font-black text-gray-900 flex items-center gap-1.5">
            <Scale className="w-4 h-4 text-emerald-600" />
            <span>२. कच्चा पदार्थको सूची (Ingredients)</span>
          </h3>
          <button
            type="button"
            onClick={handleAddIngredient}
            className="px-2.5 py-1 rounded-xl bg-orange-600 text-white text-xs font-bold flex items-center gap-1 hover:bg-orange-700 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>सामग्री थप्नुहोस्</span>
          </button>
        </div>

        {hasIncompatibleUnits && (
          <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-200 text-amber-800 text-[11px] flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>चेतावनी: केही सामग्रीमा खरिद इकाइ र प्रयोग इकाइ नमिल्दो (जस्तै लिटरबाट ग्राम) छन्। सही नतिजाको लागि एकै जातका इकाइ छान्नुहोस्।</span>
          </div>
        )}

        <div className="space-y-3 pt-1">
          {ingredientDetails.map((ing, idx) => (
            <div key={ing.id} className="p-3 bg-gray-50 rounded-2xl border border-gray-200 space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-orange-950">#{idx + 1} सामग्री</span>
                <button
                  type="button"
                  onClick={() => handleRemoveIngredient(ing.id)}
                  className="text-gray-400 hover:text-rose-600 p-1"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>

              <div>
                <input
                  type="text"
                  value={ing.name}
                  onChange={(e) => handleUpdateIngredient(ing.id, { name: e.target.value })}
                  placeholder="सामग्रीको नाम (उदा: Potato / आलु)"
                  className="w-full px-2.5 py-1.5 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-0.5">खरिद परिमाण (Purchase Qty)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0.001"
                      step="any"
                      value={ing.purchaseQuantity}
                      onChange={(e) =>
                        handleUpdateIngredient(ing.id, { purchaseQuantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
                    />
                    <select
                      value={ing.purchaseUnit}
                      onChange={(e) => handleUpdateIngredient(ing.id, { purchaseUnit: e.target.value as any })}
                      className="px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-[11px]"
                    >
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="packet">packet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-0.5">खरिद मूल्य (Price रू)</label>
                  <input
                    type="number"
                    min="0"
                    value={ing.purchasePrice}
                    onChange={(e) =>
                      handleUpdateIngredient(ing.id, { purchasePrice: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-2">
                  <label className="text-[10px] font-bold text-gray-600 block mb-0.5">ब्याचमा प्रयोग (Usage Qty)</label>
                  <div className="flex gap-1">
                    <input
                      type="number"
                      min="0"
                      step="any"
                      value={ing.usageQuantity}
                      onChange={(e) =>
                        handleUpdateIngredient(ing.id, { usageQuantity: parseFloat(e.target.value) || 0 })
                      }
                      className="w-full px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
                    />
                    <select
                      value={ing.usageUnit}
                      onChange={(e) => handleUpdateIngredient(ing.id, { usageUnit: e.target.value as any })}
                      className="px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-[11px]"
                    >
                      <option value="kg">kg</option>
                      <option value="gram">gram</option>
                      <option value="litre">litre</option>
                      <option value="ml">ml</option>
                      <option value="piece">piece</option>
                      <option value="packet">packet</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-bold text-gray-600 block mb-0.5">फोहोर/सुक्ने (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={ing.wastagePercent}
                    onChange={(e) =>
                      handleUpdateIngredient(ing.id, { wastagePercent: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-2 py-1.5 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex justify-between items-center pt-1 border-t border-gray-200/60 text-xs font-black text-gray-900">
                <span className="text-[11px] text-gray-600 font-normal">सामग्रीको कुल लागत:</span>
                <span className="text-orange-700">रू {ing.calculatedCost.toFixed(2)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 3. Results Summary Dashboard */}
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 p-4 rounded-2xl border border-orange-200 shadow-md space-y-3">
        <h3 className="text-xs font-black text-orange-950 uppercase tracking-wide border-b border-orange-200 pb-1.5 flex items-center gap-1.5">
          <DollarSign className="w-4 h-4 text-orange-600" />
          <span>३. ब्याच र प्रति प्लेट लागत नतिजा (Results Summary)</span>
        </h3>

        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
            <span className="text-[10px] text-gray-500 block">कुल सामग्री लागत</span>
            <span className="font-bold text-gray-900 text-sm">रू {totalIngredientCost.toFixed(2)}</span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
            <span className="text-[10px] text-gray-500 block">ग्यास + अन्य लागत</span>
            <span className="font-bold text-gray-900 text-sm">रू {(Number(gasCost) + Number(otherCost)).toFixed(2)}</span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
            <span className="text-[10px] text-gray-500 block">कुल ब्याच लागत (Total Cost)</span>
            <span className="font-bold text-orange-700 text-sm">रू {totalBatchCost.toFixed(2)}</span>
          </div>

          <div className="bg-white/80 p-2.5 rounded-xl border border-orange-100">
            <span className="text-[10px] text-gray-500 block">उत्पादित प्लेट संख्या</span>
            <span className="font-bold text-gray-900 text-sm">{platesProduced} प्लेट</span>
          </div>
        </div>

        <div className="p-3 bg-orange-600 text-white rounded-2xl shadow-sm space-y-2">
          <div className="flex justify-between items-center text-xs border-b border-orange-500/50 pb-1.5">
            <span>प्रति प्लेट लागत (Cost / Plate):</span>
            <span className="font-black text-base">रू {costPerPlate.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span>बिक्री मूल्य (Selling Price):</span>
            <span className="font-black">रू {sellingPrice.toFixed(2)}</span>
          </div>

          <div className="flex justify-between items-center text-xs">
            <span>नाफा (खर्च कटाई अघि / Profit before overhead):</span>
            <span className={`font-black text-sm ${profitPerPlate >= 0 ? 'text-emerald-200' : 'text-rose-200'}`}>
              रू {profitPerPlate.toFixed(2)}
            </span>
          </div>

          <div className="flex justify-between items-center text-xs pt-1 border-t border-orange-500/50">
            <span>नाफा प्रतिशत (Profit Margin):</span>
            <span className="font-black text-emerald-200">{profitMargin.toFixed(2)}%</span>
          </div>
        </div>

        <p className="text-[10px] text-orange-900/80 italic text-center">
          * नोट: यो नाफा भाडा, कर्मचारी तलब र अन्य स्थिर खर्च (Overhead) घटाउनु अघिको खुद नाफा हो।
        </p>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 pt-2">
          <button
            type="button"
            onClick={handleDuplicateRecipe}
            className="py-2.5 rounded-xl bg-white hover:bg-orange-100 text-orange-900 border border-orange-300 font-bold text-xs flex items-center justify-center gap-1 transition shadow-xs"
          >
            <Copy className="w-3.5 h-3.5" />
            <span>प्रतिलिपि बनाउनुहोस्</span>
          </button>

          <button
            type="button"
            onClick={handleSaveRecipe}
            className="py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs flex items-center justify-center gap-1 transition shadow-md"
          >
            <Save className="w-4 h-4" />
            <span>{currentSavedId ? 'अपडेट गर्नुहोस्' : 'रेसिपी सेभ गर्नुहोस्'}</span>
          </button>
        </div>
      </div>

      {/* Saved Recipes Modal */}
      {showSavedModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
          <div className="w-full max-w-sm bg-white rounded-3xl p-5 shadow-2xl space-y-3 max-h-[85vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b pb-2">
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-1.5">
                <FolderOpen className="w-4 h-4 text-orange-600" />
                <span>सेभ भएका रेसिपीहरू ({savedRecipes.length})</span>
              </h3>
              <button
                onClick={() => setShowSavedModal(false)}
                className="text-gray-400 hover:text-gray-700 text-xs font-bold"
              >
                बन्द गर्नुहोस्
              </button>
            </div>

            {savedRecipes.length === 0 ? (
              <div className="text-center py-6 text-xs text-gray-500">
                कुनै पनि रेसिपी सेभ गरिएको छैन।
              </div>
            ) : (
              <div className="space-y-2">
                {savedRecipes.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3 rounded-2xl border border-orange-100 bg-orange-50/40 hover:bg-orange-50 flex items-center justify-between gap-2"
                  >
                    <div>
                      <h4 className="font-bold text-xs text-gray-900">{rec.recipeName}</h4>
                      <p className="text-[10px] text-gray-500">
                        उत्पादन: {rec.platesProduced} प्लेट • लागत: रू {(rec.gasCost + rec.otherCost + rec.ingredients.reduce((s, i) => s + 50, 0)).toFixed(0)}
                      </p>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleLoadRecipe(rec)}
                        className="px-2 py-1 rounded-xl bg-orange-600 text-white text-[10px] font-bold"
                      >
                        खोल्नुहोस्
                      </button>
                      <button
                        onClick={() => handleDeleteSaved(rec.id)}
                        className="p-1.5 rounded-xl text-rose-600 hover:bg-rose-50"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
