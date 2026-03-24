import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Trash2, Loader2, Image, ExternalLink, Upload, ArrowUp, ArrowDown, Pencil, X, Package } from "lucide-react";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
  product_id: string | null;
  background_image_url: string | null;
  cta_text: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
}

const BannerManagement = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: "", link_url: "", cta_text: "COMPRAR", product_id: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [bgPreviewUrl, setBgPreviewUrl] = useState<string | null>(null);
  const [selectedBgFile, setSelectedBgFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bgFileInputRef = useRef<HTMLInputElement>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBgFile, setEditBgFile] = useState<File | null>(null);
  const [editBgPreview, setEditBgPreview] = useState<string | null>(null);
  const editBgRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("hero_banners")
      .select("*")
      .order("display_order");
    if (data) setBanners(data as Banner[]);
    setLoading(false);
  };

  const fetchProducts = async () => {
    const { data } = await supabase
      .from("products")
      .select("id, name, price, original_price, image_url")
      .eq("is_active", true)
      .order("name");
    if (data) setProducts(data);
  };

  useEffect(() => {
    fetchBanners();
    fetchProducts();
  }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>, type: "banner" | "bg" | "editBg") => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      toast({ title: "Selecione uma imagem válida", variant: "destructive" });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: "Imagem deve ter no máximo 5MB", variant: "destructive" });
      return;
    }

    const url = URL.createObjectURL(file);

    if (type === "banner") {
      setSelectedFile(file);
      setPreviewUrl(url);
    } else if (type === "bg") {
      setSelectedBgFile(file);
      setBgPreviewUrl(url);
    } else {
      setEditBgFile(file);
      setEditBgPreview(url);
    }
  };

  const uploadImage = async (file: File, prefix = "banner"): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `${prefix}-${Date.now()}.${ext}`;

    const { error } = await supabase.storage
      .from("hero-banners")
      .upload(fileName, file, { contentType: file.type, upsert: false });

    if (error) {
      toast({ title: "Erro no upload", description: error.message, variant: "destructive" });
      return null;
    }

    const { data: urlData } = supabase.storage.from("hero-banners").getPublicUrl(fileName);
    return urlData.publicUrl;
  };

  const addBanner = async () => {
    if (!selectedFile && !newBanner.product_id) {
      toast({ title: "Selecione uma imagem ou um produto", variant: "destructive" });
      return;
    }

    setSaving(true);
    setUploading(true);

    let imageUrl = "";
    let backgroundImageUrl: string | null = null;

    if (selectedFile) {
      const url = await uploadImage(selectedFile, "banner");
      if (!url) { setSaving(false); setUploading(false); return; }
      imageUrl = url;
    }

    if (selectedBgFile) {
      const url = await uploadImage(selectedBgFile, "bg");
      if (!url) { setSaving(false); setUploading(false); return; }
      backgroundImageUrl = url;
    }

    // If product selected but no banner image, use product image
    if (!imageUrl && newBanner.product_id) {
      const product = products.find(p => p.id === newBanner.product_id);
      imageUrl = product?.image_url || "";
    }

    setUploading(false);

    const { error } = await supabase.from("hero_banners").insert({
      title: newBanner.title || null,
      image_url: imageUrl,
      link_url: newBanner.link_url || null,
      display_order: banners.length,
      product_id: newBanner.product_id || null,
      background_image_url: backgroundImageUrl,
      cta_text: newBanner.cta_text || "COMPRAR",
    });

    if (error) {
      toast({ title: "Erro ao criar banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner criado com sucesso!" });
      setNewBanner({ title: "", link_url: "", cta_text: "COMPRAR", product_id: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      setSelectedBgFile(null);
      setBgPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (bgFileInputRef.current) bgFileInputRef.current.value = "";
      fetchBanners();
    }
    setSaving(false);
  };

  const toggleActive = async (id: string, is_active: boolean) => {
    await supabase.from("hero_banners").update({ is_active, updated_at: new Date().toISOString() }).eq("id", id);
    setBanners((prev) => prev.map((b) => (b.id === id ? { ...b, is_active } : b)));
  };

  const deleteBanner = async (id: string) => {
    if (!confirm("Remover este banner?")) return;
    await supabase.from("hero_banners").delete().eq("id", id);
    toast({ title: "Banner removido" });
    fetchBanners();
  };

  const reorder = async (index: number, direction: "up" | "down") => {
    const swapIdx = direction === "up" ? index - 1 : index + 1;
    if (swapIdx < 0 || swapIdx >= banners.length) return;

    const updated = [...banners];
    [updated[index], updated[swapIdx]] = [updated[swapIdx], updated[index]];
    setBanners(updated);

    await Promise.all(
      updated.map((b, i) =>
        supabase.from("hero_banners").update({ display_order: i }).eq("id", b.id)
      )
    );
  };

  const updateBackgroundImage = async (bannerId: string) => {
    if (!editBgFile) return;
    setSaving(true);
    const url = await uploadImage(editBgFile, "bg");
    if (url) {
      await supabase.from("hero_banners").update({ background_image_url: url, updated_at: new Date().toISOString() }).eq("id", bannerId);
      toast({ title: "Imagem de fundo atualizada!" });
      setEditingId(null);
      setEditBgFile(null);
      setEditBgPreview(null);
      fetchBanners();
    }
    setSaving(false);
  };

  const updateBannerProduct = async (bannerId: string, productId: string) => {
    const pid = productId === "none" ? null : productId;
    await supabase.from("hero_banners").update({ product_id: pid, updated_at: new Date().toISOString() }).eq("id", bannerId);
    setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, product_id: pid } : b));
    toast({ title: "Produto atualizado!" });
  };

  const updateBannerCta = async (bannerId: string, cta: string) => {
    await supabase.from("hero_banners").update({ cta_text: cta, updated_at: new Date().toISOString() }).eq("id", bannerId);
    setBanners(prev => prev.map(b => b.id === bannerId ? { ...b, cta_text: cta } : b));
  };

  const selectedProduct = newBanner.product_id ? products.find(p => p.id === newBanner.product_id) : null;

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground mb-1">Gerenciar Banners da Capa</h3>
        <p className="text-sm text-muted-foreground">Configure banners com produtos, imagens de fundo e botões de ação.</p>
      </div>

      {/* Add new banner */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label>Título (opcional)</Label>
              <Input
                value={newBanner.title}
                onChange={(e) => setNewBanner((p) => ({ ...p, title: e.target.value }))}
                placeholder="Ex: Promoção de Verão"
              />
            </div>
            <div>
              <Label>Link ao clicar (opcional)</Label>
              <Input
                value={newBanner.link_url}
                onChange={(e) => setNewBanner((p) => ({ ...p, link_url: e.target.value }))}
                placeholder="/produtos ou https://..."
              />
            </div>
            <div>
              <Label>Texto do Botão</Label>
              <Input
                value={newBanner.cta_text}
                onChange={(e) => setNewBanner((p) => ({ ...p, cta_text: e.target.value }))}
                placeholder="COMPRAR"
              />
            </div>
          </div>

          {/* Product selection */}
          <div>
            <Label>Produto vinculado (opcional)</Label>
            <Select
              value={newBanner.product_id || "none"}
              onValueChange={(v) => setNewBanner(p => ({ ...p, product_id: v === "none" ? "" : v }))}
            >
              <SelectTrigger>
                <SelectValue placeholder="Selecione um produto..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Nenhum produto (banner simples)</SelectItem>
                {products.map(p => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — R$ {p.price.toFixed(2)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedProduct && (
              <div className="mt-2 flex items-center gap-3 p-3 rounded-lg bg-muted/50 border">
                {selectedProduct.image_url && (
                  <img src={selectedProduct.image_url} alt={selectedProduct.name} className="w-16 h-16 object-contain rounded bg-white" />
                )}
                <div>
                  <p className="font-medium text-sm">{selectedProduct.name}</p>
                  <p className="text-sm text-primary font-bold">R$ {selectedProduct.price.toFixed(2)}</p>
                  {selectedProduct.original_price && (
                    <p className="text-xs text-muted-foreground line-through">R$ {selectedProduct.original_price.toFixed(2)}</p>
                  )}
                </div>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Banner/product image */}
            <div>
              <Label>Imagem do Banner / Produto *</Label>
              <div
                className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => fileInputRef.current?.click()}
              >
                {previewUrl ? (
                  <div className="space-y-2">
                    <img src={previewUrl} alt="Preview" className="w-full max-h-32 object-contain rounded-md" />
                    <p className="text-xs text-muted-foreground">{selectedFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Upload className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Imagem principal do banner</p>
                  </div>
                )}
                <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "banner")} />
              </div>
            </div>

            {/* Background image */}
            <div>
              <Label>Imagem de Fundo (opcional)</Label>
              <div
                className="mt-2 border-2 border-dashed border-border rounded-lg p-4 text-center cursor-pointer hover:border-primary/50 transition-colors"
                onClick={() => bgFileInputRef.current?.click()}
              >
                {bgPreviewUrl ? (
                  <div className="space-y-2">
                    <img src={bgPreviewUrl} alt="Background Preview" className="w-full max-h-32 object-cover rounded-md" />
                    <p className="text-xs text-muted-foreground">{selectedBgFile?.name}</p>
                  </div>
                ) : (
                  <div className="space-y-1">
                    <Image className="h-8 w-8 mx-auto text-muted-foreground" />
                    <p className="text-xs text-muted-foreground">Fundo do banner (ex: oficina, galpão)</p>
                  </div>
                )}
                <input ref={bgFileInputRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "bg")} />
              </div>
            </div>
          </div>

          <Button onClick={addBanner} disabled={saving || (!selectedFile && !newBanner.product_id)} size="sm">
            {uploading ? (
              <><Loader2 className="h-4 w-4 mr-1 animate-spin" /> Enviando...</>
            ) : (
              <><Plus className="h-4 w-4 mr-1" /> Adicionar Banner</>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Existing banners */}
      <div className="space-y-3">
        {banners.length === 0 && (
          <p className="text-center text-muted-foreground py-8">Nenhum banner cadastrado. Adicione o primeiro acima.</p>
        )}
        {banners.map((b, i) => {
          const linkedProduct = b.product_id ? products.find(p => p.id === b.product_id) : null;
          const isEditing = editingId === b.id;

          return (
            <Card key={b.id} className={`${!b.is_active ? "opacity-50" : ""}`}>
              <CardContent className="py-4 space-y-3">
                <div className="flex items-center gap-4">
                  {/* Reorder */}
                  <div className="flex flex-col gap-1">
                    <button onClick={() => reorder(i, "up")} disabled={i === 0} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowUp className="h-4 w-4" />
                    </button>
                    <button onClick={() => reorder(i, "down")} disabled={i === banners.length - 1} className="text-muted-foreground hover:text-foreground disabled:opacity-30">
                      <ArrowDown className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Banner preview */}
                  <div className="w-48 h-24 rounded overflow-hidden bg-muted flex-shrink-0 border relative">
                    {b.background_image_url ? (
                      <>
                        <img src={b.background_image_url} alt="Fundo" className="w-full h-full object-cover" />
                        {b.image_url && (
                          <img src={b.image_url} alt="Produto" className="absolute right-1 top-1 w-12 h-12 object-contain bg-white rounded shadow-sm" />
                        )}
                      </>
                    ) : b.image_url ? (
                      <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                    ) : (
                      <div className="flex items-center justify-center h-full"><Image className="h-6 w-6 text-muted-foreground" /></div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">{b.title || "(Sem título)"}</p>
                    {linkedProduct && (
                      <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                        <Package className="h-3 w-3" /> {linkedProduct.name} — R$ {linkedProduct.price.toFixed(2)}
                      </p>
                    )}
                    {b.link_url && (
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mt-0.5">
                        <ExternalLink className="h-3 w-3" /> {b.link_url}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-muted-foreground">Posição: {i + 1}</span>
                      {b.cta_text && <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded">{b.cta_text}</span>}
                      {b.background_image_url && <span className="text-xs bg-accent/50 text-accent-foreground px-2 py-0.5 rounded">Com fundo</span>}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="icon" onClick={() => { setEditingId(isEditing ? null : b.id); setEditBgFile(null); setEditBgPreview(null); }}>
                      {isEditing ? <X className="h-4 w-4" /> : <Pencil className="h-4 w-4" />}
                    </Button>
                    <div className="flex items-center gap-2">
                      <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                      <span className="text-xs text-muted-foreground">{b.is_active ? "Ativo" : "Inativo"}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => deleteBanner(b.id)} className="text-destructive hover:text-destructive">
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                {/* Edit panel */}
                {isEditing && (
                  <div className="border-t pt-3 space-y-3">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Change product */}
                      <div>
                        <Label className="text-xs">Produto Vinculado</Label>
                        <Select
                          value={b.product_id || "none"}
                          onValueChange={(v) => updateBannerProduct(b.id, v)}
                        >
                          <SelectTrigger className="h-9 text-xs">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Nenhum</SelectItem>
                            {products.map(p => (
                              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Change CTA */}
                      <div>
                        <Label className="text-xs">Texto do Botão</Label>
                        <Input
                          className="h-9 text-xs"
                          defaultValue={b.cta_text || ""}
                          onBlur={(e) => updateBannerCta(b.id, e.target.value)}
                          placeholder="COMPRAR"
                        />
                      </div>
                    </div>

                    {/* Change background */}
                    <div>
                      <Label className="text-xs">Alterar Imagem de Fundo</Label>
                      <div className="flex items-center gap-3 mt-1">
                        <div
                          className="border-2 border-dashed border-border rounded-lg p-3 text-center cursor-pointer hover:border-primary/50 transition-colors flex-1"
                          onClick={() => editBgRef.current?.click()}
                        >
                          {editBgPreview ? (
                            <img src={editBgPreview} alt="Novo fundo" className="w-full max-h-20 object-cover rounded" />
                          ) : (
                            <p className="text-xs text-muted-foreground">Clique para selecionar nova imagem de fundo</p>
                          )}
                          <input ref={editBgRef} type="file" accept="image/*" className="hidden" onChange={(e) => handleFileSelect(e, "editBg")} />
                        </div>
                        <Button
                          size="sm"
                          disabled={!editBgFile || saving}
                          onClick={() => updateBackgroundImage(b.id)}
                        >
                          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Salvar Fundo"}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default BannerManagement;
