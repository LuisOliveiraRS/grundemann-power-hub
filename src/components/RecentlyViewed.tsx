import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Package } from "lucide-react";

interface ViewedProduct {
  id: string;
  name: string;
  price: number;
  image_url: string | null;
}

const STORAGE_KEY = "recently_viewed";
const MAX_ITEMS = 6;

export const addToRecentlyViewed = (product: ViewedProduct) => {
  try {
    const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as ViewedProduct[];
    const filtered = stored.filter(p => p.id !== product.id);
    filtered.unshift(product);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered.slice(0, MAX_ITEMS)));
  } catch {}
};

const RecentlyViewed = () => {
  const [products, setProducts] = useState<ViewedProduct[]>([]);
  const navigate = useNavigate();

  useEffect(() => {
    try {
      const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]") as ViewedProduct[];
      setProducts(stored);
    } catch {}
  }, []);

  if (products.length < 2) return null;

  return (
    <section className="py-10 border-t border-border">
      <div className="container">
        <h2 className="font-heading text-xl font-bold mb-5">Vistos Recentemente</h2>
        <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
          {products.map(p => (
            <div
              key={p.id}
              onClick={() => navigate(`/produto/${p.id}`)}
              className="flex-shrink-0 w-36 cursor-pointer group"
            >
              <div className="aspect-square rounded-lg bg-muted border border-border overflow-hidden mb-2 flex items-center justify-center">
                {p.image_url ? (
                  <img src={p.image_url} alt={p.name} className="max-h-full max-w-full object-contain p-2 group-hover:scale-105 transition-transform" loading="lazy" />
                ) : (
                  <Package className="h-8 w-8 text-muted-foreground" />
                )}
              </div>
              <p className="text-xs font-medium line-clamp-2">{p.name}</p>
              <p className="text-sm font-bold text-price">R$ {p.price.toFixed(2).replace(".", ",")}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default RecentlyViewed;
