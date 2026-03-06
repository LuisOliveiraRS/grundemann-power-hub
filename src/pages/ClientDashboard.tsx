import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, User, LogOut, ShoppingCart, ChevronDown, ChevronUp, MapPin, Phone, Clock, CheckCircle, Truck, XCircle, Filter, X, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface Profile {
  full_name: string; email: string; phone: string;
  address: string; address_number: string; address_complement: string;
  neighborhood: string; city: string; state: string; zip_code: string;
  cpf_cnpj: string; company_name: string; notes: string;
}

interface OrderItem {
  id: string; product_name: string; quantity: number; price_at_purchase: number;
}

interface Order {
  id: string; status: string; total_amount: number;
  created_at: string; shipping_address: string | null; notes: string | null;
  tracking_code?: string | null;
  items?: OrderItem[];
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<Profile>({
    full_name: "", email: "", phone: "", address: "", address_number: "",
    address_complement: "", neighborhood: "", city: "", state: "", zip_code: "",
    cpf_cnpj: "", company_name: "", notes: ""
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();

  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  useEffect(() => {
    if (user) { loadProfile(); loadOrders(); }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) setProfile({
      full_name: data.full_name || "", email: data.email || "", phone: data.phone || "",
      address: data.address || "", address_number: data.address_number || "",
      address_complement: data.address_complement || "", neighborhood: data.neighborhood || "",
      city: data.city || "", state: data.state || "", zip_code: data.zip_code || "",
      cpf_cnpj: data.cpf_cnpj || "", company_name: data.company_name || "", notes: data.notes || "",
    });
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
      full_name: profile.full_name, phone: profile.phone || null,
      address: profile.address || null, address_number: profile.address_number || null,
      address_complement: profile.address_complement || null,
      neighborhood: profile.neighborhood || null,
      city: profile.city || null, state: profile.state || null,
      zip_code: profile.zip_code || null,
      cpf_cnpj: profile.cpf_cnpj || null, company_name: profile.company_name || null,
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado com sucesso!" });
    setLoading(false);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" as any }).eq("id", orderId);
    if (error) {
      toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" });
    } else {
      await supabase.from("order_status_history").insert({ order_id: orderId, status: "cancelled" as any, notes: "Cancelado pelo cliente" });
      toast({ title: "Pedido cancelado com sucesso!" });
      loadOrders();
    }
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

  const canCancel = (status: string) => ["pending", "confirmed"].includes(status);

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.created_at) > new Date(orderDateTo + "T23:59:59")) return false;
    return true;
  });

  const hasFilters = orderStatusFilter || orderDateFrom || orderDateTo;

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted/50">
        <div className="container py-8">
          <h1 className="font-heading text-3xl font-bold mb-2">Minha Conta</h1>
          <p className="text-muted-foreground mb-6">Gerencie seus dados e acompanhe seus pedidos</p>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
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
              <button onClick={() => setTab("profile")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "profile" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"}`}>
                <User className="h-5 w-5" /> Meus Dados
              </button>
              <button onClick={() => setTab("orders")} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tab === "orders" ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"}`}>
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
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">CPF / CNPJ</Label>
                      <Input value={profile.cpf_cnpj} onChange={(e) => setProfile({ ...profile, cpf_cnpj: e.target.value })} placeholder="000.000.000-00 ou 00.000.000/0000-00" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><Building2 className="h-3 w-3" />Razão Social / Empresa</Label>
                      <Input value={profile.company_name} onChange={(e) => setProfile({ ...profile, company_name: e.target.value })} placeholder="Nome da empresa (opcional)" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">CEP</Label>
                      <Input value={profile.zip_code} onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })} placeholder="00000-000" />
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" />Endereço</Label>
                      <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rua, Avenida..." />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Número</Label>
                        <Input value={profile.address_number} onChange={(e) => setProfile({ ...profile, address_number: e.target.value })} placeholder="Nº" />
                      </div>
                      <div className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">Complemento</Label>
                        <Input value={profile.address_complement} onChange={(e) => setProfile({ ...profile, address_complement: e.target.value })} placeholder="Apto, Sala..." />
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-xs uppercase tracking-wider text-muted-foreground">Bairro</Label>
                      <Input value={profile.neighborhood} onChange={(e) => setProfile({ ...profile, neighborhood: e.target.value })} placeholder="Bairro" />
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
                  <p className="text-muted-foreground text-sm mb-4">Acompanhe o status dos seus pedidos</p>

                  {orders.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                        <Filter className="h-4 w-4" /> Filtrar Pedidos
                      </div>
                      <div className="flex flex-wrap gap-3">
                        <select className="h-9 border border-input rounded-md px-3 text-sm bg-background flex-1 min-w-[140px]" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                          <option value="">Todos os status</option>
                          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">De:</span>
                          <Input type="date" className="h-9 w-auto text-sm" value={orderDateFrom} onChange={(e) => setOrderDateFrom(e.target.value)} />
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-muted-foreground">Até:</span>
                          <Input type="date" className="h-9 w-auto text-sm" value={orderDateTo} onChange={(e) => setOrderDateTo(e.target.value)} />
                        </div>
                        {hasFilters && (
                          <Button variant="ghost" size="sm" onClick={() => { setOrderStatusFilter(""); setOrderDateFrom(""); setOrderDateTo(""); }}>
                            <X className="h-4 w-4 mr-1" /> Limpar
                          </Button>
                        )}
                      </div>
                      {hasFilters && <p className="text-xs text-muted-foreground mt-2">{filteredOrders.length} pedido(s) encontrado(s)</p>}
                    </div>
                  )}

                  {orders.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <div className="bg-muted rounded-full p-6 w-fit mx-auto mb-4"><ShoppingCart className="h-12 w-12 text-muted-foreground" /></div>
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum pedido ainda</h3>
                      <p className="text-muted-foreground mb-6">Você ainda não fez nenhum pedido. Explore nossos produtos!</p>
                      <Button onClick={() => navigate("/")} className="shadow-md">Explorar Produtos</Button>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <Package className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
                      <p className="text-muted-foreground">Nenhum pedido encontrado com os filtros selecionados.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map((order) => {
                        const StatusIcon = statusIcon[order.status] || Clock;
                        return (
                          <div key={order.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                            <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors gap-3" onClick={() => loadOrderItems(order.id)}>
                              <div className="flex items-center gap-4">
                                <div className="bg-muted rounded-lg p-2.5"><StatusIcon className="h-5 w-5 text-muted-foreground" /></div>
                                <div>
                                  <p className="font-heading font-bold">Pedido #{order.id.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${statusColor[order.status] || ""}`}>{statusLabel[order.status] || order.status}</span>
                                <p className="font-heading font-bold text-lg text-price">R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
                                {canCancel(order.status) && (
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-destructive border-destructive/30 hover:bg-destructive/10"
                                    onClick={(e) => { e.stopPropagation(); cancelOrder(order.id); }}
                                  >
                                    <XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar
                                  </Button>
                                )}
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
                                        <td className="py-3 text-center">{item.quantity}</td>
                                        <td className="py-3 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td>
                                        <td className="py-3 text-right font-semibold">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                                {order.tracking_code && (
                                  <div className="mt-4 pt-3 border-t border-border">
                                    <div className="flex items-center gap-2 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                                      <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                                      <div>
                                        <p className="text-xs font-semibold text-primary">Código de Rastreamento</p>
                                        <p className="text-sm font-mono font-bold text-card-foreground">{order.tracking_code}</p>
                                      </div>
                                    </div>
                                  </div>
                                )}
                                {order.shipping_address && (
                                  <div className="mt-3 pt-3 border-t border-border">
                                    <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.shipping_address}</p>
                                  </div>
                                )}
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
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default ClientDashboard;
