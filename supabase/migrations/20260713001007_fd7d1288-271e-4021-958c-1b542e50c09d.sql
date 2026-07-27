
-- 1) Lock down has_role EXECUTE (SECURITY DEFINER)
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.has_role(uuid, public.app_role) FROM anon;
GRANT EXECUTE ON FUNCTION public.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 2) Replace always-true INSERT policies with validated checks
DROP POLICY IF EXISTS "Anyone can create an order" ON public.orders;
CREATE POLICY "Anyone can create an order"
  ON public.orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(customer_name) BETWEEN 2 AND 120
    AND length(phone) BETWEEN 6 AND 30
    AND length(address) BETWEEN 3 AND 500
    AND length(area) BETWEEN 2 AND 120
    AND length(governorate) BETWEEN 2 AND 60
    AND total >= 0
    AND jsonb_typeof(items) = 'array'
    AND jsonb_array_length(items) BETWEEN 1 AND 100
    AND (notes IS NULL OR length(notes) <= 1000)
    AND status = 'new'
  );

DROP POLICY IF EXISTS "Anyone can send a message" ON public.contact_messages;
CREATE POLICY "Anyone can send a message"
  ON public.contact_messages
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    length(name) BETWEEN 2 AND 120
    AND length(phone) BETWEEN 6 AND 30
    AND length(message) BETWEEN 2 AND 2000
    AND status = 'new'
  );
