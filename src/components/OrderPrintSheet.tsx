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

interface OrderData {
  id: string;
  created_at: string;
  profile: ClientProfile | null;
}

const OrderPrintSheet = forwardRef<HTMLDivElement, { order: OrderData }>(({ order }, ref) => {
  const profile = order.profile;

  return (
    <div ref={ref} className="print-sheet" style={{ fontFamily: "Arial, sans-serif", fontSize: "12px", color: "#000", background: "#fff", padding: "24px", maxWidth: "210mm", margin: "0 auto" }}>
      {/* Title */}
      <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "3px solid #1a1a1a", paddingBottom: "12px" }}>
        <h1 style={{ margin: 0, fontSize: "16px", fontWeight: "bold", textTransform: "uppercase", letterSpacing: "2px" }}>
          Etiqueta de Envio
        </h1>
        <p style={{ margin: "4px 0 0", fontSize: "10px", color: "#666" }}>
          Pedido #{order.id.slice(0, 8).toUpperCase()} — {new Date(order.created_at).toLocaleDateString("pt-BR")}
        </p>
      </div>

      {/* Sender - Grundemann */}
      <div style={{ border: "1px solid #ccc", borderRadius: "4px", padding: "14px", marginBottom: "16px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#666", borderBottom: "1px solid #eee", paddingBottom: "4px" }}>
          REMETENTE
        </h2>
        <div style={{ display: "flex", alignItems: "flex-start", gap: "12px" }}>
          <img src={logo} alt="Gründemann" style={{ height: "40px" }} />
          <div style={{ fontSize: "11px", lineHeight: "1.7" }}>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px" }}>GRÜNDEMANN GERADORES LTDA</p>
            <p style={{ margin: 0 }}>CNPJ: 00.000.000/0001-00</p>
            <p style={{ margin: 0 }}>Rua Luiz Bernardo da Silva, 190 — Pinheiro</p>
            <p style={{ margin: 0 }}>São Leopoldo — RS — CEP 93042-110</p>
            <p style={{ margin: 0 }}>Tel: (51) 98182-5748 | adair.grundemann@gmail.com</p>
          </div>
        </div>
      </div>

      {/* Separator arrow */}
      <div style={{ textAlign: "center", fontSize: "20px", margin: "8px 0", color: "#333" }}>▼</div>

      {/* Recipient - Client */}
      <div style={{ border: "2px solid #000", borderRadius: "4px", padding: "16px" }}>
        <h2 style={{ margin: "0 0 8px", fontSize: "11px", fontWeight: "bold", textTransform: "uppercase", color: "#666", borderBottom: "1px solid #ddd", paddingBottom: "4px" }}>
          DESTINATÁRIO
        </h2>
        {profile ? (
          <div style={{ fontSize: "12px", lineHeight: "1.8" }}>
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "15px" }}>{profile.full_name}</p>
            {profile.company_name && <p style={{ margin: 0 }}>{profile.company_name}</p>}
            {profile.cpf_cnpj && <p style={{ margin: 0 }}>CPF/CNPJ: {profile.cpf_cnpj}</p>}
            <p style={{ margin: "6px 0 0" }}>
              {[profile.address, profile.address_number, profile.address_complement].filter(Boolean).join(", ") || "Endereço não informado"}
            </p>
            {profile.neighborhood && <p style={{ margin: 0 }}>Bairro: {profile.neighborhood}</p>}
            <p style={{ margin: 0, fontWeight: "bold", fontSize: "13px" }}>
              {[profile.city, profile.state].filter(Boolean).join(" — ")} {profile.zip_code ? `— CEP: ${profile.zip_code}` : ""}
            </p>
            <p style={{ margin: "4px 0 0" }}>Tel: {profile.phone || "—"}</p>
            <p style={{ margin: 0 }}>E-mail: {profile.email || "—"}</p>
          </div>
        ) : (
          <p style={{ margin: 0, color: "#888", fontSize: "12px" }}>Dados do destinatário não disponíveis.</p>
        )}
      </div>

      {/* Footer */}
      <div style={{ marginTop: "20px", borderTop: "1px solid #ddd", paddingTop: "8px", fontSize: "9px", color: "#999", textAlign: "center" }}>
        Documento gerado em {new Date().toLocaleDateString("pt-BR")} às {new Date().toLocaleTimeString("pt-BR")} — Gründemann Geradores
      </div>
    </div>
  );
});

OrderPrintSheet.displayName = "OrderPrintSheet";

export default OrderPrintSheet;
