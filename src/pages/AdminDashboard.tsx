import React, { useEffect, useState, useRef, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, Plus, Trash2, Edit, Tag, Eye, EyeOff, Search, ChevronDown, ChevronUp, X, Upload, ImageIcon, TrendingUp, DollarSign, AlertTriangle, Clock, Filter, SlidersHorizontal, FolderTree, Printer, RefreshCw, Video, Star, MessageSquare, Truck, FileUp, Download, CheckSquare, Square, Wand2, Loader2, BarChart3, FileDown, Megaphone, Wrench, Mail, Gift, BookOpen, Globe, Paintbrush, FileText, Store
} from "lucide-react";
import WhatsAppIcon from "@/components/WhatsAppIcon";
import { BarChart3 as BarChart3Icon, Boxes } from "lucide-react";
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
import SiteFeatureReport from "@/components/SiteFeatureReport";
import CategoryTreeAdmin from "@/components/CategoryTreeAdmin";
import MenuCategoryPicker from "@/components/MenuCategoryPicker";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-grundemann.png";
import OrderPrintSheet from "@/components/OrderPrintSheet";
import { syncPaymentStatus } from "@/lib/paymentSync";
import { normalizeWhatsAppPhone } from "@/lib/whatsappUtils";

interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; is_featured: boolean; free_shipping?: boolean; category_id: string | null;
  subcategory_id?: string | null; image_url: string | null; created_at: string;
  additional_images?: string[] | null; video_url?: string | null;
  reseller_id?: string | null; fuel_type?: string | null; slug?: string | null;
}

interface ResellerOption {
  id: string;
  company_name: string;
  user_id: string;
}

interface PaymentInfo {
  id: string; order_id: string; status: string; payment_method: string | null;
  mp_payment_id: string | null; amount: number; paid_at: string | null;
}

interface QuoteRequest {
  id: string;
  user_id: string | null;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  status: string;
  total_estimated: number | null;
  message: string | null;
  admin_notes: string | null;
  created_at: string;
}

interface ProductCategoryLink {
  product_id: string;
  category_id: string;
  subcategory_id: string | null;
}

interface OrderWithItems {
  id: string; user_id: string; status: string; total_amount: number;
  created_at: string; shipping_address: string | null; notes: string | null;
  tracking_code?: string | null;
  items?: OrderItem[];
  profile?: ProfileFull | null;
  payment?: PaymentInfo | null;
}

interface Testimonial {
  id: string; customer_name: string; customer_city: string;
  rating: number; comment: string; is_approved: boolean; created_at: string;
}

interface OrderItem {
  id: string; product_name: string; quantity: number; price_at_purchase: number;
}

interface Category {
  id: string; name: string; slug: string; description: string | null; image_url: string | null; is_visible?: boolean;
}

interface Subcategory {
  id: string; name: string; slug: string; category_id: string; description: string | null;
}

interface ProfileFull {
  user_id: string; full_name: string; email: string; phone: string | null;
  city: string | null; state: string | null; address: string | null;
  address_number: string | null; address_complement: string | null;
  neighborhood: string | null; zip_code: string | null;
  cpf_cnpj: string | null; company_name: string | null; notes: string | null;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "categories" | "clients" | "testimonials" | "reports" | "sellers" | "quotes" | "roles" | "marketing" | "mechanics" | "mechanic-videos" | "articles" | "catalogs" | "exploded-views" | "stock" | "subscribers" | "rewards" | "seo" | "shipping" | "analytics" | "price-research" | "appearance" | "site-report" | "reseller-content">("dashboard");
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [testimonialForm, setTestimonialForm] = useState({ customer_name: "", customer_city: "", rating: "5", comment: "" });
  const [editingTestimonial, setEditingTestimonial] = useState<Partial<Testimonial> | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [clients, setClients] = useState<ProfileFull[]>([]);
  const [clientRoles, setClientRoles] = useState<{ user_id: string; role: string }[]>([]);
  const [clientMechanics, setClientMechanics] = useState<{ user_id: string; partner_type: string }[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, totalClients: 0 });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [printingOrder, setPrintingOrder] = useState<OrderWithItems | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [resellers, setResellers] = useState<ResellerOption[]>([]);

  // Product filters
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState("");

  // Order filters
  const [orderSearch, setOrderSearch] = useState("");
  const [orderStatusFilter, setOrderStatusFilter] = useState("");
  const [orderDateFrom, setOrderDateFrom] = useState("");
  const [orderDateTo, setOrderDateTo] = useState("");

  // Client filters & editing
  const [clientSearch, setClientSearch] = useState("");
  const [clientRoleFilter, setClientRoleFilter] = useState("");
  const [editingClient, setEditingClient] = useState<Partial<ProfileFull> | null>(null);
  const [expandedClientId, setExpandedClientId] = useState<string | null>(null);
  const [clientOrderItems, setClientOrderItems] = useState<Record<string, OrderItem[]>>({});
  const [clientForm, setClientForm] = useState({
    full_name: "", email: "", phone: "", cpf_cnpj: "", company_name: "",
    address: "", address_number: "", address_complement: "", neighborhood: "",
    city: "", state: "", zip_code: "", notes: ""
  });

  // Category management
  const [expandedCat, setExpandedCat] = useState<string | null>(null);
  const [editingSubcategory, setEditingSubcategory] = useState<Partial<Subcategory> | null>(null);
  const [subForm, setSubForm] = useState({ name: "", slug: "", description: "", category_id: "" });

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productCategoryLinks, setProductCategoryLinks] = useState<ProductCategoryLink[]>([]);
  const [productForm, setProductForm] = useState({
    name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "",
    category_id: "", subcategory_id: "", is_featured: false, is_active: true, free_shipping: false, image_url: "",
    additional_images: [] as string[], video_url: "", brand: "", hp: "", engine_model: "",
    specifications: "" as string, documents: [] as string[],
    weight_kg: "", width_cm: "", height_cm: "", length_cm: "",
    extra_category_ids: [] as string[], menu_category_id: "", reseller_id: "",
  });

  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", image_url: "" });

  // Bulk selection
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());

  // AI image generation for existing products
  const [generatingAIImages, setGeneratingAIImages] = useState(false);
  const [aiImageProgress, setAiImageProgress] = useState(0);
  const [aiImageTotal, setAiImageTotal] = useState(0);

  useEffect(() => { loadAll(); }, []);

  useEffect(() => {
    const channel = supabase
      .channel('admin-realtime-orders')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' },
        (payload) => {
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
        }
      )
      .on('postgres_changes', { event: '*', schema: 'public', table: 'payments' },
        (payload) => {
          if (payload.eventType === 'UPDATE' || payload.eventType === 'INSERT') {
            const newRow = payload.new as any;
            if (newRow.status === 'approved') {
              toast({ title: "✅ Pagamento aprovado!", description: `Pagamento do pedido confirmado via ${newRow.payment_method || 'Mercado Pago'}.` });
              void loadAll();
            }
          }
        }
      )
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [toast]);

  useEffect(() => {
    const pendingOrderIds = orders.filter(order => order.status === "pending").map(order => order.id);
    if (pendingOrderIds.length === 0) return;

    const interval = window.setInterval(async () => {
      try {
        await Promise.all(pendingOrderIds.map((orderId) => syncPaymentStatus(orderId)));
        await loadAll();
      } catch (error) {
        console.error("Admin payment sync error:", error);
      }
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
    setProducts(prods); setOrders(ords); setCategories(cats); setClients(cls); setSubcategories(subs); setTestimonials(tests); setProductCategoryLinks((pcLinksRes.data || []) as ProductCategoryLink[]);
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

  const loadOrderItems = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    const { data } = await supabase.from("order_items").select("*").eq("order_id", orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, items: (data || []) as OrderItem[] } : o));
    const order = orders.find(o => o.id === orderId);
    if (order) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", order.user_id).single();
      if (prof) setOrders(prev => prev.map(o => o.id === orderId ? { ...o, profile: prof as ProfileFull } : o));
    }
    setExpandedOrder(orderId);
  };

  const printOrder = async (order: OrderWithItems) => {
    let orderToPrint = { ...order };
    if (!orderToPrint.items) {
      const { data } = await supabase.from("order_items").select("*").eq("order_id", order.id);
      orderToPrint.items = (data || []) as OrderItem[];
    }
    if (!orderToPrint.profile) {
      const { data: prof } = await supabase.from("profiles").select("*").eq("user_id", order.user_id).single();
      if (prof) orderToPrint.profile = prof as ProfileFull;
    }
    setPrintingOrder(orderToPrint);
    setTimeout(() => {
      const printContent = printRef.current;
      if (!printContent) return;
      const win = window.open("", "_blank");
      if (!win) { toast({ title: "Erro", description: "Permita pop-ups para imprimir.", variant: "destructive" }); return; }
      win.document.write(`<!DOCTYPE html><html><head><title>Pedido #${order.id.slice(0, 8)}</title><style>@media print { body { margin: 0; } } body { margin: 0; padding: 0; }</style></head><body>${printContent.innerHTML}</body></html>`);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 500);
    }, 200);
  };

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setProductForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    toast({ title: "Imagem enviada!" });
    setUploading(false);
  };

  const saveProduct = async () => {
    const data: any = {
      name: productForm.name, description: productForm.description || null,
      sku: productForm.sku || null, price: parseFloat(productForm.price) || 0,
      original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      category_id: productForm.category_id || null,
      subcategory_id: productForm.subcategory_id || null,
      is_featured: productForm.is_featured, is_active: productForm.is_active,
      free_shipping: productForm.free_shipping,
      image_url: productForm.image_url || null,
      additional_images: productForm.additional_images.filter(Boolean),
      video_url: productForm.video_url || null,
      brand: productForm.brand || null,
      hp: productForm.hp || null,
      engine_model: productForm.engine_model || null,
      specifications: productForm.specifications ? (() => { try { return JSON.parse(productForm.specifications); } catch { return null; } })() : null,
      documents: productForm.documents.filter(Boolean),
      weight_kg: productForm.weight_kg ? parseFloat(productForm.weight_kg) : null,
      width_cm: productForm.width_cm ? parseFloat(productForm.width_cm) : null,
      height_cm: productForm.height_cm ? parseFloat(productForm.height_cm) : null,
      length_cm: productForm.length_cm ? parseFloat(productForm.length_cm) : null,
      menu_category_id: productForm.menu_category_id || null,
      reseller_id: productForm.reseller_id || null,
    };
    let productId = editingProduct?.id;
    if (productId) {
      const { error } = await supabase.from("products").update(data).eq("id", productId);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Produto atualizado!" });
    } else {
      const { data: newProd, error } = await supabase.from("products").insert(data).select("id").single();
      if (error || !newProd) { toast({ title: "Erro", description: error?.message, variant: "destructive" }); return; }
      productId = newProd.id;
      toast({ title: "Produto criado!" });
    }
    // Sync extra categories in product_categories table
    await supabase.from("product_categories").delete().eq("product_id", productId);
    const extraLinks = productForm.extra_category_ids.filter(Boolean).map(catId => ({
      product_id: productId!,
      category_id: catId,
    }));
    if (extraLinks.length > 0) {
      await supabase.from("product_categories").insert(extraLinks);
    }
    setEditingProduct(null); resetProductForm(); loadAll();
  };

  const resetProductForm = () => setProductForm({ name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "", category_id: "", subcategory_id: "", is_featured: false, is_active: true, free_shipping: false, image_url: "", additional_images: [], video_url: "", brand: "", hp: "", engine_model: "", specifications: "", documents: [], weight_kg: "", width_cm: "", height_cm: "", length_cm: "", extra_category_ids: [], menu_category_id: "", reseller_id: "" });

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produto excluído!" }); loadAll();
  };

  // Bulk delete products
  const bulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Excluir ${selectedProducts.size} produtos selecionados? Essa ação é irreversível.`)) return;
    const ids = Array.from(selectedProducts);
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${ids.length} produtos excluídos!` });
    setSelectedProducts(new Set());
    loadAll();
  };

  // Bulk delete orders
  const deleteOrder = async (id: string) => {
    if (!confirm("Excluir este pedido e todos os seus itens? Essa ação é irreversível.")) return;
    await supabase.from("order_status_history").delete().eq("order_id", id);
    await supabase.from("order_items").delete().eq("order_id", id);
    await supabase.from("orders").delete().eq("id", id);
    toast({ title: "Pedido excluído!" }); loadAll();
  };

  const bulkDeleteOrders = async () => {
    if (selectedOrders.size === 0) return;
    if (!confirm(`Excluir ${selectedOrders.size} pedidos selecionados e seus itens? Essa ação é irreversível.`)) return;
    const ids = Array.from(selectedOrders);
    for (const id of ids) {
      await supabase.from("order_status_history").delete().eq("order_id", id);
      await supabase.from("order_items").delete().eq("order_id", id);
      await supabase.from("orders").delete().eq("id", id);
    }
    toast({ title: `${ids.length} pedidos excluídos!` });
    setSelectedOrders(new Set());
    loadAll();
  };

  // AI image generation for existing products without images
  const generateAIImagesForProducts = async () => {
    const productsWithoutImage = products.filter(p => !p.image_url && p.is_active);
    if (productsWithoutImage.length === 0) {
      toast({ title: "Todos os produtos ativos já possuem imagem" });
      return;
    }
    if (!confirm(`Gerar imagens com IA para ${productsWithoutImage.length} produtos sem imagem? Isso pode levar alguns minutos.`)) return;
    
    setGeneratingAIImages(true);
    setAiImageTotal(productsWithoutImage.length);
    setAiImageProgress(0);
    let generated = 0;

    for (let i = 0; i < productsWithoutImage.length; i++) {
      const p = productsWithoutImage[i];
      try {
        const { data, error } = await supabase.functions.invoke("generate-product-image", {
          body: { productName: p.name, imageDescription: p.description, sku: p.sku },
        });
        if (!error && data?.imageUrl) {
          await supabase.from("products").update({ image_url: data.imageUrl }).eq("id", p.id);
          generated++;
        }
      } catch (err) {
        console.error("AI image error for", p.name, err);
      }
      setAiImageProgress(i + 1);
      await new Promise(r => setTimeout(r, 2000));
    }

    setGeneratingAIImages(false);
    toast({ title: `${generated} imagens geradas por IA!`, description: `De ${productsWithoutImage.length} produtos sem imagem.` });
    loadAll();
  };

  const editProduct = (p: Product) => {
    setEditingProduct(p);
    const linkedCatIds = productCategoryLinks.filter(l => l.product_id === p.id).map(l => l.category_id).filter(cid => cid !== p.category_id);
    setProductForm({
      name: p.name, description: p.description || "", sku: p.sku || "",
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      stock_quantity: String(p.stock_quantity), category_id: p.category_id || "",
      subcategory_id: (p as any).subcategory_id || "", is_featured: p.is_featured, free_shipping: (p as any).free_shipping || false,
      is_active: p.is_active, image_url: p.image_url || "",
      additional_images: (p.additional_images || []) as string[],
      video_url: (p.video_url || "") as string,
      brand: (p as any).brand || "", hp: (p as any).hp || "", engine_model: (p as any).engine_model || "",
      specifications: (p as any).specifications ? JSON.stringify((p as any).specifications, null, 2) : "",
      documents: ((p as any).documents || []) as string[],
      weight_kg: (p as any).weight_kg ? String((p as any).weight_kg) : "",
      width_cm: (p as any).width_cm ? String((p as any).width_cm) : "",
      height_cm: (p as any).height_cm ? String((p as any).height_cm) : "",
      length_cm: (p as any).length_cm ? String((p as any).length_cm) : "",
      extra_category_ids: linkedCatIds,
      menu_category_id: (p as any).menu_category_id || "",
      reseller_id: (p as any).reseller_id || "",
    });
    setTab("products");
  };

  const saveCategory = async () => {
    const data = { name: categoryForm.name, slug: categoryForm.slug || categoryForm.name.toLowerCase().replace(/\s+/g, '-'), description: categoryForm.description || null, image_url: categoryForm.image_url || null };
    if (editingCategory?.id) {
      const { error } = await supabase.from("categories").update(data).eq("id", editingCategory.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria atualizada!" });
    } else {
      const { error } = await supabase.from("categories").insert(data);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Categoria criada!" });
    }
    setEditingCategory(null); setCategoryForm({ name: "", slug: "", description: "", image_url: "" }); loadAll();
  };

  const deleteCategory = async (id: string) => {
    if (!confirm("Excluir esta categoria?")) return;
    await supabase.from("categories").delete().eq("id", id); loadAll();
  };

  const saveSubcategory = async () => {
    const data = {
      name: subForm.name,
      slug: subForm.slug || subForm.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: subForm.description || null,
      category_id: subForm.category_id,
    };
    if (!data.category_id) { toast({ title: "Selecione uma categoria pai", variant: "destructive" }); return; }
    if (editingSubcategory?.id) {
      const { error } = await supabase.from("subcategories").update(data).eq("id", editingSubcategory.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Subcategoria atualizada!" });
    } else {
      const { error } = await supabase.from("subcategories").insert(data);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Subcategoria criada!" });
    }
    setEditingSubcategory(null); setSubForm({ name: "", slug: "", description: "", category_id: "" }); loadAll();
  };

  const deleteSubcategory = async (id: string) => {
    if (!confirm("Excluir esta subcategoria?")) return;
    await supabase.from("subcategories").delete().eq("id", id);
    toast({ title: "Subcategoria excluída!" }); loadAll();
  };

  // Convert category to subcategory
  const convertCategoryToSubcategory = async (catId: string, parentCatId: string) => {
    const cat = categories.find(c => c.id === catId);
    if (!cat) return;
    // Create subcategory under parent
    const { error: subErr } = await supabase.from("subcategories").insert({
      name: cat.name, slug: cat.slug, description: cat.description || null, category_id: parentCatId,
    });
    if (subErr) { toast({ title: "Erro", description: subErr.message, variant: "destructive" }); return; }
    // Move products from old category to parent
    await supabase.from("products").update({ category_id: parentCatId } as any).eq("category_id", catId);
    // Delete old category
    await supabase.from("categories").delete().eq("id", catId);
    toast({ title: `"${cat.name}" convertida para subcategoria!` }); loadAll();
  };

  // Convert subcategory to category
  const convertSubcategoryToCategory = async (subId: string) => {
    const sub = subcategories.find(s => s.id === subId);
    if (!sub) return;
    // Create new category
    const { data: newCat, error: catErr } = await supabase.from("categories").insert({
      name: sub.name, slug: sub.slug, description: sub.description || null,
    }).select("id").single();
    if (catErr || !newCat) { toast({ title: "Erro", description: catErr?.message, variant: "destructive" }); return; }
    // Move products that had this subcategory to the new category
    await supabase.from("products").update({ category_id: newCat.id, subcategory_id: null } as any).eq("subcategory_id", subId);
    // Delete old subcategory
    await supabase.from("subcategories").delete().eq("id", subId);
    toast({ title: `"${sub.name}" promovida para categoria!` }); loadAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    await supabase.from("order_status_history").insert({ order_id: id, status: status as any });
    toast({ title: `Status atualizado para ${statusLabel[status]}` }); loadAll();
  };

  const updateTrackingCode = async (id: string, code: string) => {
    const order = orders.find(o => o.id === id);
    const updates: any = { tracking_code: code };
    // Auto-update status to shipped when tracking code is added
    if (code && order && !["shipped", "delivered"].includes(order.status)) {
      updates.status = "shipped";
    }
    await supabase.from("orders").update(updates).eq("id", id);

    // Add status history entry
    if (code && order && !["shipped", "delivered"].includes(order.status)) {
      await supabase.from("order_status_history").insert({
        order_id: id,
        status: "shipped" as any,
        notes: `Código de rastreio adicionado: ${code}`,
      });
    }

    // Send notification to customer
    if (code && order) {
      await supabase.from("notifications").insert({
        user_id: order.user_id,
        title: "Pedido enviado! 🚚",
        message: `Seu pedido #${id.substring(0, 8)} foi enviado! Rastreie: ${code}`,
        type: "order",
        link: "/minha-conta",
      });
    }

    toast({ title: "Código de rastreio atualizado!" });
    setOrders(prev => prev.map(o => o.id === id ? { ...o, tracking_code: code, ...(code && !["shipped", "delivered"].includes(o.status) ? { status: "shipped" } : {}) } : o));
  };

  // Testimonial CRUD
  const saveTestimonial = async () => {
    const data = {
      customer_name: testimonialForm.customer_name,
      customer_city: testimonialForm.customer_city,
      rating: parseInt(testimonialForm.rating) || 5,
      comment: testimonialForm.comment,
      is_approved: true,
    };
    if (editingTestimonial?.id) {
      await supabase.from("testimonials").update(data).eq("id", editingTestimonial.id);
      toast({ title: "Depoimento atualizado!" });
    } else {
      await supabase.from("testimonials").insert(data);
      toast({ title: "Depoimento criado!" });
    }
    setEditingTestimonial(null);
    setTestimonialForm({ customer_name: "", customer_city: "", rating: "5", comment: "" });
    loadAll();
  };

  const toggleTestimonialApproval = async (id: string, current: boolean) => {
    await supabase.from("testimonials").update({ is_approved: !current }).eq("id", id);
    toast({ title: !current ? "Depoimento aprovado!" : "Depoimento ocultado!" });
    loadAll();
  };

  const deleteTestimonial = async (id: string) => {
    if (!confirm("Excluir este depoimento?")) return;
    await supabase.from("testimonials").delete().eq("id", id);
    toast({ title: "Depoimento excluído!" }); loadAll();
  };

  // Client CRUD
  const resetClientForm = () => setClientForm({
    full_name: "", email: "", phone: "", cpf_cnpj: "", company_name: "",
    address: "", address_number: "", address_complement: "", neighborhood: "",
    city: "", state: "", zip_code: "", notes: ""
  });

  const editClient = (c: ProfileFull) => {
    setEditingClient(c);
    setClientForm({
      full_name: c.full_name || "", email: c.email || "", phone: c.phone || "",
      cpf_cnpj: c.cpf_cnpj || "", company_name: c.company_name || "",
      address: c.address || "", address_number: c.address_number || "",
      address_complement: c.address_complement || "", neighborhood: c.neighborhood || "",
      city: c.city || "", state: c.state || "", zip_code: c.zip_code || "",
      notes: c.notes || ""
    });
    setTab("clients");
  };

  const saveClient = async () => {
    const data: any = {
      full_name: clientForm.full_name, email: clientForm.email, phone: clientForm.phone || null,
      cpf_cnpj: clientForm.cpf_cnpj || null, company_name: clientForm.company_name || null,
      address: clientForm.address || null, address_number: clientForm.address_number || null,
      address_complement: clientForm.address_complement || null, neighborhood: clientForm.neighborhood || null,
      city: clientForm.city || null, state: clientForm.state || null,
      zip_code: clientForm.zip_code || null, notes: clientForm.notes || null,
    };
    if (editingClient?.user_id) {
      const { error } = await supabase.from("profiles").update(data).eq("user_id", editingClient.user_id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cliente atualizado!" });
    } else {
      const newData = { ...data, user_id: crypto.randomUUID() };
      const { error } = await supabase.from("profiles").insert(newData);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Cliente cadastrado!" });
    }
    setEditingClient(null); resetClientForm(); loadAll();
  };

  const deleteClient = async (userId: string) => {
    if (!confirm("Excluir este cliente? Essa ação é irreversível.")) return;
    await supabase.from("profiles").delete().eq("user_id", userId);
    toast({ title: "Cliente excluído!" }); loadAll();
  };

  const toggleClientExpand = async (userId: string) => {
    if (expandedClientId === userId) { setExpandedClientId(null); return; }
    setExpandedClientId(userId);
    // Load order items for this client's orders
    const clientOrdIds = orders.filter(o => o.user_id === userId).map(o => o.id);
    if (clientOrdIds.length > 0) {
      const { data } = await supabase.from("order_items").select("*").in("order_id", clientOrdIds);
      if (data) {
        const grouped: Record<string, OrderItem[]> = {};
        clientOrdIds.forEach(oid => { grouped[oid] = (data as OrderItem[]).filter(i => (i as any).order_id === oid); });
        setClientOrderItems(prev => ({ ...prev, ...grouped }));
      }
    }
  };

  const syncMercadoLivre = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Erro", description: "Sessão expirada", variant: "destructive" }); return; }
      const { data, error } = await supabase.functions.invoke('sync-mercadolivre', {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });
      if (error) throw error;
      if (data?.success) {
        toast({ title: "Sincronização concluída!", description: data.message });
        loadAll();
      } else {
        toast({ title: "Aviso", description: data?.message || "Nenhum produto encontrado", variant: "destructive" });
      }
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  // Export report as CSV
  const exportCSV = (data: Record<string, any>[], filename: string) => {
    if (data.length === 0) { toast({ title: "Nenhum dado para exportar" }); return; }
    const headers = Object.keys(data[0]);
    const csv = [headers.join(","), ...data.map(row => headers.map(h => {
      const val = row[h];
      const str = val == null ? "" : String(val);
      return str.includes(",") || str.includes('"') ? `"${str.replace(/"/g, '""')}"` : str;
    }).join(","))].join("\n");
    const blob = new Blob(["\uFEFF" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `${filename}.csv`; a.click();
    URL.revokeObjectURL(url);
    toast({ title: "Relatório exportado!" });
  };

  const exportProductsReport = () => {
    exportCSV(products.map(p => ({
      Nome: p.name, SKU: p.sku || "", Categoria: getCategoryName(p.category_id),
      Preço: p.price, "Preço Original": p.original_price || "", Estoque: p.stock_quantity,
      Ativo: p.is_active ? "Sim" : "Não", Destaque: p.is_featured ? "Sim" : "Não",
      "Com Imagem": p.image_url ? "Sim" : "Não", "Criado em": new Date(p.created_at).toLocaleDateString("pt-BR"),
    })), "relatorio-produtos");
  };

  const exportOrdersReport = () => {
    exportCSV(orders.map(o => ({
      ID: o.id.slice(0, 8), Status: statusLabel[o.status] || o.status,
      "Valor Total": Number(o.total_amount).toFixed(2), "Data": new Date(o.created_at).toLocaleDateString("pt-BR"),
      Rastreio: o.tracking_code || "",
    })), "relatorio-pedidos");
  };

  const exportClientsReport = () => {
    exportCSV(clients.map(c => ({
      Nome: c.full_name, Email: c.email, Telefone: c.phone || "",
      "CPF/CNPJ": c.cpf_cnpj || "", Empresa: c.company_name || "",
      Cidade: c.city || "", Estado: c.state || "",
    })), "relatorio-clientes");
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  const statusColor: Record<string, string> = {
    pending: "bg-accent/20 text-accent-foreground",
    confirmed: "bg-primary/20 text-primary",
    processing: "bg-secondary/10 text-secondary-foreground",
    shipped: "bg-primary text-primary-foreground",
    delivered: "bg-primary text-primary-foreground",
    cancelled: "bg-destructive/20 text-destructive",
  };

  const sideItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "products", label: "Produtos", icon: Package },
    { key: "orders", label: "Pedidos", icon: ShoppingCart },
    { key: "categories", label: "Categorias", icon: Tag },
    { key: "clients", label: "Clientes", icon: Users },
    { key: "testimonials", label: "Depoimentos", icon: MessageSquare },
    { key: "sellers", label: "Vendedores", icon: Users },
    { key: "roles", label: "Permissões", icon: Users },
    { key: "mechanics", label: "Área do Mecânico", icon: Wrench },
    { key: "marketing", label: "Marketing", icon: Megaphone },
    { key: "seo", label: "SEO", icon: Globe },
    { key: "shipping", label: "Frete", icon: Truck },
    { key: "stock", label: "Estoque & ML", icon: Boxes },
    { key: "subscribers", label: "Leads & Cupons", icon: Mail },
    { key: "rewards", label: "Fidelidade", icon: Gift },
    { key: "analytics", label: "Analytics", icon: TrendingUp },
    { key: "price-research", label: "Preços Concorrência", icon: DollarSign },
    { key: "reports", label: "Relatórios", icon: BarChart3 },
    { key: "site-report", label: "Relatório do Site", icon: FileText },
    { key: "appearance", label: "Aparência", icon: Paintbrush },
  ] as const;

  // Filtered data
  const filteredProducts = products.filter(p => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !(p.sku || "").toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCatFilter && p.category_id !== productCatFilter) return false;
    if (productStatusFilter === "active" && !p.is_active) return false;
    if (productStatusFilter === "inactive" && p.is_active) return false;
    if (productStatusFilter === "featured" && !p.is_featured) return false;
    if (productStatusFilter === "no-image" && p.image_url) return false;
    if (productStockFilter === "out" && p.stock_quantity > 0) return false;
    if (productStockFilter === "low" && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false;
    if (productStockFilter === "ok" && p.stock_quantity <= 5) return false;
    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (orderSearch && !o.id.toLowerCase().includes(orderSearch.toLowerCase())) return false;
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.created_at) > new Date(orderDateTo + "T23:59:59")) return false;
    return true;
  });

  const getUserRoleType = (userId: string): string => {
    const roles = clientRoles.filter(r => r.user_id === userId);
    if (roles.some(r => r.role === "admin")) return "admin";
    if (roles.some(r => r.role === "seller")) return "seller";
    const mech = clientMechanics.find(m => m.user_id === userId);
    if (mech) return mech.partner_type || "mecanico";
    return "cliente";
  };

  const roleTypeLabel: Record<string, string> = { admin: "Admin", seller: "Vendedor", revendedor: "Revendedor", oficina: "Oficina", mecanico: "Mecânico", cliente: "Cliente" };
  const roleTypeColor: Record<string, string> = { admin: "bg-destructive/20 text-destructive", seller: "bg-primary/20 text-primary", revendedor: "bg-accent/20 text-accent-foreground", oficina: "bg-secondary/20 text-secondary-foreground", mecanico: "bg-primary/15 text-primary", cliente: "bg-muted text-muted-foreground" };

  const filteredClients = clients.filter(c => {
    const roleType = getUserRoleType(c.user_id);
    if (clientRoleFilter && roleType !== clientRoleFilter) return false;
    if (!clientSearch) return true;
    const s = clientSearch.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || (c.phone || "").toLowerCase().includes(s) || (c.cpf_cnpj || "").toLowerCase().includes(s);
  });

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getSubcatName = (id: string | null) => subcategories.find(s => s.id === id)?.name || null;
  const getCatSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

  // Selection helpers
  const toggleProductSelect = (id: string) => {
    setSelectedProducts(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) {
      setSelectedProducts(new Set());
    } else {
      setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
    }
  };

  const toggleOrderSelect = (id: string) => {
    setSelectedOrders(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAllOrders = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  // Report computations
  const ordersByStatus = Object.entries(statusLabel).map(([key, label]) => ({
    status: label,
    count: orders.filter(o => o.status === key).length,
    total: orders.filter(o => o.status === key).reduce((s, o) => s + Number(o.total_amount), 0),
  }));

  const productsByCategory = categories.map(c => ({
    category: c.name,
    count: products.filter(p => p.category_id === c.id).length,
    active: products.filter(p => p.category_id === c.id && p.is_active).length,
  }));

  const productsWithoutImage = products.filter(p => !p.image_url).length;
  const productsOutOfStock = products.filter(p => p.stock_quantity === 0).length;
  const avgPrice = products.length > 0 ? products.reduce((s, p) => s + p.price, 0) / products.length : 0;

  return (
    <div className="min-h-screen flex bg-muted/50">
      {/* Hidden print area */}
      <div className="hidden">
        <div ref={printRef}>
          {printingOrder && (
            <OrderPrintSheet order={{
              id: printingOrder.id,
              created_at: printingOrder.created_at,
              profile: printingOrder.profile || null,
            }} />
          )}
        </div>
      </div>

      {/* Sidebar */}
      <aside className="w-64 bg-sidebar text-sidebar-foreground min-h-screen flex flex-col shadow-xl">
        <div className="p-5 border-b border-sidebar-border">
          <img src={logo} alt="Gründemann" className="h-12 w-auto brightness-200" />
          <p className="text-xs text-sidebar-foreground/50 mt-2">Painel Administrativo</p>
          <button onClick={() => navigate("/")} className="mt-3 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-semibold bg-sidebar-primary/20 text-sidebar-primary-foreground hover:bg-sidebar-primary/30 transition-colors">
            <Globe className="h-4 w-4" /> Ver Loja
          </button>
        </div>
        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {sideItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === item.key || (item.key === "mechanics" && ["mechanics", "mechanic-videos", "articles", "catalogs", "quotes", "exploded-views"].includes(tab))
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-md"
                  : "text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground"
              }`}
            >
              <item.icon className="h-5 w-5" />
              <span>{item.label}</span>
              {item.key === "orders" && stats.pendingOrders > 0 && (
                <Badge variant="destructive" className="ml-auto text-[10px] px-1.5 py-0 animate-pulse">{stats.pendingOrders}</Badge>
              )}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-sidebar-border space-y-1">
          <button onClick={signOut} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-destructive/80 hover:bg-destructive/10 hover:text-destructive transition-colors">
            <LogOut className="h-5 w-5" /> Sair
          </button>
        </div>
      </aside>

      <main className="flex-1 p-8 overflow-auto">
        {/* DASHBOARD TAB */}
        {tab === "dashboard" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground">Dashboard</h1>
              <p className="text-muted-foreground mt-1">Visão geral do seu negócio</p>
            </div>

            {/* Row 1: Main KPIs */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-6">
              {[
                { label: "Produtos", value: stats.totalProducts, icon: Package, color: "text-primary", bg: "bg-primary/10" },
                { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, color: "text-secondary", bg: "bg-secondary/10" },
                { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-primary", bg: "bg-primary/10" },
                { label: "Pendentes", value: stats.pendingOrders, icon: Clock, color: "text-accent-foreground", bg: "bg-accent/20" },
                { label: "Clientes", value: stats.totalClients, icon: Users, color: "text-secondary", bg: "bg-secondary/10" },
                { label: "Ticket Médio", value: stats.totalOrders > 0 ? `R$ ${(stats.revenue / stats.totalOrders).toFixed(2).replace(".", ",")}` : "R$ 0,00", icon: TrendingUp, color: "text-primary", bg: "bg-primary/10" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl shadow-sm border border-border p-4 hover:shadow-md transition-shadow">
                  <div className="flex items-center gap-2.5">
                    <div className={`rounded-lg ${s.bg} p-2.5 ${s.color}`}><s.icon className="h-5 w-5" /></div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{s.label}</p>
                      <p className="text-base font-heading font-bold mt-0.5">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 2: Secondary stats */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              {[
                { label: "Sem Imagem", value: productsWithoutImage, icon: ImageIcon, color: "text-destructive" },
                { label: "Sem Estoque", value: productsOutOfStock, icon: AlertTriangle, color: "text-destructive" },
                { label: "Preço Médio", value: `R$ ${avgPrice.toFixed(2).replace(".", ",")}`, icon: DollarSign, color: "text-secondary" },
                { label: "Categorias", value: categories.length, icon: Tag, color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="bg-card rounded-xl border border-border p-3.5 flex items-center gap-3">
                  <div className={`rounded-lg bg-muted p-2 ${s.color}`}><s.icon className="h-4 w-4" /></div>
                  <div>
                    <p className="text-[10px] text-muted-foreground uppercase">{s.label}</p>
                    <p className="text-sm font-heading font-bold">{s.value}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Row 3: Products by category */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4"><Tag className="h-5 w-5 text-primary" /> Produtos por Categoria</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {productsByCategory.map(pc => (
                  <div key={pc.category} className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold truncate">{pc.category}</p>
                    <p className="text-lg font-heading font-bold text-primary mt-1">{pc.count}</p>
                    <p className="text-[10px] text-muted-foreground">{pc.active} ativos</p>
                  </div>
                ))}
                {productsByCategory.length === 0 && <p className="col-span-full text-center text-muted-foreground text-sm py-4">Nenhuma categoria</p>}
              </div>
            </div>

            {/* Row 4: Orders by status summary */}
            <div className="bg-card rounded-xl shadow-sm border border-border p-5 mb-6">
              <h2 className="font-heading text-lg font-bold flex items-center gap-2 mb-4"><ShoppingCart className="h-5 w-5 text-primary" /> Pedidos por Status</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {ordersByStatus.map(os => (
                  <div key={os.status} className="bg-muted/50 rounded-lg p-3 text-center">
                    <p className="text-xs font-semibold">{os.status}</p>
                    <p className="text-lg font-heading font-bold mt-1">{os.count}</p>
                    <p className="text-[10px] text-muted-foreground">R$ {os.total.toFixed(2).replace(".", ",")}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Row 5: Recent orders + Low stock */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Últimos Pedidos</h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab("orders")}>Ver todos</Button>
                </div>
                <div className="divide-y divide-border">
                  {orders.slice(0, 7).map((o) => (
                    <div key={o.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right flex items-center gap-2">
                        {o.payment && (
                          <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-semibold ${o.payment.status === "approved" ? "bg-primary/20 text-primary" : o.payment.status === "rejected" ? "bg-destructive/20 text-destructive" : "bg-accent/20 text-accent-foreground"}`}>
                            {o.payment.status === "approved" ? "💳 Pago" : o.payment.status === "rejected" ? "❌ Recusado" : "⏳ Pgto"}
                          </span>
                        )}
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status]}</span>
                        <p className="font-bold text-sm text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                      </div>
                    </div>
                  ))}
                  {orders.length === 0 && <p className="p-5 text-center text-muted-foreground text-sm">Nenhum pedido ainda.</p>}
                </div>
              </div>
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-5 border-b border-border">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2"><AlertTriangle className="h-5 w-5 text-destructive" /> Estoque Baixo (≤ 5)</h2>
                </div>
                <div className="divide-y divide-border">
                  {products.filter(p => p.stock_quantity <= 5 && p.is_active).slice(0, 7).map(p => (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                        <div>
                          <p className="font-medium text-sm">{p.name}</p>
                          <p className="text-xs text-muted-foreground">SKU: {p.sku || "—"}</p>
                        </div>
                      </div>
                      <Badge variant={p.stock_quantity === 0 ? "destructive" : "secondary"}>{p.stock_quantity} un.</Badge>
                    </div>
                  ))}
                  {products.filter(p => p.stock_quantity <= 5 && p.is_active).length === 0 && (
                    <p className="p-5 text-center text-muted-foreground text-sm">Todos os produtos com estoque adequado. ✅</p>
                  )}
                </div>
              </div>
            </div>

            {/* Row 6: Top products + Recent testimonials */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-5 border-b border-border">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2"><Star className="h-5 w-5 text-primary" /> Produtos Destaque</h2>
                </div>
                <div className="divide-y divide-border">
                  {products.filter(p => p.is_featured && p.is_active).slice(0, 5).map(p => (
                    <div key={p.id} className="px-5 py-3 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div className="flex items-center gap-3">
                        {p.image_url ? <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover" /> : <div className="h-8 w-8 rounded bg-muted flex items-center justify-center"><Package className="h-4 w-4 text-muted-foreground" /></div>}
                        <p className="font-medium text-sm">{p.name}</p>
                      </div>
                      <p className="font-bold text-sm text-price">R$ {p.price.toFixed(2).replace(".", ",")}</p>
                    </div>
                  ))}
                  {products.filter(p => p.is_featured).length === 0 && <p className="p-5 text-center text-muted-foreground text-sm">Nenhum produto em destaque.</p>}
                </div>
              </div>
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /> Depoimentos Recentes</h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab("testimonials")}>Ver todos</Button>
                </div>
                <div className="divide-y divide-border">
                  {testimonials.slice(0, 5).map(t => (
                    <div key={t.id} className="px-5 py-3 hover:bg-muted/30 transition-colors">
                      <div className="flex items-center justify-between">
                        <p className="font-medium text-sm">{t.customer_name}</p>
                        <div className="flex items-center gap-1">
                          {Array.from({ length: t.rating }).map((_, i) => <Star key={i} className="h-3 w-3 fill-primary text-primary" />)}
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">{t.comment}</p>
                    </div>
                  ))}
                  {testimonials.length === 0 && <p className="p-5 text-center text-muted-foreground text-sm">Nenhum depoimento.</p>}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* PRODUCTS TAB */}
        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-3xl font-bold">Produtos</h1>
                <p className="text-muted-foreground text-sm mt-1">{filteredProducts.length} de {products.length} produtos</p>
              </div>
              <div className="flex gap-3 flex-wrap">
                <Button onClick={() => navigate("/admin/importar")} variant="outline" className="shadow-md border-secondary text-secondary hover:bg-secondary/10">
                  <FileUp className="h-4 w-4 mr-2" /> Importar Produtos
                </Button>
                <Button onClick={() => navigate("/admin/exportar-ml")} variant="outline" className="shadow-md border-primary text-primary hover:bg-primary/10">
                  <Download className="h-4 w-4 mr-2" /> Exportar p/ ML
                </Button>
                <Button onClick={syncMercadoLivre} variant="outline" disabled={syncing} className="shadow-md border-accent text-accent-foreground hover:bg-accent/10">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? "Sincronizando..." : "Sincronizar ML"}
                </Button>
                <Button onClick={() => { setEditingProduct({}); resetProductForm(); }} className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" /> Novo Produto
                </Button>
              </div>
            </div>

            {editingProduct !== null && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading text-xl font-bold">{editingProduct.id ? "Editar" : "Novo"} Produto</h3>
                  <button onClick={() => setEditingProduct(null)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:row-span-2">
                    <Label className="mb-2 block">Imagem do Produto</Label>
                    <div
                      className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[200px] flex flex-col items-center justify-center"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      {productForm.image_url ? (
                        <div className="relative w-full">
                          <img src={productForm.image_url} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                          <button onClick={(e) => { e.stopPropagation(); setProductForm(prev => ({ ...prev, image_url: "" })); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-80"><X className="h-3 w-3" /></button>
                        </div>
                      ) : (
                        <>
                          <div className="bg-muted rounded-full p-4 mb-3">
                            {uploading ? <Upload className="h-8 w-8 text-primary animate-bounce" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}
                          </div>
                          <p className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Clique para enviar imagem"}</p>
                          <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
                        </>
                      )}
                    </div>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
                    <div className="mt-2">
                      <Input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="Ou cole a URL da imagem..." className="text-xs" />
                    </div>
                  </div>
                  <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2"><Label>Nome do Produto *</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} placeholder="Ex: Gerador Diesel 100kVA" /></div>
                    <div><Label>Código / SKU</Label><Input value={productForm.sku} onChange={(e) => setProductForm({ ...productForm, sku: e.target.value })} placeholder="Ex: GEN-DSL-100" /></div>
                    <div>
                      <Label>Categoria</Label>
                      <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value, subcategory_id: "" })}>
                        <option value="">Sem categoria</option>
                        {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                      </select>
                    </div>
                    {productForm.category_id && getCatSubcats(productForm.category_id).length > 0 && (
                      <div>
                        <Label>Subcategoria</Label>
                        <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={productForm.subcategory_id} onChange={(e) => setProductForm({ ...productForm, subcategory_id: e.target.value })}>
                          <option value="">Sem subcategoria</option>
                          {getCatSubcats(productForm.category_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                        </select>
                      </div>
                    )}
                    {categories.filter(c => c.id !== productForm.category_id).length > 0 && (
                      <div className="md:col-span-2">
                        <Label>Categorias Adicionais</Label>
                        <div className="flex flex-wrap gap-2 mt-1 p-3 border border-input rounded-md bg-background">
                          {categories.filter(c => c.id !== productForm.category_id).map(c => (
                            <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                              <input
                                type="checkbox"
                                checked={productForm.extra_category_ids.includes(c.id)}
                                onChange={(e) => {
                                  const ids = e.target.checked
                                    ? [...productForm.extra_category_ids, c.id]
                                    : productForm.extra_category_ids.filter(id => id !== c.id);
                                  setProductForm({ ...productForm, extra_category_ids: ids });
                                }}
                                className="rounded border-input"
                              />
                              {c.name}
                            </label>
                          ))}
                        </div>
                        {productForm.extra_category_ids.length > 0 && (
                          <p className="text-xs text-muted-foreground mt-1">{productForm.extra_category_ids.length} categoria(s) adicional(is) selecionada(s)</p>
                        )}
                      </div>
                    )}
                    <div className="md:col-span-2">
                      <MenuCategoryPicker
                        value={productForm.menu_category_id}
                        onChange={(id) => setProductForm({ ...productForm, menu_category_id: id })}
                        label="Categoria do Menu (Navegação)"
                      />
                      <p className="text-xs text-muted-foreground mt-1">Define onde o produto aparece no menu de navegação superior</p>
                    </div>
                    {/* Reseller assignment */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><Store className="h-4 w-4" /> Produto pertence a Revendedor?</Label>
                      <select
                        className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm"
                        value={productForm.reseller_id}
                        onChange={e => setProductForm({ ...productForm, reseller_id: e.target.value })}
                      >
                        <option value="">Não — Produto próprio</option>
                        {resellers.map(r => {
                          const profile = clients.find(c => c.user_id === r.user_id);
                          return (
                            <option key={r.id} value={r.id}>
                              Sim — {r.company_name || profile?.full_name || "Revendedor"}
                            </option>
                          );
                        })}
                      </select>
                      <p className="text-xs text-muted-foreground mt-1">Associa o produto a um revendedor para relatórios e controle de estoque</p>
                    </div>
                    <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                    <div><Label>Preço Original (opcional)</Label><Input type="number" step="0.01" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} placeholder="Preço anterior" /></div>
                    <div><Label>Estoque</Label><Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} /></div>
                    <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} /></div>
                    <div className="flex items-center gap-6 md:col-span-2 flex-wrap">
                      <div className="flex items-center gap-2"><Switch checked={productForm.is_featured} onCheckedChange={(v) => setProductForm({ ...productForm, is_featured: v })} /><Label>Destaque</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={productForm.is_active} onCheckedChange={(v) => setProductForm({ ...productForm, is_active: v })} /><Label>Ativo</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={productForm.free_shipping} onCheckedChange={(v) => setProductForm({ ...productForm, free_shipping: v })} /><Label>Frete Grátis</Label></div>
                    </div>
                    {/* Additional images */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Imagens adicionais (até 5)</Label>
                      <div className="grid grid-cols-5 gap-2 mt-2">
                        {Array.from({ length: 5 }).map((_, idx) => (
                          <div key={idx}>
                            {productForm.additional_images[idx] ? (
                              <div className="relative group">
                                <img src={productForm.additional_images[idx]} alt="" className="h-20 w-full object-cover rounded-lg border border-border" />
                                <button className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const imgs = [...productForm.additional_images]; imgs.splice(idx, 1); setProductForm({ ...productForm, additional_images: imgs }); }}><X className="h-3 w-3" /></button>
                              </div>
                            ) : (
                              <div
                                className="h-20 w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer"
                                onClick={() => {
                                  const input = document.createElement('input');
                                  input.type = 'file'; input.accept = 'image/*';
                                  input.onchange = async (ev: any) => {
                                    const file = ev.target.files?.[0]; if (!file) return;
                                    const ext = file.name.split('.').pop();
                                    const fName = `${Date.now()}-extra-${idx}.${ext}`;
                                    const { error } = await supabase.storage.from("product-images").upload(fName, file);
                                    if (!error) {
                                      const { data } = supabase.storage.from("product-images").getPublicUrl(fName);
                                      const imgs = [...productForm.additional_images]; imgs[idx] = data.publicUrl;
                                      setProductForm(prev => ({ ...prev, additional_images: imgs }));
                                    }
                                  };
                                  input.click();
                                }}
                              ><Plus className="h-4 w-4 text-muted-foreground" /></div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Video URL */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> URL do Vídeo</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={productForm.video_url} onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=..." className="flex-1" />
                        <Button variant="outline" type="button" onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'video/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0]; if (!file) return;
                            if (file.size > 50 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 50MB", variant: "destructive" }); return; }
                            setUploading(true);
                            const ext = file.name.split('.').pop();
                            const fName = `video-${Date.now()}.${ext}`;
                            const { error } = await supabase.storage.from("product-images").upload(fName, file);
                            if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); setUploading(false); return; }
                            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fName);
                            setProductForm(prev => ({ ...prev, video_url: urlData.publicUrl }));
                            toast({ title: "Vídeo enviado!" });
                            setUploading(false);
                          };
                          input.click();
                        }}>
                          <Upload className="h-4 w-4 mr-1" /> Upload
                        </Button>
                      </div>
                    </div>

                    {/* Brand, HP, Engine Model */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <Label>Marca</Label>
                        <Input value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} placeholder="Ex: Honda, Branco..." className="mt-1" />
                      </div>
                      <div>
                        <Label>Potência (HP)</Label>
                        <Input value={productForm.hp} onChange={e => setProductForm({ ...productForm, hp: e.target.value })} placeholder="Ex: 5.5, 7, 13..." className="mt-1" />
                      </div>
                      <div>
                        <Label>Modelo do Motor</Label>
                        <Input value={productForm.engine_model} onChange={e => setProductForm({ ...productForm, engine_model: e.target.value })} placeholder="Ex: GX160, GX200..." className="mt-1" />
                      </div>
                    </div>

                    {/* Weight & Dimensions */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div>
                        <Label>Peso (kg)</Label>
                        <Input type="number" step="0.01" value={productForm.weight_kg} onChange={e => setProductForm({ ...productForm, weight_kg: e.target.value })} placeholder="Ex: 2.5" className="mt-1" />
                      </div>
                      <div>
                        <Label>Largura (cm)</Label>
                        <Input type="number" step="0.1" value={productForm.width_cm} onChange={e => setProductForm({ ...productForm, width_cm: e.target.value })} placeholder="Ex: 30" className="mt-1" />
                      </div>
                      <div>
                        <Label>Altura (cm)</Label>
                        <Input type="number" step="0.1" value={productForm.height_cm} onChange={e => setProductForm({ ...productForm, height_cm: e.target.value })} placeholder="Ex: 20" className="mt-1" />
                      </div>
                      <div>
                        <Label>Comprimento (cm)</Label>
                        <Input type="number" step="0.1" value={productForm.length_cm} onChange={e => setProductForm({ ...productForm, length_cm: e.target.value })} placeholder="Ex: 40" className="mt-1" />
                      </div>
                    </div>


                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Especificações Técnicas (JSON)</Label>
                      <Textarea
                        rows={4}
                        value={productForm.specifications}
                        onChange={e => setProductForm({ ...productForm, specifications: e.target.value })}
                        placeholder={'{\n  "Cilindrada": "196cc",\n  "Potência": "6.5 HP",\n  "Combustível": "Gasolina"\n}'}
                        className="mt-1 font-mono text-xs"
                      />
                      <p className="text-[10px] text-muted-foreground mt-1">Formato JSON: {"{"}"Chave": "Valor", ...{"}"}</p>
                    </div>

                    {/* Documents URLs */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><Download className="h-4 w-4" /> Documentos Técnicos (URLs)</Label>
                      <div className="space-y-2 mt-1">
                        {Array.from({ length: Math.max(1, productForm.documents.length + 1) }).map((_, idx) => (
                          <div key={idx} className="flex gap-2">
                            <Input
                              value={productForm.documents[idx] || ""}
                              onChange={e => {
                                const docs = [...productForm.documents];
                                docs[idx] = e.target.value;
                                setProductForm({ ...productForm, documents: docs.filter((d, i) => d || i === idx) });
                              }}
                              placeholder={`URL do documento ${idx + 1} (PDF, manual, etc.)...`}
                              className="text-xs"
                            />
                            {productForm.documents[idx] && (
                              <Button variant="ghost" size="icon" onClick={() => {
                                const docs = productForm.documents.filter((_, i) => i !== idx);
                                setProductForm({ ...productForm, documents: docs });
                              }}><X className="h-4 w-4 text-destructive" /></Button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex gap-3 mt-6 pt-5 border-t border-border">
                  <Button onClick={saveProduct} className="shadow-md">{editingProduct.id ? "Atualizar" : "Cadastrar"} Produto</Button>
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            {/* Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                <SlidersHorizontal className="h-4 w-4" /> Filtros
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[200px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar por nome ou SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} />
                </div>
                <select className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[160px]" value={productCatFilter} onChange={(e) => setProductCatFilter(e.target.value)}>
                  <option value="">Todas as categorias</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
                <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}>
                  <option value="">Todos os status</option>
                  <option value="active">Ativos</option>
                  <option value="inactive">Inativos</option>
                  <option value="featured">Em Destaque</option>
                  <option value="no-image">Sem Imagem</option>
                </select>
                <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)}>
                  <option value="">Qualquer estoque</option>
                  <option value="out">Sem estoque</option>
                  <option value="low">Estoque baixo (≤5)</option>
                  <option value="ok">Estoque ok</option>
                </select>
                {(productSearch || productCatFilter || productStatusFilter || productStockFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setProductSearch(""); setProductCatFilter(""); setProductStatusFilter(""); setProductStockFilter(""); }}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Bulk actions */}
            {(selectedProducts.size > 0 || generatingAIImages) && (
              <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 mb-4 flex items-center justify-between flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <Badge className="bg-primary/10 text-primary border-primary/20">{selectedProducts.size} selecionados</Badge>
                  {generatingAIImages && (
                    <div className="flex items-center gap-2">
                      <Loader2 className="h-4 w-4 animate-spin text-primary" />
                      <span className="text-sm text-muted-foreground">Gerando imagem {aiImageProgress}/{aiImageTotal}...</span>
                      <Progress value={(aiImageProgress / aiImageTotal) * 100} className="w-32 h-2" />
                    </div>
                  )}
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}>
                    <Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens IA ({products.filter(p => !p.image_url && p.is_active).length})
                  </Button>
                  <Button variant="destructive" size="sm" onClick={bulkDeleteProducts}>
                    <Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionados
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setSelectedProducts(new Set())}>
                    <X className="h-4 w-4 mr-1" /> Desselecionar
                  </Button>
                </div>
              </div>
            )}

            {/* AI Images button when no selection */}
            {selectedProducts.size === 0 && !generatingAIImages && products.filter(p => !p.image_url && p.is_active).length > 0 && (
              <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  <ImageIcon className="h-4 w-4 inline mr-1" />
                  {products.filter(p => !p.image_url && p.is_active).length} produtos sem imagem
                </span>
                <Button variant="outline" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}>
                  <Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens com IA
                </Button>
              </div>
            )}

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="p-3.5 w-10">
                        <button onClick={toggleAllProducts} className="text-muted-foreground hover:text-foreground">
                          {selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                        </button>
                      </th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Produto</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">SKU</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Categoria</th>
                      <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Preço</th>
                      <th className="text-center p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estoque</th>
                      <th className="text-center p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
                      <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredProducts.map((p) => (
                      <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${selectedProducts.has(p.id) ? "bg-primary/5" : ""}`}>
                        <td className="p-3.5">
                          <button onClick={() => toggleProductSelect(p.id)}>
                            {selectedProducts.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                          </button>
                        </td>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
                            <div>
                              <span className="font-medium block">{p.name}</span>
                              {p.is_featured && <span className="text-[10px] text-primary font-semibold">⭐ Destaque</span>}
                              {(p as any).subcategory_id && <span className="text-[10px] text-muted-foreground block">{getSubcatName((p as any).subcategory_id)}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                        <td className="p-3.5"><Badge variant="outline" className="font-normal">{getCategoryName(p.category_id)}</Badge></td>
                        <td className="p-3.5 text-right">
                          {p.original_price && <span className="text-muted-foreground line-through text-xs block">R$ {Number(p.original_price).toFixed(2).replace(".", ",")}</span>}
                          <span className="font-bold text-price">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                        </td>
                        <td className="p-3.5 text-center">
                          <Badge variant={p.stock_quantity === 0 ? "destructive" : p.stock_quantity <= 5 ? "secondary" : "outline"}>{p.stock_quantity}</Badge>
                        </td>
                        <td className="p-3.5 text-center">{p.is_active ? <Eye className="h-4 w-4 text-primary mx-auto" /> : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />}</td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editProduct(p)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteProduct(p.id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredProducts.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-3xl font-bold">Pedidos</h1>
                <p className="text-muted-foreground text-sm mt-1">{filteredOrders.length} de {orders.length} pedidos</p>
              </div>
              <div className="flex gap-2">
                {selectedOrders.size > 0 && (
                  <>
                    <Badge className="bg-primary/10 text-primary border-primary/20 self-center">{selectedOrders.size} selecionados</Badge>
                    <Button variant="destructive" size="sm" onClick={bulkDeleteOrders}>
                      <Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionados
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setSelectedOrders(new Set())}>
                      <X className="h-4 w-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>

            {/* Order Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                <Filter className="h-4 w-4" /> Filtros
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[180px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar por ID..." value={orderSearch} onChange={(e) => setOrderSearch(e.target.value)} />
                </div>
                <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={orderStatusFilter} onChange={(e) => setOrderStatusFilter(e.target.value)}>
                  <option value="">Todos os status</option>
                  {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">De:</span>
                  <Input type="date" className="h-10 w-auto" value={orderDateFrom} onChange={(e) => setOrderDateFrom(e.target.value)} />
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground whitespace-nowrap">Até:</span>
                  <Input type="date" className="h-10 w-auto" value={orderDateTo} onChange={(e) => setOrderDateTo(e.target.value)} />
                </div>
                {(orderSearch || orderStatusFilter || orderDateFrom || orderDateTo) && (
                  <Button variant="ghost" size="sm" onClick={() => { setOrderSearch(""); setOrderStatusFilter(""); setOrderDateFrom(""); setOrderDateTo(""); }}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Select all orders */}
            <div className="flex items-center gap-3 mb-3">
              <button onClick={toggleAllOrders} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
                {selectedOrders.size === filteredOrders.length && filteredOrders.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                Selecionar todos
              </button>
            </div>

            <div className="space-y-3">
              {filteredOrders.map((o) => (
                <div key={o.id} className={`bg-card rounded-xl shadow-sm border overflow-hidden ${selectedOrders.has(o.id) ? "border-primary" : "border-border"}`}>
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadOrderItems(o.id)}>
                    <div className="flex items-center gap-4">
                      <button onClick={(e) => { e.stopPropagation(); toggleOrderSelect(o.id); }}>
                        {selectedOrders.has(o.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                      </button>
                      <div className="bg-muted rounded-lg p-2.5"><ShoppingCart className="h-5 w-5 text-muted-foreground" /></div>
                      <div>
                        <p className="font-heading font-bold">Pedido #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); printOrder(o); }}>
                        <Printer className="h-3.5 w-3.5" /> Imprimir
                      </Button>
                      {/* Payment Status */}
                      {o.payment ? (
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                          o.payment.status === "approved" ? "bg-primary/15 text-primary" :
                          o.payment.status === "pending" ? "bg-accent/30 text-accent-foreground" :
                          o.payment.status === "rejected" ? "bg-destructive/15 text-destructive" :
                          "bg-muted text-muted-foreground"
                        }`}>
                          {o.payment.status === "approved" ? "💳 Pago" :
                           o.payment.status === "pending" ? "⏳ Aguardando Pgto" :
                           o.payment.status === "rejected" ? "❌ Recusado" :
                           `💳 ${o.payment.status}`}
                          {o.payment.payment_method && ` (${o.payment.payment_method})`}
                        </span>
                      ) : (
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-bold bg-muted text-muted-foreground">💳 Sem pagamento</span>
                      )}
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status] || o.status}</span>
                      <p className="font-heading font-bold text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                      <select value={o.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="border border-input rounded-md px-2 py-1.5 text-xs bg-background">
                        {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={(e) => { e.stopPropagation(); deleteOrder(o.id); }}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                      {expandedOrder === o.id ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                    </div>
                  </div>
                  {expandedOrder === o.id && (
                    <div className="border-t border-border p-5 bg-muted/20">
                      {o.profile && (
                        <div className="mb-4 p-4 bg-background rounded-lg border border-border">
                          <h4 className="font-heading font-bold text-sm mb-2 flex items-center gap-2"><Users className="h-4 w-4 text-primary" /> Dados do Cliente</h4>
                          <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                            <div><span className="text-muted-foreground">Nome:</span> <strong>{o.profile.full_name || "—"}</strong></div>
                            <div><span className="text-muted-foreground">Email:</span> {o.profile.email}</div>
                            <div><span className="text-muted-foreground">Telefone:</span> {o.profile.phone || "—"}</div>
                            <div><span className="text-muted-foreground">CPF/CNPJ:</span> {o.profile.cpf_cnpj || "—"}</div>
                            <div><span className="text-muted-foreground">Empresa:</span> {o.profile.company_name || "—"}</div>
                            <div><span className="text-muted-foreground">Cidade/UF:</span> {[o.profile.city, o.profile.state].filter(Boolean).join("/") || "—"}</div>
                          </div>
                        </div>
                      )}
                      {o.shipping_address && <p className="text-sm mb-3"><span className="text-muted-foreground">Endereço:</span> {o.shipping_address}</p>}
                      <div className="mb-4 p-3 bg-background rounded-lg border border-border flex items-center gap-3">
                        <Truck className="h-4 w-4 text-primary flex-shrink-0" />
                        <span className="text-sm font-semibold text-muted-foreground whitespace-nowrap">Rastreio:</span>
                        <Input
                          className="h-8 text-sm flex-1"
                          placeholder="Código de rastreamento..."
                          defaultValue={o.tracking_code || ""}
                          onBlur={(e) => { if (e.target.value !== (o.tracking_code || "")) updateTrackingCode(o.id, e.target.value); }}
                          onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
                        />
                      </div>
                      <table className="w-full text-sm">
                        <thead><tr className="text-muted-foreground text-xs uppercase tracking-wider"><th className="text-left pb-2">Item</th><th className="text-center pb-2">Qtd</th><th className="text-right pb-2">Preço Unit.</th><th className="text-right pb-2">Subtotal</th></tr></thead>
                        <tbody className="divide-y divide-border">
                          {(o.items || []).map(item => (
                            <tr key={item.id}>
                              <td className="py-2.5">{item.product_name}</td>
                              <td className="py-2.5 text-center">{item.quantity}</td>
                              <td className="py-2.5 text-right">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</td>
                              <td className="py-2.5 text-right font-bold text-price">R$ {(item.quantity * Number(item.price_at_purchase)).toFixed(2).replace(".", ",")}</td>
                            </tr>
                          ))}
                        </tbody>
                        <tfoot>
                          <tr className="border-t-2 border-border">
                            <td colSpan={3} className="pt-3 text-right font-heading font-bold">Total:</td>
                            <td className="pt-3 text-right font-heading font-bold text-price text-lg">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</td>
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              ))}
              {filteredOrders.length === 0 && <div className="bg-card rounded-xl border border-border p-12 text-center"><ShoppingCart className="h-12 w-12 text-muted-foreground mx-auto mb-3" /><p className="text-muted-foreground">Nenhum pedido encontrado.</p></div>}
            </div>
          </div>
        )}

        {/* CATEGORIES TAB */}
        {tab === "categories" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Tag className="h-8 w-8 text-primary" /> Gestão de Categorias
              </h1>
              <p className="text-muted-foreground mt-1">Sistema hierárquico unificado com níveis ilimitados de subcategorias</p>
            </div>
            <CategoryTreeAdmin />
          </div>
        )}

        {/* CLIENTS TAB */}
        {tab === "clients" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-3xl font-bold">Clientes</h1>
                <p className="text-muted-foreground text-sm mt-1">{filteredClients.length} de {clients.length} clientes</p>
              </div>
              <div className="flex gap-3">
                <a
                  href={`https://wa.me/?text=${encodeURIComponent("Olá! Promoção especial da Gründemann Geradores! Confira nossos produtos: https://grundemann.com.br/produtos")}`}
                  target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-[#25D366] hover:bg-[#1da851] text-white text-sm font-semibold transition-colors shadow-md"
                >
                  <WhatsAppIcon className="h-4 w-4" /> Enviar Mensagem a Todos
                </a>
                <Button onClick={() => { setEditingClient({}); resetClientForm(); }} className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" /> Novo Cliente
                </Button>
              </div>
            </div>

            {editingClient !== null && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading text-xl font-bold">{editingClient?.user_id ? "Editar" : "Novo"} Cliente</h3>
                  <button onClick={() => setEditingClient(null)} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Nome Completo *</Label><Input value={clientForm.full_name} onChange={(e) => setClientForm({ ...clientForm, full_name: e.target.value })} /></div>
                  <div><Label>E-mail *</Label><Input type="email" value={clientForm.email} onChange={(e) => setClientForm({ ...clientForm, email: e.target.value })} /></div>
                  <div><Label>Telefone</Label><Input value={clientForm.phone} onChange={(e) => setClientForm({ ...clientForm, phone: e.target.value })} placeholder="(00) 00000-0000" /></div>
                  <div><Label>CPF / CNPJ</Label><Input value={clientForm.cpf_cnpj} onChange={(e) => setClientForm({ ...clientForm, cpf_cnpj: e.target.value })} placeholder="000.000.000-00" /></div>
                  <div><Label>Razão Social / Empresa</Label><Input value={clientForm.company_name} onChange={(e) => setClientForm({ ...clientForm, company_name: e.target.value })} /></div>
                  <div><Label>CEP</Label><Input value={clientForm.zip_code} onChange={(e) => setClientForm({ ...clientForm, zip_code: e.target.value })} placeholder="00000-000" /></div>
                  <div className="md:col-span-2"><Label>Endereço (Rua)</Label><Input value={clientForm.address} onChange={(e) => setClientForm({ ...clientForm, address: e.target.value })} /></div>
                  <div><Label>Número</Label><Input value={clientForm.address_number} onChange={(e) => setClientForm({ ...clientForm, address_number: e.target.value })} /></div>
                  <div><Label>Complemento</Label><Input value={clientForm.address_complement} onChange={(e) => setClientForm({ ...clientForm, address_complement: e.target.value })} /></div>
                  <div><Label>Bairro</Label><Input value={clientForm.neighborhood} onChange={(e) => setClientForm({ ...clientForm, neighborhood: e.target.value })} /></div>
                  <div><Label>Cidade</Label><Input value={clientForm.city} onChange={(e) => setClientForm({ ...clientForm, city: e.target.value })} /></div>
                  <div>
                    <Label>Estado</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={clientForm.state} onChange={(e) => setClientForm({ ...clientForm, state: e.target.value })}>
                      <option value="">Selecione</option>
                      {["AC","AL","AP","AM","BA","CE","DF","ES","GO","MA","MT","MS","MG","PA","PB","PR","PE","PI","RJ","RN","RS","RO","RR","SC","SP","SE","TO"].map(uf => (
                        <option key={uf} value={uf}>{uf}</option>
                      ))}
                    </select>
                  </div>
                  <div className="md:col-span-3"><Label>Observações</Label><Textarea rows={2} value={clientForm.notes} onChange={(e) => setClientForm({ ...clientForm, notes: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 mt-6 pt-5 border-t border-border">
                  <Button onClick={saveClient} className="shadow-md">{editingClient?.user_id ? "Atualizar" : "Cadastrar"} Cliente</Button>
                  <Button variant="outline" onClick={() => setEditingClient(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                <Search className="h-4 w-4" /> Busca e Filtros
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                </div>
                <select className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[160px]" value={clientRoleFilter} onChange={(e) => setClientRoleFilter(e.target.value)}>
                  <option value="">Todos os tipos</option>
                  <option value="admin">Administradores</option>
                  <option value="seller">Vendedores</option>
                  <option value="revendedor">Revendedores</option>
                  <option value="oficina">Oficinas</option>
                  <option value="mecanico">Mecânicos</option>
                  <option value="cliente">Clientes</option>
                </select>
                {(clientSearch || clientRoleFilter) && (
                  <Button variant="ghost" size="sm" onClick={() => { setClientSearch(""); setClientRoleFilter(""); }}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            {/* Role stats */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-4">
              {["admin", "seller", "revendedor", "oficina", "mecanico", "cliente"].map(role => {
                const count = clients.filter(c => getUserRoleType(c.user_id) === role).length;
                return (
                  <button key={role} onClick={() => setClientRoleFilter(clientRoleFilter === role ? "" : role)} className={`bg-card rounded-xl border p-3 text-center transition-all hover:shadow-md ${clientRoleFilter === role ? "border-primary shadow-md" : "border-border"}`}>
                    <Badge className={`${roleTypeColor[role]} text-[10px] mb-1`}>{roleTypeLabel[role]}</Badge>
                    <p className="font-heading font-bold text-lg">{count}</p>
                  </button>
                );
              })}
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Tipo</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Telefone</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Compras</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cidade/UF</th>
                      <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map(c => {
                      const clientOrders = orders.filter(o => o.user_id === c.user_id);
                      const clientTotal = clientOrders.reduce((s, o) => s + Number(o.total_amount), 0);
                      const phoneClean = normalizeWhatsAppPhone(c.phone);
                      const hasPhone = phoneClean.length >= 12;
                      const isExpanded = expandedClientId === c.user_id;
                      const roleType = getUserRoleType(c.user_id);
                      return (
                      <React.Fragment key={c.user_id}>
                      <tr className="hover:bg-muted/30 transition-colors cursor-pointer" onClick={() => toggleClientExpand(c.user_id)}>
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium block">{c.full_name || "—"}</span>
                              {c.company_name && <span className="text-[10px] text-muted-foreground">{c.company_name}</span>}
                              {c.cpf_cnpj && <span className="text-[10px] text-muted-foreground block font-mono">{c.cpf_cnpj}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5">
                          <Badge className={`${roleTypeColor[roleType] || ""} text-[10px] border-0`}>{roleTypeLabel[roleType] || roleType}</Badge>
                        </td>
                        <td className="p-3.5 text-muted-foreground text-xs">{c.email}</td>
                        <td className="p-3.5">
                          {c.phone ? (
                            <div className="flex items-center gap-1.5">
                              <span className="text-muted-foreground text-xs">{c.phone}</span>
                              {hasPhone && (
                                <a href={`https://wa.me/${phoneClean}`} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-[#25D366] text-white hover:bg-[#1da851] transition-colors"
                                  title="WhatsApp"
                                  onClick={e => e.stopPropagation()}
                                >
                                  <WhatsAppIcon className="h-3 w-3" />
                                </a>
                              )}
                            </div>
                          ) : <span className="text-muted-foreground text-xs">—</span>}
                        </td>
                        <td className="p-3.5">
                          {clientOrders.length > 0 ? (
                            <div className="flex items-center gap-2">
                              <div>
                                <Badge variant="secondary" className="text-[10px]">{clientOrders.length} pedido{clientOrders.length > 1 ? "s" : ""}</Badge>
                                <p className="text-[10px] font-bold text-primary mt-0.5">R$ {clientTotal.toFixed(2).replace(".", ",")}</p>
                              </div>
                              {isExpanded ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
                            </div>
                          ) : <span className="text-muted-foreground text-xs">Sem compras</span>}
                        </td>
                        <td className="p-3.5 text-muted-foreground text-xs">{[c.city, c.state].filter(Boolean).join("/") || "—"}</td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1" onClick={e => e.stopPropagation()}>
                            {hasPhone && (
                              <a href={`https://wa.me/${phoneClean}?text=${encodeURIComponent(`Olá ${c.full_name || ""}! Aqui é da Gründemann Geradores.`)}`} target="_blank" rel="noopener noreferrer">
                                <Button variant="ghost" size="icon" className="h-8 w-8 text-[#25D366]"><WhatsAppIcon className="h-4 w-4" /></Button>
                              </a>
                            )}
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editClient(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteClient(c.user_id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                      {/* Expanded: purchase details */}
                      {isExpanded && clientOrders.length > 0 && (
                        <tr>
                          <td colSpan={7} className="p-0">
                            <div className="bg-muted/30 border-t border-b border-border px-6 py-4">
                              <h4 className="font-heading font-bold text-sm mb-3 flex items-center gap-2">
                                <ShoppingCart className="h-4 w-4 text-primary" /> Histórico de Compras
                              </h4>
                              <div className="space-y-3">
                                {clientOrders.map(o => (
                                  <div key={o.id} className="bg-card rounded-lg border border-border p-3">
                                    <div className="flex items-center justify-between mb-2">
                                      <div className="flex items-center gap-3">
                                        <span className="font-mono text-xs font-bold text-foreground">#{o.id.slice(0, 8)}</span>
                                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status] || o.status}</span>
                                        <span className="text-[10px] text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</span>
                                      </div>
                                      <span className="font-bold text-sm text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</span>
                                    </div>
                                    {/* Order items */}
                                    {clientOrderItems[o.id] && clientOrderItems[o.id].length > 0 && (
                                      <div className="mt-2 border-t border-border pt-2 space-y-1">
                                        {clientOrderItems[o.id].map(item => (
                                          <div key={item.id} className="flex items-center justify-between text-xs">
                                            <span className="text-foreground">{item.quantity}x {item.product_name}</span>
                                            <span className="text-muted-foreground font-medium">R$ {Number(item.price_at_purchase).toFixed(2).replace(".", ",")}</span>
                                          </div>
                                        ))}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                      </React.Fragment>
                      );
                    })}
                    {filteredClients.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* TESTIMONIALS TAB */}
        {tab === "testimonials" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-3xl font-bold">Depoimentos</h1>
                <p className="text-muted-foreground text-sm mt-1">{testimonials.length} depoimentos</p>
              </div>
              <Button onClick={() => { setEditingTestimonial({}); setTestimonialForm({ customer_name: "", customer_city: "", rating: "5", comment: "" }); }} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" /> Novo Depoimento
              </Button>
            </div>

            {editingTestimonial !== null && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
                <h3 className="font-heading text-lg font-bold mb-4">{editingTestimonial.id ? "Editar" : "Novo"} Depoimento</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Nome do Cliente *</Label><Input value={testimonialForm.customer_name} onChange={(e) => setTestimonialForm({ ...testimonialForm, customer_name: e.target.value })} /></div>
                  <div><Label>Cidade / Estado</Label><Input value={testimonialForm.customer_city} onChange={(e) => setTestimonialForm({ ...testimonialForm, customer_city: e.target.value })} placeholder="Ex: São Paulo/SP" /></div>
                  <div>
                    <Label>Avaliação</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={testimonialForm.rating} onChange={(e) => setTestimonialForm({ ...testimonialForm, rating: e.target.value })}>
                      {[5,4,3,2,1].map(n => <option key={n} value={n}>{n} estrela{n > 1 ? "s" : ""}</option>)}
                    </select>
                  </div>
                  <div className="md:col-span-3"><Label>Comentário *</Label><Textarea rows={3} value={testimonialForm.comment} onChange={(e) => setTestimonialForm({ ...testimonialForm, comment: e.target.value })} placeholder="O que o cliente disse..." /></div>
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
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleTestimonialApproval(t.id, t.is_approved)}>
                        {t.is_approved ? <Eye className="h-3.5 w-3.5 text-primary" /> : <EyeOff className="h-3.5 w-3.5 text-muted-foreground" />}
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => {
                        setEditingTestimonial(t);
                        setTestimonialForm({ customer_name: t.customer_name, customer_city: t.customer_city, rating: String(t.rating), comment: t.comment });
                      }}><Edit className="h-3.5 w-3.5" /></Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => deleteTestimonial(t.id)}><Trash2 className="h-3.5 w-3.5" /></Button>
                    </div>
                  </div>
                  <div className="flex gap-0.5 mb-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-3.5 w-3.5 ${i < t.rating ? "fill-accent text-accent" : "text-muted-foreground/30"}`} />
                    ))}
                  </div>
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
        )}

        {/* REPORTS TAB */}
        {tab === "reports" && <AdminReports />}


        {/* SELLERS TAB */}
        {tab === "sellers" && <SellerManagement />}

        {/* QUOTES TAB */}
        {tab === "quotes" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <FileUp className="h-7 w-7 text-primary" /> Orçamentos
                </h1>
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
                <div className="rounded-2xl bg-gradient-to-br from-primary to-primary/70 p-4 shadow-lg">
                  <Wrench className="h-10 w-10 text-primary-foreground" />
                </div>
                <div>
                  <h1 className="font-heading text-3xl font-black text-foreground">Área do Mecânico</h1>
                  <p className="text-muted-foreground mt-0.5">Gerencie mecânicos, vídeos, artigos, catálogos e orçamentos</p>
                </div>
              </div>
            </div>

            {/* Feature cards grid */}
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
                <button
                  key={card.key}
                  onClick={() => setTab(card.key === "mechanic-list" ? "mechanics" : card.key)}
                  className={`group relative text-left rounded-2xl border-2 ${card.border} bg-gradient-to-br ${card.gradient} p-6 hover:shadow-xl hover:scale-[1.02] transition-all duration-300 overflow-hidden`}
                >
                  <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-background/5 to-transparent -translate-y-8 translate-x-8" />
                  <div className={`inline-flex items-center justify-center rounded-xl ${card.iconBg} p-3 mb-4 shadow-sm group-hover:shadow-md transition-shadow`}>
                    <card.icon className={`h-7 w-7 ${card.iconColor}`} />
                  </div>
                  <h3 className="font-heading font-bold text-lg text-foreground mb-1 group-hover:text-primary transition-colors">{card.label}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{card.desc}</p>
                  <div className="mt-4 inline-flex items-center text-xs font-semibold text-primary opacity-0 group-hover:opacity-100 transition-opacity">
                    Acessar →
                  </div>
                </button>
              ))}
            </div>

            {/* Quick stats for mechanics */}
            <div className="bg-card rounded-2xl border border-border p-6">
              <h2 className="font-heading font-bold text-lg text-foreground mb-4 flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" /> Gestão de Mecânicos
              </h2>
              <MechanicManagement />
            </div>
          </div>
        )}

        {/* MECHANIC VIDEOS SUB-TAB */}
        {(tab as string) === "mechanic-videos" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <Video className="h-7 w-7 text-primary" /> Vídeos Técnicos
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie vídeos de instalação e manutenção para mecânicos</p>
              </div>
            </div>
            <MechanicVideoManagement />
          </div>
        )}

        {/* ROLES TAB */}
        {tab === "roles" && <UserRoleManagement />}

        {/* MARKETING TAB */}
        {tab === "marketing" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Megaphone className="h-8 w-8 text-primary" /> Central de Marketing
              </h1>
              <p className="text-muted-foreground mt-1">Crie campanhas e anúncios automaticamente com IA</p>
            </div>
            <MarketingCenter />
          </div>
        )}

        {/* STOCK & ML TAB */}
        {tab === "stock" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Boxes className="h-8 w-8 text-primary" /> Gestão de Estoque & Mercado Livre
              </h1>
              <p className="text-muted-foreground mt-1">Controle unificado de estoque, sincronização com Mercado Livre e alertas de reposição</p>
          </div>
          <StockManagement />
        </div>
        )}

        {/* SUBSCRIBERS TAB */}
        {tab === "subscribers" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Mail className="h-8 w-8 text-primary" /> Leads & Cupons de Desconto
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie emails capturados, cupons e métricas de conversão do pop-up de desconto</p>
            </div>
            <EmailSubscriberManagement />
          </div>
        )}

        {/* REWARDS TAB */}
        {tab === "rewards" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Gift className="h-8 w-8 text-primary" /> Programa de Fidelidade
              </h1>
              <p className="text-muted-foreground mt-1">Gerencie recompensas, aprove resgates e credite pontos manualmente. Pontos são creditados automaticamente na entrega.</p>
            </div>
            <RewardsManagement />
          </div>
        )}
        {/* ARTICLES TAB */}
        {tab === "articles" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <BookOpen className="h-7 w-7 text-primary" /> Central Técnica
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie artigos técnicos, guias de manutenção e conteúdo educacional</p>
              </div>
            </div>
            <ArticleManagement />
          </div>
        )}

        {/* SEO TAB */}
        {tab === "seo" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Globe className="h-8 w-8 text-primary" /> Otimização SEO
              </h1>
              <p className="text-muted-foreground mt-1">Ferramentas para otimizar a presença nos motores de busca</p>
            </div>
            <SEOBatchGenerator />
          </div>
        )}
        {/* SHIPPING TAB */}
        {tab === "shipping" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <Truck className="h-8 w-8 text-primary" /> Gestão de Frete
              </h1>
              <p className="text-muted-foreground mt-1">Configure valores de PAC e SEDEX por região</p>
            </div>
            <ShippingManagement />
          </div>
        )}

        {/* ANALYTICS TAB */}
        {tab === "analytics" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-3xl font-bold text-foreground flex items-center gap-3">
                <TrendingUp className="h-8 w-8 text-primary" /> Analytics
              </h1>
              <p className="text-muted-foreground mt-1">Métricas de vendas, produtos mais vendidos e desempenho</p>
            </div>
            <AnalyticsDashboard />
          </div>
        )}

        {/* PRICE RESEARCH TAB */}
        {tab === "price-research" && (
          <div>
            <div className="mb-8">
              <h1 className="text-3xl font-heading font-bold">Pesquisa de Preços da Concorrência</h1>
              <p className="text-muted-foreground mt-1">Busca real em Mercado Livre, Shopee e lojas via Firecrawl + análise por IA</p>
            </div>
            <PriceResearch />
          </div>
        )}

        {/* CATALOGS TAB */}
        {tab === "catalogs" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <FileText className="h-7 w-7 text-primary" /> Catálogos Técnicos
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie os catálogos PDF disponíveis para mecânicos cadastrados</p>
              </div>
            </div>
            <CatalogManagement />
          </div>
        )}

        {/* EXPLODED VIEWS TAB */}
        {(tab as string) === "exploded-views" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <Package className="h-7 w-7 text-primary" /> Vistas Explodidas
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie os diagramas de vistas explodidas dos motores</p>
              </div>
            </div>
            <ExplodedViewManagement />
          </div>
        )}

        {/* RESELLER CONTENT TAB */}
        {(tab as string) === "reseller-content" && (
          <div>
            <div className="mb-6 flex items-center gap-3">
              <Button variant="ghost" size="sm" onClick={() => setTab("mechanics")} className="gap-1.5">
                <ChevronUp className="h-4 w-4 -rotate-90" /> Voltar
              </Button>
              <div>
                <h1 className="font-heading text-2xl font-bold text-foreground flex items-center gap-3">
                  <Download className="h-7 w-7 text-primary" /> Conteúdo para Revendedores
                </h1>
                <p className="text-muted-foreground text-sm mt-0.5">Gerencie PDFs e materiais exclusivos para revendedores</p>
              </div>
            </div>
            <ResellerContentManagement />
          </div>
        )}


        {tab === "appearance" && (
          <div>
            <div className="mb-8">
              <h1 className="font-heading text-2xl font-black text-foreground flex items-center gap-3">
                <Paintbrush className="h-7 w-7 text-primary" /> Aparência
              </h1>
              <p className="text-muted-foreground mt-1">Configure a aparência da página inicial do site</p>
            </div>
            <AppearanceSettings />
          </div>
        )}

        {/* SITE FEATURE REPORT TAB */}
        {tab === "site-report" && <SiteFeatureReport />}
      </main>
    </div>
  );
};

export default AdminDashboard;
