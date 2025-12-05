import { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface Advertisement {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  popup_frequency_hours: number | null;
}

// Configurações
const POPUP_STORAGE_KEY = "popup_ad_last_shown";
const POPUP_DELAY_MS = 5000; // Atraso de 5 segundos antes de mostrar
const DEFAULT_FREQUENCY_HOURS = 24;

export function PopupAd() {
  const [isVisible, setIsVisible] = useState(false);
  const [isClosing, setIsClosing] = useState(false);

  // Buscar anúncio popup ativo
  const { data: ad } = useQuery({
    queryKey: ["popup-ad"],
    queryFn: async () => {
      const now = new Date().toISOString();
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, title, image_url, link_url, popup_frequency_hours")
        .eq("position", "popup")
        .eq("is_active", true)
        .or(`start_date.is.null,start_date.lte.${now}`)
        .or(`end_date.is.null,end_date.gte.${now}`)
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data as Advertisement | null;
    },
    staleTime: 1000 * 60 * 5,
  });

  // Verificar se deve mostrar baseado na frequência configurada
  const shouldShowPopup = useCallback(() => {
    if (!ad) return false;
    
    const frequencyHours = ad.popup_frequency_hours ?? DEFAULT_FREQUENCY_HOURS;
    const lastShown = localStorage.getItem(POPUP_STORAGE_KEY);
    
    if (lastShown) {
      const lastShownDate = new Date(lastShown);
      const hoursSinceLastShown = (Date.now() - lastShownDate.getTime()) / (1000 * 60 * 60);
      
      if (hoursSinceLastShown < frequencyHours) {
        return false;
      }
    }
    
    return true;
  }, [ad]);

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

  // Mostrar popup com atraso
  useEffect(() => {
    if (!ad || !ad.image_url) return;
    if (!shouldShowPopup()) return;

    const timer = setTimeout(() => {
      setIsVisible(true);
      localStorage.setItem(POPUP_STORAGE_KEY, new Date().toISOString());
      trackImpression.mutate(ad.id);
    }, POPUP_DELAY_MS);

    return () => clearTimeout(timer);
  }, [ad, shouldShowPopup]);

  const handleClose = useCallback(() => {
    setIsClosing(true);
    setTimeout(() => {
      setIsVisible(false);
      setIsClosing(false);
    }, 300);
  }, []);

  const handleClick = () => {
    if (ad) {
      trackClick.mutate(ad.id);
    }
  };

  // Fechar com tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isVisible) {
        handleClose();
      }
    };

    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isVisible, handleClose]);

  if (!isVisible || !ad || !ad.image_url) {
    return null;
  }

  return (
    <div
      className={cn(
        "fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300",
        isClosing ? "opacity-0" : "opacity-100"
      )}
    >
      {/* Backdrop */}
      <div
        className={cn(
          "absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300",
          isClosing ? "opacity-0" : "opacity-100"
        )}
        onClick={handleClose}
      />

      {/* Popup Content */}
      <div
        className={cn(
          "relative max-w-lg w-full transform transition-all duration-300",
          isClosing ? "scale-95 opacity-0" : "scale-100 opacity-100"
        )}
      >
        {/* Close Button */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-background border border-border shadow-lg transition-colors hover:bg-secondary"
          aria-label="Fechar anúncio"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Ad Content */}
        <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
          {ad.link_url ? (
            <a
              href={ad.link_url}
              target="_blank"
              rel="noopener noreferrer sponsored"
              onClick={handleClick}
              className="block transition-opacity hover:opacity-95"
            >
              <img
                src={ad.image_url}
                alt={ad.title}
                className="w-full h-auto"
              />
            </a>
          ) : (
            <img
              src={ad.image_url}
              alt={ad.title}
              className="w-full h-auto"
            />
          )}
          
          {/* Ad Label */}
          <div className="flex items-center justify-between px-4 py-2 bg-muted/50">
            <span className="text-xs text-muted-foreground">Anúncio</span>
            <button
              onClick={handleClose}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            >
              Fechar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
