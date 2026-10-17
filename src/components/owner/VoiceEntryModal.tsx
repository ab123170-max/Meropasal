import React, { useState, useEffect, useRef } from 'react';
import { parseNepaliVoiceText, isSpeechRecognitionSupported, ParsedVoiceEntry } from '../../lib/voiceParser';
import { addExpense, addHouseholdWithdrawal, createDirectSale } from '../../lib/storage';
import {
  Mic,
  MicOff,
  X,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
  Edit3,
} from 'lucide-react';

interface VoiceEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  shopId: string;
  onEntrySaved: () => void;
}

export const VoiceEntryModal: React.FC<VoiceEntryModalProps> = ({
  isOpen,
  onClose,
  shopId,
  onEntrySaved,
}) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interpreted, setInterpreted] = useState<ParsedVoiceEntry | null>(null);
  const [editedType, setEditedType] = useState<'sale' | 'expense' | 'withdrawal'>('sale');
  const [editedAmount, setEditedAmount] = useState<number>(0);
  const [editedDesc, setEditedDesc] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const recognitionRef = useRef<any>(null);
  const hasSpeech = isSpeechRecognitionSupported();

  useEffect(() => {
    if (!isOpen) {
      if (recognitionRef.current && isListening) {
        recognitionRef.current.stop();
      }
      setIsListening(false);
      setTranscript('');
      setInterpreted(null);
      setErrorMsg('');
    }
  }, [isOpen]);

  const startListening = () => {
    setErrorMsg('');
    setTranscript('');
    setInterpreted(null);

    const SpeechRecognition =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      setErrorMsg('तपाईंको ब्राउजरमा आवाज पहिचान (Speech Recognition) चल्दैन। कृपया तल हातले लेख्नुहोस्।');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'ne-NP'; // Nepali
      recognition.continuous = false;
      recognition.interimResults = true;

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        let currentText = '';
        for (let i = 0; i < event.results.length; i++) {
          currentText += event.results[i][0].transcript;
        }
        setTranscript(currentText);
      };

      recognition.onerror = (event: any) => {
        console.warn('Speech recognition error:', event);
        setIsListening(false);
        if (event.error === 'not-allowed') {
          setErrorMsg('माइक्रोफोन अनुमति पाइएन। कृपया फोन सेटिङबाट अनुमति दिनुहोस्।');
        } else {
          setErrorMsg('आवाज सुन्न सकिएन। कृपया फेरि बोल्नुहोस् वा हातले लेख्नुहोस्।');
        }
      };

      recognition.onend = () => {
        setIsListening(false);
        if (transcript) {
          handleParseText(transcript);
        }
      };

      recognitionRef.current = recognition;
      recognition.start();
    } catch (err: any) {
      setErrorMsg(err.message || 'माइक्रोफोन खोल्न सकिएन।');
      setIsListening(false);
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    setIsListening(false);
    if (transcript) {
      handleParseText(transcript);
    }
  };

  const handleParseText = (text: string) => {
    const parsed = parseNepaliVoiceText(text);
    setInterpreted(parsed);
    setEditedType(parsed.type);
    setEditedAmount(parsed.amount);
    setEditedDesc(parsed.description);
  };

  // Confirm and save entry
  const handleConfirmSave = async () => {
    if (!editedAmount || editedAmount <= 0) {
      setErrorMsg('कृपया सही रकम (Amount) उल्लेख गर्नुहोस्।');
      return;
    }

    try {
      setIsSaving(true);
      setErrorMsg('');

      if (editedType === 'sale') {
        // Record as quick cash counter sale
        await createDirectSale({
          shop_id: shopId,
          amount: editedAmount,
          description: editedDesc || 'काउन्टर बिक्री (Voice Sale)',
          payment_method: 'cash',
        });
      } else if (editedType === 'expense') {
        await addExpense({
          shop_id: shopId,
          category: (interpreted?.category as any) || 'other',
          amount: editedAmount,
          description: editedDesc || 'आवाजबाट रेकर्ड गरिएको खर्च',
          payment_method: 'cash',
          expense_date: new Date().toISOString().split('T')[0],
        });
      } else if (editedType === 'withdrawal') {
        await addHouseholdWithdrawal(shopId, editedAmount, editedDesc || 'व्यक्तिगत/घरखर्च');
      }

      onEntrySaved();
      onClose();
    } catch (err: any) {
      setErrorMsg(err?.message || 'हिसाब सेभ गर्न असफल भयो।');
    } finally {
      setIsSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 p-0 sm:p-4">
      <div className="w-full max-w-md bg-white rounded-t-3xl sm:rounded-3xl p-5 shadow-2xl max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-100">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-bold text-gray-900 text-sm">
                आवाजबाट हिसाब इन्ट्री (Voice Entry)
              </h3>
              <p className="text-[11px] text-gray-500">बोलेरै बिक्री वा खर्च रेकर्ड गर्नुहोस्</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-gray-400 hover:text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-3 p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Big Mic Button & Audio Indicator */}
        <div className="mt-4 text-center">
          <button
            type="button"
            onClick={isListening ? stopListening : startListening}
            className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center shadow-lg transition-all active:scale-95 ${
              isListening
                ? 'bg-rose-600 text-white animate-pulse ring-8 ring-rose-200'
                : 'bg-gradient-to-tr from-amber-500 to-orange-600 text-white hover:scale-105'
            }`}
          >
            {isListening ? <MicOff className="w-8 h-8" /> : <Mic className="w-8 h-8" />}
          </button>

          <p className="mt-2 text-xs font-bold text-gray-800">
            {isListening ? 'सुन्दैछ... बोल्नुहोस् (Listening...)' : 'बोल्नको लागि माइक थिच्नुहोस्'}
          </p>
          <p className="text-[10px] text-gray-400 mt-0.5">
            उदा: "आज ४००० को बिक्री भयो" वा "१५०० को तेल किने"
          </p>
        </div>

        {/* Live / Manual Transcription Input */}
        <div className="mt-4">
          <label className="text-[11px] font-bold text-gray-600 block mb-1">
            सुनेको वाक्य (बोलेको वा लेखेको):
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={transcript}
              onChange={(e) => {
                setTranscript(e.target.value);
                handleParseText(e.target.value);
              }}
              placeholder="उदा: आज चार हजारको बिक्री भयो..."
              className="flex-1 px-3 py-2 rounded-xl border border-gray-300 text-xs focus:ring-2 focus:ring-orange-500 focus:outline-none"
            />
            {transcript && (
              <button
                type="button"
                onClick={() => handleParseText(transcript)}
                className="px-3 py-2 bg-orange-100 text-orange-900 rounded-xl text-xs font-bold"
              >
                जाँच्नुहोस्
              </button>
            )}
          </div>
        </div>

        {/* INTERPRETED PREVIEW CARD (Confirmation before saving per Module 6 requirement) */}
        {interpreted && (
          <div className="mt-4 p-4 rounded-2xl bg-orange-50/70 border-2 border-orange-200 space-y-3 animate-fadeIn">
            <div className="flex items-center justify-between">
              <span className="text-xs font-black text-orange-950 flex items-center gap-1">
                <Sparkles className="w-3.5 h-3.5 text-orange-600" />
                <span>बुझिएको हिसाब (Interpreted Result)</span>
              </span>
              <span className="text-[10px] bg-white px-2 py-0.5 rounded-full border border-orange-200 text-orange-800 font-bold">
                सच्याउन मिल्छ
              </span>
            </div>

            {/* Editable Type Selector */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">प्रकार (Type):</label>
              <div className="grid grid-cols-3 gap-1.5 text-xs font-bold">
                <button
                  type="button"
                  onClick={() => setEditedType('sale')}
                  className={`py-1.5 rounded-lg border transition ${
                    editedType === 'sale'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  बिक्री (Sale)
                </button>
                <button
                  type="button"
                  onClick={() => setEditedType('expense')}
                  className={`py-1.5 rounded-lg border transition ${
                    editedType === 'expense'
                      ? 'bg-rose-600 text-white border-rose-600'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  खर्च (Expense)
                </button>
                <button
                  type="button"
                  onClick={() => setEditedType('withdrawal')}
                  className={`py-1.5 rounded-lg border transition ${
                    editedType === 'withdrawal'
                      ? 'bg-purple-600 text-white border-purple-600'
                      : 'bg-white text-gray-700 border-gray-200'
                  }`}
                >
                  घरखर्च (Draw)
                </button>
              </div>
            </div>

            {/* Editable Amount */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">रकम (Amount रू) *</label>
              <input
                type="number"
                min="1"
                required
                value={editedAmount || ''}
                onChange={(e) => setEditedAmount(Number(e.target.value))}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-sm font-black text-orange-700 focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
            </div>

            {/* Editable Description */}
            <div>
              <label className="text-[10px] font-bold text-gray-700 block mb-1">विवरण (Description):</label>
              <input
                type="text"
                value={editedDesc}
                onChange={(e) => setEditedDesc(e.target.value)}
                className="w-full px-3 py-2 rounded-xl bg-white border border-gray-300 text-xs focus:outline-none"
              />
            </div>

            {/* Mandatory Confirmation and Save */}
            <button
              type="button"
              disabled={isSaving || editedAmount <= 0}
              onClick={handleConfirmSave}
              className="w-full py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white font-black text-xs shadow-md active:scale-98 transition disabled:opacity-50 flex items-center justify-center gap-1.5"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{isSaving ? 'सेभ गर्दै...' : 'पक्का गरी सेभ गर्नुहोस् (Confirm & Save)'}</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
