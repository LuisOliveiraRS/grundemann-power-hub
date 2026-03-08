import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { Loader2, ShoppingCart, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";

interface EnginePart {
  id: string;
  label: string;
  name: string;
  description: string;
  searchTerm: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

const engineParts: EnginePart[] = [
  { id: "filtro-ar", label: "1", name: "Filtro de Ar", description: "Filtra impurezas do ar antes de entrar no motor", searchTerm: "filtro de ar", x: 15, y: 8, width: 18, height: 14 },
  { id: "carburador", label: "2", name: "Carburador", description: "Mistura ar e combustível na proporção ideal", searchTerm: "carburador", x: 18, y: 25, width: 14, height: 12 },
  { id: "vela", label: "3", name: "Vela de Ignição", description: "Gera a faísca para ignição da mistura", searchTerm: "vela", x: 45, y: 10, width: 10, height: 10 },
  { id: "pistao", label: "4", name: "Pistão e Anéis", description: "Comprime e expande os gases no cilindro", searchTerm: "pistão", x: 42, y: 30, width: 16, height: 16 },
  { id: "biela", label: "5", name: "Biela", description: "Conecta o pistão ao virabrequim", searchTerm: "biela", x: 42, y: 48, width: 14, height: 12 },
  { id: "virabrequim", label: "6", name: "Virabrequim", description: "Converte movimento linear em rotação", searchTerm: "virabrequim", x: 35, y: 62, width: 22, height: 10 },
  { id: "volante", label: "7", name: "Volante Magnético", description: "Gera energia para ignição e partida", searchTerm: "volante", x: 65, y: 20, width: 20, height: 20 },
  { id: "bobina", label: "8", name: "Bobina de Ignição", description: "Transforma tensão para gerar faísca na vela", searchTerm: "bobina", x: 70, y: 45, width: 14, height: 12 },
  { id: "junta-cabecote", label: "9", name: "Junta do Cabeçote", description: "Veda a câmara de combustão", searchTerm: "junta", x: 40, y: 22, width: 16, height: 6 },
  { id: "escapamento", label: "10", name: "Escapamento / Silencioso", description: "Reduz ruído e direciona gases de escape", searchTerm: "escapamento", x: 5, y: 45, width: 16, height: 14 },
  { id: "tanque", label: "11", name: "Tanque de Combustível", description: "Armazena o combustível do motor", searchTerm: "tanque", x: 60, y: 2, width: 22, height: 14 },
  { id: "recoil", label: "12", name: "Partida Retrátil (Recoil)", description: "Sistema de partida manual por corda", searchTerm: "partida retrátil", x: 75, y: 60, width: 16, height: 14 },
];

const ExplodedCatalog = () => {
  const [selectedPart, setSelectedPart] = useState<EnginePart | null>(null);
  const [hpFilter, setHpFilter] = useState("");

  const { data: products, isLoading } = useQuery({
    queryKey: ["exploded-products", selectedPart?.searchTerm, hpFilter],
    queryFn: async () => {
      if (!selectedPart) return [];
      let query = supabase
        .from("products")
        .select("id, name, price, image_url, sku, hp, brand, original_price")
        .eq("is_active", true)
        .ilike("name", `%${selectedPart.searchTerm}%`)
        .limit(8);
      if (hpFilter) query = query.ilike("hp", `%${hpFilter}%`);
      const { data } = await query;
      return data || [];
    },
    enabled: !!selectedPart,
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Catálogo Interativo de Motor Estacionário | Grundemann</title>
        <meta name="description" content="Explore o motor estacionário em vista explodida. Clique em cada peça para ver produtos compatíveis e comprar diretamente." />
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
            MOTOR ESTACIONÁRIO — VISTA EXPLODIDA
          </h1>
          <p className="text-background/70 max-w-xl mx-auto">
            Clique em qualquer peça do motor para ver produtos compatíveis e comprar diretamente.
          </p>
        </div>
      </section>

      <div className="flex-1 container py-10">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Engine diagram */}
          <div className="bg-card rounded-2xl border border-border p-6 relative">
            <h2 className="font-heading font-bold text-lg mb-4 text-foreground">Diagrama do Motor</h2>

            {/* SVG interactive diagram */}
            <div className="relative aspect-square bg-gradient-to-br from-muted to-muted/50 rounded-xl overflow-hidden">
              <svg viewBox="0 0 100 100" className="w-full h-full">
                {/* Engine outline */}
                <rect x="10" y="5" width="80" height="85" rx="4" fill="none" stroke="hsl(var(--border))" strokeWidth="0.5" strokeDasharray="2,2" />

                {/* Parts */}
                {engineParts.map(part => (
                  <g key={part.id} className="cursor-pointer" onClick={() => setSelectedPart(part)}>
                    <rect
                      x={part.x}
                      y={part.y}
                      width={part.width}
                      height={part.height}
                      rx="2"
                      fill={selectedPart?.id === part.id ? "hsl(var(--primary) / 0.2)" : "hsl(var(--muted) / 0.6)"}
                      stroke={selectedPart?.id === part.id ? "hsl(var(--primary))" : "hsl(var(--border))"}
                      strokeWidth={selectedPart?.id === part.id ? "0.8" : "0.4"}
                      className="transition-all duration-200 hover:fill-[hsl(var(--primary)/0.15)] hover:stroke-[hsl(var(--primary))]"
                    />
                    <circle
                      cx={part.x + 3}
                      cy={part.y + 3}
                      r="2.5"
                      fill={selectedPart?.id === part.id ? "hsl(var(--primary))" : "hsl(var(--foreground))"}
                    />
                    <text
                      x={part.x + 3}
                      y={part.y + 4}
                      textAnchor="middle"
                      fill="white"
                      fontSize="2.5"
                      fontWeight="bold"
                    >
                      {part.label}
                    </text>
                    <text
                      x={part.x + part.width / 2}
                      y={part.y + part.height / 2 + 1}
                      textAnchor="middle"
                      fill={selectedPart?.id === part.id ? "hsl(var(--primary))" : "hsl(var(--muted-foreground))"}
                      fontSize="2.2"
                      fontWeight="600"
                    >
                      {part.name}
                    </text>
                  </g>
                ))}
              </svg>
            </div>

            {/* Legend */}
            <div className="mt-4 grid grid-cols-2 sm:grid-cols-3 gap-2">
              {engineParts.map(part => (
                <button
                  key={part.id}
                  onClick={() => setSelectedPart(part)}
                  className={`text-left text-xs p-2 rounded-lg border transition-all ${
                    selectedPart?.id === part.id
                      ? "border-primary bg-primary/5 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/30"
                  }`}
                >
                  <span className="font-bold mr-1">{part.label}.</span> {part.name}
                </button>
              ))}
            </div>
          </div>

          {/* Products panel */}
          <div>
            {!selectedPart ? (
              <div className="bg-card rounded-2xl border border-border p-8 text-center h-full flex flex-col items-center justify-center">
                <Search className="h-16 w-16 text-muted-foreground/30 mb-4" />
                <h3 className="font-heading font-bold text-lg text-foreground mb-2">Selecione uma peça</h3>
                <p className="text-muted-foreground text-sm">Clique em uma peça no diagrama ou na legenda para ver os produtos compatíveis.</p>
              </div>
            ) : (
              <motion.div
                key={selectedPart.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-4"
              >
                <div className="bg-card rounded-2xl border border-border p-6">
                  <Badge className="bg-primary/15 text-primary mb-2">Peça {selectedPart.label}</Badge>
                  <h2 className="font-heading font-bold text-xl text-foreground">{selectedPart.name}</h2>
                  <p className="text-muted-foreground text-sm mt-1">{selectedPart.description}</p>

                  {/* HP filter */}
                  <div className="flex flex-wrap gap-2 mt-4">
                    <span className="text-xs text-muted-foreground py-1">Filtrar por potência:</span>
                    {["", "5", "7", "10", "13", "15"].map(hp => (
                      <button
                        key={hp}
                        onClick={() => setHpFilter(hp)}
                        className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                          hpFilter === hp
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground hover:bg-muted/80"
                        }`}
                      >
                        {hp ? `${hp}HP` : "Todos"}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Products */}
                {isLoading ? (
                  <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
                ) : products && products.length > 0 ? (
                  <div className="space-y-3">
                    {products.map(p => (
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
                    <p className="text-muted-foreground text-sm">Nenhum produto encontrado para "{selectedPart.name}"{hpFilter ? ` ${hpFilter}HP` : ""}.</p>
                    <Link to="/produtos" className="text-primary text-sm mt-2 inline-block hover:underline">
                      Ver todos os produtos →
                    </Link>
                  </div>
                )}
              </motion.div>
            )}
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
