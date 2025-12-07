import { useState } from "react";
import { PublicLayout } from "@/components/public/PublicLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Mail, MapPin, Phone, Send } from "lucide-react";
import { z } from "zod";

const contactSchema = z.object({
  name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100, "Nome deve ter no máximo 100 caracteres"),
  email: z.string().trim().email("Email inválido").max(255, "Email deve ter no máximo 255 caracteres"),
  subject: z.string().trim().min(5, "Assunto deve ter pelo menos 5 caracteres").max(200, "Assunto deve ter no máximo 200 caracteres"),
  message: z.string().trim().min(10, "Mensagem deve ter pelo menos 10 caracteres").max(2000, "Mensagem deve ter no máximo 2000 caracteres"),
});

type ContactFormData = z.infer<typeof contactSchema>;

export default function Contact() {
  const [formData, setFormData] = useState<ContactFormData>({
    name: "",
    email: "",
    subject: "",
    message: "",
  });
  const [errors, setErrors] = useState<Partial<Record<keyof ContactFormData, string>>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user starts typing
    if (errors[name as keyof ContactFormData]) {
      setErrors((prev) => ({ ...prev, [name]: undefined }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate form data
    const result = contactSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Partial<Record<keyof ContactFormData, string>> = {};
      result.error.errors.forEach((err) => {
        const field = err.path[0] as keyof ContactFormData;
        fieldErrors[field] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);
    
    const { error } = await supabase
      .from("contact_messages")
      .insert({
        name: result.data.name,
        email: result.data.email,
        subject: result.data.subject,
        message: result.data.message,
      });

    if (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar a mensagem. Tente novamente.",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Mensagem enviada!",
        description: "Obrigado pelo seu contacto. Responderemos em breve.",
      });
      setFormData({ name: "", email: "", subject: "", message: "" });
    }
    
    setLoading(false);
  };

  return (
    <PublicLayout>
      <div className="container py-8 md:py-12">
        <div className="mx-auto max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="font-display text-3xl font-bold md:text-4xl">Contacto</h1>
            <p className="mt-2 text-muted-foreground">
              Tem alguma questão ou sugestão? Entre em contacto connosco.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-3">
            {/* Contact Info */}
            <div className="space-y-6 md:col-span-1">
              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-4 font-display font-semibold">Informações</h2>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Mail className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Email</p>
                      <p className="text-sm text-muted-foreground">contacto@universoit.tech</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Phone className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Telefone</p>
                      <p className="text-sm text-muted-foreground">+258 84 600 4801</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="mt-0.5 h-5 w-5 text-primary" />
                    <div>
                      <p className="font-medium">Localização</p>
                      <p className="text-sm text-muted-foreground">Moçambique</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-lg border bg-card p-6">
                <h2 className="mb-2 font-display font-semibold">Horário de Resposta</h2>
                <p className="text-sm text-muted-foreground">
                  Respondemos normalmente dentro de 24-48 horas úteis.
                </p>
              </div>
            </div>

            {/* Contact Form */}
            <div className="rounded-lg border bg-card p-6 md:col-span-2">
              <h2 className="mb-4 font-display font-semibold">Envie-nos uma mensagem</h2>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="name">Nome *</Label>
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="O seu nome"
                      required
                    />
                    {errors.name && (
                      <p className="text-sm text-destructive">{errors.name}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email *</Label>
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      required
                    />
                    {errors.email && (
                      <p className="text-sm text-destructive">{errors.email}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="subject">Assunto *</Label>
                  <Input
                    id="subject"
                    name="subject"
                    value={formData.subject}
                    onChange={handleChange}
                    placeholder="Assunto da mensagem"
                    required
                  />
                  {errors.subject && (
                    <p className="text-sm text-destructive">{errors.subject}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="message">Mensagem *</Label>
                  <Textarea
                    id="message"
                    name="message"
                    value={formData.message}
                    onChange={handleChange}
                    placeholder="Escreva a sua mensagem aqui..."
                    rows={6}
                    required
                  />
                  {errors.message && (
                    <p className="text-sm text-destructive">{errors.message}</p>
                  )}
                </div>

                <Button type="submit" disabled={loading} className="w-full sm:w-auto">
                  {loading ? (
                    "A enviar..."
                  ) : (
                    <>
                      <Send className="mr-2 h-4 w-4" />
                      Enviar Mensagem
                    </>
                  )}
                </Button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
