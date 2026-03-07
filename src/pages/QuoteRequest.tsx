import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { FileText, Trash2, Plus, Minus, Send, ShoppingCart } from "lucide-react";

interface QuoteItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
}

const QuoteRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    // Load quote items from localStorage
    const saved = localStorage.getItem("quote_items");
    if (saved) setItems(JSON.parse(saved));

    // Pre-fill form if user is logged in
    if (user) {
      supabase.from("profiles").select("full_name, email, phone, company_name").eq("user_id", user.id).single().then(({ data }) => {
        if (data) setForm(f => ({
          ...f,
          name: data.full_name || f.name,
          email: data.email || f.email,
          phone: data.phone || f.phone,
          company: data.company_name || f.company,
        }));
      });
    }
  }, [user]);

  const updateQuantity = (idx: number, qty: number) => {
    const updated = items.map((item, i) => i === idx ? { ...item, quantity: Math.max(1, qty) } : item);
    setItems(updated);
    localStorage.setItem("quote_items", JSON.stringify(updated));
  };

  const removeItem = (idx: number) => {
    const updated = items.filter((_, i) => i !== idx);
    setItems(updated);
    localStorage.setItem("quote_items", JSON.stringify(updated));
  };

  const total = items.reduce((s, i) => s + i.unit_price * i.quantity, 0);

  const submitQuote = async () => {
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Preencha nome, email e telefone", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
      return;
    }

    if (!user) {
      toast({ title: "Faça login para enviar o orçamento", variant: "destructive" });
      navigate("/auth");
      return;
    }

    setSubmitting(true);

    const { data: quote, error } = await supabase.from("quotes").insert({
      user_id: user.id,
      customer_name: form.name,
      customer_email: form.email,
      customer_phone: form.phone,
      customer_company: form.company,
      message: form.message,
      total_estimated: total,
    } as any).select("id").single();

    if (error || !quote) {
      toast({ title: "Erro ao enviar orçamento", description: error?.message, variant: "destructive" });
      setSubmitting(false);
      return;
    }

    // Insert items
    const quoteItems = items.map(i => ({
      quote_id: quote.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_sku: i.product_sku,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    await supabase.from("quote_items").insert(quoteItems as any);

    localStorage.removeItem("quote_items");
    setItems([]);
    setSubmitted(true);
    setSubmitting(false);
    toast({ title: "Orçamento enviado com sucesso!" });
  };

  if (submitted) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Orçamento Enviado!</h2>
          <p className="text-muted-foreground mb-6">Recebemos sua solicitação e entraremos em contato em breve.</p>
          <Button onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
        </div>
      </div>
      <Footer />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <div className="flex-1">
        <div className="container py-8 max-w-4xl">
          <h1 className="font-heading text-3xl font-bold mb-2">Solicitar Orçamento</h1>
          <p className="text-muted-foreground mb-8">Adicione produtos e envie sua solicitação de orçamento.</p>

          {items.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center mb-8">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Nenhum produto na lista de orçamento.</p>
              <Button variant="outline" onClick={() => navigate("/produtos")}>Ver Produtos</Button>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border mb-8 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading font-bold">Produtos ({items.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-16 w-16 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="h-16 w-16 rounded-lg bg-muted" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{item.product_name}</p>
                      {item.product_sku && <p className="text-xs text-muted-foreground">SKU: {item.product_sku}</p>}
                      <p className="text-sm font-bold text-primary mt-1">R$ {item.unit_price.toFixed(2).replace(".", ",")}</p>
                    </div>
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => updateQuantity(idx, item.quantity - 1)} className="p-2 hover:bg-muted rounded-l-lg"><Minus className="h-3 w-3" /></button>
                      <span className="w-10 text-center text-sm font-bold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(idx, item.quantity + 1)} className="p-2 hover:bg-muted rounded-r-lg"><Plus className="h-3 w-3" /></button>
                    </div>
                    <p className="font-bold text-sm w-28 text-right">R$ {(item.unit_price * item.quantity).toFixed(2).replace(".", ",")}</p>
                    <Button variant="ghost" size="icon" onClick={() => removeItem(idx)}>
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                ))}
              </div>
              <div className="p-4 border-t border-border bg-muted/30 flex justify-between items-center">
                <span className="font-medium">Total Estimado:</span>
                <span className="font-heading text-xl font-bold text-primary">R$ {total.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          )}

          {/* Contact form */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-heading font-bold mb-4">Seus Dados</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Email *</Label>
                <Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="mb-6">
              <Label>Mensagem</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Descreva sua necessidade..." className="mt-1" rows={3} />
            </div>
            <Button size="lg" onClick={submitQuote} disabled={submitting || items.length === 0}>
              <Send className="h-5 w-5 mr-2" /> {submitting ? "Enviando..." : "Enviar Orçamento"}
            </Button>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default QuoteRequest;
