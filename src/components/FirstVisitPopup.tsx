import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Gift, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

const generateCode = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "GRUND";
  for (let i = 0; i < 5; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
};

const FirstVisitPopup = () => {
  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [code, setCode] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    const seen = localStorage.getItem("grundemann_popup_seen");
    if (!seen) {
      const timer = setTimeout(() => setOpen(true), 5000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setLoading(true);

    const discountCode = generateCode();
    const { error } = await supabase
      .from("email_subscribers")
      .insert({ email: email.trim().toLowerCase(), discount_code: discountCode });

    if (error) {
      if (error.code === "23505") {
        toast({ title: "Email já cadastrado", description: "Você já recebeu seu cupom anteriormente!", variant: "destructive" });
      } else {
        toast({ title: "Erro", description: "Tente novamente.", variant: "destructive" });
      }
      setLoading(false);
      return;
    }

    setCode(discountCode);
    setSubmitted(true);
    setLoading(false);
    localStorage.setItem("grundemann_popup_seen", "true");
  };

  const handleClose = () => {
    setOpen(false);
    localStorage.setItem("grundemann_popup_seen", "true");
  };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) handleClose(); }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-heading text-xl">
            <Gift className="h-6 w-6 text-primary" />
            {submitted ? "Cupom Gerado!" : "Ganhe 10% de Desconto!"}
          </DialogTitle>
          <DialogDescription>
            {submitted
              ? "Use o código abaixo na sua próxima compra."
              : "Cadastre seu e-mail e receba um cupom exclusivo de 10% de desconto na primeira compra."}
          </DialogDescription>
        </DialogHeader>

        {submitted ? (
          <div className="text-center space-y-4 py-4">
            <div className="bg-muted rounded-xl p-4 border-2 border-dashed border-primary">
              <p className="text-xs text-muted-foreground mb-1">Seu cupom de desconto</p>
              <p className="font-heading text-2xl font-black text-primary tracking-widest">{code}</p>
            </div>
            <p className="text-sm text-muted-foreground">Válido para primeira compra. Copie e use no checkout!</p>
            <Button className="w-full" onClick={handleClose}>Começar a Comprar</Button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4 py-2">
            <Input
              type="email"
              placeholder="Seu melhor e-mail"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-12"
            />
            <Button type="submit" className="w-full h-12 font-bold" disabled={loading}>
              {loading ? "Enviando..." : "Quero meu cupom de 10%!"}
            </Button>
            <p className="text-[11px] text-muted-foreground text-center">
              Ao se cadastrar você concorda com nossa política de privacidade.
            </p>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default FirstVisitPopup;
