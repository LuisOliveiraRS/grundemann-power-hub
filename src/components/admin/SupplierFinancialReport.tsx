import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Store, DollarSign, Package, Printer, ChevronRight, ShoppingCart, TrendingUp } from "lucide-react";
import ResellerProductsReport from "@/components/ResellerProductsReport";
import { loadSupplierReport } from "@/lib/supplierReporting";

interface SupplierSummary {
  id: string;
  company_name: string;
  user_id: string;
  totalProducts: number;
  totalStock: number;
  totalInventorySaleValue: number;
  totalInventorySupplierCost: number;
  totalSalesRevenue: number;
  totalSupplierRevenueFromSales: number;
  totalStoreRevenueFromSales: number;
  totalUnitsSold: number;
}

const SupplierFinancialReport = () => {
  const [suppliers, setSuppliers] = useState<SupplierSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSupplier, setSelectedSupplier] = useState<SupplierSummary | null>(null);

  useEffect(() => {
    loadSuppliers();
  }, []);

  const loadSuppliers = async () => {
    setLoading(true);

    const { data: mechanics } = await supabase
      .from("mechanics")
      .select("id, company_name, user_id")
      .eq("partner_type", "fornecedor");

    if (!mechanics || mechanics.length === 0) {
      setSuppliers([]);
      setLoading(false);
      return;
    }

    const summaries = await Promise.all(
      mechanics.map(async (mechanic) => {
        const report = await loadSupplierReport(mechanic.id);
        return {
          id: mechanic.id,
          company_name: mechanic.company_name || "Sem nome",
          user_id: mechanic.user_id,
          totalProducts: report.summary.totalProducts,
          totalStock: report.summary.totalStock,
          totalInventorySaleValue: report.summary.totalInventorySaleValue,
          totalInventorySupplierCost: report.summary.totalInventorySupplierCost,
          totalSalesRevenue: report.summary.totalSalesRevenue,
          totalSupplierRevenueFromSales: report.summary.totalSupplierRevenueFromSales,
          totalStoreRevenueFromSales: report.summary.totalStoreRevenueFromSales,
          totalUnitsSold: report.summary.totalSold,
        } satisfies SupplierSummary;
      }),
    );

    setSuppliers(summaries.sort((a, b) => b.totalSalesRevenue - a.totalSalesRevenue));
    setLoading(false);
  };

  const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;
  const escapeHtml = (s: string) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

  const grandTotalRevenue = suppliers.reduce((sum, supplier) => sum + supplier.totalSalesRevenue, 0);
  const grandTotalSupplierRevenue = suppliers.reduce((sum, supplier) => sum + supplier.totalSupplierRevenueFromSales, 0);
  const grandTotalGrundemannRevenue = suppliers.reduce((sum, supplier) => sum + supplier.totalStoreRevenueFromSales, 0);
  const grandTotalProducts = suppliers.reduce((sum, supplier) => sum + supplier.totalProducts, 0);
  const grandTotalSold = suppliers.reduce((sum, supplier) => sum + supplier.totalUnitsSold, 0);
  const grandTotalStock = suppliers.reduce((sum, supplier) => sum + supplier.totalStock, 0);

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
      { label: "Estoque Total", value: grandTotalStock },
      { label: "Receita Fornecedor", value: formatBRL(grandTotalSupplierRevenue) },
      { label: "Receita Grundemann", value: formatBRL(grandTotalGrundemannRevenue) },
    ].forEach((item) => win.document.write(`<div class="summary-box"><div class="label">${item.label}</div><div class="value">${item.value}</div></div>`));
    win.document.write(`</div>`);

    win.document.write(`<table><thead><tr><th>Fornecedor</th><th class="text-right">Produtos</th><th class="text-right">Estoque</th><th class="text-right">Vendidos</th><th class="text-right">Receita Vendas</th><th class="text-right">Receita Fornecedor</th><th class="text-right">Receita Grundemann</th></tr></thead><tbody>`);

    suppliers.forEach((supplier) => {
      win.document.write(`<tr><td>${escapeHtml(supplier.company_name)}</td><td class="text-right">${supplier.totalProducts}</td><td class="text-right">${supplier.totalStock}</td><td class="text-right">${supplier.totalUnitsSold}</td><td class="text-right">${formatBRL(supplier.totalSalesRevenue)}</td><td class="text-right">${formatBRL(supplier.totalSupplierRevenueFromSales)}</td><td class="text-right">${formatBRL(supplier.totalStoreRevenueFromSales)}</td></tr>`);
    });

    win.document.write(`<tr class="total-row"><td>TOTAL GERAL</td><td class="text-right">${grandTotalProducts}</td><td class="text-right">${grandTotalStock}</td><td class="text-right">${grandTotalSold}</td><td class="text-right">${formatBRL(grandTotalRevenue)}</td><td class="text-right">${formatBRL(grandTotalSupplierRevenue)}</td><td class="text-right">${formatBRL(grandTotalGrundemannRevenue)}</td></tr>`);
    win.document.write(`</tbody></table><div class="footer">Grundemann Power Hub · Receita da Grundemann só entra após venda concluída</div></body></html>`);
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
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {[
          { label: "Fornecedores Ativos", value: suppliers.length, icon: Store },
          { label: "Total Produtos", value: grandTotalProducts, icon: Package },
          { label: "Estoque Total", value: grandTotalStock, icon: ShoppingCart },
          { label: "Receita de Vendas", value: formatBRL(grandTotalRevenue), icon: TrendingUp },
          { label: "Receita Fornecedor", value: formatBRL(grandTotalSupplierRevenue), icon: DollarSign },
          { label: "Receita Grundemann", value: formatBRL(grandTotalGrundemannRevenue), icon: DollarSign, highlight: true },
        ].map((kpi) => (
          <Card key={kpi.label} className={"highlight" in kpi && kpi.highlight ? "border-2 border-primary/30 bg-primary/5" : ""}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`rounded-lg p-2 ${"highlight" in kpi && kpi.highlight ? "bg-primary/20" : "bg-primary/10"}`}>
                  <kpi.icon className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className={`font-heading font-bold text-lg ${"highlight" in kpi && kpi.highlight ? "text-primary" : ""}`}>{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <p className="text-xs text-muted-foreground">
        💡 A receita da Grundemann só aparece quando há venda concluída; estoque e custo ficam separados da receita realizada.
      </p>

      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={handlePrintSummary} className="gap-1.5">
          <Printer className="h-4 w-4" /> Imprimir Relatório Geral
        </Button>
      </div>

      <div className="space-y-3">
        {suppliers.map((supplier) => (
          <Card key={supplier.id} className="hover:border-primary/30 transition-all cursor-pointer" onClick={() => setSelectedSupplier(supplier)}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Store className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-heading font-bold">{supplier.company_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {supplier.totalProducts} produtos · {supplier.totalStock} em estoque · {supplier.totalUnitsSold} vendidos
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4 lg:gap-6">
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Receita Fornecedor</p>
                    <p className="font-bold text-sm">{formatBRL(supplier.totalSupplierRevenueFromSales)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">Receita Grundemann</p>
                    <p className="font-bold text-sm text-primary">{formatBRL(supplier.totalStoreRevenueFromSales)}</p>
                  </div>
                  <ChevronRight className="h-5 w-5 text-muted-foreground" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

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
