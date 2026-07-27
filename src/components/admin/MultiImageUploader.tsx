import React, { useState, useRef, useEffect } from "react";
import {
  Upload,
  Image as ImageIcon,
  Film,
  FileText,
  X,
  ArrowRightLeft,
  ChevronsUpDown,
  Plus,
  Compass,
  AlertTriangle,
  Sparkles,
  Zap,
} from "lucide-react";
import { toast } from "sonner";
import { safeRandomUUID } from "@/lib/safeId";

export interface GalleryAsset {
  id: string;
  url: string;
  name: string;
  type: "image" | "video" | "document";
  size: string;
  compressedSize?: string;
  isCover: boolean;
  sortOrder: number;
}

interface MultiImageUploaderProps {
  initialAssets?: GalleryAsset[];
  assets?: GalleryAsset[];
  onChange: (assets: GalleryAsset[]) => void;
}

function compressAndToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    if (!file.type.startsWith("image/")) {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = (err) => reject(err);
      reader.readAsDataURL(file);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          resolve(e.target?.result as string);
          return;
        }

        const MAX_WIDTH = 800;
        const MAX_HEIGHT = 800;
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }

        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);

        const dataUrl = canvas.toDataURL("image/jpeg", 0.7);
        resolve(dataUrl);
      };
      img.onerror = () => {
        resolve(e.target?.result as string);
      };
      img.src = e.target?.result as string;
    };
    reader.onerror = (err) => reject(err);
    reader.readAsDataURL(file);
  });
}

export function MultiImageUploader({
  initialAssets,
  assets: propAssets,
  onChange,
}: MultiImageUploaderProps) {
  const [assets, setAssets] = useState<GalleryAsset[]>(propAssets || initialAssets || []);
  const [isDragging, setIsDragging] = useState(false);
  const [fitModes, setFitModes] = useState<Record<string, "cover" | "contain">>({});
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    const incoming = propAssets || initialAssets || [];
    if (
      incoming.length !== assets.length ||
      incoming.some((a, i) => a.id !== assets[i]?.id || a.url !== assets[i]?.url)
    ) {
      setAssets(incoming);
    }
  }, [propAssets, initialAssets, assets]);

  const toggleFitMode = (id: string) => {
    setFitModes((prev) => ({
      ...prev,
      [id]: prev[id] === "contain" ? "cover" : "contain",
    }));
  };

  const formatSize = (bytes: number): string => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
  };

  const handleFiles = async (fileList: FileList) => {
    if (fileList.length === 0) return;
    setIsUploading(true);
    setUploadProgress(10);

    const tempAssets: GalleryAsset[] = [];
    const duplicatesDetected: string[] = [];

    const files = Array.from(fileList);

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      // 1. Check for duplicates in existing list based on filename or size
      const isDuplicate = assets.some(
        (as) =>
          as.name === file.name ||
          (as.size === formatSize(file.size) && as.name.split(".")[0] === file.name.split(".")[0]),
      );

      if (isDuplicate) {
        duplicatesDetected.push(file.name);
        continue;
      }

      // 2. Identify asset type
      let type: "image" | "video" | "document" = "image";
      if (file.type.startsWith("video/")) {
        type = "video";
      } else if (
        file.type === "application/pdf" ||
        file.name.endsWith(".pdf") ||
        file.name.endsWith(".doc")
      ) {
        type = "document";
      }

      setUploadProgress(Math.round(10 + (i / files.length) * 80));

      try {
        const base64Url = await compressAndToBase64(file);

        // Simulate compression on upload
        const originalSizeBytes = file.size;
        const compressionFactor = type === "image" ? 0.3 : 1.0;
        const compressedSizeBytes = Math.round(originalSizeBytes * compressionFactor);

        tempAssets.push({
          id: `asset-${safeRandomUUID()}`,
          url: base64Url,
          name: file.name,
          type,
          size: formatSize(originalSizeBytes),
          compressedSize: type === "image" ? formatSize(compressedSizeBytes) : undefined,
          isCover: false,
          sortOrder: assets.length + tempAssets.length,
        });
      } catch (err) {
        console.error(err);
        toast.error(`تعذر رفع الملف ${file.name}`);
      }
    }

    setUploadProgress(100);
    setTimeout(() => {
      setIsUploading(false);
      setUploadProgress(null);

      if (duplicatesDetected.length > 0) {
        toast.warning(
          `⚠️ تم رصد ملفات مكررة تم تجاهلها: ${duplicatesDetected.slice(0, 2).join(", ")}${
            duplicatesDetected.length > 2 ? "..." : ""
          }`,
        );
      }

      if (tempAssets.length > 0) {
        const hasCover = assets.some((as) => as.isCover);
        const finalizedAssets = tempAssets.map((as, i) => ({
          ...as,
          isCover: !hasCover && i === 0,
        }));

        const updated = [...assets, ...finalizedAssets];
        const checkCover = updated.some((as) => as.isCover);
        if (!checkCover && updated.length > 0) {
          updated[0].isCover = true;
        }

        setAssets(updated);
        onChange(updated);
        toast.success(`تم رفع ${tempAssets.length} ملفات بنجاح للمنتج!`);
      }
    }, 300);
  };

  const removeAsset = (id: string) => {
    const updated = assets.filter((as) => as.id !== id);
    // Recalculate sortOrders and covers
    const finalized = updated.map((as, index) => ({
      ...as,
      isCover: index === 0,
      sortOrder: index,
    }));
    setAssets(finalized);
    onChange(finalized);
  };

  const setAsCover = (id: string) => {
    const updated = assets.map((as) => ({
      ...as,
      isCover: as.id === id,
    }));
    setAssets(updated);
    onChange(updated);
    toast.success("تم تحديد الصورة كصورة الغلاف الأساسية");
  };

  // Reorder sorting: shift up/down
  const moveAsset = (index: number, direction: "up" | "down") => {
    if (direction === "up" && index === 0) return;
    if (direction === "down" && index === assets.length - 1) return;

    const targetIdx = direction === "up" ? index - 1 : index + 1;
    const updated = [...assets];
    const temp = updated[index];
    updated[index] = updated[targetIdx];
    updated[targetIdx] = temp;

    // Save and sync order
    const finalized = updated.map((as, idx) => ({
      ...as,
      sortOrder: idx,
    }));
    setAssets(finalized);
    onChange(finalized);
  };

  return (
    <div className="space-y-3">
      {/* Drag & Drop Area */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          if (e.dataTransfer.files) handleFiles(e.dataTransfer.files);
        }}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition ${
          isDragging
            ? "border-brand-accent bg-brand-accent/5 scale-[0.99]"
            : "border-brand-dark/15 hover:border-brand-primary"
        }`}
      >
        <input
          type="file"
          multiple
          ref={fileInputRef}
          onChange={(e) => {
            if (e.target.files) handleFiles(e.target.files);
            e.target.value = "";
          }}
          className="hidden"
          accept="image/*,video/*,application/pdf"
        />
        <div className="flex flex-col items-center gap-2">
          <div className="w-12 h-12 rounded-full bg-brand-primary/10 grid place-items-center text-brand-primary">
            <Upload className="w-6 h-6" />
          </div>
          <p className="font-bold text-xs md:text-sm text-brand-dark">
            اسحب وأفلت الصور والفيديوهات هنا أو تصفح جهازك
          </p>
          <span className="text-[10px] text-muted-foreground block">
            ندعم رفع جميع مقاسات وأبعاد الصور (رأسي، أفقي، مربع، بانورامي) وملفات الـ PDF بالتوازي
            دون أي قص تلقائي!
          </span>
        </div>
      </div>

      {isUploading && uploadProgress !== null && (
        <div className="bg-brand-dark/5 border border-brand-dark/10 p-4 rounded-2xl space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="font-bold text-brand-dark animate-pulse">
              جاري رفع ومعالجة الملفات...
            </span>
            <span className="font-mono text-brand-primary font-bold">{uploadProgress}%</span>
          </div>
          <div className="w-full bg-neutral-200 h-2 rounded-full overflow-hidden">
            <div
              className="bg-brand-accent h-full transition-all duration-150 ease-out"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}

      {/* Asset previews and order list */}
      {assets.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">
            مكتبة وسائط المنتج والترتيب:
          </span>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {assets.map((as, index) => (
              <div
                key={as.id}
                className={`relative bg-card border rounded-2xl p-2 flex flex-col gap-2 group transition ${
                  as.isCover
                    ? "border-brand-accent ring-1 ring-brand-accent/30"
                    : "border-brand-dark/5"
                }`}
              >
                <div className="relative aspect-square rounded-xl overflow-hidden bg-secondary flex items-center justify-center">
                  {as.type === "image" && (
                    <img
                      src={as.url}
                      alt={as.name}
                      referrerPolicy="no-referrer"
                      className={`w-full h-full transition-all duration-200 ${
                        fitModes[as.id] === "contain"
                          ? "object-contain bg-brand-dark/5 p-1"
                          : "object-cover"
                      }`}
                    />
                  )}
                  {as.type === "video" && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1 p-2">
                      <Film className="w-8 h-8 text-sky-500" />
                      <span className="text-[9px] font-bold text-center line-clamp-1">
                        {as.name}
                      </span>
                    </div>
                  )}
                  {as.type === "document" && (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground gap-1 p-2">
                      <FileText className="w-8 h-8 text-rose-500" />
                      <span className="text-[9px] font-bold text-center line-clamp-1">
                        {as.name}
                      </span>
                    </div>
                  )}

                  {/* Badge types */}
                  <span className="absolute bottom-1.5 right-1.5 text-[8px] font-extrabold bg-brand-dark/80 text-brand-bg px-2 py-0.5 rounded-full">
                    {as.type === "image" && "صورة"}
                    {as.type === "video" && "فيديو"}
                    {as.type === "document" && "كتالوج PDF"}
                  </span>

                  {as.isCover && (
                    <span className="absolute top-1.5 right-1.5 text-[8px] font-extrabold bg-brand-accent text-brand-dark px-2 py-0.5 rounded-full">
                      الغلاف الرئيسي
                    </span>
                  )}
                </div>

                <div className="min-w-0">
                  <h4 className="text-[10px] font-bold truncate block">{as.name}</h4>
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                    <span>{as.size}</span>
                    {as.compressedSize && (
                      <span className="text-emerald-600 font-bold flex items-center gap-0.5">
                        <Zap className="w-2.5 h-2.5 fill-current" /> {as.compressedSize}
                      </span>
                    )}
                  </div>
                </div>

                {/* Rearrange handles and utility overlays */}
                <div className="flex justify-between items-center gap-1.5 pt-1 border-t border-brand-dark/5">
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => moveAsset(index, "up")}
                      disabled={index === 0}
                      className="w-5 h-5 bg-secondary text-brand-dark disabled:opacity-30 rounded flex items-center justify-center text-[10px]"
                      title="تحريك للأمام"
                    >
                      ▲
                    </button>
                    <button
                      type="button"
                      onClick={() => moveAsset(index, "down")}
                      disabled={index === assets.length - 1}
                      className="w-5 h-5 bg-secondary text-brand-dark disabled:opacity-30 rounded flex items-center justify-center text-[10px]"
                      title="تحريك للخلف"
                    >
                      ▼
                    </button>
                  </div>

                  <div className="flex gap-1 items-center">
                    {as.type === "image" && (
                      <button
                        type="button"
                        onClick={() => toggleFitMode(as.id)}
                        className={`text-[9px] font-bold px-1.5 py-0.5 rounded transition ${
                          fitModes[as.id] === "contain"
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-secondary text-brand-dark hover:bg-neutral-200"
                        }`}
                        title="تغيير طريقة العرض (كامل المقاس / ملء الإطار)"
                      >
                        {fitModes[as.id] === "contain" ? "ملء" : "احتواء"}
                      </button>
                    )}
                    {!as.isCover && (
                      <button
                        type="button"
                        onClick={() => setAsCover(as.id)}
                        className="text-[9px] font-bold text-brand-primary hover:underline"
                      >
                        غلاف
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => removeAsset(as.id)}
                      className="w-5 h-5 text-destructive hover:bg-destructive/10 rounded flex items-center justify-center"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
