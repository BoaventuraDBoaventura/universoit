import { Link } from "react-router-dom";
import { Calendar, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { LazyImage } from "@/components/ui/lazy-image";
import { Article } from "@/hooks/useArticles";
import { formatDistanceToNow } from "date-fns";
import { pt } from "date-fns/locale";

interface ArticleCardProps {
  article: Article;
  variant?: "default" | "featured" | "compact";
}

export function ArticleCard({ article, variant = "default" }: ArticleCardProps) {
  const timeAgo = article.published_at
    ? formatDistanceToNow(new Date(article.published_at), { addSuffix: true, locale: pt })
    : "";

  if (variant === "featured") {
    return (
      <Link
        to={`/artigo/${article.slug}`}
        className="group relative block overflow-hidden rounded-xl"
      >
        <div className="aspect-[16/9] overflow-hidden">
          <LazyImage
            src={article.featured_image || "/placeholder.svg"}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
          />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-foreground/90 via-foreground/40 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 p-6">
          {article.category && (
            <Badge
              className="mb-3"
              style={{ backgroundColor: article.category.color }}
            >
              {article.category.name}
            </Badge>
          )}
          <h2 className="mb-2 font-display text-2xl font-bold text-primary-foreground md:text-3xl">
            {article.title}
          </h2>
          {article.excerpt && (
            <p className="mb-4 line-clamp-2 text-sm text-primary-foreground/80">
              {article.excerpt}
            </p>
          )}
          <div className="flex items-center gap-4 text-xs text-primary-foreground/70">
            {article.author && (
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                {article.author.full_name}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-3 w-3" />
              {timeAgo}
            </span>
          </div>
        </div>
      </Link>
    );
  }

  if (variant === "compact") {
    return (
      <Link
        to={`/artigo/${article.slug}`}
        className="group flex gap-4 py-4"
      >
        <div className="h-20 w-28 flex-shrink-0 overflow-hidden rounded-lg">
          <LazyImage
            src={article.featured_image || "/placeholder.svg"}
            alt={article.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </div>
        <div className="flex flex-col justify-center">
          <h3 className="font-medium leading-tight transition-colors group-hover:text-primary line-clamp-2">
            {article.title}
          </h3>
          <span className="mt-1 text-xs text-muted-foreground">{timeAgo}</span>
        </div>
      </Link>
    );
  }

  return (
    <Link
      to={`/artigo/${article.slug}`}
      className="group block overflow-hidden rounded-xl bg-card shadow-card transition-all hover:shadow-card-hover"
    >
      <div className="aspect-[16/10] overflow-hidden">
        <LazyImage
          src={article.featured_image || "/placeholder.svg"}
          alt={article.title}
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      </div>
      <div className="p-5">
        {article.category && (
          <Badge
            variant="secondary"
            className="mb-3 text-xs"
            style={{ backgroundColor: `${article.category.color}20`, color: article.category.color }}
          >
            {article.category.name}
          </Badge>
        )}
        <h3 className="mb-2 font-display text-lg font-semibold leading-tight transition-colors group-hover:text-primary line-clamp-2">
          {article.title}
        </h3>
        {article.excerpt && (
          <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
            {article.excerpt}
          </p>
        )}
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          {article.author && (
            <span className="flex items-center gap-1">
              <User className="h-3 w-3" />
              {article.author.full_name}
            </span>
          )}
          <span>{timeAgo}</span>
        </div>
      </div>
    </Link>
  );
}