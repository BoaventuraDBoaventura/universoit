-- Adicionar coluna para configurar a frequência do popup (em horas)
ALTER TABLE public.advertisements
ADD COLUMN popup_frequency_hours integer DEFAULT 24;

-- Adicionar comentário explicativo
COMMENT ON COLUMN public.advertisements.popup_frequency_hours IS 'Intervalo em horas entre exibições do popup para o mesmo utilizador';