import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Search, CheckCircle2, XCircle, Trash2, Loader2, Plus, UserPlus, MessageCircle } from "lucide-react";

interface MechanicRow {
  id: string;
  user_id: string;
  company_name: string | null;
  cnpj: string | null;
  specialty: string | null;
  discount_rate: number;
  is_approved: boolean;
  created_at: string;
  profile?: { full_name: string; email: string; phone: string | null; city: string | null; state: string | null } | null;
}

const MechanicManagement = () => {
  const { toast } = useToast();
  const [mechanics, setMechanics] = useState<MechanicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<"all" | "approved" | "pending">("all");
  const [showAddForm, setShowAddForm] = useState(false);
  const [addForm, setAddForm] = useState({ email: "", full_name: "", phone: "", company_name: "", cnpj: "", specialty: "", discount_rate: "5" });
  const [addingMechanic, setAddingMechanic] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("mechanics").select("*").order("created_at", { ascending: false });
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(m => m.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone, city, state").in("user_id", userIds);

    const enriched = data.map(m => ({
      ...m,
      profile: profiles?.find(p => p.user_id === m.user_id) || null,
    }));
    setMechanics(enriched);
    setLoading(false);
  };

  const normalizePhone = (phone?: string | null) => (phone || "").replace(/\D/g, "");

  const getWhatsAppUrl = (mechanic: MechanicRow) => {
    const phone = normalizePhone(mechanic.profile?.phone);
    if (!phone) return null;

    const recipient = mechanic.company_name || mechanic.profile?.full_name || "parceiro";
    const message = `Olá, ${recipient}! Aqui é da Grundemann. Estamos entrando em contato pelo painel administrativo.`;
    return `https://wa.me/${phone}?text=${encodeURIComponent(message)}`;
  };

  const sendApprovalNotification = async (mechanic: MechanicRow) => {
    const recipient = mechanic.company_name || mechanic.profile?.full_name || "parceiro";
    const whatsappUrl = getWhatsAppUrl(mechanic);

    await supabase.from("notifications").insert({
      user_id: mechanic.user_id,
      title: "Cadastro aprovado na Área do Mecânico 🎉",
      message: `Olá, ${recipient}! Seu cadastro foi aprovado e sua área exclusiva já está liberada.`,
      type: "info",
      link: "/mecanico",
    });

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
      toast({ title: "Mecânico aprovado!", description: mechanic.profile?.phone ? "Mensagem de boas-vindas aberta no WhatsApp e notificação interna enviada." : "Notificação interna enviada." });
    } else {
      toast({ title: "Aprovação revogada!" });
    }

    load();
  };

  const updateDiscount = async (id: string, rate: number) => {
    const { error } = await supabase.from("mechanics").update({ discount_rate: rate }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Desconto atualizado!" });
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este cadastro de mecânico?")) return;
    const { error } = await supabase.from("mechanics").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Mecânico removido!" });
    load();
  };

  const addMechanicManual = async () => {
    if (!addForm.email.trim()) { toast({ title: "Informe o email do usuário", variant: "destructive" }); return; }
    setAddingMechanic(true);

    // Find user by email in profiles
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", addForm.email.trim()).maybeSingle();
    if (!profile) {
      toast({ title: "Usuário não encontrado", description: "Nenhum usuário cadastrado com esse email.", variant: "destructive" });
      setAddingMechanic(false);
      return;
    }

    // Check if already a mechanic
    const { data: existing } = await supabase.from("mechanics").select("id").eq("user_id", profile.user_id).maybeSingle();
    if (existing) {
      toast({ title: "Já cadastrado", description: "Este usuário já é mecânico.", variant: "destructive" });
      setAddingMechanic(false);
      return;
    }

    // Update profile info if provided
    const profileUpdate: any = {};
    if (addForm.full_name) profileUpdate.full_name = addForm.full_name;
    if (addForm.phone) profileUpdate.phone = addForm.phone;
    if (Object.keys(profileUpdate).length > 0) {
      await supabase.from("profiles").update(profileUpdate).eq("user_id", profile.user_id);
    }

    // Create mechanic record (admin can set approved + discount)
    const { error } = await supabase.from("mechanics").insert({
      user_id: profile.user_id,
      company_name: addForm.company_name || null,
      cnpj: addForm.cnpj || null,
      specialty: addForm.specialty || null,
      is_approved: true,
      discount_rate: Number(addForm.discount_rate) || 5,
    });

    if (error) {
      toast({ title: "Erro ao cadastrar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Mecânico cadastrado e aprovado!" });
      setShowAddForm(false);
      setAddForm({ email: "", full_name: "", phone: "", company_name: "", cnpj: "", specialty: "", discount_rate: "5" });
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
            <Wrench className="h-8 w-8 text-primary" /> Gestão de Mecânicos
          </h1>
          <p className="text-muted-foreground mt-1">Aprove cadastros, defina descontos e gerencie mecânicos parceiros</p>
        </div>
        <Button onClick={() => setShowAddForm(!showAddForm)}>
          <UserPlus className="h-4 w-4 mr-2" /> Cadastrar Mecânico
        </Button>
      </div>

      {/* Manual Add Form */}
      {showAddForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <h3 className="font-heading font-bold text-sm mb-4">Cadastro Manual de Mecânico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div><label className="text-xs text-muted-foreground">Email do Usuário *</label><Input value={addForm.email} onChange={e => setAddForm({ ...addForm, email: e.target.value })} placeholder="usuario@email.com" /></div>
            <div><label className="text-xs text-muted-foreground">Nome Completo</label><Input value={addForm.full_name} onChange={e => setAddForm({ ...addForm, full_name: e.target.value })} placeholder="Nome completo" /></div>
            <div><label className="text-xs text-muted-foreground">Telefone</label><Input value={addForm.phone} onChange={e => setAddForm({ ...addForm, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
            <div><label className="text-xs text-muted-foreground">Oficina/Empresa</label><Input value={addForm.company_name} onChange={e => setAddForm({ ...addForm, company_name: e.target.value })} placeholder="Nome da oficina" /></div>
            <div><label className="text-xs text-muted-foreground">CNPJ</label><Input value={addForm.cnpj} onChange={e => setAddForm({ ...addForm, cnpj: e.target.value })} placeholder="00.000.000/0000-00" /></div>
            <div><label className="text-xs text-muted-foreground">Especialidade</label><Input value={addForm.specialty} onChange={e => setAddForm({ ...addForm, specialty: e.target.value })} placeholder="Ex: Motores diesel" /></div>
            <div><label className="text-xs text-muted-foreground">Desconto %</label><Input type="number" min="0" max="50" value={addForm.discount_rate} onChange={e => setAddForm({ ...addForm, discount_rate: e.target.value })} /></div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={addMechanicManual} disabled={addingMechanic}>{addingMechanic ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Plus className="h-4 w-4 mr-1" />}Cadastrar e Aprovar</Button>
            <Button variant="outline" onClick={() => setShowAddForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Stats */}
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

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome, email, oficina..." value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <select
          className="h-10 border border-input rounded-md px-3 text-sm bg-background"
          value={statusFilter}
          onChange={e => setStatusFilter(e.target.value as any)}
        >
          <option value="all">Todos</option>
          <option value="pending">Pendentes</option>
          <option value="approved">Aprovados</option>
        </select>
      </div>

      {/* List */}
      <div className="space-y-3">
        {filtered.map(m => (
          <div key={m.id} className="bg-card rounded-xl border border-border p-5">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-heading font-bold text-foreground">{m.profile?.full_name || "Sem nome"}</p>
                  <Badge className={m.is_approved ? "bg-primary/20 text-primary" : "bg-destructive/20 text-destructive"}>
                    {m.is_approved ? "Aprovado" : "Pendente"}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-1 text-sm text-muted-foreground">
                  <p>📧 {m.profile?.email || "—"}</p>
                  <p>📱 {m.profile?.phone || "—"}</p>
                  <p>🏢 {m.company_name || "—"}</p>
                  <p>📄 CNPJ: {m.cnpj || "—"}</p>
                  <p>🔧 {m.specialty || "—"}</p>
                  <p>📍 {[m.profile?.city, m.profile?.state].filter(Boolean).join(" - ") || "—"}</p>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Cadastro: {new Date(m.created_at).toLocaleDateString("pt-BR")}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <div className="flex items-center gap-2">
                  <label className="text-xs text-muted-foreground whitespace-nowrap">Desconto %</label>
                  <Input
                    type="number"
                    min="0"
                    max="50"
                    className="w-20 h-8 text-center"
                    value={m.discount_rate}
                    onChange={e => updateDiscount(m.id, Number(e.target.value))}
                  />
                </div>
                <Button
                  size="sm"
                  variant={m.is_approved ? "outline" : "default"}
                  onClick={() => toggleApproval(m.id, m.is_approved)}
                >
                  {m.is_approved ? <XCircle className="h-4 w-4 mr-1" /> : <CheckCircle2 className="h-4 w-4 mr-1" />}
                  {m.is_approved ? "Revogar" : "Aprovar"}
                </Button>
                <Button size="sm" variant="ghost" onClick={() => remove(m.id)}>
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
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
