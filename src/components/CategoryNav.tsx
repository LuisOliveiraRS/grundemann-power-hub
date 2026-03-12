import { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog, ChevronDown, Star, Sparkles } from "lucide-react";

const iconMap: Record<string, any> = {
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

const defaultCategories = [
  { id: "1", name: "Geradores Diesel", slug: "geradores-diesel", icon: Fuel },
  { id: "2", name: "Geradores Gasolina", slug: "geradores-gasolina", icon: Zap },
  { id: "3", name: "Peças e Componentes", slug: "pecas-e-componentes", icon: Cog },
  { id: "4", name: "Manutenção", slug: "manutencao", icon: Wrench },
  { id: "5", name: "Acessórios", slug: "acessorios", icon: Settings },
  { id: "6", name: "Serviços Técnicos", slug: "servicos-tecnicos", icon: ShieldCheck },
];

interface DBCategory { id: string; name: string; slug: string; is_visible?: boolean; }
interface Subcategory { id: string; name: string; slug: string; category_id: string; }
interface FeaturedProduct {
  id: string; name: string; price: number; original_price: number | null;
  image_url: string | null; is_featured: boolean; is_launch: boolean;
  category_id: string | null; subcategory_id: string | null;
}

const CategoryNav = () => {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  // Extract numeric HP from subcategory name for sorting
  const extractHp = (name: string): number | null => {
    const match = name.match(/(\d+)\s*hp/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const sortSubcategories = (subs: Subcategory[]): Subcategory[] => {
    return [...subs].sort((a, b) => {
      const hpA = extractHp(a.name);
      const hpB = extractHp(b.name);
      // Both have HP → sort numerically
      if (hpA !== null && hpB !== null) return hpA - hpB;
      // Only one has HP → HP ones go first
      if (hpA !== null) return -1;
      if (hpB !== null) return 1;
      // Neither has HP → alphabetical
      return a.name.localeCompare(b.name);
    });
  };

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("id, name, slug, is_visible").order("name"),
      supabase.from("subcategories").select("id, name, slug, category_id").order("name"),
      supabase.from("products").select("id, name, price, original_price, image_url, is_featured, is_launch, category_id, subcategory_id")
        .eq("is_active", true)
        .or("is_featured.eq.true,is_launch.eq.true")
        .limit(20),
      supabase.from("products").select("id, name, price, original_price, image_url, is_featured, is_launch, category_id, subcategory_id")
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(200),
    ]).then(([catRes, subRes, prodRes, allProdRes]) => {
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (subRes.data) setSubcategories(sortSubcategories(subRes.data as Subcategory[]));
      if (prodRes.data) setFeaturedProducts(prodRes.data as FeaturedProduct[]);
      if (allProdRes.data) setAllProducts(allProdRes.data as FeaturedProduct[]);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) setOpenCat(null);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const visibleCategories = categories.filter(c => c.is_visible !== false);
  const items = visibleCategories.length > 0
    ? visibleCategories.map(c => ({ ...c, icon: iconMap[c.slug] || Cog }))
    : defaultCategories;

  const getSubcats = (catId: string) => subcategories.filter(s => s.category_id === catId);
  const getCatProducts = (catId: string) => featuredProducts.filter(p => p.category_id === catId).slice(0, 2);
  const getSubcatProducts = (subId: string) => allProducts.filter(p => p.subcategory_id === subId).slice(0, 3);

  return (
    <nav className="bg-nav sticky top-0 z-40 shadow-md" ref={navRef}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center md:justify-between">
          {items.map((cat) => {
            const subs = getSubcats(cat.id);
            const catProducts = getCatProducts(cat.id);
            const hasDropdown = subs.length > 0 || catProducts.length > 0;
            const isOpen = openCat === cat.id;
            const Icon = cat.icon;

            return (
              <li
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => hasDropdown && setOpenCat(cat.id)}
                onMouseLeave={() => hasDropdown && setOpenCat(null)}
              >
                {hasDropdown ? (
                  <button
                    onClick={() => setOpenCat(isOpen ? null : cat.id)}
                    className={`flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap w-full ${isOpen ? "bg-primary-foreground/15" : "hover:bg-primary-foreground/10"}`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex items-center gap-1">
                      {cat.name}
                      <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
                    </span>
                  </button>
                ) : (
                  <Link
                    to={`/categoria/${cat.slug}`}
                    className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{cat.name}</span>
                  </Link>
                )}

                {/* Mega Dropdown */}
                {hasDropdown && isOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[420px] bg-card border border-border rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="flex">
                      {/* Subcategories */}
                      <div className="w-1/2 border-r border-border py-2">
                        <Link
                          to={`/categoria/${cat.slug}`}
                          onClick={() => setOpenCat(null)}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold border-b border-border"
                        >
                          Ver todos em {cat.name}
                        </Link>
                        {subs.map((sub) => (
                          <Link
                            key={sub.id}
                            to={`/categoria/${cat.slug}/${sub.slug}`}
                            onClick={() => setOpenCat(null)}
                            onMouseEnter={() => setHoveredSub(sub.id)}
                            className={`block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors ${hoveredSub === sub.id ? "bg-primary/10" : ""}`}
                          >
                            {sub.name}
                          </Link>
                        ))}
                      </div>

                      {/* Products panel - shows subcategory products on hover, or featured products by default */}
                      <div className="w-1/2 p-3 space-y-2">
                        {(() => {
                          const displayProducts = hoveredSub
                            ? getSubcatProducts(hoveredSub)
                            : catProducts;
                          if (displayProducts.length === 0) {
                            return (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                {hoveredSub ? "Nenhum produto nesta subcategoria" : "Nenhum produto em destaque"}
                              </p>
                            );
                          }
                          return displayProducts.map(p => (
                            <Link
                              key={p.id}
                              to={`/produto/${p.id}`}
                              onClick={() => setOpenCat(null)}
                              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                                {p.image_url ? (
                                  <img src={p.image_url} alt="" className="h-full w-full object-contain p-0.5" />
                                ) : (
                                  <div className="h-full w-full flex items-center justify-center"><Cog className="h-5 w-5 text-muted-foreground" /></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-1 mb-0.5">
                                  {p.is_launch && (
                                    <span className="inline-flex items-center gap-0.5 bg-accent text-accent-foreground text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                      <Sparkles className="h-2.5 w-2.5" /> Novo
                                    </span>
                                  )}
                                  {p.is_featured && !p.is_launch && (
                                    <span className="inline-flex items-center gap-0.5 bg-primary/10 text-primary text-[9px] font-black px-1.5 py-0.5 rounded-full uppercase">
                                      <Star className="h-2.5 w-2.5" /> Destaque
                                    </span>
                                  )}
                                </div>
                                <p className="text-xs font-semibold truncate group-hover:text-primary transition-colors">{p.name}</p>
                                <div className="flex items-center gap-1.5">
                                  {p.original_price && <span className="text-[10px] text-muted-foreground line-through">R$ {Number(p.original_price).toFixed(2).replace(".", ",")}</span>}
                                  <p className="text-xs font-bold text-primary">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                                </div>
                              </div>
                            </Link>
                          ));
                        })()}
                      </div>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
          <li>
            <Link to="/produtos" className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap">
              <Settings className="h-5 w-5" />
              <span>Ver Todos</span>
            </Link>
          </li>
        </ul>
      </div>
    </nav>
  );
};

export default CategoryNav;
