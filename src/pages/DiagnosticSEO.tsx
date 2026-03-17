import { useEffect, useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import ProductCard from "@/components/ProductCard";
import { Stethoscope, AlertTriangle, ChevronRight, Package, Wrench, BookOpen } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const DiagnosticSEO = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [problem, setProblem] = useState<any>(null);
  const [causes, setCauses] = useState<any[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [articles, setArticles] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  const loadData = async () => {
    setLoading(true);
    const { data: prob } = await supabase
      .from("diagnostic_problems")
      .select("*")
      .eq("slug", slug)
      .eq("is_active", true)
      .single();

    if (!prob) { setLoading(false); return; }
    setProblem(prob);

    // Log search for analytics (fire and forget)
    supabase.from("diagnostic_search_logs").insert({ problem_id: prob.id, problem_slug: prob.slug }).then(() => {});

    const [causesRes, tagsRes, kitsRes] = await Promise.all([
      supabase.from("diagnostic_causes").select("*").eq("problem_id", prob.id).order("display_order"),
      supabase.from("diagnostic_product_tags").select("*").eq("problem_id", prob.id),
      supabase.from("maintenance_kits").select("*").eq("problem_id", prob.id).eq("is_active", true),
    ]);

    setCauses(causesRes.data || []);
    setKits(kitsRes.data || []);

    // Load products from tags
    const tags = tagsRes.data || [];
    if (tags.length > 0) {
      const orConditions = tags
        .map((t: any) => `name.ilike.%${t.search_tag}%,tags.cs.{${t.search_tag}}`)
        .join(",");
      const { data: prods } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url, sku, stock_quantity, slug")
        .eq("is_active", true)
        .or(orConditions)
        .limit(12);
      setProducts(prods || []);
    }

    // Related articles
    const { data: arts } = await supabase
      .from("technical_articles")
      .select("id, title, slug, excerpt, image_url")
      .eq("is_published", true)
      .or(`tags.cs.{${prob.slug}},title.ilike.%${prob.name.split(" ").slice(-1)[0]}%`)
      .limit(3);
    setArticles(arts || []);

    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      <Footer />
    </div>
  );

  if (!problem) {
    navigate("/diagnostico");
    return null;
  }

  const title = `${problem.name} – Diagnóstico e Peças | Grundemann Geradores`;
  const desc = `Seu gerador apresenta o problema "${problem.name}"? Veja as possíveis causas, peças recomendadas e kits de reparo. Soluções completas para motores estacionários.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <meta property="og:type" content="article" />
        <link rel="canonical" href={`https://grundemann.com.br/${problem.slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "HowTo",
          "name": `Como resolver: ${problem.name}`,
          "description": desc,
          "step": causes.map((c: any, i: number) => ({
            "@type": "HowToStep",
            "position": i + 1,
            "text": `Verificar: ${c.cause_text}`,
          })),
        })}</script>
      </Helmet>
      <TopBar /><Header /><CategoryNav />

      <div className="flex-1">
        <div className="container py-6 md:py-10">
          <SEOBreadcrumb items={[
            { label: "Diagnóstico", href: "/diagnostico" },
            { label: problem.name },
          ]} />

          {/* Hero */}
          <div className="bg-gradient-to-br from-destructive/5 to-primary/5 rounded-2xl border border-border p-8 md:p-12 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl bg-destructive/10 flex items-center justify-center">
                <Stethoscope className="h-7 w-7 text-destructive" />
              </div>
              <div>
                <Badge variant="destructive" className="mb-1">Diagnóstico Técnico</Badge>
                <h1 className="font-heading text-2xl md:text-4xl font-black text-foreground">{problem.name}</h1>
              </div>
            </div>
            {problem.description && (
              <p className="text-muted-foreground text-lg max-w-3xl">{problem.description}</p>
            )}
          </div>

          {/* Causes */}
          {causes.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 text-accent" /> Possíveis Causas
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {causes.map((c: any, i: number) => (
                  <div key={c.id} className="flex items-start gap-3 p-4 rounded-xl border border-border bg-card">
                    <span className="flex-shrink-0 h-7 w-7 rounded-full bg-accent/10 text-accent font-bold text-sm flex items-center justify-center">{i + 1}</span>
                    <p className="text-foreground font-medium">{c.cause_text}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Recommended products */}
          {products.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" /> Peças Recomendadas
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
                ))}
              </div>
            </section>
          )}

          {/* Kits */}
          {kits.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" /> Kits de Reparo
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {kits.map((k: any) => (
                  <div key={k.id} className="rounded-xl border border-border p-5 bg-card hover:shadow-md transition-shadow">
                    <Badge variant="secondary" className="mb-2 capitalize">{k.kit_type}</Badge>
                    <h3 className="font-heading font-bold">{k.name}</h3>
                    {k.description && <p className="text-xs text-muted-foreground mt-1">{k.description}</p>}
                    {k.discount_pct > 0 && <Badge variant="destructive" className="mt-2">{k.discount_pct}% OFF</Badge>}
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Related articles */}
          {articles.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <BookOpen className="h-6 w-6 text-primary" /> Artigos Relacionados
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {articles.map((a: any) => (
                  <Link key={a.id} to={`/central-tecnica`} className="rounded-xl border border-border p-5 bg-card hover:shadow-md hover:border-primary/30 transition-all group">
                    <h3 className="font-heading font-bold text-foreground group-hover:text-primary transition-colors">{a.title}</h3>
                    {a.excerpt && <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{a.excerpt}</p>}
                    <span className="text-xs text-primary mt-2 flex items-center gap-1">Ler artigo <ChevronRight className="h-3 w-3" /></span>
                  </Link>
                ))}
              </div>
            </section>
          )}

          {/* CTA */}
          <div className="bg-card border border-border rounded-2xl p-8 text-center">
            <h2 className="font-heading text-xl font-bold mb-2">Não encontrou o que precisa?</h2>
            <p className="text-muted-foreground mb-4">Fale com nossos especialistas pelo WhatsApp e receba uma recomendação personalizada.</p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/diagnostico" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-opacity">
                <Stethoscope className="h-4 w-4" /> Diagnóstico Completo
              </Link>
              <Link to="/produtos" className="inline-flex items-center gap-2 px-6 py-3 rounded-xl border border-border text-foreground font-bold hover:bg-muted transition-colors">
                <Package className="h-4 w-4" /> Ver Todas as Peças
              </Link>
            </div>
          </div>
        </div>
      </div>

      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default DiagnosticSEO;
