import { useEffect, useState } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";
import ProductCard from "@/components/ProductCard";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import { ArrowLeft, Fuel, Zap, Cog, Wrench, Settings, ShieldCheck, Battery, Disc, Filter, Fan, Gauge, Plug, CircuitBoard, Hammer, PenTool, Cylinder, Box, Package, Layers, Cpu, RotateCcw, Thermometer, Droplets, Flame, Weight, Ruler, Bolt } from "lucide-react";
import { Link } from "react-router-dom";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  stock_quantity: number;
  sku: string | null;
}

const CategoryPage = () => {
  const { "*": slugPath } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { tree, loading: treeLoading, findBySlugPath, getAncestors, getAllDescendantIds } = useMenuCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNode, setCurrentNode] = useState<MenuCategoryNode | null>(null);
  const [childCategories, setChildCategories] = useState<MenuCategoryNode[]>([]);

  useEffect(() => {
    if (treeLoading || !slugPath) return;
    const node = findBySlugPath(slugPath);
    setCurrentNode(node);
    setChildCategories(node?.children || []);
    if (node) loadProducts(node);
    else { setProducts([]); setLoading(false); }
  }, [slugPath, treeLoading, tree]);

  const loadProducts = async (node: MenuCategoryNode) => {
    setLoading(true);
    const allIds = getAllDescendantIds(node.id);

    // Fetch products from menu_category_id and from product_categories junction table
    const [directRes, linksRes] = await Promise.all([
      supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
        .in("menu_category_id", allIds).eq("is_active", true),
      supabase.from("product_categories").select("product_id")
        .or(allIds.map(id => `category_id.eq.${id},subcategory_id.eq.${id}`).join(",")),
    ]);

    const directProducts = (directRes.data || []) as Product[];
    const linkedIds = [...new Set((linksRes.data || []).map((l: any) => l.product_id))];

    let linkedProducts: Product[] = [];
    if (linkedIds.length > 0) {
      const { data } = await supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
        .in("id", linkedIds).eq("is_active", true);
      linkedProducts = (data || []) as Product[];
    }

    // Merge unique
    const map = new Map<string, Product>();
    [...directProducts, ...linkedProducts].forEach(p => map.set(p.id, p));
    setProducts([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  const ancestors = currentNode ? getAncestors(currentNode.id) : [];
  const title = currentNode?.name || "Categoria";
  const description = currentNode?.description;

  // Build breadcrumb path
  const breadcrumbItems: { label: string; href?: string }[] = ancestors.map(a => {
    const ancestorNode = findNodeInTree(tree, a.id);
    return { label: a.name, href: `/categoria/${ancestorNode?.fullPath || a.slug}` };
  });
  breadcrumbItems.push({ label: title });

  function getSlugPathForAncestor(id: string): string {
    const chain: string[] = [];
    let current = tree.length > 0 ? findNodeInTree(tree, id) : null;
    if (!current) return "";
    return current.fullPath;
  }

  function findNodeInTree(nodes: MenuCategoryNode[], id: string): MenuCategoryNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
    return null;
  }

  // Back navigation
  const parentSlugPath = slugPath?.includes("/")
    ? slugPath.split("/").slice(0, -1).join("/")
    : null;

  return (
    <div className="min-h-screen flex flex-col">
      {currentNode && (
        <Helmet>
          <title>{`${title} | Grundemann Geradores`}</title>
          <meta name="description" content={description || `Compre ${title} na Grundemann Geradores. Peças para motores estacionários com qualidade e garantia.`} />
          <meta property="og:title" content={`${title} | Grundemann Geradores`} />
          <meta property="og:description" content={description || `Peças e equipamentos da categoria ${title}`} />
          <meta property="og:type" content="website" />
          <link rel="canonical" href={`https://grundemann.com.br/categoria/${slugPath}`} />
        </Helmet>
      )}
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-8">
          <button
            onClick={() => navigate(parentSlugPath ? `/categoria/${parentSlugPath}` : "/")}
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-4"
          >
            <ArrowLeft className="h-4 w-4" />
            {parentSlugPath ? `Voltar para ${ancestors[ancestors.length - 1]?.name || "anterior"}` : "Voltar"}
          </button>

          {currentNode && <SEOBreadcrumb items={breadcrumbItems} />}

          {treeLoading || loading ? (
            <div className="flex justify-center py-12"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
          ) : !currentNode ? (
            <p className="text-center text-muted-foreground py-12">Categoria não encontrada.</p>
          ) : (
            <>
              <h1 className="font-heading text-3xl font-bold mb-2">{title}</h1>
              {ancestors.length > 0 && (
                <p className="text-sm text-muted-foreground mb-1">
                  {ancestors.map(a => a.name).join(" > ")} &gt; {title}
                </p>
              )}
              {description && <p className="text-muted-foreground mb-6">{description}</p>}

              {/* Show child categories as cards */}
              {childCategories.length > 0 && (
                <div className="mb-8">
                  <h2 className="font-heading text-lg font-bold mb-4">Subcategorias</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                    {childCategories.map(child => (
                      <Link
                        key={child.id}
                        to={`/categoria/${child.fullPath}`}
                        className="group flex flex-col items-center gap-2 rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all text-center"
                      >
                        {child.image_url ? (
                          <img src={child.image_url} alt={child.name} className="h-16 w-16 object-contain rounded-lg" />
                        ) : (
                          <div className="h-16 w-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:scale-110 transition-transform">
                            <span className="text-primary font-bold text-lg">{child.name.charAt(0)}</span>
                          </div>
                        )}
                        <span className="font-heading text-sm font-semibold">{child.name}</span>
                        {child.children.length > 0 && (
                          <span className="text-xs text-muted-foreground">{child.children.length} subcategorias</span>
                        )}
                      </Link>
                    ))}
                  </div>
                </div>
              )}

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
      <WhatsAppButton />
      <Footer />
    </div>
  );
};

export default CategoryPage;
