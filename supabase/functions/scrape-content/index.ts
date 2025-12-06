import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ScrapeRequest {
  source_id: string;
  max_articles?: number;
}

interface ArticleData {
  url: string;
  title: string;
  excerpt?: string;
  content?: string;
  image?: string;
}

// Patterns that indicate a URL is NOT an article (pagination, categories, etc.)
const NON_ARTICLE_PATTERNS = [
  /\/page\/\d+$/i,           // pagination only at end
  /\/pagina\/\d+$/i,
  /\/editorias\/?$/i,        // category listings
  /\/search\/?$/i,
  /\/pesquisa\/?$/i,
  /\/contact\/?$/i,
  /\/contato\/?$/i,
  /\/about\/?$/i,
  /\/sobre\/?$/i,
  /\/privacy\/?$/i,
  /\/privacidade\/?$/i,
  /\/terms\/?$/i,
  /\/termos\/?$/i,
  /\/login\/?$/i,
  /\/register\/?$/i,
  /\/feed\/?$/i,
  /\/rss\/?$/i,
  /\/#/,
  /\.xml$/i,
  /\.json$/i,
];

function isArticleUrl(url: string, baseUrl: string): boolean {
  try {
    const urlObj = new URL(url);
    const baseObj = new URL(baseUrl);
    
    // Must be from the same domain
    if (urlObj.hostname !== baseObj.hostname) return false;
    
    const path = urlObj.pathname;
    
    // Skip homepage
    if (path === '/' || path === '') return false;
    
    // Check against non-article patterns
    for (const pattern of NON_ARTICLE_PATTERNS) {
      if (pattern.test(path)) return false;
    }
    
    // Articles typically have dates or slugs in the URL
    // Accept URLs with date patterns (e.g., /2025/12/06/article-slug)
    const hasDatePattern = /\/\d{4}\/\d{2}\/\d{2}\//.test(path);
    
    // Or URLs that end with a long slug (likely an article)
    const segments = path.split('/').filter(Boolean);
    const lastSegment = segments[segments.length - 1] || '';
    
    // Article slugs typically:
    // - Have at least 10 characters (meaningful title)
    // - Contain hyphens (slug format)
    // - Are not just numbers
    const isLikelySlug = lastSegment.length >= 10 && 
                         lastSegment.includes('-') && 
                         !/^\d+$/.test(lastSegment);
    
    // Accept if has date pattern OR looks like an article slug
    return hasDatePattern || isLikelySlug;
    
  } catch {
    return false;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { source_id, max_articles = 5 }: ScrapeRequest = await req.json();

    console.log(`Starting scrape for source: ${source_id}, max_articles: ${max_articles}`);

    // Get source details
    const { data: source, error: sourceError } = await supabase
      .from('content_sources')
      .select('*, category:categories(id, name)')
      .eq('id', source_id)
      .single();

    if (sourceError || !source) {
      console.error('Source not found:', sourceError);
      return new Response(
        JSON.stringify({ error: 'Source not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Scraping source: ${source.name} - ${source.scrape_url}`);

    // Step 1: Use Firecrawl to map the page and discover article links
    const mapResponse = await fetch('https://api.firecrawl.dev/v1/map', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: source.scrape_url,
        limit: max_articles * 3, // Get more to filter properly
      }),
    });

    if (!mapResponse.ok) {
      const errorText = await mapResponse.text();
      console.error('Firecrawl map error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Failed to map website', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const mapData = await mapResponse.json();
    console.log(`Found ${mapData.links?.length || 0} links from map`);

    if (!mapData.success || !mapData.links || mapData.links.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No links found on the page', imported: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Filter to get only article URLs (exclude category, tag, pagination pages)
    const articleLinks = mapData.links
      .filter((link: string) => isArticleUrl(link, source.url))
      .slice(0, max_articles);

    console.log(`Filtered to ${articleLinks.length} potential article links`);

    if (articleLinks.length === 0) {
      console.log('No valid article links found after filtering');
      return new Response(
        JSON.stringify({ message: 'No valid article links found', imported: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get already imported URLs to avoid duplicates
    const { data: existingImports } = await supabase
      .from('imported_articles')
      .select('original_url')
      .eq('source_id', source_id);

    const importedUrls = new Set(existingImports?.map(i => i.original_url) || []);
    const newLinks = articleLinks.filter((link: string) => !importedUrls.has(link));

    console.log(`${newLinks.length} new article links to process`);

    if (newLinks.length === 0) {
      await supabase
        .from('content_sources')
        .update({ last_scraped_at: new Date().toISOString() })
        .eq('id', source_id);

      return new Response(
        JSON.stringify({ message: 'No new articles found', imported: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Step 2: Scrape each article - focusing ONLY on article content
    const importedArticles: ArticleData[] = [];
    
    for (const articleUrl of newLinks.slice(0, max_articles)) {
      try {
        console.log(`Scraping article: ${articleUrl}`);
        
        // Use onlyMainContent to extract just the article, not navigation/sidebars
        const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            url: articleUrl,
            formats: ['markdown', 'html'],
            onlyMainContent: true, // Extract only the main article content
            includeTags: ['article', 'main', '.post-content', '.article-content', '.entry-content'],
            excludeTags: ['nav', 'header', 'footer', 'aside', '.sidebar', '.comments', '.related', '.advertisement', '.ad', '.social-share'],
          }),
        });

        if (!scrapeResponse.ok) {
          console.error(`Failed to scrape ${articleUrl}: ${scrapeResponse.status}`);
          continue;
        }

        const scrapeData = await scrapeResponse.json();
        
        if (!scrapeData.success || !scrapeData.data) {
          console.error(`No data returned for ${articleUrl}`);
          continue;
        }

        const { metadata, markdown } = scrapeData.data;
        
        // Extract article-specific data from metadata
        const title = metadata?.title || metadata?.ogTitle || 'Untitled Article';
        const description = metadata?.description || metadata?.ogDescription || '';
        const ogImage = metadata?.ogImage || metadata?.image;
        
        // Clean up the title (remove site name suffix if present)
        const cleanTitle = title
          .replace(/\s*[-|•–]\s*[^-|•–]+$/, '') // Remove " - Site Name" or " | Site Name"
          .trim();

        // Skip if title looks like a category/listing page
        if (cleanTitle.toLowerCase().includes('página') || 
            cleanTitle.toLowerCase().includes('page ') ||
            cleanTitle.match(/^(categoria|category|tag|arquivo|archive)/i)) {
          console.log(`Skipping non-article page: ${cleanTitle}`);
          continue;
        }
        
        // Create a clean excerpt from description (max 300 chars)
        const excerpt = description
          .replace(/<[^>]*>/g, '') // Remove any HTML tags
          .substring(0, 300)
          .trim();

        // Clean markdown content - remove any remaining navigation/footer text
        const cleanContent = markdown
          ? markdown
              .replace(/^#+\s*(Menu|Navigation|Navegação|Links)[\s\S]*?(?=^#|\n\n)/gmi, '')
              .replace(/\n{3,}/g, '\n\n')
              .trim()
          : description;

        // Create slug from clean title
        const slug = cleanTitle
          .toLowerCase()
          .normalize('NFD')
          .replace(/[\u0300-\u036f]/g, '')
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/^-|-$/g, '')
          .substring(0, 100) + '-' + Date.now().toString(36);

        // Create draft article with clean, article-only content
        const { data: newArticle, error: articleError } = await supabase
          .from('articles')
          .insert({
            title: cleanTitle,
            slug,
            excerpt: excerpt || null,
            content: cleanContent,
            featured_image: ogImage || null,
            category_id: source.category_id,
            source_id: source.id,
            status: 'draft',
          })
          .select()
          .single();

        if (articleError) {
          console.error('Error creating article:', articleError);
          continue;
        }

        // Record in imported_articles
        await supabase
          .from('imported_articles')
          .insert({
            source_id: source.id,
            original_url: articleUrl,
            original_title: cleanTitle,
            article_id: newArticle.id,
            status: 'imported',
          });

        importedArticles.push({
          url: articleUrl,
          title: cleanTitle,
          excerpt: excerpt,
          image: ogImage,
        });

        console.log(`Successfully imported article: ${cleanTitle}`);
      } catch (err) {
        console.error(`Error processing ${articleUrl}:`, err);
      }
    }

    // Update source stats
    await supabase
      .from('content_sources')
      .update({
        last_scraped_at: new Date().toISOString(),
        articles_imported: source.articles_imported + importedArticles.length,
      })
      .eq('id', source_id);

    console.log(`Scraping complete. Imported ${importedArticles.length} articles.`);

    return new Response(
      JSON.stringify({
        success: true,
        imported: importedArticles.length,
        articles: importedArticles,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Scrape error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
