import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { toast } from "sonner";
import {
  BookOpen,
  PlusCircle,
  Palette,
  Truck,
  PackageCheck,
  HelpCircle,
  Store,
  Layers,
  MapPin,
  CheckCircle2,
  ArrowRight,
  ShieldCheck,
  Plus,
  Trash2,
  Video,
} from "lucide-react";

export const Route = createFileRoute("/seller-guide")({
  head: () => ({ meta: [{ title: "المركز التعليمي للبائعين — منصة بيتك" }] }),
  component: SellerGuidePage,
});

export function SellerGuidePage() {
  const navigate = useNavigate();
  const isAdmin = useIsAdmin();
  const [isSeller, setIsSeller] = useState(false);
  const [loading, setLoading] = useState(true);

  // Tutorials state
  const [tutorials, setTutorials] = useState(() => MarketplaceStore.getTutorials());
  const [showAddTutorialModal, setShowAddTutorialModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newCategory, setNewCategory] = useState("المنتجات والصور");
  const [newContent, setNewContent] = useState("");
  const [newVideoUrl, setNewVideoUrl] = useState("");

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        const meta = u.user_metadata || {};
        const sellers = MarketplaceStore.getSellers();
        const isSellerUser =
          meta.role === "seller" ||
          sellers.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase()) ||
          u.email?.toLowerCase() === "habibaali552005@gmail.com" ||
          isAdmin;
        setIsSeller(isSellerUser);
      }
      setLoading(false);
    });
  }, [isAdmin]);

  const handleSaveTutorials = (updated: typeof tutorials) => {
    setTutorials(updated);
    MarketplaceStore.saveTutorials(updated);
    toast.success("تم تحديث وحفظ الدروس التعليمية بنجاح");
  };

  const handleAddTutorial = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle || !newContent) return;

    const newTut = {
      id: `tut-${Date.now()}`,
      title: newTitle,
      category: newCategory,
      content: newContent,
      videoUrl: newVideoUrl.trim() || undefined,
      order: tutorials.length + 1,
    };

    const updated = [...tutorials, newTut];
    handleSaveTutorials(updated);
    setNewTitle("");
    setNewContent("");
    setNewVideoUrl("");
    setShowAddTutorialModal(false);
  };

  const handleDeleteTutorial = (id: string) => {
    const updated = tutorials.filter((t) => t.id !== id);
    handleSaveTutorials(updated);
  };

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          جاري التحميل...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Header Hero */}
        <div className="bg-gradient-to-r from-brand-dark to-stone-900 text-white rounded-3xl p-8 shadow-xl space-y-3 relative overflow-hidden">
          <div className="flex items-center gap-2 text-brand-accent text-xs font-bold uppercase tracking-wider">
            <BookOpen className="w-4 h-4" />
            أكاديمية ودليل بائعي منصة بيتك
          </div>
          <h1 className="text-2xl md:text-3xl font-black text-brand-bg">
            دليلك الشامل لنجاح متجرك المستقل
          </h1>
          <p className="text-xs md:text-sm text-brand-bg/80 max-w-2xl leading-relaxed">
            مرحباً بك في المركز التعليمي للبائعين. هنا تجد شرحاً تفصيلياً ومصوراً لكيفية إضافة
            منتجاتك، إدارة الألوان والمقاسات، ضبط الشحن للمحافظات، ومعالجة الطلبات.
          </p>
          <div className="pt-2 flex flex-wrap gap-3">
            <button
              onClick={() => navigate({ to: "/admin" })}
              className="bg-brand-accent text-brand-dark font-black px-5 py-2.5 rounded-2xl text-xs hover:brightness-110 transition shadow cursor-pointer flex items-center gap-1.5"
            >
              <Store className="w-4 h-4" />
              الانتقال إلى لوحة بائعك
            </button>

            {isAdmin && (
              <button
                onClick={() => setShowAddTutorialModal(true)}
                className="bg-white text-brand-dark font-black px-5 py-2.5 rounded-2xl text-xs hover:bg-amber-100 transition shadow cursor-pointer flex items-center gap-1.5"
              >
                <ShieldCheck className="w-4 h-4 text-emerald-700" />
                إضافة درس تعليمي جديد (السوبر أدمن)
              </button>
            )}
          </div>
        </div>

        {/* Dynamic CMS Tutorials Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {tutorials.map((tut, index) => (
            <div
              key={tut.id}
              className="bg-card border border-brand-dark/10 rounded-3xl p-6 space-y-3 shadow-sm hover:border-brand-accent/40 transition relative group"
            >
              {isAdmin && (
                <button
                  onClick={() => handleDeleteTutorial(tut.id)}
                  className="absolute top-4 left-4 p-2 bg-rose-50 text-rose-600 rounded-xl hover:bg-rose-100 transition text-xs font-bold cursor-pointer"
                  title="حذف الشرح"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}

              <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-800 grid place-items-center font-black text-xs">
                {index + 1}
              </div>
              <span className="inline-block bg-secondary text-brand-dark text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                {tut.category}
              </span>
              <h2 className="text-base font-black text-brand-dark">{tut.title}</h2>
              <p className="text-xs text-muted-foreground leading-relaxed">{tut.content}</p>

              {tut.videoUrl && (
                <div className="pt-2">
                  <a
                    href={tut.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-xs font-bold text-brand-primary hover:underline bg-brand-primary/10 px-3 py-1.5 rounded-xl"
                  >
                    <Video className="w-4 h-4" />
                    مشاهدة الفيديو الشارح بالكامل
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Super Admin Add Tutorial Modal */}
        {showAddTutorialModal && (
          <div
            className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            dir="rtl"
          >
            <div className="bg-card w-full max-w-lg rounded-3xl p-6 border border-brand-dark/10 shadow-2xl space-y-5">
              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-700" />
                  إضافة درس تعليمي جديد للمركز التعليمي
                </h3>
                <button
                  onClick={() => setShowAddTutorialModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary text-brand-dark font-black text-xs grid place-items-center hover:bg-brand-dark/10 cursor-pointer"
                >
                  ×
                </button>
              </div>

              <form onSubmit={handleAddTutorial} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">عنوان الشرح:</label>
                  <input
                    type="text"
                    required
                    value={newTitle}
                    onChange={(e) => setNewTitle(e.target.value)}
                    placeholder="مثال: كيفية ضبط تكلفة الشحن لكل محافظة..."
                    className="w-full text-xs bg-white border border-brand-dark/15 rounded-xl p-3 outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">التصنيف:</label>
                  <select
                    value={newCategory}
                    onChange={(e) => setNewCategory(e.target.value)}
                    className="w-full text-xs bg-white border border-brand-dark/15 rounded-xl p-3 outline-none font-bold"
                  >
                    <option value="المنتجات والصور">المنتجات والصور</option>
                    <option value="الألوان والمقاسات">الألوان والمقاسات</option>
                    <option value="الشحن والمحافظات">الشحن والمحافظات</option>
                    <option value="معالجة الطلبات والمالية">معالجة الطلبات والمالية</option>
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">
                    تفاصيل الشرح والخطوات:
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={newContent}
                    onChange={(e) => setNewContent(e.target.value)}
                    placeholder="اكتب تفاصيل الشرح والنصائح للبائع..."
                    className="w-full text-xs bg-white border border-brand-dark/15 rounded-xl p-3 outline-none focus:border-brand-primary"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-brand-dark">
                    رابط الفيديو الشارح (اختياري - YouTube):
                  </label>
                  <input
                    type="url"
                    value={newVideoUrl}
                    onChange={(e) => setNewVideoUrl(e.target.value)}
                    placeholder="https://youtube.com/watch?v=..."
                    className="w-full text-xs bg-white border border-brand-dark/15 rounded-xl p-3 outline-none focus:border-brand-primary"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand-dark text-white font-black py-3.5 rounded-2xl text-xs hover:bg-brand-primary transition shadow cursor-pointer"
                >
                  حفظ ونشر الدرس التعليمي
                </button>
              </form>
            </div>
          </div>
        )}

        {/* FAQs Section */}
        <div className="bg-card border border-brand-dark/10 rounded-3xl p-6 md:p-8 space-y-4 shadow-sm">
          <h2 className="text-lg font-black text-brand-dark flex items-center gap-2 border-b border-brand-dark/10 pb-3">
            <HelpCircle className="w-5 h-5 text-brand-primary" />
            الأسئلة الشائعة والتعليمات الهامة
          </h2>

          <div className="space-y-4">
            <div className="space-y-1">
              <h3 className="text-xs font-black text-brand-dark">
                س: هل يوجد مخزن للأنظمة المركزية في بيتك؟
              </h3>
              <p className="text-xs text-muted-foreground">
                ج: لا، تم إلغاء نظام المخازن المركزية تماماً. البائع مسلسول عن إرسال وشحن طلباته
                وتوفير مخزونه الخاص المباشر.
              </p>
            </div>

            <div className="space-y-1">
              <h3 className="text-xs font-black text-brand-dark">
                س: كيف أقوم بإضافة منتج خاص بقسم النساء فقط؟
              </h3>
              <p className="text-xs text-muted-foreground">
                ج: أثناء إضافة المنتج قم بتفعيل خيار "خاص بقسم النساء فقط"، ولن يظهر هذا المنتج في
                الرئيسية أو الأقسام العامة نهائياً بل يختص بالقسم المخصص فقط.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PageShell>
  );
}
