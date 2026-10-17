import React, { useState } from 'react';
import { Database, RefreshCw, Copy, Check, ExternalLink, AlertTriangle, ShieldCheck } from 'lucide-react';

interface DatabaseErrorScreenProps {
  errorMessage?: string;
  onRetry: () => void;
  isRetrying?: boolean;
}

export const DatabaseErrorScreen: React.FC<DatabaseErrorScreenProps> = ({
  errorMessage,
  onRetry,
  isRetrying = false,
}) => {
  const [copied, setCopied] = useState(false);

  const envSnippet = `VITE_SUPABASE_URL="https://your-project.supabase.co"
VITE_SUPABASE_ANON_KEY="eyJhbGciOi..."`;

  const copyEnvSnippet = () => {
    navigator.clipboard.writeText(envSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div className="min-h-screen bg-[#FFFDF9] flex items-center justify-center p-4 font-['Mukta',sans-serif]">
      <div className="max-w-md w-full bg-white rounded-3xl p-6 shadow-xl border border-orange-200 space-y-4">
        {/* Header Icon */}
        <div className="w-16 h-16 rounded-2xl bg-amber-500/10 text-amber-700 flex items-center justify-center mx-auto">
          <Database className="w-8 h-8" />
        </div>

        <div className="text-center space-y-1">
          <h2 className="text-xl font-extrabold text-gray-900">
            डाटाबेस जडान आवश्यक छ (Supabase Required)
          </h2>
          <p className="text-xs text-gray-600">
            यो एप वास्तविक व्यापारिक उत्पादन (Production) संस्करण हो। कुनै पनि नक्कली वा डेमो डाटा प्रयोग गरिएको छैन।
          </p>
        </div>

        {/* Error Detail Pill */}
        {errorMessage && (
          <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 text-rose-900 text-xs flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
            <div className="leading-snug">
              <strong>त्रुटि विवरण:</strong>
              <p className="mt-0.5 font-mono text-[11px] break-all">{errorMessage}</p>
            </div>
          </div>
        )}

        {/* 3 Step Setup Guide */}
        <div className="bg-orange-50/60 rounded-2xl p-4 border border-orange-100 space-y-3 text-xs text-gray-800">
          <h3 className="font-bold text-orange-950 flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4 text-orange-600" />
            <span>२ मिनेटमा Supabase जडान गर्ने तरिका:</span>
          </h3>

          <div className="space-y-2 text-gray-700">
            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                १
              </span>
              <p>
                <a
                  href="https://supabase.com"
                  target="_blank"
                  rel="noreferrer"
                  className="font-bold text-orange-700 underline inline-flex items-center gap-0.5"
                >
                  Supabase.com <ExternalLink className="w-3 h-3" />
                </a>{' '}
                मा निःशुल्क नयाँ प्रोजेक्ट बनाउनुहोस्।
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                २
              </span>
              <p>
                प्रोजेक्टको <strong>SQL Editor</strong> मा गई <code className="bg-orange-100 text-orange-900 px-1 py-0.5 rounded font-mono">supabase/schema.sql</code> फाइलको सम्पूर्ण कोड रन (Run) गर्नुहोस्।
              </p>
            </div>

            <div className="flex items-start gap-2">
              <span className="w-5 h-5 rounded-full bg-orange-600 text-white font-bold flex items-center justify-center text-[10px] shrink-0 mt-0.5">
                ३
              </span>
              <div>
                <p>
                  प्रोजेक्ट Settings ➔ API बाट <strong>Project URL</strong> र <strong>anon public key</strong> लाई <code className="bg-orange-100 text-orange-900 px-1 py-0.5 rounded font-mono">.env</code> फाइलमा राख्नुहोस्:
                </p>
                <div className="mt-1.5 relative">
                  <pre className="bg-gray-900 text-gray-100 p-2.5 rounded-xl font-mono text-[10px] overflow-x-auto">
                    {envSnippet}
                  </pre>
                  <button
                    onClick={copyEnvSnippet}
                    className="absolute right-2 top-2 p-1.5 rounded-lg bg-gray-800 text-gray-300 hover:text-white"
                    title="Copy snippet"
                  >
                    {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Retry Button */}
        <button
          onClick={onRetry}
          disabled={isRetrying}
          className="w-full py-3 rounded-2xl bg-orange-600 hover:bg-orange-700 text-white font-black text-sm shadow-md flex items-center justify-center gap-2 active:scale-98 transition disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${isRetrying ? 'animate-spin' : ''}`} />
          <span>{isRetrying ? 'जडान जाँच्दै...' : 'पुनः प्रयास गर्नुहोस् (Retry Connection)'}</span>
        </button>
      </div>
    </div>
  );
};
