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
    <section className="py-12 bg-muted/30">
      <div className="container">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="font-heading text-2xl md:text-3xl font-extrabold text-foreground">
              Nossos Produtos no Mercado Livre
            </h2>
            <p className="text-muted-foreground mt-1">
              Compre com segurança pelo Mercado Livre · Frete grátis na primeira compra
            </p>
          </div>
          <a
            href="https://www.mercadolivre.com.br/pagina/grundemann"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:inline-flex items-center gap-2 rounded-lg bg-[hsl(50,100%,50%)] px-5 py-2.5 font-bold text-foreground text-sm hover:opacity-90 transition-opacity shadow"
          >
            Ver loja completa
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {mlProducts.map((product, index) => (
            <motion.a
              key={index}
              href={product.link}
              target="_blank"
              rel="noopener noreferrer"
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: index * 0.1, duration: 0.4 }}
              className="group bg-background rounded-xl border border-border shadow-sm hover:shadow-lg transition-all duration-300 overflow-hidden"
            >
              {/* Image */}
              <div className="relative aspect-square bg-background p-6 flex items-center justify-center overflow-hidden">
                <img
                  src={product.image}
                  alt={product.title}
                  className="max-h-full max-w-full object-contain group-hover:scale-105 transition-transform duration-300"
                />
                {product.freeShipping && (
                  <span className="absolute top-3 left-3 inline-flex items-center gap-1 bg-green-500 text-white text-xs font-bold px-2.5 py-1 rounded-full">
                    <Truck className="h-3 w-3" />
                    Frete Grátis
                  </span>
                )}
              </div>

              {/* Info */}
              <div className="p-5 border-t border-border">
                <h3 className="font-heading font-bold text-foreground text-base leading-tight line-clamp-2 group-hover:text-primary transition-colors">
                  {product.title}
                </h3>
                <p className="text-muted-foreground text-sm mt-1">{product.subtitle}</p>

                {/* Rating */}
                {product.rating && (
                  <div className="flex items-center gap-1.5 mt-2">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="text-sm font-semibold text-foreground">{product.rating}</span>
                    <span className="text-xs text-muted-foreground">({product.reviews})</span>
                  </div>
                )}

                {/* Price */}
                <div className="mt-3 flex items-baseline gap-1">
                  <span className="text-muted-foreground text-sm">R$</span>
                  <span className="font-heading text-3xl font-black text-foreground">
                    {formatPrice(product.price).reais}
                  </span>
                  <span className="font-heading text-lg font-bold text-foreground">
                    ,{formatPrice(product.price).cents}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  ou 3x de R$ {(product.price / 3).toFixed(2).replace(".", ",")} sem juros
                </p>

                {/* CTA */}
                <div className="mt-4 flex items-center justify-center gap-2 rounded-lg bg-[hsl(50,100%,50%)] py-2.5 font-bold text-foreground text-sm group-hover:opacity-90 transition-opacity">
                  Comprar no Mercado Livre
                  <ExternalLink className="h-4 w-4" />
                </div>
              </div>
            </motion.a>
          ))}
        </div>

        {/* Mobile link */}
        <div className="mt-6 md:hidden text-center">
          <a
            href="https://www.mercadolivre.com.br/pagina/grundemann"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[hsl(50,100%,50%)] px-6 py-3 font-bold text-foreground text-sm"
          >
            Ver loja completa no Mercado Livre
            <ExternalLink className="h-4 w-4" />
          </a>
        </div>
      </div>
    </section>
  );
};

export default MercadoLivreSection;
