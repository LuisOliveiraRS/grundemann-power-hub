import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Camera, Upload, X, Loader2, Search, Package, AlertCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

interface Identification {
  part_type: string;
  description: string;
  brands: string[];
  compatible_hp: string[];
  search_terms: string[];
  confidence: string;
}

interface FoundProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  sku: string | null;
  hp: string | null;
  brand: string | null;
}

const PartIdentifier = () => {
  const [image, setImage] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [identification, setIdentification] = useState<Identification | null>(null);
  const [products, setProducts] = useState<FoundProduct[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  const handleFile = (file: File) => {
    if (!file.type.startsWith("image/")) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      setImage(e.target?.result as string);
      setIdentification(null);
      setProducts([]);
      setError(null);
    };
    reader.readAsDataURL(file);
  };

  const identify = async () => {
    if (!image) return;
    setLoading(true);
    setError(null);

    try {
      const { data, error: fnError } = await supabase.functions.invoke("identify-part", {
        body: { imageBase64: image },
      });

      if (fnError) throw fnError;

      if (data?.identification) {
        setIdentification(data.identification);
        setProducts(data.products || []);
      } else {
        setError(data?.message || "Não foi possível identificar a peça.");
      }
    } catch (err: any) {
      setError(err.message || "Erro ao processar imagem.");
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setImage(null);
    setIdentification(null);
    setProducts([]);
    setError(null);
  };

  const confidenceColor = (c: string) => {
    if (c === "alta") return "text-primary";
    if (c === "media") return "text-accent-foreground";
    return "text-destructive";
  };

  return (
    <section className="py-14 bg-muted/30">
      <div className="container">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-heading font-bold text-sm uppercase tracking-wider mb-2">
            <Camera className="h-4 w-4" />
            Identificador de Peças por Foto
          </div>
          <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
            Envie uma foto e descubra a peça
          </h2>
          <p className="text-muted-foreground mt-2 max-w-lg mx-auto">
            Nossa IA analisa a foto e identifica o tipo de peça, marcas compatíveis e sugere produtos do catálogo
          </p>
        </div>

        <div className="max-w-2xl mx-auto">
          <div className="bg-card rounded-xl border border-border p-8 shadow-sm">
            {!image ? (
              <div
                onClick={() => fileRef.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
                className="border-2 border-dashed border-border rounded-xl p-12 text-center cursor-pointer hover:border-primary/50 hover:bg-muted/30 transition-all"
              >
                <Upload className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <p className="font-heading font-bold text-foreground mb-1">Arraste a foto da peça aqui</p>
                <p className="text-sm text-muted-foreground">ou clique para selecionar</p>
                <p className="text-xs text-muted-foreground mt-2">JPG, PNG ou WebP</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
              </div>
            ) : (
              <div>
                <div className="relative mb-4">
                  <img src={image} alt="Peça enviada" className="w-full max-h-80 object-contain rounded-lg bg-muted" />
                  <button onClick={reset} className="absolute top-2 right-2 h-8 w-8 rounded-full bg-card/80 backdrop-blur-sm flex items-center justify-center text-muted-foreground hover:text-foreground border border-border">
                    <X className="h-4 w-4" />
                  </button>
                </div>

                {!identification && !loading && !error && (
                  <Button onClick={identify} className="w-full" size="lg">
                    <Search className="h-5 w-5 mr-2" />
                    Identificar Peça
                  </Button>
                )}

                {loading && (
                  <div className="flex items-center justify-center gap-3 py-6">
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    <span className="font-medium text-muted-foreground">Analisando imagem com IA...</span>
                  </div>
                )}

                {error && (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-destructive/10 text-destructive mb-4">
                    <AlertCircle className="h-5 w-5 flex-shrink-0" />
                    <p className="text-sm">{error}</p>
                  </div>
                )}

                <AnimatePresence>
                  {identification && (
                    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-4 space-y-4">
                      {/* Identification result */}
                      <div className="bg-muted/30 rounded-lg p-5 border border-border">
                        <div className="flex items-center justify-between mb-3">
                          <h3 className="font-heading font-bold text-lg text-foreground">
                            {identification.part_type}
                          </h3>
                          <span className={`text-xs font-bold uppercase ${confidenceColor(identification.confidence)}`}>
                            Confiança: {identification.confidence}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground mb-3">{identification.description}</p>
                        <div className="flex flex-wrap gap-2">
                          {identification.compatible_hp?.map(hp => (
                            <span key={hp} className="px-2 py-1 rounded-md bg-primary/10 text-primary text-xs font-bold">{hp}HP</span>
                          ))}
                          {identification.brands?.map(brand => (
                            <span key={brand} className="px-2 py-1 rounded-md bg-secondary/10 text-secondary text-xs font-bold">{brand}</span>
                          ))}
                        </div>
                      </div>

                      {/* Product suggestions */}
                      {products.length > 0 && (
                        <div>
                          <h4 className="font-heading font-bold text-sm text-foreground mb-3">Produtos compatíveis no catálogo:</h4>
                          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                            {products.map(p => (
                              <button
                                key={p.id}
                                onClick={() => navigate(`/produto/${p.id}`)}
                                className="rounded-lg border border-border bg-background p-3 hover:shadow-md hover:border-primary/30 transition-all text-left"
                              >
                                <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                                  {p.image_url ? (
                                    <img src={p.image_url} alt={p.name} className="w-full h-full object-contain p-2" />
                                  ) : (
                                    <div className="w-full h-full flex items-center justify-center"><Package className="h-8 w-8 text-muted-foreground" /></div>
                                  )}
                                </div>
                                <p className="text-xs font-semibold text-card-foreground line-clamp-2">{p.name}</p>
                                <p className="text-sm font-heading font-extrabold text-price mt-1">
                                  R$ {p.price.toFixed(2).replace(".", ",")}
                                </p>
                              </button>
                            ))}
                          </div>
                        </div>
                      )}

                      <Button onClick={reset} variant="outline" className="w-full">
                        Nova Identificação
                      </Button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
};

export default PartIdentifier;
