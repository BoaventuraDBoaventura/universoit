import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Link } from "react-router-dom";
import { ArrowLeft, Loader2, Lock } from "lucide-react";
import logo from "@/assets/universo-it-logo.png";

export default function ResetPassword() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const { updatePassword, session } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    // Check if user came from a password reset link
    if (!session) {
      // Wait a bit for the session to be established from the URL token
      const timeout = setTimeout(() => {
        if (!session) {
          toast({
            title: "Link inválido",
            description: "Este link de recuperação é inválido ou expirou.",
            variant: "destructive",
          });
          navigate("/auth");
        }
      }, 2000);
      return () => clearTimeout(timeout);
    }
  }, [session, navigate, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (password.length < 6) {
      toast({
        title: "Password muito curta",
        description: "A password deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (password !== confirmPassword) {
      toast({
        title: "Passwords não coincidem",
        description: "As passwords introduzidas não são iguais.",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { error } = await updatePassword(password);

    if (error) {
      toast({
        title: "Erro ao redefinir password",
        description: error.message,
        variant: "destructive",
      });
    } else {
      navigate("/password-atualizada");
    }

    setLoading(false);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" />
            Voltar ao início
          </Link>
        </div>

        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={logo} alt="Universo IT" className="h-16 w-auto" />
            </div>
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <Lock className="h-6 w-6 text-primary" />
            </div>
            <CardDescription className="text-base">
              Introduz a tua nova password
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="password">Nova Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                />
                <p className="text-xs text-muted-foreground">
                  Mínimo 6 caracteres
                </p>
              </div>
              <div className="space-y-2">
                <Label htmlFor="confirm-password">Confirmar Password</Label>
                <Input
                  id="confirm-password"
                  type="password"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  minLength={6}
                />
              </div>
              <Button type="submit" className="w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Redefinir Password
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}