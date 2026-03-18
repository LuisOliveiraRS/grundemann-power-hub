import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Package, Search, TrendingUp, DollarSign, ShoppingCart, Loader2, AlertTriangle } from "lucide-react";

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
}

const ResellerProductsReport = ({ resellerId }: ResellerProductsReportProps) => {
  const [products, setProducts] = useState<ResellerProduct[]>([]);
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<"all" | "30d" | "90d" | "year">("all");

  useEffect(() => {
    if (resellerId) loadData();
  }, [resellerId, filterPeriod]);

  const loadData = async () => {
    setLoading(true);

    // Get products from legacy reseller_id AND new product_resellers table
    const [legacyRes, newLinksRes] = await Promise.all([
      supabase.from("products").select("id, name, sku, price, original_price, stock_quantity, image_url, is_active").eq("reseller_id", resellerId).order("name"),
      supabase.from("product_resellers").select("product_id, stock_quantity, custom_price, reseller_price, store_commission_pct, is_active").eq("reseller_id", resellerId).eq("is_active", true),
    ]);

    const legacyProducts = (legacyRes.data || []) as ResellerProduct[];
    const newLinks = (newLinksRes.data || []) as any[];

    // Fetch products from new links that aren't already in legacy
    const legacyIds = new Set(legacyProducts.map(p => p.id));
    const newProductIds = newLinks.map(l => l.product_id).filter(id => !legacyIds.has(id));

    let extraProducts: ResellerProduct[] = [];
    if (newProductIds.length > 0) {
      const { data } = await supabase.from("products").select("id, name, sku, price, original_price, stock_quantity, image_url, is_active").in("id", newProductIds);
      extraProducts = (data || []) as ResellerProduct[];
    }

    // Merge: enrich all products with reseller-specific stock/price
    const allProducts = [...legacyProducts, ...extraProducts].map(p => {
      const link = newLinks.find(l => l.product_id === p.id);
      return {
        ...p,
        reseller_stock: link?.stock_quantity ?? null,
        custom_price: link?.custom_price ?? null,
        reseller_price: link?.reseller_price ?? null,
        store_commission_pct: link?.store_commission_pct ?? null,
      };
    });

    // Deduplicate by id
    const seen = new Set<string>();
    const productList = allProducts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });
    setProducts(productList);

    if (productList.length > 0) {
      const productIds = productList.map(p => p.id);

      // Get order_items for these products
      let orderItemsQuery = supabase
        .from("order_items")
        .select("product_id, quantity, price_at_purchase, order_id")
        .in("product_id", productIds);

      const { data: items } = await orderItemsQuery;

      if (items && items.length > 0) {
        // Get orders to filter by date and only count confirmed+
        const orderIds = [...new Set(items.map((i: any) => i.order_id))];
        let ordersQuery = supabase
          .from("orders")
          .select("id, status, created_at")
          .in("id", orderIds)
          .in("status", ["confirmed", "processing", "shipped", "delivered"]);

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

        // Aggregate sales per product
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

  const totalProducts = products.length;
  const totalStock = products.reduce((s, p) => s + (p.reseller_stock ?? p.stock_quantity), 0);
  const totalSold = salesData.reduce((s, d) => s + d.total_qty, 0);
  const totalRevenue = salesData.reduce((s, d) => s + d.total_value, 0);

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
    <div className="space-y-6">
      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Meus Produtos", value: totalProducts, icon: Package, color: "text-primary" },
          { label: "Estoque Total", value: totalStock, icon: AlertTriangle, color: totalStock <= 5 ? "text-destructive" : "text-primary" },
          { label: "Unidades Vendidas", value: totalSold, icon: ShoppingCart, color: "text-primary" },
          { label: "Valor Vendido", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
        ].map(kpi => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10">
                  <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-heading font-bold text-lg">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
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
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Preço Original</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Preço Venda</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Preço Fornecedor</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">% Loja</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Estoque</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Vendidos</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Valor Vendido</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const sales = getSales(p.id);
                const salePrice = p.custom_price ?? p.price;
                const resellerPrice = p.reseller_price ?? 0;
                const commissionPct = p.store_commission_pct ?? (salePrice > 0 && resellerPrice > 0 ? ((salePrice - resellerPrice) / salePrice * 100) : 0);
                return (
                  <tr key={p.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-3"><p className="text-sm font-medium line-clamp-1">{p.name}</p></td>
                    <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{p.sku || "—"}</span></td>
                    <td className="p-3 text-right">
                      <span className="text-xs text-muted-foreground line-through">
                        {p.original_price ? `R$ ${p.original_price.toFixed(2).replace(".",",")}` : `R$ ${p.price.toFixed(2).replace(".",",")}`}
                      </span>
                    </td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">R$ {salePrice.toFixed(2).replace(".", ",")}</span></td>
                    <td className="p-3 text-right">
                      <span className="text-sm">{resellerPrice > 0 ? `R$ ${resellerPrice.toFixed(2).replace(".",",")}` : "—"}</span>
                    </td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-bold ${commissionPct > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {commissionPct > 0 ? `${commissionPct.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${(p.reseller_stock ?? p.stock_quantity) <= 0 ? "text-destructive" : (p.reseller_stock ?? p.stock_quantity) <= 5 ? "text-yellow-600" : ""}`}>
                          {p.reseller_stock ?? p.stock_quantity}
                        </span>
                        {p.reseller_stock !== null && p.reseller_stock !== undefined && (
                          <span className="text-[10px] text-muted-foreground">Geral: {p.stock_quantity}</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{sales?.total_qty || 0}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">R$ {(sales?.total_value || 0).toFixed(2).replace(".", ",")}</span></td>
                    <td className="p-3">
                      {(p.reseller_stock ?? p.stock_quantity) <= 0 ? (
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
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
};

export default ResellerProductsReport;
