import { useNavigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, MessageCircle } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

import heroBg1 from "@/assets/hero-bg-engine-1.jpg";
import heroBg2 from "@/assets/hero-bg-engine-2.jpg";
import heroBg3 from "@/assets/hero-bg-engine-3.jpg";

const FALLBACK_BACKGROUNDS = [heroBg1, heroBg2, heroBg3];

const DEFAULT_HEADLINES = [
  { title: "Potência e\nconfiabilidade", subtitle: "Peças e motores estacionários com qualidade profissional" },
  { title: "Soluções que\ngeram resultados", subtitle: "Confiança e parceria para o crescimento do seu negócio" },
  { title: "Força e\ndurabilidade", subtitle: "Filtros, carburadores e assistência técnica especializada" },
];

const HeroKraft = () => {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [headlines, setHeadlines] = useState(DEFAULT_HEADLINES);
  const [backgrounds, setBackgrounds] = useState<string[]>(FALLBACK_BACKGROUNDS);

  useEffect(() => {
    Promise.all([
      supabase.from("hero_headlines").select("title, subtitle").eq("is_active", true).order("display_order"),
      supabase.from("hero_backgrounds").select("image_url").eq("is_active", true).order("display_order"),
    ]).then(([headRes, bgRes]) => {
      if (headRes.data && headRes.data.length > 0) {
        setHeadlines(headRes.data.map((h) => ({ title: h.title, subtitle: h.subtitle })));
      }
      if (bgRes.data && bgRes.data.length > 0) {
        setBackgrounds(bgRes.data.map((b) => b.image_url));
      }
    });
  }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setIndex((prev) => (prev + 1) % headlines.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [headlines.length]);

  const bgImage = backgrounds[index % backgrounds.length];

  return (
    <section className="relative w-full h-[85vh] min-h-[500px] max-h-[800px] overflow-hidden">
      {/* Background images with crossfade */}
      <AnimatePresence mode="wait">
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: `url(${bgImage})` }}
        />
      </AnimatePresence>

      {/* Reduced overlay for more visible backgrounds */}
      <div className="absolute inset-0 bg-gradient-to-r from-[hsl(var(--secondary))]/80 via-[hsl(var(--secondary))]/50 to-[hsl(var(--secondary))]/15" />
      <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-[hsl(var(--secondary))]/20" />
      <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-t from-background to-transparent" />

      {/* Content */}
      <div className="relative z-10 h-full container flex items-center">
        <div className="max-w-2xl">
          <AnimatePresence mode="wait">
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -30 }}
              transition={{ duration: 0.6 }}
            >
              <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-black leading-[1.05] tracking-tight text-white whitespace-pre-line">
                {headlines[index]?.title}
              </h1>
              <p className="mt-4 text-lg md:text-xl text-white/70 max-w-lg">
                {headlines[index]?.subtitle}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap gap-4">
            <button
              onClick={() => navigate("/produtos")}
              className="group flex items-center gap-3 rounded-lg bg-primary px-8 py-4 font-heading font-extrabold text-primary-foreground text-sm uppercase tracking-wide hover:bg-primary/90 transition-all shadow-xl shadow-primary/30"
            >
              Ver Produtos
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="https://wa.me/5551981825748?text=Olá, gostaria de falar com um especialista Grundemann."
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-3 rounded-lg border-2 border-white/30 bg-white/5 backdrop-blur-sm px-8 py-4 font-heading font-extrabold text-white text-sm uppercase tracking-wide hover:bg-white/10 transition-all"
            >
              <MessageCircle className="h-4 w-4" />
              Fale Conosco
            </a>
          </div>

          {/* Trust signals */}
          <div className="mt-8 flex flex-wrap gap-6 text-white/50 text-xs font-medium">
            <span>✓ Envio para todo Brasil</span>
            <span>✓ Garantia de qualidade</span>
            <span>✓ Suporte técnico especializado</span>
          </div>
        </div>
      </div>

      {/* Slide indicators */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-20 flex gap-2">
        {headlines.map((_, i) => (
          <button
            key={i}
            onClick={() => setIndex(i)}
            className={`h-1 rounded-full transition-all duration-500 ${
              i === index ? "w-8 bg-primary" : "w-3 bg-white/30"
            }`}
          />
        ))}
      </div>
    </section>
  );
};

export default HeroKraft;
