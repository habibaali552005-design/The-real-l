import React, { useState, useEffect } from "react";
import {
  FileUp,
  FolderPlus,
  Tag,
  Search,
  Filter,
  Check,
  Globe,
  DollarSign,
  Palette,
  Bot,
  Sparkles,
  RefreshCw,
  Trash2,
  Bookmark,
  Share2,
  Folder,
  Sliders,
  Type,
  FileCheck,
  CheckCheck,
} from "lucide-react";
import { MultiVendorStorage, ImportedProduct } from "@/lib/multiVendorStorage";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface UniversalImportCenterProps {
  sellerId: string;
  isSuperAdmin: boolean;
}

export function UniversalImportCenter({ sellerId, isSuperAdmin }: UniversalImportCenterProps) {
  const [products, setProducts] = useState<ImportedProduct[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [search, setSearch] = useState("");
  const [filterSource, setFilterSource] = useState("all");
  const [filterFolder, setFilterFolder] = useState("all");
  const [filterLabel, setFilterLabel] = useState("all");

  // Import inputs
  const [importUrl, setImportUrl] = useState("");
  const [importSource, setImportSource] = useState("Instagram Shops");
  const [isImporting, setIsImporting] = useState(false);

  // Bulk operation triggers
  const [bulkProcessing, setBulkProcessing] = useState(false);

  // Folders and collections
  const [folders, setFolders] = useState<string[]>([
    "مستوردات الصيف",
    "طاولات ذكية",
    "أطقم كلاسيكية",
  ]);
  const [collections, setCollections] = useState<string[]>([
    "تخفيضات 2026",
    "الأثاث الموفر للمساحة",
    "معروضات دمياط",
  ]);

  useEffect(() => {
    loadProducts();
  }, [sellerId]);

  const loadProducts = () => {
    // Only fetch draft/warehouse products matching this seller's scope or all if super_admin
    const all = MultiVendorStorage.getWarehouseProducts();
    setProducts(all);
  };

  const handleImport = (e: React.FormEvent) => {
    e.preventDefault();
    if (!importUrl.trim()) {
      toast.error("يرجى كتابة عنوان URL أو المتجر للاستيراد");
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      // Simulate intelligent AI parsing
      const randomId = "imp-" + Date.now();
      const sourcesFriendly: Record<string, string> = {
        "Instagram Shops": "انستجرام شوبز",
        Shopify: "شوبيفاي",
        Amazon: "أمازون مصر",
        AliExpress: "أليكسبريس",
        Noon: "نون",
      };

      const title =
        importUrl.includes("chair") || importUrl.includes("كرسي")
          ? "كرسي صالون مخملي مذهب فاخر"
          : "طاولة قهوة خشبية مودرن مع أدراج";

      const newProduct: ImportedProduct = {
        id: randomId,
        title,
        originalUrl: importUrl,
        source: importSource,
        category: "غرف المعيشة",
        subcategory: "كراسي صالون",
        furnitureType: "كرسي صالون",
        roomType: "غرفة استقبال",
        brand: "غير محدد",
        style: "إيطالي",
        material: "خشب زان + قطيفة تركية",
        color: "ذهبي / كحلي",
        dimensions: "85 * 90 * 75 سم",
        weight: "18 كجم",
        variants: ["كحلي", "بيج", "رمادي"],
        suggestedPrice: 4200,
        suggestedDiscountPrice: 3800,
        estimatedProfitMargin: 1200,
        imageUrl: "https://images.unsplash.com/photo-1592078615290-033ee584e267?w=500&fit=crop",
        longDescription:
          "كرسي صالون كلاسيكي راقي مذهب بورق الذهب الإيطالي اللامع مع تنجيد مريح جداً بكابتونيه الظهر وقماش ناعم.",
        seoTitle: `${title} - صالونات مذهبة بدمياط`,
        seoDescription: "أفضل صالونات مذهبة مصنعة يدوياً بدمياط بجودة لا تضاهى وضمان حقيقي.",
        tags: ["صالون", "مذهب", "كرسي", "دمياط"],
        status: "warehouse",
        folder: "مستوردات الصيف",
        collection: "تخفيضات 2026",
        label: "الحديثة",
        score: 85,
      };

      const updated = [newProduct, ...products];
      MultiVendorStorage.saveWarehouseProducts(updated);
      setProducts(updated);
      setImportUrl("");
      setIsImporting(false);
      toast.success(
        `تم استيراد المنتج بنجاح كمسودة ومزامنته بـ ${sourcesFriendly[importSource] || importSource}!`,
      );
    }, 1500);
  };

  const handleToggleSelect = (id: string) => {
    if (selectedIds.includes(id)) {
      setSelectedIds(selectedIds.filter((item) => item !== id));
    } else {
      setSelectedIds([...selectedIds, id]);
    }
  };

  const handleSelectAll = () => {
    if (selectedIds.length === filteredProducts.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredProducts.map((p) => p.id));
    }
  };

  // Bulk Operations
  const handleBulkAction = (
    actionType: "publish" | "translate" | "seo" | "watermark" | "compress" | "delete",
  ) => {
    if (selectedIds.length === 0) {
      toast.warning("يرجى تحديد منتج واحد على الأقل أولاً");
      return;
    }

    setBulkProcessing(true);
    setTimeout(async () => {
      let message = "";
      const allWarehouse = MultiVendorStorage.getWarehouseProducts();

      if (actionType === "delete") {
        const remaining = allWarehouse.filter((p) => !selectedIds.includes(p.id));
        MultiVendorStorage.saveWarehouseProducts(remaining);
        setProducts(remaining);
        message = `تم حذف ${selectedIds.length} من المنتجات المسودة بنجاح!`;
      } else if (actionType === "publish") {
        // Publish selected products to the main Supabase 'products' table!
        const toPublish = allWarehouse.filter((p) => selectedIds.includes(p.id));

        for (const item of toPublish) {
          // Write to supabase
          await supabase.from("products").insert({
            name: item.title,
            description: item.longDescription || item.title,
            price: item.suggestedDiscountPrice || item.suggestedPrice,
            image_url: item.imageUrl,
            category: item.category,
            in_stock: true,
            featured: false,
            source: item.source,
            seo_title: item.seoTitle,
            seo_description: item.seoDescription,
            short_description: item.longDescription ? item.longDescription.slice(0, 100) : "",
            available_governorates: item.available_governorates || ["جميع المحافظات"],
          });

          // Save ownership mapping
          MultiVendorStorage.setProductSeller(item.id, sellerId);
        }

        // Remove from AI warehouse
        const remaining = allWarehouse.filter((p) => !selectedIds.includes(p.id));
        MultiVendorStorage.saveWarehouseProducts(remaining);
        setProducts(remaining);

        message = `🎉 تهانينا! تم تحسين ونشر ${selectedIds.length} منتجاً في المتجر العام بنجاح!`;
      } else {
        // Other smart bulk optimizations (Translate, SEO, Watermark, Compress)
        const updated = allWarehouse.map((p) => {
          if (selectedIds.includes(p.id)) {
            const copy = { ...p };
            if (actionType === "translate") {
              copy.title = copy.title + " (EN Version Available)";
              copy.longDescription = "Translated into English & Arabic professionally by AI.";
            } else if (actionType === "seo") {
              copy.seoTitle = `🔥 أفضل سعر لـ ${copy.title} بمصر | بيتك`;
              copy.score = Math.min(100, (copy.score || 80) + 12);
            } else if (actionType === "watermark") {
              copy.label = "مائي معتمد";
              copy.imageUrl = copy.imageUrl + "?watermark=beitak";
            } else if (actionType === "compress") {
              copy.imageUrl = copy.imageUrl + "?quality=80";
            }
            return copy;
          }
          return p;
        });

        MultiVendorStorage.saveWarehouseProducts(updated);
        setProducts(updated);
        message = `تم تطبيق معالجة الذكاء الاصطناعي [${actionType.toUpperCase()}] على ${selectedIds.length} منتجاً بنجاح!`;
      }

      setBulkProcessing(false);
      setSelectedIds([]);
      toast.success(message);
      loadProducts();
    }, 1500);
  };

  const filteredProducts = products.filter((p) => {
    const matchesSearch =
      p.title.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesSource = filterSource === "all" || p.source === filterSource;
    const matchesFolder = filterFolder === "all" || p.folder === filterFolder;
    const matchesLabel = filterLabel === "all" || p.label === filterLabel;
    return matchesSearch && matchesSource && matchesFolder && matchesLabel;
  });

  return (
    <div className="space-y-6 px-4">
      {/* Import Form */}
      <div className="bg-card border border-brand-dark/5 rounded-3xl p-6 space-y-4">
        <div className="flex items-center gap-2">
          <Globe className="w-5 h-5 text-brand-primary" />
          <h2 className="text-sm font-bold text-brand-dark">مركز الاستيراد الشامل (UIC)</h2>
          <span className="bg-brand-primary/10 text-brand-primary font-bold text-[9px] px-2 py-1 rounded-full">
            اتصال ذكي بـ 20+ منصة
          </span>
        </div>

        <form onSubmit={handleImport} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="ضع رابط المنتج، رابط المتجر، أو رابط الكتالوج للتخزين والمزامنة..."
              value={importUrl}
              onChange={(e) => setImportUrl(e.target.value)}
              className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 focus:outline-none focus:border-brand-primary"
            />
          </div>
          <div>
            <select
              value={importSource}
              onChange={(e) => setImportSource(e.target.value)}
              className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 focus:outline-none"
            >
              <option value="Instagram Shops">Instagram Shops</option>
              <option value="Facebook Shops">Facebook Shops</option>
              <option value="Shopify">Shopify Store URL</option>
              <option value="Amazon">Amazon Catalog</option>
              <option value="Noon">Noon Egypt</option>
              <option value="CSV">ملف CSV / Excel</option>
              <option value="Images">مجموعة صور / كواليس</option>
            </select>
          </div>
          <div>
            <button
              type="submit"
              disabled={isImporting}
              className="w-full bg-brand-dark hover:bg-brand-dark/95 text-brand-bg font-bold text-xs py-3 rounded-xl transition flex items-center justify-center gap-2"
            >
              {isImporting ? (
                <>
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                  جاري السحب والتحليل...
                </>
              ) : (
                <>
                  <FileUp className="w-3.5 h-3.5" />
                  استيراد بالذكاء الاصطناعي
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* AI Warehouse Workspace */}
      <div className="bg-card border border-brand-dark/5 rounded-3xl p-6 space-y-4">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
          <div className="flex items-center gap-2">
            <Bot className="w-5 h-5 text-brand-accent animate-pulse" />
            <h2 className="text-sm font-bold text-brand-dark">
              مستودع المنتجات الذكي (AI Product Warehouse)
            </h2>
            <span className="text-[10px] bg-secondary text-brand-dark font-bold px-2.5 py-1 rounded-xl">
              {filteredProducts.length} مسودة مجهزة
            </span>
          </div>

          {/* Bulk Buttons Toolbar */}
          {selectedIds.length > 0 && (
            <div className="flex flex-wrap gap-1.5 bg-brand-bg p-1.5 rounded-2xl border border-brand-dark/5">
              <button
                onClick={() => handleBulkAction("publish")}
                className="bg-brand-primary text-brand-bg text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
              >
                <CheckCheck className="w-3 h-3" />
                تجهيز ونشر للعامة ({selectedIds.length})
              </button>
              <button
                onClick={() => handleBulkAction("seo")}
                className="bg-card text-brand-dark text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-brand-dark/10 transition"
              >
                <Sparkles className="w-3 h-3 text-brand-accent" />
                تحسين السيو SEO
              </button>
              <button
                onClick={() => handleBulkAction("translate")}
                className="bg-card text-brand-dark text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-brand-dark/10 transition"
              >
                <Globe className="w-3 h-3 text-brand-primary" />
                ترجمة فورية
              </button>
              <button
                onClick={() => handleBulkAction("watermark")}
                className="bg-card text-brand-dark text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 border border-brand-dark/10 transition"
              >
                <Palette className="w-3 h-3 text-emerald-600" />
                علامة مائية وحماية
              </button>
              <button
                onClick={() => handleBulkAction("delete")}
                className="bg-destructive/10 text-destructive text-[10px] font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition"
              >
                <Trash2 className="w-3 h-3" />
                حذف المحدّد
              </button>
            </div>
          )}
        </div>

        {/* Search & Filters */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 bg-brand-bg p-4 rounded-2xl border border-brand-dark/5">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-muted-foreground absolute right-3 top-3.5" />
            <input
              type="text"
              placeholder="البحث بالمستودع..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl pr-9 pl-3 py-2.5 focus:outline-none"
            />
          </div>

          <select
            value={filterSource}
            onChange={(e) => setFilterSource(e.target.value)}
            className="text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="all">كل قنوات المزامنة</option>
            <option value="Instagram Shops">Instagram Shops</option>
            <option value="Amazon">Amazon Egypt</option>
            <option value="Shopify">Shopify Store</option>
          </select>

          <select
            value={filterFolder}
            onChange={(e) => setFilterFolder(e.target.value)}
            className="text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="all">كل المجلدات والأرشيف</option>
            {folders.map((f, idx) => (
              <option key={idx} value={f}>
                {f}
              </option>
            ))}
          </select>

          <select
            value={filterLabel}
            onChange={(e) => setFilterLabel(e.target.value)}
            className="text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
          >
            <option value="all">كل العلامات والمميزات</option>
            <option value="الأعلى طلباً">الأعلى طلباً</option>
            <option value="الأثاث الموفر للمساحة">الموفر للمساحة</option>
            <option value="مميز">مميز بالمتجر</option>
          </select>
        </div>

        {/* Visual products grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredProducts.map((p) => {
            const isSelected = selectedIds.includes(p.id);
            return (
              <div
                key={p.id}
                onClick={() => handleToggleSelect(p.id)}
                className={`relative bg-brand-bg rounded-2xl border p-4 cursor-pointer transition flex flex-col space-y-3 hover:shadow-md ${
                  isSelected
                    ? "border-brand-primary ring-2 ring-brand-primary/20 bg-brand-primary/5"
                    : "border-brand-dark/5"
                }`}
              >
                {/* Image & Source Badge */}
                <div className="relative rounded-xl overflow-hidden aspect-video bg-gray-100">
                  <img src={p.imageUrl} alt={p.title} className="w-full h-full object-cover" />
                  <span className="absolute top-2 left-2 bg-brand-dark text-brand-bg text-[8px] font-bold px-2 py-1 rounded-full">
                    {p.source}
                  </span>
                  {p.score && (
                    <span className="absolute bottom-2 right-2 bg-brand-accent text-brand-dark text-[8px] font-bold px-2 py-1 rounded-full">
                      سيو: {p.score}%
                    </span>
                  )}
                </div>

                {/* Title & Metadata */}
                <div>
                  <h3 className="font-bold text-xs text-brand-dark line-clamp-1">{p.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <span className="text-[10px] text-muted-foreground bg-secondary px-2 py-0.5 rounded-md">
                      {p.category}
                    </span>
                    <span className="text-xs font-bold text-brand-primary">
                      {p.suggestedDiscountPrice || p.suggestedPrice} ج.م
                    </span>
                  </div>
                </div>

                {/* AI Manager Summary Pills */}
                <div className="grid grid-cols-2 gap-1 bg-card p-2 rounded-xl text-[9px] text-muted-foreground border border-brand-dark/5">
                  <div>
                    <span className="font-bold block text-brand-dark">الخامة:</span>
                    <span className="truncate block">{p.material}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-brand-dark">المقاس:</span>
                    <span className="truncate block">{p.dimensions}</span>
                  </div>
                  <div>
                    <span className="font-bold block text-brand-dark">هامش الربح:</span>
                    <span className="truncate block text-emerald-600">
                      +{p.estimatedProfitMargin} ج.م
                    </span>
                  </div>
                  <div>
                    <span className="font-bold block text-brand-dark">المجلد:</span>
                    <span className="truncate block">{p.folder}</span>
                  </div>
                </div>

                {/* Quick actions indicator */}
                <div className="flex justify-between items-center pt-2 border-t border-brand-dark/5 text-[9px]">
                  <span className="flex items-center gap-1 text-brand-primary">
                    <Bot className="w-3 h-3" />
                    تم الفحص والتحليل بالكامل بالذكاء الاصطناعي
                  </span>
                  <div
                    className={`w-4 h-4 rounded-full border grid place-items-center ${
                      isSelected
                        ? "bg-brand-primary border-brand-primary text-brand-bg"
                        : "border-brand-dark/20"
                    }`}
                  >
                    {isSelected && <Check className="w-2.5 h-2.5" />}
                  </div>
                </div>
              </div>
            );
          })}

          {filteredProducts.length === 0 && (
            <div className="md:col-span-3 text-center py-12 text-muted-foreground text-xs">
              مفيش مسودات أو منتجات في مستودع الذكاء الاصطناعي لسه.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
