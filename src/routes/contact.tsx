import { createFileRoute } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  Mail,
  MapPin,
  Facebook,
  Instagram,
  Send,
  Phone,
  Paperclip,
  MessageSquare,
  ShieldAlert,
} from "lucide-react";

type Settings = {
  email: string | null;
  address: string | null;
  facebook: string | null;
  instagram: string | null;
  about: string | null;
};

export const Route = createFileRoute("/contact")({
  head: () => ({
    meta: [
      { title: "التواصل مع إدارة المنصة — بيتك" },
      {
        name: "description",
        content: "تواصل مباشرة مع إدارة منصة بيتك لإرسال الاستفسارات والإبلاغ عن المشاكل.",
      },
    ],
  }),
  component: ContactPage,
});

function ContactPage() {
  const [s, setS] = useState<Settings | null>(null);
  const [form, setForm] = useState({
    name: "",
    phone: "",
    subject: "استفسار عام",
    message: "",
    attachmentUrl: "",
  });
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("email,address,facebook,instagram,about")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setS(data as Settings | null));

    // Auto populate logged in user name and phone
    supabase.auth.getSession().then(({ data }) => {
      const u = data.session?.user;
      if (u) {
        const meta = u.user_metadata || {};
        setForm((prev) => ({
          ...prev,
          name: prev.name || meta.full_name || u.email?.split("@")[0] || "",
          phone: prev.phone || meta.phone_primary || meta.phone || "",
        }));
      }
    });
  }, []);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.message.trim() || !form.phone.trim()) {
      toast.error("يرجى إكمال جميع الحقول المطلوبة (الاسم، الهاتف، الرسالة)");
      return;
    }
    setSending(true);

    const fullMessageText = `[${form.subject}] ${form.message}${
      form.attachmentUrl ? `\n\nمرفق الصورة/المستند: ${form.attachmentUrl}` : ""
    }`;

    const { error } = await supabase.from("contact_messages").insert({
      name: form.name.trim(),
      phone: form.phone.trim(),
      message: fullMessageText,
      status: "pending",
    });

    setSending(false);
    if (error) return toast.error("حصل خطأ أثناء إرسال الرسالة، حاول مرة أخرى");
    toast.success("تم إرسال رسالتك بنجاح إلى السوبر أدمن، وسيتم التواصل معك قريباً");
    setForm({ name: "", phone: "", subject: "استفسار عام", message: "", attachmentUrl: "" });
  };

  return (
    <PageShell>
      <div className="px-4 py-8 space-y-6 max-w-3xl mx-auto" dir="rtl">
        <div className="text-center space-y-2">
          <div className="w-12 h-12 bg-brand-accent/20 text-brand-dark rounded-2xl grid place-items-center mx-auto mb-2 font-bold">
            <MessageSquare className="w-6 h-6 text-brand-primary" />
          </div>
          <h1 className="text-2xl font-black text-brand-dark">التواصل المباشر مع السوبر أدمن</h1>
          <p className="text-xs text-muted-foreground max-w-lg mx-auto">
            {s?.about ??
              "نحن هنا لخدمتك دائماً. يمكنك إرسال استفساراتك، الإبلاغ عن مشكلة بائع، أو طلب مساعدة مباشرة."}
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {s?.email && (
            <ContactTile
              href={`mailto:${s.email}`}
              icon={Mail}
              label="البريد الرسمي"
              value={s.email}
            />
          )}
          {s?.address && <ContactTile icon={MapPin} label="المقر الرئيسي" value={s.address} />}
          {s?.facebook && (
            <ContactTile
              href={s.facebook}
              icon={Facebook}
              label="فيسبوك"
              value="صفحة بيتك الرسمية"
            />
          )}
          {s?.instagram && (
            <ContactTile href={s.instagram} icon={Instagram} label="انستجرام" value="حساب بيتك" />
          )}
        </div>

        <form
          onSubmit={submit}
          className="bg-card rounded-3xl p-6 md:p-8 space-y-4 border border-brand-dark/10 shadow-sm"
        >
          <div className="flex items-center gap-2 border-b border-brand-dark/10 pb-3 mb-2">
            <ShieldAlert className="w-5 h-5 text-brand-primary" />
            <h2 className="font-black text-brand-dark text-base">
              نموذج المراسبة والشكاوى للمدارة
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark block">الاسم بالكامل:</label>
              <input
                required
                placeholder="أدخل اسمك..."
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 text-xs outline-none focus:border-brand-accent"
              />
            </div>

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-brand-dark block">
                رقم الهاتف للرد والتواصل:
              </label>
              <input
                required
                type="tel"
                placeholder="010XXXXXXXX"
                dir="ltr"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 text-xs outline-none focus:border-brand-accent"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              نوع الرسالة / الموضوع:
            </label>
            <select
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 text-xs outline-none focus:border-brand-accent font-bold cursor-pointer"
            >
              <option value="استفسار عام">استفسار عام حول الطلبات أو الشحن</option>
              <option value="الإبلاغ عن مشكلة بائع">الإبلاغ عن مشكلة بائع أو منتج مخالف</option>
              <option value="طلب دعم فني لبائع">دعم فني لبائع (إضافة ألوان/مقاسات/مستحقات)</option>
              <option value="طلب إضافة قسم جديد">طلب إضافة قسم جديد بالمتجر</option>
              <option value="شكوى مباشرة للدارة">شكوى مباشرة للإدارة العليا</option>
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark block">
              تفاصيل الرسالة أو المشكلة:
            </label>
            <textarea
              required
              rows={4}
              placeholder="اكتب تفاصيل رسالتك أو مشكلتك بوضوح هنا..."
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className="w-full bg-white border border-brand-dark/15 rounded-2xl p-4 text-xs outline-none focus:border-brand-accent"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Paperclip className="w-3.5 h-3.5 text-brand-primary" />
              رابط صورة أو مستند مرفق (اختياري):
            </label>
            <input
              type="url"
              placeholder="https://..."
              dir="ltr"
              value={form.attachmentUrl}
              onChange={(e) => setForm({ ...form, attachmentUrl: e.target.value })}
              className="w-full bg-white border border-brand-dark/15 rounded-2xl px-4 py-3 text-xs outline-none focus:border-brand-accent"
            />
          </div>

          <button
            type="submit"
            disabled={sending}
            className="w-full bg-brand-dark hover:bg-brand-primary text-white font-black py-4 rounded-2xl shadow-lg disabled:opacity-60 transition cursor-pointer flex items-center justify-center gap-2 text-xs"
          >
            <Send className="w-4 h-4 text-brand-accent" />
            {sending ? "جاري الإرسال..." : "إرسال الرسالة إلى إدارة السوبر أدمن"}
          </button>
        </form>
      </div>
    </PageShell>
  );
}

function ContactTile({
  href,
  icon: Icon,
  label,
  value,
}: {
  href?: string;
  icon: typeof Mail;
  label: string;
  value: string;
}) {
  const inner = (
    <div className="rounded-2xl p-3.5 border border-brand-dark/10 h-full bg-card hover:bg-secondary transition">
      <Icon className="w-4 h-4 mb-1.5 text-brand-primary" />
      <div className="text-[10px] text-muted-foreground font-bold">{label}</div>
      <div className="text-xs font-bold break-all text-brand-dark line-clamp-1">{value}</div>
    </div>
  );
  return href ? (
    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noreferrer">
      {inner}
    </a>
  ) : (
    inner
  );
}
