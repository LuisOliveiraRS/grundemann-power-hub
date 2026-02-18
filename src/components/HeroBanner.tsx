import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

const staticSlides = [
  {
    image: banner1,
    title: "Geradores Diesel\nde Alta Potência",
    subtitle: "Soluções completas para sua empresa",
    cta: "Confira",
    ctaLink: "/categoria/geradores-diesel",
    badge: null,
  },
  {
    image: banner2,
    title: "Peças e\nComponentes",
    subtitle: "Originais e de alta qualidade",
    cta: "Ver Peças",
    ctaLink: "/categoria/pecas-e-componentes",
    badge: null,
  },
  {
    image: banner3,
    title: "Manutenção\nPreventiva",
    subtitle: "Equipe técnica especializada",
    cta: "Agendar Serviço",
    ctaLink: "/categoria/manutencao",
    badge: null,
  },
];

interface OfferProduct {
  id: string;
  name: string;
  price: number;
  original_price: number;
  image_url: string | null;
}

interface Slide {
  image: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  badge: string | null;
  discount?: number;
  productId?: string;
}

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>(staticSlides);
  const navigate = useNavigate();

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), [slides.length]);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  useEffect(() => {
    const loadOffers = async () => {
      const { data } = await supabase
        .from("products")
        .select("id, name, price, original_price, image_url")
        .not("original_price", "is", null)
        .eq("is_active", true)
        .order("created_at", { ascending: false })
        .limit(3);

      if (!data || data.length === 0) return;

      const offerSlides: Slide[] = (data as OfferProduct[])
        .filter((p) => p.original_price && p.original_price > p.price)
        .map((p) => {
          const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
          return {
            image: p.image_url || banner1,
            title: p.name,
            subtitle: `De R$ ${p.original_price.toFixed(2).replace(".", ",")} por R$ ${p.price.toFixed(2).replace(".", ",")}`,
            cta: "Ver Oferta",
            ctaLink: `/produto/${p.id}`,
            badge: `${discount}% OFF`,
            discount,
            productId: p.id,
          };
        });

      if (offerSlides.length > 0) {
        setSlides([...offerSlides, ...staticSlides]);
      }
    };
    loadOffers();
  }, []);

  const currentSlide = slides[current] || staticSlides[0];

  return (
    <section className="relative w-full h-[500px] overflow-hidden bg-foreground">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          <img
            src={currentSlide.image}
            alt={currentSlide.title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/50 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-lg"
              >
                {currentSlide.badge && (
                  <div className="inline-flex items-center gap-1.5 bg-accent text-accent-foreground rounded-full px-3 py-1 text-sm font-bold mb-3 shadow-lg">
                    <Tag className="h-3.5 w-3.5" />
                    {currentSlide.badge}
                  </div>
                )}
                <h2 className="font-heading text-4xl md:text-5xl font-extrabold text-background leading-tight whitespace-pre-line line-clamp-3">
                  {currentSlide.title}
                </h2>
                <p className="mt-3 text-lg text-background/80">
                  {currentSlide.subtitle}
                </p>
                <button
                  onClick={() => navigate(currentSlide.ctaLink)}
                  className="mt-6 rounded-lg bg-primary px-8 py-3 font-heading font-bold text-primary-foreground text-lg hover:opacity-90 transition-opacity shadow-lg"
                >
                  {currentSlide.cta}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background hover:bg-background/40 transition-colors">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background hover:bg-background/40 transition-colors">
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? "bg-primary w-6 h-3" : "bg-background/50 w-3 h-3"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
