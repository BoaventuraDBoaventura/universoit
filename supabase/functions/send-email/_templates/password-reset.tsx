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
  Button,
} from "https://esm.sh/@react-email/components@0.0.22"
import * as React from "https://esm.sh/react@18.3.1"

interface PasswordResetEmailProps {
  supabase_url: string
  token_hash: string
  redirect_to: string
  email_action_type: string
}

export const PasswordResetEmail = ({
  supabase_url,
  token_hash,
  redirect_to,
  email_action_type,
}: PasswordResetEmailProps) => {
  const resetUrl = `${supabase_url}/auth/v1/verify?token=${token_hash}&type=${email_action_type}&redirect_to=${redirect_to}`

  return (
    <Html>
      <Head />
      <Preview>Repõe a tua password no Universo IT</Preview>
      <Body style={main}>
        <Container style={container}>
          <Section style={headerSection}>
            <Heading style={logo}>Universo IT</Heading>
          </Section>
          
          <Section style={contentSection}>
            <Heading style={h1}>Recuperação de Password 🔐</Heading>
            
            <Text style={text}>
              Recebemos um pedido para repor a password da tua conta no Universo IT.
            </Text>
            
            <Text style={text}>
              Se fizeste este pedido, clica no botão abaixo para criar uma nova password:
            </Text>
            
            <Section style={buttonContainer}>
              <Button style={button} href={resetUrl}>
                Repor Password
              </Button>
            </Section>
            
            <Section style={warningBox}>
              <Text style={warningText}>
                ⚠️ <strong>Importante:</strong> Este link expira em 24 horas. Se não fizeste este pedido, ignora este email e a tua password permanecerá inalterada.
              </Text>
            </Section>
            
            <Text style={textMuted}>
              Se não conseguires clicar no botão, copia e cola este link no teu browser:
            </Text>
            
            <Text style={linkText}>
              <Link href={resetUrl} style={link}>
                {resetUrl}
              </Link>
            </Text>
          </Section>
          
          <Section style={footer}>
            <Text style={footerText}>
              © {new Date().getFullYear()} Universo IT. Todos os direitos reservados.
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

export default PasswordResetEmail

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

const warningBox = {
  backgroundColor: '#fef3c7',
  borderRadius: '8px',
  padding: '16px',
  margin: '24px 0',
  border: '1px solid #fcd34d',
}

const warningText = {
  color: '#92400e',
  fontSize: '14px',
  lineHeight: '22px',
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
