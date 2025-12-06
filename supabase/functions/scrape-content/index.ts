import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY_ENV = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ImportRequest {
  article_url: string;
  category_id?: string;
  firecrawl_api_key?: string; // Optional: passed from frontend
}

// Convert markdown to simple HTML
function markdownToHtml(markdown: string): string {
  let html = markdown
    // Headers
    .replace(/^######\s+(.+)$/gm, '<h6>$1</h6>')
    .replace(/^#####\s+(.+)$/gm, '<h5>$1</h5>')
    .replace(/^####\s+(.+)$/gm, '<h4>$1</h4>')
    .replace(/^###\s+(.+)$/gm, '<h3>$1</h3>')
    .replace(/^##\s+(.+)$/gm, '<h2>$1</h2>')
    .replace(/^#\s+(.+)$/gm, '<h1>$1</h1>')
    // Bold and italic
    .replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.+?)\*/g, '<em>$1</em>')
    // Images - keep them with styling
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="rounded-lg max-w-full my-4" />')
    // Links
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
    // Line breaks and paragraphs
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '');
  
  // Don't wrap headers in paragraphs
  html = html.replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  
  return html;
}

// Clean content by removing unwanted sections
function cleanContent(markdown: string, featuredImage: string | null): string {
  let content = markdown;
  
  // Remove common unwanted patterns (social media, navigation, etc.)
  const patternsToRemove = [
    // Social media and sharing
    /\[?(facebook|twitter|linkedin|whatsapp|telegram|instagram|pinterest|compartilhar?|share|seguir?|follow)\]?\s*(\([^)]*\))?/gi,
    // Author/editor sections at the end
    /^(por|by|autor|author|escrito por|written by)\s*:?\s*.+$/gmi,
    // Newsletter/subscription CTAs
    /(inscreva-se|subscribe|newsletter|cadastre-se|sign up).+$/gmi,
    // Related articles sections
    /^(leia também|read also|veja também|see also|relacionados|related).+$/gmi,
    // Comments sections
    /^(comentários|comments|deixe .+ comentário).+$/gmi,
    // Copyright notices
    /^(©|copyright|\(c\)).+$/gmi,
    // Tags and categories labels
    /^(tags?|categorias?|categories)\s*:.*$/gmi,
    // Navigation breadcrumbs
    /^(home|início)\s*[>\/].+$/gmi,
    // Social media icons/links
    /\[?\s*(fb|tw|ig|yt|tiktok)\s*\]?/gi,
    // Empty links
    /\[\s*\]\([^)]*\)/g,
    // Multiple consecutive line breaks
    /\n{4,}/g,
  ];
  
  for (const pattern of patternsToRemove) {
    content = content.replace(pattern, '');
  }
  
  // Remove the featured image from content if it appears at the start
  if (featuredImage) {
    // Extract filename or unique part of the image URL
    const imageFilename = featuredImage.split('/').pop()?.split('?')[0] || '';
    if (imageFilename) {
      // Remove markdown image that contains the featured image
      const escapedFilename = imageFilename.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      content = content.replace(new RegExp(`!\\[[^\\]]*\\]\\([^)]*${escapedFilename}[^)]*\\)`, 'gi'), '');
    }
  }
  
  // Remove first image if it looks like a header/featured image (usually at the very start)
  content = content.replace(/^!\[[^\]]*\]\([^)]+\)\s*\n*/i, '');
  
  // Clean up excessive whitespace
  content = content
    .replace(/^\s+/gm, '') // Remove leading whitespace from lines
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .trim();
  
  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { article_url, category_id, firecrawl_api_key }: ImportRequest = await req.json();
    
    // Use passed API key or fall back to environment variable
    const FIRECRAWL_API_KEY = firecrawl_api_key || FIRECRAWL_API_KEY_ENV;
    
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY não configurada. Configure nas definições.' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    if (!article_url) {
      return new Response(
        JSON.stringify({ error: 'URL do artigo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Importing article from: ${article_url}`);

    // Check if article was already imported
    const { data: existingImport } = await supabase
      .from('imported_articles')
      .select('id, article_id')
      .eq('original_url', article_url)
      .single();

    if (existingImport) {
      return new Response(
        JSON.stringify({ 
          error: 'Este artigo já foi importado anteriormente',
          article_id: existingImport.article_id 
        }),
        { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Scrape the article using Firecrawl - request only markdown for cleaner content
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: article_url,
        formats: ['markdown'],
        onlyMainContent: true,
      }),
    });

    if (!scrapeResponse.ok) {
      const errorText = await scrapeResponse.text();
      console.error('Firecrawl error:', errorText);
      return new Response(
        JSON.stringify({ error: 'Falha ao buscar o artigo', details: errorText }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const scrapeData = await scrapeResponse.json();
    
    if (!scrapeData.success || !scrapeData.data) {
      console.error('No data returned from scrape');
      return new Response(
        JSON.stringify({ error: 'Não foi possível extrair conteúdo do artigo' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const { metadata, markdown } = scrapeData.data;
    
    // Extract article metadata
    const rawTitle = metadata?.title || metadata?.ogTitle || 'Artigo Importado';
    // Clean title - remove site name suffix
    const title = rawTitle
      .replace(/\s*[-|•–—]\s*[^-|•–—]+$/, '')
      .trim();
    
    const description = metadata?.description || metadata?.ogDescription || '';
    const ogImage = metadata?.ogImage || metadata?.image;
    
    console.log(`Title: ${title}`);
    console.log(`Featured image: ${ogImage}`);

    // Clean the markdown content
    const cleanedMarkdown = cleanContent(markdown || '', ogImage);
    
    // Convert cleaned markdown to HTML
    const articleContent = markdownToHtml(cleanedMarkdown);
    
    console.log(`Content length: ${articleContent.length} characters`);

    // Create excerpt from description
    const excerpt = description
      .replace(/<[^>]*>/g, '')
      .substring(0, 300)
      .trim();

    // Create slug
    const slug = title
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '')
      .substring(0, 100) + '-' + Date.now().toString(36);

    // Create the article as draft
    const { data: newArticle, error: articleError } = await supabase
      .from('articles')
      .insert({
        title,
        slug,
        excerpt: excerpt || null,
        content: articleContent,
        featured_image: ogImage || null,
        category_id: category_id || null,
        status: 'draft',
      })
      .select()
      .single();

    if (articleError) {
      console.error('Error creating article:', articleError);
      return new Response(
        JSON.stringify({ error: 'Erro ao criar artigo', details: articleError.message }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Record the import
    await supabase
      .from('imported_articles')
      .insert({
        original_url: article_url,
        original_title: title,
        article_id: newArticle.id,
        status: 'imported',
      });

    console.log(`Successfully imported: ${title}`);

    return new Response(
      JSON.stringify({
        success: true,
        article: {
          id: newArticle.id,
          title,
          excerpt,
          featured_image: ogImage,
          slug: newArticle.slug,
        },
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Import error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Erro desconhecido' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});