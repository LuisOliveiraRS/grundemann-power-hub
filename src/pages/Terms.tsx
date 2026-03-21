import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";

const Terms = () => (
  <Layout>
    <Helmet>
      <title>Termos de Uso | Grundemann Geradores</title>
      <meta name="description" content="Termos de uso da plataforma Grundemann Power Hub. Condições de uso, cadastro, responsabilidades e propriedade intelectual." />
      <link rel="canonical" href="https://grundemann.com.br/termos" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Termos de Uso | Grundemann",
        "url": "https://grundemann.com.br/termos",
        "publisher": { "@type": "Organization", "name": "Grundemann Geradores" }
      })}</script>
    </Helmet>
    <div className="container py-12 max-w-3xl">
      <SEOBreadcrumb items={[{ label: "Termos de Uso" }]} />
      <h1 className="font-heading text-3xl font-bold mb-8">Termos de Uso – Grundemann</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">Ao acessar e utilizar o site Grundemann Power Hub, o usuário concorda com os presentes Termos de Uso.</p>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">1. Objeto</h2>
        <p className="text-muted-foreground leading-relaxed">A plataforma disponibiliza um ambiente digital para divulgação e comercialização de geradores e peças, podendo atuar como intermediadora entre clientes e revendedores.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">2. Uso do Site</h2>
        <p className="text-muted-foreground mb-2">O usuário compromete-se a:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Fornecer informações verdadeiras</li>
          <li>Não utilizar o site para fins ilícitos</li>
          <li>Não tentar invadir ou comprometer o sistema</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">3. Cadastro</h2>
        <p className="text-muted-foreground leading-relaxed">O usuário é responsável pela veracidade dos dados fornecidos e pela segurança de sua conta.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">4. Produtos</h2>
        <p className="text-muted-foreground mb-2">Os produtos são de responsabilidade dos revendedores. A plataforma não garante:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Disponibilidade</li>
          <li>Qualidade</li>
          <li>Compatibilidade</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">5. Responsabilidade</h2>
        <p className="text-muted-foreground mb-2">A plataforma não se responsabiliza por:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Falhas nos produtos</li>
          <li>Atrasos de entrega</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">6. Propriedade Intelectual</h2>
        <p className="text-muted-foreground leading-relaxed">Todo conteúdo do site pertence à plataforma, sendo proibida sua reprodução sem autorização.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">7. Modificações</h2>
        <p className="text-muted-foreground leading-relaxed">A plataforma pode alterar estes termos a qualquer momento.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">8. Foro</h2>
        <p className="text-muted-foreground leading-relaxed">Fica eleito o foro da sede da plataforma para dirimir quaisquer questões oriundas destes termos.</p>
      </section>

      <p className="text-xs text-muted-foreground mt-8">Última atualização: Março de 2026</p>
    </div>
  </Layout>
);

export default Terms;
