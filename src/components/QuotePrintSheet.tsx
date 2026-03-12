import { forwardRef } from "react";
import logo from "@/assets/logo-grundemann.png";

interface QuoteItem {
  product_name: string;
  product_sku?: string | null;
  quantity: number;
  unit_price: number;
}

interface QuoteData {
  id: string;
  created_at: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  customer_company?: string | null;
  message?: string | null;
  total_estimated: number;
  items: QuoteItem[];
}

interface QuotePrintSheetProps {
  quote: QuoteData;
}

const QuotePrintSheet = forwardRef<HTMLDivElement, QuotePrintSheetProps>(({ quote }, ref) => {
  return (
    <div ref={ref} style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", background: "#fff", padding: "24px", maxWidth: "210mm", margin: "0 auto" }}>
      {/* Header - Company */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", borderBottom: "3px solid #d4a017", paddingBottom: "16px", marginBottom: "20px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <img src={logo} alt="Gründemann" style={{ height: "50px" }} />
          <div>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "16px", letterSpacing: "1px" }}>GRÜNDEMANN GERADORES LTDA</p>
            <p style={{ margin: "2px 0 0", fontSize: "10px", color: "#666" }}>Rua Luiz Bernardo da Silva, 190 — Pinheiro — São Leopoldo/RS — CEP 93042-110</p>
            <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#666" }}>Tel: (51) 98182-5748 | adair.grundemann@gmail.com</p>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <p style={{ margin: 0, fontSize: "18px", fontWeight: "bold", color: "#d4a017" }}>ORÇAMENTO</p>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>#{quote.id.slice(0, 8).toUpperCase()}</p>
          <p style={{ margin: "1px 0 0", fontSize: "10px", color: "#666" }}>{new Date(quote.created_at).toLocaleDateString("pt-BR")}</p>
        </div>
      </div>

      {/* Client Data */}
      <div style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "14px", marginBottom: "20px" }}>
        <h3 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#888", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
          DADOS DO SOLICITANTE
        </h3>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px 24px", fontSize: "11px", lineHeight: "1.8" }}>
          <p style={{ margin: 0 }}><strong>Nome:</strong> {quote.customer_name}</p>
          <p style={{ margin: 0 }}><strong>Email:</strong> {quote.customer_email}</p>
          <p style={{ margin: 0 }}><strong>Telefone:</strong> {quote.customer_phone}</p>
          {quote.customer_company && <p style={{ margin: 0 }}><strong>Empresa:</strong> {quote.customer_company}</p>}
        </div>
        {quote.message && (
          <p style={{ margin: "8px 0 0", fontSize: "11px", color: "#555" }}>
            <strong>Observações:</strong> {quote.message}
          </p>
        )}
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px", fontSize: "11px" }}>
        <thead>
          <tr style={{ backgroundColor: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>#</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "left" }}>Produto</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>SKU</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "center" }}>Qtd</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Preço Unit.</th>
            <th style={{ border: "1px solid #ddd", padding: "8px", textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, idx) => (
            <tr key={idx} style={{ backgroundColor: idx % 2 === 0 ? "#fff" : "#fafafa" }}>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px", fontWeight: "500" }}>{item.product_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "center", color: "#888" }}>{item.product_sku || "—"}</td>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right" }}>R$ {Number(item.unit_price).toFixed(2).replace(".", ",")}</td>
              <td style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right", fontWeight: "bold" }}>R$ {(Number(item.unit_price) * item.quantity).toFixed(2).replace(".", ",")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr style={{ backgroundColor: "#f0e6c8" }}>
            <td colSpan={5} style={{ border: "1px solid #ddd", padding: "10px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>TOTAL ESTIMADO:</td>
            <td style={{ border: "1px solid #ddd", padding: "10px 8px", textAlign: "right", fontWeight: "bold", fontSize: "14px", color: "#333" }}>R$ {Number(quote.total_estimated).toFixed(2).replace(".", ",")}</td>
          </tr>
        </tfoot>
      </table>

      {/* Terms */}
      <div style={{ fontSize: "9px", color: "#999", borderTop: "1px solid #ddd", paddingTop: "10px", lineHeight: "1.6" }}>
        <p style={{ margin: 0 }}>• Os valores apresentados são estimativas e podem sofrer alteração conforme disponibilidade e condições comerciais.</p>
        <p style={{ margin: 0 }}>• Validade do orçamento: 7 dias úteis.</p>
        <p style={{ margin: 0 }}>• Frete e prazo de entrega calculados após confirmação do pedido.</p>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "16px", borderTop: "2px solid #d4a017", paddingTop: "8px", fontSize: "9px", color: "#999", textAlign: "center" }}>
        Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Gründemann Geradores
      </div>
    </div>
  );
});

QuotePrintSheet.displayName = "QuotePrintSheet";

export default QuotePrintSheet;
