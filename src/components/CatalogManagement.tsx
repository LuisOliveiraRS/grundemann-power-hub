import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, FileText, Loader2, Download, Eye, EyeOff } from "lucide-react";

interface Catalog {
  id: string;
  title: string;
  description: string;
  file_url: string;
  file_name: string;
  file_size: number;
  category: string;
  is_active: boolean;
  created_at: string;
}

const CATEGORIES = [
  "Geral",
  "Motores a Gasolina",
  "Motores a Diesel",
  "Geradores",
  "Bombas",
  "Peças de Reposição",
  "Manuais Técnicos",
  "Catálogos de Produtos",
];

const CatalogManagement = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [catalogs, setCatalogs] = useState<Catalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Geral" });

  useEffect(() => { loadCatalogs(); }, []);

  const loadCatalogs = async () => {
    const { data } = await supabase
      .from("technical_catalogs")
      .select("*")
      .order("created_at", { ascending: false });
    setCatalogs((data || []) as Catalog[]);
    setLoading(false);
  };

  const handleUpload = async (file: File) => {
    if (!form.title.trim()) {
      toast({ title: "Informe o título do catálogo", variant: "destructive" });
      return;
    }
    if (!file.name.toLowerCase().endsWith(".pdf")) {
      toast({ title: "Apenas arquivos PDF são aceitos", variant: "destructive" });
      return;
    }

    setUploading(true);
    const fileName = `${Date.now()}-${file.name.replace(/\s+/g, "_")}`;

    const { error: uploadError } = await supabase.storage
      .from("technical-catalogs")
      .upload(fileName, file);

    if (uploadError) {
      toast({ title: "Erro no upload", description: uploadError.message, variant: "destructive" });
      setUploading(false);
      return;
    }

    // Get signed URL for private bucket
    const { data: urlData } = await supabase.storage
      .from("technical-catalogs")
      .createSignedUrl(fileName, 60 * 60 * 24 * 365 * 10); // 10 years

    const { error: insertError } = await supabase.from("technical_catalogs").insert({
      title: form.title,
      description: form.description,
      file_url: fileName, // store path, not full URL
      file_name: file.name,
      file_size: file.size,
      category: form.category,
    });

    if (insertError) {
      toast({ title: "Erro ao salvar", description: insertError.message, variant: "destructive" });
    } else {
      toast({ title: "Catálogo enviado com sucesso!" });
      setForm({ title: "", description: "", category: "Geral" });
      setShowForm(false);
      loadCatalogs();
    }
    setUploading(false);
  };

  const toggleActive = async (catalog: Catalog) => {
    await supabase.from("technical_catalogs").update({ is_active: !catalog.is_active }).eq("id", catalog.id);
    toast({ title: catalog.is_active ? "Catálogo desativado" : "Catálogo ativado" });
    loadCatalogs();
  };

  const deleteCatalog = async (catalog: Catalog) => {
    if (!confirm(`Excluir "${catalog.title}"? Essa ação é irreversível.`)) return;
    await supabase.storage.from("technical-catalogs").remove([catalog.file_url]);
    await supabase.from("technical_catalogs").delete().eq("id", catalog.id);
    toast({ title: "Catálogo excluído!" });
    loadCatalogs();
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1048576) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1048576).toFixed(1)} MB`;
  };

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-muted-foreground text-sm">{catalogs.length} catálogo(s) cadastrado(s)</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Novo Catálogo
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <h3 className="font-heading font-bold text-foreground">Adicionar Catálogo Técnico</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Ex: Catálogo Motor 7HP a Gasolina" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select
                value={form.category}
                onChange={e => setForm(f => ({ ...f, category: e.target.value }))}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Breve descrição do conteúdo do catálogo" rows={2} />
            </div>
          </div>
          <div>
            <input
              ref={fileRef}
              type="file"
              accept=".pdf"
              className="hidden"
              onChange={e => {
                const file = e.target.files?.[0];
                if (file) handleUpload(file);
              }}
            />
            <Button onClick={() => fileRef.current?.click()} disabled={uploading || !form.title.trim()}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
              {uploading ? "Enviando..." : "Selecionar e Enviar PDF"}
            </Button>
          </div>
        </div>
      )}

      {/* Catalog list */}
      <div className="space-y-3">
        {catalogs.map(catalog => (
          <div key={catalog.id} className={`flex items-center gap-4 p-4 rounded-lg border transition-colors ${catalog.is_active ? "border-border bg-card" : "border-border/50 bg-muted/30 opacity-60"}`}>
            <div className="rounded-lg bg-primary/10 p-3 flex-shrink-0">
              <FileText className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <p className="font-heading font-bold text-sm text-foreground">{catalog.title}</p>
                <Badge variant="outline" className="text-[10px]">{catalog.category}</Badge>
                {!catalog.is_active && <Badge variant="secondary" className="text-[10px]">Inativo</Badge>}
              </div>
              {catalog.description && (
                <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{catalog.description}</p>
              )}
              <p className="text-[10px] text-muted-foreground mt-1">
                {catalog.file_name} • {formatSize(catalog.file_size)} • {new Date(catalog.created_at).toLocaleDateString("pt-BR")}
              </p>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Button variant="ghost" size="icon" onClick={() => toggleActive(catalog)} title={catalog.is_active ? "Desativar" : "Ativar"}>
                {catalog.is_active ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
              </Button>
              <Button variant="ghost" size="icon" onClick={() => deleteCatalog(catalog)} className="text-destructive hover:text-destructive">
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
        {catalogs.length === 0 && (
          <p className="text-center text-muted-foreground py-10">Nenhum catálogo cadastrado. Clique em "Novo Catálogo" para começar.</p>
        )}
      </div>
    </div>
  );
};

export default CatalogManagement;
