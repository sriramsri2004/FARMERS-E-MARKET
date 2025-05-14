
-- Create orders table
CREATE TABLE IF NOT EXISTS public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id),
  farmer_id UUID NOT NULL REFERENCES auth.users(id),
  quantity INTEGER NOT NULL,
  total_price NUMERIC NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

-- Create policies for orders table
CREATE POLICY "Buyers can view their own orders" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = buyer_id);

CREATE POLICY "Farmers can view orders for their products" 
  ON public.orders 
  FOR SELECT 
  USING (auth.uid() = farmer_id);

CREATE POLICY "Buyers can create orders" 
  ON public.orders 
  FOR INSERT 
  WITH CHECK (auth.uid() = buyer_id);

CREATE POLICY "Farmers can update their order status" 
  ON public.orders 
  FOR UPDATE 
  USING (auth.uid() = farmer_id)
  WITH CHECK (auth.uid() = farmer_id AND (NEW.status = 'accepted' OR NEW.status = 'rejected' OR NEW.status = 'completed'));

-- Enable realtime for orders
ALTER PUBLICATION supabase_realtime ADD TABLE public.orders;
ALTER TABLE public.orders REPLICA IDENTITY FULL;
