import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Edit, Search, ChevronDown, ChevronUp, X, Users, ShoppingCart, UserCog,
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { normalizeWhatsAppPhone } from "@/lib/whatsappUtils";
import type { ProfileFull, OrderWithItems, OrderItem } from "@/types/admin";
import { statusLabel, statusColor, roleTypeLabel, roleTypeColor } from "@/types/admin";

interface AdminClientsTabProps {
  clients: ProfileFull[];
  orders: OrderWithItems[];
  clientRoles: { user_id: string; role: string }[];
  clientMechanics: { user_id: string; partner_type: string }[];
  onReload: () => void;
}

const AdminClientsTab = ({ clients, orders, clientRoles, clientMechanics, onReload }: AdminClientsTabProps) => {
  const { toast } = useToast();
  const [clientSearch, setClientSearch] = useState("");
  const [clientRoleFilter, setClientRoleFilter] = useState("");
  const [editingClient, setEditingClient] = useState<Partial<ProfileFull> | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [editingRolesFor, setEditingRolesFor] = useState<string | null>(null);
  const [clientOrderItems, setClientOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [clientForm, setClientForm] = useState({
    full_name: "", email: "", phone: "", cpf_cnpj: "", company_name: "",
    address: "", address_number: "", address_complement: "", neighborhood: "",
    city: "", state: "", zip_code: "", notes: ""
  });

  const resetClientForm = () => setClientForm({ full_name: "", email: "", phone: "", cpf_cnpj: "", company_name: "", address: "", address_number: "", address_complement: "", neighborhood: "", city: "", state: "", zip_code: "", notes: "" });

  // All users are "cliente" by default; they can also have additional roles
  const getUserRoles = (userId: string): string[] => {
    const roles: string[] = ["cliente"]; // everyone is a client
    const userRoles = clientRoles.filter(r => r.user_id === userId);
    if (userRoles.some(r => r.role === "admin")) roles.push("admin");
    if (userRoles.some(r => r.role === "seller")) roles.push("seller");
    const mech = clientMechanics.find(m => m.user_id === userId);
    if (mech) roles.push(mech.partner_type || "mecanico");
    return [...new Set(roles)];
  };

  const getUserPrimaryRole = (userId: string): string => {
    const roles = getUserRoles(userId);
    // Return the "highest" role for badge display
    if (roles.includes("admin")) return "admin";
    if (roles.includes("seller")) return "seller";
    if (roles.includes("revendedor")) return "revendedor";
    if (roles.includes("oficina")) return "oficina";
    if (roles.includes("mecanico")) return "mecanico";
    return "cliente";
  };

  const filteredClients = clients.filter(c => {
    const roles = getUserRoles(c.user_id);
    if (clientRoleFilter && !roles.includes(clientRoleFilter)) return false;
    if (!clientSearch) return true;
    const s = clientSearch.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || (c.phone || "").toLowerCase().includes(s) || (c.cpf_cnpj || "").toLowerCase().includes(s);
  });

  const editClient = (c: ProfileFull) => {
    setEditingClient(c);
    setClientForm({
      full_name: c.full_name || "", email: c.email || "", phone: c.phone || "",
      cpf_cnpj: c.cpf_cnpj || "", company_name: c.company_name || "",
      address: c.address || "", address_number: c.address_number || "",
      address_complement: c.address_complement || "", neighborhood: c.neighborhood || "",
      city: c.city || "", state: c.state || "", zip_code: c.zip_code || "", notes: c.notes || ""
    });
  };

  const saveClient = async () => {
    const data: any = {
      full_name: clientForm.full_name, email: clientForm.email, phone: clientForm.phone || null,
      cpf_cnpj: clientForm.cpf_cnpj || null, company_name: clientForm.company_name || null,
      address: clientForm.address || null, address_number: clientForm.address_number || null,
      address_complement: clientForm.address_complement || null, neighborhood: clientForm.neighborhood || null,
      city: clientForm.city || null, state: clientForm.state || null, zip_code: clientForm.zip_code || null, notes: clientForm.notes || null,
    };
    if (editingClient?.user_id) {
      const { error } = await supabase.from("profiles").update(data).eq("user_id", editingClient.user_id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cliente atualizado!" });
    } else {
      const newData = { ...data, user_id: crypto.randomUUID() };
      const { error } = await supabase.from("profiles").insert(newData);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cliente cadastrado!" });
    }
    setEditingClient(null); resetClientForm(); onReload();
  };

  const deleteClient = async (userId: string) => {
    if (!confirm("Excluir este cliente?")) return;
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast({ title: "Cliente excluído!" }); onReload();
  };

  const toggleClientExpand = async (userId: string) => {
    if (expandedClientId === userId) { setExpandedClientId(null); return; }
    setExpandedClientId(userId);
    const clientOrdIds = orders.filter(o => o.user_id === userId).map(o => o.id);
    if (clientOrdIds.length > 0) {
      const { data } = await supabase.from("order_items").select("*").in("order_id", clientOrdIds);
      if (data) {
        const grouped: Record<string, OrderItem[]> = {};
        clientOrdIds.forEach(oid => { grouped[oid] = (data as OrderItem[]).filter(i => (i as any).order_id === oid); });
        setClientOrderItems(prev => ({ ...prev, ...grouped }));
      }
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Clientes</h1>
          <p className="text-muted-foreground text-sm mt-1">{filteredClients.length} de {clients.length} clientes</p>
        </div>
        <div className="flex gap-3">
          <a href={`https://wa.me/?text=${encodeURIComponent("Olá! Promoção especial da Gründemann Geradores! Confira nossos produtos: https://grundemann.com.br/produtos")}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold transition-colors shadow-md">
            <WhatsAppIcon className="h-4 w-4" /> Enviar Mensagem a Todos
          </a>
          <Button onClick={() => { setEditingClient({}); resetClientForm(); }} className="shadow-md"><Plus className="h-4 w-4 mr-2" /> Novo Cliente</Button>
        </div>
      </div>

      {editingClient !== null && (
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="font-heading text-xl font-bold">{editingClient?.user_id ? "Editar" : "Novo"} Cliente</h3>
            <button onClick={() => setEditingClient(null)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nome Completo *</Label><Input value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} /></div>
            <div><Label>E-mail *</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></div>
            <div><Label>Telefone</Label><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div><Label>CPF / CNPJ</Label><Input value={clientForm.cpf_cnpj} onChange={(e) => setClientForm({ ...clientForm, cpf_cnpj: e.target.value })} /></div>
            <div><Label>Razão Social / Empresa</Label><Input value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} /></div>
            <div><Label>CEP</Label><Input value={clientForm.zip_code} onChange={(e) => setClientForm({ ...clientForm, zip_code: e.target.value })} /></div>
            <div className="md:col-span-2"><Label>Endereço (Rua)</Label><Input value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></div>
            <div><Label>Número</Label><Input value={clientForm.address_number} onChange={(e) => setClientForm({ ...clientForm, address_number: e.target.value })} /></div>
            <div><Label>Complemento</Label><Input value={clientForm.address_complement} onChange={(e) => setClientForm({ ...clientForm, address_complement: e.target.value })} /></div>
            <div><Label>Bairro</Label><Input value={clientForm.neighborhood} onChange={(e) => setClientForm({ ...clientForm, neighborhood: e.target.value })} /></div>
            <div><Label>Cidade</Label><Input value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} /></div>
            <div>
              <Label>Estado</Label>
              <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={clientForm.state} onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })}>
                <option value="">Selecione</option>
                {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => <option key={uf} value={uf}>{uf}</option>)}
              </select>
            </div>
            <div className="md:col-span-3"><Label>Observações</Label><Textarea rows={2} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></div>
          </div>
          <div className="flex gap-3 mt-6 pt-5 border-t border-border">
            <Button onClick={saveClient} className="shadow-md">{editingClient?.user_id ? "Atualizar" : "Cadastrar"} Cliente</Button>
            <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-card rounded-xl border border-border p-4 mb-4">
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground"><Search className="h-4 w-4" /> Busca e Filtros</div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[250px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} /></div>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[160px]" value={clientRoleFilter} onChange={(e) => setClientRoleFilter(e.target.value)}>
            <option value="">Todos os tipos</option>
            <option value="admin">Administradores</option><option value="seller">Vendedores</option>
            <option value="revendedor">Revendedores</option><option value="oficina">Oficinas</option>
            <option value="mecanico">Mecânicos</option><option value="cliente">Clientes</option>
          </select>
          {(clientSearch || clientRoleFilter) && <Button variant="ghost" size="sm" onClick={() => { setClientSearch(""); setClientRoleFilter(""); }}><X className="h-4 w-4 mr-1" /> Limpar</Button>}
        </div>
      </div>

      {/* Role stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
        {["admin", "seller", "revendedor", "oficina", "mecanico", "cliente"].map(role => {
          const count = clients.filter(c => getUserRoles(c.user_id).includes(role)).length;
          return (
            <button key={role} onClick={() => setClientRoleFilter(clientRoleFilter === role ? "" : role)} className={`bg-card rounded-xl border p-3 text-center transition-all hover:shadow-md ${clientRoleFilter === role ? "border-primary shadow-md" : "border-border"}`}>
              <Badge className={`${roleTypeColor[role]} text-[10px] mb-1`}>{roleTypeLabel[role]}</Badge>
              <p className="font-heading font-bold text-lg">{count}</p>
            </button>
          );
        })}
      </div>

      {/* Client table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tipo</th>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Telefone</th>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Compras</th>
                <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cidade/UF</th>
                <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filteredClients.map(c => {
                const clientOrders = orders.filter(o => o.user_id === c.user_id);
                const clientTotal = clientOrders.reduce((s, o) => s + Number(o.total_amount), 0);
                const phoneClean = normalizeWhatsAppPhone(c.phone);
                const hasPhone = phoneClean.length >= 12;
                const isExpanded = expandedClientId === c.user_id;
                const userRoles = getUserRoles(c.user_id);
                const roleType = getUserPrimaryRole(c.user_id);
                return (
                  <React.Fragment key={c.user_id}>
                    <tr className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => toggleClientExpand(c.user_id)}>
                      <td className="p-3.5">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center"><Users className="h-4 w-4 text-primary" /></div>
                          <div>
                            <span className="font-medium block">{c.full_name || "—"}</span>
                            {c.company_name && <span className="text-[10px] text-muted-foreground">{c.company_name}</span>}
                            {c.cpf_cnpj && <span className="text-[10px] text-muted-foreground block font-mono">{c.cpf_cnpj}</span>}
                          </div>
                        </div>
                      </td>
                      <td className="p-3.5">
                        <div className="flex flex-wrap gap-1">
                          {userRoles.map(r => (
                            <Badge key={r} className={`${roleTypeColor[r] || ""} text-[10px] border-0`}>{roleTypeLabel[r] || r}</Badge>
                          ))}
                          <button onClick={(e) => { e.stopPropagation(); setEditingRolesFor(editingRolesFor === c.user_id ? null : c.user_id); }} className="inline-flex items-center justify-center h-5 w-5 rounded-full bg-muted hover:bg-primary/20 transition-colors" title="Editar categorias">
                            <UserCog className="h-3 w-3 text-muted-foreground" />
                          </button>
                        </div>
                        {editingRolesFor === c.user_id && (
                          <RoleEditor userId={c.user_id} currentRoles={clientRoles} currentMechanics={clientMechanics} onSave={() => { setEditingRolesFor(null); onReload(); }} />
                        )}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{c.email}</td>
                      <td className="p-3.5">
                        {c.phone ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-muted-foreground text-xs">{c.phone}</span>
                            {hasPhone && <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#25D366] text-white hover:bg-[#1da851] transition-colors" onClick={e => e.stopPropagation()}><WhatsAppIcon className="h-3 w-3" /></a>}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">—</span>}
                      </td>
                      <td className="p-3.5">
                        {clientOrders.length > 0 ? (
                          <div className="flex items-center gap-2">
                            <div>
                              <Badge variant="secondary" className="text-[10px]">{clientOrders.length} pedido{clientOrders.length > 1 ? "s" : ""}</Badge>
                              <p className="text-[10px] font-bold text-primary mt-0.5">R$ {clientTotal.toFixed(2).replace(".", ",")}</p>
                            </div>
                            {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                          </div>
                        ) : <span className="text-muted-foreground text-xs">Sem compras</span>}
                      </td>
                      <td className="p-3.5 text-muted-foreground text-xs">{[c.city, c.state].filter(Boolean).join("/") || "—"}</td>
                      <td className="p-3.5">
                        <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                          {hasPhone && (
                            <a href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Olá ${c.full_name || ""}! Aqui é da Gründemann Geradores.`)}`} target="_blank" rel="noopener noreferrer">
                              <Button variant="ghost" size="icon" className="h-8 w-8 text-[#25D366]"><WhatsAppIcon className="h-4 w-4" /></Button>
                            </a>
                          )}
                          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editClient(c)}><Edit className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteClient(c.user_id)}><Trash2 className="h-4 w-4" /></Button>
                        </div>
                      </td>
                    </tr>
                    {isExpanded && clientOrders.length > 0 && (
                      <tr>
                        <td colSpan={7} className="p-0">
                          <div className="bg-muted/30 border-t border-b border-border px-6 py-4">
                            <h4 className="font-heading font-bold text-sm mb-3 flex items-center gap-2"><ShoppingCart className="h-4 w-4 text-primary" /> Histórico de Compras</h4>
                            <div className="space-y-3">
                              {clientOrders.map(o => (
                                <div key={o.id} className="bg-card rounded-lg border border-border p-3">
                                  <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-3">
                                      <span className="font-mono text-xs font-bold text-foreground">#{o.id.slice(0, 8)}</span>
                                      <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status] || o.status}</span>
                                      <span className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                                    </div>
                                    <span className="font-bold text-sm text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</span>
                                  </div>
                                  {clientOrderItems[o.id] && clientOrderItems[o.id].length > 0 && (
                                    <div className="mt-2 border-t border-border pt-2 space-y-1">
                                      {clientOrderItems[o.id].map(item => (
                                        <div key={item.id} className="flex items-center justify-between text-xs">
                                          <span className="text-foreground">{item.quantity}x {item.product_name}</span>
                                          <span className="text-muted-foreground font-medium">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                );
              })}
              {filteredClients.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

// Inline role editor component
const RoleEditor = ({ userId, currentRoles, currentMechanics, onSave }: {
  userId: string;
  currentRoles: { user_id: string; role: string }[];
  currentMechanics: { user_id: string; partner_type: string }[];
  onSave: () => void;
}) => {
  const { toast } = useToast();
  const userRoles = currentRoles.filter(r => r.user_id === userId);
  const userMech = currentMechanics.find(m => m.user_id === userId);

  const hasRole = (role: string) => userRoles.some(r => r.role === role);
  const hasPartnerType = (type: string) => userMech?.partner_type === type;

  const toggleSystemRole = async (role: "admin" | "seller") => {
    if (hasRole(role)) {
      await supabase.from("user_roles").delete().eq("user_id", userId).eq("role", role);
      toast({ title: `Role "${roleTypeLabel[role]}" removida` });
    } else {
      await supabase.from("user_roles").insert({ user_id: userId, role });
      toast({ title: `Role "${roleTypeLabel[role]}" adicionada` });
    }
    onSave();
  };

  const togglePartnerType = async (type: string) => {
    if (userMech) {
      if (hasPartnerType(type)) {
        // Remove mechanic record
        await supabase.from("mechanics").delete().eq("user_id", userId);
        toast({ title: `Parceria "${roleTypeLabel[type]}" removida` });
      } else {
        // Update partner type
        await supabase.from("mechanics").update({ partner_type: type }).eq("user_id", userId);
        toast({ title: `Tipo alterado para "${roleTypeLabel[type]}"` });
      }
    } else {
      // Create mechanic record
      await supabase.from("mechanics").insert({ user_id: userId, partner_type: type });
      toast({ title: `Parceria "${roleTypeLabel[type]}" adicionada` });
    }
    onSave();
  };

  return (
    <div className="mt-2 p-3 bg-muted/50 rounded-lg border border-border space-y-2" onClick={e => e.stopPropagation()}>
      <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Editar Categorias do Usuário</p>
      <div className="flex flex-wrap gap-2">
        <Badge className="bg-muted text-muted-foreground text-[10px] border-0 cursor-default">Cliente ✓</Badge>
        {(["admin", "seller"] as const).map(role => (
          <button key={role} onClick={() => toggleSystemRole(role)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all ${hasRole(role) ? `${roleTypeColor[role]} border-transparent` : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
          >
            {roleTypeLabel[role]} {hasRole(role) ? "✓" : "+"}
          </button>
        ))}
        {(["mecanico", "revendedor", "oficina"] as const).map(type => (
          <button key={type} onClick={() => togglePartnerType(type)}
            className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border transition-all ${hasPartnerType(type) ? `${roleTypeColor[type]} border-transparent` : "bg-background text-muted-foreground border-border hover:border-primary/50"}`}
          >
            {roleTypeLabel[type]} {hasPartnerType(type) ? "✓" : "+"}
          </button>
        ))}
      </div>
    </div>
  );
};

export default AdminClientsTab;
