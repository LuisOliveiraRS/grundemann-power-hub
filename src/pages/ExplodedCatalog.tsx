import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingCart, Search, Fuel, Flame } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";
import { gasolineSections, type CatalogSection } from "@/data/gasolineEngineParts";
import { dieselSections } from "@/data/dieselEngineParts";

const ExplodedCatalog = () => {
  const [engineType, setEngineType] = useState<"gasolina" | "diesel">("gasolina");
  const [selectedSection, setSelectedSection] = useState<CatalogSection | null>(null);
  const [hpFilter, setHpFilter] = useState("");

  const sections = engineType === "gasolina" ? gasolineSections : dieselSections;
  const hpOptions = engineType === "gasolina"
    ? ["", "5.5", "6.5", "7.0", "8.0", "9.0", "13.0", "15.0"]
    : ["", "5.0", "7.0", "10.0", "13.0"];

  const { data: products, isLoading } = useQuery({
    queryKey: ["exploded-products", selectedSection?.searchTerm, hpFilter, engineType],
    queryFn: async () => {
      if (!selectedSection) return [];
      let query = supabase
        .from("products")
        .select("id, name, price, image_url, sku, hp, brand, original_price")
        .eq("is_active", true)
        .ilike("name", `%${selectedSection.searchTerm}%`)
        .limit(12);
      if (hpFilter) query = query.ilike("hp", `%${hpFilter}%`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!selectedSection,
  });

  const handleEngineChange = (value: string) => {
    setEngineType(value as "gasolina" | "diesel");
    setSelectedSection(null);
    setHpFilter("");
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Catálogo Interativo Vista Explodida | Grundemann</title>
        <meta name="description" content="Explore motores estacionários a gasolina e diesel em vista explodida. Clique em cada seção para ver peças compatíveis e comprar." />
      </Helmet>
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-12">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
            <Search className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Catálogo Interativo</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">
            VISTA EXPLODIDA — MOTOR ESTACIONÁRIO
          </h1>
          <p className="text-background/70 max-w-xl mx-auto">
            Selecione o tipo de motor e clique em qualquer seção para ver peças compatíveis e comprar diretamente.
          </p>
        </div>
      </section>

      <div className="flex-1 container py-10">
        {/* Engine type tabs */}
        <Tabs value={engineType} onValueChange={handleEngineChange} className="mb-8">
          <TabsList className="grid w-full max-w-md mx-auto grid-cols-2 h-12">
            <TabsTrigger value="gasolina" className="gap-2 text-sm font-bold data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">
              <Fuel className="h-4 w-4" />
              Motor Gasolina
            </TabsTrigger>
            <TabsTrigger value="diesel" className="gap-2 text-sm font-bold data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground">
              <Flame className="h-4 w-4" />
              Motor Diesel
            </TabsTrigger>
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sections grid (replaces SVG diagram) */}
          <div className="bg-card rounded-2xl border border-border p-6">
            <h2 className="font-heading font-bold text-lg mb-1 text-foreground">
              {engineType === "gasolina" ? "Motor Gasolina" : "Motor Diesel"} — Seções
            </h2>
            <p className="text-muted-foreground text-xs mb-4">Clique em uma seção para ver as peças disponíveis</p>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {sections.map((section) => {
                const isSelected = selectedSection?.id === section.id;
                return (
                  <button
                    key={section.id}
                    onClick={() => {
                      setSelectedSection(section);
                      setHpFilter("");
                    }}
                    className={`relative group text-left p-4 rounded-xl border-2 transition-all duration-200 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-lg shadow-primary/10"
                        : "border-border bg-card hover:border-primary/40 hover:bg-primary/5 hover:shadow-md"
                    }`}
                  >
                    <div className={`inline-flex items-center justify-center w-8 h-8 rounded-lg text-xs font-black mb-2 transition-colors ${
                      isSelected
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground group-hover:bg-primary/20 group-hover:text-primary"
                    }`}>
                      {section.label}
                    </div>
                    <p className={`font-heading font-bold text-sm leading-tight transition-colors ${
                      isSelected ? "text-primary" : "text-foreground group-hover:text-primary"
                    }`}>
                      {section.name}
                    </p>
                    {isSelected && (
                      <motion.div
                        layoutId="section-indicator"
                        className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                        transition={{ type: "spring", bounce: 0.2, duration: 0.4 }}
                      />
                    )}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Products panel */}
          <div>
            <AnimatePresence mode="wait">
              {!selectedSection ? (
                <motion.div
                  key="empty"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="bg-card rounded-2xl border border-border p-8 text-center h-full flex flex-col items-center justify-center"
                >
                  <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                  <h3 className="font-heading font-bold text-lg text-foreground mb-2">Selecione uma seção</h3>
                  <p className="text-muted-foreground text-sm">
                    Clique em uma seção do {engineType === "gasolina" ? "motor a gasolina" : "motor diesel"} para ver os produtos compatíveis.
                  </p>
                </motion.div>
              ) : (
                <motion.div
                  key={`${engineType}-${selectedSection.id}`}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-card rounded-2xl border border-border p-6">
                    <Badge className={`mb-2 ${engineType === "gasolina" ? "bg-primary/15 text-primary" : "bg-secondary/15 text-secondary"}`}>
                      Seção {selectedSection.label} — {engineType === "gasolina" ? "Gasolina" : "Diesel"}
                    </Badge>
                    <h2 className="font-heading font-bold text-xl text-foreground">{selectedSection.name}</h2>
                    <p className="text-muted-foreground text-sm mt-1">{selectedSection.description}</p>

                    {/* HP filter */}
                    <div className="flex flex-wrap gap-2 mt-4">
                      <span className="text-xs text-muted-foreground py-1">Filtrar por potência:</span>
                      {hpOptions.map((hp) => (
                        <button
                          key={hp}
                          onClick={() => setHpFilter(hp)}
                          className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                            hpFilter === hp
                              ? engineType === "gasolina"
                                ? "bg-primary text-primary-foreground"
                                : "bg-secondary text-secondary-foreground"
                              : "bg-muted text-muted-foreground hover:bg-muted/80"
                          }`}
                        >
                          {hp ? `${hp}HP` : "Todos"}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Products list */}
                  {isLoading ? (
                    <div className="flex justify-center py-8">
                      <Loader2 className="h-6 w-6 animate-spin text-primary" />
                    </div>
                  ) : products && products.length > 0 ? (
                    <div className="space-y-3 max-h-[500px] overflow-y-auto pr-1">
                      {products.map((p) => (
                        <Link
                          key={p.id}
                          to={`/produto/${p.id}`}
                          className="flex items-center gap-4 bg-card rounded-xl border border-border p-4 hover:border-primary/30 hover:shadow-md transition-all group"
                        >
                          {p.image_url ? (
                            <img src={p.image_url} alt={p.name} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" loading="lazy" />
                          ) : (
                            <div className="h-16 w-16 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                              <ShoppingCart className="h-6 w-6 text-muted-foreground" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <p className="font-heading font-bold text-sm text-foreground group-hover:text-primary transition-colors truncate">{p.name}</p>
                            <div className="flex items-center gap-2 mt-1">
                              {p.brand && <Badge variant="outline" className="text-[10px]">{p.brand}</Badge>}
                              {p.hp && <Badge variant="outline" className="text-[10px]">{p.hp}</Badge>}
                              {p.sku && <span className="text-[10px] text-muted-foreground">SKU: {p.sku}</span>}
                            </div>
                          </div>
                          <div className="text-right flex-shrink-0">
                            {p.original_price && Number(p.original_price) > p.price && (
                              <p className="text-xs text-muted-foreground line-through">R$ {Number(p.original_price).toFixed(2).replace(".", ",")}</p>
                            )}
                            <p className="font-heading font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  ) : (
                    <div className="bg-card rounded-xl border border-border p-8 text-center">
                      <p className="text-muted-foreground text-sm">
                        Nenhum produto encontrado para "{selectedSection.name}"{hpFilter ? ` ${hpFilter}HP` : ""}.
                      </p>
                      <Link to="/produtos" className="text-primary text-sm mt-2 inline-block hover:underline">
                        Ver todos os produtos →
                      </Link>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default ExplodedCatalog;
