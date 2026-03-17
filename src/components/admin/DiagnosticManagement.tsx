import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  Plus, Trash2, Save, AlertTriangle, Package, Wrench, GripVertical,
} from "lucide-react";

interface Problem {
  id: string; name: string; slug: string; description: string;
  icon_name: string; display_order: number; is_active: boolean;
}

interface Cause {
  id: string; problem_id: string; cause_text: string; display_order: number;
}

interface ProductTag {
  id: string; problem_id: string; search_tag: string; display_order: number;
}

interface Kit {
  id: string; name: string; slug: string; description: string;
  kit_type: string; problem_id: string | null; model_id: string | null;
  discount_pct: number; is_active: boolean;
}

interface KitItem {
  id: string; kit_id: string; product_id: string; quantity: number;
  product?: { name: string; price: number; image_url: string | null };
}

const DiagnosticManagement = () => {
  const { toast } = useToast();
  const [problems, setProblems] = useState<Problem[]>([]);
  const [causes, setCauses] = useState<Cause[]>([]);
  const [tags, setTags] = useState<ProductTag[]>([]);
  const [kits, setKits] = useState<Kit[]>([]);
  const [kitItems, setKitItems] = useState<KitItem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<Problem | null>(null);
  const [newCause, setNewCause] = useState("");
  const [newTag, setNewTag] = useState("");
  const [newProblemName, setNewProblemName] = useState("");
  const [newProblemDesc, setNewProblemDesc] = useState("");
  const [newKitName, setNewKitName] = useState("");
  const [newKitType, setNewKitType] = useState("basic");
  const [newKitProblemId, setNewKitProblemId] = useState("");
  const [productSearch, setProductSearch] = useState("");
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedKit, setSelectedKit] = useState<Kit | null>(null);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [pRes, kRes] = await Promise.all([
      supabase.from("diagnostic_problems").select("*").order("display_order"),
      supabase.from("maintenance_kits").select("*").order("created_at", { ascending: false }),
    ]);
    setProblems((pRes.data || []) as Problem[]);
    setKits((kRes.data || []) as Kit[]);
  };

  const selectProblem = async (p: Problem) => {
    setSelectedProblem(p);
    const [cRes, tRes] = await Promise.all([
      supabase.from("diagnostic_causes").select("*").eq("problem_id", p.id).order("display_order"),
      supabase.from("diagnostic_product_tags").select("*").eq("problem_id", p.id).order("display_order"),
    ]);
    setCauses((cRes.data || []) as Cause[]);
    setTags((tRes.data || []) as ProductTag[]);
  };

  const generateSlug = (name: string) =>
    name.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9\s-]/g, "").replace(/\s+/g, "-").replace(/-+/g, "-").trim();

  const addProblem = async () => {
    if (!newProblemName.trim()) return;
    const { error } = await supabase.from("diagnostic_problems").insert({
      name: newProblemName, slug: generateSlug(newProblemName),
      description: newProblemDesc, display_order: problems.length + 1,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewProblemName(""); setNewProblemDesc("");
    toast({ title: "Problema adicionado!" }); loadData();
  };

  const toggleProblemActive = async (p: Problem) => {
    await supabase.from("diagnostic_problems").update({ is_active: !p.is_active }).eq("id", p.id);
    loadData();
  };

  const deleteProblem = async (id: string) => {
    if (!confirm("Excluir este problema e todas as causas/tags vinculadas?")) return;
    await supabase.from("diagnostic_problems").delete().eq("id", id);
    if (selectedProblem?.id === id) { setSelectedProblem(null); setCauses([]); setTags([]); }
    toast({ title: "Problema excluído" }); loadData();
  };

  const addCause = async () => {
    if (!newCause.trim() || !selectedProblem) return;
    await supabase.from("diagnostic_causes").insert({
      problem_id: selectedProblem.id, cause_text: newCause, display_order: causes.length + 1,
    });
    setNewCause(""); selectProblem(selectedProblem);
  };

  const deleteCause = async (id: string) => {
    await supabase.from("diagnostic_causes").delete().eq("id", id);
    if (selectedProblem) selectProblem(selectedProblem);
  };

  const addTag = async () => {
    if (!newTag.trim() || !selectedProblem) return;
    await supabase.from("diagnostic_product_tags").insert({
      problem_id: selectedProblem.id, search_tag: newTag, display_order: tags.length + 1,
    });
    setNewTag(""); selectProblem(selectedProblem);
  };

  const deleteTag = async (id: string) => {
    await supabase.from("diagnostic_product_tags").delete().eq("id", id);
    if (selectedProblem) selectProblem(selectedProblem);
  };

  const addKit = async () => {
    if (!newKitName.trim()) return;
    const { error } = await supabase.from("maintenance_kits").insert({
      name: newKitName, slug: generateSlug(newKitName), kit_type: newKitType,
      problem_id: newKitProblemId || null,
    });
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    setNewKitName(""); toast({ title: "Kit criado!" }); loadData();
  };

  const deleteKit = async (id: string) => {
    if (!confirm("Excluir este kit?")) return;
    await supabase.from("maintenance_kits").delete().eq("id", id);
    if (selectedKit?.id === id) setSelectedKit(null);
    toast({ title: "Kit excluído" }); loadData();
  };

  const selectKit = async (kit: Kit) => {
    setSelectedKit(kit);
    const { data } = await supabase
      .from("kit_items")
      .select("*, product:products(name, price, image_url)")
      .eq("kit_id", kit.id);
    setKitItems((data || []) as KitItem[]);
  };

  const searchProducts = async (q: string) => {
    setProductSearch(q);
    if (q.length < 2) { setSearchResults([]); return; }
    const { data } = await supabase
      .from("products")
      .select("id, name, price, sku, image_url")
      .eq("is_active", true)
      .or(`name.ilike.%${q}%,sku.ilike.%${q}%`)
      .limit(10);
    setSearchResults(data || []);
  };

  const addProductToKit = async (productId: string) => {
    if (!selectedKit) return;
    const exists = kitItems.some((i) => i.product_id === productId);
    if (exists) { toast({ title: "Produto já está no kit" }); return; }
    await supabase.from("kit_items").insert({ kit_id: selectedKit.id, product_id: productId });
    selectKit(selectedKit);
    setProductSearch(""); setSearchResults([]);
  };

  const removeKitItem = async (id: string) => {
    await supabase.from("kit_items").delete().eq("id", id);
    if (selectedKit) selectKit(selectedKit);
  };

  return (
    <Tabs defaultValue="problems" className="space-y-6">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="problems" className="gap-2"><AlertTriangle className="h-4 w-4" /> Problemas & Causas</TabsTrigger>
        <TabsTrigger value="kits" className="gap-2"><Package className="h-4 w-4" /> Kits de Manutenção</TabsTrigger>
      </TabsList>

      <TabsContent value="problems" className="space-y-6">
        {/* Add new problem */}
        <Card>
          <CardHeader><CardTitle className="text-base">Adicionar Problema</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Input placeholder="Nome do problema" value={newProblemName} onChange={(e) => setNewProblemName(e.target.value)} className="flex-1" />
            <Input placeholder="Descrição" value={newProblemDesc} onChange={(e) => setNewProblemDesc(e.target.value)} className="flex-1" />
            <Button onClick={addProblem} className="gap-2"><Plus className="h-4 w-4" /> Adicionar</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Problem list */}
          <Card>
            <CardHeader><CardTitle className="text-base">Problemas Cadastrados ({problems.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {problems.map((p) => (
                <button
                  key={p.id}
                  onClick={() => selectProblem(p)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedProblem?.id === p.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                  </div>
                  <Switch checked={p.is_active} onCheckedChange={() => toggleProblemActive(p)} onClick={(e) => e.stopPropagation()} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteProblem(p.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </button>
              ))}
            </CardContent>
          </Card>

          {/* Selected problem details */}
          {selectedProblem && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedProblem.name}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Causes */}
                <div>
                  <h4 className="text-sm font-bold mb-2">Causas ({causes.length})</h4>
                  <div className="space-y-1.5 mb-3 max-h-48 overflow-y-auto">
                    {causes.map((c) => (
                      <div key={c.id} className="flex items-center gap-2 text-sm p-2 bg-muted/30 rounded-lg">
                        <span className="flex-1">{c.cause_text}</span>
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteCause(c.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Nova causa..." value={newCause} onChange={(e) => setNewCause(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addCause()} className="flex-1" />
                    <Button onClick={addCause} size="sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                </div>

                {/* Tags */}
                <div>
                  <h4 className="text-sm font-bold mb-2">Tags de Busca de Produtos ({tags.length})</h4>
                  <div className="flex flex-wrap gap-1.5 mb-3">
                    {tags.map((t) => (
                      <Badge key={t.id} variant="secondary" className="gap-1 pr-1">
                        {t.search_tag}
                        <button onClick={() => deleteTag(t.id)} className="ml-1 hover:text-destructive">×</button>
                      </Badge>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <Input placeholder="Nova tag (ex: carburador)..." value={newTag} onChange={(e) => setNewTag(e.target.value)} onKeyDown={(e) => e.key === "Enter" && addTag()} className="flex-1" />
                    <Button onClick={addTag} size="sm"><Plus className="h-4 w-4" /></Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Tags são usadas para buscar produtos automaticamente no catálogo</p>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>

      <TabsContent value="kits" className="space-y-6">
        {/* Add Kit */}
        <Card>
          <CardHeader><CardTitle className="text-base">Criar Kit de Manutenção</CardTitle></CardHeader>
          <CardContent className="flex flex-col md:flex-row gap-3">
            <Input placeholder="Nome do kit" value={newKitName} onChange={(e) => setNewKitName(e.target.value)} className="flex-1" />
            <select
              value={newKitType}
              onChange={(e) => setNewKitType(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="basic">Manutenção Básica</option>
              <option value="complete">Manutenção Completa</option>
              <option value="quick_repair">Reparo Rápido</option>
            </select>
            <select
              value={newKitProblemId}
              onChange={(e) => setNewKitProblemId(e.target.value)}
              className="rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sem problema vinculado</option>
              {problems.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            <Button onClick={addKit} className="gap-2"><Plus className="h-4 w-4" /> Criar Kit</Button>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Kit list */}
          <Card>
            <CardHeader><CardTitle className="text-base">Kits Cadastrados ({kits.length})</CardTitle></CardHeader>
            <CardContent className="space-y-2 max-h-[500px] overflow-y-auto">
              {kits.map((k) => (
                <button
                  key={k.id}
                  onClick={() => selectKit(k)}
                  className={`w-full text-left flex items-center gap-3 p-3 rounded-lg border transition-all ${
                    selectedKit?.id === k.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/30"
                  }`}
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm">{k.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <Badge variant="outline" className="text-[10px]">
                        {k.kit_type === "basic" ? "Básico" : k.kit_type === "complete" ? "Completo" : "Reparo Rápido"}
                      </Badge>
                      {k.discount_pct > 0 && (
                        <Badge variant="secondary" className="text-[10px]">-{k.discount_pct}%</Badge>
                      )}
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteKit(k.id); }}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </button>
              ))}
              {kits.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Nenhum kit cadastrado</p>}
            </CardContent>
          </Card>

          {/* Kit items */}
          {selectedKit && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">{selectedKit.name} - Itens</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Search to add product */}
                <div className="relative">
                  <Input
                    placeholder="Buscar produto para adicionar..."
                    value={productSearch}
                    onChange={(e) => searchProducts(e.target.value)}
                  />
                  {searchResults.length > 0 && (
                    <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-lg shadow-xl z-50 max-h-48 overflow-y-auto">
                      {searchResults.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => addProductToKit(p.id)}
                          className="w-full flex items-center gap-3 px-3 py-2 hover:bg-muted/50 text-sm text-left border-b border-border last:border-0"
                        >
                          {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" />}
                          <span className="flex-1 truncate">{p.name}</span>
                          <span className="text-xs text-muted-foreground">{p.sku}</span>
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Current items */}
                <div className="space-y-2">
                  {kitItems.map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-2 bg-muted/30 rounded-lg">
                      {item.product?.image_url && (
                        <img src={item.product.image_url} alt="" className="h-10 w-10 rounded object-cover" />
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{item.product?.name || "Produto"}</p>
                        <p className="text-xs text-muted-foreground">
                          Qtd: {item.quantity} · R$ {Number(item.product?.price || 0).toFixed(2).replace(".", ",")}
                        </p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => removeKitItem(item.id)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  ))}
                  {kitItems.length === 0 && (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhum produto no kit</p>
                  )}
                </div>

                {kitItems.length > 0 && (
                  <div className="pt-3 border-t border-border">
                    <p className="text-sm font-bold">
                      Total: R$ {kitItems.reduce((s, i) => s + Number(i.product?.price || 0) * i.quantity, 0).toFixed(2).replace(".", ",")}
                    </p>
                    {selectedKit.discount_pct > 0 && (
                      <p className="text-sm text-primary font-bold">
                        Com desconto ({selectedKit.discount_pct}%): R${" "}
                        {(kitItems.reduce((s, i) => s + Number(i.product?.price || 0) * i.quantity, 0) * (1 - selectedKit.discount_pct / 100)).toFixed(2).replace(".", ",")}
                      </p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
};

export default DiagnosticManagement;
