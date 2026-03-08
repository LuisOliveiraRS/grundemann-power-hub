import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, ArrowLeft, Package, Play, FileText, Heart, Share2, Download } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FavoriteButton from "@/components/FavoriteButton";
import ProductSEO from "@/components/ProductSEO";

interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; image_url: string | null; category_id: string | null;
  additional_images: string[] | null; video_url: string | null;
  brand: string | null; hp: string | null; engine_model: string | null;
  specifications: any; documents: string[] | null;
  meta_title: string | null; meta_description: string | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [showVideo, setShowVideo] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<any[]>([]);

  useEffect(() => { if (id) loadProduct(); }, [id]);

  const loadProduct = async () => {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (data) {
      const p = data as Product;
      setProduct(p);
      setSelectedImage(p.image_url);
      if (data.category_id) {
        const { data: cat } = await supabase.from("categories").select("name").eq("id", data.category_id).single();
        if (cat) setCategoryName(cat.name);
        // Load related products
        const { data: related } = await supabase.from("products").select("id, name, price, image_url, sku").eq("category_id", data.category_id).neq("id", data.id).eq("is_active", true).limit(4);
        if (related) setRelatedProducts(related);
      }
    }
    setLoading(false);
  };

  const addToCart = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!product) return;
    const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id).single();
    if (existing) {
      await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id);
    } else {
      await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity });
    }
    toast({ title: `${quantity}x ${product.name} adicionado ao carrinho!` });
  };

  const allImages = product ? [product.image_url, ...(product.additional_images || [])].filter(Boolean) as string[] : [];

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const whatsappMessage = product
    ? `Olá, gostaria de mais informações sobre o produto ${product.name}${product.sku ? ` código ${product.sku}` : ""}.\n${window.location.href}`
    : "";

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <div className="flex-1 flex items-center justify-center flex-col gap-4">
        <p className="text-muted-foreground">Produto não encontrado.</p>
        <Button onClick={() => navigate("/")}>Voltar à Loja</Button>
      </div>
      <Footer />
    </div>
  );

  const discount = product.original_price ? Math.round((1 - product.price / product.original_price) * 100) : 0;
  const specs = product.specifications && typeof product.specifications === "object" ? Object.entries(product.specifications) : [];

  return (
    <div className="min-h-screen flex flex-col">
      <ProductSEO
        name={product.name}
        description={product.description}
        sku={product.sku}
        price={product.price}
        image={product.image_url}
        brand={product.brand}
        category={categoryName}
        stockQuantity={product.stock_quantity}
        metaTitle={product.meta_title}
        metaDescription={product.meta_description}
      />
      <TopBar /><Header />
      <div className="flex-1">
        <div className="container py-8">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
            <button onClick={() => navigate("/")} className="hover:text-foreground">Início</button>
            <span>/</span>
            {categoryName && <><button onClick={() => navigate("/produtos")} className="hover:text-foreground">{categoryName}</button><span>/</span></>}
            <span className="text-foreground font-medium truncate">{product.name}</span>
          </nav>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Image gallery */}
            <div>
              <div className="bg-card rounded-xl border border-border p-8 flex items-center justify-center aspect-square mb-3 relative">
                {showVideo && product.video_url ? (
                  (() => {
                    const embedUrl = getYouTubeEmbedUrl(product.video_url);
                    return embedUrl ? (
                      <iframe src={embedUrl} className="w-full h-full rounded-lg" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    ) : (
                      <video src={product.video_url} controls className="max-h-full max-w-full rounded-lg" />
                    );
                  })()
                ) : selectedImage ? (
                  <img src={selectedImage} alt={product.name} className="max-h-full max-w-full object-contain" />
                ) : (
                  <Package className="h-24 w-24 text-muted-foreground" />
                )}
                {/* Favorite + Share */}
                <div className="absolute top-3 right-3 flex gap-2">
                  <FavoriteButton productId={product.id} productName={product.name} isFavorite={isFavorite(product.id)} onToggle={toggleFavorite} size="md" />
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copiado!" }); }}
                    className="h-10 w-10 rounded-full flex items-center justify-center bg-card/80 text-muted-foreground hover:text-foreground backdrop-blur-sm border border-border shadow-sm"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
              </div>
              {(allImages.length > 1 || product.video_url) && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button key={idx} onClick={() => { setSelectedImage(img); setShowVideo(false); }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${selectedImage === img && !showVideo ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" />
                    </button>
                  ))}
                  {product.video_url && (
                    <button onClick={() => setShowVideo(true)}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 flex items-center justify-center bg-muted transition-all ${showVideo ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}>
                      <Play className="h-6 w-6 text-primary" />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div>
              {categoryName && <p className="text-sm text-muted-foreground mb-2">{categoryName}</p>}
              <h1 className="font-heading text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>
              <div className="flex flex-wrap gap-2 mb-3">
                {product.sku && <Badge variant="outline" className="text-xs">Código: {product.sku}</Badge>}
                {product.brand && <Badge variant="secondary" className="text-xs">Marca: {product.brand}</Badge>}
                {product.hp && <Badge variant="secondary" className="text-xs">{product.hp} HP</Badge>}
                {product.engine_model && <Badge variant="secondary" className="text-xs">Motor: {product.engine_model}</Badge>}
              </div>
              
              {product.original_price && (
                <div className="flex items-center gap-3 mb-1">
                  <span className="text-muted-foreground line-through text-lg">R$ {Number(product.original_price).toFixed(2).replace(".",",")}</span>
                  <Badge variant="destructive">{discount}% OFF</Badge>
                </div>
              )}
              <p className="font-heading text-4xl font-extrabold text-price mb-1">R$ {Number(product.price).toFixed(2).replace(".",",")}</p>
              <p className="text-sm text-muted-foreground mb-6">ou 3x de R$ {(product.price / 3).toFixed(2).replace(".",",")} sem juros</p>

              <div className="mb-6">
                {product.stock_quantity > 0 ? (
                  <Badge variant="outline" className="text-primary border-primary"><Package className="h-3 w-3 mr-1" /> {product.stock_quantity} em estoque</Badge>
                ) : (
                  <Badge variant="destructive">Fora de estoque</Badge>
                )}
              </div>

              {product.stock_quantity > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-6">
                    <Label className="text-sm font-semibold">Quantidade:</Label>
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted rounded-l-lg"><Minus className="h-4 w-4" /></button>
                      <span className="w-12 text-center font-bold">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="p-2 hover:bg-muted rounded-r-lg"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="text-base px-8" onClick={addToCart}>
                      <ShoppingCart className="h-5 w-5 mr-2" /> Adicionar ao Carrinho
                    </Button>
                    <Button size="lg" variant="outline" className="text-base" onClick={() => {
                      const saved = JSON.parse(localStorage.getItem("quote_items") || "[]");
                      const existing = saved.find((i: any) => i.product_id === product.id);
                      if (existing) { existing.quantity += quantity; }
                      else { saved.push({ product_id: product.id, product_name: product.name, product_sku: product.sku || "", quantity, unit_price: product.price, image_url: product.image_url }); }
                      localStorage.setItem("quote_items", JSON.stringify(saved));
                      toast({ title: "Produto adicionado ao orçamento!" });
                    }}>
                      <FileText className="h-5 w-5 mr-2" /> Solicitar Orçamento
                    </Button>
                  </div>
                  {/* WhatsApp product button */}
                  <div className="mt-4">
                    <WhatsAppButton floating={false} message={whatsappMessage} label="Falar sobre este produto no WhatsApp" />
                  </div>
                </>
              )}

              {/* Description */}
              {product.description && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="font-heading font-bold text-lg mb-3">Descrição</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {specs.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-heading font-bold text-lg mb-3">Especificações Técnicas</h3>
                  <div className="bg-muted/30 rounded-lg overflow-hidden">
                    {specs.map(([key, value], idx) => (
                      <div key={key} className={`flex justify-between px-4 py-3 text-sm ${idx % 2 === 0 ? "bg-muted/20" : ""}`}>
                        <span className="font-medium text-muted-foreground">{key}</span>
                        <span className="font-semibold">{String(value)}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {product.documents && product.documents.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h3 className="font-heading font-bold text-lg mb-3">Documentos Técnicos</h3>
                  <div className="space-y-2">
                    {product.documents.map((doc, idx) => (
                      <a key={idx} href={doc} target="_blank" rel="noopener noreferrer"
                        className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-muted/30 transition-colors">
                        <Download className="h-4 w-4 text-primary" />
                        <span className="text-sm font-medium">Documento {idx + 1}</span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-16 border-t border-border pt-10">
              <h2 className="font-heading text-2xl font-bold mb-6">Produtos Relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p: any) => (
                  <div key={p.id} onClick={() => navigate(`/produto/${p.id}`)} className="bg-card rounded-lg border border-border p-4 cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="aspect-square bg-muted rounded-lg mb-3 flex items-center justify-center overflow-hidden">
                      {p.image_url ? <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain" /> : <Package className="h-10 w-10 text-muted-foreground" />}
                    </div>
                    <h3 className="font-heading text-sm font-semibold line-clamp-2">{p.name}</h3>
                    {p.sku && <p className="text-[10px] text-muted-foreground mt-1">Cód: {p.sku}</p>}
                    <p className="font-heading text-lg font-bold text-price mt-2">R$ {Number(p.price).toFixed(2).replace(".", ",")}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
      <WhatsAppButton message={whatsappMessage} />
      <Footer />
    </div>
  );
};

export default ProductDetail;
