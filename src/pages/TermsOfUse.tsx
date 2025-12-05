import { PublicLayout } from "@/components/public/PublicLayout";

export default function TermsOfUse() {
  return (
    <PublicLayout>
      <div className="container py-8 md:py-12">
        <article className="prose prose-neutral mx-auto max-w-3xl dark:prose-invert">
          <h1>Termos de Uso</h1>
          <p className="lead">
            Última atualização: {new Date().toLocaleDateString("pt-BR")}
          </p>

          <h2>1. Aceitação dos Termos</h2>
          <p>
            Ao acessar e usar o site Universo IT, você concorda em cumprir e estar 
            vinculado a estes Termos de Uso. Se você não concordar com qualquer parte 
            destes termos, não deve usar nosso site.
          </p>

          <h2>2. Uso do Site</h2>
          <p>Ao usar nosso site, você concorda em:</p>
          <ul>
            <li>Usar o site apenas para fins legais e de acordo com estes termos</li>
            <li>Não usar o site de forma que possa danificá-lo ou prejudicar seu funcionamento</li>
            <li>Não tentar acessar áreas restritas do site sem autorização</li>
            <li>Não usar o site para distribuir malware ou conteúdo malicioso</li>
          </ul>

          <h2>3. Propriedade Intelectual</h2>
          <p>
            Todo o conteúdo publicado no Universo IT, incluindo textos, imagens, 
            gráficos, logotipos e design, é de propriedade do Universo IT ou de seus 
            respectivos autores e está protegido por leis de direitos autorais.
          </p>
          <p>
            Você pode compartilhar nosso conteúdo em redes sociais, desde que inclua 
            um link para a fonte original. A reprodução total ou parcial do conteúdo 
            sem autorização prévia é proibida.
          </p>

          <h2>4. Comentários e Contribuições</h2>
          <p>
            Ao deixar comentários em nosso site, você concorda em:
          </p>
          <ul>
            <li>Não publicar conteúdo ofensivo, difamatório ou ilegal</li>
            <li>Não fazer spam ou publicidade não autorizada</li>
            <li>Respeitar outros usuários e manter um diálogo construtivo</li>
            <li>Assumir responsabilidade pelo conteúdo que você publica</li>
          </ul>
          <p>
            Reservamo-nos o direito de moderar, editar ou remover comentários que 
            violem estas diretrizes.
          </p>

          <h2>5. Links Externos</h2>
          <p>
            Nosso site pode conter links para sites de terceiros. Não somos 
            responsáveis pelo conteúdo, políticas de privacidade ou práticas de 
            sites externos. O acesso a esses links é por sua conta e risco.
          </p>

          <h2>6. Publicidade</h2>
          <p>
            O Universo IT exibe anúncios de terceiros, incluindo Google AdSense. 
            Esses anúncios podem usar cookies para personalizar o conteúdo exibido. 
            Para mais informações, consulte nossa{" "}
            <a href="/politica-de-privacidade">Política de Privacidade</a>.
          </p>

          <h2>7. Newsletter</h2>
          <p>
            Ao se inscrever em nossa newsletter, você concorda em receber emails 
            periódicos com novidades e conteúdo do Universo IT. Você pode cancelar 
            a inscrição a qualquer momento através do link disponível em cada email.
          </p>

          <h2>8. Isenção de Responsabilidade</h2>
          <p>
            O conteúdo do Universo IT é fornecido apenas para fins informativos. 
            Embora nos esforcemos para manter as informações atualizadas e precisas, 
            não garantimos a exatidão, completude ou adequação do conteúdo para 
            qualquer finalidade específica.
          </p>

          <h2>9. Limitação de Responsabilidade</h2>
          <p>
            O Universo IT não será responsável por quaisquer danos diretos, indiretos, 
            incidentais ou consequentes decorrentes do uso ou da impossibilidade de 
            uso do site.
          </p>

          <h2>10. Modificações dos Termos</h2>
          <p>
            Reservamo-nos o direito de modificar estes Termos de Uso a qualquer 
            momento. As alterações entrarão em vigor imediatamente após a publicação 
            no site. O uso continuado do site após as alterações constitui aceitação 
            dos novos termos.
          </p>

          <h2>11. Lei Aplicável</h2>
          <p>
            Estes Termos de Uso são regidos pelas leis brasileiras. Qualquer disputa 
            relacionada a estes termos será resolvida nos tribunais competentes do Brasil.
          </p>

          <h2>12. Contato</h2>
          <p>
            Se você tiver dúvidas sobre estes Termos de Uso, entre em contato conosco 
            através do email disponível em nosso site.
          </p>
        </article>
      </div>
    </PublicLayout>
  );
}
