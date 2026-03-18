import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Shield, Search, UserPlus, Trash2, Crown, Users, Briefcase, Plus } from "lucide-react";

interface UserRole {
  id: string;
  user_id: string;
  role: string;
  profile?: { full_name: string; email: string } | null;
}

const roleLabels: Record<string, string> = {
  admin: "Administrador",
  seller: "Vendedor",
  user: "Usuário",
  fornecedor: "Fornecedor",
  mecanico: "Mecânico",
  oficina: "Oficina",
  locadora: "Locadora",
};

const roleIcons: Record<string, any> = {
  admin: Crown,
  seller: Briefcase,
  user: Users,
  fornecedor: Briefcase,
  mecanico: Briefcase,
  oficina: Briefcase,
  locadora: Briefcase,
};

const roleColors: Record<string, string> = {
  admin: "bg-destructive/20 text-destructive",
  seller: "bg-primary/20 text-primary",
  user: "bg-muted text-muted-foreground",
  fornecedor: "bg-accent/20 text-accent-foreground",
  mecanico: "bg-primary/15 text-primary",
  oficina: "bg-secondary/20 text-secondary-foreground",
  locadora: "bg-primary/20 text-primary",
};

const allRoles = ["admin", "seller", "user", "fornecedor", "mecanico", "oficina", "locadora"] as const;

const UserRoleManagement = () => {
  const { toast } = useToast();
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [newEmail, setNewEmail] = useState("");
  const [newRole, setNewRole] = useState<string>("admin");
  const [adding, setAdding] = useState(false);
  const [addingRoleFor, setAddingRoleFor] = useState<string | null>(null);
  const [selectedNewRole, setSelectedNewRole] = useState<string>("seller");

  useEffect(() => { loadRoles(); }, []);

  const loadRoles = async () => {
    const { data } = await supabase.from("user_roles").select("*");
    if (!data) { setLoading(false); return; }

    const userIds = [...new Set(data.map(r => r.user_id))];
    const { data: profiles } = await supabase.from("profiles").select("user_id, full_name, email").in("user_id", userIds);

    const enriched = data.map(r => ({
      ...r,
      profile: profiles?.find(p => p.user_id === r.user_id) || null,
    }));

    setRoles(enriched);
    setLoading(false);
  };

  const addRole = async () => {
    if (!newEmail.trim()) {
      toast({ title: "Informe o email do usuário", variant: "destructive" });
      return;
    }
    setAdding(true);

    const { data: profile } = await supabase.from("profiles").select("user_id").eq("email", newEmail.trim()).single();
    if (!profile) {
      toast({ title: "Usuário não encontrado", description: "O email informado não está cadastrado.", variant: "destructive" });
      setAdding(false);
      return;
    }

    const existing = roles.find(r => r.user_id === profile.user_id && r.role === newRole);
    if (existing) {
      toast({ title: "Este usuário já possui essa permissão", variant: "destructive" });
      setAdding(false);
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: profile.user_id,
      role: newRole as any,
    });

    if (error) {
      toast({ title: "Erro ao adicionar permissão", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Permissão ${roleLabels[newRole]} adicionada com sucesso!` });
      setNewEmail("");
    }
    setAdding(false);
    loadRoles();
  };

  const addRoleToUser = async (userId: string, role: string) => {
    const existing = roles.find(r => r.user_id === userId && r.role === role);
    if (existing) {
      toast({ title: "Usuário já possui essa permissão", variant: "destructive" });
      return;
    }

    const { error } = await supabase.from("user_roles").insert({
      user_id: userId,
      role: role as any,
    });

    if (error) {
      toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" });
    } else {
      toast({ title: `Permissão ${roleLabels[role]} adicionada!` });
      setAddingRoleFor(null);
    }
    loadRoles();
  };

  const removeRole = async (roleId: string, roleName: string) => {
    if (!confirm(`Remover permissão de ${roleLabels[roleName]}?`)) return;
    const { error } = await supabase.from("user_roles").delete().eq("id", roleId);
    if (error) {
      toast({ title: "Erro ao remover", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Permissão removida!" });
      loadRoles();
    }
  };

  // Group by user
  const userMap = new Map<string, UserRole[]>();
  roles.forEach(r => {
    const key = r.user_id;
    if (!userMap.has(key)) userMap.set(key, []);
    userMap.get(key)!.push(r);
  });

  const users = Array.from(userMap.entries()).map(([userId, userRoles]) => ({
    userId,
    profile: userRoles[0].profile,
    roles: userRoles,
  }));

  const filtered = users.filter(u => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (u.profile?.full_name || "").toLowerCase().includes(s) || (u.profile?.email || "").toLowerCase().includes(s);
  });

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div>
      <div className="mb-8">
        <h1 className="font-heading text-3xl font-bold flex items-center gap-3">
          <Shield className="h-8 w-8 text-primary" /> Gerenciar Permissões
        </h1>
        <p className="text-muted-foreground mt-1">Adicione, edite ou remova permissões de qualquer usuário do sistema</p>
      </div>

      {/* Add new role */}
      <div className="bg-card rounded-xl border border-border p-6 mb-6">
        <h3 className="font-heading font-bold mb-4">Adicionar Permissão</h3>
        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="Email do usuário..."
            value={newEmail}
            onChange={e => setNewEmail(e.target.value)}
            className="flex-1"
          />
          <select
            className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[180px]"
            value={newRole}
            onChange={e => setNewRole(e.target.value)}
          >
            <option value="admin">Administrador</option>
            <option value="seller">Vendedor</option>
            <option value="user">Usuário</option>
          </select>
          <Button onClick={addRole} disabled={adding}>
            <UserPlus className="h-4 w-4 mr-2" />
            {adding ? "Adicionando..." : "Adicionar"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: "Administradores", count: roles.filter(r => r.role === "admin").length, icon: Crown, color: "text-destructive" },
          { label: "Vendedores", count: roles.filter(r => r.role === "seller").length, icon: Briefcase, color: "text-primary" },
          { label: "Usuários", count: roles.filter(r => r.role === "user").length, icon: Users, color: "text-muted-foreground" },
        ].map(s => (
          <div key={s.label} className="bg-card rounded-xl border border-border p-4">
            <div className="flex items-center gap-3">
              <div className={`rounded-lg bg-muted p-2 ${s.color}`}><s.icon className="h-5 w-5" /></div>
              <div>
                <p className="text-xs text-muted-foreground">{s.label}</p>
                <p className="text-lg font-heading font-bold">{s.count}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Search */}
      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar por nome ou email..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      {/* Users list */}
      <div className="space-y-3">
        {filtered.map(u => {
          const userRoleNames = u.roles.map(r => r.role);
          const missingRoles = allRoles.filter(r => !userRoleNames.includes(r));
          const isAddingForThis = addingRoleFor === u.userId;

          return (
            <div key={u.userId} className="bg-card rounded-xl border border-border p-4">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div>
                  <p className="font-heading font-bold text-sm">{u.profile?.full_name || "Sem nome"}</p>
                  <p className="text-xs text-muted-foreground">{u.profile?.email || u.userId.slice(0, 8)}</p>
                </div>
                <div className="flex items-center gap-2 flex-wrap">
                  {u.roles.map(r => {
                    const Icon = roleIcons[r.role] || Users;
                    return (
                      <div key={r.id} className="flex items-center gap-1">
                        <Badge className={roleColors[r.role] || ""}>
                          <Icon className="h-3 w-3 mr-1" />
                          {roleLabels[r.role] || r.role}
                        </Badge>
                        <button onClick={() => removeRole(r.id, r.role)} className="p-1 hover:bg-destructive/10 rounded transition-colors" title="Remover permissão">
                          <Trash2 className="h-3 w-3 text-destructive" />
                        </button>
                      </div>
                    );
                  })}

                  {/* Add role inline */}
                  {missingRoles.length > 0 && !isAddingForThis && (
                    <button
                      onClick={() => { setAddingRoleFor(u.userId); setSelectedNewRole(missingRoles[0]); }}
                      className="p-1.5 hover:bg-primary/10 rounded-lg transition-colors border border-dashed border-primary/30"
                      title="Adicionar permissão"
                    >
                      <Plus className="h-3.5 w-3.5 text-primary" />
                    </button>
                  )}

                  {isAddingForThis && (
                    <div className="flex items-center gap-1.5">
                      <select
                        className="h-7 border border-input rounded px-2 text-xs bg-background"
                        value={selectedNewRole}
                        onChange={e => setSelectedNewRole(e.target.value)}
                      >
                        {missingRoles.map(r => (
                          <option key={r} value={r}>{roleLabels[r]}</option>
                        ))}
                      </select>
                      <Button size="sm" className="h-7 text-xs px-2" onClick={() => addRoleToUser(u.userId, selectedNewRole)}>
                        Adicionar
                      </Button>
                      <Button size="sm" variant="ghost" className="h-7 text-xs px-2" onClick={() => setAddingRoleFor(null)}>
                        ✕
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum usuário encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default UserRoleManagement;
