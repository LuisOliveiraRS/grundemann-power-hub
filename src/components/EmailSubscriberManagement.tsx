import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, Search, Download, Trash2, CheckCircle, XCircle, TrendingUp, Users, Ticket } from "lucide-react";

interface Subscriber {
  id: string;
  email: string;
  discount_code: string;
  is_used: boolean;
  created_at: string;
}

const EmailSubscriberManagement = () => {
  const { toast } = useToast();
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => { loadSubscribers(); }, []);

  const loadSubscribers = async () => {
    const { data } = await supabase.from("email_subscribers").select("*").order("created_at", { ascending: false });
    setSubscribers((data || []) as Subscriber[]);
    setLoading(false);
  };

  const filtered = subscribers.filter(s => s.email.toLowerCase().includes(search.toLowerCase()) || s.discount_code.toLowerCase().includes(search.toLowerCase()));
  const usedCount = subscribers.filter(s => s.is_used).length;
  const conversionRate = subscribers.length > 0 ? ((usedCount / subscribers.length) * 100).toFixed(1) : "0";
  const today = new Date().toISOString().split("T")[0];
  const todayCount = subscribers.filter(s => s.created_at.startsWith(today)).length;

  const exportCSV = () => {
    const csv = "Email,Cupom,Usado,Data\n" + subscribers.map(s =>
      `${s.email},${s.discount_code},${s.is_used ? "Sim" : "Não"},${new Date(s.created_at).toLocaleDateString("pt-BR")}`
    ).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = "subscribers.csv"; a.click();
    URL.revokeObjectURL(url);
  };

  const deleteSubscriber = async (id: string) => {
    if (!confirm("Excluir este assinante?")) return;
    await supabase.from("email_subscribers").delete().eq("id", id);
    toast({ title: "Assinante removido" });
    loadSubscribers();
  };

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <Users className="h-6 w-6 text-primary mx-auto mb-2" />
          <p className="font-heading text-2xl font-extrabold">{subscribers.length}</p>
          <p className="text-xs text-muted-foreground">Total Inscritos</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <TrendingUp className="h-6 w-6 text-green-500 mx-auto mb-2" />
          <p className="font-heading text-2xl font-extrabold">{todayCount}</p>
          <p className="text-xs text-muted-foreground">Hoje</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <Ticket className="h-6 w-6 text-orange-500 mx-auto mb-2" />
          <p className="font-heading text-2xl font-extrabold">{usedCount}</p>
          <p className="text-xs text-muted-foreground">Cupons Usados</p>
        </div>
        <div className="bg-card rounded-xl border border-border p-5 text-center">
          <CheckCircle className="h-6 w-6 text-blue-500 mx-auto mb-2" />
          <p className="font-heading text-2xl font-extrabold">{conversionRate}%</p>
          <p className="text-xs text-muted-foreground">Taxa Conversão</p>
        </div>
      </div>

      {/* Search & Export */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar por email ou cupom..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
        </div>
        <Button variant="outline" onClick={exportCSV}><Download className="h-4 w-4 mr-2" /> Exportar CSV</Button>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50">
              <tr>
                <th className="text-left px-4 py-3 font-semibold">Email</th>
                <th className="text-left px-4 py-3 font-semibold">Cupom</th>
                <th className="text-center px-4 py-3 font-semibold">Status</th>
                <th className="text-left px-4 py-3 font-semibold">Data</th>
                <th className="text-center px-4 py-3 font-semibold">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Carregando...</td></tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-muted-foreground">Nenhum assinante encontrado.</td></tr>
              ) : filtered.map(s => (
                <tr key={s.id} className="hover:bg-muted/20">
                  <td className="px-4 py-3 flex items-center gap-2"><Mail className="h-4 w-4 text-muted-foreground" /> {s.email}</td>
                  <td className="px-4 py-3 font-mono text-xs">{s.discount_code}</td>
                  <td className="px-4 py-3 text-center">
                    {s.is_used ? (
                      <Badge variant="secondary" className="text-xs gap-1"><CheckCircle className="h-3 w-3" /> Usado</Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs gap-1"><XCircle className="h-3 w-3" /> Pendente</Badge>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(s.created_at).toLocaleDateString("pt-BR")}</td>
                  <td className="px-4 py-3 text-center">
                    <button onClick={() => deleteSubscriber(s.id)} className="text-destructive hover:text-destructive/80"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default EmailSubscriberManagement;
