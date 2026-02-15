import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog } from "lucide-react";

const iconMap: Record<string, any> = {
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

const defaultCategories = [
  { name: "Geradores Diesel", slug: "geradores-diesel", icon: Fuel },
  { name: "Geradores Gasolina", slug: "geradores-gasolina", icon: Zap },
  { name: "Peças e Componentes", slug: "pecas-e-componentes", icon: Cog },
  { name: "Manutenção", slug: "manutencao", icon: Wrench },
  { name: "Acessórios", slug: "acessorios", icon: Settings },
  { name: "Serviços Técnicos", slug: "servicos-tecnicos", icon: ShieldCheck },
];

interface DBCategory {
  id: string;
  name: string;
  slug: string;
}

const CategoryNav = () => {
  const [categories, setCategories] = useState<DBCategory[]>([]);

  useEffect(() => {
    supabase.from("categories").select("id, name, slug").order("name").then(({ data }) => {
      if (data && data.length > 0) setCategories(data);
    });
  }, []);

  const items = categories.length > 0
    ? categories.map(c => ({ name: c.name, slug: c.slug, icon: iconMap[c.slug] || Cog }))
    : defaultCategories;

  return (
    <nav className="bg-nav">
      <div className="container">
        <ul className="flex items-center justify-between overflow-x-auto">
          {items.map((cat) => (
            <li key={cat.slug}>
              <Link
                to={`/categoria/${cat.slug}`}
                className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
              >
                <cat.icon className="h-5 w-5" />
                <span>{cat.name}</span>
              </Link>
            </li>
          ))}
          <li>
            <Link to="/produtos" className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
              <Settings className="h-5 w-5" />
              <span>Ver Todos</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
