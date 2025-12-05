import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { cn } from "@/lib/utils";

type AdPosition = Database["public"]["Enums"]["ad_position"];

interface AdBannerProps {
  position: AdPosition;
  className?: string;
}

interface Advertisement {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  position: AdPosition;
}

export function AdBanner({ position, className }: AdBannerProps) {
  const { data: ad } = useQuery({
    queryKey: ["active-ad", position],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, title, image_url, link_url, position")
        .eq("position", position)
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Advertisement | null;
    },
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  const trackImpression = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc("increment_ad_impressions", { ad_id: adId });
    },
  });

  const trackClick = useMutation({
    mutationFn: async (adId: string) => {
      await supabase.rpc("increment_ad_clicks", { ad_id: adId });
    },
  });

  // Track impression when ad loads
  // Note: In production, you'd want to use IntersectionObserver for viewability
  
  if (!ad || !ad.image_url) {
    return null;
  }

  const handleClick = () => {
    trackClick.mutate(ad.id);
  };

  const content = (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <img
        src={ad.image_url}
        alt={ad.title}
        className="w-full h-auto object-cover"
      />
      <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Anúncio
      </span>
    </div>
  );

  if (ad.link_url) {
    return (
      <a
        href={ad.link_url}
        target="_blank"
        rel="noopener noreferrer sponsored"
        onClick={handleClick}
        className="block transition-opacity hover:opacity-90"
      >
        {content}
      </a>
    );
  }

  return content;
}
