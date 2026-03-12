import { useEffect, useMemo, useRef, useState } from "react";
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
interface Subcategory { id: string; name: string; slug: string; category_id: string; parent_id: string | null; }
interface FeaturedProduct {
  id: string; name: string; price: number; original_price: number | null;
  image_url: string | null; is_featured: boolean; is_launch: boolean;
  category_id: string | null; subcategory_id: string | null;
}
interface ProductCategoryLink {
  product_id: string;
  category_id: string;
  subcategory_id: string | null;
}

const CategoryNav = () => {
  const [categories, setCategories] = useState<DBCategory[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [productLinks, setProductLinks] = useState<ProductCategoryLink[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

  const extractHp = (name: string): number | null => {
    const match = name.match(/(\d+)\s*hp/i);
    return match ? parseInt(match[1], 10) : null;
  };

  const sortSubcategories = (subs: Subcategory[]): Subcategory[] => {
    return [...subs].sort((a, b) => {
      const hpA = extractHp(a.name);
      const hpB = extractHp(b.name);
      if (hpA !== null && hpB !== null) return hpA - hpB;
      if (hpA !== null) return -1;
      if (hpB !== null) return 1;
      return a.name.localeCompare(b.name);
    });
  };

  useEffect(() => {
    Promise.all([
      supabase.from("categories").select("id, name, slug, is_visible").order("name"),
      supabase.from("subcategories").select("id, name, slug, category_id, parent_id").order("name"),
      supabase.from("products").select("id, name, price, original_price, image_url, is_featured, is_launch, category_id, subcategory_id")
        .eq("is_active", true)
        .or("is_featured.eq.true,is_launch.eq.true")
        .limit(60),
      supabase.from("products").select("id, name, price, original_price, image_url, is_featured, is_launch, category_id, subcategory_id")
        .eq("is_active", true)
        .order("price", { ascending: true })
        .limit(400),
      supabase.from("product_categories").select("product_id, category_id, subcategory_id"),
    ]).then(([catRes, subRes, prodRes, allProdRes, linksRes]) => {
      if (catRes.data && catRes.data.length > 0) setCategories(catRes.data);
      if (subRes.data) setSubcategories(sortSubcategories(subRes.data as Subcategory[]));
      if (prodRes.data) setFeaturedProducts(prodRes.data as FeaturedProduct[]);
      if (allProdRes.data) setAllProducts(allProdRes.data as FeaturedProduct[]);
      if (linksRes.data) setProductLinks(linksRes.data as ProductCategoryLink[]);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        setOpenCat(null);
        setHoveredSub(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const linkedByCategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    productLinks.forEach((l) => {
      if (!map.has(l.category_id)) map.set(l.category_id, new Set());
      map.get(l.category_id)!.add(l.product_id);
    });
    return map;
  }, [productLinks]);

  const linkedBySubcategory = useMemo(() => {
    const map = new Map<string, Set<string>>();
    productLinks.forEach((l) => {
      if (!l.subcategory_id) return;
      if (!map.has(l.subcategory_id)) map.set(l.subcategory_id, new Set());
      map.get(l.subcategory_id)!.add(l.product_id);
    });
    return map;
  }, [productLinks]);

  const visibleCategories = categories.filter((c) => c.is_visible !== false);
  const items = visibleCategories.length > 0
    ? visibleCategories.map((c) => ({ ...c, icon: iconMap[c.slug] || Cog }))
    : defaultCategories;

  const getSubcatsTree = (catId: string, parentId: string | null = null, depth = 0): (Subcategory & { depth: number })[] => {
    const children = sortSubcategories(
      subcategories.filter((s) => s.category_id === catId && s.parent_id === parentId),
    );
    return children.flatMap((child) => [{ ...child, depth }, ...getSubcatsTree(catId, child.id, depth + 1)]);
  };

  const productInCategory = (product: FeaturedProduct, catId: string) => {
    if (product.category_id === catId) return true;
    return linkedByCategory.get(catId)?.has(product.id) ?? false;
  };

  const productInSubcategory = (product: FeaturedProduct, subId: string) => {
    if (product.subcategory_id === subId) return true;
    return linkedBySubcategory.get(subId)?.has(product.id) ?? false;
  };

  const getCatProducts = (catId: string) =>
    featuredProducts.filter((p) => productInCategory(p, catId)).sort((a, b) => a.price - b.price).slice(0, 3);

  const getSubcatProducts = (subId: string) =>
    allProducts.filter((p) => productInSubcategory(p, subId)).sort((a, b) => a.price - b.price).slice(0, 3);

  return (
    <nav className="bg-nav sticky top-0 z-40 shadow-md" ref={navRef}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center md:justify-between">
          {items.map((cat) => {
            const subs = getSubcatsTree(cat.id);
            const catProducts = getCatProducts(cat.id);
            const hasDropdown = subs.length > 0 || catProducts.length > 0;
            const isOpen = openCat === cat.id;
            const Icon = cat.icon;

            return (
              <li
                key={cat.slug}
                className="relative group"
                onMouseEnter={() => {
                  if (!hasDropdown) return;
                  setOpenCat(cat.id);
                  setHoveredSub(null);
                }}
                onMouseLeave={() => {
                  if (!hasDropdown) return;
                  setOpenCat(null);
                  setHoveredSub(null);
                }}
              >
                {hasDropdown ? (
                  <button
                    onClick={() => {
                      setOpenCat(isOpen ? null : cat.id);
                      setHoveredSub(null);
                    }}
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

                {hasDropdown && isOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[500px] bg-card border border-border rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
                    <div className="flex">
                      <div className="w-1/2 border-r border-border py-2 max-h-[360px] overflow-y-auto">
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
                            className={`block py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors ${hoveredSub === sub.id ? "bg-primary/10" : ""}`}
                            style={{ paddingLeft: `${16 + sub.depth * 14}px`, paddingRight: "12px" }}
                          >
                            {sub.depth > 0 ? "↳ " : ""}
                            {sub.name}
                          </Link>
                        ))}
                      </div>

                      <div className="w-1/2 p-3 space-y-2">
                        {(() => {
                          const displayProducts = hoveredSub ? getSubcatProducts(hoveredSub) : catProducts;
                          if (displayProducts.length === 0) {
                            return (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                {hoveredSub ? "Nenhum produto nesta subcategoria" : "Nenhum produto em destaque"}
                              </p>
                            );
                          }
                          return displayProducts.map((p) => (
                            <Link
                              key={p.id}
                              to={`/produto/${p.id}`}
                              onClick={() => setOpenCat(null)}
                              className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-muted/50 transition-colors group"
                            >
                              <div className="h-12 w-12 rounded-lg bg-muted overflow-hidden flex-shrink-0 border border-border">
                                {p.image_url ? (
                                  <img src={p.image_url} alt={p.name} className="h-full w-full object-contain p-0.5" loading="lazy" />
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
