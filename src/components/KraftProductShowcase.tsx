import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  description: string | null;
  hp: string | null;
  brand: string | null;
}

const KraftProductShowcase = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, original_price, image_url, description, hp, brand")
      .eq("is_active", true)
      .eq("is_featured", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(6)
      .then(({ data }) => {
        if (data) setProducts(data as Product[]);
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-16 md:py-24 bg-background">
      <div className="container">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="font-heading text-3xl md:text-4xl font-black text-foreground">
            Produtos em Destaque
          </h2>
          <p className="text-muted-foreground mt-3 text-lg max-w-2xl mx-auto">
            Peças e motores estacionários selecionados com qualidade profissional
          </p>
        </div>

        <div className="space-y-16 md:space-y-24">
          {products.map((product, i) => {
            const isEven = i % 2 === 0;
            return (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6 }}
                className={`grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-16 items-center ${
                  !isEven ? "md:direction-rtl" : ""
                }`}
              >
                {/* Image */}
                <div className={`${!isEven ? "md:order-2" : ""}`}>
                  <div
                    className="relative bg-muted/30 rounded-2xl p-8 md:p-12 flex items-center justify-center cursor-pointer group overflow-hidden"
                    onClick={() => navigate(`/produto/${product.id}`)}
                  >
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                    <img
                      src={product.image_url || "/placeholder.svg"}
                      alt={product.name}
                      className="max-h-64 md:max-h-80 w-auto object-contain group-hover:scale-105 transition-transform duration-500 drop-shadow-lg"
                      loading="lazy"
                    />
                  </div>
                </div>

                {/* Info */}
                <div className={`${!isEven ? "md:order-1" : ""}`}>
                  {product.brand && (
                    <span className="text-xs font-bold uppercase tracking-widest text-primary mb-2 block">
                      {product.brand}
                    </span>
                  )}
                  <h3 className="font-heading text-2xl md:text-3xl font-black text-foreground leading-tight">
                    {product.name}
                  </h3>

                  {product.hp && (
                    <p className="mt-2 text-sm text-muted-foreground">
                      Potência: <span className="font-bold text-foreground">{product.hp}</span>
                    </p>
                  )}

                  {product.description && (
                    <p className="mt-4 text-muted-foreground leading-relaxed line-clamp-3">
                      {product.description}
                    </p>
                  )}

                  {/* Price */}
                  <div className="mt-6 flex items-baseline gap-3">
                    {product.original_price && product.original_price > product.price && (
                      <span className="text-muted-foreground line-through text-lg">
                        R$ {product.original_price.toFixed(2).replace(".", ",")}
                      </span>
                    )}
                    <span className="text-price font-black text-3xl">
                      R$ {product.price.toFixed(2).replace(".", ",")}
                    </span>
                  </div>

                  <button
                    onClick={() => navigate(`/produto/${product.id}`)}
                    className="mt-6 group inline-flex items-center gap-2 bg-primary text-primary-foreground font-heading font-bold text-sm uppercase tracking-wide px-6 py-3 rounded-lg hover:bg-primary/90 transition-all"
                  >
                    Mais informações
                    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default KraftProductShowcase;
