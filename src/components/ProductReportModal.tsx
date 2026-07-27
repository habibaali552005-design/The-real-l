import { useState } from "react";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import { Flag, X, AlertTriangle, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";

interface ProductReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productName: string;
}

export function ProductReportModal({
  isOpen,
  onClose,
  productId,
  productName,
}: ProductReportModalProps) {
  const [reason, setReason] = useState("منتج غير مطابق أو مقلد");
  const [comment, setComment] = useState("");
  const [reporterName, setReporterName] = useState("");
  const [reporterPhone, setReporterPhone] = useState("");

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!reason) {
      toast.error("يرجى اختيار سبب البلاغ");
      return;
    }

    MarketplaceStore.addReport({
      productId,
      productName,
      reporterName: reporterName.trim() || "مشتري بيتك",
      reporterPhone: reporterPhone.trim(),
      reason,
      comment: comment.trim(),
    });

    toast.success("تم تقديم البلاغ بنجاح وسيتم مراجعته فوراً بواسطة الإدارة 🛡️");
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-brand-dark/60 backdrop-blur-xs z-50 grid place-items-center p-4">
      <div
        className="bg-card border border-brand-dark/15 rounded-3xl p-6 max-w-md w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-150"
        dir="rtl"
      >
        <div className="flex items-center justify-between border-b border-brand-dark/10 pb-3">
          <div className="flex items-center gap-2 text-rose-600 font-black text-base">
            <AlertTriangle className="w-5 h-5" />
            <span>الإبلاغ عن منتج مخالف</span>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-full text-muted-foreground hover:bg-secondary cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground leading-relaxed">
          تلتزم منصة بيتك بحماية حقوق جميع المشتريين والتجار. سيتم إحالة هذا البلاغ لفريق الإدارة
          للمراجعة واتخاذ الإجراء اللازم.
        </p>

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="font-bold text-brand-dark block mb-1">المنتج المُبلغ عنه:</label>
            <div className="bg-secondary/60 p-3 rounded-2xl font-black text-brand-dark text-xs border border-brand-dark/10">
              {productName}
            </div>
          </div>

          <div>
            <label className="font-bold text-brand-dark block mb-1.5">سبب الإبلاغ الرئيسي *</label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full bg-white border border-brand-dark/20 rounded-2xl p-3 outline-none font-bold text-brand-dark"
            >
              <option value="منتج غير مطابق أو مقلد">منتج غير مطابق للمواصفات أو مقلد</option>
              <option value="السعر غير مطابق للواقع">
                السعر المعروض غير مطابق للواقع عند التواصل
              </option>
              <option value="صور مضللة أو غير لائقة">صور غير لائقة أو حقوق مضللة</option>
              <option value="بائع غير متجاوب أو احتيالي">شبهة احتيال أو بائع غير متجاوب</option>
              <option value="قسم خطأ">المنتج مضاف داخل قسم غير صحيح</option>
              <option value="سبب آخر">سبب آخر</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-brand-dark block mb-1.5">تفاصيل وملاحظات إضافية</label>
            <textarea
              rows={3}
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="اكتب أي تفاصيل توضيحية للإدارة..."
              className="w-full bg-white border border-brand-dark/20 rounded-2xl p-3 outline-none font-medium resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="font-bold text-brand-dark block mb-1">اسمك (اختياري)</label>
              <input
                type="text"
                value={reporterName}
                onChange={(e) => setReporterName(e.target.value)}
                placeholder="اسمك الكريم"
                className="w-full bg-white border border-brand-dark/20 rounded-xl p-2.5 outline-none font-bold text-xs"
              />
            </div>
            <div>
              <label className="font-bold text-brand-dark block mb-1">رقم الهاتف (اختياري)</label>
              <input
                type="tel"
                value={reporterPhone}
                onChange={(e) => setReporterPhone(e.target.value)}
                placeholder="01000000000"
                className="w-full bg-white border border-brand-dark/20 rounded-xl p-2.5 outline-none font-bold text-xs"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-2xl font-bold bg-secondary text-brand-dark hover:bg-secondary/80 cursor-pointer"
            >
              إلغاء
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-2xl font-black bg-rose-600 text-white hover:bg-rose-700 transition shadow-md cursor-pointer flex items-center gap-1.5"
            >
              <Flag className="w-4 h-4" /> إرسال البلاغ فوراً
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
