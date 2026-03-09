import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog, ChevronDown } from "lucide-react";

const iconMap: Record<string, any> = {
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

const defaultCategories = [
  { id: "1", name: "Geradores Diesel", slug: "geradores-diesel", icon: Fuel },
  { id: "2", name: "Geradores Gasolina", slug: "geradores-gasolina", icon: Zap },
  { id: "3", name: "Peças e Componentes", slug: "pecas-e-componentes", icon: Cog },
  { id: "4", name: "Manutenção", slug: "manutencao", icon: Wrench },
  { id: "5", name: "Acessórios", slug: "acessorios", icon: Settings },
  { id: "6", name: "Serviços Técnicos", slug: "servicos-tecnicos", icon: ShieldCheck },
];

interface DBCategory { id: string; name: string; slug: string; is_visible?: boolean; }
interface Subcategory { id: string; name: string; slug: string; category_id: string; }

const CategoryNav = () => {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("id, name, slug, is_visible").order("name"),
      supabase.from("subcategories").select("id, name, slug, category_id").order("name"),
    ]).then(([catRes, subRes]) => {
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (subRes.data) setSubcategories(subRes.data as Subcategory[]);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCat(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleCategories = categories.filter(c => c.is_visible !== false);
  const items = visibleCategories.length > 0
    ? visibleCategories.map(c => ({ ...c, icon: iconMap[c.slug] || Cog }))
    : defaultCategories;

  const getSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

  return (
    <nav className="bg-nav relative z-50" ref={navRef}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center md:justify-between">
          {items.map((cat) => {
            const subs = getSubcats(cat.id);
            const hasSubcats = subs.length > 0;
            const isOpen = openCat === cat.id;
            const Icon = cat.icon;

            return (
              <li
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => hasSubcats && setOpenCat(cat.id)}
                onMouseLeave={() => hasSubcats && setOpenCat(null)}
              >
                {hasSubcats ? (
                  <button
                    onClick={() => setOpenCat(isOpen ? null : cat.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap w-full ${isOpen ? "bg-primary-foreground/15" : "hover:bg-primary-foreground/10"}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex items-center gap-1">
                      {cat.name}
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                ) : (
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{cat.name}</span>
                  </Link>
                )}

                {/* Dropdown - overlays content below */}
                {hasSubcats && isOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[220px] bg-card border border-border rounded-lg shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="py-1">
                      <Link
                        to={`/categoria/${cat.slug}`}
                        onClick={() => setOpenCat(null)}
                        className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-semibold border-b border-border"
                      >
                        Ver todos em {cat.name}
                      </Link>
                      {subs.map((sub) => (
                        <Link
                          key={sub.id}
                          to={`/categoria/${cat.slug}/${sub.slug}`}
                          onClick={() => setOpenCat(null)}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          {sub.name}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </li>
            );
          })}
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
