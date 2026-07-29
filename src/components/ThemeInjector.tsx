import { useEffect, useLayoutEffect, useState } from "react";
import { MarketplaceStore, WebsiteThemeSettings } from "@/lib/marketplaceStore";

const useIsomorphicLayoutEffect = typeof window !== "undefined" ? useLayoutEffect : useEffect;

export function injectThemeSynchronously(settings?: WebsiteThemeSettings) {
  if (typeof document === "undefined") return;

  const currentSettings = settings || MarketplaceStore.getSiteThemeSettings();

  // Toggle dark class on root document
  if (currentSettings.themeMode === "dark") {
    document.documentElement.classList.add("dark");
  } else {
    document.documentElement.classList.remove("dark");
  }

  let styleEl = document.getElementById("beitak-dynamic-theme") as HTMLStyleElement | null;
  if (!styleEl) {
    styleEl = document.createElement("style");
    styleEl.id = "beitak-dynamic-theme";
    document.head.appendChild(styleEl);
  }

  // Effective theme palette values
  const brandDarkColor = currentSettings.brandDark || "#1C1613";
  const primaryColor = currentSettings.homepagePrimary || currentSettings.brandPrimary || "#5C4033";
  const accentColor = currentSettings.homepageAccent || currentSettings.brandAccent || "#D2B48C";
  const bgColor = currentSettings.homepageBg || currentSettings.brandBg || "#F8F5EE";
  const textColor = currentSettings.homepageText || brandDarkColor;
  const cardColor = currentSettings.homepageCard || "#FFFFFF";

  const formatHexWithAlpha = (color: string, alphaHex: string) => {
    if (color.startsWith("#") && color.length === 7) {
      return `${color}${alphaHex}`;
    }
    return color;
  };

  const secColor = formatHexWithAlpha(accentColor, "1F");
  const borderColor = formatHexWithAlpha(accentColor, "33");
  const mutedTextColor = formatHexWithAlpha(textColor, "B3");

  // Font family definition mapping
  let fontFamily = `"Cairo", ui-sans-serif, system-ui, sans-serif`;
  if (currentSettings.primaryFont === "Cairo") {
    fontFamily = `"Cairo", ui-sans-serif, system-ui, sans-serif`;
  } else if (currentSettings.primaryFont === "Cairo-Sans") {
    fontFamily = `"Cairo", system-ui, sans-serif`;
  } else if (currentSettings.primaryFont === "Cairo-Mono") {
    fontFamily = `"Courier New", Courier, monospace`;
  }

  styleEl.innerHTML = `
    :root {
      --brand-dark: ${brandDarkColor};
      --brand-primary: ${primaryColor};
      --brand-accent: ${accentColor};
      --brand-bg: ${bgColor};
      --brand-card: ${cardColor};

      --background: ${bgColor};
      --foreground: ${textColor};
      --card: ${cardColor};
      --card-foreground: ${textColor};
      --popover: ${cardColor};
      --popover-foreground: ${textColor};
      --primary: ${primaryColor};
      --primary-foreground: #FFFFFF;
      --secondary: ${secColor};
      --secondary-foreground: ${textColor};
      --muted: ${bgColor};
      --muted-foreground: ${mutedTextColor};
      --accent: ${accentColor};
      --accent-foreground: ${brandDarkColor};
      --border: ${borderColor};
      --ring: ${accentColor};
    }

    body, #root {
      background-color: var(--background);
      color: var(--foreground);
      font-family: ${fontFamily};
    }

    .admin-input, .input, .set-input {
      font-family: ${fontFamily};
    }
    .admin-input:focus, .input:focus, .set-input:focus {
      border-color: ${accentColor};
    }
  `;
}

// Immediate initial execution on module load in browser context to prevent any paint flash
if (typeof window !== "undefined") {
  try {
    injectThemeSynchronously();
  } catch (err) {
    console.warn("Initial theme injection warning:", err);
  }
}

export function ThemeInjector() {
  const [settings, setSettings] = useState<WebsiteThemeSettings>(
    MarketplaceStore.getSiteThemeSettings,
  );

  useEffect(() => {
    // Poll or listen for storage events to support instant live preview edits!
    const handleStorageChange = () => {
      const updated = MarketplaceStore.getSiteThemeSettings();
      setSettings(updated);
      injectThemeSynchronously(updated);
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("beitak-theme-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("beitak-theme-updated", handleStorageChange);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    injectThemeSynchronously(settings);
  }, [settings]);

  return null;
}
