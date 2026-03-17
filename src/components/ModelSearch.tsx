import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Cpu, Package, ChevronRight } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface CompatResult {
  product_id: string;
  product_name: string;
  product_sku: string | null;
  product_price: number;
  product_image: string | null;
  product_hp: string | null;
  model_id: string;
  model_name: string;
  model_brand: string | null;
  compatibility_notes: string | null;
}

const ModelSearch = () => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CompatResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (query.trim().length < 2) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase.rpc("search_compatible_products", {
      model_search: query.trim(),
      result_limit: 20,
    });
    setResults((data || []) as CompatResult[]);
    setLoading(false);
  };

  // Group results by model
  const grouped = results.reduce((acc, r) => {
    const key = r.model_id;
    if (!acc[key]) acc[key] = { model_name: r.model_name, model_brand: r.model_brand, products: [] };
    acc[key].products.push(r);
    return acc;
  }, {} as Record<string, { model_name: string; model_brand: string | null; products: CompatResult[] }>);

  return (
    <section className="py-14 bg-muted/30">
      <div className="container max-w-4xl">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-heading font-bold text-sm uppercase tracking-wider mb-2">
            <Cpu className="h-4 w-4" />
            Compatibilidade de Peças
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
            Encontre peças pelo modelo do seu gerador
          </h2>
          <p className="text-muted-foreground mt-2">
            Digite o modelo (ex: TG3800, GX160, BD-7.5) e veja todas as peças compatíveis
          </p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6 shadow-sm">
          <form onSubmit={e => { e.preventDefault(); handleSearch(); }} className="flex gap-3">
            <div className="relative flex-1">
              <Cpu className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Digite o modelo do gerador ou motor..."
                value={query}
                onChange={e => setQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Button type="submit" disabled={loading || query.trim().length < 2} className="gap-2">
              <Search className="h-4 w-4" /> Buscar
            </Button>
          </form>

          {loading && (
            <div className="flex justify-center py-8">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          )}

          {!loading && searched && results.length === 0 && (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-2">Nenhuma peça encontrada para "{query}".</p>
              <p className="text-sm text-muted-foreground">Tente outro modelo ou entre em contato pelo WhatsApp.</p>
            </div>
          )}

          {!loading && Object.keys(grouped).length > 0 && (
            <div className="mt-6 space-y-6">
              {Object.entries(grouped).map(([modelId, group]) => (
                <div key={modelId}>
                  <div className="flex items-center gap-2 mb-3">
                    <Cpu className="h-4 w-4 text-primary" />
                    <span className="font-heading font-bold text-foreground">{group.model_name}</span>
                    {group.model_brand && <Badge variant="secondary">{group.model_brand}</Badge>}
                    <Badge variant="outline">{group.products.length} peça{group.products.length !== 1 ? "s" : ""}</Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {group.products.map(p => (
                      <button
                        key={p.product_id}
                        onClick={() => navigate(`/produto/${p.product_id}`)}
                        className="rounded-lg border border-border bg-background p-3 hover:shadow-md hover:border-primary/30 transition-all text-left group"
                      >
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                          {p.product_image ? (
                            <img src={p.product_image} alt={p.product_name} loading="lazy" className="w-full h-full object-contain p-2" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>
                          )}
                        </div>
                        <p className="text-xs font-semibold text-card-foreground line-clamp-2">{p.product_name}</p>
                        {p.product_sku && <p className="text-[10px] text-muted-foreground mt-0.5">Cód: {p.product_sku}</p>}
                        {p.compatibility_notes && <p className="text-[10px] text-primary mt-0.5 italic">{p.compatibility_notes}</p>}
                        <p className="text-sm font-heading font-extrabold text-primary mt-1">
                          R$ {p.product_price.toFixed(2).replace(".", ",")}
                        </p>
                        <span className="text-[10px] text-muted-foreground group-hover:text-primary transition-colors flex items-center gap-0.5 mt-1">
                          Ver produto <ChevronRight className="h-3 w-3" />
                        </span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default ModelSearch;