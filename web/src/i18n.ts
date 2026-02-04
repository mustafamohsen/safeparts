export type Lang = "en" | "ar";

export const STRINGS = {
  en: {
    appName: "Safeparts",
    tagline: "Split a secret into shares. Recover with k of n.",

    splitTab: "Split",
    combineTab: "Combine",

    theme: "Theme",
    dark: "Dark",
    light: "Light",

    language: "Language",
    english: "English",
    arabic: "العربية",
    github: "GitHub",
    help: "Docs",
    privacyNote:
      "Runs locally in your browser. Your secret never leaves your device.",

    splitTitle: "Split",
    splitSubtitle: "Turn one secret into multiple shares.",
    combineTitle: "Combine",
    combineSubtitle: "Paste shares to recover the secret.",

    secretLabel: "Secret",
    secretHint: "Anything: password, seed phrase, JSON…",

    kLabel: "Minimum shares to recover (k)",
    nLabel: "Total shares to create (n)",
    encodingLabel: "Share format",
    encodingBase64url: "Letters",
    encodingBase64urlDesc: "Compact alphanumeric (base64url)",
    encodingMnemoWords: "Words",
    encodingMnemoWordsDesc: "Easy to write mnemonic words",
    passphraseLabel: "Passphrase (optional)",

    splitCta: "Split",
    combineCta: "Combine",
    working: "Working…",

    sharesTitle: "Shares",
    sharesHint: "Store shares separately. Never share all of them.",
    shareNumber: "Share",

    sharesInputLabel: "Shares",
    sharesInputHint: "One share per box. You can add more as needed.",
    sharePlaceholder: "Paste a share here…",
    shareRequired: "Share content is required",
    addShare: "Add share",
    removeShare: "Remove",

    recoveredTitle: "Recovered secret",
    recoveredHint: "Handle carefully — this is sensitive.",

    copy: "Copy",
    copied: "Copied",

    wasmHint: "Before using this UI, run",
    wasmCommand: "bun run build:wasm",

    errorWasmMissing: "WASM module not found. Run bun run build:wasm.",

    keyboardShortcuts: "Keyboard shortcuts",
    shortcutClose: "Close",
    shortcutGoToSplit: "Go to Split",
    shortcutGoToCombine: "Go to Combine",
    shortcutSubmitForm: "Split/Combine",
    shortcutCopyResult: "Copy result",
    shortcutShowHelp: "Show shortcuts",
    shortcutShowKeytips: "Show keytips overlay",
  },
  ar: {
    appName: "Safeparts",
    tagline: "قسم السر إلى حصص. استعده باستخدام k من n.",

    splitTab: "تقسيم",
    combineTab: "استعادة",

    theme: "المظهر",
    dark: "داكن",
    light: "فاتح",

    language: "اللغة",
    english: "English",
    arabic: "العربية",
    github: "GitHub",
    help: "مساعدة",
    privacyNote: "يعمل محليا في المتصفح. الأسرار لا تغادر جهازك.",

    splitTitle: "تقسيم",
    splitSubtitle: "حول سرا واحدا إلى عدة حصص.",
    combineTitle: "استعادة",
    combineSubtitle: "الصق الحصص لاستعادة السر.",

    secretLabel: "السر",
    secretHint: "أي شيء: كلمة مرور، seed phrase، JSON…",

    kLabel: "الحد الأدنى للاستعادة (k)",
    nLabel: "إجمالي الحصص (n)",
    encodingLabel: "صيغة الحصة",
    encodingBase64url: "أحرف",
    encodingBase64urlDesc: "أحرف وأرقام مضغوطة (base64url)",
    encodingMnemoWords: "كلمات",
    encodingMnemoWordsDesc: "كلمات سهلة الكتابة",
    passphraseLabel: "عبارة مرور (اختياري)",

    splitCta: "قسم",
    combineCta: "استعادة",
    working: "جار العمل…",

    sharesTitle: "الحصص",
    sharesHint: "احفظ الحصص بشكل منفصل. لا تشاركها كلها.",
    shareNumber: "حصة",

    sharesInputLabel: "الحصص",
    sharesInputHint: "حصة واحدة في كل مربع. أضف المزيد عند الحاجة.",
    sharePlaceholder: "الصق الحصة هنا…",
    shareRequired: "محتوى الحصة مطلوب",
    addShare: "إضافة حصة",
    removeShare: "حذف",

    recoveredTitle: "السر المستعاد",
    recoveredHint: "تعامل بحذر — هذه بيانات حساسة.",

    copy: "نسخ",
    copied: "تم النسخ",

    wasmHint: "قبل استخدام الواجهة، شغل",
    wasmCommand: "bun run build:wasm",

    errorWasmMissing: "لم يتم العثور على WASM. شغل bun run build:wasm.",

    keyboardShortcuts: "اختصارات لوحة المفاتيح",
    shortcutClose: "إغلاق",
    shortcutGoToSplit: "الذهاب للتقسيم",
    shortcutGoToCombine: "الذهاب للاستعادة",
    shortcutSubmitForm: "إرسال النموذج",
    shortcutCopyResult: "نسخ النتيجة",
    shortcutShowHelp: "عرض الاختصارات",
    shortcutShowKeytips: "إظهار تلميحات الاختصارات",
  },
} as const;

type StringsShape = (typeof STRINGS)["en"];

export type Strings = {
  [K in keyof StringsShape]: string;
};
