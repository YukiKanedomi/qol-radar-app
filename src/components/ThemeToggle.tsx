import { Moon, Sun } from "lucide-react";
import type { Theme } from "@/lib/theme";

export function ThemeToggle({
  theme,
  onToggle,
}: {
  theme: Theme;
  onToggle: () => void;
}) {
  const isDark = theme === "dark";
  return (
    <button
      type="button"
      className="theme-toggle"
      onClick={onToggle}
      aria-label={isDark ? "ライトモードに切替" : "ダークモードに切替"}
      title={isDark ? "ライトモード" : "ダークモード"}
    >
      {isDark ? <Sun size={16} strokeWidth={1.8} /> : <Moon size={16} strokeWidth={1.8} />}
    </button>
  );
}
