import { Resend } from "https://esm.sh/resend@4.0.0"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const rawHookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string
// Remove the "v1," prefix if present (Supabase format)
const hookSecret = rawHookSecret.startsWith('v1,') ? rawHookSecret.slice(3) : rawHookSecret

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface EmailData {
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
  site_url: string
  token_new?: string
  token_hash_new?: string
}

interface WebhookPayload {
  user: {
    email: string
    user_metadata?: {
      full_name?: string
    }
  }
  email_data: EmailData
}

function generateConfirmationEmail(confirmationUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;">
  <div style="background-color:#ffffff;margin:0 auto;max-width:600px;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="padding:32px 24px;text-align:center;">
      <img src="https://qpljdthnqdatcirkudpc.lovableproject.com/logo.png" alt="Universo IT" style="height:50px;width:auto;">
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1f2937;font-size:24px;font-weight:bold;margin:0 0 24px;text-align:center;">Bem-vindo ao Universo IT!</h2>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">Obrigado por te registares no Universo IT, o teu portal de notícias e artigos sobre tecnologia e inovação.</p>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">Para completares o teu registo, confirma o teu email clicando no link abaixo:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${confirmationUrl}" style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);border-radius:8px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;display:inline-block;">Confirmar Email</a>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:22px;margin:16px 0;">Se não criaste esta conta, podes ignorar este email.</p>
    </div>
    <div style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Universo IT. Todos os direitos reservados.</p>
      <a href="https://universoit.tech" style="color:#6b7280;font-size:12px;text-decoration:none;">universoit.tech</a>
    </div>
  </div>
</body>
</html>`
}

function generatePasswordResetEmail(resetUrl: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;">
  <div style="background-color:#ffffff;margin:0 auto;max-width:600px;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="padding:32px 24px;text-align:center;">
      <img src="https://qpljdthnqdatcirkudpc.lovableproject.com/logo.png" alt="Universo IT" style="height:50px;width:auto;">
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1f2937;font-size:24px;font-weight:bold;margin:0 0 24px;text-align:center;">Recuperação de Password</h2>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">Recebemos um pedido para repor a password da tua conta no Universo IT.</p>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">Se fizeste este pedido, clica no link abaixo para criar uma nova password:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${resetUrl}" style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);border-radius:8px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;display:inline-block;">Repor Password</a>
      </div>
      <div style="background-color:#fef3c7;border-radius:8px;padding:16px;margin:24px 0;border:1px solid #fcd34d;">
        <p style="color:#92400e;font-size:14px;line-height:22px;margin:0;">Importante: Este link expira em 24 horas. Se não fizeste este pedido, ignora este email.</p>
      </div>
    </div>
    <div style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Universo IT. Todos os direitos reservados.</p>
      <a href="https://universoit.tech" style="color:#6b7280;font-size:12px;text-decoration:none;">universoit.tech</a>
    </div>
  </div>
</body>
</html>`
}

function generateMagicLinkEmail(magicLinkUrl: string, token: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="background-color:#f6f9fc;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Roboto',sans-serif;margin:0;padding:20px;">
  <div style="background-color:#ffffff;margin:0 auto;max-width:600px;border-radius:8px;overflow:hidden;box-shadow:0 4px 6px rgba(0,0,0,0.1);">
    <div style="padding:32px 24px;text-align:center;">
      <img src="https://qpljdthnqdatcirkudpc.lovableproject.com/logo.png" alt="Universo IT" style="height:50px;width:auto;">
    </div>
    <div style="padding:40px 32px;">
      <h2 style="color:#1f2937;font-size:24px;font-weight:bold;margin:0 0 24px;text-align:center;">Acesso Rápido</h2>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:0 0 16px;">Alguém pediu um link de acesso para a tua conta no Universo IT. Clica no link abaixo para entrar automaticamente:</p>
      <div style="text-align:center;margin:32px 0;">
        <a href="${magicLinkUrl}" style="background:linear-gradient(135deg,#3b82f6 0%,#8b5cf6 100%);border-radius:8px;color:#ffffff;font-size:16px;font-weight:bold;text-decoration:none;padding:14px 32px;display:inline-block;">Entrar no Universo IT</a>
      </div>
      <p style="color:#374151;font-size:16px;line-height:26px;margin:24px 0 16px;text-align:center;">Ou usa este código de acesso:</p>
      <div style="text-align:center;margin:16px 0 32px;">
        <span style="background-color:#1f2937;border-radius:8px;color:#ffffff;display:inline-block;font-size:24px;font-family:monospace;font-weight:bold;letter-spacing:4px;padding:16px 32px;">${token}</span>
      </div>
      <p style="color:#6b7280;font-size:14px;line-height:22px;margin:16px 0;">Este link expira em 1 hora. Se não pediste este acesso, podes ignorar este email.</p>
    </div>
    <div style="background-color:#f9fafb;padding:24px 32px;text-align:center;border-top:1px solid #e5e7eb;">
      <p style="color:#9ca3af;font-size:12px;margin:0 0 8px;">Universo IT. Todos os direitos reservados.</p>
      <a href="https://universoit.tech" style="color:#6b7280;font-size:12px;text-decoration:none;">universoit.tech</a>
    </div>
  </div>
</body>
</html>`
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  if (req.method !== 'POST') {
    return new Response('Method not allowed', { 
      status: 405, 
      headers: corsHeaders 
    })
  }

  const payload = await req.text()
  const headers = Object.fromEntries(req.headers)
  
  let webhookData: WebhookPayload

  try {
    // Verify webhook signature
    const wh = new Webhook(hookSecret)
    webhookData = wh.verify(payload, headers) as WebhookPayload
  } catch (error) {
    console.error('Webhook verification failed:', error)
    return new Response(
      JSON.stringify({ error: 'Invalid webhook signature' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    const { user, email_data } = webhookData
    const { token, token_hash, redirect_to, email_action_type } = email_data
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? ''
    
    let html: string
    let subject: string

    console.log(`Processing email for type: ${email_action_type}`)

    // Select template based on email type
    switch (email_action_type) {
      case 'signup':
      case 'email_confirmation': {
        const confirmationUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || 'https://universoit.tech'}`
        subject = 'Confirma o teu email - Universo IT'
        html = generateConfirmationEmail(confirmationUrl)
        break
      }

      case 'recovery':
      case 'password_reset': {
        const resetUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || 'https://universoit.tech'}`
        subject = 'Repor Password - Universo IT'
        html = generatePasswordResetEmail(resetUrl)
        break
      }

      case 'magiclink':
      case 'magic_link': {
        const magicLinkUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || 'https://universoit.tech'}`
        subject = 'O teu link de acesso - Universo IT'
        html = generateMagicLinkEmail(magicLinkUrl, token)
        break
      }

      default: {
        console.log(`Unknown email type: ${email_action_type}, using confirmation template`)
        const defaultUrl = `${supabaseUrl}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to || 'https://universoit.tech'}`
        subject = 'Notificação - Universo IT'
        html = generateConfirmationEmail(defaultUrl)
      }
    }

    console.log(`Sending email to: ${user.email}`)

    const { data, error } = await resend.emails.send({
      from: 'Universo IT <noreply@universoit.tech>',
      to: [user.email],
      subject,
      html,
    })

    if (error) {
      console.error('Resend error:', error)
      throw error
    }

    console.log('Email sent successfully:', data)

    return new Response(
      JSON.stringify({ success: true, id: data?.id }),
      { 
        status: 200, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )

  } catch (error: unknown) {
    console.error('Error sending email:', error)
    const errorMessage = error instanceof Error ? error.message : 'Failed to send email'
    return new Response(
      JSON.stringify({ 
        error: { 
          http_code: 500, 
          message: errorMessage 
        } 
      }),
      { 
        status: 500, 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' } 
      }
    )
  }
})