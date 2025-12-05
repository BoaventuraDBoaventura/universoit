import { useParams, Link } from "react-router-dom";
import { PublicLayout } from "@/components/public/PublicLayout";
import { useArticleBySlug, usePublishedArticles } from "@/hooks/useArticles";
import { ArticleSidebar } from "@/components/public/ArticleSidebar";
import { ArticleCard } from "@/components/public/ArticleCard";
import { CommentList } from "@/components/public/CommentList";
import { AdBanner } from "@/components/public/AdBanner";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, User, Eye, ArrowLeft, Share2, Twitter, Facebook, Linkedin, Clock, Bookmark, Tag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDistanceToNow, format } from "date-fns";
import { pt } from "date-fns/locale";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export default function Article() {
  const { slug } = useParams<{ slug: string }>();
  const { data: article, isLoading } = useArticleBySlug(slug || "");
  const { data: allArticles } = usePublishedArticles(10);

  // Fetch article tags
  const { data: articleTags } = useQuery({
    queryKey: ["article-tags-public", article?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("article_tags")
        .select("tag_id, tags(id, name, slug)")
        .eq("article_id", article!.id);
      if (error) throw error;
      return data.map((at) => at.tags).filter(Boolean) as { id: string; name: string; slug: string }[];
    },
    enabled: !!article?.id,
  });

  // Filter related articles by same category, excluding current
  const relatedArticles = allArticles
    ?.filter((a) => a.id !== article?.id && a.category_id === article?.category_id)
    .slice(0, 4) || [];

  // More articles from different categories
  const moreArticles = allArticles
    ?.filter((a) => a.id !== article?.id && a.category_id !== article?.category_id)
    .slice(0, 3) || [];

  if (isLoading) {
    return (
      <PublicLayout>
        <div className="container py-8">
          <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
            <div>
              <Skeleton className="mb-4 h-6 w-24" />
              <Skeleton className="mb-4 h-12 w-full" />
              <Skeleton className="mb-8 h-6 w-3/4" />
              <Skeleton className="aspect-video w-full rounded-xl" />
            </div>
            <div className="hidden lg:block">
              <Skeleton className="h-48 w-full rounded-xl" />
            </div>
          </div>
        </div>
      </PublicLayout>
    );
  }

  if (!article) {
    return (
      <PublicLayout>
        <div className="container py-16 text-center">
          <div className="mx-auto max-w-md">
            <div className="mb-6 flex justify-center">
              <div className="rounded-full bg-muted p-4">
                <Bookmark className="h-8 w-8 text-muted-foreground" />
              </div>
            </div>
            <h1 className="mb-4 font-display text-2xl font-bold">Artigo não encontrado</h1>
            <p className="mb-8 text-muted-foreground">
              O artigo que procura não existe ou foi removido.
            </p>
            <Button asChild>
              <Link to="/">Voltar ao início</Link>
            </Button>
          </div>
        </div>
      </PublicLayout>
    );
  }

  const publishedDate = article.published_at
    ? format(new Date(article.published_at), "d 'de' MMMM 'de' yyyy", { locale: pt })
    : "";

  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: pt })
    : "";

  const shareUrl = window.location.href;
  const shareTitle = encodeURIComponent(article.title);

  // Estimate reading time (avg 200 words per minute)
  const wordCount = article.content?.split(/\s+/).length || 0;
  const readingTime = Math.max(1, Math.ceil(wordCount / 200));

  return (
    <PublicLayout>
      <article className="py-8">
        <div className="container">
          {/* Breadcrumb */}
          <nav className="mb-6 flex items-center gap-2 text-sm">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              Início
            </Link>
            <span className="text-muted-foreground">/</span>
            {article.category && (
              <>
                <Link
                  to={`/categoria/${article.category.slug}`}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  {article.category.name}
                </Link>
                <span className="text-muted-foreground">/</span>
              </>
            )}
            <span className="truncate text-foreground">{article.title}</span>
          </nav>

          {/* Two-column layout */}
          <div className="grid gap-10 lg:grid-cols-[1fr_320px]">
            {/* Main Content */}
            <div className="min-w-0">
              {/* Header */}
              <header className="mb-8">
                <div className="mb-4 flex flex-wrap items-center gap-2">
                  {article.category && (
                    <Badge
                      className="font-medium"
                      style={{ backgroundColor: article.category.color }}
                    >
                      {article.category.name}
                    </Badge>
                  )}
                  {article.is_sponsored && (
                    <Badge variant="outline" className="border-amber-500/50 text-amber-600">
                      Patrocinado
                    </Badge>
                  )}
                </div>

                <h1 className="mb-4 font-display text-3xl font-bold leading-tight tracking-tight md:text-4xl lg:text-[2.75rem]">
                  {article.title}
                </h1>

                {article.excerpt && (
                  <p className="mb-6 text-lg leading-relaxed text-muted-foreground">
                    {article.excerpt}
                  </p>
                )}

                {/* Meta info */}
                <div className="flex flex-wrap items-center gap-x-6 gap-y-3 text-sm text-muted-foreground">
                  {article.author && (
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/5">
                        {article.author.avatar_url ? (
                          <img
                            src={article.author.avatar_url}
                            alt={article.author.full_name || ""}
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center">
                            <User className="h-4 w-4 text-primary/60" />
                          </div>
                        )}
                      </div>
                      <span className="font-medium text-foreground">
                        {article.author.full_name}
                      </span>
                    </div>
                  )}
                  <span className="flex items-center gap-1.5">
                    <Calendar className="h-4 w-4" />
                    {publishedDate}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Clock className="h-4 w-4" />
                    {readingTime} min de leitura
                  </span>
                  <span className="flex items-center gap-1.5">
                    <Eye className="h-4 w-4" />
                    {article.view_count?.toLocaleString()} views
                  </span>
                </div>
              </header>

              {/* Featured Image */}
              {article.featured_image && (
                <figure className="mb-10 overflow-hidden rounded-2xl border border-border/50 shadow-lg">
                  <img
                    src={article.featured_image}
                    alt={article.title}
                    className="aspect-video w-full object-cover"
                  />
                </figure>
              )}

              {/* Article Content */}
              <div
                className="prose prose-lg max-w-none dark:prose-invert prose-headings:font-display prose-headings:tracking-tight prose-a:text-primary prose-img:rounded-xl"
                dangerouslySetInnerHTML={{ __html: article.content || "" }}
              />

              {/* Tags */}
              {articleTags && articleTags.length > 0 && (
                <div className="mt-8 flex flex-wrap items-center gap-2">
                  <Tag className="h-4 w-4 text-muted-foreground" />
                  {articleTags.map((tag) => (
                    <Badge key={tag.id} variant="secondary">
                      {tag.name}
                    </Badge>
                  ))}
                </div>
              )}

              {/* In-Article Ad */}
              <div className="my-10">
                <AdBanner position="in_article" />
              </div>

              {/* Share Section */}
              <div className="mt-12 rounded-xl border border-border/50 bg-card/50 p-6">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                      <Share2 className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Gostou deste artigo?</p>
                      <p className="text-sm text-muted-foreground">Partilhe com os seus amigos</p>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a
                        href={`https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Twitter className="h-4 w-4" />
                        Twitter
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a
                        href={`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Facebook className="h-4 w-4" />
                        Facebook
                      </a>
                    </Button>
                    <Button variant="outline" size="sm" className="gap-2" asChild>
                      <a
                        href={`https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <Linkedin className="h-4 w-4" />
                        LinkedIn
                      </a>
                    </Button>
                  </div>
                </div>
              </div>

              {/* Comments Section */}
              <section className="mt-12">
                <Separator className="mb-10" />
                <CommentList articleId={article.id} />
              </section>
            </div>

            {/* Sidebar */}
            <div className="hidden lg:block">
              <div className="sticky top-24">
                <ArticleSidebar
                  relatedArticles={relatedArticles}
                  author={article.author}
                  category={article.category}
                />
              </div>
            </div>
          </div>
        </div>
      </article>

      {/* More Articles Section */}
      {moreArticles.length > 0 && (
        <section className="border-t border-border bg-gradient-to-b from-secondary/30 to-transparent py-16">
          <div className="container">
            <div className="mb-8 flex items-center justify-between">
              <h2 className="font-display text-2xl font-bold">
                Mais Artigos
              </h2>
              <Button variant="ghost" asChild>
                <Link to="/">Ver todos →</Link>
              </Button>
            </div>
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {moreArticles.map((article) => (
                <ArticleCard key={article.id} article={article} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Mobile Related Articles */}
      {relatedArticles.length > 0 && (
        <section className="border-t border-border py-12 lg:hidden">
          <div className="container">
            <h2 className="mb-6 font-display text-xl font-bold">
              Artigos Relacionados
            </h2>
            <div className="grid gap-4 sm:grid-cols-2">
              {relatedArticles.slice(0, 2).map((article) => (
                <ArticleCard key={article.id} article={article} variant="compact" />
              ))}
            </div>
          </div>
        </section>
      )}
    </PublicLayout>
  );
}
