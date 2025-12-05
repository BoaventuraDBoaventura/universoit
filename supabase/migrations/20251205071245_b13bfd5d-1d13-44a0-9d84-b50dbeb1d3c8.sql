-- Criar bucket para imagens de artigos
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'article-images',
  'article-images',
  true,
  5242880, -- 5MB
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
);

-- Política: Qualquer pessoa pode ver imagens (bucket público)
CREATE POLICY "Imagens de artigos são públicas"
ON storage.objects FOR SELECT
USING (bucket_id = 'article-images');

-- Política: Editores e admins podem fazer upload
CREATE POLICY "Editores podem fazer upload de imagens"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'article-images' 
  AND public.is_editor_or_admin()
);

-- Política: Editores e admins podem atualizar
CREATE POLICY "Editores podem atualizar imagens"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'article-images' 
  AND public.is_editor_or_admin()
);

-- Política: Admins podem eliminar
CREATE POLICY "Admins podem eliminar imagens"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'article-images' 
  AND public.is_admin()
);