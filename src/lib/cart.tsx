import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = {
  id: string;
  cartItemId: string;
  name: string;
  price: number;
  image_url: string | null;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
};

type CartContextType = {
  items: CartItem[];
  add: (item: Omit<CartItem, "quantity" | "cartItemId">, qty?: number) => void;
  remove: (cartItemId: string) => void;
  setQty: (cartItemId: string, qty: number) => void;
  clear: () => void;
  count: number;
  total: number;
};

const CartContext = createContext<CartContextType | null>(null);
const STORAGE_KEY = "arkan_cart_v2";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch (e) {
      console.warn("Failed to load cart items:", e);
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const add: CartContextType["add"] = (item, qty = 1) => {
    const cartItemId = `${item.id}${item.selectedColor ? `-${item.selectedColor}` : ""}${
      item.selectedSize ? `-${item.selectedSize}` : ""
    }`;

    setItems((prev) => {
      const existing = prev.find((p) => p.cartItemId === cartItemId);
      if (existing) {
        return prev.map((p) =>
          p.cartItemId === cartItemId ? { ...p, quantity: p.quantity + qty } : p,
        );
      }
      return [...prev, { ...item, cartItemId, quantity: qty }];
    });
  };

  const remove = (cartItemId: string) =>
    setItems((prev) => prev.filter((p) => p.cartItemId !== cartItemId && p.id !== cartItemId));

  const setQty = (cartItemId: string, qty: number) =>
    setItems((prev) =>
      prev
        .map((p) =>
          p.cartItemId === cartItemId || p.id === cartItemId
            ? { ...p, quantity: Math.max(1, qty) }
            : p,
        )
        .filter((p) => p.quantity > 0),
    );

  const clear = () => setItems([]);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const total = items.reduce((s, i) => s + i.quantity * i.price, 0);

  return (
    <CartContext.Provider value={{ items, add, remove, setQty, clear, count, total }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

export function formatEGP(n: number) {
  return `${new Intl.NumberFormat("ar-EG", { maximumFractionDigits: 0 }).format(n)} ج.م`;
}
