import { useMemo, useRef } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";

import { CameraView, useCameraPermissions } from "expo-camera";

import { useReducedMotion } from "../core/reduced_motion";
import { useI18n } from "../i18n/i18n";

export function QrScannerModal(props: {
  visible: boolean;
  onClose: () => void;
  onScan: (value: string) => void;
  addedCount: number;
}) {
  const { isRtl, t } = useI18n();
  const reducedMotion = useReducedMotion();
  const [permission, requestPermission] = useCameraPermissions();

  const canUseCamera = permission?.granted === true;
  const statusText = useMemo(() => t("scanner.added", { n: props.addedCount }), [props.addedCount, t]);
  const last = useRef<{ data: string; at: number } | null>(null);

  function onBarcodeScanned(result: { data?: string | null }) {
    const data = (result.data ?? "").trim();
    if (!data) return;

    const now = Date.now();
    if (last.current && last.current.data === data && now - last.current.at < 1200) {
      return;
    }
    last.current = { data, at: now };
    props.onScan(data);
  }

  return (
    <Modal
      visible={props.visible}
      animationType={reducedMotion ? "none" : "slide"}
      onRequestClose={props.onClose}
    >
      <View style={styles.container}>
        <View style={styles.top}>
          <View style={styles.topLeft}>
            <Text style={[styles.title, isRtl ? styles.right : styles.left]}>{t("scanner.title")}</Text>
            <Text style={[styles.subtitle, isRtl ? styles.right : styles.left]}>{statusText}</Text>
          </View>
          <Pressable onPress={props.onClose} style={styles.closeBtn} accessibilityRole="button">
            <Text style={styles.closeText}>{t("common.close")}</Text>
          </Pressable>
        </View>

        {!permission ? (
          <View style={styles.center}>
            <Text style={[styles.subtitle, isRtl ? styles.right : styles.left]}>{t("scanner.permission.body")}</Text>
          </View>
        ) : canUseCamera ? (
          <View style={styles.cameraWrap}>
            <CameraView
              style={styles.camera}
              onBarcodeScanned={onBarcodeScanned}
              barcodeScannerSettings={{
                barcodeTypes: ["qr"],
              }}
            />
            <View style={styles.overlay}>
              <View style={styles.frame} />
              <Text style={styles.overlayHint}>{t("scanner.title")}</Text>
            </View>
          </View>
        ) : (
          <View style={styles.center}>
            <Text style={[styles.permTitle, isRtl ? styles.right : styles.left]}>{t("scanner.permission.title")}</Text>
            <Text style={[styles.permBody, isRtl ? styles.right : styles.left]}>{t("scanner.permission.body")}</Text>
            <Pressable
              onPress={() => {
                void requestPermission();
              }}
              style={styles.permBtn}
              accessibilityRole="button"
            >
              <Text style={styles.permBtnText}>{t("scanner.permission.request")}</Text>
            </Pressable>
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0b1020",
  },
  top: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  topLeft: {
    flex: 1,
  },
  title: {
    color: "#e8fbff",
    fontSize: 20,
    fontWeight: "800",
  },
  subtitle: {
    marginTop: 6,
    color: "#a8b3cf",
    fontSize: 13,
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
  cameraWrap: {
    flex: 1,
    borderTopWidth: 1,
    borderTopColor: "rgba(140, 170, 255, 0.14)",
  },
  camera: {
    flex: 1,
  },
  overlay: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
  },
  frame: {
    width: 260,
    height: 260,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: "rgba(123, 255, 214, 0.9)",
    backgroundColor: "rgba(0,0,0,0.18)",
  },
  overlayHint: {
    marginTop: 14,
    color: "rgba(255,255,255,0.88)",
    fontSize: 13,
    fontWeight: "700",
  },
  center: {
    flex: 1,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
  },
  permTitle: {
    color: "#e8fbff",
    fontSize: 18,
    fontWeight: "800",
  },
  permBody: {
    color: "#a8b3cf",
    fontSize: 13,
    textAlign: "center",
    lineHeight: 18,
  },
  permBtn: {
    marginTop: 6,
    minWidth: 160,
    minHeight: 48,
    paddingHorizontal: 16,
    borderRadius: 16,
    backgroundColor: "#7bffd6",
    alignItems: "center",
    justifyContent: "center",
  },
  permBtnText: {
    color: "#061315",
    fontSize: 14,
    fontWeight: "900",
  },
  left: {
    textAlign: "left",
  },
  right: {
    textAlign: "right",
  },
});
