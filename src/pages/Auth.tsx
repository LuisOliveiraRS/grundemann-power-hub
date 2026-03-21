import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gift, Eye, EyeOff, User, Wrench, Building2, Store, Building, Mail } from "lucide-react";
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
  const [isForgotPassword, setIsForgotPassword] = useState(false);
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
    const redirectUser = async (userId: string) => {
      await syncGuestCart(userId);
      if (redirect) {
        navigate(redirect, { replace: true });
        return;
      }
      const { data: roles } = await supabase.from("user_roles").select("role").eq("user_id", userId);
      if ((roles || []).some((r: any) => r.role === "admin")) {
        navigate("/admin", { replace: true });
        return;
      }
      const { data: mechanic } = await supabase.from("mechanics").select("partner_type").eq("user_id", userId).maybeSingle();
      navigate(getPartnerDashboardPath(mechanic?.partner_type as string || null), { replace: true });
    };

    // Check on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) redirectUser(session.user.id);
    });

    // Listen for auth state changes (Google OAuth, email confirm, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) redirectUser(session.user.id);
    });

    return () => subscription.unsubscribe();
  }, [navigate, redirect]);

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

  // redirectAfterAuth is handled by the onAuthStateChange listener above

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      toast({ title: "Informe o email", description: "Digite o email cadastrado para recuperar a senha.", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Email enviado!", description: "Verifique sua caixa de entrada para redefinir a senha." });
      setIsForgotPassword(false);
    }
    setLoading(false);
  };

  const handleGoogleLogin = async () => {
    setLoading(true);
    const { error } = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (error) {
      toast({ title: "Erro ao entrar com Google", description: String(error), variant: "destructive" });
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { data: loginData, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else if (loginData.user) {
        // Redirect handled by onAuthStateChange listener
      }
    } else {
      if (password.length < 6) {
        toast({ title: "Senha fraca", description: "A senha deve ter pelo menos 6 caracteres.", variant: "destructive" });
        setLoading(false);
        return;
      }
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

        toast({ title: "Cadastro realizado!", description: isPartner ? "Seu cadastro será analisado pelo administrador." : "Bem-vindo à Gründemann!" });
        // Redirect handled by onAuthStateChange listener
      }
    }
    setLoading(false);
  };

  // Forgot password form
  if (isForgotPassword) {
    return (
      <Layout showFooter={false} showWhatsApp={false} showAI={false}>
        <div className="flex-1 flex items-center justify-center bg-muted py-8">
          <div className="w-full max-w-md bg-background rounded-xl shadow-lg p-8">
            <div className="flex justify-center mb-6">
              <img src={logo} alt="Gründemann" className="h-24" />
            </div>
            <div className="flex items-center justify-center gap-2 mb-2">
              <Mail className="h-5 w-5 text-primary" />
              <h2 className="font-heading text-2xl font-bold text-center">Recuperar Senha</h2>
            </div>
            <p className="text-sm text-muted-foreground text-center mb-6">
              Digite seu email e enviaremos um link para redefinir sua senha.
            </p>
            <form onSubmit={handleForgotPassword} className="space-y-4">
              <div>
                <Label htmlFor="email">Email *</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required placeholder="seu@email.com" />
              </div>
              <Button type="submit" className="w-full" size="lg" disabled={loading}>
                {loading ? "Enviando..." : "Enviar Link de Recuperação"}
              </Button>
            </form>
            <p className="text-center text-sm text-muted-foreground mt-4">
              <button onClick={() => setIsForgotPassword(false)} className="text-primary font-semibold hover:underline">
                ← Voltar ao login
              </button>
            </p>
          </div>
        </div>
      </Layout>
    );
  }

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

          {/* Google login button */}
          {isLogin && (
            <div className="mb-6">
              <Button variant="outline" className="w-full gap-2" size="lg" onClick={handleGoogleLogin} disabled={loading}>
                <svg className="h-5 w-5" viewBox="0 0 24 24"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                Entrar com Google
              </Button>
              <div className="relative my-4">
                <div className="absolute inset-0 flex items-center"><span className="w-full border-t border-border" /></div>
                <div className="relative flex justify-center text-xs uppercase"><span className="bg-background px-2 text-muted-foreground">ou continue com email</span></div>
              </div>
            </div>
          )}

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

            {isLogin && (
              <div className="text-right">
                <button type="button" onClick={() => setIsForgotPassword(true)} className="text-sm text-primary hover:underline">
                  Esqueceu a senha?
                </button>
              </div>
            )}

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
