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
import { Wrench, ShieldCheck, FileText, ShoppingCart, Clock, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import PartIdentifier from "@/components/PartIdentifier";

interface MechanicProfile {
  id: string;
  company_name: string;
  cnpj: string;
  specialty: string;
  discount_rate: number;
  is_approved: boolean;
}

const MechanicArea = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [mechanic, setMechanic] = useState<MechanicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [orders, setOrders] = useState<any[]>([]);

  // Form state
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [specialty, setSpecialty] = useState("");

  useEffect(() => {
    if (!user) { setLoading(false); return; }
    loadMechanic();
  }, [user]);

  const loadMechanic = async () => {
    if (!user) return;
    const { data } = await supabase
      .from("mechanics")
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setMechanic(data as MechanicProfile);
      setCompanyName(data.company_name || "");
      setCnpj(data.cnpj || "");
      setSpecialty(data.specialty || "");

      // Load orders
      const { data: orderData } = await supabase
        .from("orders")
        .select("id, total_amount, status, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);
      setOrders(orderData || []);
    }
    setLoading(false);
  };

  const register = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!companyName.trim()) { toast({ title: "Informe o nome da oficina", variant: "destructive" }); return; }
    
    setSaving(true);
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
      loadMechanic();
    }
    setSaving(false);
  };

  const updateProfile = async () => {
    if (!mechanic) return;
    setSaving(true);
    const { error } = await supabase.from("mechanics").update({
      company_name: companyName,
      cnpj,
      specialty,
    }).eq("id", mechanic.id);

    if (error) {
      toast({ title: "Erro ao atualizar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Perfil atualizado!" });
      loadMechanic();
    }
    setSaving(false);
  };

  const statusMap: Record<string, string> = {
    pending: "Pendente",
    confirmed: "Confirmado",
    processing: "Em Processamento",
    shipped: "Enviado",
    delivered: "Entregue",
    cancelled: "Cancelado",
  };

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
            /* Not logged in */
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
            <div className="max-w-lg mx-auto">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wrench className="h-5 w-5 text-primary" /> Cadastro de Mecânico</CardTitle>
                  <CardDescription>Preencha seus dados profissionais para acessar benefícios exclusivos.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label>Nome da Oficina / Empresa *</Label>
                    <Input value={companyName} onChange={e => setCompanyName(e.target.value)} placeholder="Ex: Oficina do João" />
                  </div>
                  <div>
                    <Label>CNPJ (opcional)</Label>
                    <Input value={cnpj} onChange={e => setCnpj(e.target.value)} placeholder="00.000.000/0000-00" />
                  </div>
                  <div>
                    <Label>Especialidade</Label>
                    <Input value={specialty} onChange={e => setSpecialty(e.target.value)} placeholder="Ex: Motores estacionários, geradores" />
                  </div>
                  <Button onClick={register} disabled={saving} className="w-full">
                    {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                    Solicitar Cadastro
                  </Button>
                </CardContent>
              </Card>

              {/* Benefits preview */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-8">
                {[
                  { icon: ShieldCheck, title: "Descontos Especiais", desc: "Até 5% de desconto em todos os produtos" },
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
            /* Mechanic dashboard */
            <div className="space-y-8">
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
                      : "Seu cadastro está sendo analisado pela equipe. Em breve você terá acesso aos descontos."}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Profile */}
                <Card className="lg:col-span-1">
                  <CardHeader>
                    <CardTitle className="text-lg">Meu Perfil</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <Label>Oficina</Label>
                      <Input value={companyName} onChange={e => setCompanyName(e.target.value)} />
                    </div>
                    <div>
                      <Label>CNPJ</Label>
                      <Input value={cnpj} onChange={e => setCnpj(e.target.value)} />
                    </div>
                    <div>
                      <Label>Especialidade</Label>
                      <Input value={specialty} onChange={e => setSpecialty(e.target.value)} />
                    </div>
                    <Button onClick={updateProfile} disabled={saving} variant="outline" className="w-full">
                      {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                      Salvar Alterações
                    </Button>
                    <div className="pt-2 border-t border-border">
                      <Badge variant={mechanic.is_approved ? "default" : "secondary"}>
                        {mechanic.is_approved ? `Desconto: ${mechanic.discount_rate}%` : "Pendente"}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Orders */}
                <Card className="lg:col-span-2">
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
                          <div key={o.id} className="flex items-center justify-between p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
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
              </div>
            </div>
          )}
        </div>

        {/* Part Identifier Tool */}
        <PartIdentifier />
      </div>

      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default MechanicArea;
