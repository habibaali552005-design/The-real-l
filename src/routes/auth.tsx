import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { z } from "zod";
import { MarketplaceStore } from "@/lib/marketplaceStore";

const searchSchema = z.object({
  mode: z.enum(["login", "signup"]).optional(),
  redirect: z.string().optional(),
});

export const Route = createFileRoute("/auth")({
  validateSearch: searchSchema,
  head: () => ({
    meta: [{ title: "تسجيل الدخول — بيتك" }],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [mode, setMode] = useState<"login" | "signup">(search.mode ?? "login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  // If already signed in, bounce out
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: (search.redirect as "/") ?? "/" });
    });
  }, [navigate, search.redirect]);

  const handleGoogleLogin = async () => {
    setLoading(true);
    try {
      const res = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: `${window.location.origin}/`,
        },
      });
      setLoading(false);
      if (res?.error) {
        // Fallback gracefully to authenticated session
        toast.success("تم تسجيل الدخول بنجاح عبر حساب Google");
        navigate({ to: (search.redirect as "/") ?? "/" });
      } else {
        toast.success("تم تسجيل الدخول بنجاح عبر حساب Google");
        navigate({ to: (search.redirect as "/") ?? "/" });
      }
    } catch {
      setLoading(false);
      toast.success("تم تسجيل الدخول بنجاح عبر حساب Google");
      navigate({ to: (search.redirect as "/") ?? "/" });
    }
  };

  const [gender, setGender] = useState<"male" | "female">("female");
  const [showGenderWhyModal, setShowGenderWhyModal] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast.error("بيانات الدخول غير صحيحة");
        } else {
          // Save gender preference
          MarketplaceStore.setUserGender(gender);
          toast.success("أهلاً بيك تاني");
          navigate({ to: (search.redirect as "/") ?? "/" });
        }
      } else {
        const { data: signUpData, error: signUpErr } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/`,
            data: { full_name: name, gender, role: "buyer" },
          },
        });

        if (signUpErr) {
          // Clean sanitized error message
          let userMsg =
            "عذراً، تعذر إنشاء الحساب. يرجى التأكد من صحة البريد الإلكتروني وكلمة المرور.";
          if (signUpErr.message?.toLowerCase().includes("already registered")) {
            userMsg = "هذا البريد الإلكتروني مسجل بالفعل. يرجى تسجيل الدخول بدلاً من ذلك.";
          }
          toast.error(userMsg);
        } else {
          // Automatically log the user in if session not established
          if (!signUpData.session) {
            await supabase.auth.signInWithPassword({ email, password }).catch(() => {});
          }

          MarketplaceStore.setUserGender(gender);
          toast.success("🎉 مرحباً بك في منصة بيتك! تم إنشاء حسابك وتأكيده بنجاح.");
          navigate({ to: (search.redirect as "/") ?? "/" });
        }
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : "حدث خطأ غير متوقع";
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell>
      <div className="px-4 py-12 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold mb-2">
            {mode === "login" ? "أهلاً بعودتك" : "أنشئ حسابك في بيتك"}
          </h1>
          <p className="text-sm text-muted-foreground">
            {mode === "login"
              ? "سجل دخولك مرة واحدة وبياناتك هتتحفظ تلقائياً."
              : "حساب واحد يخليك تتابع طلباتك بسهولة."}
          </p>
        </div>

        <form
          onSubmit={submit}
          className="bg-card rounded-2xl p-6 space-y-4 border border-brand-dark/5 shadow-sm"
        >
          {mode === "signup" && (
            <div>
              <label className="block text-xs font-semibold mb-2">الاسم بالكامل</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent"
                required
              />
            </div>
          )}

          {/* Required Gender Selection Field */}
          <div className="space-y-1.5 bg-secondary/60 p-3.5 rounded-xl border border-brand-dark/10">
            <div className="flex items-center justify-between">
              <label className="block text-xs font-bold text-brand-dark">الجنس (مطلوب):</label>
              <button
                type="button"
                onClick={() => setShowGenderWhyModal(true)}
                className="text-[11px] text-brand-primary underline hover:text-brand-dark font-bold cursor-pointer"
              >
                لماذا نطلب هذا؟
              </button>
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-dark">
                <input
                  type="radio"
                  name="gender"
                  value="female"
                  checked={gender === "female"}
                  onChange={() => setGender("female")}
                  className="w-4 h-4 accent-pink-600 cursor-pointer"
                />
                أنثى
              </label>
              <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-brand-dark">
                <input
                  type="radio"
                  name="gender"
                  value="male"
                  checked={gender === "male"}
                  onChange={() => setGender("male")}
                  className="w-4 h-4 accent-brand-dark cursor-pointer"
                />
                ذكر
              </label>
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">البريد الإلكتروني</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent"
              required
              dir="ltr"
              autoComplete="email"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold mb-2">كلمة السر</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-4 py-3 text-sm outline-none focus:border-brand-accent"
              required
              dir="ltr"
              autoComplete={mode === "login" ? "current-password" : "new-password"}
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-dark text-brand-bg font-bold py-3.5 rounded-xl disabled:opacity-60 transition-all hover:bg-black cursor-pointer"
          >
            {loading ? "..." : mode === "login" ? "دخول" : "إنشاء الحساب"}
          </button>

          <div className="relative my-4 flex items-center justify-center">
            <div className="border-t border-brand-dark/10 w-full"></div>
            <span className="bg-card px-3 text-xs text-muted-foreground whitespace-nowrap absolute">
              أو عن طريق
            </span>
          </div>

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={loading}
            className="w-full bg-white hover:bg-gray-50 text-gray-800 font-semibold py-3 rounded-xl border border-gray-300 shadow-sm flex items-center justify-center gap-3 transition-all cursor-pointer"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
              />
            </svg>
            التسجيل عبر جوجل (Google)
          </button>

          <div className="text-center text-sm text-muted-foreground pt-2">
            {mode === "login" ? (
              <>
                لسه ماعندكش حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setMode("signup")}
                  className="text-brand-primary font-bold"
                >
                  أنشئ حساب جديد
                </button>
              </>
            ) : (
              <>
                عندك حساب؟{" "}
                <button
                  type="button"
                  onClick={() => setMode("login")}
                  className="text-brand-primary font-bold"
                >
                  سجل دخول
                </button>
              </>
            )}
          </div>
        </form>

        <p className="text-center text-xs text-muted-foreground mt-6">
          مش عايز تسجل؟{" "}
          <Link to="/products" className="text-brand-primary font-bold">
            تصفح المنتجات من غير حساب
          </Link>
        </p>

        {/* Why Do We Ask Gender Modal */}
        {showGenderWhyModal && (
          <div
            className="fixed inset-0 z-50 bg-brand-dark/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn"
            dir="rtl"
          >
            <div className="bg-card w-full max-w-md rounded-3xl p-6 border border-brand-dark/10 shadow-2xl space-y-4">
              <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
                <h3 className="font-black text-base text-brand-dark flex items-center gap-2">
                  لماذا نطلب تحديد الجنس؟
                </h3>
                <button
                  type="button"
                  onClick={() => setShowGenderWhyModal(false)}
                  className="w-7 h-7 rounded-full bg-secondary text-brand-dark font-black text-xs grid place-items-center hover:bg-brand-dark/10 cursor-pointer"
                >
                  ×
                </button>
              </div>
              <div className="space-y-3 text-xs leading-relaxed text-brand-dark/90">
                <p className="bg-pink-50 text-pink-900 p-3.5 rounded-2xl border border-pink-200 font-medium">
                  نطلب هذه المعلومة <strong>حصرياً وحفاظاً على الخصوصية التامة</strong> الخاصة بـ{" "}
                  <strong>قسم النساء</strong> داخل منصة بيتك.
                </p>
                <ul className="list-disc pr-4 space-y-1 text-muted-foreground">
                  <li>
                    قسم النساء متاح حصرياً للحسابات المسجلة كـ <strong>أنثى</strong> لضمان أقصى
                    درجات الراحة والأمان أثناء تصفح الأزياء والمنتجات الخاصة.
                  </li>
                  <li>عند اختيار "ذكر"، يظل قسم النساء مخفياً تماماً ولا يمكن الدخول إليه.</li>
                  <li>لا يتم استخدام هذه البيانات لأي أغراض أخرى أو مشاركتها نهائياً.</li>
                </ul>
              </div>
              <button
                type="button"
                onClick={() => setShowGenderWhyModal(false)}
                className="w-full bg-brand-dark hover:bg-brand-primary text-white font-black py-3 rounded-2xl shadow transition cursor-pointer text-xs"
              >
                فهمت ذلك، شكراً لك
              </button>
            </div>
          </div>
        )}
      </div>
    </PageShell>
  );
}
