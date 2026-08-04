import { Product } from "@/routes/admin";
import { MarketplaceStore } from "@/lib/marketplaceStore";

const SEARCH_HISTORY_KEY = "beitak_search_history_v2";
const RECENT_PRODUCTS_KEY = "beitak_recent_searched_products_v2";

export interface RankedSearchResult {
  product: Product;
  score: number;
  matchType:
    "exact_name" | "partial_name" | "title_keyword" | "description_keyword" | "category_filter";
}

// Common Arabic typos and standardizations
const ARABIC_TYPO_MAP: Record<string, string> = {
  ثلاجه: "ثلاجة",
  غساله: "غسالة",
  انترية: "انتريه",
  اريكه: "أريكة",
  سفره: "سفرة",
  ترابيزه: "طاولة",
  مطبخ: "مطابخ",
  بوتاجاز: "بوتجاز",
  شاشه: "شاشة",
  غرفه: "غرفة",
  كرسي: "كراسي",
  كومودينو: "كومود",
  دولاب: "أدولاب",
  مرتبه: "مرتبة",
};

export const POPULAR_SEARCHES = [
  "غرف نوم مودرن",
  "طقم انتريه",
  "ثلاجة توشيبا",
  "غسالة ملابس",
  "ركنة مودرن L-Shape",
  "طاولة سفرة 6 كراسي",
  "مطبخ كامل خشب",
  "سرير اطفال 120 سم",
];

export function normalizeArabicText(text: string): string {
  if (!text) return "";
  return text
    .toLowerCase()
    .trim()
    .replace(/[أإآ]/g, "ا")
    .replace(/ة/g, "ه")
    .replace(/ى/g, "ي")
    .replace(/[\u064B-\u0652]/g, ""); // strip tashkeel
}

export function detectTypoCorrection(query: string): string | null {
  const normalized = normalizeArabicText(query);
  for (const [typo, fix] of Object.entries(ARABIC_TYPO_MAP)) {
    if (normalized === normalizeArabicText(typo)) {
      return fix;
    }
  }
  return null;
}

export function rankProductsAmazonStyle(products: Product[], rawQuery: string): Product[] {
  if (!rawQuery || !rawQuery.trim()) return products;

  const query = rawQuery.trim();
  const normQuery = normalizeArabicText(query);
  const queryWords = normQuery.split(/\s+/).filter(Boolean);

  const scored: RankedSearchResult[] = [];

  for (const p of products) {
    const pNameNorm = normalizeArabicText(p.name || "");
    const pDescNorm = normalizeArabicText(p.description || "");

    let score = 0;
    let matchType: RankedSearchResult["matchType"] = "description_keyword";

    // 1. Exact Name match (Highest priority)
    if (pNameNorm === normQuery) {
      score += 2000;
      matchType = "exact_name";
    }
    // 2. Name starts with query / Partial product name
    else if (pNameNorm.startsWith(normQuery)) {
      score += 1500;
      matchType = "partial_name";
    } else if (pNameNorm.includes(normQuery)) {
      score += 1000;
      matchType = "partial_name";
    }
    // 3. Title keywords match
    else {
      let matchedWordCount = 0;
      for (const w of queryWords) {
        if (pNameNorm.includes(w)) {
          matchedWordCount++;
        }
      }
      if (matchedWordCount > 0) {
        score += 500 * matchedWordCount;
        matchType = "title_keyword";
      }
    }

    // 4. Product Description keywords
    if (pDescNorm.includes(normQuery)) {
      score += 100;
      if (score === 100) matchType = "description_keyword";
    } else {
      for (const w of queryWords) {
        if (pDescNorm.includes(w)) {
          score += 20;
        }
      }
    }

    if (score > 0) {
      scored.push({ product: p, score, matchType });
    }
  }

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  return scored.map((item) => item.product);
}

// Search History functions
export function getSearchHistory(): string[] {
  try {
    const raw = localStorage.getItem(SEARCH_HISTORY_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function saveSearchHistory(query: string): void {
  if (!query || !query.trim()) return;
  const q = query.trim();
  const history = getSearchHistory();
  const updated = [q, ...history.filter((item) => item.toLowerCase() !== q.toLowerCase())].slice(
    0,
    10,
  );
  try {
    localStorage.setItem(SEARCH_HISTORY_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Could not save search history", e);
  }
}

export function clearSearchHistory(): void {
  try {
    localStorage.removeItem(SEARCH_HISTORY_KEY);
  } catch (e) {
    console.error("Could not clear search history", e);
  }
}

// Recent Searched Products
export function getRecentlyViewedProducts(): string[] {
  try {
    const raw = localStorage.getItem(RECENT_PRODUCTS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function recordProductView(productId: string): void {
  if (!productId) return;
  const list = getRecentlyViewedProducts();
  const updated = [productId, ...list.filter((id) => id !== productId)].slice(0, 12);
  try {
    localStorage.setItem(RECENT_PRODUCTS_KEY, JSON.stringify(updated));
  } catch (e) {
    console.error("Could not record product view", e);
  }
}
