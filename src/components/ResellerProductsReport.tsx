import { useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Package, Search, ShoppingCart, Loader2, AlertTriangle, Printer, Store, TrendingUp, DollarSign } from "lucide-react";
import {
  buildSupplierSummary,
  loadSupplierReport,
  type SupplierReportData,
  type SupplierReportPeriod,
} from "@/lib/supplierReporting";

interface ResellerProductsReportProps {
  resellerId: string;
  supplierName?: string;
  isAdminView?: boolean;
}

const emptyReport: SupplierReportData = {
  products: [],
  salesData: [],
  summary: {
    totalProducts: 0,
    totalStock: 0,
    totalInventorySaleValue: 0,
    totalInventorySupplierCost: 0,
    totalInventoryStoreRevenue: 0,
    totalSold: 0,
    totalSalesRevenue: 0,
    totalSupplierRevenueFromSales: 0,
    totalStoreRevenueFromSales: 0,
  },
};

const formatBRL = (value: number) => `R$ ${value.toFixed(2).replace(".", ",")}`;

const ResellerProductsReport = ({ resellerId, supplierName }: ResellerProductsReportProps) => {
  const [report, setReport] = useState<SupplierReportData>(emptyReport);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterPeriod, setFilterPeriod] = useState<SupplierReportPeriod>("all");
  const printRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!resellerId) return;

    const loadData = async () => {
      setLoading(true);
      try {
        const data = await loadSupplierReport(resellerId, filterPeriod);
        setReport(data);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [resellerId, filterPeriod]);

  const filteredProducts = useMemo(() => {
    return report.products.filter((product) => {
      if (!search) return true;
      const normalizedSearch = search.toLowerCase();
      return product.name.toLowerCase().includes(normalizedSearch) || (product.sku || "").toLowerCase().includes(normalizedSearch);
    });
  }, [report.products, search]);

  const filteredProductIds = useMemo(() => new Set(filteredProducts.map((product) => product.id)), [filteredProducts]);

  const filteredSalesData = useMemo(
    () => report.salesData.filter((sale) => filteredProductIds.has(sale.product_id)),
    [report.salesData, filteredProductIds],
  );

  const filteredSummary = useMemo(
    () => buildSupplierSummary(filteredProducts, filteredSalesData),
    [filteredProducts, filteredSalesData],
  );

  const salesByProductId = useMemo(
    () => new Map(filteredSalesData.map((sale) => [sale.product_id, sale])),
    [filteredSalesData],
  );

  const periodLabel =
    filterPeriod === "all"
      ? "Todo o período"
      : filterPeriod === "30d"
        ? "Últimos 30 dias"
        : filterPeriod === "90d"
          ? "Últimos 90 dias"
          : "Este ano";

  const handlePrint = () => {
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
      .financial-summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 8px; margin-bottom: 16px; }
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

    win.document.write(`<div class="kpi-grid">`);
    [
      { label: "Produtos", value: filteredSummary.totalProducts },
      { label: "Estoque", value: filteredSummary.totalStock },
      { label: "Receita Fornecedor", value: formatBRL(filteredSummary.totalSupplierRevenueFromSales) },
      { label: "Receita Grundemann", value: formatBRL(filteredSummary.totalStoreRevenueFromSales) },
    ].forEach((kpi) => win.document.write(`<div class="kpi"><div class="label">${kpi.label}</div><div class="value">${kpi.value}</div></div>`));
    win.document.write(`</div>`);

    win.document.write(`<div class="financial-summary">`);
    win.document.write(`<div class="fin-box"><div class="label">Valor de Venda em Estoque</div><div class="value">${formatBRL(filteredSummary.totalInventorySaleValue)}</div></div>`);
    win.document.write(`<div class="fin-box"><div class="label">Custo do Estoque do Fornecedor</div><div class="value">${formatBRL(filteredSummary.totalInventorySupplierCost)}</div></div>`);
    win.document.write(`<div class="fin-box"><div class="label">Receita de Vendas</div><div class="value">${formatBRL(filteredSummary.totalSalesRevenue)}</div></div>`);
    win.document.write(`<div class="fin-box"><div class="label">Unidades Vendidas</div><div class="value">${filteredSummary.totalSold}</div></div>`);
    win.document.write(`</div>`);

    win.document.write(`<table><thead><tr><th>Produto</th><th>SKU</th><th class="text-right">Preço Venda</th><th class="text-right">Preço Fornecedor</th><th class="text-right">% Loja</th><th class="text-right">Estoque</th><th class="text-right">Vendidos</th><th class="text-right">Receita Vendas</th><th class="text-right">Receita Fornecedor</th><th class="text-right">Receita Grundemann</th><th>Status</th></tr></thead><tbody>`);

    filteredProducts.forEach((product) => {
      const sales = salesByProductId.get(product.id);
      const status = product.stock <= 0 ? "Sem estoque" : product.is_active ? "Ativo" : "Inativo";
      win.document.write(`<tr>
        <td>${product.name}</td><td>${product.sku || "—"}</td>
        <td class="text-right">${formatBRL(product.salePrice)}</td>
        <td class="text-right">${product.supplierUnitCost > 0 ? formatBRL(product.supplierUnitCost) : "—"}</td>
        <td class="text-right">${product.storeMarkupPct > 0 ? `${product.storeMarkupPct.toFixed(1)}%` : "—"}</td>
        <td class="text-right">${product.stock}</td>
        <td class="text-right">${sales?.total_qty || 0}</td>
        <td class="text-right">${formatBRL(sales?.total_value || 0)}</td>
        <td class="text-right">${formatBRL(sales?.total_supplier_revenue || 0)}</td>
        <td class="text-right">${formatBRL(sales?.total_store_revenue || 0)}</td>
        <td>${status}</td>
      </tr>`);
    });

    win.document.write(`</tbody></table>`);
    win.document.write(`<div class="footer">Grundemann Power Hub · Receita da Grundemann é contabilizada apenas sobre vendas concluídas.</div>`);
    win.document.write(`</body></html>`);
    win.document.close();
    setTimeout(() => win.print(), 300);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (report.products.length === 0) {
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
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Meus Produtos", value: filteredSummary.totalProducts, icon: Package },
          { label: "Estoque Atual", value: filteredSummary.totalStock, icon: AlertTriangle },
          { label: "Receita Fornecedor", value: formatBRL(filteredSummary.totalSupplierRevenueFromSales), icon: DollarSign },
          { label: "Receita Grundemann", value: formatBRL(filteredSummary.totalStoreRevenueFromSales), icon: Store },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="rounded-lg p-2 bg-primary/10"><kpi.icon className="h-5 w-5 text-primary" /></div>
                <div>
                  <p className="text-xs text-muted-foreground">{kpi.label}</p>
                  <p className="font-heading font-bold text-lg">{kpi.value}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-2 border-muted">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Valor de Venda em Estoque</p>
            <p className="font-heading font-bold text-xl mt-1">{formatBRL(filteredSummary.totalInventorySaleValue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Potencial bruto</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-secondary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Custo do Estoque do Fornecedor</p>
            <p className="font-heading font-bold text-xl mt-1">{formatBRL(filteredSummary.totalInventorySupplierCost)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Base de custo atual</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/20">
          <CardContent className="p-4 text-center">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">Receita de Vendas</p>
            <p className="font-heading font-bold text-xl mt-1">{formatBRL(filteredSummary.totalSalesRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">{filteredSummary.totalSold} unidades vendidas</p>
          </CardContent>
        </Card>
        <Card className="border-2 border-primary/30 bg-primary/5">
          <CardContent className="p-4 text-center">
            <div className="flex items-center justify-center gap-1.5 mb-1">
              <TrendingUp className="h-4 w-4 text-primary" />
              <p className="text-xs text-muted-foreground uppercase tracking-wide">Resultado Grundemann em Estoque</p>
            </div>
            <p className="font-heading font-bold text-xl text-primary">{formatBRL(filteredSummary.totalInventoryStoreRevenue)}</p>
            <p className="text-xs text-muted-foreground mt-0.5">Potencial, não realizado</p>
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        💡 A receita da Grundemann só é contabilizada quando a venda é concluída. Os valores em estoque são apenas referência operacional.
      </p>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Buscar produto..." className="pl-9 h-9" />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={filterPeriod} onChange={(event) => setFilterPeriod(event.target.value as SupplierReportPeriod)}>
          <option value="all">Todo período</option>
          <option value="30d">Últimos 30 dias</option>
          <option value="90d">Últimos 90 dias</option>
          <option value="year">Este ano</option>
        </select>
        <Badge variant="secondary">{filteredProducts.length} produtos</Badge>
        <Button variant="outline" size="sm" onClick={handlePrint} className="ml-auto gap-1.5">
          <Printer className="h-4 w-4" /> Imprimir Relatório
        </Button>
      </div>

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
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">% Loja</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Estoque</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Vendidos</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Receita Vendas</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Receita Fornecedor</th>
                <th className="text-right p-3 text-xs font-semibold text-muted-foreground uppercase">Receita Grundemann</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredProducts.map((product) => {
                const sales = salesByProductId.get(product.id);
                return (
                  <tr key={product.id} className="hover:bg-muted/20 transition-colors">
                    <td className="p-3">
                      {product.image_url ? (
                        <img src={product.image_url} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>
                      )}
                    </td>
                    <td className="p-3"><p className="text-sm font-medium line-clamp-1">{product.name}</p></td>
                    <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{product.sku || "—"}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{formatBRL(product.salePrice)}</span></td>
                    <td className="p-3 text-right"><span className="text-sm">{product.supplierUnitCost > 0 ? formatBRL(product.supplierUnitCost) : "—"}</span></td>
                    <td className="p-3 text-right">
                      <span className={`text-sm font-bold ${product.storeMarkupPct > 0 ? "text-primary" : "text-muted-foreground"}`}>
                        {product.storeMarkupPct > 0 ? `${product.storeMarkupPct.toFixed(1)}%` : "—"}
                      </span>
                    </td>
                    <td className="p-3 text-right">
                      <div className="flex flex-col items-end">
                        <span className={`text-sm font-bold ${product.stock <= 0 ? "text-destructive" : product.stock <= 5 ? "text-yellow-600" : ""}`}>{product.stock}</span>
                        {product.reseller_stock !== null && !product.is_legacy_owner && (
                          <span className="text-[10px] text-muted-foreground">Estoque do vínculo</span>
                        )}
                      </div>
                    </td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{sales?.total_qty || 0}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{formatBRL(sales?.total_value || 0)}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold">{formatBRL(sales?.total_supplier_revenue || 0)}</span></td>
                    <td className="p-3 text-right"><span className="text-sm font-semibold text-primary">{formatBRL(sales?.total_store_revenue || 0)}</span></td>
                    <td className="p-3">
                      {product.stock <= 0 ? (
                        <Badge variant="destructive" className="text-xs">Sem estoque</Badge>
                      ) : product.is_active ? (
                        <Badge className="bg-primary/20 text-primary text-xs">Ativo</Badge>
                      ) : (
                        <Badge variant="secondary" className="text-xs">Inativo</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr><td colSpan={12} className="p-10 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
              )}
              {filteredProducts.length > 0 && (
                <tr className="bg-muted/50 font-bold border-t-2 border-border">
                  <td className="p-3" colSpan={3}><span className="text-sm">TOTAIS</span></td>
                  <td className="p-3 text-right text-sm"></td>
                  <td className="p-3 text-right text-sm"></td>
                  <td className="p-3 text-right text-sm"></td>
                  <td className="p-3 text-right text-sm">{filteredSummary.totalStock}</td>
                  <td className="p-3 text-right text-sm">{filteredSummary.totalSold}</td>
                  <td className="p-3 text-right text-sm">{formatBRL(filteredSummary.totalSalesRevenue)}</td>
                  <td className="p-3 text-right text-sm">{formatBRL(filteredSummary.totalSupplierRevenueFromSales)}</td>
                  <td className="p-3 text-right text-sm text-primary">{formatBRL(filteredSummary.totalStoreRevenueFromSales)}</td>
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
