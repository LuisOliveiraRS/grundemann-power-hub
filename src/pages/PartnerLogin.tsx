import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, Wrench, Building2, Store, ArrowLeft } from "lucide-react";
import Layout from "@/components/Layout";
import logo from "@/assets/logo-grundemann.png";

type PartnerType = "mecanico" | "oficina" | "revendedor";

const partnerConfig: Record<PartnerType, { label: string; icon: any; description: string }> = {
  revendedor: { label: "Revendedor", icon: Store, description: "Revenda de peças e equipamentos" },
  oficina: { label: "Oficina", icon: Building2, description: "Empresa de manutenção e reparo" },
  mecanico: { label: "Mecânico", icon: Wrench, description: "Profissional autônomo" },
};

// Map route slugs to allowed partner types
const routeTypeMap: Record<string, PartnerType[]> = {
  "revendedor": ["revendedor"],
  "oficina-mecanico": ["oficina", "mecanico"],
};

const PartnerLogin = () => {
  const { type: routeType } = useParams<{ type?: string }>();
  const { user } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const navigate = useNavigate();
  const { toast } = useToast();

  const allowedTypes = routeType ? routeTypeMap[routeType] || (Object.keys(partnerConfig) as PartnerType[]) : (Object.keys(partnerConfig) as PartnerType[]);
  const [partnerType, setPartnerType] = useState<PartnerType>(allowedTypes[0]);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [cpf, setCpf] = useState("");
  const [specialty, setSpecialty] = useState("");

  const needsCnpj = partnerType === "oficina" || partnerType === "revendedor";

  const pageTitle = routeType === "revendedor"
    ? "Área do Revendedor"
    : routeType === "oficina-mecanico"
      ? "Área da Oficina - Mecânico"
      : "Área de Parceiros";

  // Auto-redirect logged-in users to their dashboard
  useEffect(() => {
    if (!user) { setCheckingAuth(false); return; }
    const checkPartner = async () => {
      const { data: mechanic } = await supabase
        .from("mechanics")
        .select("partner_type, is_approved")
        .eq("user_id", user.id)
        .maybeSingle();

      if (mechanic) {
        const dest = mechanic.partner_type === "revendedor" ? "/revendedor"
          : mechanic.partner_type === "oficina" ? "/oficina"
          : "/mecanico";
        navigate(dest, { replace: true });
      } else {
        setCheckingAuth(false);
      }
    };
    checkPartner();
  }, [user, navigate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else if (data.user) {
        const { data: mechanic } = await supabase
          .from("mechanics")
          .select("partner_type, is_approved")
          .eq("user_id", data.user.id)
          .maybeSingle();

        if (mechanic) {
          const dest = mechanic.partner_type === "revendedor" ? "/revendedor"
            : mechanic.partner_type === "oficina" ? "/oficina"
            : "/mecanico";
          navigate(dest);
        } else {
          // No partner record — if on specific route, show signup
          toast({ title: "Conta encontrada", description: "Você ainda não tem cadastro de parceiro. Faça seu cadastro." });
          setIsLogin(false);
        }
      }
    } else {
      if (needsCnpj && !cnpj.trim()) { toast({ title: "CNPJ obrigatório", variant: "destructive" }); setLoading(false); return; }
      if (needsCnpj && !inscricaoEstadual.trim()) { toast({ title: "Inscrição Estadual obrigatória", variant: "destructive" }); setLoading(false); return; }
      if (!fullName.trim()) { toast({ title: "Nome completo obrigatório", variant: "destructive" }); setLoading(false); return; }

      const { data, error } = await supabase.auth.signUp({
        email, password,
        options: { data: { full_name: fullName }, emailRedirectTo: window.location.origin },
      });

      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else if (data.user) {
        const profileUpdate: Record<string, string> = {};
        if (phone) profileUpdate.phone = phone;
        if (needsCnpj && cnpj) profileUpdate.cpf_cnpj = cnpj;
        if (!needsCnpj && cpf) profileUpdate.cpf_cnpj = cpf;
        if (companyName) profileUpdate.company_name = companyName;

        if (Object.keys(profileUpdate).length > 0) {
          await supabase.from("profiles").update(profileUpdate).eq("user_id", data.user.id);
        }

        await supabase.from("mechanics").insert({
          user_id: data.user.id,
          company_name: companyName || fullName,
          cnpj: cnpj || "",
          inscricao_estadual: inscricaoEstadual || "",
          specialty: specialty || "",
          partner_type: partnerType,
          is_approved: false,
        });

        toast({ title: "Cadastro realizado!", description: "Seu cadastro será analisado pelo administrador." });
        navigate("/");
      }
    }
    setLoading(false);
  };

  if (checkingAuth) {
    return (
      <Layout showFooter={false} showWhatsApp={false} showAI={false}>
        <div className="flex-1 flex items-center justify-center">
          <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
        </div>
      </Layout>
    );
  }

  return (
    <Layout showFooter={false} showWhatsApp={false} showAI={false}>
      <div className="flex-1 flex items-center justify-center bg-muted py-8">
        <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-4">
            <img src={logo} alt="Gründemann" className="h-20" />
          </div>
          <div className="text-center mb-6">
            <h2 className="font-heading text-2xl font-bold">{pageTitle}</h2>
            <p className="text-sm text-muted-foreground mt-1">
              {isLogin ? "Acesse sua conta de parceiro" : "Cadastre-se como parceiro profissional"}
            </p>
          </div>

          {/* Partner Type Selector - only on signup and if multiple types allowed */}
          {!isLogin && allowedTypes.length > 1 && (
            <div className="mb-6">
              <Label className="text-sm font-semibold mb-3 block">Tipo de parceiro</Label>
              <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${allowedTypes.length}, 1fr)` }}>
                {allowedTypes.map((type) => {
                  const config = partnerConfig[type];
                  const Icon = config.icon;
                  const isSelected = partnerType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setPartnerType(type)}
                      className={`flex flex-col items-center gap-1.5 p-3 rounded-lg border-2 transition-all text-center ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`h-6 w-6 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <p className={`text-xs font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{config.label}</p>
                      <p className="text-[10px] text-muted-foreground leading-tight">{config.description}</p>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Show single type label when only one allowed */}
          {!isLogin && allowedTypes.length === 1 && (
            <div className="mb-6 text-center">
              <div className="inline-flex items-center gap-2 bg-primary/10 rounded-full px-4 py-2">
                {(() => { const Icon = partnerConfig[allowedTypes[0]].icon; return <Icon className="h-5 w-5 text-primary" />; })()}
                <span className="text-sm font-semibold text-primary">{partnerConfig[allowedTypes[0]].label}</span>
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Nome Completo *</Label>
                  <Input id="fullName" value={fullName} onChange={(e) => setFullName(e.target.value)} required placeholder="Seu nome completo" />
                </div>
                <div>
                  <Label htmlFor="phone">Telefone / WhatsApp</Label>
                  <Input id="phone" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="(00) 00000-0000" />
                </div>

                {needsCnpj ? (
                  <>
                    <div>
                      <Label htmlFor="companyName">Razão Social *</Label>
                      <Input id="companyName" value={companyName} onChange={(e) => setCompanyName(e.target.value)} required placeholder="Nome da empresa" />
                    </div>
                    <div>
                      <Label htmlFor="cnpj">CNPJ *</Label>
                      <Input id="cnpj" value={cnpj} onChange={(e) => setCnpj(e.target.value)} required placeholder="00.000.000/0000-00" />
                    </div>
                    <div>
                      <Label htmlFor="ie">Inscrição Estadual (IE) *</Label>
                      <Input id="ie" value={inscricaoEstadual} onChange={(e) => setInscricaoEstadual(e.target.value)} required placeholder="Inscrição Estadual" />
                    </div>
                  </>
                ) : (
                  <>
                    <div>
                      <Label htmlFor="cpf">CPF</Label>
                      <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                    </div>
                    <div>
                      <Label htmlFor="companyNameMech">Nome da Oficina (opcional)</Label>
                      <Input id="companyNameMech" value={companyName} onChange={(e) => setCompanyName(e.target.value)} placeholder="Nome da oficina" />
                    </div>
                    <div>
                      <Label htmlFor="specialty">Especialidade</Label>
                      <Input id="specialty" value={specialty} onChange={(e) => setSpecialty(e.target.value)} placeholder="Ex: Motores estacionários" />
                    </div>
                  </>
                )}

                <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-muted-foreground">
                  ⚠️ Cadastros de <strong>{partnerConfig[partnerType].label}</strong> são analisados pelo administrador antes da liberação de acesso exclusivo e descontos.
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email *</Label>
              <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
            </div>
            <div>
              <Label htmlFor="password">Senha *</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta de Parceiro"}
            </Button>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Não tem conta de parceiro?" : "Já tem conta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>

          <div className="mt-4 text-center">
            <button onClick={() => navigate("/")} className="text-sm text-muted-foreground hover:text-foreground transition-colors inline-flex items-center gap-1">
              <ArrowLeft className="h-3.5 w-3.5" /> Voltar para a loja
            </button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default PartnerLogin;
