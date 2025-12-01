-- Add delivery_agent to app_role enum
ALTER TYPE app_role ADD VALUE IF NOT EXISTS 'delivery_agent';

-- Create delivery_jobs table
CREATE TABLE IF NOT EXISTS public.delivery_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE NOT NULL,
  delivery_agent_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  pickup_address JSONB NOT NULL,
  delivery_address JSONB NOT NULL,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'assigned', 'picked_up', 'in_transit', 'delivered', 'cancelled')),
  assigned_at TIMESTAMP WITH TIME ZONE,
  completed_at TIMESTAMP WITH TIME ZONE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on delivery_jobs
ALTER TABLE public.delivery_jobs ENABLE ROW LEVEL SECURITY;

-- Delivery agents can view assigned jobs
CREATE POLICY "Delivery agents can view assigned jobs"
ON public.delivery_jobs FOR SELECT
USING (
  auth.uid() = delivery_agent_id OR
  EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin')
);

-- Admins can manage all jobs
CREATE POLICY "Admins can manage delivery jobs"
ON public.delivery_jobs FOR ALL
USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));

-- Delivery agents can update their assigned jobs
CREATE POLICY "Delivery agents can update assigned jobs"
ON public.delivery_jobs FOR UPDATE
USING (auth.uid() = delivery_agent_id)
WITH CHECK (auth.uid() = delivery_agent_id);

-- Create trigger for updated_at
CREATE TRIGGER update_delivery_jobs_updated_at
BEFORE UPDATE ON public.delivery_jobs
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at();

-- Add paystack_test_mode setting to site_settings
INSERT INTO public.site_settings (key, value)
VALUES ('paystack_test_mode', 'false'::jsonb)
ON CONFLICT (key) DO NOTHING;