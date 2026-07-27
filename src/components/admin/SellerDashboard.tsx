import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MultiVendorStorage } from "@/lib/multiVendorStorage";
import { safeRandomUUID } from "@/lib/safeId";
import {
  Building,
  CreditCard,
  Warehouse as WarehouseIcon,
  Plus,
  Trash2,
  Sliders,
  CheckCircle,
  HelpCircle,
  BarChart3,
  Flame,
  LayoutGrid,
  Zap,
} from "lucide-react";
import {
  MarketplaceStore,
  Seller,
  SubscriptionPlan,
  Warehouse,
  ProductMetadata,
  ProductVariant,
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

export function SellerDashboard({
  sellerId,
  products,
  onOpenAIStudio,
  onOpenBatchEditor,
}: SellerDashboardProps) {
  const [activeTab, setActiveTab] = useState<
    "analytics" | "variants" | "warehouses" | "subscription" | "store_payments"
  >("analytics");

  const [sellerStats, setSellerStats] = useState({
    monthlySales: 0,
    pendingOrdersCount: 0,
    loading: true,
  });

  useEffect(() => {
    const loadSellerStats = async () => {
      try {
        const { data } = await supabase.from("orders").select("*");
        if (data) {
          const list = (data as unknown as OrderRecord[]).filter((order) => {
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

          list.forEach((order) => {
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
              } catch (e) {
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
      } catch (err) {
        console.error("Error loading seller stats:", err);
        setSellerStats({ monthlySales: 0, pendingOrdersCount: 0, loading: false });
      }
    };
    if (sellerId) {
      loadSellerStats();
    } else {
      setSellerStats({ monthlySales: 0, pendingOrdersCount: 0, loading: false });
    }
  }, [sellerId, products]);

  // Sync state
  const [seller, setSeller] = useState<Seller | null>(null);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);

  // Warehouse form
  const [newWhName, setNewWhName] = useState("");
  const [newWhLoc, setNewWhLoc] = useState("");
  const [newWhCap, setNewWhCap] = useState(1000);

  // Variant helper
  const [selectedProductId, setSelectedProductId] = useState<string>("");
  const [productMeta, setProductMeta] = useState<ProductMetadata | null>(null);

  // New variant form
  const [newVarSku, setNewVarSku] = useState("");
  const [newVarPrice, setNewVarPrice] = useState(0);
  const [newVarStock, setNewVarStock] = useState(5);
  const [newVarWarehouse, setNewVarWarehouse] = useState("");
  const [newVarAttrKey, setNewVarAttrKey] = useState("اللون");
  const [newVarAttrVal, setNewVarAttrVal] = useState("");

  useEffect(() => {
    const list = MarketplaceStore.getSellers();
    const active = list.find((s) => s.id === sellerId) || list[0];
    setSeller(active || null);

    setPlans(MarketplaceStore.getPlans());
    setWarehouses(MarketplaceStore.getWarehouses());

    if (products.length > 0) {
      setSelectedProductId(products[0].id);
    }
  }, [sellerId, products]);

  // Load product metadata on dropdown select
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

  // 1. Warehouses CRUD
  const handleCreateWarehouse = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWhName.trim()) return;

    const newWh: Warehouse = {
      id: `wh-${safeRandomUUID()}`,
      name: newWhName.trim(),
      location: newWhLoc.trim(),
      capacity: Number(newWhCap),
    };

    const updatedWhs = [...warehouses, newWh];
    MarketplaceStore.saveWarehouses(updatedWhs);
    setWarehouses(updatedWhs);

    if (seller) {
      const updatedSeller: Seller = {
        ...seller,
        warehouses: [...seller.warehouses, newWh.id],
      };
      saveSeller(updatedSeller);
    }

    setNewWhName("");
    setNewWhLoc("");
    setNewWhCap(1000);
    toast.success("تم إنشاء وتخصيص مستودع جديد لمتجرك!");
  };

  const deleteWarehouse = (id: string) => {
    const updatedWhs = warehouses.filter((w) => w.id !== id);
    MarketplaceStore.saveWarehouses(updatedWhs);
    setWarehouses(updatedWhs);

    if (seller) {
      const updatedSeller: Seller = {
        ...seller,
        warehouses: seller.warehouses.filter((wId) => wId !== id),
      };
      saveSeller(updatedSeller);
    }
    toast.success("تم إزالة مستودع التخزين");
  };

  // 2. Subscription plans & Credits purchasing
  const purchasePlanUpgrade = (planId: string) => {
    if (!seller) return;
    const selectedPlan = plans.find((p) => p.id === planId);
    if (!selectedPlan) return;

    const updatedSeller: Seller = {
      ...seller,
      planId,
      aiCredits: seller.aiCredits + selectedPlan.aiCredits,
      planExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(), // 30 days extension
    };
    saveSeller(updatedSeller);
    toast.success(`مبروك! تم ترقية اشتراك متجرك بنجاح إلى: ${selectedPlan.name}`);
  };

  const buyAICredits = () => {
    if (!seller) return;
    const amount = 500;
    const price = 100;
    if (
      confirm(
        `هل ترغب في شراء حزمة رصيد إضافية بقيمة 500 رصيد ذكاء اصطناعي مقابل ${formatEGP(price)}؟`,
      )
    ) {
      const updatedSeller: Seller = {
        ...seller,
        aiCredits: seller.aiCredits + amount,
      };
      saveSeller(updatedSeller);
      toast.success("تم شحن رصيد إضافي +500 رصيد ذكاء اصطناعي لمتجرك!");
    }
  };

  // 3. Product Variant & Specifications Configuration
  const addVariant = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProductId || !productMeta) return;

    const newVar: ProductVariant = {
      id: `var-${safeRandomUUID()}`,
      sku: newVarSku.trim() || `SKU-${selectedProductId}-${Date.now().toString().slice(-4)}`,
      price: Number(newVarPrice),
      stock: Number(newVarStock),
      attributes: { [newVarAttrKey]: newVarAttrVal.trim() || "افتراضي" },
      warehouseId: newVarWarehouse || warehouses[0]?.id || "warehouse-main",
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
    toast.success("تم توليد وإدراج المتغير الفرعي للمنتج!");
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

  const activePlan = plans.find((p) => p.id === seller?.planId);

  return (
    <div className="bg-card rounded-3xl p-5 border border-brand-dark/5 space-y-6">
      {/* Seller Header Info Panel */}
      {seller && (
        <div className="bg-gradient-to-r from-brand-dark to-brand-primary text-brand-bg rounded-2xl p-5 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h2 className="text-lg md:text-xl font-bold">{seller.storeName}</h2>
            <p className="text-xs text-brand-bg/75">
              مالك المتجر: {seller.ownerName} | الباقة الحالية: {activePlan?.name || seller.planId}
            </p>
            <p className="text-[10px] text-brand-bg/50">
              تاريخ انتهاء الاشتراك: {new Date(seller.planExpiresAt).toLocaleDateString("ar-EG")}
            </p>
          </div>

          <div className="flex gap-2.5 items-center bg-brand-bg/15 border border-brand-bg/10 p-3 rounded-xl">
            <div className="text-right">
              <span className="text-[10px] text-brand-bg/70 block">
                رصيد الذكاء الاصطناعي (AI Studio)
              </span>
              <span className="text-sm font-extrabold text-brand-accent">
                {seller.aiCredits} رصيد متبقي
              </span>
            </div>
            <button
              onClick={buyAICredits}
              className="bg-brand-accent hover:bg-amber-500 text-brand-dark text-[10px] font-extrabold px-3 py-1.5 rounded-lg transition"
            >
              شراء رصيد
            </button>
          </div>
        </div>
      )}

      {/* Tabs navigation */}
      <div className="flex gap-2 border-b border-brand-dark/5 pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: "analytics", label: "أداء المبيعات والتقارير", icon: BarChart3 },
          { key: "store_payments", label: "خيارات الدفع والعمولة", icon: CreditCard },
          { key: "variants", label: "المتغيرات والخصائص الفرعية", icon: Sliders },
          { key: "warehouses", label: "مستودعات المخزون الخاص بك", icon: WarehouseIcon },
          { key: "subscription", label: "ترقية الباقة والاشتراكات", icon: CreditCard },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setActiveTab(
                t.key as
                  "analytics" | "store_payments" | "variants" | "warehouses" | "subscription",
              )
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
              activeTab === t.key
                ? "bg-brand-primary text-brand-bg shadow-sm"
                : "bg-brand-bg text-brand-dark border border-brand-dark/5 hover:border-brand-accent"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* 1. ANALYTICS Tab */}
      {activeTab === "analytics" && (
        <div className="space-y-6">
          {/* Quick Stats Grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block">
                إجمالي المبيعات المحققة
              </span>
              <span className="text-lg font-bold text-brand-primary">
                {sellerStats.loading ? "..." : formatEGP(sellerStats.monthlySales)}
              </span>
              <span className="text-[9px] text-emerald-600 font-bold block">
                مبني على مبيعات حقيقية
              </span>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block">
                طلبات قيد المعالجة والشحن
              </span>
              <span className="text-lg font-bold text-brand-primary">
                {sellerStats.loading ? "..." : `${sellerStats.pendingOrdersCount} طلب`}
              </span>
              <span className="text-[9px] text-amber-600 font-bold block">
                جاهز للتسليم والتحضير
              </span>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block">المنتجات المنشورة</span>
              <span className="text-lg font-bold text-brand-primary">{products.length} منتجات</span>
              <span className="text-[9px] text-brand-primary font-bold block">
                نشطة في كتالوج البحث
              </span>
            </div>

            <div className="bg-brand-bg p-4 rounded-2xl border border-brand-dark/5 text-center">
              <span className="text-[10px] text-muted-foreground block">المخازن المربوطة</span>
              <span className="text-lg font-bold text-brand-primary">
                {seller?.warehouses.length || 0} مستودعات
              </span>
              <span className="text-[9px] text-sky-600 font-bold block">موزعة جغرافيًا</span>
            </div>
          </div>
        </div>
      )}

      {/* 2. DYNAMIC VARIANTS Tab */}
      {activeTab === "variants" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List and manage variants */}
            <div className="lg:col-span-2 space-y-4">
              <div className="space-y-1">
                <label className="text-xs font-bold text-muted-foreground block">
                  اختر منتج لعرض وتكوين متغيراته:
                </label>
                <select
                  value={selectedProductId}
                  onChange={(e) => setSelectedProductId(e.target.value)}
                  className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {productMeta && (
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-brand-dark">
                      المتغيرات النشطة للمنتج المحدد:
                    </span>
                    <span className="text-[10px] text-muted-foreground">
                      {productMeta.variants.length} متغير متوفر
                    </span>
                  </div>

                  {productMeta.variants.length === 0 ? (
                    <p className="text-center py-6 text-xs text-muted-foreground bg-brand-bg border rounded-2xl">
                      لا توجد متغيرات فرعية لهذا المنتج. يمكنك إنشاؤها عبر النموذج الجانبي.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {productMeta.variants.map((v) => {
                        const wh = warehouses.find((w) => w.id === v.warehouseId);
                        const attrText = Object.entries(v.attributes)
                          .map(([k, val]) => `${k}: ${val}`)
                          .join(" | ");

                        return (
                          <div
                            key={v.id}
                            className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 flex justify-between items-center"
                          >
                            <div className="space-y-1">
                              <div className="flex items-center gap-1.5">
                                <span className="font-mono text-xs font-bold text-brand-primary">
                                  {v.sku}
                                </span>
                                <span className="text-xs bg-brand-accent/15 text-brand-dark font-bold px-2 py-0.5 rounded">
                                  {attrText}
                                </span>
                              </div>
                              <p className="text-[10px] text-muted-foreground">
                                السعر الإضافي: +{formatEGP(v.price)} | كمية المخزون: {v.stock} قطعة
                              </p>
                              {wh && (
                                <p className="text-[9px] font-bold text-emerald-800">
                                  📍 مربوط بمخزن: {wh.name}
                                </p>
                              )}
                            </div>

                            <button
                              onClick={() => deleteVariant(v.id)}
                              className="text-destructive hover:bg-destructive/10 p-2 rounded-lg transition"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Create variant form */}
            <form
              onSubmit={addVariant}
              className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 space-y-3 h-fit"
            >
              <h3 className="font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-accent" /> توليد متغير فرعي (Variant)
              </h3>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  رمز المتغير (SKU):
                </label>
                <input
                  value={newVarSku}
                  onChange={(e) => setNewVarSku(e.target.value)}
                  placeholder="اتركه فارغاً للتوليد التلقائي..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    خاصية الميزة:
                  </label>
                  <select
                    value={newVarAttrKey}
                    onChange={(e) => setNewVarAttrKey(e.target.value)}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none"
                  >
                    <option value="اللون">اللون</option>
                    <option value="المقاس">المقاس</option>
                    <option value="نوع الخشب">نوع الخشب</option>
                    <option value="نوع القماش">نوع القماش</option>
                    <option value="بلد المنشأ">بلد المنشأ</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    قيمة الميزة:
                  </label>
                  <input
                    required
                    value={newVarAttrVal}
                    onChange={(e) => setNewVarAttrVal(e.target.value)}
                    placeholder="مثال: بني زان، كبير..."
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    سعر إضافي (ج.م):
                  </label>
                  <input
                    type="number"
                    value={newVarPrice}
                    onChange={(e) => setNewVarPrice(Number(e.target.value))}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5"
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
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  مستودع التخزين المربوط:
                </label>
                <select
                  value={newVarWarehouse}
                  onChange={(e) => setNewVarWarehouse(e.target.value)}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                >
                  <option value="">— اختر مستودع —</option>
                  {warehouses.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.name}
                    </option>
                  ))}
                </select>
              </div>

              <button
                type="submit"
                disabled={!selectedProductId}
                className="w-full bg-brand-accent text-brand-dark font-extrabold py-3.5 rounded-xl text-xs hover:bg-amber-500 disabled:opacity-50 transition"
              >
                توليد المتغير وحفظه
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 3. WAREHOUSES Tab */}
      {activeTab === "warehouses" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-brand-dark">المستودعات المخصصة لمتجرك:</h3>
              <div className="space-y-2">
                {warehouses.map((w) => (
                  <div
                    key={w.id}
                    className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 flex justify-between items-center"
                  >
                    <div>
                      <h4 className="font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                        <WarehouseIcon className="w-4 h-4 text-brand-primary" />
                        {w.name}
                      </h4>
                      <p className="text-[10px] text-muted-foreground">
                        الموقع الجغرافي: {w.location} | السعة الاستيعابية: {w.capacity} طرد
                      </p>
                    </div>
                    <button
                      onClick={() => deleteWarehouse(w.id)}
                      className="text-destructive text-[10px] hover:underline"
                    >
                      إزالة المستودع
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Create warehouse form */}
            <form
              onSubmit={handleCreateWarehouse}
              className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 space-y-3 h-fit"
            >
              <h3 className="font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-accent" /> ربط مستودع تخزين جديد
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  اسم المستودع:
                </label>
                <input
                  required
                  value={newWhName}
                  onChange={(e) => setNewWhName(e.target.value)}
                  placeholder="مثال: مخزن الدلتا الرئيسي..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  الموقع / العنوان بالتفصيل:
                </label>
                <input
                  required
                  value={newWhLoc}
                  onChange={(e) => setNewWhLoc(e.target.value)}
                  placeholder="المحافظة والمنطقة السكنية..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  السعة الإجمالية للطرود:
                </label>
                <input
                  type="number"
                  required
                  value={newWhCap}
                  onChange={(e) => setNewWhCap(Number(e.target.value))}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <button
                type="submit"
                className="w-full bg-brand-accent text-brand-dark font-extrabold py-3.5 rounded-xl text-xs hover:bg-amber-500 transition"
              >
                إنشاء وتخصيص المستودع
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. SUBSCRIPTION Tab */}
      {activeTab === "subscription" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-brand-dark">
              باقات وخطط الترقية المتاحة للتجار والمتاجر:
            </h3>
            <span className="text-xs text-muted-foreground">التفعيل فوري بمجرد الاختيار</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {plans.map((p) => {
              const isCurrent = seller?.planId === p.id;
              return (
                <div
                  key={p.id}
                  className={`bg-brand-bg border rounded-2xl p-5 flex flex-col justify-between gap-4 relative transition ${
                    isCurrent
                      ? "border-brand-accent ring-2 ring-brand-accent/20"
                      : "border-brand-dark/5 hover:border-brand-accent"
                  }`}
                >
                  {isCurrent && (
                    <span className="absolute top-3 left-3 bg-brand-accent text-brand-dark text-[8px] font-extrabold px-2.5 py-0.5 rounded-full">
                      الباقة النشطة حالياً
                    </span>
                  )}

                  <div className="space-y-1">
                    <h4 className="font-extrabold text-xs md:text-sm">{p.name}</h4>
                    <p className="text-[10px] text-muted-foreground line-clamp-2">
                      {p.description}
                    </p>
                    <div className="text-lg font-extrabold text-brand-accent">
                      {p.price === 0 ? "مجاني" : formatEGP(p.price)}
                    </div>
                    <div className="text-[10px] font-bold text-emerald-800">
                      ⚡ باقة تجارية مرخصة بالكامل للبيع وإضافة الأقسام
                    </div>
                  </div>

                  <ul className="space-y-1 text-[10px] font-semibold border-t border-brand-dark/5 pt-2.5">
                    {p.features.map((feat, i) => (
                      <li key={i} className="text-brand-dark">
                        ✓ {feat}
                      </li>
                    ))}
                  </ul>

                  <button
                    disabled={isCurrent}
                    onClick={() => purchasePlanUpgrade(p.id)}
                    className={`w-full py-2.5 rounded-xl text-xs font-extrabold transition cursor-pointer ${
                      isCurrent
                        ? "bg-secondary text-muted-foreground cursor-not-allowed"
                        : "bg-brand-dark text-brand-bg hover:bg-brand-primary"
                    }`}
                  >
                    {isCurrent ? "باقتك النشطة حالياً" : "ترقية والاشتراك فوراً"}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 5. STORE PAYMENTS & COMMISSION Tab */}
      {activeTab === "store_payments" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-brand-bg p-6 rounded-2xl border border-brand-dark/5 space-y-4">
            <div className="flex items-center justify-between border-b border-brand-dark/5 pb-3">
              <div className="space-y-1">
                <h3 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                  <CreditCard className="w-4 h-4 text-brand-primary" />
                  خيارات طرق الدفع المتاحة لعملاء متجرك
                </h3>
                <p className="text-xs text-muted-foreground">
                  حدد خيارات الدفع التي تقبلها لمنتجاتك، وسيتم عرض هذه الخيارات فقط للعملاء أثناء
                  إتمام الطلب.
                </p>
              </div>
              <span className="text-[10px] bg-emerald-500/10 text-emerald-700 font-extrabold px-3 py-1 rounded-full border border-emerald-500/20">
                مفعلة وتتطابق مع صفحة الدفع
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { id: "cod", label: "الدفع عند الاستلام (COD)", desc: "نقداً لمندوب الشحن" },
                {
                  id: "card",
                  label: "بطاقة بنكية (Visa/Mastercard)",
                  desc: "الدفع الإلكتروني المباشر",
                },
                { id: "wallet", label: "محفظة كاش (Vodafone Cash)", desc: "تحويل كاش مباشر" },
                { id: "instapay", label: "إنستا باي (InstaPay)", desc: "تحويل لحظي بالمعرف" },
              ].map((method) => {
                const billing = MultiVendorStorage.getBillingSettings();
                const isSelected = billing.paymentMethods?.includes(method.id) ?? true;
                return (
                  <button
                    key={method.id}
                    type="button"
                    onClick={() => {
                      const current = billing.paymentMethods || [
                        "cod",
                        "card",
                        "wallet",
                        "instapay",
                      ];
                      const updated = isSelected
                        ? current.filter((m) => m !== method.id)
                        : [...current, method.id];

                      if (updated.length === 0) {
                        toast.error("يجب تفعيل طريقة دفع واحدة على الأقل لمتجرك!");
                        return;
                      }

                      MultiVendorStorage.saveBillingSettings({
                        ...billing,
                        paymentMethods: updated,
                      });
                      toast.success(`تم تحديث قبول طريقة [${method.label}] لمتجرك بنجاح!`);
                    }}
                    className={`p-4 rounded-2xl border text-right transition cursor-pointer space-y-2 ${
                      isSelected
                        ? "border-brand-primary bg-brand-primary/10 text-brand-dark ring-1 ring-brand-primary/30"
                        : "border-brand-dark/10 bg-card text-muted-foreground opacity-60 hover:opacity-100"
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <span className="font-black text-xs">{method.label}</span>
                      <div
                        className={`w-4 h-4 rounded-md border flex items-center justify-center ${
                          isSelected
                            ? "bg-brand-primary border-brand-primary text-white"
                            : "border-brand-dark/20"
                        }`}
                      >
                        {isSelected && <Check className="w-3 h-3" />}
                      </div>
                    </div>
                    <span className="text-[10px] text-muted-foreground block">{method.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Super Admin Commission Read-Only Info Box */}
          <div className="bg-amber-500/10 border border-amber-500/30 p-5 rounded-2xl space-y-2">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold text-xs">
              <Building className="w-4 h-4 text-amber-600" />
              <span>سياسة ونسبة عمولة المنصة المعتمدة (محددة بواسطة السوبر أدمن حصرياً):</span>
            </div>
            <p className="text-xs text-amber-900 leading-relaxed">
              وفقاً لقوانين المنصة، النسبة الحالية لعمولة السوبر أدمن هي{" "}
              <strong className="text-brand-primary font-black">5%</strong> من إجمالي مبيعات المتجر.
              لا يمكن للبائع تعديل نسبة العمولة، حيث يتم حساب المستحقات والمديونيات تلقائياً
              وإضافتها للمحفظة.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
