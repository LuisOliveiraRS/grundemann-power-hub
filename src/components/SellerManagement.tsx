import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Users, DollarSign, TrendingUp, Search } from "lucide-react";

interface Seller {
  id: string;
  user_id: string;
  commission_rate: number;
  is_active: boolean;
  total_sales: number;
  total_commission: number;
  created_at: string;
  profile?: { full_name: string; email: string; phone: string | null };
}

interface Commission {
  id: string;
  order_id: string;
  seller_id: string;
  order_total: number;
  commission_rate: number;
  commission_amount: number;
  status: string;
  created_at: string;
}

const SellerManagement = () => {
  const { toast } = useToast();
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSeller, setEditingSeller] = useState<Seller | null>(null);
  const [form, setForm] = useState({ email: "", commission_rate: "10" });
  const [search, setSearch] = useState("");
  const [view, setView] = useState<"sellers" | "commissions">("sellers");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [sellersRes, commissionsRes] = await Promise.all([
      supabase.from("sellers").select("*").order("created_at", { ascending: false }),
      supabase.from("sale_commissions").select("*").order("created_at", { ascending: false }),
    ]);
    
    const sellersData = (sellersRes.data || []) as Seller[];
    
    // Load profiles for each seller
    const userIds = sellersData.map(s => s.user_id);
    if (userIds.length > 0) {
      const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email, phone").in("user_id", userIds);
      if (profiles) {
        sellersData.forEach(s => {
          s.profile = profiles.find((p: any) => p.user_id === s.user_id) as any;
        });
      }
    }

    setSellers(sellersData);
    setCommissions((commissionsRes.data || []) as Commission[]);
    setLoading(false);
  };

  const registerSeller = async () => {
    if (!form.email.trim()) {
      toast({ title: "Informe o email do vendedor", variant: "destructive" });
      return;
    }

    // Find user by email in profiles
    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", form.email.trim()).single();
    if (!profile) {
      toast({ title: "Usuário não encontrado", description: "O email informado não está cadastrado no sistema.", variant: "destructive" });
      return;
    }

    // Check if already a seller
    const { data: existing } = await supabase.from("sellers").select("id").eq("user_id", profile.user_id).maybeSingle();
    if (existing) {
      toast({ title: "Este usuário já é um vendedor", variant: "destructive" });
      return;
    }

    // Add seller role
    await supabase.from("user_roles").insert({ user_id: profile.user_id, role: "seller" as any });

    // Create seller record
    const { error } = await supabase.from("sellers").insert({
      user_id: profile.user_id,
      commission_rate: parseFloat(form.commission_rate) || 10,
    });

    if (error) {
      toast({ title: "Erro ao cadastrar vendedor", description: error.message, variant: "destructive" });
      return;
    }

    toast({ title: "Vendedor cadastrado com sucesso!" });
    setForm({ email: "", commission_rate: "10" });
    setShowForm(false);
    loadData();
  };

  const updateSeller = async (seller: Seller, updates: Partial<Seller>) => {
    const { error } = await supabase.from("sellers").update(updates).eq("id", seller.id);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Vendedor atualizado!" });
    loadData();
  };

  const deleteSeller = async (seller: Seller) => {
    if (!confirm("Remover este vendedor? O usuário continuará com acesso ao sistema.")) return;
    await supabase.from("user_roles").delete().eq("user_id", seller.user_id).eq("role", "seller" as any);
    await supabase.from("sellers").delete().eq("id", seller.id);
    toast({ title: "Vendedor removido!" });
    loadData();
  };

  const totalSales = sellers.reduce((s, sel) => s + Number(sel.total_sales), 0);
  const totalCommissions = commissions.reduce((s, c) => s + Number(c.commission_amount), 0);
  const pendingCommissions = commissions.filter(c => c.status === "pending").reduce((s, c) => s + Number(c.commission_amount), 0);

  const filteredSellers = sellers.filter(s => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (s.profile?.full_name || "").toLowerCase().includes(q) || (s.profile?.email || "").toLowerCase().includes(q);
  });

  const getSellerName = (sellerId: string) => {
    const seller = sellers.find(s => s.id === sellerId);
    return seller?.profile?.full_name || "—";
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold text-foreground">Vendedores</h1>
        <p className="text-muted-foreground mt-1">Gerencie vendedores e comissões</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Vendedores Ativos", value: sellers.filter(s => s.is_active).length, icon: Users, color: "text-primary" },
          { label: "Vendas Totais", value: `R$ ${totalSales.toFixed(2).replace(".", ",")}`, icon: TrendingUp, color: "text-primary" },
          { label: "Comissões Totais", value: `R$ ${totalCommissions.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary" },
          { label: "Comissões Pendentes", value: `R$ ${pendingCommissions.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-destructive" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-heading font-bold">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-4">
        <Button variant={view === "sellers" ? "default" : "outline"} size="sm" onClick={() => setView("sellers")}>
          <Users className="h-4 w-4 mr-1" /> Vendedores
        </Button>
        <Button variant={view === "commissions" ? "default" : "outline"} size="sm" onClick={() => setView("commissions")}>
          <DollarSign className="h-4 w-4 mr-1" /> Comissões
        </Button>
        <Button size="sm" className="ml-auto" onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-1" /> Cadastrar Vendedor
        </Button>
      </div>

      {/* Register form */}
      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 mb-6">
          <h3 className="font-heading font-bold mb-4">Cadastrar Novo Vendedor</h3>
          <p className="text-sm text-muted-foreground mb-4">O usuário deve já estar cadastrado no sistema. Informe o email do cadastro.</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Email do Usuário</Label>
              <Input value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@exemplo.com" />
            </div>
            <div>
              <Label>Taxa de Comissão (%)</Label>
              <Input type="number" value={form.commission_rate} onChange={e => setForm(f => ({ ...f, commission_rate: e.target.value }))} />
            </div>
            <div className="flex items-end">
              <Button onClick={registerSeller}>Cadastrar</Button>
            </div>
          </div>
        </div>
      )}

      {view === "sellers" && (
        <>
          <div className="mb-4">
            <div className="relative max-w-sm">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input className="pl-9" placeholder="Buscar vendedor..." value={search} onChange={e => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="bg-card rounded-xl border border-border overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/50 border-b border-border">
                  <tr>
                    <th className="text-left p-3 font-semibold">Vendedor</th>
                    <th className="text-left p-3 font-semibold">Email</th>
                    <th className="text-center p-3 font-semibold">Comissão</th>
                    <th className="text-center p-3 font-semibold">Vendas</th>
                    <th className="text-center p-3 font-semibold">Comissão Acum.</th>
                    <th className="text-center p-3 font-semibold">Status</th>
                    <th className="text-center p-3 font-semibold">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredSellers.map(seller => (
                    <tr key={seller.id} className="border-b border-border hover:bg-muted/30">
                      <td className="p-3 font-medium">{seller.profile?.full_name || "—"}</td>
                      <td className="p-3 text-muted-foreground">{seller.profile?.email || "—"}</td>
                      <td className="p-3 text-center">
                        {editingSeller?.id === seller.id ? (
                          <Input
                            type="number"
                            className="w-20 mx-auto text-center"
                            value={editingSeller.commission_rate}
                            onChange={e => setEditingSeller({ ...editingSeller, commission_rate: parseFloat(e.target.value) || 0 })}
                            onBlur={() => {
                              updateSeller(seller, { commission_rate: editingSeller.commission_rate });
                              setEditingSeller(null);
                            }}
                            autoFocus
                          />
                        ) : (
                          <span className="cursor-pointer hover:text-primary" onClick={() => setEditingSeller(seller)}>
                            {seller.commission_rate}%
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-medium">R$ {Number(seller.total_sales).toFixed(2).replace(".", ",")}</td>
                      <td className="p-3 text-center font-medium">R$ {Number(seller.total_commission).toFixed(2).replace(".", ",")}</td>
                      <td className="p-3 text-center">
                        <Switch checked={seller.is_active} onCheckedChange={v => updateSeller(seller, { is_active: v })} />
                      </td>
                      <td className="p-3 text-center">
                        <Button variant="ghost" size="icon" onClick={() => deleteSeller(seller)}>
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                  {filteredSellers.length === 0 && (
                    <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum vendedor cadastrado.</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {view === "commissions" && (
        <div className="bg-card rounded-xl border border-border overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 border-b border-border">
                <tr>
                  <th className="text-left p-3 font-semibold">Data</th>
                  <th className="text-left p-3 font-semibold">Vendedor</th>
                  <th className="text-left p-3 font-semibold">Pedido</th>
                  <th className="text-center p-3 font-semibold">Valor Pedido</th>
                  <th className="text-center p-3 font-semibold">Taxa</th>
                  <th className="text-center p-3 font-semibold">Comissão</th>
                  <th className="text-center p-3 font-semibold">Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map(c => (
                  <tr key={c.id} className="border-b border-border hover:bg-muted/30">
                    <td className="p-3">{new Date(c.created_at).toLocaleDateString("pt-BR")}</td>
                    <td className="p-3 font-medium">{getSellerName(c.seller_id)}</td>
                    <td className="p-3 text-muted-foreground">#{c.order_id.slice(0, 8)}</td>
                    <td className="p-3 text-center">R$ {Number(c.order_total).toFixed(2).replace(".", ",")}</td>
                    <td className="p-3 text-center">{c.commission_rate}%</td>
                    <td className="p-3 text-center font-bold text-primary">R$ {Number(c.commission_amount).toFixed(2).replace(".", ",")}</td>
                    <td className="p-3 text-center">
                      <Badge variant={c.status === "paid" ? "default" : "secondary"}>
                        {c.status === "paid" ? "Pago" : "Pendente"}
                      </Badge>
                    </td>
                  </tr>
                ))}
                {commissions.length === 0 && (
                  <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhuma comissão registrada.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default SellerManagement;
