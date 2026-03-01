import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Minus, Plus, ArrowLeft, Package, MessageCircle } from "lucide-react";
import TopBar from "@/components/TopBar";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppButton from "@/components/WhatsAppButton";

interface Product {
  id: string; name: string; description: string | null; sku: string | null;
  price: number; original_price: number | null; stock_quantity: number;
  is_active: boolean; image_url: string | null; category_id: string | null;
}

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const [product, setProduct] = useState<Product | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [loading, setLoading] = useState(true);
  const [categoryName, setCategoryName] = useState("");

  useEffect(() => { if (id) loadProduct(); }, [id]);

  const loadProduct = async () => {
    const { data } = await supabase.from("products").select("*").eq("id", id).single();
    if (data) {
      setProduct(data as Product);
      if (data.category_id) {
        const { data: cat } = await supabase.from("categories").select("name").eq("id", data.category_id).single();
        if (cat) setCategoryName(cat.name);
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

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar /><Header />
      <div className="flex-1">
        <div className="container py-8">
          <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground mb-6">
            <ArrowLeft className="h-4 w-4" /> Voltar
          </button>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-card rounded-xl border border-border p-8 flex items-center justify-center aspect-square">
              {product.image_url ? (
                <img src={product.image_url} alt={product.name} className="max-h-full max-w-full object-contain" />
              ) : (
                <Package className="h-24 w-24 text-muted-foreground" />
              )}
            </div>

            <div>
              {categoryName && <p className="text-sm text-muted-foreground mb-2">{categoryName}</p>}
              <h1 className="font-heading text-2xl md:text-3xl font-bold mb-3">{product.name}</h1>
              {product.sku && <p className="text-sm text-muted-foreground mb-4">Código: {product.sku}</p>}
              
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
                    <WhatsAppButton
                      floating={false}
                      message={`Olá! Tenho interesse no produto: ${product.name} (R$ ${product.price.toFixed(2).replace(".",",")})`}
                      label="Comprar via WhatsApp"
                    />
                  </div>
                </>
              )}

              {product.description && (
                <div className="mt-8 border-t border-border pt-6">
                  <h3 className="font-heading font-bold text-lg mb-3">Descrição</h3>
                  <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{product.description}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      <WhatsAppButton message={`Olá! Estou vendo o produto: ${product.name}`} />
      <Footer />
    </div>
  );
};

export default ProductDetail;
