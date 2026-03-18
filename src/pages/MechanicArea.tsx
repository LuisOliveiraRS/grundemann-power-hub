import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import {
  Wrench, ShieldCheck, FileText, ShoppingCart, Clock, CheckCircle2, AlertCircle, Loader2,
  User, Phone, Mail, MapPin, Building2, Download, BookOpen, Search, Video, Package,
  BarChart3, DollarSign, TrendingUp, LogOut, Calculator,
} from "lucide-react";
import Layout from "@/components/Layout";
import PartIdentifier from "@/components/PartIdentifier";
import ExplodedCatalogContent from "@/components/ExplodedCatalogContent";
import TechnicalArticlesContent from "@/components/TechnicalArticlesContent";
import UserQuotesList from "@/components/UserQuotesList";

interface MechanicProfile {
  id: string;
  company_name: string;
  cnpj: string;
  inscricao_estadual: string;
  specialty: string;
  discount_rate: number;
  is_approved: boolean;
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
}

type SectionId = "overview" | "perfil" | "compras" | "catalogos" | "vistas" | "artigos" | "videos" | "orcamentos" | "identificador";

const MechanicArea = () => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [mechVideos, setMechVideos] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  // Mechanic form
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [specialty, setSpecialty] = useState("");

  // Profile form
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [addressNumber, setAddressNumber] = useState("");
  const [city, setCity] = useState("");
  const [state, setState] = useState("");
  const [zipCode, setZipCode] = useState("");
  const [neighborhood, setNeighborhood] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadData();
  }, [user]);

  const loadData = async () => {
    if (!user) return;
    const [mechRes, profRes] = await Promise.all([
      supabase.from("mechanics").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle(),
    ]);

    if (profRes.data) {
      const p = profRes.data;
      setProfile(p as UserProfile);
      setFullName(p.full_name || "");
      setEmail(p.email || "");
      setPhone(p.phone || "");
      setAddress(p.address || "");
      setAddressNumber(p.address_number || "");
      setCity(p.city || "");
      setState(p.state || "");
      setZipCode(p.zip_code || "");
      setNeighborhood(p.neighborhood || "");
    }

    if (mechRes.data) {
      setMechanic(mechRes.data as MechanicProfile);
      setCompanyName(mechRes.data.company_name || "");
      setCnpj(mechRes.data.cnpj || "");
      setInscricaoEstadual((mechRes.data as any).inscricao_estadual || "");
      setSpecialty(mechRes.data.specialty || "");

      const [orderRes, catalogRes, videoRes, quotesRes] = await Promise.all([
        supabase.from("orders").select("*, order_items(*)").eq("user_id", user!.id).order("created_at", { ascending: false }).limit(20),
        supabase.from("technical_catalogs").select("*").eq("is_active", true).order("category").order("title"),
        supabase.from("mechanic_videos").select("*").eq("is_active", true).order("category").order("created_at", { ascending: false }),
        supabase.from("quotes").select("*, quote_items(product_name, product_sku, quantity, unit_price)").eq("user_id", user!.id).order("created_at", { ascending: false }),
      ]);
      setOrders(orderRes.data || []);
      setCatalogs(catalogRes.data || []);
      setMechVideos(videoRes.data || []);
      setQuotes(quotesRes.data || []);
    }
    setLoading(false);
  };

  const register = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!companyName.trim()) { toast({ title: "Informe o nome da oficina", variant: "destructive" }); return; }
    if (!fullName.trim()) { toast({ title: "Informe seu nome completo", variant: "destructive" }); return; }

    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName, phone, address, address_number: addressNumber,
      city, state, zip_code: zipCode, neighborhood,
    }).eq("user_id", user.id);

    const { error } = await supabase.from("mechanics").insert({
      user_id: user.id, company_name: companyName, cnpj, inscricao_estadual: inscricaoEstadual,
      specialty, partner_type: "mecanico",
    } as any);

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Cadastro realizado! Aguarde aprovação." });
      loadData();
    }
    setSaving(false);
  };

  const updateProfile = async () => {
    if (!mechanic || !user) return;
    setSaving(true);
    await Promise.all([
      supabase.from("mechanics").update({ company_name: companyName, cnpj, inscricao_estadual: inscricaoEstadual, specialty } as any).eq("id", mechanic.id),
      supabase.from("profiles").update({
        full_name: fullName, phone, address, address_number: addressNumber,
        city, state, zip_code: zipCode, neighborhood,
      }).eq("user_id", user.id),
    ]);
    toast({ title: "Perfil atualizado com sucesso!" });
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

  // ---- Pre-dashboard states (loading, not logged in, not registered, not approved) ----

  if (loading) {
    return <Layout><div className="min-h-[60vh] flex items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></Layout>;
  }

  if (!user) {
    return (
      <Layout>
        <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Exclusivo para Profissionais</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">ÁREA DA OFICINA - MECÂNICO</h1>
            <p className="text-background/70 max-w-lg mx-auto mb-6">Cadastre-se como profissional e tenha acesso a descontos especiais, manuais técnicos e ferramentas exclusivas.</p>
          </div>
        </section>
        <div className="container py-10">
          <div className="max-w-md mx-auto text-center">
            <Card>
              <CardHeader><CardTitle>Faça login para continuar</CardTitle><CardDescription>Você precisa ter uma conta para se cadastrar como mecânico.</CardDescription></CardHeader>
              <CardContent><Button onClick={() => navigate("/auth")} className="w-full">Entrar / Cadastrar</Button></CardContent>
            </Card>
          </div>
        </div>
      </Layout>
    );
  }

  if (!mechanic) {
    return (
      <Layout>
        <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-16">
          <div className="container text-center">
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
              <Wrench className="h-4 w-4 text-primary" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">Exclusivo para Profissionais</span>
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">ÁREA DA OFICINA - MECÂNICO</h1>
            <p className="text-background/70 max-w-lg mx-auto">Cadastre-se como profissional e tenha acesso a descontos especiais, manuais técnicos e ferramentas exclusivas.</p>
          </div>
        </section>
        <div className="container py-10">
          <div className="max-w-2xl mx-auto">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Cadastro de Mecânico</CardTitle>
                <CardDescription>Preencha seus dados pessoais e profissionais para acessar benefícios exclusivos.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <RegistrationForm
                  fullName={fullName} setFullName={setFullName} email={email} phone={phone} setPhone={setPhone}
                  companyName={companyName} setCompanyName={setCompanyName} cnpj={cnpj} setCnpj={setCnpj}
                  inscricaoEstadual={inscricaoEstadual} setInscricaoEstadual={setInscricaoEstadual}
                  specialty={specialty} setSpecialty={setSpecialty}
                  address={address} setAddress={setAddress} addressNumber={addressNumber} setAddressNumber={setAddressNumber}
                  neighborhood={neighborhood} setNeighborhood={setNeighborhood} city={city} setCity={setCity}
                  state={state} setState={setState} zipCode={zipCode} setZipCode={setZipCode}
                />
                <Button onClick={register} disabled={saving} className="w-full" size="lg">
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                  Solicitar Cadastro de Mecânico
                </Button>
              </CardContent>
            </Card>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
              {[
                { icon: ShieldCheck, title: "Descontos Especiais", desc: "Até 15% de desconto em todos os produtos" },
                { icon: FileText, title: "Manuais Técnicos", desc: "Acesso a documentação exclusiva" },
                { icon: ShoppingCart, title: "Histórico Completo", desc: "Acompanhe todas suas compras" },
              ].map(b => (
                <div key={b.title} className="bg-card rounded-xl border border-border p-5 text-center">
                  <b.icon className="h-8 w-8 text-primary mx-auto mb-2" />
                  <p className="font-heading font-bold text-sm text-card-foreground">{b.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{b.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </Layout>
    );
  }

  if (!mechanic.is_approved) {
    return (
      <Layout>
        <div className="container py-16 text-center max-w-md mx-auto">
          <Clock className="h-12 w-12 text-accent mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Cadastro em Análise</h1>
          <p className="text-muted-foreground mb-4">Seu cadastro de mecânico está sendo analisado. Você receberá uma notificação quando for aprovado.</p>
          <Badge variant="outline" className="text-accent border-accent">Aguardando Aprovação</Badge>
        </div>
      </Layout>
    );
  }

  // ---- Approved dashboard (same layout as Fornecedor) ----

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
    { id: "identificador", label: "Identificar Peça", icon: Wrench },
  ];

  const calculatorCard = { section: "calculator" as any, label: "Calculadora de Carga", desc: "Dimensione a carga ideal para o gerador", icon: Calculator };

  return (
    <Layout>
      {/* Top bar */}
      <div className="bg-foreground border-b border-border">
        <div className="container py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary flex items-center justify-center">
                <Wrench className="h-5 w-5 text-primary-foreground" />
              </div>
              <div>
                <h1 className="font-heading text-lg font-bold text-background">Área da Oficina - Mecânico</h1>
                <p className="text-background/60 text-xs">{companyName || fullName} {cnpj ? `· CNPJ: ${cnpj}` : ""}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge className="bg-primary text-primary-foreground text-sm px-3 py-1">{mechanic.discount_rate}% OFF</Badge>
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
                {/* KPI Cards */}
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

                {/* Quick actions */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { section: "orcamentos" as SectionId, label: "Orçamentos", desc: `${quotes.length} solicitações`, icon: FileText },
                    { section: "catalogos" as SectionId, label: "Catálogos PDF", desc: `${catalogs.length} catálogos disponíveis`, icon: Download },
                    { section: "vistas" as SectionId, label: "Vistas Explodidas", desc: "Diagramas interativos dos motores", icon: Search },
                    { section: "artigos" as SectionId, label: "Artigos Técnicos", desc: "Guias de manutenção e diagnóstico", icon: BookOpen },
                    { section: "videos" as SectionId, label: "Vídeos Técnicos", desc: `${mechVideos.length} vídeos disponíveis`, icon: Video },
                    { section: "identificador" as SectionId, label: "Identificar Peça", desc: "Use IA para identificar peças por foto", icon: Wrench },
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
                  <Card className="cursor-pointer hover:border-primary/30 transition-all hover:shadow-md" onClick={() => navigate("/calculadora-de-carga")}>
                    <CardContent className="p-6 flex items-center gap-4">
                      <div className="h-14 w-14 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 flex items-center justify-center">
                        <Calculator className="h-7 w-7 text-accent-foreground" />
                      </div>
                      <div>
                        <h3 className="font-heading font-bold text-lg">Calculadora de Carga</h3>
                        <p className="text-sm text-muted-foreground">Dimensione a carga ideal para o gerador</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                {/* Recent orders */}
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
                  <CardTitle>Perfil do Mecânico</CardTitle>
                  <CardDescription>Atualize seus dados pessoais e da oficina</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <RegistrationForm
                    fullName={fullName} setFullName={setFullName} email={email} phone={phone} setPhone={setPhone}
                    companyName={companyName} setCompanyName={setCompanyName} cnpj={cnpj} setCnpj={setCnpj}
                    inscricaoEstadual={inscricaoEstadual} setInscricaoEstadual={setInscricaoEstadual}
                    specialty={specialty} setSpecialty={setSpecialty}
                    address={address} setAddress={setAddress} addressNumber={addressNumber} setAddressNumber={setAddressNumber}
                    neighborhood={neighborhood} setNeighborhood={setNeighborhood} city={city} setCity={setCity}
                    state={state} setState={setState} zipCode={zipCode} setZipCode={setZipCode}
                  />
                  <div className="flex items-center gap-4">
                    <Button onClick={updateProfile} disabled={saving}>
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </Button>
                    <Badge>{mechanic.discount_rate}% de desconto</Badge>
                  </div>
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

            {/* Exploded Views */}
            {activeSection === "vistas" && <ExplodedCatalogContent />}

            {/* Articles */}
            {activeSection === "artigos" && <TechnicalArticlesContent />}

            {/* Videos */}
            {activeSection === "videos" && (
              <div className="space-y-4">
                <h2 className="font-heading text-xl font-bold">Vídeos Técnicos</h2>
                {mechVideos.length === 0 ? (
                  <Card><CardContent className="py-8 text-center text-muted-foreground"><Video className="h-8 w-8 mx-auto mb-2 opacity-50" /><p>Nenhum vídeo disponível.</p></CardContent></Card>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {(() => {
                      const grouped = mechVideos.reduce((acc: Record<string, any[]>, v: any) => {
                        if (!acc[v.category]) acc[v.category] = [];
                        acc[v.category].push(v);
                        return acc;
                      }, {});
                      return Object.entries(grouped).flatMap(([category, items]) => [
                        <div key={`cat-${category}`} className="col-span-full"><h3 className="font-heading font-bold text-sm">{category}</h3></div>,
                        ...(items as any[]).map((video: any) => (
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
                        )),
                      ]);
                    })()}
                  </div>
                )}
              </div>
            )}

            {/* Part Identifier */}
            {activeSection === "identificador" && <PartIdentifier />}

            {/* Quotes */}
            {activeSection === "orcamentos" && (
              <div>
                <h2 className="font-heading text-xl font-bold mb-4">Meus Orçamentos</h2>
                <UserQuotesList
                  quotes={quotes.map((q: any) => ({ ...q, items: q.quote_items || q.items || [] }))}
                  profileName={fullName}
                  profileEmail={email}
                  profilePhone={phone}
                  profileCompany={companyName}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
};

// Extracted as a separate component to avoid re-render focus issues
const RegistrationForm = ({
  fullName, setFullName, email, phone, setPhone,
  companyName, setCompanyName, cnpj, setCnpj,
  inscricaoEstadual, setInscricaoEstadual, specialty, setSpecialty,
  address, setAddress, addressNumber, setAddressNumber,
  neighborhood, setNeighborhood, city, setCity,
  state, setState, zipCode, setZipCode,
}: any) => (
  <div className="space-y-6">
    <div>
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
        <User className="h-4 w-4 text-primary" /> Dados Pessoais
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>Nome Completo *</Label><Input value={fullName} onChange={(e: any) => setFullName(e.target.value)} placeholder="Seu nome completo" /></div>
        <div><Label>Email</Label><Input value={email} disabled className="bg-muted" /></div>
        <div><Label>Telefone / WhatsApp</Label><Input value={phone} onChange={(e: any) => setPhone(e.target.value)} placeholder="(00) 00000-0000" /></div>
      </div>
    </div>
    <div>
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
        <Building2 className="h-4 w-4 text-primary" /> Dados da Oficina
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div><Label>Nome da Oficina / Empresa *</Label><Input value={companyName} onChange={(e: any) => setCompanyName(e.target.value)} placeholder="Ex: Oficina do João" /></div>
        <div><Label>CNPJ (opcional)</Label><Input value={cnpj} onChange={(e: any) => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" /></div>
        <div><Label>Inscrição Estadual (IE)</Label><Input value={inscricaoEstadual} onChange={(e: any) => setInscricaoEstadual(e.target.value)} placeholder="IE" /></div>
        <div className="sm:col-span-2"><Label>Especialidade</Label><Input value={specialty} onChange={(e: any) => setSpecialty(e.target.value)} placeholder="Ex: Motores estacionários, geradores" /></div>
      </div>
    </div>
    <div>
      <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
        <MapPin className="h-4 w-4 text-primary" /> Endereço
      </h3>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2"><Label>Endereço</Label><Input value={address} onChange={(e: any) => setAddress(e.target.value)} placeholder="Rua, Avenida..." /></div>
        <div><Label>Número</Label><Input value={addressNumber} onChange={(e: any) => setAddressNumber(e.target.value)} placeholder="123" /></div>
        <div><Label>Bairro</Label><Input value={neighborhood} onChange={(e: any) => setNeighborhood(e.target.value)} placeholder="Bairro" /></div>
        <div><Label>Cidade</Label><Input value={city} onChange={(e: any) => setCity(e.target.value)} placeholder="Cidade" /></div>
        <div><Label>Estado</Label><Input value={state} onChange={(e: any) => setState(e.target.value)} placeholder="SP" /></div>
        <div><Label>CEP</Label><Input value={zipCode} onChange={(e: any) => setZipCode(e.target.value)} placeholder="00000-000" /></div>
      </div>
    </div>
  </div>
);

export default MechanicArea;
