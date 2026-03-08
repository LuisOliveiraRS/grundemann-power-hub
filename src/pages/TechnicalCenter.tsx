import { useState, useEffect } from "react";
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
import { supabase } from "@/integrations/supabase/client";

interface Article {
  id: string;
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  read_time: string;
  created_at: string;
  tags: string[];
  content: string;
  image_url: string | null;
}

const categoryColors: Record<string, string> = {
  "Manutenção": "bg-primary/15 text-primary",
  "Diagnóstico": "bg-destructive/15 text-destructive",
  "Dicas": "bg-accent/15 text-accent-foreground",
};

const TechnicalCenter = () => {
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);

  useEffect(() => {
    const fetchArticles = async () => {
      const { data } = await supabase
        .from("technical_articles")
        .select("*")
        .eq("is_published", true)
        .order("created_at", { ascending: false });
      setAllArticles((data as Article[]) || []);
      setLoading(false);
    };
    fetchArticles();
  }, []);

  // Full-text search with debounce
  useEffect(() => {
    if (!search || search.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(async () => {
      const { data } = await supabase.rpc("search_articles", { search_query: search });
      setSearchResults((data as Article[]) || []);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const articles = searchResults !== null ? searchResults : allArticles;
  
  const filteredArticles = articles.filter(a => {
    if (categoryFilter && a.category !== categoryFilter) return false;
    return true;
  });

  const categories = [...new Set(allArticles.map(a => a.category))];

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
              <Badge className={categoryColors[selectedArticle.category] || "bg-muted text-muted-foreground"}>{selectedArticle.category}</Badge>
              <h1 className="font-heading text-3xl md:text-4xl font-black text-background mt-3 mb-4">
                {selectedArticle.title}
              </h1>
              <div className="flex items-center gap-4 text-background/60 text-sm">
                <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedArticle.read_time} de leitura</span>
                <span>{new Date(selectedArticle.created_at).toLocaleDateString("pt-BR")}</span>
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
                if (line.match(/^\d+\. /)) return <li key={i}>{line.replace(/^\d+\.\s/, "")}</li>;
                if (line.startsWith("|")) return null;
                if (line.trim() === "") return <br key={i} />;
                return <p key={i}>{line}</p>;
              })}
            </div>

            <div className="mt-10 pt-6 border-t border-border">
              <p className="text-sm text-muted-foreground mb-2">Tags:</p>
              <div className="flex flex-wrap gap-2">
                {selectedArticle.tags.map(tag => (
                  <Badge key={tag} variant="outline" className="text-xs">{tag}</Badge>
                ))}
              </div>
            </div>

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

      <section className="bg-gradient-to-br from-foreground via-secondary to-foreground py-16">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-4">
            <BookOpen className="h-4 w-4 text-primary" />
            <span className="text-xs font-bold uppercase tracking-wider text-primary">Base de Conhecimento</span>
          </div>
          <h1 className="font-heading text-3xl md:text-4xl font-black text-background mb-3">
            CENTRAL TÉCNICA GRUNDEMANN
          </h1>
          <p className="text-background/60 max-w-2xl mx-auto">
            Guias completos de manutenção, diagnóstico e reparo para motores estacionários de 5HP a 15HP
          </p>
          <div className="mt-6 max-w-md mx-auto relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-background" />
          </div>
        </div>
      </section>

      <main className="flex-1 py-10">
        <div className="container">
          <div className="flex items-center gap-2 mb-8 flex-wrap">
            <button onClick={() => setCategoryFilter("")} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${!categoryFilter ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
              Todos
            </button>
            {categories.map(cat => (
              <button key={cat} onClick={() => setCategoryFilter(cat)} className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors ${categoryFilter === cat ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:bg-muted/80"}`}>
                {cat}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex justify-center py-16">
              <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
            </div>
          ) : filteredArticles.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <BookOpen className="h-12 w-12 mx-auto mb-3 opacity-30" />
              <p>Nenhum artigo encontrado</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredArticles.map((article, i) => (
                <motion.button
                  key={article.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  onClick={() => setSelectedArticle(article)}
                  className="text-left bg-card rounded-xl border border-border overflow-hidden hover:shadow-lg hover:border-primary/30 transition-all group"
                >
                  {article.image_url && (
                    <div className="aspect-video bg-muted overflow-hidden">
                      <img src={article.image_url} alt={article.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    </div>
                  )}
                  <div className="p-5">
                    <div className="flex items-center gap-2 mb-3">
                      <Badge className={`text-[10px] ${categoryColors[article.category] || "bg-muted text-muted-foreground"}`}>{article.category}</Badge>
                      <span className="text-[10px] text-muted-foreground flex items-center gap-1"><Clock className="h-3 w-3" /> {article.read_time}</span>
                    </div>
                    <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors line-clamp-2">{article.title}</h3>
                    <p className="text-sm text-muted-foreground mt-2 line-clamp-2">{article.excerpt}</p>
                    <div className="flex flex-wrap gap-1 mt-3">
                      {article.tags.slice(0, 3).map(tag => (
                        <span key={tag} className="text-[10px] bg-muted px-2 py-0.5 rounded-full text-muted-foreground">{tag}</span>
                      ))}
                    </div>
                    <span className="inline-flex items-center gap-1 text-primary text-sm font-medium mt-4">
                      Ler artigo <ChevronRight className="h-4 w-4" />
                    </span>
                  </div>
                </motion.button>
              ))}
            </div>
          )}
        </div>
      </main>

      <WhatsAppButton />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default TechnicalCenter;
