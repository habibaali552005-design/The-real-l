import React, { useState, useEffect, useRef } from "react";
import { Search, X, History, Sparkles, TrendingUp, ArrowLeft, Package } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Product } from "@/types";
import {
  rankProductsAmazonStyle,
  getSearchHistory,
  saveSearchHistory,
  clearSearchHistory,
  detectTypoCorrection,
  POPULAR_SEARCHES,
} from "@/lib/searchEngine";
import { formatEGP } from "@/lib/cart";

interface SearchBarWithSuggestionsProps {
  products: Product[];
  initialValue?: string;
  onSearchSubmit?: (query: string) => void;
  placeholder?: string;
  className?: string;
  isHeader?: boolean;
}

export function SearchBarWithSuggestions({
  products,
  initialValue = "",
  onSearchSubmit,
  placeholder = "ابحث عن أي منتج باسمه (مثال: طقم انتريه، ثلاجة، ركنة...)",
  className = "",
  isHeader = false,
}: SearchBarWithSuggestionsProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState(initialValue);
  const [isOpen, setIsOpen] = useState(false);
  const [history, setHistory] = useState<string[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setQuery(initialValue);
  }, [initialValue]);

  useEffect(() => {
    setHistory(getSearchHistory());
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Compute live product suggestions based strictly on Product Name first!
  const liveMatches = query.trim()
    ? rankProductsAmazonStyle(products, query.trim()).slice(0, 5)
    : [];

  const typoFix = query.trim() ? detectTypoCorrection(query) : null;

  const handleSearch = (searchTerm: string) => {
    if (!searchTerm.trim()) return;
    saveSearchHistory(searchTerm.trim());
    setHistory(getSearchHistory());
    setIsOpen(false);

    if (onSearchSubmit) {
      onSearchSubmit(searchTerm.trim());
    } else {
      navigate({ to: "/products", search: { q: searchTerm.trim() } });
    }
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch(query);
  };

  return (
    <div ref={containerRef} className={`relative w-full ${className}`}>
      <form onSubmit={handleFormSubmit} className="relative w-full">
        <Search className="w-4 h-4 absolute right-3.5 top-1/2 -translate-y-1/2 text-brand-dark/40 pointer-events-none" />
        <input
          type="search"
          value={query}
          onFocus={() => setIsOpen(true)}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          placeholder={placeholder}
          className="w-full bg-secondary/80 border border-brand-dark/10 rounded-2xl pr-10 pl-10 py-2.5 text-xs text-brand-dark placeholder:text-brand-dark/40 outline-none focus:border-brand-accent focus:bg-card focus:ring-1 focus:ring-brand-accent transition shadow-2xs font-semibold"
        />
        {query && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              if (onSearchSubmit) onSearchSubmit("");
            }}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-brand-dark/40 hover:text-brand-dark"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Live Suggestions Dropdown */}
      {isOpen && (
        <div className="absolute top-full right-0 left-0 mt-2 bg-card rounded-2xl border border-brand-dark/10 shadow-2xl overflow-hidden z-50 text-xs animate-in fade-in slide-in-from-top-1 duration-150">
          {/* Typo Suggestion if available */}
          {typoFix && (
            <div className="p-3 bg-amber-50 border-b border-amber-100 text-amber-800 flex items-center justify-between">
              <span className="flex items-center gap-1.5 font-bold">
                <Sparkles className="w-4 h-4 text-amber-600" />
                هل تقصد: <span className="underline cursor-pointer">{typoFix}</span>؟
              </span>
              <button
                type="button"
                onClick={() => {
                  setQuery(typoFix);
                  handleSearch(typoFix);
                }}
                className="text-[11px] bg-amber-600 text-white px-2.5 py-1 rounded-lg font-bold hover:bg-amber-700"
              >
                بحث عن {typoFix}
              </button>
            </div>
          )}

          {/* Live Product Results (Ranked strictly by Product Name) */}
          {query.trim() && liveMatches.length > 0 && (
            <div className="p-2 border-b border-brand-dark/5">
              <div className="px-3 py-1.5 text-[10px] font-black text-muted-foreground uppercase flex items-center justify-between">
                <span>نتائج المنتجات المباشرة ({liveMatches.length})</span>
                <span className="text-brand-primary">ترتيب حسب اسم المنتج</span>
              </div>
              <div className="space-y-1">
                {liveMatches.map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    onClick={() => {
                      saveSearchHistory(p.name);
                      setIsOpen(false);
                      navigate({ to: "/products", search: { q: p.name, product: p.id } });
                    }}
                    className="w-full flex items-center justify-between p-2 rounded-xl hover:bg-secondary/70 transition text-right group cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-neutral-100 overflow-hidden shrink-0 border border-brand-dark/10">
                        {p.images && p.images[0] ? (
                          <img
                            src={p.images[0]}
                            alt={p.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <Package className="w-5 h-5 text-muted-foreground m-auto" />
                        )}
                      </div>
                      <div>
                        <p className="font-bold text-brand-dark line-clamp-1">{p.name}</p>
                        <p className="text-[10px] text-muted-foreground">{p.category}</p>
                      </div>
                    </div>
                    <div className="text-left shrink-0">
                      <span className="font-extrabold text-brand-primary text-xs">
                        {formatEGP(p.price)}
                      </span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Search History */}
          {!query.trim() && history.length > 0 && (
            <div className="p-2 border-b border-brand-dark/5">
              <div className="px-3 py-1.5 text-[10px] font-black text-muted-foreground flex items-center justify-between">
                <span className="flex items-center gap-1">
                  <History className="w-3 h-3 text-brand-primary" /> عمليات البحث السابقة
                </span>
                <button
                  type="button"
                  onClick={() => {
                    clearSearchHistory();
                    setHistory([]);
                  }}
                  className="text-[10px] text-destructive hover:underline cursor-pointer"
                >
                  مسح السجل
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 p-1.5">
                {history.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(item);
                      handleSearch(item);
                    }}
                    className="px-3 py-1 bg-secondary rounded-lg text-xs font-bold text-brand-dark hover:bg-brand-primary/10 hover:text-brand-primary transition cursor-pointer"
                  >
                    {item}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Popular Searches */}
          {!query.trim() && (
            <div className="p-2">
              <div className="px-3 py-1.5 text-[10px] font-black text-muted-foreground flex items-center gap-1">
                <TrendingUp className="w-3 h-3 text-amber-600" /> الأكثر بحثاً هذا الأسبوع
              </div>
              <div className="grid grid-cols-2 gap-1 p-1">
                {POPULAR_SEARCHES.map((pop, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => {
                      setQuery(pop);
                      handleSearch(pop);
                    }}
                    className="flex items-center justify-between p-2 rounded-xl text-xs font-bold text-brand-dark hover:bg-secondary text-right transition cursor-pointer"
                  >
                    <span>{pop}</span>
                    <ArrowLeft className="w-3 h-3 text-muted-foreground" />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Direct Submit Action */}
          {query.trim() && (
            <div className="p-2 bg-secondary/40 text-center">
              <button
                type="button"
                onClick={() => handleSearch(query)}
                className="w-full py-2 bg-brand-primary text-white rounded-xl font-bold text-xs hover:bg-brand-dark transition cursor-pointer"
              >
                عرض جميع نتائج البحث عن &quot;{query}&quot;
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
