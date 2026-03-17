import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Package, ShoppingCart, Users, Tag, TrendingUp, DollarSign,
  AlertTriangle, Clock, ImageIcon, Star, MessageSquare,
} from "lucide-react";
import type { Product, OrderWithItems, Category, Testimonial, AdminTab } from "@/types/admin";
import { statusLabel, statusColor } from "@/types/admin";

interface AdminOverviewTabProps {
  products: Product[];
  orders: OrderWithItems[];
  categories: Category[];
  testimonials: Testimonial[];
  stats: { totalProducts: number; totalOrders: number; revenue: number; pendingOrders: number; totalClients: number };
  setTab: (tab: AdminTab) => void;
}

const AdminOverviewTab = ({ products, orders, categories, testimonials, stats, setTab }: AdminOverviewTabProps) => {
  const productsWithoutImage = products.filter(p => !p.image_url).length;
  const productsOutOfStock = products.filter(p => p.stock_quantity === 0).length;
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;

  const ordersByStatus = Object.entries(statusLabel).map(([key, label]) => ({
    status: label,
    count: orders.filter(o => o.status === key).length,
    total: orders.filter(o => o.status === key).reduce((s, o) => s + Number(o.total_amount), 0),
  }));

  const productsByCategory = categories.map(c => ({
    category: c.name,
    count: products.filter(p => p.category_id === c.id).length,
    active: products.filter(p => p.category_id === c.id && p.is_active).length,
  }));

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
      </div>

      {/* Row 1: Main KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
        {[
          { label: "Produtos", value: stats.totalProducts, icon: Package, color: "text-primary", bg: "bg-primary/10" },
          { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-secondary", bg: "bg-secondary/10" },
          { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
          { label: "Pendentes", value: stats.pendingOrders, icon: Clock, color: "text-accent-foreground", bg: "bg-accent/20" },
          { label: "Clientes", value: stats.totalClients, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
          { label: "Ticket Médio", value: stats.totalOrders > 0 ? `R$ ${(stats.revenue / stats.totalOrders).toFixed(2).replace(".", ",")}` : "R$ 0,00", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow">
            <div className="flex items-center gap-2.5">
              <div className={`rounded-lg ${s.bg} p-2.5 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</p>
                <p className="text-base font-heading font-bold mt-0.5">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Row 2: Secondary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Sem Imagem", value: productsWithoutImage, icon: ImageIcon, color: "text-destructive" },
          { label: "Sem Estoque", value: productsOutOfStock, icon: AlertTriangle, color: "text-destructive" },
          { label: "Preço Médio", value: `R$ ${avgPrice.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-secondary" },
          { label: "Categorias", value: categories.length, icon: Tag, color: "text-primary" },
        ].map((s) => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
            <div className={`rounded-lg bg-muted p-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
            <div>
              <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
              <p className="text-sm font-heading font-bold">{s.value}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Row 3: Products by category */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
        <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4"><Tag className="h-5 w-5 text-primary" /> Produtos por Categoria</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {productsByCategory.map(pc => (
            <div key={pc.category} className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold truncate">{pc.category}</p>
              <p className="text-lg font-heading font-bold text-primary mt-1">{pc.count}</p>
              <p className="text-[10px] text-muted-foreground">{pc.active} ativos</p>
            </div>
          ))}
          {productsByCategory.length === 0 && <p className="col-span-full text-center text-muted-foreground text-sm py-4">Nenhuma categoria</p>}
        </div>
      </div>

      {/* Row 4: Orders by status summary */}
      <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
        <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4"><ShoppingCart className="h-5 w-5 text-primary" /> Pedidos por Status</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {ordersByStatus.map(os => (
            <div key={os.status} className="bg-muted/50 rounded-lg p-3 text-center">
              <p className="text-xs font-semibold">{os.status}</p>
              <p className="text-lg font-heading font-bold mt-1">{os.count}</p>
              <p className="text-[10px] text-muted-foreground">R$ {os.total.toFixed(2).replace(".", ",")}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Row 5: Recent orders + Low stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5 border-b border-border flex items-center justify-between">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Últimos Pedidos</h2>
            <Button variant="ghost" size="sm" onClick={() => setTab("orders")}>Ver todos</Button>
          </div>
          <div className="divide-y divide-border">
            {orders.slice(0, 7).map((o) => (
              <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-medium text-sm">#{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="text-right flex items-center gap-2">
                  {o.payment && (
                    <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${o.payment.status === "approved" ? "bg-primary/20 text-primary" : o.payment.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent-foreground"}`}>
                      {o.payment.status === "approved" ? "💳 Pago" : o.payment.status === "rejected" ? "❌ Recusado" : "⏳ Pgto"}
                    </span>
                  )}
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status]}</span>
                  <p className="font-bold text-sm text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                </div>
              </div>
            ))}
            {orders.length === 0 && <p className="p-5 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</p>}
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Estoque Baixo (≤ 5)</h2>
          </div>
          <div className="divide-y divide-border">
            {products.filter(p => p.stock_quantity <= 5 && p.is_active).slice(0, 7).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                  <div>
                    <p className="font-medium text-sm">{p.name}</p>
                    <p className="text-xs text-muted-foreground">SKU: {p.sku || "—"}</p>
                  </div>
                </div>
                <Badge variant={p.stock_quantity === 0 ? "destructive" : "secondary"}>{p.stock_quantity} un.</Badge>
              </div>
            ))}
            {products.filter(p => p.stock_quantity <= 5 && p.is_active).length === 0 && (
              <p className="p-5 text-center text-muted-foreground text-sm">Todos os produtos com estoque adequado. ✅</p>
            )}
          </div>
        </div>
      </div>

      {/* Row 6: Top products + Recent testimonials */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Produtos Destaque</h2>
          </div>
          <div className="divide-y divide-border">
            {products.filter(p => p.is_featured && p.is_active).slice(0, 5).map(p => (
              <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-3">
                  {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                  <span className="font-medium text-sm">{p.name}</span>
                </div>
                <span className="font-bold text-sm text-price">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
              </div>
            ))}
            {products.filter(p => p.is_featured && p.is_active).length === 0 && (
              <p className="p-5 text-center text-muted-foreground text-sm">Nenhum produto em destaque.</p>
            )}
          </div>
        </div>
        <div className="bg-card rounded-xl shadow-sm border border-border">
          <div className="p-5 border-b border-border">
            <h2 className="font-heading text-lg font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Últimos Depoimentos</h2>
          </div>
          <div className="divide-y divide-border">
            {testimonials.filter(t => t.is_approved).slice(0, 5).map(t => (
              <div key={t.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                <div className="flex items-center justify-between">
                  <p className="font-medium text-sm">{t.customer_name}</p>
                  <div className="flex gap-0.5">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3 w-3 ${i < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />))}</div>
                </div>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">"{t.comment}"</p>
              </div>
            ))}
            {testimonials.filter(t => t.is_approved).length === 0 && (
              <p className="p-5 text-center text-muted-foreground text-sm">Nenhum depoimento aprovado.</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminOverviewTab;
