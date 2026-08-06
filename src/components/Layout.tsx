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
import { useEffect, useState, useCallback, type ReactNode, type FormEvent } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SbUser } from "@supabase/supabase-js";
import beitakLogo from "@/assets/beitak-logo.png";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { Product, EGYPT_GOVERNORATES } from "@/types";
import { LiveEditAdminBar } from "./LiveEditSystem";
import { checkIsSuperAdmin, checkIsSeller } from "@/lib/rbac";
import { SearchBarWithSuggestions } from "@/components/SearchBarWithSuggestions";
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
  const { isAdmin } = useIsAdmin();
  const user = useUser();
  const [q, setQ] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [acctOpen, setAcctOpen] = useState(false);

  // Notification and Direct Messaging modals state
  const [notifModalOpen, setNotifModalOpen] = useState(false);
  const [chatModalOpen, setChatModalOpen] = useState(false);
  const [unreadNotifCount, setUnreadNotifCount] = useState(0);

  // Categories state
  const [categories, setCategories] = useState<Array<{ id: string; name: string }>>([]);
  const [productsList, setProductsList] = useState<Product[]>([]);

  useEffect(() => {
    const loadProds = () => {
      MarketplaceStore.getProducts().then((res) => setProductsList(res || []));
    };
    loadProds();
    window.addEventListener("beitak-products-updated", loadProds);
    return () => window.removeEventListener("beitak-products-updated", loadProds);
  }, []);

  // Governorate Modal state
  const [govModalOpen, setGovModalOpen] = useState(false);
  const [selectedGov, setSelectedGov] = useState("جميع المحافظات");

  useEffect(() => {
    setSelectedGov(MarketplaceStore.getUserGovernorate());
  }, []);

  const [themeConf, setThemeConf] = useState(() => MarketplaceStore.getSiteThemeSettings());

  const updateNotifBadge = useCallback(() => {
    if (!user) {
      setUnreadNotifCount(0);
      return;
    }
    const list = MarketplaceStore.getNotifications(user.id);
    setUnreadNotifCount(list.filter((n) => !n.read).length);
  }, [user]);

  useEffect(() => {
    updateNotifBadge();
    window.addEventListener("beitak-notifications-updated", updateNotifBadge);
    window.addEventListener("storage", updateNotifBadge);
    return () => {
      window.removeEventListener("beitak-notifications-updated", updateNotifBadge);
      window.removeEventListener("storage", updateNotifBadge);
    };
  }, [updateNotifBadge]);

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
    const syncCats = () => {
      const storeCats = MarketplaceStore.getCategories();
      if (storeCats && storeCats.length > 0) {
        setCategories(storeCats.map((c) => ({ id: c.id, name: c.name })));
      } else {
        supabase
          .from("categories")
          .select("id, name")
          .order("sort_order")
          .then(({ data }) => {
            const filtered = MarketplaceStore.filterDeletedCategories(data || []);
            setCategories(filtered);
          });
      }
    };

    syncCats();
    window.addEventListener("beitak-categories-updated", syncCats);
    window.addEventListener("storage", syncCats);
    return () => {
      window.removeEventListener("beitak-categories-updated", syncCats);
      window.removeEventListener("storage", syncCats);
    };
  }, []);

  const handleSelectGov = async (gov: string) => {
    setSelectedGov(gov);
    MarketplaceStore.setUserGovernorate(gov);

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

  const isSuperAdmin = checkIsSuperAdmin(user);
  const isSeller = checkIsSeller(user);
  const isSellerOrAdmin = isSuperAdmin || isSeller;

  const mainNavLinks = [
    { to: "/" as const, label: "الرئيسية" },
    { to: "/products" as const, label: "المنتجات" },
    { to: "/categories" as const, label: "الأقسام" },
    { to: "/help" as const, label: "المساعدة" },
    ...(isSellerOrAdmin
      ? [{ to: "/seller-guide" as const, label: "المركز التعليمي للبائعين" }]
      : []),
    { to: "/contact" as const, label: "تواصل معنا" },
  ];

  return (
    <header className="sticky top-0 z-50 bg-brand-bg/95 backdrop-blur-md border-b border-brand-dark/10 shadow-sm">
      {/* Top Announcement Bar */}
      <div className="bg-brand-dark text-brand-bg text-[11px] py-1.5 px-4 flex items-center justify-center text-center max-w-7xl mx-auto font-bold">
        <span className="truncate">
          {themeConf.headerAnnouncement || "شحن لكل محافظات مصر · ضمان جودة ونقاء تام على كل منتج"}
        </span>
      </div>

      <div className={`px-4 py-2.5 flex items-center justify-between gap-3 max-w-7xl mx-auto`}>
        <div className="flex items-center gap-3">
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

        {/* Amazon-Style Search Bar with Suggestions */}
        <div className="flex-1 max-w-xl mx-auto">
          <SearchBarWithSuggestions products={productsList} initialValue={q} isHeader={true} />
        </div>

        <div className="flex items-center gap-2">
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
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setAcctOpen(false)}
                  aria-hidden
                />
                <div className="absolute left-0 mt-2 w-64 bg-card rounded-2xl border border-brand-dark/10 shadow-xl overflow-hidden z-50 text-xs">
                  {user ? (
                    <>
                      <div className="px-4 py-3 border-b border-brand-dark/5 bg-secondary/50">
                        <p className="text-[10px] text-muted-foreground font-bold">
                          تسجيل الدخول كـ
                        </p>
                        <p className="text-xs font-black text-brand-dark truncate" dir="ltr">
                          {user.email}
                        </p>
                        <span className="inline-block mt-1 text-[10px] px-2 py-0.5 rounded-full font-bold bg-brand-primary/10 text-brand-primary">
                          {isSuperAdmin
                            ? "المدير العام (Super Admin)"
                            : isSeller
                              ? "حساب تاجر (Seller)"
                              : "حساب مشتري (Customer)"}
                        </span>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setAcctOpen(false)}
                        className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-brand-dark"
                      >
                        <User className="w-4 h-4 text-brand-primary" /> حسابي الشخصي والإعدادات
                      </Link>

                      {isSuperAdmin && (
                        <Link
                          to="/admin"
                          onClick={() => setAcctOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-emerald-700 bg-emerald-50/50"
                        >
                          <LayoutDashboard className="w-4 h-4" /> لوحة الإدارة (Super Admin)
                        </Link>
                      )}

                      {!isSuperAdmin && isSeller && (
                        <Link
                          to="/admin"
                          search={{ tab: "seller_dashboard" }}
                          onClick={() => setAcctOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-amber-800 bg-amber-50/50"
                        >
                          <Store className="w-4 h-4 text-amber-600" /> لوحة تحكم متجري (Seller)
                        </Link>
                      )}

                      {isSellerOrAdmin && (
                        <Link
                          to="/seller-guide"
                          onClick={() => setAcctOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-brand-dark"
                        >
                          <BookOpen className="w-4 h-4 text-amber-600" /> المركز التعليمي للبائعين
                        </Link>
                      )}

                      {!isSellerOrAdmin && (
                        <Link
                          to="/profile"
                          search={{ tab: "become_seller" }}
                          onClick={() => setAcctOpen(false)}
                          className="flex items-center gap-2 px-4 py-3 font-bold hover:bg-secondary text-brand-dark"
                        >
                          <Store className="w-4 h-4 text-brand-primary" /> طلب الانضمام كبائع
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
                      <div className="p-3 bg-brand-primary/5 border-b border-brand-dark/5 text-center">
                        <p className="text-xs font-bold text-brand-dark">أهلاً بك في بيتك</p>
                        <p className="text-[10px] text-muted-foreground">
                          قم بتسجيل الدخول للوصول لحسابك
                        </p>
                      </div>
                      <Link
                        to="/auth"
                        onClick={() => setAcctOpen(false)}
                        className="block px-4 py-3 font-black hover:bg-secondary text-brand-dark text-center"
                      >
                        تسجيل الدخول
                      </Link>
                      <Link
                        to="/auth"
                        search={{ mode: "signup" }}
                        onClick={() => setAcctOpen(false)}
                        className="block px-4 py-3 hover:bg-secondary border-t border-brand-dark/5 text-brand-dark font-bold text-center"
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
      </div>

      {/* Notification Modal */}
      <NotificationCenterModal isOpen={notifModalOpen} onClose={() => setNotifModalOpen(false)} />

      {/* Direct Messaging Modal */}
      <DirectMessagingModal isOpen={chatModalOpen} onClose={() => setChatModalOpen(false)} />

      {/* Primary Brown Content Navigation Bar (Single Clear System) */}
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

            {/* Main Primary Links */}
            <Link
              to="/"
              className={`shrink-0 px-3.5 py-1.5 rounded-full font-bold transition text-[11px] ${
                pathname === "/"
                  ? "bg-brand-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              الرئيسية
            </Link>

            <Link
              to="/products"
              className={`shrink-0 px-3.5 py-1.5 rounded-full font-bold transition text-[11px] ${
                pathname === "/products"
                  ? "bg-brand-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              كل المنتجات
            </Link>

            <Link
              to="/help"
              className={`shrink-0 px-3.5 py-1.5 rounded-full font-bold transition text-[11px] ${
                pathname === "/help"
                  ? "bg-brand-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              المساعدة
            </Link>

            {isSellerOrAdmin && (
              <Link
                to="/seller-guide"
                className={`shrink-0 px-3.5 py-1.5 rounded-full font-bold transition text-[11px] ${
                  pathname === "/seller-guide"
                    ? "bg-brand-primary text-white"
                    : "bg-white/10 hover:bg-white/20 text-white"
                }`}
              >
                المركز التعليمي للبائعين
              </Link>
            )}

            <Link
              to="/contact"
              className={`shrink-0 px-3.5 py-1.5 rounded-full font-bold transition text-[11px] ${
                pathname === "/contact"
                  ? "bg-brand-primary text-white"
                  : "bg-white/10 hover:bg-white/20 text-white"
              }`}
            >
              تواصل معنا
            </Link>
          </div>

          {/* Notifications & Messages Actions */}
          <div className="flex items-center gap-2 shrink-0">
            {user ? (
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
            ) : (
              <Link
                to="/auth"
                className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white px-3 py-1.5 rounded-full font-bold transition text-[11px] relative cursor-pointer"
                title="تسجيل الدخول لعرض الإشعارات"
              >
                <Bell className="w-3.5 h-3.5 text-brand-accent" />
                <span>الإشعارات</span>
              </Link>
            )}

            <button
              onClick={() => {
                if (!user) {
                  toast.error("يرجى تسجيل الدخول أولاً للوصول للرسائل والمحادثات الخاصة بك");
                  navigate({ to: "/auth" });
                } else {
                  setChatModalOpen(true);
                }
              }}
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
          onClick={() => setGovModalOpen(false)}
          className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fadeIn cursor-pointer"
          dir="rtl"
        >
          <div
            onClick={(e) => e.stopPropagation()}
            className="bg-card w-full max-w-lg rounded-3xl p-5 sm:p-6 border border-brand-dark/15 shadow-2xl space-y-4 max-h-[85vh] flex flex-col cursor-default"
          >
            <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3 shrink-0">
              <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
                <MapPin className="w-5 h-5 text-brand-primary" />
                اختر المحافظة لتوصيل المنتجات
              </h3>
              <button
                onClick={() => setGovModalOpen(false)}
                className="w-9 h-9 rounded-full bg-secondary hover:bg-destructive/15 text-brand-dark hover:text-destructive font-black text-xs grid place-items-center cursor-pointer transition border border-brand-dark/10"
                title="إغلاق (أو اضغط خارج النافذة)"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="text-xs text-muted-foreground leading-relaxed shrink-0">
              عند اختيار محافظتك، ستعرض المنصة تلقائياً المنتجات القابلة للتوصيل والشحن إلى محافظتك
              فقط.
            </p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 overflow-y-auto p-1 grow">
              {EGYPT_GOVERNORATES.map((g) => {
                const isSel = selectedGov === g;
                return (
                  <button
                    key={g}
                    onClick={() => handleSelectGov(g)}
                    className={`p-3 rounded-2xl text-xs font-bold text-center border transition cursor-pointer ${
                      isSel
                        ? "bg-brand-dark text-brand-accent border-brand-accent shadow-md font-black"
                        : "bg-background text-foreground border-brand-dark/10 hover:border-brand-accent hover:bg-brand-primary/10"
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
  const [themeConf, setThemeConf] = useState(() => MarketplaceStore.getSiteThemeSettings());

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
