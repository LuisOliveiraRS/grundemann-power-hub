import React, { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import {
  ChevronUp, Video, BookOpen, FileText, Package, FileUp, Download, Users, Wrench,
  Megaphone, Globe, Truck, Boxes, Mail, Gift, TrendingUp, DollarSign, Tag, Paintbrush, BarChart3, Store, Cpu,
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
import ResellerFileApproval from "@/components/admin/ResellerFileApproval";
import ProductResellerManager from "@/components/admin/ProductResellerManager";
import CompatibilityManager from "@/components/admin/CompatibilityManager";
import DiagnosticManagement from "@/components/admin/DiagnosticManagement";
import SiteFeatureReport from "@/components/SiteFeatureReport";
import IntelligentAnalytics from "@/components/admin/IntelligentAnalytics";
import CategoryTreeAdmin from "@/components/CategoryTreeAdmin";
import SubcategoryTreeManagement from "@/components/SubcategoryTreeManagement";

import type {
  AdminTab, Product, OrderWithItems, Category, Subcategory,
  ProfileFull, Testimonial, PaymentInfo, ProductCategoryLink, ResellerOption,
} from "@/types/admin";

// Which data sets each tab needs
const TAB_DATA_DEPS: Record<string, string[]> = {
  dashboard: ["products", "orders", "categories", "testimonials", "stats"],
  products: ["products", "categories", "subcategories", "resellers", "clients", "productCategoryLinks"],
  orders: ["orders"],
  clients: ["clients", "orders", "clientRoles", "clientMechanics"],
  testimonials: ["testimonials"],
};

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

  // Track which datasets have been loaded to avoid redundant fetches
  const loadedSets = useRef<Set<string>>(new Set());

  // Individual data loaders
  const loaders: Record<string, () => Promise<void>> = {
    products: async () => {
      const { data } = await supabase.from("products").select("*").order("created_at", { ascending: false }).limit(5000);
      const prods = (data || []) as Product[];
      setProducts(prods);
      return;
    },
    orders: async () => {
      const [ordRes, payRes] = await Promise.all([
        supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5000),
        supabase.from("payments").select("*").order("created_at", { ascending: false }).limit(5000),
      ]);
      const payments = (payRes.data || []) as PaymentInfo[];
      const ords = ((ordRes.data || []) as OrderWithItems[]).map(o => ({
        ...o,
        payment: payments.find(p => p.order_id === o.id) || null,
      }));
      setOrders(ords);
    },
    categories: async () => {
      const { data } = await supabase.from("categories").select("*").order("name").limit(500);
      setCategories((data || []) as Category[]);
    },
    subcategories: async () => {
      const { data } = await supabase.from("subcategories").select("*").order("name").limit(500);
      setSubcategories((data || []) as Subcategory[]);
    },
    clients: async () => {
      const { data } = await supabase.from("profiles").select("*").order("created_at", { ascending: false }).limit(5000);
      setClients((data || []) as ProfileFull[]);
    },
    testimonials: async () => {
      const { data } = await supabase.from("testimonials").select("*").order("created_at", { ascending: false }).limit(1000);
      setTestimonials((data || []) as Testimonial[]);
    },
    productCategoryLinks: async () => {
      const { data } = await supabase.from("product_categories").select("product_id, category_id, subcategory_id").limit(10000);
      setProductCategoryLinks((data || []) as ProductCategoryLink[]);
    },
    clientRoles: async () => {
      const { data } = await supabase.from("user_roles").select("user_id, role").limit(5000);
      setClientRoles((data || []) as { user_id: string; role: string }[]);
    },
    clientMechanics: async () => {
      const { data } = await supabase.from("mechanics").select("user_id, partner_type").limit(1000);
      setClientMechanics((data || []) as { user_id: string; partner_type: string }[]);
    },
    resellers: async () => {
      const { data } = await supabase.from("mechanics").select("id, company_name, user_id").eq("partner_type", "fornecedor").eq("is_approved", true).limit(500);
      setResellers((data || []) as ResellerOption[]);
    },
  };

  // Load only the datasets required by the current tab (if not already loaded)
  const loadForTab = useCallback(async (activeTab: string, force = false) => {
    const deps = TAB_DATA_DEPS[activeTab];
    if (!deps) return; // Self-contained tabs don't need shared data

    const toLoad = force
      ? deps.filter(d => d !== "stats")
      : deps.filter(d => d !== "stats" && !loadedSets.current.has(d));

    if (toLoad.length === 0 && !force) {
      // Stats always need recalculation when dashboard is shown
      if (activeTab === "dashboard") recalcStats();
      return;
    }

    await Promise.all(toLoad.map(key => {
      if (loaders[key]) {
        loadedSets.current.add(key);
        return loaders[key]();
      }
      return Promise.resolve();
    }));

    // Recalc stats after data loads
    if (deps.includes("stats")) {
      // Small delay to let state settle — use a ref-based approach for real values
      setTimeout(() => recalcStats(), 50);
    }
  }, []);

  const recalcStats = () => {
    setStats(prev => {
      // We need to access latest state — this runs after setState batching
      return prev;
    });
    // Use functional updaters to access latest state
    setProducts(prods => {
      setOrders(ords => {
        setClients(cls => {
          setStats({
            totalProducts: prods.length,
            totalOrders: ords.length,
            revenue: ords.filter(o => o.status !== "cancelled").reduce((s, o) => s + Number(o.total_amount), 0),
            pendingOrders: ords.filter(o => o.status === "pending").length,
            totalClients: cls.length,
          });
          return cls;
        });
        return ords;
      });
      return prods;
    });
  };

  // Reload all data for current tab (used by child components via onReload)
  const reloadCurrentTab = useCallback(async () => {
    await loadForTab(tab, true);
  }, [tab, loadForTab]);

  // Load data when tab changes
  useEffect(() => {
    loadForTab(tab);
  }, [tab, loadForTab]);

  // Realtime subscriptions — only update relevant state, no full reload
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
            // Only reload orders, not everything
            loadedSets.current.delete("orders");
            loadForTab(tab);
          }
        } else if (payload.eventType === 'INSERT') {
          loadedSets.current.delete("orders");
          loadForTab(tab);
          toast({ title: "🛒 Novo pedido!", description: `Novo pedido #${newRow.id.substring(0, 8)} recebido.` });
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' }, (payload) => {
        if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
          const newRow = payload.new as any;
          if (newRow.status === 'approved') {
            toast({ title: "✅ Pagamento aprovado!", description: `Pagamento confirmado via ${newRow.payment_method || 'Mercado Pago'}.` });
            loadedSets.current.delete("orders");
            loadForTab(tab);
          }
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast, tab, loadForTab]);

  // Auto-sync pending orders — throttled
  useEffect(() => {
    const pendingOrderIds = orders.filter(o => o.status === "pending").map(o => o.id);
    if (pendingOrderIds.length === 0) return;
    let syncIndex = 0;
    const BATCH_SIZE = 3;
    const interval = window.setInterval(async () => {
      try {
        const batch = pendingOrderIds.slice(syncIndex, syncIndex + BATCH_SIZE);
        if (batch.length === 0) { syncIndex = 0; return; }
        await Promise.all(batch.map(id => syncPaymentStatus(id)));
        syncIndex += BATCH_SIZE;
        if (syncIndex >= pendingOrderIds.length) syncIndex = 0;
        // Only invalidate orders
        loadedSets.current.delete("orders");
        loadForTab(tab);
      } catch (error) { console.error("Admin payment sync error:", error); }
    }, 15000);
    return () => window.clearInterval(interval);
  }, [orders, tab, loadForTab]);

  return (
    <div className="min-h-screen flex bg-muted/50">
      <AdminSidebar tab={tab} setTab={setTab} pendingOrders={stats.pendingOrders} />

      <main className="flex-1 p-8 overflow-auto">
        {tab === "dashboard" && (
          <AdminOverviewTab products={products} orders={orders} categories={categories} testimonials={testimonials} stats={stats} setTab={setTab} />
        )}

        {tab === "products" && (
          <AdminProductsTab products={products} categories={categories} subcategories={subcategories} resellers={resellers} clients={clients} productCategoryLinks={productCategoryLinks} onReload={reloadCurrentTab} />
        )}

        {tab === "orders" && <AdminOrdersTab orders={orders} onReload={reloadCurrentTab} />}

        {tab === "categories" && (
          <div className="space-y-10">
            <div>
              <div className="mb-6">
                <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Tag className="h-8 w-8 text-primary" /> Categorias do Menu do Site</h1>
                <p className="text-muted-foreground mt-1">Árvore hierárquica que define o menu de navegação superior. Os produtos são vinculados aqui para aparecerem no site.</p>
              </div>
              <CategoryTreeAdmin />
            </div>
            <div className="relative py-2">
              <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-border" /></div>
              <div className="relative flex justify-center"><span className="bg-background px-4 text-sm font-medium text-muted-foreground">Classificação Interna (Filtros & Relatórios)</span></div>
            </div>
            <div>
              <div className="mb-6">
                <h2 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><Boxes className="h-7 w-7 text-muted-foreground" /> Categorias de Classificação</h2>
                <p className="text-muted-foreground mt-1 text-sm">Categorias internas usadas para filtros, relatórios e agrupamentos de e-commerce. Independem do menu do site.</p>
              </div>
              <SubcategoryTreeManagement />
            </div>
          </div>
        )}

        {tab === "clients" && (
          <AdminClientsTab clients={clients} orders={orders} clientRoles={clientRoles} clientMechanics={clientMechanics} onReload={reloadCurrentTab} />
        )}

        {tab === "testimonials" && <AdminTestimonialsTab testimonials={testimonials} onReload={reloadCurrentTab} />}

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

        {tab === "mechanics" && (
          <div>
            <div className="mb-8">
              <div className="flex items-center gap-4 mb-2">
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 shadow-lg"><Wrench className="h-10 w-10 text-primary-foreground" /></div>
                <div>
                  <h1 className="font-heading text-3xl font-black text-foreground">Área do Fornecedor e Mecânico</h1>
                  <p className="text-muted-foreground mt-0.5">Gerencie fornecedores, mecânicos, vídeos, artigos, catálogos e orçamentos</p>
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
                { key: "reseller-content" as const, label: "Conteúdo Fornecedor", desc: "PDFs, tabelas de preço e materiais para fornecedores", icon: Download, gradient: "from-primary/15 to-secondary/5", iconBg: "bg-primary/20", iconColor: "text-primary", border: "border-primary/25" },
                { key: "reseller-files" as const, label: "Arquivos de Fornecedores", desc: "Aprovar, rejeitar e publicar arquivos enviados pelos fornecedores", icon: FileUp, gradient: "from-accent/15 to-primary/5", iconBg: "bg-accent/20", iconColor: "text-accent-foreground", border: "border-accent/25" },
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
              <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> Gestão de Parceiros</h2>
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
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Store className="h-8 w-8 text-primary" /> Produto × Fornecedor</h1>
              <p className="text-muted-foreground mt-1">Vincule produtos a fornecedores com estoque individual e preço personalizado</p>
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

        {(tab as string) === "reseller-files" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5"><ChevronUp className="h-4 w-4 -rotate-90" /> Voltar</Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3"><FileUp className="h-7 w-7 text-primary" /> Arquivos de Revendedores</h1>
                <p className="text-muted-foreground text-sm mt-0.5">Aprove, rejeite e publique arquivos enviados pelos revendedores no menu Catálogos</p>
              </div>
            </div>
            <ResellerFileApproval />
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

        {tab === "compatibility" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Cpu className="h-8 w-8 text-primary" /> Compatibilidade de Peças</h1>
              <p className="text-muted-foreground mt-1">Cadastre modelos de geradores e vincule peças compatíveis</p>
            </div>
            <CompatibilityManager />
          </div>
        )}

        {tab === "diagnostics" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><Wrench className="h-8 w-8 text-primary" /> Diagnóstico & Kits de Manutenção</h1>
              <p className="text-muted-foreground mt-1">Gerencie problemas de diagnóstico, causas, tags de produtos e kits inteligentes</p>
            </div>
            <DiagnosticManagement />
          </div>
        )}

        {tab === "intelligence" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3"><TrendingUp className="h-8 w-8 text-primary" /> Painel Inteligente</h1>
              <p className="text-muted-foreground mt-1">Problemas mais pesquisados, modelos mais buscados, peças mais vendidas e insights da IA</p>
            </div>
            <IntelligentAnalytics />
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
