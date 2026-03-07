import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft, Download, Loader2, Package, CheckCircle, Search, Filter
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import * as XLSX from "xlsx";

interface Product {
  id: string;
  name: string;
  description: string | null;
  sku: string | null;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  category_id: string | null;
  subcategory_id: string | null;
  additional_images: string[] | null;
}

interface Category {
  id: string;
  name: string;
}

const MLExport = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");

  // ML listing config defaults
  const [config, setConfig] = useState({
    listing_type: "gold_special" as "gold_special" | "gold_pro" | "gold",
    condition: "new" as "new" | "used",
    currency: "BRL",
    warranty_type: "Garantia do vendedor",
    warranty_time: "90 dias",
    free_shipping: true,
    manufacturing_time: "2",
    local_pick_up: false,
  });

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("id, name"),
    ]);
    setProducts((prodRes.data || []) as Product[]);
    setCategories((catRes.data || []) as Category[]);
    setLoading(false);
  };

  const getCategoryName = (id: string | null) => {
    if (!id) return "";
    return categories.find(c => c.id === id)?.name || "";
  };

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedIds.size === filteredProducts.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const filteredProducts = products.filter(p => {
    const matchSearch = !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase());
    const matchCat = !catFilter || p.category_id === catFilter;
    return matchSearch && matchCat;
  });

  const listingTypeLabel: Record<string, string> = {
    gold_special: "Clássico (gold_special)",
    gold_pro: "Premium (gold_pro)",
    gold: "Grátis (gold)",
  };

  const generateExcel = () => {
    const selected = products.filter(p => selectedIds.has(p.id));
    if (selected.length === 0) {
      toast({ title: "Selecione ao menos um produto", variant: "destructive" });
      return;
    }

    setExporting(true);

    try {
      // Build ML-compatible rows
      // These columns follow the Mercado Livre bulk import template
      const rows = selected.map((p, idx) => {
        const allImages = [p.image_url, ...(p.additional_images || [])].filter(Boolean);

        return {
          "Título do anúncio": p.name.substring(0, 60),
          "Categoria do ML": getCategoryName(p.category_id),
          "Tipo de anúncio": config.listing_type,
          "Preço": p.price,
          "Preço original / De": p.original_price || "",
          "Moeda": config.currency,
          "Quantidade disponível": p.stock_quantity,
          "Condição": config.condition === "new" ? "Novo" : "Usado",
          "Descrição": (p.description || "").replace(/<[^>]+>/g, "").substring(0, 50000),
          "SKU": p.sku || "",
          "Código universal de produto (GTIN)": "",
          "Foto 1": allImages[0] || "",
          "Foto 2": allImages[1] || "",
          "Foto 3": allImages[2] || "",
          "Foto 4": allImages[3] || "",
          "Foto 5": allImages[4] || "",
          "Foto 6": allImages[5] || "",
          "Tipo de garantia": config.warranty_type,
          "Tempo de garantia": config.warranty_time,
          "Frete grátis": config.free_shipping ? "Sim" : "Não",
          "Retirada em mãos": config.local_pick_up ? "Sim" : "Não",
          "Prazo de fabricação (dias)": config.manufacturing_time,
          "Marca": "",
          "Modelo": "",
          "Código de catálogo ML": "",
          "Variação": "",
          "Estoque da variação": "",
          "Resumo de erros": "",
        };
      });

      // Create help sheet
      const helpData = [
        ["Planilha de Exportação para Mercado Livre - Grundemann"],
        [""],
        ["INSTRUÇÕES:"],
        ["1. Acesse o Mercado Livre > Anúncios > Cadastro em Massa"],
        ["2. Baixe o modelo oficial da categoria desejada"],
        ["3. Copie os dados desta planilha para o modelo oficial do ML"],
        ["4. As fotos devem ser enviadas via Gestor de Fotos do ML"],
        ["   (https://www.mercadolivre.com.br/anunciar-em-massa/upload)"],
        ["5. Cole as URLs das fotos nas colunas correspondentes"],
        ["6. Revise o 'Resumo de erros' antes de enviar"],
        [""],
        ["COLUNAS IMPORTANTES:"],
        ["- Título: Máximo 60 caracteres"],
        ["- Tipo de anúncio: gold_special (Clássico), gold_pro (Premium), gold (Grátis)"],
        ["- Condição: Novo ou Usado"],
        ["- Fotos: URLs públicas das imagens (use o Gestor de Fotos do ML)"],
        ["- Categoria do ML: Deve corresponder à categoria no Mercado Livre"],
        [""],
        [`Data de exportação: ${new Date().toLocaleDateString("pt-BR")}`],
        [`Total de produtos: ${rows.length}`],
      ];

      const wb = XLSX.utils.book_new();

      // Help tab
      const wsHelp = XLSX.utils.aoa_to_sheet(helpData);
      wsHelp["!cols"] = [{ wch: 80 }];
      XLSX.utils.book_append_sheet(wb, wsHelp, "Ajuda");

      // Products tab
      const wsProducts = XLSX.utils.json_to_sheet(rows);
      // Set column widths
      wsProducts["!cols"] = [
        { wch: 60 }, // Título
        { wch: 25 }, // Categoria
        { wch: 18 }, // Tipo
        { wch: 12 }, // Preço
        { wch: 12 }, // Preço original
        { wch: 8 },  // Moeda
        { wch: 12 }, // Qtd
        { wch: 10 }, // Condição
        { wch: 50 }, // Descrição
        { wch: 15 }, // SKU
        { wch: 20 }, // GTIN
        { wch: 50 }, // Fotos...
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 50 },
        { wch: 18 }, // Garantia tipo
        { wch: 15 }, // Garantia tempo
        { wch: 12 }, // Frete
        { wch: 12 }, // Retirada
        { wch: 18 }, // Prazo fabricação
        { wch: 15 }, // Marca
        { wch: 15 }, // Modelo
        { wch: 20 }, // Código catálogo
        { wch: 20 }, // Variação
        { wch: 15 }, // Estoque variação
        { wch: 30 }, // Resumo erros
      ];
      XLSX.utils.book_append_sheet(wb, wsProducts, "Produtos ML");

      const fileName = `mercado-livre-export-${new Date().toISOString().split("T")[0]}.xlsx`;
      XLSX.writeFile(wb, fileName);

      toast({
        title: "Planilha exportada com sucesso!",
        description: `${rows.length} produtos exportados para ${fileName}`,
      });
    } catch (err: any) {
      console.error("Export error:", err);
      toast({ title: "Erro ao exportar", description: err.message, variant: "destructive" });
    } finally {
      setExporting(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-muted/50 flex items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-muted/50 p-6 md:p-10">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <Button variant="ghost" size="icon" onClick={() => navigate("/admin")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="font-heading text-3xl font-bold text-foreground">Exportar para Mercado Livre</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Gere uma planilha Excel compatível com o cadastro em massa do Mercado Livre
            </p>
          </div>
        </div>

        {/* Config card */}
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
          <h2 className="font-heading text-lg font-bold mb-4">Configurações do Anúncio</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <Label className="text-xs">Tipo de Anúncio</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={config.listing_type}
                onChange={(e) => setConfig(prev => ({ ...prev, listing_type: e.target.value as any }))}
              >
                <option value="gold_special">Clássico</option>
                <option value="gold_pro">Premium</option>
                <option value="gold">Grátis</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Condição</Label>
              <select
                className="w-full mt-1 h-9 rounded-md border border-input bg-background px-3 text-sm"
                value={config.condition}
                onChange={(e) => setConfig(prev => ({ ...prev, condition: e.target.value as any }))}
              >
                <option value="new">Novo</option>
                <option value="used">Usado</option>
              </select>
            </div>
            <div>
              <Label className="text-xs">Garantia</Label>
              <Input
                value={config.warranty_time}
                onChange={(e) => setConfig(prev => ({ ...prev, warranty_time: e.target.value }))}
                className="mt-1 h-9"
                placeholder="Ex: 90 dias"
              />
            </div>
            <div>
              <Label className="text-xs">Prazo Fabricação (dias)</Label>
              <Input
                value={config.manufacturing_time}
                onChange={(e) => setConfig(prev => ({ ...prev, manufacturing_time: e.target.value }))}
                className="mt-1 h-9"
                placeholder="Ex: 2"
              />
            </div>
          </div>
          <div className="flex gap-6 mt-4">
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.free_shipping}
                onChange={(e) => setConfig(prev => ({ ...prev, free_shipping: e.target.checked }))}
                className="rounded"
              />
              Frete Grátis
            </label>
            <label className="flex items-center gap-2 text-sm cursor-pointer">
              <input
                type="checkbox"
                checked={config.local_pick_up}
                onChange={(e) => setConfig(prev => ({ ...prev, local_pick_up: e.target.checked }))}
                className="rounded"
              />
              Retirada em Mãos
            </label>
          </div>
        </div>

        {/* Filters + actions */}
        <div className="flex items-center justify-between mb-4 gap-4 flex-wrap">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar produto..."
                className="pl-9 h-9"
              />
            </div>
            <select
              className="h-9 rounded-md border border-input bg-background px-3 text-sm"
              value={catFilter}
              onChange={(e) => setCatFilter(e.target.value)}
            >
              <option value="">Todas categorias</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
            <Badge variant="secondary" className="text-sm px-3 py-1">
              {selectedIds.size} selecionados
            </Badge>
          </div>
          <Button onClick={generateExcel} disabled={selectedIds.size === 0 || exporting}>
            {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
            Exportar Planilha ML ({selectedIds.size})
          </Button>
        </div>

        {/* Products table */}
        <div className="bg-card rounded-xl shadow-lg border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border bg-muted/30">
                  <th className="p-3 w-10">
                    <input
                      type="checkbox"
                      checked={selectedIds.size === filteredProducts.length && filteredProducts.length > 0}
                      onChange={toggleAll}
                      className="rounded"
                    />
                  </th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider w-16">Img</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Produto</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">SKU</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Categoria</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Preço</th>
                  <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Estoque</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredProducts.map(p => (
                  <tr
                    key={p.id}
                    className={`hover:bg-muted/20 transition-colors cursor-pointer ${selectedIds.has(p.id) ? "bg-primary/5" : ""}`}
                    onClick={() => toggleSelect(p.id)}
                  >
                    <td className="p-3">
                      <input
                        type="checkbox"
                        checked={selectedIds.has(p.id)}
                        onChange={() => toggleSelect(p.id)}
                        onClick={(e) => e.stopPropagation()}
                        className="rounded"
                      />
                    </td>
                    <td className="p-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt={p.name} className="h-10 w-10 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-3">
                      <p className="font-medium text-sm line-clamp-1">{p.name}</p>
                    </td>
                    <td className="p-3">
                      <span className="text-sm text-muted-foreground font-mono">{p.sku || "—"}</span>
                    </td>
                    <td className="p-3">
                      <Badge variant="secondary" className="text-xs">{getCategoryName(p.category_id) || "—"}</Badge>
                    </td>
                    <td className="p-3">
                      <span className="text-sm font-medium">R$ {p.price.toFixed(2).replace(".", ",")}</span>
                    </td>
                    <td className="p-3">
                      <span className={`text-sm ${p.stock_quantity <= 0 ? "text-destructive font-bold" : "text-muted-foreground"}`}>
                        {p.stock_quantity}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredProducts.length === 0 && (
                  <tr>
                    <td colSpan={7} className="p-10 text-center text-muted-foreground">
                      Nenhum produto encontrado
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Info box */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mt-6">
          <h3 className="font-semibold text-sm text-primary mb-2 flex items-center gap-2">
            <CheckCircle className="h-4 w-4" /> Como usar a planilha no Mercado Livre
          </h3>
          <ol className="text-xs text-muted-foreground space-y-1 list-decimal list-inside">
            <li>Baixe a planilha gerada clicando em "Exportar Planilha ML"</li>
            <li>Acesse o Mercado Livre → Anúncios → Cadastro em Massa</li>
            <li>Baixe o modelo oficial da categoria desejada no ML</li>
            <li>Copie os dados desta planilha para o modelo oficial</li>
            <li>Envie as fotos pelo Gestor de Fotos do ML e cole as URLs</li>
            <li>Envie a planilha preenchida para criar os anúncios</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default MLExport;
