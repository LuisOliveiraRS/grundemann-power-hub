import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  User, Download, FileText, ShoppingCart, Clock, CheckCircle2, AlertCircle, Loader2,
  Building2, BookOpen, Search, Video, Package, BarChart3, DollarSign, LogOut, Wrench,
} from "lucide-react";
import Layout from "@/components/Layout";
import ExplodedCatalogContent from "@/components/ExplodedCatalogContent";
import TechnicalArticlesContent from "@/components/TechnicalArticlesContent";
import UserQuotesList from "@/components/UserQuotesList";

interface PartnerProfile {
  id: string;
  company_name: string;
  cnpj: string;
  inscricao_estadual: string;
  specialty: string;
  discount_rate: number;
  is_approved: boolean;
  partner_type: string;
}

interface UserProfile {
  full_name: string;
  email: string;
  phone: string | null;
  address: string | null;
  address_number: string | null;
  city: string | null;
  state: string | null;
  zip_code: string | null;
  neighborhood: string | null;
  company_name: string | null;
  cpf_cnpj: string | null;
}

type SectionId = "overview" | "perfil" | "compras" | "catalogos" | "orcamentos" | "vistas" | "artigos" | "videos";

const OficinaDashboard = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [mechVideos, setMechVideos] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    setLoading(true);
    const [partnerRes, profileRes, ordersRes, catalogsRes, quotesRes, videosRes] = await Promise.all([
      supabase.from("mechanics").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("technical_catalogs").select("*").eq("is_active", true).order("title"),
      supabase.from("quotes").select("*, quote_items(product_name, product_sku, quantity, unit_price)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("mechanic_videos").select("*").eq("is_active", true).order("category"),
    ]);

    if (partnerRes.data) setPartner(partnerRes.data as any);
    if (profileRes.data) {
      const p = profileRes.data;
      setProfile(p as any);
      setFullName(p.full_name || "");
      setPhone(p.phone || "");
      setAddress(p.address || "");
      setAddressNumber(p.address_number || "");
      setCity(p.city || "");
      setState(p.state || "");
      setZipCode(p.zip_code || "");
      setNeighborhood(p.neighborhood || "");
    }
    if (ordersRes.data) setOrders(ordersRes.data);
    if (catalogsRes.data) setCatalogs(catalogsRes.data);
    if (quotesRes.data) setQuotes(quotesRes.data.map((q: any) => ({ ...q, items: q.quote_items || [] })));
    if (videosRes.data) setMechVideos(videosRes.data);
    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName, phone, address, address_number: addressNumber,
      city, state, zip_code: zipCode, neighborhood,
    }).eq("user_id", user.id);
    toast({ title: "Perfil atualizado!" });
    setSaving(false);
  };

  const handleDownload = async (catalog: any) => {
    setDownloadingId(catalog.id);
    try {
      const { data } = await supabase.storage.from("technical-catalogs").createSignedUrl(catalog.file_url, 300);
      if (data?.signedUrl) window.open(data.signedUrl, "_blank");
    } catch {
      toast({ title: "Erro ao baixar", variant: "destructive" });
    }
    setDownloadingId(null);
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Em Processamento",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  if (loading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!partner || partner.partner_type !== "oficina") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Esta área é exclusiva para oficinas cadastradas.</p>
          <Button onClick={() => navigate("/parceiros/oficina-mecanico")}>Cadastrar como Oficina</Button>
        </div>
      </Layout>
    );
  }

  if (!partner.is_approved) {
    return (
      <Layout>
        <div className="container py-16 text-center max-w-md mx-auto">
          <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Cadastro em Análise</h1>
          <p className="text-muted-foreground mb-4">Seu cadastro de oficina está sendo analisado. Você receberá uma notificação quando for aprovado.</p>
          <Badge variant="outline" className="text-accent border-accent">Aguardando Aprovação</Badge>
        </div>
      </Layout>
    );
  }

  const totalSpent = orders.reduce((s, o) => s + Number(o.total_amount), 0);
  const deliveredOrders = orders.filter(o => o.status === "delivered").length;

  const sidebarItems: { id: SectionId; label: string; icon: any }[] = [
    { id: "overview", label: "Painel", icon: BarChart3 },
    { id: "perfil", label: "Meu Perfil", icon: User },
    { id: "compras", label: "Compras", icon: ShoppingCart },
    { id: "orcamentos", label: "Orçamentos", icon: FileText },
    { id: "catalogos", label: "Catálogos PDF", icon: Download },
    { id: "vistas", label: "Vistas Explodidas", icon: Search },
    { id: "artigos", label: "Artigos Técnicos", icon: BookOpen },
    { id: "videos", label: "Vídeos", icon: Video },
  ];

  return (
    <Layout>
      {/* Top bar */}
      <div className="bg-foreground border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Building2 className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-background">Área da Oficina - Mecânico</h1>
                <p className="text-background/60 text-xs">{partner.company_name || fullName} · CNPJ: {partner.cnpj}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">{partner.discount_rate}% OFF</Badge>
              <Button variant="outline" size="sm" onClick={() => navigate("/")} className="text-background border-background/20 hover:bg-background/10">
                Ver Loja
              </Button>
              <Button variant="ghost" size="sm" onClick={signOut} className="text-background/60 hover:text-background hover:bg-background/10">
                <LogOut className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container py-6">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
          {/* Sidebar */}
          <div className="md:col-span-1">
            <nav className="bg-card rounded-xl border border-border p-2 space-y-1 sticky top-24">
              {sidebarItems.map(item => {
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveSection(item.id)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      activeSection === item.id
                        ? "bg-primary text-primary-foreground shadow-sm"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground"
                    }`}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Content */}
          <div className="md:col-span-4">
            {/* Overview */}
            {activeSection === "overview" && (
              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                  {[
                    { label: "Total em Compras", value: `R$ ${totalSpent.toFixed(2).replace(".", ",")}`, icon: DollarSign, bg: "bg-primary/10", color: "text-primary" },
                    { label: "Pedidos Realizados", value: orders.length, icon: ShoppingCart, bg: "bg-secondary/10", color: "text-secondary-foreground" },
                    { label: "Entregues", value: deliveredOrders, icon: CheckCircle2, bg: "bg-primary/10", color: "text-primary" },
                    { label: "Orçamentos", value: quotes.length, icon: FileText, bg: "bg-accent/10", color: "text-accent-foreground" },
                  ].map(kpi => (
                    <Card key={kpi.label} className="border-border">
                      <CardContent className="p-4">
                        <div className="flex items-center gap-3">
                          <div className={`rounded-lg p-2 ${kpi.bg}`}>
                            <kpi.icon className={`h-5 w-5 ${kpi.color}`} />
                          </div>
                          <div>
                            <p className="text-xs text-muted-foreground">{kpi.label}</p>
                            <p className="font-heading font-bold text-lg">{kpi.value}</p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { section: "orcamentos" as SectionId, label: "Orçamentos", desc: `${quotes.length} solicitações`, icon: FileText },
                    { section: "catalogos" as SectionId, label: "Catálogos PDF", desc: `${catalogs.length} catálogos disponíveis`, icon: Download },
                    { section: "vistas" as SectionId, label: "Vistas Explodidas", desc: "Diagramas interativos dos motores", icon: Search },
                    { section: "artigos" as SectionId, label: "Artigos Técnicos", desc: "Guias de manutenção e diagnóstico", icon: BookOpen },
                    { section: "videos" as SectionId, label: "Vídeos Técnicos", desc: `${mechVideos.length} vídeos disponíveis`, icon: Video },
                    { section: "compras" as SectionId, label: "Compras", desc: `${orders.length} pedidos realizados`, icon: ShoppingCart },
                  ].map(item => (
                    <Card key={item.section} className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md" onClick={() => setActiveSection(item.section)}>
                      <CardContent className="p-6 flex items-center gap-4">
                        <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                          <item.icon className="h-7 w-7 text-primary" />
                        </div>
                        <div>
                          <h3 className="font-heading font-bold text-lg">{item.label}</h3>
                          <p className="text-sm text-muted-foreground">{item.desc}</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {orders.length > 0 && (
                  <Card>
                    <CardHeader><CardTitle className="text-lg">Últimas Compras</CardTitle></CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {orders.slice(0, 5).map(order => (
                          <div key={order.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="font-semibold text-sm">Pedido #{order.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="flex items-center gap-3">
                              <Badge variant="outline">{statusLabel[order.status] || order.status}</Badge>
                              <p className="font-bold text-sm">R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </div>
            )}

            {/* Profile */}
            {activeSection === "perfil" && (
              <Card>
                <CardHeader>
                  <CardTitle>Perfil da Oficina</CardTitle>
                  <CardDescription>Atualize seus dados pessoais e de contato</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div><Label>Nome Completo</Label><Input value={fullName} onChange={e => setFullName(e.target.value)} /></div>
                    <div><Label>Telefone</Label><Input value={phone} onChange={e => setPhone(e.target.value)} /></div>
                    <div><Label>Endereço</Label><Input value={address} onChange={e => setAddress(e.target.value)} /></div>
                    <div><Label>Número</Label><Input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} /></div>
                    <div><Label>Bairro</Label><Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} /></div>
                    <div><Label>Cidade</Label><Input value={city} onChange={e => setCity(e.target.value)} /></div>
                    <div><Label>Estado</Label><Input value={state} onChange={e => setState(e.target.value)} /></div>
                    <div><Label>CEP</Label><Input value={zipCode} onChange={e => setZipCode(e.target.value)} /></div>
                  </div>
                  <div className="bg-muted/50 rounded-lg p-4 mt-4">
                    <p className="text-sm font-semibold mb-2">Dados da Empresa</p>
                    <div className="grid grid-cols-2 gap-2 text-sm text-muted-foreground">
                      <p>Razão Social: <strong className="text-foreground">{partner.company_name}</strong></p>
                      <p>CNPJ: <strong className="text-foreground">{partner.cnpj}</strong></p>
                      <p>IE: <strong className="text-foreground">{partner.inscricao_estadual}</strong></p>
                      <p>Desconto: <strong className="text-foreground">{partner.discount_rate}%</strong></p>
                    </div>
                  </div>
                  <Button onClick={saveProfile} disabled={saving}>{saving ? "Salvando..." : "Salvar Alterações"}</Button>
                </CardContent>
              </Card>
            )}

            {/* Orders */}
            {activeSection === "compras" && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold">Histórico de Compras</h2>
                {orders.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground"><ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum pedido encontrado.</p></CardContent></Card>
                ) : orders.map(order => (
                  <Card key={order.id}>
                    <CardContent className="py-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-sm">Pedido #{order.id.slice(0, 8)}</p>
                          <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline">{statusLabel[order.status] || order.status}</Badge>
                          <p className="text-sm font-bold mt-1">R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}</p>
                        </div>
                      </div>
                      {order.order_items && (
                        <div className="text-xs text-muted-foreground">
                          {order.order_items.map((item: any) => <p key={item.id}>{item.quantity}x {item.product_name}</p>)}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {/* Catalogs */}
            {activeSection === "catalogos" && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold">Catálogos Técnicos</h2>
                {catalogs.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground"><Download className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum catálogo disponível.</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {catalogs.map(catalog => (
                      <Card key={catalog.id} className="hover:border-primary/20 transition-colors">
                        <CardContent className="py-4 flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="rounded-lg bg-primary/10 p-2"><FileText className="h-5 w-5 text-primary" /></div>
                            <div>
                              <p className="font-semibold text-sm">{catalog.title}</p>
                              <p className="text-xs text-muted-foreground">{catalog.description || catalog.category}</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline" onClick={() => handleDownload(catalog)} disabled={downloadingId === catalog.id}>
                            {downloadingId === catalog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                          </Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeSection === "vistas" && <ExplodedCatalogContent />}
            {activeSection === "artigos" && <TechnicalArticlesContent />}

            {/* Videos */}
            {activeSection === "videos" && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold">Vídeos Técnicos</h2>
                {mechVideos.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground"><Video className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum vídeo disponível.</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {mechVideos.map((video: any) => (
                      <Card key={video.id}>
                        <div className="aspect-video">
                          {video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be") ? (
                            <iframe src={video.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")} className="w-full h-full rounded-t-lg" allowFullScreen title={video.title} />
                          ) : (
                            <video src={video.video_url} controls className="w-full h-full object-cover rounded-t-lg" />
                          )}
                        </div>
                        <CardContent className="p-3">
                          <p className="font-heading font-bold text-sm">{video.title}</p>
                          {video.description && <p className="text-xs text-muted-foreground mt-1">{video.description}</p>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Quotes */}
            {activeSection === "orcamentos" && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">Meus Orçamentos</h2>
                <UserQuotesList
                  quotes={quotes}
                  profileName={fullName}
                  profileEmail={profile?.email || ""}
                  profilePhone={phone}
                  profileCompany={partner.company_name}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default OficinaDashboard;
