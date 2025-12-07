import { PublicLayout } from "@/components/public/PublicLayout";
import { ArticleCard } from "@/components/public/ArticleCard";
import { usePublishedArticles, useFeaturedArticles, useCategories } from "@/hooks/useArticles";
import { Link } from "react-router-dom";
import { Skeleton } from "@/components/ui/skeleton";
import { ChevronRight } from "lucide-react";

export default function Home() {
  const { data: featuredArticles, isLoading: loadingFeatured } = useFeaturedArticles();
  const { data: articles, isLoading: loadingArticles } = usePublishedArticles(12);
  const { data: categories } = useCategories();

  const mainFeatured = featuredArticles?.[0];
  const sideFeatured = featuredArticles?.slice(1, 3);
  const regularArticles = articles?.filter((a) => !a.is_featured) || [];

  return (
    <PublicLayout>
      {/* Hero Section - min-height to prevent CLS */}
      <section className="gradient-hero py-8 min-h-[400px] lg:min-h-[450px]">
        <div className="container">
          {loadingFeatured ? (
            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                <Skeleton className="aspect-[16/9] rounded-xl" />
              </div>
              <div className="flex flex-col gap-4">
                <Skeleton className="aspect-[16/9] rounded-xl" />
                <Skeleton className="aspect-[16/9] rounded-xl" />
              </div>
            </div>
          ) : (
            <div className="grid gap-4 lg:grid-cols-3">
              {mainFeatured && (
                <div className="lg:col-span-2">
                  <ArticleCard article={mainFeatured} variant="featured" priority />
                </div>
              )}
              {sideFeatured && sideFeatured.length > 0 && (
                <div className="flex flex-col gap-4">
                  {sideFeatured.map((article) => (
                    <Link
                      key={article.id}
                      to={`/artigo/${article.slug}`}
                      className="group relative block overflow-hidden rounded-xl aspect-[16/9]"
                    >
                      <img
                        src={article.featured_image || "/placeholder.svg"}
                        alt={article.title}
                        width={400}
                        height={225}
                        loading="lazy"
                        decoding="async"
                        className="absolute inset-0 h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-foreground/80 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4">
                        <h3 className="font-display font-semibold text-primary-foreground line-clamp-2">
                          {article.title}
                        </h3>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      {/* Categories Nav - fixed height to prevent CLS */}
      <section className="border-b border-border bg-card py-4 min-h-[56px]">
        <div className="container">
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-hide">
            {categories && categories.length > 0 ? (
              categories.map((category) => (
                <Link
                  key={category.id}
                  to={`/categoria/${category.slug}`}
                  className="flex-shrink-0 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary"
                  style={{ 
                    backgroundColor: `${category.color}15`,
                    color: category.color 
                  }}
                >
                  {category.name}
                </Link>
              ))
            ) : (
              <>
                <Skeleton className="h-9 w-24 rounded-full" />
                <Skeleton className="h-9 w-20 rounded-full" />
                <Skeleton className="h-9 w-28 rounded-full" />
                <Skeleton className="h-9 w-24 rounded-full" />
              </>
            )}
          </div>
        </div>
      </section>

      {/* Latest Articles */}
      <section className="py-12">
        <div className="container">
          <div className="mb-8 flex items-center justify-between">
            <h2 className="font-display text-2xl font-bold">Últimas Notícias</h2>
            <Link
              to="/todas"
              className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"
            >
              Ver todas
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          {loadingArticles ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="space-y-4">
                  <Skeleton className="aspect-[16/10] rounded-xl" />
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-6 w-full" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          ) : regularArticles.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {regularArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-border p-12 text-center">
              <p className="text-muted-foreground">
                Ainda não há artigos publicados.
              </p>
              <p className="mt-2 text-sm text-muted-foreground">
                Faça login como editor para criar o primeiro artigo.
              </p>
            </div>
          )}
        </div>
      </section>
    </PublicLayout>
  );
}
