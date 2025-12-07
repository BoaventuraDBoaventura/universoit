import { Link } from "react-router-dom";
import { Mail } from "lucide-react";
import universoItLogo from "@/assets/universo-it-logo.png";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { SmartAdBanner } from "./SmartAdBanner";
import { useCategories } from "@/hooks/useArticles";

export function Footer() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { data: categories } = useCategories();

  const handleNewsletter = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    const { error } = await supabase
      .from("newsletter_subscribers")
      .insert({ email });

    if (error) {
      if (error.code === "23505") {
        toast({
          title: "Já subscrito",
          description: "Este email já está registado na newsletter.",
        });
      } else {
        toast({
          title: "Erro",
          description: "Não foi possível subscrever. Tente novamente.",
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: "Subscrito com sucesso!",
        description: "Obrigado por subscrever a nossa newsletter.",
      });
      setEmail("");
    }
    setLoading(false);
  };

  return (
    <footer className="border-t border-border bg-secondary/50">
      {/* Banner de anúncio no rodapé */}
      <div className="container py-4">
        <SmartAdBanner position="footer" className="mx-auto max-w-4xl" />
      </div>
      
      <div className="container py-12">
        <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="space-y-4">
            <Link to="/" className="flex items-center">
              <img 
                src={universoItLogo} 
                alt="Universo IT" 
                width={160}
                height={25}
                className="h-8 w-auto sm:h-10"
              />
            </Link>
            <p className="text-sm text-muted-foreground">
              O seu portal de notícias sobre tecnologia, inovação e o futuro digital.
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="mb-4 font-display font-semibold">Categorias</h3>
            <nav className="flex flex-col gap-2">
              {categories?.slice(0, 6).map((category) => (
                <Link 
                  key={category.id}
                  to={`/categoria/${category.slug}`} 
                  className="text-sm text-muted-foreground hover:text-foreground"
                >
                  {category.name}
                </Link>
              ))}
            </nav>
          </div>

          {/* Info */}
          <div>
            <h3 className="mb-4 font-display font-semibold">Informações</h3>
            <nav className="flex flex-col gap-2">
              <Link to="/sobre" className="text-sm text-muted-foreground hover:text-foreground">
                Sobre Nós
              </Link>
              <Link to="/contacto" className="text-sm text-muted-foreground hover:text-foreground">
                Contacto
              </Link>
              <Link to="/politica-de-privacidade" className="text-sm text-muted-foreground hover:text-foreground">
                Política de Privacidade
              </Link>
              <Link to="/termos-de-uso" className="text-sm text-muted-foreground hover:text-foreground">
                Termos de Uso
              </Link>
            </nav>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="mb-4 font-display font-semibold">Newsletter</h3>
            <p className="mb-4 text-sm text-muted-foreground">
              Receba as últimas notícias no seu email.
            </p>
            <form onSubmit={handleNewsletter} className="flex gap-2">
              <div className="relative flex-1">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  type="email"
                  placeholder="seu@email.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-9"
                  required
                />
              </div>
              <Button type="submit" disabled={loading}>
                {loading ? "..." : "Subscrever"}
              </Button>
            </form>
          </div>
        </div>

        <div className="mt-8 border-t border-border pt-8 text-center text-sm text-muted-foreground">
          <p>© {new Date().getFullYear()} Universo IT. Todos os direitos reservados.</p>
        </div>
      </div>
    </footer>
  );
}
