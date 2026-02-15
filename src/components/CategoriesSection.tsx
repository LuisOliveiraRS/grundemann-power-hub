import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Zap, Cog, Wrench, Settings, ShieldCheck } from "lucide-react";

const iconMap: Record<string, any> = {
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  productCount?: number;
}

const CategoriesSection = () => {
  const [categories, setCategories] = useState<Category[]>([]);

  useEffect(() => {
    const load = async () => {
      const { data: cats } = await supabase.from("categories").select("*").order("name");
      if (cats && cats.length > 0) {
        // Get product counts
        const { data: products } = await supabase.from("products").select("category_id").eq("is_active", true);
        const counts: Record<string, number> = {};
        (products || []).forEach((p: any) => { if (p.category_id) counts[p.category_id] = (counts[p.category_id] || 0) + 1; });
        setCategories(cats.map((c: any) => ({ ...c, productCount: counts[c.id] || 0 })));
      }
    };
    load();
  }, []);

  if (categories.length === 0) return null;

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-8 uppercase tracking-wide">
          Categorias
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {categories.map((cat) => {
            const Icon = iconMap[cat.slug] || Cog;
            return (
              <Link
                key={cat.id}
                to={`/categoria/${cat.slug}`}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="rounded-full bg-primary p-4 text-primary-foreground group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="font-heading text-sm font-semibold text-card-foreground text-center">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{cat.productCount} produtos</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
