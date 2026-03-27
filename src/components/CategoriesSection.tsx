import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Zap, Cog, Wrench, Settings, ShieldCheck } from "lucide-react";
import { useMenuCategories } from "@/hooks/useMenuCategories";

const iconMap: Record<string, any> = {
  Fuel, Zap, Cog, Wrench, Settings, ShieldCheck,
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

const CategoriesSection = () => {
  const { tree, loading, getAllDescendantIds } = useMenuCategories();
  const [productCounts, setProductCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    const load = async () => {
      // Count from both primary menu_category_id and junction table
      const [directRes, junctionRes] = await Promise.all([
        supabase.from("products").select("menu_category_id").eq("is_active", true).not("menu_category_id", "is", null),
        supabase.from("product_menu_categories").select("menu_category_id, product_id"),
      ]);

      // Collect all product-to-category mappings
      const catProducts = new Map<string, Set<string>>();
      (directRes.data || []).forEach((p: any) => {
        if (!catProducts.has(p.menu_category_id)) catProducts.set(p.menu_category_id, new Set());
        // We don't have product_id here, just count
      });

      // Simple count per category from direct + junction
      const counts: Record<string, number> = {};
      (directRes.data || []).forEach((p: any) => {
        if (p.menu_category_id) counts[p.menu_category_id] = (counts[p.menu_category_id] || 0) + 1;
      });
      (junctionRes.data || []).forEach((l: any) => {
        counts[l.menu_category_id] = (counts[l.menu_category_id] || 0) + 1;
      });

      setProductCounts(counts);
    };
    load();
  }, []);

  if (loading || tree.length === 0) return null;

  // For top-level categories, sum counts of all descendants
  const getCategoryTotal = (catId: string): number => {
    const allIds = getAllDescendantIds(catId);
    return allIds.reduce((sum, id) => sum + (productCounts[id] || 0), 0);
  };

  return (
    <section className="py-12 bg-muted/30">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-8 uppercase tracking-wide">
          Categorias de Peças para Motores e Geradores
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {tree.map((cat) => {
            const Icon = iconMap[cat.icon] || iconMap[cat.slug] || Cog;
            const count = getCategoryTotal(cat.id);
            return (
              <Link
                key={cat.id}
                to={`/categoria/${cat.fullPath}`}
                className="group flex flex-col items-center gap-3 rounded-lg border border-border bg-card p-6 hover:shadow-md hover:border-primary/30 transition-all"
              >
                <div className="rounded-full bg-primary p-4 text-primary-foreground group-hover:scale-110 transition-transform">
                  <Icon className="h-7 w-7" />
                </div>
                <span className="font-heading text-sm font-semibold text-card-foreground text-center">{cat.name}</span>
                <span className="text-xs text-muted-foreground">{count} produtos</span>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default CategoriesSection;
