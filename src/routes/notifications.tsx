import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useState, useEffect } from "react";
import { MarketplaceStore, SystemNotification } from "@/lib/marketplaceStore";
import {
  Bell,
  CheckCheck,
  Trash2,
  PackageCheck,
  Truck,
  MessageSquare,
  Info,
  ArrowRight,
  ExternalLink,
  ShieldAlert,
  Sparkles,
} from "lucide-react";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";

export const Route = createFileRoute("/notifications")({
  component: NotificationsPage,
});

export function NotificationsPage() {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "order" | "message" | "announcement">("all");

  const loadNotifs = () => {
    setNotifications(MarketplaceStore.getNotifications());
  };

  useEffect(() => {
    loadNotifs();
    window.addEventListener("beitak-notifications-updated", loadNotifs);
    window.addEventListener("storage", loadNotifs);
    return () => {
      window.removeEventListener("beitak-notifications-updated", loadNotifs);
      window.removeEventListener("storage", loadNotifs);
    };
  }, []);

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "order") return n.type === "order" || n.type === "shipping";
    if (activeTab === "message") return n.type === "message";
    return n.type === "announcement" || n.type === "general";
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const handleMarkAllRead = () => {
    MarketplaceStore.markAllNotificationsRead();
    loadNotifs();
    toast.success("تم تحديد جميع الإشعارات كمقروءة");
  };

  const handleClearAll = () => {
    if (confirm("هل تريد مسح جميع الإشعارات؟")) {
      MarketplaceStore.saveNotifications([]);
      loadNotifs();
      toast.success("تم مسح السجل بالكامل");
    }
  };

  const getIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "order":
        return <PackageCheck className="w-5 h-5 text-emerald-600" />;
      case "shipping":
        return <Truck className="w-5 h-5 text-blue-600" />;
      case "message":
        return <MessageSquare className="w-5 h-5 text-amber-700" />;
      default:
        return <Info className="w-5 h-5 text-purple-600" />;
    }
  };

  return (
    <PageShell>
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-6" dir="rtl">
        {/* Top Header Breadcrumb */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate({ to: "/" })}
              className="w-9 h-9 rounded-full bg-brand-dark/5 hover:bg-brand-dark/10 grid place-items-center text-brand-dark transition cursor-pointer"
              title="العودة للرئيسية"
            >
              <ArrowRight className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-xl md:text-2xl font-black text-brand-dark flex items-center gap-2">
                <Bell className="w-6 h-6 text-brand-primary" />
                <span>مركز الإشعارات والتنبيهات المباشرة</span>
              </h1>
              <p className="text-xs text-muted-foreground mt-0.5">
                متابعة تحديثات الطلبات، الرسائل، وتنبيهات المنصة والتجار أولاً بأول.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={handleMarkAllRead}
                className="flex items-center gap-1.5 bg-brand-primary text-white text-xs font-bold px-3.5 py-2 rounded-xl hover:bg-brand-dark transition shadow-sm cursor-pointer"
              >
                <CheckCheck className="w-4 h-4" />
                <span>تحديد الكل كمقروء ({unreadCount})</span>
              </button>
            )}
            {notifications.length > 0 && (
              <button
                onClick={handleClearAll}
                className="flex items-center gap-1 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold px-3 py-2 rounded-xl transition cursor-pointer"
                title="مسح كافة الإشعارات"
              >
                <Trash2 className="w-4 h-4" />
                <span>مسح الكل</span>
              </button>
            )}
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex gap-2 border-b border-brand-dark/10 pb-2 overflow-x-auto no-scrollbar">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "all"
                ? "bg-brand-dark text-white shadow-xs"
                : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
            }`}
          >
            جميع الإشعارات ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "order"
                ? "bg-brand-dark text-white shadow-xs"
                : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
            }`}
          >
            الطلبات والشحن
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "message"
                ? "bg-brand-dark text-white shadow-xs"
                : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
            }`}
          >
            المحادثات والرسائل
          </button>
          <button
            onClick={() => setActiveTab("announcement")}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition cursor-pointer whitespace-nowrap ${
              activeTab === "announcement"
                ? "bg-brand-dark text-white shadow-xs"
                : "bg-brand-dark/5 text-brand-dark hover:bg-brand-dark/10"
            }`}
          >
            إعلانات المنصة
          </button>
        </div>

        {/* Notifications List */}
        {filteredNotifs.length === 0 ? (
          <div className="bg-card border border-brand-dark/10 rounded-3xl p-12 text-center space-y-3 shadow-sm">
            <div className="w-16 h-16 rounded-2xl bg-brand-dark/5 grid place-items-center mx-auto text-brand-primary">
              <Bell className="w-8 h-8 opacity-40" />
            </div>
            <h3 className="font-extrabold text-brand-dark text-base">
              لا توجد إشعارات في هذا القسم
            </h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto">
              سيتم إخطارك فور صدور أي تحديثات جديدة بخصوص طلباتك أو الرسائل المستلمة من المتاجر.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredNotifs.map((n) => (
              <div
                key={n.id}
                className={`p-4 rounded-2xl border transition duration-200 flex items-start gap-4 ${
                  n.read
                    ? "bg-card border-brand-dark/5 opacity-80"
                    : "bg-amber-500/5 border-amber-500/20 shadow-xs"
                }`}
              >
                <div className="p-3 rounded-xl bg-white border border-brand-dark/10 shrink-0 shadow-xs">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 space-y-1">
                  <div className="flex items-center justify-between">
                    <h4 className="font-black text-sm text-brand-dark flex items-center gap-2">
                      <span>{n.title}</span>
                      {!n.read && (
                        <span className="w-2 h-2 rounded-full bg-rose-500 inline-block" />
                      )}
                    </h4>
                    <span className="text-[10px] font-bold text-muted-foreground dir-ltr">
                      {n.createdAt}
                    </span>
                  </div>

                  <p className="text-xs text-brand-dark/80 leading-relaxed">{n.message}</p>

                  {n.link && (
                    <div className="pt-2">
                      <Link
                        to={n.link}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-primary hover:text-brand-dark underline"
                      >
                        <span>عرض التفاصيل والطلب</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageShell>
  );
}
