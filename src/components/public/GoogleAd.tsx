import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import { Database } from "@/integrations/supabase/types";

type AdPosition = Database["public"]["Enums"]["ad_position"];

interface GoogleAdProps {
  position: AdPosition;
  className?: string;
  slot?: string;
}

declare global {
  interface Window {
    adsbygoogle: unknown[];
  }
}

const AD_CONFIG: Record<AdPosition, { format: string; style: React.CSSProperties }> = {
  header: {
    format: "horizontal",
    style: { display: "block", width: "100%", height: "90px" },
  },
  sidebar: {
    format: "rectangle",
    style: { display: "inline-block", width: "300px", height: "250px" },
  },
  footer: {
    format: "horizontal",
    style: { display: "block", width: "100%", height: "90px" },
  },
  in_article: {
    format: "fluid",
    style: { display: "block", textAlign: "center" as const },
  },
  popup: {
    format: "rectangle",
    style: { display: "inline-block", width: "300px", height: "250px" },
  },
};

export function GoogleAd({ position, className, slot }: GoogleAdProps) {
  const adRef = useRef<HTMLModElement>(null);
  const isLoaded = useRef(false);

  useEffect(() => {
    if (adRef.current && !isLoaded.current) {
      try {
        (window.adsbygoogle = window.adsbygoogle || []).push({});
        isLoaded.current = true;
      } catch (error) {
        console.error("AdSense error:", error);
      }
    }
  }, []);

  const config = AD_CONFIG[position] || AD_CONFIG.sidebar;

  return (
    <div className={cn("relative overflow-hidden rounded-lg", className)}>
      <ins
        ref={adRef}
        className="adsbygoogle"
        style={config.style}
        data-ad-client="ca-pub-6473415273056607"
        data-ad-slot={slot || "auto"}
        data-ad-format={config.format}
        data-full-width-responsive="true"
      />
      <span className="absolute bottom-1 right-1 rounded bg-background/80 px-1.5 py-0.5 text-[10px] text-muted-foreground">
        Anúncio
      </span>
    </div>
  );
}
