import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Package, Search, AlertTriangle, RefreshCw, Download, Loader2,
  ArrowUpDown, Save, ExternalLink, TrendingDown, CheckCircle
} from "lucide-react";
import * as XLSX from "xlsx";

interface StockProduct {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock_quantity: number;
  is_active: boolean;
  image_url: string | null;
  category_id: string | null;
  updated_at: string;
}

interface Category {
  id: string;
  name: string;
}

const StockManagement = () => {
  const { toast } = useToast();
  const [products, setProducts] = useState<StockProduct[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [stockFilter, setStockFilter] = useState<"all" | "out" | "low" | "ok">("all");
  const [catFilter, setCatFilter] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "stock" | "price">("stock");
  const [sortAsc, setSortAsc] = useState(true);
  const [editedStocks, setEditedStocks] = useState<Record<string, number>>({});

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("id, name, sku, price, stock_quantity, is_active, image_url, category_id, updated_at").order("stock_quantity", { ascending: true }),
      supabase.from("categories").select("id, name"),
    ]);
    setProducts((prodRes.data || []) as StockProduct[]);
    setCategories((catRes.data || []) as Category[]);
    setLoading(false);
  };

  const getCategoryName = (id: string | null) =>
    categories.find(c => c.id === id)?.name || "—";

  const filtered = products
    .filter(p => {
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
      if (catFilter && p.category_id !== catFilter) return false;
      if (stockFilter === "out" && p.stock_quantity > 0) return false;
      if (stockFilter === "low" && (p.stock_quantity <= 0 || p.stock_quantity > 5)) return false;
      if (stockFilter === "ok" && p.stock_quantity <= 5) return false;
      return true;
    })
    .sort((a, b) => {
      let cmp = 0;
      if (sortBy === "name") cmp = a.name.localeCompare(b.name);
      else if (sortBy === "stock") cmp = a.stock_quantity - b.stock_quantity;
      else cmp = a.price - b.price;
      return sortAsc ? cmp : -cmp;
    });

  const outOfStock = products.filter(p => p.stock_quantity <= 0).length;
  const lowStock = products.filter(p => p.stock_quantity > 0 && p.stock_quantity <= 5).length;

  const handleStockChange = (id: string, value: string) => {
    const num = parseInt(value) || 0;
    setEditedStocks(prev => ({ ...prev, [id]: num }));
  };

  const saveStockChanges = async () => {
    const entries = Object.entries(editedStocks);
    if (entries.length === 0) return;
    setSaving(true);

    for (const [id, qty] of entries) {
      await supabase.from("products").update({ stock_quantity: qty }).eq("id", id);
    }

    toast({ title: "Estoque atualizado", description: `${entries.length} produtos atualizados.` });
    setEditedStocks({});
    await loadData();
    setSaving(false);
  };

  const syncML = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("Sessão expirada");

      const { data, error } = await supabase.functions.invoke("sync-mercadolivre", {
        headers: { Authorization: `Bearer ${session.access_token}` },
      });

      if (error) throw error;
      toast({ title: "Sincronização concluída", description: data.message || `${data.synced} produtos sincronizados.` });
      await loadData();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message, variant: "destructive" });
    } finally {
      setSyncing(false);
    }
  };

  const exportStockReport = () => {
    const rows = products.map(p => ({
      "Produto": p.name,
      "SKU": p.sku || "",
      "Categoria": getCategoryName(p.category_id),
      "Preço": p.price,
      "Estoque": p.stock_quantity,
      "Status": p.stock_quantity <= 0 ? "SEM ESTOQUE" : p.stock_quantity <= 5 ? "BAIXO" : "OK",
      "Ativo": p.is_active ? "Sim" : "Não",
      "Última Atualização": new Date(p.updated_at).toLocaleDateString("pt-BR"),
    }));

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(rows);
    ws["!cols"] = [{ wch: 50 }, { wch: 15 }, { wch: 20 }, { wch: 12 }, { wch: 10 }, { wch: 15 }, { wch: 8 }, { wch: 18 }];
    XLSX.utils.book_append_sheet(wb, ws, "Estoque");
    XLSX.writeFile(wb, `estoque-${new Date().toISOString().split("T")[0]}.xlsx`);
    toast({ title: "Relatório exportado!" });
  };

  const toggleSort = (col: "name" | "stock" | "price") => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  if (loading) return <div className="flex justify-center py-20"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2"><Package className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold">{products.length}</p>
              <p className="text-xs text-muted-foreground">Total Produtos</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-destructive/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-destructive/10 rounded-lg p-2"><AlertTriangle className="h-5 w-5 text-destructive" /></div>
            <div>
              <p className="text-2xl font-bold text-destructive">{outOfStock}</p>
              <p className="text-xs text-muted-foreground">Sem Estoque</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-yellow-500/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-yellow-500/10 rounded-lg p-2"><TrendingDown className="h-5 w-5 text-yellow-600" /></div>
            <div>
              <p className="text-2xl font-bold text-yellow-600">{lowStock}</p>
              <p className="text-xs text-muted-foreground">Estoque Baixo (≤5)</p>
            </div>
          </div>
        </div>
        <div className="bg-card border border-primary/30 rounded-xl p-4">
          <div className="flex items-center gap-3">
            <div className="bg-primary/10 rounded-lg p-2"><CheckCircle className="h-5 w-5 text-primary" /></div>
            <div>
              <p className="text-2xl font-bold text-primary">{products.length - outOfStock - lowStock}</p>
              <p className="text-xs text-muted-foreground">Estoque OK</p>
            </div>
          </div>
        </div>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-wrap items-center gap-3">
        <Button onClick={syncML} disabled={syncing} variant="outline">
          {syncing ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <RefreshCw className="h-4 w-4 mr-2" />}
          Sincronizar Mercado Livre
        </Button>
        <Button onClick={exportStockReport} variant="outline">
          <Download className="h-4 w-4 mr-2" /> Exportar Relatório
        </Button>
        <a href="https://www.mercadolivre.com.br/pagina/grundemann" target="_blank" rel="noopener noreferrer">
          <Button variant="outline" size="sm">
            <ExternalLink className="h-4 w-4 mr-2" /> Loja ML
          </Button>
        </a>
        {Object.keys(editedStocks).length > 0 && (
          <Button onClick={saveStockChanges} disabled={saving}>
            {saving ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
            Salvar Alterações ({Object.keys(editedStocks).length})
          </Button>
        )}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar produto ou SKU..." className="pl-9 h-9" />
        </div>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={stockFilter} onChange={e => setStockFilter(e.target.value as any)}>
          <option value="all">Todo estoque</option>
          <option value="out">Sem estoque</option>
          <option value="low">Estoque baixo</option>
          <option value="ok">Estoque OK</option>
        </select>
        <select className="h-9 rounded-md border border-input bg-background px-3 text-sm" value={catFilter} onChange={e => setCatFilter(e.target.value)}>
          <option value="">Todas categorias</option>
          {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <Badge variant="secondary">{filtered.length} produtos</Badge>
      </div>

      {/* Table */}
      <div className="bg-card rounded-xl shadow border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 w-12"></th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => toggleSort("name")}>
                  <span className="flex items-center gap-1">Produto <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">SKU</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Categoria</th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => toggleSort("price")}>
                  <span className="flex items-center gap-1">Preço <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase cursor-pointer hover:text-foreground" onClick={() => toggleSort("stock")}>
                  <span className="flex items-center gap-1">Estoque <ArrowUpDown className="h-3 w-3" /></span>
                </th>
                <th className="text-left p-3 text-xs font-semibold text-muted-foreground uppercase">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map(p => {
                const edited = editedStocks[p.id];
                const currentQty = edited !== undefined ? edited : p.stock_quantity;
                return (
                  <tr key={p.id} className={`hover:bg-muted/20 transition-colors ${p.stock_quantity <= 0 ? "bg-destructive/5" : p.stock_quantity <= 5 ? "bg-yellow-500/5" : ""}`}>
                    <td className="p-3">
                      {p.image_url ? (
                        <img src={p.image_url} alt="" className="h-8 w-8 rounded object-cover border border-border" />
                      ) : (
                        <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                          <Package className="h-4 w-4 text-muted-foreground" />
                        </div>
                      )}
                    </td>
                    <td className="p-3"><p className="text-sm font-medium line-clamp-1">{p.name}</p></td>
                    <td className="p-3"><span className="text-xs font-mono text-muted-foreground">{p.sku || "—"}</span></td>
                    <td className="p-3"><Badge variant="secondary" className="text-xs">{getCategoryName(p.category_id)}</Badge></td>
                    <td className="p-3"><span className="text-sm">R$ {p.price.toFixed(2).replace(".", ",")}</span></td>
                    <td className="p-3">
                      <Input
                        type="number"
                        min="0"
                        value={currentQty}
                        onChange={e => handleStockChange(p.id, e.target.value)}
                        className={`h-8 w-20 text-center text-sm font-bold ${edited !== undefined ? "border-primary ring-1 ring-primary" : ""}`}
                      />
                    </td>
                    <td className="p-3">
                      {currentQty <= 0 ? (
                        <Badge variant="destructive" className="text-xs">Sem estoque</Badge>
                      ) : currentQty <= 5 ? (
                        <Badge className="bg-yellow-500/20 text-yellow-700 text-xs">Baixo</Badge>
                      ) : (
                        <Badge className="bg-primary/20 text-primary text-xs">OK</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr><td colSpan={7} className="p-10 text-center text-muted-foreground">Nenhum produto encontrado</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StockManagement;
