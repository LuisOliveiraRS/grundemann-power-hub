import { useEffect, useRef, useState, forwardRef } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog, ChevronDown, ChevronRight, Star, Sparkles, BookOpen, Download, ExternalLink } from "lucide-react";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";

const iconMap: Record<string, any> = {
  Fuel, Zap, Cog, Wrench, Settings, ShieldCheck,
  "geradores-diesel": Fuel,
  "geradores-gasolina": Zap,
  "pecas-componentes": Cog,
  "pecas-e-componentes": Cog,
  "manutencao": Wrench,
  "acessorios": Settings,
  "servicos-tecnicos": ShieldCheck,
};

interface FeaturedProduct {
  id: string; name: string; price: number; original_price: number | null;
  image_url: string | null; is_featured: boolean; is_launch: boolean;
  menu_category_id: string | null;
}

const CategoryNav = forwardRef<HTMLElement, Record<string, never>>((_props, _ref) => {
  const { tree, loading } = useMenuCategories();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hoveredSub, setHoveredSub] = useState<string | null>(null);
  const navRef = useRef<HTMLDivElement>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCloseTimeout = () => {
    if (closeTimeoutRef.current) {
      clearTimeout(closeTimeoutRef.current);
      closeTimeoutRef.current = null;
    }
  };

  const closeMenu = () => {
    clearCloseTimeout();
    setOpenCat(null);
    setHoveredSub(null);
  };

  const scheduleCloseMenu = () => {
    clearCloseTimeout();
    closeTimeoutRef.current = setTimeout(() => {
      setOpenCat(null);
      setHoveredSub(null);
    }, 140);
  };

  useEffect(() => {
    Promise.all([
      supabase.from("products")
        .select("id, name, price, original_price, image_url, is_featured, is_launch, menu_category_id")
        .eq("is_active", true).or("is_featured.eq.true,is_launch.eq.true").limit(60),
      supabase.from("products")
        .select("id, name, price, original_price, image_url, is_featured, is_launch, menu_category_id")
        .eq("is_active", true).order("price", { ascending: true }).limit(400),
    ]).then(([featRes, allRes]) => {
      if (featRes.data) setProducts(featRes.data as FeaturedProduct[]);
      if (allRes.data) setAllProducts(allRes.data as FeaturedProduct[]);
    });
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (navRef.current && !navRef.current.contains(e.target as Node)) {
        closeMenu();
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => {
      document.removeEventListener("mousedown", handleClick);
      clearCloseTimeout();
    };
  }, []);

  const getDescendantIds = (node: MenuCategoryNode): string[] => {
    return [node.id, ...node.children.flatMap(getDescendantIds)];
  };

  const getProductsForNode = (node: MenuCategoryNode, source: FeaturedProduct[]) => {
    const ids = new Set(getDescendantIds(node));
    return source.filter(p => p.menu_category_id && ids.has(p.menu_category_id)).sort((a, b) => a.price - b.price).slice(0, 3);
  };

  const flattenNode = (node: MenuCategoryNode): { node: MenuCategoryNode; depth: number }[] => {
    return node.children.flatMap(child => [
      { node: child, depth: child.depth - node.depth - 1 },
      ...flattenChildren(child, node.depth + 1),
    ]);
  };

  const flattenChildren = (node: MenuCategoryNode, baseDepth: number): { node: MenuCategoryNode; depth: number }[] => {
    return node.children.flatMap(child => [
      { node: child, depth: child.depth - baseDepth },
      ...flattenChildren(child, baseDepth),
    ]);
  };

  const getIcon = (node: MenuCategoryNode) => {
    return iconMap[node.icon] || iconMap[node.slug] || Cog;
  };

  if (loading) return null;

  return (
    <nav className="bg-nav sticky top-0 z-30 shadow-md" ref={navRef}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center md:justify-between">
          {tree.map(cat => {
            const subs = flattenNode(cat);
            const catProducts = getProductsForNode(cat, products);
            const hasDropdown = subs.length > 0 || catProducts.length > 0;
            const isOpen = openCat === cat.id;
            const Icon = getIcon(cat);

            return (
              <li
                key={cat.id}
                className="relative group"
                onMouseEnter={() => {
                  clearCloseTimeout();
                  if (hasDropdown) {
                    setOpenCat(cat.id);
                    setHoveredSub(null);
                  }
                }}
                onMouseLeave={() => {
                  if (hasDropdown) scheduleCloseMenu();
                }}
              >
                {hasDropdown ? (
                  <button
                    onClick={() => {
                      clearCloseTimeout();
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
                ) : cat.external_url ? (
                  <a
                    href={cat.external_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    <span className="flex items-center gap-1">{cat.name} <ExternalLink className="h-2.5 w-2.5" /></span>
                  </a>
                ) : (
                  <Link
                    to={`/categoria/${cat.fullPath}`}
                    className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{cat.name}</span>
                  </Link>
                )}

                {hasDropdown && isOpen && (
                  <div
                    className="absolute top-full left-1/2 -translate-x-1/2 w-[720px] max-w-[calc(100vw-2rem)] bg-card border border-border rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden"
                    onMouseEnter={clearCloseTimeout}
                    onMouseLeave={scheduleCloseMenu}
                  >
                    <div className="grid grid-cols-[minmax(0,1fr)_320px] items-stretch">
                      <div className="min-w-0 border-r border-border py-2 max-h-[400px] overflow-y-auto">
                        <Link
                          to={`/categoria/${cat.fullPath}`}
                          onClick={closeMenu}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold border-b border-border"
                        >
                          Ver todos em {cat.name}
                        </Link>
                        {subs.map(({ node: sub, depth }) => {
                          const isExternal = !!sub.external_url;
                          const linkProps = isExternal
                            ? { as: "a" as const, href: sub.external_url!, target: "_blank", rel: "noopener noreferrer" }
                            : {};
                          const Comp = isExternal ? "a" : Link;
                          const compProps = isExternal
                            ? { href: sub.external_url!, target: "_blank", rel: "noopener noreferrer" }
                            : { to: `/categoria/${sub.fullPath}` };

                          return (
                            <Comp
                              key={sub.id}
                              {...(compProps as any)}
                              onClick={closeMenu}
                              onMouseEnter={() => {
                                clearCloseTimeout();
                                setHoveredSub(sub.id);
                              }}
                              className={`flex items-center py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors ${hoveredSub === sub.id ? "bg-primary/10" : ""}`}
                              style={{ paddingLeft: `${16 + depth * 14}px`, paddingRight: "12px" }}
                            >
                              {depth > 0 && <ChevronRight className="h-3 w-3 mr-1 text-muted-foreground flex-shrink-0" />}
                              <span className={depth === 0 ? "font-semibold" : ""}>{sub.name}</span>
                              {isExternal && <ExternalLink className="h-3 w-3 ml-1 text-muted-foreground flex-shrink-0" />}
                              {!isExternal && sub.children.length > 0 && (
                                <ChevronRight className="h-3 w-3 ml-auto text-muted-foreground flex-shrink-0" />
                              )}
                            </Comp>
                          );
                        })}
                      </div>

                      <div className="min-w-0 min-h-[260px] p-3 space-y-2">
                        {(() => {
                          const hoveredNode = hoveredSub ? findNodeById(cat, hoveredSub) : null;
                          const displayProducts = hoveredNode ? getProductsForNode(hoveredNode, allProducts) : catProducts;
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
          <CatalogMenuItem />
        </ul>
      </div>
    </nav>
  );
});

CategoryNav.displayName = "CategoryNav";

function findNodeById(root: MenuCategoryNode, id: string): MenuCategoryNode | null {
  if (root.id === id) return root;
  for (const child of root.children) {
    const found = findNodeById(child, id);
    if (found) return found;
  }
  return null;
}

interface CatalogItem { id: string; title: string; file_url: string; }

const CatalogMenuItem = () => {
  const [catalogs, setCatalogs] = useState<CatalogItem[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLLIElement>(null);

  useEffect(() => {
    supabase.from("technical_catalogs").select("id, title, file_url")
      .eq("is_active", true).order("title")
      .then(({ data }) => setCatalogs((data || []) as CatalogItem[]));
  }, []);

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const openCatalog = (fileUrl: string) => {
    setOpen(false);
    const { data } = supabase.storage
      .from("technical-catalogs")
      .getPublicUrl(fileUrl);

    if (data.publicUrl) {
      window.open(data.publicUrl, "_blank", "noopener,noreferrer");
    }
  };

  return (
    <li
      ref={ref}
      className="relative group"
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
    >
      <button
        onClick={() => setOpen(!open)}
        className={`flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap w-full ${open ? "bg-primary-foreground/15" : "hover:bg-primary-foreground/10"}`}
      >
        <BookOpen className="h-5 w-5" />
        <span className="flex items-center gap-1">
          Catálogos
          <ChevronDown className={`h-3 w-3 transition-transform duration-200 ${open ? "rotate-180" : ""}`} />
        </span>
      </button>
      {open && catalogs.length > 0 && (
        <div className="absolute top-full right-0 min-w-[280px] bg-card border border-border rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-hidden">
          <div className="py-2 max-h-[400px] overflow-y-auto">
            {catalogs.map(cat => (
              <button
                key={cat.id}
                onClick={() => openCatalog(cat.file_url)}
                className="flex items-center gap-2 px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors w-full text-left"
              >
                <BookOpen className="h-4 w-4 flex-shrink-0" />
                <span className="truncate">{cat.title}</span>
              </button>
            ))}
          </div>
        </div>
      )}
    </li>
  );
};

export default CategoryNav;
