-- Create functions to increment ad stats
CREATE OR REPLACE FUNCTION public.increment_ad_impressions(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements
  SET impressions = COALESCE(impressions, 0) + 1
  WHERE id = ad_id;
END;
$$;

CREATE OR REPLACE FUNCTION public.increment_ad_clicks(ad_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.advertisements
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE id = ad_id;
END;
$$;