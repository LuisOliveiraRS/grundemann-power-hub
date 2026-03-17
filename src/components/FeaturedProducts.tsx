import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductSkeletons";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
}

const FeaturedProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) setProducts(data as Product[]);
        setLoading(false);
      });
  }, []);

  if (!loading && products.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-8 uppercase tracking-wide">
          Destaques
        </h2>
        {loading ? (
          <ProductGridSkeleton count={8} />
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
      </div>
    </section>
  );
};

export default FeaturedProducts;
