-- Criar tabela de fontes de conteúdo
CREATE TABLE public.content_sources (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  url TEXT NOT NULL,
  scrape_url TEXT NOT NULL,
  category_id UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_active BOOLEAN DEFAULT true,
  scrape_frequency_hours INTEGER DEFAULT 24,
  last_scraped_at TIMESTAMP WITH TIME ZONE,
  articles_imported INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Criar tabela de artigos importados (para rastrear duplicados)
CREATE TABLE public.imported_articles (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  source_id UUID NOT NULL REFERENCES public.content_sources(id) ON DELETE CASCADE,
  original_url TEXT NOT NULL,
  original_title TEXT NOT NULL,
  article_id UUID REFERENCES public.articles(id) ON DELETE SET NULL,
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'imported', 'rejected')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(source_id, original_url)
);

-- Adicionar coluna source_id à tabela articles para identificar artigos importados
ALTER TABLE public.articles ADD COLUMN source_id UUID REFERENCES public.content_sources(id) ON DELETE SET NULL;

-- Habilitar RLS
ALTER TABLE public.content_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.imported_articles ENABLE ROW LEVEL SECURITY;

-- Políticas para content_sources
CREATE POLICY "Admins podem gerir fontes" ON public.content_sources
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Fontes públicas para leitura" ON public.content_sources
  FOR SELECT USING (true);

-- Políticas para imported_articles
CREATE POLICY "Admins podem gerir artigos importados" ON public.imported_articles
  FOR ALL USING (is_admin()) WITH CHECK (is_admin());

CREATE POLICY "Artigos importados visíveis para admins" ON public.imported_articles
  FOR SELECT USING (is_admin());

-- Trigger para atualizar updated_at
CREATE TRIGGER update_content_sources_updated_at
  BEFORE UPDATE ON public.content_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at();

-- Índices para performance
CREATE INDEX idx_content_sources_active ON public.content_sources(is_active);
CREATE INDEX idx_imported_articles_source ON public.imported_articles(source_id);
CREATE INDEX idx_imported_articles_url ON public.imported_articles(original_url);
CREATE INDEX idx_articles_source ON public.articles(source_id);