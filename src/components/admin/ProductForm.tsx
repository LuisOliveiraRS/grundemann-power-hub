import React, { useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { X, Upload, ImageIcon, Plus, Video, Download, Package, Store, Tag } from "lucide-react";
import MenuCategoryPicker from "@/components/MenuCategoryPicker";
import type { Product, Category, Subcategory, ResellerOption, ProfileFull, ProductCategoryLink } from "@/types/admin";
import { generateSlug } from "@/types/admin";

export interface ProductFormState {
  name: string; description: string; sku: string; price: string; original_price: string;
  stock_quantity: string; category_id: string; subcategory_id: string; is_featured: boolean;
  is_active: boolean; free_shipping: boolean; image_url: string; additional_images: string[];
  video_url: string; brand: string; hp: string; engine_model: string; specifications: string;
  documents: string[]; weight_kg: string; width_cm: string; height_cm: string; length_cm: string;
  extra_category_ids: string[]; menu_category_id: string; reseller_id: string; fuel_type: string;
  slug: string; tags: string;
  reseller_price: string; store_commission_pct: string;
}

export const emptyProductForm: ProductFormState = {
  name: "", description: "", sku: "", price: "", original_price: "", stock_quantity: "",
  category_id: "", subcategory_id: "", is_featured: false, is_active: true, free_shipping: false,
  image_url: "", additional_images: [], video_url: "", brand: "", hp: "", engine_model: "",
  specifications: "", documents: [], weight_kg: "", width_cm: "", height_cm: "", length_cm: "",
  extra_category_ids: [], menu_category_id: "", reseller_id: "", fuel_type: "", slug: "", tags: "",
  reseller_price: "", store_commission_pct: "",
};

export function productToFormState(p: Product, linkedCatIds: string[]): ProductFormState {
  return {
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
    tags: (p.tags || []).join(", "),
  };
}

interface ProductFormProps {
  editingProduct: Partial<Product>;
  form: ProductFormState;
  setForm: React.Dispatch<React.SetStateAction<ProductFormState>>;
  categories: Category[];
  subcategories: Subcategory[];
  resellers: ResellerOption[];
  clients: ProfileFull[];
  onSave: () => void;
  onCancel: () => void;
}

const ProductForm = ({ editingProduct, form, setForm, categories, subcategories, resellers, clients, onSave, onCancel }: ProductFormProps) => {
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const getCatSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);

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

          {/* Classification Section */}
          <div className="md:col-span-2 rounded-lg border border-border bg-muted/30 p-4 space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <Tag className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Classificação do Produto</span>
              <span className="text-xs text-muted-foreground ml-1">— Organização interna para filtros e relatórios</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label>Categoria Principal</Label>
                <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.category_id} onChange={(e) => setForm(prev => ({ ...prev, category_id: e.target.value, subcategory_id: "" }))}>
                  <option value="">Sem categoria</option>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
              {form.category_id && getCatSubcats(form.category_id).length > 0 && (
                <div>
                  <Label>Subcategoria</Label>
                  <select className="w-full h-10 border border-input rounded-md px-3 text-sm bg-background" value={form.subcategory_id} onChange={(e) => setForm(prev => ({ ...prev, subcategory_id: e.target.value }))}>
                    <option value="">Sem subcategoria</option>
                    {getCatSubcats(form.category_id).map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
              )}
            </div>
            {categories.filter(c => c.id !== form.category_id).length > 0 && (
              <div>
                <Label className="text-xs">Categorias Adicionais (opcional)</Label>
                <div className="flex flex-wrap gap-2 mt-1 p-2.5 border border-input rounded-md bg-background">
                  {categories.filter(c => c.id !== form.category_id).map(c => (
                    <label key={c.id} className="flex items-center gap-1.5 text-sm cursor-pointer">
                      <input type="checkbox" checked={form.extra_category_ids.includes(c.id)} onChange={(e) => {
                        const ids = e.target.checked ? [...form.extra_category_ids, c.id] : form.extra_category_ids.filter(id => id !== c.id);
                        setForm(prev => ({ ...prev, extra_category_ids: ids }));
                      }} className="rounded border-input" />
                      {c.name}
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Menu Position Section */}
          <div className="md:col-span-2 rounded-lg border border-primary/20 bg-primary/5 p-4">
            <div className="flex items-center gap-2 mb-3">
              <Package className="h-4 w-4 text-primary" />
              <span className="text-sm font-semibold text-foreground">Posição no Menu do Site</span>
              <span className="text-xs text-muted-foreground ml-1">— Onde o produto aparece no menu de navegação</span>
            </div>
            <MenuCategoryPicker value={form.menu_category_id} onChange={(id) => setForm(prev => ({ ...prev, menu_category_id: id }))} label="Categoria do Menu" />
            <p className="text-[11px] text-muted-foreground mt-1.5">Selecione a posição na árvore de navegação do site. Independe da classificação acima.</p>
          </div>

          {/* Reseller */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Store className="h-4 w-4" /> Produto pertence a Revendedor?</Label>
            <select className="mt-1 h-9 w-full rounded-md border border-input bg-background px-3 text-sm" value={form.reseller_id} onChange={e => setForm(prev => ({ ...prev, reseller_id: e.target.value }))}>
              <option value="">Não — Produto próprio</option>
              {resellers.map(r => {
                const profile = clients.find(c => c.user_id === r.user_id);
                return <option key={r.id} value={r.id}>Sim — {r.company_name || profile?.full_name || "Revendedor"}</option>;
              })}
            </select>
            <p className="text-xs text-muted-foreground mt-1">Associa o produto a um revendedor para relatórios e controle de estoque</p>
          </div>

          {/* Price / Stock */}
          <div><Label>Preço (R$)</Label><Input type="number" step="0.01" value={form.price} onChange={(e) => setForm(prev => ({ ...prev, price: e.target.value }))} /></div>
          <div><Label>Preço Original (opcional)</Label><Input type="number" step="0.01" value={form.original_price} onChange={(e) => setForm(prev => ({ ...prev, original_price: e.target.value }))} placeholder="Preço anterior" /></div>
          <div><Label>Estoque</Label><Input type="number" value={form.stock_quantity} onChange={(e) => setForm(prev => ({ ...prev, stock_quantity: e.target.value }))} /></div>
          <div className="md:col-span-2"><Label>Descrição</Label><Textarea rows={3} value={form.description} onChange={(e) => setForm(prev => ({ ...prev, description: e.target.value }))} /></div>

          {/* Toggles */}
          <div className="flex items-center gap-6 md:col-span-2 flex-wrap">
            <div className="flex items-center gap-2"><Switch checked={form.is_featured} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_featured: v }))} /><Label>Destaque</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.is_active} onCheckedChange={(v) => setForm(prev => ({ ...prev, is_active: v }))} /><Label>Ativo</Label></div>
            <div className="flex items-center gap-2"><Switch checked={form.free_shipping} onCheckedChange={(v) => setForm(prev => ({ ...prev, free_shipping: v }))} /><Label>Frete Grátis</Label></div>
          </div>

          {/* Additional images */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><ImageIcon className="h-4 w-4" /> Imagens adicionais (até 5)</Label>
            <div className="grid grid-cols-5 gap-2 mt-2">
              {Array.from({ length: 5 }).map((_, idx) => (
                <div key={idx}>
                  {form.additional_images[idx] ? (
                    <div className="relative group">
                      <img src={form.additional_images[idx]} alt="" className="h-20 w-full object-cover rounded-lg border border-border" />
                      <button className="absolute top-0.5 right-0.5 bg-destructive text-destructive-foreground rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => { const imgs = [...form.additional_images]; imgs.splice(idx, 1); setForm(prev => ({ ...prev, additional_images: imgs })); }}><X className="h-3 w-3" /></button>
                    </div>
                  ) : (
                    <div className="h-20 w-full rounded-lg border-2 border-dashed border-border hover:border-primary/50 flex items-center justify-center cursor-pointer" onClick={() => {
                      const input = document.createElement('input'); input.type = 'file'; input.accept = 'image/*';
                      input.onchange = async (ev: any) => {
                        const file = ev.target.files?.[0]; if (!file) return;
                        const ext = file.name.split('.').pop();
                        const fName = `${Date.now()}-extra-${idx}.${ext}`;
                        const { error } = await supabase.storage.from("product-images").upload(fName, file);
                        if (!error) { const { data } = supabase.storage.from("product-images").getPublicUrl(fName); const imgs = [...form.additional_images]; imgs[idx] = data.publicUrl; setForm(prev => ({ ...prev, additional_images: imgs })); }
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
              <Input value={form.video_url} onChange={(e) => setForm(prev => ({ ...prev, video_url: e.target.value }))} placeholder="https://www.youtube.com/watch?v=..." className="flex-1" />
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
                  setForm(prev => ({ ...prev, video_url: urlData.publicUrl })); toast({ title: "Vídeo enviado!" }); setUploading(false);
                };
                input.click();
              }}><Upload className="h-4 w-4 mr-1" /> Upload</Button>
            </div>
          </div>

          {/* Brand, HP, Engine, Fuel */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div><Label>Marca</Label><Input value={form.brand} onChange={e => setForm(prev => ({ ...prev, brand: e.target.value }))} placeholder="Ex: Honda, Branco..." className="mt-1" /></div>
            <div><Label>Potência (HP)</Label><Input value={form.hp} onChange={e => setForm(prev => ({ ...prev, hp: e.target.value }))} placeholder="Ex: 5.5, 7, 13..." className="mt-1" /></div>
            <div><Label>Modelo do Motor</Label><Input value={form.engine_model} onChange={e => setForm(prev => ({ ...prev, engine_model: e.target.value }))} placeholder="Ex: GX160, GX200..." className="mt-1" /></div>
            <div>
              <Label>Tipo de Combustível</Label>
              <select className="mt-1 flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm" value={form.fuel_type} onChange={e => setForm(prev => ({ ...prev, fuel_type: e.target.value }))}>
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
              <Input value={form.slug} onChange={e => setForm(prev => ({ ...prev, slug: e.target.value }))} placeholder="ex: carburador-gerador-6-5hp" className="flex-1 font-mono text-xs" />
              <Button type="button" variant="outline" size="sm" onClick={() => setForm(prev => ({ ...prev, slug: generateSlug(prev.name) }))}>Gerar</Button>
            </div>
            <p className="text-[10px] text-muted-foreground mt-1">URL: /produto/{form.slug || "..."}</p>
          </div>

          {/* Tags */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Tag className="h-4 w-4" /> Tags de Busca</Label>
            <Input value={form.tags} onChange={e => setForm(prev => ({ ...prev, tags: e.target.value }))} placeholder="carburador, 6.5hp, 168f, gerador, gasolina" className="mt-1" />
            <p className="text-[10px] text-muted-foreground mt-1">Separe as tags por vírgula. Melhora a busca fuzzy e por palavras-chave.</p>
          </div>

          {/* Dimensions */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div><Label>Peso (kg)</Label><Input type="number" step="0.01" value={form.weight_kg} onChange={e => setForm(prev => ({ ...prev, weight_kg: e.target.value }))} placeholder="Ex: 2.5" className="mt-1" /></div>
            <div><Label>Largura (cm)</Label><Input type="number" step="0.1" value={form.width_cm} onChange={e => setForm(prev => ({ ...prev, width_cm: e.target.value }))} placeholder="Ex: 30" className="mt-1" /></div>
            <div><Label>Altura (cm)</Label><Input type="number" step="0.1" value={form.height_cm} onChange={e => setForm(prev => ({ ...prev, height_cm: e.target.value }))} placeholder="Ex: 20" className="mt-1" /></div>
            <div><Label>Comprimento (cm)</Label><Input type="number" step="0.1" value={form.length_cm} onChange={e => setForm(prev => ({ ...prev, length_cm: e.target.value }))} placeholder="Ex: 40" className="mt-1" /></div>
          </div>

          {/* Specs JSON */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Package className="h-4 w-4" /> Especificações Técnicas (JSON)</Label>
            <Textarea rows={4} value={form.specifications} onChange={e => setForm(prev => ({ ...prev, specifications: e.target.value }))} placeholder={'{\n  "Cilindrada": "196cc",\n  "Potência": "6.5 HP"\n}'} className="mt-1 font-mono text-xs" />
          </div>

          {/* Documents */}
          <div className="md:col-span-2">
            <Label className="flex items-center gap-2"><Download className="h-4 w-4" /> Documentos Técnicos (URLs)</Label>
            <div className="space-y-2 mt-1">
              {Array.from({ length: Math.max(1, form.documents.length + 1) }).map((_, idx) => (
                <div key={idx} className="flex gap-2">
                  <Input value={form.documents[idx] || ""} onChange={e => { const docs = [...form.documents]; docs[idx] = e.target.value; setForm(prev => ({ ...prev, documents: docs.filter((d, i) => d || i === idx) })); }} placeholder={`URL do documento ${idx + 1}...`} className="text-xs" />
                  {form.documents[idx] && <Button variant="ghost" size="icon" onClick={() => { const docs = form.documents.filter((_, i) => i !== idx); setForm(prev => ({ ...prev, documents: docs })); }}><X className="h-4 w-4 text-destructive" /></Button>}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
      <div className="flex gap-3 mt-6 pt-5 border-t border-border">
        <Button onClick={onSave} className="shadow-md">{editingProduct.id ? "Atualizar" : "Cadastrar"} Produto</Button>
        <Button variant="outline" onClick={onCancel}>Cancelar</Button>
      </div>
    </div>
  );
};

export default ProductForm;
