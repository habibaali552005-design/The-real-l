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

    // ── Resolve brand base values ─────────────────────────────────────────
    // Start with the stored brand vars (may be oklch or hex)
    let darkVar = settings.brandDark;
    let bgVar = settings.brandBg;

    if (settings.themeMode === "dark") {
      darkVar = settings.brandBg;
      bgVar = settings.brandDark;
    } else if (settings.themeMode === "luxury") {
      darkVar = "oklch(0.15 0.015 240)";
      bgVar = "oklch(0.99 0.005 240)";
    }

    // ── Homepage builder colors are the primary color source ──────────────
    // When hex values are set in the homepage builder, they represent the
    // admin's explicit color choices and should drive the whole site.
    // Fall back to brand vars when homepage builder colors aren't explicitly set.
    const isHex = (v?: string) => !!v && v.startsWith("#");

    // Primary brand colour
    const primaryColor = isHex(settings.homepagePrimary)
      ? settings.homepagePrimary!
      : settings.brandPrimary.startsWith("oklch")
        ? "oklch(0.40 0.06 45)" // #5C4033 rich mahogany — oklch kept for proper rendering
        : settings.brandPrimary;

    // Accent colour
    const accentColor = isHex(settings.homepageAccent)
      ? settings.homepageAccent!
      : settings.brandAccent.startsWith("oklch")
        ? "oklch(0.78 0.07 80)" // #D2B48C warm golden beige
        : settings.brandAccent;

    // Background
    const bgColor = isHex(settings.homepageBg)
      ? settings.homepageBg!
      : bgVar;

    // Text / dark
    const textColor = isHex(settings.homepageText)
      ? settings.homepageText!
      : darkVar;

    // Card background
    const cardColor = settings.homepageCard || "#FFFFFF";

    // ── Font ─────────────────────────────────────────────────────────────
    let fontFamily = `"Cairo", ui-sans-serif, system-ui, sans-serif`;
    if (settings.primaryFont === "Cairo-Mono") {
      fontFamily = `"Courier New", Courier, monospace`;
    }

    // ── Inject a single <style> tag that is the authoritative colour source ─
    const styleEl =
      document.getElementById("beitak-dynamic-theme") || document.createElement("style");
    styleEl.id = "beitak-dynamic-theme";

    styleEl.innerHTML = `
      :root {
        /* ── Core brand palette ────────────────────────── */
        --brand-dark:    ${textColor} !important;
        --brand-primary: ${primaryColor} !important;
        --brand-accent:  ${accentColor} !important;
        --brand-bg:      ${bgColor} !important;

        /* ── Shadcn / Tailwind semantic tokens ─────────── */
        --background:          ${bgColor} !important;
        --foreground:          ${textColor} !important;
        --card:                ${cardColor} !important;
        --card-foreground:     ${textColor} !important;
        --popover:             ${cardColor} !important;
        --popover-foreground:  ${textColor} !important;
        --primary:             ${primaryColor} !important;
        --primary-foreground:  ${bgColor} !important;
        --accent:              ${accentColor} !important;
        --accent-foreground:   ${textColor} !important;
        --secondary:           color-mix(in srgb, ${bgColor} 80%, ${primaryColor} 20%) !important;
        --secondary-foreground: ${textColor} !important;
        --muted:               color-mix(in srgb, ${bgColor} 85%, ${primaryColor} 15%) !important;
        --muted-foreground:    color-mix(in srgb, ${textColor} 50%, ${bgColor} 50%) !important;
        --border:              color-mix(in srgb, ${bgColor} 80%, ${textColor} 20%) !important;
        --input:               color-mix(in srgb, ${bgColor} 80%, ${textColor} 20%) !important;
        --ring:                ${accentColor} !important;
        --radius: 0.875rem !important;
      }
      body {
        background-color: ${bgColor} !important;
        color: ${textColor} !important;
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
