import { useState } from "react";
import { Link } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion } from "framer-motion";
import { BookOpen, Wrench, Search, ChevronRight, Clock, Tag } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import AIAssistant from "@/components/AIAssistant";

interface Article {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  readTime: string;
  date: string;
  tags: string[];
  content: string;
}

const articles: Article[] = [
  {
    slug: "como-regular-carburador-motor-estacionario",
    title: "Como Regular o Carburador de Motor Estacionário",
    excerpt: "Guia completo para regulagem do carburador em motores estacionários a gasolina de 5HP a 15HP. Aprenda o passo a passo para uma regulagem perfeita.",
    category: "Manutenção",
    readTime: "8 min",
    date: "2026-03-01",
    tags: ["carburador", "regulagem", "motor estacionário", "manutenção"],
    content: `## Por que regular o carburador?

O carburador é responsável pela mistura ar-combustível que alimenta o motor. Uma regulagem incorreta pode causar:

- **Consumo excessivo** de combustível
- **Perda de potência** do motor
- **Motor falhando** ou morrendo
- **Fumaça preta** no escapamento
- **Dificuldade para dar partida**

## Ferramentas Necessárias

- Chave de fenda pequena (philips e fenda)
- Conta-giros (opcional, mas recomendado)
- Limpa carburador em spray
- Pano limpo

## Passo a Passo da Regulagem

### 1. Aqueça o Motor
Ligue o motor e deixe funcionando por 3-5 minutos até atingir a temperatura de trabalho. A regulagem deve ser feita com o motor quente.

### 2. Localize os Parafusos de Regulagem
A maioria dos carburadores de motores estacionários possui dois parafusos:
- **Parafuso de mistura (ar/combustível)**: controla a proporção da mistura
- **Parafuso de marcha lenta**: controla a rotação em marcha lenta

### 3. Regule a Mistura
1. Gire o parafuso de mistura totalmente no sentido horário (fechado)
2. Abra 1,5 volta no sentido anti-horário como ponto de partida
3. Ajuste lentamente até o motor funcionar de forma suave e estável

### 4. Ajuste a Marcha Lenta
1. Com o motor em marcha lenta, ajuste o parafuso até obter uma rotação estável
2. A rotação ideal varia conforme o motor (geralmente entre 1400-1800 RPM)

### 5. Teste Final
Acelere e desacelere o motor algumas vezes. Ele deve responder rapidamente sem engasgar.

## Dicas Importantes

- Nunca regule o carburador com o filtro de ar sujo
- Troque o filtro de ar antes da regulagem se necessário
- Use combustível fresco (gasolina com menos de 30 dias)
- Se o carburador estiver muito sujo, faça uma limpeza completa antes

## Quando Trocar o Carburador?

Se após a regulagem o motor continuar com problemas, pode ser necessário trocar o carburador. Sinais de carburador com defeito:
- Vazamento de combustível
- Boia furada
- Agulha desgastada
- Corpo trincado`
  },
  {
    slug: "como-trocar-filtro-de-ar-motor-estacionario",
    title: "Como Trocar o Filtro de Ar do Motor Estacionário",
    excerpt: "Aprenda quando e como trocar o filtro de ar do seu motor estacionário. Procedimento simples que garante maior vida útil e performance do motor.",
    category: "Manutenção",
    readTime: "5 min",
    date: "2026-02-20",
    tags: ["filtro de ar", "troca", "manutenção preventiva"],
    content: `## Importância do Filtro de Ar

O filtro de ar protege o motor contra partículas de poeira, sujeira e detritos que podem causar desgaste prematuro nos cilindros e pistões.

## Quando Trocar?

- **A cada 50 horas** de uso em condições normais
- **A cada 25 horas** em ambientes com muita poeira
- Quando o filtro estiver visivelmente sujo ou danificado
- Se o motor apresentar perda de potência

## Tipos de Filtro

### Filtro de Espuma
- Comum em motores menores (5HP-7HP)
- Pode ser lavado e reutilizado algumas vezes
- Trocar quando a espuma começar a se deteriorar

### Filtro de Papel
- Comum em motores maiores (10HP-15HP)
- NÃO pode ser lavado
- Deve ser substituído quando sujo

## Passo a Passo

1. **Desligue o motor** e aguarde esfriar
2. **Remova a tampa** do filtro de ar (geralmente fixada por parafuso borboleta)
3. **Retire o filtro** usado com cuidado
4. **Limpe o compartimento** com pano seco
5. **Instale o filtro novo** na posição correta
6. **Recoloque a tampa** e aperte firmemente

## Dica de Economia

Em motores com filtro de espuma, lave com detergente neutro, seque bem e aplique algumas gotas de óleo de motor limpo antes de reinstalar.`
  },
  {
    slug: "diagnostico-motor-estacionario-nao-liga",
    title: "Motor Estacionário Não Liga: Diagnóstico Completo",
    excerpt: "Seu motor estacionário não liga? Veja as principais causas e soluções para resolver o problema rapidamente.",
    category: "Diagnóstico",
    readTime: "10 min",
    date: "2026-02-15",
    tags: ["diagnóstico", "motor não liga", "solução de problemas"],
    content: `## Checklist Rápido

Antes de entrar em pânico, verifique estes itens básicos:

1. ✅ Há combustível no tanque?
2. ✅ O registro de combustível está aberto?
3. ✅ O interruptor está na posição "ON"?
4. ✅ O afogador está na posição correta?

## Causas Mais Comuns

### 1. Problema na Vela de Ignição
**Sintomas**: Motor gira mas não pega
**Solução**:
- Remova a vela e verifique se há faísca
- Limpe ou troque a vela se estiver suja/desgastada
- Verifique o gap (distância entre eletrodos): geralmente 0,6-0,7mm

### 2. Combustível Velho
**Sintomas**: Motor tenta ligar mas falha
**Solução**:
- Drene o combustível antigo (mais de 30 dias)
- Abasteça com gasolina fresca
- Limpe o carburador se necessário

### 3. Filtro de Ar Entupido
**Sintomas**: Motor sufoca e não consegue funcionar
**Solução**:
- Remova e inspecione o filtro
- Limpe ou substitua conforme o tipo

### 4. Carburador Entupido
**Sintomas**: Não chega combustível ao motor
**Solução**:
- Verifique se há combustível chegando ao carburador
- Limpe os giclês com limpa carburador
- Verifique a boia e a agulha

### 5. Bobina de Ignição Defeituosa
**Sintomas**: Sem faísca na vela
**Solução**:
- Teste com um multímetro
- Substitua se defeituosa

### 6. Válvula de Combustível Obstruída
**Sintomas**: Combustível não flui do tanque
**Solução**:
- Desconecte a mangueira e verifique o fluxo
- Limpe ou substitua a válvula

## Quando Procurar um Profissional?

Se após verificar todos os itens acima o motor continuar sem funcionar, pode haver um problema mais sério como:
- Compressão baixa (anéis ou válvulas gastas)
- Problema no volante magnético
- Dano interno no motor`
  },
  {
    slug: "motor-falhando-causas-solucoes",
    title: "Motor Estacionário Falhando: Causas e Soluções",
    excerpt: "Motor falhando, engasgando ou com funcionamento irregular? Descubra as causas mais comuns e como resolver cada uma delas.",
    category: "Diagnóstico",
    readTime: "7 min",
    date: "2026-02-10",
    tags: ["motor falhando", "diagnóstico", "reparo"],
    content: `## Identificando o Tipo de Falha

### Falha Constante
O motor falha de forma regular e previsível. Geralmente indica problema em um componente específico.

### Falha Intermitente
O motor falha de vez em quando, sem padrão. Pode ser mais difícil de diagnosticar.

### Falha Sob Carga
O motor funciona bem em marcha lenta mas falha quando exigido. Indica problema no sistema de alimentação.

## Causas e Soluções

### 1. Vela de Ignição com Defeito
A vela pode estar funcionando parcialmente, produzindo faísca fraca.
- **Solução**: Troque a vela por uma nova do modelo correto

### 2. Carburador Desregulado
Mistura muito rica (excesso de combustível) ou muito pobre (falta de combustível).
- **Solução**: Regule o parafuso de mistura do carburador

### 3. Ar no Sistema de Combustível
Entrada de ar nas mangueiras ou conexões.
- **Solução**: Verifique e substitua mangueiras danificadas

### 4. Governador Desajustado
O governador controla a rotação do motor. Se desajustado, causa oscilação.
- **Solução**: Ajuste conforme manual do fabricante

### 5. Filtro de Combustível Sujo
Restringe o fluxo de combustível para o carburador.
- **Solução**: Substitua o filtro de combustível

## Tabela de Diagnóstico Rápido

| Sintoma | Causa Provável | Solução |
|---------|---------------|---------|
| Falha constante | Vela ruim | Trocar vela |
| Oscila rotação | Governador | Ajustar governador |
| Falha sob carga | Carburador | Regular carburador |
| Falha e fumaça | Mistura rica | Limpar filtro de ar |`
  },
  {
    slug: "manutencao-preventiva-motores-estacionarios",
    title: "Guia Completo de Manutenção Preventiva para Motores Estacionários",
    excerpt: "Cronograma completo de manutenção preventiva para motores estacionários de 5HP a 15HP. Aumente a vida útil do seu motor seguindo estas recomendações.",
    category: "Manutenção",
    readTime: "12 min",
    date: "2026-01-28",
    tags: ["manutenção preventiva", "cronograma", "vida útil"],
    content: `## Por que Fazer Manutenção Preventiva?

A manutenção preventiva regular pode:
- **Dobrar** a vida útil do motor
- **Reduzir** custos com reparos emergenciais
- **Manter** a performance original
- **Evitar** paradas não programadas

## Cronograma de Manutenção

### Antes de Cada Uso
- Verificar nível de óleo
- Verificar nível de combustível
- Inspecionar visualmente vazamentos
- Verificar aperto dos parafusos

### A Cada 25 Horas
- Limpar filtro de ar (espuma)
- Verificar vela de ignição
- Verificar cabo do acelerador

### A Cada 50 Horas
- Trocar óleo do motor
- Trocar filtro de ar (papel)
- Limpar tanque de combustível
- Verificar mangueiras

### A Cada 100 Horas
- Trocar vela de ignição
- Verificar/ajustar válvulas
- Limpar carburador
- Verificar sistema de arrefecimento

### A Cada 300 Horas
- Trocar filtro de combustível
- Verificar compressão
- Inspecionar volante magnético
- Verificar desgaste geral

## Tabela de Óleo Recomendado

| Temperatura | Tipo de Óleo |
|-------------|-------------|
| Acima de 10°C | SAE 30 |
| -5°C a 30°C | SAE 10W-30 |
| Abaixo de 5°C | SAE 5W-30 |

## Armazenamento Prolongado

Se o motor ficará parado por mais de 30 dias:
1. Drene todo o combustível
2. Troque o óleo
3. Remova a vela e aplique óleo no cilindro
4. Armazene em local seco e coberto
5. Desconecte a bateria (se aplicável)

## Kit de Manutenção Básico

Todo proprietário de motor estacionário deve ter:
- Óleo do motor (SAE 10W-30 multiviscoso)
- Vela de ignição sobressalente
- Filtro de ar sobressalente
- Chaves de boca e fenda
- Limpa carburador em spray
- Funil para óleo`
  },
];

const categoryColors: Record<string, string> = {
  "Manutenção": "bg-primary/15 text-primary",
  "Diagnóstico": "bg-destructive/15 text-destructive",
};

const TechnicalCenter = () => {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");

  const filteredArticles = articles.filter(a => {
    if (categoryFilter && a.category !== categoryFilter) return false;
    if (search) {
      const s = search.toLowerCase();
      return a.title.toLowerCase().includes(s) || a.excerpt.toLowerCase().includes(s) || a.tags.some(t => t.includes(s));
    }
    return true;
  });

  const categories = [...new Set(articles.map(a => a.category))];

  if (selectedArticle) {
    return (
      <div className="min-h-screen flex flex-col">
        <Helmet>
          <title>{selectedArticle.title} | Central Técnica Grundemann</title>
          <meta name="description" content={selectedArticle.excerpt} />
          <link rel="canonical" href={`https://grundemann-power-hub.lovable.app/central-tecnica/${selectedArticle.slug}`} />
        </Helmet>
        <TopBar />
        <Header />

        <article className="flex-1">
          <div className="bg-gradient-to-br from-foreground to-secondary py-12">
            <div className="container max-w-4xl">
              <button onClick={() => setSelectedArticle(null)} className="text-primary text-sm mb-4 hover:underline flex items-center gap-1">
                ← Voltar para Central Técnica
              </button>
              <Badge className={categoryColors[selectedArticle.category] || ""}>{selectedArticle.category}</Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-black text-background mt-3 mb-4">
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-4 text-background/60 text-sm">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedArticle.readTime} de leitura</span>
                <span>{new Date(selectedArticle.date).toLocaleDateString("pt-BR")}</span>
              </div>
            </div>
          </div>

          <div className="container max-w-4xl py-10">
            <div className="prose prose-lg max-w-none
              prose-headings:font-heading prose-headings:text-foreground
              prose-h2:text-2xl prose-h2:mt-10 prose-h2:mb-4 prose-h2:border-b prose-h2:border-border prose-h2:pb-2
              prose-h3:text-xl prose-h3:mt-6 prose-h3:mb-3
              prose-p:text-muted-foreground prose-p:leading-relaxed
              prose-li:text-muted-foreground
              prose-strong:text-foreground
              prose-table:border prose-table:border-border
              prose-th:bg-muted prose-th:p-3 prose-th:text-foreground prose-th:text-left
              prose-td:p-3 prose-td:border-t prose-td:border-border prose-td:text-muted-foreground
            ">
              {selectedArticle.content.split("\n").map((line, i) => {
                if (line.startsWith("## ")) return <h2 key={i}>{line.slice(3)}</h2>;
                if (line.startsWith("### ")) return <h3 key={i}>{line.slice(4)}</h3>;
                if (line.startsWith("- **")) {
                  const match = line.match(/- \*\*(.+?)\*\*:?\s*(.*)/);
                  if (match) return <li key={i}><strong>{match[1]}</strong>{match[2] ? `: ${match[2]}` : ""}</li>;
                }
                if (line.startsWith("- ")) return <li key={i}>{line.slice(2)}</li>;
                if (line.startsWith("1. ") || line.match(/^\d+\. /)) return <li key={i}>{line.replace(/^\d+\.\s/, "")}</li>;
                if (line.startsWith("|")) return null; // skip table rows for now
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>

            {/* Tags */}
            <div className="mt-10 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="mt-10 bg-primary/5 border border-primary/20 rounded-xl p-6 text-center">
              <h3 className="font-heading font-bold text-lg text-foreground mb-2">Precisa de peças para o seu motor?</h3>
              <p className="text-muted-foreground text-sm mb-4">Encontre filtros, carburadores, velas e mais no nosso catálogo completo.</p>
              <div className="flex justify-center gap-3">
                <Link to="/produtos" className="inline-flex items-center gap-2 bg-primary text-primary-foreground px-6 py-2.5 rounded-lg font-medium hover:bg-primary/90 transition-colors">
                  Ver Produtos
                </Link>
                <a href="https://wa.me/5500000000000?text=Olá, preciso de ajuda técnica com meu motor estacionário" target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 border border-primary text-primary px-6 py-2.5 rounded-lg font-medium hover:bg-primary/5 transition-colors">
                  Falar com Técnico
                </a>
              </div>
            </div>
          </div>
        </article>

        <WhatsAppButton />
        <AIAssistant />
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>Central Técnica | Grundemann - Artigos e Guias de Motores Estacionários</title>
        <meta name="description" content="Artigos técnicos sobre manutenção, diagnóstico e reparo de motores estacionários. Guias completos para mecânicos e proprietários." />
        <link rel="canonical" href="https://grundemann-power-hub.lovable.app/central-tecnica" />
      </Helmet>
      <TopBar />
      <Header />

      {/* Hero */}
      <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-16">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Base de Conhecimento</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">
            CENTRAL TÉCNICA GRUNDEMANN
          </h1>
          <p className="text-background/70 max-w-xl mx-auto">
            Artigos técnicos, guias de manutenção e diagnóstico para motores estacionários de 5HP a 15HP.
          </p>
        </div>
      </section>

      <div className="flex-1 container py-10">
        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-8">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input className="pl-9" placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} />
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCategoryFilter("")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat === categoryFilter ? "" : cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Articles grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredArticles.map((article, i) => (
            <motion.div
              key={article.slug}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <button
                onClick={() => setSelectedArticle(article)}
                className="text-left w-full bg-card rounded-xl border border-border hover:border-primary/30 hover:shadow-lg transition-all duration-300 overflow-hidden group"
              >
                <div className="bg-gradient-to-br from-foreground to-secondary p-6">
                  <Badge className={`${categoryColors[article.category] || ""} mb-3`}>{article.category}</Badge>
                  <h2 className="font-heading font-bold text-lg text-background group-hover:text-primary transition-colors leading-tight">
                    {article.title}
                  </h2>
                </div>
                <div className="p-5">
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{article.excerpt}</p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Clock className="h-3 w-3" /> {article.readTime}</span>
                      <span>{new Date(article.date).toLocaleDateString("pt-BR")}</span>
                    </div>
                    <ChevronRight className="h-4 w-4 text-primary opacity-0 group-hover:opacity-100 transition-opacity" />
                  </div>
                </div>
              </button>
            </motion.div>
          ))}
        </div>

        {filteredArticles.length === 0 && (
          <div className="text-center py-16 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
            <p>Nenhum artigo encontrado para esta busca.</p>
          </div>
        )}
      </div>

      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default TechnicalCenter;
