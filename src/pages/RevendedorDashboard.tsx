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
import { User, Phone, Mail, MapPin, Building2, Download, FileText, ShoppingCart, Package, Clock, CheckCircle2, AlertCircle, Loader2, ChevronUp } from "lucide-react";
import Layout from "@/components/Layout";

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

const RevendedorDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [partner, setPartner] = useState<PartnerProfile | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);
  const [catalogs, setCatalogs] = useState<any[]>([]);
  const [quotes, setQuotes] = useState<any[]>([]);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"hub" | "perfil" | "compras" | "catalogos" | "orcamentos">("hub");

  // Profile form
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

    const [partnerRes, profileRes, ordersRes, catalogsRes, quotesRes] = await Promise.all([
      supabase.from("mechanics").select("*").eq("user_id", user.id).single(),
      supabase.from("profiles").select("*").eq("user_id", user.id).single(),
      supabase.from("orders").select("*, order_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
      supabase.from("technical_catalogs").select("*").eq("is_active", true).order("title"),
      supabase.from("quotes").select("*, quote_items(*)").eq("user_id", user.id).order("created_at", { ascending: false }),
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
    if (quotesRes.data) setQuotes(quotesRes.data);

    setLoading(false);
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    await supabase.from("profiles").update({
      full_name: fullName,
      phone,
      address,
      address_number: addressNumber,
      city,
      state,
      zip_code: zipCode,
      neighborhood,
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
    pending: "Pendente",
    confirmed: "Confirmado",
    processing: "Em Processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

  const quoteStatusLabel: Record<string, string> = {
    pending: "Aguardando Resposta",
    answered: "Respondido",
    approved: "Aprovado",
    rejected: "Recusado",
  };

  if (loading) {
    return (
      <Layout>
        <div className="min-h-[60vh] flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!partner || partner.partner_type !== "revendedor") {
    return (
      <Layout>
        <div className="container py-16 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mx-auto mb-4" />
          <h1 className="font-heading text-2xl font-bold mb-2">Acesso Restrito</h1>
          <p className="text-muted-foreground mb-4">Esta área é exclusiva para revendedores cadastrados.</p>
          <Button onClick={() => navigate("/auth")}>Cadastrar como Revendedor</Button>
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
          <p className="text-muted-foreground mb-4">Seu cadastro de revendedor está sendo analisado. Você receberá uma notificação quando for aprovado.</p>
          <Badge variant="outline" className="text-accent border-accent">Aguardando Aprovação</Badge>
        </div>
      </Layout>
    );
  }

  const tabs = [
    { id: "hub" as const, label: "Início", icon: Package },
    { id: "perfil" as const, label: "Perfil", icon: User },
    { id: "compras" as const, label: "Compras", icon: ShoppingCart },
    { id: "catalogos" as const, label: "Catálogos PDF", icon: Download },
    { id: "orcamentos" as const, label: "Orçamentos", icon: FileText },
  ];

  return (
    <Layout>
      <div className="bg-gradient-brand py-8">
        <div className="container">
          <div className="flex items-center gap-3">
            <Building2 className="h-8 w-8 text-primary-foreground" />
            <div>
              <h1 className="font-heading text-2xl font-bold text-primary-foreground">Área do Revendedor</h1>
              <p className="text-primary-foreground/70 text-sm">{partner.company_name || fullName}</p>
            </div>
            <Badge className="ml-auto bg-accent text-accent-foreground">{partner.discount_rate}% desconto</Badge>
          </div>
        </div>
      </div>

      <div className="container py-6">
        {/* Tabs */}
        <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeTab === tab.id ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted"
                }`}
              >
                <Icon className="h-4 w-4" />
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* Hub */}
        {activeTab === "hub" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {tabs.filter(t => t.id !== "hub").map((tab) => {
              const Icon = tab.icon;
              return (
                <Card key={tab.id} className="cursor-pointer hover:border-primary/30 transition-colors" onClick={() => setActiveTab(tab.id)}>
                  <CardContent className="flex items-center gap-4 py-6">
                    <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center">
                      <Icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-heading font-bold">{tab.label}</h3>
                      <p className="text-sm text-muted-foreground">
                        {tab.id === "perfil" && "Gerencie seus dados"}
                        {tab.id === "compras" && `${orders.length} pedidos`}
                        {tab.id === "catalogos" && `${catalogs.length} catálogos disponíveis`}
                        {tab.id === "orcamentos" && `${quotes.length} orçamentos`}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Profile */}
        {activeTab === "perfil" && (
          <Card>
            <CardHeader>
              <CardTitle>Meu Perfil</CardTitle>
              <CardDescription>Atualize seus dados pessoais e de contato</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome Completo</Label>
                  <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
                </div>
                <div>
                  <Label>Telefone</Label>
                  <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
                </div>
                <div>
                  <Label>Endereço</Label>
                  <Input value={address} onChange={(e) => setAddress(e.target.value)} />
                </div>
                <div>
                  <Label>Número</Label>
                  <Input value={addressNumber} onChange={(e) => setAddressNumber(e.target.value)} />
                </div>
                <div>
                  <Label>Bairro</Label>
                  <Input value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} />
                </div>
                <div>
                  <Label>Cidade</Label>
                  <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </div>
                <div>
                  <Label>Estado</Label>
                  <Input value={state} onChange={(e) => setState(e.target.value)} />
                </div>
                <div>
                  <Label>CEP</Label>
                  <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} />
                </div>
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

              <Button onClick={saveProfile} disabled={saving}>
                {saving ? "Salvando..." : "Salvar Alterações"}
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Orders */}
        {activeTab === "compras" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold">Histórico de Compras</h2>
            {orders.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum pedido encontrado.</p>
                </CardContent>
              </Card>
            ) : (
              orders.map((order) => (
                <Card key={order.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Pedido #{order.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(order.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right">
                        <Badge variant="outline">{statusLabel[order.status] || order.status}</Badge>
                        <p className="text-sm font-bold mt-1">R$ {Number(order.total_amount).toFixed(2)}</p>
                      </div>
                    </div>
                    {order.order_items && (
                      <div className="text-xs text-muted-foreground">
                        {order.order_items.map((item: any) => (
                          <p key={item.id}>{item.quantity}x {item.product_name}</p>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Catalogs */}
        {activeTab === "catalogos" && (
          <div className="space-y-4">
            <h2 className="font-heading text-xl font-bold">Catálogos Técnicos em PDF</h2>
            {catalogs.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <Download className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum catálogo disponível no momento.</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {catalogs.map((catalog) => (
                  <Card key={catalog.id}>
                    <CardContent className="py-4 flex items-center justify-between">
                      <div>
                        <p className="font-semibold text-sm">{catalog.title}</p>
                        <p className="text-xs text-muted-foreground">{catalog.category}</p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleDownload(catalog)}
                        disabled={downloadingId === catalog.id}
                      >
                        {downloadingId === catalog.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <Download className="h-4 w-4" />}
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Quotes */}
        {activeTab === "orcamentos" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-bold">Meus Orçamentos</h2>
              <Button onClick={() => navigate("/orcamento")}>Novo Orçamento</Button>
            </div>
            {quotes.length === 0 ? (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Nenhum orçamento solicitado.</p>
                  <Button variant="outline" className="mt-3" onClick={() => navigate("/orcamento")}>Solicitar Orçamento</Button>
                </CardContent>
              </Card>
            ) : (
              quotes.map((quote) => (
                <Card key={quote.id}>
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between mb-2">
                      <div>
                        <p className="font-semibold text-sm">Orçamento #{quote.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <Badge variant="outline">{quoteStatusLabel[quote.status] || quote.status}</Badge>
                    </div>
                    {quote.quote_items && (
                      <div className="text-xs text-muted-foreground">
                        {quote.quote_items.map((item: any) => (
                          <p key={item.id}>{item.quantity}x {item.product_name}</p>
                        ))}
                      </div>
                    )}
                    {quote.total_estimated > 0 && (
                      <p className="text-sm font-bold mt-2">Total estimado: R$ {Number(quote.total_estimated).toFixed(2)}</p>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}
      </div>
    </Layout>
  );
};

export default RevendedorDashboard;
