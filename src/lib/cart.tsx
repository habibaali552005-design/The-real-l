import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";

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

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [storageKey, setStorageKey] = useState<string>("beitak_cart_guest");
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;

    const loadCartForKey = (key: string) => {
      try {
        const raw = localStorage.getItem(key);
        if (raw) {
          setItems(JSON.parse(raw));
        } else {
          setItems([]);
        }
      } catch (e) {
        console.warn("Failed to load cart items:", e);
        setItems([]);
      }
    };

    supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      const user = data.session?.user;
      const key = user ? `beitak_cart_user_${user.id}` : "beitak_cart_guest";
      setStorageKey(key);
      loadCartForKey(key);
      setHydrated(true);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      const user = session?.user;
      const key = user ? `beitak_cart_user_${user.id}` : "beitak_cart_guest";
      setStorageKey(key);
      loadCartForKey(key);
    });

    return () => {
      mounted = false;
      sub.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (hydrated && storageKey) {
      localStorage.setItem(storageKey, JSON.stringify(items));
    }
  }, [items, hydrated, storageKey]);

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
