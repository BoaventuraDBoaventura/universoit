import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, CheckCircle, XCircle } from "lucide-react";

export default function Unsubscribe() {
  const [searchParams] = useSearchParams();
  const email = searchParams.get("email");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");

  useEffect(() => {
    const unsubscribe = async () => {
      if (!email) {
        setStatus("error");
        return;
      }

      const { error } = await supabase
        .from("newsletter_subscribers")
        .update({
          is_active: false,
          unsubscribed_at: new Date().toISOString(),
        })
        .eq("email", email);

      if (error) {
        console.error("Error unsubscribing:", error);
        setStatus("error");
      } else {
        setStatus("success");
      }
    };

    unsubscribe();
  }, [email]);

  return (
    <PublicLayout>
      <div className="container mx-auto px-4 py-16">
        <div className="flex justify-center">
          <Card className="max-w-md w-full">
            <CardContent className="pt-8 pb-8 text-center">
              {status === "loading" && (
                <>
                  <Loader2 className="h-12 w-12 animate-spin text-primary mx-auto mb-4" />
                  <h1 className="text-xl font-semibold mb-2">A processar...</h1>
                  <p className="text-muted-foreground">Por favor aguarde.</p>
                </>
              )}

              {status === "success" && (
                <>
                  <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h1 className="text-xl font-semibold mb-2">Subscrição Cancelada</h1>
                  <p className="text-muted-foreground mb-6">
                    O seu email foi removido da nossa newsletter. Não receberá mais
                    notificações de novos artigos.
                  </p>
                  <Button asChild>
                    <Link to="/">Voltar ao Universo IT</Link>
                  </Button>
                </>
              )}

              {status === "error" && (
                <>
                  <XCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
                  <h1 className="text-xl font-semibold mb-2">Erro</h1>
                  <p className="text-muted-foreground mb-6">
                    Não foi possível cancelar a subscrição. Por favor tente novamente
                    mais tarde ou contacte-nos.
                  </p>
                  <Button asChild>
                    <Link to="/">Voltar ao Universo IT</Link>
                  </Button>
                </>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PublicLayout>
  );
}
