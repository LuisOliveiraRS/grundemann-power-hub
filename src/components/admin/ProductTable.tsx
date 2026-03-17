import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Edit, Trash2, Eye, EyeOff, ImageIcon, CheckSquare, Square } from "lucide-react";
import type { Product, Category, Subcategory } from "@/types/admin";

interface ProductTableProps {
  products: Product[];
  categories: Category[];
  subcategories: Subcategory[];
  selectedProducts: Set<string>;
  onToggleSelect: (id: string) => void;
  onToggleAll: () => void;
  onEdit: (p: Product) => void;
  onDelete: (id: string) => void;
}

const ProductTable = ({ products, categories, subcategories, selectedProducts, onToggleSelect, onToggleAll, onEdit, onDelete }: ProductTableProps) => {
  const getCategoryName = (id: string | null) => categories.find(c => c.id === id)?.name || "—";
  const getSubcatName = (id: string | null) => subcategories.find(s => s.id === id)?.name || null;

  return (
    <div className="bg-card rounded-xl shadow-sm border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="p-3.5 w-10">
                <button onClick={onToggleAll} className="text-muted-foreground hover:text-foreground">
                  {selectedProducts.size === products.length && products.length > 0 ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4" />}
                </button>
              </th>
              <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Produto</th>
              <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">SKU</th>
              <th className="text-left p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Categoria</th>
              <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Preço</th>
              <th className="text-center p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Estoque</th>
              <th className="text-center p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Status</th>
              <th className="text-right p-3.5 font-semibold text-muted-foreground text-xs uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {products.map((p) => (
              <tr key={p.id} className={`hover:bg-muted/30 transition-colors ${selectedProducts.has(p.id) ? "bg-primary/5" : ""}`}>
                <td className="p-3.5">
                  <button onClick={() => onToggleSelect(p.id)}>
                    {selectedProducts.has(p.id) ? <CheckSquare className="h-4 w-4 text-primary" /> : <Square className="h-4 w-4 text-muted-foreground" />}
                  </button>
                </td>
                <td className="p-3.5">
                  <div className="flex items-center gap-3">
                    {p.image_url ? <img src={p.image_url} alt="" className="h-10 w-10 rounded-lg object-cover border border-border" /> : <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground" /></div>}
                    <div>
                      <span className="font-medium block">{p.name}</span>
                      {p.is_featured && <span className="text-[10px] text-primary font-semibold">⭐ Destaque</span>}
                      {p.subcategory_id && <span className="text-[10px] text-muted-foreground block">{getSubcatName(p.subcategory_id)}</span>}
                    </div>
                  </div>
                </td>
                <td className="p-3.5 text-muted-foreground font-mono text-xs">{p.sku || "—"}</td>
                <td className="p-3.5"><Badge variant="outline" className="font-normal">{getCategoryName(p.category_id)}</Badge></td>
                <td className="p-3.5 text-right">
                  {p.original_price && <span className="text-muted-foreground line-through text-xs block">R$ {Number(p.original_price).toFixed(2).replace(".", ",")}</span>}
                  <span className="font-bold text-price">R$ {Number(p.price).toFixed(2).replace(".", ",")}</span>
                </td>
                <td className="p-3.5 text-center"><Badge variant={p.stock_quantity === 0 ? "destructive" : p.stock_quantity <= 5 ? "secondary" : "outline"}>{p.stock_quantity}</Badge></td>
                <td className="p-3.5 text-center">{p.is_active ? <Eye className="h-4 w-4 text-primary mx-auto" /> : <EyeOff className="h-4 w-4 text-muted-foreground mx-auto" />}</td>
                <td className="p-3.5">
                  <div className="flex items-center justify-end gap-1">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => onEdit(p)}><Edit className="h-4 w-4" /></Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => onDelete(p.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </td>
              </tr>
            ))}
            {products.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-muted-foreground">Nenhum produto encontrado.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default ProductTable;
