import React, { useState } from 'react';
import {
  Flame,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Trash2,
  Download,
  Check,
  RefreshCw,
  Info,
  Scale,
} from 'lucide-react';
import { LpgCylinder, Shop } from '../../types';
import {
  getLpgCylinders,
  addLpgCylinder,
  updateLpgCylinder,
  markLpgFinished,
  deleteLpgCylinder,
} from '../../lib/storage';

interface LpgGasTrackerViewProps {
  shop: Shop;
  cylinders: LpgCylinder[];
  onGasUpdated: () => void;
}

export const LpgGasTrackerView: React.FC<LpgGasTrackerViewProps> = ({
  shop,
  cylinders,
  onGasUpdated,
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [purchaseDate, setPurchaseDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [finishedDate, setFinishedDate] = useState<string>('');
  const [refillCost, setRefillCost] = useState<string>('1850');
  const [cylinderSize, setCylinderSize] = useState<number>(14.2);
  const [quantity, setQuantity] = useState<number>(1);
  const [notes, setNotes] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Finishing modal state
  const [finishingId, setFinishingId] = useState<string | null>(null);
  const [finishDateVal, setFinishDateVal] = useState<string>(
    new Date().toISOString().split('T')[0]
  );

  // Calculate completed cylinders history & average duration
  const completedCylinders = cylinders.filter((c) => c.finished_date);
  const activeCylinder = cylinders.find((c) => !c.finished_date);

  // Calculate historical average duration in days
  const totalCompletedDays = completedCylinders.reduce((sum, c) => {
    const start = new Date(c.purchase_date).getTime();
    const end = new Date(c.finished_date!).getTime();
    const days = Math.max(1, Math.round((end - start) / 86400000));
    return sum + days;
  }, 0);

  const avgDurationDays =
    completedCylinders.length > 0
      ? Math.round(totalCompletedDays / completedCylinders.length)
      : 30; // Default fallback estimate if no history

  // Active cylinder calculations
  let activeElapsedDays = 0;
  let activeEstimatedRemainingDays = 0;
  let activeRemainingPct = 100;
  let activeEstimatedEmptyDate = '';
  let activeStatus: 'green' | 'yellow' | 'red' | 'empty' = 'green';

  if (activeCylinder) {
    const start = new Date(activeCylinder.purchase_date).getTime();
    const now = new Date().getTime();
    activeElapsedDays = Math.max(0, Math.round((now - start) / 86400000));
    activeEstimatedRemainingDays = Math.max(0, avgDurationDays - activeElapsedDays);
    activeRemainingPct =
      avgDurationDays > 0
        ? Math.max(0, Math.round(100 * (1 - activeElapsedDays / avgDurationDays)))
        : 100;

    const emptyTime = start + avgDurationDays * 86400000;
    activeEstimatedEmptyDate = new Date(emptyTime).toISOString().split('T')[0];

    if (activeRemainingPct > 50) {
      activeStatus = 'green';
    } else if (activeRemainingPct >= 20) {
      activeStatus = 'yellow';
    } else {
      activeStatus = 'red';
    }
  }

  // Monthly gas expenditure
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();
  const monthlyGasCost = cylinders
    .filter((c) => {
      const d = new Date(c.purchase_date);
      return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
    })
    .reduce((sum, c) => sum + Number(c.refill_cost), 0);

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);
    const cost = Number(refillCost);
    if (!cost || cost <= 0) {
      setErrorMsg('कृपया सही refill cost (मूल्य) प्रविष्ट गर्नुहोस्।');
      return;
    }

    setLoading(true);
    try {
      await addLpgCylinder({
        shop_id: shop.id,
        purchase_date: purchaseDate,
        finished_date: finishedDate ? finishedDate : null,
        refill_cost: cost,
        cylinder_size_kg: cylinderSize,
        quantity_purchased: quantity,
        notes: notes.trim() || undefined,
      });

      setShowAddModal(false);
      setNotes('');
      onGasUpdated();
    } catch (err: any) {
      setErrorMsg(err.message || 'ग्यास सिलिन्डर थप्न असफल भयो।');
    } finally {
      setLoading(false);
    }
  };

  const handleMarkFinishedSubmit = async (id: string) => {
    try {
      await markLpgFinished(id, finishDateVal);
      setFinishingId(null);
      onGasUpdated();
    } catch (err: any) {
      alert(`त्रुटि: ${err.message}`);
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('के तपाई यो ग्यास सिलिन्डर रेकर्ड मेटाउन चाहनुहुन्छ?')) {
      try {
        await deleteLpgCylinder(id);
        onGasUpdated();
      } catch (err: any) {
        alert(`त्रुटि: ${err.message}`);
      }
    }
  };

  const exportToCsv = () => {
    const headers = ['Purchase Date', 'Finished Date', 'Size (kg)', 'Cost (NPR)', 'Duration (Days)', 'Cost per Day (NPR)', 'Notes'];
    const rows = cylinders.map((c) => {
      const start = new Date(c.purchase_date).getTime();
      const end = c.finished_date ? new Date(c.finished_date).getTime() : null;
      const days = end ? Math.max(1, Math.round((end - start) / 86400000)) : '-';
      const costPerDay = end ? (Number(c.refill_cost) / Number(days)).toFixed(2) : '-';
      return [
        c.purchase_date,
        c.finished_date || 'Active',
        c.cylinder_size_kg,
        c.refill_cost,
        days,
        costPerDay,
        `"${c.notes || ''}"`,
      ];
    });

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `lpg_gas_history_${shop.slug}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="pb-24 max-w-md mx-auto p-4 space-y-5 font-['Mukta',sans-serif]">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-orange-600 to-amber-600 rounded-2xl p-5 text-white shadow-md flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <Flame className="w-7 h-7 text-amber-200 animate-pulse" />
            <h1 className="text-xl font-black">स्मार्ट LPG ग्यास ट्र्याकर</h1>
          </div>
          <p className="text-xs text-orange-100 mt-0.5">
            होटलको ग्यास खपत, अवधि र दैनिक खर्च व्यवस्थापन
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="bg-white text-orange-600 px-3.5 py-2.5 rounded-xl font-bold text-xs shadow hover:bg-orange-50 flex items-center gap-1.5 active:scale-95 transition"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>नयाँ सिलिन्डर</span>
        </button>
      </div>

      {/* Monthly Summary Cards */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
            <span>यस महिनाको ग्यास खर्च</span>
            <DollarSign className="w-4 h-4 text-orange-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-gray-900">Rs. {monthlyGasCost.toLocaleString()}</div>
            <p className="text-[10px] text-gray-400">चालू महिनामा खरिद</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-4 border border-orange-100 shadow-xs flex flex-col justify-between">
          <div className="flex items-center justify-between text-gray-500 text-xs font-bold">
            <span>औसत सिलिन्डर आयु</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="mt-2">
            <div className="text-lg font-black text-gray-900">{avgDurationDays} दिन</div>
            <p className="text-[10px] text-gray-400">
              {completedCylinders.length > 0 ? `${completedCylinders.length} रेकर्डमा आधारित` : 'पूर्वनिर्धारित अनुमान'}
            </p>
          </div>
        </div>
      </div>

      {/* Active Gas Cylinder & Live Level Indicator */}
      <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Flame className="w-5 h-5 text-orange-600" />
            <span>हाल चालु रहेको ग्यास सिलिन्डर (Active Cylinder)</span>
          </h2>
          {activeCylinder && (
            <span
              className={`text-xs font-bold px-2.5 py-1 rounded-full ${
                activeStatus === 'green'
                  ? 'bg-emerald-100 text-emerald-700'
                  : activeStatus === 'yellow'
                  ? 'bg-amber-100 text-amber-700'
                  : 'bg-rose-100 text-rose-700 animate-pulse'
              }`}
            >
              {activeStatus === 'green'
                ? 'सुरक्षित (>50%)'
                : activeStatus === 'yellow'
                ? 'मध्यम (20-50%)'
                : 'सकिने लाग्दैछ (<20%)'}
            </span>
          )}
        </div>

        {activeCylinder ? (
          <div className="space-y-4">
            {/* Visual Cylinder Level Graphic */}
            <div className="bg-gray-50 rounded-2xl p-4 border border-gray-200 flex items-center gap-4">
              {/* Cylinder Graphic */}
              <div className="relative w-14 h-24 bg-gray-200 rounded-t-xl rounded-b-lg border-2 border-gray-400 overflow-hidden flex flex-col justify-end shadow-inner">
                {/* Valve top */}
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-4 h-3 bg-gray-600 rounded-t-xs"></div>
                {/* Fill Level */}
                <div
                  className={`w-full transition-all duration-500 ${
                    activeStatus === 'green'
                      ? 'bg-emerald-500'
                      : activeStatus === 'yellow'
                      ? 'bg-amber-500'
                      : 'bg-rose-500'
                  }`}
                  style={{ height: `${Math.max(8, activeRemainingPct)}%` }}
                ></div>
                <div className="absolute inset-0 flex items-center justify-center text-[11px] font-black text-gray-800 drop-shadow-sm">
                  {activeRemainingPct}%
                </div>
              </div>

              {/* Details */}
              <div className="flex-1 space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">सिलिन्डर साइज:</span>
                  <span className="font-bold text-gray-900">{activeCylinder.cylinder_size_kg} kg</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">खरिद मिति:</span>
                  <span className="font-bold text-gray-900">{activeCylinder.purchase_date}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">बितिसकेको दिन:</span>
                  <span className="font-bold text-gray-900">{activeElapsedDays} दिन</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">अन्दाजी बाँकी दिन:</span>
                  <span className="font-bold text-orange-600">~{activeEstimatedRemainingDays} दिन</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">अन्दाजी रित्तिने मिति:</span>
                  <span className="font-bold text-gray-900">{activeEstimatedEmptyDate}</span>
                </div>
              </div>
            </div>

            {completedCylinders.length === 0 && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-800">
                <Info className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <p>
                  Gas level estimate will become available after recording a completed cylinder. हाल पूर्वनिर्धारित औसत ३० दिनको आधारमा गणना गरिएको छ।
                </p>
              </div>
            )}

            {/* Warning or Mark Finished Button */}
            <div className="flex items-center justify-between pt-1">
              <div>
                <span className="text-xs text-gray-500 font-medium">खरिद मूल्य: </span>
                <span className="text-sm font-black text-gray-900">Rs. {Number(activeCylinder.refill_cost).toLocaleString()}</span>
              </div>

              {finishingId === activeCylinder.id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="date"
                    value={finishDateVal}
                    onChange={(e) => setFinishDateVal(e.target.value)}
                    className="px-2 py-1.5 text-xs rounded-lg border border-gray-300 bg-white"
                  />
                  <button
                    onClick={() => handleMarkFinishedSubmit(activeCylinder.id)}
                    className="bg-emerald-600 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-emerald-700"
                  >
                    निश्चित गर्नुहोस्
                  </button>
                  <button
                    onClick={() => setFinishingId(null)}
                    className="text-gray-500 text-xs px-2 py-1.5 hover:bg-gray-100 rounded-lg"
                  >
                    रद्द
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => setFinishingId(activeCylinder.id)}
                  className="bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 px-3.5 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition active:scale-95"
                >
                  <Check className="w-4 h-4" />
                  <span>ग्यास समाप्त भयो (Mark Finished)</span>
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="text-center py-6 space-y-3 bg-gray-50 rounded-2xl border border-dashed border-gray-200">
            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-2xl flex items-center justify-center mx-auto">
              <Flame className="w-6 h-6" />
            </div>
            <div className="space-y-1">
              <p className="text-xs font-bold text-gray-800">कुनै पनि हाल चालु सिलिन्डर छैन।</p>
              <p className="text-[11px] text-gray-500">नयाँ ग्यास सिलिन्डर खरिद रेकर्ड थप्नुहोस्।</p>
            </div>
            <button
              onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-orange-600 text-white text-xs font-bold rounded-xl shadow hover:bg-orange-700"
            >
              + सिलिन्डर थप्नुहोस्
            </button>
          </div>
        )}
      </div>

      {/* Gas History & CSV Export */}
      <div className="bg-white rounded-2xl p-5 border border-orange-100 shadow-sm space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-gray-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-orange-600" />
            <span>ग्यास खरिद तथा खपत इतिहास (Gas History)</span>
          </h2>
          {cylinders.length > 0 && (
            <button
              onClick={exportToCsv}
              className="text-xs font-bold text-orange-600 hover:text-orange-700 bg-orange-50 hover:bg-orange-100 px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
            >
              <Download className="w-3.5 h-3.5" />
              <span>CSV डाउनलोड</span>
            </button>
          )}
        </div>

        {cylinders.length === 0 ? (
          <div className="text-center py-8 text-xs text-gray-500">
            अहिलेसम्म कुनै ग्यास सिलिन्डर रेकर्ड गरिएको छैन।
          </div>
        ) : (
          <div className="space-y-3">
            {cylinders.map((c) => {
              const start = new Date(c.purchase_date).getTime();
              const end = c.finished_date ? new Date(c.finished_date).getTime() : null;
              const days = end ? Math.max(1, Math.round((end - start) / 86400000)) : null;
              const costPerDay = end && days ? (Number(c.refill_cost) / days).toFixed(2) : null;

              return (
                <div
                  key={c.id}
                  className="bg-gray-50 rounded-2xl p-3.5 border border-gray-200 flex flex-col space-y-2 text-xs"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-gray-900 text-sm">
                        {c.cylinder_size_kg} kg सिलिन्डर
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                          c.finished_date
                            ? 'bg-gray-200 text-gray-700'
                            : 'bg-emerald-100 text-emerald-700 animate-pulse'
                        }`}
                      >
                        {c.finished_date ? 'समाप्त भएको' : 'चालू'}
                      </span>
                    </div>
                    <span className="font-black text-gray-900">
                      Rs. {Number(c.refill_cost).toLocaleString()}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-gray-600 text-[11px] pt-1 border-t border-gray-200">
                    <div>
                      <span className="text-gray-400">खरिद: </span>
                      <span className="font-bold text-gray-800">{c.purchase_date}</span>
                    </div>
                    <div>
                      <span className="text-gray-400">रित्तिएको: </span>
                      <span className="font-bold text-gray-800">{c.finished_date || 'हाल प्रयोगमा'}</span>
                    </div>
                    {days !== null && (
                      <>
                        <div>
                          <span className="text-gray-400">ट्याक्सी अवधि: </span>
                          <span className="font-bold text-gray-800">{days} दिन</span>
                        </div>
                        <div>
                          <span className="text-gray-400">दैनिक खर्च: </span>
                          <span className="font-bold text-orange-600">Rs. {costPerDay}/दिन</span>
                        </div>
                      </>
                    )}
                  </div>

                  {c.notes && (
                    <p className="text-[11px] text-gray-500 italic bg-white p-2 rounded-xl border border-gray-100">
                      टिप्पणी: {c.notes}
                    </p>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1">
                    <button
                      onClick={() => handleDelete(c.id)}
                      className="text-rose-600 hover:text-rose-700 p-1.5 rounded-lg hover:bg-rose-50 transition"
                      title="मेटाउनुहोस्"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Cylinder Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm space-y-4 shadow-2xl animate-in fade-in zoom-in duration-200">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                <Flame className="w-5 h-5 text-orange-600" />
                <span>नयाँ ग्यास सिलिन्डर रेकर्ड थप्नुहोस्</span>
              </h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-gray-100 text-gray-500 flex items-center justify-center font-bold hover:bg-gray-200"
              >
                ✕
              </button>
            </div>

            {errorMsg && (
              <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-bold">
                {errorMsg}
              </div>
            )}

            <form onSubmit={handleAddSubmit} className="space-y-3.5 text-xs">
              <div className="space-y-1">
                <label className="font-bold text-gray-700">सिलिन्डर साइज (Cylinder Size)</label>
                <select
                  value={cylinderSize}
                  onChange={(e) => setCylinderSize(Number(e.target.value))}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 bg-white font-bold"
                >
                  <option value={14.2}>14.2 kg (घरायसी/व्यावसायिक)</option>
                  <option value={19.0}>19.0 kg (व्यावसायिक ठूलो)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">रिफिल मूल्य (Refill Cost in NPR)</label>
                <input
                  type="number"
                  min="1"
                  value={refillCost}
                  onChange={(e) => setRefillCost(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-gray-300 font-bold"
                  placeholder="जस्तै: १८५०"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">खरिद मिति (Purchase Date)</label>
                  <input
                    type="date"
                    value={purchaseDate}
                    onChange={(e) => setPurchaseDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium"
                    required
                  />
                </div>
                <div className="space-y-1">
                  <label className="font-bold text-gray-700">समाप्त मिति (Optional Finish)</label>
                  <input
                    type="date"
                    value={finishedDate}
                    onChange={(e) => setFinishedDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-gray-300 font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="font-bold text-gray-700">टिप्पणी / नोट (Notes)</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2 rounded-xl border border-gray-300"
                  rows={2}
                  placeholder="कुनै विशेष टिप्पणी..."
                ></textarea>
              </div>

              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-3 px-4 rounded-xl border border-gray-300 bg-white text-gray-700 font-bold hover:bg-gray-50"
                >
                  रद्द गर्नुहोस्
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-1 py-3 px-4 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black shadow-md flex items-center justify-center gap-2"
                >
                  {loading ? 'सुरक्षित गर्दै...' : 'सुरक्षित गर्नुहोस्'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
