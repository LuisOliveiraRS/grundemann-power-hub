import { forwardRef } from "react";
import logo from "@/assets/logo-grundemann.png";

interface OrderItem {
  id: string;
  product_name: string;
  quantity: number;
  price_at_purchase: number;
}

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

interface OrderData {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  shipping_address: string | null;
  notes: string | null;
  items: OrderItem[];
  profile: ClientProfile | null;
}

const statusLabel: Record<string, string> = {
  pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
  shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
};

const OrderPrintSheet = forwardRef<HTMLDivElement, { order: OrderData }>(({ order }, ref) => {
  const profile = order.profile;

  return (
    <div ref={ref} className="print-sheet" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", background: "#fff", padding: "20px", maxWidth: "210mm", margin: "0 auto" }}>
      {/* Header */}
      <div style={{ borderBottom: "3px solid #1a1a1a", paddingBottom: "12px", marginBottom: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <img src={logo} alt="Gründemann" style={{ height: "60px", marginBottom: "8px" }} />
            <div style={{ fontSize: "10px", lineHeight: "1.6", color: "#333" }}>
              <p style={{ margin: 0, fontWeight: "bold" }}>GRÜNDEMANN GERADORES LTDA</p>
              <p style={{ margin: 0 }}>CNPJ: 00.000.000/0001-00</p>
              <p style={{ margin: 0 }}>Rua Exemplo, 123 — Cidade/UF — CEP 00000-000</p>
              <p style={{ margin: 0 }}>Tel: (00) 0000-0000 | contato@grundemann.com.br</p>
            </div>
          </div>
          <div style={{ textAlign: "right" }}>
            <h1 style={{ margin: 0, fontSize: "18px", fontWeight: "bold", textTransform: "uppercase" }}>Ficha do Pedido</h1>
            <p style={{ margin: "4px 0 0", fontSize: "11px", color: "#555" }}>
              Nº {order.id.slice(0, 8).toUpperCase()}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px", color: "#555" }}>
              Data: {new Date(order.created_at).toLocaleDateString("pt-BR")}
            </p>
            <p style={{ margin: "2px 0 0", fontSize: "11px" }}>
              Status: <strong>{statusLabel[order.status] || order.status}</strong>
            </p>
          </div>
        </div>
      </div>

      {/* Client Info */}
      <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "12px", marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 10px", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>
          Dados do Cliente
        </h2>
        {profile ? (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 16px", fontSize: "11px" }}>
            <div><strong>Nome:</strong> {profile.full_name || "—"}</div>
            <div><strong>CPF/CNPJ:</strong> {profile.cpf_cnpj || "—"}</div>
            <div><strong>E-mail:</strong> {profile.email || "—"}</div>
            <div><strong>Telefone:</strong> {profile.phone || "—"}</div>
            {profile.company_name && <div style={{ gridColumn: "1 / -1" }}><strong>Empresa:</strong> {profile.company_name}</div>}
            <div style={{ gridColumn: "1 / -1" }}>
              <strong>Endereço:</strong>{" "}
              {[profile.address, profile.address_number, profile.address_complement, profile.neighborhood].filter(Boolean).join(", ") || "—"}
            </div>
            <div><strong>Cidade/UF:</strong> {[profile.city, profile.state].filter(Boolean).join("/") || "—"}</div>
            <div><strong>CEP:</strong> {profile.zip_code || "—"}</div>
          </div>
        ) : (
          <p style={{ fontSize: "11px", color: "#888" }}>Dados do cliente não disponíveis.</p>
        )}
      </div>

      {/* Shipping Address */}
      {order.shipping_address && (
        <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "12px", marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Endereço de Entrega</h2>
          <p style={{ margin: 0, fontSize: "11px" }}>{order.shipping_address}</p>
        </div>
      )}

      {/* Items Table */}
      <div style={{ marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>Itens do Pedido</h2>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "11px" }}>
          <thead>
            <tr style={{ background: "#f0f0f0" }}>
              <th style={{ border: "1px solid #ccc", padding: "6px 8px", textAlign: "left" }}>#</th>
              <th style={{ border: "1px solid #ccc", padding: "6px 8px", textAlign: "left" }}>Produto</th>
              <th style={{ border: "1px solid #ccc", padding: "6px 8px", textAlign: "center" }}>Qtd</th>
              <th style={{ border: "1px solid #ccc", padding: "6px 8px", textAlign: "right" }}>Preço Unit.</th>
              <th style={{ border: "1px solid #ccc", padding: "6px 8px", textAlign: "right" }}>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, idx) => (
              <tr key={item.id}>
                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{idx + 1}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 8px" }}>{item.product_name}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "center" }}>{item.quantity}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right" }}>R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td>
                <td style={{ border: "1px solid #ccc", padding: "5px 8px", textAlign: "right", fontWeight: "bold" }}>
                  R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr style={{ background: "#f0f0f0" }}>
              <td colSpan={4} style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "12px" }}>TOTAL:</td>
              <td style={{ border: "1px solid #ccc", padding: "8px", textAlign: "right", fontWeight: "bold", fontSize: "14px" }}>
                R$ {Number(order.total_amount).toFixed(2).replace(".", ",")}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Notes */}
      {order.notes && (
        <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "12px", marginBottom: "16px" }}>
          <h2 style={{ margin: "0 0 6px", fontSize: "13px", fontWeight: "bold" }}>Observações</h2>
          <p style={{ margin: 0, fontSize: "11px" }}>{order.notes}</p>
        </div>
      )}

      {/* Label section */}
      <div style={{ borderTop: "2px dashed #999", marginTop: "20px", paddingTop: "16px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "13px", fontWeight: "bold", textTransform: "uppercase" }}>
          Etiqueta de Envio — Marketplace / E-commerce
        </h2>
        <div style={{ border: "2px solid #000", borderRadius: "4px", padding: "16px", fontSize: "12px", lineHeight: "1.8" }}>
          {profile ? (
            <>
              <p style={{ margin: 0, fontWeight: "bold", fontSize: "14px" }}>{profile.full_name}</p>
              {profile.company_name && <p style={{ margin: 0 }}>{profile.company_name}</p>}
              {profile.cpf_cnpj && <p style={{ margin: 0 }}>CPF/CNPJ: {profile.cpf_cnpj}</p>}
              <p style={{ margin: 0 }}>
                {[profile.address, profile.address_number, profile.address_complement, profile.neighborhood].filter(Boolean).join(", ")}
              </p>
              <p style={{ margin: 0 }}>
                {[profile.city, profile.state].filter(Boolean).join(" — ")} {profile.zip_code ? `CEP: ${profile.zip_code}` : ""}
              </p>
              <p style={{ margin: 0 }}>Tel: {profile.phone || "—"}</p>
            </>
          ) : (
            <p style={{ margin: 0, color: "#888" }}>Dados do destinatário não disponíveis</p>
          )}
          <p style={{ margin: "8px 0 0", fontSize: "10px", color: "#555" }}>
            Pedido: #{order.id.slice(0, 8).toUpperCase()} | {new Date(order.created_at).toLocaleDateString("pt-BR")}
          </p>
        </div>
      </div>

      {/* Footer */}
      <div style={{ marginTop: "24px", borderTop: "1px solid #ddd", paddingTop: "8px", fontSize: "9px", color: "#999", textAlign: "center" }}>
        Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Gründemann Geradores
      </div>
    </div>
  );
});

OrderPrintSheet.displayName = "OrderPrintSheet";

export default OrderPrintSheet;
