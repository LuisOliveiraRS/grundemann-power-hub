import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
}

const HeroRPW = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(({ data }) => {
        if (data && data.length > 0) setBanners(data as Banner[]);
      });
  }, []);

  const next = useCallback(() => {
    if (banners.length === 0) return;
    setCurrent((c) => (c + 1) % banners.length);
  }, [banners.length]);

  const prev = () => {
    if (banners.length === 0) return;
    setCurrent((c) => (c - 1 + banners.length) % banners.length);
  };

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next, banners.length]);

  if (banners.length === 0) {
    return (
      <section className="w-full bg-muted">
        <div className="container py-20 text-center">
          <p className="text-muted-foreground">Nenhum banner configurado. Adicione banners no painel administrativo.</p>
        </div>
      </section>
    );
  }

  const banner = banners[current];

  const BannerImage = () => (
    <img
      src={banner.image_url}
      alt={banner.title || "Banner"}
      className="w-full h-full object-cover"
    />
  );

  return (
    <section className="relative w-full overflow-hidden bg-muted" style={{ aspectRatio: "16/5" }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={current}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {banner.link_url ? (
            banner.link_url.startsWith("http") ? (
              <a href={banner.link_url} target="_blank" rel="noopener noreferrer" className="block w-full h-full">
                <BannerImage />
              </a>
            ) : (
              <Link to={banner.link_url} className="block w-full h-full">
                <BannerImage />
              </Link>
            )
          ) : (
            <BannerImage />
          )}
        </motion.div>
      </AnimatePresence>

      {banners.length > 1 && (
        <>
          <button
            onClick={prev}
            className="absolute left-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/30 backdrop-blur-sm p-2 text-foreground hover:bg-background/60 transition-colors shadow-lg"
          >
            <ChevronLeft className="h-5 w-5" />
          </button>
          <button
            onClick={next}
            className="absolute right-3 top-1/2 -translate-y-1/2 z-10 rounded-full bg-background/30 backdrop-blur-sm p-2 text-foreground hover:bg-background/60 transition-colors shadow-lg"
          >
            <ChevronRight className="h-5 w-5" />
          </button>

          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2 z-10">
            {banners.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`transition-all duration-300 rounded-full ${
                  i === current ? "bg-primary w-8 h-3 shadow-md" : "bg-background/60 w-3 h-3"
                }`}
              />
            ))}
          </div>
        </>
      )}
    </section>
  );
};

export default HeroRPW;
