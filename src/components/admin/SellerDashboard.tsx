import React, { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MultiVendorStorage } from "@/lib/multiVendorStorage";
import { safeRandomUUID } from "@/lib/safeId";
import {
  Building,
  CreditCard,
  Plus,
  Trash2,
  Sliders,
  CheckCircle,
  BarChart3,
  Send,
  ShieldCheck,
  FileText,
  BadgeCheck,
  Clock,
  XCircle,
  AlertCircle,
  HelpCircle,
  ShoppingBag,
  Phone,
  MapPin,
  User,
  ExternalLink,
} from "lucide-react";
import {
  MarketplaceStore,
  Seller,
  SellerRequest,
  ProductMetadata,
  ProductVariant,
  SellerCustomerOrder,
} from "@/lib/marketplaceStore";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";

interface DashboardProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  category: string;
  in_stock: boolean;
  featured: boolean;
  description?: string | null;
}

interface SellerDashboardProps {
  sellerId: string;
  products: DashboardProduct[];
  onOpenAIStudio?: (product: DashboardProduct) => void;
  onOpenBatchEditor?: () => void;
}

interface OrderItem {
  id: string;
  price: number;
  quantity: number;
}

interface OrderRecord {
  id: string;
  total: number;
  status: string;
  items: string | OrderItem[];
}

export function SellerDashboard({ sellerId, products }: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "customer_orders" | "seller_type" | "seller_requests" | "variants"
  >("customer_orders");

  const [customerOrders, setCustomerOrders] = useState<SellerCustomerOrder[]>(() =>
    MarketplaceStore.getSellerCustomerOrders(sellerId),
  );

  const [sellerStats, setSellerStats] = useState({
    monthlySales: 0,
    pendingOrdersCount: 0,
    loading: true,
  });

  const [seller, setSeller] = useState<Seller | null>(null);
  const [requestsList, setRequestsList] = useState<SellerRequest[]>([]);

  // Company verification form
  const [commRegister, setCommRegister] = useState("");
  const [taxCard, setTaxCard] = useState("");

  // New Request form
  const [reqType, setReqType] = useState<"category" | "payment_method">("category");
  const [reqTitle, setReqTitle] = useState("");
  const [reqDetails, setReqDetails] = useState("");
  const [reqSection, setReqSection] = useState<"general" | "women">("general");

  // Variant helper
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productMeta, setProductMeta] = useState<ProductMetadata | null>(null);

  // New variant form
  const [newVarSku, setNewVarSku] = useState("");
  const [newVarPrice, setNewVarPrice] = useState(0);
  const [newVarStock, setNewVarStock] = useState(5);
  const [newVarAttrKey, setNewVarAttrKey] = useState("اللون");
  const [newVarAttrVal, setNewVarAttrVal] = useState("");

  const loadData = useCallback(async () => {
    const list = MarketplaceStore.getSellers();
    const active = list.find((s) => s.id === sellerId) || list[0];
    setSeller(active || null);

    if (active) {
      setCommRegister(active.commercialRegistration || "");
      setTaxCard(active.taxCard || "");
    }

    setRequestsList(MarketplaceStore.getSellerRequests().filter((r) => r.sellerId === sellerId));

    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }

    try {
      const { data } = await supabase.from("orders").select("*");
      if (data) {
        const orderList = (data as unknown as OrderRecord[]).filter((order) => {
          try {
            const itemsArray = (
              typeof order.items === "string" ? JSON.parse(order.items) : order.items
            ) as OrderItem[];
            return itemsArray.some(
              (item: OrderItem) => MultiVendorStorage.getProductSeller(item.id) === sellerId,
            );
          } catch {
            return false;
          }
        });

        let totalSales = 0;
        let pendingCount = 0;

        orderList.forEach((order) => {
          if (order.status !== "cancelled") {
            try {
              const itemsArray = (
                typeof order.items === "string" ? JSON.parse(order.items) : order.items
              ) as OrderItem[];
              itemsArray.forEach((item: OrderItem) => {
                if (MultiVendorStorage.getProductSeller(item.id) === sellerId) {
                  totalSales += (Number(item.price) || 0) * (Number(item.quantity) || 1);
                }
              });
            } catch {
              // ignore parse errors
            }
          }
          if (order.status === "pending" || order.status === "processing") {
            pendingCount++;
          }
        });

        setSellerStats({
          monthlySales: totalSales,
          pendingOrdersCount: pendingCount,
          loading: false,
        });
      } else {
        setSellerStats({ monthlySales: 0, pendingOrdersCount: 0, loading: false });
      }
    } catch {
      setSellerStats({ monthlySales: 0, pendingOrdersCount: 0, loading: false });
    }
  }, [sellerId, products]);

  useEffect(() => {
    loadData();

    const handleReqUpdate = () => {
      setRequestsList(MarketplaceStore.getSellerRequests().filter((r) => r.sellerId === sellerId));
    };

    const handleOrdersUpdate = () => {
      setCustomerOrders(MarketplaceStore.getSellerCustomerOrders(sellerId));
    };

    window.addEventListener("beitak-seller-requests-updated", handleReqUpdate);
    window.addEventListener("beitak-seller-orders-updated", handleOrdersUpdate);
    window.addEventListener("storage", handleOrdersUpdate);
    return () => {
      window.removeEventListener("beitak-seller-requests-updated", handleReqUpdate);
      window.removeEventListener("beitak-seller-orders-updated", handleOrdersUpdate);
      window.removeEventListener("storage", handleOrdersUpdate);
    };
  }, [sellerId, loadData]);

  useEffect(() => {
    if (selectedProductId) {
      setProductMeta(MarketplaceStore.getProductMetadata(selectedProductId));
    }
  }, [selectedProductId]);

  const saveSeller = (updated: Seller) => {
    const list = MarketplaceStore.getSellers();
    const modified = list.map((s) => (s.id === updated.id ? updated : s));
    MarketplaceStore.saveSellers(modified);
    setSeller(updated);
  };

  const handleSubmitCompanyDocs = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    if (!commRegister.trim() || !taxCard.trim()) {
      toast.error("يرجى إدخال رقم السجل التجاري ورقم البطاقة الضريبية");
      return;
    }

    const updatedSeller: Seller = {
      ...seller,
      commercialRegistration: commRegister.trim(),
      taxCard: taxCard.trim(),
      sellerType: "factory",
    };
    saveSeller(updatedSeller);

    // Send request to SuperAdmin for verification
    MarketplaceStore.addSellerRequest({
      sellerId: seller.id,
      sellerName: seller.storeName,
      requestType: "company_verification",
      title: "طلب توثيق شركة / مصنع معتمد",
      details: `رقم السجل التجاري: ${commRegister.trim()} | رقم البطاقة الضريبية: ${taxCard.trim()}`,
    });

    toast.success("تم إرسال أوراق الشركة للسوبر أدمن لمراجعتها وتوثيق الحساب!");
  };

  const handleCreateRequest = (e: React.FormEvent) => {
    e.preventDefault();
    if (!seller) return;
    if (!reqTitle.trim() || !reqDetails.trim()) {
      toast.error("يرجى كتابة عنوان الطلب والتفاصيل كاملة");
      return;
    }

    MarketplaceStore.addSellerRequest({
      sellerId: seller.id,
      sellerName: seller.storeName,
      requestType: reqType,
      title: reqTitle.trim(),
      details: reqDetails.trim(),
      targetSection: reqSection,
    });

    setReqTitle("");
    setReqDetails("");
    toast.success("تم رفع الطلب بنجاح للسوبر أدمن وسيطبق فور الموافقة عليه!");
  };

  const addVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !productMeta) return;

    const newVar: ProductVariant = {
      id: `var-${safeRandomUUID()}`,
      sku: newVarSku.trim() || `SKU-${selectedProductId}-${Date.now().toString().slice(-4)}`,
      price: Number(newVarPrice),
      stock: Number(newVarStock),
      attributes: { [newVarAttrKey]: newVarAttrVal.trim() || "افتراضي" },
      warehouseId: "main",
    };

    const updatedMeta: ProductMetadata = {
      ...productMeta,
      variants: [...productMeta.variants, newVar],
    };

    MarketplaceStore.saveProductMetadata(selectedProductId, updatedMeta);
    setProductMeta(updatedMeta);

    setNewVarSku("");
    setNewVarPrice(0);
    setNewVarStock(5);
    setNewVarAttrVal("");
    toast.success("تم إضافة المتغير للمنتج!");
  };

  const deleteVariant = (id: string) => {
    if (!selectedProductId || !productMeta) return;

    const updatedMeta: ProductMetadata = {
      ...productMeta,
      variants: productMeta.variants.filter((v) => v.id !== id),
    };

    MarketplaceStore.saveProductMetadata(selectedProductId, updatedMeta);
    setProductMeta(updatedMeta);
    toast.success("تم حذف المتغير");
  };

  const getSellerTypeBadge = () => {
    if (!seller) return null;
    if (seller.isVerifiedCompany || seller.sellerType === "factory") {
      return (
        <span className="bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
          <BadgeCheck className="w-4 h-4 text-emerald-400" />
          شركة / مصنع معتمد
        </span>
      );
    }
    if (seller.sellerType === "affiliate") {
      return (
        <span className="bg-purple-500/20 text-purple-300 border border-purple-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
          <ShieldCheck className="w-4 h-4 text-purple-400" />
          مسوق بالعمولة (Affiliate)
        </span>
      );
    }
    return (
      <span className="bg-amber-500/20 text-amber-300 border border-amber-400/30 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1.5">
        <Building className="w-4 h-4 text-amber-400" />
        تاجر فردي (Merchant)
      </span>
    );
  };

  return (
    <div className="bg-card rounded-3xl p-5 border border-brand-dark/5 space-y-6">
      {/* Seller Header Info Panel */}
      {seller && (
        <div className="bg-gradient-to-r from-brand-dark via-brand-primary/90 to-brand-primary text-brand-bg rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1.5">
            <div className="flex items-center gap-2 flex-wrap">
              <h2 className="text-lg md:text-xl font-bold">{seller.storeName}</h2>
              {getSellerTypeBadge()}
            </div>
            <p className="text-xs text-brand-bg/80">
              صاحب الحساب: <span className="font-bold">{seller.ownerName}</span> | البريد:{" "}
              <span className="dir-ltr inline-block">{seller.email}</span>
            </p>
            <p className="text-[11px] text-brand-bg/70">
              نسبة عمولة المنصة المحددة:{" "}
              <span className="font-extrabold text-brand-accent">
                {seller.commissionCut || 10}%
              </span>
            </p>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-brand-dark/5 pb-3 overflow-x-auto no-scrollbar">
        {[
          {
            key: "customer_orders",
            label: `طلبات العملاء الجدد والتوصيل (${customerOrders.length})`,
            icon: ShoppingBag,
            highlight: customerOrders.filter((o) => o.status === "pending").length > 0,
          },
          { key: "analytics", label: "أداء المبيعات والتقارير", icon: BarChart3 },
          { key: "seller_type", label: "نوع الحساب وتراخيص الشركة", icon: FileText },
          { key: "seller_requests", label: "طلباتي للسوبر أدمن", icon: Send },
          { key: "variants", label: "متغيرات المنتجات والخصائص", icon: Sliders },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setActiveTab(
                t.key as
                  "customer_orders" | "analytics" | "seller_type" | "seller_requests" | "variants",
              )
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === t.key
                ? "bg-brand-primary text-brand-bg shadow-sm"
                : "bg-brand-bg text-brand-dark border border-brand-dark/5 hover:border-brand-accent"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
            {t.highlight && <span className="w-2 h-2 rounded-full bg-red-500 animate-ping"></span>}
          </button>
        ))}
      </div>

      {/* CUSTOMER ORDERS TAB WITH FULL CUSTOMER DETAILS */}
      {activeTab === "customer_orders" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-brand-bg p-4 rounded-2xl border border-brand-dark/10">
            <div>
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                <ShoppingBag className="w-4 h-4 text-brand-primary" />
                طلبات الشراء الواردة من العملاء وبيانات التوصيل الكاملة
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                تظهر هنا جميع طلبات الشراء التي تتضمن منتجات من متجرك مع بيانات الاتصال والعنوان
                بالكامل
              </p>
            </div>
            <span className="bg-brand-primary text-white text-xs font-black px-3 py-1 rounded-xl">
              إجمالي الطلبات: {customerOrders.length}
            </span>
          </div>

          {customerOrders.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl border border-dashed border-brand-dark/15 space-y-2">
              <ShoppingBag className="w-12 h-12 text-muted-foreground mx-auto opacity-40" />
              <p className="text-sm font-bold text-brand-dark">لا توجد طلبات عملاء حتى الآن</p>
              <p className="text-xs text-muted-foreground">
                عندما يطلب أحد العملاء منتجاً من متجرك، ستصلك البيانات الكاملة والإشعار فوراً هنا.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {customerOrders.map((ord) => {
                const statusColors = {
                  pending: "bg-amber-100 text-amber-900 border-amber-300",
                  processing: "bg-blue-100 text-blue-900 border-blue-300",
                  shipped: "bg-purple-100 text-purple-900 border-purple-300",
                  delivered: "bg-emerald-100 text-emerald-900 border-emerald-300",
                  cancelled: "bg-red-100 text-red-900 border-red-300",
                };

                const statusLabels = {
                  pending: "جديد (قيد المراجعة)",
                  processing: "جاري التجهيز",
                  shipped: "تم الشحن",
                  delivered: "تم التسليم بنجاح",
                  cancelled: "ملغي",
                };

                return (
                  <div
                    key={ord.id}
                    className="bg-card border border-brand-dark/15 rounded-3xl p-5 shadow-sm space-y-4"
                  >
                    {/* Header bar */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-dark/10 pb-3">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm text-brand-dark bg-secondary px-3 py-1 rounded-xl dir-ltr">
                          #{ord.orderNumber}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {new Date(ord.createdAt).toLocaleString("ar-EG")}
                        </span>
                      </div>

                      <div className="flex items-center gap-3">
                        <span
                          className={`text-xs font-extrabold px-3 py-1 rounded-xl border ${
                            statusColors[ord.status] || "bg-secondary text-brand-dark"
                          }`}
                        >
                          {statusLabels[ord.status] || ord.status}
                        </span>

                        <select
                          value={ord.status}
                          onChange={(e) => {
                            const newStatus = e.target.value as SellerCustomerOrder["status"];
                            MarketplaceStore.updateSellerOrderStatus(ord.id, newStatus);
                            setCustomerOrders(MarketplaceStore.getSellerCustomerOrders(sellerId));
                            toast.success("تم تحديث حالة الطلب بنجاح");
                          }}
                          className="text-xs font-bold bg-white border border-brand-dark/20 rounded-xl px-2.5 py-1 outline-none"
                        >
                          <option value="pending">جديد (قيد المراجعة)</option>
                          <option value="processing">جاري التجهيز</option>
                          <option value="shipped">تم الشحن</option>
                          <option value="delivered">تم التسليم</option>
                          <option value="cancelled">إلغاء</option>
                        </select>
                      </div>
                    </div>

                    {/* Customer Info Grid */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-brand-bg/60 p-4 rounded-2xl border border-brand-dark/5">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                          <User className="w-4 h-4 text-brand-primary" />
                          <span>بيانات العميل:</span>
                        </div>
                        <p className="text-xs font-black text-brand-dark">{ord.customerName}</p>
                        <div className="flex items-center gap-2 flex-wrap text-xs">
                          <a
                            href={`tel:${ord.phone}`}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs transition"
                          >
                            <Phone className="w-3 h-3" />
                            اتصال: {ord.phone}
                          </a>
                          <a
                            href={`https://wa.me/2${ord.phone.replace(/^0/, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="bg-green-600 hover:bg-green-700 text-white font-bold px-3 py-1 rounded-lg flex items-center gap-1 shadow-xs transition"
                          >
                            واتساب
                          </a>
                        </div>
                        {ord.backupPhone && (
                          <p className="text-[11px] text-muted-foreground">
                            رقم احتياطي: <span className="font-bold">{ord.backupPhone}</span>
                          </p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <div className="flex items-center gap-2 font-bold text-xs text-brand-dark">
                          <MapPin className="w-4 h-4 text-brand-primary" />
                          <span>عنوان التوصيل والشحن:</span>
                        </div>
                        <p className="text-xs text-brand-dark font-medium leading-relaxed">
                          <span className="font-bold">{ord.governorate}</span> - {ord.area}
                          <br />
                          <span className="text-muted-foreground">{ord.address}</span>
                        </p>
                        {ord.paymentMethod && (
                          <p className="text-[11px] font-bold text-brand-primary">
                            طريقة الدفع: {ord.paymentMethod}
                          </p>
                        )}
                        {ord.notes && (
                          <p className="text-[11px] bg-amber-50 text-amber-900 p-2 rounded-xl border border-amber-200">
                            ملاحظات العميل: {ord.notes}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Ordered Items Table */}
                    <div className="space-y-2">
                      <h4 className="text-xs font-bold text-brand-dark">
                        المنتجات المطلوبة من متجرك:
                      </h4>
                      <div className="space-y-2">
                        {ord.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-brand-dark/10 text-xs"
                          >
                            <div className="flex items-center gap-3">
                              {item.image_url ? (
                                <img
                                  src={item.image_url}
                                  alt={item.name}
                                  className="w-12 h-12 object-cover rounded-xl border border-brand-dark/10"
                                />
                              ) : (
                                <div className="w-12 h-12 bg-secondary rounded-xl grid place-items-center text-muted-foreground">
                                  📦
                                </div>
                              )}
                              <div>
                                <p className="font-bold text-brand-dark">{item.name}</p>
                                <div className="flex items-center gap-2 text-[11px] text-muted-foreground mt-0.5">
                                  {item.selectedColor && (
                                    <span className="bg-secondary px-2 py-0.5 rounded font-medium">
                                      اللون: {item.selectedColor}
                                    </span>
                                  )}
                                  {item.selectedSize && (
                                    <span className="bg-secondary px-2 py-0.5 rounded font-medium">
                                      المقاس: {item.selectedSize}
                                    </span>
                                  )}
                                  <span>الكمية: {item.quantity}</span>
                                </div>
                              </div>
                            </div>

                            <div className="text-left font-black text-brand-dark">
                              {(item.price * item.quantity).toLocaleString()} ج.م
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Total Footer */}
                    <div className="flex items-center justify-between pt-2 border-t border-brand-dark/10 text-xs font-extrabold">
                      <span className="text-brand-dark">إجمالي مبيعاتك من هذا الطلب:</span>
                      <span className="text-brand-primary text-sm">
                        {ord.total.toLocaleString()} ج.م
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* 1. ANALYTICS Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block font-bold">
                إجمالي المبيعات المحققة
              </span>
              <span className="text-xl font-black text-brand-primary block py-1">
                {sellerStats.loading ? "..." : formatEGP(sellerStats.monthlySales)}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold block">
                مبني على مبيعات حقيقية
              </span>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block font-bold">
                طلبات قيد الشحن والتسليم
              </span>
              <span className="text-xl font-black text-brand-primary block py-1">
                {sellerStats.loading ? "..." : `${sellerStats.pendingOrdersCount} طلب`}
              </span>
              <span className="text-[9px] text-amber-600 font-bold block">
                جاهز للتجهيز والتوصيل
              </span>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center col-span-2 md:col-span-1">
              <span className="text-[10px] text-muted-foreground block font-bold">
                المنتجات المنشورة متجرك
              </span>
              <span className="text-xl font-black text-brand-primary block py-1">
                {products.length} منتجات
              </span>
              <span className="text-[9px] text-brand-primary font-bold block">
                نشطة في الكتالوج
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 2. SELLER TYPE & COMPANY VERIFICATION */}
      {activeTab === "seller_type" && (
        <div className="space-y-6">
          <div className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-5 space-y-4">
            <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
              <FileText className="w-5 h-5 text-brand-primary" />
              تفاصيل نوع حساب البائع وتوثيق الشركة / المصنع
            </h3>
            <p className="text-xs text-muted-foreground">
              يمكنك العمل كمسوق بالعمولة أو تاجر فردي أو توثيق حسابك كشركة/مصنع معتمد برقم السجل
              التجاري والبطاقة الضريبية للحصول على شارة التوثيق وعمولات مميزة.
            </p>

            <form
              onSubmit={handleSubmitCompanyDocs}
              className="space-y-4 pt-2 border-t border-brand-dark/5"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark block">
                    رقم السجل التجاري (Commercial Registration):
                  </label>
                  <input
                    type="text"
                    value={commRegister}
                    onChange={(e) => setCommRegister(e.target.value)}
                    placeholder="123456"
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark block">
                    رقم البطاقة الضريبية (Tax Card Number):
                  </label>
                  <input
                    type="text"
                    value={taxCard}
                    onChange={(e) => setTaxCard(e.target.value)}
                    placeholder="987-654-321"
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-4 py-3 outline-none focus:border-brand-primary"
                  />
                </div>
              </div>

              <div className="flex justify-end pt-2">
                <button
                  type="submit"
                  className="bg-brand-primary hover:bg-brand-dark text-white font-bold px-6 py-3 rounded-xl text-xs transition cursor-pointer flex items-center gap-2 shadow-sm"
                >
                  <ShieldCheck className="w-4 h-4" />
                  حفظ وإرسال أوراق التوثيق للسوبر أدمن
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. SELLER REQUESTS TO SUPERADMIN */}
      {activeTab === "seller_requests" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Create new Request */}
            <form
              onSubmit={handleCreateRequest}
              className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-5 space-y-4 h-fit"
            >
              <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
                <Send className="w-4 h-4 text-brand-primary" />
                تقديم طلب جديد للسوبر أدمن
              </h3>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">نوع الطلب:</label>
                <select
                  value={reqType}
                  onChange={(e) => setReqType(e.target.value as "category" | "payment_method")}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 outline-none font-bold"
                >
                  <option value="category">طلب إضافة قسم / تصنيف فرعي جديد</option>
                  <option value="payment_method">طلب تفعيل وسيلة دفع إضافية</option>
                </select>
              </div>

              {reqType === "category" && (
                <div className="space-y-1">
                  <label className="text-xs font-bold text-muted-foreground block">
                    القسم المستهدف:
                  </label>
                  <select
                    value={reqSection}
                    onChange={(e) => setReqSection(e.target.value as "general" | "women")}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 outline-none font-bold"
                  >
                    <option value="general">الأقسام العامة للمتجر</option>
                    <option value="women">قسم النساء والخصوصية</option>
                  </select>
                </div>
              )}

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  عنوان الطلب:
                </label>
                <input
                  type="text"
                  required
                  placeholder="مثلاً: إضافة قسم أدوات حدائق المنزل..."
                  value={reqTitle}
                  onChange={(e) => setReqTitle(e.target.value)}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  تفاصيل وأسباب الطلب:
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="تفاصيل الطلب..."
                  value={reqDetails}
                  onChange={(e) => setReqDetails(e.target.value)}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl p-3 outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary hover:bg-brand-dark text-white font-bold py-3 rounded-xl text-xs transition cursor-pointer flex items-center justify-center gap-2 shadow-sm"
              >
                <Send className="w-4 h-4" />
                إرسال الطلب للسوبر أدمن
              </button>
            </form>

            {/* List Submitted Requests */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-extrabold text-sm text-brand-dark">
                سجل الطلبات السابقة وحالتها:
              </h3>

              {requestsList.length === 0 ? (
                <div className="bg-brand-bg p-8 rounded-2xl border border-brand-dark/5 text-center text-xs text-muted-foreground">
                  لم تقم بتقديم أي طلبات حتى الآن.
                </div>
              ) : (
                <div className="space-y-3">
                  {requestsList.map((r) => (
                    <div
                      key={r.id}
                      className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-4 space-y-2"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-md inline-block mb-1">
                            {r.requestType === "category" && "طلب إضافة قسم"}
                            {r.requestType === "payment_method" && "طلب وسيلة دفع"}
                            {r.requestType === "company_verification" && "طلب توثيق شركة"}
                          </span>
                          <h4 className="font-bold text-xs md:text-sm text-brand-dark">
                            {r.title}
                          </h4>
                        </div>

                        <span className="flex items-center gap-1 text-xs font-bold">
                          {r.status === "pending" && (
                            <span className="text-amber-600 bg-amber-50 border border-amber-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <Clock className="w-3.5 h-3.5" /> قيد المراجعة
                            </span>
                          )}
                          {r.status === "approved" && (
                            <span className="text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <CheckCircle className="w-3.5 h-3.5" /> تم القبول
                            </span>
                          )}
                          {r.status === "rejected" && (
                            <span className="text-rose-700 bg-rose-50 border border-rose-200 px-2.5 py-1 rounded-lg flex items-center gap-1">
                              <XCircle className="w-3.5 h-3.5" /> تم الرفض
                            </span>
                          )}
                        </span>
                      </div>

                      <p className="text-xs text-muted-foreground">{r.details}</p>
                      <span className="text-[10px] text-muted-foreground block pt-1">
                        تاريخ الطلب: {r.createdAt}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 4. DYNAMIC VARIANTS Tab */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  اختر منتج لعرض وتكوين متغيراته:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 outline-none font-bold"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({formatEGP(p.price)})
                    </option>
                  ))}
                </select>
              </div>

              {productMeta && (
                <div className="space-y-3">
                  <h4 className="font-bold text-xs text-brand-dark">
                    المتغيرات المضافة للمنتج الحالي ({productMeta.variants.length}):
                  </h4>

                  {productMeta.variants.length === 0 ? (
                    <div className="bg-brand-bg p-6 rounded-2xl border border-brand-dark/5 text-center text-xs text-muted-foreground">
                      لا توجد متغيرات فرعية لهذا المنتج بعد. استخدم النموذج لإضافة ألوان أو مقاسات.
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {productMeta.variants.map((v) => (
                        <div
                          key={v.id}
                          className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-3 flex justify-between items-center gap-2"
                        >
                          <div className="space-y-1">
                            <span className="text-[10px] font-bold text-brand-primary block dir-ltr text-right">
                              {v.sku}
                            </span>
                            <div className="flex flex-wrap gap-1">
                              {Object.entries(v.attributes).map(([k, val]) => (
                                <span
                                  key={k}
                                  className="text-[10px] bg-secondary border border-brand-dark/5 text-brand-dark font-bold px-2 py-0.5 rounded"
                                >
                                  {k}: {val}
                                </span>
                              ))}
                            </div>
                            <div className="text-xs font-extrabold text-brand-dark">
                              السعر: {formatEGP(v.price)} | المخزون: {v.stock} قطعة
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => deleteVariant(v.id)}
                            className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create Variant Form */}
            <form
              onSubmit={addVariant}
              className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-4 space-y-3 h-fit"
            >
              <h3 className="font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-accent" /> إضافة خيار/لون/مقاس فرعي
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  اسم الخاصية (مثلاً: اللون أو المقاس):
                </label>
                <input
                  value={newVarAttrKey}
                  onChange={(e) => setNewVarAttrKey(e.target.value)}
                  placeholder="اللون / المقاس..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  قيمة الخاصية (مثلاً: أسود أو XL):
                </label>
                <input
                  value={newVarAttrVal}
                  onChange={(e) => setNewVarAttrVal(e.target.value)}
                  placeholder="أسود / بيج / XL..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 outline-none"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    السعر (ج.م):
                  </label>
                  <input
                    type="number"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(Number(e.target.value))}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    الكمية المتوفرة:
                  </label>
                  <input
                    type="number"
                    value={newVarStock}
                    onChange={(e) => setNewVarStock(Number(e.target.value))}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 outline-none"
                  />
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-primary text-brand-bg font-extrabold py-2.5 rounded-xl text-xs hover:bg-brand-dark transition cursor-pointer shadow-sm"
              >
                توليد الخيار الفرعي
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
