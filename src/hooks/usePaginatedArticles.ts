import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Article } from "./useArticles";

interface PaginatedResult {
  articles: Article[];
  totalCount: number;
  totalPages: number;
}

export function usePaginatedArticles(page: number, pageSize: number = 6) {
  return useQuery({
    queryKey: ["articles", "published", "paginated", page, pageSize],
    queryFn: async (): Promise<PaginatedResult> => {
      const from = (page - 1) * pageSize;
      const to = from + pageSize - 1;

      // Get total count
      const { count, error: countError } = await supabase
        .from("articles")
        .select("*", { count: "exact", head: true })
        .eq("status", "published")
        .eq("is_featured", false);

      if (countError) throw countError;

      // Get paginated articles
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "published")
        .eq("is_featured", false)
        .order("published_at", { ascending: false })
        .range(from, to);

      if (error) throw error;

      const totalCount = count || 0;
      const totalPages = Math.ceil(totalCount / pageSize);

      return {
        articles: data as Article[],
        totalCount,
        totalPages,
      };
    },
  });
}
