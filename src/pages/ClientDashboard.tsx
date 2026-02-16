import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, User, LogOut, ShoppingCart, ChevronDown, ChevronUp, MapPin, Phone, Mail } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

interface Profile {
  full_name: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  zip_code: string;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string | null;
  notes: string | null;
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

  const statusColor: Record<string, string> = {
    pending: "bg-accent text-accent-foreground",
    confirmed: "bg-primary/20 text-primary",
    processing: "bg-secondary text-secondary-foreground",
    shipped: "bg-primary text-primary-foreground",
    delivered: "bg-primary text-primary-foreground",
    cancelled: "bg-destructive/20 text-destructive",
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />
      <div className="flex-1 bg-muted">
        <div className="container py-8">
          <h1 className="font-heading text-3xl font-bold mb-6">Minha Conta</h1>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="bg-sidebar-background rounded-xl shadow-sm p-4 space-y-1 h-fit">
              <div className="px-3 py-4 border-b border-sidebar-border mb-3">
                <p className="font-heading font-bold text-sm text-sidebar-foreground">{profile.full_name || "Minha Conta"}</p>
                <p className="text-xs text-sidebar-foreground/60 mt-0.5">{profile.email}</p>
              </div>
              <button onClick={() => setTab("profile")} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "profile" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                <User className="h-4 w-4" /> Meus Dados
              </button>
              <button onClick={() => setTab("orders")} className={`w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${tab === "orders" ? "bg-sidebar-primary text-sidebar-primary-foreground" : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"}`}>
                <Package className="h-4 w-4" /> Meus Pedidos
                {orders.length > 0 && <Badge variant="secondary" className="ml-auto text-[10px] px-1.5 py-0">{orders.length}</Badge>}
              </button>
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-accent-foreground">
                <ShoppingCart className="h-4 w-4" /> Continuar Comprando
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2.5 rounded-lg text-sm font-medium text-destructive hover:opacity-80">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              {tab === "profile" && (
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <h2 className="font-heading text-xl font-bold mb-6 flex items-center gap-2"><User className="h-5 w-5 text-primary" /> Dados Pessoais</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={profile.email} disabled className="bg-muted" /></div>
                    <div><Label><Phone className="inline h-3 w-3 mr-1" />Telefone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                    <div><Label>CEP</Label><Input value={profile.zip_code} onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })} placeholder="00000-000" /></div>
                    <div className="md:col-span-2"><Label><MapPin className="inline h-3 w-3 mr-1" />Endereço</Label><Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} placeholder="Rua, número, complemento" /></div>
                    <div><Label>Cidade</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
                    <div><Label>Estado</Label><Input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} placeholder="RS" /></div>
                  </div>
                  <Button onClick={saveProfile} disabled={loading} className="mt-6">{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                </div>
              )}

              {tab === "orders" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Meus Pedidos</h2>
                  {orders.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground mb-4">Você ainda não fez nenhum pedido.</p>
                      <Button onClick={() => navigate("/")}>Explorar Produtos</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                          <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadOrderItems(order.id)}>
                            <div>
                              <p className="font-heading font-bold text-sm">Pedido #{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[order.status] || ""}`}>{statusLabel[order.status] || order.status}</span>
                              <p className="font-heading font-bold text-price">R$ {Number(order.total_amount).toFixed(2).replace(".",",")}</p>
                              {expandedOrder === order.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </div>
                          </div>
                          {expandedOrder === order.id && (
                            <div className="border-t border-border p-4 bg-muted/20">
                              <table className="w-full text-sm">
                                <thead><tr className="text-xs text-muted-foreground"><th className="text-left pb-2">Produto</th><th className="text-center pb-2">Qtd</th><th className="text-right pb-2">Preço</th><th className="text-right pb-2">Subtotal</th></tr></thead>
                                <tbody className="divide-y divide-border">
                                  {(order.items || []).map(item => (
                                    <tr key={item.id}>
                                      <td className="py-2 font-medium">{item.product_name}</td>
                                      <td className="py-2 text-center">{item.quantity}</td>
                                      <td className="py-2 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".",",")}</td>
                                      <td className="py-2 text-right font-bold text-price">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".",",")}</td>
                                    </tr>
                                  ))}
                                </tbody>
                                <tfoot>
                                  <tr className="border-t border-border">
                                    <td colSpan={3} className="pt-3 text-right font-heading font-bold">Total:</td>
                                    <td className="pt-3 text-right font-heading font-bold text-price">R$ {Number(order.total_amount).toFixed(2).replace(".",",")}</td>
                                  </tr>
                                </tfoot>
                              </table>
                            </div>
                          )}
                        </div>
                      ))}
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
