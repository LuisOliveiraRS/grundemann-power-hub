import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Search, Package, Tag, Zap, X, Stethoscope, Cpu } from "lucide-react";

interface Suggestion {
  type: "product" | "category" | "diagnostic" | "model";
  id: string;
  name: string;
  extra?: string;
  image?: string | null;
  price?: number;
  hp?: string;
  score?: number;
}

const HP_FILTERS = ["5", "7", "8", "9", "10", "13", "15", "16", "18", "20"];

const SmartSearch = () => {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(-1);
  const [activeHp, setActiveHp] = useState<string | null>(null);
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

  const search = async (q: string, hpFilter?: string | null) => {
    if (q.length < 2 && !hpFilter) { setSuggestions([]); return; }
    setLoading(true);

    const searchTerm = q.length >= 2 ? q : "";

    const [prodRes, catRes] = await Promise.all([
      supabase.rpc("fuzzy_search_products", {
        search_term: searchTerm,
        hp_filter: hpFilter || null,
        result_limit: 20,
      }),
      searchTerm.length >= 2
        ? supabase.from("menu_categories").select("id, name, slug").ilike("name", `%${searchTerm}%`).eq("is_active", true).limit(4)
        : Promise.resolve({ data: [] }),
    ]);

    const results: Suggestion[] = [];
    (catRes.data || []).forEach((c: any) => results.push({ type: "category", id: c.slug, name: c.name }));

    const prods = (prodRes.data || []) as any[];
    prods.forEach(p => results.push({
      type: "product", id: p.id, name: p.name, price: p.price,
      extra: [p.sku, p.brand, p.hp ? `${p.hp}HP` : null].filter(Boolean).join(" · "),
      image: p.image_url,
      hp: p.hp || undefined,
      score: p.similarity_score,
    }));

    setSuggestions(results);
    setSelectedIdx(-1);
    setOpen(results.length > 0);
    setLoading(false);
  };

  const handleChange = (value: string) => {
    setQuery(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => search(value, activeHp), 250);
  };

  const handleHpFilter = (hp: string) => {
    if (activeHp === hp) {
      setActiveHp(null);
      if (query.length >= 2) search(query, null);
      else { setSuggestions([]); setOpen(false); }
    } else {
      setActiveHp(hp);
      search(query || "", hp);
    }
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
      navigate(`/produtos?busca=${encodeURIComponent(query.trim())}${activeHp ? `&hp=${activeHp}` : ""}`);
    }
  };

  const goTo = (s: Suggestion) => {
    setOpen(false);
    setQuery("");
    setActiveHp(null);
    if (s.type === "product") navigate(`/produto/${s.id}`);
    else navigate(`/categoria/${s.id}`);
  };

  return (
    <div ref={ref} className="relative flex-1 max-w-xl z-[60]" role="combobox" aria-expanded={open} aria-haspopup="listbox" style={{ position: 'relative' }}>
      <form onSubmit={handleSubmit}>
        <div className="relative">
          <input
            type="search"
            placeholder="Buscar por nome, SKU, marca, motor, tags..."
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

      {/* HP Filter Chips */}
      <div className="flex items-center gap-1.5 mt-2 flex-wrap">
        <Zap className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        {HP_FILTERS.map(hp => (
          <button
            key={hp}
            onClick={() => handleHpFilter(hp)}
            className={`px-2.5 py-1 rounded-full text-[11px] font-bold border transition-all ${
              activeHp === hp
                ? "bg-primary text-primary-foreground border-primary shadow-sm"
                : "bg-card text-muted-foreground border-border hover:border-primary/50 hover:text-foreground"
            }`}
          >
            {hp}HP
          </button>
        ))}
        {activeHp && (
          <button onClick={() => { setActiveHp(null); if (query.length >= 2) search(query, null); else { setSuggestions([]); setOpen(false); } }}
            className="px-1.5 py-1 rounded-full text-[11px] text-destructive hover:bg-destructive/10 transition-colors">
            <X className="h-3 w-3" />
          </button>
        )}
      </div>

      {open && (
        <ul className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-xl z-[100] overflow-hidden max-h-[400px] overflow-y-auto" role="listbox">
          {loading && (
            <li className="p-3 text-center text-muted-foreground text-sm">Buscando...</li>
          )}
          {(() => {
            let lastHp: string | undefined = undefined;
            return suggestions.map((s, i) => {
              const showHpHeader = s.type === "product" && s.hp && s.hp !== lastHp;
              if (s.type === "product" && s.hp) lastHp = s.hp;
              return (
                <li key={`${s.type}-${s.id}-${i}`} role="option" aria-selected={i === selectedIdx}>
                  {showHpHeader && (
                    <div className="px-4 py-1.5 bg-muted/70 border-b border-border flex items-center gap-2">
                      <Zap className="h-3.5 w-3.5 text-primary" />
                      <span className="text-xs font-bold text-primary uppercase tracking-wider">Motor {s.hp}HP</span>
                    </div>
                  )}
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
              );
            });
          })()}
        </ul>
      )}
    </div>
  );
};

export default SmartSearch;
