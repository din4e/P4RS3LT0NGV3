import { useCallback } from "react";

/**
 * Provides a cross-browser `copyToClipboard` helper.
 *
 * Uses the modern Clipboard API (`navigator.clipboard.writeText`) when
 * available and falls back to the legacy `document.execCommand("copy")`
 * approach for older browsers or insecure contexts.
 *
 * @returns An object with a single `copyToClipboard` function that resolves
 *          to `true` on success and `false` on failure.
 */
export function useClipboard(): {
  copyToClipboard: (text: string) => Promise<boolean>;
} {
  const copyToClipboard = useCallback(
    async (text: string): Promise<boolean> => {
      // --- Modern Clipboard API ------------------------------------------
      if (navigator.clipboard?.writeText) {
        try {
          await navigator.clipboard.writeText(text);
          return true;
        } catch {
          // Fall through to the legacy method if the API throws
          // (e.g. on HTTP origins or when the page loses focus).
        }
      }

      // --- Legacy fallback -----------------------------------------------
      try {
        const textarea = document.createElement("textarea");
        textarea.value = text;

        // Position off-screen to avoid visual flash.
        textarea.style.position = "fixed";
        textarea.style.left = "-9999px";
        textarea.style.top = "-9999px";
        textarea.setAttribute("readonly", "");

        document.body.appendChild(textarea);
        textarea.select();

        const ok = document.execCommand("copy");
        document.body.removeChild(textarea);

        return ok;
      } catch {
        return false;
      }
    },
    [],
  );

  return { copyToClipboard };
}
