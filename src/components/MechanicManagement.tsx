import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Wrench, Search, CheckCircle2, XCircle, Trash2, Eye, Loader2, Plus, UserPlus } from "lucide-react";

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

  const toggleApproval = async (id: string, current: boolean) => {
    const { error } = await supabase.from("mechanics").update({ is_approved: !current }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: !current ? "Mecânico aprovado!" : "Aprovação revogada!" });
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
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
          <Wrench className="h-8 w-8 text-primary" /> Gestão de Mecânicos
        </h1>
        <p className="text-muted-foreground mt-1">Aprove cadastros, defina descontos e gerencie mecânicos parceiros</p>
      </div>

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
