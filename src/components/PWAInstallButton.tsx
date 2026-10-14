import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Download, Smartphone, X } from 'lucide-react';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running standalone, suppress
  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        onClick={install}
        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold shadow hover:bg-emerald-800 transition active:scale-95"
      >
        <Download className="w-3.5 h-3.5" />
        <span>एप इन्स्टल (Install)</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold shadow hover:bg-emerald-800 transition"
        >
          <Smartphone className="w-3.5 h-3.5" />
          <span>iOS मा राख्नुहोस्</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between mb-3">
                <h3 className="font-bold text-gray-900">iPhone / iPad मा इन्स्टल गर्ने तरिका</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-full text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <p className="text-sm text-gray-600 space-y-2">
                १. सफारी (Safari) ब्राउजरको तलको <strong>Share (सेयर)</strong> बटन थिच्नुहोस्।<br />
                २. तल सार्दै <strong>"Add to Home Screen"</strong> रोज्नुहोस्।
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-4 w-full rounded-xl bg-orange-600 py-2.5 text-sm font-semibold text-white hover:bg-orange-700"
              >
                बुझें (Close)
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
