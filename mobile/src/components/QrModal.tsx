import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import QRCode from "react-native-qrcode-svg";

import { useReducedMotion } from "../core/reduced_motion";
import { useI18n } from "../i18n/i18n";

export function QrModal(props: { visible: boolean; title: string; value: string; onClose: () => void }) {
  const { t } = useI18n();
  const reducedMotion = useReducedMotion();

  return (
    <Modal
      visible={props.visible}
      animationType={reducedMotion ? "none" : "fade"}
      transparent
      onRequestClose={props.onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <View style={styles.header}>
            <Text style={styles.title}>{props.title}</Text>
            <Pressable onPress={props.onClose} style={styles.closeBtn} accessibilityRole="button">
              <Text style={styles.closeText}>{t("common.close")}</Text>
            </Pressable>
          </View>
          <View style={styles.qrWrap}>
            <QRCode value={props.value} size={240} backgroundColor="#ffffff" color="#0b1020" />
          </View>
          <Text style={styles.hint} numberOfLines={2}>
            {props.value.slice(0, 80)}
            {props.value.length > 80 ? "..." : ""}
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.55)",
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  card: {
    width: "100%",
    maxWidth: 420,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: "rgba(140, 170, 255, 0.14)",
    backgroundColor: "#0b1020",
    padding: 14,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 12,
  },
  title: {
    color: "#e8fbff",
    fontSize: 14,
    fontWeight: "800",
  },
  closeBtn: {
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
  closeText: {
    color: "#cfe7ff",
    fontSize: 12,
    fontWeight: "800",
  },
  qrWrap: {
    marginTop: 16,
    alignItems: "center",
    justifyContent: "center",
    padding: 12,
    borderRadius: 16,
    backgroundColor: "rgba(255,255,255,0.06)",
  },
  hint: {
    marginTop: 12,
    color: "#a8b3cf",
    fontSize: 12,
  },
});
