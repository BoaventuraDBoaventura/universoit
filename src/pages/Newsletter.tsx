import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, CheckCircle } from "lucide-react";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email.trim()) {
      toast({
        title: "Erro",
        description: "Por favor, insira o seu email.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email: email.trim() });

      if (error) {
        if (error.code === "23505") {
          toast({
            title: "Email já subscrito",
            description: "Este email já está registado na nossa newsletter.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
      } else {
        setIsSubscribed(true);
        setEmail("");
        toast({
          title: "Subscrição confirmada!",
          description: "Obrigado por subscrever a nossa newsletter.",
        });
      }
    } catch (error) {
      console.error("Error subscribing:", error);
      toast({
        title: "Erro",
        description: "Ocorreu um erro ao processar a sua subscrição.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <PublicLayout>
      <Helmet>
        <title>Newsletter | Universo IT</title>
        <meta
          name="description"
          content="Subscreva a nossa newsletter e receba as últimas notícias de tecnologia diretamente no seu email."
        />
      </Helmet>

      <div className="container mx-auto px-4 py-16">
        <div className="mx-auto max-w-2xl text-center">
          <div className="mb-8 flex justify-center">
            <div className="rounded-full bg-primary/10 p-4">
              <Mail className="h-12 w-12 text-primary" />
            </div>
          </div>

          <h1 className="mb-4 font-display text-4xl font-bold">
            Subscreva a Nossa Newsletter
          </h1>
          
          <p className="mb-8 text-lg text-muted-foreground">
            Receba as últimas notícias sobre tecnologia, inovação e tendências 
            diretamente no seu email. Sem spam, apenas conteúdo relevante.
          </p>

          {isSubscribed ? (
            <div className="rounded-lg border border-green-200 bg-green-50 p-8 dark:border-green-800 dark:bg-green-900/20">
              <CheckCircle className="mx-auto mb-4 h-16 w-16 text-green-600 dark:text-green-400" />
              <h2 className="mb-2 text-2xl font-semibold text-green-800 dark:text-green-200">
                Subscrição Confirmada!
              </h2>
              <p className="text-green-700 dark:text-green-300">
                Obrigado por se juntar à nossa comunidade. Em breve receberá as 
                nossas novidades no seu email.
              </p>
              <Button
                variant="outline"
                className="mt-6"
                onClick={() => setIsSubscribed(false)}
              >
                Subscrever outro email
              </Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex flex-col gap-3 sm:flex-row">
                <Input
                  type="email"
                  placeholder="O seu email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="flex-1 h-12 text-base"
                  required
                />
                <Button 
                  type="submit" 
                  size="lg"
                  disabled={isLoading}
                  className="h-12 px-8"
                >
                  {isLoading ? "A subscrever..." : "Subscrever"}
                </Button>
              </div>
              <p className="text-sm text-muted-foreground">
                Ao subscrever, concorda com a nossa{" "}
                <a href="/privacidade" className="text-primary hover:underline">
                  Política de Privacidade
                </a>
                . Pode cancelar a subscrição a qualquer momento.
              </p>
            </form>
          )}

          <div className="mt-12 grid gap-6 sm:grid-cols-3">
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 font-semibold">Notícias Semanais</h3>
              <p className="text-sm text-muted-foreground">
                Resumo das principais notícias da semana no mundo tech.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 font-semibold">Conteúdo Exclusivo</h3>
              <p className="text-sm text-muted-foreground">
                Artigos e análises disponíveis apenas para subscritores.
              </p>
            </div>
            <div className="rounded-lg border border-border bg-card p-6">
              <h3 className="mb-2 font-semibold">Sem Spam</h3>
              <p className="text-sm text-muted-foreground">
                Respeitamos a sua caixa de entrada. Apenas conteúdo relevante.
              </p>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
