import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Textarea } from "@/components/ui/textarea";
import { FileText, Loader2, CheckCircle, XCircle, Trash2, Search, Download, BookOpen } from "lucide-react";

interface ResellerFile {
  id: string;
  user_id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  status: string;
  admin_notes: string;
  catalog_id: string | null;
  created_at: string;
  profile_name?: string;
  company_name?: string;
}

const statusLabels: Record<string, string> = { pending: "Pendente", approved: "Aprovado", rejected: "Rejeitado" };
const statusColors: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  approved: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

const ResellerFileApproval = () => {
  const { toast } = useToast();
  const [files, setFiles] = useState<ResellerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [notesMap, setNotesMap] = useState<Record<string, string>>({});
  const [publishing, setPublishing] = useState<string | null>(null);

  useEffect(() => { loadFiles(); }, []);

  const loadFiles = async () => {
    const { data } = await supabase
      .from("reseller_files")
      .select("*")
      .order("created_at", { ascending: false });

    if (data) {
      // Enrich with profile names
      const userIds = [...new Set(data.map((f: any) => f.user_id))];
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, full_name, company_name")
        .in("user_id", userIds);
      const profileMap = new Map((profiles || []).map((p: any) => [p.user_id, p]));

      setFiles(data.map((f: any) => ({
        ...f,
        profile_name: profileMap.get(f.user_id)?.full_name || "—",
        company_name: profileMap.get(f.user_id)?.company_name || "",
      })));
    }
    setLoading(false);
  };

  const updateStatus = async (id: string, status: string) => {
    const adminNotes = notesMap[id] || "";
    await supabase.from("reseller_files").update({ status, admin_notes: adminNotes, updated_at: new Date().toISOString() } as any).eq("id", id);
    toast({ title: status === "approved" ? "Arquivo aprovado!" : "Arquivo rejeitado" });
    loadFiles();
  };

  const publishToCatalog = async (file: ResellerFile) => {
    setPublishing(file.id);
    // Insert into technical_catalogs
    const { data: catalog, error } = await supabase.from("technical_catalogs").insert({
      title: file.title,
      description: file.description || null,
      file_url: file.file_url,
      file_name: file.file_name,
      file_size: file.file_size,
      category: `Fornecedor - ${file.category}`,
      is_active: true,
    } as any).select("id").single();

    if (error) {
      toast({ title: "Erro ao publicar", description: error.message, variant: "destructive" });
    } else if (catalog) {
      // Link back to reseller_files
      await supabase.from("reseller_files").update({ catalog_id: catalog.id } as any).eq("id", file.id);
      toast({ title: "Publicado no menu Catálogos!" });
      loadFiles();
    }
    setPublishing(null);
  };

  const unpublishFromCatalog = async (file: ResellerFile) => {
    if (!file.catalog_id) return;
    await supabase.from("technical_catalogs").delete().eq("id", file.catalog_id);
    await supabase.from("reseller_files").update({ catalog_id: null } as any).eq("id", file.id);
    toast({ title: "Removido do menu Catálogos" });
    loadFiles();
  };

  const deleteFile = async (file: ResellerFile) => {
    if (!confirm(`Excluir "${file.title}"?`)) return;
    if (file.catalog_id) {
      await supabase.from("technical_catalogs").delete().eq("id", file.catalog_id);
    }
    await supabase.storage.from("technical-catalogs").remove([file.file_url]);
    await supabase.from("reseller_files").delete().eq("id", file.id);
    toast({ title: "Arquivo excluído!" });
    loadFiles();
  };

  const downloadFile = async (file: ResellerFile) => {
    const { data } = await supabase.storage.from("technical-catalogs").createSignedUrl(file.file_url, 300);
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  const filtered = files.filter(f => {
    if (statusFilter !== "all" && f.status !== statusFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return f.title.toLowerCase().includes(s) || (f.profile_name || "").toLowerCase().includes(s) || (f.company_name || "").toLowerCase().includes(s);
    }
    return true;
  });

  const pendingCount = files.filter(f => f.status === "pending").length;

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="font-heading text-2xl font-bold">Arquivos de Revendedores</h2>
          <p className="text-muted-foreground text-sm">
            {pendingCount > 0 ? `${pendingCount} arquivo(s) aguardando aprovação` : "Nenhum arquivo pendente"}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9 w-48" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            <option value="all">Todos</option>
            <option value="pending">Pendentes</option>
            <option value="approved">Aprovados</option>
            <option value="rejected">Rejeitados</option>
          </select>
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map(f => (
          <div key={f.id} className={`bg-card rounded-xl border p-4 space-y-3 ${f.status === "pending" ? "border-accent/50" : "border-border"}`}>
            <div className="flex items-start gap-4">
              <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                <FileText className="h-5 w-5 text-primary" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-medium text-sm">{f.title}</p>
                  <Badge className={statusColors[f.status]}>{statusLabels[f.status]}</Badge>
                  {f.catalog_id && <Badge className="bg-primary/10 text-primary text-xs"><BookOpen className="h-3 w-3 mr-1" />No Menu</Badge>}
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Por: <strong>{f.profile_name}</strong> {f.company_name && `(${f.company_name})`} · {f.category} · {f.file_name} · {formatSize(f.file_size)} · {new Date(f.created_at).toLocaleDateString("pt-BR")}
                </p>
                {f.description && <p className="text-xs text-muted-foreground mt-1">{f.description}</p>}
              </div>
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button size="sm" variant="ghost" onClick={() => downloadFile(f)} title="Baixar">
                  <Download className="h-4 w-4" />
                </Button>
                <Button size="sm" variant="ghost" onClick={() => deleteFile(f)} className="text-destructive hover:text-destructive" title="Excluir">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {f.status === "pending" && (
              <div className="flex items-end gap-3 pl-14">
                <div className="flex-1">
                  <Textarea
                    placeholder="Observações do admin (opcional)"
                    rows={1}
                    className="text-xs"
                    value={notesMap[f.id] || ""}
                    onChange={e => setNotesMap(prev => ({ ...prev, [f.id]: e.target.value }))}
                  />
                </div>
                <Button size="sm" onClick={() => updateStatus(f.id, "approved")} className="gap-1">
                  <CheckCircle className="h-4 w-4" /> Aprovar
                </Button>
                <Button size="sm" variant="outline" onClick={() => updateStatus(f.id, "rejected")} className="gap-1 text-destructive border-destructive/30 hover:bg-destructive/10">
                  <XCircle className="h-4 w-4" /> Rejeitar
                </Button>
              </div>
            )}

            {f.status === "approved" && (
              <div className="flex items-center gap-2 pl-14">
                {!f.catalog_id ? (
                  <Button size="sm" variant="outline" onClick={() => publishToCatalog(f)} disabled={publishing === f.id} className="gap-1">
                    {publishing === f.id ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookOpen className="h-4 w-4" />}
                    Publicar no Menu Catálogos
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => unpublishFromCatalog(f)} className="gap-1 text-destructive">
                    <XCircle className="h-4 w-4" /> Remover do Menu
                  </Button>
                )}
              </div>
            )}
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum arquivo encontrado.</div>
        )}
      </div>
    </div>
  );
};

export default ResellerFileApproval;
