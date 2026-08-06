import React, { useState, useEffect, useCallback } from "react";
import {
  CreditCard,
  TrendingUp,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Percent,
  Plus,
  RefreshCw,
  Clock,
  Coins,
  History,
  FileText,
  BadgePercent,
  Send,
} from "lucide-react";
import {
  MultiVendorStorage,
  SellerWallet,
  WithdrawalRequest,
  BillingSettings,
  CommissionPayment,
  BillingInvoice,
} from "@/lib/multiVendorStorage";
import { MarketplaceStore, Seller } from "@/lib/marketplaceStore";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { formatEGP } from "@/lib/cart";

interface SellerWalletViewProps {
  sellerId: string;
  isSuperAdmin: boolean;
}

interface OrderItem {
  id: string;
  price: number | string;
  quantity?: number;
  name?: string;
}

interface OrderRow {
  id: string;
  status: string;
  items: unknown;
  created_at: string;
  customer_name: string;
  total: number;
}

export function SellerWalletView({ sellerId, isSuperAdmin }: SellerWalletViewProps) {
  const [wallet, setWallet] = useState<SellerWallet | null>(null);
  const [withdrawals, setWithdrawals] = useState<WithdrawalRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"overview" | "payment_history" | "requests">(
    "overview",
  );

  // Real orders for dynamic computation
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(true);

  // Billing Settings & Payment Data
  const [billingSettings, setBillingSettings] = useState<BillingSettings>(() =>
    MultiVendorStorage.getBillingSettings(),
  );
  const [payments, setPayments] = useState<CommissionPayment[]>([]);
  const [invoices, setInvoices] = useState<BillingInvoice[]>([]);

  // Withdrawal form inputs
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawMethod, setWithdrawMethod] = useState<
    "vodafone_cash" | "instapay" | "bank_transfer"
  >("vodafone_cash");
  const [withdrawDetails, setWithdrawDetails] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Commission Payment form inputs
  const [payAmount, setPayAmount] = useState("");
  const [payMethod, setPayMethod] = useState("");
  const [payRef, setPayRef] = useState("");
  const [payNotes, setPayNotes] = useState("");
  const [isPaying, setIsPaying] = useState(false);

  const fetchRealOrders = useCallback(async () => {
    try {
      setLoadingOrders(true);
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setOrders(data);
      }
    } catch (e) {
      console.error("Error loading orders for wallet:", e);
    } finally {
      setLoadingOrders(false);
    }
  }, []);

  const loadWalletData = useCallback(() => {
    const activeWallet = MultiVendorStorage.getWallet(sellerId);
    setWallet(activeWallet);

    const allWithdrawals = MultiVendorStorage.getWithdrawalRequests();
    const filteredWithdrawals = isSuperAdmin
      ? allWithdrawals
      : allWithdrawals.filter((w) => w.sellerId === sellerId);
    setWithdrawals(filteredWithdrawals);

    const allPayments = MultiVendorStorage.getCommissionPayments();
    setPayments(allPayments.filter((p) => p.sellerId === sellerId));

    const allInvoices = MultiVendorStorage.getBillingInvoices(sellerId);
    setInvoices(allInvoices);
  }, [isSuperAdmin, sellerId]);

  useEffect(() => {
    loadWalletData();
    fetchRealOrders();

    const handleBillingUpdate = () => {
      setBillingSettings(MultiVendorStorage.getBillingSettings());
      setPayments(
        MultiVendorStorage.getCommissionPayments().filter((p) => p.sellerId === sellerId),
      );
      setInvoices(MultiVendorStorage.getBillingInvoices(sellerId));
    };

    window.addEventListener("beitak-billing-settings-updated", handleBillingUpdate);
    window.addEventListener("beitak-billing-payments-updated", handleBillingUpdate);
    return () => {
      window.removeEventListener("beitak-billing-settings-updated", handleBillingUpdate);
      window.removeEventListener("beitak-billing-payments-updated", handleBillingUpdate);
    };
  }, [sellerId, loadWalletData, fetchRealOrders]);

  // Dynamic calculations based on real orders
  const completedOrders = orders.filter((o) => o.status === "delivered");

  let sellerTotalSales = 0;
  let sellerCompletedOrdersCount = 0;
  let sellerOutstandingCommissions = 0;

  completedOrders.forEach((order) => {
    let hasSellerItems = false;
    let itemsList: OrderItem[] = [];
    try {
      if (typeof order.items === "string") {
        itemsList = JSON.parse(order.items) as OrderItem[];
      } else if (Array.isArray(order.items)) {
        itemsList = order.items as OrderItem[];
      }
    } catch (e) {
      console.error(e);
    }

    itemsList.forEach((item: OrderItem) => {
      const itemSellerId = MultiVendorStorage.getProductSeller(item.id);
      if (itemSellerId === sellerId) {
        hasSellerItems = true;
        const itemPrice = Number(item.price);
        const itemQty = Number(item.quantity || 1);
        const itemTotal = itemPrice * itemQty;
        sellerTotalSales += itemTotal;

        const sellerObj = MarketplaceStore.getSellers().find((s) => s.id === sellerId);
        const sellerType = sellerObj?.sellerType || "merchant";
        const cut = sellerObj?.commissionCut ?? 10;

        let commissionForThisItem = 0;
        if (sellerType === "affiliate") {
          // For affiliate sellers: Platform cut is calculated ONLY from the affiliate's earned margin (e.g. 10%)
          const affiliateMarginAmount = itemTotal * 0.1;
          commissionForThisItem = affiliateMarginAmount * (cut / 100);
        } else {
          // For merchants and factories: Platform cut is calculated from total product sales price
          const productMeta = MarketplaceStore.getProductMetadata(item.id);
          const rate = productMeta.commissionRate ?? cut ?? billingSettings.commissionRateDefault;
          commissionForThisItem = itemTotal * (rate / 100);
        }

        sellerOutstandingCommissions += commissionForThisItem;
      }
    });

    if (hasSellerItems) {
      sellerCompletedOrdersCount++;
    }
  });

  const paidCommissionsSum = payments
    .filter((p) => p.status === "approved")
    .reduce((acc, curr) => acc + curr.amount, 0);

  const remainingBalance = Math.max(0, sellerOutstandingCommissions - paidCommissionsSum);

  // Compute upcoming payment due date (e.g. 15 days from latest order or current date)
  const upcomingDueDate = new Date();
  upcomingDueDate.setDate(upcomingDueDate.getDate() + billingSettings.commissionDuePeriodDays);

  const handleCreateWithdrawal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!wallet) return;

    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) {
      toast.error("يرجى كتابة مبلغ سحب صحيح");
      return;
    }

    if (amount > wallet.withdrawableBalance) {
      toast.error("المبلغ المدخل يتجاوز رصيدك المتاح للسحب حالياً!");
      return;
    }

    if (!withdrawDetails.trim()) {
      toast.error("يرجى إدخال تفاصيل وسيلة السحب بدقة");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const storeName =
        MarketplaceStore.getSellers().find((s) => s.id === sellerId)?.storeName || "متجر بائع";

      const newRequest: WithdrawalRequest = {
        id: "with-" + Date.now(),
        sellerId,
        storeName,
        amount,
        method: withdrawMethod,
        details: withdrawDetails,
        status: "pending",
        createdAt: new Date().toISOString(),
        withdrawalFee:
          withdrawMethod === "bank_transfer" ? 25 : withdrawMethod === "instapay" ? 5 : 10,
      };

      const updatedBalance = wallet.withdrawableBalance - amount;
      MultiVendorStorage.updateWallet(sellerId, {
        withdrawableBalance: updatedBalance,
        availableBalance: wallet.availableBalance - amount,
      });

      const current = MultiVendorStorage.getWithdrawalRequests();
      MultiVendorStorage.saveWithdrawalRequests([newRequest, ...current]);

      toast.success("تم تقديم طلب السحب للإدارة بنجاح!");
      setWithdrawAmount("");
      setWithdrawDetails("");
      setIsSubmitting(false);
      loadWalletData();
    }, 1000);
  };

  const handlePayPlatformCommission = (e: React.FormEvent) => {
    e.preventDefault();
    const amount = Number(payAmount);
    if (!amount || amount <= 0) {
      return toast.error("يرجى كتابة مبلغ صحيح");
    }
    if (!payMethod) {
      return toast.error("يرجى اختيار طريقة الدفع");
    }
    if (!payRef.trim()) {
      return toast.error("يرجى كتابة الرقم المرجعي أو رقم التحويل لتوثيق السداد");
    }

    setIsPaying(true);
    setTimeout(() => {
      MultiVendorStorage.addCommissionPayment({
        sellerId,
        amount,
        paymentMethod: payMethod,
        transactionRef: payRef.trim(),
        notes: payNotes.trim() || undefined,
      });
      toast.success("تم تسجيل عملية الدفع بنجاح وهي قيد الاعتماد!");
      setPayAmount("");
      setPayRef("");
      setPayNotes("");
      setIsPaying(false);
      loadWalletData();
    }, 1000);
  };

  const handleUpdateWithdrawalStatus = (requestId: string, status: "approved" | "rejected") => {
    const all = MultiVendorStorage.getWithdrawalRequests();
    const updated = all.map((req) => {
      if (req.id === requestId) {
        if (status === "rejected") {
          const sWallet = MultiVendorStorage.getWallet(req.sellerId);
          MultiVendorStorage.updateWallet(req.sellerId, {
            withdrawableBalance: sWallet.withdrawableBalance + req.amount,
            availableBalance: sWallet.availableBalance + req.amount,
          });
        } else if (status === "approved") {
          const sWallet = MultiVendorStorage.getWallet(req.sellerId);
          MultiVendorStorage.updateWallet(req.sellerId, {
            totalWithdrawals: sWallet.totalWithdrawals + req.amount,
          });
        }
        return { ...req, status };
      }
      return req;
    });

    MultiVendorStorage.saveWithdrawalRequests(updated);
    toast.success(
      status === "approved"
        ? "تمت الموافقة على طلب السحب بنجاح!"
        : "تم رفض طلب السحب وإرجاع الرصيد للمحفظة.",
    );
    loadWalletData();
  };

  const handleUpdatePaymentStatus = (paymentId: string, status: "approved" | "rejected") => {
    const all = MultiVendorStorage.getCommissionPayments();
    const updated = all.map((p) => {
      if (p.id === paymentId) {
        return { ...p, status };
      }
      return p;
    });
    MultiVendorStorage.saveCommissionPayments(updated);
    toast.success(`تم ${status === "approved" ? "اعتماد" : "رفض"} دفعة العمولات بنجاح!`);
    loadWalletData();
  };

  if (!wallet) return <p className="text-xs text-center py-10">جاري تحميل المحفظة المالية...</p>;

  return (
    <div className="space-y-6">
      {/* Dynamic Statistics Board */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {/* Total Sales */}
        <div className="bg-card border border-brand-dark/5 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-muted-foreground font-bold">
              إجمالي المبيعات (COD)
            </span>
            <TrendingUp className="w-4 h-4 text-brand-primary" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-brand-dark block" dir="ltr">
              {formatEGP(sellerTotalSales)}
            </span>
            <span className="text-[9px] text-muted-foreground block">
              من {sellerCompletedOrdersCount} طلب مكتمل ومسلم للعميل
            </span>
          </div>
        </div>

        {/* Outstanding commissions */}
        <div className="bg-amber-500/10 border border-amber-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-amber-800 font-bold">عمولات المنصة المستحقة</span>
            <Percent className="w-4 h-4 text-amber-600" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-amber-700 block" dir="ltr">
              {formatEGP(sellerOutstandingCommissions)}
            </span>
            <span className="text-[9px] text-amber-600 font-medium block">
              العمولات المحتسبة لصالح المنصة
            </span>
          </div>
        </div>

        {/* Paid commissions */}
        <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-emerald-800 font-bold">العمولات المدفوعة مسبقاً</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-emerald-700 block" dir="ltr">
              {formatEGP(paidCommissionsSum)}
            </span>
            <span className="text-[9px] text-emerald-600 font-medium block">
              إجمالي المدفوعات المعتمدة
            </span>
          </div>
        </div>

        {/* Remaining Outstanding Balance */}
        <div className="bg-brand-dark text-brand-bg rounded-2xl p-4 flex flex-col justify-between shadow-xs">
          <div className="flex justify-between items-start">
            <span className="text-[10px] text-brand-accent font-bold">صافي المتبقي للمنصة</span>
            <Coins className="w-4 h-4 text-brand-accent" />
          </div>
          <div className="mt-2">
            <span className="text-lg font-black text-brand-bg block" dir="ltr">
              {formatEGP(remainingBalance)}
            </span>
            <span className="text-[9px] text-brand-accent font-medium block flex items-center gap-1">
              <Clock className="w-3 h-3" /> مستحق سدادها بحلول:{" "}
              {upcomingDueDate.toLocaleDateString("ar-EG")}
            </span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-brand-dark/10">
        <button
          onClick={() => setActiveTab("overview")}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition ${
            activeTab === "overview"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-muted-foreground hover:text-brand-dark"
          }`}
        >
          نظرة عامة وسداد العمولات
        </button>
        <button
          onClick={() => setActiveTab("payment_history")}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition ${
            activeTab === "payment_history"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-muted-foreground hover:text-brand-dark"
          }`}
        >
          الفواتير وسجل السداد ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab("requests")}
          className={`py-3 px-4 font-bold text-xs border-b-2 transition ${
            activeTab === "requests"
              ? "border-brand-primary text-brand-primary"
              : "border-transparent text-muted-foreground hover:text-brand-dark"
          }`}
        >
          سحب الأرباح والتحويلات ({withdrawals.length})
        </button>
      </div>

      {/* Content Area */}
      <div className="space-y-4">
        {/* Tab 1: Overview & Pay Commission Form */}
        {activeTab === "overview" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2 space-y-4">
              {/* Warnings and Rules Card */}
              <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-brand-primary" /> قيد المحاسبة والسياسات
                  المالية
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs leading-relaxed text-muted-foreground">
                  <div className="bg-brand-bg p-3 rounded-xl border border-brand-dark/5">
                    <p className="font-bold text-brand-dark mb-1">دورة الفوترة الحالية</p>
                    <p>
                      الفوترة تتم بشكل{" "}
                      <span className="font-bold text-brand-primary">
                        {billingSettings.billingCycle === "monthly" ? "شهري" : "أسبوعي"}
                      </span>{" "}
                      مستمر.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded-xl border border-brand-dark/5">
                    <p className="font-bold text-brand-dark mb-1">الحد الأقصى للمديونية</p>
                    <p>
                      إذا تجاوز المتبقي للمنصة مبلغ{" "}
                      <span className="font-bold text-destructive">
                        {formatEGP(billingSettings.outstandingBalanceRuleLimit)}
                      </span>
                      ، قد يتم تعليق حساب البائع مؤقتاً.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded-xl border border-brand-dark/5">
                    <p className="font-bold text-brand-dark mb-1">نسبة العمولة التلقائية</p>
                    <p>
                      تحتسب المنصة عمولة افتراضية قدرها{" "}
                      <span className="font-bold text-brand-primary">
                        {billingSettings.commissionRateDefault}%
                      </span>{" "}
                      على المبيعات ما لم يحدد خلاف ذلك في المنتج.
                    </p>
                  </div>
                  <div className="bg-brand-bg p-3 rounded-xl border border-brand-dark/5">
                    <p className="font-bold text-brand-dark mb-1">الرصيد الجاري للسحب</p>
                    <p>
                      لديك حالياً{" "}
                      <span className="font-bold text-emerald-600">
                        {formatEGP(wallet.withdrawableBalance)}
                      </span>{" "}
                      متاح للسحب النقدي الفوري.
                    </p>
                  </div>
                </div>
              </div>

              {/* Outstanding Orders list for validation */}
              <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-3">
                <h3 className="font-bold text-xs flex items-center gap-1.5">
                  <BadgePercent className="w-4 h-4 text-brand-primary" /> تفاصيل عمولات المبيعات
                  الأخيرة
                </h3>
                <div className="overflow-x-auto text-[11px]">
                  <table className="w-full text-right border-collapse">
                    <thead>
                      <tr className="border-b border-brand-dark/10 text-muted-foreground">
                        <th className="pb-2">رقم الطلب</th>
                        <th className="pb-2">تاريخ الطلب</th>
                        <th className="pb-2">العميل</th>
                        <th className="pb-2">قيمة منتجاتك</th>
                        <th className="pb-2">العمولة المحتسبة</th>
                      </tr>
                    </thead>
                    <tbody>
                      {completedOrders.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-4 text-center text-muted-foreground">
                            لا توجد طلبات مكتملة حالياً لتسجيل عمولاتها.
                          </td>
                        </tr>
                      ) : (
                        completedOrders.map((order) => {
                          let orderSellerTotal = 0;
                          let orderSellerCommission = 0;
                          let itemsList: OrderItem[] = [];
                          try {
                            if (typeof order.items === "string") {
                              itemsList = JSON.parse(order.items) as OrderItem[];
                            } else if (Array.isArray(order.items)) {
                              itemsList = order.items as OrderItem[];
                            }
                          } catch (e) {
                            console.error(e);
                          }

                          itemsList.forEach((item: OrderItem) => {
                            if (MultiVendorStorage.getProductSeller(item.id) === sellerId) {
                              const total = Number(item.price) * Number(item.quantity || 1);
                              orderSellerTotal += total;
                              const productMeta = MarketplaceStore.getProductMetadata(item.id);
                              const rate =
                                productMeta.commissionRate ?? billingSettings.commissionRateDefault;
                              orderSellerCommission += total * (rate / 100);
                            }
                          });

                          if (orderSellerTotal === 0) return null;

                          return (
                            <tr
                              key={order.id}
                              className="border-b border-brand-dark/5 hover:bg-neutral-50"
                            >
                              <td className="py-2.5 font-mono">#{order.id.substring(0, 8)}</td>
                              <td className="py-2.5">
                                {new Date(order.created_at).toLocaleDateString("ar-EG")}
                              </td>
                              <td className="py-2.5">{order.customer_name}</td>
                              <td className="py-2.5 font-bold">{formatEGP(orderSellerTotal)}</td>
                              <td className="py-2.5 font-bold text-amber-600">
                                {formatEGP(orderSellerCommission)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Platform Payment Submission Form */}
            <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-4 h-fit">
              <div className="border-b border-brand-dark/5 pb-2">
                <h3 className="font-bold text-xs text-brand-dark flex items-center gap-1.5">
                  <Send className="w-4 h-4 text-brand-primary" /> سداد عمولات المنصة
                </h3>
                <p className="text-[10px] text-muted-foreground mt-1">
                  قم بتحويل العمولات للمنصة وسجل بيانات العملية هنا للتأكيد الفوري.
                </p>
              </div>

              <form onSubmit={handlePayPlatformCommission} className="space-y-3">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark block">
                    المبلغ المراد سداده (ج.م)
                  </label>
                  <input
                    type="number"
                    required
                    placeholder="المبلغ بالجنيه"
                    value={payAmount}
                    onChange={(e) => setPayAmount(e.target.value)}
                    className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark block">
                    طريقة السداد المستخدمة
                  </label>
                  <select
                    required
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value)}
                    className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  >
                    <option value="">— اختر طريقة السداد —</option>
                    {billingSettings.paymentMethods.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark block">
                    الرقم المرجعي / رقم معاملة التحويل
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="رقم العملية أو المحفظة المحول منها"
                    value={payRef}
                    onChange={(e) => setPayRef(e.target.value)}
                    className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                  />
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-brand-dark block">
                    ملاحظات إضافية (اختياري)
                  </label>
                  <textarea
                    rows={2}
                    placeholder="اكتب أي ملاحظات كـ (الاسم المحول منه...)"
                    value={payNotes}
                    onChange={(e) => setPayNotes(e.target.value)}
                    className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isPaying}
                  className="w-full bg-brand-dark text-brand-bg text-xs font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
                >
                  {isPaying ? (
                    <>
                      <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                      جاري تسجيل دفعة السداد...
                    </>
                  ) : (
                    <>تسجيل وتأكيد الدفع</>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* Tab 2: Billing & Payment History */}
        {activeTab === "payment_history" && (
          <div className="space-y-6">
            {/* Payment history table */}
            <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-xs flex items-center gap-1.5">
                <History className="w-4 h-4 text-brand-primary" /> سجل دفعات سداد العمولات المرسلة
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 text-muted-foreground">
                      <th className="pb-2">معرف الدفعة</th>
                      <th className="pb-2">تاريخ الإرسال</th>
                      <th className="pb-2">المبلغ</th>
                      <th className="pb-2">طريقة السداد</th>
                      <th className="pb-2">الرقم المرجعي</th>
                      <th className="pb-2">ملاحظات البائع</th>
                      <th className="pb-2">حالة الدفعة</th>
                      {isSuperAdmin && <th className="pb-2">إجراءات المدير</th>}
                    </tr>
                  </thead>
                  <tbody>
                    {payments.length === 0 ? (
                      <tr>
                        <td
                          colSpan={isSuperAdmin ? 8 : 7}
                          className="py-8 text-center text-muted-foreground"
                        >
                          لم يتم تسجيل أي عمليات دفع عمولات سابقة لهذا المتجر.
                        </td>
                      </tr>
                    ) : (
                      payments.map((p) => (
                        <tr key={p.id} className="border-b border-brand-dark/5 hover:bg-neutral-50">
                          <td className="py-3 font-mono text-[10px]">#{p.id.substring(0, 8)}</td>
                          <td className="py-3">{new Date(p.paidAt).toLocaleString("ar-EG")}</td>
                          <td className="py-3 font-bold text-emerald-600">{formatEGP(p.amount)}</td>
                          <td className="py-3">{p.paymentMethod}</td>
                          <td className="py-3 font-mono">{p.transactionRef}</td>
                          <td className="py-3 text-muted-foreground max-w-xs truncate">
                            {p.notes || "لا يوجد"}
                          </td>
                          <td className="py-3">
                            {p.status === "approved" ? (
                              <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                مقبولة ومعتمدة
                              </span>
                            ) : p.status === "rejected" ? (
                              <span className="text-destructive bg-destructive/10 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                مرفوضة
                              </span>
                            ) : (
                              <span className="text-amber-600 bg-amber-50 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                                قيد الانتظار
                              </span>
                            )}
                          </td>
                          {isSuperAdmin && (
                            <td className="py-3">
                              {p.status === "approved" ? (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, "rejected")}
                                  className="text-destructive font-bold text-[10px] hover:underline"
                                >
                                  إلغاء الاعتماد
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleUpdatePaymentStatus(p.id, "approved")}
                                  className="text-emerald-600 font-bold text-[10px] hover:underline"
                                >
                                  اعتماد السداد
                                </button>
                              )}
                            </td>
                          )}
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Invoices list */}
            <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-3">
              <h3 className="font-bold text-xs flex items-center gap-1.5">
                <FileText className="w-4 h-4 text-brand-primary" /> كشف الحساب وفواتير العمولات
                الدورية
              </h3>
              <div className="overflow-x-auto">
                <table className="w-full text-right border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-brand-dark/10 text-muted-foreground">
                      <th className="pb-2">رقم الفاتورة</th>
                      <th className="pb-2">فترة الفوترة</th>
                      <th className="pb-2">إجمالي المبيعات</th>
                      <th className="pb-2">عدد الطلبات</th>
                      <th className="pb-2">العمولة المطلوبة</th>
                      <th className="pb-2">تاريخ الاستحقاق</th>
                      <th className="pb-2">الحالة</th>
                    </tr>
                  </thead>
                  <tbody>
                    {invoices.map((inv) => (
                      <tr key={inv.id} className="border-b border-brand-dark/5 hover:bg-neutral-50">
                        <td className="py-3 font-mono text-[10px]">#{inv.id}</td>
                        <td className="py-3">
                          {new Date(inv.billingPeriodStart).toLocaleDateString("ar-EG")} -{" "}
                          {new Date(inv.billingPeriodEnd).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="py-3 font-bold">{formatEGP(inv.totalSales)}</td>
                        <td className="py-3">{inv.completedOrdersCount} طلباً</td>
                        <td className="py-3 font-bold text-brand-primary">
                          {formatEGP(inv.commissionOwed)}
                        </td>
                        <td className="py-3">
                          {new Date(inv.dueDate).toLocaleDateString("ar-EG")}
                        </td>
                        <td className="py-3">
                          {inv.status === "paid" ? (
                            <span className="text-emerald-600 bg-emerald-50 border border-emerald-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              مسددة
                            </span>
                          ) : inv.status === "overdue" ? (
                            <span className="text-destructive bg-destructive/10 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              متأخرة
                            </span>
                          ) : (
                            <span className="text-amber-600 bg-amber-50 border border-amber-200 text-[10px] font-bold px-2 py-0.5 rounded-md">
                              مفتوحة للتحصيل
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Tab 3: Withdrawal requests & cash out */}
        {activeTab === "requests" && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Request Withdrawal Form */}
            {!isSuperAdmin && (
              <div className="bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-4 h-fit">
                <div className="flex items-center gap-2 border-b border-brand-dark/5 pb-2">
                  <CreditCard className="w-4 h-4 text-brand-primary" />
                  <h3 className="font-bold text-xs text-brand-dark">طلب سحب رصيد وأرباح</h3>
                </div>

                <form onSubmit={handleCreateWithdrawal} className="space-y-3">
                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-dark block">
                      المبلغ المراد سحبه (ج.م)
                    </label>
                    <input
                      type="number"
                      placeholder="المبلغ المطلوب سحبه"
                      value={withdrawAmount}
                      onChange={(e) => setWithdrawAmount(e.target.value)}
                      className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                    />
                    <span className="text-[9px] text-muted-foreground block">
                      رصيدك المتاح للسحب حالياً: {formatEGP(wallet.withdrawableBalance)}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-dark block">
                      وسيلة السحب المالي
                    </label>
                    <select
                      value={withdrawMethod}
                      onChange={(e) =>
                        setWithdrawMethod(
                          e.target.value as "vodafone_cash" | "instapay" | "bank_transfer",
                        )
                      }
                      className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                    >
                      <option value="vodafone_cash">محفظة فودافون كاش (رسوم 10 ج)</option>
                      <option value="instapay">إنستاباي Instapay (رسوم 5 ج)</option>
                      <option value="bank_transfer">تحويل حساب بنكي (رسوم 25 ج)</option>
                    </select>
                  </div>

                  <div className="space-y-1">
                    <label className="text-[10px] font-bold text-brand-dark block">
                      تفاصيل الحساب / الهاتف
                    </label>
                    <input
                      type="text"
                      placeholder={
                        withdrawMethod === "vodafone_cash"
                          ? "رقم محفظة الكاش (010xxxxxxx)"
                          : withdrawMethod === "instapay"
                            ? "عنوان الدفع الخاص بإنستاباي"
                            : "رقم الحساب البنكي / الآيبان IBAN واسم البنك"
                      }
                      value={withdrawDetails}
                      onChange={(e) => setWithdrawDetails(e.target.value)}
                      className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2.5 focus:outline-none"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-brand-primary text-brand-bg text-xs font-bold py-3 rounded-xl hover:opacity-90 transition flex items-center justify-center gap-2 cursor-pointer"
                  >
                    {isSubmitting ? (
                      <>
                        <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                        جاري التقديم الآمن...
                      </>
                    ) : (
                      <>تقديم طلب التحويل المالي</>
                    )}
                  </button>
                </form>
              </div>
            )}

            {/* Withdrawal requests history table */}
            <div
              className={`${isSuperAdmin ? "md:col-span-3" : "md:col-span-2"} bg-card border border-brand-dark/5 rounded-2xl p-5 space-y-4`}
            >
              <div className="flex justify-between items-center border-b border-brand-dark/5 pb-2">
                <h3 className="font-bold text-xs text-brand-dark">
                  {isSuperAdmin
                    ? "مراقبة واعتماد طلبات السحب بكافة المتاجر"
                    : "سجل الحركات المالية والطلبات مسبقاً"}
                </h3>
              </div>

              <div className="space-y-3 overflow-y-auto max-h-[400px] pr-1">
                {withdrawals.map((w) => (
                  <div
                    key={w.id}
                    className="bg-brand-bg border border-brand-dark/5 rounded-xl p-4 flex flex-col md:flex-row justify-between items-start md:items-center gap-3 text-xs"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-brand-dark">{formatEGP(w.amount)}</span>
                        <span className="text-[9px] bg-secondary text-brand-dark px-2 py-0.5 rounded-md font-semibold">
                          {w.method === "vodafone_cash"
                            ? "فودافون كاش"
                            : w.method === "instapay"
                              ? "إنستاباي"
                              : "حساب بنكي"}
                        </span>
                        {isSuperAdmin && (
                          <span className="text-[10px] text-brand-primary font-bold">
                            (متجر: {w.storeName})
                          </span>
                        )}
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        تفاصيل المستلم:{" "}
                        <span className="text-brand-dark font-medium">{w.details}</span>
                      </p>
                      <span className="text-[9px] text-muted-foreground block">
                        تقديم الطلب: {new Date(w.createdAt).toLocaleString("ar-EG")} | رسوم التحويل:{" "}
                        {w.withdrawalFee} ج.م
                      </span>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {w.status === "pending" ? (
                        isSuperAdmin ? (
                          <div className="flex gap-1">
                            <button
                              onClick={() => handleUpdateWithdrawalStatus(w.id, "approved")}
                              className="bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              موافقة وتحويل
                            </button>
                            <button
                              onClick={() => handleUpdateWithdrawalStatus(w.id, "rejected")}
                              className="bg-destructive hover:bg-destructive/90 text-white font-bold text-[10px] px-3 py-1.5 rounded-xl transition cursor-pointer"
                            >
                              رفض الطلب
                            </button>
                          </div>
                        ) : (
                          <span className="text-amber-600 bg-amber-50 border border-amber-150 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                            <AlertCircle className="w-3.5 h-3.5 animate-spin" />
                            قيد مراجعة الإدارة
                          </span>
                        )
                      ) : w.status === "approved" ? (
                        <span className="text-emerald-600 bg-emerald-50 border border-emerald-150 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          مكتملة ومحولة بنجاح
                        </span>
                      ) : (
                        <span className="text-destructive bg-destructive/10 text-[10px] font-bold px-2.5 py-1 rounded-full flex items-center gap-1">
                          <XCircle className="w-3.5 h-3.5" />
                          مرفوضة من الإدارة
                        </span>
                      )}
                    </div>
                  </div>
                ))}

                {withdrawals.length === 0 && (
                  <p className="text-xs text-center py-12 text-muted-foreground">
                    مفيش حركات تحويل مسجلة لغاية دلوقتي.
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
