-- Enum para estado dos comentários
CREATE TYPE public.comment_status AS ENUM ('pending', 'approved', 'rejected');

-- Tabela de comentários
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES public.comments(id) ON DELETE CASCADE,
  author_name TEXT NOT NULL,
  author_email TEXT NOT NULL,
  content TEXT NOT NULL,
  status comment_status NOT NULL DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index para performance
CREATE INDEX idx_comments_article_id ON public.comments(article_id);
CREATE INDEX idx_comments_parent_id ON public.comments(parent_id);
CREATE INDEX idx_comments_status ON public.comments(status);

-- Trigger para updated_at
CREATE TRIGGER update_comments_updated_at 
  BEFORE UPDATE ON public.comments 
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- Ativar RLS
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;

-- Política: Qualquer pessoa pode ver comentários aprovados
CREATE POLICY "Comentários aprovados são públicos"
ON public.comments FOR SELECT
USING (status = 'approved' OR (auth.uid() IS NOT NULL AND public.is_editor_or_admin()));

-- Política: Qualquer pessoa pode criar comentários (ficam pendentes)
CREATE POLICY "Qualquer pessoa pode comentar"
ON public.comments FOR INSERT
WITH CHECK (true);

-- Política: Admins/editores podem moderar (atualizar status)
CREATE POLICY "Editores podem moderar comentários"
ON public.comments FOR UPDATE
TO authenticated
USING (public.is_editor_or_admin());

-- Política: Admins podem eliminar comentários
CREATE POLICY "Admins podem eliminar comentários"
ON public.comments FOR DELETE
TO authenticated
USING (public.is_admin());