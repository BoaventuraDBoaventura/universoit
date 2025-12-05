import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { ArticleCard } from "@/components/public/ArticleCard";
import { useArticlesByCategory } from "@/hooks/useArticles";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Category() {
  const { slug } = useParams<{ slug: string }>();
  const { data, isLoading } = useArticlesByCategory(slug || "");

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container py-8">
          <Skeleton className="mb-8 h-12 w-64" />
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] rounded-xl" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!data?.category) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <h1 className="mb-4 font-display text-2xl font-bold">
            Categoria não encontrada
          </h1>
          <p className="mb-8 text-muted-foreground">
            A categoria que procura não existe.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const { category, articles } = data;

  return (
    <PublicLayout>
      <div className="container py-8">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Voltar
          </Link>
        </div>

        {/* Header */}
        <header className="mb-10">
          <div
            className="mb-4 inline-block rounded-full px-4 py-1 text-sm font-medium"
            style={{
              backgroundColor: `${category.color}20`,
              color: category.color,
            }}
          >
            Categoria
          </div>
          <h1 className="mb-4 font-display text-3xl font-bold md:text-4xl">
            {category.name}
          </h1>
          {category.description && (
            <p className="max-w-2xl text-lg text-muted-foreground">
              {category.description}
            </p>
          )}
        </header>

        {/* Articles Grid */}
        {articles.length > 0 ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {articles.map((article) => (
              <ArticleCard key={article.id} article={article} />
            ))}
          </div>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              Ainda não há artigos nesta categoria.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}