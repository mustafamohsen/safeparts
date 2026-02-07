import { Pressable, StyleSheet, Text, View } from "react-native";

import { useI18n } from "../i18n/i18n";

export function ScreenHeader(props: { title: string; subtitle?: string }) {
  const { isRtl, t, toggle } = useI18n();

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <View style={styles.titles}>
          <Text style={[styles.title, isRtl ? styles.right : styles.left]}>{props.title}</Text>
          {props.subtitle ? (
            <Text style={[styles.subtitle, isRtl ? styles.right : styles.left]}>{props.subtitle}</Text>
          ) : null}
        </View>
        <Pressable
          onPress={toggle}
          style={styles.lang}
          accessibilityRole="button"
          accessibilityLabel={t("a11y.toggleLanguage")}
        >
          <Text style={styles.langText}>{t("common.lang")}</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: 10,
  },
  row: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: 12,
  },
  titles: {
    flex: 1,
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
  lang: {
    minWidth: 44,
    minHeight: 44,
    paddingHorizontal: 12,
    borderRadius: 999,
    borderWidth: 1,
    borderColor: "rgba(140, 170, 255, 0.14)",
    backgroundColor: "rgba(255,255,255,0.05)",
    alignItems: "center",
    justifyContent: "center",
  },
  langText: {
    color: "#cfe7ff",
    fontSize: 12,
    fontWeight: "800",
    letterSpacing: 0.6,
  },
  left: {
    textAlign: "left",
  },
  right: {
    textAlign: "right",
  },
});
