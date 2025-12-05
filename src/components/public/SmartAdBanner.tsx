import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { AdBanner } from "./AdBanner";
import { GoogleAd } from "./GoogleAd";

type AdPosition = Database["public"]["Enums"]["ad_position"];

interface SmartAdBannerProps {
  position: Exclude<AdPosition, "popup">;
  className?: string;
  googleAdSlot?: string;
}

export function SmartAdBanner({ position, className, googleAdSlot }: SmartAdBannerProps) {
  const { data: hasCustomAd, isLoading } = useQuery({
    queryKey: ["has-custom-ad", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, image_url")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .limit(1)
        .maybeSingle();
      
      if (error) throw error;
      return data && data.image_url ? true : false;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Show nothing while loading to prevent layout shift
  if (isLoading) {
    return null;
  }

  // If there's a custom ad with image, show AdBanner
  if (hasCustomAd) {
    return <AdBanner position={position} className={className} />;
  }

  // Otherwise, show Google AdSense
  return <GoogleAd position={position} className={className} slot={googleAdSlot} />;
}
