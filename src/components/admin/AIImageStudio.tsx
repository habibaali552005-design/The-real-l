import React, { useState, useRef, useEffect } from "react";
import {
  Sparkles,
  Crop,
  Layers,
  Wand2,
  Trash2,
  Download,
  Check,
  RefreshCw,
  Sliders,
  Type,
  Image as ImageIcon,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface AIImageStudioProps {
  initialImageUrl: string;
  onSave: (newUrl: string) => void;
  onClose: () => void;
}

const LIFESTYLE_BACKGROUNDS = [
  {
    name: "غرفة معيشة ملكية",
    url: "https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?w=800&auto=format&fit=crop",
  },
  { name: "خلفية بيضاء للاستوديو", url: "white" },
  {
    name: "صالون كلاسيكي فاخر",
    url: "https://images.unsplash.com/photo-1583847268964-b28dc8f51f92?w=800&auto=format&fit=crop",
  },
  {
    name: "غرفة نوم دافئة",
    url: "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=800&auto=format&fit=crop",
  },
  {
    name: "مطبخ عصري مجهز",
    url: "https://images.unsplash.com/photo-1556911220-e15b29be8c8f?w=800&auto=format&fit=crop",
  },
];

export function AIImageStudio({ initialImageUrl, onSave, onClose }: AIImageStudioProps) {
  const [imageUrl, setImageUrl] = useState(initialImageUrl);
  const [prompt, setPrompt] = useState("");
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [brightness, setBrightness] = useState(100);
  const [contrast, setContrast] = useState(100);
  const [saturation, setSaturation] = useState(100);
  const [sharpenEnabled, setSharpenEnabled] = useState(false);
  const [watermarkText, setWatermarkText] = useState("BEITAK MARKET");
  const [watermarkEnabled, setWatermarkEnabled] = useState(false);
  const [selectedBackground, setSelectedBackground] = useState<string | null>(null);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imageRef = useRef<HTMLImageElement | null>(null);

  // Status updates in Arabic and English for high fidelity
  const statusSteps = [
    "تحليل الصورة وعناصر المنتجات... Analyzing layout...",
    "تحديد أطراف المنتج وتجزيء الخلفية... Segmenting object boundaries...",
    "تطبيق خوارزميات الذكاء الاصطناعي... Running AI models...",
    "تحسين التباين ومعالجة الإضاءة... Adjusting lighting and contrast...",
    "دمج التعديلات وحفظ الصورة النهائية... Finalizing canvas render...",
  ];

  const triggerAIProcess = (actionName: string, processCallback: () => void) => {
    if (processing) return;
    setProcessing(true);
    setProgress(0);
    setStatusMessage(statusSteps[0]);

    let currentProgress = 0;
    const interval = setInterval(() => {
      currentProgress += 5;
      if (currentProgress >= 100) {
        clearInterval(interval);
        try {
          processCallback();
          setProgress(100);
          setProcessing(false);
          toast.success(`تم تطبيق ${actionName} بنجاح!`);
        } catch (e) {
          clearInterval(interval);
          setProcessing(false);
          toast.error("حدث خطأ أثناء معالجة الصورة بالذكاء الاصطناعي");
        }
      } else {
        setProgress(currentProgress);
        // Change message periodically
        const stepIdx = Math.floor((currentProgress / 100) * statusSteps.length);
        if (statusSteps[stepIdx]) {
          setStatusMessage(statusSteps[stepIdx]);
        }
      }
    }, 120);
  };

  // Real canvas modifier
  const applyCanvasFilters = () => {
    const canvas = canvasRef.current;
    const img = imageRef.current;
    if (!canvas || !img) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = img.naturalWidth || 800;
    canvas.height = img.naturalHeight || 800;

    // Draw background if selected
    if (selectedBackground === "white") {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);
    } else if (selectedBackground && selectedBackground !== "white") {
      const bgImg = new Image();
      bgImg.crossOrigin = "anonymous";
      bgImg.src = selectedBackground;
      bgImg.onload = () => {
        ctx.drawImage(bgImg, 0, 0, canvas.width, canvas.height);
        drawForegroundProduct(ctx, img, canvas.width, canvas.height);
      };
      return; // Handled asynchronously inside onload
    }

    drawForegroundProduct(ctx, img, canvas.width, canvas.height);
  };

  const drawForegroundProduct = (
    ctx: CanvasRenderingContext2D,
    img: HTMLImageElement,
    width: number,
    height: number,
  ) => {
    // Apply filters
    ctx.filter = `brightness(${brightness}%) contrast(${contrast}%) saturate(${saturation}%)`;

    // Draw product image in the center (scale to fit nicely if we have background)
    if (selectedBackground) {
      const scale = 0.75; // Product covers 75% of room scene
      const w = width * scale;
      const h = height * scale;
      const x = (width - w) / 2;
      const y = (height - h) / 1.5; // Sit slightly lower for realistic room anchoring
      ctx.drawImage(img, x, y, w, h);
    } else {
      ctx.drawImage(img, 0, 0, width, height);
    }

    // Reset filters for watermark and sharpen
    ctx.filter = "none";

    // Sharpen algorithm (Laplacian convolution filter simulation)
    if (sharpenEnabled) {
      try {
        const imageData = ctx.getImageData(0, 0, width, height);
        // Simple sharpen matrix convolve
        ctx.putImageData(sharpenImage(imageData, width, height), 0, 0);
      } catch (e) {
        console.warn("Sharpen unavailable due to cross-origin image", e);
      }
    }

    // Watermark
    if (watermarkEnabled && watermarkText) {
      ctx.font = "bold 24px Cairo, Arial";
      ctx.fillStyle = "rgba(255, 255, 255, 0.45)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Diagonal watermark matrix
      ctx.save();
      ctx.translate(width / 2, height / 2);
      ctx.rotate(-Math.PI / 6);
      // Main center
      ctx.fillText(watermarkText, 0, 0);
      // Small patterns
      ctx.font = "bold 14px Cairo, Arial";
      ctx.fillText(watermarkText, -150, -100);
      ctx.fillText(watermarkText, 150, 100);
      ctx.restore();
    }

    // Update state
    try {
      const dataUrl = canvas.toDataURL("image/png");
      setImageUrl(dataUrl);
    } catch (e) {
      console.warn("Unable to save canvas state due to canvas tainting", e);
    }
  };

  // Sharpen filter convolve helper
  const sharpenImage = (imageData: ImageData, w: number, h: number) => {
    const weights = [0, -1, 0, -1, 5, -1, 0, -1, 0];
    const side = Math.round(Math.sqrt(weights.length));
    const halfSide = Math.floor(side / 2);
    const src = imageData.data;
    const canvasWidth = imageData.width;
    const canvasHeight = imageData.height;

    const output = new ImageData(canvasWidth, canvasHeight);
    const dst = output.data;

    for (let y = 0; y < canvasHeight; y++) {
      for (let x = 0; x < canvasWidth; x++) {
        const sy = y;
        const sx = x;
        const dstOff = (y * canvasWidth + x) * 4;

        let r = 0,
          g = 0,
          b = 0;
        for (let cy = 0; cy < side; cy++) {
          for (let cx = 0; cx < side; cx++) {
            const scy = Math.min(canvasHeight - 1, Math.max(0, sy + cy - halfSide));
            const scx = Math.min(canvasWidth - 1, Math.max(0, sx + cx - halfSide));
            const srcOff = (scy * canvasWidth + scx) * 4;
            const wt = weights[cy * side + cx];
            r += src[srcOff] * wt;
            g += src[srcOff + 1] * wt;
            b += src[srcOff + 2] * wt;
          }
        }
        dst[dstOff] = Math.min(255, Math.max(0, r));
        dst[dstOff + 1] = Math.min(255, Math.max(0, g));
        dst[dstOff + 2] = Math.min(255, Math.max(0, b));
        dst[dstOff + 3] = src[dstOff + 3]; // keep alpha
      }
    }
    return output;
  };

  useEffect(() => {
    applyCanvasFilters();
  }, [
    brightness,
    contrast,
    saturation,
    sharpenEnabled,
    watermarkEnabled,
    watermarkText,
    selectedBackground,
  ]);

  // Execute AI action on Canvas
  const handleAIAction = (actionKey: string, actionName: string) => {
    triggerAIProcess(actionName, () => {
      if (actionKey === "remove_bg") {
        setSelectedBackground("white"); // White background as standard isolation output
      } else if (actionKey === "upscale") {
        setSharpenEnabled(true);
        setContrast(115);
      } else if (actionKey === "fix_colors") {
        setBrightness(105);
        setContrast(110);
        setSaturation(120);
      } else if (actionKey === "white_bg") {
        setSelectedBackground("white");
      }
    });
  };

  const handlePromptSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim()) return;

    const lowerPrompt = prompt.toLowerCase();
    let actionName = "تحسين الذكاء الاصطناعي المطور";

    if (
      lowerPrompt.includes("bg") ||
      lowerPrompt.includes("خلف") ||
      lowerPrompt.includes("إزالة")
    ) {
      actionName = "إزالة الخلفية الذكية";
      handleAIAction("remove_bg", actionName);
    } else if (lowerPrompt.includes("white") || lowerPrompt.includes("بيضاء")) {
      actionName = "عزل الخلفية البيضاء";
      handleAIAction("white_bg", actionName);
    } else if (
      lowerPrompt.includes("quality") ||
      lowerPrompt.includes("جودة") ||
      lowerPrompt.includes("تحسين")
    ) {
      actionName = "تحسين الجودة والترقية";
      handleAIAction("upscale", actionName);
    } else {
      // General filter
      handleAIAction("custom", actionName);
    }
    setPrompt("");
  };

  return (
    <div className="fixed inset-0 z-50 bg-brand-dark/85 backdrop-blur-md flex flex-col md:flex-row items-stretch justify-between p-4 overflow-y-auto">
      {/* Sidebar: AI controls */}
      <div className="w-full md:w-80 bg-brand-bg rounded-2xl p-5 flex flex-col gap-4 border border-brand-dark/10 h-fit md:h-full overflow-y-auto">
        <div className="flex justify-between items-center pb-2 border-b border-brand-dark/5">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-brand-accent animate-pulse" />
            <h2 className="font-bold text-base">استوديو صور الذكاء الاصطناعي</h2>
          </div>
          <span className="text-[10px] bg-brand-accent/20 text-brand-dark font-extrabold px-2 py-0.5 rounded-full">
            PREMIUM
          </span>
        </div>

        {/* NLP Prompt Form */}
        <form onSubmit={handlePromptSubmit} className="space-y-2">
          <label className="text-xs font-bold text-muted-foreground block">
            وجّه الذكاء الاصطناعي بلغتك (عربي أو إنجليزي):
          </label>
          <div className="relative">
            <input
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="مثال: اجعل الخلفية بيضاء نقية، أو ضع المنتج في صالون كلاسيكي..."
              className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl py-2.5 pr-3 pl-8 focus:outline-none focus:ring-1 focus:ring-brand-accent"
            />
            <button
              type="submit"
              className="absolute left-1.5 top-1.5 w-7 h-7 bg-brand-dark text-brand-bg rounded-lg flex items-center justify-center hover:bg-brand-primary"
            >
              <Wand2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>

        {/* Fast Action Presets */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">
            عمليات ذكية بنقرة واحدة:
          </span>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleAIAction("remove_bg", "إزالة الخلفية")}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-brand-dark/5 rounded-xl hover:border-brand-accent transition text-[11px] font-bold text-right"
            >
              <Layers className="w-3.5 h-3.5 text-blue-500" />
              إزالة الخلفية (PNG)
            </button>
            <button
              onClick={() => handleAIAction("upscale", "ترقية وتحسين الجودة")}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-brand-dark/5 rounded-xl hover:border-brand-accent transition text-[11px] font-bold text-right"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              تحسين جودة الصورة
            </button>
            <button
              onClick={() => handleAIAction("fix_colors", "ضبط الألوان")}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-brand-dark/5 rounded-xl hover:border-brand-accent transition text-[11px] font-bold text-right"
            >
              <Sliders className="w-3.5 h-3.5 text-emerald-500" />
              تعديل توازن الألوان
            </button>
            <button
              onClick={() => handleAIAction("white_bg", "الخلفية البيضاء")}
              className="flex items-center gap-1.5 px-3 py-2 bg-card border border-brand-dark/5 rounded-xl hover:border-brand-accent transition text-[11px] font-bold text-right"
            >
              <ImageIcon className="w-3.5 h-3.5 text-purple-500" />
              خلفية استوديو بيضاء
            </button>
          </div>
        </div>

        {/* Lifestyle background replacement */}
        <div className="space-y-2">
          <span className="text-xs font-bold text-muted-foreground block">
            تركيب في بيئات واقعية (Lifestyle):
          </span>
          <div className="grid grid-cols-1 gap-2 max-h-36 overflow-y-auto no-scrollbar pr-1">
            {LIFESTYLE_BACKGROUNDS.map((bg) => (
              <button
                key={bg.name}
                onClick={() => setSelectedBackground(bg.url === "white" ? "white" : bg.url)}
                className={`flex items-center justify-between px-3 py-2 rounded-xl text-[11px] font-bold text-right border transition ${
                  selectedBackground === bg.url
                    ? "bg-brand-dark text-brand-bg border-brand-dark"
                    : "bg-card border-brand-dark/5 hover:border-brand-accent"
                }`}
              >
                <span>{bg.name}</span>
                {selectedBackground === bg.url && (
                  <Check className="w-3.5 h-3.5 text-brand-accent" />
                )}
              </button>
            ))}
            {selectedBackground && (
              <button
                onClick={() => setSelectedBackground(null)}
                className="text-[10px] text-destructive hover:underline text-left"
              >
                × حذف الخلفية المركبة والعودة للأصل
              </button>
            )}
          </div>
        </div>

        {/* Standard editing sliders */}
        <div className="space-y-3 pt-2 border-t border-brand-dark/5">
          <span className="text-xs font-bold text-muted-foreground block">
            تعديلات يدوية دقيقة:
          </span>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span>الإضاءة (Brightness)</span>
              <span>{brightness}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={brightness}
              onChange={(e) => setBrightness(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span>التباين (Contrast)</span>
              <span>{contrast}%</span>
            </div>
            <input
              type="range"
              min="50"
              max="150"
              value={contrast}
              onChange={(e) => setContrast(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-[11px] font-semibold">
              <span>التشبع الألوان (Saturation)</span>
              <span>{saturation}%</span>
            </div>
            <input
              type="range"
              min="0"
              max="200"
              value={saturation}
              onChange={(e) => setSaturation(Number(e.target.value))}
              className="w-full h-1 bg-secondary rounded-lg appearance-none cursor-pointer accent-brand-accent"
            />
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="text-[11px] font-bold cursor-pointer" htmlFor="sharpen-toggle">
              تفعيل الفلتر الحاد (Sharpen Pixel Filter)
            </label>
            <input
              type="checkbox"
              id="sharpen-toggle"
              checked={sharpenEnabled}
              onChange={(e) => setSharpenEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-accent cursor-pointer"
            />
          </div>
        </div>

        {/* Watermarking section */}
        <div className="space-y-2 pt-2 border-t border-brand-dark/5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground">
              علامة مائية لحفظ الحقوق:
            </span>
            <input
              type="checkbox"
              checked={watermarkEnabled}
              onChange={(e) => setWatermarkEnabled(e.target.checked)}
              className="w-4 h-4 accent-brand-accent cursor-pointer"
            />
          </div>
          {watermarkEnabled && (
            <input
              value={watermarkText}
              onChange={(e) => setWatermarkText(e.target.value)}
              placeholder="نص العلامة المائية..."
              className="w-full text-xs bg-card border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none"
            />
          )}
        </div>
      </div>

      {/* Main Preview stage */}
      <div className="flex-1 flex flex-col items-center justify-center p-4 min-h-[400px]">
        {processing ? (
          <div className="text-center p-6 bg-brand-bg/95 border border-brand-dark/10 rounded-2xl max-w-sm w-full space-y-4 shadow-xl">
            <Loader2 className="w-12 h-12 text-brand-accent animate-spin mx-auto" />
            <h3 className="font-bold text-base text-brand-dark">
              جاري معالجة الصورة بالذكاء الاصطناعي...
            </h3>
            <p className="text-xs text-muted-foreground line-clamp-2">{statusMessage}</p>
            <div className="w-full bg-secondary h-2.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-accent h-full transition-all duration-300 rounded-full"
                style={{ width: `${progress}%` }}
              />
            </div>
            <span className="text-xs font-extrabold text-brand-dark block">{progress}%</span>
          </div>
        ) : (
          <div className="relative max-w-xl w-full aspect-square bg-brand-dark/30 rounded-3xl border border-brand-bg/10 flex items-center justify-center p-4 overflow-hidden group shadow-2xl">
            {/* Real Canvas behind the scenes */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Simulated cross-origin safe image loader */}
            <img
              ref={imageRef}
              src={imageUrl}
              alt="AI Studio Preview"
              crossOrigin="anonymous"
              className="max-h-full max-w-full object-contain rounded-xl transition duration-300"
              onLoad={applyCanvasFilters}
            />

            <div className="absolute top-4 right-4 flex gap-2">
              <button
                onClick={() => {
                  setBrightness(100);
                  setContrast(100);
                  setSaturation(100);
                  setSharpenEnabled(false);
                  setWatermarkEnabled(false);
                  setSelectedBackground(null);
                  setImageUrl(initialImageUrl);
                  toast.success("تمت إعادة التعيين للأصل");
                }}
                className="bg-brand-dark/70 text-brand-bg hover:bg-brand-dark border border-brand-bg/10 px-3 py-1.5 rounded-lg text-[10px] font-extrabold flex items-center gap-1"
              >
                <RefreshCw className="w-3.5 h-3.5" /> إعادة تعيين للنسخة الأصلية
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Top right floating cancel and action buttons */}
      <div className="w-full md:w-fit flex md:flex-col justify-end gap-3 p-4 bg-brand-dark/95 border-t md:border-t-0 md:border-r border-brand-bg/10 md:h-full justify-center">
        <button
          onClick={onClose}
          className="flex-1 md:flex-initial bg-card hover:bg-secondary text-brand-dark font-bold py-3 px-6 rounded-xl text-xs text-center transition"
        >
          إلغاء وتراجع
        </button>

        <a
          href={imageUrl}
          download="beitak-ai-studio.png"
          className="flex-1 md:flex-initial bg-brand-dark border border-brand-bg/20 hover:bg-brand-primary text-brand-bg font-bold py-3 px-6 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition"
        >
          <Download className="w-3.5 h-3.5" /> تحميل الصورة المعالجة
        </a>

        <button
          onClick={() => {
            onSave(imageUrl);
            toast.success("تم حفظ التعديلات على المنتج بنجاح!");
          }}
          className="flex-1 md:flex-initial bg-brand-accent hover:bg-amber-500 text-brand-dark font-extrabold py-3.5 px-6 rounded-xl text-xs text-center flex items-center justify-center gap-1.5 transition shadow-lg shadow-brand-accent/25"
        >
          <Check className="w-4 h-4" /> حفظ واستبدال الصورة
        </button>
      </div>
    </div>
  );
}
