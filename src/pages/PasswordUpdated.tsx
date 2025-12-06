import { Link } from "react-router-dom";
import { Card, CardContent, CardDescription, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";
import logo from "@/assets/universo-it-logo.png";

export default function PasswordUpdated() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-secondary/30 p-4">
      <div className="w-full max-w-md">
        <Card>
          <CardHeader className="text-center">
            <div className="mx-auto mb-4">
              <img src={logo} alt="Universo IT" className="h-16 w-auto" />
            </div>
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <CheckCircle2 className="h-10 w-10 text-green-600 dark:text-green-400" />
            </div>
            <CardDescription className="text-lg font-medium text-foreground">
              Password atualizada com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-6">
            <p className="text-muted-foreground">
              A tua password foi redefinida. Agora podes entrar na tua conta com a nova password.
            </p>
            <div className="flex flex-col gap-3">
              <Button asChild className="w-full">
                <Link to="/auth">Ir para Login</Link>
              </Button>
              <Button variant="outline" asChild className="w-full">
                <Link to="/">Voltar ao Início</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}