import { createFileRoute, Link } from "@tanstack/react-router";
import { useSuspenseQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { PageShell } from "@/components/Layout";
import { useCart, formatEGP } from "@/lib/cart";
import { toast } from "sonner";
import { getCategoryIcon } from "@/lib/category-icons";
import {
  Plus,
  Truck,
  ShieldCheck,
  CreditCard,
  HeadphonesIcon,
  Sparkles,
  Heart,
  Search,
  Flame,
  Star,
  SlidersHorizontal,
  Layers,
  ShoppingBag,
} from "lucide-react";
import { useEffect, useState, useMemo } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { Product, isWomenProduct } from "@/types";
import { LiveText, LiveCustomSectionsContainer } from "@/components/LiveEditSystem";

const homeQuery = {
  queryKey: ["home"],
  queryFn: async () => {
    const [{ data: featured }, { data: latest }, { data: allProds }, { data: cats }] =
      await Promise.all([
        supabase.from("products").select("*").eq("featured", true).limit(16),
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(16),
        supabase.from("products").select("*").order("created_at", { ascending: false }).limit(80),
        supabase.from("categories").select("*").order("sort_order"),
      ]);
    const rootCats = MarketplaceStore.getCategories().filter((c) => !c.parentId);
    const categoryList = rootCats.map((c) => ({ id: c.id, name: c.name, icon: c.icon }));
    const customMap = MarketplaceStore.getCustomProducts();

    let featList = (featured ?? []) as Product[];
    let lateList = (latest ?? []) as Product[];
    let allList = (allProds ?? []) as Product[];

    featList = featList.map((p) => (customMap[p.id] ? { ...p, ...customMap[p.id] } : p));
    lateList = lateList.map((p) => (customMap[p.id] ? { ...p, ...customMap[p.id] } : p));
    allList = allList.map((p) => (customMap[p.id] ? { ...p, ...customMap[p.id] } : p));

    return {
      featured: MarketplaceStore.filterDeletedProducts(featList),
      latest: MarketplaceStore.filterDeletedProducts(lateList),
      allProducts: MarketplaceStore.filterDeletedProducts(allList),
      categories: categoryList,
    };
  },
};

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "بيتك" },
      {
        name: "description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات والملابس بأسعار مناسبة وشحن لكل المحافظات.",
      },
      { property: "og:title", content: "بيتك" },
      {
        property: "og:description",
        content:
          "بيتك: منصتك المصرية لشراء الأثاث والأجهزة الكهربائية والسيارات والعقارات والملابس بأسعار مناسبة وشحن لكل المحافظات.",
      },
      { property: "og:type", content: "website" },
    ],
  }),
  loader: ({ context }) => context.queryClient.ensureQueryData(homeQuery),
  component: Home,
});

const TRUST = [
  { icon: Truck, title: "شحن سريع", sub: "لكل المحافظات" },
  { icon: ShieldCheck, title: "ضمان جودة", sub: "على كل قطعة" },
  { icon: CreditCard, title: "دفع عند الاستلام", sub: "بأمان" },
  { icon: HeadphonesIcon, title: "دعم يومي", sub: "٧ أيام / أسبوع" },
];

function Home() {
  const { data } = useSuspenseQuery(homeQuery);
  const { add } = useCart();
  const rawFeatured = data.featured || [];
  const rawLatest = data.latest || [];
  const rawAllProducts = data.allProducts || [];
  const categories = data.categories || [];

  // Include Women Lounge products in main home page feed ONLY for female users
  const userGender = MarketplaceStore.getUserGender();
  const isFemale = userGender === "female";

  const featured = rawFeatured.filter((p) => isFemale || !isWomenProduct(p));
  const latest = rawLatest.filter((p) => isFemale || !isWomenProduct(p));
  const allProducts = rawAllProducts.filter((p) => isFemale || !isWomenProduct(p));

  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [forYouTab, setForYouTab] = useState<"all" | "favorites" | "search" | "trending">("all");
  const [marketplaceCategory, setMarketplaceCategory] = useState<string>("all");

  const [themeConf, setThemeConf] = useState(() => MarketplaceStore.getSiteThemeSettings());
  const queryClient = useQueryClient();

  // User activity signals for "For You Page" recommendations
  const favIds = MarketplaceStore.getFavorites();
  const searchHistory = MarketplaceStore.getSearchHistory();
  const searchQueries = searchHistory.map((s) => s.query.toLowerCase());
  const recentlyViewedIds = MarketplaceStore.getRecentlyViewed();

  const userHasHistory =
    favIds.length > 0 || searchQueries.length > 0 || recentlyViewedIds.length > 0;

  // Personalized recommendation engine logic
  const recommendedScored = useMemo(() => {
    const favProds = allProducts.filter((p) => favIds.includes(p.id));
    const viewedProds = allProducts.filter((p) => recentlyViewedIds.includes(p.id));

    const favCats = new Set([
      ...favProds.map((p) => p.category),
      ...viewedProds.map((p) => p.category),
    ]);
    const favSubCats = new Set([
      ...favProds.map((p) => p.sub_category).filter(Boolean),
      ...viewedProds.map((p) => p.sub_category).filter(Boolean),
    ]);
    const favBrands = new Set([
      ...favProds.map((p) => p.brand).filter(Boolean),
      ...viewedProds.map((p) => p.brand).filter(Boolean),
    ]);

    return allProducts
      .map((p) => {
        let score = 0;
        let matchReason: "favorites" | "search" | "trending" = "trending";

        // Direct match with favorites or recently viewed
        if (favIds.includes(p.id)) {
          score += 30;
          matchReason = "favorites";
        } else if (recentlyViewedIds.includes(p.id)) {
          score += 20;
          matchReason = "favorites";
        }

        // Category/Subcategory match
        if (favCats.has(p.category)) {
          score += 15;
          if (matchReason === "trending") matchReason = "favorites";
        }
        if (p.sub_category && favSubCats.has(p.sub_category)) {
          score += 12;
          if (matchReason === "trending") matchReason = "favorites";
        }

        // Brand match
        if (p.brand && favBrands.has(p.brand)) {
          score += 10;
        }

        // Search query keyword match
        if (searchQueries.length > 0) {
          const fullText =
            `${p.name} ${p.category} ${p.sub_category || ""} ${p.description || ""}`.toLowerCase();
          for (const q of searchQueries) {
            if (q && fullText.includes(q)) {
              score += 25;
              matchReason = "search";
              break;
            }
          }
        }

        // High quality ratings & featured bonus
        if (p.featured) score += 5;
        if (p.rating && p.rating >= 4.5) score += 5;

        return { product: p, score, matchReason };
      })
      .sort((a, b) => b.score - a.score);
  }, [allProducts, favIds, searchQueries, recentlyViewedIds]);

  const filteredForYou = useMemo(() => {
    if (forYouTab === "favorites") {
      const list = recommendedScored.filter((item) => item.matchReason === "favorites");
      return list.length > 0
        ? list.map((i) => i.product)
        : recommendedScored.slice(0, 12).map((i) => i.product);
    }
    if (forYouTab === "search") {
      const list = recommendedScored.filter((item) => item.matchReason === "search");
      return list.length > 0
        ? list.map((i) => i.product)
        : recommendedScored.slice(0, 12).map((i) => i.product);
    }
    if (forYouTab === "trending") {
      return [...allProducts].sort((a, b) => (b.rating || 0) - (a.rating || 0)).slice(0, 12);
    }
    return recommendedScored.slice(0, 18).map((i) => i.product);
  }, [forYouTab, recommendedScored, allProducts]);

  const filteredMarketplace = useMemo(() => {
    if (marketplaceCategory === "all") return allProducts;
    return allProducts.filter(
      (p) =>
        p.category === marketplaceCategory ||
        p.sub_category === marketplaceCategory ||
        (p.main_category && p.main_category === marketplaceCategory),
    );
  }, [allProducts, marketplaceCategory]);

  useEffect(() => {
    setThemeConf(MarketplaceStore.getSiteThemeSettings());
    const handleUpdate = () => {
      setThemeConf(MarketplaceStore.getSiteThemeSettings());
      queryClient.invalidateQueries({ queryKey: ["home"] });
    };
    window.addEventListener("beitak-theme-updated", handleUpdate);
    window.addEventListener("beitak-products-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-theme-updated", handleUpdate);
      window.removeEventListener("beitak-products-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [queryClient]);

  const sectionsOrder = (
    themeConf.homepageSections || [
      "hero",
      "trust",
      "categories",
      "for_you",
      "featured",
      "latest",
      "marketplace",
      "cta",
    ]
  ).filter((s) => s !== "vertical_banners");
  const hidden = themeConf.hiddenSections || [];

  const renderSection = (secId: string) => {
    if (hidden.includes(secId)) return null;

    switch (secId) {
      case "hero":
        return (
          <section key="hero" className="px-4 pt-4 max-w-[1550px] mx-auto w-full">
            <div className="relative rounded-3xl overflow-hidden bg-brand-dark">
              <img
                src={
                  themeConf.bannerUrl ||
                  "https://images.unsplash.com/photo-1616486338812-3dadae4b4ace?w=1600&h=900&fit=crop"
                }
                alt="بيتك"
                className="w-full h-[380px] md:h-[460px] object-cover opacity-70"
              />
              <div className="absolute inset-0 bg-linear-to-l from-brand-dark via-brand-dark/60 to-transparent flex flex-col justify-center p-6 md:p-12 text-brand-bg max-w-2xl">
                <span className="text-xs md:text-sm font-semibold text-brand-accent tracking-widest mb-3">
                  <LiveText id="bannerBadge" defaultText="تشكيلة ٢٠٢٦" />
                </span>
                <h1 className="text-3xl md:text-5xl font-bold mb-3 leading-tight">
                  <LiveText
                    id="bannerTitle"
                    defaultText={themeConf.bannerTitle || "كل اللي بيتك محتاجه في مكان واحد"}
                  />
                </h1>
                <p className="text-brand-bg/80 text-sm md:text-base mb-5 leading-relaxed">
                  <LiveText
                    id="bannerSubtitle"
                    defaultText={
                      themeConf.bannerSubtitle ||
                      "أثاث، أجهزة كهربائية، أزياء، سيارات، وعقارات — تسوق بسهولة وأمان."
                    }
                    multiline
                  />
                </p>
                <div className="flex gap-3 flex-wrap">
                  <Link
                    to="/products"
                    className="bg-brand-accent text-brand-dark font-bold py-3 px-6 rounded-xl text-sm hover:opacity-90 transition"
                  >
                    {themeConf.bannerCtaText || "تسوق الآن"}
                  </Link>
                  <Link
                    to="/contact"
                    className="border border-brand-bg/30 text-brand-bg font-bold py-3 px-6 rounded-xl text-sm hover:bg-white/10 transition"
                  >
                    تواصل معنا
                  </Link>
                </div>
              </div>
            </div>
          </section>
        );
      case "trust":
        return (
          <section key="trust" className="px-4 py-6 max-w-[1550px] mx-auto w-full">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {TRUST.map((t) => (
                <div
                  key={t.title}
                  className="bg-card border border-brand-dark/5 rounded-2xl p-4 flex items-center gap-3"
                  style={{ backgroundColor: themeConf.homepageCard }}
                >
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 grid place-items-center flex-shrink-0">
                    <t.icon className="w-5 h-5 text-brand-primary" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-bold text-sm" style={{ color: themeConf.homepageText }}>
                      {t.title}
                    </p>
                    <p className="text-[11px] text-muted-foreground">{t.sub}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        );
      case "categories":
        return (
          <section key="categories" className="px-4 py-4 max-w-[1550px] mx-auto w-full">
            <div className="flex justify-between items-end mb-4">
              <h2
                className="text-xl md:text-2xl font-bold"
                style={{ color: themeConf.homepageText }}
              >
                <LiveText
                  id="categoriesTitle"
                  defaultText={themeConf.categoriesTitle || "تسوق حسب القسم"}
                />
              </h2>
              <Link to="/products" className="text-brand-primary text-sm font-semibold underline">
                عرض الكل
              </Link>
            </div>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 lg:grid-cols-8 gap-3">
              {categories
                .filter(
                  (c) =>
                    userGender !== "male" ||
                    (!c.name.includes("نساء") && c.slug !== "women" && c.id !== "cat-women"),
                )
                .map((c) => {
                  const Icon = getCategoryIcon(c.name);
                  return (
                    <Link
                      key={c.id}
                      to="/products"
                      search={{ cat: c.name }}
                      className="group bg-card border border-brand-dark/5 rounded-2xl p-4 flex flex-col items-center gap-2 hover:border-brand-accent hover:shadow-md transition"
                      style={{ backgroundColor: themeConf.homepageCard }}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-brand-primary/10 grid place-items-center group-hover:bg-brand-accent/20 transition">
                        <Icon className="w-7 h-7 text-brand-primary" />
                      </div>
                      <span
                        className="text-xs md:text-sm font-bold text-center line-clamp-2"
                        style={{ color: themeConf.homepageText }}
                      >
                        {c.name}
                      </span>
                    </Link>
                  );
                })}
            </div>
          </section>
        );
      case "for_you":
        return (
          <section key="for_you" className="px-4 py-6 max-w-[1550px] mx-auto w-full">
            <div className="bg-brand-bg/80 border border-brand-primary/15 rounded-3xl p-5 md:p-6 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-brand-dark/10 pb-4">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="p-1.5 rounded-xl bg-brand-primary/10 text-brand-primary">
                      <Sparkles className="w-5 h-5 text-brand-primary" />
                    </span>
                    <h2
                      className="text-xl md:text-2xl font-extrabold"
                      style={{ color: themeConf.homepageText }}
                    >
                      قسم مُقترحة لأجلك
                    </h2>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    {userHasHistory
                      ? "منتجات جرى اختيارها وتحديثها تلقائياً بناءً على مفضلاتك وبحثك الأخير واهتماماتك."
                      : "تشكيلة رائعة ومختارة خصيصاً للمستكشفين الجدد بمتجر بيتك."}
                  </p>
                </div>

                <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setForYouTab("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      forYouTab === "all"
                        ? "bg-brand-dark text-brand-bg shadow-sm"
                        : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-brand-accent/20"
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-brand-primary" /> الكل المقترح
                  </button>
                  <button
                    onClick={() => setForYouTab("favorites")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      forYouTab === "favorites"
                        ? "bg-brand-dark text-brand-bg shadow-sm"
                        : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-brand-accent/20"
                    }`}
                  >
                    <Heart className="w-3.5 h-3.5 text-brand-primary" /> حسب المفضلة
                  </button>
                  <button
                    onClick={() => setForYouTab("search")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      forYouTab === "search"
                        ? "bg-brand-dark text-brand-bg shadow-sm"
                        : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-brand-accent/20"
                    }`}
                  >
                    <Search className="w-3.5 h-3.5 text-brand-primary" /> نتائج البحث الأخيرة
                  </button>
                  <button
                    onClick={() => setForYouTab("trending")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap flex items-center gap-1 ${
                      forYouTab === "trending"
                        ? "bg-brand-dark text-brand-bg shadow-sm"
                        : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-brand-accent/20"
                    }`}
                  >
                    <Flame className="w-3.5 h-3.5 text-brand-primary" /> الأعلى تقييماً
                  </button>
                </div>
              </div>

              <ProductGrid
                products={filteredForYou}
                cardBg={themeConf.homepageCard}
                textColor={themeConf.homepageText}
                onSelect={(p) => setSelectedProduct(p)}
                onAdd={(p) => {
                  toast.info("يرجى تحديد اللون والنقاش/المقاس لتأكيد طلبك قبل الإضافة للسلة");
                  setSelectedProduct(p);
                }}
              />
            </div>
          </section>
        );
      case "featured":
        if (featured.length === 0) return null;
        return (
          <section key="featured" className="px-4 py-4 max-w-[1550px] mx-auto w-full">
            <div className="flex justify-between items-end mb-4">
              <h2
                className="text-xl md:text-2xl font-bold"
                style={{ color: themeConf.homepageText }}
              >
                <LiveText
                  id="featuredTitle"
                  defaultText={themeConf.featuredTitle || "الأكثر مبيعاً"}
                />
              </h2>
              <Link to="/products" className="text-brand-primary text-sm font-semibold underline">
                عرض الكل
              </Link>
            </div>
            <ProductGrid
              products={featured}
              cardBg={themeConf.homepageCard}
              textColor={themeConf.homepageText}
              onSelect={(p) => setSelectedProduct(p)}
              onAdd={(p) => {
                toast.info("يرجى تحديد اللون والنقاش/المقاس لتأكيد طلبك قبل الإضافة للسلة");
                setSelectedProduct(p);
              }}
            />
          </section>
        );
      case "latest":
        if (latest.length === 0) return null;
        return (
          <section key="latest" className="px-4 py-6 max-w-[1550px] mx-auto w-full">
            <div className="flex justify-between items-end mb-4">
              <h2
                className="text-xl md:text-2xl font-bold"
                style={{ color: themeConf.homepageText }}
              >
                <LiveText id="latestTitle" defaultText={themeConf.latestTitle || "وصل حديثاً"} />
              </h2>
              <Link to="/products" className="text-brand-primary text-sm font-semibold underline">
                عرض الكل
              </Link>
            </div>
            <ProductGrid
              products={latest}
              cardBg={themeConf.homepageCard}
              textColor={themeConf.homepageText}
              onSelect={(p) => setSelectedProduct(p)}
              onAdd={(p) => {
                toast.info("يرجى تحديد اللون والنقاش/المقاس لتأكيد طلبك قبل الإضافة للسلة");
                setSelectedProduct(p);
              }}
            />
          </section>
        );
      case "marketplace":
        return (
          <section key="marketplace" className="px-4 py-6 max-w-[1550px] mx-auto w-full">
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-brand-dark/10 pb-3">
                <div>
                  <h2
                    className="text-xl md:text-2xl font-bold flex items-center gap-2"
                    style={{ color: themeConf.homepageText }}
                  >
                    <ShoppingBag className="w-6 h-6 text-brand-primary" />
                    تصفح كنز منتجات السوق
                  </h2>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    استكشف كل المنتجات المتوفرة بجميع الأقسام بأسعار تنافسية
                  </p>
                </div>
                <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1">
                  <button
                    onClick={() => setMarketplaceCategory("all")}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                      marketplaceCategory === "all"
                        ? "bg-brand-primary text-white"
                        : "bg-card border border-brand-dark/10 hover:bg-brand-primary/10"
                    }`}
                  >
                    جميع الأقسام
                  </button>
                  {categories.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => setMarketplaceCategory(c.name)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
                        marketplaceCategory === c.name
                          ? "bg-brand-primary text-white"
                          : "bg-card border border-brand-dark/10 hover:bg-brand-primary/10"
                      }`}
                    >
                      {c.name}
                    </button>
                  ))}
                </div>
              </div>

              <ProductGrid
                products={filteredMarketplace.slice(0, 24)}
                cardBg={themeConf.homepageCard}
                textColor={themeConf.homepageText}
                onSelect={(p) => setSelectedProduct(p)}
                onAdd={(p) => {
                  toast.info("يرجى تحديد اللون والنقاش/المقاس لتأكيد طلبك قبل الإضافة للسلة");
                  setSelectedProduct(p);
                }}
              />
            </div>
          </section>
        );
      case "cta":
        return (
          <section key="cta" className="px-4 py-10 max-w-[1550px] mx-auto w-full">
            <div className="bg-brand-dark rounded-3xl p-8 md:p-12 text-brand-bg text-center">
              <h2 className="text-2xl md:text-3xl font-bold mb-2">
                <LiveText id="ctaTitle" defaultText={themeConf.ctaTitle || "جاهز تطلب؟"} />
              </h2>
              <p className="text-brand-bg/70 text-sm md:text-base mb-5 max-w-lg mx-auto">
                <LiveText
                  id="ctaSubtitle"
                  defaultText={
                    themeConf.ctaSubtitle ||
                    "اختار قطعك واملأ بياناتك وهنوصلك لحد باب البيت في أي محافظة."
                  }
                  multiline
                />
              </p>
              <Link
                to="/products"
                className="inline-block bg-brand-accent text-brand-dark font-bold py-3 px-8 rounded-xl text-sm"
              >
                {themeConf.ctaButtonText || "ابدأ التسوق"}
              </Link>
            </div>
          </section>
        );
      default:
        return null;
    }
  };

  return (
    <PageShell>
      <div
        style={{
          backgroundColor: themeConf.homepageBg,
          color: themeConf.homepageText,
          minHeight: "100vh",
        }}
      >
        <LiveCustomSectionsContainer />
        {sectionsOrder.map((secId) => renderSection(secId))}
      </div>

      <ProductQuickViewModal product={selectedProduct} onClose={() => setSelectedProduct(null)} />
    </PageShell>
  );
}

function ProductGrid({
  products,
  onAdd,
  onSelect,
  cardBg,
  textColor,
}: {
  products: Product[];
  onAdd: (p: Product) => void;
  onSelect: (p: Product) => void;
  cardBg?: string;
  textColor?: string;
}) {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {products.map((p) => (
        <div
          key={p.id}
          onClick={() => onSelect(p)}
          className="flex flex-col group p-3 rounded-2xl border border-brand-dark/5 transition shadow-xs cursor-pointer hover:border-brand-accent hover:shadow-lg"
          style={{ backgroundColor: cardBg }}
        >
          <div className="relative rounded-xl overflow-hidden mb-3 bg-secondary aspect-square">
            {p.image_url ? (
              <img
                src={p.image_url}
                alt={p.name}
                className="w-full h-full object-cover group-hover:scale-105 transition duration-500"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full grid place-items-center text-muted-foreground text-xs">
                لا توجد صورة
              </div>
            )}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onAdd(p);
              }}
              className="absolute bottom-2 left-2 w-8 h-8 bg-brand-dark text-brand-bg rounded-full grid place-items-center shadow-lg hover:bg-brand-primary transition cursor-pointer"
              aria-label="أضف للسلة"
            >
              <Plus className="w-4 h-4" />
            </button>
            {p.in_stock === false && (
              <span className="absolute top-2 right-2 bg-destructive text-destructive-foreground text-[10px] font-bold px-2 py-1 rounded-full">
                نفدت الكمية
              </span>
            )}
          </div>
          <h3
            className="font-bold text-xs md:text-sm mb-1 line-clamp-1"
            style={{ color: textColor }}
          >
            {p.name}
          </h3>
          {(p.brand || p.seller_name) && (
            <div className="flex items-center gap-1.5 flex-wrap text-[10px] text-muted-foreground mb-1">
              {p.brand && (
                <span className="font-bold text-brand-dark/80 bg-brand-dark/5 px-1.5 py-0.5 rounded">
                  {p.brand}
                </span>
              )}
              {p.seller_name && (
                <span className="font-semibold text-brand-dark/70">{p.seller_name}</span>
              )}
            </div>
          )}
          <p className="text-brand-accent font-bold text-xs md:text-sm">
            {formatEGP(Number(p.price))}
          </p>
        </div>
      ))}
    </div>
  );
}
