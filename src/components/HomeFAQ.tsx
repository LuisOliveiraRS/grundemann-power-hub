import { HelpCircle } from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";

const faqs = [
  { q: "Quais tipos de motores vocês atendem?", a: "Trabalhamos com motores estacionários a gasolina e diesel de 5HP a 15HP, incluindo marcas como Branco, Toyama, Buffalo, Honda e similares." },
  { q: "Como funciona o frete?", a: "Enviamos para todo o Brasil via PAC e SEDEX. O frete é calculado automaticamente no checkout. Para compras acima de determinado valor, oferecemos frete grátis (confira condições)." },
  { q: "Quais formas de pagamento são aceitas?", a: "Aceitamos PIX (com 5% de desconto), cartão de crédito Visa e Mastercard em até 3x sem juros, e boleto bancário." },
  { q: "Vocês oferecem assistência técnica?", a: "Sim! Além da venda de peças, contamos com suporte técnico especializado via WhatsApp e temos um programa de parceria para mecânicos." },
  { q: "Posso solicitar um orçamento?", a: "Claro! Utilize nosso formulário de orçamento para solicitar preços especiais em compras de múltiplas peças ou grandes quantidades." },
  { q: "Qual o prazo de entrega?", a: "Após a confirmação do pagamento, o pedido é processado em até 24h úteis. O prazo de entrega depende da sua região e modalidade de frete escolhida." },
];

const HomeFAQ = () => (
  <section className="py-14">
    <div className="container max-w-3xl">
      <div className="text-center mb-8">
        <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground uppercase tracking-wide flex items-center justify-center gap-2">
          <HelpCircle className="h-7 w-7 text-primary" /> Perguntas Frequentes
        </h2>
        <p className="text-muted-foreground mt-2">Tire suas dúvidas sobre nossa loja e serviços</p>
      </div>
      <Accordion type="single" collapsible className="w-full">
        {faqs.map((faq, idx) => (
          <AccordionItem key={idx} value={`faq-${idx}`}>
            <AccordionTrigger className="text-left font-semibold text-foreground">{faq.q}</AccordionTrigger>
            <AccordionContent className="text-muted-foreground leading-relaxed">{faq.a}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </div>
  </section>
);

export default HomeFAQ;
