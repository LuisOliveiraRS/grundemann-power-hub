import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Tag, Zap } from "lucide-react";

interface Suggestion {
  type: "product" | "category";
  id: string;
  name: string;
  extra?: string;
  image?: string | null;
}

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const search = async (q: string) => {
    if (q.length < 2) { setSuggestions([]); return; }
    setLoading(true);
    const term = `%${q}%`;

    const [prodRes, catRes] = await Promise.all([
      supabase.from("products").select("id, name, sku, image_url, brand, hp, price")
        .eq("is_active", true)
        .or(`name.ilike.${term},sku.ilike.${term},brand.ilike.${term},description.ilike.${term},engine_model.ilike.${term}`)
        .limit(8),
      supabase.from("categories").select("id, name, slug")
        .ilike("name", term)
        .limit(4),
    ]);

    const results: Suggestion[] = [];
    (catRes.data || []).forEach((c: any) => results.push({ type: "category", id: c.slug, name: c.name }));
    (prodRes.data || []).forEach((p: any) => results.push({
      type: "product", id: p.id, name: p.name,
      extra: [p.sku, p.brand, p.hp ? `${p.hp}HP` : null].filter(Boolean).join(" · "),
      image: p.image_url,
    }));

    setSuggestions(results);
    setOpen(results.length > 0);
    setLoading(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      setOpen(false);
      navigate(`/produtos?busca=${encodeURIComponent(query.trim())}`);
    }
  };

  const goTo = (s: Suggestion) => {
    setOpen(false);
    setQuery("");
    if (s.type === "product") navigate(`/produto/${s.id}`);
    else navigate(`/categoria/${s.id}`);
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-xl z-[60]">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="text"
            placeholder="Buscar por nome, SKU, marca, motor..."
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {open && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-[70] overflow-hidden max-h-[400px] overflow-y-auto">
          {loading && (
            <div className="p-3 text-center text-muted-foreground text-sm">Buscando...</div>
          )}
          {suggestions.map((s, i) => (
            <button
              key={`${s.type}-${s.id}-${i}`}
              onClick={() => goTo(s)}
              className="w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0"
            >
              {s.type === "product" ? (
                s.image ? (
                  <img src={s.image} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" />
                ) : (
                  <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                )
              ) : (
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Tag className="h-5 w-5 text-primary" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{s.name}</p>
                {s.extra && <p className="text-xs text-muted-foreground truncate">{s.extra}</p>}
                {s.type === "category" && <p className="text-xs text-primary">Categoria</p>}
              </div>
              {s.type === "product" && (
                <Zap className="h-4 w-4 text-muted-foreground flex-shrink-0" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default SmartSearch;
