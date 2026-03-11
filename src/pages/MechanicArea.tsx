import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Wrench, ShieldCheck, FileText, ShoppingCart, Clock, CheckCircle2, AlertCircle, Loader2, User, Phone, Mail, MapPin, Building2, Download, BookOpen, Search, Video, Package, ChevronUp } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import PartIdentifier from "@/components/PartIdentifier";
import ExplodedCatalogContent from "@/components/ExplodedCatalogContent";
import TechnicalArticlesContent from "@/components/TechnicalArticlesContent";

interface MechanicProfile {
  id: string;
  company_name: string;
  cnpj: string;
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

const MechanicArea = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hub" | "perfil" | "compras" | "identificador" | "catalogos" | "vistas" | "artigos" | "videos" | "orcamentos">("hub");
  const [mechVideos, setMechVideos] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);

  // Mechanic form
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
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
      setSpecialty(mechRes.data.specialty || "");

      const [orderRes, catalogRes, videoRes, quotesRes] = await Promise.all([
        supabase
          .from("orders")
          .select("id, total_amount, status, created_at")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false })
          .limit(20),
        supabase
          .from("technical_catalogs")
          .select("*")
          .eq("is_active", true)
          .order("category")
          .order("title"),
        supabase
          .from("mechanic_videos")
          .select("*")
          .eq("is_active", true)
          .order("category")
          .order("created_at", { ascending: false }),
        supabase
          .from("quotes")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
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

    // Update profile first
    await supabase.from("profiles").update({
      full_name: fullName, phone, address, address_number: addressNumber,
      city, state, zip_code: zipCode, neighborhood,
    }).eq("user_id", user.id);

    const { error } = await supabase.from("mechanics").insert({
      user_id: user.id,
      company_name: companyName,
      cnpj,
      specialty,
    });

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

    const [mechErr, profErr] = await Promise.all([
      supabase.from("mechanics").update({ company_name: companyName, cnpj, specialty }).eq("id", mechanic.id),
      supabase.from("profiles").update({
        full_name: fullName, phone, address, address_number: addressNumber,
        city, state, zip_code: zipCode, neighborhood,
      }).eq("user_id", user.id),
    ]);

    if (mechErr.error || profErr.error) {
      toast({ title: "Erro ao atualizar", variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado com sucesso!" });
      loadData();
    }
    setSaving(false);
  };

  const statusMap: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Em Processamento",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  const renderProfileForm = () => (
    <div className="space-y-6">
      {/* Personal info */}
      <div>
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <User className="h-4 w-4 text-primary" /> Dados Pessoais
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome Completo *</Label>
            <Input value={fullName} onChange={e => setFullName(e.target.value)} placeholder="Seu nome completo" />
          </div>
          <div>
            <Label>Email</Label>
            <Input value={email} disabled className="bg-muted" />
          </div>
          <div>
            <Label>Telefone / WhatsApp</Label>
            <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
          </div>
        </div>
      </div>

      {/* Company info */}
      <div>
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <Building2 className="h-4 w-4 text-primary" /> Dados da Oficina
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Nome da Oficina / Empresa *</Label>
            <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Oficina do João" />
          </div>
          <div>
            <Label>CNPJ (opcional)</Label>
            <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
          </div>
          <div className="sm:col-span-2">
            <Label>Especialidade</Label>
            <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Motores estacionários, geradores, bombas d'água" />
          </div>
        </div>
      </div>

      {/* Address */}
      <div>
        <h3 className="font-heading font-bold text-foreground mb-3 flex items-center gap-2">
          <MapPin className="h-4 w-4 text-primary" /> Endereço
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="sm:col-span-2">
            <Label>Endereço</Label>
            <Input value={address} onChange={e => setAddress(e.target.value)} placeholder="Rua, Avenida..." />
          </div>
          <div>
            <Label>Número</Label>
            <Input value={addressNumber} onChange={e => setAddressNumber(e.target.value)} placeholder="123" />
          </div>
          <div>
            <Label>Bairro</Label>
            <Input value={neighborhood} onChange={e => setNeighborhood(e.target.value)} placeholder="Bairro" />
          </div>
          <div>
            <Label>Cidade</Label>
            <Input value={city} onChange={e => setCity(e.target.value)} placeholder="Cidade" />
          </div>
          <div>
            <Label>Estado</Label>
            <Input value={state} onChange={e => setState(e.target.value)} placeholder="SP" />
          </div>
          <div>
            <Label>CEP</Label>
            <Input value={zipCode} onChange={e => setZipCode(e.target.value)} placeholder="00000-000" />
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-16">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
            <Wrench className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Exclusivo para Profissionais</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">
            ÁREA DO MECÂNICO
          </h1>
          <p className="text-background/70 max-w-lg mx-auto">
            Cadastre-se como profissional e tenha acesso a descontos especiais, manuais técnicos e ferramentas exclusivas.
          </p>
        </div>
      </section>

      <div className="flex-1">
        <div className="container py-10">
          {loading ? (
            <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
          ) : !user ? (
            <div className="max-w-md mx-auto text-center">
              <Card>
                <CardHeader>
                  <CardTitle>Faça login para continuar</CardTitle>
                  <CardDescription>Você precisa ter uma conta para se cadastrar como mecânico.</CardDescription>
                </CardHeader>
                <CardContent>
                  <Button onClick={() => navigate("/auth")} className="w-full">Entrar / Cadastrar</Button>
                </CardContent>
              </Card>
            </div>
          ) : !mechanic ? (
            /* Registration form */
            <div className="max-w-2xl mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Cadastro de Mecânico</CardTitle>
                  <CardDescription>Preencha seus dados pessoais e profissionais para acessar benefícios exclusivos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <ProfileForm />
                  <Button onClick={register} disabled={saving} className="w-full" size="lg">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Wrench className="h-4 w-4 mr-2" />}
                    Solicitar Cadastro de Mecânico
                  </Button>
                </CardContent>
              </Card>

              {/* Benefits */}
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
          ) : (
            /* Dashboard */
            <div className="space-y-6">
              {/* Status banner */}
              <div className={`rounded-xl p-5 border flex items-center gap-4 ${mechanic.is_approved ? "bg-primary/5 border-primary/20" : "bg-accent/10 border-accent/30"}`}>
                {mechanic.is_approved ? (
                  <CheckCircle2 className="h-8 w-8 text-primary flex-shrink-0" />
                ) : (
                  <AlertCircle className="h-8 w-8 text-accent-foreground flex-shrink-0" />
                )}
                <div>
                  <p className="font-heading font-bold text-foreground">
                    {mechanic.is_approved ? "Cadastro Aprovado ✓" : "Cadastro em Análise"}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {mechanic.is_approved
                      ? `Desconto de ${mechanic.discount_rate}% aplicado automaticamente nas compras.`
                      : "Seu cadastro está sendo analisado. Em breve você terá acesso aos descontos."}
                  </p>
                </div>
              </div>

              {/* Navigation Hub or Back button */}
              {activeTab !== "hub" && (
                <div className="mb-4">
                  <Button variant="ghost" size="sm" onClick={() => setActiveTab("hub")} className="gap-1.5">
                    <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar ao Menu
                  </Button>
                </div>
              )}

              {activeTab === "hub" && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
                  {[
                    { key: "perfil" as const, label: "Meu Perfil", desc: "Atualize seus dados pessoais e da oficina", icon: User, gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                    { key: "videos" as const, label: "Vídeos Técnicos", desc: "Vídeos de instalação e manutenção exclusivos", icon: Video, gradient: "from-secondary/15 to-secondary/5", iconBg: "bg-secondary/20", iconColor: "text-secondary", border: "border-secondary/25" },
                    { key: "vistas" as const, label: "Vistas Explodidas", desc: "Diagramas interativos dos motores", icon: Search, gradient: "from-accent/20 to-accent/10", iconBg: "bg-accent/30", iconColor: "text-accent-foreground", border: "border-accent/30" },
                    { key: "artigos" as const, label: "Artigos Técnicos", desc: "Guias de manutenção e diagnóstico", icon: BookOpen, gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                    { key: "catalogos" as const, label: "Catálogos PDF", desc: "Manuais e catálogos para download", icon: FileText, gradient: "from-secondary/15 to-secondary/5", iconBg: "bg-secondary/20", iconColor: "text-secondary", border: "border-secondary/25" },
                    { key: "orcamentos" as const, label: "Meus Orçamentos", desc: "Acompanhe suas solicitações de orçamento", icon: Package, gradient: "from-accent/20 to-accent/10", iconBg: "bg-accent/30", iconColor: "text-accent-foreground", border: "border-accent/30" },
                    { key: "compras" as const, label: "Histórico de Compras", desc: "Acompanhe todas as suas compras", icon: ShoppingCart, gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                    { key: "identificador" as const, label: "Identificar Peça", desc: "Use IA para identificar peças por foto", icon: Wrench, gradient: "from-secondary/15 to-secondary/5", iconBg: "bg-secondary/20", iconColor: "text-secondary", border: "border-secondary/25" },
                  ].map((card) => (
                    <button
                      key={card.key}
                      onClick={() => setActiveTab(card.key)}
                      className={`group relative text-left rounded-2xl border-2 ${card.border} bg-gradient-to-br ${card.gradient} p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
                    >
                      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-background/5 to-transparent -translate-y-8 translate-x-8" />
                      <div className={`inline-flex items-center justify-center rounded-xl ${card.iconBg} p-3 mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                        <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                      </div>
                      <h3 className="font-heading font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{card.label}</h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                      <div className="mt-4 inline-flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                        Acessar →
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {activeTab === "perfil" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Meu Perfil Profissional</CardTitle>
                    <CardDescription>Atualize seus dados pessoais e da oficina</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <ProfileForm />
                    <div className="flex items-center gap-4">
                      <Button onClick={updateProfile} disabled={saving}>
                        {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                        Salvar Alterações
                      </Button>
                      <Badge variant={mechanic.is_approved ? "default" : "secondary"}>
                        {mechanic.is_approved ? `Desconto: ${mechanic.discount_rate}%` : "Aprovação Pendente"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              )}

              {activeTab === "compras" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Clock className="h-5 w-5 text-primary" /> Histórico de Compras
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {orders.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhuma compra realizada ainda.</p>
                    ) : (
                      <div className="space-y-3">
                        {orders.map(o => (
                          <div key={o.id} className="flex items-center justify-between p-4 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                            <div>
                              <p className="text-sm font-medium">Pedido #{o.id.slice(0, 8)}</p>
                              <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-heading font-bold text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                              <Badge variant="outline" className="text-xs">{statusMap[o.status] || o.status}</Badge>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "identificador" && <PartIdentifier />}

              {activeTab === "vistas" && <ExplodedCatalogContent />}

              {activeTab === "artigos" && <TechnicalArticlesContent />}

              {activeTab === "videos" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Video className="h-5 w-5 text-primary" /> Vídeos Técnicos
                    </CardTitle>
                    <CardDescription>Vídeos exclusivos para mecânicos cadastrados</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {mechVideos.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum vídeo disponível no momento.</p>
                    ) : (
                      <div className="space-y-4">
                        {(() => {
                          const grouped = mechVideos.reduce((acc: Record<string, any[]>, v: any) => {
                            if (!acc[v.category]) acc[v.category] = [];
                            acc[v.category].push(v);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([category, items]) => (
                            <div key={category}>
                              <h3 className="font-heading font-bold text-sm text-foreground mb-3">{category}</h3>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {(items as any[]).map((video: any) => (
                                  <div key={video.id} className="rounded-xl border border-border overflow-hidden bg-card">
                                    <div className="aspect-video">
                                      {video.video_url.includes("youtube.com") || video.video_url.includes("youtu.be") ? (
                                        <iframe
                                          src={video.video_url.replace("watch?v=", "embed/").replace("youtu.be/", "youtube.com/embed/")}
                                          className="w-full h-full"
                                          allowFullScreen
                                          title={video.title}
                                        />
                                      ) : (
                                        <video src={video.video_url} controls className="w-full h-full object-cover" />
                                      )}
                                    </div>
                                    <div className="p-3">
                                      <p className="font-heading font-bold text-sm">{video.title}</p>
                                      {video.description && <p className="text-xs text-muted-foreground mt-1">{video.description}</p>}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {activeTab === "catalogos" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <BookOpen className="h-5 w-5 text-primary" /> Catálogos Técnicos
                    </CardTitle>
                    <CardDescription>
                      Manuais e catálogos exclusivos para mecânicos cadastrados
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {catalogs.length === 0 ? (
                      <p className="text-muted-foreground text-center py-8">Nenhum catálogo disponível no momento.</p>
                    ) : (
                      <div className="space-y-2">
                        {(() => {
                          const grouped = catalogs.reduce((acc: Record<string, any[]>, c: any) => {
                            if (!acc[c.category]) acc[c.category] = [];
                            acc[c.category].push(c);
                            return acc;
                          }, {});
                          return Object.entries(grouped).map(([category, items]) => (
                            <div key={category} className="space-y-2">
                              <h3 className="font-heading font-bold text-sm text-foreground mt-4 first:mt-0">{category}</h3>
                              {(items as any[]).map((catalog: any) => (
                                <div key={catalog.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                                  <div className="rounded-lg bg-primary/10 p-2 flex-shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="font-medium text-sm">{catalog.title}</p>
                                    {catalog.description && <p className="text-xs text-muted-foreground line-clamp-1">{catalog.description}</p>}
                                  </div>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    disabled={downloadingId === catalog.id}
                                    onClick={async () => {
                                      setDownloadingId(catalog.id);
                                      const { data, error } = await supabase.storage
                                        .from("technical-catalogs")
                                        .createSignedUrl(catalog.file_url, 300);
                                      if (data?.signedUrl) {
                                        window.open(data.signedUrl, "_blank");
                                      } else {
                                        toast({ title: "Erro ao baixar", description: "Tente novamente.", variant: "destructive" });
                                      }
                                      setDownloadingId(null);
                                    }}
                                  >
                                    {downloadingId === catalog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4 mr-1" />}
                                    Baixar
                                  </Button>
                                </div>
                              ))}
                            </div>
                          ));
                        })()}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}

              {/* QUOTES TAB */}
              {activeTab === "orcamentos" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Package className="h-5 w-5 text-primary" /> Meus Orçamentos
                    </CardTitle>
                    <CardDescription>Acompanhe suas solicitações de orçamento e respostas</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {quotes.length === 0 ? (
                      <div className="text-center py-8">
                        <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                        <p className="text-muted-foreground mb-4">Nenhum orçamento solicitado.</p>
                        <Button onClick={() => navigate("/orcamento")}>Solicitar Orçamento</Button>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        <div className="flex justify-end mb-2">
                          <Button size="sm" onClick={() => navigate("/orcamento")}>
                            <Package className="h-4 w-4 mr-1" /> Novo Orçamento
                          </Button>
                        </div>
                        {quotes.map((q: any) => (
                          <div key={q.id} className="rounded-xl border border-border p-5 bg-card">
                            <div className="flex items-center justify-between mb-2">
                              <p className="font-heading font-bold">Orçamento #{q.id.slice(0, 8)}</p>
                              <Badge className={q.status === "accepted" ? "bg-primary text-primary-foreground" : q.status === "rejected" ? "bg-destructive/20 text-destructive" : q.status === "quoted" ? "bg-primary/20 text-primary" : "bg-accent/20 text-accent-foreground"}>
                                {{ pending: "Pendente", reviewing: "Em Análise", quoted: "Orçado", accepted: "Aceito", rejected: "Rejeitado" }[q.status] || q.status}
                              </Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">{new Date(q.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}</p>
                            {q.message && <p className="text-sm text-muted-foreground mt-2">{q.message}</p>}
                            <p className="font-heading font-bold text-primary mt-2">R$ {Number(q.total_estimated || 0).toFixed(2).replace(".", ",")}</p>
                            {q.admin_notes && (
                              <div className="mt-3 pt-3 border-t border-border">
                                <p className="text-xs font-semibold text-muted-foreground mb-1">Resposta do administrador:</p>
                                <p className="text-sm bg-muted/50 rounded-lg p-3">{q.admin_notes}</p>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      </div>

      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default MechanicArea;
