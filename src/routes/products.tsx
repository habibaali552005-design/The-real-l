import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { useCart, formatEGP } from "@/lib/cart";
import { toast } from "sonner";
import {
  Plus,
  X,
  Search,
  Filter,
  Grid,
  List,
  LayoutGrid,
  RotateCcw,
  Sparkles,
  ShoppingBag,
  Eye,
  Heart,
  MapPin,
  Star,
  SlidersHorizontal,
  Check,
} from "lucide-react";
import { z } from "zod";
import { useState } from "react";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { Product, EGYPT_GOVERNORATES, isWomenProduct } from "@/types";

import { MarketplaceStore } from "@/lib/marketplaceStore";
import { useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";

const productsQuery = {
  queryKey: ["products", "all"],
  queryFn: async () => {
    let rawProducts: Product[] = [];
    try {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (data) rawProducts = data as Product[];
    } catch {
      // fallback
    }

    const customMap = MarketplaceStore.getCustomProducts();
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

    return updatedList;
  },
};

const categoriesQuery = {
  queryKey: ["categories"],
  queryFn: async () => {
    const { data, error } = await supabase.from("categories").select("*").order("sort_order");
    if (error) throw error;
    let list = (data || []) as { id: string; name: string }[];
    if (list.length === 0) {
      list = [
        { id: "cat-1", name: "أثاث ومفروشات" },
        { id: "cat-2", name: "غرف معيشة" },
        { id: "cat-3", name: "غرف نوم" },
        { id: "cat-4", name: "مطابخ وأدوات منزلية" },
        { id: "cat-5", name: "أجهزة إلكترونية وهواتف" },
      ];
    }
    return list;
  },
};

const searchSchema = z.object({
  cat: z.string().optional(),
  q: z.string().optional(),
  min: z.coerce.number().optional(),
  max: z.coerce.number().optional(),
  gov: z.string().optional(),
  stock: z.enum(["all", "in"]).optional(),
  sort: z.enum(["new", "price_asc", "price_desc", "name", "rating"]).optional(),
  color: z.string().optional(),
  size: z.string().optional(),
});

export const Route = createFileRoute("/products")({
  validateSearch: searchSchema,
  loader: async ({ context }) => {
    await Promise.all([
      context.queryClient.ensureQueryData(productsQuery),
      context.queryClient.ensureQueryData(categoriesQuery),
    ]);
  },
  head: () => ({
    meta: [
      { title: "سوق بيتك الشامل — المعرض الكامل للمنتجات" },
      {
        name: "description",
        content:
          "تصفح تشكيلة الأثاث والديكور والأجهزة المنزلية بضمان معاينة وتسليم لكافة محافظات مصر.",
      },
    ],
  }),
  component: ProductsPage,
});

const colorMap: Record<string, string> = {
  أبيض: "#FFFFFF",
  أسود: "#111827",
  أحمر: "#EF4444",
  أزرق: "#3B82F6",
  أخضر: "#10B981",
  أصفر: "#F59E0B",
  ذهبي: "#D4AF37",
  فضي: "#C0C0C0",
  رمادي: "#6B7280",
  بيج: "#F5F5DC",
  بني: "#78350F",
  وردي: "#EC4899",
  كحلي: "#1E3A8A",
  برتقالي: "#F97316",
  بنفسجي: "#8B5CF6",
};

function ProductsPage() {
  const { data: rawProducts } = useSuspenseQuery(productsQuery);
  const { data: cats } = useSuspenseQuery(categoriesQuery);
  const search = Route.useSearch();
  const navigate = Route.useNavigate();
  const { add } = useCart();
  const queryClient = useQueryClient();

  useEffect(() => {
    const handleUpdate = () => {
      queryClient.invalidateQueries({ queryKey: ["products"] });
    };
    window.addEventListener("beitak-products-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-products-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [queryClient]);

  // Modal and layout states
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [wishlist, setWishlist] = useState<string[]>([]);
  const [viewMode, setViewMode] = useState<"grid-3" | "grid-4" | "list">("grid-3");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Local live search query state for smooth typing
  const [searchInput, setSearchInput] = useState(search.q ?? "");

  // Exclude Women Lounge products from standard shop catalog
  const products: Product[] = ((rawProducts || []) as unknown as Product[]).filter(
    (p) => !isWomenProduct(p),
  );
  const CATEGORIES = ["الكل", ...cats.map((c) => c.name)];
  const activeCat = search.cat || "الكل";
  const query = (search.q ?? "").trim().toLowerCase();
  const sort = search.sort ?? "new";
  const stock = search.stock ?? "all";
  const selectedGov = search.gov ?? "الكل";

  // Filter Logic
  let filtered = products.filter((p) => {
    if (activeCat !== "الكل" && p.category !== activeCat) return false;
    if (query) {
      const pRecord = p as unknown as Record<string, unknown>;
      const specificationsStr = pRecord.specifications
        ? JSON.stringify(pRecord.specifications)
        : "";
      const hay =
        `${p.name} ${p.description ?? ""} ${p.category} ${specificationsStr}`.toLowerCase();
      if (!hay.includes(query)) return false;
    }
    if (search.min != null && Number(p.price) < search.min) return false;
    if (search.max != null && Number(p.price) > search.max) return false;
    if (stock === "in" && !p.in_stock) return false;
    if (search.color && (!p.colors || !p.colors.includes(search.color))) return false;
    if (search.size && (!p.sizes || !p.sizes.includes(search.size))) return false;

    // Governorate Filter Check
    if (selectedGov !== "الكل" && selectedGov !== "جميع المحافظات") {
      if (
        p.available_governorates &&
        p.available_governorates.length > 0 &&
        !p.available_governorates.includes("جميع المحافظات") &&
        !p.available_governorates.includes(selectedGov)
      ) {
        return false;
      }
    }
    return true;
  });

  // Sort Logic
  filtered = [...filtered].sort((a, b) => {
    if (sort === "price_asc") return Number(a.price) - Number(b.price);
    if (sort === "price_desc") return Number(b.price) - Number(a.price);
    if (sort === "name") return a.name.localeCompare(b.name, "ar");
    if (sort === "rating") return (b.rating || 5) - (a.rating || 5);
    return 0;
  });

  const updateSearch = (patch: Record<string, unknown>) =>
    navigate({
      search: (prev: Record<string, unknown>) => {
        const next: Record<string, unknown> = { ...prev, ...patch };
        Object.keys(next).forEach((k) => {
          const v = next[k];
          if (v === "" || v === undefined || v === null) delete next[k];
        });
        return next;
      },
      replace: true,
    });

  const clearAll = () => {
    setSearchInput("");
    navigate({ search: {}, replace: true });
    setMobileFiltersOpen(false);
  };

  const toggleWishlist = (id: string, name: string) => {
    if (wishlist.includes(id)) {
      setWishlist(wishlist.filter((item) => item !== id));
      toast.info(`تمت إزالة "${name}" من قائمة المفضلة`);
    } else {
      setWishlist([...wishlist, id]);
      toast.success(`تمت إضافة "${name}" إلى مفضلتك`);
    }
  };

  const hasFilters =
    !!search.q ||
    !!search.cat ||
    search.min != null ||
    search.max != null ||
    (search.gov && search.gov !== "الكل") ||
    stock === "in" ||
    !!search.color ||
    !!search.size;

  const SidebarContent = () => (
    <div className="space-y-6 text-right" dir="rtl">
      {/* Search Input Box */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-2 shadow-xs">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <Search className="w-3.5 h-3.5 text-brand-primary" />
          البحث الفوري بالاسم أو الكود:
        </label>
        <div className="relative">
          <input
            type="text"
            value={searchInput}
            onChange={(e) => {
              setSearchInput(e.target.value);
              updateSearch({ q: e.target.value || undefined });
            }}
            placeholder="ابحث عن طقم صالون، طاولة..."
            className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none focus:border-brand-primary pr-8"
          />
          <Search className="w-3.5 h-3.5 text-muted-foreground absolute left-3 top-3" />
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark border-b border-brand-dark/5 pb-2">
          أقسام المنتجات المعروضة:
        </h3>
        <div className="space-y-1 max-h-56 overflow-y-auto pr-1">
          {CATEGORIES.map((catName) => {
            const isSelected = activeCat === catName;
            return (
              <button
                key={catName}
                onClick={() => updateSearch({ cat: catName === "الكل" ? undefined : catName })}
                className={`w-full text-right px-3 py-2 rounded-xl text-xs font-bold flex justify-between items-center transition cursor-pointer ${
                  isSelected
                    ? "bg-brand-primary text-brand-bg shadow-sm"
                    : "hover:bg-brand-bg text-brand-dark"
                }`}
              >
                <span>{catName}</span>
                {isSelected && <Check className="w-3.5 h-3.5" />}
              </button>
            );
          })}
        </div>
      </div>

      {/* Governorate Shipping Filter */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-2 shadow-xs">
        <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
          <MapPin className="w-3.5 h-3.5 text-brand-accent" />
          تصفية حسب التوصيل لمحافظتك:
        </label>
        <select
          value={selectedGov}
          onChange={(e) =>
            updateSearch({ gov: e.target.value === "الكل" ? undefined : e.target.value })
          }
          className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 outline-none focus:border-brand-accent cursor-pointer"
        >
          <option value="الكل">عرض كافة المحافظات</option>
          {EGYPT_GOVERNORATES.filter((g) => g !== "جميع المحافظات").map((g) => (
            <option key={g} value={g}>
              التوصيل إلى {g}
            </option>
          ))}
        </select>
      </div>

      {/* Price Min/Max Range */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl space-y-3 shadow-xs">
        <h3 className="text-xs font-bold text-brand-dark">نطاق السعر (ج.م):</h3>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">الحد الأدنى</span>
            <input
              type="number"
              value={search.min ?? ""}
              onChange={(e) =>
                updateSearch({ min: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="0"
              className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl p-2 outline-none"
            />
          </div>
          <div>
            <span className="text-[10px] text-muted-foreground block mb-1">الحد الأقصى</span>
            <input
              type="number"
              value={search.max ?? ""}
              onChange={(e) =>
                updateSearch({ max: e.target.value ? Number(e.target.value) : undefined })
              }
              placeholder="100,000"
              className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl p-2 outline-none"
            />
          </div>
        </div>
      </div>

      {/* Stock Checkbox */}
      <div className="bg-card border border-brand-dark/5 p-4 rounded-2xl shadow-xs">
        <label className="flex items-center gap-3 text-xs font-bold cursor-pointer text-brand-dark select-none">
          <input
            type="checkbox"
            checked={stock === "in"}
            onChange={(e) => updateSearch({ stock: e.target.checked ? "in" : undefined })}
            className="w-4 h-4 rounded text-brand-accent focus:ring-brand-accent border-brand-dark/10 cursor-pointer"
          />
          <span>المتوفر بـ المخزن وجاهز للشحن فقط</span>
        </label>
      </div>

      {/* Clear Filters */}
      {hasFilters && (
        <button
          onClick={clearAll}
          className="w-full flex items-center justify-center gap-2 py-3 border border-dashed border-destructive/30 text-destructive bg-destructive/5 hover:bg-destructive/10 transition rounded-xl text-xs font-bold cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          إعادة تعيين كافة الفلاتر
        </button>
      )}
    </div>
  );

  return (
    <PageShell>
      {/* Header Banner */}
      <div
        className="bg-brand-dark text-brand-bg px-6 py-10 text-center relative overflow-hidden"
        dir="rtl"
      >
        <div className="max-w-3xl mx-auto space-y-3 relative z-10">
          <div className="inline-flex items-center gap-1.5 bg-brand-accent/20 text-brand-accent text-xs font-black px-3.5 py-1 rounded-full mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            معرض الأثاث والمنتجات الذكية المميز
          </div>
          <h1 className="text-2xl md:text-4xl font-extrabold tracking-tight">سوق بيتك المباشر</h1>
          <p className="text-brand-bg/75 text-xs md:text-sm max-w-lg mx-auto leading-relaxed">
            اكتشف آلاف المنتجات بضمان معاينة حقيقي عند التسليم ومطابقة للمواصفات القياسية.
          </p>

          {/* Management Quick Toolbar for Sellers and Super Admin */}
          <div className="pt-2 flex flex-wrap items-center justify-center gap-3">
            <Link
              to="/categories"
              className="bg-white/10 hover:bg-white/20 text-white font-bold px-4 py-2 rounded-xl text-xs border border-white/20 transition flex items-center gap-1.5 cursor-pointer"
            >
              <SlidersHorizontal className="w-3.5 h-3.5 text-brand-accent" />
              إدارة واستعراض جميع الأقسام
            </Link>
          </div>
        </div>
      </div>

      {/* Main Container */}
      <div className="max-w-[1550px] mx-auto px-4 py-8" dir="rtl">
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
          {/* Desktop Sidebar */}
          <div className="hidden lg:block lg:col-span-1 space-y-6 sticky top-24 self-start">
            <div className="flex items-center justify-between border-b border-brand-dark/5 pb-3">
              <h2 className="font-bold text-base flex items-center gap-2">
                <Filter className="w-4 h-4 text-brand-primary" />
                خيارات التصفية الفائقة
              </h2>
              {hasFilters && (
                <button
                  onClick={clearAll}
                  className="text-xs text-brand-primary font-bold hover:underline cursor-pointer"
                >
                  مسح الكل
                </button>
              )}
            </div>
            <SidebarContent />
          </div>

          {/* Product Feed Column */}
          <div className="lg:col-span-4 space-y-6">
            {/* Top Toolbar: Mobile Filter Button, Search Counter, Grid layout toggles, Sort */}
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-card border border-brand-dark/5 p-4 rounded-2xl shadow-xs">
              <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-start">
                <button
                  onClick={() => setMobileFiltersOpen(true)}
                  className="lg:hidden flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black bg-brand-dark text-brand-bg hover:opacity-90 transition cursor-pointer"
                >
                  <Filter className="w-4 h-4" />
                  الفلاتر
                </button>

                <div className="text-xs font-bold text-muted-foreground whitespace-nowrap">
                  عثرنا على <span className="text-brand-primary font-black">{filtered.length}</span>{" "}
                  منتج
                </div>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto justify-end">
                {/* Grid view Switchers */}
                <div className="hidden sm:flex items-center bg-brand-bg border border-brand-dark/10 p-1 rounded-xl gap-1">
                  <button
                    onClick={() => setViewMode("grid-3")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "grid-3"
                        ? "bg-brand-primary text-brand-bg"
                        : "text-muted-foreground hover:text-brand-dark"
                    }`}
                    title="شبكة 3 أعمدة"
                  >
                    <Grid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("grid-4")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "grid-4"
                        ? "bg-brand-primary text-brand-bg"
                        : "text-muted-foreground hover:text-brand-dark"
                    }`}
                    title="شبكة 4 أعمدة مضغوطة"
                  >
                    <LayoutGrid className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => setViewMode("list")}
                    className={`p-1.5 rounded-lg transition cursor-pointer ${
                      viewMode === "list"
                        ? "bg-brand-primary text-brand-bg"
                        : "text-muted-foreground hover:text-brand-dark"
                    }`}
                    title="عرض قائمة"
                  >
                    <List className="w-4 h-4" />
                  </button>
                </div>

                {/* Sort Selector */}
                <select
                  value={sort}
                  onChange={(e) =>
                    updateSearch({ sort: e.target.value === "new" ? undefined : e.target.value })
                  }
                  className="w-full sm:w-44 px-3 py-2 rounded-xl text-xs font-black bg-brand-bg border border-brand-dark/10 outline-none focus:border-brand-accent cursor-pointer"
                >
                  <option value="new">الأحدث وصولاً</option>
                  <option value="price_asc">السعر: من الأقل للأعلى</option>
                  <option value="price_desc">السعر: من الأعلى للأقل</option>
                  <option value="rating">الأعلى تقييماً</option>
                  <option value="name">الاسم أبجدياً (أ-ي)</option>
                </select>
              </div>
            </div>

            {/* Active Filter Badges */}
            {hasFilters && (
              <div className="flex flex-wrap gap-2 items-center bg-brand-bg/50 p-3 rounded-2xl border border-brand-dark/5">
                <span className="text-xs font-bold text-muted-foreground">الفلاتر النشطة:</span>
                {search.cat && (
                  <span className="bg-brand-primary/10 text-brand-primary text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    القسم: {search.cat}
                    <button onClick={() => updateSearch({ cat: undefined })}>
                      <X className="w-3 h-3 hover:text-brand-dark transition" />
                    </button>
                  </span>
                )}
                {search.q && (
                  <span className="bg-brand-primary/10 text-brand-primary text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    البحث: &quot;{search.q}&quot;
                    <button onClick={() => updateSearch({ q: undefined })}>
                      <X className="w-3 h-3 hover:text-brand-dark transition" />
                    </button>
                  </span>
                )}
                {search.gov && (
                  <span className="bg-brand-accent/20 text-brand-dark text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    المحافظة: {search.gov}
                    <button onClick={() => updateSearch({ gov: undefined })}>
                      <X className="w-3 h-3 hover:text-brand-dark transition" />
                    </button>
                  </span>
                )}
                {(search.min != null || search.max != null) && (
                  <span className="bg-brand-primary/10 text-brand-primary text-[11px] font-black px-2.5 py-1 rounded-full flex items-center gap-1">
                    السعر: {search.min ?? 0} - {search.max ?? "أعلى"} ج.م
                    <button onClick={() => updateSearch({ min: undefined, max: undefined })}>
                      <X className="w-3 h-3 hover:text-brand-dark transition" />
                    </button>
                  </span>
                )}
                <button
                  onClick={clearAll}
                  className="text-xs font-bold text-destructive hover:underline mr-auto cursor-pointer"
                >
                  مسح الكل
                </button>
              </div>
            )}

            {/* Products Display Grid / List */}
            <div
              className={
                viewMode === "list"
                  ? "flex flex-col gap-4"
                  : viewMode === "grid-4"
                    ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4"
                    : "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-4 xl:grid-cols-5 gap-5"
              }
            >
              {filtered.map((p) => {
                const isWishlisted = wishlist.includes(p.id);
                if (viewMode === "list") {
                  return (
                    <div
                      key={p.id}
                      onClick={() => setQuickViewProduct(p)}
                      className="group bg-card border border-brand-dark/5 rounded-3xl p-4 flex flex-col sm:flex-row gap-4 items-center justify-between hover:border-brand-accent transition shadow-xs cursor-pointer"
                    >
                      <div className="flex gap-4 items-center w-full sm:w-auto">
                        <div className="relative w-24 h-24 rounded-2xl overflow-hidden bg-brand-bg flex-shrink-0 border border-brand-dark/5">
                          {p.image_url ? (
                            <img
                              src={p.image_url}
                              alt={p.name}
                              className="w-full h-full object-cover group-hover:scale-105 transition"
                            />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                              <ShoppingBag className="w-8 h-8" />
                            </div>
                          )}
                        </div>
                        <div className="space-y-1">
                          <span className="text-[10px] font-bold text-brand-accent bg-brand-accent/10 px-2 py-0.5 rounded-md">
                            {p.category}
                          </span>
                          <h3 className="font-bold text-sm text-brand-dark group-hover:text-brand-primary transition">
                            {p.name}
                          </h3>
                          <p className="text-xs text-muted-foreground line-clamp-1 max-w-md">
                            {p.description ||
                              p.short_description ||
                              "منتج عالي الجودة مع ضمان حقيقي."}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-end border-t sm:border-t-0 pt-3 sm:pt-0 border-brand-dark/5">
                        <div className="text-right">
                          <span className="text-xs text-muted-foreground block">السعر</span>
                          <span className="text-lg font-black text-brand-primary">
                            {formatEGP(Number(p.price))}
                          </span>
                        </div>
                        <div className="flex gap-2">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setQuickViewProduct(p);
                            }}
                            className="px-4 py-2.5 rounded-xl border border-brand-dark/10 hover:bg-secondary transition text-brand-dark text-xs font-bold cursor-pointer"
                          >
                            عرض التفاصيل
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={p.id}
                    onClick={() => setQuickViewProduct(p)}
                    className="group bg-card border border-brand-dark/5 rounded-3xl p-3 flex flex-col justify-between hover:border-brand-accent hover:shadow-xl transition duration-300 relative cursor-pointer"
                  >
                    <div className="space-y-3">
                      {/* Image Stage */}
                      <div className="relative rounded-2xl overflow-hidden bg-brand-bg aspect-square flex items-center justify-center border border-brand-dark/5">
                        {p.image_url ? (
                          <img
                            src={p.image_url}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                            loading="lazy"
                          />
                        ) : (
                          <div className="text-center p-4">
                            <ShoppingBag className="w-8 h-8 mx-auto text-brand-primary/20 mb-1" />
                            <span className="text-[10px] text-muted-foreground block">
                              بلا صورة
                            </span>
                          </div>
                        )}

                        {!p.in_stock && (
                          <div className="absolute inset-0 bg-brand-dark/50 backdrop-blur-xs flex items-center justify-center">
                            <span className="bg-destructive text-destructive-foreground text-[10px] font-black px-3 py-1 rounded-full">
                              نفدت الكمية
                            </span>
                          </div>
                        )}

                        {/* Top Action Buttons (Wishlist) */}
                        <div className="absolute top-2 left-2 flex flex-col gap-1.5 opacity-90 group-hover:opacity-100 transition">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              toggleWishlist(p.id, p.name);
                            }}
                            className={`w-8 h-8 rounded-full flex items-center justify-center shadow-md transition cursor-pointer ${
                              isWishlisted
                                ? "bg-destructive text-white"
                                : "bg-white/90 text-brand-dark hover:bg-white"
                            }`}
                            title="المفضلة"
                          >
                            <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
                          </button>
                        </div>

                        {/* Category Tag */}
                        <span className="absolute top-2.5 right-2.5 bg-white/95 text-brand-dark text-[10px] font-black px-2 py-0.5 rounded-lg shadow-xs border border-brand-dark/5">
                          {p.category}
                        </span>
                      </div>

                      {/* Product Name & Short Description */}
                      <div className="px-1 space-y-1">
                        <h3 className="font-bold text-xs md:text-sm text-brand-dark group-hover:text-brand-primary transition line-clamp-2 leading-snug">
                          {p.name}
                        </h3>
                        {p.short_description && (
                          <p className="text-[10px] text-muted-foreground line-clamp-1">
                            {p.short_description}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Footer: Price + Quick Add Button */}
                    <div className="pt-3 px-1 flex items-center justify-between border-t border-brand-dark/5 mt-3">
                      <div className="flex flex-col">
                        <span className="text-[9px] text-muted-foreground font-bold">السعر</span>
                        <span className="text-brand-primary font-black text-xs md:text-sm">
                          {formatEGP(Number(p.price))}
                        </span>
                      </div>

                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (
                            (p.colors && p.colors.length > 0) ||
                            (p.sizes && p.sizes.length > 0)
                          ) {
                            toast.info(
                              "يرجى تحديد الخيارات المطلوبة (اللون / المقاس) بالصفحة أولاً",
                            );
                            setQuickViewProduct(p);
                          } else {
                            add({
                              id: p.id,
                              name: p.name,
                              price: Number(p.price),
                              image_url: p.image_url,
                            });
                            toast.success(`تمت إضافة "${p.name}" إلى السلة بنجاح!`);
                          }
                        }}
                        disabled={!p.in_stock}
                        className="h-8 px-3 rounded-xl text-xs font-black bg-brand-dark text-brand-bg hover:bg-brand-primary active:scale-95 transition flex items-center gap-1 shadow-xs disabled:opacity-40 cursor-pointer"
                        aria-label="إضافة للسلة"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>إضافة</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Zero State */}
            {filtered.length === 0 && (
              <div className="text-center py-20 px-4 bg-card border border-brand-dark/5 rounded-3xl space-y-3 shadow-xs">
                <ShoppingBag className="w-12 h-12 mx-auto text-brand-primary/20" />
                <h3 className="font-bold text-base text-brand-dark">عذراً، لم نجد نتائج مطابقة!</h3>
                <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
                  جرّب تغيير كلمات البحث، أو مسح الفلاتر المختارة لاستعراض التشكيلة الكاملة.
                </p>
                <button
                  onClick={clearAll}
                  className="bg-brand-primary text-brand-bg font-bold px-5 py-2.5 rounded-xl text-xs hover:bg-brand-dark transition cursor-pointer"
                >
                  عرض كافة المنتجات
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Quick View Modal */}
      <ProductQuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />

      {/* Mobile Filters Drawer */}
      {mobileFiltersOpen && (
        <div
          className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-xs lg:hidden flex justify-end"
          dir="rtl"
        >
          <div className="bg-brand-bg w-full max-w-xs h-full p-6 overflow-y-auto space-y-6 flex flex-col justify-between">
            <div className="space-y-4">
              <div className="flex justify-between items-center border-b border-brand-dark/5 pb-3">
                <h3 className="font-bold text-sm text-brand-dark flex items-center gap-2">
                  <Filter className="w-4 h-4 text-brand-primary" />
                  خيارات التصفية
                </h3>
                <button onClick={() => setMobileFiltersOpen(false)}>
                  <X className="w-5 h-5 text-brand-dark" />
                </button>
              </div>
              <SidebarContent />
            </div>

            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="w-full bg-brand-primary text-brand-bg font-black py-3 rounded-xl text-xs"
            >
              عرض النتائج ({filtered.length})
            </button>
          </div>
        </div>
      )}
    </PageShell>
  );
}
