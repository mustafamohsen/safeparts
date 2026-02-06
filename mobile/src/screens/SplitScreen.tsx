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
} from "react-native";

import * as Clipboard from "expo-clipboard";

import type { CoreEncoding } from "safeparts-core";

import { ENCODINGS } from "../core/encodings";
import { splitSecret } from "../core/safeparts";
import { utf8ToBase64 } from "../core/text";

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
  const [secret, setSecret] = useState("");
  const [k, setK] = useState(2);
  const [n, setN] = useState(3);
  const [encoding, setEncoding] = useState<CoreEncoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [shares, setShares] = useState<string[]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Split</Text>
      <Text style={styles.subtitle}>Turn one secret into multiple shares.</Text>

      <Text style={styles.label}>Secret</Text>
      <TextInput
        value={secret}
        onChangeText={setSecret}
        placeholder="Type or paste your secret"
        placeholderTextColor="#6f7aa7"
        multiline
        style={[styles.input, styles.mono, styles.secretBox]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <View style={styles.rowItem}>
          <Text style={styles.label}>k</Text>
          <TextInput
            value={String(k)}
            onChangeText={(v) => setK(clampK(Number(v), n))}
            keyboardType="number-pad"
            style={styles.input}
          />
        </View>
        <View style={styles.rowItem}>
          <Text style={styles.label}>n</Text>
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

      <Text style={styles.label}>Encoding</Text>
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
                {opt.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Text style={styles.label}>Passphrase (optional)</Text>
      <TextInput
        value={passphrase}
        onChangeText={setPassphrase}
        placeholder="Passphrase"
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
          <Text style={styles.ctaText}>Split</Text>
        )}
      </Pressable>

      {shares.length > 0 ? (
        <View style={styles.outBox}>
          <Text style={styles.outTitle}>Shares</Text>
          {shares.map((s, idx) => (
            <View key={`${idx}-${s.slice(0, 12)}`} style={styles.shareItem}>
              <View style={styles.shareHeader}>
                <Text style={styles.shareLabel}>Share {idx + 1}</Text>
                <View style={styles.shareActions}>
                  <Pressable
                    onPress={() => {
                      void Clipboard.setStringAsync(s);
                    }}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Copy share ${idx + 1}`}
                  >
                    <Text style={styles.actionBtnText}>Copy</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => {
                      void Share.share({ message: s });
                    }}
                    style={styles.actionBtn}
                    accessibilityRole="button"
                    accessibilityLabel={`Share share ${idx + 1}`}
                  >
                    <Text style={styles.actionBtnText}>Share</Text>
                  </Pressable>
                </View>
              </View>
              <Text selectable style={[styles.shareText, styles.mono]}>{s}</Text>
            </View>
          ))}
        </View>
      ) : null}
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#e8fbff",
  },
  subtitle: {
    marginTop: 6,
    fontSize: 14,
    color: "#a8b3cf",
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
  mono: {
    fontFamily: "Courier",
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
    minHeight: 36,
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
});
