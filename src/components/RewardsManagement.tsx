import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Gift, Plus, Star, Users, Search, Trash2, Edit, CheckCircle, XCircle, Send } from "lucide-react";

interface Reward {
  id: string;
  name: string;
  description: string | null;
  points_required: number;
  reward_type: string;
  reward_value: number;
  is_active: boolean;
  image_url: string | null;
  created_at: string;
}

interface Redemption {
  id: string;
  user_id: string;
  reward_id: string;
  points_spent: number;
  status: string;
  created_at: string;
}

interface Profile {
  user_id: string;
  full_name: string;
  email: string;
}

const RewardsManagement = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<"rewards" | "redemptions" | "credit">("rewards");
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [redemptions, setRedemptions] = useState<Redemption[]>([]);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [editing, setEditing] = useState<Partial<Reward> | null>(null);
  const [form, setForm] = useState({ name: "", description: "", points_required: "", reward_type: "discount", reward_value: "", is_active: true, image_url: "" });

  // Credit points form
  const [creditUserId, setCreditUserId] = useState("");
  const [creditPoints, setCreditPoints] = useState("");
  const [creditDescription, setCreditDescription] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [rRes, rdRes, pRes] = await Promise.all([
      supabase.from("rewards").select("*").order("created_at", { ascending: false }),
      supabase.from("reward_redemptions").select("*").order("created_at", { ascending: false }),
      supabase.from("profiles").select("user_id, full_name, email").order("full_name"),
    ]);
    if (rRes.data) setRewards(rRes.data as Reward[]);
    if (rdRes.data) setRedemptions(rdRes.data as Redemption[]);
    if (pRes.data) setProfiles(pRes.data as Profile[]);
  };

  const saveReward = async () => {
    const data = {
      name: form.name,
      description: form.description || null,
      points_required: parseInt(form.points_required) || 100,
      reward_type: form.reward_type,
      reward_value: parseFloat(form.reward_value) || 0,
      is_active: form.is_active,
      image_url: form.image_url || null,
    };
    if (editing?.id) {
      const { error } = await supabase.from("rewards").update(data).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Recompensa atualizada!" });
    } else {
      const { error } = await supabase.from("rewards").insert(data);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Recompensa criada!" });
    }
    setEditing(null);
    setForm({ name: "", description: "", points_required: "", reward_type: "discount", reward_value: "", is_active: true, image_url: "" });
    loadAll();
  };

  const deleteReward = async (id: string) => {
    if (!confirm("Excluir esta recompensa?")) return;
    await supabase.from("rewards").delete().eq("id", id);
    toast({ title: "Recompensa excluída!" });
    loadAll();
  };

  const editReward = (r: Reward) => {
    setEditing(r);
    setForm({
      name: r.name,
      description: r.description || "",
      points_required: String(r.points_required),
      reward_type: r.reward_type,
      reward_value: String(r.reward_value),
      is_active: r.is_active,
      image_url: r.image_url || "",
    });
  };

  const updateRedemptionStatus = async (id: string, status: string, redemption: Redemption) => {
    const { error } = await supabase.from("reward_redemptions").update({ status }).eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }

    // If approved, deduct points
    if (status === "approved") {
      await supabase.from("loyalty_points").insert({
        user_id: redemption.user_id,
        points: redemption.points_spent,
        type: "redeem",
        description: `Resgate de recompensa aprovado`,
      });

      // Notify user
      await supabase.from("notifications").insert({
        user_id: redemption.user_id,
        title: "Resgate aprovado! 🎉",
        message: `Seu resgate de ${redemption.points_spent} pontos foi aprovado!`,
        type: "reward",
        link: "/minha-conta",
      });
    }

    if (status === "rejected") {
      await supabase.from("notifications").insert({
        user_id: redemption.user_id,
        title: "Resgate não aprovado",
        message: `Seu resgate de ${redemption.points_spent} pontos não foi aprovado. Entre em contato para mais informações.`,
        type: "reward",
        link: "/minha-conta",
      });
    }

    toast({ title: `Resgate ${status === "approved" ? "aprovado" : "rejeitado"}!` });
    loadAll();
  };

  const creditPointsToUser = async () => {
    if (!creditUserId || !creditPoints || !creditDescription) {
      toast({ title: "Preencha todos os campos", variant: "destructive" });
      return;
    }
    setSending(true);
    const { error } = await supabase.from("loyalty_points").insert({
      user_id: creditUserId,
      points: parseInt(creditPoints),
      type: "earn",
      description: creditDescription,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); setSending(false); return; }

    // Notify user
    await supabase.from("notifications").insert({
      user_id: creditUserId,
      title: "Pontos creditados! ⭐",
      message: `Você recebeu ${creditPoints} pontos: ${creditDescription}`,
      type: "points",
      link: "/minha-conta",
    });

    toast({ title: "Pontos creditados com sucesso!" });
    setCreditUserId("");
    setCreditPoints("");
    setCreditDescription("");
    setSending(false);
  };

  const getProfileName = (userId: string) => {
    const p = profiles.find(p => p.user_id === userId);
    return p ? `${p.full_name} (${p.email})` : userId.slice(0, 8);
  };

  const filteredProfiles = profiles.filter(p => {
    if (!userSearch) return true;
    const s = userSearch.toLowerCase();
    return p.full_name.toLowerCase().includes(s) || p.email.toLowerCase().includes(s);
  });

  const pendingRedemptions = redemptions.filter(r => r.status === "pending").length;

  return (
    <div className="space-y-6">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5">
          <Gift className="h-8 w-8 text-primary mb-2" />
          <p className="font-heading text-2xl font-bold">{rewards.length}</p>
          <p className="text-sm text-muted-foreground">Recompensas</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <Star className="h-8 w-8 text-yellow-500 mb-2" />
          <p className="font-heading text-2xl font-bold">{rewards.filter(r => r.is_active).length}</p>
          <p className="text-sm text-muted-foreground">Ativas</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <Users className="h-8 w-8 text-secondary mb-2" />
          <p className="font-heading text-2xl font-bold">{redemptions.length}</p>
          <p className="text-sm text-muted-foreground">Total Resgates</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5">
          <CheckCircle className="h-8 w-8 text-destructive mb-2" />
          <p className="font-heading text-2xl font-bold">{pendingRedemptions}</p>
          <p className="text-sm text-muted-foreground">Pendentes</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-border pb-1">
        {[
          { id: "rewards" as const, label: "Recompensas", icon: Gift },
          { id: "redemptions" as const, label: `Resgates${pendingRedemptions > 0 ? ` (${pendingRedemptions})` : ""}`, icon: CheckCircle },
          { id: "credit" as const, label: "Creditar Pontos", icon: Send },
        ].map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-t-lg transition-colors ${
              tab === t.id ? "bg-card border border-b-0 border-border text-foreground -mb-px" : "text-muted-foreground hover:text-foreground"
            }`}>
            <t.icon className="h-4 w-4" /> {t.label}
          </button>
        ))}
      </div>

      {/* REWARDS TAB */}
      {tab === "rewards" && (
        <div className="space-y-4">
          {/* Form */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
              <Plus className="h-4 w-4" /> {editing ? "Editar Recompensa" : "Nova Recompensa"}
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Nome</Label>
                <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Desconto de R$ 50" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Pontos Necessários</Label>
                <Input type="number" value={form.points_required} onChange={e => setForm(f => ({ ...f, points_required: e.target.value }))} placeholder="500" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Tipo</Label>
                <select className="h-10 w-full border border-input rounded-md px-3 text-sm bg-background" value={form.reward_type} onChange={e => setForm(f => ({ ...f, reward_type: e.target.value }))}>
                  <option value="discount">Desconto (R$)</option>
                  <option value="percentage">Desconto (%)</option>
                  <option value="freeShipping">Frete Grátis</option>
                  <option value="gift">Brinde</option>
                </select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Valor da Recompensa</Label>
                <Input type="number" value={form.reward_value} onChange={e => setForm(f => ({ ...f, reward_value: e.target.value }))} placeholder="50" />
              </div>
              <div className="space-y-1.5 md:col-span-2">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição</Label>
                <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição da recompensa..." rows={2} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs uppercase tracking-wider text-muted-foreground">URL da Imagem (opcional)</Label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
              <div className="flex items-center gap-3 pt-5">
                <Switch checked={form.is_active} onCheckedChange={v => setForm(f => ({ ...f, is_active: v }))} />
                <Label>Ativa</Label>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button onClick={saveReward}>{editing ? "Atualizar" : "Criar Recompensa"}</Button>
              {editing && <Button variant="outline" onClick={() => { setEditing(null); setForm({ name: "", description: "", points_required: "", reward_type: "discount", reward_value: "", is_active: true, image_url: "" }); }}>Cancelar</Button>}
            </div>
          </div>

          {/* List */}
          <div className="bg-card rounded-xl border border-border divide-y divide-border">
            {rewards.length === 0 ? (
              <div className="p-12 text-center">
                <Gift className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="text-muted-foreground">Nenhuma recompensa cadastrada</p>
              </div>
            ) : rewards.map(r => (
              <div key={r.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    {r.image_url ? <img src={r.image_url} alt="" className="h-10 w-10 rounded object-cover" /> : <Gift className="h-6 w-6 text-primary" />}
                  </div>
                  <div>
                    <p className="font-heading font-bold text-sm">{r.name}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <Badge variant="secondary" className="text-xs"><Star className="h-3 w-3 mr-1" />{r.points_required} pts</Badge>
                      <Badge variant="outline" className="text-xs">
                        {r.reward_type === "discount" ? `R$ ${r.reward_value}` : r.reward_type === "percentage" ? `${r.reward_value}%` : r.reward_type === "freeShipping" ? "Frete Grátis" : "Brinde"}
                      </Badge>
                      <Badge variant={r.is_active ? "default" : "secondary"} className="text-xs">{r.is_active ? "Ativa" : "Inativa"}</Badge>
                    </div>
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button variant="ghost" size="icon" onClick={() => editReward(r)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="icon" onClick={() => deleteReward(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* REDEMPTIONS TAB */}
      {tab === "redemptions" && (
        <div className="bg-card rounded-xl border border-border divide-y divide-border">
          {redemptions.length === 0 ? (
            <div className="p-12 text-center">
              <CheckCircle className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-muted-foreground">Nenhum resgate realizado</p>
            </div>
          ) : redemptions.map(rd => {
            const reward = rewards.find(r => r.id === rd.reward_id);
            return (
              <div key={rd.id} className="p-4 flex items-center justify-between hover:bg-muted/30 transition-colors">
                <div>
                  <p className="font-heading font-bold text-sm">{reward?.name || "Recompensa removida"}</p>
                  <p className="text-xs text-muted-foreground">{getProfileName(rd.user_id)} • {rd.points_spent} pontos</p>
                  <p className="text-xs text-muted-foreground">{new Date(rd.created_at).toLocaleDateString("pt-BR")}</p>
                </div>
                <div className="flex items-center gap-2">
                  {rd.status === "pending" ? (
                    <>
                      <Button size="sm" onClick={() => updateRedemptionStatus(rd.id, "approved", rd)} className="gap-1">
                        <CheckCircle className="h-3.5 w-3.5" /> Aprovar
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => updateRedemptionStatus(rd.id, "rejected", rd)} className="gap-1 text-destructive border-destructive/30">
                        <XCircle className="h-3.5 w-3.5" /> Rejeitar
                      </Button>
                    </>
                  ) : (
                    <Badge variant={rd.status === "approved" ? "default" : "destructive"}>
                      {rd.status === "approved" ? "Aprovado" : "Rejeitado"}
                    </Badge>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CREDIT POINTS TAB */}
      {tab === "credit" && (
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-heading font-bold mb-4 flex items-center gap-2">
            <Send className="h-4 w-4" /> Creditar Pontos Manualmente
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Pontos são creditados automaticamente quando um pedido é entregue (1 ponto por R$ 1,00). Use esta área para créditos manuais (bônus, promoções, correções).
          </p>

          <div className="space-y-4 max-w-lg">
            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Buscar Usuário</Label>
              <Input value={userSearch} onChange={e => setUserSearch(e.target.value)} placeholder="Buscar por nome ou email..." />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Selecionar Usuário</Label>
              <select className="h-10 w-full border border-input rounded-md px-3 text-sm bg-background" value={creditUserId} onChange={e => setCreditUserId(e.target.value)}>
                <option value="">Selecione um usuário</option>
                {filteredProfiles.map(p => (
                  <option key={p.user_id} value={p.user_id}>{p.full_name} ({p.email})</option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Quantidade de Pontos</Label>
              <Input type="number" value={creditPoints} onChange={e => setCreditPoints(e.target.value)} placeholder="100" />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs uppercase tracking-wider text-muted-foreground">Descrição / Motivo</Label>
              <Input value={creditDescription} onChange={e => setCreditDescription(e.target.value)} placeholder="Ex: Bônus de boas-vindas" />
            </div>

            <Button onClick={creditPointsToUser} disabled={sending || !creditUserId || !creditPoints}>
              {sending ? "Creditando..." : "Creditar Pontos"}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RewardsManagement;
