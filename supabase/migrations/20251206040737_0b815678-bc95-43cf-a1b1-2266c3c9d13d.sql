-- Add display_order column to categories
ALTER TABLE public.categories 
ADD COLUMN display_order integer DEFAULT 0;

-- Update existing categories with sequential order based on created_at
WITH ordered AS (
  SELECT id, ROW_NUMBER() OVER (ORDER BY created_at) as rn
  FROM public.categories
)
UPDATE public.categories c
SET display_order = o.rn
FROM ordered o
WHERE c.id = o.id;