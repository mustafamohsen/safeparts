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

import { ENCODINGS, detectEncodingFromText } from "../core/encodings";
import { combineShares } from "../core/safeparts";
import { base64ToUtf8 } from "../core/text";

function parseShares(text: string): string[] {
  return text
    .split(/\n\s*\n/g)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function CombineScreen() {
  const [raw, setRaw] = useState("");
  const [encoding, setEncoding] = useState<CoreEncoding>("mnemo-words");
  const [passphrase, setPassphrase] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [secret, setSecret] = useState<string | null>(null);

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
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  function tryAutoDetect() {
    const detected = detectEncodingFromText(raw);
    if (detected) setEncoding(detected);
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <Text style={styles.title}>Combine</Text>
      <Text style={styles.subtitle}>Paste shares to recover the secret.</Text>

      <Text style={styles.label}>Shares</Text>
      <TextInput
        value={raw}
        onChangeText={setRaw}
        placeholder="Paste shares here (blank line separates shares)"
        placeholderTextColor="#6f7aa7"
        multiline
        style={[styles.input, styles.mono, styles.secretBox]}
        autoCapitalize="none"
        autoCorrect={false}
      />

      <View style={styles.row}>
        <Pressable onPress={tryAutoDetect} style={[styles.smallBtn, styles.smallBtnMuted]}>
          <Text style={styles.smallBtnText}>Auto-detect</Text>
        </Pressable>
        <Text style={styles.countText}>{shares.length} shares</Text>
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
        onPress={() => void onCombine()}
        disabled={!canCombine || busy}
        style={[styles.cta, (!canCombine || busy) ? styles.ctaDisabled : styles.ctaEnabled]}
      >
        {busy ? (
          <ActivityIndicator color="#061315" />
        ) : (
          <Text style={styles.ctaText}>Combine</Text>
        )}
      </Pressable>

      {secret !== null ? (
        <View style={styles.outBox}>
          <View style={styles.outHeader}>
            <Text style={styles.outTitle}>Recovered secret</Text>
            <View style={styles.shareActions}>
              <Pressable
                onPress={() => {
                  void Clipboard.setStringAsync(secret);
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Copy recovered secret"
              >
                <Text style={styles.actionBtnText}>Copy</Text>
              </Pressable>
              <Pressable
                onPress={() => {
                  void Share.share({ message: secret });
                }}
                style={styles.actionBtn}
                accessibilityRole="button"
                accessibilityLabel="Share recovered secret"
              >
                <Text style={styles.actionBtnText}>Share</Text>
              </Pressable>
            </View>
          </View>
          <Text selectable style={[styles.shareText, styles.mono]}>{secret}</Text>
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
    minHeight: 140,
    textAlignVertical: "top",
  },
  mono: {
    fontFamily: "Courier",
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
