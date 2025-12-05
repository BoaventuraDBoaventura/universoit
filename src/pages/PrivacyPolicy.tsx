import { PublicLayout } from "@/components/public/PublicLayout";

export default function PrivacyPolicy() {
  return (
    <PublicLayout>
      <div className="container py-8 md:py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <h1>Política de Privacidade</h1>
          <p className="lead">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <h2>1. Introdução</h2>
          <p>
            A Universo IT está comprometida em proteger sua privacidade. Esta política 
            descreve como coletamos, usamos, armazenamos e protegemos suas informações 
            pessoais quando você visita nosso site.
          </p>

          <h2>2. Informações que Coletamos</h2>
          <p>Podemos coletar os seguintes tipos de informações:</p>
          <ul>
            <li>
              <strong>Informações de navegação:</strong> endereço IP, tipo de navegador, 
              páginas visitadas, tempo de permanência e outras estatísticas de uso.
            </li>
            <li>
              <strong>Cookies e tecnologias similares:</strong> utilizamos cookies para 
              melhorar sua experiência, personalizar conteúdo e anúncios.
            </li>
            <li>
              <strong>Informações fornecidas voluntariamente:</strong> como nome e email 
              ao assinar nossa newsletter ou deixar comentários.
            </li>
          </ul>

          <h2>3. Uso de Cookies</h2>
          <p>Utilizamos diferentes tipos de cookies:</p>
          <ul>
            <li>
              <strong>Cookies essenciais:</strong> necessários para o funcionamento básico 
              do site.
            </li>
            <li>
              <strong>Cookies de análise:</strong> ajudam a entender como os visitantes 
              interagem com o site (Google Analytics).
            </li>
            <li>
              <strong>Cookies de publicidade:</strong> usados para exibir anúncios 
              relevantes através do Google AdSense.
            </li>
            <li>
              <strong>Cookies de personalização:</strong> permitem lembrar suas preferências 
              e personalizar sua experiência.
            </li>
          </ul>

          <h2>4. Google AdSense</h2>
          <p>
            Utilizamos o Google AdSense para exibir anúncios. O Google pode usar cookies 
            para exibir anúncios com base em suas visitas anteriores a este e outros sites. 
            Você pode desativar a publicidade personalizada visitando as{" "}
            <a 
              href="https://www.google.com/settings/ads" 
              target="_blank" 
              rel="noopener noreferrer"
            >
              Configurações de Anúncios do Google
            </a>.
          </p>

          <h2>5. Compartilhamento de Informações</h2>
          <p>
            Não vendemos suas informações pessoais. Podemos compartilhar dados com:
          </p>
          <ul>
            <li>Provedores de serviços que nos ajudam a operar o site</li>
            <li>Parceiros de publicidade (como Google AdSense)</li>
            <li>Autoridades legais, quando exigido por lei</li>
          </ul>

          <h2>6. Seus Direitos (LGPD/GDPR)</h2>
          <p>Você tem direito a:</p>
          <ul>
            <li>Acessar suas informações pessoais</li>
            <li>Corrigir dados incorretos</li>
            <li>Solicitar a exclusão de seus dados</li>
            <li>Retirar seu consentimento a qualquer momento</li>
            <li>Portabilidade de dados</li>
          </ul>

          <h2>7. Segurança</h2>
          <p>
            Implementamos medidas de segurança técnicas e organizacionais para proteger 
            suas informações contra acesso não autorizado, alteração, divulgação ou 
            destruição.
          </p>

          <h2>8. Alterações nesta Política</h2>
          <p>
            Podemos atualizar esta política periodicamente. Recomendamos que você revise 
            esta página regularmente para se manter informado sobre quaisquer mudanças.
          </p>

          <h2>9. Contato</h2>
          <p>
            Se você tiver dúvidas sobre esta política de privacidade, entre em contato 
            conosco através do email disponível em nosso site.
          </p>
        </article>
      </div>
    </PublicLayout>
  );
}
