import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string; name: string; price: number; original_price: number | null;
  image_url: string | null; stock_quantity: number; sku: string | null;
  category_id: string | null; brand: string | null; hp: string | null;
  engine_model: string | null;
}

interface Category { id: string; name: string; slug: string; }

const ITEMS_PER_PAGE = 24;

const AllProducts = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  // Filters
  const [search, setSearch] = useState(searchParams.get("busca") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoria") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("marca") || "");
  const [selectedHp, setSelectedHp] = useState(searchParams.get("hp") || "");
  const [priceMin, setPriceMin] = useState(searchParams.get("preco_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("preco_max") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("ordem") || "name");
  const [page, setPage] = useState(1);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { setSearch(searchParams.get("busca") || ""); }, [searchParams]);

  const loadData = async () => {
    const [p, c] = await Promise.all([
      supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku, category_id, brand, hp, engine_model").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("name"),
    ]);
    setProducts((p.data || []) as Product[]);
    setCategories((c.data || []) as Category[]);
    setLoading(false);
  };

  // Extract unique brands and HPs
  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];
  const hps = [...new Set(products.map(p => p.hp).filter(Boolean))].sort() as string[];

  const filtered = products.filter(p => {
    if (selectedCategory && p.category_id !== selectedCategory) return false;
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (selectedHp && p.hp !== selectedHp) return false;
    if (priceMin && p.price < parseFloat(priceMin)) return false;
    if (priceMax && p.price > parseFloat(priceMax)) return false;
    if (search) {
      const q = search.toLowerCase();
      const match = p.name.toLowerCase().includes(q) ||
        (p.sku || "").toLowerCase().includes(q) ||
        (p.brand || "").toLowerCase().includes(q) ||
        (p.engine_model || "").toLowerCase().includes(q) ||
        (p.hp || "").toLowerCase().includes(q);
      if (!match) return false;
    }
    return true;
  });

  // Sort
  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    if (sortBy === "newest") return 0; // already ordered
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilters = [selectedCategory, selectedBrand, selectedHp, priceMin, priceMax].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory(""); setSelectedBrand(""); setSelectedHp("");
    setPriceMin(""); setPriceMax(""); setSearch(""); setPage(1);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-3xl font-bold">Todos os Produtos</h1>
              <p className="text-muted-foreground text-sm mt-1">{filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <select
                className="border border-input rounded-lg px-3 py-2 text-sm bg-background"
                value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}
              >
                <option value="name">Nome A-Z</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
              <Button variant="outline" size="sm" onClick={() => setShowFilters(!showFilters)}>
                <SlidersHorizontal className="h-4 w-4 mr-1" /> Filtros
                {activeFilters > 0 && <Badge className="ml-1 h-5 w-5 p-0 flex items-center justify-center text-[10px]">{activeFilters}</Badge>}
              </Button>
            </div>
          </div>

          {/* Filters panel */}
          {showFilters && (
            <div className="bg-card rounded-xl border border-border p-5 mb-6 animate-in slide-in-from-top-2">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-heading font-bold text-sm">Filtros Avançados</h3>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters}>
                    <X className="h-4 w-4 mr-1" /> Limpar
                  </Button>
                )}
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Busca</label>
                  <Input placeholder="Nome, SKU, marca..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Categoria</label>
                  <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}>
                    <option value="">Todas</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Marca</label>
                  <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setPage(1); }}>
                    <option value="">Todas</option>
                    {brands.map(b => <option key={b} value={b}>{b}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Potência (HP)</label>
                  <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedHp} onChange={e => { setSelectedHp(e.target.value); setPage(1); }}>
                    <option value="">Todos</option>
                    {hps.map(h => <option key={h} value={h}>{h} HP</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço Mín.</label>
                  <Input type="number" placeholder="R$ 0" value={priceMin} onChange={e => { setPriceMin(e.target.value); setPage(1); }} className="h-9 text-sm" />
                </div>
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Preço Máx.</label>
                  <Input type="number" placeholder="R$ 999" value={priceMax} onChange={e => { setPriceMax(e.target.value); setPage(1); }} className="h-9 text-sm" />
                </div>
              </div>
            </div>
          )}

          {/* Active filter badges */}
          {activeFilters > 0 && !showFilters && (
            <div className="flex flex-wrap gap-2 mb-4">
              {selectedCategory && <Badge variant="secondary" className="gap-1">{categories.find(c => c.id === selectedCategory)?.name} <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedCategory("")} /></Badge>}
              {selectedBrand && <Badge variant="secondary" className="gap-1">{selectedBrand} <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedBrand("")} /></Badge>}
              {selectedHp && <Badge variant="secondary" className="gap-1">{selectedHp} HP <X className="h-3 w-3 cursor-pointer" onClick={() => setSelectedHp("")} /></Badge>}
              {priceMin && <Badge variant="secondary" className="gap-1">Min R$ {priceMin} <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMin("")} /></Badge>}
              {priceMax && <Badge variant="secondary" className="gap-1">Max R$ {priceMax} <X className="h-3 w-3 cursor-pointer" onClick={() => setPriceMax("")} /></Badge>}
            </div>
          )}

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Nenhum produto encontrado.</p>
              {activeFilters > 0 && <Button variant="outline" onClick={clearFilters}>Limpar Filtros</Button>}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginated.map(p => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} isFavorite={isFavorite(p.id)} onToggleFavorite={toggleFavorite} />
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) pageNum = i + 1;
                    else if (page <= 4) pageNum = i + 1;
                    else if (page >= totalPages - 3) pageNum = totalPages - 6 + i;
                    else pageNum = page - 3 + i;
                    return (
                      <Button key={pageNum} variant={page === pageNum ? "default" : "outline"} size="sm" className="w-9" onClick={() => setPage(pageNum)}>
                        {pageNum}
                      </Button>
                    );
                  })}
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
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

export default AllProducts;
