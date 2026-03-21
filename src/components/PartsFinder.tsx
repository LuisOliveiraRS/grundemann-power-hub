import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Search, ChevronRight, Zap, Filter, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const hpOptions = ["5", "7", "8", "9", "10", "13", "15"];

const partTypes = [
  { label: "Filtro de Ar", search: "filtro ar" },
  { label: "Carburador", search: "carburador" },
  { label: "Vela de Ignição", search: "vela" },
  { label: "Filtro de Combustível", search: "filtro combustivel" },
  { label: "Kit de Reparo", search: "kit reparo" },
  { label: "Peças Internas", search: "peca" },
];

interface FoundProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
  sku: string | null;
  hp: string | null;
}

const PartsFinder = () => {
  const [step, setStep] = useState(1);
  const [selectedHp, setSelectedHp] = useState<string | null>(null);
  const [selectedPart, setSelectedPart] = useState<string | null>(null);
  const [results, setResults] = useState<FoundProduct[]>([]);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Search when HP is selected (step 2) to show all parts for that motor
  useEffect(() => {
    if (step === 2 && selectedHp) {
      searchByHp();
    }
  }, [step, selectedHp]);

  useEffect(() => {
    if (step === 3 && selectedHp && selectedPart) {
      searchProducts();
    }
  }, [step]);

  const searchByHp = async () => {
    setLoading(true);
    const { data } = await supabase.rpc("fuzzy_search_products", {
      search_term: "",
      hp_filter: selectedHp,
      result_limit: 12,
    });
    setResults((data || []).map((p: any) => ({
      id: p.id, name: p.name, price: p.price, image_url: p.image_url, sku: p.sku, hp: p.hp,
    })));
    setLoading(false);
  };

  const searchProducts = async () => {
    setLoading(true);
    const partType = partTypes.find(p => p.label === selectedPart);
    const searchTerm = partType?.search || selectedPart || "";

    const { data } = await supabase.rpc("fuzzy_search_products", {
      search_term: searchTerm,
      hp_filter: selectedHp,
      result_limit: 12,
    });

    const mapped = (data || []).map((p: any) => ({
      id: p.id, name: p.name, price: p.price, image_url: p.image_url, sku: p.sku, hp: p.hp,
    }));

    setResults(mapped);
    setLoading(false);
  };

  const reset = () => {
    setStep(1);
    setSelectedHp(null);
    setSelectedPart(null);
    setResults([]);
  };

  return (
    <section className="py-8 md:py-14 bg-muted/30">
      <div className="container px-4">
        <div className="text-center mb-6 md:mb-8">
          <div className="inline-flex items-center gap-2 text-primary font-heading font-bold text-xs md:text-sm uppercase tracking-wider mb-2">
            <Search className="h-4 w-4" />
            Busca Inteligente de Peças
          </div>
          <h2 className="font-heading text-xl md:text-2xl lg:text-3xl font-extrabold text-foreground">
            Encontre a peça certa para seu motor
          </h2>
          <p className="text-muted-foreground mt-1 md:mt-2 text-sm md:text-base">Selecione a potência e o tipo de peça em 3 passos simples</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold transition-colors ${
                step >= s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
              }`}>
                {s}
              </div>
              <span className={`text-xs font-medium hidden sm:inline ${step >= s ? "text-foreground" : "text-muted-foreground"}`}>
                {s === 1 ? "Potência" : s === 2 ? "Peças do Motor" : "Filtrar por Tipo"}
              </span>
              {s < 3 && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
            </div>
          ))}
        </div>

        <div className="max-w-4xl mx-auto">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-xl border border-border p-8 shadow-sm"
              >
                <h3 className="font-heading font-bold text-lg text-card-foreground mb-1 flex items-center gap-2">
                  <Zap className="h-5 w-5 text-primary" />
                  Qual a potência do motor?
                </h3>
                <p className="text-sm text-muted-foreground mb-6">Selecione a potência em HP do seu motor estacionário</p>
                <div className="grid grid-cols-4 sm:grid-cols-7 gap-3">
                  {hpOptions.map(hp => (
                    <button
                      key={hp}
                      onClick={() => { setSelectedHp(hp); setStep(2); }}
                      className={`rounded-lg border-2 p-4 text-center font-heading font-extrabold text-lg transition-all hover:border-primary hover:bg-primary/5 ${
                        selectedHp === hp ? "border-primary bg-primary/10 text-primary" : "border-border text-card-foreground"
                      }`}
                    >
                      {hp}<span className="text-xs font-bold block text-muted-foreground">HP</span>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-xl border border-border p-8 shadow-sm"
              >
                <h3 className="font-heading font-bold text-lg text-card-foreground mb-1 flex items-center gap-2">
                  <Package className="h-5 w-5 text-primary" />
                  Peças para motor {selectedHp}HP
                </h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Mostrando todas as peças compatíveis · <button onClick={reset} className="underline text-primary">Nova busca</button>
                </p>

                {/* Part type filter chips */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="text-xs text-muted-foreground py-1.5">Filtrar por tipo:</span>
                  {partTypes.map(pt => (
                    <button
                      key={pt.label}
                      onClick={() => { setSelectedPart(pt.label); setStep(3); }}
                      className="rounded-full border border-border px-4 py-1.5 text-xs font-semibold hover:border-primary hover:bg-primary/5 text-card-foreground transition-all"
                    >
                      {pt.label}
                    </button>
                  ))}
                </div>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma peça encontrada para motor {selectedHp}HP.</p>
                    <button onClick={() => navigate(`/produtos?busca=${selectedHp}hp`)} className="text-primary font-bold underline">
                      Buscar no catálogo completo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/produto/${p.id}`)}
                        className="rounded-lg border border-border bg-background p-3 hover:shadow-md hover:border-primary/30 transition-all text-left"
                      >
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                          <img src={p.image_url || "/placeholder.svg"} alt={p.name} loading="lazy" className="w-full h-full object-contain p-2" />
                        </div>
                        <p className="text-xs font-semibold text-card-foreground line-clamp-2">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-muted-foreground mt-0.5">Cód: {p.sku}</p>}
                        <p className="text-sm font-heading font-extrabold text-primary mt-1">
                          R$ {p.price.toFixed(2).replace(".", ",")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}

            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="bg-card rounded-xl border border-border p-8 shadow-sm"
              >
                <h3 className="font-heading font-bold text-lg text-card-foreground mb-1 flex items-center gap-2">
                  <Filter className="h-5 w-5 text-primary" />
                  {selectedPart} para motor {selectedHp}HP
                </h3>
                <p className="text-sm text-muted-foreground mb-6">
                  <button onClick={() => setStep(2)} className="underline text-primary">Voltar às peças</button> · <button onClick={reset} className="underline text-primary">Nova busca</button>
                </p>

                {loading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
                  </div>
                ) : results.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-muted-foreground mb-4">Nenhuma peça encontrada com esses filtros.</p>
                    <button onClick={() => navigate(`/produtos?busca=${selectedPart}`)} className="text-primary font-bold underline">
                      Buscar no catálogo completo
                    </button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {results.map(p => (
                      <button
                        key={p.id}
                        onClick={() => navigate(`/produto/${p.id}`)}
                        className="rounded-lg border border-border bg-background p-3 hover:shadow-md hover:border-primary/30 transition-all text-left"
                      >
                        <div className="aspect-square bg-muted rounded-lg overflow-hidden mb-2">
                          <img src={p.image_url || "/placeholder.svg"} alt={p.name} loading="lazy" className="w-full h-full object-contain p-2" />
                        </div>
                        <p className="text-xs font-semibold text-card-foreground line-clamp-2">{p.name}</p>
                        {p.sku && <p className="text-[10px] text-muted-foreground mt-0.5">Cód: {p.sku}</p>}
                        <p className="text-sm font-heading font-extrabold text-primary mt-1">
                          R$ {p.price.toFixed(2).replace(".", ",")}
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
};

export default PartsFinder;
