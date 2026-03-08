import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, ArrowRight, Tag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface FeaturedProduct {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
}

const HeroSection = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    supabase
      .from("products")
      .select("id, name, price, original_price, image_url")
      .eq("is_active", true)
      .eq("is_featured", true)
      .not("image_url", "is", null)
      .order("created_at", { ascending: false })
      .limit(10)
      .then(({ data }) => {
        if (data && data.length > 0) setProducts(data as FeaturedProduct[]);
      });
  }, []);

  useEffect(() => {
    if (products.length <= 1) return;
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % products.length);
    }, 4000);
    return () => clearInterval(interval);
  }, [products.length]);

  const current = products[currentIndex];

  return (
    <section className="relative w-full overflow-hidden bg-gradient-to-br from-foreground via-secondary to-foreground min-h-[520px] flex items-center">
      {/* Decorative grid pattern */}
      <div className="absolute inset-0 opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Green accent bar on top */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-primary" />

      <div className="container relative z-10 py-16 md:py-20">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          {/* Left: Text content */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7 }}
          >
            {/* Badge */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="inline-flex items-center gap-2 rounded-full border border-primary/40 bg-primary/10 px-4 py-1.5 mb-6"
            >
              <span className="h-2 w-2 rounded-full bg-primary animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-wider text-primary">
                Especialistas em Motores Estacionários
              </span>
            </motion.div>

            <h1 className="font-heading text-3xl md:text-4xl lg:text-5xl font-black leading-[1.1] tracking-tight">
              <span className="text-background">PEÇAS E MOTORES</span>
              <br />
              <span className="text-background">ESTACIONÁRIOS COM</span>
              <br />
              <span className="text-primary">QUALIDADE PROFISSIONAL</span>
            </h1>

            <p className="mt-5 text-base md:text-lg text-background/70 max-w-lg leading-relaxed">
              Filtros, carburadores, peças e assistência técnica especializada para motores{" "}
              <span className="text-accent font-bold">5HP, 7HP, 10HP, 13HP e 15HP</span>.
            </p>

            {/* CTAs */}
            <div className="mt-8 flex flex-wrap gap-4">
              <button
                onClick={() => navigate("/produtos")}
                className="group flex items-center gap-2 rounded-lg bg-primary px-8 py-4 font-heading font-extrabold text-primary-foreground text-sm uppercase tracking-wide hover:opacity-90 transition-all shadow-lg shadow-primary/30"
              >
                Ver Produtos
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </button>
              <a
                href="https://wa.me/5500000000000?text=Olá, gostaria de falar com um especialista Grundemann."
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 rounded-lg border-2 border-background/30 bg-background/5 px-8 py-4 font-heading font-extrabold text-background text-sm uppercase tracking-wide hover:bg-background/10 transition-all backdrop-blur-sm"
              >
                <MessageCircle className="h-4 w-4" />
                Falar com Especialista
              </a>
            </div>

            {/* Quick trust signals */}
            <div className="mt-8 flex gap-6 text-background/50 text-xs font-medium">
              <span>✓ Envio para todo Brasil</span>
              <span>✓ Garantia de qualidade</span>
              <span>✓ Suporte técnico</span>
            </div>
          </motion.div>

          {/* Right: Featured Product Showcase */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.3 }}
            className="flex items-center justify-center relative mt-6 lg:mt-0"
          >
            {/* Glow effect */}
            <div className="absolute w-80 h-80 rounded-full bg-primary/10 blur-3xl" />

            {current ? (
              <div
                className="relative z-10 w-80 cursor-pointer group"
                onClick={() => navigate(`/produto/${current.id}`)}
              >
                {/* Product card */}
                <div className="relative bg-background/5 backdrop-blur-md rounded-2xl border border-background/10 p-6 overflow-hidden">
                  {/* Discount badge */}
                  {current.original_price && current.original_price > current.price && (
                    <div className="absolute top-4 right-4 z-20 flex items-center gap-1 bg-accent text-accent-foreground text-xs font-black px-3 py-1.5 rounded-full shadow-lg">
                      <Tag className="h-3 w-3" />
                      -{Math.round(((current.original_price - current.price) / current.original_price) * 100)}%
                    </div>
                  )}

                  {/* Product image */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={current.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ duration: 0.5 }}
                      className="flex items-center justify-center h-56 mb-4"
                    >
                      <img
                        src={current.image_url || "/placeholder.svg"}
                        alt={current.name}
                        className="max-h-full max-w-full object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)] group-hover:scale-105 transition-transform duration-300"
                        loading="lazy"
                      />
                    </motion.div>
                  </AnimatePresence>

                  {/* Product info */}
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`info-${current.id}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.4, delay: 0.1 }}
                      className="text-center"
                    >
                      <h3 className="text-background font-heading font-bold text-sm leading-tight line-clamp-2 mb-3">
                        {current.name}
                      </h3>
                      <div className="flex items-center justify-center gap-3">
                        {current.original_price && current.original_price > current.price && (
                          <span className="text-background/40 line-through text-sm">
                            R$ {current.original_price.toFixed(2).replace(".", ",")}
                          </span>
                        )}
                        <span className="text-[#FFDF00] font-black text-2xl drop-shadow-[0_1px_2px_rgba(0,0,0,0.5)]">
                          R$ {current.price.toFixed(2).replace(".", ",")}
                        </span>
                      </div>
                      <span className="inline-block mt-3 text-xs text-primary font-bold uppercase tracking-wider group-hover:underline">
                        Ver produto →
                      </span>
                    </motion.div>
                  </AnimatePresence>
                </div>

                {/* Dots indicator */}
                {products.length > 1 && (
                  <div className="flex justify-center gap-1.5 mt-4">
                    {products.map((_, i) => (
                      <button
                        key={i}
                        onClick={(e) => { e.stopPropagation(); setCurrentIndex(i); }}
                        className={`h-1.5 rounded-full transition-all duration-300 ${i === currentIndex ? "w-6 bg-primary" : "w-1.5 bg-background/30"}`}
                      />
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="w-60 h-60 rounded-full border-2 border-primary/20 animate-pulse" />
            )}
          </motion.div>
        </div>
      </div>

      {/* Bottom green stripe */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-primary via-accent to-primary" />
    </section>
  );
};

export default HeroSection;
