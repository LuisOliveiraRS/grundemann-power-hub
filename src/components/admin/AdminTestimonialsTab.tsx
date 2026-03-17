import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Eye, EyeOff, Star, MessageSquare } from "lucide-react";
import type { Testimonial } from "@/types/admin";

interface AdminTestimonialsTabProps {
  testimonials: Testimonial[];
  onReload: () => void;
}

const AdminTestimonialsTab = ({ testimonials, onReload }: AdminTestimonialsTabProps) => {
  const { toast } = useToast();
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [form, setForm] = useState({ customer_name: "", customer_city: "", rating: "5", comment: "" });

  const saveTestimonial = async () => {
    const data = { customer_name: form.customer_name, customer_city: form.customer_city, rating: parseInt(form.rating) || 5, comment: form.comment, is_approved: true };
    if (editingTestimonial?.id) {
      await supabase.from("testimonials").update(data).eq("id", editingTestimonial.id);
      toast({ title: "Depoimento atualizado!" });
    } else {
      await supabase.from("testimonials").insert(data);
      toast({ title: "Depoimento criado!" });
    }
    setEditingTestimonial(null); setForm({ customer_name: "", customer_city: "", rating: "5", comment: "" }); onReload();
  };

  const toggleApproval = async (id: string, current: boolean) => {
    await supabase.from("testimonials").update({ is_approved: !current }).eq("id", id);
    toast({ title: !current ? "Depoimento aprovado!" : "Depoimento ocultado!" }); onReload();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Excluir este depoimento?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast({ title: "Depoimento excluído!" }); onReload();
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-3xl font-bold">Depoimentos</h1>
          <p className="text-muted-foreground text-sm mt-1">{testimonials.length} depoimentos</p>
        </div>
        <Button onClick={() => { setEditingTestimonial({}); setForm({ customer_name: "", customer_city: "", rating: "5", comment: "" }); }} className="shadow-md"><Plus className="h-4 w-4 mr-2" /> Novo Depoimento</Button>
      </div>

      {editingTestimonial !== null && (
        <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
          <h3 className="font-heading text-lg font-bold mb-4">{editingTestimonial.id ? "Editar" : "Novo"} Depoimento</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nome do Cliente *</Label><Input value={form.customer_name} onChange={(e) => setForm({ ...form, customer_name: e.target.value })} /></div>
            <div><Label>Cidade / Estado</Label><Input value={form.customer_city} onChange={(e) => setForm({ ...form, customer_city: e.target.value })} placeholder="Ex: São Paulo/SP" /></div>
            <div>
              <Label>Avaliação</Label>
              <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.rating} onChange={(e) => setForm({ ...form, rating: e.target.value })}>
                {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
              </select>
            </div>
            <div className="md:col-span-3"><Label>Comentário *</Label><Textarea rows={3} value={form.comment} onChange={(e) => setForm({ ...form, comment: e.target.value })} placeholder="O que o cliente disse..." /></div>
          </div>
          <div className="flex gap-3 mt-5">
            <Button onClick={saveTestimonial}>Salvar Depoimento</Button>
            <Button variant="outline" onClick={() => setEditingTestimonial(null)}>Cancelar</Button>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {testimonials.map(t => (
          <div key={t.id} className={`bg-card rounded-xl border shadow-sm p-5 ${t.is_approved ? "border-border" : "border-accent/30 bg-accent/5"}`}>
            <div className="flex items-start justify-between mb-3">
              <div>
                <p className="font-heading font-bold text-sm">{t.customer_name}</p>
                {t.customer_city && <p className="text-xs text-muted-foreground">{t.customer_city}</p>}
              </div>
              <div className="flex gap-1">
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleApproval(t.id, t.is_approved)}>{t.is_approved ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}</Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => { setEditingTestimonial(t); setForm({ customer_name: t.customer_name, customer_city: t.customer_city, rating: String(t.rating), comment: t.comment }); }}><Edit className="h-3.5 w-3.5" /></Button>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTestimonial(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
              </div>
            </div>
            <div className="flex gap-0.5 mb-2">{Array.from({ length: 5 }).map((_, i) => (<Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />))}</div>
            <p className="text-sm text-card-foreground leading-relaxed">"{t.comment}"</p>
            <div className="mt-3 flex items-center gap-2">
              <Badge variant={t.is_approved ? "default" : "secondary"}>{t.is_approved ? "Aprovado" : "Pendente"}</Badge>
              <span className="text-[10px] text-muted-foreground">{new Date(t.created_at).toLocaleDateString("pt-BR")}</span>
            </div>
          </div>
        ))}
        {testimonials.length === 0 && <p className="col-span-3 text-center text-muted-foreground py-12">Nenhum depoimento cadastrado.</p>}
      </div>
    </div>
  );
};

export default AdminTestimonialsTab;
