import { ShoppingCart } from "lucide-react";

interface ProductCardProps {
  name: string;
  image: string;
  price: number;
  oldPrice?: number;
  installments?: string;
}

const ProductCard = ({ name, image, price, oldPrice, installments }: ProductCardProps) => {
  return (
    <div className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow">
      <div className="relative aspect-square overflow-hidden bg-muted">
        <img
          src={image}
          alt={name}
          className="h-full w-full object-contain p-4 group-hover:scale-105 transition-transform duration-300"
        />
        {oldPrice && (
          <span className="absolute top-2 left-2 rounded bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">
            OFERTA
          </span>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-heading text-sm font-semibold text-card-foreground line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>
        {oldPrice && (
          <p className="mt-2 text-xs text-muted-foreground line-through">
            R$ {oldPrice.toFixed(2).replace(".", ",")}
          </p>
        )}
        <p className="mt-1 font-heading text-xl font-extrabold text-price">
          R$ {price.toFixed(2).replace(".", ",")}
        </p>
        {installments && (
          <p className="text-xs text-muted-foreground">{installments}</p>
        )}
        <button className="mt-3 flex w-full items-center justify-center gap-2 rounded-md bg-primary py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 transition-opacity">
          <ShoppingCart className="h-4 w-4" />
          Comprar
        </button>
      </div>
    </div>
  );
};

export default ProductCard;
