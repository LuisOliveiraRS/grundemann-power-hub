import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, Edit, Search, X, Cpu, Link2, Package } from "lucide-react";

interface Model {
  id: string;
  name: string;
  brand: string | null;
  engine_type: string;
  hp: string | null;
  displacement_cc: string | null;
  description: string | null;
  is_active: boolean;
}

interface ProductLink {
  id: string;
  product_id: string;
  model_id: string;
  notes: string | null;
  product_name?: string;
  product_sku?: string;
}

const CompatibilityManager = () => {
  const { toast } = useToast();
  const [models, setModels] = useState<Model[]>([]);
  const [links, setLinks] = useState<ProductLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [form, setForm] = useState({ name: "", brand: "", engine_type: "gasolina", hp: "", displacement_cc: "", description: "" });
  const [showForm, setShowForm] = useState(false);
  const [searchModel, setSearchModel] = useState("");

  // Linking state
  const [linkingModelId, setLinkingModelId] = useState<string | null>(null);
  const [productSearch, setProductSearch] = useState("");
  const [productResults, setProductResults] = useState<any[]>([]);
  const [linkNote, setLinkNote] = useState("");

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    setLoading(true);
    const [modelsRes, linksRes] = await Promise.all([
      supabase.from("generator_models").select("*").order("name"),
      supabase.from("product_models").select("id, product_id, model_id, notes").limit(500),
    ]);
    setModels((modelsRes.data || []) as Model[]);
    
    // Enrich links with product names
    const rawLinks = (linksRes.data || []) as ProductLink[];
    if (rawLinks.length > 0) {
      const productIds = [...new Set(rawLinks.map(l => l.product_id))];
      const { data: prods } = await supabase.from("products").select("id, name, sku").in("id", productIds);
      const prodMap = new Map((prods || []).map(p => [p.id, p]));
      rawLinks.forEach(l => {
        const p = prodMap.get(l.product_id);
        if (p) { l.product_name = p.name; l.product_sku = p.sku; }
      });
    }
    setLinks(rawLinks);
    setLoading(false);
  };

  const resetForm = () => { setForm({ name: "", brand: "", engine_type: "gasolina", hp: "", displacement_cc: "", description: "" }); setEditingModel(null); setShowForm(false); };

  const saveModel = async () => {
    if (!form.name.trim()) { toast({ title: "Nome é obrigatório", variant: "destructive" }); return; }
    const data = { name: form.name, brand: form.brand || null, engine_type: form.engine_type, hp: form.hp || null, displacement_cc: form.displacement_cc || null, description: form.description || null };
    if (editingModel) {
      await supabase.from("generator_models").update(data).eq("id", editingModel.id);
      toast({ title: "Modelo atualizado!" });
    } else {
      await supabase.from("generator_models").insert(data);
      toast({ title: "Modelo criado!" });
    }
    resetForm();
    loadData();
  };

  const deleteModel = async (id: string) => {
    if (!confirm("Excluir este modelo e todas as compatibilidades?")) return;
    await supabase.from("generator_models").delete().eq("id", id);
    toast({ title: "Modelo excluído!" });
    loadData();
  };

  const editModel = (m: Model) => {
    setEditingModel(m);
    setForm({ name: m.name, brand: m.brand || "", engine_type: m.engine_type, hp: m.hp || "", displacement_cc: m.displacement_cc || "", description: m.description || "" });
    setShowForm(true);
  };

  // Product search for linking
  const searchProducts = async (q: string) => {
    if (q.length < 2) { setProductResults([]); return; }
    const { data } = await supabase.rpc("fuzzy_search_products", { search_term: q, hp_filter: null, result_limit: 10 });
    setProductResults(data || []);
  };

  const linkProduct = async (productId: string) => {
    if (!linkingModelId) return;
    const existing = links.find(l => l.product_id === productId && l.model_id === linkingModelId);
    if (existing) { toast({ title: "Produto já vinculado a este modelo", variant: "destructive" }); return; }
    await supabase.from("product_models").insert({ product_id: productId, model_id: linkingModelId, notes: linkNote || null });
    toast({ title: "Compatibilidade adicionada!" });
    setProductSearch("");
    setProductResults([]);
    setLinkNote("");
    loadData();
  };

  const unlinkProduct = async (linkId: string) => {
    await supabase.from("product_models").delete().eq("id", linkId);
    toast({ title: "Compatibilidade removida!" });
    loadData();
  };

  const filteredModels = models.filter(m =>
    !searchModel || m.name.toLowerCase().includes(searchModel.toLowerCase()) || (m.brand || "").toLowerCase().includes(searchModel.toLowerCase())
  );

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar modelos..." value={searchModel} onChange={e => setSearchModel(e.target.value)} className="pl-9" />
        </div>
        <Button onClick={() => { resetForm(); setShowForm(true); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Modelo</Button>
      </div>

      {/* Form */}
      {showForm && (
        <div className="bg-card border border-border rounded-xl p-6 space-y-4">
          <h3 className="font-heading font-bold text-lg">{editingModel ? "Editar Modelo" : "Novo Modelo de Gerador"}</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div><Label>Nome do Modelo *</Label><Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Ex: TG3800, GX160, BD-7.5" className="mt-1" /></div>
            <div><Label>Marca</Label><Input value={form.brand} onChange={e => setForm({ ...form, brand: e.target.value })} placeholder="Ex: Toyama, Honda, Branco" className="mt-1" /></div>
            <div>
              <Label>Tipo de Motor</Label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.engine_type} onChange={e => setForm({ ...form, engine_type: e.target.value })}>
                <option value="gasolina">Gasolina</option>
                <option value="diesel">Diesel</option>
                <option value="gas">Gás (GLP)</option>
                <option value="bifuel">Bifuel</option>
              </select>
            </div>
            <div><Label>Potência (HP)</Label><Input value={form.hp} onChange={e => setForm({ ...form, hp: e.target.value })} placeholder="Ex: 6.5" className="mt-1" /></div>
            <div><Label>Cilindrada (cc)</Label><Input value={form.displacement_cc} onChange={e => setForm({ ...form, displacement_cc: e.target.value })} placeholder="Ex: 196" className="mt-1" /></div>
            <div><Label>Descrição</Label><Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Detalhes do modelo..." className="mt-1" /></div>
          </div>
          <div className="flex gap-2">
            <Button onClick={saveModel}>{editingModel ? "Salvar" : "Criar Modelo"}</Button>
            <Button variant="outline" onClick={resetForm}>Cancelar</Button>
          </div>
        </div>
      )}

      {/* Models list */}
      <div className="space-y-4">
        {filteredModels.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum modelo cadastrado. Clique em "Novo Modelo" para começar.</p>
        ) : filteredModels.map(m => {
          const modelLinks = links.filter(l => l.model_id === m.id);
          const isLinking = linkingModelId === m.id;
          return (
            <div key={m.id} className="bg-card border border-border rounded-xl p-5 space-y-3">
              <div className="flex items-center justify-between flex-wrap gap-2">
                <div className="flex items-center gap-3">
                  <Cpu className="h-5 w-5 text-primary" />
                  <div>
                    <span className="font-heading font-bold text-foreground">{m.name}</span>
                    {m.brand && <Badge variant="secondary" className="ml-2">{m.brand}</Badge>}
                    {m.hp && <Badge variant="outline" className="ml-1">{m.hp}HP</Badge>}
                    <Badge variant="outline" className="ml-1 capitalize">{m.engine_type}</Badge>
                    {m.displacement_cc && <span className="text-xs text-muted-foreground ml-2">{m.displacement_cc}cc</span>}
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => { setLinkingModelId(isLinking ? null : m.id); setProductSearch(""); setProductResults([]); }}><Link2 className="h-4 w-4 mr-1" /> {isLinking ? "Fechar" : "Vincular Peças"}</Button>
                  <Button variant="ghost" size="sm" onClick={() => editModel(m)}><Edit className="h-4 w-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => deleteModel(m.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>

              {/* Linked products */}
              {modelLinks.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {modelLinks.map(l => (
                    <div key={l.id} className="flex items-center gap-1.5 bg-muted rounded-full px-3 py-1 text-xs">
                      <Package className="h-3 w-3 text-muted-foreground" />
                      <span className="font-medium">{l.product_name || l.product_id.slice(0, 8)}</span>
                      {l.product_sku && <span className="text-muted-foreground">({l.product_sku})</span>}
                      {l.notes && <span className="text-muted-foreground italic">— {l.notes}</span>}
                      <button onClick={() => unlinkProduct(l.id)} className="ml-1 text-destructive hover:bg-destructive/10 rounded-full p-0.5"><X className="h-3 w-3" /></button>
                    </div>
                  ))}
                </div>
              )}

              {/* Link product UI */}
              {isLinking && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <div className="flex gap-2">
                    <Input placeholder="Buscar produto por nome ou SKU..." value={productSearch} onChange={e => { setProductSearch(e.target.value); searchProducts(e.target.value); }} className="flex-1" />
                    <Input placeholder="Nota (opcional)" value={linkNote} onChange={e => setLinkNote(e.target.value)} className="w-48" />
                  </div>
                  {productResults.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto">
                      {productResults.map((p: any) => (
                        <button key={p.id} onClick={() => linkProduct(p.id)} className="flex items-center gap-2 p-2 rounded-lg border border-border bg-background hover:border-primary/50 transition-colors text-left text-xs">
                          {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{p.name}</p>
                            <p className="text-muted-foreground">{[p.sku, p.brand, p.hp ? `${p.hp}HP` : null].filter(Boolean).join(" · ")}</p>
                          </div>
                          <Plus className="h-4 w-4 text-primary flex-shrink-0" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default CompatibilityManager;