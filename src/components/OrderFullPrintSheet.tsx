import { forwardRef } from "react";
import logo from "@/assets/logo-grundemann.png";

interface ClientProfile {
  full_name: string;
  email: string;
  phone: string | null;
  cpf_cnpj?: string | null;
  company_name?: string | null;
  address?: string | null;
  address_number?: string | null;
  address_complement?: string | null;
  neighborhood?: string | null;
  city?: string | null;
  state?: string | null;
  zip_code?: string | null;
}

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

interface OrderData {
  id: string;
  created_at: string;
  status: string;
  total_amount: number;
  shipping_address?: string | null;
  tracking_code?: string | null;
  notes?: string | null;
  profile: ClientProfile | null;
  items: OrderItem[];
}

const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

const OrderFullPrintSheet = forwardRef<HTMLDivElement, { order: OrderData }>(({ order }, ref) => {
  const profile = order.profile;
  const totalItems = order.items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div ref={ref} style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", background: "#fff", padding: "24px", maxWidth: "210mm", margin: "0 auto" }}>
      {/* Header: Logo + Order info */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "8px", marginBottom: "0" }}>
        <img src={logo} alt="Gründemann" style={{ height: "50px" }} />
        <div style={{ textAlign: "right" }}>
          <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold" }}>PEDIDO #{order.id.slice(0, 8).toUpperCase()}</h1>
          <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#666" }}>
            {new Date(order.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}
          </p>
          <p style={{ margin: "2px 0 0", fontSize: "11px" }}>
            Status: <strong>{statusLabel[order.status] || order.status}</strong>
          </p>
        </div>
      </div>

      {/* Grundemann data - horizontal below logo */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", fontSize: "10px", color: "#555", paddingBottom: "10px", marginBottom: "0" }}>
        <span style={{ fontWeight: "bold" }}>GRÜNDEMANN GERADORES LTDA</span>
        <span>CNPJ: 00.000.000/0001-00</span>
        <span>Rua Luiz Bernardo da Silva, 190 — Pinheiro</span>
        <span>São Leopoldo — RS — CEP 93042-110</span>
        <span>Tel: (51) 98182-5748</span>
      </div>

      {/* Black divider */}
      <div style={{ borderBottom: "3px solid #1a1a1a", marginBottom: "12px" }} />

      {/* Client data - horizontal below divider */}
      <div style={{ marginBottom: "16px", fontSize: "11px" }}>
        <h2 style={{ margin: "0 0 6px", fontSize: "10px", fontWeight: "bold", textTransform: "uppercase", color: "#888" }}>CLIENTE</h2>
        {profile ? (
          <div style={{ display: "flex", flexWrap: "wrap", gap: "4px 16px", lineHeight: "1.6" }}>
            <span style={{ fontWeight: "bold", fontSize: "12px" }}>{profile.full_name}</span>
            {profile.company_name && <span>{profile.company_name}</span>}
            {profile.cpf_cnpj && <span>CPF/CNPJ: {profile.cpf_cnpj}</span>}
            <span>Email: {profile.email}</span>
            <span>Tel: {profile.phone || "—"}</span>
            {profile.address && (
              <span>
                {[profile.address, profile.address_number, profile.address_complement].filter(Boolean).join(", ")}
                {profile.neighborhood && ` — ${profile.neighborhood}`}
              </span>
            )}
            <span>
              {[profile.city, profile.state].filter(Boolean).join(" — ")} {profile.zip_code ? `— CEP: ${profile.zip_code}` : ""}
            </span>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#888" }}>Dados não disponíveis</p>
        )}
      </div>

      {/* Shipping / Tracking */}
      {(order.shipping_address || order.tracking_code) && (
        <div style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "10px", marginBottom: "16px", fontSize: "11px" }}>
          {order.shipping_address && <p style={{ margin: 0 }}><strong>Endereço de Envio:</strong> {order.shipping_address}</p>}
          {order.tracking_code && <p style={{ margin: "4px 0 0" }}><strong>Código de Rastreio:</strong> {order.tracking_code}</p>}
        </div>
      )}

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px", marginBottom: "16px" }}>
        <thead>
          <tr style={{ background: "#f5f5f5" }}>
            <th style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "left" }}>#</th>
            <th style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "left" }}>Produto</th>
            <th style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "center" }}>Qtd</th>
            <th style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right" }}>Preço Unit.</th>
            <th style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right" }}>Subtotal</th>
          </tr>
        </thead>
        <tbody>
          {order.items.map((item, idx) => (
            <tr key={item.id}>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px" }}>{idx + 1}</td>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px" }}>{item.product_name}</td>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "center" }}>{item.quantity}</td>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right" }}>R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td>
              <td style={{ border: "1px solid #ddd", padding: "5px 8px", textAlign: "right", fontWeight: "bold" }}>R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr>
            <td colSpan={2} style={{ border: "1px solid #ddd", padding: "6px 8px", fontWeight: "bold" }}>Total de Itens: {totalItems}</td>
            <td colSpan={2} style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontSize: "13px" }}>TOTAL:</td>
            <td style={{ border: "1px solid #ddd", padding: "6px 8px", textAlign: "right", fontWeight: "bold", fontSize: "14px" }}>R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}</td>
          </tr>
        </tfoot>
      </table>

      {/* Notes */}
      {order.notes && (
        <div style={{ border: "1px solid #ddd", borderRadius: "4px", padding: "10px", marginBottom: "16px", fontSize: "11px" }}>
          <strong>Observações:</strong> {order.notes}
        </div>
      )}

      {/* Footer */}
      <div style={{ borderTop: "1px solid #ddd", paddingTop: "8px", fontSize: "9px", color: "#999", textAlign: "center" }}>
        Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Gründemann Geradores
      </div>
    </div>
  );
});

OrderFullPrintSheet.displayName = "OrderFullPrintSheet";

export default OrderFullPrintSheet;
