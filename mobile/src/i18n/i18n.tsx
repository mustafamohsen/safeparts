import { createContext, useContext, useMemo, useState } from "react";

export type Lang = "en" | "ar";

type Strings = Record<string, { en: string; ar: string }>;

const STRINGS: Strings = {
  "tabs.split": { en: "Split", ar: "تقسيم" },
  "tabs.combine": { en: "Combine", ar: "استرجاع" },

  "common.lang": { en: "AR", ar: "EN" },
  "common.copy": { en: "Copy", ar: "نسخ" },
  "common.share": { en: "Share", ar: "مشاركة" },
  "common.qr": { en: "QR", ar: "QR" },
  "common.export": { en: "Export", ar: "تصدير" },
  "common.import": { en: "Import", ar: "استيراد" },
  "common.close": { en: "Close", ar: "إغلاق" },
  "common.cancel": { en: "Cancel", ar: "إلغاء" },
  "common.ok": { en: "OK", ar: "موافق" },
  "common.optional": { en: "optional", ar: "اختياري" },

  "encoding.mnemoWords": { en: "Mnemonic (words)", ar: "مِعْيَار كلمات" },
  "encoding.mnemoBip39": { en: "BIP39 (phrases)", ar: "BIP39 (عبارات)" },
  "encoding.base58check": { en: "Base58Check", ar: "Base58Check" },
  "encoding.base64url": { en: "Base64URL", ar: "Base64URL" },

  "error.noWritableDir": { en: "No writable directory available", ar: "لا يوجد مسار متاح للكتابة" },
  "error.notEnoughShares": { en: "Need {k} shares, got {m}", ar: "يلزم {k} حصص، المتوفر {m}" },
  "error.passphraseRequired": { en: "Passphrase required", ar: "عبارة المرور مطلوبة" },
  "error.integrityFailed": { en: "Integrity check failed", ar: "فشل التحقق من السلامة" },
  "error.inconsistentShares": { en: "Shares are from different sets", ar: "الحصص من مجموعات مختلفة" },
  "error.decryptFailed": { en: "Failed to decrypt (wrong passphrase?)", ar: "فشل فك التشفير (ربما عبارة المرور غير صحيحة)" },

  "share.dialogTitleShares": { en: "Safeparts shares", ar: "حصص Safeparts" },
  "share.dialogTitleSecret": { en: "Safeparts secret", ar: "سر Safeparts" },

  "a11y.toggleLanguage": { en: "Toggle language", ar: "تبديل اللغة" },
  "a11y.copyShare": { en: "Copy share {n}", ar: "نسخ الحصة {n}" },
  "a11y.shareShare": { en: "Share share {n}", ar: "مشاركة الحصة {n}" },
  "a11y.qrShare": { en: "Show QR for share {n}", ar: "إظهار QR للحصة {n}" },
  "a11y.copySecret": { en: "Copy recovered secret", ar: "نسخ السر المسترجع" },
  "a11y.shareSecret": { en: "Share recovered secret", ar: "مشاركة السر المسترجع" },
  "a11y.exportSecret": { en: "Export recovered secret", ar: "تصدير السر المسترجع" },
  "a11y.exportShares": { en: "Export shares", ar: "تصدير الحصص" },

  "split.title": { en: "Split", ar: "تقسيم" },
  "split.subtitle": { en: "Turn one secret into multiple shares.", ar: "حوّل سراً واحداً إلى عدة حصص." },
  "split.secret": { en: "Secret", ar: "السر" },
  "split.secret.placeholder": { en: "Type or paste your secret", ar: "اكتب أو الصق السر" },
  "split.encoding": { en: "Encoding", ar: "الترميز" },
  "split.passphrase": { en: "Passphrase (optional)", ar: "عبارة المرور (اختياري)" },
  "split.passphrase.placeholder": { en: "Passphrase", ar: "عبارة المرور" },
  "split.cta": { en: "Split", ar: "تقسيم" },
  "split.shares": { en: "Shares", ar: "الحصص" },
  "split.share": { en: "Share", ar: "حصة" },
  "split.exportAll": { en: "Export shares", ar: "تصدير الحصص" },

  "combine.title": { en: "Combine", ar: "استرجاع" },
  "combine.subtitle": { en: "Paste shares to recover the secret.", ar: "الصق الحصص لاسترجاع السر." },
  "combine.shares": { en: "Shares", ar: "الحصص" },
  "combine.shares.placeholder": { en: "Paste shares here (blank line separates shares)", ar: "الصق الحصص هنا (سطر فارغ يفصل بين الحصص)" },
  "combine.autodetect": { en: "Auto-detect", ar: "اكتشاف تلقائي" },
  "combine.scanQr": { en: "Scan QR", ar: "مسح QR" },
  "combine.count": { en: "{n} shares", ar: "{n} حصص" },
  "combine.encoding": { en: "Encoding", ar: "الترميز" },
  "combine.passphrase": { en: "Passphrase (optional)", ar: "عبارة المرور (اختياري)" },
  "combine.passphrase.placeholder": { en: "Passphrase", ar: "عبارة المرور" },
  "combine.cta": { en: "Combine", ar: "استرجاع" },
  "combine.recovered": { en: "Recovered secret", ar: "السر المسترجع" },
  "combine.exportSecret": { en: "Export secret", ar: "تصدير السر" },
  "combine.importFile": { en: "Import shares file", ar: "استيراد ملف الحصص" },

  "qr.title": { en: "Share QR", ar: "QR الحصة" },
  "qr.tooLarge": { en: "QR unavailable (too large)", ar: "تعذر إنشاء QR (البيانات كبيرة)" },

  "scanner.title": { en: "Scan QR", ar: "مسح QR" },
  "scanner.permission.title": { en: "Camera permission", ar: "إذن الكاميرا" },
  "scanner.permission.body": { en: "Allow camera access to scan share QR codes.", ar: "اسمح بالوصول للكاميرا لمسح رموز QR للحصص." },
  "scanner.permission.request": { en: "Allow camera", ar: "السماح بالكاميرا" },
  "scanner.added": { en: "Added {n}", ar: "تمت الإضافة {n}" },
};

type I18nState = {
  lang: Lang;
  isRtl: boolean;
  t: (key: keyof typeof STRINGS, vars?: Record<string, string | number>) => string;
  toggle: () => void;
};

const Ctx = createContext<I18nState | null>(null);

export function I18nProvider(props: { children: React.ReactNode }) {
  const [lang, setLang] = useState<Lang>("en");

  const value = useMemo<I18nState>(() => {
    const isRtl = lang === "ar";

    function t(key: keyof typeof STRINGS, vars?: Record<string, string | number>) {
      const entry = STRINGS[key];
      let s = entry ? entry[lang] : String(key);
      if (vars) {
        for (const [k, v] of Object.entries(vars)) {
          s = s.replaceAll(`{${k}}`, String(v));
        }
      }
      return s;
    }

    function toggle() {
      setLang((prev) => (prev === "en" ? "ar" : "en"));
    }

    return {
      lang,
      isRtl,
      t,
      toggle,
    };
  }, [lang]);

  return <Ctx.Provider value={value}>{props.children}</Ctx.Provider>;
}

export function useI18n(): I18nState {
  const v = useContext(Ctx);
  if (!v) {
    throw new Error("useI18n must be used within I18nProvider");
  }
  return v;
}
