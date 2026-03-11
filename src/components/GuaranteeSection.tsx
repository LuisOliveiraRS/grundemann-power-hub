import { ShieldCheck, Truck, RefreshCw, Headphones } from "lucide-react";

const guarantees = [
  { icon: ShieldCheck, title: "Garantia de Qualidade", desc: "Todos os produtos com garantia contra defeitos de fabricação." },
  { icon: Truck, title: "Envio para Todo Brasil", desc: "Entregamos via PAC e SEDEX com rastreamento completo." },
  { icon: RefreshCw, title: "7 Dias para Troca", desc: "Não gostou? Devolva em até 7 dias após o recebimento." },
  { icon: Headphones, title: "Suporte Especializado", desc: "Equipe técnica pronta para ajudar via WhatsApp." },
];

const GuaranteeSection = () => (
  <section className="py-14 bg-card border-y border-border">
    <div className="container">
      <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground text-center mb-2 uppercase tracking-wide">
        Por que comprar na Grundemann?
      </h2>
      <p className="text-center text-muted-foreground mb-10">Compromisso com qualidade, segurança e satisfação do cliente</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {guarantees.map((g) => (
          <div key={g.title} className="text-center group">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 text-primary mb-4 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
              <g.icon className="h-8 w-8" />
            </div>
            <h3 className="font-heading font-bold text-foreground mb-2">{g.title}</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">{g.desc}</p>
          </div>
        ))}
      </div>
    </div>
  </section>
);

export default GuaranteeSection;
