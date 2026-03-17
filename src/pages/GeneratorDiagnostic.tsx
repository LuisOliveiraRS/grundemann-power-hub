import { useState, useEffect } from "react";
import { Link, useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import DiagnosticProblemSelector from "@/components/diagnostic/DiagnosticProblemSelector";
import DiagnosticResults from "@/components/diagnostic/DiagnosticResults";
import { SEOBreadcrumb } from "@/components/SEOBreadcrumb";
import {
  Power, RefreshCw, Zap, AlertTriangle, TrendingDown, Fuel, Volume2,
} from "lucide-react";

const iconMap: Record<string, React.ElementType> = {
  Power, RefreshCw, Zap, AlertTriangle, TrendingDown, Fuel, Volume2,
};

export interface DiagnosticProblem {
  id: string;
  name: string;
  slug: string;
  description: string;
  icon_name: string;
  display_order: number;
}

export interface DiagnosticCause {
  id: string;
  problem_id: string;
  cause_text: string;
  display_order: number;
}

export interface DiagnosticProductTag {
  id: string;
  problem_id: string;
  search_tag: string;
  display_order: number;
}

const GeneratorDiagnostic = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problems, setProblems] = useState<DiagnosticProblem[]>([]);
  const [selectedProblem, setSelectedProblem] = useState<DiagnosticProblem | null>(null);
  const [causes, setCauses] = useState<DiagnosticCause[]>([]);
  const [tags, setTags] = useState<DiagnosticProductTag[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingProducts, setLoadingProducts] = useState(false);

  useEffect(() => {
    supabase
      .from("diagnostic_problems")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        const probs = (data || []) as DiagnosticProblem[];
        setProblems(probs);
        if (slug) {
          const found = probs.find((p) => p.slug === slug);
          if (found) selectProblem(found);
        }
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (slug && problems.length > 0 && !selectedProblem) {
      const found = problems.find((p) => p.slug === slug);
      if (found) selectProblem(found);
    }
  }, [slug, problems]);

  const selectProblem = async (problem: DiagnosticProblem) => {
    setSelectedProblem(problem);
    navigate(`/diagnostico/${problem.slug}`, { replace: true });
    setLoadingProducts(true);

    const [causesRes, tagsRes] = await Promise.all([
      supabase
        .from("diagnostic_causes")
        .select("*")
        .eq("problem_id", problem.id)
        .order("display_order"),
      supabase
        .from("diagnostic_product_tags")
        .select("*")
        .eq("problem_id", problem.id)
        .order("display_order"),
    ]);

    setCauses((causesRes.data || []) as DiagnosticCause[]);
    const problemTags = (tagsRes.data || []) as DiagnosticProductTag[];
    setTags(problemTags);

    // Search products by tags
    if (problemTags.length > 0) {
      const orConditions = problemTags
        .map((t) => `name.ilike.%${t.search_tag}%,description.ilike.%${t.search_tag}%,tags.cs.{${t.search_tag}}`)
        .join(",");

      const { data } = await supabase
        .from("products")
        .select("id, name, price, image_url, sku, brand, hp, slug, original_price, stock_quantity")
        .eq("is_active", true)
        .or(orConditions)
        .limit(20);

      setProducts(data || []);
    } else {
      setProducts([]);
    }
    setLoadingProducts(false);
  };

  const resetSelection = () => {
    setSelectedProblem(null);
    setCauses([]);
    setTags([]);
    setProducts([]);
    navigate("/diagnostico", { replace: true });
  };

  const pageTitle = selectedProblem
    ? `${selectedProblem.name} - Diagnóstico e Peças | Grundemann`
    : "Diagnóstico do Gerador | Grundemann Geradores";

  const pageDesc = selectedProblem
    ? `${selectedProblem.description} Encontre as peças para resolver o problema do seu gerador.`
    : "Selecione o problema do seu gerador e encontre automaticamente as peças necessárias para o reparo.";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{pageTitle}</title>
        <meta name="description" content={pageDesc} />
        <link rel="canonical" href={`https://grundemann.com.br/diagnostico${selectedProblem ? `/${selectedProblem.slug}` : ""}`} />
      </Helmet>
      <TopBar />
      <Header />
      <CategoryNav />

      <main className="flex-1">
        {/* Hero */}
        <section className="bg-gradient-to-br from-secondary via-secondary/95 to-secondary/80 py-12 md:py-16">
          <div className="container">
            <SEOBreadcrumb
              items={[
                { label: "Início", href: "/" },
                { label: "Diagnóstico do Gerador", href: "/diagnostico" },
                ...(selectedProblem ? [{ label: selectedProblem.name }] : []),
              ]}
            />
            <div className="mt-4 text-center max-w-3xl mx-auto">
              <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black text-secondary-foreground">
                🔧 Diagnóstico do Gerador
              </h1>
              <p className="text-secondary-foreground/80 mt-3 text-lg">
                Selecione o problema e receba diagnóstico com causas prováveis e peças recomendadas
              </p>
            </div>
          </div>
        </section>

        <div className="container py-10 md:py-14">
          {!selectedProblem ? (
            <DiagnosticProblemSelector
              problems={problems}
              loading={loading}
              iconMap={iconMap}
              onSelect={selectProblem}
            />
          ) : (
            <DiagnosticResults
              problem={selectedProblem}
              causes={causes}
              tags={tags}
              products={products}
              loadingProducts={loadingProducts}
              iconMap={iconMap}
              onReset={resetSelection}
            />
          )}
        </div>
      </main>

      <Footer />
      <WhatsAppButton />
    </div>
  );
};

export default GeneratorDiagnostic;
