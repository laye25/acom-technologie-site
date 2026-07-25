// src/ai-demo/services/I18nEngine.ts
/**
 * I18nEngine - Multilingual Localization Engine for Acom AI Demo Platform
 * Keeps structural SAI timeline data language-agnostic while providing localized
 * overlays, voice narrations, pro tips, and FAQs in French (FR), English (EN),
 * Wolof (WO), and Arabic (AR).
 */

export type SupportedLanguage = 'fr' | 'en' | 'wo' | 'ar';

export interface LocalizedDictionary {
  language: SupportedLanguage;
  label: string;
  flag: string;
  translations: Record<string, string>;
}

export class I18nEngine {
  private static dictionaries: Record<SupportedLanguage, LocalizedDictionary> = {
    fr: {
      language: 'fr',
      label: 'Français',
      flag: '🇫🇷',
      translations: {
        'scenario.title': 'Dépôt & Enregistrement d\'Articles - Acom Pressing',
        'step.1.title': 'Réception Client',
        'step.1.desc': 'Saisir le nom du client et ajouter les articles apportés à l\'atelier.',
        'step.2.title': 'Sélection des Articles',
        'step.2.desc': 'Choix de la catégorie Vêtements et du type de lavage.',
        'step.3.title': 'Paiement & Cash In',
        'step.3.desc': 'Encaissement de l\'acompte et émission du ticket de caisse thermique.',
        'button.replay': 'Rejouer le Scénario',
        'button.guidance': 'Démarrer le Guidage Direct'
      }
    },
    en: {
      language: 'en',
      label: 'English',
      flag: '🇬🇧',
      translations: {
        'scenario.title': 'Item Drop-off & Intake - Acom Laundry POS',
        'step.1.title': 'Customer Reception',
        'step.1.desc': 'Enter customer name and log items brought into the shop.',
        'step.2.title': 'Item Selection',
        'step.2.desc': 'Select garment category and cleaning process type.',
        'step.3.title': 'Payment & Cash In',
        'step.3.desc': 'Collect partial deposit and print thermal receipt.',
        'button.replay': 'Replay Scenario',
        'button.guidance': 'Start Live Guidance'
      }
    },
    wo: {
      language: 'wo',
      label: 'Wolof',
      flag: '🇸🇳',
      translations: {
        'scenario.title': 'Jënd ak Yebbul Yére - Acom Pressing',
        'step.1.title': 'Dalal Jëndkat bi',
        'step.1.desc': 'Bind turu jëndkat bi ak yére yimu andil ci pressaang bi.',
        'step.2.title': 'Tann Yére yi',
        'step.2.desc': 'Tann xeetu yére bi ak laasaw xettali gi.',
        'step.3.title': 'Fey ak Jëfëndikoo Kaisse',
        'step.3.desc': 'Fey limu wara jëkke fey te mën a génne kayitu ticket bi.',
        'button.replay': 'Delloo Scénario bi',
        'button.guidance': 'Tambali Tekki bi'
      }
    },
    ar: {
      language: 'ar',
      label: 'العربية',
      flag: '🇸🇦',
      translations: {
        'scenario.title': 'إيداع وتسجيل الملابس - أكوم دراي كلين',
        'step.1.title': 'استقبال العميل',
        'step.1.desc': 'إدخال اسم العميل وإضافة الملابس المستلمة للمغسلة.',
        'step.2.title': 'اختيار الملابس',
        'step.2.desc': 'تحديد فئة الملابس ونوع الغسيل المطلوب.',
        'step.3.title': 'الدفع واستلام الدفعة',
        'step.3.desc': 'تحصيل الدفعة المقدمة وطباعة إيصال الاستلام الحراري.',
        'button.replay': 'إعادة تشغيل السيناريو',
        'button.guidance': 'بدء الإرشاد المباشر'
      }
    }
  };

  public static getDictionary(lang: SupportedLanguage): LocalizedDictionary {
    return this.dictionaries[lang] || this.dictionaries.fr;
  }

  public static translate(key: string, lang: SupportedLanguage = 'fr'): string {
    const dict = this.getDictionary(lang);
    return dict.translations[key] || key;
  }

  public static getSupportedLanguages(): Array<{ code: SupportedLanguage; label: string; flag: string }> {
    return Object.values(this.dictionaries).map((d) => ({
      code: d.language,
      label: d.label,
      flag: d.flag
    }));
  }
}
