import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2, ExternalLink, Check, AlertCircle, RefreshCw } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";
import { useNavigate } from "react-router-dom";

interface ImportedArticle {
  id: string;
  original_url: string;
  original_title: string;
  article_id: string | null;
  status: string;
  created_at: string;
}

export default function ContentSources() {
  const [articleUrl, setArticleUrl] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const { data: categories } = useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("id, name, color")
        .order("name");
      if (error) throw error;
      return data;
    },
  });

  const { data: importedArticles, isLoading } = useQuery({
    queryKey: ["imported-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("imported_articles")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as ImportedArticle[];
    },
  });

  const importMutation = useMutation({
    mutationFn: async ({ url, category_id, force_update }: { url: string; category_id?: string; force_update?: boolean }) => {
      const { data, error } = await supabase.functions.invoke("scrape-content", {
        body: { article_url: url, category_id: category_id || null, force_update },
      });
      if (error) throw error;
      if (data.error) throw new Error(data.error);
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["imported-articles"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({
        title: data.updated ? "Artigo atualizado com sucesso!" : "Artigo importado com sucesso!",
        description: data.updated 
          ? `"${data.article.title}" foi atualizado.`
          : `"${data.article.title}" foi criado como rascunho.`,
      });
      setArticleUrl("");
      // Navigate to the article editor
      if (data.article.id) {
        navigate(`/admin/artigos/${data.article.id}`);
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao importar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImport = (e: React.FormEvent, forceUpdate = false) => {
    e.preventDefault();
    if (!articleUrl.trim()) return;
    
    importMutation.mutate({ url: articleUrl.trim(), category_id: categoryId || undefined, force_update: forceUpdate });
  };

  const handleReimport = (url: string) => {
    importMutation.mutate({ url, force_update: true });
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Importar Artigo</h1>
          <p className="text-muted-foreground">
            Cole o link de um artigo para importar o conteúdo automaticamente
          </p>
        </div>

        {/* Import Form */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Importar de URL
            </CardTitle>
            <CardDescription>
              Cole o link de qualquer artigo online. O sistema irá extrair o título, resumo, conteúdo e imagens automaticamente.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleImport} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="article_url">URL do Artigo</Label>
                <Input
                  id="article_url"
                  type="url"
                  value={articleUrl}
                  onChange={(e) => setArticleUrl(e.target.value)}
                  placeholder="https://exemplo.com/artigo-interessante"
                  required
                  disabled={importMutation.isPending}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="category">Categoria</Label>
                <Select
                  value={categoryId}
                  onValueChange={setCategoryId}
                  disabled={importMutation.isPending}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione uma categoria (opcional)" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories?.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        <div className="flex items-center gap-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: cat.color }}
                          />
                          {cat.name}
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Button 
                type="submit" 
                disabled={importMutation.isPending || !articleUrl.trim()}
                className="w-full sm:w-auto"
              >
                {importMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Importando...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Importar Artigo
                  </>
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* Recent Imports */}
        <Card>
          <CardHeader>
            <CardTitle>Artigos Importados Recentemente</CardTitle>
            <CardDescription>
              Últimos 20 artigos importados através de URL
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Título</TableHead>
                  <TableHead>URL Original</TableHead>
                  <TableHead>Estado</TableHead>
                  <TableHead>Importado</TableHead>
                  <TableHead className="w-20">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto" />
                    </TableCell>
                  </TableRow>
                ) : importedArticles?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      Nenhum artigo importado ainda
                    </TableCell>
                  </TableRow>
                ) : (
                  importedArticles?.map((article) => (
                    <TableRow key={article.id}>
                      <TableCell className="font-medium max-w-[250px]">
                        <span className="line-clamp-1">{article.original_title}</span>
                      </TableCell>
                      <TableCell>
                        <a
                          href={article.original_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-muted-foreground hover:text-primary flex items-center gap-1"
                        >
                          <span className="truncate max-w-[200px]">
                            {new URL(article.original_url).hostname}
                          </span>
                          <ExternalLink className="h-3 w-3 flex-shrink-0" />
                        </a>
                      </TableCell>
                      <TableCell>
                        {article.status === "imported" ? (
                          <Badge variant="secondary" className="gap-1">
                            <Check className="h-3 w-3" />
                            Importado
                          </Badge>
                        ) : (
                          <Badge variant="outline" className="gap-1">
                            <AlertCircle className="h-3 w-3" />
                            {article.status}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-muted-foreground text-sm">
                        {formatDistanceToNow(new Date(article.created_at), {
                          addSuffix: true,
                          locale: pt,
                        })}
                      </TableCell>
                      <TableCell className="flex items-center gap-1">
                        {article.article_id && (
                          <>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => navigate(`/admin/artigos/${article.article_id}`)}
                            >
                              Editar
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleReimport(article.original_url)}
                              disabled={importMutation.isPending}
                              title="Re-importar e atualizar conteúdo"
                            >
                              <RefreshCw className={`h-4 w-4 ${importMutation.isPending ? 'animate-spin' : ''}`} />
                            </Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Info */}
        <Card className="border-dashed">
          <CardContent className="pt-6">
            <h3 className="font-medium mb-2">ℹ️ Como funciona</h3>
            <ul className="text-sm text-muted-foreground space-y-1">
              <li>• Cole o link de qualquer artigo de blog ou notícia</li>
              <li>• O sistema extrai automaticamente: <strong>título, resumo, conteúdo e imagens</strong></li>
              <li>• O artigo é criado como <strong>Rascunho</strong> para você revisar e editar antes de publicar</li>
              <li>• As imagens do artigo original são mantidas com os links originais</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}