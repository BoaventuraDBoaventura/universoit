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

    // Scrape the article using Firecrawl
    const scrapeResponse = await fetch('https://api.firecrawl.dev/v1/scrape', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${FIRECRAWL_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        url: article_url,
        formats: ['markdown', 'html'],
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

    const { metadata, markdown, html } = scrapeData.data;
    
    // Extract article data
    const rawTitle = metadata?.title || metadata?.ogTitle || 'Artigo Importado';
    // Clean title - remove site name suffix
    const title = rawTitle
      .replace(/\s*[-|•–]\s*[^-|•–]+$/, '')
      .trim();
    
    const description = metadata?.description || metadata?.ogDescription || '';
    const ogImage = metadata?.ogImage || metadata?.image;
    
    // Extract all images from the HTML content
    const imageRegex = /<img[^>]+src=["']([^"']+)["'][^>]*>/gi;
    const contentImages: string[] = [];
    let match;
    
    if (html) {
      while ((match = imageRegex.exec(html)) !== null) {
        const imgSrc = match[1];
        // Only include absolute URLs that look like content images
        if (imgSrc.startsWith('http') && 
            !imgSrc.includes('avatar') && 
            !imgSrc.includes('logo') &&
            !imgSrc.includes('icon') &&
            !imgSrc.includes('tracking')) {
          contentImages.push(imgSrc);
        }
      }
    }

    console.log(`Found ${contentImages.length} images in article`);

    // Use HTML content but clean it up
    let articleContent = markdown || description;
    
    if (html) {
      articleContent = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
        .replace(/<nav[^>]*>[\s\S]*?<\/nav>/gi, '')
        .replace(/<header[^>]*>[\s\S]*?<\/header>/gi, '')
        .replace(/<footer[^>]*>[\s\S]*?<\/footer>/gi, '')
        .replace(/<aside[^>]*>[\s\S]*?<\/aside>/gi, '')
        .replace(/class="[^"]*"/gi, '')
        .replace(/style="[^"]*"/gi, '')
        .replace(/id="[^"]*"/gi, '')
        .replace(/data-[^=]*="[^"]*"/gi, '')
        .trim();
    }

    // Create excerpt
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
        featured_image: ogImage || (contentImages.length > 0 ? contentImages[0] : null),
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
          images_found: contentImages.length,
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