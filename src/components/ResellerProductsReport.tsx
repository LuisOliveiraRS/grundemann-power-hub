import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, DollarSign, ShoppingCart, Loader2, AlertTriangle, Printer, Store } from "lucide-react";

interface ResellerProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  original_price: number | null;
  stock_quantity: number;
  image_url: string | null;
  is_active: boolean;
  reseller_stock?: number | null;
  custom_price?: number | null;
  reseller_price?: number | null;
  store_commission_pct?: number | null;
}

interface SalesData {
  product_id: string;
  total_qty: number;
  total_value: number;
}

interface ResellerProductsReportProps {
  resellerId: string;
  supplierName?: string;
  isAdminView?: boolean;
}

const ResellerProductsReport = ({ resellerId, supplierName, isAdminView }: ResellerProductsReportProps) => {
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "30d" | "90d" | "year">("all");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (resellerId) loadData();
  }, [resellerId, filterPeriod]);

  const loadData = async () => {
    setLoading(true);
    const [legacyRes, newLinksRes] = await Promise.all([
      supabase.from("products").select("id, name, sku, price, original_price, stock_quantity, image_url, is_active").eq("reseller_id", resellerId).order("name"),
      supabase.from("product_resellers").select("product_id, stock_quantity, custom_price, reseller_price, store_commission_pct, is_active").eq("reseller_id", resellerId).eq("is_active", true),
    ]);

    const legacyProducts = (legacyRes.data || []) as ResellerProduct[];
    const newLinks = (newLinksRes.data || []) as any[];
    const legacyIds = new Set(legacyProducts.map(p => p.id));
    const newProductIds = newLinks.map(l => l.product_id).filter(id => !legacyIds.has(id));

    let extraProducts: ResellerProduct[] = [];
    if (newProductIds.length > 0) {
      const { data } = await supabase.from("products").select("id, name, sku, price, original_price, stock_quantity, image_url, is_active").in("id", newProductIds);
      extraProducts = (data || []) as ResellerProduct[];
    }

    const allProducts = [...legacyProducts, ...extraProducts].map(p => {
      const link = newLinks.find(l => l.product_id === p.id);
      return { ...p, reseller_stock: link?.stock_quantity ?? null, custom_price: link?.custom_price ?? null, reseller_price: link?.reseller_price ?? null, store_commission_pct: link?.store_commission_pct ?? null };
    });

    const seen = new Set<string>();
    const productList = allProducts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
    setProducts(productList);

    if (productList.length > 0) {
      const productIds = productList.map(p => p.id);
      const { data: items } = await supabase.from("order_items").select("product_id, quantity, price_at_purchase, order_id").in("product_id", productIds);

      if (items && items.length > 0) {
        const orderIds = [...new Set(items.map((i: any) => i.order_id))];
        let ordersQuery = supabase.from("orders").select("id, status, created_at").in("id", orderIds).in("status", ["confirmed", "processing", "shipped", "delivered"]);

        if (filterPeriod !== "all") {
          const now = new Date();
          let fromDate: Date;
          if (filterPeriod === "30d") fromDate = new Date(now.getTime() - 30 * 86400000);
          else if (filterPeriod === "90d") fromDate = new Date(now.getTime() - 90 * 86400000);
          else fromDate = new Date(now.getFullYear(), 0, 1);
          ordersQuery = ordersQuery.gte("created_at", fromDate.toISOString());
        }

        const { data: orders } = await ordersQuery;
        const validOrderIds = new Set((orders || []).map((o: any) => o.id));
        const salesMap = new Map<string, SalesData>();
        (items as any[]).forEach(item => {
          if (!validOrderIds.has(item.order_id)) return;
          const existing = salesMap.get(item.product_id) || { product_id: item.product_id, total_qty: 0, total_value: 0 };
          existing.total_qty += item.quantity;
          existing.total_value += item.quantity * item.price_at_purchase;
          salesMap.set(item.product_id, existing);
        });
        setSalesData(Array.from(salesMap.values()));
      } else {
        setSalesData([]);
      }
    }
    setLoading(false);
  };

  const getSales = (productId: string) => salesData.find(s => s.product_id === productId);

  const filtered = products.filter(p =>
    !search || p.name.toLowerCase().includes(search.toLowerCase()) || (p.sku || "").toLowerCase().includes(search.toLowerCase())
  );

  // Financial calculations
  const getProductFinancials = (p: ResellerProduct) => {
    const salePrice = p.custom_price ?? p.price;
    const resellerPrice = p.reseller_price ?? 0;
    const commissionPct = p.store_commission_pct ?? (salePrice > 0 && resellerPrice > 0 ? ((salePrice - resellerPrice) / salePrice * 100) : 0);
    const storeCommissionValue = salePrice - resellerPrice;
    const stock = p.reseller_stock ?? p.stock_quantity;
    const totalProductValue = salePrice * stock;
    const totalSupplierValue = resellerPrice * stock;
    const totalStoreCommission = storeCommissionValue * stock;
    return { salePrice, resellerPrice, commissionPct, storeCommissionValue, stock, totalProductValue, totalSupplierValue, totalStoreCommission };
  };

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (p.reseller_stock ?? p.stock_quantity), 0);
  const totalSold = salesData.reduce((s, d) => s + d.total_qty, 0);
  const totalRevenue = salesData.reduce((s, d) => s + d.total_value, 0);

  // Grand totals
  const grandTotalProductValue = products.reduce((s, p) => s + getProductFinancials(p).totalProductValue, 0);
  const grandTotalSupplierValue = products.reduce((s, p) => s + getProductFinancials(p).totalSupplierValue, 0);
  const grandTotalStoreCommission = products.reduce((s, p) => s + getProductFinancials(p).totalStoreCommission, 0);

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;
  const periodLabel = filterPeriod === "all" ? "Todo o período" : filterPeriod === "30d" ? "Últimos 30 dias" : filterPeriod === "90d" ? "Últimos 90 dias" : "Este ano";

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Relatório de Produtos do Fornecedor</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 11px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      .header h1 { font-size: 18px; margin-bottom: 4px; }
      .header p { color: #666; font-size: 11px; }
      .kpi-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
      .kpi { border: 1px solid #ddd; border-radius: 6px; padding: 8px; text-align: center; }
      .kpi .label { font-size: 9px; color: #666; text-transform: uppercase; }
      .kpi .value { font-size: 14px; font-weight: bold; margin-top: 2px; }
      .financial-summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px; margin-bottom: 16px; }
      .fin-box { border: 2px solid #333; border-radius: 6px; padding: 10px; text-align: center; background: #f9f9f9; }
      .fin-box .label { font-size: 9px; color: #666; text-transform: uppercase; }
      .fin-box .value { font-size: 16px; font-weight: bold; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; margin-top: 10px; }
      th { background: #f0f0f0; padding: 6px 4px; text-align: left; font-size: 9px; text-transform: uppercase; border-bottom: 2px solid #333; }
      td { padding: 5px 4px; border-bottom: 1px solid #eee; font-size: 10px; }
      tr:nth-child(even) { background: #fafafa; }
      .text-right { text-align: right; }
      .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
      @media print { body { padding: 10px; } }
    </style></head><body>`);

    win.document.write(`<div class="header"><h1>Relatório de Produtos do Fornecedor</h1>`);
    win.document.write(`<p>${supplierName || "Fornecedor"} · ${periodLabel} · Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p></div>`);

    // KPIs
    win.document.write(`<div class="kpi-grid">`);
    [
      { label: "Produtos", value: totalProducts },
      { label: "Estoque Total", value: totalStock },
      { label: "Unidades Vendidas", value: totalSold },
      { label: "Receita de Vendas", value: formatBRL(totalRevenue) },
    ].forEach(k => win.document.write(`<div class="kpi"><div class="label">${k.label}</div><div class="value">${k.value}</div></div>`));
    win.document.write(`</div>`);

    // Financial summary
    win.document.write(`<div class="financial-summary">`);
    win.document.write(`<div class="fin-box"><div class="label">Valor Total em Produtos (Venda)</div><div class="value">${formatBRL(grandTotalProductValue)}</div></div>`);
    win.document.write(`<div class="fin-box"><div class="label">Valor Fornecedor (Custo)</div><div class="value">${formatBRL(grandTotalSupplierValue)}</div></div>`);
    win.document.write(`<div class="fin-box"><div class="label">Comissão Loja Grundemann</div><div class="value" style="color:#16a34a">${formatBRL(grandTotalStoreCommission)}</div></div>`);
    win.document.write(`</div>`);

    // Table
    win.document.write(`<table><thead><tr><th>Produto</th><th>SKU</th><th class="text-right">Preço Venda</th><th class="text-right">Preço Fornecedor</th><th class="text-right">Comissão Loja (R$)</th><th class="text-right">% Loja</th><th class="text-right">Estoque</th><th class="text-right">Vendidos</th><th class="text-right">Valor Vendido</th><th>Status</th></tr></thead><tbody>`);

    filtered.forEach(p => {
      const f = getProductFinancials(p);
      const sales = getSales(p.id);
      const status = f.stock <= 0 ? "Sem estoque" : p.is_active ? "Ativo" : "Inativo";
      win.document.write(`<tr>
        <td>${p.name}</td><td>${p.sku || "—"}</td>
        <td class="text-right">${formatBRL(f.salePrice)}</td>
        <td class="text-right">${f.resellerPrice > 0 ? formatBRL(f.resellerPrice) : "—"}</td>
        <td class="text-right">${f.storeCommissionValue > 0 ? formatBRL(f.storeCommissionValue) : "—"}</td>
        <td class="text-right">${f.commissionPct > 0 ? f.commissionPct.toFixed(1) + "%" : "—"}</td>
        <td class="text-right">${f.stock}</td>
        <td class="text-right">${sales?.total_qty || 0}</td>
        <td class="text-right">${formatBRL(sales?.total_value || 0)}</td>
        <td>${status}</td>
      </tr>`);
    });

    win.document.write(`</tbody></table>`);
    win.document.write(`<div class="footer">Grundemann Power Hub · Relatório gerado automaticamente</div>`);
    win.document.write(`</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (products.length === 0) {
    return (
      <Card>
        <CardContent className="py-12 text-center">
          <Package className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">Nenhum produto vinculado a este fornecedor.</p>
          <p className="text-xs text-muted-foreground mt-1">O administrador pode vincular produtos ao seu perfil de fornecedor.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6" ref={printRef}>
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Meus Produtos", value: totalProducts, icon: Package, color: "text-primary" },
          { label: "Estoque Total", value: totalStock, icon: AlertTriangle, color: totalStock <= 5 ? "text-destructive" : "text-primary" },
          { label: "Unidades Vendidas", value: totalSold, icon: ShoppingCart, color: "text-primary" },
          { label: "Valor Vendido", value: formatBRL(totalRevenue), icon: DollarSign, color: "text-primary" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10"><kpi.icon className={`h-5 w-5 ${kpi.color}`} /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-heading font-bold text-lg">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Financial Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor Total em Produtos (Venda)</p>
            <p className="font-heading font-bold text-2xl mt-1">{formatBRL(grandTotalProductValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{totalStock} unidades em estoque</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-secondary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor Fornecedor (Custo)</p>
            <p className="font-heading font-bold text-2xl mt-1">{formatBRL(grandTotalSupplierValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Custo total dos produtos</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <Store className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Comissão Loja Grundemann</p>
            </div>
            <p className="font-heading font-bold text-2xl text-primary">{formatBRL(grandTotalStoreCommission)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">
              {grandTotalProductValue > 0 ? `${((grandTotalStoreCommission / grandTotalProductValue) * 100).toFixed(1)}% média` : "—"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters + Print */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto..." className="pl-9 h-9" />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={filterPeriod} onChange={e => setFilterPeriod(e.target.value as any)}>
          <option value="all">Todo período</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="year">Este ano</option>
        </select>
        <Badge variant="secondary">{filtered.length} produtos</Badge>
        <Button variant="outline" size="sm" onClick={handlePrint} className="ml-auto gap-1.5">
          <Printer className="h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

      {/* Product table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 w-12"></th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Produto</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Preço Venda</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Preço Fornecedor</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Comissão Loja (R$)</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">% Loja</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Estoque</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Vendidos</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Valor Vendido</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const f = getProductFinancials(p);
                const sales = getSales(p.id);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </td>
                    <td className="p-3"><p className="text-sm font-medium line-clamp-1">{p.name}</p></td>
                    <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{p.sku || "—"}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{formatBRL(f.salePrice)}</span></td>
                    <td className="p-3 text-right"><span className="text-sm">{f.resellerPrice > 0 ? formatBRL(f.resellerPrice) : "—"}</span></td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-semibold ${f.storeCommissionValue > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {f.storeCommissionValue > 0 ? formatBRL(f.storeCommissionValue) : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-bold ${f.commissionPct > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {f.commissionPct > 0 ? `${f.commissionPct.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${f.stock <= 0 ? "text-destructive" : f.stock <= 5 ? "text-yellow-600" : ""}`}>{f.stock}</span>
                        {p.reseller_stock !== null && p.reseller_stock !== undefined && (
                          <span className="text-[10px] text-muted-foreground">Geral: {p.stock_quantity}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{sales?.total_qty || 0}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{formatBRL(sales?.total_value || 0)}</span></td>
                    <td className="p-3">
                      {f.stock <= 0 ? (
                        <Badge variant="destructive" className="text-xs">Sem estoque</Badge>
                      ) : p.is_active ? (
                        <Badge className="bg-primary/20 text-primary text-xs">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={11} className="p-10 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
              )}
              {/* Totals row */}
              {filtered.length > 0 && (
                <tr className="bg-muted/50 font-bold border-t-2 border-border">
                  <td className="p-3" colSpan={3}><span className="text-sm">TOTAIS</span></td>
                  <td className="p-3 text-right text-sm">{formatBRL(grandTotalProductValue)}</td>
                  <td className="p-3 text-right text-sm">{formatBRL(grandTotalSupplierValue)}</td>
                  <td className="p-3 text-right text-sm text-primary">{formatBRL(grandTotalStoreCommission)}</td>
                  <td className="p-3 text-right text-sm">
                    {grandTotalProductValue > 0 ? `${((grandTotalStoreCommission / grandTotalProductValue) * 100).toFixed(1)}%` : "—"}
                  </td>
                  <td className="p-3 text-right text-sm">{totalStock}</td>
                  <td className="p-3 text-right text-sm">{totalSold}</td>
                  <td className="p-3 text-right text-sm">{formatBRL(totalRevenue)}</td>
                  <td className="p-3"></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ResellerProductsReport;
