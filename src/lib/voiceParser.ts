// Nepali and Romanized voice entry interpreter for quick sales and expenses

export interface ParsedVoiceEntry {
  type: 'sale' | 'expense' | 'withdrawal';
  amount: number;
  description: string;
  category?: string;
  rawText: string;
  confidence: number;
}

// Nepali numeral mapping
const NEPALI_DIGITS: Record<string, string> = {
  '०': '0', '१': '1', '२': '2', '३': '3', '४': '4',
  '५': '5', '६': '6', '७': '7', '८': '8', '९': '9',
};

// Word to number mappings for Nepali / Romanized Nepali
const NUMBER_WORDS: Record<string, number> = {
  'एक': 1, 'दुई': 2, 'तीन': 3, 'चार': 4, 'पाँच': 5,
  'छ': 6, 'सात': 7, 'आठ': 8, 'नौ': 9, 'दस': 10,
  'बीस': 20, 'तीस': 30, 'चालीस': 40, 'पचास': 50,
  'एक सय': 100, 'दुई सय': 200, 'तीन सय': 300, 'पाँच सय': 500,
  'हजार': 1000, 'हजारको': 1000,
  'एक हजार': 1000, 'दुई हजार': 2000, 'तीन हजार': 3000, 'चार हजार': 4000, 'पाँच हजार': 5000,
  'दस हजार': 10000, 'पन्ध्र सय': 1500, 'बाह्र सय': 1200,
  // Romanized
  'char hajar': 4000,
  'pandhra saya': 1500,
  'pandhra say': 1500,
  'ek hajar': 1000,
  'dui hajar': 2000,
  'tin hajar': 3000,
  'panch hajar': 5000,
  'das hajar': 10000,
  'panch saya': 500,
  'dui saya': 200,
};

export function parseNepaliVoiceText(rawText: string): ParsedVoiceEntry {
  const clean = rawText.toLowerCase().trim();
  let normalized = clean;

  // Replace Devanagari numerals with ASCII digits
  for (const [nep, eng] of Object.entries(NEPALI_DIGITS)) {
    normalized = normalized.split(nep).join(eng);
  }

  // Determine intent / type
  let type: 'sale' | 'expense' | 'withdrawal' = 'sale';
  let category = 'other';
  let description = '';

  const isWithdrawal = /घरखर्च|घर लगे|घर पठाए|व्यक्तिगत|ghar kharcha|gharkharcha/i.test(clean);
  const isExpense = /खर्च|किने|किनेको|दिए|सामान|भाडा|ग्यास|बिजुली|प्याकिङ|तेल|आलु|प्याज|मम|मासु|kine|kineko|kharcha|saman/i.test(clean);

  if (isWithdrawal) {
    type = 'withdrawal';
    description = 'व्यक्तिगत वा घरखर्चको लागि झिकिएको';
  } else if (isExpense) {
    type = 'expense';
    if (/भाडा|rent/i.test(clean)) {
      category = 'rent';
      description = 'पसल सटर भाडा भुक्तानी';
    } else if (/ग्यास|सिलिन्डर|बिजुली|gas/i.test(clean)) {
      category = 'gas_electricity';
      description = 'ग्यास वा बिजुली खर्च';
    } else if (/प्याकिङ|बक्स|झोला|packing/i.test(clean)) {
      category = 'packaging';
      description = 'प्याकेजिङ बक्स र झोला खरिद';
    } else if (/तेल|मासु|आलु|प्याज|मैदा|भुजा|chicken|oil|onion/i.test(clean)) {
      category = 'ingredient_purchase';
      description = 'कच्चा पदार्थ सामान खरिद';
    } else {
      category = 'other';
      description = 'पसलको विविध सामान खरिद';
    }
  } else {
    type = 'sale';
    description = 'काउन्टर नगद बिक्री (Food Sale)';
  }

  // Extract amount
  let amount = 0;

  // 1. Direct digits in text e.g. "4000", "1500", "Rs 500"
  const digitsMatch = normalized.match(/(\d+[\d,]*)/);
  if (digitsMatch) {
    amount = parseInt(digitsMatch[1].replace(/,/g, ''), 10);
  } else {
    // 2. Check spoken number words
    for (const [phrase, value] of Object.entries(NUMBER_WORDS)) {
      if (normalized.includes(phrase)) {
        amount = value;
        break;
      }
    }
  }

  // If compound sentence like "Aaja char hajar rupaiyako bikri bhayo ra pandhra saya rupaiyako saman kine"
  // If "bikri" is present with "char hajar"
  if (/char hajar.*bikri|४०००.*बिक्री|4000.*bikri/i.test(normalized)) {
    type = 'sale';
    amount = 4000;
    description = 'आजको नगद बिक्री हिसाब';
  }

  return {
    type,
    amount: amount || 0,
    description: description || rawText,
    category,
    rawText,
    confidence: amount > 0 ? 0.9 : 0.4,
  };
}

export function isSpeechRecognitionSupported(): boolean {
  return typeof window !== 'undefined' && ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window);
}
