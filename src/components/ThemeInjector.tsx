/* eslint-disable react-refresh/only-export-components */
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

  // Load Google Fonts for Arabic typography dynamically
  let fontLink = document.getElementById("beitak-google-fonts") as HTMLLinkElement | null;
  if (!fontLink) {
    fontLink = document.createElement("link");
    fontLink.id = "beitak-google-fonts";
    fontLink.rel = "stylesheet";
    fontLink.href =
      "https://fonts.googleapis.com/css2?family=Almarai:wght@400;700;800&family=Amiri:ital,wght@0,400;0,700;1,400&family=Cairo:wght@400;600;700;900&family=Changa:wght@500;700;800&family=El+Messiri:wght@600;700&family=IBM+Plex+Sans+Arabic:wght@400;600;700&family=Readex+Pro:wght@400;600;700&family=Tajawal:wght@400;700;900&display=swap";
    document.head.appendChild(fontLink);
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
  if (currentSettings.primaryFont) {
    const rawFont = currentSettings.primaryFont.replace("-Sans", "").replace("-Mono", "");
    fontFamily = `"${rawFont}", "Cairo", ui-sans-serif, system-ui, sans-serif`;
  }

  // Pattern CSS rules
  let patternCss = "background-image: none;";
  const pattern = currentSettings.patternStyle;
  if (pattern === "dots") {
    patternCss = `background-image: radial-gradient(rgba(0,0,0,0.06) 1px, transparent 1px); background-size: 16px 16px;`;
  } else if (pattern === "grid") {
    patternCss = `background-image: linear-gradient(to right, rgba(92,64,51,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(92,64,51,0.05) 1px, transparent 1px); background-size: 24px 24px;`;
  } else if (pattern === "islamic") {
    patternCss = `background-image: radial-gradient(#d2b48c 0.8px, transparent 0.8px), radial-gradient(#d2b48c 0.8px, transparent 0.8px); background-size: 28px 28px; background-position: 0 0, 14px 14px;`;
  } else if (pattern === "arabesque") {
    patternCss = `background-image: repeating-linear-gradient(45deg, rgba(210,180,140,0.09) 0, rgba(210,180,140,0.09) 1px, transparent 0, transparent 18px);`;
  } else if (pattern === "waves") {
    patternCss = `background-image: radial-gradient(circle at 100% 50%, transparent 20%, rgba(92,64,51,0.04) 21%, rgba(92,64,51,0.04) 34%, transparent 35%, transparent); background-size: 32px 32px;`;
  } else if (pattern === "wood") {
    patternCss = `background-image: repeating-linear-gradient(0deg, rgba(92,64,51,0.03) 0, rgba(92,64,51,0.03) 2px, transparent 2px, transparent 12px);`;
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
      ${patternCss}
    }

    .admin-input, .input, .set-input {
      font-family: ${fontFamily};
    }
    .admin-input:focus, .input:focus, .set-input:focus {
      border-color: ${accentColor};
    }
  `;
}

function findDomElementByLiveKey(key: string): HTMLElement | null {
  if (typeof document === "undefined") return null;
  const rawKey = key.replace(/^live_/, "");

  try {
    const el = document.getElementById(rawKey);
    if (el) return el;
  } catch {
    // ignore
  }

  try {
    if (typeof CSS !== "undefined" && CSS.escape) {
      const el =
        document.querySelector(`[data-live-id="${CSS.escape(key)}"]`) ||
        document.querySelector(`[data-live-id="${CSS.escape(rawKey)}"]`);
      if (el) return el as HTMLElement;
    }
  } catch {
    // ignore
  }

  try {
    const allLiveElements = document.querySelectorAll("[data-live-id]");
    for (let i = 0; i < allLiveElements.length; i++) {
      const attr = allLiveElements[i].getAttribute("data-live-id");
      if (attr === key || attr === rawKey) {
        return allLiveElements[i] as HTMLElement;
      }
    }
  } catch {
    // ignore
  }

  return null;
}

let isApplyingEdits = false;

export function applyLiveCmsEditsToDom() {
  if (typeof document === "undefined") return;
  if (isApplyingEdits) return;
  isApplyingEdits = true;

  try {
    const edits = MarketplaceStore?.getLiveCmsEdits?.() || {};

    let styleEl = document.getElementById("beitak-live-cms-css") as HTMLStyleElement | null;
    if (!styleEl) {
      styleEl = document.createElement("style");
      styleEl.id = "beitak-live-cms-css";
      document.head.appendChild(styleEl);
    }

    if (!edits || Object.keys(edits).length === 0) {
      styleEl.innerHTML = "";
      return;
    }

    let cssRules = "";

    const deletedSectionIds = MarketplaceStore?.getDeletedCustomSectionIds?.() || ["sec-default-1"];
    deletedSectionIds.forEach((sId) => {
      if (typeof CSS !== "undefined" && CSS.escape) {
        try {
          cssRules += `[data-live-id="${CSS.escape(sId)}"], [data-live-id="live_${CSS.escape(sId)}"], #${CSS.escape(sId)}, #live_${CSS.escape(sId)} { display: none !important; }\n`;
        } catch {
          // ignore
        }
      }
    });

    Object.entries(edits).forEach(([key, value]) => {
      if (!value) return;

      const rawKey = key.replace(/^live_/, "");

      if (value === "__DELETED__") {
        if (typeof CSS !== "undefined" && CSS.escape) {
          try {
            cssRules += `[data-live-id="${CSS.escape(key)}"], [data-live-id="${CSS.escape(rawKey)}"], #${CSS.escape(rawKey)} { display: none !important; }\n`;
          } catch {
            // ignore
          }
        }

        const el = findDomElementByLiveKey(key);
        if (el && el.style.display !== "none") el.style.display = "none";
        return;
      }

      if (value.startsWith("{")) {
        try {
          const parsed = JSON.parse(value);
          if (
            parsed.bgColor ||
            parsed.textColor ||
            parsed.fontSize ||
            parsed.borderRadius ||
            parsed.widthVal ||
            parsed.heightVal
          ) {
            try {
              if (typeof CSS !== "undefined" && CSS.escape) {
                const selectors = `[data-live-id="${CSS.escape(key)}"], [data-live-id="${CSS.escape(rawKey)}"], #${CSS.escape(rawKey)}`;
                let props = "";
                if (parsed.textColor) props += `color: ${parsed.textColor} !important; `;
                if (parsed.bgColor) props += `background-color: ${parsed.bgColor} !important; `;
                if (parsed.fontSize) props += `font-size: ${parsed.fontSize} !important; `;
                if (parsed.fontWeight) props += `font-weight: ${parsed.fontWeight} !important; `;
                if (parsed.borderRadius)
                  props += `border-radius: ${parsed.borderRadius} !important; `;
                if (parsed.widthVal) props += `width: ${parsed.widthVal} !important; `;
                if (parsed.heightVal) props += `height: ${parsed.heightVal} !important; `;
                if (props) {
                  cssRules += `${selectors} { ${props} }\n`;
                }
              }
            } catch {
              // ignore
            }
          }

          const el = findDomElementByLiveKey(key);
          if (el) {
            if (parsed.text !== undefined && el.tagName !== "IMG") {
              if (!el.querySelector("input, select, textarea") && el.innerText !== parsed.text) {
                el.innerText = parsed.text;
              }
            }
            if (parsed.imgSrc) {
              if (el.tagName === "IMG") {
                if ((el as HTMLImageElement).src !== parsed.imgSrc) {
                  (el as HTMLImageElement).src = parsed.imgSrc;
                }
              } else {
                const innerImg = el.querySelector("img");
                if (innerImg && innerImg.src !== parsed.imgSrc) {
                  innerImg.src = parsed.imgSrc;
                }
              }
            }
            if (parsed.fontSize && el.style.fontSize !== parsed.fontSize)
              el.style.fontSize = parsed.fontSize;
            if (parsed.fontWeight && el.style.fontWeight !== parsed.fontWeight)
              el.style.fontWeight = parsed.fontWeight;
            if (parsed.textColor && el.style.color !== parsed.textColor)
              el.style.color = parsed.textColor;
            if (parsed.bgColor && el.style.backgroundColor !== parsed.bgColor)
              el.style.backgroundColor = parsed.bgColor;
            if (parsed.borderRadius && el.style.borderRadius !== parsed.borderRadius)
              el.style.borderRadius = parsed.borderRadius;
            if (parsed.widthVal && el.style.width !== parsed.widthVal)
              el.style.width = parsed.widthVal;
            if (parsed.heightVal && el.style.height !== parsed.heightVal)
              el.style.height = parsed.heightVal;
            if (parsed.objectFit && el.style.objectFit !== parsed.objectFit)
              el.style.objectFit = parsed.objectFit;
            if (parsed.padding && el.style.padding !== parsed.padding)
              el.style.padding = parsed.padding;

            let transformStr = "";
            if (parsed.scale && parsed.scale !== 1) {
              transformStr += `scale(${parsed.scale}) `;
            }
            if (parsed.rotate) {
              transformStr += `rotate(${parsed.rotate}deg) `;
            }
            if (transformStr && el.style.transform !== transformStr.trim()) {
              el.style.transform = transformStr.trim();
              el.style.transformOrigin = "center";
            }
          }
        } catch {
          // ignore
        }
      } else {
        const el = findDomElementByLiveKey(key);
        if (el) {
          if (el.tagName === "IMG") {
            if ((el as HTMLImageElement).src !== value) (el as HTMLImageElement).src = value;
          } else {
            if (el.innerText !== value) el.innerText = value;
          }
        }
      }
    });

    if (styleEl && styleEl.innerHTML !== cssRules) {
      styleEl.innerHTML = cssRules;
    }
  } finally {
    isApplyingEdits = false;
  }
}

// Immediate initial execution on module load in browser context
if (typeof window !== "undefined") {
  try {
    injectThemeSynchronously();
    applyLiveCmsEditsToDom();
  } catch (err) {
    console.warn("Initial theme injection warning:", err);
  }
}

export function ThemeInjector() {
  const [settings, setSettings] = useState<WebsiteThemeSettings>(
    MarketplaceStore.getSiteThemeSettings,
  );

  useEffect(() => {
    applyLiveCmsEditsToDom();

    let rafId: number | null = null;
    let observer: MutationObserver | null = null;
    if (
      typeof MutationObserver !== "undefined" &&
      typeof document !== "undefined" &&
      document.body
    ) {
      observer = new MutationObserver(() => {
        if (rafId !== null) cancelAnimationFrame(rafId);
        rafId = requestAnimationFrame(() => {
          applyLiveCmsEditsToDom();
        });
      });
      observer.observe(document.body, { childList: true, subtree: true });
    }

    const handleStorageChange = () => {
      const updated = MarketplaceStore.getSiteThemeSettings();
      setSettings(updated);
      injectThemeSynchronously(updated);
      applyLiveCmsEditsToDom();
    };

    window.addEventListener("storage", handleStorageChange);
    window.addEventListener("beitak-theme-updated", handleStorageChange);
    window.addEventListener("beitak-live-cms-updated", handleStorageChange);

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId);
      if (observer) observer.disconnect();
      window.removeEventListener("storage", handleStorageChange);
      window.removeEventListener("beitak-theme-updated", handleStorageChange);
      window.removeEventListener("beitak-live-cms-updated", handleStorageChange);
    };
  }, []);

  useIsomorphicLayoutEffect(() => {
    injectThemeSynchronously(settings);
    applyLiveCmsEditsToDom();
  }, [settings]);

  return null;
}
