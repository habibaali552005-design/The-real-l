import { Link, useLocation, useNavigate } from "@tanstack/react-router";
import {
  ShoppingCart,
  Search,
  Menu,
  X,
  User,
  LogOut,
  LayoutDashboard,
  MapPin,
  Store,
  BookOpen,
  Layers,
  ChevronDown,
  Sparkles,
  HelpCircle,
  MessageSquare,
  Settings,
  Bell,
  Flame,
  Tag,
} from "lucide-react";
import { NotificationCenterModal } from "@/components/NotificationCenterModal";
import { DirectMessagingModal } from "@/components/DirectMessagingModal";

import { useCart } from "@/lib/cart";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { useEffect, useState, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SbUser } from "@supabase/supabase-js";
import beitakLogo from "@/assets/beitak-logo.png";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { EGYPT_GOVERNORATES } from "@/types";
import { LiveEditAdminBar } from "./LiveEditSystem";
import { toast } from "sonner";

function useUser() {
  const [user, setUser] = useState<SbUser | null>(null);
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, s) => setUser(s?.user ?? null));
    return () => sub.subscription.unsubscribe();
  }, []);
  return user;
}

export function SiteHeader() {
  const { count } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const isAdmin = useIsAdmin();
  const user = useUser();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  // Notification and Direct Messaging modals state
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Categories Dropdown state
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);

  // Governorate Modal state
  const [govModalOpen, setGovModalOpen] = useState(false);
  const [selectedGov, setSelectedGov] = useState(() => MarketplaceStore.getUserGovernorate());

  const [themeConf, setThemeConf] = useState(() => MarketplaceStore.getDefaultThemeSettings());

  const updateNotifBadge = () => {
    const list = MarketplaceStore.getNotifications();
    setUnreadNotifCount(list.filter((n) => !n.read).length);
  };

  useEffect(() => {
    updateNotifBadge();
    window.addEventListener("beitak-notifications-updated", updateNotifBadge);
    window.addEventListener("storage", updateNotifBadge);
    return () => {
      window.removeEventListener("beitak-notifications-updated", updateNotifBadge);
      window.removeEventListener("storage", updateNotifBadge);
    };
  }, []);

  useEffect(() => {
    setThemeConf(MarketplaceStore.getSiteThemeSettings());
    const handleUpdate = () => {
      setThemeConf(MarketplaceStore.getSiteThemeSettings());
      setSelectedGov(MarketplaceStore.getUserGovernorate());
    };
    window.addEventListener("beitak-theme-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-theme-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  useEffect(() => {
    supabase
      .from("categories")
      .select("id, name")
      .order("sort_order")
      .then(({ data }) => {
        if (data && data.length > 0) {
          setCategories(data);
        } else {
          setCategories([
            { id: "c1", name: "غرف معيشة" },
            { id: "c2", name: "غرف نوم" },
            { id: "c3", name: "طاولات طعام" },
            { id: "c4", name: "ديكورات ومفروشات" },
            { id: "c5", name: "أجهزة كهربائية" },
            { id: "c6", name: "سيارات ومحركات" },
            { id: "c7", name: "عقارات وأراضٍ" },
          ]);
        }
      });
  }, []);

  const handleSelectGov = async (gov: string) => {
    setSelectedGov(gov);
    MarketplaceStore.setUserGovernorate(gov);

    // Save to user metadata if logged in
    if (user) {
      await supabase.auth.updateUser({
        data: { ...user.user_metadata, governorate: gov },
      });
    }

    window.dispatchEvent(new Event("storage"));
    setGovModalOpen(false);
    toast.success(`تم اختيار محافظة التسليم: ${gov}`);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    const term = q.trim();
    navigate({ to: "/products", search: term ? { q: term } : {} });
    setMenuOpen(false);
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setAcctOpen(false);
    navigate({ to: "/" });
  };

  const mainNavLinks = [
    { to: "/" as const, label: "الرئيسية" },
    { to: "/products" as const, label: "المنتجات" },
    { to: "/deals" as const, label: "التخفيضات" },
    { to: "/brand" as const, label: "الماركات" },
    { to: "/store" as const, label: "المتاجر" },
    { to: "/help" as const, label: "المساعدة" },
    { to: "/seller-guide" as const, label: "دليل البائعين" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md border-b border-brand-dark/10 shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-brand-dark text-brand-bg text-[11px] py-1.5 px-4 flex items-center justify-center text-center max-w-7xl mx-auto font-bold">
        <span className="truncate">
          {themeConf.headerAnnouncement || "شحن لكل محافظات مصر · ضمان جودة ونقاء تام على كل منتج"}
        </span>
      </div>

      <div
        className={`px-4 py-2.5 flex ${themeConf.headerStyle === "centered" ? "flex-col items-center justify-center text-center gap-2" : "items-center gap-3"} max-w-7xl mx-auto`}
      >
        <div
          className={`flex items-center gap-3 ${themeConf.headerStyle === "centered" ? "justify-center w-full" : ""}`}
        >
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="md:hidden w-9 h-9 grid place-items-center rounded-xl border border-brand-dark/10"
            aria-label="القائمة"
          >
            {menuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>

          <Link to="/" className="flex items-center gap-2 flex-shrink-0">
            <img src={beitakLogo} alt="بيتك" className="h-10 w-auto" width={40} height={40} />
            <span className="font-bold text-xl tracking-tight text-brand-dark sr-only">بيتك</span>
          </Link>
        </div>

        {/* Desktop Navigation Links */}
        <nav
          className={`hidden md:flex items-center gap-1 ${themeConf.headerStyle === "centered" ? "justify-center w-full mb-1" : "mr-2"}`}
        >
          {mainNavLinks.map((l) => {
            const active = pathname === l.to;
            return (
              <Link
                key={l.to}
                to={l.to}
                className={`px-3 py-1.5 rounded-xl text-xs font-black transition ${
                  active
                    ? "text-brand-primary bg-brand-primary/10"
                    : "text-brand-dark/80 hover:text-brand-dark hover:bg-secondary"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
        </nav>

        {/* Search Bar */}
        <form
          onSubmit={submit}
          className={`flex-1 relative max-w-xl mx-auto ${themeConf.headerStyle === "centered" ? "w-full" : ""}`}
        >
          <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
          <input
            type="search"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="ابحث بالاسم، القسم، البائع، أو المحافظة..."
            className="w-full bg-white border border-brand-dark/15 rounded-full pr-10 pl-4 py-2 text-xs outline-none focus:border-brand-accent focus:ring-2 focus:ring-brand-accent/20"
            aria-label="ابحث في المنتجات"
          />
        </form>

        {/* Dedicated Governorate Button for Header */}
        <button
          onClick={() => setGovModalOpen(true)}
          className="hidden lg:flex items-center gap-1.5 bg-secondary text-brand-dark px-3 py-2 rounded-xl text-xs font-bold border border-brand-dark/10 hover:bg-brand-dark/10 transition cursor-pointer"
        >
          <MapPin className="w-3.5 h-3.5 text-brand-primary" />
          <span>المحافظة: {selectedGov}</span>
        </button>

        {/* Account Menu */}
        <div className="relative">
          <button
            onClick={() => setAcctOpen((v) => !v)}
            className="w-10 h-10 rounded-full border border-brand-dark/10 grid place-items-center hover:bg-secondary transition cursor-pointer"
            aria-label="الحساب"
          >
            <User className="w-4.5 h-4.5 text-brand-dark" />
          </button>
          {acctOpen && (
            <>
              <div className="fixed inset-0 z-40" onClick={() => setAcctOpen(false)} aria-hidden />
              <div className="absolute left-0 mt-2 w-60 bg-card rounded-2xl border border-brand-dark/10 shadow-xl overflow-hidden z-50 text-xs">
                {user ? (
                  <>
                    <div className="px-4 py-3 border-b border-brand-dark/5 bg-secondary/50">
                      <p className="text-[10px] text-muted-foreground font-bold">تسجيل الدخول كـ</p>
                      <p className="text-xs font-black text-brand-dark truncate" dir="ltr">
                        {user.email}
                      </p>
                    </div>

                    <Link
                      to="/profile"
                      onClick={() => setAcctOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-brand-dark"
                    >
                      <User className="w-4 h-4 text-brand-primary" /> حسابي الشخصي والإعدادات
                    </Link>

                    <Link
                      to="/seller-guide"
                      onClick={() => setAcctOpen(false)}
                      className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-brand-dark"
                    >
                      <BookOpen className="w-4 h-4 text-amber-600" /> المركز التعليمي للبائعين
                    </Link>

                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setAcctOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-emerald-700 bg-emerald-50/50"
                      >
                        <LayoutDashboard className="w-4 h-4" /> لوحة إدارتك
                      </Link>
                    )}

                    <button
                      onClick={logout}
                      className="w-full flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-destructive border-t border-brand-dark/5 cursor-pointer"
                    >
                      <LogOut className="w-4 h-4" /> تسجيل الخروج
                    </button>
                  </>
                ) : (
                  <>
                    <Link
                      to="/auth"
                      onClick={() => setAcctOpen(false)}
                      className="block px-4 py-3 font-black hover:bg-secondary text-brand-dark"
                    >
                      تسجيل الدخول
                    </Link>
                    <Link
                      to="/auth"
                      search={{ mode: "signup" }}
                      onClick={() => setAcctOpen(false)}
                      className="block px-4 py-3 hover:bg-secondary border-t border-brand-dark/5 text-brand-dark font-bold"
                    >
                      إنشاء حساب جديد
                    </Link>
                  </>
                )}
              </div>
            </>
          )}
        </div>

        {/* Cart Link */}
        <Link
          to="/cart"
          className="w-10 h-10 rounded-full bg-brand-primary text-white grid place-items-center relative flex-shrink-0 hover:bg-brand-dark transition shadow-2xs"
          aria-label="السلة"
        >
          <ShoppingCart className="w-4.5 h-4.5" />
          {count > 0 && (
            <span className="absolute -top-1 -left-1 bg-brand-accent text-brand-dark text-[10px] font-black w-5 h-5 rounded-full flex items-center justify-center border-2 border-brand-bg shadow-sm">
              {count}
            </span>
          )}
        </Link>
      </div>

      {/* Notification Modal */}
      <NotificationCenterModal isOpen={notifModalOpen} onClose={() => setNotifModalOpen(false)} />

      {/* Direct Messaging Modal */}
      <DirectMessagingModal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} />

      {/* Dedicated Site Content Navigation Bar */}
      <div className="bg-brand-dark/95 text-white py-2 px-4 border-t border-brand-dark/10 shadow-inner">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2 overflow-x-auto no-scrollbar scroll-smooth text-xs">
          <div className="flex items-center gap-2 shrink-0">
            {/* Categories Link Button */}
            <Link
              to="/categories"
              className="flex items-center gap-2 bg-brand-accent text-brand-dark px-4 py-1.5 rounded-full font-black hover:bg-amber-400 transition cursor-pointer shrink-0 shadow-sm"
              title="الانتقال لصفحة كافة الأقسام"
            >
              <Layers className="w-4 h-4 text-brand-dark" />
              <span>الأقسام</span>
            </Link>

            {/* Site Pages Direct Navigation Links */}
            <Link
              to="/"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              الرئيسية
            </Link>

            <Link
              to="/products"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              كل المنتجات
            </Link>

            <Link
              to="/deals"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              التخفيضات
            </Link>

            <Link
              to="/brand"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              الماركات
            </Link>

            <Link
              to="/store"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              المتاجر
            </Link>

            <Link
              to="/seller-guide"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              المركز التعليمي للبائعين
            </Link>

            <Link
              to="/contact"
              className="shrink-0 bg-white/10 hover:bg-white/20 text-white px-3.5 py-1.5 rounded-full font-bold transition text-[11px]"
            >
              تواصل معنا
            </Link>
          </div>

          {/* Dedicated Notifications & Direct Messaging Actions in Content Bar */}
          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/notifications"
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full font-bold transition text-[11px] relative cursor-pointer"
              title="صفحة مركز الإشعارات والتنبيهات"
            >
              <Bell className="w-3.5 h-3.5 text-brand-accent" />
              <span>الإشعارات</span>
              {unreadNotifCount > 0 && (
                <span className="bg-rose-500 text-white text-[10px] font-black px-1.5 rounded-full">
                  {unreadNotifCount}
                </span>
              )}
            </Link>

            <button
              onClick={() => setChatModalOpen(true)}
              className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full font-bold transition text-[11px] cursor-pointer"
              title="الرسائل والمحادثات المباشرة"
            >
              <MessageSquare className="w-3.5 h-3.5 text-brand-accent" />
              <span>الرسائل</span>
            </button>
          </div>
        </div>
      </div>

      {/* Mobile drawer menu */}
      {menuOpen && (
        <div className="md:hidden border-t border-brand-dark/10 px-4 py-3 bg-brand-bg space-y-1">
          <button
            onClick={() => {
              setGovModalOpen(true);
              setMenuOpen(false);
            }}
            className="w-full text-start px-3 py-2.5 text-xs font-black rounded-xl bg-amber-50 text-amber-900 border border-amber-200 flex items-center gap-2 mb-2"
          >
            <MapPin className="w-4 h-4 text-amber-600" />
            المحافظة الحالية: {selectedGov} (تغيير)
          </button>

          {mainNavLinks.map((l) => (
            <Link
              key={l.to}
              to={l.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-3 py-2.5 text-xs font-black rounded-xl ${
                pathname === l.to ? "text-brand-primary bg-brand-primary/10" : "text-brand-dark/80"
              }`}
            >
              {l.label}
            </Link>
          ))}
        </div>
      )}

      {/* Governorate Selection Modal */}
      {govModalOpen && (
        <div
          className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
          dir="rtl"
        >
          <div className="bg-card w-full max-w-lg rounded-3xl p-6 border border-brand-dark/10 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
              <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-primary" />
                اختر المحافظة لتوصيل المنتجات
              </h3>
              <button
                onClick={() => setGovModalOpen(false)}
                className="w-8 h-8 rounded-full bg-secondary text-brand-dark font-black text-xs grid place-items-center hover:bg-brand-dark/10 cursor-pointer"
              >
                ×
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed">
              عند اختيار محافظتك، ستعرض المنصة تلقائياً المنتجات القابلة للتوصيل والشحن إلى محافظتك
              فقط.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto p-1">
              {EGYPT_GOVERNORATES.map((g) => {
                const isSel = selectedGov === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleSelectGov(g)}
                    className={`p-3 rounded-2xl text-xs font-bold text-center border transition cursor-pointer ${
                      isSel
                        ? "bg-brand-dark text-white border-brand-accent shadow-md font-black"
                        : "bg-white text-brand-dark border-brand-dark/10 hover:border-brand-accent hover:bg-amber-50/50"
                    }`}
                  >
                    {g}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}

export function SiteFooter() {
  const [themeConf, setThemeConf] = useState(() => MarketplaceStore.getDefaultThemeSettings());

  useEffect(() => {
    setThemeConf(MarketplaceStore.getSiteThemeSettings());
    const handleUpdate = () => {
      setThemeConf(MarketplaceStore.getSiteThemeSettings());
    };
    window.addEventListener("beitak-theme-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-theme-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  return (
    <footer className="bg-brand-dark text-brand-bg/80 mt-16">
      <div className="max-w-7xl mx-auto px-4 py-10 grid grid-cols-2 md:grid-cols-4 gap-8 text-sm">
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 bg-brand-accent rounded-full grid place-items-center">
              <div className="w-3 h-3 border-2 border-brand-dark rotate-45"></div>
            </div>
            <span className="font-bold text-lg text-brand-bg">بيتك</span>
          </div>
          <p className="text-xs leading-relaxed text-brand-bg/60">
            وجهتك المصرية لشراء الأثاث والأجهزة والسيارات والعقارات بأمان وسهولة.
          </p>
        </div>
        <div>
          <h4 className="font-bold text-brand-bg mb-3 text-sm">تسوق</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/products" className="hover:text-brand-accent">
                كل المنتجات
              </Link>
            </li>
            <li>
              <Link
                to="/products"
                search={{ cat: "أجهزة كهربائية" }}
                className="hover:text-brand-accent"
              >
                أجهزة كهربائية
              </Link>
            </li>
            <li>
              <Link to="/products" search={{ cat: "سيارات" }} className="hover:text-brand-accent">
                سيارات
              </Link>
            </li>
            <li>
              <Link to="/products" search={{ cat: "عقارات" }} className="hover:text-brand-accent">
                عقارات
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-brand-bg mb-3 text-sm">المساعدة</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/contact" className="hover:text-brand-accent">
                تواصل معنا
              </Link>
            </li>
            <li>
              <Link to="/cart" className="hover:text-brand-accent">
                سلة المشتريات
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h4 className="font-bold text-brand-bg mb-3 text-sm">حسابك</h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link to="/auth" className="hover:text-brand-accent">
                تسجيل الدخول
              </Link>
            </li>
            <li>
              <Link to="/auth" search={{ mode: "signup" }} className="hover:text-brand-accent">
                إنشاء حساب
              </Link>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10 py-4 text-center text-[11px] text-brand-bg/50">
        {themeConf.footerText || `© ${new Date().getFullYear()} بيتك · جميع الحقوق محفوظة`}
      </div>
    </footer>
  );
}

import { FloatingChat } from "./FloatingChat";

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen bg-brand-bg text-brand-dark flex flex-col">
      <LiveEditAdminBar />
      <SiteHeader />
      <main className="flex-1">{children}</main>
      <SiteFooter />
      <FloatingChat />
    </div>
  );
}
