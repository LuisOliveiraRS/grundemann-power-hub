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
import { Cpu, Package, Wrench, Fuel, Gauge } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const ModelSEO = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [model, setModel] = useState<any>(null);
  const [products, setProducts] = useState<any[]>([]);
  const [kits, setKits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadData();
  }, [slug]);

  const loadData = async () => {
    setLoading(true);

    // slug format: brand-model e.g. toyama-tg3800
    // Try to find model by matching name
    const searchName = slug!.replace(/-/g, " ");

    const { data: models } = await supabase
      .from("generator_models")
      .select("*")
      .eq("is_active", true);

    const found = (models || []).find((m: any) => {
      const modelSlug = `${(m.brand || "").toLowerCase()}-${m.name.toLowerCase()}`
        .replace(/[^a-z0-9]+/g, "-").replace(/-+/g, "-").replace(/^-|-$/g, "");
      return modelSlug === slug || m.name.toLowerCase().replace(/[^a-z0-9]+/g, "-") === slug;
    });

    if (!found) { setLoading(false); return; }
    setModel(found);

    // Log search for analytics
    supabase.from("model_search_logs").insert({ model_id: found.id, model_name: found.name }).then(() => {});

    // Load products for this model
    const [prodsRes, kitsRes] = await Promise.all([
      supabase
        .from("product_models")
        .select("product_id, notes, products:product_id(id, name, price, original_price, image_url, sku, stock_quantity, slug)")
        .eq("model_id", found.id),
      supabase
        .from("maintenance_kits")
        .select("*")
        .eq("model_id", found.id)
        .eq("is_active", true),
    ]);

    const prods = (prodsRes.data || [])
      .map((pm: any) => pm.products)
      .filter(Boolean);
    setProducts(prods);
    setKits(kitsRes.data || []);
    setLoading(false);
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      <Footer />
    </div>
  );

  if (!model) {
    navigate("/produtos");
    return null;
  }

  const fullName = `${model.brand || ""} ${model.name}`.trim();
  const title = `Peças para ${fullName} | Grundemann Geradores`;
  const desc = `Encontre todas as peças compatíveis com o ${fullName}. ${products.length} peças disponíveis com entrega para todo o Brasil e garantia.`;

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{title}</title>
        <meta name="description" content={desc} />
        <meta property="og:title" content={title} />
        <meta property="og:description" content={desc} />
        <link rel="canonical" href={`https://grundemann.com.br/pecas/${slug}`} />
        <script type="application/ld+json">{JSON.stringify({
          "@context": "https://schema.org",
          "@type": "CollectionPage",
          "name": title,
          "description": desc,
          "numberOfItems": products.length,
        })}</script>
      </Helmet>
      <TopBar /><Header /><CategoryNav />

      <div className="flex-1">
        <div className="container py-6 md:py-10">
          <SEOBreadcrumb items={[
            { label: "Produtos", href: "/produtos" },
            { label: `Peças ${fullName}` },
          ]} />

          {/* Hero */}
          <div className="bg-gradient-to-br from-primary/5 to-secondary/5 rounded-2xl border border-border p-8 md:p-12 mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                <Cpu className="h-7 w-7 text-primary" />
              </div>
              <div>
                <Badge variant="secondary" className="mb-1">Peças por Modelo</Badge>
                <h1 className="font-heading text-2xl md:text-4xl font-black text-foreground">Peças para {fullName}</h1>
              </div>
            </div>

            <div className="flex flex-wrap gap-3 mt-4">
              {model.brand && <Badge variant="outline" className="gap-1"><Cpu className="h-3 w-3" /> {model.brand}</Badge>}
              {model.hp && <Badge variant="outline" className="gap-1"><Gauge className="h-3 w-3" /> {model.hp} HP</Badge>}
              {model.engine_type && <Badge variant="outline" className="gap-1"><Fuel className="h-3 w-3" /> {model.engine_type}</Badge>}
              {model.displacement_cc && <Badge variant="outline">{model.displacement_cc}cc</Badge>}
              <Badge variant="secondary">{products.length} peça{products.length !== 1 ? "s" : ""} compatíveis</Badge>
            </div>
          </div>

          {/* Products */}
          {products.length > 0 ? (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" /> Peças Compatíveis
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {products.map((p: any) => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
                ))}
              </div>
            </section>
          ) : (
            <div className="text-center py-12">
              <Package className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">Nenhuma peça cadastrada para este modelo ainda.</p>
              <Link to="/produtos" className="text-primary font-bold text-sm mt-2 inline-block">Ver todos os produtos →</Link>
            </div>
          )}

          {/* Kits */}
          {kits.length > 0 && (
            <section className="mb-12">
              <h2 className="font-heading text-xl md:text-2xl font-bold mb-5 flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" /> Kits de Manutenção
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
        </div>
      </div>

      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default ModelSEO;
