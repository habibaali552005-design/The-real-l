import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { useCart, formatEGP } from "@/lib/cart";
import { toast } from "sonner";
import {
  Sparkles,
  ShieldCheck,
  Lock,
  Heart,
  Eye,
  ShoppingBag,
  Search,
  Filter,
  CheckCircle2,
  ArrowRight,
  Star,
  Layers,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { Product, isWomenProduct } from "@/types";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { checkIsSuperAdmin } from "@/lib/rbac";

function useIsAdmin() {
  const [isAdmin, setIsAdmin] = useState(false);
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        setIsAdmin(data.user.email === "m.f.30121998@gmail.com" || checkIsSuperAdmin(data.user));
      }
    });
  }, []);
  return { isAdmin };
}

const womenProductsQuery = {
  queryKey: ["products", "women"],
  queryFn: async () => {
    let raw: Product[] = [];
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) raw = data as Product[];
    } catch {
      // fallback
    }
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
    return MarketplaceStore.filterDeletedProducts(raw);
  },
};

export const Route = createFileRoute("/women")({
  loader: async ({ context }) => {
    await context.queryClient.ensureQueryData(womenProductsQuery);
  },
  head: () => ({
    meta: [
      { title: "قسم النساء الخصوصي — منصة بيتك" },
      {
        name: "description",
        content: "قسم خاص ومستقل مخصص للملابس والأزياء ومستحضرات التجميل النسائية بخصوصية كاملة.",
      },
    ],
  }),
  component: WomenLoungePage,
});

export function WomenLoungePage() {
  const { data: rawProducts } = useSuspenseQuery(womenProductsQuery);
  const { add } = useCart();
  const navigate = useNavigate();

  const [loungeSettings, setLoungeSettings] = useState(() =>
    MarketplaceStore.getWomenLoungeSettings(),
  );

  useEffect(() => {
    setLoungeSettings(MarketplaceStore.getWomenLoungeSettings());
    const handleUpdate = () => setLoungeSettings(MarketplaceStore.getWomenLoungeSettings());
    window.addEventListener("storage", handleUpdate);
    return () => window.removeEventListener("storage", handleUpdate);
  }, []);

  // Privacy gate state
  const [confirmed, setConfirmed] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    if (MarketplaceStore.getUserGender() === "female") return true;
    return sessionStorage.getItem("women_lounge_confirmed") === "true";
  });

  const handleConfirmEntrance = () => {
    sessionStorage.setItem("women_lounge_confirmed", "true");
    setConfirmed(true);
    toast.success("مرحباً بكِ في قسم النساء الخصوصي");
  };

  // User Gender check
  const userGender = MarketplaceStore.getUserGender();
  const { isAdmin } = useIsAdmin();
  const canEdit = isAdmin;

  // Subcategory and search state
  const [selectedSubcat, setSelectedSubcat] = useState<string>("الكل");
  const [searchQuery, setSearchQuery] = useState("");
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);

  // Women Publishing Rules (Super Admin editable)
  const [rules, setRules] = useState(() => MarketplaceStore.getWomenPublishingRules());
  const [showRulesAdminModal, setShowRulesAdminModal] = useState(false);
  const [newRuleTitle, setNewRuleTitle] = useState("");
  const [newRuleContent, setNewRuleContent] = useState("");

  const handleSaveRules = (updatedRules: typeof rules) => {
    setRules(updatedRules);
    MarketplaceStore.saveWomenPublishingRules(updatedRules);
    toast.success("تم تحديث وحفظ قواعد النشر في قسم النساء بنجاح");
  };

  const handleAddRule = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRuleTitle || !newRuleContent) return;
    const newRule = {
      id: `w-rule-${Date.now()}`,
      title: newRuleTitle,
      content: newRuleContent,
      order: rules.length + 1,
    };
    const updated = [...rules, newRule];
    handleSaveRules(updated);
    setNewRuleTitle("");
    setNewRuleContent("");
  };

  const handleDeleteRule = (id: string) => {
    const updated = rules.filter((r) => r.id !== id);
    handleSaveRules(updated);
  };

  // Gender Restriction Gate: Block if Male
  if (userGender === "male") {
    return (
      <PageShell>
        <div className="max-w-2xl mx-auto px-4 py-20 text-center space-y-6" dir="rtl">
          <div className="w-20 h-20 rounded-3xl bg-pink-100 text-pink-600 mx-auto grid place-items-center shadow-lg border border-pink-200">
            <Lock className="w-10 h-10" />
          </div>
          <div className="space-y-2">
            <span className="bg-pink-100 text-pink-800 text-xs font-black px-4 py-1.5 rounded-full border border-pink-200">
              خصوصية تامة للنساء فقط
            </span>
            <h1 className="text-2xl md:text-3xl font-black text-brand-dark">
              قسم النساء خاص بملابس ومستحضرات السيدات فقط
            </h1>
            <p className="text-xs md:text-sm text-muted-foreground leading-relaxed px-6">
              تم تعيين جنس حسابك كـ <strong>"ذكر"</strong>، ولذلك لا يمكن الوصول لهذا القسم حماية
              لخصوصية العميلات والبائعات بمتجر بيتك.
            </p>
          </div>

          <div className="bg-card p-5 rounded-3xl border border-pink-200 text-xs text-brand-dark space-y-2 text-start">
            <div className="font-bold text-pink-800 flex items-center gap-1.5">
              <ShieldCheck className="w-4 h-4" />
              لماذا هذا القيد؟
            </div>
            <p className="text-muted-foreground leading-normal">
              نحن نلتزم بتوفير بيئة تسوق آمنة وخاصة بالنساء، حيث تُعرض الأزياء والمنتجات النسائية
              للعميلات المسجلات كـ أنثى فقط.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-2">
            <button
              onClick={() => navigate({ to: "/profile" })}
              className="bg-brand-dark text-white font-black px-6 py-3.5 rounded-2xl text-xs hover:bg-brand-primary transition shadow cursor-pointer"
            >
              الانتقال للملف الشخصي لضبط بيانات الحساب
            </button>
            <button
              onClick={() => navigate({ to: "/products" })}
              className="bg-secondary text-brand-dark font-bold px-6 py-3.5 rounded-2xl text-xs hover:bg-brand-dark/10 transition border border-brand-dark/10 cursor-pointer"
            >
              تصفح كل المنتجات العامة
            </button>
          </div>
        </div>
      </PageShell>
    );
  }

  const subcategories = ["الكل", ...(loungeSettings.subcategories || [])];

  // Filter products for Women Lounge
  const allProducts = (rawProducts || []) as unknown as Product[];
  const womenProducts = allProducts.filter((p) => {
    const isWomen = isWomenProduct(p) || p.for_women_only;
    if (!isWomen) return false;

    if (selectedSubcat !== "الكل") {
      const matchCat =
        p.category?.toLowerCase().includes(selectedSubcat.toLowerCase()) ||
        p.sub_category?.toLowerCase().includes(selectedSubcat.toLowerCase()) ||
        p.main_category?.toLowerCase().includes(selectedSubcat.toLowerCase()) ||
        p.name.toLowerCase().includes(selectedSubcat.toLowerCase());
      if (!matchCat) return false;
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase().trim();
      const matchQ =
        p.name.toLowerCase().includes(q) ||
        (p.description || "").toLowerCase().includes(q) ||
        p.category.toLowerCase().includes(q);
      if (!matchQ) return false;
    }

    return true;
  });

  return (
    <PageShell>
      {/* Entrance Confirmation Modal Gate */}
      {!confirmed && loungeSettings.requireConfirmation && (
        <div className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 md:p-8 border border-pink-200 shadow-2xl text-center space-y-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 left-0 h-2 bg-gradient-to-r from-pink-400 via-rose-500 to-purple-500" />

            <div className="w-16 h-16 rounded-full bg-pink-100 text-pink-600 mx-auto grid place-items-center shadow-inner">
              <Lock className="w-8 h-8" />
            </div>

            <div className="space-y-2">
              <span className="inline-block bg-pink-100 text-pink-700 text-xs font-black px-3.5 py-1 rounded-full border border-pink-200">
                خصوصية تامة واستقلالية
              </span>
              <h2 className="text-2xl font-black text-brand-dark">
                {loungeSettings.gateTitle || "قسم مخصص للنساء فقط"}
              </h2>
              <p className="text-xs text-muted-foreground leading-relaxed px-4">
                {loungeSettings.gateSubtitle ||
                  "هذا القسم يحتوي على أزياء ومستحضرات تجميل ومستلزمات خُصصت بالكامل للنساء ولا تظهر في باقي أقسام المتجر الرئيسية."}
              </p>
            </div>

            <div className="bg-pink-50/80 border border-pink-100 p-3.5 rounded-2xl text-start flex items-start gap-3 text-xs text-pink-900">
              <ShieldCheck className="w-5 h-5 text-pink-600 shrink-0 mt-0.5" />
              <span>
                {loungeSettings.gateNoticeText ||
                  "يُرجى تأكيد الدخول للنساء فقط لضمان الخصوصية والراحة أثناء التصفح والشراء."}
              </span>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={handleConfirmEntrance}
                className="flex-1 bg-gradient-to-r from-pink-600 to-rose-600 text-white font-black py-3.5 rounded-2xl shadow-lg hover:brightness-110 transition cursor-pointer text-xs flex items-center justify-center gap-2"
              >
                <Sparkles className="w-4 h-4" />
                تأكيد الدخول للنساء (تسوق خاص)
              </button>
              <button
                onClick={() => navigate({ to: "/" })}
                className="px-5 py-3.5 rounded-2xl border border-brand-dark/10 font-bold text-xs hover:bg-secondary transition cursor-pointer text-brand-dark"
              >
                العودة للرئيسية
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Header Banner */}
        <div className="rounded-2xl bg-rose-950 text-white p-6 shadow-xs border border-rose-800/30 flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-pink-300 text-xs font-bold">
              <Sparkles className="w-3.5 h-3.5" />
              قسم النساء
            </span>
            <h1 className="text-xl md:text-2xl font-bold text-white">الأزياء والمنتجات النسائية</h1>
          </div>
          {canEdit && (
            <button
              onClick={() => setShowRulesAdminModal(true)}
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-3 py-1.5 rounded-lg text-xs transition border border-white/20 flex items-center gap-1.5 cursor-pointer"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-pink-300" />
              قواعد النشر
            </button>
          )}
        </div>

        {/* Subcategories Scroll Bar */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="font-black text-base md:text-lg text-brand-dark flex items-center gap-2">
              <Layers className="w-5 h-5 text-pink-600" />
              أقسام وتصنيفات النساء
            </h2>
            <span className="text-xs font-bold text-muted-foreground">
              ({womenProducts.length} منتج متاح)
            </span>
          </div>

          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            {subcategories.map((sub) => {
              const active = selectedSubcat === sub;
              return (
                <button
                  key={sub}
                  onClick={() => setSelectedSubcat(sub)}
                  className={`px-4 py-2.5 rounded-2xl text-xs font-black whitespace-nowrap transition border cursor-pointer ${
                    active
                      ? "bg-pink-600 text-white border-pink-600 shadow-md scale-105"
                      : "bg-card text-brand-dark border-brand-dark/10 hover:border-pink-300 hover:bg-pink-50/50"
                  }`}
                >
                  {sub}
                </button>
              );
            })}
          </div>
        </div>

        {/* Search Bar */}
        <div className="relative max-w-md">
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="ابحثي في منتجات النساء..."
            className="w-full bg-white border border-pink-200 rounded-full pr-10 pl-4 py-2.5 text-xs outline-none focus:ring-2 focus:ring-pink-500/20 focus:border-pink-500"
          />
        </div>

        {/* Products Grid */}
        {womenProducts.length === 0 ? (
          <div className="bg-card border border-pink-100 rounded-3xl p-12 text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-pink-50 text-pink-500 mx-auto grid place-items-center">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <div className="space-y-1">
              <h3 className="font-bold text-base text-brand-dark">لا توجد منتجات مطابقة حالياً</h3>
              <p className="text-xs text-muted-foreground">
                يمكن للبائعين إضافة منتجات نسائية وتحديد خيار "قسم النساء فقط" لتظهر هنا مباشرة!
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {womenProducts.map((p) => (
              <div
                key={p.id}
                className="bg-card rounded-3xl overflow-hidden border border-pink-100 hover:border-pink-300 transition duration-300 shadow-sm hover:shadow-xl flex flex-col group"
              >
                <div className="relative aspect-square overflow-hidden bg-secondary">
                  <img
                    src={
                      p.image_url ||
                      (p.images && p.images[0]) ||
                      MarketplaceStore.getProductMetadata(p.id).images?.[0]?.url ||
                      "https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?auto=format&fit=crop&w=600&q=80"
                    }
                    alt={p.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-2.5 right-2.5 flex flex-col gap-1.5">
                    <span className="bg-pink-600 text-white text-[10px] font-black px-2.5 py-1 rounded-full shadow-md">
                      نساء فقط
                    </span>
                  </div>

                  <button
                    onClick={() => setQuickViewProduct(p)}
                    className="absolute bottom-3 left-1/2 -translate-x-1/2 bg-white/90 backdrop-blur-md text-brand-dark px-4 py-2 rounded-full text-xs font-bold shadow-lg opacity-0 group-hover:opacity-100 transition duration-300 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5 text-pink-600" />
                    معاينة سريعة
                  </button>
                </div>

                <div className="p-4 flex-1 flex flex-col justify-between space-y-3">
                  <div>
                    <span className="text-[10px] text-pink-600 font-extrabold bg-pink-50 px-2.5 py-0.5 rounded-md">
                      {p.category}
                    </span>
                    <h3 className="font-bold text-xs md:text-sm text-brand-dark mt-1.5 line-clamp-2 leading-snug">
                      {p.name}
                    </h3>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-brand-dark/5">
                    <span className="text-sm md:text-base font-black text-pink-700">
                      {formatEGP(Number(p.price))}
                    </span>
                    <button
                      onClick={() => setQuickViewProduct(p)}
                      className="bg-pink-600 text-white p-2.5 rounded-2xl hover:bg-pink-700 transition cursor-pointer shadow-sm"
                      aria-label="إضافة للسلة"
                    >
                      <ShoppingBag className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Quick View Modal */}
        {quickViewProduct && (
          <ProductQuickViewModal
            product={quickViewProduct}
            onClose={() => setQuickViewProduct(null)}
          />
        )}

        {/* Super Admin Women Publishing Rules Modal */}
        {showRulesAdminModal && (
          <div
            onClick={() => setShowRulesAdminModal(false)}
            className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn cursor-pointer"
            dir="rtl"
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="bg-card w-full max-w-2xl rounded-3xl p-5 sm:p-8 border border-brand-dark/15 shadow-2xl space-y-6 max-h-[85vh] overflow-y-auto cursor-default relative"
            >
              <button
                onClick={() => setShowRulesAdminModal(false)}
                className="absolute top-4 left-4 z-50 w-9 h-9 rounded-full bg-secondary hover:bg-brand-dark hover:text-white text-brand-dark font-black text-xs grid place-items-center cursor-pointer transition border border-brand-dark/15 shadow-md"
                title="إغلاق"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-4 pl-12">
                <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
                  <ShieldCheck className="w-6 h-6 text-brand-primary" />
                  إدارة وقواعد نشر البائعين لقسم النساء
                </h3>
              </div>

              {/* Add New Rule Form */}
              <form
                onSubmit={handleAddRule}
                className="bg-pink-50/60 border border-pink-200 p-4 rounded-2xl space-y-3"
              >
                <h4 className="font-bold text-xs text-pink-900">
                  إضافة شرط / بند جديد لقواعد النشر:
                </h4>
                <div className="space-y-2">
                  <input
                    type="text"
                    required
                    value={newRuleTitle}
                    onChange={(e) => setNewRuleTitle(e.target.value)}
                    placeholder="عنوان الشرط والبند..."
                    className="w-full text-xs bg-white border border-pink-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-pink-500"
                  />
                  <textarea
                    required
                    value={newRuleContent}
                    onChange={(e) => setNewRuleContent(e.target.value)}
                    placeholder="تفاصيل واشترط البند..."
                    rows={2}
                    className="w-full text-xs bg-white border border-pink-200 rounded-xl px-3.5 py-2.5 outline-none focus:border-pink-500"
                  />
                </div>
                <button
                  type="submit"
                  className="bg-pink-600 text-white font-bold px-4 py-2 rounded-xl text-xs hover:bg-pink-700 transition cursor-pointer"
                >
                  + إضافة البند لقواعد النشر
                </button>
              </form>

              {/* Existing Rules List */}
              <div className="space-y-3">
                <h4 className="font-bold text-xs text-brand-dark">
                  البنود والقواعد الحالية ({rules.length}):
                </h4>
                {rules.map((r, index) => (
                  <div
                    key={r.id}
                    className="bg-white border border-brand-dark/10 p-4 rounded-2xl flex items-start justify-between gap-4 shadow-sm"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="w-5 h-5 rounded-full bg-pink-100 text-pink-700 font-bold text-[10px] grid place-items-center">
                          {index + 1}
                        </span>
                        <h5 className="font-bold text-xs text-brand-dark">{r.title}</h5>
                      </div>
                      <p className="text-xs text-muted-foreground pr-7">{r.content}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteRule(r.id)}
                      className="text-rose-600 hover:text-rose-800 p-2 rounded-lg hover:bg-rose-50 text-xs font-bold cursor-pointer"
                    >
                      حذف
                    </button>
                  </div>
                ))}
              </div>

              <div className="pt-2">
                <button
                  onClick={() => setShowRulesAdminModal(false)}
                  className="w-full bg-brand-dark text-white font-bold py-3 rounded-2xl text-xs hover:bg-brand-primary transition cursor-pointer"
                >
                  إغلاق وحفظ
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
