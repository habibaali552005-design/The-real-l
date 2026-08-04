import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { MultiVendorStorage } from "@/lib/multiVendorStorage";
import { safeRandomUUID } from "@/lib/safeId";
import {
  Users,
  ShieldAlert,
  CreditCard,
  Percent,
  Plus,
  Trash2,
  Check,
  X,
  Edit2,
  Lock,
  UserCheck,
  Building,
  Key,
  BadgeAlert,
  CheckCircle,
  HelpCircle,
  TrendingUp,
  BarChart2,
  Activity,
  DollarSign,
  ShoppingBag,
} from "lucide-react";
import {
  MarketplaceStore,
  Visitor,
  Seller,
  SubscriptionPlan,
  DynamicRole,
  CommissionRule,
  Coupon,
} from "@/lib/marketplaceStore";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";
import { getCategoryIcon } from "@/lib/category-icons";

interface OrderItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
  category?: string;
}

interface OrderRecord {
  id: string;
  total: number;
  status: string;
  governorate?: string;
  created_at?: string;
  items: string | OrderItem[];
}

interface ContactMessageRecord {
  id: string;
  name: string;
  created_at?: string;
}

interface CategoryRecord {
  id: string;
  name: string;
}

interface StatsDashboardSectionProps {
  visitorsCount: number;
  sellersCount: number;
  plansCount: number;
  commissionsCount: number;
}

function StatsDashboardSection({
  visitorsCount,
  sellersCount,
  plansCount,
  commissionsCount,
}: StatsDashboardSectionProps) {
  const [orders, setOrders] = useState<OrderRecord[]>([]);
  const [messages, setMessages] = useState<ContactMessageRecord[]>([]);
  const [categories, setCategories] = useState<CategoryRecord[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStatsData = async () => {
      setLoading(true);
      try {
        const [ordersRes, msgsRes, catsRes] = await Promise.all([
          supabase.from("orders").select("*"),
          supabase.from("contact_messages").select("*"),
          supabase.from("categories").select("*"),
        ]);

        if (ordersRes.data) setOrders(ordersRes.data);
        if (msgsRes.data) setMessages(msgsRes.data);
        if (catsRes.data) setCategories(MarketplaceStore.filterDeletedCategories(catsRes.data));
      } catch (err) {
        console.error("Failed to load admin stats:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStatsData();
  }, []);

  // Helper for relative time
  const getRelativeTime = (dateStr?: string) => {
    if (!dateStr) return "الآن";
    try {
      const parsed = new Date(dateStr);
      if (isNaN(parsed.getTime())) return "الآن";
      const diff = Date.now() - parsed.getTime();
      if (isNaN(diff)) return "الآن";
      const mins = Math.floor(diff / 60000);
      if (mins < 1) return "الآن";
      if (mins < 60) return `قبل ${mins} دقيقة`;
      const hours = Math.floor(mins / 60);
      if (hours < 24) return `قبل ${hours} ساعة`;
      const days = Math.floor(hours / 24);
      return `قبل ${days} يوم`;
    } catch {
      return "الآن";
    }
  };

  // 1. Calculations
  const activeOrders = orders.filter((o) => o.status !== "cancelled");
  const totalSales = activeOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const totalCommission = totalSales * 0.05; // 5% platform standard commission

  // 2. Dynamic Live Logs
  const liveLogs = React.useMemo(() => {
    const logs: Array<{
      id: string;
      time: string;
      timestamp: number;
      city: string;
      action: string;
    }> = [];

    // Add orders to logs
    orders.forEach((o) => {
      const parsed = o.created_at ? new Date(o.created_at) : new Date();
      const date = !isNaN(parsed.getTime()) ? parsed : new Date();
      logs.push({
        id: `order-${o.id}`,
        time: getRelativeTime(o.created_at),
        timestamp: date.getTime(),
        city: o.governorate || "القاهرة",
        action: `أتم عملية شراء بقيمة ${formatEGP(o.total)} بنجاح`,
      });
    });

    // Add messages to logs
    messages.forEach((m) => {
      const parsed = m.created_at ? new Date(m.created_at) : new Date();
      const date = !isNaN(parsed.getTime()) ? parsed : new Date();
      logs.push({
        id: `msg-${m.id}`,
        time: getRelativeTime(m.created_at),
        timestamp: date.getTime(),
        city: "تواصل معنا",
        action: `أرسل العميل ${m.name} رسالة دعم فني جديدة`,
      });
    });

    // Add sellers from MarketplaceStore to logs
    const sellers = MarketplaceStore.getSellers();
    sellers.forEach((s) => {
      let date = new Date();
      if (s.planExpiresAt) {
        const parsedPlan = new Date(s.planExpiresAt);
        if (!isNaN(parsedPlan.getTime())) {
          date = new Date(parsedPlan.getTime() - 30 * 86400000);
        }
      }
      const safeIso = !isNaN(date.getTime()) ? date.toISOString() : new Date().toISOString();
      const safeTimestamp = !isNaN(date.getTime()) ? date.getTime() : Date.now();
      logs.push({
        id: `seller-${s.id}`,
        time: getRelativeTime(safeIso),
        timestamp: safeTimestamp,
        city: "منصة التجار",
        action: `تم تفعيل حساب المتجر المعتمد: ${s.storeName}`,
      });
    });

    // Sort by timestamp descending
    return logs.sort((a, b) => b.timestamp - a.timestamp).slice(0, 6);
  }, [orders, messages]);

  // 3. Weekly Sales Graph Calculation
  const weeklyData = React.useMemo(() => {
    // Last 7 days in Arabic names
    const weekdaysArabic = [
      "السبت",
      "الأحد",
      "الإثنين",
      "الثلاثاء",
      "الأربعاء",
      "الخميس",
      "الجمعة",
    ];

    // Generate dates for the last 7 days
    const last7Days = Array.from({ length: 7 }).map((_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      d.setHours(0, 0, 0, 0);
      return d;
    });

    const dataPoints = last7Days.map((date) => {
      const dayStart = date.getTime();
      const dayEnd = dayStart + 86400000;
      const dayOrders = activeOrders.filter((o) => {
        const oTime = o.created_at ? new Date(o.created_at).getTime() : 0;
        return oTime >= dayStart && oTime < dayEnd;
      });
      const sum = dayOrders.reduce((acc, o) => acc + (Number(o.total) || 0), 0);
      return {
        label: weekdaysArabic[date.getDay()],
        value: sum,
      };
    });

    const maxVal = Math.max(...dataPoints.map((dp) => dp.value), 100);

    // Map to SVG coordinates: X goes from 10 to 490, Y goes from 180 to 30
    const points = dataPoints.map((dp, i) => {
      const x = 10 + i * 80;
      const y = 180 - (dp.value / maxVal) * 150;
      return { x, y, ...dp };
    });

    // Construct SVG path
    let pathD = "";
    if (points.length > 0) {
      pathD = `M ${points[0].x} ${points[0].y}`;
      for (let i = 1; i < points.length; i++) {
        // Linear path
        pathD += ` L ${points[i].x} ${points[i].y}`;
      }
    }

    return { points, pathD, maxVal };
  }, [activeOrders]);

  // 4. Category-wise sales
  const topCategories = React.useMemo(() => {
    const catSales: Record<string, number> = {};

    activeOrders.forEach((order) => {
      try {
        const items = typeof order.items === "string" ? JSON.parse(order.items) : order.items;
        if (Array.isArray(items)) {
          (items as OrderItem[]).forEach((item: OrderItem) => {
            // Find category of this product or use default
            const categoryName = item.category || "أخرى";
            const lineTotal = (Number(item.price) || 0) * (Number(item.quantity) || 1);
            catSales[categoryName] = (catSales[categoryName] || 0) + lineTotal;
          });
        }
      } catch (err) {
        console.warn("Failed to parse items for category sales:", err);
      }
    });

    // Ensure we have at least the categories listed in db, even if 0 sales
    categories.forEach((c) => {
      if (!catSales[c.name]) {
        catSales[c.name] = 0;
      }
    });

    // Map and sort
    const mapped = Object.entries(catSales).map(([catName, salesVal]) => {
      return {
        cat: catName,
        salesVal,
        sales: formatEGP(salesVal),
        percentage: totalSales > 0 ? Math.round((salesVal / totalSales) * 100) : 0,
        iconKey: catName,
        colorClass: getCategoryColorClass(catName),
      };
    });

    // Sort descending and take top 4
    return mapped.sort((a, b) => b.salesVal - a.salesVal).slice(0, 4);
  }, [activeOrders, categories, totalSales]);

  // Category Color Class Picker
  function getCategoryColorClass(name: string) {
    const norm = name.toLowerCase();
    if (norm.includes("معيشة") || norm.includes("كنب") || norm.includes("صالون"))
      return "text-amber-600 bg-amber-500/10";
    if (norm.includes("نوم") || norm.includes("سرير")) return "text-blue-600 bg-blue-500/10";
    if (norm.includes("أجهزة") || norm.includes("الكترون") || norm.includes("كهربا"))
      return "text-emerald-600 bg-emerald-500/10";
    if (norm.includes("ديكور") || norm.includes("تحف")) return "text-purple-600 bg-purple-500/10";
    return "text-red-600 bg-red-500/10";
  }

  // Handle Download CSV Report
  const handleDownloadReport = () => {
    const csvContent =
      "data:text/csv;charset=utf-8," +
      "Metric,Value,Status\n" +
      `Total Registered Visitors,${visitorsCount},Active\n` +
      `Approved Sellers,${sellersCount},Approved\n` +
      `Gross Sales Volume,${totalSales} EGP,Processed\n` +
      `System Commission Revenue,${totalCommission} EGP,Collected\n` +
      "Report Generated At," +
      new Date().toISOString() +
      ",Success\n";

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `beitak_admin_report_${new Date().toISOString().split("T")[0]}.csv`,
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("تم توليد وتحميل التقرير الإحصائي الفعلي بصيغة CSV بنجاح!");
  };

  return (
    <div className="space-y-6">
      {/* 4 Stats Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in">
        {/* Card 1 */}
        <div className="bg-brand-bg border border-brand-dark/5 p-4 rounded-2xl flex items-center justify-between relative overflow-hidden group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              معدل الزيارات والترافيك
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-brand-dark">{visitorsCount}</h4>
              <span className="text-xs text-emerald-600 font-bold flex items-center">نشط</span>
            </div>
            <p className="text-[10px] text-muted-foreground">مستخدم فريد مسجل بالكامل</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-accent transition duration-300">
            <Users className="w-5 h-5" />
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-brand-bg border border-brand-dark/5 p-4 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              حجم مبيعات المنصة الإجمالي
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-brand-dark">{formatEGP(totalSales)}</h4>
            </div>
            <p className="text-[10px] text-muted-foreground">عمليات دفع وإسناد فعلية</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-accent transition duration-300">
            <DollarSign className="w-5 h-5" />
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-brand-bg border border-brand-dark/5 p-4 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              أرباح عمولات الموقع المقدرة
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-brand-primary">
                {formatEGP(totalCommission)}
              </h4>
              <span className="text-xs text-brand-accent font-bold">معدل ٥٪</span>
            </div>
            <p className="text-[10px] text-muted-foreground">تقتطع تلقائياً لصالح المنصة</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-accent transition duration-300">
            <Percent className="w-5 h-5" />
          </div>
        </div>

        {/* Card 4 */}
        <div className="bg-brand-bg border border-brand-dark/5 p-4 rounded-2xl flex items-center justify-between group">
          <div className="space-y-1">
            <span className="text-[10px] font-bold text-muted-foreground">
              شركاء التجارة الفعليين
            </span>
            <div className="flex items-baseline gap-2">
              <h4 className="text-2xl font-extrabold text-brand-dark">{sellersCount}</h4>
            </div>
            <p className="text-[10px] text-muted-foreground">بائعين معتمدين نشطين بالمنصة</p>
          </div>
          <div className="w-11 h-11 rounded-xl bg-brand-primary/10 flex items-center justify-center text-brand-primary group-hover:bg-brand-accent transition duration-300">
            <Building className="w-5 h-5" />
          </div>
        </div>
      </div>

      {/* Charts & Graphs Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Dynamic Interactive SVG Sales Performance Chart */}
        <div className="lg:col-span-2 bg-brand-bg border border-brand-dark/5 rounded-2xl p-5 space-y-4">
          <div className="flex justify-between items-center">
            <div>
              <h3 className="font-bold text-xs md:text-sm text-brand-dark">
                منحنى المبيعات والطلب الأسبوعي الفعلي
              </h3>
              <p className="text-[10px] text-muted-foreground">
                مخطط حجم المعاملات (ج.م) المسجلة فعلياً طوال الـ 7 أيام الماضية
              </p>
            </div>
            <button
              onClick={handleDownloadReport}
              className="bg-brand-dark text-brand-bg hover:bg-brand-primary px-3 py-1.5 rounded-lg text-[10px] font-bold transition flex items-center gap-1"
            >
              📥 تصدير التقرير المالي الفعلي بصيغة CSV
            </button>
          </div>

          {/* Pure CSS/SVG Line Chart */}
          <div className="relative h-60 w-full pt-4">
            {totalSales === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-secondary/5 border border-dashed rounded-xl p-4 text-center">
                <BarChart2 className="w-8 h-8 text-muted-foreground/55 animate-pulse mb-2" />
                <p className="text-xs font-bold text-brand-dark">
                  لا توجد مبيعات فعلية بعد لرسم المخطط الأسبوعي
                </p>
                <p className="text-[10px] text-muted-foreground">
                  سيظهر المنحنى فور إتمام أول عملية شراء ناجحة على الموقع
                </p>
              </div>
            ) : (
              <svg viewBox="0 0 500 200" className="w-full h-full overflow-visible">
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-accent)" stopOpacity="0.3" />
                    <stop offset="100%" stopColor="var(--brand-accent)" stopOpacity="0.0" />
                  </linearGradient>
                </defs>
                {/* Horizontal Grid Lines */}
                <line
                  x1="0"
                  y1="180"
                  x2="500"
                  y2="180"
                  stroke="#000"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="130"
                  x2="500"
                  y2="130"
                  stroke="#000"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="80"
                  x2="500"
                  y2="80"
                  stroke="#000"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />
                <line
                  x1="0"
                  y1="30"
                  x2="500"
                  y2="30"
                  stroke="#000"
                  strokeOpacity="0.05"
                  strokeWidth="1"
                />

                {/* Area Under Curve */}
                {weeklyData.pathD && (
                  <path
                    d={`${weeklyData.pathD} L ${weeklyData.points[weeklyData.points.length - 1].x} 180 L ${weeklyData.points[0].x} 180 Z`}
                    fill="url(#salesGrad)"
                  />
                )}

                {/* Curve Line */}
                {weeklyData.pathD && (
                  <path
                    d={weeklyData.pathD}
                    fill="none"
                    stroke="var(--brand-accent)"
                    strokeWidth="3.5"
                    strokeLinecap="round"
                  />
                )}

                {/* SVG Dots */}
                {weeklyData.points.map((p, i) => (
                  <g key={i} className="group/dot cursor-pointer">
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="5"
                      fill="var(--brand-dark)"
                      stroke="var(--brand-accent)"
                      strokeWidth="1.5"
                    />
                    <title>{`${p.label}: ${formatEGP(p.value)}`}</title>
                  </g>
                ))}

                {/* Weekday labels */}
                {weeklyData.points.map((p, i) => (
                  <text
                    key={i}
                    x={p.x}
                    y="195"
                    fill="var(--brand-dark)"
                    opacity="0.6"
                    fontSize="9"
                    textAnchor="middle"
                    className="font-bold"
                  >
                    {p.label}
                  </text>
                ))}
              </svg>
            )}
          </div>
        </div>

        {/* Real-time DB Event Timeline Feed */}
        <div className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-5 space-y-4">
          <div className="flex items-center gap-1.5 border-b border-brand-dark/5 pb-2.5">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500"></span>
            </span>
            <h3 className="font-extrabold text-xs md:text-sm text-brand-dark">
              نشاط وسجلات المنصة الفعلية
            </h3>
          </div>

          <div className="space-y-3.5 max-h-56 overflow-y-auto pr-1 no-scrollbar">
            {liveLogs.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-[10px]">
                <Activity className="w-5 h-5 mx-auto opacity-40 mb-1" />
                لا توجد سجلات أنشطة فعلية مسجلة بعد.
              </div>
            ) : (
              liveLogs.map((log) => (
                <div
                  key={log.id}
                  className="flex gap-2.5 items-start text-xs border-b border-brand-dark/5 pb-2 last:border-0 hover:bg-secondary/5 transition p-1 rounded-lg"
                >
                  <div className="px-2 py-0.5 rounded-md bg-secondary font-mono text-[9px] text-brand-primary whitespace-nowrap">
                    {log.time}
                  </div>
                  <div>
                    <span className="font-extrabold text-brand-dark ml-1">[{log.city}]</span>
                    <span className="text-muted-foreground text-[11px]">{log.action}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Best Selling categories with dynamic Category Icons */}
      <div className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-5 space-y-4">
        <h3 className="font-bold text-xs md:text-sm text-brand-dark">
          توزيع المبيعات والطلبات حسب فئة المنتجات الفعلية
        </h3>

        {topCategories.length === 0 ? (
          <div className="text-center py-6 text-xs text-muted-foreground bg-secondary/5 rounded-xl border border-dashed">
            لا توجد مبيعات مسجلة لأي فئة حالياً.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {topCategories.map((item, index) => {
              const IconComp = getCategoryIcon(item.iconKey);
              return (
                <div
                  key={index}
                  className="bg-card border border-brand-dark/5 rounded-xl p-4 space-y-2.5 hover:border-brand-accent/40 transition duration-200"
                >
                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <div
                        className={`w-8 h-8 rounded-lg flex items-center justify-center ${item.colorClass}`}
                      >
                        <IconComp className="w-4 h-4" />
                      </div>
                      <span className="text-xs font-bold">{item.cat}</span>
                    </div>
                    <span className="text-xs font-extrabold text-brand-primary">{item.sales}</span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex justify-between text-[10px] text-muted-foreground">
                      <span>نسبة الحصة من مبيعات المنصة</span>
                      <span>{item.percentage}%</span>
                    </div>
                    <div className="w-full h-1.5 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full bg-brand-primary rounded-full"
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export function SuperAdminDashboard() {
  const [activeTab, setActiveTab] = useState<
    | "stats"
    | "seller_requests"
    | "payment_settings"
    | "sellers"
    | "women_lounge"
    | "rbac"
    | "visitors"
    | "commissions"
    | "coupons"
  >("stats");

  // State synchronized with local storage store
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [roles, setRoles] = useState<DynamicRole[]>([]);
  const [commissions, setCommissions] = useState<CommissionRule[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);

  const [editingPlanId, setEditingPlanId] = useState<string | null>(null);
  const [newPlanFeature, setNewPlanFeature] = useState("");
  const [newPlan, setNewPlan] = useState<Partial<SubscriptionPlan>>({
    name: "",
    price: 100,
    type: "monthly",
    description: "",
    aiCredits: 100,
    features: [],
    isEnabled: true,
  });

  // Billing settings & seller requests state
  const [billingSettings, setBillingSettings] = useState(() =>
    MultiVendorStorage.getBillingSettings(),
  );
  const [sellerRequests, setSellerRequests] = useState(() => MarketplaceStore.getSellerRequests());

  const [newCoupon, setNewCoupon] = useState<Partial<Coupon>>({
    code: "",
    discount: 10,
    type: "percent",
    expiresAt: "",
  });

  // Women Lounge Settings state
  const [womenSettings, setWomenSettings] = useState(() =>
    MarketplaceStore.getWomenLoungeSettings(),
  );
  const [newSubcatInput, setNewSubcatInput] = useState("");

  // Editing forms state
  const [newRoleName, setNewRoleName] = useState("");
  const [newRoleDesc, setNewRoleDesc] = useState("");
  const [newRolePerms, setNewRolePerms] = useState<string[]>([]);

  const [newComm, setNewComm] = useState<Partial<CommissionRule>>({
    category: "",
    percentage: 10,
    fixedFee: 0,
  });

  useEffect(() => {
    // Load datasets
    setVisitors(MarketplaceStore.getVisitors());
    setSellers(MarketplaceStore.getSellers());
    setRoles(MarketplaceStore.getRoles());
    setCommissions(MarketplaceStore.getCommissions());
    setCoupons(MarketplaceStore.getCoupons());
    setPlans(MarketplaceStore.getPlans());

    const refreshComms = () => {
      setCommissions(MarketplaceStore.getCommissions());
      setCoupons(MarketplaceStore.getCoupons());
      setBillingSettings(MultiVendorStorage.getBillingSettings());
      setSellerRequests(MarketplaceStore.getSellerRequests());
      setSellers(MarketplaceStore.getSellers());
      setPlans(MarketplaceStore.getPlans());
    };

    window.addEventListener("beitak-commissions-updated", refreshComms);
    window.addEventListener("beitak-billing-updated", refreshComms);
    window.addEventListener("beitak-seller-requests-updated", refreshComms);
    window.addEventListener("storage", refreshComms);

    return () => {
      window.removeEventListener("beitak-commissions-updated", refreshComms);
      window.removeEventListener("beitak-billing-updated", refreshComms);
      window.removeEventListener("beitak-seller-requests-updated", refreshComms);
      window.removeEventListener("storage", refreshComms);
    };
  }, []);

  const saveAll = (
    key: "visitors" | "sellers" | "roles" | "commissions" | "plans" | "coupons",
    updatedData: unknown[],
  ) => {
    if (key === "visitors") {
      MarketplaceStore.saveVisitors(updatedData as Visitor[]);
      setVisitors(updatedData as Visitor[]);
    } else if (key === "sellers") {
      MarketplaceStore.saveSellers(updatedData as Seller[]);
      setSellers(updatedData as Seller[]);
    } else if (key === "roles") {
      MarketplaceStore.saveRoles(updatedData as DynamicRole[]);
      setRoles(updatedData as DynamicRole[]);
    } else if (key === "commissions") {
      MarketplaceStore.saveCommissions(updatedData as CommissionRule[]);
      setCommissions(updatedData as CommissionRule[]);
    } else if (key === "plans") {
      MarketplaceStore.savePlans(updatedData as SubscriptionPlan[]);
      setPlans(updatedData as SubscriptionPlan[]);
    } else if (key === "coupons") {
      MarketplaceStore.saveCoupons(updatedData as Coupon[]);
      setCoupons(updatedData as Coupon[]);
    }
  };

  // 1. RBAC permissions available in system
  const ALL_PERMISSIONS = [
    { key: "all_access", label: "صلاحيات غير محدودة (All Access)" },
    { key: "manage_settings", label: "تعديل إعدادات المتجر العامة" },
    { key: "manage_sellers", label: "قبول/تعليق حسابات التجار" },
    { key: "manage_plans", label: "إضافة/تعديل خطط الاشتراكات والأسعار" },
    { key: "sell_products", label: "إدراج وبيع المنتجات وإدارة المخازن" },
    { key: "manage_warehouses", label: "إضافة وإدارة مستودعات السلع" },
    { key: "view_reports", label: "عرض الإحصائيات والأرباح المتقدمة" },
  ];

  const handleCreateRole = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newRoleName.trim()) return toast.error("أدخل اسم الدور");
    const updated = [
      ...roles,
      {
        id: `role-${safeRandomUUID()}`,
        name: newRoleName.trim(),
        description: newRoleDesc.trim(),
        permissions: newRolePerms,
      },
    ];
    saveAll("roles", updated);
    setNewRoleName("");
    setNewRoleDesc("");
    setNewRolePerms([]);
    toast.success("تم إضافة الدور الجديد بنجاح!");
  };

  const handleTogglePerm = (perm: string) => {
    setNewRolePerms((prev) =>
      prev.includes(perm) ? prev.filter((p) => p !== perm) : [...prev, perm],
    );
  };

  const deleteRole = (id: string) => {
    if (id === "role-super-admin") return toast.error("لا يمكن حذف دور المدير العام الرئيسي");
    const updated = roles.filter((r) => r.id !== id);
    saveAll("roles", updated);
    toast.success("تم حذف دور المجموعة");
  };

  // 2. Sellers management
  const updateSellerStatus = (id: string, status: Seller["status"]) => {
    const updated = sellers.map((sel) => {
      if (sel.id === id) {
        let msg = "تمت الموافقة على التاجر بنجاح";
        if (status === "suspended") msg = "تم تعليق حساب التاجر مؤقتاً";
        if (status === "rejected") msg = "تم رفض الطلب المقدم من التاجر";
        toast.success(msg);
        return { ...sel, status };
      }
      return sel;
    });
    saveAll("sellers", updated);
  };

  const updateSellerConfig = (
    id: string,
    sellerType: "affiliate" | "merchant",
    commissionCut: number,
  ) => {
    const updated = sellers.map((sel) => {
      if (sel.id === id) {
        toast.success("تم تحديث نوع الحساب ونسبة عمولة المنصة بنجاح!");
        return { ...sel, sellerType, commissionCut };
      }
      return sel;
    });
    saveAll("sellers", updated);
  };

  const addManualCredits = (id: string) => {
    const amount = prompt("أدخل قيمة رصيد الذكاء الاصطناعي الإضافية الممنوحة للتاجر:");
    if (!amount || isNaN(Number(amount))) return;
    const updated = sellers.map((sel) => {
      if (sel.id === id) {
        const added = Number(amount);
        toast.success(`تم بنجاح شحن رصيد إضافي +${added} للتاجر`);
        return { ...sel, aiCredits: sel.aiCredits + added };
      }
      return sel;
    });
    saveAll("sellers", updated);
  };

  // 3. Subscription plans
  const handleCreatePlan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPlan.name) return;

    if (editingPlanId) {
      const updated = plans.map((p) => {
        if (p.id === editingPlanId) {
          return {
            ...p,
            name: newPlan.name!,
            price: Number(newPlan.price || 0),
            type: newPlan.type as "monthly" | "yearly" | "lifetime" | "trial" | "gift",
            description: newPlan.description || "",
            aiCredits: Number(newPlan.aiCredits || 100),
            features: newPlan.features || [],
            isEnabled: newPlan.isEnabled ?? true,
          };
        }
        return p;
      });
      saveAll("plans", updated);
      setEditingPlanId(null);
      toast.success("تم تعديل باقة الاشتراك بنجاح!");
    } else {
      const planId = `plan-${safeRandomUUID()}`;
      const finalizedPlan: SubscriptionPlan = {
        id: planId,
        name: newPlan.name,
        price: Number(newPlan.price || 0),
        type: newPlan.type as "monthly" | "yearly" | "lifetime" | "trial" | "gift",
        description: newPlan.description || "",
        aiCredits: Number(newPlan.aiCredits || 100),
        features: newPlan.features || [],
        isEnabled: true,
      };
      const updated = [...plans, finalizedPlan];
      saveAll("plans", updated);
      toast.success("تم إدراج خطة الاشتراك الجديدة بدون كود!");
    }

    setNewPlan({
      name: "",
      price: 0,
      type: "monthly",
      description: "",
      aiCredits: 100,
      features: [],
      isEnabled: true,
    });
  };

  const startEditingPlan = (p: SubscriptionPlan) => {
    setEditingPlanId(p.id);
    setNewPlan({
      name: p.name,
      price: p.price,
      type: p.type,
      description: p.description,
      aiCredits: p.aiCredits,
      features: p.features,
      isEnabled: p.isEnabled,
    });
    // Scroll the form into view or focus
    toast.info(`جاري تعديل باقة: ${p.name}. يرجى مراجعة النموذج باليسار.`);
  };

  const cancelEditingPlan = () => {
    setEditingPlanId(null);
    setNewPlan({
      name: "",
      price: 0,
      type: "monthly",
      description: "",
      aiCredits: 100,
      features: [],
      isEnabled: true,
    });
  };

  const addFeatureToPlanForm = () => {
    if (!newPlanFeature.trim()) return;
    setNewPlan((prev) => ({
      ...prev,
      features: [...(prev.features || []), newPlanFeature.trim()],
    }));
    setNewPlanFeature("");
  };

  const deletePlan = (id: string) => {
    if (
      ["plan-trial", "plan-monthly-standard", "plan-yearly-premium", "plan-lifetime-pro"].includes(
        id,
      )
    ) {
      return toast.error("غير مسموح بحذف الخطط الأساسية الافتراضية للنظام");
    }
    const updated = plans.filter((p) => p.id !== id);
    saveAll("plans", updated);
    toast.success("تم إزالة باقة الاشتراك");
  };

  // 4. Coupons management
  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCoupon.code) return;
    const updated = [
      ...coupons,
      {
        code: newCoupon.code.trim().toUpperCase(),
        discount: Number(newCoupon.discount || 10),
        type: newCoupon.type as "percent" | "fixed",
        expiresAt: newCoupon.expiresAt || new Date(Date.now() + 86400000 * 30).toISOString(),
        isEnabled: true,
      },
    ];
    saveAll("coupons", updated);
    setNewCoupon({ code: "", discount: 10, type: "percent", expiresAt: "" });
    toast.success("تم تكوين كوبون خصم فعال للمشترين والتجار!");
  };

  const deleteCoupon = (code: string) => {
    const updated = coupons.filter((c) => c.code !== code);
    saveAll("coupons", updated);
    toast.success("تم إتلاف كوبون الخصم");
  };

  // 5. Commission rules
  const handleCreateCommission = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComm.category) return;
    const updated = [
      ...commissions,
      {
        id: `comm-${safeRandomUUID()}`,
        category: newComm.category,
        percentage: Number(newComm.percentage || 5),
        fixedFee: Number(newComm.fixedFee || 0),
      },
    ];
    saveAll("commissions", updated);
    setNewComm({ category: "", percentage: 5, fixedFee: 20 });
    toast.success("تم تكوين قاعدة عمولة فئوية جديدة!");
  };

  const deleteComm = (id: string) => {
    if (id === "comm-default") return toast.error("العمولة الافتراضية للنظام مطلوبة دائماً");
    const updated = commissions.filter((c) => c.id !== id);
    saveAll("commissions", updated);
    toast.success("تم حذف قاعدة العمولة");
  };

  return (
    <div className="bg-card rounded-3xl p-5 border border-brand-dark/5 space-y-6">
      {/* Tab bar header */}
      <div className="flex gap-2 border-b border-brand-dark/5 pb-3 overflow-x-auto no-scrollbar">
        {[
          { key: "stats", label: "التحليلات والإحصائيات", icon: BarChart2 },
          { key: "seller_requests", label: "طلبات البائعين والتراخيص", icon: CreditCard },
          { key: "payment_settings", label: "خيارات الدفع والعمولات", icon: Percent },
          { key: "sellers", label: "إدارة التجار والمسوقين", icon: Building },
          { key: "women_lounge", label: "إدارة قسم النساء", icon: Lock },
          { key: "rbac", label: "الأدوار والصلاحيات (RBAC)", icon: ShieldAlert },
          { key: "visitors", label: "إدارة الزوار والترافيك", icon: Users },
          { key: "commissions", label: "عمولات الأقسام (1% - 20%)", icon: Percent },
          { key: "coupons", label: "كوبونات الخصم", icon: Plus },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() =>
              setActiveTab(
                t.key as
                  | "stats"
                  | "seller_requests"
                  | "payment_settings"
                  | "sellers"
                  | "women_lounge"
                  | "rbac"
                  | "visitors"
                  | "commissions"
                  | "coupons",
              )
            }
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition whitespace-nowrap cursor-pointer ${
              activeTab === t.key
                ? "bg-brand-primary text-brand-bg shadow-sm"
                : "bg-brand-bg text-brand-dark border border-brand-dark/5 hover:border-brand-accent"
            }`}
          >
            <t.icon className="w-4 h-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* 0. STATS & ANALYTICS SECTION */}
      {activeTab === "stats" && (
        <StatsDashboardSection
          visitorsCount={visitors.length}
          sellersCount={sellers.length}
          plansCount={plans.length}
          commissionsCount={commissions.length}
        />
      )}

      {/* 1. SELLER REQUESTS & VERIFICATIONS SECTION */}
      {activeTab === "seller_requests" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-brand-dark to-brand-primary text-white p-6 rounded-3xl space-y-2">
            <h3 className="font-extrabold text-base flex items-center gap-2 text-brand-accent">
              <CreditCard className="w-5 h-5" />
              طلبات البائعين المرفوعة للسوبر أدمن
            </h3>
            <p className="text-xs text-brand-bg/80 leading-relaxed">
              إدارة طلبات البائعين لإضافة أقسام وتصنيفات جديدة، تفعيل وسائل دفع إضافية، وتوثيق أوراق
              الشركات والمصانع المعتمدة.
            </p>
          </div>

          {sellerRequests.length === 0 ? (
            <div className="bg-brand-bg p-8 rounded-2xl border border-brand-dark/5 text-center text-xs text-muted-foreground">
              لا توجد طلبات معلقة من البائعين حالياً.
            </div>
          ) : (
            <div className="space-y-4">
              {sellerRequests.map((req) => (
                <div
                  key={req.id}
                  className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-5 space-y-3"
                >
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2 border-b border-brand-dark/5 pb-3">
                    <div>
                      <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2.5 py-0.5 rounded-md inline-block mb-1">
                        {req.requestType === "category" && "طلب إضافة قسم جديدة"}
                        {req.requestType === "payment_method" && "طلب تفعيل وسيلة دفع"}
                        {req.requestType === "company_verification" && "طلب توثيق شركة / مصنع"}
                      </span>
                      <h4 className="font-black text-sm text-brand-dark">{req.title}</h4>
                      <p className="text-xs text-muted-foreground font-bold">
                        اسم البائع: {req.sellerName} | تاريخ الطلب: {req.createdAt}
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {req.status === "pending" ? (
                        <>
                          <button
                            onClick={() => {
                              MarketplaceStore.updateSellerRequestStatus(req.id, "approved");
                              setSellerRequests(MarketplaceStore.getSellerRequests());
                              setSellers(MarketplaceStore.getSellers());
                              toast.success("تمت الموافقة على طلب البائع بنجاح!");
                            }}
                            className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4" /> موافقة واعتمد
                          </button>
                          <button
                            onClick={() => {
                              MarketplaceStore.updateSellerRequestStatus(req.id, "rejected");
                              setSellerRequests(MarketplaceStore.getSellerRequests());
                              toast.info("تم رفض طلب البائع");
                            }}
                            className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-4 py-2 rounded-xl text-xs transition cursor-pointer flex items-center gap-1.5"
                          >
                            <X className="w-4 h-4" /> رفض الطلب
                          </button>
                        </>
                      ) : (
                        <span
                          className={`text-xs font-bold px-3 py-1 rounded-xl ${
                            req.status === "approved"
                              ? "bg-emerald-100 text-emerald-800"
                              : "bg-rose-100 text-rose-800"
                          }`}
                        >
                          {req.status === "approved" ? "تمت الموافقة" : "مرفوض"}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-brand-dark leading-relaxed font-medium bg-card p-3 rounded-xl border border-brand-dark/5">
                    {req.details}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* 2. PAYMENT SETTINGS & COMMISSIONS SECTION */}
      {activeTab === "payment_settings" && (
        <div className="space-y-6">
          <div className="bg-brand-bg border border-brand-dark/10 rounded-2xl p-6 space-y-6">
            <div className="border-b border-brand-dark/10 pb-4">
              <h3 className="font-extrabold text-base text-brand-dark flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-brand-primary" />
                خيارات ووسائل الدفع المتاحة للجمهور عبر المنصة
              </h3>
              <p className="text-xs text-muted-foreground pt-1">
                الافتراضي حالياً هو الدفع عند الاستلام (COD). يمكنك تفعيل وسائل دفع إضافية للسماح
                للمتسوقين باستخدامها في سلة الشراء.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* COD Method */}
              <div className="bg-card p-4 rounded-xl border border-brand-dark/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-brand-dark block">
                    الدفع عند الاستلام (Cash on Delivery)
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    وسيلة الدفع الأساسية المفعّلة افتراضياً
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={billingSettings.activePaymentMethods?.includes("cod") ?? true}
                  onChange={(e) => {
                    const current = billingSettings.activePaymentMethods || ["cod"];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, "cod"]))
                      : current.filter((m) => m !== "cod");
                    const updated = { ...billingSettings, activePaymentMethods: next };
                    MultiVendorStorage.saveBillingSettings(updated);
                    setBillingSettings(updated);
                    window.dispatchEvent(new Event("beitak-billing-updated"));
                    toast.success("تم تحديث خيارات الدفع");
                  }}
                  className="w-5 h-5 accent-brand-primary cursor-pointer"
                />
              </div>

              {/* Credit Card Method */}
              <div className="bg-card p-4 rounded-xl border border-brand-dark/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-brand-dark block">
                    بطاقات البنوك والائتمان (Visa / Mastercard)
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    تفعيل الدفع الإلكتروني المباشر
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={billingSettings.activePaymentMethods?.includes("card") ?? false}
                  onChange={(e) => {
                    const current = billingSettings.activePaymentMethods || ["cod"];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, "card"]))
                      : current.filter((m) => m !== "card");
                    const updated = { ...billingSettings, activePaymentMethods: next };
                    MultiVendorStorage.saveBillingSettings(updated);
                    setBillingSettings(updated);
                    window.dispatchEvent(new Event("beitak-billing-updated"));
                    toast.success("تم تحديث خيارات الدفع");
                  }}
                  className="w-5 h-5 accent-brand-primary cursor-pointer"
                />
              </div>

              {/* Electronic Wallet Method */}
              <div className="bg-card p-4 rounded-xl border border-brand-dark/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-brand-dark block">
                    المحافظ الإلكترونية (Vodafone Cash, Etisalat, Orange, WE)
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    الدفع عبر المحافظ الإلكترونية المحلية
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={billingSettings.activePaymentMethods?.includes("wallet") ?? false}
                  onChange={(e) => {
                    const current = billingSettings.activePaymentMethods || ["cod"];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, "wallet"]))
                      : current.filter((m) => m !== "wallet");
                    const updated = { ...billingSettings, activePaymentMethods: next };
                    MultiVendorStorage.saveBillingSettings(updated);
                    setBillingSettings(updated);
                    window.dispatchEvent(new Event("beitak-billing-updated"));
                    toast.success("تم تحديث خيارات الدفع");
                  }}
                  className="w-5 h-5 accent-brand-primary cursor-pointer"
                />
              </div>

              {/* InstaPay Method */}
              <div className="bg-card p-4 rounded-xl border border-brand-dark/10 flex items-center justify-between">
                <div>
                  <span className="font-bold text-xs text-brand-dark block">
                    تطبيق إنستا باي (InstaPay)
                  </span>
                  <span className="text-[10px] text-muted-foreground block">
                    تحويل بنكي لحظي مباشر عبر تطبيق إنستا باي
                  </span>
                </div>
                <input
                  type="checkbox"
                  checked={billingSettings.activePaymentMethods?.includes("instapay") ?? false}
                  onChange={(e) => {
                    const current = billingSettings.activePaymentMethods || ["cod"];
                    const next = e.target.checked
                      ? Array.from(new Set([...current, "instapay"]))
                      : current.filter((m) => m !== "instapay");
                    const updated = { ...billingSettings, activePaymentMethods: next };
                    MultiVendorStorage.saveBillingSettings(updated);
                    setBillingSettings(updated);
                    window.dispatchEvent(new Event("beitak-billing-updated"));
                    toast.success("تم تحديث خيارات الدفع");
                  }}
                  className="w-5 h-5 accent-brand-primary cursor-pointer"
                />
              </div>
            </div>

            {/* Default Commission Settings */}
            <div className="pt-4 border-t border-brand-dark/10 space-y-4">
              <h4 className="font-extrabold text-xs text-brand-dark">
                نسب العمولات المحددة افتراضياً لأنواع البائعين:
              </h4>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="bg-card p-3 rounded-xl border border-brand-dark/10 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    عمولة التجار الفرديين (%):
                  </label>
                  <input
                    type="number"
                    value={billingSettings.commissionRates?.merchant ?? 10}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = {
                        ...billingSettings,
                        commissionRates: {
                          ...billingSettings.commissionRates,
                          merchant: val,
                          affiliate: billingSettings.commissionRates?.affiliate ?? 5,
                          factory: billingSettings.commissionRates?.factory ?? 7,
                        },
                      };
                      MultiVendorStorage.saveBillingSettings(updated);
                      setBillingSettings(updated);
                    }}
                    className="w-full text-xs font-bold bg-brand-bg border border-brand-dark/10 rounded-lg p-2"
                  />
                </div>

                <div className="bg-card p-3 rounded-xl border border-brand-dark/10 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    عمولة المسوقين بالعمولة (%):
                  </label>
                  <input
                    type="number"
                    value={billingSettings.commissionRates?.affiliate ?? 5}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = {
                        ...billingSettings,
                        commissionRates: {
                          ...billingSettings.commissionRates,
                          merchant: billingSettings.commissionRates?.merchant ?? 10,
                          affiliate: val,
                          factory: billingSettings.commissionRates?.factory ?? 7,
                        },
                      };
                      MultiVendorStorage.saveBillingSettings(updated);
                      setBillingSettings(updated);
                    }}
                    className="w-full text-xs font-bold bg-brand-bg border border-brand-dark/10 rounded-lg p-2"
                  />
                </div>

                <div className="bg-card p-3 rounded-xl border border-brand-dark/10 space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    عمولة الشركات والمصانع المعتمدة (%):
                  </label>
                  <input
                    type="number"
                    value={billingSettings.commissionRates?.factory ?? 7}
                    onChange={(e) => {
                      const val = Number(e.target.value);
                      const updated = {
                        ...billingSettings,
                        commissionRates: {
                          ...billingSettings.commissionRates,
                          merchant: billingSettings.commissionRates?.merchant ?? 10,
                          affiliate: billingSettings.commissionRates?.affiliate ?? 5,
                          factory: val,
                        },
                      };
                      MultiVendorStorage.saveBillingSettings(updated);
                      setBillingSettings(updated);
                    }}
                    className="w-full text-xs font-bold bg-brand-bg border border-brand-dark/10 rounded-lg p-2"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* WOMEN LOUNGE CONFIGURATION SECTION */}
      {activeTab === "women_lounge" && (
        <div className="space-y-6 animate-fadeIn">
          <div className="bg-gradient-to-r from-pink-500/10 via-rose-500/5 to-purple-500/10 border border-pink-200 rounded-3xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-pink-600 text-white grid place-items-center shadow-lg">
                  <Lock className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-lg text-brand-dark">
                    إدارة وتخصيص قسم النساء الخصوصي
                  </h3>
                  <p className="text-xs text-muted-foreground">
                    تكوين نصوص البوابة الخصوصية، تفعيل شرط التأكيد، وإدارة الأقسام الفرعية التي تظهر
                    للنساء فقط.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <label className="text-xs font-bold text-brand-dark">تفعيل القسم:</label>
                <input
                  type="checkbox"
                  checked={womenSettings.enabled}
                  onChange={(e) =>
                    setWomenSettings((prev) => ({ ...prev, enabled: e.target.checked }))
                  }
                  className="w-5 h-5 accent-pink-600 cursor-pointer"
                />
              </div>
            </div>
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              MarketplaceStore.saveWomenLoungeSettings(womenSettings);
              window.dispatchEvent(new Event("storage"));
              toast.success("تم حفظ وتحديث إعدادات قسم النساء الخصوصي بنجاح");
            }}
            className="bg-brand-bg border border-brand-dark/5 rounded-3xl p-6 space-y-6"
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-extrabold text-brand-dark block">
                  عنوان بوابة الخصوصية:
                </label>
                <input
                  type="text"
                  value={womenSettings.gateTitle}
                  onChange={(e) =>
                    setWomenSettings((prev) => ({ ...prev, gateTitle: e.target.value }))
                  }
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-2xl px-4 py-3 outline-none focus:border-pink-500"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-extrabold text-brand-dark block">
                  الوصف الفرعي للبوابة:
                </label>
                <input
                  type="text"
                  value={womenSettings.gateSubtitle}
                  onChange={(e) =>
                    setWomenSettings((prev) => ({ ...prev, gateSubtitle: e.target.value }))
                  }
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-2xl px-4 py-3 outline-none focus:border-pink-500"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-extrabold text-brand-dark block">
                نص إشعار التأكيد والراحة:
              </label>
              <textarea
                rows={2}
                value={womenSettings.gateNoticeText}
                onChange={(e) =>
                  setWomenSettings((prev) => ({ ...prev, gateNoticeText: e.target.value }))
                }
                className="w-full text-xs bg-card border border-brand-dark/10 rounded-2xl p-4 outline-none focus:border-pink-500"
              />
            </div>

            <div className="flex items-center gap-3 bg-pink-50/50 p-4 rounded-2xl border border-pink-100">
              <input
                type="checkbox"
                id="reqConfirm"
                checked={womenSettings.requireConfirmation}
                onChange={(e) =>
                  setWomenSettings((prev) => ({ ...prev, requireConfirmation: e.target.checked }))
                }
                className="w-4 h-4 accent-pink-600 cursor-pointer"
              />
              <label
                htmlFor="reqConfirm"
                className="text-xs font-bold text-pink-950 cursor-pointer"
              >
                اشتراط موافقة الزائرة وتأكيد دخول النساء قبل فتح المنتجات (نافذة البوابة الخصوصية)
              </label>
            </div>

            {/* Subcategories Management */}
            <div className="space-y-3 pt-2">
              <label className="text-xs font-extrabold text-brand-dark block">
                الأقسام والتصنيفات الفرعية لقسم النساء:
              </label>

              <div className="flex flex-wrap gap-2">
                {womenSettings.subcategories.map((sub, idx) => (
                  <span
                    key={idx}
                    className="bg-white border border-pink-200 text-pink-900 font-bold text-xs px-3.5 py-1.5 rounded-2xl flex items-center gap-2 shadow-sm"
                  >
                    {sub}
                    <button
                      type="button"
                      onClick={() =>
                        setWomenSettings((prev) => ({
                          ...prev,
                          subcategories: prev.subcategories.filter((_, i) => i !== idx),
                        }))
                      }
                      className="text-pink-400 hover:text-red-600 cursor-pointer text-sm font-black"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>

              <div className="flex items-center gap-2 max-w-md pt-2">
                <input
                  type="text"
                  placeholder="إضافة قسم فرعي جديد (مثلاً: أرواب ولانجيري)..."
                  value={newSubcatInput}
                  onChange={(e) => setNewSubcatInput(e.target.value)}
                  className="flex-1 text-xs bg-card border border-brand-dark/10 rounded-2xl px-4 py-2.5 outline-none focus:border-pink-500"
                />
                <button
                  type="button"
                  onClick={() => {
                    if (!newSubcatInput.trim()) return;
                    setWomenSettings((prev) => ({
                      ...prev,
                      subcategories: [...prev.subcategories, newSubcatInput.trim()],
                    }));
                    setNewSubcatInput("");
                    toast.success("تمت إضافة التصنيف الفرعي لقسم النساء");
                  }}
                  className="bg-pink-600 text-white font-bold px-4 py-2.5 rounded-2xl text-xs hover:bg-pink-700 transition cursor-pointer"
                >
                  إضافة
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-brand-dark/5 flex justify-end">
              <button
                type="submit"
                className="bg-pink-600 hover:bg-pink-700 text-white font-black px-8 py-3.5 rounded-2xl text-xs shadow-lg transition cursor-pointer flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                حفظ وتطبيق إعدادات قسم النساء
              </button>
            </div>
          </form>
        </div>
      )}

      {/* 1. RBAC SECTION */}
      {activeTab === "rbac" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List existing roles */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-brand-dark mb-1">
                المجموعات الوظيفية الحالية:
              </h3>
              <div className="space-y-3">
                {roles.map((r) => (
                  <div
                    key={r.id}
                    className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 space-y-2"
                  >
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        <Key className="w-4 h-4 text-brand-primary" />
                        <h4 className="font-extrabold text-xs md:text-sm">{r.name}</h4>
                      </div>
                      {r.id !== "role-super-admin" && (
                        <button
                          onClick={() => deleteRole(r.id)}
                          className="w-8 h-8 rounded-lg text-destructive hover:bg-destructive/10 flex items-center justify-center transition"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">{r.description}</p>
                    <div className="flex flex-wrap gap-1.5 pt-1">
                      {r.permissions.map((p) => {
                        const labelObj = ALL_PERMISSIONS.find((x) => x.key === p);
                        return (
                          <span
                            key={p}
                            className="text-[9px] font-bold bg-secondary border border-brand-dark/5 text-brand-dark px-2.5 py-1 rounded-md"
                          >
                            ✓ {labelObj ? labelObj.label : p}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create new role role Form */}
            <form
              onSubmit={handleCreateRole}
              className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 space-y-3 h-fit"
            >
              <h3 className="font-extrabold text-xs md:text-sm flex items-center gap-1.5">
                <Plus className="w-4 h-4 text-brand-accent" /> إنشاء مجموعة صلاحيات مخصصة (RBAC)
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  اسم الدور/المجموعة:
                </label>
                <input
                  required
                  value={newRoleName}
                  onChange={(e) => setNewRoleName(e.target.value)}
                  placeholder="مثال: مدقق جودة المنتجات..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  الوصف الوظيفي:
                </label>
                <textarea
                  value={newRoleDesc}
                  onChange={(e) => setNewRoleDesc(e.target.value)}
                  placeholder="تفاصيل المهام والصلاحيات..."
                  rows={2}
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  تحديد الصلاحيات الممنوحة:
                </label>
                <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                  {ALL_PERMISSIONS.map((p) => (
                    <label
                      key={p.key}
                      className="flex items-center gap-2 text-[10px] font-semibold cursor-pointer"
                    >
                      <input
                        type="checkbox"
                        checked={newRolePerms.includes(p.key)}
                        onChange={() => handleTogglePerm(p.key)}
                        className="w-3.5 h-3.5 accent-brand-accent"
                      />
                      <span>{p.label}</span>
                    </label>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-accent text-brand-dark font-extrabold py-3.5 rounded-xl text-xs hover:bg-amber-500 transition shadow-sm"
              >
                توليد ونشر الدور الوظيفي
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 2. SELLERS SECTION */}
      {activeTab === "sellers" && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-sm text-brand-dark">التجار المسجلين والشركاء:</h3>
            <span className="text-xs text-muted-foreground">تحديث فوري للموافقة والتعليق</span>
          </div>

          <div className="space-y-3">
            {sellers.map((sel) => {
              const activePlan = plans.find((p) => p.id === sel.planId);
              return (
                <div
                  key={sel.id}
                  className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 flex flex-col md:flex-row justify-between gap-4"
                >
                  <div className="flex gap-3 items-center">
                    <div className="w-12 h-12 rounded-xl bg-secondary overflow-hidden flex-shrink-0 flex items-center justify-center">
                      {sel.logoUrl ? (
                        <img
                          src={sel.logoUrl}
                          alt={sel.storeName}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <Building className="w-6 h-6 text-brand-primary/55" />
                      )}
                    </div>
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h4 className="font-bold text-xs md:text-sm truncate">{sel.storeName}</h4>
                        <span
                          className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${
                            sel.status === "approved"
                              ? "bg-emerald-500/10 text-emerald-700"
                              : sel.status === "pending"
                                ? "bg-amber-500/10 text-amber-700"
                                : "bg-destructive/10 text-destructive"
                          }`}
                        >
                          {sel.status === "approved" && "معتمد نشط"}
                          {sel.status === "pending" && "قيد المراجعة والقبول"}
                          {sel.status === "suspended" && "موقوف مؤقتاً"}
                          {sel.status === "rejected" && "مرفوض"}
                        </span>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        المالك: {sel.ownerName} | هاتف: {sel.phone} | بريد: {sel.email}
                      </p>
                      {(sel.commercialRegistration || sel.taxCard) && (
                        <p className="text-[10px] font-bold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          سجل تجاري: {sel.commercialRegistration || "غير مدخل"} | بطاقة ضريبية:{" "}
                          {sel.taxCard || "غير مدخل"}
                        </p>
                      )}

                      <div className="flex flex-col gap-2 p-2.5 bg-secondary/20 rounded-xl border border-brand-dark/5 mt-2">
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            نوع تسجيل البائع:
                          </span>
                          <select
                            value={sel.sellerType || "merchant"}
                            onChange={(e) => {
                              const newType = e.target.value as Seller["sellerType"];
                              let defaultCut = 10;
                              if (newType === "affiliate") defaultCut = 5;
                              if (newType === "factory") defaultCut = 7;
                              const updated = sellers.map((s) =>
                                s.id === sel.id
                                  ? {
                                      ...s,
                                      sellerType: newType,
                                      commissionCut: defaultCut,
                                      isVerifiedCompany:
                                        newType === "factory" ? true : s.isVerifiedCompany,
                                    }
                                  : s,
                              );
                              MarketplaceStore.saveSellers(updated);
                              setSellers(updated);
                              toast.success("تم تحديث نوع الحساب بنجاح");
                            }}
                            className="bg-card border border-brand-dark/10 rounded-lg px-2 py-1 text-[10px] outline-none font-bold"
                          >
                            <option value="merchant">تاجر فردي (Merchant)</option>
                            <option value="affiliate">مسوق بالعمولة (Affiliate)</option>
                            <option value="factory">
                              شركة / مصنع معتمد (Verified Company/Factory)
                            </option>
                          </select>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold text-muted-foreground">
                            عمولة المنصة المحددة للحساب (0% - 20%):
                          </span>
                          <input
                            type="number"
                            min="0"
                            max={20}
                            value={sel.commissionCut ?? 10}
                            onChange={(e) => {
                              const cutVal = Math.min(20, Math.max(0, Number(e.target.value) || 0));
                              const updated = sellers.map((s) =>
                                s.id === sel.id ? { ...s, commissionCut: cutVal } : s,
                              );
                              MarketplaceStore.saveSellers(updated);
                              setSellers(updated);
                            }}
                            className="w-14 bg-card border border-brand-dark/10 rounded-lg px-1.5 py-0.5 text-[10px] text-center font-bold"
                          />
                          <span className="text-[10px] font-bold">%</span>
                        </div>
                        <p className="text-[9px] text-amber-800 font-bold bg-amber-50 p-1.5 rounded-lg border border-amber-200/80 mt-1">
                          {sel.sellerType === "affiliate"
                            ? "💡 للمسوق بالعمولة: عمولة المنصة تُخصم فقط كنسبة من ربح وعمولة المسوق المكتسبة."
                            : "💡 للتاجر أو المصنع: عمولة المنصة تُخصم كنسبة من سعر المنتج وإجمالي قيمة المبيعات."}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 md:justify-end">
                    <div className="flex gap-1.5">
                      {sel.status !== "approved" && (
                        <button
                          onClick={() => updateSellerStatus(sel.id, "approved")}
                          className="bg-emerald-600 text-brand-bg hover:bg-emerald-700 px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition cursor-pointer"
                        >
                          <UserCheck className="w-3.5 h-3.5" /> تفعيل وقبول
                        </button>
                      )}
                      {sel.status === "approved" && (
                        <button
                          onClick={() => updateSellerStatus(sel.id, "suspended")}
                          className="bg-destructive/10 text-destructive hover:bg-destructive hover:text-white px-3 py-1.5 rounded-lg text-[10px] font-bold transition cursor-pointer"
                        >
                          تعليق الحساب
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* 3. PLANS SECTION */}
      {activeTab === "plans" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List plans */}
            <div className="lg:col-span-2 space-y-3">
              <h3 className="font-bold text-sm text-brand-dark">
                الباقات والاشتراكات المتاحة للتسجيل:
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {plans.map((p) => (
                  <div
                    key={p.id}
                    className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 flex flex-col justify-between gap-3 relative overflow-hidden"
                  >
                    <div className="space-y-1">
                      <div className="flex justify-between items-start">
                        <h4 className="font-extrabold text-xs md:text-sm">{p.name}</h4>
                        <span className="text-[9px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full">
                          {p.type === "trial" && "تجريبي"}
                          {p.type === "gift" && "هدية"}
                          {p.type === "lifetime" && "مدى الحياة"}
                          {p.type === "monthly" && "شهري"}
                          {p.type === "yearly" && "سنوي"}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">
                        {p.description}
                      </p>
                      <div className="text-lg font-extrabold text-brand-accent pt-1">
                        {p.price === 0 ? "مجاني" : formatEGP(p.price)}
                      </div>
                      {/* Hidden AI Credits */}
                    </div>

                    <div className="space-y-1 border-t border-brand-dark/5 pt-2">
                      <span className="text-[9px] font-bold text-muted-foreground block">
                        ميزات الباقة:
                      </span>
                      <ul className="space-y-0.5 text-[10px]">
                        {p.features.map((feat, i) => (
                          <li key={i} className="text-brand-dark font-semibold">
                            • {feat}
                          </li>
                        ))}
                      </ul>
                    </div>

                    <div className="flex justify-between items-center pt-1">
                      <button
                        type="button"
                        onClick={() => startEditingPlan(p)}
                        className="text-[10px] text-brand-primary font-bold hover:underline"
                      >
                        تعديل الباقة
                      </button>
                      <button
                        type="button"
                        onClick={() => deletePlan(p.id)}
                        className="text-[10px] text-destructive hover:underline"
                      >
                        حذف الباقة
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Create subscription plan Form */}
            <form
              onSubmit={handleCreatePlan}
              className="bg-brand-bg border border-brand-dark/5 rounded-2xl p-4 space-y-3 h-fit"
            >
              <h3 className="font-extrabold text-xs md:text-sm flex items-center justify-between">
                <span className="flex items-center gap-1.5">
                  <Plus className="w-4 h-4 text-brand-accent" />{" "}
                  {editingPlanId ? "تعديل تفاصيل الباقة" : "إضافة باقة جديدة"}
                </span>
                {editingPlanId && (
                  <button
                    type="button"
                    onClick={cancelEditingPlan}
                    className="text-[10px] text-muted-foreground hover:underline"
                  >
                    إلغاء التعديل
                  </button>
                )}
              </h3>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  اسم الباقة:
                </label>
                <input
                  required
                  value={newPlan.name}
                  onChange={(e) => setNewPlan({ ...newPlan, name: e.target.value })}
                  placeholder="مثال: الباقة البلاتينية الفاخرة..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    السعر (ج.م):
                  </label>
                  <input
                    type="number"
                    required
                    value={newPlan.price}
                    onChange={(e) => setNewPlan({ ...newPlan, price: Number(e.target.value) })}
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-muted-foreground block">
                    نوع الباقة:
                  </label>
                  <select
                    value={newPlan.type}
                    onChange={(e) =>
                      setNewPlan({
                        ...newPlan,
                        type: e.target.value as
                          "monthly" | "yearly" | "lifetime" | "trial" | "gift",
                      })
                    }
                    className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="monthly">شهري</option>
                    <option value="yearly">سنوي</option>
                    <option value="lifetime">مدى الحياة</option>
                    <option value="trial">تجريبي</option>
                    <option value="gift">هدية</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-muted-foreground block">الوصف:</label>
                <input
                  value={newPlan.description}
                  onChange={(e) => setNewPlan({ ...newPlan, description: e.target.value })}
                  placeholder="موجز عن الباقة..."
                  className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2.5"
                />
              </div>

              {/* Hidden AI Credits Field */}

              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-muted-foreground block">
                  ميزات الباقة (أضف الميزة واضغط +):
                </label>
                <div className="flex gap-1.5">
                  <input
                    value={newPlanFeature}
                    onChange={(e) => setNewPlanFeature(e.target.value)}
                    placeholder="مثال: وصول 24/7 للدعم..."
                    className="flex-1 text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addFeatureToPlanForm}
                    className="w-9 h-9 bg-brand-dark text-brand-bg rounded-xl flex items-center justify-center font-bold"
                  >
                    +
                  </button>
                </div>

                <div className="flex flex-wrap gap-1">
                  {newPlan.features?.map((feat, i) => (
                    <span
                      key={i}
                      className="text-[9px] bg-secondary border border-brand-dark/5 px-2 py-1 rounded flex items-center gap-1"
                    >
                      {feat}
                      <button
                        type="button"
                        onClick={() =>
                          setNewPlan((prev) => ({
                            ...prev,
                            features: prev.features?.filter((f) => f !== feat) || [],
                          }))
                        }
                        className="text-destructive font-bold hover:text-red-700"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              <button
                type="submit"
                className="w-full bg-brand-accent text-brand-dark font-extrabold py-3.5 rounded-xl text-xs hover:bg-amber-500 transition"
              >
                {editingPlanId ? "حفظ التعديلات وتحديث الباقة" : "تنشيط وبدء بيع الباقة"}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* 4. VISITORS SECTION */}
      {activeTab === "visitors" && (
        <div className="space-y-4">
          <h3 className="font-bold text-sm text-brand-dark">
            سجلات الزوار والعملاء ومساحات التخزين:
          </h3>
          <div className="border border-brand-dark/5 rounded-2xl overflow-hidden bg-brand-bg">
            <table className="w-full text-right border-collapse text-xs">
              <thead>
                <tr className="bg-secondary/45 border-b border-brand-dark/5">
                  <th className="p-3">الاسم والبيانات</th>
                  <th className="p-3">الدور الحالي</th>
                  <th className="p-3">رصيد الذكاء الاصطناعي</th>
                  <th className="p-3">مساحة التخزين الممنوحة</th>
                  <th className="p-3">تاريخ التسجيل</th>
                  <th className="p-3">الحالة</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-dark/5">
                {visitors.map((vis) => (
                  <tr key={vis.id} className="hover:bg-secondary/15 transition">
                    <td className="p-3">
                      <div className="font-bold">{vis.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {vis.email} | {vis.phone}
                      </div>
                    </td>
                    <td className="p-3 font-semibold text-brand-primary">
                      {vis.role === "visitor" && "زائر عابر"}
                      {vis.role === "customer" && "عميل مشترى"}
                      {vis.role === "seller" && "تاجر مسجل"}
                    </td>
                    <td className="p-3 font-bold">{vis.aiCredits} رصيد</td>
                    <td className="p-3 font-semibold text-emerald-700">
                      {vis.storageCredits} ميجابايت
                    </td>
                    <td className="p-3 text-muted-foreground">
                      {vis.registeredAt && !isNaN(new Date(vis.registeredAt).getTime())
                        ? new Date(vis.registeredAt).toLocaleDateString("ar-EG")
                        : "حديثاً"}
                    </td>
                    <td className="p-3">
                      <span
                        className={`text-[9px] font-extrabold px-2 py-0.5 rounded-full ${
                          vis.status === "active"
                            ? "bg-emerald-500/10 text-emerald-700"
                            : "bg-destructive/10 text-destructive"
                        }`}
                      >
                        {vis.status === "active" ? "نشط" : "معلق"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* 5. COMMISSIONS SECTION (Dynamic 1% - 20% Per Category) */}
      {activeTab === "commissions" && (
        <div className="space-y-6">
          <div className="bg-gradient-to-r from-brand-dark to-slate-900 text-white p-6 rounded-3xl space-y-2 border border-brand-accent/20">
            <h3 className="font-black text-base flex items-center gap-2 text-brand-accent">
              <Percent className="w-5 h-5" />
              تكوين عمولات المنصة لكل قسم تلقائياً (من 1% إلى 20%)
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              كل قسم يتم إنشاؤه في موقع بيتك يظهر هنا تلقائياً ليتيح لك تحديد النسبة المئوية
              المقتطعة للمنصة (تتراوح بين 1% و 20%). التعديلات المعتمدة هنا تنطبق فوراً وفي نفس
              اللحظة على جميع التجار والمتسوقين عبر كامل المنصة.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {commissions.map((comm) => (
              <div
                key={comm.id}
                className="bg-card border border-brand-dark/10 rounded-2xl p-5 space-y-4 shadow-sm hover:border-brand-primary/30 transition"
              >
                <div className="flex items-center justify-between border-b border-brand-dark/5 pb-2">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-xl bg-brand-primary/10 text-brand-primary grid place-items-center font-black text-xs">
                      📁
                    </div>
                    <h4 className="font-extrabold text-sm text-brand-dark">{comm.category}</h4>
                  </div>
                  <span className="text-xs font-black bg-brand-accent/20 text-brand-dark px-2.5 py-1 rounded-lg border border-brand-accent/40">
                    {comm.percentage}%
                  </span>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>تعديل نسبة العمولة للمنتجات (1% - 20%):</span>
                    <span className="font-bold text-brand-primary">{comm.percentage}%</span>
                  </div>

                  <input
                    type="range"
                    min="1"
                    max="20"
                    step="0.5"
                    value={comm.percentage}
                    onChange={(e) => {
                      const newPct = Number(e.target.value);
                      const updated = commissions.map((c) =>
                        c.id === comm.id ? { ...c, percentage: newPct } : c,
                      );
                      saveAll("commissions", updated);
                    }}
                    className="w-full accent-brand-primary cursor-pointer"
                  />

                  <div className="flex items-center gap-2 pt-1">
                    <input
                      type="number"
                      min="1"
                      max="20"
                      step="0.5"
                      value={comm.percentage}
                      onChange={(e) => {
                        const val = Math.min(20, Math.max(1, Number(e.target.value) || 1));
                        const updated = commissions.map((c) =>
                          c.id === comm.id ? { ...c, percentage: val } : c,
                        );
                        saveAll("commissions", updated);
                      }}
                      className="w-20 bg-white border border-brand-dark/10 rounded-xl px-2 py-1 text-xs text-center font-black"
                    />
                    <span className="text-xs font-bold text-muted-foreground">
                      % عمولة رسمية للمنصة
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
