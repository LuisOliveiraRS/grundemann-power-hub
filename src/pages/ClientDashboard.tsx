import { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Package, User, LogOut, ShoppingCart, ChevronDown, ChevronUp, MapPin, Phone, Clock, CheckCircle, Truck, XCircle, Filter, X, Building2, Heart, FileText, Download, Gift, Users, CreditCard, AlertCircle, RefreshCw, Banknote } from "lucide-react";
import { useNavigate } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import LoyaltyProgram from "@/components/LoyaltyProgram";
import ReferralProgram from "@/components/ReferralProgram";

interface Profile {
  full_name: string; email: string; phone: string;
  address: string; address_number: string; address_complement: string;
  neighborhood: string; city: string; state: string; zip_code: string;
  cpf_cnpj: string; company_name: string; notes: string;
}

interface OrderItem { id: string; product_name: string; quantity: number; price_at_purchase: number; }
interface Order {
  id: string; status: string; total_amount: number; created_at: string;
  shipping_address: string | null; notes: string | null; tracking_code?: string | null;
  items?: OrderItem[];
}
interface Quote { id: string; status: string; total_estimated: number; created_at: string; message: string | null; }
interface FavProduct { id: string; name: string; price: number; image_url: string | null; sku: string | null; }
interface Payment {
  id: string; order_id: string; amount: number; status: string;
  payment_method: string | null; mp_payment_id: string | null;
  mp_status_detail: string | null; paid_at: string | null;
  created_at: string; updated_at: string;
}

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
const quoteStatusLabel: Record<string, string> = {
  pending: "Pendente", reviewing: "Em Análise", quoted: "Orçado", accepted: "Aceito", rejected: "Rejeitado",
};

const paymentStatusLabel: Record<string, string> = {
  pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado",
  cancelled: "Cancelado", refunded: "Reembolsado",
};
const paymentStatusColor: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground border-accent/30",
  approved: "bg-primary text-primary-foreground border-primary",
  rejected: "bg-destructive/10 text-destructive border-destructive/20",
  cancelled: "bg-muted text-muted-foreground border-border",
  refunded: "bg-secondary/10 text-secondary-foreground border-secondary/20",
};
const paymentStatusIcon: Record<string, any> = {
  pending: Clock, approved: CheckCircle, rejected: XCircle,
  cancelled: XCircle, refunded: RefreshCw,
};
const paymentMethodLabel: Record<string, string> = {
  credit_card: "Cartão de Crédito", debit_card: "Cartão de Débito",
  pix: "PIX", bolbradesco: "Boleto", ticket: "Boleto",
  bank_transfer: "Transferência",
};
const mpStatusDetailLabel: Record<string, string> = {
  accredited: "Pagamento aprovado",
  pending_contingency: "Processando pagamento",
  pending_review_manual: "Em análise manual",
  cc_rejected_other_reason: "Cartão recusado",
  cc_rejected_call_for_authorize: "Cartão requer autorização",
  cc_rejected_insufficient_amount: "Saldo insuficiente",
  cc_rejected_bad_filled_security_code: "Código de segurança inválido",
  cc_rejected_bad_filled_date: "Data de validade inválida",
  cc_rejected_bad_filled_other: "Dados incorretos",
  pending_waiting_payment: "Aguardando pagamento",
  pending_waiting_transfer: "Aguardando transferência",
};
const ClientDashboard = () => {
  const { user, signOut } = useAuth();
  const { favoriteIds, toggleFavorite } = useFavorites();
  const [tab, setTab] = useState<"profile" | "orders" | "payments" | "quotes" | "favorites" | "loyalty" | "referral">("profile");
  const [profile, setProfile] = useState<Profile>({
    full_name: "", email: "", phone: "", address: "", address_number: "",
    address_complement: "", neighborhood: "", city: "", state: "", zip_code: "",
    cpf_cnpj: "", company_name: "", notes: ""
  });
  const [orders, setOrders] = useState<Order[]>([]);
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [favProducts, setFavProducts] = useState<FavProduct[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(false);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const { toast } = useToast();
  const navigate = useNavigate();
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  useEffect(() => { if (user) { loadProfile(); loadOrders(); loadQuotes(); loadPayments(); } }, [user]);

  // Realtime payments subscription
  useEffect(() => {
    if (!user) return;
    const channel = supabase
      .channel('user-payments')
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'payments', filter: `user_id=eq.${user.id}` },
        (payload) => {
          loadPayments();
          const newStatus = (payload.new as any)?.status;
          const oldStatus = (payload.old as any)?.status;
          if (newStatus === 'approved' && oldStatus !== 'approved') {
            toast({ title: "Pagamento aprovado! ✅", description: "Seu pagamento foi confirmado com sucesso. Obrigado pela compra!" });
          } else if (newStatus === 'rejected' && oldStatus !== 'rejected') {
            toast({ title: "Pagamento recusado ❌", description: "Seu pagamento foi recusado. Tente novamente ou use outro método.", variant: "destructive" });
          } else if (newStatus === 'refunded' && oldStatus !== 'refunded') {
            toast({ title: "Reembolso processado 💰", description: "Seu pagamento foi reembolsado com sucesso." });
          }
        }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);
  useEffect(() => { if (user && favoriteIds.size > 0) loadFavoriteProducts(); }, [favoriteIds]);

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

  const loadQuotes = async () => {
    const { data } = await supabase.from("quotes").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setQuotes(data as Quote[]);
  };

  const loadPayments = async () => {
    const { data } = await supabase.from("payments").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
    if (data) setPayments(data as Payment[]);
  };

  const loadFavoriteProducts = async () => {
    const ids = Array.from(favoriteIds);
    if (ids.length === 0) { setFavProducts([]); return; }
    const { data } = await supabase.from("products").select("id, name, price, image_url, sku").in("id", ids);
    if (data) setFavProducts(data as FavProduct[]);
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
      address_complement: profile.address_complement || null, neighborhood: profile.neighborhood || null,
      city: profile.city || null, state: profile.state || null, zip_code: profile.zip_code || null,
      cpf_cnpj: profile.cpf_cnpj || null, company_name: profile.company_name || null,
    }).eq("user_id", user!.id);
    if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
    else toast({ title: "Perfil atualizado com sucesso!" });
    setLoading(false);
  };

  const cancelOrder = async (orderId: string) => {
    if (!confirm("Tem certeza que deseja cancelar este pedido?")) return;
    const { error } = await supabase.from("orders").update({ status: "cancelled" as any }).eq("id", orderId);
    if (error) { toast({ title: "Erro ao cancelar", description: error.message, variant: "destructive" }); }
    else {
      await supabase.from("order_status_history").insert({ order_id: orderId, status: "cancelled" as any, notes: "Cancelado pelo cliente" });
      toast({ title: "Pedido cancelado com sucesso!" }); loadOrders();
    }
  };

  const canCancel = (status: string) => ["pending", "confirmed"].includes(status);

  const filteredOrders = orders.filter(o => {
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.created_at) > new Date(orderDateTo + "T23:59:59")) return false;
    return true;
  });
  const hasFilters = orderStatusFilter || orderDateFrom || orderDateTo;

  const tabs = [
    { id: "profile" as const, label: "Meus Dados", icon: User },
    { id: "orders" as const, label: "Meus Pedidos", icon: Package, count: orders.length },
    { id: "payments" as const, label: "Pagamentos", icon: CreditCard, count: payments.length },
    { id: "quotes" as const, label: "Orçamentos", icon: FileText, count: quotes.length },
    { id: "favorites" as const, label: "Favoritos", icon: Heart, count: favoriteIds.size },
    { id: "loyalty" as const, label: "Fidelidade", icon: Gift },
    { id: "referral" as const, label: "Indicações", icon: Users },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
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
              {tabs.map(t => (
                <button key={t.id} onClick={() => setTab(t.id)}
                  className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${tab === t.id ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md" : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"}`}>
                  <t.icon className="h-5 w-5" /> {t.label}
                  {t.count !== undefined && t.count > 0 && <Badge className="ml-auto text-[10px] px-1.5 py-0 bg-sidebar-primary-foreground/20 text-sidebar-foreground">{t.count}</Badge>}
                </button>
              ))}
              <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors">
                <ShoppingCart className="h-5 w-5" /> Continuar Comprando
              </button>
              <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
                <LogOut className="h-5 w-5" /> Sair
              </button>
            </div>

            {/* Content */}
            <div className="md:col-span-3 space-y-6">
              {/* PROFILE TAB */}
              {tab === "profile" && (
                <div className="bg-card rounded-xl shadow-sm border border-border p-6">
                  <h2 className="font-heading text-xl font-bold mb-2 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><User className="h-5 w-5 text-primary" /></div>
                    Dados Pessoais
                  </h2>
                  <p className="text-muted-foreground text-sm mb-6">Mantenha seus dados atualizados</p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                    {[
                      { label: "Nome Completo", key: "full_name" },
                      { label: "Email", key: "email", disabled: true },
                      { label: "Telefone", key: "phone", placeholder: "(00) 00000-0000", icon: Phone },
                      { label: "CPF / CNPJ", key: "cpf_cnpj", placeholder: "000.000.000-00" },
                      { label: "Empresa", key: "company_name", placeholder: "Nome da empresa", icon: Building2 },
                      { label: "CEP", key: "zip_code", placeholder: "00000-000" },
                      { label: "Endereço", key: "address", placeholder: "Rua, Avenida...", icon: MapPin },
                    ].map(f => (
                      <div key={f.key} className="space-y-1.5">
                        <Label className="text-xs uppercase tracking-wider text-muted-foreground">{f.label}</Label>
                        <Input value={(profile as any)[f.key]} onChange={e => setProfile(p => ({ ...p, [f.key]: e.target.value }))} disabled={f.disabled} className={f.disabled ? "bg-muted" : ""} placeholder={f.placeholder} />
                      </div>
                    ))}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Número</Label><Input value={profile.address_number} onChange={e => setProfile(p => ({ ...p, address_number: e.target.value }))} /></div>
                      <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Complemento</Label><Input value={profile.address_complement} onChange={e => setProfile(p => ({ ...p, address_complement: e.target.value }))} /></div>
                    </div>
                    <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Bairro</Label><Input value={profile.neighborhood} onChange={e => setProfile(p => ({ ...p, neighborhood: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Cidade</Label><Input value={profile.city} onChange={e => setProfile(p => ({ ...p, city: e.target.value }))} /></div>
                    <div className="space-y-1.5"><Label className="text-xs uppercase tracking-wider text-muted-foreground">Estado</Label><Input value={profile.state} onChange={e => setProfile(p => ({ ...p, state: e.target.value }))} placeholder="RS" /></div>
                  </div>
                  <Button onClick={saveProfile} disabled={loading} className="mt-6 shadow-md">{loading ? "Salvando..." : "Salvar Alterações"}</Button>
                </div>
              )}

              {/* ORDERS TAB */}
              {tab === "orders" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><Package className="h-5 w-5 text-primary" /></div>
                    Meus Pedidos
                  </h2>
                  {orders.length > 0 && (
                    <div className="bg-card rounded-xl border border-border p-4 mb-4">
                      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground"><Filter className="h-4 w-4" /> Filtrar</div>
                      <div className="flex flex-wrap gap-3">
                        <select className="h-9 border border-input rounded-md px-3 text-sm bg-background flex-1 min-w-[140px]" value={orderStatusFilter} onChange={e => setOrderStatusFilter(e.target.value)}>
                          <option value="">Todos os status</option>
                          {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                        </select>
                        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">De:</span><Input type="date" className="h-9 w-auto text-sm" value={orderDateFrom} onChange={e => setOrderDateFrom(e.target.value)} /></div>
                        <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">Até:</span><Input type="date" className="h-9 w-auto text-sm" value={orderDateTo} onChange={e => setOrderDateTo(e.target.value)} /></div>
                        {hasFilters && <Button variant="ghost" size="sm" onClick={() => { setOrderStatusFilter(""); setOrderDateFrom(""); setOrderDateTo(""); }}><X className="h-4 w-4 mr-1" /> Limpar</Button>}
                      </div>
                    </div>
                  )}
                  {orders.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum pedido ainda</h3>
                      <Button onClick={() => navigate("/")}>Explorar Produtos</Button>
                    </div>
                  ) : filteredOrders.length === 0 ? (
                    <div className="bg-card rounded-xl border border-border p-8 text-center"><p className="text-muted-foreground">Nenhum pedido encontrado com os filtros.</p></div>
                  ) : (
                    <div className="space-y-3">
                      {filteredOrders.map(order => {
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
                                {canCancel(order.status) && <Button variant="outline" size="sm" className="text-destructive border-destructive/30 hover:bg-destructive/10" onClick={e => { e.stopPropagation(); cancelOrder(order.id); }}><XCircle className="h-3.5 w-3.5 mr-1" /> Cancelar</Button>}
                                {expandedOrder === order.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
                              </div>
                            </div>
                            {expandedOrder === order.id && (
                              <div className="border-t border-border p-5 bg-muted/20">
                                <table className="w-full text-sm">
                                  <thead><tr className="text-xs text-muted-foreground uppercase tracking-wider"><th className="text-left pb-3">Produto</th><th className="text-center pb-3">Qtd</th><th className="text-right pb-3">Preço</th><th className="text-right pb-3">Subtotal</th></tr></thead>
                                  <tbody className="divide-y divide-border">
                                    {(order.items || []).map(item => (
                                      <tr key={item.id}><td className="py-3 font-medium">{item.product_name}</td><td className="py-3 text-center">{item.quantity}</td><td className="py-3 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td><td className="py-3 text-right font-semibold">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</td></tr>
                                    ))}
                                  </tbody>
                                </table>
                                {order.tracking_code && (
                                  <div className="mt-4 pt-3 border-t border-border">
                                    <div className="flex items-center justify-between gap-3 bg-primary/5 border border-primary/20 rounded-lg px-4 py-3">
                                      <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                                        <div>
                                          <p className="text-xs font-semibold text-primary">Código de Rastreamento</p>
                                          <p className="text-sm font-mono font-bold text-card-foreground">{order.tracking_code}</p>
                                        </div>
                                      </div>
                                      <a
                                        href={`https://www.linkcorreios.com.br/?id=${order.tracking_code}`}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        onClick={e => e.stopPropagation()}
                                        className="inline-flex items-center gap-1.5 bg-primary text-primary-foreground text-xs font-semibold px-3 py-1.5 rounded-md hover:bg-primary/90 transition-colors"
                                      >
                                        <Truck className="h-3.5 w-3.5" />
                                        Rastrear nos Correios
                                      </a>
                                    </div>
                                  </div>
                                )}
                                {order.shipping_address && <div className="mt-3 pt-3 border-t border-border"><p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="h-3 w-3" /> {order.shipping_address}</p></div>}
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* QUOTES TAB */}
              {tab === "quotes" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><FileText className="h-5 w-5 text-primary" /></div>
                    Meus Orçamentos
                  </h2>
                  {quotes.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum orçamento</h3>
                      <p className="text-muted-foreground mb-4">Você ainda não solicitou nenhum orçamento.</p>
                      <Button onClick={() => navigate("/produtos")}>Ver Produtos</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {quotes.map(q => (
                        <div key={q.id} className="bg-card rounded-xl shadow-sm border border-border p-5">
                          <div className="flex items-center justify-between mb-2">
                            <p className="font-heading font-bold">Orçamento #{q.id.slice(0, 8)}</p>
                            <Badge className={q.status === "accepted" ? "bg-primary text-primary-foreground" : q.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent-foreground"}>
                              {quoteStatusLabel[q.status] || q.status}
                            </Badge>
                          </div>
                          <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                          {q.message && <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{q.message}</p>}
                          <p className="font-heading font-bold text-price mt-2">R$ {Number(q.total_estimated).toFixed(2).replace(".", ",")}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* PAYMENTS TAB */}
              {tab === "payments" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><CreditCard className="h-5 w-5 text-primary" /></div>
                    Meus Pagamentos
                  </h2>
                  {payments.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <Banknote className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum pagamento</h3>
                      <p className="text-muted-foreground mb-4">Seus pagamentos aparecerão aqui após finalizar uma compra.</p>
                      <Button onClick={() => navigate("/produtos")}>Ver Produtos</Button>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {payments.map(payment => {
                        const PIcon = paymentStatusIcon[payment.status] || Clock;
                        return (
                          <div key={payment.id} className="bg-card rounded-xl shadow-sm border border-border p-5 hover:shadow-md transition-shadow">
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                              <div className="flex items-center gap-4">
                                <div className={`rounded-lg p-2.5 ${payment.status === "approved" ? "bg-primary/10" : payment.status === "rejected" ? "bg-destructive/10" : "bg-muted"}`}>
                                  <PIcon className={`h-5 w-5 ${payment.status === "approved" ? "text-primary" : payment.status === "rejected" ? "text-destructive" : "text-muted-foreground"}`} />
                                </div>
                                <div>
                                  <p className="font-heading font-bold">Pedido #{payment.order_id.slice(0, 8)}</p>
                                  <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                                </div>
                              </div>
                              <div className="flex items-center gap-3 flex-wrap">
                                <span className={`text-xs px-3 py-1.5 rounded-full font-semibold border ${paymentStatusColor[payment.status] || "bg-muted text-muted-foreground border-border"}`}>
                                  {paymentStatusLabel[payment.status] || payment.status}
                                </span>
                                <p className="font-heading font-bold text-lg text-price">R$ {Number(payment.amount).toFixed(2).replace(".", ",")}</p>
                              </div>
                            </div>
                            <div className="mt-3 pt-3 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                              {payment.payment_method && (
                                <span className="flex items-center gap-1">
                                  <CreditCard className="h-3 w-3" />
                                  {paymentMethodLabel[payment.payment_method] || payment.payment_method}
                                </span>
                              )}
                              {payment.mp_payment_id && (
                                <span className="flex items-center gap-1">ID MP: {payment.mp_payment_id}</span>
                              )}
                              {payment.paid_at && (
                                <span className="flex items-center gap-1">
                                  <CheckCircle className="h-3 w-3 text-primary" />
                                  Pago em {new Date(payment.paid_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                                </span>
                              )}
                            </div>
                            {payment.mp_status_detail && (
                              <div className={`mt-2 flex items-center gap-2 text-xs rounded-lg px-3 py-2 ${payment.status === "rejected" ? "bg-destructive/5 text-destructive" : payment.status === "pending" ? "bg-accent/10 text-accent-foreground" : "bg-primary/5 text-primary"}`}>
                                <AlertCircle className="h-3.5 w-3.5 flex-shrink-0" />
                                {mpStatusDetailLabel[payment.mp_status_detail] || payment.mp_status_detail}
                              </div>
                            )}
                            {payment.status === "pending" && (
                              <div className="mt-2 flex items-center gap-2 text-xs bg-accent/10 text-accent-foreground rounded-lg px-3 py-2">
                                <div className="h-2 w-2 rounded-full bg-accent animate-pulse" />
                                Aguardando confirmação do pagamento — atualiza automaticamente
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}

              {/* LOYALTY TAB */}
              {tab === "loyalty" && <LoyaltyProgram />}

              {/* REFERRAL TAB */}
              {tab === "referral" && <ReferralProgram />}

              {/* FAVORITES TAB */}
              {tab === "favorites" && (
                <div>
                  <h2 className="font-heading text-xl font-bold mb-4 flex items-center gap-2">
                    <div className="bg-primary/10 rounded-lg p-2"><Heart className="h-5 w-5 text-primary" /></div>
                    Meus Favoritos
                  </h2>
                  {favProducts.length === 0 ? (
                    <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
                      <Heart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <h3 className="font-heading font-bold text-lg mb-2">Nenhum favorito</h3>
                      <p className="text-muted-foreground mb-4">Adicione produtos aos favoritos clicando no coração.</p>
                      <Button onClick={() => navigate("/produtos")}>Ver Produtos</Button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {favProducts.map(p => (
                        <div key={p.id} onClick={() => navigate(`/produto/${p.id}`)} className="bg-card rounded-xl border border-border p-4 cursor-pointer hover:shadow-lg transition-shadow relative group">
                          <button onClick={e => { e.stopPropagation(); toggleFavorite(p.id, p.name); }} className="absolute top-3 right-3 h-8 w-8 rounded-full flex items-center justify-center bg-destructive/10 text-destructive hover:bg-destructive/20 transition-colors z-10">
                            <Heart className="h-4 w-4 fill-current" />
                          </button>
                          <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                            {p.image_url ? <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain" /> : <Package className="h-10 w-10 text-muted-foreground" />}
                          </div>
                          <h3 className="font-heading text-sm font-semibold line-clamp-2">{p.name}</h3>
                          {p.sku && <p className="text-[10px] text-muted-foreground mt-1">Cód: {p.sku}</p>}
                          <p className="font-heading text-lg font-bold text-price mt-2">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
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
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default ClientDashboard;
