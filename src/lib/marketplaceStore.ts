import { Database } from "@/integrations/supabase/types";
import { supabase } from "@/integrations/supabase/client";
import {
  Product,
  ProductReview,
  ProductStatus,
  SellingMethod,
  PurchaseOption,
  SharedOptionResource,
  ProductAuditLog,
} from "@/types";

export interface CategoryNode {
  id: string;
  name: string;
  slug: string;
  parentId: string | null;
  icon?: string;
  sortOrder?: number;
}

export interface WomenLoungeSettings {
  enabled: boolean;
  gateTitle: string;
  gateSubtitle: string;
  gateNoticeText: string;
  requireConfirmation: boolean;
  subcategories: string[];
}

const DEFAULT_WOMEN_LOUNGE_SETTINGS: WomenLoungeSettings = {
  enabled: true,
  gateTitle: "قسم مخصص للنساء فقط",
  gateSubtitle: "هذا القسم يحتوي على أزياء، مستحضرات تجميل، ومنتجات خاصة بالنساء.",
  gateNoticeText: "يُرجى تأكيد الدخول للنساء فقط لضمان الخصوصية التامة والتسوق المريح.",
  requireConfirmation: true,
  subcategories: [
    "أزياء نسائية",
    "عبايات ومحجبات",
    "مستحضرات تجميل ومكياج",
    "إكسسوارات وحقائب",
    "أحذية نسائية",
    "عطور وبخور نسائية",
  ],
};

export interface CustomLiveSection {
  id: string;
  title: string;
  subtitle: string;
  type: "banner" | "notice" | "card" | "button";
  badgeText?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgColor?: string;
}

export interface WebsiteThemeSettings {
  primaryFont: string;
  themeMode: "light" | "dark" | "luxury" | "amber" | "emerald" | "royal" | string;
  patternStyle?: "none" | "dots" | "grid" | "islamic" | "arabesque" | "waves" | "wood" | string;
  brandDark: string;
  brandPrimary: string;
  brandAccent: string;
  brandBg: string;
  showLoyalty: boolean;
  showBlog: boolean;
  headerStyle?: "centered" | "split";
  headerAnnouncement?: string;
  footerText?: string;
  bannerUrl?: string;
  bannerTitle?: string;
  bannerSubtitle?: string;
  bannerCtaText?: string;

  // Custom Live Builder Dynamic Sections
  customLiveSections?: CustomLiveSection[];

  // Advanced Homepage Builder Fields
  homepageTheme?: string;
  homepageSections?: string[];
  homepageBg?: string;
  homepageText?: string;
  homepagePrimary?: string;
  homepageAccent?: string;
  homepageCard?: string;
  heroTitle?: string;
  heroSubtitle?: string;
  heroCtaText?: string;
  heroImageUrl?: string;
  trustTitle?: string;
  categoriesTitle?: string;
  verticalBannersEnabled?: boolean;
  ctaTitle?: string;
  ctaSubtitle?: string;
  ctaButtonText?: string;
  featuredTitle?: string;
  latestTitle?: string;
}

const DEFAULT_THEME_SETTINGS: WebsiteThemeSettings = {
  primaryFont: "Cairo",
  themeMode: "light",
  brandDark: "#1C1613",
  brandPrimary: "#5C4033",
  brandAccent: "#D2B48C",
  brandBg: "#F8F5EE",
  showLoyalty: true,
  showBlog: false,
  headerStyle: "split",
  headerAnnouncement: "شحن مجاني على جميع الطلبات لفترة محدودة!",
  footerText: "© 2026 بيتك للاثاث والمفروشات العصريّة. جميع الحقوق محفوظة.",
  bannerUrl: "",
  bannerTitle: "أثاث منزلي فاخر يناسب ذوقك",
  bannerSubtitle:
    "اكتشف أحدث تشكيلة من غرف المعيشة، المفروشات، والكنب العصري بأسعار ممتازة وجاذبية لا تقاوم.",
  bannerCtaText: "تسوق التشكيلة الآن",

  customLiveSections: [],

  // Default Builder Defaults
  homepageTheme: "modern",
  homepageSections: [
    "hero",
    "trust",
    "categories",
    "vertical_banners",
    "featured",
    "latest",
    "cta",
  ],
  homepageBg: "#FDFBF7",
  homepageText: "#2D241E",
  homepagePrimary: "#8C6A5D",
  homepageAccent: "#C5A059",
  homepageCard: "#FFFFFF",
  heroTitle: "كل اللي بيتك محتاجه في مكان واحد",
  heroSubtitle: "أثاث، أجهزة كهربائية، سيارات، وعقارات — بيع وشراء بأمان مع بيتك.",
  heroCtaText: "تسوق الآن",
  heroImageUrl: "",
  trustTitle: "لماذا تشتري من بيتك؟",
  categoriesTitle: "تسوق حسب القسم",
  verticalBannersEnabled: true,
  ctaTitle: "جاهز تطلب؟",
  ctaSubtitle: "اختار قطعك واملأ بياناتك وهنوصلك لحد باب البيت في أي محافظة.",
  ctaButtonText: "ابدأ التسوق",
  featuredTitle: "الأكثر مبيعاً",
  latestTitle: "وصل حديثاً",
};

export interface Visitor {
  id: string;
  name: string;
  email: string;
  phone: string;
  registeredAt: string;
  lastLoginAt: string;
  status: "active" | "suspended";
  role: "visitor" | "seller" | "customer";
  aiCredits: number;
  storageCredits: number; // in MB
  marketingCredits: number;
  lifetimeAccess: boolean;
}

export interface Seller {
  id: string;
  storeName: string;
  ownerName: string;
  email: string;
  phone: string;
  logoUrl?: string;
  status: "pending" | "approved" | "rejected" | "suspended";
  registeredAt: string;
  sellerType?: "affiliate" | "merchant" | "factory"; // مسوق بالعمولة | تاجر فردي | شركة/مصنع
  commissionCut?: number;
  commercialRegistration?: string;
  taxCard?: string;
  isVerifiedCompany?: boolean;
}

export interface SellerRequest {
  id: string;
  sellerId: string;
  sellerName: string;
  requestType: "category" | "payment_method" | "company_verification";
  title: string;
  details: string;
  targetSection?: "general" | "women";
  status: "pending" | "approved" | "rejected";
  createdAt: string;
}

export interface SellerCustomerOrder {
  id: string;
  orderNumber: string;
  sellerId: string;
  customerName: string;
  phone: string;
  backupPhone?: string;
  governorate: string;
  area: string;
  address: string;
  notes?: string;
  paymentMethod?: string;
  items: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
    image_url?: string;
    selectedColor?: string;
    selectedSize?: string;
  }>;
  total: number;
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled";
  createdAt: string;
}

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  type: "monthly" | "yearly" | "lifetime" | "trial" | "gift";
  features: string[];
  isEnabled: boolean;
  description: string;
  aiCredits: number;
}

export interface DynamicRole {
  id: string;
  name: string;
  description: string;
  permissions: string[];
}

export interface Warehouse {
  id: string;
  name: string;
  location: string;
  capacity: number;
}

export interface ProductVariant {
  id: string;
  sku: string;
  price: number;
  stock: number;
  attributes: Record<string, string>; // e.g., color: "بني", size: "كبير"
  warehouseId: string;
}

export interface ProductMetadata {
  productId: string;
  brand?: string;
  collection?: string;
  customFields: Array<{ name: string; value: string }>;
  specifications: Array<{ name: string; value: string }> | Record<string, string>;
  variants: ProductVariant[];
  images: Array<{ url: string; sortOrder: number }>;
  warehouseStocks: Record<string, number>; // warehouseId -> stock
  commissionRate?: number;
  platformCutRate?: number;
  platformMerchantFeeRate?: number;
  deliveryFee?: number;
  colors?: string[];
  sizes?: string[];
  patterns?: string[];
}

export interface Coupon {
  code: string;
  discount: number;
  type: "percent" | "fixed";
  expiresAt: string;
  isEnabled: boolean;
}

export interface CommissionRule {
  id: string;
  category: string;
  percentage: number;
  fixedFee: number;
}

// In-memory / LocalStorage database for extended Multi-Vendor features
const STORAGE_PREFIX = "beitak_mv_";

function getStored<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const data = localStorage.getItem(STORAGE_PREFIX + key);
    return data ? JSON.parse(data) : fallback;
  } catch {
    return fallback;
  }
}

function setStored<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(value));
  } catch (e) {
    console.warn("Failed to persist key " + key, e);
  }
}

// Pre-populated initial mock data for premium dashboards
const INITIAL_PLANS: SubscriptionPlan[] = [
  {
    id: "plan-trial",
    name: "الباقة التجريبية (Trial)",
    price: 0,
    type: "trial",
    description: "باقة تجريبية مجانية للبدء في البيع واستخدام أدوات الذكاء الاصطناعي الأساسية",
    features: ["أدوات الذكاء الاصطناعي - 50 رصيد", "رفع حتى 20 منتج", "مستودع واحد"],
    isEnabled: true,
    aiCredits: 50,
  },
  {
    id: "plan-monthly-standard",
    name: "الباقة الشهرية العادية",
    price: 450,
    type: "monthly",
    description: "باقة شهرية متكاملة للتجار المبتدئين",
    features: [
      "أدوات الذكاء الاصطناعي - 500 رصيد",
      "استوديو صور الذكاء الاصطناعي",
      "تخزين صور غير محدود",
      "3 مستودعات",
    ],
    isEnabled: true,
    aiCredits: 500,
  },
  {
    id: "plan-yearly-premium",
    name: "الباقة السنوية الاحترافية",
    price: 3900,
    type: "yearly",
    description:
      "الباقة السنوية الموفرة للتجار المحترفين والشركات مع دعم فني متكامل ورصيد AI مضاعف",
    features: [
      "أدوات الذكاء الاصطناعي - 8000 رصيد",
      "محرر صور الدفعات بالذكاء الاصطناعي",
      "استوديو صور الذكاء الاصطناعي المطور",
      "مستودعات غير محدودة",
      "أولوية الدعم الفني",
    ],
    isEnabled: true,
    aiCredits: 8000,
  },
  {
    id: "plan-lifetime-pro",
    name: "الباقة الذهبية مدى الحياة (Lifetime)",
    price: 9999,
    type: "lifetime",
    description:
      "دخول غير محدود لجميع أدوات المنصة واستوديو الذكاء الاصطناعي مدى الحياة بدون اشتراكات متكررة",
    features: [
      "أدوات الذكاء الاصطناعي - رصيد غير محدود",
      "استوديو صور الدفعات غير المحدود",
      "ترخيص تجاري كامل",
      "إمكانية الربط مع المتاجر الخارجية",
    ],
    isEnabled: true,
    aiCredits: 999999,
  },
];

const INITIAL_ROLES: DynamicRole[] = [
  {
    id: "role-super-admin",
    name: "مدير عام النظام (Super Admin)",
    description: "صلاحيات كاملة وغير محدودة لإدارة وتكوين كل جوانب المنصة والشركاء",
    permissions: [
      "all_access",
      "manage_settings",
      "manage_sellers",
      "manage_visitors",
      "manage_plans",
      "manage_products",
      "manage_orders",
    ],
  },
  {
    id: "role-seller-premium",
    name: "تاجر مسجل (Seller)",
    description:
      "صلاحيات رفع المنتجات الخاصة، متابعة الطلبات، إدارة المستودعات، والوصول للتقارير المطبقة متجرك",
    permissions: ["sell_products", "manage_warehouses", "view_reports", "custom_branding"],
  },
  {
    id: "role-seller-standard",
    name: "تاجر عادي (Standard Seller)",
    description: "صلاحيات رفع منتجات أساسية وإدارة الطلبات",
    permissions: ["sell_products", "view_reports_basic"],
  },
];

const INITIAL_VISITORS: Visitor[] = [];

const INITIAL_SELLERS: Seller[] = [
  {
    id: "seller-habiba",
    storeName: "متجر حبيبة المميز",
    ownerName: "حبيبة علي",
    email: "demo-seller-1@beitak.eg",
    phone: "01000000000",
    status: "approved",
    registeredAt: "2026-07-19T03:33:21Z",
    planId: "plan-lifetime-pro",
    planExpiresAt: "2099-12-31T23:59:59Z",
    warehouses: ["warehouse-main"],
    permissions: ["sell_products", "manage_warehouses", "view_reports"],
    aiCredits: 999999,
    sellerType: "merchant",
  },
  {
    id: "seller-habiba-alt",
    storeName: "متجر الفريدة للأثاث",
    ownerName: "متجر تجريبي",
    email: "demo-seller-2@beitak.eg",
    phone: "01000000001",
    status: "approved",
    registeredAt: "2026-07-19T03:33:21Z",
    planId: "plan-lifetime-pro",
    planExpiresAt: "2099-12-31T23:59:59Z",
    warehouses: ["warehouse-main"],
    permissions: ["sell_products", "manage_warehouses", "view_reports"],
    aiCredits: 999999,
    sellerType: "merchant",
  },
];

const INITIAL_WAREHOUSES: Warehouse[] = [
  {
    id: "warehouse-main",
    name: "مستودع القاهرة الرئيسي",
    location: "المنطقة الصناعية، العبور",
    capacity: 5000,
  },
  { id: "warehouse-alex", name: "مخزن الإسكندرية", location: "المرجحة، العامرية", capacity: 2000 },
  {
    id: "warehouse-damietta",
    name: "مستودع دمياط للأخشاب",
    location: "شطا، دمياط",
    capacity: 10000,
  },
];

const INITIAL_COUPONS: Coupon[] = [
  {
    code: "BEITAK10",
    discount: 10,
    type: "percent",
    expiresAt: "2026-12-31T23:59:59Z",
    isEnabled: true,
  },
  {
    code: "GOLD500",
    discount: 500,
    type: "fixed",
    expiresAt: "2026-08-31T23:59:59Z",
    isEnabled: true,
  },
];

const INITIAL_COMMISSIONS: CommissionRule[] = [
  { id: "comm-1", category: "أجهزة كهربائية", percentage: 5, fixedFee: 50 },
  { id: "comm-2", category: "سيارات", percentage: 2.5, fixedFee: 500 },
  { id: "comm-3", category: "عقارات", percentage: 1.5, fixedFee: 1000 },
  { id: "comm-default", category: "افتراضي", percentage: 8, fixedFee: 20 },
];

export class MarketplaceStore {
  static getCurrentUserId(): string | null {
    if (typeof window === "undefined") return null;
    try {
      const stored = localStorage.getItem("virtual_session");
      if (stored) {
        const parsed = JSON.parse(stored);
        const id = parsed?.user?.id || parsed?.user?.email;
        if (id) return id.toLowerCase().replace(/[^a-z0-9_-]/g, "_");
      }
    } catch (e) {
      console.warn("Failed to retrieve current user ID from session", e);
    }
    return null;
  }

  static getUserScopedKey(baseKey: string, userId?: string): string {
    const uid = userId
      ? userId.toLowerCase().replace(/[^a-z0-9_-]/g, "_")
      : this.getCurrentUserId();
    return uid ? `${baseKey}_usr_${uid}` : `${baseKey}_guest`;
  }

  // Visitors
  static getVisitors(): Visitor[] {
    return getStored<Visitor[]>("visitors", INITIAL_VISITORS);
  }
  static saveVisitors(list: Visitor[]) {
    setStored("visitors", list);
  }

  // Sellers
  static getSellers(): Seller[] {
    return getStored<Seller[]>("sellers", INITIAL_SELLERS);
  }
  static saveSellers(list: Seller[]) {
    setStored("sellers", list);
  }

  // Subscription Plans
  static getPlans(): SubscriptionPlan[] {
    return getStored<SubscriptionPlan[]>("plans", INITIAL_PLANS);
  }
  static savePlans(list: SubscriptionPlan[]) {
    setStored("plans", list);
  }

  // Roles
  static getRoles(): DynamicRole[] {
    return getStored<DynamicRole[]>("roles", INITIAL_ROLES);
  }
  static saveRoles(list: DynamicRole[]) {
    setStored("roles", list);
  }

  // Warehouses
  static getWarehouses(): Warehouse[] {
    return getStored<Warehouse[]>("warehouses", INITIAL_WAREHOUSES);
  }
  static saveWarehouses(list: Warehouse[]) {
    setStored("warehouses", list);
  }

  // Coupons
  static getCoupons(): Coupon[] {
    return getStored<Coupon[]>("coupons", INITIAL_COUPONS);
  }
  static saveCoupons(list: Coupon[]) {
    setStored("coupons", list);
  }

  // Commission Rules (Dynamic Category-Based Commissions)
  static getCommissions(): CommissionRule[] {
    const categories = MarketplaceStore.getCategories();
    const stored = getStored<CommissionRule[]>("commissions", []);

    const updated = [...stored];
    let changed = false;

    // Build or sync a commission rule for every category
    categories.forEach((cat) => {
      const existing = updated.find((c) => c.category === cat.name || c.id === `comm-${cat.id}`);
      if (!existing) {
        updated.push({
          id: `comm-${cat.id}`,
          category: cat.name,
          percentage: 10, // Default 10% for newly added categories
          fixedFee: 0,
        });
        changed = true;
      }
    });

    if (changed) {
      setStored("commissions", updated);
    }

    return updated;
  }
  static saveCommissions(list: CommissionRule[]) {
    setStored("commissions", list);
    window.dispatchEvent(new Event("beitak-commissions-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // Multi-image, Custom specifications & variant metadata mapped by product ID
  static getProductMetadata(productId: string): ProductMetadata {
    const list = getStored<Record<string, ProductMetadata>>("product_metadata", {});
    if (list[productId]) return list[productId];

    // Build standard structure if missing
    return {
      productId,
      brand: "غير محدد",
      collection: "أثاث منزلي",
      customFields: [],
      specifications: [
        { name: "الضمان", value: "3 سنوات" },
        { name: "بلد المنشأ", value: "مصر" },
        { name: "الخامة الرئيسية", value: "خشب زان طبيعي" },
      ],
      variants: [
        {
          id: `var-${productId}-1`,
          sku: `SKU-${productId}-BR`,
          price: 0,
          stock: 12,
          attributes: { اللون: "بني بني", المقاس: "كبير" },
          warehouseId: "warehouse-main",
        },
        {
          id: `var-${productId}-2`,
          sku: `SKU-${productId}-GL`,
          price: 150,
          stock: 5,
          attributes: { اللون: "ذهبي", المقاس: "كبير" },
          warehouseId: "warehouse-alex",
        },
      ],
      images: [],
      warehouseStocks: { "warehouse-main": 12, "warehouse-alex": 5 },
    };
  }

  static saveProductMetadata(productId: string, meta: ProductMetadata) {
    const list = getStored<Record<string, ProductMetadata>>("product_metadata", {});
    list[productId] = meta;
    setStored("product_metadata", list);
    window.dispatchEvent(new Event("beitak-products-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // Custom Product Edits & Local Overrides Persistence
  static getDeletedProductIds(): string[] {
    return getStored<string[]>("deleted_product_ids", []);
  }

  static deleteProduct(productId: string) {
    const list = this.getCustomProducts();
    if (list[productId]) {
      delete list[productId];
      setStored("custom_products", list);
    }
    const deleted = this.getDeletedProductIds();
    if (!deleted.includes(productId)) {
      deleted.push(productId);
      setStored("deleted_product_ids", deleted);
    }
    window.dispatchEvent(
      new CustomEvent("beitak-products-updated", { detail: { action: "delete", id: productId } }),
    );
    window.dispatchEvent(new Event("storage"));
  }

  static filterDeletedProducts<T extends { id: string }>(productsList: T[]): T[] {
    const deletedSet = new Set(this.getDeletedProductIds());
    return productsList.filter((p) => p && !deletedSet.has(p.id));
  }

  static async getProducts(): Promise<Product[]> {
    let rawProducts: Product[] = [];
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) rawProducts = data as unknown as Product[];
    } catch {
      // fallback
    }

    const customMap = this.getCustomProducts();
    const existingIds = new Set(rawProducts.map((p) => p.id));

    // Merge custom product edits
    const updatedList = rawProducts.map((p) => {
      if (customMap[p.id]) {
        return { ...p, ...customMap[p.id] };
      }
      return p;
    });

    // Add locally created custom products if not in Supabase list
    Object.keys(customMap).forEach((id) => {
      if (!existingIds.has(id)) {
        updatedList.unshift({
          id,
          name: "منتج جديد",
          price: 100,
          in_stock: true,
          created_at: new Date().toISOString(),
          ...customMap[id],
        } as Product);
      }
    });

    return this.filterDeletedProducts(updatedList);
  }

  static getCustomProducts(): Record<string, Partial<Product>> {
    const custom = getStored<Record<string, Partial<Product>>>("custom_products", {});
    const deletedSet = new Set(this.getDeletedProductIds());
    const cleaned: Record<string, Partial<Product>> = {};
    Object.keys(custom).forEach((id) => {
      if (!deletedSet.has(id)) {
        cleaned[id] = custom[id];
      }
    });
    return cleaned;
  }

  static saveCustomProduct(productId: string, productData: Partial<Product>) {
    const list = this.getCustomProducts();
    list[productId] = { ...(list[productId] || {}), ...productData };
    setStored("custom_products", list);

    // Un-delete if previously marked as deleted
    const deleted = this.getDeletedProductIds().filter((id) => id !== productId);
    setStored("deleted_product_ids", deleted);

    window.dispatchEvent(
      new CustomEvent("beitak-products-updated", { detail: { action: "save", id: productId } }),
    );
    window.dispatchEvent(new Event("storage"));
  }

  // Helper: Active user session simulation (Super Admin, Seller, etc.)
  static getSimulationRole(): "super_admin" | "seller" | "customer" | "visitor" {
    return getStored<"super_admin" | "seller" | "customer" | "visitor">(
      "simulation_role",
      "visitor",
    );
  }
  static setSimulationRole(role: "super_admin" | "seller" | "customer" | "visitor") {
    setStored("simulation_role", role);
  }

  // Helper: Current simulated seller ID
  static getSimulatedSellerId(): string {
    return getStored<string>("simulation_seller_id", "seller-1");
  }
  static setSimulatedSellerId(id: string) {
    setStored("simulation_seller_id", id);
  }

  // Women Lounge Settings
  static getWomenLoungeSettings(): WomenLoungeSettings {
    return getStored<WomenLoungeSettings>("women_lounge_settings", DEFAULT_WOMEN_LOUNGE_SETTINGS);
  }
  static saveWomenLoungeSettings(settings: WomenLoungeSettings) {
    setStored("women_lounge_settings", settings);
  }

  // Real Reviews Store (No fake data)
  static getReviews(productId: string): ProductReview[] {
    const all = getStored<Record<string, ProductReview[]>>("product_reviews", {});
    return all[productId] || [];
  }

  static addReview(
    productId: string,
    review: { user_name: string; rating: number; comment: string; product_id: string },
  ) {
    const all = getStored<Record<string, ProductReview[]>>("product_reviews", {});
    const list = all[productId] || [];
    const newRev: ProductReview = {
      id: `rev-${Date.now()}`,
      product_id: productId,
      user_name: review.user_name || "عميلة بيتك",
      rating: review.rating,
      comment: review.comment,
      created_at: "الآن",
    };
    all[productId] = [newRev, ...list];
    setStored("product_reviews", all);
    return newRev;
  }

  // Site Theme & Visual Customizations
  static getDefaultThemeSettings(): WebsiteThemeSettings {
    return DEFAULT_THEME_SETTINGS;
  }
  static getDeletedCustomSectionIds(): string[] {
    return getStored<string[]>("deleted_custom_section_ids", ["sec-default-1"]);
  }
  static deleteCustomLiveSection(sectionId: string) {
    const rawId = sectionId.replace(/^live_/, "");
    const deleted = MarketplaceStore.getDeletedCustomSectionIds();
    if (!deleted.includes(rawId)) {
      deleted.push(rawId);
      setStored("deleted_custom_section_ids", deleted);
    }

    const settings = MarketplaceStore.getSiteThemeSettings();
    if (settings.customLiveSections) {
      settings.customLiveSections = settings.customLiveSections.filter(
        (s) => s.id !== rawId && s.id !== sectionId,
      );
      MarketplaceStore.saveSiteThemeSettings(settings);
    }

    const edits = MarketplaceStore.getLiveCmsEdits();
    edits[rawId] = "__DELETED__";
    edits[sectionId] = "__DELETED__";
    edits[`live_${rawId}`] = "__DELETED__";
    MarketplaceStore.saveLiveCmsEdits(edits);

    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("beitak-theme-updated"));
      window.dispatchEvent(new Event("beitak-live-cms-updated"));
    }
  }
  static getSiteThemeSettings(): WebsiteThemeSettings {
    const settings = getStored<WebsiteThemeSettings>("site_theme_settings", DEFAULT_THEME_SETTINGS);
    const deletedIds = MarketplaceStore?.getDeletedCustomSectionIds
      ? MarketplaceStore.getDeletedCustomSectionIds()
      : ["sec-default-1"];
    const edits = MarketplaceStore?.getLiveCmsEdits ? MarketplaceStore.getLiveCmsEdits() : {};

    if (!settings.customLiveSections) {
      settings.customLiveSections = DEFAULT_THEME_SETTINGS.customLiveSections || [];
    }

    if (settings.customLiveSections) {
      settings.customLiveSections = settings.customLiveSections.filter(
        (s) =>
          !deletedIds.includes(s.id) &&
          !deletedIds.includes(`sec-${s.id}`) &&
          edits[s.id] !== "__DELETED__" &&
          edits[`live_${s.id}`] !== "__DELETED__",
      );
    }
    return settings;
  }
  static saveSiteThemeSettings(settings: WebsiteThemeSettings) {
    setStored("site_theme_settings", settings);
  }

  // Seller Terms & Conditions Management (Managed by Super Admin)
  static getSellerTerms(): Array<{
    id: string;
    title: string;
    content: string;
    isRequired: boolean;
  }> {
    return getStored("seller_terms_conditions", [
      {
        id: "term-1",
        title: "الالتزام بجودة المنتجات وصحة البيانات",
        content:
          "يتعهد البائع بأن جميع المنتجات المعروضة مطابقة تماماً للوصف والصور والألوان والمقاسات المدخلة، وتحت مسؤوليته المباشرة.",
        isRequired: true,
      },
      {
        id: "term-2",
        title: "احترام سياسة الشحن والتسليم للمحافظات",
        content:
          "يتعهد البائع بالشحن فقط للمحافظات المحددة من قبله والتسليم في المواعيد المعلنة مع تقديم خيار المعاينة والفحص عند الدفع عند الاستلام.",
        isRequired: true,
      },
      {
        id: "term-3",
        title: "العمولات ورسوم المنصة",
        content:
          "الموافقة على خصم نسبة عمولة المبيعات المقررة لكل تصنيف وحساب المديونيات وتسويتها بشكل دوري.",
        isRequired: true,
      },
      {
        id: "term-4",
        title: "الخصوصية وقوانين قسم النساء",
        content:
          "عند إضافة منتجات تندرج تحت قسم النساء، يتعهد البائع بالالتزام بالتعليمات والخصوصية التامة الخاصة بالقسم.",
        isRequired: true,
      },
    ]);
  }

  static saveSellerTerms(
    terms: Array<{ id: string; title: string; content: string; isRequired: boolean }>,
  ) {
    setStored("seller_terms_conditions", terms);
  }

  // Category Requests Management
  static getCategoryRequests(): Array<{
    id: string;
    sellerId: string;
    sellerName: string;
    categoryName: string;
    description: string;
    targetSection: "general" | "women";
    status: "pending" | "approved" | "rejected";
    createdAt: string;
  }> {
    return getStored("category_requests", []);
  }

  // General Seller Requests System (Category, Payment Method, Company Verification)
  static getSellerRequests(): SellerRequest[] {
    return getStored<SellerRequest[]>("seller_general_requests", []);
  }

  static addSellerRequest(req: {
    sellerId: string;
    sellerName: string;
    requestType: "category" | "payment_method" | "company_verification";
    title: string;
    details: string;
    targetSection?: "general" | "women";
  }): SellerRequest {
    const list = MarketplaceStore.getSellerRequests();
    const newReq: SellerRequest = {
      id: `s-req-${Date.now()}`,
      sellerId: req.sellerId,
      sellerName: req.sellerName,
      requestType: req.requestType,
      title: req.title,
      details: req.details,
      targetSection: req.targetSection || "general",
      status: "pending",
      createdAt: new Date().toLocaleDateString("ar-EG"),
    };
    setStored("seller_general_requests", [newReq, ...list]);
    window.dispatchEvent(new Event("beitak-seller-requests-updated"));
    return newReq;
  }

  static updateSellerRequestStatus(id: string, status: "approved" | "rejected") {
    const list = MarketplaceStore.getSellerRequests();
    const updated = list.map((r) => (r.id === id ? { ...r, status } : r));
    setStored("seller_general_requests", updated);

    // If request was company verification, update seller status to verified company
    const targetReq = list.find((r) => r.id === id);
    if (targetReq && targetReq.requestType === "company_verification" && status === "approved") {
      const sellers = MarketplaceStore.getSellers();
      const updatedSellers = sellers.map((s) => {
        if (s.id === targetReq.sellerId) {
          return {
            ...s,
            sellerType: "factory" as const,
            isVerifiedCompany: true,
          };
        }
        return s;
      });
      MarketplaceStore.saveSellers(updatedSellers);
    }

    window.dispatchEvent(new Event("beitak-seller-requests-updated"));
  }

  // User Delivery Governorate Filter
  static getUserGovernorate(userId?: string): string {
    return getStored(this.getUserScopedKey("user_delivery_governorate", userId), "جميع المحافظات");
  }

  static setUserGovernorate(gov: string, userId?: string) {
    setStored(this.getUserScopedKey("user_delivery_governorate", userId), gov);
  }

  // User Gender Management (male / female / unknown)
  static getUserGender(userId?: string): "male" | "female" | "unknown" {
    return getStored(this.getUserScopedKey("user_gender", userId), "unknown");
  }

  static setUserGender(gender: "male" | "female", userId?: string) {
    setStored(this.getUserScopedKey("user_gender", userId), gender);
    window.dispatchEvent(new CustomEvent("beitak-gender-updated", { detail: { gender } }));
    window.dispatchEvent(new Event("storage"));
  }

  // Women's Section Publishing Rules for Sellers
  static getWomenPublishingRules(): Array<{
    id: string;
    title: string;
    content: string;
    order: number;
  }> {
    return getStored("women_publishing_rules", [
      {
        id: "w-rule-1",
        title: "الالتزام بالخصوصية النسائية التامة",
        content:
          "يجب ألا تحتوي المنتجات المعروضة في قسم النساء على أي صور غير لائقة أو خاضعة لحقوق انتهاك الخصوصية.",
        order: 1,
      },
      {
        id: "w-rule-2",
        title: "دقة الأوصاف والمقاسات والألوان",
        content:
          "يجب تقديم معلومات دقيقة وصحيحة 100% عن الأزياء، العبايات، ومستحضرات التجميل المضافة بدون أي تدليس.",
        order: 2,
      },
      {
        id: "w-rule-3",
        title: "الضمان وتجربة العميلات",
        content:
          "التعهد بتقديم معاينة قبل الاستلام وإمكانية الإرجاع والاستبدال للمنتجات المعيبة وفق السياسة العامة للمتجر.",
        order: 3,
      },
    ]);
  }

  static saveWomenPublishingRules(
    rules: Array<{ id: string; title: string; content: string; order: number }>,
  ) {
    setStored("women_publishing_rules", rules);
  }

  // Live CMS Edits (Super Admin Live Edit Mode overrides)
  static getLiveCmsEdits(): Record<string, string> {
    return getStored("live_cms_edits", {});
  }

  static saveLiveCmsEdits(edits: Record<string, string>) {
    setStored("live_cms_edits", edits);
    window.dispatchEvent(new Event("beitak-live-cms-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // Navigation CMS Items
  static getNavCmsItems(): Array<{
    id: string;
    title: string;
    icon: string;
    order: number;
    visibility: "all" | "sellers" | "buyers" | "superadmin";
    visible: boolean;
    pages: Array<{
      id: string;
      title: string;
      content: string;
      subSections?: Array<{ title: string; body: string }>;
    }>;
  }> {
    return getStored("nav_cms_items", [
      {
        id: "nav-categories",
        title: "الأقسام",
        icon: "Layers",
        order: 1,
        visibility: "all",
        visible: true,
        pages: [],
      },
      {
        id: "nav-gov",
        title: "المحافظة",
        icon: "MapPin",
        order: 2,
        visibility: "all",
        visible: true,
        pages: [],
      },
      {
        id: "nav-contact",
        title: "تواصل معنا",
        icon: "MessageSquare",
        order: 3,
        visibility: "all",
        visible: true,
        pages: [],
      },
      {
        id: "nav-seller-guide",
        title: "المركز التعليمي",
        icon: "BookOpen",
        order: 4,
        visibility: "sellers",
        visible: true,
        pages: [],
      },
    ]);
  }

  static saveNavCmsItems(items: unknown[]) {
    setStored("nav_cms_items", items);
    window.dispatchEvent(new Event("beitak-nav-cms-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // Seller Tutorials Management
  static getTutorials(): Array<{
    id: string;
    title: string;
    category: string;
    content: string;
    videoUrl?: string;
    order: number;
  }> {
    return getStored("seller_tutorials", [
      {
        id: "tut-1",
        title: "كيفية إضافة منتج جديد وتنسيق الألوان والمقاسات",
        category: "المنتجات والصور",
        content:
          "قم بالدخول إلى لوحة بائعك -> إضافة منتج -> اختر القسم المناسب، ثم ارفع الصور عالية الجودة وحدد الخيارات المتاحة كالألوان والأحجام وأسعار الشحن للمحافظات.",
        order: 1,
      },
      {
        id: "tut-2",
        title: "إدارة أسعار الشحن والتوصيل للمحافظات",
        category: "الشحن والتوصيل",
        content:
          "يمكنك تحديد المحافظات التي تضمن شحن وتوصيل منتجاتك إليها مع تحديد تكلفة الشحن لكل منطقة لمساعدة المشترين في إكمال طلباتهم بسهولة.",
        order: 2,
      },
      {
        id: "tut-3",
        title: "ربط رقم الواتساب واستقبال إشعارات الطلبات الفورية",
        category: "المبيعات والعملاء",
        content:
          "أدخل رقم واتساب الصحيح ورقم الهاتف الأساسي في إعدادات متجرك لتسهيل التواصل المباشر مع الزبائن ومعالجة الطلبات في الوقت المحدد.",
        order: 3,
      },
    ]);
  }

  static saveTutorials(tutorials: unknown[]) {
    setStored("seller_tutorials", tutorials);
    window.dispatchEvent(new Event("beitak-tutorials-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // CMS Tutorials Management
  static getTutorialsCms(): Array<{
    id: string;
    title: string;
    target: "sellers" | "buyers" | "everyone";
    published: boolean;
    order: number;
    summary: string;
    steps: string[];
  }> {
    return getStored("tutorials_cms", [
      {
        id: "tut-1",
        title: "كيفية إضافة منتج جديد وتنسيق الألوان والمقاسات",
        target: "sellers",
        published: true,
        order: 1,
        summary:
          "دليل عملي للبائعين لإضافة الصور المتعددة والتركيبات بين الألوان والمقاسات وشحن المحافظات.",
        steps: [
          "افتح صفحة المنتجات واضغط على زر إضافة منتج جديد.",
          "ادخل الاسم والوصف والصور بدقة.",
          "حدد الألوان المتاحة واربط كل لون بصورته المخصصة.",
          "اختر المحافظات التي تضمن شحن وتوصيل المنتج إليها.",
        ],
      },
      {
        id: "tut-2",
        title: "دليل المشتري للتسوق والطلب الآمن",
        target: "buyers",
        published: true,
        order: 2,
        summary:
          "خطوات بسيطة لتحديد محافظتك، معاينة الصور بملء الشاشة، واختيار الألوان والمقاسات المطلوبة.",
        steps: [
          "حدد محافظتك من زر المحافظة بأعلى الموقع لعرض المنتجات القابلة للتوصيل إليك فقط.",
          "تصفح الصور بملء الشاشة واستخدم خاصية التكبير.",
          "اختر اللون والمقاس المناسب، ثم اضغط إضافة للسلة وأكمل الطلب.",
        ],
      },
    ]);
  }

  static saveTutorialsCms(tutorials: unknown[]) {
    setStored("tutorials_cms", tutorials);
    window.dispatchEvent(new Event("beitak-tutorials-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // ==========================================
  // 1. Hierarchical Category System
  // ==========================================
  static getCategories(): CategoryNode[] {
    const fallback: CategoryNode[] = [
      // Men
      {
        id: "cat-men",
        name: "ملابس رجالي",
        slug: "men",
        parentId: null,
        icon: "Shirt",
        sortOrder: 1,
      },
      {
        id: "cat-men-tshirts",
        name: "تيشرتات",
        slug: "men-tshirts",
        parentId: "cat-men",
        icon: "Shirt",
        sortOrder: 1,
      },
      {
        id: "cat-men-pants",
        name: "بنطلونات",
        slug: "men-pants",
        parentId: "cat-men",
        icon: "Shirt",
        sortOrder: 2,
      },
      {
        id: "cat-men-outerwear",
        name: "ملابس خارجية",
        slug: "men-outerwear",
        parentId: "cat-men",
        icon: "Shirt",
        sortOrder: 3,
      },
      {
        id: "cat-men-homewear",
        name: "ملابس منزلية",
        slug: "men-homewear",
        parentId: "cat-men",
        icon: "Shirt",
        sortOrder: 4,
      },
      {
        id: "cat-men-shoes",
        name: "أحذية رجالي",
        slug: "men-shoes",
        parentId: "cat-men",
        icon: "Footprints",
        sortOrder: 5,
      },
      {
        id: "cat-men-accessories",
        name: "إكسسوارات رجالي",
        slug: "men-accessories",
        parentId: "cat-men",
        icon: "Watch",
        sortOrder: 6,
      },
      {
        id: "cat-men-watches",
        name: "ساعات",
        slug: "watches",
        parentId: "cat-men-accessories",
        icon: "Watch",
        sortOrder: 1,
      },
      {
        id: "cat-men-wallets",
        name: "محافظ",
        slug: "wallets",
        parentId: "cat-men-accessories",
        icon: "Briefcase",
        sortOrder: 2,
      },
      {
        id: "cat-men-belts",
        name: "أحزمة",
        slug: "belts",
        parentId: "cat-men-accessories",
        icon: "Shield",
        sortOrder: 3,
      },
      {
        id: "cat-men-sunglasses",
        name: "نظارات شمسية",
        slug: "sunglasses",
        parentId: "cat-men-accessories",
        icon: "Sparkles",
        sortOrder: 4,
      },

      // Women
      {
        id: "cat-women",
        name: "ملابس واحتياجات نسائية",
        slug: "women",
        parentId: null,
        icon: "Sparkles",
        sortOrder: 2,
      },
      {
        id: "cat-women-dresses",
        name: "فساتين",
        slug: "dresses",
        parentId: "cat-women",
        icon: "Shirt",
        sortOrder: 1,
      },
      {
        id: "cat-women-hijabs",
        name: "عبايات وطرح",
        slug: "hijabs",
        parentId: "cat-women",
        icon: "Shirt",
        sortOrder: 2,
      },
      {
        id: "cat-women-homewear",
        name: "ملابس منزلية نسائية",
        slug: "women-homewear",
        parentId: "cat-women",
        icon: "Shirt",
        sortOrder: 3,
      },
      {
        id: "cat-women-outerwear",
        name: "ملابس خارجية نسائية",
        slug: "women-outerwear",
        parentId: "cat-women",
        icon: "Shirt",
        sortOrder: 4,
      },
      {
        id: "cat-women-shoes",
        name: "أحذية نسائية",
        slug: "women-shoes",
        parentId: "cat-women",
        icon: "Footprints",
        sortOrder: 5,
      },
      {
        id: "cat-women-bags",
        name: "حقائب وحقائب يد",
        slug: "women-bags",
        parentId: "cat-women",
        icon: "Briefcase",
        sortOrder: 6,
      },
      {
        id: "cat-women-accessories",
        name: "إكسسوارات ومكياج",
        slug: "women-accessories",
        parentId: "cat-women",
        icon: "Sparkles",
        sortOrder: 7,
      },

      // Children
      {
        id: "cat-children",
        name: "أطفال وبيبي",
        slug: "children",
        parentId: null,
        icon: "Gift",
        sortOrder: 3,
      },
      {
        id: "cat-kids-boys",
        name: "أولاد",
        slug: "boys",
        parentId: "cat-children",
        icon: "Shirt",
        sortOrder: 1,
      },
      {
        id: "cat-kids-girls",
        name: "بنات",
        slug: "girls",
        parentId: "cat-children",
        icon: "Shirt",
        sortOrder: 2,
      },
      {
        id: "cat-kids-baby",
        name: "رضع وبيبي",
        slug: "baby",
        parentId: "cat-children",
        icon: "Heart",
        sortOrder: 3,
      },
      {
        id: "cat-kids-toys",
        name: "ألعاب أطفال",
        slug: "toys",
        parentId: "cat-children",
        icon: "Gamepad2",
        sortOrder: 4,
      },
      {
        id: "cat-kids-shoes",
        name: "أحذية أطفال",
        slug: "kids-shoes",
        parentId: "cat-children",
        icon: "Footprints",
        sortOrder: 5,
      },
      {
        id: "cat-kids-essentials",
        name: "مستلزمات أطفال",
        slug: "baby-essentials",
        parentId: "cat-children",
        icon: "Package",
        sortOrder: 6,
      },

      // Electronics
      {
        id: "cat-electronics",
        name: "إلكترونيات وأجهزة منزلية",
        slug: "electronics",
        parentId: null,
        icon: "Tv",
        sortOrder: 4,
      },
      {
        id: "cat-elec-phones",
        name: "هواتف محمولة",
        slug: "mobile-phones",
        parentId: "cat-electronics",
        icon: "Smartphone",
        sortOrder: 1,
      },
      {
        id: "cat-elec-tablets",
        name: "تابلت",
        slug: "tablets",
        parentId: "cat-electronics",
        icon: "Smartphone",
        sortOrder: 2,
      },
      {
        id: "cat-elec-laptops",
        name: "أجهزة لابتوب",
        slug: "laptops",
        parentId: "cat-electronics",
        icon: "Laptop",
        sortOrder: 3,
      },
      {
        id: "cat-elec-tvs",
        name: "تلفزيونات وشاشات",
        slug: "tvs",
        parentId: "cat-electronics",
        icon: "Tv",
        sortOrder: 4,
      },
      {
        id: "cat-elec-washers",
        name: "غسالات",
        slug: "washing-machines",
        parentId: "cat-electronics",
        icon: "Wrench",
        sortOrder: 5,
      },
      {
        id: "cat-elec-fridges",
        name: "ثلاجات وديب فريزر",
        slug: "refrigerators",
        parentId: "cat-electronics",
        icon: "Package",
        sortOrder: 6,
      },
      {
        id: "cat-elec-cookers",
        name: "بوتاجازات وأفران",
        slug: "cookers",
        parentId: "cat-electronics",
        icon: "Flame",
        sortOrder: 7,
      },
      {
        id: "cat-elec-ac",
        name: "تكييفات ومراوح",
        slug: "air-conditioners",
        parentId: "cat-electronics",
        icon: "Sparkles",
        sortOrder: 8,
      },
      {
        id: "cat-elec-appliances",
        name: "أجهزة منزلية صغيرة",
        slug: "home-appliances",
        parentId: "cat-electronics",
        icon: "Coffee",
        sortOrder: 9,
      },
      {
        id: "cat-elec-accessories",
        name: "إكسسوارات إلكترونية",
        slug: "electronic-accessories",
        parentId: "cat-electronics",
        icon: "Wrench",
        sortOrder: 10,
      },

      // Home & Furniture
      {
        id: "cat-home",
        name: "أثاث وديكور منزلي",
        slug: "home-furniture",
        parentId: null,
        icon: "Sofa",
        sortOrder: 5,
      },
      {
        id: "cat-home-furniture",
        name: "أثاث غرف نوم ومعيشة",
        slug: "furniture",
        parentId: "cat-home",
        icon: "Bed",
        sortOrder: 1,
      },
      {
        id: "cat-home-decor",
        name: "ديكورات ومجسمات",
        slug: "decorations",
        parentId: "cat-home",
        icon: "Sparkles",
        sortOrder: 2,
      },
      {
        id: "cat-home-carpets",
        name: "سجاد ومفارش",
        slug: "carpets",
        parentId: "cat-home",
        icon: "Layers",
        sortOrder: 3,
      },
      {
        id: "cat-home-curtains",
        name: "ستائر ومفروشات",
        slug: "curtains",
        parentId: "cat-home",
        icon: "Package",
        sortOrder: 4,
      },
      {
        id: "cat-home-kitchen",
        name: "مستلزمات مطبخ",
        slug: "kitchen",
        parentId: "cat-home",
        icon: "UtensilsCrossed",
        sortOrder: 5,
      },
      {
        id: "cat-home-lighting",
        name: "إضاءة ونجف",
        slug: "lighting",
        parentId: "cat-home",
        icon: "Lightbulb",
        sortOrder: 6,
      },
      {
        id: "cat-home-essentials",
        name: "مستلزمات منزلية",
        slug: "home-essentials",
        parentId: "cat-home",
        icon: "Home",
        sortOrder: 7,
      },
    ];
    const stored = getStored<CategoryNode[]>("nested_categories", fallback);
    const deletedIds = new Set(getStored<string[]>("deleted_category_ids", []));
    const deletedNames = new Set(getStored<string[]>("deleted_category_names", []));

    return stored.filter((c) => !deletedIds.has(c.id) && !deletedNames.has(c.name));
  }

  static filterDeletedCategories<T extends { id?: string; name?: string }>(categories: T[]): T[] {
    const deletedIds = new Set(getStored<string[]>("deleted_category_ids", []));
    const deletedNames = new Set(getStored<string[]>("deleted_category_names", []));
    return categories.filter((c) => {
      if (c.id && deletedIds.has(c.id)) return false;
      if (c.name && deletedNames.has(c.name)) return false;
      return true;
    });
  }

  static saveCategories(cats: CategoryNode[]) {
    setStored("nested_categories", cats);
    window.dispatchEvent(new Event("beitak-categories-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  static addCategory(categoryData: Omit<CategoryNode, "id">): CategoryNode {
    const cats = this.getCategories();
    const newCat: CategoryNode = {
      ...categoryData,
      id: "cat-" + Date.now(),
      slug: categoryData.slug || categoryData.name.toLowerCase().replace(/\s+/g, "-"),
    };

    // Remove from deleted names/ids if previously deleted
    const deletedIds = getStored<string[]>("deleted_category_ids", []).filter(
      (id) => id !== newCat.id,
    );
    const deletedNames = getStored<string[]>("deleted_category_names", []).filter(
      (n) => n !== newCat.name,
    );
    setStored("deleted_category_ids", deletedIds);
    setStored("deleted_category_names", deletedNames);

    cats.push(newCat);
    this.saveCategories(cats);

    // Sync to Supabase categories table if connected
    supabase
      .from("categories")
      .insert({
        id: newCat.id,
        name: newCat.name,
        slug: newCat.slug,
        parent_id: newCat.parentId || null,
        icon: newCat.icon || "Folder",
        sort_order: newCat.sortOrder || 100,
      })
      .then(() => {})
      .catch(() => {});

    return newCat;
  }

  static updateCategory(id: string, updates: Partial<CategoryNode>) {
    const cats = this.getCategories();
    const idx = cats.findIndex((c) => c.id === id);
    if (idx !== -1) {
      cats[idx] = { ...cats[idx], ...updates };
      this.saveCategories(cats);

      if (updates.name || updates.parentId !== undefined) {
        supabase
          .from("categories")
          .update({
            name: updates.name,
            parent_id: updates.parentId || null,
            icon: updates.icon,
          })
          .eq("id", id)
          .then(() => {})
          .catch(() => {});
      }
    }
  }

  static deleteCategory(id: string) {
    const cats = this.getCategories();
    const target = cats.find((c) => c.id === id);
    const parentId = target?.parentId || null;

    // Track deleted ID and Name permanently
    const deletedIds = getStored<string[]>("deleted_category_ids", []);
    if (!deletedIds.includes(id)) {
      deletedIds.push(id);
      setStored("deleted_category_ids", deletedIds);
    }

    if (target?.name) {
      const deletedNames = getStored<string[]>("deleted_category_names", []);
      if (!deletedNames.includes(target.name)) {
        deletedNames.push(target.name);
        setStored("deleted_category_names", deletedNames);
      }
    }

    // Reassign children of this category to its parent or null
    const filteredCats = cats
      .map((c) => (c.parentId === id ? { ...c, parentId } : c))
      .filter((c) => c.id !== id);

    this.saveCategories(filteredCats);

    // Delete from Supabase as well
    supabase
      .from("categories")
      .delete()
      .eq("id", id)
      .then(() => {})
      .catch(() => {});
  }

  static mergeCategories(sourceId: string, targetId: string) {
    const cats = this.getCategories();
    const sourceCat = cats.find((c) => c.id === sourceId);
    const targetCat = cats.find((c) => c.id === targetId);

    if (!sourceCat || !targetCat) return;

    // Move child categories of source to target
    const updatedCats = cats
      .map((c) => (c.parentId === sourceId ? { ...c, parentId: targetId } : c))
      .filter((c) => c.id !== sourceId);

    this.saveCategories(updatedCats);

    // Update products assigned to source category name to target category name
    const customProds = this.getCustomProducts();
    Object.keys(customProds).forEach((pid) => {
      if (customProds[pid].category === sourceCat.name) {
        customProds[pid].category = targetCat.name;
      }
    });
    setStored("custom_products", customProds);
  }

  // ==========================================
  // 2. Real Favorites System
  // ==========================================
  static getFavorites(userId?: string): string[] {
    return getStored<string[]>(this.getUserScopedKey("user_favorites", userId), []);
  }

  static toggleFavorite(productId: string, userId?: string): boolean {
    const favs = this.getFavorites(userId);
    const exists = favs.includes(productId);
    let updated: string[];
    if (exists) {
      updated = favs.filter((id) => id !== productId);
    } else {
      updated = [productId, ...favs];
    }
    setStored(this.getUserScopedKey("user_favorites", userId), updated);
    window.dispatchEvent(new Event("beitak-favorites-updated"));
    window.dispatchEvent(new Event("storage"));
    return !exists;
  }

  static isFavorite(productId: string, userId?: string): boolean {
    return this.getFavorites(userId).includes(productId);
  }

  // ==========================================
  // 3. Complete Orders System
  // ==========================================
  static getOrders(userId?: string): StoreOrder[] {
    return getStored<StoreOrder[]>(this.getUserScopedKey("user_orders", userId), []);
  }

  static addOrder(
    order: Omit<StoreOrder, "id" | "orderNumber" | "createdAt" | "statusHistory">,
    userId?: string,
  ): StoreOrder {
    const orders = this.getOrders(userId);
    const newOrd: StoreOrder = {
      ...order,
      id: "ord-" + Date.now(),
      orderNumber: "BTK-" + Math.floor(10000 + Math.random() * 90000),
      createdAt: new Date().toISOString(),
      statusHistory: [
        {
          status: order.status || "pending",
          note: "تم استلام طلبك بنجاح في منصة بيتك وجاري المراجعة",
          timestamp: new Date().toLocaleString("ar-EG"),
        },
      ],
    };
    const updated = [newOrd, ...orders];
    setStored(this.getUserScopedKey("user_orders", userId), updated);

    // Auto-create notification for order
    this.addNotification(
      {
        title: "تم تأكيد طلبك بنجاح 🎉",
        message: `طلبك رقم ${newOrd.orderNumber} بقيمة ${newOrd.totalAmount.toLocaleString()} ج.م قيد المعالجة الآن.`,
        type: "order",
        link: "/profile?tab=orders",
      },
      userId,
    );

    window.dispatchEvent(new Event("beitak-orders-updated"));
    window.dispatchEvent(new Event("storage"));
    return newOrd;
  }

  static updateOrderStatus(
    orderId: string,
    status: StoreOrder["status"],
    note?: string,
    userId?: string,
  ) {
    const orders = this.getOrders(userId);
    const idx = orders.findIndex((o) => o.id === orderId);
    if (idx !== -1) {
      orders[idx].status = status;
      orders[idx].statusHistory.push({
        status,
        note: note || `تم تحديث حالة الطلب إلى: ${status}`,
        timestamp: new Date().toLocaleString("ar-EG"),
      });
      setStored(this.getUserScopedKey("user_orders", userId), orders);

      this.addNotification(
        {
          title: `تحديث حالة الطلب ${orders[idx].orderNumber}`,
          message: note || `تغيرت حالة طلبك إلى ${status}`,
          type: "shipping",
          link: "/profile?tab=orders",
        },
        userId,
      );

      window.dispatchEvent(new Event("beitak-orders-updated"));
      window.dispatchEvent(new Event("storage"));
    }
  }

  // Seller Customer Orders Management
  static getSellerCustomerOrders(sellerId?: string): SellerCustomerOrder[] {
    const list = getStored<SellerCustomerOrder[]>("seller_customer_orders", []);
    if (sellerId) {
      return list.filter((o) => o.sellerId === sellerId);
    }
    return list;
  }

  static addSellerCustomerOrder(order: Omit<SellerCustomerOrder, "id">): SellerCustomerOrder {
    const list = getStored<SellerCustomerOrder[]>("seller_customer_orders", []);
    const newOrder: SellerCustomerOrder = {
      ...order,
      id: "sord-" + Date.now() + "-" + Math.random().toString(36).substring(2, 6),
    };
    const updated = [newOrder, ...list];
    setStored("seller_customer_orders", updated);
    window.dispatchEvent(new Event("beitak-seller-orders-updated"));
    window.dispatchEvent(new Event("storage"));
    return newOrder;
  }

  static updateSellerOrderStatus(orderId: string, status: SellerCustomerOrder["status"]) {
    const list = getStored<SellerCustomerOrder[]>("seller_customer_orders", []);
    const updated = list.map((o) => (o.id === orderId ? { ...o, status } : o));
    setStored("seller_customer_orders", updated);
    window.dispatchEvent(new Event("beitak-seller-orders-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // ==========================================
  // 4. Unified Notification Center (User Isolated)
  // ==========================================
  static getNotifications(userId?: string): SystemNotification[] {
    if (!userId) return [];
    const key = `system_notifications_${userId}`;
    return getStored<SystemNotification[]>(key, [
      {
        id: "notif-1",
        title: "مرحباً بك في منصة بيتك 🏠",
        message: "استمتع بتسوق أحدث قطع الأثاث، الإلكترونيات، والأزياء بأسعار وتخفيضات ممتازة.",
        type: "announcement",
        read: false,
        createdAt: "الآن",
      },
    ]);
  }

  static saveNotifications(notifs: SystemNotification[], userId?: string) {
    if (!userId) return;
    const key = `system_notifications_${userId}`;
    setStored(key, notifs);
    window.dispatchEvent(new Event("beitak-notifications-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  static addNotification(
    notif: Omit<SystemNotification, "id" | "read" | "createdAt">,
    userId?: string,
  ): SystemNotification {
    const list = this.getNotifications(userId);
    const newNotif: SystemNotification = {
      ...notif,
      id: "notif-" + Date.now(),
      read: false,
      createdAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    if (userId) {
      this.saveNotifications([newNotif, ...list], userId);
    }
    return newNotif;
  }

  static markNotificationRead(id: string, userId?: string) {
    const list = this.getNotifications(userId);
    const updated = list.map((n) => (n.id === id ? { ...n, read: true } : n));
    this.saveNotifications(updated, userId);
  }

  static markAllNotificationsRead(userId?: string) {
    const list = this.getNotifications(userId);
    const updated = list.map((n) => ({ ...n, read: true }));
    this.saveNotifications(updated, userId);
  }

  static getUnreadNotificationCount(userId?: string): number {
    return this.getNotifications(userId).filter((n) => !n.read).length;
  }

  // ==========================================
  // 5. Buyer - Seller Messaging System
  // ==========================================
  static getConversations(): DirectConversation[] {
    return getStored<DirectConversation[]>("direct_conversations", [
      {
        id: "conv-101",
        buyerId: "user-current",
        buyerName: "حبيبة علي",
        sellerId: "seller-habiba",
        sellerName: "متجر حبيبة المميز",
        productName: "طقم صالون مذهب فاخر خشب زان",
        lastMessage: "هل المنتج متاح للمعاينة قبل الاستلام بالدقي؟",
        lastMessageAt: "10:15 AM",
        unreadCountBuyer: 0,
        unreadCountSeller: 1,
      },
    ]);
  }

  static getMessages(conversationId: string): DirectMessage[] {
    const all = getStored<Record<string, DirectMessage[]>>("direct_messages", {
      "conv-101": [
        {
          id: "msg-1",
          conversationId: "conv-101",
          senderId: "user-current",
          senderName: "حبيبة علي",
          senderRole: "buyer",
          message: "السلام عليكم، هل المنتج متاح للمعاينة قبل الاستلام بالدقي؟",
          createdAt: "10:15 AM",
        },
        {
          id: "msg-2",
          conversationId: "conv-101",
          senderId: "seller-habiba",
          senderName: "متجر حبيبة المميز",
          senderRole: "seller",
          message:
            "وعليكم السلام! نعم بالتأكيد، الفحص والمعاينة متاحين مع مندوب الشحن قبل دفع المبلغ بالكامل 🌸",
          createdAt: "10:18 AM",
        },
      ],
    });
    return all[conversationId] || [];
  }

  static sendMessage(
    conversationId: string,
    msg: Omit<DirectMessage, "id" | "conversationId" | "createdAt">,
  ): DirectMessage {
    const all = getStored<Record<string, DirectMessage[]>>("direct_messages", {});
    const list = all[conversationId] || [];
    const newMsg: DirectMessage = {
      ...msg,
      id: "msg-" + Date.now(),
      conversationId,
      createdAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
    };
    all[conversationId] = [...list, newMsg];
    setStored("direct_messages", all);

    // Update Conversation summary
    const convs = this.getConversations();
    const idx = convs.findIndex((c) => c.id === conversationId);
    if (idx !== -1) {
      convs[idx].lastMessage = msg.message;
      convs[idx].lastMessageAt = newMsg.createdAt;
      setStored("direct_conversations", convs);
    }

    window.dispatchEvent(new Event("beitak-messages-updated"));
    window.dispatchEvent(new Event("storage"));
    return newMsg;
  }

  static createConversation(
    buyerName: string,
    sellerId: string,
    sellerName: string,
    productName?: string,
  ): string {
    const convs = this.getConversations();
    const existing = convs.find((c) => c.sellerId === sellerId);
    if (existing) return existing.id;

    const newConv: DirectConversation = {
      id: "conv-" + Date.now(),
      buyerId: "user-current",
      buyerName: buyerName || "عميل بيتك",
      sellerId,
      sellerName,
      productName,
      lastMessage: "بدأ المحادثة المباشرة",
      lastMessageAt: new Date().toLocaleTimeString("ar-EG", { hour: "2-digit", minute: "2-digit" }),
      unreadCountBuyer: 0,
      unreadCountSeller: 1,
    };
    setStored("direct_conversations", [newConv, ...convs]);
    return newConv.id;
  }

  // ==========================================
  // 6. Search History Page & System
  // ==========================================
  static getSearchHistory(
    userId?: string,
  ): Array<{ id: string; query: string; timestamp: string }> {
    return getStored(this.getUserScopedKey("user_search_history", userId), []);
  }

  static addSearchQuery(query: string, userId?: string) {
    if (!query || !query.trim()) return;
    const clean = query.trim();
    let history = this.getSearchHistory(userId);
    history = history.filter((h) => h.query.toLowerCase() !== clean.toLowerCase());
    const newEntry = {
      id: "search-" + Date.now(),
      query: clean,
      timestamp: new Date().toLocaleDateString("ar-EG"),
    };
    setStored(
      this.getUserScopedKey("user_search_history", userId),
      [newEntry, ...history].slice(0, 30),
    );
    window.dispatchEvent(new Event("beitak-search-history-updated"));
  }

  static deleteSearchQuery(id: string, userId?: string) {
    const history = this.getSearchHistory(userId).filter((h) => h.id !== id);
    setStored(this.getUserScopedKey("user_search_history", userId), history);
    window.dispatchEvent(new Event("beitak-search-history-updated"));
  }

  static clearSearchHistory(userId?: string) {
    setStored(this.getUserScopedKey("user_search_history", userId), []);
    window.dispatchEvent(new Event("beitak-search-history-updated"));
  }

  // ==========================================
  // 7. Recently Viewed Products
  // ==========================================
  static getRecentlyViewed(userId?: string): string[] {
    return getStored<string[]>(this.getUserScopedKey("recently_viewed_products", userId), []);
  }

  static addRecentlyViewed(productId: string, userId?: string) {
    if (!productId) return;
    let list = this.getRecentlyViewed(userId);
    list = list.filter((id) => id !== productId);
    list = [productId, ...list].slice(0, 20); // Keep last 20
    setStored(this.getUserScopedKey("recently_viewed_products", userId), list);
    window.dispatchEvent(new Event("beitak-recently-viewed-updated"));
  }

  // ==========================================
  // 8. Help Center Management
  // ==========================================
  static getHelpArticles(): HelpArticle[] {
    return getStored<HelpArticle[]>("help_articles", [
      {
        id: "help-1",
        title: "كيفية الشراء والدفع عند الاستلام المعاين",
        category: "الشحن والتوصيل",
        content:
          "تتيح لك منصة بيتك خاصية المعاينة والفحص المباشر للشحنة مع مندوب التوصيل قبل دفع المبلغ نقداً عند الاستلام لجميع المحافظات.",
        published: true,
        order: 1,
        views: 1420,
        updatedAt: "2026-07-20",
      },
      {
        id: "help-2",
        title: "سياسة الإرجاع والاستبدال خلال 14 يوماً",
        category: "الإرجاع والاستبدال",
        content:
          "يمكنك طلب إرجاع أو استبدال أي منتج متضرر أو غير مطابق للمواصفات خلال 14 يوماً من تاريخ التسلّم عبر التواصل المباشر مع الدعم.",
        published: true,
        order: 2,
        views: 980,
        updatedAt: "2026-07-21",
      },
      {
        id: "help-3",
        title: "دليل فتح حساب بائع والانضمام لشركاء بيتك",
        category: "دليل التجار",
        content:
          "خطوات تسجيل متجرك كبائع، رفع المنتجات، إدارة المستودعات، واستخدام استوديو الصور بالذكاء الاصطناعي.",
        published: true,
        order: 3,
        views: 2150,
        updatedAt: "2026-07-22",
      },
    ]);
  }

  static saveHelpArticles(articles: HelpArticle[]) {
    setStored("help_articles", articles);
    window.dispatchEvent(new Event("beitak-help-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  static addHelpArticle(art: Omit<HelpArticle, "id" | "views" | "updatedAt">): HelpArticle {
    const list = this.getHelpArticles();
    const newArt: HelpArticle = {
      ...art,
      id: "help-" + Date.now(),
      views: 0,
      updatedAt: new Date().toLocaleDateString("ar-EG"),
    };
    setStored("help_articles", [newArt, ...list]);
    return newArt;
  }

  static deleteHelpArticle(id: string) {
    const list = this.getHelpArticles().filter((a) => a.id !== id);
    this.saveHelpArticles(list);
  }

  // ==========================================
  // 9. Product Reporting System
  // ==========================================
  static getReports(): ProductReport[] {
    return getStored<ProductReport[]>("product_reports", [
      {
        id: "rep-1",
        productId: "prod-101",
        productName: "غرفة سفرة مودرن",
        reporterName: "أحمد محمود",
        reason: "السعر غير مطابق للواقع",
        comment: "المكتوب 5000 ج.م وعند التواصل يطلب البائع 15000 ج.م",
        status: "pending",
        createdAt: "2026-07-26",
      },
    ]);
  }

  static addReport(report: Omit<ProductReport, "id" | "status" | "createdAt">): ProductReport {
    const list = this.getReports();
    const newRep: ProductReport = {
      ...report,
      id: "rep-" + Date.now(),
      status: "pending",
      createdAt: new Date().toLocaleDateString("ar-EG"),
    };
    setStored("product_reports", [newRep, ...list]);

    // Send notification to admin
    this.addNotification({
      title: "بلاغ جديد عن منتج ⚠️",
      message: `قام ${newRep.reporterName} بالإبلاغ عن منتج "${newRep.productName}" بسبب: ${newRep.reason}`,
      type: "general",
      link: "/admin?tab=reports",
    });

    return newRep;
  }

  static updateReportStatus(id: string, status: ProductReport["status"]) {
    const list = this.getReports();
    const updated = list.map((r) => (r.id === id ? { ...r, status } : r));
    setStored("product_reports", updated);
  }

  // ==========================================
  // 14. Dynamic Homepage Page Builder CMS
  // ==========================================
  static getHomepageSectionsConfig(): HomepageSectionConfig[] {
    return getStored<HomepageSectionConfig[]>("homepage_sections_cms_config", [
      {
        id: "sec-hero",
        type: "hero",
        title: "البنر الرئيسي (Hero)",
        enabled: true,
        order: 1,
        visibility: "everyone",
      },
      {
        id: "sec-trust",
        type: "trust",
        title: "مميزات منصة بيتك",
        enabled: true,
        order: 2,
        visibility: "everyone",
      },
      {
        id: "sec-categories",
        type: "categories",
        title: "تسوق حسب القسم",
        enabled: true,
        order: 3,
        visibility: "everyone",
      },
      {
        id: "sec-deals",
        type: "deals",
        title: "عروض وتخفيضات حصرية 🔥",
        enabled: true,
        order: 4,
        maxProducts: 6,
        visibility: "everyone",
      },
      {
        id: "sec-recommended",
        type: "recommended",
        title: "موصى به لك خصيصاً ✨",
        enabled: true,
        order: 5,
        maxProducts: 8,
        visibility: "everyone",
      },
      {
        id: "sec-best-sellers",
        type: "best_sellers",
        title: "الأكثر مبيعاً 🏆",
        enabled: true,
        order: 6,
        maxProducts: 8,
        visibility: "everyone",
      },
      {
        id: "sec-new-arrivals",
        type: "new_arrivals",
        title: "وصل حديثاً 🆕",
        enabled: true,
        order: 7,
        maxProducts: 8,
        visibility: "everyone",
      },
      {
        id: "sec-recently-viewed",
        type: "recently_viewed",
        title: "منتجات شاهدتها مؤخراً 👁️",
        enabled: true,
        order: 8,
        maxProducts: 6,
        visibility: "everyone",
      },
      {
        id: "sec-stores",
        type: "stores",
        title: "أبرز المتاجر المعتمدة 🏬",
        enabled: true,
        order: 9,
        visibility: "everyone",
      },
    ]);
  }

  static saveHomepageSectionsConfig(sections: HomepageSectionConfig[]) {
    setStored("homepage_sections_cms_config", sections);
    window.dispatchEvent(new Event("beitak-homepage-cms-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // ==========================================
  // 15. Shared Purchase Options Engine & Audit Logs
  // ==========================================
  static getSharedOptionResources(): SharedOptionResource[] {
    return getStored<SharedOptionResource[]>("shared_option_resources", [
      {
        id: "opt-1",
        type: "color",
        typeLabel: "اللون",
        value: "أسود بني فاخر",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-2",
        type: "color",
        typeLabel: "اللون",
        value: "أبيض عاجي",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-3",
        type: "color",
        typeLabel: "اللون",
        value: "رمادي مودرن",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-4",
        type: "size",
        typeLabel: "المقاس",
        value: "صغير (S)",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-5",
        type: "size",
        typeLabel: "المقاس",
        value: "متوسط (M)",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-6",
        type: "size",
        typeLabel: "المقاس",
        value: "كبير (L)",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-7",
        type: "size",
        typeLabel: "المقاس",
        value: "جامبو (XL)",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-8",
        type: "volume",
        typeLabel: "الحجم/السعة",
        value: "500 مل",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-9",
        type: "volume",
        typeLabel: "الحجم/السعة",
        value: "1 لتر",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-10",
        type: "material",
        typeLabel: "المادة/الخامة",
        value: "خشب زان طبيعي",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-11",
        type: "material",
        typeLabel: "المادة/الخامة",
        value: "جلد طبيعي 100%",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-12",
        type: "finish",
        typeLabel: "التشطيب",
        value: "دهان أستر مذهب",
        status: "active",
        createdAt: "2026-07-01",
      },
      {
        id: "opt-13",
        type: "condition",
        typeLabel: "الحالة",
        value: "جديد بالكرتونة",
        status: "active",
        createdAt: "2026-07-01",
      },
    ]);
  }

  static addSharedOptionResource(
    opt: Omit<SharedOptionResource, "id" | "createdAt" | "status">,
  ): SharedOptionResource {
    const list = this.getSharedOptionResources();
    const cleanValue = opt.value.trim();
    const existing = list.find(
      (o) => o.type === opt.type && o.value.toLowerCase() === cleanValue.toLowerCase(),
    );
    if (existing) return existing;

    const newOpt: SharedOptionResource = {
      ...opt,
      id: "opt-" + Date.now(),
      value: cleanValue,
      status: "active",
      createdAt: new Date().toLocaleDateString("ar-EG"),
    };
    setStored("shared_option_resources", [newOpt, ...list]);
    window.dispatchEvent(new Event("beitak-shared-options-updated"));
    window.dispatchEvent(new Event("storage"));
    return newOpt;
  }

  static updateSharedOptionResource(id: string, updates: Partial<SharedOptionResource>) {
    const list = this.getSharedOptionResources();
    const updated = list.map((o) => (o.id === id ? { ...o, ...updates } : o));
    setStored("shared_option_resources", updated);
    window.dispatchEvent(new Event("beitak-shared-options-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  static deleteSharedOptionResource(id: string) {
    const list = this.getSharedOptionResources().filter((o) => o.id !== id);
    setStored("shared_option_resources", list);
    window.dispatchEvent(new Event("beitak-shared-options-updated"));
    window.dispatchEvent(new Event("storage"));
  }

  // Audit Logs
  static getAuditLogs(productId?: string): ProductAuditLog[] {
    const all = getStored<ProductAuditLog[]>("product_audit_logs", [
      {
        id: "log-1",
        productId: "prod-101",
        productName: "طقم صالون مذهب فاخر",
        userId: "seller-habiba",
        userName: "متجر حبيبة",
        userRole: "seller",
        action: "create",
        timestamp: new Date().toLocaleString("ar-EG"),
        details: "تم إنشاء المنتج في المسودات أول مرة",
      },
      {
        id: "log-2",
        productId: "prod-101",
        productName: "طقم صالون مذهب فاخر",
        userId: "seller-habiba",
        userName: "متجر حبيبة",
        userRole: "seller",
        action: "publish",
        timestamp: new Date().toLocaleString("ar-EG"),
        details: "تم إكمال جميع البيانات ونشر المنتج بالماركت بليس",
      },
    ]);
    if (productId) {
      return all.filter((l) => l.productId === productId);
    }
    return all;
  }

  static addAuditLog(log: Omit<ProductAuditLog, "id" | "timestamp">): ProductAuditLog {
    const list = this.getAuditLogs();
    const newLog: ProductAuditLog = {
      ...log,
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString("ar-EG"),
    };
    setStored("product_audit_logs", [newLog, ...list]);
    window.dispatchEvent(new Event("beitak-audit-logs-updated"));
    return newLog;
  }

  // Pre-publishing Validation
  static validateProductForPublish(p: Partial<Product>): { valid: boolean; errors: string[] } {
    const errors: string[] = [];
    if (!p.main_category && !p.category) {
      errors.push("يرجى اختيار القسم الرئيسي للمنتج.");
    }
    if (!p.sub_category) {
      errors.push("يرجى اختيار القسم الفرعي للمنتج.");
    }
    if (!p.name || !p.name.trim()) {
      errors.push("اسم المنتج مطلوب ولا يمكن أن يكون فارغاً.");
    }
    if (!p.description || !p.description.trim()) {
      errors.push("وصف المنتج مطلوب لشرح تفاصيل السلعة للعملاء.");
    }
    if (p.price === undefined || p.price === null || p.price <= 0) {
      errors.push("يرجى إدخال سعر صحيح أكبر من الصفر.");
    }
    const hasImage = !!(p.image_url || (p.images && p.images.length > 0));
    if (!hasImage) {
      errors.push("يجب رفع صورة رئيسية واحدة على الأقل من جهازك.");
    }
    const hasOptions =
      (p.purchase_options && p.purchase_options.length > 0) ||
      (p.colors && p.colors.length > 0) ||
      (p.sizes && p.sizes.length > 0);
    if (!hasOptions) {
      errors.push(
        "خيارات الشراء إلزامية! يجب تحديد خيار واحد على الأقل (مثل اللون، المقاس، الخوبة، الخ).",
      );
    }
    return {
      valid: errors.length === 0,
      errors,
    };
  }
}
