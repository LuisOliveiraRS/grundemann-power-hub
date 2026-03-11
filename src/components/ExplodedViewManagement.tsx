import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Upload, Loader2, Eye, EyeOff, X, ImageIcon, FileText } from "lucide-react";

interface ExplodedView {
  id: string;
  title: string;
  description: string;
  engine_type: string;
  section_label: string;
  section_name: string;
  search_term: string;
  image_url: string;
  display_order: number;
  is_active: boolean;
  created_at: string;
}

const ExplodedViewManagement = () => {
  const { toast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [views, setViews] = useState<ExplodedView[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    title: "", description: "", engine_type: "gasolina",
    section_label: "", section_name: "", search_term: "",
    image_url: "", display_order: "0",
  });

  useEffect(() => { loadViews(); }, []);

  const loadViews = async () => {
    const { data } = await supabase
      .from("exploded_views")
      .select("*")
      .order("engine_type")
      .order("display_order");
    setViews((data as ExplodedView[]) || []);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", engine_type: "gasolina", section_label: "", section_name: "", search_term: "", image_url: "", display_order: "0" });
    setEditingId(null);
  };

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
    const isPdf = ext === "pdf";
    const bucket = isPdf ? "technical-catalogs" : "product-images";
    const fileName = `exploded-${Date.now()}.${ext}`;
    
    const { error } = await supabase.storage.from(bucket).upload(fileName, file);
    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      setUploading(false);
      return;
    }
    const { data } = supabase.storage.from(bucket).getPublicUrl(fileName);
    setForm(f => ({ ...f, image_url: data.publicUrl }));
    toast({ title: isPdf ? "PDF enviado!" : "Imagem enviada!" });
    setUploading(false);
  };

  const saveView = async () => {
    if (!form.section_name.trim() || !form.image_url.trim()) {
      toast({ title: "Preencha nome da seção e arquivo", variant: "destructive" });
      return;
    }
    const payload = {
      title: form.title || form.section_name,
      description: form.description,
      engine_type: form.engine_type,
      section_label: form.section_label,
      section_name: form.section_name,
      search_term: form.search_term,
      image_url: form.image_url,
      display_order: parseInt(form.display_order) || 0,
    };

    if (editingId) {
      const { error } = await supabase.from("exploded_views").update(payload).eq("id", editingId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Vista explodida atualizada!" });
    } else {
      const { error } = await supabase.from("exploded_views").insert(payload);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Vista explodida cadastrada!" });
    }
    resetForm();
    setShowForm(false);
    loadViews();
  };

  const editView = (v: ExplodedView) => {
    setForm({
      title: v.title, description: v.description || "", engine_type: v.engine_type,
      section_label: v.section_label, section_name: v.section_name,
      search_term: v.search_term || "", image_url: v.image_url,
      display_order: String(v.display_order),
    });
    setEditingId(v.id);
    setShowForm(true);
  };

  const toggleActive = async (v: ExplodedView) => {
    await supabase.from("exploded_views").update({ is_active: !v.is_active }).eq("id", v.id);
    toast({ title: v.is_active ? "Desativada" : "Ativada" });
    loadViews();
  };

  const deleteView = async (v: ExplodedView) => {
    if (!confirm(`Excluir "${v.section_name}"?`)) return;
    await supabase.from("exploded_views").delete().eq("id", v.id);
    toast({ title: "Vista excluída!" });
    loadViews();
  };

  const isPdf = (url: string) => url.toLowerCase().endsWith(".pdf");

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="h-6 w-6 animate-spin" /></div>;

  const gasolinaViews = views.filter(v => v.engine_type === "gasolina");
  const dieselViews = views.filter(v => v.engine_type === "diesel");

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <p className="text-muted-foreground text-sm">{views.length} vista(s) cadastrada(s)</p>
        <Button onClick={() => { resetForm(); setShowForm(!showForm); }}>
          <Plus className="h-4 w-4 mr-2" /> Nova Vista Explodida
        </Button>
      </div>

      {showForm && (
        <div className="bg-card rounded-xl border border-border p-6 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-heading font-bold text-foreground">{editingId ? "Editar" : "Adicionar"} Vista Explodida</h3>
            <button onClick={() => { setShowForm(false); resetForm(); }}><X className="h-5 w-5 text-muted-foreground" /></button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <div>
              <Label>Nome da Seção *</Label>
              <Input value={form.section_name} onChange={e => setForm(f => ({ ...f, section_name: e.target.value }))} placeholder="Ex: Cabeçote" />
            </div>
            <div>
              <Label>Número / Label</Label>
              <Input value={form.section_label} onChange={e => setForm(f => ({ ...f, section_label: e.target.value }))} placeholder="Ex: 01" />
            </div>
            <div>
              <Label>Tipo de Motor</Label>
              <select value={form.engine_type} onChange={e => setForm(f => ({ ...f, engine_type: e.target.value }))} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
                <option value="gasolina">Motor Gasolina</option>
                <option value="diesel">Motor Diesel</option>
              </select>
            </div>
            <div>
              <Label>Termo de Busca (para produtos)</Label>
              <Input value={form.search_term} onChange={e => setForm(f => ({ ...f, search_term: e.target.value }))} placeholder="Ex: cabeçote" />
            </div>
            <div>
              <Label>Ordem de Exibição</Label>
              <Input type="number" value={form.display_order} onChange={e => setForm(f => ({ ...f, display_order: e.target.value }))} />
            </div>
            <div className="sm:col-span-2 lg:col-span-3">
              <Label>Descrição</Label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} placeholder="Descrição das peças desta seção" rows={2} />
            </div>
          </div>

          {/* File upload - images and PDFs */}
          <div>
            <Label>Imagem ou PDF da Vista Explodida *</Label>
            <div className="mt-2 flex items-start gap-4">
              {form.image_url ? (
                <div className="relative">
                  {isPdf(form.image_url) ? (
                    <div className="h-32 w-40 rounded-lg border border-border bg-muted flex flex-col items-center justify-center">
                      <FileText className="h-10 w-10 text-primary mb-1" />
                      <p className="text-[10px] text-muted-foreground">PDF</p>
                    </div>
                  ) : (
                    <img src={form.image_url} alt="Preview" className="h-32 w-40 object-contain rounded-lg border border-border bg-background" />
                  )}
                  <button onClick={() => setForm(f => ({ ...f, image_url: "" }))} className="absolute -top-2 -right-2 bg-destructive text-destructive-foreground rounded-full p-1"><X className="h-3 w-3" /></button>
                </div>
              ) : (
                <div
                  onClick={() => fileRef.current?.click()}
                  className="h-32 w-40 rounded-lg border-2 border-dashed border-border hover:border-primary/50 cursor-pointer flex flex-col items-center justify-center"
                >
                  {uploading ? <Loader2 className="h-6 w-6 animate-spin text-primary" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                  <p className="text-xs text-muted-foreground mt-1">{uploading ? "Enviando..." : "Imagem ou PDF"}</p>
                </div>
              )}
              <div className="flex-1">
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="Ou cole a URL do arquivo..." className="text-xs" />
              </div>
            </div>
            <input ref={fileRef} type="file" accept="image/*,.pdf" className="hidden" onChange={e => { if (e.target.files?.[0]) handleFileUpload(e.target.files[0]); }} />
          </div>

          <div className="flex gap-3">
            <Button onClick={saveView}>{editingId ? "Atualizar" : "Cadastrar"}</Button>
            <Button variant="outline" onClick={() => { setShowForm(false); resetForm(); }}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Views list */}
      {[
        { label: "Motor Gasolina", items: gasolinaViews, color: "text-primary" },
        { label: "Motor Diesel", items: dieselViews, color: "text-secondary" },
      ].map(group => group.items.length > 0 && (
        <div key={group.label}>
          <h3 className="font-heading font-bold text-sm text-foreground mb-3 flex items-center gap-2">
            <span className={group.color}>●</span> {group.label} ({group.items.length})
          </h3>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {group.items.map(v => (
              <div key={v.id} className={`rounded-xl border overflow-hidden transition-opacity ${v.is_active ? "border-border" : "border-border/50 opacity-50"}`}>
                <div className="aspect-square bg-background p-1">
                  {isPdf(v.image_url) ? (
                    <div className="w-full h-full flex flex-col items-center justify-center bg-muted rounded-lg">
                      <FileText className="h-12 w-12 text-primary mb-1" />
                      <p className="text-xs text-muted-foreground">PDF</p>
                    </div>
                  ) : (
                    <img src={v.image_url} alt={v.section_name} className="w-full h-full object-contain" />
                  )}
                </div>
                <div className="p-3 bg-card">
                  <div className="flex items-center gap-1.5 mb-1">
                    {v.section_label && <Badge variant="outline" className="text-[10px]">{v.section_label}</Badge>}
                    <p className="font-heading font-bold text-xs text-foreground truncate">{v.section_name}</p>
                  </div>
                  <div className="flex items-center gap-1 mt-2">
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => editView(v)} title="Editar">
                      <ImageIcon className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleActive(v)} title={v.is_active ? "Desativar" : "Ativar"}>
                      {v.is_active ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={() => deleteView(v)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}

      {views.length === 0 && (
        <p className="text-center text-muted-foreground py-10">Nenhuma vista explodida cadastrada.</p>
      )}
    </div>
  );
};

export default ExplodedViewManagement;
