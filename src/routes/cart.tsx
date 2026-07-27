import { createFileRoute, Link } from "@tanstack/react-router";
import { PageShell } from "@/components/Layout";
import { useCart, formatEGP } from "@/lib/cart";
import { Minus, Plus, Trash2, ShoppingBag } from "lucide-react";

export const Route = createFileRoute("/cart")({
  head: () => ({
    meta: [{ title: "السلة — بيتك" }, { name: "description", content: "مراجعة طلبك." }],
  }),
  component: CartPage,
});

function CartPage() {
  const { items, setQty, remove, total } = useCart();

  if (items.length === 0) {
    return (
      <PageShell>
        <div className="flex flex-col items-center justify-center py-24 px-6 text-center">
          <div className="w-20 h-20 rounded-full bg-secondary grid place-items-center mb-4">
            <ShoppingBag className="w-8 h-8 text-brand-primary" />
          </div>
          <h2 className="text-xl font-bold mb-2">السلة فاضية</h2>
          <p className="text-sm text-muted-foreground mb-6">
            ابدأ بإضافة قطعك المفضلة من المنتجات.
          </p>
          <Link
            to="/products"
            className="bg-brand-dark text-brand-bg font-bold py-3 px-8 rounded-xl text-sm"
          >
            تصفح المنتجات
          </Link>
        </div>
      </PageShell>
    );
  }

  return (
    <PageShell>
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold mb-6">سلة المشتريات</h1>

        <div className="space-y-3">
          {items.map((item) => (
            <div
              key={item.cartItemId || item.id}
              className="bg-card rounded-2xl p-3 flex gap-3 border border-brand-dark/5"
            >
              <div className="w-20 h-20 rounded-xl overflow-hidden bg-secondary flex-shrink-0">
                {item.image_url && (
                  <img
                    src={item.image_url}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0 flex flex-col justify-between">
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <h3 className="font-bold text-sm line-clamp-2">{item.name}</h3>
                    {(item.selectedColor || item.selectedSize) && (
                      <div className="flex flex-wrap gap-1.5 mt-1">
                        {item.selectedColor && (
                          <span className="text-[10px] font-bold bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-md">
                            اللون: {item.selectedColor}
                          </span>
                        )}
                        {item.selectedSize && (
                          <span className="text-[10px] font-bold bg-brand-accent/20 text-brand-dark px-2 py-0.5 rounded-md">
                            المقاس: {item.selectedSize}
                          </span>
                        )}
                      </div>
                    )}
                  </div>
                  <button
                    onClick={() => remove(item.cartItemId || item.id)}
                    className="text-muted-foreground hover:text-destructive cursor-pointer"
                    aria-label="حذف"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-2 border border-brand-dark/10 rounded-full p-1">
                    <button
                      onClick={() => setQty(item.cartItemId || item.id, item.quantity - 1)}
                      className="w-6 h-6 grid place-items-center rounded-full hover:bg-secondary cursor-pointer"
                      aria-label="نقصان"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="text-sm font-bold min-w-[1.5rem] text-center">
                      {item.quantity}
                    </span>
                    <button
                      onClick={() => setQty(item.cartItemId || item.id, item.quantity + 1)}
                      className="w-6 h-6 grid place-items-center rounded-full hover:bg-secondary cursor-pointer"
                      aria-label="زيادة"
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-brand-accent font-bold text-sm">
                    {formatEGP(item.price * item.quantity)}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 bg-brand-dark text-brand-bg rounded-2xl p-5">
          <div className="flex justify-between mb-2 text-sm text-brand-bg/70">
            <span>المجموع الفرعي</span>
            <span>{formatEGP(total)}</span>
          </div>
          <div className="flex justify-between mb-4 text-sm text-brand-bg/70">
            <span>التوصيل</span>
            <span>يتم الاتفاق عليه</span>
          </div>
          <div className="flex justify-between items-center border-t border-white/10 pt-4 mb-5">
            <span className="font-bold">الإجمالي</span>
            <span className="text-xl font-bold text-brand-accent">{formatEGP(total)}</span>
          </div>
          <Link
            to="/checkout"
            className="block w-full bg-brand-accent text-brand-dark font-bold py-4 rounded-xl text-center text-sm"
          >
            إتمام الطلب
          </Link>
        </div>
      </div>
    </PageShell>
  );
}
