import React, { useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Plus, Trash2, Edit, Eye, EyeOff, Search, X, Upload, ImageIcon,
  SlidersHorizontal, RefreshCw, Video, Download, CheckSquare, Square,
  Wand2, Loader2, FileUp, Package, Store,
} from "lucide-react";
import MenuCategoryPicker from "@/components/MenuCategoryPicker";
import type { Product, Category, Subcategory, ResellerOption, ProductCategoryLink, ProfileFull } from "@/types/admin";
import { generateSlug, exportCSV } from "@/types/admin";

interface AdminProductsTabProps {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  resellers: ResellerOption[];
  clients: ProfileFull[];
  productCategoryLinks: ProductCategoryLink[];
  onReload: () => void;
}

const AdminProductsTab = ({ products, categories, subcategories, resellers, clients, productCategoryLinks, onReload }: AdminProductsTabProps) => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [productForm, setProductForm] = useState({
    name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "",
    category_id: "", subcategory_id: "", is_featured: false, is_active: true, free_shipping: false, image_url: "",
    additional_images: [] as string[], video_url: "", brand: "", hp: "", engine_model: "",
    specifications: "" as string, documents: [] as string[],
    weight_kg: "", width_cm: "", height_cm: "", length_cm: "",
    extra_category_ids: [] as string[], menu_category_id: "", reseller_id: "",
    fuel_type: "", slug: "",
  });

  const [productSearch, setProductSearch] = useState("");
  const [productCatFilter, setProductCatFilter] = useState("");
  const [productStatusFilter, setProductStatusFilter] = useState("");
  const [productStockFilter, setProductStockFilter] = useState("");
  const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
  const [uploading, setUploading] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [generatingAIImages, setGeneratingAIImages] = useState(false);
  const [aiImageProgress, setAiImageProgress] = useState(0);
  const [aiImageTotal, setAiImageTotal] = useState(0);

  const resetProductForm = () => setProductForm({ name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "", category_id: "", subcategory_id: "", is_featured: false, is_active: true, free_shipping: false, image_url: "", additional_images: [], video_url: "", brand: "", hp: "", engine_model: "", specifications: "", documents: [], weight_kg: "", width_cm: "", height_cm: "", length_cm: "", extra_category_ids: [], menu_category_id: "", reseller_id: "", fuel_type: "", slug: "" });

  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getSubcatName = (id: string | null) => subcategories.find(s => s.id === id)?.name || null;
  const getCatSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

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
      category_id: productForm.category_id || null, subcategory_id: productForm.subcategory_id || null,
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
    await supabase.from("product_categories").delete().eq("product_id", productId);
    const extraLinks = productForm.extra_category_ids.filter(Boolean).map(catId => ({ product_id: productId!, category_id: catId }));
    if (extraLinks.length > 0) await supabase.from("product_categories").insert(extraLinks);
    setEditingProduct(null); resetProductForm(); onReload();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm("Excluir este produto?")) return;
    await supabase.from("products").delete().eq("id", id);
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

  const editProduct = (p: Product) => {
    setEditingProduct(p);
    const linkedCatIds = productCategoryLinks.filter(l => l.product_id === p.id).map(l => l.category_id).filter(cid => cid !== p.category_id);
    setProductForm({
      name: p.name, description: p.description || "", sku: p.sku || "",
      price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
      stock_quantity: String(p.stock_quantity), category_id: p.category_id || "",
      subcategory_id: p.subcategory_id || "", is_featured: p.is_featured, free_shipping: p.free_shipping || false,
      is_active: p.is_active, image_url: p.image_url || "",
      additional_images: (p.additional_images || []) as string[],
      video_url: (p.video_url || "") as string,
      brand: p.brand || "", hp: p.hp || "", engine_model: p.engine_model || "",
      specifications: p.specifications ? JSON.stringify(p.specifications, null, 2) : "",
      documents: (p.documents || []) as string[],
      weight_kg: p.weight_kg ? String(p.weight_kg) : "",
      width_cm: p.width_cm ? String(p.width_cm) : "",
      height_cm: p.height_cm ? String(p.height_cm) : "",
      length_cm: p.length_cm ? String(p.length_cm) : "",
      extra_category_ids: linkedCatIds,
      menu_category_id: p.menu_category_id || "",
      reseller_id: p.reseller_id || "",
      fuel_type: p.fuel_type || "",
      slug: p.slug || "",
    });
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
      toast({ title: "Sincronização concluída!", description: `${data?.synced || 0} produtos sincronizados.` });
      onReload();
    } catch (err: any) {
      toast({ title: "Erro na sincronização", description: err.message || "Erro desconhecido", variant: "destructive" });
    } finally {
      setSyncing(false);
    }
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
              <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[200px] flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
                {productForm.image_url ? (
                  <div className="relative w-full">
                    <img src={productForm.image_url} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                    <button onClick={(e) => { e.stopPropagation(); setProductForm(prev => ({ ...prev, image_url: "" })); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-80"><X className="h-3 w-3" /></button>
                  </div>
                ) : (
                  <>
                    <div className="bg-muted rounded-full p-4 mb-3">{uploading ? <Upload className="h-8 w-8 text-primary animate-bounce" /> : <ImageIcon className="h-8 w-8 text-muted-foreground" />}</div>
                    <p className="text-sm text-muted-foreground">{uploading ? "Enviando..." : "Clique para enviar imagem"}</p>
                    <p className="text-xs text-muted-foreground mt-1">JPG, PNG ou WEBP</p>
                  </>
                )}
              </div>
              <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => { if (e.target.files?.[0]) uploadImage(e.target.files[0]); }} />
              <div className="mt-2"><Input value={productForm.image_url} onChange={(e) => setProductForm({ ...productForm, image_url: e.target.value })} placeholder="Ou cole a URL da imagem..." className="text-xs" /></div>
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
                        <input type="checkbox" checked={productForm.extra_category_ids.includes(c.id)} onChange={(e) => {
                          const ids = e.target.checked ? [...productForm.extra_category_ids, c.id] : productForm.extra_category_ids.filter(id => id !== c.id);
                          setProductForm({ ...productForm, extra_category_ids: ids });
                        }} className="rounded border-input" />
                        {c.name}
                      </label>
                    ))}
                  </div>
                </div>
              )}
              <div className="md:col-span-2">
                <MenuCategoryPicker value={productForm.menu_category_id} onChange={(id) => setProductForm({ ...productForm, menu_category_id: id })} label="Categoria do Menu (Navegação)" />
                <p className="text-xs text-muted-foreground mt-1">Define onde o produto aparece no menu de navegação superior</p>
              </div>
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2"><Store className="h-4 w-4" /> Produto pertence a Revendedor?</Label>
                <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={productForm.reseller_id} onChange={e => setProductForm({ ...productForm, reseller_id: e.target.value })}>
                  <option value="">Não — Produto próprio</option>
                  {resellers.map(r => {
                    const profile = clients.find(c => c.user_id === r.user_id);
                    return <option key={r.id} value={r.id}>Sim — {r.company_name || profile?.full_name || "Revendedor"}</option>;
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
                        <div className="h-20 w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer" onClick={() => {
                          const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                          input.onchange = async (ev: any) => {
                            const file = ev.target.files?.[0]; if (!file) return;
                            const ext = file.name.split('.').pop();
                            const fName = `${Date.now()}-extra-${idx}.${ext}`;
                            const { error } = await supabase.storage.from("product-images").upload(fName, file);
                            if (!error) { const { data } = supabase.storage.from("product-images").getPublicUrl(fName); const imgs = [...productForm.additional_images]; imgs[idx] = data.publicUrl; setProductForm(prev => ({ ...prev, additional_images: imgs })); }
                          };
                          input.click();
                        }}><Plus className="h-4 w-4 text-muted-foreground" /></div>
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
                    const input = document.createElement('input'); input.type = 'file'; input.accept = 'video/*';
                    input.onchange = async (e: any) => {
                      const file = e.target.files?.[0]; if (!file) return;
                      if (file.size > 50 * 1024 * 1024) { toast({ title: "Arquivo muito grande", description: "Máximo 50MB", variant: "destructive" }); return; }
                      setUploading(true);
                      const ext = file.name.split('.').pop(); const fName = `video-${Date.now()}.${ext}`;
                      const { error } = await supabase.storage.from("product-images").upload(fName, file);
                      if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); setUploading(false); return; }
                      const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fName);
                      setProductForm(prev => ({ ...prev, video_url: urlData.publicUrl })); toast({ title: "Vídeo enviado!" }); setUploading(false);
                    };
                    input.click();
                  }}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
                </div>
              </div>
              {/* Brand, HP, Engine Model, Fuel Type */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div><Label>Marca</Label><Input value={productForm.brand} onChange={e => setProductForm({ ...productForm, brand: e.target.value })} placeholder="Ex: Honda, Branco..." className="mt-1" /></div>
                <div><Label>Potência (HP)</Label><Input value={productForm.hp} onChange={e => setProductForm({ ...productForm, hp: e.target.value })} placeholder="Ex: 5.5, 7, 13..." className="mt-1" /></div>
                <div><Label>Modelo do Motor</Label><Input value={productForm.engine_model} onChange={e => setProductForm({ ...productForm, engine_model: e.target.value })} placeholder="Ex: GX160, GX200..." className="mt-1" /></div>
                <div>
                  <Label>Tipo de Combustível</Label>
                  <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={productForm.fuel_type} onChange={e => setProductForm({ ...productForm, fuel_type: e.target.value })}>
                    <option value="">Selecione...</option>
                    <option value="gasolina">Gasolina</option>
                    <option value="diesel">Diesel</option>
                    <option value="gas">Gás (GLP)</option>
                    <option value="bifuel">Bifuel</option>
                  </select>
                </div>
              </div>
              {/* Slug */}
              <div>
                <Label>URL Amigável (Slug)</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={productForm.slug} onChange={e => setProductForm({ ...productForm, slug: e.target.value })} placeholder="ex: carburador-gerador-6-5hp" className="flex-1 font-mono text-xs" />
                  <Button type="button" variant="outline" size="sm" onClick={() => setProductForm(prev => ({ ...prev, slug: generateSlug(prev.name) }))}>Gerar</Button>
                </div>
                <p className="text-[10px] text-muted-foreground mt-1">URL: /produto/{productForm.slug || "..."}</p>
              </div>
              {/* Weight & Dimensions */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={productForm.weight_kg} onChange={e => setProductForm({ ...productForm, weight_kg: e.target.value })} placeholder="Ex: 2.5" className="mt-1" /></div>
                <div><Label>Largura (cm)</Label><Input type="number" step="0.1" value={productForm.width_cm} onChange={e => setProductForm({ ...productForm, width_cm: e.target.value })} placeholder="Ex: 30" className="mt-1" /></div>
                <div><Label>Altura (cm)</Label><Input type="number" step="0.1" value={productForm.height_cm} onChange={e => setProductForm({ ...productForm, height_cm: e.target.value })} placeholder="Ex: 20" className="mt-1" /></div>
                <div><Label>Comprimento (cm)</Label><Input type="number" step="0.1" value={productForm.length_cm} onChange={e => setProductForm({ ...productForm, length_cm: e.target.value })} placeholder="Ex: 40" className="mt-1" /></div>
              </div>
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Especificações Técnicas (JSON)</Label>
                <Textarea rows={4} value={productForm.specifications} onChange={e => setProductForm({ ...productForm, specifications: e.target.value })} placeholder={'{\n  "Cilindrada": "196cc",\n  "Potência": "6.5 HP"\n}'} className="mt-1 font-mono text-xs" />
              </div>
              {/* Documents */}
              <div className="md:col-span-2">
                <Label className="flex items-center gap-2"><Download className="h-4 w-4" /> Documentos Técnicos (URLs)</Label>
                <div className="space-y-2 mt-1">
                  {Array.from({ length: Math.max(1, productForm.documents.length + 1) }).map((_, idx) => (
                    <div key={idx} className="flex gap-2">
                      <Input value={productForm.documents[idx] || ""} onChange={e => { const docs = [...productForm.documents]; docs[idx] = e.target.value; setProductForm({ ...productForm, documents: docs.filter((d, i) => d || i === idx) }); }} placeholder={`URL do documento ${idx + 1}...`} className="text-xs" />
                      {productForm.documents[idx] && <Button variant="ghost" size="icon" onClick={() => { const docs = productForm.documents.filter((_, i) => i !== idx); setProductForm({ ...productForm, documents: docs }); }}><X className="h-4 w-4 text-destructive" /></Button>}
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
        <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> Filtros</div>
        <div className="flex flex-wrap gap-3">
          <div className="relative flex-1 min-w-[200px]"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" /><Input className="pl-9" placeholder="Buscar por nome ou SKU..." value={productSearch} onChange={(e) => setProductSearch(e.target.value)} /></div>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[160px]" value={productCatFilter} onChange={(e) => setProductCatFilter(e.target.value)}>
            <option value="">Todas as categorias</option>
            {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={productStatusFilter} onChange={(e) => setProductStatusFilter(e.target.value)}>
            <option value="">Todos os status</option>
            <option value="active">Ativos</option><option value="inactive">Inativos</option>
            <option value="featured">Em Destaque</option><option value="no-image">Sem Imagem</option>
          </select>
          <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={productStockFilter} onChange={(e) => setProductStockFilter(e.target.value)}>
            <option value="">Qualquer estoque</option>
            <option value="out">Sem estoque</option><option value="low">Estoque baixo (≤5)</option><option value="ok">Estoque ok</option>
          </select>
          {(productSearch || productCatFilter || productStatusFilter || productStockFilter) && (
            <Button variant="ghost" size="sm" onClick={() => { setProductSearch(""); setProductCatFilter(""); setProductStatusFilter(""); setProductStockFilter(""); }}><X className="h-4 w-4 mr-1" /> Limpar</Button>
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
            <Button variant="secondary" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}><Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens IA ({products.filter(p => !p.image_url && p.is_active).length})</Button>
            <Button variant="destructive" size="sm" onClick={bulkDeleteProducts}><Trash2 className="h-4 w-4 mr-1" /> Excluir Selecionados</Button>
            <Button variant="ghost" size="sm" onClick={() => setSelectedProducts(new Set())}><X className="h-4 w-4 mr-1" /> Desselecionar</Button>
          </div>
        </div>
      )}

      {selectedProducts.size === 0 && !generatingAIImages && products.filter(p => !p.image_url && p.is_active).length > 0 && (
        <div className="bg-card border border-border rounded-xl p-3 mb-4 flex items-center justify-between">
          <span className="text-sm text-muted-foreground"><ImageIcon className="h-4 w-4 inline mr-1" /> {products.filter(p => !p.image_url && p.is_active).length} produtos sem imagem</span>
          <Button variant="outline" size="sm" onClick={generateAIImagesForProducts} disabled={generatingAIImages}><Wand2 className="h-4 w-4 mr-1" /> Gerar Imagens com IA</Button>
        </div>
      )}

      {/* Product table */}
      <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 border-b border-border">
              <tr>
                <th className="p-3.5 w-10"><button onClick={toggleAllProducts} className="text-muted-foreground hover:text-foreground">{selectedProducts.size === filteredProducts.length && filteredProducts.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}</button></th>
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
                  <td className="p-3.5"><button onClick={() => toggleProductSelect(p.id)}>{selectedProducts.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}</button></td>
                  <td className="p-3.5">
                    <div className="flex items-center gap-3">
                      {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
                      <div>
                        <span className="font-medium block">{p.name}</span>
                        {p.is_featured && <span className="text-[10px] text-primary font-semibold">⭐ Destaque</span>}
                        {p.subcategory_id && <span className="text-[10px] text-muted-foreground block">{getSubcatName(p.subcategory_id)}</span>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3.5 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                  <td className="p-3.5"><Badge variant="outline" className="font-normal">{getCategoryName(p.category_id)}</Badge></td>
                  <td className="p-3.5 text-right">
                    {p.original_price && <span className="text-muted-foreground line-through text-xs block">R$ {Number(p.original_price).toFixed(2).replace(".", ",")}</span>}
                    <span className="font-bold text-price">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                  </td>
                  <td className="p-3.5 text-center"><Badge variant={p.stock_quantity === 0 ? "destructive" : p.stock_quantity <= 5 ? "secondary" : "outline"}>{p.stock_quantity}</Badge></td>
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
  );
};

export default AdminProductsTab;
