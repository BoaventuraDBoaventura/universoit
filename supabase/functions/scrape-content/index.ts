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

// Check if URL is a valid content image (not an icon or social media)
function isValidContentImage(url: string): boolean {
  if (!url) return false;
  
  // Must be a valid http/https URL
  if (!url.startsWith('http://') && !url.startsWith('https://')) return false;
  
  // Skip social media icons and small images
  const invalidPatterns = [
    /icon/i,
    /logo/i,
    /avatar/i,
    /favicon/i,
    /badge/i,
    /button/i,
    /social/i,
    /share/i,
    /twitter/i,
    /facebook/i,
    /instagram/i,
    /whatsapp/i,
    /linkedin/i,
    /youtube/i,
    /tiktok/i,
    /telegram/i,
    /pinterest/i,
    /x\.com/i,
    /sprite/i,
    /1x1/i,
    /pixel/i,
    /tracking/i,
    /ads?[\/\-_]/i,
    /banner[s]?\//i,
  ];
  
  for (const pattern of invalidPatterns) {
    if (pattern.test(url)) return false;
  }
  
  // Must have image extension or be from known image CDNs
  const hasImageExtension = /\.(jpg|jpeg|png|gif|webp|svg|avif)(\?.*)?$/i.test(url);
  const isFromImageCDN = /wp-content\/uploads|cdn|img\.|images?\./i.test(url);
  
  return hasImageExtension || isFromImageCDN;
}

// Convert markdown to HTML - keep only valid content images, remove links
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
    // Images - only keep valid content images
    .replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
      if (isValidContentImage(url)) {
        return `<img src="${url}" alt="${alt}" class="rounded-lg max-w-full my-4" />`;
      }
      return ''; // Remove invalid images
    })
    // Links - remove href, keep only the text
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
  
  // Don't wrap images in paragraphs incorrectly
  html = html.replace(/<p>(<img[^>]+>)<\/p>/g, '$1');
  
  // Remove empty tags and excessive breaks
  html = html.replace(/<p>\s*<br\s*\/?>\s*<\/p>/g, '');
  html = html.replace(/(<br\s*\/?>){3,}/g, '<br /><br />');
  
  return html;
}

// Clean content - remove unwanted text and icons, KEEP valid content images
function cleanContent(markdown: string, featuredImage: string | null): string {
  let content = markdown;
  
  // Remove images that are icons/social/not content (before other processing)
  content = content.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, (match, alt, url) => {
    // Check if this is a valid content image
    if (isValidContentImage(url)) {
      // Check if it's the featured image (to avoid duplication)
      if (featuredImage) {
        const featuredFilename = featuredImage.split('/').pop()?.split('?')[0] || '';
        const urlFilename = url.split('/').pop()?.split('?')[0] || '';
        if (featuredFilename && urlFilename && featuredFilename === urlFilename) {
          return ''; // Remove featured image from content
        }
      }
      return match; // Keep valid content images
    }
    return ''; // Remove invalid images (icons, logos, etc)
  });
  
  // Remove first image if it's at the very start (usually the featured image)
  content = content.replace(/^!\[[^\]]*\]\([^)]+\)\s*\n*/i, '');
  
  // Remove ALL links but keep the text inside
  content = content.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1');
  
  // Remove raw URLs (but not in image markdown)
  content = content.replace(/(?<![\(\!])\bhttps?:\/\/[^\s\)\]]+/g, '');
  
  // Remove common unwanted patterns - only TEXT
  const patternsToRemove = [
    // Site header/menu items
    /^(menu|home|início|acesse|entre|sair|login|cadastro|buscar?|pesquisar?)\s*$/gmi,
    /^(editar perfil|meu .+|minha .+|clube .+|assine|assinatura)\s*$/gmi,
    
    // Breadcrumbs
    /^.+\s*>\s*.+\s*>\s*.+$/gm,
    /olhar digital\s*>/gi,
    
    // Social media and sharing
    /(compartilh(ar|e)|share)\s*(esta|this)?\s*(matéria|notícia|artigo)?/gi,
    /siga .+ (no|on) .+/gi,
    /\b(facebook|twitter|linkedin|whatsapp|telegram|instagram|pinterest|youtube|tiktok|x\.com)\b/gi,
    
    // Author bylines (but keep content about the topic)
    /^[A-Za-zÀ-ú\s]+\d{2}\/\d{2}\/\d{4}\s*$/gm, // "Lucas Soares06/12/2025"
    
    // Newsletter/subscription CTAs
    /(inscreva-se|subscribe|newsletter|cadastre-se|sign up|assine|receba).{0,100}(email|e-mail|grátis|free|notícias)/gi,
    /conheça o clube/gi,
    
    // Related articles
    /^[\-\*]\s*(entenda|saiba|confira|leia|veja).+$/gmi,
    
    // Comments sections
    /(comentários?|comments?|comente|carregar mais)/gi,
    /cancelar\s*publicar/gi,
    
    // Copyright and legal
    /^(©|copyright|\(c\)|todos os direitos|all rights).+$/gmi,
    
    // Tags/categories labels
    /^(tags?|categorias?|categories)\s*:.*$/gmi,
    
    // Social icon text
    /ícone\s*(do|da|de)?\s*(facebook|twitter|x|instagram|whatsapp|email|linkedin)/gi,
    
    // Empty brackets
    /\[\s*\]/g,
    /\(\s*\)/g,
    /\(\s*:\/?\/?\/?[^)]*\)/g, // (://?...)
    
    // Editor info
    /^(redação|editorial|editor\(a\))\s*$/gmi,
    /lucas soares.*jornalista.*/gi,
    
    // Footer garbage
    /\[uol tag.*/gi,
    /mercúrio/gi,
    /clean expired cookie/gi,
  ];
  
  for (const pattern of patternsToRemove) {
    content = content.replace(pattern, '');
  }
  
  // Remove lines that are navigation, UI or very short fragments
  content = content
    .split('\n')
    .filter(line => {
      const trimmed = line.trim();
      if (!trimmed) return false;
      
      // Keep image lines (they'll be validated in markdownToHtml)
      if (/^!\[/.test(trimmed)) return true;
      
      // Keep headers
      if (/^#{1,6}\s+/.test(trimmed)) return true;
      
      // Remove lines that are too short (likely navigation)
      if (trimmed.length < 10 && !/^[\-\*]/.test(trimmed)) return false;
      
      // Remove lines that are just symbols or dates
      if (/^[*\-_=|:\s]+$/.test(trimmed)) return false;
      if (/^\d{2}\/\d{2}\/\d{4}\s*$/.test(trimmed)) return false;
      
      return true;
    })
    .join('\n');
  
  // Clean up excessive whitespace
  content = content
    .replace(/\n{3,}/g, '\n\n')
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

    // Scrape the article using Firecrawl with retry logic
    const maxRetries = 3;
    let scrapeData = null;
    let lastError = '';
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      console.log(`Firecrawl attempt ${attempt}/${maxRetries}`);
      
      try {
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
          lastError = await scrapeResponse.text();
          console.error(`Firecrawl error (attempt ${attempt}):`, lastError);
          
          // If it's a temporary error, wait and retry
          if (attempt < maxRetries && (lastError.includes('Redis') || lastError.includes('Internal server error'))) {
            console.log(`Waiting 2 seconds before retry...`);
            await new Promise(resolve => setTimeout(resolve, 2000));
            continue;
          }
        } else {
          const data = await scrapeResponse.json();
          if (data.success && data.data) {
            scrapeData = data;
            break;
          } else {
            lastError = 'No data returned from scrape';
            console.error(`Firecrawl returned no data (attempt ${attempt})`);
            if (attempt < maxRetries) {
              await new Promise(resolve => setTimeout(resolve, 2000));
              continue;
            }
          }
        }
      } catch (fetchError) {
        lastError = fetchError instanceof Error ? fetchError.message : 'Fetch failed';
        console.error(`Firecrawl fetch error (attempt ${attempt}):`, lastError);
        if (attempt < maxRetries) {
          await new Promise(resolve => setTimeout(resolve, 2000));
          continue;
        }
      }
    }
    
    if (!scrapeData) {
      return new Response(
        JSON.stringify({ error: 'Falha ao buscar o artigo após várias tentativas', details: lastError }),
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