import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Image, Layout, Loader2 } from "lucide-react";

type HeroMode = "product_showcase" | "rotating_banner" | "kraft_style";

const OPTIONS: { value: HeroMode; label: string; description: string; icon: typeof Monitor }[] = [
  {
    value: "product_showcase",
    label: "Vitrine de Produtos",
    description: "Exibe texto institucional à esquerda e um produto em destaque rotativo à direita. Ideal para foco em conversão.",
    icon: Monitor,
  },
  {
    value: "rotating_banner",
    label: "Banner Rotativo",
    description: "Carrossel com banners de ofertas, produtos do Mercado Livre e categorias. Ideal para promoções e destaque visual.",
    icon: Image,
  },
  {
    value: "kraft_style",
    label: "Fullscreen Imersivo",
    description: "Hero fullscreen com imagem industrial, texto em destaque e produtos em layout alternado. Visual premium e moderno.",
    icon: Layout,
  },
];

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [heroMode, setHeroMode] = useState<HeroMode>("product_showcase");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase
      .from("site_settings")
      .select("value")
      .eq("key", "hero_mode")
      .single()
      .then(({ data }) => {
        if (data) setHeroMode(data.value as HeroMode);
        setLoading(false);
      });
  }, []);

  const selectMode = async (newMode: HeroMode) => {
    if (newMode === heroMode) return;
    setSaving(true);
    const { error } = await supabase
      .from("site_settings")
      .update({ value: newMode, updated_at: new Date().toISOString() })
      .eq("key", "hero_mode");

    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setHeroMode(newMode);
      toast({ title: "Capa da página atualizada!" });
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

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {OPTIONS.map((opt) => {
          const active = heroMode === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => selectMode(opt.value)}
              disabled={saving}
              className={`relative text-left rounded-xl border-2 p-5 transition-all ${
                active
                  ? "border-primary bg-primary/5 shadow-lg shadow-primary/10"
                  : "border-border hover:border-primary/40"
              }`}
            >
              <div className="flex items-start gap-4">
                <div className={`p-3 rounded-lg ${active ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"}`}>
                  <Icon className="h-6 w-6" />
                </div>
                <div className="flex-1">
                  <h3 className="font-heading font-bold text-foreground">{opt.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{opt.description}</p>
                </div>
              </div>
              {active && (
                <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />
              )}
            </button>
          );
        })}
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
