import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  LayoutDashboard, Package, ShoppingCart, Users, LogOut, Plus, Trash2, Edit, Tag, Eye, EyeOff, Search, ChevronDown, ChevronUp, X, Upload, ImageIcon, TrendingUp, DollarSign, AlertTriangle, Clock, Filter, SlidersHorizontal, FolderTree, Printer, RefreshCw, Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import logo from "@/assets/logo-grundemann.png";
import OrderPrintSheet from "@/components/OrderPrintSheet";

interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; is_featured: boolean; category_id: string | null;
  subcategory_id?: string | null; image_url: string | null; created_at: string;
  additional_images?: string[] | null; video_url?: string | null;
}

interface OrderWithItems {
  id: string; user_id: string; status: string; total_amount: number;
  created_at: string; shipping_address: string | null; notes: string | null;
  items?: OrderItem[];
  profile?: ProfileFull | null;
}

interface OrderItem {
  id: string; product_name: string; quantity: number; price_at_purchase: number;
}

interface Category {
  id: string; name: string; slug: string; description: string | null; image_url: string | null;
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
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "categories" | "clients">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<OrderWithItems[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [clients, setClients] = useState<ProfileFull[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, pendingOrders: 0, totalClients: 0 });
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const printRef = useRef<HTMLDivElement>(null);
  const [printingOrder, setPrintingOrder] = useState<OrderWithItems | null>(null);
  const [syncing, setSyncing] = useState(false);

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
  const [editingClient, setEditingClient] = useState<Partial<ProfileFull> | null>(null);
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
  const [productForm, setProductForm] = useState({
    name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "",
    category_id: "", subcategory_id: "", is_featured: false, is_active: true, image_url: "",
    additional_images: [] as string[], video_url: ""
  });

  const [editingCategory, setEditingCategory] = useState<Partial<Category> | null>(null);
  const [categoryForm, setCategoryForm] = useState({ name: "", slug: "", description: "", image_url: "" });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    const [prodRes, ordRes, catRes, clientRes, subRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
      supabase.from("profiles").select("*").order("created_at", { ascending: false }),
      supabase.from("subcategories").select("*").order("name"),
    ]);
    const prods = (prodRes.data || []) as Product[];
    const ords = (ordRes.data || []) as OrderWithItems[];
    const cats = (catRes.data || []) as Category[];
    const cls = (clientRes.data || []) as ProfileFull[];
    const subs = (subRes.data || []) as Subcategory[];
    setProducts(prods); setOrders(ords); setCategories(cats); setClients(cls); setSubcategories(subs);
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
    // Ensure items and profile are loaded
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
      image_url: productForm.image_url || null,
      additional_images: productForm.additional_images.filter(Boolean),
      video_url: productForm.video_url || null,
    };
    if (editingProduct?.id) {
      const { error } = await supabase.from("products").update(data).eq("id", editingProduct.id);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Produto atualizado!" });
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
      toast({ title: "Produto criado!" });
    }
    setEditingProduct(null); resetProductForm(); loadAll();
  };

  const resetProductForm = () => setProductForm({ name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "", category_id: "", subcategory_id: "", is_featured: false, is_active: true, image_url: "", additional_images: [], video_url: "" });

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
    toast({ title: "Produto excluído!" }); loadAll();
  };

  const editProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name, description: p.description || "", sku: p.sku || "",
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      stock_quantity: String(p.stock_quantity), category_id: p.category_id || "",
      subcategory_id: (p as any).subcategory_id || "", is_featured: p.is_featured,
      is_active: p.is_active, image_url: p.image_url || "",
      additional_images: (p.additional_images || []) as string[],
      video_url: (p.video_url || "") as string,
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

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    await supabase.from("order_status_history").insert({ order_id: id, status: status as any });
    toast({ title: `Status atualizado para ${statusLabel[status]}` }); loadAll();
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
      // Create new client profile (admin manual creation)
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
  ] as const;

  // Filtered data
  const filteredProducts = products.filter(p => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !(p.sku || "").toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCatFilter && p.category_id !== productCatFilter) return false;
    if (productStatusFilter === "active" && !p.is_active) return false;
    if (productStatusFilter === "inactive" && p.is_active) return false;
    if (productStatusFilter === "featured" && !p.is_featured) return false;
    if (productStockFilter === "out" && p.stock_quantity > 0) return false;
    if (productStockFilter === "low" && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false;
    if (productStockFilter === "ok" && p.stock_quantity <= 5) return false;
    return true;
  });

  const filteredOrders = orders.filter(o => {
    if (orderSearch && !o.id.includes(orderSearch.toLowerCase())) return false;
    if (orderStatusFilter && o.status !== orderStatusFilter) return false;
    if (orderDateFrom && new Date(o.created_at) < new Date(orderDateFrom)) return false;
    if (orderDateTo && new Date(o.created_at) > new Date(orderDateTo + "T23:59:59")) return false;
    return true;
  });

  const filteredClients = clients.filter(c => {
    if (!clientSearch) return true;
    const s = clientSearch.toLowerCase();
    return (c.full_name || "").toLowerCase().includes(s) || (c.email || "").toLowerCase().includes(s) || (c.phone || "").toLowerCase().includes(s) || (c.cpf_cnpj || "").toLowerCase().includes(s);
  });

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getSubcatName = (id: string | null) => subcategories.find(s => s.id === id)?.name || null;
  const getCatSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

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
        </div>
        <nav className="flex-1 p-3 space-y-1">
          {sideItems.map((item) => (
            <button
              key={item.key}
              onClick={() => setTab(item.key)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-all duration-200 ${
                tab === item.key
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
          <button onClick={() => navigate("/")} className="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm text-sidebar-foreground/70 hover:bg-sidebar-accent/30 hover:text-sidebar-foreground transition-colors">
            <ShoppingCart className="h-5 w-5" /> Ver Loja
          </button>
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-5 mb-8">
              {[
                { label: "Produtos", value: stats.totalProducts, icon: Package, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary", border: "border-primary/20" },
                { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart, gradient: "from-secondary/10 to-secondary/5", iconColor: "text-secondary", border: "border-secondary/20" },
                { label: "Receita Total", value: `R$ ${stats.revenue.toFixed(2).replace(".", ",")}`, icon: DollarSign, gradient: "from-primary/10 to-primary/5", iconColor: "text-primary", border: "border-primary/20" },
                { label: "Pendentes", value: stats.pendingOrders, icon: Clock, gradient: "from-accent/20 to-accent/10", iconColor: "text-accent-foreground", border: "border-accent/30" },
                { label: "Clientes", value: stats.totalClients, icon: Users, gradient: "from-secondary/10 to-secondary/5", iconColor: "text-secondary", border: "border-secondary/20" },
              ].map((s) => (
                <div key={s.label} className={`bg-card rounded-xl shadow-sm border ${s.border} p-5 bg-gradient-to-br ${s.gradient} hover:shadow-md transition-shadow`}>
                  <div className="flex items-center gap-3">
                    <div className={`rounded-xl bg-background p-3 shadow-sm ${s.iconColor}`}><s.icon className="h-6 w-6" /></div>
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider font-medium">{s.label}</p>
                      <p className="text-xl font-heading font-bold mt-0.5">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="bg-card rounded-xl shadow-sm border border-border">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 text-primary" /> Últimos Pedidos</h2>
                  <Button variant="ghost" size="sm" onClick={() => setTab("orders")}>Ver todos</Button>
                </div>
                <div className="divide-y divide-border">
                  {orders.slice(0, 5).map((o) => (
                    <div key={o.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
                      <div>
                        <p className="font-medium text-sm">#{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR")}</p>
                      </div>
                      <div className="text-right flex items-center gap-3">
                        <span className={`text-[10px] px-2.5 py-1 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status]}</span>
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
                  {products.filter(p => p.stock_quantity <= 5 && p.is_active).slice(0, 5).map(p => (
                    <div key={p.id} className="px-5 py-3.5 flex items-center justify-between hover:bg-muted/30 transition-colors">
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
              <div className="flex gap-3">
                <Button onClick={syncMercadoLivre} variant="outline" disabled={syncing} className="shadow-md border-accent text-accent-foreground hover:bg-accent/10">
                  <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? "Sincronizando..." : "Sincronizar Mercado Livre"}
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
                    <div><Label>Preço de Venda (R$) *</Label><Input type="number" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} placeholder="0.00" /></div>
                    <div><Label>Preço Original (R$)</Label><Input type="number" step="0.01" value={productForm.original_price} onChange={(e) => setProductForm({ ...productForm, original_price: e.target.value })} placeholder="Sem desconto" /></div>
                    <div><Label>Quantidade em Estoque *</Label><Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} placeholder="0" /></div>
                    <div className="flex items-end gap-6 pb-1">
                      <div className="flex items-center gap-2"><Switch checked={productForm.is_active} onCheckedChange={(v) => setProductForm({ ...productForm, is_active: v })} /><Label className="mb-0">Ativo</Label></div>
                      <div className="flex items-center gap-2"><Switch checked={productForm.is_featured} onCheckedChange={(v) => setProductForm({ ...productForm, is_featured: v })} /><Label className="mb-0">Destaque</Label></div>
                    </div>
                    <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} placeholder="Descrição detalhada do produto..." /></div>
                    
                    {/* Additional Images */}
                    <div className="md:col-span-2">
                      <Label className="mb-2 block">Imagens Adicionais (até 5)</Label>
                      <div className="flex flex-wrap gap-3">
                        {productForm.additional_images.map((img, idx) => (
                          <div key={idx} className="relative w-20 h-20 rounded-lg border border-border overflow-hidden">
                            <img src={img} alt={`Extra ${idx+1}`} className="w-full h-full object-cover" />
                            <button onClick={() => setProductForm(prev => ({ ...prev, additional_images: prev.additional_images.filter((_, i) => i !== idx) }))} className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5"><X className="h-3 w-3" /></button>
                          </div>
                        ))}
                        {productForm.additional_images.length < 5 && (
                          <button
                            type="button"
                            className="w-20 h-20 rounded-lg border-2 border-dashed border-border flex flex-col items-center justify-center text-muted-foreground hover:border-primary/50 hover:bg-primary/5 transition-all"
                            onClick={() => {
                              const input = document.createElement('input');
                              input.type = 'file'; input.accept = 'image/*';
                              input.onchange = async (e: any) => {
                                const file = e.target.files?.[0];
                                if (!file) return;
                                const ext = file.name.split('.').pop();
                                const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
                                const { error } = await supabase.storage.from("product-images").upload(fileName, file);
                                if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); return; }
                                const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
                                setProductForm(prev => ({ ...prev, additional_images: [...prev.additional_images, urlData.publicUrl] }));
                                toast({ title: "Imagem adicionada!" });
                              };
                              input.click();
                            }}
                          >
                            <Plus className="h-5 w-5" />
                            <span className="text-[10px] mt-0.5">Foto</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Video URL */}
                    <div className="md:col-span-2">
                      <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> URL do Vídeo (YouTube ou upload)</Label>
                      <div className="flex gap-2 mt-1">
                        <Input value={productForm.video_url} onChange={(e) => setProductForm({ ...productForm, video_url: e.target.value })} placeholder="https://www.youtube.com/watch?v=... ou URL do vídeo" className="flex-1" />
                        <Button variant="outline" type="button" onClick={() => {
                          const input = document.createElement('input');
                          input.type = 'file'; input.accept = 'video/*';
                          input.onchange = async (e: any) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            if (file.size > 50 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 50MB", variant: "destructive" }); return; }
                            setUploading(true);
                            const ext = file.name.split('.').pop();
                            const fileName = `video-${Date.now()}.${ext}`;
                            const { error } = await supabase.storage.from("product-images").upload(fileName, file);
                            if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); setUploading(false); return; }
                            const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
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

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
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
                      <tr key={p.id} className="hover:bg-muted/30 transition-colors">
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
                    {filteredProducts.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ORDERS TAB */}
        {tab === "orders" && (
          <div>
            <div className="mb-6">
              <h1 className="font-heading text-3xl font-bold">Pedidos</h1>
              <p className="text-muted-foreground text-sm mt-1">{filteredOrders.length} de {orders.length} pedidos</p>
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

            <div className="space-y-3">
              {filteredOrders.map((o) => (
                <div key={o.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
                  <div className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors" onClick={() => loadOrderItems(o.id)}>
                    <div className="flex items-center gap-4">
                      <div className="bg-muted rounded-lg p-2.5"><ShoppingCart className="h-5 w-5 text-muted-foreground" /></div>
                      <div>
                        <p className="font-heading font-bold">Pedido #{o.id.slice(0, 8)}</p>
                        <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" })}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <Button variant="outline" size="sm" className="gap-1.5" onClick={(e) => { e.stopPropagation(); printOrder(o); }}>
                        <Printer className="h-3.5 w-3.5" /> Imprimir
                      </Button>
                      <span className={`text-xs px-3 py-1 rounded-full font-semibold ${statusColor[o.status] || ""}`}>{statusLabel[o.status] || o.status}</span>
                      <p className="font-heading font-bold text-price">R$ {Number(o.total_amount).toFixed(2).replace(".", ",")}</p>
                      <select value={o.status} onClick={(e) => e.stopPropagation()} onChange={(e) => updateOrderStatus(o.id, e.target.value)} className="border border-input rounded-md px-2 py-1.5 text-xs bg-background">
                        {Object.entries(statusLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                      </select>
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
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="font-heading text-3xl font-bold">Categorias & Subcategorias</h1>
                <p className="text-muted-foreground text-sm mt-1">{categories.length} categorias, {subcategories.length} subcategorias</p>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => { setEditingSubcategory({}); setSubForm({ name: "", slug: "", description: "", category_id: "" }); }}>
                  <FolderTree className="h-4 w-4 mr-2" /> Nova Subcategoria
                </Button>
                <Button onClick={() => { setEditingCategory({}); setCategoryForm({ name: "", slug: "", description: "", image_url: "" }); }} className="shadow-md">
                  <Plus className="h-4 w-4 mr-2" /> Nova Categoria
                </Button>
              </div>
            </div>

            {editingCategory !== null && (
              <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
                <h3 className="font-heading text-lg font-bold mb-4">{editingCategory.id ? "Editar" : "Nova"} Categoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div><Label>Nome *</Label><Input value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} /></div>
                  <div><Label>Slug</Label><Input value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} /></div>
                  <div><Label>URL da Imagem</Label><Input value={categoryForm.image_url} onChange={(e) => setCategoryForm({ ...categoryForm, image_url: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Input value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button onClick={saveCategory}>Salvar Categoria</Button>
                  <Button variant="outline" onClick={() => setEditingCategory(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            {editingSubcategory !== null && (
              <div className="bg-card rounded-xl shadow-lg border border-primary/20 p-6 mb-6">
                <h3 className="font-heading text-lg font-bold mb-4 flex items-center gap-2"><FolderTree className="h-5 w-5 text-primary" />{editingSubcategory.id ? "Editar" : "Nova"} Subcategoria</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label>Categoria Pai *</Label>
                    <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={subForm.category_id} onChange={(e) => setSubForm({ ...subForm, category_id: e.target.value })}>
                      <option value="">Selecione a categoria</option>
                      {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div><Label>Nome *</Label><Input value={subForm.name} onChange={(e) => setSubForm({ ...subForm, name: e.target.value, slug: e.target.value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '') })} /></div>
                  <div><Label>Slug</Label><Input value={subForm.slug} onChange={(e) => setSubForm({ ...subForm, slug: e.target.value })} /></div>
                  <div><Label>Descrição</Label><Input value={subForm.description} onChange={(e) => setSubForm({ ...subForm, description: e.target.value })} /></div>
                </div>
                <div className="flex gap-3 mt-5">
                  <Button onClick={saveSubcategory}>Salvar Subcategoria</Button>
                  <Button variant="outline" onClick={() => setEditingSubcategory(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {categories.map(c => (
                <div key={c.id} className="bg-card rounded-xl shadow-sm border border-border overflow-hidden hover:shadow-md transition-shadow">
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-heading font-bold text-lg">{c.name}</h3>
                        <p className="text-xs text-muted-foreground mt-1 font-mono">/{c.slug}</p>
                        {c.description && <p className="text-sm text-muted-foreground mt-2">{c.description}</p>}
                      </div>
                      <div className="flex gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setEditingCategory(c); setCategoryForm({ name: c.name, slug: c.slug, description: c.description || "", image_url: c.image_url || "" }); }}><Edit className="h-4 w-4" /></Button>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteCategory(c.id)}><Trash2 className="h-4 w-4" /></Button>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 flex-wrap">
                      <Badge variant="outline">{products.filter(p => p.category_id === c.id).length} produtos</Badge>
                      <Badge variant="secondary">{getCatSubcats(c.id).length} subcategorias</Badge>
                    </div>
                  </div>

                  {getCatSubcats(c.id).length > 0 && (
                    <div className="border-t border-border bg-muted/30">
                      <button
                        className="w-full flex items-center justify-between px-5 py-2.5 text-xs font-semibold text-muted-foreground hover:text-foreground transition-colors"
                        onClick={() => setExpandedCat(expandedCat === c.id ? null : c.id)}
                      >
                        <span className="flex items-center gap-1.5"><FolderTree className="h-3.5 w-3.5" /> Subcategorias</span>
                        {expandedCat === c.id ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
                      </button>
                      {expandedCat === c.id && (
                        <div className="px-4 pb-3 space-y-1.5">
                          {getCatSubcats(c.id).map(sub => (
                            <div key={sub.id} className="flex items-center justify-between bg-background rounded-lg px-3 py-2 border border-border">
                              <div>
                                <span className="text-sm font-medium">{sub.name}</span>
                                <span className="text-xs text-muted-foreground ml-2">/{sub.slug}</span>
                              </div>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => { setEditingSubcategory(sub); setSubForm({ name: sub.name, slug: sub.slug, description: sub.description || "", category_id: sub.category_id }); }}><Edit className="h-3 w-3" /></Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => deleteSubcategory(sub.id)}><Trash2 className="h-3 w-3" /></Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                  {getCatSubcats(c.id).length === 0 && (
                    <div className="border-t border-border px-5 py-2.5">
                      <button className="text-xs text-primary hover:underline flex items-center gap-1" onClick={() => { setEditingSubcategory({}); setSubForm({ name: "", slug: "", description: "", category_id: c.id }); }}>
                        <Plus className="h-3 w-3" /> Adicionar subcategoria
                      </button>
                    </div>
                  )}
                </div>
              ))}
              {categories.length === 0 && <p className="text-muted-foreground col-span-3 text-center py-12">Nenhuma categoria cadastrada.</p>}
            </div>
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
              <Button onClick={() => { setEditingClient({}); resetClientForm(); }} className="shadow-md">
                <Plus className="h-4 w-4 mr-2" /> Novo Cliente
              </Button>
            </div>

            {/* Client Edit Form */}
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

            {/* Client Filters */}
            <div className="bg-card rounded-xl border border-border p-4 mb-4">
              <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground">
                <Search className="h-4 w-4" /> Busca
              </div>
              <div className="flex flex-wrap gap-3">
                <div className="relative flex-1 min-w-[250px]">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Buscar por nome, email, telefone ou CPF/CNPJ..." value={clientSearch} onChange={(e) => setClientSearch(e.target.value)} />
                </div>
                {clientSearch && (
                  <Button variant="ghost" size="sm" onClick={() => setClientSearch("")}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>

            <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50 border-b border-border">
                    <tr>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Nome</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Email</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Telefone</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">CPF/CNPJ</th>
                      <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Cidade/UF</th>
                      <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredClients.map(c => (
                      <tr key={c.user_id} className="hover:bg-muted/30 transition-colors">
                        <td className="p-3.5">
                          <div className="flex items-center gap-3">
                            <div className="h-9 w-9 rounded-full bg-primary/10 flex items-center justify-center">
                              <Users className="h-4 w-4 text-primary" />
                            </div>
                            <div>
                              <span className="font-medium block">{c.full_name || "—"}</span>
                              {c.company_name && <span className="text-[10px] text-muted-foreground">{c.company_name}</span>}
                            </div>
                          </div>
                        </td>
                        <td className="p-3.5 text-muted-foreground">{c.email}</td>
                        <td className="p-3.5 text-muted-foreground">{c.phone || "—"}</td>
                        <td className="p-3.5 text-muted-foreground font-mono text-xs">{c.cpf_cnpj || "—"}</td>
                        <td className="p-3.5 text-muted-foreground">{[c.city, c.state].filter(Boolean).join("/") || "—"}</td>
                        <td className="p-3.5">
                          <div className="flex items-center justify-end gap-1">
                            <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => editClient(c)}><Edit className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => deleteClient(c.user_id)}><Trash2 className="h-4 w-4" /></Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                    {filteredClients.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-muted-foreground">Nenhum cliente encontrado.</td></tr>}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
