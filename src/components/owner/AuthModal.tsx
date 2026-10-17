import React, { useState } from 'react';
import { signInOwner, signUpOwner } from '../../lib/supabase';
import { Store, Lock, Mail, AlertCircle, X, CheckCircle, UserPlus, LogIn } from 'lucide-react';

interface AuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAuthSuccess: () => void;
}

export const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose, onAuthSuccess }) => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successNotice, setSuccessNotice] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessNotice('');

    if (!email.trim() || !password.trim()) {
      setErrorMsg('कृपया इमेल र पासवर्ड राख्नुहोस्।');
      return;
    }

    if (password.length < 6) {
      setErrorMsg('पासवर्ड कम्तिमा ६ अक्षरको हुनुपर्छ।');
      return;
    }

    try {
      setIsLoading(true);
      if (isRegister) {
        const { user, error } = await signUpOwner(email.trim(), password);
        if (error) throw new Error(error);
        if (user) {
          setSuccessNotice('खाता सफलतापूर्वक बन्यो! लगइन गरिँदैछ...');
          setTimeout(() => {
            onAuthSuccess();
            onClose();
          }, 800);
        }
      } else {
        const { user, error } = await signInOwner(email.trim(), password);
        if (error) throw new Error(error);
        if (user) {
          onAuthSuccess();
          onClose();
        }
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'लगइन गर्न सकिएन। विवरण जाँच गर्नुहोस्।');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 font-['Mukta',sans-serif]">
      <div className="w-full max-w-sm rounded-3xl bg-white p-5 shadow-2xl border border-orange-100 space-y-3.5 animate-fadeIn">
        <div className="flex items-center justify-between pb-2 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-orange-600 text-white flex items-center justify-center font-bold text-sm">
              <Store className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                {isRegister ? 'पसल सञ्चालक दर्ता (Register)' : 'साहुजी लगइन (Owner Login)'}
              </h3>
              <p className="text-[11px] text-gray-500">पसल व्यवस्थापन गर्न सुरक्षित लगइन</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-1.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successNotice && (
          <div className="p-2.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-center gap-1.5">
            <CheckCircle className="w-4 h-4 shrink-0 text-emerald-600" />
            <span>{successNotice}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3">
          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">इमेल (Email):</label>
            <div className="relative">
              <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="owner@example.com"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="text-[11px] font-bold text-gray-700 block mb-1">पासवर्ड (Password):</label>
            <div className="relative">
              <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="कम्तिमा ६ अक्षर"
                className="w-full pl-9 pr-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-bold text-xs shadow-md active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
          >
            {isRegister ? <UserPlus className="w-4 h-4" /> : <LogIn className="w-4 h-4" />}
            <span>{isLoading ? 'जाँच्दै...' : isRegister ? 'खाता बनाउनुहोस्' : 'लगइन गर्नुहोस्'}</span>
          </button>
        </form>

        <div className="text-center pt-2 border-t border-gray-100">
          <button
            type="button"
            onClick={() => {
              setIsRegister(!isRegister);
              setErrorMsg('');
            }}
            className="text-xs text-orange-700 font-bold hover:underline"
          >
            {isRegister ? 'पहिले नै खाता छ? लगइन गर्नुहोस्' : 'नयाँ पसल हो? नयाँ खाता खोल्नुहोस्'}
          </button>
        </div>
      </div>
    </div>
  );
};
