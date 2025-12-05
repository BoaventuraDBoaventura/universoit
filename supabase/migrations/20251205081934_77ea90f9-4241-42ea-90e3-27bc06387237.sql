-- Criar tabela para estatísticas diárias de anúncios
CREATE TABLE public.ad_statistics (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  ad_id uuid NOT NULL REFERENCES public.advertisements(id) ON DELETE CASCADE,
  date date NOT NULL DEFAULT CURRENT_DATE,
  impressions integer NOT NULL DEFAULT 0,
  clicks integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(ad_id, date)
);

-- Habilitar RLS
ALTER TABLE public.ad_statistics ENABLE ROW LEVEL SECURITY;

-- Políticas RLS
CREATE POLICY "Admins podem ver estatísticas" ON public.ad_statistics
  FOR SELECT USING (is_admin());

CREATE POLICY "Sistema pode inserir/atualizar estatísticas" ON public.ad_statistics
  FOR ALL USING (true) WITH CHECK (true);

-- Índices para performance
CREATE INDEX idx_ad_statistics_ad_id ON public.ad_statistics(ad_id);
CREATE INDEX idx_ad_statistics_date ON public.ad_statistics(date);

-- Atualizar função de incremento de impressões para também registar na tabela de estatísticas
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar contador total
  UPDATE public.advertisements
  SET impressions = COALESCE(impressions, 0) + 1
  WHERE id = ad_id;
  
  -- Registar na tabela de estatísticas diárias
  INSERT INTO public.ad_statistics (ad_id, date, impressions, clicks)
  VALUES (ad_id, CURRENT_DATE, 1, 0)
  ON CONFLICT (ad_id, date) 
  DO UPDATE SET impressions = ad_statistics.impressions + 1;
END;
$$;

-- Atualizar função de incremento de cliques para também registar na tabela de estatísticas
CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Incrementar contador total
  UPDATE public.advertisements
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = ad_id;
  
  -- Registar na tabela de estatísticas diárias
  INSERT INTO public.ad_statistics (ad_id, date, impressions, clicks)
  VALUES (ad_id, CURRENT_DATE, 0, 1)
  ON CONFLICT (ad_id, date) 
  DO UPDATE SET clicks = ad_statistics.clicks + 1;
END;
$$;