-- Add featured_image_caption column to articles table
ALTER TABLE public.articles 
ADD COLUMN featured_image_caption text;