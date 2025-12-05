import { Link } from "react-router-dom";
import { Article } from "@/hooks/useArticles";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { User, Clock, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ArticleSidebarProps {
  relatedArticles: Article[];
  author?: {
    id: string;
    full_name: string;
    avatar_url: string | null;
    bio?: string | null;
  } | null;
  category?: {
    id: string;
    name: string;
    slug: string;
    color: string;
  } | null;
}

export function ArticleSidebar({ relatedArticles, author, category }: ArticleSidebarProps) {
  return (
    <aside className="space-y-6">
      {/* Author Card */}
      {author && (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <User className="h-4 w-4" />
              Sobre o Autor
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full bg-gradient-to-br from-primary/20 to-primary/5 ring-2 ring-primary/20">
                {author.avatar_url ? (
                  <img
                    src={author.avatar_url}
                    alt={author.full_name || ""}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center">
                    <User className="h-7 w-7 text-primary/60" />
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <h4 className="font-display font-semibold text-foreground">
                  {author.full_name}
                </h4>
                {author.bio && (
                  <p className="mt-1 line-clamp-3 text-sm text-muted-foreground">
                    {author.bio}
                  </p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Category Card */}
      {category && (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardContent className="p-4">
            <Link 
              to={`/categoria/${category.slug}`}
              className="group flex items-center gap-3"
            >
              <div 
                className="flex h-10 w-10 items-center justify-center rounded-lg"
                style={{ backgroundColor: `${category.color}20` }}
              >
                <TrendingUp className="h-5 w-5" style={{ color: category.color }} />
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Categoria</p>
                <p className="font-medium text-foreground group-hover:text-primary transition-colors">
                  {category.name}
                </p>
              </div>
            </Link>
          </CardContent>
        </Card>
      )}

      {/* Related Articles */}
      {relatedArticles.length > 0 && (
        <Card className="overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <TrendingUp className="h-4 w-4" />
              Artigos Relacionados
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {relatedArticles.map((article, index) => (
              <div key={article.id}>
                <Link to={`/artigo/${article.slug}`} className="group block">
                  <div className="flex gap-3">
                    {article.featured_image && (
                      <div className="h-16 w-20 shrink-0 overflow-hidden rounded-md bg-muted">
                        <img
                          src={article.featured_image}
                          alt={article.title}
                          className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="min-w-0 flex-1">
                      <h4 className="line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                        {article.title}
                      </h4>
                      <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {article.published_at &&
                          formatDistanceToNow(new Date(article.published_at), {
                            addSuffix: true,
                            locale: pt,
                          })}
                      </div>
                    </div>
                  </div>
                </Link>
                {index < relatedArticles.length - 1 && (
                  <Separator className="mt-4" />
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Newsletter CTA */}
      <Card className="overflow-hidden border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent">
        <CardContent className="p-5">
          <h4 className="font-display font-semibold text-foreground">
            Subscreva a Newsletter
          </h4>
          <p className="mt-1 text-sm text-muted-foreground">
            Receba as últimas notícias de tecnologia diretamente no seu email.
          </p>
          <Link 
            to="/#newsletter"
            className="mt-3 inline-flex items-center text-sm font-medium text-primary hover:underline"
          >
            Subscrever agora →
          </Link>
        </CardContent>
      </Card>
    </aside>
  );
}
