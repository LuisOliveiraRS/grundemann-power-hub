import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart, Trash2, Search, ChevronDown, ChevronUp, X,
  Filter, Printer, Truck, Users, CheckSquare, Square, FileText,
} from "lucide-react";
import OrderPrintSheet from "@/components/OrderPrintSheet";
import OrderFullPrintSheet from "@/components/OrderFullPrintSheet";
import type { OrderWithItems, OrderItem, ProfileFull } from "@/types/admin";
import { statusLabel, statusColor } from "@/types/admin";

interface AdminOrdersTabProps {
  orders: OrderWithItems[];
  onReload: () => void;
}

const AdminOrdersTab = ({ orders, onReload }: AdminOrdersTabProps) => {
  const { toast } = useToast();
  const printRef = useRef<HTMLDivElement>(null);
  const fullPrintRef = useRef<HTMLDivElement>(null);
  const [printingOrder, setPrintingOrder] = useState<OrderWithItems | null>(null);
  const [fullPrintOrder, setFullPrintOrder] = useState<OrderWithItems | null>(null);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [localOrders, setLocalOrders] = useState<OrderWithItems[]>(orders);

  // Sync with parent
  React.useEffect(() => { setLocalOrders(orders); }, [orders]);

  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  const filteredOrders = localOrders.filter(o => {
    if (orderSearch && !o.id.toLowerCase().includes(orderSearch.toLowerCase())) return false;
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.created_at) > new Date(orderDateTo + "T23:59:59")) return false;
    return true;
  });

  const loadOrderItems = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    const order = localOrders.find(o => o.id === orderId);
    let profile: ProfileFull | null = null;
    if (order) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", order.user_id).single();
      if (prof) profile = prof as ProfileFull;
    }
    setLocalOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: (data || []) as OrderItem[], ...(profile ? { profile } : {}) } : o));
    setExpandedOrder(orderId);
  };

  const doPrint = (ref: React.RefObject<HTMLDivElement | null>, title: string) => {
    setTimeout(() => {
      const printContent = ref.current;
      if (!printContent) return;
      const win = window.open("", "_blank");
      if (!win) { toast({ title: "Erro", description: "Permita pop-ups para imprimir.", variant: "destructive" }); return; }
      win.document.write(`<!DOCTYPE html><html><head><title>${title}</title><style>@media print { body { margin: 0; } } body { margin: 0; padding: 0; }</style></head><body>${printContent.innerHTML}</body></html>`);
      win.document.close(); win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }, 200);
  };

  const prepareOrderData = async (order: OrderWithItems) => {
    let o = { ...order };
    if (!o.items) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      o.items = (data || []) as OrderItem[];
    }
    if (!o.profile) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", order.user_id).single();
      if (prof) o.profile = prof as ProfileFull;
    }
    return o;
  };

  const printShippingLabel = async (order: OrderWithItems) => {
    const o = await prepareOrderData(order);
    setPrintingOrder(o);
    doPrint(printRef, `Envio #${order.id.slice(0, 8)}`);
  };

  const printFullOrder = async (order: OrderWithItems) => {
    const o = await prepareOrderData(order);
    setFullPrintOrder(o);
    doPrint(fullPrintRef, `Pedido #${order.id.slice(0, 8)}`);
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    await supabase.from("order_status_history").insert({ order_id: id, status: status as any });
    toast({ title: `Status atualizado para ${statusLabel[status]}` }); onReload();
  };

  const updateTrackingCode = async (id: string, code: string) => {
    const order = localOrders.find(o => o.id === id);
    const updates: any = { tracking_code: code };
    if (code && order && !["shipped", "delivered"].includes(order.status)) updates.status = "shipped";
    await supabase.from("orders").update(updates).eq("id", id);
    if (code && order && !["shipped", "delivered"].includes(order.status)) {
      await supabase.from("order_status_history").insert({ order_id: id, status: "shipped" as any, notes: `Código de rastreio adicionado: ${code}` });
    }
    if (code && order) {
      await supabase.from("notifications").insert({ user_id: order.user_id, title: "Pedido enviado! 🚚", message: `Seu pedido #${id.substring(0, 8)} foi enviado! Rastreie: ${code}`, type: "order", link: "/minha-conta" });
    }
    toast({ title: "Código de rastreio atualizado!" });
    setLocalOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_code: code, ...(code && !["shipped", "delivered"].includes(o.status) ? { status: "shipped" } : {}) } : o));
  };

  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir este pedido e todos os seus itens?")) return;
    // Release stock reservations before deleting
    await supabase.rpc("release_stock_reservation", { p_order_id: id });
    await supabase.from("payments").delete().eq("order_id", id);
    await supabase.from("stock_reservations").delete().eq("order_id", id);
    await supabase.from("order_status_history").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    await supabase.from("orders").delete().eq("id", id);
    toast({ title: "Pedido excluído!" }); onReload();
  };

  const bulkDeleteOrders = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`Excluir ${selectedOrders.size} pedidos selecionados?`)) return;
    for (const id of Array.from(selectedOrders)) {
      await supabase.rpc("release_stock_reservation", { p_order_id: id });
      await supabase.from("payments").delete().eq("order_id", id);
      await supabase.from("stock_reservations").delete().eq("order_id", id);
      await supabase.from("order_status_history").delete().eq("order_id", id);
      await supabase.from("order_items").delete().eq("order_id", id);
      await supabase.from("orders").delete().eq("id", id);
    }
    toast({ title: `${selectedOrders.size} pedidos excluídos!` });
    setSelectedOrders(new Set()); onReload();
  };

  const toggleOrderSelect = (id: string) => {
    setSelectedOrders(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) setSelectedOrders(new Set());
    else setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
  };

  return (
    <div>
      {/* Hidden print areas */}
      <div className="hidden">
        <div ref={printRef}>
          {printingOrder && <OrderPrintSheet order={{ id: printingOrder.id, created_at: printingOrder.created_at, profile: printingOrder.profile || null }} />}
        </div>
        <div ref={fullPrintRef}>
          {fullPrintOrder && <OrderFullPrintSheet order={{ id: fullPrintOrder.id, created_at: fullPrintOrder.created_at, status: fullPrintOrder.status, total_amount: Number(fullPrintOrder.total_amount), shipping_address: fullPrintOrder.shipping_address, tracking_code: fullPrintOrder.tracking_code, notes: fullPrintOrder.notes, profile: fullPrintOrder.profile || null, items: fullPrintOrder.items || [] }} />}
        </div>
      </div>

      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Pedidos</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredOrders.length} de {localOrders.length} pedidos</p>
        </div>
        <div className="flex gap-2">
          {selectedOrders.size > 0 && (
            <>
              <Badge className="bg-primary/10 text-primary border-primary/20 self-center">{selectedOrders.size} selecionados</Badge>
              <Button variant="destructive" size="sm" onClick={bulkDeleteOrders}><Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionados</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedOrders(new Set())}><X className="h-4 w-4" /></Button>
            </>
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground"><Filter className="h-4 w-4" /> Filtros</div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[180px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por ID..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} /></div>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
          <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground whitespace-nowrap">De:</span><Input type="date" className="h-10 w-auto" value={orderDateFrom} onChange={(e) => setOrderDateFrom(e.target.value)} /></div>
          <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground whitespace-nowrap">Até:</span><Input type="date" className="h-10 w-auto" value={orderDateTo} onChange={(e) => setOrderDateTo(e.target.value)} /></div>
          {(orderSearch || orderStatusFilter || orderDateFrom || orderDateTo) && (
            <Button variant="ghost" size="sm" onClick={() => { setOrderSearch(""); setOrderStatusFilter(""); setOrderDateFrom(""); setOrderDateTo(""); }}><X className="h-4 w-4 mr-1" /> Limpar</Button>
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mb-3">
        <button onClick={toggleAllOrders} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
          {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />} Selecionar todos
        </button>
      </div>

      <div className="space-y-3">
        {filteredOrders.map((o) => (
          <div key={o.id} className={`bg-card rounded-xl shadow-sm border overflow-hidden ${selectedOrders.has(o.id) ? "border-primary" : "border-border"}`}>
            <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadOrderItems(o.id)}>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { e.stopPropagation(); toggleOrderSelect(o.id); }}>{selectedOrders.has(o.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}</button>
                <div className="bg-muted rounded-lg p-2.5"><ShoppingCart className="h-5 w-5 text-muted-foreground" /></div>
                <div>
                  <p className="font-heading font-bold">Pedido #{o.id.slice(0, 8)}</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); printOrder(o); }}><Printer className="h-3.5 w-3.5" /> Imprimir</Button>
                {o.payment ? (
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${o.payment.status === "approved" ? "bg-primary/15 text-primary" : o.payment.status === "pending" ? "bg-accent/30 text-accent-foreground" : o.payment.status === "rejected" ? "bg-destructive/15 text-destructive" : "bg-muted text-muted-foreground"}`}>
                    {o.payment.status === "approved" ? "💳 Pago" : o.payment.status === "pending" ? "⏳ Aguardando Pgto" : o.payment.status === "rejected" ? "❌ Recusado" : `💳 ${o.payment.status}`}
                    {o.payment.payment_method && ` (${o.payment.payment_method})`}
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">💳 Sem pagamento</span>
                )}
                <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status] || o.status}</span>
                <p className="font-heading font-bold text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                <select value={o.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="border border-input rounded-md px-2 py-1.5 text-xs bg-background">
                  {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }}><Trash2 className="h-4 w-4" /></Button>
                {expandedOrder === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </div>
            </div>
            {expandedOrder === o.id && (
              <div className="border-t border-border p-5 bg-muted/20">
                {o.profile && (
                  <div className="mb-4 p-4 bg-background rounded-lg border border-border">
                    <h4 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Dados do Cliente</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                      <div><span className="text-muted-foreground">Nome:</span> <strong>{o.profile.full_name || "—"}</strong></div>
                      <div><span className="text-muted-foreground">Email:</span> {o.profile.email}</div>
                      <div><span className="text-muted-foreground">Telefone:</span> {o.profile.phone || "—"}</div>
                      <div><span className="text-muted-foreground">CPF/CNPJ:</span> {o.profile.cpf_cnpj || "—"}</div>
                      <div><span className="text-muted-foreground">Empresa:</span> {o.profile.company_name || "—"}</div>
                      <div><span className="text-muted-foreground">Cidade/UF:</span> {[o.profile.city, o.profile.state].filter(Boolean).join("/") || "—"}</div>
                    </div>
                  </div>
                )}
                {o.shipping_address && <p className="text-sm mb-3"><span className="text-muted-foreground">Endereço:</span> {o.shipping_address}</p>}
                <div className="mb-4 p-3 bg-background rounded-lg border border-border flex items-center gap-3">
                  <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                  <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Rastreio:</span>
                  <Input className="h-8 text-sm flex-1" placeholder="Código de rastreamento..." defaultValue={o.tracking_code || ""} onBlur={(e) => { if (e.target.value !== (o.tracking_code || "")) updateTrackingCode(o.id, e.target.value); }} onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }} />
                </div>
                <table className="w-full text-sm">
                  <thead><tr className="text-muted-foreground text-xs uppercase tracking-wider"><th className="text-left pb-2">Item</th><th className="text-center pb-2">Qtd</th><th className="text-right pb-2">Preço Unit.</th><th className="text-right pb-2">Subtotal</th></tr></thead>
                  <tbody className="divide-y divide-border">
                    {(o.items || []).map(item => (
                      <tr key={item.id}>
                        <td className="py-2.5">{item.product_name}</td>
                        <td className="py-2.5 text-center">{item.quantity}</td>
                        <td className="py-2.5 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td>
                        <td className="py-2.5 text-right font-bold text-price">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot><tr className="border-t-2 border-border"><td colSpan={3} className="pt-3 text-right font-heading font-bold">Total:</td><td className="pt-3 text-right font-heading font-bold text-price text-lg">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</td></tr></tfoot>
                </table>
              </div>
            )}
          </div>
        ))}
        {filteredOrders.length === 0 && <div className="bg-card rounded-xl border border-border p-12 text-center"><ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nenhum pedido encontrado.</p></div>}
      </div>
    </div>
  );
};

export default AdminOrdersTab;
