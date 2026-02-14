import { Fuel, Zap, Cog, Wrench, Settings, ShieldCheck } from "lucide-react";

const categories = [
  { name: "Geradores Diesel", icon: Fuel, count: 45, color: "bg-primary" },
  { name: "Geradores Gasolina", icon: Zap, count: 32, color: "bg-secondary" },
  { name: "Peças e Componentes", icon: Cog, count: 128, color: "bg-primary" },
  { name: "Manutenção", icon: Wrench, count: 18, color: "bg-secondary" },
  { name: "Acessórios", icon: Settings, count: 56, color: "bg-primary" },
  { name: "Serviços Técnicos", icon: ShieldCheck, count: 12, color: "bg-secondary" },
];

const CategoriesSection = () => {
  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-8 uppercase tracking-wide">
          Categorias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => (
            <a
              key={cat.name}
              href="#"
              className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all"
            >
              <div className={`rounded-full ${cat.color} p-4 text-primary-foreground group-hover:scale-110 transition-transform`}>
                <cat.icon className="h-7 w-7" />
              </div>
              <span className="font-heading text-sm font-semibold text-card-foreground text-center">
                {cat.name}
              </span>
              <span className="text-xs text-muted-foreground">{cat.count} produtos</span>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
