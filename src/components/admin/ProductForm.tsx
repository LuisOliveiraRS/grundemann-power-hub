import React, { useRef, useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, ImageIcon, Plus, Video, Download, Package, Store, Tag, ChevronDown, ChevronRight } from "lucide-react";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";
import type { Product, ResellerOption, ProfileFull } from "@/types/admin";
import { generateSlug } from "@/types/admin";

export interface ProductFormState {
  name: string; description: string; sku: string; price: string; original_price: string;
  stock_quantity: string; is_featured: boolean;
  is_active: boolean; free_shipping: boolean; image_url: string; additional_images: string[];
  video_url: string; brand: string; hp: string; engine_model: string; specifications: string;
  documents: string[]; weight_kg: string; width_cm: string; height_cm: string; length_cm: string;
  menu_category_id: string; menu_category_ids: string[]; reseller_id: string; fuel_type: string;
  slug: string; tags: string;
  reseller_price: string; store_commission_pct: string;
  storage_location: string;
}

export const emptyProductForm: ProductFormState = {
  name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "",
  is_featured: false, is_active: true, free_shipping: false,
  image_url: "", additional_images: [], video_url: "", brand: "", hp: "", engine_model: "",
  specifications: "", documents: [], weight_kg: "", width_cm: "", height_cm: "", length_cm: "",
  menu_category_id: "", menu_category_ids: [], reseller_id: "", fuel_type: "", slug: "", tags: "",
  reseller_price: "", store_commission_pct: "", storage_location: "",
};

export function productToFormState(p: Product): ProductFormState {
  return {
    name: p.name, description: p.description || "", sku: p.sku || "",
    price: String(p.price), original_price: p.original_price ? String(p.original_price) : "",
    stock_quantity: String(p.stock_quantity),
    is_featured: p.is_featured, free_shipping: p.free_shipping || false,
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
    menu_category_id: p.menu_category_id || "",
    menu_category_ids: [],
    reseller_id: p.reseller_id || "",
    fuel_type: p.fuel_type || "",
    slug: p.slug || "",
    tags: (p.tags || []).join(", "),
    reseller_price: "", store_commission_pct: "",
  };
}

interface ProductFormProps {
  editingProduct: Partial<Product>;
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  resellers: ResellerOption[];
  clients: ProfileFull[];
  onSave: () => void;
  onCancel: () => void;
}

// Multi-select tree for menu categories (unified classification)
const MenuCategoryTree = ({ selected, primaryId, onChange, onPrimaryChange }: {
  selected: string[];
  primaryId: string;
  onChange: (ids: string[]) => void;
  onPrimaryChange: (id: string) => void;
}) => {
  const { tree, loading } = useMenuCategories(true);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");

  // Auto-expand parents of selected items
  useEffect(() => {
    if (tree.length === 0) return;
    const allSelected = [...selected, primaryId].filter(Boolean);
    const newExpanded = new Set(expanded);
    const expandParents = (nodes: MenuCategoryNode[], path: string[]) => {
      for (const node of nodes) {
        const currentPath = [...path, node.id];
        if (allSelected.includes(node.id)) {
          path.forEach(p => newExpanded.add(p));
        }
        if (node.children.length > 0) expandParents(node.children, currentPath);
      }
    };
    expandParents(tree, []);
    setExpanded(newExpanded);
  }, [tree.length, primaryId]);

  const toggleExpand = (id: string) => {
    setExpanded(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  };

  const toggleSelect = (id: string) => {
    if (selected.includes(id)) {
      onChange(selected.filter(x => x !== id));
      if (primaryId === id) onPrimaryChange(selected.find(x => x !== id) || "");
    } else {
      onChange([...selected, id]);
      if (!primaryId) onPrimaryChange(id);
    }
  };

  const setPrimary = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!selected.includes(id)) onChange([...selected, id]);
    onPrimaryChange(id);
  };

  const matchesSearch = (node: MenuCategoryNode): boolean => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    if (node.name.toLowerCase().includes(q)) return true;
    return node.children.some(c => matchesSearch(c));
  };

  const renderNode = (node: MenuCategoryNode): React.ReactNode => {
    if (!matchesSearch(node)) return null;
    const isSelected = selected.includes(node.id);
    const isPrimary = node.id === primaryId;
    const hasChildren = node.children.length > 0;
    const isExpanded = expanded.has(node.id);
    const depth = node.depth;
    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded text-sm hover:bg-muted/50 transition-colors ${isSelected ? 'bg-primary/5' : ''}`}
          style={{ paddingLeft: `${depth * 16 + 8}px` }}
        >
          {hasChildren ? (
            <button type="button" onClick={() => toggleExpand(node.id)} className="p-0.5 shrink-0">
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ) : <span className="w-4.5 shrink-0" />}
          <label className="flex items-center gap-2 cursor-pointer flex-1 min-w-0">
            <input
              type="checkbox"
              checked={isSelected}
              onChange={() => toggleSelect(node.id)}
              className="rounded border-input h-4 w-4 accent-primary"
            />
            <span className={`truncate ${isPrimary ? 'font-semibold text-primary' : ''}`}>
              {node.name}
            </span>
            {depth > 0 && (
              <span className="text-[10px] text-muted-foreground shrink-0">
                nível {depth + 1}
              </span>
            )}
          </label>
          {isSelected && (
            <button
              type="button"
              onClick={(e) => setPrimary(node.id, e)}
              className={`text-[10px] px-1.5 py-0.5 rounded shrink-0 transition-colors ${
                isPrimary
                  ? 'bg-primary text-primary-foreground font-semibold'
                  : 'bg-muted text-muted-foreground hover:bg-primary/20 hover:text-primary'
              }`}
            >
              {isPrimary ? '★ Principal' : 'Tornar principal'}
            </button>
          )}
        </div>
        {hasChildren && isExpanded && node.children.map(c => renderNode(c))}
      </div>
    );
  };

  if (loading) return <p className="text-xs text-muted-foreground p-2">Carregando categorias...</p>;

  const allSelected = selected.length;

  return (
    <div className="space-y-2">
      <Input
        placeholder="🔍 Buscar categoria..."
        value={searchTerm}
        onChange={e => setSearchTerm(e.target.value)}
        className="h-8 text-xs"
      />
      <div className="max-h-56 overflow-y-auto border border-input rounded-md bg-background p-1">
        {tree.map(n => renderNode(n))}
      </div>
      {allSelected > 0 && (
        <p className="text-[11px] text-muted-foreground">
          {allSelected} categoria{allSelected !== 1 ? 's' : ''} selecionada{allSelected !== 1 ? 's' : ''}
          {primaryId && <> · Principal: <strong className="text-primary">{selected.length > 0 ? '✓' : '—'}</strong></>}
        </p>
      )}
    </div>
  );
};

const ProductForm = ({ editingProduct, form, setForm, resellers, clients, onSave, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImage = async (file: File) => {
    setUploading(true);
    const ext = file.name.split('.').pop();
    const fileName = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`;
    const { error } = await supabase.storage.from("product-images").upload(fileName, file);
    if (error) { toast({ title: "Erro no upload", description: error.message, variant: "destructive" }); setUploading(false); return; }
    const { data: urlData } = supabase.storage.from("product-images").getPublicUrl(fileName);
    setForm(prev => ({ ...prev, image_url: urlData.publicUrl }));
    toast({ title: "Imagem enviada!" });
    setUploading(false);
  };

  // All selected category IDs = primary + additional
  const allCategoryIds = [form.menu_category_id, ...form.menu_category_ids].filter(Boolean);
  const uniqueCategoryIds = [...new Set(allCategoryIds)];

  return (
    <div className="bg-card rounded-xl shadow-lg border border-border p-6 mb-6">
      <div className="flex items-center justify-between mb-5">
        <h3 className="font-heading text-xl font-bold">{editingProduct.id ? "Editar" : "Novo"} Produto</h3>
        <button onClick={onCancel} className="p-1 hover:bg-muted rounded-lg transition-colors"><X className="h-5 w-5 text-muted-foreground" /></button>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Image upload */}
        <div className="lg:row-span-2">
          <Label className="mb-2 block">Imagem do Produto</Label>
          <div className="border-2 border-dashed border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-primary/5 transition-all min-h-[200px] flex flex-col items-center justify-center" onClick={() => fileInputRef.current?.click()}>
            {form.image_url ? (
              <div className="relative w-full">
                <img src={form.image_url} alt="Preview" className="w-full h-48 object-contain rounded-lg" />
                <button onClick={(e) => { e.stopPropagation(); setForm(prev => ({ ...prev, image_url: "" })); }} className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 shadow-md hover:opacity-80"><X className="h-3 w-3" /></button>
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
          <div className="mt-2"><Input value={form.image_url} onChange={(e) => setForm(prev => ({ ...prev, image_url: e.target.value }))} placeholder="Ou cole a URL da imagem..." className="text-xs" /></div>
        </div>

        <div className="lg:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2"><Label>Nome do Produto *</Label><Input value={form.name} onChange={(e) => setForm(prev => ({ ...prev, name: e.target.value }))} placeholder="Ex: Gerador Diesel 100kVA" /></div>
          <div><Label>Código / SKU</Label><Input value={form.sku} onChange={(e) => setForm(prev => ({ ...prev, sku: e.target.value }))} placeholder="Ex: GEN-DSL-100" /></div>

          {/* Unified Category Section */}
          <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Categorias do Produto</span>
              <span className="text-xs text-muted-foreground ml-1">— Selecione onde o produto aparece no site (pode marcar várias)</span>
            </div>
            <MenuCategoryTree
              selected={uniqueCategoryIds}
              primaryId={form.menu_category_id}
              onChange={(ids) => {
                const primary = form.menu_category_id;
                const additional = ids.filter(id => id !== primary);
                setForm(prev => ({
                  ...prev,
                  menu_category_ids: additional,
                  menu_category_id: ids.includes(primary) ? primary : (ids[0] || ""),
                }));
              }}
              onPrimaryChange={(id) => setForm(prev => ({
                ...prev,
                menu_category_id: id,
                menu_category_ids: [...prev.menu_category_ids, prev.menu_category_id].filter(x => x && x !== id),
              }))}
            />
            <p className="text-[11px] text-muted-foreground mt-2">
              A categoria <strong>principal</strong> define a posição primária no menu. As demais são vínculos adicionais para buscas e navegação.
            </p>
          </div>

          {/* Reseller */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Store className="h-4 w-4" /> Produto pertence a Fornecedor?</Label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.reseller_id} onChange={e => setForm(prev => ({ ...prev, reseller_id: e.target.value }))}>
              <option value="">Não — Produto próprio</option>
              {resellers.map(r => {
                const profile = clients.find(c => c.user_id === r.user_id);
                return <option key={r.id} value={r.id}>Sim — {r.company_name || profile?.full_name || "Fornecedor"}</option>;
              })}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Associa o produto a um fornecedor para relatórios e controle de estoque</p>
          </div>

          {/* Reseller pricing */}
          {form.reseller_id && (
            <div className="md:col-span-2 rounded-lg border border-accent/30 bg-accent/5 p-4">
              <div className="flex items-center gap-2 mb-3">
                <Store className="h-4 w-4 text-accent-foreground" />
                <span className="text-sm font-semibold text-foreground">Precificação do Fornecedor</span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label>Preço do Fornecedor (R$)</Label>
                  <Input type="number" step="0.01" value={form.reseller_price} onChange={(e) => {
                    const resellerPrice = e.target.value;
                    const rp = parseFloat(resellerPrice) || 0;
                    const pct = parseFloat(form.store_commission_pct) || 0;
                    const newSalePrice = rp > 0 ? (rp * (1 + pct / 100)).toFixed(2) : form.price;
                    setForm(prev => ({ ...prev, reseller_price: resellerPrice, price: newSalePrice }));
                  }} placeholder="Custo do fornecedor" className="mt-1" />
                </div>
                <div>
                  <Label>% Loja Grundemann</Label>
                  <Input type="number" step="0.1" value={form.store_commission_pct} onChange={(e) => {
                    const pct = e.target.value;
                    const rp = parseFloat(form.reseller_price) || 0;
                    const p = parseFloat(pct) || 0;
                    const newSalePrice = rp > 0 ? (rp * (1 + p / 100)).toFixed(2) : form.price;
                    setForm(prev => ({ ...prev, store_commission_pct: pct, price: newSalePrice }));
                  }} placeholder="Comissão %" className="mt-1" />
                </div>
                <div className="flex items-end pb-1">
                  {form.reseller_price && (
                    <div className="text-sm space-y-1">
                      <p className="text-muted-foreground">Preço Fornecedor: <strong className="text-foreground">R$ {parseFloat(form.reseller_price).toFixed(2)}</strong></p>
                      <p className="text-muted-foreground">% Loja: <strong className="text-primary">{(parseFloat(form.store_commission_pct) || 0).toFixed(1)}%</strong></p>
                      <p className="text-muted-foreground">Preço de Venda: <strong className="text-primary">R$ {(parseFloat(form.price) || 0).toFixed(2)}</strong></p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Price / Stock */}
          <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} /></div>
          <div><Label>Preço Original (riscado)</Label><Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm(prev => ({ ...prev, original_price: e.target.value }))} placeholder="Deixe vazio se não houver" /></div>
          <div><Label>Estoque</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm(prev => ({ ...prev, stock_quantity: e.target.value }))} /></div>
          <div><Label>Marca</Label><Input value={form.brand} onChange={(e) => setForm(prev => ({ ...prev, brand: e.target.value }))} placeholder="Ex: Toyama" /></div>
          <div><Label>Potência (HP)</Label><Input value={form.hp} onChange={(e) => setForm(prev => ({ ...prev, hp: e.target.value }))} placeholder="Ex: 5.5" /></div>
          <div><Label>Modelo Motor</Label><Input value={form.engine_model} onChange={(e) => setForm(prev => ({ ...prev, engine_model: e.target.value }))} placeholder="Ex: 168F" /></div>
          <div>
            <Label>Combustível</Label>
            <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.fuel_type} onChange={e => setForm(prev => ({ ...prev, fuel_type: e.target.value }))}>
              <option value="">Selecione</option>
              <option value="gasolina">Gasolina</option>
              <option value="diesel">Diesel</option>
              <option value="gas">Gás (GLP)</option>
              <option value="bifuel">Bifuel</option>
            </select>
          </div>
          <div>
            <Label>Slug (URL)</Label>
            <div className="flex gap-2">
              <Input value={form.slug} onChange={(e) => setForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="gerador-diesel-100kva" className="flex-1" />
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, slug: generateSlug(prev.name) }))}>Gerar</Button>
            </div>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tags de Busca</Label>
            <Input value={form.tags} onChange={(e) => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="Ex: 168f, 6.5hp, gerador, filtro (separadas por vírgula)" className="mt-1" />
            <p className="text-xs text-muted-foreground mt-1">Palavras-chave para melhorar a busca do produto</p>
          </div>

          <div className="md:col-span-2"><Label>Descrição</Label><Textarea value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} rows={3} placeholder="Descrição detalhada do produto..." /></div>

          {/* Dimensions / Weight */}
          <div className="md:col-span-2 grid grid-cols-2 md:grid-cols-4 gap-3">
            <div><Label className="text-xs">Peso (kg)</Label><Input type="number" step="0.1" value={form.weight_kg} onChange={e => setForm(prev => ({ ...prev, weight_kg: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Largura (cm)</Label><Input type="number" step="0.1" value={form.width_cm} onChange={e => setForm(prev => ({ ...prev, width_cm: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Altura (cm)</Label><Input type="number" step="0.1" value={form.height_cm} onChange={e => setForm(prev => ({ ...prev, height_cm: e.target.value }))} className="h-9" /></div>
            <div><Label className="text-xs">Comprim. (cm)</Label><Input type="number" step="0.1" value={form.length_cm} onChange={e => setForm(prev => ({ ...prev, length_cm: e.target.value }))} className="h-9" /></div>
          </div>

          {/* Specifications */}
          <div className="md:col-span-2"><Label>Especificações (JSON)</Label><Textarea value={form.specifications} onChange={e => setForm(prev => ({ ...prev, specifications: e.target.value }))} rows={3} placeholder='{"Tensão": "127/220V", "Frequência": "60Hz"}' className="font-mono text-xs" /></div>

          {/* Video URL */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Video className="h-4 w-4" /> URL do Vídeo</Label>
            <Input value={form.video_url} onChange={e => setForm(prev => ({ ...prev, video_url: e.target.value }))} placeholder="https://youtube.com/watch?v=..." className="mt-1" />
          </div>

          {/* Switches */}
          <div className="md:col-span-2 flex items-center gap-6 pt-2 flex-wrap">
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={v => setForm(prev => ({ ...prev, is_active: v }))} /><Label>Ativo</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={v => setForm(prev => ({ ...prev, is_featured: v }))} /><Label>Destaque</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.free_shipping} onCheckedChange={v => setForm(prev => ({ ...prev, free_shipping: v }))} /><Label>Frete Grátis</Label></div>
          </div>
        </div>
      </div>
      <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-border">
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
        <Button onClick={onSave} disabled={!form.name || !form.price}>{editingProduct.id ? "Salvar Alterações" : "Criar Produto"}</Button>
      </div>
    </div>
  );
};

export default ProductForm;
