import {
  Sofa,
  Bed,
  UtensilsCrossed,
  Sparkles,
  Tv,
  Car,
  Building2,
  Book,
  Fish,
  Shirt,
  Home,
  Briefcase,
  Wrench,
  Package,
  Laptop,
  Smartphone,
  Gift,
  Heart,
  Star,
  ShoppingCart,
  User,
  Shield,
  Lightbulb,
  Compass,
  Award,
  Music,
  Coffee,
  Flame,
  Scissors,
  Camera,
  Gamepad2,
  Dumbbell,
  Palette,
  Footprints,
} from "lucide-react";
import type { ComponentType } from "react";

export const ALL_CATEGORY_ICONS: Record<string, ComponentType<{ className?: string }>> = {
  Sofa,
  Bed,
  UtensilsCrossed,
  Sparkles,
  Tv,
  Car,
  Building2,
  Book,
  Fish,
  Shirt,
  Home,
  Briefcase,
  Wrench,
  Package,
  Laptop,
  Smartphone,
  Gift,
  Heart,
  Star,
  ShoppingCart,
  User,
  Shield,
  Lightbulb,
  Compass,
  Award,
  Music,
  Coffee,
  Flame,
  Scissors,
  Camera,
  Gamepad2,
  Dumbbell,
  Palette,
  Footprints,
};

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  "غرف معيشة": Sofa,
  "غرف نوم": Bed,
  "طاولات طعام": UtensilsCrossed,
  ديكورات: Sparkles,
  كنبة: Sofa,
  كرسي: Sofa,
  "أجهزة كهربائية": Tv,
  سيارات: Car,
  عقارات: Building2,
  كتب: Book,
  أسماك: Fish,
  إلكترونيات: Tv,
  موضة: Shirt,
  أزياء: Shirt,
  ملابس: Shirt,
  "عقارات وأراضي": Home,
  وظائف: Briefcase,
  خدمات: Wrench,
};

const STORAGE_KEY = "beitak_category_icon_mappings";

export function getCustomIconMappings(): Record<string, string> {
  if (typeof window === "undefined") return {};
  try {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : {};
  } catch {
    return {};
  }
}

export function saveCustomIconMapping(categoryIdOrName: string, iconKey: string) {
  if (typeof window === "undefined") return;
  try {
    const mappings = getCustomIconMappings();
    mappings[categoryIdOrName] = iconKey;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(mappings));
  } catch (e) {
    console.warn("Failed to save custom icon mapping", e);
  }
}

export function getAutoIconKey(name: string): string {
  const norm = name.trim().toLowerCase();

  if (norm.includes("book") || norm.includes("كتب")) return "Book";
  if (norm.includes("fish") || norm.includes("سمك") || norm.includes("أسماك")) return "Fish";
  if (
    norm.includes("electr") ||
    norm.includes("devices") ||
    norm.includes("أجهزة") ||
    norm.includes("الكترون")
  )
    return "Tv";
  if (
    norm.includes("fashion") ||
    norm.includes("cloth") ||
    norm.includes("wear") ||
    norm.includes("موضة") ||
    norm.includes("ملابس") ||
    norm.includes("أزياء")
  )
    return "Shirt";
  if (
    norm.includes("real estate") ||
    norm.includes("house") ||
    norm.includes("building") ||
    norm.includes("عقار") ||
    norm.includes("بيت")
  )
    return "Home";
  if (
    norm.includes("job") ||
    norm.includes("work") ||
    norm.includes("وظائف") ||
    norm.includes("عمل")
  )
    return "Briefcase";
  if (
    norm.includes("service") ||
    norm.includes("tool") ||
    norm.includes("خدمات") ||
    norm.includes("صيانة") ||
    norm.includes("أدوات")
  )
    return "Wrench";
  if (norm.includes("car") || norm.includes("سيار")) return "Car";
  if (norm.includes("sofa") || norm.includes("معيشة") || norm.includes("كنب")) return "Sofa";
  if (norm.includes("bed") || norm.includes("نوم")) return "Bed";
  if (norm.includes("dining") || norm.includes("طعام") || norm.includes("أكل"))
    return "UtensilsCrossed";
  if (norm.includes("decor") || norm.includes("ديكور")) return "Sparkles";

  return "Package";
}

export function getCategoryIcon(categoryIdOrName: string): ComponentType<{ className?: string }> {
  if (!categoryIdOrName) return Package;

  // 1. Check custom mapping in localStorage
  const mappings = getCustomIconMappings();
  const customKey = mappings[categoryIdOrName];
  if (customKey && ALL_CATEGORY_ICONS[customKey]) {
    return ALL_CATEGORY_ICONS[customKey];
  }

  // Also check mapping by name if categoryId was passed
  const cleanName = categoryIdOrName.trim();
  const customNameKey = mappings[cleanName];
  if (customNameKey && ALL_CATEGORY_ICONS[customNameKey]) {
    return ALL_CATEGORY_ICONS[customNameKey];
  }

  // 2. Direct name matching or standard auto-matching
  const autoKey = getAutoIconKey(cleanName);
  if (ALL_CATEGORY_ICONS[autoKey]) {
    return ALL_CATEGORY_ICONS[autoKey];
  }

  if (ICON_MAP[cleanName]) return ICON_MAP[cleanName];

  return Package;
}
