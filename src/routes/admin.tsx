import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";
import {
  LogOut,
  Pencil,
  Trash2,
  Plus,
  Package,
  ClipboardList,
  Tags,
  MessageSquare,
  Settings as SettingsIcon,
  Facebook,
  RefreshCw,
  Link2Off,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ShieldAlert,
  Building,
  UserCheck,
  BarChart3,
  TrendingUp,
} from "lucide-react";
import { useServerFn } from "@tanstack/react-start";
import {
  getCategoryIcon,
  ALL_CATEGORY_ICONS,
  saveCustomIconMapping,
  getAutoIconKey,
} from "@/lib/category-icons";
import {
  getFacebookStatus,
  connectFacebook,
  disconnectFacebook,
  setAutoSync,
  syncFacebookNow,
  getSyncLogs,
} from "@/lib/facebook.functions";
import { ensureDbAdminRole } from "@/lib/admin.functions";

import { safeRandomUUID } from "@/lib/safeId";
import { RoleSelector } from "@/components/admin/RoleSelector";
import { SuperAdminDashboard } from "@/components/admin/SuperAdminDashboard";
import { SellerDashboard } from "@/components/admin/SellerDashboard";
import { VisitorDashboard } from "@/components/admin/VisitorDashboard";
import { MultiImageUploader, GalleryAsset } from "@/components/admin/MultiImageUploader";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { InAppChatAndTeams } from "@/components/admin/InAppChatAndTeams";
import { UniversalImportCenter } from "@/components/admin/UniversalImportCenter";
import { SellerWalletView } from "@/components/admin/SellerWalletView";
import { MultiVendorStorage } from "@/lib/multiVendorStorage";
import { Globe, CreditCard, Bot, Search, ChevronLeft, ChevronRight } from "lucide-react";

type Product = {
  id: string;
  name: string;
  description: string | null;
  price: number;
  image_url: string | null;
  category: string;
  in_stock: boolean;
  featured: boolean;
};

type Order = {
  id: string;
  customer_name: string;
  phone: string;
  governorate: string;
  area: string;
  address: string;
  notes: string | null;
  items: Array<{ id: string; name: string; price: number; quantity: number }>;
  total: number;
  status: string;
  created_at: string;
};

type Category = { id: string; name: string; sort_order: number };
type ContactMessage = {
  id: string;
  name: string;
  phone: string;
  message: string;
  status: string;
  created_at: string;
};
type SiteSettings = {
  id: number;
  phone: string | null;
  whatsapp: string | null;
  email: string | null;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  about: string | null;
};

type Tab =
  | "products"
  | "orders"
  | "categories"
  | "messages"
  | "facebook"
  | "settings"
  | "marketplace"
  | "seller_dashboard"
  | "customer_dashboard"
  | "onboarding"
  | "in_app_chat"
  | "import_center"
  | "wallet";

export const Route = createFileRoute("/admin")({
  head: () => ({ meta: [{ title: "لوحة الإدارة — بيتك" }] }),
  component: AdminPage,
});

function AdminPage() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isRealAdmin, setIsRealAdmin] = useState(false);
  const [isRealSeller, setIsRealSeller] = useState(false);
  const [simulationRole, setSimulationRole] = useState<
    "super_admin" | "seller" | "customer" | "visitor"
  >(MarketplaceStore.getSimulationRole());
  const [activeSellerId, setActiveSellerId] = useState(MarketplaceStore.getSimulatedSellerId());
  const [tab, setTab] = useState<Tab>(() => {
    const sRole = MarketplaceStore.getSimulationRole();
    if (sRole === "super_admin") return "marketplace";
    if (sRole === "seller") return "seller_dashboard";
    if (sRole === "customer") return "customer_dashboard";
    return "onboarding";
  });

  const [aiStudioProduct, setAiStudioProduct] = useState<Product | null>(null);
  const [openBatchEditor, setOpenBatchEditor] = useState(false);
  const [productsList, setProductsList] = useState<Product[]>([]);

  const [userEmail, setUserEmail] = useState("");

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(async ({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      if (!user) {
        navigate({ to: "/auth" });
        return;
      }
      const email = user.email || "";
      setUserEmail(email);

      // 1. Check if Super Admin
      const lowercaseEmail = email.toLowerCase();
      const isSuperAdminEmail =
        lowercaseEmail === "habibaali552005@gmail.com" ||
        lowercaseEmail === "alihabiba109@gmail.com";

      const { data: roles } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", user.id);

      const dbAdmin = roles?.some((r) => r.role === "admin") ?? false;
      const dbSeller = roles?.some((r) => r.role === "seller" || r.role === "vendor") ?? false;
      const isSuper = isSuperAdminEmail || dbAdmin;

      if (isSuperAdminEmail) {
        ensureDbAdminRole({ data: { email, userId: user.id } })
          .then(() => {
            console.log("Successfully ensured real admin role in Supabase database.");
          })
          .catch((err) => {
            console.warn("Note: Could not automatically sync real admin role in Supabase:", err);
          });
      }

      setIsRealAdmin(isSuper);
      setIsAdmin(isSuper);

      if (isSuper) {
        setIsRealSeller(true);
        setSimulationRole("super_admin");
        setActiveSellerId("seller-habiba");
        MarketplaceStore.setSimulatedSellerId("seller-habiba");
        setTab("marketplace");
      } else {
        // 2. Check if a registered Seller
        const sellers = MarketplaceStore.getSellers();
        const matchedSeller = sellers.find((s) => s.email?.toLowerCase() === lowercaseEmail);
        if (matchedSeller || dbSeller) {
          setIsRealSeller(true);
          setSimulationRole("seller");
          const sellerId = matchedSeller?.id || "seller-habiba";
          setActiveSellerId(sellerId);
          MarketplaceStore.setSimulatedSellerId(sellerId);
          setTab("seller_dashboard");
        } else {
          // 3. Otherwise, regular user / visitor onboarding
          setIsRealSeller(false);
          setSimulationRole("visitor");
          MarketplaceStore.setSimulationRole("visitor");
          setTab("onboarding");
        }
      }

      setChecking(false);
    });
    return () => {
      mounted = false;
    };
  }, [navigate]);

  const loadProducts = () => {
    supabase
      .from("products")
      .select("*")
      .then(({ data }) => {
        let raw = (data as Product[]) || [];
        const customMap = MarketplaceStore.getCustomProducts();
        const existingIds = new Set(raw.map((p) => p.id));
        raw = raw.map((p) => (customMap[p.id] ? { ...p, ...customMap[p.id] } : p));
        Object.keys(customMap).forEach((id) => {
          if (!existingIds.has(id)) {
            raw.unshift({
              id,
              name: "منتج جديد",
              price: 100,
              in_stock: true,
              created_at: new Date().toISOString(),
              ...customMap[id],
            } as Product);
          }
        });
        setProductsList(MarketplaceStore.filterDeletedProducts(raw));
      });
  };

  useEffect(() => {
    loadProducts();
    window.addEventListener("beitak-products-updated", loadProducts);
    window.addEventListener("storage", loadProducts);
    return () => {
      window.removeEventListener("beitak-products-updated", loadProducts);
      window.removeEventListener("storage", loadProducts);
    };
  }, []);

  const logout = async () => {
    MarketplaceStore.setSimulationRole("visitor");
    MarketplaceStore.setSimulatedSellerId("");
    await supabase.auth.signOut();
    toast.success("تم تسجيل الخروج بنجاح");
    navigate({ to: "/auth" });
  };

  if (checking) {
    return (
      <PageShell>
        <div className="text-center py-20 text-muted-foreground text-sm">جاري التحميل...</div>
      </PageShell>
    );
  }

  if (!userEmail) {
    return (
      <PageShell>
        <div className="text-center py-20 px-4">
          <p className="text-sm text-muted-foreground mb-4">
            برجاء تسجيل الدخول للوصول إلى لوحة الإدارة.
          </p>
          <button onClick={logout} className="text-brand-primary underline text-sm">
            تسجيل خروج
          </button>
        </div>
      </PageShell>
    );
  }

  const getTabsForRole = (): {
    key: Tab;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }[] => {
    if (simulationRole === "super_admin") {
      return [
        { key: "marketplace", label: "باقات الاشتراك والشركاء", icon: ShieldAlert },
        { key: "seller_dashboard", label: "لوحة تحكم متجري (بائع مميز)", icon: BarChart3 },
        { key: "products", label: "إدارة المنتجات العامة والأسعار", icon: Package },
        { key: "orders", label: "الطلبّات الواردة للعملاء", icon: ClipboardList },
        { key: "categories", label: "الأقسام والكتالوج", icon: Tags },
        { key: "in_app_chat", label: "محادثات الماركت بليس والعملاء", icon: MessageSquare },
        { key: "wallet", label: "سحوبات وعمولات المتاجر", icon: CreditCard },
        { key: "messages", label: "رسائل تواصل الزوار", icon: MessageSquare },
        { key: "settings", label: "إعدادات عامة", icon: SettingsIcon },
      ];
    } else if (simulationRole === "seller") {
      return [
        { key: "seller_dashboard", label: "لوحة تحكم المتجر", icon: BarChart3 },
        { key: "products", label: "منتجات متجرك", icon: Package },
        { key: "orders", label: "طلبات زبائنك", icon: ClipboardList },
        { key: "in_app_chat", label: "شات العملاء وتنسيق الفريق", icon: MessageSquare },
        { key: "wallet", label: "محفظة متجرك المالي", icon: CreditCard },
      ];
    } else if (simulationRole === "customer") {
      return [{ key: "customer_dashboard", label: "بوابة الطلبات والهدايا", icon: UserCheck }];
    } else {
      return [{ key: "onboarding", label: "انضم كبائع للمنصة", icon: Building }];
    }
  };

  const tabs = getTabsForRole();

  const handleSaveAIImage = async (newUrl: string) => {
    if (!aiStudioProduct) return;
    const { error } = await supabase
      .from("products")
      .update({ image_url: newUrl })
      .eq("id", aiStudioProduct.id);

    if (error) {
      toast.error("فشل حفظ الصورة بالخادم الرئيسي: " + error.message);
    } else {
      toast.success("تم تحديث صورة المنتج بالذكاء الاصطناعي بنجاح!");
      setAiStudioProduct(null);
    }
  };

  const handleSaveBatchImages = async (updates: Array<{ id: string; image_url: string }>) => {
    for (const item of updates) {
      await supabase.from("products").update({ image_url: item.image_url }).eq("id", item.id);
    }
    toast.success("تم تطبيق وحفظ كافة التعديلات الجماعية بنجاح!");
  };

  return (
    <PageShell>
      <div className="px-4 pt-4">
        <RoleSelector
          currentRole={simulationRole}
          isRealAdmin={isRealAdmin}
          isRealSeller={isRealSeller}
          onChangeRole={(role) => {
            setSimulationRole(role);
            if (role === "super_admin") setTab("marketplace");
            else if (role === "seller") setTab("seller_dashboard");
            else if (role === "customer") setTab("customer_dashboard");
            else setTab("onboarding");
          }}
          onRefreshData={() => {
            setActiveSellerId(MarketplaceStore.getSimulatedSellerId());
          }}
        />
      </div>

      <div className="px-4 pt-4 flex justify-between items-center mb-4">
        <div className="space-y-0.5">
          <h1 className="text-2xl font-bold">لوحة التحكم</h1>
          <p className="text-xs text-muted-foreground font-semibold">
            {simulationRole === "super_admin" && "المدير العام للماركت بليس"}
            {simulationRole === "seller" && "بوابة شركاء النجاح والتجار"}
            {simulationRole === "customer" && "حساب المشتري والتقارير الفرعية"}
            {simulationRole === "visitor" && "واجهة الشركاء الجدد"}
          </p>
        </div>
        <div className="flex gap-2 items-center">
          <button
            onClick={logout}
            className="w-10 h-10 rounded-full border border-brand-dark/10 grid place-items-center bg-card hover:bg-neutral-100 transition"
            aria-label="خروج"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="px-4 mb-4 overflow-x-auto no-scrollbar">
        <div className="flex gap-2 min-w-max">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap ${
                tab === t.key
                  ? "bg-brand-dark text-brand-bg"
                  : "bg-card text-brand-dark border border-brand-dark/10"
              }`}
            >
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "marketplace" && simulationRole === "super_admin" && <SuperAdminDashboard />}
      {tab === "seller_dashboard" &&
        (simulationRole === "seller" || simulationRole === "super_admin") && (
          <SellerDashboard
            sellerId={activeSellerId}
            products={productsList.filter(
              (p) => MultiVendorStorage.getProductSeller(p.id) === activeSellerId,
            )}
          />
        )}
      {tab === "onboarding" && <VisitorDashboard />}
      {tab === "customer_dashboard" && (
        <div className="px-4 py-8 text-center space-y-4">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full grid place-items-center mx-auto">
            <UserCheck className="w-8 h-8" />
          </div>
          <h3 className="text-base font-bold text-brand-dark">
            بوابة العميل الوفي (Customer Loyalty)
          </h3>
          <p className="text-xs text-muted-foreground max-w-sm mx-auto">
            أهلاً بك! يمكنك تتبع طلباتك، تعديل عناوين التوصيل، ومشاهدة كوبونات الخصم والجوائز
            الممنوحة لك من الإدارة هنا.
          </p>
          <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl max-w-sm mx-auto">
            <span className="text-[10px] text-muted-foreground block">رصيد الهدايا الحالي</span>
            <span className="text-xl font-bold text-brand-primary">150 نقطة</span>
          </div>
        </div>
      )}

      {tab === "products" && (simulationRole === "seller" || simulationRole === "super_admin") && (
        <ProductsAdmin sellerId={activeSellerId} isSeller={simulationRole === "seller"} />
      )}
      {tab === "orders" && (simulationRole === "seller" || simulationRole === "super_admin") && (
        <OrdersAdmin sellerId={activeSellerId} isSeller={simulationRole === "seller"} />
      )}
      {tab === "categories" &&
        (simulationRole === "seller" || simulationRole === "super_admin") && (
          <CategoriesAdmin isSeller={simulationRole === "seller"} sellerId={activeSellerId} />
        )}
      {tab === "in_app_chat" &&
        (simulationRole === "seller" || simulationRole === "super_admin") && (
          <InAppChatAndTeams
            currentUserEmail={userEmail}
            sellerId={activeSellerId}
            isSuperAdmin={simulationRole === "super_admin"}
          />
        )}
      {tab === "wallet" && (simulationRole === "seller" || simulationRole === "super_admin") && (
        <SellerWalletView
          sellerId={activeSellerId}
          isSuperAdmin={simulationRole === "super_admin"}
        />
      )}
      {tab === "messages" && simulationRole === "super_admin" && <MessagesAdmin />}
      {tab === "facebook" && simulationRole === "super_admin" && <FacebookAdmin />}
      {tab === "settings" && simulationRole === "super_admin" && <SettingsAdmin />}
    </PageShell>
  );
}

// ---------- Products ----------
function ProductsAdmin({ sellerId, isSeller }: { sellerId?: string; isSeller?: boolean }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Product | "new" | null>(null);

  const load = async () => {
    setLoading(true);
    const [{ data: prods }, { data: cats }] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("sort_order"),
    ]);

    let productList = (prods as Product[]) ?? [];
    const customMap = MarketplaceStore.getCustomProducts();
    const existingIds = new Set(productList.map((p) => p.id));
    productList = productList.map((p) => (customMap[p.id] ? { ...p, ...customMap[p.id] } : p));
    Object.keys(customMap).forEach((id) => {
      if (!existingIds.has(id)) {
        productList.unshift({
          id,
          name: "منتج جديد",
          price: 100,
          in_stock: true,
          created_at: new Date().toISOString(),
          ...customMap[id],
        } as Product);
      }
    });

    productList = MarketplaceStore.filterDeletedProducts(productList);

    if (isSeller && sellerId) {
      productList = productList.filter(
        (p) => MultiVendorStorage.getProductSeller(p.id) === sellerId,
      );
    }

    let categoryList = (cats as Category[]) ?? [];
    if (categoryList.length === 0) {
      categoryList = [
        { id: "cat-1", name: "غرف معيشة", sort_order: 1 },
        { id: "cat-2", name: "غرف نوم", sort_order: 2 },
        { id: "cat-3", name: "طاولات طعام", sort_order: 3 },
        { id: "cat-4", name: "ديكورات", sort_order: 4 },
        { id: "cat-5", name: "أجهزة كهربائية", sort_order: 5 },
      ];
    }

    setProducts(productList);
    setCategories(categoryList);
    setLoading(false);
  };

  useEffect(() => {
    load();
    window.addEventListener("beitak-products-updated", load);
    window.addEventListener("storage", load);
    return () => {
      window.removeEventListener("beitak-products-updated", load);
      window.removeEventListener("storage", load);
    };
  }, [isSeller, sellerId]);

  const del = async (id: string) => {
    try {
      await supabase.from("products").delete().eq("id", id);
    } catch {
      // Fallback
    }
    MarketplaceStore.deleteProduct(id);
    toast.success("تم حذف المنتج بنجاح");
    load();
  };

  return (
    <div className="px-4 space-y-3">
      <button
        onClick={() => setEditing("new")}
        className="w-full bg-brand-accent text-brand-dark font-bold py-3 rounded-xl flex items-center justify-center gap-2"
      >
        <Plus className="w-4 h-4" /> إضافة منتج جديد
      </button>

      {loading && <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>}

      {!loading && products.length === 0 && (
        <p className="text-center text-sm text-muted-foreground py-10">
          مفيش منتجات لسه. اضغط "إضافة منتج جديد" للبدء.
        </p>
      )}

      {products.map((p) => (
        <div key={p.id} className="bg-card rounded-2xl p-3 flex gap-3 border border-brand-dark/5">
          <div className="w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
            {p.image_url && (
              <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-sm line-clamp-1">{p.name}</h3>
            <p className="text-xs text-muted-foreground mb-1">{p.category}</p>
            <p className="text-brand-accent font-bold text-sm">{formatEGP(Number(p.price))}</p>
          </div>
          <div className="flex flex-col gap-1">
            <button
              onClick={() => setEditing(p)}
              className="w-8 h-8 rounded-lg bg-secondary grid place-items-center"
              aria-label="تعديل"
            >
              <Pencil className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => del(p.id)}
              className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center"
              aria-label="حذف"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}

      {editing && (
        <ProductEditor
          product={editing === "new" ? null : editing}
          categories={categories}
          onClose={() => setEditing(null)}
          onSaved={() => {
            setEditing(null);
            load();
          }}
          sellerId={sellerId}
          isSeller={isSeller}
        />
      )}
    </div>
  );
}

function ProductEditor({
  product,
  categories,
  onClose,
  onSaved,
  sellerId,
  isSeller,
}: {
  product: Product | null;
  categories: Category[];
  onClose: () => void;
  onSaved: () => void;
  sellerId?: string;
  isSeller?: boolean;
}) {
  const meta = product ? MarketplaceStore.getProductMetadata(product.id) : null;
  const [form, setForm] = useState({
    name: product?.name ?? "",
    description: product?.description ?? "",
    price: product?.price?.toString() ?? "",
    image_url: product?.image_url ?? "",
    category: product?.category ?? categories[0]?.name ?? "",
    in_stock: product?.in_stock ?? true,
    featured: product?.featured ?? product?.is_best_seller ?? false,
    is_best_seller: product?.is_best_seller ?? product?.featured ?? false,
    for_women_only: product?.for_women_only ?? false,
    deliveryFee: meta?.deliveryFee?.toString() ?? "",
    colors: (meta?.colors || product?.colors || []).join(", "),
    sizes: (meta?.sizes || product?.sizes || []).join(", "),
    patterns: (meta?.patterns || product?.patterns || []).join(", "),
    area_sqm: product?.area_sqm?.toString() ?? meta?.specifications?.area_sqm ?? "",
    capacity_weight:
      product?.capacity_weight?.toString() ?? meta?.specifications?.capacity_weight ?? "",
  });
  const [saving, setSaving] = useState(false);

  const [galleryAssets, setGalleryAssets] = useState<GalleryAsset[]>(() => {
    if (!product) return [];
    const meta = MarketplaceStore.getProductMetadata(product.id);
    if (meta.images && meta.images.length > 0) {
      return meta.images.map((img, index) => ({
        id: `asset-${index}-${safeRandomUUID()}`,
        url: img.url,
        name: `معرض المنتج ${index + 1}`,
        type: "image",
        size: "310 KB",
        isCover: img.url === product.image_url,
        sortOrder: img.sortOrder ?? index,
      }));
    }
    if (product.image_url) {
      return [
        {
          id: "asset-initial",
          url: product.image_url,
          name: "صورة الغلاف الحالية",
          type: "image",
          size: "310 KB",
          isCover: true,
          sortOrder: 0,
        },
      ];
    }
    return [];
  });

  const handleGalleryChange = (newAssets: GalleryAsset[]) => {
    setGalleryAssets(newAssets);
    const cover = newAssets.find((a) => a.isCover);
    if (cover) {
      setForm((f) => ({ ...f, image_url: cover.url }));
    } else if (newAssets.length > 0) {
      setForm((f) => ({ ...f, image_url: newAssets[0].url }));
    } else {
      setForm((f) => ({ ...f, image_url: "" }));
    }
  };

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.category) return toast.error("اختار قسم الأول من تبويب الأقسام");
    setSaving(true);

    const prodId = product?.id || `prod-${Date.now()}`;
    const colorsArray = form.colors
      .split(",")
      .map((c) => c.trim())
      .filter(Boolean);
    const sizesArray = form.sizes
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);
    const patternsArray = form.patterns
      .split(",")
      .map((p) => p.trim())
      .filter(Boolean);

    const payload = {
      id: prodId,
      name: form.name.trim(),
      description: form.description.trim() || null,
      price: parseFloat(form.price) || 0,
      image_url: form.image_url.trim() || null,
      category: form.category,
      in_stock: form.in_stock,
      featured: form.featured || form.is_best_seller,
      is_best_seller: form.is_best_seller || form.featured,
      for_women_only: form.for_women_only,
      colors: colorsArray.length > 0 ? colorsArray : undefined,
      sizes: sizesArray.length > 0 ? sizesArray : undefined,
      patterns: patternsArray.length > 0 ? patternsArray : undefined,
      area_sqm: form.area_sqm.trim() || undefined,
      capacity_weight: form.capacity_weight.trim() || undefined,
    };

    try {
      const q = product
        ? supabase.from("products").update(payload).eq("id", product.id).select()
        : supabase.from("products").insert(payload).select();
      await q;
    } catch {
      // Fallback
    }

    // Always update local marketplace store so product edits work immediately
    MarketplaceStore.saveCustomProduct(prodId, payload);

    if (sellerId) {
      MultiVendorStorage.setProductSeller(prodId, sellerId);
    }

    const imagesToSave = galleryAssets.map((asset, idx) => ({
      url: asset.url,
      sortOrder: asset.sortOrder ?? idx,
    }));

    MarketplaceStore.saveProductMetadata(prodId, {
      images: imagesToSave,
      colors: colorsArray.length > 0 ? colorsArray : undefined,
      sizes: sizesArray.length > 0 ? sizesArray : undefined,
      patterns: patternsArray.length > 0 ? patternsArray : undefined,
      deliveryFee: parseFloat(form.deliveryFee) || undefined,
      specifications: {
        area_sqm: form.area_sqm.trim(),
        capacity_weight: form.capacity_weight.trim(),
      },
    });

    setSaving(false);
    toast.success("تم حفظ وتحديث بيانات المنتج والمعرض بنجاح!");
    onSaved();
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4">
      <form
        onSubmit={save}
        className="bg-brand-bg w-full max-w-xl rounded-t-3xl sm:rounded-3xl p-6 max-h-[95vh] overflow-y-auto space-y-3 shadow-2xl border border-brand-dark/10"
      >
        <div className="flex justify-between items-center mb-2">
          <h2 className="text-lg font-bold">{product ? "تعديل منتج" : "منتج جديد"}</h2>
          <button
            type="button"
            onClick={onClose}
            className="text-muted-foreground text-sm font-bold"
          >
            إلغاء
          </button>
        </div>

        <AdminField label="اسم المنتج">
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="admin-input"
          />
        </AdminField>

        <AdminField label="الوصف">
          <textarea
            rows={2}
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="admin-input"
          />
        </AdminField>

        <div className="grid grid-cols-2 gap-3">
          <AdminField label="السعر (ج.م)">
            <input
              required
              type="number"
              min="0"
              step="0.01"
              value={form.price}
              onChange={(e) => setForm({ ...form, price: e.target.value })}
              className="admin-input"
            />
          </AdminField>
          <AdminField label="القسم">
            <select
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="admin-input"
            >
              {categories.length === 0 && <option value="">— لا يوجد أقسام —</option>}
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </AdminField>
        </div>

        {/* Colors, Sizes and Patterns Inputs */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <AdminField label="الألوان المتاحة (افصل بفاصلة)">
            <input
              type="text"
              placeholder="أسود, أبيض, بني, بيج, كحلي"
              value={form.colors}
              onChange={(e) => setForm({ ...form, colors: e.target.value })}
              className="admin-input"
            />
          </AdminField>
          <AdminField label="المقاسات والأبعاد (أرقام أو أحرف)">
            <input
              type="text"
              placeholder="38, 39, 40, 41, 42 أو 120x80 سم"
              value={form.sizes}
              onChange={(e) => setForm({ ...form, sizes: e.target.value })}
              className="admin-input"
            />
          </AdminField>
          <AdminField label="النقشات والزخارف (النقاش - افصل بفاصلة)">
            <input
              type="text"
              placeholder="سادة, مودرن, حفر ليزر, كلاسيك"
              value={form.patterns}
              onChange={(e) => setForm({ ...form, patterns: e.target.value })}
              className="admin-input"
            />
          </AdminField>
        </div>

        {/* Real Estate Area & Capacity/Weight Fields */}
        <div className="grid grid-cols-2 gap-3">
          <AdminField label="مساحة العقار / المكان (متر مربع m² - اختياري)">
            <input
              type="text"
              placeholder="مثال: 150 م²"
              value={form.area_sqm}
              onChange={(e) => setForm({ ...form, area_sqm: e.target.value })}
              className="admin-input"
            />
          </AdminField>
          <AdminField label="الحمولة / الوزن / السعة (كجم - اختياري)">
            <input
              type="text"
              placeholder="مثال: 7 كيلو أو 150 كجم"
              value={form.capacity_weight}
              onChange={(e) => setForm({ ...form, capacity_weight: e.target.value })}
              className="admin-input"
            />
          </AdminField>
        </div>

        <div>
          <AdminField label="رسوم الشحن/التوصيل (ج.م)">
            <input
              type="number"
              min="0"
              max="10000"
              placeholder="مثال: 50 ج.م"
              value={form.deliveryFee}
              onChange={(e) => setForm({ ...form, deliveryFee: e.target.value })}
              className="admin-input"
            />
          </AdminField>
        </div>

        {/* Premium Multi-Image management suite */}
        <div className="space-y-1">
          <label className="text-xs font-bold text-brand-dark block">
            معرض صور وتفاصيل المنتج:
          </label>
          <MultiImageUploader assets={galleryAssets} onChange={handleGalleryChange} />
        </div>

        <div className="space-y-2 pt-2">
          <div className="grid grid-cols-2 gap-2">
            <label className="flex items-center gap-2 text-xs font-bold text-brand-dark cursor-pointer bg-white p-2.5 rounded-xl border border-brand-dark/10">
              <input
                type="checkbox"
                checked={form.in_stock}
                onChange={(e) => setForm({ ...form, in_stock: e.target.checked })}
                className="rounded border-brand-dark/20 text-brand-accent focus:ring-brand-accent"
              />
              متوفر بالمخزن
            </label>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-900 cursor-pointer bg-amber-50 p-2.5 rounded-xl border border-amber-200">
              <input
                type="checkbox"
                checked={form.is_best_seller || form.featured}
                onChange={(e) =>
                  setForm({ ...form, is_best_seller: e.target.checked, featured: e.target.checked })
                }
                className="rounded border-amber-300 text-amber-600 focus:ring-amber-500 accent-amber-600"
              />
              يظهر في قائمة الأكثر مبيعاً بالرئيسية ⭐
            </label>
          </div>

          <label className="flex items-center gap-2 text-xs font-bold text-pink-700 bg-pink-50 p-2.5 rounded-xl border border-pink-200">
            <input
              type="checkbox"
              checked={form.for_women_only}
              onChange={(e) => setForm({ ...form, for_women_only: e.target.checked })}
              className="rounded border-pink-300 text-pink-600 focus:ring-pink-500 accent-pink-600"
            />
            خاص بقسم النساء فقط (لن يظهر في الرئيسية أو باقي المتجر)
          </label>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="w-full bg-brand-dark hover:bg-brand-primary text-brand-bg font-bold py-3.5 rounded-xl disabled:opacity-60 mt-4 cursor-pointer text-xs"
        >
          {saving ? "جاري حفظ المنتج..." : "حفظ المنتج والألبوم المرفق"}
        </button>

        <style>{`
          .admin-input {
            width: 100%;
            background: white;
            border: 1px solid oklch(0.9 0.015 70);
            border-radius: 12px;
            padding: 10px 14px;
            font-size: 14px;
            font-family: inherit;
            outline: none;
          }
          .admin-input:focus { border-color: var(--brand-accent); }
        `}</style>
      </form>
    </div>
  );
}

function AdminField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-brand-dark/70">{label}</label>
      {children}
    </div>
  );
}

// ---------- Categories ----------
function CategoriesAdmin({ isSeller, sellerId }: { isSeller?: boolean; sellerId?: string }) {
  const [cats, setCats] = useState<Category[]>([]);
  const [name, setName] = useState("");
  const [desc, setDesc] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedCatForIcon, setSelectedCatForIcon] = useState<Category | null>(null);
  const [catRequests, setCatRequests] = useState(() => MarketplaceStore.getCategoryRequests());

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    let categoryList = (data as Category[]) ?? [];
    if (categoryList.length === 0) {
      categoryList = [
        { id: "cat-1", name: "غرف معيشة", sort_order: 1 },
        { id: "cat-2", name: "غرف نوم", sort_order: 2 },
        { id: "cat-3", name: "طاولات طعام", sort_order: 3 },
        { id: "cat-4", name: "ديكورات", sort_order: 4 },
        { id: "cat-5", name: "أجهزة كهربائية", sort_order: 5 },
      ];
    }
    setCats(categoryList);
    setCatRequests(MarketplaceStore.getCategoryRequests());
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const add = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    if (isSeller) {
      // Seller sends a category request to Super Admin
      const activeSeller = MarketplaceStore.getSellers().find((s) => s.id === sellerId);
      MarketplaceStore.addCategoryRequest({
        sellerId: sellerId || "seller-habiba",
        sellerName: activeSeller?.store_name || "متجر التاجر",
        categoryName: name.trim(),
        description: desc.trim() || "طلب إضافة قسم مخصص جديد للمتجر",
        targetSection: "general",
      });
      setName("");
      setDesc("");
      setCatRequests(MarketplaceStore.getCategoryRequests());
      toast.success("تم إرسال طلب إضافة القسم للسوبر أدمن للاعتماد بنجاح!");
      return;
    }

    // Super Admin adds category directly
    const nextOrder = (cats[cats.length - 1]?.sort_order ?? 0) + 1;
    const { data, error } = await supabase
      .from("categories")
      .insert({ name: name.trim(), sort_order: nextOrder })
      .select();
    if (error) return toast.error("فشل الإضافة: " + error.message);

    const addedCat = data?.[0] || { id: `cat-temp-${Date.now()}` };
    const autoKey = getAutoIconKey(name);
    saveCustomIconMapping(addedCat.id, autoKey);
    saveCustomIconMapping(name.trim(), autoKey);

    setName("");
    setDesc("");
    toast.success("تم إضافة القسم للكتالوج وتخصيص أيقونة تلقائياً له!");
    load();
  };

  const handleApproveRequest = async (reqId: string, categoryName: string) => {
    MarketplaceStore.updateCategoryRequestStatus(reqId, "approved");
    const nextOrder = (cats[cats.length - 1]?.sort_order ?? 0) + 1;
    await supabase.from("categories").insert({ name: categoryName, sort_order: nextOrder });
    const autoKey = getAutoIconKey(categoryName);
    saveCustomIconMapping(categoryName, autoKey);
    toast.success(`تم قبول واعتماد قسم "${categoryName}" وإضافته للماركت بليس!`);
    load();
  };

  const handleRejectRequest = (reqId: string) => {
    MarketplaceStore.updateCategoryRequestStatus(reqId, "rejected");
    toast.error("تم رفض طلب إضافة القسم");
    setCatRequests(MarketplaceStore.getCategoryRequests());
  };

  const rename = async (c: Category) => {
    const val = prompt("اسم القسم الجديد", c.name);
    if (!val || val.trim() === c.name) return;
    const { error } = await supabase.from("categories").update({ name: val.trim() }).eq("id", c.id);
    if (error) return toast.error("فشل التعديل");
    load();
  };

  const del = async (c: Category) => {
    const { error } = await supabase.from("categories").delete().eq("id", c.id);
    if (error) return toast.error("فشل الحذف");
    toast.success("تم حذف القسم بنجاح");
    load();
  };

  const selectIcon = (c: Category, iconKey: string) => {
    saveCustomIconMapping(c.id, iconKey);
    saveCustomIconMapping(c.name, iconKey);
    toast.success(`تم تحديث أيقونة القسم إلى: ${iconKey}`);
    setSelectedCatForIcon(null);
    load();
  };

  return (
    <div className="px-4 space-y-6" dir="rtl">
      {/* Category Submission Form */}
      <div className="bg-card border border-brand-dark/10 p-5 rounded-2xl space-y-3">
        <h3 className="font-extrabold text-sm text-brand-dark">
          {isSeller ? "إرسال طلب إضافة قسم جديد للسوبر أدمن" : "إضافة قسم رئيسي جديد للماركت بليس"}
        </h3>
        <form onSubmit={add} className="flex flex-col sm:flex-row gap-2">
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="اسم القسم الجديد (مثال: مفارش وأغطية فاخرة)"
            className="flex-1 bg-background border border-brand-dark/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent"
          />
          {isSeller && (
            <input
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              placeholder="وصف مختصر للقسم ومبرر الإضافة"
              className="flex-1 bg-background border border-brand-dark/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent"
            />
          )}
          <button
            type="submit"
            className="bg-brand-accent text-brand-dark font-black px-5 py-3 rounded-xl flex items-center justify-center gap-1.5 hover:bg-amber-500 transition cursor-pointer shrink-0"
          >
            <Plus className="w-4 h-4" /> {isSeller ? "إرسال الطلب" : "إضافة القسم"}
          </button>
        </form>
      </div>

      {/* Pending Category Requests (Visible to Super Admin or Seller) */}
      {catRequests.length > 0 && (
        <div className="bg-amber-500/5 border border-amber-500/20 p-4 rounded-2xl space-y-3">
          <h4 className="font-extrabold text-xs text-amber-900 flex items-center gap-2">
            <Tags className="w-4 h-4 text-amber-600" />
            طلبات الأقسام المرسلة من التجار للإعتماد ({catRequests.length})
          </h4>
          <div className="space-y-2">
            {catRequests.map((req) => (
              <div
                key={req.id}
                className="bg-card p-3 rounded-xl border border-brand-dark/5 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
              >
                <div>
                  <span className="font-black text-brand-dark">{req.categoryName}</span>
                  <span className="text-[11px] text-muted-foreground mr-2">
                    (من: {req.sellerName})
                  </span>
                  {req.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5">{req.description}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      req.status === "approved"
                        ? "bg-emerald-100 text-emerald-800"
                        : req.status === "rejected"
                          ? "bg-rose-100 text-rose-800"
                          : "bg-amber-100 text-amber-800"
                    }`}
                  >
                    {req.status === "approved"
                      ? "معتمد"
                      : req.status === "rejected"
                        ? "مرفوض"
                        : "قيد المراجعة"}
                  </span>
                  {!isSeller && req.status === "pending" && (
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleApproveRequest(req.id, req.categoryName)}
                        className="bg-emerald-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-emerald-700 text-[11px] cursor-pointer"
                      >
                        قبول وإضافة
                      </button>
                      <button
                        onClick={() => handleRejectRequest(req.id)}
                        className="bg-rose-600 text-white font-bold px-2.5 py-1 rounded-lg hover:bg-rose-700 text-[11px] cursor-pointer"
                      >
                        رفض
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Icon library selector */}
      {selectedCatForIcon && (
        <div className="bg-brand-bg border border-brand-dark/10 p-4 rounded-2xl space-y-3">
          <div className="flex justify-between items-center border-b pb-2">
            <h4 className="font-bold text-xs text-brand-dark">
              اختر أيقونة للقسم:{" "}
              <span className="text-brand-primary">{selectedCatForIcon.name}</span>
            </h4>
            <button
              onClick={() => setSelectedCatForIcon(null)}
              className="text-[10px] text-muted-foreground hover:underline"
            >
              إلغاء التغيير
            </button>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-8 md:grid-cols-12 gap-2 max-h-40 overflow-y-auto p-1 bg-card border border-brand-dark/5 rounded-xl no-scrollbar">
            {Object.keys(ALL_CATEGORY_ICONS).map((iconKey) => {
              const IconComponent = ALL_CATEGORY_ICONS[iconKey];
              return (
                <button
                  key={iconKey}
                  type="button"
                  title={iconKey}
                  onClick={() => selectIcon(selectedCatForIcon, iconKey)}
                  className="w-10 h-10 rounded-lg flex items-center justify-center hover:bg-brand-accent/20 border border-brand-dark/5 text-brand-dark transition bg-card cursor-pointer"
                >
                  <IconComponent className="w-5 h-5" />
                </button>
              );
            })}
          </div>
        </div>
      )}

      {loading && <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>}

      <div className="space-y-2">
        {cats.map((c) => {
          const IconComponent = getCategoryIcon(c.id || c.name);
          return (
            <div
              key={c.id}
              className="bg-card rounded-2xl p-4 flex items-center justify-between border border-brand-dark/5 hover:border-brand-accent/30 transition duration-200"
            >
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  title="تغيير الأيقونة"
                  onClick={() => !isSeller && setSelectedCatForIcon(c)}
                  className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary hover:bg-brand-accent hover:text-brand-dark flex items-center justify-center transition"
                >
                  <IconComponent className="w-5 h-5" />
                </button>
                <span className="font-bold text-sm">{c.name}</span>
              </div>
              {!isSeller && (
                <div className="flex gap-1">
                  <button
                    onClick={() => setSelectedCatForIcon(c)}
                    className="text-xs text-brand-primary font-bold px-2 py-1 rounded hover:bg-brand-primary/5 transition"
                  >
                    تغيير الأيقونة
                  </button>
                  <button
                    onClick={() => rename(c)}
                    className="w-8 h-8 rounded-lg bg-secondary grid place-items-center hover:bg-secondary/80 transition"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => del(c)}
                    className="w-8 h-8 rounded-lg bg-destructive/10 text-destructive grid place-items-center hover:bg-destructive/20 transition"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ---------- Messages ----------
function MessagesAdmin() {
  const [msgs, setMsgs] = useState<ContactMessage[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("contact_messages")
      .select("*")
      .order("created_at", { ascending: false });
    setMsgs((data as ContactMessage[]) ?? []);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id: string) => {
    await supabase.from("contact_messages").update({ status: "read" }).eq("id", id);
    load();
  };

  const del = async (id: string) => {
    await supabase.from("contact_messages").delete().eq("id", id);
    toast.success("تم حذف الرسالة بنجاح");
    load();
  };

  if (loading)
    return <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>;
  if (msgs.length === 0)
    return <p className="text-center text-sm text-muted-foreground py-16">مفيش رسائل لسه.</p>;

  return (
    <div className="px-4 space-y-3">
      {msgs.map((m) => (
        <div
          key={m.id}
          className={`rounded-2xl p-4 border space-y-2 ${
            m.status === "new"
              ? "bg-brand-accent/10 border-brand-accent/30"
              : "bg-card border-brand-dark/5"
          }`}
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-bold text-sm">{m.name}</h3>
              <a
                href={`tel:${m.phone}`}
                className="text-xs text-brand-primary font-semibold"
                dir="ltr"
              >
                {m.phone}
              </a>
            </div>
            <span className="text-[10px] text-muted-foreground">
              {new Date(m.created_at).toLocaleString("ar-EG", {
                dateStyle: "short",
                timeStyle: "short",
              })}
            </span>
          </div>
          <p className="text-sm bg-brand-bg rounded-lg p-3">{m.message}</p>
          <div className="flex gap-2 pt-1">
            <a
              href={`https://wa.me/${m.phone.replace(/\D/g, "").replace(/^0/, "20")}`}
              target="_blank"
              rel="noreferrer"
              className="flex-1 bg-brand-dark text-brand-bg text-xs font-bold py-2 rounded-lg text-center"
            >
              رد واتساب
            </a>
            {m.status === "new" && (
              <button
                onClick={() => markRead(m.id)}
                className="px-3 bg-secondary text-xs font-bold py-2 rounded-lg"
              >
                تم القراءة
              </button>
            )}
            <button
              onClick={() => del(m.id)}
              className="w-9 rounded-lg bg-destructive/10 text-destructive grid place-items-center"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

// ---------- Settings ----------
function SettingsAdmin() {
  const [s, setS] = useState<SiteSettings | null>(null);
  const [themeConf, setThemeConf] = useState<WebsiteThemeSettings>(() =>
    MarketplaceStore.getDefaultThemeSettings(),
  );
  const [billing, setBilling] = useState<BillingSettings>(() =>
    MultiVendorStorage.getBillingSettings(),
  );
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setThemeConf(MarketplaceStore.getSiteThemeSettings());
    supabase
      .from("site_settings")
      .select("*")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => {
        setS(
          (data as SiteSettings | null) ?? {
            id: 1,
            phone: "",
            whatsapp: "",
            email: "",
            address: "",
            facebook: "",
            instagram: "",
            about: "",
          },
        );
        setLoading(false);
      });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!s) return;
    setSaving(true);
    const { error } = await supabase.from("site_settings").upsert({ ...s, id: 1 });

    // Save theme configurations
    MarketplaceStore.saveSiteThemeSettings(themeConf);
    window.dispatchEvent(new Event("beitak-theme-updated"));

    // Save billing & commissions settings
    MultiVendorStorage.saveBillingSettings(billing);

    setSaving(false);
    if (error) return toast.error("فشل الحفظ: " + error.message);
    toast.success("تم حفظ إعدادات الموقع والفوترة وتحديث الهوية البصرية بنجاح!");
  };

  if (loading || !s)
    return <p className="text-center text-sm text-muted-foreground py-8">جاري التحميل...</p>;

  const upd = <K extends keyof SiteSettings>(k: K, v: SiteSettings[K]) => setS({ ...s, [k]: v });
  const updTheme = <K extends keyof WebsiteThemeSettings>(k: K, v: WebsiteThemeSettings[K]) => {
    const updated = {
      ...themeConf,
      [k]: v,
      ...(k === "brandPrimary" ? { homepagePrimary: v as string } : {}),
      ...(k === "brandAccent" ? { homepageAccent: v as string } : {}),
      ...(k === "homepagePrimary" ? { brandPrimary: v as string } : {}),
      ...(k === "homepageAccent" ? { brandAccent: v as string } : {}),
      ...(k === "homepageBg" ? { brandBg: v as string } : {}),
      ...(k === "homepageText" ? { brandDark: v as string } : {}),
    };

    setThemeConf(updated);
    // Preview immediately!
    MarketplaceStore.saveSiteThemeSettings(updated);
    window.dispatchEvent(new Event("beitak-theme-updated"));
  };

  return (
    <form onSubmit={save} className="px-4 space-y-4 pb-12">
      {/* Visual Identity Section */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 border-b border-brand-dark/5 pb-2 mb-2">
          🎨 التحكم الكامل بالهوية والألوان والخطوط (Super Admin)
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <SetField label="قالب الموقع والمظهر">
            <select
              value={themeConf.themeMode}
              onChange={(e) => updTheme("themeMode", e.target.value as "light" | "dark" | "luxury")}
              className="set-input"
            >
              <option value="light">مظهر دافئ عاجي (Warm Light)</option>
              <option value="dark">مظهر داكن فخم (Dark Mode)</option>
              <option value="luxury">مظهر ملكي ذهبي (Midnight Luxury)</option>
            </select>
          </SetField>

          <SetField label="خط الكتابة الأساسي">
            <select
              value={themeConf.primaryFont}
              onChange={(e) => updTheme("primaryFont", e.target.value)}
              className="set-input"
            >
              <option value="Cairo">خط القاهرة الأنيق (Cairo Serif)</option>
              <option value="Cairo-Sans">خط القاهرة العصري (Cairo Sans)</option>
              <option value="Cairo-Mono">خط المبرمجين التكنولوجي (Fira Code)</option>
            </select>
          </SetField>
        </div>

        <div className="grid grid-cols-2 gap-3 pt-1">
          <SetField label="اللون الأساسي للعلامة">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={
                  themeConf.brandPrimary.startsWith("oklch") ? "#8C6A5D" : themeConf.brandPrimary
                }
                onChange={(e) => updTheme("brandPrimary", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                {themeConf.brandPrimary}
              </span>
            </div>
          </SetField>

          <SetField label="لون اللمسات الذهبية (Accent)">
            <div className="flex gap-2 items-center">
              <input
                type="color"
                value={
                  themeConf.brandAccent.startsWith("oklch") ? "#C5A059" : themeConf.brandAccent
                }
                onChange={(e) => updTheme("brandAccent", e.target.value)}
                className="w-10 h-10 rounded-lg cursor-pointer border-none p-0"
              />
              <span className="text-[10px] font-mono text-muted-foreground">
                {themeConf.brandAccent}
              </span>
            </div>
          </SetField>
        </div>
      </div>

      {/* Pages and Navigation toggles */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 border-b border-brand-dark/5 pb-2 mb-2">
          ⚙️ إدارة الصفحات والقوائم الذكية
        </h3>

        <div className="grid grid-cols-2 gap-3">
          <label className="flex items-center gap-2 bg-brand-bg rounded-xl p-3 border border-brand-dark/5 cursor-pointer">
            <input
              type="checkbox"
              checked={themeConf.showLoyalty}
              onChange={(e) => updTheme("showLoyalty", e.target.checked)}
              className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent"
            />
            <span className="text-xs font-bold">بوابة الولاء والنقاط</span>
          </label>

          <label className="flex items-center gap-2 bg-brand-bg rounded-xl p-3 border border-brand-dark/5 cursor-pointer">
            <input
              type="checkbox"
              checked={themeConf.showBlog}
              onChange={(e) => updTheme("showBlog", e.target.checked)}
              className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent"
            />
            <span className="text-xs font-bold">تفعيل المدونة والمقالات</span>
          </label>
        </div>
      </div>

      {/* Site Builder Section */}
      <div className="bg-card border border-brand-dark/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 border-b border-brand-dark/5 pb-2 mb-2">
          📐 منشئ الهوية المرئية وتخصيص الموقع (Site Builder)
        </h3>

        <div className="space-y-3">
          <div className="bg-secondary/15 p-3 rounded-xl border border-brand-dark/5 space-y-2">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ تعديل وترتيب الهيدر (Header Customization):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SetField label="شكل القائمة والهيدر">
                <select
                  value={themeConf.headerStyle || "split"}
                  onChange={(e) => updTheme("headerStyle", e.target.value as "centered" | "split")}
                  className="set-input"
                >
                  <option value="split">هيدر عصري مقسم (لوجو بالجانب)</option>
                  <option value="centered">هيدر ملكي ممركز (لوجو بالمنتصف)</option>
                </select>
              </SetField>
              <SetField label="شريط الإعلان أعلى الصفحة">
                <input
                  type="text"
                  value={themeConf.headerAnnouncement ?? ""}
                  onChange={(e) => updTheme("headerAnnouncement", e.target.value)}
                  placeholder="مثال: شحن مجاني بمناسبة العام الجديد!"
                  className="set-input"
                />
              </SetField>
            </div>
          </div>

          <div className="bg-secondary/15 p-3 rounded-xl border border-brand-dark/5 space-y-2">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ تعديل البانر الرئيسي والواجهة (Hero Banner):
            </span>
            <div className="space-y-2.5">
              <SetField label="رابط صورة خلفية البانر (اتركه فارغاً للافتراضي اللطيف)">
                <input
                  type="text"
                  value={themeConf.bannerUrl ?? ""}
                  onChange={(e) => updTheme("bannerUrl", e.target.value)}
                  placeholder="رابط الصورة (https://...)"
                  className="set-input font-mono text-[11px]"
                  dir="ltr"
                />
              </SetField>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <SetField label="العنوان الرئيسي العريض للبانر">
                  <input
                    type="text"
                    value={themeConf.bannerTitle ?? ""}
                    onChange={(e) => updTheme("bannerTitle", e.target.value)}
                    placeholder="أثاث منزلي يناسب ذوقك"
                    className="set-input"
                  />
                </SetField>
                <SetField label="نص زر الشراء والانتقال (CTA Button)">
                  <input
                    type="text"
                    value={themeConf.bannerCtaText ?? ""}
                    onChange={(e) => updTheme("bannerCtaText", e.target.value)}
                    placeholder="تسوق التشكيلة الآن"
                    className="set-input"
                  />
                </SetField>
              </div>
              <SetField label="العنوان الفرعي ووصف البانر المساعد">
                <textarea
                  rows={2}
                  value={themeConf.bannerSubtitle ?? ""}
                  onChange={(e) => updTheme("bannerSubtitle", e.target.value)}
                  placeholder="اكتشف أحدث تشكيلة من غرف المعيشة والمفروشات..."
                  className="set-input"
                />
              </SetField>
            </div>
          </div>

          <div className="bg-secondary/15 p-3 rounded-xl border border-brand-dark/5 space-y-2">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ تعديل نصوص الأقسام والواجهة الرئيسية (Homepage Sections Texts):
            </span>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <SetField label="عنوان قسم تصفح حسب القسم">
                <input
                  type="text"
                  value={themeConf.categoriesTitle ?? ""}
                  onChange={(e) => updTheme("categoriesTitle", e.target.value)}
                  placeholder="تسوق حسب القسم"
                  className="set-input"
                />
              </SetField>
              <SetField label="عنوان قسم الأكثر مبيعاً">
                <input
                  type="text"
                  value={themeConf.featuredTitle ?? ""}
                  onChange={(e) => updTheme("featuredTitle", e.target.value)}
                  placeholder="الأكثر مبيعاً"
                  className="set-input"
                />
              </SetField>
              <SetField label="عنوان قسم وصل حديثاً">
                <input
                  type="text"
                  value={themeConf.latestTitle ?? ""}
                  onChange={(e) => updTheme("latestTitle", e.target.value)}
                  placeholder="وصل حديثاً"
                  className="set-input"
                />
              </SetField>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2">
              <SetField label="عنوان بانر الترويج السفلي (CTA)">
                <input
                  type="text"
                  value={themeConf.ctaTitle ?? ""}
                  onChange={(e) => updTheme("ctaTitle", e.target.value)}
                  placeholder="جاهز تطلب؟"
                  className="set-input"
                />
              </SetField>
              <SetField label="الوصف الفرعي لبانر الترويج (CTA)">
                <input
                  type="text"
                  value={themeConf.ctaSubtitle ?? ""}
                  onChange={(e) => updTheme("ctaSubtitle", e.target.value)}
                  placeholder="اختار قطعك واملأ بياناتك وهنوصلك..."
                  className="set-input"
                />
              </SetField>
              <SetField label="نص زر بانر الترويج (CTA Button)">
                <input
                  type="text"
                  value={themeConf.ctaButtonText ?? ""}
                  onChange={(e) => updTheme("ctaButtonText", e.target.value)}
                  placeholder="ابدأ التسوق"
                  className="set-input"
                />
              </SetField>
            </div>
          </div>

          <div className="bg-secondary/15 p-3 rounded-xl border border-brand-dark/5 space-y-2">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ تعديل الفوتر (Footer Customization):
            </span>
            <SetField label="حقوق النشر والنص المذيل بأسفل الموقع">
              <input
                type="text"
                value={themeConf.footerText ?? ""}
                onChange={(e) => updTheme("footerText", e.target.value)}
                placeholder="© 2026 بيتك للاثاث والمفروشات. جميع الحقوق محفوظة."
                className="set-input"
              />
            </SetField>
          </div>

          {/* Preset Theme Selection & Layout Ordering */}
          <div className="bg-secondary/15 p-4 rounded-xl border border-brand-dark/5 space-y-4">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ قالب التنسيق الجاهز وترتيب أقسام الصفحة الرئيسية:
            </span>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <SetField label="قالب الواجهة والجماليات الجاهز (Preset Theme)">
                <select
                  value={themeConf.presetTheme || "modern"}
                  onChange={(e) => updTheme("presetTheme", e.target.value)}
                  className="set-input"
                >
                  <option value="modern">Modern Marketplace (عصري متكامل)</option>
                  <option value="luxury">Luxury Heritage (تراثي فخم)</option>
                  <option value="fashion">Boutique Fashion (موضة وملابس)</option>
                  <option value="electronics">Tech Store (أجهزة وإلكترونيات)</option>
                  <option value="furniture">Home & Furniture (أثاث ومفروشات)</option>
                  <option value="minimal">Nordic Minimalist (بسيط ومريح)</option>
                  <option value="elegant">Royal Gold (ذهبي وأنيق)</option>
                </select>
              </SetField>
            </div>

            {/* Interactive Section Reordering & Visibility */}
            <div className="space-y-2 pt-2">
              <span className="text-[10px] font-bold text-brand-dark block">
                ترتيب وتفعيل أقسام الصفحة الرئيسية:
              </span>
              <p className="text-[9px] text-muted-foreground">
                استخدم الأسهم لنقل وترتيب الأقسام لأعلى وأسفل، وحدد المربع لتفعيل ظهور القسم أو
                إخفائه فورياً.
              </p>

              <div className="space-y-2 bg-brand-bg p-3 rounded-xl border border-brand-dark/5">
                {(
                  themeConf.homepageSections || [
                    "hero",
                    "trust",
                    "categories",
                    "vertical_banners",
                    "featured",
                    "latest",
                    "cta",
                  ]
                ).map((secId, index, arr) => {
                  const arabicNames: Record<string, string> = {
                    hero: "البانر والواجهة الرئيسية (Hero Banner)",
                    trust: "شريط الميزات والضمانات (Trust Badges)",
                    categories: "تصفح حسب الأقسام (Categories Explorer)",
                    vertical_banners: "البانرات الإعلانية الثنائية الرأسية",
                    featured: "المنتجات المميزة والأكثر مبيعاً",
                    latest: "وصل حديثاً وأحدث المعروضات",
                    cta: "بانر الترويج وتحميل التطبيق (CTA Banner)",
                  };

                  const isVisible = !(themeConf.hiddenSections || []).includes(secId);

                  // Move section logic
                  const moveSection = (dir: "up" | "down") => {
                    const sections = [
                      ...(themeConf.homepageSections || [
                        "hero",
                        "trust",
                        "categories",
                        "vertical_banners",
                        "featured",
                        "latest",
                        "cta",
                      ]),
                    ];
                    const targetIdx = dir === "up" ? index - 1 : index + 1;
                    if (targetIdx >= 0 && targetIdx < sections.length) {
                      const temp = sections[index];
                      sections[index] = sections[targetIdx];
                      sections[targetIdx] = temp;
                      updTheme("homepageSections", sections);
                    }
                  };

                  // Toggle section logic
                  const toggleSection = () => {
                    const hidden = [...(themeConf.hiddenSections || [])];
                    if (isVisible) {
                      hidden.push(secId);
                    } else {
                      const idx = hidden.indexOf(secId);
                      if (idx > -1) hidden.splice(idx, 1);
                    }
                    updTheme("hiddenSections", hidden);
                  };

                  return (
                    <div
                      key={secId}
                      className="flex items-center justify-between bg-card px-3 py-2.5 rounded-lg border border-brand-dark/5 text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={isVisible}
                          onChange={toggleSection}
                          className="w-3.5 h-3.5 rounded text-brand-primary"
                        />
                        <span
                          className={`font-semibold ${isVisible ? "text-brand-dark" : "text-muted-foreground line-through"}`}
                        >
                          {arabicNames[secId] || secId}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          disabled={index === 0}
                          onClick={() => moveSection("up")}
                          className="p-1 hover:bg-secondary rounded disabled:opacity-30 text-[11px] font-bold cursor-pointer"
                        >
                          ▲
                        </button>
                        <button
                          type="button"
                          disabled={index === arr.length - 1}
                          onClick={() => moveSection("down")}
                          className="p-1 hover:bg-secondary rounded disabled:opacity-30 text-[11px] font-bold cursor-pointer"
                        >
                          ▼
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Custom Color Overrides & Palette Picker */}
          <div className="bg-secondary/15 p-4 rounded-xl border border-brand-dark/5 space-y-4">
            <span className="text-[10px] font-black text-brand-primary block">
              ✦ نظام الألوان المخصص وتعديل ألوان الخلفيات لكل عنصر بالصفحة الرئيسية:
            </span>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3">
              <SetField label="خلفية الصفحة الرئيسية">
                <input
                  type="color"
                  value={themeConf.homepageBg || "#FBF9F4"}
                  onChange={(e) => updTheme("homepageBg", e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer p-0"
                />
              </SetField>
              <SetField label="لون النصوص الأساسي">
                <input
                  type="color"
                  value={themeConf.homepageText || "#2C2621"}
                  onChange={(e) => updTheme("homepageText", e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer p-0"
                />
              </SetField>
              <SetField label="اللون الأساسي">
                <input
                  type="color"
                  value={themeConf.homepagePrimary || "#8C6A5D"}
                  onChange={(e) => updTheme("homepagePrimary", e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer p-0"
                />
              </SetField>
              <SetField label="لون اللمسات الفرعية">
                <input
                  type="color"
                  value={themeConf.homepageAccent || "#C5A059"}
                  onChange={(e) => updTheme("homepageAccent", e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer p-0"
                />
              </SetField>
              <SetField label="خلفية كروت المنتجات">
                <input
                  type="color"
                  value={themeConf.homepageCard || "#FFFFFF"}
                  onChange={(e) => updTheme("homepageCard", e.target.value)}
                  className="w-full h-8 rounded-lg cursor-pointer p-0"
                />
              </SetField>
            </div>

            <div className="space-y-1 pt-1.5">
              <span className="text-[10px] font-bold text-brand-dark block">
                قوالب تناسق الألوان السريعة بنقرة واحدة:
              </span>
              <div className="flex flex-wrap gap-2">
                {[
                  {
                    name: "العاجي الدافئ",
                    bg: "#FBF9F4",
                    text: "#2C2621",
                    primary: "#8C6A5D",
                    accent: "#C5A059",
                    card: "#FFFFFF",
                  },
                  {
                    name: "الفخامة الملكية",
                    bg: "#0D0C0A",
                    text: "#FFFFFF",
                    primary: "#C5A059",
                    accent: "#E5C185",
                    card: "#191714",
                  },
                  {
                    name: "الغابة الزيتية",
                    bg: "#F4F6F4",
                    text: "#1F2E1F",
                    primary: "#2D5A27",
                    accent: "#A3B19B",
                    card: "#FFFFFF",
                  },
                  {
                    name: "الكلاسيكي المريح",
                    bg: "#FFFFFF",
                    text: "#1A1A1A",
                    primary: "#000000",
                    accent: "#555555",
                    card: "#F7F7F7",
                  },
                  {
                    name: "المحيط الأزرق",
                    bg: "#F0F4F8",
                    text: "#102A43",
                    primary: "#1982C4",
                    accent: "#FFCA3A",
                    card: "#FFFFFF",
                  },
                ].map((pal) => (
                  <button
                    key={pal.name}
                    type="button"
                    onClick={() => {
                      updTheme("homepageBg", pal.bg);
                      updTheme("homepageText", pal.text);
                      updTheme("homepagePrimary", pal.primary);
                      updTheme("homepageAccent", pal.accent);
                      updTheme("homepageCard", pal.card);
                      toast.success(`تم تطبيق باليتة "${pal.name}" بنجاح!`);
                    }}
                    className="text-[10px] bg-brand-bg border border-brand-dark/10 px-2.5 py-1 rounded-lg hover:border-brand-primary text-brand-dark font-medium transition cursor-pointer"
                  >
                    {pal.name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* General Site settings */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-3">
        <h3 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 border-b border-brand-dark/5 pb-2 mb-2">
          📞 معلومات التواصل وموقع العرض
        </h3>

        <SetField label="عن الموقع (قصير)">
          <textarea
            rows={2}
            value={s.about ?? ""}
            onChange={(e) => upd("about", e.target.value)}
            className="set-input"
          />
        </SetField>

        <div className="grid grid-cols-2 gap-3">
          <SetField label="رقم التليفون">
            <input
              value={s.phone ?? ""}
              onChange={(e) => upd("phone", e.target.value)}
              className="set-input"
              dir="ltr"
            />
          </SetField>
          <SetField label="رقم واتساب للرد المباشر">
            <input
              value={s.whatsapp ?? ""}
              onChange={(e) => upd("whatsapp", e.target.value)}
              className="set-input"
              dir="ltr"
            />
          </SetField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SetField label="الإيميل">
            <input
              value={s.email ?? ""}
              onChange={(e) => upd("email", e.target.value)}
              className="set-input"
              dir="ltr"
            />
          </SetField>
          <SetField label="العنوان الجغرافي للمقر">
            <input
              value={s.address ?? ""}
              onChange={(e) => upd("address", e.target.value)}
              className="set-input"
            />
          </SetField>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <SetField label="رابط صفحة فيسبوك">
            <input
              value={s.facebook ?? ""}
              onChange={(e) => upd("facebook", e.target.value)}
              className="set-input"
              dir="ltr"
            />
          </SetField>
          <SetField label="رابط حساب انستجرام">
            <input
              value={s.instagram ?? ""}
              onChange={(e) => upd("instagram", e.target.value)}
              className="set-input"
              dir="ltr"
            />
          </SetField>
        </div>
      </div>

      {/* Super Admin Billing & Commissions Settings Panel */}
      <div className="bg-card border border-brand-dark/5 p-5 rounded-2xl space-y-4">
        <h3 className="text-xs font-bold text-brand-primary flex items-center gap-1.5 border-b border-brand-dark/5 pb-2 mb-2">
          💰 إعدادات العمولات والفوترة والمديونية (Super Admin Settings)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <SetField label="فترة استحقاق سداد العمولة بالبائع (أيام)">
            <input
              type="number"
              value={billing.commissionDuePeriodDays}
              onChange={(e) =>
                setBilling({ ...billing, commissionDuePeriodDays: Number(e.target.value) })
              }
              className="set-input"
              min={1}
            />
          </SetField>

          <SetField label="دورة الفوترة الدورية للمتاجر">
            <select
              value={billing.billingCycle}
              onChange={(e) =>
                setBilling({ ...billing, billingCycle: e.target.value as "monthly" | "weekly" })
              }
              className="set-input"
            >
              <option value="monthly">فوترة دورية شهرية (سجل فواتير شهري)</option>
              <option value="weekly">فوترة دورية أسبوعية (كل 7 أيام)</option>
            </select>
          </SetField>

          <SetField label="الحد الأقصى للمديونية قبل التحذير/التعليق (ج.م)">
            <input
              type="number"
              value={billing.outstandingBalanceRuleLimit}
              onChange={(e) =>
                setBilling({ ...billing, outstandingBalanceRuleLimit: Number(e.target.value) })
              }
              className="set-input"
              min={0}
            />
          </SetField>

          <SetField label="نسبة العمولة الافتراضية للمنصة (%)">
            <input
              type="number"
              value={billing.commissionRateDefault}
              onChange={(e) =>
                setBilling({ ...billing, commissionRateDefault: Number(e.target.value) })
              }
              className="set-input"
              min={0}
              max={100}
            />
          </SetField>

          <SetField label="قيمة خطة الاشتراك الشهري للبائعين (ج.م)">
            <input
              type="number"
              value={billing.subscriptionPlanPrice}
              onChange={(e) =>
                setBilling({ ...billing, subscriptionPlanPrice: Number(e.target.value) })
              }
              className="set-input"
              min={0}
            />
          </SetField>

          <SetField label="نسبة غرامة التأخير في السداد (%)">
            <input
              type="number"
              value={billing.lateFeePercentage}
              onChange={(e) =>
                setBilling({ ...billing, lateFeePercentage: Number(e.target.value) })
              }
              className="set-input"
              min={0}
              max={100}
            />
          </SetField>
        </div>

        <div className="space-y-3.5 pt-2">
          <SetField label="طرق الدفع والتحويل المعتمدة لسداد عمولات البائعين (مفصولة بفاصلة)">
            <input
              type="text"
              value={billing.paymentMethods.join(", ")}
              onChange={(e) =>
                setBilling({
                  ...billing,
                  paymentMethods: e.target.value
                    .split(",")
                    .map((m) => m.trim())
                    .filter(Boolean),
                })
              }
              className="set-input text-xs"
              placeholder="مثال: فودافون كاش, إنستا باي, تحويل بنكي"
            />
          </SetField>

          <label className="flex items-center gap-2 bg-brand-bg rounded-xl p-3 border border-brand-dark/5 cursor-pointer">
            <input
              type="checkbox"
              checked={billing.automaticRemindersEnabled}
              onChange={(e) =>
                setBilling({ ...billing, automaticRemindersEnabled: e.target.checked })
              }
              className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent"
            />
            <div className="text-xs">
              <span className="font-bold block text-brand-dark">
                تفعيل رسائل التذكير التلقائية بالبريد والواتساب
              </span>
              <span className="text-muted-foreground text-[10px]">
                يقوم النظام بإرسال تذكير أسبوعي وقبل يومين من تاريخ الاستحقاق لتنبيه البائعين
                المديونين تلقائياً.
              </span>
            </div>
          </label>
        </div>
      </div>

      <button
        type="submit"
        disabled={saving}
        className="w-full bg-brand-dark hover:bg-brand-primary text-brand-bg font-bold py-3.5 rounded-xl disabled:opacity-60 transition cursor-pointer text-sm"
      >
        {saving ? "جاري حفظ كل الإعدادات..." : "حفظ وتثبيت إعدادات الموقع والهوية الفورية"}
      </button>

      <style>{`
        .set-input {
          width: 100%;
          background: white;
          border: 1px solid oklch(0.9 0.015 70);
          border-radius: 12px;
          padding: 10px 14px;
          font-size: 13px;
          font-family: inherit;
          outline: none;
        }
        .set-input:focus { border-color: var(--brand-accent); }
      `}</style>
    </form>
  );
}

function SetField({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block text-xs font-semibold mb-1.5 text-brand-dark/70">{label}</label>
      {children}
    </div>
  );
}

// ---------- Orders ----------
function OrdersAdmin({ sellerId, isSeller }: { sellerId?: string; isSeller?: boolean }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  const load = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false });

    let list = (data as unknown as Order[]) ?? [];
    if (isSeller && sellerId) {
      list = list.filter((order) => {
        try {
          const itemsArray = (
            typeof order.items === "string" ? JSON.parse(order.items) : order.items
          ) as Array<{ id: string }>;
          return itemsArray.some(
            (item) => MultiVendorStorage.getProductSeller(item.id) === sellerId,
          );
        } catch {
          // If items isn't parseable, fall back to owner map check if available
          return false;
        }
      });
    }

    setOrders(list);
    setLoading(false);
  };

  useEffect(() => {
    load();
  }, []);

  const updateStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) return toast.error("فشل التحديث");
    toast.success("تم التحديث");
    load();
  };

  const del = async (id: string) => {
    const { error } = await supabase.from("orders").delete().eq("id", id);
    if (error) return toast.error("فشل الحذف");
    toast.success("تم حذف الطلب بنجاح");
    load();
  };

  // Filter logic
  const filteredOrders = orders.filter((o) => {
    const q = searchQuery.toLowerCase().trim();
    const matchesSearch =
      !q ||
      o.customer_name?.toLowerCase().includes(q) ||
      o.phone?.includes(q) ||
      o.id?.toLowerCase().includes(q) ||
      o.governorate?.toLowerCase().includes(q) ||
      o.area?.toLowerCase().includes(q);

    const matchesStatus = statusFilter === "all" || o.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  // Pagination logic
  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  // Reset page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchQuery, statusFilter]);

  return (
    <div className="px-4 space-y-4">
      {/* Search and Filters Bar */}
      <div className="flex flex-col md:flex-row gap-3 bg-card border border-brand-dark/5 p-4 rounded-2xl">
        {/* Search input */}
        <div className="relative flex-1">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="البحث باسم العميل، الهاتف، المحافظة أو رقم الطلب..."
            className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl pr-10 pl-3 py-2.5 focus:outline-none focus:border-brand-primary text-right"
            dir="rtl"
          />
          <Search className="w-4 h-4 text-muted-foreground absolute right-3.5 top-1/2 -translate-y-1/2" />
        </div>

        {/* Status filter select */}
        <div className="flex gap-2 min-w-[200px]">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-primary font-semibold text-right"
            dir="rtl"
          >
            <option value="all">كل الطلبات ({orders.length})</option>
            <option value="new">جديد</option>
            <option value="confirmed">تم التأكيد</option>
            <option value="shipping">في الطريق</option>
            <option value="delivered">تم التوصيل</option>
            <option value="cancelled">ملغي</option>
          </select>

          {/* Sync / Reload button */}
          <button
            onClick={load}
            disabled={loading}
            className="bg-brand-bg hover:bg-brand-dark/5 text-brand-dark border border-brand-dark/10 rounded-xl p-2.5 transition flex items-center justify-center"
            title="تحديث البيانات"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin text-brand-primary" : ""}`} />
          </button>
        </div>
      </div>

      {loading ? (
        <p className="text-center text-sm text-muted-foreground py-8 animate-pulse">
          جاري التحميل...
        </p>
      ) : paginatedOrders.length === 0 ? (
        <p className="text-center text-sm text-muted-foreground py-16 bg-card border border-brand-dark/5 rounded-2xl">
          مفيش طلبات مطابقة للبحث أو الفلتر.
        </p>
      ) : (
        <div className="space-y-3">
          {paginatedOrders.map((o) => (
            <div
              key={o.id}
              className="bg-card rounded-2xl p-4 border border-brand-dark/5 space-y-2 hover:shadow-sm transition"
            >
              <div className="flex justify-between items-start gap-2">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-sm text-brand-dark">{o.customer_name}</h3>
                    <span className="text-[10px] bg-brand-primary/10 text-brand-primary font-mono font-bold px-1.5 py-0.5 rounded">
                      #{o.id.slice(0, 8)}
                    </span>
                  </div>
                  <a
                    href={`tel:${o.phone}`}
                    className="text-xs text-brand-primary font-semibold block mt-0.5 hover:underline"
                    dir="ltr"
                  >
                    {o.phone}
                  </a>
                </div>
                <StatusBadge status={o.status} />
              </div>

              <div className="text-[10px] text-muted-foreground flex items-center gap-1.5">
                <span>تاريخ الطلب:</span>
                <span className="font-semibold text-brand-dark/85">
                  {new Date(o.created_at).toLocaleString("ar-EG", {
                    dateStyle: "medium",
                    timeStyle: "short",
                  })}
                </span>
              </div>

              <div className="text-xs bg-secondary rounded-lg p-2.5">
                <div className="font-bold text-brand-dark">
                  {o.governorate} — {o.area}
                </div>
                <div className="text-brand-dark/70 mt-0.5 text-[11px] leading-relaxed">
                  {o.address}
                </div>
                {o.notes && (
                  <div className="text-brand-dark/70 mt-1.5 text-[11px] font-medium bg-amber-50/75 border border-amber-100 p-1.5 rounded">
                    📝 ملاحظات: {o.notes}
                  </div>
                )}
              </div>

              <div className="text-xs space-y-1 border-t border-brand-dark/5 pt-2">
                {(() => {
                  try {
                    const parsedItems =
                      (typeof o.items === "string" ? JSON.parse(o.items) : o.items) || [];
                    if (!Array.isArray(parsedItems)) return null;
                    return parsedItems.map(
                      (it: { name: string; price: number; quantity: number }, i: number) => (
                        <div
                          key={i}
                          className="flex justify-between text-[11px] text-brand-dark/80"
                        >
                          <span>
                            {it.name} × {it.quantity}
                          </span>
                          <span className="text-brand-dark font-bold font-mono">
                            {formatEGP((Number(it.price) || 0) * (Number(it.quantity) || 1))}
                          </span>
                        </div>
                      ),
                    );
                  } catch {
                    return null;
                  }
                })()}
              </div>

              <div className="flex justify-between items-center border-t border-brand-dark/5 pt-2">
                <span className="text-xs text-muted-foreground font-bold">
                  إجمالي الحساب (الدفع عند الاستلام)
                </span>
                <span className="text-brand-accent font-extrabold text-sm">
                  {formatEGP(Number(o.total))}
                </span>
              </div>

              <div className="flex gap-2 pt-1 border-t border-brand-dark/5 mt-2">
                <select
                  value={o.status}
                  onChange={(e) => updateStatus(o.id, e.target.value)}
                  className="flex-1 bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none focus:border-brand-primary"
                >
                  <option value="new">جديد</option>
                  <option value="confirmed">تم التأكيد</option>
                  <option value="shipping">في الطريق</option>
                  <option value="delivered">تم التوصيل</option>
                  <option value="cancelled">ملغي</option>
                </select>
                <button
                  onClick={() => del(o.id)}
                  className="w-9 h-9 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/20 transition grid place-items-center"
                  title="حذف الطلب"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}

          {/* Pagination Footer */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between bg-card border border-brand-dark/5 p-3 rounded-2xl mt-4">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-brand-dark/10 bg-brand-bg hover:bg-brand-dark/5 disabled:opacity-30 disabled:hover:bg-brand-bg transition"
              >
                <ChevronRight className="w-4 h-4" />
                السابق
              </button>

              <span className="text-xs font-bold text-muted-foreground">
                صفحة <span className="text-brand-primary">{currentPage}</span> من {totalPages} (
                {totalItems} طلب)
              </span>

              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border border-brand-dark/10 bg-brand-bg hover:bg-brand-dark/5 disabled:opacity-30 disabled:hover:bg-brand-bg transition"
              >
                التالي
                <ChevronLeft className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { label: string; cls: string }> = {
    new: { label: "جديد", cls: "bg-brand-accent/20 text-brand-dark" },
    confirmed: { label: "تم التأكيد", cls: "bg-blue-100 text-blue-800" },
    shipping: { label: "في الطريق", cls: "bg-purple-100 text-purple-800" },
    delivered: { label: "تم التوصيل", cls: "bg-green-100 text-green-800" },
    cancelled: { label: "ملغي", cls: "bg-red-100 text-red-800" },
  };
  const s = map[status] ?? map.new;
  return <span className={`text-[10px] font-bold px-2 py-1 rounded-full ${s.cls}`}>{s.label}</span>;
}

// ---------- Facebook ----------
type FbStatus = {
  id: string;
  page_id: string;
  page_name: string | null;
  auto_sync: boolean;
  last_sync_at: string | null;
} | null;

type SyncLog = {
  id: string;
  kind: string;
  status: string;
  message: string | null;
  fb_post_id: string | null;
  product_id: string | null;
  created_at: string;
};

function FacebookAdmin() {
  const statusFn = useServerFn(getFacebookStatus);
  const connectFn = useServerFn(connectFacebook);
  const disconnectFn = useServerFn(disconnectFacebook);
  const autoSyncFn = useServerFn(setAutoSync);
  const syncNowFn = useServerFn(syncFacebookNow);
  const logsFn = useServerFn(getSyncLogs);

  const [status, setStatus] = useState<FbStatus>(null);
  const [logs, setLogs] = useState<SyncLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [pageId, setPageId] = useState("");
  const [token, setToken] = useState("");
  const [busy, setBusy] = useState<string | null>(null);
  const [showHelp, setShowHelp] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const [s, l] = await Promise.all([statusFn(), logsFn()]);
      setStatus(s as FbStatus);
      setLogs((l as SyncLog[]) ?? []);
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const connect = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy("connect");
    try {
      await connectFn({ data: { pageId: pageId.trim(), accessToken: token.trim() } });
      toast.success("تم ربط الصفحة");
      setPageId("");
      setToken("");
      load();
    } catch (e) {
      toast.error("فشل الربط: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const disconnect = async () => {
    setBusy("disconnect");
    try {
      await disconnectFn();
      toast.success("تم فصل الصفحة بنجاح");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const toggle = async (enabled: boolean) => {
    setBusy("toggle");
    try {
      await autoSyncFn({ data: { enabled } });
      toast.success(enabled ? "تم تفعيل المزامنة التلقائية" : "تم إيقاف المزامنة التلقائية");
      load();
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  const syncNow = async () => {
    setBusy("sync");
    toast.info("جاري السحب من فيسبوك... ممكن ياخد شوية");
    try {
      const r = (await syncNowFn()) as {
        created: number;
        skipped: number;
        dupes: number;
        failed: number;
        scanned: number;
      };
      toast.success(
        `تم فحص ${r.scanned} منشور — جديد: ${r.created} / مكرر: ${r.dupes} / متخطى: ${r.skipped} / فشل: ${r.failed}`,
      );
      load();
    } catch (e) {
      toast.error("فشلت المزامنة: " + (e as Error).message);
    } finally {
      setBusy(null);
    }
  };

  if (loading) {
    return <p className="text-center text-sm text-muted-foreground py-8 px-4">جاري التحميل...</p>;
  }

  return (
    <div className="px-4 space-y-4 pb-8">
      {!status ? (
        <div className="bg-card border border-brand-dark/10 rounded-2xl p-4 space-y-3">
          <div className="flex items-center gap-2">
            <Facebook className="w-5 h-5 text-[#1877F2]" />
            <h3 className="font-bold">ربط صفحة فيسبوك</h3>
          </div>
          <p className="text-xs text-muted-foreground leading-relaxed">
            عشان الاستيراد التلقائي، محتاجة تجيبي <b>Page ID</b> و <b>Page Access Token</b> من
            فيسبوك.
          </p>
          <button
            type="button"
            onClick={() => setShowHelp((v) => !v)}
            className="text-xs text-brand-primary underline"
          >
            {showHelp ? "إخفاء" : "إزاي أجيبهم؟"}
          </button>
          {showHelp && (
            <ol className="text-[11px] leading-relaxed text-brand-dark/80 space-y-1 list-decimal pr-4 bg-brand-bg rounded-xl p-3">
              <li>
                افتحي{" "}
                <a
                  href="https://developers.facebook.com/tools/explorer/"
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-primary underline"
                >
                  Graph API Explorer
                </a>
              </li>
              <li>اختاري "Get Page Access Token" واختاري صفحة "بيتك"</li>
              <li>
                وافقي على الصلاحيات: <code>pages_read_engagement</code>,{" "}
                <code>pages_show_list</code>
              </li>
              <li>انسخي الـ Access Token واعمليله Extend من "Debug" ليطول الأمد</li>
              <li>اجيبي Page ID من "About" في صفحتك على فيسبوك</li>
            </ol>
          )}
          <form onSubmit={connect} className="space-y-2">
            <input
              required
              value={pageId}
              onChange={(e) => setPageId(e.target.value)}
              placeholder="Page ID (رقم)"
              dir="ltr"
              className="w-full bg-white border border-brand-dark/10 rounded-xl px-3 py-2 text-sm outline-none"
            />
            <textarea
              required
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Page Access Token"
              dir="ltr"
              rows={3}
              className="w-full bg-white border border-brand-dark/10 rounded-xl px-3 py-2 text-xs outline-none font-mono"
            />
            <button
              type="submit"
              disabled={busy === "connect"}
              className="w-full bg-[#1877F2] text-white font-bold py-2.5 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <Facebook className="w-4 h-4" />
              {busy === "connect" ? "جاري الربط..." : "ربط الصفحة"}
            </button>
          </form>
        </div>
      ) : (
        <>
          <div className="bg-card border border-brand-dark/10 rounded-2xl p-4">
            <div className="flex items-start justify-between gap-3 mb-3">
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <Facebook className="w-4 h-4 text-[#1877F2]" />
                  <p className="font-bold text-sm">{status.page_name ?? status.page_id}</p>
                </div>
                <p className="text-[11px] text-muted-foreground" dir="ltr">
                  ID: {status.page_id}
                </p>
                {status.last_sync_at && (
                  <p className="text-[11px] text-muted-foreground mt-1">
                    آخر مزامنة: {new Date(status.last_sync_at).toLocaleString("ar-EG")}
                  </p>
                )}
              </div>
              <button
                onClick={disconnect}
                disabled={busy === "disconnect"}
                className="text-xs text-destructive underline flex items-center gap-1"
              >
                <Link2Off className="w-3 h-3" /> فصل
              </button>
            </div>

            <label className="flex items-center justify-between bg-brand-bg rounded-xl px-3 py-2.5 mb-3">
              <span className="text-sm font-semibold">مزامنة تلقائية كل ١٠ دقايق</span>
              <input
                type="checkbox"
                checked={status.auto_sync}
                onChange={(e) => toggle(e.target.checked)}
                disabled={busy === "toggle"}
                className="w-5 h-5 accent-brand-primary"
              />
            </label>

            <button
              onClick={syncNow}
              disabled={busy === "sync"}
              className="w-full bg-brand-accent text-brand-dark font-bold py-3 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2"
            >
              <RefreshCw className={`w-4 h-4 ${busy === "sync" ? "animate-spin" : ""}`} />
              {busy === "sync" ? "جاري المزامنة..." : "مزامنة الآن"}
            </button>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2 px-1">سجل المزامنة</h3>
            {logs.length === 0 ? (
              <p className="text-xs text-muted-foreground text-center py-6">
                مفيش سجلات لسه. اضغطي "مزامنة الآن" للبدء.
              </p>
            ) : (
              <div className="space-y-1.5">
                {logs.map((l) => (
                  <div
                    key={l.id}
                    className="bg-card border border-brand-dark/5 rounded-xl px-3 py-2 flex items-start gap-2 text-xs"
                  >
                    {l.status === "success" && (
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-600 flex-shrink-0 mt-0.5" />
                    )}
                    {l.status === "error" && (
                      <XCircle className="w-3.5 h-3.5 text-destructive flex-shrink-0 mt-0.5" />
                    )}
                    {l.status === "skipped" && (
                      <AlertCircle className="w-3.5 h-3.5 text-amber-600 flex-shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="line-clamp-2">{l.message ?? l.status}</p>
                      <p className="text-[10px] text-muted-foreground">
                        {new Date(l.created_at).toLocaleString("ar-EG")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
