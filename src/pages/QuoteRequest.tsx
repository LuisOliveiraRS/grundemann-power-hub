import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import Layout from "@/components/Layout";
import { FileText, Trash2, Plus, Minus, Send, ShoppingCart, Search, Loader2, Package } from "lucide-react";

interface QuoteItem {
  product_id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
  image_url?: string | null;
}

interface SearchResult {
  id: string;
  name: string;
  price: number;
  sku: string | null;
  image_url: string | null;
}

const QuoteRequest = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [items, setItems] = useState<QuoteItem[]>([]);
  const [form, setForm] = useState({ name: "", email: "", phone: "", company: "", message: "" });
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  // Product search
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("quote_items");
    if (saved) setItems(JSON.parse(saved));

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

  // Product search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.trim().length >= 2) searchProducts();
      else setSearchResults([]);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const searchProducts = async () => {
    setSearching(true);
    const { data } = await supabase
      .from("products")
      .select("id, name, price, sku, image_url")
      .eq("is_active", true)
      .or(`name.ilike.%${searchQuery}%,sku.ilike.%${searchQuery}%`)
      .limit(10);
    setSearchResults((data || []) as SearchResult[]);
    setSearching(false);
  };

  const addProduct = (product: SearchResult) => {
    const existing = items.findIndex(i => i.product_id === product.id);
    let updated: QuoteItem[];
    if (existing >= 0) {
      updated = items.map((item, i) => i === existing ? { ...item, quantity: item.quantity + 1 } : item);
    } else {
      updated = [...items, {
        product_id: product.id,
        product_name: product.name,
        product_sku: product.sku || "",
        quantity: 1,
        unit_price: product.price,
        image_url: product.image_url,
      }];
    }
    setItems(updated);
    localStorage.setItem("quote_items", JSON.stringify(updated));
    setSearchQuery("");
    setSearchResults([]);
    toast({ title: "Produto adicionado ao orçamento" });
  };

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
    if (!user) {
      toast({ title: "Faça login para enviar o orçamento", description: "Você precisa estar cadastrado.", variant: "destructive" });
      navigate("/auth?redirect=/orcamento");
      return;
    }
    if (!form.name || !form.email || !form.phone) {
      toast({ title: "Preencha nome, email e telefone", variant: "destructive" });
      return;
    }
    if (items.length === 0) {
      toast({ title: "Adicione pelo menos um produto", variant: "destructive" });
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

    const quoteItems = items.map(i => ({
      quote_id: quote.id,
      product_id: i.product_id,
      product_name: i.product_name,
      product_sku: i.product_sku,
      quantity: i.quantity,
      unit_price: i.unit_price,
    }));

    await supabase.from("quote_items").insert(quoteItems as any);

    // Notify admin
    const { data: adminRoles } = await supabase.from("user_roles").select("user_id").eq("role", "admin");
    if (adminRoles && adminRoles.length > 0) {
      const notifications = adminRoles.map(r => ({
        user_id: r.user_id,
        title: "Nova Solicitação de Orçamento 📋",
        message: `${form.name} solicitou orçamento com ${items.length} item(ns). Total estimado: R$ ${total.toFixed(2)}`,
        type: "quote",
        link: "/admin",
      }));
      await supabase.from("notifications").insert(notifications as any);
    }

    localStorage.removeItem("quote_items");
    setItems([]);
    setSubmitted(true);
    setSubmitting(false);
    toast({ title: "Orçamento enviado com sucesso!" });
  };

  if (submitted) return (
    <Layout>
      <div className="flex-1 flex items-center justify-center py-16">
        <div className="text-center max-w-md mx-auto p-8">
          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h2 className="font-heading text-2xl font-bold mb-2">Orçamento Enviado!</h2>
          <p className="text-muted-foreground mb-2">Recebemos sua solicitação e entraremos em contato em breve.</p>
          <p className="text-sm text-muted-foreground mb-6">Você pode acompanhar o status na sua área de cliente.</p>
          <div className="flex gap-3 justify-center">
            <Button onClick={() => navigate("/produtos")}>Continuar Comprando</Button>
            <Button variant="outline" onClick={() => navigate("/minha-conta")}>Meus Orçamentos</Button>
          </div>
        </div>
      </div>
    </Layout>
  );

  return (
    <Layout>
      <div className="flex-1">
        <div className="bg-gradient-brand py-8">
          <div className="container text-center">
            <h1 className="font-heading text-3xl font-bold text-primary-foreground mb-2">Solicitar Orçamento</h1>
            <p className="text-primary-foreground/70">Busque produtos, monte sua lista e envie para nossa equipe.</p>
          </div>
        </div>

        <div className="container py-8 max-w-4xl">
          {/* Product Search */}
          <div className="bg-card rounded-xl border border-border p-6 mb-6">
            <h3 className="font-heading font-bold mb-3 flex items-center gap-2">
              <Search className="h-5 w-5 text-primary" /> Buscar Produtos
            </h3>
            <div className="relative">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Digite o nome ou SKU do produto..."
                className="pr-10"
                onFocus={() => setShowSearch(true)}
              />
              {searching && <Loader2 className="h-4 w-4 animate-spin absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" />}
            </div>
            {searchResults.length > 0 && (
              <div className="mt-2 border border-border rounded-lg overflow-hidden max-h-[300px] overflow-y-auto">
                {searchResults.map((product) => (
                  <button
                    key={product.id}
                    onClick={() => addProduct(product)}
                    className="w-full flex items-center gap-3 p-3 hover:bg-muted transition-colors text-left border-b border-border last:border-0"
                  >
                    {product.image_url ? (
                      <img src={product.image_url} alt="" className="h-10 w-10 rounded object-cover border border-border" />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{product.name}</p>
                      {product.sku && <p className="text-xs text-muted-foreground">SKU: {product.sku}</p>}
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-primary">R$ {product.price.toFixed(2).replace(".", ",")}</p>
                      <Plus className="h-4 w-4 text-primary ml-auto" />
                    </div>
                  </button>
                ))}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-2">
              Também pode <Link to="/produtos" className="text-primary font-medium hover:underline">navegar pelo catálogo</Link> e adicionar produtos ao orçamento.
            </p>
          </div>

          {/* Items list */}
          {items.length === 0 ? (
            <div className="bg-card rounded-xl border border-border p-12 text-center mb-6">
              <ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground mb-4">Busque e adicione produtos acima para montar seu orçamento.</p>
            </div>
          ) : (
            <div className="bg-card rounded-xl border border-border mb-6 overflow-hidden">
              <div className="p-4 border-b border-border">
                <h3 className="font-heading font-bold">Produtos do Orçamento ({items.length})</h3>
              </div>
              <div className="divide-y divide-border">
                {items.map((item, idx) => (
                  <div key={idx} className="p-4 flex items-center gap-4">
                    {item.image_url ? (
                      <img src={item.image_url} alt="" className="h-14 w-14 rounded-lg object-cover border border-border" />
                    ) : (
                      <div className="h-14 w-14 rounded-lg bg-muted flex items-center justify-center"><Package className="h-6 w-6 text-muted-foreground" /></div>
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
            <h3 className="font-heading font-bold mb-1">Seus Dados</h3>
            {!user && (
              <div className="bg-accent/10 border border-accent/20 rounded-lg p-3 mb-4 text-sm">
                ⚠️ <Link to="/auth?redirect=/orcamento" className="text-primary font-semibold hover:underline">Faça login ou cadastre-se</Link> para enviar o orçamento.
              </div>
            )}
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
                <Label>Telefone / WhatsApp *</Label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} className="mt-1" />
              </div>
              <div>
                <Label>Empresa</Label>
                <Input value={form.company} onChange={e => setForm(f => ({ ...f, company: e.target.value }))} className="mt-1" />
              </div>
            </div>
            <div className="mb-6">
              <Label>Observações</Label>
              <Textarea value={form.message} onChange={e => setForm(f => ({ ...f, message: e.target.value }))} placeholder="Descreva sua necessidade, prazos, quantidade mínima, etc..." className="mt-1" rows={3} />
            </div>
            <Button size="lg" onClick={submitQuote} disabled={submitting || items.length === 0} className="w-full sm:w-auto">
              <Send className="h-5 w-5 mr-2" /> {submitting ? "Enviando..." : "Enviar Solicitação de Orçamento"}
            </Button>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default QuoteRequest;
