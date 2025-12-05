import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

type ConsentStatus = "granted" | "denied" | null;

interface ConsentPreferences {
  analytics: boolean;
  advertising: boolean;
  personalization: boolean;
}

const CONSENT_KEY = "cookie_consent";
const PREFERENCES_KEY = "cookie_preferences";

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function updateGoogleConsent(preferences: ConsentPreferences) {
  // Update Google Consent Mode v2
  if (typeof window.gtag === "function") {
    window.gtag("consent", "update", {
      ad_storage: preferences.advertising ? "granted" : "denied",
      ad_user_data: preferences.advertising ? "granted" : "denied",
      ad_personalization: preferences.personalization ? "granted" : "denied",
      analytics_storage: preferences.analytics ? "granted" : "denied",
    });
  }
}

export function CookieConsent() {
  const [showBanner, setShowBanner] = useState(false);
  const [showManage, setShowManage] = useState(false);
  const [preferences, setPreferences] = useState<ConsentPreferences>({
    analytics: true,
    advertising: true,
    personalization: true,
  });

  useEffect(() => {
    // Initialize Google Consent Mode with default denied state
    window.dataLayer = window.dataLayer || [];
    window.gtag = function gtag() {
      window.dataLayer?.push(arguments);
    };
    window.gtag("consent", "default", {
      ad_storage: "denied",
      ad_user_data: "denied",
      ad_personalization: "denied",
      analytics_storage: "denied",
      wait_for_update: 500,
    });

    // Check if user has already given consent
    const savedConsent = localStorage.getItem(CONSENT_KEY);
    const savedPreferences = localStorage.getItem(PREFERENCES_KEY);

    if (savedConsent === null) {
      // Show banner after a short delay
      const timer = setTimeout(() => setShowBanner(true), 1000);
      return () => clearTimeout(timer);
    } else if (savedConsent === "granted" && savedPreferences) {
      // Apply saved preferences
      const prefs = JSON.parse(savedPreferences) as ConsentPreferences;
      setPreferences(prefs);
      updateGoogleConsent(prefs);
    }
  }, []);

  const handleAcceptAll = () => {
    const allGranted: ConsentPreferences = {
      analytics: true,
      advertising: true,
      personalization: true,
    };
    localStorage.setItem(CONSENT_KEY, "granted");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allGranted));
    setPreferences(allGranted);
    updateGoogleConsent(allGranted);
    setShowBanner(false);
    setShowManage(false);
  };

  const handleRejectAll = () => {
    const allDenied: ConsentPreferences = {
      analytics: false,
      advertising: false,
      personalization: false,
    };
    localStorage.setItem(CONSENT_KEY, "denied");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(allDenied));
    setPreferences(allDenied);
    updateGoogleConsent(allDenied);
    setShowBanner(false);
    setShowManage(false);
  };

  const handleSavePreferences = () => {
    const hasAnyConsent = preferences.analytics || preferences.advertising || preferences.personalization;
    localStorage.setItem(CONSENT_KEY, hasAnyConsent ? "granted" : "denied");
    localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
    updateGoogleConsent(preferences);
    setShowBanner(false);
    setShowManage(false);
  };

  const handleManageOptions = () => {
    setShowManage(true);
  };

  if (!showBanner && !showManage) return null;

  return (
    <>
      {/* Cookie Banner */}
      {showBanner && !showManage && (
        <div className="fixed bottom-0 left-0 right-0 z-[100] border-t bg-background p-4 shadow-lg md:p-6">
          <div className="container mx-auto max-w-4xl">
            <div className="flex flex-col gap-4">
              <div>
                <h3 className="text-lg font-semibold">Utilizamos cookies</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  Utilizamos cookies e tecnologias semelhantes para melhorar sua experiência, 
                  personalizar conteúdo e anúncios, e analisar nosso tráfego. Ao clicar em 
                  "Aceitar todos", você concorda com o uso de cookies conforme descrito em 
                  nossa política de privacidade.
                </p>
              </div>
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-end">
                <Button
                  variant="outline"
                  onClick={handleRejectAll}
                  className="w-full sm:w-auto"
                >
                  Recusar todos
                </Button>
                <Button
                  variant="outline"
                  onClick={handleManageOptions}
                  className="w-full sm:w-auto"
                >
                  Gerenciar opções
                </Button>
                <Button
                  onClick={handleAcceptAll}
                  className="w-full sm:w-auto"
                >
                  Aceitar todos
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Manage Preferences Dialog */}
      <Dialog open={showManage} onOpenChange={setShowManage}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Preferências de cookies</DialogTitle>
            <DialogDescription>
              Personalize suas preferências de cookies. Cookies essenciais são sempre 
              ativos pois são necessários para o funcionamento do site.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            {/* Essential Cookies - Always on */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cookies essenciais</Label>
                <p className="text-sm text-muted-foreground">
                  Necessários para o funcionamento do site
                </p>
              </div>
              <Switch checked disabled />
            </div>

            {/* Analytics */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cookies de análise</Label>
                <p className="text-sm text-muted-foreground">
                  Ajudam a entender como os visitantes usam o site
                </p>
              </div>
              <Switch
                checked={preferences.analytics}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, analytics: checked }))
                }
              />
            </div>

            {/* Advertising */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cookies de publicidade</Label>
                <p className="text-sm text-muted-foreground">
                  Usados para exibir anúncios relevantes
                </p>
              </div>
              <Switch
                checked={preferences.advertising}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, advertising: checked }))
                }
              />
            </div>

            {/* Personalization */}
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Cookies de personalização</Label>
                <p className="text-sm text-muted-foreground">
                  Permitem personalizar conteúdo e recursos
                </p>
              </div>
              <Switch
                checked={preferences.personalization}
                onCheckedChange={(checked) =>
                  setPreferences((prev) => ({ ...prev, personalization: checked }))
                }
              />
            </div>
          </div>

          <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleRejectAll}>
              Recusar todos
            </Button>
            <Button onClick={handleSavePreferences}>
              Salvar preferências
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
