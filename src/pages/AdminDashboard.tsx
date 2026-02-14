import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { LayoutDashboard, Package, ShoppingCart, Users, LogOut, Plus, Trash2, Edit, Tag } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  is_featured: boolean;
  category_id: string | null;
}

interface Order {
  id: string;
  user_id: string;
  status: string;
  total_amount: number;
  created_at: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const AdminDashboard = () => {
  const { signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [tab, setTab] = useState<"dashboard" | "products" | "orders" | "categories">("dashboard");
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [stats, setStats] = useState({ totalProducts: 0, totalOrders: 0, revenue: 0, pendingOrders: 0 });

  // Product form
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productForm, setProductForm] = useState({ name: "", price: "", stock_quantity: "", category_id: "", is_featured: false });

  useEffect(() => {
    loadAll();
  }, []);

  const loadAll = async () => {
    const [prodRes, ordRes, catRes] = await Promise.all([
      supabase.from("products").select("*").order("created_at", { ascending: false }),
      supabase.from("orders").select("*").order("created_at", { ascending: false }),
      supabase.from("categories").select("*").order("name"),
    ]);
    const prods = (prodRes.data || []) as Product[];
    const ords = (ordRes.data || []) as Order[];
    const cats = (catRes.data || []) as Category[];
    setProducts(prods);
    setOrders(ords);
    setCategories(cats);
    setStats({
      totalProducts: prods.length,
      totalOrders: ords.length,
      revenue: ords.reduce((s, o) => s + Number(o.total_amount), 0),
      pendingOrders: ords.filter((o) => o.status === "pending").length,
    });
  };

  const saveProduct = async () => {
    const data = {
      name: productForm.name,
      price: parseFloat(productForm.price) || 0,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      category_id: productForm.category_id || null,
      is_featured: productForm.is_featured,
    };

    if (editingProduct?.id) {
      const { error } = await supabase.from("products").update(data).eq("id", editingProduct.id);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Produto atualizado!" });
    } else {
      const { error } = await supabase.from("products").insert(data);
      if (error) toast({ title: "Erro", description: error.message, variant: "destructive" });
      else toast({ title: "Produto criado!" });
    }
    setEditingProduct(null);
    setProductForm({ name: "", price: "", stock_quantity: "", category_id: "", is_featured: false });
    loadAll();
  };

  const deleteProduct = async (id: string) => {
    await supabase.from("products").delete().eq("id", id);
    loadAll();
  };

  const updateOrderStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status: status as any }).eq("id", id);
    loadAll();
  };

  const editProduct = (p: Product) => {
    setEditingProduct(p);
    setProductForm({
      name: p.name,
      price: String(p.price),
      stock_quantity: String(p.stock_quantity),
      category_id: p.category_id || "",
      is_featured: p.is_featured,
    });
    setTab("products");
  };

  const statusLabel: Record<string, string> = {
    pending: "Pendente", confirmed: "Confirmado", processing: "Processando",
    shipped: "Enviado", delivered: "Entregue", cancelled: "Cancelado",
  };

  const sideItems = [
    { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
    { key: "products", label: "Produtos", icon: Package },
    { key: "orders", label: "Pedidos", icon: ShoppingCart },
    { key: "categories", label: "Categorias", icon: Tag },
  ] as const;

  return (
    <div className="min-h-screen flex bg-muted">
      {/* Sidebar */}
      <aside className="w-64 bg-foreground text-background min-h-screen p-4 space-y-2">
        <h2 className="font-heading text-lg font-bold text-primary mb-6">Admin Panel</h2>
        {sideItems.map((item) => (
          <button key={item.key} onClick={() => setTab(item.key)} className={`w-full flex items-center gap-2 px-3 py-2 rounded text-sm ${tab === item.key ? "bg-primary text-primary-foreground" : "text-background/70 hover:text-background"}`}>
            <item.icon className="h-4 w-4" /> {item.label}
          </button>
        ))}
        <hr className="border-background/20 my-4" />
        <button onClick={() => navigate("/")} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-background/70 hover:text-background">
          <ShoppingCart className="h-4 w-4" /> Ver Loja
        </button>
        <button onClick={signOut} className="w-full flex items-center gap-2 px-3 py-2 rounded text-sm text-destructive hover:opacity-80">
          <LogOut className="h-4 w-4" /> Sair
        </button>
      </aside>

      {/* Main content */}
      <main className="flex-1 p-8">
        {tab === "dashboard" && (
          <div>
            <h1 className="font-heading text-3xl font-bold mb-6">Dashboard</h1>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
              {[
                { label: "Produtos", value: stats.totalProducts, icon: Package },
                { label: "Pedidos", value: stats.totalOrders, icon: ShoppingCart },
                { label: "Receita", value: `R$ ${stats.revenue.toFixed(2)}`, icon: LayoutDashboard },
                { label: "Pendentes", value: stats.pendingOrders, icon: Users },
              ].map((s) => (
                <div key={s.label} className="bg-background rounded-lg shadow p-6">
                  <div className="flex items-center gap-3">
                    <s.icon className="h-8 w-8 text-primary" />
                    <div>
                      <p className="text-sm text-muted-foreground">{s.label}</p>
                      <p className="text-2xl font-heading font-bold">{s.value}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <h2 className="font-heading text-xl font-bold mb-3">Últimos Pedidos</h2>
            <div className="bg-background rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Pedido</th>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 5).map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3">#{o.id.slice(0, 8)}</td>
                      <td className="p-3">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 text-price font-bold">R$ {Number(o.total_amount).toFixed(2)}</td>
                      <td className="p-3">{statusLabel[o.status] || o.status}</td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={4} className="p-3 text-center text-muted-foreground">Nenhum pedido ainda.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "products" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h1 className="font-heading text-3xl font-bold">Produtos</h1>
              <Button onClick={() => { setEditingProduct({}); setProductForm({ name: "", price: "", stock_quantity: "", category_id: "", is_featured: false }); }}>
                <Plus className="h-4 w-4 mr-2" /> Novo Produto
              </Button>
            </div>

            {editingProduct !== null && (
              <div className="bg-background rounded-lg shadow p-6 mb-6">
                <h3 className="font-heading text-lg font-bold mb-4">{editingProduct.id ? "Editar" : "Novo"} Produto</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div><Label>Nome</Label><Input value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} /></div>
                  <div><Label>Preço</Label><Input type="number" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} /></div>
                  <div><Label>Estoque</Label><Input type="number" value={productForm.stock_quantity} onChange={(e) => setProductForm({ ...productForm, stock_quantity: e.target.value })} /></div>
                  <div>
                    <Label>Categoria</Label>
                    <select className="w-full border border-input rounded-md px-3 py-2 text-sm" value={productForm.category_id} onChange={(e) => setProductForm({ ...productForm, category_id: e.target.value })}>
                      <option value="">Selecione</option>
                      {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                    </select>
                  </div>
                  <div className="flex items-end gap-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input type="checkbox" checked={productForm.is_featured} onChange={(e) => setProductForm({ ...productForm, is_featured: e.target.checked })} />
                      Destaque
                    </label>
                  </div>
                </div>
                <div className="flex gap-2 mt-4">
                  <Button onClick={saveProduct}>Salvar</Button>
                  <Button variant="outline" onClick={() => setEditingProduct(null)}>Cancelar</Button>
                </div>
              </div>
            )}

            <div className="bg-background rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Preço</th>
                    <th className="text-left p-3">Estoque</th>
                    <th className="text-left p-3">Destaque</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {products.map((p) => (
                    <tr key={p.id} className="border-t border-border">
                      <td className="p-3">{p.name}</td>
                      <td className="p-3">R$ {Number(p.price).toFixed(2)}</td>
                      <td className="p-3">{p.stock_quantity}</td>
                      <td className="p-3">{p.is_featured ? "✓" : ""}</td>
                      <td className="p-3 flex gap-2">
                        <button onClick={() => editProduct(p)} className="text-primary hover:opacity-70"><Edit className="h-4 w-4" /></button>
                        <button onClick={() => deleteProduct(p.id)} className="text-destructive hover:opacity-70"><Trash2 className="h-4 w-4" /></button>
                      </td>
                    </tr>
                  ))}
                  {products.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">Nenhum produto cadastrado.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "orders" && (
          <div>
            <h1 className="font-heading text-3xl font-bold mb-6">Pedidos</h1>
            <div className="bg-background rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Pedido</th>
                    <th className="text-left p-3">Data</th>
                    <th className="text-left p-3">Valor</th>
                    <th className="text-left p-3">Status</th>
                    <th className="text-left p-3">Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.map((o) => (
                    <tr key={o.id} className="border-t border-border">
                      <td className="p-3">#{o.id.slice(0, 8)}</td>
                      <td className="p-3">{new Date(o.created_at).toLocaleDateString("pt-BR")}</td>
                      <td className="p-3 font-bold text-price">R$ {Number(o.total_amount).toFixed(2)}</td>
                      <td className="p-3">{statusLabel[o.status] || o.status}</td>
                      <td className="p-3">
                        <select
                          value={o.status}
                          onChange={(e) => updateOrderStatus(o.id, e.target.value as string)}
                          className="border border-input rounded px-2 py-1 text-xs"
                        >
                          {Object.entries(statusLabel).map(([k, v]) => (
                            <option key={k} value={k}>{v}</option>
                          ))}
                        </select>
                      </td>
                    </tr>
                  ))}
                  {orders.length === 0 && <tr><td colSpan={5} className="p-3 text-center text-muted-foreground">Nenhum pedido.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "categories" && (
          <div>
            <h1 className="font-heading text-3xl font-bold mb-6">Categorias</h1>
            <div className="bg-background rounded-lg shadow overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-muted">
                  <tr>
                    <th className="text-left p-3">Nome</th>
                    <th className="text-left p-3">Slug</th>
                  </tr>
                </thead>
                <tbody>
                  {categories.map((c) => (
                    <tr key={c.id} className="border-t border-border">
                      <td className="p-3">{c.name}</td>
                      <td className="p-3 text-muted-foreground">{c.slug}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
