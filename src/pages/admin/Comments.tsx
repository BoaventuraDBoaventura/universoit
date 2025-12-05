import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Check, X, Trash2, ExternalLink } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Link } from "react-router-dom";

type CommentStatus = "pending" | "approved" | "rejected";

interface Comment {
  id: string;
  author_name: string;
  author_email: string;
  content: string;
  status: CommentStatus;
  created_at: string;
  article: { id: string; title: string; slug: string } | null;
}

export default function Comments() {
  const [activeTab, setActiveTab] = useState<CommentStatus>("pending");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: comments, isLoading } = useQuery({
    queryKey: ["admin-comments", activeTab],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("comments")
        .select(`
          id, author_name, author_email, content, status, created_at,
          article:articles(id, title, slug)
        `)
        .eq("status", activeTab)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Comment[];
    },
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: CommentStatus }) => {
      const { error } = await supabase
        .from("comments")
        .update({ status })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast({ title: "Comentário atualizado" });
    },
    onError: () => {
      toast({ title: "Erro ao atualizar comentário", variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("comments").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-comments"] });
      toast({ title: "Comentário eliminado" });
      setDeleteId(null);
    },
    onError: () => {
      toast({ title: "Erro ao eliminar comentário", variant: "destructive" });
    },
  });

  const { data: counts } = useQuery({
    queryKey: ["admin-comments-counts"],
    queryFn: async () => {
      const [pending, approved, rejected] = await Promise.all([
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "pending"),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "approved"),
        supabase.from("comments").select("*", { count: "exact", head: true }).eq("status", "rejected"),
      ]);
      return {
        pending: pending.count || 0,
        approved: approved.count || 0,
        rejected: rejected.count || 0,
      };
    },
  });

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Comentários</h1>
          <p className="text-muted-foreground">Moderar comentários dos artigos</p>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as CommentStatus)}>
          <TabsList>
            <TabsTrigger value="pending" className="gap-2">
              Pendentes
              {counts?.pending ? (
                <Badge variant="secondary" className="ml-1">
                  {counts.pending}
                </Badge>
              ) : null}
            </TabsTrigger>
            <TabsTrigger value="approved">Aprovados</TabsTrigger>
            <TabsTrigger value="rejected">Rejeitados</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-4">
            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Autor</TableHead>
                    <TableHead className="max-w-md">Comentário</TableHead>
                    <TableHead>Artigo</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead className="w-32">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center">
                        Carregando...
                      </TableCell>
                    </TableRow>
                  ) : comments?.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                        Nenhum comentário {activeTab === "pending" ? "pendente" : activeTab === "approved" ? "aprovado" : "rejeitado"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    comments?.map((comment) => (
                      <TableRow key={comment.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{comment.author_name}</div>
                            <div className="text-xs text-muted-foreground">
                              {comment.author_email}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-md">
                          <p className="line-clamp-3 text-sm">{comment.content}</p>
                        </TableCell>
                        <TableCell>
                          {comment.article && (
                            <Link
                              to={`/artigo/${comment.article.slug}`}
                              target="_blank"
                              className="flex items-center gap-1 text-sm text-primary hover:underline"
                            >
                              <span className="line-clamp-1">{comment.article.title}</span>
                              <ExternalLink className="h-3 w-3 flex-shrink-0" />
                            </Link>
                          )}
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(comment.created_at), "d MMM yyyy, HH:mm", { locale: pt })}
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {activeTab === "pending" && (
                              <>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: comment.id, status: "approved" })
                                  }
                                  title="Aprovar"
                                >
                                  <Check className="h-4 w-4 text-tech-software" />
                                </Button>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  onClick={() =>
                                    updateStatusMutation.mutate({ id: comment.id, status: "rejected" })
                                  }
                                  title="Rejeitar"
                                >
                                  <X className="h-4 w-4 text-destructive" />
                                </Button>
                              </>
                            )}
                            {activeTab === "approved" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: comment.id, status: "rejected" })
                                }
                                title="Rejeitar"
                              >
                                <X className="h-4 w-4 text-destructive" />
                              </Button>
                            )}
                            {activeTab === "rejected" && (
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() =>
                                  updateStatusMutation.mutate({ id: comment.id, status: "approved" })
                                }
                                title="Aprovar"
                              >
                                <Check className="h-4 w-4 text-tech-software" />
                              </Button>
                            )}
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => setDeleteId(comment.id)}
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
          </TabsContent>
        </Tabs>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar comentário?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O comentário será permanentemente eliminado.
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