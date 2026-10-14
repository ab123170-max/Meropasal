import React, { useState } from 'react';
import { Product, ProductVariant, Category, Ingredient } from '../../types';
import { saveProduct, deleteProduct } from '../../lib/storage';
import {
  UtensilsCrossed,
  Plus,
  Edit2,
  Trash2,
  Layers,
  X,
  Check,
  AlertCircle,
  Eye,
  EyeOff,
  DollarSign,
  Boxes,
} from 'lucide-react';

interface MenuManagerProps {
  products: Product[];
  categories: Category[];
  ingredients: Ingredient[];
  onMenuUpdated: () => void;
}

export const MenuManager: React.FC<MenuManagerProps> = ({
  products,
  categories,
  ingredients,
  onMenuUpdated,
}) => {
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('all');
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [editingVariants, setEditingVariants] = useState<Partial<ProductVariant>[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const filteredProducts = products.filter((p) => {
    if (selectedCategoryId === 'all') return true;
    return p.category_id === selectedCategoryId;
  });

  // Open modal to add new product
  const handleAddNewProduct = () => {
    setEditingProduct({
      name: '',
      name_ne: '',
      category_id: categories[0]?.id || '',
      description: '',
      image_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=600&q=80',
      is_active: true,
    });
    // Start with 1 default variant
    setEditingVariants([
      {
        name: 'साधारण (Regular)',
        name_ne: 'साधारण',
        price: 100,
        estimated_cost: 30,
        is_available: true,
      },
    ]);
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Open modal to edit existing product
  const handleEditProduct = (prod: Product) => {
    setEditingProduct({ ...prod });
    setEditingVariants(
      (prod.variants || []).map((v) => ({ ...v }))
    );
    setErrorMsg('');
    setIsModalOpen(true);
  };

  // Add a new variant row
  const handleAddVariantRow = () => {
    setEditingVariants((prev) => [
      ...prev,
      {
        name: '',
        name_ne: '',
        price: 0,
        estimated_cost: 0,
        is_available: true,
      },
    ]);
  };

  // Remove a variant row
  const handleRemoveVariantRow = (index: number) => {
    if (editingVariants.length <= 1) {
      setErrorMsg('कम्तिमा एउटा भेरियन्ट हुनैपर्छ (At least 1 variant required).');
      return;
    }
    setEditingVariants((prev) => prev.filter((_, idx) => idx !== index));
  };

  // Save Product and its variants
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');

    if (!editingProduct?.name?.trim()) {
      setErrorMsg('कृपया परिकारको नाम लेख्नुहोस् (Enter product name).');
      return;
    }

    if (editingVariants.length === 0) {
      setErrorMsg('कम्तिमा एउटा भेरियन्ट थप्नुहोस्।');
      return;
    }

    // Validate variants
    for (let i = 0; i < editingVariants.length; i++) {
      const v = editingVariants[i];
      if (!v.name?.trim()) {
        setErrorMsg(`भेरियन्ट #${i + 1} को नाम लेख्नुहोस्।`);
        return;
      }
      if (Number(v.price) < 0 || isNaN(Number(v.price))) {
        setErrorMsg(`भेरियन्ट "${v.name}" को मूल्य सही हुनुपर्छ।`);
        return;
      }
    }

    try {
      setIsSaving(true);
      await saveProduct(editingProduct, editingVariants);
      setIsModalOpen(false);
      onMenuUpdated();
    } catch (err: any) {
      setErrorMsg(err?.message || 'परिकार सेभ गर्न सकिएन।');
    } finally {
      setIsSaving(false);
    }
  };

  // Delete product
  const handleDeleteProduct = async (prodId: string, name: string) => {
    if (window.confirm(`के तपाईं "${name}" मेटाउन निश्चित हुनुहुन्छ?`)) {
      await deleteProduct(prodId);
      onMenuUpdated();
    }
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4 pt-3 space-y-3.5">
      {/* Header & Add Button */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-black text-gray-900 flex items-center gap-1.5">
            <UtensilsCrossed className="w-5 h-5 text-orange-600" />
            <span>मेनु र परिकार (Menu & Variants)</span>
          </h2>
          <p className="text-xs text-gray-500">खाना र यसका भेरियन्टहरू व्यवस्थापन गर्नुहोस्</p>
        </div>

        <button
          onClick={handleAddNewProduct}
          className="flex items-center gap-1 px-3 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-xs active:scale-95 transition"
        >
          <Plus className="w-4 h-4" />
          <span>नयाँ खाना थप्नुहोस्</span>
        </button>
      </div>

      {/* Category Filter */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none -mx-4 px-4 text-xs font-bold">
        <button
          onClick={() => setSelectedCategoryId('all')}
          className={`shrink-0 px-3 py-1.5 rounded-full transition active:scale-95 ${
            selectedCategoryId === 'all'
              ? 'bg-orange-600 text-white shadow-xs'
              : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
          }`}
        >
          सबै
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategoryId(c.id)}
            className={`shrink-0 px-3 py-1.5 rounded-full transition active:scale-95 ${
              selectedCategoryId === c.id
                ? 'bg-orange-600 text-white shadow-xs'
                : 'bg-white text-gray-700 border border-orange-100 hover:bg-orange-50'
            }`}
          >
            {c.name_ne || c.name}
          </button>
        ))}
      </div>

      {/* Products & Variants List */}
      <div className="space-y-3">
        {filteredProducts.map((prod) => (
          <div
            key={prod.id}
            className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs"
          >
            {/* Top row: image + details + actions */}
            <div className="flex items-start gap-3">
              <img
                src={prod.image_url || 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=400&q=80'}
                alt={prod.name}
                className="w-16 h-16 rounded-xl object-cover bg-orange-50 shrink-0"
              />
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-1">
                  <h3 className="font-bold text-sm text-gray-900 truncate">
                    {prod.name_ne || prod.name}
                  </h3>
                  <div className="flex items-center gap-1 shrink-0">
                    <button
                      onClick={() => handleEditProduct(prod)}
                      className="p-1 rounded-lg text-gray-400 hover:text-orange-600 hover:bg-orange-50"
                      title="सम्पादन गर्नुहोस्"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(prod.id, prod.name)}
                      className="p-1 rounded-lg text-gray-400 hover:text-rose-600 hover:bg-rose-50"
                      title="मेटाउनुहोस्"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 line-clamp-1">{prod.description || 'नेपाली स्वाद'}</p>
                <div className="mt-1 flex items-center gap-2">
                  <span className="text-[10px] font-bold text-orange-800 bg-orange-50 px-2 py-0.5 rounded-md">
                    {(prod.variants || []).length} भेरियन्टहरू
                  </span>
                  {!prod.is_active && (
                    <span className="text-[10px] font-bold text-gray-500 bg-gray-100 px-2 py-0.5 rounded-md">
                      निष्क्रिय
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Variants table list */}
            <div className="mt-3 pt-2.5 border-t border-orange-50 space-y-1.5">
              {(prod.variants || []).map((v) => (
                <div
                  key={v.id}
                  className="flex items-center justify-between p-2 rounded-xl bg-orange-50/40 text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-2 h-2 rounded-full shrink-0 ${
                        v.is_available ? 'bg-emerald-500' : 'bg-gray-300'
                      }`}
                    />
                    <span className="font-semibold text-gray-800 truncate">
                      {v.name_ne || v.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <div className="text-right">
                      <span className="font-extrabold text-orange-600">रू {v.price}</span>
                      {v.estimated_cost > 0 && (
                        <p className="text-[10px] text-gray-500">
                          लागत: रू {v.estimated_cost} | नाफा: रू {v.price - v.estimated_cost}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Edit / Add Product & Variants Modal */}
      {isModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
          <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-gray-100">
              <h3 className="font-bold text-gray-900 text-sm">
                {editingProduct.id ? 'खाना सम्पादन गर्नुहोस्' : 'नयाँ खाना थप्नुहोस्'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-full text-gray-400 hover:text-gray-700"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {errorMsg && (
              <div className="mt-3 p-2 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{errorMsg}</span>
              </div>
            )}

            <form onSubmit={handleSaveProduct} className="mt-3 space-y-3.5">
              {/* Product Name */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  परिकारको नाम (Food Name) *
                </label>
                <input
                  type="text"
                  required
                  value={editingProduct.name || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({
                      ...prev,
                      name: e.target.value,
                      name_ne: prev?.name_ne || e.target.value,
                    }))
                  }
                  placeholder="उदा: Special Chatpate / चटपटे"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* Category */}
              <div>
                <label className="text-xs font-bold text-gray-700 block mb-1">
                  वर्ग (Category)
                </label>
                <select
                  value={editingProduct.category_id || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev, category_id: e.target.value }))
                  }
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name_ne || c.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Description */}
              <div>
                <label className="text-xs font-semibold text-gray-600 block mb-1">
                  विवरण (Description)
                </label>
                <input
                  type="text"
                  value={editingProduct.description || ''}
                  onChange={(e) =>
                    setEditingProduct((prev) => ({ ...prev, description: e.target.value }))
                  }
                  placeholder="उदा: भुजा, आलु, प्याज र स्पेशल मसला"
                  className="w-full px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
                />
              </div>

              {/* VARIANTS SECTION (Module 2 Requirement) */}
              <div className="pt-2 border-t border-gray-100">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h4 className="text-xs font-black text-gray-900 flex items-center gap-1">
                      <Layers className="w-3.5 h-3.5 text-orange-600" />
                      <span>भेरियन्टहरू (Variants)</span>
                    </h4>
                    <p className="text-[10px] text-gray-500">प्रत्येक भेरियन्टको नाम र बिक्री मूल्य राख्नुहोस्</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleAddVariantRow}
                    className="px-2 py-1 rounded-lg bg-orange-100 text-orange-800 text-[11px] font-bold flex items-center gap-1 hover:bg-orange-200"
                  >
                    <Plus className="w-3 h-3" />
                    <span>भेरियन्ट थप्नुहोस्</span>
                  </button>
                </div>

                <div className="space-y-2.5">
                  {editingVariants.map((v, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded-xl bg-orange-50/50 border border-orange-200 text-xs space-y-2"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-bold text-[11px] text-orange-950">
                          भेरियन्ट #{idx + 1}
                        </span>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1 text-[11px] font-semibold text-gray-600 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={v.is_available ?? true}
                              onChange={(e) => {
                                const next = [...editingVariants];
                                next[idx].is_available = e.target.checked;
                                setEditingVariants(next);
                              }}
                              className="rounded text-orange-600 focus:ring-orange-500"
                            />
                            <span>उपलब्ध छ</span>
                          </label>
                          {editingVariants.length > 1 && (
                            <button
                              type="button"
                              onClick={() => handleRemoveVariantRow(idx)}
                              className="text-rose-600 hover:text-rose-800 p-1"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2">
                        <div className="col-span-1">
                          <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                            नाम (उदा: सादा, चिकेन) *
                          </label>
                          <input
                            type="text"
                            required
                            value={v.name || ''}
                            onChange={(e) => {
                              const next = [...editingVariants];
                              next[idx].name = e.target.value;
                              next[idx].name_ne = e.target.value;
                              setEditingVariants(next);
                            }}
                            placeholder="Sada / Chicken"
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                            बिक्री मूल्य (रू) *
                          </label>
                          <input
                            type="number"
                            required
                            min="0"
                            value={v.price ?? ''}
                            onChange={(e) => {
                              const next = [...editingVariants];
                              next[idx].price = Number(e.target.value);
                              setEditingVariants(next);
                            }}
                            placeholder="60"
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                          />
                        </div>

                        <div>
                          <label className="text-[10px] font-bold text-gray-700 block mb-0.5">
                            कच्चा पदार्थ लागत (रू)
                          </label>
                          <input
                            type="number"
                            min="0"
                            value={v.estimated_cost ?? ''}
                            onChange={(e) => {
                              const next = [...editingVariants];
                              next[idx].estimated_cost = Number(e.target.value);
                              setEditingVariants(next);
                            }}
                            placeholder="18"
                            className="w-full px-2 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-2 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 py-2.5 rounded-xl bg-gray-100 text-gray-700 font-bold text-xs"
                >
                  रद्द (Cancel)
                </button>
                <button
                  type="submit"
                  disabled={isSaving}
                  className="flex-1 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md disabled:opacity-50"
                >
                  {isSaving ? 'सेभ गर्दै...' : 'सुरक्षित गर्नुहोस् (Save)'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
