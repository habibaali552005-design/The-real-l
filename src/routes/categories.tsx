import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useState, useEffect, useMemo } from "react";
import { toast } from "sonner";
import { MarketplaceStore, CategoryNode } from "@/lib/marketplaceStore";
import { ALL_CATEGORY_ICONS, getCategoryIcon } from "@/lib/category-icons";
import { supabase } from "@/integrations/supabase/client";
import {
  Layers,
  Plus,
  Trash2,
  Edit2,
  Check,
  FolderPlus,
  ArrowRight,
  Merge,
  ChevronLeft,
  ChevronDown,
  FolderTree,
  Folder,
  Package,
  Sparkles,
  Move,
  X,
} from "lucide-react";

export const Route = createFileRoute("/categories")({
  component: CategoriesPage,
});

export function CategoriesPage() {
  const isAdmin = useIsAdmin();
  const navigate = useNavigate();

  const [categories, setCategories] = useState<CategoryNode[]>([]);
  const [selectedCatId, setSelectedCatId] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<string | null>(null);

  // Form & Edit states
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newCatName, setNewCatName] = useState("");
  const [newCatParentId, setNewCatParentId] = useState<string>("");
  const [newCatIcon, setNewCatIcon] = useState<string>("Shirt");

  const [editingCatId, setEditingCatId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editParentId, setEditParentId] = useState<string>("");
  const [editIcon, setEditIcon] = useState<string>("");

  // Merge modal
  const [sourceCatId, setSourceCatId] = useState("");
  const [targetCatId, setTargetCatId] = useState("");

  const loadData = () => {
    const list = MarketplaceStore.getCategories();
    setCategories(list);
  };

  useEffect(() => {
    loadData();
    supabase.auth.getUser().then(({ data }) => {
      if (data?.user) {
        setUserRole(data.user.user_metadata?.role || "buyer");
      }
    });

    const handleUpdate = () => loadData();
    window.addEventListener("beitak-categories-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-categories-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  const isSeller = userRole === "seller" || userRole === "admin" || isAdmin;

  // Selected Category Node
  const currentCategory = useMemo(() => {
    if (!selectedCatId) return null;
    return categories.find((c) => c.id === selectedCatId) || null;
  }, [selectedCatId, categories]);

  // Subcategories of selected or root level
  const activeSubcategories = useMemo(() => {
    return categories.filter((c) => c.parentId === selectedCatId);
  }, [selectedCatId, categories]);

  // Breadcrumb chain
  const breadcrumbs = useMemo(() => {
    const chain: CategoryNode[] = [];
    let curr = currentCategory;
    while (curr) {
      chain.unshift(curr);
      curr = categories.find((c) => c.id === curr?.parentId) || null;
    }
    return chain;
  }, [currentCategory, categories]);

  // Add Category Handler
  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCatName.trim()) {
      toast.error("يرجى إدخال اسم القسم");
      return;
    }

    MarketplaceStore.addCategory({
      name: newCatName.trim(),
      parentId: newCatParentId || null,
      icon: newCatIcon,
      sortOrder: categories.length + 1,
    });

    setNewCatName("");
    setNewCatParentId("");
    setIsAddModalOpen(false);
    toast.success("تم إضافة القسم الجديد بالتسلسل الهرمي بنجاح! ✨");
  };

  // Edit Category Handler
  const handleSaveEdit = (catId: string) => {
    if (!editName.trim()) return;
    MarketplaceStore.updateCategory(catId, {
      name: editName.trim(),
      parentId: editParentId || null,
      icon: editIcon,
    });
    setEditingCatId(null);
    toast.success("تم تحديث بيانات القسم بنجاح");
  };

  // Delete Category
  const handleDelete = (cat: CategoryNode) => {
    if (
      confirm(`هل أنت تأكد من حذف قسم "${cat.name}"؟ ستبقى جميع المنتجات المرتبطة به غير محذوفة.`)
    ) {
      MarketplaceStore.deleteCategory(cat.id);
      if (selectedCatId === cat.id) setSelectedCatId(null);
      toast.success("تم حذف القسم وتنسيق التدرج الهرمي بنجاح");
    }
  };

  // Merge Categories
  const handleMerge = () => {
    if (!sourceCatId || !targetCatId || sourceCatId === targetCatId) {
      toast.error("يرجى اختيار قسمين مختلفين للدمج");
      return;
    }
    const sourceObj = categories.find((c) => c.id === sourceCatId);
    const targetObj = categories.find((c) => c.id === targetCatId);
    if (!sourceObj || !targetObj) return;

    MarketplaceStore.mergeCategories(sourceCatId, targetCatId);
    setSourceCatId("");
    setTargetCatId("");
    toast.success(`تم دمج قسم "${sourceObj.name}" بنجاح داخل "${targetObj.name}"!`);
  };

  return (
    <PageShell>
      <div className="max-w-7xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Header Hero Banner */}
        <div className="bg-gradient-to-br from-brand-dark via-slate-900 to-brand-primary/90 text-white rounded-3xl p-6 md:p-10 shadow-2xl border border-brand-accent/20 flex flex-col md:flex-row items-center justify-between gap-6 relative overflow-hidden">
          <div className="absolute -top-12 -left-12 w-48 h-48 bg-brand-accent/10 rounded-full blur-3xl pointer-events-none" />
          <div className="space-y-3 text-center md:text-start relative z-10 max-w-2xl">
            <span className="inline-flex items-center gap-1.5 bg-brand-accent/20 text-brand-accent border border-brand-accent/30 px-3.5 py-1 rounded-full text-xs font-black">
              <FolderTree className="w-4 h-4" />
              هيكل الأقسام الهرمي متعدد المستويات
            </span>
            <h1 className="text-2xl md:text-4xl font-black leading-tight">
              تصفح وإدارة كافة أقسام وتصنيفات متجر بيتك
            </h1>
            <p className="text-xs md:text-sm text-slate-300 leading-relaxed">
              نظام هرمي مرن وغير محدود يتفرع من الأقسام الرئيسية إلى التصنيفات الفرعية والدقيقة
              لسهولة وصول المشتري للمنتج المطلوبة.
            </p>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-3 relative z-10 shrink-0">
            {isSeller && (
              <button
                onClick={() => {
                  setNewCatParentId(selectedCatId || "");
                  setIsAddModalOpen(true);
                }}
                className="bg-brand-accent text-brand-dark font-black px-5 py-3 rounded-2xl text-xs hover:bg-white transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Plus className="w-4 h-4" /> إضافة قسم أو فرع جديد
              </button>
            )}

            <Link
              to="/products"
              className="bg-white/10 hover:bg-white/20 text-white font-black px-5 py-3 rounded-2xl text-xs transition border border-white/20 flex items-center gap-2"
            >
              استعراض المنتجات <ArrowRight className="w-4 h-4 rotate-180" />
            </Link>
          </div>
        </div>

        {/* Breadcrumb Navigation Bar */}
        <div className="bg-card border border-brand-dark/10 p-4 rounded-2xl shadow-xs flex items-center justify-between flex-wrap gap-3 text-xs">
          <div className="flex items-center gap-2 flex-wrap font-bold text-brand-dark">
            <button
              onClick={() => setSelectedCatId(null)}
              className={`hover:text-brand-primary flex items-center gap-1 transition ${!selectedCatId ? "text-brand-primary font-black" : "text-muted-foreground"}`}
            >
              <Layers className="w-4 h-4" />
              جميع الأقسام الرئيسية
            </button>

            {breadcrumbs.map((crumb) => (
              <div key={crumb.id} className="flex items-center gap-2">
                <ChevronLeft className="w-3.5 h-3.5 text-muted-foreground" />
                <button
                  onClick={() => setSelectedCatId(crumb.id)}
                  className={`hover:text-brand-primary transition ${crumb.id === selectedCatId ? "text-brand-primary font-black bg-secondary/80 px-2.5 py-1 rounded-xl" : "text-muted-foreground"}`}
                >
                  {crumb.name}
                </button>
              </div>
            ))}
          </div>

          {selectedCatId && (
            <button
              onClick={() => setSelectedCatId(null)}
              className="text-xs text-rose-600 hover:underline font-bold flex items-center gap-1 cursor-pointer"
            >
              <X className="w-3.5 h-3.5" /> العودة للأقسام الرئيسية
            </button>
          )}
        </div>

        {/* Current Active Category Title & Options */}
        {currentCategory && (
          <div className="bg-secondary/40 border border-brand-primary/20 p-6 rounded-3xl flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-brand-primary text-white grid place-items-center shadow-md">
                {(() => {
                  const IconComp = getCategoryIcon(currentCategory.icon || currentCategory.name);
                  return <IconComp className="w-6 h-6" />;
                })()}
              </div>
              <div>
                <span className="text-[10px] font-black text-brand-primary uppercase tracking-wider block">
                  القسم المحدد حالياً
                </span>
                <h2 className="text-xl font-black text-brand-dark">{currentCategory.name}</h2>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                to="/products"
                search={{ category: currentCategory.name }}
                className="bg-brand-primary text-white font-black px-4 py-2.5 rounded-xl text-xs hover:bg-brand-dark transition shadow-xs flex items-center gap-1.5"
              >
                <Package className="w-4 h-4" /> عرض منتجات هذا القسم
              </Link>
            </div>
          </div>
        )}

        {/* Subcategories Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-base md:text-lg text-brand-dark flex items-center gap-2">
              <Folder className="w-5 h-5 text-brand-primary" />
              {selectedCatId
                ? `التصنيفات الفرعية المندرجة تحت "${currentCategory?.name}" (${activeSubcategories.length})`
                : `الأقسام الرئيسية المتوفرة بالمتجر (${activeSubcategories.length})`}
            </h3>

            {selectedCatId && activeSubcategories.length === 0 && (
              <span className="text-xs text-muted-foreground font-medium">
                لا توجد أفرع إضافية داخل هذا القسم. يمكنك استعراض المنتجات المباشرة بالأسفل.
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {activeSubcategories.map((cat) => {
              const IconComponent = getCategoryIcon(cat.icon || cat.name);
              const isEditing = editingCatId === cat.id;

              return (
                <div
                  key={cat.id}
                  className="bg-card border border-brand-dark/10 hover:border-brand-primary/50 transition p-5 rounded-3xl shadow-xs hover:shadow-md flex flex-col justify-between gap-4 group"
                >
                  {isEditing ? (
                    <div className="space-y-3 text-xs">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full bg-white border border-brand-dark/20 rounded-xl px-3 py-2 outline-none font-bold"
                        placeholder="اسم القسم"
                      />
                      <div>
                        <label className="text-[10px] font-bold text-muted-foreground block mb-1">
                          القسم الأب (التسلسل الهرمي):
                        </label>
                        <select
                          value={editParentId}
                          onChange={(e) => setEditParentId(e.target.value)}
                          className="w-full bg-white border border-brand-dark/20 rounded-xl px-2.5 py-1.5 outline-none font-medium"
                        >
                          <option value="">-- قسم رئيسي علوي --</option>
                          {categories
                            .filter((c) => c.id !== cat.id)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                        </select>
                      </div>

                      <div className="flex items-center gap-2 pt-1">
                        <button
                          onClick={() => handleSaveEdit(cat.id)}
                          className="flex-1 bg-emerald-600 text-white py-1.5 rounded-xl font-black text-xs hover:bg-emerald-700"
                        >
                          حفظ
                        </button>
                        <button
                          onClick={() => setEditingCatId(null)}
                          className="bg-secondary text-brand-dark px-3 py-1.5 rounded-xl font-bold"
                        >
                          إلغاء
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between gap-3">
                        <div
                          onClick={() => {
                            if (
                              cat.id === "cat-women" ||
                              cat.slug === "women" ||
                              cat.name.includes("نساء")
                            ) {
                              navigate({ to: "/women" });
                            } else {
                              setSelectedCatId(cat.id);
                            }
                          }}
                          className="flex items-center gap-3 cursor-pointer flex-1"
                        >
                          <div className="w-10 h-10 rounded-2xl bg-secondary group-hover:bg-brand-primary group-hover:text-white transition grid place-items-center text-brand-primary font-black shrink-0">
                            <IconComponent className="w-5 h-5" />
                          </div>
                          <div>
                            <h4 className="font-black text-sm text-brand-dark group-hover:text-brand-primary transition">
                              {cat.name}
                            </h4>
                            <span className="text-[10px] text-muted-foreground font-semibold block">
                              {cat.id === "cat-women" ||
                              cat.slug === "women" ||
                              cat.name.includes("نساء")
                                ? "قسم النساء الخصوصي"
                                : categories.filter((sub) => sub.parentId === cat.id).length > 0
                                  ? `${categories.filter((sub) => sub.parentId === cat.id).length} تصنيفات فرعية`
                                  : "قسم فرعي"}
                            </span>
                          </div>
                        </div>

                        {isAdmin && (
                          <div className="flex items-center gap-1 opacity-80 group-hover:opacity-100 transition">
                            <button
                              onClick={() => {
                                setEditingCatId(cat.id);
                                setEditName(cat.name);
                                setEditParentId(cat.parentId || "");
                                setEditIcon(cat.icon || "Shirt");
                              }}
                              className="p-1.5 text-brand-primary hover:bg-secondary rounded-lg"
                              title="تعديل"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDelete(cat)}
                              className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                              title="حذف"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </div>

                      <div className="flex items-center justify-between border-t border-brand-dark/5 pt-3">
                        <button
                          onClick={() => {
                            if (
                              cat.id === "cat-women" ||
                              cat.slug === "women" ||
                              cat.name.includes("نساء")
                            ) {
                              navigate({ to: "/women" });
                            } else {
                              setSelectedCatId(cat.id);
                            }
                          }}
                          className="text-xs font-bold text-brand-primary hover:underline flex items-center gap-1 cursor-pointer"
                        >
                          استعراض الأفرع <ChevronLeft className="w-3.5 h-3.5" />
                        </button>

                        <Link
                          to="/products"
                          search={{ category: cat.name }}
                          className="text-[11px] font-bold text-muted-foreground hover:text-brand-dark transition flex items-center gap-1"
                        >
                          المنتجات <ArrowRight className="w-3 h-3 rotate-180" />
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Modal: Add Category / Subcategory */}
        {isAddModalOpen && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs z-50 grid place-items-center p-4">
            <div className="bg-card border border-brand-dark/15 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in fade-in zoom-in duration-150">
              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                <h3 className="font-black text-lg text-brand-dark flex items-center gap-2">
                  <FolderPlus className="w-5 h-5 text-brand-primary" />
                  إضافة قسم جديد
                </h3>
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="p-1 rounded-full text-muted-foreground hover:bg-secondary cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleAddCategory} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-brand-dark block mb-1.5">
                    اسم القسم الجديد *
                  </label>
                  <input
                    type="text"
                    required
                    value={newCatName}
                    onChange={(e) => setNewCatName(e.target.value)}
                    placeholder="مثال: فساتين سهرة، أحذية نسائية، ملابس رجالي..."
                    className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-3 outline-none focus:border-brand-primary font-bold text-sm"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1.5">
                    يتبع لقسم (أين تريد إضافة هذا القسم؟)
                  </label>
                  <select
                    value={newCatParentId}
                    onChange={(e) => setNewCatParentId(e.target.value)}
                    className="w-full bg-white border border-brand-dark/20 rounded-2xl px-4 py-3 outline-none font-bold"
                  >
                    <option value="">-- قسم رئيسي مستقل --</option>
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.parentId ? `└─ ${c.name}` : `📁 ${c.name}`}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1.5">
                    اختر أيقونة القسم التوضيحية
                  </label>
                  <div className="grid grid-cols-6 sm:grid-cols-8 gap-2 p-3 bg-secondary/50 rounded-2xl max-h-40 overflow-y-auto">
                    {Object.keys(ALL_CATEGORY_ICONS).map((iconKey) => {
                      const IconComp = ALL_CATEGORY_ICONS[iconKey];
                      const isSel = newCatIcon === iconKey;
                      return (
                        <button
                          key={iconKey}
                          type="button"
                          onClick={() => setNewCatIcon(iconKey)}
                          className={`p-2 rounded-xl grid place-items-center transition cursor-pointer ${
                            isSel
                              ? "bg-brand-primary text-white shadow-xs"
                              : "bg-white text-brand-dark hover:bg-brand-primary/20"
                          }`}
                          title={iconKey}
                        >
                          <IconComp className="w-5 h-5" />
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsAddModalOpen(false)}
                    className="px-5 py-3 rounded-2xl text-xs font-bold bg-secondary text-brand-dark hover:bg-secondary/80 cursor-pointer"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-2xl text-xs font-black bg-brand-primary text-white hover:bg-brand-dark transition shadow-md cursor-pointer"
                  >
                    + إضافة القسم للشبكة الهرمية
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
