// AgroSmart AI - Central Data Store & State Management

const STORAGE_KEY = 'agrosmart_ai_store';

const initialStoreData = {
  theme: 'dark',
  lang: 'uz',
  user: {
    name: 'Alisher Qodirov',
    role: 'Bosh Agronom / Fermer',
    region: 'Toshkent viloyati',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200'
  },
  stats: {
    totalAreaHectares: 18.5,
    healthScore: 92, // %
    waterSavedPercent: 38, // %
    activeAlerts: 2
  },
  // Plant Diseases Database for AI Scanner
  diseasesDB: [
    {
      id: 'dis-01',
      crop: 'pomidor',
      cropName: 'Pomidor',
      diseaseName: 'Pomidor Un-shudringi (Powdery Mildew)',
      scientificName: 'Leveillula taurica',
      severity: 76, // %
      riskLevel: 'high',
      causes: 'Yuqori havo namligi (85%+) va kechasi harorat keskin tushib ketishi natijasida zamburug\' sporalarining rivojlanishi.',
      symptoms: [
        'Barglarning ustki yuzasida oq unsimon dog\'lar paydo bo\'lishi',
        'Barglarning sarg\'ayishi va qurib burishib qolishi',
        'Meva tugunlarining rivojlanishdan to\'xtashi'
      ],
      treatment: {
        organic: 'Sut va suv aralashmasi (1:9 nisbatda) hamda 10 litr suvga 2 osh qoshiq osh sodasi va sovun sepish.',
        chemical: 'Topaz 100 EC (0.4 l/ga) yoki Fitosporin-M bio-fungitsidi. Sepish davriyligi: 7-10 kun.',
        waterAdvice: 'Barglarga suv tegmasligi uchun tomchilatib sug\'orishga o\'ting. Suv me\'yori: 2500 l/ga.',
        npkAdvice: 'Azotli o\'g\'itlarni vaqtincha to\'xtating, Kaliy (K) va Fosfor (P) dozasini 20% ga oshiring.'
      },
      sampleImg: 'https://images.unsplash.com/photo-1592417817098-8f3d6eb1b7a5?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'dis-02',
      crop: 'bodring',
      cropName: 'Bodring',
      diseaseName: 'Bodring Peronosporozi (Downy Mildew)',
      scientificName: 'Pseudoperonospora cubensis',
      severity: 82,
      riskLevel: 'critical',
      causes: 'Issiqxonada shamollatish yetarsizligi va barglarda shudring to\'planishi.',
      symptoms: [
        'Bargning ustida burchakli sariq-yashil dog\'lar',
        'Bargning ostki tomonida binafsha-kulrang g\'ubor',
        'Bosh poyaning tezda qurishi'
      ],
      treatment: {
        organic: 'Sarimsoq nastoykasi (200g maydalangan sarimsoq 10L suvda 24 soat ushlab sepiladi).',
        chemical: 'Ridomil Gold MZ (2.5 kg/ga) yoki Ordan fungitsidi. Zudlik bilan profilaktika o\'tkazilsin.',
        waterAdvice: 'Sug\'orishni faqat ertalab soat 06:00 - 08:00 orasida bajaring.',
        npkAdvice: 'Kaliy sulfat o\'g\'iti bilan bargdan oziqlantiring.'
      },
      sampleImg: 'https://images.unsplash.com/photo-1589923188900-85dae523342b?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'dis-03',
      crop: 'paxta',
      cropName: 'Paxta',
      diseaseName: 'Paxta Vilt Kasalligi (Verticillium Wilt)',
      scientificName: 'Verticillium dahliae',
      severity: 45,
      riskLevel: 'medium',
      causes: 'Tuproq orqali o\'tuvchi zamburug\' zambili va tuproq harorati 20-22°C darajada bo\'lishi.',
      symptoms: [
        'Barglar chetidan sarg\'ayib, tiyoq shaklida qurishi',
        'Poya ko\'ndalang kesilganda naychalarning jigarrang bo\'lishi'
      ],
      treatment: {
        organic: 'Trichoderma harzianum bio-fungitsidi bilan tuproqni boyitish.',
        chemical: 'Fundazol (1.5 kg/ga) preparati bilan urug\'larni ishlov berish va tuproqni sug\'orish.',
        waterAdvice: 'Zovur zovurlarini tozalang, tuproqda suv to\'planib qolmasin.',
        npkAdvice: 'Fosfor va rux (Zn) mikroelementlarini ko\'paytiring.'
      },
      sampleImg: 'https://images.unsplash.com/photo-1605001011155-c7f6352d01e4?auto=format&fit=crop&q=80&w=600'
    },
    {
      id: 'dis-04',
      crop: 'uzum',
      cropName: 'Uzum',
      diseaseName: 'Uzum Oidiumi (Powdery Mildew)',
      scientificName: 'Uncinula necator',
      severity: 30,
      riskLevel: 'low',
      causes: 'Issiq va quruq ob-havoda (25-30°C) uzumzorlarning qalinlashib ketishi.',
      symptoms: [
        'G\'ujumlarda kulrang unsimon g\'ubor',
        'Uzum mevalarining yorilib urug\'i ko\'rinib qolishi'
      ],
      treatment: {
        organic: 'Kul nastoykasi va yog\'och kulini shingillarga sepish.',
        chemical: 'Oltingugurt kukunini (Kolloid sulfur 30-40g/10L) changlatish.',
        waterAdvice: 'Uzum ostidagi tuproqni mulchalang.',
        npkAdvice: 'Kaliy magneziya o\'g\'iti sepilsin.'
      },
      sampleImg: 'https://images.unsplash.com/photo-1537640538966-79f369143f8f?auto=format&fit=crop&q=80&w=600'
    }
  ],
  // User Fields & Greenhouses
  fields: [
    {
      id: 'field-1',
      name: 'Qibray Issiqxonasi #1',
      type: 'greenhouse',
      crop: 'Pomidor (Izmir F1)',
      area: 0.5, // Hectares (50 sotix)
      plantedDate: '2026-03-10',
      soilMoisture: 72, // %
      temp: 26.5, // °C
      npk: { n: 140, p: 65, k: 210 }, // mg/kg
      healthStatus: 'warning',
      lastDiagnosis: '2026-08-14'
    },
    {
      id: 'field-2',
      name: 'Yangiyo\'l Bog'i',
      type: 'field',
      crop: 'Uzum (Husayni)',
      area: 5.0,
      plantedDate: '2022-04-15',
      soilMoisture: 60,
      temp: 29.0,
      npk: { n: 110, p: 80, k: 180 },
      healthStatus: 'good',
      lastDiagnosis: '2026-08-10'
    },
    {
      id: 'field-3',
      name: 'Chinaz Paxta Maydoni',
      type: 'field',
      crop: 'Paxta (Sulton F1)',
      area: 13.0,
      plantedDate: '2026-04-20',
      soilMoisture: 55,
      temp: 31.2,
      npk: { n: 95, p: 50, k: 140 },
      healthStatus: 'good',
      lastDiagnosis: '2026-08-01'
    }
  ],
  // Crop Wholesale Prices & AI Forecast
  marketPrices: [
    { crop: 'Pomidor', currentPrice: 12500, unit: 'kg', change: '+15%', forecastTrend: 'up', forecastNextMonth: 15500, advice: 'Avgust oxirida talab 25% oshadi. Sotishni ushlab turing.' },
    { crop: 'Bodring', currentPrice: 7200, unit: 'kg', change: '-8%', forecastTrend: 'down', forecastNextMonth: 6500, advice: 'Hosil yig\'im cho\'qqisi. Mahsulotni zudlik bilan bozorga chiqaring.' },
    { crop: 'Uzum (Husayni)', currentPrice: 22000, unit: 'kg', change: '+32%', forecastTrend: 'up', forecastNextMonth: 28000, advice: 'Eksport mavsumi boshlanishi munosabati bilan narx keskin ko\'tariladi.' },
    { crop: 'Kartoshka', currentPrice: 4800, unit: 'kg', change: '+2%', forecastTrend: 'stable', forecastNextMonth: 5000, advice: 'Barqaror narx dinamikasi. Omborda saqlash xarajati past.' },
    { crop: 'Olma (Fuji)', currentPrice: 14000, unit: 'kg', change: '+10%', forecastTrend: 'up', forecastNextMonth: 17500, advice: 'Sovutgich omborlariga joylash tavsiya etiladi.' }
  ],
  // Diagnostic History Log
  diagnosesHistory: [
    {
      id: 'diag-101',
      date: '2026-08-16 06:45',
      fieldName: 'Qibray Issiqxonasi #1',
      crop: 'Pomidor',
      disease: 'Pomidor Un-shudringi',
      severity: 76,
      status: 'active'
    },
    {
      id: 'diag-100',
      date: '2026-08-10 14:20',
      fieldName: 'Yangiyo\'l Bog'i',
      crop: 'Uzum',
      disease: 'Uzum Oidiumi',
      severity: 30,
      status: 'resolved'
    }
  ],
  // Agro Copilot Chat Messages
  copilotMessages: [
    {
      id: 'msg-1',
      sender: 'ai',
      text: 'Salom Alisher aka! Men sizning 24/7 AI Agronomingizman. Issiqxonangiz yoki ekinlaringiz bo\'yicha qanday maslahat beray?',
      timestamp: '07:30'
    }
  ]
};

class Store {
  constructor() {
    this.data = this.loadStore();
  }

  loadStore() {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.warn('LocalStorage error, using defaults', e);
    }
    return JSON.parse(JSON.stringify(initialStoreData));
  }

  saveStore() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.data));
    } catch (e) {
      console.error('Failed to save store', e);
    }
  }

  get(key) {
    return this.data[key];
  }

  set(key, value) {
    this.data[key] = value;
    this.saveStore();
  }

  update(key, partial) {
    this.data[key] = { ...this.data[key], ...partial };
    this.saveStore();
  }

  // Helper Methods
  addField(fieldData) {
    const newField = {
      id: 'field-' + Date.now(),
      plantedDate: new Date().toISOString().split('T')[0],
      soilMoisture: 65,
      temp: 25,
      npk: { n: 120, p: 70, k: 160 },
      healthStatus: 'good',
      lastDiagnosis: 'Bugun',
      ...fieldData
    };
    this.data.fields.unshift(newField);
    this.saveStore();
    return newField;
  }

  addDiagnosis(diag) {
    const newDiag = {
      id: 'diag-' + Date.now(),
      date: new Date().toLocaleString('uz-UZ'),
      status: 'active',
      ...diag
    };
    this.data.diagnosesHistory.unshift(newDiag);
    this.saveStore();
    return newDiag;
  }

  addCopilotMessage(sender, text) {
    const msg = {
      id: 'msg-' + Date.now(),
      sender,
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    this.data.copilotMessages.push(msg);
    this.saveStore();
    return msg;
  }

  resetStore() {
    localStorage.removeItem(STORAGE_KEY);
    this.data = JSON.parse(JSON.stringify(initialStoreData));
    this.saveStore();
  }
}

window.appStore = new Store();
