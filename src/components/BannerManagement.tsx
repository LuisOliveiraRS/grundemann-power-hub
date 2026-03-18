import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent } from "@/components/ui/card";
import { Plus, Trash2, GripVertical, Loader2, Image, ExternalLink } from "lucide-react";

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
  const [newBanner, setNewBanner] = useState({ title: "", image_url: "", link_url: "" });

  const fetchBanners = async () => {
    const { data } = await supabase
      .from("hero_banners")
      .select("*")
      .order("display_order");
    if (data) setBanners(data as Banner[]);
    setLoading(false);
  };

  useEffect(() => { fetchBanners(); }, []);

  const addBanner = async () => {
    if (!newBanner.image_url.trim()) {
      toast({ title: "URL da imagem é obrigatória", variant: "destructive" });
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("hero_banners").insert({
      title: newBanner.title || null,
      image_url: newBanner.image_url,
      link_url: newBanner.link_url || null,
      display_order: banners.length,
    });
    if (error) {
      toast({ title: "Erro ao criar banner", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Banner criado!" });
      setNewBanner({ title: "", image_url: "", link_url: "" });
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

  const moveUp = async (index: number) => {
    if (index === 0) return;
    const updated = [...banners];
    [updated[index - 1], updated[index]] = [updated[index], updated[index - 1]];
    for (let i = 0; i < updated.length; i++) {
      await supabase.from("hero_banners").update({ display_order: i }).eq("id", updated[i].id);
    }
    fetchBanners();
  };

  if (loading) {
    return <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="font-heading text-lg font-bold text-foreground mb-1">Gerenciar Banners da Capa</h3>
        <p className="text-sm text-muted-foreground">Adicione, reordene ou remova banners do carrossel estilo RPW.</p>
      </div>

      {/* Add new banner */}
      <Card>
        <CardContent className="pt-6">
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
              <Label>URL da Imagem *</Label>
              <Input
                value={newBanner.image_url}
                onChange={(e) => setNewBanner((p) => ({ ...p, image_url: e.target.value }))}
                placeholder="https://..."
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
          <Button onClick={addBanner} disabled={saving} className="mt-4" size="sm">
            <Plus className="h-4 w-4 mr-1" /> Adicionar Banner
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
              <button onClick={() => moveUp(i)} className="text-muted-foreground hover:text-foreground">
                <GripVertical className="h-5 w-5" />
              </button>

              <div className="w-32 h-16 rounded overflow-hidden bg-muted flex-shrink-0 border">
                {b.image_url ? (
                  <img src={b.image_url} alt={b.title || "Banner"} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex items-center justify-center h-full"><Image className="h-6 w-6 text-muted-foreground" /></div>
                )}
              </div>

              <div className="flex-1 min-w-0">
                <p className="font-medium text-foreground truncate">{b.title || "(Sem título)"}</p>
                <p className="text-xs text-muted-foreground truncate">{b.image_url}</p>
                {b.link_url && (
                  <p className="text-xs text-primary flex items-center gap-1 mt-0.5">
                    <ExternalLink className="h-3 w-3" /> {b.link_url}
                  </p>
                )}
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
