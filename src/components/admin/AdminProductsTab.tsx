import React, { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Plus, Trash2, RefreshCw, Wand2, Loader2, FileUp, Download, ImageIcon, X } from "lucide-react";
import ProductForm, { emptyProductForm, productToFormState, type ProductFormState } from "@/components/admin/ProductForm";
import ProductFilters from "@/components/admin/ProductFilters";
import ProductTable from "@/components/admin/ProductTable";
import { useMenuCategories } from "@/hooks/useMenuCategories";
import type { Product, ResellerOption, ProfileFull } from "@/types/admin";

interface AdminProductsTabProps {
  products: Product[];
  categories: any[]; // kept for backward compat but not used
  subcategories: any[];
  resellers: ResellerOption[];
  clients: ProfileFull[];
  productCategoryLinks: any[];
  onReload: () => void;
}

const AdminProductsTab = ({ products, categories, subcategories, resellers, clients, productCategoryLinks, onReload }: AdminProductsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { tree, categories: menuCategories } = useMenuCategories(true);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productForm, setProductForm] = useState<ProductFormState>(emptyProductForm);
  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [syncing, setSyncing] = useState(false);
  const [generatingAIImages, setGeneratingAIImages] = useState(false);
  const [aiImageProgress, setAiImageProgress] = useState(0);
  const [aiImageTotal, setAiImageTotal] = useState(0);

  // Get all descendant IDs for a menu category (for filtering)
  const getDescendantIds = (id: string): string[] => {
    const ids: string[] = [id];
    const children = menuCategories.filter(c => c.parent_id === id);
    children.forEach(child => ids.push(...getDescendantIds(child.id)));
    return ids;
  };

  const filteredProducts = products.filter(p => {
    if (productSearch && !p.name.toLowerCase().includes(productSearch.toLowerCase()) && !(p.sku || "").toLowerCase().includes(productSearch.toLowerCase())) return false;
    if (productCatFilter) {
      const allIds = getDescendantIds(productCatFilter);
      if (!allIds.includes(p.menu_category_id || "")) return false;
    }
    if (productStatusFilter === "active" && !p.is_active) return false;
    if (productStatusFilter === "inactive" && p.is_active) return false;
    if (productStatusFilter === "featured" && !p.is_featured) return false;
    if (productStatusFilter === "no-image" && p.image_url) return false;
    if (productStockFilter === "out" && p.stock_quantity > 0) return false;
    if (productStockFilter === "low" && (p.stock_quantity === 0 || p.stock_quantity > 5)) return false;
    if (productStockFilter === "ok" && p.stock_quantity <= 5) return false;
    return true;
  });

  const saveProduct = async () => {
    const data: any = {
      name: productForm.name, description: productForm.description || null,
      sku: productForm.sku || null, price: parseFloat(productForm.price) || 0,
      original_price: productForm.original_price ? parseFloat(productForm.original_price) : null,
      stock_quantity: parseInt(productForm.stock_quantity) || 0,
      category_id: null, subcategory_id: null, // clear old fields
      is_featured: productForm.is_featured, is_active: productForm.is_active, free_shipping: productForm.free_shipping,
      image_url: productForm.image_url || null, additional_images: productForm.additional_images.filter(Boolean),
      video_url: productForm.video_url || null, brand: productForm.brand || null, hp: productForm.hp || null,
      engine_model: productForm.engine_model || null,
      specifications: productForm.specifications ? (() => { try { return JSON.parse(productForm.specifications); } catch { return null; } })() : null,
      documents: productForm.documents.filter(Boolean),
      weight_kg: productForm.weight_kg ? parseFloat(productForm.weight_kg) : null,
      width_cm: productForm.width_cm ? parseFloat(productForm.width_cm) : null,
      height_cm: productForm.height_cm ? parseFloat(productForm.height_cm) : null,
      length_cm: productForm.length_cm ? parseFloat(productForm.length_cm) : null,
      menu_category_id: productForm.menu_category_id || null,
      reseller_id: productForm.reseller_id || null,
      fuel_type: productForm.fuel_type || null,
      slug: productForm.slug || null,
      tags: productForm.tags ? productForm.tags.split(",").map(t => t.trim().toLowerCase()).filter(Boolean) : [],
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

    // Save ALL menu category links (junction table)
    await supabase.from("product_menu_categories" as any).delete().eq("product_id", productId);
    const allMenuCatIds = [productForm.menu_category_id, ...(productForm.menu_category_ids || [])]
      .filter(Boolean)
      .filter(id => id !== productForm.menu_category_id || productForm.menu_category_ids.length > 0);
    // Include ALL selected categories in junction (including primary for search consistency)
    const uniqueIds = [...new Set([productForm.menu_category_id, ...(productForm.menu_category_ids || [])].filter(Boolean))];
    const menuCatLinks = uniqueIds.map(id => ({ product_id: productId!, menu_category_id: id }));
    if (menuCatLinks.length > 0) await supabase.from("product_menu_categories" as any).insert(menuCatLinks);

    // Save reseller pricing
    if (productForm.reseller_id && productId) {
      const resellerPrice = productForm.reseller_price ? parseFloat(productForm.reseller_price) : null;
      const commissionPct = productForm.store_commission_pct ? parseFloat(productForm.store_commission_pct) : null;
      const stockQuantity = parseInt(productForm.stock_quantity) || 0;
      const salePrice = parseFloat(productForm.price) || null;
      const { data: existing } = await supabase.from("product_resellers")
        .select("id").eq("product_id", productId).eq("reseller_id", productForm.reseller_id).maybeSingle();
      if (existing) {
        await supabase.from("product_resellers").update({
          reseller_price: resellerPrice, store_commission_pct: commissionPct,
          custom_price: salePrice, stock_quantity: stockQuantity, is_active: productForm.is_active,
        } as any).eq("id", existing.id);
      } else {
        await supabase.from("product_resellers").insert({
          product_id: productId, reseller_id: productForm.reseller_id,
          reseller_price: resellerPrice, store_commission_pct: commissionPct,
          custom_price: salePrice, stock_quantity: stockQuantity, is_active: productForm.is_active,
        } as any);
      }
    }

    setEditingProduct(null); setProductForm(emptyProductForm); onReload();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: "Produto excluído!" }); onReload();
  };

  const bulkDeleteProducts = async () => {
    if (selectedProducts.size === 0) return;
    if (!confirm(`Excluir ${selectedProducts.size} produtos selecionados?`)) return;
    const ids = Array.from(selectedProducts);
    const { error } = await supabase.from("products").delete().in("id", ids);
    if (error) { toast({ title: "Erro", description: error.message, variant: "destructive" }); return; }
    toast({ title: `${ids.length} produtos excluídos!` });
    setSelectedProducts(new Set()); onReload();
  };

  const editProduct = async (p: Product) => {
    setEditingProduct(p);
    const formState = productToFormState(p);

    // Load ALL menu category links
    const { data: menuCatLinks } = await supabase.from("product_menu_categories" as any).select("menu_category_id").eq("product_id", p.id);
    const linkedIds = (menuCatLinks || []).map((l: any) => l.menu_category_id) as string[];
    // Primary is menu_category_id, additional are the rest
    formState.menu_category_ids = linkedIds.filter(id => id !== p.menu_category_id);

    // Load reseller pricing
    if (p.reseller_id) {
      const { data: pr } = await supabase.from("product_resellers")
        .select("reseller_price, store_commission_pct")
        .eq("product_id", p.id).eq("reseller_id", p.reseller_id).maybeSingle();
      if (pr) {
        formState.reseller_price = pr.reseller_price ? String(pr.reseller_price) : "";
        formState.store_commission_pct = pr.store_commission_pct ? String(pr.store_commission_pct) : "";
      }
    }
    setProductForm(formState);
  };

  const syncMercadoLivre = async () => {
    setSyncing(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { toast({ title: "Erro", description: "Sessão expirada", variant: "destructive" }); return; }
      const { data, error } = await supabase.functions.invoke('sync-mercadolivre', { headers: { Authorization: `Bearer ${session.access_token}` } });
      if (error) throw error;
      toast({ title: "Sincronização concluída!", description: `${data?.synced || 0} produtos sincronizados.` });
      onReload();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally { setSyncing(false); }
  };

  const generateAIImagesForProducts = async () => {
    const productsWithoutImage = products.filter(p => !p.image_url && p.is_active);
    if (productsWithoutImage.length === 0) { toast({ title: "Todos os produtos ativos já possuem imagem" }); return; }
    if (!confirm(`Gerar imagens com IA para ${productsWithoutImage.length} produtos sem imagem?`)) return;
    setGeneratingAIImages(true); setAiImageTotal(productsWithoutImage.length); setAiImageProgress(0);
    let generated = 0;
    for (let i = 0; i < productsWithoutImage.length; i++) {
      const p = productsWithoutImage[i];
      try {
        const { data, error } = await supabase.functions.invoke("generate-product-image", { body: { productName: p.name, imageDescription: p.description, sku: p.sku } });
        if (!error && data?.imageUrl) { await supabase.from("products").update({ image_url: data.imageUrl }).eq("id", p.id); generated++; }
      } catch (err) { console.error("AI image error for", p.name, err); }
      setAiImageProgress(i + 1);
      await new Promise(r => setTimeout(r, 2000));
    }
    setGeneratingAIImages(false);
    toast({ title: `${generated} imagens geradas por IA!` }); onReload();
  };

  const toggleProductSelect = (id: string) => {
    setSelectedProducts(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };
  const toggleAllProducts = () => {
    if (selectedProducts.size === filteredProducts.length) setSelectedProducts(new Set());
    else setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
  };

  const noImageCount = products.filter(p => !p.image_url && p.is_active).length;

  // Build menu category options for filter
  const menuCatOptions = menuCategories
    .filter(c => !c.parent_id && c.is_active)
    .sort((a, b) => a.display_order - b.display_order || a.name.localeCompare(b.name));

  return (
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
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? 'animate-spin' : ''}`} /> {syncing ? "Sincronizando..." : "Sincronizar ML"}
          </Button>
          <Button onClick={() => { setEditingProduct({}); setProductForm(emptyProductForm); }} className="shadow-md">
            <Plus className="h-4 w-4 mr-2" /> Novo Produto
          </Button>
        </div>
      </div>

      {editingProduct !== null && (
        <ProductForm
          editingProduct={editingProduct}
          form={productForm}
          setForm={setProductForm}
          resellers={resellers}
          clients={clients}
          onSave={saveProduct}
          onCancel={() => setEditingProduct(null)}
        />
      )}

      <ProductFilters
        search={productSearch} onSearchChange={setProductSearch}
        catFilter={productCatFilter} onCatFilterChange={setProductCatFilter}
        statusFilter={productStatusFilter} onStatusFilterChange={setProductStatusFilter}
        stockFilter={productStockFilter} onStockFilterChange={setProductStockFilter}
        menuCategories={menuCatOptions}
        onClear={() => { setProductSearch(""); setProductCatFilter(""); setProductStatusFilter(""); setProductStockFilter(""); }}
      />

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
            <Button variant="secondary" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}><Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens IA ({noImageCount})</Button>
            <Button variant="destructive" size="sm" onClick={bulkDeleteProducts}><Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionados</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts(new Set())}><X className="h-4 w-4 mr-1" /> Desselecionar</Button>
          </div>
        </div>
      )}

      {selectedProducts.size === 0 && !generatingAIImages && noImageCount > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground"><ImageIcon className="h-4 w-4 inline mr-1" /> {noImageCount} produtos sem imagem</span>
          <Button variant="outline" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}><Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens com IA</Button>
        </div>
      )}

      <ProductTable
        products={filteredProducts}
        categories={categories}
        subcategories={subcategories}
        selectedProducts={selectedProducts}
        onToggleSelect={toggleProductSelect}
        onToggleAll={toggleAllProducts}
        onEdit={editProduct}
        onDelete={deleteProduct}
      />
    </div>
  );
};

export default AdminProductsTab;
