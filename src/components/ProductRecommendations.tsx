import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import ProductCard from "@/components/ProductCard";
import { Stethoscope, ShoppingCart, Cpu, Package, Wrench } from "lucide-react";

interface Props {
  productId: string;
  productName: string;
  categoryId: string | null;
}

const ProductRecommendations = ({ productId, productName, categoryId }: Props) => {
  const navigate = useNavigate();
  const [diagnosticProblems, setDiagnosticProblems] = useState<any[]>([]);
  const [alsoBought, setAlsoBought] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);

  useEffect(() => {
    loadRecommendations();
  }, [productId]);

  const loadRecommendations = async () => {
    const nameLower = productName.toLowerCase();

    // 1. Find diagnostic problems related to this product via tags
    const { data: allTags } = await supabase
      .from("diagnostic_product_tags")
      .select("problem_id, search_tag");

    if (allTags) {
      const matchingProblemIds = new Set<string>();
      allTags.forEach((t: any) => {
        if (nameLower.includes(t.search_tag.toLowerCase())) {
          matchingProblemIds.add(t.problem_id);
        }
      });

      if (matchingProblemIds.size > 0) {
        const { data: problems } = await supabase
          .from("diagnostic_problems")
          .select("id, name, slug, description")
          .in("id", Array.from(matchingProblemIds))
          .eq("is_active", true)
          .limit(4);
        if (problems) setDiagnosticProblems(problems);
      }
    }

    // 2. "Also bought" — products from orders containing this product
    const { data: orderIds } = await supabase
      .from("order_items")
      .select("order_id")
      .eq("product_id", productId)
      .limit(50);

    if (orderIds && orderIds.length > 0) {
      const ids = [...new Set(orderIds.map((o: any) => o.order_id))].slice(0, 20);
      const { data: otherItems } = await supabase
        .from("order_items")
        .select("product_id, product_name")
        .in("order_id", ids)
        .neq("product_id", productId)
        .limit(50);

      if (otherItems && otherItems.length > 0) {
        // Count frequency
        const freq: Record<string, { count: number; name: string }> = {};
        otherItems.forEach((i: any) => {
          if (!i.product_id) return;
          if (!freq[i.product_id]) freq[i.product_id] = { count: 0, name: i.product_name };
          freq[i.product_id].count++;
        });

        const topIds = Object.entries(freq)
          .sort((a, b) => b[1].count - a[1].count)
          .slice(0, 4)
          .map(([id]) => id);

        if (topIds.length > 0) {
          const { data: products } = await supabase
            .from("products")
            .select("id, name, price, original_price, image_url, sku, stock_quantity")
            .in("id", topIds)
            .eq("is_active", true);
          if (products) setAlsoBought(products);
        }
      }
    }

    // 3. Related kits
    const { data: productModels } = await supabase
      .from("product_models")
      .select("model_id")
      .eq("product_id", productId);

    if (productModels && productModels.length > 0) {
      const modelIds = productModels.map((pm: any) => pm.model_id);
      const { data: relatedKits } = await supabase
        .from("maintenance_kits")
        .select("id, name, slug, description, kit_type, discount_pct, model_id")
        .in("model_id", modelIds)
        .eq("is_active", true)
        .limit(3);
      if (relatedKits) setKits(relatedKits);
    }
  };

  const hasContent = diagnosticProblems.length > 0 || alsoBought.length > 0 || kits.length > 0;
  if (!hasContent) return null;

  return (
    <>
      {/* Diagnostic Problems */}
      {diagnosticProblems.length > 0 && (
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-2">
            <Stethoscope className="h-6 w-6 text-destructive" /> Indicado Para Resolver
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {diagnosticProblems.map((p: any) => (
              <button
                key={p.id}
                onClick={() => navigate(`/diagnostico/${p.slug}`)}
                className="flex items-start gap-3 p-4 rounded-xl border border-border hover:border-primary/30 hover:shadow-md transition-all text-left bg-card group"
              >
                <Wrench className="h-5 w-5 text-destructive mt-0.5 flex-shrink-0" />
                <div>
                  <p className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">{p.name}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{p.description}</p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Also bought */}
      {alsoBought.length > 0 && (
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
            <ShoppingCart className="h-6 w-6 text-primary" /> Clientes Também Compraram
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {alsoBought.map((p: any) => (
              <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
            ))}
          </div>
        </div>
      )}

      {/* Related Kits */}
      {kits.length > 0 && (
        <div className="mt-14 border-t border-border pt-8">
          <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-2">
            <Package className="h-6 w-6 text-primary" /> Kits Recomendados
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {kits.map((k: any) => (
              <div key={k.id} className="rounded-xl border border-border p-5 bg-card hover:shadow-md transition-shadow">
                <Badge variant="secondary" className="mb-2 capitalize">{k.kit_type}</Badge>
                <h3 className="font-heading font-bold text-foreground">{k.name}</h3>
                {k.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{k.description}</p>}
                {k.discount_pct > 0 && (
                  <Badge variant="destructive" className="mt-2">{k.discount_pct}% de desconto no kit</Badge>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </>
  );
};

export default ProductRecommendations;
