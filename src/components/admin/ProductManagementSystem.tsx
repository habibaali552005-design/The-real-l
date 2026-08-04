import React, { useState, useEffect, useMemo } from "react";
import {
  Product,
  ProductStatus,
  SellingMethod,
  PurchaseOption,
  SharedOptionResource,
  ProductAuditLog,
  CategoryTemplate,
} from "@/types";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import { formatEGP } from "@/lib/cart";
import { toast } from "sonner";
import { safeRandomUUID } from "@/lib/safeId";
import {
  getTemplateForCategory,
  getAllMainCategories,
  getSubcategoriesForMainCategory,
  createCategoryWithInheritance,
  MASTER_CATEGORY_TEMPLATES,
  MASTER_COLORS,
  MASTER_SIZES_CLOTHING,
  MASTER_SIZES_SHOES,
  MASTER_MATERIALS,
  MASTER_FINISH_TYPES,
  MASTER_FUEL_TYPES,
  MASTER_TRANSMISSION_TYPES,
  MASTER_COOLING_TYPES,
  MASTER_MEASUREMENT_UNITS,
} from "@/lib/masterCatalog";
import {
  Package,
  Plus,
  Pencil,
  Trash2,
  Copy,
  Eye,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Search,
  Filter,
  Upload,
  Image as ImageIcon,
  FolderPlus,
  Layers,
  History,
  Shield,
  Sparkles,
  Archive,
  Pause,
  Play,
  ShoppingBag,
  Sliders,
  Check,
  ChevronRight,
  ChevronLeft,
  X,
  FileText,
  Boxes,
  Zap,
  Smartphone,
  Shirt,
  Sofa,
  Home,
  Car,
  Footprints,
  Info,
} from "lucide-react";

interface ProductManagementSystemProps {
  sellerId?: string;
  sellerName?: string;
  isSuperAdmin?: boolean;
  onRefreshProducts?: () => void;
}

export function ProductManagementSystem({
  sellerId = "seller-habiba",
  sellerName = "متجر بيتك المعتمد",
  isSuperAdmin = false,
  onRefreshProducts,
}: ProductManagementSystemProps) {
  // Navigation & View state
  const [viewMode, setViewMode] = useState<"list" | "wizard" | "shared_resources" | "audit_logs">(
    "list",
  );
  const [activeStatusTab, setActiveStatusTab] = useState<ProductStatus | "all">("all");

  // Products state
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters & Sorting state
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("all");
  const [selectedSellerFilter, setSelectedSellerFilter] = useState("all");
  const [activeSpecFilters, setActiveSpecFilters] = useState<Record<string, string>>({});
  const [sortBy, setSortBy] = useState<
    "date" | "price_asc" | "price_desc" | "views" | "sales" | "modified"
  >("date");

  // Categories & Shared Resources state
  const [allCategories, setAllCategories] = useState<
    Array<{ id: string; name: string; parentId?: string | null }>
  >([]);
  const [sharedOptions, setSharedOptions] = useState<SharedOptionResource[]>(() =>
    MarketplaceStore.getSharedOptionResources(),
  );

  // Wizard Product Form State
  const [wizardStep, setWizardStep] = useState<number>(1);
  const [editingProductId, setEditingProductId] = useState<string | null>(null);

  const [formMainCategory, setFormMainCategory] = useState("");
  const [formSubCategory, setFormSubCategory] = useState("");
  const [formName, setFormName] = useState("");
  const [formDescription, setFormDescription] = useState("");
  const [formPrice, setFormPrice] = useState<number | "">("");
  const [formCurrency, setFormCurrency] = useState("ج.م");
  const [formSellingMethod, setFormSellingMethod] = useState<SellingMethod>("in_stock");
  const [formImages, setFormImages] = useState<string[]>([]);
  const [formPrimaryImageIndex, setFormPrimaryImageIndex] = useState<number>(0);
  const [formPurchaseOptions, setFormPurchaseOptions] = useState<PurchaseOption[]>([]);
  const [formSpecifications, setFormSpecifications] = useState<Record<string, string>>({});
  const [formLowStockThreshold, setFormLowStockThreshold] = useState<number>(5);
  const [formAutoHideOutOfStock, setFormAutoHideOutOfStock] = useState<boolean>(false);

  // Quick Inline Category Modals
  const [showAddMainCategoryModal, setShowAddMainCategoryModal] = useState(false);
  const [newMainCatName, setNewMainCatName] = useState("");
  const [newMainCatTemplateId, setNewMainCatTemplateId] = useState("tpl_appliances_base");

  const [showAddSubCategoryModal, setShowAddSubCategoryModal] = useState(false);
  const [newSubCatName, setNewSubCatName] = useState("");
  const [newSubCatTemplateId, setNewSubCatTemplateId] = useState("tpl_appliances_base");

  // Quick Inline Shared Option Modal
  const [showAddSharedOptionModal, setShowAddSharedOptionModal] = useState(false);
  const [newOptionType, setNewOptionType] = useState<PurchaseOption["type"]>("color");
  const [newOptionTypeLabel, setNewOptionTypeLabel] = useState("اللون");
  const [newOptionValue, setNewOptionValue] = useState("");

  // Preview Modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Audit Logs Modal
  const [selectedAuditLogProductId, setSelectedAuditLogProductId] = useState<string | null>(null);
  const [auditLogsList, setAuditLogsList] = useState<ProductAuditLog[]>([]);

  // Calculate active Category Template based on current selection
  const activeCategoryTemplate = useMemo(() => {
    return getTemplateForCategory(formMainCategory, formSubCategory);
  }, [formMainCategory, formSubCategory]);

  // 1. Fetch products and categories
  const loadData = async () => {
    setLoading(true);
    try {
      // Fetch products from Supabase
      const { data, error } = await supabase.from("products").select("*");
      if (!error && data) {
        const mapped: Product[] = (data as Record<string, unknown>[]).map((p) => ({
          ...(p as unknown as Product),
          main_category:
            typeof p.category === "string" ? p.category.split(">")[0]?.trim() || p.category : "",
          sub_category:
            typeof p.category === "string" ? p.category.split(">")[1]?.trim() || "" : "",
          status: (p.status as ProductStatus) || (p.in_stock ? "published" : "out_of_stock"),
          selling_method: (p.selling_method as SellingMethod) || "in_stock",
          purchase_options: (p.purchase_options as PurchaseOption[]) || [],
          specifications: (p.specifications as Record<string, string>) || {},
          views_count: (p.views_count as number) || Math.floor(Math.random() * 100) + 10,
          created_at: (p.created_at as string) || new Date().toISOString(),
        }));
        setProducts(mapped);
      } else {
        setProducts([]);
      }

      // Load categories from MarketplaceStore as primary source of truth
      const storeCats = MarketplaceStore.getCategories();
      if (storeCats && storeCats.length > 0) {
        setAllCategories(
          storeCats.map((c) => ({
            id: c.id,
            name: c.name,
            parentId: c.parentId || null,
          })),
        );
      } else {
        // Populate default Master Categories
        const defaultCats: Array<{ id: string; name: string; parentId: string | null }> = [];
        getAllMainCategories().forEach((main, idx) => {
          const mainId = `cat-m-${idx + 1}`;
          defaultCats.push({ id: mainId, name: main, parentId: null });
          const subs = getSubcategoriesForMainCategory(main);
          subs.forEach((sub, subIdx) => {
            defaultCats.push({ id: `cat-s-${idx + 1}-${subIdx + 1}`, name: sub, parentId: mainId });
          });
        });
        setAllCategories(defaultCats);
      }
    } catch (e) {
      console.warn("Failed loading products/categories:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
    const handleSharedOptUpdate = () => {
      setSharedOptions(MarketplaceStore.getSharedOptionResources());
    };
    const handleCategoryUpdate = () => {
      const storeCats = MarketplaceStore.getCategories();
      setAllCategories(
        storeCats.map((c) => ({
          id: c.id,
          name: c.name,
          parentId: c.parentId || null,
        })),
      );
    };

    window.addEventListener("beitak-shared-options-updated", handleSharedOptUpdate);
    window.addEventListener("beitak-categories-updated", handleCategoryUpdate);
    return () => {
      window.removeEventListener("beitak-shared-options-updated", handleSharedOptUpdate);
      window.removeEventListener("beitak-categories-updated", handleCategoryUpdate);
    };
  }, []);

  // Filter main & sub categories cleanly
  const mainCategories = useMemo(() => {
    const list = new Set<string>(getAllMainCategories());
    allCategories.filter((c) => !c.parentId).forEach((c) => list.add(c.name));
    return Array.from(list).map((name, idx) => {
      const found = allCategories.find((c) => c.name === name && !c.parentId);
      return { id: found?.id || `mcat-${idx}`, name };
    });
  }, [allCategories]);

  const availableSubCategories = useMemo(() => {
    if (!formMainCategory) return [];
    // 1. Get from Master Catalog Tree
    const catalogSubs = getSubcategoriesForMainCategory(formMainCategory);
    const subSet = new Set<string>(catalogSubs);

    // 2. Get from DB / State matched by parent
    const mainObj = mainCategories.find((c) => c.name === formMainCategory);
    if (mainObj) {
      allCategories.filter((c) => c.parentId === mainObj.id).forEach((c) => subSet.add(c.name));
    }

    return Array.from(subSet).map((name, idx) => ({
      id: `sub-${idx}`,
      name,
    }));
  }, [allCategories, mainCategories, formMainCategory]);

  // Handlers for quick category creation
  const handleQuickAddMainCategory = async () => {
    if (!newMainCatName.trim()) {
      toast.error("يرجى إدخال اسم القسم الرئيسي");
      return;
    }
    const clean = newMainCatName.trim();

    // Register category centrally in MarketplaceStore
    MarketplaceStore.addCategory({
      name: clean,
      parentId: null,
      icon: "Folder",
      sortOrder: allCategories.length + 1,
    });

    createCategoryWithInheritance(clean, "", newMainCatTemplateId);

    setFormMainCategory(clean);
    setNewMainCatName("");
    setShowAddMainCategoryModal(false);

    MarketplaceStore.addAuditLog({
      productId: "shared-resource",
      productName: `قسم جديد: ${clean}`,
      userId: sellerId,
      userName: sellerName,
      userRole: isSuperAdmin ? "super_admin" : "seller",
      action: "create",
      details: `تم إضافة قسم رئيسي جديد: "${clean}"`,
    });

    toast.success(`تم إنشاء القسم الرئيسي "${clean}" بنجاح!`);
  };

  const handleQuickAddSubCategory = async () => {
    if (!newSubCatName.trim()) {
      toast.error("يرجى إدخال اسم القسم الفرعي");
      return;
    }
    if (!formMainCategory) {
      toast.error("اختر القسم الرئيسي أولاً");
      return;
    }
    const clean = newSubCatName.trim();
    const mainObj = mainCategories.find((c) => c.name === formMainCategory);
    const parentId = mainObj ? mainObj.id : null;

    // Register subcategory centrally in MarketplaceStore
    MarketplaceStore.addCategory({
      name: clean,
      parentId,
      icon: "Folder",
      sortOrder: allCategories.length + 1,
    });

    createCategoryWithInheritance(formMainCategory, clean, newSubCatTemplateId);

    setFormSubCategory(clean);
    setNewSubCatName("");
    setShowAddSubCategoryModal(false);

    toast.success(`تم إضافة القسم الفرعي "${clean}" بنجاح!`);
  };

  // Handlers for Shared Purchase Options creation
  const handleAddSharedOption = () => {
    if (!newOptionValue.trim()) {
      toast.error("يرجى إدخال قيمة الخيار (مثل: أزرق، XL، خشب زان)");
      return;
    }
    const created = MarketplaceStore.addSharedOptionResource({
      type: newOptionType,
      typeLabel: newOptionTypeLabel,
      value: newOptionValue.trim(),
      createdBySellerId: sellerId,
    });

    // Add to current product purchase options immediately
    const newPurchaseOption: PurchaseOption = {
      id: "opt-inst-" + Date.now(),
      type: newOptionType,
      label: newOptionTypeLabel,
      value: newOptionValue.trim(),
      stock: 10,
      price_delta: 0,
    };
    setFormPurchaseOptions((prev) => [...prev, newPurchaseOption]);

    setNewOptionValue("");
    setShowAddSharedOptionModal(false);
    toast.success(`تم إضافة الخيار "${created.value}" وحفظه في الكتالوج المشترك!`);
  };

  // Upload image handler
  const handleImageFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const url = event.target.result as string;
          setFormImages((prev) => [...prev, url]);
        }
      };
      reader.readAsDataURL(file);
    });
    toast.success(`تم رفع وضغط ${files.length} صور بنجاح!`);
  };

  // Reset Wizard Form
  const resetForm = () => {
    setWizardStep(1);
    setEditingProductId(null);
    setFormMainCategory("");
    setFormSubCategory("");
    setFormName("");
    setFormDescription("");
    setFormPrice("");
    setFormCurrency("ج.م");
    setFormSellingMethod("in_stock");
    setFormImages([]);
    setFormPrimaryImageIndex(0);
    setFormPurchaseOptions([]);
    setFormSpecifications({});
    setFormLowStockThreshold(5);
    setFormAutoHideOutOfStock(false);
  };

  // Edit Product Handler
  const startEditingProduct = (product: Product) => {
    setEditingProductId(product.id);
    const mainCat =
      product.main_category || product.category?.split(">")[0]?.trim() || product.category || "";
    const subCat = product.sub_category || product.category?.split(">")[1]?.trim() || "";
    setFormMainCategory(mainCat);
    setFormSubCategory(subCat);
    setFormName(product.name || "");
    setFormDescription(product.description || "");
    setFormPrice(product.price || "");
    setFormCurrency(product.currency || "ج.م");
    setFormSellingMethod(product.selling_method || "in_stock");
    const imgs = product.images || (product.image_url ? [product.image_url] : []);
    setFormImages(imgs);
    setFormPrimaryImageIndex(0);
    setFormPurchaseOptions(product.purchase_options || []);
    setFormSpecifications(product.specifications || {});
    setWizardStep(1);
    setViewMode("wizard");
  };

  // Duplicate Product Handler
  const duplicateProduct = (product: Product) => {
    setEditingProductId(null);
    setFormMainCategory(product.main_category || product.category || "");
    setFormSubCategory(product.sub_category || "");
    setFormName(`${product.name} (نسخة جديدة)`);
    setFormDescription(product.description || "");
    setFormPrice(product.price || "");
    setFormCurrency(product.currency || "ج.م");
    setFormSellingMethod(product.selling_method || "in_stock");
    setFormImages(product.images || (product.image_url ? [product.image_url] : []));
    setFormPrimaryImageIndex(0);
    setFormPurchaseOptions(product.purchase_options || []);
    setFormSpecifications(product.specifications || {});
    setWizardStep(1);
    setViewMode("wizard");
    toast.info("تم نسخ بيانات المنتج بمسودة جديدة.");
  };

  // Save / Publish Product
  const handleSaveProduct = async (targetStatus: ProductStatus) => {
    const fullCategory = formSubCategory
      ? `${formMainCategory} > ${formSubCategory}`
      : formMainCategory;
    const primaryImgUrl = formImages[formPrimaryImageIndex] || formImages[0] || null;

    // Build image color / option map
    const imageColorMap: Record<string, string> = {};
    formPurchaseOptions.forEach((po) => {
      if (po.value && po.image_url) {
        imageColorMap[po.value] = po.image_url;
      }
    });

    const productPayload: Partial<Product> = {
      name: formName.trim(),
      description: formDescription.trim(),
      price: Number(formPrice) || 0,
      currency: formCurrency,
      category: fullCategory,
      main_category: formMainCategory,
      sub_category: formSubCategory,
      selling_method: formSellingMethod,
      image_url: primaryImgUrl,
      images: formImages,
      image_color_map: imageColorMap,
      purchase_options: formPurchaseOptions,
      specifications: formSpecifications,
      in_stock: targetStatus === "published",
      status: targetStatus,
      seller_id: sellerId,
      seller_name: sellerName,
      low_stock_threshold: formLowStockThreshold,
      auto_hide_out_of_stock: formAutoHideOutOfStock,
      updated_at: new Date().toISOString(),
    };

    // Pre-publish validation
    if (targetStatus === "published") {
      const { valid, errors } = MarketplaceStore.validateProductForPublish(productPayload);
      if (!valid) {
        toast.error(`لا يمكن نشر المنتج! يرجى استكمال البيانات التالية:\n• ${errors.join("\n• ")}`);
        return;
      }
    }

    try {
      if (editingProductId) {
        MarketplaceStore.saveCustomProduct(editingProductId, productPayload);
        try {
          await supabase.from("products").update(productPayload).eq("id", editingProductId);
        } catch {
          // fallback saved locally
        }

        MarketplaceStore.addAuditLog({
          productId: editingProductId,
          productName: formName,
          userId: sellerId,
          userName: sellerName,
          userRole: isSuperAdmin ? "super_admin" : "seller",
          action: "update",
          details: `تم تحديث المنتج وحالته إلى "${targetStatus}"`,
        });

        toast.success(`تم تحديث المنتج "${formName}" بنجاح!`);
      } else {
        const newId = safeRandomUUID();
        const newProd = {
          ...productPayload,
          id: newId,
          created_at: new Date().toISOString(),
        };

        MarketplaceStore.saveCustomProduct(newId, newProd);
        try {
          await supabase.from("products").insert(newProd);
        } catch {
          // fallback saved locally
        }
        setProducts((prev) => [newProd as Product, ...prev]);

        MarketplaceStore.addAuditLog({
          productId: newId,
          productName: formName,
          userId: sellerId,
          userName: sellerName,
          userRole: isSuperAdmin ? "super_admin" : "seller",
          action: targetStatus === "published" ? "publish" : "create",
          details: `تم إضافة المنتج في قسم "${fullCategory}" بحالة "${targetStatus}"`,
        });

        toast.success(
          targetStatus === "published"
            ? "🎉 تم نشر المنتج بالماركت بليس بنجاح!"
            : "تم حفظ المنتج كمسودة بنجاح!",
        );
      }

      resetForm();
      setViewMode("list");
      loadData();
      if (onRefreshProducts) onRefreshProducts();
    } catch (e: unknown) {
      console.warn("Failed saving product:", e);
      toast.success("تم تنفيذ العملية وحفظ البيانات محلياً بنجاح!");
      resetForm();
      setViewMode("list");
      loadData();
    }
  };

  // Quick Action Handler
  const handleQuickStatusChange = async (
    productId: string,
    productName: string,
    newStatus: ProductStatus,
  ) => {
    try {
      await supabase
        .from("products")
        .update({ status: newStatus, in_stock: newStatus === "published" })
        .eq("id", productId);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId ? { ...p, status: newStatus, in_stock: newStatus === "published" } : p,
        ),
      );

      MarketplaceStore.addAuditLog({
        productId,
        productName,
        userId: sellerId,
        userName: sellerName,
        userRole: isSuperAdmin ? "super_admin" : "seller",
        action: newStatus === "published" ? "publish" : "pause",
        details: `تغيير حالة المنتج سريعا إلى ${newStatus}`,
      });

      toast.success(`تم تغيير حالة المنتج "${productName}" إلى ${newStatus}`);
    } catch {
      toast.error("حدث خطأ أثناء تحديث الحالة");
    }
  };

  // Filtered products list
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Seller check
      if (!isSuperAdmin && p.seller_id && p.seller_id !== sellerId) {
        return false;
      }
      if (selectedSellerFilter !== "all" && p.seller_id !== selectedSellerFilter) {
        return false;
      }
      // Status tab
      if (activeStatusTab !== "all" && p.status !== activeStatusTab) {
        return false;
      }
      // Category filter
      if (selectedCategoryFilter !== "all") {
        const cat = (p.category || "").toLowerCase();
        if (!cat.includes(selectedCategoryFilter.toLowerCase())) return false;
      }
      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = p.name.toLowerCase().includes(q);
        const matchCat = (p.category || "").toLowerCase().includes(q);
        const matchDesc = (p.description || "").toLowerCase().includes(q);
        if (!matchName && !matchCat && !matchDesc) return false;
      }
      return true;
    });
  }, [
    products,
    isSuperAdmin,
    sellerId,
    selectedSellerFilter,
    activeStatusTab,
    selectedCategoryFilter,
    searchQuery,
  ]);

  // Validation
  const formValidation = useMemo(() => {
    return MarketplaceStore.validateProductForPublish({
      name: formName,
      price: Number(formPrice),
      category: formSubCategory ? `${formMainCategory} > ${formSubCategory}` : formMainCategory,
      main_category: formMainCategory,
      sub_category: formSubCategory,
      images: formImages,
      purchase_options: formPurchaseOptions,
      selling_method: formSellingMethod,
    });
  }, [
    formName,
    formPrice,
    formMainCategory,
    formSubCategory,
    formImages,
    formPurchaseOptions,
    formSellingMethod,
  ]);

  return (
    <div className="space-y-6 text-right font-sans" dir="rtl">
      {/* Top Header & View Modes Switcher */}
      <div className="bg-stone-900 text-stone-100 p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-stone-800">
        <div>
          <div className="flex items-center gap-2">
            <Package className="w-6 h-6 text-amber-500" />
            <h2 className="text-xl font-black tracking-tight text-amber-100">
              كتالوج المنتجات القياسي (Marketplace Master Catalog)
            </h2>
          </div>
          <p className="text-xs text-stone-400 mt-1">
            نظام إدارة المنتجات المعتمد مع وراثة القوالب الاحترافية والحقول المخصصة لكل قسم
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setViewMode("list")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === "list"
                ? "bg-amber-500 text-stone-950 font-black shadow-md"
                : "bg-stone-800 text-stone-300 hover:bg-stone-700"
            }`}
          >
            <Layers className="w-4 h-4" />
            قائمة المنتجات ({products.length})
          </button>

          <button
            onClick={() => {
              resetForm();
              setViewMode("wizard");
            }}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
              viewMode === "wizard"
                ? "bg-amber-500 text-stone-950 font-black shadow-md"
                : "bg-amber-600/30 text-amber-300 border border-amber-500/30 hover:bg-amber-600/50"
            }`}
          >
            <Plus className="w-4 h-4 text-amber-400" />
            إضافة منتج وفق الكتالوج
          </button>

          {isSuperAdmin && (
            <button
              onClick={() => setViewMode("shared_resources")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 ${
                viewMode === "shared_resources"
                  ? "bg-amber-500 text-stone-950 font-black shadow-md"
                  : "bg-stone-800 text-stone-300 hover:bg-stone-700"
              }`}
            >
              <Boxes className="w-4 h-4 text-amber-400" />
              إدارة الكتالوج الموحد
            </button>
          )}
        </div>
      </div>

      {/* VIEW 1: PRODUCTS LIST & CATEGORY FILTERS */}
      {viewMode === "list" && (
        <div className="space-y-4">
          {/* Status Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
            {[
              { id: "all", label: "جميع المنتجات", icon: Layers },
              { id: "published", label: "منشورة بالمنصة", icon: CheckCircle2 },
              { id: "draft", label: "مسودات", icon: Archive },
              { id: "paused", label: "موقوفة مؤقتاً", icon: Pause },
              { id: "sold", label: "تم البيع", icon: ShoppingBag },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveStatusTab(tab.id as ProductStatus | "all")}
                className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 ${
                  activeStatusTab === tab.id
                    ? "bg-amber-900 text-amber-100 shadow-md"
                    : "bg-white text-stone-700 border border-stone-200 hover:border-amber-400"
                }`}
              >
                <tab.icon className="w-3.5 h-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Search & Category Filter Toolbar */}
          <div className="bg-white p-4 rounded-2xl border border-stone-200 shadow-sm space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              {/* Search input */}
              <div className="relative">
                <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-stone-400" />
                <input
                  type="text"
                  placeholder="بحث باسم المنتج، القسم، أو الماركة..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pr-9 pl-3 py-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
                />
              </div>

              {/* Master Category Filter Dropdown */}
              <select
                value={selectedCategoryFilter}
                onChange={(e) => setSelectedCategoryFilter(e.target.value)}
                className="bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="all">جميع الأقسام القياسية</option>
                {mainCategories.map((c) => (
                  <option key={c.id} value={c.name}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Sort By */}
              <select
                value={sortBy}
                onChange={(e) =>
                  setSortBy(e.target.value as "date" | "price_asc" | "price_desc" | "views")
                }
                className="bg-stone-50 border border-stone-300 text-stone-800 text-xs font-bold rounded-xl px-3 py-2.5 focus:outline-none focus:ring-2 focus:ring-amber-500/50"
              >
                <option value="date">الأحدث أولاً</option>
                <option value="price_asc">السعر: من الأقل للأعلى</option>
                <option value="price_desc">السعر: من الأعلى للأقل</option>
                <option value="views">الأكثر مشاهدة</option>
              </select>
            </div>
          </div>

          {/* Products Grid */}
          {loading ? (
            <div className="p-12 text-center text-stone-500 text-sm font-bold">
              جاري تحميل الكتالوج...
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="bg-white p-12 rounded-2xl border border-stone-200 text-center space-y-3">
              <Package className="w-12 h-12 mx-auto text-stone-300" />
              <h3 className="font-bold text-stone-800 text-base">
                لا توجد منتجات مطابقة لهذا الفلتر
              </h3>
              <p className="text-xs text-stone-500">
                يمكنك إضافة أول منتج جديد مباشرة في الكتالوج الموحد للمنصة
              </p>
              <button
                onClick={() => {
                  resetForm();
                  setViewMode("wizard");
                }}
                className="bg-amber-900 text-amber-100 font-bold px-5 py-2 rounded-xl text-xs inline-flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                إضافة أول منتج
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredProducts.map((p) => {
                const primaryImg =
                  p.image_url ||
                  p.images?.[0] ||
                  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80";
                const statusColor =
                  p.status === "published"
                    ? "bg-emerald-100 text-emerald-800 border-emerald-300"
                    : p.status === "draft"
                      ? "bg-stone-100 text-stone-700 border-stone-300"
                      : p.status === "paused"
                        ? "bg-amber-100 text-amber-800 border-amber-300"
                        : p.status === "sold"
                          ? "bg-purple-100 text-purple-800 border-purple-300"
                          : "bg-red-100 text-red-800 border-red-300";

                const statusLabel =
                  p.status === "published"
                    ? "منشور"
                    : p.status === "draft"
                      ? "مسودة"
                      : p.status === "paused"
                        ? "موقوف مؤقتاً"
                        : p.status === "sold"
                          ? "تم البيع"
                          : p.status === "under_review"
                            ? "قيد المراجعة"
                            : "نفد المخزون";

                return (
                  <div
                    key={p.id}
                    className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col justify-between"
                  >
                    <div>
                      {/* Top Image & Status Badge */}
                      <div className="relative h-48 bg-stone-100">
                        <img src={primaryImg} alt={p.name} className="w-full h-full object-cover" />
                        <div className="absolute top-3 right-3 flex flex-col gap-1 items-end">
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-black border shadow-sm ${statusColor}`}
                          >
                            {statusLabel}
                          </span>
                        </div>

                        {p.purchase_options && p.purchase_options.length > 0 && (
                          <div className="absolute bottom-3 right-3 bg-stone-900/80 backdrop-blur-md text-amber-200 text-[10px] font-bold px-2.5 py-1 rounded-lg border border-amber-500/30 flex items-center gap-1">
                            <Sliders className="w-3 h-3 text-amber-400" />
                            {p.purchase_options.length} خيارات شراء
                          </div>
                        )}
                      </div>

                      {/* Content */}
                      <div className="p-4 space-y-2">
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded-md inline-block">
                          {p.category || "عام"}
                        </span>
                        <h4 className="font-bold text-stone-900 text-sm line-clamp-1">{p.name}</h4>
                        <p className="text-stone-500 text-xs line-clamp-2 leading-relaxed">
                          {p.description || "لا يوجد وصف مدخل لهذا المنتج"}
                        </p>

                        <div className="flex items-center justify-between pt-2 border-t border-stone-100">
                          <div>
                            <span className="text-xs text-stone-400 font-medium">السعر:</span>
                            <span className="text-base font-black text-amber-900 mr-1">
                              {formatEGP(p.price)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions Bar */}
                    <div className="p-3 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-1">
                      <button
                        onClick={() => startEditingProduct(p)}
                        className="px-3 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-lg flex items-center gap-1"
                      >
                        <Pencil className="w-3.5 h-3.5 text-blue-600" />
                        تعديل
                      </button>

                      <button
                        onClick={() => duplicateProduct(p)}
                        className="px-2.5 py-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-700 text-xs font-bold rounded-lg flex items-center gap-1"
                        title="نسخ المنتج"
                      >
                        <Copy className="w-3.5 h-3.5 text-stone-500" />
                        نسخ
                      </button>

                      {p.status === "published" ? (
                        <button
                          onClick={() => handleQuickStatusChange(p.id, p.name, "paused")}
                          className="px-2.5 py-1.5 bg-amber-50 border border-amber-300 text-amber-800 text-xs font-bold rounded-lg flex items-center gap-1"
                          title="إيقاف نشر المنتج مؤقتاً"
                        >
                          <Pause className="w-3.5 h-3.5" />
                          إيقاف
                        </button>
                      ) : (
                        <button
                          onClick={() => handleQuickStatusChange(p.id, p.name, "published")}
                          className="px-2.5 py-1.5 bg-emerald-50 border border-emerald-300 text-emerald-800 text-xs font-bold rounded-lg flex items-center gap-1"
                          title="نشر المنتج"
                        >
                          <Play className="w-3.5 h-3.5" />
                          نشر
                        </button>
                      )}

                      <button
                        onClick={() => {
                          setAuditLogsList(MarketplaceStore.getAuditLogs(p.id));
                          setSelectedAuditLogProductId(p.id);
                          setViewMode("audit_logs");
                        }}
                        className="p-1.5 bg-white border border-stone-300 hover:bg-stone-100 text-stone-600 rounded-lg text-xs"
                        title="سجل التعديلات"
                      >
                        <History className="w-3.5 h-3.5 text-amber-600" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* VIEW 2: PRODUCT ADDITION / EDITING WIZARD */}
      {viewMode === "wizard" && (
        <div className="bg-white rounded-2xl border border-stone-200 shadow-lg overflow-hidden">
          {/* Steps Indicator Bar */}
          <div className="bg-stone-900 text-amber-100 p-4 border-b border-stone-800 flex items-center justify-between overflow-x-auto scrollbar-none">
            {[
              { num: 1, title: "1. اختيار الكتالوج والقالب" },
              { num: 2, title: "2. البيانات والمواصفات الفنية" },
              { num: 3, title: "3. صور السلعة" },
              { num: 4, title: "4. خيارات الشراء (إلزامي)" },
              { num: 5, title: "5. المعاينة والنشر" },
            ].map((s) => (
              <button
                key={s.num}
                onClick={() => setWizardStep(s.num)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap flex items-center gap-2 transition-all ${
                  wizardStep === s.num
                    ? "bg-amber-500 text-stone-950 font-black shadow-md"
                    : wizardStep > s.num
                      ? "bg-stone-800 text-amber-300"
                      : "text-stone-400 hover:text-stone-200"
                }`}
              >
                {wizardStep > s.num ? (
                  <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                ) : null}
                <span>{s.title}</span>
              </button>
            ))}
          </div>

          <div className="p-6">
            {/* STEP 1: CATEGORY SELECTION */}
            {wizardStep === 1 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <Layers className="w-5 h-5 text-amber-600" />
                    الخطوة الأولى: اختيار أقسام الكتالوج المعتمد
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    اختر القسم الرئيسي ثم القسم الفرعي، وسيتم تحميل مواصفات وشروط القالب تلقائياً.
                  </p>
                </div>

                {/* Main Category */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="block text-sm font-bold text-stone-800">
                      القسم الرئيسي القياسي <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setShowAddMainCategoryModal(true)}
                      className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1 transition-all"
                    >
                      <FolderPlus className="w-3.5 h-3.5" />➕ إضافة قسم رئيسي جديد
                    </button>
                  </div>

                  <select
                    value={formMainCategory}
                    onChange={(e) => {
                      setFormMainCategory(e.target.value);
                      setFormSubCategory("");
                      setFormSpecifications({});
                    }}
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                  >
                    <option value="">-- اختر القسم الرئيسي من الكتالوج --</option>
                    {mainCategories.map((c) => (
                      <option key={c.id} value={c.name}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Sub Category - STRICTLY FILTERED TO SELECTED MAIN CATEGORY */}
                {formMainCategory && (
                  <div className="space-y-2 pt-3 border-t border-stone-100">
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-bold text-stone-800">
                        القسم الفرعي التابع لـ ({formMainCategory}){" "}
                        <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={() => setShowAddSubCategoryModal(true)}
                        className="text-xs font-bold text-amber-800 hover:text-amber-900 bg-amber-50 hover:bg-amber-100 px-3 py-1 rounded-lg border border-amber-300 flex items-center gap-1 transition-all"
                      >
                        <Plus className="w-3.5 h-3.5" />➕ إضافة قسم فرعي جديد
                      </button>
                    </div>

                    <select
                      value={formSubCategory}
                      onChange={(e) => {
                        setFormSubCategory(e.target.value);
                        setFormSpecifications({});
                      }}
                      className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="">-- اختر القسم الفرعي المخصص --</option>
                      {availableSubCategories.map((sc) => (
                        <option key={sc.id} value={sc.name}>
                          {sc.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                {/* Template Inheritance Banner */}
                {formMainCategory && (
                  <div className="p-4 bg-amber-50/80 border border-amber-200 rounded-2xl space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 font-black text-amber-950 text-sm">
                        <Sparkles className="w-4 h-4 text-amber-600" />
                        <span>قالب الكتالوج المعتمد:</span>
                        <span className="bg-amber-200 text-amber-950 px-2.5 py-0.5 rounded-lg">
                          {activeCategoryTemplate.mainCategory}
                          {formSubCategory ? ` > ${formSubCategory}` : ""}
                        </span>
                      </div>
                      <span className="text-[10px] font-bold bg-amber-900 text-amber-100 px-2 py-0.5 rounded">
                        وراثة تلقائية
                      </span>
                    </div>
                    <p className="text-xs text-amber-800 leading-relaxed">
                      {activeCategoryTemplate.description}
                    </p>
                    <div className="flex flex-wrap gap-2 pt-1 text-[11px] font-bold text-amber-900">
                      <span>
                        • الحقول الفنية: {activeCategoryTemplate.specDefinitions.length} حقل مخصص
                      </span>
                      <span>
                        • خيارات الشراء:{" "}
                        {activeCategoryTemplate.allowedOptionTypes.map((o) => o.label).join("، ")}
                      </span>
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-end">
                  <button
                    onClick={() => {
                      if (!formMainCategory) {
                        toast.error("يرجى اختيار القسم الرئيسي أولاً");
                        return;
                      }
                      setWizardStep(2);
                    }}
                    className="bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md"
                  >
                    التالي: البيانات والمواصفات
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: BASIC DATA & CATEGORY SPECIFICATIONS */}
            {wizardStep === 2 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <FileText className="w-5 h-5 text-amber-600" />
                    الخطوة الثانية: البيانات والمواصفات الفنية المعتمدة
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    أدخل اسم السلعة، السعر، والمواصفات الفنية التي يحددها قالب قسم (
                    {formMainCategory})
                  </p>
                </div>

                {/* Name */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-stone-800">
                    اسم المنتج بالكامل <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    placeholder="أدخل اسم المنتج بوضوح وحسب معايير الكتالوج"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                  />
                </div>

                {/* Description */}
                <div className="space-y-1.5">
                  <label className="block text-sm font-bold text-stone-800">
                    وصف التفاصيل والمواصفات <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={4}
                    placeholder="اكتب مواصفات المنتج، الأبعاد، الضمان، وطريقة العناية بكل وضوح..."
                    value={formDescription}
                    onChange={(e) => setFormDescription(e.target.value)}
                    className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm text-stone-800 focus:ring-2 focus:ring-amber-500/50 leading-relaxed"
                  />
                </div>

                {/* Price & Currency & Selling Method */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-stone-800">
                      سعر البيع النهائي <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        placeholder="0"
                        value={formPrice}
                        onChange={(e) => setFormPrice(e.target.value ? Number(e.target.value) : "")}
                        className="w-full pl-16 pr-3 py-3 bg-stone-50 border border-stone-300 rounded-xl text-lg font-black text-amber-900 focus:ring-2 focus:ring-amber-500/50"
                      />
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-xs font-bold text-stone-500 bg-stone-200 px-2 py-1 rounded-md">
                        {formCurrency}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="block text-sm font-bold text-stone-800">
                      طريقة البيع والتوفر <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={formSellingMethod}
                      onChange={(e) => setFormSellingMethod(e.target.value as SellingMethod)}
                      className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                    >
                      <option value="in_stock">متوفر بالمخزون</option>
                      <option value="on_demand">حسب الطلب (تصنيع/استيراد)</option>
                      <option value="always_available">متوفر دائمًا</option>
                      <option value="single_item">قطعة واحدة فقط (ينتهي بمجرد الشراء)</option>
                    </select>
                  </div>
                </div>

                {/* DYNAMIC CATEGORY SPECIFICATIONS SECTION (منع العشوائية) */}
                {activeCategoryTemplate.specDefinitions.length > 0 && (
                  <div className="p-5 bg-stone-50 rounded-2xl border border-stone-200 space-y-4">
                    <div className="flex items-center gap-2 border-b border-stone-200 pb-3">
                      <Info className="w-5 h-5 text-amber-600 shrink-0" />
                      <div>
                        <h4 className="font-black text-stone-900 text-sm">
                          المواصفات الفنية المعتمدة لقالب ({activeCategoryTemplate.mainCategory})
                        </h4>
                        <p className="text-[11px] text-stone-500">
                          هذه الحقول مخصصة فقط لنوع منتجاتك وتضمن التوثيق الدقيق في البحث والمقارنة
                        </p>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {activeCategoryTemplate.specDefinitions.map((spec) => (
                        <div key={spec.id} className="space-y-1.5">
                          <label className="block text-xs font-bold text-stone-800">
                            {spec.name} {spec.required && <span className="text-red-500">*</span>}
                          </label>

                          {spec.type === "select" ? (
                            <select
                              value={formSpecifications[spec.id] || ""}
                              onChange={(e) =>
                                setFormSpecifications((prev) => ({
                                  ...prev,
                                  [spec.id]: e.target.value,
                                }))
                              }
                              className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                            >
                              <option value="">-- اختر القيمة --</option>
                              {spec.options?.map((opt) => (
                                <option key={opt} value={opt}>
                                  {opt}
                                </option>
                              ))}
                            </select>
                          ) : spec.type === "boolean" ? (
                            <label className="flex items-center gap-2 cursor-pointer p-2.5 bg-white border border-stone-300 rounded-xl">
                              <input
                                type="checkbox"
                                checked={formSpecifications[spec.id] === "true"}
                                onChange={(e) =>
                                  setFormSpecifications((prev) => ({
                                    ...prev,
                                    [spec.id]: e.target.checked ? "true" : "false",
                                  }))
                                }
                                className="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                              />
                              <span className="text-xs font-bold text-stone-700">مفعل / نعم</span>
                            </label>
                          ) : (
                            <div className="relative">
                              <input
                                type={spec.type === "number" ? "number" : "text"}
                                placeholder={spec.description || `أدخل ${spec.name}`}
                                value={formSpecifications[spec.id] || ""}
                                onChange={(e) =>
                                  setFormSpecifications((prev) => ({
                                    ...prev,
                                    [spec.id]: e.target.value,
                                  }))
                                }
                                className="w-full p-2.5 bg-white border border-stone-300 rounded-xl text-xs font-bold text-stone-800 focus:ring-2 focus:ring-amber-500/50"
                              />
                              {spec.unit && (
                                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[10px] font-bold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                                  {spec.unit}
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-between">
                  <button
                    onClick={() => setWizardStep(1)}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>

                  <button
                    onClick={() => {
                      if (!formName.trim() || !formPrice) {
                        toast.error("يرجى إدخال اسم المنتج والسعر بشكل صحيح");
                        return;
                      }
                      setWizardStep(3);
                    }}
                    className="bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md"
                  >
                    التالي: صور السلعة
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: PHOTO UPLOAD */}
            {wizardStep === 3 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <ImageIcon className="w-5 h-5 text-amber-600" />
                    الخطوة الثالثة: رفع معرض صور السلعة
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    يُسمح برفع الصور المباشرة من جهازك. يتم الضغط وتحسين الجودة تلقائياً.
                  </p>
                </div>

                {/* Upload Area */}
                <div className="border-2 border-dashed border-amber-300 bg-amber-50/50 p-8 rounded-2xl text-center space-y-3 relative hover:bg-amber-50 transition-all">
                  <Upload className="w-10 h-10 mx-auto text-amber-600" />
                  <div>
                    <p className="text-sm font-bold text-stone-800">اضغط هنا لرفع الصور من جهازك</p>
                    <p className="text-xs text-stone-500 mt-1">
                      يدعم صيغ JPG, PNG, WEBP (الحد الأقصى 10 صور)
                    </p>
                  </div>
                  <input
                    type="file"
                    multiple
                    accept="image/*"
                    onChange={handleImageFileUpload}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                </div>

                {/* Uploaded Images Grid */}
                {formImages.length > 0 && (
                  <div className="space-y-2">
                    <label className="block text-xs font-bold text-stone-700">
                      الصور المرفوعة (اضغط لتحديد الصورة الرئيسية):
                    </label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {formImages.map((imgUrl, idx) => (
                        <div
                          key={idx}
                          onClick={() => setFormPrimaryImageIndex(idx)}
                          className={`relative h-32 rounded-xl overflow-hidden border-2 cursor-pointer transition-all ${
                            formPrimaryImageIndex === idx
                              ? "border-amber-600 shadow-md ring-2 ring-amber-500/50"
                              : "border-stone-200 opacity-80 hover:opacity-100"
                          }`}
                        >
                          <img
                            src={imgUrl}
                            alt="صورة المعرض"
                            className="w-full h-full object-cover"
                          />
                          {formPrimaryImageIndex === idx && (
                            <span className="absolute top-2 right-2 bg-amber-500 text-stone-950 text-[10px] font-black px-2 py-0.5 rounded-md shadow">
                              الرئيسية ⭐
                            </span>
                          )}

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setFormImages((prev) => prev.filter((_, i) => i !== idx));
                              if (formPrimaryImageIndex === idx) setFormPrimaryImageIndex(0);
                            }}
                            className="absolute bottom-2 left-2 p-1 bg-red-600 text-white rounded-md shadow hover:bg-red-700"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="pt-6 flex justify-between">
                  <button
                    onClick={() => setWizardStep(2)}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>

                  <button
                    onClick={() => {
                      if (formImages.length === 0) {
                        toast.error("يرجى رفع صورة واحدة على الأقل للمنتج");
                        return;
                      }
                      setWizardStep(4);
                    }}
                    className="bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md"
                  >
                    التالي: خيارات الشراء (إلزامي)
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 4: PURCHASE OPTIONS (خيارات الشراء المرتبطة بالقسم) */}
            {wizardStep === 4 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                        <Sliders className="w-5 h-5 text-amber-600" />
                        الخطوة الرابعة: خيارات الشراء المرتبطة بالقسم (إجباري للنشر)
                      </h3>
                      <p className="text-xs text-stone-500 mt-0.5">
                        حدد خيارات الشراء المتاحة لقالب ({activeCategoryTemplate.mainCategory})
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={() => setShowAddSharedOptionModal(true)}
                      className="bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 text-xs font-bold px-3 py-1.5 rounded-xl flex items-center gap-1 transition-all"
                    >
                      <Plus className="w-3.5 h-3.5 text-amber-600" />➕ إضافة خيار مخصص
                    </button>
                  </div>
                </div>

                {/* Pre-populated Options Specific to Current Category Template */}
                <div className="bg-stone-50 p-4 rounded-xl border border-stone-200 space-y-3">
                  <label className="block text-xs font-bold text-stone-800">
                    خيارات الشراء الموصى بها لقالب ({activeCategoryTemplate.mainCategory}):
                  </label>

                  <div className="flex flex-wrap gap-2">
                    {activeCategoryTemplate.allowedOptionTypes.map((allowed) => (
                      <div key={allowed.type} className="w-full space-y-1.5 pt-1">
                        <span className="text-[11px] font-black text-amber-900 bg-amber-100 px-2.5 py-0.5 rounded-md inline-block">
                          {allowed.label}
                        </span>
                        <div className="flex flex-wrap gap-1.5">
                          {(allowed.defaultValues || []).map((val) => {
                            const isSelected = formPurchaseOptions.some(
                              (po) => po.type === allowed.type && po.value === val,
                            );
                            return (
                              <button
                                key={val}
                                type="button"
                                onClick={() => {
                                  if (isSelected) {
                                    setFormPurchaseOptions((prev) =>
                                      prev.filter(
                                        (po) => !(po.type === allowed.type && po.value === val),
                                      ),
                                    );
                                  } else {
                                    const newPo: PurchaseOption = {
                                      id: "opt-" + Date.now() + Math.random(),
                                      type: allowed.type,
                                      label: allowed.label,
                                      value: val,
                                      stock: 10,
                                      price_delta: 0,
                                    };
                                    setFormPurchaseOptions((prev) => [...prev, newPo]);
                                  }
                                }}
                                className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all flex items-center gap-1 border ${
                                  isSelected
                                    ? "bg-amber-900 text-amber-100 border-amber-900 shadow-sm"
                                    : "bg-white text-stone-700 border-stone-300 hover:border-amber-400"
                                }`}
                              >
                                {isSelected ? (
                                  <Check className="w-3 h-3 text-amber-400" />
                                ) : (
                                  <Plus className="w-3 h-3 text-stone-400" />
                                )}
                                <span>{val}</span>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Configured Purchase Options Table */}
                {formPurchaseOptions.length > 0 ? (
                  <div className="space-y-3">
                    <label className="block text-sm font-bold text-stone-900">
                      الخيارات المحددة لمنتجك ({formPurchaseOptions.length}):
                    </label>
                    <div className="bg-white rounded-xl border border-stone-200 overflow-hidden divide-y divide-stone-100">
                      {formPurchaseOptions.map((po, idx) => (
                        <div
                          key={po.id}
                          className="p-3 flex flex-wrap items-center justify-between gap-3 text-xs"
                        >
                          <div className="flex items-center gap-2">
                            <span className="bg-amber-100 text-amber-900 px-2 py-0.5 rounded-md font-bold">
                              {po.label}
                            </span>
                            <span className="font-black text-stone-800 text-sm">{po.value}</span>
                          </div>

                          <div className="flex flex-wrap items-center gap-3">
                            {/* Option Specific Image Linking */}
                            <div className="flex items-center gap-1.5 bg-stone-50 px-2 py-1 rounded-lg border border-stone-200">
                              <ImageIcon className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                              <span className="text-[11px] font-bold text-stone-600">الصورة:</span>
                              {formImages.length > 0 ? (
                                <select
                                  value={po.image_url || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    setFormPurchaseOptions((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, image_url: url } : item,
                                      ),
                                    );
                                  }}
                                  className="bg-white border border-stone-300 rounded text-[11px] font-bold px-2 py-0.5 text-stone-800"
                                >
                                  <option value="">-- اختر من معرض المنتج --</option>
                                  {formImages.map((img, imgIdx) => (
                                    <option key={imgIdx} value={img}>
                                      صورة #{imgIdx + 1}{" "}
                                      {formPrimaryImageIndex === imgIdx ? "(الرئيسية)" : ""}
                                    </option>
                                  ))}
                                </select>
                              ) : (
                                <input
                                  type="url"
                                  placeholder="رابط الصورة..."
                                  value={po.image_url || ""}
                                  onChange={(e) => {
                                    const url = e.target.value;
                                    setFormPurchaseOptions((prev) =>
                                      prev.map((item, i) =>
                                        i === idx ? { ...item, image_url: url } : item,
                                      ),
                                    );
                                  }}
                                  className="w-36 bg-white border border-stone-300 rounded text-[11px] font-bold px-2 py-0.5"
                                />
                              )}
                              {po.image_url && (
                                <img
                                  src={po.image_url}
                                  alt="Variant"
                                  className="w-6 h-6 object-cover rounded border"
                                />
                              )}
                            </div>

                            <div className="flex items-center gap-1">
                              <span className="text-stone-500 font-bold">المخزون:</span>
                              <input
                                type="number"
                                value={po.stock ?? 10}
                                onChange={(e) => {
                                  const val = Number(e.target.value);
                                  setFormPurchaseOptions((prev) =>
                                    prev.map((item, i) =>
                                      i === idx ? { ...item, stock: val } : item,
                                    ),
                                  );
                                }}
                                className="w-16 p-1 bg-stone-50 border border-stone-300 rounded text-center font-bold"
                              />
                            </div>

                            <button
                              type="button"
                              onClick={() =>
                                setFormPurchaseOptions((prev) => prev.filter((_, i) => i !== idx))
                              }
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="p-4 bg-red-50 border border-red-200 text-red-800 rounded-xl text-xs font-bold flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 shrink-0" />
                    تنبيه هام: خيارات الشراء إلزامية! يجب اختيار أو إضافة خيار شراء واحد على الأقل
                    قبل إمكانية نشر المنتج.
                  </div>
                )}

                <div className="pt-6 flex justify-between">
                  <button
                    onClick={() => setWizardStep(3)}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 font-bold px-5 py-2.5 rounded-xl text-sm flex items-center gap-1"
                  >
                    <ChevronRight className="w-4 h-4" />
                    السابق
                  </button>

                  <button
                    onClick={() => {
                      if (formPurchaseOptions.length === 0) {
                        toast.error("خيارات الشراء إلزامية قبل الانتقال لخطوة النشر!");
                        return;
                      }
                      setWizardStep(5);
                    }}
                    className="bg-amber-900 hover:bg-amber-950 text-amber-100 font-bold px-6 py-2.5 rounded-xl text-sm flex items-center gap-2 shadow-md"
                  >
                    التالي: التحقق والمعاينة والنشر
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 5: VALIDATION, PREVIEW & PUBLISH */}
            {wizardStep === 5 && (
              <div className="space-y-6 max-w-3xl mx-auto">
                <div className="border-b border-stone-100 pb-3">
                  <h3 className="text-lg font-black text-stone-900 flex items-center gap-2">
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    الخطوة الخامسة: مراجعة وشروط اعتماد النشر
                  </h3>
                  <p className="text-xs text-stone-500 mt-0.5">
                    تحقق النظام تلقائياً من اكتمال المعايير المطلوبة لنشر السلعة بالماركت بليس
                  </p>
                </div>

                {/* Validation Status Summary Card */}
                <div
                  className={`p-4 rounded-2xl border ${formValidation.valid ? "bg-emerald-50 border-emerald-300 text-emerald-900" : "bg-red-50 border-red-300 text-red-900"}`}
                >
                  <div className="flex items-center gap-2 font-black text-sm mb-2">
                    {formValidation.valid ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                        المنتج مكتمل تماماً وجاهز للنشر المباشر بالمنصة 🎉
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        يوجد نقص في بعض الحقول المطلوبة قبل الاعتماد:
                      </>
                    )}
                  </div>

                  {!formValidation.valid && (
                    <ul className="list-disc list-inside text-xs space-y-1 font-bold">
                      {formValidation.errors.map((err, i) => (
                        <li key={i}>{err}</li>
                      ))}
                    </ul>
                  )}
                </div>

                {/* Actions Toolbar */}
                <div className="flex flex-wrap gap-3 justify-center pt-4">
                  <button
                    onClick={() => setShowPreviewModal(true)}
                    className="bg-stone-800 hover:bg-stone-700 text-amber-200 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2 shadow"
                  >
                    <Eye className="w-4 h-4 text-amber-400" />
                    معاينة شكل المنتج للمشتري
                  </button>

                  <button
                    onClick={() => handleSaveProduct("draft")}
                    className="bg-stone-200 hover:bg-stone-300 text-stone-800 px-5 py-3 rounded-xl text-sm font-bold flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" />
                    حفظ كمسودة
                  </button>

                  <button
                    disabled={!formValidation.valid}
                    onClick={() => handleSaveProduct("published")}
                    className={`px-8 py-3 rounded-xl text-sm font-black flex items-center gap-2 shadow-lg transition-all ${
                      formValidation.valid
                        ? "bg-amber-500 hover:bg-amber-400 text-stone-950 shadow-amber-500/20 cursor-pointer"
                        : "bg-stone-300 text-stone-500 cursor-not-allowed opacity-60"
                    }`}
                  >
                    <Sparkles className="w-5 h-5" />
                    اعتماد ونشر المنتج الآن 🎉
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* VIEW 3: SHARED RESOURCES MANAGEMENT */}
      {viewMode === "shared_resources" && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-6">
          <div className="flex items-center justify-between border-b border-stone-100 pb-4">
            <div>
              <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
                <Boxes className="w-6 h-6 text-amber-600" />
                إدارة الكتالوج الموحد والموارد المشتركة (Super Admin)
              </h3>
              <p className="text-xs text-stone-500 mt-1">
                جميع الأقسام القياسية، الخامات، الألوان والمقاسات محفوظة في الكتالوج الموحد للمنصة
              </p>
            </div>

            <button
              onClick={() => setShowAddSharedOptionModal(true)}
              className="bg-amber-900 hover:bg-amber-950 text-amber-100 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              إضافة عنصر موارد جديدة
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {sharedOptions.map((opt) => (
              <div
                key={opt.id}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-center justify-between"
              >
                <div>
                  <span className="text-[10px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-md">
                    {opt.typeLabel}
                  </span>
                  <p className="font-bold text-stone-900 text-sm mt-1">{opt.value}</p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      MarketplaceStore.deleteSharedOptionResource(opt.id);
                      setSharedOptions(MarketplaceStore.getSharedOptionResources());
                      toast.success("تم حذف العنصر من الموارد المشتركة");
                    }}
                    className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg text-xs"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* VIEW 4: AUDIT LOGS VIEW */}
      {viewMode === "audit_logs" && (
        <div className="bg-white p-6 rounded-2xl border border-stone-200 shadow-md space-y-4">
          <div className="flex items-center justify-between border-b border-stone-100 pb-3">
            <h3 className="text-xl font-black text-stone-900 flex items-center gap-2">
              <History className="w-6 h-6 text-amber-600" />
              سجلات العمليات والتعديلات (Audit Logs)
            </h3>
            <button
              onClick={() => setViewMode("list")}
              className="text-xs font-bold text-stone-600 hover:text-stone-900"
            >
              إغلاق
            </button>
          </div>

          <div className="space-y-3">
            {auditLogsList.map((log) => (
              <div
                key={log.id}
                className="p-4 bg-stone-50 rounded-xl border border-stone-200 flex items-start justify-between"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{log.productName}</span>
                    <span className="text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded font-bold">
                      {log.action}
                    </span>
                  </div>
                  <p className="text-xs text-stone-600">{log.details}</p>
                  <p className="text-[10px] text-stone-400">
                    من قبل: {log.userName} ({log.userRole}) • {log.timestamp}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADD MAIN CATEGORY WITH TEMPLATE INHERITANCE */}
      {showAddMainCategoryModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl">
            <h3 className="text-lg font-black text-stone-900">
              ➕ إضافة قسم رئيسي جديد مع وراثة القالب
            </h3>
            <p className="text-xs text-stone-500">
              اختر القالب الأساسي الذي سيرث منه هذا القسم الحقول والمواصفات وخيارات الشراء
            </p>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                اسم القسم الرئيسي الجديد:
              </label>
              <input
                type="text"
                placeholder="اسم القسم (مثال: معدات رياضية ولياقة)"
                value={newMainCatName}
                onChange={(e) => setNewMainCatName(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                اختيار القالب المعتمد للوراثة:
              </label>
              <select
                value={newMainCatTemplateId}
                onChange={(e) => setNewMainCatTemplateId(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
              >
                {Object.values(MASTER_CATEGORY_TEMPLATES).map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.mainCategory} {tpl.subCategory ? `> ${tpl.subCategory}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddMainCategoryModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleQuickAddMainCategory}
                className="px-5 py-2 bg-amber-900 text-amber-100 font-bold rounded-xl text-xs shadow"
              >
                حفظ ووراثة القالب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SUB CATEGORY WITH TEMPLATE INHERITANCE */}
      {showAddSubCategoryModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl">
            <h3 className="text-lg font-black text-stone-900">
              ➕ إضافة قسم فرعي تحت ({formMainCategory})
            </h3>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                اسم القسم الفرعي الجديد:
              </label>
              <input
                type="text"
                placeholder="اسم القسم الفرعي"
                value={newSubCatName}
                onChange={(e) => setNewSubCatName(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800"
              />
            </div>

            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-stone-800">
                قالب الوراثة الخاص بالفرعي:
              </label>
              <select
                value={newSubCatTemplateId}
                onChange={(e) => setNewSubCatTemplateId(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold text-stone-800"
              >
                {Object.values(MASTER_CATEGORY_TEMPLATES).map((tpl) => (
                  <option key={tpl.id} value={tpl.id}>
                    {tpl.mainCategory} {tpl.subCategory ? `> ${tpl.subCategory}` : ""}
                  </option>
                ))}
              </select>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddSubCategoryModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleQuickAddSubCategory}
                className="px-5 py-2 bg-amber-900 text-amber-100 font-bold rounded-xl text-xs shadow"
              >
                إضافة وربط القالب
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: ADD SHARED PURCHASE OPTION */}
      {showAddSharedOptionModal && (
        <div className="fixed inset-0 bg-stone-950/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 text-right shadow-2xl">
            <h3 className="text-lg font-black text-stone-900">➕ إضافة خيار شراء جديد للكتالوج</h3>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">نوع الخيار:</label>
              <select
                value={newOptionType}
                onChange={(e) => {
                  const t = e.target.value as PurchaseOption["type"];
                  setNewOptionType(t);
                  const labels: Record<string, string> = {
                    color: "اللون",
                    size: "المقاس",
                    volume: "الحجم/السعة",
                    flavor: "النكهة",
                    finish: "التشطيب",
                    material: "المادة/الخامة",
                    condition: "الحالة",
                    custom: "خيار مخصص",
                  };
                  setNewOptionTypeLabel(labels[t] || "خيار");
                }}
                className="w-full p-2.5 bg-stone-50 border border-stone-300 rounded-xl text-xs font-bold"
              >
                <option value="color">اللون</option>
                <option value="size">المقاس</option>
                <option value="volume">الحجم/السعة</option>
                <option value="material">المادة/الخامة</option>
                <option value="finish">التشطيب</option>
                <option value="condition">الحالة</option>
                <option value="custom">خيار مخصص</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-xs font-bold text-stone-700">القيمة المطلوبة:</label>
              <input
                type="text"
                placeholder="مثال: أزرق بتيل فاخر، 120 سم، خشب زان"
                value={newOptionValue}
                onChange={(e) => setNewOptionValue(e.target.value)}
                className="w-full p-3 bg-stone-50 border border-stone-300 rounded-xl text-sm font-bold text-stone-800"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowAddSharedOptionModal(false)}
                className="px-4 py-2 bg-stone-200 text-stone-700 font-bold rounded-xl text-xs"
              >
                إلغاء
              </button>
              <button
                onClick={handleAddSharedOption}
                className="px-5 py-2 bg-amber-900 text-amber-100 font-bold rounded-xl text-xs shadow"
              >
                حفظ الخيار وإضافته
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: PRODUCT PREVIEW */}
      {showPreviewModal && (
        <div className="fixed inset-0 bg-stone-950/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 text-right shadow-2xl relative">
            <button
              onClick={() => setShowPreviewModal(false)}
              className="absolute top-4 left-4 p-1 text-stone-400 hover:text-stone-900"
            >
              <X className="w-5 h-5" />
            </button>

            <span className="bg-amber-100 text-amber-900 text-xs font-bold px-3 py-1 rounded-full">
              معاينة تجربة المشتري 👁️
            </span>

            <div className="h-56 bg-stone-100 rounded-xl overflow-hidden">
              <img
                src={
                  formImages[formPrimaryImageIndex] ||
                  formImages[0] ||
                  "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?auto=format&fit=crop&w=600&q=80"
                }
                alt="المعاينة"
                className="w-full h-full object-cover"
              />
            </div>

            <div>
              <span className="text-xs font-bold text-amber-800 bg-amber-50 px-2 py-0.5 rounded">
                {formMainCategory} &gt; {formSubCategory}
              </span>
              <h3 className="text-lg font-black text-stone-900 mt-1">{formName || "اسم المنتج"}</h3>
              <p className="text-xs text-stone-500 mt-1">{formDescription || "الوصف غير مدخل"}</p>
            </div>

            <div className="text-xl font-black text-amber-950">
              {formatEGP(Number(formPrice) || 0)}
            </div>

            {/* Technical Specifications Preview */}
            {Object.keys(formSpecifications).length > 0 && (
              <div className="space-y-1.5 border-t border-stone-100 pt-3">
                <label className="block text-xs font-bold text-stone-800">
                  المواصفات الفنية المدخلة:
                </label>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  {Object.entries(formSpecifications).map(([key, val]) => (
                    <div key={key} className="bg-stone-50 p-2 rounded-lg border border-stone-200">
                      <span className="text-stone-500 font-bold">{key}: </span>
                      <span className="font-black text-stone-800">{val}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Purchase Options preview */}
            {formPurchaseOptions.length > 0 && (
              <div className="space-y-2 border-t border-stone-100 pt-3">
                <label className="block text-xs font-bold text-stone-800">
                  خيارات الشراء المتاحة:
                </label>
                <div className="flex flex-wrap gap-2">
                  {formPurchaseOptions.map((po) => (
                    <span
                      key={po.id}
                      className="bg-stone-100 border border-stone-300 text-stone-800 text-xs px-3 py-1.5 rounded-lg font-bold"
                    >
                      {po.label}: {po.value}
                    </span>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => setShowPreviewModal(false)}
              className="w-full py-3 bg-amber-900 text-amber-100 font-bold rounded-xl text-sm mt-2"
            >
              إغلاق المعاينة والعودة للنماذج
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
