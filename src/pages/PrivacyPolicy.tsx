import { Helmet } from "react-helmet-async";
import Layout from "@/components/Layout";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";

const PrivacyPolicy = () => (
  <Layout>
    <Helmet>
      <title>Política de Privacidade | Grundemann Geradores</title>
      <meta name="description" content="Política de privacidade da Grundemann. Saiba como coletamos, utilizamos e protegemos seus dados pessoais conforme a LGPD." />
      <link rel="canonical" href="https://grundemann.com.br/privacidade" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Política de Privacidade | Grundemann",
        "url": "https://grundemann.com.br/privacidade",
        "publisher": { "@type": "Organization", "name": "Grundemann Geradores" }
      })}</script>
    </Helmet>
    <div className="container py-12 max-w-3xl">
      <SEOBreadcrumb items={[{ label: "Política de Privacidade" }]} />
      <h1 className="font-heading text-3xl font-bold mb-8">Política de Privacidade – Grundemann</h1>
      <p className="text-muted-foreground leading-relaxed mb-8">Esta política descreve como os dados são coletados, utilizados e protegidos.</p>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">1. Dados Coletados</h2>
        <p className="text-muted-foreground mb-2">Podem ser coletados:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Nome</li>
          <li>E-mail</li>
          <li>Telefone</li>
          <li>Endereço</li>
          <li>Dados de navegação</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">2. Finalidade</h2>
        <p className="text-muted-foreground mb-2">Os dados são utilizados para:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Processar pedidos</li>
          <li>Melhorar a experiência</li>
          <li>Comunicação com o usuário</li>
          <li>Obrigações legais</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">3. Compartilhamento</h2>
        <p className="text-muted-foreground mb-2">Os dados podem ser compartilhados com:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Revendedores</li>
          <li>Gateways de pagamento</li>
          <li>Ferramentas de análise</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">4. Segurança</h2>
        <p className="text-muted-foreground leading-relaxed">A plataforma adota medidas técnicas para proteger os dados.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">5. Direitos do Usuário</h2>
        <p className="text-muted-foreground mb-2">O usuário pode:</p>
        <ul className="list-disc pl-6 text-muted-foreground space-y-1">
          <li>Acessar seus dados</li>
          <li>Corrigir</li>
          <li>Solicitar exclusão</li>
        </ul>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">6. Cookies</h2>
        <p className="text-muted-foreground leading-relaxed">O site utiliza cookies para melhorar a navegação. Ao continuar navegando, você concorda com o uso de cookies conforme descrito nesta política.</p>
      </section>

      <section className="mb-8">
        <h2 className="font-heading text-xl font-bold mb-3">7. Alterações</h2>
        <p className="text-muted-foreground leading-relaxed">A política pode ser atualizada a qualquer momento.</p>
      </section>

      <p className="text-xs text-muted-foreground mt-8">Última atualização: Março de 2026</p>
    </div>
  </Layout>
);

export default PrivacyPolicy;
