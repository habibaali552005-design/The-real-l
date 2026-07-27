import { useEffect, useState } from "react";
import { MarketplaceStore, WebsiteThemeSettings } from "@/lib/marketplaceStore";

export function ThemeInjector() {
  const [settings, setSettings] = useState<WebsiteThemeSettings | null>(null);

  useEffect(() => {
    // Read theme settings initially
    const conf = MarketplaceStore.getSiteThemeSettings();
    setSettings(conf);

    // Poll or listen for storage events to support instant live preview edits!
    const handleStorageChange = () => {
      const updated = MarketplaceStore.getSiteThemeSettings();
      setSettings(updated);
    };

    window.addEventListener("storage", handleStorageChange);
    // Custom event to trigger updates on the same page
    window.addEventListener("beitak-theme-updated", handleStorageChange);

    return () => {
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("beitak-theme-updated", handleStorageChange);
    };
  }, []);

  useEffect(() => {
    if (!settings) return;

    // Build the dynamic CSS variables override
    const styleEl =
      document.getElementById("beitak-dynamic-theme") || document.createElement("style");
    styleEl.id = "beitak-dynamic-theme";

    // Prepare styles depending on theme mode
    let darkVar = settings.brandDark;
    let primaryVar = settings.brandPrimary;
    let accentVar = settings.brandAccent;
    let bgVar = settings.brandBg;

    if (settings.themeMode === "dark") {
      // Dark mode swap
      darkVar = settings.brandBg;
      bgVar = settings.brandDark;
    } else if (settings.themeMode === "luxury") {
      // Midnight luxury custom palette
      darkVar = "oklch(0.15 0.015 240)"; // Deep slate midnight
      primaryVar = "oklch(0.4 0.03 240)";
      accentVar = "oklch(0.78 0.12 75)"; // Sparkling Champagne gold
      bgVar = "oklch(0.99 0.005 240)"; // Clean luxury pearl
    }

    // Font family definition mapping
    let fontFamily = `"Cairo", ui-sans-serif, system-ui, sans-serif`;
    if (settings.primaryFont === "Cairo") {
      fontFamily = `"Cairo", ui-sans-serif, system-ui, sans-serif`;
    } else if (settings.primaryFont === "Cairo-Sans") {
      fontFamily = `"Cairo", system-ui, sans-serif`;
    } else if (settings.primaryFont === "Cairo-Mono") {
      fontFamily = `"Courier New", Courier, monospace`;
    }

    styleEl.innerHTML = `
      :root {
        --brand-dark: ${darkVar} !important;
        --brand-primary: ${primaryVar} !important;
        --brand-accent: ${accentVar} !important;
        --brand-bg: ${bgVar} !important;
        --radius: 0.875rem !important;
      }
      body {
        font-family: ${fontFamily} !important;
      }
      .admin-input, .input, .set-input {
        font-family: ${fontFamily} !important;
      }
    `;

    if (!document.getElementById("beitak-dynamic-theme")) {
      document.head.appendChild(styleEl);
    }
  }, [settings]);

  return null;
}
