import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Package, User, LogOut, ShoppingCart } from "lucide-react";
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

interface Order {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const [tab, setTab] = useState<"profile" | "orders">("profile");
  const [profile, setProfile] = useState<Profile>({ full_name: "", email: "", phone: "", address: "", city: "", state: "", zip_code: "" });
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (user) {
      loadProfile();
      loadOrders();
    }
  }, [user]);

  const loadProfile = async () => {
    const { data } = await supabase.from("profiles").select("*").eq("user_id", user!.id).single();
    if (data) setProfile(data as Profile);
  };

  const loadOrders = async () => {
    const { data } = await supabase.from("orders").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setOrders(data as Order[]);
  };

  const saveProfile = async () => {
    setLoading(true);
    const { error } = await supabase.from("profiles").update({
      full_name: profile.full_name,
      phone: profile.phone,
      address: profile.address,
      city: profile.city,
      state: profile.state,
      zip_code: profile.zip_code,
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado!" });
    setLoading(false);
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    processing: "Em Processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-accent text-accent-foreground",
    confirmed: "bg-primary/20 text-primary",
    processing: "bg-secondary/20 text-secondary",
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
            <div className="bg-background rounded-lg shadow p-4 space-y-2 h-fit">
              <button onClick={() => setTab("profile")} className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${tab === "profile" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <User className="h-4 w-4" /> Meus Dados
              </button>
              <button onClick={() => setTab("orders")} className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium ${tab === "orders" ? "bg-primary text-primary-foreground" : "hover:bg-muted"}`}>
                <Package className="h-4 w-4" /> Meus Pedidos
              </button>
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium hover:bg-muted">
                <ShoppingCart className="h-4 w-4" /> Continuar Comprando
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm font-medium text-destructive hover:bg-destructive/10">
                <LogOut className="h-4 w-4" /> Sair
              </button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 bg-background rounded-lg shadow p-6">
              {tab === "profile" && (
                <div className="space-y-4">
                  <h2 className="font-heading text-xl font-bold mb-4">Meus Dados</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo</Label><Input value={profile.full_name} onChange={(e) => setProfile({ ...profile, full_name: e.target.value })} /></div>
                    <div><Label>Email</Label><Input value={profile.email} disabled /></div>
                    <div><Label>Telefone</Label><Input value={profile.phone} onChange={(e) => setProfile({ ...profile, phone: e.target.value })} /></div>
                    <div><Label>CEP</Label><Input value={profile.zip_code} onChange={(e) => setProfile({ ...profile, zip_code: e.target.value })} /></div>
                    <div className="md:col-span-2"><Label>Endereço</Label><Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} /></div>
                    <div><Label>Cidade</Label><Input value={profile.city} onChange={(e) => setProfile({ ...profile, city: e.target.value })} /></div>
                    <div><Label>Estado</Label><Input value={profile.state} onChange={(e) => setProfile({ ...profile, state: e.target.value })} /></div>
                  </div>
                  <Button onClick={saveProfile} disabled={loading}>{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                </div>
              )}

              {tab === "orders" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4">Meus Pedidos</h2>
                  {orders.length === 0 ? (
                    <p className="text-muted-foreground">Nenhum pedido realizado ainda.</p>
                  ) : (
                    <div className="space-y-3">
                      {orders.map((order) => (
                        <div key={order.id} className="border border-border rounded-lg p-4 flex items-center justify-between">
                          <div>
                            <p className="font-medium text-sm">Pedido #{order.id.slice(0, 8)}</p>
                            <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                          </div>
                          <div className="text-right">
                            <p className="font-bold text-price">R$ {Number(order.total_amount).toFixed(2)}</p>
                            <span className={`text-xs px-2 py-1 rounded-full ${statusColor[order.status] || ""}`}>
                              {statusLabel[order.status] || order.status}
                            </span>
                          </div>
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
