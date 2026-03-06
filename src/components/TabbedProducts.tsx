import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "./ProductCard";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
  created_at: string;
}

const TabbedProducts = () => {
  const [activeTab, setActiveTab] = useState<"featured" | "new" | "bestsellers">("featured");
  const [featured, setFeatured] = useState<Product[]>([]);
  const [newest, setNewest] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const [featRes, newRes] = await Promise.all([
        supabase.from("products").select("*").eq("is_active", true).eq("is_featured", true).order("created_at", { ascending: false }).limit(8),
        supabase.from("products").select("*").eq("is_active", true).order("created_at", { ascending: false }).limit(8),
      ]);
      setFeatured((featRes.data || []) as Product[]);
      setNewest((newRes.data || []) as Product[]);
      setLoading(false);
    };
    load();
  }, []);

  const tabs = [
    { key: "featured" as const, label: "Destaques" },
    { key: "new" as const, label: "Novos Produtos" },
    { key: "bestsellers" as const, label: "Mais Vendidos" },
  ];

  const products = activeTab === "featured" ? featured : activeTab === "new" ? newest : featured;

  if (!loading && featured.length === 0 && newest.length === 0) return null;

  return (
    <section className="py-12">
      <div className="container">
        <div className="flex items-center justify-center gap-1 mb-8 border-b border-border">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-6 py-3 font-heading text-sm font-bold uppercase tracking-wider transition-all border-b-2 -mb-px ${
                activeTab === tab.key
                  ? "border-primary text-primary"
                  : "border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {loading ? (
          <div className="flex justify-center py-8">
            <div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" />
          </div>
        ) : products.length === 0 ? (
          <p className="text-center text-muted-foreground py-8">Nenhum produto nesta seção.</p>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.map((p) => (
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

export default TabbedProducts;
