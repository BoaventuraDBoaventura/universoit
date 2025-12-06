import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Text,
  Section,
} from "https://esm.sh/@react-email/components@0.0.22?external=react"
import * as React from "https://esm.sh/react@18.3.1"

interface MagicLinkEmailProps {
  supabase_url: string
  token: string
  token_hash: string
  redirect_to: string
  email_action_type: string
}

export const MagicLinkEmail = ({
  supabase_url,
  token,
  token_hash,
  redirect_to,
  email_action_type,
}: MagicLinkEmailProps) => {
  const magicLinkUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head />
      <Preview>O teu link de acesso ao Universo IT</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logo}>Universo IT</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Heading style={h1}>Acesso Rápido</Heading>
            
            <Text style={text}>
              Alguém pediu um link de acesso para a tua conta no Universo IT. Clica no link abaixo para entrar automaticamente:
            </Text>
            
            <Section style={buttonContainer}>
              <Link style={button} href={magicLinkUrl}>
                Entrar no Universo IT
              </Link>
            </Section>
            
            <Text style={textCenter}>
              Ou usa este código de acesso:
            </Text>
            
            <Section style={codeContainer}>
              <Text style={codeText}>{token}</Text>
            </Section>
            
            <Text style={textMuted}>
              Se não conseguires clicar no botão, copia e cola este link no teu browser:
            </Text>
            
            <Text style={linkText}>
              <Link href={magicLinkUrl} style={link}>
                {magicLinkUrl}
              </Link>
            </Text>
            
            <Text style={textMuted}>
              Este link expira em 1 hora. Se não pediste este acesso, podes ignorar este email com segurança.
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              Universo IT. Todos os direitos reservados.
            </Text>
            <Link href="https://universoit.tech" style={footerLink}>
              universoit.tech
            </Link>
          </Section>
        </Container>
      </Body>
    </Html>
  )
}

export default MagicLinkEmail

const main = {
  backgroundColor: '#f6f9fc',
  fontFamily:
    "-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif",
}

const container = {
  backgroundColor: '#ffffff',
  margin: '0 auto',
  maxWidth: '600px',
  borderRadius: '8px',
  overflow: 'hidden',
  boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
}

const headerSection = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  padding: '32px 24px',
  textAlign: 'center' as const,
}

const logo = {
  color: '#ffffff',
  fontSize: '28px',
  fontWeight: 'bold',
  margin: '0',
  letterSpacing: '-0.5px',
}

const contentSection = {
  padding: '40px 32px',
}

const h1 = {
  color: '#1f2937',
  fontSize: '24px',
  fontWeight: 'bold',
  margin: '0 0 24px 0',
  textAlign: 'center' as const,
}

const text = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '0 0 16px 0',
}

const textCenter = {
  color: '#374151',
  fontSize: '16px',
  lineHeight: '26px',
  margin: '24px 0 16px 0',
  textAlign: 'center' as const,
}

const textMuted = {
  color: '#6b7280',
  fontSize: '14px',
  lineHeight: '22px',
  margin: '16px 0',
}

const buttonContainer = {
  textAlign: 'center' as const,
  margin: '32px 0',
}

const button = {
  background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
  borderRadius: '8px',
  color: '#ffffff',
  fontSize: '16px',
  fontWeight: 'bold',
  textDecoration: 'none',
  textAlign: 'center' as const,
  padding: '14px 32px',
  display: 'inline-block',
}

const codeContainer = {
  textAlign: 'center' as const,
  margin: '16px 0 32px 0',
}

const codeText = {
  backgroundColor: '#1f2937',
  borderRadius: '8px',
  color: '#ffffff',
  display: 'inline-block',
  fontSize: '24px',
  fontFamily: 'monospace',
  fontWeight: 'bold',
  letterSpacing: '4px',
  padding: '16px 32px',
  margin: '0',
}

const link = {
  color: '#3b82f6',
  textDecoration: 'underline',
  wordBreak: 'break-all' as const,
}

const linkText = {
  backgroundColor: '#f3f4f6',
  borderRadius: '4px',
  padding: '12px',
  fontSize: '12px',
  wordBreak: 'break-all' as const,
}

const footer = {
  backgroundColor: '#f9fafb',
  padding: '24px 32px',
  textAlign: 'center' as const,
  borderTop: '1px solid #e5e7eb',
}

const footerText = {
  color: '#9ca3af',
  fontSize: '12px',
  margin: '0 0 8px 0',
}

const footerLink = {
  color: '#6b7280',
  fontSize: '12px',
  textDecoration: 'none',
}