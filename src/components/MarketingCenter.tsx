import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, Wand2, ImageIcon, Calendar, BarChart3, Search, Plus, Trash2,
  Loader2, Copy, Download, Eye, CheckSquare, Square, Sparkles, Send, Clock,
  Instagram, Facebook, MessageCircle, Mail, FileText, TrendingUp, Package,
  Target, Zap, PenTool, Layers, Archive
} from "lucide-react";

interface Product {
  id: string; name: string; price: number; sku: string | null;
  image_url: string | null; description: string | null; category_id: string | null;
  stock_quantity: number; is_active: boolean;
}

interface Category { id: string; name: string; }

interface Campaign {
  id: string; name: string; description: string | null; type: string;
  status: string; start_date: string | null; end_date: string | null;
  product_ids: string[]; created_at: string;
}

interface Creative {
  id: string; campaign_id: string | null; product_id: string | null;
  title: string; format: string; image_url: string | null;
  headline: string | null; body_text: string | null; hashtags: string | null;
  cta: string | null; status: string; created_at: string;
}

interface MarketingPost {
  id: string; creative_id: string | null; campaign_id: string | null;
  platform: string; scheduled_at: string | null; published_at: string | null;
  status: string; content: string | null; created_at: string;
}

type MarketingTab = "dashboard" | "campaigns" | "ad-generator" | "post-generator" | "library" | "history" | "automation";

const formatLabels: Record<string, string> = {
  post_instagram: "Post Instagram",
  story_instagram: "Story Instagram",
  anuncio_facebook: "Anúncio Facebook",
  banner: "Banner Promocional",
  whatsapp: "WhatsApp",
  email: "E-mail Marketing",
};

const campaignTypeLabels: Record<string, string> = {
  promotion: "Promoção",
  new_products: "Novos Produtos",
  best_sellers: "Mais Vendidos",
  high_stock: "Estoque Alto",
  seasonal: "Sazonal",
};

const platformIcons: Record<string, any> = {
  instagram: Instagram,
  facebook: Facebook,
  whatsapp: MessageCircle,
  email: Mail,
  google: TrendingUp,
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  paused: "bg-accent/20 text-accent-foreground",
  completed: "bg-primary text-primary-foreground",
  scheduled: "bg-secondary/20 text-secondary-foreground",
  published: "bg-primary text-primary-foreground",
};

const MarketingCenter = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<MarketingTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Product selection
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: "", description: "", type: "promotion", start_date: "", end_date: "",
  });
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Generator
  const [genFormat, setGenFormat] = useState("post_instagram");
  const [genCampaignType, setGenCampaignType] = useState("promotion");
  const [genInstructions, setGenInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [prodRes, catRes, campRes, creRes, postRes] = await Promise.all([
      supabase.from("products").select("id, name, price, sku, image_url, description, category_id, stock_quantity, is_active").eq("is_active", true).order("name"),
      supabase.from("categories").select("id, name"),
      supabase.from("marketing_campaigns").select("*").order("created_at", { ascending: false }),
      supabase.from("marketing_creatives").select("*").order("created_at", { ascending: false }),
      supabase.from("marketing_posts").select("*").order("created_at", { ascending: false }),
    ]);
    setProducts((prodRes.data || []) as Product[]);
    setCategories((catRes.data || []) as Category[]);
    setCampaigns((campRes.data || []) as unknown as Campaign[]);
    setCreatives((creRes.data || []) as unknown as Creative[]);
    setPosts((postRes.data || []) as unknown as MarketingPost[]);
  };

  const selectedProducts = products.filter(p => selectedProductIds.has(p.id));
  const filteredProducts = products.filter(p =>
    !productSearch || p.name.toLowerCase().includes(productSearch.toLowerCase()) || (p.sku || "").toLowerCase().includes(productSearch.toLowerCase())
  );

  const toggleProduct = (id: string) => {
    setSelectedProductIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";

  // Campaign CRUD
  const saveCampaign = async () => {
    if (!campaignForm.name) { toast({ title: "Nome da campanha é obrigatório", variant: "destructive" }); return; }
    const data: any = {
      name: campaignForm.name,
      description: campaignForm.description || null,
      type: campaignForm.type,
      start_date: campaignForm.start_date || null,
      end_date: campaignForm.end_date || null,
      product_ids: Array.from(selectedProductIds),
    };
    if (editingCampaign?.id) {
      await supabase.from("marketing_campaigns").update(data).eq("id", editingCampaign.id);
      toast({ title: "Campanha atualizada!" });
    } else {
      await supabase.from("marketing_campaigns").insert(data);
      toast({ title: "Campanha criada!" });
    }
    setEditingCampaign(null);
    setCampaignForm({ name: "", description: "", type: "promotion", start_date: "", end_date: "" });
    setSelectedProductIds(new Set());
    loadAll();
  };

  const deleteCampaign = async (id: string) => {
    if (!confirm("Excluir esta campanha?")) return;
    await supabase.from("marketing_campaigns").delete().eq("id", id);
    toast({ title: "Campanha excluída!" }); loadAll();
  };

  const updateCampaignStatus = async (id: string, status: string) => {
    await supabase.from("marketing_campaigns").update({ status }).eq("id", id);
    toast({ title: `Status: ${status}` }); loadAll();
  };

  // AI Text Generation
  const generateText = async () => {
    if (selectedProductIds.size === 0) { toast({ title: "Selecione ao menos um produto", variant: "destructive" }); return; }
    setGenerating(true);
    setGeneratedText(null);
    try {
      const prods = selectedProducts.map(p => ({
        name: p.name, sku: p.sku, price: p.price,
        category: getCategoryName(p.category_id), description: p.description,
      }));
      const { data, error } = await supabase.functions.invoke("generate-marketing-text", {
        body: { products: prods, format: genFormat, campaignType: genCampaignType, customInstructions: genInstructions },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setGeneratedText(data);
      toast({ title: "Texto gerado com sucesso!" });
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Save creative
  const saveCreative = async (withImage = false) => {
    if (!generatedText) return;
    const product = selectedProducts[0];
    const data: any = {
      title: generatedText.headline || `Criativo - ${product?.name || "Geral"}`,
      format: genFormat,
      product_id: product?.id || null,
      headline: generatedText.headline || null,
      body_text: generatedText.body_text || null,
      hashtags: generatedText.hashtags || null,
      cta: generatedText.cta || null,
      image_url: withImage && product?.image_url ? product.image_url : null,
    };
    await supabase.from("marketing_creatives").insert(data);
    toast({ title: "Criativo salvo na biblioteca!" });
    loadAll();
  };

  // Generate promotional image
  const generatePromotionalImage = async () => {
    if (selectedProducts.length === 0) { toast({ title: "Selecione um produto", variant: "destructive" }); return; }
    const product = selectedProducts[0];
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productName: product.name,
          imageDescription: `Promotional banner for ${product.name}. Include price R$ ${product.price.toFixed(2)}. Professional e-commerce promotional style.`,
          sku: product.sku,
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        toast({ title: "Imagem promocional gerada!", description: "Salva na biblioteca." });
        await supabase.from("marketing_creatives").insert({
          title: `Arte - ${product.name}`,
          format: genFormat,
          product_id: product.id,
          image_url: data.imageUrl,
          headline: generatedText?.headline || null,
          body_text: generatedText?.body_text || null,
          hashtags: generatedText?.hashtags || null,
          cta: generatedText?.cta || null,
        });
        loadAll();
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Schedule post
  const [scheduleDate, setScheduleDate] = useState("");
  const [schedulePlatform, setSchedulePlatform] = useState("instagram");

  const schedulePost = async (creativeId: string) => {
    if (!scheduleDate) { toast({ title: "Defina a data de agendamento", variant: "destructive" }); return; }
    const creative = creatives.find(c => c.id === creativeId);
    await supabase.from("marketing_posts").insert({
      creative_id: creativeId,
      platform: schedulePlatform,
      scheduled_at: scheduleDate,
      status: "scheduled",
      content: creative?.body_text || null,
    });
    toast({ title: "Post agendado!" });
    loadAll();
  };

  const deleteCreative = async (id: string) => {
    if (!confirm("Excluir este criativo?")) return;
    await supabase.from("marketing_creatives").delete().eq("id", id);
    toast({ title: "Criativo excluído!" }); loadAll();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Excluir este post?")) return;
    await supabase.from("marketing_posts").delete().eq("id", id);
    toast({ title: "Post excluído!" }); loadAll();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado!" });
  };

  const subTabs = [
    { key: "dashboard", label: "Dashboard", icon: BarChart3 },
    { key: "campaigns", label: "Campanhas", icon: Target },
    { key: "ad-generator", label: "Gerador de Anúncios", icon: Wand2 },
    { key: "post-generator", label: "Gerador de Posts", icon: PenTool },
    { key: "library", label: "Biblioteca", icon: Layers },
    { key: "history", label: "Histórico", icon: Clock },
    { key: "automation", label: "Automação", icon: Zap },
  ] as const;

  // Product selector component
  const ProductSelector = () => (
    <div className="space-y-3">
      <Label className="text-sm font-semibold">Selecionar Produtos</Label>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar produto por nome ou SKU..."
          value={productSearch}
          onChange={e => setProductSearch(e.target.value)}
          className="pl-10"
        />
      </div>
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map(p => (
            <Badge key={p.id} variant="secondary" className="cursor-pointer gap-1" onClick={() => toggleProduct(p.id)}>
              {p.name} <span className="text-xs">✕</span>
            </Badge>
          ))}
        </div>
      )}
      <div className="max-h-48 overflow-y-auto border rounded-lg divide-y">
        {filteredProducts.slice(0, 50).map(p => (
          <button
            key={p.id}
            onClick={() => toggleProduct(p.id)}
            className={`w-full flex items-center gap-3 p-2 text-left hover:bg-muted/50 transition-colors ${selectedProductIds.has(p.id) ? "bg-primary/10" : ""}`}
          >
            {selectedProductIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
            {p.image_url && <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.sku || "—"} · R$ {p.price.toFixed(2)}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Sub navigation */}
      <div className="flex flex-wrap gap-2 border-b pb-4">
        {subTabs.map(s => {
          const Icon = s.icon;
          return (
            <button
              key={s.key}
              onClick={() => setTab(s.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === s.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}
            >
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* DASHBOARD */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-primary/10"><Target className="h-6 w-6 text-primary" /></div>
                  <div>
                    <p className="text-2xl font-bold">{campaigns.length}</p>
                    <p className="text-sm text-muted-foreground">Campanhas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-secondary/10"><Layers className="h-6 w-6 text-secondary-foreground" /></div>
                  <div>
                    <p className="text-2xl font-bold">{creatives.length}</p>
                    <p className="text-sm text-muted-foreground">Criativos</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-accent/10"><Send className="h-6 w-6 text-accent-foreground" /></div>
                  <div>
                    <p className="text-2xl font-bold">{posts.filter(p => p.status === "published").length}</p>
                    <p className="text-sm text-muted-foreground">Publicados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <div className="p-3 rounded-xl bg-muted"><Clock className="h-6 w-6 text-muted-foreground" /></div>
                  <div>
                    <p className="text-2xl font-bold">{posts.filter(p => p.status === "scheduled").length}</p>
                    <p className="text-sm text-muted-foreground">Agendados</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Quick actions */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => setTab("campaigns")} className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
              <Button onClick={() => setTab("ad-generator")} variant="secondary" className="gap-2"><Wand2 className="h-4 w-4" /> Gerar Anúncio</Button>
              <Button onClick={() => setTab("post-generator")} variant="outline" className="gap-2"><PenTool className="h-4 w-4" /> Gerar Post</Button>
            </CardContent>
          </Card>

          {/* Recent campaigns */}
          {campaigns.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Campanhas Recentes</CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {campaigns.slice(0, 5).map(c => (
                    <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                      <div>
                        <p className="font-medium">{c.name}</p>
                        <p className="text-xs text-muted-foreground">{campaignTypeLabels[c.type] || c.type} · {(c.product_ids || []).length} produtos</p>
                      </div>
                      <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* CAMPAIGNS */}
      {tab === "campaigns" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label>Nome da Campanha *</Label>
                  <Input value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Promoção de Inverno" />
                </div>
                <div>
                  <Label>Tipo</Label>
                  <select value={campaignForm.type} onChange={e => setCampaignForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {Object.entries(campaignTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div>
                  <Label>Data Início</Label>
                  <Input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm(f => ({ ...f, start_date: e.target.value }))} />
                </div>
                <div>
                  <Label>Data Fim</Label>
                  <Input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm(f => ({ ...f, end_date: e.target.value }))} />
                </div>
              </div>
              <div>
                <Label>Descrição</Label>
                <Textarea value={campaignForm.description} onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))} placeholder="Detalhes da campanha..." />
              </div>
              <ProductSelector />
              <div className="flex gap-2">
                <Button onClick={saveCampaign} className="gap-2"><Plus className="h-4 w-4" /> {editingCampaign ? "Atualizar" : "Criar"} Campanha</Button>
                {editingCampaign && <Button variant="outline" onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", description: "", type: "promotion", start_date: "", end_date: "" }); setSelectedProductIds(new Set()); }}>Cancelar</Button>}
              </div>
            </CardContent>
          </Card>

          {/* Campaign list */}
          <div className="space-y-3">
            {campaigns.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold">{c.name}</h3>
                        <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                        <Badge variant="outline">{campaignTypeLabels[c.type] || c.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description || "Sem descrição"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(c.product_ids || []).length} produtos · Criada em {new Date(c.created_at).toLocaleDateString("pt-BR")}
                        {c.start_date && ` · De ${new Date(c.start_date).toLocaleDateString("pt-BR")}`}
                        {c.end_date && ` a ${new Date(c.end_date).toLocaleDateString("pt-BR")}`}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      {c.status === "draft" && <Button size="sm" variant="outline" onClick={() => updateCampaignStatus(c.id, "active")}>Ativar</Button>}
                      {c.status === "active" && <Button size="sm" variant="outline" onClick={() => updateCampaignStatus(c.id, "paused")}>Pausar</Button>}
                      {c.status === "paused" && <Button size="sm" variant="outline" onClick={() => updateCampaignStatus(c.id, "active")}>Retomar</Button>}
                      <Button size="sm" variant="outline" onClick={() => {
                        setEditingCampaign(c);
                        setCampaignForm({ name: c.name, description: c.description || "", type: c.type, start_date: c.start_date?.slice(0, 10) || "", end_date: c.end_date?.slice(0, 10) || "" });
                        setSelectedProductIds(new Set(c.product_ids || []));
                      }}>Editar</Button>
                      <Button size="sm" variant="destructive" onClick={() => deleteCampaign(c.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
            {campaigns.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma campanha criada ainda.</p>}
          </div>
        </div>
      )}

      {/* AD GENERATOR / POST GENERATOR (same UI) */}
      {(tab === "ad-generator" || tab === "post-generator") && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-5 w-5 text-primary" />
                  {tab === "ad-generator" ? "Gerador de Anúncios com IA" : "Gerador de Posts com IA"}
                </CardTitle>
                <CardDescription>Selecione produtos e gere textos publicitários automaticamente</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductSelector />

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Formato</Label>
                    <select value={genFormat} onChange={e => setGenFormat(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(formatLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                  <div>
                    <Label>Tipo de Campanha</Label>
                    <select value={genCampaignType} onChange={e => setGenCampaignType(e.target.value)} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                      {Object.entries(campaignTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                    </select>
                  </div>
                </div>

                <div>
                  <Label>Instruções adicionais (opcional)</Label>
                  <Textarea
                    value={genInstructions}
                    onChange={e => setGenInstructions(e.target.value)}
                    placeholder="Ex: Focar em desconto de 20%, usar tom urgente..."
                    rows={3}
                  />
                </div>

                <div className="flex gap-2">
                  <Button onClick={generateText} disabled={generating || selectedProductIds.size === 0} className="gap-2 flex-1">
                    {generating ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                    Gerar Texto com IA
                  </Button>
                  <Button onClick={generatePromotionalImage} disabled={generatingImage || selectedProductIds.size === 0} variant="secondary" className="gap-2">
                    {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                    Gerar Arte
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Preview panel */}
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Pré-visualização</CardTitle>
              </CardHeader>
              <CardContent>
                {generatedText ? (
                  <div className="space-y-4">
                    {generatedText.headline && (
                      <div>
                        <Label className="text-xs text-muted-foreground">HEADLINE</Label>
                        <p className="text-xl font-bold">{generatedText.headline}</p>
                      </div>
                    )}
                    {generatedText.body_text && (
                      <div>
                        <Label className="text-xs text-muted-foreground">TEXTO PRINCIPAL</Label>
                        <p className="whitespace-pre-wrap text-sm">{generatedText.body_text}</p>
                      </div>
                    )}
                    {generatedText.hashtags && (
                      <div>
                        <Label className="text-xs text-muted-foreground">HASHTAGS</Label>
                        <p className="text-sm text-primary">{generatedText.hashtags}</p>
                      </div>
                    )}
                    {generatedText.cta && (
                      <div>
                        <Label className="text-xs text-muted-foreground">CTA</Label>
                        <Button size="sm" className="mt-1">{generatedText.cta}</Button>
                      </div>
                    )}
                    <div className="flex gap-2 pt-4 border-t">
                      <Button size="sm" variant="outline" className="gap-1" onClick={() => copyToClipboard(
                        `${generatedText.headline || ""}\n\n${generatedText.body_text || ""}\n\n${generatedText.hashtags || ""}`
                      )}>
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>
                      <Button size="sm" className="gap-1" onClick={() => saveCreative(true)}>
                        <Archive className="h-3 w-3" /> Salvar na Biblioteca
                      </Button>
                      <Button size="sm" variant="secondary" className="gap-1" onClick={generateText} disabled={generating}>
                        <Sparkles className="h-3 w-3" /> Regenerar
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12 text-muted-foreground">
                    <Wand2 className="h-12 w-12 mx-auto mb-3 opacity-30" />
                    <p>Selecione produtos e clique em "Gerar Texto com IA"</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Selected products preview */}
            {selectedProducts.length > 0 && (
              <Card>
                <CardHeader><CardTitle className="text-sm">Produtos Selecionados ({selectedProducts.length})</CardTitle></CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {selectedProducts.map(p => (
                      <div key={p.id} className="flex items-center gap-2 p-2 bg-muted/30 rounded">
                        {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-medium truncate">{p.name}</p>
                          <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* LIBRARY */}
      {tab === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Biblioteca de Criativos ({creatives.length})</h2>
          </div>
          {creatives.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhum criativo salvo. Gere anúncios ou posts para começar.</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map(c => (
                <Card key={c.id} className="overflow-hidden">
                  {c.image_url && <img src={c.image_url} alt="" className="w-full h-40 object-cover" />}
                  <CardContent className="pt-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate">{c.title}</h3>
                      <Badge variant="outline" className="text-xs">{formatLabels[c.format] || c.format}</Badge>
                    </div>
                    {c.headline && <p className="text-sm font-semibold">{c.headline}</p>}
                    {c.body_text && <p className="text-xs text-muted-foreground line-clamp-3">{c.body_text}</p>}
                    {c.hashtags && <p className="text-xs text-primary">{c.hashtags}</p>}
                    <div className="flex gap-2 pt-2">
                      <Button size="sm" variant="outline" className="gap-1 flex-1" onClick={() => copyToClipboard(
                        `${c.headline || ""}\n\n${c.body_text || ""}\n\n${c.hashtags || ""}`
                      )}>
                        <Copy className="h-3 w-3" /> Copiar
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1" onClick={() => deleteCreative(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                    <div className="flex gap-2">
                      <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="text-xs h-8" />
                      <Button size="sm" variant="secondary" className="gap-1 shrink-0" onClick={() => schedulePost(c.id)}>
                        <Calendar className="h-3 w-3" /> Agendar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* HISTORY */}
      {tab === "history" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico de Publicações ({posts.length})</h2>
          {posts.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">Nenhuma publicação agendada ou publicada.</p>
          ) : (
            <div className="space-y-3">
              {posts.map(p => {
                const PlatformIcon = platformIcons[p.platform] || Send;
                return (
                  <Card key={p.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <PlatformIcon className="h-5 w-5 text-primary" />
                          <div>
                            <p className="font-medium text-sm capitalize">{p.platform}</p>
                            <p className="text-xs text-muted-foreground">
                              {p.scheduled_at ? `Agendado: ${new Date(p.scheduled_at).toLocaleString("pt-BR")}` : "Sem agendamento"}
                            </p>
                            {p.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{p.content}</p>}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={statusColors[p.status] || ""}>{p.status}</Badge>
                          <Button size="sm" variant="destructive" onClick={() => deletePost(p.id)}><Trash2 className="h-3 w-3" /></Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* AUTOMATION */}
      {tab === "automation" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automação de Marketing</CardTitle>
              <CardDescription>Regras automáticas para gerar conteúdo baseado em eventos do catálogo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Package, title: "Novo Produto Cadastrado", desc: "Gerar sugestão de post automático quando um novo produto for adicionado ao catálogo.", badge: "Em breve" },
                { icon: TrendingUp, title: "Produto em Promoção", desc: "Criar anúncio automático quando um produto receber preço promocional.", badge: "Em breve" },
                { icon: Archive, title: "Estoque Alto", desc: "Sugerir campanha promocional quando o estoque de um produto estiver acima da média.", badge: "Em breve" },
                { icon: Eye, title: "Produto em Destaque", desc: "Gerar campanha quando um produto for marcado como destaque.", badge: "Em breve" },
              ].map((auto, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0"><auto.icon className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{auto.title}</h3>
                      <Badge variant="outline" className="text-xs">{auto.badge}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">{auto.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Suggestions based on current data */}
          <Card>
            <CardHeader><CardTitle className="text-lg">Sugestões Automáticas</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {products.filter(p => p.stock_quantity > 20).slice(0, 3).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Estoque: {p.stock_quantity} un — Sugestão: campanha promocional</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => { setSelectedProductIds(new Set([p.id])); setTab("ad-generator"); }}>
                    Criar Anúncio
                  </Button>
                </div>
              ))}
              {products.filter(p => p.stock_quantity > 20).length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma sugestão automática no momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
};

export default MarketingCenter;
