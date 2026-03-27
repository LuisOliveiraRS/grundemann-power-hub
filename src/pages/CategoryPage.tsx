import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { supabase } from "@/integrations/supabase/client";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";
import ProductCard from "@/components/ProductCard";
import ProductGridSkeleton from "@/components/ProductSkeletons";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import { ArrowLeft, ChevronRight } from "lucide-react";
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
  const { tree, loading: treeLoading, findBySlugPath, getAncestors, getAllDescendantIds } = useMenuCategories();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentNode, setCurrentNode] = useState<MenuCategoryNode | null>(null);
  const [childCategories, setChildCategories] = useState<MenuCategoryNode[]>([]);
  const [activeChild, setActiveChild] = useState<string | null>(null);

  useEffect(() => {
    if (treeLoading || !slugPath) return;
    const node = findBySlugPath(slugPath);
    setCurrentNode(node);
    setChildCategories(node?.children || []);
    setActiveChild(null);
    if (node) loadProducts(node);
    else { setProducts([]); setLoading(false); }
  }, [slugPath, treeLoading, tree]);

  const loadProducts = async (node: MenuCategoryNode) => {
    setLoading(true);
    const allIds = getAllDescendantIds(node.id);

    // Fetch from direct menu_category_id AND from junction table
    const [directRes, junctionRes] = await Promise.all([
      supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
        .in("menu_category_id", allIds).eq("is_active", true),
      supabase.from("product_menu_categories").select("product_id")
        .in("menu_category_id", allIds),
    ]);

    const directProducts = (directRes.data || []) as Product[];
    const junctionIds = [...new Set((junctionRes.data || []).map((l: any) => l.product_id))];

    let junctionProducts: Product[] = [];
    if (junctionIds.length > 0) {
      const { data } = await supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
        .in("id", junctionIds).eq("is_active", true);
      junctionProducts = (data || []) as Product[];
    }

    const map = new Map<string, Product>();
    [...directProducts, ...junctionProducts].forEach(p => map.set(p.id, p));
    setProducts([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
    setLoading(false);
  };

  const loadProductsForChild = async (childId: string) => {
    if (activeChild === childId) {
      setActiveChild(null);
      if (currentNode) loadProducts(currentNode);
      return;
    }
    setActiveChild(childId);
    setLoading(true);
    const childNode = childCategories.find(c => c.id === childId);
    if (childNode) {
      const allIds = getAllDescendantIds(childNode.id);
      const [directRes, junctionRes] = await Promise.all([
        supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
          .in("menu_category_id", allIds).eq("is_active", true),
        supabase.from("product_menu_categories").select("product_id")
          .in("menu_category_id", allIds),
      ]);

      const directProducts = (directRes.data || []) as Product[];
      const junctionIds = [...new Set((junctionRes.data || []).map((l: any) => l.product_id))];

      let junctionProducts: Product[] = [];
      if (junctionIds.length > 0) {
        const { data } = await supabase.from("products").select("id, name, price, original_price, image_url, stock_quantity, sku")
          .in("id", junctionIds).eq("is_active", true);
        junctionProducts = (data || []) as Product[];
      }

      const map = new Map<string, Product>();
      [...directProducts, ...junctionProducts].forEach(p => map.set(p.id, p));
      setProducts([...map.values()].sort((a, b) => a.name.localeCompare(b.name)));
    }
    setLoading(false);
  };

  const ancestors = currentNode ? getAncestors(currentNode.id) : [];
  const title = currentNode?.name || "Categoria";
  const description = currentNode?.description;

  const breadcrumbItems: { label: string; href?: string }[] = ancestors.map(a => {
    const ancestorNode = findNodeInTree(tree, a.id);
    return { label: a.name, href: `/categoria/${ancestorNode?.fullPath || a.slug}` };
  });
  breadcrumbItems.push({ label: title });

  function findNodeInTree(nodes: MenuCategoryNode[], id: string): MenuCategoryNode | null {
    for (const node of nodes) {
      if (node.id === id) return node;
      const found = findNodeInTree(node.children, id);
      if (found) return found;
    }
    return null;
  }

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

          {treeLoading || (loading && !products.length) ? (
            <ProductGridSkeleton count={8} />
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
              {description && <p className="text-muted-foreground mb-4">{description}</p>}

              {/* Subcategory chips */}
              {childCategories.length > 0 && (
                <div className="mb-6">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => { setActiveChild(null); if (currentNode) loadProducts(currentNode); }}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                        !activeChild
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "border border-border bg-card text-foreground hover:border-primary/50"
                      }`}
                    >
                      Todos
                    </button>
                    {childCategories.map(child => (
                      <button
                        key={child.id}
                        onClick={() => loadProductsForChild(child.id)}
                        className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all ${
                          activeChild === child.id
                            ? "bg-primary text-primary-foreground shadow-sm"
                            : "border border-border bg-card text-foreground hover:border-primary/50"
                        }`}
                      >
                        {child.name}
                        {child.children.length > 0 && (
                          <Link
                            to={`/categoria/${child.fullPath}`}
                            onClick={e => e.stopPropagation()}
                            className="ml-0.5 opacity-60 hover:opacity-100"
                          >
                            <ChevronRight className="h-3 w-3" />
                          </Link>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {loading ? (
                <ProductGridSkeleton count={8} />
              ) : products.length === 0 ? (
                <p className="text-center text-muted-foreground py-12">Nenhum produto nesta categoria ainda.</p>
              ) : (
                <>
                  <p className="text-sm text-muted-foreground mb-4">{products.length} produto{products.length !== 1 ? 's' : ''} encontrado{products.length !== 1 ? 's' : ''}</p>
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
                </>
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
