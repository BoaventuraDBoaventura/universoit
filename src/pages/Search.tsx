import { useState, useEffect } from "react";
import { useSearchParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { ArticleCard } from "@/components/public/ArticleCard";
import { useSearchArticles } from "@/hooks/useArticles";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Search as SearchIcon, ArrowLeft } from "lucide-react";

export default function Search() {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(initialQuery);
  const { data: articles, isLoading } = useSearchArticles(query);

  useEffect(() => {
    const q = searchParams.get("q") || "";
    setQuery(q);
  }, [searchParams]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setSearchParams({ q: query.trim() });
    }
  };

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

        {/* Search Header */}
        <header className="mb-10">
          <h1 className="mb-6 font-display text-3xl font-bold">Pesquisa</h1>
          <form onSubmit={handleSearch} className="max-w-xl">
            <div className="relative">
              <SearchIcon className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Pesquisar artigos..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="h-12 pl-12 text-lg"
              />
            </div>
          </form>
        </header>

        {/* Results */}
        {query.length < 3 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <SearchIcon className="mx-auto mb-4 h-12 w-12 text-muted-foreground/50" />
            <p className="text-muted-foreground">
              Digite pelo menos 3 caracteres para pesquisar.
            </p>
          </div>
        ) : isLoading ? (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-4">
                <Skeleton className="aspect-[16/10] rounded-xl" />
                <Skeleton className="h-6 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            ))}
          </div>
        ) : articles && articles.length > 0 ? (
          <>
            <p className="mb-6 text-muted-foreground">
              {articles.length} resultado{articles.length !== 1 ? "s" : ""} para "{query}"
            </p>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {articles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </>
        ) : (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-muted-foreground">
              Nenhum resultado encontrado para "{query}".
            </p>
            <p className="mt-2 text-sm text-muted-foreground">
              Tente pesquisar com termos diferentes.
            </p>
          </div>
        )}
      </div>
    </PublicLayout>
  );
}