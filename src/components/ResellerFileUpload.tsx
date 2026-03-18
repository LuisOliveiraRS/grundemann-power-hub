import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Loader2, Plus, Edit2, X } from "lucide-react";

interface ResellerFile {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  status: string;
  admin_notes: string;
  created_at: string;
}

const CATEGORIES = ["Tabela de Preços", "Catálogo de Produtos", "Material de Apoio", "Política Comercial", "Outros"];

const statusLabels: Record<string, string> = {
  pending: "Aguardando Aprovação",
  approved: "Aprovado",
  rejected: "Rejeitado",
};
const statusColors: Record<string, string> = {
  pending: "bg-accent/20 text-accent-foreground",
  approved: "bg-primary/20 text-primary",
  rejected: "bg-destructive/20 text-destructive",
};

const ResellerFileUpload = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [files, setFiles] = useState<ResellerFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({ title: "", description: "", category: "Outros" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { if (user) loadFiles(); }, [user]);

  const loadFiles = async () => {
    const { data } = await supabase
      .from("reseller_files")
      .select("*")
      .eq("user_id", user!.id)
      .order("created_at", { ascending: false });
    setFiles((data || []) as ResellerFile[]);
    setLoading(false);
  };

  const uploadFile = async () => {
    if (!file || !form.title.trim()) {
      toast({ title: "Informe título e arquivo", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `fornecedor-${user!.id}-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("technical-catalogs").upload(fileName, file);
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("reseller_files").insert({
      user_id: user!.id,
      title: form.title,
      description: form.description || "",
      file_url: fileName,
      file_name: file.name,
      file_size: file.size,
      category: form.category,
      status: "pending",
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Arquivo enviado! Aguardando aprovação do administrador." });
      resetForm();
      loadFiles();
    }
    setUploading(false);
  };

  const updateFile = async () => {
    if (!editingId || !form.title.trim()) return;
    const { error } = await supabase.from("reseller_files").update({
      title: form.title,
      description: form.description,
      category: form.category,
    } as any).eq("id", editingId);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Arquivo atualizado!" });
      resetForm();
      loadFiles();
    }
  };

  const deleteFile = async (id: string, fileUrl: string) => {
    if (!confirm("Remover este arquivo?")) return;
    await supabase.storage.from("technical-catalogs").remove([fileUrl]);
    await supabase.from("reseller_files").delete().eq("id", id);
    toast({ title: "Arquivo removido!" });
    loadFiles();
  };

  const startEdit = (f: ResellerFile) => {
    setEditingId(f.id);
    setForm({ title: f.title, description: f.description || "", category: f.category });
    setShowForm(true);
    setFile(null);
  };

  const resetForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm({ title: "", description: "", category: "Outros" });
    setFile(null);
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="font-heading text-xl font-bold">Meus Arquivos</h2>
          <p className="text-muted-foreground text-sm">Envie PDFs e documentos para aprovação do administrador</p>
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} size="sm">
          <Plus className="h-4 w-4 mr-1" /> Enviar Arquivo
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Tabela de Preços 2026" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do arquivo" />
            </div>
            {!editingId && (
              <div className="sm:col-span-2">
                <Label>Arquivo (PDF, DOC, XLS) *</Label>
                <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
              </div>
            )}
          </div>
          <div className="flex gap-2 mt-4">
            {editingId ? (
              <Button onClick={updateFile}><Edit2 className="h-4 w-4 mr-1" /> Salvar</Button>
            ) : (
              <Button onClick={uploadFile} disabled={uploading}>
                {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
                Enviar
              </Button>
            )}
            <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-1" /> Cancelar</Button>
          </div>
        </div>
      )}

      <div className="space-y-3">
        {files.map(f => (
          <div key={f.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{f.title}</p>
              <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                <Badge variant="outline" className="text-xs">{f.category}</Badge>
                <span className="text-xs text-muted-foreground">{f.file_name} · {formatSize(f.file_size)}</span>
              </div>
              {f.admin_notes && <p className="text-xs text-muted-foreground mt-1 italic">Admin: {f.admin_notes}</p>}
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={statusColors[f.status] || "bg-muted text-muted-foreground"}>
                {statusLabels[f.status] || f.status}
              </Badge>
              {f.status === "pending" && (
                <>
                  <Button size="sm" variant="ghost" onClick={() => startEdit(f)}>
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => deleteFile(f.id, f.file_url)}>
                    <Trash2 className="h-4 w-4 text-destructive" />
                  </Button>
                </>
              )}
            </div>
          </div>
        ))}
        {files.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">
            <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>Nenhum arquivo enviado ainda. Clique em "Enviar Arquivo" para começar.</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResellerFileUpload;
