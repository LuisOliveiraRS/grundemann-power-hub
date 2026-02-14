import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog } from "lucide-react";

const categories = [
  { name: "Geradores Diesel", icon: Fuel, href: "#" },
  { name: "Geradores Gasolina", icon: Zap, href: "#" },
  { name: "Peças e Componentes", icon: Cog, href: "#" },
  { name: "Manutenção", icon: Wrench, href: "#" },
  { name: "Acessórios", icon: Settings, href: "#" },
  { name: "Serviços Técnicos", icon: ShieldCheck, href: "#" },
];

const CategoryNav = () => {
  return (
    <nav className="bg-nav">
      <div className="container">
        <ul className="flex items-center justify-between">
          {categories.map((cat) => (
            <li key={cat.name}>
              <a
                href={cat.href}
                className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide"
              >
                <cat.icon className="h-5 w-5" />
                <span>{cat.name}</span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
