import React from "https://esm.sh/react@18.3.1"
import { Resend } from "https://esm.sh/resend@4.0.0"
import { renderAsync } from "https://esm.sh/@react-email/components@0.0.22"
import { Webhook } from "https://esm.sh/standardwebhooks@1.0.0"
import { ConfirmationEmail } from "./_templates/confirmation.tsx"
import { PasswordResetEmail } from "./_templates/password-reset.tsx"
import { MagicLinkEmail } from "./_templates/magic-link.tsx"

const resend = new Resend(Deno.env.get('RESEND_API_KEY') as string)
const hookSecret = Deno.env.get('SEND_EMAIL_HOOK_SECRET') as string

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
      case 'email_confirmation':
        subject = 'Confirma o teu email - Universo IT'
        html = await renderAsync(
          React.createElement(ConfirmationEmail, {
            supabase_url: supabaseUrl,
            token_hash,
            redirect_to: redirect_to || 'https://universoit.tech',
            email_action_type,
          })
        )
        break

      case 'recovery':
      case 'password_reset':
        subject = 'Repor Password - Universo IT'
        html = await renderAsync(
          React.createElement(PasswordResetEmail, {
            supabase_url: supabaseUrl,
            token_hash,
            redirect_to: redirect_to || 'https://universoit.tech',
            email_action_type,
          })
        )
        break

      case 'magiclink':
      case 'magic_link':
        subject = 'O teu link de acesso - Universo IT'
        html = await renderAsync(
          React.createElement(MagicLinkEmail, {
            supabase_url: supabaseUrl,
            token,
            token_hash,
            redirect_to: redirect_to || 'https://universoit.tech',
            email_action_type,
          })
        )
        break

      default:
        console.log(`Unknown email type: ${email_action_type}, using confirmation template`)
        subject = 'Notificação - Universo IT'
        html = await renderAsync(
          React.createElement(ConfirmationEmail, {
            supabase_url: supabaseUrl,
            token_hash,
            redirect_to: redirect_to || 'https://universoit.tech',
            email_action_type,
          })
        )
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
