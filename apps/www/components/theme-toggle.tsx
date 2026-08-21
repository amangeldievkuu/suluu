"use client";

import { useTheme } from "next-themes";
import { useSyncExternalStore } from "react";
import { ThemeToggle as SuluuThemeToggle } from "suluu/theme-toggle";

const subscribeToHydration = () => () => undefined;

export function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const mounted = useSyncExternalStore(
    subscribeToHydration,
    () => true,
    () => false,
  );
  const isDark = mounted && resolvedTheme === "dark";

  return (
    <SuluuThemeToggle
      aria-label="Dark mode"
      checked={isDark}
      disabled={!mounted}
      key={mounted ? "resolved-theme" : "pending-theme"}
      onCheckedChange={(nextDark) => setTheme(nextDark ? "dark" : "light")}
    />
  );
}
