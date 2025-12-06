import { Resend } from "https://esm.sh/resend@4.0.0";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string);

interface NewsletterRequest {
  articleId: string;
}

interface ArticleData {
  id: string;
  title: string;
  excerpt: string | null;
  slug: string;
  featured_image: string | null;
  category_id: string | null;
  categories: { name: string } | null;
}

function generateEmailHtml(
  title: string,
  excerpt: string,
  featuredImage: string | null,
  articleUrl: string,
  unsubscribeUrl: string,
  categoryName?: string
): string {
  return `
<!DOCTYPE html>
<html lang="pt">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f6f9fc;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #f6f9fc; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0ea5e9; padding: 24px; text-align: center;">
              <h1 style="color: #ffffff; font-size: 28px; font-weight: bold; margin: 0;">Universo IT</h1>
            </td>
          </tr>
          
          ${categoryName ? `
          <!-- Category -->
          <tr>
            <td style="padding: 20px 24px 0;">
              <span style="background-color: #0ea5e9; color: #ffffff; font-size: 12px; font-weight: 600; text-transform: uppercase; padding: 6px 12px; border-radius: 4px; display: inline-block;">${categoryName}</span>
            </td>
          </tr>
          ` : ''}
          
          ${featuredImage ? `
          <!-- Featured Image -->
          <tr>
            <td style="padding: 16px 0 0;">
              <img src="${featuredImage}" alt="${title}" style="width: 100%; height: auto; display: block;">
            </td>
          </tr>
          ` : ''}
          
          <!-- Content -->
          <tr>
            <td style="padding: 32px 24px;">
              <h2 style="color: #1a1a1a; font-size: 24px; font-weight: bold; line-height: 1.3; margin: 0 0 16px;">${title}</h2>
              <p style="color: #4a5568; font-size: 16px; line-height: 1.6; margin: 0 0 24px;">${excerpt}</p>
              <a href="${articleUrl}" style="display: inline-block; background-color: #0ea5e9; color: #ffffff; text-decoration: none; padding: 14px 28px; border-radius: 6px; font-size: 16px; font-weight: 600;">Ler Artigo Completo</a>
            </td>
          </tr>
          
          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; border-top: 1px solid #e2e8f0; padding: 24px; text-align: center;">
              <p style="color: #718096; font-size: 13px; margin: 0 0 12px;">Está a receber este email porque subscreveu a newsletter do Universo IT.</p>
              <a href="${unsubscribeUrl}" style="color: #0ea5e9; font-size: 13px; text-decoration: underline;">Cancelar subscrição</a>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `;
}

Deno.serve(async (req: Request): Promise<Response> => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { status: 405, headers: corsHeaders });
  }

  try {
    const { articleId }: NewsletterRequest = await req.json();

    if (!articleId) {
      return new Response(
        JSON.stringify({ error: 'Article ID is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create Supabase client with service role
    const supabaseUrl = Deno.env.get('SUPABASE_URL') as string;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') as string;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch article details
    const { data: article, error: articleError } = await supabase
      .from('articles')
      .select(`
        id,
        title,
        excerpt,
        slug,
        featured_image,
        category_id,
        categories:category_id (name)
      `)
      .eq('id', articleId)
      .single();

    if (articleError || !article) {
      console.error('Error fetching article:', articleError);
      return new Response(
        JSON.stringify({ error: 'Article not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const typedArticle = article as unknown as ArticleData;

    // Fetch active subscribers
    const { data: subscribers, error: subscribersError } = await supabase
      .from('newsletter_subscribers')
      .select('id, email')
      .eq('is_active', true);

    if (subscribersError) {
      console.error('Error fetching subscribers:', subscribersError);
      return new Response(
        JSON.stringify({ error: 'Failed to fetch subscribers' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (!subscribers || subscribers.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No active subscribers found', sent: 0 }),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const siteUrl = 'https://qpljdthnqdatcirkudpc.lovableproject.com';
    const articleUrl = `${siteUrl}/artigo/${typedArticle.slug}`;
    const categoryName = typedArticle.categories?.name || undefined;

    let sentCount = 0;
    let errorCount = 0;
    const errors: string[] = [];

    // Send emails in batches of 10
    const batchSize = 10;
    for (let i = 0; i < subscribers.length; i += batchSize) {
      const batch = subscribers.slice(i, i + batchSize);
      
      const emailPromises = batch.map(async (subscriber: { id: string; email: string }) => {
        const unsubscribeUrl = `${siteUrl}/cancelar-subscricao?email=${encodeURIComponent(subscriber.email)}`;
        
        try {
          const html = generateEmailHtml(
            typedArticle.title,
            typedArticle.excerpt || '',
            typedArticle.featured_image,
            articleUrl,
            unsubscribeUrl,
            categoryName
          );

          const { error: sendError } = await resend.emails.send({
            from: 'Universo IT <info@universoit.tech>',
            to: [subscriber.email],
            subject: `Novo artigo: ${typedArticle.title}`,
            html,
          });

          if (sendError) {
            console.error(`Error sending to ${subscriber.email}:`, sendError);
            errors.push(`${subscriber.email}: ${sendError.message}`);
            errorCount++;
          } else {
            console.log(`Email sent to ${subscriber.email}`);
            sentCount++;
          }
        } catch (err: unknown) {
          const errorMessage = err instanceof Error ? err.message : 'Unknown error';
          console.error(`Error processing ${subscriber.email}:`, err);
          errors.push(`${subscriber.email}: ${errorMessage}`);
          errorCount++;
        }
      });

      await Promise.all(emailPromises);
    }

    console.log(`Newsletter sent: ${sentCount} success, ${errorCount} errors`);

    return new Response(
      JSON.stringify({
        message: 'Newsletter sent',
        sent: sentCount,
        errors: errorCount,
        errorDetails: errors.length > 0 ? errors : undefined,
      }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Error in send-newsletter function:', error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});