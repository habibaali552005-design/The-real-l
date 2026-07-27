
-- Expand products with rich fields
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS short_description text,
  ADD COLUMN IF NOT EXISTS specifications jsonb NOT NULL DEFAULT '{}'::jsonb,
  ADD COLUMN IF NOT EXISTS colors text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS sizes text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS keywords text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS is_published boolean NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS manually_edited_fields text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS source text NOT NULL DEFAULT 'manual';

-- Multiple images per product
CREATE TABLE IF NOT EXISTS public.product_images (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  url text NOT NULL,
  original_url text,
  is_cover boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS product_images_product_idx ON public.product_images(product_id, sort_order);

GRANT SELECT ON public.product_images TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.product_images TO authenticated;
GRANT ALL ON public.product_images TO service_role;

ALTER TABLE public.product_images ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read product images" ON public.product_images FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "admins manage product images" ON public.product_images FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Facebook connection (single row, admin managed)
CREATE TABLE IF NOT EXISTS public.facebook_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  page_id text NOT NULL UNIQUE,
  page_name text,
  access_token text NOT NULL,
  auto_sync boolean NOT NULL DEFAULT false,
  last_sync_at timestamptz,
  connected_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_connections TO authenticated;
GRANT ALL ON public.facebook_connections TO service_role;

ALTER TABLE public.facebook_connections ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage fb connections" ON public.facebook_connections FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Link Facebook posts to website products (dedup)
CREATE TABLE IF NOT EXISTS public.facebook_post_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fb_post_id text NOT NULL UNIQUE,
  product_id uuid NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  image_hash text,
  title_hash text,
  imported_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS fb_post_links_product_idx ON public.facebook_post_links(product_id);
CREATE INDEX IF NOT EXISTS fb_post_links_image_hash_idx ON public.facebook_post_links(image_hash);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.facebook_post_links TO authenticated;
GRANT ALL ON public.facebook_post_links TO service_role;

ALTER TABLE public.facebook_post_links ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins manage fb post links" ON public.facebook_post_links FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin')) WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Sync logs
CREATE TABLE IF NOT EXISTS public.sync_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL,
  status text NOT NULL,
  message text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  fb_post_id text,
  product_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS sync_logs_created_idx ON public.sync_logs(created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.sync_logs TO authenticated;
GRANT ALL ON public.sync_logs TO service_role;

ALTER TABLE public.sync_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "admins read sync logs" ON public.sync_logs FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "admins write sync logs" ON public.sync_logs FOR INSERT TO authenticated
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Backfill product_images from existing products.image_url
INSERT INTO public.product_images (product_id, url, original_url, is_cover, sort_order)
SELECT id, image_url, image_url, true, 0
FROM public.products
WHERE image_url IS NOT NULL
  AND NOT EXISTS (SELECT 1 FROM public.product_images pi WHERE pi.product_id = products.id);

CREATE TRIGGER trg_fb_connections_updated
  BEFORE UPDATE ON public.facebook_connections
  FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();
