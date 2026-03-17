import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { useFavorites } from "@/hooks/useFavorites";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ShoppingCart, Minus, Plus, ArrowLeft, Package, Play, FileText, Heart, Share2, Download, Cpu, Truck, ShieldCheck, Clock, CreditCard, HelpCircle, ChevronRight } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import CategoryNav from "@/components/CategoryNav";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";
import FavoriteButton from "@/components/FavoriteButton";
import ProductSEO from "@/components/ProductSEO";
import ProductReviews from "@/components/ProductReviews";
import SEOBreadcrumb from "@/components/SEOBreadcrumb";
import AIAssistant from "@/components/AIAssistant";
import ProductCard from "@/components/ProductCard";
import RecentlyViewed, { addToRecentlyViewed } from "@/components/RecentlyViewed";
import ProductRecommendations from "@/components/ProductRecommendations";
import { addToGuestCart } from "@/lib/guestCart";

interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; image_url: string | null; category_id: string | null;
  additional_images: string[] | null; video_url: string | null;
  brand: string | null; hp: string | null; engine_model: string | null;
  specifications: any; documents: string[] | null;
  meta_title: string | null; meta_description: string | null;
  compatible_motors: string[] | null; free_shipping: boolean;
}

const faqItems = [
  { q: "Como funciona o envio?", a: "Enviamos para todo o Brasil via PAC e SEDEX. Após o pagamento, o pedido é processado em até 24h úteis." },
  { q: "Quais formas de pagamento?", a: "Aceitamos PIX (5% de desconto), cartão de crédito (Visa, Mastercard) em até 3x sem juros, e boleto bancário." },
  { q: "O produto vem com garantia?", a: "Sim! Todos os nossos produtos possuem garantia contra defeitos de fabricação conforme legislação vigente." },
  { q: "Posso trocar ou devolver?", a: "Sim, oferecemos 7 dias para devolução após o recebimento, conforme o Código de Defesa do Consumidor." },
  { q: "Como saber se a peça é compatível com meu motor?", a: "Verifique a seção 'Compatível Com' na página do produto ou entre em contato pelo WhatsApp para confirmar." },
];

const isUUID = (s: string) => /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(s);

const ProductDetail = () => {
  const { idOrSlug: id } = useParams();
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
  const [compatibleProducts, setCompatibleProducts] = useState<any[]>([]);
  const [compatibleModels, setCompatibleModels] = useState<any[]>([]);
  const [zoomedImage, setZoomedImage] = useState(false);
  const [zoomPos, setZoomPos] = useState({ x: 50, y: 50 });

  useEffect(() => { if (id) loadProduct(); }, [id]);

  const loadProduct = async () => {
    setLoading(true);
    const col = isUUID(id || "") ? "id" : "slug";
    const { data, error } = await supabase.from("products").select("*").eq(col, id).single();
    if (error || !data) {
      console.error("Erro ao carregar produto:", error?.message);
      setProduct(null);
      setLoading(false);
      return;
    }
    {
      const p = data as Product;
      setProduct(p);
      setSelectedImage(p.image_url);
      addToRecentlyViewed({ id: p.id, name: p.name, price: p.price, image_url: p.image_url });
      
      const promises: any[] = [];
      
      if (data.category_id) {
        promises.push(
          supabase.from("categories").select("name").eq("id", data.category_id).single().then(({ data: cat }) => {
            if (cat) setCategoryName(cat.name);
          }),
          supabase.from("products").select("id, name, price, original_price, image_url, sku, stock_quantity")
            .eq("category_id", data.category_id).neq("id", data.id).eq("is_active", true).limit(4)
            .then(({ data: related }) => { if (related) setRelatedProducts(related); })
        );
      }
      
      // Load compatible products from product_models table
      promises.push(
        supabase.from("product_models").select("model_id, notes, generator_models(id, name, brand, hp, engine_type)")
          .eq("product_id", data.id)
          .then(({ data: pm }) => {
            if (pm && pm.length > 0) {
              setCompatibleModels(pm.map((r: any) => ({ ...r.generator_models, notes: r.notes })));
            }
          })
      );

      // Load compatible products (same engine_model or HP) as fallback
      if (data.engine_model || data.hp) {
        let query = supabase.from("products").select("id, name, price, original_price, image_url, sku, stock_quantity")
          .eq("is_active", true).neq("id", data.id).limit(4);
        if (data.engine_model) query = query.eq("engine_model", data.engine_model);
        else if (data.hp) query = query.eq("hp", data.hp);
        promises.push(query.then(({ data: compat }) => { if (compat) setCompatibleProducts(compat); }));
      }
      
      await Promise.all(promises);
    }
    setLoading(false);
  };

  const addToCart = async () => {
    if (!product) return;
    if (user) {
      const { data: existing } = await supabase.from("cart_items").select("id, quantity").eq("user_id", user.id).eq("product_id", product.id).maybeSingle();
      let error;
      if (existing) {
        ({ error } = await supabase.from("cart_items").update({ quantity: existing.quantity + quantity }).eq("id", existing.id));
      } else {
        ({ error } = await supabase.from("cart_items").insert({ user_id: user.id, product_id: product.id, quantity }));
      }
      if (error) { toast({ title: "Erro ao adicionar", description: error.message, variant: "destructive" }); return; }
    } else {
      addToGuestCart({ product_id: product.id, quantity, product: { name: product.name, price: product.price, image_url: product.image_url } });
    }
    toast({ title: `${quantity}x ${product.name} adicionado ao carrinho!` });
    window.dispatchEvent(new CustomEvent("open-cart-drawer"));
  };

  const allImages = product ? [product.image_url, ...(product.additional_images || [])].filter(Boolean) as string[] : [];

  const getYouTubeEmbedUrl = (url: string) => {
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]+)/);
    return match ? `https://www.youtube.com/embed/${match[1]}` : null;
  };

  const handleImageMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    setZoomPos({ x, y });
  };

  const whatsappMessage = product
    ? `Olá, gostaria de mais informações sobre o produto ${product.name}${product.sku ? ` código ${product.sku}` : ""}.\n${window.location.href}`
    : "";

  if (loading) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1 flex items-center justify-center"><div className="animate-spin h-8 w-8 border-4 border-primary border-t-transparent rounded-full" /></div>
      <Footer />
    </div>
  );

  if (!product) return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header /><CategoryNav />
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
      <TopBar /><Header /><CategoryNav />
      <div className="flex-1">
        <div className="container py-6 md:py-8">
          {/* Breadcrumb */}
          <SEOBreadcrumb items={[
            ...(categoryName ? [{ label: categoryName, href: "/produtos" }] : []),
            { label: product.name },
          ]} />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-10">
            {/* Image gallery with zoom */}
            <div>
              <div
                className="bg-card rounded-xl border border-border p-4 md:p-8 flex items-center justify-center aspect-square mb-3 relative overflow-hidden cursor-crosshair"
                onMouseEnter={() => setZoomedImage(true)}
                onMouseLeave={() => setZoomedImage(false)}
                onMouseMove={handleImageMouseMove}
              >
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
                  <img
                    src={selectedImage}
                    alt={product.name}
                    className={`max-h-full max-w-full object-contain transition-transform duration-200 ${zoomedImage ? 'scale-[2]' : ''}`}
                    style={zoomedImage ? { transformOrigin: `${zoomPos.x}% ${zoomPos.y}%` } : undefined}
                    loading="lazy"
                  />
                ) : (
                  <Package className="h-24 w-24 text-muted-foreground" />
                )}
                {/* Favorite + Share */}
                <div className="absolute top-3 right-3 flex gap-2 z-10">
                  <FavoriteButton productId={product.id} productName={product.name} isFavorite={isFavorite(product.id)} onToggle={toggleFavorite} size="md" />
                  <button
                    onClick={() => { navigator.clipboard.writeText(window.location.href); toast({ title: "Link copiado!" }); }}
                    className="h-10 w-10 rounded-full flex items-center justify-center bg-card/80 text-muted-foreground hover:text-foreground backdrop-blur-sm border border-border shadow-sm"
                  >
                    <Share2 className="h-5 w-5" />
                  </button>
                </div>
                {!showVideo && <span className="absolute bottom-3 left-3 text-[10px] text-muted-foreground bg-card/80 backdrop-blur-sm px-2 py-1 rounded">🔍 Passe o mouse para ampliar</span>}
              </div>
              {(allImages.length > 1 || product.video_url) && (
                <div className="flex gap-2 overflow-x-auto pb-1">
                  {allImages.map((img, idx) => (
                    <button key={idx} onClick={() => { setSelectedImage(img); setShowVideo(false); }}
                      className={`flex-shrink-0 w-16 h-16 rounded-lg border-2 overflow-hidden transition-all ${selectedImage === img && !showVideo ? 'border-primary shadow-md' : 'border-border hover:border-primary/50'}`}>
                      <img src={img} alt={`${idx + 1}`} className="w-full h-full object-cover" loading="lazy" />
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
              <p className="font-heading text-3xl md:text-4xl font-extrabold text-price mb-1">R$ {Number(product.price).toFixed(2).replace(".",",")}</p>
              <p className="text-sm text-muted-foreground mb-2">ou 3x de R$ {(product.price / 3).toFixed(2).replace(".",",")} sem juros</p>
              <p className="text-sm text-primary font-bold mb-4">💰 No PIX: R$ {(product.price * 0.95).toFixed(2).replace(".",",")} (5% OFF)</p>

              {/* Trust signals inline */}
              <div className="flex flex-wrap gap-3 mb-5 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Truck className="h-3.5 w-3.5 text-primary" />{product.free_shipping ? "Frete Grátis" : "Envio todo Brasil"}</span>
                <span className="flex items-center gap-1"><ShieldCheck className="h-3.5 w-3.5 text-primary" />Garantia</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5 text-primary" />Envio em 24h</span>
                <span className="flex items-center gap-1"><CreditCard className="h-3.5 w-3.5 text-primary" />3x sem juros</span>
              </div>

              <div className="mb-5">
                {product.stock_quantity > 0 ? (
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className="text-primary border-primary"><Package className="h-3 w-3 mr-1" /> Em estoque</Badge>
                    {product.stock_quantity <= 5 && <span className="text-xs text-destructive font-bold animate-pulse">⚡ Últimas {product.stock_quantity} unidades!</span>}
                  </div>
                ) : (
                  <Badge variant="destructive">Fora de estoque</Badge>
                )}
              </div>

              {product.stock_quantity > 0 && (
                <>
                  <div className="flex items-center gap-3 mb-5">
                    <Label className="text-sm font-semibold">Quantidade:</Label>
                    <div className="flex items-center border border-border rounded-lg">
                      <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="p-2 hover:bg-muted rounded-l-lg"><Minus className="h-4 w-4" /></button>
                      <span className="w-12 text-center font-bold">{quantity}</span>
                      <button onClick={() => setQuantity(Math.min(product.stock_quantity, quantity + 1))} className="p-2 hover:bg-muted rounded-r-lg"><Plus className="h-4 w-4" /></button>
                    </div>
                  </div>
                  <div className="flex flex-col sm:flex-row gap-3">
                    <Button size="lg" className="text-base px-8 shadow-lg shadow-primary/20" onClick={addToCart}>
                      <ShoppingCart className="h-5 w-5 mr-2" /> Adicionar ao Carrinho
                    </Button>
                    <Button size="lg" variant="outline" className="text-base" onClick={() => {
                      if (!user) { navigate("/auth"); return; }
                      const saved = JSON.parse(localStorage.getItem("quote_items") || "[]");
                      const existing = saved.find((i: any) => i.product_id === product.id);
                      if (existing) { existing.quantity += quantity; }
                      else { saved.push({ product_id: product.id, product_name: product.name, product_sku: product.sku || "", quantity, unit_price: product.price, image_url: product.image_url }); }
                      localStorage.setItem("quote_items", JSON.stringify(saved));
                      toast({ title: "Produto adicionado ao orçamento!" });
                    }}>
                      <FileText className="h-5 w-5 mr-2" /> Adicionar ao Orçamento
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
                  <h2 className="font-heading font-bold text-lg mb-3">Descrição</h2>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}

              {/* Specifications */}
              {specs.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-heading font-bold text-lg mb-3">Especificações Técnicas</h2>
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

              {/* Motor Compatibility */}
              {product.compatible_motors && product.compatible_motors.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-heading font-bold text-lg mb-3 flex items-center gap-2">
                    <Cpu className="h-5 w-5 text-primary" /> Compatível Com
                  </h2>
                  <div className="flex flex-wrap gap-2">
                    {product.compatible_motors.map((motor, idx) => (
                      <Badge key={idx} variant="outline" className="text-sm px-3 py-1.5 border-primary/30 bg-primary/5 text-primary font-semibold">
                        {motor}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents */}
              {product.documents && product.documents.length > 0 && (
                <div className="mt-6 border-t border-border pt-6">
                  <h2 className="font-heading font-bold text-lg mb-3">Documentos Técnicos</h2>
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

          {/* Compatible Models (from product_models) */}
          {compatibleModels.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <h2 className="font-heading text-2xl font-bold mb-4 flex items-center gap-2">
                <Cpu className="h-6 w-6 text-primary" /> Compatível Com
              </h2>
              <div className="flex flex-wrap gap-2 mb-6">
                {compatibleModels.map((m: any) => (
                  <Badge key={m.id} variant="secondary" className="text-sm py-1.5 px-3 gap-1.5">
                    <Cpu className="h-3.5 w-3.5" />
                    {m.name}
                    {m.brand && <span className="text-muted-foreground">({m.brand})</span>}
                    {m.hp && <span className="text-muted-foreground">· {m.hp}HP</span>}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {/* Compatible Products */}
          {compatibleProducts.length > 0 && (
            <div className={`${compatibleModels.length > 0 ? "mt-6" : "mt-14 border-t border-border pt-8"}`}>
              <h2 className="font-heading text-2xl font-bold mb-6 flex items-center gap-2">
                <Package className="h-6 w-6 text-primary" /> Peças Compatíveis
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {compatibleProducts.map((p: any) => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
                ))}
              </div>
            </div>
          )}

          {/* Smart Recommendations */}
          <ProductRecommendations productId={product.id} productName={product.name} categoryId={product.category_id} />

          {/* Product Reviews */}
          <ProductReviews productId={product.id} productName={product.name} />

          {/* Related products */}
          {relatedProducts.length > 0 && (
            <div className="mt-14 border-t border-border pt-8">
              <h2 className="font-heading text-2xl font-bold mb-6">Produtos Relacionados</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {relatedProducts.map((p: any) => (
                  <ProductCard key={p.id} id={p.id} name={p.name} image={p.image_url || "/placeholder.svg"} price={p.price} oldPrice={p.original_price || undefined} sku={p.sku || undefined} stockQuantity={p.stock_quantity} />
                ))}
              </div>
            </div>
          )}

          {/* FAQ */}
          <div className="mt-14 border-t border-border pt-8 max-w-3xl mx-auto">
            <h2 className="font-heading text-2xl font-bold mb-6 text-center flex items-center justify-center gap-2">
              <HelpCircle className="h-6 w-6 text-primary" /> Perguntas Frequentes
            </h2>
            <Accordion type="single" collapsible className="w-full">
              {faqItems.map((faq, idx) => (
                <AccordionItem key={idx} value={`faq-${idx}`}>
                  <AccordionTrigger className="text-left font-semibold">{faq.q}</AccordionTrigger>
                  <AccordionContent className="text-muted-foreground">{faq.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>
        </div>
      </div>

      {/* Sticky mobile buy button */}
      {product.stock_quantity > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-card/95 backdrop-blur-sm border-t border-border p-3 safe-area-bottom">
          <div className="flex items-center gap-3">
            <div className="flex-1 min-w-0">
              <p className="font-heading text-lg font-extrabold text-price truncate">R$ {Number(product.price).toFixed(2).replace(".",",")}</p>
              <p className="text-[10px] text-muted-foreground">3x R$ {(product.price / 3).toFixed(2).replace(".",",")} s/juros</p>
            </div>
            <Button size="lg" className="shadow-lg shadow-primary/30 px-6" onClick={addToCart}>
              <ShoppingCart className="h-5 w-5 mr-2" /> Comprar
            </Button>
          </div>
        </div>
      )}

      <RecentlyViewed />
      <WhatsAppButton message={whatsappMessage} />
      <AIAssistant />
      <Footer />
    </div>
  );
};

export default ProductDetail;
