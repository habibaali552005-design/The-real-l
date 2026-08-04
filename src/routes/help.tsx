import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect, useMemo } from "react";
import { MarketplaceStore, HelpArticle } from "@/lib/marketplaceStore";
import { useIsAdmin } from "@/lib/useIsAdmin";
import {
  HelpCircle,
  Search,
  BookOpen,
  ChevronDown,
  ChevronUp,
  Plus,
  Trash2,
  Edit2,
  Check,
  Truck,
  ShieldCheck,
  RefreshCw,
  Store,
  MessageCircle,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/help")({
  component: HelpCenterPage,
});

export function HelpCenterPage() {
  const { isAdmin } = useIsAdmin();
  const canEdit = isAdmin;
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("الكل");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  // Admin CMS Form Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState("الشحن والتوصيل");
  const [content, setContent] = useState("");

  const loadData = () => {
    setArticles(MarketplaceStore.getHelpArticles());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("beitak-help-updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("beitak-help-updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const categories = [
    "الكل",
    "الشحن والتوصيل",
    "الإرجاع والاستبدال",
    "الحساب والأمان",
    "دليل التجار",
  ];

  const filteredArticles = useMemo(() => {
    return articles.filter((art) => {
      if (!art.published && !canEdit) return false;
      const matchesCat = selectedCategory === "الكل" || art.category === selectedCategory;
      const matchesQuery =
        !searchQuery ||
        art.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        art.content.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCat && matchesQuery;
    });
  }, [articles, selectedCategory, searchQuery, canEdit]);

  const handleSaveArticle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    if (editingId) {
      const updated = articles.map((a) =>
        a.id === editingId ? { ...a, title, category, content } : a,
      );
      MarketplaceStore.saveHelpArticles(updated);
      toast.success("تم تحديث مقال مركز المساعدة بنجاح");
    } else {
      MarketplaceStore.addHelpArticle({
        title: title.trim(),
        category,
        content: content.trim(),
        published: true,
        order: articles.length + 1,
      });
      toast.success("تم نشر المقال الجديد بنجاح! ✨");
    }

    setIsModalOpen(false);
    setEditingId(null);
    setTitle("");
    setContent("");
  };

  const handleDelete = (id: string) => {
    MarketplaceStore.deleteHelpArticle(id);
    toast.success("تم الحذف بنجاح");
  };

  return (
    <PageShell>
      <div className="max-w-5xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Banner */}
        <div className="bg-gradient-to-br from-brand-dark via-slate-900 to-brand-primary text-white p-8 md:p-12 rounded-3xl shadow-2xl text-center space-y-4 relative overflow-hidden">
          <div className="inline-flex items-center gap-1.5 bg-brand-accent/20 border border-brand-accent/30 text-brand-accent px-4 py-1.5 rounded-full text-xs font-black">
            <HelpCircle className="w-4 h-4" /> مركز المساعدة والمقالات التعليمية
          </div>
          <h1 className="text-2xl md:text-4xl font-black">
            كيف يمكننا مساعدتك اليوم في متجر بيتك؟
          </h1>
          <p className="text-xs md:text-sm text-slate-300 max-w-2xl mx-auto leading-relaxed">
            ابحث عن إجابات سريعة بخصوص الشحن، معاينة المنتجات عند الاستلام، سياسات الإرجاع، وحسابات
            التجار.
          </p>

          {/* Search Bar */}
          <div className="max-w-xl mx-auto pt-2">
            <div className="relative">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="ابحث عن موضوع المساعدة (مثل: شحن، معاينة، إرجاع، بائع)..."
                className="w-full bg-white text-brand-dark font-bold text-xs md:text-sm rounded-2xl py-3.5 pr-11 pl-4 outline-none shadow-lg focus:ring-2 focus:ring-brand-accent"
              />
              <Search className="w-5 h-5 text-muted-foreground absolute right-3.5 top-3.5" />
            </div>
          </div>
        </div>

        {/* Categories Bar & Admin Action */}
        <div className="flex items-center justify-between flex-wrap gap-4 border-b border-brand-dark/10 pb-4">
          <div className="flex items-center gap-2 overflow-x-auto py-1 text-xs font-bold">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-2xl transition whitespace-nowrap cursor-pointer ${
                  selectedCategory === cat
                    ? "bg-brand-primary text-white font-black shadow-xs"
                    : "bg-card border border-brand-dark/10 text-brand-dark hover:bg-secondary"
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {canEdit && (
            <button
              onClick={() => {
                setEditingId(null);
                setTitle("");
                setContent("");
                setIsModalOpen(true);
              }}
              className="bg-brand-accent text-brand-dark font-black px-4 py-2.5 rounded-2xl text-xs hover:bg-white transition shadow-md flex items-center gap-1.5 cursor-pointer shrink-0"
            >
              <Plus className="w-4 h-4" /> نشر مقال جديد (السوبر أدمن)
            </button>
          )}
        </div>

        {/* Articles List */}
        <div className="space-y-4">
          {filteredArticles.length === 0 ? (
            <div className="bg-card border border-brand-dark/10 p-12 text-center rounded-3xl space-y-3">
              <BookOpen className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">
                لم نجد مقالات تطابق بحثك حالياً
              </p>
            </div>
          ) : (
            filteredArticles.map((art) => {
              const isExpanded = expandedId === art.id;
              return (
                <div
                  key={art.id}
                  className="bg-card border border-brand-dark/10 rounded-3xl overflow-hidden transition shadow-2xs hover:border-brand-primary/40"
                >
                  <div
                    onClick={() => setExpandedId(isExpanded ? null : art.id)}
                    className="p-5 flex items-center justify-between gap-4 cursor-pointer hover:bg-secondary/30 transition"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-secondary text-brand-primary font-black grid place-items-center shrink-0">
                        <BookOpen className="w-5 h-5" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-brand-primary uppercase">
                          {art.category}
                        </span>
                        <h3 className="font-black text-sm text-brand-dark">{art.title}</h3>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      {canEdit && (
                        <div
                          className="flex items-center gap-1"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => {
                              setEditingId(art.id);
                              setTitle(art.title);
                              setCategory(art.category);
                              setContent(art.content);
                              setIsModalOpen(true);
                            }}
                            className="p-1.5 text-brand-primary hover:bg-secondary rounded-lg"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(art.id)}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-5 h-5 text-brand-primary" />
                      ) : (
                        <ChevronDown className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="p-6 border-t border-brand-dark/10 bg-secondary/20 space-y-4 text-xs md:text-sm text-brand-dark leading-relaxed font-medium">
                      <p className="whitespace-pre-line">{art.content}</p>
                      <div className="text-[10px] text-muted-foreground pt-2 border-t border-brand-dark/5 flex items-center justify-between">
                        <span>آخر تحديث: {art.updatedAt}</span>
                        <span>المشاهدات: {art.views}</span>
                      </div>
                    </div>
                  )}
                </div>
              );
            })
          )}
        </div>

        {/* Modal CMS Form */}
        {isModalOpen && (
          <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs z-50 grid place-items-center p-4">
            <div className="bg-card border border-brand-dark/15 rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150">
              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                <h3 className="font-black text-base text-brand-dark">
                  {editingId ? "تعديل مقال المساعدة" : "إضافة مقال تعليمي جديد"}
                </h3>
                <button
                  onClick={() => setIsModalOpen(false)}
                  className="p-1 rounded-full text-muted-foreground hover:bg-secondary"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveArticle} className="space-y-4 text-xs">
                <div>
                  <label className="font-bold text-brand-dark block mb-1">عنوان المقال *</label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="عنوان المقال..."
                    className="w-full bg-white border border-brand-dark/20 rounded-2xl p-3 outline-none font-bold text-xs"
                  />
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">الفئة / التصنيف *</label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full bg-white border border-brand-dark/20 rounded-2xl p-3 outline-none font-bold text-xs"
                  >
                    <option value="الشحن والتوصيل">الشحن والتوصيل</option>
                    <option value="الإرجاع والاستبدال">الإرجاع والاستبدال</option>
                    <option value="الحساب والأمان">الحساب والأمان</option>
                    <option value="دليل التجار">دليل التجار</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-brand-dark block mb-1">
                    محتوى وتفاصيل المقال *
                  </label>
                  <textarea
                    rows={5}
                    required
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="اكتب شرح الموضوع هنا بوضوح..."
                    className="w-full bg-white border border-brand-dark/20 rounded-2xl p-3 outline-none font-medium text-xs resize-none"
                  />
                </div>

                <div className="flex items-center justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsModalOpen(false)}
                    className="px-4 py-2.5 rounded-2xl font-bold bg-secondary text-brand-dark hover:bg-secondary/80"
                  >
                    إلغاء
                  </button>
                  <button
                    type="submit"
                    className="px-6 py-2.5 rounded-2xl font-black bg-brand-primary text-white hover:bg-brand-dark transition shadow-md"
                  >
                    نشر المقال
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
