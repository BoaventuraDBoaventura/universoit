import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, MessageSquare } from "lucide-react";
import { z } from "zod";

const commentSchema = z.object({
  author_name: z.string().trim().min(2, "Nome deve ter pelo menos 2 caracteres").max(100),
  author_email: z.string().trim().email("Email inválido").max(255),
  content: z.string().trim().min(10, "Comentário deve ter pelo menos 10 caracteres").max(2000),
});

interface CommentFormProps {
  articleId: string;
  parentId?: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

export function CommentForm({ articleId, parentId, onSuccess, onCancel }: CommentFormProps) {
  const [formData, setFormData] = useState({
    author_name: "",
    author_email: "",
    content: "",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});

    // Validate
    const result = commentSchema.safeParse(formData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) {
          fieldErrors[err.path[0] as string] = err.message;
        }
      });
      setErrors(fieldErrors);
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.from("comments").insert({
        article_id: articleId,
        parent_id: parentId || null,
        author_name: result.data.author_name,
        author_email: result.data.author_email,
        content: result.data.content,
        status: "pending",
      });

      if (error) throw error;

      toast({
        title: "Comentário enviado!",
        description: "O seu comentário será publicado após moderação.",
      });

      setFormData({ author_name: "", author_email: "", content: "" });
      onSuccess?.();
    } catch (error) {
      console.error("Error submitting comment:", error);
      toast({
        title: "Erro ao enviar comentário",
        description: "Por favor tente novamente.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="author_name">Nome *</Label>
          <Input
            id="author_name"
            value={formData.author_name}
            onChange={(e) => setFormData((prev) => ({ ...prev, author_name: e.target.value }))}
            placeholder="O seu nome"
            disabled={loading}
          />
          {errors.author_name && (
            <p className="text-xs text-destructive">{errors.author_name}</p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="author_email">Email *</Label>
          <Input
            id="author_email"
            type="email"
            value={formData.author_email}
            onChange={(e) => setFormData((prev) => ({ ...prev, author_email: e.target.value }))}
            placeholder="seu@email.com"
            disabled={loading}
          />
          {errors.author_email && (
            <p className="text-xs text-destructive">{errors.author_email}</p>
          )}
        </div>
      </div>
      <div className="space-y-2">
        <Label htmlFor="content">Comentário *</Label>
        <Textarea
          id="content"
          value={formData.content}
          onChange={(e) => setFormData((prev) => ({ ...prev, content: e.target.value }))}
          placeholder={parentId ? "Escreva a sua resposta..." : "Escreva o seu comentário..."}
          rows={4}
          disabled={loading}
        />
        {errors.content && (
          <p className="text-xs text-destructive">{errors.content}</p>
        )}
      </div>
      <div className="flex gap-2">
        <Button type="submit" disabled={loading}>
          {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          <MessageSquare className="mr-2 h-4 w-4" />
          {parentId ? "Responder" : "Enviar Comentário"}
        </Button>
        {onCancel && (
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
        )}
      </div>
      <p className="text-xs text-muted-foreground">
        * Os comentários são moderados antes de serem publicados. O seu email não será publicado.
      </p>
    </form>
  );
}