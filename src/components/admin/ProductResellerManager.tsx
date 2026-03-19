import { useMemo, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Package, Store, Loader2, Search } from "lucide-react";

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
  is_legacy_owner?: boolean;
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
  reseller_id: string | null;
}

const roundCurrency = (value: number) => Math.round((value + Number.EPSILON) * 100) / 100;
const toNumber = (value: string | number | null | undefined) => Number(value ?? 0) || 0;
const getMarkupPct = (salePrice: number, supplierPrice: number) => {
  if (salePrice <= 0 || supplierPrice <= 0) return 0;
  return roundCurrency(((salePrice - supplierPrice) / supplierPrice) * 100);
};

const ProductResellerManager = () => {
  const { toast } = useToast();
  const [links, setLinks] = useState<ProductReseller[]>([]);
  const [resellers, setResellers] = useState<Reseller[]>([]);
  const [products, setProducts] = useState<ProductOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedReseller, setSelectedReseller] = useState("");
  const [newStock, setNewStock] = useState("0");
  const [newSupplierPrice, setNewSupplierPrice] = useState("");
  const [newCommissionPct, setNewCommissionPct] = useState("");

  const [filterReseller, setFilterReseller] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadAll();
  }, []);

  const calculatedNewSalePrice = useMemo(() => {
    const supplierPrice = toNumber(newSupplierPrice);
    const commissionPct = toNumber(newCommissionPct);
    if (supplierPrice <= 0) return null;
    return roundCurrency(supplierPrice * (1 + commissionPct / 100));
  }, [newSupplierPrice, newCommissionPct]);

  const loadAll = async () => {
    setLoading(true);
    const [linksRes, resellersRes, productsRes] = await Promise.all([
      supabase.from("product_resellers").select("*").order("created_at", { ascending: false }),
      supabase.from("mechanics").select("id, company_name, user_id, partner_type, is_approved").in("partner_type", ["fornecedor", "oficina"]),
      supabase.from("products").select("id, name, sku, price, stock_quantity, reseller_id").eq("is_active", true).order("name"),
    ]);

    const allLinks = (linksRes.data || []) as ProductReseller[];
    const allResellers = (resellersRes.data || []) as Reseller[];
    const allProducts = (productsRes.data || []) as ProductOption[];

    const enriched = allLinks.map((link) => {
      const product = allProducts.find((item) => item.id === link.product_id);
      return {
        ...link,
        product_name: product?.name || "Produto removido",
        product_price: product?.price || 0,
        reseller_name: allResellers.find((reseller) => reseller.id === link.reseller_id)?.company_name || "Fornecedor removido",
        is_legacy_owner: product?.reseller_id === link.reseller_id,
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

    const exists = links.find((link) => link.product_id === selectedProduct && link.reseller_id === selectedReseller);
    if (exists) {
      toast({ title: "Vínculo já existe", variant: "destructive" });
      return;
    }

    const product = products.find((item) => item.id === selectedProduct);
    const stockQuantity = parseInt(newStock, 10) || 0;
    const supplierPrice = newSupplierPrice ? toNumber(newSupplierPrice) : null;
    const commissionPct = newCommissionPct ? toNumber(newCommissionPct) : null;
    const salePrice = calculatedNewSalePrice ?? product?.price ?? null;

    setSaving(true);
    const { error } = await supabase.from("product_resellers").insert({
      product_id: selectedProduct,
      reseller_id: selectedReseller,
      stock_quantity: stockQuantity,
      reseller_price: supplierPrice,
      store_commission_pct: commissionPct,
      custom_price: salePrice,
    });

    if (!error && product?.reseller_id === selectedReseller) {
      await supabase.from("products").update({
        stock_quantity: stockQuantity,
        price: salePrice ?? product.price,
      }).eq("id", selectedProduct);
    }

    if (error) {
      toast({ title: "Erro ao vincular", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Produto vinculado ao fornecedor! ✅" });
      setSelectedProduct("");
      setSelectedReseller("");
      setNewStock("0");
      setNewSupplierPrice("");
      setNewCommissionPct("");
      loadAll();
    }

    setSaving(false);
  };

  const syncLegacyProduct = async (link: ProductReseller, payload: { stock_quantity?: number; price?: number; is_active?: boolean }) => {
    if (!link.is_legacy_owner) return;

    const productPayload: Record<string, number | boolean> = {};
    if (typeof payload.stock_quantity === "number") productPayload.stock_quantity = payload.stock_quantity;
    if (typeof payload.price === "number") productPayload.price = payload.price;
    if (typeof payload.is_active === "boolean") productPayload.is_active = payload.is_active;

    if (Object.keys(productPayload).length > 0) {
      await supabase.from("products").update(productPayload).eq("id", link.product_id);
    }
  };

  const updateStock = async (link: ProductReseller, value: string) => {
    const stockQuantity = parseInt(value, 10) || 0;
    await supabase.from("product_resellers").update({ stock_quantity: stockQuantity }).eq("id", link.id);
    await syncLegacyProduct(link, { stock_quantity: stockQuantity });
    setLinks((current) => current.map((item) => item.id === link.id ? { ...item, stock_quantity: stockQuantity } : item));
  };

  const updatePricing = async (link: ProductReseller, field: "custom_price" | "reseller_price", rawValue: string) => {
    const currentSalePrice = link.custom_price ?? link.product_price ?? 0;
    const currentSupplierPrice = link.reseller_price ?? 0;
    const nextSalePrice = field === "custom_price" ? (rawValue ? toNumber(rawValue) : currentSalePrice) : currentSalePrice;
    const nextSupplierPrice = field === "reseller_price" ? (rawValue ? toNumber(rawValue) : 0) : currentSupplierPrice;
    const nextCommissionPct = nextSupplierPrice > 0 ? getMarkupPct(nextSalePrice, nextSupplierPrice) : null;

    const payload = {
      custom_price: nextSalePrice > 0 ? nextSalePrice : null,
      reseller_price: nextSupplierPrice > 0 ? nextSupplierPrice : null,
      store_commission_pct: nextCommissionPct,
    };

    await supabase.from("product_resellers").update(payload).eq("id", link.id);
    await syncLegacyProduct(link, { price: payload.custom_price ?? link.product_price ?? 0 });

    setLinks((current) => current.map((item) => item.id === link.id ? {
      ...item,
      custom_price: payload.custom_price,
      reseller_price: payload.reseller_price,
      store_commission_pct: payload.store_commission_pct,
      product_price: link.is_legacy_owner ? payload.custom_price ?? item.product_price : item.product_price,
    } : item));
  };

  const updateStatus = async (link: ProductReseller, nextActive: boolean) => {
    await supabase.from("product_resellers").update({ is_active: nextActive }).eq("id", link.id);
    await syncLegacyProduct(link, { is_active: nextActive });
    setLinks((current) => current.map((item) => item.id === link.id ? { ...item, is_active: nextActive } : item));
  };

  const removeLink = async (id: string) => {
    await supabase.from("product_resellers").delete().eq("id", id);
    setLinks((current) => current.filter((link) => link.id !== id));
    toast({ title: "Vínculo removido" });
  };

  const filtered = links.filter((link) => {
    if (filterReseller && link.reseller_id !== filterReseller) return false;
    if (searchTerm && !link.product_name?.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center p-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Store className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-heading font-bold">Produto × Fornecedor</h2>
        <Badge variant="secondary">{links.length} vínculos</Badge>
      </div>

      <div className="bg-card border border-border rounded-xl p-4 space-y-3">
        <h3 className="text-sm font-bold">Vincular Produto a Fornecedor</h3>
        <div className="grid grid-cols-1 md:grid-cols-7 gap-3">
          <select value={selectedProduct} onChange={(event) => setSelectedProduct(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Selecione produto...</option>
            {products.map((product) => (
              <option key={product.id} value={product.id}>{product.name} {product.sku ? `(${product.sku})` : ""}</option>
            ))}
          </select>
          <select value={selectedReseller} onChange={(event) => setSelectedReseller(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
            <option value="">Selecione fornecedor...</option>
            {resellers.filter((reseller) => reseller.is_approved).map((reseller) => (
              <option key={reseller.id} value={reseller.id}>{reseller.company_name || "Sem nome"} ({reseller.partner_type})</option>
            ))}
          </select>
          <Input type="number" min="0" placeholder="Estoque" value={newStock} onChange={(event) => setNewStock(event.target.value)} />
          <Input type="number" step="0.01" placeholder="Custo fornecedor" value={newSupplierPrice} onChange={(event) => setNewSupplierPrice(event.target.value)} />
          <Input type="number" step="0.1" placeholder="% Loja" value={newCommissionPct} onChange={(event) => setNewCommissionPct(event.target.value)} />
          <div className="h-10 rounded-md border border-input bg-muted/40 px-3 flex items-center text-sm font-semibold">
            {calculatedNewSalePrice != null ? `Venda: R$ ${calculatedNewSalePrice.toFixed(2).replace(".", ",")}` : "Venda calculada"}
          </div>
          <Button onClick={addLink} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4 mr-1" />}
            Vincular
          </Button>
        </div>
      </div>

      <div className="flex gap-3 flex-wrap">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar produto..." value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} className="pl-9" />
        </div>
        <select value={filterReseller} onChange={(event) => setFilterReseller(event.target.value)} className="rounded-lg border border-input bg-background px-3 py-2 text-sm">
          <option value="">Todos fornecedores</option>
          {resellers.map((reseller) => (
            <option key={reseller.id} value={reseller.id}>{reseller.company_name || "Sem nome"}</option>
          ))}
        </select>
      </div>

      <div className="bg-card border border-border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-left p-3 font-semibold">Produto</th>
                <th className="text-left p-3 font-semibold">Fornecedor</th>
                <th className="text-center p-3 font-semibold">Estoque</th>
                <th className="text-center p-3 font-semibold">Preço Venda</th>
                <th className="text-center p-3 font-semibold">Preço Fornecedor</th>
                <th className="text-center p-3 font-semibold">% Loja</th>
                <th className="text-center p-3 font-semibold">Ativo</th>
                <th className="text-center p-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum vínculo encontrado</td></tr>
              ) : filtered.map((link) => {
                const salePrice = link.custom_price ?? link.product_price ?? 0;
                const supplierPrice = link.reseller_price ?? 0;
                const commissionPct = getMarkupPct(salePrice, supplierPrice);
                return (
                  <tr key={link.id} className="border-b border-border hover:bg-muted/30 transition-colors">
                    <td className="p-3">
                      <div className="flex items-center gap-2">
                        <Package className="h-4 w-4 text-primary flex-shrink-0" />
                        <div>
                          <span className="font-medium truncate max-w-[220px] block">{link.product_name}</span>
                          {link.is_legacy_owner && <span className="text-[10px] text-muted-foreground">Produto principal deste fornecedor</span>}
                        </div>
                      </div>
                    </td>
                    <td className="p-3">
                      <Badge variant="outline" className="text-xs">{link.reseller_name}</Badge>
                    </td>
                    <td className="p-3 text-center">
                      <Input type="number" min="0" value={link.stock_quantity} onChange={(event) => updateStock(link, event.target.value)} className="w-20 mx-auto text-center h-8 text-sm" />
                    </td>
                    <td className="p-3 text-center">
                      <Input type="number" step="0.01" value={salePrice || ""} onChange={(event) => updatePricing(link, "custom_price", event.target.value)} className="w-24 mx-auto text-center h-8 text-sm" />
                    </td>
                    <td className="p-3 text-center">
                      <Input type="number" step="0.01" value={link.reseller_price ?? ""} onChange={(event) => updatePricing(link, "reseller_price", event.target.value)} className="w-24 mx-auto text-center h-8 text-sm" />
                    </td>
                    <td className="p-3 text-center">
                      <span className={`text-sm font-bold ${commissionPct > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {commissionPct > 0 ? `${commissionPct.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button onClick={() => updateStatus(link, !link.is_active)} className={`px-2 py-1 rounded-full text-xs font-bold ${link.is_active ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
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
