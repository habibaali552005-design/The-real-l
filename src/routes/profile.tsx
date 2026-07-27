import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { EGYPT_GOVERNORATES } from "@/types";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import {
  User,
  Phone,
  MapPin,
  Camera,
  Store,
  ShieldCheck,
  CheckCircle2,
  Lock,
  ArrowRight,
  BookOpen,
} from "lucide-react";

export const Route = createFileRoute("/profile")({
  head: () => ({ meta: [{ title: "حسابي الشخصي — منصة بيتك" }] }),
  component: UserProfilePage,
});

export function UserProfilePage() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);

  // Profile Form State
  const [fullName, setFullName] = useState("");
  const [userGender, setUserGenderState] = useState<"male" | "female">(
    MarketplaceStore.getUserGender() === "male" ? "male" : "female",
  );
  const [showGenderWhyModal, setShowGenderWhyModal] = useState(false);
  const [phonePrimary, setPhonePrimary] = useState("");
  const [phoneSecondary, setPhoneSecondary] = useState("");
  const [governorate, setGovernorate] = useState(EGYPT_GOVERNORATES[1]); // القاهرة
  const [city, setCity] = useState("");
  const [detailedAddress, setDetailedAddress] = useState("");
  const [mapLocation, setMapLocation] = useState("");

  // Role status
  const [isSeller, setIsSeller] = useState(false);
  const [showTermsModal, setShowTermsModal] = useState(false);

  // Seller Terms Modal State
  const [terms, setTerms] = useState(() => MarketplaceStore.getSellerTerms());
  const [acceptedTermIds, setAcceptedTermIds] = useState<Record<string, boolean>>({});

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data }) => {
      const u = data.session?.user;
      if (!u) {
        navigate({ to: "/auth" });
        return;
      }
      setUser(u);

      // Load user metadata / profile
      const meta = u.user_metadata || {};
      setFullName(meta.full_name || meta.name || u.email?.split("@")[0] || "");
      if (meta.gender === "male" || meta.gender === "female") {
        setUserGenderState(meta.gender);
        MarketplaceStore.setUserGender(meta.gender);
      }
      setPhonePrimary(meta.phone_primary || meta.phone || "");
      setPhoneSecondary(meta.phone_secondary || "");
      setGovernorate(meta.governorate || EGYPT_GOVERNORATES[1]);
      setCity(meta.city || "");
      setDetailedAddress(meta.detailed_address || meta.address || "");
      setMapLocation(meta.map_location || "");

      // Check if user is a seller
      const sellers = MarketplaceStore.getSellers();
      const isSellerFound =
        meta.role === "seller" ||
        sellers.some((s) => s.email?.toLowerCase() === u.email?.toLowerCase());
      setIsSeller(isSellerFound);

      setLoading(false);
    });
  }, [navigate]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);

    try {
      const updatedMeta = {
        ...user.user_metadata,
        full_name: fullName,
        gender: userGender,
        phone_primary: phonePrimary,
        phone_secondary: phoneSecondary,
        governorate,
        city,
        detailed_address: detailedAddress,
        map_location: mapLocation,
      };

      const { error } = await supabase.auth.updateUser({
        data: updatedMeta,
      });

      if (error) throw error;

      // Save gender locally
      MarketplaceStore.setUserGender(userGender);

      // Update delivery governorate filter
      MarketplaceStore.setUserGovernorate(governorate);

      toast.success("تم حفظ وتحديث بيانات حسابك الشخصي بنجاح");
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : String(err);
      toast.error("حدث خطأ أثناء حفظ البيانات: " + errorMsg);
    } finally {
      setSaving(false);
    }
  };

  const handleBecomeSellerClick = () => {
    setTerms(MarketplaceStore.getSellerTerms());
    setAcceptedTermIds({});
    setShowTermsModal(true);
  };

  const handleConfirmBecomeSeller = async () => {
    // Verify all required terms are checked
    const allRequiredAccepted = terms
      .filter((t) => t.isRequired)
      .every((t) => acceptedTermIds[t.id]);

    if (!allRequiredAccepted) {
      toast.error("يرجى قراءة والموافقة على جميع شروط البيع الإلزامية أولاً.");
      return;
    }

    try {
      // 1. Update user metadata role to seller
      await supabase.auth.updateUser({
        data: {
          ...user.user_metadata,
          role: "seller",
        },
      });

      // 2. Add to MarketplaceStore sellers list
      const existingSellers = MarketplaceStore.getSellers();
      const newSellerId = `seller-${Date.now()}`;
      const newSeller = {
        id: newSellerId,
        storeName: fullName ? `متجر ${fullName}` : "متجري المستقل",
        ownerName: fullName || "بائع بيتك",
        email: user.email || "",
        phone: phonePrimary,
        status: "approved" as const,
        registeredAt: new Date().toLocaleDateString("ar-EG"),
        planId: "plan-trial",
        planExpiresAt: "غير محدد",
        warehouses: ["مخزن رئيسي"],
        permissions: ["manage_products", "manage_orders"],
        aiCredits: 100,
        sellerType: "merchant" as const,
      };

      MarketplaceStore.saveSellers([...existingSellers, newSeller]);
      MarketplaceStore.setSimulatedSellerId(newSellerId);
      MarketplaceStore.setSimulationRole("seller");

      setIsSeller(true);
      setShowTermsModal(false);
      toast.success(
        "مبارك! تم تحويل حسابك بنجاح إلى حساب بائع معتمد. يمكنك الآن إضافة وتحديث منتجاتك",
      );
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      toast.error("فشل التحويل إلى حساب بائع: " + errorMsg);
    }
  };

  if (loading) {
    return (
      <PageShell>
        <div className="max-w-4xl mx-auto px-4 py-16 text-center text-sm text-muted-foreground">
          جاري تحميل بيانات الحساب الشخصي...
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-8" dir="rtl">
        {/* Header Card */}
        <div className="bg-card border border-brand-dark/10 rounded-3xl p-6 md:p-8 shadow-sm flex flex-col sm:flex-row items-center gap-6">
          <div className="w-20 h-20 rounded-full bg-brand-dark text-brand-accent border-2 border-brand-accent grid place-items-center font-black text-2xl shadow-md shrink-0">
            {fullName ? fullName.slice(0, 2).toUpperCase() : <User className="w-8 h-8" />}
          </div>

          <div className="space-y-1.5 text-center sm:text-start flex-1">
            <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
              <h1 className="text-2xl font-black text-brand-dark">{fullName || "مستخدم بيتك"}</h1>
              {isSeller ? (
                <span className="bg-emerald-100 text-emerald-800 text-[11px] font-black px-3 py-1 rounded-full border border-emerald-300 flex items-center gap-1">
                  <Store className="w-3.5 h-3.5" />
                  حساب بائع معتمد
                </span>
              ) : (
                <span className="bg-secondary text-brand-dark/70 text-[11px] font-bold px-3 py-1 rounded-full border border-brand-dark/10">
                  حساب مشتري
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground" dir="ltr">
              {user?.email}
            </p>
            <p className="text-xs text-brand-dark/80">
              المحافظة المسجلة: <span className="font-bold text-brand-accent">{governorate}</span>
            </p>
          </div>

          {/* Action Button: Become Seller or Go to Seller Dashboard */}
          <div>
            {isSeller ? (
              <div className="flex flex-col gap-2">
                <button
                  onClick={() => navigate({ to: "/admin" })}
                  className="bg-brand-dark text-white font-bold px-5 py-3 rounded-2xl text-xs hover:bg-brand-primary transition shadow-md flex items-center gap-2 cursor-pointer"
                >
                  <Store className="w-4 h-4 text-brand-accent" />
                  لوحة إدارتك كبائع
                </button>
                <button
                  onClick={() => navigate({ to: "/seller-guide" })}
                  className="bg-secondary text-brand-dark font-bold px-5 py-2.5 rounded-2xl text-xs hover:bg-brand-dark/10 transition flex items-center justify-center gap-1.5 cursor-pointer border border-brand-dark/10"
                >
                  <BookOpen className="w-3.5 h-3.5 text-brand-primary" />
                  المركز التعليمي للبائعين
                </button>
              </div>
            ) : (
              <button
                onClick={handleBecomeSellerClick}
                className="bg-gradient-to-r from-amber-600 to-amber-700 text-white font-black px-6 py-3.5 rounded-2xl text-xs hover:brightness-110 transition shadow-lg flex items-center gap-2 cursor-pointer"
              >
                <Store className="w-4 h-4" />
                التحول إلى بائع
              </button>
            )}
          </div>
        </div>

        {/* User Navigation Tabs */}
        <ProfileSubTabs
          user={user}
          fullName={fullName}
          phonePrimary={phonePrimary}
          governorate={governorate}
        />

        {/* Profile Data Form */}
        <form
          onSubmit={handleSaveProfile}
          className="bg-card border border-brand-dark/10 rounded-3xl p-6 md:p-8 space-y-6 shadow-sm"
        >
          <div className="border-b border-brand-dark/10 pb-4">
            <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <User className="w-5 h-5 text-brand-primary" />
              البيانات الشخصية ورقم التواصل
            </h2>
            <p className="text-xs text-muted-foreground mt-0.5">
              احرص على إدخال أرقام هواتف وعنوان دقيق لتسليم ومتابعة الطلبات بشكل صحيح.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark block">الاسم بالكامل:</label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="أدخل اسمك كما بالهوية..."
                className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>

            {/* Gender Field */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-bold text-brand-dark block">
                  الجنس (مطلوب للوصول لقسم النساء):
                </label>
                <button
                  type="button"
                  onClick={() => setShowGenderWhyModal(true)}
                  className="text-[11px] text-brand-primary underline hover:text-brand-dark font-bold cursor-pointer"
                >
                  لماذا نطلب هذا؟
                </button>
              </div>
              <div className="flex items-center gap-6 bg-white border border-brand-dark/15 rounded-2xl px-4 py-3">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-dark">
                  <input
                    type="radio"
                    name="profileGender"
                    value="female"
                    checked={userGender === "female"}
                    onChange={() => setUserGenderState("female")}
                    className="w-4 h-4 accent-pink-600 cursor-pointer"
                  />
                  أنثى
                </label>
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-dark">
                  <input
                    type="radio"
                    name="profileGender"
                    value="male"
                    checked={userGender === "male"}
                    onChange={() => setUserGenderState("male")}
                    className="w-4 h-4 accent-brand-dark cursor-pointer"
                  />
                  ذكر 👨
                </label>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark block">رقم الهاتف الأساسي:</label>
              <input
                type="tel"
                required
                value={phonePrimary}
                onChange={(e) => setPhonePrimary(e.target.value)}
                placeholder="01012345678"
                dir="ltr"
                className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark block">
                رقم الهاتف الاحتياطي (اختياري):
              </label>
              <input
                type="tel"
                value={phoneSecondary}
                onChange={(e) => setPhoneSecondary(e.target.value)}
                placeholder="01212345678"
                dir="ltr"
                className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>
          </div>

          {/* Location & Address Section */}
          <div className="border-t border-brand-dark/10 pt-6 space-y-4">
            <h2 className="text-lg font-black text-brand-dark flex items-center gap-2">
              <MapPin className="w-5 h-5 text-brand-primary" />
              عنوان الشحن والموقع التفصيلي
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-dark block">المحافظة:</label>
                <select
                  value={governorate}
                  onChange={(e) => setGovernorate(e.target.value)}
                  className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20 cursor-pointer font-bold"
                >
                  {EGYPT_GOVERNORATES.filter((g) => g !== "جميع المحافظات").map((g) => (
                    <option key={g} value={g}>
                      {g}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-bold text-brand-dark block">المدينة / الحي:</label>
                <input
                  type="text"
                  required
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  placeholder="مثال: نصر سيتي، المعادي، سموحة..."
                  className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark block">
                العنوان التفصيلي (اسم الشارع، رقم العمارة، الشقة):
              </label>
              <textarea
                rows={2}
                required
                value={detailedAddress}
                onChange={(e) => setDetailedAddress(e.target.value)}
                placeholder="أدخل العنوان الكامل ليتمكن مندوب الشحن من الوصول إليك بسلاسة..."
                className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl p-4 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-brand-dark block">
                رابط أو إحداثيات الموقع على الخريطة (GPS):
              </label>
              <input
                type="text"
                value={mapLocation}
                onChange={(e) => setMapLocation(e.target.value)}
                placeholder="مثال: https://maps.google.com/?q=30.0444,31.2357 أو الإحداثيات المباشرة"
                dir="ltr"
                className="w-full text-xs bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-brand-dark/10 flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="bg-brand-dark hover:bg-brand-primary text-white font-black px-8 py-3.5 rounded-2xl text-xs shadow-lg transition cursor-pointer disabled:opacity-60 flex items-center gap-2"
            >
              {saving ? "جاري الحفظ..." : "حفظ بيانات الحساب والعنوان"}
            </button>
          </div>
        </form>

        {/* BECOME A SELLER TERMS & CONDITIONS MODAL */}
        {showTermsModal && (
          <div className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
            <div className="bg-card w-full max-w-2xl rounded-3xl p-6 md:p-8 border border-brand-dark/10 shadow-2xl space-y-6 max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 grid place-items-center font-bold">
                    <ShieldCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-black text-lg text-brand-dark">
                      شروط وأحكام البيع لمنصة بيتك 📝
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      يُرجى قراءة وتأكيد الموافقة على جميع الشروط التالية للتحول الفوري إلى حساب
                      بائع.
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="w-8 h-8 rounded-full bg-secondary text-brand-dark font-black text-sm grid place-items-center hover:bg-brand-dark/10 cursor-pointer"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {terms.map((term, index) => {
                  const checked = !!acceptedTermIds[term.id];
                  return (
                    <div
                      key={term.id}
                      className={`p-4 rounded-2xl border transition ${
                        checked
                          ? "bg-amber-50/60 border-amber-300"
                          : "bg-white border-brand-dark/10"
                      }`}
                    >
                      <label className="flex items-start gap-3 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={(e) =>
                            setAcceptedTermIds((prev) => ({
                              ...prev,
                              [term.id]: e.target.checked,
                            }))
                          }
                          className="w-5 h-5 mt-0.5 accent-amber-600 cursor-pointer shrink-0"
                        />
                        <div className="space-y-1">
                          <h4 className="text-xs font-black text-brand-dark flex items-center gap-1.5">
                            <span className="text-amber-700">الشكل {index + 1}:</span>
                            {term.title}
                            {term.isRequired && (
                              <span className="text-[10px] text-rose-600 font-bold bg-rose-50 px-2 py-0.5 rounded-full">
                                إلزامي
                              </span>
                            )}
                          </h4>
                          <p className="text-xs text-muted-foreground leading-relaxed">
                            {term.content}
                          </p>
                        </div>
                      </label>
                    </div>
                  );
                })}
              </div>

              <div className="pt-4 border-t border-brand-dark/10 flex flex-col sm:flex-row gap-3">
                <button
                  onClick={handleConfirmBecomeSeller}
                  className="flex-1 bg-amber-600 hover:bg-amber-700 text-white font-black py-3.5 rounded-2xl shadow-lg transition cursor-pointer text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  أوافق على كافة الشروط والتحول إلى بائع الآن
                </button>
                <button
                  onClick={() => setShowTermsModal(false)}
                  className="px-6 py-3.5 rounded-2xl border border-brand-dark/10 font-bold text-xs hover:bg-secondary transition cursor-pointer text-brand-dark"
                >
                  إلغاء
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}

function ProfileSubTabs({
  user,
  fullName,
  phonePrimary,
  governorate,
}: {
  user: unknown;
  fullName: string;
  phonePrimary: string;
  governorate: string;
}) {
  const [activeTab, setActiveTab] = useState<
    "orders" | "favorites" | "recently_viewed" | "search_history"
  >("orders");
  type OrderItemType = {
    id: string;
    orderNumber: string;
    createdAt: string;
    status: string;
    items: Array<{ id: string; name: string; quantity: number; price: number; image_url?: string }>;
    statusHistory?: Array<{ timestamp: string; note: string }>;
  };

  const [orders, setOrders] = useState<OrderItemType[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<string[]>([]);
  const [searchHistory, setSearchHistory] = useState<
    Array<{ id: string; query: string; timestamp: string }>
  >([]);

  const loadData = () => {
    setOrders(MarketplaceStore.getOrders());
    setFavorites(MarketplaceStore.getFavorites());
    setRecentlyViewed(MarketplaceStore.getRecentlyViewed());
    setSearchHistory(MarketplaceStore.getSearchHistory());
  };

  useEffect(() => {
    loadData();
    window.addEventListener("beitak-orders-updated", loadData);
    window.addEventListener("beitak-favorites-updated", loadData);
    window.addEventListener("beitak-recently-viewed-updated", loadData);
    window.addEventListener("beitak-search-history-updated", loadData);
    return () => {
      window.removeEventListener("beitak-orders-updated", loadData);
      window.removeEventListener("beitak-favorites-updated", loadData);
      window.removeEventListener("beitak-recently-viewed-updated", loadData);
      window.removeEventListener("beitak-search-history-updated", loadData);
    };
  }, []);

  return (
    <div className="bg-card border border-brand-dark/10 rounded-3xl p-6 space-y-6 shadow-xs">
      {/* Tab Buttons */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-brand-dark/10 text-xs font-bold">
        <button
          onClick={() => setActiveTab("orders")}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
            activeTab === "orders"
              ? "bg-brand-primary text-white font-black shadow-xs"
              : "bg-secondary/60 hover:bg-secondary text-brand-dark"
          }`}
        >
          📦 طلباتي وتتبع الشحنات ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("favorites")}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
            activeTab === "favorites"
              ? "bg-brand-primary text-white font-black shadow-xs"
              : "bg-secondary/60 hover:bg-secondary text-brand-dark"
          }`}
        >
          ❤️ المنتجات المفضلة ({favorites.length})
        </button>
        <button
          onClick={() => setActiveTab("recently_viewed")}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
            activeTab === "recently_viewed"
              ? "bg-brand-primary text-white font-black shadow-xs"
              : "bg-secondary/60 hover:bg-secondary text-brand-dark"
          }`}
        >
          👁️ المشاهدة مؤخراً ({recentlyViewed.length})
        </button>
        <button
          onClick={() => setActiveTab("search_history")}
          className={`px-4 py-2.5 rounded-2xl transition cursor-pointer shrink-0 ${
            activeTab === "search_history"
              ? "bg-brand-primary text-white font-black shadow-xs"
              : "bg-secondary/60 hover:bg-secondary text-brand-dark"
          }`}
        >
          🔍 سجل البحث ({searchHistory.length})
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === "orders" && (
        <div className="space-y-4">
          <h3 className="font-black text-sm text-brand-dark">
            سجل جميع الطلبات وتتبع مراحل الشحن المعاين
          </h3>
          {orders.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center font-bold">
              لم تقم بإجراء أي طلبات حتى الآن.
            </p>
          ) : (
            orders.map((ord) => (
              <div
                key={ord.id}
                className="bg-secondary/30 border border-brand-dark/10 p-5 rounded-2xl space-y-3"
              >
                <div className="flex items-center justify-between flex-wrap gap-2 text-xs border-b border-brand-dark/5 pb-2">
                  <div>
                    <span className="font-black text-brand-primary">{ord.orderNumber}</span>
                    <span className="text-muted-foreground me-2 me-2"> • {ord.createdAt}</span>
                  </div>
                  <span className="bg-emerald-100 text-emerald-900 px-3 py-1 rounded-full text-[11px] font-black">
                    الحالة: {ord.status === "shipped" ? "جاري الشحن والتوصيل 🚚" : ord.status}
                  </span>
                </div>

                <div className="space-y-2 text-xs font-medium">
                  {ord.items.map((it) => (
                    <div key={it.id} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {it.image_url && (
                          <img
                            src={it.image_url}
                            alt=""
                            className="w-10 h-10 object-cover rounded-lg"
                          />
                        )}
                        <span>
                          {it.name} (الكمية: {it.quantity})
                        </span>
                      </div>
                      <span className="font-black text-brand-dark">
                        {it.price.toLocaleString()} ج.م
                      </span>
                    </div>
                  ))}
                </div>

                {/* Timeline status history */}
                {ord.statusHistory && (
                  <div className="pt-2 border-t border-brand-dark/5 text-[11px] space-y-1">
                    <span className="font-black text-brand-dark block">
                      جدول التتبع الزمني للطلب:
                    </span>
                    {ord.statusHistory.map((h, idx: number) => (
                      <div
                        key={idx}
                        className="flex items-center gap-2 text-muted-foreground font-semibold"
                      >
                        <span className="w-2 h-2 rounded-full bg-brand-primary" />
                        <span>
                          [{h.timestamp}] - {h.note}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {activeTab === "favorites" && (
        <div className="space-y-3">
          <h3 className="font-black text-sm text-brand-dark">
            عناصرك المفضلة ({favorites.length})
          </h3>
          {favorites.length === 0 ? (
            <p className="text-xs text-muted-foreground py-8 text-center font-bold">
              قائمة المفضلة فارغة حالياً.
            </p>
          ) : (
            <p className="text-xs font-bold text-emerald-700">
              لديك {favorites.length} منتج في قائمة المفضلة الخاصة بك.
            </p>
          )}
        </div>
      )}

      {activeTab === "recently_viewed" && (
        <div className="space-y-3">
          <h3 className="font-black text-sm text-brand-dark font-black">
            المنتجات المشاهدة مؤخراً
          </h3>
          <p className="text-xs text-muted-foreground font-bold">
            تم تسجيل {recentlyViewed.length} منتج شاهدته في هذه الجلسة.
          </p>
        </div>
      )}

      {activeTab === "search_history" && (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="font-black text-sm text-brand-dark">كلمات البحث الأخيرة</h3>
            {searchHistory.length > 0 && (
              <button
                onClick={() => {
                  MarketplaceStore.clearSearchHistory();
                  setSearchHistory([]);
                }}
                className="text-[11px] text-rose-600 font-bold hover:underline"
              >
                مسح سجل البحث
              </button>
            )}
          </div>
          {searchHistory.map((sh) => (
            <div
              key={sh.id}
              className="p-2.5 bg-secondary/40 rounded-xl text-xs font-bold text-brand-dark flex items-center justify-between"
            >
              <span>{sh.query}</span>
              <span className="text-[10px] text-muted-foreground">{sh.timestamp}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
