import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend, AreaChart, Area } from "recharts";
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, Star, Eye, Download, Filter, Calendar, Wrench, UserCheck } from "lucide-react";

interface OrderData {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
  seller_id: string | null;
}

interface ProductSales {
  product_name: string;
  quantity: number;
  revenue: number;
}

interface PaymentData {
  id: string;
  order_id: string;
  status: string;
  payment_method: string | null;
  amount: number;
  created_at: string;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4"];

const AnalyticsDashboard = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [payments, setPayments] = useState<PaymentData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);
  const [clientCount, setClientCount] = useState(0);
  const [mechanicCount, setMechanicCount] = useState(0);
  const [sellerCount, setSellerCount] = useState(0);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 3);
    return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [ordersRes, itemsRes, payRes, clientRes, mechRes, sellerRes] = await Promise.all([
      supabase.from("orders").select("id, status, total_amount, created_at, user_id, seller_id").order("created_at", { ascending: false }),
      supabase.from("order_items").select("product_name, quantity, price_at_purchase").limit(1000),
      supabase.from("payments").select("id, order_id, status, payment_method, amount, created_at").order("created_at", { ascending: false }),
      supabase.from("profiles").select("id", { count: "exact", head: true }),
      supabase.from("mechanics").select("id", { count: "exact", head: true }),
      supabase.from("sellers").select("id", { count: "exact", head: true }),
    ]);

    setOrders((ordersRes.data || []) as OrderData[]);
    setPayments((payRes.data || []) as PaymentData[]);
    setClientCount(clientRes.count || 0);
    setMechanicCount(mechRes.count || 0);
    setSellerCount(sellerRes.count || 0);

    const prodMap = new Map<string, { quantity: number; revenue: number }>();
    for (const item of (itemsRes.data || []) as any[]) {
      const existing = prodMap.get(item.product_name) || { quantity: 0, revenue: 0 };
      prodMap.set(item.product_name, {
        quantity: existing.quantity + item.quantity,
        revenue: existing.revenue + item.price_at_purchase * item.quantity,
      });
    }
    setTopProducts(
      Array.from(prodMap.entries())
        .map(([product_name, data]) => ({ product_name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10)
    );
    setLoading(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (dateFrom && new Date(o.created_at) < new Date(dateFrom)) return false;
      if (dateTo && new Date(o.created_at) > new Date(dateTo + "T23:59:59")) return false;
      if (statusFilter && o.status !== statusFilter) return false;
      return true;
    });
  }, [orders, dateFrom, dateTo, statusFilter]);

  const totalRevenue = filteredOrders.reduce((s, o) => s + Number(o.total_amount), 0);
  const deliveredRevenue = filteredOrders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const avgTicket = filteredOrders.length > 0 ? totalRevenue / filteredOrders.length : 0;
  const conversionRate = filteredOrders.length > 0
    ? ((filteredOrders.filter(o => ["delivered", "shipped", "confirmed"].includes(o.status)).length / filteredOrders.length) * 100) : 0;
  const cancelledRate = filteredOrders.length > 0
    ? ((filteredOrders.filter(o => o.status === "cancelled").length / filteredOrders.length) * 100) : 0;
  const uniqueCustomers = new Set(filteredOrders.map(o => o.user_id)).size;

  const statusLabels: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  const statusData = useMemo(() => {
    const statusMap: Record<string, { count: number; total: number }> = {};
    for (const o of filteredOrders) {
      if (!statusMap[o.status]) statusMap[o.status] = { count: 0, total: 0 };
      statusMap[o.status].count++;
      statusMap[o.status].total += Number(o.total_amount);
    }
    return Object.entries(statusMap).map(([status, data]) => ({
      name: statusLabels[status] || status,
      pedidos: data.count,
      receita: Math.round(data.total * 100) / 100,
    }));
  }, [filteredOrders]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { pedidos: number; receita: number; clientes: Set<string> }> = {};
    for (const o of filteredOrders) {
      const month = new Date(o.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!months[month]) months[month] = { pedidos: 0, receita: 0, clientes: new Set() };
      months[month].pedidos++;
      months[month].receita += Number(o.total_amount);
      months[month].clientes.add(o.user_id);
    }
    return Object.entries(months).reverse().slice(-12).map(([name, data]) => ({
      name, pedidos: data.pedidos, receita: Math.round(data.receita), clientes: data.clientes.size,
    }));
  }, [filteredOrders]);

  const paymentMethodData = useMemo(() => {
    const methods: Record<string, number> = {};
    for (const p of payments) {
      const method = p.payment_method || "Não informado";
      methods[method] = (methods[method] || 0) + 1;
    }
    return Object.entries(methods).map(([name, value]) => ({ name, value }));
  }, [payments]);

  const dailyData = useMemo(() => {
    const days: Record<string, { pedidos: number; receita: number }> = {};
    const last30 = filteredOrders.filter(o => {
      const d = new Date(o.created_at);
      const ago = new Date(); ago.setDate(ago.getDate() - 30);
      return d >= ago;
    });
    for (const o of last30) {
      const day = new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit" });
      if (!days[day]) days[day] = { pedidos: 0, receita: 0 };
      days[day].pedidos++;
      days[day].receita += Number(o.total_amount);
    }
    return Object.entries(days).reverse().slice(-30).reverse().map(([name, data]) => ({
      name, ...data, receita: Math.round(data.receita),
    }));
  }, [filteredOrders]);

  const exportCSV = () => {
    const rows = filteredOrders.map(o => ({
      ID: o.id.slice(0, 8), Status: statusLabels[o.status] || o.status,
      Valor: Number(o.total_amount).toFixed(2), Data: new Date(o.created_at).toLocaleDateString("pt-BR"),
    }));
    if (rows.length === 0) return;
    const headers = Object.keys(rows[0]);
    const csv = [headers.join(","), ...rows.map(r => headers.map(h => (r as any)[h]).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "analytics-export.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="bg-card border border-border rounded-xl p-4">
        <div className="flex flex-wrap items-end gap-4">
          <div>
            <Label className="text-xs flex items-center gap-1"><Calendar className="h-3 w-3" /> De</Label>
            <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs">Até</Label>
            <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-40" />
          </div>
          <div>
            <Label className="text-xs flex items-center gap-1"><Filter className="h-3 w-3" /> Status</Label>
            <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
              <option value="">Todos</option>
              {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
            </select>
          </div>
          <Button variant="outline" size="sm" onClick={exportCSV}><Download className="h-4 w-4 mr-1" /> Exportar CSV</Button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
          { label: "Receita Confirmada", value: `R$ ${deliveredRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-primary" },
          { label: "Ticket Médio", value: `R$ ${avgTicket.toFixed(2).replace(".", ",")}`, icon: ShoppingCart, color: "text-secondary" },
          { label: "Conversão", value: `${conversionRate.toFixed(1)}%`, icon: Star, color: "text-primary" },
          { label: "Cancelamento", value: `${cancelledRate.toFixed(1)}%`, icon: Eye, color: "text-destructive" },
          { label: "Clientes Únicos", value: uniqueCustomers, icon: Users, color: "text-secondary" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-4">
            <div className="flex items-center gap-2">
              <div className={`rounded-lg bg-muted p-2 ${kpi.color}`}><kpi.icon className="h-4 w-4" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-sm font-heading font-bold mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Secondary stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {[
          { label: "Total Clientes", value: clientCount, icon: Users, color: "text-primary" },
          { label: "Mecânicos Cadastrados", value: mechanicCount, icon: Wrench, color: "text-secondary" },
          { label: "Vendedores Ativos", value: sellerCount, icon: UserCheck, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
            <div className={`rounded-lg bg-muted p-2.5 ${s.color}`}><s.icon className="h-5 w-5" /></div>
            <div>
              <p className="text-xs text-muted-foreground">{s.label}</p>
              <p className="text-lg font-heading font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Daily Revenue (last 30 days) */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Receita Diária (30 dias)
          </h3>
          {dailyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <AreaChart data={dailyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Area type="monotone" dataKey="receita" stroke="hsl(var(--primary))" fill="hsl(var(--primary) / 0.15)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </div>

        {/* Monthly Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Receita Mensal
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number, name: string) => name === "receita" ? `R$ ${v.toFixed(2)}` : v} />
                <Legend />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 3 }} name="Receita" />
                <Line type="monotone" dataKey="pedidos" stroke="hsl(var(--secondary))" strokeWidth={2} dot={{ r: 3 }} name="Pedidos" />
              </LineChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </div>

        {/* Orders by Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Pedidos por Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Pedidos" />
              </BarChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </div>

        {/* Payment Methods */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" /> Métodos de Pagamento
          </h3>
          {paymentMethodData.length > 0 ? (
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie data={paymentMethodData} cx="50%" cy="50%" outerRadius={90} dataKey="value" label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}>
                  {paymentMethodData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : <p className="text-center text-muted-foreground py-8">Sem dados</p>}
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-card border border-border rounded-xl p-5">
        <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
          <Package className="h-5 w-5 text-primary" /> Produtos Mais Vendidos
        </h3>
        {topProducts.length > 0 ? (
          <div className="overflow-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted">
                <tr>
                  <th className="text-left p-3 font-medium">#</th>
                  <th className="text-left p-3 font-medium">Produto</th>
                  <th className="text-center p-3 font-medium">Qtd Vendida</th>
                  <th className="text-right p-3 font-medium">Receita</th>
                </tr>
              </thead>
              <tbody>
                {topProducts.map((p, i) => (
                  <tr key={p.product_name} className="border-t border-border">
                    <td className="p-3"><Badge variant={i < 3 ? "default" : "secondary"}>{i + 1}º</Badge></td>
                    <td className="p-3 font-medium">{p.product_name}</td>
                    <td className="p-3 text-center">{p.quantity}</td>
                    <td className="p-3 text-right font-bold text-price">R$ {p.revenue.toFixed(2).replace(".", ",")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : <p className="text-center text-muted-foreground py-8">Nenhum produto vendido ainda</p>}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
