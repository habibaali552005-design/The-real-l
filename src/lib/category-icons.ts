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
  Watch,
  Glasses,
  Baby,
  ShoppingBag,
  ShoppingBasket,
  Cpu,
  Apple,
  Store,
  Tag,
  Smile,
  Zap,
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
  Watch,
  Glasses,
  Baby,
  ShoppingBag,
  ShoppingBasket,
  Cpu,
  Apple,
  Store,
  Tag,
  Smile,
  Zap,
};

const ICON_MAP: Record<string, ComponentType<{ className?: string }>> = {
  الأزياء: Shirt,
  موضة: Shirt,
  أزياء: Shirt,
  ملابس: Shirt,
  النساء: Sparkles,
  الرجال: User,
  الأطفال: Baby,
  للجميع: User,
  الأحذية: Footprints,
  الحقائب: Briefcase,
  المحافظ: Briefcase,
  الإكسسوارات: Sparkles,
  المجوهرات: Sparkles,
  الساعات: Watch,
  النظارات: Glasses,
  الإلكترونيات: Laptop,
  الهواتف: Smartphone,
  "الأجهزة اللوحية": Smartphone,
  اللابتوبات: Laptop,
  الشاشات: Tv,
  "الساعات الذكية": Watch,
  السماعات: Music,
  الكاميرات: Camera,
  "الأجهزة الكهربائية": Cpu,
  الثلاجات: Cpu,
  الغسالات: Cpu,
  البوتاجازات: Flame,
  المكيفات: Zap,
  المكانس: Wrench,
  "المنزل والأثاث": Home,
  الكنب: Sofa,
  الطاولات: UtensilsCrossed,
  الأسرة: Bed,
  الدواليب: Home,
  الديكور: Sparkles,
  العقارات: Building2,
  شقق: Home,
  فلل: Building2,
  أراضي: Compass,
  محلات: Store,
  مكاتب: Briefcase,
  السيارات: Car,
  سيارات: Car,
  "دراجات نارية": Zap,
  "قطع الغيار": Wrench,
  "الصحة والجمال": Smile,
  العطور: Sparkles,
  "العناية بالبشرة": Heart,
  "العناية بالشعر": Heart,
  المكياج: Sparkles,
  "الأم والطفل": Baby,
  عربات: Baby,
  الألعاب: Gamepad2,
  "السوبر ماركت": ShoppingBasket,
  الأغذية: Apple,
  المشروبات: Coffee,
  المنظفات: Wrench,
  الكتب: Book,
  كتب: Book,
  مجلات: Book,
  الرياضة: Dumbbell,
  المعدات: Dumbbell,
  الهدايا: Gift,
  هدايا: Gift,
  "الحرف اليدوية": Scissors,
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

  if (norm.includes("ساع") || norm.includes("watch")) return "Watch";
  if (norm.includes("نظار") || norm.includes("glass")) return "Glasses";
  if (
    norm.includes("طفل") ||
    norm.includes("أطفال") ||
    norm.includes("رضع") ||
    norm.includes("baby")
  )
    return "Baby";
  if (
    norm.includes("حقائب") ||
    norm.includes("شنط") ||
    norm.includes("محافظ") ||
    norm.includes("bag")
  )
    return "Briefcase";
  if (
    norm.includes("حذاء") ||
    norm.includes("أحذية") ||
    norm.includes("جزمة") ||
    norm.includes("shoe")
  )
    return "Footprints";
  if (
    norm.includes("جمال") ||
    norm.includes("عطور") ||
    norm.includes("مكياج") ||
    norm.includes("بشرة") ||
    norm.includes("تجميل")
  )
    return "Sparkles";
  if (
    norm.includes("هاتف") ||
    norm.includes("جوال") ||
    norm.includes("موبايل") ||
    norm.includes("phone")
  )
    return "Smartphone";
  if (norm.includes("لابتوب") || norm.includes("كمبيوتر") || norm.includes("laptop"))
    return "Laptop";
  if (norm.includes("شاش") || norm.includes("تلفزيون") || norm.includes("tv")) return "Tv";
  if (norm.includes("كاميرا") || norm.includes("camera")) return "Camera";
  if (norm.includes("لعب") || norm.includes("ألعاب") || norm.includes("game")) return "Gamepad2";
  if (
    norm.includes("رياض") ||
    norm.includes("جيم") ||
    norm.includes("معدات") ||
    norm.includes("sport")
  )
    return "Dumbbell";
  if (
    norm.includes("كتاب") ||
    norm.includes("كتب") ||
    norm.includes("مجلة") ||
    norm.includes("book")
  )
    return "Book";
  if (
    norm.includes("سوبر") ||
    norm.includes("غذاء") ||
    norm.includes("أغذية") ||
    norm.includes("طعام") ||
    norm.includes("ماركت")
  )
    return "ShoppingBasket";
  if (
    norm.includes("مشروب") ||
    norm.includes("قهوة") ||
    norm.includes("شاي") ||
    norm.includes("coffee")
  )
    return "Coffee";
  if (norm.includes("هدية") || norm.includes("هدايا") || norm.includes("gift")) return "Gift";
  if (
    norm.includes("حرف") ||
    norm.includes("يدوي") ||
    norm.includes("قص") ||
    norm.includes("craft")
  )
    return "Scissors";
  if (
    norm.includes("سيار") ||
    norm.includes("موتور") ||
    norm.includes("مركبة") ||
    norm.includes("car")
  )
    return "Car";
  if (
    norm.includes("عقار") ||
    norm.includes("شقة") ||
    norm.includes("فلا") ||
    norm.includes("مكتب") ||
    norm.includes("محل")
  )
    return "Building2";
  if (
    norm.includes("أثاث") ||
    norm.includes("كنب") ||
    norm.includes("صالون") ||
    norm.includes("sofa")
  )
    return "Sofa";
  if (norm.includes("سرير") || norm.includes("نوم") || norm.includes("bed")) return "Bed";
  if (norm.includes("بوتاجاز") || norm.includes("فرن") || norm.includes("نار")) return "Flame";
  if (
    norm.includes("كهرب") ||
    norm.includes("ثلاج") ||
    norm.includes("غسال") ||
    norm.includes("جهاز") ||
    norm.includes("تكييف")
  )
    return "Cpu";
  if (
    norm.includes("فستان") ||
    norm.includes("عباية") ||
    norm.includes("بلوزة") ||
    norm.includes("قميص") ||
    norm.includes("تيشيرت") ||
    norm.includes("بنطال") ||
    norm.includes("ملابس") ||
    norm.includes("أزياء") ||
    norm.includes("موضة")
  )
    return "Shirt";

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

  // 2. Direct exact match in ICON_MAP
  if (ICON_MAP[cleanName]) return ICON_MAP[cleanName];

  // 3. Keyword auto-matching
  const autoKey = getAutoIconKey(cleanName);
  if (ALL_CATEGORY_ICONS[autoKey]) {
    return ALL_CATEGORY_ICONS[autoKey];
  }

  return Package;
}
