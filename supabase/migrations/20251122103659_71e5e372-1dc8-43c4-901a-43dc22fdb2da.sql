-- Enable RLS on site_settings if not already enabled
ALTER TABLE public.site_settings ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if any
DROP POLICY IF EXISTS "Allow admins to read site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to insert site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow admins to update site settings" ON public.site_settings;
DROP POLICY IF EXISTS "Allow public read for specific settings" ON public.site_settings;

-- Allow admins full access to site_settings
CREATE POLICY "Allow admins to read site settings"
ON public.site_settings
FOR SELECT
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Allow admins to insert site settings"
ON public.site_settings
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

CREATE POLICY "Allow admins to update site settings"
ON public.site_settings
FOR UPDATE
TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_roles.user_id = auth.uid()
    AND user_roles.role = 'admin'
  )
);

-- Allow public read access to specific non-sensitive settings
CREATE POLICY "Allow public read for specific settings"
ON public.site_settings
FOR SELECT
TO public
USING (
  key IN ('site_name', 'site_description', 'contact_email', 'paystack_public_key')
);