import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Monitor, Image, Layout, Loader2, Construction, Plus, Trash2, GripVertical, Save } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

type HeroMode = "product_showcase" | "rotating_banner" | "kraft_style" | "rpw_style" | "maintenance";

interface Headline {
  id?: string;
  title: string;
  subtitle: string;
  display_order: number;
  is_active: boolean;
}

const OPTIONS: { value: HeroMode; label: string; description: string; icon: typeof Monitor }[] = [
  { value: "product_showcase", label: "Vitrine de Produtos", description: "Exibe texto institucional à esquerda e um produto em destaque rotativo à direita.", icon: Monitor },
  { value: "rotating_banner", label: "Banner Rotativo", description: "Carrossel com banners de ofertas, produtos e categorias.", icon: Image },
  { value: "kraft_style", label: "Fullscreen Imersivo", description: "Hero fullscreen com imagem industrial, texto em destaque e produtos em layout alternado.", icon: Layout },
  { value: "rpw_style", label: "Estilo Loja Virtual", description: "Banners full-width + barra de benefícios + grade de produtos.", icon: Monitor },
  { value: "maintenance", label: "Modo Manutenção", description: "Exibe página de manutenção com logo, contato e previsão de retorno.", icon: Construction },
];

const AppearanceSettings = () => {
  const { toast } = useToast();
  const [heroMode, setHeroMode] = useState<HeroMode>("product_showcase");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [headlines, setHeadlines] = useState<Headline[]>([]);
  const [loadingHeadlines, setLoadingHeadlines] = useState(true);
  const [savingHeadlines, setSavingHeadlines] = useState(false);

  useEffect(() => {
    Promise.all([
      supabase.from("site_settings").select("value").eq("key", "hero_mode").single(),
      supabase.from("hero_headlines").select("*").order("display_order"),
    ]).then(([modeRes, headRes]) => {
      if (modeRes.data) setHeroMode(modeRes.data.value as HeroMode);
      if (headRes.data) setHeadlines(headRes.data);
      setLoading(false);
      setLoadingHeadlines(false);
    });
  }, []);

  const selectMode = async (newMode: HeroMode) => {
    if (newMode === heroMode) return;
    setSaving(true);
    const { error } = await supabase.from("site_settings").update({ value: newMode, updated_at: new Date().toISOString() }).eq("key", "hero_mode");
    if (error) {
      toast({ title: "Erro ao salvar", description: error.message, variant: "destructive" });
    } else {
      setHeroMode(newMode);
      toast({ title: "Capa da página atualizada!" });
    }
    setSaving(false);
  };

  const addHeadline = () => {
    setHeadlines(prev => [...prev, { title: "", subtitle: "", display_order: prev.length, is_active: true }]);
  };

  const removeHeadline = (idx: number) => {
    setHeadlines(prev => prev.filter((_, i) => i !== idx));
  };

  const updateHeadline = (idx: number, field: keyof Headline, value: string | boolean) => {
    setHeadlines(prev => prev.map((h, i) => i === idx ? { ...h, [field]: value } : h));
  };

  const saveHeadlines = async () => {
    setSavingHeadlines(true);
    // Delete all then re-insert
    await supabase.from("hero_headlines").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    const toInsert = headlines.map((h, i) => ({
      title: h.title,
      subtitle: h.subtitle,
      display_order: i,
      is_active: h.is_active,
    }));
    if (toInsert.length > 0) {
      const { error } = await supabase.from("hero_headlines").insert(toInsert);
      if (error) {
        toast({ title: "Erro ao salvar frases", description: error.message, variant: "destructive" });
      } else {
        toast({ title: "Frases do hero salvas com sucesso!" });
        // Reload to get IDs
        const { data } = await supabase.from("hero_headlines").select("*").order("display_order");
        if (data) setHeadlines(data);
      }
    }
    setSavingHeadlines(false);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  return (
    <div className="space-y-8">
      {/* Hero Mode Selection */}
      <div>
        <h2 className="font-heading text-xl font-bold text-foreground mb-1">Aparência da Página Inicial</h2>
        <p className="text-sm text-muted-foreground">Escolha qual capa será exibida na home do site.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {OPTIONS.map((opt) => {
          const active = heroMode === opt.value;
          const Icon = opt.icon;
          return (
            <button
              key={opt.value}
              onClick={() => selectMode(opt.value)}
              disabled={saving}
              className={`relative text-left rounded-xl border-2 p-5 transition-all ${
                active ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border hover:border-primary/40"
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
              {active && <div className="absolute top-3 right-3 h-3 w-3 rounded-full bg-primary animate-pulse" />}
            </button>
          );
        })}
      </div>

      {saving && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Salvando...
        </div>
      )}

      {/* Hero Headlines Management */}
      {heroMode === "kraft_style" && (
        <div className="border border-border rounded-xl p-6 bg-card space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-heading text-lg font-bold text-foreground">Frases do Hero Imersivo</h3>
              <p className="text-sm text-muted-foreground">Edite as frases que alternam na seção hero do site. Use \n para quebra de linha no título.</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={addHeadline}>
                <Plus className="h-4 w-4 mr-1" /> Adicionar
              </Button>
              <Button size="sm" onClick={saveHeadlines} disabled={savingHeadlines}>
                {savingHeadlines ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
                Salvar
              </Button>
            </div>
          </div>

          {loadingHeadlines ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="space-y-3">
              {headlines.map((h, idx) => (
                <div key={idx} className="flex items-start gap-3 p-4 border border-border rounded-lg bg-background">
                  <GripVertical className="h-5 w-5 text-muted-foreground mt-2 flex-shrink-0" />
                  <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Título</label>
                      <Textarea
                        value={h.title}
                        onChange={(e) => updateHeadline(idx, "title", e.target.value)}
                        rows={2}
                        className="text-sm"
                        placeholder="Potência e\nconfiabilidade"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1 block">Subtítulo</label>
                      <Input
                        value={h.subtitle}
                        onChange={(e) => updateHeadline(idx, "subtitle", e.target.value)}
                        className="text-sm"
                        placeholder="Descrição curta..."
                      />
                    </div>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => removeHeadline(idx)} className="text-destructive hover:text-destructive mt-1">
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {headlines.length === 0 && (
                <p className="text-center text-sm text-muted-foreground py-4">Nenhuma frase cadastrada. Clique em "Adicionar" para criar.</p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default AppearanceSettings;
