import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/order-success")({
  head: () => ({
    meta: [
      { title: "تم استلام الطلب — بيتك" },
      { name: "description", content: "تم استلام طلبك بنجاح." },
    ],
  }),
  component: () => (
    <PageShell>
      <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
        <div className="w-24 h-24 rounded-full bg-brand-accent/20 grid place-items-center mb-6">
          <CheckCircle2 className="w-12 h-12 text-brand-accent" />
        </div>
        <h1 className="text-2xl font-bold mb-3">تم استلام طلبك!</h1>
        <p className="text-sm text-muted-foreground mb-8 max-w-sm">
          هنتواصل معاك خلال أقل من ٢٤ ساعة على رقم الموبايل اللي سجلته لتأكيد الطلب وميعاد التوصيل.
          شكراً لثقتك في بيتك.
        </p>
        <Link to="/" className="bg-brand-dark text-brand-bg font-bold py-3 px-8 rounded-xl text-sm">
          الرجوع للرئيسية
        </Link>
      </div>
    </PageShell>
  ),
});
