import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
  category_id: string | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

const AllProducts = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => { loadData(); }, []);

  const loadData = async () => {
    const [p, c] = await Promise.all([
      supabase.from("products").select("*").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts((p.data || []) as Product[]);
    setCategories((c.data || []) as Category[]);
    setLoading(false);
  };

  const filtered = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !(p.sku || "").toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <h1 className="font-heading text-3xl font-bold mb-6">Todos os Produtos</h1>
          <div className="flex flex-wrap gap-3 mb-6">
            <input className="border border-input rounded-lg px-4 py-2 text-sm bg-background flex-1 min-w-[200px]" placeholder="Buscar por nome ou código..." value={search} onChange={e => setSearch(e.target.value)} />
            <select className="border border-input rounded-lg px-4 py-2 text-sm bg-background" value={selectedCategory} onChange={e => setSelectedCategory(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : filtered.length === 0 ? (
            <p className="text-center text-muted-foreground py-12">Nenhum produto encontrado.</p>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filtered.map(p => (
                <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AllProducts;
