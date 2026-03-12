import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Gift, Eye, EyeOff } from "lucide-react";
import Layout from "@/components/Layout";
import logo from "@/assets/logo-grundemann.png";

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

  useEffect(() => {
    if (refCode) setIsLogin(false);
  }, [refCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    if (isLogin) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        toast({ title: "Erro ao entrar", description: error.message, variant: "destructive" });
      } else {
        navigate(redirect || "/");
      }
    } else {
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
      } else {
        // Update phone if provided
        if (phone && data.user) {
          await supabase.from("profiles").update({ phone }).eq("user_id", data.user.id);
        }
        // Process referral if code exists
        if (refCode && data.user) {
          await supabase.rpc("process_referral", {
            p_referred_id: data.user.id,
            p_referral_code: refCode,
          });
        }
        toast({ title: "Cadastro realizado!", description: "Bem-vindo à Gründemann!" });
        navigate(redirect || "/");
      }
    }
    setLoading(false);
  };

  return (
    <Layout showFooter={false} showWhatsApp={false} showAI={false}>
      <div className="flex-1 flex items-center justify-center bg-muted py-8">
        <div className="w-full max-w-md bg-background rounded-xl shadow-lg p-8">
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
