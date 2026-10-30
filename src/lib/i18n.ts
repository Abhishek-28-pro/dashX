/**
 * Bilingual Support (English / Hindi)
 * Meets accessibility requirement for lang attribute switching and translated civic labels.
 */

export type Language = 'en' | 'hi';

export interface Translations {
  appName: string;
  appTagline: string;
  nav: {
    home: string;
    report: string;
    track: string;
    maps: string;
    admin: string;
    skipLink: string;
  };
  roles: {
    citizen: string;
    admin: string;
    switchRole: string;
    mockNotice: string;
  };
  hero: {
    title: string;
    subtitle: string;
    reportCta: string;
    trackCta: string;
  };
  stats: {
    totalReports: string;
    resolvedRate: string;
    avgResponse: string;
    activeHotspots: string;
  };
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'PromptWars x Astra',
    appTagline: 'AI-Powered Municipal Issue Triage & Civic Dispatch',
    nav: {
      home: 'Dashboard',
      report: 'Report Issue',
      track: 'Track Status',
      maps: 'Hotspots & Map',
      admin: 'Admin Console',
      skipLink: 'Skip to main content',
    },
    roles: {
      citizen: 'Citizen Mode',
      admin: 'Admin Mode',
      switchRole: 'Switch to',
      mockNotice: 'MOCKED auth, not production-grade',
    },
    hero: {
      title: 'Smart Civic Infrastructure Resolution',
      subtitle:
        'Report civic issues in seconds. Powered by transparent deterministic priority scoring, deduplication, and Gemini AI triage.',
      reportCta: 'Report an Incident',
      trackCta: 'Track Existing Report',
    },
    stats: {
      totalReports: 'Total Reports',
      resolvedRate: 'Resolution Rate',
      avgResponse: 'Avg Response Time',
      activeHotspots: 'Active Hotspots',
    },
  },
  hi: {
    appName: 'प्रॉम्प्टवार्स x एस्ट्रा',
    appTagline: 'एआई-संचालित नागरिक समस्या निवारण एवं त्वरित सहायता',
    nav: {
      home: 'डैशबोर्ड',
      report: 'समस्या दर्ज करें',
      track: 'स्थिति जांचें',
      maps: 'हॉटस्पॉट और मानचित्र',
      admin: 'प्रशासनिक कंसोल',
      skipLink: 'मुख्य सामग्री पर जाएं',
    },
    roles: {
      citizen: 'नागरिक मोड',
      admin: 'प्रशासक मोड',
      switchRole: 'बदलें',
      mockNotice: 'डेमो प्रमाणीकरण (उत्पादन ग्रेड नहीं)',
    },
    hero: {
      title: 'स्मार्ट नागरिक अवसंरचना समाधान',
      subtitle:
        'नागरिक समस्याओं को कुछ ही सेकंड में दर्ज करें। पारदर्शी प्राथमिकता स्कोरिंग, डुप्लीकेट पहचान और जेमिनी एआई द्वारा संचालित।',
      reportCta: 'नई शिकायत दर्ज करें',
      trackCta: 'शिकायत की स्थिति देखें',
    },
    stats: {
      totalReports: 'कुल शिकायतें',
      resolvedRate: 'समाधान दर',
      avgResponse: 'औसत समाधान समय',
      activeHotspots: 'सक्रिय हॉटस्पॉट',
    },
  },
};
