import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { LogOut, DollarSign, TrendingUp, ShoppingCart, BarChart3, Package } from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-grundemann.png";

interface SellerData {
  id: string;
  commission_rate: number;
  is_active: boolean;
  total_sales: number;
  total_commission: number;
}

interface Commission {
  id: string;
  order_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const SellerDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [seller, setSeller] = useState<SellerData | null>(null);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"all" | "month" | "week">("month");

  useEffect(() => { if (user) loadData(); }, [user]);

  const loadData = async () => {
    if (!user) return;
    const { data: sellerData } = await supabase.from("sellers").select("*").eq("user_id", user.id).single();
    if (!sellerData) { setLoading(false); return; }
    setSeller(sellerData as SellerData);

    const { data: comms } = await supabase.from("sale_commissions")
      .select("*")
      .eq("seller_id", sellerData.id)
      .order("created_at", { ascending: false });
    setCommissions((comms || []) as Commission[]);
    setLoading(false);
  };

  const filteredCommissions = commissions.filter(c => {
    if (period === "all") return true;
    const d = new Date(c.created_at);
    const now = new Date();
    if (period === "month") return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
    if (period === "week") {
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      return d >= weekAgo;
    }
    return true;
  });

  const periodSales = filteredCommissions.reduce((s, c) => s + Number(c.order_total), 0);
  const periodCommission = filteredCommissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const pendingCommission = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
    </div>
  );

  if (!seller) return (
    <div className="min-h-screen flex items-center justify-center flex-col gap-4">
      <p className="text-muted-foreground">Você não possui perfil de vendedor.</p>
      <Button onClick={() => navigate("/")}>Voltar à Loja</Button>
    </div>
  );

  return (
    <div className="min-h-screen flex bg-muted/50">
      <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col shadow-xl">
        <div className="p-5 border-b border-sidebar-border">
          <img src={logo} alt="Gründemann" className="h-12 w-auto brightness-200" />
          <p className="text-xs text-sidebar-foreground/50 mt-2">Painel do Vendedor</p>
        </div>
        <div className="p-3 border-t border-sidebar-border mt-auto space-y-1">
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/30">
            <ShoppingCart className="h-5 w-5" /> Ver Loja
          </button>
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10">
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        <div className="mb-8">
          <h1 className="font-heading text-3xl font-bold">Meu Painel</h1>
          <p className="text-muted-foreground mt-1">Acompanhe suas vendas e comissões</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-5 mb-8">
          {[
            { label: "Taxa de Comissão", value: `${seller.commission_rate}%`, icon: BarChart3, color: "text-primary" },
            { label: "Vendas (período)", value: `R$ ${periodSales.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-primary" },
            { label: "Comissão (período)", value: `R$ ${periodCommission.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
            { label: "Comissão Pendente", value: `R$ ${pendingCommission.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-destructive" },
          ].map(s => (
            <div key={s.label} className="bg-card rounded-xl border border-border p-5">
              <div className="flex items-center gap-3">
                <div className={`rounded-xl bg-muted p-3 ${s.color}`}><s.icon className="h-6 w-6" /></div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                  <p className="text-xl font-heading font-bold mt-0.5">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Period filter */}
        <div className="flex gap-2 mb-4">
          {([["week", "Última Semana"], ["month", "Este Mês"], ["all", "Todo Período"]] as const).map(([key, label]) => (
            <Button key={key} variant={period === key ? "default" : "outline"} size="sm" onClick={() => setPeriod(key)}>
              {label}
            </Button>
          ))}
        </div>

        {/* Commissions table */}
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="p-4 border-b border-border">
            <h3 className="font-heading font-bold">Histórico de Comissões</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-left p-3 font-semibold">Pedido</th>
                  <th className="text-center p-3 font-semibold">Valor do Pedido</th>
                  <th className="text-center p-3 font-semibold">Taxa</th>
                  <th className="text-center p-3 font-semibold">Comissão</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredCommissions.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 text-muted-foreground">#{c.order_id.slice(0, 8)}</td>
                    <td className="p-3 text-center">R$ {Number(c.order_total).toFixed(2).replace(".", ",")}</td>
                    <td className="p-3 text-center">{c.commission_rate}%</td>
                    <td className="p-3 text-center font-bold text-primary">R$ {Number(c.commission_amount).toFixed(2).replace(".", ",")}</td>
                    <td className="p-3 text-center">
                      <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                        {c.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {filteredCommissions.length === 0 && (
                  <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhuma comissão neste período.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
};

export default SellerDashboard;
