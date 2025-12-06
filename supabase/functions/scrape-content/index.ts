import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.86.2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const FIRECRAWL_API_KEY = Deno.env.get('FIRECRAWL_API_KEY');
const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

interface ImportRequest {
  article_url: string;
  category_id?: string;
}

// Convert markdown to simple HTML - text only, no images or links
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
    // Remove any remaining images
    .replace(/!\[[^\]]*\]\([^)]+\)/g, '')
    // Remove any remaining links, keep text
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove raw URLs
    .replace(/https?:\/\/[^\s<>]+/g, '')
    // Line breaks and paragraphs
    .replace(/\n\n+/g, '</p><p>')
    .replace(/\n/g, '<br />');
  
  // Wrap in paragraph tags
  html = '<p>' + html + '</p>';
  
  // Clean up empty paragraphs
  html = html.replace(/<p><\/p>/g, '').replace(/<p>\s*<\/p>/g, '');
  
  // Don't wrap headers in paragraphs
  html = html.replace(/<p>(<h[1-6]>)/g, '$1').replace(/(<\/h[1-6]>)<\/p>/g, '$1');
  
  // Remove empty tags
  html = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '');
  html = html.replace(/(<br\s*\/?>){3,}/g, '<br /><br />');
  
  return html;
}

// Clean content by removing ALL unwanted sections - keep ONLY article text
function cleanContent(markdown: string, featuredImage: string | null): string {
  let content = markdown;
  
  // First, remove ALL images (including featured image in content)
  content = content.replace(/!\[[^\]]*\]\([^)]+\)/g, '');
  
  // Remove ALL links but keep the text inside
  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove raw URLs
  content = content.replace(/https?:\/\/[^\s\)]+/g, '');
  
  // Remove common unwanted patterns
  const patternsToRemove = [
    // Social media and sharing (any format)
    /\b(facebook|twitter|linkedin|whatsapp|telegram|instagram|pinterest|youtube|tiktok|x\.com)\b/gi,
    /(compartilhar?|share|seguir?|follow|curtir|like)\s*(no|on|via)?\s*(facebook|twitter|linkedin|whatsapp|instagram)?/gi,
    
    // Author/editor/source sections
    /^(por|by|autor|author|escrito por|written by|fonte|source|créditos?|credits?)\s*:?\s*.+$/gmi,
    /(foto|imagem|image|photo)\s*:?\s*(reprodução|divulgação|arquivo|getty|shutterstock|unsplash|pixabay).*/gi,
    /\(?reprodução\)?/gi,
    /\(?divulgação\)?/gi,
    
    // Newsletter/subscription CTAs
    /(inscreva-se|subscribe|newsletter|cadastre-se|sign up|assine|receba).{0,100}(email|e-mail|grátis|free|notícias)/gi,
    
    // Related articles sections
    /^(leia também|read also|veja também|see also|relacionados|related|confira|saiba mais|leia mais).+$/gmi,
    /(leia também|veja também|confira também|saiba mais|leia mais)\s*:?/gi,
    
    // Comments sections
    /^(comentários|comments|deixe .+ comentário|comente).+$/gmi,
    
    // Copyright notices and site info
    /^(©|copyright|\(c\)|todos os direitos|all rights).+$/gmi,
    /\d{4}\s*[-–]\s*\d{4}.*direitos/gi,
    
    // Tags and categories labels
    /^(tags?|categorias?|categories|etiquetas?)\s*:.*$/gmi,
    
    // Navigation breadcrumbs and menus
    /^(home|início|menu|navegação)\s*[>\/].+$/gmi,
    
    // Social icons text (common icon labels)
    /\b(fb|tw|ig|yt|li|pin)\b/gi,
    
    // Empty brackets/links
    /\[\s*\]/g,
    /\(\s*\)/g,
    
    // Edition info
    /(edição|edition|editado por|edited by)\s*:?\s*.*/gi,
    
    // Time stamps at weird places
    /\b\d{1,2}[h:]\d{2}\s*(min)?\.?\s*$/gm,
    
    // Site names and footers (common patterns)
    /publicado\s+(em|por|via)\s+.+$/gmi,
    /atualizado\s+(em|há)\s+.+$/gmi,
    
    // Ad/banner placeholders
    /(anúncio|publicidade|advertisement|sponsored|patrocinado)/gi,
    
    // Rating/review widgets
    /\d+\s*(estrelas?|stars?|votos?|votes?)/gi,
    
    // Print/share buttons text
    /(imprimir|print|enviar|send|salvar|save)\s*(artigo|matéria|notícia)?/gi,
    
    // More patterns for editorial info
    /^(redação|editorial|edição)\b.*$/gmi,
    /^(publicado|postado|criado)\s+.+$/gmi,
  ];
  
  for (const pattern of patternsToRemove) {
    content = content.replace(pattern, '');
  }
  
  // Remove lines that are just markdown formatting characters or single words
  content = content
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      // Remove lines that are too short (likely navigation or UI elements)
      if (trimmed.length > 0 && trimmed.length < 5 && !/^[#\-*]/.test(trimmed)) {
        return false;
      }
      // Remove lines that are just symbols
      if (/^[*\-_=|]+$/.test(trimmed)) {
        return false;
      }
      return true;
    })
    .join('\n');
  
  // Clean up excessive whitespace
  content = content
    .replace(/^\s+/gm, '') // Remove leading whitespace from lines
    .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive line breaks
    .replace(/^\s*\n/gm, '\n') // Remove blank lines at start
    .trim();
  
  return content;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    if (!FIRECRAWL_API_KEY) {
      console.error('FIRECRAWL_API_KEY not configured');
      return new Response(
        JSON.stringify({ error: 'FIRECRAWL_API_KEY não configurada' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
    const { article_url, category_id }: ImportRequest = await req.json();

    if (!article_url) {
      return new Response(
        JSON.stringify({ error: 'URL do artigo é obrigatório' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Importing article from: ${article_url}`);

    // Check if article was already imported (and still exists)
    const { data: existingImport } = await supabase
      .from('imported_articles')
      .select('id, article_id')
      .eq('original_url', article_url)
      .maybeSingle();

    if (existingImport && existingImport.article_id) {
      // Check if the article still exists
      const { data: existingArticle } = await supabase
        .from('articles')
        .select('id')
        .eq('id', existingImport.article_id)
        .maybeSingle();
      
      if (existingArticle) {
        return new Response(
          JSON.stringify({ 
            error: 'Este artigo já foi importado anteriormente',
            article_id: existingImport.article_id 
          }),
          { status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }
    
    // If there's an orphaned import record, delete it
    if (existingImport) {
      await supabase
        .from('imported_articles')
        .delete()
        .eq('id', existingImport.id);
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