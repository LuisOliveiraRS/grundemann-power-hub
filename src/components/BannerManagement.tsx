import { useEffect, useState, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Loader2, Image, ExternalLink, Upload, ArrowUp, ArrowDown } from "lucide-react";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

const BannerManagement = () => {
  const { toast } = useToast();
  const [banners, setBanners] = useState<Banner[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [newBanner, setNewBanner] = useState({ title: "", link_url: "" });
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("hero_banners")
      .select("*")
      .order("display_order");
    if (data) setBanners(data as Banner[]);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
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

    setSelectedFile(file);
    setPreviewUrl(URL.createObjectURL(file));
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const fileName = `banner-${Date.now()}.${ext}`;

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
    if (!selectedFile) {
      toast({ title: "Selecione uma imagem para o banner", variant: "destructive" });
      return;
    }

    setSaving(true);
    setUploading(true);

    const imageUrl = await uploadImage(selectedFile);
    if (!imageUrl) { setSaving(false); setUploading(false); return; }

    setUploading(false);

    const { error } = await supabase.from("hero_banners").insert({
      title: newBanner.title || null,
      image_url: imageUrl,
      link_url: newBanner.link_url || null,
      display_order: banners.length,
    });

    if (error) {
      toast({ title: "Erro ao criar banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner criado com sucesso!" });
      setNewBanner({ title: "", link_url: "" });
      setSelectedFile(null);
      setPreviewUrl(null);
      if (fileInputRef.current) fileInputRef.current.value = "";
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

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground mb-1">Gerenciar Banners da Capa</h3>
        <p className="text-sm text-muted-foreground">Faça upload de imagens, configure links e reordene os banners do carrossel.</p>
      </div>

      {/* Add new banner */}
      <Card>
        <CardContent className="pt-6 space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
          </div>

          {/* File upload area */}
          <div>
            <Label>Imagem do Banner *</Label>
            <div
              className="mt-2 border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
              onClick={() => fileInputRef.current?.click()}
            >
              {previewUrl ? (
                <div className="space-y-3">
                  <img src={previewUrl} alt="Preview" className="w-full max-h-48 object-cover rounded-md" />
                  <p className="text-sm text-muted-foreground">{selectedFile?.name} — Clique para trocar</p>
                </div>
              ) : (
                <div className="space-y-2">
                  <Upload className="h-10 w-10 mx-auto text-muted-foreground" />
                  <p className="text-sm text-muted-foreground">Clique para selecionar uma imagem</p>
                  <p className="text-xs text-muted-foreground">JPG, PNG ou WebP — máx. 5MB — Recomendado: 1920×600px</p>
                </div>
              )}
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFileSelect}
              />
            </div>
          </div>

          <Button onClick={addBanner} disabled={saving || !selectedFile} size="sm">
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
        {banners.map((b, i) => (
          <Card key={b.id} className={`${!b.is_active ? "opacity-50" : ""}`}>
            <CardContent className="py-4 flex items-center gap-4">
              <div className="flex flex-col gap-1">
                <button
                  onClick={() => reorder(i, "up")}
                  disabled={i === 0}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowUp className="h-4 w-4" />
                </button>
                <button
                  onClick={() => reorder(i, "down")}
                  disabled={i === banners.length - 1}
                  className="text-muted-foreground hover:text-foreground disabled:opacity-30"
                >
                  <ArrowDown className="h-4 w-4" />
                </button>
              </div>

              <div className="w-40 h-20 rounded overflow-hidden bg-muted flex-shrink-0 border">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Image className="h-6 w-6 text-muted-foreground" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{b.title || "(Sem título)"}</p>
                {b.link_url && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                    <ExternalLink className="h-3 w-3" /> {b.link_url}
                  </p>
                )}
                <p className="text-xs text-muted-foreground mt-0.5">Posição: {i + 1}</p>
              </div>

              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2">
                  <Switch checked={b.is_active} onCheckedChange={(v) => toggleActive(b.id, v)} />
                  <span className="text-xs text-muted-foreground">{b.is_active ? "Ativo" : "Inativo"}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => deleteBanner(b.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default BannerManagement;
