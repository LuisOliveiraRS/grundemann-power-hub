
ALTER TABLE public.products 
  ADD COLUMN IF NOT EXISTS additional_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS video_url text DEFAULT '';
