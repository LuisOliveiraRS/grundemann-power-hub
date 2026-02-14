import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import banner1 from "@/assets/banner-1.jpg";
import banner2 from "@/assets/banner-2.jpg";
import banner3 from "@/assets/banner-3.jpg";

const slides = [
  {
    image: banner1,
    title: "Geradores Diesel\nde Alta Potência",
    subtitle: "Soluções completas para sua empresa",
    cta: "Confira",
  },
  {
    image: banner2,
    title: "Peças e\nComponentes",
    subtitle: "Originais e de alta qualidade",
    cta: "Ver Peças",
  },
  {
    image: banner3,
    title: "Manutenção\nPreventiva",
    subtitle: "Equipe técnica especializada",
    cta: "Agendar Serviço",
  },
];

const HeroBanner = () => {
  const [current, setCurrent] = useState(0);

  const next = useCallback(() => setCurrent((c) => (c + 1) % slides.length), []);
  const prev = () => setCurrent((c) => (c - 1 + slides.length) % slides.length);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

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
            src={slides[current].image}
            alt={slides[current].title}
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-foreground/80 via-foreground/40 to-transparent" />
          <div className="absolute inset-0 flex items-center">
            <div className="container">
              <motion.div
                initial={{ y: 30, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.5 }}
                className="max-w-lg"
              >
                <h2 className="font-heading text-4xl md:text-5xl font-extrabold text-background leading-tight whitespace-pre-line">
                  {slides[current].title}
                </h2>
                <p className="mt-3 text-lg text-background/80">
                  {slides[current].subtitle}
                </p>
                <button className="mt-6 rounded-lg bg-primary px-8 py-3 font-heading font-bold text-primary-foreground text-lg hover:opacity-90 transition-opacity">
                  {slides[current].cta}
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
            className={`h-3 w-3 rounded-full transition-colors ${
              i === current ? "bg-primary" : "bg-background/50"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroBanner;
