import { Helmet } from "react-helmet-async";
import { Article } from "@/hooks/useArticles";

interface ArticleJsonLdProps {
  article: Article;
  url: string;
  tags?: { name: string }[];
}

export function ArticleJsonLd({ article, url, tags }: ArticleJsonLdProps) {
  const siteUrl = window.location.origin;
  
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "NewsArticle",
    headline: article.title,
    description: article.excerpt || "",
    image: article.featured_image ? [article.featured_image] : [`${siteUrl}/favicon.png`],
    datePublished: article.published_at,
    dateModified: article.updated_at || article.published_at,
    author: article.author ? {
      "@type": "Person",
      name: article.author.full_name,
      ...(article.author.avatar_url && { image: article.author.avatar_url }),
    } : undefined,
    publisher: {
      "@type": "Organization",
      name: "Universo IT",
      logo: {
        "@type": "ImageObject",
        url: `${siteUrl}/favicon.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": url,
    },
    articleSection: article.category?.name,
    ...(tags && tags.length > 0 && { keywords: tags.map(t => t.name).join(", ") }),
    wordCount: article.content?.split(/\s+/).length || 0,
    ...(article.is_sponsored && { isAccessibleForFree: true, sponsor: { "@type": "Organization", name: "Patrocinador" } }),
  };

  return (
    <Helmet>
      <script type="application/ld+json">
        {JSON.stringify(jsonLd)}
      </script>
    </Helmet>
  );
}
