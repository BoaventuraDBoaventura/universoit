import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useArticleBySlug, usePublishedArticles } from "@/hooks/useArticles";
import { ArticleCard } from "@/components/public/ArticleCard";
import { CommentList } from "@/components/public/CommentList";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Eye, ArrowLeft, Share2, Twitter, Facebook, Linkedin } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const { data: relatedArticles } = usePublishedArticles(4);

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container py-8">
          <Skeleton className="mb-4 h-8 w-48" />
          <Skeleton className="mb-8 h-12 w-full max-w-3xl" />
          <Skeleton className="aspect-[21/9] w-full rounded-xl" />
        </div>
      </PublicLayout>
    );
  }

  if (!article) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <h1 className="mb-4 font-display text-2xl font-bold">Artigo não encontrado</h1>
          <p className="mb-8 text-muted-foreground">
            O artigo que procura não existe ou foi removido.
          </p>
          <Button asChild>
            <Link to="/">Voltar ao início</Link>
          </Button>
        </div>
      </PublicLayout>
    );
  }

  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  const shareUrl = window.location.href;
  const shareTitle = encodeURIComponent(article.title);

  const filteredRelated = relatedArticles
    ?.filter((a) => a.id !== article.id && a.category_id === article.category_id)
    .slice(0, 3);

  return (
    <PublicLayout>
      <article className="py-8">
        <div className="container">
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
          <header className="mx-auto max-w-4xl">
            {article.category && (
              <Badge
                className="mb-4"
                style={{ backgroundColor: article.category.color }}
              >
                {article.category.name}
              </Badge>
            )}

            <h1 className="mb-4 font-display text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">
              {article.title}
            </h1>

            {article.excerpt && (
              <p className="mb-6 text-lg text-muted-foreground">
                {article.excerpt}
              </p>
            )}

            {/* Meta */}
            <div className="mb-8 flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {article.author && (
                <div className="flex items-center gap-2">
                  <div className="h-10 w-10 overflow-hidden rounded-full bg-secondary">
                    {article.author.avatar_url ? (
                      <img
                        src={article.author.avatar_url}
                        alt={article.author.full_name || ""}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <User className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-medium text-foreground">
                      {article.author.full_name}
                    </span>
                  </div>
                </div>
              )}
              <span className="flex items-center gap-1">
                <Calendar className="h-4 w-4" />
                {publishedDate}
              </span>
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {article.view_count} visualizações
              </span>
            </div>
          </header>

          {/* Featured Image */}
          {article.featured_image && (
            <div className="mx-auto mb-10 max-w-5xl overflow-hidden rounded-xl">
              <img
                src={article.featured_image}
                alt={article.title}
                className="w-full object-cover"
              />
            </div>
          )}

          {/* Content */}
          <div className="mx-auto max-w-3xl">
            <div
              className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-a:text-primary"
              dangerouslySetInnerHTML={{ __html: article.content || "" }}
            />

            {/* Share */}
            <div className="mt-10 border-t border-border pt-6">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-2 text-sm font-medium">
                  <Share2 className="h-4 w-4" />
                  Partilhar
                </span>
                <div className="flex gap-2">
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Twitter className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Facebook className="h-4 w-4" />
                    </a>
                  </Button>
                  <Button variant="outline" size="icon" asChild>
                    <a
                      href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Linkedin className="h-4 w-4" />
                    </a>
                  </Button>
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="mt-12 border-t border-border pt-10">
              <CommentList articleId={article.id} />
            </div>
          </div>
        </div>
      </article>

      {/* Related Articles */}
      {filteredRelated && filteredRelated.length > 0 && (
        <section className="border-t border-border bg-secondary/30 py-12">
          <div className="container">
            <h2 className="mb-8 font-display text-2xl font-bold">
              Artigos Relacionados
            </h2>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredRelated.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}