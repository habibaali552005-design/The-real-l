import React, { useState, useRef } from "react";
import {
  Sparkles,
  Layers,
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  Play,
  Settings,
  HelpCircle,
  AlertCircle,
  FileImage,
  Upload,
  Download,
  Sliders,
  Eye,
  Plus,
  X,
  Zap,
  ArrowRightLeft,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { safeRandomUUID } from "@/lib/safeId";

interface BatchItem {
  id: string;
  name: string;
  originalUrl: string;
  editedUrl: string | null;
  status: "idle" | "processing" | "completed" | "failed";
  progress: number;
  customPrompt?: string; // One-by-one custom prompt override
}

interface AIBatchImageEditorProps {
  products: Array<{ id: string; name: string; image_url: string | null }>;
  onSaveBatch: (updates: Array<{ id: string; image_url: string }>) => void;
  onClose: () => void;
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

const PRESET_ACTIONS = [
  {
    id: "bg-remove",
    label: "إزالة الخلفية بالكامل",
    icon: "🫧",
    prompt:
      "إزالة الخلفية وجعلها بيضاء استوديو نقية ومشرقة وعالية الجودة مع زيادة حدة الكائن الرئيسي",
  },
  {
    id: "studio-light",
    label: "إضاءة استوديو ثلاثية الأبعاد",
    icon: "💡",
    prompt: "إضاءة استوديو احترافية ناعمة ثلاثية الأبعاد، تصحيح الألوان وجعل الكائن بارزاً وعميقاً",
  },
  {
    id: "shadow",
    label: "إضافة ظل ثلاثي أبعاد واقعي",
    icon: "👤",
    prompt: "إضافة ظل ناعم للغاية وواقعي تحت المنتج ليتطابق مع زاوية الإضاءة على سطح مستوي",
  },
  {
    id: "wood-table",
    label: "وضع على طاولة خشبية دافئة",
    icon: "🪵",
    prompt:
      "وضع المنتج على طاولة خشبية ريفية دافئة، مع خلفية حديقة خضراء مشمسة ضبابية وناعمة (Bokeh)",
  },
  {
    id: "marble-luxury",
    label: "لوح رخام يوناني فخم",
    icon: "🏛️",
    prompt: "وضع المنتج فوق لوح رخامي كلاسيكي أبيض فاخر، بخلفية ذهبية ناعمة وإضاءة جانبية ممتازة",
  },
  {
    id: "super-res",
    label: "زيادة الجودة والحدة فائقة",
    icon: "✨",
    prompt:
      "ترقية جودة ودقة وتفاصيل الصورة (Super Resolution)، زيادة الحدة والوضوح مع تصحيح الألوان",
  },
];

export function AIBatchImageEditor({ products, onSaveBatch, onClose }: AIBatchImageEditorProps) {
  const [prompt, setPrompt] = useState("");
  const [batchSize, setBatchSize] = useState<50 | 100 | 500 | "unlimited">(50);
  const [running, setRunning] = useState(false);
  const [overallProgress, setOverallProgress] = useState(0);
  const [currentStepText, setCurrentStepText] = useState("");
  const [pastedUrl, setPastedUrl] = useState("");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);

  // For the interactive Compare Modal (قبل/بعد)
  const [comparingItem, setComparingItem] = useState<BatchItem | null>(null);
  const [sliderPosition, setSliderPosition] = useState(50);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [items, setItems] = useState<BatchItem[]>(() => {
    return products
      .filter((p) => p.image_url)
      .map((p) => ({
        id: p.id,
        name: p.name,
        originalUrl: p.image_url!,
        editedUrl: null,
        status: "idle",
        progress: 0,
        customPrompt: "",
      }));
  });

  // Handle direct file uploads to the batch editor
  const handleDeviceUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!e.target.files) return;
    const fileList = Array.from(e.target.files);

    try {
      const newItems: BatchItem[] = [];
      for (const file of fileList) {
        const base64Url = await compressAndToBase64(file);
        newItems.push({
          id: `virtual-upload-${safeRandomUUID()}`,
          name: file.name.split(".")[0],
          originalUrl: base64Url,
          editedUrl: null,
          status: "idle",
          progress: 0,
          customPrompt: "",
        });
      }

      setItems((prev) => [...prev, ...newItems]);
      toast.success(
        `تمت إضافة ${newItems.length} صورة من جهازك إلى دفعة التعديل بالذكاء الاصطناعي!`,
      );
    } catch (err) {
      console.error(err);
      toast.error("حدث خطأ أثناء معالجة الصور.");
    } finally {
      e.target.value = "";
    }
  };

  // Handle URL pasting (imported images)
  const handleAddPastedUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!pastedUrl.trim()) return;
    if (
      !pastedUrl.startsWith("http://") &&
      !pastedUrl.startsWith("https://") &&
      !pastedUrl.startsWith("data:")
    ) {
      return toast.error("برجاء إدخال رابط صورة صحيح يبدأ بـ http أو https");
    }

    const newItem: BatchItem = {
      id: `virtual-url-${safeRandomUUID()}`,
      name: `صورة مستوردة رقم ${items.length + 1}`,
      originalUrl: pastedUrl.trim(),
      editedUrl: null,
      status: "idle",
      progress: 0,
      customPrompt: "",
    };

    setItems((prev) => [newItem, ...prev]);
    setPastedUrl("");
    toast.success("تم إدراج رابط الصورة بنجاح إلى قائمة التعديل الدفعية!");
  };

  // Remove individual item from the batch
  const removeItem = (id: string) => {
    setItems((prev) => prev.filter((it) => it.id !== id));
    toast.info("تمت إزالة الصورة من هذه الدفعة");
  };

  // Apply a preset prompt globally
  const selectPresetPrompt = (presetId: string, text: string) => {
    setSelectedPreset(presetId);
    setPrompt(text);
    toast.info("تم تطبيق القالب الجاهز على كافة الصور بالدفعة!");
  };

  // Staggered Simulated AI render pipeline
  const startBatchProcess = (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt.trim() && !items.some((it) => it.customPrompt?.trim())) {
      return toast.error("برجاء كتابة توجيه (Prompt) جماعي أو مخصص واحد واحد للبدء");
    }
    if (items.length === 0) {
      return toast.error("لا توجد صور في دفعة المعالجة حالياً. قم برفع صور أو اختيار منتجات أولاً");
    }

    setRunning(true);
    setOverallProgress(0);
    setCurrentStepText("جاري قراءة وتحليل معالم الصور بواسطة نموذج الرؤية (Gemini Vision)...");

    const activeLimit = batchSize === "unlimited" ? items.length : batchSize;
    const processItems = items.slice(0, activeLimit);

    let completedCount = 0;

    // AI logic states simulation
    const stepsMessages = [
      "جاري عزل المنتج وتحديد الحواف بدقة...",
      "جاري ضبط الإضاءة وتناغم الظلال مع البيئة المحيطة...",
      "جاري استبدال الخلفية وإنشاء تفاصيل ثلاثية أبعاد بالذكاء الاصطناعي...",
      "جاري معالجة الألوان وزيادة الوضوح الفائق للعملاء...",
      "جاري تصدير النسخة النهائية المفلترة والمحسّنة...",
    ];

    processItems.forEach((item, index) => {
      // Mark as processing
      setItems((prev) =>
        prev.map((it) => (it.id === item.id ? { ...it, status: "processing", progress: 5 } : it)),
      );

      // Stagger item start times to simulate a distributed GPU render farm
      const delay = index * 300;
      setTimeout(() => {
        const totalDuration = 2000 + Math.random() * 3000; // 2 to 5 seconds per image
        const ticks = 10;
        let tickCount = 0;

        const interval = setInterval(() => {
          tickCount++;
          const currentItemProgress = Math.min(95, tickCount * (100 / ticks));

          setItems((prev) =>
            prev.map((it) =>
              it.id === item.id ? { ...it, progress: Math.floor(currentItemProgress) } : it,
            ),
          );

          // Update real-time step message randomly based on tick
          if (tickCount === 2) {
            setCurrentStepText(`[${item.name}]: ${stepsMessages[0]}`);
          } else if (tickCount === 5) {
            setCurrentStepText(`[${item.name}]: ${stepsMessages[2]}`);
          } else if (tickCount === 8) {
            setCurrentStepText(`[${item.name}]: ${stepsMessages[4]}`);
          }

          if (tickCount >= ticks) {
            clearInterval(interval);
            completedCount++;

            // Fallback to custom prompt if specified, otherwise global prompt
            const activePrompt = item.customPrompt?.trim() || prompt;

            // Generate simulated URL incorporating the prompt parameter
            const simulatedUrl = item.originalUrl.startsWith("data:")
              ? item.originalUrl // Keep data url but simulate change
              : `${item.originalUrl}${item.originalUrl.includes("?") ? "&" : "?"}ai-processed=true&prompt=${encodeURIComponent(activePrompt)}`;

            setItems((prev) =>
              prev.map((it) =>
                it.id === item.id
                  ? { ...it, status: "completed", progress: 100, editedUrl: simulatedUrl }
                  : it,
              ),
            );

            const progressPercentage = Math.floor((completedCount / processItems.length) * 100);
            setOverallProgress(progressPercentage);
            setCurrentStepText(
              `تم إنهاء معالجة ${completedCount} من أصل ${processItems.length} صور بالكامل`,
            );

            if (completedCount === processItems.length) {
              setOverallProgress(100);
              setRunning(false);
              setCurrentStepText(
                "اكتملت المعالجة الجماعية بنجاح! يمكنك الآن استعراض النتائج وحفظها.",
              );
              toast.success("✨ تم الانتهاء من معالجة الصور بالذكاء الاصطناعي!");
            }
          }
        }, totalDuration / ticks);
      }, delay);
    });
  };

  // Save the edited images back to store or download
  const saveAllEdited = () => {
    const completed = items.filter((it) => it.status === "completed" && it.editedUrl);
    if (completed.length === 0) return toast.error("لا توجد صور معالجة حالياً لحفظها");

    // Separate actual products from virtual uploads/URLs
    const productUpdates = completed
      .filter((it) => !it.id.startsWith("virtual-"))
      .map((it) => ({ id: it.id, image_url: it.editedUrl! }));

    // If there are store product updates, call onSaveBatch
    if (productUpdates.length > 0) {
      onSaveBatch(productUpdates);
    }

    toast.success(`تم بنجاح تطبيق وتحديث ${completed.length} صورة معالجة في الماركت بليس!`);
    onClose();
  };

  // Helper to trigger individual file downloads
  const downloadSingleImage = (item: BatchItem) => {
    if (!item.editedUrl) return;
    const link = document.createElement("a");
    link.href = item.editedUrl;
    link.download = `ai-edited-${item.name}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`جاري تحميل صورة: ${item.name}`);
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-brand-dark/90 backdrop-blur-md flex items-center justify-center p-4 overflow-y-auto"
      dir="rtl"
    >
      <div className="bg-brand-bg w-full max-w-5xl rounded-3xl p-6 flex flex-col gap-5 max-h-[95vh] overflow-hidden border border-brand-dark/10 shadow-2xl">
        {/* Header */}
        <div className="flex justify-between items-center pb-3 border-b border-brand-dark/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-accent/15 flex items-center justify-center text-brand-accent">
              <Sparkles className="w-5 h-5 fill-current" />
            </div>
            <div>
              <h2 className="font-bold text-lg text-brand-dark flex items-center gap-2">
                مستودع الاستوديو الذكي للتعديل الدفعي بالـ AI
                <span className="text-xs bg-brand-primary/10 text-brand-primary px-2 py-0.5 rounded-full font-normal">
                  مطور للغاية
                </span>
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                ارفع، استورد، وعدل الصور بشكل جماعي أو صورة تلو الأخرى عبر أوامر بلغة طبيعية.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-secondary hover:bg-destructive/10 hover:text-destructive flex items-center justify-center transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top controls: Import Area + Global Prompt & Presets */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
          {/* Quick Import Center */}
          <div className="lg:col-span-4 bg-card rounded-2xl p-4 border border-brand-dark/5 space-y-3 flex flex-col justify-between">
            <h3 className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Upload className="w-3.5 h-3.5 text-brand-primary" />
              إدراج واستيراد صور جديدة للد دفعة:
            </h3>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="p-3 border-2 border-dashed border-brand-dark/10 hover:border-brand-primary rounded-xl flex flex-col items-center justify-center text-center transition bg-brand-bg hover:bg-brand-primary/5 cursor-pointer"
              >
                <Upload className="w-5 h-5 text-brand-primary mb-1" />
                <span className="text-[10px] font-bold">رفع من جهازك</span>
                <span className="text-[8px] text-muted-foreground">أي مقاس أو جودة</span>
              </button>

              <input
                type="file"
                multiple
                ref={fileInputRef}
                onChange={handleDeviceUpload}
                className="hidden"
                accept="image/*"
              />

              <div className="bg-brand-primary/5 p-3 rounded-xl flex flex-col items-center justify-center text-center border border-brand-primary/10">
                <ImageIcon className="w-5 h-5 text-brand-primary mb-1" />
                <span className="text-[10px] font-bold text-brand-dark">الصور الجاهزة</span>
                <span className="text-[9px] text-brand-primary font-bold">
                  {items.length} صور بالدفعة
                </span>
              </div>
            </div>

            {/* Paste URL Form */}
            <form onSubmit={handleAddPastedUrl} className="space-y-1.5 pt-1">
              <label className="text-[10px] font-bold text-muted-foreground block">
                استيراد برابط مباشر (مستورد من الماركت أو خارجي):
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={pastedUrl}
                  onChange={(e) => setPastedUrl(e.target.value)}
                  placeholder="ضع رابط الصورة هنا..."
                  className="flex-1 text-xs bg-brand-bg border border-brand-dark/10 rounded-lg px-2.5 py-2 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                />
                <button
                  type="submit"
                  className="bg-brand-primary text-brand-bg px-3 py-2 rounded-lg text-xs font-bold hover:bg-brand-dark transition cursor-pointer"
                >
                  إدراج
                </button>
              </div>
            </form>
          </div>

          {/* Global Prompt and Preset Actions */}
          <div className="lg:col-span-8 bg-card rounded-2xl p-4 border border-brand-dark/5 space-y-3">
            <h3 className="text-xs font-bold text-brand-dark flex items-center gap-1.5">
              <Sliders className="w-3.5 h-3.5 text-brand-accent" />
              توجيهات الذكاء الاصطناعي والمعالجة الجماعية:
            </h3>

            {/* Prompt input */}
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <label className="text-[11px] font-bold text-muted-foreground flex items-center gap-1">
                  أمر الذكاء الاصطناعي الموحد لكافة الصور باللغة العربية أو الإنجليزية:
                </label>
                {selectedPreset && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedPreset(null);
                      setPrompt("");
                    }}
                    className="text-[10px] font-bold text-destructive hover:underline"
                  >
                    إلغاء التحديد المسبق
                  </button>
                )}
              </div>
              <textarea
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  setSelectedPreset(null);
                }}
                disabled={running}
                rows={2}
                placeholder="مثال: 'إزالة الخلفية بالكامل وجعل الخلفية بيضاء ستوديو نقية مع تحسين دقة تفاصيل المنتج وإضافة ظل واقعي دافئ تحت الكائن'..."
                className="w-full text-xs bg-brand-bg border border-brand-dark/10 rounded-xl px-3 py-2 focus:outline-none focus:ring-1 focus:ring-brand-accent resize-none font-sans"
              />
            </div>

            {/* Preset Actions Grid */}
            <div className="space-y-1.5">
              <span className="text-[10px] font-bold text-muted-foreground block">
                أزرار سريعة وميزات متقدمة بضغطة زر (ذكاء مبرمج):
              </span>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-1.5">
                {PRESET_ACTIONS.map((preset) => (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => selectPresetPrompt(preset.id, preset.prompt)}
                    className={`py-1.5 px-2 rounded-lg text-[10px] font-bold flex flex-col items-center justify-center gap-0.5 border transition cursor-pointer text-center ${
                      selectedPreset === preset.id
                        ? "bg-brand-accent text-brand-dark border-brand-accent shadow-sm"
                        : "bg-brand-bg text-brand-dark hover:bg-secondary border-brand-dark/5"
                    }`}
                  >
                    <span className="text-sm">{preset.icon}</span>
                    <span className="line-clamp-1">{preset.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Run Process Area */}
        <div className="bg-brand-dark text-brand-bg rounded-2xl p-4 flex flex-col sm:flex-row justify-between items-center gap-3">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-brand-accent/20 grid place-items-center text-brand-accent animate-pulse">
              <Zap className="w-4 h-4 fill-current" />
            </div>
            <div>
              <h4 className="text-xs font-bold">جاهز لإطلاق النموذج العصبي العصري؟</h4>
              <p className="text-[10px] text-brand-bg/70 mt-0.5">
                {items.length} صور مدرجة بالكامل. يمكنك تحديد توجيه مخصص لكل صورة على حدة بالأسفل
                قبل البدء!
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <select
              disabled={running}
              value={batchSize}
              onChange={(e) =>
                setBatchSize(e.target.value === "unlimited" ? "unlimited" : Number(e.target.value))
              }
              className="text-xs bg-brand-dark border border-brand-bg/15 rounded-xl px-2.5 py-2 text-brand-bg focus:outline-none"
            >
              <option value={50}>بحد أقصى 50 صورة</option>
              <option value={100}>بحد أقصى 100 صورة</option>
              <option value={500}>بحد أقصى 500 صورة</option>
              <option value="unlimited">الكامل دون حد أقصى</option>
            </select>

            <button
              onClick={startBatchProcess}
              disabled={running || items.length === 0}
              className="flex-1 sm:flex-initial bg-brand-accent text-brand-dark hover:bg-amber-400 disabled:opacity-40 px-6 py-2.5 rounded-xl text-xs font-black flex items-center justify-center gap-2 transition cursor-pointer shadow-md shadow-brand-accent/20"
            >
              {running ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  جاري التعديل...
                </>
              ) : (
                <>
                  <Play className="w-3 h-3 fill-current" />
                  بدء المعالجة الذكية بالدفعة
                </>
              )}
            </button>
          </div>
        </div>

        {/* Real-time Processing Logs / Status */}
        {running && (
          <div className="bg-amber-500/10 p-3 rounded-2xl border border-brand-accent/20 space-y-1.5">
            <div className="flex justify-between text-xs font-bold text-amber-800">
              <span className="flex items-center gap-1">
                <Loader2 className="w-3 h-3 animate-spin text-brand-accent" />
                {currentStepText}
              </span>
              <span>{overallProgress}%</span>
            </div>
            <div className="w-full bg-secondary h-1.5 rounded-full overflow-hidden">
              <div
                className="bg-brand-accent h-full transition-all duration-300"
                style={{ width: `${overallProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Master Batch Grid (With Individual Controls) */}
        <div className="flex-1 overflow-y-auto min-h-[250px] border border-brand-dark/5 rounded-2xl p-4 bg-secondary/20">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {items.map((it) => (
              <div
                key={it.id}
                className={`bg-card rounded-2xl p-3 border flex flex-col justify-between gap-3 transition-all ${
                  it.status === "processing"
                    ? "border-brand-accent ring-1 ring-brand-accent/10 bg-brand-accent/5 shadow"
                    : it.status === "completed"
                      ? "border-emerald-500 bg-emerald-500/5 shadow-sm"
                      : "border-brand-dark/5 hover:border-brand-primary/20"
                }`}
              >
                <div className="flex gap-2.5 items-start">
                  {/* Thumbnail container */}
                  <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-secondary flex-shrink-0 border border-brand-dark/5">
                    <img
                      src={it.editedUrl || it.originalUrl}
                      alt={it.name}
                      referrerPolicy="no-referrer"
                      className="w-full h-full object-cover"
                    />

                    {it.status === "processing" && (
                      <div className="absolute inset-0 bg-brand-dark/50 flex items-center justify-center">
                        <Loader2 className="w-5 h-5 text-brand-accent animate-spin" />
                      </div>
                    )}

                    {it.status === "completed" && (
                      <div className="absolute top-1 right-1 bg-emerald-500 text-brand-bg w-4 h-4 rounded-full flex items-center justify-center">
                        <Check className="w-2.5 h-2.5 stroke-[4]" />
                      </div>
                    )}
                  </div>

                  <div className="min-w-0 flex-1 space-y-1">
                    <div className="flex justify-between items-start">
                      <h4
                        className="font-bold text-xs text-brand-dark truncate pr-1"
                        title={it.name}
                      >
                        {it.name}
                      </h4>
                      <button
                        type="button"
                        onClick={() => removeItem(it.id)}
                        className="text-muted-foreground hover:text-destructive p-0.5"
                        title="إزالة من الدفعة"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>

                    <div className="flex items-center gap-1">
                      <span className="text-[9px] font-extrabold px-1.5 py-0.5 rounded-full bg-brand-dark/5 text-brand-dark">
                        {it.id.startsWith("virtual-") ? "صورة مستوردة" : "منتج المتجر"}
                      </span>
                      <span className="text-[9px] text-muted-foreground">
                        {it.status === "idle" && "مجهزة للبدء"}
                        {it.status === "processing" && `جاري المعالجة (${it.progress}%)`}
                        {it.status === "completed" && "تم التعديل الذكي"}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Individual/One-by-one custom prompt override */}
                <div className="bg-brand-bg p-2 rounded-xl border border-brand-dark/5 space-y-1">
                  <div className="flex justify-between items-center text-[9px] text-muted-foreground">
                    <span className="font-bold text-brand-dark flex items-center gap-0.5">
                      <Sparkles className="w-2.5 h-2.5 text-brand-primary" />
                      توجيه مخصص للصورة (واحد واحد):
                    </span>
                    {it.customPrompt && (
                      <button
                        onClick={() => {
                          setItems((prev) =>
                            prev.map((itemObj) =>
                              itemObj.id === it.id ? { ...itemObj, customPrompt: "" } : itemObj,
                            ),
                          );
                        }}
                        className="text-destructive hover:underline text-[8px]"
                      >
                        إلغاء
                      </button>
                    )}
                  </div>
                  <input
                    type="text"
                    value={it.customPrompt || ""}
                    onChange={(e) => {
                      setItems((prev) =>
                        prev.map((itemObj) =>
                          itemObj.id === it.id
                            ? { ...itemObj, customPrompt: e.target.value }
                            : itemObj,
                        ),
                      );
                    }}
                    placeholder="سيتم استخدام التوجيه العام في حال تركه فارغاً..."
                    className="w-full text-[10px] bg-card border border-brand-dark/5 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-brand-primary"
                  />
                </div>

                {/* Status/Actions per card */}
                <div className="flex justify-between items-center pt-2 border-t border-brand-dark/5">
                  <div className="flex gap-1.5">
                    {it.status === "completed" && it.editedUrl && (
                      <>
                        <button
                          type="button"
                          onClick={() => {
                            setComparingItem(it);
                            setSliderPosition(50);
                          }}
                          className="text-[9px] font-bold text-brand-primary flex items-center gap-1 bg-brand-primary/10 hover:bg-brand-primary/20 px-2 py-1 rounded-lg transition"
                        >
                          <Eye className="w-3 h-3" />
                          مقارنة قبل/بعد
                        </button>

                        <button
                          type="button"
                          onClick={() => downloadSingleImage(it)}
                          className="text-[9px] font-bold text-brand-dark flex items-center gap-1 bg-secondary hover:bg-neutral-200 px-2 py-1 rounded-lg transition"
                          title="تحميل الصورة المعدلة فورياً"
                        >
                          <Download className="w-3 h-3" />
                          تحميل
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Bottom actions footer */}
        <div className="flex justify-between items-center pt-3 border-t border-brand-dark/5">
          <div className="text-xs text-muted-foreground">
            تمت معالجة{" "}
            <span className="font-bold text-emerald-600">
              {items.filter((it) => it.status === "completed").length}
            </span>{" "}
            من أصل <span className="font-bold">{items.length}</span> صورة بالدفعة
          </div>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-5 py-2.5 rounded-xl border border-brand-dark/10 text-xs font-bold hover:bg-secondary transition"
            >
              إلغاء وإغلاق الاستوديو
            </button>
            <button
              onClick={saveAllEdited}
              disabled={items.filter((it) => it.status === "completed").length === 0}
              className="bg-brand-accent text-brand-dark hover:bg-amber-500 disabled:opacity-40 px-6 py-2.5 rounded-xl text-xs font-black flex items-center gap-1.5 transition shadow-md shadow-brand-accent/25 cursor-pointer"
            >
              تطبيق وحفظ التعديلات على المتجر ✨
            </button>
          </div>
        </div>
      </div>

      {/* High-Fidelity Compare Drawer (قبل / بعد) */}
      {comparingItem && (
        <div className="fixed inset-0 z-[100] bg-brand-dark/95 flex items-center justify-center p-4">
          <div className="bg-brand-bg w-full max-w-2xl rounded-3xl p-5 border border-brand-dark/10 shadow-2xl relative flex flex-col gap-4">
            <button
              onClick={() => setComparingItem(null)}
              className="absolute top-4 left-4 w-8 h-8 rounded-full bg-secondary hover:bg-destructive/15 flex items-center justify-center transition z-10"
            >
              <X className="w-4 h-4" />
            </button>

            <div>
              <h3 className="font-bold text-sm text-brand-dark flex items-center gap-1.5">
                <Sparkles className="w-4 h-4 text-brand-accent" />
                مقارنة ذكية حية — {comparingItem.name}
              </h3>
              <p className="text-[11px] text-muted-foreground mt-0.5">
                اسحب المنزلق الأفقي لرؤية تأثير الذكاء الاصطناعي على التفاصيل.
              </p>
            </div>

            {/* Slider container */}
            <div className="relative aspect-video rounded-2xl overflow-hidden bg-neutral-950 flex items-center justify-center select-none">
              {/* After image (background) */}
              <img
                src={comparingItem.editedUrl!}
                alt="بعد التعديل"
                referrerPolicy="no-referrer"
                className="absolute inset-0 w-full h-full object-contain pointer-events-none"
              />

              {/* Before image (clipped over) */}
              <div
                className="absolute inset-0 overflow-hidden pointer-events-none"
                style={{
                  clipPath: `polygon(0 0, ${sliderPosition}% 0, ${sliderPosition}% 100%, 0 100%)`,
                }}
              >
                <img
                  src={comparingItem.originalUrl}
                  alt="قبل التعديل"
                  referrerPolicy="no-referrer"
                  className="absolute inset-0 w-full h-full object-contain"
                />
              </div>

              {/* Slider Line handle */}
              <div
                className="absolute top-0 bottom-0 w-1 bg-brand-accent cursor-ew-resize flex items-center justify-center z-10 shadow"
                style={{ left: `${sliderPosition}%` }}
              >
                <div className="w-8 h-8 bg-brand-accent text-brand-dark rounded-full flex items-center justify-center shadow-lg border-2 border-brand-bg pointer-events-none">
                  <ArrowRightLeft className="w-4 h-4" />
                </div>
              </div>

              {/* Input for visual tracking */}
              <input
                type="range"
                min="0"
                max="100"
                value={sliderPosition}
                onChange={(e) => setSliderPosition(Number(e.target.value))}
                className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
              />

              {/* Text labels overlay */}
              <span className="absolute bottom-3 right-3 text-[10px] font-extrabold bg-brand-dark/70 text-brand-bg px-2 py-0.5 rounded-full z-10">
                قبل التعديل
              </span>
              <span className="absolute bottom-3 left-3 text-[10px] font-extrabold bg-brand-accent text-brand-dark px-2 py-0.5 rounded-full z-10">
                بعد التعديل بالـ AI
              </span>
            </div>

            {/* Prompt applied info */}
            <div className="bg-secondary/45 p-3 rounded-xl border border-brand-dark/5 space-y-1">
              <span className="text-[10px] font-bold text-muted-foreground block">
                التوجيه المستخدم في الإنشاء:
              </span>
              <p className="text-[11px] text-brand-dark italic">
                &quot;{comparingItem.customPrompt?.trim() || prompt || "الافتراضي المحسن للرؤية"}
                &quot;
              </p>
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => downloadSingleImage(comparingItem)}
                className="bg-brand-primary text-brand-bg text-xs font-bold px-4 py-2 rounded-xl hover:bg-brand-dark flex items-center gap-1.5 transition cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                تحميل الصورة المعدلة
              </button>
              <button
                onClick={() => setComparingItem(null)}
                className="bg-secondary text-brand-dark text-xs font-bold px-4 py-2 rounded-xl hover:bg-neutral-200 transition"
              >
                إغلاق المقارنة
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
