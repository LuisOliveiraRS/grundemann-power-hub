import { useState, useEffect, useRef, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import {
  Megaphone, Wand2, ImageIcon, Calendar, BarChart3, Search, Plus, Trash2,
  Loader2, Copy, Download, Eye, CheckSquare, Square, Sparkles, Send, Clock,
  Instagram, Facebook, MessageCircle, Mail, FileText, TrendingUp, Package,
  Target, Zap, PenTool, Layers, Archive, ArrowRight, ArrowLeft, Check,
  Share2, ExternalLink, RefreshCw, ChevronRight, Printer, Globe
} from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface Product {
  id: string; name: string; price: number; sku: string | null;
  image_url: string | null; description: string | null; category_id: string | null;
  stock_quantity: number; is_active: boolean; original_price: number | null;
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

type MarketingTab = "dashboard" | "campaigns" | "wizard" | "library" | "history" | "automation";

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
  google: Globe,
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram",
  facebook: "Facebook",
  whatsapp: "WhatsApp",
  email: "E-mail",
  google: "Google",
};

const statusColors: Record<string, string> = {
  draft: "bg-muted text-muted-foreground",
  active: "bg-primary/20 text-primary",
  paused: "bg-accent/20 text-accent-foreground",
  completed: "bg-primary text-primary-foreground",
  scheduled: "bg-secondary text-secondary-foreground",
  published: "bg-primary text-primary-foreground",
};

const WIZARD_STEPS = [
  { key: "products", label: "Produtos", icon: Package },
  { key: "config", label: "Configuração", icon: Target },
  { key: "generate", label: "Gerar Conteúdo", icon: Wand2 },
  { key: "preview", label: "Pré-visualização", icon: Eye },
  { key: "publish", label: "Publicar", icon: Send },
];

const MarketingCenter = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<MarketingTab>("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [creatives, setCreatives] = useState<Creative[]>([]);
  const [posts, setPosts] = useState<MarketingPost[]>([]);
  const [loading, setLoading] = useState(false);

  // Wizard state
  const [wizardStep, setWizardStep] = useState(0);
  const [productSearch, setProductSearch] = useState("");
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());
  const [genFormat, setGenFormat] = useState("post_instagram");
  const [genCampaignType, setGenCampaignType] = useState("promotion");
  const [genInstructions, setGenInstructions] = useState("");
  const [generating, setGenerating] = useState(false);
  const [generatedText, setGeneratedText] = useState<any>(null);
  const [generatingImage, setGeneratingImage] = useState(false);
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);

  // Publish state
  const [publishPlatforms, setPublishPlatforms] = useState<Set<string>>(new Set(["instagram"]));
  const [scheduleDate, setScheduleDate] = useState("");
  const [publishMode, setPublishMode] = useState<"now" | "schedule" | "save">("save");

  // Campaign form
  const [campaignForm, setCampaignForm] = useState({
    name: "", description: "", type: "promotion", start_date: "", end_date: "",
  });
  const [editingCampaign, setEditingCampaign] = useState<Campaign | null>(null);

  // Preview dialog
  const [previewCreative, setPreviewCreative] = useState<Creative | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [prodRes, catRes, campRes, creRes, postRes] = await Promise.all([
      supabase.from("products").select("id, name, price, sku, image_url, description, category_id, stock_quantity, is_active, original_price").eq("is_active", true).order("name"),
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

  const togglePlatform = (p: string) => {
    setPublishPlatforms(prev => {
      const next = new Set(prev);
      next.has(p) ? next.delete(p) : next.add(p);
      return next;
    });
  };

  // Campaign CRUD
  const saveCampaign = async () => {
    if (!campaignForm.name) { toast({ title: "Nome da campanha é obrigatório", variant: "destructive" }); return; }
    const data: any = {
      name: campaignForm.name, description: campaignForm.description || null,
      type: campaignForm.type, start_date: campaignForm.start_date || null,
      end_date: campaignForm.end_date || null, product_ids: Array.from(selectedProductIds),
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
    if (selectedProductIds.size === 0) return;
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
      toast({ title: "Erro ao gerar texto", description: err.message, variant: "destructive" });
    } finally {
      setGenerating(false);
    }
  };

  // Generate promotional image
  const generatePromotionalImage = async () => {
    if (selectedProducts.length === 0) return;
    const product = selectedProducts[0];
    setGeneratingImage(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: {
          productName: product.name,
          imageDescription: `Promotional banner for ${product.name}. Price R$ ${product.price.toFixed(2)}. Professional e-commerce promotional style.`,
          sku: product.sku,
        },
      });
      if (error) throw error;
      if (data?.imageUrl) {
        setGeneratedImageUrl(data.imageUrl);
        toast({ title: "Imagem promocional gerada!" });
      } else {
        throw new Error("Não foi possível gerar a imagem");
      }
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingImage(false);
    }
  };

  // Build full text for copy/download
  const buildFullText = (text: any = generatedText) => {
    if (!text) return "";
    const parts: string[] = [];
    if (text.headline) parts.push(text.headline);
    if (text.short_description) parts.push(text.short_description);
    if (text.body_text) parts.push("", text.body_text);
    if (text.cta) parts.push("", `👉 ${text.cta}`);
    if (text.hashtags) parts.push("", text.hashtags);
    return parts.join("\n");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copiado para a área de transferência!" });
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = blobUrl; a.download = filename; a.click();
      URL.revokeObjectURL(blobUrl);
    } catch {
      window.open(url, "_blank");
    }
  };

  // Save creative + optionally publish
  const finalizeWizard = async () => {
    if (!generatedText) return;
    setLoading(true);
    try {
      const product = selectedProducts[0];
      const creativeData: any = {
        title: generatedText.headline || `Criativo - ${product?.name || "Geral"}`,
        format: genFormat,
        product_id: product?.id || null,
        headline: generatedText.headline || null,
        body_text: generatedText.body_text || null,
        hashtags: generatedText.hashtags || null,
        cta: generatedText.cta || null,
        image_url: generatedImageUrl || product?.image_url || null,
        status: publishMode === "save" ? "draft" : "published",
      };

      const { data: savedCreative, error: creativeError } = await supabase
        .from("marketing_creatives").insert(creativeData).select().single();
      if (creativeError) throw creativeError;

      if (publishMode !== "save" && savedCreative) {
        const postInserts = Array.from(publishPlatforms).map(platform => ({
          creative_id: savedCreative.id,
          platform,
          status: publishMode === "schedule" ? "scheduled" : "published",
          scheduled_at: publishMode === "schedule" ? scheduleDate : null,
          published_at: publishMode === "now" ? new Date().toISOString() : null,
          content: buildFullText(),
        }));
        await supabase.from("marketing_posts").insert(postInserts);
      }

      const actionLabels = { save: "Salvo na biblioteca", now: "Publicado", schedule: "Agendado" };
      toast({ title: `✅ Anúncio ${actionLabels[publishMode]} com sucesso!` });

      // Reset wizard
      setWizardStep(0);
      setSelectedProductIds(new Set());
      setGeneratedText(null);
      setGeneratedImageUrl(null);
      setGenInstructions("");
      setPublishPlatforms(new Set(["instagram"]));
      setScheduleDate("");
      setPublishMode("save");
      loadAll();
      setTab("library");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  // Schedule post from library
  const schedulePost = async (creativeId: string, platform: string, date: string) => {
    if (!date) { toast({ title: "Defina a data", variant: "destructive" }); return; }
    const creative = creatives.find(c => c.id === creativeId);
    await supabase.from("marketing_posts").insert({
      creative_id: creativeId, platform, scheduled_at: date,
      status: "scheduled", content: buildFullText({ headline: creative?.headline, body_text: creative?.body_text, hashtags: creative?.hashtags, cta: creative?.cta }),
    });
    toast({ title: "Post agendado!" }); loadAll();
  };

  const deleteCreative = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("marketing_creatives").delete().eq("id", id);
    toast({ title: "Excluído!" }); loadAll();
  };

  const deletePost = async (id: string) => {
    if (!confirm("Excluir?")) return;
    await supabase.from("marketing_posts").delete().eq("id", id);
    toast({ title: "Excluído!" }); loadAll();
  };

  const startWizardFromProduct = (productId: string) => {
    setSelectedProductIds(new Set([productId]));
    setWizardStep(0);
    setGeneratedText(null);
    setGeneratedImageUrl(null);
    setTab("wizard");
  };

  const subTabs = [
    { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { key: "wizard" as const, label: "Criar Anúncio", icon: Sparkles },
    { key: "campaigns" as const, label: "Campanhas", icon: Target },
    { key: "library" as const, label: "Biblioteca", icon: Layers },
    { key: "history" as const, label: "Histórico", icon: Clock },
    { key: "automation" as const, label: "Automação", icon: Zap },
  ];

  // ─── Product Selector ───
  const ProductSelector = () => (
    <div className="space-y-3">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar produto por nome ou SKU..." value={productSearch} onChange={e => setProductSearch(e.target.value)} className="pl-10" />
      </div>
      {selectedProducts.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {selectedProducts.map(p => (
            <Badge key={p.id} variant="secondary" className="cursor-pointer gap-1 pr-1" onClick={() => toggleProduct(p.id)}>
              {p.name} <span className="ml-1 text-xs opacity-60">✕</span>
            </Badge>
          ))}
        </div>
      )}
      <div className="max-h-64 overflow-y-auto border rounded-lg divide-y">
        {filteredProducts.slice(0, 50).map(p => (
          <button key={p.id} onClick={() => toggleProduct(p.id)}
            className={`w-full flex items-center gap-3 p-3 text-left hover:bg-muted/50 transition-colors ${selectedProductIds.has(p.id) ? "bg-primary/5 border-l-2 border-l-primary" : ""}`}>
            {selectedProductIds.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary shrink-0" /> : <Square className="h-4 w-4 text-muted-foreground shrink-0" />}
            {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium truncate">{p.name}</p>
              <p className="text-xs text-muted-foreground">{p.sku || "—"} · R$ {p.price.toFixed(2)} · Estoque: {p.stock_quantity}</p>
            </div>
          </button>
        ))}
        {filteredProducts.length === 0 && <p className="text-center py-4 text-sm text-muted-foreground">Nenhum produto encontrado</p>}
      </div>
    </div>
  );

  // ─── Phone Mockup Preview ───
  const PhoneMockup = ({ text, imageUrl }: { text: any; imageUrl: string | null }) => (
    <div className="mx-auto w-[320px] bg-background border-2 border-border rounded-[2rem] p-2 shadow-2xl">
      <div className="rounded-[1.5rem] overflow-hidden bg-muted/20">
        {/* Status bar */}
        <div className="h-6 bg-foreground/5 flex items-center justify-center">
          <div className="w-16 h-1 bg-foreground/20 rounded-full" />
        </div>
        {/* Header */}
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Instagram className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">grundemann_pecas</p>
            <p className="text-[10px] text-muted-foreground">Patrocinado</p>
          </div>
        </div>
        {/* Image */}
        <div className="aspect-square bg-muted relative overflow-hidden">
          {imageUrl ? (
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : selectedProducts[0]?.image_url ? (
            <img src={selectedProducts[0].image_url} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
          {text?.headline && (
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
              <p className="text-white font-bold text-sm leading-tight">{text.headline}</p>
            </div>
          )}
        </div>
        {/* Content */}
        <div className="p-3 space-y-2">
          {text?.cta && (
            <button className="w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded">
              {text.cta}
            </button>
          )}
          {text?.body_text && (
            <p className="text-xs leading-relaxed line-clamp-4">
              <span className="font-semibold">grundemann_pecas </span>
              {text.body_text}
            </p>
          )}
          {text?.hashtags && (
            <p className="text-xs text-primary/80">{text.hashtags}</p>
          )}
        </div>
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
            <button key={s.key} onClick={() => { setTab(s.key); if (s.key === "wizard") { setWizardStep(0); } }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                tab === s.key ? "bg-primary text-primary-foreground shadow-md" : "bg-muted/50 text-muted-foreground hover:bg-muted"
              }`}>
              <Icon className="h-4 w-4" />
              {s.label}
            </button>
          );
        })}
      </div>

      {/* ═══════════════ DASHBOARD ═══════════════ */}
      {tab === "dashboard" && (
        <div className="space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[
              { icon: Target, value: campaigns.length, label: "Campanhas", color: "text-primary" },
              { icon: Layers, value: creatives.length, label: "Criativos", color: "text-secondary-foreground" },
              { icon: Send, value: posts.filter(p => p.status === "published").length, label: "Publicados", color: "text-accent-foreground" },
              { icon: Clock, value: posts.filter(p => p.status === "scheduled").length, label: "Agendados", color: "text-muted-foreground" },
            ].map((m, i) => (
              <Card key={i}>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-3">
                    <div className="p-3 rounded-xl bg-muted"><m.icon className={`h-6 w-6 ${m.color}`} /></div>
                    <div>
                      <p className="text-2xl font-bold">{m.value}</p>
                      <p className="text-sm text-muted-foreground">{m.label}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card>
            <CardHeader><CardTitle className="text-lg">Ações Rápidas</CardTitle></CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button onClick={() => { setTab("wizard"); setWizardStep(0); }} className="gap-2"><Sparkles className="h-4 w-4" /> Criar Anúncio Completo</Button>
              <Button onClick={() => setTab("campaigns")} variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
              <Button onClick={() => setTab("library")} variant="outline" className="gap-2"><Layers className="h-4 w-4" /> Ver Biblioteca</Button>
            </CardContent>
          </Card>

          {campaigns.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Campanhas Recentes</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                {campaigns.slice(0, 5).map(c => (
                  <div key={c.id} className="flex items-center justify-between p-3 bg-muted/30 rounded-lg">
                    <div>
                      <p className="font-medium">{c.name}</p>
                      <p className="text-xs text-muted-foreground">{campaignTypeLabels[c.type] || c.type} · {(c.product_ids || []).length} produtos</p>
                    </div>
                    <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {creatives.length > 0 && (
            <Card>
              <CardHeader><CardTitle className="text-lg">Últimos Criativos</CardTitle></CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {creatives.slice(0, 6).map(c => (
                    <div key={c.id} onClick={() => setPreviewCreative(c)} className="cursor-pointer p-3 bg-muted/30 rounded-lg hover:bg-muted/60 transition-colors">
                      <div className="flex items-center gap-2">
                        {c.image_url && <img src={c.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium truncate">{c.title}</p>
                          <p className="text-xs text-muted-foreground">{formatLabels[c.format] || c.format}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════ WIZARD - CRIAR ANÚNCIO COMPLETO ═══════════════ */}
      {tab === "wizard" && (
        <div className="space-y-6">
          {/* Step indicator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-sm">
              <span className="font-semibold">Passo {wizardStep + 1} de {WIZARD_STEPS.length}: {WIZARD_STEPS[wizardStep].label}</span>
              <span className="text-muted-foreground">{Math.round(((wizardStep + 1) / WIZARD_STEPS.length) * 100)}%</span>
            </div>
            <Progress value={((wizardStep + 1) / WIZARD_STEPS.length) * 100} className="h-2" />
            <div className="flex gap-1">
              {WIZARD_STEPS.map((s, i) => {
                const Icon = s.icon;
                return (
                  <button key={s.key} onClick={() => i <= wizardStep && setWizardStep(i)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                      i === wizardStep ? "bg-primary text-primary-foreground" :
                      i < wizardStep ? "bg-primary/20 text-primary cursor-pointer" :
                      "bg-muted text-muted-foreground"
                    }`}>
                    {i < wizardStep ? <Check className="h-3 w-3" /> : <Icon className="h-3 w-3" />}
                    <span className="hidden sm:inline">{s.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Step 1: Products */}
          {wizardStep === 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Package className="h-5 w-5 text-primary" /> Selecione os Produtos</CardTitle>
                <CardDescription>Escolha os produtos que farão parte do seu anúncio. A IA usará as informações deles para gerar o conteúdo.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <ProductSelector />
                {selectedProducts.length > 0 && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                    <p className="text-sm font-medium text-primary mb-2">{selectedProducts.length} produto(s) selecionado(s)</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {selectedProducts.map(p => (
                        <div key={p.id} className="flex items-center gap-2 bg-background rounded p-2">
                          {p.image_url && <img src={p.image_url} alt="" className="h-12 w-12 rounded object-cover" />}
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-medium truncate">{p.name}</p>
                            <p className="text-xs text-muted-foreground">R$ {p.price.toFixed(2)} · {p.sku || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div className="flex justify-end">
                  <Button onClick={() => setWizardStep(1)} disabled={selectedProductIds.size === 0} className="gap-2">
                    Próximo <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 2: Configuration */}
          {wizardStep === 1 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Target className="h-5 w-5 text-primary" /> Configure o Anúncio</CardTitle>
                <CardDescription>Defina o formato, tipo de campanha e instruções especiais para a IA.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-3">
                    <Label className="font-semibold">Formato do Anúncio</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(formatLabels).map(([k, v]) => {
                        const icons: Record<string, any> = { post_instagram: Instagram, story_instagram: Instagram, anuncio_facebook: Facebook, banner: ImageIcon, whatsapp: MessageCircle, email: Mail };
                        const Icon = icons[k] || FileText;
                        return (
                          <button key={k} onClick={() => setGenFormat(k)}
                            className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${genFormat === k ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"}`}>
                            <Icon className={`h-5 w-5 ${genFormat === k ? "text-primary" : "text-muted-foreground"}`} />
                            <span className={`text-sm font-medium ${genFormat === k ? "text-primary" : ""}`}>{v}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <Label className="font-semibold">Tipo de Campanha</Label>
                    <div className="grid grid-cols-1 gap-2">
                      {Object.entries(campaignTypeLabels).map(([k, v]) => (
                        <button key={k} onClick={() => setGenCampaignType(k)}
                          className={`flex items-center gap-3 p-3 rounded-lg border transition-all text-left ${genCampaignType === k ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/50"}`}>
                          <span className={`text-sm font-medium ${genCampaignType === k ? "text-primary" : ""}`}>{v}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
                <div>
                  <Label className="font-semibold">Instruções Adicionais (opcional)</Label>
                  <Textarea value={genInstructions} onChange={e => setGenInstructions(e.target.value)}
                    placeholder="Ex: Usar tom urgente, mencionar frete grátis, destacar garantia de 1 ano..." rows={3} className="mt-2" />
                </div>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(0)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(2)} className="gap-2">Próximo <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Generate */}
          {wizardStep === 2 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Gerar Conteúdo com IA</CardTitle>
                  <CardDescription>Clique para gerar o texto e opcionalmente uma imagem promocional.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Formato:</strong> {formatLabels[genFormat]}</p>
                    <p className="text-sm"><strong>Campanha:</strong> {campaignTypeLabels[genCampaignType]}</p>
                    <p className="text-sm"><strong>Produtos:</strong> {selectedProducts.map(p => p.name).join(", ")}</p>
                    {genInstructions && <p className="text-sm"><strong>Instruções:</strong> {genInstructions}</p>}
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button onClick={generateText} disabled={generating} className="gap-2 w-full h-12 text-base">
                      {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      {generating ? "Gerando texto..." : "Gerar Texto com IA"}
                    </Button>
                    <Button onClick={generatePromotionalImage} disabled={generatingImage} variant="secondary" className="gap-2 w-full">
                      {generatingImage ? <Loader2 className="h-4 w-4 animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                      {generatingImage ? "Gerando imagem..." : "Gerar Imagem Promocional"}
                    </Button>
                  </div>

                  {generatedText && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-primary flex items-center gap-1"><Check className="h-4 w-4" /> Texto gerado!</p>
                      <Button size="sm" variant="outline" onClick={generateText} disabled={generating} className="gap-1">
                        <RefreshCw className="h-3 w-3" /> Regenerar texto
                      </Button>
                    </div>
                  )}
                  {generatedImageUrl && (
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg space-y-2">
                      <p className="text-sm font-medium text-primary flex items-center gap-1"><Check className="h-4 w-4" /> Imagem gerada!</p>
                      <img src={generatedImageUrl} alt="Preview" className="w-full rounded-lg" />
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Live preview */}
              <div className="space-y-4">
                <Card>
                  <CardHeader><CardTitle className="text-lg">Pré-visualização ao Vivo</CardTitle></CardHeader>
                  <CardContent>
                    {generatedText ? (
                      <PhoneMockup text={generatedText} imageUrl={generatedImageUrl} />
                    ) : (
                      <div className="text-center py-16 text-muted-foreground">
                        <Sparkles className="h-12 w-12 mx-auto mb-3 opacity-20" />
                        <p>Clique em "Gerar Texto" para ver a pré-visualização</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(3)} disabled={!generatedText} className="gap-2">
                    Ver Resultado Final <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 4: Full Preview */}
          {wizardStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Eye className="h-5 w-5 text-primary" /> Anúncio Completo</CardTitle>
                  <CardDescription>Revise e edite o conteúdo final antes de publicar.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4" ref={previewRef}>
                  {(generatedImageUrl || selectedProducts[0]?.image_url) && (
                    <div className="rounded-lg overflow-hidden border">
                      <img src={generatedImageUrl || selectedProducts[0]?.image_url || ""} alt="Anúncio" className="w-full object-contain max-h-80" />
                    </div>
                  )}
                  {generatedText?.headline && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Headline</Label>
                      <Textarea value={generatedText.headline} onChange={e => setGeneratedText((prev: any) => ({ ...prev, headline: e.target.value }))} rows={2} className="mt-1 font-bold text-lg" />
                    </div>
                  )}
                  {generatedText?.body_text && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Texto Principal</Label>
                      <Textarea value={generatedText.body_text} onChange={e => setGeneratedText((prev: any) => ({ ...prev, body_text: e.target.value }))} rows={5} className="mt-1" />
                    </div>
                  )}
                  {generatedText?.hashtags && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">Hashtags</Label>
                      <Input value={generatedText.hashtags} onChange={e => setGeneratedText((prev: any) => ({ ...prev, hashtags: e.target.value }))} className="mt-1 text-primary" />
                    </div>
                  )}
                  {generatedText?.cta && (
                    <div>
                      <Label className="text-xs text-muted-foreground uppercase tracking-wider">CTA (Chamada para Ação)</Label>
                      <Input value={generatedText.cta} onChange={e => setGeneratedText((prev: any) => ({ ...prev, cta: e.target.value }))} className="mt-1" />
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="grid grid-cols-2 gap-2 pt-4 border-t">
                    <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(buildFullText())}>
                      <Copy className="h-4 w-4" /> Copiar Texto
                    </Button>
                    <Button variant="outline" className="gap-2" onClick={() => downloadAsText(buildFullText(), `anuncio-${genFormat}-${Date.now()}.txt`)}>
                      <Download className="h-4 w-4" /> Baixar Texto
                    </Button>
                    {(generatedImageUrl || selectedProducts[0]?.image_url) && (
                      <Button variant="outline" className="gap-2 col-span-2" onClick={() => downloadImage(generatedImageUrl || selectedProducts[0]?.image_url || "", `anuncio-imagem-${Date.now()}.jpg`)}>
                        <Download className="h-4 w-4" /> Baixar Imagem
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>

              <div className="space-y-4">
                <PhoneMockup text={generatedText} imageUrl={generatedImageUrl} />
                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(4)} className="gap-2">Publicar / Salvar <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Publish */}
          {wizardStep === 4 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Publicar ou Salvar</CardTitle>
                <CardDescription>Escolha como deseja finalizar seu anúncio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mode selection */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { mode: "save" as const, icon: Archive, label: "Salvar na Biblioteca", desc: "Salvar para usar depois" },
                    { mode: "now" as const, icon: Send, label: "Publicar Agora", desc: "Marcar como publicado imediatamente" },
                    { mode: "schedule" as const, icon: Calendar, label: "Agendar Publicação", desc: "Publicar em data futura" },
                  ].map(m => (
                    <button key={m.mode} onClick={() => setPublishMode(m.mode)}
                      className={`p-4 rounded-lg border-2 transition-all text-left ${publishMode === m.mode ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                      <m.icon className={`h-6 w-6 mb-2 ${publishMode === m.mode ? "text-primary" : "text-muted-foreground"}`} />
                      <p className="font-semibold text-sm">{m.label}</p>
                      <p className="text-xs text-muted-foreground mt-1">{m.desc}</p>
                    </button>
                  ))}
                </div>

                {/* Platform selection */}
                {publishMode !== "save" && (
                  <div className="space-y-3">
                    <Label className="font-semibold">Plataformas</Label>
                    <div className="flex flex-wrap gap-3">
                      {Object.entries(platformLabels).map(([k, v]) => {
                        const Icon = platformIcons[k] || Globe;
                        return (
                          <button key={k} onClick={() => togglePlatform(k)}
                            className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${publishPlatforms.has(k) ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/50"}`}>
                            <Icon className="h-4 w-4" />
                            <span className="text-sm font-medium">{v}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Schedule date */}
                {publishMode === "schedule" && (
                  <div>
                    <Label className="font-semibold">Data e Hora do Agendamento</Label>
                    <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="mt-2 max-w-sm" />
                  </div>
                )}

                {/* Summary */}
                <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                  <p className="text-sm font-semibold">Resumo:</p>
                  <p className="text-sm">📝 Formato: {formatLabels[genFormat]}</p>
                  <p className="text-sm">📦 {selectedProducts.length} produto(s)</p>
                  {publishMode !== "save" && <p className="text-sm">📱 Plataformas: {Array.from(publishPlatforms).map(p => platformLabels[p]).join(", ")}</p>}
                  {publishMode === "schedule" && scheduleDate && <p className="text-sm">📅 Agendado: {new Date(scheduleDate).toLocaleString("pt-BR")}</p>}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(3)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={finalizeWizard} disabled={loading || (publishMode === "schedule" && !scheduleDate) || (publishMode !== "save" && publishPlatforms.size === 0)} className="gap-2 h-12 px-8 text-base">
                    {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Check className="h-5 w-5" />}
                    {publishMode === "save" ? "Salvar Anúncio" : publishMode === "now" ? "Publicar Agora" : "Agendar Publicação"}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}

      {/* ═══════════════ CAMPAIGNS ═══════════════ */}
      {tab === "campaigns" && (
        <div className="space-y-6">
          <Card>
            <CardHeader><CardTitle>{editingCampaign ? "Editar Campanha" : "Nova Campanha"}</CardTitle></CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div><Label>Nome *</Label><Input value={campaignForm.name} onChange={e => setCampaignForm(f => ({ ...f, name: e.target.value }))} placeholder="Ex: Promoção de Inverno" /></div>
                <div>
                  <Label>Tipo</Label>
                  <select value={campaignForm.type} onChange={e => setCampaignForm(f => ({ ...f, type: e.target.value }))} className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                    {Object.entries(campaignTypeLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                  </select>
                </div>
                <div><Label>Início</Label><Input type="date" value={campaignForm.start_date} onChange={e => setCampaignForm(f => ({ ...f, start_date: e.target.value }))} /></div>
                <div><Label>Fim</Label><Input type="date" value={campaignForm.end_date} onChange={e => setCampaignForm(f => ({ ...f, end_date: e.target.value }))} /></div>
              </div>
              <div><Label>Descrição</Label><Textarea value={campaignForm.description} onChange={e => setCampaignForm(f => ({ ...f, description: e.target.value }))} /></div>
              <ProductSelector />
              <div className="flex gap-2">
                <Button onClick={saveCampaign} className="gap-2"><Plus className="h-4 w-4" /> {editingCampaign ? "Atualizar" : "Criar"}</Button>
                {editingCampaign && <Button variant="outline" onClick={() => { setEditingCampaign(null); setCampaignForm({ name: "", description: "", type: "promotion", start_date: "", end_date: "" }); setSelectedProductIds(new Set()); }}>Cancelar</Button>}
              </div>
            </CardContent>
          </Card>

          <div className="space-y-3">
            {campaigns.map(c => (
              <Card key={c.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between flex-wrap gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <h3 className="font-semibold">{c.name}</h3>
                        <Badge className={statusColors[c.status] || ""}>{c.status}</Badge>
                        <Badge variant="outline">{campaignTypeLabels[c.type] || c.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{c.description || "Sem descrição"}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {(c.product_ids || []).length} produtos · {new Date(c.created_at).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                    <div className="flex gap-2 flex-wrap">
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
            {campaigns.length === 0 && <p className="text-center text-muted-foreground py-8">Nenhuma campanha criada.</p>}
          </div>
        </div>
      )}

      {/* ═══════════════ LIBRARY ═══════════════ */}
      {tab === "library" && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">Biblioteca de Criativos ({creatives.length})</h2>
            <Button onClick={() => { setTab("wizard"); setWizardStep(0); }} className="gap-2"><Plus className="h-4 w-4" /> Novo Anúncio</Button>
          </div>
          {creatives.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Layers className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground mb-4">Nenhum criativo salvo ainda.</p>
                <Button onClick={() => { setTab("wizard"); setWizardStep(0); }} className="gap-2"><Sparkles className="h-4 w-4" /> Criar Primeiro Anúncio</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {creatives.map(c => (
                <Card key={c.id} className="overflow-hidden group hover:shadow-lg transition-shadow">
                  {c.image_url && (
                    <div className="relative">
                      <img src={c.image_url} alt="" className="w-full h-44 object-cover" />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                        <Button size="sm" variant="secondary" className="gap-1" onClick={() => setPreviewCreative(c)}>
                          <Eye className="h-3 w-3" /> Ver
                        </Button>
                      </div>
                    </div>
                  )}
                  <CardContent className="pt-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-sm truncate flex-1">{c.title}</h3>
                      <Badge variant="outline" className="text-xs shrink-0 ml-2">{formatLabels[c.format] || c.format}</Badge>
                    </div>
                    {c.headline && <p className="text-sm font-semibold line-clamp-1">{c.headline}</p>}
                    {c.body_text && <p className="text-xs text-muted-foreground line-clamp-2">{c.body_text}</p>}
                    {c.hashtags && <p className="text-xs text-primary line-clamp-1">{c.hashtags}</p>}
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>

                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t">
                      <Button size="sm" variant="outline" className="gap-1 text-xs px-2" onClick={() => setPreviewCreative(c)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs px-2" onClick={() => copyToClipboard(buildFullText({ headline: c.headline, body_text: c.body_text, hashtags: c.hashtags, cta: c.cta }))}>
                        <Copy className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="destructive" className="gap-1 text-xs px-2" onClick={() => deleteCreative(c.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ═══════════════ HISTORY ═══════════════ */}
      {tab === "history" && (
        <div className="space-y-4">
          <h2 className="text-lg font-semibold">Histórico de Publicações ({posts.length})</h2>
          {posts.length === 0 ? (
            <Card>
              <CardContent className="text-center py-16">
                <Clock className="h-16 w-16 mx-auto mb-4 text-muted-foreground/30" />
                <p className="text-muted-foreground">Nenhuma publicação registrada.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {posts.map(p => {
                const PlatformIcon = platformIcons[p.platform] || Send;
                const creative = creatives.find(c => c.id === p.creative_id);
                return (
                  <Card key={p.id}>
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0 flex-1">
                          <div className="p-2 rounded-lg bg-muted shrink-0"><PlatformIcon className="h-5 w-5 text-primary" /></div>
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <p className="font-medium text-sm capitalize">{platformLabels[p.platform] || p.platform}</p>
                              <Badge className={`text-xs ${statusColors[p.status] || ""}`}>{p.status}</Badge>
                            </div>
                            <p className="text-xs text-muted-foreground">
                              {p.scheduled_at ? `Agendado: ${new Date(p.scheduled_at).toLocaleString("pt-BR")}` : ""}
                              {p.published_at ? `Publicado: ${new Date(p.published_at).toLocaleString("pt-BR")}` : ""}
                            </p>
                            {p.content && <p className="text-xs text-muted-foreground mt-1 line-clamp-1">{p.content}</p>}
                          </div>
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {creative && (
                            <Button size="sm" variant="outline" onClick={() => setPreviewCreative(creative)} className="gap-1">
                              <Eye className="h-3 w-3" />
                            </Button>
                          )}
                          {p.content && (
                            <Button size="sm" variant="outline" onClick={() => copyToClipboard(p.content || "")} className="gap-1">
                              <Copy className="h-3 w-3" />
                            </Button>
                          )}
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

      {/* ═══════════════ AUTOMATION ═══════════════ */}
      {tab === "automation" && (
        <div className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automação de Marketing</CardTitle>
              <CardDescription>Sugestões automáticas baseadas no catálogo</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {[
                { icon: Package, title: "Novo Produto → Post automático", desc: "Sugere post quando um produto é cadastrado.", badge: "Em breve" },
                { icon: TrendingUp, title: "Promoção → Anúncio automático", desc: "Cria anúncio ao definir preço promocional.", badge: "Em breve" },
                { icon: Archive, title: "Estoque alto → Campanha", desc: "Sugere campanha para produtos com estoque alto.", badge: "Em breve" },
                { icon: Eye, title: "Destaque → Campanha", desc: "Gera campanha para produtos em destaque.", badge: "Em breve" },
              ].map((a, i) => (
                <div key={i} className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                  <div className="p-2 rounded-lg bg-primary/10 shrink-0"><a.icon className="h-5 w-5 text-primary" /></div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2"><h3 className="font-medium">{a.title}</h3><Badge variant="outline" className="text-xs">{a.badge}</Badge></div>
                    <p className="text-sm text-muted-foreground mt-1">{a.desc}</p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <Card>
            <CardHeader><CardTitle className="text-lg">Sugestões de Produtos</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {products.filter(p => p.stock_quantity > 20).slice(0, 5).map(p => (
                <div key={p.id} className="flex items-center justify-between p-3 bg-accent/10 rounded-lg">
                  <div className="flex items-center gap-3">
                    {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover" />}
                    <div>
                      <p className="text-sm font-medium">{p.name}</p>
                      <p className="text-xs text-muted-foreground">Estoque: {p.stock_quantity} — Sugestão: campanha promocional</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => startWizardFromProduct(p.id)} className="gap-1 shrink-0">
                    <Sparkles className="h-3 w-3" /> Criar Anúncio
                  </Button>
                </div>
              ))}
              {products.filter(p => p.stock_quantity > 20).length === 0 && (
                <p className="text-center text-muted-foreground py-4">Nenhuma sugestão no momento.</p>
              )}
            </CardContent>
          </Card>
        </div>
      )}

      {/* ═══════════════ CREATIVE PREVIEW DIALOG ═══════════════ */}
      <Dialog open={!!previewCreative} onOpenChange={(open) => !open && setPreviewCreative(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{previewCreative?.title}</DialogTitle>
            <DialogDescription>{formatLabels[previewCreative?.format || ""] || previewCreative?.format}</DialogDescription>
          </DialogHeader>
          {previewCreative && (
            <div className="space-y-4">
              {previewCreative.image_url && (
                <img src={previewCreative.image_url} alt="" className="w-full rounded-lg object-contain max-h-80" />
              )}
              {previewCreative.headline && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Headline</Label>
                  <p className="text-xl font-bold mt-1">{previewCreative.headline}</p>
                </div>
              )}
              {previewCreative.body_text && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Texto</Label>
                  <p className="text-sm whitespace-pre-wrap mt-1">{previewCreative.body_text}</p>
                </div>
              )}
              {previewCreative.hashtags && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">Hashtags</Label>
                  <p className="text-sm text-primary mt-1">{previewCreative.hashtags}</p>
                </div>
              )}
              {previewCreative.cta && (
                <div>
                  <Label className="text-xs text-muted-foreground uppercase">CTA</Label>
                  <p className="text-sm font-semibold mt-1">{previewCreative.cta}</p>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t">
                <Button variant="outline" className="gap-2" onClick={() => copyToClipboard(buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta }))}>
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => downloadAsText(buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta }), `criativo-${previewCreative.id.slice(0, 8)}.txt`)}>
                  <Download className="h-4 w-4" /> Texto
                </Button>
                {previewCreative.image_url && (
                  <Button variant="outline" className="gap-2" onClick={() => downloadImage(previewCreative.image_url!, `criativo-img-${previewCreative.id.slice(0, 8)}.jpg`)}>
                    <Download className="h-4 w-4" /> Imagem
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={() => {
                  const text = buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta });
                  const whatsappUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`;
                  window.open(whatsappUrl, "_blank");
                }}>
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketingCenter;
