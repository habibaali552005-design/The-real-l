import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { Search, Trash2, Clock, ArrowRight, Sparkles } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/search-history")({
  component: SearchHistoryPage,
});

export function SearchHistoryPage() {
  const [history, setHistory] = useState<Array<{ id: string; query: string; timestamp: string }>>(
    [],
  );

  const loadData = () => {
    setHistory(MarketplaceStore.getSearchHistory());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("beitak-search-history-updated", loadData);
    window.addEventListener("storage", loadData);
    return () => {
      window.removeEventListener("beitak-search-history-updated", loadData);
      window.removeEventListener("storage", loadData);
    };
  }, []);

  const handleDeleteItem = (id: string) => {
    MarketplaceStore.deleteSearchQuery(id);
    toast.success("تم حذف العنصر من سجل البحث");
  };

  const handleClearAll = () => {
    MarketplaceStore.clearSearchHistory();
    toast.success("تم مسح سجل البحث كاملاً بنجاح");
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Banner */}
        <div className="bg-card border border-brand-dark/10 p-6 md:p-8 rounded-3xl shadow-sm flex items-center justify-between flex-wrap gap-4">
          <div className="space-y-1">
            <span className="inline-flex items-center gap-1 bg-secondary text-brand-primary px-3 py-1 rounded-full text-xs font-black">
              <Clock className="w-3.5 h-3.5" /> سجل النشاط والبحث
            </span>
            <h1 className="text-xl md:text-2xl font-black text-brand-dark">
              سجل عمليات البحث الخاصة بك
            </h1>
            <p className="text-xs text-muted-foreground">
              يمكنك استعراض الكلمات والأصناف التي بحثت عنها سابقاً، مع إمكانية إعادة البحث بنقرة
              واحدة أو مسح السجل.
            </p>
          </div>

          {history.length > 0 && (
            <button
              onClick={handleClearAll}
              className="bg-rose-50 text-rose-600 border border-rose-200 hover:bg-rose-600 hover:text-white font-black px-4 py-2.5 rounded-2xl text-xs transition flex items-center gap-1.5 cursor-pointer"
            >
              <Trash2 className="w-4 h-4" /> مسح كل السجل
            </button>
          )}
        </div>

        {/* History List */}
        <div className="space-y-3">
          {history.length === 0 ? (
            <div className="bg-card border border-brand-dark/10 p-12 text-center rounded-3xl space-y-3">
              <Search className="w-12 h-12 text-muted-foreground/30 mx-auto" />
              <p className="text-sm font-bold text-muted-foreground">
                سجل البحث فارغ تماماً حالياً
              </p>
              <Link
                to="/products"
                className="inline-block text-xs font-black text-brand-primary hover:underline"
              >
                تصفح المنتجات وابدأ بالبحث الان →
              </Link>
            </div>
          ) : (
            history.map((item) => (
              <div
                key={item.id}
                className="bg-card border border-brand-dark/10 hover:border-brand-primary/40 p-4 rounded-2xl flex items-center justify-between gap-3 shadow-2xs transition group"
              >
                <Link
                  to="/products"
                  search={{ search: item.query }}
                  className="flex items-center gap-3 flex-1 text-brand-dark font-black text-sm hover:text-brand-primary"
                >
                  <div className="w-9 h-9 rounded-xl bg-secondary grid place-items-center text-brand-primary">
                    <Search className="w-4 h-4" />
                  </div>
                  <span>{item.query}</span>
                </Link>

                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-bold text-muted-foreground">
                    {item.timestamp}
                  </span>
                  <button
                    onClick={() => handleDeleteItem(item.id)}
                    className="p-1.5 text-muted-foreground hover:text-rose-600 hover:bg-rose-50 rounded-lg transition"
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </PageShell>
  );
}
