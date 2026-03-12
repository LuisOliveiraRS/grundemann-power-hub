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
  price?: number;
}

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
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
        .or(`name.ilike.${term},sku.ilike.${term},brand.ilike.${term},description.ilike.${term},engine_model.ilike.${term},hp.ilike.${term}`)
        .order("hp", { ascending: true })
        .limit(12),
      supabase.from("categories").select("id, name, slug")
        .ilike("name", term)
        .limit(4),
    ]);

    const results: Suggestion[] = [];
    (catRes.data || []).forEach((c: any) => results.push({ type: "category", id: c.slug, name: c.name }));
    (prodRes.data || []).forEach((p: any) => results.push({
      type: "product", id: p.id, name: p.name, price: p.price,
      extra: [p.sku, p.brand, p.hp ? `${p.hp}HP` : null].filter(Boolean).join(" · "),
      image: p.image_url,
    }));

    setSuggestions(results);
    setSelectedIdx(-1);
    setOpen(results.length > 0);
    setLoading(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value), 250);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIdx(i => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIdx(i => (i - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === "Enter" && selectedIdx >= 0) {
      e.preventDefault();
      goTo(suggestions[selectedIdx]);
    }
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
    <div ref={ref} className="relative flex-1 max-w-xl z-[60]" role="combobox" aria-expanded={open} aria-haspopup="listbox">
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar por nome, SKU, marca, motor..."
            value={query}
            onChange={e => handleChange(e.target.value)}
            onFocus={() => suggestions.length > 0 && setOpen(true)}
            onKeyDown={handleKeyDown}
            className="w-full rounded-lg border border-input bg-background px-4 py-2.5 pr-12 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
            aria-label="Buscar produtos"
            aria-autocomplete="list"
            autoComplete="off"
          />
          <button type="submit" className="absolute right-1 top-1/2 -translate-y-1/2 rounded-md bg-primary p-2 text-primary-foreground hover:opacity-90 transition-opacity" aria-label="Buscar">
            <Search className="h-4 w-4" />
          </button>
        </div>
      </form>

      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-[70] overflow-hidden max-h-[400px] overflow-y-auto" role="listbox">
          {loading && (
            <li className="p-3 text-center text-muted-foreground text-sm">Buscando...</li>
          )}
          {suggestions.map((s, i) => (
            <li key={`${s.type}-${s.id}-${i}`} role="option" aria-selected={i === selectedIdx}>
              <button
                onClick={() => goTo(s)}
                className={`w-full flex items-center gap-3 px-4 py-3 hover:bg-muted/50 transition-colors text-left border-b border-border last:border-0 ${i === selectedIdx ? "bg-muted/50" : ""}`}
              >
                {s.type === "product" ? (
                  s.image ? (
                    <img src={s.image} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" loading="lazy" />
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
                  {s.type === "category" && <p className="text-xs text-primary font-medium">Ver categoria →</p>}
                </div>
                {s.type === "product" && s.price !== undefined && (
                  <span className="text-sm font-bold text-price flex-shrink-0">
                    R$ {s.price.toFixed(2).replace(".", ",")}
                  </span>
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default SmartSearch;
