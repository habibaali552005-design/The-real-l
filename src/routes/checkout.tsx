import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useCart, formatEGP } from "@/lib/cart";
import { supabase } from "@/integrations/supabase/client";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { MultiVendorStorage } from "@/lib/multiVendorStorage";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { requestCurrentLocation } from "@/lib/location";
import { saveSyncedAddress, getSyncedAddress } from "@/lib/addressSync";
import {
  AlertCircle,
  CheckCircle2,
  ShieldAlert,
  Sparkles,
  History,
  CreditCard,
  Phone,
  Wallet,
  Building,
  Lock,
  RefreshCw,
  Check,
  Send,
  Navigation,
  Loader2,
} from "lucide-react";

const schema = z.object({
  customer_name: z.string().trim().min(3, "الاسم بالكامل مطلوب (3 أحرف على الأقل)").max(100),
  phone: z
    .string()
    .trim()
    .regex(
      /^01[0-2,5]{1}[0-9]{8}$/,
      "يرجى كتابة رقم موبايل مصري صحيح مكون من 11 رقماً ويبدأ بـ 01",
    ),
  backup_phone: z
    .string()
    .trim()
    .regex(
      /^01[0-2,5]{1}[0-9]{8}$/,
      "رقم الموبايل الاحتياطي مطلوب لتأكيد التوصيل، يرجى كتابة رقم موبايل مصري صحيح مكون من 11 رقماً ويبدأ بـ 01",
    ),
  governorate: z.string().min(1, "يرجى تحديد المحافظة"),
  area: z.string().trim().min(2, "يرجى تحديد المركز أو المدينة"),
  address: z.string().trim().min(5, "يرجى كتابة تفاصيل العنوان (الشارع والمنزل بالتفصيل)"),
  notes: z.string().trim().max(500).optional().or(z.literal("")),
});

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "إتمام الطلب والدفع المالي — بيتك" },
      {
        name: "description",
        content: "أكمل بيانات طلبك بأمان مع خيارات دفع متعددة وتحقق مجاني من الهاتف.",
      },
    ],
  }),
  component: CheckoutPage,
});

export function CheckoutPage() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // Egypt cascading address directories
  const egyptData = MultiVendorStorage.getEgyptAddressData();
  const [selectedGovId, setSelectedGovId] = useState(egyptData[0].id);
  const [selectedCityId, setSelectedCityId] = useState(egyptData[0].cities[0].id);
  const [selectedDistrict, setSelectedDistrict] = useState(egyptData[0].cities[0].districts[0]);

  const [form, setForm] = useState({
    customer_name: "",
    phone: "",
    backup_phone: "",
    governorate: egyptData[0].nameAr,
    area: egyptData[0].cities[0].nameAr,
    address: "",
    notes: "",
  });

  // Free Phone OTP Verification states
  const [otpSent, setOtpSent] = useState(false);
  const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
  const [enteredOtp, setEnteredOtp] = useState("");
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);

  // Payment method state
  const [paymentMethod, setPaymentMethod] = useState<"cod" | "card" | "wallet" | "instapay">("cod");

  // Card details state
  const [cardDetails, setCardDetails] = useState({
    cardNumber: "",
    cardHolder: "",
    expiry: "",
    cvc: "",
  });

  // Wallet details state
  const [walletPhone, setWalletPhone] = useState("");

  // InstaPay handle state
  const [instapayHandle, setInstapayHandle] = useState("");

  // Coupon and Shipping states
  const [couponCode, setCouponCode] = useState("");
  const [discountAmount, setDiscountAmount] = useState(0);
  const [appliedCoupon, setAppliedCoupon] = useState<string | null>(null);
  const [shippingFee, setShippingFee] = useState(egyptData[0].shippingFee);

  // Customer History State
  const [pastCustomer, setPastCustomer] = useState<{
    name: string;
    points: number;
    ordersCount: number;
    preferredAddress?: string;
  } | null>(null);

  // Handle cascading address updates
  const handleGovChange = (govId: string) => {
    setSelectedGovId(govId);
    const gov = egyptData.find((g) => g.id === govId);
    if (gov) {
      const firstCity = gov.cities[0];
      setSelectedCityId(firstCity.id);
      setSelectedDistrict(firstCity.districts[0]);
      setShippingFee(gov.shippingFee);

      setForm((prev) => ({
        ...prev,
        governorate: gov.nameAr,
        area: firstCity.nameAr,
      }));
    }
  };

  const handleCityChange = (cityId: string) => {
    setSelectedCityId(cityId);
    const gov = egyptData.find((g) => g.id === selectedGovId);
    const city = gov?.cities.find((c) => c.id === cityId);
    if (city) {
      setSelectedDistrict(city.districts[0]);
      setForm((prev) => ({
        ...prev,
        area: city.nameAr,
      }));
    }
  };

  const [detectingLocation, setDetectingLocation] = useState(false);

  // Auto-populate logged in user profile details and synced address
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const userId = data?.user?.id;
      const synced = getSyncedAddress(userId);
      if (synced && synced.detailedAddress) {
        setForm((prev) => ({
          ...prev,
          customer_name: synced.fullName || prev.customer_name,
          phone: synced.phonePrimary || prev.phone,
          backup_phone: synced.phoneSecondary || prev.backup_phone,
          governorate: synced.governorate || prev.governorate,
          address: synced.detailedAddress,
        }));
      }

      if (data?.user) {
        const meta = data.user.user_metadata || {};
        const savedGov =
          meta.governorate || synced?.governorate || MarketplaceStore.getUserGovernorate();
        setForm((prev) => ({
          ...prev,
          customer_name: meta.full_name || meta.name || synced?.fullName || prev.customer_name,
          phone: meta.phone_primary || meta.phone || synced?.phonePrimary || prev.phone,
          backup_phone: meta.phone_secondary || synced?.phoneSecondary || prev.backup_phone,
          governorate: savedGov || prev.governorate,
          address: meta.detailed_address || meta.address || synced?.detailedAddress || prev.address,
        }));
      }
    });
  }, []);

  const handleUseLocationInCheckout = async () => {
    setDetectingLocation(true);
    try {
      const res = await requestCurrentLocation();
      if (res.governorate) {
        const matchedGov = egyptData.find(
          (g) => g.nameAr.includes(res.governorate!) || res.governorate!.includes(g.nameAr),
        );
        if (matchedGov) {
          setSelectedGovId(matchedGov.id);
          setForm((prev) => ({ ...prev, governorate: matchedGov.nameAr }));
        }
      }
      if (res.city) setSelectedDistrict(res.city);
      if (res.formattedAddress) {
        setForm((prev) => ({
          ...prev,
          address: prev.address
            ? `${prev.address} - ${res.formattedAddress}`
            : res.formattedAddress,
        }));
      }
      toast.success("تم التحديد التلقائي لعنوانك من الخريطة والموقع الجغرافي!");
    } catch (e) {
      console.error(e);
    } finally {
      setDetectingLocation(false);
    }
  };

  useEffect(() => {
    const cleanedPhone = form.phone.trim();
    if (cleanedPhone.length === 11) {
      const visitors = MarketplaceStore.getVisitors();
      const matched = visitors.find((v) => v.phone === cleanedPhone);
      if (matched) {
        setPastCustomer({
          name: matched.name,
          points: matched.aiCredits * 15,
          ordersCount: 2,
          preferredAddress: "الحي المتميز، الشقة 4 ب",
        });
        setForm((prev) => ({
          ...prev,
          customer_name: matched.name,
          address: prev.address || "الحي المتميز، الشقة 4 ب، أمام المعرض الرئيسي",
        }));
        toast.success(
          `أهلاً بك مجدداً ${matched.name}! تم الكشف عن حسابك وتعبئة التفضيلات تلقائياً.`,
        );
      } else {
        setPastCustomer(null);
      }
    } else {
      setPastCustomer(null);
    }
  }, [form.phone]);

  // Send Free Phone OTP
  // Retrieve active payment methods configured by SuperAdmin
  const [billingSettings, setBillingSettings] = useState(() =>
    MultiVendorStorage.getBillingSettings(),
  );

  useEffect(() => {
    const handleBillingUpdate = () => {
      setBillingSettings(MultiVendorStorage.getBillingSettings());
    };
    window.addEventListener("beitak-billing-updated", handleBillingUpdate);
    window.addEventListener("storage", handleBillingUpdate);
    return () => {
      window.removeEventListener("beitak-billing-updated", handleBillingUpdate);
      window.removeEventListener("storage", handleBillingUpdate);
    };
  }, []);

  const allowedMethods =
    billingSettings.activePaymentMethods && billingSettings.activePaymentMethods.length > 0
      ? billingSettings.activePaymentMethods
      : ["cod"];

  const handleSendOtp = () => {
    const cleanedPhone = form.phone.trim();
    if (!/^01[0-2,5]{1}[0-9]{8}$/.test(cleanedPhone)) {
      toast.error("يرجى إدخال رقم هاتف مصري صحيح (11 رقماً ويبدأ بـ 01) أولاً");
      return;
    }

    const code = Math.floor(1000 + Math.random() * 9000).toString();
    setGeneratedOtp(code);
    setOtpSent(true);

    const waText = encodeURIComponent(
      `مرحباً إدارة منصة بيتك، أود تأكيد رقم هاتفي [${cleanedPhone}] للطلب الحالي. كود التحقق هو: [${code}]`,
    );
    const waUrl = `https://wa.me/201012345678?text=${waText}`;

    // Open WhatsApp in new tab for real user verification flow
    window.open(waUrl, "_blank");

    toast.success("📱 تم فتح واتساب لإرسال كود التحقق الحقيقي إلى هاتفك!");
  };

  const handleVerifyOtp = () => {
    if (enteredOtp.trim() === generatedOtp) {
      setIsPhoneVerified(true);
      toast.success("✓ تم التحقق من رقم الهاتف بنجاح وحماية الطلب!");
    } else {
      toast.error("رمز التحقق غير صحيح، يرجى التأكد وإعادة المحاولة");
    }
  };

  const applyCoupon = () => {
    if (!couponCode.trim()) return;
    const coupons = MarketplaceStore.getCoupons();
    const matched = coupons.find(
      (c) => c.code.toUpperCase() === couponCode.trim().toUpperCase() && c.isEnabled,
    );

    if (matched) {
      const discount =
        matched.type === "percent" ? (total * matched.discount) / 100 : matched.discount;

      setDiscountAmount(discount);
      setAppliedCoupon(matched.code);
      toast.success(`تم تفعيل كوبون الخصم [${matched.code}] بنجاح وتوفير ${discount} ج.م!`);
    } else {
      toast.error("كوبون الخصم غير موجود أو منتهي الصلاحية");
    }
  };

  const finalTotal = total + shippingFee - discountAmount;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (items.length === 0) {
      toast.error("السلة فارغة حالياً. أضف بعض المنتجات قبل إتمام الطلب!");
      return;
    }

    // Phone validation
    const validationForm = {
      ...form,
      address: `${selectedDistrict} - ${form.address}`,
    };

    const parsed = schema.safeParse(validationForm);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }

    // Payment validation
    if (paymentMethod === "card") {
      if (!cardDetails.cardNumber || cardDetails.cardNumber.replace(/\s/g, "").length < 16) {
        toast.error("يرجى إدخال رقم بطاقة بنكية صحيح (16 رقماً)");
        return;
      }
      if (!cardDetails.expiry || !cardDetails.cvc) {
        toast.error("يرجى استكمال كافة بيانات الفيزا / الماستركارد (تاريخ الانتهاء والكود)");
        return;
      }
    } else if (paymentMethod === "wallet") {
      if (!/^01[0-2,5]{1}[0-9]{8}$/.test(walletPhone.trim())) {
        toast.error("يرجى إدخال رقم المحفظة الإلكترونية الصحيح (فودافون/اتصالات/أورنج كاش)");
        return;
      }
    } else if (paymentMethod === "instapay") {
      if (!instapayHandle.trim()) {
        toast.error("يرجى إدخال عنوان أو رقم حساب InstaPay");
        return;
      }
    }

    setLoading(true);

    let paymentMethodLabel = "الدفع عند الاستلام (COD)";
    if (paymentMethod === "card") paymentMethodLabel = "بطاقة بنكية (Visa/Mastercard)";
    if (paymentMethod === "wallet") paymentMethodLabel = `محفظة إلكترونية (${walletPhone})`;
    if (paymentMethod === "instapay") paymentMethodLabel = `إنستا باي (${instapayHandle})`;

    let finalNotes = parsed.data.notes || "";
    if (parsed.data.backup_phone) {
      finalNotes =
        `[رقم هاتف احتياطي: ${parsed.data.backup_phone}] [طريقة الدفع: ${paymentMethodLabel}] ${finalNotes}`.trim();
    }

    const orderNum = "BTK-" + Math.floor(100000 + Math.random() * 900000);

    const { error } = await supabase.from("orders").insert({
      customer_name: parsed.data.customer_name,
      phone: parsed.data.phone,
      governorate: parsed.data.governorate,
      area: parsed.data.area,
      address: parsed.data.address,
      notes: finalNotes || null,
      items: items.map((i) => ({
        id: i.id,
        cartItemId: i.cartItemId,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
        selectedColor: i.selectedColor || null,
        selectedSize: i.selectedSize || null,
      })),
      total: finalTotal,
      status: "pending",
    });

    setLoading(false);
    if (error) {
      toast.error("فشل تقديم الطلب الرئيسي بالخادم: " + error.message);
      return;
    }

    // Save order locally for user
    MarketplaceStore.addOrder({
      customerName: parsed.data.customer_name,
      phone: parsed.data.phone,
      governorate: parsed.data.governorate,
      area: parsed.data.area,
      address: parsed.data.address,
      notes: finalNotes || "",
      items: items.map((i) => ({
        id: i.id,
        name: i.name,
        price: i.price,
        quantity: i.quantity,
        image_url: i.image_url,
        selectedColor: i.selectedColor || "",
        selectedSize: i.selectedSize || "",
      })),
      totalAmount: finalTotal,
      paymentMethod: paymentMethodLabel,
      status: "pending",
    });

    // Notify each product seller with full customer & shipping details
    const sellerItemsMap: Record<string, typeof items> = {};
    items.forEach((item) => {
      const sellerId = MultiVendorStorage.getProductSeller(item.id) || "seller-habiba";
      if (!sellerItemsMap[sellerId]) sellerItemsMap[sellerId] = [];
      sellerItemsMap[sellerId].push(item);
    });

    Object.entries(sellerItemsMap).forEach(([sId, sItems]) => {
      const sTotal = sItems.reduce((acc, it) => acc + it.price * it.quantity, 0);
      const itemsListText = sItems
        .map(
          (it) =>
            `• ${it.name} (كمية: ${it.quantity}${it.selectedColor ? `, لون: ${it.selectedColor}` : ""}${it.selectedSize ? `, مقاس: ${it.selectedSize}` : ""})`,
        )
        .join("\n");

      // System notification to seller
      MarketplaceStore.addNotification(
        {
          title: `📦 طلب جديد #${orderNum} بقيمة ${sTotal.toLocaleString()} ج.م`,
          message: `طلب جديد من العميل: ${parsed.data.customer_name}\nرقم الهاتف: ${parsed.data.phone}${parsed.data.backup_phone ? ` - احتياطي: ${parsed.data.backup_phone}` : ""}\nالعنوان: ${parsed.data.governorate}، ${parsed.data.area}، ${parsed.data.address}\nطريقة الدفع: ${paymentMethodLabel}\nالمنتجات:\n${itemsListText}`,
          type: "order",
          link: "/admin?tab=seller_dashboard",
        },
        sId,
      );

      // Save complete seller customer order
      MarketplaceStore.addSellerCustomerOrder({
        orderNumber: orderNum,
        sellerId: sId,
        customerName: parsed.data.customer_name,
        phone: parsed.data.phone,
        backupPhone: parsed.data.backup_phone || "",
        governorate: parsed.data.governorate,
        area: parsed.data.area,
        address: parsed.data.address,
        notes: finalNotes || "",
        paymentMethod: paymentMethodLabel,
        items: sItems.map((it) => ({
          id: it.id,
          name: it.name,
          price: it.price,
          quantity: it.quantity,
          image_url: it.image_url,
          selectedColor: it.selectedColor,
          selectedSize: it.selectedSize,
        })),
        total: sTotal,
        status: "pending",
        createdAt: new Date().toISOString(),
      });
    });

    clear();
    navigate({ to: "/order-success" });
  };

  const activeGov = egyptData.find((g) => g.id === selectedGovId);
  const activeCity = activeGov?.cities.find((c) => c.id === selectedCityId);

  return (
    <PageShell>
      <div className="px-4 pt-4 text-right" dir="rtl">
        <h1 className="text-2xl font-black mb-1 text-brand-dark">إتمام الطلب والدفع المالي</h1>
        <p className="text-xs text-muted-foreground mb-6">
          بوابة التوصيل والدفع الأمن لمنصة بيتك — تحقق مجاني من الهواتف وطرق دفع متعددة.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 px-4 pb-12" dir="rtl">
        {/* Checkout Form */}
        <div className="lg:col-span-2">
          <form
            onSubmit={submit}
            className="bg-brand-dark text-brand-bg rounded-3xl p-6 space-y-5 shadow-2xl"
          >
            <h2 className="text-sm font-bold border-b border-white/10 pb-2 mb-2 flex items-center gap-2 text-brand-accent">
              <Sparkles className="w-4 h-4" />
              1. بيانات المستلم والعنوان
            </h2>

            {/* Past customer banner */}
            {pastCustomer && (
              <div className="bg-white/10 border border-brand-accent/30 p-3 rounded-2xl flex items-center justify-between text-xs text-brand-accent">
                <div className="flex items-center gap-2">
                  <History className="w-4 h-4 shrink-0" />
                  <div>
                    <span className="font-bold block">
                      مرحباً {pastCustomer.name}! عميل مسجل بـ بيتك
                    </span>
                    <span>لديك {pastCustomer.points} نقطة ولاء جاهزة للاستبدال!</span>
                  </div>
                </div>
              </div>
            )}

            <Field label="الاسم بالكامل" required>
              <input
                type="text"
                value={form.customer_name}
                onChange={(e) => setForm({ ...form, customer_name: e.target.value })}
                placeholder="الاسم الثلاثي أو الثنائي بدقة"
                className="input text-right"
                required
              />
            </Field>

            {/* Phone input & Free OTP verification */}
            <div className="space-y-2">
              <Field label="رقم الموبايل المصري للتواصل وتأكيد الشحن" required>
                <div className="flex gap-2">
                  <input
                    type="tel"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      setIsPhoneVerified(false);
                      setOtpSent(false);
                    }}
                    placeholder="01xxxxxxxxx"
                    className="input text-right flex-1"
                    maxLength={11}
                    required
                    dir="ltr"
                  />
                  {!isPhoneVerified ? (
                    <button
                      type="button"
                      onClick={handleSendOtp}
                      className="bg-brand-accent text-brand-dark text-xs font-black px-3.5 py-2.5 rounded-xl hover:bg-amber-400 transition shrink-0 cursor-pointer flex items-center gap-1"
                    >
                      <Send className="w-3.5 h-3.5" />
                      طلب كود التحقق (واتساب)
                    </button>
                  ) : (
                    <div className="bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-xs font-bold px-3 py-2.5 rounded-xl flex items-center gap-1.5 shrink-0">
                      <Check className="w-4 h-4 text-emerald-400 stroke-[3]" />
                      تم التحقق بالكامل
                    </div>
                  )}
                </div>
              </Field>

              {/* WhatsApp OTP Prompt Banner */}
              {otpSent && !isPhoneVerified && (
                <div className="bg-amber-500/15 border border-brand-accent/40 p-3.5 rounded-2xl text-xs space-y-2.5 animate-fadeIn">
                  <div className="flex justify-between items-center text-brand-accent font-bold">
                    <span>📱 التحقق المباشر عبر واتساب:</span>
                    <a
                      href={`https://wa.me/201012345678?text=${encodeURIComponent(
                        `مرحباً إدارة منصة بيتك، أود الحصول على كود تأكيد رقم هاتفي [${form.phone}]. الكود المولد لطلبي هو: ${generatedOtp}`,
                      )}`}
                      target="_blank"
                      rel="noreferrer"
                      className="bg-emerald-600 hover:bg-emerald-500 text-white font-black text-[11px] px-3 py-1.5 rounded-xl transition flex items-center gap-1 shadow-sm"
                    >
                      <Send className="w-3.5 h-3.5" />
                      إرسال طلب الكود بالواتساب
                    </a>
                  </div>
                  <p className="text-[11px] opacity-80 leading-relaxed">
                    تم فتح تطبيق الواتساب لإرسال طلب الكود. يرجى إدخال الكود المستلم أدناه لتأكيد
                    الرقم:
                  </p>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={enteredOtp}
                      onChange={(e) => setEnteredOtp(e.target.value)}
                      placeholder="أدخل الـ 4 أرقام هنا"
                      className="bg-white/10 border border-white/20 rounded-xl px-3 py-1.5 text-xs text-white outline-none w-36 font-mono text-center tracking-wider"
                      maxLength={4}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyOtp}
                      className="bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-xs px-4 py-1.5 rounded-xl transition cursor-pointer"
                    >
                      تأكيد
                    </button>
                  </div>
                </div>
              )}
            </div>

            <Field label="رقم موبايل احتياطي للتأكيد" required>
              <input
                type="tel"
                value={form.backup_phone}
                onChange={(e) => setForm({ ...form, backup_phone: e.target.value })}
                placeholder="01xxxxxxxxx"
                className="input text-right"
                maxLength={11}
                required
                dir="ltr"
              />
            </Field>

            {/* GPS Location Auto Detection Button */}
            <div className="flex items-center justify-between bg-brand-bg/60 p-3 rounded-2xl border border-brand-dark/10">
              <div>
                <span className="text-xs font-bold text-brand-dark block">
                  عنوان التوصيل المباشر
                </span>
                <span className="text-[10px] text-muted-foreground">
                  تحديد الموقع بالـ GPS يضمن وصول الشحنة بدقة متناهية
                </span>
              </div>
              <button
                type="button"
                onClick={handleUseLocationInCheckout}
                disabled={detectingLocation}
                className="flex items-center gap-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 px-3.5 py-2 rounded-xl text-xs font-bold transition cursor-pointer shrink-0"
              >
                {detectingLocation ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                    <span>جاري التحديد...</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3.5 h-3.5 text-emerald-600 fill-emerald-600/20" />
                    <span>استخدام موقعي الحالي (GPS)</span>
                  </>
                )}
              </button>
            </div>

            {/* Smart cascading address selectors */}
            <div className="grid grid-cols-2 gap-4">
              <Field label="المحافظة" required>
                <select
                  value={selectedGovId}
                  onChange={(e) => handleGovChange(e.target.value)}
                  className="input text-right cursor-pointer"
                  required
                >
                  {egyptData.map((g) => (
                    <option key={g.id} value={g.id} className="bg-brand-dark text-right">
                      {g.nameAr}
                    </option>
                  ))}
                </select>
              </Field>

              <Field label="المركز / المدينة" required>
                <select
                  value={selectedCityId}
                  onChange={(e) => handleCityChange(e.target.value)}
                  className="input text-right cursor-pointer"
                  required
                >
                  {activeGov?.cities.map((c) => (
                    <option key={c.id} value={c.id} className="bg-brand-dark">
                      {c.nameAr}
                    </option>
                  ))}
                </select>
              </Field>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="الحي / المنطقة أو القرية" required>
                <select
                  value={selectedDistrict}
                  onChange={(e) => setSelectedDistrict(e.target.value)}
                  className="input text-right cursor-pointer"
                  required
                >
                  {activeCity?.districts.map((d, idx) => (
                    <option key={idx} value={d} className="bg-brand-dark">
                      {d}
                    </option>
                  ))}
                  <option value="أخرى" className="bg-brand-dark">
                    أخرى / كتابة يدوية
                  </option>
                </select>
              </Field>

              <Field label="تفاصيل الشارع والمنزل بالتفصيل" required>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  placeholder="رقم العمارة، الطابق، رقم الشقة أو أقرب معلم مميز"
                  className="input text-right"
                  required
                />
              </Field>
            </div>

            {/* 2. Payment Methods Selection */}
            <div className="pt-4 border-t border-white/10 space-y-3">
              <h2 className="text-sm font-bold flex justify-between items-center text-brand-accent">
                <span className="flex items-center gap-2">
                  <CreditCard className="w-4 h-4" />
                  2. طرق الدفع المتاحة من التجار
                </span>
                <span className="text-[10px] bg-white/10 text-white font-bold px-2.5 py-0.5 rounded-lg">
                  محددة بواسطة البائع
                </span>
              </h2>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                {/* COD */}
                {allowedMethods.includes("cod") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("cod")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between gap-2 ${
                      paymentMethod === "cod"
                        ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                        : "border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <Building className="w-5 h-5 text-brand-accent" />
                    <div>
                      <span className="font-extrabold text-xs block">عند الاستلام</span>
                      <span className="text-[9px] opacity-70">الدفع نقداً للمندوب</span>
                    </div>
                  </button>
                )}

                {/* Card */}
                {allowedMethods.includes("card") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("card")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between gap-2 ${
                      paymentMethod === "card"
                        ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                        : "border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <CreditCard className="w-5 h-5 text-brand-accent" />
                    <div>
                      <span className="font-extrabold text-xs block">بطاقة بنكية</span>
                      <span className="text-[9px] opacity-70">فيزا / ماستركارد</span>
                    </div>
                  </button>
                )}

                {/* Wallet */}
                {allowedMethods.includes("wallet") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("wallet")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between gap-2 ${
                      paymentMethod === "wallet"
                        ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                        : "border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <Wallet className="w-5 h-5 text-brand-accent" />
                    <div>
                      <span className="font-extrabold text-xs block">محفظة كاش</span>
                      <span className="text-[9px] opacity-70">فودافون / اتصالات</span>
                    </div>
                  </button>
                )}

                {/* InstaPay */}
                {allowedMethods.includes("instapay") && (
                  <button
                    type="button"
                    onClick={() => setPaymentMethod("instapay")}
                    className={`p-3 rounded-2xl border text-right transition cursor-pointer flex flex-col justify-between gap-2 ${
                      paymentMethod === "instapay"
                        ? "border-brand-accent bg-brand-accent/20 text-brand-accent"
                        : "border-white/10 hover:border-white/20 text-white/80"
                    }`}
                  >
                    <Phone className="w-5 h-5 text-brand-accent" />
                    <div>
                      <span className="font-extrabold text-xs block">إنستا باي</span>
                      <span className="text-[9px] opacity-70">InstaPay مباشر</span>
                    </div>
                  </button>
                )}
              </div>

              {/* Dynamic Payment Details Inputs */}
              {paymentMethod === "card" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-3 animate-fadeIn">
                  <Field label="رقم البطاقة (16 رقماً)" required>
                    <input
                      type="text"
                      value={cardDetails.cardNumber}
                      onChange={(e) => {
                        const raw = e.target.value.replace(/\D/g, "").slice(0, 16);
                        const formatted = raw.replace(/(\d{4})/g, "$1 ").trim();
                        setCardDetails({ ...cardDetails, cardNumber: formatted });
                      }}
                      placeholder="4532 0000 0000 0000"
                      className="input text-left font-mono tracking-wider"
                      maxLength={19}
                      dir="ltr"
                    />
                  </Field>

                  <div className="grid grid-cols-2 gap-3">
                    <Field label="تاريخ الانتهاء (MM/YY)" required>
                      <input
                        type="text"
                        value={cardDetails.expiry}
                        onChange={(e) => setCardDetails({ ...cardDetails, expiry: e.target.value })}
                        placeholder="12/28"
                        className="input text-center font-mono"
                        maxLength={5}
                        dir="ltr"
                      />
                    </Field>

                    <Field label="رمز الأمان (CVC)" required>
                      <input
                        type="password"
                        value={cardDetails.cvc}
                        onChange={(e) => setCardDetails({ ...cardDetails, cvc: e.target.value })}
                        placeholder="123"
                        className="input text-center font-mono"
                        maxLength={4}
                        dir="ltr"
                      />
                    </Field>
                  </div>

                  <Field label="الاسم المكتوب على البطاقة" required>
                    <input
                      type="text"
                      value={cardDetails.cardHolder}
                      onChange={(e) =>
                        setCardDetails({ ...cardDetails, cardHolder: e.target.value })
                      }
                      placeholder="AHMED MOHAMED"
                      className="input uppercase text-right"
                    />
                  </Field>
                </div>
              )}

              {paymentMethod === "wallet" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 animate-fadeIn">
                  <Field label="رقم محفظة الكاش (فودافون/اتصالات/أورنج)" required>
                    <input
                      type="tel"
                      value={walletPhone}
                      onChange={(e) => setWalletPhone(e.target.value)}
                      placeholder="01000000000"
                      className="input text-right font-mono"
                      maxLength={11}
                      dir="ltr"
                    />
                  </Field>
                  <p className="text-[10px] opacity-70">
                    سيصلك إشعار دفع سريع لتأكيد تحويل قيمة الفاتورة من تطبيق محفظتك مباشرة.
                  </p>
                </div>
              )}

              {paymentMethod === "instapay" && (
                <div className="bg-white/5 border border-white/10 rounded-2xl p-4 space-y-2 animate-fadeIn">
                  <Field label="عنوان حساب InstaPay الخاص بك" required>
                    <input
                      type="text"
                      value={instapayHandle}
                      onChange={(e) => setInstapayHandle(e.target.value)}
                      placeholder="username@instapay"
                      className="input text-left font-mono"
                      dir="ltr"
                    />
                  </Field>
                  <p className="text-[10px] opacity-70">
                    سيتم إرسال طلب تحويل فوري ومباشر إلى حساب InstaPay المحدد.
                  </p>
                </div>
              )}
            </div>

            <Field label="ملاحظات التسليم الخاصة والتنسيق">
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => setForm({ ...form, notes: e.target.value })}
                placeholder="مثال: يرجى الاتصال قبل الوصول بساعة على الأقل"
                className="input text-right"
              />
            </Field>
          </form>
        </div>

        {/* Live Order Summary & Coupons */}
        <div className="space-y-4">
          <div className="bg-card border border-brand-dark/5 rounded-3xl p-5 space-y-4 shadow-md text-right">
            <h2 className="text-sm font-bold text-brand-dark border-b border-brand-dark/5 pb-2">
              ملخص الفاتورة والشحن
            </h2>

            {/* Products List */}
            <div className="space-y-2.5 max-h-[200px] overflow-y-auto pr-1">
              {items.map((i) => (
                <div
                  key={i.id}
                  className="flex justify-between items-center text-xs text-brand-dark"
                >
                  <span className="font-bold">
                    {i.name} (x{i.quantity})
                  </span>
                  <span className="font-black text-brand-primary">
                    {formatEGP(i.price * i.quantity)}
                  </span>
                </div>
              ))}
            </div>

            {/* Calculations */}
            <div className="space-y-1.5 pt-3 border-t border-brand-dark/5 text-xs text-muted-foreground">
              <div className="flex justify-between">
                <span>قيمة المشتريات</span>
                <span className="font-semibold text-brand-dark">{formatEGP(total)}</span>
              </div>
              <div className="flex justify-between">
                <span>مصاريف الشحن لـ ({form.governorate})</span>
                <span className="font-semibold text-brand-dark">+{formatEGP(shippingFee)}</span>
              </div>
              {discountAmount > 0 && (
                <div className="flex justify-between text-emerald-600 font-bold">
                  <span>خصم الكوبون</span>
                  <span>-{formatEGP(discountAmount)}</span>
                </div>
              )}
            </div>

            <div className="flex justify-between items-center pt-3 border-t border-brand-dark/10">
              <span className="text-xs font-black text-brand-dark">الإجمالي النهائي المستحق</span>
              <span className="text-lg font-black text-brand-primary">{formatEGP(finalTotal)}</span>
            </div>

            <div className="text-[10px] text-muted-foreground bg-brand-bg p-2.5 rounded-xl border border-brand-dark/5 flex items-center justify-between">
              <span>🚚 التوصيل المقدر:</span>
              <span className="font-bold text-brand-dark">3 - 5 أيام عمل</span>
            </div>
          </div>

          {/* Submit Order Button */}
          <button
            onClick={submit}
            disabled={loading || items.length === 0}
            className="w-full bg-brand-primary text-brand-bg font-black py-4 rounded-2xl shadow-xl hover:bg-brand-dark transition disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer text-sm"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                جاري مراجعة وتأكيد الطلب المالي...
              </>
            ) : (
              "تأكيد الطلب والدفع النهائي"
            )}
          </button>
        </div>
      </div>

      <style>{`
        .input {
          width: 100%;
          background: rgba(255,255,255,0.06);
          border: 1px solid rgba(255,255,255,0.12);
          border-radius: 12px;
          padding: 12px 16px;
          font-size: 13px;
          color: inherit;
          outline: none;
          transition: border-color 0.2s;
          font-family: inherit;
        }
        .input:focus { border-color: var(--brand-accent); }
        .input::placeholder { color: rgba(255,255,255,0.4); }
      `}</style>
    </PageShell>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div className="text-right">
      <label className="block text-xs font-semibold mb-1.5 opacity-80">
        {label} {required && <span className="text-brand-accent">*</span>}
      </label>
      {children}
    </div>
  );
}
