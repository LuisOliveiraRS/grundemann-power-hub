import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, User, LogOut, ShoppingCart, ChevronDown, ChevronUp, MapPin, Phone, Clock, CheckCircle, Truck, XCircle } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Profile {
  full_name: string; email: string; phone: string;
  address: string; city: string; state: string; zip_code: string;
}

interface OrderItem {
  id: string; product_name: string; quantity: number; price_at_purchase: number;
}

interface Order {
  id: string; status: string; total_amount: number;
  created_at: string; shipping_address: string | null; notes: string | null;
  items?: OrderItem[];
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<Profile>({ full_name: "", email: "", phone: "", address: "", city: "", state: "", zip_code: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) { loadProfile(); loadOrders(); }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) setProfile(data as Profile);
  };

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const loadOrderItems = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: (data || []) as OrderItem[] } : o));
    setExpandedOrder(orderId);
  };

  const saveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name, phone: profile.phone, address: profile.address,
      city: profile.city, state: profile.state, zip_code: profile.zip_code,
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado com sucesso!" });
    setLoading(false);
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Em Processamento",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  const statusIcon: Record<string, any> = {
    pending: Clock, confirmed: CheckCircle, processing: Package,
    shipped: Truck, delivered: CheckCircle, cancelled: XCircle,
  };

  const statusColor: Record<string, string> = {
    pending: "bg-accent/20 text-accent-foreground border-accent/30",
    confirmed: "bg-primary/10 text-primary border-primary/20",
    processing: "bg-secondary/10 text-secondary border-secondary/20",
    shipped: "bg-primary/20 text-primary border-primary/30",
    delivered: "bg-primary text-primary-foreground border-primary",
    cancelled: "bg-destructive/10 text-destructive border-destructive/20",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Minha Conta</h1>
          <p className="text-muted-foreground mb-6">Gerencie seus dados e acompanhe seus pedidos</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar - FIXED: using bg-sidebar instead of bg-sidebar-background */}
            <div className="bg-sidebar rounded-xl shadow-lg p-4 space-y-1 h-fit">
              <div className="px-3 py-4 border-b border-sidebar-border mb-3">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-sidebar-primary flex items-center justify-center">
                    <User className="h-5 w-5 text-sidebar-primary-foreground" />
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm text-sidebar-foreground">{profile.full_name || "Minha Conta"}</p>
                    <p className="text-xs text-sidebar-foreground/50 mt-0.5">{profile.email}</p>
                  </div>
                </div>
              </div>
              <button
                onClick={() => setTab("profile")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === "profile"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                }`}
              >
                <User className="h-5 w-5" /> Meus Dados
              </button>
              <button
                onClick={() => setTab("orders")}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                  tab === "orders"
                    ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
                }`}
              >
                <Package className="h-5 w-5" /> Meus Pedidos
                {orders.length > 0 && <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-sidebar-primary-foreground/20 text-sidebar-foreground">{orders.length}</Badge>}
              </button>
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors">
                <ShoppingCart className="h-5 w-5" /> Continuar Comprando
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-5 w-5" /> Sair
              </button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              {tab === "profile" && (
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <h2 className="font-heading text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><User className="h-5 w-5 text-primary" /></div>
                    Dados Pessoais
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">Mantenha seus dados atualizados para facilitar suas compras</p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome Completo</Label>
                      <Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Email</Label>
                      <Input value={profile.email} disabled className="bg-muted" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Phone className="h-3 w-3" />Telefone</Label>
                      <Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="(00) 00000-0000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">CEP</Label>
                      <Input value={profile.zip_code} onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })} placeholder="00000-000" />
                    </div>
                    <div className="md:col-span-2 space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Endereço</Label>
                      <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rua, número, complemento" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Cidade</Label>
                      <Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Estado</Label>
                      <Input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} placeholder="RS" />
                    </div>
                  </div>
                  <Button onClick={saveProfile} disabled={loading} className="mt-6 shadow-md">{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                </div>
              )}

              {tab === "orders" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><Package className="h-5 w-5 text-primary" /></div>
                    Meus Pedidos
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">Acompanhe o status dos seus pedidos</p>

                  {orders.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <div className="bg-muted rounded-full p-6 w-fit mx-auto mb-4">
                        <ShoppingCart className="h-12 w-12 text-muted-foreground" />
                      </div>
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum pedido ainda</h3>
                      <p className="text-muted-foreground mb-6">Você ainda não fez nenhum pedido. Explore nossos produtos!</p>
                      <Button onClick={() => navigate("/")} className="shadow-md">Explorar Produtos</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => {
                        const StatusIcon = statusIcon[order.status] || Clock;
                        return (
                          <div key={order.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadOrderItems(order.id)}>
                              <div className="flex items-center gap-4">
                                <div className="bg-muted rounded-lg p-2.5">
                                  <StatusIcon className="h-5 w-5 text-muted-foreground" />
                                </div>
                                <div>
                                  <p className="font-heading font-bold">Pedido #{order.id.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-4">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${statusColor[order.status] || ""}`}>{statusLabel[order.status] || order.status}</span>
                                <p className="font-heading font-bold text-lg text-price">R$ {Number(order.total_amount).toFixed(2).replace(".",",")}</p>
                                {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                              </div>
                            </div>
                            {expandedOrder === order.id && (
                              <div className="border-t border-border p-5 bg-muted/20">
                                <table className="w-full text-sm">
                                  <thead>
                                    <tr className="text-xs text-muted-foreground uppercase tracking-wider">
                                      <th className="text-left pb-3">Produto</th>
                                      <th className="text-center pb-3">Qtd</th>
                                      <th className="text-right pb-3">Preço</th>
                                      <th className="text-right pb-3">Subtotal</th>
                                    </tr>
                                  </thead>
                                  <tbody className="divide-y divide-border">
                                    {(order.items || []).map(item => (
                                      <tr key={item.id}>
                                        <td className="py-3 font-medium">{item.product_name}</td>
                                        <td className="py-3 text-center"><Badge variant="outline">{item.quantity}</Badge></td>
                                        <td className="py-3 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".",",")}</td>
                                        <td className="py-3 text-right font-bold text-price">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".",",")}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                  <tfoot>
                                    <tr className="border-t-2 border-border">
                                      <td colSpan={3} className="pt-4 text-right font-heading font-bold text-base">Total:</td>
                                      <td className="pt-4 text-right font-heading font-bold text-price text-lg">R$ {Number(order.total_amount).toFixed(2).replace(".",",")}</td>
                                    </tr>
                                  </tfoot>
                                </table>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default ClientDashboard;
