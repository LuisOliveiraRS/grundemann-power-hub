import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useFavorites } from "@/hooks/useFavorites";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { SlidersHorizontal, X, ChevronLeft, ChevronRight } from "lucide-react";

interface Product {
  id: string; name: string; price: number; original_price: number | null;
  image_url: string | null; stock_quantity: number; sku: string | null;
  category_id: string | null; brand: string | null; hp: string | null;
  engine_model: string | null; fuel_type: string | null; slug: string | null;
}

interface Category { id: string; name: string; slug: string; }
interface ProductCategoryLink { product_id: string; category_id: string; }

const ITEMS_PER_PAGE = 24;

const AllProducts = () => {
  const [searchParams] = useSearchParams();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [links, setLinks] = useState<ProductCategoryLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);

  const [search, setSearch] = useState(searchParams.get("busca") || "");
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get("categoria") || "");
  const [selectedBrand, setSelectedBrand] = useState(searchParams.get("marca") || "");
  const [selectedHp, setSelectedHp] = useState(searchParams.get("hp") || "");
  const [priceMin, setPriceMin] = useState(searchParams.get("preco_min") || "");
  const [priceMax, setPriceMax] = useState(searchParams.get("preco_max") || "");
  const [sortBy, setSortBy] = useState(searchParams.get("ordem") || "name");
  const [inStockOnly, setInStockOnly] = useState(false);
  const [selectedFuel, setSelectedFuel] = useState("");
  const [page, setPage] = useState(1);

  useEffect(() => { loadData(); }, []);

  const linkMap = useMemo(() => {
    const map = new Map<string, Set<string>>();
    links.forEach((l) => {
      if (!map.has(l.product_id)) map.set(l.product_id, new Set());
      map.get(l.product_id)!.add(l.category_id);
    });
    return map;
  }, [links]);

  const loadData = async () => {
    const [p, c, l] = await Promise.all([
      supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku, category_id, brand, hp, engine_model, fuel_type, slug").eq("is_active", true).order("name"),
      supabase.from("categories").select("*").order("name"),
      supabase.from("product_categories").select("product_id, category_id"),
    ]);
    setProducts((p.data || []) as Product[]);
    setCategories((c.data || []) as Category[]);
    setLinks((l.data || []) as ProductCategoryLink[]);
    setLoading(false);
  };

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))] as string[];
  const hps = [...new Set(products.map(p => p.hp).filter(Boolean))].sort() as string[];

  const filtered = products.filter(p => {
    if (selectedCategory) {
      const inPrimary = p.category_id === selectedCategory;
      const inLinked = linkMap.get(p.id)?.has(selectedCategory) ?? false;
      if (!inPrimary && !inLinked) return false;
    }
    if (selectedBrand && p.brand !== selectedBrand) return false;
    if (selectedHp && p.hp !== selectedHp) return false;
    if (selectedFuel && p.fuel_type !== selectedFuel) return false;
    if (priceMin && p.price < parseFloat(priceMin)) return false;
    if (priceMax && p.price > parseFloat(priceMax)) return false;
    if (inStockOnly && p.stock_quantity <= 0) return false;
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

  const sorted = [...filtered].sort((a, b) => {
    if (sortBy === "price_asc") return a.price - b.price;
    if (sortBy === "price_desc") return b.price - a.price;
    return a.name.localeCompare(b.name);
  });

  const totalPages = Math.ceil(sorted.length / ITEMS_PER_PAGE);
  const paginated = sorted.slice((page - 1) * ITEMS_PER_PAGE, page * ITEMS_PER_PAGE);

  const activeFilters = [selectedCategory, selectedBrand, selectedHp, selectedFuel, priceMin, priceMax, inStockOnly ? "stock" : ""].filter(Boolean).length;

  const clearFilters = () => {
    setSelectedCategory(""); setSelectedBrand(""); setSelectedHp(""); setSelectedFuel("");
    setPriceMin(""); setPriceMax(""); setSearch(""); setInStockOnly(false); setPage(1);
  };

  const pageTitle = search ? `Resultados para "${search}"` : "Todos os Produtos";

  return (
    <div className="min-h-screen flex flex-col">
      <Helmet>
        <title>{`${pageTitle} | Grundemann Geradores`}</title>
      </Helmet>
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <SEOBreadcrumb items={[{ label: pageTitle }]} />
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="font-heading text-2xl md:text-3xl font-bold">{pageTitle}</h1>
              <p className="text-muted-foreground text-sm mt-1">{filtered.length} produto{filtered.length !== 1 ? "s" : ""} encontrado{filtered.length !== 1 ? "s" : ""}</p>
            </div>
            <div className="flex items-center gap-3">
              <select className="border border-input rounded-lg px-3 py-2 text-sm bg-background" value={sortBy} onChange={e => { setSortBy(e.target.value); setPage(1); }}>
                <option value="name">Nome A-Z</option>
                <option value="price_asc">Menor Preço</option>
                <option value="price_desc">Maior Preço</option>
              </select>
            </div>
          </div>

          {/* Always-visible filter bar */}
          <div className="bg-card rounded-xl border border-border p-4 mb-6">
            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-3">
              <Input placeholder="🔍 Buscar produto..." value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} className="h-9 text-sm" />
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedCategory} onChange={e => { setSelectedCategory(e.target.value); setPage(1); }}>
                <option value="">📂 Todas categorias</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedBrand} onChange={e => { setSelectedBrand(e.target.value); setPage(1); }}>
                <option value="">🏷️ Todas marcas</option>
                {brands.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select className="w-full border border-input rounded-lg px-3 py-2 text-sm bg-background h-9" value={selectedHp} onChange={e => { setSelectedHp(e.target.value); setPage(1); }}>
                <option value="">⚡ Todos HP</option>
                {hps.map(h => <option key={h} value={h}>{h} HP</option>)}
              </select>
              <Input type="number" placeholder="Preço mín" value={priceMin} onChange={e => { setPriceMin(e.target.value); setPage(1); }} className="h-9 text-sm" />
              <Input type="number" placeholder="Preço máx" value={priceMax} onChange={e => { setPriceMax(e.target.value); setPage(1); }} className="h-9 text-sm" />
              <div className="flex items-center gap-2">
                <input type="checkbox" checked={inStockOnly} onChange={e => { setInStockOnly(e.target.checked); setPage(1); }} className="rounded border-input" id="stock-filter" />
                <label htmlFor="stock-filter" className="text-xs whitespace-nowrap cursor-pointer">Em estoque</label>
                {activeFilters > 0 && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-destructive hover:text-destructive">
                    <X className="h-3.5 w-3.5 mr-1" /> Limpar
                  </Button>
                )}
              </div>
            </div>
            {activeFilters > 0 && (
              <div className="flex items-center gap-2 mt-3 pt-3 border-t border-border">
                <span className="text-xs text-muted-foreground">Filtros ativos:</span>
                {selectedCategory && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setSelectedCategory(""); setPage(1); }}>{categories.find(c => c.id === selectedCategory)?.name} ✕</Badge>}
                {selectedBrand && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setSelectedBrand(""); setPage(1); }}>{selectedBrand} ✕</Badge>}
                {selectedHp && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setSelectedHp(""); setPage(1); }}>{selectedHp} HP ✕</Badge>}
                {priceMin && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setPriceMin(""); setPage(1); }}>Min R${priceMin} ✕</Badge>}
                {priceMax && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setPriceMax(""); setPage(1); }}>Max R${priceMax} ✕</Badge>}
                {inStockOnly && <Badge variant="secondary" className="text-xs cursor-pointer" onClick={() => { setInStockOnly(false); setPage(1); }}>Em estoque ✕</Badge>}
              </div>
            )}
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : paginated.length === 0 ? (
            <div className="text-center py-12"><p className="text-muted-foreground mb-4">Nenhum produto encontrado.</p></div>
          ) : (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                {paginated.map(p => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} isFavorite={isFavorite(p.id)} onToggleFavorite={toggleFavorite} />
                ))}
              </div>

              {totalPages > 1 && (
                <nav className="flex items-center justify-center gap-2 mt-8">
                  <Button variant="outline" size="sm" disabled={page === 1} onClick={() => setPage(p => p - 1)}>
                    <ChevronLeft className="h-4 w-4" />
                  </Button>
                  <span className="text-sm text-muted-foreground">Página {page} de {totalPages}</span>
                  <Button variant="outline" size="sm" disabled={page === totalPages} onClick={() => setPage(p => p + 1)}>
                    <ChevronRight className="h-4 w-4" />
                  </Button>
                </nav>
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

export default AllProducts;
