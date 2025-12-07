import { PublicLayout } from "@/components/public/PublicLayout";
import { Helmet } from "react-helmet-async";
import { Users, Target, Eye, Award, Mail } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export default function About() {
  return (
    <PublicLayout>
      <Helmet>
        <title>Sobre Nós | Universo IT</title>
        <meta
          name="description"
          content="Conheça o Universo IT - O seu portal de notícias sobre tecnologia, inovação e o mundo digital. Descubra a nossa missão, visão e valores."
        />
      </Helmet>

      <article className="container max-w-4xl py-12">
        <header className="mb-12 text-center">
          <h1 className="mb-4 text-4xl font-bold tracking-tight md:text-5xl">
            Sobre Nós
          </h1>
          <p className="text-xl text-muted-foreground">
            O seu portal de referência para notícias de tecnologia
          </p>
        </header>

        <div className="prose prose-lg max-w-none dark:prose-invert">
          {/* Introduction */}
          <section className="mb-12">
            <p className="text-lg leading-relaxed">
              O <strong>Universo IT</strong> nasceu da paixão pela tecnologia e da 
              vontade de manter os portugueses informados sobre as últimas tendências, 
              inovações e notícias do mundo digital. Somos um portal dedicado a trazer 
              conteúdo de qualidade, acessível e relevante para todos os entusiastas 
              de tecnologia.
            </p>
          </section>

          {/* Mission, Vision, Values */}
          <section className="mb-12 grid gap-8 md:grid-cols-3">
            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Target className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Missão</h3>
              <p className="text-muted-foreground">
                Informar e educar o público sobre tecnologia de forma clara, 
                imparcial e acessível a todos.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Eye className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Visão</h3>
              <p className="text-muted-foreground">
                Ser o portal de tecnologia de referência em Portugal, 
                reconhecido pela qualidade e credibilidade.
              </p>
            </div>

            <div className="rounded-lg border bg-card p-6 text-center">
              <div className="mb-4 flex justify-center">
                <div className="rounded-full bg-primary/10 p-3">
                  <Award className="h-8 w-8 text-primary" />
                </div>
              </div>
              <h3 className="mb-2 text-xl font-semibold">Valores</h3>
              <p className="text-muted-foreground">
                Transparência, inovação, qualidade e compromisso com 
                os nossos leitores.
              </p>
            </div>
          </section>

          {/* What we cover */}
          <section className="mb-12">
            <h2 className="mb-6 text-2xl font-bold">O Que Cobrimos</h2>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Notícias de Tecnologia</h4>
                  <p className="text-sm text-muted-foreground">
                    As últimas novidades do mundo tech, lançamentos e tendências.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Análises e Reviews</h4>
                  <p className="text-sm text-muted-foreground">
                    Avaliações detalhadas de produtos, apps e serviços.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Inteligência Artificial</h4>
                  <p className="text-sm text-muted-foreground">
                    Cobertura sobre IA, machine learning e automação.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Cibersegurança</h4>
                  <p className="text-sm text-muted-foreground">
                    Dicas de segurança, ameaças e proteção digital.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Gaming</h4>
                  <p className="text-sm text-muted-foreground">
                    Novidades sobre jogos, consolas e hardware gaming.
                  </p>
                </div>
              </div>
              <div className="flex items-start gap-3">
                <div className="mt-1 h-2 w-2 rounded-full bg-primary" />
                <div>
                  <h4 className="font-semibold">Startups e Inovação</h4>
                  <p className="text-sm text-muted-foreground">
                    O ecossistema de startups e inovação em Portugal e no mundo.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* Team */}
          <section className="mb-12">
            <div className="flex items-center gap-3 mb-6">
              <Users className="h-8 w-8 text-primary" />
              <h2 className="text-2xl font-bold">A Nossa Equipa</h2>
            </div>
            <p className="mb-4">
              O Universo IT é composto por uma equipa de profissionais apaixonados 
              por tecnologia, com experiência em jornalismo, desenvolvimento de software 
              e marketing digital. Trabalhamos diariamente para trazer as notícias 
              mais relevantes e análises mais completas para os nossos leitores.
            </p>
          </section>

          {/* Contact CTA */}
          <section className="rounded-lg border bg-muted/50 p-8 text-center">
            <Mail className="mx-auto mb-4 h-12 w-12 text-primary" />
            <h2 className="mb-2 text-2xl font-bold">Entre em Contacto</h2>
            <p className="mb-6 text-muted-foreground">
              Tem alguma sugestão, parceria ou feedback? Adoraríamos ouvir de si!
            </p>
            <Button asChild>
              <Link to="/contacto">Contactar-nos</Link>
            </Button>
          </section>
        </div>

        <footer className="mt-8 text-center text-sm text-muted-foreground">
          <p>Última atualização: {new Date().toLocaleDateString("pt-PT")}</p>
        </footer>
      </article>
    </PublicLayout>
  );
}
