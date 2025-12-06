import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, RefreshCw, Edit, Trash2, Globe, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ContentSource {
  id: string;
  name: string;
  url: string;
  scrape_url: string;
  category_id: string | null;
  is_active: boolean;
  scrape_frequency_hours: number;
  last_scraped_at: string | null;
  articles_imported: number;
  created_at: string;
  category?: { id: string; name: string; color: string } | null;
}

interface SourceFormData {
  name: string;
  url: string;
  scrape_url: string;
  category_id: string;
  scrape_frequency_hours: number;
}

export default function ContentSources() {
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingSource, setEditingSource] = useState<ContentSource | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [scrapingId, setScrapingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<SourceFormData>({
    name: "",
    url: "",
    scrape_url: "",
    category_id: "",
    scrape_frequency_hours: 24,
  });
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: sources, isLoading } = useQuery({
    queryKey: ["content-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("content_sources")
        .select("*, category:categories(id, name, color)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as ContentSource[];
    },
  });

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

  const createMutation = useMutation({
    mutationFn: async (data: SourceFormData) => {
      const { error } = await supabase.from("content_sources").insert({
        name: data.name,
        url: data.url,
        scrape_url: data.scrape_url,
        category_id: data.category_id || null,
        scrape_frequency_hours: data.scrape_frequency_hours,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      toast({ title: "Fonte criada com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao criar fonte", variant: "destructive" });
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<SourceFormData> }) => {
      const { error } = await supabase
        .from("content_sources")
        .update(data)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      toast({ title: "Fonte atualizada com sucesso" });
      handleCloseDialog();
    },
    onError: () => {
      toast({ title: "Erro ao atualizar fonte", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("content_sources").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      toast({ title: "Fonte eliminada com sucesso" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Erro ao eliminar fonte", variant: "destructive" });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("content_sources")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar estado", variant: "destructive" });
    },
  });

  const scrapeMutation = useMutation({
    mutationFn: async (sourceId: string) => {
      setScrapingId(sourceId);
      const { data, error } = await supabase.functions.invoke("scrape-content", {
        body: { source_id: sourceId, max_articles: 5 },
      });
      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["content-sources"] });
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({
        title: "Scraping concluído",
        description: `${data.imported} artigo(s) importado(s)`,
      });
      setScrapingId(null);
    },
    onError: (error) => {
      console.error("Scrape error:", error);
      toast({
        title: "Erro no scraping",
        description: "Verifique os logs para mais detalhes",
        variant: "destructive",
      });
      setScrapingId(null);
    },
  });

  const handleOpenDialog = (source?: ContentSource) => {
    if (source) {
      setEditingSource(source);
      setFormData({
        name: source.name,
        url: source.url,
        scrape_url: source.scrape_url,
        category_id: source.category_id || "",
        scrape_frequency_hours: source.scrape_frequency_hours,
      });
    } else {
      setEditingSource(null);
      setFormData({
        name: "",
        url: "",
        scrape_url: "",
        category_id: "",
        scrape_frequency_hours: 24,
      });
    }
    setIsDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setIsDialogOpen(false);
    setEditingSource(null);
    setFormData({
      name: "",
      url: "",
      scrape_url: "",
      category_id: "",
      scrape_frequency_hours: 24,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingSource) {
      updateMutation.mutate({ id: editingSource.id, data: formData });
    } else {
      createMutation.mutate(formData);
    }
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Fontes de Conteúdo</h1>
            <p className="text-muted-foreground">
              Gerir sites para importação automática de artigos
            </p>
          </div>
          <Button onClick={() => handleOpenDialog()}>
            <Plus className="mr-2 h-4 w-4" />
            Nova Fonte
          </Button>
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Nome</TableHead>
                <TableHead>URL</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Último Scrape</TableHead>
                <TableHead>Artigos</TableHead>
                <TableHead className="w-32">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : sources?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhuma fonte configurada
                  </TableCell>
                </TableRow>
              ) : (
                sources?.map((source) => (
                  <TableRow key={source.id}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Globe className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">{source.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <a
                        href={source.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-muted-foreground hover:text-primary truncate max-w-[200px] block"
                      >
                        {source.url}
                      </a>
                    </TableCell>
                    <TableCell>
                      {source.category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${source.category.color}20`,
                            color: source.category.color,
                          }}
                        >
                          {source.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={source.is_active}
                        onCheckedChange={(checked) =>
                          toggleActiveMutation.mutate({ id: source.id, is_active: checked })
                        }
                      />
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {source.last_scraped_at
                        ? formatDistanceToNow(new Date(source.last_scraped_at), {
                            addSuffix: true,
                            locale: pt,
                          })
                        : "Nunca"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">{source.articles_imported}</Badge>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => scrapeMutation.mutate(source.id)}
                          disabled={scrapingId === source.id}
                          title="Buscar agora"
                        >
                          {scrapingId === source.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <RefreshCw className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleOpenDialog(source)}
                          title="Editar"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => setDeleteId(source.id)}
                          title="Eliminar"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>

        <div className="rounded-lg border border-border bg-card p-4">
          <h3 className="font-medium mb-2">ℹ️ Como funciona</h3>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• Adicione sites como fontes de conteúdo para importar artigos automaticamente</li>
            <li>• Use a <strong>URL de Scrape</strong> para especificar a página com lista de artigos (ex: página de notícias)</li>
            <li>• Os artigos são criados como <strong>Rascunho</strong> para revisão antes de publicar</li>
            <li>• Cada scrape usa créditos da Firecrawl API (500 créditos grátis)</li>
          </ul>
        </div>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editingSource ? "Editar Fonte" : "Nova Fonte de Conteúdo"}
            </DialogTitle>
            <DialogDescription>
              Configure uma fonte para importar artigos automaticamente.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="Ex: Pplware"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="url">URL do Site</Label>
              <Input
                id="url"
                type="url"
                value={formData.url}
                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                placeholder="https://pplware.sapo.pt"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="scrape_url">URL para Scraping</Label>
              <Input
                id="scrape_url"
                type="url"
                value={formData.scrape_url}
                onChange={(e) => setFormData({ ...formData, scrape_url: e.target.value })}
                placeholder="https://pplware.sapo.pt/categoria/software"
                required
              />
              <p className="text-xs text-muted-foreground">
                Página com lista de artigos (ex: página de categoria ou notícias)
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Categoria Padrão</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) => setFormData({ ...formData, category_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecione uma categoria" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="frequency">Frequência (horas)</Label>
              <Select
                value={formData.scrape_frequency_hours.toString()}
                onValueChange={(value) =>
                  setFormData({ ...formData, scrape_frequency_hours: parseInt(value) })
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="6">A cada 6 horas</SelectItem>
                  <SelectItem value="12">A cada 12 horas</SelectItem>
                  <SelectItem value="24">A cada 24 horas</SelectItem>
                  <SelectItem value="48">A cada 48 horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={handleCloseDialog}>
                Cancelar
              </Button>
              <Button type="submit" disabled={createMutation.isPending || updateMutation.isPending}>
                {editingSource ? "Guardar" : "Criar"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar fonte?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. A fonte será permanentemente eliminada,
              mas os artigos já importados serão mantidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => deleteId && deleteMutation.mutate(deleteId)}
            >
              Eliminar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}
