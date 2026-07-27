import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import { Flame, Percent, Tag, ArrowRight, Heart, ShoppingBag, Eye, Sparkles } from "lucide-react";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";

import { Product } from "@/types";

export const Route = createFileRoute("/deals")({
  component: DealsPage,
});

export function DealsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);

  const loadData = async () => {
    // 1. Fetch Supabase products
    const { data: dbProds } = await supabase.from("products").select("*");
    const customProdsObj = MarketplaceStore.getCustomProducts();
    const customList = Object.values(customProdsObj || {});

    const merged = [...((dbProds as Product[]) || []), ...customList];

    // Filter deals with real original_price > price
    const dealItems = merged.filter((p: Product) => {
      const orig = Number(p.original_price || p.meta?.original_price || 0);
      const curr = Number(p.price || 0);
      return orig > curr;
    });

    setProducts(dealItems);
    setFavorites(MarketplaceStore.getFavorites());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("beitak-favorites-updated", () =>
      setFavorites(MarketplaceStore.getFavorites()),
    );
  }, []);

  const handleToggleFav = (e: React.MouseEvent, productId: string) => {
    e.stopPropagation();
    MarketplaceStore.toggleFavorite(productId);
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Banner */}
        <div className="bg-gradient-to-r from-rose-600 via-amber-600 to-amber-500 text-white p-8 md:p-12 rounded-3xl shadow-2xl flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="space-y-3 text-center md:text-start relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-white/20 border border-white/30 text-white px-4 py-1.5 rounded-full text-xs font-black">
              <Flame className="w-4 h-4 fill-amber-300 text-amber-300" /> أقوى التخفيضات والعروض
              المباشرة
            </span>
            <h1 className="text-2xl md:text-4xl font-black leading-tight">
              عروض وتخفيضات حقيقية من تجار بيتك المعتمدين 🔥
            </h1>
            <p className="text-xs md:text-sm text-white/90 leading-relaxed font-medium">
              تصفح التخفيضات الفعلية المقدمة من البائعين على قطع الأثاث، الإلكترونيات، والأزياء مع
              ضمان المعاينة والفحص المباشر قبل الدفع.
            </p>
          </div>

          <div className="bg-white/10 backdrop-blur-md p-6 rounded-3xl border border-white/20 text-center space-y-1 shrink-0 relative z-10">
            <span className="text-3xl font-black text-amber-300">{products.length}</span>
            <p className="text-xs font-bold text-white">منتج متوفر عليه خصم حالياً</p>
          </div>
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <h2 className="font-black text-lg text-brand-dark flex items-center gap-2">
            <Tag className="w-5 h-5 text-rose-600" /> كافة المنتجات ذات التخفيض الحالي
          </h2>

          {products.length === 0 ? (
            <div className="bg-card border border-brand-dark/10 p-16 text-center rounded-3xl space-y-3">
              <Percent className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">
                لا توجد عروض وتخفيضات نشطة حالياً
              </p>
              <Link
                to="/products"
                className="inline-block text-xs font-black text-brand-primary hover:underline"
              >
                تصفح كافة المنتجات العادية →
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
              {products.map((product) => {
                const origPrice = Number(
                  product.original_price || product.meta?.original_price || 0,
                );
                const currPrice = Number(product.price || 0);
                const discountPercent =
                  origPrice > currPrice
                    ? Math.round(((origPrice - currPrice) / origPrice) * 100)
                    : 0;
                const isFav = favorites.includes(product.id);

                return (
                  <div
                    key={product.id}
                    onClick={() => setSelectedProduct(product)}
                    className="bg-card border border-brand-dark/10 hover:border-brand-primary transition rounded-3xl overflow-hidden shadow-xs hover:shadow-lg flex flex-col justify-between group cursor-pointer relative"
                  >
                    {/* Discount Badge */}
                    {discountPercent > 0 && (
                      <span className="absolute top-3 right-3 bg-rose-600 text-white font-black text-[11px] px-3 py-1 rounded-full shadow-md z-10 flex items-center gap-1">
                        <Flame className="w-3.5 h-3.5 fill-white" /> خصم {discountPercent}%
                      </span>
                    )}

                    {/* Favorite Button */}
                    <button
                      onClick={(e) => handleToggleFav(e, product.id)}
                      className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/80 hover:bg-white backdrop-blur-xs grid place-items-center shadow-md z-10 text-brand-dark hover:text-rose-600 transition"
                    >
                      <Heart className={`w-5 h-5 ${isFav ? "fill-rose-600 text-rose-600" : ""}`} />
                    </button>

                    {/* Thumbnail */}
                    <div className="h-52 w-full overflow-hidden bg-secondary relative">
                      <img
                        src={
                          product.image_url ||
                          (product.images && product.images[0]) ||
                          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&fit=crop"
                        }
                        alt={product.title || product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    {/* Body */}
                    <div className="p-5 space-y-3 flex-1 flex flex-col justify-between">
                      <div className="space-y-1">
                        <span className="text-[10px] font-bold text-brand-primary uppercase">
                          {product.category || "العروض"}
                        </span>
                        <h3 className="font-black text-sm text-brand-dark line-clamp-2 leading-snug">
                          {product.title || product.name}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-brand-dark/5 flex items-center justify-between">
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="text-base font-black text-rose-600">
                              {currPrice.toLocaleString()} ج.م
                            </span>
                            {origPrice > 0 && (
                              <span className="text-xs text-muted-foreground line-through font-bold">
                                {origPrice.toLocaleString()} ج.م
                              </span>
                            )}
                          </div>
                        </div>

                        <button className="bg-brand-primary text-white p-2.5 rounded-2xl hover:bg-brand-dark transition shadow-2xs">
                          <Eye className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Quick View Modal */}
        {selectedProduct && (
          <ProductQuickViewModal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
          />
        )}
      </div>
    </PageShell>
  );
}
