import React, { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronUp, Video, BookOpen, FileText, Package, FileUp, Download, Users, Wrench,
  Megaphone, Globe, Truck, Boxes, Mail, Gift, TrendingUp, DollarSign, Tag, Paintbrush, BarChart3, Store,
} from "lucide-react";
import { syncPaymentStatus } from "@/lib/paymentSync";

// Extracted tab components
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminOverviewTab from "@/components/admin/AdminOverviewTab";
import AdminProductsTab from "@/components/admin/AdminProductsTab";
import AdminOrdersTab from "@/components/admin/AdminOrdersTab";
import AdminClientsTab from "@/components/admin/AdminClientsTab";
import AdminTestimonialsTab from "@/components/admin/AdminTestimonialsTab";

// Already-extracted components
import MarketingCenter from "@/components/MarketingCenter";
import SellerManagement from "@/components/SellerManagement";
import QuoteManagement from "@/components/QuoteManagement";
import UserRoleManagement from "@/components/UserRoleManagement";
import MechanicManagement from "@/components/MechanicManagement";
import StockManagement from "@/components/StockManagement";
import EmailSubscriberManagement from "@/components/EmailSubscriberManagement";
import RewardsManagement from "@/components/RewardsManagement";
import ArticleManagement from "@/components/ArticleManagement";
import SEOBatchGenerator from "@/components/SEOBatchGenerator";
import ShippingManagement from "@/components/ShippingManagement";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import AppearanceSettings from "@/components/AppearanceSettings";
import PriceResearch from "@/components/PriceResearch";
import CatalogManagement from "@/components/CatalogManagement";
import MechanicVideoManagement from "@/components/MechanicVideoManagement";
import ExplodedViewManagement from "@/components/ExplodedViewManagement";
import AdminReports from "@/components/AdminReports";
import ResellerContentManagement from "@/components/ResellerContentManagement";
import ProductResellerManager from "@/components/admin/ProductResellerManager";
import CompatibilityManager from "@/components/admin/CompatibilityManager";
import SiteFeatureReport from "@/components/SiteFeatureReport";
import CategoryTreeAdmin from "@/components/CategoryTreeAdmin";

import type {
  AdminTab, Product, OrderWithItems, Category, Subcategory,
  ProfileFull, Testimonial, PaymentInfo, ProductCategoryLink, ResellerOption,
} from "@/types/admin";

const AdminDashboard = () => {
  const { toast } = useToast();
  const [tab, setTab] = useState<AdminTab>("dashboard");

  // Shared data
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [clients, setClients] = useState<ProfileFull[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [productCategoryLinks, setProductCategoryLinks] = useState<ProductCategoryLink[]>([]);
  const [clientRoles, setClientRoles] = useState<{ user_id: string; role: string }[]>([]);
  const [clientMechanics, setClientMechanics] = useState<{ user_id: string; partner_type: string }[]>([]);
  const [resellers, setResellers] = useState<ResellerOption[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, totalClients: 0 });

  useEffect(() => { loadAll(); }, []);

  // Realtime subscriptions
  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload) => {
        const newRow = payload.new as any;
        const oldRow = payload.old as any;
        if (payload.eventType === 'UPDATE') {
          setOrders(prev => {
            const updated = prev.map(o => o.id === newRow.id ? { ...o, ...newRow } : o);
            setStats(s => ({
              ...s,
              pendingOrders: updated.filter(o => o.status === "pending").length,
              revenue: updated.filter(o => o.status !== "cancelled").reduce((sum, o) => sum + Number(o.total_amount), 0),
            }));
            return updated;
          });
          if (newRow.status === 'confirmed' && oldRow?.status !== 'confirmed') {
            toast({ title: "💰 Pedido confirmado!", description: `Pedido #${newRow.id.substring(0, 8)} foi pago e confirmado.` });
            void loadAll();
          }
        } else if (payload.eventType === 'INSERT') {
          void loadAll();
          toast({ title: "🛒 Novo pedido!", description: `Novo pedido #${newRow.id.substring(0, 8)} recebido.` });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newRow = payload.new as any;
          if (newRow.status === 'approved') {
            toast({ title: "✅ Pagamento aprovado!", description: `Pagamento confirmado via ${newRow.payment_method || 'Mercado Pago'}.` });
            void loadAll();
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  // Auto-sync pending orders
  useEffect(() => {
    const pendingOrderIds = orders.filter(o => o.status === "pending").map(o => o.id);
    if (pendingOrderIds.length === 0) return;
    const interval = window.setInterval(async () => {
      try {
        await Promise.all(pendingOrderIds.map(id => syncPaymentStatus(id)));
        await loadAll();
      } catch (error) { console.error("Admin payment sync error:", error); }
    }, 5000);
    return () => window.clearInterval(interval);
  }, [orders]);

  const loadAll = async () => {
    const [prodRes, ordRes, catRes, clientRes, subRes, testRes, payRes, pcLinksRes, rolesRes, mechRes, resellerRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subcategories").select("*").order("name"),
      supabase.from("testimonials").select("*").order("created_at", { ascending: false }),
      supabase.from("payments").select("*").order("created_at", { ascending: false }),
      supabase.from("product_categories").select("product_id, category_id, subcategory_id"),
      supabase.from("user_roles").select("user_id, role"),
      supabase.from("mechanics").select("user_id, partner_type"),
      supabase.from("mechanics").select("id, company_name, user_id").eq("partner_type", "revendedor").eq("is_approved", true),
    ]);
    const prods = (prodRes.data || []) as Product[];
    const payments = (payRes.data || []) as PaymentInfo[];
    const ords = ((ordRes.data || []) as OrderWithItems[]).map(o => ({
      ...o,
      payment: payments.find(p => p.order_id === o.id) || null,
    }));
    const cats = (catRes.data || []) as Category[];
    const cls = (clientRes.data || []) as ProfileFull[];
    const subs = (subRes.data || []) as Subcategory[];
    const tests = (testRes.data || []) as Testimonial[];
    setProducts(prods); setOrders(ords); setCategories(cats); setClients(cls);
    setSubcategories(subs); setTestimonials(tests);
    setProductCategoryLinks((pcLinksRes.data || []) as ProductCategoryLink[]);
    setClientRoles((rolesRes.data || []) as { user_id: string; role: string }[]);
    setClientMechanics((mechRes.data || []) as { user_id: string; partner_type: string }[]);
    setResellers((resellerRes.data || []) as ResellerOption[]);
    setStats({
      totalProducts: prods.length, totalOrders: ords.length,
      revenue: ords.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
      pendingOrders: ords.filter(o => o.status === "pending").length,
      totalClients: cls.length,
    });
  };

  return (
    <div className="min-h-screen flex bg-muted/50">
      <AdminSidebar tab={tab} setTab={setTab} pendingOrders={stats.pendingOrders} />

      <main className="flex-1 p-8 overflow-auto">
        {tab === "dashboard" && (
          <AdminOverviewTab products={products} orders={orders} categories={categories} testimonials={testimonials} stats={stats} setTab={setTab} />
        )}

        {tab === "products" && (
          <AdminProductsTab products={products} categories={categories} subcategories={subcategories} resellers={resellers} clients={clients} productCategoryLinks={productCategoryLinks} onReload={loadAll} />
        )}

        {tab === "orders" && <AdminOrdersTab orders={orders} onReload={loadAll} />}

        {tab === "categories" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Tag className="h-8 w-8 text-primary" /> Gestão de Categorias</h1>
              <p className="text-muted-foreground mt-1">Sistema hierárquico unificado com níveis ilimitados de subcategorias</p>
            </div>
            <CategoryTreeAdmin />
          </div>
        )}

        {tab === "clients" && (
          <AdminClientsTab clients={clients} orders={orders} clientRoles={clientRoles} clientMechanics={clientMechanics} onReload={loadAll} />
        )}

        {tab === "testimonials" && <AdminTestimonialsTab testimonials={testimonials} onReload={loadAll} />}

        {tab === "reports" && <AdminReports />}
        {tab === "sellers" && <SellerManagement />}

        {tab === "quotes" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><FileUp className="h-7 w-7 text-primary" /> Orçamentos</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie solicitações de orçamento dos clientes</p>
              </div>
            </div>
            <QuoteManagement />
          </div>
        )}

        {/* MECHANICS HUB TAB */}
        {tab === "mechanics" && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 shadow-lg"><Wrench className="h-10 w-10 text-primary-foreground" /></div>
                <div>
                  <h1 className="font-heading text-3xl font-black text-foreground">Área do Revendedor e Mecânico</h1>
                  <p className="text-muted-foreground mt-0.5">Gerencie revendedores, mecânicos, vídeos, artigos, catálogos e orçamentos</p>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 mb-8">
              {[
                { key: "mechanic-list" as const, label: "Mecânicos Cadastrados", desc: "Aprove, edite e gerencie mecânicos parceiros", icon: Users, gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                { key: "mechanic-videos" as const, label: "Vídeos Técnicos", desc: "Gerencie vídeos de instalação e manutenção", icon: Video, gradient: "from-secondary/15 to-secondary/5", iconBg: "bg-secondary/20", iconColor: "text-secondary", border: "border-secondary/25" },
                { key: "articles" as const, label: "Central Técnica", desc: "Artigos, guias de manutenção e conteúdo técnico", icon: BookOpen, gradient: "from-accent/20 to-accent/10", iconBg: "bg-accent/30", iconColor: "text-accent-foreground", border: "border-accent/30" },
                { key: "catalogs" as const, label: "Catálogos Técnicos", desc: "Catálogos PDF disponíveis para download", icon: FileText, gradient: "from-primary/15 to-primary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                { key: "exploded-views" as const, label: "Vistas Explodidas", desc: "Gerencie diagramas de vistas explodidas dos motores", icon: Package, gradient: "from-accent/20 to-accent/10", iconBg: "bg-accent/30", iconColor: "text-accent-foreground", border: "border-accent/30" },
                { key: "quotes" as const, label: "Orçamentos", desc: "Solicitações de orçamento dos clientes", icon: FileUp, gradient: "from-secondary/15 to-secondary/5", iconBg: "bg-secondary/20", iconColor: "text-secondary", border: "border-secondary/25" },
                { key: "reseller-content" as const, label: "Conteúdo Revendedor", desc: "PDFs, tabelas de preço e materiais para revendedores", icon: Download, gradient: "from-primary/15 to-secondary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
              ].map((card) => (
                <button key={card.key} onClick={() => setTab(card.key === "mechanic-list" ? "mechanics" : card.key as AdminTab)} className={`group relative text-left rounded-2xl border-2 ${card.border} bg-gradient-to-br ${card.gradient} p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden`}>
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-background/5 to-transparent -translate-y-8 translate-x-8" />
                  <div className={`inline-flex items-center justify-center rounded-xl ${card.iconBg} p-3 mb-4 shadow-sm group-hover:shadow-md transition-shadow`}><card.icon className={`h-7 w-7 ${card.iconColor}`} /></div>
                  <h3 className="font-heading font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{card.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  <div className="mt-4 inline-flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">Acessar →</div>
                </button>
              ))}
            </div>
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Gestão de Mecânicos</h2>
              <MechanicManagement />
            </div>
          </div>
        )}

        {(tab as string) === "mechanic-videos" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><Video className="h-7 w-7 text-primary" /> Vídeos Técnicos</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie vídeos de instalação e manutenção para mecânicos</p>
              </div>
            </div>
            <MechanicVideoManagement />
          </div>
        )}

        {tab === "roles" && <UserRoleManagement />}

        {tab === "marketing" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Megaphone className="h-8 w-8 text-primary" /> Central de Marketing</h1>
              <p className="text-muted-foreground mt-1">Crie campanhas e anúncios automaticamente com IA</p>
            </div>
            <MarketingCenter />
          </div>
        )}

        {tab === "stock" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Boxes className="h-8 w-8 text-primary" /> Gestão de Estoque & Mercado Livre</h1>
              <p className="text-muted-foreground mt-1">Controle unificado de estoque, sincronização com Mercado Livre e alertas de reposição</p>
            </div>
            <StockManagement />
          </div>
        )}

        {tab === "product-resellers" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Store className="h-8 w-8 text-primary" /> Produto × Revendedor</h1>
              <p className="text-muted-foreground mt-1">Vincule produtos a revendedores com estoque individual e preço personalizado</p>
            </div>
            <ProductResellerManager />
          </div>
        )}

        {tab === "subscribers" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Mail className="h-8 w-8 text-primary" /> Leads & Cupons de Desconto</h1>
              <p className="text-muted-foreground mt-1">Gerencie emails capturados, cupons e métricas de conversão do pop-up de desconto</p>
            </div>
            <EmailSubscriberManagement />
          </div>
        )}

        {tab === "rewards" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Gift className="h-8 w-8 text-primary" /> Programa de Fidelidade</h1>
              <p className="text-muted-foreground mt-1">Gerencie recompensas, aprove resgates e credite pontos manualmente</p>
            </div>
            <RewardsManagement />
          </div>
        )}

        {tab === "articles" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><BookOpen className="h-7 w-7 text-primary" /> Central Técnica</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie artigos técnicos, guias de manutenção e conteúdo educacional</p>
              </div>
            </div>
            <ArticleManagement />
          </div>
        )}

        {tab === "seo" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Globe className="h-8 w-8 text-primary" /> Otimização SEO</h1>
              <p className="text-muted-foreground mt-1">Ferramentas para otimizar a presença nos motores de busca</p>
            </div>
            <SEOBatchGenerator />
          </div>
        )}

        {tab === "shipping" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Truck className="h-8 w-8 text-primary" /> Gestão de Frete</h1>
              <p className="text-muted-foreground mt-1">Configure valores de PAC e SEDEX por região</p>
            </div>
            <ShippingManagement />
          </div>
        )}

        {tab === "analytics" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" /> Analytics</h1>
              <p className="text-muted-foreground mt-1">Métricas de vendas, produtos mais vendidos e desempenho</p>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {tab === "price-research" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-heading font-bold">Pesquisa de Preços da Concorrência</h1>
              <p className="text-muted-foreground mt-1">Busca real em Mercado Livre, Shopee e lojas via Firecrawl + análise por IA</p>
            </div>
            <PriceResearch />
          </div>
        )}

        {tab === "catalogs" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><FileText className="h-7 w-7 text-primary" /> Catálogos Técnicos</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie os catálogos PDF disponíveis para mecânicos cadastrados</p>
              </div>
            </div>
            <CatalogManagement />
          </div>
        )}

        {(tab as string) === "exploded-views" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><Package className="h-7 w-7 text-primary" /> Vistas Explodidas</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie os diagramas de vistas explodidas dos motores</p>
              </div>
            </div>
            <ExplodedViewManagement />
          </div>
        )}

        {(tab as string) === "reseller-content" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><Store className="h-7 w-7 text-primary" /> Conteúdo para Revendedores</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie PDFs, tabelas de preço e materiais exclusivos para revendedores</p>
              </div>
            </div>
            <ResellerContentManagement />
          </div>
        )}

        {tab === "appearance" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Paintbrush className="h-8 w-8 text-primary" /> Aparência e Personalização</h1>
              <p className="text-muted-foreground mt-1">Configure cores, banners e pop-ups do site</p>
            </div>
            <AppearanceSettings />
          </div>
        )}

        {tab === "site-report" && <SiteFeatureReport />}
      </main>
    </div>
  );
};

export default AdminDashboard;
