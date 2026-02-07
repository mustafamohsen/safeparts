import { useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  Platform,
} from "react-native";

import * as Clipboard from "expo-clipboard";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { CoreEncoding } from "safeparts-core";

import { ENCODINGS, detectEncodingFromText } from "../core/encodings";
import { localizeError } from "../core/errors";
import { combineShares } from "../core/safeparts";
import { base64ToUtf8 } from "../core/text";
import { ScreenHeader } from "../components/ScreenHeader";
import { QrScannerModal } from "../components/QrScannerModal";
import { useI18n } from "../i18n/i18n";

function parseShares(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CombineScreen() {
  const { isRtl, t } = useI18n();
  const [raw, setRaw] = useState("");
  const [encoding, setEncoding] = useState<CoreEncoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [scannerAdded, setScannerAdded] = useState(0);
  const seenScans = useRef<Set<string>>(new Set());

  const shares = useMemo(() => parseShares(raw), [raw]);

  const canCombine = useMemo(() => shares.length >= 2, [shares.length]);

  async function onCombine() {
    setBusy(true);
    setError(null);
    setSecret(null);

    try {
      const outB64 = await combineShares(shares, encoding, passphrase ? passphrase : undefined);
      setSecret(base64ToUtf8(outB64));
    } catch (e) {
      setError(localizeError(e, t));
    } finally {
      setBusy(false);
    }
  }

  function tryAutoDetect() {
    const detected = detectEncodingFromText(raw);
    if (detected) setEncoding(detected);
  }

  async function importSharesFile() {
    const res = await DocumentPicker.getDocumentAsync({
      copyToCacheDirectory: true,
      multiple: false,
      type: "text/plain",
    });
    if (res.canceled) return;
    const f = res.assets?.[0];
    if (!f?.uri) return;

    const text = await FileSystem.readAsStringAsync(f.uri, {
      encoding: FileSystem.EncodingType.UTF8,
    });

    setRaw((prev) => (prev.trim().length > 0 ? `${prev}\n\n${text.trim()}` : text.trim()));
  }

  async function exportSecret() {
    if (!secret) return;

    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!baseDir) {
      setError(t("error.noWritableDir"));
      return;
    }

    const fileUri = `${baseDir}safeparts-secret-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, secret, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/plain",
      dialogTitle: t("share.dialogTitleSecret"),
    });
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title={t("combine.title")} subtitle={t("combine.subtitle")} />

      <View style={styles.actionsTop}>
        <Pressable onPress={() => void importSharesFile()} style={styles.smallBtn}>
          <Text style={styles.smallBtnText}>{t("combine.importFile")}</Text>
        </Pressable>
        <Pressable
          onPress={() => {
            seenScans.current = new Set();
            setScannerAdded(0);
            setScannerOpen(true);
          }}
          style={styles.smallBtn}
        >
          <Text style={styles.smallBtnText}>{t("combine.scanQr")}</Text>
        </Pressable>
      </View>

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("combine.shares")}</Text>
      <TextInput
        value={raw}
        onChangeText={setRaw}
        placeholder={t("combine.shares.placeholder")}
        placeholderTextColor="#6f7aa7"
        multiline
        style={[styles.input, styles.secretBox, styles.textBox]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <Pressable onPress={tryAutoDetect} style={[styles.smallBtn, styles.smallBtnMuted]}>
          <Text style={styles.smallBtnText}>{t("combine.autodetect")}</Text>
        </Pressable>
        <Text style={styles.countText}>{t("combine.count", { n: shares.length })}</Text>
      </View>

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("combine.encoding")}</Text>
      <View style={styles.chips}>
        {ENCODINGS.map((opt) => {
          const active = opt.value === encoding;
          return (
            <Pressable
              key={opt.value}
              onPress={() => setEncoding(opt.value)}
              style={[styles.chip, active ? styles.chipActive : styles.chipInactive]}
            >
              <Text style={[styles.chipText, active ? styles.chipTextActive : styles.chipTextInactive]}>
                {t(opt.labelKey)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("combine.passphrase")}</Text>
      <TextInput
        value={passphrase}
        onChangeText={setPassphrase}
        placeholder={t("combine.passphrase.placeholder")}
        placeholderTextColor="#6f7aa7"
        style={styles.input}
        autoCapitalize="none"
        autoCorrect={false}
      />

      {error ? (
        <View style={styles.errorBox}>
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : null}

      <Pressable
        onPress={() => void onCombine()}
        disabled={!canCombine || busy}
        style={[styles.cta, (!canCombine || busy) ? styles.ctaDisabled : styles.ctaEnabled]}
      >
        {busy ? (
          <ActivityIndicator color="#061315" />
        ) : (
          <Text style={styles.ctaText}>{t("combine.cta")}</Text>
        )}
      </Pressable>

      {secret !== null ? (
        <View style={styles.outBox}>
          <View style={styles.outHeader}>
            <Text style={[styles.outTitle, isRtl ? styles.right : styles.left]}>{t("combine.recovered")}</Text>
            <View style={styles.shareActions}>
              <Pressable
                onPress={() => {
                  void Clipboard.setStringAsync(secret);
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={t("a11y.copySecret")}
              >
                <Text style={styles.actionBtnText}>{t("common.copy")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void exportSecret();
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={t("a11y.exportSecret")}
              >
                <Text style={styles.actionBtnText}>{t("common.export")}</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Share.share({ message: secret });
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel={t("a11y.shareSecret")}
              >
                <Text style={styles.actionBtnText}>{t("common.share")}</Text>
              </Pressable>
            </View>
          </View>
          <Text selectable style={[styles.shareText, styles.textBox]}>{secret}</Text>
        </View>
      ) : null}

      <QrScannerModal
        visible={scannerOpen}
        onClose={() => setScannerOpen(false)}
        addedCount={scannerAdded}
        onScan={(value) => {
          if (seenScans.current.has(value)) {
            return;
          }
          seenScans.current.add(value);
          setRaw((prev) => (prev.trim().length > 0 ? `${prev}\n\n${value}` : value));
          setScannerAdded((c) => c + 1);
        }}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
  },
  content: {
    padding: 16,
    paddingBottom: 28,
  },
  actionsTop: {
    marginBottom: 8,
    flexDirection: "row",
    gap: 10,
  },
  label: {
    marginTop: 14,
    marginBottom: 8,
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.4,
    color: "#cfe7ff",
    textTransform: "uppercase",
  },
  input: {
    backgroundColor: "rgba(255,255,255,0.06)",
    borderColor: "rgba(140, 170, 255, 0.14)",
    borderWidth: 1,
    borderRadius: 14,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: "#e8fbff",
  },
  secretBox: {
    minHeight: 140,
    textAlignVertical: "top",
  },
  textBox: {
    fontFamily: Platform.select({
      ios: "Courier",
      android: "monospace",
      default: "monospace",
    }),
    writingDirection: "ltr",
    textAlign: "left",
  },
  chips: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  chip: {
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderWidth: 1,
  },
  chipActive: {
    backgroundColor: "rgba(120, 255, 214, 0.14)",
    borderColor: "rgba(120, 255, 214, 0.4)",
  },
  chipInactive: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(140, 170, 255, 0.14)",
  },
  chipText: {
    fontSize: 12,
    fontWeight: "600",
  },
  chipTextActive: {
    color: "#bfffee",
  },
  chipTextInactive: {
    color: "#cfe7ff",
  },
  row: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  smallBtn: {
    minWidth: 44,
    minHeight: 44,
    borderRadius: 999,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
  },
  smallBtnMuted: {
    backgroundColor: "rgba(255,255,255,0.05)",
    borderColor: "rgba(140, 170, 255, 0.14)",
  },
  smallBtnText: {
    color: "#cfe7ff",
    fontSize: 12,
    fontWeight: "700",
  },
  countText: {
    color: "#a8b3cf",
    fontSize: 12,
  },
  cta: {
    marginTop: 18,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaEnabled: {
    backgroundColor: "#7bffd6",
  },
  ctaDisabled: {
    backgroundColor: "rgba(123, 255, 214, 0.25)",
  },
  ctaText: {
    color: "#061315",
    fontSize: 14,
    fontWeight: "800",
    letterSpacing: 0.6,
    textTransform: "uppercase",
  },
  errorBox: {
    marginTop: 12,
    padding: 12,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "rgba(255, 107, 107, 0.35)",
    backgroundColor: "rgba(255, 107, 107, 0.10)",
  },
  errorText: {
    color: "#ffd1d1",
    fontSize: 13,
    lineHeight: 18,
  },
  outBox: {
    marginTop: 18,
    padding: 12,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "rgba(140, 170, 255, 0.14)",
    backgroundColor: "rgba(0,0,0,0.22)",
  },
  outHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 10,
  },
  outTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e8fbff",
  },
  shareActions: {
    flexDirection: "row",
    gap: 8,
  },
  actionBtn: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 10,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(140, 170, 255, 0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  actionBtnText: {
    color: "#cfe7ff",
    fontSize: 12,
    fontWeight: "700",
  },
  shareText: {
    fontSize: 12,
    color: "#e8fbff",
    lineHeight: 18,
  },
  left: {
    textAlign: "left",
  },
  right: {
    textAlign: "right",
  },
});
