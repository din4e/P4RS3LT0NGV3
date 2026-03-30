import { useEffect } from "react";
import { useAppStore } from "../stores/useAppStore";

/**
 * Synchronises the application theme with the DOM.
 *
 * Reads `isDarkTheme` from the global app store and applies or removes the
 * `dark` CSS class on `document.documentElement` accordingly. This enables
 * Tailwind's `dark:` variant to work without the `media` strategy.
 *
 * Call this hook once at the root of your component tree (e.g. in the
 * top-level layout component).
 */
export function useTheme(): void {
  const isDarkTheme = useAppStore((state) => state.isDarkTheme);

  useEffect(() => {
    const root = document.documentElement;

    if (isDarkTheme) {
      root.classList.add("dark");
    } else {
      root.classList.remove("dark");
    }
  }, [isDarkTheme]);
}
