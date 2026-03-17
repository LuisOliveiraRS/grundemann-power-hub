import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Edit, Trash2, Eye, EyeOff, Search } from "lucide-react";

interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  tags: string[];
  read_time: string;
  is_published: boolean;
  image_url: string | null;
  created_at: string;
  problem_id: string | null;
  model_id: string | null;
}

interface DiagProblem { id: string; name: string; }
interface GenModel { id: string; name: string; brand: string | null; }

const ArticleManagement = () => {
  const { toast } = useToast();
  const [articles, setArticles] = useState<Article[]>([]);
  const [search, setSearch] = useState("");
  const [editing, setEditing] = useState<Article | null>(null);
  const [creating, setCreating] = useState(false);
  const [problems, setProblems] = useState<DiagProblem[]>([]);
  const [models, setModels] = useState<GenModel[]>([]);
  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", category: "Manutenção",
    tags: "", read_time: "5 min", is_published: false, image_url: "",
    problem_id: "", model_id: "",
  });

  const fetchArticles = async () => {
    const { data } = await supabase.from("technical_articles").select("*").order("created_at", { ascending: false });
    setArticles((data as any[]) || []);
  };

  useEffect(() => { fetchArticles(); fetchLinkedData(); }, []);

  const fetchLinkedData = async () => {
    const [pRes, mRes] = await Promise.all([
      supabase.from("diagnostic_problems").select("id, name").eq("is_active", true).order("display_order"),
      supabase.from("generator_models").select("id, name, brand").eq("is_active", true).order("name"),
    ]);
    setProblems((pRes.data || []) as DiagProblem[]);
    setModels((mRes.data || []) as GenModel[]);
  };

  const generateSlug = (title: string) =>
    title.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

  const openCreate = () => {
    setEditing(null);
    setCreating(true);
    setForm({ title: "", slug: "", excerpt: "", content: "", category: "Manutenção", tags: "", read_time: "5 min", is_published: false, image_url: "", problem_id: "", model_id: "" });
  };

  const openEdit = (a: Article) => {
    setCreating(false);
    setEditing(a);
    setForm({
      title: a.title, slug: a.slug, excerpt: a.excerpt, content: a.content,
      category: a.category, tags: a.tags.join(", "), read_time: a.read_time,
      is_published: a.is_published, image_url: a.image_url || "",
      problem_id: a.problem_id || "", model_id: a.model_id || "",
    });
  };

  const save = async () => {
    const slug = form.slug || generateSlug(form.title);
    const tags = form.tags.split(",").map(t => t.trim()).filter(Boolean);
    const payload = {
      ...form, slug, tags, image_url: form.image_url || null,
      problem_id: form.problem_id || null,
      model_id: form.model_id || null,
    };

    if (editing) {
      const { error } = await supabase.from("technical_articles").update(payload).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Artigo atualizado!" });
    } else {
      const { error } = await supabase.from("technical_articles").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Artigo criado!" });
    }
    setEditing(null);
    setCreating(false);
    fetchArticles();
  };

  const remove = async (id: string) => {
    if (!confirm("Excluir este artigo?")) return;
    await supabase.from("technical_articles").delete().eq("id", id);
    toast({ title: "Artigo excluído" });
    fetchArticles();
  };

  const togglePublish = async (a: Article) => {
    await supabase.from("technical_articles").update({ is_published: !a.is_published }).eq("id", a.id);
    fetchArticles();
  };

  const filtered = articles.filter(a =>
    !search || a.title.toLowerCase().includes(search.toLowerCase()) || a.category.toLowerCase().includes(search.toLowerCase())
  );

  if (creating || editing) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-heading text-lg font-bold">{editing ? "Editar Artigo" : "Novo Artigo"}</h3>
          <Button variant="outline" onClick={() => { setEditing(null); setCreating(false); }}>Cancelar</Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Título</Label>
            <Input value={form.title} onChange={e => { setForm({ ...form, title: e.target.value, slug: generateSlug(e.target.value) }); }} />
          </div>
          <div>
            <Label>Slug</Label>
            <Input value={form.slug} onChange={e => setForm({ ...form, slug: e.target.value })} />
          </div>
          <div>
            <Label>Categoria</Label>
            <Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Manutenção, Diagnóstico, Dicas..." />
          </div>
          <div>
            <Label>Tempo de leitura</Label>
            <Input value={form.read_time} onChange={e => setForm({ ...form, read_time: e.target.value })} placeholder="5 min" />
          </div>
          <div className="md:col-span-2">
            <Label>Tags (separadas por vírgula)</Label>
            <Input value={form.tags} onChange={e => setForm({ ...form, tags: e.target.value })} placeholder="carburador, regulagem, motor" />
          </div>
          <div className="md:col-span-2">
            <Label>URL da Imagem (opcional)</Label>
            <Input value={form.image_url} onChange={e => setForm({ ...form, image_url: e.target.value })} />
          </div>
        </div>
        <div>
          <Label>Resumo</Label>
          <Textarea value={form.excerpt} onChange={e => setForm({ ...form, excerpt: e.target.value })} rows={2} />
        </div>
        <div>
          <Label>Conteúdo (Markdown)</Label>
          <Textarea value={form.content} onChange={e => setForm({ ...form, content: e.target.value })} rows={16} className="font-mono text-sm" />
        </div>
        <div className="flex items-center gap-3">
          <Switch checked={form.is_published} onCheckedChange={v => setForm({ ...form, is_published: v })} />
          <Label>Publicado</Label>
        </div>
        <Button onClick={save} className="w-full">{editing ? "Salvar Alterações" : "Criar Artigo"}</Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={openCreate}><Plus className="h-4 w-4 mr-2" /> Novo Artigo</Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <table className="w-full text-sm">
          <thead className="bg-muted">
            <tr>
              <th className="text-left p-3 font-medium">Título</th>
              <th className="text-left p-3 font-medium">Categoria</th>
              <th className="text-center p-3 font-medium">Status</th>
              <th className="text-right p-3 font-medium">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map(a => (
              <tr key={a.id} className="border-t border-border hover:bg-muted/30">
                <td className="p-3">
                  <p className="font-medium">{a.title}</p>
                  <p className="text-xs text-muted-foreground">{a.slug}</p>
                </td>
                <td className="p-3"><Badge variant="outline">{a.category}</Badge></td>
                <td className="p-3 text-center">
                  <button onClick={() => togglePublish(a)}>
                    {a.is_published ? <Badge className="bg-primary/15 text-primary"><Eye className="h-3 w-3 mr-1" /> Publicado</Badge>
                      : <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" /> Rascunho</Badge>}
                  </button>
                </td>
                <td className="p-3 text-right space-x-1">
                  <Button size="sm" variant="ghost" onClick={() => openEdit(a)}><Edit className="h-4 w-4" /></Button>
                  <Button size="sm" variant="ghost" onClick={() => remove(a.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                </td>
              </tr>
            ))}
            {filtered.length === 0 && (
              <tr><td colSpan={4} className="p-8 text-center text-muted-foreground">Nenhum artigo encontrado</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ArticleManagement;
