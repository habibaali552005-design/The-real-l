
-- Roles
CREATE TYPE public.app_role AS ENUM ('admin', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);
GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role)
$$;

CREATE POLICY "Users can view own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

-- Products
CREATE TABLE public.products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  price numeric(10,2) NOT NULL CHECK (price >= 0),
  image_url text,
  category text NOT NULL,
  in_stock boolean NOT NULL DEFAULT true,
  featured boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.products TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON public.products TO authenticated;
GRANT ALL ON public.products TO service_role;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view products" ON public.products FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Admins can insert products" ON public.products FOR INSERT TO authenticated WITH CHECK (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update products" ON public.products FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete products" ON public.products FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- Orders
CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  phone text NOT NULL,
  governorate text NOT NULL,
  area text NOT NULL,
  address text NOT NULL,
  notes text,
  items jsonb NOT NULL,
  total numeric(10,2) NOT NULL,
  status text NOT NULL DEFAULT 'new',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.orders TO anon, authenticated;
GRANT SELECT, UPDATE, DELETE ON public.orders TO authenticated;
GRANT ALL ON public.orders TO service_role;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create an order" ON public.orders FOR INSERT TO anon, authenticated WITH CHECK (true);
CREATE POLICY "Admins can view orders" ON public.orders FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can update orders" ON public.orders FOR UPDATE TO authenticated USING (public.has_role(auth.uid(), 'admin'));
CREATE POLICY "Admins can delete orders" ON public.orders FOR DELETE TO authenticated USING (public.has_role(auth.uid(), 'admin'));

-- updated_at trigger
CREATE OR REPLACE FUNCTION public.tg_set_updated_at() RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER products_updated_at BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.tg_set_updated_at();

-- Auto-assign admin role to the first user who signs up
CREATE OR REPLACE FUNCTION public.assign_first_admin()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM public.user_roles WHERE role = 'admin') THEN
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'admin');
  ELSE
    INSERT INTO public.user_roles (user_id, role) VALUES (NEW.id, 'user');
  END IF;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created_assign_role
  AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.assign_first_admin();

-- Seed products
INSERT INTO public.products (name, description, price, image_url, category, featured) VALUES
('كنبة سلطان مخمل', 'كنبة ٣ مقاعد بقماش مخمل فاخر - رمادي داكن، هيكل خشب زان طبيعي', 18500, 'https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=800', 'غرف معيشة', true),
('كرسي زمرد المخملي', 'كرسي مخملي أخضر زيتوني بتصميم عصري وقاعدة خشبية', 4250, 'https://images.unsplash.com/photo-1567538096630-e0c55bd6374c?w=800', 'غرف معيشة', true),
('طاولة قهوة رخام', 'طاولة قهوة بسطح رخامي طبيعي وأرجل خشب بلوط', 3800, 'https://images.unsplash.com/photo-1533090481720-856c6e3c1fdc?w=800', 'غرف معيشة', true),
('سرير أرابيسك مزدوج', 'سرير ٢٠٠×١٨٠ بتصميم شرقي معاصر وحفر يدوي على الظهر', 22000, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?w=800', 'غرف نوم', true),
('كومودينو خشب جوز', 'كومودينو بدرجين من خشب الجوز الطبيعي', 2800, 'https://images.unsplash.com/photo-1595428774223-ef52624120d2?w=800', 'غرف نوم', false),
('طاولة سفرة ٦ أشخاص', 'طاولة طعام خشب زان طبيعي تتسع لـ ٦ أشخاص', 14500, 'https://images.unsplash.com/photo-1615529182904-14819c35db37?w=800', 'طاولات طعام', true),
('كرسي سفرة خشب', 'كرسي طعام بمقعد جلد ناتشورال وقاعدة خشب زان (السعر للقطعة)', 1650, 'https://images.unsplash.com/photo-1503602642458-232111445657?w=800', 'طاولات طعام', false),
('مكتبة كتب حائطية', 'مكتبة كتب ٥ أرفف بتصميم عصري لون بني غامق', 6500, 'https://images.unsplash.com/photo-1594620302200-9a762244a156?w=800', 'ديكورات', false);
