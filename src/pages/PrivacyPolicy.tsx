import { Helmet } from "react-helmet-async";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => (
  <div className="min-h-screen flex flex-col">
    <Helmet>
      <title>Política de Privacidade | Grundemann Power Hub</title>
      <meta name="description" content="Política de privacidade da Grundemann Power Hub. Saiba como protegemos seus dados pessoais conforme a LGPD em compras de peças e geradores de energia." />
      <meta property="og:title" content="Política de Privacidade | Grundemann Power Hub" />
      <meta property="og:description" content="Como protegemos seus dados pessoais conforme a LGPD na compra de peças e geradores." />
      <link rel="canonical" href="https://grundemann-power-hub.lovable.app/privacidade" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Política de Privacidade | Grundemann Power Hub",
        "description": "Como protegemos seus dados pessoais conforme a LGPD na compra de peças e geradores.",
        "url": "https://grundemann-power-hub.lovable.app/privacidade",
        "publisher": { "@type": "Organization", "name": "Grundemann Power Hub" }
      })}</script>
    </Helmet>
    <TopBar /><Header />
    <div className="flex-1 container py-12 max-w-3xl">
      <SEOBreadcrumb items={[{ label: "Política de Privacidade" }]} />
      <h1 className="font-heading text-3xl font-bold mb-8">Política de Privacidade</h1>
      {[
        { title: "1. Coleta de Dados", text: "Coletamos informações pessoais como nome, email, telefone e endereço quando você realiza um cadastro ou compra em nosso site. Esses dados são necessários para processar pedidos, emitir notas fiscais e realizar entregas." },
        { title: "2. Uso das Informações", text: "Suas informações são utilizadas exclusivamente para: processar e entregar seus pedidos; enviar atualizações sobre o status do pedido; fornecer suporte ao cliente; enviar comunicações de marketing (com seu consentimento); melhorar nossos produtos e serviços." },
        { title: "3. Proteção dos Dados", text: "Utilizamos medidas de segurança técnicas e organizacionais para proteger seus dados contra acesso não autorizado, alteração, divulgação ou destruição. Nosso site utiliza criptografia SSL para garantir a segurança das transações." },
        { title: "4. Compartilhamento", text: "Não vendemos ou compartilhamos suas informações pessoais com terceiros, exceto quando necessário para: processamento de pagamentos; envio de produtos via transportadoras; cumprimento de obrigações legais." },
        { title: "5. Cookies", text: "Utilizamos cookies para melhorar sua experiência de navegação. Você pode desativar os cookies nas configurações do seu navegador, mas isso pode afetar a funcionalidade do site." },
        { title: "6. Seus Direitos", text: "De acordo com a LGPD, você tem direito a: acessar seus dados pessoais; corrigir dados incompletos ou desatualizados; solicitar a exclusão de seus dados; revogar seu consentimento. Para exercer esses direitos, entre em contato conosco pelo email adair.grundemann@gmail.com." },
        { title: "7. Contato", text: "Para dúvidas sobre esta política, entre em contato: Email: adair.grundemann@gmail.com | Telefone: (51) 8182-5748" },
      ].map((s) => (
        <div key={s.title} className="mb-6">
          <h2 className="font-heading text-lg font-bold mb-2">{s.title}</h2>
          <p className="text-muted-foreground leading-relaxed">{s.text}</p>
        </div>
      ))}
      <p className="text-xs text-muted-foreground mt-8">Última atualização: Fevereiro de 2026</p>
    </div>
    <Footer />
  </div>
);

export default PrivacyPolicy;
