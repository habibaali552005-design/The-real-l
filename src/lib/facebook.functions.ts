/* eslint-disable @typescript-eslint/no-explicit-any */
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const GRAPH = "https://graph.facebook.com/v21.0";

async function assertAdmin(context: { supabase: any; userId: string }) {
  const { data, error } = await context.supabase.rpc("has_role", {
    _user_id: context.userId,
    _role: "admin",
  });
  if (error) throw new Error(error.message);
  if (!data) throw new Error("Forbidden");
}

async function fbFetch(path: string, token: string, params: Record<string, string> = {}) {
  const url = new URL(`${GRAPH}${path}`);
  url.searchParams.set("access_token", token);
  for (const [k, v] of Object.entries(params)) url.searchParams.set(k, v);
  const res = await fetch(url.toString());
  const json = (await res.json()) as any;
  if (!res.ok || json.error) {
    throw new Error(json.error?.message || `Facebook API error ${res.status}`);
  }
  return json;
}

// ----- Get current connection status -----
export const getFacebookStatus = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("facebook_connections")
      .select("id, page_id, page_name, auto_sync, last_sync_at, created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    return data;
  });

// ----- Save / connect -----
const ConnectSchema = z.object({
  pageId: z.string().min(3),
  accessToken: z.string().min(20),
});

export const connectFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => ConnectSchema.parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    // Verify token works
    const page = await fbFetch(`/${data.pageId}`, data.accessToken, { fields: "id,name" });

    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    // Upsert single row (delete any old)
    await supabaseAdmin.from("facebook_connections").delete().neq("page_id", data.pageId);
    const { error } = await supabaseAdmin.from("facebook_connections").upsert(
      {
        page_id: page.id,
        page_name: page.name,
        access_token: data.accessToken,
        connected_by: context.userId,
      },
      { onConflict: "page_id" },
    );
    if (error) throw new Error(error.message);
    return { page_id: page.id, page_name: page.name };
  });

// ----- Disconnect -----
export const disconnectFacebook = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin
      .from("facebook_connections")
      .delete()
      .neq("id", "00000000-0000-0000-0000-000000000000");
    return { ok: true };
  });

// ----- Toggle auto sync -----
export const setAutoSync = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((v: unknown) => z.object({ enabled: z.boolean() }).parse(v))
  .handler(async ({ data, context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { error } = await supabaseAdmin
      .from("facebook_connections")
      .update({ auto_sync: data.enabled })
      .neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) throw new Error(error.message);
    return { ok: true };
  });

// ----- List recent logs -----
export const getSyncLogs = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { data } = await context.supabase
      .from("sync_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(50);
    return data ?? [];
  });

// ----- AI extraction of a Facebook post -----
async function extractProductFromPost(opts: {
  text: string;
  imageUrls: string[];
  categories: string[];
}): Promise<null | {
  name: string;
  price: number | null;
  description: string;
  short_description: string;
  category: string;
  colors: string[];
  sizes: string[];
  tags: string[];
  keywords: string[];
  seo_title: string;
  seo_description: string;
  specifications: Record<string, string>;
}> {
  const key = process.env.LOVABLE_API_KEY;
  if (!key) throw new Error("Missing LOVABLE_API_KEY");

  const catList = opts.categories.length
    ? opts.categories.join(", ")
    : "أثاث، أجهزة كهربائية، سيارات، عقارات";

  const systemPrompt = `أنت مساعد لاستخراج بيانات المنتجات من منشورات فيسبوك بالعربية المصرية.
أرجع JSON فقط بالحقول التالية:
- name: اسم مختصر واضح
- price: رقم بالجنيه المصري (بدون كلمة "جنيه") أو null لو مش موجود
- description: وصف احترافي 2-4 جمل
- short_description: جملة قصيرة
- category: يجب اختيارها من القائمة: ${catList}
- colors: مصفوفة ألوان (فارغة لو مش موجودة)
- sizes: مصفوفة مقاسات (فارغة لو مش موجودة)
- tags: مصفوفة وسوم قصيرة
- keywords: كلمات مفتاحية للبحث
- seo_title: عنوان SEO مغرٍ (60 حرف)
- seo_description: وصف SEO (150 حرف)
- specifications: كائن مواصفات مفتاح/قيمة
لو المنشور مش بيتكلم عن منتج للبيع، أرجع {"skip": true}.`;

  const content: any[] = [{ type: "text", text: opts.text.slice(0, 4000) }];
  for (const url of opts.imageUrls.slice(0, 4)) {
    content.push({ type: "image_url", image_url: { url } });
  }

  const res = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      model: "google/gemini-3-flash-preview",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content },
      ],
      response_format: { type: "json_object" },
    }),
  });
  if (!res.ok) throw new Error(`AI extraction failed: ${res.status} ${await res.text()}`);
  const j = (await res.json()) as any;
  const raw = j.choices?.[0]?.message?.content;
  if (!raw) return null;
  let parsed: any;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return null;
  }
  if (parsed?.skip) return null;
  return {
    name: String(parsed.name ?? "").trim(),
    price: parsed.price == null ? null : Number(parsed.price),
    description: String(parsed.description ?? ""),
    short_description: String(parsed.short_description ?? ""),
    category: String(parsed.category ?? opts.categories[0] ?? ""),
    colors: Array.isArray(parsed.colors) ? parsed.colors.map(String) : [],
    sizes: Array.isArray(parsed.sizes) ? parsed.sizes.map(String) : [],
    tags: Array.isArray(parsed.tags) ? parsed.tags.map(String) : [],
    keywords: Array.isArray(parsed.keywords) ? parsed.keywords.map(String) : [],
    seo_title: String(parsed.seo_title ?? ""),
    seo_description: String(parsed.seo_description ?? ""),
    specifications:
      parsed.specifications && typeof parsed.specifications === "object"
        ? parsed.specifications
        : {},
  };
}

// ----- Sync posts now -----
export const syncFacebookNow = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    await assertAdmin(context);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: conn } = await supabaseAdmin
      .from("facebook_connections")
      .select("*")
      .limit(1)
      .maybeSingle();
    if (!conn) throw new Error("لسه مربطتش صفحة فيسبوك");

    const { data: cats } = await supabaseAdmin
      .from("categories")
      .select("name")
      .order("sort_order");
    const categoryNames = (cats ?? []).map((c: any) => c.name);

    // Fetch recent posts with attachments
    const feed = await fbFetch(`/${conn.page_id}/posts`, conn.access_token, {
      fields: "id,message,created_time,attachments{media,subattachments{media}}",
      limit: "25",
    });

    const posts: any[] = feed.data ?? [];
    let created = 0;
    let skipped = 0;
    let dupes = 0;
    let failed = 0;

    for (const post of posts) {
      try {
        // Dedupe by fb_post_id
        const { data: existing } = await supabaseAdmin
          .from("facebook_post_links")
          .select("id")
          .eq("fb_post_id", post.id)
          .maybeSingle();
        if (existing) {
          dupes++;
          continue;
        }

        // Collect all image URLs
        const images: string[] = [];
        const atts = post.attachments?.data ?? [];
        for (const a of atts) {
          if (a.media?.image?.src) images.push(a.media.image.src);
          for (const sub of a.subattachments?.data ?? []) {
            if (sub.media?.image?.src) images.push(sub.media.image.src);
          }
        }
        if (images.length === 0 || !post.message) {
          skipped++;
          await supabaseAdmin.from("sync_logs").insert({
            kind: "import",
            status: "skipped",
            message: "منشور بدون صور أو نص",
            fb_post_id: post.id,
          });
          continue;
        }

        // Dedupe by first image URL
        const { data: byImg } = await supabaseAdmin
          .from("facebook_post_links")
          .select("id, product_id")
          .eq("image_hash", images[0])
          .maybeSingle();
        if (byImg) {
          await supabaseAdmin.from("facebook_post_links").insert({
            fb_post_id: post.id,
            product_id: byImg.product_id,
            image_hash: images[0],
          });
          dupes++;
          continue;
        }

        const extracted = await extractProductFromPost({
          text: post.message,
          imageUrls: images,
          categories: categoryNames,
        });
        if (!extracted || !extracted.name || extracted.price == null) {
          skipped++;
          await supabaseAdmin.from("sync_logs").insert({
            kind: "import",
            status: "skipped",
            message: "AI مقدرش يستخرج منتج",
            fb_post_id: post.id,
          });
          continue;
        }

        // Fallback category
        const category = categoryNames.includes(extracted.category)
          ? extracted.category
          : (categoryNames[0] ?? "عام");

        const { data: prod, error: prodErr } = await supabaseAdmin
          .from("products")
          .insert({
            name: extracted.name,
            description: extracted.description,
            short_description: extracted.short_description,
            price: extracted.price,
            image_url: images[0],
            category,
            in_stock: true,
            featured: false,
            colors: extracted.colors,
            sizes: extracted.sizes,
            tags: extracted.tags,
            keywords: extracted.keywords,
            seo_title: extracted.seo_title,
            seo_description: extracted.seo_description,
            specifications: extracted.specifications,
            is_published: true,
            source: "facebook",
          })
          .select("id")
          .single();
        if (prodErr || !prod) throw new Error(prodErr?.message || "insert product failed");

        // Insert all images
        const imageRows = images.map((url, i) => ({
          product_id: prod.id,
          url,
          original_url: url,
          is_cover: i === 0,
          sort_order: i,
        }));
        await supabaseAdmin.from("product_images").insert(imageRows);

        // Link post
        await supabaseAdmin.from("facebook_post_links").insert({
          fb_post_id: post.id,
          product_id: prod.id,
          image_hash: images[0],
          title_hash: extracted.name,
        });

        created++;
        await supabaseAdmin.from("sync_logs").insert({
          kind: "import",
          status: "success",
          message: `تم استيراد: ${extracted.name}`,
          fb_post_id: post.id,
          product_id: prod.id,
        });
      } catch (err) {
        failed++;
        await supabaseAdmin.from("sync_logs").insert({
          kind: "import",
          status: "error",
          message: (err as Error).message.slice(0, 500),
          fb_post_id: post.id,
        });
      }
    }

    await supabaseAdmin
      .from("facebook_connections")
      .update({ last_sync_at: new Date().toISOString() })
      .eq("id", conn.id);

    return { created, skipped, dupes, failed, scanned: posts.length };
  });
