export type ProductStatus =
  "draft" | "under_review" | "published" | "paused" | "out_of_stock" | "sold" | "archived";

export type SellingMethod = "in_stock" | "on_demand" | "always_available" | "single_item";

export interface PurchaseOption {
  id: string;
  type:
    | "color"
    | "size"
    | "volume"
    | "flavor"
    | "finish"
    | "category"
    | "condition"
    | "material"
    | "custom";
  label: string; // e.g. "اللون", "المقاس", "السعة", "النكهة"
  value: string; // e.g. "أزرق ملكي", "XXL", "100 مل"
  price_delta?: number; // +/- adjustment
  stock?: number;
  sku?: string;
  image_url?: string;
}

export interface SpecFieldDefinition {
  id: string;
  name: string; // e.g. "السعة باللتر", "المساحة بالمتر المربع", "القدرة بالحصان"
  type: "text" | "number" | "select" | "boolean" | "multiselect";
  unit?: string; // e.g. "لتر", "كجم", "م²", "حصان", "بوصة", "جيجابايت", "سنة"
  options?: string[]; // predefined values for select
  required?: boolean;
  description?: string;
  defaultValue?: string | number | boolean;
}

export interface CategoryFilterDefinition {
  id: string;
  label: string;
  type: "range" | "select" | "boolean" | "multiselect";
  options?: string[];
  unit?: string;
}

export interface AllowedOptionType {
  type: "color" | "size" | "volume" | "flavor" | "finish" | "condition" | "material" | "custom";
  label: string;
  defaultValues?: string[];
}

export interface CategoryTemplate {
  id: string;
  mainCategory: string; // e.g. "الإلكترونيات والأجهزة الكهربائية"
  subCategory?: string; // e.g. "ثلاجات وديب فريزر"
  parentTemplateId?: string; // For inheritance
  description: string;
  iconName?: string;

  // Specific fields & Specs
  requiredFields: string[]; // Standard product fields required
  optionalFields: string[];
  specDefinitions: SpecFieldDefinition[];

  // Allowed Purchase Options for this category
  allowedOptionTypes: AllowedOptionType[];

  // Category Search Filters
  searchFilters: CategoryFilterDefinition[];

  // Predefined lists
  predefinedBrands?: string[];
  predefinedMaterials?: string[];
  predefinedColors?: string[];
  predefinedFinishes?: string[];
  predefinedUnits?: string[];
}

export interface SharedOptionResource {
  id: string;
  type: string;
  typeLabel: string;
  value: string;
  status: "active" | "disabled" | "archived";
  createdBySellerId?: string;
  createdAt: string;
}

export interface ProductAuditLog {
  id: string;
  productId: string;
  productName: string;
  userId: string;
  userName: string;
  userRole: string;
  action:
    | "create"
    | "update"
    | "publish"
    | "pause"
    | "archive"
    | "delete"
    | "status_change"
    | "price_change"
    | "options_change"
    | "stock_change";
  beforeValue?: unknown;
  afterValue?: unknown;
  timestamp: string;
  details?: string;
}

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
  currency?: string;
  image_url: string | null;
  images?: string[];
  image_color_map?: Record<string, string>; // Maps color name to image URL
  category: string;
  main_category?: string;
  sub_category?: string;
  status?: ProductStatus;
  selling_method?: SellingMethod;
  in_stock: boolean;
  featured?: boolean;
  description?: string | null;
  short_description?: string | null;
  available_governorates?: string[];
  colors?: string[];
  sizes?: string[];
  patterns?: string[];
  purchase_options?: PurchaseOption[];
  area_sqm?: number | string; // Property or space area in square meters (م²)
  capacity_weight?: number | string; // Weight, load capacity or volume in kilograms (كجم)
  is_best_seller?: boolean; // Flag for Best Sellers section
  variant_combinations?: ProductVariantCombination[];
  allowed_payment_methods?: PaymentMethod[];
  specifications?: Record<string, string>;
  rating?: number;
  reviews_count?: number;
  sales_count?: number;
  views_count?: number;
  low_stock_threshold?: number;
  auto_hide_out_of_stock?: boolean;
  created_at?: string;
  updated_at?: string;
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
