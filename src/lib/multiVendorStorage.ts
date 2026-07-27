import { Product } from "@/routes/admin";
import { safeRandomUUID } from "@/lib/safeId";

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  senderRole: "customer" | "seller" | "super_admin" | "team_member";
  message: string;
  timestamp: string;
  attachments?: string[];
  readBy?: string[];
}

export interface ChatThread {
  id: string;
  title: string;
  type: "customer_to_seller" | "team_channel" | "support";
  sellerId?: string; // Associated seller if applicable
  participants: string[]; // User IDs or emails
  messages: ChatMessage[];
  lastMessageAt: string;
  unreadCount?: number;
}

export interface Team {
  id: string;
  name: string;
  description: string;
  sellerId: string;
  members: Array<{ id: string; name: string; role: string }>;
}

export interface SellerWallet {
  sellerId: string;
  availableBalance: number;
  pendingBalance: number;
  withdrawableBalance: number;
  totalEarnings: number;
  totalWithdrawals: number;
}

export interface WithdrawalRequest {
  id: string;
  sellerId: string;
  storeName: string;
  amount: number;
  method: "vodafone_cash" | "instapay" | "bank_transfer";
  details: string; // Phone number or account number/IBAN
  status: "pending" | "approved" | "rejected";
  createdAt: string;
  withdrawalFee: number;
}

export interface BillingSettings {
  commissionDuePeriodDays: number;
  billingCycle: "monthly" | "weekly" | "custom";
  outstandingBalanceRuleLimit: number;
  commissionRateDefault: number;
  subscriptionPlanPrice: number;
  paymentMethods: string[];
  automaticRemindersEnabled: boolean;
  lateFeePercentage: number;
}

export interface CommissionPayment {
  id: string;
  sellerId: string;
  amount: number;
  paymentMethod: string;
  transactionRef: string;
  paidAt: string;
  status: "pending" | "approved" | "rejected";
  notes?: string;
}

export interface BillingInvoice {
  id: string;
  sellerId: string;
  billingPeriodStart: string;
  billingPeriodEnd: string;
  totalSales: number;
  completedOrdersCount: number;
  commissionOwed: number;
  dueDate: string;
  status: "open" | "paid" | "overdue";
}

export interface ImportedProduct {
  id: string;
  title: string;
  originalUrl?: string;
  source: string; // e.g. "Shopify", "Amazon", "AliExpress", "CSV", "Instagram"
  category: string;
  subcategory?: string;
  furnitureType?: string;
  roomType?: string;
  brand?: string;
  style?: string;
  material?: string;
  color?: string;
  dimensions?: string;
  weight?: string;
  variants?: string[];
  suggestedPrice: number;
  suggestedDiscountPrice?: number;
  estimatedProfitMargin?: number;
  imageUrl: string;
  longDescription?: string;
  seoTitle?: string;
  seoDescription?: string;
  tags?: string[];
  status: "warehouse" | "published" | "archived";
  available_governorates?: string[];
  folder?: string;
  collection?: string;
  label?: string;
  score?: number; // SEO or Quality score
}

// Smart Egyptian Address Data
export interface Governorate {
  id: string;
  nameAr: string;
  nameEn: string;
  shippingFee: number;
  cities: City[];
}

export interface City {
  id: string;
  nameAr: string;
  nameEn: string;
  districts: string[];
}

const EGYPT_ADDRESS_DATA: Governorate[] = [
  {
    id: "cairo",
    nameAr: "القاهرة",
    nameEn: "Cairo",
    shippingFee: 50,
    cities: [
      {
        id: "nasr-city",
        nameAr: "مدينة نصر",
        nameEn: "Nasr City",
        districts: ["المنطقة الأولى", "زهراء مدينة نصر", "الحي السابع", "الحي الثامن"],
      },
      {
        id: "maadi",
        nameAr: "المعادي",
        nameEn: "Maadi",
        districts: ["دجلة", "المعادي القديمة", "زهراء المعادي", "ثكنات المعادي"],
      },
      {
        id: "new-cairo",
        nameAr: "القاهرة الجديدة",
        nameEn: "New Cairo",
        districts: ["التجمع الخامس", "التجمع الأول", "التجمع الثالث", "النرجس", "الياسمين"],
      },
      {
        id: "shobra",
        nameAr: "شبرا",
        nameEn: "Shobra",
        districts: ["شبرا البلد", "الخلفاوي", "روض الفرج"],
      },
    ],
  },
  {
    id: "giza",
    nameAr: "الجيزة",
    nameEn: "Giza",
    shippingFee: 55,
    cities: [
      {
        id: "dokki",
        nameAr: "الدقي",
        nameEn: "Dokki",
        districts: ["ميدان المساحة", "شارع التحرير", "شارع مصدق"],
      },
      {
        id: "mohandessin",
        nameAr: "المهندسين",
        nameEn: "Mohandessin",
        districts: ["جامعة الدول العربية", "ميت عقبة", "شارع السودان"],
      },
      {
        id: "6october",
        nameAr: "6 أكتوبر",
        nameEn: "6th of October",
        districts: ["الحي المتميز", "الحي الأول", "الحي الرابع", "حدائق أكتوبر"],
      },
    ],
  },
  {
    id: "alexandria",
    nameAr: "الإسكندرية",
    nameEn: "Alexandria",
    shippingFee: 60,
    cities: [
      {
        id: "smouha",
        nameAr: "سموحة",
        nameEn: "Smouha",
        districts: ["ش الجلاء", "ميدان فيكتور عمانويل", "عزبة سعد"],
      },
      {
        id: "miami",
        nameAr: "ميامي",
        nameEn: "Miami",
        districts: ["ش خالد بن الوليد", "ش العيسوي", "البحر"],
      },
      {
        id: "gleem",
        nameAr: "جليم",
        nameEn: "Gleem",
        districts: ["ش ابوقير", "مظلوم", "جليم على البحر"],
      },
    ],
  },
  {
    id: "damietta",
    nameAr: "دمياط",
    nameEn: "Damietta",
    shippingFee: 40,
    cities: [
      {
        id: "damietta-city",
        nameAr: "دمياط",
        nameEn: "Damietta City",
        districts: ["شطا", "السيالة", "باب الحرس", "الأعصر"],
      },
      {
        id: "new-damietta",
        nameAr: "دمياط الجديدة",
        nameEn: "New Damietta",
        districts: ["الحي الأول", "الحي الثاني", "الحي المتميز", "منطقة الشاليهات"],
      },
      {
        id: "ras-elbar",
        nameAr: "رأس البر",
        nameEn: "Ras El Bar",
        districts: ["منطقة اللسان", "شارع 101", "شارع النيل"],
      },
    ],
  },
  {
    id: "gharbia",
    nameAr: "الغربية",
    nameEn: "Gharbia",
    shippingFee: 65,
    cities: [
      {
        id: "tanta",
        nameAr: "طنطا",
        nameEn: "Tanta",
        districts: ["ش الاستاد", "ش سعيد", "ش البحر", "سيجر"],
      },
      {
        id: "mahalla",
        nameAr: "المحلة الكبرى",
        nameEn: "El Mahalla",
        districts: ["الجمهورية", "شكري القواتلي", "أبو شاهين"],
      },
    ],
  },
];

const STORAGE_PREFIX = "beitak_mv_ext_";

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
    console.warn("Failed to persist " + key, e);
  }
}

export class MultiVendorStorage {
  // --- Product Ownership ---
  static getProductSeller(productId: string): string {
    const mappings = getStored<Record<string, string>>("product_seller_map", {});
    if (mappings[productId]) return mappings[productId];

    // Assign default seller based on product ID pattern or alternate
    const sellers = ["seller-1", "seller-2"];
    const hash = productId.split("").reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const assigned = sellers[hash % sellers.length];

    this.setProductSeller(productId, assigned);
    return assigned;
  }

  static setProductSeller(productId: string, sellerId: string) {
    const mappings = getStored<Record<string, string>>("product_seller_map", {});
    mappings[productId] = sellerId;
    setStored("product_seller_map", mappings);
  }

  // --- Wallets & Withdrawals ---
  static getWallets(): Record<string, SellerWallet> {
    const defaultWallets: Record<string, SellerWallet> = {
      "seller-1": {
        sellerId: "seller-1",
        availableBalance: 12450,
        pendingBalance: 4200,
        withdrawableBalance: 8500,
        totalEarnings: 28900,
        totalWithdrawals: 16450,
      },
      "seller-2": {
        sellerId: "seller-2",
        availableBalance: 4200,
        pendingBalance: 1800,
        withdrawableBalance: 3200,
        totalEarnings: 9000,
        totalWithdrawals: 4800,
      },
    };
    return getStored<Record<string, SellerWallet>>("wallets", defaultWallets);
  }

  static getWallet(sellerId: string): SellerWallet {
    const wallets = this.getWallets();
    if (!wallets[sellerId]) {
      wallets[sellerId] = {
        sellerId,
        availableBalance: 0,
        pendingBalance: 0,
        withdrawableBalance: 0,
        totalEarnings: 0,
        totalWithdrawals: 0,
      };
      setStored("wallets", wallets);
    }
    return wallets[sellerId];
  }

  static updateWallet(sellerId: string, updates: Partial<SellerWallet>) {
    const wallets = this.getWallets();
    const current = this.getWallet(sellerId);
    wallets[sellerId] = { ...current, ...updates };
    setStored("wallets", wallets);
  }

  // --- Billing & Commissions Management ---
  static getBillingSettings(): BillingSettings {
    const defaultSettings: BillingSettings = {
      commissionDuePeriodDays: 15,
      billingCycle: "monthly",
      outstandingBalanceRuleLimit: 5000,
      commissionRateDefault: 10, // 10%
      subscriptionPlanPrice: 200,
      paymentMethods: [
        "فودافون كاش (Vodafone Cash)",
        "إنستا باي (InstaPay)",
        "تحويل بنكي (Bank Transfer)",
      ],
      automaticRemindersEnabled: true,
      lateFeePercentage: 5,
    };
    return getStored<BillingSettings>("beitak_billing_settings", defaultSettings);
  }

  static saveBillingSettings(settings: BillingSettings) {
    setStored("beitak_billing_settings", settings);
    window.dispatchEvent(new Event("beitak-billing-settings-updated"));
  }

  static getCommissionPayments(): CommissionPayment[] {
    const defaultPayments: CommissionPayment[] = [];
    return getStored<CommissionPayment[]>("beitak_commission_payments", defaultPayments);
  }

  static saveCommissionPayments(payments: CommissionPayment[]) {
    setStored("beitak_commission_payments", payments);
    window.dispatchEvent(new Event("beitak-billing-payments-updated"));
  }

  static addCommissionPayment(payment: Omit<CommissionPayment, "id" | "paidAt" | "status">) {
    const payments = this.getCommissionPayments();
    const newPayment: CommissionPayment = {
      ...payment,
      id: `pay-${safeRandomUUID()}`,
      paidAt: new Date().toISOString(),
      status: "approved",
    };
    payments.unshift(newPayment);
    this.saveCommissionPayments(payments);
  }

  static getBillingInvoices(sellerId?: string): BillingInvoice[] {
    const defaultInvoices: BillingInvoice[] = [];
    const invoices = getStored<BillingInvoice[]>("beitak_billing_invoices", defaultInvoices);
    if (sellerId) {
      return invoices.filter((inv) => inv.sellerId === sellerId);
    }
    return invoices;
  }

  static saveBillingInvoices(invoices: BillingInvoice[]) {
    setStored("beitak_billing_invoices", invoices);
  }

  static getWithdrawalRequests(): WithdrawalRequest[] {
    const defaultWithdrawals: WithdrawalRequest[] = [];
    return getStored<WithdrawalRequest[]>("withdrawals", defaultWithdrawals);
  }

  static saveWithdrawalRequests(list: WithdrawalRequest[]) {
    setStored("withdrawals", list);
  }

  // --- In-App Chat & Teams ---
  static getChatThreads(): ChatThread[] {
    const defaultThreads: ChatThread[] = [];
    return getStored<ChatThread[]>("chat_threads", defaultThreads);
  }

  static saveChatThreads(list: ChatThread[]) {
    setStored("chat_threads", list);
  }

  static getTeams(sellerId: string): Team[] {
    const defaultTeams: Record<string, Team[]> = {};
    const all = getStored<Record<string, Team[]>>("teams", defaultTeams);
    return all[sellerId] || [];
  }

  static saveTeams(sellerId: string, list: Team[]) {
    const all = getStored<Record<string, Team[]>>("teams", {});
    all[sellerId] = list;
    setStored("teams", all);
  }

  // --- Universal Import Center & Warehouse Storage ---
  static getWarehouseProducts(): ImportedProduct[] {
    const defaultImports: ImportedProduct[] = [];
    return getStored<ImportedProduct[]>("warehouse_products", defaultImports);
  }

  static saveWarehouseProducts(list: ImportedProduct[]) {
    setStored("warehouse_products", list);
  }

  // --- Smart Egyptian Address & Governorate Directory ---
  static getEgyptAddressData(): Governorate[] {
    return EGYPT_ADDRESS_DATA;
  }
}
