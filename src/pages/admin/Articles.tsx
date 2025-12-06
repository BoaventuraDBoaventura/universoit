import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, Search, MoreHorizontal, Edit, Trash2, Eye, Download, CheckCircle } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
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

export default function Articles() {
  const [search, setSearch] = useState("");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);
  const [filterImported, setFilterImported] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

const { data: articles, isLoading } = useQuery({
    queryKey: ["admin-articles"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, color),
          author:profiles(id, full_name),
          source:content_sources(id, name)
        `)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("articles").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: "Artigo eliminado com sucesso" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Erro ao eliminar artigo", variant: "destructive" });
    },
  });

  const bulkDeleteMutation = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from("articles").delete().in("id", ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: `${selectedIds.length} artigo(s) eliminado(s) com sucesso` });
      setSelectedIds([]);
      setShowBulkDeleteDialog(false);
    },
    onError: () => {
      toast({ title: "Erro ao eliminar artigos", variant: "destructive" });
    },
  });

  const publishMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from("articles")
        .update({ status: "published", published_at: new Date().toISOString() })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-articles"] });
      toast({ title: "Artigo publicado com sucesso" });
    },
    onError: () => {
      toast({ title: "Erro ao publicar artigo", variant: "destructive" });
    },
  });

  const filteredArticles = articles?.filter((article) => {
    const matchesSearch =
      article.title.toLowerCase().includes(search.toLowerCase()) ||
      article.author?.full_name?.toLowerCase().includes(search.toLowerCase());
    const matchesImportedFilter = filterImported
      ? article.source_id && article.status === "draft"
      : true;
    return matchesSearch && matchesImportedFilter;
  });

  const importedDraftCount = articles?.filter(
    (a) => a.source_id && a.status === "draft"
  ).length || 0;

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === filteredArticles?.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(filteredArticles?.map((a) => a.id) || []);
    }
  };

  const statusColors: Record<string, string> = {
    draft: "bg-muted text-muted-foreground",
    published: "bg-tech-software/20 text-tech-software",
    scheduled: "bg-tech-hardware/20 text-tech-hardware",
    archived: "bg-muted text-muted-foreground",
  };

  const statusLabels: Record<string, string> = {
    draft: "Rascunho",
    published: "Publicado",
    scheduled: "Agendado",
    archived: "Arquivado",
  };

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Artigos</h1>
            <p className="text-muted-foreground">
              Gerir todos os artigos do portal
            </p>
          </div>
          <Button asChild>
            <Link to="/admin/artigos/novo">
              <Plus className="mr-2 h-4 w-4" />
              Novo Artigo
            </Link>
          </Button>
        </div>

<div className="flex items-center gap-4 flex-wrap">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Pesquisar artigos..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
className="pl-9"
            />
          </div>
          {importedDraftCount > 0 && (
            <Button
              variant={filterImported ? "default" : "outline"}
              onClick={() => setFilterImported(!filterImported)}
            >
              <Download className="mr-2 h-4 w-4" />
              Importados ({importedDraftCount})
            </Button>
          )}
          {selectedIds.length > 0 && (
            <Button
              variant="destructive"
              onClick={() => setShowBulkDeleteDialog(true)}
            >
              <Trash2 className="mr-2 h-4 w-4" />
              Eliminar ({selectedIds.length})
            </Button>
          )}
        </div>

        <div className="rounded-lg border border-border bg-card">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-12">
                  <Checkbox
                    checked={
                      filteredArticles?.length > 0 &&
                      selectedIds.length === filteredArticles?.length
                    }
                    onCheckedChange={toggleSelectAll}
                  />
                </TableHead>
                <TableHead>Título</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Autor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead className="w-12"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    Carregando...
                  </TableCell>
                </TableRow>
              ) : filteredArticles?.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    Nenhum artigo encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredArticles?.map((article) => (
                  <TableRow
                    key={article.id}
                    className={selectedIds.includes(article.id) ? "bg-muted/50" : ""}
                  >
                    <TableCell>
                      <Checkbox
                        checked={selectedIds.includes(article.id)}
                        onCheckedChange={() => toggleSelect(article.id)}
                      />
                    </TableCell>
<TableCell>
                      <div className="font-medium line-clamp-1">{article.title}</div>
                      <div className="flex gap-1 mt-1">
                        {article.is_featured && (
                          <Badge variant="outline" className="text-xs">
                            Destaque
                          </Badge>
                        )}
                        {article.source_id && (
                          <Badge variant="secondary" className="text-xs bg-blue-500/10 text-blue-500">
                            <Download className="h-3 w-3 mr-1" />
                            Importado
                          </Badge>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {article.category && (
                        <Badge
                          variant="secondary"
                          style={{
                            backgroundColor: `${article.category.color}20`,
                            color: article.category.color,
                          }}
                        >
                          {article.category.name}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {article.author?.full_name || "-"}
                    </TableCell>
                    <TableCell>
                      <Badge className={statusColors[article.status]}>
                        {statusLabels[article.status]}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground">
                      {format(new Date(article.created_at), "d MMM yyyy", { locale: pt })}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {article.status === "published" && (
                            <DropdownMenuItem asChild>
                              <a href={`/artigo/${article.slug}`} target="_blank">
                                <Eye className="mr-2 h-4 w-4" />
                                Ver
                              </a>
                            </DropdownMenuItem>
                          )}
<DropdownMenuItem asChild>
                            <Link to={`/admin/artigos/${article.id}`}>
                              <Edit className="mr-2 h-4 w-4" />
                              Editar
                            </Link>
                          </DropdownMenuItem>
                          {article.status === "draft" && (
                            <DropdownMenuItem
                              onClick={() => publishMutation.mutate(article.id)}
                            >
                              <CheckCircle className="mr-2 h-4 w-4" />
                              Publicar
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => setDeleteId(article.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Eliminar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
      </div>

      {/* Single delete dialog */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar artigo?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O artigo será permanentemente eliminado.
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

      {/* Bulk delete dialog */}
      <AlertDialog open={showBulkDeleteDialog} onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar {selectedIds.length} artigo(s)?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. Os artigos selecionados serão permanentemente eliminados.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => bulkDeleteMutation.mutate(selectedIds)}
            >
              Eliminar {selectedIds.length} artigo(s)
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AdminLayout>
  );
}