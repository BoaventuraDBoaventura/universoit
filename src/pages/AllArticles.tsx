import { PublicLayout } from "@/components/public/PublicLayout";
import { ArticleCard } from "@/components/public/ArticleCard";
import { usePublishedArticles } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { Helmet } from "react-helmet-async";

export default function AllArticles() {
  const { data: articles, isLoading } = usePublishedArticles(100);

  return (
    <PublicLayout>
      <Helmet>
        <title>Todas as Notícias | Universo IT</title>
        <meta name="description" content="Confira todas as notícias e artigos sobre tecnologia, celulares, apps e muito mais." />
      </Helmet>

      <section className="py-12">
        <div className="container">
          <h1 className="font-display text-3xl font-bold mb-8">Todas as Notícias</h1>

          {isLoading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(9)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[16/10] rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                Ainda não há artigos publicados.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
