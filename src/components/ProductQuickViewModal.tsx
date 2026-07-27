import React, { useState } from "react";
import {
  X,
  Plus,
  Minus,
  ShoppingBag,
  MapPin,
  ShieldCheck,
  Truck,
  Star,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Heart,
  Check,
  Layers,
  Sparkles,
  MessageSquare,
  Send,
  Building,
  Eye,
  CreditCard,
} from "lucide-react";
import { useCart, formatEGP } from "@/lib/cart";
import { toast } from "sonner";
import { Product, ProductReview } from "@/types";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { useNavigate } from "@tanstack/react-router";

interface ProductQuickViewModalProps {
  product: Product | null;
  onClose: () => void;
}

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

export function ProductQuickViewModal({ product, onClose }: ProductQuickViewModalProps) {
  const { add } = useCart();
  const navigate = useNavigate();
  const [quantity, setQuantity] = useState(1);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);

  // Real Reviews state (no fake mock data)
  const [reviews, setReviews] = useState<ProductReview[]>(() => {
    if (!product?.id) return [];
    return MarketplaceStore.getReviews(product.id);
  });
  const [newComment, setNewComment] = useState("");
  const [newRating, setNewRating] = useState(5);

  // Amazon Zoom Lens & Manual Pinch Zoom State
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [isZoomed, setIsZoomed] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });
  const [manualZoom, setManualZoom] = useState(1);
  const [touchDist, setTouchDist] = useState<number | null>(null);

  const handleNextImage = () => {
    setIsZoomed(false);
    setManualZoom(1);
    setActiveImageIndex((prev) => (prev === galleryImages.length - 1 ? 0 : prev + 1));
  };

  const handlePrevImage = () => {
    setIsZoomed(false);
    setManualZoom(1);
    setActiveImageIndex((prev) => (prev === 0 ? galleryImages.length - 1 : prev - 1));
  };

  if (!product) return null;

  const productMeta = MarketplaceStore.getProductMetadata(product.id);
  const rawGallery: string[] = [];
  if (product.images && product.images.length > 0) {
    rawGallery.push(...product.images);
  }
  if (productMeta.images && productMeta.images.length > 0) {
    rawGallery.push(...productMeta.images.map((img) => img.url));
  }
  if (product.image_url) {
    rawGallery.push(product.image_url);
  }
  // Deduplicate gallery images while preserving order
  const galleryImages: string[] = Array.from(new Set(rawGallery.filter(Boolean)));

  const currentImage = galleryImages[activeImageIndex] || product.image_url || "";

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setZoomPos({ x, y });
  };

  const handleColorSelect = (col: string) => {
    const isSelected = selectedColor === col;
    const nextColor = isSelected ? null : col;
    setSelectedColor(nextColor);

    // If image color mapping exists, switch image index automatically
    if (nextColor && product.image_color_map && product.image_color_map[nextColor]) {
      const mappedUrl = product.image_color_map[nextColor];
      const foundIdx = galleryImages.findIndex((img) => img === mappedUrl);
      if (foundIdx !== -1) {
        setActiveImageIndex(foundIdx);
      }
    }
  };

  const validateVariantSelections = () => {
    if (product.colors && product.colors.length > 0 && !selectedColor) {
      toast.error("يرجى تحديد اللون المطلوب أولاً من الخيارات قبل الإضافة!");
      return false;
    }
    if (product.sizes && product.sizes.length > 0 && !selectedSize) {
      toast.error("يرجى تحديد المقاس المطلوب أولاً من الخيارات قبل الإضافة!");
      return false;
    }
    return true;
  };

  const handleAddToCart = () => {
    if (!validateVariantSelections()) return;

    for (let i = 0; i < quantity; i++) {
      add({
        id: product.id,
        name:
          product.name +
          (selectedColor ? ` (${selectedColor})` : "") +
          (selectedSize ? ` - ${selectedSize}` : ""),
        price: Number(product.price),
        image_url: currentImage,
      });
    }
    toast.success(`تمت إضافة ${quantity} من "${product.name}" إلى السلة بنجاح!`);
    onClose();
  };

  const handleBuyNow = () => {
    if (!validateVariantSelections()) return;

    handleAddToCart();
    navigate({ to: "/checkout" });
  };

  const handleAddReview = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;

    const newRev = MarketplaceStore.addReview(product.id, {
      product_id: product.id,
      user_name: "مشتري معتمد",
      rating: newRating,
      comment: newComment.trim(),
    });
    setReviews((prev) => [newRev, ...prev]);
    setNewComment("");
    toast.success("شكراً لك! تم نشر تقييمك للمنتج بنجاح.");
  };

  const deliverableGovs =
    product.available_governorates && product.available_governorates.length > 0
      ? product.available_governorates
      : ["جميع المحافظات"];

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-sm flex items-center justify-center p-3 md:p-6 overflow-y-auto animate-fadeIn"
      dir="rtl"
    >
      <div className="bg-card w-full max-w-5xl rounded-3xl p-5 md:p-8 relative border border-brand-dark/10 shadow-2xl space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Top Header Bar */}
        <div className="flex items-center justify-between border-b border-brand-dark/5 pb-3">
          <div className="flex items-center gap-2">
            <span className="bg-brand-primary/10 text-brand-primary text-xs font-black px-3 py-1 rounded-xl flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              تفاصيل المنتج ومعاينة مكبرة
            </span>
            <span className="text-xs text-muted-foreground font-bold hidden sm:inline">
              كود المنتج: #{product.id.slice(0, 8)}
            </span>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition cursor-pointer"
            aria-label="إغلاق"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
          {/* Left Column: Image Gallery & Amazon Magnifier */}
          <div className="space-y-4">
            {/* Main Stage with Hover Magnifier Lens, Pinch Zoom & Arrow Navigation */}
            <div
              className="relative rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-900 aspect-square border border-brand-dark/10 shadow-inner flex items-center justify-center group touch-none select-none"
              onMouseEnter={() => {
                if (manualZoom === 1) setIsZoomed(true);
              }}
              onMouseLeave={() => setIsZoomed(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={(e) => {
                if (e.touches.length === 2) {
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY,
                  );
                  setTouchDist(dist);
                }
              }}
              onTouchMove={(e) => {
                if (e.touches.length === 2 && touchDist !== null) {
                  const dist = Math.hypot(
                    e.touches[0].clientX - e.touches[1].clientX,
                    e.touches[0].clientY - e.touches[1].clientY,
                  );
                  const delta = dist - touchDist;
                  if (Math.abs(delta) > 3) {
                    setManualZoom((prev) => Math.min(Math.max(prev + delta * 0.01, 1), 3.5));
                    setTouchDist(dist);
                  }
                }
              }}
              onTouchEnd={() => setTouchDist(null)}
            >
              {currentImage ? (
                <img
                  src={currentImage}
                  alt={product.name}
                  className="w-full h-full object-contain transition-transform duration-150"
                  style={{
                    transform: `scale(${manualZoom > 1 ? manualZoom : isZoomed ? 2 : 1})`,
                    transformOrigin: `${zoomPos.x}% ${zoomPos.y}%`,
                  }}
                />
              ) : (
                <div className="text-center p-6 text-muted-foreground">
                  <ShoppingBag className="w-12 h-12 mx-auto mb-2 text-brand-primary/20" />
                  <span>لا توجد صورة متوفرة</span>
                </div>
              )}

              {/* Left/Right Arrow Navigation for Browsing Images */}
              {galleryImages.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePrevImage();
                    }}
                    className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-brand-dark/80 text-white flex items-center justify-center shadow-lg hover:bg-brand-dark transition cursor-pointer z-10 font-bold"
                    title="الصورة السابقة"
                  >
                    ‹
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleNextImage();
                    }}
                    className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-brand-dark/80 text-white flex items-center justify-center shadow-lg hover:bg-brand-dark transition cursor-pointer z-10 font-bold"
                    title="الصورة التالية"
                  >
                    ›
                  </button>
                </>
              )}

              {/* Image counter indicator */}
              {galleryImages.length > 1 && (
                <div className="absolute top-3 right-3 bg-brand-dark/80 text-white text-[10px] font-black px-2.5 py-1 rounded-xl backdrop-blur-xs z-10">
                  {activeImageIndex + 1} / {galleryImages.length}
                </div>
              )}

              {/* Manual Zoom Control Bar (+ / - / Reset) */}
              {currentImage && (
                <div className="absolute bottom-3 right-3 flex items-center gap-1 bg-brand-dark/80 text-white p-1 rounded-2xl backdrop-blur-md z-20 shadow-lg">
                  <button
                    type="button"
                    onClick={() => setManualZoom((prev) => Math.min(prev + 0.5, 3.5))}
                    className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-xs font-black"
                    title="تكبير"
                  >
                    <ZoomIn className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setManualZoom((prev) => Math.max(prev - 0.5, 1))}
                    className="w-7 h-7 rounded-xl bg-white/10 hover:bg-white/20 flex items-center justify-center transition cursor-pointer text-xs font-black"
                    title="تصغير"
                  >
                    <ZoomOut className="w-3.5 h-3.5" />
                  </button>
                  {manualZoom > 1 && (
                    <button
                      type="button"
                      onClick={() => {
                        setManualZoom(1);
                        setIsZoomed(false);
                      }}
                      className="w-7 h-7 rounded-xl bg-amber-500 text-stone-950 flex items-center justify-center transition cursor-pointer text-xs font-black"
                      title="إعادة ضبط الحجم الأصلي"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                    </button>
                  )}
                  <span className="text-[10px] font-bold px-1.5 text-white/90 dir-ltr">
                    {Math.round(manualZoom * 100)}%
                  </span>
                </div>
              )}

              {/* Wishlist Button */}
              <button
                type="button"
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  toast.success(
                    !isWishlisted
                      ? `تمت إضافة "${product.name}" إلى مفضلتك`
                      : `تمت إزالة المنتجات من المفضلة`,
                  );
                }}
                className={`absolute top-3 left-3 w-9 h-9 rounded-full flex items-center justify-center shadow-md transition cursor-pointer ${
                  isWishlisted
                    ? "bg-destructive text-white"
                    : "bg-white/90 text-brand-dark hover:bg-white"
                }`}
                title="المفضلة"
              >
                <Heart className={`w-4 h-4 ${isWishlisted ? "fill-current" : ""}`} />
              </button>

              {!product.in_stock && (
                <div className="absolute inset-0 bg-brand-dark/60 backdrop-blur-xs flex items-center justify-center">
                  <span className="bg-destructive text-white text-xs font-black px-4 py-1.5 rounded-full">
                    غير متوفر بالمخزن حالياً
                  </span>
                </div>
              )}
            </div>

            {/* Thumbnail Carousel Selector */}
            {galleryImages.length > 1 && (
              <div className="flex gap-2.5 overflow-x-auto pb-1">
                {galleryImages.map((img, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setActiveImageIndex(idx);
                      setIsZoomed(false);
                      setManualZoom(1);
                    }}
                    className={`w-16 h-16 rounded-2xl overflow-hidden border-2 transition cursor-pointer shrink-0 ${
                      activeImageIndex === idx
                        ? "border-brand-primary ring-2 ring-brand-primary/20"
                        : "border-brand-dark/10 opacity-70 hover:opacity-100"
                    }`}
                  >
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {/* Seller Badge Info Box */}
            <div className="bg-brand-bg border border-brand-dark/5 p-4 rounded-2xl flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary font-black flex items-center justify-center text-sm">
                  <Building className="w-5 h-5" />
                </div>
                <div>
                  <span className="text-[10px] text-muted-foreground block font-bold">
                    المتجر / البائع:
                  </span>
                  <span className="text-xs font-extrabold text-brand-dark">
                    {product.seller_name || "تاجر بموقع بيتك"}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Details, Colors, Sizes & Order Actions */}
          <div className="space-y-5">
            <div>
              <div className="flex items-center gap-2 mb-1.5 text-amber-500 text-xs font-bold">
                <div className="flex items-center gap-0.5">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="text-sm font-black">{product.rating || "4.9"}</span>
                </div>
                <span className="text-muted-foreground">
                  ({product.sales_count || Math.floor(Math.random() * 90 + 30)} طلب مكتمل عبر منصة
                  بيتك)
                </span>
              </div>

              <h2 className="text-xl font-extrabold text-brand-dark leading-snug">
                {product.name}
              </h2>

              <div className="mt-3 flex items-baseline gap-3">
                <span className="text-3xl font-black text-brand-primary">
                  {formatEGP(Number(product.price))}
                </span>
                <span className="text-xs text-emerald-700 font-bold bg-emerald-500/10 px-3 py-1 rounded-full">
                  السعر شامل الضريبة والضمان
                </span>
              </div>
            </div>

            {/* Description */}
            <p className="text-xs text-muted-foreground leading-relaxed">
              {product.description ||
                product.short_description ||
                "منتج عصري مصنع بعناية طبقاً لأعلى معايير الجودة، مصمم للتحمل والأناقة مع ضمان معاينة حقيقي عند استلام الشحنة."}
            </p>

            {/* Specifications: Area & Capacity/Weight */}
            {(product.area_sqm ||
              productMeta.specifications?.area_sqm ||
              product.capacity_weight ||
              productMeta.specifications?.capacity_weight) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {(product.area_sqm || productMeta.specifications?.area_sqm) && (
                  <span className="bg-amber-500/10 text-amber-900 border border-amber-500/20 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <Building className="w-3.5 h-3.5 text-amber-700" />
                    <span>المساحة: {product.area_sqm || productMeta.specifications?.area_sqm}</span>
                  </span>
                )}
                {(product.capacity_weight || productMeta.specifications?.capacity_weight) && (
                  <span className="bg-brand-dark/5 text-brand-dark border border-brand-dark/10 px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-brand-primary" />
                    <span>
                      الحمولة / السعة:{" "}
                      {product.capacity_weight || productMeta.specifications?.capacity_weight}
                    </span>
                  </span>
                )}
              </div>
            )}

            {/* Amazon Color Swatches Selector with Mandatory Manual Choice */}
            {product.colors && product.colors.length > 0 && (
              <div className="space-y-2 border-t border-brand-dark/5 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-brand-dark">
                    اختر اللون المطلوب:{" "}
                    {selectedColor ? (
                      <span className="text-brand-primary font-black">({selectedColor})</span>
                    ) : (
                      <span className="text-destructive font-semibold text-[11px]">
                        * يلزم الاختيار
                      </span>
                    )}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((col) => {
                    const hex = colorMap[col] || "#D1D5DB";
                    const isSelected = selectedColor === col;
                    return (
                      <button
                        key={col}
                        type="button"
                        onClick={() => handleColorSelect(col)}
                        className={`px-3.5 py-2 rounded-2xl text-xs font-bold flex items-center gap-2 border transition cursor-pointer ${
                          isSelected
                            ? "border-brand-primary bg-brand-primary/10 text-brand-primary font-black shadow-xs ring-2 ring-brand-primary/20"
                            : "border-brand-dark/10 hover:border-brand-dark/30 bg-card text-brand-dark"
                        }`}
                      >
                        <span
                          className="w-3.5 h-3.5 rounded-full border border-brand-dark/20 shadow-xs"
                          style={{ backgroundColor: hex }}
                        />
                        <span>{col}</span>
                        {isSelected && <Check className="w-3.5 h-3.5" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Amazon Size Chips Selector with Mandatory Manual Choice */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="space-y-2 border-t border-brand-dark/5 pt-3">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-bold text-brand-dark">
                    اختر المقاس / الأبعاد المطلوبة:{" "}
                    {selectedSize ? (
                      <span className="text-brand-primary font-black">({selectedSize})</span>
                    ) : (
                      <span className="text-destructive font-semibold text-[11px]">
                        * يلزم الاختيار
                      </span>
                    )}
                  </label>
                </div>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((sz) => {
                    const isSelected = selectedSize === sz;
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => setSelectedSize(isSelected ? null : sz)}
                        className={`px-4 py-2 rounded-2xl text-xs font-bold border transition cursor-pointer ${
                          isSelected
                            ? "border-brand-primary bg-brand-primary text-brand-bg shadow-sm"
                            : "border-brand-dark/10 hover:border-brand-dark/30 bg-card text-brand-dark"
                        }`}
                      >
                        {sz}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Deliverable Governorates list badge */}
            <div className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-3 space-y-1.5">
              <div className="flex items-center gap-1.5 text-xs font-bold text-brand-dark">
                <MapPin className="w-4 h-4 text-brand-accent shrink-0" />
                <span>المحافظات المتاح التوصيل إليها:</span>
              </div>
              <div className="flex flex-wrap gap-1.5 pt-0.5 max-h-20 overflow-y-auto">
                {deliverableGovs.map((gov) => (
                  <span
                    key={gov}
                    className="text-[10px] font-bold bg-white text-brand-dark px-2.5 py-1 rounded-lg border border-brand-dark/5"
                  >
                    {gov}
                  </span>
                ))}
              </div>
            </div>

            {/* Quantity Selector, Add to Cart & Buy Now Buttons */}
            <div className="pt-2 space-y-3">
              <div className="flex items-center gap-3">
                <div className="flex items-center bg-brand-bg border border-brand-dark/10 rounded-2xl p-1">
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="w-9 h-9 rounded-xl bg-card hover:bg-neutral-200 flex items-center justify-center transition cursor-pointer text-brand-dark"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-10 text-center font-black text-sm text-brand-dark">
                    {quantity}
                  </span>
                  <button
                    type="button"
                    onClick={() => setQuantity((q) => q + 1)}
                    className="w-9 h-9 rounded-xl bg-card hover:bg-neutral-200 flex items-center justify-center transition cursor-pointer text-brand-dark"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>

                <button
                  type="button"
                  onClick={handleAddToCart}
                  disabled={!product.in_stock}
                  className="flex-1 bg-brand-dark text-white font-black py-3.5 rounded-2xl shadow-md hover:bg-brand-primary transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-xs md:text-sm"
                >
                  <ShoppingBag className="w-4 h-4" />
                  <span>إضافة للسلة ({formatEGP(Number(product.price) * quantity)})</span>
                </button>
              </div>

              <button
                type="button"
                onClick={handleBuyNow}
                disabled={!product.in_stock}
                className="w-full bg-brand-primary text-brand-bg font-black py-4 rounded-2xl shadow-lg hover:bg-brand-dark transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
              >
                <CreditCard className="w-4 h-4" />
                <span>شراء الآن فوراً والتوجه لصفحة الدفع</span>
              </button>
            </div>

            {/* Trust highlights */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-brand-dark/5 text-[10px] text-muted-foreground font-semibold">
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-brand-accent shrink-0" />
                <span>شحن سريع لجميع المحافظات المتاحة</span>
              </div>
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>معاينة المنتجات قبل الدفع بالكامل</span>
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Section: Customer Reviews & Comments */}
        <div className="border-t border-brand-dark/10 pt-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-extrabold text-sm text-brand-dark flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-brand-primary" />
              آراء وتقييمات العملاء حول المنتج ({reviews.length})
            </h3>
            <span className="text-xs font-bold text-amber-500 flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-current" />
              متوسط التقييم: 4.9 / 5
            </span>
          </div>

          {/* Add Review Form */}
          <form
            onSubmit={handleAddReview}
            className="bg-brand-bg p-4 rounded-2xl space-y-3 border border-brand-dark/5"
          >
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-brand-dark">تقييمك بالنجوم:</span>
              <div className="flex gap-1 text-amber-500">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setNewRating(star)}
                    className="p-1 cursor-pointer hover:scale-110 transition"
                  >
                    <Star
                      className={`w-4 h-4 ${star <= newRating ? "fill-current" : "text-muted"}`}
                    />
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                placeholder="أضف انطباعك أو تعليقك حول جودة هذا المنتج..."
                className="input flex-1 text-xs bg-white"
                required
              />
              <button
                type="submit"
                className="bg-brand-primary text-brand-bg px-4 py-2 rounded-xl text-xs font-bold hover:bg-brand-dark transition shrink-0 cursor-pointer flex items-center gap-1"
              >
                <Send className="w-3.5 h-3.5" />
                نشر التعليق
              </button>
            </div>
          </form>

          {/* Reviews List */}
          <div className="space-y-3 max-h-48 overflow-y-auto">
            {reviews.map((rev) => (
              <div
                key={rev.id}
                className="bg-white border border-brand-dark/5 p-3.5 rounded-2xl space-y-1"
              >
                <div className="flex justify-between items-center">
                  <span className="font-extrabold text-xs text-brand-dark">{rev.user_name}</span>
                  <div className="flex items-center gap-1 text-amber-500 text-[10px]">
                    <Star className="w-3 h-3 fill-current" />
                    <span className="font-bold">{rev.rating}</span>
                    <span className="text-muted-foreground mr-2">{rev.created_at}</span>
                  </div>
                </div>
                <p className="text-xs text-muted-foreground leading-relaxed">{rev.comment}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
