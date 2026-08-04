/* eslint-disable react-refresh/only-export-components */
import React, { useState, useEffect } from "react";
import { useIsAdmin } from "@/lib/useIsAdmin";
import { MarketplaceStore } from "@/lib/marketplaceStore";
import {
  Edit3,
  Check,
  Save,
  X,
  Plus,
  Trash2,
  Layers,
  ZoomIn,
  ZoomOut,
  Type,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { toast } from "sonner";

// Global state for live editing mode
let isLiveEditActive = false;
const listeners = new Set<() => void>();

export function useLiveEditMode() {
  const [active, setActive] = useState(isLiveEditActive);
  const [edits, setEdits] = useState(() => MarketplaceStore.getLiveCmsEdits());

  useEffect(() => {
    const update = () => {
      setActive(isLiveEditActive);
      setEdits(MarketplaceStore.getLiveCmsEdits());
    };
    listeners.add(update);
    window.addEventListener("beitak-live-cms-updated", update);
    return () => {
      listeners.delete(update);
      window.removeEventListener("beitak-live-cms-updated", update);
    };
  }, []);

  const toggleLiveEdit = () => {
    isLiveEditActive = !isLiveEditActive;
    listeners.forEach((fn) => fn());
  };

  const updateField = (id: string, value: string) => {
    const current = MarketplaceStore.getLiveCmsEdits();
    const updated = { ...current, [id]: value };
    MarketplaceStore.saveLiveCmsEdits(updated);
  };

  return { active, toggleLiveEdit, edits, updateField };
}

// LiveEditable component that wraps any text or heading without modifying site colors
export function LiveText({
  id,
  defaultText,
  className = "",
  as: Component = "span",
  multiline = false,
}: {
  id: string;
  defaultText: string;
  className?: string;
  as?: React.ElementType;
  multiline?: boolean;
}) {
  const { active, edits, updateField } = useLiveEditMode();
  const currentText = edits[id] !== undefined ? edits[id] : defaultText;
  const [isEditing, setIsEditing] = useState(false);
  const [val, setVal] = useState(currentText);

  useEffect(() => {
    setVal(currentText);
  }, [currentText]);

  if (currentText === "__DELETED__") {
    return null;
  }

  if (!active) {
    return <Component className={className}>{currentText}</Component>;
  }

  if (isEditing) {
    return (
      <span
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
        }}
        className="inline-flex items-center gap-1.5 bg-[#1C1613] border-2 border-[#D2B48C] rounded-xl p-2 z-[9999] shadow-2xl animate-scaleIn my-1 text-[#F8F5EE]"
      >
        {multiline ? (
          <textarea
            value={val}
            onChange={(e) => setVal(e.target.value)}
            className="bg-white px-3 py-2 text-xs font-bold text-[#1C1613] rounded-lg border border-[#D2B48C] outline-none w-72 h-20 resize-y"
            autoFocus
          />
        ) : (
          <input
            type="text"
            value={val}
            onChange={(e) => setVal(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                updateField(id, val);
                setIsEditing(false);
                toast.success("تم حفظ التعديل بنجاح");
              } else if (e.key === "Escape") {
                e.preventDefault();
                setIsEditing(false);
              }
            }}
            className="bg-white px-3 py-1.5 text-xs font-bold text-[#1C1613] rounded-lg border border-[#D2B48C] outline-none w-64 max-w-full"
            autoFocus
            onFocus={(e) => e.target.select()}
          />
        )}
        <div className="flex flex-col gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              updateField(id, val);
              setIsEditing(false);
              toast.success("تم حفظ التعديل بنجاح");
            }}
            className="bg-[#5C4033] text-white p-2 rounded-lg hover:bg-[#1C1613] cursor-pointer shadow-xs"
            title="حفظ"
          >
            <Check className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              setIsEditing(false);
            }}
            className="bg-stone-600 text-white p-2 rounded-lg hover:bg-stone-700 cursor-pointer shadow-xs"
            title="إلغاء"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </span>
    );
  }

  return (
    <Component
      onClick={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsEditing(true);
      }}
      onMouseDown={(e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
      }}
      className={`${className} cursor-pointer border border-dashed border-[#D2B48C] rounded px-1 py-0.5 relative group select-none transition`}
      title="انقر لتعديل هذا النص مباشرة"
    >
      {currentText}
      <span className="inline-flex ml-1.5 text-[10px] text-[#1C1613] bg-[#D2B48C] px-1.5 py-0.5 rounded font-black items-center gap-0.5 shadow-xs opacity-80 group-hover:opacity-100">
        <Edit3 className="w-3 h-3 inline" /> تعديل
      </span>
    </Component>
  );
}

export interface CustomLiveSection {
  id: string;
  title: string;
  subtitle: string;
  type: "banner" | "notice" | "card" | "button";
  badgeText?: string;
  buttonText?: string;
  buttonUrl?: string;
  bgColor?: string;
}

// Custom Live Sections Display Component with Full Move, Edit & Delete Control
export function LiveCustomSectionsContainer() {
  const { active } = useLiveEditMode();
  const [sections, setSections] = useState<CustomLiveSection[]>(() => {
    return MarketplaceStore.getSiteThemeSettings().customLiveSections || [];
  });

  const [editingSection, setEditingSection] = useState<CustomLiveSection | null>(null);

  useEffect(() => {
    const handleUpdate = () => {
      setSections(MarketplaceStore.getSiteThemeSettings().customLiveSections || []);
    };
    window.addEventListener("beitak-theme-updated", handleUpdate);
    window.addEventListener("beitak-live-cms-updated", handleUpdate);
    window.addEventListener("storage", handleUpdate);
    return () => {
      window.removeEventListener("beitak-theme-updated", handleUpdate);
      window.removeEventListener("beitak-live-cms-updated", handleUpdate);
      window.removeEventListener("storage", handleUpdate);
    };
  }, []);

  if (sections.length === 0) return null;

  const saveSections = (newList: CustomLiveSection[]) => {
    setSections(newList);
    const theme = MarketplaceStore.getSiteThemeSettings();
    MarketplaceStore.saveSiteThemeSettings({
      ...theme,
      customLiveSections: newList,
    });
    window.dispatchEvent(new Event("beitak-theme-updated"));
  };

  const handleDelete = (id: string) => {
    MarketplaceStore.deleteCustomLiveSection(id);
    const updated = sections.filter((s) => s.id !== id);
    setSections(updated);
    toast.success("تم حذف القسم بنجاح بشكل دائم من الماركت بليس");
  };

  const handleMoveUp = (index: number) => {
    if (index <= 0) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index - 1];
    updated[index - 1] = temp;
    saveSections(updated);
    toast.success("تم تقديم ترتيب القسم لأعلى");
  };

  const handleMoveDown = (index: number) => {
    if (index >= sections.length - 1) return;
    const updated = [...sections];
    const temp = updated[index];
    updated[index] = updated[index + 1];
    updated[index + 1] = temp;
    saveSections(updated);
    toast.success("تم إنزال ترتيب القسم لأسفل");
  };

  const handleUpdateSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingSection) return;
    const updated = sections.map((s) => (s.id === editingSection.id ? editingSection : s));
    saveSections(updated);
    setEditingSection(null);
    toast.success("تم تحديث بيانات القسم التفاعلي بنجاح");
  };

  return (
    <div className="max-w-[1550px] mx-auto px-4 py-4 space-y-4" dir="rtl">
      {sections.map((sec, index) => (
        <div
          key={sec.id}
          id={sec.id}
          data-live-id={sec.id}
          className={`relative rounded-3xl p-6 border shadow-md transition flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
            sec.bgColor || "bg-brand-dark text-brand-bg border-brand-accent/30"
          }`}
        >
          {/* Section Management Action Controls in Edit Mode */}
          {active && (
            <div className="absolute top-3 left-3 flex items-center gap-1.5 bg-card border border-brand-dark/20 p-1.5 rounded-2xl shadow-xl z-20">
              <button
                type="button"
                onClick={() => handleMoveUp(index)}
                disabled={index === 0}
                className="bg-brand-dark hover:bg-brand-accent hover:text-brand-dark text-brand-bg p-1.5 rounded-xl disabled:opacity-30 cursor-pointer text-xs transition"
                title="تحريك لأعلى"
              >
                <ArrowUp className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => handleMoveDown(index)}
                disabled={index === sections.length - 1}
                className="bg-brand-dark hover:bg-brand-accent hover:text-brand-dark text-brand-bg p-1.5 rounded-xl disabled:opacity-30 cursor-pointer text-xs transition"
                title="تحريك لأسفل"
              >
                <ArrowDown className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setEditingSection(sec)}
                className="bg-brand-accent hover:bg-amber-500 text-brand-dark font-extrabold px-3 py-1 rounded-xl text-[11px] cursor-pointer transition"
                title="تعديل هذا القسم"
              >
                تعديل
              </button>
              <button
                type="button"
                onClick={() => handleDelete(sec.id)}
                className="bg-rose-600 hover:bg-rose-700 text-white p-1.5 rounded-xl cursor-pointer transition"
                title="حذف هذا القسم"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          )}

          <div className="space-y-1.5 max-w-2xl">
            {sec.badgeText && (
              <span className="bg-brand-accent/20 text-brand-accent text-xs font-black px-3 py-1 rounded-full inline-block mb-1 border border-brand-accent/30">
                {sec.badgeText}
              </span>
            )}
            <h3 className="text-lg md:text-2xl font-extrabold leading-snug">{sec.title}</h3>
            {sec.subtitle && (
              <p className="text-xs md:text-sm font-medium opacity-90 leading-relaxed">
                {sec.subtitle}
              </p>
            )}
          </div>

          {sec.buttonText && (
            <a
              href={sec.buttonUrl || "#"}
              className="bg-brand-accent hover:bg-amber-500 text-brand-dark font-extrabold px-6 py-3.5 rounded-2xl text-xs transition shadow-md shrink-0 inline-flex items-center gap-2 cursor-pointer"
            >
              {sec.buttonText}
            </a>
          )}
        </div>
      ))}

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-[10002] bg-black/70 flex items-center justify-center p-4">
          <div className="bg-card text-brand-dark border border-brand-dark/20 rounded-3xl p-6 w-full max-w-lg space-y-4 shadow-2xl">
            <h3 className="text-base font-extrabold text-brand-dark border-b border-brand-dark/10 pb-3">
              تعديل بيانات القسم التفاعلي
            </h3>
            <form onSubmit={handleUpdateSection} className="space-y-3 text-xs">
              <div>
                <label className="block mb-1 font-bold">العنوان الرئيسي:</label>
                <input
                  type="text"
                  value={editingSection.title}
                  onChange={(e) => setEditingSection({ ...editingSection, title: e.target.value })}
                  className="w-full bg-background border border-brand-dark/15 text-brand-dark font-bold p-3 rounded-xl outline-none focus:border-brand-accent"
                  required
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">الوصف:</label>
                <textarea
                  value={editingSection.subtitle}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, subtitle: e.target.value })
                  }
                  className="w-full bg-background border border-brand-dark/15 text-brand-dark font-medium p-3 rounded-xl outline-none focus:border-brand-accent h-20"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block mb-1 font-bold">الشارة:</label>
                  <input
                    type="text"
                    value={editingSection.badgeText || ""}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, badgeText: e.target.value })
                    }
                    className="w-full bg-background border border-brand-dark/15 text-brand-dark font-bold p-2.5 rounded-xl outline-none"
                  />
                </div>
                <div>
                  <label className="block mb-1 font-bold">نص الزر:</label>
                  <input
                    type="text"
                    value={editingSection.buttonText || ""}
                    onChange={(e) =>
                      setEditingSection({ ...editingSection, buttonText: e.target.value })
                    }
                    className="w-full bg-background border border-brand-dark/15 text-brand-dark font-bold p-2.5 rounded-xl outline-none"
                  />
                </div>
              </div>
              <div>
                <label className="block mb-1 font-bold">رابط الزر:</label>
                <input
                  type="text"
                  value={editingSection.buttonUrl || "#"}
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, buttonUrl: e.target.value })
                  }
                  className="w-full bg-background border border-brand-dark/15 text-brand-dark font-mono p-2.5 rounded-xl outline-none"
                />
              </div>
              <div>
                <label className="block mb-1 font-bold">نمط الألوان:</label>
                <select
                  value={
                    editingSection.bgColor || "bg-brand-dark text-brand-bg border-brand-accent/30"
                  }
                  onChange={(e) =>
                    setEditingSection({ ...editingSection, bgColor: e.target.value })
                  }
                  className="w-full bg-background border border-brand-dark/15 text-brand-dark font-bold p-2.5 rounded-xl outline-none"
                >
                  <option value="bg-brand-dark text-brand-bg border-brand-accent/30">
                    داكن فاخر (الافتراضي للموقع)
                  </option>
                  <option value="bg-card text-brand-dark border-brand-dark/10">
                    كارت فاتح أنيق
                  </option>
                  <option value="bg-brand-primary text-white border-brand-primary">
                    اللون الكحلي الرئيسي للمنصة
                  </option>
                  <option value="bg-amber-500/10 text-amber-950 border-amber-500/30">
                    ذهبي دافئ مميز
                  </option>
                </select>
              </div>
              <div className="flex gap-2 pt-3">
                <button
                  type="submit"
                  className="flex-1 bg-brand-accent hover:bg-amber-500 text-brand-dark font-black py-3 rounded-xl text-xs cursor-pointer transition"
                >
                  حفظ التعديلات
                </button>
                <button
                  type="button"
                  onClick={() => setEditingSection(null)}
                  className="bg-secondary text-brand-dark font-bold px-5 py-3 rounded-xl text-xs cursor-pointer hover:bg-secondary/80 transition"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// Universal DOM Inspector for full editing on any text, button, heading, icon, or image
interface SelectedDomElement {
  node: HTMLElement;
  isImage: boolean;
  isIcon: boolean;
  text: string;
  imgSrc: string;
  fontSize: string;
  fontWeight: string;
  textColor: string;
  bgColor: string;
  borderRadius: string;
  widthVal: string;
  heightVal: string;
  objectFit: string;
  paddingVal: string;
  rotateVal: number;
  scale: number;
  rect: DOMRect;
}

// Live Edit Mode Floating Controller Bar for Super Admin Only
export function LiveEditAdminBar() {
  const { isAdmin, loaded } = useIsAdmin();
  const canEdit = isAdmin;

  const { active, toggleLiveEdit } = useLiveEditMode();
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedEl, setSelectedEl] = useState<SelectedDomElement | null>(null);

  // Inspector form states
  const [editVal, setEditVal] = useState("");
  const [imgSrcVal, setImgSrcVal] = useState("");
  const [fontSizeVal, setFontSizeVal] = useState<string>("");
  const [fontWeightVal, setFontWeightVal] = useState<string>("");
  const [textColorVal, setTextColorVal] = useState<string>("");
  const [bgColorVal, setBgColorVal] = useState<string>("");
  const [borderRadiusVal, setBorderRadiusVal] = useState<string>("");
  const [widthVal, setWidthVal] = useState<string>("");
  const [heightVal, setHeightVal] = useState<string>("");
  const [objectFitVal, setObjectFitVal] = useState<string>("cover");
  const [rotateVal, setRotateVal] = useState<number>(0);
  const [scaleVal, setScaleVal] = useState<number>(1);

  // New section form state
  const [secTitle, setSecTitle] = useState("");
  const [secSubtitle, setSecSubtitle] = useState("");
  const [secBadge, setSecBadge] = useState("تنبيه هام");
  const [secBtnText, setSecBtnText] = useState("تصفح الآن");
  const [secBtnUrl, setSecBtnUrl] = useState("/products");
  const [secBgColor, setSecBgColor] = useState("bg-[#1C1613] text-[#F8F5EE] border-[#D2B48C]");

  useEffect(() => {
    if (!active || !canEdit) {
      setSelectedEl(null);
      return;
    }

    const handleGlobalClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Ignore if clicking inside live edit toolbar, floating modals, or section controls
      if (
        target.closest("#live-edit-admin-bar") ||
        target.closest("#live-edit-modal") ||
        target.closest("#live-edit-inspector") ||
        target.closest("button")?.closest(".absolute")
      ) {
        return;
      }

      // Find clickable text, icon, image, button, heading or container
      const el = (target.closest(
        "h1, h2, h3, h4, h5, h6, p, span, button, a, svg, img, label, div",
      ) || target) as HTMLElement;
      if (!el) return;

      const isImage = el.tagName === "IMG" || el.querySelector("img") !== null;
      const isIcon = el.tagName === "SVG" || el.querySelector("svg") !== null;
      const text = el.innerText || el.textContent || "";

      if (!isImage && !isIcon && !text.trim()) return;

      e.preventDefault();
      e.stopPropagation();

      const rect = el.getBoundingClientRect();
      const computedStyle = window.getComputedStyle(el);

      let imgSrc = "";
      if (el.tagName === "IMG") {
        imgSrc = (el as HTMLImageElement).src;
      } else if (el.querySelector("img")) {
        imgSrc = el.querySelector("img")?.src || "";
      }

      const currentFontSize = computedStyle.fontSize || "";
      const currentFontWeight = computedStyle.fontWeight || "normal";
      const currentColor = computedStyle.color || "";
      const currentBg = computedStyle.backgroundColor || "";
      const currentBorderRadius = computedStyle.borderRadius || "";
      const currentWidth = computedStyle.width || "";
      const currentHeight = computedStyle.height || "";
      const currentObjectFit = computedStyle.objectFit || "cover";

      setSelectedEl({
        node: el,
        isImage,
        isIcon,
        text: text.trim(),
        imgSrc,
        fontSize: currentFontSize,
        fontWeight: currentFontWeight,
        textColor: currentColor,
        bgColor: currentBg,
        borderRadius: currentBorderRadius,
        widthVal: currentWidth,
        heightVal: currentHeight,
        objectFit: currentObjectFit,
        paddingVal: "",
        rotateVal: 0,
        scale: 1,
        rect,
      });

      setEditVal(text.trim());
      setImgSrcVal(imgSrc);
      setFontSizeVal(currentFontSize);
      setFontWeightVal(currentFontWeight);
      setTextColorVal("");
      setBgColorVal("");
      setBorderRadiusVal(currentBorderRadius);
      setWidthVal("");
      setHeightVal("");
      setObjectFitVal(currentObjectFit);
      setRotateVal(0);
      setScaleVal(1);
    };

    window.addEventListener("click", handleGlobalClick, true);
    return () => window.removeEventListener("click", handleGlobalClick, true);
  }, [active, canEdit]);

  const handleApplyDomEdits = () => {
    if (!selectedEl?.node) return;

    const el = selectedEl.node;

    if (selectedEl.isImage && imgSrcVal) {
      if (el.tagName === "IMG") {
        (el as HTMLImageElement).src = imgSrcVal;
      } else {
        const innerImg = el.querySelector("img");
        if (innerImg) innerImg.src = imgSrcVal;
      }
    }

    if (!selectedEl.isImage && editVal !== selectedEl.text) {
      if (!el.querySelector("input, select, textarea")) {
        el.innerText = editVal;
      }
    }

    if (fontSizeVal) el.style.fontSize = fontSizeVal;
    if (fontWeightVal) el.style.fontWeight = fontWeightVal;
    if (textColorVal) el.style.color = textColorVal;
    if (bgColorVal) el.style.backgroundColor = bgColorVal;
    if (borderRadiusVal) el.style.borderRadius = borderRadiusVal;
    if (widthVal) el.style.width = widthVal;
    if (heightVal) el.style.height = heightVal;
    if (objectFitVal) el.style.objectFit = objectFitVal;

    let transformStr = "";
    if (scaleVal !== 1) transformStr += `scale(${scaleVal}) `;
    if (rotateVal !== 0) transformStr += `rotate(${rotateVal}deg) `;
    if (transformStr) {
      el.style.transform = transformStr.trim();
      el.style.transformOrigin = "center";
    }

    let elementId = el.id || el.getAttribute("data-live-id");
    if (!elementId) {
      elementId = `live_dom_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      el.setAttribute("data-live-id", elementId);
    }

    const pathKey = `live_${elementId}`;
    const currentEdits = MarketplaceStore.getLiveCmsEdits();
    const updatedEdits = {
      ...currentEdits,
      [pathKey]: JSON.stringify({
        text: editVal,
        imgSrc: imgSrcVal,
        fontSize: fontSizeVal,
        fontWeight: fontWeightVal,
        textColor: textColorVal,
        bgColor: bgColorVal,
        borderRadius: borderRadiusVal,
        widthVal,
        heightVal,
        objectFit: objectFitVal,
        scale: scaleVal,
        rotate: rotateVal,
      }),
      [elementId]: editVal,
    };

    MarketplaceStore.saveLiveCmsEdits(updatedEdits);
    window.dispatchEvent(new Event("beitak-live-cms-updated"));
    setSelectedEl(null);
    toast.success("تم تطبيق التغييرات وحفظ التعديل المباشر بنجاح!");
  };

  const handleDeleteSelectedElement = () => {
    if (!selectedEl?.node) return;

    const el = selectedEl.node;
    const elementId = el.id || el.getAttribute("data-live-id");
    const stableTextSlug = (selectedEl.text || "").trim().slice(0, 20).replace(/\s+/g, "_");
    const pathKey = elementId
      ? `live_${elementId}`
      : `dom_${el.tagName.toLowerCase()}_${stableTextSlug}`;

    const currentEdits = MarketplaceStore.getLiveCmsEdits();
    const updatedEdits = {
      ...currentEdits,
      [pathKey]: "__DELETED__",
    };
    if (elementId) {
      const rawId = elementId.replace(/^live_/, "");
      updatedEdits[elementId] = "__DELETED__";
      updatedEdits[rawId] = "__DELETED__";
      updatedEdits[`live_${rawId}`] = "__DELETED__";
      MarketplaceStore.deleteCustomLiveSection(rawId);
    }

    MarketplaceStore.saveLiveCmsEdits(updatedEdits);
    window.dispatchEvent(new Event("beitak-live-cms-updated"));
    window.dispatchEvent(new Event("beitak-theme-updated"));
    el.style.display = "none";
    toast.success("تم حذف هذا العنصر بنجاح بشكل دائم لكل زوار الموقع");
    setSelectedEl(null);
  };

  const handleCreateCustomSection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!secTitle.trim()) {
      toast.error("يرجى كتابة عنوان القسم أولاً");
      return;
    }

    const newSec: CustomLiveSection = {
      id: "sec-" + Date.now(),
      title: secTitle,
      subtitle: secSubtitle,
      type: "banner",
      badgeText: secBadge,
      buttonText: secBtnText,
      buttonUrl: secBtnUrl,
      bgColor: secBgColor,
    };

    try {
      const theme = MarketplaceStore.getSiteThemeSettings();
      const current = theme.customLiveSections || [];
      const updated = [newSec, ...current];
      MarketplaceStore.saveSiteThemeSettings({
        ...theme,
        customLiveSections: updated,
      });
      window.dispatchEvent(new Event("beitak-theme-updated"));
      toast.success("تم إضافة القسم التفاعلي بنجاح بالماركت بليس");
      setShowAddModal(false);
      setSecTitle("");
      setSecSubtitle("");
    } catch {
      toast.error("حدث خطأ أثناء حفظ القسم الجديد");
    }
  };

  const handleResetAllEdits = () => {
    MarketplaceStore.saveLiveCmsEdits({});
    const theme = MarketplaceStore.getDefaultThemeSettings();
    MarketplaceStore.saveSiteThemeSettings(theme);
    window.dispatchEvent(new Event("beitak-theme-updated"));
    toast.success("تم إعادة ضبط جميع نصوص وأقسام الموقع للأصل بنجاح");
  };

  if (!loaded || !canEdit) {
    return null;
  }

  return (
    <>
      {/* Floating Toggle Button */}
      <div
        id="live-edit-admin-bar"
        className="fixed bottom-5 left-5 z-[9999] flex items-center gap-2"
      >
        <button
          onClick={toggleLiveEdit}
          className={`flex items-center gap-2 px-5 py-3 rounded-full font-black text-xs shadow-2xl border transition cursor-pointer ${
            active
              ? "bg-brand-dark text-brand-accent border-brand-accent ring-2 ring-brand-accent/50"
              : "bg-brand-dark text-brand-bg border-brand-dark/20 hover:bg-brand-primary"
          }`}
        >
          <Edit3 className="w-4 h-4 text-brand-accent" />
          {active ? "إيقاف التعديل المباشر" : "تعديل مباشر بالموقع"}
        </button>

        {active && (
          <button
            onClick={() => setShowAddModal(true)}
            className="flex items-center gap-1.5 bg-brand-accent hover:bg-amber-500 text-brand-dark font-black text-xs px-4 py-3 rounded-full shadow-2xl border border-brand-accent/40 transition cursor-pointer"
            title="إضافة عنصر أو بنر جديد للموقع"
          >
            <Plus className="w-4 h-4" />
            <span>إضافة قسم</span>
          </button>
        )}
      </div>

      {/* Top Banner when active using site brand palette */}
      {active && (
        <div
          id="live-edit-admin-bar"
          className="bg-brand-dark text-brand-bg py-3 px-5 text-xs font-bold sticky top-0 z-[9998] shadow-xl border-b border-brand-accent/20 flex items-center justify-between"
          dir="rtl"
        >
          <div className="flex items-center gap-3">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-accent animate-pulse" />
            <span className="font-black text-brand-accent text-sm">وضع التعديل المباشر</span>
            <span className="text-[11px] text-brand-bg/80 bg-brand-bg/10 border border-brand-accent/20 px-3 py-1 rounded-full hidden sm:inline">
              اضغط على أي نص، عنوان، زر، أو أيقونة بالموقع لتعديلها أو تكبيرها فوراً
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-brand-accent hover:bg-amber-500 text-brand-dark px-3.5 py-1.5 rounded-xl font-black text-xs shadow flex items-center gap-1 cursor-pointer transition"
            >
              <Plus className="w-3.5 h-3.5" />
              إضافة قسم
            </button>
            <button
              onClick={handleResetAllEdits}
              className="bg-brand-primary hover:bg-brand-dark text-white px-3 py-1.5 rounded-xl font-bold text-[11px] cursor-pointer transition border border-brand-accent/20"
              title="إعادة ضبط كافة النصوص للأصل"
            >
              إعادة الضبط
            </button>
            <button
              onClick={() => {
                toast.success("تم حفظ واعتماد كافة التعديلات بنجاح لكل زوار الموقع");
                toggleLiveEdit();
              }}
              className="bg-brand-accent hover:bg-amber-500 text-brand-dark px-4 py-1.5 rounded-xl font-black text-xs shadow flex items-center gap-1.5 cursor-pointer transition"
            >
              <Save className="w-3.5 h-3.5" />
              حفظ واعتماد التعديل
            </button>
            <button
              onClick={toggleLiveEdit}
              className="bg-stone-800 hover:bg-stone-700 text-stone-300 p-1.5 rounded-lg cursor-pointer transition"
              title="إغلاق"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* DOM Element Live Inspector Modal / Floating Panel */}
      {selectedEl && active && (
        <div
          id="live-edit-inspector"
          className="fixed z-[10001] bg-[#1C1613] text-[#F8F5EE] border-2 border-[#D2B48C] rounded-3xl p-5 shadow-2xl w-96 max-w-[92vw] animate-scaleIn space-y-4 max-h-[85vh] overflow-y-auto"
          style={{
            top: Math.min(window.innerHeight - 450, Math.max(20, selectedEl.rect.bottom + 10)),
            left: Math.min(window.innerWidth - 400, Math.max(20, selectedEl.rect.left)),
          }}
          dir="rtl"
        >
          <div className="flex items-center justify-between border-b border-[#5C4033] pb-2.5">
            <span className="text-xs font-black text-[#D2B48C] flex items-center gap-1.5">
              <Type className="w-4 h-4 text-[#D2B48C]" />
              {selectedEl.isImage
                ? "تعديل الصورة المباشرة"
                : selectedEl.isIcon
                  ? "تعديل الأيقونة المباشرة"
                  : "تعديل العنصر والنص المباشر"}
            </span>
            <button
              onClick={() => setSelectedEl(null)}
              className="text-stone-400 hover:text-white p-1 cursor-pointer rounded-lg hover:bg-stone-800"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Image Source Editing */}
          {selectedEl.isImage && (
            <div className="space-y-2 bg-[#2A211C] p-3 rounded-2xl border border-[#D2B48C]/30">
              <label className="text-[11px] font-bold text-[#D2B48C] block">
                رابط الصورة (Image URL / Source):
              </label>
              <input
                type="text"
                value={imgSrcVal}
                onChange={(e) => setImgSrcVal(e.target.value)}
                placeholder="https://..."
                className="w-full bg-white text-[#1C1613] font-mono text-[11px] font-bold p-2 rounded-xl outline-none border border-[#D2B48C]"
              />
              <div className="grid grid-cols-2 gap-2 pt-1">
                <div>
                  <label className="text-[10px] font-bold text-stone-300 block mb-1">
                    طريقة العرض (Fit):
                  </label>
                  <select
                    value={objectFitVal}
                    onChange={(e) => setObjectFitVal(e.target.value)}
                    className="w-full bg-[#5C4033] text-[#F8F5EE] text-[11px] font-bold p-1.5 rounded-xl border border-[#D2B48C]/40 outline-none"
                  >
                    <option value="cover">غلاف كامل (Cover)</option>
                    <option value="contain">احتواء بدون قص (Contain)</option>
                    <option value="fill">تعبئة المساحة (Fill)</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-bold text-stone-300 block mb-1">
                    العرض الذكي:
                  </label>
                  <select
                    value={widthVal}
                    onChange={(e) => setWidthVal(e.target.value)}
                    className="w-full bg-[#5C4033] text-[#F8F5EE] text-[11px] font-bold p-1.5 rounded-xl border border-[#D2B48C]/40 outline-none"
                  >
                    <option value="">تلقائي</option>
                    <option value="100%">كامل العرض (100%)</option>
                    <option value="300px">متوسط (300px)</option>
                    <option value="150px">صغير (150px)</option>
                    <option value="60px">صغير جداً (60px)</option>
                  </select>
                </div>
              </div>
            </div>
          )}

          {/* Text Content Editing for non-image elements */}
          {!selectedEl.isImage && (
            <div className="space-y-2">
              <label className="text-[11px] font-bold text-stone-300 block">
                النص / المحتوى المباشر:
              </label>
              <textarea
                value={editVal}
                onChange={(e) => setEditVal(e.target.value)}
                className="w-full bg-white text-[#1C1613] font-bold text-xs p-2.5 rounded-xl outline-none border border-[#D2B48C] h-16 resize-y"
              />
            </div>
          )}

          {/* Typography & Dimensions Controls */}
          <div className="grid grid-cols-2 gap-2">
            {!selectedEl.isImage && (
              <div>
                <label className="text-[10px] font-bold text-stone-300 block mb-1">حجم الخط:</label>
                <select
                  value={fontSizeVal}
                  onChange={(e) => setFontSizeVal(e.target.value)}
                  className="w-full bg-[#5C4033] text-[#F8F5EE] text-[11px] font-bold p-1.5 rounded-xl border border-[#D2B48C]/40 outline-none"
                >
                  <option value="">تلقائي</option>
                  <option value="11px">صغير جداً (11px)</option>
                  <option value="13px">صغير (13px)</option>
                  <option value="15px">متوسط (15px)</option>
                  <option value="18px">كبير (18px)</option>
                  <option value="22px">كبير جداً (22px)</option>
                  <option value="28px">عنوان ضخم (28px)</option>
                </select>
              </div>
            )}

            {!selectedEl.isImage && (
              <div>
                <label className="text-[10px] font-bold text-stone-300 block mb-1">سمك الخط:</label>
                <select
                  value={fontWeightVal}
                  onChange={(e) => setFontWeightVal(e.target.value)}
                  className="w-full bg-[#5C4033] text-[#F8F5EE] text-[11px] font-bold p-1.5 rounded-xl border border-[#D2B48C]/40 outline-none"
                >
                  <option value="">تلقائي</option>
                  <option value="400">عادي (Normal)</option>
                  <option value="600">متوسط (Medium)</option>
                  <option value="700">عريض (Bold)</option>
                  <option value="900">عريض جداً (Black)</option>
                </select>
              </div>
            )}

            <div>
              <label className="text-[10px] font-bold text-stone-300 block mb-1">
                شكل الحواف (Radius):
              </label>
              <select
                value={borderRadiusVal}
                onChange={(e) => setBorderRadiusVal(e.target.value)}
                className="w-full bg-[#5C4033] text-[#F8F5EE] text-[11px] font-bold p-1.5 rounded-xl border border-[#D2B48C]/40 outline-none"
              >
                <option value="">تلقائي</option>
                <option value="0px">حادة (0px)</option>
                <option value="8px">منحنية خفيفة (8px)</option>
                <option value="16px">دائرية أنيقة (16px)</option>
                <option value="24px">دائرية جداً (24px)</option>
                <option value="9999px">كبسولة / دائرة كاملة</option>
              </select>
            </div>

            <div>
              <label className="text-[10px] font-bold text-stone-300 block mb-1">
                التكبير / الحجم:
              </label>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => setScaleVal((prev) => Math.max(0.5, prev - 0.1))}
                  className="bg-[#5C4033] text-white p-1.5 rounded-lg text-xs hover:bg-[#D2B48C] hover:text-[#1C1613] font-bold cursor-pointer"
                  title="تصغير"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-xs font-black text-[#D2B48C] flex-1 text-center">
                  {(scaleVal * 100).toFixed(0)}%
                </span>
                <button
                  type="button"
                  onClick={() => setScaleVal((prev) => Math.min(2.5, prev + 0.1))}
                  className="bg-[#5C4033] text-white p-1.5 rounded-lg text-xs hover:bg-[#D2B48C] hover:text-[#1C1613] font-bold cursor-pointer"
                  title="تكبير"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>

          {/* Color palette pickers */}
          <div className="space-y-1.5">
            <label className="text-[10px] font-bold text-stone-300 block">
              تغيير اللون المباشر:
            </label>
            <div className="flex items-center gap-1.5 flex-wrap">
              {[
                { name: "ذهبي بيتك", color: "#D2B48C" },
                { name: "بني دافئ", color: "#5C4033" },
                { name: "أسود داكن", color: "#1C1613" },
                { name: "أبيض ناصع", color: "#FFFFFF" },
                { name: "أخضر نجاح", color: "#16a34a" },
                { name: "تنبيه أحمر", color: "#dc2626" },
              ].map((c, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => {
                    if (selectedEl.isIcon) {
                      setTextColorVal(c.color);
                    } else {
                      setTextColorVal(c.color);
                    }
                  }}
                  className="w-6 h-6 rounded-full border-2 border-white/50 shadow hover:scale-110 transition cursor-pointer"
                  style={{ backgroundColor: c.color }}
                  title={c.name}
                />
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2 border-t border-[#5C4033]">
            <button
              onClick={handleApplyDomEdits}
              className="flex-1 bg-[#D2B48C] text-[#1C1613] font-black py-2.5 rounded-xl text-xs hover:bg-[#c5a378] transition cursor-pointer shadow"
            >
              تطبيق وحفظ التغيير
            </button>
            <button
              onClick={handleDeleteSelectedElement}
              className="bg-rose-600 hover:bg-rose-700 text-white font-bold px-3 py-2.5 rounded-xl text-xs cursor-pointer flex items-center gap-1"
              title="حذف هذا العنصر نهائياً"
            >
              <Trash2 className="w-3.5 h-3.5" />
              حذف
            </button>
            <button
              onClick={() => setSelectedEl(null)}
              className="bg-[#5C4033] text-white font-bold px-3 py-2.5 rounded-xl text-xs cursor-pointer"
            >
              إلغاء
            </button>
          </div>
        </div>
      )}

      {/* Modal for adding custom interactive section/banner */}
      {showAddModal && (
        <div
          id="live-edit-modal"
          className="fixed inset-0 z-[10000] bg-black/70 flex items-center justify-center p-4"
          dir="rtl"
        >
          <div className="bg-[#1C1613] text-[#F8F5EE] border-2 border-[#D2B48C] w-full max-w-lg rounded-3xl p-6 shadow-2xl space-y-5">
            <div className="flex items-center justify-between border-b border-[#5C4033] pb-3">
              <h3 className="font-black text-base text-[#D2B48C] flex items-center gap-2">
                <Layers className="w-5 h-5 text-[#D2B48C]" />
                إضافة قسم أو عنصر تفاعلي جديد للموقع
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="w-8 h-8 rounded-full bg-[#5C4033] text-white font-black text-xs grid place-items-center hover:bg-[#D2B48C] hover:text-[#1C1613] cursor-pointer"
              >
                X
              </button>
            </div>

            <form onSubmit={handleCreateCustomSection} className="space-y-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-stone-300">
                  عنوان العنصر / البنر:
                </label>
                <input
                  type="text"
                  value={secTitle}
                  onChange={(e) => setSecTitle(e.target.value)}
                  placeholder="مثال: خصومات حصرية لعملاء بيتك المميزين"
                  className="w-full bg-white text-[#1C1613] border border-[#D2B48C] rounded-xl p-2.5 text-xs font-bold outline-none"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-stone-300">
                  الوصف / التفاصيل الفرعية:
                </label>
                <textarea
                  value={secSubtitle}
                  onChange={(e) => setSecSubtitle(e.target.value)}
                  placeholder="مثال: استمتع بشحن مجاني لكافة المحافظات عند الشراء بأكثر من 1000 ج.م"
                  className="w-full bg-white text-[#1C1613] border border-[#D2B48C] rounded-xl p-2.5 text-xs font-medium outline-none h-20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold mb-1 text-stone-300">
                    نص الشارة العلوية:
                  </label>
                  <input
                    type="text"
                    value={secBadge}
                    onChange={(e) => setSecBadge(e.target.value)}
                    className="w-full bg-white text-[#1C1613] border border-[#D2B48C] rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1 text-stone-300">
                    نص زر التفاعل:
                  </label>
                  <input
                    type="text"
                    value={secBtnText}
                    onChange={(e) => setSecBtnText(e.target.value)}
                    className="w-full bg-white text-[#1C1613] border border-[#D2B48C] rounded-xl p-2.5 text-xs font-bold outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-stone-300">
                  رابط زر التفاعل:
                </label>
                <input
                  type="text"
                  value={secBtnUrl}
                  onChange={(e) => setSecBtnUrl(e.target.value)}
                  placeholder="/products"
                  className="w-full bg-white text-[#1C1613] border border-[#D2B48C] rounded-xl p-2.5 text-xs font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold mb-1 text-stone-300">
                  نمط الألوان والتصميم:
                </label>
                <select
                  value={secBgColor}
                  onChange={(e) => setSecBgColor(e.target.value)}
                  className="w-full bg-[#5C4033] text-[#F8F5EE] border border-[#D2B48C]/40 rounded-xl p-2.5 text-xs font-bold outline-none"
                >
                  <option value="bg-[#1C1613] text-[#F8F5EE] border-[#D2B48C]">
                    داكن فاخر (أسود وبيج)
                  </option>
                  <option value="bg-[#5C4033] text-[#F8F5EE] border-[#D2B48C]">
                    بني دافئ (بيتك الكلاسيكي)
                  </option>
                  <option value="bg-[#F8F5EE] text-[#1C1613] border-[#5C4033]/20">
                    كريمي هادئ ناصع
                  </option>
                </select>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 bg-[#D2B48C] text-[#1C1613] font-black py-3 rounded-2xl shadow transition text-xs cursor-pointer hover:bg-[#c5a378]"
                >
                  نشر وإضافة القسم للموقع
                </button>
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="bg-[#5C4033] text-white font-bold px-4 py-3 rounded-2xl text-xs cursor-pointer"
                >
                  إلغاء
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}
