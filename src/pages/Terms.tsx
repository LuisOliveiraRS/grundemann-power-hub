import { Helmet } from "react-helmet-async";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import Footer from "@/components/Footer";

const Terms = () => (
  <div className="min-h-screen flex flex-col">
    <Helmet>
      <title>Termos de Uso | Grundemann Power Hub</title>
      <meta name="description" content="Termos de uso da Grundemann Power Hub. Condições de compra, pagamento, entrega, garantia e trocas de peças para motores estacionários e geradores de energia." />
      <meta property="og:title" content="Termos de Uso | Grundemann Power Hub" />
      <meta property="og:description" content="Condições de compra, pagamento, entrega e garantia de peças para motores e geradores." />
      <link rel="canonical" href="https://grundemann-power-hub.lovable.app/termos" />
      <script type="application/ld+json">{JSON.stringify({
        "@context": "https://schema.org",
        "@type": "WebPage",
        "name": "Termos de Uso | Grundemann Power Hub",
        "description": "Condições de compra, pagamento, entrega e garantia de peças para motores e geradores.",
        "url": "https://grundemann-power-hub.lovable.app/termos",
        "publisher": { "@type": "Organization", "name": "Grundemann Power Hub" }
      })}</script>
    </Helmet>
    <TopBar /><Header />
    <div className="flex-1 container py-12 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Termos de Uso</h1>
      {[
        { title: "1. Aceitação dos Termos", text: "Ao acessar e utilizar o site Gründemann Geradores, você concorda com estes termos de uso. Caso não concorde, solicitamos que não utilize nossos serviços." },
        { title: "2. Produtos e Preços", text: "Os preços exibidos no site são válidos exclusivamente para compras online e podem ser alterados sem aviso prévio. Nos esforçamos para manter as informações de produtos atualizadas, mas pequenas variações podem ocorrer." },
        { title: "3. Pedidos e Pagamento", text: "Após a confirmação do pedido, enviaremos um email de confirmação. Aceitamos pagamento via Pix, boleto bancário e cartão de crédito em até 3x sem juros. Pagamentos via Pix e boleto possuem 5% de desconto." },
        { title: "4. Entrega", text: "Os prazos de entrega são estimados e podem variar conforme a localidade e disponibilidade dos Correios ou transportadora. O prazo começa a contar após a confirmação do pagamento." },
        { title: "5. Trocas e Devoluções", text: "Conforme o Código de Defesa do Consumidor, você tem até 7 dias corridos após o recebimento para solicitar a devolução do produto. O produto deve estar em perfeitas condições, com embalagem original. Para trocas por defeito, o prazo é de 30 dias. Entre em contato pelo WhatsApp para iniciar o processo." },
        { title: "6. Garantia", text: "Nossos produtos possuem garantia contra defeitos de fabricação. Geradores novos: 12 meses. Peças e componentes: 90 dias. Serviços de manutenção: 90 dias. A garantia não cobre mau uso, desgaste natural ou instalação inadequada." },
        { title: "7. Propriedade Intelectual", text: "Todo o conteúdo do site, incluindo textos, imagens, logotipos e marcas, é de propriedade da Gründemann Geradores e protegido pela legislação de propriedade intelectual." },
        { title: "8. Limitação de Responsabilidade", text: "A Gründemann Geradores não se responsabiliza por danos decorrentes do uso inadequado dos produtos adquiridos. Siga sempre as instruções do fabricante e as normas de segurança aplicáveis." },
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

export default Terms;
