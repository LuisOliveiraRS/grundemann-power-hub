import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line, CartesianGrid, Legend } from "recharts";
import { TrendingUp, Package, ShoppingCart, DollarSign, Users, Star, Eye } from "lucide-react";

interface OrderData {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface ProductSales {
  product_name: string;
  quantity: number;
  revenue: number;
}

const COLORS = ["hsl(var(--primary))", "hsl(var(--secondary))", "hsl(var(--accent))", "#22c55e", "#f59e0b", "#ef4444", "#8b5cf6"];

const AnalyticsDashboard = () => {
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [topProducts, setTopProducts] = useState<ProductSales[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [ordersRes, itemsRes] = await Promise.all([
        supabase.from("orders").select("id, status, total_amount, created_at").order("created_at", { ascending: false }),
        supabase.from("order_items").select("product_name, quantity, price_at_purchase").limit(500),
      ]);

      setOrders((ordersRes.data as OrderData[]) || []);

      // Aggregate top products
      const prodMap = new Map<string, { quantity: number; revenue: number }>();
      for (const item of (itemsRes.data || []) as any[]) {
        const existing = prodMap.get(item.product_name) || { quantity: 0, revenue: 0 };
        prodMap.set(item.product_name, {
          quantity: existing.quantity + item.quantity,
          revenue: existing.revenue + item.price_at_purchase * item.quantity,
        });
      }
      const sorted = Array.from(prodMap.entries())
        .map(([product_name, data]) => ({ product_name, ...data }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 10);
      setTopProducts(sorted);
      setLoading(false);
    };
    fetch();
  }, []);

  const statusData = useMemo(() => {
    const statusMap: Record<string, { count: number; total: number }> = {};
    const labels: Record<string, string> = {
      pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
      shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
    };
    for (const o of orders) {
      if (!statusMap[o.status]) statusMap[o.status] = { count: 0, total: 0 };
      statusMap[o.status].count++;
      statusMap[o.status].total += Number(o.total_amount);
    }
    return Object.entries(statusMap).map(([status, data]) => ({
      name: labels[status] || status,
      pedidos: data.count,
      receita: Math.round(data.total * 100) / 100,
    }));
  }, [orders]);

  const monthlyData = useMemo(() => {
    const months: Record<string, { pedidos: number; receita: number }> = {};
    for (const o of orders) {
      const month = new Date(o.created_at).toLocaleDateString("pt-BR", { month: "short", year: "2-digit" });
      if (!months[month]) months[month] = { pedidos: 0, receita: 0 };
      months[month].pedidos++;
      months[month].receita += Number(o.total_amount);
    }
    return Object.entries(months).reverse().slice(-12).map(([name, data]) => ({
      name,
      ...data,
      receita: Math.round(data.receita),
    }));
  }, [orders]);

  const totalRevenue = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const deliveredRevenue = orders.filter(o => o.status === "delivered").reduce((s, o) => s + Number(o.total_amount), 0);
  const avgTicket = orders.length > 0 ? totalRevenue / orders.length : 0;
  const conversionRate = orders.length > 0
    ? ((orders.filter(o => ["delivered", "shipped", "confirmed"].includes(o.status)).length / orders.length) * 100)
    : 0;

  if (loading) {
    return <div className="flex justify-center py-16"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Receita Total", value: `R$ ${totalRevenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
          { label: "Receita Confirmada", value: `R$ ${deliveredRevenue.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-primary" },
          { label: "Ticket Médio", value: `R$ ${avgTicket.toFixed(2).replace(".", ",")}`, icon: ShoppingCart, color: "text-secondary" },
          { label: "Taxa de Conversão", value: `${conversionRate.toFixed(1)}%`, icon: Star, color: "text-accent-foreground" },
        ].map(kpi => (
          <div key={kpi.label} className="bg-card border border-border rounded-xl p-5">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2.5 ${kpi.color}`}><kpi.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{kpi.label}</p>
                <p className="text-lg font-heading font-bold mt-0.5">{kpi.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Revenue */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-primary" /> Receita Mensal
          </h3>
          {monthlyData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip formatter={(v: number) => `R$ ${v.toFixed(2)}`} />
                <Line type="monotone" dataKey="receita" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados de pedidos</p>
          )}
        </div>

        {/* Orders by Status */}
        <div className="bg-card border border-border rounded-xl p-5">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <ShoppingCart className="h-5 w-5 text-primary" /> Pedidos por Status
          </h3>
          {statusData.length > 0 ? (
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={statusData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="pedidos" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-center text-muted-foreground py-8">Sem dados</p>
          )}
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
        ) : (
          <p className="text-center text-muted-foreground py-8">Nenhum produto vendido ainda</p>
        )}
      </div>
    </div>
  );
};

export default AnalyticsDashboard;
