import React, { useState } from "react";
import {
  Sparkles,
  ShoppingBag,
  Building,
  UserCheck,
  Zap,
  HelpCircle,
  FileText,
  BadgeAlert,
  ArrowLeftRight,
} from "lucide-react";
import { MarketplaceStore, Seller, Visitor } from "@/lib/marketplaceStore";
import { safeRandomUUID } from "@/lib/safeId";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";

export function VisitorDashboard() {
  const [storeName, setStoreName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleRegister = (e: React.FormEvent) => {
    e.preventDefault();
    if (!storeName.trim() || !ownerName.trim()) {
      return toast.error("برجاء تعبئة كافة الحقول المطلوبة");
    }

    setSubmitting(true);

    setTimeout(() => {
      // Create new approved seller for immediate testing and use!
      const newSeller: Seller = {
        id: `seller-${safeRandomUUID()}`,
        storeName: storeName.trim(),
        ownerName: ownerName.trim(),
        email: email.trim() || "seller@example.com",
        phone: phone.trim() || "01000000000",
        status: "approved", // Approved immediately for a super smooth demo and real-world onboarding
        registeredAt: new Date().toISOString(),
        planId: "plan-trial",
        planExpiresAt: new Date(Date.now() + 86400000 * 30).toISOString(),
        warehouses: [],
        permissions: ["sell_products"],
      };

      const existingSellers = MarketplaceStore.getSellers();
      MarketplaceStore.saveSellers([...existingSellers, newSeller]);

      // Auto-select this newly registered seller for simulated dashboard use!
      MarketplaceStore.setSimulatedSellerId(newSeller.id);
      MarketplaceStore.setSimulationRole("seller");

      setStoreName("");
      setOwnerName("");
      setEmail("");
      setPhone("");
      setSubmitting(false);

      toast.success(
        "🎉 تم تفعيل واعتماد متجرك بنجاح! جاري تحويلك الآن للوحة تحكم التاجر للبدء بالبيع ورفع منتجاتك.",
      );

      // Reload page to apply new role and select active seller
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    }, 800);
  };

  return (
    <div className="bg-card rounded-3xl p-5 border border-brand-dark/5 space-y-6">
      {/* Intro visual banner */}
      <div className="bg-gradient-to-br from-brand-accent/20 via-brand-bg to-card border border-brand-accent/25 rounded-2xl p-6 text-center space-y-3">
        <Sparkles className="w-10 h-10 text-brand-accent animate-pulse mx-auto" />
        <h2 className="text-xl font-bold text-brand-dark">
          ابدأ البيع وحلّق بمتجرك بالذكاء الاصطناعي
        </h2>
        <p className="text-xs text-muted-foreground max-w-xl mx-auto leading-relaxed">
          انضم اليوم إلى منصة بيتك كبائع، واستخدم أدوات استوديو صور الذكاء الاصطناعي لإزالة الخلفيات
          وتوليد المشاهد والترقية التلقائية لمنتجاتك مجاناً.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Onboarding Form Form */}
        <form
          onSubmit={handleRegister}
          className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-5 space-y-4"
        >
          <div className="space-y-1">
            <h3 className="font-extrabold text-sm flex items-center gap-1.5 text-brand-dark">
              <Building className="w-4 h-4 text-brand-primary" /> نموذج تقديم طلب فتح متجر
              (Onboarding)
            </h3>
            <p className="text-[10px] text-muted-foreground">
              املأ البيانات التالية لإنشاء متجرك على المنصة وإرساله للمراجعة والاعتماد الفوري.
            </p>
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground block">
              اسم المتجر / العلامة التجارية:
            </label>
            <input
              required
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="مثال: موبيليات الشرق، ركن التصاميم الأنيقة..."
              className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>

          <div className="space-y-1">
            <label className="text-[10px] font-bold text-muted-foreground block">
              اسم مالك المتجر بالكامل:
            </label>
            <input
              required
              value={ownerName}
              onChange={(e) => setOwnerName(e.target.value)}
              placeholder="الاسم الثلاثي لمالك النشاط التجاري..."
              className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground block">
                البريد الإلكتروني:
              </label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="store@example.com"
                className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
            <div className="space-y-1">
              <label className="text-[10px] font-bold text-muted-foreground block">
                رقم الهاتف (واتساب):
              </label>
              <input
                type="tel"
                required
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01xxxxxxxxx"
                className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full bg-brand-dark text-brand-bg hover:bg-brand-primary disabled:opacity-50 py-3.5 rounded-xl text-xs font-extrabold transition shadow-sm cursor-pointer"
          >
            {submitting ? "جاري إرسال الطلب..." : "تقديم طلب فتح المتجر والبدء في البيع"}
          </button>
        </form>

        {/* Benefits text column */}
        <div className="space-y-4 p-2">
          <h3 className="font-bold text-sm text-brand-dark">
            مزايا حصرية لشركائنا بائعي الأثاث والديكور:
          </h3>

          <div className="space-y-3.5">
            {[
              {
                title: "استوديو صور الذكاء الاصطناعي الفوري",
                desc: "لا حاجة لمصورين محترفين! التقط صورة الأثاث بهاتفك واستخدم معالج الـ AI لعزلها وتركيبها في غرف معيشة راقية تلقائياً.",
                icon: Sparkles,
                color: "text-amber-500",
              },
              {
                title: "إدارة المخازن المتعددة والمستودعات والـ SKU",
                desc: "اربط منتجاتك بمخازن جغرافية متعددة وتحكم بالمتغيرات اللانهائية من مقاسات وألوان وخامات دون تداخل.",
                icon: ShoppingBag,
                color: "text-blue-500",
              },
              {
                title: "أفضل أنظمة العمولات وكوبونات الخصم",
                desc: "قواعد تسعير مرنة تمنحك هامش ربح عادل، مع أدوات متكاملة لإطلاق أكواد كوبونات الخصم لعملائك لرفع التفاعل والولاء.",
                icon: Zap,
                color: "text-purple-500",
              },
            ].map((ben, idx) => (
              <div key={idx} className="flex gap-3">
                <div className="w-9 h-9 rounded-xl bg-secondary flex items-center justify-center flex-shrink-0">
                  <ben.icon className={`w-5 h-5 ${ben.color}`} />
                </div>
                <div className="space-y-0.5">
                  <h4 className="font-extrabold text-xs text-brand-dark">{ben.title}</h4>
                  <p className="text-[10px] text-muted-foreground leading-relaxed">{ben.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
