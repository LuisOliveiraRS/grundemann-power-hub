import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { FileText, Printer, ChevronDown, ChevronUp, MessageSquare } from "lucide-react";
import QuotePrintSheet from "@/components/QuotePrintSheet";

interface QuoteItem {
  product_name: string;
  product_sku: string | null;
  quantity: number;
  unit_price: number;
}

interface Quote {
  id: string;
  status: string;
  total_estimated: number;
  created_at: string;
  message: string | null;
  admin_notes: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company: string | null;
  items?: QuoteItem[];
}

interface UserQuotesListProps {
  quotes: Quote[];
  profileName?: string;
  profileEmail?: string;
  profilePhone?: string;
  profileCompany?: string;
}

const statusLabel: Record<string, string> = {
  pending: "Aguardando Resposta",
  reviewing: "Em Análise",
  quoted: "Orçado",
  answered: "Respondido",
  accepted: "Aceito",
  approved: "Aprovado",
  rejected: "Recusado",
};

const statusColor: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  reviewing: "bg-secondary/10 text-secondary-foreground",
  quoted: "bg-primary/20 text-primary",
  answered: "bg-primary/20 text-primary",
  accepted: "bg-primary text-primary-foreground",
  approved: "bg-primary text-primary-foreground",
  rejected: "bg-destructive/20 text-destructive",
};

const UserQuotesList = ({ quotes, profileName, profileEmail, profilePhone, profileCompany }: UserQuotesListProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const [printingQuote, setPrintingQuote] = useState<Quote | null>(null);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const toggleExpand = async (quoteId: string) => {
    if (expandedId === quoteId) { setExpandedId(null); return; }
    // Load items if not already loaded
    const quote = quotes.find(q => q.id === quoteId);
    if (quote && !quote.items) {
      const { data } = await supabase.from("quote_items").select("product_name, product_sku, quantity, unit_price").eq("quote_id", quoteId);
      if (data) quote.items = data as QuoteItem[];
    }
    setExpandedId(quoteId);
  };

  const printQuote = (quote: Quote) => {
    setPrintingQuote(quote);
    setTimeout(() => {
      if (!printRef.current) return;
      const win = window.open("", "_blank");
      if (!win) { toast({ title: "Permita pop-ups para imprimir", variant: "destructive" }); return; }
      win.document.write(`<!DOCTYPE html><html><head><title>Orçamento #${quote.id.slice(0, 8)}</title><style>@media print { body { margin: 0; } } body { margin: 0; padding: 0; }</style></head><body>${printRef.current.innerHTML}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); setPrintingQuote(null); }, 500);
    }, 200);
  };

  if (quotes.length === 0) {
    return (
      <div className="bg-card rounded-xl shadow-sm border border-border p-12 text-center">
        <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h3 className="font-heading font-bold text-lg mb-2">Nenhum orçamento</h3>
        <p className="text-muted-foreground mb-4">Você ainda não solicitou nenhum orçamento.</p>
        <Button onClick={() => navigate("/orcamento")}>Solicitar Orçamento</Button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Hidden print area */}
      {printingQuote && (
        <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
          <div ref={printRef}>
            <QuotePrintSheet quote={{
              id: printingQuote.id,
              created_at: printingQuote.created_at,
              customer_name: printingQuote.customer_name || profileName || "",
              customer_email: printingQuote.customer_email || profileEmail || "",
              customer_phone: printingQuote.customer_phone || profilePhone || "",
              customer_company: printingQuote.customer_company || profileCompany || null,
              message: printingQuote.message,
              total_estimated: printingQuote.total_estimated,
              items: (printingQuote.items || []).map(i => ({
                product_name: i.product_name,
                product_sku: i.product_sku,
                quantity: i.quantity,
                unit_price: i.unit_price,
              })),
            }} />
          </div>
        </div>
      )}

      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-muted-foreground">{quotes.length} orçamento(s)</p>
        <Button size="sm" onClick={() => navigate("/orcamento")}>
          <FileText className="h-4 w-4 mr-1" /> Novo Orçamento
        </Button>
      </div>

      {quotes.map(q => (
        <div key={q.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
          <button
            onClick={() => toggleExpand(q.id)}
            className="w-full p-5 flex items-center justify-between text-left hover:bg-muted/30 transition-colors"
          >
            <div>
              <div className="flex items-center gap-2 mb-1">
                <p className="font-heading font-bold text-sm">Orçamento #{q.id.slice(0, 8)}</p>
                <Badge className={statusColor[q.status] || "bg-muted text-muted-foreground"}>
                  {statusLabel[q.status] || q.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                {new Date(q.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric" })}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <p className="font-heading font-bold text-primary">R$ {Number(q.total_estimated).toFixed(2).replace(".", ",")}</p>
              <Button size="sm" variant="outline" onClick={e => { e.stopPropagation(); printQuote(q); }} className="gap-1.5">
                <Printer className="h-3.5 w-3.5" /> PDF
              </Button>
              {expandedId === q.id ? <ChevronUp className="h-5 w-5 text-muted-foreground" /> : <ChevronDown className="h-5 w-5 text-muted-foreground" />}
            </div>
          </button>

          {expandedId === q.id && (
            <div className="border-t border-border p-5 bg-muted/20">
              {/* Items table */}
              {q.items && q.items.length > 0 && (
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
                      {q.items.map((item, idx) => (
                        <tr key={idx} className="border-t border-border">
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

              {q.message && (
                <p className="text-sm text-muted-foreground mb-3">
                  <strong>Observações:</strong> {q.message}
                </p>
              )}

              {/* Admin response */}
              {q.admin_notes && (
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <MessageSquare className="h-4 w-4 text-primary" />
                    <p className="text-xs font-bold text-primary uppercase">Resposta da Gründemann</p>
                  </div>
                  <p className="text-sm text-foreground">{q.admin_notes}</p>
                </div>
              )}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

export default UserQuotesList;
