import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Download, Filter, Users, Package, ShoppingCart, DollarSign, Wrench, Calendar } from "lucide-react";

type ReportType = "clients" | "products" | "orders" | "mechanics" | "sellers" | "commissions";

const AdminReports = () => {
  const [reportType, setReportType] = useState<ReportType>("orders");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  const generateReport = async () => {
    setLoading(true);
    let result: any[] = [];

    switch (reportType) {
      case "clients": {
        const { data: clients } = await supabase.from("profiles").select("*").order("created_at", { ascending: false });
        const { data: orders } = await supabase.from("orders").select("user_id, total_amount, status");
        const orderMap = new Map<string, { count: number; total: number }>();
        for (const o of (orders || [])) {
          const existing = orderMap.get(o.user_id) || { count: 0, total: 0 };
          orderMap.set(o.user_id, { count: existing.count + 1, total: existing.total + Number(o.total_amount) });
        }
        result = (clients || []).map((c: any) => {
          const stats = orderMap.get(c.user_id) || { count: 0, total: 0 };
          return { ...c, order_count: stats.count, order_total: stats.total };
        });
        if (dateFrom) result = result.filter(r => new Date(r.created_at) >= new Date(dateFrom));
        if (dateTo) result = result.filter(r => new Date(r.created_at) <= new Date(dateTo + "T23:59:59"));
        break;
      }
      case "products": {
        const { data: products } = await supabase.from("products").select("*").order("name");
        result = products || [];
        if (statusFilter === "active") result = result.filter(r => r.is_active);
        if (statusFilter === "inactive") result = result.filter(r => !r.is_active);
        if (statusFilter === "out") result = result.filter(r => r.stock_quantity === 0);
        break;
      }
      case "orders": {
        const { data: orders } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
        const { data: payments } = await supabase.from("payments").select("order_id, status, payment_method");
        const payMap = new Map((payments || []).map((p: any) => [p.order_id, p]));
        result = (orders || []).map((o: any) => ({ ...o, payment: payMap.get(o.id) || null }));
        if (dateFrom) result = result.filter(r => new Date(r.created_at) >= new Date(dateFrom));
        if (dateTo) result = result.filter(r => new Date(r.created_at) <= new Date(dateTo + "T23:59:59"));
        if (statusFilter) result = result.filter(r => r.status === statusFilter);
        break;
      }
      case "mechanics": {
        const { data: mechanics } = await supabase.from("mechanics").select("*").order("created_at", { ascending: false });
        const userIds = (mechanics || []).map((m: any) => m.user_id);
        const { data: profiles } = userIds.length > 0
          ? await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", userIds)
          : { data: [] };
        const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        result = (mechanics || []).map((m: any) => ({ ...m, profile: profMap.get(m.user_id) }));
        if (statusFilter === "approved") result = result.filter(r => r.is_approved);
        if (statusFilter === "pending") result = result.filter(r => !r.is_approved);
        break;
      }
      case "sellers": {
        const { data: sellers } = await supabase.from("sellers").select("*").order("created_at", { ascending: false });
        const userIds = (sellers || []).map((s: any) => s.user_id);
        const { data: profiles } = userIds.length > 0
          ? await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", userIds)
          : { data: [] };
        const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));
        result = (sellers || []).map((s: any) => ({ ...s, profile: profMap.get(s.user_id) }));
        break;
      }
      case "commissions": {
        const { data: comms } = await supabase.from("sale_commissions").select("*").order("created_at", { ascending: false });
        const { data: sellers } = await supabase.from("sellers").select("id, user_id");
        const userIds = (sellers || []).map((s: any) => s.user_id);
        const { data: profiles } = userIds.length > 0
          ? await supabase.from("profiles").select("user_id, full_name").in("user_id", userIds)
          : { data: [] };
        const sellerMap = new Map((sellers || []).map((s: any) => [s.id, s.user_id]));
        const profMap = new Map((profiles || []).map((p: any) => [p.user_id, p.full_name]));
        result = (comms || []).map((c: any) => ({
          ...c, seller_name: profMap.get(sellerMap.get(c.seller_id) || "") || "—",
        }));
        if (dateFrom) result = result.filter(r => new Date(r.created_at) >= new Date(dateFrom));
        if (dateTo) result = result.filter(r => new Date(r.created_at) <= new Date(dateTo + "T23:59:59"));
        if (statusFilter) result = result.filter(r => r.status === statusFilter);
        break;
      }
    }

    setData(result);
    setLoading(false);
  };

  useEffect(() => { generateReport(); }, [reportType]);

  const exportCSV = () => {
    if (data.length === 0) return;
    const csvRows = getCSVRows();
    if (csvRows.length === 0) return;
    const headers = Object.keys(csvRows[0]);
    const csv = [headers.join(","), ...csvRows.map(row => headers.map(h => {
      const val = (row as any)[h];
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `relatorio-${reportType}.csv`; a.click();
    URL.revokeObjectURL(url);
  };

  const getCSVRows = () => {
    switch (reportType) {
      case "clients": return data.map(c => ({ Nome: c.full_name, Email: c.email, Telefone: c.phone || "", "CPF/CNPJ": c.cpf_cnpj || "", Cidade: c.city || "", Estado: c.state || "", Pedidos: c.order_count, "Total Gasto": Number(c.order_total).toFixed(2) }));
      case "products": return data.map(p => ({ Nome: p.name, SKU: p.sku || "", Preço: p.price, Estoque: p.stock_quantity, Ativo: p.is_active ? "Sim" : "Não" }));
      case "orders": return data.map(o => ({ ID: o.id.slice(0, 8), Status: o.status, Valor: Number(o.total_amount).toFixed(2), Pagamento: o.payment?.status || "—", Data: new Date(o.created_at).toLocaleDateString("pt-BR") }));
      case "mechanics": return data.map(m => ({ Oficina: m.company_name, CNPJ: m.cnpj || "", IE: m.inscricao_estadual || "", Nome: m.profile?.full_name || "", Aprovado: m.is_approved ? "Sim" : "Não", Desconto: `${m.discount_rate}%` }));
      case "sellers": return data.map(s => ({ Nome: s.profile?.full_name || "", Email: s.profile?.email || "", Comissão: `${s.commission_rate}%`, Vendas: Number(s.total_sales).toFixed(2), "Comissão Acum.": Number(s.total_commission).toFixed(2), Ativo: s.is_active ? "Sim" : "Não" }));
      case "commissions": return data.map(c => ({ Vendedor: c.seller_name, Pedido: c.order_id.slice(0, 8), "Valor Pedido": Number(c.order_total).toFixed(2), Taxa: `${c.commission_rate}%`, Comissão: Number(c.commission_amount).toFixed(2), Status: c.status, Data: new Date(c.created_at).toLocaleDateString("pt-BR") }));
      default: return [];
    }
  };

  const statusLabels: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
    paid: "Pago", approved: "Aprovado",
  };

  const reportTabs: { key: ReportType; label: string; icon: any }[] = [
    { key: "orders", label: "Pedidos", icon: ShoppingCart },
    { key: "clients", label: "Clientes", icon: Users },
    { key: "products", label: "Produtos", icon: Package },
    { key: "mechanics", label: "Mecânicos", icon: Wrench },
    { key: "sellers", label: "Vendedores", icon: Users },
    { key: "commissions", label: "Comissões", icon: DollarSign },
  ];

  const renderTable = () => {
    const rows = getCSVRows();
    if (rows.length === 0) return <p className="text-center text-muted-foreground py-12">Nenhum dado encontrado para os filtros selecionados.</p>;
    const headers = Object.keys(rows[0]);
    return (
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>{headers.map(h => <th key={h} className="text-left p-3 font-semibold">{h}</th>)}</tr>
          </thead>
          <tbody>
            {rows.slice(0, 100).map((row, i) => (
              <tr key={i} className="border-b border-border hover:bg-muted/30">
                {headers.map(h => <td key={h} className="p-3">{(row as any)[h]}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
        {rows.length > 100 && <p className="text-xs text-muted-foreground text-center py-2">Exibindo 100 de {rows.length} registros. Exporte o CSV para ver todos.</p>}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold">Relatórios</h1>
          <p className="text-muted-foreground mt-1">Gere relatórios detalhados com filtros avançados</p>
        </div>
        <Button onClick={exportCSV} disabled={data.length === 0}>
          <Download className="h-4 w-4 mr-2" /> Exportar CSV
        </Button>
      </div>

      {/* Report type tabs */}
      <div className="flex flex-wrap gap-2">
        {reportTabs.map(tab => (
          <Button key={tab.key} variant={reportType === tab.key ? "default" : "outline"} size="sm"
            onClick={() => { setReportType(tab.key); setStatusFilter(""); }}>
            <tab.icon className="h-4 w-4 mr-1" /> {tab.label}
          </Button>
        ))}
      </div>

      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          {["orders", "clients", "commissions"].includes(reportType) && (
            <>
              <div>
                <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> De</Label>
                <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
              </div>
              <div>
                <Label className="text-xs">Até</Label>
                <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
              </div>
            </>
          )}
          {reportType === "orders" && (
            <div>
              <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Status</Label>
              <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos</option>
                <option value="pending">Pendente</option><option value="confirmed">Confirmado</option>
                <option value="processing">Processando</option><option value="shipped">Enviado</option>
                <option value="delivered">Entregue</option><option value="cancelled">Cancelado</option>
              </select>
            </div>
          )}
          {reportType === "products" && (
            <div>
              <Label className="text-xs">Status</Label>
              <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos</option><option value="active">Ativos</option>
                <option value="inactive">Inativos</option><option value="out">Sem Estoque</option>
              </select>
            </div>
          )}
          {reportType === "mechanics" && (
            <div>
              <Label className="text-xs">Status</Label>
              <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos</option><option value="approved">Aprovados</option>
                <option value="pending">Pendentes</option>
              </select>
            </div>
          )}
          {reportType === "commissions" && (
            <div>
              <Label className="text-xs">Status</Label>
              <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                <option value="">Todos</option><option value="pending">Pendente</option>
                <option value="paid">Pago</option>
              </select>
            </div>
          )}
          <Button variant="outline" size="sm" onClick={generateReport} disabled={loading}>
            <Filter className="h-4 w-4 mr-1" /> {loading ? "Gerando..." : "Aplicar Filtros"}
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex flex-wrap gap-3">
        <Badge variant="outline" className="text-sm px-3 py-1">{data.length} registros</Badge>
        {reportType === "orders" && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total: R$ {data.reduce((s: number, o: any) => s + Number(o.total_amount || 0), 0).toFixed(2).replace(".", ",")}
          </Badge>
        )}
        {reportType === "commissions" && (
          <Badge variant="outline" className="text-sm px-3 py-1">
            Total Comissões: R$ {data.reduce((s: number, c: any) => s + Number(c.commission_amount || 0), 0).toFixed(2).replace(".", ",")}
          </Badge>
        )}
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        {renderTable()}
      </div>
    </div>
  );
};

export default AdminReports;
