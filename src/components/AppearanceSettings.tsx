import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Monitor, Image, Loader2 } from "lucide-react";

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [heroMode, setHeroMode] = useState<string>("product_showcase");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_mode")
      .single()
      .then(({ data }) => {
        if (data) setHeroMode(data.value);
        setLoading(false);
      });
  }, []);

  const toggleHeroMode = async () => {
    const newMode = heroMode === "product_showcase" ? "rotating_banner" : "product_showcase";
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: newMode, updated_at: new Date().toISOString() })
      .eq("key", "hero_mode");

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setHeroMode(newMode);
      toast({ title: "Capa da página atualizada!", description: newMode === "rotating_banner" ? "Banner rotativo ativado" : "Vitrine de produtos ativada" });
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">Aparência da Página Inicial</h2>
        <p className="text-sm text-muted-foreground">Escolha qual capa será exibida na home do site.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Option 1: Product Showcase */}
        <button
          onClick={() => heroMode !== "product_showcase" && toggleHeroMode()}
          disabled={saving}
          className={`relative text-left rounded-xl border-2 p-5 transition-all ${
            heroMode === "product_showcase"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${heroMode === "product_showcase" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Monitor className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-foreground">Vitrine de Produtos</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Exibe texto institucional à esquerda e um produto em destaque rotativo à direita. Ideal para foco em conversão.
              </p>
            </div>
          </div>
          {heroMode === "product_showcase" && (
            <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </button>

        {/* Option 2: Rotating Banner */}
        <button
          onClick={() => heroMode !== "rotating_banner" && toggleHeroMode()}
          disabled={saving}
          className={`relative text-left rounded-xl border-2 p-5 transition-all ${
            heroMode === "rotating_banner"
              ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
              : "border-border hover:border-primary/40"
          }`}
        >
          <div className="flex items-start gap-4">
            <div className={`p-3 rounded-lg ${heroMode === "rotating_banner" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
              <Image className="h-6 w-6" />
            </div>
            <div className="flex-1">
              <h3 className="font-heading font-bold text-foreground">Banner Rotativo</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Carrossel com banners de ofertas, produtos do Mercado Livre e categorias. Ideal para promoções e destaque visual.
              </p>
            </div>
          </div>
          {heroMode === "rotating_banner" && (
            <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />
          )}
        </button>
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Salvando...
        </div>
      )}
    </div>
  );
};

export default AppearanceSettings;
