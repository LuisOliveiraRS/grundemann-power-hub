import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Tag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";
import bannerBg1 from "@/assets/banner-bg-1.jpg";
import bannerBg2 from "@/assets/banner-bg-2.jpg";
import bannerBg3 from "@/assets/banner-bg-3.jpg";
import mlFiltro13hp from "@/assets/ml-filtro-ar-13hp.webp";
import mlCarburador from "@/assets/ml-carburador.webp";
import mlFiltro8hp from "@/assets/ml-filtro-ar-8hp.webp";

interface Slide {
  image: string;
  bgImage?: string;
  title: string;
  subtitle: string;
  cta: string;
  ctaLink: string;
  badge: string | null;
  price: number | null;
  originalPrice: number | null;
  discount: number;
  isExternal?: boolean;
}

const formatPrice = (value: number) => {
  const [reais, cents] = value.toFixed(2).split(".");
  return { reais, cents };
};

const mlProductSlides: Slide[] = [
  {
    image: mlFiltro13hp,
    bgImage: bannerBg1,
    title: "Filtro De Ar Motor\nGasolina 13hp 15hp",
    subtitle: "Branco Buffalo Toyama",
    cta: "Comprar no ML",
    ctaLink: "https://www.mercadolivre.com.br/filtro-de-ar-motor-gasolina-13hp-15hp-branco-buffalo-toyama/p/MLB23326643",
    badge: "⭐ 4.8 (26)",
    price: 79,
    originalPrice: null,
    discount: 0,
    isExternal: true,
  },
  {
    image: mlCarburador,
    bgImage: bannerBg2,
    title: "Carburador Para\nGeradores 2500w 3000w",
    subtitle: "Com Motor 5,5hp 6,5hp",
    cta: "Comprar no ML",
    ctaLink: "https://www.mercadolivre.com.br/carburador-para-geradores-2500w-3000w-com-motor-55hp-65hp/p/MLB47832188",
    badge: "Frete Grátis",
    price: 128.79,
    originalPrice: null,
    discount: 0,
    isExternal: true,
  },
  {
    image: mlFiltro8hp,
    bgImage: bannerBg2,
    title: "Elemento Filtro De Ar\nMotor 8hp E 9hp",
    subtitle: "Branco Buffalo Toyama",
    cta: "Comprar no ML",
    ctaLink: "https://produto.mercadolivre.com.br/MLB-4497730003-elemento-filtro-de-ar-motor-8hp-e-9hp-branco-buffalo-toyama-_JM",
    badge: "Frete Grátis",
    price: 59,
    originalPrice: null,
    discount: 0,
    isExternal: true,
  },
];

const staticSlides: Slide[] = [
  {
    image: banner1,
    bgImage: bannerBg1,
    title: "Geradores Diesel\nde Alta Potência",
    subtitle: "Soluções completas para sua empresa com equipamentos robustos e confiáveis",
    cta: "Confira",
    ctaLink: "/categoria/geradores-diesel",
    badge: null,
    price: null,
    originalPrice: null,
    discount: 0,
    isExternal: false,
  },
  {
    image: banner2,
    bgImage: bannerBg2,
    title: "Peças e\nComponentes",
    subtitle: "Filtros, carburadores, pistões e mais — originais e de alta qualidade",
    cta: "Ver Peças",
    ctaLink: "/categoria/pecas-e-componentes",
    badge: null,
    price: null,
    originalPrice: null,
    discount: 0,
    isExternal: false,
  },
  {
    image: banner3,
    bgImage: bannerBg3,
    title: "Manutenção\nPreventiva",
    subtitle: "Equipe técnica especializada para manter seu gerador em pleno funcionamento",
    cta: "Agendar Serviço",
    ctaLink: "/categoria/manutencao",
    badge: null,
    price: null,
    originalPrice: null,
    discount: 0,
    isExternal: false,
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);
  const [slides, setSlides] = useState<Slide[]>([...mlProductSlides, ...staticSlides]);
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

      const offerSlides: Slide[] = data
        .filter((p: any) => p.original_price && p.original_price > p.price)
        .map((p: any) => {
          const discount = Math.round(((p.original_price - p.price) / p.original_price) * 100);
          return {
            image: p.image_url || banner1,
            bgImage: bannerBg1,
            title: p.name,
            subtitle: "",
            cta: "Ver Oferta",
            ctaLink: `/produto/${p.id}`,
            badge: `${discount}% OFF`,
            price: p.price,
            originalPrice: p.original_price,
            discount,
          };
        });

      if (offerSlides.length > 0) {
        setSlides([...mlProductSlides, ...offerSlides, ...staticSlides]);
      }
    };
    loadOffers();
  }, []);

  const currentSlide = slides[current] || staticSlides[0];
  const hasPrice = !!currentSlide.price;
  const isProduct = currentSlide.isExternal || hasPrice;

  return (
    <section className="relative w-full h-[520px] overflow-hidden">
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0"
        >
          {/* Background image layer */}
          {currentSlide.bgImage && (
            <>
              <img
                src={currentSlide.bgImage}
                alt=""
                className="absolute inset-0 w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-foreground/85 via-foreground/50 to-foreground/20" />
            </>
          )}
          {!currentSlide.bgImage && <div className="absolute inset-0 bg-foreground/90" />}

          {/* Product image on the right side */}
          <div className="absolute right-0 top-0 h-full w-1/2 md:w-[50%] flex items-center justify-center">
            <img
              src={currentSlide.image}
              alt={currentSlide.title}
              className={`max-h-[80%] max-w-[80%] ${isProduct ? 'object-contain drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]' : 'object-cover rounded-lg shadow-2xl'}`}
            />
          </div>

          {/* Content on the left */}
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-xl"
              >
                {currentSlide.badge && (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="inline-flex items-center gap-1.5 bg-destructive text-destructive-foreground rounded-full px-4 py-1.5 text-sm font-extrabold mb-4 shadow-lg"
                  >
                    <Tag className="h-4 w-4" />
                    {currentSlide.badge}
                  </motion.div>
                )}

                <h2 className="font-heading text-3xl md:text-4xl font-extrabold text-background leading-tight whitespace-pre-line line-clamp-3">
                  {currentSlide.title}
                </h2>

                {hasPrice ? (
                  <motion.div
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="mt-4"
                  >
                    {currentSlide.originalPrice && (
                      <p className="text-background/60 line-through text-lg font-medium">
                        De R$ {currentSlide.originalPrice.toFixed(2).replace(".", ",")}
                      </p>
                    )}
                    <div className="flex items-baseline gap-1 mt-1">
                      <span className="text-background/80 text-xl font-bold">Por</span>
                      <span className="text-accent font-heading text-2xl font-extrabold">R$</span>
                      <span className="text-accent font-heading text-7xl md:text-8xl font-black leading-none tracking-tight">
                        {formatPrice(currentSlide.price!).reais}
                      </span>
                      <span className="text-accent font-heading text-3xl md:text-4xl font-extrabold self-start mt-1">
                        ,{formatPrice(currentSlide.price!).cents}
                      </span>
                    </div>
                    <p className="text-background/70 text-sm mt-1">
                      ou 3x de R$ {(currentSlide.price! / 3).toFixed(2).replace(".", ",")} <span className="text-accent font-bold">Sem juros</span>
                    </p>
                  </motion.div>
                ) : (
                  currentSlide.subtitle && (
                    <p className="mt-3 text-lg text-background/80 max-w-md">
                      {currentSlide.subtitle}
                    </p>
                  )
                )}

                <button
                  onClick={() => {
                    if (currentSlide.isExternal) {
                      window.open(currentSlide.ctaLink, '_blank');
                    } else {
                      navigate(currentSlide.ctaLink);
                    }
                  }}
                  className="mt-6 rounded-lg bg-primary px-10 py-3.5 font-heading font-extrabold text-primary-foreground text-lg uppercase tracking-wide hover:opacity-90 transition-opacity shadow-xl"
                >
                  {currentSlide.cta}
                </button>
              </motion.div>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Controls */}
      <button onClick={prev} className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background hover:bg-background/40 transition-colors backdrop-blur-sm">
        <ChevronLeft className="h-6 w-6" />
      </button>
      <button onClick={next} className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-background/20 p-2 text-background hover:bg-background/40 transition-colors backdrop-blur-sm">
        <ChevronRight className="h-6 w-6" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
        {slides.map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrent(i)}
            className={`transition-all duration-300 rounded-full ${
              i === current ? "bg-primary w-8 h-3" : "bg-background/50 w-3 h-3"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
