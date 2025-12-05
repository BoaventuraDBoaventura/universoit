import { useState } from "react";
import { Link } from "react-router-dom";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { AdImageUpload } from "@/components/admin/AdImageUpload";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Pencil, Trash2, Eye, MousePointer, Loader2, ExternalLink, BarChart3 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { pt } from "date-fns/locale";
import { Constants, Database } from "@/integrations/supabase/types";

type AdPosition = Database["public"]["Enums"]["ad_position"];
type AdType = Database["public"]["Enums"]["ad_type"];

interface Advertisement {
  id: string;
  title: string;
  image_url: string | null;
  link_url: string | null;
  ad_type: AdType;
  position: AdPosition;
  is_active: boolean | null;
  start_date: string | null;
  end_date: string | null;
  impressions: number | null;
  clicks: number | null;
  popup_frequency_hours: number | null;
  created_at: string;
}

const AD_POSITIONS = Constants.public.Enums.ad_position;
const AD_TYPES = Constants.public.Enums.ad_type;

const positionLabels: Record<AdPosition, string> = {
  header: "Cabeçalho",
  sidebar: "Barra lateral",
  footer: "Rodapé",
  in_article: "No artigo",
  popup: "Popup",
};

const typeLabels: Record<AdType, string> = {
  banner: "Banner",
  sponsored: "Patrocinado",
  popup: "Popup",
};

const defaultFormData = {
  title: "",
  image_url: "",
  link_url: "",
  ad_type: "banner" as AdType,
  position: "sidebar" as AdPosition,
  is_active: true,
  start_date: "",
  end_date: "",
  popup_frequency_hours: 24,
};

export default function Advertisements() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAd, setEditingAd] = useState<Advertisement | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [formData, setFormData] = useState(defaultFormData);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: ads, isLoading } = useQuery({
    queryKey: ["admin-advertisements"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Advertisement[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        title: formData.title,
        image_url: formData.image_url || null,
        link_url: formData.link_url || null,
        ad_type: formData.ad_type,
        position: formData.position,
        is_active: formData.is_active,
        start_date: formData.start_date || null,
        end_date: formData.end_date || null,
        popup_frequency_hours: formData.position === "popup" ? formData.popup_frequency_hours : null,
      };

      if (editingAd) {
        const { error } = await supabase
          .from("advertisements")
          .update(payload)
          .eq("id", editingAd.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("advertisements").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
      toast({ title: editingAd ? "Anúncio atualizado!" : "Anúncio criado!" });
      handleCloseDialog();
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao guardar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from("advertisements")
        .update({ is_active })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao atualizar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("advertisements").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-advertisements"] });
      toast({ title: "Anúncio eliminado!" });
      setDeleteId(null);
    },
    onError: (error: Error) => {
      toast({
        title: "Erro ao eliminar",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleOpenDialog = (ad?: Advertisement) => {
    if (ad) {
      setEditingAd(ad);
      setFormData({
        title: ad.title,
        image_url: ad.image_url || "",
        link_url: ad.link_url || "",
        ad_type: ad.ad_type,
        position: ad.position,
        is_active: ad.is_active ?? true,
        start_date: ad.start_date?.split("T")[0] || "",
        end_date: ad.end_date?.split("T")[0] || "",
        popup_frequency_hours: ad.popup_frequency_hours ?? 24,
      });
    } else {
      setEditingAd(null);
      setFormData(defaultFormData);
    }
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingAd(null);
    setFormData(defaultFormData);
  };

  // Stats
  const totalImpressions = ads?.reduce((sum, ad) => sum + (ad.impressions || 0), 0) || 0;
  const totalClicks = ads?.reduce((sum, ad) => sum + (ad.clicks || 0), 0) || 0;
  const activeAds = ads?.filter((ad) => ad.is_active).length || 0;
  const ctr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(2) : "0";

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-display text-2xl font-bold">Anúncios</h1>
            <p className="text-sm text-muted-foreground">
              Gerir anúncios e banners do site
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Link to="/admin/anuncios/estatisticas">
              <Button variant="outline">
                <BarChart3 className="mr-2 h-4 w-4" />
                Estatísticas
              </Button>
            </Link>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => handleOpenDialog()}>
                  <Plus className="mr-2 h-4 w-4" />
                  Novo Anúncio
                </Button>
              </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  {editingAd ? "Editar Anúncio" : "Novo Anúncio"}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Título</Label>
                  <Input
                    id="title"
                    value={formData.title}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, title: e.target.value }))
                    }
                    placeholder="Nome do anúncio"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label>Tipo</Label>
                    <Select
                      value={formData.ad_type}
                      onValueChange={(value: AdType) =>
                        setFormData((prev) => ({ ...prev, ad_type: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {typeLabels[type]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label>Posição</Label>
                    <Select
                      value={formData.position}
                      onValueChange={(value: AdPosition) =>
                        setFormData((prev) => ({ ...prev, position: value }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {AD_POSITIONS.map((pos) => (
                          <SelectItem key={pos} value={pos}>
                            {positionLabels[pos]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="link_url">URL de destino</Label>
                  <Input
                    id="link_url"
                    type="url"
                    value={formData.link_url}
                    onChange={(e) =>
                      setFormData((prev) => ({ ...prev, link_url: e.target.value }))
                    }
                    placeholder="https://exemplo.com"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="start_date">Data de início</Label>
                    <Input
                      id="start_date"
                      type="date"
                      value={formData.start_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, start_date: e.target.value }))
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="end_date">Data de fim</Label>
                    <Input
                      id="end_date"
                      type="date"
                      value={formData.end_date}
                      onChange={(e) =>
                        setFormData((prev) => ({ ...prev, end_date: e.target.value }))
                      }
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Imagem do Anúncio</Label>
                  <AdImageUpload
                    value={formData.image_url}
                    onChange={(url) =>
                      setFormData((prev) => ({ ...prev, image_url: url }))
                    }
                    position={formData.position}
                  />
                </div>

                {/* Configuração de frequência do popup */}
                {formData.position === "popup" && (
                  <div className="space-y-2 rounded-lg border border-border bg-muted/50 p-4">
                    <Label htmlFor="popup_frequency">Frequência do Popup</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      Intervalo mínimo (em horas) entre exibições para o mesmo utilizador
                    </p>
                    <div className="flex items-center gap-2">
                      <Input
                        id="popup_frequency"
                        type="number"
                        min={1}
                        max={720}
                        value={formData.popup_frequency_hours}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            popup_frequency_hours: parseInt(e.target.value) || 24,
                          }))
                        }
                        className="w-24"
                      />
                      <span className="text-sm text-muted-foreground">horas</span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Ex: 24h = 1x por dia, 168h = 1x por semana
                    </p>
                  </div>
                )}

                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <Label htmlFor="is_active">Anúncio Ativo</Label>
                    <p className="text-sm text-muted-foreground">
                      O anúncio será exibido no site
                    </p>
                  </div>
                  <Switch
                    id="is_active"
                    checked={formData.is_active}
                    onCheckedChange={(checked) =>
                      setFormData((prev) => ({ ...prev, is_active: checked }))
                    }
                  />
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={handleCloseDialog}>
                    Cancelar
                  </Button>
                  <Button
                    onClick={() => saveMutation.mutate()}
                    disabled={!formData.title || saveMutation.isPending}
                  >
                    {saveMutation.isPending && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {editingAd ? "Guardar" : "Criar"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Anúncios Ativos
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{activeAds}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Impressões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalImpressions.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Total Cliques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClicks.toLocaleString()}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                CTR Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{ctr}%</div>
            </CardContent>
          </Card>
        </div>

        {/* Table */}
        <Card>
          <CardContent className="p-0">
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : ads?.length === 0 ? (
              <div className="py-12 text-center text-muted-foreground">
                Nenhum anúncio criado
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Anúncio</TableHead>
                    <TableHead>Posição</TableHead>
                    <TableHead>Tipo</TableHead>
                    <TableHead className="text-center">
                      <Eye className="mx-auto h-4 w-4" />
                    </TableHead>
                    <TableHead className="text-center">
                      <MousePointer className="mx-auto h-4 w-4" />
                    </TableHead>
                    <TableHead>Estado</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ads?.map((ad) => (
                    <TableRow key={ad.id}>
                      <TableCell>
                        <div className="flex items-center gap-3">
                          {ad.image_url && (
                            <img
                              src={ad.image_url}
                              alt={ad.title}
                              className="h-10 w-16 rounded object-cover"
                            />
                          )}
                          <div>
                            <div className="font-medium">{ad.title}</div>
                            {ad.link_url && (
                              <a
                                href={ad.link_url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary"
                              >
                                <ExternalLink className="h-3 w-3" />
                                Link
                              </a>
                            )}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{positionLabels[ad.position]}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">{typeLabels[ad.ad_type]}</Badge>
                      </TableCell>
                      <TableCell className="text-center">
                        {(ad.impressions || 0).toLocaleString()}
                      </TableCell>
                      <TableCell className="text-center">
                        {(ad.clicks || 0).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        <Switch
                          checked={ad.is_active ?? false}
                          onCheckedChange={(checked) =>
                            toggleActiveMutation.mutate({ id: ad.id, is_active: checked })
                          }
                        />
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleOpenDialog(ad)}
                          >
                            <Pencil className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteId(ad.id)}
                          >
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Eliminar anúncio?</AlertDialogTitle>
            <AlertDialogDescription>
              Esta ação não pode ser revertida. O anúncio será permanentemente
              eliminado.
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
