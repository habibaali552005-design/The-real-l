export interface ProductVariantCombination {
  color?: string;
  size?: string;
  stock: number;
  price?: number;
  sku?: string;
}

export interface ProductReview {
  id: string;
  product_id: string;
  user_name: string;
  rating: number;
  comment: string;
  created_at: string;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  images?: string[];
  image_color_map?: Record<string, string>; // Maps color name to image URL
  category: string;
  in_stock: boolean;
  featured?: boolean;
  description?: string | null;
  short_description?: string | null;
  available_governorates?: string[];
  colors?: string[];
  sizes?: string[];
  patterns?: string[];
  area_sqm?: number | string; // Property or space area in square meters (م²)
  capacity_weight?: number | string; // Weight, load capacity or volume in kilograms (كجم)
  is_best_seller?: boolean; // Flag for Best Sellers section
  variant_combinations?: ProductVariantCombination[];
  allowed_payment_methods?: PaymentMethod[];
  specifications?: Record<string, string>;
  rating?: number;
  reviews_count?: number;
  sales_count?: number;
  created_at?: string;
  source?: string;
  seller_id?: string;
  seller_name?: string;
  seller_type?: SellerType;
  inspection_allowed?: boolean; // Permitting inspection before paying COD
  for_women_only?: boolean; // Products reserved exclusively for Women Lounge
}

export function canDeliverToGovernorate(
  p: { available_governorates?: string[] },
  userGov: string,
): boolean {
  if (!userGov || userGov === "جميع المحافظات") return true;
  const govs = p.available_governorates || [];
  if (govs.length === 0 || govs.includes("جميع المحافظات")) return true;
  return govs.includes(userGov);
}

export function isWomenProduct(p: {
  category?: string | null;
  name?: string | null;
  for_women_only?: boolean | null;
}): boolean {
  if (p?.for_women_only) return true;
  const cat = (p?.category || "").toLowerCase();
  const name = (p?.name || "").toLowerCase();
  const keywords = [
    "نساء",
    "نسائي",
    "نسائية",
    "بنات",
    "بناتي",
    "حريمي",
    "فستان",
    "عباية",
    "مكياج",
    "تجميل نسائي",
    "أزياء نسائية",
    "ملابس نسائية",
    "مستحضرات تجميل",
  ];
  return keywords.some((k) => cat.includes(k) || name.includes(k));
}

export type SellerType = "individual" | "store" | "brand" | "company" | "marketer";

export interface CommissionDebt {
  id: string;
  seller_id: string;
  seller_name: string;
  order_id: string;
  amount: number;
  commission_rate: number;
  status: "unpaid" | "partially_paid" | "paid" | "exempted";
  created_at: string;
  paid_at?: string;
  notes?: string;
}

export const EGYPT_GOVERNORATES = [
  "جميع المحافظات",
  "القاهرة",
  "الجيزة",
  "الإسكندرية",
  "الدقهلية",
  "الشرقية",
  "القليوبية",
  "البحيرة",
  "المنوفية",
  "الغربية",
  "كفر الشيخ",
  "الفيوم",
  "بني سويف",
  "المنيا",
  "أسيوط",
  "سوهاج",
  "قنا",
  "الأقصر",
  "أسوان",
  "البحر الأحمر",
  "الوادي الجديد",
  "مطروح",
  "شمال سيناء",
  "جنوب سيناء",
  "بورسعيد",
  "الإسماعيلية",
  "السويس",
] as const;

export type PaymentMethod = "cod" | "card" | "wallet" | "instapay";
