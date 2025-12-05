-- =============================================
-- FASE 1: BASE DE DADOS - PORTAL NOTÍCIAS TECH
-- =============================================

-- 1. Criar enum para roles
CREATE TYPE public.app_role AS ENUM ('admin', 'editor', 'user');

-- 2. Criar enum para status de artigos
CREATE TYPE public.article_status AS ENUM ('draft', 'published', 'scheduled', 'archived');

-- 3. Criar enum para posição de anúncios
CREATE TYPE public.ad_position AS ENUM ('header', 'sidebar', 'footer', 'in_article', 'popup');

-- 4. Criar enum para tipo de anúncio
CREATE TYPE public.ad_type AS ENUM ('banner', 'sponsored', 'popup');

-- =============================================
-- TABELAS
-- =============================================

-- 5. Tabela de perfis
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. Tabela de roles (separada para segurança)
CREATE TABLE public.user_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

-- 7. Tabela de categorias
CREATE TABLE public.categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#3B82F6',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 8. Tabela de tags
CREATE TABLE public.tags (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  slug TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 9. Tabela de artigos
CREATE TABLE public.articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  excerpt TEXT,
  content TEXT,
  featured_image TEXT,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  author_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status article_status NOT NULL DEFAULT 'draft',
  is_featured BOOLEAN DEFAULT false,
  is_sponsored BOOLEAN DEFAULT false,
  view_count INTEGER DEFAULT 0,
  published_at TIMESTAMPTZ,
  scheduled_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 10. Tabela de relação artigos-tags
CREATE TABLE public.article_tags (
  article_id UUID REFERENCES public.articles(id) ON DELETE CASCADE,
  tag_id UUID REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, tag_id)
);

-- 11. Tabela de anúncios
CREATE TABLE public.advertisements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  ad_type ad_type NOT NULL DEFAULT 'banner',
  position ad_position NOT NULL DEFAULT 'sidebar',
  is_active BOOLEAN DEFAULT true,
  start_date TIMESTAMPTZ,
  end_date TIMESTAMPTZ,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 12. Tabela de subscritores newsletter
CREATE TABLE public.newsletter_subscribers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  is_active BOOLEAN DEFAULT true,
  subscribed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  unsubscribed_at TIMESTAMPTZ
);

-- =============================================
-- FUNÇÕES DE SEGURANÇA
-- =============================================

-- 13. Função para verificar role (SECURITY DEFINER para evitar recursão)
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- 14. Função helper para verificar admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- 15. Função helper para verificar editor ou admin
CREATE OR REPLACE FUNCTION public.is_editor_or_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'editor')
$$;

-- 16. Função para criar perfil automaticamente
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1))
  );
  
  -- Dar role 'user' por defeito
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user');
  
  RETURN NEW;
END;
$$;

-- 17. Trigger para criar perfil no signup
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 18. Função para atualizar updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Triggers para updated_at
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_categories_updated_at BEFORE UPDATE ON public.categories FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_articles_updated_at BEFORE UPDATE ON public.articles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();
CREATE TRIGGER update_advertisements_updated_at BEFORE UPDATE ON public.advertisements FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();

-- =============================================
-- ROW LEVEL SECURITY
-- =============================================

-- Ativar RLS em todas as tabelas
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.articles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.article_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.newsletter_subscribers ENABLE ROW LEVEL SECURITY;

-- PROFILES
CREATE POLICY "Perfis públicos para leitura" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "Utilizadores podem editar próprio perfil" ON public.profiles FOR UPDATE USING (auth.uid() = id);

-- USER_ROLES
CREATE POLICY "Admins podem ver todos os roles" ON public.user_roles FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Utilizadores podem ver próprios roles" ON public.user_roles FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "Admins podem gerir roles" ON public.user_roles FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- CATEGORIES
CREATE POLICY "Categorias públicas para leitura" ON public.categories FOR SELECT USING (true);
CREATE POLICY "Admins podem gerir categorias" ON public.categories FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- TAGS
CREATE POLICY "Tags públicas para leitura" ON public.tags FOR SELECT USING (true);
CREATE POLICY "Editores podem gerir tags" ON public.tags FOR ALL TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

-- ARTICLES
CREATE POLICY "Artigos publicados são públicos" ON public.articles FOR SELECT USING (status = 'published' OR (auth.uid() IS NOT NULL AND public.is_editor_or_admin()));
CREATE POLICY "Editores podem criar artigos" ON public.articles FOR INSERT TO authenticated WITH CHECK (public.is_editor_or_admin());
CREATE POLICY "Editores podem editar artigos" ON public.articles FOR UPDATE TO authenticated USING (public.is_editor_or_admin());
CREATE POLICY "Admins podem eliminar artigos" ON public.articles FOR DELETE TO authenticated USING (public.is_admin());

-- ARTICLE_TAGS
CREATE POLICY "Article tags públicas para leitura" ON public.article_tags FOR SELECT USING (true);
CREATE POLICY "Editores podem gerir article tags" ON public.article_tags FOR ALL TO authenticated USING (public.is_editor_or_admin()) WITH CHECK (public.is_editor_or_admin());

-- ADVERTISEMENTS
CREATE POLICY "Anúncios ativos são públicos" ON public.advertisements FOR SELECT USING (is_active = true OR (auth.uid() IS NOT NULL AND public.is_admin()));
CREATE POLICY "Admins podem gerir anúncios" ON public.advertisements FOR ALL TO authenticated USING (public.is_admin()) WITH CHECK (public.is_admin());

-- NEWSLETTER_SUBSCRIBERS
CREATE POLICY "Admins podem ver subscritores" ON public.newsletter_subscribers FOR SELECT TO authenticated USING (public.is_admin());
CREATE POLICY "Qualquer pessoa pode subscrever" ON public.newsletter_subscribers FOR INSERT WITH CHECK (true);
CREATE POLICY "Admins podem gerir subscritores" ON public.newsletter_subscribers FOR UPDATE TO authenticated USING (public.is_admin());
CREATE POLICY "Admins podem eliminar subscritores" ON public.newsletter_subscribers FOR DELETE TO authenticated USING (public.is_admin());

-- =============================================
-- DADOS INICIAIS
-- =============================================

-- Categorias iniciais
INSERT INTO public.categories (name, slug, description, icon, color) VALUES
  ('Inteligência Artificial', 'inteligencia-artificial', 'Novidades sobre IA e Machine Learning', 'Brain', '#8B5CF6'),
  ('Smartphones', 'smartphones', 'Reviews e lançamentos de smartphones', 'Smartphone', '#3B82F6'),
  ('Gaming', 'gaming', 'Notícias do mundo dos videojogos', 'Gamepad2', '#EF4444'),
  ('Software', 'software', 'Apps e programas', 'Code', '#10B981'),
  ('Hardware', 'hardware', 'Componentes e gadgets', 'Cpu', '#F59E0B'),
  ('Ciência', 'ciencia', 'Descobertas e avanços científicos', 'Atom', '#06B6D4');

-- Tags iniciais
INSERT INTO public.tags (name, slug) VALUES
  ('Apple', 'apple'),
  ('Google', 'google'),
  ('Microsoft', 'microsoft'),
  ('Android', 'android'),
  ('iOS', 'ios'),
  ('ChatGPT', 'chatgpt'),
  ('Review', 'review'),
  ('Tutorial', 'tutorial'),
  ('Lançamento', 'lancamento'),
  ('Análise', 'analise');