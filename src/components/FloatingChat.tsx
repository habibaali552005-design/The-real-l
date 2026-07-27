import { useEffect, useState } from "react";
import { MessageCircle, X, Send, Facebook } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

type Settings = { facebook: string | null };

const MESSENGER_URL = "https://m.me/61591763065356";

export function FloatingChat() {
  const [open, setOpen] = useState(false);
  const [s, setS] = useState<Settings | null>(null);
  const [name, setName] = useState("");
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("facebook")
      .eq("id", 1)
      .maybeSingle()
      .then(({ data }) => setS(data as Settings | null));
  }, []);

  const messengerHref =
    s?.facebook && s.facebook.includes("facebook.com")
      ? MESSENGER_URL
      : s?.facebook || MESSENGER_URL;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !message.trim()) return;
    setSending(true);
    const { error } = await supabase.from("contact_messages").insert({
      name: name.trim(),
      phone: "-",
      message: message.trim(),
    });
    setSending(false);
    if (error) return toast.error("حصل خطأ، جرب تاني");
    toast.success("وصلتنا رسالتك، هنرد عليك قريب");
    setName("");
    setMessage("");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        className="fixed bottom-5 left-5 z-40 w-14 h-14 rounded-full bg-brand-primary text-white shadow-2xl grid place-items-center hover:scale-105 transition"
        aria-label="دردشة"
      >
        {open ? <X className="w-5 h-5" /> : <MessageCircle className="w-6 h-6" />}
      </button>

      {open && (
        <div className="fixed bottom-24 left-5 z-40 w-[min(360px,calc(100vw-2.5rem))] bg-card rounded-2xl border border-brand-dark/10 shadow-2xl overflow-hidden">
          <div className="bg-brand-dark text-brand-bg px-4 py-3">
            <p className="font-bold text-sm">تواصل مع بيتك</p>
            <p className="text-[11px] text-brand-bg/70">
              اكتب استفسارك وسنقوم بالرد عليك في أقرب وقت
            </p>
          </div>

          <form onSubmit={submit} className="p-4 space-y-2">
            <p className="text-xs font-bold text-brand-dark/70">ابعتلنا هنا في الموقع</p>
            <input
              required
              placeholder="اسمك"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-accent"
            />
            <textarea
              required
              rows={3}
              placeholder="رسالتك..."
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              className="w-full bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-accent resize-none"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full bg-brand-primary text-white font-bold py-2.5 rounded-xl disabled:opacity-60 flex items-center justify-center gap-2 text-sm"
            >
              <Send className="w-4 h-4" />
              {sending ? "بيتبعت..." : "إرسال"}
            </button>
          </form>
        </div>
      )}
    </>
  );
}
