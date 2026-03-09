import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import {
  Search, TrendingDown, TrendingUp, Minus, ExternalLink, Loader2,
  BarChart3, DollarSign, RefreshCw, History, ArrowRight,
} from "lucide-react";

interface Competitor {
  name: string;
  url?: string;
  price: number;
  source?: string;
}

interface ResearchResult {
  competitors: Competitor[];
  suggested_price: number;
  analysis: string;
  our_price: number;
  search_results_count: number;
}

const PriceResearch = () => {
  const [selectedProduct, setSelectedProduct] = useState<string>("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<ResearchResult | null>(null);

  const { data: products } = useQuery({
    queryKey: ["products-for-research"],
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, sku, price")
        .eq("is_active", true)
        .order("name");
      return data || [];
    },
  });

  const { data: history, refetch: refetchHistory } = useQuery({
    queryKey: ["price-research-history"],
    queryFn: async () => {
      const { data } = await supabase
        .from("price_research" as any)
        .select("*, products:product_id(name, sku)")
        .order("created_at", { ascending: false })
        .limit(50);
      return (data as any[]) || [];
    },
  });

  const selectedProductData = products?.find((p) => p.id === selectedProduct);

  const runResearch = async () => {
    if (!selectedProductData) return;
    setLoading(true);
    setResult(null);

    try {
      const { data, error } = await supabase.functions.invoke("research-prices", {
        body: {
          productId: selectedProductData.id,
          productName: selectedProductData.name,
          productSku: selectedProductData.sku,
          ourPrice: selectedProductData.price,
        },
      });

      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Erro desconhecido");

      setResult(data.data);
      refetchHistory();
      toast.success(`Pesquisa concluída! ${data.data.competitors.length} concorrentes encontrados.`);
    } catch (err: any) {
      console.error(err);
      toast.error(err.message || "Erro ao pesquisar preços");
    } finally {
      setLoading(false);
    }
  };

  const getPriceDiffBadge = (diff: number) => {
    if (diff > 5)
      return (
        <Badge variant="destructive" className="gap-1">
          <TrendingUp className="h-3 w-3" />
          {diff.toFixed(1)}% mais caro
        </Badge>
      );
    if (diff < -5)
      return (
        <Badge className="gap-1 bg-emerald-600">
          <TrendingDown className="h-3 w-3" />
          {Math.abs(diff).toFixed(1)}% mais barato
        </Badge>
      );
    return (
      <Badge variant="secondary" className="gap-1">
        <Minus className="h-3 w-3" />
        Preço similar
      </Badge>
    );
  };

  const formatBRL = (v: number) =>
    `R$ ${Number(v).toFixed(2).replace(".", ",")}`;

  return (
    <div className="space-y-6">
      {/* Search Panel */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Pesquisa de Preços da Concorrência
          </CardTitle>
          <p className="text-sm text-muted-foreground">
            Busca real em sites como Mercado Livre, Shopee e lojas especializadas via Firecrawl + IA
          </p>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                {products?.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} {p.sku ? `(${p.sku})` : ""} — {formatBRL(p.price)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={runResearch} disabled={!selectedProduct || loading} className="gap-2">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Search className="h-4 w-4" />}
              {loading ? "Pesquisando..." : "Pesquisar Preços"}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Results */}
      {result && (
        <div className="grid gap-4 md:grid-cols-3">
          {/* Summary Cards */}
          <Card>
            <CardContent className="pt-6 text-center">
              <DollarSign className="h-8 w-8 mx-auto text-primary mb-2" />
              <p className="text-sm text-muted-foreground">Nosso Preço</p>
              <p className="text-2xl font-bold">{formatBRL(result.our_price)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6 text-center">
              <BarChart3 className="h-8 w-8 mx-auto text-orange-500 mb-2" />
              <p className="text-sm text-muted-foreground">Média Concorrência</p>
              <p className="text-2xl font-bold">
                {result.competitors.length > 0
                  ? formatBRL(
                      result.competitors.reduce((s, c) => s + c.price, 0) /
                        result.competitors.length
                    )
                  : "—"}
              </p>
            </CardContent>
          </Card>
          <Card className="border-primary">
            <CardContent className="pt-6 text-center">
              <ArrowRight className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
              <p className="text-sm text-muted-foreground">Preço Sugerido pela IA</p>
              <p className="text-2xl font-bold text-primary">
                {formatBRL(result.suggested_price)}
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Competitors Table */}
      {result && result.competitors.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base">
              Concorrentes Encontrados ({result.competitors.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {result.competitors.map((c, i) => {
                const diffPct = ((result.our_price - c.price) / c.price) * 100;
                return (
                  <div
                    key={i}
                    className="flex items-center justify-between p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-sm truncate">{c.name}</p>
                        {c.source && (
                          <Badge variant="outline" className="text-[10px]">
                            {c.source}
                          </Badge>
                        )}
                      </div>
                      {c.url && (
                        <a
                          href={c.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-primary hover:underline flex items-center gap-1 mt-0.5"
                        >
                          Ver anúncio <ExternalLink className="h-3 w-3" />
                        </a>
                      )}
                    </div>
                    <div className="flex items-center gap-4">
                      <p className="font-bold text-sm">{formatBRL(c.price)}</p>
                      {getPriceDiffBadge(diffPct)}
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* AI Analysis */}
      {result && result.analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              🤖 Análise da IA
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm leading-relaxed text-muted-foreground">{result.analysis}</p>
          </CardContent>
        </Card>
      )}

      {/* History */}
      {history && history.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <History className="h-4 w-4" />
              Histórico de Pesquisas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-[300px] overflow-y-auto">
              {history.map((h: any) => (
                <div
                  key={h.id}
                  className="flex items-center justify-between p-2 rounded border text-sm"
                >
                  <div>
                    <p className="font-medium">{h.products?.name || "Produto"}</p>
                    <p className="text-xs text-muted-foreground">
                      {h.competitor_name} —{" "}
                      {new Date(h.created_at).toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                  <div className="text-right">
                    {h.competitor_price && (
                      <p className="font-bold">{formatBRL(h.competitor_price)}</p>
                    )}
                    {h.price_difference_pct != null && (
                      <p
                        className={`text-xs ${
                          h.price_difference_pct > 0
                            ? "text-destructive"
                            : "text-emerald-600"
                        }`}
                      >
                        {h.price_difference_pct > 0 ? "+" : ""}
                        {Number(h.price_difference_pct).toFixed(1)}%
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PriceResearch;
