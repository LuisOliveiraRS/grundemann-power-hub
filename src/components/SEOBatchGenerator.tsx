import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Wand2, CheckCircle, AlertTriangle } from "lucide-react";

const SEOBatchGenerator = () => {
  const { toast } = useToast();
  const [running, setRunning] = useState(false);
  const [progress, setProgress] = useState(0);
  const [total, setTotal] = useState(0);
  const [done, setDone] = useState(0);
  const [errors, setErrors] = useState(0);

  const generateSEO = async () => {
    setRunning(true);
    setProgress(0);
    setDone(0);
    setErrors(0);

    // Fetch products missing SEO
    const { data: products } = await supabase
      .from("products")
      .select("id, name, description, brand, hp, sku, category_id")
      .eq("is_active", true)
      .or("meta_title.is.null,meta_title.eq.,meta_description.is.null,meta_description.eq.")
      .limit(500);

    if (!products || products.length === 0) {
      toast({ title: "Todos os produtos já possuem SEO!" });
      setRunning(false);
      return;
    }

    setTotal(products.length);

    // Fetch categories for context
    const { data: categories } = await supabase.from("categories").select("id, name");
    const catMap = Object.fromEntries((categories || []).map(c => [c.id, c.name]));

    let doneCount = 0;
    let errorCount = 0;

    // Process in batches of 5
    for (let i = 0; i < products.length; i += 5) {
      const batch = products.slice(i, i + 5);
      
      await Promise.all(batch.map(async (p) => {
        try {
          const category = p.category_id ? catMap[p.category_id] || "" : "";
          const brandStr = p.brand ? ` ${p.brand}` : "";
          const hpStr = p.hp ? ` ${p.hp}HP` : "";
          
          // Generate SEO data locally (no AI needed for basic SEO)
          const metaTitle = `${p.name}${hpStr}${brandStr} | Grundemann Geradores`.slice(0, 60);
          const metaDesc = `Compre ${p.name}${hpStr}${brandStr}${category ? ` - ${category}` : ""} para motores estacionários. Entrega para todo o Brasil com garantia. ${p.sku ? `Cód: ${p.sku}` : ""}`.slice(0, 160).trim();

          const { error } = await supabase
            .from("products")
            .update({ meta_title: metaTitle, meta_description: metaDesc })
            .eq("id", p.id);

          if (error) throw error;
          doneCount++;
        } catch {
          errorCount++;
        }
      }));

      setDone(doneCount);
      setErrors(errorCount);
      setProgress(Math.round(((doneCount + errorCount) / products.length) * 100));
    }

    setRunning(false);
    toast({ title: `SEO gerado para ${doneCount} produtos!`, description: errorCount > 0 ? `${errorCount} erros` : undefined });
  };

  return (
    <div className="bg-card border border-border rounded-xl p-6 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="font-heading font-bold text-foreground flex items-center gap-2">
            <Wand2 className="h-5 w-5 text-primary" />
            Gerador de SEO em Lote
          </h3>
          <p className="text-sm text-muted-foreground mt-1">
            Gera automaticamente meta title e meta description para produtos sem SEO configurado.
          </p>
        </div>
        <Button onClick={generateSEO} disabled={running}>
          {running ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Wand2 className="h-4 w-4 mr-2" />}
          {running ? "Processando..." : "Gerar SEO"}
        </Button>
      </div>

      {(running || done > 0) && (
        <div className="space-y-2">
          <Progress value={progress} className="h-2" />
          <div className="flex items-center gap-4 text-sm">
            <span className="text-muted-foreground">{done + errors} / {total}</span>
            {done > 0 && <span className="text-primary flex items-center gap-1"><CheckCircle className="h-3.5 w-3.5" /> {done} OK</span>}
            {errors > 0 && <span className="text-destructive flex items-center gap-1"><AlertTriangle className="h-3.5 w-3.5" /> {errors} erros</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SEOBatchGenerator;
