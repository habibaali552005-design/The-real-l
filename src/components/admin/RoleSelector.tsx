import React, { useState, useEffect } from "react";
import { ShieldAlert, Building, User, Users, Compass, ChevronDown, RefreshCw } from "lucide-react";
import { MarketplaceStore, Seller } from "@/lib/marketplaceStore";
import { toast } from "sonner";

interface RoleSelectorProps {
  currentRole: "super_admin" | "seller" | "customer" | "visitor";
  onChangeRole: (role: "super_admin" | "seller" | "customer" | "visitor") => void;
  onRefreshData?: () => void;
  isRealAdmin?: boolean;
  isRealSeller?: boolean;
}

export function RoleSelector({
  currentRole,
  onChangeRole,
  onRefreshData,
  isRealAdmin = false,
  isRealSeller = false,
}: RoleSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [selectedSellerId, setSelectedSellerId] = useState("");

  useEffect(() => {
    const list = MarketplaceStore.getSellers();
    setSellers(list);
    const savedSellerId = MarketplaceStore.getSimulatedSellerId();
    setSelectedSellerId(savedSellerId || list[0]?.id || "");
  }, [currentRole]);

  const selectRole = (role: "super_admin" | "seller" | "customer" | "visitor") => {
    if (role === "super_admin" && !isRealAdmin) {
      toast.error("عذراً! دور المدير العام (Super Admin) متوفر فقط للحسابات الإدارية المعتمدة.");
      return;
    }
    if (role === "seller" && !isRealAdmin && !isRealSeller) {
      toast.error("عذراً! دور البائع متوفر فقط للتجار المعتمدين والمفعلين.");
      return;
    }

    MarketplaceStore.setSimulationRole(role);
    onChangeRole(role);
    setIsOpen(false);
    toast.info(
      `تم تبديل حساب التحكم بالنظام إلى: ${
        role === "super_admin"
          ? "المدير العام (Super Admin)"
          : role === "seller"
            ? "بوابة البائع والتجّار (Seller)"
            : role === "customer"
              ? "حساب العميل (Customer)"
              : "واجهة الزائر (Visitor)"
      }`,
    );
  };

  const handleSellerChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const id = e.target.value;
    setSelectedSellerId(id);
    MarketplaceStore.setSimulatedSellerId(id);
    if (onRefreshData) onRefreshData();
    toast.success(`تم تبديل المتجر النشط في لوحة التحكم`);
  };

  const resetAllDb = () => {
    localStorage.clear();
    toast.success("تم بنجاح تصفير قواعد البيانات وإعادة تعيينها للافتراضي!");
    setTimeout(() => {
      window.location.reload();
    }, 500);
  };

  return (
    <div className="bg-brand-dark/5 border border-brand-dark/10 rounded-2xl p-4 flex flex-col md:flex-row justify-between items-center gap-4">
      <div className="flex flex-col md:flex-row items-center gap-3 w-full md:w-auto">
        <span className="text-xs font-extrabold text-muted-foreground whitespace-nowrap">
          ⚙️ نظام التحكم والأدوار بالمنصة (RBAC Role Switcher):
        </span>

        <div className="relative w-full md:w-64">
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="w-full bg-card border border-brand-dark/15 rounded-xl px-4 py-2.5 text-xs font-bold flex justify-between items-center hover:border-brand-accent transition shadow-sm"
          >
            <div className="flex items-center gap-2 text-brand-dark">
              {currentRole === "super_admin" && (
                <ShieldAlert className="w-4 h-4 text-brand-accent" />
              )}
              {currentRole === "seller" && <Building className="w-4 h-4 text-brand-primary" />}
              {currentRole === "customer" && <User className="w-4 h-4 text-emerald-600" />}
              {currentRole === "visitor" && <Users className="w-4 h-4 text-blue-500" />}

              <span>
                {currentRole === "super_admin" && "المدير العام (Super Admin)"}
                {currentRole === "seller" && "تاجر مسجل (Seller)"}
                {currentRole === "customer" && "عميل مشترك (Customer)"}
                {currentRole === "visitor" && "زائر خارجي (Visitor)"}
              </span>
            </div>
            <ChevronDown
              className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? "rotate-180" : ""}`}
            />
          </button>

          {isOpen && (
            <div className="absolute top-[105%] left-0 right-0 z-30 bg-card border border-brand-dark/15 rounded-xl shadow-xl p-1.5 space-y-1">
              {[
                {
                  key: "super_admin",
                  label: "المدير العام (Super Admin)",
                  icon: ShieldAlert,
                  color: "text-brand-accent",
                },
                {
                  key: "seller",
                  label: "تاجر مسجل (Seller)",
                  icon: Building,
                  color: "text-brand-primary",
                },
                {
                  key: "customer",
                  label: "عميل مشترك (Customer)",
                  icon: User,
                  color: "text-emerald-600",
                },
                {
                  key: "visitor",
                  label: "زائر خارجي (Visitor)",
                  icon: Users,
                  color: "text-blue-500",
                },
              ].map((role) => (
                <button
                  key={role.key}
                  onClick={() =>
                    selectRole(role.key as "super_admin" | "seller" | "customer" | "visitor")
                  }
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-bold text-right transition hover:bg-secondary/45 ${
                    currentRole === role.key
                      ? "bg-secondary text-brand-dark"
                      : "text-muted-foreground"
                  }`}
                >
                  <role.icon className={`w-3.5 h-3.5 ${role.color}`} />
                  <span>{role.label}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Simulated Seller ID switcher */}
        {currentRole === "seller" && sellers.length > 0 && (
          <div className="flex items-center gap-2 w-full md:w-auto">
            <span className="text-[11px] font-bold text-muted-foreground whitespace-nowrap">
              المتجر النشط:
            </span>
            <select
              value={selectedSellerId}
              onChange={handleSellerChange}
              className="bg-card border border-brand-dark/15 rounded-xl px-3 py-2 text-xs font-bold focus:outline-none"
            >
              {sellers.map((sel) => (
                <option key={sel.id} value={sel.id}>
                  {sel.storeName} ({sel.status === "approved" ? "نشط" : "معلق"})
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex gap-2.5 w-full md:w-auto justify-end">
        <button
          onClick={resetAllDb}
          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition whitespace-nowrap"
          title="مسح البيانات المضافة وإعادة ضبط المصنع"
        >
          <RefreshCw className="w-3.5 h-3.5" /> تصفير البيانات للوضع الافتراضي
        </button>
      </div>
    </div>
  );
}
