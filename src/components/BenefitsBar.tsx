import { ShieldCheck, CreditCard, MessageCircle, Percent, Truck } from "lucide-react";

const benefits = [
  { icon: ShieldCheck, title: "Site Seguro", desc: "Compre com segurança" },
  { icon: CreditCard, title: "Parcelamento", desc: "Em até 3x sem juros" },
  { icon: MessageCircle, title: "Atendimento", desc: "Via WhatsApp" },
  { icon: Percent, title: "5% Desconto", desc: "Pagamento via Pix" },
  { icon: Truck, title: "Envio Rápido", desc: "Para todo o Brasil" },
];

const BenefitsBar = () => {
  return (
    <section className="border-b border-border bg-muted/50">
      <div className="container py-3 md:py-5">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 md:gap-4">
          {benefits.map((b) => (
            <div key={b.title} className="flex items-center gap-2 md:gap-3">
              <b.icon className="h-6 w-6 md:h-8 md:w-8 text-primary flex-shrink-0" />
              <div>
                <p className="font-heading text-xs md:text-sm font-bold text-foreground">{b.title}</p>
                <p className="text-[10px] md:text-xs text-muted-foreground">{b.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsBar;
