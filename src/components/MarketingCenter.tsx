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
  Share2, ExternalLink, RefreshCw, ChevronRight, Printer, Globe, Palette, Image,
  LayoutTemplate, Link2
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
type BackgroundStyle = "white" | "creative";
type TemplateStyle = "modern" | "bold" | "elegant" | "industrial" | "flash_sale" | "minimal";

const templateOptions: { key: TemplateStyle; label: string; desc: string; colors: [string, string]; accent: string }[] = [
  { key: "modern", label: "Moderno", desc: "Layout limpo com gradiente suave e tipografia moderna", colors: ["#1a1a2e", "#16213e"], accent: "#4da8da" },
  { key: "bold", label: "Impactante", desc: "Cores vibrantes, texto grande e destaque máximo", colors: ["#d00000", "#370617"], accent: "#ffba08" },
  { key: "elegant", label: "Elegante", desc: "Tons escuros sofisticados com detalhes dourados", colors: ["#1b1b1b", "#2d2d2d"], accent: "#c9a84c" },
  { key: "industrial", label: "Industrial", desc: "Estilo oficina com texturas metálicas e tons de aço", colors: ["#0d1117", "#1e3a5f"], accent: "#e94560" },
  { key: "flash_sale", label: "Queima de Preço", desc: "Foco total no preço, urgência e escassez", colors: ["#ff0000", "#8b0000"], accent: "#ffff00" },
  { key: "minimal", label: "Minimalista", desc: "Fundo claro, poucos elementos, foco no produto", colors: ["#f8f9fa", "#e9ecef"], accent: "#212529" },
];

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
  instagram: Instagram, facebook: Facebook, whatsapp: MessageCircle, email: Mail, google: Globe,
};

const platformLabels: Record<string, string> = {
  instagram: "Instagram", facebook: "Facebook", whatsapp: "WhatsApp", email: "E-mail", google: "Google",
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
  { key: "template", label: "Template", icon: LayoutTemplate },
  { key: "generate", label: "Gerar Conteúdo", icon: Wand2 },
  { key: "preview", label: "Pré-visualização", icon: Eye },
  { key: "publish", label: "Publicar", icon: Send },
];

// ─── Load logo once ───
import logoGrundemann from "@/assets/logo-grundemann.png";

const loadImage = (src: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const img = new window.Image();
    img.crossOrigin = "anonymous";
    img.onload = () => resolve(img);
    img.onerror = reject;
    img.src = src;
  });

const getProductUrl = (productId: string) => {
  const base = window.location.origin;
  return `${base}/produto/${productId}`;
};

// ─── Canvas composite generator with templates ───
const generateCompositeImage = async (
  imageUrl: string | null,
  text: any,
  format: string,
  bgStyle: BackgroundStyle = "creative",
  template: TemplateStyle = "modern",
  productUrl?: string,
  price?: number,
  originalPrice?: number | null,
): Promise<Blob> => {
  const isStory = format === "story_instagram";
  const W = 1080;
  const H = isStory ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const tpl = templateOptions.find(t => t.key === template) || templateOptions[0];
  const isLight = template === "minimal" || bgStyle === "white";

  // ── Background ──
  if (bgStyle === "white" || template === "minimal") {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, tpl.colors[0]);
    grad.addColorStop(1, tpl.colors[1]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);
  } else {
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, tpl.colors[0]);
    grad.addColorStop(0.5, tpl.colors[1]);
    grad.addColorStop(1, tpl.colors[0]);
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    // Template-specific decorations
    ctx.save();
    ctx.globalAlpha = 0.06;
    if (template === "modern" || template === "industrial") {
      for (let i = 0; i < 8; i++) {
        ctx.strokeStyle = tpl.accent;
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(W * 0.85, H * 0.2, 60 + i * 40, 0, Math.PI * 2);
        ctx.stroke();
      }
      ctx.strokeStyle = tpl.accent;
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        ctx.beginPath();
        ctx.moveTo(0, H * 0.5 + i * 30);
        ctx.lineTo(W * 0.15, H * 0.45 + i * 30);
        ctx.stroke();
      }
    } else if (template === "bold" || template === "flash_sale") {
      // Diagonal stripes
      ctx.globalAlpha = 0.08;
      ctx.strokeStyle = tpl.accent;
      ctx.lineWidth = 60;
      for (let i = -H; i < W + H; i += 120) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i + H, H);
        ctx.stroke();
      }
    } else if (template === "elegant") {
      // Corner ornaments
      ctx.globalAlpha = 0.1;
      ctx.strokeStyle = tpl.accent;
      ctx.lineWidth = 2;
      const s = 120;
      [{ x: 40, y: 40 }, { x: W - 40, y: 40 }, { x: 40, y: H - 40 }, { x: W - 40, y: H - 40 }].forEach(({ x, y }) => {
        ctx.beginPath();
        ctx.arc(x, y, s, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(x, y, s * 0.6, 0, Math.PI * 2);
        ctx.stroke();
      });
    }
    ctx.restore();
  }

  // Accent bar top
  ctx.fillStyle = tpl.accent;
  ctx.fillRect(0, 0, W, template === "bold" || template === "flash_sale" ? 12 : 6);

  // ── Product image ──
  const imgAreaH = isStory ? H * 0.42 : H * 0.48;
  if (imageUrl) {
    try {
      const img = await loadImage(imageUrl);
      if (!isLight) {
        ctx.save();
        ctx.shadowColor = `${tpl.accent}66`;
        ctx.shadowBlur = template === "bold" ? 80 : 50;
        const scale = Math.min((W - 120) / img.width, (imgAreaH - 60) / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (imgAreaH - dh) / 2 + 20, dw, dh);
        ctx.restore();
        // Gradient overlay
        const overlayGrad = ctx.createLinearGradient(0, imgAreaH - 100, 0, imgAreaH + 30);
        overlayGrad.addColorStop(0, `${tpl.colors[0]}00`);
        overlayGrad.addColorStop(1, `${tpl.colors[0]}ff`);
        ctx.fillStyle = overlayGrad;
        ctx.fillRect(0, imgAreaH - 100, W, 130);
      } else {
        const scale = Math.min((W - 160) / img.width, (imgAreaH - 80) / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        ctx.drawImage(img, (W - dw) / 2, (imgAreaH - dh) / 2 + 20, dw, dh);
        ctx.strokeStyle = "#dddddd";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(60, imgAreaH + 10);
        ctx.lineTo(W - 60, imgAreaH + 10);
        ctx.stroke();
      }
    } catch { /* fallback */ }
  }

  const textStartY = imgAreaH + 40;

  // ── Flash Sale: Price banner ──
  if (template === "flash_sale" && price) {
    const priceY = textStartY - 20;
    ctx.fillStyle = tpl.accent;
    ctx.fillRect(0, priceY, W, 80);
    ctx.fillStyle = "#000000";
    ctx.font = `bold 52px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    if (originalPrice && originalPrice > price) {
      ctx.font = `28px 'Segoe UI', Arial, sans-serif`;
      ctx.fillStyle = "#333333";
      const oldText = `De R$ ${originalPrice.toFixed(2)}`;
      ctx.fillText(oldText, W / 2, priceY + 30);
      // Strikethrough
      const tw = ctx.measureText(oldText).width;
      ctx.strokeStyle = "#333333";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(W / 2 - tw / 2, priceY + 25);
      ctx.lineTo(W / 2 + tw / 2, priceY + 25);
      ctx.stroke();
      ctx.fillStyle = "#000000";
      ctx.font = `bold 48px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(`POR R$ ${price.toFixed(2)}`, W / 2, priceY + 70);
    } else {
      ctx.fillText(`R$ ${price.toFixed(2)}`, W / 2, priceY + 55);
    }
    ctx.textAlign = "left";
  }

  const headlineY = template === "flash_sale" && price ? textStartY + 80 : textStartY;

  // ── Headline ──
  if (text?.headline) {
    ctx.fillStyle = isLight ? "#1a1a1a" : "#ffffff";
    if (template === "elegant") {
      ctx.fillStyle = tpl.accent;
    }
    const fontSize = template === "bold" ? (isStory ? 60 : 52) : (isStory ? 52 : 46);
    ctx.font = `bold ${fontSize}px 'Segoe UI', Arial, sans-serif`;
    wrapText(ctx, text.headline.toUpperCase(), 60, headlineY, W - 120, fontSize + 8);
  }

  // ── Body ──
  const bodyY = headlineY + (text?.headline ? 130 : 0);
  if (text?.body_text) {
    ctx.fillStyle = isLight ? "#444444" : "#c0c8d8";
    ctx.font = `${isStory ? 30 : 26}px 'Segoe UI', Arial, sans-serif`;
    const shortBody = text.body_text.length > 160 ? text.body_text.slice(0, 160) + "…" : text.body_text;
    wrapText(ctx, shortBody, 60, bodyY, W - 120, isStory ? 40 : 34);
  }

  // ── CTA button ──
  if (text?.cta) {
    const ctaY = H - (isStory ? 280 : 160);
    const ctaW = 420;
    const ctaH = 60;
    const ctaX = (W - ctaW) / 2;
    ctx.fillStyle = tpl.accent;
    roundRect(ctx, ctaX, ctaY, ctaW, ctaH, template === "bold" ? 8 : 30);
    ctx.fill();
    const ctaTextColor = template === "flash_sale" || template === "bold" ? "#000000" : "#ffffff";
    ctx.fillStyle = ctaTextColor;
    ctx.font = `bold 26px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(text.cta.toUpperCase(), W / 2, ctaY + 40);
    ctx.textAlign = "left";
  }

  // ── Product link ──
  if (productUrl) {
    const linkY = H - (isStory ? 200 : 100);
    ctx.fillStyle = isLight ? "#666666" : "#8899aa";
    ctx.font = `20px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`🔗 ${productUrl}`, W / 2, linkY);
    ctx.textAlign = "left";
  }

  // ── Hashtags ──
  if (text?.hashtags) {
    ctx.fillStyle = isLight ? tpl.accent : tpl.accent;
    ctx.font = `20px 'Segoe UI', Arial, sans-serif`;
    const hashY = H - (isStory ? 150 : 45);
    ctx.fillText(text.hashtags.slice(0, 90), 60, hashY);
  }

  // ── Logo (top-left) ──
  try {
    const logo = await loadImage(logoGrundemann);
    const logoH = isStory ? 65 : 55;
    const logoW = (logo.width / logo.height) * logoH;
    const logoX = 28;
    const logoY = 18;
    ctx.save();
    ctx.fillStyle = isLight ? "rgba(255,255,255,0.9)" : "rgba(0,0,0,0.55)";
    roundRect(ctx, logoX - 10, logoY - 8, logoW + 20, logoH + 16, 10);
    ctx.fill();
    ctx.restore();
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
  } catch {
    ctx.save();
    ctx.fillStyle = isLight ? "rgba(0,0,0,0.8)" : "rgba(255,255,255,0.9)";
    ctx.font = `bold 26px 'Segoe UI', Arial, sans-serif`;
    ctx.fillText("GRÜNDEMANN", 30, 50);
    ctx.restore();
  }

  // ── Template badge (bottom-right) ──
  if (template === "elegant") {
    ctx.save();
    ctx.fillStyle = `${tpl.accent}33`;
    roundRect(ctx, W - 200, H - 50, 180, 35, 8);
    ctx.fill();
    ctx.fillStyle = tpl.accent;
    ctx.font = `14px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "right";
    ctx.fillText("GRÜNDEMANN ®", W - 30, H - 27);
    ctx.textAlign = "left";
    ctx.restore();
  }

  return new Promise((resolve, reject) => {
    canvas.toBlob(blob => blob ? resolve(blob) : reject(new Error("Canvas toBlob failed")), "image/png");
  });
};

function wrapText(ctx: CanvasRenderingContext2D, text: string, x: number, y: number, maxW: number, lineH: number) {
  const words = text.split(" ");
  let line = "";
  let cy = y;
  for (const w of words) {
    const test = line + w + " ";
    if (ctx.measureText(test).width > maxW && line) {
      ctx.fillText(line.trim(), x, cy);
      line = w + " ";
      cy += lineH;
    } else {
      line = test;
    }
  }
  ctx.fillText(line.trim(), x, cy);
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h - r);
  ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
  ctx.lineTo(x + r, y + h);
  ctx.quadraticCurveTo(x, y + h, x, y + h - r);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

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
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>("creative");
  const [templateStyle, setTemplateStyle] = useState<TemplateStyle>("modern");
  const [compositeBlob, setCompositeBlob] = useState<Blob | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [generatingComposite, setGeneratingComposite] = useState(false);

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

  // Automation
  const [autoGenerating, setAutoGenerating] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const selectedProducts = products.filter(p => selectedProductIds.has(p.id));

  // Generate composite whenever text or image changes
  useEffect(() => {
    if (generatedText && wizardStep >= 4) {
      buildComposite();
    }
  }, [generatedText, generatedImageUrl, wizardStep, backgroundStyle, templateStyle]);

  const buildComposite = async () => {
    if (!generatedText) return;
    setGeneratingComposite(true);
    try {
      const product = selectedProducts[0];
      const imgSrc = generatedImageUrl || product?.image_url || null;
      const productUrl = product ? getProductUrl(product.id) : undefined;
      const blob = await generateCompositeImage(
        imgSrc, generatedText, genFormat, backgroundStyle, templateStyle,
        productUrl, product?.price, product?.original_price,
      );
      setCompositeBlob(blob);
      if (compositeUrl) URL.revokeObjectURL(compositeUrl);
      setCompositeUrl(URL.createObjectURL(blob));
    } catch (err) {
      console.error("Composite error:", err);
    } finally {
      setGeneratingComposite(false);
    }
  };

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
        link: getProductUrl(p.id),
      }));
      const linkInstruction = `IMPORTANTE: Inclua o link direto do produto para compra: ${prods[0]?.link}. Adicione no body_text de forma natural, por exemplo "Compre agora: [link]".`;
      const { data, error } = await supabase.functions.invoke("generate-marketing-text", {
        body: {
          products: prods, format: genFormat, campaignType: genCampaignType,
          customInstructions: `${genInstructions}\n\n${linkInstruction}`,
        },
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
      const bgDesc = backgroundStyle === "white"
        ? "Clean professional product photo on a pure white background, studio lighting, e-commerce style."
        : `Creative promotional scene for ${product.name}. Show the product in a professional workshop/garage environment with tools, engines, and industrial atmosphere. Dramatic lighting, warm tones. Professional commercial photography style.`;

      const { data, error } = await supabase.functions.invoke("generate-product-image", {
        body: { productName: product.name, imageDescription: bgDesc, sku: product.sku },
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

  // Build full text for copy/download, including product link
  const buildFullText = (text: any = generatedText, product?: Product | null) => {
    if (!text) return "";
    const parts: string[] = [];
    if (text.headline) parts.push(text.headline);
    if (text.short_description) parts.push(text.short_description);
    if (text.body_text) parts.push("", text.body_text);
    if (text.cta) parts.push("", `👉 ${text.cta}`);

    // Add product link
    const p = product || selectedProducts[0];
    if (p) {
      const url = getProductUrl(p.id);
      if (!parts.join("\n").includes(url)) {
        parts.push("", `🛒 Compre agora: ${url}`);
      }
    }

    if (text.hashtags) parts.push("", text.hashtags);
    return parts.join("\n");
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Texto copiado!" });
  };

  const copyCompositeToClipboard = async () => {
    if (!compositeBlob) {
      toast({ title: "Gere o anúncio primeiro", variant: "destructive" });
      return;
    }
    try {
      await navigator.clipboard.write([
        new ClipboardItem({ "image/png": compositeBlob })
      ]);
      toast({ title: "✅ Imagem do anúncio copiada!", description: "Cole diretamente no Instagram, Facebook ou qualquer rede social." });
    } catch {
      downloadBlob(compositeBlob, `anuncio-completo-${Date.now()}.png`);
      toast({ title: "Imagem baixada!", description: "Seu navegador não suporta copiar imagens. O arquivo foi baixado." });
    }
  };

  const copyAllForPublication = async () => {
    const text = buildFullText();
    if (text) await navigator.clipboard.writeText(text);
    if (compositeBlob) {
      setTimeout(async () => {
        try {
          await navigator.clipboard.write([new ClipboardItem({ "image/png": compositeBlob })]);
          toast({ title: "✅ Pronto para publicar!", description: "Imagem copiada! O texto também foi copiado. Cole no seu editor/rede social." });
        } catch {
          downloadBlob(compositeBlob, `anuncio-completo-${Date.now()}.png`);
          toast({ title: "Texto copiado e imagem baixada!", description: "Cole o texto e anexe a imagem na publicação." });
        }
      }, 100);
    } else {
      toast({ title: "Texto copiado!" });
    }
  };

  const downloadBlob = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; a.click();
    URL.revokeObjectURL(url);
  };

  const downloadAsText = (text: string, filename: string) => {
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    downloadBlob(blob, filename);
  };

  const downloadImage = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      downloadBlob(blob, filename);
    } catch {
      window.open(url, "_blank");
    }
  };

  const downloadComposite = () => {
    if (compositeBlob) {
      downloadBlob(compositeBlob, `anuncio-completo-${genFormat}-${Date.now()}.png`);
      toast({ title: "Anúncio completo baixado!" });
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

      resetWizard();
      loadAll();
      setTab("library");
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const resetWizard = () => {
    setWizardStep(0);
    setSelectedProductIds(new Set());
    setGeneratedText(null);
    setGeneratedImageUrl(null);
    setCompositeBlob(null);
    setCompositeUrl(null);
    setGenInstructions("");
    setPublishPlatforms(new Set(["instagram"]));
    setScheduleDate("");
    setPublishMode("save");
    setBackgroundStyle("creative");
    setTemplateStyle("modern");
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
    setCompositeBlob(null);
    setCompositeUrl(null);
    setTab("wizard");
  };

  // Auto-generate ad for a product (from Automation tab)
  const autoGenerateAd = async (product: Product) => {
    setAutoGenerating(product.id);
    try {
      const prods = [{
        name: product.name, sku: product.sku, price: product.price,
        category: getCategoryName(product.category_id), description: product.description,
        link: getProductUrl(product.id),
      }];
      const { data, error } = await supabase.functions.invoke("generate-marketing-text", {
        body: {
          products: prods, format: "post_instagram", campaignType: product.stock_quantity > 20 ? "high_stock" : "promotion",
          customInstructions: `Inclua o link direto do produto: ${getProductUrl(product.id)}`,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      // Save creative directly
      await supabase.from("marketing_creatives").insert({
        title: data.headline || `Anúncio - ${product.name}`,
        format: "post_instagram",
        product_id: product.id,
        headline: data.headline || null,
        body_text: data.body_text || null,
        hashtags: data.hashtags || null,
        cta: data.cta || null,
        image_url: product.image_url || null,
        status: "draft",
      });

      toast({ title: `✅ Anúncio de "${product.name}" criado!`, description: "Salvo na biblioteca de criativos." });
      loadAll();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setAutoGenerating(null);
    }
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
        <div className="h-6 bg-foreground/5 flex items-center justify-center">
          <div className="w-16 h-1 bg-foreground/20 rounded-full" />
        </div>
        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <Instagram className="w-4 h-4 text-primary" />
          </div>
          <div>
            <p className="text-xs font-semibold">grundemann_pecas</p>
            <p className="text-[10px] text-muted-foreground">Patrocinado</p>
          </div>
        </div>
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
          {selectedProducts[0] && (
            <p className="text-[10px] text-primary flex items-center gap-1">
              <Link2 className="h-3 w-3" /> {getProductUrl(selectedProducts[0].id).replace(window.location.origin, '')}
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
              <Button onClick={() => setTab("automation")} variant="outline" className="gap-2"><Zap className="h-4 w-4" /> Automação</Button>
            </CardContent>
          </Card>

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

      {/* ═══════════════ WIZARD ═══════════════ */}
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
                <CardDescription>Escolha os produtos que farão parte do seu anúncio.</CardDescription>
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
                            <p className="text-[10px] text-primary flex items-center gap-1"><Link2 className="h-2.5 w-2.5" /> Link direto incluído</p>
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
                <CardDescription>Defina o formato, tipo de campanha e estilo de fundo.</CardDescription>
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
                  <div className="space-y-6">
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

                    {/* Background Style */}
                    <div className="space-y-3">
                      <Label className="font-semibold flex items-center gap-2">
                        <Palette className="h-4 w-4 text-primary" /> Estilo do Fundo
                      </Label>
                      <div className="grid grid-cols-1 gap-2">
                        <button onClick={() => setBackgroundStyle("white")}
                          className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all text-left ${backgroundStyle === "white" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <div className="w-10 h-10 rounded bg-white border shrink-0 flex items-center justify-center"><Package className="h-5 w-5 text-muted-foreground" /></div>
                          <div>
                            <p className={`text-sm font-semibold ${backgroundStyle === "white" ? "text-primary" : ""}`}>Fundo Branco</p>
                            <p className="text-xs text-muted-foreground">Estilo catálogo limpo</p>
                          </div>
                        </button>
                        <button onClick={() => setBackgroundStyle("creative")}
                          className={`flex items-center gap-4 p-3 rounded-lg border-2 transition-all text-left ${backgroundStyle === "creative" ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                          <div className="w-10 h-10 rounded bg-gradient-to-br from-amber-700 to-slate-800 shrink-0 flex items-center justify-center"><Sparkles className="h-5 w-5 text-amber-200" /></div>
                          <div>
                            <p className={`text-sm font-semibold ${backgroundStyle === "creative" ? "text-primary" : ""}`}>Fundo Criativo</p>
                            <p className="text-xs text-muted-foreground">Cenário temático com arte</p>
                          </div>
                        </button>
                      </div>
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
                  <Button onClick={() => setWizardStep(2)} className="gap-2">Escolher Template <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Template Selection (NEW) */}
          {wizardStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><LayoutTemplate className="h-5 w-5 text-primary" /> Escolha o Template da Arte</CardTitle>
                <CardDescription>Selecione um layout profissional pré-definido para seu anúncio. Cada template tem um estilo visual único.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {templateOptions.map(t => (
                    <button key={t.key} onClick={() => setTemplateStyle(t.key)}
                      className={`relative flex flex-col rounded-xl border-2 overflow-hidden transition-all ${templateStyle === t.key ? "border-primary shadow-lg ring-2 ring-primary/30" : "border-border hover:border-primary/50"}`}>
                      {/* Template preview */}
                      <div className="h-32 relative" style={{ background: `linear-gradient(135deg, ${t.colors[0]}, ${t.colors[1]})` }}>
                        {/* Accent bar */}
                        <div className="absolute top-0 left-0 right-0 h-1.5" style={{ backgroundColor: t.accent }} />
                        {/* Mock layout */}
                        <div className="absolute inset-0 flex items-center justify-center p-4">
                          <div className="w-full max-w-[180px] space-y-2">
                            <div className="w-12 h-12 rounded-lg mx-auto opacity-60" style={{ backgroundColor: `${t.accent}33` }}>
                              <div className="w-full h-full flex items-center justify-center">
                                <ImageIcon className="h-5 w-5" style={{ color: t.accent }} />
                              </div>
                            </div>
                            <div className="h-2 rounded-full w-3/4 mx-auto" style={{ backgroundColor: t.key === "minimal" ? "#333" : "#fff", opacity: 0.6 }} />
                            <div className="h-1.5 rounded-full w-1/2 mx-auto" style={{ backgroundColor: t.key === "minimal" ? "#666" : "#fff", opacity: 0.3 }} />
                            <div className="h-5 rounded-full w-2/3 mx-auto" style={{ backgroundColor: t.accent, opacity: 0.8 }} />
                          </div>
                        </div>
                        {templateStyle === t.key && (
                          <div className="absolute top-2 right-2 bg-primary text-primary-foreground rounded-full p-1">
                            <Check className="h-3 w-3" />
                          </div>
                        )}
                      </div>
                      <div className="p-3 bg-background">
                        <p className={`text-sm font-semibold ${templateStyle === t.key ? "text-primary" : ""}`}>{t.label}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{t.desc}</p>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="p-4 bg-muted/30 rounded-lg">
                  <p className="text-sm"><strong>Template selecionado:</strong> {templateOptions.find(t => t.key === templateStyle)?.label}</p>
                  <p className="text-xs text-muted-foreground mt-1">{templateOptions.find(t => t.key === templateStyle)?.desc}</p>
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(3)} className="gap-2">Gerar Conteúdo <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Generate */}
          {wizardStep === 3 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Gerar Conteúdo com IA</CardTitle>
                  <CardDescription>Gere o texto publicitário e a imagem do produto com IA.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                    <p className="text-sm"><strong>Formato:</strong> {formatLabels[genFormat]}</p>
                    <p className="text-sm"><strong>Campanha:</strong> {campaignTypeLabels[genCampaignType]}</p>
                    <p className="text-sm"><strong>Fundo:</strong> {backgroundStyle === "white" ? "🤍 Branco" : "🎨 Criativo"}</p>
                    <p className="text-sm"><strong>Template:</strong> {templateOptions.find(t => t.key === templateStyle)?.label}</p>
                    <p className="text-sm"><strong>Produtos:</strong> {selectedProducts.map(p => p.name).join(", ")}</p>
                    <p className="text-sm flex items-center gap-1"><Link2 className="h-3.5 w-3.5 text-primary" /> <strong>Link direto:</strong> Incluído automaticamente</p>
                  </div>

                  <div className="flex flex-col gap-3">
                    <Button onClick={generateText} disabled={generating} className="gap-2 w-full h-12 text-base">
                      {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                      {generating ? "Gerando texto..." : "🔤 Gerar Texto com IA"}
                    </Button>
                    <Button onClick={generatePromotionalImage} disabled={generatingImage} variant="secondary" className="gap-2 w-full h-12">
                      {generatingImage ? <Loader2 className="h-5 w-5 animate-spin" /> : <ImageIcon className="h-5 w-5" />}
                      {generatingImage ? "Gerando imagem..." : `🖼️ Gerar Imagem (${backgroundStyle === "white" ? "Fundo Branco" : "Fundo Criativo"})`}
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
                      <Button size="sm" variant="outline" onClick={generatePromotionalImage} disabled={generatingImage} className="gap-1">
                        <RefreshCw className="h-3 w-3" /> Regenerar imagem
                      </Button>
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
                  <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(4)} disabled={!generatedText} className="gap-2">
                    Ver Resultado Final <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Step 5: Full Preview + Composite */}
          {wizardStep === 4 && (
            <div className="space-y-6">
              <Card className="border-2 border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Image className="h-5 w-5 text-primary" />
                    Anúncio Completo para Publicação
                  </CardTitle>
                  <CardDescription>
                    Arte final gerada com template "{templateOptions.find(t => t.key === templateStyle)?.label}". Copie, baixe ou compartilhe.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  {generatingComposite ? (
                    <div className="flex items-center justify-center py-12 bg-muted/20 rounded-xl">
                      <Loader2 className="h-8 w-8 animate-spin text-primary" />
                      <span className="ml-3 text-muted-foreground">Gerando arte final...</span>
                    </div>
                  ) : compositeUrl ? (
                    <div className="rounded-xl overflow-hidden border-2 border-border shadow-lg bg-muted/10">
                      <img src={compositeUrl} alt="Anúncio Completo" className="w-full max-h-[600px] object-contain" />
                    </div>
                  ) : null}

                  {/* One-click actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                    <Button onClick={copyAllForPublication} disabled={!compositeBlob}
                      className="gap-2 h-14 text-base bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70">
                      <Send className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-sm font-bold">Copiar Tudo</p>
                        <p className="text-[10px] opacity-80">Imagem + texto + link</p>
                      </div>
                    </Button>
                    <Button onClick={copyCompositeToClipboard} disabled={!compositeBlob} variant="secondary" className="gap-2 h-14">
                      <Copy className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-sm font-bold">Copiar Imagem</p>
                        <p className="text-[10px] opacity-80">Cole nas redes sociais</p>
                      </div>
                    </Button>
                    <Button onClick={() => copyToClipboard(buildFullText())} disabled={!generatedText} variant="outline" className="gap-2 h-14">
                      <FileText className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-sm font-bold">Copiar Texto</p>
                        <p className="text-[10px] opacity-80">Legenda + link</p>
                      </div>
                    </Button>
                    <Button onClick={downloadComposite} disabled={!compositeBlob} variant="outline" className="gap-2 h-14">
                      <Download className="h-5 w-5" />
                      <div className="text-left">
                        <p className="text-sm font-bold">Baixar Arte</p>
                        <p className="text-[10px] opacity-80">PNG alta qualidade</p>
                      </div>
                    </Button>
                  </div>

                  {/* Product link info */}
                  {selectedProducts[0] && (
                    <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-3">
                      <Link2 className="h-5 w-5 text-primary shrink-0" />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">Link direto do produto incluído:</p>
                        <p className="text-xs text-primary truncate">{getProductUrl(selectedProducts[0].id)}</p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => copyToClipboard(getProductUrl(selectedProducts[0].id))} className="shrink-0">
                        <Copy className="h-3 w-3" />
                      </Button>
                    </div>
                  )}

                  {/* Quick share */}
                  <div className="flex flex-wrap gap-2 pt-2 border-t">
                    <p className="text-sm text-muted-foreground w-full mb-1">Compartilhar:</p>
                    <Button size="sm" variant="outline" className="gap-2"
                      onClick={() => {
                        const text = buildFullText();
                        window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
                      }}>
                      <MessageCircle className="h-4 w-4" /> WhatsApp
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2"
                      onClick={async () => {
                        if (compositeBlob && navigator.share) {
                          try {
                            const file = new File([compositeBlob], "anuncio.png", { type: "image/png" });
                            await navigator.share({ text: buildFullText(), files: [file] });
                          } catch { /* cancelled */ }
                        } else {
                          copyToClipboard(buildFullText());
                        }
                      }}>
                      <Share2 className="h-4 w-4" /> Compartilhar
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={buildComposite} disabled={generatingComposite}>
                      <RefreshCw className="h-4 w-4" /> Regenerar Arte
                    </Button>
                    <Button size="sm" variant="outline" className="gap-2" onClick={() => downloadAsText(buildFullText(), `legenda-${genFormat}-${Date.now()}.txt`)}>
                      <Download className="h-4 w-4" /> Baixar Texto
                    </Button>
                  </div>
                </CardContent>
              </Card>

              {/* Editable text fields */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2"><PenTool className="h-4 w-4" /> Editar Texto</CardTitle>
                    <CardDescription>Edite os textos e clique em "Regenerar Arte" para atualizar.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {generatedText?.headline && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Headline</Label>
                        <Textarea value={generatedText.headline} onChange={e => setGeneratedText((prev: any) => ({ ...prev, headline: e.target.value }))} rows={2} className="mt-1 font-bold" />
                      </div>
                    )}
                    {generatedText?.body_text && (
                      <div>
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">Texto Principal</Label>
                        <Textarea value={generatedText.body_text} onChange={e => setGeneratedText((prev: any) => ({ ...prev, body_text: e.target.value }))} rows={4} className="mt-1" />
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
                        <Label className="text-xs text-muted-foreground uppercase tracking-wider">CTA</Label>
                        <Input value={generatedText.cta} onChange={e => setGeneratedText((prev: any) => ({ ...prev, cta: e.target.value }))} className="mt-1" />
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Preview no Celular</CardTitle></CardHeader>
                  <CardContent>
                    <PhoneMockup text={generatedText} imageUrl={generatedImageUrl} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setWizardStep(3)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                <Button onClick={() => setWizardStep(5)} className="gap-2">Salvar / Publicar <ArrowRight className="h-4 w-4" /></Button>
              </div>
            </div>
          )}

          {/* Step 6: Publish */}
          {wizardStep === 5 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Send className="h-5 w-5 text-primary" /> Publicar ou Salvar</CardTitle>
                <CardDescription>Escolha como deseja finalizar seu anúncio.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {[
                    { mode: "save" as const, icon: Archive, label: "Salvar na Biblioteca", desc: "Salvar para usar depois" },
                    { mode: "now" as const, icon: Send, label: "Publicar Agora", desc: "Marcar como publicado" },
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

                {publishMode === "schedule" && (
                  <div>
                    <Label className="font-semibold">Data e Hora</Label>
                    <Input type="datetime-local" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="mt-2 max-w-sm" />
                  </div>
                )}

                <div className="p-4 bg-muted/30 rounded-lg space-y-1">
                  <p className="text-sm font-semibold">Resumo:</p>
                  <p className="text-sm">📝 Formato: {formatLabels[genFormat]}</p>
                  <p className="text-sm">🎨 Template: {templateOptions.find(t => t.key === templateStyle)?.label}</p>
                  <p className="text-sm">📦 {selectedProducts.length} produto(s)</p>
                  <p className="text-sm">🔗 Link direto: incluído</p>
                  {publishMode !== "save" && <p className="text-sm">📱 Plataformas: {Array.from(publishPlatforms).map(p => platformLabels[p]).join(", ")}</p>}
                  {publishMode === "schedule" && scheduleDate && <p className="text-sm">📅 Agendado: {new Date(scheduleDate).toLocaleString("pt-BR")}</p>}
                </div>

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(4)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
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
                      <p className="text-xs text-muted-foreground mt-1">{(c.product_ids || []).length} produtos · {new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
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
                    {c.product_id && (
                      <p className="text-[10px] text-primary flex items-center gap-1"><Link2 className="h-2.5 w-2.5" /> Link direto do produto</p>
                    )}
                    <p className="text-xs text-muted-foreground">{new Date(c.created_at).toLocaleDateString("pt-BR")}</p>
                    <div className="grid grid-cols-3 gap-1.5 pt-2 border-t">
                      <Button size="sm" variant="outline" className="gap-1 text-xs px-2" onClick={() => setPreviewCreative(c)}>
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="outline" className="gap-1 text-xs px-2" onClick={() => {
                        const product = c.product_id ? products.find(p => p.id === c.product_id) : null;
                        copyToClipboard(buildFullText({ headline: c.headline, body_text: c.body_text, hashtags: c.hashtags, cta: c.cta }, product));
                      }}>
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
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Zap className="h-5 w-5 text-primary" /> Automação de Marketing</CardTitle>
              <CardDescription>Gere anúncios automaticamente com um clique para cada sugestão abaixo.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Package, title: "Novo produto sem anúncio", desc: "Cria anúncio automático para produtos sem criativo.", filter: (p: Product) => !creatives.some(c => c.product_id === p.id) },
                { icon: TrendingUp, title: "Produtos com preço promocional", desc: "Anúncio focado em desconto.", filter: (p: Product) => p.original_price && p.original_price > p.price },
                { icon: Archive, title: "Estoque alto (>20 unid.)", desc: "Campanha de queima de estoque.", filter: (p: Product) => p.stock_quantity > 20 },
              ].map((rule, i) => {
                const matching = products.filter(rule.filter);
                return (
                  <div key={i} className="space-y-3">
                    <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                      <div className="p-2 rounded-lg bg-primary/10 shrink-0"><rule.icon className="h-5 w-5 text-primary" /></div>
                      <div className="flex-1">
                        <h3 className="font-medium">{rule.title}</h3>
                        <p className="text-sm text-muted-foreground mt-1">{rule.desc}</p>
                        <p className="text-xs text-primary mt-1">{matching.length} produto(s) elegível(is)</p>
                      </div>
                    </div>
                    {matching.length > 0 && (
                      <div className="ml-4 space-y-2">
                        {matching.slice(0, 5).map(p => (
                          <div key={p.id} className="flex items-center justify-between p-3 bg-background rounded-lg border">
                            <div className="flex items-center gap-3 min-w-0 flex-1">
                              {p.image_url && <img src={p.image_url} alt="" className="h-10 w-10 rounded object-cover shrink-0" />}
                              <div className="min-w-0">
                                <p className="text-sm font-medium truncate">{p.name}</p>
                                <p className="text-xs text-muted-foreground">
                                  R$ {p.price.toFixed(2)}
                                  {p.original_price && p.original_price > p.price && (
                                    <span className="line-through ml-1 opacity-60">R$ {p.original_price.toFixed(2)}</span>
                                  )}
                                  {" · Estoque: "}{p.stock_quantity}
                                </p>
                              </div>
                            </div>
                            <div className="flex gap-2 shrink-0">
                              <Button size="sm" variant="outline" onClick={() => startWizardFromProduct(p.id)} className="gap-1">
                                <PenTool className="h-3 w-3" /> Manual
                              </Button>
                              <Button size="sm" onClick={() => autoGenerateAd(p)} disabled={autoGenerating === p.id} className="gap-1">
                                {autoGenerating === p.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Zap className="h-3 w-3" />}
                                Auto
                              </Button>
                            </div>
                          </div>
                        ))}
                        {matching.length > 5 && (
                          <p className="text-xs text-muted-foreground text-center">+ {matching.length - 5} produto(s)</p>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
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
              {previewCreative.product_id && (
                <div className="p-3 bg-primary/5 border border-primary/20 rounded-lg flex items-center gap-2">
                  <Link2 className="h-4 w-4 text-primary" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground">Link direto para compra:</p>
                    <p className="text-sm text-primary truncate">{getProductUrl(previewCreative.product_id)}</p>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => copyToClipboard(getProductUrl(previewCreative.product_id!))}><Copy className="h-3 w-3" /></Button>
                </div>
              )}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-4 border-t">
                <Button variant="outline" className="gap-2" onClick={() => {
                  const product = previewCreative.product_id ? products.find(p => p.id === previewCreative.product_id) : null;
                  copyToClipboard(buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta }, product));
                }}>
                  <Copy className="h-4 w-4" /> Copiar
                </Button>
                <Button variant="outline" className="gap-2" onClick={() => {
                  const product = previewCreative.product_id ? products.find(p => p.id === previewCreative.product_id) : null;
                  downloadAsText(buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta }, product), `criativo-${previewCreative.id.slice(0, 8)}.txt`);
                }}>
                  <Download className="h-4 w-4" /> Texto
                </Button>
                {previewCreative.image_url && (
                  <Button variant="outline" className="gap-2" onClick={() => downloadImage(previewCreative.image_url!, `criativo-img-${previewCreative.id.slice(0, 8)}.jpg`)}>
                    <Download className="h-4 w-4" /> Imagem
                  </Button>
                )}
                <Button variant="outline" className="gap-2" onClick={() => {
                  const product = previewCreative.product_id ? products.find(p => p.id === previewCreative.product_id) : null;
                  const text = buildFullText({ headline: previewCreative.headline, body_text: previewCreative.body_text, hashtags: previewCreative.hashtags, cta: previewCreative.cta }, product);
                  window.open(`https://api.whatsapp.com/send?text=${encodeURIComponent(text)}`, "_blank");
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
