import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Store as StoreIcon,
  Phone,
  MessageCircle,
  MapPin,
  Star,
  CheckCircle2,
  Package,
  Share2,
  Eye,
  Heart,
  MessageSquare,
  ShieldCheck,
} from "lucide-react";
import { ProductQuickViewModal } from "@/components/ProductQuickViewModal";
import { DirectMessagingModal } from "@/components/DirectMessagingModal";
import { toast } from "sonner";

import { Product } from "@/types";

interface SellerStoreItem {
  id: string;
  store_name: string;
  owner_name: string;
  seller_type: string;
  phone?: string;
  whatsapp?: string;
  governorates?: string[];
  rating: number;
  verified: boolean;
  logo_url?: string;
  cover_url?: string;
  bio?: string;
}

export const Route = createFileRoute("/store")({
  component: SellerStorePage,
});

export function SellerStorePage() {
  const [sellers, setSellers] = useState<SellerStoreItem[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState<string | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [chatOpen, setChatOpen] = useState(false);

  const loadSellersAndProducts = async () => {
    // Load sellers from custom state / Supabase
    const { data: dbSellers } = await supabase.from("sellers").select("*");
    const defaultSellers = [
      {
        id: "seller-habiba",
        store_name: "متجر حبيبة المعاين والمميز",
        owner_name: "حبيبة علي",
        seller_type: "معرض معتمد",
        phone: "01000000000",
        whatsapp: "01000000000",
        governorates: ["القاهرة", "الجيزة", "الإسكندرية", "الدقهلية"],
        rating: 4.9,
        verified: true,
        logo_url: "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&fit=crop",
        cover_url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&fit=crop",
        bio: "متجر متخصص في الأثاث الذهبي والزان الفاخر، صالونات، غرف نوم، ومفروشات مع إمكانية المعاينة قبل الدفع بالكامل.",
      },
      {
        id: "seller-tech",
        store_name: "بيتك للإلكترونيات والأجهزة",
        owner_name: "عمر أحمد",
        seller_type: "موزع رسمي",
        phone: "01100000000",
        whatsapp: "01100000000",
        governorates: ["جميع المحافظات"],
        rating: 4.8,
        verified: true,
        logo_url: "https://images.unsplash.com/photo-1511707171634-5f897ff02aa9?w=300&fit=crop",
        cover_url: "https://images.unsplash.com/photo-1526738549149-8e07eca6c147?w=1200&fit=crop",
        bio: "أحدث الأجهزة الكهربائية، الهواتف، والتلفزيونات بضمان معتمد وأسعار الجملة والتوصيل لجميع المحافظات.",
      },
    ];

    const mergedSellers = [...(dbSellers || []), ...defaultSellers];
    setSellers(mergedSellers);

    if (!selectedSellerId && mergedSellers.length > 0) {
      setSelectedSellerId(mergedSellers[0].id);
    }

    // Load products
    const { data: dbProds } = await supabase.from("products").select("*");
    const customProds = Object.values(MarketplaceStore.getCustomProducts() || {});
    const combined = [...(dbProds || []), ...customProds];
    setProducts(MarketplaceStore.filterDeletedProducts(combined));
  };

  useEffect(() => {
    loadSellersAndProducts();
    window.addEventListener("beitak-products-updated", loadSellersAndProducts);
    window.addEventListener("storage", loadSellersAndProducts);
    return () => {
      window.removeEventListener("beitak-products-updated", loadSellersAndProducts);
      window.removeEventListener("storage", loadSellersAndProducts);
    };
  }, []);

  const activeSeller = useMemo(() => {
    return sellers.find((s) => s.id === selectedSellerId) || sellers[0] || null;
  }, [selectedSellerId, sellers]);

  const sellerProducts = useMemo(() => {
    if (!activeSeller) return [];
    return products.filter(
      (p) => p.seller_id === activeSeller.id || p.sellerId === activeSeller.id || true,
    );
  }, [activeSeller, products]);

  const handleShareStore = () => {
    if (navigator.share) {
      navigator.share({ title: activeSeller?.store_name, url: window.location.href });
    } else {
      navigator.clipboard.writeText(window.location.href);
      toast.success("تم نسخ رابط متجر البائع للذاكرة! 🔗");
    }
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Seller Selector Tabs */}
        <div className="flex items-center gap-3 overflow-x-auto pb-2 border-b border-brand-dark/10">
          {sellers.map((s) => (
            <button
              key={s.id}
              onClick={() => setSelectedSellerId(s.id)}
              className={`px-4 py-2.5 rounded-2xl text-xs font-black transition flex items-center gap-2 cursor-pointer shrink-0 ${
                s.id === activeSeller?.id
                  ? "bg-brand-primary text-white shadow-md"
                  : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-secondary"
              }`}
            >
              <StoreIcon className="w-4 h-4" />
              <span>{s.store_name}</span>
            </button>
          ))}
        </div>

        {activeSeller && (
          <>
            {/* Store Header Banner */}
            <div className="bg-card border border-brand-dark/10 rounded-3xl overflow-hidden shadow-xl space-y-6">
              {/* Cover Image */}
              <div className="h-48 md:h-64 w-full bg-slate-900 relative">
                <img
                  src={
                    activeSeller.cover_url ||
                    "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=1200&fit=crop"
                  }
                  alt="Store Cover"
                  className="w-full h-full object-cover opacity-80"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                <button
                  onClick={handleShareStore}
                  className="absolute top-4 left-4 bg-white/80 hover:bg-white text-brand-dark p-2.5 rounded-2xl shadow-md transition"
                >
                  <Share2 className="w-4 h-4" />
                </button>
              </div>

              {/* Store Profile Info */}
              <div className="px-6 pb-6 relative -mt-16 md:-mt-20 flex flex-col md:flex-row items-start md:items-end justify-between gap-6">
                <div className="flex items-end gap-4">
                  <div className="w-24 h-24 md:w-32 md:h-32 rounded-3xl bg-white border-4 border-white shadow-2xl overflow-hidden shrink-0">
                    <img
                      src={
                        activeSeller.logo_url ||
                        "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=300&fit=crop"
                      }
                      alt="Logo"
                      className="w-full h-full object-cover"
                    />
                  </div>

                  <div className="space-y-1 text-white md:text-brand-dark">
                    <div className="flex items-center gap-2">
                      <h1 className="text-xl md:text-3xl font-black">{activeSeller.store_name}</h1>
                    </div>
                    <p className="text-xs font-bold text-muted-foreground flex items-center gap-1.5">
                      <span>مالك المتجر: {activeSeller.owner_name}</span> •{" "}
                      <span className="text-brand-primary font-black">
                        {activeSeller.seller_type}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Contact Actions */}
                <div className="flex items-center gap-2 flex-wrap w-full md:w-auto">
                  <button
                    onClick={() => setChatOpen(true)}
                    className="flex-1 md:flex-initial bg-brand-primary text-white font-black px-5 py-3 rounded-2xl text-xs hover:bg-brand-dark transition shadow-md flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <MessageSquare className="w-4 h-4" /> تواصل مع البائع
                  </button>

                  {activeSeller.phone && (
                    <a
                      href={`tel:${activeSeller.phone}`}
                      className="bg-emerald-600 text-white font-black px-4 py-3 rounded-2xl text-xs hover:bg-emerald-700 transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <Phone className="w-4 h-4" /> اتصل
                    </a>
                  )}

                  {activeSeller.whatsapp && (
                    <a
                      href={`https://wa.me/2${activeSeller.whatsapp}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-500 text-white font-black px-4 py-3 rounded-2xl text-xs hover:bg-emerald-600 transition shadow-md flex items-center justify-center gap-1.5"
                    >
                      <MessageCircle className="w-4 h-4" /> واتساب
                    </a>
                  )}
                </div>
              </div>

              {/* Bio & Details */}
              <div className="px-6 pb-6 pt-2 border-t border-brand-dark/10 flex flex-col md:flex-row justify-between gap-4 text-xs font-medium text-brand-dark">
                <p className="max-w-3xl leading-relaxed">{activeSeller.bio}</p>
                <div className="flex items-center gap-3 shrink-0">
                  <span className="flex items-center gap-1 bg-amber-50 text-amber-900 border border-amber-200 px-3 py-1 rounded-full font-black">
                    <Star className="w-3.5 h-3.5 fill-amber-500 text-amber-500" />{" "}
                    {activeSeller.rating} تقييم المشتريين
                  </span>
                  <span className="flex items-center gap-1 bg-blue-50 text-blue-900 border border-blue-200 px-3 py-1 rounded-full font-bold">
                    <MapPin className="w-3.5 h-3.5 text-blue-600" />{" "}
                    {activeSeller.governorates
                      ? activeSeller.governorates.join("، ")
                      : "جميع المحافظات"}
                  </span>
                </div>
              </div>
            </div>

            {/* Seller Products Catalog */}
            <div className="space-y-4">
              <h2 className="font-black text-lg text-brand-dark flex items-center gap-2">
                <Package className="w-5 h-5 text-brand-primary" /> منتجات متجر{" "}
                {activeSeller.store_name} ({sellerProducts.length})
              </h2>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {sellerProducts.map((p) => (
                  <div
                    key={p.id}
                    onClick={() => setSelectedProduct(p)}
                    className="bg-card border border-brand-dark/10 hover:border-brand-primary transition rounded-3xl overflow-hidden shadow-xs hover:shadow-md flex flex-col justify-between group cursor-pointer"
                  >
                    <div className="h-48 w-full overflow-hidden bg-secondary">
                      <img
                        src={
                          p.image_url ||
                          (p.images && p.images[0]) ||
                          "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=500&fit=crop"
                        }
                        alt={p.title || p.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition duration-300"
                      />
                    </div>

                    <div className="p-4 space-y-2 flex-1 flex flex-col justify-between">
                      <div>
                        <span className="text-[10px] font-bold text-brand-primary uppercase">
                          {p.category || "عام"}
                        </span>
                        <h3 className="font-black text-xs text-brand-dark line-clamp-2">
                          {p.title || p.name}
                        </h3>
                      </div>

                      <div className="pt-2 border-t border-brand-dark/5 flex items-center justify-between">
                        <span className="text-sm font-black text-brand-primary">
                          {Number(p.price || 0).toLocaleString()} ج.م
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
          </>
        )}

        {/* Quick View Modal */}
        {selectedProduct && (
          <ProductQuickViewModal
            isOpen={!!selectedProduct}
            onClose={() => setSelectedProduct(null)}
            product={selectedProduct}
          />
        )}

        {/* Messaging Chat Modal */}
        {chatOpen && activeSeller && (
          <DirectMessagingModal
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            sellerId={activeSeller.id}
            sellerName={activeSeller.store_name}
          />
        )}
      </div>
    </PageShell>
  );
}
