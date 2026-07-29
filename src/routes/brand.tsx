import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import { ShieldCheck, Sparkles, Tag, Eye, Heart } from "lucide-react";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";

import { Product } from "@/types";

export const Route = createFileRoute("/brand")({
  component: BrandPage,
});

export function BrandPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedBrand, setSelectedBrand] = useState<string>("الكل");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const loadData = async () => {
    const { data: dbProds } = await supabase.from("products").select("*");
    const customProds = Object.values(MarketplaceStore.getCustomProducts() || {});
    const combined = [...(dbProds || []), ...customProds];
    setProducts(MarketplaceStore.filterDeletedProducts(combined));
  };

  useEffect(() => {
    loadData();
    window.addEventListener("beitak-products-updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("beitak-products-updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const availableBrands = useMemo(() => {
    const set = new Set<string>();
    products.forEach((p) => {
      const b = p.brand || p.meta?.brand || p.vendor;
      if (b) set.add(b);
    });
    return ["الكل", ...Array.from(set)];
  }, [products]);

  const filteredProducts = useMemo(() => {
    if (selectedBrand === "الكل") return products;
    return products.filter((p) => (p.brand || p.meta?.brand || p.vendor) === selectedBrand);
  }, [products, selectedBrand]);

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Header */}
        <div className="bg-brand-dark text-white p-6 rounded-2xl shadow-xs flex items-center justify-between">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1.5 text-brand-accent text-xs font-bold">
              <ShieldCheck className="w-4 h-4" /> الماركات
            </span>
            <h1 className="text-xl md:text-2xl font-bold">العلامات التجارية والماركات</h1>
          </div>
          <div className="text-left">
            <span className="text-2xl font-bold text-brand-accent">
              {availableBrands.length - 1}
            </span>
            <p className="text-xs text-slate-300">علامة تجارية</p>
          </div>
        </div>

        {/* Brands Selector Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-dark/10">
          {availableBrands.map((brand) => (
            <button
              key={brand}
              onClick={() => setSelectedBrand(brand)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition shrink-0 cursor-pointer ${
                selectedBrand === brand
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-secondary"
              }`}
            >
              {brand}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="space-y-4">
          <h2 className="font-black text-lg text-brand-dark flex items-center gap-2">
            <Tag className="w-5 h-5 text-brand-primary" />
            منتجات الماركة المختارة: {selectedBrand} ({filteredProducts.length})
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <div
                key={product.id}
                onClick={() => setSelectedProduct(product)}
                className="bg-card border border-brand-dark/10 hover:border-brand-primary transition rounded-3xl overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
              >
                <div className="h-48 w-full overflow-hidden bg-secondary">
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

                <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                  <div>
                    <span className="text-[10px] font-bold text-brand-primary uppercase">
                      {product.brand || product.meta?.brand || "علامة تجارية"}
                    </span>
                    <h3 className="font-black text-xs text-brand-dark line-clamp-2">
                      {product.title || product.name}
                    </h3>
                  </div>

                  <div className="pt-2 border-t border-brand-dark/5 flex items-center justify-between">
                    <span className="text-sm font-black text-brand-primary">
                      {Number(product.price || 0).toLocaleString()} ج.م
                    </span>
                    <button className="bg-secondary text-brand-dark p-2 rounded-xl text-xs hover:bg-brand-primary hover:text-white transition">
                      <Eye className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
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
