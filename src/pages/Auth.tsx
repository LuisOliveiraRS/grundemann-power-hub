import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gift, Eye, EyeOff, User, Wrench, Building2, Store, Building } from "lucide-react";
import Layout from "@/components/Layout";
import logo from "@/assets/logo-grundemann.png";
import { getGuestCart, clearGuestCart } from "@/lib/guestCart";
import { getPartnerDashboardPath } from "@/contexts/AuthContext";

type UserType = "cliente" | "mecanico" | "oficina" | "fornecedor" | "locadora";

const userTypeConfig: Record<UserType, { label: string; icon: any; description: string }> = {
  cliente: { label: "Cliente", icon: User, description: "Pessoa física ou jurídica" },
  mecanico: { label: "Mecânico", icon: Wrench, description: "Profissional autônomo" },
  oficina: { label: "Oficina", icon: Building2, description: "Empresa de manutenção" },
  fornecedor: { label: "Fornecedor", icon: Store, description: "Fornecimento de peças" },
  locadora: { label: "Locadora", icon: Building, description: "Locação de geradores" },
};

const Auth = () => {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get("ref");
  const redirect = searchParams.get("redirect");
  const navigate = useNavigate();
  const { toast } = useToast();

  const [userType, setUserType] = useState<UserType>("cliente");
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [inscricaoEstadual, setInscricaoEstadual] = useState("");
  const [cpf, setCpf] = useState("");
  const [specialty, setSpecialty] = useState("");

  const needsCnpj = userType === "oficina" || userType === "fornecedor" || userType === "locadora";
  const needsCpf = userType === "cliente" || userType === "mecanico";
  const isPartner = userType !== "cliente";

  useEffect(() => {
    if (refCode) setIsLogin(false);
  }, [refCode]);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.user) return;
      const userId = session.user.id;

      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if ((roles || []).some((r: any) => r.role === "admin")) {
        navigate("/admin", { replace: true });
        return;
      }

      const { data: mechanic } = await supabase.from("mechanics").select("partner_type").eq("user_id", userId).maybeSingle();
      navigate(getPartnerDashboardPath(mechanic?.partner_type as string || null), { replace: true });
    };
    if (!redirect) checkAuth();
  }, []);

  const syncGuestCart = async (userId: string) => {
    const guestItems = getGuestCart();
    if (guestItems.length === 0) return;
    for (const item of guestItems) {
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", userId).eq("product_id", item.product_id).maybeSingle();
      if (existing) {
        await supabase.from("cart_items").update({ quantity: existing.quantity + item.quantity }).eq("id", existing.id);
      } else {
        await supabase.from("cart_items").insert({ user_id: userId, product_id: item.product_id, quantity: item.quantity });
      }
    }
    clearGuestCart();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else if (loginData.user) {
        await syncGuestCart(loginData.user.id);
        if (redirect) {
          navigate(redirect);
        } else {
          const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", loginData.user.id);
          const isAdminUser = (roles || []).some((r: any) => r.role === "admin");
          if (isAdminUser) {
            navigate("/admin");
          } else {
            const { data: mechanic } = await supabase.from("mechanics").select("partner_type").eq("user_id", loginData.user.id).maybeSingle();
            navigate(getPartnerDashboardPath(mechanic?.partner_type as string || null));
          }
        }
      }
    } else {
      if (needsCnpj && !cnpj.trim()) {
        toast({ title: "CNPJ obrigatório", description: "Informe o CNPJ da empresa.", variant: "destructive" });
        setLoading(false);
        return;
      }
      if (needsCnpj && !inscricaoEstadual.trim()) {
        toast({ title: "IE obrigatória", description: "Informe a Inscrição Estadual.", variant: "destructive" });
        setLoading(false);
        return;
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
          emailRedirectTo: window.location.origin,
        },
      });
      if (error) {
        toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
      } else if (data.user) {
        const profileUpdate: Record<string, string> = {};
        if (phone) profileUpdate.phone = phone;
        if (needsCpf && cpf) profileUpdate.cpf_cnpj = cpf;
        if (needsCnpj && cnpj) profileUpdate.cpf_cnpj = cnpj;
        if (companyName) profileUpdate.company_name = companyName;

        if (Object.keys(profileUpdate).length > 0) {
          await supabase.from("profiles").update(profileUpdate).eq("user_id", data.user.id);
        }

        if (isPartner) {
          await supabase.from("mechanics").insert({
            user_id: data.user.id,
            company_name: companyName || fullName,
            cnpj: cnpj || "",
            inscricao_estadual: inscricaoEstadual || "",
            specialty: specialty || "",
            partner_type: userType,
            is_approved: false,
          });
        }

        if (refCode) {
          await supabase.rpc("process_referral", {
            p_referred_id: data.user.id,
            p_referral_code: refCode,
          });
        }

        await syncGuestCart(data.user.id);
        toast({ title: "Cadastro realizado!", description: isPartner ? "Seu cadastro será analisado pelo administrador." : "Bem-vindo à Gründemann!" });
        
        if (redirect) {
          navigate(redirect);
        } else {
          navigate(getPartnerDashboardPath(isPartner ? userType : null));
        }
      }
    }
    setLoading(false);
  };

  return (
    <Layout showFooter={false} showWhatsApp={false} showAI={false}>
      <div className="flex-1 flex items-center justify-center bg-muted py-8">
        <div className="w-full max-w-lg bg-background rounded-xl shadow-lg p-8">
          <div className="flex justify-center mb-6">
            <img src={logo} alt="Gründemann" className="h-24" />
          </div>
          {refCode && !isLogin && (
            <div className="bg-primary/10 border border-primary/20 rounded-lg p-3 mb-4 flex items-center gap-2 text-sm">
              <Gift className="h-4 w-4 text-primary shrink-0" />
              <span>Você foi indicado! Ganhe <strong>50 pontos</strong> de bônus ao se cadastrar.</span>
            </div>
          )}
          <h2 className="font-heading text-2xl font-bold text-center mb-6">
            {isLogin ? "Entrar" : "Criar Conta"}
          </h2>

          {!isLogin && (
            <div className="mb-6">
              <Label className="text-sm font-semibold mb-3 block">Tipo de cadastro</Label>
              <div className="grid grid-cols-2 gap-2">
                {(Object.keys(userTypeConfig) as UserType[]).map((type) => {
                  const config = userTypeConfig[type];
                  const Icon = config.icon;
                  const isSelected = userType === type;
                  return (
                    <button
                      key={type}
                      type="button"
                      onClick={() => setUserType(type)}
                      className={`flex items-center gap-2 p-3 rounded-lg border-2 transition-all text-left ${
                        isSelected
                          ? "border-primary bg-primary/5 shadow-sm"
                          : "border-border hover:border-primary/30"
                      }`}
                    >
                      <Icon className={`h-5 w-5 flex-shrink-0 ${isSelected ? "text-primary" : "text-muted-foreground"}`} />
                      <div>
                        <p className={`text-sm font-semibold ${isSelected ? "text-primary" : "text-foreground"}`}>{config.label}</p>
                        <p className="text-[11px] text-muted-foreground">{config.description}</p>
                      </div>
                    </button>
                  );
                })}
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

                {needsCpf && (
                  <div>
                    <Label htmlFor="cpf">CPF</Label>
                    <Input id="cpf" value={cpf} onChange={(e) => setCpf(e.target.value)} placeholder="000.000.000-00" />
                  </div>
                )}

                {needsCnpj && (
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
                )}

                {userType === "mecanico" && (
                  <>
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

                {isPartner && (
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 text-sm text-muted-foreground">
                    ⚠️ Cadastros de <strong>{userTypeConfig[userType].label}</strong> são analisados pelo administrador antes da liberação de acesso exclusivo.
                  </div>
                )}
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
              {loading ? "Aguarde..." : isLogin ? "Entrar" : "Criar Conta"}
            </Button>
          </form>
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? "Não tem conta?" : "Já tem conta?"}{" "}
            <button onClick={() => setIsLogin(!isLogin)} className="text-primary font-semibold hover:underline">
              {isLogin ? "Cadastre-se" : "Faça login"}
            </button>
          </p>
        </div>
      </div>
    </Layout>
  );
};

export default Auth;
