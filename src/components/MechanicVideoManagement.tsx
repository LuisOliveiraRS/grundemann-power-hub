import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Video, Plus, Trash2, Edit, Loader2, X, Save } from "lucide-react";

interface MechanicVideo {
  id: string;
  title: string;
  description: string;
  video_url: string;
  category: string;
  is_active: boolean;
  created_at: string;
}

const MechanicVideoManagement = () => {
  const { toast } = useToast();
  const [videos, setVideos] = useState<MechanicVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<MechanicVideo | null>(null);
  const [form, setForm] = useState({ title: "", description: "", video_url: "", category: "Geral", is_active: true });

  useEffect(() => { load(); }, []);

  const load = async () => {
    const { data } = await supabase.from("mechanic_videos").select("*").order("category").order("created_at", { ascending: false });
    setVideos((data || []) as MechanicVideo[]);
    setLoading(false);
  };

  const resetForm = () => {
    setForm({ title: "", description: "", video_url: "", category: "Geral", is_active: true });
    setEditing(null);
  };

  const save = async () => {
    if (!form.title.trim() || !form.video_url.trim()) {
      toast({ title: "Preencha título e URL do vídeo", variant: "destructive" });
      return;
    }
    const data = { title: form.title, description: form.description, video_url: form.video_url, category: form.category, is_active: form.is_active };
    if (editing) {
      const { error } = await supabase.from("mechanic_videos").update(data).eq("id", editing.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Vídeo atualizado!" });
    } else {
      const { error } = await supabase.from("mechanic_videos").insert(data);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Vídeo adicionado!" });
    }
    resetForm();
    load();
  };

  const remove = async (id: string) => {
    if (!confirm("Remover este vídeo?")) return;
    await supabase.from("mechanic_videos").delete().eq("id", id);
    toast({ title: "Vídeo removido!" });
    load();
  };

  const edit = (v: MechanicVideo) => {
    setEditing(v);
    setForm({ title: v.title, description: v.description, video_url: v.video_url, category: v.category, is_active: v.is_active });
  };

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div>
      <div className="mb-6">
        <h2 className="font-heading text-2xl font-bold flex items-center gap-3">
          <Video className="h-7 w-7 text-primary" /> Vídeos para Mecânicos
        </h2>
        <p className="text-muted-foreground mt-1">Adicione vídeos técnicos visíveis na área do mecânico</p>
      </div>

      {/* Form */}
      <div className="bg-card rounded-xl border border-border p-5 mb-6">
        <h3 className="font-heading font-bold text-sm mb-4">{editing ? "Editar Vídeo" : "Adicionar Novo Vídeo"}</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div><Label>Título *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} placeholder="Título do vídeo" /></div>
          <div><Label>URL do Vídeo *</Label><Input value={form.video_url} onChange={e => setForm({ ...form, video_url: e.target.value })} placeholder="https://youtube.com/watch?v=..." /></div>
          <div><Label>Categoria</Label><Input value={form.category} onChange={e => setForm({ ...form, category: e.target.value })} placeholder="Ex: Manutenção, Tutorial" /></div>
          <div className="flex items-center gap-3 pt-6"><Switch checked={form.is_active} onCheckedChange={c => setForm({ ...form, is_active: c })} /><span className="text-sm">Ativo</span></div>
          <div className="sm:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Descrição do vídeo" rows={2} /></div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button onClick={save}><Save className="h-4 w-4 mr-1" />{editing ? "Salvar" : "Adicionar"}</Button>
          {editing && <Button variant="outline" onClick={resetForm}><X className="h-4 w-4 mr-1" />Cancelar</Button>}
        </div>
      </div>

      {/* List */}
      <div className="space-y-3">
        {videos.map(v => (
          <div key={v.id} className="bg-card rounded-xl border border-border p-4 flex items-center justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <Video className="h-4 w-4 text-primary flex-shrink-0" />
                <p className="font-heading font-bold text-sm truncate">{v.title}</p>
                <Badge variant={v.is_active ? "default" : "secondary"} className="text-[10px]">{v.is_active ? "Ativo" : "Inativo"}</Badge>
                <Badge variant="outline" className="text-[10px]">{v.category}</Badge>
              </div>
              <p className="text-xs text-muted-foreground truncate">{v.video_url}</p>
              {v.description && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{v.description}</p>}
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <Button size="sm" variant="outline" onClick={() => edit(v)}><Edit className="h-4 w-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => remove(v.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
            </div>
          </div>
        ))}
        {videos.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhum vídeo cadastrado.</p>}
      </div>
    </div>
  );
};

export default MechanicVideoManagement;
