import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Upload, Trash2, FileText, Loader2, Plus, Search } from "lucide-react";

interface ResellerCatalog {
  id: string;
  title: string;
  description: string | null;
  file_url: string;
  file_name: string;
  file_size: number | null;
  category: string;
  is_active: boolean;
  created_at: string;
}

const ResellerContentManagement = () => {
  const { toast } = useToast();
  const [catalogs, setCatalogs] = useState<ResellerCatalog[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [search, setSearch] = useState("");
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", category: "Tabela de Preços" });
  const [file, setFile] = useState<File | null>(null);

  useEffect(() => { loadCatalogs(); }, []);

  const loadCatalogs = async () => {
    // We'll use technical_catalogs table but filter by a "reseller" category prefix
    const { data } = await supabase.from("technical_catalogs").select("*").ilike("category", "Fornecedor%").order("title");
    setCatalogs((data || []) as ResellerCatalog[]);
    setLoading(false);
  };

  const uploadCatalog = async () => {
    if (!file || !form.title.trim()) {
      toast({ title: "Informe título e arquivo", variant: "destructive" });
      return;
    }
    setUploading(true);
    const ext = file.name.split(".").pop();
    const fileName = `fornecedor-${Date.now()}.${ext}`;
    const { error: uploadErr } = await supabase.storage.from("technical-catalogs").upload(fileName, file);
    if (uploadErr) {
      toast({ title: "Erro no upload", description: uploadErr.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { error } = await supabase.from("technical_catalogs").insert({
      title: form.title,
      description: form.description || null,
      file_url: fileName,
      file_name: file.name,
      file_size: file.size,
      category: `Fornecedor - ${form.category}`,
      is_active: true,
    } as any);
    if (error) {
      toast({ title: "Erro", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Catálogo adicionado!" });
      setShowForm(false);
      setForm({ title: "", description: "", category: "Tabela de Preços" });
      setFile(null);
      loadCatalogs();
    }
    setUploading(false);
  };

  const toggleActive = async (id: string, current: boolean) => {
    await supabase.from("technical_catalogs").update({ is_active: !current } as any).eq("id", id);
    toast({ title: !current ? "Ativado" : "Desativado" });
    loadCatalogs();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este conteúdo?")) return;
    await supabase.from("technical_catalogs").delete().eq("id", id);
    toast({ title: "Removido!" });
    loadCatalogs();
  };

  const filtered = catalogs.filter(c => {
    if (!search) return true;
    const s = search.toLowerCase();
    return c.title.toLowerCase().includes(s) || c.category.toLowerCase().includes(s);
  });

  const categories = ["Tabela de Preços", "Catálogo de Produtos", "Material de Apoio", "Política Comercial", "Outros"];

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="font-heading text-2xl font-bold">Conteúdos para Fornecedores</h2>
          <p className="text-muted-foreground text-sm">PDFs, tabelas de preço e materiais exclusivos para fornecedores</p>
        </div>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="h-4 w-4 mr-2" /> Adicionar Conteúdo
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-5 mb-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>Título *</Label>
              <Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Ex: Tabela de Preços 2026" />
            </div>
            <div>
              <Label>Categoria</Label>
              <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.category} onChange={e => setForm({ ...form, category: e.target.value })}>
                {categories.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="sm:col-span-2">
              <Label>Descrição</Label>
              <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Breve descrição do conteúdo" />
            </div>
            <div className="sm:col-span-2">
              <Label>Arquivo PDF *</Label>
              <Input type="file" accept=".pdf,.doc,.docx,.xls,.xlsx" onChange={e => setFile(e.target.files?.[0] || null)} />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <Button onClick={uploadCatalog} disabled={uploading}>
              {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
              Enviar
            </Button>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="relative max-w-sm mb-4">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input className="pl-9" placeholder="Buscar..." value={search} onChange={e => setSearch(e.target.value)} />
      </div>

      <div className="space-y-3">
        {filtered.map(catalog => (
          <div key={catalog.id} className="bg-card rounded-xl border border-border p-4 flex items-center gap-4">
            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-sm">{catalog.title}</p>
              <div className="flex items-center gap-2 mt-0.5">
                <Badge variant="outline" className="text-xs">{catalog.category.replace("Fornecedor - ", "")}</Badge>
                {catalog.description && <span className="text-xs text-muted-foreground truncate">{catalog.description}</span>}
              </div>
            </div>
            <div className="flex items-center gap-2 flex-shrink-0">
              <Badge className={catalog.is_active ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground"}>
                {catalog.is_active ? "Ativo" : "Inativo"}
              </Badge>
              <Button size="sm" variant="outline" onClick={() => toggleActive(catalog.id, catalog.is_active)}>
                {catalog.is_active ? "Desativar" : "Ativar"}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => remove(catalog.id)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
          </div>
        ))}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-muted-foreground">Nenhum conteúdo encontrado para fornecedores.</div>
        )}
      </div>
    </div>
  );
};

export default ResellerContentManagement;
