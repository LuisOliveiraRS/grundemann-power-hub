import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, Store, Save, Loader2, Search } from "lucide-react";

interface ProductReseller {
  id: string;
  product_id: string;
  reseller_id: string;
  stock_quantity: number;
  custom_price: number | null;
  reseller_price: number | null;
  store_commission_pct: number | null;
  is_active: boolean;
  product_name?: string;
  product_price?: number;
  reseller_name?: string;
}

interface Reseller {
  id: string;
  company_name: string;
  user_id: string;
  partner_type: string;
  is_approved: boolean;
}

interface ProductOption {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
}

const ProductResellerManager = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<ProductReseller[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // New link form
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedReseller, setSelectedReseller] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newPrice, setNewPrice] = useState("");

  // Filters
  const [filterReseller, setFilterReseller] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    setLoading(true);
    const [linksRes, resellersRes, productsRes] = await Promise.all([
      supabase.from("product_resellers").select("*").order("created_at", { ascending: false }),
      supabase.from("mechanics").select("id, company_name, user_id, partner_type, is_approved").in("partner_type", ["fornecedor", "oficina"]),
      supabase.from("products").select("id, name, sku, price, stock_quantity").eq("is_active", true).order("name"),
    ]);

    const allLinks = (linksRes.data || []) as ProductReseller[];
    const allResellers = (resellersRes.data || []) as Reseller[];
    const allProducts = (productsRes.data || []) as ProductOption[];

    // Enrich links with names
    const enriched = allLinks.map(l => {
      const product = allProducts.find(p => p.id === l.product_id);
      return {
        ...l,
        product_name: product?.name || "Produto removido",
        product_price: product?.price || 0,
        reseller_name: allResellers.find(r => r.id === l.reseller_id)?.company_name || "Fornecedor removido",
      };
    });

    setLinks(enriched);
    setResellers(allResellers);
    setProducts(allProducts);
    setLoading(false);
  };

  const addLink = async () => {
    if (!selectedProduct || !selectedReseller) {
      toast({ title: "Selecione produto e fornecedor", variant: "destructive" });
      return;
    }

    const exists = links.find(l => l.product_id === selectedProduct && l.reseller_id === selectedReseller);
    if (exists) {
      toast({ title: "Vínculo já existe", variant: "destructive" });
      return;
    }

    setSaving(true);
    const { error } = await supabase.from("product_resellers").insert({
      product_id: selectedProduct,
      reseller_id: selectedReseller,
      stock_quantity: parseInt(newStock) || 0,
      custom_price: newPrice ? parseFloat(newPrice) : null,
    });

    if (error) {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto vinculado ao fornecedor! ✅" });
      setSelectedProduct("");
      setSelectedReseller("");
      setNewStock("0");
      setNewPrice("");
      loadAll();
    }
    setSaving(false);
  };

  const updateLink = async (id: string, field: string, value: any) => {
    const payload: any = { [field]: value };
    await supabase.from("product_resellers").update(payload).eq("id", id);
    setLinks(prev => prev.map(l => l.id === id ? { ...l, ...payload } : l));
  };

  const removeLink = async (id: string) => {
    await supabase.from("product_resellers").delete().eq("id", id);
    setLinks(prev => prev.filter(l => l.id !== id));
    toast({ title: "Vínculo removido" });
  };

  const filtered = links.filter(l => {
    if (filterReseller && l.reseller_id !== filterReseller) return false;
    if (searchTerm && !l.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-heading font-bold">Produto × Fornecedor</h2>
        <Badge variant="secondary">{links.length} vínculos</Badge>
      </div>

      {/* Add new link */}
      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold">Vincular Produto a Fornecedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
          <select
            value={selectedProduct}
            onChange={e => setSelectedProduct(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione produto...</option>
            {products.map(p => (
              <option key={p.id} value={p.id}>{p.name} {p.sku ? `(${p.sku})` : ""}</option>
            ))}
          </select>
          <select
            value={selectedReseller}
            onChange={e => setSelectedReseller(e.target.value)}
            className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="">Selecione revendedor...</option>
            {resellers.filter(r => r.is_approved).map(r => (
              <option key={r.id} value={r.id}>{r.company_name || "Sem nome"} ({r.partner_type})</option>
            ))}
          </select>
          <Input
            type="number" min="0" placeholder="Estoque"
            value={newStock} onChange={e => setNewStock(e.target.value)}
          />
          <Input
            type="number" step="0.01" placeholder="Preço (opcional)"
            value={newPrice} onChange={e => setNewPrice(e.target.value)}
          />
          <Button onClick={addLink} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Vincular
          </Button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produto..."
            value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
            className="pl-9"
          />
        </div>
        <select
          value={filterReseller}
          onChange={e => setFilterReseller(e.target.value)}
          className="rounded-lg border border-input bg-background px-3 py-2 text-sm"
        >
          <option value="">Todos revendedores</option>
          {resellers.map(r => (
            <option key={r.id} value={r.id}>{r.company_name || "Sem nome"}</option>
          ))}
        </select>
      </div>

      {/* Links table */}
      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-semibold">Produto</th>
                <th className="text-left p-3 font-semibold">Revendedor</th>
                <th className="text-center p-3 font-semibold">Estoque</th>
                <th className="text-center p-3 font-semibold">Preço Venda</th>
                <th className="text-center p-3 font-semibold">Preço Revendedor</th>
                <th className="text-center p-3 font-semibold">% Loja</th>
                <th className="text-center p-3 font-semibold">Ativo</th>
                <th className="text-center p-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum vínculo encontrado</td></tr>
              ) : filtered.map(link => {
                const salePrice = link.custom_price ?? link.product_price ?? 0;
                const resellerPrice = link.reseller_price ?? 0;
                const commissionPct = link.store_commission_pct ?? (salePrice > 0 && resellerPrice > 0 ? ((salePrice - resellerPrice) / salePrice * 100) : 0);
                return (
                <tr key={link.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Package className="h-4 w-4 text-primary flex-shrink-0" />
                      <div>
                        <span className="font-medium truncate max-w-[200px] block">{link.product_name}</span>
                        {link.product_price != null && <span className="text-[10px] text-muted-foreground">Original: R$ {link.product_price.toFixed(2).replace(".",",")}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3">
                    <Badge variant="outline" className="text-xs">{link.reseller_name}</Badge>
                  </td>
                  <td className="p-3 text-center">
                    <Input
                      type="number" min="0"
                      value={link.stock_quantity}
                      onChange={e => updateLink(link.id, "stock_quantity", parseInt(e.target.value) || 0)}
                      className="w-20 mx-auto text-center h-8 text-sm"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Input
                      type="number" step="0.01" placeholder="—"
                      value={link.custom_price ?? ""}
                      onChange={e => updateLink(link.id, "custom_price", e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24 mx-auto text-center h-8 text-sm"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <Input
                      type="number" step="0.01" placeholder="—"
                      value={link.reseller_price ?? ""}
                      onChange={e => updateLink(link.id, "reseller_price", e.target.value ? parseFloat(e.target.value) : null)}
                      className="w-24 mx-auto text-center h-8 text-sm"
                    />
                  </td>
                  <td className="p-3 text-center">
                    <span className={`text-sm font-bold ${commissionPct > 0 ? "text-primary" : "text-muted-foreground"}`}>
                      {commissionPct > 0 ? `${commissionPct.toFixed(1)}%` : "—"}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <button
                      onClick={() => updateLink(link.id, "is_active", !link.is_active)}
                      className={`px-2 py-1 rounded-full text-xs font-bold ${link.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}
                    >
                      {link.is_active ? "Sim" : "Não"}
                    </button>
                  </td>
                  <td className="p-3 text-center">
                    <button onClick={() => removeLink(link.id)} className="p-1.5 hover:bg-destructive/10 rounded-lg text-destructive transition-colors">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </td>
                </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProductResellerManager;
