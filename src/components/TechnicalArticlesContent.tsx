import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { BookOpen, Search, ChevronRight, Clock, Stethoscope, Cpu, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
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
  problem_id: string | null;
  model_id: string | null;
}

const categoryColors: Record<string, string> = {
  "Manutenção": "bg-primary/15 text-primary",
  "Diagnóstico": "bg-destructive/15 text-destructive",
  "Dicas": "bg-accent/15 text-accent-foreground",
};

const TechnicalArticlesContent = () => {
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedArticle, setSelectedArticle] = useState<Article | null>(null);
  const [categoryFilter, setCategoryFilter] = useState("");
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [searchResults, setSearchResults] = useState<Article[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [linkedProblem, setLinkedProblem] = useState<any>(null);
  const [linkedModel, setLinkedModel] = useState<any>(null);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

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
      <article>
        <button onClick={() => setSelectedArticle(null)} className="text-primary text-sm mb-4 hover:underline flex items-center gap-1">
          ← Voltar para Artigos
        </button>
        <div className="bg-card rounded-2xl border border-border p-6 mb-6">
          <Badge className={categoryColors[selectedArticle.category] || "bg-muted text-muted-foreground"}>{selectedArticle.category}</Badge>
          <h2 className="font-heading text-2xl md:text-3xl font-black text-foreground mt-3 mb-4">
            {selectedArticle.title}
          </h2>
          <div className="flex items-center gap-4 text-muted-foreground text-sm">
            <span className="flex items-center gap-1"><Clock className="h-4 w-4" /> {selectedArticle.read_time} de leitura</span>
            <span>{new Date(selectedArticle.created_at).toLocaleDateString("pt-BR")}</span>
          </div>
        </div>

        <div className="bg-card rounded-2xl border border-border p-6">
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
        </div>
      </article>
    );
  }

  return (
    <div>
      {/* Search bar */}
      <div className="mb-6 max-w-md relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Buscar artigos..." value={search} onChange={e => setSearch(e.target.value)} className="pl-10" />
      </div>

      {/* Category filters */}
      <div className="flex items-center gap-2 mb-6 flex-wrap">
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
  );
};

export default TechnicalArticlesContent;
