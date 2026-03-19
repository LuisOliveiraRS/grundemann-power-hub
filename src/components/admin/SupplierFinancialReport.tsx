import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, Store, DollarSign, Package, Printer, ChevronRight, ShoppingCart, TrendingUp } from "lucide-react";
import ResellerProductsReport from "@/components/ResellerProductsReport";

interface SupplierSummary {
  id: string;
  company_name: string;
  user_id: string;
  totalProducts: number;
  totalStock: number;
  totalInventoryValue: number;
  totalSalesRevenue: number;
  totalSupplierCostFromSales: number;
  totalStoreCommissionFromSales: number;
  totalUnitsSold: number;
}

const SupplierFinancialReport = () => {
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummary | null>(null);

  useEffect(() => { loadSuppliers(); }, []);

  const loadSuppliers = async () => {
    setLoading(true);
    const { data: mechanics } = await supabase.from("mechanics").select("id, company_name, user_id").eq("partner_type", "fornecedor");
    if (!mechanics || mechanics.length === 0) { setSuppliers([]); setLoading(false); return; }

    const summaries: SupplierSummary[] = [];

    for (const mech of mechanics) {
      // Get products linked to this supplier
      const [legacyRes, linksRes] = await Promise.all([
        supabase.from("products").select("id, price, stock_quantity").eq("reseller_id", mech.id),
        supabase.from("product_resellers").select("product_id, stock_quantity, custom_price, reseller_price, store_commission_pct").eq("reseller_id", mech.id).eq("is_active", true),
      ]);

      const legacyProducts = legacyRes.data || [];
      const links = linksRes.data || [];
      const legacyIds = new Set(legacyProducts.map(p => p.id));
      const newIds = links.map(l => l.product_id).filter(id => !legacyIds.has(id));

      let extraProducts: any[] = [];
      if (newIds.length > 0) {
        const { data } = await supabase.from("products").select("id, price, stock_quantity").in("id", newIds);
        extraProducts = data || [];
      }

      const allProducts = [...legacyProducts, ...extraProducts];
      const seen = new Set<string>();
      const uniqueProducts = allProducts.filter(p => { if (seen.has(p.id)) return false; seen.add(p.id); return true; });

      // Calculate inventory value (just for reference)
      let totalInventoryValue = 0;
      let totalStock = 0;
      uniqueProducts.forEach(p => {
        const link = links.find(l => l.product_id === p.id);
        const salePrice = link?.custom_price ?? p.price;
        const stock = link?.stock_quantity ?? p.stock_quantity;
        totalInventoryValue += salePrice * stock;
        totalStock += stock;
      });

      // Calculate SALES-based commission from order_items
      let totalSalesRevenue = 0;
      let totalSupplierCostFromSales = 0;
      let totalUnitsSold = 0;

      if (uniqueProducts.length > 0) {
        const productIds = uniqueProducts.map(p => p.id);
        const { data: orderItems } = await supabase
          .from("order_items")
          .select("product_id, quantity, price_at_purchase, order_id")
          .in("product_id", productIds);

        if (orderItems && orderItems.length > 0) {
          const orderIds = [...new Set(orderItems.map(i => i.order_id))];
          const { data: validOrders } = await supabase
            .from("orders")
            .select("id")
            .in("id", orderIds)
            .in("status", ["confirmed", "processing", "shipped", "delivered"]);

          const validOrderIds = new Set((validOrders || []).map(o => o.id));

          orderItems.forEach(item => {
            if (!validOrderIds.has(item.order_id)) return;
            const link = links.find(l => l.product_id === item.product_id);
            const resellerPrice = link?.reseller_price ?? 0;
            const soldValue = item.quantity * item.price_at_purchase;
            const supplierCost = item.quantity * resellerPrice;

            totalSalesRevenue += soldValue;
            totalSupplierCostFromSales += supplierCost;
            totalUnitsSold += item.quantity;
          });
        }
      }

      summaries.push({
        id: mech.id,
        company_name: mech.company_name || "Sem nome",
        user_id: mech.user_id,
        totalProducts: uniqueProducts.length,
        totalStock,
        totalInventoryValue,
        totalSalesRevenue,
        totalSupplierCostFromSales,
        totalStoreCommissionFromSales: totalSalesRevenue - totalSupplierCostFromSales,
        totalUnitsSold,
      });
    }

    setSuppliers(summaries.sort((a, b) => b.totalSalesRevenue - a.totalSalesRevenue));
    setLoading(false);
  };

  const formatBRL = (v: number) => `R$ ${v.toFixed(2).replace(".", ",")}`;

  const grandTotalRevenue = suppliers.reduce((s, sup) => s + sup.totalSalesRevenue, 0);
  const grandTotalSupplierCost = suppliers.reduce((s, sup) => s + sup.totalSupplierCostFromSales, 0);
  const grandTotalCommission = suppliers.reduce((s, sup) => s + sup.totalStoreCommissionFromSales, 0);
  const grandTotalProducts = suppliers.reduce((s, sup) => s + sup.totalProducts, 0);
  const grandTotalSold = suppliers.reduce((s, sup) => s + sup.totalUnitsSold, 0);
  const grandTotalInventory = suppliers.reduce((s, sup) => s + sup.totalInventoryValue, 0);

  const handlePrintSummary = () => {
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`<!DOCTYPE html><html><head><title>Relatório Financeiro de Fornecedores</title><style>
      * { margin: 0; padding: 0; box-sizing: border-box; }
      body { font-family: Arial, sans-serif; padding: 20px; color: #1a1a1a; font-size: 11px; }
      .header { text-align: center; margin-bottom: 20px; border-bottom: 2px solid #333; padding-bottom: 10px; }
      .header h1 { font-size: 18px; margin-bottom: 4px; }
      .header p { color: #666; font-size: 11px; }
      .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 20px; }
      .summary-box { border: 2px solid #333; border-radius: 6px; padding: 10px; text-align: center; }
      .summary-box .label { font-size: 9px; color: #666; text-transform: uppercase; }
      .summary-box .value { font-size: 16px; font-weight: bold; margin-top: 2px; }
      table { width: 100%; border-collapse: collapse; }
      th { background: #f0f0f0; padding: 8px 6px; text-align: left; font-size: 10px; text-transform: uppercase; border-bottom: 2px solid #333; }
      td { padding: 7px 6px; border-bottom: 1px solid #eee; font-size: 11px; }
      tr:nth-child(even) { background: #fafafa; }
      .text-right { text-align: right; }
      .total-row { font-weight: bold; background: #f0f0f0 !important; border-top: 2px solid #333; }
      .footer { margin-top: 20px; text-align: center; font-size: 9px; color: #999; border-top: 1px solid #ddd; padding-top: 8px; }
      @media print { body { padding: 10px; } }
    </style></head><body>`);

    win.document.write(`<div class="header"><h1>Relatório Financeiro de Fornecedores — Vendas</h1><p>Grundemann Power Hub · Gerado em ${new Date().toLocaleDateString("pt-BR")} às ${new Date().toLocaleTimeString("pt-BR")}</p></div>`);

    win.document.write(`<div class="summary">`);
    [
      { label: "Total Fornecedores", value: suppliers.length },
      { label: "Unidades Vendidas", value: grandTotalSold },
      { label: "Receita de Vendas", value: formatBRL(grandTotalRevenue) },
      { label: "Comissão Grundemann (Vendas)", value: formatBRL(grandTotalCommission) },
    ].forEach(k => win.document.write(`<div class="summary-box"><div class="label">${k.label}</div><div class="value">${k.value}</div></div>`));
    win.document.write(`</div>`);

    win.document.write(`<table><thead><tr><th>Fornecedor</th><th class="text-right">Produtos</th><th class="text-right">Vendidos</th><th class="text-right">Receita Vendas</th><th class="text-right">Custo Fornecedor</th><th class="text-right">Comissão Loja (R$)</th><th class="text-right">Comissão (%)</th></tr></thead><tbody>`);

    suppliers.forEach(s => {
      const pct = s.totalSalesRevenue > 0 ? ((s.totalStoreCommissionFromSales / s.totalSalesRevenue) * 100).toFixed(1) : "0";
      win.document.write(`<tr><td>${s.company_name}</td><td class="text-right">${s.totalProducts}</td><td class="text-right">${s.totalUnitsSold}</td><td class="text-right">${formatBRL(s.totalSalesRevenue)}</td><td class="text-right">${formatBRL(s.totalSupplierCostFromSales)}</td><td class="text-right">${formatBRL(s.totalStoreCommissionFromSales)}</td><td class="text-right">${pct}%</td></tr>`);
    });

    const grandPct = grandTotalRevenue > 0 ? ((grandTotalCommission / grandTotalRevenue) * 100).toFixed(1) : "0";
    win.document.write(`<tr class="total-row"><td>TOTAL GERAL</td><td class="text-right">${grandTotalProducts}</td><td class="text-right">${grandTotalSold}</td><td class="text-right">${formatBRL(grandTotalRevenue)}</td><td class="text-right">${formatBRL(grandTotalSupplierCost)}</td><td class="text-right">${formatBRL(grandTotalCommission)}</td><td class="text-right">${grandPct}%</td></tr>`);

    win.document.write(`</tbody></table><div class="footer">Grundemann Power Hub · Relatório gerado automaticamente</div></body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (selectedSupplier) {
    return (
      <div className="space-y-4">
        <Button variant="ghost" size="sm" onClick={() => setSelectedSupplier(null)} className="gap-1.5">
          ← Voltar para lista de fornecedores
        </Button>
        <h2 className="font-heading text-xl font-bold">{selectedSupplier.company_name}</h2>
        <ResellerProductsReport resellerId={selectedSupplier.id} supplierName={selectedSupplier.company_name} isAdminView />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Grand totals - sales based */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Fornecedores Ativos", value: suppliers.length, icon: Store },
          { label: "Total Produtos", value: grandTotalProducts, icon: Package },
          { label: "Unidades Vendidas", value: grandTotalSold, icon: ShoppingCart },
          { label: "Receita de Vendas", value: formatBRL(grandTotalRevenue), icon: TrendingUp },
          { label: "Valor em Estoque", value: formatBRL(grandTotalInventory), icon: DollarSign },
          { label: "Comissão Grundemann", value: formatBRL(grandTotalCommission), icon: DollarSign, highlight: true },
        ].map(kpi => (
          <Card key={kpi.label} className={(kpi as any).highlight ? "border-2 border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${(kpi as any).highlight ? "bg-primary/20" : "bg-primary/10"}`}>
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`font-heading font-bold text-lg ${(kpi as any).highlight ? "text-primary" : ""}`}>{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 A comissão é calculada somente sobre vendas efetivadas (pedidos confirmados, em processamento, enviados ou entregues).
      </p>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrintSummary} className="gap-1.5">
          <Printer className="h-4 w-4" /> Imprimir Relatório Geral
        </Button>
      </div>

      {/* Suppliers list */}
      <div className="space-y-3">
        {suppliers.map(s => {
          const pct = s.totalSalesRevenue > 0 ? ((s.totalStoreCommissionFromSales / s.totalSalesRevenue) * 100).toFixed(1) : "0";
          return (
            <Card key={s.id} className="hover:border-primary/30 transition-all cursor-pointer" onClick={() => setSelectedSupplier(s)}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Store className="h-5 w-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-heading font-bold">{s.company_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {s.totalProducts} produtos · {s.totalUnitsSold} vendidos · {pct}% comissão
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-6">
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Receita Vendas</p>
                      <p className="font-bold text-sm">{formatBRL(s.totalSalesRevenue)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Comissão Loja</p>
                      <p className="font-bold text-sm text-primary">{formatBRL(s.totalStoreCommissionFromSales)}</p>
                    </div>
                    <ChevronRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}

        {suppliers.length === 0 && (
          <Card>
            <CardContent className="py-12 text-center">
              <Store className="h-10 w-10 mx-auto mb-3 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground">Nenhum fornecedor cadastrado.</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default SupplierFinancialReport;
