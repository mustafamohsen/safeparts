import { useMemo, useState } from "react";
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
import * as FileSystem from "expo-file-system/legacy";
import * as Sharing from "expo-sharing";

import type { CoreEncoding } from "safeparts-core";

import { ENCODINGS } from "../core/encodings";
import { localizeError } from "../core/errors";
import { splitSecret } from "../core/safeparts";
import { utf8ToBase64 } from "../core/text";
import { ScreenHeader } from "../components/ScreenHeader";
import { QrModal } from "../components/QrModal";
import { useI18n } from "../i18n/i18n";

function clampK(nextK: number, nextN: number): number {
  if (!Number.isFinite(nextK)) return 2;
  if (!Number.isFinite(nextN)) return 2;

  const safeN = Math.min(255, Math.max(2, Math.floor(nextN)));
  const safeK = Math.floor(nextK);
  return Math.min(safeN, Math.max(2, safeK));
}

function clampN(nextN: number): number {
  if (!Number.isFinite(nextN)) return 2;
  return Math.min(255, Math.max(2, Math.floor(nextN)));
}

export function SplitScreen() {
  const { isRtl, t } = useI18n();
  const [secret, setSecret] = useState("");
  const [k, setK] = useState(2);
  const [n, setN] = useState(3);
  const [encoding, setEncoding] = useState<CoreEncoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [shares, setShares] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [qr, setQr] = useState<string | null>(null);

  const maxQrChars = 1200;

  const canSplit = useMemo(() => {
    return secret.trim().length > 0 && k >= 2 && n >= 2 && n <= 255;
  }, [secret, k, n]);

  async function onSplit() {
    setBusy(true);
    setError(null);
    setShares([]);

    try {
      const secretB64 = utf8ToBase64(secret);
      const out = await splitSecret(secretB64, k, n, encoding, passphrase ? passphrase : undefined);
      setShares(out);
    } catch (e) {
      setError(localizeError(e, t));
    } finally {
      setBusy(false);
    }
  }

  async function exportShares() {
    if (shares.length === 0) return;

    const out = shares.join("\n\n");
    const baseDir = FileSystem.cacheDirectory ?? FileSystem.documentDirectory;
    if (!baseDir) {
      setError(t("error.noWritableDir"));
      return;
    }

    const fileUri = `${baseDir}safeparts-shares-${Date.now()}.txt`;
    await FileSystem.writeAsStringAsync(fileUri, out, {
      encoding: FileSystem.EncodingType.UTF8,
    });
    await Sharing.shareAsync(fileUri, {
      mimeType: "text/plain",
      dialogTitle: t("share.dialogTitleShares"),
    });
    await FileSystem.deleteAsync(fileUri, { idempotent: true });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <ScreenHeader title={t("split.title")} subtitle={t("split.subtitle")} />

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("split.secret")}</Text>
      <TextInput
        value={secret}
        onChangeText={setSecret}
        placeholder={t("split.secret.placeholder")}
        placeholderTextColor="#6f7aa7"
        multiline
        style={[styles.input, styles.secretBox, styles.textBox, isRtl ? styles.right : styles.left]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={[styles.label, isRtl ? styles.right : styles.left]}>k</Text>
          <TextInput
            value={String(k)}
            onChangeText={(v) => setK(clampK(Number(v), n))}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={[styles.label, isRtl ? styles.right : styles.left]}>n</Text>
          <TextInput
            value={String(n)}
            onChangeText={(v) => {
              const nextN = clampN(Number(v));
              setN(nextN);
              setK((prev) => clampK(prev, nextN));
            }}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
      </View>

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("split.encoding")}</Text>
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

      <Text style={[styles.label, isRtl ? styles.right : styles.left]}>{t("split.passphrase")}</Text>
      <TextInput
        value={passphrase}
        onChangeText={setPassphrase}
        placeholder={t("split.passphrase.placeholder")}
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
        onPress={() => void onSplit()}
        disabled={!canSplit || busy}
        style={[styles.cta, (!canSplit || busy) ? styles.ctaDisabled : styles.ctaEnabled]}
      >
        {busy ? (
          <ActivityIndicator color="#061315" />
        ) : (
          <Text style={styles.ctaText}>{t("split.cta")}</Text>
        )}
      </Pressable>

      {shares.length > 0 ? (
        <View style={styles.outBox}>
          <View style={styles.outTop}>
            <Text style={[styles.outTitle, isRtl ? styles.right : styles.left]}>{t("split.shares")}</Text>
            <Pressable
              onPress={() => {
                void exportShares();
              }}
              style={styles.actionBtn}
              accessibilityRole="button"
              accessibilityLabel={t("a11y.exportShares")}
            >
              <Text style={styles.actionBtnText}>{t("common.export")}</Text>
            </Pressable>
          </View>
          {shares.map((s, idx) => (
            <View key={`${idx}-${s.slice(0, 12)}`} style={styles.shareItem}>
              <View style={styles.shareHeader}>
                <Text style={[styles.shareLabel, isRtl ? styles.right : styles.left]}>
                  {t("split.share")} {idx + 1}
                </Text>
                <View style={styles.shareActions}>
                  <Pressable
                    onPress={() => {
                      void Clipboard.setStringAsync(s);
                    }}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y.copyShare", { n: idx + 1 })}
                  >
                    <Text style={styles.actionBtnText}>{t("common.copy")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      if (s.length > maxQrChars) {
                        setError(t("qr.tooLarge"));
                        return;
                      }
                      setQr(s);
                    }}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y.qrShare", { n: idx + 1 })}
                  >
                    <Text style={styles.actionBtnText}>{t("common.qr")}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void Share.share({ message: s });
                    }}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={t("a11y.shareShare", { n: idx + 1 })}
                  >
                    <Text style={styles.actionBtnText}>{t("common.share")}</Text>
                  </Pressable>
                </View>
              </View>
              <Text selectable style={[styles.shareText, styles.textBox]}>
                {s}
              </Text>
            </View>
          ))}
        </View>
      ) : null}

      <QrModal
        visible={qr !== null}
        title={t("qr.title")}
        value={qr ?? ""}
        onClose={() => setQr(null)}
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
    minHeight: 120,
    textAlignVertical: "top",
  },
  textBox: {
    fontFamily: Platform.select({
      ios: "Courier",
      android: "monospace",
      default: "monospace",
    }),
  },
  row: {
    marginTop: 12,
    flexDirection: "row",
    gap: 12,
  },
  rowItem: {
    flex: 1,
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
  outTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: "#e8fbff",
  },
  outTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  shareItem: {
    marginTop: 12,
  },
  shareHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginBottom: 6,
  },
  shareLabel: {
    fontSize: 12,
    color: "#a8b3cf",
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
    writingDirection: "ltr",
    textAlign: "left",
  },
  left: {
    textAlign: "left",
  },
  right: {
    textAlign: "right",
  },
});
