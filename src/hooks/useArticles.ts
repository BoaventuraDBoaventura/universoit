import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string | null;
  content: string | null;
  featured_image: string | null;
  category_id: string | null;
  author_id: string | null;
  status: "draft" | "published" | "scheduled" | "archived";
  is_featured: boolean;
  is_sponsored: boolean;
  view_count: number;
  published_at: string | null;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  category?: { id: string; name: string; slug: string; color: string } | null;
  author?: { id: string; full_name: string; avatar_url: string | null } | null;
}

export function usePublishedArticles(limit?: number) {
  return useQuery({
    queryKey: ["articles", "published", limit],
    queryFn: async () => {
      let query = supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "published")
        .order("published_at", { ascending: false });

      if (limit) {
        query = query.limit(limit);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useFeaturedArticles() {
  return useQuery({
    queryKey: ["articles", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "published")
        .eq("is_featured", true)
        .order("published_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data as Article[];
    },
  });
}

export function useArticleBySlug(slug: string) {
  return useQuery({
    queryKey: ["article", slug],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url, bio)
        `)
        .eq("slug", slug)
        .maybeSingle();

      if (error) throw error;
      return data as Article | null;
    },
    enabled: !!slug,
  });
}

export function useArticlesByCategory(categorySlug: string) {
  return useQuery({
    queryKey: ["articles", "category", categorySlug],
    queryFn: async () => {
      const { data: category } = await supabase
        .from("categories")
        .select("id, name, slug, description, color")
        .eq("slug", categorySlug)
        .maybeSingle();

      if (!category) return { category: null, articles: [] };

      const { data: articles, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "published")
        .eq("category_id", category.id)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return { category, articles: articles as Article[] };
    },
    enabled: !!categorySlug,
  });
}

export function useCategories() {
  return useQuery({
    queryKey: ["categories"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("categories")
        .select("*")
        .order("display_order", { ascending: true });

      if (error) throw error;
      return data;
    },
  });
}

export function useTags() {
  return useQuery({
    queryKey: ["tags"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tags")
        .select("*")
        .order("name");

      if (error) throw error;
      return data;
    },
  });
}

export function useSearchArticles(query: string) {
  return useQuery({
    queryKey: ["articles", "search", query],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("articles")
        .select(`
          *,
          category:categories(id, name, slug, color),
          author:profiles(id, full_name, avatar_url)
        `)
        .eq("status", "published")
        .or(`title.ilike.%${query}%,excerpt.ilike.%${query}%,content.ilike.%${query}%`)
        .order("published_at", { ascending: false });

      if (error) throw error;
      return data as Article[];
    },
    enabled: query.length > 2,
  });
}