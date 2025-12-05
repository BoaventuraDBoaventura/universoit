import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, FolderOpen, Users, Eye, TrendingUp, Mail } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Dashboard() {
  const { data: stats } = useQuery({
    queryKey: ["admin-stats"],
    queryFn: async () => {
      const [
        { count: articlesCount },
        { count: publishedCount },
        { count: categoriesCount },
        { count: subscribersCount },
      ] = await Promise.all([
        supabase.from("articles").select("*", { count: "exact", head: true }),
        supabase.from("articles").select("*", { count: "exact", head: true }).eq("status", "published"),
        supabase.from("categories").select("*", { count: "exact", head: true }),
        supabase.from("newsletter_subscribers").select("*", { count: "exact", head: true }).eq("is_active", true),
      ]);

      // Get total views
      const { data: viewsData } = await supabase
        .from("articles")
        .select("view_count");
      const totalViews = viewsData?.reduce((sum, a) => sum + (a.view_count || 0), 0) || 0;

      return {
        articles: articlesCount || 0,
        published: publishedCount || 0,
        categories: categoriesCount || 0,
        subscribers: subscribersCount || 0,
        views: totalViews,
      };
    },
  });

  const statCards = [
    {
      title: "Total de Artigos",
      value: stats?.articles || 0,
      icon: FileText,
      color: "text-primary",
    },
    {
      title: "Publicados",
      value: stats?.published || 0,
      icon: TrendingUp,
      color: "text-tech-software",
    },
    {
      title: "Categorias",
      value: stats?.categories || 0,
      icon: FolderOpen,
      color: "text-tech-ai",
    },
    {
      title: "Visualizações",
      value: stats?.views || 0,
      icon: Eye,
      color: "text-tech-hardware",
    },
    {
      title: "Subscritores",
      value: stats?.subscribers || 0,
      icon: Mail,
      color: "text-tech-science",
    },
  ];

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div>
          <h1 className="font-display text-2xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground">
            Visão geral do portal de notícias
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
          {statCards.map((stat) => (
            <Card key={stat.title}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{stat.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Ações Rápidas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <a
                href="/admin/artigos/novo"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
              >
                <FileText className="h-5 w-5 text-primary" />
                <div>
                  <div className="font-medium">Criar novo artigo</div>
                  <div className="text-sm text-muted-foreground">
                    Escrever e publicar uma nova notícia
                  </div>
                </div>
              </a>
              <a
                href="/admin/categorias"
                className="flex items-center gap-3 rounded-lg border border-border p-4 transition-colors hover:bg-secondary"
              >
                <FolderOpen className="h-5 w-5 text-tech-ai" />
                <div>
                  <div className="font-medium">Gerir categorias</div>
                  <div className="text-sm text-muted-foreground">
                    Adicionar ou editar categorias
                  </div>
                </div>
              </a>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Dicas</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-muted-foreground">
              <p>
                <strong className="text-foreground">Artigos em destaque:</strong> Marque artigos como "destaque" para aparecerem na área principal da homepage.
              </p>
              <p>
                <strong className="text-foreground">SEO:</strong> Use títulos descritivos e excerpts atraentes para melhor posicionamento nos motores de busca.
              </p>
              <p>
                <strong className="text-foreground">Imagens:</strong> Use imagens de alta qualidade com proporção 16:9 para melhor apresentação.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}