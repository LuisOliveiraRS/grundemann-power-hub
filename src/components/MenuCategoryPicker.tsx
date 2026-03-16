import { useState, useEffect, useRef } from "react";
import { useMenuCategories, MenuCategoryNode } from "@/hooks/useMenuCategories";
import { ChevronRight, ChevronDown, FolderTree, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface MenuCategoryPickerProps {
  value: string;
  onChange: (id: string) => void;
  label?: string;
}

const MenuCategoryPicker = ({ value, onChange, label = "Categoria do Menu" }: MenuCategoryPickerProps) => {
  const { tree, loading, categories } = useMenuCategories(true);
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const ref = useRef<HTMLDivElement>(null);

  // Auto-expand ancestors of selected value
  useEffect(() => {
    if (value && categories.length > 0) {
      const toExpand = new Set<string>();
      let current = categories.find(c => c.id === value);
      while (current?.parent_id) {
        toExpand.add(current.parent_id);
        current = categories.find(c => c.id === current!.parent_id);
      }
      if (toExpand.size > 0) setExpanded(prev => new Set([...prev, ...toExpand]));
    }
  }, [value, categories]);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const toggle = (id: string) => {
    setExpanded(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectedName = value ? categories.find(c => c.id === value)?.name : null;

  // Build full path for display
  const getFullPath = (id: string): string => {
    const parts: string[] = [];
    let current = categories.find(c => c.id === id);
    while (current) {
      parts.unshift(current.name);
      current = current.parent_id ? categories.find(c => c.id === current!.parent_id) : undefined;
    }
    return parts.join(" > ");
  };

  const renderNode = (node: MenuCategoryNode) => {
    const isSelected = node.id === value;
    const isExpanded = expanded.has(node.id);
    const hasChildren = node.children.length > 0;

    return (
      <div key={node.id}>
        <div
          className={`flex items-center gap-1.5 py-1.5 px-2 rounded-md cursor-pointer text-sm transition-colors ${
            isSelected ? "bg-primary/10 text-primary font-semibold" : "hover:bg-muted/60"
          }`}
          style={{ paddingLeft: `${node.depth * 16 + 8}px` }}
          onClick={() => { onChange(node.id); setOpen(false); }}
        >
          {hasChildren ? (
            <button
              onClick={(e) => { e.stopPropagation(); toggle(node.id); }}
              className="p-0.5 shrink-0"
            >
              {isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" /> : <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />}
            </button>
          ) : (
            <span className="w-4.5 shrink-0" />
          )}
          <span className="flex-1 truncate">{node.name}</span>
          {isSelected && <Check className="h-3.5 w-3.5 text-primary shrink-0" />}
        </div>
        {hasChildren && isExpanded && node.children.map(child => renderNode(child))}
      </div>
    );
  };

  return (
    <div ref={ref} className="relative">
      <label className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
        <FolderTree className="h-3.5 w-3.5 text-primary" />
        {label}
      </label>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="mt-1.5 w-full h-10 border border-input rounded-md px-3 text-sm bg-background flex items-center justify-between hover:border-primary/50 transition-colors"
      >
        {selectedName ? (
          <span className="truncate text-left flex-1" title={getFullPath(value)}>
            {getFullPath(value)}
          </span>
        ) : (
          <span className="text-muted-foreground">Selecione a categoria do menu...</span>
        )}
        <ChevronDown className="h-4 w-4 text-muted-foreground shrink-0 ml-2" />
      </button>
      {value && (
        <Button
          type="button"
          size="icon"
          variant="ghost"
          className="absolute right-0 top-6 h-10 w-8"
          onClick={(e) => { e.stopPropagation(); onChange(""); }}
        >
          <X className="h-3.5 w-3.5" />
        </Button>
      )}
      {open && (
        <div className="absolute z-50 mt-1 w-full max-h-72 overflow-auto bg-popover border border-border rounded-lg shadow-lg p-1">
          {loading ? (
            <p className="text-center text-muted-foreground text-sm py-4">Carregando...</p>
          ) : tree.length === 0 ? (
            <p className="text-center text-muted-foreground text-sm py-4">Nenhuma categoria no menu.</p>
          ) : (
            tree.map(node => renderNode(node))
          )}
        </div>
      )}
    </div>
  );
};

export default MenuCategoryPicker;
