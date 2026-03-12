import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { FileText, Search, ChevronDown, ChevronUp, Eye, Package, DollarSign, Clock, CheckCircle } from "lucide-react";

interface Quote {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string;
  message: string;
  status: string;
  admin_notes: string;
  total_estimated: number;
  created_at: string;
  items?: QuoteItem[];
}

interface QuoteItem {
  id: string;
  product_name: string;
  product_sku: string;
  quantity: number;
  unit_price: number;
}

const statusLabels: Record<string, string> = {
  pending: "Pendente",
  reviewing: "Em Análise",
  quoted: "Orçado",
  accepted: "Aceito",
  rejected: "Rejeitado",
};

const statusColors: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  reviewing: "bg-secondary/10 text-secondary-foreground",
  quoted: "bg-primary/20 text-primary",
  accepted: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/20 text-destructive",
};

const QuoteManagement = () => {
  const { toast } = useToast();
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => { loadQuotes(); }, []);

  const loadQuotes = async () => {
    const { data } = await supabase.from("quotes").select("*").order("created_at", { ascending: false });
    setQuotes((data || []) as Quote[]);
    setLoading(false);
  };

  const toggleExpand = async (quoteId: string) => {
    if (expanded === quoteId) { setExpanded(null); return; }
    const { data } = await supabase.from("quote_items").select("*").eq("quote_id", quoteId);
    setQuotes(prev => prev.map(q => q.id === quoteId ? { ...q, items: (data || []) as QuoteItem[] } : q));
    setExpanded(quoteId);
  };

  const updateStatus = async (quoteId: string, status: string) => {
    await supabase.from("quotes").update({ status } as any).eq("id", quoteId);
    toast({ title: `Status atualizado para: ${statusLabels[status]}` });
    loadQuotes();
  };

  const updateNotes = async (quoteId: string, notes: string) => {
    await supabase.from("quotes").update({ admin_notes: notes } as any).eq("id", quoteId);
  };

  const filtered = quotes.filter(q => {
    if (statusFilter && q.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return q.customer_name.toLowerCase().includes(s) || q.customer_email.toLowerCase().includes(s) || q.id.includes(s);
    }
    return true;
  });

  const stats = {
    total: quotes.length,
    pending: quotes.filter(q => q.status === "pending").length,
    quoted: quotes.filter(q => q.status === "quoted").length,
    totalValue: quotes.reduce((s, q) => s + Number(q.total_estimated), 0),
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold">Orçamentos</h1>
        <p className="text-muted-foreground mt-1">Gerencie solicitações de orçamento</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total", value: stats.total, icon: FileText, color: "text-primary" },
          { label: "Pendentes", value: stats.pending, icon: Clock, color: "text-accent-foreground" },
          { label: "Orçados", value: stats.quoted, icon: CheckCircle, color: "text-primary" },
          { label: "Valor Total", value: `R$ ${stats.totalValue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-heading font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, email..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="border border-input rounded-lg px-3 py-2 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
          <option value="">Todos os status</option>
          {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
        </select>
      </div>

      {/* Quotes list */}
      <div className="space-y-3">
        {filtered.map(quote => (
          <div key={quote.id} className="bg-card rounded-xl border border-border overflow-hidden">
            <button onClick={() => toggleExpand(quote.id)} className="w-full p-4 flex items-center gap-4 text-left hover:bg-muted/30 transition-colors">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-heading font-bold text-sm">#{quote.id.slice(0, 8)}</span>
                  <Badge className={statusColors[quote.status]}>{statusLabels[quote.status] || quote.status}</Badge>
                </div>
                <p className="text-sm font-medium">{quote.customer_name}</p>
                <p className="text-xs text-muted-foreground">{quote.customer_email} · {quote.customer_phone}</p>
              </div>
              <div className="text-right">
                <p className="font-bold text-primary">R$ {Number(quote.total_estimated).toFixed(2).replace(".", ",")}</p>
                <p className="text-xs text-muted-foreground">{new Date(quote.created_at).toLocaleDateString("pt-BR")}</p>
              </div>
              {expanded === quote.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </button>

            {expanded === quote.id && (
              <div className="border-t border-border p-4 bg-muted/20">
                {quote.customer_company && <p className="text-sm mb-2"><strong>Empresa:</strong> {quote.customer_company}</p>}
                {quote.message && <p className="text-sm mb-4"><strong>Mensagem:</strong> {quote.message}</p>}

                {/* Items */}
                {quote.items && (
                  <div className="bg-background rounded-lg border border-border mb-4 overflow-hidden">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="text-left p-3">Produto</th>
                          <th className="text-center p-3">SKU</th>
                          <th className="text-center p-3">Qtd</th>
                          <th className="text-right p-3">Preço Unit.</th>
                          <th className="text-right p-3">Subtotal</th>
                        </tr>
                      </thead>
                      <tbody>
                        {quote.items.map(item => (
                          <tr key={item.id} className="border-t border-border">
                            <td className="p-3 font-medium">{item.product_name}</td>
                            <td className="p-3 text-center text-muted-foreground">{item.product_sku || "—"}</td>
                            <td className="p-3 text-center">{item.quantity}</td>
                            <td className="p-3 text-right">R$ {Number(item.unit_price).toFixed(2).replace(".", ",")}</td>
                            <td className="p-3 text-right font-bold">R$ {(Number(item.unit_price) * item.quantity).toFixed(2).replace(".", ",")}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Admin notes */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-1 block">Notas internas</label>
                  <Textarea
                    defaultValue={quote.admin_notes}
                    onBlur={e => updateNotes(quote.id, e.target.value)}
                    placeholder="Adicione observações..."
                    rows={2}
                  />
                </div>

                {/* Status buttons + WhatsApp */}
                <div className="flex flex-wrap items-center gap-2">
                  {Object.entries(statusLabels).map(([k, v]) => (
                    <Button key={k} variant={quote.status === k ? "default" : "outline"} size="sm" onClick={() => updateStatus(quote.id, k)}>
                      {v}
                    </Button>
                  ))}
                  {quote.customer_phone && (
                    <a
                      href={`https://wa.me/55${quote.customer_phone.replace(/\D/g, "")}?text=${encodeURIComponent(
                        `Olá ${quote.customer_name}! Referente ao seu orçamento #${quote.id.slice(0, 8)} na Gründemann Geradores.\n\n`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button type="button" size="sm" className="bg-[hsl(142,70%,45%)] hover:bg-[hsl(142,70%,40%)] text-white gap-1.5">
                        <MessageCircle className="h-4 w-4" />
                        Responder via WhatsApp
                      </Button>
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum orçamento encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default QuoteManagement;
