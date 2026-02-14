import ProductCard from "./ProductCard";

const products = [
  {
    name: "Filtro de Óleo para Gerador Diesel 50kVA",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop",
    price: 89.90,
    oldPrice: 119.90,
    installments: "ou 3x de R$ 29,97 sem juros",
  },
  {
    name: "Vela de Ignição para Gerador a Gasolina",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
    price: 35.90,
    installments: "ou 2x de R$ 17,95 sem juros",
  },
  {
    name: "Regulador de Tensão AVR Universal",
    image: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400&h=400&fit=crop",
    price: 259.90,
    oldPrice: 329.90,
    installments: "ou 3x de R$ 86,63 sem juros",
  },
  {
    name: "Kit Manutenção Preventiva Gerador 100kVA",
    image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?w=400&h=400&fit=crop",
    price: 549.90,
    installments: "ou 3x de R$ 183,30 sem juros",
  },
  {
    name: "Bomba Injetora Diesel - Remanufaturada",
    image: "https://images.unsplash.com/photo-1565043666747-69f6646db940?w=400&h=400&fit=crop",
    price: 1299.90,
    oldPrice: 1599.90,
    installments: "ou 3x de R$ 433,30 sem juros",
  },
  {
    name: "Filtro de Ar para Gerador Diesel Industrial",
    image: "https://images.unsplash.com/photo-1558618666-fcd25c85f82e?w=400&h=400&fit=crop",
    price: 129.90,
    installments: "ou 3x de R$ 43,30 sem juros",
  },
  {
    name: "Correia Dentada para Motor Diesel",
    image: "https://images.unsplash.com/photo-1635070041078-e363dbe005cb?w=400&h=400&fit=crop",
    price: 79.90,
    installments: "ou 2x de R$ 39,95 sem juros",
  },
  {
    name: "Painel de Comando Digital para Gerador",
    image: "https://images.unsplash.com/photo-1597852074816-d933c7d2b988?w=400&h=400&fit=crop",
    price: 1890.00,
    oldPrice: 2290.00,
    installments: "ou 3x de R$ 630,00 sem juros",
  },
];

const FeaturedProducts = () => {
  return (
    <section className="py-12">
      <div className="container">
        <h2 className="font-heading text-2xl font-extrabold text-foreground text-center mb-8 uppercase tracking-wide">
          Destaques
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map((p, i) => (
            <ProductCard key={i} {...p} />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
