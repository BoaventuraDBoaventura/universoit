import { useState } from "react";
import { AdminLayout } from "@/components/admin/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import { pt } from "date-fns/locale";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { Eye, MousePointer, TrendingUp, Loader2, ArrowLeft, Calendar } from "lucide-react";
import { Link } from "react-router-dom";

interface AdStatistic {
  id: string;
  ad_id: string;
  date: string;
  impressions: number;
  clicks: number;
}

interface Advertisement {
  id: string;
  title: string;
  position: string;
  impressions: number | null;
  clicks: number | null;
}

const DATE_RANGES = [
  { value: "7", label: "Últimos 7 dias" },
  { value: "14", label: "Últimos 14 dias" },
  { value: "30", label: "Últimos 30 dias" },
  { value: "90", label: "Últimos 90 dias" },
];

export default function AdStatistics() {
  const [selectedAd, setSelectedAd] = useState<string>("all");
  const [dateRange, setDateRange] = useState("30");

  // Buscar anúncios
  const { data: ads, isLoading: loadingAds } = useQuery({
    queryKey: ["admin-ads-list"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("advertisements")
        .select("id, title, position, impressions, clicks")
        .order("title");
      if (error) throw error;
      return data as Advertisement[];
    },
  });

  // Buscar estatísticas
  const { data: statistics, isLoading: loadingStats } = useQuery({
    queryKey: ["ad-statistics", selectedAd, dateRange],
    queryFn: async () => {
      const startDate = format(subDays(new Date(), parseInt(dateRange)), "yyyy-MM-dd");
      
      let query = supabase
        .from("ad_statistics")
        .select("*")
        .gte("date", startDate)
        .order("date", { ascending: true });

      if (selectedAd !== "all") {
        query = query.eq("ad_id", selectedAd);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as AdStatistic[];
    },
  });

  // Processar dados para o gráfico
  const chartData = (() => {
    if (!statistics) return [];

    // Agrupar por data
    const grouped = statistics.reduce((acc, stat) => {
      const date = stat.date;
      if (!acc[date]) {
        acc[date] = { date, impressions: 0, clicks: 0 };
      }
      acc[date].impressions += stat.impressions;
      acc[date].clicks += stat.clicks;
      return acc;
    }, {} as Record<string, { date: string; impressions: number; clicks: number }>);

    // Preencher dias sem dados
    const days = parseInt(dateRange);
    const result = [];
    for (let i = days - 1; i >= 0; i--) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const displayDate = format(subDays(new Date(), i), "dd/MM", { locale: pt });
      const data = grouped[date] || { impressions: 0, clicks: 0 };
      result.push({
        date: displayDate,
        fullDate: date,
        impressions: data.impressions,
        clicks: data.clicks,
        ctr: data.impressions > 0 ? ((data.clicks / data.impressions) * 100).toFixed(2) : "0",
      });
    }
    return result;
  })();

  // Calcular totais do período
  const totals = chartData.reduce(
    (acc, day) => ({
      impressions: acc.impressions + day.impressions,
      clicks: acc.clicks + day.clicks,
    }),
    { impressions: 0, clicks: 0 }
  );

  const avgCtr = totals.impressions > 0 
    ? ((totals.clicks / totals.impressions) * 100).toFixed(2) 
    : "0";

  const isLoading = loadingAds || loadingStats;

  return (
    <AdminLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/admin/anuncios">
              <Button variant="ghost" size="icon">
                <ArrowLeft className="h-4 w-4" />
              </Button>
            </Link>
            <div>
              <h1 className="font-display text-2xl font-bold">Estatísticas de Anúncios</h1>
              <p className="text-sm text-muted-foreground">
                Análise detalhada de performance
              </p>
            </div>
          </div>
        </div>

        {/* Filtros */}
        <div className="flex flex-wrap gap-4">
          <div className="w-64">
            <Select value={selectedAd} onValueChange={setSelectedAd}>
              <SelectTrigger>
                <SelectValue placeholder="Selecionar anúncio" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos os anúncios</SelectItem>
                {ads?.map((ad) => (
                  <SelectItem key={ad.id} value={ad.id}>
                    {ad.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="w-48">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger>
                <Calendar className="mr-2 h-4 w-4" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGES.map((range) => (
                  <SelectItem key={range.value} value={range.value}>
                    {range.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Cards de resumo */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <Eye className="h-4 w-4" />
                Impressões
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.impressions.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <MousePointer className="h-4 w-4" />
                Cliques
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totals.clicks.toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">no período selecionado</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                <TrendingUp className="h-4 w-4" />
                CTR Médio
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{avgCtr}%</div>
              <p className="text-xs text-muted-foreground">taxa de cliques</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                Média Diária
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {Math.round(totals.impressions / parseInt(dateRange)).toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">impressões/dia</p>
            </CardContent>
          </Card>
        </div>

        {/* Gráfico de linha - Impressões e Cliques */}
        <Card>
          <CardHeader>
            <CardTitle>Impressões e Cliques ao Longo do Tempo</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[300px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-[300px] items-center justify-center text-muted-foreground">
                Sem dados para o período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                  />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="impressions"
                    name="Impressões"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clicks"
                    name="Cliques"
                    stroke="hsl(var(--chart-2))"
                    strokeWidth={2}
                    dot={false}
                    activeDot={{ r: 4 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Gráfico de barras - CTR diário */}
        <Card>
          <CardHeader>
            <CardTitle>Taxa de Cliques (CTR) Diária</CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="flex h-[250px] items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : chartData.length === 0 ? (
              <div className="flex h-[250px] items-center justify-center text-muted-foreground">
                Sem dados para o período selecionado
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis 
                    dataKey="date" 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                  />
                  <YAxis 
                    className="text-xs"
                    tick={{ fill: 'hsl(var(--muted-foreground))' }}
                    unit="%"
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: 'hsl(var(--card))',
                      border: '1px solid hsl(var(--border))',
                      borderRadius: '8px',
                    }}
                    labelStyle={{ color: 'hsl(var(--foreground))' }}
                    formatter={(value: string) => [`${value}%`, "CTR"]}
                  />
                  <Bar
                    dataKey="ctr"
                    name="CTR"
                    fill="hsl(var(--chart-3))"
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Tabela de performance por anúncio */}
        {selectedAd === "all" && ads && ads.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Performance por Anúncio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {ads
                  .filter((ad) => (ad.impressions || 0) > 0)
                  .sort((a, b) => (b.impressions || 0) - (a.impressions || 0))
                  .map((ad) => {
                    const ctr = ad.impressions 
                      ? ((ad.clicks || 0) / ad.impressions * 100).toFixed(2) 
                      : "0";
                    return (
                      <div
                        key={ad.id}
                        className="flex items-center justify-between rounded-lg border border-border p-4"
                      >
                        <div>
                          <p className="font-medium">{ad.title}</p>
                          <Badge variant="outline" className="mt-1">
                            {ad.position}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-6 text-sm">
                          <div className="text-right">
                            <p className="text-muted-foreground">Impressões</p>
                            <p className="font-medium">{(ad.impressions || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">Cliques</p>
                            <p className="font-medium">{(ad.clicks || 0).toLocaleString()}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-muted-foreground">CTR</p>
                            <p className="font-medium">{ctr}%</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                {ads.filter((ad) => (ad.impressions || 0) > 0).length === 0 && (
                  <p className="text-center text-muted-foreground py-4">
                    Nenhum anúncio com impressões registadas
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </AdminLayout>
  );
}
