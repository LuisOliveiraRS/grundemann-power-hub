import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface MenuCat {
  id: string;
  name: string;
}

interface ProductFiltersProps {
  search: string;
  onSearchChange: (v: string) => void;
  catFilter: string;
  onCatFilterChange: (v: string) => void;
  statusFilter: string;
  onStatusFilterChange: (v: string) => void;
  stockFilter: string;
  onStockFilterChange: (v: string) => void;
  menuCategories: MenuCat[];
  categories?: any[]; // backward compat
  onClear: () => void;
}

const ProductFilters = ({ search, onSearchChange, catFilter, onCatFilterChange, statusFilter, onStatusFilterChange, stockFilter, onStockFilterChange, menuCategories, onClear }: ProductFiltersProps) => {
  const hasFilters = search || catFilter || statusFilter || stockFilter;

  return (
    <div className="bg-card rounded-xl border border-border p-4 mb-4">
      <div className="flex items-center gap-2 mb-3 text-sm font-semibold text-muted-foreground"><SlidersHorizontal className="h-4 w-4" /> Filtros</div>
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input className="pl-9" placeholder="Buscar por nome ou SKU..." value={search} onChange={(e) => onSearchChange(e.target.value)} />
        </div>
        <select className="h-10 border border-input rounded-md px-3 text-sm bg-background min-w-[160px]" value={catFilter} onChange={(e) => onCatFilterChange(e.target.value)}>
          <option value="">Todas as categorias</option>
          {menuCategories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
        </select>
        <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={statusFilter} onChange={(e) => onStatusFilterChange(e.target.value)}>
          <option value="">Todos os status</option>
          <option value="active">Ativos</option>
          <option value="inactive">Inativos</option>
          <option value="featured">Em Destaque</option>
          <option value="no-image">Sem Imagem</option>
        </select>
        <select className="h-10 border border-input rounded-md px-3 text-sm bg-background" value={stockFilter} onChange={(e) => onStockFilterChange(e.target.value)}>
          <option value="">Qualquer estoque</option>
          <option value="out">Sem estoque</option>
          <option value="low">Estoque baixo (≤5)</option>
          <option value="ok">Estoque ok</option>
        </select>
        {hasFilters && (
          <Button variant="ghost" size="sm" onClick={onClear}><X className="h-4 w-4 mr-1" /> Limpar</Button>
        )}
      </div>
    </div>
  );
};

export default ProductFilters;
