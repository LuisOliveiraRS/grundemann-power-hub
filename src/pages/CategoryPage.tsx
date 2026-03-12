import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import { ArrowLeft } from "lucide-react";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
}

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Subcategory {
  id: string;
  name: string;
  description: string | null;
  category_id: string;
}

const mergeUniqueProducts = (a: Product[], b: Product[]) => {
  const map = new Map<string, Product>();
  [...a, ...b].forEach((p) => map.set(p.id, p));
  return [...map.values()].sort((x, y) => x.name.localeCompare(y.name));
};

const CategoryPage = () => {
  const { slug, subSlug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [subcategory, setSubcategory] = useState<Subcategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (slug) loadData();
  }, [slug, subSlug]);

  const loadData = async () => {
    setLoading(true);
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).single();
    if (!cat) { setLoading(false); return; }

    setCategory(cat as Category);

    if (subSlug) {
      const { data: sub } = await supabase
        .from("subcategories")
        .select("*")
        .eq("slug", subSlug)
        .eq("category_id", cat.id)
        .single();

      if (!sub) {
        setSubcategory(null);
        setProducts([]);
        setLoading(false);
        return;
      }

      setSubcategory(sub as Subcategory);

      const [directRes, linksRes] = await Promise.all([
        supabase.from("products").select("*").eq("subcategory_id", sub.id).eq("is_active", true),
        supabase.from("product_categories").select("product_id").eq("subcategory_id", sub.id),
      ]);

      const linkedIds = [...new Set((linksRes.data || []).map((l: any) => l.product_id))];
      let linkedProducts: Product[] = [];
      if (linkedIds.length > 0) {
        const { data } = await supabase.from("products").select("*").in("id", linkedIds).eq("is_active", true);
        linkedProducts = (data || []) as Product[];
      }

      setProducts(mergeUniqueProducts((directRes.data || []) as Product[], linkedProducts));
    } else {
      setSubcategory(null);

      const [directRes, linksRes] = await Promise.all([
        supabase.from("products").select("*").eq("category_id", cat.id).eq("is_active", true),
        supabase.from("product_categories").select("product_id").eq("category_id", cat.id),
      ]);

      const linkedIds = [...new Set((linksRes.data || []).map((l: any) => l.product_id))];
      let linkedProducts: Product[] = [];
      if (linkedIds.length > 0) {
        const { data } = await supabase.from("products").select("*").in("id", linkedIds).eq("is_active", true);
        linkedProducts = (data || []) as Product[];
      }

      setProducts(mergeUniqueProducts((directRes.data || []) as Product[], linkedProducts));
    }

    setLoading(false);
  };

  const title = subcategory ? subcategory.name : category?.name;
  const description = subcategory ? subcategory.description : category?.description;

  return (
    <div className="min-h-screen flex flex-col">
      {category && (
        <Helmet>
          <title>{`${title} | Grundemann Power Hub`}</title>
          <meta name="description" content={description || `Compre ${title} na Grundemann Power Hub. Peças para motores estacionários com qualidade e garantia.`} />
          <meta property="og:title" content={`${title} | Grundemann Power Hub`} />
          <meta property="og:description" content={description || `Peças e equipamentos da categoria ${title}`} />
          <meta property="og:type" content="website" />
          <link rel="canonical" href={`https://grundemann-power-hub.lovable.app/categoria/${slug}${subSlug ? `/${subSlug}` : ''}`} />
        </Helmet>
      )}
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <button onClick={() => navigate(subcategory ? `/categoria/${slug}` : "/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> {subcategory ? `Voltar para ${category?.name}` : "Voltar"}
          </button>
          {category && (
            <SEOBreadcrumb items={[
              ...(subcategory ? [{ label: category.name, href: `/categoria/${slug}` }] : []),
              { label: (subcategory?.name || category.name) },
            ]} />
          )}
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : !category ? (
            <p className="text-center text-muted-foreground py-12">Categoria não encontrada.</p>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-bold mb-2">{title}</h1>
              {subcategory && category && (
                <p className="text-sm text-muted-foreground mb-1">{category.name} &gt; {subcategory.name}</p>
              )}
              {description && <p className="text-muted-foreground mb-6">{description}</p>}
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum produto nesta {subcategory ? "subcategoria" : "categoria"} ainda.</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {products.map(p => (
                    <ProductCard
                      key={p.id}
                      id={p.id}
                      name={p.name}
                      image={p.image_url || "/placeholder.svg"}
                      price={p.price}
                      oldPrice={p.original_price || undefined}
                      sku={p.sku || undefined}
                      stockQuantity={p.stock_quantity}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </div>
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default CategoryPage;
