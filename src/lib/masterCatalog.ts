import {
  CategoryTemplate,
  SpecFieldDefinition,
  CategoryFilterDefinition,
  AllowedOptionType,
} from "@/types";

// ==========================================
// 1. MASTER PREDEFINED VALUES (القيم الجاهزة)
// ==========================================

export const MASTER_COLORS = [
  "أسود",
  "أبيض عاجي",
  "رمادي مودرن",
  "أزرق ملكي",
  "أحمر داكن",
  "بني فاخر",
  "كحلي",
  "بيج خشبي",
  "ذهبي براق",
  "فضي ستانلس",
  "أخضر زيتوني",
  "وردي هادئ",
  "بنفسجي",
  "شفاف / زجاجي",
] as const;

export const MASTER_SIZES_CLOTHING = [
  "XS",
  "S",
  "M",
  "L",
  "XL",
  "2XL",
  "3XL",
  "4XL",
  "مقاس موحد (Free Size)",
] as const;

export const MASTER_SIZES_SHOES = [
  "36",
  "37",
  "38",
  "39",
  "40",
  "41",
  "42",
  "43",
  "44",
  "45",
  "46",
] as const;

export const MASTER_SIZES_TV = [
  "32 بوصة",
  "43 بوصة",
  "50 بوصة",
  "55 بوصة",
  "65 بوصة",
  "75 بوصة",
  "85 بوصة",
] as const;

export const MASTER_MATERIALS = [
  "خشب زان طبيعي",
  "خشب أروا فاخر",
  "جلد طبيعي 100%",
  "جلد صناعي فاخر",
  "قطن مصري 100%",
  "حرير طبيعي",
  "كتان نقي",
  "صوف ناعم",
  "ستانلس ستيل 304",
  "ألومنيوم مقوى",
  "بلاستيك آمن BPA-Free",
  "زجاج حراري المقاوم للصدمات",
  "رخام طبيعي",
  "قماش قطيفة فاخر",
] as const;

export const MASTER_FUEL_TYPES = [
  "بنزين 92/95",
  "غاز طبيعي",
  "كهرباء كاملة (EV)",
  "هجين (Hybrid)",
  "ديزل / سولار",
] as const;

export const MASTER_FINISH_TYPES = [
  "سوبر لوكس",
  "ألترا سوبر لوكس",
  "ديلوكس فاخر",
  "نصف تشطيب",
  "بدون تشطيب / عظم",
] as const;

export const MASTER_TRANSMISSION_TYPES = [
  "أوتوماتيك",
  "مانيوال / يدوي",
  "ستيبترونيك (Steptronic)",
  "سي في تي (CVT)",
] as const;

export const MASTER_COOLING_TYPES = [
  "نوفروست (No Frost)",
  "ديفروست (Defrost)",
  "إنفرتر موفر للكهرباء",
  "تبريد ثنائي مائل",
] as const;

export const MASTER_MEASUREMENT_UNITS = [
  "لتر",
  "كجم",
  "جرام",
  "م² (متر مربع)",
  "سم",
  "بوصة",
  "حصان",
  "سي سي (CC)",
  "كم",
  "جيجابايت (GB)",
  "تيرابايت (TB)",
  "وات",
  "مل",
] as const;

// ==========================================
// 2. BASE MASTER TEMPLATES (القوالب الأساسية للوراثة)
// ==========================================

export const MASTER_CATEGORY_TEMPLATES: Record<string, CategoryTemplate> = {
  // -------------------------------------------------------------
  // A. APPLIANCES & ELECTRONICS BASE TEMPLATE
  // -------------------------------------------------------------
  tpl_appliances_base: {
    id: "tpl_appliances_base",
    mainCategory: "الإلكترونيات والأجهزة الكهربائية",
    description: "القالب الأساسي الموحد لجميع الأجهزة الكهربائية والمنزلية",
    iconName: "Zap",
    requiredFields: ["name", "price", "main_category", "sub_category", "brand"],
    optionalFields: ["warranty_years", "origin_country", "energy_efficiency", "model_number"],
    specDefinitions: [
      {
        id: "brand",
        name: "العلامة التجارية",
        type: "select",
        options: [
          "Samsung",
          "LG",
          "Tornado",
          "Sharp",
          "Fresh",
          "Carrier",
          "Beko",
          "Bosch",
          "Zanussi",
          "Toshiba",
          "Unionaire",
          "أخرى",
        ],
        required: true,
      },
      {
        id: "warranty_years",
        name: "مدة الضمان",
        type: "select",
        options: [
          "بدون ضمان",
          "سنة واحدة",
          "سنتان",
          "3 سنوات",
          "5 سنوات",
          "10 سنوات (ضمان الموتور)",
        ],
        unit: "سنة",
      },
      {
        id: "origin_country",
        name: "بلد المنشأ",
        type: "select",
        options: [
          "مصر",
          "تركيا",
          "ألمانيا",
          "كوريا الجنوبية",
          "الصين",
          "إيطاليا",
          "اليابان",
          "تايلاند",
        ],
      },
      {
        id: "energy_efficiency",
        name: "كفاءة الطاقة",
        type: "select",
        options: ["Class A+++", "Class A++", "Class A+", "Class A", "Class B", "Class C"],
      },
      {
        id: "model_number",
        name: "رقم الموديل",
        type: "text",
      },
    ],
    allowedOptionTypes: [
      {
        type: "color",
        label: "اللون",
        defaultValues: ["فضي ستانلس", "أسود", "أبيض عاجي", "رمادي مودرن"],
      },
      {
        type: "finish",
        label: "التشطيب والتغليف",
        defaultValues: ["كرتونة جديدة مقفولة", "فرز تاني خفيف", "بدون كرتونة"],
      },
    ],
    searchFilters: [
      {
        id: "brand",
        label: "العلامة التجارية",
        type: "multiselect",
        options: ["Samsung", "LG", "Tornado", "Sharp", "Fresh", "Carrier", "Beko", "Bosch"],
      },
      {
        id: "energy_efficiency",
        label: "كفاءة الطاقة",
        type: "select",
        options: ["Class A+++", "Class A++", "Class A+", "Class A"],
      },
      {
        id: "warranty_years",
        label: "الضمان",
        type: "select",
        options: ["سنة واحدة", "سنتان", "3 سنوات", "5 سنوات", "10 سنوات"],
      },
    ],
    predefinedBrands: [
      "Samsung",
      "LG",
      "Tornado",
      "Sharp",
      "Fresh",
      "Carrier",
      "Beko",
      "Bosch",
      "Toshiba",
    ],
  },

  // A1. SUBCATEGORY: REFRIGERATORS (ثلاجات وديب فريزر)
  tpl_refrigerators: {
    id: "tpl_refrigerators",
    mainCategory: "الإلكترونيات والأجهزة الكهربائية",
    subCategory: "ثلاجات وديب فريزر",
    parentTemplateId: "tpl_appliances_base",
    description: "قالب خاص بالثلاجات والتجميد",
    iconName: "Refrigerator",
    requiredFields: ["name", "price", "main_category", "sub_category", "brand", "capacity_liters"],
    optionalFields: [
      "warranty_years",
      "origin_country",
      "energy_efficiency",
      "model_number",
      "cooling_type",
      "doors_count",
    ],
    specDefinitions: [
      {
        id: "capacity_liters",
        name: "السعة باللتر",
        type: "number",
        unit: "لتر",
        required: true,
        description: "السعة الإجمالية باللتر",
      },
      {
        id: "doors_count",
        name: "عدد الأبواب",
        type: "select",
        options: ["باب واحد", "بابين (2 أبواب)", "3 أبواب", "4 أبواب (Side by Side)"],
      },
      {
        id: "cooling_type",
        name: "تقنية التبريد",
        type: "select",
        options: ["نوفروست (بخار مانع للثلج)", "ديفروست (عادي)", "إنفرتر موفر للطاقة"],
      },
      {
        id: "has_dispenser",
        name: "وجود صانع ثلج / موزع مياه",
        type: "boolean",
      },
    ],
    allowedOptionTypes: [
      { type: "color", label: "اللون", defaultValues: ["فضي ستانلس", "أسود ديب", "أبيض عاجي"] },
      {
        type: "volume",
        label: "السعة بالقدم/اللتر",
        defaultValues: [
          "14 قدم (340 لتر)",
          "16 قدم (380 لتر)",
          "18 قدم (450 لتر)",
          "22 قدم (520 لتر)",
        ],
      },
    ],
    searchFilters: [
      { id: "capacity_liters", label: "السعة (لتر)", type: "range", unit: "لتر" },
      {
        id: "doors_count",
        label: "عدد الأبواب",
        type: "select",
        options: ["باب واحد", "بابين (2 أبواب)", "3 أبواب", "4 أبواب (Side by Side)"],
      },
      {
        id: "cooling_type",
        label: "تقنية التبريد",
        type: "select",
        options: ["نوفروست (بخار مانع للثلج)", "ديفروست (عادي)"],
      },
    ],
  },

  // A2. SUBCATEGORY: WASHING MACHINES (غسالات ومجففات)
  tpl_washers: {
    id: "tpl_washers",
    mainCategory: "الإلكترونيات والأجهزة الكهربائية",
    subCategory: "غسالات ومجففات",
    parentTemplateId: "tpl_appliances_base",
    description: "قالب خاص بالغسالات والمجففات",
    iconName: "Disc",
    requiredFields: [
      "name",
      "price",
      "main_category",
      "sub_category",
      "brand",
      "load_type",
      "capacity_kg",
    ],
    optionalFields: ["spin_speed", "programs_count", "motor_type"],
    specDefinitions: [
      {
        id: "load_type",
        name: "نوع التحميل",
        type: "select",
        options: ["تحميل أمامي (أوتوماتيك)", "تحميل علوي (فوق أوتوماتيك)", "هاف أوتوماتيك (حوضين)"],
        required: true,
      },
      {
        id: "capacity_kg",
        name: "سعة الغسيل بالكيلوجرام",
        type: "number",
        unit: "كجم",
        required: true,
      },
      {
        id: "spin_speed",
        name: "سرعة العصر (لفة/دقيقة)",
        type: "select",
        options: ["800 لفة/دقيقة", "1000 لفة/دقيقة", "1200 لفة/دقيقة", "1400 لفة/دقيقة"],
        unit: "لفة/دقيقة",
      },
      {
        id: "motor_type",
        name: "نوع المحرك",
        type: "select",
        options: ["Inverter Direct Drive (دفع مباشر)", "محرك سير تقليص اهتزاز"],
      },
    ],
    allowedOptionTypes: [
      { type: "color", label: "اللون", defaultValues: ["فضي ستانلس", "أبيض", "رمادي داكن"] },
      {
        type: "volume",
        label: "الحمولة (كجم)",
        defaultValues: ["7 كجم", "8 كجم", "9 كجم", "10.5 كجم", "12 كجم"],
      },
    ],
    searchFilters: [
      {
        id: "load_type",
        label: "نوع التحميل",
        type: "select",
        options: ["تحميل أمامي (أوتوماتيك)", "تحميل علوي (فوق أوتوماتيك)", "هاف أوتوماتيك"],
      },
      { id: "capacity_kg", label: "السعة (كجم)", type: "range", unit: "كجم" },
      {
        id: "spin_speed",
        label: "سرعة العصر",
        type: "select",
        options: ["1000 لفة/دقيقة", "1200 لفة/دقيقة", "1400 لفة/دقيقة"],
      },
    ],
  },

  // A3. SUBCATEGORY: AIR CONDITIONERS (مكيفات هواء)
  tpl_air_conditioners: {
    id: "tpl_air_conditioners",
    mainCategory: "الإلكترونيات والأجهزة الكهربائية",
    subCategory: "مكيفات هواء",
    parentTemplateId: "tpl_appliances_base",
    description: "قالب خاص بمكيفات الهواء والتكييفات",
    iconName: "Wind",
    requiredFields: ["name", "price", "main_category", "sub_category", "brand", "horsepower"],
    optionalFields: ["cooling_mode", "inverter_tech", "coverage_area_sqm"],
    specDefinitions: [
      {
        id: "horsepower",
        name: "القدرة بالحصان",
        type: "select",
        options: ["1.5 حصان", "2.25 حصان", "3 حصان", "4 حصان", "5 حصان"],
        unit: "حصان",
        required: true,
      },
      {
        id: "cooling_mode",
        name: "نظام التبريد",
        type: "select",
        options: ["بارد فقط", "بارد / ساخن"],
        required: true,
      },
      {
        id: "inverter_tech",
        name: "تقنية الإنفرتر (Inverter)",
        type: "boolean",
        description: "يوفر حتى 40% من استهلاك الكهرباء",
      },
      {
        id: "coverage_area_sqm",
        name: "تغطية المساحة بالتقريب",
        type: "select",
        options: [
          "حتى 12 متر مربع",
          "من 12 إلى 18 متر مربع",
          "من 18 إلى 24 متر مربع",
          "من 24 إلى 36 متر مربع",
        ],
        unit: "م²",
      },
    ],
    allowedOptionTypes: [
      { type: "volume", label: "القدرة", defaultValues: ["1.5 حصان", "2.25 حصان", "3 حصان"] },
      { type: "color", label: "اللون", defaultValues: ["أبيض نقاء", "أسود بيانو", "فضي ستانلس"] },
    ],
    searchFilters: [
      {
        id: "horsepower",
        label: "القدرة (حصان)",
        type: "select",
        options: ["1.5 حصان", "2.25 حصان", "3 حصان", "4 حصان", "5 حصان"],
      },
      {
        id: "cooling_mode",
        label: "نظام التبريد",
        type: "select",
        options: ["بارد فقط", "بارد / ساخن"],
      },
      { id: "inverter_tech", label: "إنفرتر (توفير كهرباء)", type: "boolean" },
    ],
  },

  // -------------------------------------------------------------
  // B. PHONES & ACCESSORIES MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_phones_base: {
    id: "tpl_phones_base",
    mainCategory: "الهواتف والإكسسوارات",
    description: "قالب الموبايلات والهواتف الذكية والإكسسوارات",
    iconName: "Smartphone",
    requiredFields: ["name", "price", "main_category", "sub_category", "brand"],
    optionalFields: ["storage_capacity", "ram_capacity", "network_support", "screen_size_inch"],
    specDefinitions: [
      {
        id: "brand",
        name: "الماركة",
        type: "select",
        options: [
          "Apple",
          "Samsung",
          "Xiaomi",
          "Realme",
          "Oppo",
          "Vivo",
          "Honor",
          "Huawei",
          "Nokia",
          "Infinix",
          "أخرى",
        ],
        required: true,
      },
      {
        id: "storage_capacity",
        name: "سعة التخزين الداخلية",
        type: "select",
        options: ["64 جيجابايت", "128 جيجابايت", "256 جيجابايت", "512 جيجابايت", "1 تيرابايت"],
        unit: "جيجابايت",
      },
      {
        id: "ram_capacity",
        name: "الذاكرة العشوائية RAM",
        type: "select",
        options: ["4 جيجابايت", "6 جيجابايت", "8 جيجابايت", "12 جيجابايت", "16 جيجابايت"],
        unit: "جيجابايت",
      },
      {
        id: "network_support",
        name: "دعم الشبكات",
        type: "select",
        options: ["5G الجيل الخامس", "4G LTE الجيل الرابع", "3G"],
      },
      {
        id: "phone_condition",
        name: "حالة الهاتف",
        type: "select",
        options: ["جديد بتغليف المصنع", "مستعمل كالجديد (كسر زيرو)", "مجدد أصلية (Refurbished)"],
      },
    ],
    allowedOptionTypes: [
      {
        type: "color",
        label: "اللون",
        defaultValues: ["تيتانيوم طبيعي", "أسود يتألق", "أزرق ملكي", "رمادي فلكي", "ذهبي"],
      },
      {
        type: "volume",
        label: "السعة والتخزين",
        defaultValues: ["128GB / 8GB RAM", "256GB / 8GB RAM", "512GB / 12GB RAM"],
      },
    ],
    searchFilters: [
      {
        id: "brand",
        label: "الماركة",
        type: "multiselect",
        options: ["Apple", "Samsung", "Xiaomi", "Realme", "Oppo", "Vivo", "Honor"],
      },
      {
        id: "storage_capacity",
        label: "سعة التخزين",
        type: "select",
        options: ["64 جيجابايت", "128 جيجابايت", "256 جيجابايت", "512 جيجابايت", "1 تيرابايت"],
      },
      {
        id: "ram_capacity",
        label: "الرام (RAM)",
        type: "select",
        options: ["4 جيجابايت", "6 جيجابايت", "8 جيجابايت", "12 جيجابايت", "16 جيجابايت"],
      },
      {
        id: "network_support",
        label: "دعم 5G",
        type: "select",
        options: ["5G الجيل الخامس", "4G LTE الجيل الرابع"],
      },
    ],
  },

  // -------------------------------------------------------------
  // C. FASHION & APPAREL MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_fashion_base: {
    id: "tpl_fashion_base",
    mainCategory: "الملابس والأزياء",
    description: "قالب الملابس والأزياء والأحذية والحقائب",
    iconName: "Shirt",
    requiredFields: ["name", "price", "main_category", "sub_category"],
    optionalFields: ["fabric_type", "target_gender", "season", "brand"],
    specDefinitions: [
      {
        id: "fabric_type",
        name: "الخامة / قماش التصنيع",
        type: "select",
        options: [
          "قطن مصري 100%",
          "حرير طبيعي",
          "كتان نقي",
          "صوف ناعم",
          "جينز دنييم",
          "بوليستر خفيف",
          "مخمل / قطيفة",
          "شيفون",
        ],
      },
      {
        id: "target_gender",
        name: "الفئة المستهدفة",
        type: "select",
        options: ["نسائي", "رجالي", "أطفال بناتي", "أطفال أولادي", "للجنسين (Unisex)"],
      },
      {
        id: "season",
        name: "الموسم",
        type: "select",
        options: ["صيفي", "شتوي", "ربيعي/خريفي", "جميع الفصول"],
      },
      {
        id: "fashion_style",
        name: "الستايل",
        type: "select",
        options: ["كاجوال", "كلاسيك / رسمي", "رياضي", "سهرة / مناسبات", "عبايات ومحتشم"],
      },
    ],
    allowedOptionTypes: [
      {
        type: "color",
        label: "اللون",
        defaultValues: ["أسود", "أبيض", "كحلي", "أحمر", "بيج", "رمادي", "وردي"],
      },
      { type: "size", label: "المقاس", defaultValues: ["S", "M", "L", "XL", "2XL", "3XL"] },
      { type: "material", label: "الخامة", defaultValues: ["قطن 100%", "حرير", "كتان", "جينز"] },
    ],
    searchFilters: [
      {
        id: "target_gender",
        label: "الفئة",
        type: "select",
        options: ["نسائي", "رجالي", "أطفال بناتي", "أطفال أولادي"],
      },
      {
        id: "fabric_type",
        label: "الخامة",
        type: "multiselect",
        options: ["قطن مصري 100%", "حرير طبيعي", "كتان نقي", "جينز دنييم"],
      },
      { id: "season", label: "الموسم", type: "select", options: ["صيفي", "شتوي", "ربيعي/خريفي"] },
    ],
  },

  // C1. SUBCATEGORY: SHOES (أحذية)
  tpl_shoes: {
    id: "tpl_shoes",
    mainCategory: "الملابس والأزياء",
    subCategory: "أحذية",
    parentTemplateId: "tpl_fashion_base",
    description: "قالب الأحذية الرياضية والكلاسيكية",
    iconName: "Footprints",
    requiredFields: ["name", "price", "main_category", "sub_category"],
    optionalFields: ["shoe_material", "sole_type"],
    specDefinitions: [
      {
        id: "shoe_material",
        name: "خامة الحذاء External Material",
        type: "select",
        options: ["جلد طبيعي 100%", "جلد صناعي ممتاز", "قماش شبكي تنفسي", "شمواه فاخر"],
      },
      {
        id: "sole_type",
        name: "نوع النعل Sole",
        type: "select",
        options: ["مطاط طبيعي مضاد للانزلاق", "إيفا خفيف (EVA)", "جلد طبيعي"],
      },
    ],
    allowedOptionTypes: [
      {
        type: "size",
        label: "مقاس الحذاء",
        defaultValues: ["37", "38", "39", "40", "41", "42", "43", "44", "45"],
      },
      {
        type: "color",
        label: "اللون",
        defaultValues: ["أسود", "أبيض ناصع", "بني جلد", "كحلي", "رمادي"],
      },
    ],
    searchFilters: [
      {
        id: "shoe_material",
        label: "خامة الحذاء",
        type: "select",
        options: ["جلد طبيعي 100%", "جلد صناعي ممتاز", "قماش شبكي"],
      },
    ],
  },

  // -------------------------------------------------------------
  // D. HOME & FURNITURE MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_furniture_base: {
    id: "tpl_furniture_base",
    mainCategory: "المنزل والأثاث",
    description: "قالب الأثاث والمفروشات والديكور المنزلي",
    iconName: "Sofa",
    requiredFields: ["name", "price", "main_category", "sub_category", "wood_type"],
    optionalFields: ["dimensions_cm", "upholstery_fabric", "pieces_count", "wood_finish"],
    specDefinitions: [
      {
        id: "wood_type",
        name: "نوع الخشب المستخدَم",
        type: "select",
        options: [
          "خشب زان أحمر طبيعي",
          "خشب أروا فاخر",
          "خشب إم دي إف (MDF) أسباني",
          "خشب كونتر مضغوط",
          "ألوميتال / معدن",
        ],
        required: true,
      },
      {
        id: "upholstery_fabric",
        name: "خامة التنجيد والقماش",
        type: "select",
        options: [
          "جلد طبيعي 100%",
          "قماش قطيفة مستورد",
          "قماش كتان فاخر",
          "قماش جلد مقلوب",
          "بدون تنجيد",
        ],
      },
      {
        id: "pieces_count",
        name: "عدد القطع الطقم",
        type: "number",
        description: "عدد أجزاء أو قطع الطقم",
      },
      {
        id: "dimensions_cm",
        name: "الأبعاد (العرض × الطول × الارتفاع)",
        type: "text",
        description: "الأبعاد السطحية بالسنتيمتر",
      },
    ],
    allowedOptionTypes: [
      {
        type: "color",
        label: "لون الخشب والقماش",
        defaultValues: ["بني خشبي زان", "أسود مودرن", "رمادي كشمير", "أوف وايت / بيج", "أزرق كحلي"],
      },
      {
        type: "material",
        label: "نوع القماش",
        defaultValues: ["قطيفة فاخرة", "كتان أسباني", "جلد طبيعي"],
      },
      {
        type: "finish",
        label: "التشطيب",
        defaultValues: ["دهان أستر مذهب", "دهان دوكو أبيض", "دهان مطفي مودرن"],
      },
    ],
    searchFilters: [
      {
        id: "wood_type",
        label: "نوع الخشب",
        type: "select",
        options: ["خشب زان أحمر طبيعي", "خشب أروا فاخر", "خشب إم دي إف (MDF)"],
      },
      {
        id: "upholstery_fabric",
        label: "خامة القماش",
        type: "select",
        options: ["جلد طبيعي 100%", "قماش قطيفة مستورد", "قماش كتان فاخر"],
      },
    ],
  },

  // -------------------------------------------------------------
  // E. REAL ESTATE MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_realestate_base: {
    id: "tpl_realestate_base",
    mainCategory: "العقارات",
    description: "قالب الشقق والفلل والأراضي والمقرات الإدارية",
    iconName: "Home",
    requiredFields: ["name", "price", "main_category", "sub_category", "area_sqm", "rooms_count"],
    optionalFields: [
      "finishing_type",
      "is_furnished",
      "floor_number",
      "payment_type",
      "governorate",
      "district",
    ],
    specDefinitions: [
      {
        id: "area_sqm",
        name: "المساحة بالمتر المربع",
        type: "number",
        unit: "م²",
        required: true,
        description: "إجمالي المساحة بالمتر المربع",
      },
      {
        id: "rooms_count",
        name: "عدد الغرف الرئيسية",
        type: "number",
        required: true,
      },
      {
        id: "bathrooms_count",
        name: "عدد الحمامات",
        type: "number",
      },
      {
        id: "finishing_type",
        name: "مستوى التشطيب",
        type: "select",
        options: ["سوبر لوكس", "ألترا سوبر لوكس", "ديلوكس", "نصف تشطيب", "بدون تشطيب / عظم"],
        required: true,
      },
      {
        id: "is_furnished",
        name: "مفروش أم غير مفروش",
        type: "boolean",
      },
      {
        id: "floor_number",
        name: "رقم الطابق / الدور",
        type: "select",
        options: ["الأرضي", "الأول", "الثاني", "الثالث", "الرابع", "الخامس فما فوق", "روف / السطح"],
      },
      {
        id: "payment_type",
        name: "طريقة السداد",
        type: "select",
        options: ["كاش فقط", "تقسيط بمقدم وباقي على أقساط", "كاش أو تقسيط"],
      },
    ],
    allowedOptionTypes: [
      {
        type: "finish",
        label: "التشطيب الفرعي",
        defaultValues: ["سوبر لوكس بالكامل", "نصف تشطيب جاهز للمحارة"],
      },
      {
        type: "condition",
        label: "الحالة والأثاث",
        defaultValues: ["مفروشة بالكامل بالتكييفات", "غير مفروشة"],
      },
    ],
    searchFilters: [
      { id: "area_sqm", label: "المساحة (م²)", type: "range", unit: "م²" },
      {
        id: "rooms_count",
        label: "عدد الغرف",
        type: "select",
        options: ["1", "2", "3", "4", "5+"],
      },
      {
        id: "finishing_type",
        label: "التشطيب",
        type: "select",
        options: ["سوبر لوكس", "ألترا سوبر لوكس", "نصف تشطيب", "بدون تشطيب"],
      },
      { id: "is_furnished", label: "مفروشة", type: "boolean" },
      { id: "payment_type", label: "طريقة السداد", type: "select", options: ["كاش فقط", "تقسيط"] },
    ],
  },

  // -------------------------------------------------------------
  // F. AUTOMOTIVE & VEHICLES MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_automotive_base: {
    id: "tpl_automotive_base",
    mainCategory: "السيارات",
    description: "قالب السيارات والدراجات النارية والمركبات",
    iconName: "Car",
    requiredFields: [
      "name",
      "price",
      "main_category",
      "sub_category",
      "car_brand",
      "manufacturing_year",
    ],
    optionalFields: [
      "transmission_type",
      "fuel_type",
      "kilometers",
      "engine_capacity_cc",
      "car_condition",
    ],
    specDefinitions: [
      {
        id: "car_brand",
        name: "ماركة السيارة",
        type: "select",
        options: [
          "Toyota",
          "Mercedes-Benz",
          "BMW",
          "Hyundai",
          "Nissan",
          "Chery",
          "Kia",
          "MG",
          "Chevrolet",
          "Skoda",
          "Fiat",
          "Peugeot",
          "أخرى",
        ],
        required: true,
      },
      {
        id: "manufacturing_year",
        name: "سنة الصنع (الموديل)",
        type: "number",
        unit: "سنة",
        required: true,
        description: "سنة الموديل",
      },
      {
        id: "transmission_type",
        name: "ناقل الحركة",
        type: "select",
        options: ["أوتوماتيك", "مانيوال / يدوي", "ستيبترونيك", "CVT"],
        required: true,
      },
      {
        id: "fuel_type",
        name: "نوع الوقود",
        type: "select",
        options: ["بنزين 92/95", "غاز طبيعي", "كهرباء كاملة (EV)", "هجين (Hybrid)", "سولار / ديزل"],
      },
      {
        id: "kilometers",
        name: "عدد الكيلومترات المقطوعة",
        type: "number",
        unit: "كم",
      },
      {
        id: "engine_capacity_cc",
        name: "سعة المحرك (CC)",
        type: "select",
        options: ["1200 CC", "1400 CC", "1500 CC", "1600 CC", "2000 CC", "3000+ CC"],
        unit: "CC",
      },
    ],
    allowedOptionTypes: [
      {
        type: "color",
        label: "لون السيارة الخارجي",
        defaultValues: ["أسود ملكي", "أبيض ناصع", "فضي مجري", "رمادي فيراني", "أحمر نبيذي"],
      },
      {
        type: "condition",
        label: "الفئة والفرش",
        defaultValues: ["فئة أولى (فرش جلد)", "أعلى فئة (فتحة سقف وبانوراما)"],
      },
    ],
    searchFilters: [
      {
        id: "car_brand",
        label: "الماركة",
        type: "multiselect",
        options: ["Toyota", "Mercedes-Benz", "BMW", "Hyundai", "Nissan", "Chery", "Kia"],
      },
      { id: "manufacturing_year", label: "سنة الصنع", type: "range", unit: "سنة" },
      {
        id: "transmission_type",
        label: "ناقل الحركة",
        type: "select",
        options: ["أوتوماتيك", "مانيوال / يدوي"],
      },
      {
        id: "fuel_type",
        label: "نوع الوقود",
        type: "select",
        options: ["بنزين 92/95", "غاز طبيعي", "كهرباء كاملة", "هجين"],
      },
    ],
  },

  // -------------------------------------------------------------
  // G. BEAUTY & PERFUMES MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_beauty_base: {
    id: "tpl_beauty_base",
    mainCategory: "مستحضرات التجميل والعطور",
    description: "قالب مستحضرات التجميل والعطور والعناية الشخصية",
    iconName: "Sparkles",
    requiredFields: ["name", "price", "main_category", "sub_category"],
    optionalFields: ["volume_ml", "fragrance_concentration", "skin_type", "expiry_date"],
    specDefinitions: [
      {
        id: "volume_ml",
        name: "الحجم / السعة بالمليلتر",
        type: "number",
        unit: "مل",
      },
      {
        id: "fragrance_concentration",
        name: "تركيز العطر",
        type: "select",
        options: [
          "Parfum (عطر نقي نيش)",
          "Eau de Parfum (EDP)",
          "Eau de Toilette (EDT)",
          "Eau de Cologne (EDC)",
        ],
      },
      {
        id: "skin_type",
        name: "نوع البشرة المناسب",
        type: "select",
        options: ["جميع أنواع البشرة", "بشرة دهنية", "بشرة جافة", "بشرة حساسة", "بشرة مختلطة"],
      },
    ],
    allowedOptionTypes: [
      { type: "volume", label: "الحجم", defaultValues: ["50 مل", "100 مل", "150 مل", "200 مل"] },
      {
        type: "flavor",
        label: "النكهة/الرائحة",
        defaultValues: ["العود والعنبر", "زهور برية ولافندر", "فانيليا ومسك", "حمضيات منعشة"],
      },
    ],
    searchFilters: [
      {
        id: "fragrance_concentration",
        label: "تركيز العطر",
        type: "select",
        options: ["Parfum", "Eau de Parfum (EDP)", "Eau de Toilette (EDT)"],
      },
    ],
  },

  // -------------------------------------------------------------
  // H. SUPERMARKET & GROCERY MASTER TEMPLATE
  // -------------------------------------------------------------
  tpl_grocery_base: {
    id: "tpl_grocery_base",
    mainCategory: "السوبر ماركت والأغذية",
    description: "قالب الأغذية والمشروبات والمنتجات الاستهلاكية",
    iconName: "ShoppingBag",
    requiredFields: ["name", "price", "main_category", "sub_category", "net_weight_grams"],
    optionalFields: ["expiry_date", "storage_condition", "origin_country"],
    specDefinitions: [
      {
        id: "net_weight_grams",
        name: "الوزن / الصافي",
        type: "text",
        description: "الوزن الصافي أو الحجم",
      },
      {
        id: "storage_condition",
        name: "طريقة الحفظ والتخزين",
        type: "select",
        options: [
          "يحفظ جافاً في درجة حرارة الغرفة",
          "يحفظ مبرداً بالثلاجة (2-5°C)",
          "يحفظ مجرداً بالفريزر (-18°C)",
        ],
      },
    ],
    allowedOptionTypes: [
      {
        type: "volume",
        label: "الحجم والعبوة",
        defaultValues: ["250 جرام", "500 جرام", "1 كجم", "1 لتر"],
      },
      {
        type: "flavor",
        label: "الطعم والنكهة",
        defaultValues: ["بالفانيليا", "بالشوكولاتة", "طبيعي بدون سكر"],
      },
    ],
    searchFilters: [
      {
        id: "storage_condition",
        label: "طريقة الحفظ",
        type: "select",
        options: ["جاف", "مبرد", "مجمد"],
      },
    ],
  },
};

// ==========================================
// 3. MASTER CATALOG HIERARCHY (الأقسام الشاملة)
// ==========================================

export const MARKETPLACE_CATALOG_TREE: Array<{
  mainCategory: string;
  templateId: string;
  subCategories: string[];
}> = [
  {
    mainCategory: "الأزياء",
    templateId: "tpl_fashion_base",
    subCategories: ["النساء", "الرجال", "الأطفال", "للجميع"],
  },
  {
    mainCategory: "الإلكترونيات",
    templateId: "tpl_electronics_base",
    subCategories: [
      "الهواتف",
      "الأجهزة اللوحية",
      "اللابتوبات",
      "الشاشات",
      "الساعات الذكية",
      "السماعات",
      "الكاميرات",
      "الإكسسوارات",
    ],
  },
  {
    mainCategory: "الأجهزة الكهربائية",
    templateId: "tpl_appliances_base",
    subCategories: ["الثلاجات", "الغسالات", "البوتاجازات", "المكيفات", "المكانس", "الشاشات"],
  },
  {
    mainCategory: "المنزل والأثاث",
    templateId: "tpl_furniture_base",
    subCategories: ["الكنب", "الطاولات", "الأسرة", "الدواليب", "الديكور"],
  },
  {
    mainCategory: "العقارات",
    templateId: "tpl_realestate_base",
    subCategories: ["شقق", "فلل", "أراضي", "محلات", "مكاتب"],
  },
  {
    mainCategory: "السيارات",
    templateId: "tpl_automotive_base",
    subCategories: ["سيارات", "دراجات نارية", "قطع الغيار", "الإكسسوارات"],
  },
  {
    mainCategory: "الصحة والجمال",
    templateId: "tpl_beauty_base",
    subCategories: ["العطور", "العناية بالبشرة", "العناية بالشعر", "المكياج", "الأجهزة"],
  },
  {
    mainCategory: "الأم والطفل",
    templateId: "tpl_baby_base",
    subCategories: ["الملابس", "عربات الأطفال", "مقاعد السيارة", "الألعاب"],
  },
  {
    mainCategory: "السوبر ماركت",
    templateId: "tpl_grocery_base",
    subCategories: ["الأغذية", "المشروبات", "المنظفات"],
  },
  {
    mainCategory: "الكتب",
    templateId: "tpl_books_base",
    subCategories: ["كتب", "مجلات"],
  },
  {
    mainCategory: "الرياضة",
    templateId: "tpl_sports_base",
    subCategories: ["الملابس", "الأحذية", "المعدات"],
  },
  {
    mainCategory: "الهدايا",
    templateId: "tpl_gifts_base",
    subCategories: ["هدايا"],
  },
  {
    mainCategory: "الحرف اليدوية",
    templateId: "tpl_handicrafts_base",
    subCategories: ["حرف يدوية"],
  },
];

// ==========================================
// 4. INHERITANCE & TEMPLATE HELPER FUNCTIONS
// ==========================================

export function getTemplateForCategory(
  mainCategory: string,
  subCategory?: string,
): CategoryTemplate {
  // Check if subCategory has a dedicated sub-template
  if (subCategory) {
    const subTplKeys = Object.keys(MASTER_CATEGORY_TEMPLATES).filter(
      (k) => MASTER_CATEGORY_TEMPLATES[k].subCategory === subCategory,
    );
    if (subTplKeys.length > 0) {
      const subTpl = MASTER_CATEGORY_TEMPLATES[subTplKeys[0]];
      // Resolve inheritance if parentTemplateId exists
      if (subTpl.parentTemplateId && MASTER_CATEGORY_TEMPLATES[subTpl.parentTemplateId]) {
        const parentTpl = MASTER_CATEGORY_TEMPLATES[subTpl.parentTemplateId];
        return {
          ...parentTpl,
          ...subTpl,
          requiredFields: Array.from(
            new Set([...parentTpl.requiredFields, ...subTpl.requiredFields]),
          ),
          optionalFields: Array.from(
            new Set([...parentTpl.optionalFields, ...subTpl.optionalFields]),
          ),
          specDefinitions: mergeSpecs(parentTpl.specDefinitions, subTpl.specDefinitions),
          allowedOptionTypes: mergeOptionTypes(
            parentTpl.allowedOptionTypes,
            subTpl.allowedOptionTypes,
          ),
          searchFilters: mergeFilters(parentTpl.searchFilters, subTpl.searchFilters),
        };
      }
      return subTpl;
    }
  }

  // Find matching main category entry in tree
  const matchedTree = MARKETPLACE_CATALOG_TREE.find(
    (item) => item.mainCategory.trim().toLowerCase() === (mainCategory || "").trim().toLowerCase(),
  );

  if (matchedTree && MASTER_CATEGORY_TEMPLATES[matchedTree.templateId]) {
    return MASTER_CATEGORY_TEMPLATES[matchedTree.templateId];
  }

  // Smart fallback matching keywords
  const lower = (mainCategory || "").toLowerCase();
  if (
    lower.includes("أزياء") ||
    lower.includes("ملابس") ||
    lower.includes("حقائب") ||
    lower.includes("أحذية")
  ) {
    return MASTER_CATEGORY_TEMPLATES["tpl_fashion_base"];
  }
  if (lower.includes("عقار") || lower.includes("شقق") || lower.includes("أراض")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_realestate_base"];
  }
  if (lower.includes("سيار") || lower.includes("مركب")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_automotive_base"];
  }
  if (lower.includes("أثاث") || lower.includes("منزل") || lower.includes("ديكور")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_furniture_base"];
  }
  if (lower.includes("هاتف") || lower.includes("موبايل")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_phones_base"];
  }
  if (lower.includes("تجميل") || lower.includes("عطر")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_beauty_base"];
  }
  if (lower.includes("سوبر") || lower.includes("غذاء") || lower.includes("بقالة")) {
    return MASTER_CATEGORY_TEMPLATES["tpl_grocery_base"];
  }

  // Default Base Template
  return MASTER_CATEGORY_TEMPLATES["tpl_appliances_base"];
}

function mergeSpecs(
  parentSpecs: SpecFieldDefinition[],
  childSpecs: SpecFieldDefinition[],
): SpecFieldDefinition[] {
  const map = new Map<string, SpecFieldDefinition>();
  parentSpecs.forEach((s) => map.set(s.id, s));
  childSpecs.forEach((s) => map.set(s.id, s));
  return Array.from(map.values());
}

function mergeOptionTypes(
  parentOptions: AllowedOptionType[],
  childOptions: AllowedOptionType[],
): AllowedOptionType[] {
  const map = new Map<string, AllowedOptionType>();
  parentOptions.forEach((o) => map.set(o.type, o));
  childOptions.forEach((o) => map.set(o.type, o));
  return Array.from(map.values());
}

function mergeFilters(
  parentFilters: CategoryFilterDefinition[],
  childFilters: CategoryFilterDefinition[],
): CategoryFilterDefinition[] {
  const map = new Map<string, CategoryFilterDefinition>();
  parentFilters.forEach((f) => map.set(f.id, f));
  childFilters.forEach((f) => map.set(f.id, f));
  return Array.from(map.values());
}

export function getAllMainCategories(): string[] {
  return MARKETPLACE_CATALOG_TREE.map((item) => item.mainCategory);
}

export function getSubcategoriesForMainCategory(mainCategory: string): string[] {
  const matched = MARKETPLACE_CATALOG_TREE.find(
    (item) => item.mainCategory.trim().toLowerCase() === (mainCategory || "").trim().toLowerCase(),
  );
  return matched ? matched.subCategories : [];
}

/**
 * Ensures when a seller creates a brand new category, it picks a master template to inherit from.
 */
export function createCategoryWithInheritance(
  newMainCategory: string,
  newSubCategory: string,
  baseTemplateId: string = "tpl_appliances_base",
) {
  const baseTpl =
    MASTER_CATEGORY_TEMPLATES[baseTemplateId] || MASTER_CATEGORY_TEMPLATES["tpl_appliances_base"];

  // Register in Tree dynamically
  let existingMain = MARKETPLACE_CATALOG_TREE.find((item) => item.mainCategory === newMainCategory);

  if (!existingMain) {
    existingMain = {
      mainCategory: newMainCategory,
      templateId: baseTemplateId,
      subCategories: [],
    };
    MARKETPLACE_CATALOG_TREE.push(existingMain);
  }

  if (newSubCategory && !existingMain.subCategories.includes(newSubCategory)) {
    existingMain.subCategories.push(newSubCategory);
  }

  return getTemplateForCategory(newMainCategory, newSubCategory);
}
