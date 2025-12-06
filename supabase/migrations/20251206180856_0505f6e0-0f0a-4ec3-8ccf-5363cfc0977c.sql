-- Permitir source_id nulo na tabela imported_articles
ALTER TABLE public.imported_articles 
ALTER COLUMN source_id DROP NOT NULL;