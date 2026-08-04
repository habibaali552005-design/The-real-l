import { useState, useEffect, useCallback } from "react";
import { MarketplaceStore, SystemNotification } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import {
  Bell,
  Check,
  CheckCheck,
  Trash2,
  X,
  ExternalLink,
  PackageCheck,
  Truck,
  MessageSquare,
  Info,
} from "lucide-react";
import { Link } from "@tanstack/react-router";

interface NotificationCenterProps {
  isOpen: boolean;
  onClose: () => void;
}

export function NotificationCenterModal({ isOpen, onClose }: NotificationCenterProps) {
  const [notifications, setNotifications] = useState<SystemNotification[]>([]);
  const [activeTab, setActiveTab] = useState<"all" | "order" | "message" | "announcement">("all");
  const [userId, setUserId] = useState<string | undefined>(undefined);

  const loadNotifs = useCallback(
    (uId?: string) => {
      const targetId = uId !== undefined ? uId : userId;
      setNotifications(MarketplaceStore.getNotifications(targetId));
    },
    [userId],
  );

  useEffect(() => {
    let mounted = true;
    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const uid = data.session?.user?.id;
      setUserId(uid);
      if (isOpen) {
        loadNotifs(uid);
      }
    });

    const handleUpdate = () => {
      loadNotifs();
    };

    window.addEventListener("beitak-notifications-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      mounted = false;
      window.removeEventListener("beitak-notifications-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, [isOpen, loadNotifs]);

  if (!isOpen) return null;

  const filteredNotifs = notifications.filter((n) => {
    if (activeTab === "all") return true;
    if (activeTab === "order") return n.type === "order" || n.type === "shipping";
    if (activeTab === "message") return n.type === "message";
    return n.type === "announcement" || n.type === "general";
  });

  const unreadCount = notifications.filter((n) => !n.read).length;

  const getIcon = (type: SystemNotification["type"]) => {
    switch (type) {
      case "order":
        return <PackageCheck className="w-4 h-4 text-emerald-600" />;
      case "shipping":
        return <Truck className="w-4 h-4 text-blue-600" />;
      case "message":
        return <MessageSquare className="w-4 h-4 text-amber-600" />;
      default:
        return <Info className="w-4 h-4 text-purple-600" />;
    }
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/50 backdrop-blur-xs z-50 flex justify-end transition-opacity">
      <div
        className="bg-card w-full max-w-md h-full shadow-2xl border-r border-brand-dark/10 flex flex-col justify-between animate-in slide-in-from-left duration-200"
        dir="rtl"
      >
        {/* Header */}
        <div className="p-5 border-b border-brand-dark/10 bg-brand-dark text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-brand-accent/20 border border-brand-accent/30 grid place-items-center text-brand-accent">
              <Bell className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-black text-sm">مركز التنبيهات والإشعارات</h3>
              <p className="text-[11px] text-brand-bg/75">
                {unreadCount > 0
                  ? `لديك ${unreadCount} إشعارات غير مقروءة`
                  : "جميع التنبيهات مقروءة"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {unreadCount > 0 && (
              <button
                onClick={() => MarketplaceStore.markAllNotificationsRead()}
                className="text-[10px] font-bold bg-white/10 hover:bg-white/20 px-2.5 py-1 rounded-lg text-white transition flex items-center gap-1 cursor-pointer"
                title="تحديد الكل كمقروء"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                تحديد القراءة
              </button>
            )}
            <button
              onClick={onClose}
              className="p-1.5 rounded-full hover:bg-white/10 text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center justify-around border-b border-brand-dark/10 bg-secondary/40 p-2 text-xs font-bold text-muted-foreground">
          <button
            onClick={() => setActiveTab("all")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "all" ? "bg-brand-primary text-white font-black" : "hover:text-brand-dark"}`}
          >
            الكل ({notifications.length})
          </button>
          <button
            onClick={() => setActiveTab("order")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "order" ? "bg-brand-primary text-white font-black" : "hover:text-brand-dark"}`}
          >
            الطلبات والشحن
          </button>
          <button
            onClick={() => setActiveTab("message")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "message" ? "bg-brand-primary text-white font-black" : "hover:text-brand-dark"}`}
          >
            الرسائل
          </button>
          <button
            onClick={() => setActiveTab("announcement")}
            className={`px-3 py-1.5 rounded-xl transition ${activeTab === "announcement" ? "bg-brand-primary text-white font-black" : "hover:text-brand-dark"}`}
          >
            التحديثات
          </button>
        </div>

        {/* List Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {filteredNotifs.length === 0 ? (
            <div className="text-center py-16 space-y-3">
              <Bell className="w-12 h-12 text-muted-foreground/40 mx-auto" />
              <p className="text-xs font-bold text-muted-foreground">
                لا توجد إشعارات متوفرة في هذه الفئة حالياً
              </p>
            </div>
          ) : (
            filteredNotifs.map((notif) => (
              <div
                key={notif.id}
                onClick={() => MarketplaceStore.markNotificationRead(notif.id)}
                className={`p-4 rounded-2xl border transition relative space-y-1.5 cursor-pointer ${
                  notif.read
                    ? "bg-card border-brand-dark/10 opacity-75"
                    : "bg-brand-primary/5 border-brand-primary/30 shadow-xs"
                }`}
              >
                {!notif.read && (
                  <span className="absolute top-3 left-3 w-2.5 h-2.5 bg-brand-primary rounded-full animate-pulse" />
                )}

                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-white border border-brand-dark/10 shadow-2xs">
                    {getIcon(notif.type)}
                  </div>
                  <h4 className="font-black text-xs text-brand-dark">{notif.title}</h4>
                </div>

                <p className="text-xs text-brand-dark/80 leading-relaxed font-medium">
                  {notif.message}
                </p>

                <div className="flex items-center justify-between pt-1 text-[10px] text-muted-foreground">
                  <span>{notif.createdAt}</span>
                  {notif.link && (
                    <Link
                      to={notif.link}
                      onClick={onClose}
                      className="text-brand-primary font-bold hover:underline flex items-center gap-0.5"
                    >
                      التفاصيل <ExternalLink className="w-3 h-3" />
                    </Link>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-brand-dark/10 bg-secondary/30 text-center">
          <button
            onClick={() => {
              MarketplaceStore.markAllNotificationsRead();
              onClose();
            }}
            className="text-xs font-bold text-brand-primary hover:underline cursor-pointer"
          >
            إغلاق مركز التنبيهات
          </button>
        </div>
      </div>
    </div>
  );
}
