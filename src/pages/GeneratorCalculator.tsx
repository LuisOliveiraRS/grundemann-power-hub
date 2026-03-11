import { useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Calculator, Plus, Trash2, Zap, AlertTriangle, CheckCircle, MessageCircle, Lightbulb } from "lucide-react";

interface Equipment {
  id: string;
  name: string;
  watts: number;
  quantity: number;
}

const commonEquipments = [
  { name: "Lâmpada LED", watts: 10 },
  { name: "Lâmpada Incandescente", watts: 60 },
  { name: "Ventilador", watts: 80 },
  { name: "TV LED 32\"", watts: 70 },
  { name: "TV LED 50\"", watts: 120 },
  { name: "Geladeira", watts: 350 },
  { name: "Freezer Vertical", watts: 400 },
  { name: "Micro-ondas", watts: 1200 },
  { name: "Forno Elétrico", watts: 1500 },
  { name: "Ar Condicionado 9000 BTUs", watts: 900 },
  { name: "Ar Condicionado 12000 BTUs", watts: 1200 },
  { name: "Ar Condicionado 18000 BTUs", watts: 2000 },
  { name: "Chuveiro Elétrico", watts: 5500 },
  { name: "Ferro de Passar", watts: 1000 },
  { name: "Máquina de Lavar", watts: 500 },
  { name: "Bomba d'Água 1/2 CV", watts: 500 },
  { name: "Bomba d'Água 1 CV", watts: 1000 },
  { name: "Computador Desktop", watts: 300 },
  { name: "Notebook", watts: 65 },
  { name: "Furadeira", watts: 600 },
  { name: "Esmerilhadeira", watts: 2200 },
  { name: "Compressor de Ar", watts: 2000 },
  { name: "Soldadora Elétrica", watts: 3500 },
  { name: "Serra Circular", watts: 1800 },
  { name: "Motor Elétrico 1 CV", watts: 1000 },
  { name: "Motor Elétrico 3 CV", watts: 3000 },
  { name: "Motor Elétrico 5 CV", watts: 5000 },
];

const generatorSuggestions = [
  { kva: 2.5, watts: 2000, label: "2.5 kVA", type: "Gasolina", use: "Residencial leve" },
  { kva: 3.5, watts: 2800, label: "3.5 kVA", type: "Gasolina", use: "Residencial" },
  { kva: 5, watts: 4000, label: "5 kVA", type: "Gasolina", use: "Residencial/Comercial" },
  { kva: 6.5, watts: 5200, label: "6.5 kVA", type: "Gasolina/Diesel", use: "Comercial leve" },
  { kva: 8, watts: 6400, label: "8 kVA", type: "Diesel", use: "Comercial" },
  { kva: 10, watts: 8000, label: "10 kVA", type: "Diesel", use: "Comercial/Industrial" },
  { kva: 12, watts: 9600, label: "12 kVA", type: "Diesel", use: "Industrial leve" },
  { kva: 15, watts: 12000, label: "15 kVA", type: "Diesel", use: "Industrial" },
  { kva: 20, watts: 16000, label: "20 kVA", type: "Diesel", use: "Industrial" },
  { kva: 30, watts: 24000, label: "30 kVA", type: "Diesel", use: "Industrial pesado" },
  { kva: 50, watts: 40000, label: "50 kVA", type: "Diesel", use: "Industrial pesado" },
];

const GeneratorCalculator = () => {
  const [equipments, setEquipments] = useState<Equipment[]>([]);
  const [customName, setCustomName] = useState("");
  const [customWatts, setCustomWatts] = useState("");
  const [customQty, setCustomQty] = useState("1");

  const addEquipment = (name: string, watts: number) => {
    const existing = equipments.find(e => e.name === name);
    if (existing) {
      setEquipments(prev => prev.map(e => e.name === name ? { ...e, quantity: e.quantity + 1 } : e));
    } else {
      setEquipments(prev => [...prev, { id: crypto.randomUUID(), name, watts, quantity: 1 }]);
    }
  };

  const addCustom = () => {
    if (!customName || !customWatts) return;
    addEquipment(customName, parseInt(customWatts));
    setCustomName("");
    setCustomWatts("");
    setCustomQty("1");
  };

  const removeEquipment = (id: string) => setEquipments(prev => prev.filter(e => e.id !== id));

  const updateQty = (id: string, qty: number) => {
    if (qty < 1) return removeEquipment(id);
    setEquipments(prev => prev.map(e => e.id === id ? { ...e, quantity: qty } : e));
  };

  const totalWatts = equipments.reduce((s, e) => s + e.watts * e.quantity, 0);
  const safetyMargin = 1.3; // 30% safety margin
  const recommendedWatts = totalWatts * safetyMargin;

  const recommended = generatorSuggestions.find(g => g.watts >= recommendedWatts) || generatorSuggestions[generatorSuggestions.length - 1];
  const alternatives = generatorSuggestions.filter(g => g.watts >= totalWatts).slice(0, 3);

  const whatsAppMsg = `Olá! Usei a calculadora de carga e preciso de um gerador de pelo menos ${recommended?.label || "?"}. Minha carga total é de ${totalWatts}W. Podem me ajudar?`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Calculadora de Carga para Geradores | Gründemann</title>
        <meta name="description" content="Descubra o gerador ideal para suas necessidades. Calculadora interativa de carga elétrica." />
      </Helmet>
      <TopBar />
      <Header />

      <div className="flex-1 bg-muted/30">
        {/* Hero */}
        <div className="bg-gradient-to-br from-primary/10 via-background to-secondary/10 py-12 border-b border-border">
          <div className="container text-center max-w-3xl">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-1.5 rounded-full text-sm font-semibold mb-4">
              <Calculator className="h-4 w-4" /> Ferramenta Gratuita
            </div>
            <h1 className="font-heading text-3xl md:text-4xl font-black text-foreground">
              Calculadora de Carga para Geradores
            </h1>
            <p className="text-muted-foreground mt-3 text-lg">
              Selecione os equipamentos que deseja conectar e descubra o gerador ideal para sua necessidade.
            </p>
          </div>
        </div>

        <div className="container py-8 max-w-6xl">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Left: Equipment selector */}
            <div className="lg:col-span-2 space-y-6">
              {/* Quick add */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-5 border-b border-border">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Lightbulb className="h-5 w-5 text-primary" /> Equipamentos Comuns
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1">Clique para adicionar à sua lista</p>
                </div>
                <div className="p-5">
                  <div className="flex flex-wrap gap-2">
                    {commonEquipments.map(eq => (
                      <button
                        key={eq.name}
                        onClick={() => addEquipment(eq.name, eq.watts)}
                        className="px-3 py-1.5 rounded-full border border-border text-xs font-medium hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
                      >
                        {eq.name} <span className="text-muted-foreground ml-1">({eq.watts}W)</span>
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Custom equipment */}
              <div className="bg-card rounded-xl border border-border shadow-sm p-5">
                <h3 className="font-heading font-bold text-sm mb-3">Adicionar Equipamento Personalizado</h3>
                <div className="flex gap-3">
                  <Input placeholder="Nome do equipamento" value={customName} onChange={e => setCustomName(e.target.value)} className="flex-1" />
                  <Input placeholder="Watts" type="number" value={customWatts} onChange={e => setCustomWatts(e.target.value)} className="w-24" />
                  <Button onClick={addCustom} size="sm"><Plus className="h-4 w-4 mr-1" /> Adicionar</Button>
                </div>
              </div>

              {/* Selected equipment list */}
              <div className="bg-card rounded-xl border border-border shadow-sm">
                <div className="p-5 border-b border-border flex items-center justify-between">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Zap className="h-5 w-5 text-accent-foreground" /> Seus Equipamentos
                  </h2>
                  <Badge variant="secondary" className="text-sm">
                    {equipments.length} {equipments.length === 1 ? "item" : "itens"}
                  </Badge>
                </div>
                {equipments.length === 0 ? (
                  <div className="p-12 text-center">
                    <Zap className="h-12 w-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground">Adicione equipamentos acima para calcular a carga necessária.</p>
                  </div>
                ) : (
                  <div className="divide-y divide-border">
                    {equipments.map(eq => (
                      <div key={eq.id} className="p-4 flex items-center justify-between gap-4">
                        <div className="flex-1 min-w-0">
                          <p className="font-medium text-sm truncate">{eq.name}</p>
                          <p className="text-xs text-muted-foreground">{eq.watts}W por unidade</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="flex items-center border border-border rounded-lg">
                            <button onClick={() => updateQty(eq.id, eq.quantity - 1)} className="px-2 py-1 hover:bg-muted text-sm">−</button>
                            <span className="px-2 text-sm font-bold w-8 text-center">{eq.quantity}</span>
                            <button onClick={() => updateQty(eq.id, eq.quantity + 1)} className="px-2 py-1 hover:bg-muted text-sm">+</button>
                          </div>
                          <span className="text-sm font-bold text-primary w-16 text-right">{(eq.watts * eq.quantity).toLocaleString("pt-BR")}W</span>
                          <button onClick={() => removeEquipment(eq.id)} className="p-1.5 text-destructive hover:bg-destructive/10 rounded-lg transition-colors">
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                    <div className="p-5 bg-muted/30 flex items-center justify-between">
                      <span className="font-heading font-bold text-lg">Carga Total:</span>
                      <span className="font-heading font-black text-2xl text-primary">{totalWatts.toLocaleString("pt-BR")}W</span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Right: Recommendation */}
            <div className="space-y-6">
              <div className={`bg-card rounded-xl border-2 shadow-lg sticky top-20 ${totalWatts > 0 ? "border-primary" : "border-border"}`}>
                <div className="p-5 border-b border-border bg-gradient-to-r from-primary/5 to-transparent">
                  <h2 className="font-heading text-lg font-bold flex items-center gap-2">
                    <Calculator className="h-5 w-5 text-primary" /> Resultado
                  </h2>
                </div>
                <div className="p-5 space-y-4">
                  {totalWatts === 0 ? (
                    <div className="text-center py-6">
                      <Calculator className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                      <p className="text-sm text-muted-foreground">Adicione equipamentos para ver a recomendação</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Carga total</span>
                          <span className="font-bold">{totalWatts.toLocaleString("pt-BR")}W</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Margem de segurança (30%)</span>
                          <span className="font-bold">{Math.round(totalWatts * 0.3).toLocaleString("pt-BR")}W</span>
                        </div>
                        <div className="border-t border-border pt-2 flex justify-between">
                          <span className="font-heading font-bold">Potência mínima</span>
                          <span className="font-heading font-black text-primary">{Math.round(recommendedWatts).toLocaleString("pt-BR")}W</span>
                        </div>
                      </div>

                      <div className="bg-primary/5 border border-primary/20 rounded-xl p-4">
                        <div className="flex items-center gap-2 mb-2">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="font-heading font-bold text-sm">Gerador Recomendado</span>
                        </div>
                        <p className="text-2xl font-heading font-black text-primary">{recommended.label}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="secondary">{recommended.type}</Badge>
                          <Badge variant="outline">{recommended.use}</Badge>
                        </div>
                      </div>

                      {totalWatts > 40000 && (
                        <div className="bg-accent/10 border border-accent/30 rounded-xl p-4 flex gap-3">
                          <AlertTriangle className="h-5 w-5 text-accent-foreground flex-shrink-0 mt-0.5" />
                          <div>
                            <p className="text-sm font-bold text-accent-foreground">Carga elevada</p>
                            <p className="text-xs text-muted-foreground mt-1">Para cargas acima de 50 kVA, recomendamos uma consulta personalizada.</p>
                          </div>
                        </div>
                      )}

                      {alternatives.length > 1 && (
                        <div>
                          <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-2">Opções compatíveis</p>
                          <div className="space-y-2">
                            {alternatives.map(g => (
                              <div key={g.kva} className={`flex items-center justify-between p-3 rounded-lg border ${g.kva === recommended.kva ? "border-primary bg-primary/5" : "border-border"}`}>
                                <div>
                                  <span className="font-bold text-sm">{g.label}</span>
                                  <span className="text-xs text-muted-foreground ml-2">{g.type}</span>
                                </div>
                                <span className="text-xs text-muted-foreground">{g.watts.toLocaleString("pt-BR")}W</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      <div className="space-y-2 pt-2">
                        <a
                          href={`https://wa.me/5551981825748?text=${encodeURIComponent(whatsAppMsg)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="w-full flex items-center justify-center gap-2 bg-[#25D366] hover:bg-[#1da851] text-white font-bold py-3 px-4 rounded-xl transition-colors text-sm"
                        >
                          <MessageCircle className="h-4 w-4" /> Consultar no WhatsApp
                        </a>
                        <Link to="/produtos">
                          <Button variant="outline" className="w-full mt-2">Ver Geradores Disponíveis</Button>
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default GeneratorCalculator;
