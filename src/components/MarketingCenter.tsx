import { useState, useEffect, useRef, useCallback, useMemo } from "react";
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
  Link2, ChevronLeft, GripVertical, CalendarDays
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

type MarketingTab = "dashboard" | "campaigns" | "wizard" | "library" | "history" | "automation" | "calendar";
type BackgroundStyle = "white" | "creative" | "oficina" | "geradores" | "pecas" | "premium" | "manutencao" | "ferramentas" | "fabrica" | "ai";
type LogoSize = "small" | "medium" | "large";

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
  { key: "generate", label: "Gerar Conteúdo", icon: Wand2 },
  { key: "preview", label: "Pré-visualização", icon: Eye },
  { key: "publish", label: "Publicar", icon: Send },
];

import logoGrundemann from "@/assets/logo-grundemann.png";
import bgOficina from "@/assets/bg-oficina.jpg";
import bgGeradores from "@/assets/bg-geradores.jpg";
import bgPecas from "@/assets/bg-pecas.jpg";
import bgPremium from "@/assets/bg-premium.jpg";
import bgOficinaStory from "@/assets/bg-oficina-story.jpg";
import bgGeradoresStory from "@/assets/bg-geradores-story.jpg";
import bgPecasStory from "@/assets/bg-pecas-story.jpg";
import bgPremiumStory from "@/assets/bg-premium-story.jpg";
import bgManutencao from "@/assets/bg-manutencao.jpg";
import bgManutencaoStory from "@/assets/bg-manutencao-story.jpg";
import bgFerramentas from "@/assets/bg-ferramentas.jpg";
import bgFerramentasStory from "@/assets/bg-ferramentas-story.jpg";
import bgFabrica from "@/assets/bg-fabrica.jpg";
import bgFabricaStory from "@/assets/bg-fabrica-story.jpg";

const bgPhotoMap: Record<string, { landscape: string; story: string; label: string; emoji: string }> = {
  oficina: { landscape: bgOficina, story: bgOficinaStory, label: "Oficina", emoji: "🔧" },
  geradores: { landscape: bgGeradores, story: bgGeradoresStory, label: "Geradores", emoji: "⚡" },
  pecas: { landscape: bgPecas, story: bgPecasStory, label: "Peças", emoji: "⚙️" },
  premium: { landscape: bgPremium, story: bgPremiumStory, label: "Premium", emoji: "✨" },
  manutencao: { landscape: bgManutencao, story: bgManutencaoStory, label: "Manutenção", emoji: "🚗" },
  ferramentas: { landscape: bgFerramentas, story: bgFerramentasStory, label: "Ferramentas", emoji: "🔨" },
  fabrica: { landscape: bgFabrica, story: bgFabricaStory, label: "Fábrica", emoji: "🏭" },
};

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

// ─── Canvas composite: professional commercial design matching Grundemann reference ───
const generateCompositeImage = async (
  imageUrl: string | null,
  text: any,
  format: string,
  bgStyle: BackgroundStyle = "creative",
  productUrl?: string,
  price?: number,
  originalPrice?: number | null,
  productName?: string,
  logoSize: LogoSize = "medium",
  customSlogan?: string,
  aiBgDataUrl?: string | null,
): Promise<Blob> => {
  const isStory = format === "story_instagram";
  const W = 1080;
  const H = isStory ? 1920 : 1080;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d")!;

  const BRAND_GREEN = "#006B3F";
  const BRAND_GREEN_DARK = "#004D2C";
  const BRAND_GREEN_LIGHT = "#009739";
  const BRAND_BLUE = "#002776";
  const BRAND_GOLD = "#FFDF00";
  const CARD_BG = "#e8ecef";
  const CARD_SHADOW = "rgba(0,0,0,0.15)";
  const TEXT_DARK = "#1a1a1a";
  const TEXT_GRAY = "#555555";
  const WHITE = "#ffffff";

  // ══════════ BACKGROUND: Light silver gradient with subtle green wave curves ══════════
  const bgGrad = ctx.createLinearGradient(0, 0, W, H);
  bgGrad.addColorStop(0, "#f0f2f5");
  bgGrad.addColorStop(0.3, "#e8edf2");
  bgGrad.addColorStop(0.6, "#f2f4f6");
  bgGrad.addColorStop(1, "#eaecf0");
  ctx.fillStyle = bgGrad;
  ctx.fillRect(0, 0, W, H);

  // Subtle wave decorations (green curves like reference)
  ctx.save();
  ctx.globalAlpha = 0.07;
  ctx.strokeStyle = BRAND_GREEN;
  ctx.lineWidth = 2;
  for (let i = 0; i < 6; i++) {
    ctx.beginPath();
    ctx.moveTo(-50 + i * 80, 0);
    ctx.bezierCurveTo(W * 0.2 + i * 40, H * 0.15, W * 0.5 - i * 30, H * 0.25, W + 50, H * 0.1 + i * 60);
    ctx.stroke();
  }
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(-50, H * 0.7 + i * 50);
    ctx.bezierCurveTo(W * 0.3, H * 0.65 + i * 40, W * 0.7, H * 0.8 + i * 30, W + 50, H * 0.75 + i * 50);
    ctx.stroke();
  }
  ctx.restore();

  // Thin green accent line at very top
  ctx.fillStyle = BRAND_GREEN;
  ctx.fillRect(0, 0, W, 6);

  // ══════════ HEADER AREA ══════════
  const headerH = isStory ? 280 : 200;

  // Logo (top-left)
  let logoEndY = 80;
  try {
    const logo = await loadImage(logoGrundemann);
    const sizeMap = { small: 90, medium: 120, large: 160 };
    const logoH = sizeMap[logoSize];
    const logoW = (logo.width / logo.height) * logoH;
    const logoX = 40;
    const logoY = 22;
    ctx.drawImage(logo, logoX, logoY, logoW, logoH);
    logoEndY = logoY + logoH;
  } catch {
    ctx.fillStyle = BRAND_GREEN;
    ctx.font = `bold 44px 'Segoe UI', Arial, sans-serif`;
    ctx.fillText("Gründemann", 40, 70);
    logoEndY = 80;
  }

  // Contact info (top-right)
  ctx.save();
  ctx.fillStyle = BRAND_GREEN_DARK;
  ctx.font = `bold 30px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "right";
  ctx.fillText("51-981825748", W - 40, 50);
  ctx.fillStyle = TEXT_GRAY;
  ctx.font = `22px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText("adair.grundemann@gmail.com", W - 40, 82);
  ctx.textAlign = "left";
  ctx.restore();

  // Subtitle line
  ctx.save();
  ctx.fillStyle = TEXT_GRAY;
  ctx.font = `italic 22px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Oficina Geradores — peças: Diesel, gasolina, geradores e oficina", W / 2, logoEndY + 20);
  ctx.restore();

  // Address line
  const addrY = logoEndY + 50;
  ctx.save();
  ctx.fillStyle = TEXT_DARK;
  ctx.font = `bold 22px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S", W / 2, addrY);
  ctx.textAlign = "left";
  ctx.restore();

  // Separator line
  ctx.strokeStyle = BRAND_GREEN;
  ctx.globalAlpha = 0.3;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(60, addrY + 18);
  ctx.lineTo(W - 60, addrY + 18);
  ctx.stroke();
  ctx.globalAlpha = 1;

  const contentStartY = addrY + 35;
  const footerH = 65;
  const contentEndY = H - footerH - 10;
  const contentH = contentEndY - contentStartY;

  // ══════════ PRODUCT CARD ══════════
  const cardPad = isStory ? 40 : 50;
  const cardX = cardPad;
  const cardY = contentStartY;
  const cardW = W - cardPad * 2;
  const cardH = contentH;

  // Card shadow
  ctx.save();
  ctx.shadowColor = CARD_SHADOW;
  ctx.shadowBlur = 20;
  ctx.shadowOffsetX = 4;
  ctx.shadowOffsetY = 6;
  ctx.fillStyle = CARD_BG;
  roundRect(ctx, cardX, cardY, cardW, cardH, 18);
  ctx.fill();
  ctx.restore();

  // Card white inner
  ctx.fillStyle = WHITE;
  roundRect(ctx, cardX + 3, cardY + 3, cardW - 6, cardH - 6, 16);
  ctx.fill();

  // ── Green header bar with product name ──
  const greenBarH = isStory ? 65 : 55;
  ctx.save();
  const gBarGrad = ctx.createLinearGradient(cardX, cardY, cardX + cardW, cardY);
  gBarGrad.addColorStop(0, BRAND_GREEN_DARK);
  gBarGrad.addColorStop(0.5, BRAND_GREEN);
  gBarGrad.addColorStop(1, BRAND_GREEN_DARK);
  ctx.fillStyle = gBarGrad;
  // Top rounded corners only
  ctx.beginPath();
  ctx.moveTo(cardX + 16, cardY);
  ctx.lineTo(cardX + cardW - 16, cardY);
  ctx.quadraticCurveTo(cardX + cardW, cardY, cardX + cardW, cardY + 16);
  ctx.lineTo(cardX + cardW, cardY + greenBarH);
  ctx.lineTo(cardX, cardY + greenBarH);
  ctx.lineTo(cardX, cardY + 16);
  ctx.quadraticCurveTo(cardX, cardY, cardX + 16, cardY);
  ctx.closePath();
  ctx.fill();
  ctx.restore();

  // Product name in green bar
  const displayName = productName || text?.headline || "Produto";
  ctx.save();
  ctx.fillStyle = WHITE;
  ctx.font = `bold ${isStory ? 34 : 30}px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText(displayName.length > 40 ? displayName.slice(0, 37) + "..." : displayName, cardX + cardW / 2, cardY + greenBarH - (isStory ? 18 : 15));
  ctx.textAlign = "left";
  ctx.restore();

  // ── Card content area ──
  const innerY = cardY + greenBarH + 15;
  const innerH = cardH - greenBarH - 15;

  if (isStory) {
    // ═══ STORY LAYOUT: image top, price+desc below, CTA at bottom ═══

    // Product image (centered, upper area)
    let imgBottomY = innerY + innerH * 0.45;
    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        const maxImgW = cardW - 80;
        const maxImgH = innerH * 0.40;
        const scale = Math.min(maxImgW / img.width, maxImgH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = cardX + (cardW - dw) / 2;
        const dy = innerY + 15;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
        imgBottomY = dy + dh + 20;
      } catch { /* fallback */ }
    }

    // Price section
    if (price) {
      const priceAreaY = imgBottomY + 10;

      // Price prefix "R$"
      ctx.save();
      ctx.fillStyle = TEXT_DARK;
      ctx.font = `bold 32px 'Segoe UI', Arial, sans-serif`;
      const priceStr = `R$${price.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      // Show full formatted price large and centered
      ctx.textAlign = "center";
      ctx.font = `bold 72px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(priceStr, cardX + cardW / 2, priceAreaY + 50);
      ctx.restore();

      if (originalPrice && originalPrice > price) {
        ctx.save();
        ctx.fillStyle = "#999";
        ctx.font = `24px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        const oldText = `De R$ ${originalPrice.toFixed(2)}`;
        ctx.fillText(oldText, cardX + cardW / 2, priceAreaY - 5);
        const tw = ctx.measureText(oldText).width;
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(cardX + cardW / 2 - tw / 2, priceAreaY - 10);
        ctx.lineTo(cardX + cardW / 2 + tw / 2, priceAreaY - 10);
        ctx.stroke();
        ctx.textAlign = "left";
        ctx.restore();
      }

      // Installments
      ctx.save();
      ctx.fillStyle = TEXT_GRAY;
      ctx.font = `22px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(`ou 3x de R$ ${(price / 3).toFixed(2)} sem juros`, cardX + cardW / 2, priceAreaY + 85);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // Description text
    if (text?.body_text || text?.headline) {
      const descText = text.body_text || text.headline || "";
      ctx.save();
      ctx.fillStyle = TEXT_GRAY;
      ctx.font = `22px 'Segoe UI', Arial, sans-serif`;
      const descY = price ? imgBottomY + 130 : imgBottomY + 30;
      wrapText(ctx, descText.slice(0, 150), cardX + 40, descY, cardW - 80, 30);
      ctx.restore();
    }

    // Custom slogan
    if (customSlogan) {
      ctx.save();
      ctx.fillStyle = BRAND_BLUE;
      ctx.font = `bold italic 24px 'Segoe UI', Arial, sans-serif`;
      ctx.textAlign = "center";
      ctx.fillText(customSlogan, cardX + cardW / 2, contentEndY - 115);
      ctx.textAlign = "left";
      ctx.restore();
    }

    // CTA Button (green, WhatsApp style)
    const ctaBtnY = contentEndY - 80;
    const ctaBtnW = cardW - 100;
    const ctaBtnH = 60;
    const ctaBtnX = cardX + 50;
    ctx.save();
    const ctaGrad = ctx.createLinearGradient(ctaBtnX, ctaBtnY, ctaBtnX + ctaBtnW, ctaBtnY);
    ctaGrad.addColorStop(0, BRAND_GREEN_DARK);
    ctaGrad.addColorStop(0.5, BRAND_GREEN_LIGHT);
    ctaGrad.addColorStop(1, BRAND_GREEN_DARK);
    ctx.fillStyle = ctaGrad;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, ctaBtnX, ctaBtnY, ctaBtnW, ctaBtnH, 12);
    ctx.fill();
    ctx.restore();
    // WhatsApp icon placeholder + text
    ctx.fillStyle = WHITE;
    ctx.font = `bold 26px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    const ctaLabel = text?.cta || "COMPRAR";
    ctx.fillText(`☎  ${ctaLabel.toUpperCase()}`, ctaBtnX + ctaBtnW / 2, ctaBtnY + 40);
    ctx.textAlign = "left";

  } else {
    // ═══ POST LAYOUT (1080x1080): image left, info right ═══
    const splitX = cardX + cardW * 0.48;
    const rightX = splitX + 20;
    const rightW = cardX + cardW - rightX - 20;

    // Product image (left side of card)
    if (imageUrl) {
      try {
        const img = await loadImage(imageUrl);
        const maxImgW = splitX - cardX - 40;
        const maxImgH = innerH - 100;
        const scale = Math.min(maxImgW / img.width, maxImgH / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = cardX + (splitX - cardX - dw) / 2;
        const dy = innerY + (innerH - 80 - dh) / 2;
        ctx.save();
        ctx.shadowColor = "rgba(0,0,0,0.12)";
        ctx.shadowBlur = 15;
        ctx.shadowOffsetY = 5;
        ctx.drawImage(img, dx, dy, dw, dh);
        ctx.restore();
      } catch { /* fallback */ }
    }

    // Right side: Price + Description + CTA
    const rightContentY = innerY + 20;

    // Price
    if (price) {
      ctx.save();
      ctx.fillStyle = TEXT_DARK;
      ctx.font = `bold 60px 'Segoe UI', Arial, sans-serif`;
      const priceStr = `R$${price.toLocaleString("pt-BR", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
      ctx.fillText(priceStr, rightX, rightContentY + 50);
      ctx.restore();

      if (originalPrice && originalPrice > price) {
        ctx.save();
        ctx.fillStyle = "#999";
        ctx.font = `22px 'Segoe UI', Arial, sans-serif`;
        const oldText = `De R$ ${originalPrice.toFixed(2)}`;
        ctx.fillText(oldText, rightX, rightContentY - 5);
        const tw = ctx.measureText(oldText).width;
        ctx.strokeStyle = "#999";
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(rightX, rightContentY - 10);
        ctx.lineTo(rightX + tw, rightContentY - 10);
        ctx.stroke();
        ctx.restore();

        // Discount badge
        const discount = Math.round((1 - price / originalPrice) * 100);
        ctx.save();
        ctx.fillStyle = "#cc0000";
        roundRect(ctx, rightX + tw + 10, rightContentY - 28, 90, 28, 14);
        ctx.fill();
        ctx.fillStyle = WHITE;
        ctx.font = `bold 16px 'Segoe UI', Arial, sans-serif`;
        ctx.textAlign = "center";
        ctx.fillText(`-${discount}%`, rightX + tw + 55, rightContentY - 10);
        ctx.textAlign = "left";
        ctx.restore();
      }

      // Installments
      ctx.save();
      ctx.fillStyle = TEXT_GRAY;
      ctx.font = `20px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(`ou 3x de R$ ${(price / 3).toFixed(2)}`, rightX, rightContentY + 80);
      ctx.fillText("sem juros", rightX, rightContentY + 105);
      ctx.restore();
    }

    // Description
    if (text?.body_text || text?.headline) {
      const descText = text.body_text || text.headline || "";
      ctx.save();
      ctx.fillStyle = TEXT_GRAY;
      ctx.font = `22px 'Segoe UI', Arial, sans-serif`;
      const descStartY = price ? rightContentY + 140 : rightContentY + 30;
      wrapText(ctx, descText.slice(0, 120), rightX, descStartY, rightW, 28);
      ctx.restore();
    }

    // Custom slogan
    if (customSlogan) {
      ctx.save();
      ctx.fillStyle = BRAND_BLUE;
      ctx.font = `bold italic 22px 'Segoe UI', Arial, sans-serif`;
      ctx.fillText(customSlogan, rightX, contentEndY - 95);
      ctx.restore();
    }

    // CTA Button (green, WhatsApp style, right side)
    const ctaBtnY = contentEndY - 75;
    const ctaBtnW = rightW;
    const ctaBtnH = 52;
    ctx.save();
    const ctaGrad = ctx.createLinearGradient(rightX, ctaBtnY, rightX + ctaBtnW, ctaBtnY);
    ctaGrad.addColorStop(0, BRAND_GREEN_DARK);
    ctaGrad.addColorStop(0.5, BRAND_GREEN_LIGHT);
    ctaGrad.addColorStop(1, BRAND_GREEN_DARK);
    ctx.fillStyle = ctaGrad;
    ctx.shadowColor = "rgba(0,0,0,0.2)";
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 3;
    roundRect(ctx, rightX, ctaBtnY, ctaBtnW, ctaBtnH, 12);
    ctx.fill();
    ctx.restore();
    ctx.fillStyle = WHITE;
    ctx.font = `bold 24px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    const ctaLabel = text?.cta || "COMPRAR";
    ctx.fillText(`☎  ${ctaLabel.toUpperCase()}`, rightX + ctaBtnW / 2, ctaBtnY + 35);
    ctx.textAlign = "left";
  }

  // ══════════ FOOTER BAR ══════════
  // Green footer strip
  ctx.save();
  ctx.fillStyle = BRAND_GREEN;
  ctx.fillRect(0, H - footerH, W, footerH);
  // Address text centered
  ctx.fillStyle = WHITE;
  ctx.font = `bold 22px 'Segoe UI', Arial, sans-serif`;
  ctx.textAlign = "center";
  ctx.fillText("Luiz Bernardo da Silva, 190 - Pinheiro - São Leopoldo - R.S", W / 2, H - footerH + 28);
  // Phone + email
  ctx.font = `20px 'Segoe UI', Arial, sans-serif`;
  ctx.fillText("📞 (51) 98182-5748   •   ✉ adair.grundemann@gmail.com", W / 2, H - footerH + 55);
  ctx.textAlign = "left";
  ctx.restore();

  // Product link (subtle, above footer)
  if (productUrl) {
    ctx.fillStyle = TEXT_GRAY;
    ctx.font = `16px 'Segoe UI', Arial, sans-serif`;
    ctx.textAlign = "center";
    ctx.fillText(`🔗 ${productUrl}`, W / 2, H - footerH - 8);
    ctx.textAlign = "left";
  }

  // Bottom accent line
  ctx.fillStyle = BRAND_GREEN_DARK;
  ctx.fillRect(0, H - 4, W, 4);

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

// ─── Calendar helpers ───
const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();
const MONTH_NAMES = ["Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho", "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro"];
const WEEKDAY_NAMES = ["Dom", "Seg", "Ter", "Qua", "Qui", "Sex", "Sáb"];

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
  const [backgroundStyle, setBackgroundStyle] = useState<BackgroundStyle>("creative");
  const [compositeBlob, setCompositeBlob] = useState<Blob | null>(null);
  const [compositeUrl, setCompositeUrl] = useState<string | null>(null);
  const [generatingComposite, setGeneratingComposite] = useState(false);
  const [customCta, setCustomCta] = useState("");
  const [customSlogan, setCustomSlogan] = useState("");
  const [logoSize, setLogoSize] = useState<LogoSize>("medium");
  const [aiBgUrl, setAiBgUrl] = useState<string | null>(null);
  const [generatingAiBg, setGeneratingAiBg] = useState(false);

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

  // Calendar
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [draggedPostId, setDraggedPostId] = useState<string | null>(null);

  useEffect(() => { loadAll(); }, []);

  const selectedProducts = products.filter(p => selectedProductIds.has(p.id));

  // Generate composite whenever text changes
  useEffect(() => {
    if (generatedText && wizardStep >= 3) {
      buildComposite();
    }
  }, [generatedText, wizardStep, backgroundStyle, logoSize, customCta, customSlogan, aiBgUrl]);

  const generateAiBackground = async () => {
    setGeneratingAiBg(true);
    try {
      const product = selectedProducts[0];
      const { data, error } = await supabase.functions.invoke("generate-ai-background", {
        body: {
          productName: product?.name || "peças industriais",
          category: product?.category_id ? getCategoryName(product.category_id) : "motores",
          format: genFormat,
        },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.image_url) {
        setAiBgUrl(data.image_url);
        toast({ title: "🎨 Fundo IA gerado!", description: "O fundo personalizado foi criado com sucesso." });
      }
    } catch (err: any) {
      toast({ title: "Erro ao gerar fundo IA", description: err.message, variant: "destructive" });
    } finally {
      setGeneratingAiBg(false);
    }
  };

  const buildComposite = async () => {
    if (!generatedText) return;
    if (backgroundStyle === "ai" && !aiBgUrl) return;
    setGeneratingComposite(true);
    try {
      const product = selectedProducts[0];
      const imgSrc = product?.image_url || null;
      const productUrl = product ? getProductUrl(product.id) : undefined;
      const textWithCta = customCta ? { ...generatedText, cta: customCta } : generatedText;
      const blob = await generateCompositeImage(
        imgSrc, textWithCta, genFormat, backgroundStyle,
        productUrl, product?.price, product?.original_price, product?.name, logoSize,
        customSlogan, aiBgUrl,
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

  // Build full text for copy/download
  const buildFullText = (text: any = generatedText, product?: Product | null) => {
    if (!text) return "";
    const parts: string[] = [];
    if (text.headline) parts.push(text.headline);
    if (text.short_description) parts.push(text.short_description);
    if (text.body_text) parts.push("", text.body_text);
    const ctaText = customCta || text.cta;
    if (ctaText) parts.push("", `👉 ${ctaText}`);
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
      await navigator.clipboard.write([new ClipboardItem({ "image/png": compositeBlob })]);
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
          toast({ title: "✅ Pronto para publicar!", description: "Imagem copiada! O texto também foi copiado." });
        } catch {
          downloadBlob(compositeBlob, `anuncio-completo-${Date.now()}.png`);
          toast({ title: "Texto copiado e imagem baixada!" });
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
  const uploadCompositeToStorage = async (blob: Blob, filename: string): Promise<string | null> => {
    try {
      const { data, error } = await supabase.storage
        .from("product-images")
        .upload(`marketing/${filename}`, blob, { contentType: "image/png", upsert: true });
      if (error) throw error;
      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(data.path);
      return urlData.publicUrl;
    } catch (err) {
      console.error("Upload error:", err);
      return null;
    }
  };

  const finalizeWizard = async () => {
    if (!generatedText) return;
    setLoading(true);
    try {
      const product = selectedProducts[0];

      // Upload composite image to storage
      let creativeImageUrl = product?.image_url || null;
      if (compositeBlob) {
        const filename = `creative-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const uploadedUrl = await uploadCompositeToStorage(compositeBlob, filename);
        if (uploadedUrl) creativeImageUrl = uploadedUrl;
      }

      const creativeData: any = {
        title: generatedText.headline || `Criativo - ${product?.name || "Geral"}`,
        format: genFormat,
        product_id: product?.id || null,
        headline: generatedText.headline || null,
        body_text: generatedText.body_text || null,
        hashtags: generatedText.hashtags || null,
        cta: generatedText.cta || null,
        image_url: creativeImageUrl,
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
    setCompositeBlob(null);
    setCompositeUrl(null);
    setGenInstructions("");
    setPublishPlatforms(new Set(["instagram"]));
    setScheduleDate("");
    setPublishMode("save");
    setBackgroundStyle("creative");
    setCustomCta("");
    setCustomSlogan("");
    setLogoSize("medium");
    setAiBgUrl(null);
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
    setCompositeBlob(null);
    setCompositeUrl(null);
    setTab("wizard");
  };

  // Auto-generate ad
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

      // Generate composite image for the auto-generated ad
      let creativeImageUrl = product.image_url || null;
      try {
        const compositeBlob = await generateCompositeImage(
          product.image_url, data, "post_instagram", "creative",
          getProductUrl(product.id), product.price, product.original_price, product.name, "medium",
        );
        const filename = `creative-auto-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.png`;
        const uploadedUrl = await uploadCompositeToStorage(compositeBlob, filename);
        if (uploadedUrl) creativeImageUrl = uploadedUrl;
      } catch (compErr) {
        console.error("Auto composite error:", compErr);
      }

      await supabase.from("marketing_creatives").insert({
        title: data.headline || `Anúncio - ${product.name}`,
        format: "post_instagram",
        product_id: product.id,
        headline: data.headline || null,
        body_text: data.body_text || null,
        hashtags: data.hashtags || null,
        cta: data.cta || null,
        image_url: creativeImageUrl,
        status: "draft",
      });

      toast({ title: `✅ Anúncio de "${product.name}" criado!`, description: "Salvo na biblioteca." });
      loadAll();
    } catch (err: any) {
      toast({ title: "Erro", description: err.message, variant: "destructive" });
    } finally {
      setAutoGenerating(null);
    }
  };

  // ─── Calendar drag-and-drop ───
  const handleDragStart = (postId: string) => {
    setDraggedPostId(postId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
  };

  const handleDrop = async (e: React.DragEvent, day: number) => {
    e.preventDefault();
    if (!draggedPostId) return;
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const newDate = new Date(year, month, day, 10, 0, 0);
    await supabase.from("marketing_posts").update({
      scheduled_at: newDate.toISOString(),
      status: "scheduled",
    }).eq("id", draggedPostId);
    setDraggedPostId(null);
    toast({ title: "📅 Post reagendado!" });
    loadAll();
  };

  const calendarYear = calendarDate.getFullYear();
  const calendarMonth = calendarDate.getMonth();
  const daysInMonth = getDaysInMonth(calendarYear, calendarMonth);
  const firstDay = getFirstDayOfMonth(calendarYear, calendarMonth);

  const getPostsForDay = (day: number) => {
    return posts.filter(p => {
      const d = p.scheduled_at || p.published_at;
      if (!d) return false;
      const pd = new Date(d);
      return pd.getFullYear() === calendarYear && pd.getMonth() === calendarMonth && pd.getDate() === day;
    });
  };

  const subTabs = [
    { key: "dashboard" as const, label: "Dashboard", icon: BarChart3 },
    { key: "wizard" as const, label: "Criar Anúncio", icon: Sparkles },
    { key: "campaigns" as const, label: "Campanhas", icon: Target },
    { key: "library" as const, label: "Biblioteca", icon: Layers },
    { key: "calendar" as const, label: "Calendário", icon: CalendarDays },
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
          {compositeUrl ? (
            <img src={compositeUrl} alt="Preview" className="w-full h-full object-contain" />
          ) : imageUrl ? (
            <img src={imageUrl} alt="Preview" className="w-full h-full object-cover" />
          ) : selectedProducts[0]?.image_url ? (
            <img src={selectedProducts[0].image_url} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <ImageIcon className="w-16 h-16 text-muted-foreground/30" />
            </div>
          )}
        </div>
        <div className="p-3 space-y-2">
          {(customCta || text?.cta) && (
            <button className="w-full bg-primary text-primary-foreground text-xs font-semibold py-2 rounded">
              {customCta || text.cta}
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
            <button key={s.key} onClick={() => { setTab(s.key); if (s.key === "wizard") setWizardStep(0); }}
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
              <Button onClick={() => { setTab("wizard"); setWizardStep(0); }} className="gap-2"><Sparkles className="h-4 w-4" /> Criar Anúncio</Button>
              <Button onClick={() => setTab("campaigns")} variant="secondary" className="gap-2"><Plus className="h-4 w-4" /> Nova Campanha</Button>
              <Button onClick={() => setTab("calendar")} variant="outline" className="gap-2"><CalendarDays className="h-4 w-4" /> Calendário</Button>
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
                <CardDescription>Defina o formato, tipo de campanha e estilo visual.</CardDescription>
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
                        <Palette className="h-4 w-4 text-primary" /> Estilo do Criativo
                      </Label>
                      <div className="p-4 rounded-lg border border-primary/30 bg-primary/5">
                        <p className="text-sm font-semibold text-primary">✅ Estilo Grundemann Profissional</p>
                        <p className="text-xs text-muted-foreground mt-1">Layout com fundo claro, cards com barra verde, foto do produto, preço em destaque e botão COMPRAR no estilo da marca.</p>
                      </div>
                    </div>

                    {/* Logo Size */}
                    <div className="space-y-3">
                      <Label className="font-semibold flex items-center gap-2">
                        <Image className="h-4 w-4 text-primary" /> Tamanho do Logo
                      </Label>
                      <div className="grid grid-cols-3 gap-2">
                        {([
                          { key: "small" as LogoSize, label: "Pequeno" },
                          { key: "medium" as LogoSize, label: "Médio" },
                          { key: "large" as LogoSize, label: "Grande" },
                        ]).map(s => (
                          <button key={s.key} onClick={() => setLogoSize(s.key)}
                            className={`p-3 rounded-lg border-2 text-center transition-all ${logoSize === s.key ? "border-primary bg-primary/5" : "border-border hover:border-primary/50"}`}>
                            <p className={`text-sm font-semibold ${logoSize === s.key ? "text-primary" : ""}`}>{s.label}</p>
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Slogan */}
                    <div className="space-y-3">
                      <Label className="font-semibold flex items-center gap-2">
                        <Megaphone className="h-4 w-4 text-primary" /> Slogan / Mensagem Promocional
                      </Label>
                      <Input value={customSlogan} onChange={e => setCustomSlogan(e.target.value)}
                        placeholder="Ex: Qualidade que move o Brasil!, Preço imbatível!, Entrega rápida..." />
                      <p className="text-xs text-muted-foreground">Aparece como faixa destacada na arte. Deixe vazio para não incluir.</p>
                    </div>

                    {/* Custom CTA */}
                    <div className="space-y-3">
                      <Label className="font-semibold flex items-center gap-2">
                        <PenTool className="h-4 w-4 text-primary" /> Texto do CTA (botão)
                      </Label>
                      <Input value={customCta} onChange={e => setCustomCta(e.target.value)}
                        placeholder="Ex: COMPRE AGORA, PEÇA JÁ, GARANTA O SEU... (deixe vazio para IA gerar)" />
                      <p className="text-xs text-muted-foreground">Se deixar vazio, a IA criará automaticamente</p>
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
                  <Button onClick={() => setWizardStep(2)} className="gap-2">Gerar Conteúdo <ArrowRight className="h-4 w-4" /></Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 3: Generate Content */}
          {wizardStep === 2 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><Wand2 className="h-5 w-5 text-primary" /> Gerar Conteúdo com IA</CardTitle>
                <CardDescription>A IA vai criar o texto publicitário e a arte será gerada automaticamente com a imagem original do produto.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-muted/30 rounded-lg space-y-2">
                  <p className="text-sm"><strong>Resumo da configuração:</strong></p>
                  <p className="text-sm">📦 {selectedProducts.length} produto(s): {selectedProducts.map(p => p.name).join(", ")}</p>
                  <p className="text-sm">📐 Formato: {formatLabels[genFormat]}</p>
                  <p className="text-sm">🎯 Campanha: {campaignTypeLabels[genCampaignType]}</p>
                  <p className="text-sm">🎨 Estilo: Grundemann Profissional</p>
                  {customSlogan && <p className="text-sm">📢 Slogan: {customSlogan}</p>}
                  <p className="text-sm">🔗 Link direto: incluído automaticamente</p>
                </div>

                <div className="flex flex-col items-center gap-4">
                  <Button onClick={generateText} disabled={generating} size="lg" className="gap-2 h-14 px-8 text-lg">
                    {generating ? <Loader2 className="h-5 w-5 animate-spin" /> : <Sparkles className="h-5 w-5" />}
                    {generating ? "Gerando texto e arte..." : "🚀 Gerar Anúncio Completo"}
                  </Button>
                  <p className="text-xs text-muted-foreground text-center">A IA gerará o texto publicitário e a arte será montada automaticamente com a imagem original do produto</p>
                </div>

                {generatedText && (
                  <div className="p-4 bg-primary/5 rounded-lg border border-primary/20 space-y-3">
                    <div className="flex items-center gap-2 text-primary">
                      <Check className="h-5 w-5" />
                      <span className="font-semibold">Conteúdo gerado com sucesso!</span>
                    </div>
                    {generatedText.headline && <p className="text-lg font-bold">{generatedText.headline}</p>}
                    {generatedText.body_text && <p className="text-sm">{generatedText.body_text}</p>}
                    {generatedText.cta && <Badge variant="secondary">{generatedText.cta}</Badge>}
                    {generatedText.hashtags && <p className="text-xs text-primary">{generatedText.hashtags}</p>}
                  </div>
                )}

                <div className="flex justify-between">
                  <Button variant="outline" onClick={() => setWizardStep(1)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                  <Button onClick={() => setWizardStep(3)} disabled={!generatedText} className="gap-2">
                    Ver Pré-visualização <ArrowRight className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Step 4: Preview */}
          {wizardStep === 3 && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Image className="h-5 w-5 text-primary" /> Arte Final
                    </CardTitle>
                    <CardDescription>A imagem do produto está preservada sem alterações. O fundo é gerado automaticamente baseado no tipo de produto.</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {generatingComposite ? (
                      <div className="flex flex-col items-center justify-center py-16 gap-3">
                        <Loader2 className="h-10 w-10 animate-spin text-primary" />
                        <p className="text-sm text-muted-foreground">Montando arte final...</p>
                      </div>
                    ) : compositeUrl ? (
                      <div className="space-y-3">
                        <img src={compositeUrl} alt="Arte final" className="w-full rounded-lg border shadow-md" />
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                          <Button variant="outline" size="sm" className="gap-1" onClick={copyCompositeToClipboard}>
                            <Copy className="h-3 w-3" /> Copiar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={downloadComposite}>
                            <Download className="h-3 w-3" /> Baixar
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={() => copyToClipboard(buildFullText())}>
                            <FileText className="h-3 w-3" /> Texto
                          </Button>
                          <Button variant="outline" size="sm" className="gap-1" onClick={copyAllForPublication}>
                            <Share2 className="h-3 w-3" /> Tudo
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <div className="text-center py-8">
                        <p className="text-sm text-muted-foreground">Gerando arte...</p>
                        <Button onClick={buildComposite} className="mt-3 gap-2"><RefreshCw className="h-4 w-4" /> Gerar Novamente</Button>
                      </div>
                    )}

                    {/* Style toggle */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Estilo do Fundo</Label>
                      <div className="flex gap-1.5 flex-wrap">
                        <Button size="sm" variant={backgroundStyle === "creative" ? "default" : "outline"} onClick={() => setBackgroundStyle("creative")} className="gap-1 text-xs h-8">
                          <Sparkles className="h-3 w-3" /> Criativo
                        </Button>
                        <Button size="sm" variant={backgroundStyle === "white" ? "default" : "outline"} onClick={() => setBackgroundStyle("white")} className="gap-1 text-xs h-8">
                          <Package className="h-3 w-3" /> Branco
                        </Button>
                        {Object.entries(bgPhotoMap).map(([key, info]) => (
                          <Button key={key} size="sm" variant={backgroundStyle === key ? "default" : "outline"} onClick={() => setBackgroundStyle(key as BackgroundStyle)} className="gap-1 text-xs h-8">
                            {info.emoji} {info.label}
                          </Button>
                        ))}
                        <Button size="sm" variant={backgroundStyle === "ai" ? "default" : "outline"} onClick={() => { setBackgroundStyle("ai"); if (!aiBgUrl) generateAiBackground(); }} className="gap-1 text-xs h-8" disabled={generatingAiBg}>
                          {generatingAiBg ? <Loader2 className="h-3 w-3 animate-spin" /> : <Wand2 className="h-3 w-3" />} Fundo IA
                        </Button>
                      </div>
                      {backgroundStyle === "ai" && (
                        <Button size="sm" variant="outline" onClick={generateAiBackground} disabled={generatingAiBg} className="gap-1 text-xs mt-1">
                          {generatingAiBg ? <Loader2 className="h-3 w-3 animate-spin" /> : <RefreshCw className="h-3 w-3" />}
                          {generatingAiBg ? "Gerando..." : "Novo Fundo IA"}
                        </Button>
                      )}
                    </div>

                    {/* Logo size in preview */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Tamanho do Logo</Label>
                      <div className="flex gap-2">
                        {(["small", "medium", "large"] as LogoSize[]).map(s => (
                          <Button key={s} size="sm" variant={logoSize === s ? "default" : "outline"} onClick={() => setLogoSize(s)}>
                            {s === "small" ? "P" : s === "medium" ? "M" : "G"}
                          </Button>
                        ))}
                      </div>
                    </div>

                    {/* Custom Slogan in preview */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Slogan / Mensagem</Label>
                      <Input size={1} value={customSlogan} onChange={e => setCustomSlogan(e.target.value)} placeholder="Ex: Qualidade que move o Brasil!" className="h-8 text-xs" />
                    </div>

                    {/* Custom CTA in preview */}
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold">Texto do CTA</Label>
                      <Input size={1} value={customCta} onChange={e => setCustomCta(e.target.value)} placeholder={generatedText?.cta || "COMPRE AGORA"} className="h-8 text-xs" />
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader><CardTitle className="text-lg">Preview no Celular</CardTitle></CardHeader>
                  <CardContent>
                    <PhoneMockup text={generatedText} imageUrl={null} />
                  </CardContent>
                </Card>
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setWizardStep(2)} className="gap-2"><ArrowLeft className="h-4 w-4" /> Voltar</Button>
                <Button onClick={() => setWizardStep(4)} className="gap-2">Salvar / Publicar <ArrowRight className="h-4 w-4" /></Button>
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
                  <p className="text-sm">🎨 Estilo: {backgroundStyle === "white" ? "Fundo Branco" : backgroundStyle === "ai" ? "🤖 Fundo IA" : bgPhotoMap[backgroundStyle] ? `📷 ${bgPhotoMap[backgroundStyle].label}` : "Arte Criativa"}</p>
                  <p className="text-sm">📦 {selectedProducts.length} produto(s)</p>
                  <p className="text-sm">🔗 Link direto: incluído</p>
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

      {/* ═══════════════ CALENDAR ═══════════════ */}
      {tab === "calendar" && (
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2"><CalendarDays className="h-5 w-5 text-primary" /> Calendário de Marketing</CardTitle>
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth - 1, 1))}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm font-semibold min-w-[160px] text-center">
                    {MONTH_NAMES[calendarMonth]} {calendarYear}
                  </span>
                  <Button size="sm" variant="outline" onClick={() => setCalendarDate(new Date(calendarYear, calendarMonth + 1, 1))}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => setCalendarDate(new Date())}>Hoje</Button>
                </div>
              </div>
              <CardDescription>Arraste publicações entre dias para reagendar. Os posts agendados e publicados aparecem automaticamente.</CardDescription>
            </CardHeader>
            <CardContent>
              {/* Weekday headers */}
              <div className="grid grid-cols-7 gap-1 mb-1">
                {WEEKDAY_NAMES.map(d => (
                  <div key={d} className="text-center text-xs font-semibold text-muted-foreground py-2">{d}</div>
                ))}
              </div>
              {/* Day cells */}
              <div className="grid grid-cols-7 gap-1">
                {/* Empty cells before first day */}
                {Array.from({ length: firstDay }).map((_, i) => (
                  <div key={`empty-${i}`} className="min-h-[100px] bg-muted/20 rounded-lg" />
                ))}
                {/* Day cells */}
                {Array.from({ length: daysInMonth }).map((_, i) => {
                  const day = i + 1;
                  const dayPosts = getPostsForDay(day);
                  const isToday = new Date().getFullYear() === calendarYear && new Date().getMonth() === calendarMonth && new Date().getDate() === day;
                  return (
                    <div
                      key={day}
                      onDragOver={handleDragOver}
                      onDrop={(e) => handleDrop(e, day)}
                      className={`min-h-[100px] rounded-lg border p-1.5 transition-colors ${
                        isToday ? "border-primary bg-primary/5" : "border-border bg-background hover:bg-muted/30"
                      } ${draggedPostId ? "border-dashed border-primary/50" : ""}`}
                    >
                      <div className={`text-xs font-medium mb-1 ${isToday ? "text-primary font-bold" : "text-muted-foreground"}`}>
                        {day}
                      </div>
                      <div className="space-y-1">
                        {dayPosts.map(p => {
                          const PIcon = platformIcons[p.platform] || Send;
                          const creative = creatives.find(c => c.id === p.creative_id);
                          return (
                            <div
                              key={p.id}
                              draggable
                              onDragStart={() => handleDragStart(p.id)}
                              className={`text-[10px] px-1.5 py-1 rounded cursor-grab active:cursor-grabbing flex items-center gap-1 truncate ${
                                p.status === "published" ? "bg-primary/20 text-primary" : "bg-secondary text-secondary-foreground"
                              }`}
                              title={creative?.title || p.content?.slice(0, 50) || p.platform}
                            >
                              <PIcon className="h-2.5 w-2.5 shrink-0" />
                              <span className="truncate">{creative?.title?.slice(0, 15) || platformLabels[p.platform]}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Unscheduled posts - drag source */}
          {posts.filter(p => !p.scheduled_at && !p.published_at).length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base">Posts Não Agendados</CardTitle>
                <CardDescription>Arraste para um dia no calendário para agendar.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {posts.filter(p => !p.scheduled_at && !p.published_at).map(p => {
                    const PIcon = platformIcons[p.platform] || Send;
                    const creative = creatives.find(c => c.id === p.creative_id);
                    return (
                      <div
                        key={p.id}
                        draggable
                        onDragStart={() => handleDragStart(p.id)}
                        className="flex items-center gap-2 px-3 py-2 rounded-lg border bg-muted/30 cursor-grab active:cursor-grabbing hover:bg-muted/60 transition-colors"
                      >
                        <PIcon className="h-4 w-4 text-primary shrink-0" />
                        <span className="text-sm truncate max-w-[200px]">{creative?.title || platformLabels[p.platform]}</span>
                        <GripVertical className="h-3 w-3 text-muted-foreground" />
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
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
              <CardDescription>Gere anúncios automaticamente com um clique.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {[
                { icon: Package, title: "Novo produto sem anúncio", desc: "Cria anúncio automático para produtos sem criativo.", filter: (p: Product) => !creatives.some(c => c.product_id === p.id) },
                { icon: TrendingUp, title: "Produtos com preço promocional", desc: "Anúncio focado em desconto.", filter: (p: Product) => p.original_price !== null && p.original_price !== undefined && p.original_price > p.price },
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
