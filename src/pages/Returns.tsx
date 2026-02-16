import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { ArrowLeftRight, Clock, CheckCircle, Phone } from "lucide-react";

const Returns = () => (
  <div className="min-h-screen flex flex-col">
    <TopBar /><Header />
    <div className="flex-1 container py-12 max-w-3xl">
      <h1 className="font-heading text-3xl font-bold mb-8">Trocas e Devoluções</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
        {[
          { icon: ArrowLeftRight, title: "Direito de Arrependimento", desc: "7 dias corridos após o recebimento" },
          { icon: Clock, title: "Defeito de Fabricação", desc: "30 dias para solicitar troca" },
          { icon: CheckCircle, title: "Condições", desc: "Produto na embalagem original, sem uso" },
          { icon: Phone, title: "Contato", desc: "WhatsApp: (51) 8182-5748" },
        ].map((item) => (
          <div key={item.title} className="bg-card rounded-xl border border-border p-5 flex items-start gap-3">
            <div className="rounded-lg bg-primary p-2 text-primary-foreground"><item.icon className="h-5 w-5" /></div>
            <div>
              <p className="font-heading font-bold text-sm">{item.title}</p>
              <p className="text-sm text-muted-foreground">{item.desc}</p>
            </div>
          </div>
        ))}
      </div>

      {[
        { title: "Como solicitar a troca ou devolução", text: "1. Entre em contato pelo WhatsApp (51) 8182-5748 informando o número do pedido e o motivo;\n2. Nossa equipe avaliará a solicitação e informará os próximos passos;\n3. Envie o produto para nosso endereço com o código de postagem fornecido;\n4. Após o recebimento e análise, realizaremos a troca ou reembolso em até 10 dias úteis." },
        { title: "Condições para troca/devolução", text: "• O produto deve estar em sua embalagem original, sem sinais de uso;\n• Todos os acessórios e manuais devem acompanhar o produto;\n• Produtos com defeito serão analisados pela nossa equipe técnica;\n• Produtos personalizados ou sob encomenda não são passíveis de troca." },
        { title: "Reembolso", text: "O reembolso será feito na mesma forma de pagamento utilizada na compra:\n• Cartão de crédito: estorno em até 2 faturas;\n• Pix / Boleto: transferência em até 10 dias úteis;\n• O frete de devolução por defeito é por nossa conta." },
      ].map((s) => (
        <div key={s.title} className="mb-6">
          <h2 className="font-heading text-lg font-bold mb-2">{s.title}</h2>
          <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{s.text}</p>
        </div>
      ))}
    </div>
    <Footer />
  </div>
);

export default Returns;
