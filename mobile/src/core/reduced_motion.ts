import { useEffect, useState } from "react";
import { AccessibilityInfo } from "react-native";

export function useReducedMotion(): boolean {
  const [reduced, setReduced] = useState(false);

  useEffect(() => {
    let mounted = true;

    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (mounted) setReduced(v);
    });

    const sub = AccessibilityInfo.addEventListener?.("reduceMotionChanged", (v) => {
      setReduced(Boolean(v));
    });

    return () => {
      mounted = false;
      // RN's event subscription API differs by version.
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (sub as any)?.remove?.();
    };
  }, []);

  return reduced;
}
