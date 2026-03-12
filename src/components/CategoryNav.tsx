import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Fuel, Wrench, Settings, Zap, ShieldCheck, Cog, ChevronDown, ChevronRight, Star, Sparkles } from "lucide-react";
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

const getDescendantIds = (node: MenuCategoryNode): string[] => {
  return [node.id, ...node.children.flatMap(getDescendantIds)];
};

/* ── Recursive submenu item ── */
const SubMenuItem = ({
  node,
  onClose,
  onHover,
}: {
  node: MenuCategoryNode;
  onClose: () => void;
  onHover: (node: MenuCategoryNode) => void;
}) => {
  const [open, setOpen] = useState(false);
  const hasChildren = node.children.length > 0;
  const timeoutRef = useRef<ReturnType<typeof setTimeout>>();

  const handleEnter = () => {
    clearTimeout(timeoutRef.current);
    setOpen(true);
    onHover(node);
  };

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setOpen(false), 150);
  };

  return (
    <div
      className="relative"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <Link
        to={`/categoria/${node.fullPath}`}
        onClick={onClose}
        className={`flex items-center justify-between px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-medium ${open && hasChildren ? "bg-primary/10" : ""}`}
      >
        <span>{node.name}</span>
        {hasChildren && <ChevronRight className="h-3.5 w-3.5 ml-2 flex-shrink-0 text-muted-foreground" />}
      </Link>

      {hasChildren && open && (
        <div className="absolute left-full top-0 min-w-[220px] bg-card border border-border rounded-lg shadow-xl z-[70] animate-in fade-in slide-in-from-left-2 duration-150">
          <Link
            to={`/categoria/${node.fullPath}`}
            onClick={onClose}
            className="block px-4 py-2 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold border-b border-border"
          >
            Ver todos
          </Link>
          {node.children.map(child => (
            <SubMenuItem key={child.id} node={child} onClose={onClose} onHover={onHover} />
          ))}
        </div>
      )}
    </div>
  );
};

/* ── Product preview card ── */
const ProductPreview = ({ p, onClose }: { p: FeaturedProduct; onClose: () => void }) => (
  <Link
    to={`/produto/${p.id}`}
    onClick={onClose}
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
);

/* ── Main nav ── */
const CategoryNav = () => {
  const { tree, loading } = useMenuCategories();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [allProducts, setAllProducts] = useState<FeaturedProduct[]>([]);
  const [openCat, setOpenCat] = useState<string | null>(null);
  const [hoveredNode, setHoveredNode] = useState<MenuCategoryNode | null>(null);
  const navRef = useRef<HTMLDivElement>(null);

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
        setOpenCat(null); setHoveredNode(null);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getProductsForNode = (node: MenuCategoryNode, source: FeaturedProduct[]) => {
    const ids = new Set(getDescendantIds(node));
    return source.filter(p => p.menu_category_id && ids.has(p.menu_category_id)).sort((a, b) => a.price - b.price).slice(0, 3);
  };

  const getIcon = (node: MenuCategoryNode) => iconMap[node.icon] || iconMap[node.slug] || Cog;

  if (loading) return null;

  return (
    <nav className="bg-nav sticky top-0 z-40 shadow-md" ref={navRef}>
      <div className="container">
        <ul className="flex flex-wrap items-center justify-center md:justify-between">
          {tree.map(cat => {
            const hasDropdown = cat.children.length > 0;
            const isOpen = openCat === cat.id;
            const Icon = getIcon(cat);
            const close = () => { setOpenCat(null); setHoveredNode(null); };

            return (
              <li
                key={cat.id}
                className="relative group"
                onMouseEnter={() => { if (hasDropdown) { setOpenCat(cat.id); setHoveredNode(null); } }}
                onMouseLeave={() => { if (hasDropdown) close(); }}
              >
                {hasDropdown ? (
                  <button
                    onClick={() => { isOpen ? close() : setOpenCat(cat.id); }}
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
                    to={`/categoria/${cat.fullPath}`}
                    className="flex flex-col items-center gap-1 px-4 py-3 text-nav-foreground hover:bg-primary-foreground/10 transition-colors text-xs font-semibold uppercase tracking-wide whitespace-nowrap"
                  >
                    <Icon className="h-5 w-5" />
                    <span>{cat.name}</span>
                  </Link>
                )}

                {hasDropdown && isOpen && (
                  <div className="absolute top-full left-1/2 -translate-x-1/2 min-w-[520px] bg-card border border-border rounded-xl shadow-2xl z-[60] animate-in fade-in slide-in-from-top-2 duration-200 overflow-visible">
                    <div className="flex">
                      {/* Left: only direct children, with recursive flyout on hover */}
                      <div className="w-1/2 border-r border-border py-2 max-h-[400px] overflow-y-auto">
                        <Link
                          to={`/categoria/${cat.fullPath}`}
                          onClick={close}
                          className="block px-4 py-2.5 text-sm text-foreground hover:bg-primary hover:text-primary-foreground transition-colors font-bold border-b border-border"
                        >
                          Ver todos em {cat.name}
                        </Link>
                        {cat.children.map(sub => (
                          <SubMenuItem
                            key={sub.id}
                            node={sub}
                            onClose={close}
                            onHover={setHoveredNode}
                          />
                        ))}
                      </div>

                      {/* Right: product preview */}
                      <div className="w-1/2 p-3 space-y-2">
                        {(() => {
                          const target = hoveredNode || cat;
                          const displayProducts = hoveredNode
                            ? getProductsForNode(hoveredNode, allProducts)
                            : getProductsForNode(cat, products);
                          if (displayProducts.length === 0) {
                            return (
                              <p className="text-xs text-muted-foreground text-center py-4">
                                {hoveredNode ? "Nenhum produto nesta subcategoria" : "Nenhum produto em destaque"}
                              </p>
                            );
                          }
                          return displayProducts.map(p => (
                            <ProductPreview key={p.id} p={p} onClose={close} />
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
