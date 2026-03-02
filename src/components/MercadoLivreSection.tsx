import { motion } from "framer-motion";
import { ExternalLink, Star, Truck } from "lucide-react";
import mlFiltro13hp from "@/assets/ml-filtro-ar-13hp.webp";
import mlCarburador from "@/assets/ml-carburador.webp";
import mlFiltro8hp from "@/assets/ml-filtro-ar-8hp.webp";

export const mlProducts = [
  {
    image: mlFiltro13hp,
    title: "Filtro De Ar Motor Gasolina 13hp 15hp",
    subtitle: "Branco Buffalo Toyama",
    price: 79,
    rating: 4.8,
    reviews: 26,
    freeShipping: true,
    link: "https://www.mercadolivre.com.br/filtro-de-ar-motor-gasolina-13hp-15hp-branco-buffalo-toyama/p/MLB23326643",
  },
  {
    image: mlCarburador,
    title: "Carburador Para Geradores 2500w 3000w",
    subtitle: "Com Motor 5,5hp 6,5hp",
    price: 128.79,
    rating: null,
    reviews: 0,
    freeShipping: true,
    link: "https://www.mercadolivre.com.br/carburador-para-geradores-2500w-3000w-com-motor-55hp-65hp/p/MLB47832188",
  },
  {
    image: mlFiltro8hp,
    title: "Elemento Filtro De Ar Motor 8hp E 9hp",
    subtitle: "Branco Buffalo Toyama",
    price: 59,
    rating: null,
    reviews: 0,
    freeShipping: true,
    link: "https://produto.mercadolivre.com.br/MLB-4497730003-elemento-filtro-de-ar-motor-8hp-e-9hp-branco-buffalo-toyama-_JM",
  },
];

const formatPrice = (value: number) => {
  const [reais, cents] = value.toFixed(2).split(".");
  return { reais, cents };
};

const MercadoLivreSection = () => {
  return (
    <section className="relative py-16 md:py-20 overflow-hidden">
      {/* Parallax background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-accent/10 via-muted/40 to-primary/5 -z-10"
        initial={{ y: 0 }}
        whileInView={{ y: -30 }}
        viewport={{ once: false, amount: 0.1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
      />
      <motion.div
        className="absolute -top-20 -right-20 w-72 h-72 rounded-full bg-accent/10 blur-3xl -z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1 }}
      />
      <motion.div
        className="absolute -bottom-20 -left-20 w-60 h-60 rounded-full bg-primary/10 blur-3xl -z-10"
        initial={{ scale: 0.8, opacity: 0 }}
        whileInView={{ scale: 1, opacity: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1, delay: 0.3 }}
      />

      <div className="container px-4 sm:px-6">
        {/* Header */}
        <motion.div
          className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
        >
          <div>
            <span className="inline-block bg-accent/20 text-accent-foreground text-xs font-bold uppercase tracking-widest px-3 py-1 rounded-full mb-3">
              Loja Oficial
            </span>
            <h2 className="font-heading text-2xl sm:text-3xl md:text-4xl font-extrabold text-foreground leading-tight">
              Nossos Produtos no{" "}
              <span className="text-accent-foreground bg-accent px-2 py-0.5 rounded-md inline-block">
                Mercado Livre
              </span>
            </h2>
            <p className="text-muted-foreground mt-2 text-sm sm:text-base max-w-lg">
              Compre com segurança · Frete grátis na primeira compra · Compra garantida
            </p>
          </div>
          <a
            href="https://www.mercadolivre.com.br/pagina/grundemann"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-2 rounded-lg bg-accent px-5 py-2.5 font-bold text-accent-foreground text-sm hover:brightness-105 transition-all shadow-md hover:shadow-lg whitespace-nowrap"
          >
            Ver loja completa
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>

        {/* Cards grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-7">
          {mlProducts.map((product, index) => (
            <motion.a
              key={index}
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-50px" }}
              transition={{ delay: index * 0.12, duration: 0.5, ease: "easeOut" }}
              whileHover={{ y: -8, scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="group relative bg-card rounded-2xl border border-border shadow-sm hover:shadow-2xl transition-shadow duration-400 overflow-hidden"
            >
              {/* Hover glow */}
              <div className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none bg-gradient-to-br from-accent/5 via-transparent to-primary/5" />

              {/* Image */}
              <div className="relative aspect-[4/3] sm:aspect-square bg-background p-4 sm:p-6 flex items-center justify-center overflow-hidden">
                <motion.img
                  src={product.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain"
                  whileHover={{ scale: 1.1, rotate: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                />
                {product.freeShipping && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-primary text-primary-foreground text-[11px] font-bold px-2.5 py-1 rounded-full shadow-md">
                    <Truck className="h-3 w-3" />
                    Frete Grátis
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-4 sm:p-5 border-t border-border">
                <h3 className="font-heading font-bold text-card-foreground text-sm sm:text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors duration-200">
                  {product.title}
                </h3>
                <p className="text-muted-foreground text-xs sm:text-sm mt-1">{product.subtitle}</p>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="h-3.5 w-3.5 sm:h-4 sm:w-4 fill-accent text-accent" />
                    <span className="text-xs sm:text-sm font-semibold text-card-foreground">{product.rating}</span>
                    <span className="text-[11px] sm:text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-muted-foreground text-xs sm:text-sm">R$</span>
                  <span className="font-heading text-2xl sm:text-3xl font-black text-card-foreground">
                    {formatPrice(product.price).reais}
                  </span>
                  <span className="font-heading text-base sm:text-lg font-bold text-card-foreground">
                    ,{formatPrice(product.price).cents}
                  </span>
                </div>
                <p className="text-[11px] sm:text-xs text-muted-foreground mt-1">
                  ou 3x de R$ {(product.price / 3).toFixed(2).replace(".", ",")} sem juros
                </p>

                {/* CTA */}
                <motion.div
                  className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-accent py-2.5 font-bold text-accent-foreground text-xs sm:text-sm shadow-sm"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                >
                  Comprar no Mercado Livre
                  <ExternalLink className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                </motion.div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Mobile link */}
        <motion.div
          className="mt-8 sm:hidden text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
        >
          <a
            href="https://www.mercadolivre.com.br/pagina/grundemann"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-accent px-6 py-3 font-bold text-accent-foreground text-sm shadow-md"
          >
            Ver loja completa no Mercado Livre
            <ExternalLink className="h-4 w-4" />
          </a>
        </motion.div>
      </div>
    </section>
  );
};

export default MercadoLivreSection;
