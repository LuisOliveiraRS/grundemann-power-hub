import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
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

const CategoryPage = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  const [category, setCategory] = useState<Category | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { if (slug) loadCategory(); }, [slug]);

  const loadCategory = async () => {
    const { data: cat } = await supabase.from("categories").select("*").eq("slug", slug).single();
    if (cat) {
      setCategory(cat as Category);
      const { data: prods } = await supabase.from("products").select("*").eq("category_id", cat.id).eq("is_active", true).order("name");
      setProducts((prods || []) as Product[]);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <button onClick={() => navigate("/")} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : !category ? (
            <p className="text-center text-muted-foreground py-12">Categoria não encontrada.</p>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-bold mb-2">{category.name}</h1>
              {category.description && <p className="text-muted-foreground mb-6">{category.description}</p>}
              {products.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum produto nesta categoria ainda.</p>
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
      <Footer />
    </div>
  );
};

export default CategoryPage;
