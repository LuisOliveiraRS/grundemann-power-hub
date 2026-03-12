import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Search, CheckCircle2, XCircle, Trash2, Loader2, Plus, UserPlus, Edit, ChevronDown, ChevronUp, Save, X } from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";

interface MechanicRow {
  id: string;
  user_id: string;
  company_name: string | null;
  cnpj: string | null;
  specialty: string | null;
  inscricao_estadual: string | null;
  discount_rate: number;
  is_approved: boolean;
  created_at: string;
  partner_type?: string;
  profile?: { full_name: string; email: string; phone: string | null; city: string | null; state: string | null; address: string | null; neighborhood: string | null; zip_code: string | null } | null;
}

const MechanicManagement = () => {
  const { toast } = useToast();
  const [mechanics, setMechanics] = useState<MechanicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState({ email: "", full_name: "", phone: "", company_name: "", cnpj: "", inscricao_estadual: "", specialty: "", discount_rate: "5" });
  const [editForm, setEditForm] = useState({ company_name: "", cnpj: "", inscricao_estadual: "", specialty: "", discount_rate: "", full_name: "", phone: "", address: "", city: "", state: "", zip_code: "", neighborhood: "" });
  const [addingMechanic, setAddingMechanic] = useState(false);
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("mechanics").select("*").order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }
    const userIds = [...new Set(data.map(m => m.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, city, state, address, neighborhood, zip_code").in("user_id", userIds);
    const enriched = data.map(m => ({
      ...m,
      profile: profiles?.find(p => p.user_id === m.user_id) || null,
    }));
    setMechanics(enriched);
    setLoading(false);
  };

  const getWhatsAppUrl = (mechanic: MechanicRow) => {
    const { buildWhatsAppUrl } = require("@/lib/whatsappUtils");
    const recipient = mechanic.company_name || mechanic.profile?.full_name || "parceiro";
    const message = `Olá, ${recipient}! Aqui é da Grundemann. Estamos entrando em contato pelo painel administrativo.`;
    return buildWhatsAppUrl(mechanic.profile?.phone, message);
  };

  const sendApprovalNotification = async (mechanic: MechanicRow) => {
    const recipient = mechanic.company_name || mechanic.profile?.full_name || "parceiro";
    await supabase.from("notifications").insert({
      user_id: mechanic.user_id,
      title: "Cadastro aprovado na Área do Mecânico 🎉",
      message: `Olá, ${recipient}! Seu cadastro foi aprovado e sua área exclusiva já está liberada.`,
      type: "info",
      link: "/mecanico",
    });
    const whatsappUrl = getWhatsAppUrl(mechanic);
    if (whatsappUrl) {
      window.open(whatsappUrl, "_blank", "noopener,noreferrer");
    }
  };

  const toggleApproval = async (mechanic: MechanicRow) => {
    const nextApproved = !mechanic.is_approved;
    const { error } = await supabase.from("mechanics").update({ is_approved: nextApproved }).eq("id", mechanic.id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    if (nextApproved) {
      await sendApprovalNotification(mechanic);
      toast({ title: "Mecânico aprovado!", description: "Notificação enviada." });
    } else {
      toast({ title: "Aprovação revogada!" });
    }
    load();
  };

  const updateDiscount = async (id: string, rate: number) => {
    await supabase.from("mechanics").update({ discount_rate: rate }).eq("id", id);
    toast({ title: "Desconto atualizado!" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este cadastro de mecânico?")) return;
    await supabase.from("mechanics").delete().eq("id", id);
    toast({ title: "Mecânico removido!" });
    load();
  };

  const startEdit = (m: MechanicRow) => {
    setEditingId(m.id);
    setEditForm({
      company_name: m.company_name || "",
      cnpj: m.cnpj || "",
      inscricao_estadual: (m as any).inscricao_estadual || "",
      specialty: m.specialty || "",
      discount_rate: String(m.discount_rate),
      full_name: m.profile?.full_name || "",
      phone: m.profile?.phone || "",
      address: m.profile?.address || "",
      city: m.profile?.city || "",
      state: m.profile?.state || "",
      zip_code: m.profile?.zip_code || "",
      neighborhood: m.profile?.neighborhood || "",
    });
  };

  const saveEdit = async (m: MechanicRow) => {
    setSavingEdit(true);
    await Promise.all([
      supabase.from("mechanics").update({
        company_name: editForm.company_name || null,
        cnpj: editForm.cnpj || null,
        inscricao_estadual: editForm.inscricao_estadual || null,
        specialty: editForm.specialty || null,
        discount_rate: Number(editForm.discount_rate) || 5,
      } as any).eq("id", m.id),
      supabase.from("profiles").update({
        full_name: editForm.full_name,
        phone: editForm.phone || null,
        address: editForm.address || null,
        city: editForm.city || null,
        state: editForm.state || null,
        zip_code: editForm.zip_code || null,
        neighborhood: editForm.neighborhood || null,
      }).eq("user_id", m.user_id),
    ]);
    toast({ title: "Mecânico atualizado!" });
    setEditingId(null);
    setSavingEdit(false);
    load();
  };

  const addMechanicManual = async () => {
    if (!addForm.email.trim()) { toast({ title: "Informe o email do usuário", variant: "destructive" }); return; }
    setAddingMechanic(true);
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", addForm.email.trim()).maybeSingle();
    if (!profile) { toast({ title: "Usuário não encontrado", variant: "destructive" }); setAddingMechanic(false); return; }
    const { data: existing } = await supabase.from("mechanics").select("id").eq("user_id", profile.user_id).maybeSingle();
    if (existing) { toast({ title: "Já cadastrado", variant: "destructive" }); setAddingMechanic(false); return; }
    const profileUpdate: any = {};
    if (addForm.full_name) profileUpdate.full_name = addForm.full_name;
    if (addForm.phone) profileUpdate.phone = addForm.phone;
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("user_id", profile.user_id);
    }
    const { error } = await supabase.from("mechanics").insert({
      user_id: profile.user_id,
      company_name: addForm.company_name || null,
      cnpj: addForm.cnpj || null,
      inscricao_estadual: addForm.inscricao_estadual || null,
      specialty: addForm.specialty || null,
      is_approved: true,
      discount_rate: Number(addForm.discount_rate) || 5,
    } as any);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); }
    else {
      toast({ title: "Mecânico cadastrado e aprovado!" });
      setShowAddForm(false);
      setAddForm({ email: "", full_name: "", phone: "", company_name: "", cnpj: "", inscricao_estadual: "", specialty: "", discount_rate: "5" });
      load();
    }
    setAddingMechanic(false);
  };

  const filtered = mechanics.filter(m => {
    if (statusFilter === "approved" && !m.is_approved) return false;
    if (statusFilter === "pending" && m.is_approved) return false;
    if (search) {
      const s = search.toLowerCase();
      return (m.company_name || "").toLowerCase().includes(s) ||
        (m.cnpj || "").toLowerCase().includes(s) ||
        (m.profile?.full_name || "").toLowerCase().includes(s) ||
        (m.profile?.email || "").toLowerCase().includes(s);
    }
    return true;
  });

  const pendingCount = mechanics.filter(m => !m.is_approved).length;
  const approvedCount = mechanics.filter(m => m.is_approved).length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
            <Wrench className="h-8 w-8 text-primary" /> Gestão de Parceiros
          </h1>
          <p className="text-muted-foreground mt-1">Mecânicos, Oficinas e Revendedores — Aprove, edite e gerencie</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Parceiro
        </Button>
      </div>

      {showAddForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <h3 className="font-heading font-bold text-sm mb-4">Cadastro Manual de Mecânico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div><label className="text-xs text-muted-foreground">Email do Usuário *</label><Input value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="usuario@email.com" /></div>
            <div><label className="text-xs text-muted-foreground">Nome Completo</label><Input value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Telefone</label><Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div><label className="text-xs text-muted-foreground">Oficina/Empresa</label><Input value={addForm.company_name} onChange={e => setAddForm({ ...addForm, company_name: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">CNPJ</label><Input value={addForm.cnpj} onChange={e => setAddForm({ ...addForm, cnpj: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Inscrição Estadual (IE)</label><Input value={addForm.inscricao_estadual} onChange={e => setAddForm({ ...addForm, inscricao_estadual: e.target.value })} placeholder="IE" /></div>
            <div><label className="text-xs text-muted-foreground">Especialidade</label><Input value={addForm.specialty} onChange={e => setAddForm({ ...addForm, specialty: e.target.value })} /></div>
            <div><label className="text-xs text-muted-foreground">Desconto %</label><Input type="number" min="0" max="50" value={addForm.discount_rate} onChange={e => setAddForm({ ...addForm, discount_rate: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={addMechanicManual} disabled={addingMechanic}>{addingMechanic ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Cadastrar e Aprovar</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Total", count: mechanics.length, color: "text-primary" },
          { label: "Aprovados", count: approvedCount, color: "text-primary" },
          { label: "Pendentes", count: pendingCount, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <p className="text-xs text-muted-foreground">{s.label}</p>
            <p className={`text-2xl font-heading font-bold ${s.color}`}>{s.count}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, email, oficina..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value as any)}>
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
        </select>
      </div>

      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-5">
            {editingId === m.id ? (
              /* Edit Form */
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-bold text-lg">Editar Ficha</h3>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => saveEdit(m)} disabled={savingEdit}>
                      {savingEdit ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />} Salvar
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => setEditingId(null)}><X className="h-4 w-4" /></Button>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  <div><Label className="text-xs">Nome Completo</Label><Input value={editForm.full_name} onChange={e => setEditForm({ ...editForm, full_name: e.target.value })} /></div>
                  <div><Label className="text-xs">Telefone</Label><Input value={editForm.phone} onChange={e => setEditForm({ ...editForm, phone: e.target.value })} /></div>
                  <div><Label className="text-xs">Oficina/Empresa</Label><Input value={editForm.company_name} onChange={e => setEditForm({ ...editForm, company_name: e.target.value })} /></div>
                  <div><Label className="text-xs">CNPJ</Label><Input value={editForm.cnpj} onChange={e => setEditForm({ ...editForm, cnpj: e.target.value })} /></div>
                  <div><Label className="text-xs">Inscrição Estadual (IE)</Label><Input value={editForm.inscricao_estadual} onChange={e => setEditForm({ ...editForm, inscricao_estadual: e.target.value })} /></div>
                  <div><Label className="text-xs">Especialidade</Label><Input value={editForm.specialty} onChange={e => setEditForm({ ...editForm, specialty: e.target.value })} /></div>
                  <div><Label className="text-xs">Desconto %</Label><Input type="number" min="0" max="50" value={editForm.discount_rate} onChange={e => setEditForm({ ...editForm, discount_rate: e.target.value })} /></div>
                  <div><Label className="text-xs">Endereço</Label><Input value={editForm.address} onChange={e => setEditForm({ ...editForm, address: e.target.value })} /></div>
                  <div><Label className="text-xs">Bairro</Label><Input value={editForm.neighborhood} onChange={e => setEditForm({ ...editForm, neighborhood: e.target.value })} /></div>
                  <div><Label className="text-xs">Cidade</Label><Input value={editForm.city} onChange={e => setEditForm({ ...editForm, city: e.target.value })} /></div>
                  <div><Label className="text-xs">Estado</Label><Input value={editForm.state} onChange={e => setEditForm({ ...editForm, state: e.target.value })} /></div>
                  <div><Label className="text-xs">CEP</Label><Input value={editForm.zip_code} onChange={e => setEditForm({ ...editForm, zip_code: e.target.value })} /></div>
                </div>
              </div>
            ) : (
              /* View Card */
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <p className="font-heading font-bold text-foreground">{m.profile?.full_name || "Sem nome"}</p>
                    <Badge className={m.is_approved ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>
                      {m.is_approved ? "Aprovado" : "Pendente"}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize">{(m as any).partner_type || "mecanico"}</Badge>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                    <p>📧 {m.profile?.email || "—"}</p>
                    <p>📱 {m.profile?.phone || "—"}</p>
                    <p>🏢 {m.company_name || "—"}</p>
                    <p>📄 CNPJ: {m.cnpj || "—"}</p>
                    <p>📋 IE: {(m as any).inscricao_estadual || "—"}</p>
                    <p>🔧 {m.specialty || "—"}</p>
                    <p>📍 {[m.profile?.city, m.profile?.state].filter(Boolean).join(" - ") || "—"}</p>
                    <p>💰 Desconto: {m.discount_rate}%</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Cadastro: {new Date(m.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => startEdit(m)}>
                    <Edit className="h-4 w-4 mr-1" /> Editar
                  </Button>
                  <Button size="sm" variant={m.is_approved ? "outline" : "default"} onClick={() => toggleApproval(m)}>
                    {m.is_approved ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                    {m.is_approved ? "Revogar" : "Aprovar"}
                  </Button>
                  {getWhatsAppUrl(m) && (
                    <Button asChild size="sm" className="bg-[#25D366] hover:bg-accent text-white hover:text-accent-foreground transition-colors">
                      <a href={getWhatsAppUrl(m)!} target="_blank" rel="noopener noreferrer">
                        <WhatsAppIcon className="h-4 w-4 mr-1" />
                        WhatsApp
                      </a>
                    </Button>
                  )}
                  <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum mecânico encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default MechanicManagement;
