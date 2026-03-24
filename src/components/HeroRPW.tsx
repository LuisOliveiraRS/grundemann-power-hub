import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Star } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { Link } from "react-router-dom";

interface Banner {
  id: string;
  title: string | null;
  image_url: string;
  link_url: string | null;
  display_order: number;
  product_id: string | null;
  background_image_url: string | null;
  cta_text: string | null;
}

interface Product {
  id: string;
  name: string;
  price: number;
  original_price: number | null;
  image_url: string | null;
  slug: string | null;
}

const HeroRPW = () => {
  const [banners, setBanners] = useState<Banner[]>([]);
  const [products, setProducts] = useState<Record<string, Product>>({});
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    supabase
      .from("hero_banners")
      .select("*")
      .eq("is_active", true)
      .order("display_order")
      .then(async ({ data }) => {
        if (!data || data.length === 0) return;
        setBanners(data as Banner[]);

        // Fetch linked products
        const productIds = data.filter(b => b.product_id).map(b => b.product_id!);
        if (productIds.length > 0) {
          const { data: prods } = await supabase
            .from("products")
            .select("id, name, price, original_price, image_url, slug")
            .in("id", productIds);
          if (prods) {
            const map: Record<string, Product> = {};
            prods.forEach(p => { map[p.id] = p; });
            setProducts(map);
          }
        }
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
  const linkedProduct = banner.product_id ? products[banner.product_id] : null;
  const hasCompositeLayout = linkedProduct && banner.background_image_url;

  const installments = linkedProduct ? Math.min(3, Math.max(1, Math.floor(linkedProduct.price / 20))) : 3;
  const installmentValue = linkedProduct ? (linkedProduct.price / installments).toFixed(2) : "0";

  const renderSimpleBanner = () => {
    const BannerImage = () => (
      <img src={banner.image_url} alt={banner.title || "Banner"} className="w-full h-full object-cover" />
    );

    return banner.link_url ? (
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
    );
  };

  const renderCompositeBanner = () => {
    if (!linkedProduct) return renderSimpleBanner();

    const productLink = banner.link_url || (linkedProduct.slug ? `/produto/${linkedProduct.slug}` : "#");

    return (
      <div className="relative w-full h-full">
        {/* Background */}
        <img
          src={banner.background_image_url!}
          alt="Fundo"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-black/20" />

        {/* Content */}
        <div className="absolute inset-0 flex items-center">
          <div className="container mx-auto px-6 md:px-12 flex items-center justify-between gap-8">
            {/* Left: Product info */}
            <div className="flex-1 max-w-lg space-y-3">
              {/* Rating badge */}
              <div className="inline-flex items-center gap-1.5 bg-primary/90 text-primary-foreground px-3 py-1 rounded-full text-sm font-bold shadow-lg">
                <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                <span className="text-yellow-400">4.8</span>
                <span className="text-primary-foreground/80">(26)</span>
              </div>

              {/* Product name */}
              <h2 className="text-2xl md:text-3xl lg:text-4xl font-extrabold text-white leading-tight drop-shadow-lg">
                {linkedProduct.name}
              </h2>

              {/* Price */}
              <div className="space-y-0.5">
                <div className="flex items-baseline gap-2">
                  <span className="text-white/80 text-sm">Por</span>
                  <span className="text-yellow-400 text-lg font-bold">R$</span>
                  <span className="text-yellow-400 text-4xl md:text-5xl font-extrabold leading-none">
                    {Math.floor(linkedProduct.price)}
                  </span>
                  <span className="text-yellow-400 text-lg font-bold align-top">
                    ,{(linkedProduct.price % 1).toFixed(2).split(".")[1]}
                  </span>
                </div>
                <p className="text-white/70 text-sm">
                  ou {installments}x de R$ {installmentValue} <span className="text-green-400 font-semibold">Sem juros</span>
                </p>
              </div>

              {/* CTA Button */}
              {banner.cta_text && (
                productLink.startsWith("http") ? (
                  <a
                    href={productLink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg text-lg shadow-xl transition-colors"
                  >
                    {banner.cta_text}
                  </a>
                ) : (
                  <Link
                    to={productLink}
                    className="inline-block mt-2 bg-green-600 hover:bg-green-700 text-white font-bold px-8 py-3 rounded-lg text-lg shadow-xl transition-colors"
                  >
                    {banner.cta_text}
                  </Link>
                )
              )}
            </div>

            {/* Right: Product image */}
            {linkedProduct.image_url && (
              <div className="hidden md:flex flex-shrink-0 items-center justify-center">
                <div className="w-56 h-56 lg:w-72 lg:h-72 bg-white rounded-2xl shadow-2xl p-4 flex items-center justify-center">
                  <img
                    src={linkedProduct.image_url}
                    alt={linkedProduct.name}
                    className="max-w-full max-h-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

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
          {hasCompositeLayout ? renderCompositeBanner() : renderSimpleBanner()}
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
